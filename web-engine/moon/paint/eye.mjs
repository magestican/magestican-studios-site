




import { fbm2Tile } from '../noise.mjs';

export const SURFACE = Object.freeze({ roughness: 0.1, metalness: 0, rim: 0.12, size: 128 });

export function paint({ size = SURFACE.size } = {}) {
  const n = size;
  const data = new Uint8ClampedArray(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = 0.965 + 0.03 * (fbm2Tile(x / n, y / n, 4, { octaves: 2, seed: 3 }) - 0.5);
      const i = (y * n + x) * 4;
      const b = Math.round(255 * v);
      data[i] = b; data[i + 1] = b; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { width: n, height: n, data };
}
