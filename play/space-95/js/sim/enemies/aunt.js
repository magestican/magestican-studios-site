

















import { contact, hurtPlayer, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { moveBody, overlaps, registerKind } from '../entities.js';

export const AUNT = Object.freeze({
  W: 1.0,
  H: 0.9,
  TELE: 0.6, 
  DROP_V: 14, 
  DROP_REACH: 12, 
  SWAY: 1, 
  SWAY_HZ: 0.8,
  SNARE_EVERY: 2.4, 
  SNARE_FIRST: 1.2, 
  SNARE_RANGE: 8, 
  SNARE_V: 6, 
  SNARE_G: 20, 
  SHORT: 2, 
  PATCH_W: 1.5,
  PATCH_T: 3, 
  SNARED: 0.8, 
  FREE_T: 0.4, 
  FREE_PRESSES: 3,
  LOWER: 1, 
  FALL_T: 0.8, 
  CLIMB: 4, 
  CLIMB_R: 8,
  CLIMB_T: 3,
  CLIMB_V: 8,
});


export function lineOf(e) {
  if (e.kind !== 'aunt' || !['drop', 'dangle', 'hang'].includes(e.mode)) return null;
  return { x0: e.ax, y0: e.ay, x1: e.x, y1: e.y + e.h };
}


export function cutAunt(e, s, by) {
  if (e.mode === 'cut') return;
  e.mode = 'cut';
  e.ct = 0;
  e.vy = 0;
  s.events.push({ type: 'lineCut', id: e.id, by, x: e.x, y: e.y + e.h, use: e.use ?? null });
}

registerKind('aunt', {
  create(e) {
    e.w = AUNT.W;
    e.h = AUNT.H;
    e.ax = e.x;
    e.ay = e.y;
    e.throws = 0;
    e.snareT = AUNT.SNARE_EVERY - AUNT.SNARE_FIRST;
    e.swayT = 0;
    if (e.sitting) e.mode = 'sit';
    else if (e.plucks) e.mode = 'pluck';
    else if (e.drop) {
      e.mode = 'hidden';
      e.y = e.ay - e.h;
    } else {
      e.mode = 'hang';
      e.y = (e.hang ?? e.ay - 2) - e.h;
    }
    e.restY = e.y;
  },
  step(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    if (e.mode === 'cut') {
      e.ct += STEP;
      e.vy -= 30 * STEP;
      e.y += e.vy * STEP;
      if (e.ct >= AUNT.FALL_T - 1e-9) {
        e.alive = false;
        ctx.events.push({ type: 'defeat', id: e.id, kind: e.kind, how: 'cut', x: e.x, y: e.y });
      }
      return;
    }
    if (e.mode === 'hidden') {
      const d = e.drop;
      if (Math.abs(p.x - e.x) <= d.trigger && p.y <= e.ay && p.y >= d.to - AUNT.DROP_REACH) {
        e.mode = 'tele';
        e.mt = 0;
        ctx.events.push({
          type: 'auntTelegraph',
          id: e.id,
          x: e.x,
          y: d.to,
          seconds: AUNT.TELE,
          signals: ['visual:pink-dot', 'audio:zzzip'],
        });
      }
      return;
    }
    if (e.mode === 'tele') {
      e.mt += STEP;
      if (e.mt >= AUNT.TELE - 1e-9) e.mode = 'drop';
      return;
    }
    if (e.mode === 'drop') {
      const top = Math.max(e.drop.to, e.y + e.h - AUNT.DROP_V * STEP);
      e.y = top - e.h;
      if (top <= e.drop.to + 1e-9) {
        e.mode = 'dangle';
        e.restY = e.y;
        ctx.events.push({ type: 'auntDrop', id: e.id, x: e.x, y: e.y });
      }
    } else if (e.mode === 'dangle' || e.mode === 'hang') {
      e.swayT += STEP;
      e.x = e.ax + AUNT.SWAY * Math.sin(2 * Math.PI * AUNT.SWAY_HZ * e.swayT);
      e.y = e.restY - (e.lowered ? AUNT.LOWER : 0);
    } else if (e.mode === 'sit') {
      e.vx = 0;
      moveBody(e, ctx.world); 
    }
    
    if ((e.mode === 'dangle' || e.mode === 'hang' || e.mode === 'sit') && !e.family) {
      e.snareT += STEP;
      if (e.snareT >= AUNT.SNARE_EVERY - 1e-9 && Math.hypot(p.x - e.x, p.y - e.y) <= AUNT.SNARE_RANGE && !(p.snared > 0)) {
        e.snareT = 0;
        throwSnare(e, s, p);
      }
    }
    
    const dashing = p.ab?.dashT > 0;
    const L = lineOf(e);
    if (dashing && (overlaps(p, e) || (L && crossesBox(p, L)))) {
      cutAunt(e, s, 'dash');
      return;
    }
    const c = contact(p, e);
    if (c === 'stomp') {
      stompBounce(p);
      ctx.events.push({ type: 'auntBounce', id: e.id, x: e.x, y: e.y });
    } else if (c === 'touch' && !e.family && e.mode !== 'drop') hurtPlayer(s, e.x);
  },
});


export function crossesBox(b, L) {
  const lo = Math.max(Math.min(L.y0, L.y1), b.y);
  const hi = Math.min(Math.max(L.y0, L.y1), b.y + b.h);
  if (lo > hi) return false;
  const k = L.y1 === L.y0 ? 0 : ((lo + hi) / 2 - L.y0) / (L.y1 - L.y0);
  return Math.abs(L.x0 + (L.x1 - L.x0) * k - b.x) < b.w / 2 + 0.05;
}

function throwSnare(e, s, p) {
  e.throws += 1;
  const short = e.demo && e.throws === 1 ? AUNT.SHORT : 0;
  const dir = Math.sign(p.x - e.x) || 1;
  const tx = p.x - dir * short;
  const ty = p.y;
  const x0 = e.x;
  const y0 = e.y + e.h / 2;
  const T = Math.max(0.35, Math.abs(tx - x0) / AUNT.SNARE_V);
  const vy = (ty - y0) / T + 0.5 * AUNT.SNARE_G * T;
  s.snares ??= [];
  s.snares.push({ id: `${e.id}-snare-${e.throws}`, by: e.id, x: x0, y: y0, vx: (tx - x0) / T, vy, ty, t: 0, state: 'fly' });
  s.events.push({ type: 'snareThrow', id: e.id, x: x0, y: y0, tx, ty, short: short > 0 });
}


export function stepSnares(s) {
  if (!s.snares?.length) return;
  const p = s.player;
  for (const b of s.snares) {
    b.t += STEP;
    if (b.state === 'fly') {
      b.vy -= AUNT.SNARE_G * STEP;
      b.x += b.vx * STEP;
      b.y += b.vy * STEP;
      if (Math.abs(b.x - p.x) < 0.45 && b.y >= p.y && b.y <= p.y + p.h && !(p.snared > 0)) {
        b.state = 'gone';
        snareJo(s, b.by, 'blob');
      } else if (b.vy < 0 && b.y <= b.ty) {
        b.state = 'patch';
        b.y = b.ty;
        b.t = 0;
        s.events.push({ type: 'snarePatch', id: b.id, x: b.x, y: b.y });
      } else if (b.t > 3) b.state = 'gone';
    } else if (b.state === 'patch') {
      if (b.t >= AUNT.PATCH_T - 1e-9) b.state = 'gone';
      else if (!b.used && p.grounded && Math.abs(p.x - b.x) < AUNT.PATCH_W / 2 + p.w / 2 && Math.abs(p.y - b.y) < 0.35 && !(p.snared > 0)) {
        b.used = true;
        snareJo(s, b.by, 'patch');
      }
    }
  }
  s.snares = s.snares.filter((b) => b.state !== 'gone');
}

function snareJo(s, by, how) {
  const p = s.player;
  p.snared = AUNT.SNARED;
  p.snaredT = 0;
  p.snarePresses = 0;
  const a = s.entities.find((e) => e.id === by);
  if (a && (a.mode === 'dangle' || a.mode === 'hang')) a.lowered = true; 
  s.events.push({ type: 'snare', by, how, x: p.x, y: p.y });
}





export function snareStep(p, held) {
  const pressed = held.jump && !p.snarePrev;
  p.snarePrev = held.jump;
  if (pressed) p.snarePresses = (p.snarePresses ?? 0) + 1;
  p.snaredT = (p.snaredT ?? 0) + STEP;
  p.snared -= STEP;
  if (p.snarePresses >= AUNT.FREE_PRESSES && p.snaredT >= AUNT.FREE_T - 1e-9) p.snared = 0;
  if (p.snared <= 0) {
    p.snared = 0;
    p.events.push({ type: 'snareFree', x: p.x, y: p.y });
  }
  return true;
}

registerKind('goldAunt', {
  create(e) {
    e.w = AUNT.W;
    e.h = AUNT.H;
    e.homeX = e.x;
    e.homeY = e.y;
    e.climbT = 0;
  },
  step(e, ctx) {
    const p = ctx.player;
    
    if (p.grounded && Math.hypot(p.x - e.homeX, p.y - e.homeY) <= AUNT.CLIMB_R) {
      if (e.climbT <= 0) ctx.events.push({ type: 'goldClimb', id: e.id, x: e.x, y: e.y, first: !e.climbed });
      e.climbed = true;
      e.climbT = AUNT.CLIMB_T;
    } else if (e.climbT > 0) e.climbT -= STEP;
    const target = e.climbT > 0 ? e.homeY + AUNT.CLIMB : e.homeY;
    const dy = target - e.y;
    e.y += Math.sign(dy) * Math.min(Math.abs(dy), AUNT.CLIMB_V * STEP);
    e.x = e.homeX;
  },
});
