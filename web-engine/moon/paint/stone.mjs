



import { paintCanvas, tileNoise, tileFbm, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.93, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 512 };

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    let val = 0.84 + (tileFbm(u, v, 4, 4, { octaves: 5, seed: 31 }) - 0.5) * 0.24;
    const s = tileNoise(u, v, 110, 110, 37);
    val -= smoothstep(0.2, 0.08, s) * 0.14;
    val += smoothstep(0.84, 0.95, s) * 0.07;
    const crack = Math.abs(tileFbm(u, v, 3, 3, { octaves: 4, seed: 43 }) - 0.5);
    const patch = smoothstep(0.5, 0.7, tileNoise(u, v, 2, 2, 47));
    val -= (1 - smoothstep(0.004, 0.022, crack)) * 0.2 * patch;
    return val;
  });
}
