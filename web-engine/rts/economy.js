

























import { TICKS_PER_SECOND } from './fixed.js';
import { UNITS, HERD } from './roster.js';
import { POLLUTION_MAX } from './territory.js';


export const MILLI = 1000;


export const toMilli = (whole) => Math.round(whole * MILLI);


export const toWhole = (milli) => Math.floor(milli / MILLI);














export const POLLUTION_HERD_WATER_PENALTY_PCT = 25;
























export const SECTOR_OUTPUT_CAP_PER_TICK = 300;


export function sectorCap(sector, yieldBonusPct = 0) {
  return Math.floor((SECTOR_OUTPUT_CAP_PER_TICK * (sector.yieldPct + yieldBonusPct)) / 100);
}













export function gatherOf(unitId, members, sector, faction, yieldBonusPct = 0) {
  const u = UNITS[unitId];
  if (!u || members <= 0) return { feed: 0, water: 0 };
  
  
  
  if (sector.owner === null) return { feed: 0, water: 0 };

  
  
  const scale = sector.yieldPct + yieldBonusPct;

  let feed = 0;
  let water = 0;

  if (u.gatherFeedPerTick > 0 && sector.kind !== 'water') {
    feed = Math.floor((u.gatherFeedPerTick * members * scale) / 100);
  }

  if (u.gatherWaterPerTick > 0 && sector.kind === 'water') {
    let pct = scale;
    if (faction === HERD && sector.pollution > 0) {
      const penalty = Math.min(POLLUTION_MAX, sector.pollution) * POLLUTION_HERD_WATER_PENALTY_PCT;
      pct = Math.floor((pct * (100 - penalty)) / 100);
    }
    water = Math.floor((u.gatherWaterPerTick * members * pct) / 100);
  }

  return { feed, water };
}










export function stepEconomy(gatherers, sectorsById, factionOf, yieldBonusBySector = {}) {
  const income = Object.create(null);
  
  
  
  
  
  const drawn = Object.create(null);
  for (let i = 0; i < gatherers.length; i += 1) {
    const g = gatherers[i];
    const sector = sectorsById instanceof Map ? sectorsById.get(g.sectorId) : sectorsById[g.sectorId];
    if (!sector || sector.owner !== g.owner) continue;
    const bonus = yieldBonusBySector[g.sectorId] || 0;
    const got = gatherOf(g.unitId, g.members, sector, factionOf[g.owner], bonus);
    if (got.feed === 0 && got.water === 0) continue;

    
    
    
    
    const cap = sectorCap(sector, bonus);
    const already = drawn[g.sectorId] || 0;
    const room = cap - already;
    if (room <= 0) continue;
    const total = got.feed + got.water;
    let feed = got.feed;
    let water = got.water;
    if (total > room) {
      
      
      feed = Math.floor((got.feed * room) / total);
      water = Math.floor((got.water * room) / total);
    }
    drawn[g.sectorId] = already + feed + water;

    const acc = income[g.owner] || (income[g.owner] = { feed: 0, water: 0 });
    acc.feed += feed;
    acc.water += water;
  }
  return income;
}










export class Bank {
  
  constructor({ feed = 0, water = 0 } = {}) {
    this.feed = toMilli(feed);
    this.water = toMilli(water);
    
    this.earnedFeed = 0;
    this.earnedWater = 0;
    this.spentFeed = 0;
    this.spentWater = 0;
  }

  
  earn({ feed = 0, water = 0 }) {
    this.feed += feed;
    this.water += water;
    this.earnedFeed += feed;
    this.earnedWater += water;
  }

  
  canAfford(cost) {
    return this.feed >= toMilli(cost.feed || 0) && this.water >= toMilli(cost.water || 0);
  }

  


  pay(cost) {
    if (!this.canAfford(cost)) return false;
    const f = toMilli(cost.feed || 0);
    const w = toMilli(cost.water || 0);
    this.feed -= f;
    this.water -= w;
    this.spentFeed += f;
    this.spentWater += w;
    return true;
  }

  
  refund(cost, pct) {
    this.feed += Math.floor((toMilli(cost.feed || 0) * pct) / 100);
    this.water += Math.floor((toMilli(cost.water || 0) * pct) / 100);
  }

  
  display() {
    return { feed: toWhole(this.feed), water: toWhole(this.water) };
  }

  
  save() {
    return {
      feed: this.feed, water: this.water,
      earnedFeed: this.earnedFeed, earnedWater: this.earnedWater,
      spentFeed: this.spentFeed, spentWater: this.spentWater,
    };
  }

  static restore(o) {
    const b = new Bank();
    b.feed = o.feed | 0;
    b.water = o.water | 0;
    b.earnedFeed = o.earnedFeed | 0;
    b.earnedWater = o.earnedWater | 0;
    b.spentFeed = o.spentFeed | 0;
    b.spentWater = o.spentWater | 0;
    return b;
  }
}








export function perSecondX100(milliPerTick) {
  return Math.floor((milliPerTick * TICKS_PER_SECOND * 100) / MILLI);
}
