

















export function gameStartParams(game = {}, extra = {}) {
  return {
    game: extra.game || 'team-bonding',
    map: String(game.mapId || 'unknown'),
    mode: String(game.modeId || 'unknown'),
    bots_count: countBots(game),
    humans_count: countHumans(game),
    is_host: game.isHost ? 1 : 0,
    ...extra,
  };
}







export function matchEndParams(game = {}, { durationSeconds } = {}) {
  const red = num(game.scores?.red);
  const blue = num(game.scores?.blue);
  const winner = red === blue ? 'draw' : (red > blue ? 'red' : 'blue');
  return {
    game: 'team-bonding',
    map: String(game.mapId || 'unknown'),
    mode: String(game.modeId || 'unknown'),
    bots_count: countBots(game),
    humans_count: countHumans(game),
    outcome: winner === 'draw' ? 'draw' : (winner === game.team ? 'win' : 'loss'),
    score_margin: Math.abs(red - blue),
    duration_seconds: Math.max(0, Math.round(num(durationSeconds))),
  };
}











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



function countHumans(game) {
  const peers = num(game?.remotePlayers?.size);
  return Math.max(1, 1 + peers - countBots(game));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
