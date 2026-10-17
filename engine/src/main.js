// A walk through a rainy city of the future at night, in cyan-blue and white, drawn in three flat tones. The
// district (district.js) says what the city is; this sets up the renderer and the passes each frame needs: the
// moon's shadow map, the mirror image for the wet street, then the scene, ink lines, bloom and a last grade.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { shared, N_LAMP, N_BB, N_PT } from './core/toon.js';
import { LAYER } from './core/constants.js';
import { buildRain, RAIN_LEVELS } from './core/rain.js';
import { buildSky } from './core/sky.js';
import { buildTraffic } from './core/traffic.js';
import { buildTrees } from './core/trees.js';
import { buildPeople } from './core/people.js';
import { Walker } from './core/walker.js';
import { Soundscape } from './core/audio.js';
import { FinishPass } from './core/post.js';
import { loadTuning, applyTuning } from './core/tuning.js';
import { buildAtlas, fontFamily } from './kit/atlas.js';
import { loadIcons, setIcons } from './kit/icons.js';
import { buildCatalog } from './kit/catalog.js';
import { buildCity, districtWords } from './kit/city.js';
import { buildHolograms } from './kit/holograms.js';
import { makeInfoBoard } from './kit/infoBoard.js';
import { musicBeat, THEMES } from './kit/signs.js';
import { DISTRICT } from './district.js';

const tuning = await loadTuning();
// the district's name on the page and over the way in
document.title = DISTRICT.name ?? "夜雨城";
document.querySelector('#intro h1').textContent = DISTRICT.name;
document.querySelector('#intro .en').textContent = DISTRICT.en ?? 'NIGHT · RAIN';

const ui = {
  intro: document.getElementById('intro'),
  status: document.getElementById('status'),
  hint: document.getElementById('hint'),
  mode: document.getElementById('mode'),
  rain: document.getElementById('rain'),
  sound: document.getElementById('sound'),
  pace: document.getElementById('pace'),
  music: document.getElementById('music'),
};
const nextFrame = () => new Promise((r) => { requestAnimationFrame(() => setTimeout(r, 0)); setTimeout(r, 100); });
const say = async (msg) => { ui.status.textContent = msg; await nextFrame(); };

// ---------------------------------------------------------------- renderer

const W = () => Math.max(1, innerWidth), H = () => Math.max(1, innerHeight);
const PR = Math.min(devicePixelRatio, 1.25);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(PR);
renderer.setSize(W(), H());
renderer.toneMapping = THREE.NoToneMapping; // the tones are shown exactly as chosen
renderer.setClearColor(shared.uFog.value);
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, W() / H(), 0.1, 2600);
for (const l of [LAYER.SOLID, LAYER.GLOW, LAYER.AIR, LAYER.GROUND, LAYER.INSIDE]) camera.layers.enable(l);

// ---------------------------------------------------------------- the world

await say('写下招牌上的字…');
const atlas = await buildAtlas(districtWords(DISTRICT), tuning.fonts);
// the icons drawn into some signs (kit/icons.js), and the fonts of the themed signs (kit/signs.js THEMES)
setIcons(await loadIcons());
await Promise.all(DISTRICT.streets.flatMap((st) => st.shops || []).filter((sh) => sh.sign === 'theme')
  .map((sh) => fontFamily((typeof sh.theme === 'object' ? sh.theme : THEMES[sh.theme ?? (sh.kind === 'tea' ? 'moon' : 'icecream')])?.font, sh.name ?? DISTRICT.brands?.find((b) => b.key === sh.brand)?.name ?? '')));
const catalog = buildCatalog(atlas, DISTRICT.brands);

// the mirror for the wet street (drawn each frame, see renderReflection)
const reflRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
const reflection = { texture: reflRT.texture, matrix: new THREE.Matrix4() };

await say('立起玻璃高楼…');
// the cat sculpture (made in Blender: blender/build_cat_statue.py); if it won't load, one of simple shapes
const cat = await new GLTFLoader().loadAsync('assets/cat_statue.glb')
  .then((g) => g.scene.getObjectByProperty('isMesh', true).geometry, () => null);
// the district's own models (district.models: { name: 'assets/models/....glb' }), for holograms and sculptures
const models = Object.fromEntries(await Promise.all(Object.entries(DISTRICT.models || {}).map(([name, url]) =>
  new GLTFLoader().loadAsync(url).then((g) => [name, g.scene], (e) => { console.warn(`model ${name} (${url}) did not load`, e); return [name, null]; }))));
const city = buildCity(DISTRICT, { atlas, catalog, reflection, statues: { cat }, models });
scene.add(city.group);
await say('种树，摆上长椅…');
const trees = buildTrees(city.trees, PR);
scene.add(trees.group);
const people = buildPeople(city.people, { lanes: city.lanes });
scene.add(people.group);
await say('点亮全息投影…');
const H0 = DISTRICT.holograms || {};
const holos = buildHolograms(atlas, { ...H0, signs: [...(H0.signs || []), ...city.holoSigns] });
scene.add(holos.group);
const sky = buildSky();
scene.add(sky);
const traffic = buildTraffic(city.streets);
scene.add(traffic.group);
// the rain shelters' boards: the time, the weather, the district's own place and metro line
const boards = makeInfoBoard(city.infoBoards, { place: DISTRICT.place, line: DISTRICT.metroLine });
if (boards.mesh) { boards.mesh.layers.set(LAYER.GLOW); scene.add(boards.mesh); }
await say('下起雨来…');
const rain = buildRain();
scene.add(rain.group);

// ---------------------------------------------------------------- the moon's shadow map

// One square map, an orthographic view along the moonlight over the stretch of street just ahead of the viewer
// (its long side along the street nearest them), drawn again only when that stretch moves on (every 20 m) or
// another street is nearer, so the edges never crawl.
const SHADOW = 4096;
const shadowRT = new THREE.WebGLRenderTarget(SHADOW, SHADOW, { format: THREE.RedFormat });
shadowRT.depthTexture = new THREE.DepthTexture(SHADOW, SHADOW, THREE.UnsignedIntType);
shadowRT.depthTexture.minFilter = shadowRT.depthTexture.magFilter = THREE.NearestFilter;
const shadowCam = new THREE.OrthographicCamera(-80, 80, 430, -90, 1, 1600);
shadowCam.layers.set(LAYER.SOLID);
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
const BIAS = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
shared.uShadowMap.value = shadowRT.depthTexture;
shared.uShadowTexel.value.set(1 / SHADOW, 1 / SHADOW);
let shadowAt = null;
const fwd = new THREE.Vector3();
function updateShadow() {
  camera.getWorldDirection(fwd);
  const p = camera.position, road = city.nearestRoads(p.x, p.z, 1)[0];
  // along the nearest road, the way one looks down it (or, with no road, the way one looks)
  let dx = road ? road.dx : fwd.x, dz = road ? road.dz : fwd.z;
  if (dx * fwd.x + dz * fwd.z < 0) { dx = -dx; dz = -dz; }
  const n = Math.hypot(dx, dz) || 1;
  dx /= n; dz /= n;
  const along = Math.round((p.x * dx + p.z * dz - 110) / 20) * 20, across = Math.round((p.x * -dz + p.z * dx) / 20) * 20;
  const key = `${road ? city.roads.indexOf(road) : -1}:${Math.sign(dx)}:${Math.sign(dz)}:${along}:${across}`;
  if (key === shadowAt) return;
  shadowAt = key;
  const target = new THREE.Vector3(dx * along - dz * across, 0, dz * along + dx * across);
  shadowCam.position.copy(target).addScaledVector(shared.uKeyDir.value, 800);
  shadowCam.up.set(dx, 0, dz);
  shadowCam.lookAt(target);
  shadowCam.updateMatrixWorld();
  shared.uShadowMatrix.value.copy(BIAS).multiply(shadowCam.projectionMatrix).multiply(shadowCam.matrixWorldInverse);
  scene.overrideMaterial = depthOnly;
  renderer.setRenderTarget(shadowRT);
  renderer.clear();
  renderer.render(scene, shadowCam);
  renderer.setRenderTarget(null);
  scene.overrideMaterial = null;
}

// ---------------------------------------------------------------- the mirror for the wet street

const reflCam = new THREE.PerspectiveCamera();
reflCam.layers.set(LAYER.SOLID);
reflCam.layers.enable(LAYER.GLOW);
const tmp = { f: new THREE.Vector3(), u: new THREE.Vector3(), t: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), plane: new THREE.Plane(), clip: new THREE.Vector4(), q: new THREE.Vector4() };
function renderReflection() {
  // the camera mirrored in the street (y = 0), looking up at the city from beneath it
  Object.assign(reflCam, { fov: camera.fov, aspect: camera.aspect, near: camera.near, far: camera.far });
  reflCam.updateProjectionMatrix();
  tmp.f.set(0, 0, -1).applyQuaternion(camera.quaternion);
  tmp.u.set(0, 1, 0).applyQuaternion(camera.quaternion);
  // (down in a sunken plaza, the mirror is its floor: the district may say, mirrorAt)
  const h = camera.position.y < -0.3 ? city.mirrorAt?.(camera.position) ?? 0 : 0;
  shared.uReflY.value = h;
  reflCam.position.set(camera.position.x, 2 * h - camera.position.y, camera.position.z);
  reflCam.up.set(tmp.u.x, -tmp.u.y, tmp.u.z);
  tmp.t.copy(camera.position).add(tmp.f);
  reflCam.lookAt(tmp.t.x, 2 * h - tmp.t.y, tmp.t.z);
  reflCam.updateMatrixWorld();
  // nothing below the street drawn in it: its near plane tilted onto the street (an oblique frustum, as
  // three.js's Reflector does it)
  if (camera.position.y > h + 0.02) {
    tmp.plane.set(tmp.up, -h).applyMatrix4(reflCam.matrixWorldInverse);
    const e = reflCam.projectionMatrix.elements, cp = tmp.clip.set(tmp.plane.normal.x, tmp.plane.normal.y, tmp.plane.normal.z, tmp.plane.constant);
    tmp.q.set((Math.sign(cp.x) + e[8]) / e[0], (Math.sign(cp.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    cp.multiplyScalar(2 / cp.dot(tmp.q));
    e[2] = cp.x; e[6] = cp.y; e[10] = cp.z + 1; e[14] = cp.w;
  }
  reflection.matrix.copy(BIAS).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);
  renderer.setRenderTarget(reflRT);
  renderer.clear();
  renderer.render(scene, reflCam);
  renderer.setRenderTarget(null);
}

// ---------------------------------------------------------------- choosing the lights near the viewer

// The shaders take the nearest lamps and emitters only; these are chosen each frame, those ahead of the
// viewer first (one ahead is seen, together with its pool of light, much further off than one behind).
function pickLights() {
  camera.getWorldDirection(fwd);
  const p = camera.position;
  const score = (o, reach) => {
    const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz);
    const ahead = (dx * fwd.x + dz * fwd.z) / Math.max(d, 1e-3);
    return (d / Math.sqrt(reach)) * (ahead > -0.2 ? 1 : 1.8);
  };
  const lamps = city.lamps.map((l) => [score(l, 20), l]).sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < N_LAMP; i++) {
    const l = lamps[i]?.[1];
    shared.uLamp.value[i].set(l ? l.x : 0, l ? l.y : 0, l ? l.z : 0, l ? l.power ?? 1.5 : 0);
  }
  const em = city.emitters.map((e) => [score(e, e.reach), e]).sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < N_BB; i++) {
    const e = em[i]?.[1];
    shared.uBb.value[i].set(e ? e.x : 0, e ? e.y : 0, e ? e.z : 0, e ? e.power : 0);
    shared.uBbN.value[i].set(e ? e.nx : 0, e ? e.ny : 0, e ? e.nz : 1, e ? e.reach : 1);
    shared.uBbTint.value[i] = e ? e.tint : 0;
  }
  const pts = [...holos.lights].sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  for (let i = 0; i < N_PT; i++) {
    const h = pts[i];
    shared.uPt.value[i].set(h ? h.x : 0, h ? h.y : 0, h ? h.z : 0, h ? h.power : 0);
    shared.uPtR.value[i] = h ? h.reach : 1;
  }
}

// ---------------------------------------------------------------- post

const rt = new THREE.WebGLRenderTarget(W() * PR, H() * PR, { type: THREE.HalfFloatType, samples: 4 });
rt.depthTexture = new THREE.DepthTexture(W() * PR, H() * PR);
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.42, 0.45, 1.0);
const bloomSetSize = bloom.setSize.bind(bloom);
bloom.setSize = (w, h) => bloomSetSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
// (indoors its faintest, widest spill cut off, so that the surfaces round a light keep their flat tones; uFloor:
// how faint is too faint, set each frame, see the loop)
{
  const m = bloom.compositeMaterial;
  m.uniforms.uFloor = { value: 0 };
  m.fragmentShader = 'uniform float uFloor;\n' + m.fragmentShader.replace(/\}\s*$/,
    '  gl_FragColor.rgb *= smoothstep(uFloor, uFloor * 2.0, max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)));\n}');
  m.needsUpdate = true;
}
composer.addPass(bloom);
// the bloom's glow not added over the frame by its own last pass, but in the finish, with the ink lines, the
// vignette and the grain, all in one pass (core/post.js)
{
  const quad = bloom.fsQuad, draw = quad.render.bind(quad);
  quad.render = (r) => { if (quad.material !== bloom.blendMaterial) draw(r); };
}
const finish = new FinishPass(camera), outline = finish;
finish.uniforms.tBloom.value = bloom.renderTargetsHorizontal[0].texture;
composer.addPass(finish);

function resize() {
  camera.aspect = W() / H();
  camera.updateProjectionMatrix();
  renderer.setSize(W(), H());
  composer.setSize(W(), H());
  reflRT.setSize(Math.round(W() * PR / 2), Math.round(H() * PR / 2));
  rain.resize(camera, H() * PR);
  finish.uniforms.uAspect.value = W() / H();
}
addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------- the tunable look (tuning.json)

const tuned = { rain, bloom, outline, finish, sky, renderer, catalog };
applyTuning(tuning, tuned);

// the rain's roofs and raised ground (see core/rain.js): the raised ground is few and set once; the roofs and the
// roads nearest the viewer are chosen each frame
city.lifts.slice(0, 6).forEach((l, i) => {
  rain.uniforms.uLift.value[i].set(l.x0, l.x1, l.z0, l.z1);
  rain.uniforms.uLiftY.value[i] = l.y;
});
const mid = (c) => [(c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2];
function pickCovers() {
  const p = camera.position, d = (c) => { const [x, z] = mid(c); return Math.hypot(x - p.x, z - p.z); };
  const near = [...city.covers].sort((a, b) => d(a) - d(b));
  for (let i = 0; i < 6; i++) {
    const c = near[i];
    rain.uniforms.uCover.value[i].set(c ? c.x0 : 0, c ? c.x1 : 0, c ? c.z0 : 0, c ? c.z1 : 0);
    rain.uniforms.uCoverY.value[i] = c ? c.y : 0;
  }
  rain.setRoads(city.nearestRoads(p.x, p.z));
  camera.getWorldDirection(fwd);
  const n = Math.hypot(fwd.x, fwd.z) || 1;
  rain.uniforms.uFwd.value.set(fwd.x / n, fwd.z / n);
}

// ---------------------------------------------------------------- the viewer, and the controls

const sound = new Soundscape();
if (DISTRICT.music) sound.setTrack(DISTRICT.music.track ?? 'galaxy');
const walker = new Walker(camera, renderer.domElement, {
  colliders: city.colliders,
  floors: city.floors,
  sights: city.sights,
  route: city.route,
  baseAt: city.baseAt,
  bounds: city.bounds,
  onStep: (run) => sound.step(run),
  onModeChange: (mode) => { ui.mode.textContent = mode === 'auto' ? '漫步中 · 空格 自由行走' : '自由行走 · 空格 继续漫步'; },
});
walker.onModeChange('auto');

// the choices: how hard it rains, the sliders (kept in this browser, if it can be)
const STORE = `rain-city:${DISTRICT.name || 'city'}`;
const choice = { rain: 1 };
try { Object.assign(choice, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch { /* storage unavailable */ }
const keep = () => { try { localStorage.setItem(STORE, JSON.stringify(choice)); } catch { /* storage unavailable */ } };
function applyChoice() {
  rain.setLevel(choice.rain);
  sound.setRain(choice.rain);
  ui.rain.textContent = RAIN_LEVELS[choice.rain].name;
  ui.sound.style.opacity = sound.muted ? 0.4 : '';
}
applyChoice();
// the sliders: how fast one walks (a walk's speed to half again a run's), how loud the music; kept with the rest
for (const [el, key, set] of [[ui.pace, 'pace', (v) => { walker.pace = v; }], [ui.music, 'music', (v) => sound.setMusicVolume(v)]]) {
  choice[key] = Number.isFinite(choice[key]) ? THREE.MathUtils.clamp(choice[key], 0, 1) : 0.5;
  el.value = choice[key];
  set(choice[key]);
  el.addEventListener('input', () => { choice[key] = +el.value; set(choice[key]); keep(); });
  el.addEventListener('change', () => el.blur());               // (the keys back to walking)
  el.addEventListener('keydown', (e) => e.stopPropagation());
}
document.getElementById('music-row').hidden = !DISTRICT.music;   // (no place for music: no slider for it)
const cycleRain = () => { choice.rain = (choice.rain + 1) % RAIN_LEVELS.length; keep(); applyChoice(); };
const toggleSound = () => { sound.toggle(); applyChoice(); };
ui.rain.addEventListener('click', cycleRain);
ui.sound.addEventListener('click', toggleSound);
addEventListener('keydown', (e) => {
  if (e.repeat || e.target instanceof HTMLInputElement) return;
  if (e.code === 'KeyR') cycleRain();
  if (e.code === 'KeyM') toggleSound();
});

// ---------------------------------------------------------------- the loop

// what is drawn only from near enough (each lot within its reach; in the wet street's mirror, if less far, refl)
const lots = [...city.lots, ...trees.lots];
const viewer = { x: 0, z: 0 };
function showLots(refl) {
  for (const r of lots) {
    const near = Math.hypot(camera.position.x - r.x, camera.position.z - r.z) < (refl ? r.refl ?? r.reach : r.reach);
    for (const m of r.meshes) m.visible = near;
  }
  for (const m of city.underMeshes) m.visible = !refl;
}

let time = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  shared.uTime.value = time;

  walker.update(dt, []);
  viewer.x = camera.position.x; viewer.z = camera.position.z;
  holos.update(time);
  traffic.update(time);
  // music, if the district has a place for it (district.music: { x, z, track }): softly all about, full near it
  if (DISTRICT.music) {
    const m = DISTRICT.music, d = Math.hypot(camera.position.x - m.x, camera.position.z - m.z);
    sound.setMusic((m.everywhere ?? 0.15) + (1 - (m.everywhere ?? 0.15)) * (1 - THREE.MathUtils.smoothstep(d, m.near ?? 20, m.far ?? 60)));
    musicBeat.value += (sound.musicLoudness() - musicBeat.value) * (1 - Math.exp(-dt * 10));
  }
  boards.update(time, RAIN_LEVELS[choice.rain]?.name);
  people.update(time, viewer);
  trees.update(time, viewer);
  pickCovers();
  // indoors (under a room's ceiling, or below the street but in a sunken plaza open to the sky: uHoles) the
  // bloom's faint spill is cut off, so the room's things keep their flat tones; and the rain's sound is muffled
  {
    const p = camera.position, open = city.holes.some((h) => h.open && h.contains(p.x, p.z));
    const room = (p.y < -1 && !open) || city.covers.some((c) => c.room && p.y < c.y && p.x > c.x0 && p.x < c.x1 && p.z > c.z0 && p.z < c.z1);
    sound.setIndoors(room);
    const u = bloom.compositeMaterial.uniforms.uFloor;
    u.value += ((room ? tuning.post.bloomFloor ?? 0.1 : 0) - u.value) * (1 - Math.exp(-dt * 4));
  }
  // the automatic doors: open as one comes near, closed (and in the way) otherwise; drawn only from near enough
  for (const d of city.doors) {
    const dist = Math.hypot(camera.position.x - d.x, camera.position.z - d.z);
    d.open += ((dist < 3.4 ? 1 : 0) - d.open) * (1 - Math.exp(-dt * 5));
    const e = d.open * d.open * (3 - 2 * d.open);
    for (const l of d.leaves) {
      l.mesh.visible = dist < 120;
      l.mesh.position.set(l.x + d.ax * l.dir * e * l.travel, l.mesh.position.y, l.z + d.az * l.dir * e * l.travel);
    }
    d.collider.y1 = d.open > 0.7 ? -100 : d.top;
  }
  sky.position.copy(camera.position);

  updateShadow();
  pickLights();
  showLots(true);
  renderReflection();
  showLots(false);
  finish.uniforms.uTime.value = time;
  composer.render(dt);
  requestAnimationFrame(frame);
}

// for looking at the city from a given place (screenshots, checks): ?at=x,y,z&to=x,y,z puts the camera there, still;
// ?skip leaves out the way in
const params = new URLSearchParams(location.search);
const pose = { at: params.get('at')?.split(',').map(Number), to: params.get('to')?.split(',').map(Number) };
function lookFrom(at, to) {
  walker.update = () => {};
  camera.position.set(...at);
  camera.lookAt(...to);
}
if (pose.at?.length === 3 && pose.to?.length === 3) lookFrom(pose.at, pose.to);

await say('');
requestAnimationFrame(frame);
ui.intro.classList.add('ready');
if (params.has('skip') || pose.at) ui.intro.classList.add('gone');
ui.intro.addEventListener('click', () => {
  ui.intro.classList.add('gone');
  sound.start();
  ui.hint.classList.add('show');
  setTimeout(() => ui.hint.classList.remove('show'), 12000);
}, { once: true });

// for poking at from the console
window.__city = { city, camera, walker, shared, scene, renderer, composer, bloom, finish, tuning, atlas, catalog, renderReflection, showLots, people, trees, holos, traffic,
  apply: () => applyTuning(tuning, tuned),
  // the camera put at [x, y, z] looking at [x, y, z], the stroll stopped (as ?at= &to=)
  look: (at, to) => lookFrom(at, to),
  // the street's own level, or the floor, at (x, z): what one would stand on there
  groundAt: (x, z) => walker.groundAt(x, z) };
