



import { standardContact, stepDefeated } from '../combat.js';
import { STEP } from '../constants.js';
import { ENTITY_GRAVITY, moveBody, registerKind } from '../entities.js';

const HOP_HEIGHT = 2.5; 
const HOP_EVERY = 1.2; 
const hopV = (h) => Math.sqrt(2 * ENTITY_GRAVITY * h);

registerKind('aphid', {
  sleeps: true,
  create(e) {
    e.w = 0.45;
    e.h = 0.45;
    e.state = 'hop';
    e.hopT = e.phase ?? 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    e.hopT += STEP;
    e.vx = 0;
    
    if (e.grounded && e.hopT >= (e.period ?? HOP_EVERY)) {
      e.hopT = 0;
      e.vy = hopV(e.hop ?? HOP_HEIGHT);
    }
    moveBody(e, ctx.world);
    standardContact(e, ctx);
  },
});
