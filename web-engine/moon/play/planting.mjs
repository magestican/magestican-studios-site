









import { PATH_HALF_WIDTH, pathDistance } from '../world/moonLayout.mjs';
import { WALK_EDGE_M, penetration } from '../world/collision.mjs';
import { parcelAt } from '../world/parcels.mjs';
import { CAT_NAME } from './people.mjs';

export const PLANTING = Object.freeze({
  
  
  aheadM: 1.3,
  
  
  edgeMarginM: 1.5,
  
  
  pathClearM: 0.45,
  
  
  
  treeSpacingM: 2.6,
  
  
  obstacleClearM: 0.8,
});

const NAMES = Object.freeze({
  
  cottage: 'the cottage', cat: CAT_NAME, fence: 'the fence', lamp: 'the lamp', firepit: 'the fire pit', rock: 'the rock',
  
  shop: 'the shop', processor: 'the press', plot: 'the build plot',
  
  villagerHome: "a neighbour's home",
});
const TREE_MODULES = new Set(['tree', 'peachTree']);


export function spotAhead(player, cfg = PLANTING) {
  const h = player.heading || 0;
  return { x: player.x + Math.sin(h) * cfg.aheadM, z: player.z + Math.cos(h) * cfg.aheadM };
}









export const CATS_LAND = `This is ${CAT_NAME}'s land - ask him about it.`;
export const CATS_LAND_FOR_SALE = `This is still ${CAT_NAME}'s land - buy it from him first.`;




function ownsSpot(owned, x, z) {
  if (owned == null) return true;
  if (typeof owned === 'function') return Boolean(owned(x, z));
  const id = parcelAt(x, z);
  return id !== null && (owned instanceof Set ? owned.has(id) : owned.includes(id));
}



function forSaleSpot(forSale, x, z) {
  if (forSale == null) return false;
  const id = parcelAt(x, z);
  return id !== null && (forSale instanceof Set ? forSale.has(id) : forSale.includes(id));
}


export function whyNotPlantHere(x, z, { obstacles = [], trees = [], owned = null, forSale = null } = {}, cfg = PLANTING) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'There is no ground there.';
  if (Math.hypot(x, z) > WALK_EDGE_M - cfg.edgeMarginM) return 'Too close to the edge of the moon for a tree.';
  if (pathDistance(x, z) < PATH_HALF_WIDTH + cfg.pathClearM) return 'Trees cannot grow on the path.';
  if (!ownsSpot(owned, x, z)) return forSaleSpot(forSale, x, z) ? CATS_LAND_FOR_SALE : CATS_LAND;
  let nearest = null;
  for (const t of trees) {
    const d = Math.hypot(t.x - x, t.z - z);
    if (d < cfg.treeSpacingM && (!nearest || d < nearest.d)) nearest = { d, t };
  }
  if (nearest) {
    return nearest.t.stage === 'stump'
      ? 'A stump is in the way - dig it up first.'
      : 'Too close to another tree - trees need room to spread.';
  }
  for (const ob of obstacles) {
    if (TREE_MODULES.has(ob.module)) continue;
    if (penetration(ob, x, z, cfg.obstacleClearM).depth > 0) return `Too close to ${NAMES[ob.module] || 'something'} - a tree needs room to grow.`;
  }
  return null;
}
