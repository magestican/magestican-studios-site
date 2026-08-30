
































































const clamp01 = (v) => (v < 0 ? 0 : (v > 1 ? 1 : v));










export const TRANSFORM_IN = 0.55;













export const TRANSFORM_OUT = 0.85;








export const PHASE_WINDOWS = Object.freeze({
  floats: Object.freeze([0.00, 0.45]),
  drive: Object.freeze([0.25, 0.75]),
  wheels: Object.freeze([0.35, 0.85]),
  snorkel: Object.freeze([0.55, 1.00]),
  prop: Object.freeze([0.70, 1.00]),
  
  
  
  
  
  
  trim: Object.freeze([0.20, 0.80]),
});


export function smooth01(v) {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}


export function windowed(x, [a, b]) {
  if (b <= a) return x >= b ? 1 : 0;
  return smooth01((x - a) / (b - a));
}















export function stepDeploy(now, wantBoating, dt) {
  const from = clamp01(Number.isFinite(now) ? now : 0);
  const step = Math.max(0, Number.isFinite(dt) ? dt : 0);
  if (wantBoating) return clamp01(from + step / TRANSFORM_IN);
  return clamp01(from - step / TRANSFORM_OUT);
}









export function rigPhases(t) {
  const x = clamp01(Number.isFinite(t) ? t : 0);
  return {
    floats: windowed(x, PHASE_WINDOWS.floats),
    drive: windowed(x, PHASE_WINDOWS.drive),
    wheels: windowed(x, PHASE_WINDOWS.wheels),
    snorkel: windowed(x, PHASE_WINDOWS.snorkel),
    prop: windowed(x, PHASE_WINDOWS.prop),
    trim: windowed(x, PHASE_WINDOWS.trim),
  };
}


















export const WHEEL_TUCK = 0.18;
export const WHEEL_ROLL = (80 * Math.PI) / 180;














export const PROP_IDLE = 7.0;      
export const PROP_PER_MS = 2.4;    
export function propSpin(propPhase, speed, dt) {
  const p = clamp01(Number.isFinite(propPhase) ? propPhase : 0);
  const v = Math.abs(Number.isFinite(speed) ? speed : 0);
  const step = Math.max(0, Number.isFinite(dt) ? dt : 0);
  return p * (PROP_IDLE + v * PROP_PER_MS) * step;
}











export const KELVIN_HALF_ANGLE = Math.asin(1 / 3);











export const WAKE_STEP_MIN = 1.2;
export const WAKE_STEP_MAX = 2.4;
export function wakeGeometry(speed) {
  const v = Math.abs(Number.isFinite(speed) ? speed : 0);
  const k = clamp01(v / 26);
  return {
    halfAngle: KELVIN_HALF_ANGLE,
    step: WAKE_STEP_MIN + (WAKE_STEP_MAX - WAKE_STEP_MIN) * k,
    
    
    width: 0.45 + 0.60 * k,
    
    
    life: 2.4,
  };
}








export const RIG_VISIBLE_AT = 0.02;
export const rigVisible = (t) => (Number.isFinite(t) ? t : 0) > RIG_VISIBLE_AT;
