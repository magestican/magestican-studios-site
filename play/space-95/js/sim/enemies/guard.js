













import { contact, defeat, hurtPlayer, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { groundAhead, moveBody, overlaps, registerKind } from '../entities.js';
import { HONEY_STUCK, honeyAt, honeyStuckEvent } from '../honey.js';

const PATROL = 1.5; 
const VELVET_PATROL = 1.2; 
const WINDUP = 0.6; 
const CHARGE = 8; 
const STUNNED = 1.5; 
const SHAKE = 0.5; 
const HALT = 0.8; 
const COOLDOWN = 1.5; 
const SIGHT_X = 10; 
const SIGHT_Y = 1.5; 
const CAPE_RANGE = 6; 
const CAPE_TURN = 0.3; 
const SIGNALS = ['visual:horn-glow', 'audio:snort'];

function windup(e, ctx, dir) {
  e.stage = 'windup';
  e.st = 0;
  e.dir = dir;
  e.facing = dir;
  e.vx = 0;
  ctx.events.push({ type: 'telegraph', id: e.id, attack: 'charge', seconds: WINDUP, x: e.x, y: e.y, dir, signals: SIGNALS });
}

function to(e, stage) {
  e.stage = stage;
  e.st = 0;
  e.vx = 0;
  e.stunFor = undefined; 
}

registerKind('guard', {
  sleeps: true,
  create(e) {
    e.w = 1.2;
    e.h = 1.2;
    e.stage = 'patrol';
    e.st = 0;
    e.cool = 0;
    e.turnT = 0;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    const p = ctx.player;
    const w = ctx.world;
    e.st += STEP;
    if (e.cool > 0) e.cool -= STEP;
    const dx = p.x - e.x;
    const onFloor = Math.abs(p.y - e.y) <= SIGHT_Y;
    if (e.alert) {
      
      e.alert = false;
      if (!e.velvet) windup(e, ctx, Math.sign(dx) || e.facing);
    }
    if (e.stage === 'patrol') {
      if (e.velvet && Math.abs(dx) <= CAPE_RANGE && Math.abs(p.y - e.y) <= 3) {
        
        e.vx = 0;
        if (Math.sign(dx) !== e.facing && dx !== 0) {
          e.turnT += STEP;
          if (e.turnT >= CAPE_TURN - 1e-9) {
            e.facing = Math.sign(dx);
            e.turnT = 0;
            ctx.events.push({ type: 'capeTurn', id: e.id, facing: e.facing });
          }
        } else e.turnT = 0;
      } else {
        e.turnT = 0;
        if (!groundAhead(e, w, e.facing)) e.facing = -e.facing;
        
        else if (e.patrol && (e.facing < 0 ? e.x <= e.patrol[0] : e.x >= e.patrol[1])) e.facing = -e.facing;
        e.vx = e.facing * (e.velvet ? VELVET_PATROL : PATROL);
      }
      const hit = moveBody(e, w);
      if (hit.wall) e.facing = -e.facing;
      if (!e.velvet && e.cool <= 0 && onFloor && Math.abs(dx) <= SIGHT_X && ctx.session.dead === 0)
        windup(e, ctx, Math.sign(dx) || e.facing);
    } else if (e.stage === 'windup') {
      e.vx = 0;
      moveBody(e, w);
      if (e.st >= WINDUP - 1e-9) {
        to(e, 'charge');
        ctx.events.push({ type: 'guardCharge', id: e.id, dir: e.dir, x: e.x, y: e.y });
      }
    } else if (e.stage === 'charge') {
      if (!groundAhead(e, w, e.dir)) {
        to(e, 'halt'); 
        ctx.events.push({ type: 'guardHalt', id: e.id, x: e.x, y: e.y });
      } else {
        e.vx = e.dir * CHARGE;
        const hit = moveBody(e, w);
        const h = e.grounded || hit.landed ? honeyAt(w, e.x, e.y) : null;
        if (h) {
          to(e, 'stuck');
          e.use = h.use;
          ctx.events.push(honeyStuckEvent(e, h));
        } else if (hit.wall) {
          to(e, 'stunned');
          ctx.events.push({ type: 'guardStunned', id: e.id, x: e.x, y: e.y, side: e.dir });
        } else {
          
          const o = ctx.session.entities.find(
            (g) =>
              g !== e &&
              g.kind === 'guard' &&
              g.alive &&
              !g.dozing &&
              g.state !== 'dazed' &&
              g.state !== 'scurry' &&
              Math.sign(g.x - e.x) === e.dir &&
              overlaps(e, g),
          );
          if (o) {
            to(e, 'stunned');
            ctx.events.push({ type: 'guardStunned', id: e.id, x: e.x, y: e.y, side: e.dir, by: o.id });
            if (o.stage === 'charge') {
              to(o, 'stunned');
              ctx.events.push({ type: 'guardStunned', id: o.id, x: o.x, y: o.y, side: o.dir, by: e.id });
            }
            ctx.events.push({ type: 'guardClash', id: e.id, other: o.id, x: (e.x + o.x) / 2, y: e.y });
          }
        }
      }
    } else {
      e.vx = 0;
      moveBody(e, w);
      const done = { stunned: e.stunFor ?? STUNNED, stuck: HONEY_STUCK, shake: SHAKE, halt: HALT }[e.stage];
      if (e.st >= done - 1e-9) {
        if (e.stage === 'stuck') to(e, 'shake');
        else {
          if (e.stage !== 'halt') ctx.events.push({ type: 'guardRecover', id: e.id, from: e.stage });
          to(e, 'patrol');
          e.cool = COOLDOWN;
        }
      }
    }

    
    const c = contact(p, e);
    if (!c) return;
    const pound = p.ab?.pound === 'fall' && overlaps(p, e);
    if (e.velvet) {
      const back = Math.sign(dx) === -e.facing;
      if (pound) defeat(e, ctx, 'pound');
      else if (c === 'stomp' && back) {
        stompBounce(p);
        defeat(e, ctx, 'stomp');
      } else if (c === 'stomp') {
        stompBounce(p);
        ctx.events.push({ type: 'boing', id: e.id });
      }
      return;
    }
    const weak = e.stage === 'stunned' || e.stage === 'stuck';
    if ((c === 'stomp' || pound) && weak) {
      stompBounce(p);
      if (pound) p.ab.pound = null;
      defeat(e, ctx, e.stage === 'stuck' ? 'honey' : 'stomp');
    } else if (c === 'stomp' || pound) {
      stompBounce(p);
      if (pound) p.ab.pound = null;
      ctx.events.push({ type: 'helmetBonk', id: e.id });
    } else if (e.stage === 'charge') hurtPlayer(ctx.session, e.x);
  },
});
