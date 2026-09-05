
















import { BUILDINGS } from '../roster.js';
import { POLLUTION_MAX } from '../territory.js';
import { BUILDING_KINDS, buildingSpec, spawnUnit } from './world.js';

const POLLUTE_EVERY = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].pollutePerTicks || 0));
const CLEAN_EVERY = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].cleanPerTicks || 0));
const SPAWN_EVERY = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].spawnEveryTicks || 0));






export function stepBuildings(w, eventsOut = []) {
  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.owner[i] < 0) continue;

    if (b.building[i] > 0) {
      b.building[i] -= 1;
      if (b.building[i] === 0) {
        eventsOut.push({
          type: 'buildingDone', building: buildingSpec(w, i).id, owner: b.owner[i], sector: b.sector[i],
        });
      }
      continue;
    }

    const kind = b.kind[i];
    const spec = buildingSpec(w, i);

    
    
    
    
    const sector = w.sectors[b.sector[i]];
    if (!sector || sector.owner !== b.owner[i]) continue;

    if (POLLUTE_EVERY[kind] > 0) {
      b.pulse[i] += 1;
      if (b.pulse[i] >= POLLUTE_EVERY[kind]) {
        b.pulse[i] = 0;
        pollute(w, sector, spec.polluteMax, eventsOut, b.owner[i]);
      }
    } else if (CLEAN_EVERY[kind] > 0) {
      b.pulse[i] += 1;
      if (b.pulse[i] >= CLEAN_EVERY[kind]) {
        b.pulse[i] = 0;
        clean(w, sector, eventsOut, b.owner[i]);
      }
      
      
      
      
      if (SPAWN_EVERY[kind] > 0 && sector.pollution === 0) {
        b.cooldown[i] += 1;
        if (b.cooldown[i] >= SPAWN_EVERY[kind]) {
          b.cooldown[i] = 0;
          const slot = spawnUnit(w, b.owner[i], spec.spawnsUnit, b.x[i], b.y[i], spec.spawnPackSize);
          if (slot >= 0) {
            eventsOut.push({ type: 'unitSpawned', unit: spec.spawnsUnit, owner: b.owner[i], free: true });
          }
        }
      } else if (SPAWN_EVERY[kind] > 0) {
        
        
        
        b.cooldown[i] = 0;
      }
    }
  }

  refreshSectorFlags(w);
}

function pollute(w, sector, max, eventsOut, by) {
  const cap = Math.min(POLLUTION_MAX, max || POLLUTION_MAX);
  let changed = false;
  if (sector.kind === 'water' && sector.pollution < cap) { sector.pollution += 1; changed = true; }
  for (const n of sector.neighbours) {
    const ns = w.sectors[n];
    if (ns.kind !== 'water') continue;
    if (ns.pollution < cap) { ns.pollution += 1; changed = true; }
  }
  if (changed) eventsOut.push({ type: 'waterPolluted', by, sector: sector.id });
}

function clean(w, sector, eventsOut, by) {
  let changed = false;
  if (sector.pollution > 0) { sector.pollution -= 1; changed = true; }
  for (const n of sector.neighbours) {
    const ns = w.sectors[n];
    if (ns.kind !== 'water' || ns.pollution <= 0) continue;
    ns.pollution -= 1;
    changed = true;
  }
  if (changed) eventsOut.push({ type: 'waterCleaned', by, sector: sector.id });
}











export function refreshSectorFlags(w) {
  for (let s = 0; s < w.sectors.length; s += 1) {
    w.sectors[s].anchored = false;
    w.sectors[s].fenced = false;
    w.sectors[s].scoreMultiplier = 1;
  }
  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0 || b.owner[i] < 0) continue;
    const sector = w.sectors[b.sector[i]];
    if (!sector) continue;
    
    
    
    if (sector.owner !== b.owner[i]) continue;
    const spec = buildingSpec(w, i);
    if (spec.anchorsSector) sector.anchored = true;
    if (spec.wall && spec.seversAura) sector.fenced = true;
    if (spec.scoreMultiplier > 1) sector.scoreMultiplier = spec.scoreMultiplier;
  }
}










export function yieldBonusBySector(w) {
  const out = Object.create(null);
  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0 || b.owner[i] < 0) continue;
    const spec = buildingSpec(w, i);
    if (!spec.yieldBonusPct) continue;
    const sector = w.sectors[b.sector[i]];
    if (!sector || sector.owner !== b.owner[i]) continue;
    const prev = out[sector.id] || 0;
    
    
    
    if (spec.yieldBonusPct > prev) out[sector.id] = spec.yieldBonusPct;
  }
  return out;
}










export function whyCannotBuild(w, owner, buildingId, sectorIndex) {
  const spec = BUILDINGS[buildingId];
  if (!spec) return 'no such building';
  const faction = w.seats[owner] && w.seats[owner].faction;
  if (spec.faction !== faction) return 'not your faction';
  const sector = w.sectors[sectorIndex];
  if (!sector) return 'no such sector';
  if (sector.owner !== owner) return 'you do not hold that ground';
  if (spec.waterOnly && sector.kind !== 'water') return 'that goes on water';
  if (!spec.waterOnly && sector.kind === 'water') return 'that does not go on water';

  if (spec.requiresPollutionAtLeast !== undefined
      && sector.pollution < spec.requiresPollutionAtLeast) {
    return 'the water is not spoiled enough';
  }
  if (spec.requiresPollutionAtMost !== undefined
      && sector.pollution > spec.requiresPollutionAtMost) {
    return 'the water is spoiled';
  }
  if (spec.requiresOwnedNeighbours) {
    let owned = 0;
    for (const n of sector.neighbours) if (w.sectors[n].owner === owner) owned += 1;
    if (owned < spec.requiresOwnedNeighbours) return 'too exposed';
  }
  return null;
}


export function hasTechFor(w, owner, unitId) {
  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0 || b.owner[i] !== owner) continue;
    if (buildingSpec(w, i).unlocks.includes(unitId)) return true;
  }
  return false;
}
