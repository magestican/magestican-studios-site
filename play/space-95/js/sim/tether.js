






















import { GRAVITY, STEP } from './constants.js';
import { registerKind } from './entities.js';

export const TETHER = Object.freeze({
  RANGE: 9, 
  BEHIND: 2, 
  BUFFER: 0.12, 
  THROW_SPEED: 45, 
  REEL_SPEED: 14, 
  REEL_EASE: 8, 
  ROPE: 3, 
  SLING: 0.7, 
  G: GRAVITY, 
  PUMP: 10, 
  AUTO_PUMP: 4, 
  CAP: 13, 
  RELEASE_VY: 12, 
  RELEASE_ADD: 4, 
  COOLDOWN: 0.2, 
});
const HOOK_CLEAR = 0.3; 
const LOS_STEP = 0.2; 
const THUD_SPEED = 1; 



registerKind('hook', {
  create(e) {
    e.w = 0.6;
    e.h = 0.6;
  },
  step() {},
});


function ropeClear(world, ax, ay, bx, by) {
  const T = world.tile;
  const d = Math.hypot(bx - ax, by - ay);
  const end = d - HOOK_CLEAR;
  if (end <= 0) return true;
  const n = Math.ceil(end / LOS_STEP);
  for (let i = 1; i <= n; i++) {
    const k = (end * i) / n / d;
    if (world.solid(Math.floor((ax + (bx - ax) * k) / T), Math.floor((ay + (by - ay) * k) / T))) return false;
  }
  return true;
}


function tetherTarget(p, world) {
  const hooks = world.hooks;
  if (!hooks) return null;
  const cx = p.x;
  const cy = p.y + p.h / 2;
  const rx = p.facing * Math.SQRT1_2;
  const ry = Math.SQRT1_2;
  let best = null;
  let bestA = Number.POSITIVE_INFINITY;
  for (const h of hooks) {
    const dx = h.x - cx;
    const dy = h.y - cy;
    const d = Math.hypot(dx, dy);
    if (d > TETHER.RANGE || dy < 0.5 || dx * p.facing < -TETHER.BEHIND) continue;
    const a = Math.acos(Math.max(-1, Math.min(1, (dx * rx + dy * ry) / d)));
    const better = a < bestA - 1e-9 || (Math.abs(a - bestA) <= 1e-9 && best && h.y > best.y);
    if (!better || !ropeClear(world, cx, cy, h.x, h.y)) continue;
    best = h;
    bestA = a;
  }
  return best;
}

const hookOf = (world, id) => world.hooks?.find((h) => h.id === id) ?? null;


export function swingAngle(p, h) {
  return Math.atan2(p.x - h.x, h.y - (p.y + p.h / 2));
}

function rearm(p, glide) {
  p.ab.usedDouble = false;
  p.ab.dashUsed = false;
  p.ab.glideArm = glide && !!p.abilities?.has('glide');
}

function letGo(p, how) {
  const t = p.tether;
  p.tether = null;
  p.tetherCool = TETHER.COOLDOWN;
  p.events.push({ type: how === 'rope' ? 'tetherBreak' : 'tetherRelease', id: t.hook, how, x: p.x, y: p.y });
}






export function tetherStep(p, input, pressed, dir, world) {
  const S = STEP;
  const press = !!input.tether && !p.prevTether;
  p.prevTether = !!input.tether;
  if (p.tetherCool > 0) p.tetherCool -= S;
  if (!world.hooks || !p.abilities?.has('tether')) return false;
  const t = p.tether;
  if (!t) {
    const aim = p.grounded ? null : tetherTarget(p, world);
    const aimId = aim ? aim.id : null;
    if (aimId !== p.tetherAim) {
      p.tetherAim = aimId;
      if (aim) p.events.push({ type: 'tetherAim', id: aim.id, x: aim.x, y: aim.y });
    }
    if (press && p.grounded) {
      p.tetherBuf = 0;
      p.events.push({ type: 'tetherBoop', why: 'ground', x: p.x, y: p.y });
      return false;
    }
    if (press) p.tetherBuf = TETHER.BUFFER;
    if (p.tetherBuf > 0 && aim && p.tetherCool <= 0 && p.ab.pound === null) {
      p.tetherBuf = 0;
      p.tether = { hook: aim.id, phase: 'throw', d: 0, vt: 0, len: TETHER.ROPE };
      p.ab.dashT = 0;
      p.events.push({ type: 'tetherThrow', id: aim.id, x: aim.x, y: aim.y });
      return false;
    }
    if (p.tetherBuf > 0) {
      p.tetherBuf -= S;
      if (p.tetherBuf <= 1e-9) {
        p.tetherBuf = 0;
        p.events.push({ type: 'tetherBoop', why: 'none', x: p.x, y: p.y });
      }
    }
    return false;
  }
  const h = hookOf(world, t.hook);
  const cy = p.y + p.h / 2;
  if (!h || !ropeClear(world, p.x, cy, h.x, h.y)) {
    letGo(p, 'rope');
    return false;
  }
  if (p.grounded) {
    letGo(p, 'ground');
    return false;
  }
  const dx = h.x - p.x;
  const dy = h.y - cy;
  const dist = Math.hypot(dx, dy);
  if (t.phase === 'throw') {
    t.d += TETHER.THROW_SPEED * S;
    if (t.d >= dist) {
      t.phase = 'reel';
      p.events.push({ type: 'tetherAttach', id: h.id, x: h.x, y: h.y });
    } else return false;
  }
  if (pressed) {
    
    const vy = Math.max(p.vy + TETHER.RELEASE_ADD, TETHER.RELEASE_VY);
    letGo(p, 'jump');
    p.vy = vy;
    p.jumpedThisAir = true;
    p.rising = true;
    p.jumpTime = 0;
    p.cut = false;
    p.sincePressed = Number.POSITIVE_INFINITY;
    rearm(p, true);
    return false;
  }
  if (input.down) {
    letGo(p, 'drop');
    p.ab.prevDown = true; 
    p.jumpedThisAir = true;
    p.rising = false;
    rearm(p, false);
    return false;
  }
  p.jumpedThisAir = true;
  p.rising = false;
  p.ab.glideArm = false;
  if (t.phase === 'reel') {
    if (dist > t.len + 1e-6) {
      const k = Math.min(1, TETHER.REEL_EASE * S);
      p.vx += ((dx / dist) * TETHER.REEL_SPEED - p.vx) * k;
      p.vy += ((dy / dist) * TETHER.REEL_SPEED - p.vy) * k;
      return true;
    }
    
    t.phase = 'swing';
    t.vt = Math.min(TETHER.CAP, TETHER.SLING * Math.hypot(p.vx, p.vy)) * p.facing;
    p.events.push({ type: 'tetherSwing', id: h.id, vt: t.vt });
  }
  
  const th = swingAngle(p, h);
  const pump = dir !== 0 ? TETHER.PUMP * dir : TETHER.AUTO_PUMP * p.facing;
  t.vt += (-TETHER.G * Math.sin(th) + pump) * S;
  t.vt = Math.max(-TETHER.CAP, Math.min(TETHER.CAP, t.vt));
  const th2 = th + (t.vt / t.len) * S;
  const tx = h.x + t.len * Math.sin(th2);
  const ty = h.y - t.len * Math.cos(th2) - p.h / 2;
  p.vx = (tx - p.x) / S;
  p.vy = (ty - p.y) / S;
  return true;
}





export function tetherAfterMove(p, hit) {
  const t = p.tether;
  if (t?.phase !== 'swing' || !hit) return;
  const was = Math.abs(t.vt);
  t.vt = 0;
  if (was >= THUD_SPEED) p.events.push({ type: 'tetherThud', id: t.hook, x: p.x, y: p.y });
}
