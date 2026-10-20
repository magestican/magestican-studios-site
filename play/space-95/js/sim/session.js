




import './kinds.js';
import { attachArena, initArena, stepArena } from './arena.js';
import { attachBlooms, createBlooms, stepBlooms } from './bloom.js';
import { INVULN_TIME } from './combat.js';
import { STEP } from './constants.js';
import { stepDig } from './dig.js';
import { resetAces, stepAerodrome } from './enemies/ace.js';
import { stepSnares } from './enemies/aunt.js';
import { spawnEntities, stepEntities } from './entities.js';
import { attachFans, createFans, stepFans } from './fan.js';
import { attachHeaves, stepHeaves } from './heave.js';
import { createLight, stepLight } from './light.js';
import { createFlock, stepFlock } from './motifs/flock.js';
import { stepWingman } from './motifs/wingman.js';
import { touchPins } from './pins.js';
import { respawnPlane, startPlane, stepPlane } from './plane.js';
import { createPlayer, NO_INPUT, stepPlayer } from './player.js';
import { attachRafts, createRafts, stepRafts } from './raft.js';
import { createRipple, stepRipple } from './ripple.js';
import { stepSecretSignals } from './secrets.js';
import { stepShield } from './shield.js';
import { createShoe, resetShoe, stepShoe } from './shoe.js';
import { stepSurge } from './surge.js';
import { createTrain, defaultPoints, defaultSignals, rerailTrain, stepTrain, syncProxy } from './train.js';
import { checkDunk, DUNK_TIME, fishOut, trackSafe } from './water.js';
import { attachWebs, createWebs, stepDawn, stepWebs, trackFallSafe } from './web.js';
import { attachWind, stepWind } from './wind.js';

const RESPAWN_DELAY = 0.45; 
const PUNT_TIME = 0.8; 
const PIT_Y = -3; 
const START_HEARTS = 3;
const START_LIVES = 5;










export function createSession(level, startCheckpoint = 0, abilities = new Set()) {
  const start = level.checkpoints.find((c) => c.id === startCheckpoint) ?? level.spawn;
  const dir = level.dir ?? 1; 
  const player = createPlayer(start.x, start.y, dir);
  
  
  for (const d of level.entities ?? [])
    if (
      d.kind === 'ability' &&
      start !== level.spawn &&
      
      (level.mode === 'train' || (level.descent ? start.y < d.y : level.vertical ? start.y > d.y : dir * (start.x - d.x) > 0))
    )
      abilities.add(d.grant);
  player.abilities = abilities;
  
  const [startBoss, startPhase] = start.phase ? start.phase.split(':') : [];
  const defs = (level.entities ?? []).map((d) => (startBoss && d.id === startBoss ? { ...d, startPhase: Number(startPhase) } : d));
  const s = {
    level,
    
    world: sessionWorld(level),
    abilities,
    player,
    entities: spawnEntities(defs),
    checkpoint: start === level.spawn ? 0 : startCheckpoint,
    
    partial: start !== level.spawn,
    respawnAt: { x: start.x, y: start.y },
    dead: 0, 
    deaths: 0,
    punt: 0, 
    punts: 0,
    
    shoe: createShoe(level, start.x),
    
    bowls: {},
    
    rafts: createRafts(level),
    ripple: createRipple(level),
    dunk: 0, 
    dunks: 0,
    
    safe: { x: start.x, y: start.y },
    safeLand: { x: start.x, y: start.y },
    hearts: START_HEARTS,
    maxHearts: START_HEARTS,
    lives: START_LIVES,
    invuln: 0,
    hitstop: 0,
    cleared: false,
    
    found: new Set(),
    time: 0,
    
    events: [],
    
    lit: new Set(),
    
    hooks: levelHooks(level),
    
    pitFall: 0,
    pitReturns: 0,
    
    fans: createFans(level),
    
    surges: [],
    
    lightsOut: false,
    
    train: null,
    
    plane: null,
    points: null,
    signals: null,
    derails: 0,
    peaStart: {},
    peas: [],
    
    light: createLight(level),
    blooms: createBlooms(level),
    flock: createFlock(level),
    
    webs: createWebs(level),
    snares: [],
    snags: 0, 
  };
  if (level.mode === 'train') startTrain(s, start);
  
  if (level.mode === 'plane') startPlane(s, start, start !== level.spawn);
  initArena(s);
  return s;
}


function levelHooks(level) {
  const hooks = (level.entities ?? [])
    .filter((d) => d.kind === 'hook' || d.kind === 'plug')
    .map((d) =>
      d.kind === 'plug'
        ? {
            id: d.id,
            x: d.x,
            y: d.y,
            plug: true,
            circuit: d.circuit ?? null,
            dud: !!d.dud,
            reseat: d.reseat ?? 0,
            off: !!d.off,
            use: d.use ?? null,
          }
        : { id: d.id, x: d.x, y: d.y },
    );
  return hooks.length ? hooks : null;
}


function startTrain(s, start, keep = null) {
  const level = s.level;
  if (!keep) {
    s.peaStart = {};
    s.points = defaultPoints(level);
    s.signals = defaultSignals(level);
    for (const pe of level.track.peas) if (!pe.start) s.peaStart[pe.id] = 0;
  }
  const at = start.rail ? start : level.trainStart;
  const coupled = keep?.coupled || !!at.coupled;
  s.train = createTrain(level, { rail: at.rail, s: at.s, passes: at.passes, coupled, charges: keep?.charges });
  if (coupled && !keep)
    for (const g of level.track.signals.filter((x) => x.lockUntil === 'hopper')) {
      s.signals[g.id] = 'green';
      if (g.points) s.points[g.points] = g.set ?? 'b';
    }
  syncProxy(s);
}


function sessionWorld(level) {
  const windy = level.updrafts?.length || level.gusts?.length; 
  const changes =
    level.world.mutable ||
    (level.entities ?? []).some((d) => d.kind === 'clod' || d.kind === 'typeKey') ||
    level.heaves?.length ||
    windy ||
    level.rafts?.length ||
    level.arena?.length ||
    level.fans?.length ||
    level.spins?.length ||
    level.blooms?.length ||
    level.webs?.length;
  const w = changes ? level.world.clone() : level.world;
  if ((level.entities ?? []).some((d) => d.kind === 'typeKey')) w.mutable = true; 
  if (level.honey) w.honey = level.honey; 
  if (windy) attachWind(w, level);
  if (level.heaves?.length) {
    attachHeaves(w, level.heaves);
    w.time = 0;
    w.sighStart = null;
  }
  if (level.arena?.length) attachArena(w, level.arena); 
  if (level.rafts?.length) attachRafts(w); 
  if (level.fans?.length) attachFans(w); 
  if (level.spins?.length) w.spins = level.spins; 
  if (level.blooms?.length) attachBlooms(w); 
  if (level.webs?.length) attachWebs(w, level); 
  return w;
}




export function stepSession(s, input) {
  s.events.length = 0;
  if (s.hitstop > 0) {
    s.hitstop -= STEP; 
    return s;
  }
  s.time += STEP;
  stepHeaves(s);
  stepWind(s);
  if (s.rafts) s.world.raftState = s.rafts; 
  if (s.hooks) s.world.hooks = s.hooks; 
  if (s.fans) {
    s.world.fanState = s.fans; 
    s.world.fanT = s.time;
  }
  if (s.blooms) s.world.bloomState = s.blooms; 
  if (s.webs) {
    s.world.webState = s.webs; 
    s.world.webT = s.time;
  }
  if (s.invuln > 0) s.invuln -= STEP;
  if (s.dead > 0) {
    s.dead += STEP;
    if (s.dead >= RESPAWN_DELAY) respawn(s);
    if (!s.train && !s.plane) stepPlayer(s.player, NO_INPUT, s.world);
    return s;
  }
  if (s.punt > 0) {
    s.punt += STEP; 
    if (s.punt >= PUNT_TIME) respawn(s);
    return s;
  }
  if (s.pitFall > 0) {
    s.pitFall += STEP; 
    if (s.pitFall >= RESPAWN_DELAY) pitReturn(s);
    return s;
  }
  if (s.dunk > 0) {
    s.dunk += STEP; 
    if (s.dunk >= DUNK_TIME) fishOut(s);
    return s;
  }
  if (s.train)
    stepTrain(s, input); 
  else if (s.plane)
    stepPlane(s, input); 
  else {
    stepRafts(s);
    stepPlayer(s.player, s.cleared ? NO_INPUT : input, s.world);
    if (s.webs) stepWebs(s); 
    if (s.webs) stepDawn(s); 
  }
  const p = s.player;
  if (s.fans) stepFans(s); 
  if (s.level.circuits) stepSurge(s); 
  stepDig(s);
  stepShield(s);
  stepEntities(s.entities, { world: s.world, session: s, player: p, events: s.events });
  if (s.plane) {
    stepWingman(s); 
    stepAerodrome(s); 
  }
  stepArena(s); 
  if (s.snares.length) stepSnares(s); 
  if (s.flock) stepFlock(s); 
  if (s.light) stepLight(s); 
  if (s.blooms) stepBlooms(s); 
  if (s.level.soilLook) stepHollow(s);
  stepSecretSignals(s);
  stepShoe(s); 
  stepRipple(s); 
  for (const e of p.events) s.events.push(e);
  for (const e of s.events) if (e.type === 'secret') s.found.add(String(e.id));
  for (const e of s.events) if (e.type === 'bossPhase') s.lit.add(`${e.id}:${e.phase}`);
  for (const c of s.level.checkpoints) {
    
    if (c.phase) {
      if (c.id > s.checkpoint && s.lit.has(c.phase)) {
        s.checkpoint = c.id;
        s.respawnAt = { x: c.x, y: c.y };
        s.events.push({ type: 'checkpoint', id: c.id, phase: c.phase });
      }
      continue;
    }
    
    const passed = s.train
      ? c.rail === s.train.rail && Math.abs(s.train.s - c.s) < 2 
      : s.level.descent
        ? p.y <= c.y + 0.01 && Math.abs(p.x - c.x) < 4 
        : s.level.vertical
          ? p.y >= c.y - 0.01 && Math.abs(p.x - c.x) < 4
          : (s.level.dir ?? 1) > 0
            ? p.x >= c.x
            : p.x <= c.x;
    if (c.id > s.checkpoint && (p.grounded || s.plane) && passed) {
      s.checkpoint = c.id;
      s.respawnAt = { x: c.x, y: c.y };
      s.events.push({ type: 'checkpoint', id: c.id });
    }
  }
  if (s.punt > 0) return s;
  if (s.level.water) {
    trackSafe(s);
    if (checkDunk(s)) return s; 
  } else if (s.level.pitReturn === 'ground') trackSafe(s); 
  if (s.level.fallReturn && !s.train) {
    
    
    trackFallSafe(s);
    if (!p.grounded && p.y < s.safe.y - s.level.fallReturn) {
      s.events.push({ type: 'snag', x: p.x, y: p.y, signals: ['visual:paperclip', 'audio:tether-snag'] });
      s.snags += 1;
      const cost = s.level.pitCost ?? 'none';
      if (cost === 'heart') s.hearts -= 1;
      if (cost === 'life') s.hearts = 0;
      if (s.hearts > 0) {
        s.pitFall = STEP;
        s.pitReturns += 1;
        return s;
      }
      die(s);
      return s;
    }
  }
  
  const pin = s.level.sparks ? touchPins(s) : null;
  if (!s.train && !s.plane && (p.y < PIT_Y || pin)) {
    
    s.events.push(
      pin
        ? pin.skin === 'thorn'
          ? { type: 'thornHit', x: p.x, y: p.y, signals: ['visual:pink-thorn', 'audio:thorn-prick'] }
          : { type: 'pinZap', x: p.x, y: p.y, signals: ['visual:pink-zap', 'audio:pin-zap'] }
        : { type: 'pit' },
    );
    const cost = s.level.pitCost ?? 'none';
    if (cost === 'heart') s.hearts -= 1;
    if (cost === 'life') s.hearts = 0;
    
    if (s.level.pitReturn === 'ground' && s.hearts > 0) {
      s.pitFall = STEP;
      s.pitReturns += 1;
      return s;
    }
    die(s);
  } else if (s.events.some((e) => e.type === 'down')) {
    die(s);
  }
  return s;
}


function pitReturn(s) {
  if (s.train) {
    rerailTrain(s); 
    s.pitFall = 0;
    s.invuln = INVULN_TIME;
    return;
  }
  const at = s.safe ?? s.respawnAt;
  const p = createPlayer(at.x, at.y, s.player.facing);
  p.abilities = s.abilities;
  s.player = p;
  s.pitFall = 0;
  s.invuln = INVULN_TIME;
  s.safeT = 0;
  s.events.push({ type: 'pitReturn', x: at.x, y: at.y });
}

function die(s) {
  s.dead = STEP;
  s.deaths++;
  if (s.hearts <= 0) {
    s.lives -= 1;
    s.events.push({ type: 'lifeLost', lives: s.lives });
  }
}

function respawn(s) {
  if (s.lives <= 0) {
    
    s.lives = START_LIVES;
    s.checkpoint = 0;
    s.respawnAt = { ...s.level.spawn };
    s.entities = spawnEntities((s.level.entities ?? []).filter((d) => !s.found.has(String(d.id))));
    s.lit.clear();
    initArena(s);
    if (s.level.circuits) {
      
      s.hooks = levelHooks(s.level);
      s.fans = createFans(s.level);
      s.surges = [];
      s.lightsOut = false;
    }
    if (s.level.dark) {
      
      s.light = createLight(s.level);
      s.blooms = createBlooms(s.level);
      s.flock = createFlock(s.level);
    }
    if (s.level.webs) {
      
      s.webs = createWebs(s.level);
      s.snares = [];
      s.dawn = false;
    }
    s.aero = null; 
    s.deedLost = false;
    s.events.push({ type: 'gameOver' });
  }
  if (s.hearts <= 0) s.hearts = s.maxHearts;
  s.player = createPlayer(s.respawnAt.x, s.respawnAt.y, s.level.dir ?? 1);
  s.player.abilities = s.abilities;
  if (s.train) {
    
    const cp = s.level.checkpoints.find((c) => c.id === s.checkpoint);
    if (s.checkpoint === 0) startTrain(s, s.level.trainStart);
    else startTrain(s, cp, s.train);
  }
  s.invuln = 0;
  if (s.plane) {
    
    resetAces(s);
    if (s.checkpoint === 0) startPlane(s, s.level.spawn, false);
    else respawnPlane(s, s.respawnAt);
  }
  s.dead = 0;
  s.punt = 0;
  s.dunk = 0;
  s.pitFall = 0;
  if (s.level.pitReturn === 'ground' || s.level.fallReturn) {
    s.safe = { ...s.respawnAt };
    s.safeLand = s.safe;
  }
  if (s.shoe) resetShoe(s.shoe, s.respawnAt.x);
  if (s.rafts) {
    s.rafts = createRafts(s.level); 
    s.ripple = createRipple(s.level);
    s.safe = { ...s.respawnAt };
    s.safeLand = s.safe;
  }
  s.events.push({ type: 'respawn' });
}

const KNOCK_EVERY = 0.3; 


function stepHollow(s) {
  const p = s.player;
  s.knockT = Math.max(0, (s.knockT ?? 0) - STEP);
  if (!p.grounded || Math.abs(p.vx) < 1 || s.knockT > 0) return;
  const T = s.world.tile;
  const r = Math.round(p.y / T) - 1;
  for (let c = Math.floor((p.x - p.w / 2) / T); c <= Math.floor((p.x + p.w / 2 - 1e-7) / T); c++)
    if (s.world.soil(c, r)) {
      s.knockT = KNOCK_EVERY;
      s.events.push({ type: 'hollowKnock', x: p.x, y: p.y, signals: ['audio:hollow-knock'] });
      return;
    }
}
