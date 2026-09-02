














































export const BASE_FOV = 60;
export const BASE_ASPECT = 16 / 9;
export const TARGET_H_FOV = 2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) * BASE_ASPECT);








export const FOV_MAX = 90;



















export const FOV_MIN_DESKTOP = BASE_FOV;
export const FOV_MIN_TOUCH = 74;

const DEG = 180 / Math.PI;










export function raceFov(w, h, { touch = false } = {}) {
  
  
  
  
  
  
  
  
  if (!touch) return FOV_MIN_DESKTOP;
  
  
  
  
  if (!(w > 0) || !(h > 0)) return FOV_MIN_TOUCH;
  const aspect = w / h;
  const vertical = 2 * Math.atan(Math.tan(TARGET_H_FOV / 2) / aspect) * DEG;
  return Math.max(FOV_MIN_TOUCH, Math.min(FOV_MAX, vertical));
}




export function horizontalFov(fovDeg, w, h) {
  if (!(w > 0) || !(h > 0)) return 0;
  return 2 * Math.atan(Math.tan((fovDeg * Math.PI) / 360) * (w / h)) * DEG;
}


























export const V_FOV_CEILING = 100;

export const H_FOV_CEILING = 125;






export function fovCeiling(w, h) {
  if (!(w > 0) || !(h > 0)) return V_FOV_CEILING;
  const aspect = w / h;
  const fromHorizontal = 2 * Math.atan(Math.tan((H_FOV_CEILING * Math.PI) / 360) / aspect) * DEG;
  return Math.min(V_FOV_CEILING, fromHorizontal);
}
