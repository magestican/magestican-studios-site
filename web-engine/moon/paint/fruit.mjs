





import { hash3, valueNoise2Tile } from '../noise.mjs';
import { tileNoise } from './bark.mjs';

export const SURFACE = { roughness: 0.5, metalness: 0, doubleSide: false, alphaTest: 0, size: 256 };

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function paint({ size = 256 } = {}) {
  const data = new Uint8ClampedArray(size * size * 4);
  const cells = 14;
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      let val = 0.9;
      val += 0.06 * (valueNoise2Tile(u * 4, v * 4, 4, 7) - 0.5);
      val += 0.07 * (tileNoise(u * 22, v * 2, 22, 2, 13) - 0.5);
      val += 0.07 * Math.exp(-(((v - 0.3) / 0.07) ** 2));
      const gx = u * cells, gy = v * cells;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const cx = ix + ox, cy = iy + oy;
          const wx = ((cx % cells) + cells) % cells, wy = ((cy % cells) + cells) % cells;
          const px = cx + hash3(wx, wy, 1, 5), py = cy + hash3(wx, wy, 2, 5);
          const d = Math.hypot(gx - px, gy - py) * (size / cells);
          const rad = 1.1 + 1.2 * hash3(wx, wy, 3, 5);
          val += 0.07 * clamp(rad - d + 0.5, 0, 1);
        }
      }
      val = clamp(val, 0.6, 1);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = Math.round(val * 255);
      data[i + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}
