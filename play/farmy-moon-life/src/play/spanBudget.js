















































export function percentile(list, p) {
  const xs = (list || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return 0;
  const frac = Math.min(1, Math.max(0, Number(p) || 0));
  const rank = Math.ceil(frac * xs.length);
  return xs[Math.min(xs.length - 1, Math.max(0, rank - 1))];
}




































export const SPAN_SAMPLE = Object.freeze({
  on: '2026-09-22',
  by: 'scripts/span-stats.mjs',
  quietSeconds: 60,
  resting: Object.freeze({
    samples: 265, frames: 51, perFrame: 5.2, p50: 0, p95: 0.1, p99: 0.1, max: 0.3,
    labels: Object.freeze(['syncOrchard:view', 'syncOrchard', 'syncOrchard:diff', 'syncBuildings', 'syncFinds']),
  }),
  working: Object.freeze({
    spans: 5, p50: 7.3, p95: 76.2, max: 76.2,
    labels: Object.freeze(['syncOrchard', 'syncOrchard:show', 'syncBuildings', 'syncPlaced', 'syncOrchard:view']),
  }),
});





export const SPAN_HZ = 60;





















export const SLOW_MS_DEFAULT = Math.max(1, Math.ceil(Math.sqrt(SPAN_SAMPLE.resting.max * SPAN_SAMPLE.working.p50)));















export const SLOW_KEEP_DEFAULT = Math.ceil((SPAN_SAMPLE.resting.perFrame * SPAN_HZ) / 8) * 8;


export const SLOW_KEEP_MAX = 40000;













export function spanThreshold(override) {
  if (override === null || override === undefined || override === '') return SLOW_MS_DEFAULT;
  const n = Number(override);
  if (!Number.isFinite(n) || n < 0 || n > 1000) return SLOW_MS_DEFAULT;
  return n;
}


export function spanKeep(override) {
  if (override === null || override === undefined || override === '') return SLOW_KEEP_DEFAULT;
  const n = Number(override);
  if (!Number.isFinite(n) || n < 1) return SLOW_KEEP_DEFAULT;
  return Math.min(SLOW_KEEP_MAX, Math.floor(n));
}















export function slowLine(spans) {
  const s = spans || {};
  if (!s.last) return '';
  const parts = [`slow ${s.last.what} ${s.last.ms}ms`];
  if (s.worst && (s.worst.what !== s.last.what || s.worst.ms !== s.last.ms)) parts.push(`worst ${s.worst.what} ${s.worst.ms}ms`);
  if (s.count > 1) parts.push(`${s.count} over ${s.thresholdMs}ms`);
  return `  ${parts.join(' | ')}`;
}
