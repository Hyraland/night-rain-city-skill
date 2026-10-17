# Running and checking a city

## Run

```bash
cd <city> && python3 serve.py 5189
```

Open `http://localhost:5189/`. `serve.py` sends no-cache headers and loads scripts from a fresh path each visit, so
a reload always shows the latest code. three.js 0.169 comes from jsDelivr (needs the network).

- `?skip` - straight in, no intro.
- `?at=x,y,z&to=x,y,z` - the camera fixed at `at`, looking at `to` (for screenshots).
- Keys: drag to look, WASD to walk (W twice to run), Space switches the automatic stroll and free walking, R rain,
  M sound.

## The console

`window.__city`:

- `__city.look([x, y, z], [tx, ty, tz])` - fix the camera there (the stroll stops).
- `__city.groundAt(x, z)` - what one would stand on there (checks stairs, terraces, ways down).
- `__city.city` - what was built: `plots`, `streets` (each with its `plots`), `roads`, `holes`, `lamps`, `emitters`,
  `colliders`, `covers`, `floors`, `holoSigns`, `bounds`, `route`.
- `__city.renderer.info.render` - draw calls and triangles of the last pass.

## A check, every time

1. The page loads to the intro; the console shows no errors, and no `console.warn` (a shop without room, too many
   holes, words not found).
2. Screenshots from street height (`y = 1.85`) along each street both ways, at every crossing, before every placed
   piece and shop, and one from high above (`?at=0,900,-300&to=0,0,-301`) to see the layout. Look for: buildings in
   the road or overlapping, empty flat ground, walls blocking pavements, signs mirrored or blank, things floating or
   sunk.
3. Walk: the stroll runs its route without passing through walls; `groundAt` gives the expected heights on stairs,
   terraces, plazas, ways down.
4. Frame time: with the page in view, sample `requestAnimationFrame` intervals for a second at a few places; it should
   stay near the display's refresh (about 8-17 ms). If not, look for pieces with many meshes or huge segment counts.

A hidden or background browser tab throttles rendering; measure only with the page visible.
