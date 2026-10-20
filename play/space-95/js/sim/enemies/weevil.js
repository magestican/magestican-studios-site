










import { boxFree } from '../body.js';
import { contact, defeat, hurtPlayer, poundHit, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { ENTITY_GRAVITY, groundAhead, moveBody, registerKind } from '../entities.js';

const PATROL = 2; 
const CHARGE = 6; 
const TELEGRAPH = 0.5; 
const CHARGE_MAX = 10; 
const REST = 0.8; 
const SIGHT = 8; 
const SIGHT_Y = 1; 
const HOP_MAX = 1.6; 
const HOP_VY = Math.sqrt(2 * ENTITY_GRAVITY * 2.1); 
const FOLLOW = 3; 
const FOLLOW_RANGE = 12; 
const FOLLOW_SPEED = 2.5; 
const BUMP_VX = 4; 
const SIGNALS = ['visual:flour-puff', 'audio:snort'];

function to(e, stage) {
  e.stage = stage;
  e.st = 0;
  e.vx = 0;
}


function tryHop(e, w, dir) {
  if (!e.grounded) return false;
  const up = { x: e.x + dir * 0.3, y: e.y + HOP_MAX, w: e.w, h: e.h };
  if (!boxFree(w, up)) return false;
  e.vy = HOP_VY;
  e.grounded = false;
  return true;
}

registerKind('weevil', {
  sleeps: true,
  create(e) {
    e.w = 1.2;
    e.h = 1.0;
    e.stage = e.march ? 'march' : 'patrol';
    e.st = 0;
    e.facing = e.march ?? e.facing ?? -1;
    e.home = { x: e.x, y: e.y };
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    const p = ctx.player;
    const w = ctx.world;
    e.st += STEP;
    const dx = p.x - e.x;
    const onFloor = Math.abs(p.y - e.y) <= SIGHT_Y;
    if (e.stage === 'march') {
      e.vx = e.facing * PATROL;
      const m = moveBody(e, w);
      if (m.wall && !tryHop(e, w, e.facing)) e.vx = 0;
    } else if (e.specimen) {
      
      let tx = e.home.x;
      if (!e.thawed && Math.abs(dx) <= FOLLOW_RANGE && Math.abs(p.y - e.y) <= 4) tx = p.x - Math.sign(dx || 1) * FOLLOW;
      const d = tx - e.x;
      e.vx = Math.abs(d) > 0.2 ? Math.sign(d) * FOLLOW_SPEED : 0;
      if (e.vx) e.facing = Math.sign(e.vx);
      const m = moveBody(e, w);
      if (m.wall) tryHop(e, w, e.facing);
    } else if (e.stage === 'patrol') {
      const [x0, x1] = e.patrol ?? [e.home.x - 3, e.home.x + 3];
      if ((e.facing < 0 && e.x <= x0) || (e.facing > 0 && e.x >= x1) || (e.grounded && !groundAhead(e, w, e.facing))) e.facing = -e.facing;
      e.vx = e.facing * PATROL;
      const m = moveBody(e, w);
      if (m.wall) e.facing = -e.facing;
      if (e.charge && onFloor && p.grounded && Math.abs(dx) <= SIGHT && Math.sign(dx) === e.facing && ctx.session.dead === 0) {
        to(e, 'telegraph');
        e.dir = e.facing;
        ctx.events.push({
          type: 'telegraph',
          id: e.id,
          attack: 'charge',
          seconds: TELEGRAPH,
          x: e.x,
          y: e.y,
          dir: e.dir,
          signals: SIGNALS,
        });
      }
    } else if (e.stage === 'telegraph') {
      e.vx = 0;
      moveBody(e, w);
      if (e.st >= TELEGRAPH - 1e-9) {
        to(e, 'charge');
        e.ran = 0;
        ctx.events.push({ type: 'weevilCharge', id: e.id, x: e.x, y: e.y, dir: e.dir });
      }
    } else if (e.stage === 'charge') {
      e.vx = e.dir * CHARGE;
      const edge = e.grounded && !groundAhead(e, w, e.dir);
      if (edge) e.vx = 0;
      const m = moveBody(e, w);
      e.ran += Math.abs(e.vx) * STEP;
      if (m.wall || edge || e.ran >= CHARGE_MAX) to(e, 'rest');
    } else if (e.stage === 'rest') {
      moveBody(e, w);
      if (e.st >= REST) to(e, 'patrol');
    }
    
    const c = contact(p, e);
    if (!c) {
      e.bumped = false;
      return;
    }
    if (!e.specimen && poundHit(e, ctx)) return;
    if (c === 'stomp') {
      const front = (p.x - e.x) * e.facing > -0.15;
      stompBounce(p);
      if (e.specimen || front) ctx.events.push({ type: 'capBounce', id: e.id, x: e.x, y: e.y });
      else defeat(e, ctx, 'stomp');
      return;
    }
    if (e.stage === 'charge') hurtPlayer(ctx.session, e.x);
    else if (!e.bumped) {
      p.vx = (p.x < e.x ? -1 : 1) * BUMP_VX;
      ctx.events.push({ type: 'bump', id: e.id });
    }
    e.bumped = c === 'touch';
  },
});
