// Holograms: turning rings of words on a beam, globes with orbits, double helices, small floating signs. All drawn
// with light only (added on top, no depth), posterized like everything else: a faint cyan body, cyan lines, and
// white edges bright enough to bloom; scan lines, flicker and the odd slipped band. The district says where
// (district.holograms; floating signs also from w.holoSign, e.g. over shop fronts).

import * as THREE from 'three';
import { shared, DEFINES, COMMON } from '../core/toon.js';
import { LAYER } from '../core/constants.js';
import { makeRandom } from '../core/rand.js';

const KIND = { GLOBE: 1, RING: 2, SIGN: 3, BEAM: 4, ORBIT: 5, WORDS: 6 };

export function holoMaterial(kind, { atlas = null, rect = new THREE.Vector4(), side = THREE.DoubleSide } = {}) {
  return new THREE.ShaderMaterial({
    defines: { ...DEFINES },
    uniforms: {
      ...shared,
      uKind: { value: kind }, uAtlas: { value: atlas }, uRect: { value: rect },
      uReveal: { value: 1 }, uFade: { value: 0 }, uSeed: { value: Math.random() }, uRepeat: { value: 1 }, uWords: { value: new THREE.Vector3(1.95, 2.0, 2.05) },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorld, vNormal; varying vec2 vUv;
      void main() {
        vec3 p = position;
        vUv = uv;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform float uKind, uReveal, uFade, uSeed, uRepeat; uniform sampler2D uAtlas; uniform vec4 uRect; uniform vec3 uScrMid, uWords;
      varying vec3 vWorld, vNormal; varying vec2 vUv;
      float lineAt(float d, float w) { return 1.0 - smoothstep(w * 0.5, w * 0.5 + fwidth(d) * 1.2, abs(d)); }
      float text(vec2 uv) { return texture2D(uAtlas, mix(uRect.xy, uRect.zw, clamp(uv, 0.0, 1.0))).r; }
      void main() {
        vec3 V = normalize(cameraPosition - vWorld);
        float rim = pow(clamp(1.0 - abs(dot(normalize(vNormal), V)), 0.0, 1.0), 2.2);
        float t = uTime + uSeed * 40.0;
        float scan = lineAt(fract(vWorld.y * 1.6 - t * 0.9) - 0.5, 0.18);
        float v = 0.0;

        if (uKind < 1.5) {               // globe: latitude and longitude, dotted land
          vec2 g = vUv * vec2(24.0, 12.0);
          float grid = max(lineAt(fract(g.x) - 0.5, 0.05), lineAt(fract(g.y) - 0.5, 0.05));
          float land = step(0.56, vnoise(vUv * vec2(9.0, 4.5) + 3.0) * 0.7 + vnoise(vUv * vec2(26.0, 13.0)) * 0.3);
          vec2 d = fract(vUv * vec2(160.0, 80.0)) - 0.5;
          float dots = land * (1.0 - smoothstep(0.2, 0.35, length(d)));
          v = 0.04 + rim * 0.55 + grid * 0.24 + dots * 0.4 + scan * 0.06;
        } else if (uKind < 2.5) {        // ring of words
          float tx = text(vec2(fract(vUv.x * uRepeat), (vUv.y - 0.5) * 1.15 + 0.5));
          float edges = lineAt(abs(vUv.y - 0.5) - 0.47, 0.03);
          v = 0.04 + tx * 0.9 + edges * 0.6 + scan * 0.08;
          v *= gl_FrontFacing ? 1.0 : 0.35;
        } else if (uKind < 3.5) {        // floating sign
          vec2 m = min(vUv, 1.0 - vUv);
          float frame = lineAt(min(m.x, m.y) - 0.04, 0.02);
          float tx = text((vUv - 0.5) * vec2(1.1, 1.25) + 0.5);
          v = 0.06 + tx * 0.95 + frame * 0.7 + scan * 0.15;
          v *= gl_FrontFacing ? 1.0 : 0.3;
        } else if (uKind < 4.5) {        // projector beam: a column of light, brighter at the core
          v = (0.05 + 0.25 * pow(1.0 - rim, 4.0)) * (0.7 + 0.3 * scan) * (1.0 - vUv.y * 0.5);
        } else if (uKind < 5.5) {        // orbit lines
          v = 0.7 + 0.3 * scan;
        } else {                         // words alone, no frame, nothing round them (white, below)
          float tx = text((vUv - 0.5) * vec2(1.1, 1.25) + 0.5);
          v = tx * (0.85 + 0.15 * scan);
          v *= gl_FrontFacing ? 1.0 : 0.0;
        }

        // flicker, and now and then a band that drops out
        v *= 0.88 + 0.12 * hash11(floor(t * 20.0));
        v *= 1.0 - step(0.93, hash11(floor(vWorld.y * 0.8 + t * 5.0) + floor(t * 3.0) * 7.0)) * 0.7;
        v *= 1.0 - uFade;

        float l1 = smoothstep(0.14, 0.2, v), l2 = smoothstep(0.62, 0.7, v);
        vec3 c = mix(mix(uScrMid * v, uScrMid * 0.75, l1), uHue * vec3(1.8, 2.1, 2.1), l2);
        if (uKind > 5.5) c = uWords * v;   // (words alone: white light, or its own colour)
        gl_FragColor = vec4(c * (1.0 - fogAmount(vWorld) * 0.8), 1.0);
      }`,
  });
}
// A double helix of dots, H high from the ground, its axis upright at the mesh's place: each dot's place on the helix
// in an attribute (its height; which: 0 or 1 a strand, 2 a pair between them, t where across it), turned in the shader
function dnaHelix(H) {
  const P = [], R = 1.7;
  for (let h = 0.4; h < H; h += 0.2) for (const w of [0, 1]) P.push(h, w, 0, 0);
  for (let h = 0.6; h < H; h += 0.62) for (let k = 1; k < 8; k++) P.push(h, 2, k / 8, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(P.length / 4 * 3), 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(P, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uR: { value: R }, uH: { value: H }, uScrMid: shared.uScrMid, uHue: shared.uHue },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aP; uniform float uTime, uR, uH; varying float vB, vPair;
      void main() {
        float h = aP.x, a = h * 0.42 + uTime * 0.45;
        vec3 p0 = vec3(cos(a) * uR, h, sin(a) * uR), p1 = vec3(-cos(a) * uR, h, -sin(a) * uR);
        vec3 p = aP.y < 0.5 ? p0 : aP.y < 1.5 ? p1 : mix(p0, p1, aP.z);
        vec4 mv = modelViewMatrix * vec4(p, 1.0), mc = modelViewMatrix * vec4(0.0, h, 0.0, 1.0);
        float away = mv.z < mc.z ? 0.45 : 1.0;                                  // (the far side dimmer)
        float band = exp(-pow(h - mod(uTime * 3.5, uH + 8.0) + 4.0, 2.0) * 0.6);   // (a light going up)
        vB = away * (1.0 + 1.2 * band); vPair = aP.y > 1.5 ? 1.0 : 0.0;
        gl_PointSize = (aP.y > 1.5 ? 0.2 : 0.32) * 620.0 / max(1.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uScrMid; uniform mat3 uHue; varying float vB, vPair;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float core = 1.0 - smoothstep(0.15, 0.5, d);
        vec3 c = mix(uHue * vec3(0.55, 1.35, 1.5), uHue * vec3(1.5, 1.7, 1.75), vPair * 0.3 + core * 0.4);
        gl_FragColor = vec4(c * core * vB, 1.0);
      }`,
  });
  const m = new THREE.Points(g, mat);
  m.frustumCulled = false;
  return m;
}
// what: { rings: [{ x, z, y, text, text2 }], globes: [{ x, z, y, r }], helices: [{ x, z, h }],
//   signs: [{ x, y, z, text, back, rotY, size, white, words, inside }] }  (text: a horizontal word of the atlas)
export function buildHolograms(atlas, { rings = [], globes = [], helices = [], signs: signList = [] } = {}) {
  const group = new THREE.Group();
  const R = makeRandom(77);
  const lights = [];   // { x, y, z, power, reach }
  const spinning = []; // [mesh, speed]
  const rectOf = (text) => (text ? atlas.h(text) : null) || atlas.rects.h[0] || new THREE.Vector4();
  const beamMat = holoMaterial(KIND.BEAM);
  const parts = [];

  // a ring of words (and a smaller one under it, turning the other way), on a beam from the ground
  for (const r of rings) {
    const y = r.y ?? 27;
    const m1 = holoMaterial(KIND.RING, { atlas: atlas.texture, rect: rectOf(r.text) });
    m1.uniforms.uRepeat.value = 3;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 3.4, 96, 1, true), m1);
    ring.position.set(r.x, y, r.z);
    const m2 = holoMaterial(KIND.RING, { atlas: atlas.texture, rect: rectOf(r.text2 ?? r.text) });
    m2.uniforms.uRepeat.value = 4;
    const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 2, 96, 1, true), m2);
    ring2.position.set(r.x, y - 4.2, r.z);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.8, y - 7, 24, 1, true).translate(0, (y - 7) / 2, 0), beamMat);
    beam.position.set(r.x, 0, r.z);
    spinning.push([ring, 0.12], [ring2, -0.2]);
    parts.push(ring, ring2, beam);
    lights.push({ x: r.x, y, z: r.z, power: 0.7, reach: 26 });
  }
  // a double helix of dots, turning: two strands, the pairs between them as rows of dots; a band of light going up
  for (const hx of helices) {
    const m = dnaHelix(hx.h ?? 20);
    m.position.set(hx.x, hx.y ?? 0, hx.z);
    parts.push(m);
  }
  // a globe with two orbits, on a beam
  for (const gb of globes) {
    const y = gb.y ?? 24, r = gb.r ?? 7;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 32), holoMaterial(KIND.GLOBE));
    globe.position.set(gb.x, y, gb.z);
    globe.rotation.z = 0.35;
    const orbitMat = holoMaterial(KIND.ORBIT);
    [0.9, -0.6].forEach((tilt, i) => {
      const o = new THREE.Mesh(new THREE.TorusGeometry(r * (1.36 + i * 0.23), 0.05, 6, 160), orbitMat);
      o.position.copy(globe.position);
      o.rotation.set(Math.PI / 2 + tilt, 0, 0);
      o.userData.orbit = i ? -0.22 : 0.3;
      parts.push(o);
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.8, y - r, 24, 1, true).translate(0, (y - r) / 2, 0), beamMat);
    beam.position.set(gb.x, 0, gb.z);
    spinning.push([globe, 0.08]);
    parts.push(globe, beam);
    lights.push({ x: gb.x, y, z: gb.z, power: 0.5, reach: 30 });
  }

  // Floating signs: two faces back to back, each seen only from its own side, so the words never read
  // mirrored; the back may say something else.
  // (size: how many times the usual size; white: its words alone, in white light (or words: their colour))
  const signs = [];
  const sign = (front, back = front, size = 1, white = false, words = null) => {
    const g = new THREE.Group();
    const h = 0.9 * size;
    const aspect = (r) => (r.z - r.x) / Math.max(1e-6, r.w - r.y);
    const w = Math.min(5.5 * size, h * Math.max(aspect(front), aspect(back)) * 0.95);
    for (const [rect, turn] of [[front, 0], [back, Math.PI]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 1.3), holoMaterial(white ? KIND.WORDS : KIND.SIGN, { atlas: atlas.texture, rect, side: THREE.FrontSide }));
      if (words) m.material.uniforms.uWords.value.set(...words);
      m.rotation.y = turn;
      m.position.z = turn ? -0.01 : 0.01;
      g.add(m);
    }
    return g;
  };
  for (const e of signList) {
    const g = sign(rectOf(e.text), rectOf(e.back ?? e.text), e.size ?? 1, e.white, e.words);
    g.position.set(e.x, e.y, e.z);
    g.rotation.y = e.rotY || 0;
    g.userData.inside = !!e.inside;   // (underground: its own layer)
    g.userData.y = e.y;
    g.userData.phase = R.next() * 6;
    signs.push(g);
  }

  for (const m of [...parts, ...signs]) {
    const layer = m.userData.inside ? LAYER.INSIDE : LAYER.GLOW;
    m.traverse((o) => { o.layers.set(layer); o.frustumCulled = false; });
    group.add(m);
  }

  return {
    group,
    lights,
    update(t) {
      for (const [m, speed] of spinning) m.rotation.y = t * speed;
      for (const m of parts) if (m.userData.orbit) m.rotation.z = t * m.userData.orbit;
      for (const s of signs) s.position.y = s.userData.y + Math.sin(t * 0.9 + s.userData.phase) * 0.08;
    },
  };
}
