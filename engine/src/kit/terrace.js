// A terrace beside a street: broad steps up from the pavement onto a raised, paved forecourt before a tower, with
// trees in planters wrapped in rings of light, slim lamps along the top of the steps, a hedge and benches, two
// freestanding glass ads; and (wide enough) a deck before the tower's second floor on slender columns, a long lit
// stair up to it, a band of light ribbons along its edge, a covered place to sit beneath it. Built in its own
// frame: its origin at the street's edge (kit.beside), the terrace back along -z, its width across x.
//
//   kit.place(kit.beside('avenue', 120, 1), () => terrace(w, { width: 34, depth: 26 }));

import * as THREE from 'three';
import { box, panel } from './geometry.js';
import { makeBuilder, CYAN, SOFT, DIM } from './buildings.js';
import { PROG } from '../core/screens.js';
import { CURB, LOBBY } from '../core/constants.js';

export function terrace(w, { width = 34, depth = 26, height = 1.35, deck = width >= 32, tower = true, towerHeight = null, name = 'terrace' } = {}) {
  const Q = w.rng(name), W2 = width / 2, T1 = height, T2 = height + LOBBY;
  const x0 = -W2 + 0.5, x1 = W2 - 0.5, back = -depth;
  // the broad steps up from the pavement, a lit line along each
  const n1 = 8, tr1 = 0.4, s1 = -n1 * tr1;
  for (let i = 0; i < n1; i++) {
    const top = CURB + ((i + 1) * (T1 - CURB)) / n1, z = -i * tr1;
    w.props(box(x0, x1, 0, top, s1 - 0.5, z), 0.72);
    w.glow(box(x0 + 0.3, x1 - 0.3, top - 0.03, top, z - 0.02, z + 0.02), DIM);
  }
  w.floor(x0, x1, s1, 0, (x, z) => CURB + THREE.MathUtils.clamp(-z / -s1, 0, 1) * (T1 - CURB));
  // the terrace: paved and wet like the pavement, its sides a wall to anyone below
  w.props(box(x0, x1, 0, T1 - 0.02, back, s1), 0.72);
  w.groundPiece('pavement', new THREE.PlaneGeometry(x1 - x0, s1 - back).rotateX(-Math.PI / 2).translate(0, T1, (s1 + back) / 2), { local: (x, z) => [x, z] });
  w.lift(x0, x1, back, s1, T1);
  w.floor(x0, x1, back, s1, () => T1);
  for (const x of [x0, x1]) w.block(x - 0.25, x + 0.25, back, 0, -1, T1 - 0.45);
  w.glow(box(x0 + 0.4, x1 - 0.4, T1, T1 + 0.015, s1 - 0.03, s1 + 0.03), CYAN);

  // slim lamps along the top of the steps
  for (const x of [x0 + 1.2, 0, x1 - 1.2]) {
    const z = s1 - 0.35, hz = s1 - 1.2, top = T1 + 4.6;
    w.props(new THREE.CylinderGeometry(0.05, 0.08, 4.7, 8).translate(x, T1 + 2.35, z), 0.7);
    w.props(box(x - 0.04, x + 0.04, top - 0.06, top, hz, z), 0.7);
    w.glow(box(x - 0.07, x + 0.07, top - 0.1, top - 0.06, hz - 0.45, hz + 0.45), [3, 3.2, 3.2]);
    w.lamp(x, top - 0.2, hz);
    w.circle(x, z, 0.2, T1 - 0.5);
    w.beam(new THREE.CylinderGeometry(0.3, 3.4, top - 0.2 - T1, 16, 1, true).translate(x, (top - 0.2 + T1) / 2, hz));
  }
  // trees in planters wrapped in rings of light, a hedge, benches, the glass ads, people
  for (const x of [x0 + 3.5, x1 - 3.5]) {
    const z = s1 - 2.4;
    w.props(new THREE.CylinderGeometry(1.15, 1.2, 0.5, 20).translate(x, T1 + 0.25, z), 0.88);
    w.tree(x, T1 + 0.5, z, Q.range(5.5, 7), Q.range(1.6, 2.1), Q.chance(0.5), true);
    w.circle(x, z, 1.25, undefined, T1 + 2);
    w.emitter({ x, y: T1 + 4.5, z, nx: 0, ny: 0, nz: 1, power: 0.45, reach: 8, tint: 0.8 });
  }
  const hz0 = x0 + 7, hz1 = deck ? -2 : x1 - 7, hzz = s1 - 1.2;
  if (hz1 - hz0 > 3) {
    w.props(box(hz0, hz1, T1, T1 + 0.5, hzz - 1.7, hzz - 0.7), 0.8);
    w.block(hz0 - 0.1, hz1 + 0.1, hzz - 1.8, hzz - 0.6, T1 - 0.6, T1 + 2);
    for (let x = hz0 + 1; x < hz1; x += 2.2) w.tree(x, T1 + 0.5, hzz - 1.2, Q.range(2.2, 2.8), Q.range(0.6, 0.75), false, false);
  }
  glassAd(w, Q, x1 - 4.5, s1 - 3.0, T1, PROG.VORTEX);
  glassAd(w, Q, 1, s1 - 5.5, T1, PROG.CELLS);
  for (let i = 0; i < 4; i++) w.person(Q.range(x0 + 1, x1 - 1), T1, Q.range(back + (deck ? 10 : 2), s1 - 2), Q.range(0, 6.3), true);
  w.emitter({ x: 0, y: T1 + 2.6, z: back + 0.6, nx: 0, ny: 0, nz: 1, power: 0.7, reach: 12, tint: 0.25 });

  // the deck before the tower's second floor, its stair, what is beneath
  if (deck) {
    const dz = back + 9.5, dx0 = x0 + 1.5, dx1 = dx0 + 14;
    w.props(box(dx0, dx1, T2 - 0.32, T2, back, dz), 0.85);
    w.floor(dx0, dx1, back, dz, () => T2);
    for (const x of [dx0 + 0.6, (dx0 + dx1) / 2, dx1 - 0.6]) {
      w.props(new THREE.CylinderGeometry(0.17, 0.17, T2 - 0.32 - T1, 10).translate(x, (T1 + T2 - 0.32) / 2, dz - 0.5), 0.9);
      w.circle(x, dz - 0.5, 0.3, -1, T2 - 1);
    }
    w.screen(panel(dx1 - dx0, 0.58, (dx0 + dx1) / 2, T2 - 0.31, dz + 0.03, 'z'), PROG.RIBBONS, dx1 - dx0, 0.58, undefined, Q.next());
    w.emitter({ x: (dx0 + dx1) / 2, y: T2 - 0.3, z: dz + 0.4, nx: 0, ny: 0, nz: 1, power: 0.7, reach: 12, tint: 0.6 });
    w.cover(dx0, dx1, back, dz, T2 - 0.6);
    w.lift(dx0, dx1, back, dz, T2);
    for (let z = dz - 1.5; z > back + 0.5; z -= 2.5) w.glow(box(dx0 + 0.5, dx1 - 0.5, T2 - 0.34, T2 - 0.32, z - 0.06, z + 0.06), SOFT);
    w.emitter({ x: (dx0 + dx1) / 2, y: T2 - 0.6, z: (back + dz) / 2, nx: 0, ny: -1, nz: 0, power: 0.8, reach: 12, tint: 0.2 });
    // the stair, rising along the deck's front toward it
    const n2 = 35, tr2 = 0.45, sz0 = dz, sz1 = dz + 2.5, xTop = dx1, xBot = dx1 + n2 * tr2;
    for (let i = 0; i < n2; i++) {
      const top = T1 + ((i + 1) * (T2 - T1)) / n2, xf = xBot - i * tr2;
      w.props(box(xf - tr2, xf, T1, top, sz0, sz1), 0.86);
      w.glow(box(xf - 0.04, xf, top - 0.03, top, sz0 + 0.1, sz1 - 0.1), DIM);
    }
    w.floor(xTop, xBot, sz0, sz1, (x) => T1 + THREE.MathUtils.clamp((xBot - x) / (xBot - xTop), 0, 1) * (T2 - T1));
    const slope = Math.atan2(T2 - T1, xBot - xTop), len = Math.hypot(T2 - T1, xBot - xTop);
    for (const z of [sz0, sz1]) {
      w.glow(new THREE.BoxGeometry(len, 0.05, 0.05).rotateZ(-slope).translate((xTop + xBot) / 2, (T1 + T2) / 2 + 1.0, z), CYAN);
      w.block(xTop, xBot, z - 0.12, z + 0.12, T1 + 0.4, T2 + 2);
    }
    w.block(xTop, xBot - 2, sz0, sz1, -1, T1 + 0.3);
    // its glass railing, open where the stair arrives
    w.glow(box(dx0, dx1, T2, T2 + 1.05, dz - 0.03, dz + 0.03), DIM);
    w.glow(box(dx0 - 0.03, dx0 + 0.03, T2, T2 + 1.05, back, dz), DIM);
    w.glow(box(dx0, dx1, T2 + 1.02, T2 + 1.06, dz - 0.04, dz + 0.04), CYAN);
    w.block(dx0, dx1 - 2.6, dz - 0.2, dz + 0.2, T2 - 0.6, T2 + 2);
    w.block(dx0 - 0.2, dx0 + 0.2, back, dz, T2 - 0.6, T2 + 2);
    // up on it: planters along the tower with small trees, people
    w.props(box(dx0 + 1, dx1 - 1, T2, T2 + 0.6, back + 0.3, back + 1.7), 0.8);
    w.block(dx0 + 1, dx1 - 1, back, back + 1.9, T2 - 0.6, T2 + 2);
    for (let x = dx0 + 2.2; x < dx1 - 1.5; x += 3.6) w.tree(x + Q.range(-0.4, 0.4), T2 + 0.6, back + 1.0, Q.range(2.6, 3.4), Q.range(0.8, 1.0), Q.chance(0.3), false);
    w.glow(box(dx0 + 1, dx1 - 1, T2 + 0.45, T2 + 0.6, back + 1.7, back + 1.75), CYAN);
    for (let i = 0; i < 3; i++) w.person(Q.range(dx0 + 2, dx1 - 2), T2, Q.range(back + 2.5, dz - 1), Q.range(0, 6.3), true);
    // beneath it: benches, people out of the rain
    for (const x of [dx0 + 3, dx1 - 3]) {
      w.props(box(x - 1.1, x + 1.1, T1 + 0.42, T1 + 0.5, back + 3.25, back + 3.75), 0.85);
      w.props(box(x - 0.9, x + 0.9, T1, T1 + 0.42, back + 3.35, back + 3.65), 0.4);
      w.block(x - 1.1, x + 1.1, back + 3.2, back + 3.8, T1 - 0.6, T1 + 1.5);
    }
    for (let i = 0; i < 3; i++) w.person(Q.range(dx0 + 1.5, dx1 - 1.5), T1, Q.range(back + 1.5, dz - 1), Q.range(0, 6.3), false);
  }

  // the tower behind (built as a street's would be, in a frame turned so that it faces the terrace)
  if (tower) {
    const B = makeBuilder(w, { facade: 0, halfRoad: 0 }), h = towerHeight ?? Q.range(90, 220);
    w.frame(0, back, Math.PI / 2, () => {
      const info = B.tower(1, 0, 30, -W2, W2, h, 'rect', [Q.range(1.4, 2.1), Q.range(3.6, 4.2), Q.range(0.2, 0.5), Q.pick([0, 2, 3, 5])], Q.next(), { classic: true, base: T1 });
      B.entrance(1, 0, 0, width, {});
      if (info?.flat && info.top > 40) B.adWall({ s: 1, front: 0, top: info.top, hung: T2 + 1.5, info }, `${name}:ads`, { y0: T2 + 2.2 });
    });
  }
  return { width, depth, height, claim: [-W2 - 0.5, W2 + 0.5, back - (tower ? 31 : 0.5), 0] };
}

// A freestanding glass ad: a pane on two slim posts, its picture seen both ways (across x), lit edges
function glassAd(w, Q, x, z, y, prog) {
  const wd = 3.2, h = 4.8, seed = Q.next();
  for (const dx of [-wd / 2 - 0.06, wd / 2 + 0.06]) w.props(box(x + dx - 0.05, x + dx + 0.05, y, y + h + 0.5, z - 0.05, z + 0.05), 0.85);
  for (const [face, dz] of [['z', 0.03], ['-z', -0.03]]) {
    w.screen(panel(wd, h, x, y + 0.4 + h / 2, z + dz, face), prog, wd, h, undefined, seed);
    w.emitter({ x, y: y + 0.4 + h / 2, z: z + dz * 13, nx: 0, ny: 0, nz: Math.sign(dz), power: 0.75, reach: 11, tint: 0.5 });
  }
  w.glow(box(x - wd / 2, x + wd / 2, y + h + 0.42, y + h + 0.46, z - 0.03, z + 0.03), SOFT);
  w.block(x - wd / 2 - 0.2, x + wd / 2 + 0.2, z - 0.25, z + 0.25, y - 0.6, y + 2);
}
