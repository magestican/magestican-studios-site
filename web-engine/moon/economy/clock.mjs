







import { SUNRISE, SUNSET } from '../light/dayCycle.mjs';
import { CLOCK } from './tables.mjs';
import { MS } from './math.mjs';

export const DAY_MS = CLOCK.day_s * MS;
const START_MS = Math.round((CLOCK.startHour / 24) * DAY_MS);
const DAWN_MS = Math.round((SUNRISE / 24) * DAY_MS);
const DUSK_MS = Math.round((SUNSET / 24) * DAY_MS);

export function msIntoDay(world, t) {
  const m = (t - world.createdAt + START_MS) % DAY_MS;
  return m < 0 ? m + DAY_MS : m;
}

export function hourAt(world, t) {
  return (msIntoDay(world, t) / DAY_MS) * 24;
}

export function isDark(world, t) {
  const m = msIntoDay(world, t);
  return m >= DUSK_MS || m < DAWN_MS;
}


export function nextDusk(world, t) {
  return t + ((DUSK_MS - msIntoDay(world, t) + DAY_MS) % DAY_MS);
}
