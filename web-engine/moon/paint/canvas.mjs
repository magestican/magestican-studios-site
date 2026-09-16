








import { paintCanvas, tileNoise, tileFbm } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.92, metalness: 0, doubleSide: true, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 512, rim: 0.1 };

const THREADS = 48;

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    const x = u * THREADS, y = v * THREADS;
    const tx = Math.floor(x), ty = Math.floor(y);
    const fx = x - tx, fy = y - ty;
    const over = ((tx + ty) & 1) === 0;
    const warp = Math.sin(Math.PI * fx), weft = Math.sin(Math.PI * fy);
    const crown = over ? warp * (0.5 + 0.5 * weft) : weft * (0.5 + 0.5 * warp);
    const slub = tileNoise(u, v, 12, 96, 71) - 0.5;
    const fade = tileFbm(u, v, 3, 3, { octaves: 3, seed: 73 }) - 0.5;
    return 0.83 + 0.1 * crown + 0.05 * slub + 0.07 * fade;
  });
}
