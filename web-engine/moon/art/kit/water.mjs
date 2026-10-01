

























export const RIPPLE = Object.freeze({
  
  pool: 0.018,
  
  basin: 0.008,
  
  flow: 0.03,
  
  jet: 0.045,
  
  flame: 0.06,
});












export function surfaceRamp(radii, outer, { edge = 0.2 } = {}) {
  const span = Math.max(1e-6, outer * edge);
  return radii.map((r) => Math.max(0, Math.min(1, (outer - r) / span)));
}







export function fallRamp(ys, { share = 0.35 } = {}) {
  const top = Math.max(...ys), bottom = Math.min(...ys);
  const span = Math.max(1e-6, (top - bottom) * share);
  return ys.map((y) => Math.max(0, Math.min(1, (top - y) / span)));
}





export function jetRamp(ys) {
  const top = Math.max(...ys), bottom = Math.min(...ys);
  const span = Math.max(1e-6, top - bottom);
  return ys.map((y) => Math.max(0, Math.min(1, (y - bottom) / span)));
}
