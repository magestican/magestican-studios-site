












import { RESOURCE_KINDS, goodsFor, resourceHeld } from '../economy/crafting.mjs';






export function grantAllowed(params) {
  return Boolean(params) && (params.get('shot') === '1' || params.get('grant') === '1');
}






export function grantCoins(world, { coins } = {}) {
  if (!Number.isInteger(coins) || coins <= 0) throw new Error(`grant: coins must be a positive integer, got ${coins}`);
  world.coins += coins;
  return world.coins;
}
















export const GRANT_GOODS = RESOURCE_KINDS;





export function grantGoodsUpTo(world, want = {}) {
  const out = {};
  for (const [resource, n] of Object.entries(want)) {
    if (!GRANT_GOODS.includes(resource)) throw new Error(`grant: '${resource}' is not one of ${GRANT_GOODS.join(', ')}`);
    if (!Number.isInteger(n) || n <= 0) throw new Error(`grant: ${resource} must be a positive integer, got ${n}`);
    const short = n - resourceHeld(world, resource);
    if (short > 0) {
      const good = goodsFor(resource)[0];
      world.pockets[good] = (world.pockets[good] || 0) + short;
    }
    out[resource] = resourceHeld(world, resource);
  }
  return out;
}
