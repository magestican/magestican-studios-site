












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
export const DROP_TIME = 0.6; 
const DROP_HEIGHT = 3; 
export const FRUIT_REST_LIFE = 8; 
const SLOPE_ACCEL = 18; 






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
const catcher = (e) => e.alive && e.catch;

const catchTarget = (e) => ({ x: (e.catch.x0 + e.catch.x1) / 2, y: e.catch.y0, h: e.catch.y1 - e.catch.y0 });
const inCatch = (f, c) => f.x + f.w / 2 > c.x0 && f.x - f.w / 2 < c.x1 && f.y + f.h > c.y0 && f.y < c.y1;


function fruitPre(e, ctx) {
  if (e.state === 'drop') {
    e.dropT += STEP;
    const u = Math.min(1, e.dropT / DROP_TIME);
    e.y = e.landY + DROP_HEIGHT * (1 - u * u);
    if (!e.bonked && overlaps(e, ctx.player)) {
      e.bonked = true; 
      ctx.events.push({ type: 'fruitletBonk', id: e.id, x: e.x, y: e.y });
    }
    if (u >= 1) {
      e.y = e.landY;
      e.state = 'rest';
      e.restT = 0;
      ctx.events.push({ type: 'fruitletLand', id: e.id, x: e.x, y: e.y });
    }
    return true;
  }
  if (e.dropped && e.state === 'rest') {
    e.restT = (e.restT ?? 0) + STEP;
    if (e.restT >= FRUIT_REST_LIFE) {
      e.alive = false;
      ctx.events.push({ type: 'fruitletPuff', id: e.id, x: e.x, y: e.y });
      return true;
    }
  }
  return false;
}


function slopeRoll(e, world) {
  e.onSlope = false;
  if (!world.floorAt || !e.grounded) return;
  const f = world.floorAt(e); 
  if (!f || Math.abs(f.y - e.y) > 0.02) return;
  const a = world.floorAt({ x: e.x - 0.25, y: e.y, w: 0.02, h: e.h });
  const b = world.floorAt({ x: e.x + 0.25, y: e.y, w: 0.02, h: e.h });
  if (!a || !b) return;
  const slope = (b.y - a.y) / 0.5;
  if (Math.abs(slope) < 1e-4) return;
  e.onSlope = true;
  e.vx -= SLOPE_ACCEL * slope * STEP;
  e.state = 'roll';
}


function kickable(kind, { w, h, fruit = false }) {
  registerKind(kind, {
    create(e) {
      e.w = w;
      e.h = h;
      e.state = 'rest';
      if (fruit && e.drop) {
        e.state = 'drop';
        e.dropT = 0;
        e.landY = e.y;
        e.dropped = true;
      }
    },
    step(e, ctx) {
      if (fruit && fruitPre(e, ctx)) return;
      const p = ctx.player;
      const toward = Math.sign(e.x - p.x) === Math.sign(p.vx);
      
      const rekick =
        e.state === 'roll' && Math.abs(e.vx) < REKICK_SPEED && (Math.sign(e.vx) !== Math.sign(p.vx) || Math.abs(e.vx) < Math.abs(p.vx));
      if (e.state === 'rest' || rekick) {
        if (e.state === 'rest') moveBody(e, ctx.world);
        if (p.grounded && toward && Math.abs(p.vx) > 1 && overlaps(e, p, 0.05)) {
          const dir = Math.sign(p.vx);
          const enemies = ctx.session.entities.filter(isEnemy);
          if (fruit) for (const c of ctx.session.entities) if (catcher(c)) enemies.push(catchTarget(c));
          const a = aimAngle(e, dir, enemies);
          e.vx = dir * KICK_SPEED * Math.cos(a);
          e.vy = KICK_SPEED * Math.sin(a);
          e.state = 'roll';
          e.t = 0;
          if (fruit) e.restT = 0;
          ctx.events.push({ type: 'kick', id: e.id, angle: a, rekick, ...(fruit ? { kind } : {}) });
          return;
        }
        if (e.state === 'rest') {
          if (fruit) slopeRoll(e, ctx.world);
          if (e.state === 'rest') return;
        }
      }
      e.vy += ENTITY_GRAVITY * (1 - PEBBLE_GRAVITY) * STEP; 
      const hit = moveBody(e, ctx.world);
      if (hit.wall) e.vx = -e.vx * 0.5;
      if (e.grounded) {
        const dv = ROLL_FRICTION * STEP;
        e.vx = Math.abs(e.vx) <= dv ? 0 : e.vx - Math.sign(e.vx) * dv;
        if (fruit) slopeRoll(e, ctx.world);
      }
      if (Math.hypot(e.vx, e.vy) >= HIT_SPEED) {
        if (fruit) {
          
          const c = ctx.session.entities.find((x) => catcher(x) && inCatch(e, x.catch));
          if (c) {
            e.alive = false;
            c.caught = (c.caught ?? 0) + 1;
            c.lastCatch = { id: e.id, x: e.x, y: e.y };
            ctx.events.push({ type: 'fruitletCaught', id: e.id, by: c.id, x: e.x, y: e.y });
            return;
          }
        }
        for (const en of ctx.session.entities) {
          if (!isEnemy(en) || !overlaps(e, en)) continue;
          en.facing = Math.sign(e.vx) || 1;
          defeat(en, ctx, fruit ? kind : 'pebble');
          e.hits = (e.hits ?? 0) + 1;
          ctx.events.push({ type: fruit ? 'fruitletHit' : 'pebbleHit', id: e.id, target: en.id, hits: e.hits, x: en.x, y: en.y });
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
      if (e.grounded && Math.abs(e.vx) < 0.4 && !e.onSlope) {
        e.vx = 0;
        e.state = 'rest';
        if (fruit) e.restT = 0;
      }
      if (e.y < -5) e.alive = false;
    },
  });
}

kickable('pebble', { w: 0.3, h: 0.3 });
kickable('fruitlet', { w: 0.5, h: 0.5, fruit: true });
