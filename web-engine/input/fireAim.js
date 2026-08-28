






































export const FIRE_AIM_SCALE = 0.35;








export const FIRE_AIM_DEADZONE_PX = 10;
















export function fireAimDelta(dyTotal, applied = 0, scale = FIRE_AIM_SCALE,
                             deadzone = FIRE_AIM_DEADZONE_PX) {
  if (!Number.isFinite(dyTotal)) return 0;
  const mag = Math.abs(dyTotal);
  
  
  
  
  const want = mag <= deadzone ? 0 : Math.sign(dyTotal) * (mag - deadzone) * scale;

  
  
  
  
  
  
  
  
  const delta = want - applied;
  return Number.isFinite(delta) ? delta : 0;
}






export function isAiming(dyTotal, deadzone = FIRE_AIM_DEADZONE_PX) {
  return Number.isFinite(dyTotal) && Math.abs(dyTotal) > deadzone;
}
