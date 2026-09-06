


































import { MATCH_TICKS, TICKS_PER_SECOND } from '../fixed.js';
import { START_FORCE, START_RESOURCES, UNITS } from '../roster.js';
import {
  stepTerritoryFlat, stepRout, sharePct, ROUT_HOLD_TICKS,
} from '../territory.js';
import { Bank, stepEconomy, gatherOf, sectorCap } from '../economy.js';
import { EVENT_BONUS_LAND_TICKS, scoresFor } from '../progression.js';
import {
  createWorld, spawnUnit, unitSpec, buildingSpec, isGatherer, factionMap, checksum,
  STATE, ORDER, MAX_UNITS,
} from './world.js';
import { createPresenceBuffers, measurePresence } from './presence.js';
import { createAuraBuffers, measureAuras, stepHealing } from './auras.js';
import { stepMovement, stepSeparation, moveTo } from './movement.js';
import { stepCombat, stepPoundWagons } from './combat.js';
import { stepBuildings, yieldBonusBySector } from './buildings.js';
import { createQueues, stepProduction, rallyPoint, spawnFrame } from './production.js';
import { stepBot, thinksOn } from './botBrain.js';









export function createMatch({ map, seats, seed }) {
  const w = createWorld({ map, seats, seed });
  const playerCount = seats.length;

  const m = {
    w,
    playerCount,
    factions: factionMap(w),
    banks: seats.map(() => new Bank(START_RESOURCES)),
    queues: createQueues(playerCount),
    presence: createPresenceBuffers(w.sectors.length, playerCount),
    auras: createAuraBuffers(MAX_UNITS),
    
    score: new Int32Array(playerCount),
    
    routTicks: new Int32Array(playerCount),
    
    stats: seats.map(() => ({
      sectorsCaptured: 0, waterHoldTicks: 0, lowestSharePct: 100,
      unitsLost: 0, stockRecovered: 0, farmsUnmade: 0, peakSharePct: 0,
    })),
    
    automation: seats.map(() => ({
      autoRally: true, autoGather: true, autoEngage: true,
      autoRetreat: false, autoRebuild: false,
    })),
    
    scheduled: new Map(),
    events: [],
    
    botRound: 0,
    over: false,
    winner: -1,
    endReason: '',
    
    _scored: new Int32Array(playerCount),
    _rally: new Array(playerCount).fill(null),
  };

  placeStartingForces(m);
  return m;
}
















const OPENING_RING = [
  [0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0],
];

function placeStartingForces(m) {
  const w = m.w;
  for (let seat = 0; seat < m.playerCount; seat += 1) {
    const spawn = w.map.spawns.find((s) => s.seat === seat);
    if (!spawn) continue;
    const faction = m.factions[seat];
    let n = 0;
    for (const entry of START_FORCE[faction]) {
      for (let c = 0; c < entry.count; c += 1) {
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const off = OPENING_RING[n % OPENING_RING.length];
        const ring = 7000 + Math.floor(n / OPENING_RING.length) * 5200;
        const f = spawnFrame(w, seat);
        const ox = Math.trunc(((off[0] * f.px + off[1] * f.fx) * ring) / 1000);
        const oy = Math.trunc(((off[0] * f.py + off[1] * f.fy) * ring) / 1000);
        spawnUnit(w, seat, entry.unit, spawn.x + ox, spawn.y + oy, entry.packSize || 0);
        n += 1;
      }
    }
    
    
    
    
    
    
  }
}


export function schedule(m, tick, command) {
  const at = m.scheduled.get(tick);
  if (at) at.push(command);
  else m.scheduled.set(tick, [command]);
}









export function stepMatch(m, applyCommand) {
  if (m.over) return m.events;
  const w = m.w;
  m.events.length = 0;

  
  const due = m.scheduled.get(w.tick);
  if (due && applyCommand) {
    
    
    
    due.sort((a, b) => (a.p - b.p) || (a.seq - b.seq));
    for (const c of due) applyCommand(m, c);
  }
  m.scheduled.delete(w.tick);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let decides = false;
  for (let p = 0; p < m.playerCount; p += 1) {
    const b = m.w.seats[p].bot;
    if (b && thinksOn(b, w.tick)) { decides = true; break; }
  }
  const first = decides ? m.botRound % m.playerCount : 0;
  for (let k = 0; k < m.playerCount; k += 1) {
    const p = (first + k) % m.playerCount;
    const bot = m.w.seats[p].bot;
    if (bot) stepBot(m, bot);
  }
  if (decides) m.botRound += 1;

  
  stepProduction(w, m.queues, m.events);
  stepBuildings(w, m.events);

  
  measureAuras(w, m.auras);

  
  applyAutomation(m);
  stepMovement(w, m.auras.speedPct);
  stepSeparation(w, w.sectors.length);

  
  measurePresence(w, m.presence);

  
  m._scored.fill(0);
  stepTerritoryFlat(w.sectors, m.presence.weights, m.playerCount, m.factions, m._scored, m.events);
  for (let p = 0; p < m.playerCount; p += 1) m.score[p] += m._scored[p];

  
  stepCombat(w, m.auras.damagePct, m.events);
  stepPoundWagons(w, m.events);

  
  stepHealing(w);

  
  collectIncome(m);

  
  applyEvents(m);

  
  updateStats(m);
  checkEnd(m);

  w.tick += 1;
  return m.events;
}












const AUTOMATION_EVERY = TICKS_PER_SECOND >> 1;

function applyAutomation(m) {
  const w = m.w;
  if (w.tick % AUTOMATION_EVERY !== 0) return;
  for (let p = 0; p < m.playerCount; p += 1) m._rally[p] = null;

  const u = w.u;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0) continue;
    if (u.state[i] !== STATE.IDLE) continue;
    
    
    if (u.orderType[i] === ORDER.MOVE || u.orderType[i] === ORDER.HOLD) continue;

    const owner = u.owner[i];
    const hasBot = !!w.seats[owner].bot;
    
    
    
    
    if (u.orderType[i] === ORDER.CAPTURE && u.orderArg[i] >= 0
        && u.sector[i] === u.orderArg[i]
        && w.sectors[u.orderArg[i]].owner !== owner) continue;

    const auto = m.automation[owner];
    const spec = unitSpec(w, i);

    if (isGatherer(spec)) {
      if (!auto.autoGather) continue;
      const target = bestGatherSector(m, owner, spec, i);
      
      
      
      
      if (target === null) {
        
        
        
        if (hasBot || !auto.autoRally) continue;
        if (m._rally[owner] === null) m._rally[owner] = rallyPoint(w, owner) || false;
        const r = m._rally[owner];
        if (r) { moveTo(w, i, r.x, r.y); u.orderType[i] = ORDER.CAPTURE; }
        continue;
      }
      if (u.sector[i] !== target) {
        moveTo(w, i, w.sectors[target].cx, w.sectors[target].cy);
        u.orderType[i] = ORDER.GATHER;
        u.orderArg[i] = target;
      } else if (target !== null) {
        u.state[i] = STATE.GATHERING;
        u.orderType[i] = ORDER.GATHER;
        u.orderArg[i] = target;
      }
      continue;
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (hasBot || !auto.autoRally) continue;
    if (m._rally[owner] === null) m._rally[owner] = rallyPoint(w, owner) || false;
    const r = m._rally[owner];
    if (!r) continue;
    moveTo(w, i, r.x, r.y);
    u.orderType[i] = ORDER.CAPTURE;
  }
}










function bestGatherSector(m, owner, spec, unitSlot) {
  const w = m.w;
  const wantsWater = spec.gatherWaterPerTick > 0;
  const bonus = yieldBonusBySector(w);
  let best = null;
  let bestRoom = -0x7fffffff;
  for (let s = 0; s < w.sectors.length; s += 1) {
    const sector = w.sectors[s];
    if (sector.owner !== owner) continue;
    if (wantsWater !== (sector.kind === 'water')) continue;

    
    
    
    
    
    
    
    
    
    
    
    const b = bonus[sector.id] || 0;
    const cap = sectorCap(sector, b);
    let drawn = 0;
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== owner || w.u.sector[i] !== s) continue;
      if (w.u.state[i] !== STATE.GATHERING) continue;
      const os = unitSpec(w, i);
      const got = gatherOf(os.id, w.u.members[i], sector, m.factions[owner], b);
      drawn += got.feed + got.water;
    }
    const room = cap - drawn;
    if (room <= 0) continue;
    
    
    
    
    
    
    
    
    const dx = sector.cx - w.u.x[unitSlot];
    const dy = sector.cy - w.u.y[unitSlot];
    const score = (room + sector.yieldPct) * 1000
      - Math.floor((dx * dx + dy * dy) / 4000000);
    if (score > bestRoom) { bestRoom = score; best = s; }
  }
  return best;
}


function collectIncome(m) {
  const w = m.w;
  const bonus = yieldBonusBySector(w);
  
  
  
  
  
  const gatherers = [];
  const u = w.u;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0) continue;
    if (u.state[i] !== STATE.GATHERING) continue;
    const spec = unitSpec(w, i);
    if (spec.gatherFeedPerTick === 0 && spec.gatherWaterPerTick === 0) continue;
    gatherers.push({
      owner: u.owner[i], unitId: spec.id, members: u.members[i], sectorId: u.sector[i],
    });
  }
  const income = gatherers.length === 0
    ? null
    : stepEconomy(gatherers, w.sectors, m.factions, bonus);
  if (income) for (const p of Object.keys(income)) m.banks[p].earn(income[p]);

  
  
  
  
  
  
  
  
  for (let p = 0; p < m.banks.length; p += 1) {
    m.banks[p].noteIncome(income && income[p] ? (income[p].feed || 0) : 0);
  }
}


function applyEvents(m) {
  for (const ev of m.events) {
    if (ev.type === 'captured') {
      m.stats[ev.to].sectorsCaptured += 1;
    } else if (ev.type === 'stockRecovered') {
      
      
      
      if (scoresFor(m.factions[ev.by], 'stockRecovered')) {
        m.score[ev.by] += EVENT_BONUS_LAND_TICKS;
        m.stats[ev.by].stockRecovered += 1;
      }
      m.banks[ev.by].refund(ev.refund, ev.refundPct);
    } else if (ev.type === 'buildingLost') {
      
      
      
      if (ev.by >= 0 && scoresFor(m.factions[ev.by], 'farmUnmade')
          && m.factions[ev.owner] !== m.factions[ev.by]) {
        m.score[ev.by] += EVENT_BONUS_LAND_TICKS;
        m.stats[ev.by].farmsUnmade += 1;
      }
    } else if (ev.type === 'unitLost') {
      if (ev.owner >= 0) m.stats[ev.owner].unitsLost += 1;
    }
  }
}

function updateStats(m) {
  const w = m.w;
  for (let p = 0; p < m.playerCount; p += 1) {
    const share = sharePct(w.sectors, p);
    const st = m.stats[p];
    if (share < st.lowestSharePct) st.lowestSharePct = share;
    if (share > st.peakSharePct) st.peakSharePct = share;
    for (let s = 0; s < w.sectors.length; s += 1) {
      if (w.sectors[s].kind === 'water' && w.sectors[s].owner === p) {
        st.waterHoldTicks += 1;
        break;
      }
    }
  }
}





















































function isEliminated(m, p) {
  const w = m.w;
  for (let i = 0; i < w.u.count; i += 1) {
    if (w.u.alive[i] && w.u.owner[i] === p) return false;
  }
  if (m.queues[p].length > 0) return false;
  for (let i = 0; i < w.b.count; i += 1) {
    
    
    if (!w.b.alive[i] || w.b.owner[i] !== p) continue;
    if (buildingSpec(w, i).spawnsUnit) return false;
  }
  return !m.banks[p].canAfford(cheapestUnitCost(m.factions[p]));
}










const CHEAPEST_UNIT = new Map();
function cheapestUnitCost(faction) {
  let got = CHEAPEST_UNIT.get(faction);
  if (got) return got;
  for (const spec of Object.values(UNITS)) {
    if (spec.faction !== faction || spec.requires) continue;
    if (!got || spec.cost.feed < got.feed
        || (spec.cost.feed === got.feed && spec.cost.water < got.water)) {
      got = { feed: spec.cost.feed, water: spec.cost.water };
    }
  }
  CHEAPEST_UNIT.set(faction, got);
  return got;
}

function checkEnd(m) {
  const w = m.w;
  for (let p = 0; p < m.playerCount; p += 1) {
    const r = stepRout(w.sectors, p, m.routTicks[p]);
    m.routTicks[p] = r.heldTicks;
    if (r.routed) {
      m.over = true;
      m.winner = p;
      m.endReason = 'rout';
      m.events.push({ type: 'matchOver', winner: p, reason: 'rout' });
      return;
    }
  }

  
  
  
  
  
  
  
  
  let alive = -1;
  let aliveCount = 0;
  for (let p = 0; p < m.playerCount; p += 1) {
    if (isEliminated(m, p)) continue;
    aliveCount += 1;
    alive = p;
  }
  if (aliveCount <= 1) {
    m.over = true;
    
    
    
    m.winner = aliveCount === 1 ? alive : -1;
    m.endReason = aliveCount === 1 ? 'eliminated' : 'draw';
    m.events.push({ type: 'matchOver', winner: m.winner, reason: m.endReason });
    return;
  }

  if (w.tick + 1 >= MATCH_TICKS) {
    m.over = true;
    m.winner = leader(m);
    m.endReason = m.winner < 0 ? 'draw' : 'time';
    m.events.push({ type: 'matchOver', winner: m.winner, reason: m.endReason });
  }
}
















function leader(m) {
  let best = 0;
  let tied = false;
  for (let p = 1; p < m.playerCount; p += 1) {
    if (m.score[p] > m.score[best]) { best = p; tied = false; } else if (m.score[p] === m.score[best]) tied = true;
  }
  return tied ? -1 : best;
}


export function placings(m) {
  const order = [];
  for (let p = 0; p < m.playerCount; p += 1) order.push(p);
  order.sort((a, b) => (m.score[b] - m.score[a]) || (a - b));
  return order;
}


























export function handOverToBot(m, seat, bot) {
  if (!m.w.seats[seat]) return false;
  if (m.w.seats[seat].bot) return false;      
  m.w.seats[seat].bot = bot;
  m.events.push({ type: 'playerLeft', seat });
  return true;
}


export function runMatch(m, applyCommand, limit = MATCH_TICKS) {
  let n = 0;
  while (!m.over && n < limit) { stepMatch(m, applyCommand); n += 1; }
  return m.w.tick;
}

export { checksum };
