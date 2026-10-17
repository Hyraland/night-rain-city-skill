# The look

A walk down a street of a future city at night in steady rain. Calm, cinematic, a little dreamy, in the manner of
anime backgrounds: flat tones, clean shapes, lit lines; never gritty, never dirty, no clutter for its own sake.

## Colour and light

- **Three tones**. Every lit surface falls into one of three flat bands:
  deep navy shadow (`#0b2130`), teal mid-tone (`#2a7c93`), near-white light (`#e8f5f5`), with a soft cyan tint in the
  light. Fog fades to black at a distance; the sky is near-black with a faint haze. The whole city's hue can be
  turned (tuning.json `hue`), but stay in cyan-blue.
- **Light comes from things**: street lamps (pools of light on the wet ground, a faint beam cone in the rain), lit
  screens and signs (they throw light onto what faces them: `w.emitter`), shop windows, holograms. One moon light
  from high in the south-west casts the shadows. No three.js lights.
- **Bloom** only on what is truly bright: lamp heads, LED dots, edge lines, rain caught in light. Values above about
  1.0 in glow colours bloom; keep big surfaces below it (a white screen should not blow out).
- **Edges**: an ink outline round everything; thin lines of light (cyan `[0.35, 1.5, 1.7]`, white
  `[1.7, 1.9, 1.9]`, soft `[0.8, 1.0, 1.0]`, dim `[0.25, 0.5, 0.55]`) along kerbs, rails, canopies, steps, roof edges.

## The street

- Wet everywhere: the road and pavements mirror the city (planar reflection), puddles ripple with drops. Roads are
  paved in long slabs with two lines of light set in them; pavements in square slabs.
- Pavements 5-6 m, with lamps every 32 m on both sides out of step, a tree halfway between, flower beds and glass
  rain shelters between them, people under umbrellas walking.
- Over the street: glass bridges and garden bridges between towers, flying cars in lanes high up, hologram rings and
  globes over crossings, small floating signs over the pavements.

## Buildings

- **Glass towers** dominate: curtain walls with rooms behind (some lit, warm-white, in irregular patterns), floor
  bands, fins or balconies on some; plans rect / rounded / chamfered / round; set back in tiers as they rise; a crown
  line of light; the tallest with a spire and a slow beacon.
- **Contemporary tops** on many tall towers: twisting stacks, offset boxes, sky gardens, terraced green homes,
  flowing ovals, cantilevered blocks.
- **Street level is human and bright**: lobbies glowing, shop fronts of glass with bright rooms behind, canopies,
  forecourts and plazas with trees in planters, benches, kiosks, sculptures, lawns.
- **Screens are big**: on tower faces (motion graphics, brand ads, tickers, giant single characters), curved round
  rounded corners; ad walls of banners; blade signs down narrow fronts.

## Signs and words

- Light only: LED dots, screens, holograms (scan lines, flicker, a slipped band now and then). Chinese words with an
  English line under or after them. Fonts: PingFang / Noto Sans SC by default (tuning.json `fonts`).
- Brand colours appear in small doses, and only in light: a sign, a line under it, its ads and cases. Solid things
  stay in the city's tones.
- Shop signs: names on the fascia (`text`, `led`, `plate`, animated), cinema film strips, jellyfish umbrellas, sound
  waves; chasing bulbs for something theatrical.

## Do

- Keep the palette; add colour through light and brands, not through painted surfaces.
- Give every new thing an edge line of light or a lit part, and register the light it throws (`w.emitter`, `w.lamp`).
- Keep things to scale: eye height 1.7 m, ground floor 5.2 m (`LOBBY`), floors about 4 m, lamps 8.4 m.
- Fill the frame: skyline towers behind, screens at several heights, something lit at every corner.

## Don't

- Don't use realistic PBR materials, image textures on buildings, HDR skies, daylight, or saturated rainbow colours.
- Don't add three.js lights, shadows of your own, or post effects; the pipeline does that.
- Don't leave big blank walls or empty flat ground in view: plazas get trees, benches, people, light.
- Don't put words on screens that are not in the district's `words` (they come out blank or wrong).
