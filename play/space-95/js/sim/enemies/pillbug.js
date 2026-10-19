



import { contact, defeat, hurtPlayer, stepDefeated, stompBounce } from '../combat.js';
import { groundAhead, moveBody, registerKind } from '../entities.js';

const ROLL_SPEED = 3;
const ROLL_TIME = 3; 
const UNCURL_TIME = 1.2; 

registerKind('pillbug', {
  create(e) {
    e.w = 0.8;
    e.h = 0.6;
    e.state = 'roll';
    e.t = e.phase ?? 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
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
