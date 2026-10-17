// What a brand's ad case (kit/cases.js brandCase) shows: a brand names one (brands[].case), or a case is given one.
// Two sorts:
//   still lifes   hero (the one great thing, in the middle, or to one side of a banner, at the top of a tall
//                 strip), small (a smaller thing repeated beside it where there is room), air (what drifts:
//                 stars, steam, bubbles, fireflies, rain, notes, sparkles, motes)
//   moving pictures  a flag the case draws in its own way: pixel (a cup of coffee on a cloud, lit pixel by pixel),
//                 bloom (a field of flowers in dots, opening in a gust), bouquet, dawn (breads before a setting
//                 sun), rainwin (a fogged window), moon (the moon setting over a river, a tea before it), pop (an ice
//                 cream's anime opening), tide (a coastal town as the tide comes in), strips (rows of cakes going
//                 by), shelf (blind boxes, animals popping out), ledcat / tiles (kittens in LED dots), cinema,
//                 waves (sound), umbrellaLED (umbrellas drifting up as jellyfish)
// Things are built in a unit frame: x across from -0.5 to 0.5, y up from 0 (where they stand) to 1, z through it
// from -0.5 to 0.5 (the case squeezes them flatter, a relief), with few sides, low-poly as the city's own things.
// P.solid(geometry, colour, albedo) is a thing as the case makes it (cut from paper of that colour, low-poly and
// lit, or dark against the light), P.light(geometry, rgb) one that glows in its own colour; in strips, P.cut a
// part cut out of a thing. The keys:
//   still lifes   still-life swim-ring metro-train satellite-dish noodle-lantern (and the heroes of the others)
//   moving        pixel-cafe flower-field dot-bouquet dusk-bakery rain-window moon-river gelato-pop tide-town
//                 cake-rows (cake-sign, cake-blade, cake-menu: as a shop's sign, blade sign, menu) blind-boxes
//                 kitten (kitten-face, kitten-tiles, kitten-tiles-6x3: chosen by its shape) cinema (cinema-film,
//                 cinema-beam, cinema-bright) sound-waves jellyfish

import * as THREE from 'three';

const cyl = (r0, r1, h, y = 0, n = 16) => new THREE.CylinderGeometry(r0, r1, h, Math.min(n, 9)).translate(0, y + h / 2, 0);
const ball = (r, x, y, z = 0, n = 14) => new THREE.SphereGeometry(r, Math.min(n, 8), 5).translate(x, y, z);
const cube = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
// a ring standing upright, facing out of the case
const hoop = (r, t, x, y, arc = Math.PI * 2, n = 40) => new THREE.TorusGeometry(r, t, 4, Math.min(n, 14), arc).translate(x, y, 0);

// a flat shape from its outline's points (x, y), facing out of the case
const flat = (pts) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
const WARM = [1.6, 1.35, 0.9], WHITE = [1.6, 1.6, 1.6], CYAN = [0.5, 1.5, 1.7];

export const SCENES = {
  // a cup of coffee floating on a cloud, lit one pixel after another (makeCase, scene.pixel); hero and small
  // kept for a case made the plain way
  'pixel-cafe': {
    pixel: true,
    hero(P) {
      P.solid(cyl(0.42, 0.42, 0.04, 0.02, 28), '#f2ece2');
      P.solid(cyl(0.26, 0.2, 0.42, 0.06, 24), '#f7f1e6');
      P.solid(cyl(0.245, 0.245, 0.02, 0.45, 24), '#5a3a26');
      P.solid(hoop(0.11, 0.03, 0.3, 0.3, Math.PI * 1.3).rotateZ(-0.6), '#f7f1e6');
    },
    small(P) {                                                                   // a cup to take away
      P.solid(cyl(0.2, 0.15, 0.62, 0, 18), '#f2ece2');
      P.solid(cyl(0.205, 0.205, 0.16, 0.25, 18), '#a8662f');
      P.solid(cyl(0.21, 0.21, 0.06, 0.62, 18), '#3a2a20');
    },
    air: 'steam',
  },
  // a swimming ring, striped, on the water's light
  'swim-ring': {
    hero(P) {
      for (let k = 0; k < 8; k++) P.solid(new THREE.TorusGeometry(0.3, 0.1, 4, 8, Math.PI / 4).rotateZ(k * Math.PI / 4).translate(0, 0.45, 0), k % 2 ? '#ffffff' : '#e63946');
      for (let k = 0; k < 3; k++) P.light(cube(1.0, 0.025, 0.1, 0, 0.05 + k * 0.07, 0.3), [0.4, 1.1 - k * 0.15, 1.7]);
    },
    small(P) {                                                                   // the pool's ladder
      for (const e of [-1, 1]) {
        P.solid(cube(0.04, 0.7, 0.04, e * 0.18, 0), '#d8dde6');
        P.solid(new THREE.TorusGeometry(0.1, 0.02, 4, 12, Math.PI).rotateY(Math.PI / 2).translate(e * 0.18, 0.7, 0.1), '#d8dde6');
      }
      for (let k = 0; k < 3; k++) P.solid(cube(0.36, 0.03, 0.12, 0, 0.15 + k * 0.18), '#aeb6c2');
    },
    air: 'bubbles',
  },
  // an umbrella open, its rim alight, and one furled
  // (in a case, makeCase draws the umbrella shop's in LED dots instead: umbrellas drifting up as jellyfish, umbrellaLED;
  // hero and small kept for anything else)
  'jellyfish': {
    umbrellaLED: true,
    hero(P) {
      P.solid(new THREE.ConeGeometry(0.46, 0.22, 8, 1, true).translate(0, 0.78, 0), '#2a9d8f');
      P.light(new THREE.TorusGeometry(0.46, 0.015, 4, 14).rotateX(Math.PI / 2).translate(0, 0.67, 0), [0.8, 1.7, 0.6]);
      P.solid(cube(0.025, 0.7, 0.025, 0, 0.0), '#3d4b5a');
      P.solid(hoop(0.06, 0.018, 0.06, 0.02, Math.PI).rotateZ(Math.PI), '#3d4b5a');
    },
    small(P) {
      P.solid(new THREE.ConeGeometry(0.07, 0.7, 8).rotateX(Math.PI).translate(0, 0.45, 0), '#8338ec');
      P.solid(cube(0.02, 0.25, 0.02, 0, 0.75), '#3d4b5a');
      P.light(ball(0.03, 0, 1.0), [0.8, 1.7, 0.6]);
    },
    air: 'rain',
  },
  // the front of a train coming in, its headlights on
  'metro-train': {
    hero(P) {
      P.solid(cube(0.9, 0.62, 0.5, 0, 0.08), '#e8ecf2');
      P.solid(ball(0.3, 0, 0.42, 0.18).scale(1.45, 0.95, 0.6), '#e8ecf2');
      P.light(cube(0.66, 0.16, 0.05, 0, 0.48, 0.32), [0.5, 1.3, 1.6]);
      for (const e of [-1, 1]) P.light(ball(0.045, e * 0.3, 0.24, 0.3), WHITE);
      P.solid(cube(0.9, 0.05, 0.5, 0, 0.0), '#3d4b5a');
    },
    small(P) {                                                                   // the line's roundel
      P.light(hoop(0.3, 0.05, 0, 0.5), [0.4, 1.4, 1.6]);
      P.solid(cube(0.8, 0.12, 0.08, 0, 0.44), '#2b4c7e');
    },
    air: 'motes',
  },
  // plants on a roof at night, a flower open, fireflies over them
  // (in a case: a field of flowers made of dots, opening as a gust crosses it, fireflies over it: makeCase,
  // scene.bloom; hero and small for anything else)
  'flower-field': {
    bloom: true,
    hero(P) {
      for (let k = 0; k < 9; k++) {
        const a = -0.5 + k * 0.125, h = 0.35 + 0.4 * Math.abs(Math.sin(k * 2.3));
        P.solid(cube(0.02, h, 0.02, a * 0.7, 0).rotateZ(a * 0.4), '#3f6b4a');
        P.solid(new THREE.IcosahedronGeometry(0.12, 0).scale(1, 0.45, 0.8).rotateZ(a).translate(a * 0.7 + a * 0.15, h, 0), '#4f8a4c');
      }
      for (const [x, y, c] of [[-0.15, 0.78, [1.6, 0.7, 1.2]], [0.22, 0.62, [1.6, 1.3, 0.5]]]) P.light(ball(0.07, x, y, 0.1), c);
    },
    small(P) {
      P.solid(cyl(0.2, 0.16, 0.3, 0, 16), '#b0603e');
      for (let k = 0; k < 5; k++) P.solid(new THREE.IcosahedronGeometry(0.14, 0).scale(0.7, 1, 0.6).rotateZ((k - 2) * 0.5).translate((k - 2) * 0.08, 0.5, 0), '#4f8a4c');
    },
    air: 'fireflies',
  },
  // a turbine turning in the tide, the sea's light under it
  // (the tide seen from above, coming in and going out, the town's lights coming on: brandCase, tide;
  // its hero and small things no longer shown)
  'tide-town': {
    tide: true,
    hero(P) {
      P.solid(cube(0.05, 0.62, 0.05, 0, 0), '#d8dde6');
      P.solid(ball(0.06, 0, 0.64, 0.04), '#e8ecf2');
      for (let k = 0; k < 3; k++) P.solid(cube(0.06, 0.38, 0.02).translate(0, 0.02, 0).rotateZ(k * Math.PI * 2 / 3).translate(0, 0.64, 0.06), '#e8ecf2');
      for (let k = 0; k < 4; k++) P.light(new THREE.TorusGeometry(0.5, 0.012, 4, 14, Math.PI).translate(0, -0.42 + k * 0.05, 0.25), [0.4, 1.6 - k * 0.15, 1.3]);
    },
    small(P) {                                                                   // a cell, charged
      P.solid(cube(0.36, 0.7, 0.3), '#3d4b5a');
      P.solid(cube(0.14, 0.06, 0.12, 0, 0.7), '#aeb6c2');
      for (let k = 0; k < 4; k++) P.light(cube(0.26, 0.11, 0.04, 0, 0.06 + k * 0.15, 0.15), [0.4, 1.6, 1.2]);
    },
    air: 'rain',
  },
  // a microphone on its stand, lit from above, notes in the air
  // (in a case, makeCase draws the music hall's as a river of sound in LED dots instead: concertWaves; hero and small
  // kept for anything else)
  'sound-waves': {
    waves: true,
    hero(P) {
      P.solid(cyl(0.2, 0.22, 0.03, 0, 20), '#2a2f3a');
      P.solid(cube(0.025, 0.7, 0.025, 0, 0.03), '#3d4b5a');
      P.solid(cyl(0.05, 0.04, 0.16, 0.66, 12), '#2a2f3a');
      P.solid(ball(0.08, 0, 0.88), '#aeb6c2');
      P.light(new THREE.ConeGeometry(0.45, 0.9, 8, 1, true).translate(0, 0.55, -0.3), [0.25, 0.15, 0.4]);
    },
    small(P) {                                                                   // a note
      P.solid(ball(0.13, -0.08, 0.2).scale(1.3, 1, 1), '#2a2f3a');
      P.solid(cube(0.035, 0.6, 0.035, 0.08, 0.2), '#2a2f3a');
      P.solid(cube(0.2, 0.06, 0.035, 0.17, 0.74).rotateZ(-0.3), '#2a2f3a');
    },
    air: 'notes',
  },
  // a reel of film and the moon
  // (in a case, makeCase draws the cinema's in LED dots instead: cinemaLED; hero and small kept for anything else)
  'cinema': {
    cinema: true,
    hero(P) {
      P.solid(cyl(0.34, 0.34, 0.06, 0, 32).rotateX(Math.PI / 2).translate(0, 0.4, 0), '#2a2f3a');
      for (let k = 0; k < 5; k++) P.solid(ball(0.08, Math.cos(k * 1.257) * 0.18, 0.4 + Math.sin(k * 1.257) * 0.18, 0.04, 10).scale(1, 1, 0.3), '#5f6a75');
      P.solid(cube(0.6, 0.04, 0.02, 0.3, 0.06), '#2a2f3a');
      P.light(new THREE.TorusGeometry(0.16, 0.06, 4, 14, Math.PI * 1.2).rotateZ(1.2).translate(0.3, 0.86, 0), [1.7, 1.5, 0.9]);
    },
    small(P) {                                                                   // popcorn
      for (let k = 0; k < 5; k++) P.solid(cube(0.07, 0.55, 0.32, -0.14 + k * 0.07, 0), k % 2 ? '#ffffff' : '#e63946');
      for (let k = 0; k < 7; k++) P.solid(ball(0.07, -0.15 + k * 0.05, 0.6 + (k % 2) * 0.05, 0, 8), '#fff4e6');
    },
    air: 'stars',
  },
  // a dish on its stand, sending and receiving
  'satellite-dish': {
    hero(P) {
      P.solid(cube(0.05, 0.4, 0.05, 0, 0), '#aeb6c2');
      P.solid(new THREE.SphereGeometry(0.3, 8, 5, 0, Math.PI * 2, 0, 0.9).rotateZ(-0.7).translate(-0.05, 0.5, 0), '#e8ecf2');
      P.solid(cube(0.02, 0.24, 0.02).rotateZ(0.9).translate(0.06, 0.52, 0), '#aeb6c2');
      for (let k = 1; k <= 3; k++) P.light(new THREE.TorusGeometry(0.1 * k + 0.12, 0.012, 4, 14, 1.2).rotateZ(0.25).translate(0.18, 0.62, 0), [1.0, 0.9, 1.7]);
    },
    small(P) {                                                                   // a handset, its screen lit
      P.solid(cube(0.34, 0.68, 0.06, 0, 0.1), '#2a2f3a');
      P.light(cube(0.28, 0.56, 0.02, 0, 0.16, 0.035), [0.8, 0.75, 1.7]);
    },
    air: 'sparkles',
  },
  // bread from the oven at dawn: a loaf, a croissant, the sun coming up behind
  // (the dusk bakery now: its cases its breads as Noto Emoji's glyphs on its pale yellow-green, the sun going down:
  // makeCase, dawn (dawnStage); its hero and small things no longer shown)
  'dusk-bakery': {
    dawn: true,
    hero(P) {
      P.light(new THREE.CircleGeometry(0.34, 10).translate(0.1, 0.5, -0.45), [1.7, 1.15, 0.55]);
      P.solid(ball(0.3, -0.1, 0.18).scale(1.3, 0.62, 0.9), '#a8662f');
      for (let k = 0; k < 3; k++) P.solid(cube(0.03, 0.03, 0.3).rotateY(0.5).translate(-0.24 + k * 0.13, 0.34, 0.05), '#d6a467');
      P.solid(new THREE.TorusGeometry(0.16, 0.08, 4, 14, Math.PI * 1.15).rotateZ(Math.PI * 1.05).translate(0.3, 0.17, 0.1), '#c9853e');
    },
    small(P) {
      P.solid(ball(0.24, 0, 0.18).scale(1, 0.75, 1), '#a8662f');
      P.solid(new THREE.CapsuleGeometry(0.06, 0.7, 2, 6).rotateZ(0.5).translate(0.1, 0.4, -0.1), '#d6a467');
    },
    air: 'steam',
  },
  // an ice cream in its cone, three scoops, a cloud over it
  // (an anime opening in pale pinks, scoops dropping on, the name popping in: brandCase, pop; its hero and
  // small things no longer shown)
  'gelato-pop': {
    pop: true,
    hero(P) {
      P.solid(new THREE.ConeGeometry(0.16, 0.48, 8).rotateX(Math.PI).translate(0, 0.24, 0), '#d6a467');
      P.solid(ball(0.17, 0, 0.52), '#ffb3c6');
      P.solid(ball(0.15, -0.09, 0.72), '#b9f3d0');
      P.solid(ball(0.13, 0.08, 0.86), '#fff4e6');
      for (const [x, y, r] of [[-0.3, 0.86, 0.1], [-0.38, 0.82, 0.08], [-0.22, 0.83, 0.08]]) P.solid(ball(r, x, y, -0.2), '#ffffff');
    },
    small(P) {                                                                   // a cup of it
      P.solid(cyl(0.18, 0.14, 0.24, 0, 16), '#c9b6ff');
      P.solid(ball(0.17, 0, 0.3), '#ffe5a0');
      P.solid(cube(0.03, 0.3, 0.03).rotateZ(0.4).translate(0.05, 0.35, 0), '#ffffff');
    },
    air: 'sparkles',
  },
  // a cup of milk tea, pearls in the bottom, a straw, the moon
  // (its case: the moon setting over a river, a milk tea before it, after 春江花月夜's 落月摇情满江树: city.js
  // brandCase, moon; its hero and small things no longer shown)
  'moon-river': {
    moon: true,
    hero(P) {
      P.light(ball(0.2, 0.28, 0.78, -0.3), [1.6, 1.45, 1.0]);
      P.solid(cyl(0.2, 0.16, 0.66, 0, 20), '#d9b38c');
      P.solid(cyl(0.21, 0.21, 0.05, 0.66, 20), '#f2e0c8');
      for (let k = 0; k < 9; k++) P.solid(ball(0.04, -0.12 + (k % 5) * 0.06, 0.06 + Math.floor(k / 5) * 0.06, 0.12, 8), '#2a1f1a');
      P.solid(cube(0.035, 0.55, 0.035).rotateZ(-0.15).translate(0.03, 0.55, 0), '#ff8fab');
    },
    small(P) {
      P.solid(cyl(0.15, 0.12, 0.5, 0, 16), '#b9f3d0');
      P.solid(cyl(0.16, 0.16, 0.04, 0.5, 16), '#f2e0c8');
      P.solid(cube(0.03, 0.4, 0.03).rotateZ(0.2).translate(-0.02, 0.45, 0), '#c77dff');
    },
    air: 'bubbles',
  },
  // the Star Ring's kitten, as a plush
  // (in a case: shelves of blind boxes, cat-eared, the animals in them popping out one after another: city.js
  // makeCase, scene.shelf; hero and small for anything else)
  'blind-boxes': {
    shelf: true,
    hero(P) {
      P.solid(ball(0.3, 0, 0.36).scale(1.15, 1, 0.9), '#ffffff');
      for (const e of [-1, 1]) {
        P.solid(new THREE.ConeGeometry(0.1, 0.18, 4).rotateZ(-e * 0.35).translate(e * 0.2, 0.66, 0), '#ffffff');
        P.solid(ball(0.04, e * 0.11, 0.4, 0.24, 8), '#1c1a28');
        for (const t of [-0.05, 0.05]) P.light(cube(0.16, 0.008, 0.008).rotateZ(e * t * 3).translate(e * 0.26, 0.32 + t, 0.22), CYAN);
      }
      P.solid(ball(0.025, 0, 0.32, 0.27, 8), '#ff8fab');
    },
    small(P) {                                                                   // a ball of yarn
      P.solid(ball(0.22, 0, 0.22), '#ff99c8');
      for (let k = 0; k < 3; k++) P.solid(new THREE.TorusGeometry(0.22, 0.012, 4, 14).rotateX(k * 1.1).rotateY(k * 0.7).translate(0, 0.22, 0), '#f72585');
    },
    air: 'stars',
  },
  // a bowl of noodles, chopsticks over it, a red lantern hanging
  'noodle-lantern': {
    hero(P) {
      P.solid(new THREE.SphereGeometry(0.34, 8, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(0, 0.34, 0), '#f2ece2');
      P.solid(cyl(0.33, 0.33, 0.02, 0.33, 24), '#e8c07a');
      for (const e of [0, 1]) P.solid(cube(0.6, 0.02, 0.02).rotateZ(0.25 + e * 0.08).translate(0.12, 0.48 + e * 0.04, 0.05), '#6b5444');
      P.solid(cube(0.01, 0.2, 0.01, -0.3, 0.8), '#3d4b5a');
      P.light(ball(0.11, -0.3, 0.74).scale(1, 1.25, 1), [1.7, 0.45, 0.3]);
    },
    small(P) {
      P.solid(cube(0.01, 0.3, 0.01, 0, 0.7), '#3d4b5a');
      P.light(ball(0.16, 0, 0.5).scale(1, 1.25, 1), [1.7, 0.5, 0.3]);
    },
    air: 'steam',
  },
  // a late supper under a lamp: rice, soup (in a case, makeCase draws the rain-window diner's fogged window instead:
  // rainWindow; hero and small kept for anything else)
  'rain-window': {
    rainwin: true,
    hero(P) {
      P.solid(cyl(0.44, 0.44, 0.03, 0.02, 28), '#f2ece2');
      P.solid(new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(-0.18, 0.25, 0), '#f2ece2');
      P.solid(ball(0.17, -0.18, 0.26, 0, 12).scale(1, 0.55, 1), '#fff4e6');
      P.solid(new THREE.SphereGeometry(0.17, 8, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(0.2, 0.22, 0), '#8c2f39');
      P.solid(cube(0.03, 0.4, 0.03, 0.42, 0.05), '#3d4b5a');
      P.solid(new THREE.ConeGeometry(0.16, 0.12, 8, 1, true).translate(0.3, 0.5, 0), '#ffc06b');
      P.light(ball(0.05, 0.3, 0.45), WARM);
    },
    small(P) {                                                                   // a teapot
      P.solid(ball(0.2, 0, 0.22).scale(1, 0.85, 1), '#3f6b4a');
      P.solid(cube(0.2, 0.04, 0.04).rotateZ(0.6).translate(0.22, 0.28, 0), '#3f6b4a');
      P.solid(ball(0.04, 0, 0.4, 0, 8), '#3f6b4a');
    },
    air: 'steam',
  },
  // three rows of cakes going by, this way, that way, this way (brandCase, strips), each cake a dark
  // silhouette on the case's light, what tells it apart cut out of it (P.cut): slices of layer cake, cupcakes,
  // swiss rolls; the cake in three tiers stays for a case that shows things standing
  'cake-rows': {
    strips: [
      (P) => {                                                                   // a slice: its sloping top, its layers, a strawberry
        P.solid(flat([[-0.45, 0], [0.45, 0], [0.45, 0.56], [-0.45, 0.34]]));
        for (const y of [0.12, 0.24]) P.cut(new THREE.PlaneGeometry(0.82, 0.035).translate(0, y, 0.02));
        P.solid(new THREE.CircleGeometry(0.1, 7).scale(1, 1.15, 1).translate(0.18, 0.66, 0));
        for (const e of [-1, 1]) P.solid(new THREE.PlaneGeometry(0.1, 0.035).rotateZ(e * 0.5).translate(0.18 + e * 0.05, 0.79, 0));
      },
      (P) => {                                                                   // a cupcake: its pleated case, a swirl of icing, a cherry
        P.solid(flat([[-0.26, 0], [0.26, 0], [0.33, 0.34], [-0.33, 0.34]]));
        for (let k = -2; k <= 2; k++) P.cut(new THREE.PlaneGeometry(0.025, 0.28).rotateZ(-k * 0.06).translate(k * 0.11, 0.17, 0.02));
        for (const [w, y] of [[0.4, 0.42], [0.31, 0.55], [0.2, 0.66]]) P.solid(new THREE.CircleGeometry(w, 10).scale(1, 0.32, 1).translate(0, y, 0));
        P.solid(new THREE.CircleGeometry(0.08, 8).translate(0.03, 0.8, 0));
        P.solid(new THREE.PlaneGeometry(0.02, 0.12).rotateZ(-0.4).translate(0.07, 0.9, 0));
      },
      (P) => {                                                                   // a swiss roll, lying: its end turned to us, the spiral of cream
        P.solid(new THREE.PlaneGeometry(0.62, 0.56).translate(-0.12, 0.3, 0));
        P.solid(new THREE.CircleGeometry(0.28, 10).translate(0.19, 0.3, 0));
        P.solid(new THREE.CircleGeometry(0.28, 10).scale(0.35, 1, 1).translate(-0.43, 0.3, 0));
        for (const [r, t] of [[0.2, 0.025], [0.12, 0.025], [0.05, 0.022]]) P.cut(new THREE.TorusGeometry(r, t, 3, 12).translate(0.19 + (0.2 - r) * 0.15, 0.3, 0.02));
        for (let k = 0; k < 6; k++) P.cut(new THREE.CircleGeometry(0.012, 4).translate(-0.36 + k * 0.08, 0.5 - (k % 2) * 0.05, 0.02));
      },
    ],
    hero(P) {
      [[0.36, '#fff4e6'], [0.27, '#ffb3c6'], [0.18, '#fff4e6']].forEach(([r, c], i) => P.solid(cyl(r, r, 0.18, i * 0.18, 28), c));
      P.solid(ball(0.05, 0, 0.58), '#e63946');
      for (const x of [-0.1, 0.1]) { P.solid(cube(0.02, 0.1, 0.02, x, 0.54), '#ffffff'); P.light(ball(0.025, x, 0.67, 0, 8), WARM); }
    },
    small(P) {                                                                   // a macaron
      P.solid(ball(0.2, 0, 0.12).scale(1, 0.4, 1), '#c9b6ff');
      P.solid(cyl(0.17, 0.17, 0.06, 0.14, 18), '#fff4e6');
      P.solid(ball(0.2, 0, 0.26).scale(1, 0.4, 1), '#c9b6ff');
    },
    air: 'sparkles',
  },
};

// the plain kind, for a brand that names none: a glowing orb on a stand, small gift boxes beside it
SCENES['still-life'] = {
  hero(P) {
    P.solid(cyl(0.2, 0.26, 0.12, 0, 16), '#3d4b5a');
    P.solid(cyl(0.05, 0.05, 0.35, 0.12, 8), '#aeb6c2');
    P.light(ball(0.22, 0, 0.66), [1.4, 1.5, 1.7]);
    P.light(hoop(0.3, 0.012, 0, 0.66), CYAN);
  },
  small(P) {
    P.solid(cube(0.5, 0.42, 0.4), '#ff8fab');
    P.solid(cube(0.08, 0.43, 0.41), '#fff4e6');
    P.solid(cube(0.51, 0.43, 0.08), '#fff4e6');
  },
  air: 'sparkles',
};
SCENES['dot-bouquet'] = { bouquet: true };
SCENES['cake-sign'] = { strips: SCENES['cake-rows'].strips, oneRow: true, depth: 0.12, rim: 0.035 };
SCENES['cake-blade'] = { ...SCENES['cake-sign'], named: false, single: true, depth: 0.1, rim: 0.03 };
SCENES['cake-menu'] = { strips: SCENES['cake-rows'].strips, named: false, depth: 0.1, rim: 0.04 };
SCENES['kitten-face'] = { ledcat: true };
SCENES['kitten-tiles'] = { tiles: true };
SCENES['kitten-tiles-6x3'] = { tiles: true, cols: 6, rows: 3 };
SCENES['cinema-bright'] = { cinema: 'bright' };
SCENES['cinema-film'] = { cinema: 'film' };
SCENES['cinema-beam'] = { cinema: 'beam' };

// what drifts in the air of a case: its size (a share of the case's smaller side) and its light
export const AIR = {
  stars: { size: 0.012, rgb: [1.6, 1.6, 1.7], shape: 'star' },
  steam: { size: 0.025, rgb: [0.55, 0.6, 0.65], shape: 'wisp', few: true },
  bubbles: { size: 0.016, rgb: [0.9, 1.4, 1.7], shape: 'ring' },
  fireflies: { size: 0.012, rgb: [1.3, 1.7, 0.6], shape: 'dot' },
  rain: { size: 0.03, rgb: [0.8, 1.3, 1.5], shape: 'streak' },
  notes: { size: 0.02, rgb: [1.4, 1.0, 1.7], shape: 'dot' },
  sparkles: { size: 0.012, rgb: [1.7, 1.5, 1.6], shape: 'star' },
  motes: { size: 0.01, rgb: [1.6, 1.4, 1.0], shape: 'dot' },
};
