# district.js: the city as data

`engine/src/district.js` exports `DISTRICT`. Coordinates: x east, z south (so "north" is -z), y up, metres. The road
is at y = 0, pavements at y = 0.15 (`CURB`).

```js
import { sunkenPlaza, metro } from './kit/underground.js';
import { terrace } from './kit/terrace.js';

export const DISTRICT = {
  name: '夜雨城', en: 'NIGHT · RAIN',                 // the page's title and intro
  seed: 7,                                           // change it for a different city on the same streets
  streets: [ ... ],                                  // below
  route: [[-2, 60], [-2, -196], [200, -196]],        // the automatic stroll, there and back (default: down street 1)
  place: { cn: '夜雨城', en: 'NIGHT RAIN CITY' },                                // on the rain shelters' boards
  metroLine: { number: 1, name: '1号线', toward: '终点站', last: '' },              // optional
  words: { vertical: [], single: [], horizontal: [], offices: [] },              // below
  brands: [ ... ],                                   // below
  build(w, kit) { ... },                             // special places, below
  holograms: { rings: [], globes: [], helices: [], signs: [] },                  // below
  music: { x, z, track: 'galaxy' },                  // optional, below
  fill: true,                                        // fill the blocks between streets with towers (default)
};
```

## streets

Write them by hand, or start from a generated layout (`kit/layouts.js`: `gridLayout`, `radialLayout`,
`windingLayout`, `boulevardLayout`; each `({ seed, ... }) => { streets, route }`) and change it.

Each street is a straight segment. The first street's road is drawn over the others where they cross, so list the
main street first.

| key | default | meaning |
|---|---|---|
| `id` | `street-N` | name, used by `kit.beside` / `kit.on` and for random numbers |
| `from`, `to` | required | `[x, z]` ends |
| `road` | 7 | half the road's width (a 14 m road); 5-6 for side streets |
| `walk` | 6 | pavement width each side (buildings start at `road + walk` from the middle) |
| `lamps`, `trees`, `buildings`, `back` | true | street lamps; trees between them; buildings along it; taller towers further back |
| `bridges` | len / 120 | how many bridges between the towers over it (glass tubes or garden bridges) |
| `signs` | true | floating hologram signs over the pavements, every 60-110 m, from `words.horizontal` |
| `furniture` | true | flower beds and glass rain shelters (with an ad and the time/weather board) by the kerb |
| `adWalls` | 0.12 | chance a tower is given over to a wall of banner ads |
| `traffic` | true | flying cars over it |
| `shops` | [] | shops in the ground floors, below |

Streets may cross at any angle, meet end to middle, or just end. Kerbs, lamps, trees and buildings keep clear of
other streets automatically; where buildings of two streets would overlap, the later street's give way. Streets
closer than about 60 m side by side will leave little room for buildings between them.

### shops

```js
shops: [
  { u: 125, side: -1, width: 12, kind: 'cafe', brand: 'tea', name: '茶室 TEA ROOM', sign: 'text' },
  { u: 150, side: 1, width: 12, kind: 'convenience', brand: 'mart', sign: 'film', bulbs: true },
]
```

| key | meaning |
|---|---|
| `u` | metres along the street from `from` to the shop's middle |
| `side` | -1 left, +1 right, looking from `from` to `to` |
| `width` | its front along the street (8-16 m) |
| `kind` | `cafe`, `tea`, `icecream`, `dessert`, `bakery`, `florist`, `bookshop`, `umbrellas`, `cute`, `convenience`, `travel`, `diner`: its interior (kit/interiors.js) and default statue |
| `interior` | another kind's interior; `compact: true` for the compact one with a display or tables before it |
| `brand` | a brand key: its colour on the sign and the line of light under it, its ad high on the tower above |
| `name` | its name; default the brand's |
| `color` | its colour if it has no brand |
| `sign` | `text` (default: a screen of its name), `led`, `plate`, `pop` / `reveal` (animated), `film` (cinema film strip), `umbrella` (jellyfish umbrellas), `waves` (sound), `theme` (with `theme: 'icecream'` or `'moon'` or a theme object, kit/signs.js THEMES), `meow` (kitten faces; `animals: true` for many animals), `cafe-cups`, `polka`, `dusk`, `space-strip`, `cake-case`, `fogged` (see catalog.md) |
| `bulbs` | true: chasing theatre bulbs round the sign |
| `blade` | false: no blade sign out over the pavement (it follows the sign, else shows the brand's ad) |
| `islands` | (cafe) floating island seats, an island lamp in the window |
| `tables` | false: no tables outside (icecream) |
| `statue` | `'right'` (default) / `'left'` of the door, or `false`; `statueKind`: `cafe tea icecream dessert bakery medal florist books umbrella diner cat` |

Shops next to each other share one tower; a shop that would fall in a crossing or on something placed by `build()`
gets a `console.warn` and is left out: move it.

A few combinations from the example (`examples/showcase/district.js`):
`{ kind: 'cafe', brand: 'coffee', sign: 'cafe-cups', islands: true }`, `{ kind: 'dessert', brand: 'dessert', sign: 'cake-case' }`,
`{ kind: 'bakery', brand: 'bread', sign: 'dusk' }`, `{ kind: 'travel', brand: 'travel', sign: 'space-strip' }`,
`{ kind: 'diner', brand: 'diner', sign: 'fogged' }`, `{ kind: 'florist', brand: 'flowers', sign: 'polka' }`,
`{ kind: 'icecream', brand: 'icecream', sign: 'theme', theme: 'icecream' }`, `{ kind: 'tea', brand: 'milktea', sign: 'theme', theme: 'moon' }`,
`{ kind: 'cute', brand: 'gifts', sign: 'meow' }`.

## words

What signs, screens and holograms may show; drawn into one texture (`kit/atlas.js`).

- `vertical`: short words read top to bottom (blade signs): `['书店', '花店']`
- `single`: single characters for the giant-glyph screens: `['雾', '港']`
- `horizontal`: everything else (canopy signs, tickers, floating signs, station names). Chinese + English reads well:
  `'深夜营业 OPEN LATE'`. Any text passed to a hologram sign, a metro, a sunken plaza or a ring must be here.
- `offices`: names over office towers' doors (shown in white light), e.g. `'中心大厦 CENTRAL TOWER'`.

## brands

```js
brands: [
  { key: 'tea', name: '茶', en: 'TEA', color: '#5ad1ff' },
  { key: 'books', name: '书店', en: 'BOOKS', tagline: '', color: '#ffc46b', case: 'still-life',
    logo: (c) => { c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 0.8, 0, 7); c.stroke(); } },   // optional
]
```

Each brand gets a screen ad of its own (logo, name, tagline, its name sweeping in), shown across the city's screens
mixed with the motion graphics. `case: '<scene>'` shows its ads on ad walls and rain shelters as a lit case instead
(kit/scenes.js; the list in catalog.md), e.g. `case: 'gelato-pop'`; a travel shop shows it behind its counter. `logo(ctx)` draws in white on a canvas scaled so the logo fits -1..1; without it, the
first character of its name in a ring. Its colour shows in its lights: its signs, ads and cases. At most 24.

## build(w, kit): special places

Runs before the streets are built; whatever a piece claims, the streets' buildings keep off.

- `kit.beside(streetId, u, side, gap = 0)` - a spot where that street's buildings would begin, `u` along it on `side`,
  turned so local -z points away from the street: for things entered from the pavement (plazas, terraces, metro).
- `kit.on(streetId, u, across = 0)` - a spot on the street, local -z along it.
- `kit.place(spot, () => piece(w, options))` - build a piece in that spot's frame; if it returns `{ claim }`, that
  rectangle is kept free of buildings.
- `kit.claim(corners)` - keep any rectangle (four world `[x, z]` corners) free.

Pieces (details in [pieces.md](pieces.md)):

```js
build(w, kit) {
  kit.place(kit.beside('avenue', 250, -1, 1), () => metro(w, {
    name: '地铁站 METRO', signs: { gates: '列车即将到站 TRAIN ARRIVING', welcome: '欢迎 WELCOME' },
    shops: [{ kind: 'florist', name: '花间 FLORIST' }, { kind: 'bakery' }, { kind: 'cafe' }],
  }));
  kit.place(kit.beside('cross', 420, 1, 1), () => sunkenPlaza(w, { width: 26, length: 44, name: 'cross-plaza' }));
  kit.place(kit.beside('avenue', 70, 1, 1), () => terrace(w, { width: 36, depth: 26 }));
  kit.place(kit.beside('cross', 150, 1, 5), () => boidsCube(w));          // import from './kit/sculptures.js'
  kit.place(kit.beside('slant', 150, -1, 8), () => solarSystem(w));
}
```

## holograms

```js
holograms: {
  rings: [{ x: 0, z: -200, y: 27, text: '夜雨城 NIGHT RAIN CITY', text2: '欢迎 WELCOME' }],   // rings of words on a beam (over a crossing)
  globes: [{ x: 0, z: -470, y: 24, r: 7 }],                                         // a turning globe with orbits
  helices: [{ x: 40, z: -300, h: 20 }],                                             // a double helix of dots
  signs: [{ x: -9.5, y: 3.1, z: -60, text: '北 NORTH', back: '南 SOUTH', rotY: Math.PI / 2, size: 1, white: false }],
},
```

Floating signs face +z when `rotY` is 0; `back` is what the other side says. Place rings over crossings, high enough
(y 24-30) to clear bridges.

## models (optional)

`models: { whale: 'assets/models/whale.glb' }`: glTF models loaded before the city is built, as `w.models.whale` in
`build()`, for `holoModel` (holograms or sculptures). See models.md.

## music (optional)

`music: { x, z, track, near = 20, far = 60, everywhere = 0.15 }` - a place of music (put a concert hall or a shop
with `sign: 'waves'` there): heard softly everywhere, fully within `near` m. Tracks: `galaxy` (银河列车),
`summer` (夏夜), `isle` (星屿夜雨), `fields` (萤火原野).
