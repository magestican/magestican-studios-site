





































export const ROULETTE_PERIOD_MS = 90;







export function rouletteFace(elapsedMs, faces, { period = ROULETTE_PERIOD_MS } = {}) {
  if (!Array.isArray(faces) || faces.length === 0) return null;
  if (!(elapsedMs >= 0)) return null;          
  const step = Math.floor(elapsedMs / Math.max(1, period));
  return faces[step % faces.length];
}







export function rouletteSteps(ms, { period = ROULETTE_PERIOD_MS } = {}) {
  if (!(ms > 0)) return 0;
  return Math.floor(ms / Math.max(1, period)) + 1;
}
