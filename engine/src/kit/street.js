// A street: a straight paved road from one point to another, any way, with kerbs, lamps and trees along both
// sides, and the city along it: plots of towers (kit/buildings.js), now and then a garden alley, taller towers
// further back. Where other streets cross it, its kerbs, lamps, trees and buildings keep clear of theirs; where
// buildings of two streets would stand on each other (at a corner), the later street's give way.
// A street's own frame: its start at the origin, its way along local -z, its right at local +x.

import * as THREE from 'three';
import { box } from './geometry.js';
import { makeBuilder, SOFT } from './buildings.js';
import { bridges, floatingSigns, furniture } from './streetlife.js';
import { CURB, LAMP_HEAD_Y } from '../core/constants.js';

// a street as the district gives it, made whole: { id, from, to, road (half width of its road), walk (its
// pavement's width), lamps, trees, buildings, back (towers further back) }
export function normalizeStreet(s, index) {
  const [x0, z0] = s.from, [x1, z1] = s.to;
  const len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
  const halfRoad = s.road ?? 7, walk = s.walk ?? 6;
  return {
    ...s, index, id: s.id ?? `street-${index}`, from: [x0, z0], to: [x1, z1], len, dx, dz, nx: -dz, nz: dx,   // (n: its right)
    halfRoad, walk, facade: halfRoad + walk, yaw: Math.atan2(-dx, -dz),
    lamps: s.lamps !== false, trees: s.trees !== false, buildings: s.buildings !== false, back: s.back !== false,
  };
}

// where along the line from p (world x, z) the way (dx, dz) runs within the band of street o, |across o| < half
// (and within o's length, give or take pad): [u0, u1] in metres along the line, or null
export function bandInterval(px, pz, dx, dz, o, half, pad = 0) {
  const a0 = (px - o.from[0]) * o.nx + (pz - o.from[1]) * o.nz, da = dx * o.nx + dz * o.nz;
  if (Math.abs(da) < 1e-4) return null;   // (parallel)
  let u0 = (-half - a0) / da, u1 = (half - a0) / da;
  if (u0 > u1) [u0, u1] = [u1, u0];
  // and within o's length (its along at u is linear too)
  const b0 = (px - o.from[0]) * o.dx + (pz - o.from[1]) * o.dz, db = dx * o.dx + dz * o.dz;
  if (Math.abs(db) > 1e-4) {
    let v0 = (-pad - b0) / db, v1 = (o.len + pad - b0) / db;
    if (v0 > v1) [v0, v1] = [v1, v0];
    u0 = Math.max(u0, v0); u1 = Math.min(u1, v1);
  } else if (b0 < -pad || b0 > o.len + pad) return null;
  return u0 < u1 ? [u0, u1] : null;
}

// a line along street st at across a (its right +), from 0 to its length: the stretches clear of every other
// street's band (half: of that street, how far either side of its middle to keep clear)
function clearStretches(st, a, others, half, pad = 0) {
  const px = st.from[0] + st.nx * a, pz = st.from[1] + st.nz * a, cut = [];
  for (const o of others) {
    const iv = bandInterval(px, pz, st.dx, st.dz, o, half(o), pad);
    if (iv) cut.push(iv);
  }
  cut.sort((p, q) => p[0] - q[0]);
  const out = [];
  let u = 0;
  for (const [c0, c1] of cut) {
    if (c0 > u) out.push([u, Math.min(c0, st.len)]);
    u = Math.max(u, c1);
  }
  if (u < st.len) out.push([u, st.len]);
  return out.filter(([p, q]) => q - p > 0.05);
}
const within = (u, list) => list.some(([p, q]) => u >= p && u <= q);

// a rectangle in the world (its four corners) overlapping another? (separating axes; touching is not overlapping)
export function overlaps(a, b) {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % 4], nx = -(z1 - z0), nz = x1 - x0;
      const proj = (p) => p.map(([x, z]) => x * nx + z * nz);
      const pa = proj(a), pb = proj(b);
      const eps = 1e-3 * Math.hypot(nx, nz);
      if (Math.max(...pa) <= Math.min(...pb) + eps || Math.max(...pb) <= Math.min(...pa) + eps) return false;
    }
  }
  return true;
}

// Build street st (normalized) in the world; streets: all of them (normalized); footprints: the rectangles
// buildings already stand on (world corners), added to as this street builds
export function buildStreet(w, st, streets, footprints) {
  const others = streets.filter((o) => o !== st);
  const record = { ...st, plots: [] };
  w.streets.push(record);
  w.frame(st.from[0], st.from[1], st.yaw - w.yaw(), () => {
    const L = st.len, h = st.halfRoad, F = st.facade;
    // ---- the road and its kerbs
    w.groundPiece('road', new THREE.PlaneGeometry(2 * h, L).rotateX(-Math.PI / 2).translate(0, 0, -L / 2), { local: (x, z) => [x, -z], halfRoad: h, index: st.index });
    w.road(0, -L / 2, 0, -1, L / 2, h);
    for (const s of [-1, 1]) {
      for (const [u0, u1] of clearStretches(st, s * (h + 0.15), others, (o) => o.halfRoad, 0.5)) {
        w.props(box(s * h, s * (h + 0.3), 0, CURB, -u1, -u0), 0.72);
      }
    }
    // ---- lamps along both sides (the right side's half a step on), a tree halfway between
    for (const s of [-1, 1]) {
      const lampsClear = clearStretches(st, s * (h + 0.6), others, (o) => o.halfRoad + 3, 3);
      const treesClear = clearStretches(st, s * (h + 1.7), others, (o) => o.halfRoad + 3, 3);
      const R = w.rng(`${st.id}:lamps:${s}`);
      for (let u = (s > 0 ? 16 : 0) + 4; u < L - 2; u += 32) {
        if (st.lamps && within(u, lampsClear)) {
          const px = s * (h + 0.6), hx = s * (h - 1.4), z = -u;
          w.props(new THREE.CylinderGeometry(0.07, 0.11, LAMP_HEAD_Y + 0.3, 8).translate(px, CURB + (LAMP_HEAD_Y + 0.3) / 2, z), 0.7);
          w.props(box(px, hx - s * 0.5, LAMP_HEAD_Y + 0.2, LAMP_HEAD_Y + 0.28, z - 0.05, z + 0.05), 0.7);
          w.props(box(hx - 0.8, hx + 0.8, LAMP_HEAD_Y - 0.02, LAMP_HEAD_Y + 0.12, z - 0.12, z + 0.12), 0.7);
          w.glow(box(hx - 0.75, hx + 0.75, LAMP_HEAD_Y - 0.05, LAMP_HEAD_Y - 0.02, z - 0.09, z + 0.09), [3, 3.2, 3.2]);
          w.lamp(hx, LAMP_HEAD_Y - 0.2, z);
          w.circle(px, z, 0.2);
          w.beam(new THREE.CylinderGeometry(0.4, 5.8, LAMP_HEAD_Y - 0.2, 20, 1, true).translate(hx, (LAMP_HEAD_Y - 0.2) / 2, z));
        }
        const ut = u + 16;
        if (st.trees && ut < L - 2 && within(ut, treesClear)) {
          const big = R.range(0.95, 1.2);
          w.tree(s * (h + 1.7), CURB, -ut, R.range(5, 7.5) * big, R.range(1.5, 2.2) * big, R.chance(0.45), R.chance(0.3));
          w.circle(s * (h + 1.7), -ut, 0.35);
        }
      }
    }
    // ---- over the pavements and along the kerbs: floating signs, flower beds, rain shelters
    const signsClear = [-1, 1].map((s) => clearStretches(st, s * (h + st.walk * 0.5), others, (o) => o.facade + 3, 3));
    floatingSigns(w, st, (s, u) => within(u, signsClear[s < 0 ? 0 : 1]));
    const stripClear = [-1, 1].map((s) => clearStretches(st, s * (h + 1.5), others, (o) => o.facade + 2, 3));
    furniture(w, st, (s, u0, u1) => stripClear[s < 0 ? 0 : 1].some(([p, q]) => u0 >= p && u1 <= q));
    // ---- the buildings
    if (!st.buildings) return;
    const B = makeBuilder(w, st);
    const DEEP = 58;   // how far back a plot may reach from the street line
    const rectAt = (s, a0, a1, z0, z1) => [w.toWorld(s * a0, z0), w.toWorld(s * a1, z0), w.toWorld(s * a1, z1), w.toWorld(s * a0, z1)];
    const free = (rect) => !footprints.some((f) => overlaps(f, rect))
      && !others.some((o) => overlaps(rect, corridor(o)));
    for (const s of [-1, 1]) {
      // the stretches of its front clear of the other streets (their pavements and a margin), at the street line
      // and at the back of the plots, taken together
      const near = clearStretches(st, s * F, others, (o) => o.facade + 2, 6), far = clearStretches(st, s * (F + DEEP), others, (o) => o.facade + 2, 6);
      const stretches = [];
      for (const [p0, p1] of near) for (const [q0, q1] of far) { const a = Math.max(p0, q0), b = Math.min(p1, q1); if (b - a > 14) stretches.push([a, b]); }
      let k = 0;
      const offices = w.atlas?.words.offices ?? [];
      // the shops the district puts on this side: [a0, a1] along the street (u - width / 2 .. u + width / 2)
      const shops = (st.shops || []).filter((sh) => (sh.side ?? 1) === s)
        .map((sh) => ({ spec: sh, a0: sh.u - (sh.width ?? 12) / 2, a1: sh.u + (sh.width ?? 12) / 2, placed: false })).sort((p, q) => p.a0 - q.a0);
      const waiting = (from, to) => shops.filter((sh) => !sh.placed && sh.a0 < to && sh.a1 > from);
      for (const [u0, u1] of stretches) {
        const R = w.rng(`${st.id}:front:${s}:${Math.round(u0)}`);
        let u = u0;
        while (u1 - u > 14) {
          let wd = R.range(24, 52);
          if (u1 - u - wd < 20) wd = u1 - u;
          // a plot reaching into a shop holds it whole (a shop begun before it is moved on to begin in it)
          const reached = waiting(u, u + wd);
          // (and those after it moved on as far, in order, so that none comes to overlap another)
          let floor = u + 0.6;
          for (const sh of shops) {
            if (sh.placed || sh.a1 <= u) continue;
            if (sh.a0 < floor) { sh.a1 += floor - sh.a0; sh.a0 = floor; }
            floor = sh.a1 + 0.4;
          }
          if (reached.length) {
            const end = Math.max(...reached.map((sh) => sh.a1)) + 1.5;
            if (end > u + wd) wd = Math.min(u1 - u, end - u);
            if (u1 - u - wd < 14) wd = u1 - u;
          }
          const held = reached.filter((sh) => sh.a1 <= u + wd - 0.5);
          const zA = -u, zB = -(u + wd), rect = rectAt(s, F, F + DEEP, zB, zA);
          // (something in the way: a little further on, and try again, so that the plots come up close to it)
          if (!free(rect)) { u += Math.min(wd, 5); continue; }
          {
            const id = `${st.id}:plot:${s}:${k++}`;
            let p;
            if (held.length) {
              held.forEach((sh) => { sh.placed = true; });
              p = B.plot(s, zB, zA, id, { type: 'line', shops: held.map((sh) => ({ z0: -sh.a1, z1: -sh.a0, spec: sh.spec })) });
            } else {
              // now and then a tower given over to a wall of ads; some with an office's name over the door
              const wall = R.chance(st.adWalls ?? 0.12), name = offices.length && R.chance(0.3) ? R.pick(offices) : null;
              p = B.plot(s, zB, zA, id, wall ? { type: 'line', shape: 'rect', quiet: true, name } : { name });
              if (wall) B.adWall(p, `${id}:ads`);
            }
            footprints.push(rect);
            record.plots.push({ ...p, street: st.id });
            w.plots.push({ ...p, street: st.id });
          }
          u += wd;
          if (u1 - u > 20 && R.chance(0.4)) {
            const gap = R.range(5, 11), prect = rectAt(s, F, F + 60, -(u + gap), -u);
            if (waiting(u, u + gap + 1).length) continue;   // (no garden alley where a shop is to be)
            if (free(prect)) { B.pocket(s, -(u + gap), -u, `${st.id}:pocket:${s}:${k++}`); footprints.push(prect); }
            u += gap;
          }
        }
      }
      for (const sh of shops) if (!sh.placed) console.warn(`street ${st.id}: no room for the shop at ${sh.spec.u} (side ${s}); a crossing, or something placed there?`);
    }
    // ---- bridges over the street between its towers
    bridges(w, st, record.plots);
  });
  return record;
}

// The towers further back along street st, rising over the front ones: built after every street's front, so that
// one street's back towers never stand where another's front would be
export function buildBackTowers(w, st, streets, footprints) {
  if (!st.back || !st.buildings) return;
  const others = streets.filter((o) => o !== st);
  w.frame(st.from[0], st.from[1], st.yaw - w.yaw(), () => {
    const B = makeBuilder(w, st), F = st.facade, L = st.len;
    const rectAt = (s, a0, a1, z0, z1) => [w.toWorld(s * a0, z0), w.toWorld(s * a1, z0), w.toWorld(s * a1, z1), w.toWorld(s * a0, z1)];
    const free = (rect) => !footprints.some((f) => overlaps(f, rect)) && !others.some((o) => overlaps(rect, corridor(o)));
    for (const s of [-1, 1]) {
      const R = w.rng(`${st.id}:back:${s}`);
      for (let u = 0; u < L; u += R.range(45, 80)) {
        const a = F + R.range(82, 187), wd = R.range(26, 52), d = 52;
        const rect = rectAt(s, a, a + d, -(u + wd), -u);
        if (u + wd > L || !free(rect)) continue;
        B.backTower(s, a, -(u + wd), -u, `${st.id}:back:${s}:${Math.round(u)}`);
        footprints.push(rect);
      }
    }
  });
}

// the ground a street keeps clear (its road and pavements), as a rectangle in the world
export function corridor(o, pad = 1) {
  const a = o.facade + pad, ex = 0;
  const p = (u, v) => [o.from[0] + o.dx * u + o.nx * v, o.from[1] + o.dz * u + o.nz * v];
  return [p(-ex, -a), p(o.len + ex, -a), p(o.len + ex, a), p(-ex, a)];
}
export { SOFT };
