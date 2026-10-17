// Brands' ads as shallow lit cases, and the signs and fittings of a few shop designs, built into the world w (in its
// current frame). makeCases(w) returns:
//
//   brandCase(cw, ch, x, y, z, face, B, seed, scene)   a brand's ad as a case cw x ch, its middle at (x, y, z), facing
//                     face: a dark frame, a light along its sill, and inside one of SCENES (kit/scenes.js; B.case, or
//                     scene): its things set out in it, or one of the moving pictures (a pixel café, a field of
//                     flowers in dots, a dusk bakery, a fogged window, the moon over a river, an ice cream's opening,
//                     a tide town, rows of cakes, blind boxes, kittens in LED dots, a cinema, sound waves, umbrellas)
//   cafeSign(geom, w, h, B, kind, back)   a café's name by a cup of coffee on a clear screen: 'name', 'row' (going by,
//                     its coffees after it), 'column' (three coffees, a blade sign); back(geom, albedo): its backing
//   cafeBoard(geom, w, h)                 a café's menu of coffees as cups filled in layers
//   floristSign(geom, w, h, B)            a florist's name over polka dots and flowers of dots
//   dotFlower(ctx, x, y, r, colour)       a flower of dots, into a canvas
//   dawnPanel(w, h, x, y, z, face, B, kind)   a bakery's dusk: its breads before a setting sun, its name in a serif
//                     (kind 'wide', 'tall', 'belt', 'one', 'blade', 'sign')
//   rainWindow(w, h, x, y, z, face, B, { kind, glass, name })   a fogged window in the rain, drops clearing lines
//   starTicker(geom, w, h, seed, B), starBlade(geom, w, h, B)   space going by: the Earth's edge, a station's wheel
//   floatIsland(ip, ig, x, y0, z, r, middle, R), islandLamp(ip, ig, x, y, z, ceil, R)   a café's floating seats
//   emojiStage(items, o), duskPic, solidGlyph(name, colour, glow)   pictures moving on a stage (the bakery's)
//
// B: a brand ({ name, en, tagline, color, logo, case }) with index, its place among the brands (kit/shops.js brandOf).
// Icons from kit/icons.js (Noto Emoji's breads and animals, Material's cup, cloud, moon).

import * as THREE from 'three';
import { shared } from '../core/toon.js';
import { LAYER } from '../core/constants.js';
import { makeRandom } from '../core/rand.js';
import { box } from './geometry.js';
import { family, defaultLogo } from './atlas.js';
import { drawIcon, iconShape, getIcons } from './icons.js';
import { SCENES, AIR } from './scenes.js';
import { ledPicture, dotText, nameplate, popName, revealName, cinemaLED, umbrellaLED, concertWaves, meowLED, canvasPlane, inBrandColours } from './signs.js';

export function makeCases(world) {
  // (what the cases add, into the world, in its frame; their lights keeping their brand's colours, caseOf)
  let caseOf = -1;
  const keyed = (fn) => world.asBrand(caseOf, fn);
  const props = (g, albedo) => world.props(g, albedo);
  const glow = (g, rgb, blink = 0) => world.glow(g, rgb, blink);
  const shown = (g, rgb) => keyed(() => world.shown(g, rgb));
  const drifting = (g, rgb, mid, phase) => keyed(() => world.drifting(g, rgb, mid, phase));
  const sliding = (g, rgb, way, along) => keyed(() => world.sliding(g, rgb, way, along));
  const spinning = (g, rgb, spin, axis, clip, clip2) => keyed(() => world.spinning(g, rgb, spin, axis, clip, clip2));
  const tidal = (g, rgb, tide, clip, clip2) => keyed(() => world.tidal(g, rgb, tide, clip, clip2));
  const popping = (g, rgb, pop, pop2) => keyed(() => world.popping(g, rgb, pop, pop2));
  const caseLabels = { push: (m) => world.addMesh(m) };
  const caseIn = { add: (g, { aAlbedo }) => world.props(g, aAlbedo) };
  const boxCollider = (x0, x1, z0, z1) => world.block(x0, x1, z0, z1);
  const icons = getIcons();
  const caseFonts = { round: family('站酷快乐体') };
  const CAFE_WALL = 0.2;

  // the island café's seats: a low round platform as a little island, floating (a light in the gap under its edge), a ring of
  // table round what grows or shines in its middle (a little tree, or a lamp), cushions round it; its foot at
  // (x, y0, z), r across; into ip (solid) and ig (light), its numbers from Rn; what it is in the way of, returned
  function floatIsland(ip, ig, x, y0, z, r, middle, Rn) {
    ip(new THREE.CylinderGeometry(r * 0.9, r * 0.82, 0.06, 28).translate(x, y0 + 0.03, z), 0.3);                    // what it stands on, set back
    ig(new THREE.TorusGeometry(r * 0.88, 0.012, 4, 40).rotateX(Math.PI / 2).translate(x, y0 + 0.07, z), [1.6, 1.15, 0.7]);   // the light under it
    ip(new THREE.CylinderGeometry(r, r * 0.94, 0.16, 28).translate(x, y0 + 0.16, z), 0.75);
    ip(new THREE.CylinderGeometry(r * 0.97, r * 0.97, 0.02, 28).translate(x, y0 + 0.25, z), 0.45);
    const top = y0 + 0.26;
    // the ring of table round its middle, on three short legs
    ip(new THREE.RingGeometry(r * 0.28, r * 0.55, 32).rotateX(-Math.PI / 2).translate(x, top + 0.48, z), 0.85);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; ip(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 5).translate(x + Math.cos(a) * r * 0.45, top + 0.24, z + Math.sin(a) * r * 0.45), 0.3); }
    if (middle === 'tree') {
      ip(new THREE.CylinderGeometry(0.035, 0.05, 1.1, 6).translate(x, top + 0.55, z), 0.4);
      for (let k = 0; k < 5; k++) ip(new THREE.IcosahedronGeometry(Rn.range(0.18, 0.3), 0).translate(x + Rn.range(-0.2, 0.2), top + 1.1 + Rn.range(0, 0.3), z + Rn.range(-0.2, 0.2)), 0.35);
    } else {
      ip(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6).translate(x, top + 0.5, z), 0.3);
      ig(new THREE.SphereGeometry(0.17, 16, 10).translate(x, top + 1.12, z), [1.6, 1.2, 0.8]);
    }
    // cushions round it, on the moss
    const n = r > 1 ? 4 : 3;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.4;
      ip(new THREE.CylinderGeometry(0.2, 0.21, 0.16, 14).translate(x + Math.cos(a) * r * 0.78, top + 0.08, z + Math.sin(a) * r * 0.78), 0.8);
    }
  }
  // the island lamp hung in its window: a little island upside down in the air (its rock to a point beneath, grass
  // and a tree on top), a cloud beside it, lit; at (x, y, z), its wire up to ceil
  function islandLamp(ip, ig, x, y, z, ceil, Rn) {
    ip(new THREE.ConeGeometry(0.42, 0.55, 9).rotateX(Math.PI).translate(x, y - 0.28, z), 0.7);
    ip(new THREE.CylinderGeometry(0.43, 0.42, 0.06, 18).translate(x, y + 0.03, z), 0.45);
    ip(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 5).translate(x + 0.08, y + 0.23, z), 0.4);
    for (let k = 0; k < 3; k++) ip(new THREE.IcosahedronGeometry(Rn.range(0.1, 0.16), 0).translate(x + 0.08 + Rn.range(-0.08, 0.08), y + 0.45 + Rn.range(0, 0.12), z + Rn.range(-0.08, 0.08)), 0.35);
    for (const [dx, dy, r] of [[-0.45, 0.25, 0.16], [-0.6, 0.18, 0.12], [-0.32, 0.17, 0.12], [-0.48, 0.38, 0.11]]) ig(new THREE.SphereGeometry(r, 12, 8).translate(x + dx, y + dy, z), [1.5, 1.45, 1.35]);
    ig(new THREE.SphereGeometry(0.05, 8, 6).translate(x, y - 0.58, z), [1.6, 1.2, 0.8]);      // a light at its point
    ip(new THREE.CylinderGeometry(0.005, 0.005, ceil - y - 0.03, 4).translate(x, (ceil + y + 0.03) / 2, z), 0.3);
  }
  // the screen of scene.pixel (makeCase): w x h, its numbers from R, B the brand. Where each thing is lit, in what
  // colour, when it comes and when it goes, worked out here a pixel at a time (from Google's cloud and cup, and the
  // name, drawn large and looked at in the middle of each pixel) and kept in textures; the shader only shows them
  function pixelCafe(geom, w, h, R, B) {
    const P = 9, wide = w / h >= 1.2, NY = Math.round(wide ? 40 : 40 * h / w), NX = Math.round(NY * w / h), S = 12;
    const big = (draw) => { const c = document.createElement('canvas'); c.width = NX * S; c.height = NY * S; const g = c.getContext('2d'); draw(g); return g.getImageData(0, 0, c.width, c.height).data; };
    // where things go (in pixels): the cloud's icon U across (the cloud in it 0.92 of that, drawn 0.73 as high as it is
    // there), the cup on it, sitting a little into it, steam over it (7 rows); the name beside them (wide) or over them
    const cn = Math.max(5.6, NY * 0.14), nameW = cn * 4.15, nameH = cn * 1.75, steam = 7;   // (cn: its characters' height)
    const U0 = wide ? Math.min((NY * 0.86 - steam) / 0.63, (NX * 0.9 - nameW) / 1.02) : Math.min(NX * 0.82 / 0.92, (NY * 0.88 - nameH - 3 - steam) / 0.63);
    const at = (data, X, Y, sx = 1) => data[((Math.floor(Y * S) * NX * S) + Math.floor(X * S)) * 4 + sx];
    const tex = (NXn, NYn, fill) => {
      const a = new Uint8Array(NXn * NYn * 4);
      for (let j = 0; j < NYn; j++) for (let i = 0; i < NXn; i++) { const v = fill(i, NYn - 1 - j); if (v) a.set(v, (j * NXn + i) * 4); }
      const t = new THREE.DataTexture(a, NXn, NYn); t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true;
      return t;
    };
    const when = (row) => [Math.round(((NY - row) / NY * 2.0 + R.range(0, 0.5)) / P * 255), Math.round(R.range(7.4, 8.6) / P * 255)];
    const inside = (i, j, n, m) => i >= 0 && j >= 0 && i < n && j < m;
    const bounds = () => ({ x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
    const grow = (b, x0, x1, y0, y1) => { b.x0 = Math.min(b.x0, x0); b.x1 = Math.max(b.x1, x1); b.y0 = Math.min(b.y0, y0); b.y1 = Math.max(b.y1, y1); };
    const mid = (a, b, n) => Math.round((n - (a + b)) / 2);
    const F = 3;                                                 // (the name's pixels: a third the size)
    // all of it drawn with the cloud's icon U across, and measured as it came out (what is lit, not what was meant):
    // the cloud, the cup, the steam's threads and rows, the name
    const compose = (U) => {
      const gw = wide ? U * 1.02 + nameW : U * 0.92, gh = steam + U * 0.63 + (wide ? 0 : nameH + 3);
      const gx = (NX - gw) / 2, gy = (NY - gh) / 2;                         // (the group's top left)
      const cloudX = gx - U * 0.04, cloudY = gy + (wide ? 0 : nameH + 3) + steam + U * 0.125, cloudMid = cloudY + U * 0.265;
      const cupW = U * 0.6, cupX = cloudX + U * 0.45 - cupW * 0.46, cupY = cloudY - U * 0.2;   // (its icon's box, cupW square)
      const nx0 = wide ? gx + U * 1.02 : (NX - nameW) / 2, ny0 = wide ? gy + gh * 0.5 - nameH / 2 : gy;
      const cloud = big((g) => drawIcon(g, 'material/cloud', (cloudX + U / 2) * S, cloudMid * S, U * S, '#fff'));
      const cup = big((g) => drawIcon(g, 'material/coffee', (cupX + cupW / 2) * S, (cupY + cupW / 2) * S, cupW * S, '#fff'));
      const cl = (i, j) => { const yy = cloudMid + (j + 0.5 - cloudMid) / 0.73; return inside(i, j, NX, NY) && yy > 0 && yy < NY && at(cloud, i + 0.5, yy, 3) > 128; };
      const cu = (i, j) => inside(i, j, NX, NY) && at(cup, i + 0.5, j + 0.5, 3) > 128;
      // the name: its characters, its English under, lit from the left
      const name = (() => {
        const c = document.createElement('canvas'); c.width = NX * F * 4; c.height = NY * F * 4; const g = c.getContext('2d');
        const q = F * 4, x0 = nx0 * q;
        const ax = wide ? x0 + cn * 0.04 * q : x0 + nameW * q / 2;
        g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = wide ? 'left' : 'center';
        g.font = `500 ${cn * q}px "PingFang SC", "Noto Sans SC", sans-serif`;
        g.fillText(B.name, ax, (ny0 + cn * 0.55) * q, nameW * q);
        g.fillStyle = '#0ff'; g.font = `600 ${cn * 0.42 * q}px "Helvetica Neue", Arial, sans-serif`;
        g.fillText((B.en || '').split('').join(String.fromCharCode(8202)), ax + (wide ? cn * 0.04 * q : 0), (ny0 + cn * 1.5) * q, nameW * q);
        return { d: g.getImageData(0, 0, c.width, c.height).data, W: c.width };
      })();
      const nm = (i, j) => inside(i, j, NX * F, NY * F) && name.d[((j * 4 + 2) * name.W + i * 4 + 2) * 4 + 3] >= 110;
      const sx = cupX + cupW * 0.46, sy = NY - (cupY + cupW * 0.125) + 1, sz = Math.max(2, Math.round(cupW * 0.12));
      const pic = bounds(), cupB = bounds(), txt = bounds();
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        if (cl(i, j) || cu(i, j)) grow(pic, i, i + 1, j, j + 1);
        if (cu(i, j)) grow(cupB, i, i + 1, j, j + 1);
      }
      grow(pic, Math.floor(sx - sz), Math.floor(sx + sz) + 2, NY - (Math.floor(sy) + 6), NY - Math.floor(sy));
      for (let j = 0; j < NY * F; j++) for (let i = 0; i < NX * F; i++) if (nm(i, j)) grow(txt, i / F, (i + 1) / F, j / F, (j + 1) / F);
      return { cl, cu, nm, name, sx, sy, sz, pic, cupB, txt };
    };
    // then moved, a whole pixel at a time: in a wide case the cup and the name, from the cup's left to the name's
    // right, in the middle across (the cloud reaching out past the cup as it will), the picture in the middle up and
    // down, the name too; in a tall one each in the middle across, the two over one another in the middle up and
    // down. Where the cloud would then come too near the edge, all of it drawn a little smaller and set again
    let L, pdx, pdy, tdx, tdy;                                  // (the picture's shift in pixels, the name's in its small ones)
    for (let n = 0, k = 1; n < 8; n++, k *= 0.94) {
      L = compose(U0 * k);
      const { pic, cupB, txt } = L;
      if (wide) {
        // (the name then nudged by its own small pixels, so that the two margins come out the same)
        pdx = mid(cupB.x0, txt.x1, NX); tdx = Math.round(F * (NX - (cupB.x0 + pdx) - txt.x1));
        pdy = mid(pic.y0, pic.y1, NY); tdy = mid(txt.y0 * F, txt.y1 * F, NY * F);
        if (pic.x0 + pdx >= 2 && pic.x1 + pdx <= NX - 2 && pic.y0 + pdy >= 1) break;
      } else {
        pdx = mid(pic.x0, pic.x1, NX); tdx = mid(txt.x0 * F, txt.x1 * F, NX * F);
        const dy = mid(Math.min(pic.y0, txt.y0), Math.max(pic.y1, txt.y1), NY);
        pdy = dy; tdy = dy * F;
        break;
      }
    }
    const { cl, cu, nm, name, sx, sy, sz, txt } = L;
    const tCloud = tex(NX, NY, (i, j) => (cl(i - pdx, j - pdy) ? [cl(i - pdx, j - pdy + 1) ? 1 : 2, ...when(j), 255] : null));
    const tCup = tex(NX, NY, (i, j) => (cu(i - pdx, j - pdy) ? [3, ...when(j), 255] : null));
    const tName = tex(NX * F, NY * F, (i, j) => {
      const ii = i - tdx, jj = j - tdy;
      if (!nm(ii, jj)) return null;
      const t0 = 2.3 + (ii / F - txt.x0) / Math.max(1, txt.x1 - txt.x0) * 0.9 + R.range(0, 0.15);
      return [name.d[((jj * 4 + 2) * name.W + ii * 4 + 2) * 4] < 128 ? 6 : 5, Math.round(t0 / P * 255), Math.round(R.range(7.6, 8.6) / P * 255), 255];
    });
    const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: shared.uTime, uP: { value: P }, uN: { value: new THREE.Vector2(NX, NY) }, uCloud: { value: tCloud }, uCup: { value: tCup }, uName: { value: tName },
        uSteam: { value: new THREE.Vector3(sx + pdx, sy - pdy, sz) },
        uBand: { value: [col('#0f2140'), col('#132a4f'), col('#18335d')] },
        uPal: { value: [col('#000000'), col('#cdebf5', 0.8), col('#6fbcd6', 0.7), col('#ffffff', 1.05), col('#ff9d5c', 1.1), col('#e8f8fc', 1.0), col('#5fe3f2', 0.95), col('#5fa9c4', 0.8), col('#2b5a7d', 0.8)] },
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: (B.index ?? 0) },
      },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D uCloud, uCup, uName; uniform vec2 uN; uniform vec3 uSteam, uBand[3], uPal[9]; uniform float uTime, uP;
        uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
        // a pixel's square (rounded, a gap round it), f where in it
        float square(vec2 f, float aa) { vec2 q = abs(f - 0.5); return mix(0.8, 1.0 - smoothstep(-0.05, 0.05, length(max(q - 0.26, 0.0)) - 0.16), aa); }
        // what a texel says: lit, in which colour, now (t); a flash of white as it comes and goes
        bool lit(vec4 s, float t, out vec3 c) {
          if (s.a < 0.5) return false;
          float a = s.g * uP, b = s.b * uP;
          if (t < a || t > b) return false;
          c = (t - a < 0.12 || b - t < 0.1) ? vec3(1.5) : uPal[int(s.r * 255.0 + 0.5)];
          return true;
        }
        vec4 texel(sampler2D T, vec2 c, vec2 n) { return (c.x < 0.0 || c.y < 0.0 || c.x >= n.x || c.y >= n.y) ? vec4(0.0) : texture2D(T, (c + 0.5) / n); }
        void main() {
          float t = mod(uTime, uP);
          vec2 g = vUv * uN, c = floor(g);
          float aa = 1.0 - smoothstep(0.25, 0.6, max(fwidth(g.x), fwidth(g.y)));
          vec3 band = c.y < uN.y / 3.0 ? uBand[2] : c.y < uN.y * 2.0 / 3.0 ? uBand[1] : uBand[0];
          vec3 px = band * 1.45, pc;
          bool on = false, floating = t > 2.4 && t < 7.4;
          float bob = floating ? floor(sin((t - 2.4) * 1.6) + 0.5) : 0.0;
          if (lit(texel(uCloud, c, uN), t, pc)) { px = pc; on = true; }
          vec2 cc = c - vec2(0.0, bob);
          if (lit(texel(uCup, cc, uN), t, pc)) { px = pc; on = true; }
          else if (on) {                                                         // (a pixel of dark round the cup, against the cloud)
            vec3 q;
            if (lit(texel(uCup, cc + vec2(1.0, 0.0), uN), t, q) || lit(texel(uCup, cc - vec2(1.0, 0.0), uN), t, q)
              || lit(texel(uCup, cc + vec2(0.0, 1.0), uN), t, q) || lit(texel(uCup, cc - vec2(0.0, 1.0), uN), t, q)) px = band * 1.45;
          }
          if (floating) for (int k = 0; k < 3; k++) for (int n = 0; n < 4; n++) {     // the steam: three threads going up
            float ph = mod(t * 3.0 + float(n) * 1.5 + float(k) * 2.0, 6.0), st = floor(ph);
            vec2 s = vec2(floor(uSteam.x + (float(k) - 1.0) * uSteam.z) + mod(st, 2.0), floor(uSteam.y) + st + bob);
            if (c == s) { px = ph < 4.0 ? uPal[7] : uPal[8]; on = true; }
          }
          vec3 col = mix(band * 0.55, px, square(fract(g), aa));
          vec2 gn = vUv * uN * 3.0, cn = floor(gn);
          if (lit(texel(uName, cn, uN * 3.0), t, pc)) col = mix(col, pc, square(fract(gn), 1.0 - smoothstep(0.25, 0.6, max(fwidth(gn.x), fwidth(gn.y)))));
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
  // the island café's menu, on a clear screen, no word on it: its coffees in a row as the same cup, each filled as it is
  // made (from the foot: coffee, water, milk, foam), so that the more milk in it, the whiter it is; as many as the
  // board has room for, those most asked for first, in the order of the milk in them
  const COFFEES = [
    [[140, 0.32]],                                    // 浓缩
    [[140, 0.24], [90, 0.56]],                        // 美式
    [[140, 0.3], [255, 0.14]],                        // 玛奇朵
    [[140, 0.3], [200, 0.46], [255, 0.06]],           // 澳白
    [[140, 0.18], [200, 0.52], [255, 0.18]],          // 拿铁
    [[140, 0.26], [200, 0.27], [255, 0.36]],          // 卡布奇诺
  ];
  function cafeBoard(geom, w, h) {
    return ledPicture(geom, w, h, (g, Wc, Hc) => {
      const cs = Hc * 0.72, n = THREE.MathUtils.clamp(Math.floor(Wc / (cs * 0.8)), 2, COFFEES.length);
      const which = [0, 4, 5, 3, 1, 2].slice(0, n).sort((a, b) => a - b), step = Wc / n;
      which.forEach((k, i) => coffeeCup(g, step * (i + 0.5), Hc * 0.5, cs, COFFEES[k]));
    }, { density: 28, screen: true, glass: true });
  }
  // the florist's colours: its flowers (pink, yellow, lilac, white, coral), their stems and leaves, the field's night
  const FLOWERS = ['#ff9cc2', '#ffd36b', '#c9a7ff', '#f4f6ff', '#ff8a7a'];
  // The field of scene.bloom: w x h, R its numbers, B the brand, room (nw x nh) left in its middle for the name.
  // Where each flower is (its middle, how wide, its colour), its stem and leaves, worked out here cell by cell and
  // kept in a texture (colour, how much of a flower, a number of its own); the shader opens and closes them
  function floristField(geom, w, h, R, B, nw, nh) {
    const cell = Math.min(w, h) / 24, NX = Math.max(8, Math.round(w / cell)), NY = Math.max(8, Math.round(h / cell));
    const heads = Array.from({ length: Math.round(NX * NY / 14) }, () => ({ x: R.range(-1, NX + 1), y: R.range(NY * 0.08, NY * 0.95), r: R.range(1.6, 3.4), c: R.int(0, FLOWERS.length - 1), a: R.range(0, 6.3) }));
    const data = new Uint8Array(NX * NY * 4), mx = NX / 2, my = NY / 2, rx = nw / 2 / cell + 1.5, ry = nh / 2 / cell + 1.2;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const cx = i + 0.5, cy = j + 0.5;                                     // (j from the foot up)
      let best = 0, c = 0;
      // (each flower five petals round a heart: how far a cell is in, measured against the petal at its angle)
      for (const f of heads) {
        const dx = cx - f.x, dy = cy - f.y, d = Math.hypot(dx, dy), petal = 0.72 + 0.28 * Math.cos(5 * (Math.atan2(dy, dx) + f.a));
        const v = 1 - d / (f.r * petal);
        if (v > best) { best = v; c = d < f.r * 0.2 ? (f.c === 1 ? 4 : 1) : f.c; }   // (its heart yellow, a yellow one's coral)
      }
      let kind = best > 0 ? 1 + c : 0;                                      // (0 nothing; 1.. a flower; 9 a stem, 10 a leaf)
      if (!kind) for (const f of heads) if (Math.abs(cx - f.x) < 0.6 && cy < f.y - f.r * 0.6 && cy > f.y - f.r - 3.5) { kind = 9; best = 0.3; break; }
      if (!kind && R.chance(0.12)) { kind = 10; best = R.range(0.25, 0.45); }
      const e = Math.hypot((cx - mx) / rx, (cy - my) / ry), keep = THREE.MathUtils.smoothstep(e, 0.85, 1.25);   // (the name's room)
      data.set([kind, Math.round(best * keep * 255), Math.round(R.next() * 255), 255], (j * NX + i) * 4);
    }
    const tex = new THREE.DataTexture(data, NX, NY); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
    const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uMap: { value: tex }, uN: { value: new THREE.Vector2(NX, NY) }, uP: { value: 12 },
        uPal: { value: [col('#000000'), ...FLOWERS.map((hx) => col(hx, 1.15)), col('#000000'), col('#000000'), col('#000000'), col('#4f8f62', 0.8), col('#3d7a58', 0.7)] },
        uLow: { value: col('#14233a') }, uHigh: { value: col('#1f3554') },
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: (B.index ?? 0) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D uMap; uniform vec2 uN; uniform float uTime, uP; uniform vec3 uPal[11], uLow, uHigh;
        uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
        void main() {
          vec2 g = vUv * uN, c = floor(g), f = fract(g) - 0.5;
          vec4 s = texture2D(uMap, (c + 0.5) / uN);
          int kind = int(s.r * 255.0 + 0.5);
          float aa = 1.0 - smoothstep(0.25, 0.6, max(fwidth(g.x), fwidth(g.y)));
          // the gust: from the left, opening them (in 5 s), then a while open, then closing them the same way
          float t = mod(uTime, uP), span = uN.x + 16.0, x = c.x + s.b * 3.0;
          float open = t < 5.0 ? clamp((t / 5.0 * span - 8.0 - x) / 6.0, 0.0, 1.0)
            : t < 9.0 ? 1.0 : 1.0 - clamp(((t - 9.0) / 3.0 * span - 8.0 - x) / 6.0, 0.0, 1.0);
          float sway = 0.9 + 0.1 * sin(uTime * 2.0 + c.x * 0.35 + c.y * 0.2);
          vec3 col = mix(uLow, uHigh, vUv.y);
          float r = 0.12; vec3 dotc = mix(uLow, uHigh, vUv.y) * 1.6;           // (the field's own dots, faint)
          if (kind >= 1 && kind <= 5) { r = 0.47 * clamp(s.g * 2.2, 0.0, 1.0) * mix(0.3, 1.0, open) * sway; dotc = uPal[kind]; }
          else if (kind >= 9) { r = 0.47 * s.g * sway; dotc = uPal[kind]; }
          float d = length(f), m = 1.0 - smoothstep(r - 0.04, r + 0.04, d);
          col = mix(col, dotc, mix(r * 1.8, m, aa));
          // fireflies: a few, drifting, blinking, a soft light round each
          for (int k = 0; k < 8; k++) {
            float fk = float(k), ph = fract(sin(fk * 12.9898) * 43758.5);
            vec2 p = vec2(mod(ph * uN.x + uTime * (0.8 + ph) + sin(uTime * 0.7 + fk) * 2.0, uN.x), uN.y * (0.3 + 0.6 * fract(ph * 7.3)) + sin(uTime * 1.1 + fk * 2.0) * 1.2);
            float on = 0.5 + 0.5 * sin(uTime * 2.3 + fk * 5.0), dd = length(g - p);
            col += vec3(0.75, 1.0, 0.45) * (exp(-dd * dd / 0.6) * 0.5 + (1.0 - smoothstep(0.18, 0.3, dd)) * 1.2) * on;
          }
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
  // The bouquet of scene.bouquet: w x h, B the brand, foot (how high its name's room is). Its flowers set out in
  // its heights (x from its middle, y up, r across, colour), drawn in the shader: each ring of dots lit in turn
  function floristBouquet(geom, w, h, B, foot) {
    const F = [[-0.16, 0.66, 0.12, 0], [0.08, 0.76, 0.11, 1], [0.2, 0.56, 0.1, 2], [-0.03, 0.53, 0.115, 3], [-0.26, 0.47, 0.095, 4],
      [0.14, 0.4, 0.085, 0], [-0.04, 0.86, 0.085, 2], [-0.15, 0.37, 0.08, 1]];
    const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uA: { value: w / h }, uFoot: { value: foot / h },
        uF: { value: F.map(([fx, fy, fr, c]) => new THREE.Vector4(fx * 1.4, 0.3 + (fy - 0.33) * 1.15, fr * 1.3, c)) },   // (spread to fill it)
        uPal: { value: FLOWERS.map((hx) => col(hx, 1.15)) }, uLow: { value: col('#14233a') }, uHigh: { value: col('#1f3554') },
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: (B.index ?? 0) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform float uTime, uA, uFoot; uniform vec4 uF[8]; uniform vec3 uPal[5], uLow, uHigh;
        uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
        float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
        void main() {
          vec2 p = vec2((vUv.x - 0.5) * uA, vUv.y);                       // (in its heights, x from its middle)
          vec3 col = mix(uLow, uHigh, vUv.y);
          // the field's own dots, faint
          vec2 gg = vUv * vec2(uA, 1.0) * 26.0, gf = fract(gg) - 0.5;
          col = mix(col, col * 1.6, 1.0 - smoothstep(0.1, 0.16, length(gf)));
          // the stems, gathered at the foot of the bouquet, a band round them
          vec2 tie = vec2(0.0, uFoot + 0.03);
          for (int i = 0; i < 8; i++) if (seg(p, uF[i].xy, tie) < 0.004) col = vec3(0.3, 0.55, 0.38);
          if (seg(p, tie + vec2(-0.03, 0.0), tie + vec2(0.03, 0.0)) < 0.01) col = vec3(1.0, 0.62, 0.78);
          // the flowers: each its rings (heart, then out), each ring's dots lit in turn; a while open; out; again
          for (int i = 0; i < 8; i++) {
            vec2 d = p - uF[i].xy; float R = uF[i].z, rr = length(d);
            if (rr > R * 1.15) continue;
            float tt = mod(uTime * 0.6 + float(i) * 0.37, 6.0), fade = tt > 5.2 ? max(0.0, 1.0 - (tt - 5.2) * 1.5) : 1.0;
            for (int k = 0; k < 4; k++) {
              float fk = float(k), rk = (fk + 0.5) / 4.0 * R, n = 5.0 + fk * 6.0;
              float on = clamp((tt - fk * 0.35) * 2.0, 0.0, 1.0) * fade;
              float a = atan(d.y, d.x) - fk * 0.4 - uTime * 0.12, st = 6.28318 / n;
              float ac = floor(a / st + 0.5) * st + fk * 0.4 + uTime * 0.12;
              vec2 c = uF[i].xy + vec2(cos(ac), sin(ac)) * rk;
              float r = R * (0.075 + (3.0 - fk) * 0.018) * on;
              if (length(p - c) < r) col = k == 0 ? vec3(1.15, 0.95, 0.45) : uPal[int(uF[i].w)];
            }
          }
          // petals drifting down
          for (int k = 0; k < 10; k++) {
            float fk = float(k), ph = fract(sin(fk * 7.13) * 4375.85);
            vec2 q = vec2((ph - 0.5) * uA * 0.9 + sin(uTime * 0.8 + fk) * 0.02, 1.05 - mod(uTime * (0.03 + ph * 0.03) + ph, 1.0) * 0.9);
            if (length(p - q) < 0.008) col = uPal[k - (k / 5) * 5];
          }
          // fireflies
          for (int k = 0; k < 6; k++) {
            float fk = float(k), ph = fract(sin(fk * 12.9898) * 43758.5);
            vec2 q = vec2((fract(ph + uTime * 0.02) - 0.5) * uA + sin(uTime * 0.7 + fk) * 0.03, 0.3 + 0.6 * fract(ph * 7.3) + sin(uTime + fk * 2.0) * 0.03);
            float on = 0.5 + 0.5 * sin(uTime * 2.3 + fk * 5.0), dd = length(p - q);
            col += vec3(0.75, 1.0, 0.45) * (exp(-dd * dd / 0.0006) * 0.45 + (1.0 - smoothstep(0.005, 0.009, dd)) * 1.2) * on;
          }
          vec3 kk = vec3(0.57735), adj = uCaseAdj[uIndex];
          col = uHue * col;
          col = col * cos(adj.x) + cross(kk, col) * sin(adj.x) + kk * dot(kk, col) * (1.0 - cos(adj.x));
          col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const m = new THREE.Mesh(geom, mat);
    m.layers.set(LAYER.GLOW);
    return m;
  }
  // A stage of pictures (the dusk bakery's: Noto Emoji's glyphs, words, things drawn), each moving in its own way, worked out
  // in the shader over a round of P seconds. Its geometry in the stage's own frame (x across from its middle, y up
  // from its foot, z out), the mesh set where it goes by the caller. items, drawn in their order:
  //   { pic: { key, aspect, px, draw(g, W, H) }, x, y (its foot), z, s (its height), kind, t0, amp, per, a, b }
  // kinds (t0 its moment in the round):
  //   0 still; amp: bobbing that much up and down over per seconds
  //   1 squashed soft at t0, wobbling back (柔软)
  //   2 puffed up at t0 and back (蓬松)
  //   3 dropped in from amp above at t0, bouncing, squashed as it lands; shrunk away at the round's end
  //   4 setting amp and rising again over the round (the sun)
  //   5 popped in at t0, held amp seconds, shrunk away
  //   6 gliding amp a second along a loop from a, b long, coming round again
  //   7 steam: rising amp over per seconds, fading, from t0 (a share of per)
  //   8 fading in at t0, held amp seconds, fading out
  //   9 popped in at t0, turning per times round, fast and slowing to a stop over amp seconds, shrunk away
  // clip: [x0, x1, y0, y1] beyond which nothing shows (null: all of it); gain: its light; brand: its colours turned
  // as that brand's cases' are (the tuning panel; -1 not)
  function emojiStage(items, { P = 10, clip = null, gain = 1, brand = -1 } = {}) {
    const keyOf = (it) => it.pic.key, pics = new Map();
    for (const it of items) if (!pics.has(keyOf(it))) pics.set(keyOf(it), it.pic);
    const live = items;
    // (each picture once, in rows on one canvas)
    const AW = 2048, pad = 4, at = new Map();
    let cx = pad, cy = pad, row = 0;
    for (const [k, p] of pics) {
      let H = p.px || 160, W = Math.round(H * p.aspect);
      if (W > AW - 2 * pad) { H = Math.round(H * (AW - 2 * pad) / W); W = AW - 2 * pad; }
      if (cx + W + pad > AW) { cx = pad; cy += row + pad; row = 0; }
      at.set(k, [cx, cy, W, H]);
      cx += W + pad; row = Math.max(row, H);
    }
    const AH = THREE.MathUtils.ceilPowerOfTwo(cy + row + pad), cv = document.createElement('canvas');
    cv.width = AW; cv.height = AH;
    const g = cv.getContext('2d');
    for (const [k, [px, py, W, H]] of at) { g.save(); g.translate(px, py); pics.get(k).draw(g, W, H); g.restore(); }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.premultiplyAlpha = true;
    // (one quad, as many times over as there are things)
    const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    const n = live.length, A = { aRect: new Float32Array(n * 4), aPos: new Float32Array(n * 4), aMove: new Float32Array(n * 4), aMore: new Float32Array(n * 4) };
    live.forEach((it, i) => {
      const [px, py, W, H] = at.get(keyOf(it));
      A.aRect.set([px / AW, 1 - (py + H) / AH, (px + W) / AW, 1 - py / AH], i * 4);
      A.aPos.set([it.x, it.y, it.z || 0, it.s], i * 4);
      A.aMove.set([it.kind || 0, it.t0 || 0, it.amp || 0, it.per || 1], i * 4);
      A.aMore.set([W / H, it.a || 0, it.b || 1, 0], i * 4);
    });
    for (const [name, arr] of Object.entries(A)) geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
    geo.instanceCount = n;
    const big = 1e5, c = clip || [-big, big, -big, big];
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uAtlas: { value: tex }, uP: { value: P }, uClip: { value: new THREE.Vector4(...c) }, uGain: { value: gain },
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: brand } },
      transparent: true, depthWrite: false, premultipliedAlpha: true,
      vertexShader: /* glsl */ `
        attribute vec4 aRect, aPos, aMove, aMore;
        uniform float uTime, uP; varying vec2 vUv, vAt; varying float vA;
        float backOut(float x) { float c1 = 1.70158, c3 = c1 + 1.0; return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0); }
        float bounceOut(float x) {
          if (x < 1.0 / 2.75) return 7.5625 * x * x;
          if (x < 2.0 / 2.75) { x -= 1.5 / 2.75; return 7.5625 * x * x + 0.75; }
          if (x < 2.5 / 2.75) { x -= 2.25 / 2.75; return 7.5625 * x * x + 0.9375; }
          x -= 2.625 / 2.75; return 7.5625 * x * x + 0.984375;
        }
        void main() {
          float k = aMove.x, t0 = aMove.y, amp = aMove.z, per = aMove.w, tr = mod(uTime, uP) - t0, s = aPos.w, x = aPos.x;
          vec2 sc = vec2(1.0), off = vec2(0.0);
          float a = 1.0, mid = 0.0, rot = 0.0;                        // (mid: grown from its middle, else from its foot)
          if (k < 0.5) off.y = amp * sin(6.2832 * uTime / per + t0);
          else if (k < 1.5) {
            float u = clamp(tr / 0.9, 0.0, 1.0), b = tr > 0.0 ? sin(u * 12.566) * (1.0 - u) : 0.0;
            sc = vec2(1.0 + 0.13 * b, 1.0 - 0.17 * b);
          } else if (k < 2.5) {
            float u = clamp(tr / 1.1, 0.0, 1.0), b = tr > 0.0 ? sin(u * 3.1416) : 0.0;
            sc = vec2(1.0 + 0.16 * b * b);
          } else if (k < 3.5) {
            float gone = tr < 0.0 ? 0.0 : 1.0 - smoothstep(uP - t0 - 0.5, uP - t0 - 0.15, tr);
            off.y = tr < 0.0 ? 0.0 : amp * (1.0 - bounceOut(clamp(tr / 0.8, 0.0, 1.0)));
            float sq = tr > 0.28 && tr < 0.6 ? sin((tr - 0.28) / 0.32 * 3.1416) * 0.16 : 0.0;
            sc = vec2(gone * (1.0 + sq * 0.6), gone * (1.0 - sq));
            if (tr < 0.0) a = 0.0;
          } else if (k < 4.5) off.y = -amp * (0.5 - 0.5 * cos(6.2832 * (uTime + t0) / uP));
          else if (k < 5.5) {
            float gv = tr < 0.0 ? 0.0 : tr < 0.35 ? backOut(tr / 0.35) : tr < 0.35 + amp ? 1.0 : max(0.0, 1.0 - (tr - 0.35 - amp) / 0.25);
            sc = vec2(gv); mid = 1.0;
          } else if (k < 6.5) x = aMore.y + mod(aPos.x - aMore.y + amp * uTime, aMore.z);
          else if (k < 7.5) {
            float u = fract(uTime / per + t0);
            off = vec2(sin(u * 6.0 + t0 * 20.0) * 0.12 * s, amp * u); a = sin(u * 3.1416); sc = vec2(0.7 + 0.6 * u); mid = 1.0;
          } else if (k < 8.5) a = smoothstep(0.0, 0.9, tr) * (1.0 - smoothstep(0.9 + amp, 1.8 + amp, tr));
          else {
            float gv = tr < 0.0 ? 0.0 : tr < 0.3 ? backOut(tr / 0.3) : tr < 0.3 + amp ? 1.0 : max(0.0, 1.0 - (tr - 0.3 - amp) / 0.3);
            float u = clamp(tr / (0.3 + amp), 0.0, 1.0);
            sc = vec2(gv); mid = 1.0; rot = -6.2832 * per * (1.0 - pow(1.0 - u, 3.0));
          }
          vec2 p = vec2(x + off.x + position.x * aMore.x * s * sc.x, aPos.y + off.y + mix((position.y + 0.5) * sc.y, 0.5 + position.y * sc.y, mid) * s);
          if (rot != 0.0) {
            vec2 q = vec2(position.x * aMore.x, position.y) * s * sc;
            p = vec2(x, aPos.y + 0.5 * s) + off + vec2(q.x * cos(rot) - q.y * sin(rot), q.x * sin(rot) + q.y * cos(rot));
          }
          vUv = mix(aRect.xy, aRect.zw, uv); vAt = p; vA = a;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, aPos.z, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas; uniform vec4 uClip; uniform float uGain; uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex;
        varying vec2 vUv, vAt; varying float vA;
        void main() {
          if (vAt.x < uClip.x || vAt.x > uClip.y || vAt.y < uClip.z || vAt.y > uClip.w) discard;
          vec4 c = texture2D(uAtlas, vUv) * vA;
          if (c.a < 0.01) discard;
          vec3 col = c.rgb;
          if (uIndex >= 0) {
            vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
            col = uHue * col;
            col = col * cos(adj.x) + cross(k, col) * sin(adj.x) + k * dot(k, col) * (1.0 - cos(adj.x));
            col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
          }
          gl_FragColor = vec4(col * uGain, c.a);
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.layers.set(LAYER.GLOW);
    return m;
  }

  // a glyph as a flat shape in one colour (its outline and all that's inside it, nothing of its lines), a soft light
  // round it if asked, for emojiStage
  function solidGlyph(name, hex, glow = 0) {
    return { key: `solid:${name}:${hex}:${glow}`, aspect: 1, px: 160, draw: (g, W, H) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H; const t = c.getContext('2d'), k = glow ? 0.74 : 0.98;
      drawIcon(t, `noto/${name}`, W / 2, H / 2, W * k, '#000000');
      const d = t.getImageData(0, 0, W, H), a = d.data, out = new Uint8Array(W * H), st = [];
      const go = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (out[i] || a[i * 4 + 3] > 60) return; out[i] = 1; st.push(i); };
      for (let i = 0; i < W; i++) { go(i, 0); go(i, H - 1); }
      for (let i = 0; i < H; i++) { go(0, i); go(W - 1, i); }
      while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0; go(x + 1, y); go(x - 1, y); go(x, y + 1); go(x, y - 1); }
      const v = parseInt(hex.slice(1), 16), rgb = [v >> 16, (v >> 8) & 255, v & 255];
      for (let i = 0; i < W * H; i++) a.set([...rgb, out[i] ? 0 : 255], i * 4);
      t.putImageData(d, 0, 0);
      if (glow) { g.shadowColor = hex; g.shadowBlur = W * 0.1 * glow; }
      g.drawImage(c, 0, 0);
    } };
  }
  // the dusk bakery's look: a pale yellow-green, little saturated, its breads in one dark ink (Noto Emoji's glyphs, single
  // colour), a flat sun going down; its words in a serif; things fading in and out slowly rather than bouncing
  const DUSK = { ground: '#c2c393', low: '#b1b282', light: '#dcdcb2', ink: '#3c3f2c', mid: '#7d8060' };
  const SERIF = '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", serif', LATIN = 'Georgia, "Times New Roman", serif';
  const duskPic = {
    // a bread (or a sheaf of wheat, a cup…): its glyph in one colour
    glyph: (name, hex = DUSK.ink) => ({ key: `glyph:${name}:${hex}`, aspect: 1, px: 192, draw: (g, W, H) => drawIcon(g, `noto/${name}`, W / 2, H / 2, W * 0.96, hex) }),
    // words, in its serif (or the Latin one), spaced; vertical: one character under another
    words: (text, { fill = DUSK.ink, weight = 600, latin = false, space = 0.08, vertical = false, px = 128 } = {}) => {
      const fam = latin ? LATIN : SERIF, t = document.createElement('canvas').getContext('2d'), chars = [...text];
      t.font = `${weight} 100px ${fam}`;
      const wide = chars.reduce((a, c) => a + t.measureText(c).width, 0) + space * 100 * (chars.length - 1);
      const aspect = vertical ? 1.15 / (chars.length * (1 + space)) : (wide + 10) / 125;
      return { key: `words:${text}:${fill}:${weight}:${latin}:${vertical}`, aspect, px: vertical ? px * chars.length : px, draw: (g, W, H) => {
        g.fillStyle = fill; g.textBaseline = 'middle'; g.textAlign = 'center';
        if (vertical) {
          const step = H / chars.length;
          g.font = `${weight} ${step / (1 + space)}px ${fam}`;
          chars.forEach((c, i) => g.fillText(c, W / 2, step * (i + 0.5)));
          return;
        }
        const k = H / 125;
        g.font = `${weight} ${100 * k}px ${fam}`; g.textAlign = 'left';
        let x = 5 * k;
        for (const c of chars) { g.fillText(c, x, H / 2); x += g.measureText(c).width + space * 100 * k; }
      } };
    },
    // a round medallion: a bread's glyph in its ink on its yellow-green, a ring round it (its sculpture; its menu)
    medal: (name) => ({ key: `dusk:medal:${name}`, aspect: 1, px: 256, draw: (g, W, H) => {
      g.fillStyle = DUSK.ground; g.beginPath(); g.arc(W / 2, H / 2, W * 0.49, 0, 7); g.fill();
      g.strokeStyle = DUSK.ink; g.lineWidth = W * 0.02; g.beginPath(); g.arc(W / 2, H / 2, W * 0.44, 0, 7); g.stroke();
      drawIcon(g, `noto/${name}`, W / 2, H / 2, W * 0.6, DUSK.ink);
    } }),
    // the sun: a flat disc, a little lighter than the ground
    sun: { key: 'dusk:sun', aspect: 1, px: 256, draw: (g, W, H) => { g.fillStyle = DUSK.light; g.beginPath(); g.arc(W / 2, H / 2, W * 0.48, 0, 7); g.fill(); } },
    // a thread of steam, in the ink, faint
    steam: { key: 'dusk:steam', aspect: 0.4, px: 160, draw: (g, W, H) => {
      g.strokeStyle = 'rgba(60, 63, 44, 0.55)'; g.lineWidth = W * 0.07; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W * 0.5, H * 0.95); g.bezierCurveTo(W * 0.15, H * 0.7, W * 0.85, H * 0.45, W * 0.5, H * 0.25); g.quadraticCurveTo(W * 0.3, H * 0.14, W * 0.45, H * 0.05); g.stroke();
    } },
    // the ground before the sun: the lower colour, a fine line along its top
    land: (aspect) => ({ key: `dusk:land:${aspect.toFixed(2)}`, aspect, px: 128, draw: (g, W, H) => {
      g.fillStyle = DUSK.low; g.fillRect(0, 0, W, H);
      g.fillStyle = DUSK.ink; g.fillRect(0, 0, W, Math.max(2, H * 0.025));
    } }),
    // the sky: the ground colour, in a few bands a shade apart (lighter going down to the sun)
    sky: (aspect) => ({ key: `dusk:sky:${aspect.toFixed(2)}`, aspect, px: 256, draw: (g, W, H) => {
      ['#b9ba8a', '#bfc090', DUSK.ground, '#c8c99b'].forEach((c, i, all) => { g.fillStyle = c; g.fillRect(0, H * i / all.length, W, H / all.length + 1); });
    } }),
  };
  const BREAD_ROW = ['croissant', 'bread', 'baguette', 'bagel', 'pretzel', 'pie', 'waffle', 'cookie', 'flatbread'];
  // the dusk bakery's cases and signs (w x h): which, by its shape, or as asked, on emojiStage
  //   'wide'  (a large wide one): its name on the left; on the right the sun going down behind a line of its breads
  //           that come in one after another and go again, steam rising thin from two
  //   'tall'  (a tall one): its name down the left, one character under another; the sun above; three breads on
  //           the line under it, coming one after another
  //   'belt'  (a small wide one): its breads going by slowly along a line, its name above, the sun at the side
  //   'one'   (a small upright one, and its blade: no name): one bread after another, each fading into the next,
  //           before the sun
  //   'sign'  its name over its front: its name in the middle, its breads either side, still
  function dawnStage(w, h, B, kind = null) {
    kind ||= h / w > 1.2 ? (w < 2.5 ? 'one' : 'tall') : w > 7 ? 'wide' : 'belt';
    const it = [], bread = (n, hex) => duskPic.glyph(BREAD_ROW[n % BREAD_ROW.length], hex), line = (B.tagline || '').split('！').filter(Boolean).join(' · ');
    let P = 14;
    const sky = () => it.push({ pic: duskPic.sky(w / h), x: 0, y: 0, z: 0, s: h });
    // (fading in at t0, held, out again before the round's end)
    const coming = (t0, end = P - 1.4) => ({ kind: 8, t0, amp: end - t0 - 0.9 });
    if (kind === 'wide') {
      const yH = h * 0.28, nb = 4, x0 = -w * 0.04, x1 = w * 0.48, bs = Math.min(h * 0.32, (x1 - x0) / nb * 0.88);
      sky();
      it.push({ pic: duskPic.sun, x: w * 0.24, y: yH - h * 0.06, z: 0.004, s: h * 0.52, kind: 4, amp: h * 0.16 });
      it.push({ pic: duskPic.land(w / yH), x: 0, y: 0, z: 0.008, s: yH });
      for (let i = 0; i < nb; i++) {
        const x = x0 + (x1 - x0) * (i + 0.5) / nb;
        it.push({ pic: bread(i), x, y: yH - bs * 0.06, z: 0.02, s: bs, ...coming(1 + i * 0.7) });
        if (i === 1 || i === 3) it.push({ pic: duskPic.steam, x: x - bs * 0.05, y: yH + bs * 0.8, z: 0.02, s: h * 0.16, kind: 7, amp: h * 0.1, per: 4.5, t0: i * 0.3 });
      }
      it.push({ pic: duskPic.words(B.name, { space: 0.14 }), x: -w * 0.27, y: h * 0.52, z: 0.03, s: h * 0.2 });
      it.push({ pic: duskPic.words(B.en, { latin: true, weight: 400, space: 0.35 }), x: -w * 0.27, y: h * 0.4, z: 0.03, s: h * 0.065 });
      it.push({ pic: duskPic.words(line, { weight: 400, space: 0.1, fill: DUSK.mid }), x: -w * 0.27, y: h * 0.1, z: 0.03, s: h * 0.07 });
      return { items: it, P };
    }
    if (kind === 'tall') {
      const yH = h * 0.28, bs = w * 0.26;
      sky();
      it.push({ pic: duskPic.sun, x: w * 0.12, y: h * 0.46, z: 0.004, s: w * 0.6, kind: 4, amp: h * 0.05 });
      it.push({ pic: duskPic.land(w / yH), x: 0, y: 0, z: 0.008, s: yH });
      [0, 4, 2].forEach((n, i) => {
        const x = (i - 1) * w * 0.3;
        it.push({ pic: bread(n), x, y: yH - bs * 0.05, z: 0.02, s: bs, ...coming(1 + i * 0.8) });
      });
      it.push({ pic: duskPic.steam, x: -w * 0.32, y: yH + bs * 0.85, z: 0.02, s: w * 0.14, kind: 7, amp: w * 0.12, per: 4.5 });
      const cs = Math.min(h * 0.075, w * 0.16);
      it.push({ pic: duskPic.words(B.vertical || B.name, { vertical: true, space: 0.25 }), x: -w * 0.34, y: h * 0.93 - cs * 4 * 1.25, z: 0.03, s: cs * 4 * 1.25 });
      it.push({ pic: duskPic.words(B.en, { latin: true, weight: 400, space: 0.35 }), x: 0, y: h * 0.14, z: 0.03, s: h * 0.036 });
      it.push({ pic: duskPic.words(line, { weight: 400, space: 0.1, fill: DUSK.mid }), x: 0, y: h * 0.06, z: 0.03, s: h * 0.036 });
      return { items: it, P };
    }
    if (kind === 'belt') {
      const yH = h * 0.22, s = h * 0.36, step = s * 1.5, count = Math.ceil((w + step) / step) + 1, L = count * step;
      sky();
      it.push({ pic: duskPic.sun, x: w * 0.36, y: yH + h * 0.12, z: 0.004, s: h * 0.5 });
      it.push({ pic: duskPic.land(w / yH), x: 0, y: 0, z: 0.008, s: yH });
      for (let i = 0; i < count; i++) it.push({ pic: bread(i), x: -w / 2 - step / 2 + i * step, y: yH - s * 0.05, z: 0.02, s, kind: 6, amp: -0.18, a: -w / 2 - step, b: L });
      it.push({ pic: duskPic.words(B.name, { space: 0.14 }), x: -w * 0.22, y: h * 0.7, z: 0.03, s: h * 0.17 });
      it.push({ pic: duskPic.words(B.en, { latin: true, weight: 400, space: 0.35 }), x: -w * 0.22, y: h * 0.62, z: 0.03, s: h * 0.055 });
      return { items: it, P };
    }
    if (kind === 'one' || kind === 'blade') {
      const named = kind === 'one', nb = 5, per = P / nb, s = Math.min(w * 0.62, h * (named ? 0.46 : 0.74)), cy = named ? h * 0.6 : h * 0.5;
      sky();
      it.push({ pic: duskPic.sun, x: 0, y: cy - s * 0.6, z: 0.004, s: s * 1.2 });
      for (let i = 0; i < nb; i++) it.push({ pic: bread([0, 1, 3, 4, 2][i]), x: 0, y: cy - s / 2, z: 0.02, s, kind: 8, t0: i * per, amp: per - 0.9 });
      if (named) {
        it.push({ pic: duskPic.words(B.name, { space: 0.14 }), x: 0, y: h * 0.15, z: 0.03, s: Math.min(h * 0.11, w * 0.84 / 4.6) });
        it.push({ pic: duskPic.words(B.en, { latin: true, weight: 400, space: 0.3 }), x: 0, y: h * 0.06, z: 0.03, s: h * 0.035 });
      }
      return { items: it, P };
    }
    // 'sign': its name in the middle, its English under it, breads either side, still; a fine frame round it all,
    // as far in from each edge
    it.push({ pic: { key: `dusk:band:${(w / h).toFixed(2)}`, aspect: w / h, px: 192, draw: (g, W, H) => {
      g.fillStyle = DUSK.ground; g.fillRect(0, 0, W, H);
      const m = H * 0.06, t = Math.max(1, H * 0.015);
      g.strokeStyle = DUSK.ink; g.lineWidth = t; g.strokeRect(m + t / 2, m + t / 2, W - 2 * m - t, H - 2 * m - t);
    } }, x: 0, y: 0, z: 0, s: h });
    const ns = h * 0.54, nw = ns * 4 * 1.14;
    it.push({ pic: duskPic.words(B.name, { space: 0.14 }), x: 0, y: h * 0.32, z: 0.02, s: ns });
    it.push({ pic: duskPic.words(B.en, { latin: true, weight: 400, space: 0.35 }), x: 0, y: h * 0.14, z: 0.02, s: h * 0.13 });
    const bs = h * 0.6, step = bs * 1.7, per = Math.min(3, Math.max(0, Math.floor((w / 2 - nw / 2 - h * 0.4) / step)));
    for (let k = 0; k < per; k++) for (const e of [-1, 1]) it.push({ pic: bread(k * 2 + (e > 0 ? 1 : 0)), x: e * (nw / 2 + h * 0.4 + step * (k + 0.5)), y: h * 0.2, z: 0.02, s: bs });
    return { items: it, P };
  }
  // the dusk bakery's stage put up: w x h, its middle at (x, y) (as a panel), facing face, its brand's colours
  function dawnPanel(w, h, x, y, z, face, B, kind) {
    const { items, P } = dawnStage(w, h, B, kind);
    const m = emojiStage(items, { P, clip: [-w / 2, w / 2, 0, h], brand: (B.index ?? 0) });
    m.rotation.y = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }[face];
    m.position.set(x, y - h / 2, z);
    return m;
  }
  // the rain-window diner's window (its ads, its blade sign, the glass of its front), all of it in LED dots: fogged with the
  // warmth inside, rain on it; drops running down, lit, clear a line through the fog as they go, which mists over
  // again; its name lit in the dots, a drip or two running from it. In an ad, the room behind, blurred through the
  // fog and sharp through the drops: a lamp hung low, a bowl under it on the table, steam going up from it (kind: by
  // its shape). glass: on its shop's front a film of dots over the room itself, faint where
  // fogged, out where cleared (name: or not); 'blade' as that, on the dark, its bowl (Noto Emoji's) lit in the
  // dots in place of the name. Drops after BigWings's Heartfelt, made simpler; everything worked out
  // at each dot's middle. A mesh w x h, its middle at (x, y, z), facing face
  function rainWindow(w, h, x, y, z, face, B, { kind = null, glass = false, name = true } = {}) {
    const aspect = w / h;
    kind ||= glass ? 'glass' : aspect > 1.4 ? 'wide' : aspect < 0.8 ? 'tall' : 'square';
    if (kind === 'blade') name = false;
    const W = aspect >= 1 ? 768 : Math.round(768 * aspect), H = aspect >= 1 ? Math.round(768 / aspect) : 768;
    // where things are (0..1 across, 0..1 up): the bowl (its middle and width as a share of the width), the lamp
    // over it, the name (its middle, its height as a share of the height; down: one character under another)
    const L = {
      wide: { bowl: [0.7, 0.3, Math.min(0.26, 0.5 / aspect)], name: [0.3, 0.56, 0.24] },
      tall: { bowl: [0.6, 0.24, 0.5], name: [0.2, 0.64, 0.13], down: true },
      square: { bowl: [0.64, 0.28, 0.42], name: [0.3, 0.72, 0.17] },
      glass: { bowl: [0.5, 0.3, 0.4], name: [0.5, 0.74, 0.16] },
      blade: { bowl: [0.5, 0.3, 0.58] },
    }[kind];
    const tex = (draw) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      draw(cv.getContext('2d'));
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const [bx, by, bw] = L.bowl, BX = bx * W, BW = bw * W, BY = (1 - by) * H, BH = BW * 0.42;
    // the room: deep indigo, the lamp's warm light pooled under it, the table, the bowl (broth in it, chopsticks
    // laid across), a dish by it
    const blade = kind === 'blade', scene = glass || blade ? null : tex((g) => {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a0e24'); sky.addColorStop(1, '#1a2146');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(70, 82, 140, 0.35)'; g.lineWidth = W * 0.004;
      for (let k = 1; k < 6; k++) { const xx = (k / 6) * W; g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, BY - BH * 0.4); g.stroke(); }
      const ly = Math.max(H * 0.12, BY - BW * 1.25), pool = g.createRadialGradient(BX, ly, 0, BX, ly + BW * 0.6, BW * 1.8);
      pool.addColorStop(0, 'rgba(255, 196, 120, 0.85)'); pool.addColorStop(0.45, 'rgba(255, 170, 95, 0.28)'); pool.addColorStop(1, 'rgba(255, 160, 90, 0)');
      g.fillStyle = pool; g.fillRect(0, 0, W, H);
      const top = BY + BH * 0.18;                                                        // the table
      g.fillStyle = '#2b2233'; g.fillRect(0, top, W, H - top);
      const sheen = g.createRadialGradient(BX, top, 0, BX, top, BW * 1.6);
      sheen.addColorStop(0, 'rgba(255, 190, 120, 0.55)'); sheen.addColorStop(1, 'rgba(255, 190, 120, 0)');
      g.fillStyle = sheen; g.fillRect(0, top, W, H - top);
      g.fillStyle = 'rgba(255, 200, 140, 0.5)'; g.fillRect(0, top, W, Math.max(1, H * 0.004));
      // the lamp: its cord, its shade dark, lit inside, the bulb
      g.strokeStyle = '#0b0e1c'; g.lineWidth = Math.max(1, W * 0.004); g.beginPath(); g.moveTo(BX, 0); g.lineTo(BX, ly - BW * 0.16); g.stroke();
      g.fillStyle = '#0d1122'; g.beginPath(); g.moveTo(BX - BW * 0.1, ly - BW * 0.17); g.lineTo(BX + BW * 0.1, ly - BW * 0.17); g.lineTo(BX + BW * 0.3, ly); g.lineTo(BX - BW * 0.3, ly); g.closePath(); g.fill();
      g.fillStyle = '#ffd9a0'; g.beginPath(); g.ellipse(BX, ly, BW * 0.3, BW * 0.045, 0, 0, Math.PI); g.fill();
      const bulb = g.createRadialGradient(BX, ly + BW * 0.02, 0, BX, ly + BW * 0.02, BW * 0.2);
      bulb.addColorStop(0, 'rgba(255, 245, 220, 1)'); bulb.addColorStop(1, 'rgba(255, 210, 150, 0)');
      g.fillStyle = bulb; g.fillRect(BX - BW * 0.3, ly - BW * 0.1, BW * 0.6, BW * 0.4);
      // a little dish by it, the bowl, its broth, chopsticks across it
      g.fillStyle = '#d8cfc0'; g.beginPath(); g.ellipse(BX - BW * 0.82, top + BH * 0.02, BW * 0.2, BW * 0.05, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9fb48a'; g.beginPath(); g.ellipse(BX - BW * 0.82, top - BH * 0.02, BW * 0.12, BW * 0.03, 0, 0, Math.PI * 2); g.fill();
      const body = g.createLinearGradient(BX - BW / 2, 0, BX + BW / 2, 0); body.addColorStop(0, '#fff6e8'); body.addColorStop(1, '#b9ad9c');
      g.fillStyle = body; g.beginPath(); g.moveTo(BX - BW / 2, BY - BH * 0.5); g.bezierCurveTo(BX - BW / 2, BY + BH * 0.55, BX + BW / 2, BY + BH * 0.55, BX + BW / 2, BY - BH * 0.5); g.closePath(); g.fill();
      g.fillStyle = '#efe5d4'; g.fillRect(BX - BW * 0.16, BY + BH * 0.02, BW * 0.32, BH * 0.18);
      g.fillStyle = '#f7efe2'; g.beginPath(); g.ellipse(BX, BY - BH * 0.5, BW / 2, BW * 0.09, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c98d4c'; g.beginPath(); g.ellipse(BX, BY - BH * 0.5, BW * 0.45, BW * 0.07, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7fa06a'; for (const dx of [-0.15, 0.05, 0.2]) { g.beginPath(); g.ellipse(BX + BW * dx, BY - BH * 0.5, BW * 0.04, BW * 0.015, 0.3, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = '#3a2a22'; g.lineWidth = Math.max(1, BW * 0.025); g.lineCap = 'round';
      for (const d of [0, BW * 0.05]) { g.beginPath(); g.moveTo(BX - BW * 0.25 + d, BY - BH * 0.62); g.lineTo(BX + BW * 0.62 + d, BY - BH * 1.05); g.stroke(); }
    });
    // the name written in the fog: brushed with a finger (soft edges), a few drips running down from it
    const RW = makeRandom(Math.round(w * 97 + h * 31));
    const words = tex((g) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (blade) { drawIcon(g, 'noto/ramen', W / 2, H * 0.52, Math.min(W, H) * 0.74, '#fff'); return; }
      if (!name) return;
      const [nx, ny, nh] = L.name, chars = [...B.name], cs = nh * H;
      g.fillStyle = '#fff';
      g.font = `600 ${cs}px "PingFang SC", "Noto Sans SC", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const at = chars.map((c, i) => L.down ? [nx * W, (1 - ny) * H + (i - (chars.length - 1) / 2) * cs * 1.05] : [nx * W + (i - (chars.length - 1) / 2) * cs * 1.02, (1 - ny) * H]);
      chars.forEach((c, i) => g.fillText(c, ...at[i]));
      g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const [cx, cy] = at[RW.int(0, at.length - 1)], dx = cx + RW.range(-0.3, 0.3) * cs, y0 = cy + cs * 0.35, len = RW.range(0.25, 0.7) * cs;
        const grad = g.createLinearGradient(0, y0, 0, y0 + len); grad.addColorStop(0, '#fff'); grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        g.strokeStyle = grad; g.lineWidth = cs * 0.045; g.beginPath(); g.moveTo(dx, y0); g.lineTo(dx, y0 + len); g.stroke();
      }
    });
    const STEAM = [bx, by + (BH * 0.5) / H, bw * 0.55, 0.32];
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uScene: { value: scene }, uWords: { value: words }, uTime: shared.uTime, uAspect: { value: aspect },
        // (the drops' scale: on its own glass, drops as they are; in a picture of a window, by its size)
        uScale: { value: glass ? 1.1 : blade ? 1.75 : THREE.MathUtils.clamp(h / 1.6, 1, 3.2) * 1.7 },   // (the blade's drops as many dots across as its front's) uSeed: { value: RW.range(0, 50) }, uSteam: { value: new THREE.Vector4(...STEAM) },
        uDots: { value: new THREE.Vector2(w, h).divideScalar(Math.min(w, h) / (glass ? 80 : 50)).floor() },   // (dots across, up)
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: (B.index ?? 0) },
      },
      defines: glass ? { GLASS: 1 } : blade ? { GLASS: 1, BLADE: 1 } : {},
      transparent: glass, depthWrite: !glass,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D uScene, uWords; uniform float uTime, uAspect, uScale, uSeed; uniform vec4 uSteam; uniform vec2 uDots;
        uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex;
        varying vec2 vUv;
        vec3 N13(float p) { vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.11369, 0.13787)); p3 += dot(p3, p3.yzx + 19.19); return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x)); }
        float N(float t) { return fract(sin(t * 12345.564) * 7658.76); }
        float Saw(float b, float t) { return smoothstep(0.0, b, t) * smoothstep(1.0, b, t); }
        // the drops running down: (the drop itself, the line it leaves clear)
        vec2 layer(vec2 uv, float t) {
          vec2 UV = uv;
          uv.y += t * 0.75;
          vec2 a = vec2(6.0, 1.0), grid = a * 2.0, id = floor(uv * grid);
          uv.y += N(id.x);
          id = floor(uv * grid);
          vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
          vec2 st = fract(uv * grid) - vec2(0.5, 0.0);
          float x = n.x - 0.5, y = UV.y * 20.0;
          x += sin(y + sin(y)) * (0.5 - abs(x)) * (n.z - 0.5);
          x *= 0.7;
          float ti = fract(t + n.z);
          y = (Saw(0.85, ti) - 0.5) * 0.9 + 0.5;
          float d = length((st - vec2(x, y)) * a.yx), drop = smoothstep(0.4, 0.0, d);
          float r = sqrt(smoothstep(1.0, y, st.y)), cd = abs(st.x - x);
          float front = smoothstep(-0.02, 0.02, st.y - y);
          float trail = smoothstep(0.23 * r, 0.15 * r * r, cd) * front * r * r;
          float yy = fract(UV.y * 10.0) + (st.y - 0.5);
          float beads = smoothstep(0.3, 0.0, length(st - vec2(x, yy)));
          return vec2(drop + beads * r * front * 0.45, trail);
        }
        // the small drops sitting on it, coming and going
        float still(vec2 uv, float t) {
          uv *= 40.0;
          vec2 id = floor(uv); uv = fract(uv) - 0.5;
          vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
          return smoothstep(0.3, 0.0, length(uv - (n.xy - 0.5) * 0.7)) * fract(n.z * 10.0) * Saw(0.025, fract(t + n.z));
        }
        vec2 drops(vec2 uv, float t) {
          vec2 m1 = layer(uv, t), m2 = layer(uv * 1.85, t);
          return vec2(smoothstep(0.3, 1.0, still(uv, t) * 0.4 + m1.x + m2.x), max(m1.y, m2.y));
        }
        // steam: soft wisps going up out of the bowl, wavering
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
        float steam(vec2 p, float t) {
          vec2 q = vec2((p.x - uSteam.x) / uSteam.z, (p.y - uSteam.y) / uSteam.w);
          if (q.y < 0.0 || q.y > 1.0) return 0.0;
          float sway = (noise(vec2(q.y * 3.0 - t * 0.4, 1.7)) - 0.5) * 0.6 * q.y;
          float bx = (q.x - sway) * 2.4 / (0.5 + q.y), body = exp(-bx * bx);
          float wisps = noise(vec2(q.x * 4.0, q.y * 3.0 - t * 0.9)) * noise(vec2(q.x * 7.0 + 3.1, q.y * 5.0 - t * 1.3));
          return body * smoothstep(0.0, 0.15, q.y) * smoothstep(1.0, 0.45, q.y) * smoothstep(0.03, 0.3, wisps);
        }
        void main() {
          // the dot this is in (its middle), and where in it; everything is worked out at its middle
          vec2 cell = (floor(vUv * uDots) + 0.5) / uDots, f = fract(vUv * uDots) - 0.5;
          float dotM = smoothstep(0.47, 0.3, length(f));
          dotM = mix(dotM, 0.45, clamp(max(fwidth(vUv.x * uDots.x), fwidth(vUv.y * uDots.y)) * 1.6 - 0.4, 0.0, 1.0));   // (far off: their average, no bands)
          vec2 uv = vec2(cell.x * uAspect, cell.y) / uScale;
          float t = uTime * 0.18 + uSeed;
          vec2 c = drops(uv, t), e = vec2(1.0 / (uDots.y * uScale), 0.0);   // (e: a dot over)
          vec2 nrm = vec2(drops(uv + e, t).x - c.x, drops(uv + e.yx, t).x - c.x);
          float words = textureLod(uWords, cell, 0.0).r;
          float clear = clamp(max(smoothstep(0.1, 0.25, c.x), c.y), 0.0, 1.0), drop = smoothstep(0.15, 0.4, c.x);
  #ifdef GLASS
          // a film of dots on the glass: faint where it is fogged, out where cleared, bright where a drop is, the name lit
          float fog = 0.3 * (1.0 - clear);
          vec3 col = vec3(0.55, 0.66, 0.8) * fog + vec3(0.65, 1.0, 1.15) * drop + vec3(1.25, 1.05, 0.78) * words;
          col /= max(fog + drop + words, 1e-3);
          float a = clamp(fog + drop * 0.75 + words * 0.95, 0.0, 1.0) * dotM;
  #ifdef BLADE
          // (on the dark: the dots between faintly there)
          col = uHue * (col * a + vec3(0.004, 0.005, 0.01) * (1.0 - a));
          vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
          col = col * cos(adj.x) + cross(k, col) * sin(adj.x) + k * dot(k, col) * (1.0 - cos(adj.x));
          col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
          gl_FragColor = vec4(col, 1.0);
  #else
          gl_FragColor = vec4(uHue * col, a);
  #endif
  #else
          vec2 suv = cell + nrm * 0.5 / vec2(uAspect, 1.0);
          vec3 col = textureLod(uScene, suv, mix(2.2, 0.0, clear)).rgb;
          col += vec3(0.85, 0.82, 0.78) * steam(suv, uTime) * mix(0.45, 0.8, clear);
          col = mix(col, col * 0.8 + vec3(0.045, 0.052, 0.072), 0.85 * (1.0 - clear));   // (the fog: milky, lit; the lines the drops clear dark through it, as on the front)
          col *= 1.0 - 0.45 * c.y;
          col += vec3(0.3, 0.55, 0.75) * drop * 0.45;                                   // (the drops lit, not much more than their lines)
          col = mix(col, vec3(1.25, 1.05, 0.78), words * 0.92);                          // (its name lit)
          col = col * dotM * 1.25 + vec3(0.003, 0.004, 0.009) * (1.0 - dotM);           // (as dots, on the dark between them)
          col = uHue * col;
          vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
          col = col * cos(adj.x) + cross(k, col) * sin(adj.x) + k * dot(k, col) * (1.0 - cos(adj.x));
          col = max(mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, adj.y), 0.0) * adj.z;
          gl_FragColor = vec4(col, 1.0);
  #endif
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.y = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }[face];
    m.position.set(x, y, z);
    m.layers.set(LAYER.GLOW);
    return m;
  }
  // a flower of dots for the florist's signs: rings of dots round a yellow heart, at (cx, cy), r across
  function dotFlower(g, cx, cy, r, hex) {
    g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(cx, cy, r * 0.2, 0, 7); g.fill();
    for (const [k, n, rr] of [[1, 8, 0.55], [2, 14, 0.9]]) for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + k * 0.3;
      g.fillStyle = hex; g.beginPath(); g.arc(cx + Math.cos(a) * r * rr, cy + Math.sin(a) * r * rr, r * (k === 1 ? 0.15 : 0.12), 0, 7); g.fill();
    }
  }
  // the florist's name sign (on the street, in the station): the night's blue; polka dots in its flowers' colours,
  // growing larger and nearer together from the name out to either end; a flower of dots either side of the name;
  // the name in the middle, its English under in its green; a thin rim of light round it; in its colours (the tuning panel)
  function floristSign(geom, w, h, B) {
    return inBrandColours(canvasPlane(geom, w / h, false, (g, W, H) => {
      g.fillStyle = '#16263f'; g.fillRect(0, 0, W, H);
      const font = (px) => `600 ${px}px "PingFang SC", "Noto Sans SC", sans-serif`, name = [...B.name].join(String.fromCharCode(8202));
      g.font = font(H * 0.46); const tw = g.measureText(name).width, clear = tw / 2 + H * 0.95;
      const step = H / 7, rn = makeRandom(4242);
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
        const d = Math.abs(x - W / 2); if (d < clear) continue;
        const k = Math.min(1, (d - clear) / (H * 1.6)), r = step * (0.12 + 0.3 * k);
        g.fillStyle = rn.chance(0.3) ? '#2e4a6e' : FLOWERS[rn.int(0, FLOWERS.length - 1)];
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
      for (const e of [-1, 1]) dotFlower(g, W / 2 + e * (tw / 2 + H * 0.5), H * 0.48, H * 0.3, '#ff9cc2');
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font(H * 0.46);
      g.fillText(name, W / 2, H * 0.42);
      g.fillStyle = '#c8ff7a'; g.font = `600 ${H * 0.14}px "Helvetica Neue", Arial, sans-serif`;
      g.fillText((B.en || '').split('').join(String.fromCharCode(8202)), W / 2, H * 0.8);
      g.strokeStyle = 'rgba(255, 255, 255, 0.9)'; g.lineWidth = H * 0.035; g.strokeRect(H * 0.02, H * 0.02, W - H * 0.04, H - H * 0.04);
    }, 256), (B.index ?? 0));
  }
  // the space travel agency's shop's upright: space as on its strip (a soft grey-blue, stars), and in from its top corner the
  // station's wheel, so near that only a corner of it shows, turning slowly (its rim in two greys, its portholes,
  // the inner ring, the spokes to the hub beyond the edge); its name small at the foot; in its colours as its strip
  function starBlade(geom, w, h, B) {
    const Rn = makeRandom(4401);
    const Z = 512, wheel = document.createElement('canvas'); wheel.width = wheel.height = Z;
    const g = wheel.getContext('2d'), c = Z / 2, R0 = Z * 0.46;
    const ring = (r, wid, col) => { g.strokeStyle = col; g.lineWidth = wid; g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); };
    g.strokeStyle = '#7a8594'; g.lineWidth = Z * 0.012;
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * R0 * 0.14, c + Math.sin(a) * R0 * 0.14); g.lineTo(c + Math.cos(a) * R0 * 0.94, c + Math.sin(a) * R0 * 0.94); g.stroke(); }
    ring(R0, Z * 0.075, '#a3acb8'); ring(R0 - Z * 0.022, Z * 0.022, '#8a94a2'); ring(R0 * 0.8, Z * 0.02, '#6c7684');
    g.fillStyle = '#a3acb8'; g.beginPath(); g.arc(c, c, R0 * 0.14, 0, 7); g.fill();
    for (const [rr, n, sz] of [[R0 + Z * 0.016, 120, 0.011], [R0 - Z * 0.016, 120, 0.011], [R0 * 0.8, 90, 0.008]]) for (let k = 0; k < n; k++) {
      if (Rn.chance(0.25)) continue;
      const a = k / n * Math.PI * 2, q = Z * sz;
      g.save(); g.translate(c + Math.cos(a) * rr, c + Math.sin(a) * rr); g.rotate(a + Math.PI / 2);
      g.fillStyle = Rn.chance(0.8) ? '#d6ecf6' : '#8fe6f5'; g.fillRect(-q * 0.8, -q / 2, q * 1.6, q); g.restore();
    }
    const H = 256, Wd = Math.round(H * w / h), back = document.createElement('canvas'); back.width = Wd; back.height = H;
    const b = back.getContext('2d'), sky = b.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#273752'); sky.addColorStop(1, '#3e5374');
    b.fillStyle = sky; b.fillRect(0, 0, Wd, H);
    for (let k = 0; k < 40; k++) { b.fillStyle = `rgba(225, 238, 255, ${Rn.range(0.4, 0.9)})`; b.beginPath(); b.arc(Rn.range(0, Wd), Rn.range(0, H), Rn.range(0.6, 1.5), 0, 7); b.fill(); }
    const label = document.createElement('canvas'); label.width = Wd; label.height = H;
    const l = label.getContext('2d');
    l.shadowColor = 'rgba(8, 16, 34, 0.85)'; l.shadowBlur = H * 0.06; l.fillStyle = '#ffffff'; l.textBaseline = 'middle'; l.textAlign = 'left';
    l.font = `600 ${H * 0.14}px "PingFang SC", "Noto Sans SC", sans-serif`; l.fillText([...B.name].join(String.fromCharCode(8202)), H * 0.1, H * 0.86, Wd * 0.9);
    const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uWheel: { value: tex(wheel) }, uBack: { value: tex(back) }, uLabel: { value: tex(label) }, uA: { value: w / h },
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: (B.index ?? 0) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D uWheel, uBack, uLabel; uniform float uTime, uA; uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uBack, vUv).rgb;
          // (the wheel's hub out past the top right corner, its rim crossing the board; turning slowly)
          vec2 p = vec2(vUv.x * uA, vUv.y) - vec2(uA + 0.12, 1.15);
          float a = -uTime * 0.12, R = 1.05 / 0.46;
          vec2 q = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a)) / R + 0.5;
          if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) { vec4 wv = texture2D(uWheel, vec2(q.x, 1.0 - q.y)); c = mix(c, wv.rgb, wv.a); }
          vec4 lb = texture2D(uLabel, vUv); c = mix(c, lb.rgb, lb.a);
          vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
          c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 0.67);   // (a third less saturated, as its strip)
          c = uHue * c * 1.1;
          c = c * cos(adj.x) + cross(k, c) * sin(adj.x) + k * dot(k, c) * (1.0 - cos(adj.x));
          c = max(mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, adj.y), 0.0) * adj.z;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const m = new THREE.Mesh(geom, mat);
    m.layers.set(LAYER.GLOW);
    return m;
  }
  // the space travel agency's long strip, going by: a view of space drawn once as a long round (a soft grey-blue, stars far and
  // near, the edge of the Earth and the lower part of the station's wheel as its case has them, a shuttle with its
  // trail) scrolling smoothly by and round, all along it; its name, its English and its tagline
  // written over it at the left, still; in the brand's colours (the tuning panel) as its cases are. seed: its own numbers
  function starTicker(geom, w, h, seed, B) {
    const Rn = makeRandom(Math.floor(seed * 1e6) + 77);
    const H = 256, La = 9, Wl = Math.round(H * La), LW = 2.1;                 // (the round La heights long; the panel LW)
    const pano = document.createElement('canvas'); pano.width = Wl; pano.height = H;
    const g = pano.getContext('2d');
    // space: a soft, greyed blue, a little lighter toward its foot
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#273752'); sky.addColorStop(1, '#3e5374');
    g.fillStyle = sky; g.fillRect(0, 0, Wl, H);
    const wrap = (x, draw) => { for (const dx of [-Wl, 0, Wl]) { g.save(); g.translate(x + dx, 0); draw(); g.restore(); } };
    // stars, far and near
    for (let k = 0; k < La * 60; k++) {
      const x = Rn.range(0, Wl), y = Rn.range(0, H), r = Rn.chance(0.08) ? Rn.range(1.6, 2.4) : Rn.range(0.6, 1.2);
      g.fillStyle = Rn.chance(0.2) ? `rgba(255, 230, 190, ${Rn.range(0.5, 0.9)})` : `rgba(225, 238, 255, ${Rn.range(0.5, 0.95)})`;
      wrap(x, () => { g.beginPath(); g.arc(0, y, r, 0, 7); g.fill(); });
    }
    // the Earth, as in the space travel agency's case: only its edge, rising from the foot; its day side up and to the left, its
    // night to the right with its cities lit, lands near its top, its air glowing round it
    wrap(H * 2.1, () => {
      const er = H * 2.3, ey = H * 0.42 + er;                               // (its top at 0.42 of the height)
      for (const [k, a] of [[1.12, 0.06], [1.08, 0.1], [1.05, 0.16], [1.025, 0.26]]) {
        g.fillStyle = `rgba(110, 215, 255, ${a})`; g.beginPath(); g.arc(0, ey, er * k, 0, 7); g.fill();
      }
      const body = g.createLinearGradient(-er * 0.5, 0, er * 0.5, 0); body.addColorStop(0, '#5a8fd8'); body.addColorStop(0.55, '#3b6cb8'); body.addColorStop(1, '#1d3a72');
      g.fillStyle = body; g.beginPath(); g.arc(0, ey, er, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(0, ey, er, 0, 7); g.clip();
      g.fillStyle = '#7fb0ea';
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + Rn.range(-0.5, 0.35), rr = er * Rn.range(0.86, 0.97), sz = H * Rn.range(0.08, 0.2);
        g.beginPath(); g.ellipse(Math.cos(a) * rr, ey + Math.sin(a) * rr, sz * 1.5, sz * 0.45, a + Math.PI / 2, 0, 7); g.fill();
      }
      g.fillStyle = '#ffd98f';
      for (let k = 0; k < 60; k++) {
        const a = -Math.PI / 2 + Rn.range(0.12, 0.7), rr = er * Rn.range(0.86, 0.995);
        g.fillRect(Math.cos(a) * rr, ey + Math.sin(a) * rr, 2, 2);
      }
      g.restore();
    });
    // the station's wheel, as in its case: so near that only the lower part of its rim shows, coming down from
    // above; the rim in two greys, its portholes pale in two rows (a few cyan: all of it in the one cool range), the
    // inner ring, the spokes going up
    wrap(H * 6.3, () => {
      const R0 = H * 2.2, cy = -R0 + H * 0.62;                               // (its rim's foot at 0.62 of the height)
      const ring = (r, wid, col) => { g.strokeStyle = col; g.lineWidth = wid; g.beginPath(); g.arc(0, cy, r, 0, 7); g.stroke(); };
      g.strokeStyle = '#7a8594'; g.lineWidth = H * 0.025;
      for (let k = 0; k < 12; k++) { const a = Math.PI / 2 + (k / 12 - 0.5) * 1.2; g.beginPath(); g.moveTo(Math.cos(a) * R0 * 0.2, cy + Math.sin(a) * R0 * 0.2); g.lineTo(Math.cos(a) * (R0 - H * 0.12), cy + Math.sin(a) * (R0 - H * 0.12)); g.stroke(); }
      ring(R0, H * 0.17, '#a3acb8');
      ring(R0 - H * 0.05, H * 0.05, '#8a94a2');
      ring(R0 - H * 0.2, H * 0.045, '#6c7684');
      for (const [rr, n, sz] of [[R0 + H * 0.035, 160, 0.03], [R0 - H * 0.035, 160, 0.03], [R0 - H * 0.2, 120, 0.02]]) {
        for (let k = 0; k < n; k++) {
          if (Rn.chance(0.25)) continue;
          const a = Math.PI / 2 + (k / n - 0.5) * 1.6, q = H * sz;
          g.save(); g.translate(Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2);
          g.fillStyle = Rn.chance(0.8) ? '#d6ecf6' : '#8fe6f5'; g.fillRect(-q * 0.8, -q / 2, q * 1.6, q);
          g.restore();
        }
      }
    });
    // a shuttle on its way to the station, its trail behind (to the right: it goes the way the view goes)
    wrap(H * 8.2, () => {
      const y = H * 0.78, tr = g.createLinearGradient(0, 0, H * 0.9, 0); tr.addColorStop(0, 'rgba(140, 225, 255, 0.85)'); tr.addColorStop(1, 'rgba(140, 225, 255, 0)');
      g.fillStyle = tr; g.beginPath(); g.moveTo(H * 0.08, y - H * 0.018); g.lineTo(H * 0.9, y - H * 0.004); g.lineTo(H * 0.9, y + H * 0.004); g.lineTo(H * 0.08, y + H * 0.018); g.fill();
      g.fillStyle = '#eef3f8'; g.beginPath(); g.moveTo(-H * 0.1, y); g.lineTo(H * 0.05, y - H * 0.04); g.lineTo(H * 0.09, y); g.lineTo(H * 0.05, y + H * 0.04); g.closePath(); g.fill();
    });
    // its words at its left, over the view
    const PW = Math.round(H * LW), panel = document.createElement('canvas'); panel.width = PW; panel.height = H;
    const q = panel.getContext('2d');
    q.shadowColor = 'rgba(8, 16, 34, 0.85)'; q.shadowBlur = H * 0.1;
    q.fillStyle = '#ffffff'; q.textBaseline = 'middle'; q.textAlign = 'left';
    q.font = `700 ${H * 0.3}px "PingFang SC", "Noto Sans SC", sans-serif`; q.fillText(B.name, H * 0.22, H * 0.42, PW - H * 0.3);
    q.fillStyle = '#bfefff'; q.font = `600 ${H * 0.11}px "Helvetica Neue", Arial, sans-serif`; q.fillText((B.en || '').split('').join(String.fromCharCode(8202)), H * 0.24, H * 0.66, PW - H * 0.3);
    q.fillStyle = '#d6e4f5'; q.font = `500 ${H * 0.095}px "PingFang SC", "Noto Sans SC", sans-serif`; q.fillText(B.tagline, H * 0.24, H * 0.84, PW - H * 0.3);
    const tex = (cv, rep) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = rep ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.anisotropy = 4; return t; };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime, uPano: { value: tex(pano, true) }, uPanel: { value: tex(panel, false) }, uA: { value: w / h }, uLa: { value: La }, uLW: { value: LW }, uSpeed: { value: 0.32 },
        uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: (B.index ?? 0) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D uPano, uPanel; uniform float uTime, uA, uLa, uLW, uSpeed; uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
        void main() {
          float X = vUv.x * uA;                                    // (along it, in its heights)
          vec3 c = texture2D(uPano, vec2(fract((X + uTime * uSpeed) / uLa), vUv.y)).rgb;
          if (X < uLW) { vec4 p = texture2D(uPanel, vec2(X / uLW, vUv.y)); c = mix(c, p.rgb, p.a); }   // (the words over it)
          vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
          c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 0.67);   // (all of it a third less saturated)
          c = uHue * c * 1.1;
          c = c * cos(adj.x) + cross(k, c) * sin(adj.x) + k * dot(k, c) * (1.0 - cos(adj.x));
          c = max(mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, adj.y), 0.0) * adj.z;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const m = new THREE.Mesh(geom, mat);
    m.layers.set(LAYER.GLOW);
    return m;
  }
  function cafeSign(geom, w, h, B, kind = 'name', back = null) {
    const density = kind === 'column' ? 44 : THREE.MathUtils.clamp(34 / h, 9, 40);
    if (back) {
      const n = new THREE.Vector3().fromBufferAttribute(geom.attributes.normal, 0);
      back(geom.clone().translate(-n.x * 0.012, -n.y * 0.012, -n.z * 0.012), CAFE_WALL);
    }
    const font = (wt, px) => `${wt} ${px}px "PingFang SC", "Noto Sans SC", sans-serif`;
    // its cup and name, from x0 (left), Hc high; returns how wide (measure only, without g drawing)
    const named = (g, x0, Hc, draw = true) => {
      const nh = Hc * 0.42, eh = Hc * 0.16, ic = Hc * 0.86, gap = Hc * 0.12;
      g.font = font(600, nh); const tw = g.measureText(B.name).width;
      g.font = font(600, eh); const ew = g.measureText(B.en).width;
      const gw = ic * 0.7 + gap + Math.max(tw, ew);
      if (!draw) return gw;
      coffeeCup(g, x0 + ic * 0.33, Hc * 0.5, ic, [[140, 0.5]]);
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.font = font(600, nh); g.fillText(B.name, x0 + ic * 0.7 + gap, Hc * 0.4);
      g.fillStyle = 'rgb(200,200,200)'; g.font = font(600, eh); g.fillText(B.en, x0 + ic * 0.7 + gap + (tw - ew) / 2, Hc * 0.76);
      return gw;
    };
    // (a row's round: its name and margins, and six slots of a cup and a bit, in pixels)
    let loop = 0;
    if (kind === 'row') {
      const Hc = Math.round(h * density) * 4, g = document.createElement('canvas').getContext('2d');
      loop = Math.round((named(g, 0, Hc, false) + Hc * 0.6 + 6 * Hc * 0.95) / 4);
    }
    return ledPicture(geom, w, h, (g, Wc, Hc) => {
      if (kind === 'column') {
        const cs = Math.min(Wc * 0.95, Hc / 3.1);
        [0, 3, 5].forEach((k, i) => coffeeCup(g, Wc / 2 + cs * 0.04, Hc / 2 + (i - 1) * Hc / 3.15, cs, COFFEES[k]));
        return;
      }
      if (kind === 'row') {
        // (one round, drawn once and shown over and over as it goes by (ledPicture loop): the name with a margin
        // either side, then the six cups, one size, each in a slot of the same width)
        const pad = Hc * 0.3, block = named(g, 0, Hc, false) + 2 * pad, step = (Wc - block) / 6, cs = Math.min(Hc * 0.8, step * 1.15);
        named(g, pad, Hc);
        COFFEES.forEach((L, i) => coffeeCup(g, block + step * (i + 0.5), Hc * 0.5, cs, L));
        return;
      }
      named(g, (Wc - named(g, 0, Hc, false)) / 2, Hc);
    }, { density, screen: true, glass: true, smoked: !back, scroll: kind === 'row' ? Math.max(8, Math.round(density * h * 0.5)) : 0, loop });
  }
  // a cup of coffee for the menu at (cx, cy), size across: Google's cup (material/coffee) its edge, the inside of
  // its body filled from the foot with layers [grey, part of its height]
  function coffeeCup(g, cx, cy, size, layers) {
    const name = 'material/coffee';
    if (!icons?.[name]?.length) return;
    drawIcon(g, name, cx, cy, size, 'rgb(60,60,60)');
    const outer = icons[name].reduce((a, b) => { const ba = b.getPoints(4), aa = a.getPoints(4), area = (p) => Math.abs(THREE.ShapeUtils.area(p)); return area(ba) > area(aa) ? b : a; });
    const k = size / 512, bx = 235.7, by = 224;           // (where its body's middle is, in the icon's 512)
    g.save();
    g.translate(cx - 256 * k, cy - 256 * k); g.scale(k, k);
    g.save(); g.translate(bx, by); g.scale(0.84, 0.86); g.translate(-bx, -by);
    g.beginPath(); outer.getPoints(8).forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
    g.restore();
    g.clip(); g.beginPath(); g.rect(0, 0, 368, 512); g.clip();                  // (not its handle)
    g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
    let y = 360.5; const H = 274;
    for (const [v, f] of layers) { g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y - f * H, 512, f * H); y -= f * H; }
    g.restore();
  }
  // the ice cream of the gelato shop's ad (its cone, three scoops, the face on the top one, a cherry) for an LED panel:
  // white, its parts parted by dark lines; a border of round dots, a step dimmer (the screens' cyan), unless not
  function drawGelatoLED(g, W, H, border = true) {
    const u = Math.min(W, H / 2.1);
    g.fillStyle = '#808080';
    const step = u * 0.09, r = u * 0.028;
    if (border) {
      for (let x = step / 2 + u * 0.03; x < W - u * 0.03; x += step) for (const y of [u * 0.05, H - u * 0.05]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      for (let y = step / 2 + u * 0.08; y < H - u * 0.08; y += step) for (const x of [u * 0.05, W - u * 0.05]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    }
    // (as wide as the panel lets it be; in a tall one its cone drawn out longer, the whole in the middle)
    const cx = W / 2, S = Math.min(W * 1.75, H * 0.6), ch = S * 0.48 * THREE.MathUtils.clamp(H / W / 3.2, 1, 1.7), cw = S * 0.19;
    const base = H / 2 + (ch + S * 0.78) / 2, ctop = base - ch;
    // the cone, its waffle drawn dark into it
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx, base); g.lineTo(cx + cw, ctop); g.lineTo(cx - cw, ctop); g.closePath(); g.fill();
    g.save(); g.clip(); g.strokeStyle = '#000'; g.lineWidth = S * 0.018;
    for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(cx + k * S * 0.08 - S, ctop - S * 0.5); g.lineTo(cx + k * S * 0.08 + S, ctop + S * 1.5); g.stroke(); g.beginPath(); g.moveTo(cx + k * S * 0.08 + S, ctop - S * 0.5); g.lineTo(cx + k * S * 0.08 - S, ctop + S * 1.5); g.stroke(); }
    g.restore();
    // the scoops, bottom to top, each with a drip round its foot and a dark line under it
    let sy = ctop;
    [[S * 0.21, 0.85], [S * 0.19, 0.95], [S * 0.17, 1]].forEach(([rr, tone], i) => {
      const cy = sy - rr * 0.22;
      const path = () => {
        g.beginPath(); g.arc(cx, cy, rr, Math.PI, 0);
        for (let k = 0; k <= 12; k++) { const t = k / 12; g.lineTo(cx + rr - t * 2 * rr, cy + rr * 0.16 + rr * 0.14 * Math.abs(Math.sin(t * Math.PI * 3))); }
        g.closePath();
      };
      g.strokeStyle = '#000'; g.lineWidth = S * 0.024; path(); g.stroke();
      g.fillStyle = `rgb(${Math.round(255 * tone)},${Math.round(255 * tone)},${Math.round(255 * tone)})`; path(); g.fill();
      if (i === 2) {
        g.fillStyle = '#000';
        for (const e of [-1, 1]) { g.beginPath(); g.arc(cx + e * rr * 0.36, cy - rr * 0.12, rr * 0.1, 0, Math.PI * 2); g.fill(); }
        g.beginPath(); g.moveTo(cx - rr * 0.1, cy - rr * 0.02); g.lineTo(cx + rr * 0.1, cy - rr * 0.02); g.lineTo(cx, cy + rr * 0.08); g.closePath(); g.fill();
        g.fillStyle = '#888';
        for (const e of [-1, 1]) { g.beginPath(); g.ellipse(cx + e * rr * 0.58, cy + rr * 0.08, rr * 0.14, rr * 0.09, 0, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = S * 0.03;
        g.beginPath(); g.arc(cx + rr * 0.2, cy - rr * 1.05, rr * 0.17, 0, Math.PI * 2); g.stroke(); g.fill();
      }
      sy = cy - rr * 0.75;
    });
  }

  // A picture in the gelato shop's case as dots of light alone on its night (w x h, the geometry placed; NX dots across),
  // nothing between them: drawn grey on black (draw(ctx, width, height)), white where it is, a blush of its pink
  // where grey; how it comes in the round (P): reveal 'rise', lit row by row from its foot, a brighter line going
  // up (from at); 'chars', its characters one after another (band: [where the first begins, how wide they are all
  // together, as shares of its width; how many]), each flashing as it comes; 'none', there; bob: up and down that
  // many dots (phase); hop: hopping that many dots, over and over (phase its moment); gone dot by dot at the round's
  // end; turned with the brand's colours (brand)
  function dotPicture(geom, w, h, NX, draw, { P = 6.4, brand = -1, reveal = 'none', at = 0, band = [0, 1, 1], bob = 0, hop = 0, phase = 0, blush = true } = {}) {   // (blush false: all white)
    const NY = Math.max(1, Math.round(NX * h / w)), cv = document.createElement('canvas');
    cv.width = NX * 4; cv.height = NY * 4;
    const g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    draw(g, cv.width, cv.height);
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    const col = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uN: { value: new THREE.Vector2(NX, NY) }, uTime: shared.uTime, uP: { value: P },
        uMode: { value: { rise: 1, chars: 2 }[reveal] || 0 }, uAt: { value: at }, uBand: { value: new THREE.Vector3(...band) }, uBob: { value: bob }, uHop: { value: hop }, uPhase: { value: phase },
        uWhite: { value: col('#ffffff', 1.5) }, uPink: { value: blush ? col('#ff9cbf', 1.2) : col('#ffffff', 1.5) }, uHue: shared.uHue, uCaseAdj: shared.uCaseAdj, uIndex: { value: brand } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D uMap; uniform vec2 uN; uniform float uTime, uP, uAt, uBob, uHop, uPhase; uniform int uMode; uniform vec3 uBand, uWhite, uPink;
        uniform mat3 uHue; uniform vec3 uCaseAdj[24]; uniform int uIndex; varying vec2 vUv;
        void main() {
          vec2 led = vUv * uN, c = floor(led);
          float sh = uBob > 0.0 ? floor(sin(uTime * 1.6 + uPhase) * uBob + 0.5) : 0.0;          // (bobbing a whole dot)
          if (uHop > 0.0) { float u = fract((uTime - uPhase) / 0.55); sh = floor(uHop * 4.0 * u * (1.0 - u) + 0.5); }   // (or hopping)
          float v = texture2D(uMap, (vec2(c.x, c.y - sh) + 0.5) / uN).r;
          if (v < 0.12) discard;
          float t = mod(uTime, uP), flash = 0.0;
          if (uMode == 1) {                                  // (lit from its foot up over a second and a bit)
            float front = (t - uAt - 0.2) / 1.2 * (uN.y + 3.0);
            if (c.y > front) discard;
            flash = 1.0 - smoothstep(0.0, 3.0, front - c.y);
          } else if (uMode == 2) {                           // (a character after another)
            float i = clamp(floor(((c.x + 0.5) / uN.x - uBand.x) / uBand.y * uBand.z), 0.0, uBand.z - 1.0), lt = t - uAt - i * 0.11;
            if (lt < 0.0) discard;
            flash = 1.0 - smoothstep(0.0, 0.35, lt);
          }
          float away = smoothstep(uP - 0.6, uP - 0.15, t), hash = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5);
          if (hash < away) discard;                          // (and out again, dot by dot in no order, at the round's end)
          float aa = 1.0 - smoothstep(0.25, 0.6, max(fwidth(led.x), fwidth(led.y)));
          if (aa > 0.5 && length(fract(led) - 0.5) > 0.44) discard;
          float shimmer = 0.9 + 0.1 * sin(uTime * 2.0 - (c.x + c.y) * 0.3);
          vec3 cc = mix(uPink, uWhite, smoothstep(0.6, 0.92, v)) * shimmer;
          cc = mix(cc, uWhite * 1.4, flash);
          vec3 k = vec3(0.57735), adj = uCaseAdj[uIndex];
          cc = uHue * cc;
          cc = cc * cos(adj.x) + cross(k, cc) * sin(adj.x) + k * dot(k, cc) * (1.0 - cos(adj.x));
          cc = max(mix(vec3(dot(cc, vec3(0.299, 0.587, 0.114))), cc, adj.y), 0.0) * adj.z;
          gl_FragColor = vec4(cc, 1.0);
        }`,
    });
    const m = new THREE.Mesh(geom, mat);
    m.layers.set(LAYER.GLOW);
    return m;
  }
  // the colours the brands' cases are coloured from
  const CASE_COLORS = ['#2ec4b6', '#3a86ff', '#8a7dff', '#ff6fb5', '#3ddc97', '#ff5a5f', '#4cc9f0', '#c77dff', '#06d6a0',
    '#f7b538', '#e9e4d8', '#5a7bff', '#ff8fab', '#80ed99', '#1d6fa5', '#b5179e', '#f28482', '#a3c4f3'];
  function makeCase(w, h, x, y, z, face, B, seed, sceneKey) {
    // (the kitten store's cases each their own, by their shape, on an LED screen: its kitten's great face on a large wide one and
    // on the tallest; small faces in tiles on a tall one, and six by three on a small wide one. Its shelves of blind
    // boxes are in the station, by the café)
    const meowScene = () => (h / w > 1.9 ? 'kitten-face' : h / w > 1.2 ? 'kitten-tiles' : w > 15 ? 'kitten-face' : 'kitten-tiles-6x3');
    let key = sceneKey || B.case || 'still-life';
    if (key === 'kitten') key = meowScene();
    const scene = SCENES[key] || SCENES['still-life'], R = makeRandom(Math.floor(seed * 1e6) + 11);
    const turn = { z: 0, x: Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }[face];
    const at = (g) => g.rotateY(turn).translate(x, y - h / 2, z);
    const m = Math.min(w, h), d = scene.depth ?? THREE.MathUtils.clamp(m * 0.16, 0.25, 2.0), rim = scene.rim ?? THREE.MathUtils.clamp(m * 0.035, 0.08, 0.45);
    const PALE = [0.9, 1.25, 1.3];
    for (const g of [box(-w / 2 - rim, w / 2 + rim, -rim, 0, 0, d), box(-w / 2 - rim, w / 2 + rim, h, h + rim, 0, d),
      box(-w / 2 - rim, -w / 2, 0, h, 0, d), box(w / 2, w / 2 + rim, 0, h, 0, d)]) props(at(g), 0.3);
    glow(at(box(-w / 2, w / 2, -Math.min(rim * 0.3, 0.06), 0, d - Math.min(rim * 0.4, 0.08), d)), PALE);
    // its colours (two from a wide palette, so that neighbours differ), its back in one of several ways, a little
    // off the wall: bands from one colour to the other, one flat colour, a horizon, a great disc behind what it
    // shows, or night with stars; and how what it shows is made: cut from coloured paper, low-poly and lit as the
    // museum's dioramas, or dark against the light
    const lit = (hex, b) => { const c = new THREE.Color(hex), m = Math.max(c.r, c.g, c.b, 1e-3); return [c.r * b / m, c.g * b / m, c.b * b / m]; };
    const i1 = R.int(0, CASE_COLORS.length - 1), i2 = (i1 + R.int(3, CASE_COLORS.length - 3)) % CASE_COLORS.length;
    const c1 = CASE_COLORS[i1], c2 = CASE_COLORS[i2];
    // a cup of coffee floating on a cloud, on a screen of square pixels (scene.pixel, the island café's): the night in three
    // bands of blue behind; the cloud and the cup lit one pixel after another from the foot up, each one flashing white
    // as it comes; the cup then floating, up and down a whole pixel, steam going up out of it; the name lit from the
    // left, in pixels a third the size; then all of it gone, pixel by pixel; a round of 9 s
    // the dusk bakery's (scene.dawn): its breads, Noto Emoji's glyphs in one ink, on its pale yellow-green, the sun going
    // down (dawnStage: which by its shape)
    if (scene.dawn) {
      const m = dawnPanel(w, h, x, y, z, face, B, null);
      m.translateZ(0.065);
      caseLabels.push(m);
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // the cinema's (scene.cinema): its night's scenes on film, or by a projector's beam (cinemaLED: the one, then the
    // other, about the city; over the island café's scrolling strip, its film in the pale of the city's own tones)
    if (scene.cinema) {
      const m = cinemaLED(w, h, x, y, z, face, B, scene.cinema === 'bright' ? { mode: 'film', palette: 'bright' } : scene.cinema === true ? {} : { mode: scene.cinema });
      m.translateZ(0.065);
      caseLabels.push(m);
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // the music hall's (scene.waves): a river of sound in LED dots (concertWaves: which by its shape)
    if (scene.waves) {
      const m = concertWaves(w, h, x, y, z, face, B);
      m.translateZ(0.065);
      caseLabels.push(m);
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // the umbrella shop's (scene.umbrellaLED): umbrellas drifting up as jellyfish (umbrellaLED)
    if (scene.umbrellaLED) {
      const m = umbrellaLED(w, h, x, y, z, face, B, {});
      m.translateZ(0.065);
      caseLabels.push(m);
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // the rain-window diner's (scene.rainwin): a fogged window in the rain, the room behind it (rainWindow: which by its shape)
    if (scene.rainwin) {
      const m = rainWindow(w, h, x, y, z, face, B);
      m.translateZ(0.065);
      caseLabels.push(m);
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    if (scene.pixel) {
      caseLabels.push(pixelCafe(at(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0.06)), w, h, R, B));
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // rows going by (a scene with strips): a band of colour each, a thin ledge between; in each its things in a
    // row, the top one going left, the next right, and so on, rushing one place along each turn and slowing to a
    // stop (toon.js glowMaterial, slide), cut from paper
    // a bouquet made of dots (scene.bouquet, the florist's other): flowers each of rings of dots round a yellow heart,
    // lighting from the heart out ring by ring, each in its turn, a while open, then going out and coming again;
    // their stems gathered below, petals of dots drifting down, fireflies; the name under it all
    if (scene.bouquet) {
      const b = B, th = Math.min(h * 0.16, w * 0.13), tw = th * 3.3;
      caseLabels.push(floristBouquet(at(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0.06)), w, h, b, th * 1.6));
      caseLabels.push(inBrandColours(canvasPlane(at(new THREE.PlaneGeometry(tw, th).translate(0, th * 0.75, d * 0.6)), tw / th, true, (g, W, H) => {
        g.shadowColor = 'rgba(8, 20, 40, 0.9)'; g.shadowBlur = H * 0.12;
        g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `600 ${H * 0.56}px "PingFang SC", "Noto Sans SC", sans-serif`;
        g.fillText([...b.name].join(String.fromCharCode(8202)), W / 2, H * 0.38, W * 0.98);
        g.fillStyle = '#c8ff7a'; g.font = `600 ${H * 0.17}px "Helvetica Neue", Arial, sans-serif`;
        g.fillText((b.en || '').split('').join(String.fromCharCode(8202)), W / 2, H * 0.84, W * 0.9);
      }, 512), (b.index ?? 0)));
      return;
    }
    // the kitten store's on an LED screen (scene.ledcat: its kitten's great face; scene.tiles: small faces in tiles filling
    // it, its name in the four in the middle): meowLED
    if (scene.ledcat || scene.tiles) {
      caseLabels.push(meowLED(at(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0.06)), w, h, seed, B,
        { layout: scene.tiles ? 'tiles' : 'face', fine: scene.tiles ? 66 : 44, cols: scene.cols || 0, rows: scene.rows || 0 }));
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // shelves of blind boxes (scene.shelf, the kitten store's): a cream ground with faint polka dots; across the top its name
    // and its mark; below, shelves of boxes in soft colours, each with two cat's ears and a paw on its front; one box
    // after another its animal pops up out of it (Noto's faces: a different one each, on a white disc), a while, and
    // is gone again; a round of 9 s (toon.js glowMaterial, pop)
    if (scene.shelf) {
      const P = 9, top = y + h / 2 > 0 ? y + h / 2 : 1e4, Y = new THREE.Vector3(0, 1, 0), tall = h > w * 1.2;   // (under the ground no top: its pops kept within it)
      // (its colours as they were turned in the tuning panel, made its own: so it keeps them whatever is set there for the
      // brand's other cases; the turning as toon.js caseAdjust does it)
      const own = (c, deg = -180, sat = 0.75, light = 1.01) => {
        const a = THREE.MathUtils.degToRad(deg), k = new THREE.Vector3(1, 1, 1).normalize(), v = new THREE.Vector3(...c);
        const r = v.clone().multiplyScalar(Math.cos(a)).add(k.clone().cross(v).multiplyScalar(Math.sin(a))).add(k.clone().multiplyScalar(k.dot(v) * (1 - Math.cos(a))));
        const l = r.x * 0.299 + r.y * 0.587 + r.z * 0.114;
        return [r.x, r.y, r.z].map((q) => Math.max(0, l + (q - l) * sat) * light);
      };
      const col = (hex, k = 0.95) => own(new THREE.Color(hex).multiplyScalar(k).toArray());
      const brandOf = caseOf;
      caseOf = -1;                                                         // (and not turned again by the brand's)
      const atP = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyAxisAngle(Y, turn).add(new THREE.Vector3(x, y - h / 2, z));
      const pop = (g, hex, [px, py, pz], start, kind, amp, k) => popping(at(g), col(hex, k), [...atP(px, py, pz).toArray(), start], [kind, P, amp, top]);
      const plain = (pts, zz) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([px, py]) => new THREE.Vector2(px, py)))).translate(0, 0, zz);
      const rounded = (x0, y0, bw, bh, r, zz) => {
        const sh = new THREE.Shape(); sh.moveTo(x0 + r, y0); sh.lineTo(x0 + bw - r, y0); sh.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + r);
        sh.lineTo(x0 + bw, y0 + bh - r); sh.quadraticCurveTo(x0 + bw, y0 + bh, x0 + bw - r, y0 + bh); sh.lineTo(x0 + r, y0 + bh);
        sh.quadraticCurveTo(x0, y0 + bh, x0, y0 + bh - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
        return new THREE.ShapeGeometry(sh, 4).translate(0, 0, zz);
      };
      const INK = '#4a3420', BOXES = ['#ffb3c7', '#a8dcff', '#c9b6ff', '#b8f0c2', '#ffd6a5'];
      const ANIMALS = ['cat', 'rabbit', 'fox', 'bear', 'panda', 'frog', 'penguin', 'hamster', 'dog', 'tiger', 'koala', 'mouse', 'pig'];
      shown(at(box(-w / 2, w / 2, 0, h, 0.03, 0.06)), col('#fff1c9'));
      const m = Math.min(w, h), dotStep = m * 0.09;
      for (let yy = dotStep / 2; yy < h; yy += dotStep) for (let xx = -w / 2 + dotStep / 2 + ((yy / dotStep) % 2 < 1 ? 0 : dotStep / 2); xx < w / 2; xx += dotStep) {
        shown(at(new THREE.CircleGeometry(m * 0.012, 8).translate(xx, yy, 0.062)), col('#ffe08f'));
      }
      // its name and mark across the top (or, in a tall case, the top)
      const b = B, hh = Math.min(h * (tall ? 0.14 : 0.22), w * 0.2);
      shown(at(box(-w / 2, w / 2, h - hh, h, 0.063, 0.066)), col('#ffd166'));
      // (the mark, its name and the line under it together in the middle)
      caseLabels.push(canvasPlane(at(new THREE.PlaneGeometry(Math.min(w * 0.9, hh * 6), hh * 0.8).translate(0, h - hh / 2, d * 0.6)), Math.min(w * 0.9, hh * 6) / (hh * 0.8), true, (g, W, H) => {
        const t1 = { maxW: W - H * 1.3 }, t2 = { dots: 9, weight: 700, maxW: W - H * 1.3 }, sub = `${b.en}  ·  ${b.tagline}`;
        const tw = Math.max(dotText(null, b.name, 0, 0, H * 0.5, INK, t1), H * 0.02 + dotText(null, sub, 0, 0, H * 0.17, INK, t2));
        const x0 = Math.max(0, (W - (H * 1.15 + tw)) / 2);
        g.save(); g.translate(x0 + H * 0.55, H * 0.5); g.scale(H * 0.36, H * 0.36); g.strokeStyle = g.fillStyle = INK; g.lineCap = g.lineJoin = 'round'; (b.logo || defaultLogo(b))(g); g.restore();
        dotText(g, b.name, x0 + H * 1.15, H * 0.4, H * 0.5, INK, t1);
        dotText(g, sub, x0 + H * 1.17, H * 0.82, H * 0.17, INK, t2);
      }, 512));
      // the shelves: rows of boxes, each with its animal to come
      const rows = tall ? Math.max(3, Math.round((h - hh) / (w * 0.32))) : 2, rowH = (h - hh - m * 0.06) / rows;
      const bs = Math.min(rowH * 0.5, w * 0.16), cols = Math.max(2, Math.floor((w * 0.92) / (bs * 1.55))), step = (w * 0.92) / cols;
      // (each box its moment and its animal, shuffled: the moments spread evenly over the round, no two together)
      const N = rows * cols, order = Array.from({ length: N }, (_, i) => i), kinds = Array.from({ length: N }, (_, i) => ANIMALS[i % ANIMALS.length]);
      for (const list of [order, kinds]) for (let i = N - 1; i > 0; i--) { const j = R.int(0, i); [list[i], list[j]] = [list[j], list[i]]; }
      let n = 0;
      for (let r = 0; r < rows; r++) {
        const sy = m * 0.04 + r * rowH;                                         // (this shelf's plank)
        shown(at(box(-w / 2 + w * 0.03, w / 2 - w * 0.03, sy, sy + m * 0.018, 0.07, 0.09)), col('#d9a868', 0.9));
        for (let c = 0; c < cols; c++, n++) {
          const bx = -w * 0.46 + step * (c + 0.5), by = sy + m * 0.018, hex = BOXES[(c + r * 2) % BOXES.length];
          shown(at(rounded(bx - bs / 2, by, bs, bs * 0.82, bs * 0.08, 0.1)), col(hex));
          for (const e of [-1, 1]) shown(at(plain([[bx + e * bs * 0.42, by + bs * 0.8], [bx + e * bs * 0.1, by + bs * 0.8], [bx + e * bs * 0.3, by + bs * 1.02]], 0.1)), col(hex));
          const paw = iconShape('noto/paws', bs * 0.42);
          if (paw) shown(at(paw.translate(bx, by + bs * 0.4, 0.102)), col('#ffffff', 1));
          // its animal: up out of it on a white disc, at its own moment in the round
          const start = order[n] / N * (P - 2.2), animal = kinds[n], ay = by + bs * 1.2, piv = [bx, by + bs * 0.8, 0.13];
          pop(new THREE.CircleGeometry(bs * 0.5, 28).translate(bx, ay, 0.128), '#ffffff', piv, start, 1, 1.6, 1);
          pop(new THREE.RingGeometry(bs * 0.47, bs * 0.5, 28).translate(bx, ay, 0.129), hex, piv, start, 1, 1.6, 1);
          const head = iconShape(`noto/${animal}`, bs * 0.78);
          if (head) pop(head.translate(bx, ay, 0.131), INK, piv, start, 1, 1.6, 1);
          // a little star bursting as it comes
          pop(new THREE.CircleGeometry(bs * 0.06, 5).translate(bx + bs * 0.55, ay + bs * 0.45, 0.132), '#ffd166', [bx + bs * 0.55, ay + bs * 0.45, 0.132], start + 0.1, 1, 0.5, 1.2);
        }
      }
      if (y - h / 2 < 2.5 && y > 0) {                                     // (not down in the station)
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      caseOf = brandOf;
      return;
    }
    // a field of flowers made of dots (scene.bloom, the florist's): its whole width a field of dots, where a flower is
    // the dots grown large in its colour; a gust crossing it from the left opens them one patch after another, they
    // stay open swaying, then close again the same way; fireflies drifting over; the name in the middle, where the
    // flowers leave room for it
    if (scene.bloom) {
      const b = B, th = Math.min(h * 0.3, w * 0.13), tw = th * 3.3;
      caseLabels.push(floristField(at(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0.06)), w, h, R, b, tw * 1.1, th * 1.35));
      caseLabels.push(inBrandColours(canvasPlane(at(new THREE.PlaneGeometry(tw, th).translate(0, h / 2, d * 0.6)), tw / th, true, (g, W, H) => {
        g.shadowColor = 'rgba(8, 20, 40, 0.9)'; g.shadowBlur = H * 0.12;
        g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `600 ${H * 0.56}px "PingFang SC", "Noto Sans SC", sans-serif`;
        g.fillText([...b.name].join(String.fromCharCode(8202)), W / 2, H * 0.38, W * 0.98);
        g.fillStyle = '#c8ff7a'; g.font = `600 ${H * 0.17}px "Helvetica Neue", Arial, sans-serif`;
        g.fillText((b.en || '').split('').join(String.fromCharCode(8202)), W / 2, H * 0.84, W * 0.9);
      }, 512), (b.index ?? 0)));
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // the moon set over a river (scene.moon, the moon tea shop's: 春江花月夜, 落月摇情满江树): night going violet at its foot,
    // stars, the trees along the far bank, a tea in the Chinese way before it all with the moon laid on its cream,
    // light shaking on the water (no words: its name is over its door)
    if (scene.moon) {
      const P = 20, top = y + h / 2, Y = new THREE.Vector3(0, 1, 0);
      const u = Math.min(h, w * 1.75);   // (what its things are sized by: its height, or on a narrow one (a pylon's) what its width allows)
      const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k).toArray();
      const atP = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyAxisAngle(Y, turn).add(new THREE.Vector3(x, y - h / 2, z));
      const pop = (g, rgb, [px, py, pz], start, kind, amp) => popping(at(g), rgb, [...atP(px, py, pz).toArray(), start], [kind, P, amp, top]);
      const shape = (pts, zz) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([px, py]) => new THREE.Vector2(px, py)))).translate(0, 0, zz);
      // the sky, deep blue going violet toward the river
      {
        const N = 8, hi = col('#0b0d2e'), lo = col('#3b2a5e');
        const sky = shown(at(new THREE.PlaneGeometry(w, h, 1, N).translate(0, h / 2, 0.06)), hi), c = sky.attributes.color;
        for (let j = 0; c && j <= N; j++) for (let i = 0; i < 2; i++) c.setXYZ(j * 2 + i, ...hi.map((v, n) => v + (lo[n] - v) * Math.pow(j / N, 1.5)));
      }
      for (let k = 0; k < Math.round(w / h * 30); k++) shown(at(new THREE.OctahedronGeometry(u * R.range(0.004, 0.009), 0).translate(R.range(-w / 2, w / 2), R.range(h * 0.45, h * 0.98), 0.065)), col('#fff3d6', R.range(0.8, 1.4)));
      // the far bank, its trees
      const bank = h * 0.3, edge = bank * 0.9;                                // (edge: where the river meets the far bank)
      shown(at(new THREE.PlaneGeometry(w, bank + h * 0.04).translate(0, (bank + h * 0.04) / 2, 0.09)), col('#120f2a'));
      const trees = [];
      for (let xx = -w / 2 + u * 0.04; xx < w / 2; xx += u * R.range(0.06, 0.11)) {                      // its trees, crowded
        const r = u * R.range(0.035, 0.075), sy = R.range(0.9, 1.3), cy = bank + h * 0.04 + r * 0.6;
        trees.push([xx, r, sy, cy]);
        shown(at(new THREE.CircleGeometry(r, 9).scale(1, sy, 1).translate(xx, cy, 0.09)), col(R.pick(['#120f2a', '#17123a', '#0f0c24'])));
      }
      // a tea in the Chinese way before it all, and the moon caught in it: the cup rises out of the river (nothing of
      // it below the case), the crescent moon drifts slowly down from the sky (nothing of it above) onto its cream, at the
      // picture's golden section, right and up; the cup sinks again at the round's end and the moon is gone with it.
      // The cup: short, the tea soft, not bright, its cap of cream, the moon caught in it as a light. Under it the
      // river, its light shaking.
      // (on a narrow one the cup in the middle)
      const narrow = u < h, gx = narrow ? 0 : w * 0.118, gy = h * 0.618, cw0 = u * 0.13, cw1 = u * 0.16, cH = u * 0.46, cb = gy - u * 0.135 - cH, ez = d * 0.45, cx = gx;   // (the crescent standing up out of its cream, against the sky)
      const CREAM = col('#f5ead8', 0.95), foot = y - h / 2;
      // the river, the colour of its line along the trees there, deeper toward us; the trees and their bank in it,
      // faint and flattened, upside down; a few slow ripples across it
      {
        const N = 6, far = col('#5a4f86'), near = col('#3a3368');
        const river = shown(at(new THREE.PlaneGeometry(w, edge, 1, N).translate(0, edge / 2, 0.095)), far), c = river.attributes.color;
        for (let j = 0; c && j <= N; j++) for (let i = 0; i < 2; i++) c.setXYZ(j * 2 + i, ...far.map((v, n) => v + (near[n] - v) * Math.pow(j / N, 1.3)));
      }
      const mirrored = (yy) => edge - (yy - edge) * 0.55;
      shown(at(new THREE.PlaneGeometry(w, (bank + h * 0.04 - edge) * 0.55).translate(0, edge - (bank + h * 0.04 - edge) * 0.275, 0.0955)), col('#332c5e'));
      for (const [xx, r, sy, cy] of trees) {
        const g = new THREE.CircleGeometry(r, 9).scale(1, sy * 0.55, 1).translate(xx, mirrored(cy), 0.0955);
        shown(at(g), col('#332c5e'));
      }
      for (let k = 0; k < 7; k++) {
        const yy = edge * R.range(0.12, 0.85), ww = w * R.range(0.08, 0.22), rx = R.range(-w / 2 + ww / 2, w / 2 - ww / 2);
        pop(new THREE.PlaneGeometry(ww, h * 0.004).translate(rx, yy, 0.097), col('#7a70a8', 0.9), [rx, yy, 0.097], k * 1.3, 3, h * 0.004);
      }
      for (let k = 0; k < 8; k++) {                     // (the cup's light in the water: not on a narrow one, its numbers still drawn)
        const yy = Math.min(cb, bank) * (0.8 - k * 0.1) + h * 0.01, ww = cw1 * (1.6 - k * 0.12) * R.range(0.7, 1.1), ox = R.range(-cw1 * 0.2, cw1 * 0.2);
        if (!narrow) pop(new THREE.PlaneGeometry(ww, h * 0.01).translate(cx + ox, yy, 0.1), col('#ffe6a8', 0.9 - k * 0.07), [cx, yy, 0.1], k * 0.7, 3, h * 0.006);
      }
      const P2 = 12, rise = cb + cH + h * 0.05;   // (its round; how far the cup comes up)
      const cup = (g, rgb) => popping(at(g), rgb, [...atP(cx, cb, ez).toArray(), 0], [5, P2, rise, -foot]);
      cup(shape([[cx - cw0 - u * 0.012, cb - u * 0.012], [cx + cw0 + u * 0.012, cb - u * 0.012], [cx + cw1 + u * 0.012, cb + cH], [cx - cw1 - u * 0.012, cb + cH]], ez), col('#f5e6c8', 0.95));
      cup(shape([[cx - cw0, cb], [cx + cw0, cb], [cx + cw1 * 0.97, cb + cH * 0.78], [cx - cw1 * 0.97, cb + cH * 0.78]], ez + 0.002), col('#b5a28e', 0.85));
      cup(shape([[cx - cw1 * 0.97, cb + cH * 0.78], [cx + cw1 * 0.97, cb + cH * 0.78], [cx + cw1, cb + cH], [cx - cw1, cb + cH]], ez + 0.002), CREAM);
      cup(new THREE.CircleGeometry(cw1 * 1.02, 24, 0, Math.PI).scale(1, 0.35, 1).translate(cx, cb + cH, ez + 0.003), CREAM);
      cup(new THREE.CircleGeometry(u * 0.045, 20).translate(cx - cw1 * 0.45, cb + cH * 0.45, ez + 0.004), col('#fff1cc', 1.2));   // the moon in its cup
      // the crescent: large, the cream's own colour, turned the other way (mirrored, faces kept toward the street)
      const crescent = iconShape('material/bedtime', u * 0.26);
      if (crescent) {
        crescent.scale(-1, 1, 1);
        const ix = crescent.index.array;
        for (let k = 0; k < ix.length; k += 3) [ix[k + 1], ix[k + 2]] = [ix[k + 2], ix[k + 1]];
        crescent.rotateZ(-0.35).translate(gx, gy, ez + 0.006);
        popping(at(crescent), CREAM, [...atP(gx, gy - u * 0.12, ez + 0.006).toArray(), 0.4], [6, P2, h * 0.75, top]);
      }
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // an ice cream's opening (scene.pop, the gelato shop's), as an anime's would open: a deep violet night (dark, as the screens
    // round it are; its whites and pinks glowing on it), its ice cream as on the LED signs over its shop, in dots of
    // light, lit from its foot up, its clouds and its name in dots too (dotPicture), cups hopping to the beat, pink
    // flowers (flat,
    // Noto's blossom) popping in all over and spinning fast, slowing, gone; clouds bobbing, the name popping in
    // letter by letter, in a round hand (caseFonts.round); cut out as stickers, white round the edge; a round of
    // 6.4 s (toon.js glowMaterial, pop)
    if (scene.pop) {
      const P = 6.4, wide = w / h >= 1.2, col = (hex, k = 0.92) => new THREE.Color(hex).multiplyScalar(k).toArray();
      // the ground: the night, one deep violet
      shown(at(box(-w / 2, w / 2, 0, h, 0.03, 0.06)), col('#352862', 1));
      const tower = h / w > 2.5, S = wide ? Math.min(h * 0.7, w * 0.42) : Math.min(h * 0.55, w * (tower ? 1.15 : 0.8));   // (tower: a pylon's; its ice cream as wide as it allows)
      // the name's size; the cone and the name kept together, the two in the middle of the case: side by side in a
      // wide one (the cups under the name), the name over the cone in an upright one
      const b = B, tw = wide ? Math.min(w * 0.44, h * 1.0) : w * 0.88, th = tw * 0.36;
      const coneW = S * 0.46, gapW = h * 0.14, left = -(coneW + gapW + tw) / 2;
      const hx = wide ? left + coneW / 2 : 0, nx = wide ? left + coneW + gapW + tw / 2 : 0;
      const ct = wide ? h * 0.06 : tower ? (h - S * 1.2 - h * 0.04 - th) / 2 : Math.max(h * 0.06, (h - S * 1.2 - h * 0.04 - th) * 0.45);
      // (the ice cream's dots: its height, and where its middle is; and where the name's middle is)
      // (on a small upright one, the ice cream, the gap and the name together some way short of its height)
      const small = !wide && h < 4, gapN = h * 0.1, nameH = th * 0.77, fit = small ? Math.min(1, (h * 0.84 - gapN - nameH) / (S * 1.62 * 0.76)) : 1;
      const ph = S * 1.62 * fit, pw = ph * 0.42, dot = pw / 56, iceH = ph * 0.76;
      const foot = small ? (h - iceH - gapN - nameH) / 2 : 0;
      const iceC = wide ? h / 2 : small ? foot + iceH / 2 : ct + ph / 2;
      // clouds, bobbing, in dots (white)
      for (const [cx, cy, r, phs] of (wide ? [[-w * 0.44, h * 0.15, h * 0.08, 0], [w * 0.05, h * 0.86, h * 0.07, 1.3], [w * 0.4, h * 0.42, h * 0.06, 2.1]]
        : tower ? [[-w * 0.24, h * 0.08, w * 0.11, 0], [w * 0.26, h * 0.9, w * 0.1, 1.7], [-w * 0.22, h * 0.8, w * 0.08, 0.9]]
        : [[-w * 0.3, h * 0.12, w * 0.1, 0], [w * 0.32, h * 0.62, w * 0.08, 1.7]])) {
        const cwd = r * 3.6, chd = r * 2.4, parts = [[0, 0, 1], [-r * 0.9, -r * 0.25, 0.7], [r * 0.9, -r * 0.2, 0.75], [r * 0.35, r * 0.45, 0.65]];
        caseLabels.push(dotPicture(at(new THREE.PlaneGeometry(cwd, chd).translate(cx, cy + r * 0.05, 0.07)), cwd, chd, Math.round(cwd / dot), (g, W, H) => {
          g.fillStyle = '#ffffff';
          for (const [dx, dy, k] of parts) { g.beginPath(); g.arc(W / 2 + dx / cwd * W, H / 2 - (dy - r * 0.05) / chd * H, r * k / cwd * W, 0, 7); g.fill(); }
        }, { P, brand: (b.index ?? 0), bob: 1, phase: phs, blush: false }));
      }
      // the ice cream: as on the LED signs over its shop (drawGelatoLED), in dots of light on the night, lit row by
      // row from its foot as the round begins (gelatoDots)
      caseLabels.push(dotPicture(at(new THREE.PlaneGeometry(pw, ph).translate(hx, iceC, 0.11)), pw, ph, 56, (g, W, H) => drawGelatoLED(g, W, H, false),
        { P, brand: (b.index ?? 0), reveal: 'rise' }));
      // the cups, hopping to the beat
      // (white, in dots as the ice cream is, their parts parted by dark lines: the cup, its band, the scoop, a cherry)
      if (wide) {
        const cs = h * 0.26, by = h * 0.06, hopD = Math.max(1, Math.round(h * 0.06 / dot));
        const cw = cs * 0.9, chh = cs * 1.2 + hopD * dot, NXc = Math.round(cw / dot);
        [[nx - tw * 0.22, 0], [nx + tw * 0.22, 0.275]].forEach(([cx, start]) => {
          caseLabels.push(dotPicture(at(new THREE.PlaneGeometry(cw, chh).translate(cx, by + chh / 2, 0.12)), cw, chh, NXc, (g, W, H) => {
            const k = W / cw, X0 = W / 2, Y0 = H, L = (yy) => Y0 - yy * k;   // (from the cup's foot up, in metres)
            const poly = (pts) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(X0 + px * k, L(py)) : g.moveTo(X0 + px * k, L(py)))); g.closePath(); };
            const ring = (px, py, r) => { g.beginPath(); g.arc(X0 + px * k, L(py), r * k, 0, 7); };
            g.fillStyle = '#ffffff'; g.strokeStyle = '#000000'; g.lineWidth = 2 * W / NXc;              // (dark lines two dots wide)
            ring(0, cs * 0.66, cs * 0.36); g.fill();                                                    // the scoop
            poly([[-cs * 0.4, cs * 0.6], [cs * 0.4, cs * 0.6], [cs * 0.26, 0], [-cs * 0.26, 0]]); g.fill(); g.stroke();   // the cup over it
            g.beginPath(); g.moveTo(X0 - cs * 0.4 * k, L(cs * 0.36)); g.lineTo(X0 + cs * 0.4 * k, L(cs * 0.36)); g.stroke();   // its band
            ring(cs * 0.1, cs * 1.04, cs * 0.12); g.fill(); g.stroke();                                // the cherry
          }, { P, brand: (b.index ?? 0), hop: hopD, phase: start, blush: false }));
        });
      }
      // (the numbers the hearts, stars and sparkles once drew, still drawn: its flowers have their own)
      for (let k = 0; k < (wide ? 14 : 9) * 5; k++) R.next();
      // the name, popping in
      const ny = wide ? h * 0.66 : small ? foot + iceH + gapN + nameH / 2 : Math.min(h - th / 2 - h * 0.04, ct + S * 1.2 + h * 0.04 + th / 2);
      // pink flowers (the colour of its lowest scoop; flat, Noto's blossom) popping in all over it, each its own size,
      // moment and way round, spinning fast and slowing to a stop, gone; none over the cone, the cups or the name
      // (emojiStage, spin)
      {
        const RF = makeRandom(Math.floor(seed * 1e6) + 2024), flowers = [], cs = h * 0.26;
        const keep = [[hx - S * 0.4, hx + S * 0.4, iceC - iceH * 0.55, iceC + iceH * 0.55], [nx - tw / 2, nx + tw / 2, ny - th / 2, ny + th / 2]];
        if (wide) keep.push([nx - tw * 0.22 - cs * 0.5, nx + tw * 0.22 + cs * 0.5, 0, h * 0.06 + cs * 1.15]);
        for (let tries = 0; flowers.length < (wide ? 22 : 18) && tries < 600; tries++) {
          const fs = m * RF.range(0.07, 0.15), px = RF.range(-w / 2 + fs * 0.5, w / 2 - fs * 0.5), py = RF.range(fs * 0.5, h - fs * 0.5);
          if (keep.some(([x0, x1, y0, y1]) => px + fs * 0.45 > x0 && px - fs * 0.45 < x1 && py + fs * 0.45 > y0 && py - fs * 0.45 < y1)) continue;
          if (flowers.some((f) => Math.hypot(f.x - px, f.y + f.s / 2 - py) < (f.s + fs) * 0.42)) continue;
          const hold = RF.range(0.5, 1.4), t0 = RF.range(0, P - hold - 0.9);
          flowers.push({ pic: solidGlyph('blossom', '#ff9cbf', 1), x: px, y: py - fs / 2, s: fs, kind: 9, t0, amp: hold + 0.5, per: RF.range(0.9, 1.6) * (RF.next() < 0.5 ? -1 : 1) });
        }
        const fm = emojiStage(flowers, { P, clip: [-w / 2, w / 2, 0, h], brand: (b.index ?? 0) });
        fm.rotation.y = turn; fm.position.set(x, y - h / 2, z); fm.translateZ(0.13);
        caseLabels.push(fm);
      }
      // (its name in dots, a character after another, in its round hand; its English under it as it was)
      caseLabels.push(popName(at(new THREE.PlaneGeometry(tw, th).translate(nx, ny, d * 0.9)), b.name, b.en, tw / th, P, 1.1, caseFonts.round, false));
      {
        const n = [...b.name].length, nh = th * 0.6, cellN = 0.8 * 1.08 * nh / tw, x0N = (1 - n * cellN) / 2;
        caseLabels.push(dotPicture(at(new THREE.PlaneGeometry(tw, nh).translate(nx, ny + th * 0.12, d * 0.9)), tw, nh, Math.round(tw / (dot * 0.8)), (g, W, H) => {
          g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `400 ${H * 0.8}px ${caseFonts.round}`;
          [...b.name].forEach((ch, i) => g.fillText(ch, (x0N + (i + 0.5) * cellN) * W, H * 0.52));
        }, { P, brand: (b.index ?? 0), reveal: 'chars', at: 1.1, band: [x0N, n * cellN, n], blush: false }));
      }
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    // the tide, seen from above (scene.tide): a coastal town at night on the left, its beach, the sea coming in over
    // the sand and going out again (toon.js glowMaterial, tide); as the water rises the town's lights come on one
    // by one, and sparks in the shallows, and go out as it falls; a breakwater with its turbines across the bay;
    // the brand's mark and name in the sea, bottom right
    if (scene.tide) {
      const dir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
      const p0 = new THREE.Vector3(-w / 2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn).add(new THREE.Vector3(x, 0, z));
      const clip = [p0.x, p0.z, dir.x, dir.z], clip2 = [w, y - h / 2, y + h / 2, 0];
      const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k).toArray();
      const curve = (yy) => h * (0.035 * Math.sin((yy / h) * 7 + 1) + 0.02 * Math.sin((yy / h) * 13));
      const xl = -w * 0.16, xh = -w * 0.08, xlow = w * 0.16, amp = xlow - xh, far = w / 2 + amp + 0.1;
      // a band from a wavy left edge (x0 + the shore's curve) to x1, as a flat shape at depth zz
      const band = (x0, x1, zz, wob = 1) => {
        const pts = [];
        for (let k = 0; k <= 24; k++) { const yy = (k / 24) * h; pts.push(new THREE.Vector2(x0 + curve(yy) * wob, yy)); }
        pts.push(new THREE.Vector2(x1, h), new THREE.Vector2(x1, 0));
        return new THREE.ShapeGeometry(new THREE.Shape(pts.reverse())).translate(0, 0, zz);
      };
      // the land, its blocks between streets
      shown(at(box(-w / 2, w / 2, 0, h, 0.03, 0.06)), col('#1e4745'));
      const bs = h * 0.07, gap = h * 0.018;
      for (let by = gap; by < h - bs * 0.5; by += bs + gap) {
        for (let bx = -w / 2 + gap; bx < xl - bs * 0.6; bx += bs + gap) {
          if (bx + bs > xl + curve(by) * 0.8 - gap) continue;
          shown(at(box(bx, bx + bs, by, Math.min(by + bs, h - gap), 0.062, 0.063)), col(R.pick(['#163634', '#1a3c3b', '#133230'])));
        }
      }
      // the beach: dry sand, then the sand the tide wets
      shown(at(band(xl, w / 2, 0.064, 0.8)), col('#cdbb94', 0.85));
      shown(at(band(xh, w / 2, 0.066)), col('#9e977f', 0.85));
      // the sea, layer on layer out to the deep, a line of foam at its edge: each a little behind the one before
      for (const [dx, hex, k, zz, lag] of [[-w * 0.012, '#eafcff', 1.1, 0.068, -0.12], [0, '#5fd6c8', 0.9, 0.069, 0], [w * 0.1, '#2a9bb5', 0.85, 0.07, 0.15], [w * 0.24, '#14557e', 0.9, 0.071, 0.3]]) {
        tidal(at(band(xlow + dx, far, zz)), col(hex, k), [0, 0, amp, lag], clip, clip2);
      }
      // sparks in the shallows, carried with them, lit as the water rises
      const A = (w * h) / (m * m);                                             // (its area, as so many squares of its short side)
      for (let k = 0; k < Math.round(A * 40); k++) {
        const sx = R.range(xlow + w * 0.02, w * 0.42), sy = R.range(h * 0.04, h * 0.96);
        tidal(at(new THREE.CircleGeometry(m * R.range(0.006, 0.012), 6).translate(sx + curve(sy) * 0.6, sy, 0.075)), col('#bffcff', 1.7), [1, R.range(0.45, 0.95), amp, 0.05], clip, clip2);
      }
      // the breakwater across the bay, its turbines lit while the tide runs
      const wy = h * 0.72, wx1 = w * 0.3;
      shown(at(box(xl + curve(wy) * 0.8, wx1, wy - h * 0.014, wy + h * 0.014, 0.08, 0.082)), col('#b9c2c8', 0.8));
      for (let k = 0; k < 4; k++) {
        const tx = xh + (k + 0.5) * (wx1 - xh) / 4;
        shown(at(box(tx - h * 0.025, tx + h * 0.025, wy - h * 0.025, wy + h * 0.025, 0.083, 0.084)), col('#5d6b75'));
        tidal(at(new THREE.CircleGeometry(h * 0.012, 8).translate(tx, wy, 0.086)), col('#3cffc8', 1.5), [1, 0.1 + k * 0.08, 0, 0], clip, clip2);
      }
      // the town's lights: along its streets and in its windows, warm and mint, each with its own mark
      for (let k = 0; k < Math.round(A * 70); k++) {
        const ly = R.range(h * 0.03, h * 0.97), lx = R.range(-w / 2 + h * 0.02, xl + curve(ly) * 0.8 - h * 0.03);
        tidal(at(new THREE.CircleGeometry(m * R.range(0.005, 0.01), 6).translate(lx, ly, 0.07)), R.chance(0.7) ? col('#ffd27a', 1.6) : col('#3cffc8', 1.4), [1, R.range(0.15, 0.9), 0, 0], clip, clip2);
      }
      // the brand's mark (game-icons' high tide) and its name, in the sea at the bottom right
      const b = B, lh = m * 0.13, tw = m * 0.42, th = m * 0.13;
      const mx = w / 2 - m * 0.06 - tw - lh * 0.6, my = m * 0.1;
      const mark = iconShape('high-tide', lh);
      if (mark) shown(at(mark.translate(mx, my, d * 0.6)), col('#3cffc8', 1.3));
      caseLabels.push(canvasPlane(at(new THREE.PlaneGeometry(tw, th).translate(w / 2 - m * 0.06 - tw / 2, my, d * 0.6)), tw / th, true, (g, W, H) => {
        g.fillStyle = '#eafcff'; g.textBaseline = 'middle';
        g.font = `600 ${H * 0.5}px "PingFang SC", "Noto Sans SC", sans-serif`;
        g.fillText(b.name, 0, H * 0.34, W);
        g.fillStyle = '#9ff5e0'; g.font = `500 ${H * 0.2}px "PingFang SC", sans-serif`;
        g.fillText((b.en || '').split('').join(String.fromCharCode(8202)), 0, H * 0.82, W);
      }, 512));
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    if (scene.strips) {
      const n = scene.oneRow ? 1 : (scene.iconRows || scene.strips).length, bandH = h / n, ground = lit('#f7c548', 0.95), INK = [0.06, 0.05, 0.1];
      const dir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
      const p0 = new THREE.Vector3(-w / 2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn).add(new THREE.Vector3(x, 0, z));
      shown(at(box(-w / 2, w / 2, 0, h, 0.03, 0.06)), ground);
      // (its rows as icons, if they were loaded: each one's shapes, the 512 square of its file made 1 high, y up)
      const iconRow = (name) => (P) => {
        const g = new THREE.ShapeGeometry(icons[name], 6).scale(1 / 512, -1 / 512, 1), ix = g.index.array;
        for (let k = 0; k < ix.length; k += 3) [ix[k + 1], ix[k + 2]] = [ix[k + 2], ix[k + 1]];   // (facing out again)
        g.index.needsUpdate = true;
        P.solid(g);
      };
      const kinds = icons && scene.iconRows?.every((name) => icons[name]?.length) ? scene.iconRows.map(iconRow) : scene.strips;
      // (one row: each of its things in turn along it)
      const rows = scene.oneRow ? [kinds] : kinds.map((row) => [row]);
      rows.forEach((row, i) => {
        const yb = h - (i + 1) * bandH;
        const S = bandH * (scene.single ? 0.7 : 0.78), count = scene.single ? 1 : Math.max(2, Math.round(w / (S * 1.3))), step = w / count;
        // the middle row: the brand's name held still in its middle, over the places there (the cakes pass
        // behind it, and stop either side of it)
        if (i === (scene.oneRow ? 0 : 1) && scene.named !== false) {
          const lw = (count % 2 ? 3 : 2) * step * 0.94, lh = bandH * 0.8, b = B;
          caseLabels.push(nameplate(at(new THREE.PlaneGeometry(lw, lh).translate(0, yb + bandH / 2, Math.max(d * 0.85, 0.11))), b.name, b.en, lw / lh));
        }
        // each turn (6.4 s) a row sets off, three places along in two seconds, and rests
        const way = [p0.x, p0.z, dir.x, dir.z], along = (uc) => [w, uc, scene.single ? 0 : (i % 2 ? 1 : -1) * step * 3, 6.4];
        // the cake once, to find its middle: each one set with its middle on the row's
        const all = row.map((thing) => {
          const parts = [];
          thing({ solid: (g) => parts.push([g, INK]), cut: (g) => parts.push([g, ground]), light: (g, rgb) => parts.push([g, rgb]) });
          const bb = new THREE.Box3();
          for (const [g] of parts) { g.computeBoundingBox(); bb.union(g.boundingBox); }
          return [parts, (bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2];
        });
        for (let k = 0; k < (scene.single ? 1 : count * 2); k++) {
          const uc = scene.single ? w / 2 : -w + (k + 0.5) * step, [parts, mx, my] = all[k % all.length];
          for (const [g, rgb] of parts) {
            sliding(at(g.clone().translate(-mx, -my, 0).scale(S, S, 1).translate(-w / 2 + uc, yb + bandH / 2, Math.max(d * 0.5, 0.08))), rgb, way, along(uc));
          }
        }
        for (const [parts] of all) for (const [g] of parts) g.dispose();
      });
      if (y - h / 2 < 2.5) {
        const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
        g.computeBoundingBox();
        boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
        g.dispose();
      }
      return;
    }
    const back = R.pick(['bands', 'bands', 'flat', 'split', 'split', 'disc', 'disc', 'night']);
    const make = back === 'night' ? 'paper' : R.pick(['paper', 'paper', 'lowpoly', 'lowpoly', 'shadow']);
    const backBox = (y0b, y1b, rgb) => shown(at(box(-w / 2, w / 2, y0b, y1b, 0.03, 0.06)), rgb);
    if (back === 'bands') {
      const a = new THREE.Color(...lit(c1, 1)), b = new THREE.Color(...lit(c2, 0.85));
      for (let i = 0; i < 4; i++) backBox(h * i / 4, h * (i + 1) / 4, a.clone().lerp(b, i / 3).toArray());
    } else if (back === 'split') {
      const k = R.range(0.28, 0.42);
      backBox(0, h * k, lit(c2, 0.8));
      backBox(h * k, h, lit(c1, 0.95));
    } else if (back === 'night') {
      backBox(0, h, [0.04, 0.06, 0.13]);
      for (let k = 0; k < 14; k++) shown(at(new THREE.OctahedronGeometry(m * 0.008, 0).translate(R.range(-w / 2, w / 2), R.range(h * 0.2, h), 0.08)), [1.5, 1.5, 1.6]);
    } else backBox(0, h, lit(c1, 0.95));
    const discAt = back === 'disc';
    // what stands in it: the unit frame of ads/scenes.js made S high (and squeezed through, a relief) at (cx, cy)
    const thing = (role, cx, cy, S) => {
      const sz = Math.min(S, d * 0.7), fit = (g) => at(g.scale(S, S, sz).translate(cx, cy, d * 0.5));
      if (discAt) shown(at(new THREE.CircleGeometry(S * 0.55, 10).translate(cx, cy + S * 0.5, 0.065)), lit(c2, 1.0));
      let part = 0;
      role({
        solid: (g, hex, al = 0.85) => {
          part++;
          if (make === 'lowpoly') {
            const f = fit(g.index ? g.toNonIndexed() : g);
            f.computeVertexNormals();
            caseIn.add(f, { aAlbedo: al });
          } else if (make === 'shadow') shown(fit(g), [0.05, 0.05, 0.09]);
          else shown(fit(g), lit(hex, 0.82 - (part % 3) * 0.07));
        },
        light: (g, rgb) => shown(fit(g), rgb),
      });
    };
    const ledge = (yy) => props(at(box(-w / 2, w / 2, yy - m * 0.025, yy, 0.06, d * 0.92)), 0.3);
    const y0 = m * 0.05, A = w / h;
    ledge(y0);
    if (A >= 1.6) {                                                             // a banner: the hero on the left, the small things beside it
      const S = h * 0.78, hx = -w / 2 + S * 0.62, s2 = h * 0.5;
      thing(scene.hero, hx, y0, S);
      for (let cx = hx + S * 0.62 + s2 * 0.6; cx < w / 2 - s2 * 0.55; cx += s2 * 1.4) thing(scene.small, cx, y0, s2);
    } else if (A <= 0.8) {                                                      // a tall strip: the hero, small things on shelves below
      const S = w * 0.8, hy = h - S * 1.1, s2 = w * 0.55;
      if (hy - s2 * 1.3 > y0 - 1e-3) {
        thing(scene.hero, 0, hy, S);
        for (let yy = hy - s2 * 1.3; yy > y0 - 1e-3; yy -= s2 * 1.3) { ledge(yy); thing(scene.small, 0, yy, s2); }
      } else {                                                                  // (no room for them: the hero raised on a shelf of its own)
        const yh = Math.max(y0, (h - S) * 0.45);
        if (yh > y0 + 0.01) ledge(yh);
        thing(scene.hero, 0, yh, S);
      }
    } else {                                                                    // a poster: the hero in the middle, small things either side
      const S = m * 0.66, s2 = m * 0.34;
      thing(scene.hero, 0, y0, S);
      if (w > S + s2 * 2.3) for (const e of [-1, 1]) thing(scene.small, e * (S * 0.5 + s2 * 0.75), y0, s2);
    }
    // what drifts in its air
    const air = AIR[scene.air];
    if (air) {
      const n = THREE.MathUtils.clamp(Math.round(Math.max(A, 1 / A) * (air.few ? 3 : 6)), 4, 28);
      for (let k = 0; k < n; k++) {
        const r = air.size * m * R.range(0.7, 1.3), px = R.range(-w / 2 + r * 2, w / 2 - r * 2), py = R.range(h * 0.3, h * 0.95), pz = R.range(0.15, 0.6) * d;
        const g = air.shape === 'wisp' ? new THREE.SphereGeometry(r, 8, 5).scale(0.4, 3, 0.4)
          : air.shape === 'streak' ? new THREE.BoxGeometry(r * 0.15, r * 3, r * 0.15)
          : air.shape === 'ring' ? new THREE.TorusGeometry(r, r * 0.18, 4, 12)
          : air.shape === 'star' ? new THREE.OctahedronGeometry(r, 0) : new THREE.IcosahedronGeometry(r, 0);
        const c = at(g.translate(px, py, pz)), mid = new THREE.Vector3();
        c.computeBoundingBox(); c.boundingBox.getCenter(mid);
        drifting(c, air.rgb, mid.toArray(), R.next());
      }
    }
    // low enough to walk into: in the way
    if (y - h / 2 < 2.5) {
      const g = at(box(-w / 2 - rim, w / 2 + rim, 0, 0.1, 0, d));
      g.computeBoundingBox();
      boxCollider(g.boundingBox.min.x, g.boundingBox.max.x, g.boundingBox.min.z, g.boundingBox.max.z);
      g.dispose();
    }
  }

  // a brand's ad as a case (see above); scene: one of SCENES, else the brand's (B.case), else a still life
  function brandCase(cw, ch, x, y, z, face, B, seed, scene = null) {
    B = { en: '', tagline: '', ...B };
    caseOf = B.index ?? -1;
    try { return makeCase(cw, ch, x, y, z, face, B, seed, scene); } finally { caseOf = -1; }
  }
  return { brandCase, cafeSign, cafeBoard, floristSign, dotFlower, dawnPanel, dawnStage, rainWindow, starTicker, starBlade,
    floatIsland, islandLamp, emojiStage, duskPic, solidGlyph, floristField, floristBouquet, pixelCafe, dotPicture };
}
