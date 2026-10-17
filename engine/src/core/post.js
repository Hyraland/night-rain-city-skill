// After the scene is drawn, in one pass over the whole frame: ink lines where depth jumps (the edges of towers,
// signs and poles), the bloom's glow added (UnrealBloomPass's own last pass skipped: see main.js), a last touch of
// vignette and film grain, and out to the screen in sRGB.

import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export class FinishPass extends ShaderPass {
  constructor(camera) {
    super({
      uniforms: {
        tDiffuse: { value: null }, tDepth: { value: null }, tBloom: { value: null },
        uTexel: { value: new THREE.Vector2() }, uNear: { value: camera.near }, uFar: { value: camera.far },
        uColor: { value: new THREE.Color('#030c14') }, uStrength: { value: 0.75 }, uDepth: { value: 0.02 },
        uTime: { value: 0 }, uAspect: { value: 1 }, uVignette: { value: 0.55 }, uGrain: { value: 0.025 },
      },
      vertexShader: VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse, tDepth, tBloom;
        uniform vec2 uTexel; uniform float uNear, uFar, uStrength, uDepth; uniform vec3 uColor;
        uniform float uTime, uAspect, uVignette, uGrain;
        varying vec2 vUv;
        float lin(vec2 uv) {
          float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
          return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
        }
        float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          float d = lin(vUv);
          float l = lin(vUv - vec2(uTexel.x, 0.0)), r = lin(vUv + vec2(uTexel.x, 0.0));
          float b = lin(vUv - vec2(0.0, uTexel.y)), t = lin(vUv + vec2(0.0, uTexel.y));
          // a jump in depth, relative to the depth itself, so lines stay as thin far off as near;
          // only where the nearer side is in front (the outline belongs to the closer object)
          float jump = max(max(d - min(l, r), 0.0), max(d - min(b, t), 0.0)) / d;
          float line = smoothstep(uDepth, uDepth * 2.5, jump) * (1.0 - smoothstep(250.0, 600.0, d));
          c = mix(c, uColor, line * uStrength);
          c += texture2D(tBloom, vUv).rgb;                     // (the glow over it, as the bloom would add it)
          vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
          c *= 1.0 - smoothstep(0.45, 1.25, length(q)) * uVignette;
          c += (hash(vUv * 1000.0 + fract(uTime) * 100.0) - 0.5) * uGrain;
          c = max(c, 0.0);
          // (and out to the screen in sRGB, as three.js's OutputPass would)
          c = mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
  }

  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    const u = this.uniforms;
    u.tDepth.value = readBuffer.depthTexture;
    u.uTexel.value.set(1 / readBuffer.width, 1 / readBuffer.height);
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  }
}
