





import { WIDTH, emptyWell, fits, placeCells, resolveLock, attackFrom, addStoneRows, toppedOut } from './well.js';
import { createBag, nextPiece, cellsOf, rotated } from './pieces.js';

export const TICKS_PER_SECOND = 60;
export const GRAVITY_START_TICKS = 60;
export const GRAVITY_MIN_TICKS = 8;
const SPEEDUP_EVERY_TICKS = 20 * TICKS_PER_SECOND;
const SPEEDUP_BY = 6;
export const LIGHT_WINDUP_TICKS = 72;
export const HEAVY_WINDUP_TICKS = 120;
export const RESOLVE_PAUSE_TICKS = 30;
export const BREATHER_TICKS = 180;
const LOCK_DELAY_TICKS = 30;
const MAX_LOCK_RESETS = 15;
const SOFT_DROP_TICKS = 3;
const SHOWN_NEXT = 3;
const WINS_NEEDED = 2;



export const SQUEEZE_START_TICKS = 120 * TICKS_PER_SECOND;
const SQUEEZE_FIRST_GAP_TICKS = 8 * TICKS_PER_SECOND;
const SQUEEZE_GAP_SHRINK_TICKS = TICKS_PER_SECOND;
const SQUEEZE_MIN_GAP_TICKS = TICKS_PER_SECOND;


const SQUEEZES_PER_EXTRA_ROW = 8;

export const PHASE = Object.freeze({ PLAY: 'play', BREATHER: 'breather', OVER: 'over' });

const KICKS = [0, -1, 1, -2, 2];

export const gravityTicksAt = (roundTick) => Math.max(
  GRAVITY_MIN_TICKS,
  GRAVITY_START_TICKS - SPEEDUP_BY * Math.floor(roundTick / SPEEDUP_EVERY_TICKS),
);

function deal(player) {
  const { piece, bag } = nextPiece(player.bag);
  player.bag = bag;
  player.nextPieces.push(piece);
  player.piece = player.nextPieces.shift();
  player.next = player.nextPieces.map((p) => p.shape);
  player.dealt += 1;
  player.gravity = 0;
  player.lockDelay = 0;
  player.lockResets = 0;
}


function touch(player) {
  if (player.lockDelay === 0) return;
  if (player.lockResets < MAX_LOCK_RESETS) {
    player.lockDelay = 0;
    player.lockResets += 1;
  }
}

function newPlayer(seed) {
  const player = {
    well: emptyWell(), bag: createBag(seed), piece: null, next: [], nextPieces: [], pending: 0, gravity: 0, lockDelay: 0,
    lockResets: 0, dealt: 0, pause: 0, fired: null, dead: false,
  };
  for (let i = 0; i < SHOWN_NEXT + 1; i += 1) {
    const { piece, bag } = nextPiece(player.bag);
    player.bag = bag;
    player.nextPieces.push(piece);
  }
  player.piece = player.nextPieces.shift();
  player.next = player.nextPieces.map((p) => p.shape);
  return player;
}

function startRound(match) {
  const seed = (match.seed + Math.imul(match.round + 1, 0x9E3779B1)) | 0;
  match.players = [newPlayer(seed), newPlayer(seed)];
  match.attacks = [];
  match.roundTick = 0;
  match.gap = seed;
  match.squeezeAt = SQUEEZE_START_TICKS;
  match.squeezeGap = SQUEEZE_FIRST_GAP_TICKS;
  match.squeezes = 0;
  match.phase = PHASE.PLAY;
}

export function createMatch({ seed = 1 } = {}) {
  const match = {
    seed: seed | 0, tick: 0, round: 0, roundTick: 0, wins: [0, 0], winner: null, phase: PHASE.PLAY, breather: 0,
    players: [], attacks: [], gap: 0,
  };
  startRound(match);
  return match;
}





export function fireAttack(match, from, attack) {
  const to = 1 - from;
  const events = [{ type: 'fire', from, kind: attack.kind, stones: attack.stones }];
  let stones = attack.stones;
  const met = match.attacks.filter((a) => a.from === to);
  if (met.length) {
    let theirs = 0;
    for (const a of met) theirs += a.stones;
    match.attacks = match.attacks.filter((a) => a.from !== to);
    const leftover = Math.abs(stones - theirs);
    const winner = stones === theirs ? null : (stones > theirs ? from : to);
    if (winner !== null) match.players[1 - winner].pending += leftover;
    events.push({ type: 'clash', winner, leftover, stones: [from === 0 ? stones : theirs, from === 0 ? theirs : stones] });
    return events;
  }
  match.attacks.push({
    from, kind: attack.kind, stones, left: attack.kind === 'heavy' ? HEAVY_WINDUP_TICKS : LIGHT_WINDUP_TICKS,
  });
  return events;
}

function tryMove(player, dx, dy) {
  const moved = { ...player.piece, x: player.piece.x + dx, y: player.piece.y + dy };
  if (!fits(player.well, cellsOf(moved))) return false;
  player.piece = moved;
  touch(player);
  return true;
}

function tryRotate(player, dir) {
  const turned = rotated(player.piece, dir);
  for (const dx of KICKS) {
    const kicked = { ...turned, x: turned.x + dx };
    if (fits(player.well, cellsOf(kicked))) {
      player.piece = kicked;
      touch(player);
      return true;
    }
  }
  return false;
}

function nextGap(match) {
  match.gap = (Math.imul(match.gap, 1103515245) + 12345) | 0;
  return ((match.gap >>> 16) & 0x7fff) % WIDTH;
}

function lock(match, index, events) {
  const player = match.players[index];
  const { well, steps } = resolveLock(placeCells(player.well, cellsOf(player.piece)));
  player.well = well;
  player.piece = null;
  events.push({ type: 'lock', player: index, steps });
  const attack = attackFrom(steps);
  if (attack) {
    player.fired = attack;
    player.pause = steps.length * RESOLVE_PAUSE_TICKS;
    return;
  }
  afterLock(match, index, events);
}

function afterLock(match, index, events) {
  const player = match.players[index];
  if (player.pending > 0) {
    player.well = addStoneRows(player.well, player.pending, nextGap(match));
    events.push({ type: 'rise', player: index, stones: player.pending });
    player.pending = 0;
  }
  if (toppedOut(player.well)) {
    player.dead = true;
    return;
  }
  deal(player);
  if (!fits(player.well, cellsOf(player.piece))) player.dead = true;
}

function applyInput(player, input) {
  let soft = false;
  let hard = false;
  for (const key of input) {
    if (key === 'left') tryMove(player, -1, 0);
    else if (key === 'right') tryMove(player, 1, 0);
    else if (key === 'cw') tryRotate(player, 1);
    else if (key === 'ccw') tryRotate(player, -1);
    else if (key === 'soft') soft = true;
    else if (key === 'hard') hard = true;
  }
  return { soft, hard };
}

function stepPlayer(match, index, input, events) {
  const player = match.players[index];
  if (player.dead) return;
  if (!player.piece) {
    player.pause -= 1;
    if (player.pause > 0) return;
    const attack = player.fired;
    player.fired = null;
    if (attack) events.push(...fireAttack(match, index, attack));
    afterLock(match, index, events);
    return;
  }
  const { soft, hard } = applyInput(player, input);
  if (hard) {
    while (tryMove(player, 0, -1));
    lock(match, index, events);
    return;
  }
  player.gravity += 1;
  if (player.gravity >= (soft ? Math.min(SOFT_DROP_TICKS, gravityTicksAt(match.roundTick)) : gravityTicksAt(match.roundTick))) {
    player.gravity = 0;
    tryMove(player, 0, -1);
  }
  if (!fits(player.well, cellsOf({ ...player.piece, y: player.piece.y - 1 }))) {
    player.lockDelay += 1;
    if (player.lockDelay >= LOCK_DELAY_TICKS) lock(match, index, events);
  }
}

function stepAttacks(match, events) {
  const landing = [];
  for (const attack of match.attacks) {
    attack.left -= 1;
    if (attack.left <= 0) landing.push(attack);
  }
  match.attacks = match.attacks.filter((a) => a.left > 0);
  for (const attack of landing) {
    match.players[1 - attack.from].pending += attack.stones;
    events.push({ type: 'land', from: attack.from, to: 1 - attack.from, kind: attack.kind, stones: attack.stones });
  }
}

function stepSqueeze(match, events) {
  if (match.roundTick < match.squeezeAt) return;
  const rows = 1 + Math.floor(match.squeezes / SQUEEZES_PER_EXTRA_ROW);
  for (const player of match.players) player.pending += rows;
  match.squeezes += 1;
  match.squeezeAt = match.roundTick + match.squeezeGap;
  match.squeezeGap = Math.max(SQUEEZE_MIN_GAP_TICKS, match.squeezeGap - SQUEEZE_GAP_SHRINK_TICKS);
  events.push({ type: 'squeeze', rows });
}

function endRoundIfOver(match, events) {
  const [a, b] = match.players.map((p) => p.dead);
  if (!a && !b) return;
  
  const winner = a && b ? null : (a ? 1 : 0);
  if (winner !== null) match.wins[winner] += 1;
  events.push({ type: 'round', winner, wins: [...match.wins] });
  if (winner !== null && match.wins[winner] >= WINS_NEEDED) {
    match.phase = PHASE.OVER;
    match.winner = winner;
    events.push({ type: 'over', winner });
    return;
  }
  match.phase = PHASE.BREATHER;
  match.breather = BREATHER_TICKS;
  match.round += 1;
}


export function step(match, inputs) {
  const events = [];
  match.tick += 1;
  if (match.phase === PHASE.OVER) return events;
  if (match.phase === PHASE.BREATHER) {
    match.breather -= 1;
    if (match.breather <= 0) {
      startRound(match);
      events.push({ type: 'start', round: match.round });
    }
    return events;
  }
  match.roundTick += 1;
  stepAttacks(match, events);
  stepSqueeze(match, events);
  stepPlayer(match, 0, inputs[0] || [], events);
  stepPlayer(match, 1, inputs[1] || [], events);
  endRoundIfOver(match, events);
  return events;
}


export function hashMatch(match) {
  const text = JSON.stringify(match);
  let h = 0x811C9DC5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
