// The ad catalog: everything the city's screens can show. An ad is a template (how it is drawn: a shader program
// in core/screens.js and core/vfx.js) with its own settings (its speed, its own colour for a poster in its own colours, its brand).
// The motion graphics come with the kit; each of the district's brands gets an ad of its own (its logo, name and
// tagline laid out for the screen's shape, the name sweeping in). Screens are placed by an entry's place here.

import * as THREE from 'three';
import { PROG } from '../core/screens.js';

export const PROGRAM_ADS = [
  { key: 'glyph-rain', name: '字符雨', tpl: PROG.GLYPHS, speed: 1, color: '#3ee07a' },
  { key: 'pulse-rings', name: '脉冲圆环', tpl: PROG.RINGS, speed: 1, color: '#ff4fa0' },
  { key: 'equalizer', name: '均衡器', tpl: PROG.BARS, speed: 1, color: '#ffb340' },
  { key: 'sign-word', name: '招牌文字', tpl: PROG.TEXT, speed: 1, color: '#ffc98a' },
  { key: 'rings-2', name: '圆环', tpl: PROG.CAT, speed: 1, color: '#33d6ff' },
  { key: 'neon-horizon', name: '网格地平线', tpl: PROG.HORIZON, speed: 1, color: '#c050ff' },
  { key: 'giant-glyph', name: '巨字', tpl: PROG.GLYPH, speed: 1, color: '#ff5a4a' },
  { key: 'oscilloscope', name: '示波器', tpl: PROG.WAVES, speed: 1, color: '#40ffd0' },
  { key: 'ticker', name: '滚动字幕', tpl: PROG.TICKER, speed: 1, color: '#ffd040' },
  { key: 'ribbons', name: '光带', tpl: PROG.RIBBONS, speed: 1, color: '#ff6ad5' },
  { key: 'liquid-blobs', name: '液态光团', tpl: PROG.BLOBS, speed: 1, color: '#5a7bff' },
  { key: 'hex-tunnel', name: '六边形隧道', tpl: PROG.TUNNEL, speed: 0.2, color: '#9b5bff' },
  { key: 'interference', name: '波纹干涉', tpl: PROG.INTERFERENCE, speed: 1, color: '#30d8ff' },
  { key: 'vortex', name: '粒子漩涡', tpl: PROG.VORTEX, speed: 1, color: '#8a7dff' },
  { key: 'cells', name: '发光细胞', tpl: PROG.CELLS, speed: 1, color: '#5cff9d' },
];

// atlas: from kit/atlas.js (with the brands drawn in it); brands: the district's
export function buildCatalog(atlas, brands = []) {
  const ads = [
    ...PROGRAM_ADS,
    ...brands.map((b) => ({ key: `brand-${b.key}`, name: `${b.name}（品牌）`, tpl: PROG.BRAND, speed: 1, brand: b.key, color: b.color })),
  ];
  const size = Math.max(16, ads.length);
  const v4 = () => Array.from({ length: size }, () => new THREE.Vector4());
  const uniforms = {
    uAdTpl: { value: new Float32Array(size) },
    uAdSpeed: { value: new Float32Array(size).fill(1) },
    uAdLogo: { value: v4() }, uAdName: { value: v4() }, uAdTag: { value: v4() }, uAdNameV: { value: v4() },
    uAdColor: { value: Array.from({ length: size }, () => new THREE.Vector3(0.2, 0.8, 0.9)) },
  };
  const c = new THREE.Color();
  ads.forEach((a, i) => {
    uniforms.uAdTpl.value[i] = a.tpl;
    uniforms.uAdSpeed.value[i] = a.speed;
    if (a.color) { c.set(a.color); const m = Math.max(c.r, c.g, c.b, 1e-3); uniforms.uAdColor.value[i].set(c.r / m, c.g / m, c.b / m); }
    const r = a.brand && atlas.rects.brands[a.brand];
    if (r) {
      uniforms.uAdLogo.value[i].copy(r.logo);
      uniforms.uAdName.value[i].copy(r.name);
      uniforms.uAdTag.value[i].copy(r.tag);
      uniforms.uAdNameV.value[i].copy(r.nameV);
    }
  });
  const brandAds = ads.map((a, i) => (a.brand ? i : -1)).filter((i) => i >= 0);
  return {
    ads, brands, uniforms, size, brandAds,
    // the plain ad of a program (what a screen given only a program shows)
    adOf: (tpl) => Math.max(0, ads.findIndex((a) => a.tpl === tpl)),
    // a brand's own ad
    brandAd: (key) => ads.findIndex((a) => a.brand === key),
  };
}
