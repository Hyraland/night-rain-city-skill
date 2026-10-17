// Small icons drawn into signs (kit/signs.js): loaded once from assets/icons as shapes in a 512 square, white.
//   noto/<animal>      Noto Emoji's animal faces (OFL; assets/icons/noto/OFL.txt): cat rabbit fox bear panda frog
//                      penguin hamster dog tiger koala mouse pig (the animal LED signs, meowLED)
//   material/<name>    Google's Material Symbols (Apache 2.0): icecream cloud bedtime emoji_food_beverage (the
//                      themed shop signs)
// loadIcons() before building the city; drawIcon(ctx, name, ...) into a canvas, iconShape(name, size) as geometry.

import * as THREE from 'three';

export const ICONS = [
  ...['cat', 'rabbit', 'fox', 'bear', 'panda', 'frog', 'penguin', 'hamster', 'dog', 'tiger', 'koala', 'mouse', 'pig'].map((a) => `noto/${a}`),
  ...['icecream', 'cloud', 'bedtime', 'emoji_food_beverage', 'coffee'].map((m) => `material/${m}`),
  // the breads and the rest, for the dusk bakery's pictures; the paw and the blossom, the ramen bowl
  ...['croissant', 'baguette', 'bread', 'bagel', 'pretzel', 'waffle', 'pancakes', 'doughnut', 'cookie', 'pie', 'wheat', 'flatbread', 'butter', 'honey', 'milk', 'coffee', 'sandwich', 'sunset', 'paws', 'blossom', 'ramen'].map((a) => `noto/${a}`),
];
let icons = {};

export async function loadIcons(names = ICONS, base = 'assets/icons') {
  const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js');
  const loader = new SVGLoader();
  // (Material's: dark on nothing in a 960 square from y = -960, made over into the 512 square)
  const remap = (shape, f) => {
    const { shape: pts, holes } = shape.extractPoints(12);
    const out = new THREE.Shape(pts.map(f));
    out.holes = holes.map((h) => new THREE.Path(h.map(f)));
    return out;
  };
  await Promise.all(names.map(async (name) => {
    try {
      const svg = await loader.loadAsync(`${base}/${name}.svg`);
      const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
      if (name.startsWith('material/')) {
        const f = (p) => new THREE.Vector2(p.x * 512 / 960, (p.y + 960) * 512 / 960);
        icons[name] = shapes.map((sh) => remap(sh, f));
      } else icons[name] = shapes;
    } catch (e) { console.warn(`icon ${name} did not load`, e); }
  }));
  return icons;
}
export const setIcons = (all) => { icons = all || {}; };
export const getIcons = () => icons;

// an icon drawn at (cx, cy), size across, in fill (edge: a dark line round it that wide)
export function drawIcon(g, name, cx, cy, size, fill, edge = 0) {
  if (!icons[name]?.length) return;
  const k = size / 512;
  g.save(); g.translate(cx - 256 * k, cy - 256 * k); g.scale(k, k);
  g.fillStyle = fill; g.beginPath();
  for (const sh of icons[name]) {
    const { shape, holes } = sh.extractPoints(8);
    for (const ring of [shape, ...holes]) ring.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  }
  if (edge) { g.strokeStyle = '#000'; g.lineWidth = edge / k; g.lineJoin = 'round'; g.stroke(); }
  g.fill('evenodd'); g.restore();
}

// an icon as a flat shape facing +z, size high, centred; null if it did not load
export function iconShape(name, size) {
  if (!icons[name]?.length) return null;
  const g = new THREE.ShapeGeometry(icons[name], 6).scale(size / 512, -size / 512, 1), ix = g.index.array;
  for (let k = 0; k < ix.length; k += 3) [ix[k + 1], ix[k + 2]] = [ix[k + 2], ix[k + 1]];   // (facing out again)
  g.computeBoundingBox();
  const c = g.boundingBox.getCenter(new THREE.Vector3());
  return g.translate(-c.x, -c.y, 0);
}
