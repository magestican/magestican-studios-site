















import { defeat } from './combat.js';
import { STEP } from './constants.js';
import { flip, stepFlipped, stepRing } from './rings.js';
import { waterAt } from './water.js';

const BIG_RING_SPEED = 22; 
const SMALL = { radius: 10, speed: 14 };
const BIG = { radius: 16, speed: 18 };
const SLAP = { radius: 6, speed: 14 };
const GALLEON_SLAP = { radius: 10, speed: 14 };
const ROLL_TIME = 0.35; 
const SKIN = 1; 


export function createRipple(level) {
  return level.water?.length ? { rings: [], rung: 0, ladders: {} } : null;
}


function span(world, w, x) {
  const T = world.tile;
  const r = Math.floor((w.y - T / 2) / T); 
  let lo = Math.floor(x / T);
  while (lo * T > w.x0 && !world.solid(lo - 1, r)) lo--;
  let hi = Math.floor(x / T);
  while ((hi + 1) * T < w.x1 && !world.solid(hi + 1, r)) hi++;
  return [Math.max(w.x0, lo * T), Math.min(w.x1, (hi + 1) * T)];
}

function ring(s, x, size, { big, origin, from }) {
  const R = s.ripple;
  const w = waterAt(s.level, x);
  if (!w) return null;
  R.rung += 1;
  const [lo, hi] = span(s.world, w, x);
  const g = {
    id: `ripple-${R.rung}`,
    x,
    y: w.y,
    r: 0,
    radius: size.radius,
    speed: size.speed,
    big,
    lo,
    hi,
    hit: [],
    origin: origin ?? R.rung,
  };
  R.rings.push(g);
  s.events.push({ type: 'ripple', x, y: w.y, big, radius: size.radius, from, ring: g.id });
  return g;
}

const floating = (e) => e.floats && (e.kind === 'skiff' || e.kind === 'strider');


export function stepRipple(s) {
  const R = s.ripple;
  if (!R) return;
  const ctx = { world: s.world, session: s, player: s.player, events: s.events };
  for (const ev of s.player.events) {
    if (ev.type !== 'raftLand' || !ev.floats) continue;
    const big = ev.speed >= BIG_RING_SPEED - 1e-9;
    ring(s, ev.x, big ? BIG : SMALL, { big, from: 'land' });
  }
  
  for (const e of s.entities) {
    if (!e.alive || e.rollT === undefined || e.rollT === null) continue;
    e.rollT -= STEP;
    if (e.rollT > 1e-9) continue;
    e.rollT = null;
    const n = (R.ladders[e.rollOrigin] ?? 0) + 1;
    R.ladders[e.rollOrigin] = n;
    defeat(e, ctx, 'capsize');
    s.events.push({ type: 'capsize', id: e.id, kind: e.kind, use: e.use ?? null, n, x: e.x, y: e.y, galleon: !!e.galleon, toy: !!e.toy });
    ring(s, e.x, e.galleon ? GALLEON_SLAP : SLAP, { big: false, origin: e.rollOrigin, from: 'slap' });
  }
  const W = s.level.water;
  for (const g of [...R.rings]) {
    const done = stepRing(
      g,
      s.entities,
      (e) => floating(e) && W.some((w) => Math.abs(e.y - w.y) <= SKIN),
      (e) => hit(s, e, g),
    );
    if (done) R.rings.splice(R.rings.indexOf(g), 1);
  }
  if (!s.shoe) stepFlipped(s, ctx); 
}

function hit(s, e, g) {
  if (e.state === 'dazed' || e.state === 'scurry' || (e.rollT !== undefined && e.rollT !== null)) return;
  const needsBig = e.kind === 'skiff' ? !!e.big : !!e.commodore;
  if (needsBig && !g.big) {
    s.events.push({ type: e.kind === 'skiff' ? 'rock' : 'surf', id: e.id, kind: e.kind, x: e.x, y: e.y, ring: g.id });
    return;
  }
  if (e.kind === 'skiff') {
    e.rollT = ROLL_TIME;
    e.dozing = false; 
    e.awake = true;
    e.rollOrigin = g.origin;
    e.state = 'capsizing';
    e.vx = 0;
    s.events.push({ type: 'capsizeStart', id: e.id, x: e.x, y: e.y });
    return;
  }
  
  flip(s, e, { id: `ripple-${g.origin}`, use: e.use ?? null });
}
