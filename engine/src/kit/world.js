// The world being built: everything the kit's pieces add goes through here. A piece is built in its own frame
// (a street's: along its local -z, across its local x; see frame()), and the world turns what it adds into world
// coordinates: geometry, colliders, lights, floors, what the rain may not fall under. At the end, finish() merges
// all that is static into a few meshes (by material, in lots of 100 m so what is out of view is not drawn) and
// returns what the rest of the page needs: the group to show, the lights, what one bumps into and walks on.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Bin, xzBox, box, tag, panel as panelAt } from './geometry.js';
import { makeRandom } from '../core/rand.js';
import { Goods } from '../core/goods.js';
import { glassMaterial, propsMaterial, glowMaterial, beamMaterial, groundMaterial, shared, N_HOLE } from '../core/toon.js';
import { screenMaterial } from '../core/screens.js';
import { LAYER } from '../core/constants.js';
import { makeCases } from './cases.js';

// a number for a name, to seed a piece's own random sequence (so changing one piece moves nothing else)
export function hashName(seed, name) {
  let h = 2166136261 ^ Math.floor(seed);
  for (const c of String(name)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2147483647 || 1;
}

export function createWorld({ seed = 1, atlas = null, catalog = null, reflection, statues = {}, models = {} }) {
  const bins = {
    glass: new Bin(), props: new Bin(), glow: new Bin(), drift: new Bin(), orbit: new Bin(), slide: new Bin(),
    spin: new Bin(), tide: new Bin(), pop: new Bin(), screens: new Bin(), beams: new Bin(),
  };
  // underground, drawn only from the main camera (not mirrored, no shadows) and only from near enough
  const under = { props: new Bin(), glow: new Bin(), screens: new Bin(), goods: new Goods() };
  // inside the shops along the streets: lit as rooms, drawn only from near enough (in lots of 100 m), not mirrored
  const inside = { props: new Bin(), glow: new Bin(), screens: new Bin(), goods: new Goods() };
  const ground = { road: [], pavement: [], pool: [], sunken: [] };   // geometries with aLocal (toon.js groundMaterial)
  const w = {
    seed, atlas, catalog, bins, under, ground, statues, models,   // (models: the district's own, loaded by main.js)
    lamps: [],      // { x, y, z, power }
    emitters: [],   // screens and lit fronts as lights: { x, y, z, nx, ny, nz, power, reach, tint }
    colliders: [],  // circles { x, z, r } and boxes { x0, x1, z0, z1 } (y0, y1: only stopping feet between them)
    sights: [],     // big screens worth a look: { x, y, z, r }
    trees: [],      // { x, y, z, h, r, lights, bands }
    people: [],     // people standing about: { x, y, z, rot, umbrella }
    covers: [],     // roofs over open ground: { x0, x1, z0, z1, y, room } (room: indoors under it)
    floors: [],     // ground one may walk up onto: { x0, x1, z0, z1, at(x, z), replace }
    lifts: [],      // raised ground, for the rain's splashes: { x0, x1, z0, z1, y }
    holoSigns: [],  // floating signs: { x, y, z, text, rotY, size, white, back }
    infoBoards: [], // the rain shelters' boards (kit/infoBoard.js): planes, in the world
    labels: [],     // meshes of their own (LED signs and ads with shaders of their own), already in world space
    lots: [],       // what is drawn only from near enough: { x, z, reach, refl, meshes }
    cuts: [],       // where a tower's glass is opened (a shop's front): [x0, x1, z0, z1, y0, y1]
    roads: [],      // each road as a strip: { x, z, dx, dz, halfLength, halfWidth } (for the rain's splashes, the walker)
    holes: [],      // holes in the ground (toon.js uHoles): { x, z, dx, dz, halfLength, halfWidth, floor, open, contains(x, z) }
    streets: [],    // what kit/street.js made of each street (its frame, its length, its plots)
    plots: [],      // the buildings along the streets: { street, s, zB, zA, front, top, back, info, ... }
    doors: [],      // automatic sliding doors: { x, z, leaves: [{ mesh, x, z, dir, travel }], ax, az, collider, open, top }
    goods: new Goods(),
  };

  // ---------------------------------------------------------------- frames
  // A frame: an origin (x, z) on the ground and a yaw: its local -z runs along the way the yaw looks (yaw 0:
  // toward world -z), its local +x to the right of that. Frames can be nested (a shop's inside a street's).
  let M = new THREE.Matrix4(), yaw = 0;
  const stack = [];
  const cosY = () => Math.cos(yaw), sinY = () => Math.sin(yaw);
  // run fn with the frame at (x, z) turned by a (in the current frame); returns what fn returns
  w.frame = (x, z, a, fn) => {
    stack.push([M.clone(), yaw]);
    const [wx, wz] = w.toWorld(x, z);
    yaw += a;
    M = new THREE.Matrix4().makeRotationY(yaw).setPosition(wx, 0, wz);
    try { return fn(); } finally { [M, yaw] = stack.pop(); }
  };
  // the frame along the way from (x0, z0) to (x1, z1) in world coordinates: origin at the start, local -z
  // toward the end; returns its yaw
  w.yawAlong = (x0, z0, x1, z1) => Math.atan2(-(x1 - x0), -(z1 - z0));
  w.toWorld = (x, z) => [M.elements[12] + x * cosY() + z * sinY(), M.elements[14] - x * sinY() + z * cosY()];
  w.toLocal = (wx, wz) => {
    const dx = wx - M.elements[12], dz = wz - M.elements[14];
    return [dx * cosY() - dz * sinY(), dx * sinY() + dz * cosY()];
  };
  w.dirWorld = (nx, nz) => [nx * cosY() + nz * sinY(), -nx * sinY() + nz * cosY()];
  w.yaw = () => yaw;
  w.matrix = () => M.clone();
  // a box in the frame (x0..x1, z0..z1), as an axis-aligned box in the world round it
  w.boxWorld = (x0, x1, z0, z1) => {
    const pts = [w.toWorld(x0, z0), w.toWorld(x1, z0), w.toWorld(x0, z1), w.toWorld(x1, z1)];
    return xzBox(Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1])));
  };
  const place = (g) => g.applyMatrix4(M);

  // ---------------------------------------------------------------- adding things (all in the frame)
  // albedo: how much light it gives back (0..1)
  w.props = (g, albedo) => bins.props.add(place(g), { aAlbedo: albedo });
  w.glow = (g, rgb, blink = 0) => bins.glow.add(place(g), { color: rgb, aBlink: blink });
  // win: [window width, floor height, how many rooms lit, facade kind] (toon.js glassMaterial); seed: its own;
  // base: where its ground floor is; bright: [how much brighter its rooms, up to what height]
  w.glass = (g, win, seed, base = 0, bright = [1, 0]) => bins.glass.add(place(g), { aWin: win, aSeed: seed, aBase: base, aBright: bright });
  // a light in its own colour; within asBrand(i, ...), a part of the i-th brand's (its colours turned with the
  // brand's, tuning.json caseColors: toon.js uCaseAdj)
  let brandNow = -1;
  const brandKey = () => (brandNow >= 0 ? -2 - brandNow : 0);
  w.asBrand = (i, fn) => { const was = brandNow; brandNow = i; try { return fn(); } finally { brandNow = was; } };
  w.shown = (g, rgb) => bins.glow.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey() });
  // (moving lights: their pivots given in the frame too)
  const pivot = (p) => { const [x, z] = w.toWorld(p[0], p[2]); return [x, p[1], z]; };
  w.drifting = (g, rgb, mid, phase) => bins.drift.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey(), aDrift: [...pivot(mid), phase] });
  w.orbiting = (g, rgb, [x, z], speed, phase = 0) => { const [wx, wz] = w.toWorld(x, z); return bins.orbit.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey(), aOrbit: [wx, wz, speed, phase] }); };
  w.popping = (g, rgb, pop, pop2) => bins.pop.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey(), aPop: [...pivot(pop), pop[3]], aPop2: pop2 });
  // (way: [x, z, dx, dz], a point and a direction in the frame; turned into the world's)
  const wayWorld = (v) => { const [x, z] = w.toWorld(v[0], v[1]), [dx, dz] = w.dirWorld(v[2], v[3]); return [x, z, dx, dz]; };
  // carried along a strip and round again (toon.js SLIDE): way where the strip starts and runs; along [L, u, step, turn]
  w.sliding = (g, rgb, way, along) => bins.slide.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey(), aSlide: wayWorld(way), aSlide2: along });
  // turning about an axis through a point (toon.js SPIN): spin [x, y, z, speed], axis [ax, ay, az, start], clip a way
  // (the face it is seen within), clip2 [width, bottom, top, shaded]
  w.spinning = (g, rgb, spin, axis, clip, clip2) => {
    const [sx, sz] = w.toWorld(spin[0], spin[2]), [ax, az] = w.dirWorld(axis[0], axis[2]);
    return bins.spin.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey(), aSpin: [sx, spin[1], sz, spin[3]], aAxis: [ax, axis[1], az, axis[3]], aClip: wayWorld(clip), aClip2: clip2 });
  };
  // carried by the tide (toon.js TIDE): tide [lit, level, reach, lag], clip and clip2 as spinning's
  w.tidal = (g, rgb, tide, clip, clip2) => bins.tide.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey(), aTide: tide, aClip: wayWorld(clip), aClip2: clip2 });
  w.beam = (g) => bins.beams.add(place(g), {});
  // a screen: what it shows (an entry of the catalog, or a program's plain entry), its seed, its size; rect: the
  // part of the atlas it uses (words)
  w.screenAd = (g, ad, wd, ht, seed, rect = new THREE.Vector4()) => bins.screens.add(place(g), { aScr: [ad, seed, wd, ht], aRect: [rect.x, rect.y, rect.z, rect.w] });
  w.screen = (g, prog, wd, ht, rect, seed) => w.screenAd(g, catalog ? catalog.adOf(prog) : 0, wd, ht, seed, rect);
  // a mesh of its own (built in the frame), put in the world
  w.addMesh = (m, layer = LAYER.GLOW) => { m.applyMatrix4(M); m.updateMatrixWorld(true); m.traverse((o) => o.layers.set(layer)); w.labels.push(m); return m; };
  // underground
  w.underProps = (g, albedo) => under.props.add(place(g), { aAlbedo: albedo });
  w.underGlow = (g, rgb, blink = 0) => under.glow.add(place(g), { color: rgb, aBlink: blink });
  w.underScreenAd = (g, ad, wd, ht, seed) => under.screens.add(place(g), { aScr: [ad, seed, wd, ht], aRect: [0, 0, 0, 0] });
  w.underScreen = (g, prog, wd, ht, rect, seed) => under.screens.add(place(g), { aScr: [catalog ? catalog.adOf(prog) : 0, seed, wd, ht], aRect: rect ? [rect.x, rect.y, rect.z, rect.w] : [0, 0, 0, 0] });
  // inside a shop
  w.inProps = (g, albedo) => inside.props.add(place(g), { aAlbedo: albedo });
  w.inGlow = (g, rgb, blink = 0) => inside.glow.add(place(g), { color: rgb, aBlink: blink });
  w.inShown = (g, rgb) => inside.glow.add(place(g), { color: rgb, aBlink: 0, aKey: brandKey() });
  w.inScreenAd = (g, ad, wd, ht, seed, rect = new THREE.Vector4()) => inside.screens.add(place(g), { aScr: [ad, seed, wd, ht], aRect: [rect.x, rect.y, rect.z, rect.w] });
  w.inPut = (kind, x, y, z, o = {}) => { const [wx, wz] = w.toWorld(x, z); inside.goods.put(kind, wx, y, wz, { ...o, rot: (o.rot ?? 0) + yaw }); };
  // the ground: kind 'road', 'pavement', 'pool', 'sunken'; across/along: where its points are on their own road or
  // pavement (functions of the local x, z), halfRoad: the road's half width (0: no lines of light, no gutters)
  // (index: for a road, its place among the roads, see uRoads)
  w.groundPiece = (kind, g, { local = (x, z) => [x, z], halfRoad = 0, index = 0 } = {}) => {
    const p = g.attributes.position, a = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) { const [u, v] = local(p.getX(i), p.getZ(i)); a.set([u, v, halfRoad, index], i * 4); }
    g.setAttribute('aLocal', new THREE.BufferAttribute(a, 4));
    ground[kind].push(place(g));
  };

  // ---------------------------------------------------------------- what is not drawn
  w.lamp = (x, y, z, power = 1.5) => { const [wx, wz] = w.toWorld(x, z); w.lamps.push({ x: wx, y, z: wz, power }); };
  // a light thrown from (x, y, z) toward (nx, ny, nz)
  w.emitter = ({ x, y, z, nx = 0, ny = 0, nz = 1, power = 1, reach = 20, tint = 0.3 }) => {
    const [wx, wz] = w.toWorld(x, z), [dx, dz] = w.dirWorld(nx, nz);
    w.emitters.push({ x: wx, y, z: wz, nx: dx, ny, nz: dz, power, reach, tint });
  };
  w.circle = (x, z, r, y0, y1) => { const [wx, wz] = w.toWorld(x, z); w.colliders.push({ x: wx, z: wz, r, ...(y0 !== undefined ? { y0 } : {}), ...(y1 !== undefined ? { y1 } : {}) }); };
  // a box one can't walk into (x0..x1, z0..z1 in the frame; y0, y1: only stopping feet between those heights): kept
  // turned as the frame is (its middle cx, cz, its local x axis ux, uz, its half sizes hx, hz), with the box round
  // it in the world (x0..z1) for a quick look
  w.block = (x0, x1, z0, z1, y0, y1) => {
    const [cx, cz] = w.toWorld((x0 + x1) / 2, (z0 + z1) / 2), [ux, uz] = w.dirWorld(1, 0);
    const turned = Math.abs(ux * uz) > 1e-6;
    w.colliders.push({ ...w.boxWorld(x0, x1, z0, z1), ...(turned ? { cx, cz, ux, uz, hx: Math.abs(x1 - x0) / 2, hz: Math.abs(z1 - z0) / 2 } : {}),
      ...(y0 !== undefined ? { y0 } : {}), ...(y1 !== undefined ? { y1 } : {}) });
  };
  // An automatic door across a doorway at x from z0 to z1 (in the frame), floor F to top: two glass leaves (their
  // frames and lit inner edges; the glass itself only seen by what is behind it) that slide apart along z when someone
  // comes near (main.js opens them). Closed, it is in the way.
  let doorSolid = null, doorGlow = null;
  w.door = (x, z0, z1, F, top) => {
    doorSolid ??= propsMaterial(); doorGlow ??= glowMaterial();
    const hw = (z1 - z0) / 2, h = top - F - 0.02;
    const solid = mergeGeometries([
      box(-0.03, 0.03, 0, 0.06, -hw / 2, hw / 2), box(-0.03, 0.03, h - 0.06, h, -hw / 2, hw / 2),
      box(-0.03, 0.03, 0, h, -hw / 2, -hw / 2 + 0.05), box(-0.03, 0.03, 0, h, hw / 2 - 0.05, hw / 2),
    ].map((g) => tag(g, { aAlbedo: 0.35 })));
    const [ax, az] = w.dirWorld(0, 1);
    const leaves = [-1, 1].map((dir) => {
      const leaf = new THREE.Group();
      leaf.add(new THREE.Mesh(solid, doorSolid));
      const edge = tag(box(-0.035, 0.035, 0.06, h - 0.06, -dir * (hw / 2 - 0.06) - 0.012, -dir * (hw / 2 - 0.06) + 0.012), { color: [0.9, 1.25, 1.3], aBlink: 0 });
      leaf.add(new THREE.Mesh(edge, doorGlow));
      leaf.position.set(x, F, dir < 0 ? z0 + hw / 2 : z1 - hw / 2);
      leaf.applyMatrix4(M);
      leaf.traverse((o) => { o.layers.set(LAYER.GLOW); o.frustumCulled = false; });
      return { mesh: leaf, x: leaf.position.x, z: leaf.position.z, dir, travel: hw * 0.92 };
    });
    w.block(x - 0.25, x + 0.25, z0, z1, F - 1, top);
    const [cx, cz] = w.toWorld(x, (z0 + z1) / 2);
    w.doors.push({ x: cx, z: cz, leaves, ax, az, collider: w.colliders[w.colliders.length - 1], open: 0, top });
  };
  w.sight = (x, y, z, r) => { const [wx, wz] = w.toWorld(x, z); w.sights.push({ x: wx, y, z: wz, r }); };
  w.tree = (x, y, z, h, r, lights = false, bands = false) => { const [wx, wz] = w.toWorld(x, z); w.trees.push({ x: wx, y, z: wz, h, r, lights, bands }); };
  w.person = (x, y, z, rot, umbrella = true) => { const [wx, wz] = w.toWorld(x, z); w.people.push({ x: wx, y, z: wz, rot: rot + yaw, umbrella }); };
  w.cover = (x0, x1, z0, z1, y, room = false) => w.covers.push({ ...w.boxWorld(x0, x1, z0, z1), y, room });
  w.lift = (x0, x1, z0, z1, y) => w.lifts.push({ ...w.boxWorld(x0, x1, z0, z1), y });
  w.cut = (x0, x1, z0, z1, y0 = -10, y1 = 4) => { const b = w.boxWorld(x0, x1, z0, z1); w.cuts.push([b.x0, b.x1, b.z0, b.z1, y0, y1]); };
  // ground one may walk on: at(x, z) its height (in the frame); replace: where it is, the street's own level
  // doesn't count (below the street)
  w.floor = (x0, x1, z0, z1, at, replace = false) => {
    const m = M.clone(), y = yaw, b = w.boxWorld(x0, x1, z0, z1), [lx0, lx1] = [Math.min(x0, x1), Math.max(x0, x1)], [lz0, lz1] = [Math.min(z0, z1), Math.max(z0, z1)];
    const toL = (wx, wz) => { const dx = wx - m.elements[12], dz = wz - m.elements[14]; return [dx * Math.cos(y) - dz * Math.sin(y), dx * Math.sin(y) + dz * Math.cos(y)]; };
    w.floors.push({ ...b, replace, at: (wx, wz) => { const [x, z] = toL(wx, wz); return x < lx0 || x > lx1 || z < lz0 || z > lz1 ? -Infinity : at(x, z); } });
  };
  // a board of the time and the weather (kit/infoBoard.js) on a plane built in the frame
  w.infoBoard = (g) => w.infoBoards.push(place(g));
  // a floating sign: text in the atlas's signs (set 'h'), turned to face along rotY (in the frame)
  w.holoSign = (sign) => { const [wx, wz] = w.toWorld(sign.x, sign.z); w.holoSigns.push({ ...sign, x: wx, z: wz, rotY: (sign.rotY ?? 0) + yaw }); };
  // a hole in the ground over x0..x1, z0..z1 (in the frame): floor, the height of what is at its foot (for the
  // rain's splashes; 200: steps, no one level); open: open to the sky (a sunken plaza: the rain falls in it, and
  // down in it is out of doors), or not (a way down under a roof)
  w.hole = (x0, x1, z0, z1, { floor = 200, open = false } = {}) => {
    const [x, z] = w.toWorld((x0 + x1) / 2, (z0 + z1) / 2), [dx, dz] = w.dirWorld(0, -1);
    const halfLength = Math.abs(z1 - z0) / 2, halfWidth = Math.abs(x1 - x0) / 2;
    w.holes.push({ x, z, dx, dz, halfLength, halfWidth, floor, open, contains: (px, pz) => {
      const ex = px - x, ez = pz - z;
      return Math.abs(ex * dx + ez * dz) < halfLength && Math.abs(-ex * dz + ez * dx) < halfWidth;
    } });
  };
  w.road = (x, z, dx, dz, halfLength, halfWidth) => { const [wx, wz] = w.toWorld(x, z), [ddx, ddz] = w.dirWorld(dx, dz); w.roads.push({ x: wx, z: wz, dx: ddx, dz: ddz, halfLength, halfWidth }); };
  // goods (core/goods.js) put in the frame: rot about the vertical, in it (underPut: underground, lit as indoors)
  w.put = (kind, x, y, z, o = {}) => { const [wx, wz] = w.toWorld(x, z); w.goods.put(kind, wx, y, wz, { ...o, rot: (o.rot ?? 0) + yaw }); };
  w.underPut = (kind, x, y, z, o = {}) => { const [wx, wz] = w.toWorld(x, z); under.goods.put(kind, wx, y, wz, { ...o, rot: (o.rot ?? 0) + yaw }); };

  // the brands' ad cases and the shop designs' signs (kit/cases.js), made when first asked for (the icons loaded)
  let cases = null;
  Object.defineProperty(w, 'cases', { get: () => (cases ??= makeCases(w)) });
  // a brand's ad (catalog entry ad) wd x ht centred at (x, y, z) facing face: as its case, if its brand names one
  // (brands[].case), else on a screen
  w.brandAd = (wd, ht, x, y, z, face, ad, seed) => {
    const key = catalog?.ads[ad]?.brand, i = key ? catalog.brands.findIndex((b) => b.key === key) : -1, B = i >= 0 ? { en: '', tagline: '', ...catalog.brands[i], index: i } : null;
    if (B?.case) return w.cases.brandCase(wd, ht, x, y, z, face, B, seed);
    return w.screenAd(panelAt(wd, ht, x, y, z, face), ad, wd, ht, seed);
  };
  // a piece's own random sequence, by its name (see hashName)
  w.rng = (name) => makeRandom(hashName(seed, name));

  // ---------------------------------------------------------------- the end
  w.finish = () => {
    const group = new THREE.Group();
    // the glass opened where shops are (toon.js uCuts): the first sixteen
    w.cuts.slice(0, 16).forEach((c, i) => shared.uCuts.value[i].set(...c));
    shared.uCutN.value = Math.min(w.cuts.length, 16);
    // the holes in the ground (toon.js uHoles): the first N_HOLE
    w.holes.slice(0, N_HOLE).forEach((h, i) => {
      shared.uHoles.value[i].set(h.x, h.z, h.dx, h.dz);
      shared.uHoleSize.value[i].set(h.halfLength, h.halfWidth, h.floor, h.open ? 1 : 0);
    });
    shared.uHoleN.value = Math.min(w.holes.length, N_HOLE);
    if (w.holes.length > N_HOLE) console.warn(`only ${N_HOLE} holes in the ground are cut (${w.holes.length} asked for)`);
    const add = (m) => { group.add(m); return m; };
    const lotted = (bin, mat, layer) => (bin.empty ? [] : bin.meshes(mat, layer, 100).map(add));
    const whole = (bin, mat, layer) => (bin.empty ? null : add(bin.mesh(mat, layer)));
    lotted(bins.glass, glassMaterial(), LAYER.SOLID);
    lotted(bins.props, propsMaterial(), LAYER.SOLID);
    lotted(bins.glow, glowMaterial(), LAYER.GLOW);
    for (const [k, opt] of [['drift', { drift: true }], ['orbit', { orbit: true }], ['slide', { slide: true }], ['spin', { spin: true }], ['tide', { tide: true }], ['pop', { pop: true }]]) whole(bins[k], glowMaterial(opt), LAYER.GLOW);
    if (atlas && catalog) lotted(bins.screens, screenMaterial(atlas.texture, catalog.uniforms, catalog.size), LAYER.GLOW);
    whole(bins.beams, beamMaterial(), LAYER.AIR);
    // the ground
    const KIND = { road: 0, pavement: 1, pool: 2, sunken: 3 };
    for (const [k, parts] of Object.entries(ground)) {
      if (!parts.length) continue;
      const g = parts.length === 1 ? parts[0] : mergeAll(parts);
      const m = new THREE.Mesh(g, groundMaterial(reflection, KIND[k]));
      m.layers.set(LAYER.GROUND);
      m.frustumCulled = false;
      add(m);
    }
    // underground: whole, drawn only from near enough (the pieces that made it said where: w.lots)
    const underMeshes = [];
    if (!under.props.empty) underMeshes.push(under.props.mesh(propsMaterial({ indoor: true }), LAYER.INSIDE));
    if (!under.glow.empty) underMeshes.push(under.glow.mesh(glowMaterial(), LAYER.INSIDE));
    if (!under.screens.empty && atlas && catalog) underMeshes.push(under.screens.mesh(screenMaterial(atlas.texture, catalog.uniforms, catalog.size), LAYER.INSIDE));
    underMeshes.push(...under.goods.meshes(LAYER.INSIDE, { indoor: true }));
    underMeshes.forEach(add);
    // the shops' insides, in lots: drawn from within 160 m, never in the street's mirror
    {
      const parts = [];
      if (!inside.props.empty) parts.push(...inside.props.meshes(propsMaterial({ indoor: true }), LAYER.INSIDE, 100));
      if (!inside.glow.empty) parts.push(...inside.glow.meshes(glowMaterial(), LAYER.INSIDE, 100));
      if (!inside.screens.empty && atlas && catalog) parts.push(...inside.screens.meshes(screenMaterial(atlas.texture, catalog.uniforms, catalog.size), LAYER.INSIDE, 100));
      parts.push(...inside.goods.meshes(LAYER.INSIDE, { indoor: true, chunk: 100 }));
      for (const m of parts) { add(m); w.lots.push({ x: m.userData.x ?? 0, z: m.userData.z ?? 0, reach: 160, refl: 0, meshes: [m] }); }
    }
    // the goods, in lots (each drawn from within 230 m; in the street's mirror from within 60 m)
    for (const m of w.goods.meshes(LAYER.GLOW, { indoor: false, chunk: 100 })) {
      add(m);
      w.lots.push({ x: m.userData.x ?? 0, z: m.userData.z, reach: 230, refl: 60, meshes: [m] });
    }
    for (const m of w.labels) group.add(m);
    for (const d of w.doors) for (const l of d.leaves) group.add(l.mesh);
    return {
      group, underMeshes,
      lamps: w.lamps, emitters: w.emitters, colliders: w.colliders, sights: w.sights, trees: w.trees, people: w.people,
      covers: w.covers, floors: w.floors, lifts: w.lifts, holoSigns: w.holoSigns, infoBoards: w.infoBoards, lots: w.lots, roads: w.roads,
      streets: w.streets, plots: w.plots, holes: w.holes, doors: w.doors,
    };
  };
  return w;
}

// (the ground's pieces: planes and boxes, indexed or not: all made indexed so they merge)
function mergeAll(parts) {
  return mergeGeometries(parts.map((g) => (g.index ? g : mergeVertices(g))), false);
}
