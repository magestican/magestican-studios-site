










































import { ticks, dist2 } from './fixed.js';










export const CONTACT_TICKS = ticks(20);












export const SETTLE_TICKS = ticks(6);










export const LATE_TICK = ticks(360);


export const OBJECTIVES = Object.freeze([
  'enemy-seen', 'capture-first', 'capture-more', 'build-first', 'water', 'hold',
]);


const NEEDS_TARGET = Object.freeze(['enemy-seen', 'capture-first', 'capture-more', 'water']);











function closestOf(sectors, list, ax, ay) {
  let best = list[0];
  let bestD = dist2(ax, ay, sectors[best].cx, sectors[best].cy);
  for (let k = 1; k < list.length; k += 1) {
    const i = list[k];
    const d = dist2(ax, ay, sectors[i].cx, sectors[i].cy);
    if (d < bestD || (d === bestD && i < best)) { best = i; bestD = d; }
  }
  return best;
}














function nearestSector(sectors, sources, accept, ax, ay) {
  const n = sectors.length;
  const seen = new Uint8Array(n);
  let layer = [];
  for (const s of sources) {
    if (s === null || s === undefined) continue;
    if (s < 0 || s >= n || seen[s]) continue;
    seen[s] = 1;
    layer.push(s);
  }
  while (layer.length > 0) {
    const hits = [];
    for (const i of layer) if (accept(sectors[i], i)) hits.push(i);
    if (hits.length > 0) return closestOf(sectors, hits, ax, ay);
    const next = [];
    for (const i of layer) {
      for (const nb of sectors[i].neighbours) {
        if (nb >= 0 && nb < n && !seen[nb]) { seen[nb] = 1; next.push(nb); }
      }
    }
    layer = next;
  }
  return null;
}








function context(state) {
  const sectors = state.sectors;
  const seat = state.seat;
  const spawn = (state.spawnSector === null || state.spawnSector === undefined)
    ? -1 : state.spawnSector;

  const owned = [];
  let ownsWater = false;
  for (let i = 0; i < sectors.length; i += 1) {
    if (sectors[i].owner === seat) {
      owned.push(i);
      if (sectors[i].kind === 'water') ownsWater = true;
    }
  }
  const sources = owned.length > 0 ? owned : [spawn];
  const home = spawn >= 0 && spawn < sectors.length
    ? sectors[spawn]
    : (owned.length > 0 ? sectors[owned[0]] : { cx: 0, cy: 0 });

  return {
    sectors,
    seat,
    spawn,
    owned,
    ownsWater,
    sources,
    ax: home.cx,
    ay: home.cy,
    tick: state.tick || 0,
    playerBuildings: state.playerBuildings || 0,
    enemySeenTick: (state.enemySeenTick === null || state.enemySeenTick === undefined)
      ? null : state.enemySeenTick,
  };
}


function targetFor(id, c) {
  const neutral = (s) => s.owner === null;
  const enemy = (s) => s.owner !== null && s.owner !== c.seat;
  switch (id) {
    case 'capture-first':
    case 'capture-more':
      
      
      
      
      
      
      
      
      
      return nearestSector(c.sectors, c.sources, neutral, c.ax, c.ay);
    case 'water':
      return nearestSector(c.sectors, c.sources,
        (s) => s.kind === 'water' && s.owner !== c.seat, c.ax, c.ay);
    case 'enemy-seen':
      return nearestSector(c.sectors, c.sources, enemy, c.ax, c.ay);
    case 'build-first':
      
      
      
      if (c.spawn >= 0 && c.sectors[c.spawn] && c.sectors[c.spawn].owner === c.seat) return c.spawn;
      return c.owned.length > 0 ? c.owned[0] : null;
    default:
      return null;
  }
}











function chooseId(c) {
  
  
  
  
  
  const sinceContact = c.enemySeenTick === null ? -1 : c.tick - c.enemySeenTick;
  if (sinceContact >= 0
    && sinceContact < CONTACT_TICKS
    && targetFor('enemy-seen', c) !== null) return 'enemy-seen';

  
  
  
  if (c.owned.length <= 1) return 'capture-first';

  if (c.tick >= LATE_TICK) return 'hold';
  if (c.owned.length <= 3) return 'capture-more';
  if (c.playerBuildings === 0) return 'build-first';
  if (!c.ownsWater && targetFor('water', c) !== null) return 'water';
  return 'hold';
}














export function nextObjective(state) {
  const c = context(state);
  let id = chooseId(c);
  let since = c.tick;

  const prev = state.prev;
  if (prev && prev.id === id) {
    since = prev.since;
  } else if (prev && (c.tick - prev.since) < SETTLE_TICKS) {
    
    
    
    const held = targetFor(prev.id, c);
    if (held !== null || !NEEDS_TARGET.includes(prev.id)) {
      id = prev.id;
      since = prev.since;
    }
  }

  return { id, sector: targetFor(id, c), since };
}
