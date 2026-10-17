// The goods in the shops: bottles, cans, snacks, books, bread, flowers, umbrellas. Each kind is made once
// here and drawn as instances, one draw call a kind (and one more for the parts of it that glow), however many
// stand on the shelves. Each instance has its own tone (how light or dark it is), so a shelf of the same
// bottle can still read as many products. Placed by city.js: goods.put(kind, x, y, z, { rot, ... }).
//
// Every kind faces +z (its label, its opening), base at y = 0, sizes in metres.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { propsMaterial, glowMaterial } from './toon.js';
import { makeRandom } from './rand.js';
import { canopyGeometry, rimGeometry } from './umbrella.js';

const fill = (g, name, v) => {
  const a = Array.isArray(v) ? v : [v];
  const data = new Float32Array(g.attributes.position.count * a.length);
  for (let i = 0; i < data.length; i += a.length) data.set(a, i);
  g.setAttribute(name, new THREE.BufferAttribute(data, a.length));
  return g;
};
// a solid part (its albedo) and a glowing one (colour, may go above 1 for the bloom); all indexed, to merge
const indexed = (g) => (g.index ? g : mergeVertices(g));
const P = (g, albedo) => fill(indexed(g), 'aAlbedo', albedo);
const L = (g, rgb) => fill(fill(indexed(g), 'color', rgb), 'aBlink', 0);
const cyl = (r0, r1, h, y, n = 8, open = false) => new THREE.CylinderGeometry(r1, r0, h, n, 1, open).translate(0, y + h / 2, 0);
const cube = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);

const CYAN = [0.35, 1.5, 1.7], PALE = [0.9, 1.25, 1.3];

// A bunch of flowers in a bucket: heads of one form on stems fanned out of it, a few leaves. bed: a clump
// growing in a flower bed instead, no bucket, lower and spread wider.
function bunch(form, seed, bed = false) {
  const R = makeRandom(seed);
  const parts = bed ? [] : [P(cyl(0.1, 0.125, 0.27, 0, 10, true), 0.55)];
  const n = form === 'spike' ? 9 : 7, foot = bed ? 0 : 0.18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R.range(-0.3, 0.3);
    // (in a bed the spikes stand tall above the rest, like lupins and delphiniums)
    const lean = bed ? R.range(0.2, 0.55) * (form === 'spike' ? 0.5 : 1) : R.range(0.12, 0.32);
    const len = bed ? (form === 'spike' ? R.range(0.5, 0.8) : R.range(0.25, 0.45)) : R.range(0.42, 0.62);
    const tip = new THREE.Vector3(Math.sin(a) * Math.sin(lean) * len, foot + Math.cos(lean) * len, Math.cos(a) * Math.sin(lean) * len);
    const stem = new THREE.BoxGeometry(0.008, len, 0.008).translate(0, len / 2, 0)
      .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), lean)).translate(0, foot, 0);
    parts.push(P(stem, 0.32));
    let head;
    if (form === 'round') head = new THREE.IcosahedronGeometry(R.range(0.045, 0.06), 1);
    else if (form === 'cup') head = cyl(0.018, 0.04, 0.065, -0.02, 6, true);
    else if (form === 'star') head = new THREE.ConeGeometry(0.065, 0.07, 6, 1, true).rotateX(Math.PI).translate(0, 0.02, 0);
    else head = new THREE.ConeGeometry(bed ? 0.03 : 0.022, bed ? 0.3 : 0.2, 6).translate(0, bed ? 0.12 : 0.08, 0);   // spike
    parts.push(P(head.translate(tip.x, tip.y, tip.z), 0.95));
    const leaf = new THREE.BoxGeometry(0.05, 0.004, 0.16).translate(0, 0, 0.08).rotateX(-0.6).rotateY(a + 1.2)
      .translate(tip.x * 0.4, foot + (tip.y - foot) * 0.35, tip.z * 0.4);
    parts.push(P(leaf, 0.38));
  }
  // greenery round the rim of the bucket, or low round the clump's foot
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    parts.push(P(new THREE.BoxGeometry(0.07, 0.004, 0.17).translate(0, 0, 0.085).rotateX(bed ? -0.25 : -0.45).rotateY(a).translate(0, bed ? 0.03 : 0.27, 0), 0.4));
  }
  return { props: parts };
}

// a potted plant on the floor: fronds arching out of a pot
function fern(seed) {
  const R = makeRandom(seed);
  const parts = [P(cyl(0.15, 0.2, 0.36, 0, 12), 0.6)];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + R.range(-0.2, 0.2), len = R.range(0.35, 0.5);
    const up = new THREE.BoxGeometry(0.09, 0.005, len).translate(0, 0, len / 2).rotateX(-R.range(0.7, 1.0));
    const out = new THREE.BoxGeometry(0.07, 0.005, len * 0.8).translate(0, 0, len * 0.4).rotateX(R.range(0.1, 0.5));
    const tip = new THREE.Vector3(0, 0, len).applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.85);
    out.translate(tip.x, tip.y, tip.z);
    for (const g of [up, out]) parts.push(P(g.rotateY(a).translate(0, 0.34, 0), 0.42));
  }
  return { props: parts };
}

// a plant hung from the ceiling: its pot, the cords, trails falling from it
function hanging(seed) {
  const R = makeRandom(seed);
  const parts = [P(cyl(0.09, 0.13, 0.15, 0, 10), 0.6)];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    parts.push(P(new THREE.BoxGeometry(0.006, 0.7, 0.006).translate(Math.sin(a) * 0.12, 0.5, Math.cos(a) * 0.12), 0.3));
  }
  // trails of small leaves falling over the rim, swaying out a little as they go
  for (let i = 0; i < 10; i++) {
    const a = R.range(0, Math.PI * 2), n = R.int(4, 13), sway = R.range(-0.04, 0.04);
    for (let k = 0; k < n; k++) {
      const y = 0.13 - k * 0.065, r = 0.13 + Math.sin(k * 0.5) * 0.03, b = a + sway * k;
      const leaf = new THREE.BoxGeometry(0.045, 0.004, 0.055).rotateX(R.range(-0.9, -0.4)).rotateY(b + R.range(-0.6, 0.6))
        .translate(Math.sin(b) * r, y, Math.cos(b) * r);
      parts.push(P(leaf, 0.42));
    }
  }
  return { props: parts };
}

export const KINDS = {
  // (open where nothing shows: the most numerous kind, so every vertex counts)
  bottle: () => ({ props: [P(cyl(0.034, 0.034, 0.16, 0, 8, true), 0.8), P(cyl(0.0345, 0.0345, 0.07, 0.05, 8, true), 0.45),
    P(cyl(0.034, 0.014, 0.045, 0.16, 8, true), 0.8), P(cyl(0.015, 0.015, 0.025, 0.205, 6), 0.95)] }),
  can: () => ({ props: [P(cyl(0.033, 0.033, 0.12, 0), 0.85), P(cyl(0.0335, 0.0335, 0.05, 0.035), 0.5)] }),
  carton: () => ({ props: [P(cube(0.075, 0.19, 0.075), 0.9), P(cube(0.076, 0.07, 0.076, 0, 0.06), 0.5),
    P(cube(0.075, 0.025, 0.02, 0, 0.19), 0.9)] }),
  snack: () => ({ props: [P(cube(0.15, 0.21, 0.05), 0.9), P(cube(0.1, 0.07, 0.052, 0, 0.09), 0.45)] }),
  noodle: () => ({ props: [P(cyl(0.045, 0.055, 0.1, 0, 10), 0.92), P(cyl(0.057, 0.057, 0.006, 0.1, 10), 0.55)] }),
  // a box of 1 m: books, magazines and boxes of all sizes come from its scale
  block: () => ({ props: [P(cube(1, 1, 1), 1.0)] }),
  basket: () => ({ props: [P(cyl(0.16, 0.18, 0.11, 0, 10, true), 0.55), P(cyl(0.16, 0.16, 0.01, 0, 10), 0.45)] }),
  loaf: () => ({ props: [P(new THREE.SphereGeometry(1, 10, 6).scale(0.12, 0.065, 0.075).translate(0, 0.035, 0), 0.85),
    ...[-0.05, 0, 0.05].map((x) => P(cube(0.01, 0.008, 0.08, x, 0.09).rotateY(0.5), 0.5))] }),
  roll: () => ({ props: [P(new THREE.SphereGeometry(0.05, 8, 5).scale(1, 0.75, 1).translate(0, 0.03, 0), 0.88)] }),
  croissant: () => ({ props: [P(new THREE.TorusGeometry(0.05, 0.024, 6, 10, Math.PI * 1.15).rotateX(Math.PI / 2).rotateY(-0.5).translate(0, 0.022, 0), 0.85)] }),
  baguette: () => ({ props: [P(new THREE.CapsuleGeometry(0.028, 0.5, 3, 8).translate(0, 0.28, 0), 0.85)] }),
  cup: () => ({ props: [P(cyl(0.035, 0.045, 0.11, 0, 10), 0.95), P(cyl(0.04, 0.043, 0.04, 0.035, 10), 0.5),
    P(cyl(0.047, 0.047, 0.012, 0.11, 10), 0.55)] }),
  // a closed umbrella for sale or for hire: its rim glows, like the ones in the street
  umbrella: () => ({
    props: [P(cyl(0.006, 0.006, 0.12, 0, 4), 0.4), P(cyl(0.012, 0.046, 0.6, 0.1, 8), 0.75),
      P(new THREE.TorusGeometry(0.03, 0.008, 4, 8, Math.PI).rotateZ(Math.PI).translate(0.03, 0.74, 0), 0.3),
      P(cyl(0.008, 0.008, 0.05, 0.7, 4), 0.3)],
    glow: [L(new THREE.TorusGeometry(0.047, 0.005, 3, 12).rotateX(Math.PI / 2).translate(0, 0.66, 0), CYAN)],
  }),
  // an open one, shown off
  umbrellaOpen: () => ({
    props: [P(canopyGeometry(0.55, 0.26), 0.85), P(cyl(0.008, 0.008, 0.8, -0.6, 4), 0.4)],
    glow: [L(rimGeometry(0.55, 0.26, 0.012), CYAN)],
  }),
  // flowers: rounded heads (peonies, roses), cups (tulips), stars (lilies), spikes (delphinium, lavender)
  round: () => bunch('round', 11), cupped: () => bunch('cup', 12), star: () => bunch('star', 13), spike: () => bunch('spike', 14),
  // the same, growing in the flower beds along the street
  bedRound: () => bunch('round', 15, true), bedCupped: () => bunch('cup', 16, true), bedStar: () => bunch('star', 17, true), bedSpike: () => bunch('spike', 18, true),
  // a low mound of leaves, to fill a bed between the flowers
  leaves: () => ({ props: [0, 1, 2, 3, 4].map((i) => P(new THREE.IcosahedronGeometry(0.16, 0).scale(1, 0.6, 1)
    .translate(Math.cos(i * 1.3) * 0.13 * (i > 0), 0.07 + 0.03 * (i % 2), Math.sin(i * 1.3) * 0.13 * (i > 0)), 0.5)) }),
  fern: () => fern(21), hanging: () => hanging(22),
  // the ice-cream shop: a tub of one flavour, heaped, in the freezer; a cone in its stand
  tub: () => ({ props: [P(cyl(0.11, 0.11, 0.1, 0, 10, true), 0.85),
    P(new THREE.SphereGeometry(0.105, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1).translate(0, 0.1, 0), 0.9)] }),
  cone: () => ({ props: [P(new THREE.ConeGeometry(0.028, 0.13, 8).rotateX(Math.PI).translate(0, 0.065, 0), 0.75)] }),
  // the tea shop: a glass jar of toppings (pearls, jellies, fruit), its lid
  jar: () => ({ props: [P(cyl(0.07, 0.07, 0.2, 0, 10), 0.85), P(cyl(0.072, 0.072, 0.04, 0.2, 10), 0.6)] }),
  // the cute-goods shop: a plush kitten, sitting, ears up
  plush: () => ({ props: [P(new THREE.SphereGeometry(0.075, 10, 7).scale(1, 0.95, 0.85).translate(0, 0.07, 0), 0.92),
    P(new THREE.SphereGeometry(0.07, 10, 7).translate(0, 0.19, 0.01), 0.92),
    ...[-1, 1].map((f) => P(new THREE.ConeGeometry(0.025, 0.05, 5).translate(f * 0.042, 0.255, 0.005), 0.92)),
    ...[-1, 1].map((f) => P(new THREE.SphereGeometry(0.009, 5, 4).translate(f * 0.025, 0.2, 0.07), 0.12))] }),
  // the tea shop's cups: the tea (its own colour), a domed lid, a fat straw
  teacup: () => ({ props: [P(cyl(0.038, 0.046, 0.15, 0, 10), 0.85), P(new THREE.SphereGeometry(0.047, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 1).translate(0, 0.15, 0), 0.9),
    P(cyl(0.008, 0.008, 0.12, 0.15, 6), 0.5)] }),
  // the dessert shop: a round cake, its layers and a berry on top
  cake: () => ({ props: [P(cyl(0.11, 0.11, 0.08, 0, 14), 0.92), P(cyl(0.112, 0.112, 0.015, 0.035, 14), 0.6),
    P(new THREE.SphereGeometry(0.02, 6, 5).translate(0, 0.095, 0), 0.6)] }),
  // the noodle shop: a bowl, the noodles and broth in it
  bowl: () => ({ props: [P(new THREE.SphereGeometry(0.09, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).rotateX(Math.PI).translate(0, 0.09, 0), 0.9),
    P(cyl(0.08, 0.08, 0.005, 0.07, 12), 0.7)] }),
  // a firefly: a dot of light among the flowers
  mote: () => ({ glow: [L(new THREE.IcosahedronGeometry(0.014, 0), [0.7, 1.7, 1.8])] }),
};


export class Goods {
  constructor() { this.items = {}; }
  // rot: turn about the vertical; tilt: lean back (about x, after the turn); roll: lean sideways (about z);
  // scale: a number or [x, y, z]; tone: how light (multiplies the albedo); color: the glowing parts' colour
  put(kind, x, y, z, { rot = 0, tilt = 0, roll = 0, scale = 1, tone = 1, color = null } = {}) {
    (this.items[kind] ||= []).push({ x, y, z, rot, tilt, roll, scale, tone, color });
  }
  get count() { return Object.values(this.items).reduce((n, l) => n + l.length, 0); }
  // lift: indoors, how much brighter the room's general light (see toon.js propsMaterial); chunk: if set, in lots of chunk x chunk
  // metres, each its own mesh, culled when out of view (its centre: userData.x, userData.z)
  meshes(layer, { indoor = true, lift = 1, chunk = 0 } = {}) {
    const solid = propsMaterial({ indoor, toned: true, lift }), lit = glowMaterial();
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
    const out = [];
    for (const [kind, all] of Object.entries(this.items)) {
      const proto = KINDS[kind]();
      // (by lot, each thing keeping its number in the whole, so its colour is as it was)
      const lots = new Map();
      all.forEach((it, i) => { const k = chunk ? `${Math.floor(it.x / chunk)},${Math.floor(it.z / chunk)}` : '0,0'; if (!lots.has(k)) lots.set(k, []); lots.get(k).push(i); });
      for (const [k, idx] of lots) {
        const list = idx.map((i) => all[i]);
        const mk = (parts, material) => {
          const m = new THREE.InstancedMesh(mergeGeometries(parts), material, list.length);
          list.forEach((it, i) => {
            e.set(it.tilt, it.rot, it.roll, 'YXZ');
            m4.compose(p.set(it.x, it.y, it.z), q.setFromEuler(e), Array.isArray(it.scale) ? sc.fromArray(it.scale) : sc.setScalar(it.scale));
            m.setMatrixAt(i, m4);
          });
          m.layers.set(layer);
          if (chunk) { const [ci, ck] = k.split(',').map(Number); m.computeBoundingSphere(); m.userData.x = (ci + 0.5) * chunk; m.userData.z = (ck + 0.5) * chunk; } else m.frustumCulled = false;
          m.matrixAutoUpdate = false;
          out.push(m);
          return m;
        };
        if (proto.props) {
          const m = mk(proto.props, solid);
          m.geometry.setAttribute('aTone', new THREE.InstancedBufferAttribute(new Float32Array(list.map((it) => it.tone)), 1));
        }
        if (proto.glow) {
          const m = mk(proto.glow, lit);
          if (list.some((it) => it.color)) list.forEach((it, i) => m.setColorAt(i, it.color ? col.fromArray(it.color) : col.setRGB(1, 1, 1)));
        }
      }
    }
    return out;
  }
}
