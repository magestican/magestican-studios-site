






import { contact, defeat, hurtPlayer, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';

const POP_NEAR = 3; 
const OUT_T = 0.8; 
const HIDE_T = 1.5; 

registerKind('dustmite', {
  create(e) {
    e.w = 0.7;
    e.h = 0.6;
    e.state = 'hidden';
    e.hidden = true;
    e.hideT = 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    const p = ctx.player;
    if (e.state === 'hidden') {
      e.hideT -= STEP;
      if (e.hideT <= 0 && p.grounded && Math.abs(p.x - e.x) <= POP_NEAR && Math.abs(p.y - e.y) <= POP_NEAR) {
        e.state = 'out';
        e.hidden = false;
        e.t = 0;
        ctx.events.push({ type: 'dustmitePop', id: e.id, x: e.x, y: e.y, signals: ['visual:crumb-puff', 'audio:static-crackle'] });
      }
      return;
    }
    if (e.t >= OUT_T) {
      e.state = 'hidden';
      e.hidden = true;
      e.hideT = HIDE_T;
      ctx.events.push({ type: 'dustmiteHide', id: e.id, x: e.x, y: e.y });
      return;
    }
    const c = contact(p, e);
    if (c === 'stomp') {
      stompBounce(p);
      e.hidden = false;
      defeat(e, ctx, 'stomp');
    } else if (c === 'touch' && hurtPlayer(ctx.session, e.x)) ctx.events.push({ type: 'dustmiteJab', id: e.id, x: e.x, y: e.y });
  },
});
