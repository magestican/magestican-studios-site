














import { FP } from './fixed.js';
import { aimAt, fan, gentleSpeed, nearestPlayer, ring } from './patterns.js';

export const TURNCOAT = 0, SEEDMINE = 1, LANCE = 2, AFTERBURN = 3;
export const SKILL_NAMES = Object.freeze(['Turncoat', 'Seedmine', 'Lance', 'Afterburn']);

export const SKILL_FROM = Object.freeze([1, 2, 3, 4]);
export const hasSkill = (stage, skill) => stage >= SKILL_FROM[skill];


export const REACT_TICKS = 40;




export const TURN_FIRST = 240, TURN_EVERY = 200, TURN_TELL = 60;
export const turnsNow = (age) => age >= TURN_FIRST && (age - TURN_FIRST) % TURN_EVERY === 0;

export function turnLeft(age) {
  if (age < TURN_FIRST - TURN_TELL) return -1;
  const left = age < TURN_FIRST ? TURN_FIRST - age : (TURN_EVERY - ((age - TURN_FIRST) % TURN_EVERY)) % TURN_EVERY;
  return left > 0 && left <= TURN_TELL ? left : -1;
}





export const POD_FUSE = 120, POD_FALL = FP, POD_RING = 10, POD_SPEED = 3 * FP / 2, POD_HP = 3, POD_R = 12, POD_SCORE = 50;
export const HEAVY_POD = 210, BULWARK_POD_FIRST = 330, BULWARK_POD_EVERY = 240, BULWARK_POD_LAST = 1100;
export const podDrops = (heavy, age) => (heavy ? age === HEAVY_POD
  : age >= BULWARK_POD_FIRST && age <= BULWARK_POD_LAST && (age - BULWARK_POD_FIRST) % BULWARK_POD_EVERY === 0);

export function bloom(out, x, y, pol, thin) {
  ring(out, x, y, POD_RING, 0, POD_SPEED, pol, 1, thin);
}



export const LANCE_TELL = 50, LANCE_N = 5;
const LANCE_V = [3 * FP, 7 * FP / 2, 4 * FP, 9 * FP / 2, 5 * FP];
export function lance(out, x, y, pol, thin) {
  for (let i = 0; i < LANCE_N; i++) {
    if (thin && (i & 1)) continue;
    out.push([x, y, 0, gentleSpeed(LANCE_V[i], thin), pol, 2]);
  }
}




export const BURN_CLEAR = 96, BURN_SPEED = 3 * FP / 2, BURN_STEP = 200;
export function afterburn(out, x, y, pol, players, thin) {
  const p = nearestPlayer(players, x, y);
  if (!p) return false;
  const dx = (p.x - x) >> 8, dy = (p.y - y) >> 8;
  if (dx * dx + dy * dy < BURN_CLEAR * BURN_CLEAR) return false;
  fan(out, x, y, 3, aimAt(players, x, y), BURN_STEP, BURN_SPEED, pol, 0, thin);
  return true;
}


export const travelTicks = (px, speed) => Math.ceil((px * FP) / speed);
