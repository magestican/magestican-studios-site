

















import { signedDelta, sampleAt } from './trackPath.js';






export const SPIN_TIME = 0.9;
export const SQUASH_TIME = 3.2;

export const ITEMS = Object.freeze({
  cowpat: Object.freeze({
    id: 'cowpat',
    name: 'Cowpat',
    icon: 'cowpat',
    
    
    
    kind: 'drop',
    effect: 'spin',
    radius: 1.5,
    life: Infinity,
  }),
  egg: Object.freeze({
    id: 'egg',
    name: 'Egg',
    icon: 'egg',
    
    
    
    kind: 'projectile',
    effect: 'spin',
    speed: 42,
    radius: 1.4,
    life: 6.5,
    homing: false,
  }),
  rooster: Object.freeze({
    id: 'rooster',
    name: 'Angry Rooster',
    icon: 'rooster',
    
    
    
    kind: 'projectile',
    effect: 'spin',
    speed: 48,
    radius: 1.6,
    life: 8,
    homing: true,
  }),
  feedbag: Object.freeze({
    id: 'feedbag',
    name: 'Feed Bag',
    icon: 'feedbag',
    kind: 'self',
    effect: 'boost',
    boost: Object.freeze({ time: 1.5, power: 1.30, name: 'feedbag' }),
  }),
  tripleFeedbag: Object.freeze({
    id: 'tripleFeedbag',
    name: 'Triple Feed',
    icon: 'feedbag',
    kind: 'self',
    effect: 'boost',
    uses: 3,
    boost: Object.freeze({ time: 1.5, power: 1.30, name: 'feedbag' }),
  }),
  scarecrow: Object.freeze({
    id: 'scarecrow',
    name: 'Scarecrow',
    icon: 'scarecrow',
    
    
    
    kind: 'self',
    effect: 'shield',
    duration: 12,
  }),
  haybale: Object.freeze({
    id: 'haybale',
    name: 'Hay Bale',
    icon: 'haybale',
    
    
    
    kind: 'drop',
    effect: 'bounce',
    radius: 1.9,
    life: Infinity,
  }),
  thunder: Object.freeze({
    id: 'thunder',
    name: 'Thunderstorm',
    icon: 'thunder',
    
    
    
    kind: 'field',
    effect: 'squash',
  }),
  tractor: Object.freeze({
    id: 'tractor',
    name: 'Runaway Tractor',
    icon: 'tractor',
    
    
    kind: 'self',
    effect: 'tractor',
    duration: 5.5,
    boost: Object.freeze({ time: 5.5, power: 1.52, name: 'tractor' }),
  }),
});

export const ITEM_IDS = Object.freeze(Object.keys(ITEMS));





let nextId = 1;


export function spawnDrop(item, kart, back = 2.6) {
  const bx = kart.x - Math.sin(kart.heading) * back;
  const bz = kart.z - Math.cos(kart.heading) * back;
  return {
    uid: `h${nextId++}`,
    item: item.id,
    kind: 'drop',
    x: bx, y: kart.y, z: bz,
    vx: 0, vz: 0,
    radius: item.radius,
    life: item.life,
    owner: kart.id,
    
    
    
    ownerGrace: 1.2,
    age: 0,
  };
}


export function spawnProjectile(item, kart, { backwards = false, path = null } = {}) {
  const dir = kart.heading + (backwards ? Math.PI : 0);
  const nose = backwards ? -2.4 : 2.4;
  return {
    uid: `p${nextId++}`,
    item: item.id,
    kind: 'projectile',
    x: kart.x + Math.sin(kart.heading) * nose,
    y: kart.y + 0.4,
    z: kart.z + Math.cos(kart.heading) * nose,
    heading: dir,
    speed: item.speed,
    radius: item.radius,
    life: item.life,
    owner: kart.id,
    ownerGrace: 0.45,
    homing: item.homing,
    target: null,
    pathHint: null,
    age: 0,
    backwards,
  };
}









export function stepHazard(h, ctx, dt) {
  const next = { ...h, age: h.age + dt };
  next.ownerGrace = Math.max(0, next.ownerGrace - dt);
  if (Number.isFinite(next.life)) next.life -= dt;
  if (next.kind !== 'projectile') return next;

  if (next.homing) {
    
    
    
    
    if (!next.target || !ctx.racerById(next.target)) {
      next.target = pickHomingTarget(ctx, next.owner);
    }
    const t = next.target ? ctx.racerById(next.target) : null;
    if (t) {
      const want = Math.atan2(t.x - next.x, t.z - next.z);
      let err = want - next.heading;
      while (err > Math.PI) err -= Math.PI * 2;
      while (err < -Math.PI) err += Math.PI * 2;
      const turn = 3.4 * dt;
      next.heading += Math.max(-turn, Math.min(turn, err));
    }
  } else if (ctx.path) {
    
    
    
    
    
    const surf = ctx.surfaceAt(next.x, next.z, next.pathHint);
    next.pathHint = surf.index;
    const along = sampleAt(ctx.path, surf.s + (next.backwards ? -10 : 10));
    const want = next.backwards ? along.heading + Math.PI : along.heading;
    let err = want - next.heading;
    while (err > Math.PI) err -= Math.PI * 2;
    while (err < -Math.PI) err += Math.PI * 2;
    const turn = 1.5 * dt;
    next.heading += Math.max(-turn, Math.min(turn, err));
  }

  next.x += Math.sin(next.heading) * next.speed * dt;
  next.z += Math.cos(next.heading) * next.speed * dt;
  return next;
}


export function pickHomingTarget(ctx, ownerId) {
  const me = ctx.racerById(ownerId);
  if (!me) return null;
  let best = null;
  for (const r of ctx.racers()) {
    if (r.id === ownerId || r.finished) continue;
    const d = signedDelta(ctx.path, me.s, r.s);
    if (d > 0 && (!best || d < best.d)) best = { id: r.id, d };
  }
  return best ? best.id : null;
}





export function applyEffect(kart, effect, { from = null } = {}) {
  if (kart.invuln > 0) return { kart, blocked: false, hit: false };
  if (kart.shielded > 0 && effect !== 'boost') {
    return { kart: { ...kart, shielded: 0, invuln: 0.5 }, blocked: true, hit: false };
  }
  switch (effect) {
    case 'spin':
      return {
        kart: {
          ...kart,
          spinTime: SPIN_TIME,
          invuln: SPIN_TIME + 0.5,
          drifting: 0,
          driftCharge: 0,
          boost: null,
          lastHitBy: from,
        },
        blocked: false,
        hit: true,
      };
    case 'squash':
      return {
        kart: {
          ...kart,
          squashTime: SQUASH_TIME,
          invuln: 0.4,
          drifting: 0,
          driftCharge: 0,
          boost: null,
          lastHitBy: from,
        },
        blocked: false,
        hit: true,
      };
    case 'bounce': {
      
      
      const back = 0.45;
      return {
        kart: {
          ...kart,
          vx: kart.vx * -back,
          vz: kart.vz * -back,
          invuln: 0.8,
          drifting: 0,
          driftCharge: 0,
          lastHitBy: from,
        },
        blocked: false,
        hit: true,
      };
    }
    default:
      return { kart, blocked: false, hit: false };
  }
}








export function hazardHits(h, k) {
  if (h.owner === k.id && h.ownerGrace > 0) return false;
  if (k.invuln > 0 || k.spinTime > 0) return false;
  const r = h.radius + 1.1;
  const dx = h.x - k.x;
  const dz = h.z - k.z;
  return dx * dx + dz * dz <= r * r;
}
