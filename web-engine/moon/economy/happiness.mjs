








import { GIFTS, GOODS, HAPPINESS } from './tables.mjs';
import { BP, MS, decay } from './math.mjs';

const HALF_LIFE_MS = HAPPINESS.warmthHalfLife_s * MS;
const CP = 100; 

export const levelOf = (villager) => villager.levels.length;



export function giftBasePoints(villager, gift) {
  if (gift.coins !== undefined) return Math.floor(gift.coins / GIFTS.coinsPerPoint);
  const points = GOODS[gift.good].gift_points * gift.count;
  return villager.favourite === gift.good ? Math.floor((points * GIFTS.favourite_bp) / BP) : points;
}

export const warmthAt = (villager, t) => decay(villager.warmth_cp, t - villager.warmthAt, HALF_LIFE_MS);


export function giftGain(villager, base, t) {
  const room = Math.max(0, HAPPINESS.warmthRoom_points * CP - warmthAt(villager, t));
  const full = Math.min(base * CP, room);
  return Math.floor((full + Math.floor(((base * CP - full) * HAPPINESS.overflow_bp) / BP)) / CP);
}

export function applyGift(villager, base, t, events) {
  const gain = giftGain(villager, base, t);
  villager.warmth_cp = Math.min(HAPPINESS.warmthCap_points * CP, warmthAt(villager, t) + base * CP);
  villager.warmthAt = t;
  villager.points += gain;
  while (villager.levels.length < HAPPINESS.levels.length && villager.points >= HAPPINESS.levels[villager.levels.length].points) {
    const spec = HAPPINESS.levels[villager.levels.length];
    const previous = villager.levels[villager.levels.length - 1];
    
    const startsAt = previous ? Math.max(t, previous.doneAt) : t;
    const level = { at: t, doneAt: startsAt + spec.build_s * MS };
    villager.levels.push(level);
    events.push({ type: 'levelUp', at: t, villager: villager.id, level: villager.levels.length, event: spec.event, doneAt: level.doneAt });
  }
  return gain;
}


export function villageBonusAt(world, t) {
  let bp = 0;
  for (const v of world.villagers) {
    v.levels.forEach((level, i) => {
      if (t >= level.doneAt) bp += HAPPINESS.levels[i].footfall_bp;
    });
  }
  return bp;
}
