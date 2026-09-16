







import { BUILDINGS, LAND } from './tables.mjs';
import { BP } from './math.mjs';



export function parcelPrice(k) {
  if (!Number.isInteger(k) || k < 1) throw new Error(`parcel purchase must be a positive integer, got ${k}`);
  let price = LAND.firstParcel_coins;
  for (let i = 1; i < k; i++) price = Math.floor((price * LAND.priceGrowth_bp) / BP);
  return Math.ceil(price / LAND.roundTo_coins) * LAND.roundTo_coins;
}

export const nextParcelPrice = (world) => parcelPrice(world.parcels - LAND.startingParcels + 1);

export const ownsParcel = (world, id) => world.land.includes(id);


export function freeParcelId(world) {
  for (let id = 0; id < LAND.maxParcels; id++) if (!world.land.includes(id)) return id;
  return null;
}

export const treeSlots = (world) => world.parcels * LAND.treeSlotsPerParcel;
export const buildingSlots = (world) => world.parcels * LAND.buildingSlotsPerParcel;









export const ownedTreeCount = (world) => world.trees
  .filter((t) => !t.wild && (Number.isInteger(t.planet) ? t.planet : 0) === 0).length;

export function usedBuildingSlots(world) {
  let used = 0;
  for (const b of world.buildings) used += BUILDINGS[b.type].buildingSlots;
  return used;
}
