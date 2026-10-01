



















export const MASTERY_THRESHOLDS = Object.freeze([0, 3, 10, 25, 50, 90, 150, 240, 360, 520]);

export const MASTERY_MAX = MASTERY_THRESHOLDS.length;

const whole = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};


export function masteryScore(counts) {
  const c = counts && typeof counts === 'object' ? counts : {};
  return whole(c.plays) + 3 * whole(c.wins);
}








export function masteryOf(counts) {
  const score = masteryScore(counts);
  let i = 0;
  for (let k = 0; k < MASTERY_THRESHOLDS.length; k++) if (score >= MASTERY_THRESHOLDS[k]) i = k;
  if (i === MASTERY_THRESHOLDS.length - 1) return { tier: MASTERY_MAX, fraction: 1 };
  const lo = MASTERY_THRESHOLDS[i];
  const hi = MASTERY_THRESHOLDS[i + 1];
  return { tier: i + 1, fraction: (score - lo) / (hi - lo) };
}
