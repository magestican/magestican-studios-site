









import { STEP } from './constants.js';
import { LAG } from './slipstream.js';

const TAIL_GAP = 3; 
const SWOOP = 20; 
const AHEAD = 3; 
const SLIP_R = 2.5; 
const WAKE_REACH = 30;
const PEEL_VY = 6;
const LEAD_SLOW = 6; 

const cyOf = (e) => e.y + e.h / 2;
function put(e, x, y) {
  e.vx = (x - e.x) / STEP;
  e.vy = (y - cyOf(e)) / STEP;
  e.x = x;
  e.y = y - e.h / 2;
  e.facing = Math.sign(e.vx) || e.facing;
}


export function stepTailMoth(e, ctx) {
  const pl = ctx.session.plane;
  if (!pl) return;
  const tail = e.tail;
  e.st = (e.st ?? 0) + STEP;
  const hx = Math.cos(pl.heading);
  const hy = Math.sin(pl.heading);
  if (e.state === 'perch') {
    if (pl.stage !== 'fly' || pl.x < tail.wakeWhen.x || pl.x - tail.wakeWhen.x > WAKE_REACH) return;
    e.state = 'swoop';
    e.st = 0;
    ctx.events.push({ type: 'mothSwoop', id: e.id, x: e.x, y: e.y }); 
    return;
  }
  if (e.state === 'swoop' || e.state === 'tail') {
    const tx = pl.x - hx * TAIL_GAP;
    const ty = pl.y - hy * TAIL_GAP;
    if (e.state === 'swoop') {
      const d = Math.hypot(tx - e.x, ty - cyOf(e));
      const step = Math.max(SWOOP, pl.v + 6) * STEP;
      if (d <= step) {
        put(e, tx, ty);
        e.state = 'tail';
        e.st = 0;
        ctx.events.push({ type: 'mothTail', id: e.id, x: e.x, y: e.y }); 
      } else put(e, e.x + ((tx - e.x) / d) * step, cyOf(e) + ((ty - cyOf(e)) / d) * step);
      return;
    }
    put(e, tx, ty);
    const looped = pl.loopT > 0;
    if (looped || e.st >= tail.hold - 1e-9) {
      e.state = 'pass';
      e.st = 0;
      e.passDir = { x: looped ? Math.cos(pl.loopH) : hx, y: looped ? Math.sin(pl.loopH) : hy };
      if (!looped) ctx.events.push({ type: 'loopHint', id: e.id }); 
      ctx.events.push({ type: 'mothPass', id: e.id, how: looped ? 'loop' : 'hold', x: e.x, y: e.y });
    }
    return;
  }
  if (e.state === 'pass') {
    put(e, e.x + e.passDir.x * tail.speed * STEP, cyOf(e) + e.passDir.y * tail.speed * STEP);
    if ((e.x - pl.x) * Math.sign(e.passDir.x || 1) >= AHEAD) {
      e.state = 'lead';
      e.st = 0;
      ctx.events.push({ type: 'mothLead', id: e.id, x: e.x, y: e.y });
    }
    slip(e, ctx, pl);
    return;
  }
  if (e.state === 'lead') {
    const next = (e.path ?? []).find(([px]) => px > e.x + 0.5);
    if (!next) {
      e.state = 'peel';
      e.st = 0;
      e.vx = e.speed * 0.6;
      e.vy = PEEL_VY;
      ctx.events.push({ type: 'mothPeel', id: e.id, x: e.x, y: e.y });
      return;
    }
    
    
    const want = Math.cos(pl.heading) * pl.v + 2 * (AHEAD - (e.x - pl.x));
    const d = Math.hypot(next[0] - e.x, next[1] - cyOf(e)) || 1;
    const v = Math.max(LEAD_SLOW, Math.min(tail.speed, want)) * STEP;
    put(e, e.x + ((next[0] - e.x) / d) * v, cyOf(e) + ((next[1] - cyOf(e)) / d) * v);
    slip(e, ctx, pl);
    return;
  }
  if (e.state === 'peel') {
    e.x += e.vx * STEP;
    e.y += e.vy * STEP;
    if (e.st >= 2) e.state = 'away';
  }
}


function slip(e, ctx, pl) {
  const sp = Math.hypot(e.vx, e.vy) || 1;
  const lx = e.x - (e.vx / sp) * LAG;
  const ly = cyOf(e) - (e.vy / sp) * LAG;
  const inWake = Math.hypot(pl.x - lx, pl.y - ly) <= SLIP_R && pl.stage === 'fly';
  if (inWake) {
    pl.slipT = 2 * STEP;
    if (!e.towing) ctx.events.push({ type: 'slipstream', id: e.id, x: pl.x, y: pl.y });
  }
  e.towing = inWake;
}
