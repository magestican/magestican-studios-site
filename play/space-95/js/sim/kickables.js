




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
const REKICK_SPEED = 4; 
const PLOW_SPEED = 6; 
const STRIKE_HITS = 3; 






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
    const toward = Math.sign(e.x - p.x) === Math.sign(p.vx);
    
    const rekick =
      e.state === 'roll' && Math.abs(e.vx) < REKICK_SPEED && (Math.sign(e.vx) !== Math.sign(p.vx) || Math.abs(e.vx) < Math.abs(p.vx));
    if (e.state === 'rest' || rekick) {
      if (e.state === 'rest') moveBody(e, ctx.world);
      if (p.grounded && toward && Math.abs(p.vx) > 1 && overlaps(e, p, 0.05)) {
        const dir = Math.sign(p.vx);
        const enemies = ctx.session.entities.filter(isEnemy);
        const a = aimAngle(e, dir, enemies);
        e.vx = dir * KICK_SPEED * Math.cos(a);
        e.vy = KICK_SPEED * Math.sin(a);
        e.state = 'roll';
        e.t = 0;
        ctx.events.push({ type: 'kick', id: e.id, angle: a, rekick });
        return;
      }
      if (e.state === 'rest') return;
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
        e.hits = (e.hits ?? 0) + 1;
        ctx.events.push({ type: 'pebbleHit', id: e.id, target: en.id, hits: e.hits, x: en.x, y: en.y });
        if (e.hits === STRIKE_HITS) ctx.events.push({ type: 'strike', id: e.id, x: en.x, y: en.y });
        
        
        if (Math.abs(e.vx) > PLOW_SPEED) {
          e.vx *= 0.75;
          e.vy = 1.5;
        } else {
          e.vx = -e.vx * 0.3;
          e.vy = 3;
        }
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
