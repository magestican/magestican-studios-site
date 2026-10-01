






import { hash3 } from '../noise.mjs';

export const SURFACE = { roughness: 0.95, metalness: 0, doubleSide: false, alphaTest: 0, size: 512 };

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mod = (a, n) => ((a % n) + n) % n;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };



export function tileNoise(x, y, px, py, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = fade(x - xi), v = fade(y - yi);
  const c = (dx, dy) => hash3(mod(xi + dx, px), mod(yi + dy, py), 0, seed);
  const a = c(0, 0) + (c(1, 0) - c(0, 0)) * u;
  const b = c(0, 1) + (c(1, 1) - c(0, 1)) * u;
  return a + (b - a) * v;
}

const KNOTS = [
  { u: 0.21, v: 0.18, rx: 0.028, ry: 0.05 },
  { u: 0.66, v: 0.57, rx: 0.036, ry: 0.062 },
  { u: 0.43, v: 0.86, rx: 0.022, ry: 0.04 },
];

export function paint({ size = 512 } = {}) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      let wu = u + 0.025 * (tileNoise(u * 4, v * 3, 4, 3, 11) - 0.5);
      let knot = 0, rim = 0;
      for (const k of KNOTS) {
        const dx = mod(u - k.u + 0.5, 1) - 0.5, dy = mod(v - k.v + 0.5, 1) - 0.5;
        const d = Math.hypot(dx / k.rx, dy / k.ry);
        wu += dx * 0.9 * Math.exp(-d * d * 0.35);
        if (d < 1) knot = Math.max(knot, 1 - d);
        rim = Math.max(rim, Math.exp(-((d - 1.25) ** 2) * 6));
      }
      let streak = 0, amp = 1, norm = 0;
      for (let o = 0; o < 3; o++) {
        const f = 2 ** o;
        streak += amp * tileNoise(wu * 20 * f, v * 3 * f, 20 * f, 3 * f, 23 + o);
        norm += amp; amp *= 0.5;
      }
      streak /= norm;
      const ridge = 1 - Math.abs(2 * tileNoise(wu * 34, v * 5, 34, 5, 41) - 1);
      const crevice = 1 - smooth(0.02, 0.2, ridge);
      const plate = tileNoise(wu * 34, v * 5, 34, 5, 41) > 0.5 ? 0.03 : -0.01;
      let val = 0.87 + 0.16 * (streak - 0.5) + plate - 0.26 * crevice;
      val += 0.07 * rim;
      if (knot > 0) {
        const rings = 0.5 + 0.5 * Math.cos((1 - knot) * 18);
        val = val * (1 - smooth(0, 0.35, knot)) + (0.6 + 0.12 * rings - 0.18 * smooth(0.6, 1, knot)) * smooth(0, 0.35, knot);
      }
      val = Math.min(1, Math.max(0.45, val));
      const i = (y * size + x) * 4;
      data[i] = Math.round(val * 255);
      data[i + 1] = Math.round(val * 250);
      data[i + 2] = Math.round(val * 244);
      data[i + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}
