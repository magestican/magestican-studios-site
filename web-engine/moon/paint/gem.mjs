




import { paintCanvas, tileFbm, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.07, metalness: 0.08, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 256, rim: 0.55 };

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    const cloud = tileFbm(u, v, 3, 3, { octaves: 3, seed: 91 });
    const vein = Math.abs(tileFbm(u, v, 4, 4, { octaves: 4, seed: 93 }) - 0.5);
    return 0.8 + (cloud - 0.5) * 0.14 + (1 - smoothstep(0.004, 0.03, vein)) * 0.16;
  });
}
