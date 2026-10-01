





































import { SUNRISE, SUNSET, wrapHours } from '../light/dayCycle.mjs';
import { localDay } from './localClock.mjs';















export const DAY_PARTS = Object.freeze([
  Object.freeze({ id: 'night', from: 0 }),
  Object.freeze({ id: 'dawn', from: SUNRISE }),
  Object.freeze({ id: 'morning', from: SUNRISE + 1.5 }),
  Object.freeze({ id: 'midday', from: 11 }),
  Object.freeze({ id: 'afternoon', from: 14 }),
  Object.freeze({ id: 'evening', from: 17.5 }),
  Object.freeze({ id: 'dusk', from: SUNSET }),
  Object.freeze({ id: 'night', from: SUNSET + 1.75 }),
]);











export const WEATHER_GLYPHS = Object.freeze({
  clear: '☀',   
  windy: '≋',   
  misty: '≡',   
  rainy: '☂',   
  snowy: '❄',   
});

const CLEAR_GLYPH = '☀';  
















export function dayOf(now, firstPlayed, tzOffsetMin = 0) {
  if (!Number.isFinite(now) || !Number.isFinite(firstPlayed)) return 1;
  if (!Number.isFinite(tzOffsetMin)) tzOffsetMin = 0;
  const days = localDay(now, tzOffsetMin) - localDay(firstPlayed, tzOffsetMin);
  return days > 0 ? days + 1 : 1;
}


export function partOfDay(hour) {
  const h = wrapHours(Number.isFinite(hour) ? hour : 0);
  for (let i = DAY_PARTS.length - 1; i >= 0; i -= 1) {
    if (h >= DAY_PARTS[i].from) return DAY_PARTS[i].id;
  }
  return DAY_PARTS[0].id;
}

















export function sunArc(hour) {
  const h = wrapHours(Number.isFinite(hour) ? hour : 0);
  const up = h >= SUNRISE && h < SUNSET;
  const dayLen = SUNSET - SUNRISE;
  const nightLen = 24 - dayLen;
  
  
  
  const t = up
    ? (h - SUNRISE) / dayLen
    : ((h >= SUNSET ? h - SUNSET : h + 24 - SUNSET) / nightLen);
  const clamped = Math.max(0, Math.min(1, t));
  return { up, t: clamped, x: clamped, y: Math.sin(Math.PI * clamped) };
}


export function weatherGlyph(id) {
  return WEATHER_GLYPHS[id] || CLEAR_GLYPH;
}














export function dayLine({ now, firstPlayed, hour, weather, tzOffsetMin = 0 } = {}) {
  const day = dayOf(now, firstPlayed, tzOffsetMin);
  const part = partOfDay(hour);
  const id = (weather && weather.id) || 'clear';
  const label = (weather && weather.label) || 'clear';
  return {
    day,
    part,
    weather: id,
    label,
    glyph: weatherGlyph(id),
    arc: sunArc(hour),
    text: `Day ${day} - ${part} - ${label}`,
  };
}
