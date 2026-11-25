

















import { createDriver } from '../../../web-engine/kart/kartAi.js';


export const ASSIST_TOUCH = 0.85;
const LIFT_FLOOR = 0.55;

const clamp1 = (v) => Math.max(-1, Math.min(1, v));


export function createCoDriver(slot = 0) {
  const d = createDriver(slot, 'stampede');
  d.lineBias = 0;
  d.phase = 0;
  return d;
}








export const EDGE_START = 0.55;
export const EDGE_PUSH = 2.0;





export function edgeNudge(lateral, half) {
  if (!(half > 0)) return 0;
  const f = Math.abs(lateral) / half;
  if (f <= EDGE_START) return 0;
  const t = Math.min(1, (f - EDGE_START) / (1 - EDGE_START));
  return Math.sign(lateral) * EDGE_PUSH * t * t;
}





export function assistInput(mine, co, assist, edge = null) {
  const a = Math.max(0, Math.min(1, Number(assist) || 0));
  if (a === 0 || !co) return mine;
  const p = clamp1(mine.steer ?? 0);
  const nudge = edge ? a * edgeNudge(edge.lateral ?? 0, edge.half ?? 0) : 0;
  const steer = clamp1(p + a * clamp1(co.steer ?? 0) * (1 - Math.abs(p)) + nudge);
  let throttle = mine.throttle ?? 0;
  if (throttle > 0) {
    const lift = Math.max(LIFT_FLOOR, Math.min(1, co.throttle ?? 1));
    throttle = Math.min(throttle, 1 - a * (1 - lift));
  }
  return { ...mine, steer, throttle };
}





export function assistFor(setting, isTouch) {
  const on = typeof setting === 'boolean' ? setting : !!isTouch;
  return on ? ASSIST_TOUCH : 0;
}
