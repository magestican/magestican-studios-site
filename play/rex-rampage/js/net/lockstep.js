


import { stepGame } from '../sim.js';

export const TICK_S = 0.1;

const MAX_TICKS_PER_CALL = 600;

export const createLockstep = () => ({ ticks: 0 });






export function advanceTo(ls, game, railS, input) {
  const target = Math.floor(railS / TICK_S + 1e-6);
  let n = 0;
  while (ls.ticks < target && n < MAX_TICKS_PER_CALL) {
    stepGame(game, TICK_S, input);
    ls.ticks++;
    n++;
  }
  return n;
}
