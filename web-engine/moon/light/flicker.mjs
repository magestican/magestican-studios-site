













import { valueNoise3 } from '../noise.mjs';

const MIN = 0.82, MAX = 1.0;


export function flicker(t, seed = 0) {
  const fast = 0.55 * Math.sin(t * Math.PI * 2 * 7 + seed) + 0.45 * Math.sin(t * Math.PI * 2 * 11 + seed * 1.7);
  const slow = valueNoise3(t * 0.6, seed * 3.1, 0, seed | 0) - 0.5;
  const v = 0.5 + 0.5 * (fast * 0.7 + slow * 0.6);
  return MIN + (MAX - MIN) * Math.max(0, Math.min(1, v));
}
