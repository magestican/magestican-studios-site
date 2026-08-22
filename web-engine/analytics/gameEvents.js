// Turning a running match into the two or three facts worth measuring.
//
// A page view tells you somebody opened the game. It does not tell you whether
// the map they picked is the one nobody finishes, or whether phone players
// bail before the first flag. That is what these two events are for, and why
// there are only two: every extra event is another thing to keep true when the
// game changes, and GA4 reports get less readable the more of them there are.
//
// Everything here takes a plain object shaped like a Game rather than
// importing the Game class, so the whole module is unit-testable with a
// literal and stays decoupled from games/team-bondage/src/game.js (which this
// file must never reach into).

/**
 * Facts known the moment a match is created: what was chosen, and by whom.
 * `bots` and `humans` are the numbers that decide whether a session was a real
 * multiplayer game or one person poking at AI.
 */
export function gameStartParams(game = {}, extra = {}) {
  return {
    game: extra.game || 'team-bondage',
    map: String(game.mapId || 'unknown'),
    mode: String(game.modeId || 'unknown'),
    bots_count: countBots(game),
    humans_count: countHumans(game),
    is_host: game.isHost ? 1 : 0,
    ...extra,
  };
}

/**
 * Facts known once somebody has won. `outcome` is from the reporting player's
 * point of view — a peer-to-peer game has no server to record a single
 * authoritative result, so every peer reports its own and the aggregate is
 * read as "matches finished", not "matches won".
 */
export function matchEndParams(game = {}, { durationSeconds } = {}) {
  const red = num(game.scores?.red);
  const blue = num(game.scores?.blue);
  const winner = red === blue ? 'draw' : (red > blue ? 'red' : 'blue');
  return {
    game: 'team-bondage',
    map: String(game.mapId || 'unknown'),
    mode: String(game.modeId || 'unknown'),
    bots_count: countBots(game),
    humans_count: countHumans(game),
    outcome: winner === 'draw' ? 'draw' : (winner === game.team ? 'win' : 'loss'),
    score_margin: Math.abs(red - blue),
    duration_seconds: Math.max(0, Math.round(num(durationSeconds))),
  };
}

/**
 * Poll a Game for its end instead of asking game.js for a callback.
 *
 * game.js is owned elsewhere and analytics is not a good enough reason to put
 * a hook in a 2500-line gameplay file. `gameOver` is already a public, stable
 * field on Game (it gates the tick loop), so watching it costs one boolean
 * read a second and cannot break the match if this module throws.
 *
 * Timers are injected so the test does not have to wait in real time.
 */
export function watchMatchEnd(game, {
  onEnd,
  intervalMs = 1000,
  setTimer = globalThis.setInterval,
  clearTimer = globalThis.clearInterval,
  now = () => Date.now(),
} = {}) {
  if (!game || typeof onEnd !== 'function') return () => {};
  const startedAt = now();
  let fired = false;
  const id = setTimer(() => {
    if (fired || !game.gameOver) return;
    fired = true;
    clearTimer(id);
    onEnd(matchEndParams(game, { durationSeconds: (now() - startedAt) / 1000 }));
  }, intervalMs);
  return () => clearTimer(id);
}

function countBots(game) {
  const live = game?.bots?.size;
  return num(Number.isFinite(live) ? live : game?.initialBotCount);
}

// The reporting player counts as one human; remotePlayers holds bots too, so
// the humans figure is the peer count minus the bots the host is simulating.
function countHumans(game) {
  const peers = num(game?.remotePlayers?.size);
  return Math.max(1, 1 + peers - countBots(game));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
