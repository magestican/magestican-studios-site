




import { defeat } from './combat.js';
import { STEP } from './constants.js';
import { ENTITY_GRAVITY, moveBody, overlaps, registerKind } from './entities.js';

const KICK_SPEED = 14; 
const KICK_ANGLE = (12 * Math.PI) / 180; 
export const AIM_NUDGE = (15 * Math.PI) / 180;
const AIM_RANGE = 12; 
const ROLL_FRICTION = 2.5; 
const PEBBLE_GRAVITY = 0.3; 
const HIT_SPEED = 2; 






export function aimAngle(from, dir, enemies) {
  let best = null;
  for (const e of enemies) {
    const dx = (e.x - from.x) * dir;
    if (dx <= 0.3 || dx > AIM_RANGE) continue;
    if (!best || dx < best.dx) best = { dx, dy: e.y + e.h / 2 - from.y };
  }
  if (!best) return KICK_ANGLE;
  const v = KICK_SPEED;
  const g = ENTITY_GRAVITY * PEBBLE_GRAVITY;
  const disc = v ** 4 - g * (g * best.dx ** 2 + 2 * best.dy * v ** 2);
  if (disc < 0) return KICK_ANGLE;
  const needed = Math.atan((v * v - Math.sqrt(disc)) / (g * best.dx)); 
  return KICK_ANGLE + Math.max(-AIM_NUDGE, Math.min(AIM_NUDGE, needed - KICK_ANGLE));
}

const isEnemy = (e) => e.alive && (e.kind === 'pillbug' || e.kind === 'ladybot') && e.state !== 'dazed' && e.state !== 'scurry';

registerKind('pebble', {
  create(e) {
    e.w = 0.3;
    e.h = 0.3;
    e.state = 'rest';
  },
  step(e, ctx) {
    const p = ctx.player;
    if (e.state === 'rest') {
      moveBody(e, ctx.world);
      const toward = Math.sign(e.x - p.x) === Math.sign(p.vx);
      if (p.grounded && toward && Math.abs(p.vx) > 1 && overlaps(e, p, 0.05)) {
        const dir = Math.sign(p.vx);
        const enemies = ctx.session.entities.filter(isEnemy);
        const a = aimAngle(e, dir, enemies);
        e.vx = dir * KICK_SPEED * Math.cos(a);
        e.vy = KICK_SPEED * Math.sin(a);
        e.state = 'roll';
        e.t = 0;
        ctx.events.push({ type: 'kick', id: e.id, angle: a });
      }
      return;
    }
    e.vy += ENTITY_GRAVITY * (1 - PEBBLE_GRAVITY) * STEP; 
    const hit = moveBody(e, ctx.world);
    if (hit.wall) e.vx = -e.vx * 0.5;
    if (e.grounded) {
      const dv = ROLL_FRICTION * STEP;
      e.vx = Math.abs(e.vx) <= dv ? 0 : e.vx - Math.sign(e.vx) * dv;
    }
    if (Math.hypot(e.vx, e.vy) >= HIT_SPEED) {
      for (const en of ctx.session.entities) {
        if (!isEnemy(en) || !overlaps(e, en)) continue;
        en.facing = Math.sign(e.vx) || 1;
        defeat(en, ctx, 'pebble');
        ctx.events.push({ type: 'pebbleHit', id: e.id, target: en.id });
        e.vx = -e.vx * 0.3;
        e.vy = 3;
        break;
      }
    }
    if (e.grounded && Math.abs(e.vx) < 0.4) {
      e.vx = 0;
      e.state = 'rest';
    }
    if (e.y < -5) e.alive = false;
  },
});
