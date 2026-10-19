














import { contact } from './combat.js';
import { STEP } from './constants.js';
import { overlaps, registerKind } from './entities.js';

const PERCH_RANGE = 4; 
const TRIGGER_REACH = 12; 
const SLOW = 6; 
const RAMP = 5; 
const WAIT_MAX = 4; 
const SEEK = 8; 
const TRAIL = 6; 
const ENTER_R = 2.5;
const STAY_R = 3;
export const LAG = 2; 
export const PULL = 5; 
export const EASE = 8; 
const COLLECT_R = 1.5; 
const LEAVE_VY = 6; 
const LEAVE_COOL = 0.4; 
const PEEL_V = 6; 
const RIDE_HANG = 1.2; 
const MOTH_SIGNALS = ['visual:scale-dust', 'audio:sparkle-chime'];


export function makePath(e) {
  const pts = [[e.x, e.y], ...(e.path ?? [])];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}


export function pathAt(path, s) {
  const { pts, cum } = path;
  if (pts.length < 2) return { x: pts[0][0], y: pts[0][1], dx: 1, dy: 0 };
  let i = 1;
  while (i < pts.length - 1 && cum[i] < s) i++;
  const [ax, ay] = pts[i - 1];
  const [bx, by] = pts[i];
  const L = cum[i] - cum[i - 1] || 1;
  const dx = (bx - ax) / L;
  const dy = (by - ay) / L;
  const t = Math.min(s, path.len) - cum[i - 1];
  return { x: ax + dx * t, y: ay + dy * t, dx, dy };
}


function trailDist(path, s, x, y) {
  let best = Number.POSITIVE_INFINITY;
  let prev = pathAt(path, s - TRAIL);
  for (let k = 1; k <= TRAIL; k++) {
    const cur = pathAt(path, s - TRAIL + k);
    const vx = cur.x - prev.x;
    const vy = cur.y - prev.y;
    const l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((x - prev.x) * vx + (y - prev.y) * vy) / l2));
    best = Math.min(best, Math.hypot(x - prev.x - vx * t, y - prev.y - vy * t));
    prev = cur;
  }
  return best;
}

const centre = (b) => ({ x: b.x, y: b.y + b.h / 2 });


export function rideStep(p) {
  p.vx = (p.ride.tx - p.x) / STEP;
  p.vy = (p.ride.ty - p.y) / STEP;
  p.jumpedThisAir = true;
  p.rising = false;
  p.ab.glideArm = false;
  return true;
}


export function wakeStep(p, input, pressed) {
  const w = p.wake;
  if (pressed || input.down) {
    p.wake = null;
    p.wakeCool = LEAVE_COOL;
    p.events.push({ type: 'slipstreamEnd', id: w.id, how: pressed ? 'jump' : 'drop' });
    if (pressed) {
      p.vy = LEAVE_VY;
      p.jumpedThisAir = true;
      p.rising = false;
      p.sincePressed = Number.POSITIVE_INFINITY; 
      if (p.abilities?.has('glide')) p.ab.glideArm = true;
    }
    return false;
  }
  const k = Math.min(1, EASE * STEP);
  p.vx += (w.tvx - p.vx) * k;
  p.vy += (w.tvy - p.vy) * k;
  p.jumpedThisAir = true;
  p.rising = false;
  return true;
}

function collectNear(p, ctx) {
  const c = centre(p);
  for (const e of ctx.session.entities) {
    if (!e.alive || e.kind !== 'seed') continue;
    if (Math.hypot(e.x - c.x, e.y + e.h / 2 - c.y) > COLLECT_R) continue;
    e.alive = false;
    ctx.session.seeds = (ctx.session.seeds ?? 0) + 1;
    ctx.events.push({ type: 'seed', id: e.id, x: e.x, y: e.y, slipstream: true });
  }
}

function takeOff(e, ctx, how) {
  e.state = 'fly';
  e.s = 0;
  e.sp = SLOW;
  e.wait = 0;
  e.caught = false;
  ctx.events.push({ type: 'mothTakeoff', id: e.id, use: e.use, how, x: e.x, y: e.y });
}

const eligible = (p) => !p.grounded && !p.climbing && !p.ride && !p.wake && p.wakeCool <= 0;

registerKind('moth', {
  create(e) {
    e.w = 1.2;
    e.h = 0.6;
    e.home = { x: e.x, y: e.y };
    e.state = 'perch';
    e.speed ??= 11;
    e.towing = false;
    e.trail = makePath(e);
  },
  step(e, ctx) {
    const p = ctx.player;
    if (e.state === 'perch') {
      const near = Math.hypot(p.x - e.home.x, p.y - e.home.y) <= PERCH_RANGE;
      const past = e.trigger !== undefined && p.x >= e.trigger && p.x - e.trigger <= TRIGGER_REACH && Math.abs(p.y - e.home.y) < 9;
      if (contact(p, e) === 'stomp') {
        p.vy = 10;
        p.grounded = false;
        p.jumpedThisAir = true;
        p.rising = false;
        p.events.push({ type: 'stomp', friendly: true });
        takeOff(e, ctx, 'stomp');
      } else if (!p.grounded && (near || past)) takeOff(e, ctx, 'trigger');
      else return;
    }
    if (e.state === 'fly') return fly(e, ctx);
    if (e.state === 'return') {
      const dx = e.home.x - e.x;
      const dy = e.home.y - e.y;
      const d = Math.hypot(dx, dy);
      const v = e.speed * STEP;
      if (d <= v) {
        e.x = e.home.x;
        e.y = e.home.y;
        e.vx = 0;
        e.vy = 0;
        e.state = 'perch';
      } else {
        e.vx = (dx / d) * e.speed;
        e.vy = (dy / d) * e.speed;
        e.x += e.vx * STEP;
        e.y += e.vy * STEP;
      }
      return;
    }
    if (e.state === 'peel') {
      e.x += e.vx * STEP;
      e.y += e.vy * STEP;
      e.st += STEP;
      if (e.st >= 2) e.state = 'away'; 
      return;
    }
    if (e.state === 'away' && Math.hypot(p.x - e.home.x, p.y - e.home.y) > 30) {
      e.x = e.home.x; 
      e.y = e.home.y;
      e.vx = 0;
      e.vy = 0;
      e.state = 'perch';
    }
  },
});

function fly(e, ctx) {
  const p = ctx.player;
  if (e.towing && p.wake?.id !== e.id) e.towing = false; 
  const c = centre(p);
  if (e.towing) {
    e.sp = Math.min(e.speed, e.sp + RAMP * STEP);
    e.wait = 0;
  } else if (!e.caught && Math.hypot(c.x - e.x, c.y - e.y) <= SEEK) e.sp = SLOW;
  else {
    e.sp = 0;
    e.wait += STEP;
    if (e.wait > WAIT_MAX) {
      e.state = 'return';
      return;
    }
  }
  e.s += e.sp * STEP;
  const at = pathAt(e.trail, e.s);
  e.x = at.x;
  e.y = at.y;
  e.vx = at.dx * e.sp;
  e.vy = at.dy * e.sp;
  if (e.vx !== 0) e.facing = Math.sign(e.vx);
  const d = trailDist(e.trail, e.s, c.x, c.y - e.h / 2); 
  if (!e.towing && eligible(p) && d <= ENTER_R) {
    e.towing = true;
    e.caught = true;
    p.wake = { id: e.id, tvx: p.vx, tvy: p.vy };
    ctx.events.push({ type: 'slipstream', id: e.id, use: e.use, x: p.x, y: p.y, signals: MOTH_SIGNALS });
  } else if (e.towing && (p.grounded || p.climbing || d > STAY_R)) {
    e.towing = false;
    p.wake = null;
    p.wakeCool = LEAVE_COOL;
    ctx.events.push({ type: 'slipstreamEnd', id: e.id, how: 'lost' });
  }
  if (e.towing) {
    
    
    const lag = pathAt(e.trail, e.s - LAG);
    const rx = lag.x - c.x;
    const ry = lag.y + e.h / 2 - c.y;
    const along = rx * lag.dx + ry * lag.dy;
    const keep = Math.max(along, -0.5) - along;
    p.wake.tvx = e.vx + PULL * (rx + keep * lag.dx);
    p.wake.tvy = e.vy + PULL * (ry + keep * lag.dy);
    collectNear(p, ctx);
  }
  if (e.s >= e.trail.len) {
    if (e.towing) {
      e.towing = false;
      p.wake = null;
      ctx.events.push({ type: 'slipstreamEnd', id: e.id, how: 'end' });
    }
    e.state = 'peel';
    e.st = 0;
    e.vx = (at.dx >= 0 ? 1 : -1) * PEEL_V;
    e.vy = PEEL_V;
  }
}

registerKind('seedRide', {
  create(e) {
    e.w = 1;
    e.h = 1;
    e.state = 'idle';
    e.speed ??= 9;
    e.trail = makePath(e);
  },
  step(e, ctx) {
    const p = ctx.player;
    if (e.state === 'idle') {
      if (!overlaps(p, e) || p.ride || p.wake) return;
      e.state = 'ride';
      e.s = 0;
      p.ride = { id: e.id, tx: e.x, ty: e.y - RIDE_HANG };
      p.wake = null;
      ctx.events.push({ type: 'seedGrab', id: e.id, x: e.x, y: e.y });
      return;
    }
    if (e.state === 'ride') {
      e.s += e.speed * STEP;
      const at = pathAt(e.trail, e.s);
      e.x = at.x;
      e.y = at.y;
      e.vx = at.dx * e.speed;
      e.vy = at.dy * e.speed;
      const riding = p.ride?.id === e.id; 
      if (riding) {
        p.ride.tx = e.x;
        p.ride.ty = e.y - RIDE_HANG;
      }
      if (e.s >= e.trail.len) {
        e.state = 'done';
        e.st = 0;
        if (riding) {
          p.ride = null;
          p.vx = e.vx;
          p.vy = e.vy;
          ctx.events.push({ type: 'seedRelease', id: e.id, x: p.x, y: p.y });
        }
      }
      return;
    }
    if (e.state === 'done') {
      e.x += 3 * STEP;
      e.y += 2 * STEP;
      e.st += STEP;
      if (e.st > 3) e.alive = false;
    }
  },
});
