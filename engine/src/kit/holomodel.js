// A model of one's own shown as a hologram (a whale over a plaza, a cat on a shop's sign...): light only, added on
// top, in the city's colours: a faint body, its edges bright where they turn away from the eye, scan lines rising
// through it, a flicker, now and then a band slipping out; turning slowly and bobbing, over a projector's base with
// a beam. Or (solid: true) as a sculpture in the city's own toon shading.
//
//   kit.place(spot, () => holoModel(w, w.models.whale, { height: 6, y: 9, spin: 0.05 }))
//
// The model: a BufferGeometry, or a loaded scene (all its meshes merged, their transforms applied); main.js loads
// district.models ({ name: 'assets/models/whale.glb' }) into w.models. See references/models.md for getting a
// model ready (blender/prepare_model.py) and what its licence must allow.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { shared, DEFINES, COMMON } from '../core/toon.js';
import { CURB, LAYER } from '../core/constants.js';
import { CYAN } from './buildings.js';

// one geometry from a model: its meshes' geometries, positions and normals only, in the model's own frame
export function modelGeometry(src) {
  if (!src) return null;
  if (src.isBufferGeometry) return src;
  const parts = [];
  src.updateMatrixWorld(true);
  src.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes.position) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', o.geometry.attributes.position.clone());
    if (o.geometry.index) g.setIndex(o.geometry.index.clone());
    g.applyMatrix4(o.matrixWorld);
    parts.push(g.index ? g.toNonIndexed() : g);
  });
  if (!parts.length) return null;
  const g = parts.length === 1 ? parts[0] : mergeGeometries(parts);
  g.computeVertexNormals();
  return g;
}

// the geometry scaled to height h, its middle over the origin, its foot at 0 (yaw: turned about the vertical)
function fitted(g, h, yaw) {
  const q = g.clone();
  q.computeBoundingBox();
  const b = q.boundingBox, size = b.max.y - b.min.y || 1, c = b.getCenter(new THREE.Vector3());
  q.translate(-c.x, -b.min.y, -c.z).scale(h / size, h / size, h / size).rotateY(yaw);
  if (!q.attributes.normal) q.computeVertexNormals();
  return q;
}

export function holoMaterial3D({ color = CYAN, spin = 0.12, bob = 0.12, seed = Math.random() } = {}) {
  return new THREE.ShaderMaterial({
    defines: { ...DEFINES },
    uniforms: { ...shared, uColor: { value: new THREE.Vector3(...color) }, uSpin: { value: spin }, uBob: { value: bob }, uSeed: { value: seed } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime, uSpin, uBob, uSeed;
      varying vec3 vWorld, vNormal; varying float vH;
      void main() {
        float a = uTime * uSpin, ca = cos(a), sa = sin(a);
        vec3 p = vec3(position.x * ca + position.z * sa, position.y + uBob * sin(uTime * 0.8 + uSeed * 6.0), -position.x * sa + position.z * ca);
        vec3 n = vec3(normal.x * ca + normal.z * sa, normal.y, -normal.x * sa + normal.z * ca);
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz; vNormal = normalize(mat3(modelMatrix) * n); vH = position.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uColor; uniform float uSeed;
      varying vec3 vWorld, vNormal; varying float vH;
      void main() {
        vec3 V = normalize(cameraPosition - vWorld);
        float rim = pow(clamp(1.0 - abs(dot(normalize(vNormal), V)), 0.0, 1.0), 2.0);
        float t = uTime + uSeed * 40.0;
        float scan = 1.0 - smoothstep(0.0, 0.12, abs(fract(vWorld.y * 1.4 - t * 0.6) - 0.5));
        float v = 0.05 + rim * 0.85 + scan * 0.12;
        v *= 0.88 + 0.12 * hash11(floor(t * 20.0));
        v *= 1.0 - step(0.93, hash11(floor(vWorld.y * 0.8 + t * 5.0) + floor(t * 3.0) * 7.0)) * 0.7;
        vec3 c = mix(uHue * uColor * 0.35 * v, uHue * vec3(1.7, 1.95, 1.95), smoothstep(0.55, 0.85, v));
        gl_FragColor = vec4(c * (1.0 - fogAmount(vWorld) * 0.8), 1.0);
      }`,
  });
}

// model: a geometry or a scene; height: how tall it is shown; y: its foot's height (over the base); yaw: turned;
// spin: radians a second it turns (0: still); bob: how far it rises and falls; color: its body's light; base: a
// projector's round base and beam under it (false for none: hung in the air); solid: as a sculpture instead
export function holoModel(w, model, { height = 3, y = 1.2, yaw = 0, spin = 0.12, bob = 0.12, color = CYAN, base = true, solid = false, albedo = 0.9 } = {}) {
  const src = modelGeometry(model);
  if (!src) { console.warn('holoModel: no model given (did it load? see district.models)'); return { claim: [-1, 1, -1, 1] }; }
  const g = fitted(src, height, yaw);
  g.computeBoundingBox();
  const r = Math.max(Math.abs(g.boundingBox.min.x), g.boundingBox.max.x, Math.abs(g.boundingBox.min.z), g.boundingBox.max.z);
  if (solid) {
    // (as a sculpture: lit and shaded as the city's things, on a stone plinth)
    w.props(new THREE.CylinderGeometry(r * 0.8 + 0.2, r * 0.8 + 0.3, 0.35, 32).translate(0, CURB + 0.175, 0), 0.75);
    w.glow(new THREE.TorusGeometry(r * 0.8 + 0.22, 0.025, 4, 64).rotateX(Math.PI / 2).translate(0, CURB + 0.36, 0), CYAN);
    w.props(g.translate(0, CURB + 0.35, 0), albedo);
    w.circle(0, 0, r * 0.8 + 0.4);
    return { claim: [-r - 1, r + 1, -r - 1, r + 1] };
  }
  const mesh = new THREE.Mesh(g, holoMaterial3D({ color, spin, bob }));
  mesh.position.set(0, CURB + y, 0);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  w.addMesh(mesh, LAYER.GLOW);
  if (base) {
    const br = Math.min(Math.max(r * 0.35, 0.6), 2.5);
    w.props(new THREE.CylinderGeometry(br, br * 1.1, 0.3, 32).translate(0, CURB + 0.15, 0), 0.4);
    w.glow(new THREE.TorusGeometry(br * 0.9, 0.03, 4, 64).rotateX(Math.PI / 2).translate(0, CURB + 0.31, 0), CYAN);
    w.glow(new THREE.CircleGeometry(br * 0.7, 32).rotateX(-Math.PI / 2).translate(0, CURB + 0.31, 0), [0.25, 0.7, 0.8]);
    w.beam(new THREE.CylinderGeometry(r * 0.7, br * 0.6, Math.max(0.1, y - 0.3), 24, 1, true).translate(0, CURB + 0.3 + (y - 0.3) / 2, 0));
    w.circle(0, 0, br + 0.2);
  }
  w.emitter({ x: 0, y: CURB + y + height / 2, z: 0, nx: 0, ny: -1, nz: 0, power: 0.6, reach: Math.max(8, height * 2), tint: 0.6 });
  return { claim: base ? [-r - 0.5, r + 0.5, -r - 0.5, r + 0.5] : [-0.5, 0.5, -0.5, 0.5] };
}
