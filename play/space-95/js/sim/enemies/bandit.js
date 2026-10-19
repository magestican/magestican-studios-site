





import { contact, defeat, hurtPlayer, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { ENTITY_GRAVITY, moveBody, registerKind } from '../entities.js';
import { stepRailFoe } from '../train.js';

const IDLE_T = 0.6;
const WINDUP_T = 0.4;
const CROUCH_T = 0.8;
const HOP_LEN = 6; 
const HOP_AIR = 1.0; 
const HOP_G = (8 * 3) / (HOP_AIR * HOP_AIR); 


function groundAt(world, x, y) {
  const T = world.tile;
  const r = Math.round(y / T) - 1;
  const c = Math.floor(x / T);
  return world.solid(c, r) || world.oneWay(c, r) || !!world.floorAt?.({ x, y, w: 0.4, h: 1 });
}

registerKind('bandit', {
  sleeps: true,
  create(e) {
    e.w = 0.8;
    e.h = 1.2;
    e.stage = 'idle';
    e.st = 0;
  },
  step(e, ctx) {
    if (ctx.session?.train) return stepRailFoe(e, ctx); 
    if (stepDefeated(e)) return;
    const p = ctx.player;
    e.st += STEP;
    const airborne = e.stage === 'hop';
    if (e.stage === 'idle' && e.st >= IDLE_T) {
      e.facing = Math.sign(p.x - e.x) || e.facing;
      if (groundAt(ctx.world, e.x + e.facing * HOP_LEN, e.y)) {
        e.stage = 'windup';
        e.st = 0;
        ctx.events.push({ type: 'telegraph', id: e.id, attack: 'kick', seconds: WINDUP_T, x: e.x, y: e.y });
      } else e.st = 0; 
    } else if (e.stage === 'windup' && e.st >= WINDUP_T) {
      e.stage = 'hop';
      e.st = 0;
      e.vx = (e.facing * HOP_LEN) / HOP_AIR;
      e.vy = (HOP_G * HOP_AIR) / 2;
      e.grounded = false;
      ctx.events.push({ type: 'hop', id: e.id });
    }
    if (e.stage === 'hop') {
      e.vy += (ENTITY_GRAVITY - HOP_G) * STEP; 
      const hit = moveBody(e, ctx.world);
      if (hit.wall) e.vx = 0;
      if (e.grounded) {
        e.stage = 'crouch';
        e.st = 0;
        e.vx = 0;
      }
    } else {
      e.vx = 0;
      moveBody(e, ctx.world);
      if (e.stage === 'crouch' && e.st >= CROUCH_T) {
        e.stage = 'idle';
        e.st = 0;
      }
    }
    const c = contact(p, e);
    if (c === 'stomp') {
      stompBounce(p);
      defeat(e, ctx, 'stomp');
    } else if (c === 'touch' && airborne) hurtPlayer(ctx.session, e.x);
  },
});
