













export const TIER_ABOVE_MS = Object.freeze({ high: 21, medium: 40 });


export const SETTINGS = Object.freeze({
  high: Object.freeze({ pixelRatio: 2, effects: 1 }),
  medium: Object.freeze({ pixelRatio: 1.5, effects: 0.6 }),
  low: Object.freeze({ pixelRatio: 1, effects: 0.35 }),
});


export const MEASURE_MS = 2000;
export const MEASURE_MIN_FRAMES = 20;


export function medianInterval(samples, n) {
  const xs = [];
  const count = Math.min(n, samples.length);
  for (let i = 0; i < count; i += 1) if (samples[i] > 0) xs.push(samples[i]);
  if (xs.length === 0) return 0;
  xs.sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}


export function tierForInterval(medianMs) {
  if (!(medianMs > 0)) return 'high';
  if (medianMs <= TIER_ABOVE_MS.high) return 'high';
  if (medianMs <= TIER_ABOVE_MS.medium) return 'medium';
  return 'low';
}





export function decideTier(samples, n, elapsedMs) {
  if (n < MEASURE_MIN_FRAMES || elapsedMs < MEASURE_MS) return null;
  const median = medianInterval(samples, n);
  return { tier: tierForInterval(median), median };
}
