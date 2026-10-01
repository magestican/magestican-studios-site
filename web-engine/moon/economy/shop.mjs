












import { BUILDINGS, CUSTOMERS, GOODS } from './tables.mjs';
import { BP, MS, decay, draw, pickWeighted } from './math.mjs';
import { isDark } from './clock.mjs';
import { villageBonusAt } from './happiness.mjs';
import { CALENDAR, isMarketDay, townBonusAt } from './town.mjs';
import { placedLightCount } from '../light/placedLights.mjs';

const SLOT_MS = CUSTOMERS.slot_s * MS;
const HALF_LIFE_MS = CUSTOMERS.saturationHalfLife_s * MS;

export const shopOf = (world) => world.buildings.find((b) => b.type === 'shop');
export const shopSpec = (world) => BUILDINGS.shop.levels[shopOf(world).level - 1];
export const sellable = (good) => Boolean(GOODS[good]) && GOODS[good].sell_coins > 0;










export function lightLevel(world) {
  let light = 0;
  for (const b of world.buildings) light += BUILDINGS[b.type].light || 0;
  return light + placedLightCount(world.placed || [], 0);
}

export const isLit = (world) => lightLevel(world) >= CUSTOMERS.lightsForLitShop;

function saturationAt(world, good, t) {
  const s = world.shop.saturation[good];
  return s ? decay(s.bp, t - s.at, HALF_LIFE_MS) : 0;
}

export const discountAt = (world, good, t) => Math.min(CUSTOMERS.maxDiscount_bp, saturationAt(world, good, t));

export function priceAt(world, good, t) {
  return Math.max(1, Math.floor((GOODS[good].sell_coins * (BP - discountAt(world, good, t))) / BP));
}




export function footfallAt(world, t) {
  let bp = shopSpec(world).footfall_bp;
  bp = Math.floor((bp * (BP + villageBonusAt(world, t) + townBonusAt(world))) / BP);
  
  if (isMarketDay(world, t)) bp = Math.floor((bp * CALENDAR.marketFootfall_bp) / BP);
  if (isDark(world, t)) bp = Math.floor((bp * (isLit(world) ? CUSTOMERS.nightLit_bp : CUSTOMERS.nightUnlit_bp)) / BP);
  return bp;
}



export const customersBpAt = (world, t) => Math.floor((CUSTOMERS.arrival_bp * footfallAt(world, t)) / BP);

export function stockCount(world) {
  let n = 0;
  for (const s of world.shop.shelves) if (s) n += s.count;
  return n;
}


export function shelfRoom(world, good) {
  const stack = shopSpec(world).shelfStack;
  let room = 0;
  for (const s of world.shop.shelves) {
    if (!s) room += stack;
    else if (s.good === good) room += stack - s.count;
  }
  return room;
}


export function putOnShelves(world, good, count) {
  const stack = shopSpec(world).shelfStack;
  const shelves = world.shop.shelves;
  let left = count;
  for (const s of shelves) {
    if (left > 0 && s && s.good === good) {
      const n = Math.min(left, stack - s.count);
      s.count += n;
      left -= n;
    }
  }
  for (let i = 0; i < shelves.length && left > 0; i++) {
    if (!shelves[i]) {
      const n = Math.min(left, stack);
      shelves[i] = { good, count: n };
      left -= n;
    }
  }
  return count - left;
}

export const slotTime = (world, k) => world.createdAt + k * SLOT_MS;


export function runCustomers(world, now, events) {
  const shop = world.shop;
  const last = Math.floor((now - world.createdAt) / SLOT_MS);
  for (let k = shop.slot + 1; k <= last; k++) {
    
    
    if (stockCount(world) === 0) break;
    const t = slotTime(world, k);
    const expected = customersBpAt(world, t);
    const customers = Math.floor(expected / BP) + (draw(world.seed, 'arrive', k) % BP < expected % BP ? 1 : 0);
    for (let c = 0; c < customers; c++) {
      if (!sellOne(world, t, k, c, events)) break;
    }
  }
  if (last > shop.slot) shop.slot = last;
}

function sellOne(world, t, k, c, events) {
  const shelves = world.shop.shelves;
  const weights = shelves.map((s) => (s ? GOODS[s.good].demand * (BP - discountAt(world, s.good, t)) : 0));
  const i = pickWeighted(weights, world.seed, 'pick', k, c);
  if (i < 0) return false;
  const shelf = shelves[i];
  const good = shelf.good;
  const coins = priceAt(world, good, t);
  shelf.count -= 1;
  if (shelf.count === 0) shelves[i] = null;
  world.coins += coins;
  world.shop.saturation[good] = {
    bp: Math.min(CUSTOMERS.maxDiscount_bp, saturationAt(world, good, t) + CUSTOMERS.saturationPerSale_bp),
    at: t,
  };
  const stats = world.stats;
  stats.earned_coins += coins;
  stats.customers += 1;
  stats.sold[good] = (stats.sold[good] || 0) + 1;
  stats.soldFor_coins[good] = (stats.soldFor_coins[good] || 0) + coins;
  events.push({ type: 'sale', at: t, good, coins });
  return true;
}
