
































export const MOVE = Object.freeze({
  
  
  
  
  
  deadzone: 0.1,
  
  
  
  turnRate: 9,
  
  
  
  maxBasisStepDeg: 8,
});









export function moveBasis(eye, target) {
  const fx = target.x - eye.x; const fz = target.z - eye.z;
  const m = Math.hypot(fx, fz);
  if (!(m > 1e-9)) return { fx: 0, fz: 1, rx: -1, rz: 0 };
  return { fx: fx / m, fz: fz / m, rx: -fz / m, rz: fx / m };
}








export function moveVector(basis, fwd, strafe, deadzone = MOVE.deadzone) {
  const raw = Math.hypot(fwd, strafe);
  if (!(raw > deadzone)) return { dx: 0, dz: 0, mag: 0 };
  
  const mag = Math.min(1, (raw - deadzone) / (1 - deadzone));
  const ux = strafe / raw; const uz = fwd / raw;
  return {
    dx: (basis.fx * uz + basis.rx * ux) * mag,
    dz: (basis.fz * uz + basis.rz * ux) * mag,
    mag,
  };
}







export const yawFor = (dx, dz) => Math.atan2(-dx, dz);

export const facingOf = (yaw) => ({ x: -Math.sin(yaw || 0), z: Math.cos(yaw || 0) });


export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));







export function turnToward(yaw, want, rate = MOVE.turnRate, dt = 0) {
  if (!(dt > 0)) return yaw;
  const d = wrapAngle(want - yaw);
  return wrapAngle(yaw + d * (1 - Math.exp(-rate * dt)));
}


export function basisAngle(a, b) {
  const dot = Math.max(-1, Math.min(1, a.fx * b.fx + a.fz * b.fz));
  return (Math.acos(dot) * 180) / Math.PI;
}








export function basisContinuity(bases) {
  let max = 0; let at = -1;
  for (let i = 1; i < bases.length; i += 1) {
    const d = basisAngle(bases[i - 1], bases[i]);
    if (d > max) { max = d; at = i; }
  }
  return { max, at };
}







export function stickFor(basis, dx, dz) {
  const m = Math.hypot(dx, dz);
  if (!(m > 1e-9)) return { fwd: 0, strafe: 0 };
  const ux = dx / m; const uz = dz / m;
  return { fwd: ux * basis.fx + uz * basis.fz, strafe: ux * basis.rx + uz * basis.rz };
}
