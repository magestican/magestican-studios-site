













export function grantAllowed(params) {
  return Boolean(params) && params.get('shot') === '1';
}






export function grantCoins(world, { coins } = {}) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error(`grant: coins must be a positive integer, got ${coins}`);
  world.coins += coins;
  return world.coins;
}
