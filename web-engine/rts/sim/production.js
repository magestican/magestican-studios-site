




















import { isqrt, FIELD_MM } from '../fixed.js';
import { UNITS, BUILDINGS } from '../roster.js';
import { spawnUnit, spawnBuilding } from './world.js';
import { hasTechFor, whyCannotBuild } from './buildings.js';


export const QUEUE_MAX = 5;

export function createQueues(playerCount) {
  const q = [];
  for (let i = 0; i < playerCount; i += 1) q.push([]);
  return q;
}








export function whyCannotTrain(w, banks, owner, unitId) {
  const spec = UNITS[unitId];
  if (!spec) return 'no such unit';
  const faction = w.seats[owner] && w.seats[owner].faction;
  if (spec.faction !== faction) return 'not your faction';
  if (spec.requires && !hasTechFor(w, owner, unitId)) {
    return `needs a ${BUILDINGS[spec.requires].name}`;
  }
  if (!banks[owner].canAfford(spec.cost)) return 'not enough';
  return null;
}











export function train(w, banks, queues, owner, unitId) {
  const why = whyCannotTrain(w, banks, owner, unitId);
  if (why) return why;
  if (queues[owner].length >= QUEUE_MAX) return 'queue is full';
  const spec = UNITS[unitId];
  banks[owner].pay(spec.cost);
  queues[owner].push({ what: unitId, isBuilding: false, left: spec.buildTicks, sector: -1 });
  return null;
}









export function build(w, banks, queues, owner, buildingId, sectorIndex) {
  const spec = BUILDINGS[buildingId];
  if (!spec) return 'no such building';
  const why = whyCannotBuild(w, owner, buildingId, sectorIndex);
  if (why) return why;
  if (!banks[owner].canAfford(spec.cost)) return 'not enough';
  const sector = w.sectors[sectorIndex];
  const slot = spawnBuilding(w, owner, buildingId, sector.cx, sector.cy);
  if (slot < 0) return 'too many buildings';
  banks[owner].pay(spec.cost);
  return null;
}


export function cancel(w, banks, queues, owner, index) {
  const q = queues[owner];
  if (index < 0 || index >= q.length) return 'nothing there';
  const item = q[index];
  const spec = UNITS[item.what];
  
  
  
  banks[owner].refund(spec.cost, 100);
  q.splice(index, 1);
  return null;
}






export function stepProduction(w, queues, eventsOut = []) {
  for (let owner = 0; owner < queues.length; owner += 1) {
    const q = queues[owner];
    if (q.length === 0) continue;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const slots = productionSlots(w, owner);
    for (let k = 0; k < slots && k < q.length; k += 1) q[k].left -= 1;

    const head = q[0];
    if (head.left > 0) continue;

    const at = spawnPoint(w, owner);
    
    
    
    
    
    if (!at) { head.left = 0; continue; }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const seq = w.spawnSeq[owner] || 0;
    w.spawnSeq[owner] = seq + 1;
    const off = SPAWN_RING[seq % SPAWN_RING.length];
    const spread = 4000 + Math.floor(seq / SPAWN_RING.length) * 2600;
    const f = spawnFrame(w, owner);
    const ox = Math.trunc(((off[0] * f.px + off[1] * f.fx) * spread) / 1000);
    const oy = Math.trunc(((off[0] * f.py + off[1] * f.fy) * spread) / 1000);
    const slot = spawnUnit(w, owner, head.what, at.x + ox, at.y + oy);
    if (slot < 0) { head.left = 0; continue; }   
    q.shift();
    eventsOut.push({ type: 'unitSpawned', unit: head.what, owner, slot });
  }
}








const SPAWN_RING = [
  
  
  
  
  [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1],
];


















export function spawnFrame(w, owner) {
  const spawn = w.map.spawns.find((sp) => sp.seat === owner);
  const cx = Math.floor(FIELD_MM / 2);
  const cy = Math.floor(FIELD_MM / 2);
  let dx = spawn ? cx - spawn.x : 1000;
  let dy = spawn ? cy - spawn.y : 0;
  const len = isqrt(dx * dx + dy * dy);
  if (len === 0) { dx = 1000; dy = 0; } else {
    dx = Math.trunc((dx * 1000) / len);
    dy = Math.trunc((dy * 1000) / len);
  }
  
  return { fx: dx, fy: dy, px: -dy, py: dx };
}


export const MAX_PRODUCTION_SLOTS = 4;
export const SECTORS_PER_EXTRA_SLOT = 4;

export function productionSlots(w, owner) {
  let owned = 0;
  for (const s of w.sectors) if (s.owner === owner) owned += 1;
  return Math.min(MAX_PRODUCTION_SLOTS, 1 + Math.floor(owned / SECTORS_PER_EXTRA_SLOT));
}









export function spawnPoint(w, owner) {
  const enemy = enemyCentre(w, owner);
  let best = null;
  let bestD2 = 0;
  for (let s = 0; s < w.sectors.length; s += 1) {
    const sector = w.sectors[s];
    if (sector.owner !== owner) continue;
    if (!enemy) return { x: sector.cx, y: sector.cy };
    const dx = sector.cx - enemy.x;
    const dy = sector.cy - enemy.y;
    const d2 = dx * dx + dy * dy;
    
    
    if (best === null || d2 < bestD2) { best = sector; bestD2 = d2; }
  }
  if (best) return { x: best.cx, y: best.cy };

  
  
  
  
  
  
  
  
  
  
  
  
  const spawn = w.map.spawns.find((sp) => sp.seat === owner);
  return spawn ? { x: spawn.x, y: spawn.y } : null;
}


function enemyCentre(w, owner) {
  const u = w.u;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0 || u.owner[i] === owner) continue;
    const m = u.members[i];
    sx += u.x[i] * m;
    sy += u.y[i] * m;
    n += m;
  }
  if (n === 0) return null;
  return { x: Math.floor(sx / n), y: Math.floor(sy / n) };
}










export function rallyPoint(w, owner) {
  const enemy = enemyCentre(w, owner);
  let sx = 0;
  let sy = 0;
  let n = 0;
  let fallback = null;
  for (let s = 0; s < w.sectors.length; s += 1) {
    const sector = w.sectors[s];
    if (sector.owner !== owner) continue;
    if (fallback === null) fallback = sector;
    let border = false;
    for (const nb of sector.neighbours) {
      if (w.sectors[nb].owner !== owner) { border = true; break; }
    }
    if (!border) continue;
    
    
    let weight = 1;
    if (enemy) {
      const dx = sector.cx - enemy.x;
      const dy = sector.cy - enemy.y;
      
      
      const d = Math.floor((dx * dx + dy * dy) / 1000000000) + 1;
      weight = Math.max(1, Math.floor(64 / d));
    }
    sx += sector.cx * weight;
    sy += sector.cy * weight;
    n += weight;
  }
  if (n === 0) return fallback ? { x: fallback.cx, y: fallback.cy } : null;
  return { x: Math.floor(sx / n), y: Math.floor(sy / n) };
}
