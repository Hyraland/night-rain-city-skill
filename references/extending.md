# Adding new kinds of things

When the kit has no piece for what the user wants (a fountain, a night market, a bridge over a canal, a new shop
kind), write one. Model it on `kit/terrace.js` (a self-contained piece) or an interior in `kit/interiors.js` (a shop's
inside).

## A piece

```js
// kit/fountain.js
import * as THREE from 'three';
import { box } from './geometry.js';
import { CYAN, SOFT } from './buildings.js';
import { CURB } from '../core/constants.js';

// A round fountain on a plaza: a stone basin, a ring of light, water that mirrors (its frame: centre at the origin)
export function fountain(w, { r = 4, name = 'fountain' } = {}) {
  const Q = w.rng(name);
  w.props(new THREE.CylinderGeometry(r, r + 0.1, 0.55, 48, 1, true).translate(0, CURB + 0.27, 0), 0.75);
  w.props(new THREE.TorusGeometry(r, 0.12, 6, 64).rotateX(Math.PI / 2).translate(0, CURB + 0.55, 0), 0.85);
  w.groundPiece('pool', new THREE.CircleGeometry(r - 0.1, 48).rotateX(-Math.PI / 2).translate(0, CURB + 0.4, 0));
  w.glow(new THREE.TorusGeometry(r + 0.09, 0.025, 4, 96).rotateX(Math.PI / 2).translate(0, CURB + 0.3, 0), CYAN);   // (on its outer face)
  w.circle(0, 0, r + 0.2);
  w.lift(-r, r, -r, r, CURB + 0.4);
  w.emitter({ x: 0, y: CURB + 1, z: 0, nx: 0, ny: 1, nz: 0, power: 0.6, reach: 8, tint: 0.3 });
  return { claim: [-r - 1, r + 1, -r - 1, r + 1] };
}
```

Then in `district.js`: `kit.place(kit.on('cross', 300, 0), () => fountain(w, { r: 5 }))` (or anywhere with
`kit.place({ x, z, yaw }, ...)`).

## Rules

- **Build in the frame** with the world's helpers; never add meshes to the scene directly unless they are animated
  meshes of their own (then `w.addMesh`).
- **Materials**: solid things `w.props` (albedo 0.3-0.95; darker for metal and dark glass, paler for stone and
  white); glass buildings `w.glass`; anything that glows `w.glow`. Brand colours only in light (`w.glow`,
  `w.shown`); solid things stay in the city's tones.
- **Light**: anything that glows should usually also throw light: `w.emitter` facing out from it (power 0.4-1.2,
  reach 5-40), or `w.lamp` for a point source. Only the nearest 24 lamps and 24 emitters light a frame, chosen
  from those ahead of the viewer first: many small emitters close together compete; prefer fewer, larger ones.
- **Walking**: `w.block` / `w.circle` round what one would bump into (with `y0, y1` when it only stops feet at some
  heights, e.g. a rail around a raised deck), `w.floor` for anything walked on above or below the street.
- **Doorways**: a way into a room of one's own (a shop, a hall, a kiosk) gets an automatic door: `w.door(x, z0, z1,
  F, top)` across it (two glass leaves that slide apart as one comes near; closed, in the way). Leave the gap in the
  wall's `w.block`s for it. Never leave a lit room's front open to the rain.
- **No two faces in one plane**: where two pieces meet (a room's back wall and the building behind it, a panel on a
  wall, a floor on the ground), set one back by 0.02-0.15 m. Faces in the same plane flicker (z-fighting) as the
  viewer moves, worst where a lit glass building's windows show through. A thin panel on a wall: 0.02 m off it.
- **Rain**: `w.cover` under roofs (and `room: true` indoors), `w.lift` on raised ground so splashes sit on it.
- **Random numbers** only from `w.rng('a name of its own')`. Never `Math.random()` for geometry: the city must be the
  same on every load, and one piece's changes must not move another's.
- **Scale**: ground floor 5.2 m (`LOBBY`), pavement 0.15 m (`CURB`), lamp heads 8.4 m, people 1.7 m, steps 0.15-0.2
  rise, 0.4-0.5 tread.
- **Words**: anything shown in words must be in `district.words.horizontal` (or `vertical` / `single`); look it up
  with `w.atlas.h(text)`.
- **Below the street**: use `w.under*` (lit as indoors, never mirrored), cut the ground with `w.hole`, and put a
  `w.cover` or a closed roof over ways down.
- **Cost**: geometry is merged by material and drawn in 100 m lots; still, keep segment counts modest (cylinders
  12-24, spheres 12-20), and don't add thousands of separate meshes. Check the frame time (testing.md).

## A new shop kind

Add it to `kit/interiors.js`: a room (`ROOMS[kind](c)`, the whole 8 m room, built with `roomTools(c)`: `bx(b0, b1,
y0, y1, z0, z1)` with b how far in from the glass, `put`, `block`, `staff`, `counter`, `table`, `shelves`, `menu`) and,
if it should also fit a station's wall, a compact one (`COMPACT[kind](c)`, the back 3.4 m: `c.bx`, `c.put`,
`c.block`, `c.backWall`, `c.counter`, `c.staff`); add its name to `SHOP_KINDS`. Optionally a statue kind in
`kit/shops.js statue()` and `STATUE_OF`.

## A new sign style

Add an entry to `SIGNS` in `kit/shops.js` (and to `BLADES` for its blade sign): it gets q with the shop's brand,
name, place and size and adds a mesh (`q.mesh(...)`) or calls the world. Then `sign: '<your style>'` in a shop.

## A new ad case scene

Add an entry to `SCENES` in `kit/scenes.js`: a still life (`hero(P)`, `small(P)`, `air`) built in the unit frame,
or a flag that `makeCase` in `kit/cases.js` draws in a way of its own. Then `case: '<your scene>'` on a brand.

## Icons, pictures, models

Prefer drawing what a sign needs in code (canvas paths, shapes, dots). When a design needs icons, pictures or
models from elsewhere: use only freely licensed ones (CC0 / public domain; or OFL, Apache, MIT, CC BY with the
credit written into the project's CREDITS, and on the page too if the city is published), put them in `assets/`, and say where each came from. If you cannot find
one whose licence is clear, ask the user to supply it or to choose. Models: see models.md.

## A new kind of LED sign

In `kit/signs.js`: a function returning a `THREE.Mesh` with a `ShaderMaterial` (or `ledPicture` with a canvas
drawing). Keep LED dots, light on dark, and run its final colour through `uHue` (and `uCaseAdj[index]` for a brand's
own colours) as `cinemaLED` does, so it follows the city's colours.

## The look as a whole

`tuning.json` holds the palette, tones, moon, fog, rain, glass, screens, post (bloom, outline, vignette, grain) and
each brand's colours (`caseColors`). Change the city's mood there (e.g. `hue.shift`, `palette`, `rain.speed`), not in the shaders.
