














import { TICKS_PER_SECOND } from './fixed.js';
import { HERD, YIELD } from './roster.js';
















export const EVENT_BONUS_LAND_TICKS = 15 * TICKS_PER_SECOND;








export const SCORING_EVENTS = Object.freeze({
  [YIELD]: 'stockRecovered',
  [HERD]: 'farmUnmade',
});


export function scoresFor(faction, event) {
  return SCORING_EVENTS[faction] === event;
}










export const POINTS_FINISH = 40;


export const POINTS_SHARE_MAX = 120;


export const POINTS_PLACEMENT = Object.freeze([100, 45, 20, 10]);


export const POINTS_PER_CAPTURE = 2;
export const POINTS_CAPTURE_MAX = 40;








export const TICKS_PER_WATER_POINT = 10 * TICKS_PER_SECOND;
export const POINTS_WATER_MAX = 30;






export const COMEBACK_UNDER_PCT = 25;
export const POINTS_COMEBACK = 25;














export function matchPoints({
  score = 0, totalScore = 0, placement = 4, sectorsCaptured = 0,
  waterHoldTicks = 0, lowestSharePct = 100, quit = false,
} = {}) {
  
  
  
  
  let points = quit ? 0 : POINTS_FINISH;

  
  
  if (totalScore > 0 && score > 0) {
    points += Math.floor((score * POINTS_SHARE_MAX) / totalScore);
  }

  if (!quit) {
    const idx = Math.max(1, Math.min(POINTS_PLACEMENT.length, Math.floor(placement))) - 1;
    points += POINTS_PLACEMENT[idx];
  }

  points += Math.min(POINTS_CAPTURE_MAX, Math.max(0, Math.floor(sectorsCaptured)) * POINTS_PER_CAPTURE);
  points += Math.min(POINTS_WATER_MAX, Math.floor(Math.max(0, waterHoldTicks) / TICKS_PER_WATER_POINT));

  if (!quit && lowestSharePct < COMEBACK_UNDER_PCT && placement <= 2) {
    points += POINTS_COMEBACK;
  }

  return points;
}











export const XP_PER_PLAY = 10;
export const XP_PER_WIN = 40;











export const POINTS_PER_XP = 10;

export function xpFromMatch(points, won) {
  return XP_PER_PLAY
    + (won ? XP_PER_WIN : 0)
    + Math.floor(Math.max(0, points) / POINTS_PER_XP);
}









const LADDER = Object.freeze([
  Object.freeze({ from: 20, [HERD]: 'The Waking', [YIELD]: 'The Board' }),
  Object.freeze({ from: 15, [HERD]: 'Elder', [YIELD]: 'Director' }),
  Object.freeze({ from: 11, [HERD]: 'Speaker', [YIELD]: 'Regional' }),
  Object.freeze({ from: 8, [HERD]: 'Pathfinder', [YIELD]: 'Manager' }),
  Object.freeze({ from: 5, [HERD]: 'Drover', [YIELD]: 'Overseer' }),
  Object.freeze({ from: 3, [HERD]: 'Yearling', [YIELD]: 'Leading Hand' }),
  Object.freeze({ from: 1, [HERD]: 'Hatchling', [YIELD]: 'Hand' }),
]);






export function rankTitle(level, faction) {
  const l = Math.max(1, Math.floor(level || 1));
  for (const rung of LADDER) {
    if (l >= rung.from) return rung[faction] || rung[HERD];
  }
  return LADDER[LADDER.length - 1][faction];
}
