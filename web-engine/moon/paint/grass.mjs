




import { fbm2Tile } from '../noise.mjs';
import { SeededRng } from '../../rng/seededRng.js';

export const SURFACE = { roughness: 0.96, metalness: 0, doubleSide: true, size: 512, rim: 0.05, worldScale: 2.6 };

export function paint({ size = 512 } = {}) {
  const v = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size;
      v[y * size + x] = 0.9
        + (fbm2Tile(u, w, 3, { octaves: 3, seed: 3 }) - 0.5) * 0.14
        + (fbm2Tile(u, w, 12, { octaves: 2, seed: 7 }) - 0.5) * 0.07;
    }
  }
  const rng = new SeededRng(4242);
  
  
  const strokes = Math.round((size * size) / 220);
  for (let s = 0; s < strokes; s++) {
    const x0 = rng.next() * size, y0 = rng.next() * size;
    const ang = rng.rangeF(0, Math.PI * 2);
    const len = rng.rangeF(2.5, 6) * (size / 512);
    const amt = rng.chance(0.55) ? rng.rangeF(0.03, 0.07) : -rng.rangeF(0.03, 0.08);
    stroke(v, size, x0, y0, ang, len, amt);
  }
  return toRGBA(v, size, [0.985, 1, 0.95]);
}


export function stroke(v, size, x0, y0, ang, len, amt) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  for (let t = 0; t <= len; t += 0.5) {
    const k = amt * (1 - t / len) * Math.sin(Math.PI * Math.min(1, (t + 1) / len));
    const px = x0 + dx * t, py = y0 + dy * t;
    const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
    add(v, size, ix, iy, k * (1 - fx) * (1 - fy));
    add(v, size, ix + 1, iy, k * fx * (1 - fy));
    add(v, size, ix, iy + 1, k * (1 - fx) * fy);
    add(v, size, ix + 1, iy + 1, k * fx * fy);
  }
}

function add(v, size, x, y, k) {
  const i = (((y % size) + size) % size) * size + (((x % size) + size) % size);
  v[i] += k;
}

export function toRGBA(v, size, tint = [1, 1, 1], alpha = null) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = v[i] * tint[0] * 255;
    data[i * 4 + 1] = v[i] * tint[1] * 255;
    data[i * 4 + 2] = v[i] * tint[2] * 255;
    data[i * 4 + 3] = alpha ? alpha[i] * 255 : 255;
  }
  return { width: size, height: size, data };
}
