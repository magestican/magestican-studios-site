












export function fightMatch(totalMs) {
  const seconds = Number.isFinite(totalMs) && totalMs > 0 ? Math.round(totalMs / 1000) : undefined;
  return { game: '2d-fighter-ex', outcome: 'done', mode: 'solo', seconds, metrics: { fights: 1 } };
}
