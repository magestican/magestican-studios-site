






















import { boxFree, sweepX, sweepY } from './body.js';
import { defeat, hurtPlayer, INVULN_TIME } from './combat.js';
import { STEP } from './constants.js';
import { zoneOn } from './wind.js';

const D = Math.PI / 180;


export const PLANE = Object.freeze({
  W: 2.0, 
  H: 0.8,
  CRUISE: 10, 
  SLOPE: 2, 
  ACCEL: 6, 
  TURN: 200 * D, 
  LOOP_T: 1.1, 
  RING_R: 2.75, 
  RING_LIFE: 1.0, 
  BUFFER: 0.12, 
  ROLL_T: 0.4,
  JINK: 2.0, 
  ROLL_HALO: 3.0, 
  ROLL_COOL: 0.3,
  GRAZE: 1.5, 
  SPUN: 0.35, 
  TURRET_T: 0.25, 
  GUN_EVERY: 0.2, 
  PEA_SPEED: 24,
  PEA_LIFE: 0.6, 
  GUN_RANGE: 14,
  GUN_CONE: 10 * D,
  SCRAPE_PUSH: 1.0,
  SCRAPE_V: 7,
  FLUFF_SLOW: 4, 
  FLUFF_T: 1.0, 
  SOFT_TURN: 30 * D,
  LIFT: 5, 
  LIFT_ROOF: 2, 
  CEIL: 8, 
  CEIL_PUSH: 6, 
  INTRO_T: 2.0, 
  TAKEOFF_T: 1.5, 
  TAKEOFF_ANGLE: 15 * D,
  ROTATE_T: 0.5,
  LAND_T: 1.0, 
  LAND_ANGLE: 45 * D,
  SLIP_BOOST: 3, 
  DART: 0.3, 
});


export const LOOP_R = (PLANE.CRUISE * PLANE.LOOP_T) / (2 * Math.PI);
const TWO_PI = 2 * Math.PI;
const wrap = (a) => {
  let r = a % TWO_PI;
  if (r > Math.PI) r -= TWO_PI;
  if (r <= -Math.PI) r += TWO_PI;
  return r;
};

const canopy = (h) => (Math.cos(h) >= -1e-9 ? 1 : -1);
const NONE = Object.freeze({ x: 0, up: false, down: false, jump: false, dash: false, tether: false });
const GUN_KINDS = new Set(['ace', 'wasp']);


export const fighting = (e) =>
  e.alive && e.spun === undefined && !e.down && e.state !== 'dazed' && e.state !== 'scurry' && e.state !== 'downed';






function createPlane(_level, at, air) {
  return {
    x: at.x,
    y: air ? at.y : at.y + PLANE.H / 2,
    heading: 0, 
    v: air ? PLANE.CRUISE : 0,
    
    stage: air ? 'fly' : 'intro',
    stageT: 0,
    loopT: 0, 
    loopDir: 0, 
    loopH: 0, 
    loopV: 0,
    buffer: 0,
    rollT: 0, 
    rollSide: 0, 
    rollCool: 0,
    iframes: false,
    
    rings: [],
    ringN: 0,
    
    peas: [],
    gunT: 0,
    
    darts: [],
    fluffT: 0, 
    inSoft: [], 
    ceilVy: 0,
    slipT: 0, 
    landing: null, 
    landed: false,
    prevJump: false,
    prevDash: false,
    prevTether: false,
    scrapes: 0,
    told: {}, 
  };
}


export function startPlane(s, start, air) {
  s.plane = createPlane(s.level, start, air);
  s.stats ??= { wingman: 0 };
  syncPlaneProxy(s);
}


export function placePlane(s, x, y, headingDeg = 0) {
  const pl = createPlane(s.level, { x, y }, true);
  pl.heading = wrap(headingDeg * D);
  pl.v = PLANE.CRUISE - PLANE.SLOPE * Math.sin(pl.heading);
  s.plane = pl;
  s.stats ??= { wingman: 0 };
  syncPlaneProxy(s);
  return pl;
}


export const planeBox = (pl) => ({ x: pl.x, y: pl.y - PLANE.H / 2, w: PLANE.W, h: PLANE.H });


function syncPlaneProxy(s) {
  const pl = s.plane;
  const p = s.player;
  p.px = p.x;
  p.py = p.y;
  p.x = pl.x;
  p.y = pl.y - PLANE.H / 2;
  p.w = PLANE.W;
  p.h = PLANE.H;
  const v = pl.stage === 'intro' ? 0 : pl.v;
  p.vx = Math.cos(pl.heading) * v;
  p.vy = Math.sin(pl.heading) * v;
  p.grounded = false;
  p.facing = Math.sign(Math.cos(pl.heading)) || 1;
  p.events.length = 0;
}


export function loopClear(world, pl, margin = 0) {
  const dir = canopy(pl.heading);
  const cx = pl.x - Math.sin(pl.heading) * LOOP_R * dir;
  const cy = pl.y + Math.cos(pl.heading) * LOOP_R * dir;
  const R = LOOP_R + PLANE.H / 2 + margin;
  return boxFree(world, { x: cx, y: cy - R, w: 2 * R, h: 2 * R });
}


export function stepPlane(s, input) {
  const pl = s.plane;
  const ev = s.events;
  pl.stageT += STEP;
  if (pl.stage === 'intro') {
    if (pl.stageT >= PLANE.INTRO_T - 1e-9) {
      pl.stage = 'takeoff';
      pl.stageT = 0;
      ev.push({ type: 'takeoff', x: pl.x, y: pl.y });
    }
    return syncPlaneProxy(s);
  }
  if (pl.stage === 'takeoff') {
    
    const t = pl.stageT;
    pl.v = Math.min(PLANE.CRUISE, (PLANE.CRUISE / PLANE.TAKEOFF_T) * t);
    const rot = Math.max(0, Math.min(1, (t - (PLANE.TAKEOFF_T - PLANE.ROTATE_T)) / PLANE.ROTATE_T));
    if (rot > 0 && pl.heading === 0) ev.push({ type: 'liftoff', x: pl.x, y: pl.y });
    pl.heading = PLANE.TAKEOFF_ANGLE * rot;
    pl.x += Math.cos(pl.heading) * pl.v * STEP;
    pl.y += Math.sin(pl.heading) * pl.v * STEP;
    if (t >= PLANE.TAKEOFF_T - 1e-9) {
      pl.stage = 'fly';
      pl.stageT = 0;
      ev.push({ type: 'control', x: pl.x, y: pl.y });
    }
    pl.prevJump = !!input.jump;
    pl.prevDash = !!input.dash;
    pl.prevTether = !!input.tether;
    return syncPlaneProxy(s);
  }
  if (pl.stage === 'touchdown' || pl.stage === 'landed') {
    
    if (pl.stage === 'touchdown') {
      const k = Math.min(1, pl.stageT / PLANE.LAND_T);
      const v = pl.landV * (1 - k);
      pl.v = v;
      const dx = Math.cos(pl.heading) * v * STEP;
      if (pl.x + dx >= pl.landing.x0 && pl.x + dx <= pl.landing.x1) pl.x += dx;
      pl.y = pl.landing.y + PLANE.H / 2 + 0.3 * Math.max(0, Math.sin(Math.PI * Math.min(1, k * 2.5)));
      if (k >= 1) {
        pl.stage = 'landed';
        pl.y = pl.landing.y + PLANE.H / 2;
        pl.v = 0;
        pl.landed = true;
        ev.push({ type: 'landed', x: pl.x, y: pl.y });
      }
    }
    return syncPlaneProxy(s);
  }
  
  const inp = s.cleared ? NONE : input;
  const jumpEdge = !!inp.jump && !pl.prevJump;
  const dashEdge = !!inp.dash && !pl.prevDash;
  const tetherEdge = !!inp.tether && !pl.prevTether;
  pl.prevJump = !!inp.jump;
  pl.prevDash = !!inp.dash;
  pl.prevTether = !!inp.tether;
  if (tetherEdge && !pl.told.tether) {
    pl.told.tether = true;
    ev.push({ type: 'planeRefuse', what: 'tether', x: pl.x, y: pl.y }); 
  }
  if (pl.rollCool > 0) pl.rollCool -= STEP;
  if (pl.buffer > 0) pl.buffer -= STEP;
  if (pl.fluffT > 0) pl.fluffT -= STEP;
  if (pl.slipT > 0) pl.slipT -= STEP;
  const sx = inp.x > 0.25 ? 1 : inp.x < -0.25 ? -1 : 0;
  const sy = inp.up ? 1 : inp.down ? -1 : 0;
  if (jumpEdge) pl.buffer = PLANE.BUFFER;
  
  if (dashEdge && pl.rollT <= 0 && pl.rollCool <= 0 && pl.loopT <= 0) {
    const nx = -Math.sin(pl.heading);
    const ny = Math.cos(pl.heading);
    const side = Math.sign(nx * sx + ny * sy) || canopy(pl.heading);
    pl.rollT = PLANE.ROLL_T;
    pl.rollSide = side;
    ev.push({ type: 'roll', x: pl.x, y: pl.y, side, heading: pl.heading });
  }
  
  if (pl.buffer > 0 && pl.loopT <= 0 && pl.rollT <= 0) {
    pl.buffer = 0;
    const dir = canopy(pl.heading);
    pl.loopT = PLANE.LOOP_T;
    pl.loopDir = dir;
    pl.loopH = pl.heading;
    pl.loopV = Math.max(pl.v, 1);
    const R = (pl.loopV * PLANE.LOOP_T) / TWO_PI;
    const cx = pl.x - Math.sin(pl.heading) * R * dir;
    const cy = pl.y + Math.cos(pl.heading) * R * dir;
    pl.ringN += 1;
    const ring = { id: pl.ringN, x: cx, y: cy, r: PLANE.RING_R, born: s.time, until: s.time + PLANE.LOOP_T + PLANE.RING_LIFE };
    pl.rings.push(ring);
    ev.push({ type: 'loop', x: pl.x, y: pl.y, cx, cy, dir, ring: ring.id });
  }
  pl.iframes = pl.rollT > 0;
  let vx;
  let vy;
  if (pl.loopT > 0) {
    
    pl.heading = wrap(pl.heading + pl.loopDir * (TWO_PI / PLANE.LOOP_T) * STEP);
    pl.loopT -= STEP;
    if (pl.loopT <= 1e-9) {
      pl.loopT = 0;
      pl.heading = pl.loopH;
      ev.push({ type: 'loopEnd', x: pl.x, y: pl.y });
    }
    pl.v = pl.loopV;
    vx = Math.cos(pl.heading) * pl.v;
    vy = Math.sin(pl.heading) * pl.v;
  } else {
    if (sx || sy) {
      const target = Math.atan2(sy, sx);
      let d = wrap(target - pl.heading);
      if (Math.abs(Math.abs(d) - Math.PI) < 1e-6) d = canopy(pl.heading) * Math.PI; 
      const turn = Math.min(Math.abs(d), PLANE.TURN * STEP);
      pl.heading = wrap(pl.heading + Math.sign(d) * turn);
    }
    let target = PLANE.CRUISE - PLANE.SLOPE * Math.sin(pl.heading);
    if (pl.slipT > 0) target += PLANE.SLIP_BOOST;
    if (pl.fluffT > 0) target -= PLANE.FLUFF_SLOW;
    const a = PLANE.ACCEL * STEP;
    pl.v = pl.v < target ? Math.min(target, pl.v + a) : Math.max(target, pl.v - a);
    vx = Math.cos(pl.heading) * pl.v;
    vy = Math.sin(pl.heading) * pl.v;
    
    const w = s.world;
    for (const z of w.updrafts ?? [])
      if (inRect(z, pl.x, pl.y) && zoneOn(z, w.time ?? 0) && boxFree(w, { ...planeBox(pl), y: pl.y - PLANE.H / 2 + PLANE.LIFT_ROOF }))
        vy += PLANE.LIFT;
    for (const z of w.gusts ?? []) if (inRect(z, pl.x, pl.y) && zoneOn(z, w.time ?? 0)) vx += z.vx;
  }
  if (pl.rollT > 0) {
    
    const k = PLANE.JINK / PLANE.ROLL_T;
    vx += -Math.sin(pl.heading) * pl.rollSide * k;
    vy += Math.cos(pl.heading) * pl.rollSide * k;
    pl.rollT -= STEP;
    if (pl.rollT <= 1e-9) {
      pl.rollT = 0;
      pl.rollCool = PLANE.ROLL_COOL;
    }
  }
  
  const ceiling = s.level.ceiling ?? Infinity;
  if (pl.y > ceiling) pl.ceilVy -= PLANE.CEIL_PUSH * STEP;
  else pl.ceilVy = Math.min(0, pl.ceilVy + 2 * PLANE.CEIL_PUSH * STEP);
  vy += pl.ceilVy;
  
  if (landing(s, pl)) return syncPlaneProxy(s);
  
  const box = planeBox(pl);
  const mx = sweepX(s.world, box, vx * STEP);
  box.x = mx.x;
  const my = sweepY(s.world, box, vy * STEP, true);
  box.y = my.y;
  pl.x = box.x;
  pl.y = box.y + PLANE.H / 2;
  if (mx.hit || my.hit) scrape(s, pl, mx.hit ? Math.sign(vx) : 0, my.hit ? Math.sign(vy) : 0);
  softZones(s, pl);
  stepGun(s, pl);
  stepDarts(s, pl);
  pl.rings = pl.rings.filter((r) => s.time <= r.until + 1e-9);
  syncPlaneProxy(s);
}

const inRect = (z, x, y) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1;
const boxInRect = (b, z) => b.x + b.w / 2 > z.x0 && b.x - b.w / 2 < z.x1 && b.y + b.h > z.y0 && b.y < z.y1;


function scrape(s, pl, hx, hy) {
  const hurt = hurtPlayer(s, pl.x + hx);
  const nx = -hx;
  const ny = -hy;
  const pushed = { ...planeBox(pl), x: pl.x + nx * PLANE.SCRAPE_PUSH, y: pl.y - PLANE.H / 2 + ny * PLANE.SCRAPE_PUSH };
  if (boxFree(s.world, pushed)) {
    pl.x = pushed.x;
    pl.y = pushed.y + PLANE.H / 2;
  }
  if (hx) pl.heading = wrap(Math.PI - pl.heading);
  if (hy) pl.heading = wrap(-pl.heading);
  pl.v = PLANE.SCRAPE_V;
  if (pl.loopT > 0) {
    pl.loopT = 0; 
    ev(s, { type: 'loopEnd', x: pl.x, y: pl.y, broken: true });
  }
  pl.scrapes += 1;
  ev(s, { type: 'scrape', x: pl.x, y: pl.y, hurt, first: pl.scrapes === 1 }); 
}
const ev = (s, e) => s.events.push(e);


function softZones(s, pl) {
  const zones = s.level.softs ?? [];
  const guard = stripGuard(s);
  if (!zones.length && !guard) return;
  const b = planeBox(pl);
  for (const z of guard ? [...zones, guard] : zones) {
    const inside = boxInRect(b, z);
    const was = pl.inSoft.includes(z.id);
    if (inside && !was) {
      if (pl.rollT > 0 && z.skin !== 'guyline') {
        pl.inSoft.push(z.id);
        ev(s, { type: 'softZip', id: z.id, skin: z.skin, x: pl.x, y: pl.y });
      } else if (z.skin === 'fluff') {
        pl.inSoft.push(z.id);
        pl.fluffT = PLANE.FLUFF_T;
        pl.v = Math.max(0, pl.v - PLANE.FLUFF_SLOW);
        ev(s, { type: 'fluffStick', id: z.id, x: pl.x, y: pl.y }); 
      } else {
        pushOut(pl, b, z);
        const first = !pl.told[z.skin];
        pl.told[z.skin] = true;
        if (z.skin === 'guyline') ev(s, { type: 'stripRefused', x: pl.x, y: pl.y, first });
        else ev(s, { type: 'softBump', id: z.id, skin: z.skin, x: pl.x, y: pl.y, first }); 
      }
    } else if (!inside && was) pl.inSoft = pl.inSoft.filter((id) => id !== z.id);
  }
}


function pushOut(pl, b, z) {
  const pens = [
    { d: b.x + b.w / 2 - z.x0, nx: -1, ny: 0 },
    { d: z.x1 - (b.x - b.w / 2), nx: 1, ny: 0 },
    { d: b.y + b.h - z.y0, nx: 0, ny: -1 },
    { d: z.y1 - b.y, nx: 0, ny: 1 },
  ].sort((a, c) => a.d - c.d);
  const { d, nx, ny } = pens[0];
  pl.x += nx * (d + 0.01);
  pl.y += ny * (d + 0.01);
  const a = wrap(pl.heading + PLANE.SOFT_TURN);
  const c = wrap(pl.heading - PLANE.SOFT_TURN);
  const along = (h) => Math.cos(h) * nx + Math.sin(h) * ny;
  pl.heading = along(a) >= along(c) ? a : c;
  pl.loopT = 0;
}


function stripGuard(s) {
  const f = finishOf(s);
  if (!f?.landing || f.alive) return null;
  return { id: 'strip-guard', skin: 'guyline', x0: f.landing.x0, x1: f.landing.x1, y0: f.landing.y, y1: f.landing.y + 3 };
}

const finishOf = (s) => {
  s.finishRef ??= s.entities.findIndex((e) => e.kind === 'finish');
  return s.entities[s.finishRef];
};


function landing(s, pl) {
  const f = finishOf(s);
  const L = f?.landing;
  if (!L || !f.alive || pl.loopT > 0) return false;
  const bottom = pl.y - PLANE.H / 2;
  if (pl.x < L.x0 || pl.x > L.x1 || bottom > L.y + 0.35 || bottom < L.y - 0.6) return false;
  if (Math.abs(Math.sin(pl.heading)) > Math.sin(PLANE.LAND_ANGLE) + 1e-9 || Math.sin(pl.heading) > 0.05) return false;
  pl.stage = 'touchdown';
  pl.stageT = 0;
  pl.landing = L;
  pl.landV = pl.v;
  pl.heading = Math.cos(pl.heading) >= 0 ? 0 : Math.PI;
  pl.rollT = 0;
  pl.y = L.y + PLANE.H / 2;
  ev(s, { type: 'touchdown', x: pl.x, y: pl.y });
  return true;
}


function stepGun(s, pl) {
  const ctx = { world: s.world, session: s, player: s.player, events: s.events };
  if (pl.gunT > 0) pl.gunT -= STEP;
  if (pl.gunT <= 0 && !s.cleared) {
    for (const e of s.entities) {
      if (!GUN_KINDS.has(e.kind) || !fighting(e)) continue;
      const dx = e.x - pl.x;
      const dy = e.y + e.h / 2 - pl.y;
      if (Math.hypot(dx, dy) > PLANE.GUN_RANGE) continue;
      if (Math.abs(wrap(Math.atan2(dy, dx) - pl.heading)) > PLANE.GUN_CONE) continue;
      const nose = PLANE.W / 2;
      pl.peas.push({
        x: pl.x + Math.cos(pl.heading) * nose,
        y: pl.y + Math.sin(pl.heading) * nose,
        vx: Math.cos(pl.heading) * PLANE.PEA_SPEED,
        vy: Math.sin(pl.heading) * PLANE.PEA_SPEED,
        life: PLANE.PEA_LIFE,
      });
      pl.gunT = PLANE.GUN_EVERY;
      ev(s, { type: 'pea', x: pl.x, y: pl.y, target: e.id });
      break;
    }
  }
  const T = s.world.tile;
  pl.peas = pl.peas.filter((q) => {
    q.x += q.vx * STEP;
    q.y += q.vy * STEP;
    q.life -= STEP;
    if (q.life <= 0) return false;
    if (s.world.solid(Math.floor(q.x / T), Math.floor(q.y / T))) return false; 
    for (const e of s.entities) {
      if (!GUN_KINDS.has(e.kind) || !fighting(e)) continue;
      if (Math.abs(q.x - e.x) > e.w / 2 + 0.15 || q.y < e.y - 0.15 || q.y > e.y + e.h + 0.15) continue;
      e.hp = (e.hp ?? 1) - 1;
      ev(s, { type: 'peaHit', id: e.id, hp: e.hp, x: q.x, y: q.y });
      if (e.hp <= 0) defeat(e, ctx, 'gun');
      return false;
    }
    return true;
  });
}


function stepDarts(s, pl) {
  if (!pl.darts.length) return;
  const T = s.world.tile;
  const b = planeBox(pl);
  pl.darts = pl.darts.filter((d) => {
    d.x += d.vx * STEP;
    d.y += d.vy * STEP;
    d.life -= STEP;
    if (d.life <= 0 || s.world.solid(Math.floor(d.x / T), Math.floor(d.y / T))) return false;
    const touch = Math.abs(d.x - b.x) < (b.w + PLANE.DART) / 2 && d.y > b.y - PLANE.DART / 2 && d.y < b.y + b.h + PLANE.DART / 2;
    if (!touch || pl.iframes || s.dead > 0) return true;
    if (hurtPlayer(s, d.x)) {
      ev(s, { type: 'dartHit', owner: d.owner, x: d.x, y: d.y });
      return false;
    }
    return true;
  });
}


export function respawnPlane(s, at) {
  startPlane(s, at, true);
  s.invuln = INVULN_TIME;
}
