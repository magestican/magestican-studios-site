




import { paintCanvas, grain, cellHash, fract, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.86, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 512 };
export const PLANKS_PER_TILE = 4;

export function paint({ size = SURFACE.size } = {}) {
  const px = 1 / size;
  return paintCanvas(size, (u, v) => {
    const row = v * PLANKS_PER_TILE;
    const k = Math.floor(row);
    const dv = row - k;
    const shift = (cellHash(k, 0, 3) - 0.5) * 0.1;
    let val = 0.9 + shift + grain(fract(u + cellHash(k, 1, 3)), v, 2 + k, 11) * 0.9;
    const seam = (1 - smoothstep(0, 0.07, dv)) * 0.36;
    const underLap = smoothstep(0.8, 1, dv) * 0.14;
    const highlight = smoothstep(0.05, 0.16, dv) * (1 - smoothstep(0.16, 0.4, dv)) * 0.05;
    val += highlight - seam - underLap;
    const joint = fract(cellHash(k, 2, 3) + 0.5 * (k % 2));
    let du = Math.abs(u - joint);
    du = Math.min(du, 1 - du);
    val -= (1 - smoothstep(px * 1.2, px * 3.5, du)) * 0.3;
    for (const side of [-1, 1]) {
      let dn = Math.abs(u - fract(joint + side * 0.022));
      dn = Math.min(dn, 1 - dn);
      const r = Math.hypot(dn * size, ((dv - 0.5) * size) / PLANKS_PER_TILE);
      val -= (1 - smoothstep(1.2, 2.6, r)) * 0.28;
    }
    return val;
  });
}
