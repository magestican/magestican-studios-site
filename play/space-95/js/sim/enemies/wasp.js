












import { sweepX, sweepY } from '../body.js';
import { contact, defeat, hurtPlayer, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps, registerKind } from '../entities.js';
import { HONEY_STUCK, honeyAt, honeyStuckEvent } from '../honey.js';
import { LAG } from '../slipstream.js';

const BOB = 0.3; 
const BOB_PERIOD = 1.2; 
const BELOW = 2; 
const REACH_X = 7; 
const TELEGRAPH = 0.6; 
const RE_TELEGRAPH = 0.4; 
const DIVE_SPEED = 14; 
const OPEN_AIR = 10; 
const STUCK = 1.2; 
const STUCK_DOUBLE = 1.6; 


const PULL_UP_SHORT = 1.5; 
const RETURN_SPEED = 4; 
const COOLDOWN = 1.0; 
const PRACTICE_EVERY = 3; 
const BUMP_VX = 4; 
const SIGNALS = ['visual:pink-line', 'audio:rising-buzz'];

const centre = (b) => ({ x: b.x, y: b.y + b.h / 2 });

function telegraph(e, ctx, lock, seconds, attack = 'dive') {
  e.stage = 'telegraph';
  e.st = 0;
  e.tel = seconds;
  e.lock = lock;
  ctx.events.push({ type: 'telegraph', id: e.id, attack, seconds, x: e.x, y: e.y, tx: lock.x, ty: lock.y, signals: SIGNALS });
}








const SCREEN_DARTS = 3;
const SCREEN_GAP = 0.15; 
const SCREEN_DART_V = 18; 
const SCREEN_DART_LIFE = 1.2; 
const SCREEN_REACH = 30; 

function screenSting(e, ctx) {
  const c = e.screen;
  const pl = ctx.session.plane;
  e.x = e.post.x;
  e.y = e.post.y;
  if (pl?.stage !== 'fly') return;
  if (e.stage === 'hover') {
    if (e.fired || ctx.session.dead > 0 || pl.x < c.at || pl.x - c.at > SCREEN_REACH) return;
    telegraph(e, ctx, { x: e.x, y: e.y - c.fall }, c.tel, 'sting');
  } else if (e.stage === 'telegraph') {
    e.st += STEP;
    if (e.st >= e.tel - 1e-9) {
      e.stage = 'sting';
      e.st = 0;
      e.shot = 0;
    }
  } else if (e.stage === 'sting') {
    if (e.st >= e.shot * SCREEN_GAP - 1e-9) {
      pl.darts.push({ x: e.x, y: e.y, vx: 0, vy: -SCREEN_DART_V, life: SCREEN_DART_LIFE, owner: e.id });
      ctx.events.push({ type: 'stingFire', id: e.id, n: e.shot, x: e.x, y: e.y });
      e.shot += 1;
      if (e.shot >= SCREEN_DARTS) {
        e.stage = 'hover';
        e.fired = true;
      }
    }
    e.st += STEP;
  }
}






const ESCORT_PEEL = 6; 
const ESCORT_GONE = 2; 

function escortMoth(e, ctx) {
  const c = e.escort;
  const moth = ctx.session.entities.find((m) => m.id === c.moth);
  if (e.peel !== undefined) {
    e.peel += STEP;
    e.y += ESCORT_PEEL * STEP;
    if (e.peel >= ESCORT_GONE) e.alive = false;
    return;
  }
  if (!moth || moth.x < c.x0) return;
  if (moth.x > c.x1) {
    e.peel = 0;
    ctx.events.push({ type: 'specimenPeel', id: e.id, x: e.x, y: e.y });
    return;
  }
  const x = moth.x - LAG;
  e.facing = Math.sign(x - e.x) || e.facing;
  e.x = x;
  e.y = moth.y + moth.h / 2 + c.above - e.h / 2;
}







const CROWN_PAST = 3; 
const CROWN_RETURN = 18; 
const CROWN_FIRST = 1; 

function crownDive(e, ctx) {
  const c = e.crown;
  const p = ctx.player;
  const s = ctx.session;
  const boss = s.entities.find((b) => b.id === c.boss);
  e.harmless = e.stage !== 'dive';
  if (!boss || boss.phase > c.phase || boss.stage === 'defeated') {
    e.alive = false; 
    return;
  }
  if (boss.phase < c.phase) return; 
  e.post = { x: boss.x, y: boss.y - 1 };
  
  
  const live = boss.stage !== 'intro' && s.dead === 0 && p.y >= c.fromY && p.y < (c.toY ?? Number.POSITIVE_INFINITY);
  if (e.clock === undefined && live) e.clock = c.every - CROWN_FIRST;
  if (e.clock !== undefined && s.dead === 0) e.clock += STEP;
  if (e.stage === 'hover') {
    e.x = e.post.x;
    e.y = e.post.y;
    if (live && e.clock >= c.every) {
      e.clock = 0;
      telegraph(e, ctx, centre(p), c.tel);
    }
  } else if (e.stage === 'telegraph') {
    e.st += STEP;
    e.x = e.post.x;
    e.y = e.post.y;
    if (e.st >= e.tel) {
      const ec = centre(e);
      const dx = e.lock.x - ec.x;
      const dy = e.lock.y - ec.y;
      const d = Math.hypot(dx, dy) || 1;
      e.stage = 'dive';
      e.st = 0;
      e.toLock = d;
      e.flown = 0;
      e.vx = (dx / d) * DIVE_SPEED;
      e.vy = (dy / d) * DIVE_SPEED;
      e.facing = Math.sign(dx) || e.facing;
      ctx.events.push({ type: 'waspDive', id: e.id, x: e.x, y: e.y });
    }
  } else if (e.stage === 'dive') {
    const mx = sweepX(ctx.world, e, e.vx * STEP);
    e.x = mx.x;
    const my = sweepY(ctx.world, e, e.vy * STEP, true);
    e.y = my.y;
    e.flown += DIVE_SPEED * STEP;
    if (mx.hit || my.hit || e.flown >= e.toLock + CROWN_PAST) {
      e.stage = 'return';
      e.st = 0;
      ctx.events.push({ type: 'waspPullUp', id: e.id, x: e.x, y: e.y });
    }
  } else if (e.stage === 'return') {
    const dx = e.post.x - e.x;
    const dy = e.post.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d <= CROWN_RETURN * STEP) {
      e.stage = 'hover';
      e.st = 0;
      e.vx = 0;
      e.vy = 0;
    } else {
      e.vx = (dx / d) * CROWN_RETURN;
      e.vy = (dy / d) * CROWN_RETURN;
      e.x += e.vx * STEP;
      e.y += e.vy * STEP;
    }
  }
  if (e.stage === 'dive' && contact(p, e)) hurtPlayer(s, e.x);
}

registerKind('wasp', {
  sleeps: true,
  create(e) {
    e.w = 0.9;
    e.h = 0.7;
    e.post = { x: e.x, y: e.y };
    e.stage = 'hover';
    e.st = 0;
    e.cool = 0;
    e.practiceT = 0;
    e.second = false;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    const p = ctx.player;
    const s = ctx.session;
    
    if (e.escort) return escortMoth(e, ctx);
    if (e.asleep) return;
    if (e.crown) return crownDive(e, ctx);
    if (e.screen) return screenSting(e, ctx);
    e.st += STEP;
    const pc = centre(p);
    const ec = centre(e);
    if (e.stage === 'hover') {
      e.x = e.post.x;
      e.y = e.post.y + BOB * Math.sin((2 * Math.PI * e.t) / BOB_PERIOD);
      if (e.cool > 0) e.cool -= STEP;
      const valid = s.dead === 0 && ec.y - pc.y >= BELOW && Math.abs(pc.x - ec.x) <= REACH_X;
      if (e.cool <= 0 && valid) telegraph(e, ctx, pc, TELEGRAPH);
      else if (e.cool <= 0 && e.practice) {
        e.practiceT += STEP;
        if (e.practiceT >= PRACTICE_EVERY) telegraph(e, ctx, { x: e.practice.x, y: e.practice.y + 0.1 }, TELEGRAPH);
      }
    } else if (e.stage === 'telegraph') {
      if (e.st >= e.tel) {
        const dx = e.lock.x - ec.x;
        const dy = e.lock.y - ec.y;
        const d = Math.hypot(dx, dy) || 1;
        e.stage = 'dive';
        e.st = 0;
        e.dir = { x: dx / d, y: dy / d };
        e.toLock = d;
        e.flown = 0;
        e.vx = e.dir.x * DIVE_SPEED;
        e.vy = e.dir.y * DIVE_SPEED;
        e.facing = Math.sign(dx) || e.facing;
        ctx.events.push({ type: 'waspDive', id: e.id, x: e.x, y: e.y });
      }
    } else if (e.stage === 'dive') {
      const mx = sweepX(ctx.world, e, e.vx * STEP);
      e.x = mx.x;
      const my = sweepY(ctx.world, e, e.vy * STEP);
      e.y = my.y;
      e.flown += DIVE_SPEED * STEP;
      if (mx.hit || my.hit) {
        e.stage = 'stuck';
        e.st = 0;
        e.stuckFor = e.double ? STUCK_DOUBLE : STUCK;
        e.vx = 0;
        e.vy = 0;
        ctx.events.push({ type: 'waspStuck', id: e.id, x: e.x, y: e.y });
        
        const h = my.hit && honeyAt(ctx.world, e.x, e.y);
        if (h) {
          e.stuckFor = HONEY_STUCK;
          e.use = h.use;
          ctx.events.push(honeyStuckEvent(e, h));
        }
      } else if (e.double && !e.second && e.flown >= e.toLock - PULL_UP_SHORT) {
        e.second = true; 
        e.vx = 0;
        e.vy = 0;
        telegraph(e, ctx, pc, RE_TELEGRAPH);
      } else if (e.flown >= Math.max(OPEN_AIR, e.toLock + 1)) {
        e.stage = 'return';
        e.st = 0;
        ctx.events.push({ type: 'waspPullUp', id: e.id, x: e.x, y: e.y });
      }
    } else if (e.stage === 'stuck') {
      if (e.st >= e.stuckFor) {
        e.stage = 'return';
        e.st = 0;
      }
    } else if (e.stage === 'return') {
      const dx = e.post.x - e.x;
      const dy = e.post.y - e.y;
      const d = Math.hypot(dx, dy);
      const v = RETURN_SPEED * STEP;
      if (d <= v) {
        e.x = e.post.x;
        e.y = e.post.y;
        e.vx = 0;
        e.vy = 0;
        e.stage = 'hover';
        e.cool = COOLDOWN;
        e.practiceT = 0;
        e.second = false;
        e.t = 0;
      } else {
        e.vx = (dx / d) * RETURN_SPEED;
        e.vy = (dy / d) * RETURN_SPEED;
        e.x += e.vx * STEP;
        e.y += e.vy * STEP;
      }
    }
    if (s.plane) {
      
      
      if (e.stage === 'dive' && !s.plane.iframes && overlaps(p, e)) hurtPlayer(s, e.x);
      return;
    }
    const c = contact(p, e);
    if (!c) {
      e.bumped = false;
      return;
    }
    if (e.stage === 'dive') hurtPlayer(s, e.x);
    else if (e.stage === 'stuck' && c === 'stomp') {
      stompBounce(p);
      defeat(e, ctx, 'stomp');
    } else if (c === 'stomp')
      stompBounce(p); 
    else if (!e.bumped) {
      p.vx = (p.x < e.x ? -1 : 1) * BUMP_VX;
      ctx.events.push({ type: 'bump', id: e.id });
    }
    e.bumped = c === 'touch';
  },
});
