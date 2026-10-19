




import './kinds.js';
import { STEP } from './constants.js';
import { stepDig } from './dig.js';
import { spawnEntities, stepEntities } from './entities.js';
import { createPlayer, NO_INPUT, stepPlayer } from './player.js';
import { stepSecretSignals } from './secrets.js';

const RESPAWN_DELAY = 0.45; 
const PIT_Y = -3; 
const START_HEARTS = 3;
const START_LIVES = 5;










export function createSession(level, startCheckpoint = 0, abilities = new Set()) {
  const start = level.checkpoints.find((c) => c.id === startCheckpoint) ?? level.spawn;
  const player = createPlayer(start.x, start.y);
  
  for (const d of level.entities ?? []) if (d.kind === 'ability' && start !== level.spawn && d.x < start.x) abilities.add(d.grant);
  player.abilities = abilities;
  return {
    level,
    
    world: level.world.mutable || (level.entities ?? []).some((d) => d.kind === 'clod') ? level.world.clone() : level.world,
    abilities,
    player,
    entities: spawnEntities(level.entities ?? []),
    checkpoint: start === level.spawn ? 0 : startCheckpoint,
    
    partial: start !== level.spawn,
    respawnAt: { x: start.x, y: start.y },
    dead: 0, 
    deaths: 0,
    hearts: START_HEARTS,
    maxHearts: START_HEARTS,
    lives: START_LIVES,
    invuln: 0,
    hitstop: 0,
    cleared: false,
    
    found: new Set(),
    time: 0,
    
    events: [],
  };
}




export function stepSession(s, input) {
  s.events.length = 0;
  if (s.hitstop > 0) {
    s.hitstop -= STEP; 
    return s;
  }
  s.time += STEP;
  if (s.invuln > 0) s.invuln -= STEP;
  if (s.dead > 0) {
    s.dead += STEP;
    if (s.dead >= RESPAWN_DELAY) respawn(s);
    stepPlayer(s.player, NO_INPUT, s.world);
    return s;
  }
  const p = s.player;
  stepPlayer(p, s.cleared ? NO_INPUT : input, s.world);
  stepDig(s);
  stepEntities(s.entities, { world: s.world, session: s, player: p, events: s.events });
  stepSecretSignals(s);
  for (const e of p.events) s.events.push(e);
  for (const e of s.events) if (e.type === 'secret') s.found.add(String(e.id));
  for (const c of s.level.checkpoints) {
    const passed = s.level.vertical ? p.y >= c.y - 0.01 && Math.abs(p.x - c.x) < 4 : p.x >= c.x; 
    if (c.id > s.checkpoint && p.grounded && passed) {
      s.checkpoint = c.id;
      s.respawnAt = { x: c.x, y: c.y };
      s.events.push({ type: 'checkpoint', id: c.id });
    }
  }
  if (p.y < PIT_Y) {
    s.events.push({ type: 'pit' });
    const cost = s.level.pitCost ?? 'none';
    if (cost === 'heart') s.hearts -= 1;
    if (cost === 'life') s.hearts = 0;
    die(s);
  } else if (s.events.some((e) => e.type === 'down')) {
    die(s);
  }
  return s;
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
    s.events.push({ type: 'gameOver' });
  }
  if (s.hearts <= 0) s.hearts = s.maxHearts;
  s.player = createPlayer(s.respawnAt.x, s.respawnAt.y);
  s.player.abilities = s.abilities;
  s.invuln = 0;
  s.dead = 0;
  s.events.push({ type: 'respawn' });
}
