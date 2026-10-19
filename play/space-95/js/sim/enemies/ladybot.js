


import { standardContact, stepDefeated } from '../combat.js';
import { STEP } from '../constants.js';
import { groundAhead, moveBody, registerKind } from '../entities.js';

const WALK_SPEED = 1.5;
const HOP_EVERY = 2.0; 
const HOP_SPEED = 4.5; 

registerKind('ladybot', {
  sleeps: true,
  create(e) {
    e.w = 0.6;
    e.h = 0.8;
    e.state = 'walk';
    e.hopT = e.phase ?? 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    e.vx = e.facing * WALK_SPEED;
    e.hopT += STEP;
    if (e.grounded && e.hopT >= HOP_EVERY) {
      e.hopT = 0;
      e.vy = HOP_SPEED;
      ctx.events.push({ type: 'hop', id: e.id });
    }
    const hit = moveBody(e, ctx.world);
    if (hit.wall || (e.grounded && !groundAhead(e, ctx.world, e.facing))) e.facing = -e.facing;
    standardContact(e, ctx);
  },
});
