// A modern umbrella's canopy: its ribs curving down from the tip (a dome, not a cone), its rim round; and its rim
// as a ring, for a rim of light. r: its radius at the rim, h: from the rim up to its tip; its rim at y = 0, its tip
// on the y axis.

import * as THREE from 'three';

export function canopyGeometry(r, h, ribs = 8, rows = 6) {
  const pts = Array.from({ length: rows + 1 }, (_, i) => {
    const t = i / rows;
    return new THREE.Vector2(Math.max(r * t, 1e-4), h * (1 - t * t));
  });
  return new THREE.LatheGeometry(pts, ribs * 4);
}

export const rimGeometry = (r, h, thick, ribs = 8) => new THREE.TorusGeometry(r, thick, 4, ribs * 6).rotateX(Math.PI / 2);
