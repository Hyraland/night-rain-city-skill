// An example district that uses most of the kit: four streets (one at a slant), shops of every kind, brands with
// their ad cases, a metro station, a terrace, a sunken plaza, sculptures, a hologram of a model. To see it, copy it
// over engine/src/district.js. Its names are plain on purpose (咖啡, 书店...): a city of one's own gives its own.
//
// Streets are straight lines from one point to another, any way (x east, z south, metres); they may cross, meet at
// any angle, or end. Words: what the signs and screens may say (kit/atlas.js). Brands: each with an ad of its own on
// the screens, and (case) as a lit case on ad walls and rain shelters.

import { sunkenPlaza, metro } from './kit/underground.js';
import { terrace } from './kit/terrace.js';
import { boidsCube, solarSystem } from './kit/sculptures.js';
import { holoModel } from './kit/holomodel.js';

export const DISTRICT = {
  name: '夜雨城',
  en: 'NIGHT · RAIN',
  seed: 7,
  streets: [
    { id: 'avenue', from: [0, 80], to: [0, -620],                                     // the long avenue, north to south
      shops: [                                                                        // (u: how far along, side: -1 left, +1 right)
        { u: 125, side: -1, width: 12, kind: 'cafe', brand: 'tea', name: '茶室 TEA ROOM', sign: 'text' },
        { u: 141, side: -1, width: 10, kind: 'florist', name: '花店 FLORIST', sign: 'plate', color: '#ff7aa8' },
        { u: 160, side: -1, width: 12, kind: 'bakery', brand: 'bakery', sign: 'reveal' },
        { u: 130, side: 1, width: 14, kind: 'bookshop', brand: 'books', sign: 'led' },
        { u: 150, side: 1, width: 12, kind: 'convenience', brand: 'mart', sign: 'film', bulbs: true },
        { u: 168, side: 1, width: 10, kind: 'umbrellas', name: '雨伞 UMBRELLAS', sign: 'umbrella', color: '#6effa6' },
        { u: 186, side: -1, width: 12, kind: 'icecream', brand: 'icecream', sign: 'theme', theme: 'icecream' },
        { u: 201, side: -1, width: 12, kind: 'tea', brand: 'milktea', sign: 'theme', theme: 'moon' },
        { u: 188, side: 1, width: 12, kind: 'cute', brand: 'gifts', sign: 'meow' },
      ] },
    { id: 'cross', from: [-320, -200], to: [340, -200], road: 6,                      // across it
      shops: [
        { u: 440, side: -1, width: 14, kind: 'cafe', brand: 'coffee', sign: 'cafe-cups', islands: true },
        { u: 456, side: -1, width: 12, kind: 'dessert', brand: 'dessert', sign: 'cake-case' },
        { u: 470, side: -1, width: 12, kind: 'bakery', brand: 'bread', sign: 'dusk' },
        { u: 484, side: -1, width: 12, kind: 'travel', brand: 'travel', sign: 'space-strip' },
        { u: 498, side: -1, width: 12, kind: 'diner', brand: 'diner', sign: 'fogged' },
        { u: 512, side: -1, width: 12, kind: 'florist', brand: 'flowers', sign: 'polka' },
      ] },
    { id: 'slant', from: [0, -330], to: [300, -560], road: 5, walk: 5 },              // off it at a slant
    { id: 'side', from: [-40, -420], to: [-360, -520], road: 5, walk: 5 },            // and the other way
  ],
  // where one is, on the rain shelters' boards; and the metro line, its next train there (optional)
  place: { cn: '夜雨城', en: 'NIGHT RAIN CITY' },
  metroLine: { number: 1, name: '1号线', toward: '终点站', last: '' },
  // the stroll: down the avenue, along the cross street, back
  route: [[-2, 60], [-2, -196], [200, -196]],
  words: {
    vertical: ['咖啡', '书店', '茶室', '面馆', '药房', '电器', '旅馆', '花店', '眼镜'],
    single: ['夜', '雨', '城', '灯', '月', '光'],
    horizontal: ['夜雨城 NIGHT RAIN CITY', '欢迎 WELCOME', '营业中 OPEN', '北 NORTH', '南 SOUTH',
      '地铁站 METRO', '列车即将到站 TRAIN ARRIVING', '花店 FLORIST', '面包 BAKERY', '咖啡 CAFÉ', '书店 BOOKS', '便利店 MART'],
    offices: ['写字楼 OFFICES', '中心大厦 CENTRAL TOWER'],
  },
  // brands: a name, its English, a colour, and the case its ads show (references/catalog.md); no taglines here
  brands: [
    { key: 'tea', name: '茶', en: 'TEA', color: '#5ad1ff' },
    { key: 'books', name: '书店', en: 'BOOKS', color: '#ffc46b' },
    { key: 'mart', name: '便利店', en: 'MART', color: '#c48bff' },
    { key: 'bakery', name: '面包', en: 'BAKERY', color: '#ff7aa8' },
    { key: 'icecream', name: '冰淇淋', en: 'ICE CREAM', color: '#ff9cc2', case: 'gelato-pop' },
    { key: 'milktea', name: '奶茶', en: 'MILK TEA', color: '#4b4fb0', case: 'moon-river' },
    { key: 'gifts', name: '杂货', en: 'GIFTS', color: '#ffd166', case: 'blind-boxes' },
    { key: 'coffee', name: '咖啡', en: 'COFFEE', color: '#ff9d5c', case: 'pixel-cafe' },
    { key: 'dessert', name: '甜品', en: 'DESSERT', color: '#c9b6ff', case: 'cake-rows' },
    { key: 'bread', name: '面包房', en: 'BAKERY', color: '#d6b45a', case: 'dusk-bakery' },
    { key: 'travel', name: '旅行社', en: 'TRAVEL', color: '#4cc9f0', case: 'tide-town' },
    { key: 'diner', name: '小馆', en: 'DINER', color: '#ff8a5c', case: 'rain-window' },
    { key: 'flowers', name: '花店', en: 'FLOWERS', color: '#ff9cc2', case: 'flower-field' },
  ],
  // models of one's own (glTF), loaded before the city is built, for holograms or sculptures (references/models.md)
  models: { cat: 'assets/cat_statue.glb' },
  // more of the district, placed where one likes (kit/city.js: place, beside, on)
  build(w, kit) {
    // a metro station off the avenue's left side, its concourse running back under the towers
    kit.place(kit.beside('avenue', 250, -1, 1), () => metro(w, {
      name: '地铁站 METRO', signs: { gates: '列车即将到站 TRAIN ARRIVING', welcome: '欢迎 WELCOME' },
      shops: [{ kind: 'florist', name: '花店 FLORIST' }, { kind: 'bakery', name: '面包 BAKERY' }, { kind: 'cafe', name: '咖啡 CAFÉ' },
        { kind: 'bookshop', name: '书店 BOOKS' }, { kind: 'convenience', name: '便利店 MART' }, { kind: 'umbrellas' }],
    }));
    // a terrace before a tower, on the avenue's right near its start
    kit.place(kit.beside('avenue', 70, 1, 1), () => terrace(w, { width: 36, depth: 26, name: 'avenue-terrace' }));
    // sculptures: a flock of light cubes by the cross street, a solar system off the slanting street
    kit.place(kit.beside('cross', 150, 1, 5), () => boidsCube(w));
    kit.place(kit.beside('slant', 150, -1, 8), () => solarSystem(w));
    // a hologram of a cat turning slowly over a projector
    kit.place(kit.beside('cross', 250, 1, 4), () => holoModel(w, w.models.cat, { height: 3.6, y: 1.4, spin: 0.25 }));
    // a sunken plaza off the cross street
    kit.place(kit.beside('cross', 420, 1, 1), () => sunkenPlaza(w, { width: 26, length: 44, name: 'cross-plaza' }));
  },
  holograms: {
    rings: [{ x: 0, z: -200, y: 27, text: '夜雨城 NIGHT RAIN CITY', text2: '欢迎 WELCOME' }],
    globes: [{ x: 0, z: -470, y: 24 }],
    helices: [],
    signs: [
      { x: -9.5, y: 3.1, z: -60, text: '北 NORTH', back: '南 SOUTH', rotY: Math.PI / 2 },
      { x: 9.8, y: 3.1, z: -300, text: '营业中 OPEN', rotY: -Math.PI / 2 },
    ],
  },
};
