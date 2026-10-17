// People: walking along the pavements both ways under umbrellas whose rims glow, and standing or sitting
// about in the plazas, under the covered squares without. The walkers keep to their pavements (lanes), each
// to a stretch of it round where the viewer is, wrapping round at its ends, so the streets always have their
// passers-by.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { propsMaterial, glowMaterial } from './toon.js';
import { LAYER, CURB } from './constants.js';
import { makeRandom } from './rand.js';
import { canopyGeometry, rimGeometry as rimTube } from './umbrella.js';

const SPAN = 150;      // how far either side of the viewer a walker walks along its lane
const PER_LANE = 30;   // walkers on each lane

// its albedo
const tagged = (g, a) => {
  g.setAttribute('aAlbedo', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(a), 1));
  return g;
};

function bodyGeometry() {
  const parts = [
    tagged(new THREE.BoxGeometry(0.13, 0.82, 0.16).translate(-0.09, 0.41, 0), 0.35),            // legs
    tagged(new THREE.BoxGeometry(0.13, 0.82, 0.16).translate(0.09, 0.41, 0), 0.35),
    tagged(new THREE.CylinderGeometry(0.17, 0.23, 0.72, 10).translate(0, 1.1, 0), 0.55),         // coat
    tagged(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6).translate(0, 1.5, 0), 0.6),           // neck
    tagged(new THREE.SphereGeometry(0.115, 12, 8).translate(0, 1.62, 0), 0.7),                  // head
  ];
  return mergeGeometries(parts);
}
function umbrellaGeometry() {
  return mergeGeometries([
    tagged(canopyGeometry(0.6, 0.32).translate(0.05, 1.95, -0.05), 0.8),                    // (its ribs curved: umbrella.js)
    tagged(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 4).translate(0.12, 1.65, -0.08), 0.5),
  ]);
}
function rimGeometry() {
  const g = rimTube(0.6, 0.32, 0.014).translate(0.05, 1.95, -0.05);
  const n = g.attributes.position.count;
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  g.setAttribute('aBlink', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  return g;
}

// lanes: the pavements walked along, [{ x, z (where it starts), dx, dz (the way it runs), len, nx, nz (across it),
// a0, a1 (how far across, from its line, one may walk) }]; layer: where they are drawn (underground: its own)
export function buildPeople(statics, { lanes = [], perLane = PER_LANE, layer = LAYER.GLOW } = {}) {
  const R = makeRandom(41);
  const nWalk = lanes.length * perLane;
  const walkers = Array.from({ length: nWalk }, (_, i) => {
    const lane = lanes[i % lanes.length];
    return {
      lane, across: R.range(lane.a0, lane.a1), dir: R.chance(0.5) ? -1 : 1, speed: R.range(0.95, 1.55),
      off: R.next() * 2 * SPAN, phase: R.next() * 10,
    };
  });
  const withUmbrella = statics.filter((p) => p.umbrella);
  const nBodies = nWalk + statics.length, nUmb = Math.max(1, nWalk + withUmbrella.length);

  const mk = (geom, mat, n) => {
    const m = new THREE.InstancedMesh(geom, mat, n);
    m.frustumCulled = false;
    m.layers.set(layer);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return m;
  };
  const bodies = mk(bodyGeometry(), propsMaterial(), nBodies);
  const umbrellas = mk(umbrellaGeometry(), propsMaterial(), nUmb);
  const rims = mk(rimGeometry(), glowMaterial(), nUmb);
  umbrellas.count = rims.count = nWalk + withUmbrella.length;   // none at all, indoors
  // the umbrellas' rims: mostly cyan, some white, a few dim
  const col = new THREE.Color(), rimCols = [];
  for (let i = 0; i < nUmb; i++) {
    const r = R.next();
    rimCols.push(r < 0.55 ? [0.35, 1.5, 1.7] : r < 0.85 ? [1.5, 1.7, 1.7] : [0.3, 0.6, 0.7]);
    rims.setColorAt(i, col.fromArray(rimCols[i]));
  }
  const group = new THREE.Group();
  group.add(bodies, umbrellas, rims);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  // those standing about are placed once (for all of them; see near below)
  const place = () => {
    statics.forEach((p, i) => {
      m4.compose(pos.set(p.x, p.y, p.z), q.setFromAxisAngle(up, p.rot), one);
      bodies.setMatrixAt(nWalk + i, m4);
    });
    withUmbrella.forEach((p, i) => {
      m4.compose(pos.set(p.x, p.y, p.z), q.setFromAxisAngle(up, p.rot), one);
      umbrellas.setMatrixAt(nWalk + i, m4);
      rims.setMatrixAt(nWalk + i, m4);
    });
  };
  place();
  // (out on the street, only those within NEAR of the viewer drawn: they are too small to see further off; again as
  // the viewer goes on every 10 m)
  const NEAR = 260;
  let nearAt = null;
  const near = (viewer) => {
    if (nearAt && Math.hypot(viewer.x - nearAt.x, viewer.z - nearAt.z) < 10) return;
    nearAt = { x: viewer.x, z: viewer.z };
    let nb = nWalk, nu = nWalk;
    statics.forEach((p) => {
      if (Math.hypot(p.x - viewer.x, p.z - viewer.z) > NEAR) return;
      m4.compose(pos.set(p.x, p.y, p.z), q.setFromAxisAngle(up, p.rot), one);
      bodies.setMatrixAt(nb, m4);
      nb++;
      if (!p.umbrella) return;
      const k = nWalk + withUmbrella.indexOf(p);
      umbrellas.setMatrixAt(nu, m4);
      rims.setMatrixAt(nu, m4);
      rims.setColorAt(nu, col.fromArray(rimCols[k]));
      nu++;
    });
    bodies.count = nb;
    umbrellas.count = rims.count = nu;
    rims.instanceColor.needsUpdate = true;
  };

  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    group,
    // viewer: where the viewer is ({ x, z })
    update(t, viewer) {
      near(viewer);
      walkers.forEach((w, i) => {
        const L = w.lane;
        // where along its lane the viewer is, and the walker round it
        const uv = THREE.MathUtils.clamp((viewer.x - L.x) * L.dx + (viewer.z - L.z) * L.dz, 0, L.len);
        const u = (w.off + t * w.speed) % (2 * SPAN), along = w.dir > 0 ? uv - SPAN + u : uv + SPAN - u;
        if (along < 0 || along > L.len) { bodies.setMatrixAt(i, hidden); umbrellas.setMatrixAt(i, hidden); rims.setMatrixAt(i, hidden); return; }
        const step = t * w.speed * 1.6 + w.phase;
        pos.set(L.x + L.dx * along + L.nx * w.across, CURB + Math.abs(Math.sin(step * Math.PI)) * 0.035, L.z + L.dz * along + L.nz * w.across);
        const heading = Math.atan2(-L.dx * w.dir, -L.dz * w.dir);   // (facing the way it walks)
        q.setFromAxisAngle(up, heading + Math.sin(step * Math.PI) * 0.03);
        m4.compose(pos, q, one);
        bodies.setMatrixAt(i, m4);
        umbrellas.setMatrixAt(i, m4);
        rims.setMatrixAt(i, m4);
      });
      for (const m of [bodies, umbrellas, rims]) m.instanceMatrix.needsUpdate = true;
    },
  };
}
