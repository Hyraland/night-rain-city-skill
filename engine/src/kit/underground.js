// Below the street: a sunken plaza open to the rain, and a metro station (a glass pavilion on the pavement, its
// escalators down to a concourse lined with small shops and machines, the gates, the platform's screen doors and
// the track beyond). Each is built in a frame of its own: its origin where one goes down from the street, its way
// down along local -z (see kit/world.js frame()). Place them where you like, in district.build(w, kit):
//
//   kit.place({ x, z, yaw }, () => sunkenPlaza(w, { width: 26, length: 44 }));
//   kit.place(kit.beside('avenue', 300, 1), () => metro(w, { name: '地铁站 METRO' }));
//
// Words shown (a station's name, a shop's) must be among the district's horizontal words (kit/atlas.js).

import * as THREE from 'three';
import { box, panel, prism, outline, sorted } from './geometry.js';
import { CYAN, WHITE, SOFT, DIM } from './buildings.js';
import { PROG } from '../core/screens.js';
import { CURB, LAYER } from '../core/constants.js';
import { COMPACT } from './interiors.js';

const PALE = [0.9, 1.25, 1.3], WARM = [1.15, 1.25, 1.25], STRIP = [1.2, 1.35, 1.35];
const T = (hex) => new THREE.Color(hex).toArray();
// layers of rock, for the walls of what is dug into the ground: [albedo, colour]
const STRATA = [[0.75, '#c9a77a'], [0.6, '#7a7468'], [0.88, '#d8d0bf'], [0.7, '#b8794a'], [0.55, '#5f6a75']];

// The rectangle (x0..x1, z0..z1, in the current frame) as world corners: to claim it (kit.claim) so that the
// streets build round it
export const footprint = (w, x0, x1, z0, z1) => [w.toWorld(x0, z0), w.toWorld(x1, z0), w.toWorld(x1, z1), w.toWorld(x0, z1)];

// ---------------------------------------------------------------- a sunken plaza
// width across, length along (from the street's edge, z = 0, away along -z), depth down; steps across its whole
// width down from the street, then its floor: wet paving that mirrors what is above, two lines of light along it.
// Walls of layered rock, a glass rail round the top; at its far end a lower arcade of lit shop fronts with a
// screen over them; trees in round planters, benches, lamps, people under umbrellas. name: for its random numbers.
export function sunkenPlaza(w, { width = 26, length = 44, depth = 6.5, name = 'plaza', screens = true, arcade = true } = {}) {
  const Q = w.rng(name), W2 = width / 2, D = -depth;
  const n = Math.max(8, Math.round(depth / 0.27)), rise = depth / n, tread = 0.5, S = n * tread;   // the steps
  const L = Math.max(length, S + 12);
  // the holes in the ground: over the steps (no splashes there) and over the floor (open to the sky, both)
  w.hole(-W2, W2, -S, 0.01, { floor: 200, open: true });
  w.hole(-W2, W2, -L, -S, { floor: D, open: true });
  for (let i = 0; i < n; i++) {
    const top = CURB - i * rise - rise, z0 = -i * tread;
    w.props(box(-W2, W2, D, Math.max(top, D + 0.01), z0 - tread, z0), 0.72);
    if (i % 2 === 0) w.glow(box(-W2 + 0.4, W2 - 0.4, top - 0.03, top, z0 - tread - 0.02, z0 - tread + 0.02), [0.45, 0.85, 0.9]);   // (its nose, lit)
  }
  w.floor(-W2, W2, -S, 0, (x, z) => CURB + (D - CURB) * THREE.MathUtils.clamp(-z / S, 0, 1), true);
  // the floor: the ground's kind 'sunken' (wet, mirroring), its lines of light 4.2 m either side of its middle
  w.groundPiece('sunken', new THREE.PlaneGeometry(width, L - S).rotateX(-Math.PI / 2).translate(0, D, -(S + L) / 2), { local: (x, z) => [x, -z], halfRoad: 4.2 });
  w.floor(-W2, W2, -L, -S, () => D, true);
  // its walls, in layers of rock; a stone kerb and a glass rail along the top
  const wallAlong = (x0, x1, z0, z1, f) => {
    for (let y = D, k = 0; y < 0; k++) {
      const h = Math.min(Q.range(0.5, 1.0), -y), [al, hex] = STRATA[k % STRATA.length];
      w.props(box(x0, x1, y, y + h, z0, z1), al - 0.15);
      y += h;
    }
  };
  for (const f of [-1, 1]) {
    const x = f * W2, [a, b] = sorted(x, x + f * 0.5);
    wallAlong(a, b, -L, 0, f);
    w.block(a, b, -L, 0, D - 1, -0.6);
  }
  wallAlong(-W2 - 0.5, W2 + 0.5, -L - 0.5, -L, 0);
  w.block(-W2, W2, -L - 0.5, -L, D - 1, -0.6);
  // the rail round the top (not across the steps' head)
  const rail = (x0, x1, z0, z1) => {
    w.props(box(x0, x1, -0.05, CURB + 0.02, z0, z1), 0.82);
    const vertical = Math.abs(x1 - x0) < Math.abs(z1 - z0);
    const [mx0, mx1] = vertical ? [(x0 + x1) / 2 - 0.02, (x0 + x1) / 2 + 0.02] : [x0, x1], [mz0, mz1] = vertical ? [z0, z1] : [(z0 + z1) / 2 - 0.02, (z0 + z1) / 2 + 0.02];
    w.glow(box(mx0, mx1, CURB, CURB + 1.1, mz0, mz1), DIM);
    w.glow(box(mx0 - 0.02, mx1 + 0.02, CURB + 1.08, CURB + 1.12, mz0 - 0.02, mz1 + 0.02), CYAN);
    w.block(x0, x1, z0, z1, -0.5, 10);
  };
  rail(-W2 - 0.5, -W2, -L - 0.5, 0);
  rail(W2, W2 + 0.5, -L - 0.5, 0);
  rail(-W2, W2, -L - 0.5, -L);
  // at its far end: a lower arcade, lit shop fronts under a canopy, a screen over them
  if (arcade) {
    const zf = -L + 0.4, top = D + 4.2;
    w.glass(prism(outline('rect', -W2 + 1, W2 - 1, -L, zf), D, top), [2.4, 4.2, 0.95, 3], Q.next(), D, [1.8, 1e4]);
    w.props(box(-W2 + 0.5, W2 - 0.5, top, top + 0.15, zf, zf + 2.2), 0.9);
    w.glow(box(-W2 + 0.5, W2 - 0.5, top - 0.02, top, zf + 2.15, zf + 2.2), CYAN);
    w.cover(-W2 + 0.5, W2 - 0.5, zf, zf + 2.2, top);
    for (let x = -W2 + 4; x < W2 - 3; x += 6) w.emitter({ x, y: D + 2, z: zf + 0.6, nx: 0, ny: 0, nz: 1, power: 0.8, reach: 12, tint: 0.3 });
    if (screens) {
      const sw = Math.min(width - 6, 16), sh = Math.min(-D - 5.2, sw * 0.3);
      if (sh > 1) {
        const yc = top + 0.5 + sh / 2;
        w.props(box(-sw / 2 - 0.3, sw / 2 + 0.3, yc - sh / 2 - 0.3, yc + sh / 2 + 0.3, -L - 0.1, -L + 0.2), 0.45);
        const brands = w.catalog?.brandAds ?? [];
        const g = panel(sw, sh, 0, yc, -L + 0.23, 'z');
        if (brands.length) w.screenAd(g, Q.pick(brands), sw, sh, Q.next());
        else w.screen(g, PROG.RIBBONS, sw, sh, undefined, Q.next());
        w.emitter({ x: 0, y: yc, z: -L + 0.8, nx: 0, ny: 0, nz: 1, power: 1.1, reach: 30, tint: 0.6 });
        w.sight(0, yc, -L, 20);
      }
    }
  }
  // trees in round planters, benches, lamps, people
  const floorLen = L - S - 4;
  for (let k = 0; k < Math.floor(floorLen / 12); k++) {
    const z = -S - 6 - k * 12;
    for (const f of [-1, 1]) {
      const x = f * (W2 - 3.2);
      w.props(new THREE.CylinderGeometry(1.0, 1.05, 0.5, 20).translate(x, D + 0.25, z), 0.8);
      w.tree(x, D + 0.5, z, Q.range(5, 7), Q.range(1.5, 2.1), Q.chance(0.5), Q.chance(0.25));
      w.circle(x, z, 1.1, D - 1, -0.6);
      // a bench, and a lamp between the trees
      const bz = z - 5;
      if (bz > -L + 4) {
        const bx = f * (W2 - 6.5);
        w.props(box(bx - 0.25, bx + 0.25, D + 0.42, D + 0.5, bz - 1.2, bz + 1.2), 0.85);
        w.props(box(bx - 0.15, bx + 0.15, D, D + 0.42, bz - 1.0, bz + 1.0), 0.4);
        w.block(bx - 0.3, bx + 0.3, bz - 1.2, bz + 1.2, D - 1, -0.6);
        const lx = f * (W2 - 1.2);
        w.props(new THREE.CylinderGeometry(0.06, 0.09, 4.2, 8).translate(lx, D + 2.1, bz), 0.6);
        w.glow(new THREE.SphereGeometry(0.22, 12, 8).translate(lx, D + 4.3, bz), WARM);
        w.lamp(lx, D + 4.1, bz, 0.9);
      }
    }
  }
  for (let i = 0; i < Math.round(width * floorLen / 90); i++) w.person(Q.range(-W2 + 5, W2 - 5), D, Q.range(-L + 4, -S - 2), Q.range(0, 6.3), true);
  return { width, length: L, depth, steps: S, claim: [-W2 - 0.6, W2 + 0.6, -L - 0.6, 0] };
}

// ---------------------------------------------------------------- a metro station
// Its pavilion on the street at the origin (one goes in from +z), the escalators and a stair between them down
// along -z to the concourse; the concourse on along -z, wide across x: ticket machines, small shops set into its
// long walls and machines between them, columns of ads, the gates, and at its far end the platform's screen
// doors, the track in its trench beyond, running across. Options:
//   name       the station's name (one of the district's horizontal words): over the pavilion
//   signs      { gates: words over the gates, welcome: words on the pavilion's back, for those coming up }
//   shops      along its walls, in order, left wall then right: [{ kind, name }], kind one of SHOP_KINDS; name
//              (words) on its sign
//   length, width, depth (how far down its floor is)
export { SHOP_KINDS } from './interiors.js';
export function metro(w, { name = null, signs = {}, shops = [{ kind: 'florist' }, { kind: 'bakery' }, { kind: 'cafe' }, { kind: 'bookshop' }],
  length = 46, width = 22, depth = 7.2, id = 'metro' } = {}) {
  const Q = w.rng(id), H = w.rng(`${id}:goods`);
  const ip = (g, a) => w.underProps(g, a), ig = (g, rgb) => w.underGlow(g, rgb);
  const T1 = CURB, CF = -depth, CC = CF + 4.25, W2 = width / 2, run = Math.max(12, depth * 1.9);
  const EW = 3.6;                                   // the well's half width
  const c0 = -run, c1 = -run - length, gate = c0 - length * 0.55;   // the concourse, along z from c0 to c1
  const rectAt = (kind, words) => (words && w.atlas?.h(words)) || null;
  const holo = (sign) => w.holoSign(sign);

  // --- the pavilion on the street: a glass roof on slim posts over the way down, glass sides, its name over it
  w.hole(-EW, EW, -run, 0, { floor: 200, open: false });
  const roofY = 3.4, pz0 = -run - 0.6, pz1 = 1.2;
  w.props(box(-EW - 0.6, EW + 0.6, roofY, roofY + 0.18, pz0, pz1), 0.9);
  for (const x of [-EW - 0.6, EW + 0.6]) w.glow(box(x - 0.02, x + 0.02, roofY - 0.01, roofY + 0.19, pz0, pz1), CYAN);
  w.glow(box(-EW - 0.6, EW + 0.6, roofY - 0.01, roofY + 0.19, pz1 - 0.02, pz1 + 0.02), CYAN);
  for (let z = pz1 - 0.3; z > pz0; z -= 3.2) for (const x of [-EW - 0.4, EW + 0.4]) {
    w.props(box(x - 0.06, x + 0.06, CURB, roofY, z - 0.06, z + 0.06), 0.85);
  }
  for (const f of [-1, 1]) {
    const x = f * (EW + 0.4);
    w.glow(box(x - 0.015, x + 0.015, CURB + 0.1, CURB + 1.1, pz0, pz1 - 0.4), DIM);   // (glass to the waist: open above)
    w.glow(box(x - 0.025, x + 0.025, CURB + 1.08, CURB + 1.12, pz0, pz1 - 0.4), CYAN);
    w.block(...sorted(x - 0.15, x + 0.15), pz0, pz1, -0.5, 10);
  }
  w.glow(box(-EW - 0.4, EW + 0.4, CURB + 0.1, CURB + 1.1, pz0 - 0.015, pz0 + 0.015), DIM);
  w.glow(box(-EW - 0.4, EW + 0.4, CURB + 1.08, CURB + 1.12, pz0 - 0.025, pz0 + 0.025), CYAN);
  w.block(-EW - 0.4, EW + 0.4, pz0 - 0.15, pz0 + 0.15, -0.5, 10);
  w.cover(-EW - 0.6, EW + 0.6, pz0, pz1, roofY);
  w.lamp(0, roofY - 0.3, -run / 2, 0.6);
  w.emitter({ x: 0, y: 2.6, z: pz1 + 0.5, nx: 0, ny: 0, nz: 1, power: 0.6, reach: 10, tint: 0.3 });
  // its mark: a lit pylon by the way in, the line's colour on top
  w.props(box(EW + 1.2, EW + 1.8, CURB, CURB + 4.6, pz1 - 0.3, pz1 + 0.3), 0.5);
  w.glow(box(EW + 1.18, EW + 1.82, CURB + 3.6, CURB + 4.4, pz1 - 0.32, pz1 + 0.32), STRIP);
  w.glow(box(EW + 1.18, EW + 1.82, CURB + 4.6, CURB + 4.66, pz1 - 0.32, pz1 + 0.32), CYAN);
  w.block(EW + 1.1, EW + 1.9, pz1 - 0.4, pz1 + 0.4, -0.5, 10);
  if (name) holo({ x: 0, y: roofY + 0.9, z: pz1 - 0.2, text: name, back: signs.welcome ?? name, size: 1.1 });

  // --- down: two escalators and a stair between them
  const drop = T1 - CF, slope = Math.atan2(drop, run), len = Math.hypot(drop, run);
  const incl = (x0, x1, lift, thick) => new THREE.BoxGeometry(x1 - x0, thick, len).rotateX(-slope).translate((x0 + x1) / 2, (T1 + CF) / 2 + lift, -run / 2);
  for (const [x0, x1] of [[-EW + 0.2, -EW + 1.4], [EW - 1.4, EW - 0.2]]) {
    ip(incl(x0, x1, -0.45, 0.9), 0.42);
    for (let k = 0.4; k < len - 0.3; k += 0.42) {
      const u = k / len, z = -run * u, y = T1 - drop * u;
      ig(box(x0 + 0.05, x1 - 0.05, y + 0.005, y + 0.03, z - 0.02, z + 0.02), DIM);
    }
    for (const x of [x0, x1]) {
      ig(incl(x - 0.03, x + 0.03, 0.5, 0.9), DIM);
      ip(incl(x - 0.05, x + 0.05, 0.98, 0.07), 0.2);
      ig(incl(x - 0.04, x + 0.04, 0.9, 0.03), CYAN);
    }
  }
  const ns = 24, rise = drop / ns, tr = run / ns;
  for (let i = 0; i < ns; i++) {
    const top = T1 - i * rise, z0 = -i * tr;
    ip(box(-EW + 1.6, EW - 1.6, CF, top, z0 - tr, z0), 0.6);
    ig(box(-EW + 1.7, EW - 1.7, top - 0.03, top, z0 - 0.02, z0 + 0.02), DIM);
  }
  w.floor(-EW, EW, -run, 0, (x, z) => T1 - THREE.MathUtils.clamp(-z / run, 0, 1) * drop, true);
  // the well's walls, down to the concourse
  for (const f of [-1, 1]) {
    const [a, b] = sorted(f * EW, f * (EW + 0.3));
    ip(box(a, b, CF, T1 - 0.02, -run, 0.3), 0.7);
    w.block(a, b, -run, 0.3, CF - 1, -0.5);
  }
  ip(box(-EW, EW, CF, T1 - 0.02, 0.3, 0.6), 0.7);
  for (const f of [-1, 1]) ig(box(f * (EW - 0.1) - 0.02, f * (EW - 0.1) + 0.02, CF + 2.6, CF + 2.64, -run, -run * 0.5), CYAN);

  // --- the concourse
  w.floor(-W2, W2, c1, c0, () => CF, true);
  ip(box(-W2, W2, CF - 0.3, CF, c1, c0), 0.4);
  ip(box(-W2, W2, CC, CC + 0.3, c1, c0), 0.55);
  // the wall at its near end, open where the escalators come down; a great screen either side of them
  for (const [x0, x1] of [[-W2, -EW], [EW, W2]]) {
    ip(box(x0, x1, CF, CC, c0, c0 + 0.3), 0.7);
    w.block(x0, x1, c0 - 0.3, c0 + 0.3, CF - 1, CC);
    const sw = x1 - x0 - 2;
    if (sw > 2) {
      w.underScreen(panel(sw, 2.2, (x0 + x1) / 2, CF + 2.3, c0 - 0.03, '-z'), Q.pick([PROG.RIBBONS, PROG.BLOBS, PROG.VORTEX]), sw, 2.2, undefined, Q.next());
      w.emitter({ x: (x0 + x1) / 2, y: CF + 2.3, z: c0 - 0.6, nx: 0, ny: 0, nz: -1, power: 0.7, reach: 12, tint: 0.5 });
    }
  }
  ip(box(-EW, EW, CC, T1 - 0.4, c0 - 0.15, c0 + 0.15), 0.7);   // (over the foot of the escalators)
  // the ceiling's light panels in rows, and its lamps
  for (let z = c0 - 2; z > c1 + 1; z -= 3) for (let x = -W2 + 2; x < W2 - 1; x += 3) ig(box(x - 1.1, x + 1.1, CC - 0.05, CC - 0.01, z - 0.5, z + 0.5), [1.25, 1.35, 1.35]);
  for (let z = c0 - 4; z > c1 + 2; z -= 7) for (const x of [-W2 / 2, W2 / 2]) w.lamp(x, CC - 0.2, z, 0.5);
  // lines of light in the floor from the foot of the escalators to the gates and on
  for (const x of [-0.4, 0.4]) {
    ig(box(x - 0.03, x + 0.03, CF, CF + 0.015, gate + 1, c0 - 0.5), CYAN);
    ig(box(x - 0.03, x + 0.03, CF, CF + 0.015, c1 + 2, gate - 1), CYAN);
  }

  // its long walls (x = f * W2), open where a shop is set into them (openings: [z0, z1] along it)
  const longWall = (f, openings) => {
    let z = c0;
    for (const [o0, o1] of [...openings.sort((p, q) => q[1] - p[1]), [c1, c1]]) {
      if (o1 < z) {
        const [a, b] = sorted(f * W2, f * (W2 + 0.3));
        ip(box(a, b, CF, CC, o1, z), 0.7);
        w.block(a, b, o1, z, CF - 1, CC);
      }
      if (o0 < o1) { const [a, b] = sorted(f * W2, f * (W2 + 0.3)); ip(box(a, b, CC - 0.6, CC, o0, o1), 0.7); }   // the lintel
      z = o0;
    }
  };
  // ticket machines by the way in, on the left wall
  for (let i = 0; i < 4; i++) {
    const z = c0 - 2.6 - i * 1.4;
    ip(box(-W2 + 0.15, -W2 + 0.95, CF, CF + 1.9, z - 0.6, z + 0.6), 0.5);
    ig(box(-W2 + 0.95, -W2 + 0.97, CF + 1.0, CF + 1.6, z - 0.42, z + 0.42), STRIP);
  }
  w.block(-W2, -W2 + 1.1, c0 - 7.6, c0 - 1.6, CF - 1, CC);
  // the shops and the machines between them: left wall from the way in, then the right
  const slots = { [-1]: [], [1]: [] }, openings = { [-1]: [], [1]: [] };
  const SW = 5, GAP = 2.8;
  let zl = c0 - 9, zr = c0 - 3;
  shops.forEach((sh, i) => {
    const f = i % 2 === 0 ? -1 : 1;
    let z = f < 0 ? zl : zr;
    if (z - SW < c1 + 2) return;
    // (not across the gates)
    if (z > gate + 1.2 && z - SW < gate - 1.2) z = gate - 1.2;
    if (z - SW < c1 + 2) return;
    openings[f].push([z - SW, z]);
    slots[f].push({ z0: z - SW, z1: z, ...sh });
    if (f < 0) zl = z - SW - GAP; else zr = z - SW - GAP;
  });
  for (const f of [-1, 1]) longWall(f, openings[f]);
  for (const f of [-1, 1]) for (const sh of slots[f]) shop(f, sh);
  // machines in the gaps between shops: drinks, and screens of ads
  for (const f of [-1, 1]) {
    const taken = slots[f].map((s) => [s.z0 - 0.3, s.z1 + 0.3]).concat(f < 0 ? [[c0 - 7.8, c0]] : []).concat([[gate - 1.2, gate + 1.2]]);
    for (let z = c0 - 1.5; z > c1 + 2; z -= 1.3) {
      if (taken.some(([a, b]) => z + 0.65 > a && z - 0.65 < b)) continue;
      if (Q.chance(0.35)) continue;
      machine(f, z, Q.chance(0.5) ? 'vending' : 'ad');
    }
  }
  // two columns of ads in the middle
  for (const z of [c0 - length * 0.25, gate - (gate - c1) * 0.5]) {
    for (const x of [-W2 / 2, W2 / 2]) {
      ip(box(x - 0.4, x + 0.4, CF, CC, z - 0.4, z + 0.4), 0.6);
      w.circle(x, z, 0.7, CF - 1, CC);
      const brands = w.catalog?.brandAds ?? [];
      for (const [face, dz] of [['z', 0.42], ['-z', -0.42]]) {
        const g = panel(0.7, 2.6, x, CF + 1.7, z + dz, face);
        if (brands.length) w.underScreenAd(g, Q.pick(brands), 0.7, 2.6, Q.next());
        else w.underScreen(g, PROG.BLOBS, 0.7, 2.6, undefined, Q.next());
      }
    }
  }
  // the gates: a row of cabinets across, lit on top, glass flaps between them
  for (let x = -W2 + 0.9; x <= W2 - 0.9; x += 1.15) {
    ip(box(x - 0.11, x + 0.11, CF, CF + 1.0, gate - 0.8, gate + 0.8), 0.55);
    ig(box(x - 0.11, x + 0.11, CF + 1.0, CF + 1.04, gate - 0.8, gate + 0.8), CYAN);
    ig(box(x - 0.08, x + 0.08, CF + 0.75, CF + 0.95, gate + 0.8, gate + 0.82), STRIP);
    if (x + 1.15 <= W2 - 0.9) ig(box(x + 0.12, x + 1.03, CF + 0.45, CF + 0.95, gate - 0.02, gate + 0.02), DIM);
  }
  w.block(-W2, W2, gate - 0.9, gate + 0.9, CF - 1, CC);
  if (signs.gates) holo({ x: 0, y: CC - 0.75, z: gate + 1.6, text: signs.gates, size: 0.8, inside: true });
  // beyond them: benches, people waiting
  for (const x of [-4, 4]) {
    ip(box(x - 1.5, x + 1.5, CF + 0.42, CF + 0.5, c1 + 4.75, c1 + 5.25), 0.8);
    ip(box(x - 1.3, x + 1.3, CF, CF + 0.42, c1 + 4.85, c1 + 5.15), 0.4);
  }
  for (let i = 0; i < 6; i++) w.person(Q.range(-W2 + 2, W2 - 2), CF, Q.range(c1 + 2, gate - 2), Q.range(0, 6.28), false);
  for (let i = 0; i < 4; i++) w.person(Q.range(-W2 + 3, W2 - 3), CF, Q.range(gate + 2, c0 - 2), Q.range(0, 6.28), false);
  w.block(-W2, W2, c1 - 0.3, c1 + 0.3, CF - 1, CC);

  // --- the platform's screen doors at the far end, the track in its trench beyond, running across
  {
    const pz = c1 + 0.25, tw = 5.0, TF = CF - 1.3, HD = CC - 0.55, L0 = -W2 - 8, L1 = W2 + 8;
    const glassM = new THREE.MeshBasicMaterial({ color: 0x86bcd8, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    const pane = (x0, x1, y0, y1) => w.addMesh(new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, pz), glassM), LAYER.INSIDE);
    const post = (x) => ip(box(x - 0.05, x + 0.05, CF, HD, pz - 0.06, pz + 0.06), 0.75);
    ip(box(-W2, W2, HD, CC, pz - 0.12, pz + 0.12), 0.72);
    ig(box(-W2, W2, HD + 0.03, HD + 0.06, pz + 0.12, pz + 0.14), CYAN);
    ig(box(-W2 + 0.3, W2 - 0.3, CF, CF + 0.012, pz + 0.5, pz + 0.6), CYAN);
    const unit = 4.4, nU = Math.floor((width - 0.2) / unit), xs = -W2 + (width - nU * unit) / 2;
    post(-W2 + 0.05); post(W2 - 0.05);
    pane(-W2, xs, CF, HD); pane(xs + nU * unit, W2, CF, HD);
    for (let i = 0; i < nU; i++) {
      const u0 = xs + i * unit, d0 = u0 + 1.2, d1 = d0 + 2.0, u1 = u0 + unit;
      for (const x of [u0, d0, d1, u1]) post(x);
      pane(u0, d0, CF, HD); pane(d1, u1, CF, HD);
      pane(d0, d1, CF, CF + 2.3);
      ip(box(d0, d1, CF + 2.3, HD, pz - 0.04, pz + 0.04), 0.78);
      ip(box((d0 + d1) / 2 - 0.015, (d0 + d1) / 2 + 0.015, CF, CF + 2.3, pz - 0.03, pz + 0.03), 0.6);
      ig(box(d0 + 0.75, d1 - 0.75, CF + 2.4, CF + 2.48, pz + 0.13, pz + 0.15), [0.4, 1.4, 0.8]);
    }
    const t0 = c1 - 0.15, t1 = c1 - tw, mid = c1 - tw / 2;
    ip(box(L0, L1, TF - 0.2, TF, t1, t0), 0.25);
    ip(box(L0, L1, TF, CF, t0, c1 + 0.15), 0.3);
    ip(box(L0, L1, TF, CC + 0.3, t1 - 0.3, t1), 0.16);
    ip(box(L0, L1, CC, CC + 0.3, t1 - 0.3, c1), 0.12);
    for (const x of [L0, L1]) ip(box(x - 0.15, x + 0.15, TF, CC, t1, c1), 0.1);
    for (const r of [-0.72, 0.72]) ip(box(L0, L1, TF, TF + 0.17, mid + r - 0.04, mid + r + 0.04), 0.85);
    for (let x = L0 + 0.3; x < L1; x += 0.65) ip(box(x - 0.12, x + 0.12, TF, TF + 0.08, mid - 1.2, mid + 1.2), 0.35);
    for (let x = L0 + 2; x < L1 - 1; x += 3.5) ig(box(x - 0.6, x + 0.6, CC - 1.0, CC - 0.92, t1 - 0.02, t1 + 0.02), [0.7, 0.8, 0.8]);
    ig(box(L0, L1, CF + 0.55, CF + 0.59, t1 - 0.02, t1 + 0.02), DIM);
  }

  // ---------------------------------------------------------------- its shops and machines
  // A small shop set into the wall on side f, along z0..z1: its room 3.4 deep beyond the wall, a bright back
  // wall, its sign over the way in (its name in the atlas's words, or a screen of words), someone at work in it, and
  // what it sells (kind)
  function shop(f, { z0, z1, kind = 'convenience', name: label = null }) {
    const wx = f * W2, at = (d) => f * (W2 + d), out = -f * Math.PI / 2;   // (goods turned to face the concourse)
    const room = CC - 0.3 - CF;
    const bx = (b0, b1, y0, y1, d0, d1) => box(...sorted(at(d0), at(d1)), CF + y0, CF + y1, b0, b1);
    const put = (k, z, y, d, o = {}) => w.underPut(k, at(d), CF + y, z, { ...o, rot: o.rot ?? out });
    const block = (b0, b1, d0, d1) => w.block(...sorted(at(d0), at(d1)), b0, b1, CF - 1, CC);
    ip(bx(z0, z1, -0.3, 0, 0, 3.4), 0.5);
    ip(bx(z0, z1, room, room + 0.3, 0, 3.4), 0.6);
    for (const z of [z0, z1]) { ip(bx(z - 0.1, z + 0.1, 0, room, 0, 3.4), 0.7); block(z - 0.25, z + 0.25, 0, 3.4); }
    block(z0, z1, 3.35, 3.7);
    w.floor(...sorted(at(0), at(3.4)), z0, z1, () => CF, true);
    const c = { z0, z1, room, bx, put, block, at, CF, staff: [(z0 + z1) / 2 + 0.5, 2.4] };
    const backWall = (lit, albedo = 0.5) => {
      if (lit) ig(bx(z0 + 0.1, z1 - 0.1, lit[0], lit[1], 3.37, 3.4), [0.85, 0.98, 1.0]);
      ip(bx(z0 + 0.1, z1 - 0.1, 0, room, 3.4, 3.43), albedo);
      ig(bx(z0 + 0.1, z1 - 0.1, room - 0.45, room - 0.4, 3.3, 3.37), PALE);
    };
    const counter = (b0, b1) => { ip(bx(b0, b1, 0, 1.05, 1.2, 1.8), 0.55); ig(bx(b0, b1, 1.05, 1.08, 1.2, 1.8), CYAN); block(b0, b1, 1.1, 3.4); };
    Object.assign(c, { backWall, counter, H, ip, ig });
    (COMPACT[kind] ?? COMPACT.convenience)(c);
    w.person(at(c.staff[1]), CF, c.staff[0], f < 0 ? Math.PI / 2 : -Math.PI / 2, false);
    // its sign over the way in
    const sw = z1 - z0 - 0.5, face = f < 0 ? 'x' : '-x', rect = rectAt('h', label);
    if (rect) w.underScreen(panel(sw, 0.56, wx - f * 0.18, CC - 0.3, (z0 + z1) / 2, face), PROG.TEXT, sw, 0.56, rect, Q.next());
    else w.underScreen(panel(sw, 0.56, wx - f * 0.18, CC - 0.3, (z0 + z1) / 2, face), PROG.TICKER, sw, 0.56, w.atlas?.rects.h[Q.int(0, Math.max(0, (w.atlas?.rects.h.length ?? 1) - 1))], Q.next());
    w.emitter({ x: wx - f * 0.6, y: CF + 1.8, z: (z0 + z1) / 2, nx: -f, ny: 0, nz: 0, power: 0.8, reach: 10, tint: 0.2 });
    w.lamp(at(1.8), CC - 0.5, (z0 + z1) / 2, 0.35);
  }
  // a machine against the wall on side f at z: drinks (a lit window of bottles and cans, buttons, a slot) or an ad
  function machine(f, z, kind) {
    const wd = 1.1, h = 2.0, a0 = f * W2, a1 = f * (W2 - 0.8), fx = a1;
    const [x0, x1] = sorted(a0, a1), toward = -f;
    if (kind === 'vending') {
      const shell = (y0, y1) => ip(box(x0, x1, CF + y0, CF + y1, z - wd / 2, z + wd / 2), 0.85);
      shell(0, 0.62); shell(h - 0.36, h);
      ig(box(...sorted(a0 - f * 0.08, a0 - f * 0.12), CF + 0.62, CF + h - 0.36, z - wd / 2 + 0.08, z + wd / 2 - 0.22), [0.55, 0.68, 0.74]);
      for (const e of [z - wd / 2, z + wd / 2]) ip(box(x0, x1, CF + 0.62, CF + h - 0.36, e - 0.04, e + 0.04), 0.85);
      for (let k = 0; k < 6; k++) ig(box(...sorted(fx, fx + toward * 0.01), CF + 0.8 + k * 0.17, CF + 0.84 + k * 0.17, z + wd / 2 - 0.15, z + wd / 2 - 0.09), [0.5, 1.4, 0.9]);
      ip(box(...sorted(fx, fx + toward * 0.12), CF + 0.18, CF + 0.42, z - wd / 2 + 0.15, z + wd / 2 - 0.3), 0.1);
      for (const [k, y] of [0.66, 0.9, 1.14, 1.38].entries()) {
        ip(box(x0 + 0.05, x1 - 0.05, CF + y - 0.015, CF + y, z - wd / 2 + 0.08, z + wd / 2 - 0.22), 0.7);
        const kinds = [['bottle', 'can'], ['carton', 'bottle'], ['snack', 'noodle'], ['can', 'bottle', 'carton']][k];
        for (let t = z - wd / 2 + 0.13; t < z + wd / 2 - 0.3;) {
          const g = H.pick(kinds), gw = { bottle: 0.075, can: 0.072, carton: 0.082, snack: 0.165, noodle: 0.12 }[g];
          w.underPut(g, fx + f * 0.3, CF + y, t + gw / 2, { rot: toward > 0 ? Math.PI / 2 : -Math.PI / 2, tone: H.pick([0.32, 0.55, 0.8, 1.0]) });
          t += gw + 0.01;
        }
      }
    } else {
      ip(box(x0, x1, CF, CF + h, z - wd / 2, z + wd / 2), 0.45);
      const brands = w.catalog?.brandAds ?? [];
      const g = panel(wd - 0.14, h * 0.8, fx + toward * 0.01, CF + h - h * 0.4 - 0.08, z, toward > 0 ? 'x' : '-x');
      if (brands.length && Q.chance(0.6)) w.underScreenAd(g, Q.pick(brands), wd - 0.14, h * 0.8, Q.next());
      else w.underScreen(g, Q.pick([PROG.BLOBS, PROG.CELLS, PROG.GLYPHS]), wd - 0.14, h * 0.8, undefined, Q.next());
    }
    ig(box(x0, x1, CF + h, CF + h + 0.04, z - wd / 2, z + wd / 2), CYAN);
    w.block(x0, x1, z - wd / 2, z + wd / 2, CF - 1, CC);
    w.emitter({ x: fx + toward * 0.3, y: CF + h * 0.6, z, nx: toward, ny: 0, nz: 0, power: 0.45, reach: 5, tint: 0.5 });
  }
  // (what it claims on the street: its pavilion and its pylon; the rest is underground)
  return { length, width, depth, run, concourse: [c1, c0], gate, claim: [-EW - 0.8, EW + 2.0, pz0 - 0.3, pz1 + 0.5] };
}
