
























import { HAPPINESS } from '../economy/tables.mjs';
import { anchors as roomAnchors } from '../art/houseRoom.mjs';
import { storeysFor } from '../art/interiorPlan.mjs';
import { stockAnchors } from '../art/workRoom.mjs';
import { HOME_DOOR_M, PLAYER_RADIUS_M, toWorld } from '../world/collision.mjs';
import { BADGE, HOUSE_STAGES, badgeState, homeOf, homeStage } from './village.mjs';




const badgeHearts = (villager) => badgeState(villager, {}, BADGE).hearts;


export function mayEnter(villager, home, cfg = HAPPINESS) {
  return Boolean(home) && HOUSE_STAGES.includes(home.stage) && badgeHearts(villager) >= cfg.enterHearts;
}





const DOOR_GAP_M = 0.35;







const STAIRS_REACH_M = 0.35;


export const floorRoom = ({ seed = 1, species = 'human', stage = 'house' }, floor = 0) =>
  roomAnchors({ seed, species, storeys: storeysFor(stage), storey: storeysFor(stage) === 2 ? floor : 0 });





export function roomDoors(room) {
  const out = [];
  if (!room.door.none) out.push(Object.freeze({ kind: 'front', x: room.atDoor.x, z: room.atDoor.z, r: 0.12, floor: room.storey || 0 }));
  if (room.stairs) out.push(Object.freeze({ kind: 'stairs', x: room.stairs.x, z: room.stairs.z, r: STAIRS_REACH_M, floor: room.storey, to: room.stairs.to }));
  return out;
}







export const BUILDING_DOOR_KINDS = Object.freeze(['shop', 'press', 'emporium', 'market', 'townHall']);
const ROOMS = new Map();



const COUNTER_TYPE = Object.freeze({ shop: 'shop', press: 'processor', emporium: 'store', market: 'store', townHall: 'townHall' });









export function indoorShelves(room, { shop = [], pressGoods = {} } = {}) {
  if (!room || !room.work || !room.plan) return { anchors: [], shelves: [] };
  const anchors = stockAnchors(room.plan);
  
  
  if (room.work === 'shop') {
    const stocked = shop.filter((s) => s && s.count > 0);
    return { anchors, shelves: anchors.map((_, i) => (stocked[i] ? { good: stocked[i].good, count: stocked[i].count } : null)) };
  }
  if (room.work === 'press') {
    const ready = Object.entries(pressGoods).filter(([, n]) => n > 0).sort(([a], [b]) => (a < b ? -1 : 1));
    return { anchors, shelves: anchors.map((_, i) => (ready[i] ? { good: ready[i][0], count: ready[i][1] } : null)) };
  }
  return { anchors: [], shelves: [] };
}


export function counterPlaces(room) {
  if (!room || !room.work || !room.counter) return [];
  const type = COUNTER_TYPE[room.work];
  return [Object.freeze({ type, ...(type === 'store' ? { id: room.work } : {}), x: room.counter.x, z: room.counter.z, r: 0.3, indoor: true })];
}









export function buildingDoorPlaces(buildings) {
  const out = [];
  for (const b of buildings) {
    if (!BUILDING_DOOR_KINDS.includes(b.kind)) throw new Error(`no door kind '${b.kind}' (kinds: ${BUILDING_DOOR_KINDS.join(', ')})`);
    if (!b.door) continue;
    const at = toWorld(b.placement, b.door.x, b.door.z);
    const front = toWorld(b.placement, b.door.x, b.door.z + PLAYER_RADIUS_M + DOOR_GAP_M);
    const level = b.kind === 'shop' ? Math.max(1, b.level | 0) : 1;
    
    const key = `${b.kind}|${b.seed || 1}|${level}`;
    if (!ROOMS.has(key)) ROOMS.set(key, roomAnchors({ seed: b.seed || 1, work: b.kind, level }));
    out.push(Object.freeze({
      type: 'buildingDoor', id: b.kind, x: at.x, z: at.z, front, open: true, seed: b.seed || 1, level,
      room: ROOMS.get(key),
    }));
  }
  return out;
}










export function villagerHomePlaces(world, village, t) {
  const out = [];
  for (const v of world.villagers || []) {
    const home = homeOf(village, v);
    if (!home) continue;
    const open = mayEnter(v, homeStage(v, t));
    const front = toWorld(home, 0, HOME_DOOR_M + PLAYER_RADIUS_M + DOOR_GAP_M);
    const entry = {
      type: 'villagerDoor', id: v.id,
      x: home.door.x, z: home.door.z, front,
      open, species: v.species, seed: home.seed,
    };
    if (open) entry.room = roomAnchors({ seed: home.seed, species: v.species });
    out.push(Object.freeze(entry));
  }
  return out;
}
