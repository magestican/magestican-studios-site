











import { PH_CLEAR, PH_FAIL, MODE_HARD } from './sim/sim.js';
import { WINDOWS } from './sim/windows.js';

export const GAME_ID = 'glassbreak';

export const GB_METRICS = Object.freeze(['gbWindows', 'gbReached', 'gbBosses', 'gbThreeStars', 'gbMoths', 'gbCoopClears',
  'gbHardBosses', 'gbDaylight']);

export const emptyMarks = () => ({ moths: 0, tick: 0, reached: 0 });







export function reportFor(s, marks, { coop = false, reached = 0 } = {}) {
  
  if (s.phase !== PH_CLEAR && s.phase !== PH_FAIL) return { msg: null, marks };
  const won = s.phase === PH_CLEAR;
  const w = WINDOWS[s.wi];
  const metrics = {};
  const put = (k, v) => { if (v > 0) metrics[k] = v; };
  if (won) {
    put('gbWindows', 1);
    put('gbBosses', w.boss ? 1 : 0);
    put('gbThreeStars', (s.stars[s.wi] || 0) >= 3 ? 1 : 0);
    put('gbCoopClears', coop ? 1 : 0);
    put('gbHardBosses', w.boss && s.mode === MODE_HARD ? 1 : 0);
    put('gbDaylight', s.wi === WINDOWS.length - 1 ? 1 : 0);
  }
  const nowReached = Math.max(marks.reached, reached, won ? s.wi + 1 : 0);
  put('gbReached', nowReached - Math.max(marks.reached, reached));
  put('gbMoths', s.stats.moths - marks.moths);
  const seconds = Math.max(1, Math.round((s.tick - Math.max(marks.tick, s.wt)) / 60));
  return {
    msg: { game: GAME_ID, outcome: won ? 'win' : 'loss', mode: coop ? 'online' : 'solo', seconds, metrics },
    marks: { moths: s.stats.moths, tick: s.tick, reached: nowReached },
  };
}
