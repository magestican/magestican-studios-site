





























import { sweepX, sweepY } from '../body.js';
import { STEP } from '../constants.js';
import { overlaps, registerKind } from '../entities.js';

const D = Math.PI / 180;
export const ACE = Object.freeze({
  W: 1.6,
  H: 0.6,
  HP: 3,
  SPEED: 11.5,
  TURN: 140 * D,
  LEADER_W: 2.2,
  LEADER_H: 0.8,
  LEADER_HP: 6,
  LEADER_SPEED: 12,
  LEADER_TURN: 160 * D,
  START_V: 3, 
  RAMP: 15, 
  TAKEOFF_T: 0.6, 
  FIRST_FIRE: 1.8, 
  BEHIND: 2, 
  CONE: 8 * D,
  RANGE: 12,
  TELEGRAPH: 0.5,
  LEADER_TELEGRAPH: 0.7,
  DARTS: 3,
  DART_GAP: 0.15,
  DART_SPEED: 18,
  DART_LIFE: 1.2,
  COOL: 1.5,
  LEADER_EVERY: 2.5,
  FAN: [-12, -6, 0, 6, 12],
  SPACING: 0.5, 
  WAKE_REACH: 30, 
  GLIDE_V: 4,
  GLIDE_SINK: 3,
  
  SCRAMBLE_T: 2.0,
  SCRAMBLE_GAP: 0.4,
  HOLD_Y: 70,
  CLIMB_V: 10,
  A1_AHEAD: 34, 
  A2_BEHIND: 16, 
  A2_ABOVE: 5,
  V_AHEAD: 16,
  V_ABOVE: 6,
  V_PASS: 1.0, 
  V_TURN_IN: 1.0, 
  V_BEHIND: 10, 
  COAST: 0.6, 
  V_CLOSE: 8, 
});

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const cy = (e) => e.y + e.h / 2;
const speedOf = (e) => (e.leader ? ACE.LEADER_SPEED : ACE.SPEED);
const turnOf = (e) => (e.leader ? ACE.LEADER_TURN : ACE.TURN);
const isDown = (e) => !e.alive || !!e.down || e.state === 'dazed' || e.state === 'scurry';


function place(e, x, y) {
  e.x = x;
  e.y = y - e.h / 2;
}

function fly(e, dirTo, v) {
  if (dirTo !== null) {
    const d = wrap(dirTo - e.dir);
    e.dir = wrap(e.dir + Math.sign(d) * Math.min(Math.abs(d), turnOf(e) * STEP));
  }
  e.v = v;
  e.vx = Math.cos(e.dir) * v;
  e.vy = Math.sin(e.dir) * v;
  e.x += e.vx * STEP;
  e.y += e.vy * STEP;
  e.facing = Math.sign(e.vx) || e.facing;
}


function pursue(e, pl) {
  const tx = pl.x - Math.cos(pl.heading) * ACE.BEHIND;
  const ty = pl.y - Math.sin(pl.heading) * ACE.BEHIND;
  const v = Math.min(speedOf(e), (e.v ?? ACE.START_V) + ACE.RAMP * STEP);
  fly(e, Math.atan2(ty - cy(e), tx - e.x), v);
}


function inCone(e, pl) {
  const dx = pl.x - e.x;
  const dy = pl.y - cy(e);
  return Math.hypot(dx, dy) <= ACE.RANGE && Math.abs(wrap(Math.atan2(dy, dx) - e.dir)) <= ACE.CONE;
}

function startTelegraph(e, s, ctx) {
  
  if (e.squadron && s.aero?.phase !== 'V' && s.time - (s.aceTel ?? -99) < ACE.SPACING) return;
  s.aceTel = s.time;
  const seconds = e.leader ? ACE.LEADER_TELEGRAPH : ACE.TELEGRAPH;
  e.fire = { t: 0, tel: seconds, shot: 0 };
  ctx.events.push({
    type: 'telegraph',
    id: e.id,
    attack: e.leader ? 'fan' : 'darts',
    seconds,
    x: e.x,
    y: cy(e),
    signals: ['visual:hot-pink-eyes', 'audio:rising-whine'],
  });
}

function stepFire(e, s, ctx) {
  const f = e.fire;
  f.t += STEP;
  if (f.t < f.tel - 1e-9) return;
  const darts = s.plane.darts;
  const shoot = (a) =>
    darts.push({
      x: e.x + Math.cos(a) * (e.w / 2),
      y: cy(e) + Math.sin(a) * (e.w / 2),
      vx: Math.cos(a) * ACE.DART_SPEED,
      vy: Math.sin(a) * ACE.DART_SPEED,
      life: ACE.DART_LIFE,
      owner: e.id,
    });
  if (e.leader) {
    for (const deg of ACE.FAN) shoot(e.dir + deg * D);
    ctx.events.push({ type: 'aceFire', id: e.id, attack: 'fan', x: e.x, y: cy(e) });
    e.fire = null;
    e.cool = ACE.LEADER_EVERY;
    return;
  }
  const due = f.tel + f.shot * ACE.DART_GAP;
  if (f.t >= due - 1e-9) {
    shoot(e.dir);
    f.shot += 1;
    ctx.events.push({ type: 'aceFire', id: e.id, attack: 'darts', n: f.shot, x: e.x, y: cy(e) });
    if (f.shot >= ACE.DARTS) {
      e.fire = null;
      e.cool = ACE.COOL;
    }
  }
}

registerKind('ace', {
  create(e) {
    e.w = e.leader ? ACE.LEADER_W : ACE.W;
    e.h = e.leader ? ACE.LEADER_H : ACE.H;
    e.hp ??= e.leader ? ACE.LEADER_HP : ACE.HP;
    e.home = { x: e.x, y: e.y };
    e.stage = 'perch';
    e.st = 0;
    e.dir = Math.PI; 
    e.v = 0;
    e.cool = 0;
    e.fire = null;
    e.facing = -1;
  },
  step(e, ctx) {
    const s = ctx.session;
    const pl = s.plane;
    if (!pl) return;
    if (e.state === 'dazed' || e.stage === 'downed') return stepDowned(e, ctx);
    e.st += STEP;
    if (e.cool > 0) e.cool -= STEP;
    if (e.stage === 'perch') {
      const ww = e.wakeWhen;
      if (!ww || pl.stage !== 'fly' || pl.x < ww.x || pl.x - ww.x > ACE.WAKE_REACH) return;
      wake(e, ctx, e.headOn ? 'toLane' : 'chase');
      return;
    }
    if (e.stage === 'climb') {
      if (e.st < e.climbDelay) return;
      if (e.st - e.climbDelay < 1e-9 + STEP) ctx.events.push({ type: 'aceTakeoff', id: e.id, role: e.role, x: e.x, y: e.y });
      e.dir = Math.PI / 2;
      e.y = Math.min(ACE.HOLD_Y, e.y + ACE.CLIMB_V * STEP);
      if (e.y >= ACE.HOLD_Y - 1e-9) {
        e.stage = 'hold';
        e.st = 0;
        e.dir = Math.PI;
      }
      return;
    }
    if (e.stage === 'hold') {
      e.dir = Math.PI + 0.3 * Math.sin(e.st * 2); 
      return;
    }
    if (e.stage === 'toLane') {
      const k = Math.min(1, e.st / ACE.TAKEOFF_T);
      const from = e.laneFrom ?? { x: e.home.x, y: cy({ y: e.home.y, h: e.h }) };
      place(e, from.x + (e.headOn.from - from.x) * k, from.y + (e.headOn.y - from.y) * k);
      e.dir = e.headOn.to < e.headOn.from ? Math.PI : 0;
      e.v = speedOf(e);
      if (k >= 1) {
        e.stage = 'headOn';
        e.st = 0;
        e.fired = false;
      }
    } else if (e.stage === 'headOn') {
      fly(e, null, speedOf(e));
      place(e, e.x, e.headOn.y);
      const closing = speedOf(e) + Math.max(0, Math.cos(pl.heading) * -Math.cos(e.dir)) * pl.v;
      const range = Math.abs(pl.x - e.x);
      const ahead = (pl.x - e.x) * Math.cos(e.dir) > 0;
      if (!e.fired && !e.fire && ahead && range <= ACE.RANGE + closing * (e.leader ? ACE.LEADER_TELEGRAPH : ACE.TELEGRAPH)) {
        e.fired = true;
        startTelegraph(e, s, ctx);
      }
      const end = e.dir === Math.PI ? e.x <= e.headOn.to : e.x >= e.headOn.to;
      if (end) {
        e.stage = e.chase ? 'chase' : 'gone';
        e.st = 0;
        if (e.chase) ctx.events.push({ type: 'aceChase', id: e.id, x: e.x, y: e.y });
      }
    } else if (e.stage === 'chase') {
      pursue(e, pl);
      if (!e.fire && e.cool <= 0 && e.st >= ACE.FIRST_FIRE && pl.stage === 'fly' && s.dead === 0 && inCone(e, pl))
        startTelegraph(e, s, ctx);
      if (e.leader && !s.aero?.vClose && s.aero?.phase === 'V' && Math.hypot(pl.x - e.x, pl.y - cy(e)) <= ACE.V_CLOSE) {
        s.aero.vClose = true;
        ctx.events.push({ type: 'vClose', id: e.id, x: e.x, y: e.y }); 
      }
    } else if (e.stage === 'formation') {
      const lead = s.entities.find((x) => x.squadron === e.squadron && x.role === e.formation.lead);
      if (!lead || isDown(lead) || lead.spun !== undefined) {
        
        e.stage = 'pass';
        e.st = 0;
        e.passFor = ACE.COAST;
        return;
      }
      const [along, across] = e.formation.slot;
      const tx = lead.x + Math.cos(lead.dir) * along - Math.sin(lead.dir) * across;
      const ty = cy(lead) + Math.sin(lead.dir) * along + Math.cos(lead.dir) * across;
      const d = Math.hypot(tx - e.x, ty - cy(e));
      const max = 20 * STEP;
      const k = d <= max ? 1 : max / d;
      e.vx = ((tx - e.x) * k) / STEP;
      e.vy = ((ty - cy(e)) * k) / STEP;
      place(e, e.x + (tx - e.x) * k, cy(e) + (ty - cy(e)) * k);
      e.dir = lead.dir;
      e.v = lead.v;
    } else if (e.stage === 'pass') {
      fly(e, null, speedOf(e));
      if (e.st >= (e.passFor ?? ACE.V_PASS) - 1e-9) {
        if (e.passFor === undefined && e.leader) {
          
          e.stage = 'turnIn';
          e.st = 0;
          e.tin = { x: e.x, y: cy(e) };
        } else {
          e.stage = 'chase';
          e.st = ACE.TAKEOFF_T;
          ctx.events.push({ type: 'aceChase', id: e.id, x: e.x, y: e.y });
        }
      }
    } else if (e.stage === 'turnIn') {
      const k = Math.min(1, e.st / ACE.V_TURN_IN);
      const q = k * k * (3 - 2 * k);
      const tx = pl.x - Math.cos(pl.heading) * ACE.V_BEHIND;
      const ty = pl.y - Math.sin(pl.heading) * ACE.V_BEHIND;
      const ox = e.x;
      const oy = cy(e);
      place(e, e.tin.x + (tx - e.tin.x) * q, e.tin.y + (ty - e.tin.y) * q);
      e.vx = (e.x - ox) / STEP;
      e.vy = (cy(e) - oy) / STEP;
      if (Math.hypot(e.vx, e.vy) > 1e-6) e.dir = Math.atan2(e.vy, e.vx);
      e.v = speedOf(e);
      if (k >= 1) {
        e.dir = pl.heading;
        e.stage = 'chase';
        e.st = ACE.TAKEOFF_T;
        ctx.events.push({ type: 'aceChase', id: e.id, x: e.x, y: e.y });
      }
    } else if (e.stage === 'gone') {
      fly(e, null, speedOf(e));
      if (e.st > 3) e.alive = false;
      return;
    }
    if (e.fire) stepFire(e, s, ctx);
    
    if (overlaps(ctx.player, e) && !e.bumped) {
      e.bumped = true;
      ctx.events.push({ type: 'bump', id: e.id, x: e.x, y: e.y });
    } else if (!overlaps(ctx.player, e)) e.bumped = false;
  },
});

function wake(e, ctx, stage) {
  e.stage = stage;
  e.st = 0;
  e.v = ACE.START_V;
  const pl = ctx.session.plane;
  e.dir = Math.atan2(pl.y - cy(e), pl.x - e.x);
  ctx.events.push({ type: 'aceWake', id: e.id, use: e.use ?? null, stage, x: e.x, y: e.y });
}


function stepDowned(e, ctx) {
  if (e.stage !== 'downed') {
    e.stage = 'downed';
    e.down = true;
    e.fire = null;
    e.sat = false;
    const dir = Math.sign(Math.cos(e.dir ?? Math.PI)) || -1;
    e.vx = dir * ACE.GLIDE_V;
    e.vy = -ACE.GLIDE_SINK;
    ctx.events.push({ type: 'aceDown', id: e.id, role: e.role ?? null, x: e.x, y: e.y });
  }
  if (e.sat) return;
  const mx = sweepX(ctx.world, e, e.vx * STEP);
  e.x = mx.x;
  if (mx.hit) e.vx = 0;
  const my = sweepY(ctx.world, e, e.vy * STEP);
  e.y = my.y;
  if (my.hit) {
    e.sat = true;
    e.vx = 0;
    e.vy = 0;
    ctx.events.push({ type: 'aceLand', id: e.id, x: e.x, y: e.y });
  }
  if (e.y < -2) e.alive = false;
}


export function resetAces(s) {
  for (const e of s.entities) {
    if (e.kind !== 'ace' || isDown(e)) continue;
    e.x = e.home.x;
    e.y = e.home.y;
    e.stage = 'perch';
    e.st = 0;
    e.v = 0;
    e.vx = 0;
    e.vy = 0;
    e.dir = Math.PI;
    e.fire = null;
    e.cool = 0;
    e.spun = undefined;
    e.laneFrom = undefined;
  }
  if (s.aero) s.aero = { phase: 'idle', t: 0, done: s.aero.done };
}

const ROLES = ['A1', 'A2', 'V'];
const inRole = (e, r) => (r === 'V' ? e.role === 'leader' || e.role === 'W1' || e.role === 'W2' : e.role === r);


export function stepAerodrome(s) {
  const pl = s.plane;
  if (!pl) return;
  const sq = s.entities.filter((e) => e.kind === 'ace' && e.squadron);
  if (!sq.length) return;
  s.aero ??= { phase: 'idle', t: 0 };
  const A = s.aero;
  const ev = s.events;
  const startX = sq[0].scrambleX ?? Infinity;
  
  if (!s.deedLost && pl.x >= startX - 1e-9 && ev.some((x) => x.type === 'hurt')) {
    s.deedLost = true;
    ev.push({ type: 'deedLost', id: 'aerodrome' });
  }
  if (A.done) return;
  A.t += STEP;
  const live = (r) => sq.filter((e) => inRole(e, r) && !isDown(e));
  if (sq.every(isDown)) {
    A.done = true;
    A.phase = 'done';
    ev.push({ type: 'squadronDown', x: pl.x, y: pl.y });
    for (const f of s.entities)
      if (f.kind === 'finish' && f.gate === 'aerodrome' && !f.alive) {
        f.alive = true;
        ev.push({ type: 'finishOpen', id: f.id, gate: 'aerodrome', x: f.x, y: f.y }); 
      }
    for (const c of s.entities)
      if (c.kind === 'cameo' && c.at === 'M5:done' && c.alive) {
        c.alive = false;
        ev.push({
          type: 'bossCameo',
          id: c.id,
          who: 'mandibella',
          name: c.name,
          lines: c.lines ?? null,
          line: 'My ACES! Grounded by a SURVEYOR! ...Very well, darlings. The windowsill it is. Next time I bring the WHOLE swarm.',
          x: c.x,
          y: c.y,
        });
      }
    if (!s.deedLost)
      for (const d of s.entities)
        if (d.kind === 'intel' && d.secret === 'deed' && !d.alive && !s.found.has(String(d.id))) {
          d.alive = true;
          ev.push({ type: 'deedEarned', id: d.id, x: d.x, y: d.y }); 
        }
    return;
  }
  if (A.phase === 'idle') {
    if (pl.stage !== 'fly' || pl.x < startX) return;
    A.phase = 'scramble';
    A.t = 0;
    ev.push({ type: 'scramble', x: pl.x, y: pl.y }); 
    let i = 0;
    for (const e of sq)
      if (!isDown(e) && e.stage === 'perch') {
        e.stage = 'climb';
        e.st = 0;
        e.climbDelay = i++ * ACE.SCRAMBLE_GAP;
      }
    return;
  }
  if (A.phase === 'scramble' && A.t < ACE.SCRAMBLE_T - 1e-9) return;
  const current = ROLES.indexOf(A.phase);
  if (A.phase !== 'scramble' && live(A.phase).length) return; 
  const next = ROLES.slice(current + 1).find((r) => live(r).length);
  if (!next) return;
  A.phase = next;
  A.t = 0;
  const dir = Math.cos(pl.heading) >= 0 ? 1 : -1;
  if (next === 'A1') {
    const [e] = live('A1');
    e.laneFrom = { x: e.x, y: cy(e) };
    e.headOn = { y: pl.y, from: pl.x + dir * ACE.A1_AHEAD, to: pl.x - dir * 40 };
    e.chase = true;
    e.stage = 'toLane';
    e.st = 0;
    ev.push({ type: 'aceDive', id: e.id, role: 'A1', x: e.x, y: e.y });
  } else if (next === 'A2') {
    const [e] = live('A2');
    place(e, pl.x - dir * ACE.A2_BEHIND, pl.y + ACE.A2_ABOVE);
    e.dir = dir > 0 ? 0 : Math.PI;
    e.v = ACE.SPEED;
    e.stage = 'chase';
    e.st = 0;
    ev.push({ type: 'aceDropIn', id: e.id, role: 'A2', x: e.x, y: e.y }); 
  } else {
    const members = live('V');
    const lead = members.find((e) => e.role === 'leader') ?? members[0];
    place(lead, pl.x + dir * ACE.V_AHEAD, pl.y + ACE.V_ABOVE);
    lead.dir = dir > 0 ? Math.PI : 0;
    lead.v = speedOf(lead);
    lead.stage = lead.role === 'leader' ? 'pass' : 'chase';
    lead.st = 0;
    for (const w of members)
      if (w !== lead) {
        place(w, lead.x, cy(lead));
        w.stage = 'formation';
        w.st = 0;
      }
    ev.push({ type: 'vReveal', id: lead.id, x: lead.x, y: lead.y }); 
  }
}
