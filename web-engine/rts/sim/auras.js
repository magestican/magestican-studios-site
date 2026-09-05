























import { dist2 } from '../fixed.js';
import { UNITS, BUILDINGS, HERD } from '../roster.js';
import { UNIT_KINDS, BUILDING_KINDS, unitSpec } from './world.js';
import { wallBetween } from './movement.js';

const AURA_SPEED = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].auraSpeedPct || 0));
const AURA_DAMAGE = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].auraDamagePct || 0));
const AURA_RADIUS = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].auraRadiusMm || 0));


export function createAuraBuffers(capacity) {
  return {
    speedPct: new Int32Array(capacity),
    damagePct: new Int32Array(capacity),
  };
}









export function measureAuras(w, buf) {
  buf.speedPct.fill(0);
  buf.damagePct.fill(0);
  const u = w.u;

  for (let src = 0; src < u.count; src += 1) {
    if (!u.alive[src] || u.owner[src] < 0) continue;
    const kind = u.kind[src];
    const speed = AURA_SPEED[kind];
    const damage = AURA_DAMAGE[kind];
    if (speed === 0 && damage === 0) continue;
    const radius = AURA_RADIUS[kind];
    if (radius <= 0) continue;
    const r2 = radius * radius;
    const owner = u.owner[src];
    const severable = w.seats[owner] && w.seats[owner].faction === HERD;

    for (let j = 0; j < u.count; j += 1) {
      if (!u.alive[j] || u.owner[j] !== owner) continue;
      if (j === src) continue;
      if (dist2(u.x[src], u.y[src], u.x[j], u.y[j]) > r2) continue;
      
      
      if (severable && wallBetween(w, u.x[src], u.y[src], u.x[j], u.y[j]) >= 0) continue;
      if (speed > buf.speedPct[j]) buf.speedPct[j] = speed;
      if (damage > buf.damagePct[j]) buf.damagePct[j] = damage;
    }
  }

  
  
  
}









export function stepHealing(w) {
  const u = w.u;
  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i] || u.owner[i] < 0) continue;
    const spec = unitSpec(w, i);
    if (!spec.healPerPulse) continue;
    if (w.tick % spec.healPulseTicks !== 0) continue;
    const r2 = spec.healRadiusMm * spec.healRadiusMm;
    for (let j = 0; j < u.count; j += 1) {
      if (!u.alive[j] || u.owner[j] !== u.owner[i] || j === i) continue;
      if (dist2(u.x[i], u.y[i], u.x[j], u.y[j]) > r2) continue;
      healUnit(w, j, spec.healPerPulse);
    }
  }

  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i] || b.building[i] > 0 || b.owner[i] < 0) continue;
    const spec = BUILDING_HEAL[b.kind[i]];
    if (!spec) continue;
    if (w.tick % spec.pulse !== 0) continue;
    const r2 = spec.radius * spec.radius;
    for (let j = 0; j < u.count; j += 1) {
      if (!u.alive[j] || u.owner[j] !== b.owner[i]) continue;
      if (dist2(b.x[i], b.y[i], u.x[j], u.y[j]) > r2) continue;
      healUnit(w, j, spec.amount);
    }
  }
}

function healUnit(w, slot, amount) {
  const spec = unitSpec(w, slot);
  const max = spec.hp;
  if (w.u.hp[slot] >= max) return;
  w.u.hp[slot] = Math.min(max, w.u.hp[slot] + amount);
}


const BUILDING_HEAL = BUILDING_KINDS.map((k) => {
  const b = BUILDINGS[k];
  if (!b.healPerPulse) return null;
  return { amount: b.healPerPulse, pulse: b.healPulseTicks, radius: b.healRadiusMm };
});
