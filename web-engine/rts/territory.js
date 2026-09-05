


























import { TICKS_PER_SECOND, ticks } from './fixed.js';
import { HERD, YIELD } from './roster.js';










export const HOLD_MAX = 200000;













export const CAPTURE_RATE = Object.freeze({ [HERD]: 100, [YIELD]: 55 });





export const DEFENCE_RESISTANCE_PCT = Object.freeze({ [HERD]: 100, [YIELD]: 60 });


export const FENCE_RESISTANCE_PCT = 40;















export const DECAY_GRACE_TICKS = ticks(15);

export const DECAY_PER_TICK = (HOLD_MAX * 5) / 100 / TICKS_PER_SECOND;   


export const SECTOR_VALUE = Object.freeze({ land: 1, water: 2, keystone: 3 });

export const SECTOR_KINDS = Object.freeze(Object.keys(SECTOR_VALUE));


export const POLLUTION_MAX = 3;








export function createSector({
  id, kind = 'land', yieldPct = 100, cx = 0, cy = 0, cells = 0, neighbours = [],
}) {
  if (!SECTOR_VALUE[kind]) throw new Error(`unknown sector kind: ${kind}`);
  return {
    id,
    kind,
    yieldPct,
    cx,
    cy,
    cells,
    
    
    neighbours: [...neighbours].sort((a, b) => a - b),
    owner: null,
    ownerFaction: null,
    hold: 0,
    
    claimant: null,
    claim: 0,
    
    idleTicks: 0,
    
    anchored: false,
    
    fenced: false,
    pollution: 0,
    
    scoreMultiplier: 1,
  };
}


export function sectorValuePerTick(sector) {
  return SECTOR_VALUE[sector.kind] * sector.scoreMultiplier;
}






















export function leadingPresence(presence) {
  const ids = Object.keys(presence).map(Number).sort((a, b) => a - b);
  let best = null;
  let bestWeight = 0;
  let total = 0;
  for (const id of ids) {
    const w = presence[id] | 0;
    if (w <= 0) continue;
    total += w;
    if (w > bestWeight) { bestWeight = w; best = id; }
  }
  if (best === null) return { player: null, net: 0 };
  return { player: best, net: bestWeight - (total - bestWeight) };
}















export function stepSector(sector, presence, factionOf) {
  const { player, net } = leadingPresence(presence);
  return stepSectorLead(sector, player, net, (presence[sector.owner] | 0) > 0, factionOf);
}













export function stepSectorLead(sector, player, net, ownerPresent, factionOf) {

  
  if (ownerPresent) sector.idleTicks = 0;
  else if (sector.owner !== null) sector.idleTicks += 1;

  if (player !== null && net > 0) {
    const rate = CAPTURE_RATE[factionOf[player]] * net;

    if (sector.owner === null) {
      
      
      
      
      
      if (sector.claimant !== player) { sector.claimant = player; sector.claim = 0; }
      sector.claim += rate;
      if (sector.claim >= HOLD_MAX) {
        sector.owner = player;
        sector.ownerFaction = factionOf[player];
        sector.hold = HOLD_MAX;
        sector.claim = 0;
        sector.claimant = null;
        sector.idleTicks = 0;
        return { type: 'captured', sector: sector.id, from: null, to: player };
      }
      return null;
    }

    if (player === sector.owner) {
      
      sector.hold = Math.min(HOLD_MAX, sector.hold + rate);
      sector.claim = 0;
      sector.claimant = null;
      return null;
    }

    
    
    
    
    
    
    
    
    const resist = sector.fenced && sector.ownerFaction === YIELD
      ? FENCE_RESISTANCE_PCT
      : DEFENCE_RESISTANCE_PCT[sector.ownerFaction];
    sector.hold -= Math.floor((rate * resist) / 100);
    if (sector.hold <= 0) {
      const was = sector.owner;
      sector.hold = 0;
      sector.owner = null;
      sector.ownerFaction = null;
      sector.idleTicks = 0;
      sector.claimant = player;
      sector.claim = 0;
      return { type: 'lost', sector: sector.id, from: was, to: null };
    }
    return null;
  }

  
  
  
  
  
  if (sector.owner === null) {
    if (sector.claim > 0) {
      sector.claim = Math.max(0, sector.claim - DECAY_PER_TICK);
      if (sector.claim === 0) sector.claimant = null;
    }
    return null;
  }

  
  if (sector.ownerFaction === HERD && !sector.anchored
      && sector.idleTicks > DECAY_GRACE_TICKS) {
    sector.hold -= DECAY_PER_TICK;
    if (sector.hold <= 0) {
      const was = sector.owner;
      sector.hold = 0;
      sector.owner = null;
      sector.ownerFaction = null;
      sector.claimant = null;
      sector.claim = 0;
      return { type: 'faded', sector: sector.id, from: was, to: null };
    }
  }
  return null;
}












export function stepTerritory(sectors, presenceBySector, factionOf) {
  const events = [];
  const scored = Object.create(null);
  
  
  
  for (let i = 0; i < sectors.length; i += 1) {
    const s = sectors[i];
    const ev = stepSector(s, presenceBySector[s.id] || {}, factionOf);
    if (ev) events.push(ev);
    if (s.owner !== null) {
      scored[s.owner] = (scored[s.owner] || 0) + sectorValuePerTick(s);
    }
  }
  return { events, scored };
}
















export function stepTerritoryFlat(sectors, weights, playerCount, factionOf, scoredOut, eventsOut) {
  for (let i = 0; i < sectors.length; i += 1) {
    const s = sectors[i];
    const base = i * playerCount;

    
    
    
    let best = -1;
    let bestWeight = 0;
    let total = 0;
    for (let p = 0; p < playerCount; p += 1) {
      const wgt = weights[base + p];
      if (wgt <= 0) continue;
      total += wgt;
      if (wgt > bestWeight) { bestWeight = wgt; best = p; }
    }
    const net = best < 0 ? 0 : bestWeight - (total - bestWeight);
    const ownerPresent = s.owner !== null && weights[base + s.owner] > 0;

    const ev = stepSectorLead(s, best < 0 ? null : best, net, ownerPresent, factionOf);
    if (ev) eventsOut.push(ev);
    if (s.owner !== null) scoredOut[s.owner] += sectorValuePerTick(s);
  }
}


export function totalMapValuePerTick(sectors) {
  let t = 0;
  for (const s of sectors) t += sectorValuePerTick(s);
  return t;
}


export function sharePct(sectors, playerId) {
  const total = totalMapValuePerTick(sectors);
  if (total === 0) return 0;
  let mine = 0;
  for (const s of sectors) if (s.owner === playerId) mine += sectorValuePerTick(s);
  return Math.floor((mine * 100) / total);
}


export const landSeconds = (landTicks) => Math.floor(landTicks / TICKS_PER_SECOND);










export const ROUT_SHARE_PCT = 85;
export const ROUT_HOLD_TICKS = ticks(45);







export function stepRout(sectors, playerId, heldTicks) {
  
  
  
  const next = sharePct(sectors, playerId) >= ROUT_SHARE_PCT ? heldTicks + 1 : 0;
  return { heldTicks: next, routed: next >= ROUT_HOLD_TICKS };
}
