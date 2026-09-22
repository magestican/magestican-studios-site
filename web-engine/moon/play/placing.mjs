






















import { PATH_HALF_WIDTH, pathDistance } from '../world/moonLayout.mjs';
import { WALK_EDGE_M, PLAYER_RADIUS_M, penetration } from '../world/collision.mjs';
import { roomOf } from './furnishing.mjs';

export const PLACING = Object.freeze({
  
  
  aheadM: 1.2,
  
  edgeMarginM: 0.2,
  
  
  pathClearM: 0.15,
  
  
  flatGapM: 0.25,
  
  obstacleClearM: 0.05,
});

const NAMES = Object.freeze({
  cottage: 'the cottage', cat: 'the cat', fence: 'the fence', lamp: 'the lamp', firepit: 'the fire pit', rock: 'the rock',
  shop: 'the shop', processor: 'the press', plot: 'the build plot', villagerHome: "a neighbour's home",
  berryBush: 'the berry bush', parcelSign: "the cat's sign", placed: 'something you put here',
});
const TREE_MODULES = new Set(['tree', 'peachTree']);





export function placeSpot(player, { r = 0.4 } = {}, cfg = PLACING) {
  const h = player.heading || 0;
  const d = Math.max(cfg.aheadM, r + PLAYER_RADIUS_M + 0.25);
  return { x: player.x + Math.sin(h) * d, z: player.z + Math.cos(h) * d };
}


export function whyNotPlaceHere(x, z, { r = 0.4, blocks = true, obstacles = [], trees = [], placed = [] } = {}, cfg = PLACING) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'There is no ground there.';
  if (Math.hypot(x, z) + r > WALK_EDGE_M - cfg.edgeMarginM) return 'That would hang over the edge of the moon.';
  for (const p of placed) {
    const gap = Math.hypot(p.x - x, p.z - z);
    const room = blocks && p.blocks ? Math.max(cfg.flatGapM, (r + p.r) * 0.8) : cfg.flatGapM;
    if (gap < room) return 'Something of yours is already here.';
  }
  if (!blocks) return null;
  if (pathDistance(x, z) < PATH_HALF_WIDTH + cfg.pathClearM + r * 0.35) return 'The path has to stay clear - lay a footpath there instead.';
  for (const t of trees) {
    if (Math.hypot(t.x - x, t.z - z) < r + (t.r || 0.4)) {
      return t.stage === 'stump' ? 'A stump is in the way - dig it up first.' : `The ${t.kind} tree is in the way.`;
    }
  }
  for (const ob of obstacles) {
    if (TREE_MODULES.has(ob.module)) continue;
    if (penetration(ob, x, z, r + cfg.obstacleClearM).depth > 0) return `There is no room here - ${NAMES[ob.module] || 'something'} is in the way.`;
  }
  return null;
}


export function placedObstacle(p, r) {
  return { shape: 'circle', module: 'placed', x: p.spot.x, z: p.spot.z, r, reach: r };
}



















const onPlanet = (world, planet) => (world.placed || [])
  .filter((p) => (Number.isInteger(p.planet) ? p.planet : 0) === planet && roomOf(p) === null);

export function placedTargets(world, radiusOf, { planet = 0 } = {}) {
  return onPlanet(world, planet).filter((p) => p.spot).map((p) => Object.freeze({
    type: 'placed', id: p.id, item: p.item, x: p.spot.x, z: p.spot.z, r: radiusOf(p.item),
  }));
}


export function placedFootprints(world, radiusOf, blocksOf, skip = null, { planet = 0 } = {}) {
  return onPlanet(world, planet).filter((p) => p.spot && p.id !== skip).map((p) => ({
    id: p.id, x: p.spot.x, z: p.spot.z, r: radiusOf(p.item), blocks: blocksOf(p.item),
  }));
}
