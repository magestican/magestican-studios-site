






















import { contact, defeat, stompBounce } from './combat.js';
import { STEP } from './constants.js';
import { popShell } from './enemies/snailknight.js';
import { moveBody, overlaps } from './entities.js';

const RING_SPEED = 60; 
const FLIP_TIME = 4.0; 
const RIGHTING_TIME = 0.5; 
const FAR_EVERY = 1.6; 
const SLOW_AFTER = 3; 
const SLOW_STEP = 0.25; 
const START_GAP = 2; 
const SPARE_GAP = 1; 
const FLIPPABLE = new Set(['ladybot', 'pillbug', 'aphid', 'bandit', 'snailknight', 'antPorter']);
const PUNTABLE = new Set([...FLIPPABLE, 'wasp']);


export function createShoe(level, startX) {
  if (!level.shoe) return null;
  const sh = {
    dir: level.dir ?? 1,
    runs: level.shoe.runs.map((r) => ({ ...r, active: false, nextPlan: 0, prevToe: 0, punts: 0, slow: 0 })),
    beats: level.shoe.beats.map((b) => ({ ...b, fired: false })),
    
    pending: [],
    
    rings: [],
    rung: 0, 
    gone: false, 
    farT: 0,
    
    bowls: {},
  };
  resetShoe(sh, startX);
  return sh;
}


export function resetShoe(sh, x) {
  sh.pending = [];
  sh.rings = [];
  sh.farT = 0;
  for (const r of sh.runs) r.active = false;
  for (const b of sh.beats) b.fired = sh.dir * (b.trigger - x) <= 0;
  sh.gone = sh.beats.some((b) => b.final && b.fired && b.landed);
}


const footprint = (sh, toe, foot) => (sh.dir < 0 ? [toe, toe + foot] : [toe - foot, toe]);

const ahead = (sh, a, b) => (sh.dir < 0 ? Math.min(a, b) : Math.max(a, b));


export function stepShoe(s) {
  const sh = s.shoe;
  if (!sh) return;
  const p = s.player;
  const d = sh.dir;
  if (!sh.gone) {
    for (const b of sh.beats) {
      if (b.fired || d * (p.x - b.trigger) < 0) continue;
      b.fired = true;
      const play = b.lane !== 'back';
      const toe = play ? p.x - d * b.lead : b.x;
      const run = play ? sh.runs.find((r) => r.active) : null;
      if (run) {
        sh.pending = sh.pending.filter((f) => f.run !== run.id); 
        run.prevToe = toe;
        run.nextPlan = s.time + run.tempo + run.slow;
      }
      plan(s, {
        toe,
        foot: b.foot,
        tele: b.tele,
        radius: b.radius,
        lane: b.lane,
        use: b.use,
        spare: !!b.spare,
        final: !!b.final,
        beat: b.id,
        run: run?.id ?? null,
      });
    }
    for (const r of sh.runs) {
      const past = d * (p.x - r.xTo) >= 0;
      if (r.active && past) {
        r.active = false;
        r.punts = 0;
        r.slow = 0;
        s.events.push({ type: 'shoeRunEnd', run: r.id });
      } else if (!r.active && !past && d * (p.x - r.xFrom) >= START_GAP) {
        r.active = true;
        r.prevToe = p.x - d * r.lead;
        r.nextPlan = s.time + r.tempo + r.slow;
        s.events.push({ type: 'shoeRun', run: r.id });
        plan(s, { toe: r.prevToe, foot: r.foot, tele: r.tele, radius: r.radius, lane: 'play', run: r.id });
      } else if (r.active && s.time >= r.nextPlan - 1e-9) {
        r.prevToe = ahead(sh, r.prevToe + d * r.stride, p.x - d * r.lead);
        r.nextPlan = s.time + r.tempo + r.slow;
        plan(s, { toe: r.prevToe, foot: r.foot, tele: r.tele, radius: r.radius, lane: 'play', run: r.id });
      }
    }
    if (sh.runs.length && !sh.runs.some((r) => r.active)) {
      sh.farT += STEP;
      if (sh.farT >= FAR_EVERY - 1e-9) {
        sh.farT = 0;
        s.events.push({ type: 'footfallFar' });
      }
    }
  }
  for (const f of [...sh.pending]) {
    if (s.time < f.lands - 1e-9) continue;
    sh.pending.splice(sh.pending.indexOf(f), 1);
    land(s, f);
    if (s.punt > 0) return;
  }
  stepRings(s);
  stepFlipped(s, { world: s.world, session: s, player: p, events: s.events });
}

function plan(s, f) {
  f.lands = s.time + f.tele;
  s.shoe.pending.push(f);
  s.events.push({ type: 'shoePlan', toe: f.toe, foot: f.foot, tele: f.tele, lane: f.lane, use: f.use ?? null, dir: s.shoe.dir });
}

function land(s, f) {
  const sh = s.shoe;
  const p = s.player;
  const touches = (lo, hi, e) => e.x + e.w / 2 > lo && e.x - e.w / 2 < hi;
  if (f.lane !== 'back') {
    let [lo, hi] = footprint(sh, f.toe, f.foot);
    if (touches(lo, hi, p) && f.spare) {
      f.toe = p.x - sh.dir * (SPARE_GAP + p.w / 2);
      [lo, hi] = footprint(sh, f.toe, f.foot);
    }
    if (touches(lo, hi, p)) {
      punt(s, f);
      return;
    }
    for (const e of s.entities) {
      if (!e.alive || !PUNTABLE.has(e.kind) || e.state === 'dazed' || e.state === 'scurry' || !touches(lo, hi, e)) continue;
      e.alive = false;
      s.events.push({ type: 'punted', id: e.id, kind: e.kind, x: e.x, y: e.y, dir: -sh.dir });
    }
  }
  sh.rung += 1;
  sh.rings.push({
    id: sh.rung,
    x: f.toe,
    r: 0,
    radius: f.radius,
    use: f.use ?? null,
    impactY: f.lane === 'back' ? null : topSolid(s.world, f.toe),
    hit: [],
    bowls: 0,
  });
  s.events.push({ type: 'shoeLand', toe: f.toe, foot: f.foot, radius: f.radius, lane: f.lane, use: f.use ?? null, ring: sh.rung });
  if (f.final) {
    const b = sh.beats.find((x) => x.id === f.beat);
    if (b) b.landed = true;
    sh.gone = true;
    sh.pending = [];
    for (const r of sh.runs) r.active = false;
    s.events.push({ type: 'shoeGone' });
  }
}

function punt(s, f) {
  const sh = s.shoe;
  const run = sh.runs.find((r) => r.id === f.run);
  s.punt = STEP;
  s.punts += 1;
  if (s.player.ab) s.player.ab.glideArm = false;
  s.events.push({ type: 'punt', x: s.player.x, y: s.player.y, run: run?.id ?? null, dir: -sh.dir });
  if (!run) return;
  run.punts += 1;
  if (run.punts % SLOW_AFTER === 0) {
    run.slow += SLOW_STEP;
    s.events.push({ type: 'shoeSlow', run: run.id, tempo: run.tempo + run.slow });
  }
}


export function topSolid(world, x) {
  const c = Math.floor(x / world.tile);
  for (let r = world.height - 1; r >= 0; r--) if (world.solid(c, r)) return (r + 1) * world.tile;
  return null;
}


function nearSurface(world, e) {
  const T = world.tile;
  const c = Math.floor(e.x / T);
  for (let r = Math.round(e.y / T) - 1; r >= Math.max(0, Math.round((e.y - 1) / T) - 1); r--)
    if (world.solid(c, r) || world.oneWay(c, r)) return true;
  return false;
}

function stepRings(s) {
  const sh = s.shoe;
  for (const ring of [...sh.rings]) {
    ring.r = Math.min(ring.radius, ring.r + RING_SPEED * STEP);
    for (const e of s.entities) {
      if (!e.alive || !FLIPPABLE.has(e.kind) || ring.hit.includes(e.id)) continue;
      if (Math.abs(e.x - ring.x) - e.w / 2 > ring.r) continue;
      ring.hit.push(e.id);
      if (e.state === 'dazed' || e.state === 'scurry') continue;
      if (!nearSurface(s.world, e)) continue;
      if (ring.impactY !== null && Math.abs(e.y - ring.impactY) > 4) continue;
      flip(s, e, ring);
    }
    if (ring.r >= ring.radius) sh.rings.splice(sh.rings.indexOf(ring), 1);
  }
}

function flip(s, e, ring) {
  if (e.flip?.phase === 'flipped') {
    e.flip.t = 0; 
    s.events.push({ type: 'flip', id: e.id, kind: e.kind, use: e.flip.use, x: e.x, y: e.y, again: true });
    return;
  }
  const prev = e.flip ? e.flip.prev : e.state;
  if (e.dozing) {
    e.dozing = false;
    e.awake = true;
  }
  e.awake = true; 
  e.flip = { t: 0, phase: 'flipped', prev, ring: ring.id, use: ring.use };
  e.state = 'flipped';
  e.vx = 0;
  s.events.push({ type: 'flip', id: e.id, kind: e.kind, use: ring.use, x: e.x, y: e.y });
}

function stepFlipped(s, ctx) {
  const p = s.player;
  for (const e of s.entities) {
    if (!e.alive || !e.flip) continue;
    e.flip.t += STEP;
    e.vx = 0;
    moveBody(e, s.world);
    if (e.flip.phase === 'flipped') {
      if (overlaps(p, e)) {
        bowl(s, e, ctx);
        continue;
      }
      if (e.flip.t >= FLIP_TIME - 1e-9) {
        e.flip.phase = 'righting';
        e.flip.t = 0;
        e.state = 'righting';
        s.events.push({ type: 'righting', id: e.id });
      }
    } else if (e.flip.t >= RIGHTING_TIME - 1e-9) {
      const prev = e.flip.prev;
      e.flip = null;
      e.t = 0;
      e.state = e.flee ? 'scurry' : prev;
      s.events.push({ type: e.flee ? 'flee' : 'righted', id: e.id });
    }
  }
}

function bowl(s, e, ctx) {
  const ring = e.flip.ring;
  const n = (s.shoe.bowls[ring] ?? 0) + 1;
  s.shoe.bowls[ring] = n;
  const use = e.flip.use;
  const p = s.player;
  if (contact(p, e) === 'stomp') stompBounce(p); 
  e.flip = null;
  s.events.push({ type: 'bowl', id: e.id, kind: e.kind, n, use, x: e.x, y: e.y });
  if (e.kind === 'snailknight') popShell(e, ctx, 'bowl');
  else if (e.kind === 'antPorter') {
    e.state = 'scurry'; 
    e.t = 0;
    s.hitstop = Math.max(s.hitstop, 0.06);
  } else defeat(e, ctx, 'bowl');
}
