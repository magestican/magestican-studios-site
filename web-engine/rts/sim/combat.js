














import { dist2 } from '../fixed.js';
import { UNITS, BUILDINGS, damageAfterArmour } from '../roster.js';
import {
  UNIT_KINDS, BUILDING_KINDS, STATE, ORDER,
  unitSpec, buildingSpec, damageUnit, damageBuilding, packPct,
} from './world.js';



const U_DAMAGE = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].damage));
const U_ATTACK_TICKS = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].attackTicks));
const U_RANGE = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].rangeMm));
const U_AREA = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].areaMm));
const U_ARMOUR = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].armourFlat));
const U_IS_AIR = new Uint8Array(UNIT_KINDS.map((k) => (UNITS[k].air ? 1 : 0)));
const U_DMG_CLASS = UNIT_KINDS.map((k) => UNITS[k].damageClass);
const U_ARM_CLASS = UNIT_KINDS.map((k) => UNITS[k].armourClass);

const B_DAMAGE = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].damage));
const B_ATTACK_TICKS = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].attackTicks));
const B_RANGE = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].rangeMm));
const B_AREA = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].areaMm));
const B_ARMOUR = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].armourFlat));
const B_DMG_CLASS = BUILDING_KINDS.map((k) => BUILDINGS[k].damageClass);











export const LEASH_MM = 260000;






























































const PROJECTILE_CLASSES = new Set([
  'smallArms',  
  'towerGun',   
  'stone',      
  'pesticide',  
  'current',    
]);





































export const SECTOR_FRONTAGE = 24;









export function canEngage(damageClass, armourClass) {
  return damageAfterArmour(1, damageClass, armourClass, 0) > 0;
}







































function measureCrowding(w) {
  const u = w.u;
  const n = w.sectors.length;
  if (!w._crowd || w._crowd.length !== u.id.length) w._crowd = new Int32Array(u.id.length);
  if (!w._crowdCount || w._crowdCount.length !== n * 8) w._crowdCount = new Int32Array(n * 8);
  const counts = w._crowdCount;
  counts.fill(0);
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0) continue;
    const sec = u.sector[i];
    if (sec < 0) continue;
    counts[sec * 8 + u.owner[i]] += u.members[i];
  }
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0) { w._crowd[i] = 100; continue; }
    const sec = u.sector[i];
    if (sec < 0) { w._crowd[i] = 100; continue; }
    const here = counts[sec * 8 + u.owner[i]];   
    w._crowd[i] = here <= SECTOR_FRONTAGE
      ? 100
      : Math.max(10, Math.floor((SECTOR_FRONTAGE * 100) / here));
  }
}

function buildBuckets(w) {
  const u = w.u;
  const n = w.sectors.length;
  if (!w._cbHead || w._cbHead.length !== n) {
    w._cbHead = new Int32Array(n);
    w._cbNext = new Int32Array(u.id.length);
  }
  w._cbHead.fill(-1);
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0) continue;
    const s = u.sector[i];
    if (s < 0 || s >= n) continue;
    w._cbNext[i] = w._cbHead[s];
    w._cbHead[s] = i;
  }
}

export function acquire(w, i, leashMm = LEASH_MM) {
  const u = w.u;
  const owner = u.owner[i];
  const myClass = U_DMG_CLASS[u.kind[i]];
  if (U_DAMAGE[u.kind[i]] <= 0) return { kind: 0, slot: -1 };
  if (!w._cbHead) buildBuckets(w);

  const leash2 = leashMm * leashMm;
  let bestKind = 0;
  let bestSlot = -1;
  let bestD2 = 0;
  let bestId = 0;

  const home = u.sector[i];
  if (home < 0) return { kind: 0, slot: -1 };
  
  
  
  
  const scan = (s) => {
    for (let j = w._cbHead[s]; j !== -1; j = w._cbNext[j]) {
      if (!u.alive[j] || u.owner[j] === owner || u.owner[j] < 0) continue;
      if (!canEngage(myClass, U_ARM_CLASS[u.kind[j]])) continue;
      const d2 = dist2(u.x[i], u.y[i], u.x[j], u.y[j]);
      if (d2 > leash2) continue;
      if (bestSlot < 0 || d2 < bestD2 || (d2 === bestD2 && u.id[j] < bestId)) {
        bestKind = 1; bestSlot = j; bestD2 = d2; bestId = u.id[j];
      }
    }
  };
  scan(home);
  const nb = w.sectors[home].neighbours;
  for (let k = 0; k < nb.length; k += 1) scan(nb[k]);

  
  
  
  if (bestSlot >= 0) return { kind: bestKind, slot: bestSlot };

  const b = w.b;
  for (let j = 0; j < b.count; j += 1) {
    if (!b.alive[j] || b.owner[j] === owner || b.owner[j] < 0) continue;
    if (!canEngage(myClass, 'structure')) continue;
    const d2 = dist2(u.x[i], u.y[i], b.x[j], b.y[j]);
    if (d2 > leash2) continue;
    if (bestSlot < 0 || d2 < bestD2 || (d2 === bestD2 && b.id[j] < bestId)) {
      bestKind = 2; bestSlot = j; bestD2 = d2; bestId = b.id[j];
    }
  }
  return { kind: bestKind, slot: bestSlot };
}








export function stepCombat(w, damageBonusPct = null, eventsOut = []) {
  const u = w.u;
  buildBuckets(w);
  measureCrowding(w);
  if (!w._pending || w._pending.length !== u.id.length) {
    w._pending = new Int32Array(u.id.length);
    w._pendingBy = new Int32Array(u.id.length).fill(-1);
  }

  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    if (u.cooldown[i] > 0) u.cooldown[i] -= 1;
    const kind = u.kind[i];
    if (U_DAMAGE[kind] <= 0) continue;

    
    
    
    
    
    const committed = u.state[i] === STATE.MOVING && u.orderType[i] === ORDER.MOVE;
    if (committed) continue;

    const target = acquire(w, i);
    if (target.kind === 0) continue;

    const range = U_RANGE[kind];
    const tx = target.kind === 1 ? u.x[target.slot] : w.b.x[target.slot];
    const ty = target.kind === 1 ? u.y[target.slot] : w.b.y[target.slot];
    const d2 = dist2(u.x[i], u.y[i], tx, ty);

    if (d2 > range * range) {
      
      
      
      if (u.state[i] === STATE.IDLE || u.state[i] === STATE.ATTACKING) {
        u.state[i] = STATE.ATTACKING;
        u.orderX[i] = tx;
        u.orderY[i] = ty;
        u.state[i] = STATE.MOVING;
      }
      continue;
    }

    u.state[i] = STATE.ATTACKING;
    if (u.cooldown[i] > 0) continue;
    u.cooldown[i] = U_ATTACK_TICKS[kind];

    
    
    
    let per = U_DAMAGE[kind];
    if (damageBonusPct) per += Math.floor((per * damageBonusPct[i]) / 100);
    
    
    const crowd = w._crowd ? w._crowd[i] : 100;
    const volley = Math.max(1, Math.floor((per * u.members[i] * crowd) / 100));

    
    
    
    
    eventsOut.push({
      type: 'shot',
      tick: w.tick,
      owner: u.owner[i],
      attacker: u.id[i],
      building: -1,
      x: u.x[i], y: u.y[i],
      tx, ty,
      weapon: U_DMG_CLASS[kind],
      projectile: PROJECTILE_CLASSES.has(U_DMG_CLASS[kind]),
      areaMm: U_AREA[kind],
      members: u.members[i],
    });

    if (U_AREA[kind] > 0) {
      applyArea(w, i, u.owner[i], tx, ty, U_AREA[kind], U_DMG_CLASS[kind], volley, eventsOut);
    } else if (target.kind === 1) {
      hitUnit(w, i, target.slot, U_DMG_CLASS[kind], volley, eventsOut);
    } else {
      hitBuilding(w, i, target.slot, U_DMG_CLASS[kind], volley, eventsOut);
    }
  }

  stepBuildingGuns(w, eventsOut);
  resolveDamage(w, eventsOut);
}
















function queueDamage(w, victim, amount) {
  if (amount <= 0) return;
  w._pending[victim] += amount;
}

function hitUnit(w, attacker, victim, damageClass, raw, eventsOut) {
  const dealt = damageAfterArmour(
    raw, damageClass, U_ARM_CLASS[w.u.kind[victim]], U_ARMOUR[w.u.kind[victim]],
  );
  
  
  
  
  
  
  queueDamage(w, victim, dealt);
  if (w._pendingBy[victim] < 0 && attacker >= 0) w._pendingBy[victim] = w.u.owner[attacker];
}


function resolveDamage(w, eventsOut) {
  const u = w.u;
  for (let i = 0; i < u.count; i += 1) {
    const amount = w._pending[i];
    if (amount <= 0) continue;
    w._pending[i] = 0;
    if (!u.alive[i]) { w._pendingBy[i] = -1; continue; }
    const victimOwner = u.owner[i];
    const victimId = u.id[i];
    const by = w._pendingBy[i];
    w._pendingBy[i] = -1;
    const died = damageUnit(w, i, amount);
    if (died > 0) {
      eventsOut.push({
        type: u.alive[i] ? 'membersLost' : 'unitLost',
        victim: victimId,
        owner: victimOwner,
        by,
        members: died,
      });
    }
  }
}

function hitBuilding(w, attacker, victim, damageClass, raw, eventsOut) {
  
  
  const spec = buildingSpec(w, victim);
  const owner = w.b.owner[victim];
  const dealt = damageAfterArmour(raw, damageClass, 'structure', spec.armourFlat);
  if (damageBuilding(w, victim, dealt)) {
    
    
    
    eventsOut.push({
      type: 'buildingLost',
      building: spec.id,
      owner,
      by: attacker >= 0 ? w.u.owner[attacker] : -1,
    });
  }
}









function applyArea(w, attacker, ownerId, cx, cy, radiusMm, damageClass, raw, eventsOut) {
  const u = w.u;
  
  
  
  
  
  
  
  
  const owner = ownerId;
  const r2 = radiusMm * radiusMm;
  for (let j = 0; j < u.count; j += 1) {
    if (!u.alive[j] || u.owner[j] === owner || u.owner[j] < 0) continue;
    if (dist2(cx, cy, u.x[j], u.y[j]) > r2) continue;
    hitUnit(w, attacker, j, damageClass, raw, eventsOut);
  }
}


function stepBuildingGuns(w, eventsOut) {
  const b = w.b;
  const u = w.u;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0) continue;
    const kind = b.kind[i];
    if (B_DAMAGE[kind] <= 0) continue;
    if (b.cooldown[i] > 0) { b.cooldown[i] -= 1; continue; }

    const owner = b.owner[i];
    const myClass = B_DMG_CLASS[kind];
    const range2 = B_RANGE[kind] * B_RANGE[kind];

    let bestSlot = -1;
    let bestD2 = 0;
    let bestId = 0;
    for (let j = 0; j < u.count; j += 1) {
      if (!u.alive[j] || u.owner[j] === owner || u.owner[j] < 0) continue;
      if (!canEngage(myClass, U_ARM_CLASS[u.kind[j]])) continue;
      const d2 = dist2(b.x[i], b.y[i], u.x[j], u.y[j]);
      if (d2 > range2) continue;
      if (bestSlot < 0 || d2 < bestD2 || (d2 === bestD2 && u.id[j] < bestId)) {
        bestSlot = j; bestD2 = d2; bestId = u.id[j];
      }
    }
    if (bestSlot < 0) continue;

    b.cooldown[i] = B_ATTACK_TICKS[kind];
    const raw = B_DAMAGE[kind];
    
    
    
    eventsOut.push({
      type: 'shot',
      tick: w.tick,
      owner,
      attacker: -1,
      building: b.id[i],
      x: b.x[i], y: b.y[i],
      tx: u.x[bestSlot], ty: u.y[bestSlot],
      weapon: myClass,
      projectile: PROJECTILE_CLASSES.has(myClass),
      areaMm: B_AREA[kind],
      members: 1,
    });
    if (B_AREA[kind] > 0) {
      applyArea(w, -1, owner, u.x[bestSlot], u.y[bestSlot], B_AREA[kind], myClass, raw, eventsOut);
    } else {
      const dealt = damageAfterArmour(
        raw, myClass, U_ARM_CLASS[u.kind[bestSlot]], U_ARMOUR[u.kind[bestSlot]],
      );
      queueDamage(w, bestSlot, dealt);
      if (w._pendingBy[bestSlot] < 0) w._pendingBy[bestSlot] = owner;
    }
  }
}













export function stepPoundWagons(w, eventsOut = []) {
  const u = w.u;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    const spec = unitSpec(w, i);
    if (!spec.capturesPacks) continue;

    
    
    if (u.state[i] === STATE.LOADING) {
      const victim = findById(w, u.orderArg[i]);
      if (victim < 0 || !inLoadRange(w, i, victim)) {
        u.state[i] = STATE.IDLE;
        u.progress[i] = 0;
        u.orderArg[i] = -1;
        continue;
      }
      u.progress[i] += 1;
      if (u.progress[i] < spec.captureTicks) continue;

      const victimSpec = unitSpec(w, victim);
      eventsOut.push({
        type: 'stockRecovered',
        by: u.owner[i],
        owner: u.owner[victim],
        unit: victimSpec.id,
        refund: victimSpec.cost,
        refundPct: spec.captureRefundPct,
      });
      
      
      
      w.u.alive[victim] = 0;
      w.u.members[victim] = 0;
      w.u.owner[victim] = -1;
      w.u.state[victim] = STATE.DEAD;
      u.state[i] = STATE.IDLE;
      u.progress[i] = 0;
      u.orderArg[i] = -1;
      continue;
    }

    
    let bestSlot = -1;
    let bestD2 = 0;
    let bestId = 0;
    for (let j = 0; j < u.count; j += 1) {
      if (!u.alive[j] || u.owner[j] === u.owner[i] || u.owner[j] < 0) continue;
      if (packPct(w, j) >= spec.capturesBelowPct) continue;
      const d2 = dist2(u.x[i], u.y[i], u.x[j], u.y[j]);
      if (d2 > LEASH_MM * LEASH_MM) continue;
      if (bestSlot < 0 || d2 < bestD2 || (d2 === bestD2 && u.id[j] < bestId)) {
        bestSlot = j; bestD2 = d2; bestId = u.id[j];
      }
    }
    if (bestSlot < 0) continue;

    if (inLoadRange(w, i, bestSlot)) {
      u.state[i] = STATE.LOADING;
      u.progress[i] = 0;
      u.orderArg[i] = u.id[bestSlot];
    } else if (u.state[i] === STATE.IDLE) {
      u.orderX[i] = u.x[bestSlot];
      u.orderY[i] = u.y[bestSlot];
      u.state[i] = STATE.MOVING;
    }
  }
  return eventsOut;
}


const LOAD_RANGE_MM = 18000;
const inLoadRange = (w, wagon, victim) => w.u.alive[victim]
  && dist2(w.u.x[wagon], w.u.y[wagon], w.u.x[victim], w.u.y[victim]) <= LOAD_RANGE_MM * LOAD_RANGE_MM;

function findById(w, id) {
  if (id < 0) return -1;
  const u = w.u;
  for (let i = 0; i < u.count; i += 1) if (u.alive[i] && u.id[i] === id) return i;
  return -1;
}
