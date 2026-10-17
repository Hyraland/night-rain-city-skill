// Geometry helpers and the bins everything static is merged into.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// A geometry with constant per-vertex attributes added (values: name -> number or array).
export function tag(geom, values) {
  const n = geom.attributes.position.count;
  for (const [name, v] of Object.entries(values)) {
    const a = Array.isArray(v) ? v : [v];
    const data = new Float32Array(n * a.length);
    for (let i = 0; i < n; i++) data.set(a, i * a.length);
    geom.setAttribute(name, new THREE.BufferAttribute(data, a.length));
  }
  return geom;
}

// an axis-aligned box from x0..x1, y0..y1, z0..z1 (either order)
export const box = (x0, x1, y0, y1, z0, z1) =>
  new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0))
    .translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

// a plane w x h centred at (x, y, z), facing along +x (face 'x'), -x ('-x'), +z ('z') or -z ('-z')
export function panel(w, h, x, y, z, face) {
  const g = new THREE.PlaneGeometry(w, h);
  if (face === 'x') g.rotateY(Math.PI / 2);
  else if (face === '-x') g.rotateY(-Math.PI / 2);
  else if (face === '-z') g.rotateY(Math.PI);
  return g.translate(x, y, z);
}

export const sorted = (p, q) => (p < q ? [p, q] : [q, p]);
export const xzBox = (x0, x1, z0, z1) => ({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
// a turn about the vertical that makes a plane face face ('x', '-x', 'z', '-z')
export const FACE_TURN = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 };

// a prism made into a solid prop (white bands, slabs, terraces): props need uvs and an index, not aU
export function asProp(g) {
  g.deleteAttribute('aU');
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.setIndex([...Array(g.attributes.position.count).keys()]);
  return g;
}

// The plan of a building, as points round it in the x-z plane: a rectangle, one with rounded or cut
// corners (r), or an ellipse filling the rectangle.
export function outline(shape, x0, x1, z0, z1, r = 0) {
  const pts = [];
  if (shape === 'round') {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rx = (x1 - x0) / 2, rz = (z1 - z0) / 2;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]);
    }
  } else if (shape === 'rounded') {
    r = Math.min(r, (x1 - x0) / 2 - 0.2, (z1 - z0) / 2 - 0.2);
    for (const [cx, cz, a0] of [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, 0.5], [x0 + r, z0 + r, 1], [x1 - r, z0 + r, 1.5]]) {
      for (let k = 0; k <= 6; k++) {
        const a = (a0 + k / 12) * Math.PI;
        pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
      }
    }
  } else if (shape === 'chamfer') {
    const c = Math.min(r, (x1 - x0) / 3, (z1 - z0) / 3);
    pts.push([x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c], [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]);
  } else {
    pts.push([x0, z0], [x1, z0], [x1, z1], [x0, z1]);
  }
  return pts;
}

// A vertical prism on a plan: flat glass panels round it (aU: the distance along the wall, running the
// way the glass shader expects), a roof, and if asked an underside.
export function prism(pts, y0, y1, { bottom = false } = {}) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    area += ax * bz - bx * az;
  }
  if (area > 0) pts = [...pts].reverse(); // so that (-t.z, t.x) points outward
  const pos = [], nrm = [], us = [];
  const vert = (x, y, z, n, u) => { pos.push(x, y, z); nrm.push(...n); us.push(u); };
  let u = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 1e-4) continue;
    const n = [-(bz - az) / len, 0, (bx - ax) / len];
    vert(ax, y0, az, n, u); vert(bx, y0, bz, n, u + len); vert(bx, y1, bz, n, u + len);
    vert(ax, y0, az, n, u); vert(bx, y1, bz, n, u + len); vert(ax, y1, az, n, u);
    u += len;
  }
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const cap = (y, up) => {
    for (let i = 0; i < pts.length; i++) {
      let [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
      // counter-clockwise seen from the side the cap faces
      if (((az - cz) * (bx - cx) - (ax - cx) * (bz - cz) > 0) !== up) [ax, az, bx, bz] = [bx, bz, ax, az];
      const n = [0, up ? 1 : -1, 0];
      vert(cx, y, cz, n, 0); vert(ax, y, az, n, 0); vert(bx, y, bz, n, 0);
    }
  };
  cap(y1, true);
  if (bottom) cap(y0, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(us, 1));
  return g;
}

export class Bin {
  constructor() { this.parts = []; }
  // (things that glow without a brand's key (toon.js glowMaterial aKey) get 0, so that all of them merge)
  add(geom, values) {
    if ('color' in values && !('aKey' in values)) values = { ...values, aKey: 0 };
    this.parts.push(tag(geom, values));
    return geom;
  }
  get empty() { return !this.parts.length; }
  #prepare() {
    // (to merge, its parts must be all indexed or all not: where they are mixed, those without are indexed)
    if (this.parts.some((g) => g.index) && this.parts.some((g) => !g.index)) this.parts = this.parts.map((g) => (g.index ? g : mergeVertices(g)));
  }
  // one mesh of all of it, never culled (for things that move in their shaders, so their bounds are not known)
  mesh(material, layer) {
    this.#prepare();
    const geom = mergeGeometries(this.parts, false);
    this.parts.forEach((g) => g.dispose());
    const m = new THREE.Mesh(geom, material);
    m.frustumCulled = false;
    m.layers.set(layer);
    m.matrixAutoUpdate = false;
    return m;
  }
  // the same, in lots of cell x cell metres (by each part's middle), each its own mesh, culled when out of view
  // (its centre: userData.x, userData.z)
  meshes(material, layer, cell = 100) {
    this.#prepare();
    const lots = new Map();
    for (const g of this.parts) {
      g.computeBoundingBox();
      const b = g.boundingBox, i = Math.floor((b.min.x + b.max.x) / 2 / cell), k = Math.floor((b.min.z + b.max.z) / 2 / cell);
      const key = `${i},${k}`;
      if (!lots.has(key)) lots.set(key, { i, k, parts: [] });
      lots.get(key).parts.push(g);
    }
    const out = [...lots.values()].map(({ i, k, parts }) => {
      const m = new THREE.Mesh(mergeGeometries(parts, false), material);
      m.geometry.computeBoundingSphere();
      m.layers.set(layer);
      m.matrixAutoUpdate = false;
      m.userData.x = (i + 0.5) * cell;
      m.userData.z = (k + 0.5) * cell;
      return m;
    });
    this.parts.forEach((g) => g.dispose());
    return out;
  }
}
