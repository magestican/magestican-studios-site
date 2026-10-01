













































export const ANIM_RATE = Object.freeze({
  
  
  fullM: 11,
  
  midM: 18,
  midHz: 30,
  farHz: 12,
});








export function animStepS(distanceM, { near = false, cfg = ANIM_RATE } = {}) {
  if (near) return 0;
  if (!Number.isFinite(distanceM) || distanceM <= cfg.fullM) return 0;
  return distanceM <= cfg.midM ? 1 / cfg.midHz : 1 / cfg.farHz;
}





export function posesPerSecond(distanceM, { near = false, fps = 60, cfg = ANIM_RATE } = {}) {
  const step = animStepS(distanceM, { near, cfg });
  return step === 0 ? fps : Math.min(fps, 1 / step);
}











export function behindCamera({ x, z }, eye, focus) {
  if (!eye || !focus) return false;
  const fx = focus.x - eye.x, fz = focus.z - eye.z;
  return (x - eye.x) * fx + (z - eye.z) * fz < 0;
}
