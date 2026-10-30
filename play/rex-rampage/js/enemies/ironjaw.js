






import { add, scale, v3 } from '../combat/vec.js';
import { spawnEnemy } from './enemy.js';

const FAR = 22; 
const NEAR = 7; 
const JAW_UP = 4.2;
const IDLE_S = 2.5;
const CLOSE_S = 1.2;
const BACK_S = 1.5;
const STAGGER_HITS = 6;
const THROW_EVERY = { 1: 4, 2: 5 };
const ROCKET_EVERY = 3;
const FINALE_S = 3;
const PLATE_AT = [
  [-0.7, 0.45],
  [0.7, 0.45],
  [-0.7, -0.45],
  [0.7, -0.45],
  
  [0, 0.95],
  [0, -0.95],
  [-1.3, 0],
  [1.3, 0],
];




export function createIronJaw({ hpScale, makeId, plates = 4 }) {
  const boss = {
    phase: 1,
    t: 0,
    
    pos: v3(),
    dist: FAR,
    sway: 0,
    down: false,
    done: false,
    finale: -1,
    hpScale,
    makeId,
    
    adds: [],
    
    parts: { plates: [], jaw: null, varga: null },
    charge: { state: 'idle', t: 0, hpAtWarn: 0 },
    throwT: 2,
    thrown: 0,
    rocketT: 1.5,
  };
  for (let i = 0; i < Math.min(plates, PLATE_AT.length); i++) boss.parts.plates.push(part(boss, 'plate'));
  return boss;
}

function part(boss, kind) {
  const e = spawnEnemy({ kind, wave: 'boss', place: { ahead: FAR, side: 0, up: JAW_UP } }, frameOf(null), 0, boss.hpScale, boss.makeId());
  boss.adds.push(e);
  return e;
}

const frameOf = (cam) => ({ pos: cam?.pos ?? v3(0, 1.6, 0), tangent: cam?.fwd ?? v3(0, 0, -1) });
const flatFwd = (cam) => {
  const l = Math.hypot(cam.fwd.x, cam.fwd.z) || 1;
  return v3(cam.fwd.x / l, 0, cam.fwd.z / l);
};
const rightOf = (f) => v3(-f.z, 0, f.x);


function ahead(cam, a, side, up) {
  const f = flatFwd(cam);
  const p = add(add(cam.pos, scale(f, a)), scale(rightOf(f), side));
  return v3(p.x, cam.pos.y - 1.6 + up, p.z);
}


export function skipToPhase(boss, n) {
  if (n >= 2) for (const p of boss.parts.plates) p.dead = true;
  if (n >= 3) {
    if (!boss.parts.jaw) boss.parts.jaw = part(boss, 'jaw');
    boss.parts.jaw.dead = true;
  }
}






export function stepIronJaw(boss, dt, cam, d) {
  
  const events = [];
  let attack = 0;
  boss.t += dt;
  const { parts } = boss;

  if (boss.phase === 1 && parts.plates.every((p) => p.dead)) {
    boss.phase = 2;
    parts.jaw = parts.jaw ?? part(boss, 'jaw');
    boss.charge = { state: 'idle', t: 0, hpAtWarn: 0 };
    events.push({ type: 'boss_phase', phase: 2 });
  }
  if (boss.phase === 2 && parts.jaw?.dead) {
    boss.phase = 3;
    boss.down = true;
    boss.dist = FAR;
    parts.varga = part(boss, 'varga');
    events.push({ type: 'explode', what: 'ironjaw', pos: boss.pos, power: 2 }, { type: 'boss_phase', phase: 3 });
  }
  if (boss.phase === 3 && parts.varga?.dead && boss.finale < 0) {
    boss.finale = 0;
    events.push({ type: 'explode', what: 'finale', pos: parts.varga.pos, power: 3 }, { type: 'boss_down' });
  }
  if (boss.finale >= 0) {
    boss.finale += dt;
    if (boss.finale >= FINALE_S) boss.done = true;
  }

  
  const c = boss.charge;
  const jaw = parts.jaw;
  if (boss.phase === 2 && jaw) {
    c.t += dt;
    if (c.state === 'idle' && c.t >= IDLE_S) next(c, 'closing');
    else if (c.state === 'closing') {
      boss.dist = FAR + (NEAR - FAR) * Math.min(1, c.t / CLOSE_S);
      if (c.t >= CLOSE_S) {
        next(c, 'warn');
        c.hpAtWarn = jaw.hp;
        jaw.warn = true;
      }
    } else if (c.state === 'warn') {
      jaw.ring = Math.min(1, c.t / d.telegraph);
      if (c.hpAtWarn - jaw.hp >= STAGGER_HITS) {
        events.push({ type: 'stagger', pos: jaw.pos });
        endWarn(c, jaw);
      } else if (c.t >= d.telegraph) {
        attack = d.rexBite;
        events.push({ type: 'bite', pos: jaw.pos });
        endWarn(c, jaw);
      }
    } else if (c.state === 'back') {
      boss.dist = NEAR + (FAR - NEAR) * Math.min(1, c.t / BACK_S);
      if (c.t >= BACK_S) next(c, 'idle');
    }
  }

  
  if (boss.phase < 3) {
    boss.throwT -= dt;
    if (boss.throwT <= 0 && c.state !== 'warn') {
      boss.throwT = THROW_EVERY[boss.phase];
      const kind = boss.thrown++ % 2 ? 'trike' : 'raptor';
      const e = spawnEnemy(
        { kind, wave: 'boss', place: { ahead: boss.dist - 3, side: boss.sway, up: 2.5 }, leap: true },
        frameOf(cam),
        0,
        boss.hpScale,
        boss.makeId(),
      );
      boss.adds.push(e);
      events.push({ type: 'throw', kind, id: e.id });
    }
  }

  
  if (boss.phase === 3 && parts.varga && !parts.varga.dead) {
    boss.rocketT -= dt;
    if (boss.rocketT <= 0) {
      boss.rocketT = ROCKET_EVERY;
      const r = spawnEnemy({ kind: 'rocket', wave: 'boss', place: { ahead: 0, side: 0 } }, frameOf(cam), 0, boss.hpScale, boss.makeId());
      r.pos = { ...parts.varga.pos };
      r.from = r.pos;
      r.slot = (boss.t % 2) - 1;
      boss.adds.push(r);
      events.push({ type: 'rocket', id: r.id });
    }
  }

  place(boss, cam);
  return { attack, events };
}

function next(c, state) {
  c.state = state;
  c.t = 0;
}

function endWarn(c, jaw) {
  jaw.warn = false;
  jaw.ring = 0;
  next(c, 'back');
}


function place(boss, cam) {
  boss.sway = boss.down ? 0 : 3 * Math.sin(0.6 * boss.t);
  boss.pos = ahead(cam, boss.dist, boss.sway, 0);
  const jaw = ahead(cam, boss.dist - 2.2, boss.sway, JAW_UP);
  boss.parts.plates.forEach((p, i) => {
    if (!p.dead) p.pos = ahead(cam, boss.dist - 2.6, boss.sway + PLATE_AT[i][0], JAW_UP + PLATE_AT[i][1]);
  });
  if (boss.parts.jaw && !boss.parts.jaw.dead) boss.parts.jaw.pos = jaw;
  if (boss.parts.varga && !boss.parts.varga.dead) boss.parts.varga.pos = ahead(cam, 18, -3, 6);
}
