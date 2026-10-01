



import { linear } from '../../palette/seasons.mjs';
import { valueNoise3 } from '../../noise.mjs';

export const hex = linear;
export const scaleC = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function paintVertex(base, p, n, { ground = 0, groundFade = 0.6, groundAO = 0.32, underside = 0.35, mottle = 0.07, seed = 0 } = {}) {
  const near = 1 - smooth(0, groundFade, p[1] - ground);
  let k = (1 - groundAO * near) * (1 - underside * Math.max(0, -n[1]));
  k *= 1 + (valueNoise3(p[0] * 1.9 + 3.3, p[1] * 1.9, p[2] * 1.9, seed) - 0.5) * 2 * mottle;
  const c = scaleC(base, k);
  const cool = Math.max(0, -n[1]) * 0.3 + near * 0.12;
  const top = Math.max(0, n[1]) * 0.06;
  return mixC([c[0] * (1 + top), c[1] * (1 + top * 0.8), c[2]], [c[0] * 0.78, c[1] * 0.8, c[2] * 1.02], cool);
}




export function vc(base, opts = {}) {
  const { useTag = false, ...rest } = opts;
  return (p, n, uv, tag) => paintVertex(useTag ? scaleC(base, tag) : base, p, n, rest);
}

export function vary(rng, base, amount = 0.06) {
  const k = 1 + rng.rangeF(-amount, amount);
  const h = rng.rangeF(-amount, amount) * 0.5;
  return [base[0] * (k + h), base[1] * k, base[2] * (k - h)];
}
