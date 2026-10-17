# What is ready to use

Everything here is a design in the house style; you choose names, colours and places. Brand and shop names come
from the district (`brands`, `streets[].shops`): nothing here carries a name of its own.

## Street layouts (kit/layouts.js)

`gridLayout` (a turned grid, blocks of different sizes), `radialLayout` (spokes from an open middle, a ring road),
`windingLayout` (a main street bending as a river would, side streets off it), `boulevardLayout` (one long
boulevard, side streets crossing it or off it at any angle); each varied by its seed and options.

## Buildings (kit/buildings.js; generated along every street)

- **Plots**: `line` (a tower on the street line), `forecourt` (set back behind planters and benches), `plaza` (set well
  back: pools, groves, kiosks, sculptures, lawns, tables; sometimes a covered square under a cantilever), `podium`
  (a low glass podium, a roof garden, the tower set back on it); garden alleys between plots; taller towers behind.
- **Towers**: plans rect / rounded / chamfer / round, set back in tiers; facades (glass rooms lit or dark): clear, floor
  bands, slender, pale frame, diagrid, staggered panels, waving fins, wave ribbons; balconies or fins; a crown of
  light; spire and beacon on the tallest.
- **Contemporary tops**: twist, stack, sky garden, diagrid, green terraces, flowing oval, cantilever.
- **On their faces**: great screens, curved corner screens, ad walls of banners, blade signs, entrance canopies with
  a sign, office names over doors (`words.offices`).

## Screens and ads

- **Motion graphics** (core/screens.js): glyph rain, pulse rings, equalizer, sign words, rings, neon horizon, giant
  glyph, oscilloscope, ticker, ribbons, liquid blobs, hex tunnel, interference, vortex, glowing cells.
- **Brand ads**: every brand gets a screen ad (its logo, name sweeping in, tagline).
- **Brand ad cases** (kit/cases.js, kit/scenes.js; `brands[].case`): a shallow lit case instead of a screen, on ad
  walls and rain shelters: `still-life` (default), `swim-ring`, `metro-train`, `satellite-dish`, `noodle-lantern`
  (things set out in it, drifting air), and moving pictures: `pixel-cafe` (a cup on a cloud, lit pixel by pixel),
  `flower-field` (a field of flowers in dots opening in a gust, fireflies), `dot-bouquet`, `dusk-bakery` (breads before
  a setting sun), `rain-window` (a fogged window, drops running), `moon-river` (the moon setting over a river, a tea
  before it), `gelato-pop` (an ice cream's anime opening), `tide-town` (a coastal town as the tide comes in),
  `cake-rows` (rows of cakes going by), `blind-boxes` (animals popping out of boxes), `kitten` (kitten faces in LED
  dots), `cinema` / `cinema-film` / `cinema-beam`, `sound-waves`, `jellyfish` (umbrellas drifting up).

## Shops (kit/shops.js, kit/interiors.js; `streets[].shops`)

A shop is four parts chosen apart; `kind` sets the interior and the default statue.
Every street shop has a glass front with an automatic sliding door in the middle (it opens as one comes near).

- **Interiors** (room: a whole 8 m street shop; compact: the back 3.4 m, also for a metro's small shops):
  cafe (room, compact; `islands: true` floating island seats and an island lamp), tea (room: jars, sealers, moon
  lanterns, moon-print totes, soft moons; compact), icecream (room: freezer counter, cone stand, freezer of pints,
  tables outside; compact), dessert (room, compact), bakery (room: breads as glyphs in one ink and a row of medallions;
  compact), florist (room, compact), bookshop (room, compact), umbrellas (room: open umbrellas hung lit, fireflies;
  compact), cute (room: plush kittens on every wall; compact), convenience (compact), travel (room: counter, brochures,
  a corner to sit in, the brand's case), diner (room, dim: a counter at the window, low lamps, a lit pass).
- **Signs** (`sign`): `text`, `led`, `plate`, `pop`, `reveal`, `film` (cinema film strip), `umbrella`, `waves`,
  `theme` (`icecream` pink clouds and cones / `moon` night-blue moons and cups / your own theme), `meow` (kitten
  faces), `cafe-cups` (its name by a cup on a clear screen), `polka` (polka dots and flowers of dots), `dusk` (a
  serif name between breads, pale yellow-green), `space-strip` (the Earth's edge and a station's wheel going by),
  `cake-case` (cakes going by behind its nameplate), `fogged` (its name written in the fog on its glass); `bulbs`
  chasing theatre bulbs round any of them.
- **Blade signs**: follow the sign (its mark, a kitten's face, three coffees, a flower of dots, one bread at a time,
  a corner of a station's wheel, one cake, a fogged window with a bowl), else the brand's ad.
- **Statues** (`statueKind`): cafe, tea, icecream, dessert, bakery, medal, florist, books, umbrella (hologram
  jellyfish), diner, cat (the Blender cat, glowing eyes and collar).

## Street

Lamps with beam cones, trees (some with fairy lights or light rings), flower beds, glass rain shelters (an ad or
case, the time / weather / next-train board), glass and garden bridges with tickers, floating hologram signs,
flying traffic, people under umbrellas, sitting, standing.

## Places (district `build`)

`terrace` (broad steps, forecourt, a deck with a long lit stair, a tower behind), `sunkenPlaza` (steps, wet mirror
floor, rock walls, a lit arcade, trees), `metro` (pavilion, escalators, concourse with small shops and machines,
gates, screen doors, track), `fountain` (the extending example).

## Sculptures and holograms

`boidsCube` (216 light cubes flying up as a flock and settling back), `solarSystem` (planets on rings of light over
a plinth), hologram rings of words, globes, helices, floating signs, and `holoModel` (any model of your own as a
hologram or a sculpture, see models.md).

## Sound

Rain (near, far, a wash; muffled indoors), drips, footsteps; music for a place of music (`district.music`): galaxy,
summer, isle, fields.

## On screen

Bottom right: the rain (light, medium, heavy), sound on/off, and over them two
sliders kept in the browser: 步速 (walking speed, from a walk to half again a run; default between) and 音乐 (the
music's loudness, clearly heard at its place by default; shown only if the district has `music`).
