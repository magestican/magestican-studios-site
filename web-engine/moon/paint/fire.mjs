




import { hash3 } from '../noise.mjs';
import { toRGBA } from './grass.mjs';



export const SURFACE = { roughness: 1, metalness: 0, doubleSide: true, size: 256, rim: 0, emissive: '#ff7418', emissiveIntensity: 1.25 };

const fade = (t) => t * t * (3 - 2 * t);
const mod = (a, n) => ((a % n) + n) % n;


function aniso(x, y, px, py, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = fade(x - xi), w = fade(y - yi);
  const c = (dx, dy) => hash3(mod(xi + dx, px), mod(yi + dy, py), 0, seed);
  const a = c(0, 0) + (c(1, 0) - c(0, 0)) * u;
  const b = c(0, 1) + (c(1, 1) - c(0, 1)) * u;
  return a + (b - a) * w;
}

export function paint({ size = 256 } = {}) {
  const v = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, w = y / size;
      const tongues = aniso(u * 10, w * 2, 10, 2, 61) * 0.6 + aniso(u * 20, w * 4, 20, 4, 67) * 0.4;
      const core = aniso(u * 4, w * 1, 4, 1, 71);
      v[y * size + x] = 0.72 + 0.28 * Math.min(1, Math.pow(tongues, 1.6) * 1.1 + core * 0.35);
    }
  }
  return toRGBA(v, size, [1, 0.96, 0.88]);
}
