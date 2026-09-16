



import { fbm2Tile } from '../noise.mjs';
import { toRGBA } from './grass.mjs';

export const SURFACE = { roughness: 0.85, metalness: 0, doubleSide: true, size: 256, rim: 0.12 };

export function paint({ size = 256 } = {}) {
  const v = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size;
      const wobble = (fbm2Tile(u, w, 2, { octaves: 2, seed: 51 }) - 0.5) * 0.12;
      const vein = Math.abs(Math.sin((u + wobble + 1 / 12) * Math.PI * 6));
      v[y * size + x] = 0.95
        - 0.07 * Math.pow(1 - vein, 10)
        + (fbm2Tile(u, w, 4, { octaves: 3, seed: 53 }) - 0.5) * 0.08;
    }
  }
  return toRGBA(v, size, [1, 0.99, 0.98]);
}
