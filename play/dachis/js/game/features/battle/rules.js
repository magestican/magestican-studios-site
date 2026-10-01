

import { capsFor, speciesById, statsOf, typeMult, attrMult, attrOf } from '../../data/species.js';

export const CAPTURE_HP = 0.25;          
export const BASIC_POWER = 36;


export const BATTLE_PACE = 0.7;







export const ADV_CAP = 2;      
export const HIT_CAP = 0.2;    
export const matchup = (eff, attr) => Math.min(ADV_CAP, eff * attr);
export const capHit = (dmg, maxHp, big = false) => (big ? dmg : Math.min(dmg, Math.max(1, Math.ceil(maxHp * HIT_CAP))));

export const xpToNext = L => Math.floor(8 * L + 0.8 * L * L);

export function calcDamage(attacker, defender, power, moveType, rng = Math.random, cycle = 1) {
  const a = statsOf(attacker), df = statsOf(defender);
  const sa = speciesById(attacker.sp), sd = speciesById(defender.sp);
  const stab = sa.types.includes(moveType) ? 1.2 : 1;
  const eff = typeMult(moveType, sd.types);
  
  const attr = attrMult(attrOf(attacker), attrOf(defender));
  const crit = rng() < 0.07 ? 1.6 : 1;
  const base = ((2 * attacker.lvl / 5 + 2) * power * (a.atk / Math.max(1, df.def))) / 42 + 2;
  const dmg = Math.min(capsFor(cycle).maxDamage, Math.max(1, Math.floor(base * stab * matchup(eff, attr) * crit * (0.85 + rng() * 0.15))));
  return { dmg, eff, attr, crit: crit > 1 };
}


export const finalDamage = (dmg, guarded, cycle = 1) => Math.min(capsFor(cycle).maxDamage, guarded ? Math.ceil(dmg * 0.5) : dmg);

export function xpReward(enemy) {
  const s = speciesById(enemy.sp);
  return Math.floor(enemy.lvl * 9 * (1 + (s.stage - 1) * 0.5));
}



export function giveXp(d, amt, cycle = 1) {
  const cap = capsFor(cycle).maxLevel;
  if (d.lvl >= cap) { d.xp = 0; return 0; }
  d.xp += amt;
  let gained = 0;
  while (d.lvl < cap && d.xp >= xpToNext(d.lvl)) {
    const before = statsOf(d).maxHp;
    d.xp -= xpToNext(d.lvl); d.lvl++; gained++;
    d.hp += statsOf(d).maxHp - before;
  }
  if (d.lvl >= cap) d.xp = 0;
  return gained;
}

export function canEvolve(d) {
  const s = speciesById(d.sp);
  return !!(s.evolveAt && d.lvl >= s.evolveAt && !d.noEvolve);
}
export function evolve(d) {
  const s = speciesById(d.sp);
  const before = statsOf(d).maxHp;
  d.sp = s.evolvesTo;
  d.hp += statsOf(d).maxHp - before;
  return speciesById(d.sp);
}

export const hpFraction = d => d.hp / statsOf(d).maxHp;



export const MP_COST = { dash: 10, bolt: 8, burst: 14, heal: 16, guard: 10, rage: 12,
  beam: 14, flurry: 12, slam: 14, trap: 10, drain: 12, hex: 10, shield: 12 };   
export const maxMp = d => Math.floor(20 + d.lvl * 1.2 + speciesById(d.sp).base.spd / 4);
export const mpCost = (m, lvl) => Math.round((MP_COST[m.kind] || 10) * (1 + lvl / 40));
export const mpRegen = (d, dt, guarding = false) => maxMp(d) * 0.03 * (guarding ? 1.6 : 1) * dt;

export const canUse = (f, k, m) => f.cds[k] <= 0 && f.mp >= mpCost(m, f.d.lvl);



export const FINISH_POWER = 130, FINISH_POWER_WILD = 90;   
export function finisherGain({ dt = 0, dealt = 0, taken = 0, wild = false }) {
  return (dt * 0.012 + dealt * 0.3 + taken * 0.35) * (wild ? 0.5 : 1);
}

export const FINISHERS = {
  Ember: 'Sunfall Crash', Tide: 'Deep Surge', Leaf: 'Thousand Thorns', Spark: 'Skybreaker',
  Stone: 'Mountain Drop', Gale: 'Cyclone Fang', Frost: 'Glacier Bloom', Shadow: 'Nightfall',
  Light: 'Dawn Lance', Metal: 'Iron Comet', Beast: 'Wild Heart Rush', Spirit: 'Soul Lantern',
};
export const finisherOf = (d, wild = false) => {
  const type = speciesById(d.sp).types[0];
  return { name: FINISHERS[type] || 'Big Finish', kind: 'finisher', power: wild ? FINISH_POWER_WILD : FINISH_POWER, type };
};



export const BOND_DEFAULT = 50, BOND_NEW_FRIEND = 20;
export const bondOf = d => (typeof d.bond === 'number' ? d.bond : BOND_DEFAULT);
export const hesitateChance = bond => (bond >= 50 ? 0 : (50 - Math.max(0, bond)) / 50 * 0.3);
export const bondAfter = (d, amt) => Math.max(0, Math.min(100, bondOf(d) + amt));



export const RANGE = { attack: 4.2, guard: 2.8, away: 6.5 };
export function nextAi(ai, { stance = 'attack', ready = false, struck = false, rng = Math.random }) {
  
  if (stance !== 'attack') return ai.mode === 'circle' ? ai : { mode: 'circle', t: 0.6 + rng(), r: 1 };
  if (ai.mode === 'circle') return ai.t <= 0 && ready ? { mode: 'close', t: 2.6 } : ai;
  if (ai.mode === 'close') return struck || ai.t <= 0 ? { mode: 'back', t: 0.5 + rng() * 0.5 } : ai;
  if (ai.mode === 'back') return ai.t <= 0 ? { mode: 'circle', t: 0.9 + rng() * 1.6, r: 0.7 + rng() * 0.7 } : ai;
  return { mode: 'circle', t: 1, r: 1 };
}

export const bossCapturable = (cycle = 1) => cycle >= 2;
export const isCapturable = (d, seals) => d.hp > 0 && (hpFraction(d) < CAPTURE_HP || seals > 0);
