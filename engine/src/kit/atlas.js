// The words and logos on the signs, screens and floating signs, drawn once into one texture, white on black;
// the shaders colour them. Laid out from what the district asks for:
//   vertical    words down blade signs (a strip each)
//   single      single characters, for the giant glyph screens
//   horizontal  words across: canopy signs, tickers, floating signs, shop names
//   offices     the names of office towers, over their doors (drawn with the horizontal words)
//   brands      each brand's logo, its name across and down, its tagline (kit/catalog.js makes its ads)
// rects: v, single, h (arrays in the order given), brands ({ key: { logo, name, tag, nameV } }); and by text:
// atlas.h('咖啡 CAFÉ'), atlas.v('书店'). Each rect is cut to what is in it, so its proportions are its content's.

import * as THREE from 'three';

// The fonts one may choose (tuning.fonts): a label, the CSS family, and whether it comes from Google Fonts
// (index.html loads those; they are fetched for the characters used before drawing).
export const FONTS = {
  '苹方': { css: '"PingFang SC"' },
  '思源黑体': { css: '"Noto Sans SC"', web: true },
  '思源宋体': { css: '"Noto Serif SC"', web: true },
  '冬青黑体': { css: '"Hiragino Sans GB"' },
  '站酷庆科黄油体': { css: '"ZCOOL QingKe HuangYou"', web: true },
  '站酷快乐体': { css: '"ZCOOL KuaiLe"', web: true },
  '站酷小薇': { css: '"ZCOOL XiaoWei"', web: true },
  '马善政毛笔': { css: '"Ma Shan Zheng"', web: true },
};
const fallback = '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", sans-serif';
export const family = (label) => `${(FONTS[label] || FONTS['苹方']).css}, ${fallback}`;
// a font chosen by its label, ready to draw text (a web font fetched first for those characters)
export async function fontFamily(label, text) {
  if (FONTS[label]?.web) await document.fonts.load(`600 80px ${FONTS[label].css}`, text).catch(() => {});
  return family(label);
}

// a brand's logo when it draws none of its own: the first character of its name in a ring
export function defaultLogo(brand) {
  return (c) => {
    c.lineWidth = 0.1;
    c.beginPath(); c.arc(0, 0, 0.86, 0, Math.PI * 2); c.stroke();
    c.font = `700 1.05px ${fallback}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText([...brand.name][0] || '?', 0, 0.06);
  };
}

const S = 2048;

// what: { vertical, single, horizontal, brands }; fonts: { signs, brands } (labels of FONTS)
export async function buildAtlas({ vertical = [], single = [], horizontal: words = [], offices = [], brands = [] } = {}, fonts = {}) {
  const horizontal = [...words, ...offices.filter((o) => !words.includes(o))];
  const F = { signs: family(fonts.signs), brands: family(fonts.brands) };
  const all = [...vertical, ...single, ...horizontal, ...brands.flatMap((b) => [b.name, b.en || '', b.vertical || b.name, b.tagline || ''])].join('');
  await Promise.all(Object.values(fonts).filter((l) => FONTS[l]?.web).map((l) => document.fonts.load(`600 80px ${FONTS[l].css}`, all).catch(() => {})));
  // the layout: bands one under another
  const strips = [...vertical, ...single];
  const rowsV = Math.ceil(strips.length / 16), rowsH = Math.ceil(horizontal.length / 2);
  const nb = brands.length, rowsLogo = Math.ceil(nb / 8), rowsName = Math.ceil(nb / 2), rowsTag = Math.ceil(nb / 2), rowsNameV = Math.ceil(nb / 16);
  const top = {};
  let y = 0;
  top.v = y; y += rowsV * 1024;
  top.h = y; y += rowsH * 128;
  top.logo = y; y += rowsLogo * 256;
  top.name = y; y += rowsName * 128;
  top.tag = y; y += rowsTag * 64;
  top.nameV = y; y += rowsNameV * 384;
  const SH = Math.max(64, y);
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = SH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, SH);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const rect = (x, yy, w, h) => new THREE.Vector4(x / S, 1 - (yy + h) / SH, (x + w) / S, 1 - yy / SH);
  const rects = { v: [], single: [], h: [], brands: {} };

  strips.forEach((text, i) => {
    const x = (i % 16) * 128, yy = top.v + Math.floor(i / 16) * 1024, chars = [...text];
    const size = Math.min(116, 980 / chars.length);
    ctx.font = `600 ${size}px ${F.signs}`;
    const tall = chars.length * size * 1.04, t0 = yy + 512 - tall / 2;
    chars.forEach((ch, k) => ctx.fillText(ch, x + 64, t0 + (k + 0.5) * size * 1.04));
    (i < vertical.length ? rects.v : rects.single).push(rect(x, Math.max(yy, t0 - 14), 128, Math.min(1024, tall + 28)));
  });
  // one line of text centred in a w x h cell, cut to its width
  const line = (text, x, yy, w, h, px, font) => {
    ctx.font = `600 ${px}px ${font}`;
    const tw = ctx.measureText(text).width, fit = w - 40;
    ctx.save();
    ctx.translate(x + w / 2, yy + h / 2 + px * 0.04);
    if (tw > fit) ctx.scale(fit / tw, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    const used = Math.min(tw, fit) + 32;
    return rect(x + w / 2 - used / 2, yy, used, h);
  };
  horizontal.forEach((text, j) => rects.h.push(line(text, (j % 2) * 1024, top.h + Math.floor(j / 2) * 128, 1024, 128, 92, F.signs)));
  brands.forEach((b, i) => {
    const r = {};
    const lx = (i % 8) * 256, ly = top.logo + Math.floor(i / 8) * 256;
    ctx.save();
    ctx.translate(lx + 128, ly + 128); ctx.scale(104, 104);
    ctx.strokeStyle = ctx.fillStyle = '#fff'; ctx.lineCap = ctx.lineJoin = 'round';
    (b.logo || defaultLogo(b))(ctx);
    ctx.restore();
    r.logo = rect(lx + 12, ly + 12, 232, 232);
    r.name = line(`${b.name}${b.en ? ` ${b.en}` : ''}`, (i % 2) * 1024, top.name + Math.floor(i / 2) * 128, 1024, 128, 88, F.brands);
    r.tag = line(b.tagline || '', (i % 2) * 1024, top.tag + Math.floor(i / 2) * 64, 1024, 64, 46, F.brands);
    const chars = [...(b.vertical || b.name)], vx = (i % 16) * 128, vy = top.nameV + Math.floor(i / 16) * 384, size = Math.min(110, 370 / chars.length);
    ctx.font = `600 ${size}px ${F.brands}`;
    const tall = chars.length * size * 1.04, t0 = vy + 192 - tall / 2;
    chars.forEach((ch, k) => ctx.fillText(ch, vx + 64, t0 + (k + 0.5) * size * 1.04));
    r.nameV = rect(vx, t0 - 10, 128, tall + 20);
    rects.brands[b.key] = r;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  const byText = (list, words) => (text) => { const i = words.indexOf(text); return i >= 0 ? list[i] : null; };
  return { texture, rects, fonts: F, h: byText(rects.h, horizontal), v: byText(rects.v, vertical), words: { vertical, single, horizontal: words, offices } };
}
