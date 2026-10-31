


import { checkpoint, createLife, DIFFICULTY, hurt } from './combat/damage.js';
import { applyShots, firstHit, shouldFire } from './combat/hits.js';
import { applyContinue, createScore, onDamage, onKill, onShots, rank } from './combat/score.js';
import { norm, v3 } from './combat/vec.js';
import { KINDS, leave, spawnEnemy, stepEnemy } from './enemies/enemy.js';
import { createIronJaw, skipToPhase, stepIronJaw } from './enemies/ironjaw.js';
import { createGun, stepGun } from './gun/gun.js';
import { bossPlates, hpScaleFor } from './net/scaling.js';
import { createStageRun, loadStage, stepStage } from './rail/stage.js';

const STEP = 0.1;
const LOOK = { ahead: 0, left: 1.1, right: -1.1, back: Math.PI };
const BARREL_BLAST_M = 4;
const DEAD_KEEP_S = 1.5;


function facing(stage, at) {
  const a = stage.arena;
  if (!a) return at.tangent;
  const inward = norm(v3(a.x - at.pos.x, 0, a.z - at.pos.z));
  return norm(v3(at.tangent.x * 0.25 + inward.x * 0.75, 0, at.tangent.z * 0.25 + inward.z * 0.75));
}


const BANK_LOOK_M = 12;
const BANK_PER_RAD = 0.9; 
const BANK_MAX = 0.3; 
export function bankAt(stage, dist, roll, dt) {
  if (stage.arena) return 0;
  const a = stage.rail.at(dist).tangent;
  const b = stage.rail.at(dist + BANK_LOOK_M).tangent;
  const turn = Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z); 
  const want = Math.max(-BANK_MAX, Math.min(BANK_MAX, turn * BANK_PER_RAD * 4));
  return roll + (want - roll) * Math.min(1, dt * 3);
}

const yawed = (f, a) => norm(v3(f.x * Math.cos(a) + f.z * Math.sin(a), 0, -f.x * Math.sin(a) + f.z * Math.cos(a)));




export function createGame({ stage, difficulty, players = 1, godmode = false, autoReload }) {
  const d = DIFFICULTY[difficulty];
  const st = loadStage(stage);
  const run = createStageRun(st);
  const at = st.rail.at(0);
  const auto = autoReload ?? d.autoReload;
  return {
    d,
    stage: st,
    run,
    players,
    godmode,
    hpScale: hpScaleFor(players),
    life: createLife(d),
    score: createScore(),
    guns: { left: createGun({ autoReload: auto }), right: createGun({ autoReload: auto }) },
    
    enemies: [],
    spawned: 0,
    cam: { pos: at.pos, fwd: at.tangent },
    look: { yaw: 0, target: 0, left: 0 },
    timeScale: 1,
    slowLeft: 0,
    vehicle: st.vehicle,
    
    cover: 0,
    crouched: false,
    hostages: { saved: 0, lost: 0 },
    
    waveSpawned: {},
    
    waveKilled: {},
    
    objectives: {},
    
    medals: [],
    
    events: [],
    
    boss: null,
    ended: false,
    
    rank: null,
    nextId: 1,
  };
}





export function stepGame(game, dt, input) {
  let left = dt;
  while (left > 1e-9 && !game.ended && !game.life.over) {
    const real = Math.min(STEP, left);
    left -= real;
    if (game.slowLeft > 0) {
      game.slowLeft -= real;
      if (game.slowLeft <= 0) game.timeScale = 1;
    }
    step(game, real * game.timeScale, input);
  }
}

function step(game, dt, input) {
  const { d } = game;
  const alive = (id) => game.enemies.filter((e) => e.wave === id && !e.dead).length;
  for (const ev of stepStage(game.run, dt, { aliveInWave: alive })) handleEvent(game, ev);

  
  const at = game.stage.rail.at(game.run.dist);
  game.look.left -= dt;
  if (game.look.left <= 0) game.look.target = 0;
  game.look.yaw += (game.look.target - game.look.yaw) * Math.min(1, dt * 4);
  const prev = game.cam?.pos ?? at.pos;
  const vel = dt > 0 ? v3((at.pos.x - prev.x) / dt, 0, (at.pos.z - prev.z) / dt) : v3(0, 0, 0);
  game.cam = {
    pos: at.pos,
    fwd: yawed(facing(game.stage, at), game.look.yaw),
    vel,
    roll: bankAt(game.stage, game.run.dist, game.cam?.roll ?? 0, dt),
  };

  
  game.cover = Math.max(0, game.cover - dt);
  game.crouched = game.cover > 0 && input.guns.every((g) => !g.ndc && !g.up);

  if (game.boss) stepBoss(game, dt);

  for (const e of game.enemies) {
    const { attack } = stepEnemy(e, dt, game.cam, d);
    if (attack) takeHit(game, e.kind === 'rex' ? d.rexBite : attack, e.id);
  }
  rescue(game, alive);

  
  const shots = new Map();
  const targets = game.enemies.filter((e) => !e.dead).map((e) => ({ id: e.id, kind: e.target, c: e.pos, r: e.r }));
  for (const side of  (['left', 'right'])) {
    const g = input.guns.find((x) => x.side === side);
    const ray = g?.ndc ? input.ray(g.ndc) : null;
    const hit = ray ? firstHit(ray, targets, d.volume) : null;
    const n = stepGun(game.guns[side], dt, { onTarget: shouldFire(hit), up: !!g?.up, lowered: !g || (!g.ndc && !g.up) });
    if (n && hit) {
      shots.set(hit.id, (shots.get(hit.id) ?? 0) + n);
      onShots(game.score, n, n);
      game.events.push({ type: 'shot', side, n, hit: hit.id });
    }
  }
  kill(game, applyShots(game.enemies, shots).killed);
  game.enemies = game.enemies.filter((e) => !e.gone && !(e.dead && e.deadT > DEAD_KEEP_S));
}

function addEnemy(game, e) {
  game.enemies.push(e);
  if (KINDS[e.kind].target === 'enemy') game.spawned++;
  if (e.wave) game.waveSpawned[e.wave] = (game.waveSpawned[e.wave] ?? 0) + 1;
  for (const o of Object.values(game.objectives)) if (o.kind === e.kind) o.spawned++;
  game.events.push({ type: 'spawn', id: e.id, kind: e.kind });
}

function stepBoss(game, dt) {
  const boss =  (game.boss);
  const r = stepIronJaw(boss, dt, game.cam, game.d);
  for (const e of boss.adds.splice(0)) addEnemy(game, e);
  if (r.attack) takeHit(game, r.attack, 'ironjaw');
  game.events.push(...r.events);
  if (boss.done) endStage(game);
}


export function endStage(game) {
  if (!game.ended) handleEvent(game, { at: game.run.dist, do: 'end' });
}






export function applyRemoteHits(game, hits) {
  for (const h of hits) {
    const e = game.enemies.find((x) => x.id === h.id);
    if (!e || e.dead || !(h.n > 0)) continue;
    game.events.push({ type: 'remote_hit', player: h.player, name: h.name, id: h.id, n: h.n, pos: e.pos });
    kill(game, applyShots([e], new Map([[e.id, h.n]])).killed, h.player);
  }
}


export function bossPhase(game, n) {
  if (game.boss) skipToPhase(game.boss, n);
}


function takeHit(game, amount, by) {
  if (game.crouched) {
    game.events.push({ type: 'blocked', by });
    return;
  }
  for (const o of Object.values(game.objectives)) o.damage += amount;
  game.events.push({ type: 'hurt', by, amount });
  if (game.godmode) return;
  onDamage(game.score);
  if (hurt(game.life, amount, game.d).continued) {
    applyContinue(game.score);
    game.events.push({ type: 'continue' });
  }
}

const RESCUE_POINTS = 500;





function rescue(game, alive) {
  for (const h of game.enemies) {
    if (h.kind !== 'hostage' || h.gone || !h.guard || !game.waveSpawned[h.guard] || alive(h.guard) > 0) continue;
    h.gone = true;
    if ((game.waveKilled[h.guard] ?? 0) < game.waveSpawned[h.guard]) {
      loseHostage(game, h);
      continue;
    }
    game.hostages.saved++;
    game.score.points += RESCUE_POINTS;
    game.events.push({ type: 'rescued', id: h.hostage, pos: h.pos, points: RESCUE_POINTS });
  }
}

function loseHostage(game, h) {
  h.gone = true;
  game.hostages.lost++;
  game.events.push({ type: 'hostage_lost', id: h.hostage, pos: h.pos });
}


function kill(game, ids, by = null) {
  for (const id of ids) {
    const e = game.enemies.find((x) => x.id === id);
    if (!e) continue;
    if (!by) onKill(game.score, e.points);
    if (e.wave) game.waveKilled[e.wave] = (game.waveKilled[e.wave] ?? 0) + 1;
    for (const o of Object.values(game.objectives)) if (o.kind === e.kind) o.killed++;
    game.events.push({ type: 'kill', id, kind: e.kind, pos: e.pos, points: by ? 0 : e.points * game.score.combo, by });
    if (e.kind === 'barrel') {
      game.events.push({ type: 'explode', what: 'barrel', pos: e.pos, power: 1 });
      const near = game.enemies.filter((o) => !o.dead && o !== e && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < BARREL_BLAST_M);
      for (const o of near) {
        o.hp = 0;
        o.dead = true;
      }
      kill(
        game,
        near.map((o) => o.id),
        by,
      );
    }
  }
}

const OBJECTIVE_KIND = { kill_all_compys: 'compy', kill_all_raptors: 'raptor', kill_all_pteranodons: 'pteranodon' };


function objectiveWon(id, o, game) {
  if (id === 'save_hostages') return game.hostages.lost === o.lost && game.hostages.saved > o.saved;
  if (o.kind) return o.spawned > 0 && o.killed >= o.spawned;
  return o.damage === 0;
}

function handleEvent(game, ev) {
  switch (ev.do) {
    case 'spawn': {
      const frame = game.stage.rail.at(game.run.dist);
      const fr = { pos: frame.pos, tangent: game.cam.fwd ?? frame.tangent };
      for (let i = 0; i < (ev.count ?? 1); i++) addEnemy(game, spawnEnemy(ev, fr, i, game.hpScale, `e${game.nextId++}`));
      break;
    }
    case 'release':
      for (const e of game.enemies) if (e.wave === ev.id) leave(e);
      for (const h of game.enemies) {
        if (h.kind === 'hostage' && h.guard === ev.id && !h.gone) loseHostage(game, h);
      }
      break;
    case 'hostage': {
      const frame = game.stage.rail.at(game.run.dist);
      const h = spawnEnemy(
        { kind: 'hostage', place: ev.place },
        { pos: frame.pos, tangent: game.cam.fwd ?? frame.tangent },
        0,
        1,
        `e${game.nextId++}`,
      );
      Object.assign(h, { hostage: String(ev.id), guard: ev.guard ? String(ev.guard) : null });
      game.enemies.push(h);
      game.events.push({ type: 'spawn', id: h.id, kind: 'hostage' });
      break;
    }
    case 'boss':
      game.boss = createIronJaw({ hpScale: game.hpScale, plates: bossPlates(game.players), makeId: () => `e${game.nextId++}` });
      game.events.push({ type: 'boss', id: ev.id, phase: 1 });
      break;
    case 'cover':
      game.cover = ev.s ?? 3;
      game.events.push({ type: 'cover', s: game.cover });
      break;
    case 'checkpoint':
      checkpoint(game.life, game.d);
      game.events.push({ type: 'checkpoint' });
      break;
    case 'objective':
      if (ev.phase === 'start')
        game.objectives[ev.id] = { kind: OBJECTIVE_KIND[ev.id] ?? '', spawned: 0, killed: 0, damage: 0, ...game.hostages };
      else {
        const o = game.objectives[ev.id];
        delete game.objectives[ev.id];
        const won = o && objectiveWon(ev.id, o, game);
        if (won) {
          game.medals.push(ev.id);
          game.score.points += 1000;
        }
        game.events.push({ type: 'objective', id: ev.id, won: !!won });
      }
      break;
    case 'look':
      game.look.target = LOOK[ev.side] ?? 0;
      game.look.left = ev.hold ?? 2;
      break;
    case 'slowmo':
      game.timeScale = ev.scale ?? 0.4;
      game.slowLeft = ev.s ?? 1;
      game.events.push({ type: 'slowmo', s: game.slowLeft });
      break;
    case 'swap_vehicle':
      game.vehicle = ev.to;
      game.events.push({ type: 'vehicle', to: ev.to });
      break;
    case 'end':
      game.ended = true;
      game.rank = rank(game.score, game.spawned);
      game.events.push({ type: 'end', rank: game.rank });
      break;
    default: 
      game.events.push({ type: ev.do, ...ev });
  }
}
