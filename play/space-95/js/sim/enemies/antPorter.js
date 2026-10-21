



import { contact, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { groundAhead, moveBody, registerKind } from '../entities.js';

const WALK = 2; 
const SHOVE_TIME = 1; 
const SHOVE_V = 5; 

registerKind('antPorter', {
  sleeps: true,
  create(e) {
    e.w = 0.9;
    e.h = 0.6;
    e.state = 'march';
    e.grumpy = 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return; 
    const p = ctx.player;
    if (e.grumpy > 0) e.grumpy -= STEP;
    e.vx = e.grumpy > 0 ? 0 : e.facing * WALK;
    const hit = moveBody(e, ctx.world);
    if (hit.wall || (e.grounded && !groundAhead(e, ctx.world, e.facing))) e.facing = -e.facing;
    const c = contact(p, e);
    if (c === 'stomp') {
      stompBounce(p);
      e.grumpy = SHOVE_TIME;
      e.facing = Math.sign(p.x - e.x) || 1;
      ctx.events.push({ type: 'poke', id: e.id });
    } else if (c === 'touch' && e.grumpy > 0) {
      p.vx = Math.sign(p.x - e.x) * SHOVE_V;
      ctx.events.push({ type: 'shove', id: e.id });
    }
    e.state = e.grumpy > 0 ? 'shove' : 'march'; 
  },
});
