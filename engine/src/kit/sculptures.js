// Sculptures for plazas and pavements: each built in its own frame, its middle at the origin (place
// with kit.place, e.g. kit.beside(street, u, side, gap) with a gap of half its size or more, so it stands clear of
// the pavement). Each returns { claim } so the streets' buildings keep off it.
//
//   boidsCube(w, { cell })   a cube of 6 x 6 x 6 small cubes of light on a round plinth; now and then it bursts
//                            upward and flies as a flock, drawn up into a tall, wandering column, then settles back,
//                            layer by layer, into its cube (a 24 s round)
//   solarSystem(w, { height }) the Sun alight on a slim column over a broad plinth, the eight planets going round it
//                            on rings of light (the inner ones quicker), a belt of stones, Saturn's ring, the Moon;
//                            high enough to walk under

import * as THREE from 'three';
import { CYAN } from './buildings.js';
import { shared } from '../core/toon.js';
import { CURB, LAYER } from '../core/constants.js';
import { makeRandom } from '../core/rand.js';

export function boidsCube(w, { cell = 0.3 } = {}) {
  const Nn = 6, C = Nn * Nn * Nn, P = 24, FPS = 10, F = P * FPS;
  const home = [];
  for (let zz = 0; zz < Nn; zz++) for (let y = 0; y < Nn; y++) for (let x = 0; x < Nn; x++) home.push([(x - 2.5) * cell, (y - 2.5) * cell, (zz - 2.5) * cell]);
  // (the round: held, 0-3 s; flying, 3-17 s; home, 17-21 s, each cube in turn from the foot up; held) - worked out
  // once here, a flock (keeping apart, flying as those near it do, drawn to them), drawn up and down again
  const Rb = makeRandom(9091);
  const pos = home.map((p) => [...p]), vel = home.map((p) => {
    const l = Math.hypot(...p) || 1;
    return [p[0] / l * Rb.range(0.5, 1.0) + Rb.range(-0.3, 0.3), Rb.range(1.1, 1.8) + p[1] * 0.4, p[2] / l * Rb.range(0.5, 1.0) + Rb.range(-0.3, 0.3)];
  });
  const lane = home.map(() => Rb.range(-1, 1));                              // (each one's own height in the flock)
  const data = new Float32Array(C * F * 4), dt = 1 / FPS / 2;
  const lerp = (q, r, t) => q.map((v, i) => v + (r[i] - v) * t), ease = (t) => t * t * (3 - 2 * t);
  for (let f = 0; f < F; f++) {
    const t = f / FPS;
    if (t >= 3 && t < 21) for (let sub = 0; sub < 2; sub++) {
      const tt = t + sub * dt;
      const rise = ease(THREE.MathUtils.clamp((tt - 3) / 4.5, 0, 1)), fall = ease(THREE.MathUtils.clamp((tt - 13.5) / 3.5, 0, 1));
      const aim = [Math.cos(tt * 0.9) * 0.45, 0.3 + 2.1 * rise - 1.8 * fall + 0.45 * Math.sin(tt * 0.75) * rise * (1 - fall), Math.sin(tt * 0.9) * 0.45];
      const tall = 1.8 * rise * (1 - fall);
      for (let i = 0; i < C; i++) {
        const p = pos[i], v = vel[i], acc = [0, 0, 0];
        let n = 0; const al = [0, 0, 0], co = [0, 0, 0];
        for (let j = 0; j < C; j++) {
          if (j === i) continue;
          const q = pos[j], dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < 0.64) {
            n++; for (let k = 0; k < 3; k++) { al[k] += vel[j][k]; co[k] += q[k]; }
            if (d2 < 0.2) { const kk = 1.2 / (d2 + 0.02); acc[0] -= dx * kk; acc[1] -= dy * kk; acc[2] -= dz * kk; }
          }
        }
        if (n) for (let k = 0; k < 3; k++) acc[k] += (al[k] / n - v[k]) * 0.9 + (co[k] / n - p[k]) * (k === 1 ? 0.06 : 0.2);
        acc[0] += (aim[0] - p[0]) * 0.9; acc[2] += (aim[2] - p[2]) * 0.9;
        acc[1] += (aim[1] + lane[i] * tall - p[1]) * 0.35;
        if (p[1] < -1.2) acc[1] += (-1.2 - p[1]) * 6;                          // (kept off the ground)
        for (let k = 0; k < 3; k++) v[k] += acc[k] * dt;
        const sp = Math.hypot(...v), want = THREE.MathUtils.clamp(sp, 0.7, 1.8);
        for (let k = 0; k < 3; k++) { v[k] *= want / (sp || 1); p[k] += v[k] * dt; }
      }
    }
    for (let i = 0; i < C; i++) {
      let q = pos[i];
      if (t < 3 || t >= 21) q = home[i];
      else if (t >= 17) {
        const turn = 17 + (Math.floor(i / Nn) % Nn) * 0.25, u = THREE.MathUtils.clamp((t - turn) / 2.2, 0, 1);
        q = lerp(pos[i], home[i], ease(u));
      }
      data.set([q[0], q[1], q[2], 1], (f * C + i) * 4);
    }
  }
  const tex = new THREE.DataTexture(data, C, F, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.needsUpdate = true;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), null, C);
  mesh.material = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uSim: { value: tex }, uC: { value: C }, uF: { value: F }, uP: { value: P }, uCell: { value: cell }, uHue: shared.uHue },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform sampler2D uSim; uniform float uTime, uC, uF, uP, uCell; varying vec3 vCol; varying vec3 vP;
      vec3 at(float f) { return texture2D(uSim, vec2((float(gl_InstanceID) + 0.5) / uC, (mod(f, uF) + 0.5) / uF)).xyz; }
      void main() {
        float fr = mod(uTime, uP) / uP * uF, f0 = floor(fr);
        vec3 a = at(f0), b = at(f0 + 1.0), c = mix(a, b, fr - f0);
        float k = clamp(length(b - a) * 10.0 / 1.6, 0.0, 1.0);                 // (faster: paler and smaller)
        vCol = mix(vec3(0.09, 0.3, 0.38), vec3(0.45, 0.68, 0.8), k);
        vP = position;
        vec3 p = c + position * uCell * mix(0.86, 0.6, k);
        float r = uTime * 0.12; p = vec3(p.x * cos(r) + p.z * sin(r), p.y, -p.x * sin(r) + p.z * cos(r));   // (turning slowly)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform mat3 uHue; varying vec3 vCol; varying vec3 vP;
      void main() {
        // (each cube's edges brighter than its faces, as a hologram's)
        vec3 q = abs(vP) * 2.0; float e = max(max(min(q.x, q.y), min(q.y, q.z)), min(q.x, q.z));
        gl_FragColor = vec4(uHue * vCol * (0.18 + 0.9 * smoothstep(0.8, 0.96, e)), 1.0);
      }`,
  });
  mesh.position.set(0, CURB + 0.36 + 0.55 + 2.5 * cell + 0.3, 0);
  mesh.frustumCulled = false;
  w.addMesh(mesh, LAYER.GLOW);
  // its foot: a low round plinth, a ring of light round its top
  w.props(new THREE.CylinderGeometry(1.1, 1.2, 0.35, 32).translate(0, CURB + 0.175, 0), 0.75);
  w.glow(new THREE.TorusGeometry(1.05, 0.025, 4, 64).rotateX(Math.PI / 2).translate(0, CURB + 0.36, 0), CYAN);
  w.glow(new THREE.CircleGeometry(0.75, 32).rotateX(-Math.PI / 2).translate(0, CURB + 0.36, 0), [0.12, 0.35, 0.4]);
  w.circle(0, 0, 1.3);
  w.emitter({ x: 0, y: CURB + 2.2, z: 0, nx: 0, ny: 1, nz: 0, power: 0.5, reach: 10, tint: 0.6 });
  return { claim: [-4.5, 4.5, -4.5, 4.5] };   // (a little open ground round it)
}

export function solarSystem(w, { height = 1.2, name = 'solar' } = {}) {
  const F = CURB, PH = height;
  w.props(new THREE.CylinderGeometry(2.6, 2.8, PH, 40).translate(0, F + PH / 2, 0), 0.75);
  w.glow(new THREE.TorusGeometry(2.62, 0.03, 4, 64).rotateX(Math.PI / 2).translate(0, F + PH, 0), CYAN);
  w.circle(0, 0, 3.0);
  const sy = F + PH + 3.0, round = (r, rate) => 0.9 / Math.pow(r, 1.5) * rate;
  w.props(new THREE.CylinderGeometry(0.1, 0.18, sy - 0.7 - (F + PH), 8).translate(0, (F + PH + sy - 0.7) / 2, 0), 0.6);
  w.shown(new THREE.IcosahedronGeometry(0.72, 1).translate(0, sy, 0), [1.9, 1.35, 0.6]);   // the Sun
  w.lamp(0, sy, 0, 1.0);
  const SO = w.rng(name);
  // [how far out, how big, its light]
  const PLANETS = [[1.3, 0.12, [1.1, 1.0, 0.9]], [1.75, 0.2, [1.6, 1.3, 0.8]], [2.25, 0.21, [0.5, 1.0, 1.7]], [2.75, 0.16, [1.6, 0.6, 0.4]],
    [4.0, 0.42, [1.5, 1.1, 0.75]], [4.9, 0.34, [1.5, 1.3, 0.9]], [5.6, 0.26, [0.6, 1.4, 1.5]], [6.2, 0.25, [0.5, 0.7, 1.7]]];
  PLANETS.forEach(([r, size, rgb], i) => {
    w.glow(new THREE.TorusGeometry(r, 0.012, 3, 96).rotateX(Math.PI / 2).translate(0, sy, 0), [0.3, 0.6, 0.7]);   // its way round
    const speed = round(r, 1), start = SO.range(0, Math.PI * 2);
    w.orbiting(new THREE.IcosahedronGeometry(size, 1).translate(r, sy, 0), rgb, [0, 0], speed, start);
    if (i === 2) w.orbiting(new THREE.IcosahedronGeometry(0.06, 0).translate(r + 0.42, sy + 0.08, 0), [1.4, 1.4, 1.4], [0, 0], speed, start);   // the Moon
    if (i === 5) w.orbiting(new THREE.TorusGeometry(size * 1.75, size * 0.18, 3, 24).rotateX(Math.PI / 2 - 0.45).translate(r, sy, 0), [1.2, 1.05, 0.75], [0, 0], speed, start);   // Saturn's ring
  });
  for (let k = 0; k < 46; k++) {                                              // the belt
    const r = SO.range(3.2, 3.55);
    w.orbiting(new THREE.IcosahedronGeometry(SO.range(0.03, 0.07), 0).translate(r, sy + SO.range(-0.12, 0.12), 0), [0.8, 0.85, 0.9], [0, 0], round(r, 1), SO.range(0, Math.PI * 2));
  }
  for (const [dx, dz] of [[-4, -3], [-4, 3], [4, 0]]) w.emitter({ x: dx, y: F + 0.3, z: dz, nx: -Math.sign(dx) * 0.5, ny: 0.8, nz: -Math.sign(dz) * 0.3, power: 1.0, reach: 9, tint: 0.1 });
  return { claim: [-6.8, 6.8, -6.8, 6.8] };
}
