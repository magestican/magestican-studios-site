


import { MOVE_MAX } from './sim/input.js';

export const DEAD_ZONE = 0.2;

export function stickToMove(ax, ay) {
  const mag = Math.hypot(ax, ay);
  if (!(mag > DEAD_ZONE)) return { x: 0, y: 0 };
  const k = Math.min(1, (mag - DEAD_ZONE) / (1 - DEAD_ZONE)) / mag;
  return { x: Math.round(ax * k * MOVE_MAX), y: Math.round(ay * k * MOVE_MAX) };
}
