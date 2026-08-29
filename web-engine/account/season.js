




















































































import { daysBetween, seasonNumber, seasonStartDay, daysLeftInSeason, SEASON_WEEKS, DAYS_PER_WEEK } from './dayKey.js';


export const SEASON_TIERS = 12;











export const TIER_STEP = 60;
export function tierThreshold(tier) {
  if (!Number.isInteger(tier) || tier <= 0) return 0;
  const t = Math.min(tier, SEASON_TIERS);
  return (t * (t + 1) / 2) * TIER_STEP;
}


export const SEASON_TRACK_XP = tierThreshold(SEASON_TIERS);


export const RESTED_PER_DAY = 90;
export const MAX_RESTED = 900;








export const RESTED_AFTER_DAYS = 2;


export const RESTED_MULTIPLIER = 2;


export const SEASON_LIMITS = Object.freeze({ maxXp: 10000000, maxSeasons: 100000 });







const SEASON_NAMES = Object.freeze([
  'Seeding', 'Muster', 'Shearing', 'Harvest', 'Haymaking', 'Drenching',
  'Calving', 'Fencing', 'Silage', 'Lambing', 'Threshing', 'Drafting',
]);

export function emptySeason() {
  return {
    id: null,        
    xp: 0,           
    lastDay: null,   
    rested: 0,       
    bestTier: 0,     
    seasons: 0,      
  };
}


export function normaliseSeason(raw) {
  const base = emptySeason();
  if (!raw || typeof raw !== 'object') return base;
  const id = Number.isInteger(raw.id) && raw.id >= 0 ? raw.id : null;
  return {
    id,
    xp: id === null ? 0 : clamp(raw.xp, SEASON_LIMITS.maxXp),
    lastDay: Number.isInteger(raw.lastDay) && raw.lastDay >= 0 ? raw.lastDay : null,
    rested: clamp(raw.rested, MAX_RESTED),
    bestTier: clamp(raw.bestTier, SEASON_TIERS),
    seasons: clamp(raw.seasons, SEASON_LIMITS.maxSeasons),
  };
}


export function seasonTierAt(xp) {
  const v = clamp(xp, SEASON_LIMITS.maxXp);
  let tier = 0;
  for (let t = 1; t <= SEASON_TIERS; t++) if (v >= tierThreshold(t)) tier = t;
  return tier;
}








export function restedFor(daysAway) {
  const d = Math.floor(Number(daysAway));
  if (!Number.isFinite(d) || d < RESTED_AFTER_DAYS) return 0;
  return Math.min(MAX_RESTED, d * RESTED_PER_DAY);
}














export function recordSeasonXp(season, { utcDay, xp = 0 } = {}) {
  const prev = normaliseSeason(season);
  if (!Number.isInteger(utcDay) || utcDay < 0) {
    return idle(prev);
  }
  const id = seasonNumber(utcDay);
  if (id === null) return idle(prev);

  
  
  
  
  
  
  const rolledOver = prev.id !== id;
  const beforeTier = rolledOver ? 0 : seasonTierAt(prev.xp);
  const base = rolledOver
    ? { ...prev, id, xp: 0, seasons: Math.min(SEASON_LIMITS.maxSeasons, prev.seasons + 1) }
    : prev;

  
  
  
  
  
  const gap = daysBetween(base.lastDay, utcDay);
  const daysAway = (gap === null || gap <= 1) ? 0 : gap - 1;
  const accrued = Math.min(MAX_RESTED, base.rested + restedFor(daysAway));

  
  const want = clamp(xp, SEASON_LIMITS.maxXp);
  const bonus = Math.min(accrued, want * (RESTED_MULTIPLIER - 1));
  const gained = want + bonus;

  const next = {
    ...base,
    xp: Math.min(SEASON_LIMITS.maxXp, base.xp + gained),
    lastDay: utcDay,
    rested: accrued - bonus,
  };
  const afterTier = seasonTierAt(next.xp);
  next.bestTier = Math.max(base.bestTier, afterTier);
  
  
  if (next.seasons === 0) next.seasons = 1;

  return {
    season: next,
    gained,
    bonus,
    rolledOver,
    tier: afterTier,
    tiersGained: Math.max(0, afterTier - beforeTier),
    daysAway,
  };
}



function idle(season) {
  return { season, gained: 0, bonus: 0, rolledOver: false, tier: seasonTierAt(season.xp), tiersGained: 0, daysAway: 0 };
}








export function seasonStatus(season, utcDay) {
  const s = normaliseSeason(season);
  const id = seasonNumber(utcDay);
  
  
  
  
  const current = id !== null && s.id === id;
  const xp = current ? s.xp : 0;
  const tier = seasonTierAt(xp);
  const nextAt = tier >= SEASON_TIERS ? null : tierThreshold(tier + 1);
  const floor = tierThreshold(tier);
  return {
    id,
    name: id === null ? null : SEASON_NAMES[id % SEASON_NAMES.length],
    number: id === null ? null : (id % SEASON_NAMES.length) + 1,
    xp,
    tier,
    tiers: SEASON_TIERS,
    nextAt,
    toNext: nextAt === null ? 0 : nextAt - xp,
    
    
    fraction: nextAt === null ? 1 : (xp - floor) / (nextAt - floor),
    rested: s.rested,
    bestTier: s.bestTier,
    seasons: s.seasons,
    startDay: id === null ? null : seasonStartDay(id),
    daysLeft: daysLeftInSeason(utcDay),
    lengthDays: SEASON_WEEKS * DAYS_PER_WEEK,
  };
}


export function seasonLine(status) {
  const s = status ?? {};
  if (s.id === null || s.id === undefined) return null;
  const head = `${s.name} - tier ${s.tier} of ${s.tiers}`;
  if (s.tier >= s.tiers) return `${head}, track complete`;
  return `${head}, ${Math.max(0, s.toNext)} XP to the next`;
}








export function restedLine(result) {
  const r = result ?? {};
  if (!r.bonus) return null;
  const days = Math.max(0, Math.floor(Number(r.daysAway) || 0));
  const away = days >= 2 ? ` after ${days} days away` : '';
  return `Welcome back${away} - double XP this session (+${r.bonus})`;
}

const clamp = (v, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};
