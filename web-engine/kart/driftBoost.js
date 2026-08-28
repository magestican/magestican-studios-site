




















export const TIER_TIMES = Object.freeze([0.34, 0.80, 1.45]);









export const TIERS = Object.freeze([
  null,
  Object.freeze({ tier: 1, time: 0.85, power: 1.20, name: 'spark' }),
  Object.freeze({ tier: 2, time: 1.35, power: 1.28, name: 'flame' }),
  Object.freeze({ tier: 3, time: 2.10, power: 1.33, name: 'inferno' }),
]);


export function driftTier(charge) {
  if (charge >= TIER_TIMES[2]) return 3;
  if (charge >= TIER_TIMES[1]) return 2;
  if (charge >= TIER_TIMES[0]) return 1;
  return 0;
}


export function boostForCharge(charge) {
  return TIERS[driftTier(charge)];
}
















export function chargeRate(
  { speed, steerLock, onRoad = true, topSpeed = 30 },
  { minSpeed = 9, offRoadScale = 0.45 } = {},
) {
  if (Math.abs(speed) < minSpeed) return 0;
  const tight = Math.min(1, Math.max(0, Math.abs(steerLock)));
  
  
  
  const byLock = 0.55 + 0.45 * tight;
  const bySpeed = Math.min(1, Math.abs(speed) / (topSpeed * 0.72));
  return byLock * bySpeed * (onRoad ? 1 : offRoadScale);
}









export function applyBoost(current, next) {
  if (!next) return current;
  if (!current || current.time <= 0) return { time: next.time, power: next.power, name: next.name };
  return {
    time: Math.max(current.time, next.time),
    power: Math.max(current.power, next.power),
    name: next.power >= current.power ? next.name : current.name,
  };
}
