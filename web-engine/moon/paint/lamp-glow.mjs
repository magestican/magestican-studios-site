




import { fbm2Tile } from '../noise.mjs';
import { toRGBA } from './grass.mjs';

export const SURFACE = { roughness: 0.35, metalness: 0, size: 256, rim: 0.1, emissive: '#ffc473', emissiveIntensity: 2.4 };

export function paint({ size = 256 } = {}) {
  const v = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size;
      v[y * size + x] = 0.92 + (fbm2Tile(u, w, 3, { octaves: 3, seed: 81 }) - 0.5) * 0.14;
    }
  }
  return toRGBA(v, size, [1, 0.98, 0.94]);
}
