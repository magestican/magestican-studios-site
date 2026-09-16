







import { paintCanvas, tileNoise, tileFbm, smoothstep, cellHash } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.3, metalness: 0.12, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 256, rim: 0.42 };

const GLINT_CELLS = 12;

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    let val = 0.88 + (tileFbm(u, v, 4, 4, { octaves: 3, seed: 81 }) - 0.5) * 0.12;
    val += (tileNoise(u, v, 64, 4, 83) - 0.5) * 0.05;
    const gx = u * GLINT_CELLS, gy = v * GLINT_CELLS;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    const h = cellHash(ix % GLINT_CELLS, iy % GLINT_CELLS, 85);
    if (h > 0.55) {
      const px = ix + 0.25 + 0.5 * cellHash(ix % GLINT_CELLS, iy % GLINT_CELLS, 86), py = iy + 0.25 + 0.5 * cellHash(ix % GLINT_CELLS, iy % GLINT_CELLS, 87);
      const d = Math.hypot(gx - px, gy - py);
      val += smoothstep(0.12, 0.02, d) * 0.14;
    }
    return val;
  });
}
