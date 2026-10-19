






















import { STEP } from '../constants.js';
import { overlaps, registerKind } from '../entities.js';
import { LIGHT } from '../light.js';
import { flip, stepFlipped, stepRing } from '../rings.js';
import { EASE, LAG, makePath, PULL, pathAt } from '../slipstream.js';

export const FLOCK = Object.freeze({
  POP_DELAY: 0.2, 
  BURST_SPEED: 16, 
  SWARM_SPEED: 9, 
  LIFT_PAST: 12, 
  STREAM: 1.0, 
  OPEN: 1.2, 
});
const FLIP_KINDS = new Set(['aphid', 'sprite', 'ladybot', 'pillbug', 'antPorter']);


export function createFlock(level) {
  if (!(level.entities ?? []).some((d) => d.kind === 'bud' || d.kind === 'bloomGate')) return null;
  return { bursts: [], swarms: [], trail: [], calling: null };
}


const slot = (i) => {
  const a = i * 2.39996;
  const r = 0.35 + 0.25 * (i % 3);
  return [Math.cos(a) * r, Math.sin(a) * r * 0.7];
};


function ease(f, tx, ty, tvx = 0, tvy = 0) {
  const k = Math.min(1, EASE * STEP);
  f.vx += ((tx - f.x) * PULL + tvx - f.vx) * k;
  f.vy += ((ty - f.y) * PULL + tvy - f.vy) * k;
  f.x += f.vx * STEP;
  f.y += f.vy * STEP;
}

function popBud(s, e, how) {
  if (e.state !== 'bud') return;
  e.state = 'popping';
  e.popT = FLOCK.POP_DELAY;
  s.events.push({ type: 'budPop', id: e.id, how, use: e.use ?? null, x: e.x, y: e.y, signals: ['visual:bud-burst', 'audio:pomf'] });
}


function startBurst(s, src, cy) {
  const ring = { id: src.id, x: src.x, cy, r: 0, radius: src.burst, speed: FLOCK.BURST_SPEED, hit: [], use: src.use ?? null, t: 0 };
  s.flock.bursts.push(ring);
  s.events.push({ type: 'flockBurst', id: src.id, x: src.x, y: cy, radius: src.burst, use: ring.use, flies: src.flies ?? 0 });
}

function burstBud(s, e) {
  e.state = 'spent';
  const cy = e.y + e.h / 2;
  startBurst(s, e, cy);
  if (!e.flies || !e.perches?.length) return;
  const path = makePath({ x: e.x, y: cy, path: e.perches });
  const flies = [];
  for (let i = 0; i < e.flies; i++) {
    const [ox, oy] = slot(i);
    flies.push({ x: e.x + ox, y: cy + oy, vx: 0, vy: 0 });
  }
  s.flock.swarms.push({
    id: e.id,
    use: e.use ?? null,
    perches: e.perches,
    perched: e.perches.map(() => false),
    cum: path.cum.slice(1),
    path,
    d: 0,
    state: 'fly', 
    flies,
  });
}

registerKind('bud', {
  create(e) {
    e.w = 1;
    e.h = 1.5;
    e.state = 'bud'; 
    e.lit = false;
  },
  step(e, ctx) {
    const s = ctx.session;
    if (e.state === 'bud' && overlaps(ctx.player, e)) popBud(s, e, 'touch');
    if (e.state === 'popping') {
      e.popT -= STEP;
      if (e.popT <= 1e-9) burstBud(s, e);
    }
  },
});

registerKind('bloomGate', {
  create(e) {
    e.state = 'closed'; 
    e.gt = 0;
  },
  step(e, ctx) {
    const s = ctx.session;
    if (e.state === 'closed') {
      if (ctx.player.x < e.call) return;
      e.state = 'call';
      e.gt = 0;
      s.flock.calling = e.id;
      ctx.events.push({ type: 'flockCall', id: e.id, x: ctx.player.x, y: ctx.player.y, flies: s.flock.trail.length });
      return;
    }
    if (e.state === 'open') {
      
      if (e.lampOut || s.flock.bursts.some((b) => b.id === e.id && !b.done)) return;
      e.lampOut = true;
      for (const f of s.entities)
        if (f.kind === 'finish' && f.bloomGate === e.id && !f.alive) {
          f.alive = true;
          ctx.events.push({ type: 'finishOpen', id: f.id, x: f.x, y: f.y });
        }
      return;
    }
    e.gt += STEP;
    if (e.state === 'call' && e.gt >= FLOCK.STREAM - 1e-9) {
      e.state = 'opening';
      ctx.events.push({ type: 'bloomOpening', id: e.id, x: e.x, y: e.y, seconds: FLOCK.OPEN });
    }
    if (e.state === 'opening' && e.gt >= FLOCK.STREAM + FLOCK.OPEN - 1e-9) {
      e.state = 'open';
      ctx.events.push({ type: 'bloom', id: e.id, use: e.use ?? null, x: e.x, y: e.y });
      startBurst(s, e, e.y + e.h / 2);
    }
  },
});

const canFlip = (e) => FLIP_KINDS.has(e.kind) && !e.ghost && e.state !== 'dazed' && e.state !== 'scurry';


export function stepFlock(s) {
  const F = s.flock;
  const p = s.player;
  const ctx = { world: s.world, session: s, player: p, events: s.events };
  for (const ring of F.bursts) {
    ring.t += STEP;
    if (ring.done) continue;
    ring.done = stepRing(ring, s.entities, canFlip, (e) => flip(s, e, ring));
    for (const b of s.entities)
      if (b.kind === 'bud' && b.state === 'bud' && Math.hypot(b.x - ring.x, b.y + b.h / 2 - ring.cy) - b.w / 2 <= ring.r)
        popBud(s, b, 'chain');
  }
  F.bursts = F.bursts.filter((r) => !r.done || r.t < LIGHT.BURST_TIME);
  if (!s.shoe && !s.ripple) stepFlipped(s, ctx); 
  for (const sw of F.swarms) {
    if (sw.state === 'fly') {
      sw.d = Math.min(sw.path.len, sw.d + FLOCK.SWARM_SPEED * STEP);
      for (let k = 0; k < sw.perches.length; k++)
        if (!sw.perched[k] && sw.d >= sw.cum[k] - 1e-9) {
          sw.perched[k] = true;
          s.events.push({ type: 'perch', id: sw.id, k, use: sw.use, x: sw.perches[k][0], y: sw.perches[k][1] });
        }
      if (sw.perched.every(Boolean)) sw.state = 'perched';
    }
    const last = sw.perches[sw.perches.length - 1];
    if (sw.state === 'perched' && p.x >= last[0] + FLOCK.LIFT_PAST) {
      sw.state = 'lifted';
      s.events.push({ type: 'flockJoin', id: sw.id, flies: sw.flies.length });
      F.trail.push(...sw.flies);
      sw.flies = [];
    }
    if (sw.state === 'lifted') continue;
    const at = pathAt(sw.path, sw.d);
    const flying = sw.state === 'fly';
    const n = sw.perches.length;
    sw.flies.forEach((f, i) => {
      const [ox, oy] = slot(i);
      const k = i % n;
      if (sw.perched[k] && (!flying || sw.d >= sw.cum[k])) ease(f, sw.perches[k][0] + ox, sw.perches[k][1] + 0.4 + oy);
      else ease(f, at.x + ox, at.y + oy, flying ? at.dx * FLOCK.SWARM_SPEED : 0, flying ? at.dy * FLOCK.SWARM_SPEED : 0);
    });
  }
  
  const gate = F.calling ? s.entities.find((e) => e.id === F.calling) : null;
  const tx = gate ? gate.x : p.x - p.facing * (LAG + 0.5);
  const ty = gate ? gate.y + gate.h / 2 : p.y + p.h + LAG;
  F.trail.forEach((f, i) => {
    const [ox, oy] = slot(i);
    ease(f, tx + ox * 2, ty + oy * 2);
  });
}
