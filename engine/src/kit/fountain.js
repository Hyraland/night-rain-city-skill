// An example of a piece of one's own (see references/extending.md): place it with
//   kit.place(kit.on('cross', 300, 0), () => fountain(w, { r: 5 }))
// kit/fountain.js
import * as THREE from 'three';
import { box } from './geometry.js';
import { CYAN, SOFT } from './buildings.js';
import { CURB } from '../core/constants.js';

// A round fountain on a plaza: a stone basin, a ring of light, water that mirrors (its frame: centre at the origin)
export function fountain(w, { r = 4, name = 'fountain' } = {}) {
  const Q = w.rng(name);
  w.props(new THREE.CylinderGeometry(r, r + 0.1, 0.55, 48, 1, true).translate(0, CURB + 0.27, 0), 0.75);
  w.props(new THREE.TorusGeometry(r, 0.12, 6, 64).rotateX(Math.PI / 2).translate(0, CURB + 0.55, 0), 0.85);
  w.groundPiece('pool', new THREE.CircleGeometry(r - 0.1, 48).rotateX(-Math.PI / 2).translate(0, CURB + 0.4, 0));
  w.glow(new THREE.TorusGeometry(r + 0.09, 0.025, 4, 96).rotateX(Math.PI / 2).translate(0, CURB + 0.3, 0), CYAN);   // (on its outer face)
  w.circle(0, 0, r + 0.2);
  w.lift(-r, r, -r, r, CURB + 0.4);
  w.emitter({ x: 0, y: CURB + 1, z: 0, nx: 0, ny: 1, nz: 0, power: 0.6, reach: 8, tint: 0.3 });
  return { claim: [-r - 1, r + 1, -r - 1, r + 1] };
}
