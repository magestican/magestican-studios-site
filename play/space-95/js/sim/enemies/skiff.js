











import { standardContact, stepDefeated } from '../combat.js';
import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';
import { clampToWater } from './strider.js';

const ROW = 4; 
const RAM = 2; 
const ROW_WINDUP = 0.5; 
const RAM_WINDUP = 0.8; 

registerKind('skiff', {
  create(e) {
    e.w ??= 3;
    e.h = e.galleon ? 3 : 1;
    e.floats = true;
    if (e.galleon) e.stompProof = true;
    if (e.wakeWhen) e.dozing = true;
    e.state = 'moored';
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    if (e.state === 'capsizing' || e.toy || e.empty) return;
    const p = ctx.player;
    if (e.state === 'moored') {
      const rows = e.wakeWhen && !e.anchored;
      const rams = e.ramWithin !== undefined && Math.abs(p.x - e.x) <= e.ramWithin;
      if (rows || rams) {
        e.state = 'windup';
        e.t = 0;
        e.attack = rams ? 'ram' : 'row';
        const signals = rams ? ['visual:prow-glow', 'audio:hull-creak'] : ['visual:oar-flash', 'audio:heave-ho'];
        ctx.events.push({ type: 'skiffWindup', id: e.id, attack: e.attack, x: e.x, y: e.y, signals });
      }
    } else if (e.state === 'windup') {
      if (e.t >= (e.attack === 'ram' ? RAM_WINDUP : ROW_WINDUP) - 1e-9) {
        e.state = e.attack;
        e.t = 0;
      }
    } else {
      e.facing = Math.sign(p.x - e.x) || e.facing;
      e.vx = e.facing * (e.state === 'ram' ? RAM : ROW);
      e.x += e.vx * STEP;
      clampToWater(e, ctx.session.level);
    }
    standardContact(e, ctx);
  },
});
