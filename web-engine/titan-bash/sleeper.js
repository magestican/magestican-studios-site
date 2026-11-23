











import { TUNING as T, secs } from './tuning.js';
import { ARENAS } from './arenas.js';

export const SLEEPER_EVENT = Object.freeze({
  WARN: 'sleeperWarn', RISE: 'sleeperRise', TELEGRAPH: 'sleeperTelegraph', SWEEP: 'sleeperSweep',
  CORE: 'sleeperCore', DOWN: 'sleeperDown',
});


export function createSleeper(arena, on = true) {
  const spot = ARENAS[arena] && ARENAS[arena].sleeper;
  if (!on || !spot) return null;
  return { x: spot.x, y: spot.y, dir: spot.dir, phase: 'asleep', timer: 0, attack: 'none', aim: 0, target: null,
    hits: 0, lastHitBy: null };
}

const awake = (s) => !!s && s.phase === 'awake';
export const sleeperAwake = awake;


function pickTarget(m, s, ctx) {
  const ok = (t) => t && t.alive && t.shield === 0;
  const b = ctx.bounty(m);
  if (ok(b)) return b;
  let best = null; let bestD = 1e9;
  for (const t of m.titans) {
    if (!ok(t)) continue;
    const d = Math.hypot(t.x - s.x, t.y - s.y);
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}


export function inSweep(s, x, y) {
  const d = Math.hypot(x - s.x, y - s.y);
  if (d > T.sleeperReach + T.radius) return false;
  let da = Math.atan2(y - s.y, x - s.x) - s.aim;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  return Math.abs(da) <= (T.sleeperArc / 2) * (Math.PI / 180);
}


export function tickSleeper(m, events, ctx) {
  const s = m.sleeper;
  if (!s || s.phase === 'down') return;
  const into = m.tick - secs(T.roundTime - T.stormTime);
  if (s.phase === 'asleep') {
    if (into >= secs(T.sleeperWakeAfter)) {
      s.phase = 'warn'; s.timer = secs(T.sleeperWarn);
      events.push({ type: SLEEPER_EVENT.WARN, x: s.x, y: s.y });
    }
    return;
  }
  if (s.phase === 'warn') {
    s.timer -= 1;
    if (s.timer > 0) return;
    s.phase = 'awake'; s.attack = 'recover'; s.timer = secs(0.6);
    events.push({ type: SLEEPER_EVENT.RISE, x: s.x, y: s.y });
    return;
  }
  
  for (const t of m.titans) {
    if (!t.alive) continue;
    const [nx, ny, d] = ctx.norm(t.x - s.x, t.y - s.y);
    const min = T.sleeperCoreR + T.radius;
    if (d < min) { t.x = s.x + (d > 0 ? nx : 0) * min; t.y = s.y + (d > 0 ? ny : 1) * min; }
  }
  s.timer -= 1;
  if (s.timer > 0) return;
  if (s.attack === 'recover') {
    const target = pickTarget(m, s, ctx);
    if (!target) { s.timer = secs(0.3); return; } 
    s.attack = 'telegraph'; s.target = target.id; s.timer = secs(T.sleeperTelegraph);
    s.aim = Math.atan2(target.y - s.y, target.x - s.x); 
    events.push({ type: SLEEPER_EVENT.TELEGRAPH, target: target.id, aim: s.aim });
    return;
  }
  
  const struck = [];
  for (const t of m.titans) {
    if (!t.alive || !inSweep(s, t.x, t.y)) continue;
    const [nx, ny] = ctx.norm(t.x - s.x, t.y - s.y);
    struck.push(t.id);
    ctx.damage(m, t, T.sleeperDamage, null, nx, ny, T.sleeperKnock, 'sleeper', events);
  }
  events.push({ type: SLEEPER_EVENT.SWEEP, aim: s.aim, struck });
  s.attack = 'recover'; s.target = null; s.timer = secs(T.sleeperRecover);
}


export function reachesCore(m, x, y, pad = 0) {
  const s = m.sleeper;
  return awake(s) && Math.hypot(x - s.x, y - s.y) < T.sleeperCoreR + pad;
}


export function hitCore(m, by, events) {
  const s = m.sleeper;
  if (!awake(s)) return;
  s.hits += 1; s.lastHitBy = by;
  events.push({ type: SLEEPER_EVENT.CORE, by, hits: s.hits });
  if (s.hits < T.sleeperCoreHits) return;
  s.phase = 'down'; s.attack = 'none'; s.target = null;
  const t = by === null ? null : m.titans[by];
  if (t) t.bells += T.sleeperBell;
  events.push({ type: SLEEPER_EVENT.DOWN, by, value: t ? T.sleeperBell : 0 });
}
