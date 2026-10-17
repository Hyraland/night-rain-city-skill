# Pieces and the world API

All code is in `engine/src`. `core/` is the rendering (shaders, rain, sky, walker, people, trees, audio); `kit/` builds
cities. A piece is a function `(w, options)` that adds things to the world `w` in the current frame.

## Frames

Pieces are written in a local frame: origin at a point on the ground, **local -z the way forward** (along a street,
or away from it), local +x to the right of that. `w.frame(x, z, turn, fn)` runs `fn` in a frame at local `(x, z)`,
turned by `turn` radians (frames nest). `kit.place(spot, fn)` does this for a spot from `kit.beside` / `kit.on`.
A street's own frame: its start at the origin, its road along -z; side `s` (-1 left, +1 right) at local `x = s * a`.

`w.toWorld(x, z)`, `w.toLocal(wx, wz)`, `w.dirWorld(dx, dz)`, `w.yaw()`, `w.rng(name)` (a random sequence of its own,
by name: changing one piece moves nothing else).

## Adding things (all in the frame, all merged and drawn by the kit)

| call | what |
|---|---|
| `w.props(geom, albedo)` | solid, toon-shaded in the city's three tones (albedo 0..1: how much light it gives back) |
| `w.glass(geom, [winW, floorH, lit, style], seed, base?, bright?)` | curtain wall with rooms; geom from `prism(outline(...), y0, y1)`; style 0-7 (`0` clear, `1` floor bands, `2` slender, `3` pale frame, `4` diagrid, `5` staggered, `6` fins, `7` ribbons) |
| `w.glow(geom, [r,g,b], blink?)` | emissive, unlit (lines of light, lamp heads); >1 blooms |
| `w.shown(geom, rgb)` | emissive for brand accents (within a brand's case, its colours turned as tuning.json `caseColors` says) |
| `w.drifting / orbiting / popping(...)` | emissive that moves in the shader (bobbing, circling, popping) |
| `w.beam(geom)` | a soft lamp beam cone in the rain |
| `w.screen(geom, PROG.X, w, h, rect?, seed)` | a screen showing a program (`core/screens.js PROG`: GLYPHS RINGS BARS TEXT HORIZON GLYPH WAVES TICKER RIBBONS BLOBS TUNNEL INTERFERENCE VORTEX CELLS); rect: atlas words for TEXT / TICKER / GLYPH |
| `w.screenAd(geom, ad, w, h, seed, rect?)` | a screen showing catalog entry `ad` (`w.catalog.brandAd(key)`, `w.catalog.brandAds`) |
| `w.addMesh(mesh, layer?)` | a mesh of its own (LED signs from `kit/signs.js`), placed by the frame |
| `w.groundPiece(kind, geom, { local, halfRoad, index })` | wet ground: `'pavement'`, `'road'`, `'pool'` (water), `'sunken'` (a plaza floor with two light lines at ±halfRoad) |
| `w.underProps / underGlow / underScreen / underScreenAd / underPut` | below the street (lit as indoors, not mirrored) |
| `w.inProps / inGlow / inShown / inScreenAd / inPut` | inside shops (drawn from within 160 m) |
| `w.put(kind, x, y, z, { rot, scale, tone, tilt, roll })` | small goods (instanced): bottle can carton snack noodle block basket loaf roll croissant baguette cup umbrella umbrellaOpen round cupped star spike bedRound bedCupped bedStar bedSpike leaves fern hanging tub cone jar plush teacup cake bowl mote |

Geometry helpers (`kit/geometry.js`): `box(x0, x1, y0, y1, z0, z1)`, `panel(w, h, x, y, z, face)` (a plane facing
`'z' '-z' 'x' '-x'`), `outline(shape, x0, x1, z0, z1, r)` (`'rect' 'rounded' 'chamfer' 'round'`),
`prism(points, y0, y1, { bottom })`, `sorted(a, b)`.

## What is not drawn

| call | what |
|---|---|
| `w.lamp(x, y, z, power = 1.5)` | a point light (street lamp, ceiling light) |
| `w.emitter({ x, y, z, nx, ny, nz, power, reach, tint })` | light thrown by a screen or window toward (nx, ny, nz) |
| `w.block(x0, x1, z0, z1, y0?, y1?)` / `w.circle(x, z, r, y0?, y1?)` | what one can't walk into (only for feet between y0 and y1) |
| `w.floor(x0, x1, z0, z1, at(x, z), replace?)` | ground one can walk onto (stairs, decks); `replace`: below the street |
| `w.door(x, z0, z1, F, top)` | an automatic sliding door across a doorway at x (main.js opens it as one comes near) |
| `w.cover(x0, x1, z0, z1, y, room?)` | a roof: no rain under it; `room`: indoors (rain muffled) |
| `w.lift(x0, x1, z0, z1, y)` | raised ground, for the rain's splashes |
| `w.hole(x0, x1, z0, z1, { floor, open })` | a hole in the ground (max 8): a way down, or a sunken plaza (`open`: rain falls in) |
| `w.sight(x, y, z, r)` | something the stroll glances at |
| `w.tree(x, y, z, h, r, lights, bands)` | a tree (lights: fairy lights; bands: rings of light round it) |
| `w.person(x, y, z, rot, umbrella)` | someone standing |
| `w.holoSign({ x, y, z, text, back, rotY, size, white })` | a floating hologram sign |
| `w.infoBoard(geom)` | a board of the time, weather and next train |

## Kit pieces

- **`terrace(w, { width = 34, depth = 26, height = 1.35, deck, tower = true, towerHeight, name })`**
  (`kit/terrace.js`): broad steps up to a raised forecourt before a tower, lamps, ringed trees, hedge, two glass ads;
  wide enough (32 m+), a deck before the second floor with a long lit stair, light ribbons along its edge. Place with
  `kit.beside`.
- **`sunkenPlaza(w, { width = 26, length = 44, depth = 6.5, screens = true, arcade = true, name })`**
  (`kit/underground.js`): steps down across its width from the street edge, a wet mirroring floor, rock-layered walls,
  glass rail, a lit arcade and screen at its far end, trees, benches, lamps, people. Uses 2 holes.
- **`metro(w, { name, signs: { gates, welcome }, shops, length = 46, width = 22, depth = 7.2, id })`**
  (`kit/underground.js`): a glass pavilion and pylon on the street, escalators and stair down, a concourse with ticket
  machines, small shops (`shops: [{ kind, name }]`, kind one of florist, umbrellas, bakery, cafe, bookshop, convenience), vending and ad machines, columns of brand
  ads, gates, platform screen doors, the track beyond. Uses 1 hole. The concourse runs along local -z under whatever
  is above.
- **`boidsCube(w, { cell })`** (`kit/sculptures.js`): a cube of 216 small cubes of light on a round plinth that
  bursts upward as a flock, wanders as a tall column and settles back layer by layer (24 s). Claims 9 x 9 m.
- **`solarSystem(w, { height })`** (`kit/sculptures.js`): the Sun on a column over a broad plinth, eight planets
  orbiting on rings of light, the asteroid belt, Saturn's ring, the Moon; walkable under. Claims 13.6 x 13.6 m;
  place it 8 m or more back from the street (`kit.beside(id, u, side, 8)`) or on a plaza.
- **Street shops**: `streets[].shops` (see district.md); built by `kit/shops.js`. Statues on their own:
  `statue(w, R, kind, x, z, s, colour)` (kinds `cafe tea icecream dessert bakery florist books umbrella diner cat`).
- **Builder** (`makeBuilder(w, { facade })`, `kit/buildings.js`), for towers of your own in a frame: `plot`,
  `tower(s, front, depth, zB, zA, h, shape, win, seed, opts)`, `backTower`, `modernTop`, `faceScreen`, `arcScreen`,
  `entrance`, `bladeSign`, `furnish`, `adWall`, `tree`, `planterTree`, `bench`.

## Shops' parts

- **Interiors** (`kit/interiors.js`): `ROOMS[kind](c)` (a whole street shop room) and `COMPACT[kind](c)` (its back 3.4 m);
  `roomTools(c)` gives a room `bx`, `put`, `block`, `staff`, `counter`, `table`, `shelves`, `menu`, `customers`.
- **Signs and blade signs** (`kit/shops.js` SIGNS, BLADES): each `(q) => ...` with q `{ w, R, spec, brand, name, x,
  y, z, sw, sh, face, mesh(m), g() }`.
- **Cases and the shop designs' signs** (`kit/cases.js`, as `w.cases`): `brandCase(w, h, x, y, z, face, B, seed,
  scene)`, `cafeSign`, `cafeBoard`, `floristSign`, `dotFlower`, `dawnPanel`, `rainWindow`, `starTicker`, `starBlade`,
  `floatIsland`, `islandLamp`, `emojiStage`, `duskPic`. `w.brandAd(w, h, x, y, z, face, ad, seed)`: a catalog ad as
  its brand's case if it has one, else a screen.

## Models (`kit/holomodel.js`)

`holoModel(w, model, { height, y, yaw, spin, bob, color, base, solid })`, `holoMaterial3D()`, `modelGeometry(scene)`;
see models.md.

## Signs (`kit/signs.js`)

Each returns a mesh; add with `w.addMesh(mesh)` (built in frame coordinates). `B` is a brand
(`brandOf(w, key)` from `kit/shops.js` gives it with its index).

- `ledPicture(panelGeom, w, h, draw(ctx, W, H), { low, high, density })` - any picture drawn grey on black, shown as
  LED dots between colour `low` and `high`; with `dotText(ctx, text, x, y, size, '#fff', { align: 'center' })`.
- `nameplate(panelGeom, name, en, aspect)`, `popName(...)`, `revealName(...)` - name signs.
- `cinemaLED(w, h, x, y, z, face, B, { mode: 'film' | 'beam', kind, palette })`, `umbrellaLED(...)`,
  `concertWaves(..., { palette, live })`.
- `marquee(bulbRing(x, y, z, w, h, face, gap), r)` - chasing bulbs.
- `meowLED(panelGeom, w, h, seed, B, { layout: 'face' | 'tiles' | 'flip', rows, words, animals })` - animal faces in
  LED dots (blinking, turning, or flipped like cards), B's name in finer dots.
- `themedSign(w, h, x, y, z, face, name, theme, 'name' | 'icon' | 'menu', { mesh, shown })` - LED sign in a theme's
  colours with icons; `THEMES.icecream`, `THEMES.moon`, or a theme object of your own.
- `canvasPlane(geom, aspect, transparent, draw)` - any canvas drawing as a label.

Icons (`kit/icons.js`, loaded by `main.js`): `drawIcon(ctx, 'noto/cat', x, y, size, fill)`, `iconShape(name, size)`;
available: `noto/` cat rabbit fox bear panda frog penguin hamster dog tiger koala mouse pig, `material/` icecream
cloud bedtime emoji_food_beverage. Add SVGs to `assets/icons` and their names to `ICONS` to use others.

## Holograms (`kit/holograms.js`)

`district.holograms` places rings, globes, helices and signs; `holoMaterial(kind, ...)` for hologram shapes of your
own (added to the scene in `main.js`).
