// The giant screens. Every screen in the city is one mesh with one material; what
// each one shows comes from its vertex attributes: aScr = (program, seed, width m, height m), aRect = the
// part of the text atlas it uses. Whatever a program draws is a brightness from 0 to 1, posterized into the
// same few tones as the rest of the city (dark, cyan, and white bright enough to bloom), with an LED dot
// grid up close, rolling scan bands, flicker and the odd glitch. A fourth tone: lines glowing cyan (gNeon).

import * as THREE from 'three';
import { shared, DEFINES, COMMON } from './toon.js';
import { VFX_GLSL } from './vfx.js';

export const PROG = {
  GLYPHS: 0, RINGS: 1, BARS: 2, TEXT: 3, CAT: 4, HORIZON: 5, GLYPH: 6, WAVES: 7, TICKER: 8,
  RIBBONS: 9, BLOBS: 10, TUNNEL: 11, INTERFERENCE: 12, VORTEX: 13, CELLS: 14, BRAND: 15, METRO: 16,
  VENDING: 17, CARDS: 18, BLINDBOX: 19, GACHA: 20,
};
// the pure motion-graphics ads (vfx.js)
export const VFX = [PROG.RIBBONS, PROG.BLOBS, PROG.TUNNEL, PROG.INTERFERENCE, PROG.VORTEX, PROG.CELLS];

// atlas: the texture of words and logos; ads: the catalog's tables (ads/catalog.js adUniforms), n entries.
// What a screen shows is aScr.x, an entry of the catalog.
export function screenMaterial(atlas, ads, n) {
  return new THREE.ShaderMaterial({
    defines: { ...DEFINES, N_AD: n },
    uniforms: { ...shared, ...ads, uAtlas: { value: atlas } },
    vertexShader: /* glsl */ `
      attribute vec4 aScr; attribute vec4 aRect;
      varying vec2 vUv; varying vec4 vScr; varying vec4 vRect; varying vec3 vWorld;
      void main() {
        vUv = uv; vScr = aScr; vRect = aRect;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform sampler2D uAtlas; uniform vec3 uScrDark, uScrMid; uniform float uScrHot, uAdPoster, uAdOwn, uAdBright;
      uniform float uAdTpl[N_AD], uAdSpeed[N_AD]; uniform vec3 uAdColor[N_AD];
      uniform vec4 uAdLogo[N_AD], uAdName[N_AD], uAdTag[N_AD], uAdNameV[N_AD];
      varying vec2 vUv; varying vec4 vScr; varying vec4 vRect; varying vec3 vWorld;

      float text(vec2 uv) { return texture2D(uAtlas, mix(vRect.xy, vRect.zw, clamp(uv, 0.0, 1.0))).r; }
      // the text fitted inside the panel without stretching it, with a margin around
      float fitText(vec2 uv, float margin) {
        float a = vScr.z / vScr.w, ra = (vRect.z - vRect.x) / max(vRect.w - vRect.y, 1e-4);
        vec2 q = uv - 0.5;
        if (a > ra) q.x *= a / ra; else q.y *= ra / a;
        q = q * (1.0 + margin) + 0.5;
        if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
        return text(q);
      }
      float lineAt(float d, float w) { return 1.0 - smoothstep(w * 0.5, w * 0.5 + fwidth(d) * 1.2, abs(d)); }
      // a colour turned round the grey axis by a radians
      vec3 turnHue(vec3 c, float a) {
        vec3 k = vec3(0.57735);
        float ca = cos(a);
        return max(c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca), 0.0);
      }

      // streams of glyphs falling down columns
      float glyphs(vec2 uv, float t, float seed) {
        vec2 res = max(vec2(4.0), floor(vScr.zw * 1.3));
        float col = floor(uv.x * res.x);
        vec2 g = vec2(fract(uv.x * res.x), fract(uv.y * res.y));
        float row = floor(uv.y * res.y);
        vec2 px = floor(g * vec2(5.0, 7.0));
        float change = floor(t * (0.7 + hash11(col * 3.1 + seed) * 2.5) + hash11(row + col));
        float bit = step(0.48, hash12(px + vec2(row * 13.0, col * 7.0) + change * 3.7));
        float inG = step(0.1, g.x) * step(g.x, 0.9) * step(0.08, g.y) * step(g.y, 0.92);
        float sp = 0.12 + hash11(col + seed) * 0.25;
        float head = fract(hash11(col * 1.7 + seed) - t * sp);           // where the stream's head is (from the bottom)
        float behind = uv.y - head; behind += behind < 0.0 ? 1.0 : 0.0;   // distance above the head
        float trail = 1.0 - smoothstep(0.0, 0.45, behind);
        float v = 0.18 + trail * 0.5 + step(behind, 0.025) * 0.5;
        return v * bit * inG;
      }
      // rings spreading from a pulsing core, and a turning ring of ticks
      float rings(vec2 uv, float t) {
        vec2 p = (uv - 0.5) * vec2(vScr.z / vScr.w, 1.0);
        float d = length(p), a = atan(p.y, p.x);
        float r = lineAt(fract(d * 5.0 - t * 0.35) - 0.5, 0.06) * 0.5 * (1.0 - smoothstep(0.3, 0.7, d));
        float ticks = step(0.5, fract(a / 6.2832 * 24.0 + t * 0.15)) * lineAt(d - 0.36, 0.035);
        float arc = step(0.72, fract(a / 6.2832 - t * 0.08)) * lineAt(d - 0.42, 0.012);
        float core = 1.0 - smoothstep(0.1, 0.11 + fwidth(d), d * (0.85 + 0.15 * sin(t * 2.6)));
        return max(max(r, ticks * 0.6), max(arc, core));
      }
      // an equalizer of blocks
      float bars(vec2 uv, float t, float seed) {
        float n = 18.0, i = floor(uv.x * n), f = fract(uv.x * n);
        float h = 0.12 + 0.82 * abs(sin(t * (0.8 + hash11(i + seed) * 1.6) + hash11(i * 3.0) * 6.0)) * (0.55 + 0.45 * sin(t * 0.5 + i * 0.35));
        float blk = step(0.18, fract(uv.y * 26.0));
        float on = step(uv.y, h) * step(0.14, f) * step(f, 0.86) * blk;
        return on * mix(0.45, 1.0, step(h - 0.05, uv.y));
      }
      // a still word, with a frame
      float word(vec2 uv, float t) {
        vec2 m = min(uv, 1.0 - uv) * vScr.zw;
        float frame = step(min(m.x, m.y), 0.25) * step(0.1, min(m.x, m.y));
        return max(fitText(uv, 0.12) * 0.95, frame * 0.5);
      }
      float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
      float sdEll(vec2 p, vec2 r) { return (length(p / r) - 1.0) * min(r.x, r.y); }
      float sdTri(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
        vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2, v0 = p - p0, v1 = p - p1, v2 = p - p2;
        vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
        vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
        vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
        float s = sign(e0.x * e2.y - e0.y * e2.x);
        vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                     vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
        return -sqrt(d.x) * sign(d.y);
      }
      float fillOf(float d) { float w = fwidth(d) * 0.8 + 1e-5; return 1.0 - smoothstep(-w, w, d); }
      // the text of the rect laid in a band centred at c, h high, at most maxW wide
      float textBand(vec2 p, vec2 c, float h, float maxW) {
        float ra = (vRect.z - vRect.x) / max(vRect.w - vRect.y, 1e-4);
        float w = min(h * ra, maxW); h = w / ra;
        vec2 q = (p - c) / vec2(w, h) + 0.5;
        return q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0 ? 0.0 : text(q);
      }

      // drawing helpers for the programs: paint a value where cov is, glow a line in the fourth tone (gNeon)
      float gNeon;
      void paint(inout float v, float val, float cov) { v = mix(v, val, cov); gNeon *= 1.0 - cov; }
      void glow(float m) { gNeon = max(gNeon, m); }
      mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
      float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
      float starField(vec2 p, float t, float seed, float density) {
        vec2 g = floor(p * 46.0), f = fract(p * 46.0) - 0.5;
        float h = hash12(g + seed * 17.0);
        float s = step(1.0 - density, h) * (1.0 - smoothstep(0.05, 0.12, length(f - (hash22(g) - 0.5) * 0.6)));
        return s * (0.35 + 0.3 * sin(t * 2.0 + h * 40.0));
      }
      ${VFX_GLSL}

      // a part of the atlas (rect r) at q in 0..1, nothing outside it
      float atlasIn(vec4 r, vec2 q) {
        if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
        return texture2D(uAtlas, mix(r.xy, r.zw, q)).r;
      }
      // rect r placed centred at c in the ad's space, h high (its width from its proportions, at most maxW)
      float placed(vec4 r, vec2 p, vec2 c, float h, float maxW) {
        float ra = (r.z - r.x) / max(r.w - r.y, 1e-4);
        float w = min(h * ra, maxW);
        return atlasIn(r, (p - c) / vec2(w, w / ra) + 0.5);
      }
      // The metro's signs: calm, backlit, no flicker of fashion. Up to 5:1, a direction sign (the line's badge
      // glowing, the station and line in white, the same in English below, arrows running toward the way in);
      // longer, the line's map (the line across, its stations, this one ringed, a train running along).
      float metroSign(vec2 uv, float t, int id) {
        float W = vScr.z / vScr.w;
        vec2 p = adSpace(uv);
        float v = 0.09;
        vec2 m = min(uv, 1.0 - uv) * vScr.zw;
        glow(lineAt(min(m.x, m.y) - 0.1, 0.025) * 0.8);
        if (W < 5.0) {
          float bx = -W * 0.5 + 0.48;
          float badge = placed(uAdLogo[id], p, vec2(bx, 0.0), 0.76, 0.76);
          glow(badge);
          v = max(v, badge * 0.42);
          float nx0 = bx + 0.48, nw = W * 0.5 - nx0 - 0.95;
          v = max(v, placed(uAdName[id], p, vec2(nx0 + nw * 0.5, 0.14), 0.32, nw));
          v = max(v, placed(uAdTag[id], p, vec2(nx0 + nw * 0.5, -0.2), 0.2, nw) * 0.42);
          for (int k = 0; k < 3; k++) {                       // chevrons rising: the way is straight ahead
            float off = -0.36 + float(k) * 0.2 + fract(t * 0.5) * 0.2;
            vec2 r = p - vec2(W * 0.5 - 0.45, off);
            float fade = smoothstep(-0.4, -0.3, off) * (1.0 - smoothstep(0.24, 0.36, off));
            paint(v, 1.0, lineAt(r.y + abs(r.x) * 0.9, 0.05) * step(abs(r.x), 0.24) * fade);
          }
        } else {
          float y0 = -0.08, x0 = -W * 0.44, x1 = W * 0.44;
          glow(lineAt(p.y - y0, 0.07) * step(x0, p.x) * step(p.x, x1));
          for (int i = 0; i < 16; i++) {
            float fi = float(i), xi = mix(x0, x1, fi / 15.0);
            float here = step(abs(fi - 7.0), 0.5);
            float d = length(p - vec2(xi, y0));
            float r = 0.07 + here * (0.05 + 0.02 * sin(t * 3.0));
            paint(v, 0.1, 1.0 - smoothstep(r - 0.015, r, d));
            paint(v, 1.0, lineAt(d - r, 0.025));
          }
          float tx = mix(x0, x1, fract(t * 0.04));
          paint(v, 1.0, 1.0 - smoothstep(0.0, fwidth(p.x) * 2.0, sdBox(p - vec2(tx, y0), vec2(0.16, 0.05)) - 0.02));
          v = max(v, placed(uAdName[id], p, vec2(-W * 0.2, 0.3), 0.22, W * 0.5));
          v = max(v, placed(uAdTag[id], p, vec2(W * 0.22, 0.3), 0.15, W * 0.4) * 0.42);
          float badge = placed(uAdLogo[id], p, vec2(-W * 0.5 + 0.35, 0.3), 0.3, 0.3);
          glow(badge);
        }
        return v;
      }

      // The station's machines, their fronts. Each has its title (uAdName) along the top.
      float machineTitle(vec2 p, float W, int id) {
        return placed(uAdName[id], p, vec2(0.0, 0.43), 0.1, W * 0.9);
      }
      // drinks behind glass, row on row, lighting up one after another; a slot below
      float vending(vec2 uv, float t, int id) {
        float W = vScr.z / vScr.w;
        vec2 p = adSpace(uv);
        float v = 0.12;
        vec2 g = vec2((p.x / W + 0.5) * 5.0, (p.y + 0.3) / 0.62 * 5.0);
        vec2 gi = floor(g), gf = fract(g) - 0.5;
        if (g.y > 0.0 && g.y < 5.0 && gi.x >= 0.0 && gi.x < 5.0) {
          float bottle = sdBox(gf - vec2(0.0, -0.05), vec2(0.17, 0.32)) - 0.08;
          float neck = sdBox(gf - vec2(0.0, 0.33), vec2(0.07, 0.08));
          float on = step(0.6, fract(hash12(gi) + t * 0.15));
          paint(v, mix(0.4, 1.0, on * step(0.5, hash12(gi + 4.0))), fillOf(min(bottle, neck)));
          glow(lineAt(gf.y + 0.43, 0.02) * 0.6);                // the shelf's edge
        }
        paint(v, 0.04, fillOf(sdBox(p - vec2(0.0, -0.42), vec2(W * 0.35, 0.04))));   // the slot
        return max(v, machineTitle(p, W, id));
      }
      // three cards turning over and over; now and then the middle one comes up rare, in a burst of light
      float cards(vec2 uv, float t, int id) {
        float W = vScr.z / vScr.w;
        vec2 p = adSpace(uv);
        float v = 0.1;
        float cyc = fract(t * 0.18), rare = step(0.66, fract(floor(t * 0.18) * 0.618));
        for (int i = 0; i < 3; i++) {
          float fi = float(i) - 1.0;
          float turn = cos(clamp(cyc * 3.0 - float(i) * 0.4, 0.0, 1.0) * 3.14159);
          vec2 q = (p - vec2(fi * W * 0.3, -0.04)) / vec2(max(abs(turn), 0.04), 1.0);
          float card = sdBox(q, vec2(W * 0.12, 0.26)) - 0.02;
          bool face = turn < 0.0;
          float star = length(q) - 0.06 - 0.03 * sin(atan(q.y, q.x) * 5.0);
          paint(v, face ? 0.42 : 0.22, fillOf(card));
          glow(lineAt(card, 0.01));
          if (face) paint(v, 1.0, fillOf(star) * (i == 1 && rare > 0.5 ? 1.0 : 0.6));
          if (i == 1 && rare > 0.5 && face) glow(smoothstep(0.5, 0.0, length(p)) * 0.8 * (1.0 - cyc));
        }
        return max(v, machineTitle(p, W, id));
      }
      // a wall of little boxes, each with a question mark; a light runs from box to box and stops on one
      float blindbox(vec2 uv, float t, int id) {
        float W = vScr.z / vScr.w;
        vec2 p = adSpace(uv);
        float v = 0.1;
        vec2 g = vec2((p.x / W + 0.5) * 6.0, (p.y + 0.42) / 0.78 * 4.0);
        vec2 gi = floor(g), gf = fract(g) - 0.5;
        if (g.y > 0.0 && g.y < 4.0 && gi.x >= 0.0 && gi.x < 6.0) {
          float k = gi.y * 6.0 + gi.x, pick = floor(mod(t * 6.0, 24.0));
          float lit = step(abs(k - pick), 0.5);
          float bx = sdBox(gf, vec2(0.38, 0.4));
          paint(v, lit > 0.5 ? 1.0 : 0.3, fillOf(bx));
          glow(lineAt(bx, 0.03) * 0.8);
          // a question mark
          float arc = abs(length(gf - vec2(0.0, 0.1)) - 0.12);
          float qm = min(max(arc, -(gf.y - 0.05) * step(gf.x, 0.0)), sdSeg(gf, vec2(0.0, -0.02), vec2(0.0, -0.1)));
          qm = min(qm, length(gf - vec2(0.0, -0.22)) - 0.025);
          paint(v, lit > 0.5 ? 0.1 : 0.85, 1.0 - smoothstep(0.025, 0.04, qm));
        }
        return max(v, machineTitle(p, W, id));
      }
      // capsules tumbling in a round window, a crank turning beneath it
      float gacha(vec2 uv, float t, int id) {
        float W = vScr.z / vScr.w;
        vec2 p = adSpace(uv);
        float v = 0.1;
        vec2 wc = vec2(0.0, 0.08);
        float win = length(p - wc) - min(W * 0.42, 0.3);
        paint(v, 0.16, fillOf(win));
        glow(lineAt(win, 0.012));
        for (int i = 0; i < 9; i++) {
          float fi = float(i);
          vec2 c = wc + vec2(sin(fi * 2.3 + t * (0.6 + fi * 0.05)), cos(fi * 1.7 + t * 0.5)) * min(W * 0.3, 0.2);
          float d = length(p - c) - 0.055;
          paint(v, mod(fi, 3.0) < 1.0 ? 1.0 : 0.42, fillOf(d) * fillOf(win + 0.01));
          paint(v, 0.08, fillOf(abs(p.y - c.y) - 0.005) * fillOf(d) * fillOf(win + 0.01));   // each capsule's seam
        }
        vec2 k = p - vec2(0.0, -0.3);
        float knob = length(k) - 0.07;
        paint(v, 0.42, fillOf(knob));
        paint(v, 1.0, fillOf(sdSeg(k, vec2(0.0), vec2(cos(t * 2.0), sin(t * 2.0)) * 0.065) - 0.012));
        return max(v, machineTitle(p, W, id));
      }

      // A brand's ad: its logo in glowing lines, its name sweeping in, its line beneath, laid out for the
      // screen's shape (a banner, a tall strip, or a poster), over fine drifting stripes in a lit frame;
      // a 12-second loop of its own.
      float brandAd(vec2 uv, float t, float seed, int id) {
        float W = vScr.z / vScr.w;
        vec2 p = adSpace(uv);
        float cyc = mod(t + seed * 30.0, 12.0);
        // about half of them solid: a cyan ground, the name in white, the logo and line dark on it
        bool solid = fract(seed * 7.31) > 0.5;
        float stripes = step(0.86, fract((p.x * 0.7 + p.y) * 14.0 - t * 0.15));
        float v = solid ? 0.4 + 0.1 * stripes : 0.05 + 0.17 * stripes;
        vec2 m = min(uv, 1.0 - uv) * vScr.zw;                 // metres from the edge
        glow(lineAt(min(m.x, m.y) - 0.22, 0.05));
        float reveal = smoothstep(0.3, 1.6, cyc), gone = smoothstep(11.3, 11.9, cyc);
        float logo, name, tag, sweep;
        if (W > 1.5) {                                        // a banner: logo left, name and line beside it
          float lx = -W * 0.5 + 0.45, nx0 = lx + 0.45, nw = W * 0.5 - nx0 - 0.08;
          logo = placed(uAdLogo[id], p, vec2(lx, 0.02), 0.72, 0.72);
          name = placed(uAdName[id], p, vec2(nx0 + nw * 0.5, 0.1), 0.44, nw);
          tag = placed(uAdTag[id], p, vec2(nx0 + nw * 0.5, -0.27), 0.17, nw);
          sweep = mix(nx0 - 0.05, W * 0.5, reveal);
          name *= step(p.x, sweep);
          glow(lineAt(p.x - sweep, 0.01) * step(reveal, 0.99) * step(abs(p.y - 0.1), 0.22));
        } else if (W < 0.8) {                                 // a tall strip: logo on top, the name down it
          logo = placed(uAdLogo[id], p, vec2(0.0, 0.5 - W * 0.4), W * 0.6, W * 0.6);
          name = placed(uAdNameV[id], p, vec2(0.0, -0.06), 0.6, W * 0.8);
          tag = placed(uAdTag[id], p, vec2(0.0, -0.44), 0.06, W * 0.92);
          sweep = mix(0.26, -0.38, reveal);
          name *= step(sweep, p.y);
          glow(lineAt(p.y - sweep, 0.01) * step(reveal, 0.99) * step(abs(p.x), W * 0.4));
        } else {                                              // a poster
          logo = placed(uAdLogo[id], p, vec2(0.0, 0.16), 0.46, W * 0.6);
          name = placed(uAdName[id], p, vec2(0.0, -0.17), 0.17, W * 0.9);
          tag = placed(uAdTag[id], p, vec2(0.0, -0.36), 0.075, W * 0.9);
          sweep = mix(-W * 0.48, W * 0.48, reveal);
          name *= step(p.x, sweep);
        }
        float tagIn = smoothstep(1.4, 2.2, cyc) * (1.0 - gone);
        if (solid) {
          paint(v, 0.06, logo);
          paint(v, 0.08, tag * tagIn);
        } else {
          glow(logo * (0.75 + 0.25 * sin(t * 2.0)));
          v = max(v, logo * 0.42);
          v = max(v, tag * 0.42 * tagIn);
        }
        v = mix(v, 1.0, name * (1.0 - gone));
        return v;
      }

      // a brand's logo alone, glowing, in a fine lit frame (the plaque in its case)
      float logoAd(vec2 uv, float t, int id) {
        vec2 p = adSpace(uv);
        vec2 m = min(uv, 1.0 - uv) * vScr.zw;
        glow(lineAt(min(m.x, m.y) - vScr.w * 0.06, vScr.w * 0.02));
        float logo = placed(uAdLogo[id], p, vec2(0.0), 0.7, 0.7);
        glow(logo * (0.85 + 0.15 * sin(t * 1.5)));
        return 0.06 + logo * 0.36;
      }
      // a grid floor running toward a striped sun
      float horizon(vec2 uv, float t) {
        vec2 p = uv - vec2(0.5, 0.42);
        if (p.y < 0.0) {
          float z = 0.12 / -p.y;
          vec2 g = vec2(p.x * z * 3.0, z + t * 0.8);
          float l = max(lineAt(fract(g.x) - 0.5, 0.06), lineAt(fract(g.y) - 0.5, 0.06));
          return l * smoothstep(0.0, 0.06, -p.y) * 0.8;
        }
        vec2 s = p * vec2(vScr.z / vScr.w, 1.0);
        float sun = 1.0 - smoothstep(0.25, 0.255, length(s - vec2(0.0, 0.1)));
        float stripes = step(0.35, fract(p.y * 24.0 - t * 0.3)) + step(0.25, p.y);
        return sun * min(stripes, 1.0) * 0.95;
      }
      // one huge character, revealed by a sweeping scan
      float glyph(vec2 uv, float t, float seed) {
        float cyc = fract(t * 0.07 + seed);
        float scan = smoothstep(0.0, 0.35, cyc);
        float shown = step(1.0 - uv.y, scan);
        float edge = lineAt(1.0 - uv.y - scan, 0.01) * step(cyc, 0.36);
        float tx = fitText(uv, 0.15);
        return max(tx * shown * mix(1.0, 0.0, smoothstep(0.92, 1.0, cyc)), edge);
      }
      // oscilloscope traces
      float waves(vec2 uv, float t, float seed) {
        float v = 0.0;
        for (int k = 0; k < 5; k++) {
          float fk = float(k);
          float y = 0.5 + 0.28 * sin(uv.x * (5.0 + fk * 2.3) + t * (0.8 + fk * 0.37) + seed * 9.0) * sin(uv.x * 2.1 - t * 0.3 + fk);
          v = max(v, lineAt(uv.y - y, 0.012 + 0.006 * step(fk, 0.5)) * (1.0 - fk * 0.13));
        }
        return v;
      }
      // a running line of text
      float ticker(vec2 uv, float t) {
        float ra = (vRect.z - vRect.x) / max(vRect.w - vRect.y, 1e-4);
        float x = uv.x * vScr.z / vScr.w / ra * 0.62 + t * 0.06;  // the text at 0.62 of the panel's height
        float gap = 0.25;                                          // space between repeats
        float k = fract(x / (1.0 + gap)) * (1.0 + gap);
        float y = (uv.y - 0.5) / 0.62 + 0.5;
        float tx = k < 1.0 && y > 0.0 && y < 1.0 ? text(vec2(k, y)) : 0.0;
        return tx + lineAt(abs(uv.y - 0.5) - 0.42, 0.02) * 0.5;
      }

      void main() {
        gNeon = 0.0;
        int id = int(vScr.x + 0.5);
        // (a seed below 0: a brand's case's little plaque, its logo only)
        bool logoOnly = vScr.y < 0.0;
        float prog = uAdTpl[id], seed = logoOnly ? -1.0 - vScr.y : vScr.y;
        float t = uTime + seed * 50.0;                 // the panel's own time (flicker, glitches)
        float tp = uTime * uAdSpeed[id] + seed * 50.0; // the ad's, at its speed
        vec2 uv = vUv;
        // now and then a few rows slip sideways
        float calm = step(15.5, prog);                // the metro's signs: no glitches, no flicker
        bool poster = uAdPoster > 0.5 && calm < 0.5;  // a poster: no glitches, no LED, no flicker either
        float gl = step(0.965, hash11(floor(t * 7.0) + seed * 13.0)) * (1.0 - calm) * (poster ? 0.0 : 1.0);
        float rowJ = floor(uv.y * 14.0 + hash11(floor(t * 7.0)) * 14.0);
        uv.x = fract(uv.x + gl * (hash11(rowJ + floor(t * 7.0)) - 0.5) * 0.12 * step(0.6, hash11(rowJ * 1.3 + seed)));

        float v;
        if (prog < 0.5) v = glyphs(uv, tp, seed);
        else if (prog < 1.5) v = rings(uv, tp);
        else if (prog < 2.5) v = bars(uv, tp, seed);
        else if (prog < 3.5) v = word(uv, tp);
        else if (prog < 4.5) v = rings(uv, tp);
        else if (prog < 5.5) v = horizon(uv, tp);
        else if (prog < 6.5) v = glyph(uv, tp, seed);
        else if (prog < 7.5) v = waves(uv, tp, seed);
        else if (prog < 8.5) v = ticker(uv, tp);
        else if (prog < 9.5) v = ribbons(uv, tp, seed);
        else if (prog < 10.5) v = blobs(uv, tp, seed);
        else if (prog < 11.5) v = tunnel(uv, tp, seed);
        else if (prog < 12.5) v = interference(uv, tp, seed);
        else if (prog < 13.5) v = vortex(uv, tp, seed);
        else if (prog < 14.5) v = cells(uv, tp, seed);
        else if (prog < 15.5) v = logoOnly ? logoAd(uv, tp, id) : brandAd(uv, tp, seed, id);
        else if (prog < 16.5) v = metroSign(uv, tp, id);
        else if (prog < 17.5) v = vending(uv, tp, id);
        else if (prog < 18.5) v = cards(uv, tp, id);
        else if (prog < 19.5) v = blindbox(uv, tp, id);
        else v = gacha(uv, tp, id);

        // the panel itself: an LED grid, a slow rolling band, a flicker, now and then a dark moment
        vec2 led = uv * vScr.zw * 9.0;
        float ledAA = 1.0 - smoothstep(0.15, 0.4, max(fwidth(led.x), fwidth(led.y)));
        float dotm = 1.0 - smoothstep(0.32, 0.5, length(fract(led) - 0.5));
        // words (signs, the metro's, the machines') keep a finer, fainter dot grid, so they stay legible close up
        float crisp = max(calm, step(abs(prog - 3.0), 0.5));
        float panelK = mix(1.0, mix(0.45 + 0.55 * dotm, 0.85 + 0.15 * dotm, crisp), ledAA) * (0.9 + 0.12 * sin((uv.y - t * 0.15) * 9.0))
          * mix((0.93 + 0.07 * hash11(floor(t * 24.0) + seed)) * (1.0 - step(0.993, hash11(floor(t * 3.0) + seed * 7.0)) * 0.8), 1.0, calm);
        if (!poster) v *= panelK;
        v = max(v, 0.06);

        // its colours: the city's cyan and white, or (a poster in its own colours, uAdOwn) the ad's own colour (see
        // ads/catalog.js), the screens drawn from a template each turned a little from it, so no two quite match
        vec3 own = uAdColor[id];
        if (prog < 14.5 && abs(prog - 4.0) > 0.5) own = turnHue(own, (hash11(seed * 91.7 + 3.1) - 0.5) * 1.6);
        bool colourful = poster && uAdOwn > 0.5;
        if (poster) {
          // a poster, lit from behind like a display case: its ground in four bands of its colour, deeper
          // and turned a little going up; on it, shapes in dark ink, and what shone, warm white
          vec3 base = colourful ? own : uScrMid / max(max(uScrMid.r, uScrMid.g), max(uScrMid.b, 1e-3));
          float band = floor(clamp(vUv.y, 0.0, 0.999) * 4.0);
          vec3 ground = mix(turnHue(base, 0.16 * (1.5 - band)), vec3(1.0), 0.1 - 0.025 * band) * (0.98 - 0.12 * band) * uAdBright;
          vec3 ink = vec3(0.06, 0.06, 0.1), light = mix(vec3(1.0, 0.97, 0.9), base, 0.12) * 1.3;
          float l1 = smoothstep(0.28, 0.32, v), l2 = smoothstep(0.58, 0.62, v);
          vec3 pc = mix(mix(ground, ink, l1), light, l2);
          pc = mix(pc, light, clamp(gNeon, 0.0, 1.0));
          gl_FragColor = vec4(mix(pc, fogColor(vWorld), fogAmount(vWorld) * 0.7), 1.0);
          return;
        }
        vec3 mid = uScrMid, hot = uHue * vec3(0.92, 1.0, 1.0) * uScrHot;
        float l1 = smoothstep(0.2, 0.26, v), l2 = smoothstep(0.58, 0.64, v);
        vec3 c = mix(mix(uScrDark, mid, l1), hot, l2);
        // the fourth tone: lines that glow cyan, or the ad's colour
        c = mix(c, mid * uScrHot * 0.8, clamp(gNeon * min(panelK * 1.1, 1.0), 0.0, 1.0));
        gl_FragColor = vec4(mix(c, fogColor(vWorld), fogAmount(vWorld) * 0.7), 1.0);
      }`,
  });
}
