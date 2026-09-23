






















































import { CRAFTABLES } from '../economy/craftables.mjs';
import { PLAYER_RADIUS_M } from '../world/collision.mjs';
import { wallsOf } from '../art/interiorPlan.mjs';

export const FURNISH = Object.freeze({
  
  
  aheadM: 0.5,
  
  
  wallGapM: 0.04,
  
  gapM: 0.05,
  
  doorGapM: 0.45,
  
  fillM: 0.1,
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
  
  
  const r = floorRectAt(room, player.x, player.z);
  const limX = Math.max(0, r.hx - box.hx - cfg.wallGapM);
  const limZ = Math.max(0, r.hz - box.hz - cfg.wallGapM);
  const clamp = (v, c, lim) => Math.max(c - lim, Math.min(c + lim, v));
  return {
    x: clamp(player.x + Math.sin(h) * cfg.aheadM, r.x, limX),
    z: clamp(player.z + Math.cos(h) * cfg.aheadM, r.z, limZ),
  };
}





export function floorRectAt(room, x, z) {
  let best = null, bd = Infinity;
  for (const r of room.floor) {
    const d = Math.hypot(Math.max(0, Math.abs(x - r.x) - r.hx), Math.max(0, Math.abs(z - r.z) - r.hz));
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}


const builtIn = (room) => (room.plan ? wallsOf(room.plan).filter((w) => w.module !== 'houseWall') : []);







export function whyNotFurnishHere(x, z, { room, hx = 0.2, hz = 0.2, rotY = 0, placed = [] } = {}, cfg = FURNISH) {
  if (!room) return 'You have no house to put that in yet.';
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'There is no floor there.';
  const box = turnedBox(hx, hz, rotY);
  const fits = (r) => Math.abs(x - r.x) + box.hx + cfg.wallGapM <= r.hx + 1e-9 && Math.abs(z - r.z) + box.hz + cfg.wallGapM <= r.hz + 1e-9;
  if (!room.floor.some(fits)) {
    return 'That will not fit against the wall - stand further into the room.';
  }
  for (const f of builtIn(room)) {
    if (f.module === 'fixture' && Math.abs(f.x - x) < box.hx + f.hx + cfg.gapM && Math.abs(f.z - z) < box.hz + f.hz + cfg.gapM) {
      return 'The house has something standing there already.';
    }
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
  
  
  
  
  const fixed = builtIn(room).map((b) => ({ x: b.x, z: b.z, hx: b.hx, hz: b.hz }));
  const pieces = placed.map((p) => ({ x: p.x, z: p.z, ...turnedBox(p.hx, p.hz, p.rotY || 0) }));
  const after = flood(room, [...fixed, ...pieces], cfg);
  if (!after) return false;
  const before = pieces.length ? flood(room, fixed, cfg) : after;
  if (!before) return true;
  for (const k of before.seen) if (after.free(k) && !after.seen.has(k)) return false;
  return true;
}



function flood(room, boxes, cfg) {
  const step = cfg.fillM;
  const R = PLAYER_RADIUS_M;
  const limX = room.hx - R, limZ = room.hz - R;
  if (limX <= 0 || limZ <= 0) return { seen: new Set(), free: () => false };
  const nx = Math.floor(limX / step), nz = Math.floor(limZ / step);
  const open = (i, j) => {
    const x = i * step, z = j * step;
    if (Math.abs(x) > limX || Math.abs(z) > limZ) return false;
    for (const b of boxes) if (Math.abs(b.x - x) < b.hx + R && Math.abs(b.z - z) < b.hz + R) return false;
    return true;
  };
  let seed = null, best = Infinity;
  for (let i = -nx; i <= nx; i++) {
    for (let j = -nz; j <= nz; j++) {
      const d = Math.hypot(i * step - room.atDoor.x, j * step - room.atDoor.z);
      if (d < best && d <= cfg.doorGapM + step && open(i, j)) { best = d; seed = [i, j]; }
    }
  }
  if (!seed) return null;
  const seen = new Set([`${seed[0]},${seed[1]}`]);
  const queue = [seed];
  while (queue.length) {
    const [i, j] = queue.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj, k = `${a},${b}`;
      if (seen.has(k) || !open(a, b)) continue;
      seen.add(k);
      queue.push([a, b]);
    }
  }
  return { seen, free: (k) => { const [i, j] = k.split(',').map(Number); return open(i, j); } };
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
