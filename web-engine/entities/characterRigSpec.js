


































































export const HIP_Y = Object.freeze({
  chicken: 0.14,
  cow: 0.16,
  pig: 0.22,
  sheep: 0.19,
});



export const LEG_COUNT = Object.freeze({
  chicken: 2, cow: 4, pig: 4, sheep: 4,
});











export const STRIDE = Object.freeze({
  chicken: 0.85, cow: 1.60, pig: 1.35, sheep: 1.40,
});







export const SWING_DEG = Object.freeze({
  
  
  
  
  chicken: 30, cow: 24, pig: 22, sheep: 26,
});



export const LEG_LEN = Object.freeze({
  chicken: 0.31, cow: 0.38, pig: 0.45, sheep: 0.41,
});































export const WING = Object.freeze({
  foldDeg: 6,          
  runDeg: 22,          
  flyDeg: 62,          
  runHz: 6.5,          
  flyHz: 9.0,          
});












export const FULL_GAIT_SPEED = 4.0;


export const WALK_ON_SPEED = 0.35;

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;






export function gaitPhase(distance, kind = 'cow') {
  const s = STRIDE[kind] ?? STRIDE.cow;
  if (!Number.isFinite(distance) || s <= 0) return 0;
  const p = (distance / s) % 1;
  return p < 0 ? p + 1 : p;
}




export function gaitWeight(speed) {
  const s = Number.isFinite(speed) ? Math.abs(speed) : 0;
  if (s <= WALK_ON_SPEED) return 0;
  const t = Math.min(1, (s - WALK_ON_SPEED) / (FULL_GAIT_SPEED - WALK_ON_SPEED));
  return t * t * (3 - 2 * t);        
}













export function legPhaseOffsets(kind = 'cow') {
  if ((LEG_COUNT[kind] ?? 4) === 2) return [0, 0.5];
  
  return [0, 0.5, 0.5, 0];
}








export function legSwing(phase, legIndex, kind = 'cow', weight = 1) {
  const offs = legPhaseOffsets(kind);
  const off = offs[legIndex % offs.length] ?? 0;
  const amp = (SWING_DEG[kind] ?? 24) * RAD * clamp01(weight);
  return Math.sin((phase + off) * TAU) * amp;
}

















export function bodyBounce(phase, kind = 'cow', weight = 1) {
  const w = clamp01(weight);
  const legLen = LEG_LEN[kind] ?? 0.38;
  const maxSwing = (SWING_DEG[kind] ?? 24) * RAD * w;
  
  
  
  const swung = Math.abs(Math.sin(phase * TAU));
  
  
  return -legLen * (1 - Math.cos(maxSwing * swung));
}








export function wingAngle(timeSec, speed = 0, airborne = false, phaseOffset = 0) {
  const t = Number.isFinite(timeSec) ? timeSec : 0;
  const run = gaitWeight(speed);
  const hz = airborne ? WING.flyHz : WING.runHz;
  const amp = airborne ? WING.flyDeg : (WING.runDeg * run);
  const wave = Math.sin((t * hz + phaseOffset) * TAU);
  
  
  return (WING.foldDeg + amp * (wave * 0.5 + 0.5)) * RAD;
}




export function headBob(phase, kind = 'cow', weight = 1) {
  const deg = kind === 'chicken' ? 7 : 3;
  return Math.sin(phase * TAU) * deg * RAD * clamp01(weight);
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}






export function footDrop(kind = 'cow') {
  const deg = SWING_DEG[kind] ?? 24;
  return Math.cos(deg * RAD);
}
