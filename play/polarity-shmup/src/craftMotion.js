











export const yawOf = (vx, vz) => Math.atan2(-vz, vx);

export const REST_YAW = yawOf(0, 1);

export const STILL_SPEED = 6;

export const TURN_RATE = 9;

export const BANK_GAIN = 0.16;
export const BANK_MAX = 0.7;

export const PITCH_GAIN = 0.0004;
export const PITCH_MAX = 0.18;

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));


export function createMotion(x, z, yaw = REST_YAW) {
  return { x, z, yaw, roll: 0, pitch: 0, speed: 0 };
}





export function stepMotion(m, x, z, dt) {
  if (!(dt > 0)) { m.x = x; m.z = z; return m; }
  const vx = (x - m.x) / dt, vz = (z - m.z) / dt;
  const speed = Math.hypot(vx, vz);
  
  if (speed > 4000) { m.x = x; m.z = z; m.speed = 0; return m; }
  const accel = (speed - m.speed) / dt;
  m.speed = speed;
  const target = speed < STILL_SPEED ? REST_YAW : yawOf(vx, vz);
  const k = 1 - Math.exp(-TURN_RATE * dt);
  const dYaw = wrap(target - m.yaw) * k;
  m.yaw = wrap(m.yaw + dYaw);
  const wantRoll = Math.max(-BANK_MAX, Math.min(BANK_MAX, -(dYaw / dt) * BANK_GAIN));
  m.roll += (wantRoll - m.roll) * k;
  
  const wantPitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, accel * PITCH_GAIN));
  m.pitch += (wantPitch - m.pitch) * k;
  m.x = x; m.z = z;
  return m;
}
