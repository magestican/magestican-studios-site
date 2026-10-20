













import { contact, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { registerBossType } from './boss.js';

const CHARGE = 11; 
const SWOOP = 14; 
const REACH = 2.5; 
const SOVEREIGN = Object.freeze({ FALLBACK: 12, WINDOW: 2.5 });

registerBossType('sovereign', {
  create(e) {
    e.post = { x: e.x, y: e.y };
    e.sinceHit = 0;
  },
  attack(e, ctx, atk, stage) {
    const p = ctx.player;
    e.harmless = atk.kind === 'hover' || stage === 'telegraph';
    
    e.sinceHit += STEP;
    if (e.sinceHit >= SOVEREIGN.FALLBACK && stage !== 'recover') {
      e.sinceHit = 0;
      e.interrupt = { recoverFor: SOVEREIGN.WINDOW, weakNow: true };
      ctx.events.push({ type: 'sovereignOpen', id: e.id, seconds: SOVEREIGN.WINDOW });
      return;
    }
    if (atk.kind === 'charge') {
      if (stage === 'telegraph') e.dir = p.x < e.x ? -1 : 1;
      if (stage === 'active') e.x += (e.dir ?? 1) * CHARGE * STEP;
    } else if (atk.kind === 'swoop') {
      if (stage === 'telegraph' && !e.lock) e.lock = { x: p.x, y: p.y };
      if (stage === 'active' && e.lock) {
        const dx = e.lock.x - e.x;
        const dy = e.lock.y - e.y;
        const d = Math.hypot(dx, dy);
        const step = SWOOP * STEP;
        if (d <= step) {
          e.x = e.lock.x;
          e.y = e.lock.y;
          e.endActive = true;
        } else {
          e.x += (dx / d) * step;
          e.y += (dy / d) * step;
        }
      }
      if (stage === 'recover') {
        e.lock = null;
        e.y += (e.post.y - e.y) * Math.min(1, 3 * STEP); 
      }
    }
  },
  hit(e, ctx) {
    const ph = e.phases[e.phase];
    if (e.stage === 'intro') {
      e.sinceHit = 0;
      e.lock = null;
    }
    const cbs = ph.callbacks ?? [];
    const near = (ev) => ev.boss === e.id || (ev.x !== undefined && Math.hypot(ev.x - e.x, ev.y - (e.y + e.h / 2)) <= REACH);
    const cb = ctx.events.find((ev) => cbs.includes(ev.type) && near(ev));
    if (cb) {
      e.sinceHit = 0;
      return 'callback';
    }
    const weakWindow = e.stage === 'recover' && e.weakNow !== false;
    if (contact(ctx.player, e) === 'stomp') {
      stompBounce(ctx.player);
      if (weakWindow) {
        e.sinceHit = 0;
        return 'stomp';
      }
      ctx.events.push({ type: 'parry', id: e.id }); 
    }
    return null;
  },
});
