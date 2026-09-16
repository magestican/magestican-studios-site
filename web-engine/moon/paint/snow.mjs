


import { fbm2Tile } from '../noise.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { toRGBA } from './grass.mjs';

export const SURFACE = { roughness: 0.82, metalness: 0, size: 512, rim: 0.22, worldScale: 4 };

export function paint({ size = 512 } = {}) {
  const v = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size;
      const warp = fbm2Tile(u, w, 3, { octaves: 2, seed: 41 });
      const ripple = Math.sin((w * 6 + warp * 1.6) * Math.PI * 2);
      v[y * size + x] = 0.93
        + (fbm2Tile(u, w, 4, { octaves: 3, seed: 43 }) - 0.5) * 0.08
        + ripple * 0.018;
    }
  }
  const rng = new SeededRng(777);
  const sparkles = Math.round((size * size) / 700);
  for (let i = 0; i < sparkles; i++) {
    const idx = rng.rangeI(0, size * size - 1);
    v[idx] = Math.min(1.02, v[idx] + rng.rangeF(0.04, 0.09));
  }
  return toRGBA(v, size, [0.97, 0.985, 1]);
}
