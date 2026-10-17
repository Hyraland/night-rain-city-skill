// Ads that are pure motion graphics, no words or characters: light and form moving. Each returns a
// brightness (posterized by the screen shader into dark / cyan / white) and draws its brightest lines into
// gNeon, the glowing cyan tone (see screens.js for paint / glow / rot).
//   RIBBONS       ribbons of light flowing across, turning over as they go
//   BLOBS         liquid blobs merging and parting, the contours of their field around them like a map
//   TUNNEL        flying down an endless hexagonal tunnel, panels lighting up as they pass
//   INTERFERENCE  rings spreading from three wandering sources, crossing into moiré
//   VORTEX        a spiral galaxy of particles turning round a bright core
//   CELLS         glowing cells that drift, divide their space and pulse in waves
//
// GLSL, spliced into the screen shader after its drawing helpers.

export const VFX_GLSL = /* glsl */ `
vec2 adSpace(vec2 uv) { return (uv - 0.5) * vec2(vScr.z / vScr.w, 1.0); }

float ribbons(vec2 uv, float t, float seed) {
  vec2 p = adSpace(uv);
  float v = 0.04;
  for (int i = 0; i < 4; i++) {
    float fi = float(i), ph = seed * 20.0 + fi * 1.9;
    float yc = 0.24 * sin(p.x * 1.6 + t * 0.35 + ph) + 0.1 * sin(p.x * 3.1 - t * 0.5 + ph * 2.0) + (fi - 1.5) * 0.09;
    float tw = cos(p.x * 2.4 - t * 0.8 + ph);                 // the ribbon turning over
    float hw = 0.055 * abs(tw) + 0.003;
    float d = abs(p.y - yc) - hw;
    paint(v, tw > 0.0 ? 0.4 : 0.2, fillOf(d));
    glow(lineAt(d, 0.005) * (0.5 + 0.5 * abs(tw)));
    float across = (p.y - yc) / max(hw, 1e-3);
    glow(lineAt(fract(across * 2.0 + 0.5) - 0.5, 0.08) * fillOf(d) * 0.4);
    paint(v, 1.0, fillOf(abs(p.y - yc) - hw * 0.25) * smoothstep(0.85, 0.97, tw));   // a sheen where it faces us
  }
  return v;
}

float blobs(vec2 uv, float t, float seed) {
  vec2 p = adSpace(uv);
  float W = vScr.z / vScr.w, f = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(t * (0.21 + 0.05 * fi) + fi * 2.1 + seed * 9.0) * W * 0.35, sin(t * (0.27 + 0.04 * fi) + fi * 1.3 + seed * 4.0) * 0.32);
    float r = 0.075 + 0.03 * sin(fi * 1.7 + t * 0.4);
    f += r * r / max(dot(p - c, p - c), 1e-4);
  }
  float v = 0.04;
  glow(lineAt(fract(f * 3.0) - 0.5, 0.06) * (1.0 - step(1.0, f)) * smoothstep(0.08, 0.4, f) * 0.6);
  float d = (1.0 - f) * 0.1;
  paint(v, 0.4, fillOf(d));
  glow(lineAt(d, 0.004));
  paint(v, 1.0, fillOf((2.6 - f) * 0.05));
  return v;
}

float tunnel(vec2 uv, float t, float seed) {
  vec2 p = rot(t * 0.15 + seed * 6.0) * adSpace(uv);
  vec2 q = abs(p);
  float hx = max(q.x * 0.866 + q.y * 0.5, q.y);              // distance to a hexagon
  float z = 0.12 / max(hx, 1e-3) + t * 1.2;
  float a = atan(p.y, p.x) / 6.2832;
  float fade = smoothstep(0.02, 0.25, hx);
  float v = 0.04;
  float zz = z * 3.0;                                         // three rings to each unit of depth
  float cell = hash12(vec2(floor(zz), floor(a * 18.0)) + seed * 3.0);
  paint(v, 0.3, step(0.62, cell) * fade);
  paint(v, 1.0, step(0.94, cell) * fade);
  glow(max(lineAt(fract(zz) - 0.5, 0.1), lineAt(fract(a * 6.0) - 0.5, 0.05) * 0.7) * fade);
  paint(v, 1.0, 1.0 - smoothstep(0.0, 0.03 + 0.01 * sin(t * 3.0), hx));   // the far end
  return v;
}

float interference(vec2 uv, float t, float seed) {
  vec2 p = adSpace(uv);
  float W = vScr.z / vScr.w, s = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(t * 0.17 + fi * 2.1 + seed * 7.0) * W * 0.4, cos(t * 0.13 + fi * 1.7 + seed * 3.0) * 0.4);
    s += sin(length(p - c) * 60.0 - t * 2.5);
  }
  s /= 3.0;
  float v = 0.04;
  paint(v, 0.38, smoothstep(0.25, 0.3, s));
  paint(v, 1.0, smoothstep(0.82, 0.86, s));
  glow(lineAt(s, 0.05));
  return v;
}

float vortex(vec2 uv, float t, float seed) {
  vec2 p = adSpace(uv);
  float r = length(p), a = atan(p.y, p.x), lr = log(max(r, 1e-3));
  vec2 sp = vec2(a / 6.2832 * 3.0 - lr * 1.4 + t * 0.12, lr * 6.0 - t * 0.5);   // along the arms, across them
  vec2 gs = sp * vec2(14.0, 3.0);
  vec2 g = floor(gs), f = fract(gs) - 0.5;
  float h = hash12(g + seed * 10.0);
  float arm = pow(0.5 + 0.5 * cos(sp.x * 6.2832), 3.0);
  float disk = smoothstep(0.02, 0.06, r) * (1.0 - smoothstep(0.42, 0.55, r));
  float v = 0.04;
  glow(arm * 0.35 * disk);
  paint(v, h > 0.93 ? 1.0 : 0.42, step(1.0 - arm * 0.9, h) * (1.0 - smoothstep(0.15, 0.3, length(f))) * disk);
  paint(v, 1.0, 1.0 - smoothstep(0.03, 0.05 + 0.01 * sin(t * 2.0), r));
  return v;
}

float cells(vec2 uv, float t, float seed) {
  vec2 p = adSpace(uv) * 6.0;
  vec2 ip = floor(p), fp = fract(p), best = vec2(0.0);
  float d1 = 8.0, d2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = 0.5 + 0.4 * sin(t * 0.6 + 6.2832 * hash22(ip + g + seed * 13.0));
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; best = ip + g; } else if (d < d2) d2 = d;
    }
  }
  float edge = sqrt(d2) - sqrt(d1);
  float h = hash12(best + seed);
  float pulse = 0.5 + 0.5 * sin(t * 1.5 - length(best) * 0.6 + h * 6.0);
  float v = 0.04;
  paint(v, 0.38, step(0.55, h) * smoothstep(0.6, 0.9, pulse) * step(0.08, edge));
  paint(v, 1.0, step(0.9, h) * smoothstep(0.85, 0.95, pulse) * step(0.08, edge));
  glow(1.0 - smoothstep(0.03, 0.03 + fwidth(edge) * 1.5, edge));
  return v;
}
`;
