

























import { dist2 } from '../fixed.js';
import { UNITS, BUILDINGS, HERD, YIELD, damageAfterArmour } from '../roster.js';
import { HOLD_MAX } from '../territory.js';
import { STATE, ORDER, unitSpec, isGatherer, isArmy } from './world.js';
import { canSee, weightIn } from './presence.js';
import { moveTo } from './movement.js';
import { train, build, QUEUE_MAX } from './production.js';
import { hasTechFor } from './buildings.js';





export const SKILL = Object.freeze({
  
  thinkTicks: [12, 60],
  
  sectorsScored: [64, 4],
  
  floatPct: [0, 45],
  
  commitPct: [100, 55],
  
  countersFrom: [1, 0],
});

















const lerp = (a, b, strengthPct) => a + Math.floor(((b - a) * (100 - strengthPct)) / 100);







export function knobsFor(strengthPct) {
  const s = Math.max(0, Math.min(100, Math.floor(strengthPct)));
  return {
    strengthPct: s,
    thinkTicks: lerp(SKILL.thinkTicks[0], SKILL.thinkTicks[1], s),
    sectorsScored: lerp(SKILL.sectorsScored[0], SKILL.sectorsScored[1], s),
    floatPct: lerp(SKILL.floatPct[0], SKILL.floatPct[1], s),
    commitPct: lerp(SKILL.commitPct[0], SKILL.commitPct[1], s),
    usesCounters: s >= 60,
    
    
    
    
    
    
    
    
    defends: s >= 70,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    multiPronged: false,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    ignoresThreat: s < 65,
  };
}








export function strengthFromLevel(level) {
  const l = Math.max(1, Math.floor(level || 1));
  return Math.min(100, 40 + (l - 1) * 5);
}


export function makeBot(seat, strengthPct) {
  return {
    seat,
    ...knobsFor(strengthPct),
    












    phase: 0,
    openingWater: (seat % 2) === 1,
  };
}























function wobble(m, spread) {
  return m.w.rng.below(spread * 2 + 1) - spread;
}

export function stepBot(m, bot) {
  const w = m.w;
  if ((w.tick + bot.phase) % bot.thinkTicks !== 0) return;
  const seat = bot.seat;
  const faction = m.factions[seat];

  spendMoney(m, bot, seat, faction);
  assignIdleArmy(m, bot, seat);
}





function spendMoney(m, bot, seat, faction) {
  const bank = m.banks[seat];
  if (m.queues[seat].length >= QUEUE_MAX) return;

  
  
  
  const purse = bank.display();
  const spendable = Math.floor((purse.feed * (100 - bot.floatPct)) / 100);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const goal = buildGoal(m, bot, seat, faction);
  if (goal) {
    if (spendable >= goal.cost.feed && purse.water >= goal.cost.water) {
      if (tryBuildSomewhere(m, seat, goal.id)) return;
    }
  }
  
  
  
  
  
  
  const reachable = goal && spendable * 2 >= goal.cost.feed;
  const reserve = reachable ? goal.cost.feed : 0;
  const forUnits = Math.max(0, spendable - reserve);

  const pick = chooseUnit(m, bot, seat, faction, forUnits, purse.water);
  if (pick) train(m.w, m.banks, m.queues, seat, pick);
}




















function buildGoal(m, bot, seat, faction) {
  const owned = countOwnedSectors(m, seat);
  if (owned.land === 0 && owned.water === 0) return null;   

  const anchorId = faction === HERD ? 'haven' : 'watchtower';
  const anchors = countStanding(m, seat, anchorId);
  const waterId = faction === HERD ? 'reedbed' : 'pumpStation';
  const techUnit = faction === HERD ? 'elephant' : 'combine';
  const techId = faction === HERD ? 'sanctuary' : 'machineShed';

  
  
  
  
  
  
  
  
  
  
  
  
  

  
  if (owned.land > 0 && anchors < Math.min(2, owned.land)) return BUILDINGS[anchorId];

  
  
  
  
  
  
  
  
  
  if (owned.water > 0 && countStanding(m, seat, waterId) < Math.min(2, owned.water)) {
    return BUILDINGS[waterId];
  }

  
  if (owned.land >= 3 && !hasTechFor(m.w, seat, techUnit)
      && countStanding(m, seat, techId) === 0) {
    return BUILDINGS[techId];
  }

  
  
  
  
  
  
  
  
  if (faction === HERD && owned.land > anchors) return BUILDINGS[anchorId];

  return null;
}










function chooseUnit(m, bot, seat, faction, feed, water) {
  const gatherer = faction === HERD ? 'flock' : 'harvester';
  const waterGatherer = faction === HERD ? 'duckRaft' : 'bowser';

  const owned = countOwnedSectors(m, seat);
  const gatherers = countUnits(m, seat, (spec) => spec.gatherFeedPerTick > 0);

  
  
  
  
  
  
  
  
  
  const target = owned.land * 2 + 2;
  if (gatherers < target) {
    if (affordable(m, seat, gatherer, feed, water)) return gatherer;
    
    
    
    
    
    return null;
  }

  if (owned.water > 0 && countUnits(m, seat, (s) => s.gatherWaterPerTick > 0) < owned.water
      && affordable(m, seat, waterGatherer, feed, water)) {
    return waterGatherer;
  }

  
  
  
  
  const options = armyOptions(faction, bot.usesCounters);
  const threat = bot.usesCounters ? seenThreat(m, seat) : null;

  
  
  
  let want = null;
  let wantScore = -1;
  for (const id of options) {
    const spec = UNITS[id];
    if (spec.requires && !hasTechFor(m.w, seat, id)) continue;
    
    
    
    
    
    
    
    
    
    
    
    
    const per = threat
      ? damageAfterArmour(spec.damage, spec.damageClass, threat.armourClass, threat.armourFlat)
      : spec.damage;
    const score = Math.floor((per * spec.packSize * spec.hp) / spec.cost.feed);
    if (score > wantScore) { wantScore = score; want = id; }
  }
  if (!want) return null;

  if (affordable(m, seat, want, feed, water)) return want;

  
  
  
  
  
  
  
  
  
  const wantSpec = UNITS[want];
  if (wantSpec.cost.water <= water && wantSpec.cost.feed <= feed * 2) return null;

  
  
  let fallback = null;
  let fallbackScore = -1;
  for (const id of options) {
    if (!affordable(m, seat, id, feed, water)) continue;
    const spec = UNITS[id];
    const score = Math.floor((spec.damage * spec.packSize * spec.hp) / spec.cost.feed);
    if (score > fallbackScore) { fallbackScore = score; fallback = id; }
  }
  return fallback;
}



const HERD_ARMY = ['skulk', 'sounder', 'horseHerd', 'pride', 'wing', 'elephant'];
const YIELD_ARMY = ['farmhand', 'quadBike', 'tractor', 'poundWagon', 'foodTruck', 'cropDuster', 'combine'];

const HERD_SIMPLE = ['skulk', 'sounder', 'pride'];
const YIELD_SIMPLE = ['farmhand', 'tractor', 'combine'];

function armyOptions(faction, usesCounters) {
  if (faction === HERD) return usesCounters ? HERD_ARMY : HERD_SIMPLE;
  return usesCounters ? YIELD_ARMY : YIELD_SIMPLE;
}

function affordable(m, seat, unitId, feed, water) {
  const spec = UNITS[unitId];
  if (spec.cost.feed > feed || spec.cost.water > water) return false;
  if (spec.requires && !hasTechFor(m.w, seat, unitId)) return false;
  return true;
}







function seenThreat(m, seat) {
  const w = m.w;
  const counts = Object.create(null);
  const armour = Object.create(null);
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] < 0 || w.u.owner[i] === seat) continue;
    const sector = w.u.sector[i];
    if (sector < 0 || !canSee(m.presence, seat, sector)) continue;
    const spec = unitSpec(w, i);
    counts[spec.armourClass] = (counts[spec.armourClass] || 0) + w.u.members[i];
    if (!armour[spec.armourClass] || spec.armourFlat > armour[spec.armourClass]) {
      armour[spec.armourClass] = spec.armourFlat;
    }
  }
  let best = null;
  let bestN = 0;
  
  
  for (const k of Object.keys(counts).sort()) {
    if (counts[k] > bestN) { bestN = counts[k]; best = k; }
  }
  return best ? { armourClass: best, armourFlat: armour[best] } : null;
}

















function tryBuildSomewhere(m, seat, buildingId) {
  const w = m.w;
  const spec = BUILDINGS[buildingId];
  const enemy = enemyCentreFor(m, seat);
  const ranked = [];
  for (let s = 0; s < w.sectors.length; s += 1) {
    const sector = w.sectors[s];
    if (sector.owner !== seat) continue;
    if (spec.waterOnly !== (sector.kind === 'water')) continue;
    
    
    let score = sectorWorth(sector) * 120 + sector.yieldPct;
    if (enemy) {
      const dx = sector.cx - enemy.x;
      const dy = sector.cy - enemy.y;
      score -= Math.floor((dx * dx + dy * dy) / 40000000);
    }
    ranked.push([score, s]);
  }
  ranked.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
  for (const [, s] of ranked) {
    if (build(w, m.banks, m.queues, seat, buildingId, s) === null) return true;
  }
  return false;
}


function enemyCentreFor(m, seat) {
  const w = m.w;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] < 0 || w.u.owner[i] === seat) continue;
    const mem = w.u.members[i];
    sx += w.u.x[i] * mem;
    sy += w.u.y[i] * mem;
    n += mem;
  }
  if (n === 0) return null;
  return { x: Math.floor(sx / n), y: Math.floor(sy / n) };
}

function isQueuedOrStanding(m, seat, buildingId) {
  return countStanding(m, seat, buildingId) > 0;
}

function countStanding(m, seat, buildingId) {
  const b = m.w.b;
  let n = 0;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.owner[i] !== seat) continue;
    if (BUILDINGS[buildingId] && b.kind[i] === BUILDING_INDEX[buildingId]) n += 1;
  }
  return n;
}

const BUILDING_INDEX = (() => {
  const keys = Object.keys(BUILDINGS).sort();
  const out = Object.create(null);
  for (let i = 0; i < keys.length; i += 1) out[keys[i]] = i;
  return out;
})();

function countOwnedSectors(m, seat) {
  let land = 0;
  let water = 0;
  for (const s of m.w.sectors) {
    if (s.owner !== seat) continue;
    if (s.kind === 'water') water += 1; else land += 1;
  }
  return { land, water };
}

function countUnits(m, seat, pred) {
  const w = m.w;
  let n = 0;
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
    if (pred(unitSpec(w, i))) n += 1;
  }
  return n;
}













function assignIdleArmy(m, bot, seat) {
  const w = m.w;
  
  
  
  
  
  
  
  
  const owned = countOwnedSectors(m, seat);
  const noWork = owned.land === 0;

  const idle = [];
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
    const spec = unitSpec(w, i);
    const usable = isArmy(spec) || (noWork && isGatherer(spec) && spec.captureWeight > 0);
    if (!usable) continue;
    if (w.u.state[i] === STATE.MOVING && w.u.orderType[i] === ORDER.CAPTURE) continue;
    if (w.u.state[i] === STATE.GATHERING) continue;
    if (w.u.state[i] === STATE.ATTACKING) continue;
    
    
    
    
    
    
    
    
    
    if (w.u.orderType[i] === ORDER.CAPTURE && w.u.orderArg[i] >= 0
        && w.u.sector[i] === w.u.orderArg[i]
        && w.sectors[w.u.orderArg[i]].owner !== seat) continue;
    idle.push(i);
  }
  if (idle.length === 0) return;

  
  
  const commit = Math.max(1, Math.floor((idle.length * bot.commitPct) / 100));

  
  let pool = idle;
  if (bot.defends) {
    const threatened = mostThreatenedOwnSector(m, seat);
    if (threatened >= 0) {
      const send = Math.max(1, Math.floor(commit / 2));
      for (let k = 0; k < send && k < pool.length; k += 1) {
        sendToSector(w, pool[k], w.sectors[threatened], threatened);
      }
      if (send >= pool.length) return;
      pool = pool.slice(send);
    }
  }

  const targets = bestSectorsToTake(m, bot, seat, bot.multiPronged ? 2 : 1);
  if (targets.length === 0) return;
  const take = Math.max(1, Math.floor((pool.length * bot.commitPct) / 100));
  const per = Math.max(1, Math.floor(take / targets.length));
  let k = 0;
  for (let t = 0; t < targets.length && k < take; t += 1) {
    const sector = w.sectors[targets[t]];
    const end = t === targets.length - 1 ? take : Math.min(take, k + per);
    for (; k < end && k < pool.length; k += 1) sendToSector(w, pool[k], sector, targets[t]);
  }
}

function sendToSector(w, slot, sector, sectorIndex) {
  moveTo(w, slot, sector.cx, sector.cy);
  w.u.orderType[slot] = ORDER.CAPTURE;
  w.u.orderArg[slot] = sectorIndex;
}









function mostThreatenedOwnSector(m, seat) {
  const w = m.w;
  let worst = -1;
  let worstScore = 0;
  for (let s = 0; s < w.sectors.length; s += 1) {
    const sec = w.sectors[s];
    if (sec.owner !== seat) continue;
    let enemy = 0;
    for (let p = 0; p < m.playerCount; p += 1) {
      if (p === seat) continue;
      enemy += weightIn(m.presence, s, p);
    }
    if (enemy === 0) continue;
    const score = enemy * sectorWorth(sec);
    if (score > worstScore) { worstScore = score; worst = s; }
  }
  return worst;
}

function bestSectorsToTake(m, bot, seat, want) {
  const w = m.w;
  const from = ownCentre(m, seat);
  const ranked = [];
  let scored = 0;
  let hasAnyWater = false;
  for (const sec of w.sectors) if (sec.owner === seat && sec.kind === 'water') { hasAnyWater = true; break; }
  
  let myWeight = 0;
  for (let i = 0; i < w.u.count; i += 1) {
    if (w.u.alive[i] && w.u.owner[i] === seat) myWeight += w.u.members[i] * unitSpec(w, i).captureWeight;
  }

  for (let s = 0; s < w.sectors.length && scored < bot.sectorsScored; s += 1) {
    const sector = w.sectors[s];
    if (sector.owner === seat) continue;
    scored += 1;

    
    let score = sectorWorth(sector) * 100 + sector.yieldPct;

    
    
    
    
    
    
    
    if (sector.kind === 'water' && !hasAnyWater) score += 260;

    
    
    const d = dist2(from.x, from.y, sector.cx, sector.cy);
    score -= Math.floor(d / 40000000);

    
    
    if (sector.owner !== null && sector.owner >= 0) {
      score -= 250;
      score -= Math.floor((sector.hold * 100) / HOLD_MAX);

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (!bot.ignoresThreat) {
        const enemyWeight = weightIn(m.presence, s, sector.owner);
        score -= Math.floor((enemyWeight * 400) / Math.max(1, myWeight));
      }
    }

    
    
    let adjacent = false;
    for (const n of sector.neighbours) if (w.sectors[n].owner === seat) { adjacent = true; break; }
    if (adjacent) score += 180;

    
    
    score += wobble(m, 90);

    ranked.push([score, s]);
  }
  
  
  
  ranked.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
  return ranked.slice(0, want).map((r) => r[1]);
}

const sectorWorth = (s) => (s.kind === 'keystone' ? 3 : (s.kind === 'water' ? 2 : 1));

function ownCentre(m, seat) {
  const w = m.w;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
    sx += w.u.x[i];
    sy += w.u.y[i];
    n += 1;
  }
  if (n > 0) return { x: Math.floor(sx / n), y: Math.floor(sy / n) };
  const spawn = w.map.spawns.find((sp) => sp.seat === seat);
  return spawn ? { x: spawn.x, y: spawn.y } : { x: 0, y: 0 };
}
