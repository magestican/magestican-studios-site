





































import { BUILDINGS, CRAFTABLES, GOODS, LAND, TREES } from './tables.mjs';
import { parcelPrice } from './land.mjs';
import { STORES } from './town.mjs';







const STORE_PRICE = Object.freeze(Object.assign({}, ...Object.values(STORES).map((s) => s.sells || {})));

export const goodValue = (good) => {
  const sell = GOODS[good] ? GOODS[good].sell_coins || 0 : 0;
  if (sell > 0) return sell;
  return STORE_PRICE[good] || 0;
};


export function pocketsValue(pockets = {}) {
  let total = 0;
  for (const [good, n] of Object.entries(pockets)) total += goodValue(good) * (n > 0 ? n : 0);
  return total;
}









export function craftedValue(item) {
  const spec = CRAFTABLES[item];
  
  
  if (!spec || !spec.cost) return 0;
  let total = 0;
  for (const [good, n] of Object.entries(spec.cost)) total += goodValue(good) * n;
  return total;
}


export function landValue(parcels) {
  const owned = Math.max(0, Number(parcels) || 0);
  let total = 0;
  
  
  for (let k = 1; k <= owned - LAND.startingParcels; k += 1) total += parcelPrice(k);
  return total;
}


export function buildingValue(building) {
  const spec = BUILDINGS[building.type];
  if (!spec) return 0;
  let total = 0;
  for (let i = 0; i < building.level && i < spec.levels.length; i += 1) {
    total += spec.levels[i].cost_coins || 0;
  }
  return total;
}









export function treeValue(tree) {
  if (!tree || tree.wild) return 0;
  const spec = TREES[tree.kind];
  if (!spec) return 0;
  if (spec.timber) return goodValue('wood') * (spec.woodWhenFelled.fruiting || 0);
  return goodValue(spec.fruit) * (spec.fruitPerCrop || 0);
}







export function netWorth(world) {
  if (!world) return { coins: 0, pockets: 0, land: 0, buildings: 0, made: 0, placed: 0, trees: 0, total: 0 };
  const parts = {
    coins: Math.max(0, Math.round(world.coins || 0)),
    pockets: pocketsValue(world.pockets),
    land: landValue(world.parcels),
    buildings: (world.buildings || []).reduce((n, b) => n + buildingValue(b), 0),
    made: Object.entries(world.made || {}).reduce((n, [item, count]) => n + craftedValue(item) * count, 0),
    placed: (world.placed || []).reduce((n, p) => n + craftedValue(p.item), 0),
    trees: (world.trees || []).reduce((n, t) => n + treeValue(t), 0),
  };
  return { ...parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
}






export const GROUP_SEPARATOR = '\u2009';









export const worthText = (n) => Math.round(Math.max(0, Number(n) || 0))
  .toString()
  .replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
