



import { paintCanvas, tileNoise, tileFbm, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.94, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 256, rim: 0.1 };

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    let val = 0.9 + (tileFbm(u, v, 3, 3, { octaves: 4, seed: 101 }) - 0.5) * 0.08;
    val += (tileNoise(u, v, 40, 160, 103) - 0.5) * 0.06;
    const fleck = tileNoise(u, v, 90, 90, 107);
    val -= smoothstep(0.1, 0.03, fleck) * 0.1;
    return val;
  });
}
