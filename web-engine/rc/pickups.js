
















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
});

export const PICKUP_IDS = Object.freeze(Object.keys(PICKUPS));


export const TABLE = Object.freeze([
  Object.freeze({ upTo: 0.001, weights: Object.freeze({ gum: 45, balloon: 35, marble: 15, battery: 5 }) }),
  Object.freeze({ upTo: 0.34, weights: Object.freeze({ gum: 30, balloon: 30, marble: 25, battery: 15 }) }),
  Object.freeze({ upTo: 0.67, weights: Object.freeze({ gum: 15, balloon: 25, marble: 30, battery: 30 }) }),
  Object.freeze({ upTo: 1, weights: Object.freeze({ gum: 5, balloon: 15, marble: 30, battery: 50 }) }),
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
    rng: mulberry32(seed),
    queue: { events: [], effects: [] },
  };
}


export function usePickup(st, c, { length }) {
  const id = st.held.get(c.id);
  if (!id) return null;
  st.held.delete(c.id);
  st.botWait.delete(c.id);
  const P = PICKUPS[id];
  st.queue.events.push({ type: 'use', id: c.id, pickup: id });
  if (P.kind === 'self') st.queue.effects.push({ carId: c.id, effect: 'boost', ...P.boost });
  else if (P.kind === 'drop') {
    st.hazards.push({ id, s: wrap(c.s - P.back, length), side: c.side, owner: c.id, grace: GRACE, age: 0 });
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
  
  for (const c of cars) {
    if (!c.bot || !st.held.has(c.id)) continue;
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
  events.push(...st.queue.events);
  effects.push(...st.queue.effects);
  st.queue = { events: [], effects: [] };
  return { events, effects };
}
