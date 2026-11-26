
















export const CAR_R = 1.55 / 12; 
export const PAD_RESPAWN = 0.8; 
const PAD_R = 0.08; 
const LAUNCH = 0.3; 
const GRACE = 1.2; 

export const PICKUPS = Object.freeze({
  battery: Object.freeze({
    id: 'battery', name: 'Battery Boost', kind: 'self',
    
    boost: Object.freeze({ time: 3, power: 1.3, name: 'battery' }),
  }),
  balloon: Object.freeze({
    id: 'balloon', name: 'Water Balloon', kind: 'throw',
    
    speed: 4, flight: 0.5, radius: 0.35, grip: 0.5, life: 6,
  }),
  marble: Object.freeze({
    id: 'marble', name: 'Bouncy Marble', kind: 'roll',
    
    speed: 6, radius: 0.03, life: 5,
  }),
  gum: Object.freeze({
    id: 'gum', name: 'Sticky Gum', kind: 'drop',
    
    back: 0.35, radius: 0.1, slow: 1, life: 40,
  }),
  
  rocket: Object.freeze({
    id: 'rocket', name: 'Rocket Bottle', kind: 'self',
    
    
    boost: Object.freeze({ time: 1.2, power: 1.7, name: 'rocket' }), ram: 1.2,
  }),
  band: Object.freeze({
    id: 'band', name: 'Rubber Band', kind: 'shot',
    
    
    
    
    speed: 10, life: 0.9, radius: 0.05, home: 1.5, keep: 0.3, slow: 0.6,
  }),
  magnet: Object.freeze({
    id: 'magnet', name: 'Magnet', kind: 'tow',
    
    
    time: 3, near: 0.2, reach: 3, boost: Object.freeze({ time: 0.2, power: 1.35, name: 'magnet' }),
  }),
  fan: Object.freeze({
    id: 'fan', name: 'Desk Fan', kind: 'drop',
    
    
    
    
    back: 0.35, zone: 0.3, push: 4, life: 8,
  }),
});

const RAM_R = 2 * CAR_R; 

export const PICKUP_IDS = Object.freeze(Object.keys(PICKUPS));





export const TABLE = Object.freeze([
  Object.freeze({ upTo: 0.001, weights: Object.freeze({ gum: 30, fan: 25, balloon: 25, marble: 12, band: 5, battery: 3 }) }),
  Object.freeze({ upTo: 0.34, weights: Object.freeze({ gum: 18, fan: 16, balloon: 18, marble: 16, band: 14, battery: 12, magnet: 5, rocket: 1 }) }),
  Object.freeze({ upTo: 0.67, weights: Object.freeze({ gum: 8, fan: 7, balloon: 13, marble: 17, band: 18, battery: 17, magnet: 12, rocket: 8 }) }),
  Object.freeze({ upTo: 1, weights: Object.freeze({ gum: 3, fan: 2, balloon: 7, marble: 13, band: 15, battery: 22, magnet: 17, rocket: 21 }) }),
]);


export function drawPickup(position, fieldSize, rng) {
  const frac = position <= 1 || fieldSize <= 1 ? 0 : (position - 1) / (fieldSize - 1);
  const row = TABLE.find((r) => frac <= r.upTo) ?? TABLE[TABLE.length - 1];
  const entries = Object.entries(row.weights);
  let roll = rng() * entries.reduce((n, [, w]) => n + w, 0);
  for (const [id, w] of entries) {
    roll -= w;
    if (roll <= 0) return id;
  }
  return entries[entries.length - 1][0];
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wrap = (s, L) => ((s % L) + L) % L;

const dS = (a, b, L) => { const d = wrap(b - a, L); return d > L / 2 ? d - L : d; };





export function createPickups(pads, { seed = 1 } = {}) {
  return {
    
    
    pads: pads.map((p, i) => ({ i, s: p.s, side: p.side ?? 0, half: p.half ?? CAR_R + PAD_R, ready: true, wait: 0 })),
    held: new Map(),
    hazards: [],
    botWait: new Map(),
    heldFor: new Map(), 
    active: [], 
    rng: mulberry32(seed),
    queue: { events: [], effects: [] },
  };
}










export const AIM_NEAR = 0.5;
export const AIM_FAR = 3;
export function padAim(st, c, length) {
  if (st.held.has(c.id)) return null;
  let rowS = null;
  let best = Infinity;
  for (const p of st.pads) {
    const d = dS(c.s, p.s, length);
    if (d >= AIM_NEAR && d <= AIM_FAR && d < best) { best = d; rowS = p.s; }
  }
  if (rowS == null) return null;
  const row = st.pads.filter((p) => Math.abs(dS(rowS, p.s, length)) < 0.05);
  if (row.some((p) => p.ready && Math.abs(c.side - p.side) <= p.half)) return null; 
  let aim = null;
  for (const p of row) {
    if (!p.ready) continue;
    if (!aim || Math.abs(c.side - p.side) < Math.abs(c.side - aim.side)) aim = p;
  }
  return aim ? { s: aim.s, side: aim.side } : null;
}

export function usePickup(st, c, { length }) {
  const id = st.held.get(c.id);
  if (!id) return null;
  st.held.delete(c.id);
  st.botWait.delete(c.id);
  st.heldFor?.delete(c.id);
  const P = PICKUPS[id];
  st.queue.events.push({ type: 'use', id: c.id, pickup: id });
  st.active ??= [];
  if (P.kind === 'self') {
    st.queue.effects.push({ carId: c.id, effect: 'boost', ...P.boost });
    if (P.ram) st.active.push({ id, owner: c.id, t: P.ram, hit: new Set() });
  } else if (P.kind === 'tow') {
    st.active.push({ id, owner: c.id, t: P.time });
  } else if (P.kind === 'drop') {
    
    const h = { id, s: wrap(c.s - P.back, length), side: c.side, owner: c.id, grace: GRACE, age: 0 };
    if (id === 'fan') h.dir = c.side >= 0 ? -1 : 1;
    st.hazards.push(h);
  } else {
    st.hazards.push({ id, s: wrap(c.s + LAUNCH, length), side: c.side, owner: c.id, grace: GRACE, age: 0,
      landed: false });
  }
  return P;
}


export function gripAt(st, s, side, length) {
  let g = 1;
  for (const h of st.hazards) {
    if (h.id !== 'balloon' || !h.landed) continue;
    if (Math.hypot(dS(h.s, s, length), side - h.side) <= PICKUPS.balloon.radius) g = Math.min(g, PICKUPS.balloon.grip);
  }
  return g;
}





export function stepPickups(st, cars, dt, ctx) {
  const { length, fieldSize } = ctx;
  const events = [];
  const effects = [];
  
  for (const p of st.pads) {
    if (!p.ready) {
      p.wait -= dt;
      if (p.wait <= 0) p.ready = true;
      continue;
    }
    for (const c of cars) {
      if (st.held.has(c.id)) continue;
      if (Math.abs(dS(p.s, c.s, length)) > CAR_R + PAD_R || Math.abs(c.side - p.side) > p.half) continue;
      const id = drawPickup(c.position ?? fieldSize, fieldSize, st.rng);
      st.held.set(c.id, id);
      p.ready = false;
      p.wait = PAD_RESPAWN;
      events.push({ type: 'pickup', id: c.id, pickup: id, pad: p.i });
      break;
    }
  }
  
  
  st.heldFor ??= new Map();
  for (const c of cars) {
    if (!c.bot || !st.held.has(c.id)) continue;
    if (ctx.botUse) {
      const t = st.heldFor.get(c.id) ?? 0;
      if (ctx.botUse(c, st.held.get(c.id), t)) usePickup(st, c, ctx);
      else st.heldFor.set(c.id, t + dt);
      continue;
    }
    if (!st.botWait.has(c.id)) st.botWait.set(c.id, 0.6 + st.rng() * 3);
    const w = st.botWait.get(c.id) - dt;
    st.botWait.set(c.id, w);
    if (w <= 0) usePickup(st, c, ctx);
  }
  
  const keep = [];
  for (const h of st.hazards) {
    const P = PICKUPS[h.id];
    h.age += dt;
    h.grace = Math.max(0, h.grace - dt);
    if (h.id === 'marble') h.s = wrap(h.s + P.speed * dt, length);
    if (h.id === 'balloon' && !h.landed) {
      h.s = wrap(h.s + P.speed * dt, length);
      if (h.age >= P.flight) {
        h.landed = true;
        h.age = 0;
        events.push({ type: 'splash', s: h.s, side: h.side, owner: h.owner });
      }
      keep.push(h);
      continue;
    }
    if (h.age > P.life) continue;
    let gone = false;
    if (h.id === 'band') {
      
      let mark = null;
      let markD = Infinity;
      for (const c of cars) {
        if (c.id === h.owner) continue;
        const d = dS(h.s, c.s, length);
        if (d >= -CAR_R && d < markD) { markD = d; mark = c; }
      }
      if (mark) {
        const step = P.home * dt;
        h.side += Math.max(-step, Math.min(step, mark.side - h.side));
      }
      h.s = wrap(h.s + P.speed * dt, length);
    }
    if (h.id === 'fan') {
      for (const c of cars) {
        if (c.id === h.owner && h.grace > 0) continue;
        if (Math.abs(dS(h.s, c.s, length)) > P.zone) continue;
        effects.push({ carId: c.id, effect: 'push', dir: h.dir ?? 1, dv: P.push * dt, from: h.owner });
      }
    }
    if (h.id === 'band') {
      for (const c of cars) {
        if (c.id === h.owner && h.grace > 0) continue;
        if (Math.hypot(dS(h.s, c.s, length), c.side - h.side) > CAR_R + P.radius) continue;
        effects.push({ carId: c.id, effect: 'snap', keep: P.keep, time: P.slow, from: h.owner });
        events.push({ type: 'pickupHit', id: c.id, pickup: h.id, from: h.owner });
        gone = true;
        break;
      }
    }
    if (h.id === 'marble' || h.id === 'gum') {
      for (const c of cars) {
        if (c.id === h.owner && h.grace > 0) continue;
        if (Math.hypot(dS(h.s, c.s, length), c.side - h.side) > CAR_R + P.radius) continue;
        if (h.id === 'marble') effects.push({ carId: c.id, effect: 'bounce', from: h.owner });
        else effects.push({ carId: c.id, effect: 'slow', time: P.slow, from: h.owner });
        events.push({ type: 'pickupHit', id: c.id, pickup: h.id, from: h.owner });
        gone = true;
        break;
      }
    }
    if (!gone) keep.push(h);
  }
  st.hazards = keep;
  
  st.active = (st.active ?? []).filter((a) => {
    a.t -= dt;
    const me = cars.find((c) => c.id === a.owner);
    if (me && a.id === 'rocket') {
      for (const c of cars) {
        if (c.id === a.owner || a.hit.has(c.id)) continue;
        if (Math.hypot(dS(me.s, c.s, length), c.side - me.side) > RAM_R) continue;
        a.hit.add(c.id);
        effects.push({ carId: c.id, effect: 'bounce', from: a.owner });
        events.push({ type: 'pickupHit', id: c.id, pickup: 'rocket', from: a.owner });
      }
    } else if (me && a.id === 'magnet') {
      const M = PICKUPS.magnet;
      if (cars.some((c) => { const d = dS(me.s, c.s, length); return c.id !== a.owner && d >= M.near && d <= M.reach; })) {
        effects.push({ carId: a.owner, effect: 'boost', ...M.boost });
      }
    }
    return a.t > 0;
  });
  events.push(...st.queue.events);
  effects.push(...st.queue.effects);
  st.queue = { events: [], effects: [] };
  return { events, effects };
}
