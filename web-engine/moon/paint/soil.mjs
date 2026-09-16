




import { fbm2Tile } from '../noise.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { toRGBA } from './grass.mjs';

export const SURFACE = { roughness: 1, metalness: 0, size: 512, rim: 0.04, worldScale: 3.2 };

export function paint({ size = 512 } = {}) {
  const v = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size;
      v[y * size + x] = 0.88
        + (fbm2Tile(u, w, 4, { octaves: 3, seed: 21 }) - 0.5) * 0.16
        + (fbm2Tile(u, w, 32, { octaves: 2, seed: 29 }) - 0.5) * 0.06;
    }
  }
  const rng = new SeededRng(9090);
  const pebbles = Math.round((size * size) / 1400);
  const s = size / 512;
  for (let p = 0; p < pebbles; p++) {
    const cx = rng.next() * size, cy = rng.next() * size;
    const r = rng.rangeF(2, rng.chance(0.15) ? 9 : 5) * s;
    const lift = rng.rangeF(0.04, 0.09);
    const R = Math.ceil(r + 3 * s);
    for (let oy = -R; oy <= R; oy++) {
      for (let ox = -R; ox <= R; ox++) {
        const x = Math.floor(cx) + ox, y = Math.floor(cy) + oy;
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy / 0.8);
        let k = 0;
        if (d < r) k = lift * (0.55 + 0.45 * (-dy / r)) * Math.sqrt(1 - (d / r) ** 2);
        else if (dy > 0 && d < r + 2.5 * s) k = -0.06 * (1 - (d - r) / (2.5 * s));
        if (k) {
          const i = (((y % size) + size) % size) * size + (((x % size) + size) % size);
          v[i] += k;
        }
      }
    }
  }
  return toRGBA(v, size, [1, 0.97, 0.93]);
}
