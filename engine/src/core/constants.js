// What every part of the city agrees on.
// Layers: 0 casts shadows and is mirrored in the wet street; 2 mirrored only (lights, screens); 3 neither (rain,
// light beams); 4 the ground itself; 5 underground (seen only from the main camera: not in the shadow map, not in
// the wet street's mirror, under which it lies).
export const LAYER = { SOLID: 0, GLOW: 2, AIR: 3, GROUND: 4, INSIDE: 5 };
export const CURB = 0.15;        // the pavements' height over the road
export const LOBBY = 5.2;        // a tower's ground floor: its lobby, this high
export const LAMP_HEAD_Y = 8.4;  // a street lamp's head
