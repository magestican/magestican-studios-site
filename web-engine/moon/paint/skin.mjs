








import { paintCanvas, tileNoise, tileFbm, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = Object.freeze({ roughness: 0.78, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 512, rim: 0.22 });

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    let val = 0.92 + (tileFbm(u, v, 3, 3, { octaves: 3, seed: 611 }) - 0.5) * 0.08;
    val += (tileNoise(u, v, 96, 96, 613) - 0.5) * 0.03;
    
    val -= smoothstep(0.08, 0.02, tileNoise(u, v, 140, 140, 617)) * 0.05;
    return val;
  });
}
