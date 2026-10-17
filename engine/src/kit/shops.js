// Shops in the towers' ground floors along a street (kit/street.js asks for them where the district says, street
// shops: [{ u, side, width, kind, brand, name, sign, ... }]). The tower over them stands on its ground floor's
// columns (buildings.js tower(): pilotis); each shop a bright room behind a glass front. A shop is put together from
// parts chosen apart (its kind gives the defaults):
//   interior   what is inside (kit/interiors.js): kind, or interior: another kind's; compact: true for the compact
//              fit at the back with a display or tables before it
//   sign       its name over the front (SIGNS below)
//   blade      a blade sign out over the pavement, following its sign (BLADES below); blade: false for none
//   statue     a sculpture by its door (statue() below): 'right' (default) or 'left', or false; statueKind
//
//   kind       cafe, tea, icecream, dessert, bakery, florist, bookshop, umbrellas, cute, convenience, travel, diner
//   brand      one of the district's brands (by key): its colour on the walls and the sign, its ad on the tower
//   name       its name (one of the district's horizontal words); else the brand's name
//   sign       'text' (a screen of its name), 'led' (LED dots in its colour), 'plate' (a dark plate), 'pop' /
//              'reveal' (animated), 'film' (a cinema's film strip), 'umbrella' (jellyfish umbrellas), 'waves'
//              (sound), 'theme' (theme 'icecream' or 'moon', or one's own: kit/signs.js THEMES), 'meow' (kitten faces;
//              animals: true for many animals), 'cafe-cups' (its name by a cup on a clear screen), 'polka' (polka dots
//              and flowers of dots), 'dusk' (its breads either side, in a serif, on a pale yellow-green),
//              'space-strip' (space going by: the Earth's edge, a station's wheel), 'cake-case' (cakes going by
//              behind its nameplate, in a case), 'fogged' (none over the front: its name in the fog on its glass)
//   islands    (cafe) floating islands to sit at;  tables: false (icecream) no tables outside;  bulbs: chasing bulbs

import * as THREE from 'three';
import { box, panel, prism, outline, sorted } from './geometry.js';
import { ROOMS, COMPACT, THEME_OF, DIM_ROOMS, CEIL, D } from './interiors.js';
import { canvasPlane, inBrandColours } from './signs.js';
import { PROG } from '../core/screens.js';
import { CURB, LOBBY } from '../core/constants.js';
import { canopyGeometry, rimGeometry } from '../core/umbrella.js';
import { ledPicture, dotText, nameplate, popName, revealName, bulbRing, marquee, cinemaLED, umbrellaLED, concertWaves, meowLED, themedSign, THEMES } from './signs.js';
import { iconShape } from './icons.js';

const CYAN = [0.35, 1.5, 1.7], WARM = [1.15, 1.25, 1.25], PALE = [0.9, 1.25, 1.3], DIM = [0.25, 0.5, 0.55];
const T = (hex) => new THREE.Color(hex).toArray();
export const STATUES = ['cafe', 'tea', 'icecream', 'dessert', 'bakery', 'medal', 'florist', 'books', 'umbrella', 'diner', 'cat'];
const STATUE_OF = { cafe: 'cafe', bakery: 'medal', florist: 'florist', bookshop: 'books', umbrellas: 'umbrella', convenience: 'cafe', icecream: 'icecream', tea: 'tea', cute: 'cat', dessert: 'dessert', diner: 'diner', travel: null };

// the district's brand by key, with its place among the brands (for its colours turned as caseColors says)
export function brandOf(w, key) {
  const list = w.catalog?.brands ?? [], i = list.findIndex((b) => b.key === key);
  return i >= 0 ? { en: '', tagline: '', ...list[i], index: i } : null;
}

// The ground floor of a plot whose tower stands over shops: s its side, its front at a = front, depth back; zB..zA
// along the street; shops: [{ z0, z1, spec }] (z0 < z1, within zB..zA). x: the side's a -> local x.
export function shopsGround(w, R, s, front, depth, zB, zA, shops) {
  const X = (a) => s * a;
  const spans = [...shops].sort((p, q) => p.z0 - q.z0);
  // the lobby: glass, its rooms bright, wherever there is no shop (and behind the shops)
  const lobby = (z0, z1, a0) => {
    if (z1 - z0 < 0.5) return;
    const [x0, x1] = sorted(X(a0), X(front + depth));
    w.glass(prism(outline('rect', x0, x1, z0, z1), 0, LOBBY), [R.range(1.6, 2.2), LOBBY, 0.9, 3], R.next(), 0, [1.6, LOBBY]);
    w.block(x0, x1, z0, z1);
  };
  let z = zB;
  for (const sp of spans) {
    lobby(z, sp.z0, front);
    lobby(sp.z0, sp.z1, front + D + 0.15);   // (behind its back wall, not in it: the two faces in one plane flicker)
    streetShop(w, s, front, sp.z0, sp.z1, sp.spec);
    z = sp.z1;
  }
  lobby(z, zA, front);
}

// One shop: its front at a = front on side s, along z0..z1
export function streetShop(w, s, front, z0, z1, spec = {}) {
  const X = (a) => s * a, F = CURB, zc = (z0 + z1) / 2, W = z1 - z0;
  const kind = spec.interior ?? spec.kind ?? 'convenience', B = spec.brand ? brandOf(w, spec.brand) : null, dim = DIM_ROOMS.includes(kind);
  const R = w.rng(`shop:${spec.brand ?? kind}:${Math.round(zc)}:${s}`);
  const colour = B?.color ?? spec.color ?? '#7fd8e8';
  const face = s < 0 ? 'x' : '-x';   // (toward the street)
  const ip = (g, a) => w.inProps(g, a), ig = (g, rgb) => w.inGlow(g, rgb);
  // the room: floor, ceiling and its lights, walls in the brand's colour
  ip(box(X(front), X(front + D), F - 0.02, F + 0.01, z0, z1), 0.7);   // (a hair over the pavement, not in its plane)
  ip(box(X(front), X(front + D), F + CEIL, F + CEIL + 0.2, z0, z1), 0.8);
  if (!dim) for (let a = front + 1.2; a < front + D - 0.5; a += 2.2) ig(box(X(a - 0.5), X(a + 0.5), F + CEIL - 0.04, F + CEIL, z0 + 0.8, z1 - 0.8), WARM);
  for (const zz of [z0, z1]) ip(box(X(front), X(front + D), F, F + CEIL, zz - 0.1, zz + 0.1), 0.75);
  ip(box(X(front + D), X(front + D + 0.1), F, F + CEIL, z0, z1), 0.75);
  w.lamp(X(front + D / 2), F + CEIL - 0.1, zc, dim ? 0.2 : 0.6);
  w.emitter({ x: X(front - 0.4), y: 1.8, z: zc, nx: -s, ny: 0, nz: 0, power: 0.95, reach: 12, tint: 0.35 });
  w.floor(...sorted(X(front), X(front + D)), z0, z1, () => F);
  w.cover(...sorted(X(front), X(front + D)), z0, z1, F + CEIL, true);   // (indoors: no rain in it, the rain heard through the roof)
  // the walls in the way: its sides, its back
  for (const zz of [z0, z1]) w.block(...sorted(X(front), X(front + D)), zz - 0.15, zz + 0.15);
  // the glass front: slim mullions, a kerb, a dark transom, the door in the middle
  const door = [zc - 1.0, zc + 1.0];
  ip(box(X(front - 0.05), X(front + 0.05), F, F + 0.12, z0, door[0]), 0.4);
  ip(box(X(front - 0.05), X(front + 0.05), F, F + 0.12, door[1], z1), 0.4);
  ip(box(X(front - 0.06), X(front + 0.06), F + CEIL - 0.3, F + CEIL + 0.2, z0, z1), 0.25);
  for (let zz = z0 + 0.05; zz <= z1; zz += Math.max(1.2, (W - 0.1) / Math.round((W - 0.1) / 1.6))) {
    if (zz > door[0] + 0.1 && zz < door[1] - 0.1) continue;
    ip(box(X(front - 0.04), X(front + 0.04), F, F + CEIL, zz - 0.04, zz + 0.04), 0.35);
  }
  for (const zz of door) ip(box(X(front - 0.05), X(front + 0.05), F, F + CEIL - 0.3, zz - 0.05, zz + 0.05), 0.35);
  w.block(...sorted(X(front - 0.1), X(front + 0.1)), z0, door[0] - 0.05);
  w.block(...sorted(X(front - 0.1), X(front + 0.1)), door[1] + 0.05, z1);
  w.door(X(front + 0.12), door[0] + 0.05, door[1] - 0.05, F, F + CEIL - 0.3);
  // (fogged: its glass fogged with the warmth inside, rain on it, its name written in the fog on one pane)
  if (spec.sign === 'fogged' && w.cases) {
    const brand = B ?? { name: spec.name ?? '', en: '', tagline: '', color: colour, index: 0 };
    for (const [c0, c1, named] of [[z0 + 0.12, door[0] - 0.05, s > 0], [door[1] + 0.05, z1 - 0.12, s < 0]]) {
      w.addMesh(w.cases.rainWindow(c1 - c0, CEIL - 0.25, X(front) - s * 0.03, F + 0.2 + (CEIL - 0.25) / 2, (c0 + c1) / 2, face, brand, { glass: true, name: named }));
    }
  }
  // the fascia over it, and its sign
  const fy0 = F + CEIL + 0.2, fy1 = LOBBY, sw = W - 1.2, sh = Math.min(1.05, fy1 - fy0 - 0.2), sy = (fy0 + fy1) / 2;
  w.props(box(X(front - 0.3), X(front), fy0, fy1, z0, z1), 0.28);
  if (spec.sign !== 'fogged') sign(w, R, spec, B, X(front - 0.32), sy, zc, sw, sh, face, s);
  w.shown(box(X(front - 0.34), X(front - 0.3), fy0 + 0.02, fy0 + 0.06, z0 + 0.3, z1 - 0.3), T(colour).map((v) => v * 1.4));
  if (spec.blade !== false) blade(w, R, spec, B, s, X, front, z1 - 0.6);

  // what it sells: its fit along the back 3.4 m of the room (d from front + D - 3.4), and in front of it
  const back = front + D - 3.4, at = (d) => X(back + d), out = -s * Math.PI / 2;   // (out: turned to face the street)
  const c = {
    z0, z1, room: CEIL, at, CF: F, staff: [zc + 0.5, 2.4], H: R, ip, ig,
    bx: (b0, b1, y0, y1, d0, d1) => box(...sorted(at(d0), at(d1)), F + y0, F + y1, b0, b1),
    put: (k, zz, y, d, o = {}) => w.inPut(k, at(d), F + y, zz, { ...o, rot: o.rot ?? out }),
    block: (b0, b1, d0, d1) => w.block(...sorted(at(d0), at(d1)), b0, b1, -1, F + CEIL),
  };
  c.backWall = (lit, albedo = 0.5) => {
    if (lit) ig(c.bx(z0 + 0.1, z1 - 0.1, lit[0], lit[1], 3.37, 3.4), [0.85, 0.98, 1.0]);
    ig(c.bx(z0 + 0.1, z1 - 0.1, CEIL - 0.45, CEIL - 0.4, 3.3, 3.37), PALE);
  };
  c.counter = (b0, b1) => { ip(c.bx(b0, b1, 0, 1.05, 1.2, 1.8), 0.55); ig(c.bx(b0, b1, 1.05, 1.08, 1.2, 1.8), CYAN); c.block(b0, b1, 1.1, 3.4); };
  // its interior: a whole room (kit/interiors.js ROOMS), or a compact fit at the back and something before it
  if (ROOMS[kind] && !spec.compact) ROOMS[kind]({ w, R, s, X, F, front, z0, z1, zc, W, B, colour, door, spec, ip, ig, cases: w.cases });
  else {
  (COMPACT[kind] ?? COMPACT.convenience)(c);
  w.person(at(c.staff[1]), F, c.staff[0], s < 0 ? Math.PI / 2 : -Math.PI / 2, false);
  // before the fit, nearer the glass: tables to sit at, or a table of what it sells
  if (kind === 'cafe' || kind === 'bakery') {
    for (let zz = z0 + 1.4; zz < z1 - 1.2; zz += 2.6) {
      if (zz > door[0] - 0.8 && zz < door[1] + 0.8) continue;
      const a = front + 1.6;
      ip(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16).translate(X(a), F + 0.74, zz), 0.95);
      ip(new THREE.CylinderGeometry(0.04, 0.05, 0.74, 6).translate(X(a), F + 0.37, zz), 0.5);
      w.inPut('cup', X(a + 0.1), F + 0.76, zz + 0.1, { tone: 1 });
      w.circle(X(a), zz, 0.5);
      if (R.chance(0.6)) w.person(X(a + 0.75), F, zz, s < 0 ? -Math.PI / 2 : Math.PI / 2, false);
    }
  } else {
    const a0 = front + 2.0, a1 = front + 3.4, t0 = zc - Math.min(1.6, W / 4), t1 = zc + Math.min(1.6, W / 4);
    ip(box(...sorted(X(a0), X(a1)), F, F + 0.8, t0, t1), 0.6);
    ig(box(...sorted(X(a0), X(a1)), F + 0.8, F + 0.82, t0, t1), PALE);
    w.block(...sorted(X(a0), X(a1)), t0, t1, -1, F + 2);
    const goods = { florist: ['round', 'cupped', 'star'], bookshop: ['block'], umbrellas: ['umbrella'], convenience: ['snack', 'bottle', 'carton'] }[kind] ?? ['block'];
    for (let zz = t0 + 0.2; zz < t1 - 0.1; zz += 0.3) for (const a of [a0 + 0.35, a1 - 0.35]) {
      const k = R.pick(goods);
      w.inPut(k, X(a), F + 0.82, zz, k === 'block' ? { scale: [0.17, R.range(0.02, 0.05), 0.24], rot: R.range(-0.2, 0.2), tone: R.range(0.4, 1) } : { rot: R.range(0, 6.3), tone: R.range(0.6, 1) });
    }
    if (R.chance(0.7)) w.person(X(front + 1.3), F, zc + R.range(-2, 2), R.range(0, 6.3), false);
  }
  }

  // the sculpture by its door
  if (spec.statue !== false) {
    const right = (spec.statue ?? 'right') === 'right';
    // (as one faces the shop from the street, its right toward +z on the right side, toward -z on the left)
    const zs = (right === (s > 0)) ? door[1] + 1.7 : door[0] - 1.7;
    const sk = spec.statueKind ?? (kind in STATUE_OF ? STATUE_OF[kind] : 'cafe');
    if (sk) statue(w, R, sk, X(front - 1.15), zs, s, colour);
  }
}

// A blade sign standing out from the front near its end (bz along the street), both faces, read from along the
// pavement: what it shows follows the shop's sign (BLADES), else its brand's ad, else none
const BLADES = {
  theme: (q) => themedSign(q.bw - 0.08, q.bh - 0.08, q.x, q.y, q.z, q.face, '', q.theme, 'icon', { mesh: q.mesh, shown: (g, rgb) => q.w.shown(g, rgb) }),
  meow: (q) => q.mesh(meowLED(q.g(), q.bw - 0.06, q.bh - 0.06, q.R.next(), q.brand, { words: false, fine: 40 })),
  'cafe-cups': (q) => q.mesh(q.w.cases.cafeSign(q.g(), q.bw - 0.06, q.bh - 0.06, q.brand, 'column', (g, a) => q.w.props(g, a))),
  polka: (q) => q.mesh(inBrandColours(canvasPlane(q.g(), (q.bw - 0.06) / (q.bh - 0.06), false, (g, W, H) => {
    g.fillStyle = '#16263f'; g.fillRect(0, 0, W, H);
    q.w.cases.dotFlower(g, W / 2, H / 2, Math.min(W, H) * 0.36, '#ff9cc2');
    g.strokeStyle = 'rgba(255, 255, 255, 0.9)'; g.lineWidth = H * 0.035; g.strokeRect(H * 0.02, H * 0.02, W - H * 0.04, H - H * 0.04);
  }, 256), q.brand.index ?? 0)),
  dusk: (q) => q.mesh(q.w.cases.dawnPanel(q.bw - 0.06, q.bh - 0.06, q.x, q.y, q.z + q.f * 0.005, q.face, q.brand, 'blade')),
  'space-strip': (q) => q.mesh(q.w.cases.starBlade(q.g(), q.bw - 0.06, q.bh - 0.06, q.brand)),
  'cake-case': (q) => q.w.cases.brandCase(q.bw - 0.08, q.bh - 0.08, q.x, q.y, q.z, q.face, q.brand, 0.5, 'cake-blade'),
  fogged: (q) => q.mesh(q.w.cases.rainWindow(q.bw - 0.06, q.bh - 0.06, q.x, q.y, q.z + q.f * 0.005, q.face, q.brand, { kind: 'blade' })),
};
const CASE_SIGNS = ['cafe-cups', 'polka', 'dusk', 'space-strip', 'cake-case', 'fogged'];
function blade(w, R, spec, B, s, X, front, bz) {
  const style = spec.sign ?? 'text', make = BLADES[style] && (!CASE_SIGNS.includes(style) || w.cases) ? BLADES[style] : null;
  if (!make && !B) return;
  const F = CURB, [bw, bh, by] = style === 'cafe-cups' ? [0.8, 1.6, 3.15] : [1.3, 0.9, 3.0];
  w.props(box(...sorted(X(front - 1.6), X(front)), F + by + bh / 2 + 0.06, F + by + bh / 2 + 0.11, bz - 0.03, bz + 0.03), 0.4);
  w.props(box(...sorted(X(front - 0.85 - bw / 2 - 0.05), X(front - 0.85 + bw / 2 + 0.05)), F + by - bh / 2 - 0.05, F + by + bh / 2 + 0.05, bz - 0.05, bz + 0.05), 0.3);
  const brand = B ?? { name: spec.name ?? '', en: '', tagline: '', color: spec.color ?? '#ffd166', index: 0 };
  const theme = spec.theme ?? THEME_OF[spec.kind] ?? 'icecream';
  for (const f of [-1, 1]) {
    const face = f > 0 ? 'z' : '-z', z = bz + f * 0.06, x = X(front - 0.85), y = F + by;
    const q = { w, R, f, face, x, y, z, bw, bh, brand, theme, mesh: (m) => w.addMesh(m), g: () => panel(bw - 0.06, bh - 0.06, x, y, z, face) };
    if (make) make(q);
    else if (w.catalog) w.screenAd(q.g(), w.catalog.brandAd(B.key), bw - 0.06, bh - 0.06, R.next());
  }
  w.emitter({ x: X(front - 0.85), y: F + by, z: bz, nx: 0, ny: -0.3, nz: 1, power: 0.35, reach: 6, tint: 0.5 });
}

// Its sign over the front, sw x sh centred at (x, y, z), facing face, by its style (SIGNS; else a screen of its
// name, or its brand's ad)
const SIGNS = {
  theme: (q) => themedSign(q.sw, q.sh * 0.82, q.x, q.y, q.z, q.face, q.name, q.spec.theme ?? THEME_OF[q.spec.kind] ?? 'icecream', 'name', { mesh: q.mesh, shown: (g, rgb) => q.w.shown(g, rgb) }),
  meow: (q) => q.mesh(meowLED(q.g(), q.sw, q.sh, q.R.next(), { ...q.brand, name: q.name }, { layout: 'tiles', rows: 1, fine: 40, animals: !!q.spec.animals })),
  led: (q) => {
    const c = new THREE.Color(q.brand.color), m = Math.max(c.r, c.g, c.b, 1e-3);
    q.mesh(ledPicture(q.g(), q.sw, q.sh, (g, W, H) => dotText(g, q.name, W / 2, H / 2, H * 0.72, '#fff', { align: 'center', maxW: W * 0.92, dots: 16 }),
      { low: [c.r / m * 0.45, c.g / m * 0.45, c.b / m * 0.45], high: [c.r / m * 1.7, c.g / m * 1.7, c.b / m * 1.7], density: 18 }));
  },
  plate: (q) => q.mesh(nameplate(q.g(), q.name, q.brand.en ?? '', q.sw / q.sh)),
  pop: (q) => q.mesh(popName(q.g(), q.name, q.brand.en ?? '', q.sw / q.sh, 9, q.R.range(0.2, 1.5))),
  reveal: (q) => q.mesh(revealName(q.g(), q.name, q.brand.en ?? '', q.sw / q.sh, q.R.range(0, 12))),
  film: (q) => q.mesh(cinemaLED(q.sw, q.sh, q.x, q.y, q.z, q.face, { ...q.brand, name: q.name }, { mode: 'film', kind: 'sign', palette: q.spec.palette })),
  umbrella: (q) => q.mesh(umbrellaLED(q.sw, q.sh, q.x, q.y, q.z, q.face, { ...q.brand, name: q.name }, {})),
  waves: (q) => q.mesh(concertWaves(q.sw, q.sh, q.x, q.y, q.z, q.face, { ...q.brand, name: q.name }, { palette: q.spec.palette })),
  'cafe-cups': (q) => q.mesh(q.w.cases.cafeSign(q.g(q.sh * 0.82), q.sw, q.sh * 0.82, { ...q.brand, name: q.name }, 'name', (g, a) => q.w.props(g, a))),
  polka: (q) => q.mesh(q.w.cases.floristSign(q.g(q.sh * 0.82), q.sw, q.sh * 0.82, { ...q.brand, name: q.name })),
  dusk: (q) => q.mesh(q.w.cases.dawnPanel(q.sw, q.sh * 0.82, q.x, q.y, q.z, q.face, { ...q.brand, name: q.name }, 'sign')),
  'space-strip': (q) => q.mesh(q.w.cases.starTicker(q.g(q.sh * 0.82), q.sw, q.sh * 0.82, q.R.next(), { ...q.brand, name: q.name })),
  'cake-case': (q) => q.w.cases.brandCase(q.sw, q.sh * 0.82, q.x, q.y, q.z, q.face, { ...q.brand, name: q.name }, q.R.next(), 'cake-sign'),
};
function sign(w, R, spec, B, x, y, z, sw, sh, face, s) {
  const name = spec.name ?? B?.name ?? '', brand = B ?? { name, en: '', tagline: '', color: spec.color ?? '#7fd8e8', index: 0 };
  const style = spec.sign ?? 'text', make = SIGNS[style] && (!CASE_SIGNS.includes(style) || w.cases) ? SIGNS[style] : null;
  const q = { w, R, spec, brand, name, x, y, z, sw, sh, face, mesh: (m) => w.addMesh(m), g: (gh = sh) => panel(sw, gh, x, y, z, face) };
  if (make) make(q);
  else {
    const rect = name && w.atlas?.h(name);
    if (rect) w.screenAd(q.g(), w.catalog ? w.catalog.adOf(PROG.TEXT) : 0, sw, sh, R.next(), rect);
    else if (B && w.catalog) w.screenAd(q.g(), w.catalog.brandAd(B.key), sw, sh, R.next());
    else w.screen(q.g(), PROG.TICKER, sw, sh, w.atlas?.rects.h[0], R.next());
  }
  if (spec.bulbs) w.addMesh(marquee(bulbRing(x - s * 0.04, y, z, sw + 0.4, sh + 0.4, face, 0.27), 0.065));
  w.emitter({ x: x - s * 0.6, y, z, nx: -s, ny: 0, nz: 0, power: 0.7, reach: 10, tint: 0.5 });
}

// ---------------------------------------------------------------- sculptures
// A sculpture of what a shop sells on a round stone plinth with a ring of light, on the pavement at (x, z) (side s,
// facing the street's middle), in colour (its brand's). kind one of STATUES ('cat': the Blender model, if loaded:
// w.statues.cat, else one of simple shapes)
export function statue(w, R, kind, x, z, s, color) {
  const R0 = 0.8, top = CURB + 0.3;
  const at = (g, y = 0) => g.translate(x, top + y, z);
  const turn = (g) => g.rotateY(-s * Math.PI / 2);   // (made facing +z; turned to face the street)
  w.props(at(new THREE.CylinderGeometry(R0 - 0.05, R0, 0.3, 28).translate(0, -0.15, 0)), 0.75);
  w.glow(at(new THREE.TorusGeometry(R0 - 0.04, 0.02, 4, 40).rotateX(Math.PI / 2), -0.01), CYAN);
  w.circle(x, z, R0 + 0.1);
  if (kind === 'icecream') {
    w.props(at(new THREE.ConeGeometry(0.42, 1.3, 20).rotateX(Math.PI).translate(0, 0.65, 0)), 0.8);
    w.props(at(new THREE.SphereGeometry(0.47, 20, 14).translate(0, 1.55, 0)), 0.9);
    w.props(at(new THREE.SphereGeometry(0.4, 20, 14).translate(0.05, 2.08, 0)), 0.9);
    w.props(at(new THREE.SphereGeometry(0.11, 10, 8).translate(0.08, 2.52, 0)), 0.7);
    w.glow(at(new THREE.TorusGeometry(0.44, 0.02, 4, 36).rotateX(Math.PI / 2).translate(0, 1.32, 0)), CYAN);
  } else if (kind === 'tea') {
    w.props(at(new THREE.CylinderGeometry(0.52, 0.42, 1.6, 24).translate(0, 0.8, 0)), 0.85);
    w.props(at(new THREE.SphereGeometry(0.53, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1).translate(0, 1.6, 0)), 0.92);
    w.props(at(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10).rotateZ(0.25).translate(0.12, 2.05, 0)), 0.7);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      w.props(at(new THREE.SphereGeometry(0.1, 8, 6).translate(Math.cos(a) * 0.42, 0.18 + (i % 2) * 0.12, Math.sin(a) * 0.42)), 0.15);
    }
    w.glow(at(new THREE.TorusGeometry(0.53, 0.02, 4, 40).rotateX(Math.PI / 2).translate(0, 1.6, 0)), CYAN);
  } else if (kind === 'cafe') {
    w.props(at(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 28).translate(0, 0.04, 0)), 0.9);
    w.props(at(new THREE.CylinderGeometry(0.55, 0.42, 0.95, 24).translate(0, 0.55, 0)), 0.92);
    w.props(at(new THREE.CylinderGeometry(0.5, 0.5, 0.02, 24).translate(0, 0.98, 0)), 0.4);
    w.props(at(turn(new THREE.TorusGeometry(0.22, 0.06, 8, 16).rotateY(Math.PI / 2).translate(0.58, 0.6, 0))), 0.9);
    for (const dx of [-0.18, 0.18]) {
      const curve = new THREE.CatmullRomCurve3([0, 1, 2, 3].map((k) => new THREE.Vector3(dx + Math.sin(k * 1.7 + dx * 9) * 0.12, 1.1 + k * 0.32, 0)));
      w.glow(at(new THREE.TubeGeometry(curve, 16, 0.025, 4)), PALE);
    }
  } else if (kind === 'cat' && w.statues?.cat) {
    // (sitting up, modelled in Blender facing +z: its eyes alight, a collar of light round its neck)
    const g = w.statues.cat.clone();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    w.props(at(turn(g)), 0.95);
    for (const f of [-1, 1]) w.glow(at(turn(new THREE.SphereGeometry(0.07, 10, 8).scale(1, 1.15, 0.7).translate(f * 0.2, 1.67, 0.52))), CYAN);
    w.glow(at(turn(new THREE.TorusGeometry(0.33, 0.025, 4, 36).rotateX(Math.PI / 2).translate(0, 1.13, 0.05))), CYAN);
  } else if (kind === 'cat') {
    w.props(at(new THREE.SphereGeometry(0.62, 20, 14).scale(1, 0.95, 0.85).translate(0, 0.58, 0)), 0.95);
    w.props(at(new THREE.SphereGeometry(0.52, 20, 14).translate(0, 1.5, 0.05)), 0.95);
    for (const f of [-1, 1]) w.props(at(turn(new THREE.ConeGeometry(0.17, 0.36, 8).rotateZ(-f * 0.3).translate(f * 0.3, 2.0, 0.02))), 0.95);
    const tail = new THREE.CatmullRomCurve3([[0, 0.15, -0.45], [0.05, 0.1, -0.8], [0.12, 0.45, -1.0], [0.1, 0.9, -0.88], [0.02, 1.08, -0.68]].map((p) => new THREE.Vector3(...p)));
    w.props(at(turn(new THREE.TubeGeometry(tail, 24, 0.085, 8))), 0.95);
    for (const f of [-1, 1]) w.glow(at(turn(new THREE.SphereGeometry(0.075, 10, 8).translate(f * 0.17, 1.55, 0.47))), CYAN);
    w.glow(at(new THREE.TorusGeometry(0.4, 0.025, 4, 30).rotateX(Math.PI / 2).translate(0, 1.08, 0.05)), CYAN);
  } else if (kind === 'bakery') {
    // a great croissant on a slim stand, a ring of light round it
    w.props(at(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 8).translate(0, 0.45, 0)), 0.4);
    for (let k = -2; k <= 2; k++) {
      const r = 0.2 - Math.abs(k) * 0.035;
      w.props(at(turn(new THREE.SphereGeometry(r, 14, 10).scale(1, 0.85, 1.1).translate(k * 0.24, 1.2 - Math.abs(k) * Math.abs(k) * 0.035, -Math.abs(k) * 0.06))), 0.85);
    }
    w.glow(at(new THREE.TorusGeometry(0.75, 0.02, 4, 40).rotateX(Math.PI / 2).translate(0, 1.2, 0)), CYAN);
  } else if (kind === 'medal' && w.cases) {
    // a round medallion on a slim stand, a croissant on it in the dusk bakery's ink and yellow-green, both ways
    const medal = w.cases.duskPic.medal('croissant');
    w.props(at(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8).translate(0, 0.17, 0)), 0.4);
    for (const back of [0, 1]) {
      const m = w.cases.emojiStage([{ pic: medal, x: 0, y: 0.3, s: 1.3 }], { gain: 0.9 });
      m.rotation.y = -s * Math.PI / 2 + back * Math.PI; m.position.set(x, top, z); m.translateZ(0.01);
      w.addMesh(m);
    }
  } else if (kind === 'dessert') {
    const wedge = (y0, h, al) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.absarc(0, 0, 0.95, -0.5, 0.5, false); sh.lineTo(0, 0);
      w.props(at(new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 10 }).rotateX(-Math.PI / 2).translate(-0.48, y0, 0).rotateY(s > 0 ? 0 : Math.PI)), al);
    };
    wedge(0, 0.35, 0.85); wedge(0.35, 0.1, 0.95); wedge(0.45, 0.35, 0.85); wedge(0.8, 0.12, 0.95);
    w.props(at(new THREE.SphereGeometry(0.16, 12, 10).scale(1, 1.2, 1).translate(0, 1.1, 0)), 0.7);
    w.glow(at(new THREE.TorusGeometry(0.75, 0.02, 4, 40).rotateX(Math.PI / 2).translate(0, 0.93, 0)), CYAN);
  } else if (kind === 'florist') {
    w.props(at(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 8).translate(0, 0.9, 0)), 0.4);
    for (const f of [-1, 1]) w.props(at(new THREE.BoxGeometry(0.22, 0.02, 0.9).translate(0, 0, 0.45).rotateX(-0.9).rotateY(f * 1.2).translate(0, 0.5 + f * 0.1, 0)), 0.45);
    w.props(at(new THREE.CylinderGeometry(0.42, 0.16, 0.6, 6, 1, true).translate(0, 2.05, 0)), 0.95);
    w.glow(at(new THREE.SphereGeometry(0.1, 10, 8).translate(0, 1.95, 0)), [1.5, 1.7, 1.7]);
  } else if (kind === 'diner') {
    w.props(at(new THREE.CylinderGeometry(0.75, 0.75, 0.35, 24, 1, true).translate(0, 0.17, 0)), 0.6);
    w.props(at(new THREE.SphereGeometry(0.62, 20, 12).scale(1, 0.7, 1).translate(0, 0.55, 0)), 0.95);
    w.props(at(new THREE.ConeGeometry(0.16, 0.22, 10).translate(0, 1.05, 0)), 0.95);
    for (const dx of [-0.25, 0, 0.25]) {
      const curve = new THREE.CatmullRomCurve3([0, 1, 2, 3].map((k) => new THREE.Vector3(dx + Math.sin(k * 1.5 + dx * 7) * 0.1, 1.0 + k * 0.3, 0)));
      w.glow(at(new THREE.TubeGeometry(curve, 16, 0.022, 4)), PALE);
    }
  } else if (kind === 'books') {
    for (const f of [-1, 1]) {
      w.props(at(turn(new THREE.BoxGeometry(0.75, 1.05, 0.06).translate(f * 0.38, 0, 0).rotateY(f * 0.35)).translate(0, 0.62, 0)), 0.95);
      w.props(at(turn(new THREE.BoxGeometry(0.8, 1.1, 0.03).translate(f * 0.4, 0, -0.04).rotateY(f * 0.35)).translate(0, 0.62, 0)), 0.6);
    }
    w.glow(at(new THREE.TorusGeometry(0.7, 0.02, 4, 40).rotateX(Math.PI / 2).translate(0, 1.3, 0)), CYAN);
  } else if (kind === 'umbrella') {
    // a hologram: umbrellas afloat as jellyfish over the plinth, rising and sinking, in its colour
    const c = new THREE.Color(color), m = Math.max(c.r, c.g, c.b, 1e-3);
    const LINE = [c.r / m * 1.6, c.g / m * 1.6, c.b / m * 1.6].map((v) => Math.max(v, 0.4)), FILL = LINE.map((v) => v * 0.13);
    [[0.05, 2.35, -0.1, 0.88, 0], [-0.42, 1.4, 0.35, 0.56, 0.37], [0.45, 3.3, 0.25, 0.46, 0.71]].forEach(([ox, oy, oz, r, phase]) => {
      const h = r * 0.55, piece = (g) => g.translate(x + ox, top + oy, z + oz);
      const pivot = [x + ox, top + oy, z + oz];
      w.drifting(piece(canopyGeometry(r * 0.97, h * 0.97)), FILL, pivot, phase);
      w.drifting(piece(rimGeometry(r, h, 0.022)), LINE, pivot, phase);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, pts = [0, 0.25, 0.5, 0.75, 1].map((t) => new THREE.Vector3(Math.cos(a) * r * t, h * (1 - t * t) + 0.01, Math.sin(a) * r * t));
        w.drifting(piece(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.012, 3)), LINE, pivot, phase);
      }
      const hook = new THREE.CatmullRomCurve3([[0, h, 0], [0, -r * 1.1, 0], [0.05, -r * 1.3, 0], [0.13, -r * 1.25, 0]].map((p) => new THREE.Vector3(...p)));
      w.drifting(piece(new THREE.TubeGeometry(hook, 12, 0.014, 4)), LINE, pivot, phase);
    });
  }
  // someone taking a photo of it, now and then
  if (R.chance(0.5)) w.person(x - s * 1.8, CURB, z + R.range(-0.6, 0.6), s > 0 ? Math.PI / 2 : -Math.PI / 2, true);
}
