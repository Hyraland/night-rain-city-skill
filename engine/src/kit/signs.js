// Signs and screens of their own, beyond the screens' programs (core/screens.js): each makes a mesh (put it in the
// world with w.addMesh, or give it a placed geometry), in the city's look: LED dots, light on dark, colours turned
// with the city's hue (and a brand's own, tuning.json caseColors: B.index, its place among the district's brands).
//
//   ledPicture(geom, w, h, draw, opts)       a still picture (draw(ctx, W, H) grey on black) as an LED panel
//   dotText(ctx, text, x, y, size, colour)   words as round dots, into a canvas being drawn (for ledPicture)
//   nameplate(geom, name, en, aspect)        a name on a dark plate, in yellow
//   popName(geom, name, en, aspect, P, at)   a name popping in character by character, as an anime title
//   revealName(geom, name, en, aspect, ph)   a name coming one character after another, staying, going
//   bulbRing(x, y, z, w, h, face, gap)       points round a rectangle, for marquee
//   marquee(points, r)                       an old theatre's chasing bulbs at those points
//   cinemaLED(w, h, x, y, z, face, B, o)     a cinema's LED: a film strip going by (or a projector's beam on a
//                                            screen), little scenes in its frames, B's name and tagline
//   umbrellaLED(w, h, x, y, z, face, B, o)   umbrellas drifting up as jellyfish, B's name
//   concertWaves(w, h, x, y, z, face, B, o)  waves of sound in light, B's name
//   inBrandColours(mesh, index)              a canvas label turned with brand index's colours
//   canvasPlane(geom, aspect, transparent, draw)   a canvas drawing shown as it is (labels, plates)
//   meowLED(geom, w, h, seed, B, o)          animal faces in LED dots in B's colour, B's name (a gift shop's)
//   themedSign(w, h, x, y, z, face, name, theme, what, add)   a themed LED sign: 'name', 'icon' or 'menu'
//                                            (THEMES: 'icecream', 'moon', or one's own)
//
// B: a brand as the district gives it ({ name, en, tagline, color }), with index: its place among the brands.
// face: which way it looks ('z', '-z', 'x', '-x'), as kit/geometry.js panel().

import * as THREE from 'three';
import { shared } from '../core/toon.js';
import { LAYER } from '../core/constants.js';
import { makeRandom } from '../core/rand.js';
import { drawIcon } from './icons.js';
import { panel, box, FACE_TURN } from './geometry.js';
import { family } from './atlas.js';

// how loud the music is just now (0..1): for signs that swell with it (concertWaves live); the page sets it each frame
export const musicBeat = { value: 0 };

export function nameplate(geom, name, en, aspect) {
  const cv = document.createElement('canvas'), H = 128, Wd = Math.round(H * aspect);
  cv.width = Wd; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#110f1c';
  g.beginPath(); g.roundRect(0, 0, Wd, H, H * 0.12); g.fill();
  g.fillStyle = '#f7c548'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${H * 0.46}px "PingFang SC", "Noto Sans SC", sans-serif`;
  g.fillText(name, Wd / 2, H * 0.42, Wd * 0.9);
  g.font = `600 ${H * 0.15}px "PingFang SC", "Noto Sans SC", sans-serif`;
  g.fillText(en.split('').join(String.fromCharCode(8202)), Wd / 2, H * 0.8, Wd * 0.9);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  m.layers.set(LAYER.GLOW);
  return m;
}

// A brand's name popping in as an anime's title does: each character in turn grows out of nothing past its size
// and settles, with a little hop, its English line after; all of them away again at the round's end. White, on
// nothing; P the round (seconds), at when in it the first one comes; the geometry placed
// (its characters close together, a cell each, in the middle; font: theirs, or a heavy sans)
export function popName(geom, name, en, aspect, P, at, font = null, chars0 = true) {   // (chars0 false: its English alone)
  const chars = [...name], H = 200, Wd = Math.round(H * aspect), cv = document.createElement('canvas');
  cv.width = Wd; cv.height = H;
  const g = cv.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const size = Math.min(H * 0.5, Wd / chars.length * 0.78), cell = Math.min(Wd / chars.length, size * 1.08), x0 = (Wd - cell * chars.length) / 2;
  g.font = font ? `400 ${size}px ${font}` : `800 ${size}px "PingFang SC", "Noto Sans SC", sans-serif`;
  if (chars0) chars.forEach((ch, i) => {
    g.fillStyle = '#ffffff'; g.fillText(ch, x0 + (i + 0.5) * cell, H * 0.38);
  });
  g.font = `700 ${H * 0.12}px "PingFang SC", "Noto Sans SC", sans-serif`;
  const enS = en.split('').join(String.fromCharCode(8202));
  g.fillStyle = '#ffffff'; g.fillText(enS, Wd / 2, H * 0.84, Wd * 0.9);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uMap: { value: tex }, uN: { value: chars.length }, uP: { value: P }, uAt: { value: at }, uBand: { value: new THREE.Vector2(x0 / Wd, cell * chars.length / Wd) } },
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uMap; uniform float uTime, uN, uP, uAt; uniform vec2 uBand; varying vec2 vUv;
      float backOut(float x) { float c1 = 2.2, c3 = c1 + 1.0; return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0); }
      void main() {
        float t = mod(uTime, uP), away = 1.0 - smoothstep(uP - 0.45, uP - 0.15, t), a = 1.0;
        vec2 uv = vUv;
        if (vUv.y > 0.3) {                            // its characters, each in its cell, grown about its middle
          float bx = (vUv.x - uBand.x) / uBand.y;
          if (bx < 0.0 || bx >= 1.0) discard;
          float i = floor(bx * uN), lt = t - uAt - i * 0.11;
          float s = (lt < 0.0 ? 0.0 : lt < 0.4 ? backOut(lt / 0.4) : 1.0) * away;
          float hop = lt > 0.0 && lt < 0.4 ? sin(lt / 0.4 * 3.1416) * 0.1 : 0.0;
          float lx = (fract(bx * uN) - 0.5) / max(s, 0.001) + 0.5;
          uv.y = (vUv.y - 0.62 - hop) / max(s, 0.001) + 0.62;
          if (s < 0.01 || lx < 0.0 || lx > 1.0 || uv.y < 0.3 || uv.y > 1.0) discard;
          uv.x = uBand.x + (i + lx) / uN * uBand.y;
        } else a = smoothstep(0.0, 0.3, t - uAt - uN * 0.11 - 0.15) * away;
        vec4 tx = texture2D(uMap, uv);
        if (tx.a * a < 0.01) discard;
        gl_FragColor = vec4(tx.rgb, tx.a * a);
      }`,
  });
  const m = new THREE.Mesh(geom, mat);
  m.layers.set(LAYER.GLOW);
  m.renderOrder = 5;
  return m;
}

// A brand's name that comes one character after another, stays a while, and goes (12 s round, from phase):
// light letters on nothing, drawn once on a canvas, its English line under it after them; the geometry placed
export function revealName(geom, name, en, aspect, phase) {
  const chars = [...name], H = 160, Wd = Math.round(H * aspect), cv = document.createElement('canvas');
  cv.width = Wd; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${Math.min(H * 0.52, Wd / chars.length * 0.8)}px "PingFang SC", "Noto Sans SC", sans-serif`;
  chars.forEach((ch, i) => g.fillText(ch, (i + 0.5) / chars.length * Wd, H * 0.38));
  g.font = `600 ${H * 0.13}px "PingFang SC", "Noto Sans SC", sans-serif`;
  g.fillText(en.split('').join(String.fromCharCode(8202)), Wd / 2, H * 0.84, Wd * 0.9);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uMap: { value: tex }, uN: { value: chars.length }, uPhase: { value: phase } },
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uMap; uniform float uTime, uN, uPhase; varying vec2 vUv;
      void main() {
        vec4 tx = texture2D(uMap, vUv);
        float t = mod(uTime + uPhase, 12.0), step = 0.45;
        // each character in turn (its cell across), then the line under them
        float on = vUv.y > 0.3 ? smoothstep(0.0, 0.25, t - floor(vUv.x * uN) * step) : smoothstep(0.0, 0.5, t - uN * step - 0.2);
        float a = tx.a * on * (1.0 - smoothstep(7.5, 8.5, t));
        if (a < 0.01) discard;
        gl_FragColor = vec4(tx.rgb * 1.25, a);
      }`,
  });
  const m = new THREE.Mesh(geom, mat);
  m.layers.set(LAYER.GLOW);
  m.renderOrder = 5;
  return m;
}

// A still picture shown as an LED panel w x h (the geometry placed): drawn once on a canvas, grey on black
// (draw(ctx, width, height)), shown through a grid of round dots, density of them a metre, each dot as bright
// as the picture at its middle; dark where it is black, low (a colour) where it is grey, high where it is white
// (high above 1 glows). From afar the dots blur into the picture.
// screen: in the LED screens' own colours instead (tuning screens: its cyan for low, its white for high)
// (glass: a clear screen, nothing behind its lit pixels, an unlit one not there at all: square pixels, rounded, a
// gap between; its greys taken as five levels (the edge of a thing, water, coffee, milk, foam: 60, 90, 140, 200,
// 255) in the screens' colours, dim to bright; its edge a thin line of light, a stud at each corner)
export function ledPicture(geom, w, h, draw, { low = [0.5, 0.6, 0.65], high = [1.8, 1.95, 1.95], bg = [0.012, 0.025, 0.04], density = 14, screen = false, glass = false, smoked = false, scroll = 0, loop = 0 } = {}) {
  // (loop: with scroll, how many pixels long what goes by is, drawn once and shown over and over; else as wide as the screen)
  const nx = Math.round(w * density), ny = Math.round(h * density), cv = document.createElement('canvas');
  cv.width = (scroll && loop ? loop : nx) * 4; cv.height = ny * 4;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  draw(g, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uN: { value: new THREE.Vector2(nx, ny) }, uLow: { value: new THREE.Vector3(...low) }, uHigh: { value: new THREE.Vector3(...high) }, uBg: { value: new THREE.Vector3(...bg) },
      uScreen: { value: screen ? 1 : 0 }, uGlass: { value: glass ? 1 : 0 }, uSmoked: { value: smoked ? 1 : 0 }, uScroll: { value: scroll }, uLoop: { value: scroll && loop ? loop : nx }, uTime: shared.uTime, uScrMid: shared.uScrMid, uScrHot: shared.uScrHot, uScrDark: shared.uScrDark, uHue: shared.uHue },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uMap; uniform vec2 uN; uniform vec3 uLow, uHigh, uBg, uScrMid, uScrDark; uniform float uScreen, uScrHot, uGlass, uSmoked, uScroll, uLoop, uTime;
      uniform mat3 uHue; varying vec2 vUv;
      void main() {
        vec3 low = uLow, high = uHigh, bg = uBg;
        if (uScreen > 0.5) { low = uScrMid; high = uHue * vec3(0.92, 1.0, 1.0) * uScrHot * 0.8; bg = uScrDark; }
        vec2 led = vUv * uN;
        float v = texture2D(uMap, (floor(led) + 0.5) / uN).r;
        if (uGlass > 0.5) {
          // (scroll: what it shows going left, a whole pixel at a time, uScroll pixels a second, round and round)
          if (uScroll > 0.0) v = texture2D(uMap, (vec2(mod(floor(led.x) + floor(uTime * uScroll), uLoop), floor(led.y)) + 0.5) / vec2(uLoop, uN.y)).r;
          float aa = 1.0 - smoothstep(0.2, 0.5, max(fwidth(led.x), fwidth(led.y)));
          float e = min(min(led.x, led.y), min(uN.x - led.x, uN.y - led.y));
          vec2 q = min(led, uN - led);
          if (length(q - 1.0) < 0.42) { gl_FragColor = vec4(vec3(0.32, 0.36, 0.4), 1.0); return; }   // a stud
          if (e < 0.16) { gl_FragColor = vec4(low * 0.3, 1.0); return; }                                // the glass's edge
          float lv = v < 0.17 ? 0.0 : v < 0.29 ? 1.0 : v < 0.45 ? 2.0 : v < 0.67 ? 3.0 : v < 0.89 ? 4.0 : 5.0;
          vec2 f = abs(fract(led) - 0.5);
          float sq = 1.0 - smoothstep(-0.04, 0.04, length(max(f - 0.24, 0.0)) - 0.14);
          if (lv < 0.5 || mix(1.0, sq, aa) < 0.5) {
            if (uSmoked < 0.5) discard;
            gl_FragColor = vec4(uScrDark * 0.55, 1.0); return;               // (smoked glass: dark, plain, behind)
          }
          float l = dot(low, vec3(0.3, 0.55, 0.15));
          vec3 c = lv < 1.5 ? mix(vec3(l), low, 0.45) * 0.8         // the edge of a thing
            : lv < 2.5 ? low * 0.2                                   // water
            : lv < 3.5 ? low * vec3(0.55, 0.75, 1.1) * 0.55          // coffee
            : lv < 4.5 ? mix(low, high * 0.62, 0.4) : high * 0.62;  // milk, foam (not so bright as to bleed)
          gl_FragColor = vec4(c * mix(0.7, 1.0, aa), 1.0);
          return;
        }
        float dotm = 1.0 - smoothstep(0.3, 0.46, length(fract(led) - 0.5));
        float aa = 1.0 - smoothstep(0.2, 0.5, max(fwidth(led.x), fwidth(led.y)));
        vec3 lit = v < 0.5 ? low * smoothstep(0.05, 0.5, v) : mix(low, high, (v - 0.5) * 2.0);
        gl_FragColor = vec4(mix(bg, lit, mix(0.55, dotm, aa)), 1.0);
      }`,
  });
  const m = new THREE.Mesh(geom, mat);
  m.layers.set(LAYER.GLOW);
  return m;
}
// words drawn as round dots (an LED's), into the canvas g at (x, y): size their height; dots across a character's
// height; returns their width (g null: only the width)

export function dotText(g, text, x, y, size, color, { weight = 800, align = 'left', dots = 13, maxW = Infinity, family = '"PingFang SC", "Noto Sans SC", sans-serif' } = {}) {
  const c = document.createElement('canvas'), t = c.getContext('2d');
  t.font = `${weight} ${dots}px ${family}`;
  c.width = Math.ceil(t.measureText(text).width) + 2; c.height = Math.ceil(dots * 1.3);
  t.font = `${weight} ${dots}px ${family}`; t.textBaseline = 'middle'; t.fillStyle = '#fff'; t.fillText(text, 1, c.height / 2);
  const d = t.getImageData(0, 0, c.width, c.height).data, k = Math.min(size / dots, maxW / c.width);
  const x0 = align === 'left' ? x : align === 'center' ? x - c.width * k / 2 : x - c.width * k;
  if (!g) return c.width * k;
  g.fillStyle = color;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
    if (d[(j * c.width + i) * 4 + 3] < 110) continue;
    g.beginPath(); g.arc(x0 + (i + 0.5) * k, y + (j + 0.5 - c.height / 2) * k, k * 0.42, 0, 7); g.fill();
  }
  return c.width * k;
}

// a ring of bulbs gap apart round a rectangle w x h, its middle at (x, y, z), in the plane facing face; in order
// round it (for their chase)
export function bulbRing(x, y, z, w, h, face, gap) {
  const along = { x: [0, 0, -1], '-x': [0, 0, 1], z: [1, 0, 0], '-z': [-1, 0, 0] }[face], pts = [];
  const at = (u, v) => pts.push([x + along[0] * u, y + v, z + along[2] * u]);
  const side = (u0, v0, u1, v1) => {
    const n = Math.max(1, Math.round(Math.hypot(u1 - u0, v1 - v0) / gap));
    for (let i = 0; i < n; i++) at(u0 + (u1 - u0) * i / n, v0 + (v1 - v0) * i / n);
  };
  side(-w / 2, -h / 2, w / 2, -h / 2); side(w / 2, -h / 2, w / 2, h / 2); side(w / 2, h / 2, -w / 2, h / 2); side(-w / 2, h / 2, -w / 2, -h / 2);
  return pts;
}
// little round bulbs (radius r) at pts, warm white whatever the city's colours, chasing as on an old theatre's
// marquee: one in three lit, running along them (8 s); then all of them blinking, every other one in turn (2 s);
// then all lit (2 s); the unlit glowing faintly, as filaments cooling
export function marquee(pts, r) {
  const geo = new THREE.SphereGeometry(r, 8, 6);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime },
    vertexShader: /* glsl */ `
      attribute float aIndex; varying float vIndex; varying vec3 vN;
      void main() { vIndex = aIndex; vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying float vIndex; varying vec3 vN;
      void main() {
        float c = mod(uTime, 12.0), on;
        if (c < 8.0) on = mod(vIndex - floor(uTime * 7.0), 3.0) < 0.5 ? 1.0 : 0.0;
        else if (c < 10.0) on = mod(vIndex + floor(uTime * 4.0), 2.0) < 0.5 ? 1.0 : 0.0;
        else on = 1.0;
        float face = 0.55 + 0.45 * pow(max(vN.z, 0.0), 2.0);   // (brightest at its middle, as a round bulb)
        gl_FragColor = vec4(mix(vec3(0.5, 0.34, 0.15), vec3(1.95, 1.6, 0.9), on) * face, 1.0);
      }`,
  });
  const m = new THREE.InstancedMesh(geo, mat, pts.length), M = new THREE.Matrix4();
  pts.forEach((p, i) => m.setMatrixAt(i, M.makeTranslation(p[0], p[1], p[2])));
  geo.setAttribute('aIndex', new THREE.InstancedBufferAttribute(new Float32Array(pts.map((_, i) => i)), 1));
  m.computeBoundingSphere();
  m.layers.set(LAYER.GLOW);
  return m;
}

export function umbrellaLED(w, h, x, y, z, face, B, { kind = null, framed = false } = {}) {
  const aspect = w / h;
  kind ||= aspect > 1.4 ? 'wide' : aspect < 0.8 ? 'tall' : 'square';
  const W = aspect >= 1 ? 768 : Math.round(768 * aspect), H = aspect >= 1 ? Math.round(768 / aspect) : 768;
  // its name: its middle, its height, as shares
  const L = { wide: { name: [0.24, 0.5, 0.34] }, tall: { name: [0.5, 0.86, 0.12] }, square: { name: [0.5, 0.86, 0.14] }, blade: {} }[kind];
  if (kind === 'wide' && aspect > 4) L.name = [0.14, 0.5, 0.62];                       // (a strip: its name larger, at its end)
  if (framed && L.name) L.name = [0.5, 0.5, 0.3];
  const RW = makeRandom(Math.round(w * 131 + h * 17));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (L.name) {
    const [nx, ny, nh] = L.name, cs = nh * H;
    g.fillStyle = '#fff'; g.font = `600 ${cs}px "PingFang SC", "Noto Sans SC", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...B.name].forEach((c, i, all) => g.fillText(c, nx * W + (i - (all.length - 1) / 2) * cs * 1.04, (1 - ny) * H));
  }
  const words = new THREE.CanvasTexture(cv);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uWords: { value: words }, uTime: shared.uTime, uAspect: { value: aspect }, uSeed: { value: RW.range(0, 50) },
      uDots: { value: new THREE.Vector2(w, h).divideScalar(Math.min(w, h) / 50).floor() },
      uNamed: { value: L.name ? 1 : 0 }, uFramed: { value: framed ? 1 : 0 },
      uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: B.index ?? 0 },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D uWords; uniform float uTime, uAspect, uSeed, uNamed, uFramed; uniform vec2 uDots;
      uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex;
      varying vec2 vUv;
      float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      // how near p is to a segment, to an arc
      float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
      // an umbrella, its rim's middle at the origin, radius r (dh: its dome's height as a share of r; sway: its
      // shaft's lower end, sideways): (its lines' light, its dome's fill)
      vec2 umbrella(vec2 p, float r, float dh, float sway, float lw) {
        float H = r * dh;
        float e = length(vec2(p.x / r, p.y / H));
        float dome = p.y > 0.0 ? smoothstep(lw, 0.0, abs(e - 1.0) * r) : 0.0;
        float fill = p.y > 0.0 && e < 1.0 ? 1.0 : 0.0;
        float ribs = 0.0;
        for (int k = 1; k <= 2; k++) {                                      // (the ribs, curving down from the tip)
          float rk = r * float(k) / 3.0, ek = length(vec2(p.x / rk, p.y / H));
          ribs = max(ribs, p.y > 0.0 ? smoothstep(lw * 0.7, 0.0, abs(ek - 1.0) * rk) : 0.0);
        }
        float rim = smoothstep(lw, 0.0, abs(p.y)) * step(abs(p.x), r);
        vec2 foot = vec2(sway, -0.95 * r);
        float shaft = smoothstep(lw * 0.8, 0.0, seg(p, vec2(0.0, H), foot));
        vec2 hc = foot + vec2(0.12 * r, 0.0);
        float hook = p.y < foot.y ? smoothstep(lw * 0.8, 0.0, abs(length(p - hc) - 0.12 * r)) : 0.0;
        return vec2(max(max(dome, rim), max(ribs * 0.6, max(shaft, hook) * 0.8)), fill);
      }
      void main() {
        vec2 cell = (floor(vUv * uDots) + 0.5) / uDots, f = fract(vUv * uDots) - 0.5;
        float dotM = smoothstep(0.47, 0.3, length(f)), px = 1.0 / uDots.y;
        dotM = mix(dotM, 0.45, clamp(max(fwidth(vUv.x * uDots.x), fwidth(vUv.y * uDots.y)) * 1.6 - 0.4, 0.0, 1.0));   // (far off: their average, no bands)
        vec2 q = vec2(cell.x * uAspect, cell.y);
        float t = uTime + uSeed;
        vec3 LINE = vec3(0.55, 1.6, 0.95), FILL = vec3(0.04, 0.2, 0.13);
        vec3 col = vec3(0.0);
        // the rain: faint dotted lines falling
        float colI = floor(q.x / px), rn = hash(colI + 0.37 * uSeed);
        if (rn > 0.82) { float yy = fract(q.y * 0.6 + t * (0.5 + rn * 0.4) + rn * 7.0); col += vec3(0.08, 0.16, 0.2) * smoothstep(0.85, 1.0, yy) * step(0.5, fract(q.y / px * 0.5)); }
        // the umbrellas drifting up, breathing
        for (int k = 0; k < 8; k++) {
          float fk = float(k), hk = hash(fk * 3.7 + uSeed);
          float r = mix(0.12, 0.2, hash(fk * 1.3 + uSeed)) * (uAspect < 1.0 ? uAspect * 1.4 : uAspect > 4.0 ? 2.0 : 1.0);   // (larger on a strip)
          float speed = mix(0.035, 0.06, hk), yk = fract(t * speed + hk) * 1.6 - 0.3;
          float xk = (fk + 0.5) / 8.0 * uAspect + sin(t * 0.3 + fk * 2.1) * 0.04 * uAspect;
          float breath = sin(t * 1.6 + fk * 1.9);
          vec2 p = q - vec2(xk, yk);
          p.x /= 1.0 + 0.08 * breath;
          vec2 u = umbrella(p, r, 0.55 * (1.0 - 0.12 * breath), sin(t * 1.1 + fk) * 0.25 * r, px * 1.1);
          col += LINE * u.x * (0.75 + 0.35 * breath) + FILL * u.y * (1.0 + 0.5 * breath);
        }
        float words = textureLod(uWords, cell, 0.0).r;
        col = mix(col, vec3(1.1, 1.5, 1.0), words * 0.9 * uNamed);
        // (framed: a line of lit dots one in from its edge, nothing outside it)
        vec2 ci = floor(vUv * uDots);
        float edge = min(min(ci.x, uDots.x - 1.0 - ci.x), min(ci.y, uDots.y - 1.0 - ci.y));
        if (uFramed > 0.5) col = edge < 0.5 ? vec3(0.0) : abs(edge - 1.0) < 0.5 ? LINE * 0.85 : col;
        col = col * dotM * 1.2 + vec3(0.002, 0.005, 0.004) * (1.0 - dotM);
        col = uHue * col;
        vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
        col = col * cos(adj.x) + cross(k, col) * sin(adj.x) + k * dot(k, col) * (1.0 - cos(adj.x));
        col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.y = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }[face];
  m.position.set(x, y, z);
  m.layers.set(LAYER.GLOW);
  return m;
}
// A music venue's ads and signs, in LED dots: a river of sound. Three waves (B's colour, a pink, a cyan) flowing from
// right to left across the dark, over and under one another, swelling on each beat (76 a minute); now and
// then a note of dots floating along on the first; its name where they run calm, a dark edge round it so it
// reads over them. kind: by its shape ('strip': its name at its end; 'tall': its name at the top, the waves
// under it), or 'blade' (no name); named: false for none. live: swelling with the music as it is heard
// (musicBeat, set each frame from the sound), rather than to the beat alone. palette: 'brand' (its violet, a pink, a cyan), 'tone' (the
// city's own cyans and blues), 'dusk' (amber, rose, violet), 'aurora' (green, cyan, violet), or by turns as
// they are made. scroll: its name going by along it, over and over (a long strip); round: a round screen, w
// across, a ring of light round its edge; clear: all but clear, only its lit dots showing, what is behind seen
// between them. A mesh w x h, its middle at (x, y, z), facing face

export function concertWaves(w, h, x, y, z, face, B, { kind = null, live = false, palette = null, named = true, scroll = false, round = false, clear = false } = {}) {
  const WAVE_PALETTES = {                              // (three waves' colours and its name's)
    brand: null,
    tone: [[0.35, 1.25, 1.55], [0.9, 1.45, 1.55], [0.2, 0.55, 1.35], [1.1, 1.5, 1.6]],
    dusk: [[1.6, 0.75, 0.35], [1.5, 0.5, 0.9], [0.75, 0.45, 1.5], [1.6, 1.25, 0.95]],
    aurora: [[0.4, 1.5, 0.8], [0.35, 1.2, 1.5], [0.95, 0.5, 1.5], [1.1, 1.55, 1.25]],
  };
  palette ||= ['brand', 'tone', 'dusk', 'aurora'][(concertWaves.turns = (concertWaves.turns ?? -1) + 1) % 4];
  const aspect = w / h;
  kind ||= aspect > 4 ? 'strip' : aspect < 0.8 ? 'tall' : 'wide';
  // its name: middle, height (shares); where the waves run (their middle, how far they swing); where they are calm
  const L = {
    strip: { name: [0.13, 0.5, 0.62], wave: [0.5, 0.32], calm: [0, 0.27] },
    wide: { name: [0.5, 0.68, 0.24], wave: [0.34, 0.18], calm: [-1, -1] },   // (its name in the middle, over the waves)
    tall: { name: [0.5, 0.86, 0.12], wave: [0.42, 0.25], calm: [-1, -1] },
    blade: { wave: [0.5, 0.3], calm: [-1, -1] },
  }[kind];
  if (!named || scroll) { delete L.name; L.calm = [-1, -1]; }
  // (scroll: its name in a round of PERIOD heights, read going by: a round longer than it is, one name on it at a
  // time)
  const PERIOD = scroll ? Math.max(6, Math.ceil(aspect + 2)) : 6;
  const W = scroll ? 256 * PERIOD : aspect >= 1 ? 1024 : Math.round(1024 * aspect), H = scroll ? 256 : aspect >= 1 ? Math.round(1024 / aspect) : 1024;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (scroll) {
    const cs = H * 0.6;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${cs}px "PingFang SC", "Noto Sans SC", sans-serif`;
    [...B.name].forEach((c, i, all) => g.fillText(c, W * 0.3 + (i - (all.length - 1) / 2) * cs * 1.04, H * 0.52));
  }
  if (L.name) {
    // (its size and place as they fit: never wider than 0.6 of it, never over its edge)
    const [nx, ny, nh] = L.name, chars = [...B.name], cs = Math.min(nh * H, W * 0.6 / (chars.length * 1.04)), half = chars.length * cs * 0.52;
    const cx = THREE.MathUtils.clamp(nx * W, half + W * 0.05, W - half - W * 0.05);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${cs}px "PingFang SC", "Noto Sans SC", sans-serif`;
    chars.forEach((c, i, all) => g.fillText(c, cx + (i - (all.length - 1) / 2) * cs * 1.04, (1 - ny) * H));
  }
  const P = WAVE_PALETTES[palette], violet = new THREE.Color(B.color).toArray();
  const cols = (P || [violet.map((v) => v * 1.5), [1.5, 0.6, 1.15], [0.45, 1.25, 1.5], [1.35, 1.15, 1.6]]).map((c) => new THREE.Vector3(...c));
  const mat = new THREE.ShaderMaterial({
    ...(clear ? { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } : {}),
    uniforms: { uWords: { value: new THREE.CanvasTexture(cv) }, uTime: shared.uTime, uAspect: { value: aspect },
      uDots: { value: new THREE.Vector2(w, h).divideScalar(Math.min(w, h) / (kind === 'strip' ? 30 : 50)).floor() },
      uWave: { value: new THREE.Vector4(L.wave[0], L.wave[1], L.calm[0], L.calm[1]) }, uBeat: live ? musicBeat : { value: -1 },
      uCols: { value: cols }, uScroll: { value: scroll ? PERIOD : 0 }, uRound: { value: round ? 1 : 0 }, uClear: { value: clear ? 1 : 0 }, uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: B.index ?? 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D uWords; uniform float uTime, uAspect, uBeat, uScroll, uRound, uClear; uniform vec2 uDots; uniform vec4 uWave; uniform vec3 uCols[4];
      uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
      void main() {
        vec2 cell = (floor(vUv * uDots) + 0.5) / uDots, f = fract(vUv * uDots) - 0.5;
        float dotM = smoothstep(0.47, 0.3, length(f));
        dotM = mix(dotM, 0.45, clamp(max(fwidth(vUv.x * uDots.x), fwidth(vUv.y * uDots.y)) * 1.6 - 0.4, 0.0, 1.0));
        float px = 1.0 / uDots.y, xs = cell.x * uAspect;
        // the swell: on each beat (or, live, as loud as its music is just now)
        float beatT = fract(uTime * 76.0 / 60.0), pulse = uBeat >= 0.0 ? 0.35 + 1.1 * uBeat : 0.55 + 0.45 * exp(-beatT * 4.0);
        float calm = uWave.z < 0.0 ? 1.0 : 0.15 + 0.85 * smoothstep(uWave.w * uAspect, uWave.w * uAspect + 0.35, xs);
        vec3 col = vec3(0.0);
        vec3 C[3]; C[0] = uCols[0]; C[1] = uCols[1]; C[2] = uCols[2];
        for (int i = 0; i < 3; i++) {
          float fi = float(i), k = 6.0 + fi * 3.1, sp = 0.9 + fi * 0.35, ph = fi * 2.1;
          float amp = uWave.y * (0.55 + 0.45 * sin(uTime * 0.37 + fi * 1.7 + xs * 0.9)) * calm * pulse / (1.0 + fi * 0.35);
          float yw = uWave.x + amp * sin(xs * k + uTime * sp + ph) + (fi - 1.0) * 0.04;
          float d = abs(cell.y - yw) / px;
          col += C[i] * (exp(-d * d * 0.8) + 0.18 * exp(-d * d * 0.08)) * (0.8 - fi * 0.12);
        }
        // notes floating along the first wave, leftward
        for (int n = 0; n < 3; n++) {
          float fn = float(n), nx = (1.0 - fract(uTime * 0.05 + fn * 0.37)) * (uAspect + 0.3) - 0.15;
          float amp0 = uWave.y * (0.55 + 0.45 * sin(uTime * 0.37 + nx * 0.9)) * (uWave.z < 0.0 ? 1.0 : 0.15 + 0.85 * smoothstep(uWave.w * uAspect, uWave.w * uAspect + 0.35, nx)) * pulse;
          vec2 head = vec2(nx, uWave.x + amp0 * sin(nx * 6.0 + uTime * 0.9) + px * 6.0);
          vec2 q = vec2(xs, cell.y) - head;
          float note = step(length(q * vec2(1.0, 1.3)), px * 1.6)
            + step(abs(q.x - px * 1.3), px * 0.4) * step(0.0, q.y) * step(q.y, px * 6.0)
            + step(abs(q.y - px * 5.5 + (q.x - px * 1.3) * 0.6), px * 0.5) * step(px * 1.3, q.x) * step(q.x, px * 3.2);
          col += vec3(1.3, 1.2, 1.5) * min(note, 1.0) * 0.9;
        }
        vec2 wuv = uScroll > 0.0 ? vec2(fract(xs / uScroll + uTime * 0.035), cell.y) : cell;     // (scroll: its name going by)
        float words = textureLod(uWords, wuv, 0.0).r, halo = textureLod(uWords, wuv, 3.0).r;   // (round its name, dark, so it reads)
        col *= 1.0 - min(halo * 3.0, 1.0) * 0.85;
        col = mix(col, uCols[3], words * 0.95);
        if (uRound > 0.5) col = mix(col, uCols[3] * 0.9, smoothstep(0.445, 0.46, length(cell - 0.5)));   // (round: a ring of light at its edge)
        col = col * dotM * 1.1 + vec3(0.003, 0.002, 0.008) * (1.0 - dotM) * (1.0 - uClear);   // (clear: nothing between its dots)
        col = uHue * col;
        vec3 kk = vec3(0.57735), adj = uCaseAdj[uIndex];
        col = col * cos(adj.x) + cross(kk, col) * sin(adj.x) + kk * dot(kk, col) * (1.0 - cos(adj.x));
        col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(round ? new THREE.CircleGeometry(w / 2, 64) : new THREE.PlaneGeometry(w, h), mat);
  m.rotation.y = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }[face];
  m.position.set(x, y, z);
  m.layers.set(LAYER.GLOW);
  return m;
}
// A cinema's LED, w x h, its middle at (x, y, z), facing face: mode 'film', a film strip going by (kind 'sign': B's
// name on a plate over it; 'strip', 'wide', 'tall' by its shape: little scenes in its frames, now flowing, now pulled
// a frame at a time with a title card), or 'beam', a projector's beam onto a screen, the scenes melting one into the
// next; palette 'bright', 'moon', 'silver', 'rose', 'teal' (or by turns as they are made). In LED dots, B's name in
// them, its colours turned with B's (caseColors).

export function cinemaLED(w, h, x, y, z, face, B, { mode = null, palette = null, kind = null } = {}) {
  const PALETTES = {
    bright: { sky0: [0.62, 0.76, 0.88], sky1: [0.86, 0.95, 1.0], ink: [0.04, 0.15, 0.34], acc: [0.15, 0.45, 0.95], rim: [0.06, 0.18, 0.38], hole: [1.0, 1.05, 1.05], panel: [0.86, 0.95, 1.0], name: [0.04, 0.15, 0.34] },
    moon: { sky0: [0.03, 0.12, 0.3], sky1: [0.12, 0.52, 0.95], ink: [0.01, 0.015, 0.04], acc: [1.7, 1.45, 0.75], rim: [0.012, 0.012, 0.02], hole: [0.9, 0.85, 0.6], panel: [0.006, 0.008, 0.02], name: [1.7, 1.5, 0.9] },
    silver: { sky0: [0.03, 0.09, 0.17], sky1: [0.25, 0.55, 0.8], ink: [0.01, 0.02, 0.035], acc: [1.45, 1.68, 1.75], rim: [0.01, 0.014, 0.02], hole: [0.7, 0.9, 1.0], panel: [0.005, 0.008, 0.014], name: [1.4, 1.65, 1.75] },
    rose: { sky0: [0.16, 0.04, 0.18], sky1: [0.85, 0.32, 0.48], ink: [0.03, 0.01, 0.03], acc: [1.75, 1.25, 0.8], rim: [0.02, 0.01, 0.015], hole: [1.0, 0.7, 0.6], panel: [0.012, 0.005, 0.012], name: [1.75, 1.05, 1.1] },
    teal: { sky0: [0.02, 0.1, 0.11], sky1: [0.12, 0.55, 0.52], ink: [0.008, 0.025, 0.025], acc: [1.25, 1.7, 1.35], rim: [0.008, 0.016, 0.016], hole: [0.7, 1.0, 0.85], panel: [0.004, 0.01, 0.01], name: [1.2, 1.7, 1.5] },
  };
  // (one after another about the city: the film, the beam; each its colours)
  const turn = (cinemaLED.turns = (cinemaLED.turns ?? -1) + 1);
  mode ||= turn % 2 ? 'beam' : 'film';
  palette ||= ['moon', 'silver', 'rose', 'teal'][Math.floor(turn / 2 + turn) % 4];
  const A = w / h, P = PALETTES[palette];
  kind ||= A > 3 ? 'strip' : A < 0.8 ? 'tall' : 'wide';
  const dots = new THREE.Vector2(w, h).divideScalar(Math.min(w, h) / (kind === 'sign' ? 40 : kind === 'strip' ? 72 : 64)).floor();
  const rows = dots.y;
  // where things are, in heights from its foot and left: the film's band (x0, x1, y0, y1), the name's plate, the
  // screen, the projector; and its words, drawn red (always there) or green (its title card's, while held)
  let band = [0, 0, 0, 0], plate = [0, 0, -1, -1], scr = [0, 0, 0, 0], proj = [0, 0], axis = 0, motion = 0;
  const words = [];
  const nameAt = (x, y, size, ch = 'r') => words.push({ text: B.name, x, y, size, ch });
  const tagAt = (x, y, size) => { if (size * rows >= 8) words.push({ text: B.tagline, x, y, size, ch: 'r' }); };
  const moonAt = (x, y, r, ch) => words.push({ moon: true, x, y, r, ch });
  if (mode === 'film') {
    if (kind === 'sign') {
      band = [0, A, 0.04, 0.96]; plate = [A / 2 - 1.4, A / 2 + 1.4, 0.1, 0.9];
      nameAt(A / 2, 0.5, 0.56);
    } else if (kind === 'strip') {
      band = [1.5, A - 0.05, 0.1, 0.9];
      moonAt(0.72, 0.74, 0.12, 'r'); nameAt(0.72, 0.43, 0.26); tagAt(0.72, 0.17, 0.13);
    } else if (kind === 'wide') {
      band = [0, A, 0.06, 0.72]; motion = 1;
      nameAt(A / 2, 0.86, Math.min(0.18, A * 0.8 / 4.2));
      moonAt(A / 2, 0.39, 0.13, 'g');
    } else {
      band = [A * 0.06, A * 0.94, 0.22, 0.99]; axis = 1; motion = 1;
      nameAt(A / 2, 0.11, Math.min(0.11, A * 0.85 / 4.3));
      moonAt(A / 2, 0.605, A * 0.88 * 0.66 * 0.3, 'g');
    }
  } else if (kind === 'tall') {
    axis = 1; proj = [A / 2, 0.95];
    const sh = A * 0.84 / 1.45;
    scr = [A * 0.08, A * 0.92, 0.7 - sh, 0.7];
    const cs = Math.min(0.11, A * 0.85 / 4.3);
    nameAt(A / 2, (0.7 - sh) / 2 + 0.03, cs); tagAt(A / 2, (0.7 - sh) / 2 - cs * 1.1, cs * 0.55);
  } else {
    proj = [0.1, 0.8];
    scr = [A * 0.44, A * 0.96, 0.2, 0.92];
    const cs = Math.min(0.17, A * 0.4 * 0.92 / 4.2);
    nameAt(A * 0.24, 0.28, cs); tagAt(A * 0.24, 0.28 - cs * 1.15, Math.min(0.1, A * 0.36 / 6.3));
  }
  const W = A >= 1 ? 1024 : Math.round(1024 * A), H = A >= 1 ? Math.round(1024 / A) : 1024;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (const t of words) {
    const cx = t.x / A * W, cy = (1 - t.y) * H;
    g.fillStyle = t.ch === 'g' ? '#00ff00' : '#ff0000';
    if (t.moon) {
      // (a crescent: its disc, but for one a little up and to the right of it)
      const r = t.r * H;
      g.save(); g.beginPath(); g.rect(0, 0, W, H); g.arc(cx + r * 0.42, cy - r * 0.26, r * 0.86, 0, Math.PI * 2); g.clip('evenodd');
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.restore();
      continue;
    }
    const cs = t.size * H, chars = [...t.text];
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${cs}px "PingFang SC", "Noto Sans SC", sans-serif`;
    chars.forEach((c, i) => g.fillText(c, cx + (i - (chars.length - 1) / 2) * cs * 1.04, cy));
  }
  const v3 = (c) => new THREE.Vector3(...c);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uWords: { value: new THREE.CanvasTexture(cv) }, uTime: shared.uTime, uA: { value: A }, uDots: { value: dots },
      uMode: { value: mode === 'beam' ? 1 : 0 }, uAxis: { value: axis }, uMotion: { value: motion }, uSign: { value: kind === 'sign' || kind === 'strip' ? 1 : 0 },
      uBand: { value: new THREE.Vector4(...band) }, uPlate: { value: new THREE.Vector4(...plate) }, uScreen: { value: new THREE.Vector4(...scr) }, uProj: { value: new THREE.Vector2(...proj) },
      uSky0: { value: v3(P.sky0) }, uSky1: { value: v3(P.sky1) }, uInk: { value: v3(P.ink) }, uAcc: { value: v3(P.acc) }, uRim: { value: v3(P.rim) },
      uHole: { value: v3(P.hole) }, uPanel: { value: v3(P.panel) }, uName: { value: v3(P.name) }, uBright: { value: palette === 'bright' ? 1 : 0 },
      uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: B.index ?? 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D uWords; uniform float uTime, uA, uMode, uAxis, uMotion, uSign, uBright; uniform vec2 uDots, uProj;
      uniform vec4 uBand, uPlate, uScreen; uniform vec3 uSky0, uSky1, uInk, uAcc, uRim, uHole, uPanel, uName;
      uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
      float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      // scene k at q (0..1 in its frame, y up; fa its width over its height): (dark, lit)
      vec2 scene(float k, vec2 q, float fa, float t) {
        vec2 a = vec2(q.x * fa, q.y), sc = floor(a * 26.0);
        float star = step(0.972, h2(sc + k * 7.0)) * (0.55 + 0.45 * sin(t * 2.0 + h2(sc) * 30.0));
        float sil = 0.0, lit = 0.0;
        if (k < 0.5) {                       // the moon over the sea, its light on the water
          vec2 m = vec2(0.68 * fa, 0.66);
          float moon = step(length(a - m), 0.17) * step(0.15, length(a - m - vec2(0.075, 0.045)));
          float seaY = 0.3 + 0.018 * sin(a.x * 24.0 + t * 1.6), sea = step(q.y, seaY);
          float path = sea * step(abs(a.x - m.x + 0.03), 0.04 + 0.3 * (seaY - q.y)) * step(0.5, fract(q.y * 16.0 + t * 0.6 + sin(a.x * 9.0) * 0.3));
          sil = sea; lit = max(moon, path * 0.8) + star * (1.0 - sea) * (1.0 - moon) * 0.8;
        } else if (k < 1.5) {                // the city's towers, their windows
          float c = floor(a.x * 8.0), hb = 0.3 + 0.42 * h1(c * 3.1 + 1.7), bld = step(q.y, hb);
          vec2 wc = floor(vec2(a.x * 40.0, q.y * 40.0));
          float win = bld * step(0.5, mod(wc.y, 2.0)) * step(0.5, mod(wc.x, 2.0)) * step(q.y, hb - 0.05)
            * step(0.55, h2(wc + floor(t * 0.3 + h2(wc) * 5.0) * 0.37));
          float moon = step(length(a - vec2(0.2 * fa, 0.84)), 0.07);
          sil = bld; lit = win + max(moon, star * 0.7) * (1.0 - bld);
        } else if (k < 2.5) {                // the galaxy's train, going up into the stars
          float hill = step(q.y, 0.14 + 0.04 * sin(a.x * 5.0));
          float ry = 0.22 + 0.55 * q.x, dy = q.y - ry, x0 = (fract(t * 0.07) * 1.7 - 0.35) * fa;
          float train = step(x0 - 0.36 * fa, a.x) * step(a.x, x0) * step(abs(dy - 0.035), 0.035);
          float wins = train * step(0.45, fract(a.x * 14.0)) * step(abs(dy - 0.042), 0.014);
          float rail = step(abs(dy), 0.01) * step(0.5, fract(a.x * 20.0)) * (1.0 - train);
          float lamp = step(length(a - vec2(x0, ry + 0.04)), 0.028);
          sil = max(hill, train); lit = max(max(wins, lamp), rail * 0.6) + star * (1.0 - hill) * (1.0 - train);
        } else {                             // an island, its lighthouse; a star falling
          float water = step(q.y, 0.18), isl = step(q.y, 0.18 + 0.16 * exp(-pow((a.x - 0.42 * fa) * 5.0, 2.0)));
          float tower = step(abs(a.x - 0.5 * fa), 0.016) * step(q.y, 0.43);
          float lamp = step(length(a - vec2(0.5 * fa, 0.46)), 0.03) * step(0.45, fract(t * 0.5));
          float s = fract(t / 4.0);
          vec2 head = vec2(mix(0.92, 0.25, s) * fa, mix(0.94, 0.62, s)), d = normalize(vec2(0.67 * fa, 0.32));
          float along = dot(a - head, d), off = abs(dot(a - head, vec2(-d.y, d.x)));
          float fall = step(s, 0.45) * step(0.0, along) * step(along, 0.26) * step(off, 0.016 + along * 0.02) * (1.0 - along / 0.26);
          float glint = water * step(0.8, fract(a.x * 9.0 + q.y * 25.0 - t * 0.5)) * 0.35;
          sil = max(max(isl, tower), water * 0.85);
          lit = max(max(lamp, fall), glint) + star * (1.0 - isl) * (1.0 - water);
        }
        return vec2(sil, min(lit, 1.0));
      }
      vec3 shade(vec2 sl, float qy) {
        vec3 c = mix(uSky0, uSky1, qy);
        c = mix(c, uInk, sl.x);
        return mix(c, uAcc, sl.y);
      }
      void main() {
        vec2 cell = (floor(vUv * uDots) + 0.5) / uDots, f = fract(vUv * uDots) - 0.5;
        float dotM = smoothstep(0.47, 0.3, length(f));
        dotM = mix(dotM, 0.45, clamp(max(fwidth(vUv.x * uDots.x), fwidth(vUv.y * uDots.y)) * 1.6 - 0.4, 0.0, 1.0));
        vec2 p = vec2(cell.x * uA, cell.y);
        float px = 1.0 / uDots.y, t = uTime;
        vec3 col = uPanel;
        float title = 0.0;
        if (uMode < 0.5) {
          // the film: along it (u) and across it (v); its frames pitch apart, landscape
          float u = uAxis < 0.5 ? p.x : p.y, v = uAxis < 0.5 ? p.y : p.x;
          float L0 = uAxis < 0.5 ? uBand.x : uBand.z, L1 = uAxis < 0.5 ? uBand.y : uBand.w;
          float C0 = uAxis < 0.5 ? uBand.z : uBand.x, C1 = uAxis < 0.5 ? uBand.w : uBand.y;
          float S = C1 - C0, edge = 0.16 * S, fA = 0.64 * S, fL = uAxis < 0.5 ? fA * 1.36 : fA / 1.36, pitch = fL + 0.07 * S;
          // where it is: flowing, or pulled a frame at a time (four held 1.6 s, then its title held 4 s)
          float pos;
          if (uMotion < 0.5) pos = t * 0.22;
          else {
            float r = mod(t, 10.4), c = floor(t / 10.4);
            pos = c * 5.0 + (r < 6.4 ? floor(r / 1.6) + smoothstep(0.82, 1.0, fract(r / 1.6)) : 4.0 + smoothstep(0.93, 1.0, (r - 6.4) / 4.0));
            float m = floor((pos - 4.0) / 5.0 + 0.5) * 5.0 + 4.0;
            title = 1.0 - smoothstep(0.02, 0.18, abs(pos - m));
          }
          float vv = v - C0;
          if (u >= L0 && u <= L1 && vv >= 0.0 && vv <= S) {
            col = uRim;
            float sp = (u - (L0 + L1) * 0.5) / pitch + pos + 0.5, n = floor(sp), lf = (fract(sp) - 0.5) * pitch;
            // its holes, light through them
            float hs = (u - (L0 + L1) * 0.5) / (S * 0.21) + pos * pitch / (S * 0.21);
            float hole = step(abs(fract(hs) - 0.5), 0.26) * step(abs(min(vv, S - vv) - edge * 0.5), edge * 0.3);
            col = mix(col, uHole, hole);
            float ac = (vv - S * 0.5) / fA + 0.5, al = lf / fL + 0.5;
            if (abs(ac - 0.5) < 0.5 && abs(al - 0.5) < 0.5) {
              vec2 q = uAxis < 0.5 ? vec2(al, ac) : vec2(ac, al);
              float fa = uAxis < 0.5 ? fL / fA : fA / fL;
              float k = uMotion < 0.5 ? mod(n, 4.0) : mod(n, 5.0);
              float flick = uMotion > 0.5 ? 0.92 + 0.08 * h1(floor(t * 18.0)) : 1.0;
              // (its title card: dark, the night alone; its moon over it)
              col = (k > 3.5 ? mix(uSky0, uPanel, 0.6 - 0.6 * uBright) * (0.9 + 0.1 * h2(cell * 91.0)) : shade(scene(k, q, fa, t + n * 3.7), q.y)) * flick;
            }
          }
          // the canopy's: its name on a plate over the film, a line of light round it
          if (p.x > uPlate.x && p.x < uPlate.y && p.y > uPlate.z && p.y < uPlate.w) {
            float e = min(min(p.x - uPlate.x, uPlate.y - p.x), min(p.y - uPlate.z, uPlate.w - p.y));
            col = mix(uPanel, uHole * 0.8, step(e, px * 1.2));
          }
        } else {
          // the hall: its screen, the scenes melting one into the next dot by dot (7 s each)
          col = uPanel * (0.6 + 0.6 * p.y);
          vec2 q = (p - uScreen.xz) / (uScreen.yw - uScreen.xz);
          float fa = (uScreen.y - uScreen.x) / (uScreen.w - uScreen.z);
          float k0 = mod(floor(t / 7.0), 4.0), ph = fract(t / 7.0);
          if (abs(q.x - 0.5) < 0.5 && abs(q.y - 0.5) < 0.5) {
            float k = step(h2(cell * uDots + 3.1), smoothstep(0.72, 1.0, ph)) > 0.5 ? mod(k0 + 1.0, 4.0) : k0;
            col = shade(scene(k, q, fa, t), q.y) * (0.93 + 0.07 * h1(floor(t * 18.0)));
            float e = min(min(q.x, 1.0 - q.x) * fa, min(q.y, 1.0 - q.y));
            col = mix(col, uHole, step(e, 0.012) * 0.5);
          } else {
            // its beam, from the projector to the screen's near edge; dust drifting in the light
            float bt, lo, hi, xc;
            if (uAxis < 0.5) { bt = (p.x - uProj.x) / (uScreen.x - uProj.x); lo = mix(uProj.y, uScreen.z, bt); hi = mix(uProj.y, uScreen.w, bt); xc = p.y; }
            else { bt = (uProj.y - p.y) / (uProj.y - uScreen.w); lo = mix(uProj.x, uScreen.x, bt); hi = mix(uProj.x, uScreen.y, bt); xc = p.x; }
            if (bt > 0.0 && bt < 1.0 && xc > lo && xc < hi) {
              float e = min(xc - lo, hi - xc) / (hi - lo + 1e-3), ang = atan(p.y - uProj.y, p.x - uProj.x);
              float beam = smoothstep(0.0, 0.3, e) * (0.45 + 0.55 * (1.0 - bt)) * (0.75 + 0.25 * sin(ang * 70.0 + t * 0.8) * sin(ang * 23.0 - t * 0.5));
              vec2 dc = p * 9.0 + vec2(sin(t * 0.1) * 0.6, t * 0.12), id = floor(dc);
              vec2 mp = (id + 0.2 + 0.6 * vec2(h2(id), h2(id + 5.3)) + 0.15 * vec2(sin(t * 0.7 + h2(id) * 9.0), cos(t * 0.5 + h2(id) * 7.0))) / 9.0;
              vec2 mq = mp - vec2(sin(t * 0.1) * 0.6, t * 0.12) / 9.0;
              float dust = step(length(p - mq), px * 0.75) * step(0.45, h2(id + 1.7)) * (0.5 + 0.5 * sin(t * 2.3 + h2(id) * 20.0));
              col += mix(uAcc, vec3(1.5), 0.5) * (beam * 0.42 + dust * beam * 2.2);
            }
            col = mix(col, mix(uAcc, vec3(1.6), 0.6), step(length(p - uProj), px * 2.6));   // (its lens)
          }
        }
        // its words: round them in its own dark (or pale), so that they read
        vec4 wt = textureLod(uWords, cell, 0.0), wh = textureLod(uWords, cell, 3.0);
        float wa = max(wt.r, wt.g * title), ha = max(wh.r * (1.0 - uSign), wh.g * title);
        col = mix(col, uPanel, min(ha * 3.0, 1.0) * 0.8);
        col = mix(col, uName, wa * 0.95);
        // (bright: its dots' own colour between them, a little dimmer: dark on pale, it would fade to grey)
        col = uBright > 0.5 ? col * (0.86 + 0.16 * dotM) : col * dotM * 1.1 + uPanel * (1.0 - dotM) * 0.3;
        col = uHue * col;
        vec3 kk = vec3(0.57735), adj = uCaseAdj[uIndex];
        col = col * cos(adj.x) + cross(kk, col) * sin(adj.x) + kk * dot(kk, col) * (1.0 - cos(adj.x));
        col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.y = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }[face];
  m.position.set(x, y, z);
  m.layers.set(LAYER.GLOW);
  return m;
}
// A label drawn on a canvas, turned with a brand's colours (uCaseAdj, tuning.json caseColors): its material
// one that turns what it shows, the canvas kept (and drawn again as before)
export function inBrandColours(m, brand) {
  const transparent = m.material.transparent;
  m.material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: m.material.map }, uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: brand } },
    transparent, depthWrite: !transparent,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uMap; uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        vec3 c = uHue * t.rgb, k = vec3(0.57735), adj = uCaseAdj[uIndex];
        c = c * cos(adj.x) + cross(k, c) * sin(adj.x) + k * dot(k, c) * (1.0 - cos(adj.x));
        c = max(mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, adj.y), 0.0) * adj.z;
        gl_FragColor = vec4(c, t.a);
      }`,
  });
  return m;
}
// a flower of dots for the florist's signs: rings of dots round a yellow heart, at (cx, cy), r across

// ---------------------------------------------------------------- canvas labels, and the animal LED signs

// A plane (geom, placed) showing what draw(ctx, W, H) puts on a canvas H high (aspect: its width over its height),
// as it is (no shading): labels, plates, words over an LED sign (transparent: only what is drawn shows)
export function canvasPlane(geom, aspect, transparent, draw, H = 256) {
  const cv = document.createElement('canvas'), Wd = Math.max(16, Math.round(H * aspect));
  cv.width = Wd; cv.height = H;
  const g = cv.getContext('2d');
  draw(g, Wd, H);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent, depthWrite: !transparent }));
  m.layers.set(LAYER.GLOW);
  m.userData.redraw = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, Wd, H); draw(g, Wd, H); tex.needsUpdate = true; };   // (drawn again: a font changed)
  return m;
}
// The animal LED sign (a gift shop's): dots lit in B's colour (default yellow) on a dark
// grid, animal faces (Noto Emoji's, kit/icons.js) blinking now and then, its name in finer dots. layout:
//   'face'   one great kitten's face, sparkles round it; its name beside it (wide) or under it (upright); words:
//            false for none (a blade sign)
//   'tiles'  small faces in tiles, three rows (an upright one three columns; rows: 1 for a shop's fascia), the
//            name's first four characters in the four middle tiles; on a wide one the faces turn round in a wave;
//            animals: many animals' faces rather than only the kitten
//   'flip'   a machine's: tiles of animals' faces, no words, turned over one after another like cards
// geom: its plane (placed), w x h; seed its numbers; B the brand ({ name, en, color, index })
export const MEOW_ANIMALS = ['cat', 'rabbit', 'fox', 'bear', 'panda', 'frog', 'penguin', 'hamster', 'dog', 'tiger', 'koala', 'mouse', 'pig'];
export function meowLED(geom, w, h, seed, B, { layout = 'face', words = true, animals = false, rows = 0, cols = 0, fine = 44 } = {}) {
  const Rn = makeRandom(Math.floor(seed * 1e6) + 913), wide = w / h > 1.3;
  const cell = Math.min(w, h) / fine, S = 8;
  let NX = Math.max(4, Math.round(w / cell)), NY = Math.max(4, Math.round(h / cell));
  let q;
  // where things go, in cells (y down): faces [cx, cy, size, animal, its own moment to blink], characters [ch, cx, cy, size]
  const faces = [], chars = [], flip = layout === 'flip';
  let line = null, tiles = null, spin = false;                                           // (the words beside or under a great face)
  if (layout === 'face') {
    const tall = !wide, size = tall ? Math.min(NX * 0.9, NY * 0.62) : NY * 0.82;
    faces.push([wide ? NY * 0.46 : NX / 2, wide ? NY / 2 : (words ? NY * 0.4 : NY / 2), size, 'cat', 0]);
    if (words) line = wide ? { x0: NY * 0.92, w: NX - NY * 0.98, y: NY * 0.5, align: 'left' } : { x0: NX * 0.08, w: NX * 0.84, y: NY * 0.82, align: 'center' };
  } else {
    // (tiles: three rows across a wide one, three columns down an upright one, or as many rows as asked)
    const across = rows ? true : wide || w / h > 0.8;
    let nr = rows || (across ? 3 : Math.max(4, Math.round(NY / (NX / 3)))), nc = cols || (across ? Math.max(4, Math.round(NX / (NY / nr))) : 3);
    // (a face wants 17 dots across or so to look like itself: finer dots if it would have fewer)
    let mg = Math.min(NX, NY) * 0.07;
    const gr = flip ? 0.12 : 0.2, fit = (r, c) => Math.min((NX - 2 * mg) / (c + gr * (c - 1)), (NY - 2 * mg) / (r + gr * (r - 1))), MIN = 17;
    if (flip) {                                                            // (a machine's: whichever grid its faces fill best,
      let best = 0;                                                        // its dots kept as they are if it can)
      for (const keep of [true, false]) {
        for (let r = 2; r <= 6; r++) for (let c = 2; c <= 6; c++) {
          const f = r * c * fit(r, c) ** 2;
          if (r * c >= 6 && r * c <= 20 && (!keep || fit(r, c) * 0.96 >= MIN) && f > best * 1.001) { best = f; nr = r; nc = c; }
        }
        if (best) break;
      }
    }
    if (fit(nr, nc) * 0.96 < MIN) { const k = (MIN + 0.5) / (fit(nr, nc) * 0.96); NX = Math.round(NX * k); NY = Math.round(NY * k); mg = Math.min(NX, NY) * 0.07; }
    const sz = fit(nr, nc);
    const gx = nc > 1 ? (NX - 2 * mg - nc * sz) / (nc - 1) : 0, gy = nr > 1 ? (NY - 2 * mg - nr * sz) / (nr - 1) : 0;
    tiles = { mg, sz, gx, gy, nr, nc };
    spin = layout === 'tiles' && across && nr >= 3;
    const mid = across ? [Math.floor(nr / 2), Math.floor((nc - 4) / 2)] : [Math.floor((nr - 4) / 2), 1];
    const kinds = Array.from({ length: nr * nc }, (_, i) => (animals || flip ? MEOW_ANIMALS[i % MEOW_ANIMALS.length] : 'cat'));
    for (let i = kinds.length - 1; i > 0; i--) { const j = Rn.int(0, i); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const name = [...B.name];
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      const cx = mg + sz / 2 + c * (sz + gx), cy = mg + sz / 2 + r * (sz + gy);
      const k = flip ? -1 : across ? (r === mid[0] ? c - mid[1] : -1) : (c === mid[1] ? r - mid[0] : -1);
      if (k >= 0 && k < 4 && nc * nr >= 6) chars.push([name[k], cx, cy, sz * 0.9]);
      else {
        // (each face a whole number of cells across, its corner on a cell's: so every one falls on the dots alike)
        const n = Math.round(sz * 0.96), at = (v) => Math.round(v - n / 2) + n / 2;
        faces.push([at(cx), at(cy), n, kinds[r * nc + c], Rn.next(), (nr - 1 - r) * nc + c]);   // (its tile counted from the foot up)
      }
    }
  }
  // the faces drawn large and looked at in the middle of each cell (R: as they are; G: with eyes shut, for a cat)
  // (or, flip, as they are in one of its four turns: backs[f][tile] the animal there)
  const draw = (blink, backs) => {
    const c = document.createElement('canvas'); c.width = NX * S; c.height = NY * S; const g = c.getContext('2d');
    for (const [cx, cy, size, face, , tile] of faces) {
      const px = cx * S, py = cy * S, sz = size * S, animal = backs ? backs[tile] : face;
      drawIcon(g, `noto/${animal}`, px, py, sz, '#ffffff');
      if (blink && animal === 'cat') {                                     // (its eyes, in the glyph's 512, shut: lines)
        const k = sz / 512, ox = px - 256 * k, oy = py - 256 * k;
        for (const ex of [164, 348]) {
          g.fillStyle = '#000'; g.beginPath(); g.ellipse(ox + ex * k, oy + 279 * k, 34 * k, 40 * k, 0, 0, 7); g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 12 * k; g.beginPath(); g.arc(ox + ex * k, oy + 262 * k, 26 * k, 0.35, Math.PI - 0.35); g.stroke();
        }
      }
    }
    return g.getImageData(0, 0, c.width, c.height).data;
  };
  // (a cell lit: the great face, if lit in its middle; small faces in tiles, if lit over a third of it or so, so
  // their fine lines keep)
  const lit = layout === 'face' ? (d, i, row) => d[((row * S + S / 2) * NX * S + i * S + S / 2) * 4] > 110 : (d, i, row) => {
    let v = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const p = ((row * S + y) * NX * S + i * S + x) * 4; v += d[p] * d[p + 3]; }
    return v / (S * S * 255 * 255) > 0.3;
  };
  let open, shut, plan = null, L = 0;
  if (flip) {
    // its four turns: in each, every tile a different animal from the turn before (and the last from the first);
    // the plan, in rounds: every tile turned over once a round, in no order, never one twice running; four rounds
    // and each is back as it began. A texel each tile each step: its turn before, after, and whether it turns now
    const N = tiles.nr * tiles.nc, backs = [faces.map((f) => f[3])];
    for (let f = 1; f < 4; f++) {
      const b = [...backs[0]];
      for (let i = N - 1; i > 0; i--) { const j = Rn.int(0, i); [b[i], b[j]] = [b[j], b[i]]; }
      for (let pass = 0; pass < 6; pass++) for (let t = 0; t < N; t++) {
        const bad = (u) => b[u] === backs[f - 1][u] || (f === 3 && b[u] === backs[0][u]);
        if (!bad(t)) continue;
        const u = Rn.int(0, N - 1); [b[t], b[u]] = [b[u], b[t]];
      }
      backs.push(b);
    }
    const byTile = (f) => { const o = []; for (const fc of faces) o[fc[5]] = backs[f][faces.indexOf(fc)]; return o; };
    const frames = [0, 1, 2, 3].map((f) => draw(false, byTile(f)));
    open = frames;
    const order = [];
    for (let r = 0; r < 4; r++) {
      const o = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Rn.int(0, i); [o[i], o[j]] = [o[j], o[i]]; }
      if (order.length && o[0] === order[order.length - 1] && N > 1) [o[0], o[1]] = [o[1], o[0]];
      order.push(...o);
    }
    L = order.length; plan = new Uint8Array(N * L * 4);
    const turn = new Array(N).fill(0);
    for (let st = 0; st < L; st++) {
      for (let t = 0; t < N; t++) plan.set([turn[t] * 85, (order[st] === t ? (turn[t] + 1) % 4 : turn[t]) * 85, order[st] === t ? 255 : 0, 255], (st * N + t) * 4);
      turn[order[st]] = (turn[order[st]] + 1) % 4;
    }
  } else { open = draw(false); shut = draw(true); }
  // (each cell's own moment to blink: its face's)
  const when = new Float32Array(NX * NY);
  for (const [cx, cy, size, , m] of faces) for (let j = Math.max(0, Math.floor(cy - size / 2)); j < Math.min(NY, cy + size / 2); j++) for (let i = Math.max(0, Math.floor(cx - size / 2)); i < Math.min(NX, cx + size / 2); i++) when[j * NX + i] = m;
  // (the back of each head, as it turns: its outline filled, every cell the outside can't reach past it)
  const back = new Uint8Array(NX * NY);
  if (spin) {
    const out = new Uint8Array(NX * NY), stack = [];
    const at = (i, row) => { if (i < 0 || row < 0 || i >= NX || row >= NY || out[row * NX + i] || lit(open, i, row)) return; out[row * NX + i] = 1; stack.push(i, row); };
    for (let i = 0; i < NX; i++) { at(i, 0); at(i, NY - 1); }
    for (let r = 0; r < NY; r++) { at(0, r); at(NX - 1, r); }
    while (stack.length) { const row = stack.pop(), i = stack.pop(); at(i + 1, row); at(i - 1, row); at(i, row + 1); at(i, row - 1); }
    for (let k = 0; k < NX * NY; k++) back[k] = out[k] ? 0 : 1;
  }
  const a = new Uint8Array(NX * NY * 4);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const row = NY - 1 - j;                                               // (the texture's rows from the foot up)
    if (flip) a.set(open.map((d) => (lit(d, i, row) ? 255 : 0)), (j * NX + i) * 4);          // (RGBA: lit in each of its turns)
    else a.set([lit(open, i, row) ? 255 : 0, lit(shut, i, row) ? 255 : 0, back[row * NX + i] * 255, Math.round(when[row * NX + i] * 255)], (j * NX + i) * 4);   // (B: its back)
  }
  const tHead = new THREE.DataTexture(a, NX, NY); tHead.magFilter = tHead.minFilter = THREE.NearestFilter; tHead.needsUpdate = true;
  // the words, in dots of their own, about 13 to a character's height whatever its size (white; a second line in its
  // yellow): their grid Ft to a cell
  const big = chars.length ? chars[0][3] : line ? Math.min(NY * 0.2, line.w / 4.4) : 10, Ft = THREE.MathUtils.clamp(13 / big, 0.3, 4);
  const TX = Math.max(1, Math.round(NX * Ft)), TY = Math.max(1, Math.round(NY * Ft));
  const tc = document.createElement('canvas'); tc.width = TX * 4; tc.height = TY * 4; const tg = tc.getContext('2d');
  q = tc.width / NX;
  tg.textBaseline = 'middle'; tg.textAlign = 'center';
  for (const [ch, cx, cy, size] of chars) { tg.fillStyle = '#fff'; tg.font = `800 ${size * q}px "PingFang SC", "Noto Sans SC", sans-serif`; tg.fillText(ch, cx * q, (cy + size * 0.04) * q); }
  if (line) {
    const cn = Math.min(NY * 0.2, line.w / 4.4), ax = (line.align === 'left' ? line.x0 : NX / 2) * q;
    tg.textAlign = line.align;
    tg.fillStyle = '#fff'; tg.font = `800 ${cn * q}px "PingFang SC", "Noto Sans SC", sans-serif`; tg.fillText(B.name, ax, (line.y - cn * 0.35) * q, line.w * q);
    tg.fillStyle = '#f00'; tg.font = `700 ${cn * 0.42 * q}px "Helvetica Neue", Arial, sans-serif`; tg.fillText((B.en || '').split('').join(' '), ax, (line.y + cn * 0.66) * q, line.w * q);
  }
  const td = tg.getImageData(0, 0, tc.width, tc.height).data, b = new Uint8Array(TX * TY * 4);
  for (let j = 0; j < TY; j++) for (let i = 0; i < TX; i++) {
    const p = (((TY - 1 - j) * 4 + 2) * tc.width + i * 4 + 2) * 4;
    if (td[p + 3] > 110) b.set([td[p + 1] > 128 ? 255 : 0, 255, 0, 255], (j * TX + i) * 4);    // (G: lit; R: white, else its yellow)
  }
  const tText = new THREE.DataTexture(b, TX, TY); tText.magFilter = tText.minFilter = THREE.NearestFilter; tText.needsUpdate = true;
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  let tPlan = null, tOrder = null, M = 0;
  if (spin) {                                                              // (each face's turn: in reading order)
    const N = tiles.nr * tiles.nc, o = new Uint8Array(N * 4);
    [...faces].sort((p, q) => p[1] - q[1] || p[0] - q[0]).forEach((f, k) => o.set([k, 255, 0, 255], f[5] * 4));
    M = faces.length; tOrder = new THREE.DataTexture(o, N, 1); tOrder.magFilter = tOrder.minFilter = THREE.NearestFilter; tOrder.needsUpdate = true;
  }
  if (flip) { tPlan = new THREE.DataTexture(plan, tiles.nr * tiles.nc, L); tPlan.magFilter = tPlan.minFilter = THREE.NearestFilter; tPlan.needsUpdate = true; }
  const mat = new THREE.ShaderMaterial({
    defines: flip ? { FLIP: 1 } : spin ? { SPIN: 1 } : {},
    uniforms: { uTime: shared.uTime, uHead: { value: tHead }, uText: { value: tText }, uN: { value: new THREE.Vector2(NX, NY) }, uT: { value: new THREE.Vector2(TX, TY) },
      uPlan: { value: tPlan }, uOrder: { value: tOrder }, uSpin: { value: new THREE.Vector2(M, M * 0.3 + 2.0) }, uTile: { value: tiles ? new THREE.Vector4(tiles.mg, tiles.sz, tiles.gx, tiles.gy) : new THREE.Vector4() },
      uGrid: { value: tiles ? new THREE.Vector3(tiles.nc, tiles.nr, L) : new THREE.Vector3() },
      uOn: { value: col(B.color || '#ffd166', 1.35) }, uOff: { value: col('#1b2a4a', 1.0) }, uBg: { value: col('#0c1530') }, uWhite: { value: col('#fff6dc', 1.3) },
      uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: B.index ?? 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uHead, uText, uPlan, uOrder; uniform vec2 uN, uT, uSpin; uniform float uTime; uniform vec3 uOn, uOff, uBg, uWhite;
      uniform vec4 uTile; uniform vec3 uGrid;
      uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
      float dotm(vec2 f, float r, float aa) { return mix(r * 1.7, 1.0 - smoothstep(r - 0.05, r + 0.05, length(f - 0.5)), aa); }
      void main() {
        vec2 g = vUv * uN, c = floor(g);
        float aa = 1.0 - smoothstep(0.25, 0.6, max(fwidth(g.x), fwidth(g.y)));
        float hash = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5);
#ifdef FLIP
        // which tile, and where this is in the plan: a step of 0.4 s, one tile turning over in it (its dots squeezed
        // toward its middle, as a card seen edgewise, and out again with the next animal), lit white a while
        vec2 cs = c + 0.5, i2 = clamp(floor((cs - uTile.x + uTile.zw * 0.5) / (uTile.y + uTile.zw)), vec2(0.0), uGrid.xy - 1.0);
        vec2 mid = uTile.x + uTile.y * 0.5 + i2 * (uTile.y + uTile.zw);
        float tile = i2.y * uGrid.x + i2.x, now = mod(floor(uTime * 2.5), uGrid.z), u = fract(uTime * 2.5);
        vec4 pl = texture2D(uPlan, vec2((tile + 0.5) / (uGrid.x * uGrid.y), (now + 0.5) / uGrid.z));
        float turning = pl.b, p = clamp(u / 0.8, 0.0, 1.0), sq = turning > 0.5 ? max(abs(cos(3.14159 * p)), 0.04) : 1.0;
        float f = floor((turning > 0.5 && p > 0.5 ? pl.g : pl.r) * 3.0 + 0.5);
        vec2 at = vec2(mid.x + (cs.x - mid.x) / sq, cs.y);
        vec4 s = abs(at.x - mid.x) > uTile.y * 0.5 + 0.5 ? vec4(0.0) : texture2D(uHead, floor(at) / uN + 0.5 / uN);
        float on = f < 0.5 ? s.r : f < 1.5 ? s.g : f < 2.5 ? s.b : s.a;
        float white = turning * (1.0 - smoothstep(0.75, 1.0, u)), edge = mix(0.55, 1.0, sq);
#elif defined(SPIN)
        // its turn to go round (0.3 s after the one before, in reading order; 0.8 s a turn): its dots squeezed toward
        // its middle and out again, the back of its head (a little dimmer) while it faces away
        vec2 cs = c + 0.5, i2 = clamp(floor((cs - uTile.x + uTile.zw * 0.5) / (uTile.y + uTile.zw)), vec2(0.0), uGrid.xy - 1.0);
        vec2 mid = uTile.x + uTile.y * 0.5 + i2 * (uTile.y + uTile.zw);
        vec4 od = texture2D(uOrder, vec2((i2.y * uGrid.x + i2.x + 0.5) / (uGrid.x * uGrid.y), 0.5));
        float p = od.g > 0.5 ? clamp((mod(uTime, uSpin.y) - floor(od.r * 255.0 + 0.5) * 0.3) / 0.8, 0.0, 1.0) : 0.0;
        p = p * p * (3.0 - 2.0 * p);
        float cz = cos(6.28318 * p), sq = max(abs(cz), 0.04), away = cz < 0.0 ? 1.0 : 0.0;
        vec2 at = vec2(mid.x + (cs.x - mid.x) / sq * (away > 0.5 ? -1.0 : 1.0), cs.y);
        vec4 s = abs(at.x - mid.x) > uTile.y * 0.5 + 0.5 ? vec4(0.0) : texture2D(uHead, floor(at) / uN + 0.5 / uN);
        float bt = mod(uTime + s.a * 4.3, 4.3), shut = (bt > 3.6 && bt < 3.75) || (bt > 3.95 && bt < 4.07) ? 1.0 : 0.0;
        float on = away > 0.5 ? s.b : mix(s.r, s.g, shut), white = 0.0, edge = mix(0.55, 1.0, sq) * (away > 0.5 ? 0.78 : 1.0);
#else
        vec4 s = texture2D(uHead, (c + 0.5) / uN);
        // blinking: now and then (each face at its own moment) its eyes shut a moment, twice, quickly
        float bt = mod(uTime + s.a * 4.3, 4.3), shut = (bt > 3.6 && bt < 3.75) || (bt > 3.95 && bt < 4.07) ? 1.0 : 0.0;
        float on = mix(s.r, s.g, shut), white = 0.0, edge = 1.0;
#endif
        // a shimmer across it, and sparkles twinkling here and there
        float shimmer = 0.85 + 0.15 * sin(uTime * 2.0 - (c.x + c.y) * 0.25);
        float sp = step(0.985, hash) * max(0.0, sin(uTime * 3.0 + fract(hash * 91.3) * 40.0));
        vec3 lit = on > 0.5 ? mix(uOn * shimmer, uWhite, white) * edge : mix(uOff, uWhite, sp);
        vec3 col = mix(uBg, lit, dotm(fract(g), on > 0.5 || sp > 0.05 ? 0.44 : 0.3, aa));
        // the words, in finer dots
        vec2 gt = vUv * uT, ct = floor(gt); vec4 t = texture2D(uText, (ct + 0.5) / uT);
        if (t.g > 0.5) col = mix(col, t.r > 0.5 ? uWhite : uOn, dotm(fract(gt), 0.42, 1.0 - smoothstep(0.25, 0.6, max(fwidth(gt.x), fwidth(gt.y)))));
        vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
        col = uHue * col;
        col = col * cos(adj.x) + cross(k, col) * sin(adj.x) + k * dot(k, col) * (1.0 - cos(adj.x));
        col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geom, mat);
  m.layers.set(LAYER.GLOW);
  return m;
}

// ---------------------------------------------------------------- themed LED signs (ice cream and tea shops)
// LED dots in a theme's colours, a light all round the edge, and over the dots, crisp, one of:
//   'name'  the shop's name in the theme's round hand, the theme's marks either side of it by turns, mirrored
//   'icon'  its mark, small in the middle (a blade sign)
//   'menu'  no words: each flavour's mark in its own colour, as many as are left of it, the rest faint
// A theme: { low, deep, bg (the dots' colours), ink (the words'), shade (their glow), rim (the edge's light),
// font (a kit/atlas.js FONTS label), mark (an icon), side(k) (the marks beside the name: [icon, mirrored]), stock
// ([colour, how many left] for the menu), cup (the menu's mark, if not its mark) }. Icons from kit/icons.js.
export const THEMES = {
  icecream: { low: [1.0, 0.6, 0.74], deep: [0.62, 0.3, 0.42], bg: [0.06, 0.03, 0.045], ink: '#ffffff', shade: 'rgba(70, 10, 40, 0.75)', rim: [1.7, 1.85, 1.9],
    font: '站酷快乐体', mark: 'material/icecream', side: (k) => (k % 2 ? ['material/icecream'] : ['material/cloud']),
    stock: [['#ff8fb3', 5], ['#ffc4d8', 3], ['#fff1d6', 4], ['#e9c08a', 1], ['#a8d8a0', 5], ['#ffd27a', 2]] },
  moon: { low: [0.2, 0.2, 0.55], deep: [0.14, 0.13, 0.38], bg: [0.02, 0.02, 0.06], ink: '#fff3d6', shade: 'rgba(10, 5, 40, 0.8)', rim: [1.6, 1.4, 0.95],
    font: '站酷快乐体', mark: 'material/bedtime', side: (k) => [['material/bedtime', true], ['full'], ['material/bedtime']][k % 3],
    stock: [['#d9b38c', 5], ['#b99ad9', 3], ['#a8d8a0', 4], ['#8a5a3c', 2], ['#ffb3a0', 5], ['#f5f0dc', 1]], cup: 'material/emoji_food_beverage' },
};
// (a mark, or the full moon, drawn at (cx, cy); flip: mirrored)
function mark(g, [name, flip], cx, cy, size, fill) {
  if (name === 'full') { g.fillStyle = fill; g.beginPath(); g.arc(cx, cy, size * 0.36, 0, Math.PI * 2); g.fill(); return; }
  if (flip) { g.save(); g.translate(cx, cy); g.scale(-1, 1); drawIcon(g, name, 0, 0, size, fill); g.restore(); } else drawIcon(g, name, cx, cy, size, fill);
}
// The sign w x h centred at (x, y, z) facing face; name: the words; what: 'name', 'icon', 'menu'. add: { mesh(m),
// shown(geom, rgb) } (the world's addMesh and shown, or inShown inside a shop). The theme's font must have loaded
// for the name (main.js loads those of the district's themed shops).
export function themedSign(sw, sh, x, y, z, face, name, theme, what, add) {
  const T = typeof theme === 'string' ? THEMES[theme] : theme;
  add.mesh(ledPicture(panel(sw, sh, x, y, z, face), sw, sh, (g, Wc, Hc) => { g.fillStyle = '#808080'; g.fillRect(0, 0, Wc, Hc); },
    { low: what === 'menu' ? T.deep : T.low, high: [1.95, 1.85, 1.9], bg: T.bg, density: Math.max(22, 90 / sw) }));
  const turn = FACE_TURN[face], nx = Math.sin(turn), nz = Math.cos(turn);
  const over = (pw, ph, draw) => add.mesh(canvasPlane(new THREE.PlaneGeometry(pw, ph).rotateY(turn).translate(x + nx * 0.015, y, z + nz * 0.015), pw / ph, true, draw, 512));
  const shade = (g) => { g.shadowColor = T.shade; g.shadowBlur = 12; };
  if (what === 'name') over(sw * 0.96, sh * 0.8, (g, Wc, Hc) => {
    shade(g); g.fillStyle = T.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 ${Hc * 0.7}px ${family(T.font)}`;
    const text = [...name].join(String.fromCharCode(8202)), tw = Math.min(g.measureText(text).width, Wc * 0.6);
    g.fillText(text, Wc / 2, Hc * 0.54, Wc * 0.6);
    const size = Hc * 0.62, step = Hc * 0.86, n = Math.max(0, Math.floor(((Wc - tw) / 2 - Hc * 0.3) / step));
    for (let k = 0; k < n; k++) {
      const off = tw / 2 + Hc * 0.25 + step * (k + 0.5), [nm, fl] = T.side(k);
      for (const e of [-1, 1]) mark(g, [nm, e < 0 ? !fl : fl], Wc / 2 + e * off, Hc * 0.52, size, T.ink);
    }
  });
  if (what === 'icon') over(sh * 0.56, sh * 0.56, (g, Wc, Hc) => { shade(g); mark(g, [T.mark], Wc / 2, Hc / 2, Hc * 0.92, T.ink); });
  if (what === 'menu') over(sw * 0.94, sh * 0.9, (g, Wc, Hc) => {
    shade(g);
    const most = 5, size = Hc * 0.27, step = Hc * 0.29;
    T.stock.forEach(([hex, left], i) => {
      const cx0 = Wc * (i < 3 ? 0.25 : 0.75) - (most - 1) * step / 2, cy = Hc * (0.2 + (i % 3) * 0.3);
      for (let k = 0; k < most; k++) mark(g, [T.cup || T.mark], cx0 + k * step, cy, size, k < left ? hex : 'rgba(255, 255, 255, 0.16)');
    });
  });
  const t = 0.035, rim = [box(-sw / 2 - t, sw / 2 + t, sh / 2, sh / 2 + t, 0, 0.04), box(-sw / 2 - t, sw / 2 + t, -sh / 2 - t, -sh / 2, 0, 0.04),
    box(-sw / 2 - t, -sw / 2, -sh / 2, sh / 2, 0, 0.04), box(sw / 2, sw / 2 + t, -sh / 2, sh / 2, 0, 0.04)];
  for (const g of rim) add.shown(g.rotateY(turn).translate(x, y, z), T.rim);
}
