// The buildings along a street, built in the street's frame (kit/world.js frame()): the street runs along local -z,
// side s (-1 left, +1 right as one looks down it) is at local x = s * a, a the distance from its middle. A plot is
// the stretch zB..zA (zB < zA) along one side; what stands on it is one of:
//   line       a tower on the street line
//   forecourt  a tower set back behind a forecourt (trees in planters, benches)
//   plaza      a tower set well back behind a plaza (pools, groves, kiosks, sculptures, lawns; a covered square
//              under an upper part on columns, now and then)
//   podium     a low glass podium on the street line, a garden on its roof, the tower set back on it
// Towers: glass curtain walls (toon.js glassMaterial: rooms behind the panes, lit or dark), tiers set back as
// they rise, a crown of light, a spire on the tallest, balconies or fins; some of the taller ones end in a
// contemporary upper part (modernTop). On their street faces great screens (faceScreen), on rounded corners
// curved ones (arcScreen), by their doors a canopy with a little sign (entrance) or a slim blade sign.

import * as THREE from 'three';
import { box, panel, sorted, outline, prism, asProp } from './geometry.js';
import { PROG, VFX } from '../core/screens.js';
import { CURB, LOBBY } from '../core/constants.js';
import { shopsGround, brandOf } from './shops.js';

export const CYAN = [0.35, 1.5, 1.7], WHITE = [1.7, 1.9, 1.9], SOFT = [0.8, 1.0, 1.0], DIM = [0.25, 0.5, 0.55];
// the kinds of contemporary upper part (see modernTop), and how often: about three tall towers in four
const MODERN = ['twist', 'stack', 'garden', 'diagrid', 'green', 'stream', 'cantilever', 'green', 'stream', null, null];
// facade styles (toon.js glassMaterial aWin.w): 0 clear, 1 deep floor bands, 2 slender, 3 a pale frame with big
// panes, 4 a diagrid, 5 staggered panels, 6 waving fins, 7 ribbons in waves
const FACADES = [0, 0, 1, 2, 3, 5, 6, 7, 5, 6, 7];

// w: the world; street: { facade (where its buildings may start, from its middle), halfRoad }; the plot's own
// random sequence is made from its name
export function makeBuilder(w, street) {
  const FACADE = street.facade;
  let R = w.rng('builder');
  let G = CURB;   // the ground the furniture stands on
  const X = (s) => (a) => s * a;
  const newWin = () => [R.range(1.4, 2.1), R.range(3.6, 4.2), R.range(0.18, 0.5), R.pick(FACADES)];
  const atlas = w.atlas;
  const words = (kind) => (atlas ? atlas.rects[kind] : []);
  const pickRect = (kind) => { const l = words(kind); return l.length ? l[R.int(0, l.length - 1)] : new THREE.Vector4(); };
  const rectAspect = (r) => (r.z - r.x) / Math.max(r.w - r.y, 1e-4);

  // ---------------------------------------------------------------- furniture
  const tree = (x, y, z, big = 1, bands = false) => {
    w.tree(x, y, z, R.range(5, 7.5) * big, R.range(1.5, 2.2) * big, R.chance(0.45), bands || R.chance(0.3));
    w.circle(x, z, 0.35);
  };
  const planterTree = (x, z) => {
    w.props(new THREE.CylinderGeometry(1.15, 1.2, 0.5, 20).translate(x, G + 0.25, z), 0.88);
    tree(x, G + 0.5, z, 0.9);
    w.circle(x, z, 1.25);
  };
  // a bench, its seat running along z
  const bench = (x, z, len = 1.9) => {
    w.props(box(x - 0.24, x + 0.24, G + 0.42, G + 0.5, z - len / 2, z + len / 2), 0.85);
    for (const dz of [-len / 2 + 0.2, len / 2 - 0.2]) w.props(box(x - 0.2, x + 0.2, G, G + 0.42, z + dz - 0.05, z + dz + 0.05), 0.5);
    w.block(x - 0.3, x + 0.3, z - len / 2, z + len / 2);
  };
  const person = (x, z, umbrella = true) => w.person(x, G, z, R.range(0, Math.PI * 2), umbrella);
  const bollards = (a, z0, z1, s) => {
    for (let z = z0 + 1.5; z < z1 - 1; z += 3.5) w.glow(box(s * a - 0.07, s * a + 0.07, G, G + 0.8, z - 0.07, z + 0.07), SOFT);
  };

  // Fill a plaza or forecourt: s the side, a0..a1 from the middle, z0..z1 along; covered: under an overhang.
  // A few things, placed so they don't overlap, by theme.
  function furnish(s, a0, a1, z0, z1, covered) {
    const used = [], x = X(s);
    const place = (wd, d) => {  // wd across, d along
      if (a1 - a0 < wd || z1 - z0 < d) return null;
      for (let tries = 0; tries < 24; tries++) {
        const a = R.range(a0 + wd / 2, a1 - wd / 2), z = R.range(z0 + d / 2, z1 - d / 2);
        if (used.every((u) => Math.abs(u.a - a) > (u.w + wd) / 2 || Math.abs(u.z - z) > (u.d + d) / 2)) {
          used.push({ a, z, w: wd, d });
          return { a, z };
        }
      }
      return null;
    };
    const depth = a1 - a0;
    bollards(a0 - 0.3, z0, z1, s);
    if (depth < 10) {
      // a forecourt: a row of trees in planters, benches between, someone waiting
      for (let z = z0 + 3; z < z1 - 2; z += 8) {
        const a = a0 + Math.min(2, depth / 2);
        used.push({ a, z, w: 2.6, d: 2.6 });
        planterTree(x(a), z);
        if (z + 4 < z1 - 1) bench(x(a), z + 4, 1.8);
      }
      for (let i = R.int(0, 3); i > 0; i--) { const p = place(0.8, 0.8); if (p) person(x(p.a), p.z, !covered); }
      return;
    }
    const themes = R.chance(0.5) ? ['pool', 'grove'] : R.chance(0.5) ? ['kiosk', 'grove', 'sculpture'] : ['lawn', 'sculpture', 'grove'];
    if (covered) themes.unshift('tables');
    for (const theme of themes) {
      if (theme === 'pool') {
        const wd = Math.min(depth - 3, R.range(5, 9)), d = Math.min(z1 - z0 - 4, R.range(8, 16));
        const p = wd > 3 && d > 4 && place(wd + 1, d + 1);
        if (!p) continue;
        const [x0, x1] = sorted(x(p.a - wd / 2), x(p.a + wd / 2));
        w.props(box(x0, x1, G, G + 0.32, p.z - d / 2, p.z + d / 2), 0.9);       // the rim
        w.groundPiece('pool', new THREE.PlaneGeometry(x1 - x0 - 0.5, d - 0.5).rotateX(-Math.PI / 2).translate(x(p.a), G + 0.33, p.z));
        w.block(x0, x1, p.z - d / 2, p.z + d / 2);
      } else if (theme === 'grove') {
        for (let i = R.int(2, 5); i > 0; i--) { const p = place(2.8, 2.8); if (!p) break; planterTree(x(p.a), p.z); }
        for (let i = R.int(1, 3); i > 0; i--) { const p = place(0.9, 2.4); if (p) bench(x(p.a), p.z); }
      } else if (theme === 'kiosk') {
        const p = place(5.5, 6.5);
        if (!p) continue;
        const [kx0, kx1] = sorted(x(p.a - 2), x(p.a + 2));
        w.glass(prism(outline('rect', kx0, kx1, p.z - 2.5, p.z + 2.5), G, 3.4), [1.2, 3.4, 1, 3], R.next());
        w.props(box(x(p.a - 2.7), x(p.a + 2.7), 3.4, 3.6, p.z - 3.2, p.z + 3.2), 0.9);
        w.glow(box(x(p.a - 2.72), x(p.a + 2.72), 3.38, 3.42, p.z - 3.22, p.z + 3.22), SOFT);
        w.emitter({ x: x(p.a - 2.1), y: 1.8, z: p.z, nx: -s, ny: 0, nz: 0, power: 0.6, reach: 10, tint: 0.2 });
        w.block(kx0, kx1, p.z - 2.5, p.z + 2.5);
        for (let i = R.int(1, 3); i > 0; i--) person(x(p.a - 3) + R.range(-0.5, 0.5), p.z + R.range(-2.5, 2.5), false);
      } else if (theme === 'sculpture') {
        const p = place(3.6, 3.6);
        if (!p) continue;
        w.props(box(x(p.a) - 0.8, x(p.a) + 0.8, G, G + 0.4, p.z - 0.8, p.z + 0.8), 0.75);
        w.props(new THREE.TorusGeometry(1.5, 0.16, 12, 48).rotateY(R.range(0, Math.PI)).translate(x(p.a), G + 2.0, p.z), 0.98);
        w.circle(x(p.a), p.z, 1.0);
      } else if (theme === 'lawn') {
        const wd = Math.min(depth - 2, R.range(6, 12)), d = Math.min(z1 - z0 - 3, R.range(8, 18));
        const p = wd > 3 && d > 4 && place(wd, d);
        if (!p) continue;
        w.props(box(x(p.a - wd / 2), x(p.a + wd / 2), G, G + 0.22, p.z - d / 2, p.z + d / 2), 0.4);
        for (let i = R.int(1, 3); i > 0; i--) tree(x(p.a + R.range(-wd / 3, wd / 3)), G + 0.22, p.z + R.range(-d / 3, d / 3), R.range(0.9, 1.3));
      } else if (theme === 'tables') {
        for (let i = R.int(2, 5); i > 0; i--) {
          const p = place(1.8, 1.8);
          if (!p) break;
          w.props(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16).translate(x(p.a), G + 0.74, p.z), 0.95);
          w.props(new THREE.CylinderGeometry(0.05, 0.05, 0.74, 6).translate(x(p.a), G + 0.37, p.z), 0.5);
          w.circle(x(p.a), p.z, 0.5);
          if (R.chance(0.7)) person(x(p.a) + R.range(-0.8, 0.8), p.z + 0.75, false);
        }
      }
    }
    for (let i = R.int(1, 4); i > 0; i--) { const p = place(0.8, 0.8); if (p) person(x(p.a), p.z, !covered); }
  }

  // ---------------------------------------------------------------- a tower
  // The glass tower: s the side; its street face at a = front, reaching back depth; along from zB to zA; a plan
  // shape; tiers set back as it rises. Returns the first tier: its top, flat front stretch, shape.
  // classic: no contemporary upper part; pilotis: its ground floor left open beneath it; base: where its ground
  // floor is; bright: [how much brighter its rooms are, up to what height]
  function tower(s, front, depth, zB, zA, h, shape, win, seed, { minTop = 0, base = 0, bright = [1, 0], classic = false, pilotis = false } = {}) {
    const x = X(s);
    const tiers = h < 60 ? 1 : R.chance(0.35) ? 1 : R.chance(0.6) ? 2 : 3;
    const r = shape === 'rounded' ? R.range(4, 9) : shape === 'chamfer' ? R.range(3, 7) : 0;
    // some of the taller towers end in something more contemporary, in place of their upper tiers
    const modern = !classic && h > 70 ? R.pick(MODERN) : null;
    const replaced = modern && modern !== 'diagrid';
    let a0 = front, d = depth, z0 = zB, z1 = zA, y = base, info = null, sh = shape;
    for (let t = 0; t < (replaced ? 1 : tiers); t++) {
      const last = t === tiers - 1 && !replaced;
      const top = replaced ? Math.max(minTop + 8, y + (h - y) * R.range(0.35, 0.55)) : last ? h : Math.max(minTop + 8, y + (h - y) * R.range(0.45, 0.7));
      const [x0, x1] = sorted(x(a0), x(a0 + d));
      const tierWin = modern === 'diagrid' && (t > 0 || tiers === 1) ? [win[0], win[1], win[2], 4] : win;
      const pts = outline(sh, x0, x1, z0, z1, r), open = pilotis && t === 0;
      w.glass(prism(pts, open ? y + LOBBY : y, top, { bottom: open }), tierWin, seed, base, bright);
      if (t === 0) {
        if (pilotis) { /* walls of its own */ }
        else if (sh === 'round') w.circle((x0 + x1) / 2, (z0 + z1) / 2, Math.min(x1 - x0, z1 - z0) / 2);
        else w.block(x0, x1, z0, z1);
        info = { top, flat: sh === 'round' ? null : [z0 + r + 0.5, z1 - r - 0.5], r, shape: sh, d, z0, z1, out: 0 };
      }
      // a line of light along the top edge of the street face
      if (last && sh !== 'round' && R.chance(0.4)) w.glow(box(x(a0 - 0.08), x(a0 + 0.1), top - 0.35, top, z0 + r + 0.3, z1 - r - 0.3), R.chance(0.5) ? CYAN : WHITE);
      y = top;
      a0 += R.range(2, 6); z0 += R.range(1.5, 4); z1 -= R.range(1.5, 4); d -= R.range(3, 8);
      if (R.chance(0.3)) sh = R.pick(['rounded', 'rect', 'chamfer']);
      if (z1 - z0 < 10 || d < 10) break;
    }
    if (replaced) modernTop(s, modern, front, depth, zB, zA, info.top, h, win, seed);
    // a slender spire with a slow beacon on some of the tallest
    if (h > 180 && R.chance(0.35)) {
      const ax = x(front + depth * 0.5), az = (zA + zB) / 2, ah = R.range(18, 40);
      w.props(new THREE.CylinderGeometry(0.12, 0.4, ah, 6).translate(ax, h + ah / 2, az), 0.8);
      w.glow(box(ax - 0.35, ax + 0.35, h + ah, h + ah + 0.7, az - 0.35, az + 0.35), WHITE, R.next() + 0.01);
    }
    // balconies (deep white floor bands) or slender vertical fins on the street face, up the first tier
    const { flat } = info;
    if (flat && win[3] === 1) {
      info.out = 1.35;   // (screens on this face must stand clear of the balconies)
      for (let k = 1, yb = base + LOBBY + win[1]; yb < info.top - 2 && k < 46; yb += win[1], k++) w.props(box(x(front - 1.3), x(front + 0.05), yb - 0.18, yb, flat[0], flat[1]), 0.92);
    } else if (flat && win[3] === 2) {
      info.out = 0.75;
      for (let zf = flat[0]; zf <= flat[1]; zf += win[0] * 2) w.props(box(x(front - 0.7), x(front), base + LOBBY, info.top, zf - 0.09, zf + 0.09), 0.88);
    }
    return info;
  }

  // Contemporary upper parts, from a tower's first tier (top y0) up to h, inside its footprint:
  //   twist       blocks of two floors, each turned a little further round the middle
  //   stack       a few boxes piled up off-centre, overhanging one another
  //   garden      every few floors a tall recessed floor round a bright core, trees at its edge
  //   green       homes stepping back every two floors, each step a terrace with planters and greenery
  //   stream      a flowing tower: an oval plan swelling and drifting floor by floor, a white band at each floor
  //   cantilever  a slim lit neck, then a great block reaching out over the street, a slimmer tower above
  function modernTop(s, kind, front, depth, zB, zA, y0, h, win, seed) {
    const Q = R, x = X(s);
    const cx = x(front + depth / 2), cz = (zA + zB) / 2;
    const hx = depth / 2 - 2.5, hz = (zA - zB) / 2 - 2.5;
    if (hx < 5 || hz < 5) return;
    const turned = (pts, th) => pts.map(([px, pz]) => [cx + (px - cx) * Math.cos(th) - (pz - cz) * Math.sin(th), cz + (px - cx) * Math.sin(th) + (pz - cz) * Math.cos(th)]);
    const rectAt = (wd, d, ox = 0, oz = 0, r = 0, sh = r ? 'rounded' : 'rect') => outline(sh, cx + ox - wd, cx + ox + wd, cz + oz - d, cz + oz + d, r);
    const shrub = (px, py, pz, big) => w.tree(px, py, pz, Q.range(2.2, 3.2) * big, Q.range(0.7, 1.0) * big, Q.chance(0.25), false);
    const homes = [win[0], win[1], Math.max(win[2], 0.55), 0];
    if (kind === 'twist') {
      const seg = win[1] * 2, n = Math.max(2, Math.ceil((h - y0) / seg)), total = Q.range(0.8, 1.6) * (Q.chance(0.5) ? 1 : -1);
      const wd = Math.min(hx, hz) * 0.95, dd = Math.max(hx, hz) * 0.8, r = Q.chance(0.5) ? 3 : 0;
      for (let k = 0; k < n; k++) {
        const ya = y0 + k * seg, yb = Math.min(h, ya + seg);
        w.glass(prism(turned(rectAt(wd, dd, 0, 0, r), (total * k) / n), ya, yb, { bottom: true }), [win[0], win[1], win[2], 0], seed);
      }
    } else if (kind === 'stack') {
      const n = Q.int(3, 5), hb = (h - y0) / n;
      for (let k = 0; k < n; k++) {
        const quarter = Q.chance(0.35);
        const wd = (quarter ? hz : hx) * Q.range(0.7, 1.05), dd = (quarter ? hx : hz) * Q.range(0.7, 1.05);
        const ox = Q.range(-3, 3), oz = Q.range(-5, 5);
        w.glass(prism(rectAt(wd, dd, ox, oz), y0 + k * hb, y0 + (k + 1) * hb, { bottom: true }), [win[0], win[1], win[2], Q.pick([0, 3])], seed);
        w.glow(box(cx + ox - wd, cx + ox + wd, y0 + (k + 1) * hb - 0.25, y0 + (k + 1) * hb, cz + oz - dd - 0.05, cz + oz - dd + 0.05), Q.chance(0.5) ? CYAN : SOFT);
      }
    } else if (kind === 'garden') {
      const block = win[1] * Q.int(3, 4), gardenH = win[1] * 2;
      for (let ya = y0; ya < h; ya += block + gardenH) {
        const yb = Math.min(h, ya + block);
        w.glass(prism(rectAt(hx, hz, 0, 0, 3), ya, yb, { bottom: ya > y0 }), win, seed);
        if (yb + gardenH >= h - 4) break;
        w.glass(prism(rectAt(hx * 0.42, hz * 0.42), yb, yb + gardenH), [win[0], win[1], 1, 3], seed, 0, [1.8, 1e4]);
        const n = Math.max(6, Math.round((hx + hz) / 3));
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + Q.range(-0.15, 0.15);
          shrub(cx + Math.cos(a) * hx * 0.86, yb, cz + Math.sin(a) * hz * 0.86, Q.range(1.6, 2.0));
        }
        for (const sz of [-1, 1]) {
          w.glow(box(cx - hx, cx + hx, yb + 0.02, yb + 0.08, cz + sz * hz - 0.05, cz + sz * hz + 0.05), CYAN);
          for (let px = cx - hx + 1; px < cx + hx - 1; px += Q.range(1.2, 2.4)) {
            const len = Q.range(1.5, 3.5);
            w.props(box(px - 0.25, px + 0.25, yb + gardenH - len, yb + gardenH, cz + sz * (hz + 0.1) - 0.15, cz + sz * (hz + 0.1) + 0.15), 0.32);
          }
        }
        for (const sx of [-1, 1]) w.glow(box(cx + sx * hx - 0.05, cx + sx * hx + 0.05, yb + 0.02, yb + 0.08, cz - hz, cz + hz), CYAN);
      }
    } else if (kind === 'green') {
      let wd = hx, dd = hz, ox = 0;
      const step = win[1] * 2;
      for (let ya = y0; ya < h - 2 && wd > 5 && dd > 5; ya += step) {
        const yb = Math.min(h, ya + step);
        w.glass(prism(rectAt(wd, dd, ox, 0), ya, yb, { bottom: ya > y0 }), homes, seed);
        const nw = wd - Q.range(1.0, 1.5), ndd = dd - Q.range(0.6, 1.2), nox = ox + s * (wd - nw);
        if (yb >= h - 2) break;
        const fx = cx + ox - s * wd;                                    // this step's street edge
        w.props(box(fx, fx + s * 0.9, yb, yb + 0.6, cz - dd + 0.3, cz + dd - 0.3), 0.36);   // planter
        for (let z = cz - dd + 1; z < cz + dd - 1; z += Q.range(2.2, 3.4)) shrub(fx + s * 0.45, yb + 0.6, z, Q.range(0.45, 0.6));
        for (let z = cz - dd + 0.6; z < cz + dd - 0.6; z += Q.range(0.8, 1.6)) {
          const len = Q.range(0.8, 2.6);
          w.props(box(fx - s * 0.12, fx + s * 0.08, yb + 0.5 - len, yb + 0.5, z - 0.2, z + 0.2), 0.3);
        }
        w.glow(box(fx - 0.04, fx + 0.04, yb - 0.08, yb - 0.02, cz - dd, cz + dd), SOFT);
        wd = nw; dd = ndd; ox = nox;
      }
    } else if (kind === 'stream') {
      const seg = win[1], n = Math.max(3, Math.ceil((h - y0) / seg));
      const p1 = Q.range(0, 6), p2 = Q.range(0, 6), swell = Q.range(0.08, 0.16), drift = Q.range(1.5, 3.5);
      const w0 = Math.min(hx, hz * 1.4), d0 = hz;
      for (let k = 0; k < n; k++) {
        const ya = y0 + k * seg, yb = Math.min(h, ya + seg), t = k / n;
        const f = 1 + swell * Math.sin(t * Math.PI * 2 + p1), ox = drift * Math.sin(t * Math.PI * 1.3 + p2);
        w.glass(prism(rectAt(w0 * f, d0 * f, ox, 0, 0, 'round'), ya, yb, { bottom: true }), [win[0] * 1.4, win[1], win[2], 0], seed);
        w.props(asProp(prism(rectAt(w0 * f + 0.45, d0 * f + 0.45, ox, 0, 0, 'round'), ya - 0.22, ya + 0.1, { bottom: true })), 0.95);
      }
    } else {
      // cantilever: the neck, the great block reaching out toward the street, a slimmer tower above
      const neck = win[1] * 2;
      w.glass(prism(rectAt(hx * 0.42, hz * 0.42), y0, y0 + neck), [win[0], win[1], 1, 3], seed, 0, [1.8, 1e4]);
      for (const sz of [-1, 1]) w.glow(box(cx - hx * 0.42, cx + hx * 0.42, y0 + neck - 0.3, y0 + neck - 0.25, cz + sz * hz * 0.42 - 0.04, cz + sz * hz * 0.42 + 0.04), CYAN);
      const reach = Math.min(Q.range(6, 11), front - FACADE + 4);
      const bh = Math.min(h - y0 - neck, Q.range(16, 28)), yb0 = y0 + neck;
      const [bx0, bx1] = sorted(x(front - reach), x(front + depth - 2));
      w.glass(prism(outline('rect', bx0, bx1, cz - hz - 1.5, cz + hz + 1.5), yb0, yb0 + bh, { bottom: true }), [win[0], win[1], win[2], 3], seed);
      for (let z = cz - hz; z <= cz + hz; z += 3) w.glow(box(bx0 + 0.5, bx1 - 0.5, yb0 - 0.06, yb0 - 0.02, z - 0.05, z + 0.05), SOFT);
      if (h - (yb0 + bh) > 10) w.glass(prism(rectAt(hx * 0.8, hz * 0.8, s * 2), yb0 + bh, h), win, seed);
    }
  }

  // ---------------------------------------------------------------- screens and signs
  // a great screen on a flat street face at a = front, from y0 and below top; returns its top (0: none).
  // show: what it shows, if not chosen here (a catalog entry: { ad } or a program: { prog })
  function faceScreen(s, front, zc, wd, y0, top, show = null) {
    const x = X(s);
    const landscape = R.chance(0.45);
    let sh, prog;
    if (landscape && R.chance(0.35)) { sh = wd / R.range(4.5, 6.5); prog = PROG.TICKER; }
    else if (landscape) { sh = wd * R.range(0.45, 0.7); prog = R.pick([PROG.RIBBONS, PROG.VORTEX, PROG.HORIZON, PROG.INTERFERENCE, PROG.BRAND, PROG.BRAND]); }
    else { sh = wd * R.range(1.3, 2.3); prog = R.pick([PROG.BLOBS, PROG.GLYPH, PROG.GLYPH, PROG.TUNNEL, PROG.CELLS, PROG.BRAND, PROG.RIBBONS]); }
    if (y0 + sh > top - 3) return 0;
    const yc = y0 + sh / 2;
    w.props(box(x(front - 0.3), x(front), yc - sh / 2 - 0.4, yc + sh / 2 + 0.4, zc - wd / 2 - 0.4, zc + wd / 2 + 0.4), 0.5);
    const g = panel(wd, sh, x(front - 0.33), yc, zc, s < 0 ? 'x' : '-x');
    if (show?.mesh) w.addMesh(show.mesh(wd, sh, x(front - 0.33), yc, zc, s < 0 ? 'x' : '-x'));
    else if (show?.ad !== undefined) w.screenAd(g, show.ad, wd, sh, R.next());
    else if (prog === PROG.BRAND && w.catalog?.brandAds.length) w.screenAd(g, R.pick(w.catalog.brandAds), wd, sh, R.next());
    else if (prog === PROG.BRAND) w.screen(g, R.pick(VFX), wd, sh, undefined, R.next());
    else {
      const rect = prog === PROG.GLYPH ? pickRect('single') : prog === PROG.TICKER ? pickRect('h') : undefined;
      w.screen(g, prog, wd, sh, rect, R.next());
    }
    const big = Math.sqrt(wd * sh);
    w.emitter({ x: x(front - 0.5), y: yc, z: zc, nx: -s, ny: 0, nz: 0, power: 1.2, reach: THREE.MathUtils.clamp(big * 2.6, 24, 70), tint: 0.6 });
    w.sight(x(front), yc, zc, big * 2.5);
    return y0 + sh;
  }

  // a curved screen round part of a circle (centre cx, cz, radius r) from angle th0 over len
  function arcScreen(cx, cz, r, th0, len, y0, sh) {
    const arc = new THREE.CylinderGeometry(r, r, sh, 28, 1, true, th0, len).translate(cx, y0 + sh / 2, cz);
    w.screen(arc, R.pick([PROG.RINGS, PROG.VORTEX, PROG.BLOBS, PROG.INTERFERENCE, PROG.RIBBONS]), r * len, sh, undefined, R.next());
    const mid = th0 + len / 2, nx = Math.sin(mid), nz = Math.cos(mid);
    w.emitter({ x: cx + nx * r, y: y0 + sh / 2, z: cz + nz * r, nx, ny: 0, nz, power: 1.25, reach: 46, tint: 0.65 });
    w.sight(cx + nx * r, y0 + sh / 2, cz + nz * r, 60);
  }

  // the lobby's light, and (span long enough, now and then) a glass canopy over the way in with a little sign on
  // its edge; name: a name to show on it in white light instead (a floating sign of words alone)
  function entrance(s, front, zc, span, { name = null, canopy = null } = {}) {
    const x = X(s);
    w.emitter({ x: x(front - 0.6), y: 2.6, z: zc, nx: -s, ny: 0, nz: 0, power: 0.7, reach: 12, tint: 0.25 });
    const named = () => name && w.holoSign({ x: x(front - 2.95), y: 4.62 + 0.42 * 1.3, z: zc, text: name, rotY: s < 0 ? Math.PI / 2 : -Math.PI / 2, size: 1.2, white: true });
    if (span < 10 || !(canopy ?? R.chance(0.7))) { named(); return null; }
    const cw = Math.min(span - 2, R.range(7, 12));
    w.props(box(x(front - 3), x(front), 4.5, 4.62, zc - cw / 2, zc + cw / 2), 0.95);
    w.glow(box(x(front - 3.03), x(front - 2.97), 4.48, 4.64, zc - cw / 2, zc + cw / 2), SOFT);
    if (!name && R.chance(0.55) && words('h').length) {
      const rect = pickRect('h'), hh = 0.55, ww = Math.min(cw * 0.8, hh * rectAspect(rect) * 0.95);
      w.screen(panel(ww, hh, x(front - 3.06), 4.9, zc, s < 0 ? 'x' : '-x'), PROG.TEXT, ww, hh, rect, R.next());
    }
    named();
    return { width: cw };
  }

  // a slim blade sign by a door on the street line
  function bladeSign(s, front, zc) {
    if (!words('v').length) return;
    const x = X(s), rect = pickRect('v');
    const bw = 1.8, bh = THREE.MathUtils.clamp(bw / rectAspect(rect) * 0.9, 4, 9), by = R.range(5.8, 9);
    const xa = front - 2.3, xb = front - 0.3, xm = x((xa + xb) / 2), seedS = R.next();
    w.props(box(x(xa), x(xb), by - 0.12, by + bh + 0.12, zc - 0.12, zc + 0.12), 0.8);
    w.props(box(x(xb), x(front), by + bh * 0.5 - 0.05, by + bh * 0.5 + 0.05, zc - 0.06, zc + 0.06), 0.6);
    for (const face of ['z', '-z']) {
      w.screen(panel(bw - 0.2, bh, xm, by + bh / 2, zc + (face === 'z' ? 0.13 : -0.13), face), PROG.TEXT, bw - 0.2, bh, rect, seedS);
      w.emitter({ x: xm, y: by + bh / 2, z: zc + (face === 'z' ? 0.4 : -0.4), nx: 0, ny: 0, nz: face === 'z' ? 1 : -1, power: 0.6, reach: 10, tint: 0.5 });
    }
  }

  // ---------------------------------------------------------------- a plot
  // One plot on side s, zB..zA along the street. name: its own (its random numbers come from it); o: what it is
  // to be, where not left to chance: { type, height, shape, quiet (no screens, no signs), name (an office's, over its
  // door), shops ([{ z0, z1, spec }]: shops in its ground floor, kit/shops.js; the tower over them on columns) }
  function plot(s, zB, zA, name, o = {}) {
    R = w.rng(name);
    const x = X(s), wd = zA - zB;
    const roll = R.next();
    const type = o.type ?? (roll < 0.28 ? 'line' : roll < 0.52 ? 'forecourt' : roll < 0.78 ? 'plaza' : 'podium');
    const hr = R.next();
    const h = o.height ?? (hr < 0.18 ? R.range(32, 60) : hr < 0.75 ? R.range(60, 170) : R.range(170, 320));
    const win = newWin(), seed = R.next();
    let shape = o.shape ?? R.pick(['rect', 'rect', 'rounded', 'rounded', 'chamfer', 'round']);
    if (shape === 'round' && wd < 26) shape = 'rounded';
    const shopping = !!o.shops?.length;
    if ((o.shop || shopping) && shape !== 'rect') shape = 'rect';
    const depth = R.range(26, 42);
    const quiet = !!o.quiet;
    let record;
    if (type === 'podium') {
      // a low glass podium on the street line, a garden on its roof, the tower set well back on it
      const pf = FACADE + R.range(0, 1.5), ph = R.range(9, 16);
      const [x0, x1] = sorted(x(pf), x(pf + depth + 12));
      const podWin = [win[0], win[1], R.range(0.5, 0.9), 3], podSeed = R.next();
      w.glass(prism(outline('rect', x0, x1, zB, zA), 0, ph), podWin, podSeed);
      w.block(x0, x1, zB, zA);
      w.glow(box(x(pf - 0.05), x(pf + 0.1), ph, ph + 1.0, zB + 0.5, zA - 0.5), DIM);   // the roof garden's glass rail
      const tf = pf + R.range(8, 14);
      for (let z = zB + 3; z < zA - 2; z += R.range(5, 8)) tree(x(pf + R.range(2, tf - pf - 2)), ph, z, 0.75);
      if (!o.shop) entrance(s, pf, (zA + zB) / 2, wd, { name: o.name });
      if (!quiet && wd > 14 && R.chance(0.6)) faceScreen(s, pf, (zA + zB) / 2, Math.min(wd * 0.6, 24), R.range(5.6, 6.5), ph);
      let hung = ph;
      const info = tower(s, tf, depth, zB + R.range(1, 4), zA - R.range(1, 4), Math.max(h, ph + 40), shape === 'round' ? 'rounded' : shape, win, seed, { minTop: ph });
      if (!quiet && info.flat && info.flat[1] - info.flat[0] > 10 && R.chance(0.6)) {
        const fw = info.flat[1] - info.flat[0];
        hung = Math.max(hung, faceScreen(s, tf - info.out, (info.flat[0] + info.flat[1]) / 2, Math.min(34, fw * R.range(0.6, 0.9)), ph + R.range(4, 20), info.top));
      }
      record = { s, zB, zA, front: tf, face: pf, top: info.top, back: pf + depth + 12, info, hung, type };
    } else {
      const setback = o.shop ? R.range(0, 1.5) : type === 'line' ? R.range(0, 1.5) : type === 'forecourt' ? R.range(4, 9) : R.range(13, 26);
      const front = FACADE + setback;
      const cantilever = type === 'plaza' && shape !== 'round' && R.chance(0.45);
      const info = tower(s, front, depth, zB, zA, h, shape, win, seed, { classic: !!o.shop || shopping, pilotis: shopping });
      let screenTop = LOBBY, arcTop = 0;
      if (shopping) {
        shopsGround(w, R, s, front, depth, zB, zA, o.shops);
        // each brand's own ad high on the tower over its shop (one ad a plot)
        const sp = o.shops.find((q) => q.spec.brand && brandOf(w, q.spec.brand));
        if (sp && w.catalog && info.flat && info.flat[1] - info.flat[0] > 12) {
          const t = faceScreen(s, front - info.out, THREE.MathUtils.clamp((sp.z0 + sp.z1) / 2, info.flat[0] + 6, info.flat[1] - 6), 10, LOBBY + R.range(6, 12), info.top, { ad: w.catalog.brandAd(sp.spec.brand) });
          if (t) screenTop = Math.max(screenTop, t);
        }
      }
      if (cantilever) {
        // the upper floors reach out over the plaza on slender columns: a covered square beneath
        const yc = R.range(11, 16), hc = win[1] * R.int(2, 5);
        const ca = FACADE + R.range(1.5, 3), cz0 = zB + 2, cz1 = zA - 2;
        const [x0, x1] = sorted(x(ca), x(front + 6));
        w.glass(prism(outline('rect', x0, x1, cz0, cz1), yc, yc + hc, { bottom: true }), win, seed);
        const bays = Math.max(1, Math.round((cz1 - cz0 - 2) / 9));
        for (let i = 0; i <= bays; i++) {
          const z = cz0 + 1 + (cz1 - cz0 - 2) * (i / bays);
          w.props(new THREE.CylinderGeometry(0.22, 0.22, yc, 10).translate(x(ca + 0.8), yc / 2, z), 0.9);
          w.circle(x(ca + 0.8), z, 0.3);
        }
        for (let a = ca + 1.5; a < front - 1; a += 3) w.glow(box(x(a) - 0.06, x(a) + 0.06, yc - 0.06, yc - 0.01, cz0 + 1, cz1 - 1), SOFT);
        w.emitter({ x: x((ca + front) / 2), y: yc - 0.5, z: (cz0 + cz1) / 2, nx: 0, ny: -1, nz: 0, power: 0.75, reach: 16, tint: 0.2 });
        w.cover(x(ca), x(front), cz0, cz1, yc);
        screenTop = yc + hc + 2;
        if (!quiet && R.chance(0.6)) faceScreen(s, ca, (cz0 + cz1) / 2, Math.min(cz1 - cz0 - 4, R.range(14, 26)), yc + 0.6, yc + hc + 0.4);
      }
      if (!o.shop && !shopping) entrance(s, front, (zA + zB) / 2, wd, { name: o.name });
      if (type !== 'line' && !o.shop && !shopping) furnish(s, FACADE + 0.6, front - 1.5, zB + 1, zA - 1, cantilever);
      // screens: flat ones on the street face, or curved round a rounded corner or a round tower
      if (!quiet && info.flat && info.flat[1] - info.flat[0] > 10) {
        const fw = info.flat[1] - info.flat[0];
        for (let k = 0; k < (h > 110 ? 2 : 1); k++) {
          if (!R.chance(k ? 0.45 : 0.8)) continue;
          const sw = Math.min(36, fw * R.range(0.6, 0.92));
          const zc = (info.flat[0] + info.flat[1]) / 2 + R.range(-1, 1) * (fw - sw) * 0.4;
          const y0 = k ? Math.max(screenTop + 4, R.range(50, 110)) : Math.max(screenTop + 3, R.range(7, 30));
          const t = faceScreen(s, front - info.out, zc, sw, y0, info.top);
          if (t) screenTop = t;
        }
      }
      if (!quiet && info.shape === 'rounded' && info.r >= 5 && R.chance(0.4)) {
        const dz = R.chance(0.5) ? 1 : -1;
        const cz = dz > 0 ? info.z1 - info.r : info.z0 + info.r;
        const thx = -s * Math.PI / 2, thz = dz > 0 ? 0 : (s < 0 ? Math.PI : -Math.PI);
        const y0 = Math.max(screenTop + 3, R.range(8, 26)), sh = R.range(14, 28);
        if (y0 + sh < info.top - 3) { arcScreen(x(front + info.r), cz, info.r + 0.45, Math.min(thx, thz), Math.PI / 2, y0, sh); arcTop = y0 + sh; }
      } else if (!quiet && info.shape === 'round' && R.chance(0.6)) {
        const rad = Math.min(info.d, info.z1 - info.z0) / 2;
        const y0 = R.range(9, 26), sh = R.range(14, 30);
        if (y0 + sh < info.top - 3) { arcScreen(x(front + info.d / 2), (info.z0 + info.z1) / 2, rad + 0.45, -s * Math.PI / 2 - 0.75, 1.5, y0, sh); arcTop = y0 + sh; }
      }
      if (!quiet && !o.shop && !shopping && type === 'line' && wd > 8 && R.chance(0.3)) bladeSign(s, front, zB + 3 + R.next() * (wd - 6));
      record = { s, zB, zA, front, face: front, top: info.top, back: front + depth, info, hung: Math.max(screenTop, arcTop), type };
    }
    return record;
  }

  // A wall of ads: the street face of a plot's tower (its first tier's flat part) filled nearly edge to edge with
  // banners, from y0 up: rows of them, now one across, now two side by side, the brands' own ads and the motion
  // graphics, every third place left as the tower's own glass. p: what plot() returned (best a quiet one).
  function adWall(p, name, { y0 = Math.max(p.hung + 2, 7), y1 = Math.min(p.top - 3, 90) } = {}) {
    const info = p.info;
    if (!info?.flat) return;
    R = w.rng(name);
    const s = p.s, x = X(s), a = p.front - info.out, gap = 0.7;
    const [f0, f1] = [info.flat[0] + 0.4, info.flat[1] - 0.4];
    if (f1 - f0 < 8) return;
    const brands = w.catalog?.brandAds ?? [];
    const programs = [PROG.RIBBONS, PROG.BLOBS, PROG.HORIZON, PROG.INTERFERENCE, PROG.CELLS, PROG.VORTEX, PROG.GLYPH, PROG.TICKER];
    let placed = 0;
    const put = (z0, z1, ya, yb) => {
      if (z1 - z0 < 2.5 || yb - ya < 2) return;
      if (placed++ % 3 === 1) return;   // (the tower's own glass)
      const wd = z1 - z0, h = yb - ya, zc = (z0 + z1) / 2, yc = (ya + yb) / 2;
      w.props(box(x(a - 0.28), x(a), yc - h / 2 - 0.25, yc + h / 2 + 0.25, zc - wd / 2 - 0.25, zc + wd / 2 + 0.25), 0.45);
      const g = panel(wd, h, x(a - 0.31), yc, zc, s < 0 ? 'x' : '-x');
      if (brands.length && R.chance(0.6)) w.brandAd(wd, h, x(a - 0.31), yc, zc, s < 0 ? 'x' : '-x', R.pick(brands), R.next());   // (its case, if it has one)
      else {
        const prog = wd / h > 4 ? PROG.TICKER : R.pick(programs);
        w.screen(g, prog, wd, h, prog === PROG.GLYPH ? pickRect('single') : prog === PROG.TICKER ? pickRect('h') : undefined, R.next());
      }
      w.emitter({ x: x(a - 0.5), y: yc, z: zc, nx: -s, ny: 0, nz: 0, power: 1.0, reach: THREE.MathUtils.clamp(Math.sqrt(wd * h) * 2.4, 16, 50), tint: 0.5 });
    };
    for (let y = y0; y < y1 - 3;) {
      const h = Math.min(R.range(5, 8), y1 - y);
      if (h > 2.5) {
        if (f1 - f0 > 22 && R.chance(0.6)) {
          const zm = f0 + (f1 - f0) * R.range(0.4, 0.6);
          put(f0, zm - gap / 2, y, y + h);
          put(zm + gap / 2, f1, y, y + h);
        } else put(f0, f1, y, y + h);
      }
      y += h + gap;
    }
    w.sight(x(a), (y0 + y1) / 2, (f0 + f1) / 2, 40);
  }

  // a narrow gap between plots: a garden alley, trees and a bench, closed at the back by a low glass building
  function pocket(s, z0, z1, name) {
    R = w.rng(name);
    const x = X(s), zc = (z0 + z1) / 2;
    tree(x(FACADE + R.range(3, 6)), CURB, zc + R.range(-1, 1), R.range(0.8, 1.1));
    if (R.chance(0.6)) tree(x(FACADE + R.range(10, 16)), CURB, zc + R.range(-1, 1), R.range(0.8, 1.1));
    if (z1 - z0 > 6) bench(x(FACADE + R.range(6, 9)), zc + (z1 - z0) / 4, 1.6);
    w.glow(box(x(FACADE + 1), x(FACADE + 22), CURB, CURB + 0.02, zc - 0.04, zc + 0.04), SOFT);   // a line of light along the path
    if (R.chance(0.5)) person(x(FACADE + R.range(2, 10)), zc + R.range(-1, 1));
    const [x0, x1] = sorted(x(FACADE + 23), x(FACADE + 60));
    w.glass(prism(outline('rect', x0, x1, z0 - 1, z1 + 1), 0, R.range(14, 36)), newWin(), R.next());
    w.block(x0, x1, z0 - 1, z1 + 1);
    w.emitter({ x: x(FACADE + 22.5), y: 2.6, z: zc, nx: -s, ny: 0, nz: 0, power: 0.5, reach: 9, tint: 0.25 });
  }

  // a tower further back, rising over the front ones and fading into the clouds (a: how far back it starts)
  function backTower(s, a, zB, zA, name) {
    R = w.rng(name);
    const x = X(s), d = R.range(26, 52), h = R.range(140, 440);
    const [x0, x1] = sorted(x(a), x(a + d));
    const win = newWin(), seed = R.next();
    const kind = R.pick(MODERN), cut = kind && kind !== 'diagrid' ? h * 0.62 : h;
    w.glass(prism(outline(R.pick(['rect', 'rounded', 'round', 'chamfer']), x0, x1, zB, zA, 8), 0, cut), kind === 'diagrid' ? [win[0], win[1], win[2], 4] : win, seed);
    if (cut < h) modernTop(s, kind, a, d, zB, zA, cut, h, win, seed);
    if (R.chance(0.35)) w.glow(box(x(a - 0.1), x(a + 0.2), cut - 0.5, cut, zB + 6, zA - 6), R.chance(0.5) ? CYAN : WHITE);
    return { s, zB, zA, front: a, back: a + d, top: h };
  }

  return { plot, pocket, backTower, adWall, tower, modernTop, faceScreen, arcScreen, entrance, bladeSign, furnish, tree, planterTree, bench, setGround: (y) => { G = y; } };
}
