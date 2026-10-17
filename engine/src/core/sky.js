// The sky over the canyon: low rain clouds lit from below by the city, in flat bands of tone, and the moon
// behind them, a bright smear with a halo. Its horizon is the fog colour, so the far street melts into it.

import * as THREE from 'three';
import { shared, DEFINES, COMMON } from './toon.js';
import { LAYER } from './constants.js';

export function buildSky() {
  const mat = new THREE.ShaderMaterial({
    defines: { ...DEFINES },
    uniforms: { ...shared, uZenith: { value: new THREE.Color('#040d16') } },
    side: THREE.BackSide, depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
        gl_Position.z = gl_Position.w * 0.99999;
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uZenith;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = max(d.y, 0.0);
        vec3 c = mix(uFog, uZenith, smoothstep(0.0, 0.55, h));
        float m = max(dot(d, uKeyDir), 0.0);
        // clouds: drifting noise seen from beneath, cut into three tones
        vec2 q = d.xz / max(d.y, 0.08) * 1.4 + vec2(uTime * 0.012, uTime * 0.02);
        float n = vnoise(q) * 0.55 + vnoise(q * 2.3 + 4.0) * 0.3 + vnoise(q * 5.1 - uTime * 0.03) * 0.15;
        float glow = pow(m, 7.0);
        float lit = n * (0.45 + 0.9 * glow) + (1.0 - h) * 0.25;
        vec3 cloudMid = mix(uFog, uMid, 0.55), cloudLit = mix(uMid, uHaze, 0.8);
        c = mix(c, cloudMid, smoothstep(0.42, 0.45, lit) * 0.85);
        c = mix(c, cloudLit, smoothstep(0.66, 0.69, lit) * 0.9);
        // the moon through thin cloud, and its halo
        float disc = smoothstep(0.99955, 0.9997, m);
        c = mix(c, uHaze, smoothstep(0.985, 0.99, m) * 0.6);
        c += uHue * vec3(2.4, 2.6, 2.6) * disc * (1.0 - smoothstep(0.55, 0.75, n) * 0.7);
        c = mix(c, uHaze, pow(m, 18.0) * 0.5 * (1.0 - h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
  sky.layers.set(LAYER.GLOW);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return sky;
}
