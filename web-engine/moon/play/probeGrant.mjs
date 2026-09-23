

















export function grantAllowed(params) {
  return Boolean(params) && (params.get('shot') === '1' || params.get('grant') === '1');
}






export function grantCoins(world, { coins } = {}) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error(`grant: coins must be a positive integer, got ${coins}`);
  world.coins += coins;
  return world.coins;
}






export const GRANT_GOODS = Object.freeze(['wood', 'stone', 'food']);


export function grantGoodsUpTo(world, want = {}) {
  const out = {};
  for (const [good, n] of Object.entries(want)) {
    if (!GRANT_GOODS.includes(good)) throw new Error(`grant: '${good}' is not one of ${GRANT_GOODS.join(', ')}`);
    if (!Number.isInteger(n) || n <= 0) throw new Error(`grant: ${good} must be a positive integer, got ${n}`);
    world.pockets[good] = Math.max(world.pockets[good] || 0, n);
    out[good] = world.pockets[good];
  }
  return out;
}
