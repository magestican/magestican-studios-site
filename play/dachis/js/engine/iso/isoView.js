


import * as THREE from 'three';

export const ISO_DIR = new THREE.Vector3(1, 1.2, 1).normalize();
export const EYE_DIST = 80;
export const SIN_E = ISO_DIR.y;
export const COS_E = Math.sqrt(1 - SIN_E * SIN_E);
const R = Math.SQRT1_2;

export function toUS(x, y, h = 0) { return [(x - y) * R, (x + y) * R * SIN_E - h * COS_E]; }
