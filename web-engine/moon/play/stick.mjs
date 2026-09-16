
















export const STICK = Object.freeze({
  
  radiusPx: 56,
  
  deadZone: 0.14,
  
  runFraction: 0.8,
  
  
  runHysteresis: 0.08,
  
  
  responseExponent: 1.6,
  
  followRadii: 1.35,
});

export const KEYS = Object.freeze({
  forward: Object.freeze(['KeyW', 'ArrowUp']),
  back: Object.freeze(['KeyS', 'ArrowDown']),
  left: Object.freeze(['KeyA', 'ArrowLeft']),
  right: Object.freeze(['KeyD', 'ArrowRight']),
  run: Object.freeze(['ShiftLeft', 'ShiftRight']),
  
  pickUp: Object.freeze(['KeyE', 'Space']),
  carry: Object.freeze(['KeyC']),
  
  fell: Object.freeze(['KeyF']),
  
  seed: Object.freeze(['KeyQ']),
  
  
  
  craft: Object.freeze(['KeyB']),
  turn: Object.freeze(['KeyR']),
  cancel: Object.freeze(['Escape']),
  
  
  
  jump: Object.freeze(['KeyJ']),
});

const NONE = Object.freeze({ x: 0, y: 0, amount: 0, run: false });








export function stickFromPointer(origin, pointer, { wasRunning = false } = {}, cfg = STICK) {
  const dx = pointer.x - origin.x;
  const dy = pointer.y - origin.y;
  const dist = Math.hypot(dx, dy);
  const fraction = Math.min(1, dist / cfg.radiusPx);
  const clamp = dist > cfg.radiusPx ? cfg.radiusPx / dist : 1;
  const knob = { knobX: dx * clamp, knobY: dy * clamp };
  if (dist === 0 || fraction < cfg.deadZone) return { ...NONE, fraction, ...knob };
  const run = fraction >= (wasRunning ? cfg.runFraction - cfg.runHysteresis : cfg.runFraction);
  const walk = Math.min(1, (fraction - cfg.deadZone) / (cfg.runFraction - cfg.deadZone));
  return { x: dx / dist, y: -dy / dist, amount: run ? 1 : walk ** cfg.responseExponent, run, fraction, ...knob };
}


export function dragOrigin(origin, pointer, cfg = STICK) {
  const dx = pointer.x - origin.x;
  const dy = pointer.y - origin.y;
  const dist = Math.hypot(dx, dy);
  const limit = cfg.radiusPx * cfg.followRadii;
  if (dist <= limit) return { x: origin.x, y: origin.y };
  const k = (dist - limit) / dist;
  return { x: origin.x + dx * k, y: origin.y + dy * k };
}

const anyOf = (pressed, codes) => codes.some((c) => pressed.has(c));


export function keyboardIntent(pressed) {
  const x = (anyOf(pressed, KEYS.right) ? 1 : 0) - (anyOf(pressed, KEYS.left) ? 1 : 0);
  const y = (anyOf(pressed, KEYS.forward) ? 1 : 0) - (anyOf(pressed, KEYS.back) ? 1 : 0);
  if (x === 0 && y === 0) return NONE;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len, amount: 1, run: anyOf(pressed, KEYS.run) };
}






export function screenToWorld(sx, sy, cameraYaw = 0) {
  const c = Math.cos(cameraYaw), s = Math.sin(cameraYaw);
  return { x: sx * c - sy * s, z: -sx * s - sy * c };
}


export function worldIntent(intent, cameraYaw = 0) {
  if (!intent || !(intent.amount > 0)) return { dirX: 0, dirZ: 0, amount: 0, run: false, cameraYaw };
  const w = screenToWorld(intent.x, intent.y, cameraYaw);
  return { dirX: w.x, dirZ: w.z, amount: intent.amount, run: Boolean(intent.run), cameraYaw };
}
