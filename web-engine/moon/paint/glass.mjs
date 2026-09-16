




import { paintCanvas, fract, smoothstep, tileFbm } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.12, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#ffc76b', emissiveIntensity: 0, size: 256 };

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    const d = fract(u + v + 0.05);
    const streak = smoothstep(0.12, 0.16, d) * (1 - smoothstep(0.27, 0.31, d)) * 0.22
      + smoothstep(0.35, 0.37, d) * (1 - smoothstep(0.4, 0.42, d)) * 0.16;
    return 0.78 + v * 0.08 + streak + (tileFbm(u, v, 2, 2, { octaves: 2, seed: 61 }) - 0.5) * 0.04;
  });
}
