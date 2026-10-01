



import { paintCanvas, grain, tileNoise, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.82, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 512 };

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    const knot = tileNoise(u, v, 3, 3, 41);
    const knotDark = smoothstep(0.88, 0.98, knot) * 0.05;
    return 0.92 + grain(u, v, 1, 9) - knotDark;
  });
}
