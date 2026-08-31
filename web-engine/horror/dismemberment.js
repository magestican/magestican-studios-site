



























































import { closestApproach } from '../combat/hitZones.js';


















export const TORSO_RESISTANCE = 0.15;










export const DRAG_SPEED = 0.45;























const chicken = {
  id: 'chicken',
  
  height: 1.14,          
  torsoIntegrity: 120,
  limbs: [
    { id: 'leg-l', group: 'legs', integrity: 18, x: -0.10, y: 0.12, z: 0, r: 0.09 },
    { id: 'leg-r', group: 'legs', integrity: 18, x: 0.10, y: 0.12, z: 0, r: 0.09 },
    { id: 'wing-l', group: 'wings', integrity: 14, x: -0.30, y: 0.55, z: 0, r: 0.10 },
    { id: 'wing-r', group: 'wings', integrity: 14, x: 0.30, y: 0.55, z: 0, r: 0.10 },
    { id: 'head', group: 'head', integrity: 22, x: 0, y: 0.87, z: 0.06, r: 0.12 },
  ],
  torso: { x: 0, y: 0.48, z: 0, r: 0.26 },
  
  
  lethalSets: [['leg-l', 'leg-r']],
};

const porker = {
  id: 'porker',
  
  height: 1.72,
  torsoIntegrity: 260,
  limbs: [
    { id: 'leg-l', group: 'legs', integrity: 40, x: -0.11, y: 0.20, z: 0, r: 0.12 },
    { id: 'leg-r', group: 'legs', integrity: 40, x: 0.11, y: 0.20, z: 0, r: 0.12 },
    { id: 'arm-l', group: 'arms', integrity: 30, x: -0.29, y: 0.66, z: 0, r: 0.10 },
    { id: 'arm-r', group: 'arms', integrity: 30, x: 0.29, y: 0.66, z: 0, r: 0.10 },
    { id: 'head', group: 'head', integrity: 34, x: 0, y: 0.91, z: 0.05, r: 0.11 },
  ],
  torso: { x: 0, y: 0.53, z: 0, r: 0.24 },
  lethalSets: [['leg-l', 'leg-r']],
};

const cow = {
  id: 'cow',
  
  
  
  height: 2.05,
  torsoIntegrity: 340,
  limbs: [
    { id: 'leg-l', group: 'legs', integrity: 55, x: -0.13, y: 0.22, z: 0, r: 0.13 },
    { id: 'leg-r', group: 'legs', integrity: 55, x: 0.13, y: 0.22, z: 0, r: 0.13 },
    { id: 'tentacle-l', group: 'tentacles', integrity: 26, x: -0.24, y: 0.46, z: 0.16, r: 0.10 },
    { id: 'tentacle-r', group: 'tentacles', integrity: 26, x: 0.24, y: 0.46, z: 0.16, r: 0.10 },
    { id: 'head', group: 'head', integrity: 44, x: 0, y: 0.92, z: 0.07, r: 0.12 },
  ],
  torso: { x: 0, y: 0.60, z: 0, r: 0.25 },
  lethalSets: [['leg-l', 'leg-r']],
};

export const BESTIARY = Object.freeze({ chicken, porker, cow });



export const MOBILITY_GROUPS = Object.freeze(['legs']);
export const GRAPPLE_GROUPS = Object.freeze(['arms', 'tentacles']);
export const SENSE_GROUPS = Object.freeze(['head']);





export function spawn(speciesId, opts = {}) {
  const spec = BESTIARY[speciesId];
  if (!spec) throw new Error(`unknown species: ${speciesId}`);
  const limbs = {};
  for (const l of spec.limbs) {
    limbs[l.id] = { id: l.id, group: l.group, integrity: l.integrity, max: l.integrity, severed: false };
  }
  return {
    species: speciesId,
    
    
    
    scale: Number.isFinite(opts.scale) && opts.scale > 0 ? opts.scale : 1,
    pos: { x: opts.x ?? 0, y: opts.y ?? 0, z: opts.z ?? 0 },
    limbs,
    torso: { integrity: spec.torsoIntegrity, max: spec.torsoIntegrity },
    alive: true,
    
    
    causeOfDeath: null,
  };
}

export function heightOf(creature) {
  return BESTIARY[creature.species].height * creature.scale;
}



function zoneWorld(creature, zone) {
  const h = heightOf(creature);
  return {
    x: creature.pos.x + zone.x * h,
    y: creature.pos.y + zone.y * h,
    z: creature.pos.z + zone.z * h,
    r: zone.r * h,
  };
}







export function zonesOf(creature) {
  const spec = BESTIARY[creature.species];
  const out = [];
  for (const l of spec.limbs) {
    if (creature.limbs[l.id].severed) continue;
    out.push({ id: l.id, group: l.group, kind: 'limb', ...zoneWorld(creature, l) });
  }
  out.push({ id: 'torso', group: 'torso', kind: 'torso', ...zoneWorld(creature, spec.torso) });
  return out;
}










export function resolveHit(creature, from, to) {
  if (!creature.alive) return null;
  let best = null;
  for (const z of zonesOf(creature)) {
    const { distance, t } = closestApproach(from, to, z);
    if (distance > z.r) continue;
    if (!best || t < best.t) best = { zone: z, t, distance };
  }
  if (!best) return null;
  return { id: best.zone.id, group: best.zone.group, kind: best.zone.kind, t: best.t, distance: best.distance };
}



function severedGroups(creature) {
  const groups = new Set();
  for (const l of Object.values(creature.limbs)) if (l.severed) groups.add(l.group);
  return groups;
}

function checkLethal(creature) {
  const spec = BESTIARY[creature.species];
  for (const set of spec.lethalSets) {
    if (set.every((id) => creature.limbs[id].severed)) return set;
  }
  return null;
}











export function applyDamage(creature, zoneId, amount, opts = {}) {
  const event = {
    zoneId, damage: 0, severed: false, killed: false, group: null, blocked: false,
  };
  if (!creature.alive) { event.blocked = true; return event; }
  const dmg = Number.isFinite(amount) && amount > 0 ? amount : 0;

  if (zoneId === 'torso') {
    const applied = dmg * TORSO_RESISTANCE;
    creature.torso.integrity = Math.max(0, creature.torso.integrity - applied);
    event.group = 'torso';
    event.damage = applied;
    if (creature.torso.integrity <= 0) {
      creature.alive = false;
      creature.causeOfDeath = 'torso';
      event.killed = true;
    }
    return event;
  }

  const limb = creature.limbs[zoneId];
  if (!limb) { event.blocked = true; return event; }
  if (limb.severed) { event.blocked = true; return event; }

  event.group = limb.group;
  
  
  const sever = Number.isFinite(opts.severBonus) && opts.severBonus > 0 ? opts.severBonus : 1;
  const applied = dmg * sever;
  event.damage = Math.min(applied, limb.integrity);
  limb.integrity = Math.max(0, limb.integrity - applied);

  if (limb.integrity <= 0) {
    limb.severed = true;
    event.severed = true;
    const fatal = checkLethal(creature);
    if (fatal) {
      creature.alive = false;
      creature.causeOfDeath = 'limbs';
      event.killed = true;
    }
  }
  return event;
}











export function mobilityOf(creature) {
  const spec = BESTIARY[creature.species];
  const legs = spec.limbs.filter((l) => l.group === 'legs');
  const lost = legs.filter((l) => creature.limbs[l.id].severed).length;
  if (!creature.alive) return { speed: 0, gait: 'dead', legsLost: lost };
  if (lost === 0) return { speed: 1, gait: 'run', legsLost: 0 };
  if (lost >= legs.length) return { speed: 0, gait: 'dead', legsLost: lost };
  return { speed: DRAG_SPEED, gait: 'drag', legsLost: lost };
}







export function canGrapple(creature) {
  if (!creature.alive) return false;
  const spec = BESTIARY[creature.species];
  const grappleLimbs = spec.limbs.filter((l) => GRAPPLE_GROUPS.includes(l.group));
  if (!grappleLimbs.length) return true;     
  return grappleLimbs.some((l) => !creature.limbs[l.id].severed);
}








export function canSense(creature) {
  if (!creature.alive) return false;
  const spec = BESTIARY[creature.species];
  const heads = spec.limbs.filter((l) => SENSE_GROUPS.includes(l.group));
  if (!heads.length) return true;
  return heads.some((l) => !creature.limbs[l.id].severed);
}



export function statusOf(creature) {
  return {
    alive: creature.alive,
    causeOfDeath: creature.causeOfDeath,
    ...mobilityOf(creature),
    canGrapple: canGrapple(creature),
    canSense: canSense(creature),
    severed: [...severedGroups(creature)],
    severedLimbs: Object.values(creature.limbs).filter((l) => l.severed).map((l) => l.id),
    torsoFraction: creature.torso.integrity / creature.torso.max,
  };
}




export function shoot(creature, from, to, weapon) {
  const hit = resolveHit(creature, from, to);
  if (!hit) return { hit: false, event: null, status: statusOf(creature) };
  const dmg = hit.kind === 'torso' ? weapon.torsoDamage : weapon.limbDamage;
  const event = applyDamage(creature, hit.id, dmg, { severBonus: weapon.severBonus });
  return { hit: true, zone: hit, event, status: statusOf(creature) };
}
