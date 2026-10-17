// What is inside a shop, by kind. Each kind has one or both of:
//   room     the whole of a street shop's room, 8 m deep behind its glass (kit/shops.js)
//   compact  its back 3.4 m only: a small shop in a station's wall (kit/underground.js), or a street shop of a kind
//            with no room (kit/shops.js then sets tables or a display before it)
// Kinds: cafe (islands: true for floating seats), tea, icecream, dessert, bakery, florist, bookshop, umbrellas,
// cute (plush kittens), convenience, travel, diner. INTERIORS lists which have which.
//
// A room is given c: { w, R, s, X, F, front, z0, z1, zc, W, B, colour, door, spec, ip, ig, cases }
// (X(a): side s's x at a from the street's middle; front: its glass at a = front; z0..z1 along the street; ip / ig:
// solid and light, inside), and builds with roomTools(c): bx(b0, b1, y0, y1, z0, z1) a box (b: how far in from the
// glass, 0..8), put(goods, b, y, z), block, staff(b, z), counter, table, shelves, menu, customers.
// A compact fit is given c: { z0, z1, room, bx(z0, z1, y0, y1, d0, d1) (d: in from where its back part starts,
// 0..3.4; below 0 toward the front), put(goods, z, y, d), block, at(d), CF, staff, backWall, counter, H, ip, ig }.

import * as THREE from 'three';
import { box, panel, sorted } from './geometry.js';
import { canopyGeometry, rimGeometry } from '../core/umbrella.js';
import { themedSign } from './signs.js';
import { iconShape } from './icons.js';

const CYAN = [0.35, 1.5, 1.7], PALE = [0.9, 1.25, 1.3], WARM = [1.15, 1.25, 1.25], DIM = [0.25, 0.5, 0.55];
export const CEIL = 3.55, D = 8;
const FLOWERS = ['round', 'cupped', 'star', 'spike'];
const T = (hex) => new THREE.Color(hex).toArray();
export const SHOP_KINDS = ['cafe', 'tea', 'icecream', 'dessert', 'bakery', 'florist', 'bookshop', 'umbrellas', 'cute', 'convenience', 'travel', 'diner'];
// which theme a themed shop's signs and menu take, by kind (kit/signs.js THEMES)
export const THEME_OF = { icecream: 'icecream', tea: 'moon' };
// kinds whose rooms are dim but for their own lamps
export const DIM_ROOMS = ['diner'];

export function roomTools(c) {
  const { w, s, X, F, front } = c;
  const faceStreet = -s * Math.PI / 2;
  const t = {
    bx: (b0, b1, y0, y1, c0, c1) => box(...sorted(X(front + b0), X(front + b1)), F + y0, F + y1, c0, c1),
    put: (k, b, y, z, o = {}) => w.inPut(k, X(front + b), F + y, z, { ...o, rot: o.rot ?? faceStreet }),
    block: (b0, b1, c0, c1) => w.block(...sorted(X(front + b0), X(front + b1)), c0, c1, -1, F + CEIL),
    staff: (b, z) => w.person(X(front + b), F, z, faceStreet + Math.PI, false),
    faceStreet,
  };
  t.counter = (b0, b1, c0, c1) => {
    c.ip(t.bx(b0, b1, 0, 1.02, c0, c1), 0.6);
    c.ig(t.bx(b0, b1, 1.02, 1.04, c0, c1), CYAN);
    t.block(b0 - 0.1, b1 + 0.1, c0 - 0.1, c1 + 0.1);
  };
  t.table = (b, z, chairs = 2) => {
    c.ip(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16).translate(X(front + b), F + 0.74, z), 0.85);
    c.ip(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6).translate(X(front + b), F + 0.37, z), 0.4);
    for (let i = 0; i < chairs; i++) {
      const a = (i / chairs) * Math.PI * 2 + 0.6, sb = b + Math.cos(a) * 0.65, sz = z + Math.sin(a) * 0.65;
      c.ip(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12).translate(X(front + sb), F + 0.46, sz), 0.75);
      c.ip(new THREE.CylinderGeometry(0.025, 0.025, 0.44, 6).translate(X(front + sb), F + 0.22, sz), 0.4);
    }
    w.circle(X(front + b), z, 0.9, -1, CEIL);
  };
  t.shelves = (b0, b1, c0, c1, ys, fill) => {
    for (const y of ys) { c.ip(t.bx(b0, b1, y - 0.03, y, c0, c1), 0.7); fill(y); }
    t.block(b0, b1, c0, c1);
  };
  // its menu on the back wall: its theme's LED menu, or its brand's ad, or nothing
  t.menu = (mw, mh, y) => {
    const { spec, B, R, zc } = c, theme = spec.theme ?? THEME_OF[spec.kind];
    if (theme && spec.sign === 'theme') themedSign(mw, mh, X(front + D - 0.18), F + y, zc, s < 0 ? 'x' : '-x', '', theme, 'menu', { mesh: (m) => w.addMesh(m), shown: (g, rgb) => w.inShown(g, rgb) });
    else if (B && w.catalog) w.inScreenAd(panel(mw, mh, X(front + D - 0.18), F + y, zc, s < 0 ? 'x' : '-x'), w.catalog.brandAd(B.key), mw, mh, R.next());
  };
  t.customers = () => { for (let i = c.R.int(1, 3); i > 0; i--) w.person(X(front + c.R.range(1.2, 3.5)), F, c.R.range(c.z0 + 1, c.z1 - 1), c.R.range(0, 6.3), false); };
  return t;
}

export const ROOMS = {
  // ice cream: a long low freezer lit along its glass, tubs of every flavour in two rows, cones by the till; a
  // stand of cones made and waiting; a tall freezer of pints to take home; its menu over the counter; outside, round
  // tables in its colour either side of the door
  icecream(c) {
    const { w, R, X, F, front, z0: za, z1: zb, zc, colour, ip, ig } = c, t = roomTools(c), { bx, put } = t;
    t.counter(3.6, 4.6, za + 0.8, zb - 1.6);
    for (let z = za + 1.0; z < zb - 1.7; z += 0.25) for (const b of [3.85, 4.3]) put('tub', b, 0.92, z, { tone: R.range(0.85, 1) });
    ig(bx(3.58, 3.6, 0.9, 1.25, za + 0.8, zb - 1.6), PALE);
    for (let k = 0; k < 8; k++) put('cone', 4.5, 1.04 + k * 0.02, zb - 1.9, { tone: 1, rot: 0 });
    t.staff(5.6, zc);
    t.menu(Math.min(c.W - 2, 4.4), 1.6, 2.3);
    ip(bx(D - 0.6, D - 0.12, 0, 0.95, za + 0.3, zb - 0.3), 0.6);
    t.table(1.5, za + 1.5);
    // cones made and waiting in a stand on the counter, a scoop or two on each
    ip(bx(3.72, 3.98, 1.02, 1.1, za + 0.95, za + 2.45), 0.85);
    for (let z = za + 1.08; z < za + 2.4; z += 0.22) {
      const xb = X(front + 3.85), y0 = F + 1.1;
      ip(new THREE.ConeGeometry(0.038, 0.15, 8).rotateX(Math.PI).translate(xb, y0 + 0.05, z), 0.8);
      const n = R.chance(0.5) ? 2 : 1;
      for (let k = 0; k < n; k++) ip(new THREE.IcosahedronGeometry(0.046 - k * 0.006, 1).translate(xb, y0 + 0.15 + k * 0.065, z), 0.85);
    }
    // a freezer of pints to take home by the wall: three glass doors, lit within, each flavour's colour on its band and lid
    const fz0 = zb - 0.8, fz1 = zb - 0.1, fb0 = 0.7, fb1 = 3.1, fh = 2.1, fr = 0.05;
    ip(bx(fb0, fb1, 0, 0.12, fz0, fz1), 0.3);
    ip(bx(fb0, fb1, fh - 0.22, fh, fz0, fz1), 0.85);
    for (const b of [fb0, fb1 - 0.06]) ip(bx(b, b + 0.06, 0, fh, fz0, fz1), 0.85);
    ip(bx(fb0, fb1, 0.12, fh - 0.22, fz1 - 0.04, fz1), 0.6);
    ig(bx(fb0 + 0.06, fb1 - 0.06, fh - 0.25, fh - 0.22, fz0 + 0.1, fz1 - 0.1), PALE);
    w.inShown(bx(fb0 + 0.3, fb1 - 0.3, fh - 0.17, fh - 0.06, fz0 - 0.005, fz0), T(colour).map((v) => v * 1.4));
    for (const y of [0.12, 0.55, 0.98, 1.41]) {
      ip(bx(fb0 + 0.06, fb1 - 0.06, y, y + 0.02, fz0 + 0.05, fz1 - 0.05), 0.5);
      for (let b = fb0 + 0.17; b < fb1 - 0.12; b += 0.15) for (const dz of [0.18, 0.42]) {
        if (R.chance(0.12)) continue;
        const px = X(front + b), pz = fz0 + dz;
        ip(new THREE.CylinderGeometry(0.06, 0.054, 0.13, 10).translate(px, F + y + 0.02 + 0.065, pz), 0.85);
        ip(new THREE.CylinderGeometry(0.0605, 0.0605, 0.04, 10).translate(px, F + y + 0.02 + 0.06, pz), 0.8);
        ip(new THREE.CylinderGeometry(0.063, 0.063, 0.015, 10).translate(px, F + y + 0.02 + 0.138, pz), 0.8);
      }
    }
    for (let d = 0; d < 3; d++) {
      const d0 = fb0 + 0.06 + d * (fb1 - fb0 - 0.12) / 3, d1 = d0 + (fb1 - fb0 - 0.12) / 3;
      for (const b of [d0, d1 - fr]) ip(bx(b, b + fr, 0.12, fh - 0.22, fz0 - 0.03, fz0), 0.85);
      for (const y of [0.12, fh - 0.22 - fr]) ip(bx(d0, d1, y, y + fr, fz0 - 0.03, fz0), 0.85);
      ig(bx(d1 - 0.12, d1 - 0.1, 0.8, 1.3, fz0 - 0.05, fz0 - 0.03), PALE);
    }
    t.block(fb0 - 0.1, fb1 + 0.1, fz0 - 0.15, fz1);
    t.customers();
    // its tables out on the pavement, either side of its door: round, in its colour, two or three chairs each
    if (c.spec.tables !== false) {
      for (const [z, n] of [[za + 1.7, 3], [zb - 1.9, 2]]) {
        const tx = X(front - 2.3);
        w.props(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20).translate(tx, F + 0.74, z), 0.85);
        w.props(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6).translate(tx, F + 0.37, z), 0.4);
        w.props(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12).translate(tx, F + 0.01, z), 0.4);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + 0.4, cx = tx + Math.cos(a) * 0.72, cz = z + Math.sin(a) * 0.72;
          w.props(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14).translate(cx, F + 0.46, cz), 0.85);
          w.props(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 6).translate(cx, F + 0.22, cz), 0.4);
          w.props(new THREE.BoxGeometry(0.34, 0.32, 0.03).translate(0, 0.16, -0.2).rotateY(Math.PI / 2 - a).translate(cx, F + 0.48, cz), 0.85);
        }
        w.circle(tx, z, 1.0, -1, 2);
      }
    }
  },
  // tea: a counter, jars of toppings on the wall, the sealers, cups waiting; its menu; tables. Moon lanterns hung
  // in its window; on the side wall a night-blue board of canvas totes printed with a moon, and shelves of soft
  // moons to take home
  tea(c) {
    const { w, R, X, F, front, z0: za, z1: zb, zc, W, ip } = c, t = roomTools(c), { bx, put } = t;
    t.counter(4.4, 5.1, za + 0.6, zb - 2.2);
    t.staff(5.9, zc - 0.5);
    ip(bx(D - 0.75, D - 0.12, 0, 0.95, za + 0.3, zb - 0.3), 0.6);
    for (let y = 1.4; y < 2.6; y += 0.42) {
      ip(bx(D - 0.4, D - 0.12, y - 0.03, y, za + 0.4, zb - 0.4), 0.7);
      for (let z = za + 0.6; z < zb - 0.5; z += 0.2) put('jar', D - 0.26, y, z, { tone: R.range(0.8, 1) });
    }
    for (let z = za + 1; z < zb - 1; z += 0.6) ip(bx(D - 0.65, D - 0.25, 0.95, 1.35, z - 0.15, z + 0.15), 0.8);
    for (let z = za + 0.9; z < zb - 2.4; z += 0.12) put('teacup', 4.75, 1.04, z, { tone: 1 });
    t.menu(Math.min(W - 2, 4), 1.0, 3.0);
    for (const [b, dz, r, hy] of [[1.2, -2.2, 0.42, 2.55], [1.6, 0.4, 0.28, 2.75], [1.1, 2.6, 0.2, 2.9]]) {
      w.inShown(new THREE.SphereGeometry(r, 24, 14).translate(X(front + b), F + hy, zc + dz), [1.55, 1.42, 1.05]);
      ip(new THREE.CylinderGeometry(0.006, 0.006, CEIL - hy - r, 4).translate(X(front + b), F + (CEIL + hy + r) / 2, zc + dz), 0.3);
      w.lamp(X(front + b), F + hy, zc + dz, 0.25);
    }
    const wz = zb - 0.1;
    ip(bx(0.5, 3.5, 0.85, 2.7, wz - 0.03, wz), 0.6);
    c.ig(bx(0.55, 3.45, 2.66, 2.69, wz - 0.06, wz - 0.03), WARM);
    for (const [b, print] of [[0.85, 'round'], [1.35, 'crescent'], [1.85, 'round']]) {
      const top = 2.2, bh = 0.42, bw = 0.36, fz = wz - 0.05;
      ip(bx(b - bw / 2, b + bw / 2, top - bh, top, fz - 0.02, fz), 0.85);
      ip(new THREE.TorusGeometry(0.12, 0.009, 4, 14, Math.PI).translate(X(front + b), F + top, fz - 0.01), 0.85);
      ip(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5).rotateX(Math.PI / 2).translate(X(front + b), F + top + 0.12, wz - 0.03), 0.3);
      const moon = iconShape('material/bedtime', 0.2);
      if (moon) ip(moon.rotateY(Math.PI).translate(X(front + b), F + top - bh * 0.5, fz - 0.03), 0.35);
    }
    for (const sy of [1.1, 1.65]) {
      ip(bx(2.15, 3.4, sy - 0.03, sy, wz - 0.28, wz - 0.03), 0.75);
      for (let b = 2.3, k = 0; b < 3.3; b += 0.27, k++) {
        const r = [0.09, 0.12, 0.08, 0.11][k % 4], mz = wz - 0.15;
        if ((k + (sy > 1.4 ? 1 : 0)) % 2) ip(new THREE.SphereGeometry(r, 14, 10).scale(1, 0.95, 0.75).translate(X(front + b), F + sy + r * 0.95, mz), 0.85);
        else ip(new THREE.TorusGeometry(r * 0.75, r * 0.38, 8, 16, Math.PI * 1.2).rotateZ(k % 4 < 2 ? 1.26 : -1.88).translate(X(front + b), F + sy + r * 1.1, mz), 0.85);
      }
    }
    t.table(1.6, za + 1.4); t.table(1.6, za + 3.6, 3); if (W > 9) t.table(2.4, zb - 1.2);
    t.customers();
  },
  // gifts: plush kittens and boxed figures on every wall, a table piled high in the middle with a great plush on top
  cute(c) {
    const { R, z0: za, z1: zb, zc, ip } = c, t = roomTools(c), { bx, put } = t;
    for (const [c0, c1, rot] of [[za + 0.1, za + 0.55, 0], [zb - 0.55, zb - 0.1, Math.PI]]) {
      t.shelves(1.0, D - 0.6, c0, c1, [0.4, 0.85, 1.3, 1.75, 2.2], (y) => {
        for (let b = 1.15; b < D - 0.7; b += 0.2) {
          if (R.chance(0.75)) put('plush', b, y, (c0 + c1) / 2, { rot, tone: 1 });
          else put('block', b, y, (c0 + c1) / 2, { rot, tone: 1, scale: [0.15, R.range(0.12, 0.22), 0.12] });
        }
      });
    }
    t.shelves(D - 0.5, D - 0.12, za + 0.7, zb - 0.7, [0.4, 0.85, 1.3, 1.75, 2.2], (y) => {
      for (let z = za + 0.85; z < zb - 0.8; z += 0.2) put('plush', D - 0.3, y, z, { tone: 1, scale: y < 0.5 ? 1.6 : 1 });
    });
    ip(bx(3.0, 4.8, 0, 0.7, zc - 0.9, zc + 0.9), 0.75);
    for (let i = 0; i < 26; i++) put('plush', R.range(3.15, 4.65), 0.7 + (i > 16 ? 0.17 : 0), zc + R.range(-0.75, 0.75), { rot: R.range(0, 6.3), tone: 1 });
    put('plush', 3.9, 1.05, zc, { scale: 3.2, tone: 1 });
    t.block(2.9, 4.9, zc - 1, zc + 1);
    t.counter(1.0, 1.6, zb - 2.6, zb - 0.8);
    t.staff(0.6, zb - 1.7);
    t.customers();
  },
  // a café: a counter, the espresso machine on the back counter, cups warming, its menu (coffees as cups, if its
  // sign is 'cafe-cups'; else its brand's ad); tables, or (islands: true) two floating islands to sit at, a little
  // island hung as a lamp in its window, warm lamps over its bar
  cafe(c) {
    const { w, R, s, X, F, front, z0: za, z1: zb, zc, W, ip, ig, spec, cases } = c, t = roomTools(c), { bx, put } = t;
    const toStreet = s < 0 ? 'x' : '-x';
    t.counter(4.4, 5.1, za + 0.6, zb - 2.2);
    t.staff(5.9, zc - 0.5);
    ip(bx(D - 0.75, D - 0.12, 0, 0.95, za + 0.3, zb - 0.3), 0.6);
    ip(bx(D - 0.7, D - 0.2, 0.95, 1.45, za + 1.0, za + 2.0), 0.85);
    ig(bx(D - 0.71, D - 0.7, 1.28, 1.32, za + 1.0, za + 2.0), CYAN);
    for (let z = za + 1.1; z < za + 1.95; z += 0.11) put('cup', D - 0.45, 1.45, z, { tone: 1 });
    for (let z = za + 2.4; z < zb - 1; z += 0.13) for (let k = 0; k < 3; k++) put('cup', D - 0.45, 0.95 + k * 0.035, z, { tone: 1 });
    for (let z = za + 1; z < zb - 2.4; z += 0.3) put('cup', 4.75, 1.04, z, { tone: 1 });
    const mw = Math.min(W - 2, 4);
    if (spec.sign === 'cafe-cups' && cases) {
      ip(bx(D - 0.15, D - 0.12, 1.7, 3.2, zc - mw / 2 - 0.3, zc + mw / 2 + 0.3), 0.2);
      w.addMesh(cases.cafeBoard(panel(mw, 1.1, X(front + D - 0.18), F + 2.45, zc, toStreet), mw, 1.1));
    } else t.menu(mw, 1.1, 2.45);
    if (spec.islands && cases) {
      const shownIn = (g, rgb) => w.inShown(g, rgb), RI = w.rng(`${spec.brand ?? 'cafe'}:islands:${Math.round(zc)}`);
      cases.floatIsland(ip, shownIn, X(front + 2.1), F, za + 1.75, 1.15, 'tree', RI);
      cases.floatIsland(ip, shownIn, X(front + 2.1), F, zb - 1.75, 1.0, 'lamp', RI);
      w.circle(X(front + 2.1), za + 1.75, 1.3, -1, CEIL);
      w.circle(X(front + 2.1), zb - 1.75, 1.15, -1, CEIL);
      cases.islandLamp(ip, shownIn, X(front + 0.9), F + 2.75, zc - 2.2, F + CEIL, RI);
      for (const z of [za + 1.4, zc - 0.5, zb - 2.6]) {
        shownIn(new THREE.SphereGeometry(0.13, 14, 10).scale(1, 0.75, 1).translate(X(front + 4.75), F + 2.25, z), [1.6, 1.12, 0.65]);
        ip(new THREE.CylinderGeometry(0.005, 0.005, CEIL - 2.33, 4).translate(X(front + 4.75), F + (CEIL + 2.33) / 2, z), 0.3);
        w.lamp(X(front + 4.75), F + 2.1, z, 0.2);
      }
      ig(bx(4.38, 4.4, 0.9, 0.95, za + 0.6, zb - 2.2), [1.6, 1.12, 0.65]);
    } else { t.table(1.6, za + 1.4); t.table(1.6, za + 3.6, 3); if (W > 9) t.table(2.4, zb - 1.2); }
    t.customers();
  },
  // cakes: a glass case of them for a counter, shelves of them behind; its menu (rows of cakes going by in a case,
  // if its sign is 'cake-case'; else its brand's ad); two tables
  dessert(c) {
    const { w, R, s, X, F, front, z0: za, z1: zb, zc, W, ip, ig, spec, B, cases } = c, t = roomTools(c), { bx, put } = t;
    const c0 = za + 0.8, c1 = zb - 2.0;
    ip(bx(3.8, 4.6, 0, 0.85, c0, c1), 0.6);
    for (const y of [0.87, 1.17]) {
      ig(bx(3.82, 4.58, y, y + 0.01, c0 + 0.02, c1 - 0.02), PALE);
      for (let z = c0 + 0.15; z < c1 - 0.1; z += 0.26) put('cake', 4.2, y + 0.01, z, { tone: 1 });
    }
    ip(bx(3.8, 4.6, 1.45, 1.48, c0, c1), 0.6);
    for (const z of [c0, c1]) ip(bx(3.8, 4.6, 0.85, 1.45, z - 0.02, z + 0.02), 0.4);
    t.block(3.7, 4.7, c0, c1);
    t.shelves(D - 0.5, D - 0.12, za + 0.4, zb - 0.4, [0.9, 1.45, 2.0], (y) => { for (let z = za + 0.7; z < zb - 0.6; z += 0.42) put('cake', D - 0.3, y, z, { tone: 1 }); });
    if (spec.sign === 'cake-case' && cases && B) cases.brandCase(Math.min(W - 2, 4), 0.95, X(front + D - 0.14), F + 2.95, zc, s < 0 ? 'x' : '-x', B, 0.7, 'cake-menu');
    else t.menu(Math.min(W - 2, 4), 0.95, 2.95);
    t.staff(5.4, zc);
    t.table(1.6, za + 1.5); t.table(1.6, zb - 1.3);
    t.customers();
  },
  // breads: a glass case of pastries for a counter, baskets on shelves behind; the breads drawn as Noto Emoji's
  // glyphs in one dark ink, standing turned to the street, and over the shelves two rows of medallions, a bread on
  // each (kit/cases.js duskPic), the wall behind pale; two tables
  bakery(c) {
    const { w, R, s, X, F, front, z0: za, z1: zb, zc, W, ip, ig, cases } = c, t = roomTools(c), { bx, put } = t;
    const c0 = za + 0.8, c1 = zb - 2.0, breads = [];
    const bread = (name, b, y, z, size) => (cases ? breads.push({ pic: cases.duskPic.glyph(name), x: s * (z - zc), y, z: -b, s: size }) : put(name === 'baguette' ? 'baguette' : R.pick(['loaf', 'roll', 'croissant']), b, y, z, { tone: R.range(0.8, 1) }));
    ip(bx(3.8, 4.6, 0, 0.85, c0, c1), 0.6);
    for (const y of [0.87, 1.17]) {
      ig(bx(3.82, 4.58, y, y + 0.01, c0 + 0.02, c1 - 0.02), PALE);
      let n = 0;
      for (let z = c0 + 0.15; z < c1 - 0.1; z += 0.16, n++) bread(y > 1 ? ['bread', 'cookie', 'bread', 'pie', 'waffle'][n % 5] : ['croissant', 'pretzel', 'croissant', 'bagel'][n % 4], 4.2, y + 0.01, z, 0.17);
    }
    ip(bx(3.8, 4.6, 1.45, 1.48, c0, c1), 0.6);
    for (const z of [c0, c1]) ip(bx(3.8, 4.6, 0.85, 1.45, z - 0.02, z + 0.02), 0.4);
    t.block(3.7, 4.7, c0, c1);
    t.shelves(D - 0.5, D - 0.12, za + 0.4, zb - 0.4, [0.9, 1.45, 2.0], (y) => {
      for (let z = za + 0.7; z < zb - 0.6; z += 0.42) {
        put('basket', D - 0.3, y, z, { tone: 0.9 });
        for (const dz of [-0.06, 0.06]) bread(y > 1.9 ? 'baguette' : ['bread', 'croissant', 'bagel', 'bread', 'flatbread'][breads.length % 5], D - 0.36, y + 0.03, z + dz * 1.4, y > 1.9 ? 0.3 : 0.2);
      }
    });
    if (cases) {
      const MENU = ['croissant', 'baguette', 'bread', 'bagel', 'pretzel', 'pie', 'waffle', 'cookie', 'flatbread', 'pancakes', 'sandwich', 'doughnut', 'coffee', 'milk'];
      const dm = 0.4, gap = 0.5, n = Math.min(7, Math.floor((W - 2.4) / gap));
      for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) breads.push({ pic: cases.duskPic.medal(MENU[(r * n + k) % MENU.length]), x: (k - (n - 1) / 2) * gap, y: 2.42 + (1 - r) * 0.5, z: -(D - 0.13), s: dm });
      const m = cases.emojiStage(breads, { gain: 0.8 });
      m.rotation.y = t.faceStreet; m.position.set(X(front), F, zc);
      w.addMesh(m);
    }
    t.staff(5.4, zc);
    t.table(1.6, za + 1.5); t.table(1.6, zb - 1.3);
    t.customers();
  },
  // a travel agent's, a place to ask and sit a while: a long white counter across the back, two at it; over it the
  // brand's own case (brands[].case), or its ad; racks of brochures along one side; by the other a corner to sit in
  travel(c) {
    const { w, R, s, X, F, front, z0: za, z1: zb, zc, W, ip, B, colour, cases } = c, t = roomTools(c), { bx } = t;
    t.counter(D - 1.5, D - 0.9, za + 0.9, zb - 0.9);
    for (const z of [zc - W * 0.2, zc + W * 0.2]) t.staff(D - 0.45, z);
    if (B?.case && cases) cases.brandCase(Math.min(W - 2.4, 5), 1.5, X(front + D - 0.14), F + 2.45, zc, s < 0 ? 'x' : '-x', B, 0.6, B.case);
    else t.menu(Math.min(W - 2.4, 5), 1.5, 2.45);
    const [b0r, b1r] = [za + 0.12, za + 0.4];
    ip(bx(1.0, D - 2.2, 0, 1.5, b0r, b1r), 0.6);
    for (const y of [0.55, 0.95, 1.35]) for (let b = 1.15; b < D - 2.3; b += 0.24) {
      ip(bx(b - 0.09, b + 0.09, y - 0.02, y + 0.22, b0r + 0.02, b1r - 0.02), 0.85);
    }
    const sofa = (q0, q1, c0, c1, back) => {
      ip(bx(q0, q1, 0.1, 0.42, c0, c1), 0.85);
      const cb = back > 0 ? [c1 - 0.18, c1] : [c0, c0 + 0.18];
      ip(bx(q0, q1, 0.42, 0.85, ...cb), 0.85);
      for (const bb of [[q0, q0 + 0.16], [q1 - 0.16, q1]]) ip(bx(...bb, 0.42, 0.62, c0, c1), 0.85);
      ip(bx(q0 + 0.05, q1 - 0.05, 0, 0.1, c0 + 0.05, c1 - 0.05), 0.4);
    };
    sofa(1.5, 3.5, zb - 0.95, zb - 0.2, 1);
    for (const b of [1.8, 3.2]) sofa(b - 0.38, b + 0.38, zb - 3.0, zb - 2.3, -1);
    ip(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 24).translate(X(front + 2.5), F + 0.4, zb - 1.6), 0.9);
    ip(new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8).translate(X(front + 2.5), F + 0.19, zb - 1.6), 0.6);
    ip(new THREE.CylinderGeometry(0.2, 0.16, 0.42, 12).translate(X(front + 4.1), F + 0.21, zb - 0.45), 0.8);
    ip(new THREE.SphereGeometry(0.38, 12, 10).scale(1, 1.3, 1).translate(X(front + 4.1), F + 0.85, zb - 0.45), 0.7);
    t.block(1.3, 4.5, zb - 3.1, zb - 0.1);
    t.customers();
  },
  // a late-night diner, dim but for its own lamps: a long counter inside the glass either side of the door, stools
  // at it, people looking out at the rain, a small warm lamp hung low over each place; a bar along the back before
  // the kitchen's pass, lit; two small tables between, a lamp over each (with sign 'fogged', its glass fogged over)
  diner(c) {
    const { w, R, X, F, front, z0: za, z1: zb, zc, ip, ig, door } = c, t = roomTools(c), { bx, put } = t;
    const LAMP = [1.6, 1.12, 0.65];
    const hang = (b, z, y) => {
      ip(new THREE.CylinderGeometry(0.005, 0.005, CEIL - y - 0.1, 4).translate(X(front + b), F + (CEIL + y + 0.1) / 2, z), 0.3);
      ip(new THREE.CylinderGeometry(0.05, 0.13, 0.13, 12, 1, true).translate(X(front + b), F + y + 0.05, z), 0.35);
      w.inShown(new THREE.SphereGeometry(0.055, 10, 8).translate(X(front + b), F + y, z), LAMP);
      w.lamp(X(front + b), F + y - 0.1, z, 0.18);
    };
    const stool = (b, z, y = 0.72) => {
      ip(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12).translate(X(front + b), F + y, z), 0.6);
      ip(new THREE.CylinderGeometry(0.025, 0.025, y, 6).translate(X(front + b), F + y / 2, z), 0.4);
    };
    for (const [c0, c1] of [[za + 0.3, door[0] - 0.3], [door[1] + 0.3, zb - 0.3]]) {
      ip(bx(0.22, 0.68, 1.0, 1.05, c0, c1), 0.6);
      ip(bx(0.3, 0.36, 0, 1.0, c0, c1), 0.4);
      ig(bx(0.66, 0.68, 0.96, 1.0, c0 + 0.05, c1 - 0.05), DIM);
      t.block(0.15, 0.75, c0, c1);
      for (let z = c0 + 0.35; z < c1 - 0.2; z += 0.7) {
        hang(0.45, z, 2.15);
        if (R.chance(0.55)) { w.person(X(front + 0.95), F, z, t.faceStreet + Math.PI, false); put('bowl', 0.45, 1.05, z, { tone: 1 }); }
        else stool(0.95, z);
      }
    }
    ip(bx(D - 1.6, D - 0.12, 0, 1.0, za + 0.3, zb - 0.3), 0.55);
    ig(bx(D - 1.62, D - 1.6, 0.95, 1.0, za + 0.3, zb - 0.3), LAMP);
    ip(bx(D - 0.5, D - 0.12, 1.0, 2.6, za + 0.3, zb - 0.3), 0.75);
    w.inShown(bx(D - 0.52, D - 0.5, 1.4, 2.4, za + 0.6, zb - 0.6), LAMP);
    t.block(D - 1.7, D, za, zb);
    for (let z = za + 0.8; z < zb - 0.6; z += 0.75) { stool(D - 2.05, z); put('bowl', D - 1.4, 1.0, z, { tone: 1 }); }
    t.staff(D - 1.0, zc);
    for (const z of [za + 2.0, zb - 2.0]) {
      ip(bx(3.0, 3.7, 0.72, 0.76, z - 0.35, z + 0.35), 0.85);
      ip(bx(3.32, 3.38, 0, 0.72, z - 0.03, z + 0.03), 0.4);
      for (const db of [-0.6, 0.6]) stool(3.35 + db, z, 0.46);
      put('bowl', 3.35, 0.76, z, { tone: 1 });
      hang(3.35, z, 1.9);
      w.circle(X(front + 3.35), z, 1.0, -1, CEIL);
    }
  },
  // flowers: stands stepping up at the back, buckets on them, a table of them in the middle, plants hanging, a
  // row of buckets inside the glass, motes in the air; a counter
  florist(c) {
    const { R, z0: za, z1: zb, zc, door, ip } = c, t = roomTools(c), { bx, put } = t, F4 = ['round', 'cupped', 'star', 'spike'];
    [[D - 1.6, 0.3], [D - 1.1, 0.62], [D - 0.6, 0.94]].forEach(([b, h]) => {
      ip(bx(b, D - 0.12, 0, h, za + 0.3, zb - 0.3), 0.62);
      for (let z = za + 0.5; z < zb - 0.4; z += 0.3) put(R.pick(F4), b + 0.2, h, z, { rot: R.range(0, 6.3), tone: R.range(0.8, 1.05) });
    });
    t.block(D - 1.7, D, za, zb);
    ip(bx(2.8, 4.2, 0, 0.75, zc - 0.8, zc + 0.8), 0.62);
    for (let i = 0; i < 6; i++) put(R.pick(F4), R.range(3.0, 4.0), 0.75, zc + R.range(-0.6, 0.6), { rot: R.range(0, 6.3), tone: 1 });
    t.block(2.7, 4.3, zc - 0.9, zc + 0.9);
    for (const [b, z] of [[1.2, za + 0.7], [2.6, zb - 0.9], [5.2, za + 1.4]]) put('hanging', b, CEIL - 0.9, z, { rot: R.range(0, 6.3) });
    for (let z = za + 0.6; z < door[0] - 0.4; z += 0.32) put(R.pick(F4), 0.5, 0, z, { rot: R.range(0, 6.3), tone: 1 });
    for (let i = 0; i < 30; i++) put('mote', R.range(0.3, D - 0.4), R.range(0.6, 2.8), R.range(za + 0.3, zb - 0.3));
    t.counter(1.2, 1.8, zb - 2.6, zb - 0.6);
    t.staff(0.7, zb - 1.6);
    t.customers();
  },
  // books: shelves to the ceiling on the back wall and down both sides, a table of new ones in piles, a counter
  bookshop(c) {
    const { R, z0: za, z1: zb, zc, ip } = c, t = roomTools(c), { bx, put } = t;
    const along = (t0, t1, at) => { let u = t0; while (u < t1 - 0.06) { const bw = R.range(0.022, 0.055); if (!R.chance(0.05)) at(u + bw / 2, { scale: [bw, R.range(0.17, 0.3), R.range(0.13, 0.2)], tone: R.pick([0.3, 0.55, 0.8, 1.0]) }); u += bw + 0.002; } };
    t.shelves(D - 0.45, D - 0.12, za + 0.3, zb - 0.3, [0.12, 0.52, 0.92, 1.32, 1.72, 2.12, 2.52], (y) => along(za + 0.35, zb - 0.35, (z, o) => put('block', D - 0.28, y, z, o)));
    for (const [c0, c1, rot] of [[za + 0.1, za + 0.45, 0], [zb - 0.45, zb - 0.1, Math.PI]]) {
      t.shelves(1.0, D - 0.5, c0, c1, [0.12, 0.52, 0.92, 1.32, 1.72], (y) => along(1.05, D - 0.55, (b, o) => put('block', b, y, (c0 + c1) / 2, { ...o, rot })));
    }
    ip(bx(2.6, 4.6, 0.76, 0.8, zc - 0.7, zc + 0.7), 0.8);
    for (let b = 2.8; b < 4.5; b += 0.35) for (const dz of [-0.35, 0.05, 0.4]) {
      let y = 0.8;
      for (let k = R.int(1, 5); k > 0; k--) { const h = R.range(0.025, 0.045); put('block', b, y, zc + dz, { scale: [0.17, h, 0.24], rot: R.range(-0.2, 0.2), tone: R.pick([0.4, 0.7, 1]) }); y += h; }
    }
    t.block(2.5, 4.7, zc - 0.8, zc + 0.8);
    t.counter(1.0, 1.6, zb - 2.4, zb - 0.6);
    t.staff(0.6, zb - 1.5);
    t.customers();
  },
  // umbrellas: a rack of them along the back, their wall lit; open ones hung from the ceiling over the front, their
  // rims alight, fireflies about them; a counter; stands of them to take as one goes
  umbrellas(c) {
    const { w, R, X, F, front, z0: za, z1: zb, zc, ip, ig } = c, t = roomTools(c), { bx, put } = t;
    ig(bx(D - 0.15, D - 0.12, 0.3, 2.4, za + 0.3, zb - 0.3), [0.85, 0.98, 1.0]);
    ip(bx(D - 0.5, D - 0.2, 1.93, 1.98, za + 0.4, zb - 0.4), 0.35);
    for (let z = za + 0.5; z < zb - 0.45; z += 0.14) put('umbrella', D - 0.35, 1.17, z, { rot: R.pick([0, Math.PI]), tone: R.range(0.5, 1) });
    for (const [b, z, r] of [[1.0, za + 1.4, 0.45], [1.9, za + 3.0, 0.38], [1.1, zc + 2.6, 0.42], [2.1, zb - 1.5, 0.45], [2.8, zc - 0.4, 0.34], [2.6, za + 1.9, 0.32]]) {
      const yb = CEIL - 0.25 - r * 0.55, ux = X(front + b);
      ip(canopyGeometry(r, r * 0.55).translate(ux, F + yb, z), 0.85);
      ig(rimGeometry(r, r * 0.55, 0.014).translate(ux, F + yb, z), [0.6, 1.7, 0.8].map((v) => v * R.range(0.6, 1)));
      ip(new THREE.CylinderGeometry(0.006, 0.006, 0.25, 4).translate(ux, F + CEIL - 0.125, z), 0.3);
    }
    for (let i = 0; i < 30; i++) ig(new THREE.SphereGeometry(0.022, 6, 4).translate(X(front + R.range(0.3, 3.4)), F + R.range(1.4, CEIL - 0.5), R.range(za + 0.3, zb - 0.3)), [1.0, 1.7, 0.5].map((v) => v * R.range(0.35, 1)));
    t.counter(3.6, 4.3, za + 1.0, zb - 2.0);
    t.staff(5.0, zc);
    for (const [b, z] of [[1.2, za + 1.0], [1.2, zb - 1.0]]) {
      ip(new THREE.CylinderGeometry(0.22, 0.2, 0.55, 14, 1, true).translate(X(front + b), F + 0.275, z), 0.5);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        w.inPut('umbrella', X(front + b) + Math.cos(a) * 0.12, F + 0.05, z + Math.sin(a) * 0.12, { rot: R.range(0, 6.3), tilt: Math.sin(a) * 0.12, roll: -Math.cos(a) * 0.12, tone: R.range(0.5, 1) });
      }
      w.circle(X(front + b), z, 0.4, -1, CEIL);
    }
    t.customers();
  },
};

export const COMPACT = {
  florist(c) {
    const { z0, z1, bx, put, block, room, H, ip, ig } = c;
    c.backWall(null);
    const bucket = (z, y, d) => put(H.pick(FLOWERS), z, y, d, { rot: H.range(0, 6.3), tone: H.range(0.75, 1.05) });
    [[2.3, 0.3], [2.7, 0.62], [3.05, 0.94]].forEach(([d, h]) => {
      ip(bx(z0 + 0.2, z1 - 0.2, 0, h, d, 3.38), 0.62);
      for (let z = z0 + 0.42; z < z1 - 0.3; z += 0.3) bucket(z, h, d + 0.17);
    });
    block(z0, z1, 2.2, 3.4);
    ip(bx(z1 - 1.9, z1 - 0.3, 0, 0.95, 1.0, 1.5), 0.55);
    ig(bx(z1 - 1.9, z1 - 0.3, 0.95, 0.98, 1.0, 1.5), CYAN);
    block(z1 - 2.0, z1 - 0.2, 0.9, 2.2);
    c.staff = [z1 - 1.1, 1.85];
    for (const [z, d] of [[z0 + 0.9, 0.8], [z0 + 2.6, 1.7], [z1 - 0.9, 0.6], [z1 - 2.8, 2.6]]) put('hanging', z, room - 0.85 - H.range(0, 0.3), d, { rot: H.range(0, 6.3) });
    ip(bx(z0 + 0.25, z1 - 1.8, 0, 0.25, -1.25, -0.2), 0.62);
    ip(bx(z0 + 0.25, z1 - 1.8, 0.25, 0.5, -0.72, -0.2), 0.62);
    for (let z = z0 + 0.45; z < z1 - 1.9; z += 0.3) { bucket(z, 0.25, -1.0); bucket(z, 0.5, -0.46); }
    block(z0 + 0.2, z1 - 1.75, -1.35, 0);
    for (let i = 0; i < 50; i++) put('mote', H.range(z0 + 0.3, z1 - 0.3), H.range(0.5, 2.9), H.range(-1.4, 3.2));
  },
  umbrellas(c) {
    const { z0, z1, bx, put, room, H, ip, ig, at, CF } = c;
    c.backWall([0.3, 2.3]);
    ip(bx(z0 + 0.3, z1 - 0.3, 1.93, 1.98, 3.05, 3.38), 0.35);
    ig(bx(z0 + 0.3, z1 - 0.3, 1.98, 2.0, 3.05, 3.07), PALE);
    for (let z = z0 + 0.42; z < z1 - 0.35; z += 0.13) put('umbrella', z, 1.17, 3.15, { rot: H.pick([0, Math.PI]), roll: H.range(-0.03, 0.03), tone: H.range(0.5, 1) });
    // open ones hung from the ceiling, their rims lit, fireflies about them
    const mid = (z0 + z1) / 2;
    for (const [z, d, r] of [[z0 + 0.9, 0.9, 0.42], [z0 + 2.1, 1.7, 0.36], [z1 - 1.9, 0.8, 0.4], [z1 - 0.9, 1.9, 0.34], [mid, 2.4, 0.3]]) {
      const yb = room - 0.25 - r * 0.55;
      ip(bx(z - 0.003, z + 0.003, room - 0.25, room, d - 0.003, d + 0.003), 0.3);   // (its wire)
      ip(canopyGeometry(r, r * 0.55).translate(at(d), CF + yb, z), 0.85);
      ig(rimGeometry(r, r * 0.55, 0.014).translate(at(d), CF + yb, z), [0.6, 1.7, 0.8].map((v) => v * H.range(0.6, 1)));
    }
    for (let i = 0; i < 26; i++) ig(new THREE.SphereGeometry(0.022, 6, 4).translate(at(H.range(0.3, 3.0)), CF + H.range(1.4, room - 0.5), H.range(z0 + 0.3, z1 - 0.3)), [1.0, 1.7, 0.5].map((v) => v * H.range(0.35, 1)));
    c.counter(z0 + 0.4, z1 - 1.6);
  },
  bakery(c) {
    const { z0, z1, bx, put, H, ip, ig } = c;
    c.backWall(null, 0.8);
    for (const y of [0.85, 1.4, 1.95]) {
      ip(bx(z0 + 0.2, z1 - 0.2, y - 0.04, y, 2.95, 3.4), 0.65);
      ig(bx(z0 + 0.2, z1 - 0.2, y - 0.06, y - 0.04, 2.95, 2.96), PALE);
      for (let z = z0 + 0.45; z < z1 - 0.3; z += 0.42) {
        put('basket', z, y, 3.18, { tone: 0.9 });
        if (y > 1.9) for (let k = 0; k < 3; k++) put('baguette', z + (k - 1) * 0.05, y + 0.02, 3.18, { tilt: 0.25, roll: (k - 1) * 0.15, tone: H.range(0.75, 0.95) });
        else for (const dz of [-0.07, 0.07]) put(H.pick(['loaf', 'roll', 'croissant']), z + dz, y + 0.03, 3.18, { rot: H.range(0, 6.3), tone: H.range(0.75, 0.95) });
      }
    }
    const b0 = z0 + 0.4, b1 = z1 - 1.6;
    ip(bx(b0, b1, 0, 0.85, 1.2, 1.8), 0.55);
    ip(bx(b0, b1, 1.42, 1.45, 1.2, 1.8), 0.6);
    ig(bx(b0, b1, 0.85, 0.87, 1.2, 1.21), PALE);
    for (const y of [0.87, 1.14]) {
      ig(bx(b0 + 0.03, b1 - 0.03, y, y + 0.01, 1.22, 1.78), PALE);
      for (let z = b0 + 0.15; z < b1 - 0.1; z += 0.15) for (const d of [1.38, 1.6]) put(H.pick(['croissant', 'roll']), z, y + 0.01, d, { rot: H.range(-0.4, 0.4), tone: H.range(0.8, 1) });
    }
    c.block(b0, b1, 1.1, 3.4);
  },
  cafe(c) {
    const { z0, z1, bx, put, room, H, ip, ig } = c;
    c.backWall(null, 0.2);
    ip(bx(z0 + 0.2, z1 - 0.2, 0, 0.95, 2.85, 3.38), 0.6);
    ig(bx(z0 + 0.2, z1 - 0.2, 0.95, 0.97, 2.85, 2.86), CYAN);
    ip(bx(z1 - 1.5, z1 - 0.6, 0.97, 1.45, 2.95, 3.35), 0.85);                       // the espresso machine
    ig(bx(z1 - 1.5, z1 - 0.6, 1.3, 1.34, 2.94, 2.95), CYAN);
    for (let z = z1 - 1.45; z < z1 - 0.7; z += 0.11) put('cup', z, 1.45, 3.15, { tone: 1 });
    for (let z = z0 + 0.4; z < z0 + 1.6; z += 0.12) for (let k = 0; k < 3; k++) put('cup', z, 0.97 + k * 0.035, 3.1, { tone: 0.95 });
    ig(bx(z0 + 0.6, z1 - 0.6, room - 1.35, room - 0.45, 3.36, 3.37), [0.7, 0.85, 0.9]);   // the menu, lit
    c.counter(z0 + 1.6, z1 - 0.4);
    c.staff = [z0 + 1.0, 2.4];
    for (let k = 0; k < 5; k++) put('cup', z0 + 2.0, 1.08 + k * 0.03, 1.5, { tone: 1 });
    // outside, two little tables
    for (const z of [z0 + 1.2, z1 - 1.2]) {
      ip(bx(z - 0.4, z + 0.4, 0.72, 0.76, -1.95, -1.15), 0.95);
      ip(bx(z - 0.04, z + 0.04, 0, 0.72, -1.59, -1.51), 0.5);
      put('cup', z, 0.76, -1.55, { tone: 1 });
      c.block(z - 0.5, z + 0.5, -2.0, -1.1);
    }
  },
  bookshop(c) {
    const { z0, z1, bx, put, room, H, ip, ig } = c;
    c.backWall(null);
    for (let y = 0.1; y < room - 0.6; y += 0.38) {
      ip(bx(z0 + 0.1, z1 - 0.1, y - 0.03, y, 3.05, 3.4), 0.6);
      for (const [b0, b1] of [[z0 + 0.1, z0 + 0.45], [z1 - 0.45, z1 - 0.1]]) ip(bx(b0, b1, y - 0.03, y, 0.3, 3.05), 0.6);
      let t = z0 + 0.13;
      while (t < z1 - 0.16) {
        const bw = H.range(0.018, 0.05), bh = H.range(0.17, 0.3);
        if (!H.chance(0.04)) put('block', t + bw / 2, y, 3.25, { scale: [bw, bh, H.range(0.13, 0.2)], tone: H.range(0.3, 1.0), roll: H.chance(0.06) ? H.range(-0.25, 0.25) : 0 });
        t += bw + 0.002;
      }
    }
    c.counter(z0 + 1.6, z1 - 0.7);
    for (let z = z0 + 1.9; z < z1 - 0.9; z += 0.32) {
      let y = 1.08;
      for (let k = H.int(2, 6); k > 0; k--) {
        const h = H.range(0.025, 0.045);
        put('block', z, y, 1.5, { scale: [0.17, h, 0.24], rot: H.range(-0.15, 0.15), tone: H.range(0.4, 1) });
        y += h;
      }
    }
    ig(bx(z0 + 1.75, z0 + 2.0, 1.08, 1.5, 1.45, 1.47), PALE);
  },
  convenience(c) {
    const { z0, z1, bx, put, room, H, ip, ig } = c;
    c.backWall([0.25, 2.1], 0.4);
    const SHELF = [0.12, 0.52, 0.92, 1.32], STOCK = [['carton', 'bottle'], ['noodle', 'snack'], ['snack', 'can'], ['bottle', 'can']];
    const WIDE = { bottle: 0.075, can: 0.072, carton: 0.082, snack: 0.165, noodle: 0.12 };
    SHELF.forEach((y, k) => {
      ip(bx(z0 + 0.2, z1 - 0.2, y - 0.02, y, 2.95, 3.38), 0.75);
      ig(bx(z0 + 0.2, z1 - 0.2, y - 0.045, y - 0.02, 2.94, 2.95), [0.5, 0.75, 0.8]);
      for (let t = z0 + 0.25; t < z1 - 0.3;) {
        const g = H.pick(STOCK[k]);
        put(g, t + WIDE[g] / 2, y, 3.15, { tone: H.pick([0.32, 0.55, 0.8, 1.0]) });
        t += WIDE[g] + 0.01;
      }
    });
    c.counter(z0 + 0.4, z0 + 2.4);
    c.staff = [z0 + 1.4, 2.4];
    ig(bx(z0 + 0.5, z1 - 0.5, room - 0.2, room - 0.16, 0.5, 3.0), [1.3, 1.4, 1.4]);
    // a stand of umbrellas by the way in
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      put('umbrella', z1 - 0.5 + Math.sin(a) * 0.12, 0.05, -0.45 + Math.cos(a) * 0.12, { rot: H.range(0, 6.3), tilt: Math.sin(a) * 0.12, roll: -Math.cos(a) * 0.12, tone: H.range(0.5, 1) });
    }
  },
  // (compact ones of the whole rooms, for a small shop in a station's wall)
  icecream(c) {
    const { z0, z1, bx, put, H, ip, ig } = c;
    c.backWall([0.3, 2.2], 0.6);
    ip(bx(z0 + 0.4, z1 - 0.4, 0, 0.92, 1.0, 1.9), 0.85);
    ig(bx(z0 + 0.4, z1 - 0.4, 0.9, 0.93, 0.98, 1.0), PALE);
    for (let z = z0 + 0.55; z < z1 - 0.5; z += 0.25) for (const d of [1.2, 1.65]) put('tub', z, 0.92, d, { tone: H.range(0.85, 1) });
    for (let k = 0; k < 8; k++) put('cone', z1 - 0.7, 1.0 + k * 0.02, 2.6, { tone: 1, rot: 0 });
    c.block(z0 + 0.3, z1 - 0.3, 0.9, 3.4);
    c.staff = [(z0 + z1) / 2, 2.6];
  },
  tea(c) {
    const { z0, z1, bx, put, H, ip } = c;
    c.backWall(null, 0.45);
    for (let y = 1.4; y < 2.6; y += 0.42) {
      ip(bx(z0 + 0.3, z1 - 0.3, y - 0.03, y, 3.1, 3.4), 0.7);
      for (let z = z0 + 0.45; z < z1 - 0.4; z += 0.2) put('jar', z, y, 3.25, { tone: H.range(0.8, 1) });
    }
    c.counter(z0 + 0.4, z1 - 0.4);
    for (let z = z0 + 0.6; z < z1 - 0.6; z += 0.14) put('teacup', z, 1.08, 1.5, { tone: 1 });
  },
  cute(c) {
    const { z0, z1, bx, put, H, ip } = c;
    c.backWall([0.2, 2.5], 0.7);
    for (const y of [0.4, 0.85, 1.3, 1.75, 2.2]) {
      ip(bx(z0 + 0.2, z1 - 0.2, y - 0.03, y, 3.0, 3.38), 0.7);
      for (let z = z0 + 0.35; z < z1 - 0.3; z += 0.2) put(H.chance(0.75) ? 'plush' : 'block', z, y, 3.2, { tone: 1, ...(H.chance(0.25) ? { scale: [0.15, H.range(0.12, 0.22), 0.12] } : {}) });
    }
    c.block(z0, z1, 2.9, 3.4);
    ip(bx(z0 + 0.8, z1 - 0.8, 0, 0.7, 1.0, 1.9), 0.75);
    for (let i = 0; i < 16; i++) put('plush', H.range(z0 + 1, z1 - 1), 0.7, H.range(1.1, 1.8), { rot: H.range(0, 6.3), tone: 1 });
    c.block(z0 + 0.7, z1 - 0.7, 0.9, 2.0);
    c.staff = [z0 + 0.6, 2.4];
  },
  dessert(c) {
    const { z0, z1, bx, put, ip, ig } = c;
    c.backWall(null, 0.7);
    for (const y of [0.9, 1.45, 2.0]) {
      ip(bx(z0 + 0.3, z1 - 0.3, y - 0.03, y, 3.0, 3.38), 0.7);
      for (let z = z0 + 0.5; z < z1 - 0.4; z += 0.42) put('cake', z, y, 3.2, { tone: 1 });
    }
    ip(bx(z0 + 0.4, z1 - 0.4, 0, 0.85, 1.2, 1.8), 0.6);
    for (const y of [0.87, 1.17]) {
      ig(bx(z0 + 0.42, z1 - 0.42, y, y + 0.01, 1.22, 1.78), PALE);
      for (let z = z0 + 0.6; z < z1 - 0.5; z += 0.26) put('cake', z, y + 0.01, 1.5, { tone: 1 });
    }
    c.block(z0 + 0.3, z1 - 0.3, 1.1, 3.4);
  },
};

export const INTERIORS = Object.fromEntries([...new Set([...Object.keys(ROOMS), ...Object.keys(COMPACT)])]
  .map((k) => [k, { room: !!ROOMS[k], compact: !!COMPACT[k] }]));
