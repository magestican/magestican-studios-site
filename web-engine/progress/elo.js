























export const ELO = Object.freeze({ start: 1200, floor: 100, ceil: 4000, kNew: 32, kSettled: 24, settledAfter: 30 });

export const newRating = () => ({ r: ELO.start, n: 0, peak: ELO.start, at: 0 });

export function expected(a, b) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}








export function rateMatch(me, opponents, nowMs = 0) {
  const humans = opponents.filter((o) => Number.isFinite(o?.r));
  if (humans.length === 0) return { ...me, delta: 0 };
  const k = me.n < ELO.settledAfter ? ELO.kNew : ELO.kSettled;
  const share = k / humans.length;
  let delta = 0;
  for (const o of humans) {
    const score = me.place < o.place ? 1 : me.place === o.place ? 0.5 : 0;
    delta += share * (score - expected(me.r, o.r));
  }
  const d = Math.round(delta);
  const r = Math.min(ELO.ceil, Math.max(ELO.floor, me.r + d));
  return { r, n: me.n + 1, peak: Math.max(me.peak, r), at: nowMs, delta: r - me.r };
}




















export function mergeRating(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.n !== b.n) return a.n > b.n ? a : b;
  const ta = a.at || 0;
  const tb = b.at || 0;
  if (ta !== tb) return ta > tb ? a : b;
  if (a.r !== b.r) return a.r < b.r ? a : b;
  return (a.peak || 0) <= (b.peak || 0) ? a : b;
}
