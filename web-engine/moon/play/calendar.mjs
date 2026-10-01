























import {
  CALENDAR, birthdayOf, birthdayOnDay, calendarDay, isBirthday, isMarketDay, isMarketDayNum, weekdayOf,
} from '../economy/town.mjs';
import { TOWN_SPOTS } from '../world/moonLayout.mjs';

export { CALENDAR, birthdayOf, birthdayOnDay, calendarDay, isBirthday, isMarketDay, isMarketDayNum, weekdayOf };



export const EVENT_HOURS = Object.freeze({
  birthday: Object.freeze({ from: 10 * 60 }),
  marketGather: Object.freeze({ from: 10 * 60 }),
});






export function eventFor(villager, day, world) {
  const b = birthdayOnDay(world, day);
  if (b && b.id === villager.id) return 'birthday';
  if (isMarketDayNum(day)) return 'marketGather';
  return null;
}







export const MARKET_STALLS = Object.freeze([
  Object.freeze({ id: 'market-day-1', item: 'marketStall', dx: -4.5, dz: 0, rotY: 0 }),
  Object.freeze({ id: 'market-day-2', item: 'marketStall', dx: 4.5, dz: -1.5, rotY: 0 }),
]);


export function marketStallsOn(day) {
  return isMarketDayNum(day) ? marketStallSpots() : [];
}

export function marketStallSpots() {
  const m = TOWN_SPOTS.market;
  return MARKET_STALLS.map((s) => ({ id: s.id, item: s.item, spot: { x: m.x + s.dx, z: m.z + s.dz, rotY: s.rotY } }));
}

const nameIn = (world, v, nameOf) => (nameOf ? nameOf(v, world.villagers || []) : `Villager ${v.id}`);






export function calendarNotice(world, day, nameOf = null) {
  const parts = [];
  const today = birthdayOnDay(world, day);
  const tomorrow = birthdayOnDay(world, day + 1);
  if (today) parts.push(`Today is ${nameIn(world, today, nameOf)}'s birthday - a gift means three times as much.`);
  else if (tomorrow) parts.push(`Tomorrow is ${nameIn(world, tomorrow, nameOf)}'s birthday!`);
  if (isMarketDayNum(day)) parts.push('Market day: two more stalls by the Mercato.');
  return parts.length ? parts.join(' ') : null;
}


export const BIRTHDAY_LINE = Object.freeze({ text: "It's my birthday today! Everyone's been so kind.", mood: 'happy' });
export const THANKS_LINE = (goods) => Object.freeze({ text: `${goods.charAt(0).toUpperCase()}${goods.slice(1)}! Thank you for filling my notice.`, mood: 'amazement' });






export function calendarLines(world, v, t, request = null, goodName = (g, n) => `${n} ${g}`) {
  const out = [];
  if (isBirthday(world, v.id, t)) out.push(BIRTHDAY_LINE);
  if (request && request.filled && request.villager === v.id) out.push(THANKS_LINE(goodName(request.good, request.count)));
  return out;
}
