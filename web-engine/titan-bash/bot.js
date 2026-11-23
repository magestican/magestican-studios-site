




import { TUNING as T, HZ } from './tuning.js';
import { TITANS, WEAPONS } from './titans.js';
import { makeRng, nextRandom } from './rng.js';
import { bounty } from './sim.js';
import { ARENAS, onFloor } from './arenas.js';
import { inSweep, sleeperAwake } from './sleeper.js';
import { ABILITIES } from './abilities.js';


export const LUMEN_SEEK_RIVAL = 12;


function coverNear(A, x, y) {
  for (const c of A.circles) if (Math.hypot(x - c.x, y - c.y) < c.r + T.radius) return true;
  for (const b of A.boxes) if (Math.abs(x - b.x) < b.w / 2 + T.radius && Math.abs(y - b.y) < b.h / 2 + T.radius) return true;
  return false;
}

export const BOT_LEVELS = Object.freeze({
  cadet: { dashGap: 150, think: 27, heatCap: 60, ventPerfect: 0,    dashChance: 0.15, aimJitter: 0.35, abilityChance: 0.2 },
  pilot: { dashGap: 100, think: 17, heatCap: 85, ventPerfect: 0.25, dashChance: 0.3,  aimJitter: 0.18, abilityChance: 0.5 },
  ace:   { dashGap: 70, think: 10, heatCap: 97, ventPerfect: 0.6,  dashChance: 0.45, aimJitter: 0.08, abilityChance: 0.9 },
});

const LUNGE_M = ABILITIES.bladeLunge.distance;
const KEEP_AT = { lancer: 11, bulwark: 8, wisp: 11, mortar: 13 };

export function createBot(id, level = 'pilot', seed = 1) {
  return { id, level: BOT_LEVELS[level] ? level : 'pilot', rng: makeRng((seed * 7919 + id * 104729) | 0),
    next: 0, plan: { mx: 0, my: 0, fire: false, boost: false, ability: false }, ventAt: -1, lastDash: -1e9, side: id % 2 ? 1 : -1 };
}


export function botInput(bot, m) {
  const p = thinkInput(bot, m);
  const A = ARENAS[m.arena];
  const me = m.titans[bot.id];
  return A.floor && me && me.alive ? keepOnStone(A, m, me, p) : p;
}


function seaAlong(A, x, y, ux, uy, max) {
  for (let s = 0.5; s <= max; s += 0.5) if (!onFloor(A, x + ux * s, y + uy * s)) return s;
  return max;
}




function keepOnStone(A, m, me, plan) {
  const p = { ...plan };
  const near = 5;
  for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const e = seaAlong(A, me.x, me.y, ux, uy, near);
    if (e < near) { p.mx -= ux * (near - e) / 1.5; p.my -= uy * (near - e) / 1.5; }
  }
  const tide = m.tide;
  if (tide && tide.warn > 0) {
    const f = A.floor[tide.bridge];
    if (Math.abs(me.x - f.x) <= f.w / 2 && Math.abs(me.y - f.y) <= f.h / 2) {
      const safeY = f.y - A.tide.knockY * (f.h / 2 - 0.6); 
      p.my = Math.max(-1, Math.min(1, (safeY - me.y) * 1.5));
    }
  }
  const l = Math.hypot(p.mx, p.my);
  if (l > 1e-6) {
    
    const ux = p.mx / l; const uy = p.my / l;
    if (!onFloor(A, me.x + ux * 2.5, me.y + uy * 2.5)) {
      if (onFloor(A, me.x + Math.sign(ux) * 2.5, me.y)) p.my = 0;
      else if (onFloor(A, me.x, me.y + Math.sign(uy) * 2.5)) p.mx = 0;
      else { p.mx = 0; p.my = 0; }
    }
  }
  
  if (me.stall === 0) {
    const ml = Math.hypot(p.mx, p.my);
    const [dx, dy] = ml > 0.2 ? [p.mx / ml, p.my / ml] : [Math.cos(me.facing), Math.sin(me.facing)];
    const lunge = p.ability && TITANS[me.frame].ability === 'bladeLunge';
    if (p.boost && seaAlong(A, me.x, me.y, dx, dy, T.dashDistance + 2) <= T.dashDistance + 1.5) p.boost = false;
    if (lunge && seaAlong(A, me.x, me.y, dx, dy, LUNGE_M + 2) <= LUNGE_M + 1.5) p.ability = false;
  }
  return p;
}

function thinkInput(bot, m) {
  const me = m.titans[bot.id];
  const L = BOT_LEVELS[bot.level];
  const r = () => nextRandom(bot.rng);
  if (!me || !me.alive) return { mx: 0, my: 0, fire: false, boost: false, ability: false };

  
  if (me.stall > 0) {
    if (bot.ventAt < 0) {
      const perfect = r() < L.ventPerfect;
      bot.ventAt = perfect ? Math.round(T.ventMarkAt * HZ) : Math.round((0.3 + r() * 1.2) * HZ);
    }
    return { mx: 0, my: 0, fire: false, boost: me.stallAge + 1 === bot.ventAt, ability: false };
  }
  bot.ventAt = -1;
  if (me.counter > 0 && me.hitstop === 0) return { ...bot.plan, fire: r() < 0.5 };

  if (m.tick < bot.next) return { ...bot.plan, boost: false, ability: false };
  bot.next = m.tick + L.think;

  const big = bounty(m);
  let target = null; let best = 1e9;
  
  for (const o of [...m.titans, ...(m.decoys || [])]) {
    if (o === me || !o.alive || o.team === me.team) continue;
    const d = Math.hypot(o.x - me.x, o.y - me.y) - (o === big ? 8 : 0);
    if (d < best) { best = d; target = o; }
  }
  const rivalD = target ? Math.hypot(target.x - me.x, target.y - me.y) : 1e9;
  const w = WEAPONS[TITANS[me.frame].weapon];

  
  const S = m.sleeper;
  if (sleeperAwake(S) && S.attack === 'telegraph' && inSweep(S, me.x, me.y)) {
    
    const rx = me.x - S.x; const ry = me.y - S.y; const rl = Math.hypot(rx, ry) || 1;
    let da = Math.atan2(ry, rx) - S.aim; da = Math.atan2(Math.sin(da), Math.cos(da));
    
    
    const dirFor = (sd) => [sd * (-ry / rl) * 0.9 + (rx / rl) * 0.3, sd * (rx / rl) * 0.9 + (ry / rl) * 0.3];
    let side = da >= 0 ? 1 : -1;
    const Ar = ARENAS[m.arena];
    const clear = (sd) => { const [ux, uy] = dirFor(sd); return !coverNear(m.cover || Ar, me.x + ux * 4, me.y + uy * 4); };
    if (Math.abs(da) < 0.25 && !clear(side) && clear(-side)) side = -side;
    const [mx, my] = dirFor(side);
    const ok = m.tick - bot.lastDash >= L.dashGap / 2 && me.heat + T.heatDash < L.heatCap;
    if (ok) bot.lastDash = m.tick;
    bot.plan = { mx, my, fire: false, boost: ok, ability: false };
    return bot.plan;
  }
  
  if (rivalD > LUMEN_SEEK_RIVAL) {
    let c = null; let cd = 1e9;
    for (const k of m.lumen || []) { const d = Math.hypot(k.x - me.x, k.y - me.y); if (d < cd) { cd = d; c = k; } }
    const coreD = sleeperAwake(S) ? Math.hypot(S.x - me.x, S.y - me.y) : 1e9;
    const shootCore = coreD < w.range && me.heat < L.heatCap;
    if (c || shootCore) {
      const [gx, gy] = c ? [c.x - me.x, c.y - me.y] : [0, 0];
      const gl = Math.hypot(gx, gy) || 1;
      const plan = { mx: c ? gx / gl : 0, my: c ? gy / gl : 0, fire: false, boost: false, ability: false };
      if (shootCore) Object.assign(plan, { fire: true, ax: (S.x - me.x) / coreD, ay: (S.y - me.y) / coreD, ad: coreD });
      else if (target && rivalD < w.range && me.heat < L.heatCap) {
        Object.assign(plan, { fire: true, ax: (target.x - me.x) / rivalD, ay: (target.y - me.y) / rivalD, ad: rivalD });
      }
      bot.plan = plan;
      return bot.plan;
    }
  }
  if (!target) { bot.plan = { mx: -me.x / 20, my: -me.y / 20, fire: false, boost: false, ability: false }; return bot.plan; }

  const dx = target.x - me.x; const dy = target.y - me.y; const d = Math.hypot(dx, dy) || 1;
  const keep = KEEP_AT[me.frame] || 12;
  const toward = d > keep ? 1 : d < keep * 0.6 ? -1 : 0;
  
  let mx = (dx / d) * toward + (-dy / d) * 0.6 * bot.side;
  let my = (dy / d) * toward + (dx / d) * 0.6 * bot.side;
  mx -= me.x / 40; my -= me.y / 25;
  
  
  const A = ARENAS[m.arena];
  if (A.openEdges) {
    const ex = A.w / 2 - Math.abs(me.x); const ey = A.h / 2 - Math.abs(me.y);
    if (ex < 6) mx -= Math.sign(me.x) * (6 - ex) / 2;
    if (ey < 6) my -= Math.sign(me.y) * (6 - ey) / 2;
  }
  if (r() < 0.08) bot.side *= -1;

  const jit = (r() - 0.5) * L.aimJitter * 2;
  const aimA = Math.atan2(dy, dx) + jit;
  const fire = d < w.range && me.heat < L.heatCap;
  
  
  const boost = d < 8 && m.tick - bot.lastDash >= L.dashGap && me.heat + T.heatDash < L.heatCap && r() < L.dashChance;
  if (boost) { mx = dx / d; my = dy / d; bot.lastDash = m.tick; }
  
  const kind = TITANS[me.frame].ability;
  let ability = false;
  if (me.abilityCd === 0 && !boost && r() < L.abilityChance) {
    if (kind === 'bladeLunge') ability = d > 5 && d < 14;
    else if (kind === 'aegis') ability = m.tick - me.lastHitAt < 30 && d < 22;
    else if (kind === 'afterimage') ability = d < 7 && me.armour < me.maxArmour * 0.6;
    else if (kind === 'seedBarrage') ability = d > 8 && d < 24;
  }
  if (ability && kind === 'bladeLunge') { mx = dx / d; my = dy / d; }
  if (ability && kind === 'afterimage') { mx = -dx / d; my = -dy / d; }
  bot.plan = { mx, my, fire, boost, ability, ax: Math.cos(aimA), ay: Math.sin(aimA), ad: d };
  return bot.plan;
}
