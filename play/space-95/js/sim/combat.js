



import { JUMP_VELOCITY, STEP } from './constants.js';
import { overlaps } from './entities.js';

const HITSTOP_ENEMY = 0.06;

export const INVULN_TIME = 1.2;
const STOMP_BOUNCE = 0.62; 
const KNOCKBACK = { vx: 6, vy: 6 };
const DAZE_TIME = 0.5;
const SCURRY_TIME = 0.9;





export function contact(p, e) {
  if (!overlaps(p, e)) return null;
  const falling = p.vy < 0 || p.py > p.y;
  if (falling && p.py >= e.y + e.h * 0.45) return 'stomp';
  return 'touch';
}


export function stompBounce(p) {
  p.vy = JUMP_VELOCITY * STOMP_BOUNCE;
  p.grounded = false;
  p.jumpedThisAir = true;
  p.rising = true;
  p.jumpTime = 0;
  p.cut = false;
  p.events.push({ type: 'stomp' });
}


export function hurtPlayer(s, fromX) {
  if (s.invuln > 0 || s.dead > 0) return false;
  const p = s.player;
  s.hearts -= 1;
  s.invuln = INVULN_TIME;
  s.hitstop = HITSTOP_ENEMY;
  const dir = p.x < fromX ? -1 : 1;
  p.vx = dir * KNOCKBACK.vx;
  p.vy = KNOCKBACK.vy;
  p.grounded = false;
  p.rising = false;
  s.events.push({ type: 'hurt', hearts: s.hearts });
  if (s.hearts <= 0) s.events.push({ type: 'down' });
  return true;
}


export function defeat(e, ctx, how) {
  if (e.state === 'dazed' || e.state === 'scurry') return;
  e.state = 'dazed';
  e.t = 0;
  e.vx = 0;
  ctx.session.hitstop = Math.max(ctx.session.hitstop, HITSTOP_ENEMY);
  ctx.events.push({ type: 'defeat', id: e.id, kind: e.kind, how, x: e.x, y: e.y });
  if (e.specimen) ctx.events.push({ type: 'secret', secret: 'specimen', id: e.id });
}


export function stepDefeated(e) {
  if (e.state === 'dazed') {
    if (e.t >= DAZE_TIME) {
      e.state = 'scurry';
      e.t = 0;
    }
    return true;
  }
  if (e.state === 'scurry') {
    e.x += e.facing * 7 * STEP;
    e.y += 1.5 * STEP;
    if (e.t >= SCURRY_TIME) e.alive = false;
    return true;
  }
  return false;
}


export function standardContact(e, ctx, { stompable = true } = {}) {
  const c = contact(ctx.player, e);
  if (!c) return;
  if (c === 'stomp' && stompable) {
    stompBounce(ctx.player);
    defeat(e, ctx, 'stomp');
  } else if (c === 'stomp') {
    stompBounce(ctx.player);
  } else {
    hurtPlayer(ctx.session, e.x);
  }
}
