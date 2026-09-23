














import { SUNRISE, SUNSET } from '../light/dayCycle.mjs';
import { CLOCK } from './tables.mjs';
import { MS } from './math.mjs';




export const DAY_MS = CLOCK.day_s * MS;
export const WORK_DAY_MS = DAY_MS;

export const REAL_DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const DAWN_MS = Math.round(SUNRISE * HOUR_MS);
const DUSK_MS = Math.round(SUNSET * HOUR_MS);


export function msIntoDay(world, t) {
  return ((t - (world.tzOffsetMin || 0) * 60000) % REAL_DAY_MS + REAL_DAY_MS) % REAL_DAY_MS;
}


export function hourAt(world, t) {
  return msIntoDay(world, t) / HOUR_MS;
}

export function isDark(world, t) {
  const m = msIntoDay(world, t);
  return m >= DUSK_MS || m < DAWN_MS;
}


export function nextDusk(world, t) {
  return t + ((DUSK_MS - msIntoDay(world, t) + REAL_DAY_MS) % REAL_DAY_MS);
}
