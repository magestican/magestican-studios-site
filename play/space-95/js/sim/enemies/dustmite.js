






import { contact, defeat, hurtPlayer, standardContact, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { groundAhead, moveBody, registerKind } from '../entities.js';

const POP_NEAR = 3; 
const OUT_T = 0.8; 
const HIDE_T = 1.5; 

registerKind('dustmite', {
  create(e) {
    if (e.crew || e.rides) return createCrew(e);
    e.w = 0.7;
    e.h = 0.6;
    e.state = 'hidden';
    e.hidden = true;
    e.hideT = 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    if (e.crew || e.rides) return stepCrew(e, ctx);
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









const CREW = Object.freeze({ WALK: 1.5, WAKE: 14, WAKE_Y: 9, JAB_NEAR: 1.5, JAB_TELE: 0.5, JAB_REACH: 1.8, JAB_COOL: 1.0 });

function createCrew(e) {
  e.w = 0.7;
  e.h = 0.9;
  e.state = 'walk';
  e.hidden = !!e.rides;
  e.jabT = -1;
  e.jabCool = 0;
}


function ridden(e, ctx) {
  const n = e.every ?? 1;
  return ctx.session.rafts?.list.find((r) => r.lane === e.rides && r.state === 'go' && ((r.k % n) + n) % n === 0) ?? null;
}

function stepCrew(e, ctx) {
  const p = ctx.player;
  if (e.rides) {
    const r = ridden(e, ctx);
    e.hidden = !r;
    if (!r) return;
    e.x = r.x;
    e.y = r.y;
    e.facing = Math.sign(r.vx) || e.facing;
    standardContact(e, ctx);
    return;
  }
  if (!e.awake) {
    if (Math.abs(p.x - e.x) > (e.wake ?? CREW.WAKE) || Math.abs(p.y - e.y) > CREW.WAKE_Y) return;
    e.awake = true;
    ctx.events.push({ type: 'wake', id: e.id });
  }
  const near = Math.abs(p.x - e.x) <= CREW.JAB_NEAR && Math.abs(p.y - e.y) <= 1.2;
  if (e.jabCool > 0) e.jabCool -= STEP;
  if (e.jabT < 0 && near && e.jabCool <= 0) {
    e.jabT = 0;
    e.facing = Math.sign(p.x - e.x) || e.facing;
    ctx.events.push({
      type: 'crewJabWarn',
      id: e.id,
      x: e.x,
      y: e.y,
      seconds: CREW.JAB_TELE,
      signals: ['visual:pink-spark', 'audio:static-crackle'],
    });
  }
  if (e.jabT >= 0) {
    e.jabT += STEP;
    e.vx = 0;
    if (e.jabT >= CREW.JAB_TELE) {
      e.jabT = -1;
      e.jabCool = CREW.JAB_COOL;
      const reach = Math.abs(p.x - e.x) <= CREW.JAB_REACH && Math.abs(p.y - e.y) <= 1.2;
      if (reach && hurtPlayer(ctx.session, e.x)) ctx.events.push({ type: 'dustmiteJab', id: e.id, x: e.x, y: e.y });
    }
  } else e.vx = e.facing * CREW.WALK;
  const hit = moveBody(e, ctx.world);
  const pat = e.patrol;
  if (pat) {
    if ((e.facing < 0 && e.x - e.w / 2 <= pat[0]) || (e.facing > 0 && e.x + e.w / 2 >= pat[1])) e.facing = -e.facing;
  } else if (hit.wall || (e.grounded && !groundAhead(e, ctx.world, e.facing))) e.facing = -e.facing;
  standardContact(e, ctx);
}
