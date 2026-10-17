---
name: night-rain-city
description: Build a walkable three.js night city in the night rain city style - three-tone cyan toon shading, wet mirror-like streets, glass towers with lit rooms, LED and hologram signs, flying traffic, rain and its sound - with any street layout, shops, plazas and metro stations you choose. Use when someone wants a rainy neon/cyberpunk/future city street, district or walk in this look, or wants to add streets, shops, a sunken plaza, a terrace or a metro to one.
---

# Night rain city

A style kit, not a copy of one city. `engine/` is a complete, working three.js page; a city is one data file,
`engine/src/district.js`, that says where the streets run and what is on them. Everything along the streets (towers,
plazas, lamps, trees, people, ads, bridges, rain shelters, traffic) is generated in the house style; special places
(shops, a sunken plaza, a terrace, a metro station) are placed where you like with a few lines each.

## Workflow

1. **Copy the engine** into the user's project: `cp -R <this skill>/engine <project>/<city-name>`. Do not edit the
   copy inside the skill.
2. **Plan the district** with the user: its name, the streets (straight segments, any angles, crossings allowed),
   which shops and brands, which special places. Sketch coordinates first: x east, z south, metres; a long street is
   500-900 m, a side street 200-400 m.
3. **Write `src/district.js`** (see [references/district.md](references/district.md)). It starts blank (two streets);
   `examples/showcase/district.js` shows every part in use: read it for how, but give the city its own name, streets,
   words, brands and shops (the showcase's names are placeholders: 咖啡, 书店...). Every word a sign or hologram
   shows must be listed in `words` (shop names are added automatically).
4. **Run it**: `cd <city> && python3 serve.py 5189` and open `http://localhost:5189/`. Use any free port; the page
   loads three.js from a CDN. `?skip` leaves out the intro; `?at=x,y,z&to=x,y,z` puts the camera at a fixed spot.
5. **Check it** (see [references/testing.md](references/testing.md)): no console errors and no `console.warn` about
   shops that found no room; walk the route; screenshot each street, every crossing, every placed piece from street
   height (eye 1.7 m above the pavement, which is at y = 0.15). Fix, reload, repeat.
6. **Stop the server** when done.

## Make each city its own

Every city should look like no other. The blank `district.js` and the showcase are starting points, not layouts
to reuse:

- **Ask first** what the user has in mind: the city's name and mood, how its streets run (a grid, streets round a
  middle, a street winding as a river would, one long boulevard, a few streets crossing at odd angles), what shops,
  places and landmarks it has. Whatever they say decides it.
- **When they leave it to you, choose and vary**: pick a layout kind at random (`kit/layouts.js`: `gridLayout`,
  `radialLayout`, `windingLayout`, `boulevardLayout`, each varied by its seed and options), or draw your own; then
  change it: move, lengthen, add or take away streets. Never copy the template's or the showcase's streets.
- **A new `seed`** for every city (any number, e.g. from the time): it changes every tower, plaza, screen and tree.
- **Its own mix**: which shops and how many, their signs, which places (a metro or not, a sunken plaza, a terrace),
  which sculptures and holograms, where. Different cities, different choices.

```js
import { windingLayout } from './kit/layouts.js';
const layout = windingLayout({ seed: 4127, bends: 5, sides: 3 });
export const DISTRICT = { name: '…', seed: 4127, ...layout, /* words, brands, shops, build… */ };
```

(To put shops on a generated street, add `shops: [...]` to it: `layout.streets.find((s) => s.id === 'main').shops = [...]`.)

## What the kit has ready, and what you write

Ready-made, in the house style ([references/catalog.md](references/catalog.md) lists them all): streets and their
towers, screens, ad walls, bridges, shelters, traffic and people; shops put together from an interior (cafe, tea,
ice cream, dessert, bakery, florist, bookshop, umbrellas, gifts, convenience store, travel agent, diner), a sign
(over a dozen styles), a blade sign and a statue; brands' ads as screens or as lit cases with moving pictures;
a terrace, a sunken plaza, a metro station; sculptures, holograms, and models of the user's own as holograms
([references/models.md](references/models.md)).

Yours to write: the district's name, its streets, its words, its brands (names, taglines, colours, which case),
which shop goes where and how it is dressed. Anything not in the catalog you design yourself, in the style, as a
new piece (see "Making new things"); icons, pictures or models from elsewhere only with a clear free licence, or
from the user.

## The look (keep it)

Read [references/style.md](references/style.md) before adding anything of your own. In short:

- Night, rain, a cyan-blue world in three flat tones: dark navy shadow, teal
  mid-tone, near-white light. Accents only from lights: screens, LED signs, neon lines, brand colours in small doses.
- Everything solid is drawn with the kit's materials (`w.props`, `w.glass`, `w.glow`...): never `MeshStandardMaterial`
  or textures of your own on buildings. Light comes from lamps and emitters registered with the world, not three.js
  lights.
- The street is wet: roads and pavements mirror the city. Thin cyan/white lines of light edge things (kerbs, rails,
  canopies, steps). Big glass towers with lit rooms, set back in tiers, some with contemporary tops.
- Signs are light: LED dots, screens, holograms. Words in Chinese with an English line are typical.

## Making new things

Prefer the kit's pieces and options. To add something new (a fountain, a kiosk, a new kind of shop), write a
function that builds in a frame with the world's helpers, like `kit/terrace.js` does; see
[references/pieces.md](references/pieces.md) for the world API and [references/extending.md](references/extending.md)
for the rules (frames, layers, light budget, lots, random numbers by name).

## Limits

At most 32 streets, 8 holes in the ground (each sunken plaza uses 2, each metro 1), 24 brands, and the nearest 24
lamps and 24 emitters light any one frame. See [references/pitfalls.md](references/pitfalls.md).
