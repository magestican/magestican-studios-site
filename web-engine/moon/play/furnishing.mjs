





















































import { CRAFTABLES } from '../economy/craftables.mjs';
import { PLAYER_RADIUS_M } from '../world/collision.mjs';

export const FURNISH = Object.freeze({
  
  
  aheadM: 0.5,
  
  
  wallGapM: 0.04,
  
  gapM: 0.05,
  
  doorGapM: 0.45,
  
  fillM: 0.05,
});


export const FURNITURE_ITEMS = Object.freeze(Object.keys(CRAFTABLES).filter((id) => CRAFTABLES[id].category === 'furniture'));


export const isFurnitureItem = (item) => FURNITURE_ITEMS.includes(item);





export const roomOf = (p) => (p && p.spot && Number.isInteger(p.spot.room) ? p.spot.room : null);


export const furnishedSpot = (home, x, z, rotY = 0) => ({ x, z, rotY, room: home.id });


export function furnitureIn(world, homeId) {
  return (world.placed || []).filter((p) => roomOf(p) === homeId).sort((a, b) => a.id - b.id);
}


export function turnedBox(hx, hz, rotY = 0) {
  const c = Math.abs(Math.cos(rotY)), s = Math.abs(Math.sin(rotY));
  return { hx: hx * c + hz * s, hz: hx * s + hz * c };
}








export function furnishSpot(player, room, { hx = 0.2, hz = 0.2, rotY = 0 } = {}, cfg = FURNISH) {
  const h = player.heading || 0;
  const box = turnedBox(hx, hz, rotY);
  const limX = Math.max(0, room.floor.hx - box.hx - cfg.wallGapM);
  const limZ = Math.max(0, room.floor.hz - box.hz - cfg.wallGapM);
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));
  return {
    x: clamp(player.x + Math.sin(h) * cfg.aheadM, limX),
    z: clamp(player.z + Math.cos(h) * cfg.aheadM, limZ),
  };
}







export function whyNotFurnishHere(x, z, { room, hx = 0.2, hz = 0.2, rotY = 0, placed = [] } = {}, cfg = FURNISH) {
  if (!room) return 'You have no house to put that in yet.';
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'There is no floor there.';
  const box = turnedBox(hx, hz, rotY);
  if (Math.abs(x) + box.hx + cfg.wallGapM > room.floor.hx + 1e-9
    || Math.abs(z) + box.hz + cfg.wallGapM > room.floor.hz + 1e-9) {
    return 'That will not fit against the wall - stand further into the room.';
  }
  if (Math.hypot(x - room.atDoor.x, z - room.atDoor.z) < cfg.doorGapM + Math.max(box.hx, box.hz)) {
    return 'Keep the doorway clear - you have to be able to get out.';
  }
  for (const p of placed) {
    const other = turnedBox(p.hx, p.hz, p.rotY || 0);
    if (Math.abs(p.x - x) < box.hx + other.hx + cfg.gapM && Math.abs(p.z - z) < box.hz + other.hz + cfg.gapM) {
      return 'Something of yours is already there.';
    }
  }
  if (!floorStaysOneRoom(room, [...placed, { x, z, rotY, hx, hz }], cfg)) {
    return 'That would shut you in - leave yourself a way round it.';
  }
  return null;
}







export function floorStaysOneRoom(room, placed, cfg = FURNISH) {
  const step = cfg.fillM;
  const R = PLAYER_RADIUS_M;
  const limX = room.hx - R, limZ = room.hz - R;
  if (limX <= 0 || limZ <= 0) return true;
  const boxes = placed.map((p) => ({ x: p.x, z: p.z, ...turnedBox(p.hx, p.hz, p.rotY || 0) }));
  const nx = Math.floor(limX / step), nz = Math.floor(limZ / step);
  const free = (i, j) => {
    const x = i * step, z = j * step;
    if (Math.abs(x) > limX || Math.abs(z) > limZ) return false;
    for (const b of boxes) if (Math.abs(b.x - x) < b.hx + R && Math.abs(b.z - z) < b.hz + R) return false;
    return true;
  };
  
  
  let seed = null, best = Infinity;
  for (let i = -nx; i <= nx; i++) {
    for (let j = -nz; j <= nz; j++) {
      if (!free(i, j)) continue;
      const d = Math.hypot(i * step - room.atDoor.x, j * step - room.atDoor.z);
      if (d < best) { best = d; seed = [i, j]; }
    }
  }
  if (!seed) return false;
  if (best > cfg.doorGapM + step) return false;
  const seen = new Set([`${seed[0]},${seed[1]}`]);
  const queue = [seed];
  while (queue.length) {
    const [i, j] = queue.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj, k = `${a},${b}`;
      if (seen.has(k) || !free(a, b)) continue;
      seen.add(k);
      queue.push([a, b]);
    }
  }
  let total = 0;
  for (let i = -nx; i <= nx; i++) for (let j = -nz; j <= nz; j++) if (free(i, j)) total += 1;
  return seen.size === total;
}





export function furnitureFootprints(world, homeId, sizeOf, skip = null) {
  return furnitureIn(world, homeId).filter((p) => p.id !== skip).map((p) => {
    const a = sizeOf(p.item);
    return { id: p.id, x: p.spot.x, z: p.spot.z, rotY: p.spot.rotY || 0, hx: a.hx, hz: a.hz };
  });
}


export function furnitureTargets(world, homeId, sizeOf) {
  return furnitureIn(world, homeId).map((p) => Object.freeze({
    type: 'placed', id: p.id, item: p.item, x: p.spot.x, z: p.spot.z, r: Math.max(sizeOf(p.item).hx, sizeOf(p.item).hz),
  }));
}


export function furnitureObstacle(p, { hx, hz }) {
  const rotY = (p.spot && p.spot.rotY) || 0;
  return Object.freeze({
    shape: 'box', module: 'furniture', x: p.spot.x, z: p.spot.z,
    cos: Math.cos(rotY), sin: Math.sin(rotY), hx, hz, reach: Math.hypot(hx, hz),
  });
}
