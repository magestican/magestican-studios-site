


















import { hurtPlayer, INVULN_TIME, stepDefeated } from './combat.js';
import { STEP } from './constants.js';
import { overlaps, registerKind } from './entities.js';
import { nearestOnRail, posAt, radiusAt } from './track.js';


export const TRAIN = Object.freeze({
  CRUISE: 8, 
  BRAKE: 3.5,
  BOOST: 13,
  BOOST_T: 1.2, 
  LAUNCH_ACCEL: 8, 
  CRUISE_ACCEL: 6, 
  BOOST_ACCEL: 30,
  BOOST_EASE: 12.5, 
  BRAKE_DECEL: 16,
  CHARGES0: 2,
  CHARGES_MAX: 3,
  SPARK_T: 4, 
  TIGHT_R: 6, 
  CURVE_V: 10,
  SQUEAL_T: 0.4,
  LOCK: 1.5, 
  THROW_RANGE: 30,
  REACH: 9, 
  ENGINE: 4,
  WEDGE: 1.2,
  TENDER: 3,
  HOPPER: 3.5,
  GAP: 0.5,
  HALF_W: 1, 
  FLING_MIN: 12,
  FLING_K: 1.5,
  FLING_HEAVY: 1.5,
  FLING_T: 0.8,
  FLING_APEX: 3,
  AIM_CONE: (15 * Math.PI) / 180,
  AIM_RANGE: 12,
  CHAIN_R: 1.1, 
  HALT_T: 2, 
  REWIND: 8, 
  HOP_RANGE: 12, 
  HOP_WINDUP: 0.4,
  HOP_AIR: 0.8,
  PEA_R: 0.6,
  LADDER_T: 1.0, 
});

const RAIL_FOES = new Set(['bandit', 'pillbug', 'handcar']);
const POWER_UPS = new Set(['windupKey', 'shellShield', 'sparkWheels']);


function parseRailPos(str) {
  const [rail, s] = str.split(':s');
  return { rail, s: Number(s) };
}





export function createTrain(level, at) {
  const passes = { ...(at.passes ?? {}) };
  passes[at.rail] = (passes[at.rail] ?? 0) + 1;
  const t = {
    rail: at.rail,
    s: at.s,
    v: at.v ?? 0,
    launched: (at.v ?? 0) > 0,
    boostT: 0,
    charges: at.charges ?? TRAIN.CHARGES0,
    sparkT: 0,
    haltT: 0,
    coupled: !!at.coupled,
    curveT: 0,
    trail: [[at.rail, at.s, at.s]],
    passes,
    
    cars: [],
    prev: { jump: false, dash: false, tether: false },
    stopped: false,
    ladder: 0,
    ladderT: 0,
    said: false, 
    cleared: [], 
    rerail: null,
  };
  layCars(level, t);
  return t;
}

const graph = (level) => level.trackGraph;
const railOf = (level, id) => level.trackGraph.rails[id];


function pointsAhead(level, settings, pos, range) {
  const g = graph(level);
  const out = [];
  let { rail, s } = pos;
  let d = 0;
  for (let guard = 0; guard < 32 && d < range; guard++) {
    const R = g.rails[rail];
    const p = (g.pointsOn[rail] ?? []).find((q) => q.s > s && q.s - s + d <= range);
    if (p) {
      d += p.s - s;
      out.push({ p, d });
      const to = p[settings[p.id]];
      if (to !== rail) {
        rail = to;
        s = 0;
      } else s = p.s;
      continue;
    }
    const ex = g.exits[rail];
    if (!ex) break;
    d += R.length - s;
    rail = ex.rail;
    s = ex.s;
  }
  return out;
}





function advance(level, settings, pos, ds, cb = {}) {
  const g = graph(level);
  let { rail, s } = pos;
  let left = ds;
  for (let guard = 0; guard < 32; guard++) {
    const R = g.rails[rail];
    const target = s + left;
    const p = (g.pointsOn[rail] ?? []).find((q) => q.s > s && q.s <= target);
    if (p) {
      const to = p[settings[p.id]];
      cb.points?.(p, to);
      left = target - p.s;
      if (to !== rail) {
        cb.enter?.(to, 0, p.s);
        rail = to;
        s = 0;
      } else s = p.s;
      continue;
    }
    if (target >= R.length) {
      const ex = g.exits[rail];
      if (!ex) return { rail, s: R.length, buffer: true };
      left = target - R.length;
      cb.enter?.(ex.rail, ex.s, R.length);
      rail = ex.rail;
      s = ex.s;
      continue;
    }
    return { rail, s: target, buffer: false };
  }
  return { rail, s, buffer: false };
}


function behind(t, back) {
  let left = back;
  for (let i = t.trail.length - 1; i >= 0; i--) {
    const [rail, s0, s1] = t.trail[i];
    if (left <= s1 - s0 || i === 0) return { rail, s: s1 - left };
    left -= s1 - s0;
  }
  return { rail: t.rail, s: t.s - left };
}


function pointAlong(level, s, d) {
  const t = s.train;
  const at = d >= 0 ? advance(level, s.points, { rail: t.rail, s: t.s }, d) : behind(t, -d);
  const q = posAt(railOf(level, at.rail), at.s);
  return { rail: at.rail, s: at.s, x: q.x, y: q.y };
}


function carSpecs(t) {
  const cars = [
    ['engine', TRAIN.ENGINE / 2, TRAIN.ENGINE],
    ['tender', TRAIN.ENGINE + TRAIN.GAP + TRAIN.TENDER / 2, TRAIN.TENDER],
  ];
  if (t.coupled) cars.push(['hopper', TRAIN.ENGINE + 2 * TRAIN.GAP + TRAIN.TENDER + TRAIN.HOPPER / 2, TRAIN.HOPPER]);
  return cars;
}


function trainLength(t) {
  return TRAIN.ENGINE + TRAIN.GAP + TRAIN.TENDER + (t.coupled ? TRAIN.GAP + TRAIN.HOPPER : 0);
}

function layCars(level, t) {
  t.cars = carSpecs(t).map(([kind, back, len]) => {
    const f = behind(t, back - len / 2);
    const b = behind(t, back + len / 2);
    const pf = posAt(railOf(level, f.rail), f.s);
    const pb = posAt(railOf(level, b.rail), b.s);
    const L = Math.hypot(pf.x - pb.x, pf.y - pb.y) || 1;
    return { kind, x: (pf.x + pb.x) / 2, y: (pf.y + pb.y) / 2, hx: (pf.x - pb.x) / L, hy: (pf.y - pb.y) / L, len };
  });
}


function onCar(c, x, y, pad) {
  const dx = x - c.x;
  const dy = y - c.y;
  const along = dx * c.hx + dy * c.hy;
  const lat = -dx * c.hy + dy * c.hx;
  return Math.abs(along) <= c.len / 2 + pad && Math.abs(lat) <= TRAIN.HALF_W + pad;
}


export function syncProxy(s) {
  const t = s.train;
  const p = s.player;
  const c = t.cars[0];
  p.px = p.x;
  p.py = p.y;
  p.x = c.x;
  p.y = c.y - 1;
  p.w = 2;
  p.h = 2;
  p.vx = c.hx * t.v;
  p.vy = c.hy * t.v;
  p.grounded = true;
  p.facing = Math.sign(c.hx) || 1;
  p.events.length = 0;
}

function locked(s, p) {
  const sig = s.level.track.signals.find((x) => x.points === p.id);
  return !!sig?.lockUntil && s.signals[sig.id] !== 'green';
}


export function nextThrowable(s) {
  const t = s.train;
  for (const { p, d } of pointsAhead(s.level, s.points, { rail: t.rail, s: t.s }, TRAIN.THROW_RANGE))
    if (d > TRAIN.LOCK && !locked(s, p) && !p.lever) return { p, d }; 
  return null;
}

function throwPoints(s, p, how) {
  s.points[p.id] = s.points[p.id] === 'a' ? 'b' : 'a';
  const q = posAt(railOf(s.level, p.rail), p.s);
  s.events.push({ type: 'pointsThrow', id: p.id, set: s.points[p.id], how, x: q.x, y: q.y });
}


function collect(e, s, how) {
  const t = s.train;
  e.alive = false;
  if (e.kind === 'windupKey') t.charges = Math.min(TRAIN.CHARGES_MAX, t.charges + 1);
  else if (e.kind === 'shellShield')
    s.shield = true; 
  else if (e.kind === 'sparkWheels') t.sparkT = TRAIN.SPARK_T;
  s.events.push({ type: 'powerUp', what: e.kind, id: e.id, how, charges: t.charges, x: e.x, y: e.y });
}

function couple(e, s) {
  const t = s.train;
  e.alive = false;
  t.coupled = true;
  t.haltT = TRAIN.HALT_T;
  s.events.push({ type: 'couple', id: e.id, x: e.x, y: e.y });
  for (const sig of s.level.track.signals.filter((x) => x.lockUntil === 'hopper')) {
    s.signals[sig.id] = 'green';
    if (sig.points) s.points[sig.points] = sig.set ?? 'b';
    s.events.push({ type: 'signal', id: sig.id, state: 'green', points: sig.points, set: s.points[sig.points] });
  }
}


function reach(s) {
  const t = s.train;
  const c = t.cars[0];
  let best = null;
  for (const e of s.entities) {
    if (!e.alive) continue;
    const lever = e.kind === 'hook' && e.lever;
    const target = lever || (POWER_UPS.has(e.kind) && armed(e, t)) || (e.kind === 'cricket' && e.scan);
    if (!target) continue;
    const d = Math.hypot(e.x - c.x, e.y - c.y);
    if (d <= TRAIN.REACH && (!best || d < best.d)) best = { e, d };
  }
  if (!best) {
    s.events.push({ type: 'tetherBoop', how: 'none', x: c.x, y: c.y });
    return;
  }
  const e = best.e;
  s.events.push({ type: 'tetherAttach', id: e.id, what: e.kind, x: e.x, y: e.y });
  if (e.kind === 'hook') {
    const p = s.level.track.points.find((q) => q.id === e.lever);
    if (p && !locked(s, p)) throwPoints(s, p, 'lever');
  } else if (e.kind === 'cricket') {
    if (!e.hidden && t.v <= (e.scan.maxSpeed ?? 4)) {
      e.alive = false;
      s.events.push({ type: 'scan', id: e.id, name: e.name, x: e.x, y: e.y });
      s.events.push({ type: 'secret', secret: 'specimen', id: e.id });
    } else {
      e.hidden = true;
      s.events.push({ type: 'specimenHide', id: e.id, x: e.x, y: e.y });
    }
  } else collect(e, s, 'tether');
}


function derail(s, why, rerail = null, debrisId = null) {
  const t = s.train;
  const c = t.cars[0];
  if (s.invuln > 0) return;
  if (s.shield) {
    s.shield = false;
    s.invuln = INVULN_TIME;
    if (debrisId) t.cleared.push(debrisId);
    s.events.push({ type: 'shieldBreak', how: why, x: c.x, y: c.y });
    return;
  }
  s.hearts -= 1;
  s.derails = (s.derails ?? 0) + 1;
  t.rerail = rerail ?? behind(t, TRAIN.REWIND);
  s.events.push({ type: 'derail', why, x: c.x, y: c.y, hearts: s.hearts, signals: ['visual:derail-tumble', 'audio:derail-crash'] });
  if (s.hearts <= 0) s.events.push({ type: 'down' });
  else s.pitFall = STEP; 
}


export function rerailTrain(s) {
  const old = s.train;
  const at = old.rerail ?? behind(old, TRAIN.REWIND);
  const t = createTrain(s.level, { ...at, passes: old.passes, charges: old.charges, coupled: old.coupled, v: TRAIN.CRUISE });
  t.passes[at.rail] = old.passes[at.rail] ?? 1; 
  t.cleared = old.cleared;
  t.said = old.said;
  s.train = t;
  syncProxy(s);
  s.events.push({ type: 'rerail', rail: at.rail, s: at.s, x: t.cars[0].x, y: t.cars[0].y });
}


export function peaPositions(s) {
  const out = [];
  for (const pe of s.level.track.peas) {
    const t0 = s.peaStart[pe.id];
    if (t0 === undefined) continue;
    const [fx, fy] = pe.from;
    const [tx, ty] = pe.to;
    const len = Math.hypot(tx - fx, ty - fy);
    const life = len / pe.speed;
    const tau = s.time - t0 - (pe.phase ?? 0);
    if (tau < 0) continue;
    const period = pe.period ?? Number.POSITIVE_INFINITY;
    const k1 = Number.isFinite(period) ? Math.floor(tau / period) : 0;
    const k0 = Number.isFinite(period) ? Math.max(0, Math.ceil((tau - life) / period)) : 0;
    for (let k = k0; k <= Math.min(k1, (pe.count ?? Number.POSITIVE_INFINITY) - 1); k++) {
      const age = tau - (Number.isFinite(period) ? k * period : 0);
      if (age < 0 || age > life) continue;
      out.push({ id: pe.id, k, x: fx + ((tx - fx) * age * pe.speed) / len, y: fy + ((ty - fy) * age * pe.speed) / len });
    }
  }
  return out;
}


function fling(s, e, hx, hy, speed) {
  const t = s.train;
  let best = null;
  for (const o of s.entities) {
    if (o === e || !standing(o)) continue;
    const dx = o.x - e.x;
    const dy = o.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d > TRAIN.AIM_RANGE || dx * hx + dy * hy <= 0) continue;
    if (!best || d < best.d) best = { dx, dy, d };
  }
  let [ax, ay] = [hx, hy];
  if (best) {
    const want = Math.atan2(best.dy, best.dx) - Math.atan2(hy, hx);
    const turn = Math.max(-TRAIN.AIM_CONE, Math.min(TRAIN.AIM_CONE, Math.atan2(Math.sin(want), Math.cos(want))));
    [ax, ay] = [hx * Math.cos(turn) - hy * Math.sin(turn), hx * Math.sin(turn) + hy * Math.cos(turn)];
  }
  e.flung = true;
  e.fT = 0;
  e.fvx = ax * speed;
  e.fvy = ay * speed;
  e.z = 0;
  e.facing = Math.sign(ax) || 1;
  t.ladder = t.ladderT > 0 ? t.ladder + 1 : 1;
  t.ladderT = TRAIN.LADDER_T;
  e.flingN = t.ladder;
  s.events.push({
    type: 'fling',
    id: e.id,
    kind: e.kind,
    n: t.ladder,
    use: e.use ?? null,
    motif: e.motif ?? null,
    x: e.x,
    y: e.y,
    vx: e.fvx,
    vy: e.fvy,
  });
}


function standing(o) {
  return o.alive && RAIL_FOES.has(o.kind) && !!o.rail && !o.flung && o.state !== 'dazed' && o.state !== 'scurry';
}

function stepWedge(s) {
  const t = s.train;
  const tip = posAt(railOf(s.level, t.rail), t.s);
  for (const e of s.entities) {
    if (!standing(e)) continue;
    const dx = e.x - tip.x;
    const dy = e.y - tip.y;
    const along = dx * tip.hx + dy * tip.hy;
    const lat = -dx * tip.hy + dy * tip.hx;
    if (along <= 0.5 && along >= -(TRAIN.WEDGE + 0.5) && Math.abs(lat) <= TRAIN.HALF_W + 0.4) {
      const speed = Math.max(TRAIN.FLING_MIN, TRAIN.FLING_K * t.v) * (t.coupled ? TRAIN.FLING_HEAVY : 1);
      fling(s, e, tip.hx, tip.hy, speed);
    }
  }
}

function stepHazards(s, before) {
  const t = s.train;
  const lv = s.level;
  
  for (const d of lv.track.debris) {
    if (t.cleared.includes(d.id) || t.rail !== d.rail) continue;
    if (t.s >= d.s0 && t.s - TRAIN.ENGINE <= d.s1) derail(s, 'debris', d.rerail ? parseRailPos(d.rerail) : null, d.id);
  }
  
  for (const pe of lv.track.peas) {
    if (s.peaStart[pe.id] !== undefined || !pe.start) continue;
    const st = parseRailPos(pe.start.split(':').slice(0, 2).join(':'));
    const pass = Number(pe.start.split(':')[2] ?? 1);
    if (t.rail === st.rail && (t.passes[st.rail] ?? 0) === pass && t.s >= st.s && (before.rail !== t.rail || before.s < st.s))
      s.peaStart[pe.id] = s.time;
  }
  s.peas = peaPositions(s);
  const c = t.cars[0];
  for (const q of s.peas) if (onCar(c, q.x, q.y, TRAIN.PEA_R)) derail(s, 'pea');
  
  const r = radiusAt(railOf(lv, t.rail), t.s);
  if (r <= TRAIN.TIGHT_R && t.v > TRAIN.CURVE_V && t.sparkT <= 0) {
    if (t.curveT === 0) s.events.push({ type: 'curveWarn', x: c.x, y: c.y, signals: ['audio:curve-squeal', 'visual:wagon-tilt'] });
    t.curveT += STEP;
    if (t.curveT > TRAIN.SQUEAL_T) {
      t.curveT = 0;
      derail(s, 'curve');
    }
  } else t.curveT = 0;
}


export function stepTrain(s, input) {
  const t = s.train;
  const lv = s.level;
  const inp = s.cleared ? { jump: false, dash: false, tether: false, down: false } : input;
  const edge = (k) => !!inp[k] && !t.prev[k];
  if (edge('jump')) {
    const n = nextThrowable(s);
    if (n) throwPoints(s, n.p, 'jump');
    else {
      s.events.push({ type: 'noPoints', first: !t.said, x: t.cars[0].x, y: t.cars[0].y });
      t.said = true;
    }
  }
  if (edge('dash') && s.abilities.has('dash')) {
    if (t.charges > 0) {
      t.charges -= 1;
      t.boostT = TRAIN.BOOST_T;
      s.events.push({ type: 'boost', charges: t.charges, x: t.cars[0].x, y: t.cars[0].y });
    } else s.events.push({ type: 'boostEmpty' });
  }
  if (edge('tether')) reach(s);
  t.prev = { jump: !!inp.jump, dash: !!inp.dash, tether: !!inp.tether };
  
  t.boostT = Math.max(0, t.boostT - STEP);
  t.sparkT = Math.max(0, t.sparkT - STEP);
  t.haltT = Math.max(0, t.haltT - STEP);
  t.ladderT = Math.max(0, t.ladderT - STEP);
  const brake = !!inp.down;
  const fast = t.boostT > 0 || t.sparkT > 0;
  const target = t.stopped ? 0 : t.haltT > 0 ? 0 : brake ? TRAIN.BRAKE : fast ? TRAIN.BOOST : TRAIN.CRUISE;
  if (t.v < target) {
    const up = target > TRAIN.CRUISE ? TRAIN.BOOST_ACCEL : t.launched ? TRAIN.CRUISE_ACCEL : TRAIN.LAUNCH_ACCEL;
    t.v = Math.min(target, t.v + up * STEP);
    if (t.v >= TRAIN.CRUISE) t.launched = true;
  } else if (t.v > target) {
    const down = brake || t.haltT > 0 ? TRAIN.BRAKE_DECEL : TRAIN.BOOST_EASE;
    t.v = Math.max(target, t.v - down * STEP);
  }
  
  const before = { rail: t.rail, s: t.s };
  const at = advance(lv, s.points, before, t.v * STEP, {
    points(p, to) {
      s.events.push({ type: 'pointsPass', id: p.id, set: s.points[p.id], to });
      if (p.knock) s.events.push({ type: 'hollowKnock', id: p.id, signals: ['audio:hollow-knock'] });
    },
    enter(rail, s0, prevEnd) {
      t.trail[t.trail.length - 1][2] = prevEnd;
      t.trail.push([rail, s0, s0]);
      t.passes[rail] = (t.passes[rail] ?? 0) + 1;
    },
  });
  t.rail = at.rail;
  t.s = at.s;
  t.trail[t.trail.length - 1][2] = at.s;
  if (at.buffer && !t.stopped) {
    t.stopped = true;
    t.v = 0;
    s.events.push({ type: 'bufferStop', rail: at.rail });
  }
  let total = 0;
  for (const seg of t.trail) total += seg[2] - seg[1];
  while (t.trail.length > 1 && total - (t.trail[0][2] - t.trail[0][1]) >= 40) {
    const seg = t.trail.shift();
    total -= seg[2] - seg[1];
  }
  layCars(lv, t);
  for (const dmd of lv.track.diamonds) {
    const sx = dmd.a === t.rail ? dmd.sa : dmd.b === t.rail ? dmd.sb : null;
    if (sx !== null && before.rail === t.rail && before.s < sx && t.s >= sx) s.events.push({ type: 'diamondClack', id: dmd.id });
  }
  stepHazards(s, before);
  stepWedge(s);
  syncProxy(s);
}




export function stepRailFoe(e, ctx) {
  const s = ctx.session;
  if (e.flung) return stepFlight(e, ctx);
  if (stepDefeated(e)) return;
  if (e.stance === 'hopAt' && !e.rail) return stepHopAt(e, ctx);
  if (e.roll && e.rail) {
    const c = s.train.cars[0];
    if (!e.rolling && Math.hypot(c.x - e.x, c.y - e.y) <= (e.roll.wakeTrack ?? 32)) {
      e.rolling = true;
      ctx.events.push({ type: 'bowl', id: e.id, x: e.x, y: e.y });
    }
    if (e.rolling) {
      e.s -= (e.roll.speed ?? 4) * STEP;
      const q = posAt(railOf(s.level, e.rail), e.s);
      e.x = q.x;
      e.y = q.y;
    }
  }
}

function stepFlight(e, ctx) {
  const s = ctx.session;
  e.fT += STEP;
  e.x += e.fvx * STEP;
  e.y += e.fvy * STEP;
  const u = Math.min(1, e.fT / TRAIN.FLING_T);
  e.z = 4 * TRAIN.FLING_APEX * u * (1 - u);
  const speed = Math.hypot(e.fvx, e.fvy);
  for (const o of s.entities)
    if (o !== e && standing(o) && Math.hypot(o.x - e.x, o.y - e.y) <= TRAIN.CHAIN_R) fling(s, o, e.fvx / speed, e.fvy / speed, speed);
  if (e.fT >= TRAIN.FLING_T) {
    e.flung = false;
    e.z = 0;
    e.rail = null;
    e.state = 'dazed';
    e.t = 0;
    ctx.events.push({ type: 'defeat', id: e.id, kind: e.kind, how: 'fling', x: e.x, y: e.y });
    if (e.specimen) ctx.events.push({ type: 'secret', secret: 'specimen', id: e.id });
  }
}


function stepHopAt(e, ctx) {
  const s = ctx.session;
  const t = s.train;
  e.st = (e.st ?? 0) + STEP;
  const stage = e.stage ?? 'idle';
  if (stage === 'idle') {
    const c = t.cars[0];
    if (Math.hypot(c.x - e.x, c.y - e.y) > (e.hopRange ?? TRAIN.HOP_RANGE)) return;
    const lead = t.v * (TRAIN.HOP_WINDUP + TRAIN.HOP_AIR);
    const off = e.lands === 'behind' ? -(trainLength(t) + 6) : -TRAIN.ENGINE / 2; 
    e.target = pointAlong(s.level, s, off + lead);
    e.stage = 'windup';
    e.st = 0;
    e.hop0 = [e.x, e.y];
    ctx.events.push({ type: 'telegraph', id: e.id, attack: 'hop', seconds: TRAIN.HOP_WINDUP, x: e.x, y: e.y });
    ctx.events.push({
      type: 'landingRing',
      id: e.id,
      x: e.target.x,
      y: e.target.y,
      seconds: TRAIN.HOP_WINDUP + TRAIN.HOP_AIR,
      signals: ['visual:pink-ring'],
    });
  } else if (stage === 'windup' && e.st >= TRAIN.HOP_WINDUP) {
    e.stage = 'hop';
    e.st = 0;
    ctx.events.push({ type: 'hop', id: e.id });
  } else if (stage === 'hop') {
    const u = Math.min(1, e.st / TRAIN.HOP_AIR);
    e.x = e.hop0[0] + (e.target.x - e.hop0[0]) * u;
    e.y = e.hop0[1] + (e.target.y - e.hop0[1]) * u;
    e.z = 4 * 3 * u * (1 - u);
    if (u < 1) return;
    e.z = 0;
    e.stage = 'landed';
    const hit = t.cars.some((c) => onCar(c, e.x, e.y, 0.4));
    if (hit) {
      hurtPlayer(s, e.x); 
      ctx.events.push({ type: 'kick', id: e.id, x: e.x, y: e.y });
      e.state = 'dazed';
      e.t = 0;
    } else if (e.lands === 'behind') {
      e.state = 'dazed'; 
      e.t = 0;
    } else {
      e.rail = e.target.rail; 
      e.s = e.target.s;
      e.stance = 'stand';
      ctx.events.push({ type: 'land', id: e.id, x: e.x, y: e.y, onRails: true });
    }
  }
}


function armed(e, t) {
  return !e.pass || (t.passes[e.rail] ?? 0) >= e.pass;
}


for (const kind of ['windupKey', 'sparkWheels'])
  registerKind(kind, {
    create(e) {
      e.w = 1;
      e.h = 1;
    },
    step(e, ctx) {
      const t = ctx.session?.train;
      if (!t || !armed(e, t)) return;
      if (overlaps(e, ctx.player)) collect(e, ctx.session, 'run');
    },
  });


registerKind('hopper', {
  create(e) {
    e.w = 1.5;
    e.h = 1.5;
  },
  step(e, ctx) {
    if (ctx.session?.train && overlaps(e, ctx.player)) couple(e, ctx.session);
  },
});


registerKind('handcar', {
  create(e) {
    e.w = 2;
    e.h = 1;
  },
  step(e, ctx) {
    if (ctx.session?.train) stepRailFoe(e, ctx);
  },
});



registerKind('cricket', {
  create(e) {
    e.w = 0.6;
    e.h = 0.6;
    e.hidden = false;
  },
  step(e, ctx) {
    const t = ctx.session?.train;
    if (!t) return;
    const c = t.cars[0];
    const d = Math.hypot(c.x - e.x, c.y - e.y);
    if (d <= TRAIN.REACH && t.v > (e.scan?.maxSpeed ?? 4) && !e.hidden) {
      e.hidden = true;
      ctx.events.push({ type: 'specimenHide', id: e.id, x: e.x, y: e.y });
    } else if (d > TRAIN.REACH + 3) e.hidden = false;
  },
});


export function defaultPoints(level) {
  return Object.fromEntries(level.track.points.map((p) => [p.id, p.set ?? 'a']));
}


export function defaultSignals(level) {
  return Object.fromEntries(level.track.signals.map((g) => [g.id, g.lockUntil ? 'red' : 'green']));
}






export function routeFrom(level, { from = level.trainStart, settings = defaultPoints(level), max = 6000, until = null } = {}) {
  const pts = { ...settings };
  const finish = level.entities.find((e) => e.kind === 'finish' && e.rail);
  const hoppers = level.entities.filter((e) => e.kind === 'hopper' && e.rail);
  const coupled = new Set();
  let pos = { rail: from.rail, s: from.s };
  const segs = [[pos.rail, pos.s, pos.s]];
  let length = 0;
  while (length < max) {
    const at = advance(level, pts, pos, 0.25, {
      enter(rail, s0, prevEnd) {
        segs[segs.length - 1][2] = prevEnd;
        segs.push([rail, s0, s0]);
      },
    });
    length += 0.25;
    segs[segs.length - 1][2] = at.s;
    pos = at;
    for (const h of hoppers)
      if (!coupled.has(h.id) && at.rail === h.rail && at.s >= h.s) {
        coupled.add(h.id);
        for (const g of level.track.signals.filter((x) => x.lockUntil === 'hopper')) if (g.points) pts[g.points] = g.set ?? 'b';
      }
    if (finish && at.rail === finish.rail && at.s >= finish.s) return { ok: true, segs, length };
    if (until?.(at)) return { ok: true, segs, length, until: true };
    if (at.buffer) return { ok: false, segs, length, reason: `buffer stop at the end of ${at.rail}` };
  }
  return { ok: false, segs, length, reason: `no finish within ${max} u (a loop?)` };
}





export function placeTrain(s, { rail = null, s: at = null, x = null, y = null, points = null } = {}) {
  if (points) Object.assign(s.points, points);
  let pos = null;
  if (rail && s.level.trackGraph.rails[rail]) pos = { rail, s: at ?? 0 };
  else if (x !== null) {
    for (const [id, R] of Object.entries(s.level.trackGraph.rails)) {
      const q = nearestOnRail(R, x, y ?? 0);
      if (!pos || q.d < pos.d) pos = { rail: id, s: q.s, d: q.d };
    }
  }
  if (!pos) return;
  const t = createTrain(s.level, { rail: pos.rail, s: pos.s, charges: s.train.charges, coupled: s.train.coupled });
  s.train = t;
  syncProxy(s);
}
