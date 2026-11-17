


import { MOVE_MAX } from './sim/input.js';

export const DEAD_ZONE = 0.2;











export const DRAG_GAIN = 1;
export const BANK_TICKS = 3;
export const PER_TICK = 4.5; 

export function dragFeed(drag, dxScreen, dyScreen, scale) {
  const cap = PER_TICK * BANK_TICKS;
  drag.dx = Math.max(-cap, Math.min(cap, drag.dx + (dxScreen / scale) * DRAG_GAIN));
  drag.dy = Math.max(-cap, Math.min(cap, drag.dy + (dyScreen / scale) * DRAG_GAIN));
}

export function dragTake(drag) {
  if (!drag.dx && !drag.dy) return null;
  const mx = Math.max(-PER_TICK, Math.min(PER_TICK, drag.dx)), my = Math.max(-PER_TICK, Math.min(PER_TICK, drag.dy));
  drag.dx -= mx; drag.dy -= my;
  if (Math.abs(drag.dx) < 0.01) drag.dx = 0;
  if (Math.abs(drag.dy) < 0.01) drag.dy = 0;
  return { x: Math.round((mx / PER_TICK) * MOVE_MAX), y: Math.round((my / PER_TICK) * MOVE_MAX) };
}

export function dragRelease(drag) { drag.id = null; drag.dx = 0; drag.dy = 0; }

export function stickToMove(ax, ay) {
  const mag = Math.hypot(ax, ay);
  if (!(mag > DEAD_ZONE)) return { x: 0, y: 0 };
  const k = Math.min(1, (mag - DEAD_ZONE) / (1 - DEAD_ZONE)) / mag;
  return { x: Math.round(ax * k * MOVE_MAX), y: Math.round(ay * k * MOVE_MAX) };
}
