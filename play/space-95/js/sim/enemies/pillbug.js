



import { contact, defeat, hurtPlayer, poundHit, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { groundAhead, moveBody, registerKind } from '../entities.js';

const ROLL_SPEED = 3;
const ROLL_TIME = 3; 
const UNCURL_TIME = 1.2; 





const TUMBLE_TIME = 0.3; 
const TUMBLE_REST = 0.3; 
const TUMBLE_STEP = 1.5; 
const TUMBLE_NEAR = 8; 

function stepTopiary(e, ctx) {
  const p = ctx.player;
  e.vx = 0;
  if (e.state === 'roll' || e.state === 'uncurl') {
    e.state = 'rest';
    e.t = 0;
  }
  if (e.state === 'rest') {
    const near = Math.abs(p.x - e.x) <= TUMBLE_NEAR && Math.abs(p.y - e.y) <= 3;
    if (near && e.t >= TUMBLE_REST) {
      const dir = Math.sign(p.x - e.x) || e.facing;
      e.facing = dir;
      if (groundAhead({ ...e, x: e.x + dir * (TUMBLE_STEP - e.w / 2) }, ctx.world, dir)) {
        e.state = 'tumble';
        e.t = 0;
        e.rolled = 0;
      }
    }
  }
  if (e.state === 'tumble') {
    
    const d = Math.min(TUMBLE_STEP - e.rolled, (TUMBLE_STEP / TUMBLE_TIME) * STEP);
    e.rolled += d;
    e.vx = (e.facing * d) / STEP;
  }
  moveBody(e, ctx.world);
  e.vx = 0;
  if (e.state === 'tumble' && e.rolled >= TUMBLE_STEP - 1e-9) {
    e.state = 'rest';
    e.t = 0;
    ctx.events.push({ type: 'tumbleClunk', id: e.id, x: e.x, y: e.y, signals: ['audio:tumble-clunk'] });
  }
  const c = contact(p, e);
  if (!c) return;
  if (e.state === 'tumble') {
    if (c === 'stomp') {
      stompBounce(p);
      ctx.events.push({ type: 'boing', id: e.id });
    } else hurtPlayer(ctx.session, e.x);
  } else if (c === 'stomp') {
    stompBounce(p);
    defeat(e, ctx, 'stomp');
  }
}

registerKind('pillbug', {
  sleeps: true,
  create(e) {
    e.w = 0.8;
    e.h = 0.6;
    e.state = e.topiary ? 'rest' : 'roll';
    e.t = e.phase ?? 0;
    if (e.topiary) e.h = 0.8; 
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    if (poundHit(e, ctx)) return; 
    if (e.topiary) return stepTopiary(e, ctx);
    if (e.state === 'roll') {
      e.vx = e.facing * ROLL_SPEED;
      const hit = moveBody(e, ctx.world);
      if (hit.wall || (e.grounded && !groundAhead(e, ctx.world, e.facing))) e.facing = -e.facing;
      if (e.t >= ROLL_TIME) {
        e.state = 'uncurl';
        e.t = 0;
        ctx.events.push({ type: 'uncurl', id: e.id });
      }
      const c = contact(ctx.player, e);
      if (c === 'stomp') stompBounce(ctx.player);
      else if (c === 'touch') hurtPlayer(ctx.session, e.x);
      return;
    }
    
    e.vx = 0;
    moveBody(e, ctx.world);
    if (e.t >= UNCURL_TIME) {
      e.state = 'roll';
      e.t = 0;
    }
    const p = ctx.player;
    const c = contact(p, e);
    if (c === 'stomp') {
      stompBounce(p);
      defeat(e, ctx, 'stomp');
    } else if (c === 'touch' && p.grounded && Math.abs(p.vx) > 1 && Math.sign(e.x - p.x) === Math.sign(p.vx)) {
      e.facing = Math.sign(p.vx);
      defeat(e, ctx, 'kick');
      ctx.events.push({ type: 'kick', id: e.id });
    }
  },
});
