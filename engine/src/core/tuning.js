// The adjustable look: the tones and their colours, the moon, the air, the rain, the glass, the wet street,
// the screens, the final grade. tuning.json in the project holds the values everyone sees (without it, the
// defaults below). The dev version (dev.html, served by serve.py) adds a panel; its changes are kept in the
// browser and written back to tuning.json.

import * as THREE from 'three';
import { shared, PALETTE } from './toon.js';

const LS_KEY = 'night-rain-city.tuning';

export const TUNING_DEFAULTS = {
  hue: { shift: 0, saturation: 1 },  // the whole family of colours turned and (de)saturated together
  tones: { edge1: 0.17, edge2: 0.45, soft: 0.012, streetLift: 0.5 },
  palette: { deep: PALETTE.deep, mid: PALETTE.mid, lit: PALETTE.lit, litTint: PALETTE.litTint, shade2: PALETTE.shade2 },
  moon: { elevation: 24.8, azimuth: 199.2, strength: 0.75 },
  air: { fog: PALETTE.fog, haze: PALETTE.haze, density: 0.0042, zenith: '#040d16' },
  rain: {
    brightness: 1.25, litAlpha: 0.9, midAlpha: 0.24, darkAlpha: 0.06, midAt: 0.38, litAt: 0.74,
    length: 1, speed: 10.5, wind: 0, reach: 95,
    lit: '#e6f2f2', mid: '#5fbcd0', dark: '#2a5c70',
  },
  glass: { reflect: 1, rooms: 1 },
  indoor: { light: 0.34 },             // underground halls' general lighting
  fonts: { signs: '苹方', brands: '苹方' },   // see kit/atlas.js FONTS; applied on the next load
  street: { wet: 1, reflLo: 0.3, reflHi: 0.8 },
  // the LED screens' colours (dark, mid, hot); style 'led' or flat 'poster's, own and bright for the posters
  screens: { dark: PALETTE.scrDark, mid: PALETTE.scrMid, hot: 2.3, style: 'led', own: true, bright: 0.9 },
  // each brand's colours as its signs and ads show them, by its key in the district's brands: hue (degrees
  // turned), saturation and lightness (1 = as made)
  caseColors: {},
  // each ad's speed (1 = as made), by its key in the catalog (kit/catalog.js)
  ads: {},
  post: { bloom: 0.42, bloomRadius: 0.45, bloomThreshold: 1, bloomFloor: 0.1, outline: 0.75, outlineColor: '#030c14', vignette: 0.55, grain: 0.025 },
};

// local = false (the normal page): only the file; the dev version also takes newer changes kept in the browser.
export async function loadTuning({ local = false } = {}) {
  const t = structuredClone(TUNING_DEFAULTS);
  const mergeIn = (src) => {
    for (const group of Object.keys(t)) if (src?.[group]) Object.assign(t[group], src[group]);
  };
  let fromFile = null;
  try {
    const r = await fetch('tuning.json', { cache: 'no-store' });
    if (r.ok) fromFile = await r.json();
  } catch { /* no file: the defaults */ }
  mergeIn(fromFile);
  if (local) {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (saved && (!fromFile || (saved.savedAt || 0) > (fromFile.savedAt || 0))) mergeIn(saved);
    } catch { /* storage unavailable */ }
  }
  return t;
}

let timer = 0;
let report = () => {};
// the dev panel listens: did the last change reach tuning.json (only serve.py accepts it)?
export function onTuningSaved(cb) { report = cb; }

export function saveTuning(t) {
  const data = { ...t, savedAt: Date.now() };
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
  clearTimeout(timer);
  timer = setTimeout(() => {
    fetch('__tuning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then((r) => report(r.ok), () => report(false));
  }, 400);
}

// Put the values to work. parts: what else needs telling (the rain's uniforms, the passes, the sky);
// returns true when the moon moved, so its shadows must be drawn again.
// Turning every colour round the grey axis by deg, then scaling its saturation (in linear RGB). Whites and
// greys stay as they are; the cyans and blues move together, keeping their places relative to each other.
export function hueSatMatrix(deg, sat) {
  const a = THREE.MathUtils.degToRad(deg), c = Math.cos(a), s = Math.sin(a) / Math.sqrt(3), k = (1 - c) / 3;
  const rot = new THREE.Matrix3().set(
    c + k, k - s, k + s,
    k + s, c + k, k - s,
    k - s, k + s, c + k,
  );
  const [lr, lg, lb] = [0.2126, 0.7152, 0.0722];
  const satM = new THREE.Matrix3().set(
    lr * (1 - sat) + sat, lg * (1 - sat), lb * (1 - sat),
    lr * (1 - sat), lg * (1 - sat) + sat, lb * (1 - sat),
    lr * (1 - sat), lg * (1 - sat), lb * (1 - sat) + sat,
  );
  return satM.multiply(rot);
}

// catalog: the ads the screens show and the district's brands (kit/catalog.js), for their speeds and colours
export function applyTuning(t, { rain, bloom, outline, finish, sky, renderer, catalog }) {
  const u = shared;
  const pal = t.palette, M = hueSatMatrix(t.hue.shift, t.hue.saturation);
  u.uHue.value.copy(M);
  // a colour from the settings, turned to the master hue
  const turned = (color, hex) => {
    color.set(hex).applyMatrix3(M);
    color.setRGB(Math.max(color.r, 0), Math.max(color.g, 0), Math.max(color.b, 0));
    return color;
  };
  u.uE1.value = t.tones.edge1;
  u.uE2.value = t.tones.edge2;
  u.uSoft.value = t.tones.soft;
  u.uStreetLift.value = t.tones.streetLift;
  turned(u.uDeep.value, pal.deep);
  turned(u.uMid.value, pal.mid);
  turned(u.uLit.value, pal.lit);
  turned(u.uLitTint.value, pal.litTint);
  turned(u.uShade2.value, pal.shade2);

  const el = THREE.MathUtils.degToRad(t.moon.elevation), az = THREE.MathUtils.degToRad(t.moon.azimuth);
  const before = u.uKeyDir.value.clone();
  u.uKeyDir.value.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  u.uKey.value = t.moon.strength;

  turned(u.uFog.value, t.air.fog);
  turned(u.uHaze.value, t.air.haze);
  u.uFogDensity.value = t.air.density;
  turned(sky.material.uniforms.uZenith.value, t.air.zenith);
  renderer.setClearColor(u.uFog.value);

  const r = rain.uniforms;
  r.uRainBright.value = t.rain.brightness;
  r.uRainAlpha.value.set(t.rain.darkAlpha, t.rain.midAlpha, t.rain.litAlpha);
  r.uRainAt.value.set(t.rain.midAt, t.rain.litAt);
  r.uRainLen.value = t.rain.length;
  r.uFall.value = t.rain.speed;
  r.uWind.value.set(t.rain.wind, 0, t.rain.wind * 0.4);
  r.uRainReach.value = t.rain.reach;
  // the lit colour is set bright enough to bloom: the chosen colour, scaled up
  turned(r.uRainLit.value, t.rain.lit).multiplyScalar(1.9);
  turned(r.uRainMid.value, t.rain.mid);
  turned(r.uRainDeep.value, t.rain.dark);

  u.uGlassRefl.value = t.glass.reflect;
  u.uIndoor.value = t.indoor.light;
  u.uRoomBright.value = t.glass.rooms;
  u.uWet.value = t.street.wet;
  u.uReflLo.value = t.street.reflLo;
  u.uReflHi.value = t.street.reflHi;
  turned(u.uScrDark.value, t.screens.dark);
  turned(u.uScrMid.value, t.screens.mid);
  u.uScrHot.value = t.screens.hot;
  u.uAdPoster.value = t.screens.style === 'led' ? 0 : 1;
  u.uAdOwn.value = t.screens.own ? 1 : 0;
  u.uAdBright.value = t.screens.bright;
  catalog?.brands.forEach((b, i) => {
    const c = t.caseColors[b.key];
    if (u.uCaseAdj.value[i]) u.uCaseAdj.value[i].set(c ? THREE.MathUtils.degToRad(c.hue) : 0, c ? c.saturation : 1, c ? c.lightness : 1);
  });
  catalog?.ads.forEach((a, i) => { catalog.uniforms.uAdSpeed.value[i] = t.ads[a.key] ?? a.speed; });


  bloom.strength = t.post.bloom;
  bloom.radius = t.post.bloomRadius;
  bloom.threshold = t.post.bloomThreshold;
  outline.uniforms.uStrength.value = t.post.outline;
  turned(outline.uniforms.uColor.value, t.post.outlineColor);
  finish.uniforms.uVignette.value = t.post.vignette;
  finish.uniforms.uGrain.value = t.post.grain;

  return before.distanceToSquared(u.uKeyDir.value) > 1e-10;
}
