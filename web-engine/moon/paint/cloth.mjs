






import { fbm2Tile } from '../noise.mjs';

export const SURFACE = Object.freeze({ roughness: 0.88, metalness: 0, rim: 0.15, size: 512 });

export function paint({ size = SURFACE.size } = {}) {
  const n = size;
  const p = Math.max(4, Math.round(n / 32)); 
  const threads = Math.round(n / p);
  const period = n / threads;
  const data = new Uint8ClampedArray(n * n * 4);
  const TAU = Math.PI * 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n;
      const tx = Math.floor(x / period), ty = Math.floor(y / period);
      const fx = (x - tx * period + 0.5) / period, fy = (y - ty * period + 0.5) / period;
      const over = ((tx + ty) & 1) === 0;
      
      const warp = Math.sin(Math.PI * fx), weft = Math.sin(Math.PI * fy);
      const crown = over ? warp * (0.55 + 0.45 * weft) : weft * (0.55 + 0.45 * warp);
      const slub = fbm2Tile(u, v, 16, { octaves: 2, seed: 41 }) - 0.5;
      const folds = 0.5 * Math.sin(TAU * (2 * u + v + 0.15 * Math.sin(TAU * v))) + 0.5 * Math.sin(TAU * (u - 3 * v));
      const value = 0.8 + 0.13 * crown + 0.06 * slub + 0.025 * folds;
      const b = Math.round(255 * Math.min(0.985, Math.max(0.7, value)));
      const i = (y * n + x) * 4;
      data[i] = b; data[i + 1] = b; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { width: n, height: n, data };
}
