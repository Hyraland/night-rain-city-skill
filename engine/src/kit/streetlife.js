// What a street has besides its buildings, built in its frame (kit/street.js calls these): bridges between the
// towers facing each other over it, floating signs over its pavements, and along the strip between its lamps and
// trees, flower beds and glass rain shelters (an ad on each, a board of the time and the weather inside).

import * as THREE from 'three';
import { box, panel, prism, outline, sorted } from './geometry.js';
import { CYAN, WHITE, SOFT, DIM } from './buildings.js';
import { PROG } from '../core/screens.js';
import { CURB } from '../core/constants.js';

const PALE = [0.9, 1.25, 1.3];

// Bridges high over the street from tower to tower (plots: what the street built on both sides), glass tubes or
// open gardens, some with a line of words running along them. how many: st.bridges (default: one per 120 m)
export function bridges(w, st, plots) {
  const R = w.rng(`${st.id}:bridges`), want = st.bridges ?? Math.floor(st.len / 120);
  const plotAt = (s, z, y) => plots.find((p) => p.s === s && p.zB + 3 < z - 12 && z < p.zA - 3 && p.top > y + 12);
  const words = w.atlas?.rects.h ?? [];
  for (let i = 0, made = 0; i < 80 && made < want; i++) {
    const z = -R.range(40, st.len - 40), y = R.range(24, 130);
    const L = plotAt(-1, z, y), Rt = plotAt(1, z, y);
    if (!L || !Rt) continue;
    const hh = R.range(4.5, 7), dz = R.range(7, 11), x0 = -L.front - 1, x1 = Rt.front + 1;
    if (R.chance(0.45)) garden(w, R, x0, x1, z - dz, z, y);
    else w.glass(prism(outline(R.chance(0.4) ? 'rounded' : 'rect', x0, x1, z - dz, z, 2.5), y, y + hh, { bottom: true }), [1.6, hh - 0.4, 0.6, 0], R.next());
    w.glow(box(-L.front, Rt.front, y - 0.1, y, z - 0.05, z + 0.05), R.chance(0.5) ? CYAN : WHITE);
    if (R.chance(0.5) && words.length) {
      const sw = Math.min(R.range(14, 20), x1 - x0 - 4), sh = Math.min(hh * 0.7, sw / 5), rect = R.pick(words), xc = R.range(-3, 3);
      // (one line of words each way along the street)
      for (const [zz, face, nz] of [[z + 0.4, 'z', 1], [z - dz - 0.4, '-z', -1]]) {
        w.screen(panel(sw, sh, xc, y + hh / 2, zz, face), PROG.TICKER, sw, sh, rect, R.next());
        w.emitter({ x: xc, y: y + hh / 2, z: zz + nz * 0.4, nx: 0, ny: 0, nz, power: 1.0, reach: 36, tint: 0.6 });
      }
    }
    made++;
  }
}

// an open garden bridge: a deck, planters along both edges with small trees, greenery hanging over, a glass rail
function garden(w, Q, x0, x1, z0, z1, y) {
  w.props(box(x0, x1, y - 0.6, y, z0, z1), 0.8);
  for (const [za, zb] of [[z0 + 0.3, z0 + 1.3], [z1 - 1.3, z1 - 0.3]]) {
    w.props(box(x0 + 1, x1 - 1, y, y + 0.55, za, zb), 0.36);
    for (let x = x0 + 2; x < x1 - 2; x += Q.range(3.5, 5)) w.tree(x, y + 0.55, (za + zb) / 2, Q.range(3.2, 4.5), Q.range(1.1, 1.5), Q.chance(0.6), false);
    for (let x = x0 + 1; x < x1 - 1; x += Q.range(0.9, 1.8)) {
      const len = Q.range(0.8, 2.2), zz = za < (z0 + z1) / 2 ? z0 - 0.05 : z1 + 0.05;
      w.props(box(x - 0.2, x + 0.2, y - 0.6 - len, y - 0.1, zz - 0.12, zz + 0.12), 0.3);
    }
  }
  for (const zz of [z0 + 0.05, z1 - 0.05]) {
    w.glow(box(x0, x1, y, y + 1.1, zz - 0.02, zz + 0.02), DIM);
    w.glow(box(x0, x1, y + 1.08, y + 1.12, zz - 0.04, zz + 0.04), CYAN);
  }
  for (let z = z0 + 1.5; z < z1 - 1; z += 2.5) w.glow(box(x0 + 0.5, x1 - 0.5, y - 0.64, y - 0.6, z - 0.05, z + 0.05), SOFT);
}

// Floating signs over the pavements, every 60 to 110 m, now one side, now the other, each showing one of the
// district's words (st.signs: false for none). clear(s, u): whether that place is clear of the crossing streets
export function floatingSigns(w, st, clear) {
  if (st.signs === false) return;
  const words = w.atlas?.words.horizontal ?? [];
  if (!words.length) return;
  const R = w.rng(`${st.id}:signs`);
  for (let u = R.range(20, 60); u < st.len - 20; u += R.range(60, 110)) {
    const s = R.chance(0.5) ? -1 : 1;
    if (!clear(s, u)) continue;
    w.holoSign({ x: s * (st.halfRoad + st.walk * R.range(0.45, 0.6)), y: CURB + R.range(2.7, 3.4), z: -u, text: R.pick(words) });
  }
}

// Along the strip by the kerb, between the lamps and the trees (lamps every 32 m, a tree halfway, see street.js:
// so a gap of some 13 m after each), now and then a flower bed, and every ninth gap a rain shelter, the two sides
// out of step. clear(s, u0, u1): whether that stretch is clear of the crossing streets. (st.furniture: false: none)
export function furniture(w, st, clear) {
  if (st.furniture === false) return;
  const h = st.halfRoad;
  for (const s of [-1, 1]) {
    const R = w.rng(`${st.id}:furniture:${s}`);
    let k = s > 0 ? 4 : 0;
    for (let u = (s > 0 ? 16 : 0) + 4; u < st.len - 2; u += 16) {
      const g0 = u + 1.4, g1 = u + 14.6, mid = (g0 + g1) / 2;
      const kind = k++ % 9;
      if (g1 > st.len - 2 || !clear(s, g0 - 1, g1 + 1)) continue;
      if (kind === 0) shelter(w, R, s, h + 0.35, h + 2.6, -(mid + 3.7), -(mid - 3.7));
      else if ([1, 4, 6, 8].includes(kind)) {
        const len = R.range(4.6, 6.4);
        flowerBed(w, R, s, h + 0.5, h + 2.0, -(mid + len / 2), -(mid - len / 2));
      }
    }
  }
}

// A raised flower bed, its stone edge lit low; flowers of a few kinds in drifts (core/goods.js), two little lamps
function flowerBed(w, Q, s, a0, a1, za, zb) {
  const X = (a) => s * a, F = CURB;
  w.props(box(X(a0), X(a1), F, F + 0.45, za, zb), 0.72);
  w.props(box(X(a0 + 0.08), X(a1 - 0.08), F + 0.44, F + 0.455, za + 0.08, zb - 0.08), 0.16);
  w.glow(box(X(a0) - 0.01, X(a0) + 0.01, F + 0.36, F + 0.4, za, zb), DIM);
  w.block(...sorted(X(a0), X(a1)), za, zb);
  let kind = Q.pick(['bedRound', 'bedCupped', 'bedStar', 'bedSpike']), until = za;
  for (let z = za + 0.22; z < zb - 0.15; z += 0.3) {
    if (z > until) { kind = Q.pick(['bedRound', 'bedCupped', 'bedStar', 'bedSpike', 'leaves']); until = z + Q.range(0.8, 1.8); }
    for (let a = a0 + 0.28; a < a1 - 0.2; a += 0.32) {
      w.put(Q.chance(0.2) ? 'leaves' : kind, X(a + Q.range(-0.06, 0.06)), F + 0.45, z + Q.range(-0.06, 0.06), { rot: Q.range(0, 6.3), scale: Q.range(0.85, 1.2), tone: Q.range(0.8, 1.05) });
    }
  }
  for (let i = 0; i < (zb - za) * 2; i++) w.put('mote', X(Q.range(a0, a1)), F + Q.range(0.6, 1.4), Q.range(za, zb));
  for (const k of [1 / 3, 2 / 3]) {
    const z = za + (zb - za) * k, a = (a0 + a1) / 2;
    w.props(box(X(a) - 0.03, X(a) + 0.03, F + 0.45, F + 1.25, z - 0.03, z + 0.03), 0.4);
    w.glow(box(X(a) - 0.07, X(a) + 0.07, F + 1.18, F + 1.3, z - 0.07, z + 0.07), PALE);
    w.emitter({ x: X(a), y: F + 1.2, z, nx: 0, ny: -1, nz: 0, power: 1.0, reach: 3.2, tint: 0.1 });
  }
}

// A glass rain shelter, its glass back at ab (toward the road), its roof out to af, along za..zb: a thin roof with
// lit edges on posts, an ad on the street side and a small one inside, the board of the time and the weather, a
// bench, two posts with sockets to charge at
function shelter(w, Q, s, ab, af, za, zb) {
  const X = (a) => s * a, top = 2.9, mid = (za + zb) / 2, F = CURB;
  const toStreet = s < 0 ? 'x' : '-x', fromStreet = s < 0 ? '-x' : 'x';
  w.props(box(X(ab - 0.2), X(af), top - 0.08, top, za, zb), 0.9);
  for (const a of [ab - 0.2, af]) w.glow(box(X(a) - 0.02, X(a) + 0.02, top - 0.09, top + 0.01, za, zb), CYAN);
  w.glow(box(X(ab + 0.6), X(af - 0.6), top - 0.11, top - 0.08, za + 0.4, zb - 0.4), SOFT);
  for (const z of [za + 0.2, mid, zb - 0.2]) w.props(box(X(ab) - 0.05, X(ab) + 0.05, F, top - 0.08, z - 0.05, z + 0.05), 0.85);
  w.glow(box(X(ab) - 0.015, X(ab) + 0.015, F + 0.25, F + 0.28, za + 0.25, zb - 0.25), DIM);
  w.glow(box(X(ab) - 0.015, X(ab) + 0.015, top - 0.35, top - 0.32, za + 0.25, zb - 0.25), DIM);
  w.block(...sorted(X(ab - 0.15), X(ab + 0.15)), za, zb, -1, top);
  w.infoBoard(panel(3.4, 1.3, X(ab + 0.06), F + 1.85, mid - 1.6, fromStreet));
  const brands = w.catalog?.brandAds ?? [], ad = brands.length ? Q.pick(brands) : (w.catalog ? w.catalog.adOf(PROG.BLOBS) : 0);
  w.brandAd(1.5, 2.0, X(ab + 0.06), F + 1.4, mid + 1.9, fromStreet, ad, Q.next());   // (as cases, if its brand has one)
  w.brandAd(4.6, 2.1, X(ab - 0.06), F + 1.45, mid, toStreet, ad, Q.next());
  w.emitter({ x: X(ab - 0.5), y: F + 1.5, z: mid, nx: -s, ny: 0, nz: 0, power: 0.6, reach: 12, tint: 0.6 });
  w.emitter({ x: X(ab + 0.5), y: F + 1.8, z: mid, nx: s, ny: 0, nz: 0, power: 0.5, reach: 8, tint: 0.5 });
  w.props(box(X(ab + 0.1), X(ab + 0.55), F + 0.44, F + 0.5, za + 0.6, mid + 0.6), 0.85);
  for (const z of [za + 0.8, mid + 0.4]) w.props(box(X(ab + 0.12), X(ab + 0.5), F, F + 0.44, z - 0.04, z + 0.04), 0.4);
  for (let z = za + 1.2; z < mid + 0.4; z += 1.1) w.glow(box(X(ab + 0.2), X(ab + 0.42), F + 0.5, F + 0.51, z - 0.12, z + 0.12), PALE);
  w.block(...sorted(X(ab), X(ab + 0.6)), za + 0.6, mid + 0.6);
  for (const z of [za + 0.35, zb - 0.35]) {
    w.props(box(X(af - 0.35) - 0.09, X(af - 0.35) + 0.09, F, F + 1.1, z - 0.09, z + 0.09), 0.6);
    for (const y of [0.75, 0.9]) w.glow(new THREE.TorusGeometry(0.025, 0.006, 4, 12).rotateY(Math.PI / 2).translate(X(af - 0.35) - s * 0.095, F + y, z), CYAN);
    w.glow(box(X(af - 0.35) - 0.1, X(af - 0.35) + 0.1, F + 1.1, F + 1.12, z - 0.1, z + 0.1), CYAN);
    w.circle(X(af - 0.35), z, 0.2);
  }
  w.cover(...sorted(X(ab - 0.2), X(af)), za, zb, top - 0.08);
  w.lamp(X((ab + af) / 2), top - 0.2, mid, 0.4);
  for (const [a, z] of [[ab + 0.35, za + 2.0], [af - 1.0, mid + 1.2]]) w.person(X(a), F, z, Q.range(0, 6.3), false);
}
