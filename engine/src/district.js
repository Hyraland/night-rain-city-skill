// The district: the city as data (references/district.md). This is a blank start: two streets crossing, a few
// words, nothing else. Write your own here: streets (any way, crossing or not), words, brands, shops along the
// streets, and in build() whatever else stands where (kit/terrace.js, kit/underground.js, kit/sculptures.js,
// kit/holomodel.js). examples/showcase/district.js uses all of it.

export const DISTRICT = {
  name: '夜雨城',
  en: 'NIGHT · RAIN',
  seed: 1,
  // straight streets from one point to another (x east, z south, metres)
  streets: [
    { id: 'main', from: [0, 60], to: [0, -540] },
    { id: 'cross', from: [-280, -200], to: [280, -200], road: 6 },
  ],
  // the stroll's way (by default down the first street)
  route: [[-2, 40], [-2, -520]],
  // what signs, screens and holograms may say (every word shown must be here)
  words: {
    vertical: [],
    single: ['夜', '雨'],
    horizontal: ['夜雨城 NIGHT RAIN CITY', '北 NORTH', '南 SOUTH'],
    offices: [],
  },
  // the district's brands: { key, name, en, tagline, color, case } (none yet)
  brands: [],
  // more of the district, placed where one likes: build(w, kit) { kit.place(kit.beside('main', 200, 1), () => ...) }
  build() {},
  holograms: {
    rings: [{ x: 0, z: -200, y: 27, text: '夜雨城 NIGHT RAIN CITY' }],
    signs: [{ x: -9.5, y: 3.1, z: -60, text: '北 NORTH', back: '南 SOUTH', rotY: Math.PI / 2 }],
  },
};
