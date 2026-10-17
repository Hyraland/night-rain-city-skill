// A district, built: its streets (kit/street.js), whatever else it places (district.build(w, kit): its own
// pieces, in frames of their own), the pavement everywhere between, and what the page needs to walk it: the roads
// for the ground's shader and the rain, lanes for the people walking, a route for the stroll, its bounds.
//
// district: {
//   seed,                                   the city's own numbers (each piece's from it and its name)
//   streets: [{ id, from: [x, z], to: [x, z], road, walk, lamps, trees, buildings, back }],
//   route: [[x, z], ...],                   the stroll's way (by default down the first street)
//   build(w, kit),                          more of the district: shops, plazas, a metro... (optional)
// }

import * as THREE from 'three';
import { createWorld } from './world.js';
import { normalizeStreet, buildStreet, buildBackTowers, corridor, overlaps } from './street.js';
import { makeBuilder } from './buildings.js';
import * as geometry from './geometry.js';
import { shared } from '../core/toon.js';
import { CURB } from '../core/constants.js';

export const MAX_ROADS = 32;

// the words the district's signs and screens may show (for kit/atlas.js): its own, and its shops' names
export function districtWords(district) {
  const words = { vertical: [], single: [], horizontal: [], offices: [], ...district.words };
  const names = (district.streets || []).flatMap((st) => (st.shops || []).map((sh) => sh.name).filter(Boolean));
  words.horizontal = [...words.horizontal, ...names.filter((n) => !words.horizontal.includes(n))];
  return { ...words, brands: district.brands || [] };
}

// statues: models for the shops' sculptures, if loaded ({ cat: a BufferGeometry }: assets/cat_statue.glb)
// models: the district's own (district.models, loaded: { name: a loaded scene }), for kit/holomodel.js
export function buildCity(district, { atlas, catalog, reflection, statues = {}, models = {} }) {
  const w = createWorld({ seed: district.seed ?? 1, atlas, catalog, reflection, statues, models });
  const streets = (district.streets || []).map(normalizeStreet);
  if (streets.length > MAX_ROADS) throw new Error(`at most ${MAX_ROADS} streets (the ground's shader cuts the pavement over each road)`);
  const footprints = [];
  // the district's own pieces first (they claim their ground: footprints), then the streets build round them
  const byId = (id) => streets.find((st) => st.id === id) || (() => { throw new Error(`no street '${id}'`); })();
  const kit = {
    streets, footprints, makeBuilder, geometry, corridor, overlaps, CURB,
    // keep the streets' buildings off a rectangle (its four world corners)
    claim: (rect) => footprints.push(rect),
    // build fn in a frame at { x, z, yaw } (its local -z the way yaw looks: yaw 0 toward -z); if fn returns
    // { claim: [x0, x1, z0, z1] } (in that frame), the streets' buildings keep off it
    place: ({ x, z, yaw = 0 }, fn) => w.frame(x, z, yaw - w.yaw(), () => {
      const r = fn();
      if (r?.claim) { const [x0, x1, z0, z1] = r.claim; footprints.push([w.toWorld(x0, z0), w.toWorld(x1, z0), w.toWorld(x1, z1), w.toWorld(x0, z1)]); }
      return r;
    }),
    // where street id's buildings would start, u metres along it, on side s (+1 its right), back a further
    // (gap); turned so that local -z looks away from the street (and +z toward it): for a piece entered from it
    beside: (id, u, s = 1, gap = 0) => {
      const st = byId(id), a = s * (st.facade + gap);
      return { x: st.from[0] + st.dx * u + st.nx * a, z: st.from[1] + st.dz * u + st.nz * a, yaw: Math.atan2(-st.nx * s, -st.nz * s) };
    },
    // a point on street id, u along it, a across (its right +), turned along it (local -z the street's way on)
    on: (id, u, a = 0) => {
      const st = byId(id);
      return { x: st.from[0] + st.dx * u + st.nx * a, z: st.from[1] + st.dz * u + st.nz * a, yaw: st.yaw };
    },
  };
  district.build?.(w, kit);
  for (const st of streets) buildStreet(w, st, streets, footprints);
  for (const st of streets) buildBackTowers(w, st, streets, footprints);
  if (district.fill !== false) fillBlocks(w, streets, footprints);

  // the bounds: round all the streets and what stands along them, and a margin
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const grow = (x, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); };
  for (const st of streets) for (const [x, z] of corridor(st)) grow(x, z);
  for (const f of footprints) for (const [x, z] of f) grow(x, z);
  if (!isFinite(x0)) { x0 = z0 = 0; x1 = z1 = 0; }
  x0 -= 250; x1 += 250; z0 -= 250; z1 += 250;
  // the pavement: one sheet over it all, at the kerb's height (the shader cuts it away over the roads)
  w.groundPiece('pavement', new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, CURB, (z0 + z1) / 2));

  // the roads, in the streets' order, for the ground's shader (each road is drawn but where an earlier one is)
  const roads = w.roads.slice(0, MAX_ROADS);
  roads.forEach((r, i) => {
    shared.uRoads.value[i].set(r.x, r.z, r.dx, r.dz);
    shared.uRoadHalf.value[i].set(r.halfLength, r.halfWidth);
  });
  shared.uRoadN.value = roads.length;

  const built = w.finish();
  // the street's own level at (x, z): the road, or up on a pavement
  const onRoad = (x, z) => roads.some((r) => {
    const dx = x - r.x, dz = z - r.z;
    return Math.abs(dx * r.dx + dz * r.dz) < r.halfLength && Math.abs(-dx * r.dz + dz * r.dx) < r.halfWidth;
  });
  const baseAt = (x, z) => (onRoad(x, z) ? 0 : CURB);
  // the people walking: both pavements of each street, clear of the lamps and trees, short of the buildings
  const lanes = [];
  for (const st of streets) {
    if (st.walk < 4) continue;
    for (const s of [-1, 1]) {
      const mid = st.halfRoad + 2.4 + (st.walk - 3.4) / 2, half = Math.max(0.3, (st.walk - 3.4) / 2 - 0.3);
      lanes.push({ x: st.from[0] + st.nx * s * mid, z: st.from[1] + st.nz * s * mid, dx: st.dx, dz: st.dz, len: st.len, nx: st.nx, nz: st.nz, a0: -half, a1: half });
    }
  }
  // the stroll: as the district says, or down the middle of its first street
  const first = streets[0];
  const route = district.route || (first ? [
    [first.from[0] + first.dx * 10, first.from[1] + first.dz * 10],
    [first.to[0] - first.dx * 10, first.to[1] - first.dz * 10],
  ] : [[0, 0], [0, -100]]);
  // the roads nearest (x, z), for the rain's splashes (core/rain.js: six)
  const nearestRoads = (x, z, n = 6) => [...roads].sort((a, b) => distToRoad(a, x, z) - distToRoad(b, x, z)).slice(0, n);
  // the mirror's height down in a sunken plaza (its floor; on its steps, the floor nearest)
  const floors = built.holes.filter((h) => h.open && h.floor < 100);
  const mirrorAt = (p) => {
    let best = null, bd = 30;
    for (const h of floors) { const d = h.contains(p.x, p.z) ? 0 : Math.hypot(p.x - h.x, p.z - h.z) - Math.max(h.halfLength, h.halfWidth); if (d < bd) { bd = d; best = h; } }
    return best ? best.floor : 0;
  };
  return { ...built, roads, lanes, route, baseAt, bounds: [x0, x1, z0, z1], nearestRoads, mirrorAt, district };
}

// The blocks between the streets, filled: towers on a loose grid wherever there is room (clear of every street's
// road and pavements, and of what stands already), as far as 220 m from the nearest street; nearer the streets
// lower, further off taller, as a city rises behind its street fronts. (district.fill: false, to leave it open)
function fillBlocks(w, streets, footprints) {
  if (!streets.length) return;
  const B = makeBuilder(w, { facade: 0, halfRoad: 0 });
  const distTo = (x, z) => Math.min(...streets.map((st) => {
    const u = (x - st.from[0]) * st.dx + (z - st.from[1]) * st.dz, v = (x - st.from[0]) * st.nx + (z - st.from[1]) * st.nz;
    return Math.hypot(Math.max(0, -u, u - st.len), Math.max(0, Math.abs(v) - st.facade));
  }));
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const st of streets) for (const [x, z] of corridor(st)) { x0 = Math.min(x0, x - 220); x1 = Math.max(x1, x + 220); z0 = Math.min(z0, z - 220); z1 = Math.max(z1, z + 220); }
  const CELL = 64;
  for (let cx = x0; cx < x1; cx += CELL) {
    for (let cz = z0; cz < z1; cz += CELL) {
      const name = `fill:${Math.round(cx)}:${Math.round(cz)}`, R = w.rng(name);
      // (its depth along x up to d, its width along z wd)
      const wd = R.range(26, 48), d = 52, x = cx + R.range(0, CELL - d), z = cz + R.range(0, CELL - wd);
      const rect = [[x, z], [x + d, z], [x + d, z + wd], [x, z + wd]];
      const far = distTo(x + d / 2, z + wd / 2);
      if (far > 220 || far < 30) continue;
      if (footprints.some((f) => overlaps(f, rect)) || streets.some((o) => overlaps(rect, corridor(o, 3)))) continue;
      // (in a frame at the rect's corner, its local -z the world's -z: side +1, from x along +x)
      w.frame(x, z + wd, 0, () => B.backTower(1, 0, -wd, 0, name));
      footprints.push(rect);
    }
  }
}

function distToRoad(r, x, z) {
  const dx = x - r.x, dz = z - r.z;
  const u = Math.max(0, Math.abs(dx * r.dx + dz * r.dz) - r.halfLength), v = Math.max(0, Math.abs(-dx * r.dz + dz * r.dx) - r.halfWidth);
  return Math.hypot(u, v);
}
