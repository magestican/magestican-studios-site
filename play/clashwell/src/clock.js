

import { TICKS_PER_SECOND } from '../../../web-engine/clashwell/match.js';

const TICK_MS = 1000 / TICKS_PER_SECOND;
export const MAX_TICKS_PER_WAKE = 30;

export function createClock() {
  let owed = 0;
  return {
    advance(ms) {
      owed += ms;
      
      const ticks = Math.floor((owed + 1e-6) / TICK_MS);
      owed -= ticks * TICK_MS;
      if (ticks > MAX_TICKS_PER_WAKE) {
        owed = 0;
        return MAX_TICKS_PER_WAKE;
      }
      return ticks;
    },
  };
}
