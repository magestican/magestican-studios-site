









import { LAUNCH_EVERY } from './sim/stage.js';
import { FIRE_RING } from './sim/sim.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));


export const ROLL_MAX = 0.6;
export const ROLL_SPEED = 300;

export const ROLL_RATE = 10;





export function shipRoll(roll, vx, dt) {
  const want = -clamp(vx / ROLL_SPEED, -1, 1) * ROLL_MAX;
  return roll + (want - roll) * (1 - Math.exp(-ROLL_RATE * dt));
}


export function sway(t, seed = 0) {
  const p = seed * 1.7;
  return {
    bob: 2.5 * Math.sin(TAU * 0.7 * t + p) + 0.8 * Math.sin(TAU * 1.9 * t + p * 0.6),
    pitch: 0.05 * Math.sin(TAU * 0.55 * t + p * 1.3),
    yaw: 0.04 * Math.sin(TAU * 0.43 * t + p * 0.8),
  };
}


export const thrustLevel = (speed) => Math.min(1.5, 0.35 + Math.max(0, speed) / 300);


export const corePulse = (t, seed = 0) => 1.05 + 0.4 * Math.sin(TAU * 1.4 * t + seed * 2.3);





export function bayOpen(age) {
  const c = age - 120;
  if (c < 0) return 0;
  const ph = c % LAUNCH_EVERY;
  if (ph < 20 || ph >= 110) return 0;
  if (ph < 60) return (ph - 20) / 40;
  if (ph < 80) return 1;
  return 1 - (ph - 80) / 30;
}







export function bossRig(t, rest, fa) {
  const resting = rest > 0;
  const breathe = 0.5 + 0.5 * Math.sin(TAU * 0.35 * t);
  return {
    armour: (resting ? 12 : 5) * breathe,
    hammer: (resting ? 0.12 : 0.45) * Math.sin(TAU * (resting ? 0.6 : 1.6) * t),
    turret: 0.3 * Math.sin(TAU * 0.3 * t + 0.7),
  };
}





export function muzzlesSince(s, seen) {
  if (s.nfire < seen) seen = s.nfire; 
  if (s.nfire - seen > FIRE_RING) seen = s.nfire - FIRE_RING;
  const list = [];
  for (; seen < s.nfire; seen++) {
    const i = seen & (FIRE_RING - 1);
    list.push({ x: s.fireX[i], y: s.fireY[i], pol: s.fireP[i] });
  }
  return { seen, list };
}
