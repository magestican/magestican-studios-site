







import { paintCanvas, tileFbm, smoothstep } from '../art/kit/paintUtil.mjs';



export const SURFACE = { roughness: 0.2, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 256, rim: 0.25 };

const band = (u, a, b, soft) => smoothstep(a - soft, a, u) * (1 - smoothstep(b, b + soft, u));

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => 0.84
    + band(u, 0.8, 0.83, 0.012) * 0.16
    + band(u, 0.875, 0.885, 0.006) * 0.12
    + Math.sin(Math.PI * 2 * 5 * v + 1.5 * Math.sin(Math.PI * 2 * u)) * 0.012
    + (tileFbm(u, v, 3, 3, { octaves: 3, seed: 71 }) - 0.5) * 0.05);
}
