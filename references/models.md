# Models of your own

The city is built from code, but a district can bring in models (a whale over a plaza, a mascot, a statue) and show
them as holograms or sculptures in the house style (`kit/holomodel.js`).

## 1. Where the model comes from (ask first)

Use only what the user may use and share:

- the user's own model, or one they ask you to use and say they have the right to;
- a model under a licence that allows reuse: CC0 / public domain are simplest; CC BY needs the author credited
  (write it into the project's CREDITS; if the city is put online, also on the page: a credits panel, or a link to
  CREDITS); check "no derivatives" or "non-commercial" terms against what the user
  wants to do with the city;
- or make one in Blender from simple shapes (`blender/build_cat_statue.py` is an example).

If you cannot tell where a model is from or what it allows, ask the user rather than use it. Never take models,
textures or icons from a site without a stated licence.

## 2. Make it ready

```bash
blender -b -P blender/prepare_model.py -- source.glb assets/models/whale.glb --tris 20000 --height 3 --preview preview.png
```

It joins the meshes, applies transforms (and a pose, for a rigged model), drops materials and textures (the city
colours it), decimates to at most `--tris` triangles, sets its foot on the ground and its middle over the origin,
and exports `.glb`. `--turn` degrees about the vertical if it faces the wrong way (it should face glTF's +Z); look
at `--preview`. Keep holograms under about 20 000 triangles and sculptures under 50 000.

## 3. Use it

```js
models: { whale: 'assets/models/whale.glb' },          // in DISTRICT: loaded before the city is built
build(w, kit) {
  kit.place({ x: 40, z: -260, yaw: 0 }, () => holoModel(w, w.models.whale, { height: 8, y: 10, spin: 0.05, base: false }));
  kit.place(kit.beside('cross', 250, 1, 4), () => holoModel(w, w.models.cat, { height: 3.6, y: 1.4, spin: 0.25 }));
  kit.place(kit.beside('avenue', 90, -1, 3), () => holoModel(w, w.models.cat, { height: 2.2, solid: true }));
}
```

`holoModel(w, model, options)`: `height` shown, `y` its foot over the ground, `yaw`, `spin` (radians a second; 0
still), `bob` (how far it rises and falls), `color` (its body's light), `base` (a projector's base and beam; false:
hung in the air), `solid` (a sculpture on a plinth instead, in the city's tones; `albedo`).

## Moving models

`holoModel` turns and bobs a model as a whole. To play a model's own animation, load it with its skeleton
(`prepare_model.py` drops animations: export your own), create a `THREE.AnimationMixer` for it in `main.js`, give
its meshes `holoMaterial3D()`, add it to the scene on `LAYER.GLOW`, and call `mixer.update(dt)` in the frame loop.
Or move it in its vertex shader, as the city's people walk.
