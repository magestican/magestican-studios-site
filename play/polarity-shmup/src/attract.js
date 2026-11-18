













import { FP } from './sim/fixed.js';
import { MOVE_MAX, pack } from './sim/input.js';
import { FIELD_H, FIELD_W } from './sim/patterns.js';
import { BURST_COST, DUET_R, createSim, step } from './sim/sim.js';

export const ATTRACT_TICKS = 50 * 60;

export const PRIMED_LEFT = 10;







export function createAttract(seed = 1) {
  const s = createSim({ seed, gentle: false });
  step(s, attractInputs(s));
  for (const p of s.players.slice(0, 2)) p.energy = BURST_COST - PRIMED_LEFT;
  return s;
}
export const FLIP_EVERY = 240;
export const ORBIT_R = 34 * FP;
const LEAD_PERIOD = 720, BOB_PERIOD = 430, ORBIT_PERIOD = 200;
const TAU = Math.PI * 2;


export function leadTarget(t) {
  return {
    x: Math.round(FIELD_W * (0.5 + 0.26 * Math.sin((t * TAU) / LEAD_PERIOD))),
    y: Math.round(FIELD_H * (0.48 + 0.05 * Math.sin((t * TAU) / BOB_PERIOD))),
  };
}


export function wingTarget(t, lead) {
  const a = (t * TAU) / ORBIT_PERIOD;
  return { x: Math.round(lead.x + ORBIT_R * Math.cos(a)), y: Math.round(lead.y + 0.5 * ORBIT_R * Math.sin(a)) };
}


export const leadIris = (t) => Math.trunc(t / FLIP_EVERY) % 2 === 1;

function steer(p, to) {
  
  const k = (v) => Math.max(-MOVE_MAX, Math.min(MOVE_MAX, Math.round(v / (FP / 8))));
  return { x: k(to.x - p.x), y: k(to.y - p.y) };
}


export function attractInputs(s) {
  const t = s.tick;
  const lt = leadTarget(t);
  const lead = s.players[0], wing = s.players[1];
  const li = leadIris(t);
  const a = pack({ ...steer(lead, lt), iris: li });
  const b = pack({ ...steer(wing, wingTarget(t, { x: lead.x, y: lead.y })), iris: !li });
  return [a, b, 0, 0];
}

export { DUET_R };
