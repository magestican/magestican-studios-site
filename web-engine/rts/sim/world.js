

























import { Rng } from '../rng.js';
import { UNITS, BUILDINGS } from '../roster.js';
import { createSector } from '../territory.js';
import { sectorAt } from '../maps/mapFormat.js';











export const MAX_UNITS = 1024;
export const MAX_BUILDINGS = 256;


export const STATE = Object.freeze({
  IDLE: 0, MOVING: 1, ATTACKING: 2, GATHERING: 3, LOADING: 4, DEAD: 5,
});


export const ORDER = Object.freeze({
  NONE: 0, MOVE: 1, ATTACK: 2, CAPTURE: 3, GATHER: 4, HOLD: 5,
});









export const UNIT_KINDS = Object.freeze(Object.keys(UNITS).sort());
export const BUILDING_KINDS = Object.freeze(Object.keys(BUILDINGS).sort());
const UNIT_KIND_INDEX = new Map(UNIT_KINDS.map((k, i) => [k, i]));
const BUILDING_KIND_INDEX = new Map(BUILDING_KINDS.map((k, i) => [k, i]));

export const unitKindIndex = (id) => {
  const i = UNIT_KIND_INDEX.get(id);
  if (i === undefined) throw new Error(`unknown unit: ${id}`);
  return i;
};
export const buildingKindIndex = (id) => {
  const i = BUILDING_KIND_INDEX.get(id);
  if (i === undefined) throw new Error(`unknown building: ${id}`);
  return i;
};









export function createWorld({ map, seats, seed }) {
  const u = {
    
    id: new Int32Array(MAX_UNITS),
    owner: new Int8Array(MAX_UNITS).fill(-1),
    kind: new Int16Array(MAX_UNITS),
    alive: new Uint8Array(MAX_UNITS),
    
    x: new Int32Array(MAX_UNITS),
    y: new Int32Array(MAX_UNITS),
    sector: new Int16Array(MAX_UNITS).fill(-1),
    facing: new Int16Array(MAX_UNITS),
    
    
    
    
    
    
    
    
    
    members: new Int16Array(MAX_UNITS),
    hp: new Int32Array(MAX_UNITS),
    
    state: new Int8Array(MAX_UNITS),
    cooldown: new Int16Array(MAX_UNITS),
    orderType: new Int8Array(MAX_UNITS),
    orderX: new Int32Array(MAX_UNITS),
    orderY: new Int32Array(MAX_UNITS),
    
    orderArg: new Int32Array(MAX_UNITS).fill(-1),
    
    progress: new Int16Array(MAX_UNITS),
    
    variant: new Int8Array(MAX_UNITS),
    count: 0,
  };

  const b = {
    id: new Int32Array(MAX_BUILDINGS),
    owner: new Int8Array(MAX_BUILDINGS).fill(-1),
    kind: new Int16Array(MAX_BUILDINGS),
    alive: new Uint8Array(MAX_BUILDINGS),
    x: new Int32Array(MAX_BUILDINGS),
    y: new Int32Array(MAX_BUILDINGS),
    sector: new Int16Array(MAX_BUILDINGS).fill(-1),
    hp: new Int32Array(MAX_BUILDINGS),
    
    building: new Int16Array(MAX_BUILDINGS),
    cooldown: new Int16Array(MAX_BUILDINGS),
    
    pulse: new Int16Array(MAX_BUILDINGS),
    count: 0,
  };

  return {
    tick: 0,
    




    map,
    












    sectors: map.sectors.map((s) => createSector({
      id: s.id,
      kind: s.kind,
      yieldPct: s.yieldPct,
      cx: s.cx,
      cy: s.cy,
      cells: s.cells,
      neighbours: s.neighbours,
    })),
    seats,
    rng: new Rng(seed),
    u,
    b,
    nextId: 1,
    

    spawnSeq: new Int32Array(8),
    
    events: [],
  };
}


function freeSlot(store, cap) {
  for (let i = 0; i < cap; i += 1) if (!store.alive[i]) return i;
  return -1;
}








export function spawnUnit(w, owner, unitId, x, y, members = 0) {
  const slot = freeSlot(w.u, MAX_UNITS);
  if (slot < 0) return -1;
  const spec = UNITS[unitId];
  if (!spec) throw new Error(`unknown unit: ${unitId}`);
  const u = w.u;
  u.id[slot] = w.nextId; w.nextId += 1;
  u.owner[slot] = owner;
  u.kind[slot] = unitKindIndex(unitId);
  u.alive[slot] = 1;
  u.x[slot] = x;
  u.y[slot] = y;
  u.sector[slot] = sectorAt(w.map, x, y);
  u.facing[slot] = 0;
  u.members[slot] = members > 0 ? members : spec.packSize;
  u.hp[slot] = spec.hp;
  u.state[slot] = STATE.IDLE;
  u.cooldown[slot] = 0;
  u.orderType[slot] = ORDER.NONE;
  u.orderX[slot] = 0;
  u.orderY[slot] = 0;
  u.orderArg[slot] = -1;
  u.progress[slot] = 0;
  
  
  
  u.variant[slot] = spec.variants ? w.rng.below(spec.variants.length) : 0;
  if (slot >= w.u.count) w.u.count = slot + 1;
  return slot;
}


export function spawnBuilding(w, owner, buildingId, x, y) {
  const slot = freeSlot(w.b, MAX_BUILDINGS);
  if (slot < 0) return -1;
  const spec = BUILDINGS[buildingId];
  if (!spec) throw new Error(`unknown building: ${buildingId}`);
  const b = w.b;
  b.id[slot] = w.nextId; w.nextId += 1;
  b.owner[slot] = owner;
  b.kind[slot] = buildingKindIndex(buildingId);
  b.alive[slot] = 1;
  b.x[slot] = x;
  b.y[slot] = y;
  b.sector[slot] = sectorAt(w.map, x, y);
  
  
  
  
  
  
  b.hp[slot] = spec.hp;
  b.building[slot] = spec.buildTicks;
  b.cooldown[slot] = 0;
  b.pulse[slot] = 0;
  if (slot >= w.b.count) w.b.count = slot + 1;
  return slot;
}


export const unitSpec = (w, slot) => UNITS[UNIT_KINDS[w.u.kind[slot]]];
















export const isGatherer = (spec) => spec.gatherFeedPerTick > 0 || spec.gatherWaterPerTick > 0;


export const isArmy = (spec) => spec.damage > 0 && !isGatherer(spec);
export const buildingSpec = (w, slot) => BUILDINGS[BUILDING_KINDS[w.b.kind[slot]]];


export function packHealth(w, slot) {
  if (!w.u.alive[slot]) return 0;
  const spec = unitSpec(w, slot);
  return (w.u.members[slot] - 1) * spec.hp + w.u.hp[slot];
}


export function packPct(w, slot) {
  if (!w.u.alive[slot]) return 0;
  const spec = unitSpec(w, slot);
  return Math.floor((packHealth(w, slot) * 100) / (spec.hp * spec.packSize));
}







export function damageUnit(w, slot, amount) {
  if (!w.u.alive[slot] || amount <= 0) return 0;
  const spec = unitSpec(w, slot);
  let left = amount;
  let died = 0;
  while (left > 0 && w.u.members[slot] > 0) {
    if (left < w.u.hp[slot]) { w.u.hp[slot] -= left; left = 0; break; }
    left -= w.u.hp[slot];
    w.u.members[slot] -= 1;
    died += 1;
    
    
    
    
    w.u.hp[slot] = w.u.members[slot] > 0 ? spec.hp : 0;
  }
  if (w.u.members[slot] <= 0) killUnit(w, slot);
  return died;
}


export function killUnit(w, slot) {
  if (!w.u.alive[slot]) return;
  w.u.alive[slot] = 0;
  w.u.members[slot] = 0;
  w.u.hp[slot] = 0;
  w.u.state[slot] = STATE.DEAD;
  w.u.owner[slot] = -1;
  w.u.sector[slot] = -1;
  w.u.orderType[slot] = ORDER.NONE;
  w.u.orderArg[slot] = -1;
}


export function damageBuilding(w, slot, amount) {
  if (!w.b.alive[slot] || amount <= 0) return false;
  w.b.hp[slot] -= amount;
  if (w.b.hp[slot] > 0) return false;
  killBuilding(w, slot);
  return true;
}

export function killBuilding(w, slot) {
  if (!w.b.alive[slot]) return;
  w.b.alive[slot] = 0;
  w.b.hp[slot] = 0;
  w.b.owner[slot] = -1;
  w.b.sector[slot] = -1;
}


export function order(w, slot, type, { x = 0, y = 0, arg = -1 } = {}) {
  if (!w.u.alive[slot]) return;
  w.u.orderType[slot] = type;
  w.u.orderX[slot] = x;
  w.u.orderY[slot] = y;
  w.u.orderArg[slot] = arg;
  w.u.progress[slot] = 0;
  w.u.state[slot] = type === ORDER.NONE ? STATE.IDLE : STATE.MOVING;
}


export function slotOfUnitId(w, id) {
  for (let i = 0; i < w.u.count; i += 1) if (w.u.alive[i] && w.u.id[i] === id) return i;
  return -1;
}

export function slotOfBuildingId(w, id) {
  for (let i = 0; i < w.b.count; i += 1) if (w.b.alive[i] && w.b.id[i] === id) return i;
  return -1;
}


export function unitCountOf(w, owner) {
  let n = 0;
  for (let i = 0; i < w.u.count; i += 1) if (w.u.alive[i] && w.u.owner[i] === owner) n += 1;
  return n;
}

export const factionOfSeat = (w, owner) => (w.seats[owner] ? w.seats[owner].faction : null);


export function factionMap(w) {
  const out = Object.create(null);
  for (let i = 0; i < w.seats.length; i += 1) out[i] = w.seats[i].faction;
  return out;
}














const FNV_PRIME = 16777619;

function mix(h, v) {
  
  
  
  let x = h ^ (v | 0);
  x = Math.imul(x, FNV_PRIME);
  return x | 0;
}








export function checksum(w) {
  let h = 0x811c9dc5;
  h = mix(h, w.tick);
  h = mix(h, w.nextId);
  h = mix(h, w.rng.save());
  const u = w.u;
  for (let i = 0; i < w.u.count; i += 1) {
    h = mix(h, u.alive[i]);
    if (!u.alive[i]) continue;
    h = mix(h, u.id[i]);
    h = mix(h, u.owner[i]);
    h = mix(h, u.kind[i]);
    h = mix(h, u.x[i]);
    h = mix(h, u.y[i]);
    h = mix(h, u.members[i]);
    h = mix(h, u.hp[i]);
    h = mix(h, u.state[i]);
    h = mix(h, u.cooldown[i]);
    h = mix(h, u.orderType[i]);
    h = mix(h, u.orderArg[i]);
    h = mix(h, u.progress[i]);
  }
  const b = w.b;
  for (let i = 0; i < w.b.count; i += 1) {
    h = mix(h, b.alive[i]);
    if (!b.alive[i]) continue;
    h = mix(h, b.id[i]);
    h = mix(h, b.owner[i]);
    h = mix(h, b.kind[i]);
    h = mix(h, b.x[i]);
    h = mix(h, b.y[i]);
    h = mix(h, b.hp[i]);
    h = mix(h, b.building[i]);
    h = mix(h, b.pulse[i]);
  }
  
  
  
  for (const s of w.sectors) {
    h = mix(h, s.owner === null ? -1 : s.owner);
    h = mix(h, s.hold);
    h = mix(h, s.claim);
    h = mix(h, s.claimant === null ? -1 : s.claimant);
    h = mix(h, s.idleTicks);
    h = mix(h, s.pollution);
    h = mix(h, s.anchored ? 1 : 0);
    h = mix(h, s.fenced ? 1 : 0);
    h = mix(h, s.scoreMultiplier);
  }
  return h >>> 0;
}
