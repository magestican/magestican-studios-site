









import { paintCanvas, tileFbm } from '../art/kit/paintUtil.mjs';

export const SURFACE = {
  roughness: 0.35, metalness: 0, doubleSide: false, alphaTest: 0,
  emissive: '#000000', emissiveIntensity: 0, size: 256, rim: 0,
  transparent: true, opacity: 0.72,
};

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => 0.9
    + (tileFbm(u, v, 4, 4, { octaves: 2, seed: 41 }) - 0.5) * 0.08
    + (tileFbm(u * 2, v * 2, 5, 5, { octaves: 2, seed: 83 }) - 0.5) * 0.04);
}
