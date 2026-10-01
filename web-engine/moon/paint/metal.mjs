




import { paintCanvas, tileNoise, tileFbm } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.42, metalness: 0.35, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 256 };

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => 0.9
    + (tileNoise(u, v, 3, 96, 51) - 0.5) * 0.08
    + (tileFbm(u, v, 3, 3, { octaves: 3, seed: 53 }) - 0.5) * 0.1);
}
