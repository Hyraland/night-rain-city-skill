// Flying traffic high over the streets: dark craft in lanes at several heights, white lights ahead, cyan behind,
// streaming by both ways along each street (from end to end, shrinking away at the ends). Each street's lanes a
// little higher or lower than the last's, so that where streets cross they pass over one another.

import * as THREE from 'three';
import { glowMaterial, propsMaterial } from './toon.js';
import { LAYER } from './constants.js';
import { makeRandom } from './rand.js';

// streets: [{ from: [x, z], dx, dz, nx, nz, len, index }] (as kit/street.js makes them); traffic: false for none
export function buildTraffic(streets) {
  const R = makeRandom(3);
  const lanes = [];
  for (const st of streets) {
    if (st.traffic === false) continue;
    const lift = ((st.index ?? 0) % 4) * 3.2;
    for (const y of [34, 47, 61, 78, 98, 122]) {
      for (const dir of [-1, 1]) lanes.push({ st, y: y + lift + R.range(-1.2, 1.2), across: dir * R.range(2.5, 5.5), dir, speed: R.range(22, 42) });
    }
  }
  const cars = [];
  for (const lane of lanes) {
    const n = Math.max(1, Math.round(R.int(2, 5) * lane.st.len / 860));
    for (let i = 0; i < n; i++) cars.push({ lane, off: R.next() * lane.st.len, speed: lane.speed * R.range(0.9, 1.1), bob: R.next() * 6 });
  }

  const body = new THREE.BoxGeometry(2.2, 0.9, 5.2);
  body.setAttribute('aAlbedo', new THREE.Float32BufferAttribute(new Float32Array(body.attributes.position.count).fill(0.5), 1));
  // the lights: a bar across the front (white) and the back (cyan), in the car's frame (front toward -z)
  const lights = new THREE.BoxGeometry(2.0, 0.18, 0.1);
  const front = lights.clone().translate(0, 0, -2.62), backBar = lights.clone().translate(0, 0, 2.62);
  const paint = (g, rgb) => {
    const n = g.attributes.position.count;
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).map((_, i) => rgb[i % 3]), 3));
    g.setAttribute('aBlink', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
    return g;
  };
  paint(front, [3, 3.3, 3.3]);
  paint(backBar, [0.3, 2.0, 2.4]);

  const mk = (geom, mat, layer) => {
    const m = new THREE.InstancedMesh(geom, mat, Math.max(1, cars.length));
    m.frustumCulled = false;
    m.layers.set(layer);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return m;
  };
  const bodies = mk(body, propsMaterial(), LAYER.GLOW);
  const fronts = mk(front, glowMaterial(), LAYER.GLOW);
  const backs = mk(backBar, glowMaterial(), LAYER.GLOW);
  const group = new THREE.Group();
  group.add(bodies, fronts, backs);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), size = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const m of [bodies, fronts, backs]) m.count = cars.length;

  return {
    group,
    update(t) {
      cars.forEach((c, i) => {
        const { lane } = c, st = lane.st, L = st.len;
        // how far along its street, wrapping round; facing the way it flies (the car's front toward its -z)
        const u = (c.off + t * c.speed) % L, along = lane.dir > 0 ? u : L - u;
        pos.set(st.from[0] + st.dx * along + st.nx * lane.across, lane.y + Math.sin(t * 0.7 + c.bob) * 0.4, st.from[1] + st.dz * along + st.nz * lane.across);
        q.setFromAxisAngle(up, Math.atan2(-st.dx * lane.dir, -st.dz * lane.dir));
        const k = Math.min(1, u / 25, (L - u) / 25);
        m4.compose(pos, q, size.setScalar(Math.max(k, 0.001)));
        bodies.setMatrixAt(i, m4);
        fronts.setMatrixAt(i, m4);
        backs.setMatrixAt(i, m4);
      });
      for (const m of [bodies, fronts, backs]) m.instanceMatrix.needsUpdate = true;
    },
  };
}
