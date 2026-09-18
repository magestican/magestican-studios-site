







































import { CRAFTABLES } from '../economy/craftables.mjs';
import { anchorsOf } from '../art/decor.mjs';
import { anchors as houseAnchors } from '../art/villagerHome.mjs';
import { anchors as roomAnchors } from '../art/houseRoom.mjs';
import { PLAYER_RADIUS_M, toWorld } from '../world/collision.mjs';
import { ownedIds, parcelAt } from '../world/parcels.mjs';

export const PLAYER_HOME = Object.freeze({
  
  planet: 0,
  
  doorGapM: 0.35,
  
  
  wallM: 0.25,
});


export const HOUSE_ITEMS = Object.freeze(Object.keys(CRAFTABLES).filter((id) => CRAFTABLES[id].category === 'houses'));


export const isHouseItem = (item) => HOUSE_ITEMS.includes(item);


export function houseArt(item) {
  const spec = CRAFTABLES[item];
  if (!spec || spec.category !== 'houses') throw new Error(`'${item}' is not a house`);
  return Object.freeze({ species: spec.art.variant || 'human', stage: spec.art.stage || 'house', seed: spec.art.seed || 1 });
}


export function ownsSpot(world, x, z) {
  const id = parcelAt(x, z);
  return id !== null && ownedIds(world).includes(id);
}

const planetOf = (e) => (Number.isInteger(e && e.planet) ? e.planet : PLAYER_HOME.planet);






export function ownedHouses(world) {
  return (world.placed || [])
    .filter((p) => p.spot && isHouseItem(p.item) && planetOf(p) === PLAYER_HOME.planet && ownsSpot(world, p.spot.x, p.spot.z))
    .sort((a, b) => (a.placedAt - b.placedAt) || (a.id - b.id));
}





export function playerHome(world, cfg = PLAYER_HOME) {
  const p = ownedHouses(world)[0];
  if (!p) return null;
  const art = houseArt(p.item);
  const spot = { x: p.spot.x, z: p.spot.z, rotY: p.spot.rotY || 0 };
  const r = anchorsOf(p.item).r;
  
  const outside = houseAnchors({ seed: art.seed, species: art.species, stage: art.stage });
  const room = roomAnchors({ seed: art.seed, species: art.species });
  
  const out = r + PLAYER_RADIUS_M + cfg.doorGapM;
  return Object.freeze({
    id: p.id, item: p.item, species: art.species, stage: art.stage, seed: art.seed,
    spot: Object.freeze(spot), radiusM: r,
    door: Object.freeze(toWorld(spot, outside.door.x, outside.footprint.hz + 0.08)),
    front: Object.freeze(toWorld(spot, outside.door.x * 0.5, out)),
    room,
  });
}


export const ownsHome = (world) => ownedHouses(world).length > 0;





export function homePlaces(world, { planet = PLAYER_HOME.planet } = {}) {
  if (planet !== PLAYER_HOME.planet) return [];
  const home = playerHome(world);
  if (!home) return [];
  return [Object.freeze({ type: 'homeDoor', x: home.door.x, z: home.door.z, front: home.front })];
}







export function insideSpot(home) {
  const s = home.room.spawn;
  return Object.freeze({ x: s.x, z: s.z, heading: s.heading });
}





export function exitPlaces(home) {
  const a = home.room.atDoor;
  
  
  
  return [Object.freeze({ type: 'homeExit', x: a.x, z: a.z, r: 0.12 })];
}






export function roomWalls(room, cfg = PLAYER_HOME) {
  const t = cfg.wallM;
  const box = (x, z, hx, hz) => Object.freeze({
    shape: 'box', module: 'houseWall', x, z, cos: 1, sin: 0, hx, hz, reach: Math.hypot(hx, hz),
  });
  return Object.freeze([
    box(0, -room.hz - t, room.hx + t * 2, t),
    box(0, room.hz + t, room.hx + t * 2, t),
    box(-room.hx - t, 0, t, room.hz + t * 2),
    box(room.hx + t, 0, t, room.hz + t * 2),
  ]);
}


export function inRoom(room, x, z) {
  return Math.abs(x) <= room.hx + 1e-9 && Math.abs(z) <= room.hz + 1e-9;
}
