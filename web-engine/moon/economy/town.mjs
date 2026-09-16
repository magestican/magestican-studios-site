



































import { BP, draw, pickWeighted } from './math.mjs';
import { GOODS, STAPLES } from './tables.mjs';
import { DAY_MS } from './clock.mjs';

export const TOWN = Object.freeze({
  
  marketRate_bp: 6000,
  
  
  
  
  
  
  request: Object.freeze({
    
    
    openHour: 11,
    minCount: 3,
    maxCount: 9,
    coins_bp: 16000,
    points: 2,
    
    
    plainDays: 3,
  }),
  
  
  standings: Object.freeze([
    Object.freeze({ points: 0, label: 'a quiet hamlet', footfall_bp: 0 }),
    Object.freeze({ points: 6, label: 'a village', footfall_bp: 500 }),
    Object.freeze({ points: 16, label: 'a busy village', footfall_bp: 1200 }),
    Object.freeze({ points: 36, label: 'a proper town', footfall_bp: 2000 }),
    Object.freeze({ points: 70, label: 'the pride of the moon', footfall_bp: 3000 }),
  ]),
});




export const STORES = Object.freeze({
  emporium: Object.freeze({
    id: 'emporium', name: 'Emporio', label: 'the Emporio', keeper: 2,
    openHour: 9, closeHour: 14,
    
    
    sells: Object.freeze({ sugar: STAPLES.sugar.buy_coins, wood: 8, stone: 10, appleSeed: 15, peachSeed: 22 }),
    buys: false,
  }),
  market: Object.freeze({
    id: 'market', name: 'Mercato', label: 'the Mercato', keeper: 3,
    openHour: 12, closeHour: 17,
    sells: null,
    buys: true,
  }),
});

export const TOWN_HALL = Object.freeze({
  id: 'townHall', name: 'Municipio', label: 'the Municipio', keeper: 4,
  openHour: 10, closeHour: 16,
});



export const COUNTERS = Object.freeze([...Object.values(STORES), TOWN_HALL]);








export const REQUESTABLE = Object.freeze(
  Object.keys(GOODS).filter((g) => GOODS[g].sell_coins > 0 && GOODS[g].kind !== 'rare').sort(),
);
export const REQUEST_WEIGHTS = Object.freeze(REQUESTABLE.map((g) => Math.max(2, Math.round(120 / GOODS[g].sell_coins))));

const PLAIN = Object.freeze(REQUESTABLE.map((g) => (GOODS[g].kind === 'fruit' || GOODS[g].kind === 'food' ? 1 : 0)));
const PLAIN_WEIGHTS = Object.freeze(REQUEST_WEIGHTS.map((w, i) => w * PLAIN[i]));

export const newTown = () => ({ points: 0, filled: 0, lastDay: -1 });




const startMs = (hour) => Math.round((hour / 24) * DAY_MS);
export function townDay(world, t, startHour = 8) {
  return Math.floor((t - world.createdAt + startMs(startHour)) / DAY_MS);
}

export const townOf = (world) => world.town || newTown();



export function storeOpen(hour, counter) {
  return hour >= counter.openHour && hour < counter.closeHour;
}


export function marketPrice(good) {
  const spec = GOODS[good];
  if (!spec || spec.sell_coins <= 0) return 0;
  return Math.max(1, Math.floor((spec.sell_coins * TOWN.marketRate_bp) / BP));
}


export function storePrice(store, good) {
  const spec = STORES[store];
  return (spec && spec.sells && spec.sells[good]) || 0;
}







export function requestForDay(seed, day) {
  const weights = day < TOWN.request.plainDays ? PLAIN_WEIGHTS : REQUEST_WEIGHTS;
  const good = REQUESTABLE[pickWeighted(weights, seed, 'townRequest', day, 'good')];
  const span = TOWN.request.maxCount - TOWN.request.minCount + 1;
  const count = TOWN.request.minCount + (draw(seed, 'townRequest', day, 'count') % span);
  const coins = Math.max(1, Math.floor((GOODS[good].sell_coins * count * TOWN.request.coins_bp) / BP));
  return { day, good, count, coins, points: TOWN.request.points };
}






export function noticeBoard(world, t, hour) {
  const day = townDay(world, t);
  const req = requestForDay(world.seed, day);
  const town = townOf(world);
  return {
    ...req,
    up: hour >= TOWN.request.openHour,
    filled: town.lastDay === day,
    held: world.pockets[req.good] || 0,
  };
}



export function standingOf(points) {
  let at = TOWN.standings[0], level = 0;
  TOWN.standings.forEach((s, i) => { if (points >= s.points) { at = s; level = i; } });
  const next = TOWN.standings[level + 1] || null;
  return { level, label: at.label, footfall_bp: at.footfall_bp, points, next, toNext: next ? next.points - points : 0 };
}


export const townBonusAt = (world) => standingOf(townOf(world).points).footfall_bp;
