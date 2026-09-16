







import { paintCanvas, tileNoise, tileFbm, cellHash, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.34, metalness: 0.45, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 256, rim: 0.2 };

const CELLS = 9;
const mod = (a, n) => ((a % n) + n) % n;

function dimples(u, v, seed) {
  const x = u * CELLS, y = v * CELLS;
  const xi = Math.floor(x), yi = Math.floor(y);
  let d1 = 9, d2 = 9;
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const cx = xi + di, cy = yi + dj;
      const px = cx + 0.15 + 0.7 * cellHash(mod(cx, CELLS), mod(cy, CELLS), seed);
      const py = cy + 0.15 + 0.7 * cellHash(mod(cx, CELLS), mod(cy, CELLS), seed + 1);
      const d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
  }
  return { d1, d2 };
}

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    const { d1, d2 } = dimples(u, v, 91);
    const facet = 1 - smoothstep(0.1, 0.75, d1);
    const crease = 1 - smoothstep(0, 0.1, d2 - d1);
    const streak = tileNoise(u, v, 3, 120, 93) - 0.5;
    const mottle = tileFbm(u, v, 2, 2, { octaves: 3, seed: 95 }) - 0.5;
    return 0.86 + 0.08 * facet - 0.09 * crease + 0.04 * streak + 0.06 * mottle;
  });
}
