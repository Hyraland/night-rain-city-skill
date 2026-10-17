# Limits and pitfalls

| limit | why | what happens |
|---|---|---|
| 32 streets | the ground shader cuts the pavement over each road (`uRoads[32]`) | `buildCity` throws |
| 8 holes in the ground | `uHoles[8]` (sunken plaza: 2, metro: 1, each `w.hole`: 1) | extra holes not cut; warning |
| 24 brands | brand colour adjustments `uCaseAdj[24]` | later brands' colours can't be turned (tuning.json `caseColors`) |
| nearest lights | 24 lamps, 24 emitters, 4 hologram lights per frame | far lights don't light; crowded areas flicker as the choice changes |
| 1 atlas | all words drawn once (2048 wide) | a few hundred words are fine; very long lists make the texture tall |

- **Words**: a hologram, screen or sign given text that is not in `district.words` shows the first word instead.
  Shop names are added automatically; station names, metro signs, plaza or ring texts are not.
- **Street order matters**: the first street's road is drawn over later ones at crossings, and earlier streets'
  buildings win where two streets' plots overlap.
- **Streets too close** (parallel and under ~60 m apart) leave thin or no plots; crossing streets at very shallow
  angles leave long sliver gaps: prefer crossings at 30 degrees or more.
- **Shops** need a clear stretch of street front: not within a crossing (other street's pavement + 8 m), not where
  `build()` claimed. A warning names any shop left out.
- **Pieces over roads**: `kit.beside` places at the building line; `kit.on` places on the street itself, which only
  suits things meant to stand in the road (a fountain in a pedestrian street, a hologram base).
- **Rain under rotated roofs**: covers are kept as boxes square to the world; under a roof on a diagonal street a
  little rain may fall at its corners or be kept off just beyond it.
- **Flicker on walls** (stair-stepped light and dark patches that crawl as one moves): two faces in one plane
  (z-fighting), e.g. a room's wall built flush with a glass building's face. Move one back 0.02-0.15 m.
- **Rain indoors** (streaks, splashes, a wet floor inside a room): the room needs `w.cover(x0, x1, z0, z1, y, true)`
  under its ceiling, and its floor a hair (0.01 m) over the pavement, not in its plane.
- **Same city every load**: never use `Math.random()` in building code; use `w.rng(name)`. `seed` changes the whole
  city; renaming a street changes what is along it.
- **Hidden tabs** throttle rendering and timers: don't judge performance or animation from a background tab.
- **Fonts**: web fonts (tuning.json `fonts`, e.g. 站酷快乐体) load from Google Fonts; offline they fall back to system
  fonts.
