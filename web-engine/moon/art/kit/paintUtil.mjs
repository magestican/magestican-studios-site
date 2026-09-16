






import { hash3 } from '../../noise.mjs';

export const fract = (x) => x - Math.floor(x);
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;


export function tileNoise(u, v, pu, pv, seed = 0) {
  const x = u * pu, y = v * pv;
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = fade(x - xi), fy = fade(y - yi);
  const h = (i, j) => hash3(mod(i, pu), mod(j, pv), 0, seed);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), fx), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), fx), fy);
}

export function tileFbm(u, v, pu, pv, { octaves = 4, gain = 0.5, seed = 0 } = {}) {
  let sum = 0, amp = 1, norm = 0, a = pu, b = pv;
  for (let o = 0; o < octaves; o++) {
    sum += amp * tileNoise(u, v, a, b, seed + o * 131);
    norm += amp;
    amp *= gain;
    a *= 2; b *= 2;
  }
  return sum / norm;
}

export const cellHash = (i, j, seed = 0) => hash3(i, j, 7, seed);


export function paintCanvas(size, fn) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    const v = (y + 0.5) / size;
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const r = fn(u, v);
      const o = (y * size + x) * 4;
      if (typeof r === 'number') {
        const c = Math.round(clamp(r) * 255);
        data[o] = c; data[o + 1] = c; data[o + 2] = c; data[o + 3] = 255;
      } else {
        data[o] = Math.round(clamp(r[0]) * 255);
        data[o + 1] = Math.round(clamp(r[1]) * 255);
        data[o + 2] = Math.round(clamp(r[2]) * 255);
        data[o + 3] = Math.round(clamp(r[3] ?? 1) * 255);
      }
    }
  }
  return { width: size, height: size, data };
}


export function grain(u, v, seed = 0, rings = 10) {
  const warp = tileFbm(u, v, 2, 3, { octaves: 3, seed: seed + 11 });
  const g = fract(v * rings + warp * 1.6 + tileNoise(u, v, 1, 5, seed + 3) * 0.7);
  const d = Math.abs(g - 0.5) * 2;
  const line = smoothstep(0.72, 1, d) * 0.06;
  const fibre = (tileNoise(u, v, 4, 160, seed + 5) - 0.5) * 0.05;
  const mottle = (tileFbm(u, v, 2, 2, { octaves: 3, seed: seed + 17 }) - 0.5) * 0.07;
  return -line + fibre + mottle;
}
