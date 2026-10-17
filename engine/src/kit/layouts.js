// Street layouts to start from, each varied by its seed and options: { streets, route } to put into a district (and
// then change as the user likes: move, add, take away streets). Every city should have one of its own; see SKILL.md.
//
//   gridLayout({ seed, cols, rows, block, turn })        streets in a grid, its blocks of different sizes, turned
//   radialLayout({ seed, spokes, radius, ring })         streets out from a middle like spokes, a ring road round it
//   windingLayout({ seed, bends, length, sides })        a main street bending as a river would, side streets off it
//   boulevardLayout({ seed, length, sides })             one long boulevard, side streets off it at all angles
//
// Streets are straight (a bend is two streets meeting); at most 32; ids are 'main', 'side-1'...

import { makeRandom } from '../core/rand.js';

const R2 = (v) => Math.round(v * 10) / 10;
const pt = (x, z) => [R2(x), R2(z)];
const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// a grid: cols x rows streets, blocks block[0]..block[1] m apart, the whole turned by turn radians (default: random)
export function gridLayout({ seed = 1, cols = 3, rows = 3, block = [120, 200], turn = null } = {}) {
  const R = makeRandom(seed), th = turn ?? R.range(-0.6, 0.6), c = Math.cos(th), s = Math.sin(th);
  const rot = ([x, z]) => pt(x * c - z * s, x * s + z * c);
  const xs = [0], zs = [0];
  for (let i = 1; i < cols; i++) xs.push(xs[i - 1] + R.range(block[0], block[1]));
  for (let j = 1; j < rows; j++) zs.push(zs[j - 1] + R.range(block[0], block[1]));
  const W = xs[xs.length - 1], H = zs[zs.length - 1], ox = W / 2, oz = H / 2, over = 60;
  const streets = [];
  xs.forEach((x, i) => streets.push({ id: i === 0 ? 'main' : `side-${streets.length}`, from: rot([x - ox, oz + over]), to: rot([x - ox, -oz - over]), road: i === 0 ? 7 : R.pick([5, 6]) }));
  zs.forEach((z) => streets.push({ id: `side-${streets.length}`, from: rot([-ox - over, z - oz]), to: rot([ox + over, z - oz]), road: R.pick([5, 6, 7]), walk: R.pick([5, 6]) }));
  const m = streets[0];
  return { streets, route: [along(m.from, m.to, 0.05), along(m.from, m.to, 0.95)] };
}

// spokes from a middle (a square at the middle left open: a plaza), a ring road round at radius
export function radialLayout({ seed = 1, spokes = 5, radius = 300, ring = true } = {}) {
  const R = makeRandom(seed), a0 = R.range(0, Math.PI * 2), inner = 40, streets = [];
  const angles = Array.from({ length: spokes }, (_, k) => a0 + (k / spokes) * Math.PI * 2 + R.range(-0.25, 0.25));
  angles.forEach((a, k) => {
    const out = radius * R.range(1.0, 1.5);
    streets.push({ id: k === 0 ? 'main' : `side-${k}`, from: pt(Math.cos(a) * inner, Math.sin(a) * inner), to: pt(Math.cos(a) * out, Math.sin(a) * out), road: k === 0 ? 7 : R.pick([5, 6]) });
  });
  if (ring) {
    const n = Math.max(6, spokes + 1), P = Array.from({ length: n }, (_, k) => { const a = a0 + (k / n) * Math.PI * 2 + 0.3; return pt(Math.cos(a) * radius, Math.sin(a) * radius); });
    P.forEach((p, k) => streets.push({ id: `ring-${k}`, from: p, to: P[(k + 1) % n], road: 5, walk: 5 }));
  }
  const m = streets[0];
  return { streets, route: [along(m.from, m.to, 0.1), along(m.from, m.to, 0.9)] };
}

// a main street bending bends times (each part length m long, turning a little each time), sides streets off it
export function windingLayout({ seed = 1, bends = 4, length = 170, sides = 4 } = {}) {
  const R = makeRandom(seed), streets = [];
  let p = [0, 0], dir = R.range(0, Math.PI * 2);
  const parts = [];
  for (let k = 0; k <= bends; k++) {
    const q = [p[0] + Math.cos(dir) * length * R.range(0.8, 1.2), p[1] + Math.sin(dir) * length * R.range(0.8, 1.2)];
    parts.push([p, q]);
    streets.push({ id: k === 0 ? 'main' : `main-${k}`, from: pt(...p), to: pt(...q), road: 7 });
    p = q; dir += R.range(0.25, 0.55) * (R.chance(0.5) ? 1 : -1);
  }
  for (let k = 0; k < sides; k++) {
    const [a, b] = parts[R.int(0, parts.length - 1)], t = R.range(0.35, 0.65), o = along(a, b, t);
    const d = Math.atan2(b[1] - a[1], b[0] - a[0]) + (R.chance(0.5) ? 1 : -1) * R.range(1.1, 2.0), len = R.range(160, 300);
    streets.push({ id: `side-${k + 1}`, from: pt(...o), to: pt(o[0] + Math.cos(d) * len, o[1] + Math.sin(d) * len), road: R.pick([5, 6]), walk: 5 });
  }
  return { streets, route: parts.map(([a]) => pt(...a)).concat([pt(...parts[parts.length - 1][1])]) };
}

// one long boulevard, sides streets crossing it or off it, at all angles
export function boulevardLayout({ seed = 1, length = 800, sides = 5 } = {}) {
  const R = makeRandom(seed), th = R.range(0, Math.PI * 2), d = [Math.cos(th), Math.sin(th)];
  const a = pt(-d[0] * length / 2, -d[1] * length / 2), b = pt(d[0] * length / 2, d[1] * length / 2);
  const streets = [{ id: 'main', from: a, to: b, road: R.pick([7, 8]), walk: R.pick([6, 7]) }];
  for (let k = 0; k < sides; k++) {
    const o = along(a, b, (k + 0.5 + R.range(-0.25, 0.25)) / sides), ang = th + R.range(0.6, 2.5) * (R.chance(0.5) ? 1 : -1), crossing = R.chance(0.5);
    const l1 = R.range(150, 320), l0 = crossing ? R.range(100, 250) : 0;
    streets.push({ id: `side-${k + 1}`, from: pt(o[0] - Math.cos(ang) * l0, o[1] - Math.sin(ang) * l0), to: pt(o[0] + Math.cos(ang) * l1, o[1] + Math.sin(ang) * l1), road: R.pick([5, 6]), walk: R.pick([5, 6]) });
  }
  return { streets, route: [along(a, b, 0.03), along(a, b, 0.97)] };
}
