











import * as room from 'moon/art/houseRoom.mjs';
import { toObject3D } from './toMesh.js';

export const HOUSE_ROOM_SPECIES = room.SPECIES;

const built = new Map();

function checked(species) {
  if (!room.SPECIES.includes(species)) throw new Error(`unknown house room species '${species}' (species: ${room.SPECIES.join(', ')})`);
  return species;
}

export function houseRoomKey(species, { seed = 1, season = 'summer', lod = 0 } = {}) {
  checked(species);
  return `${species}|${seed}|${season}|${lod}`;
}


export function houseRoomAnchors(species, { seed = 1 } = {}) {
  return room.anchors({ seed, species: checked(species) });
}

export async function houseRoomObject(species, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const key = houseRoomKey(species, { seed, season, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = room.generate({ seed, season, lod, species });
      const problems = data.validate();
      if (problems.length) throw new Error(`house room ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `houseRoom:${key}`;
      Object.assign(obj.userData, { room: { species, seed, key, anchors: room.anchors({ seed, species }) }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  const obj = (await built.get(key)).clone();
  obj.userData.room = { ...obj.userData.room, anchors: structuredClone(obj.userData.room.anchors) };
  return obj;
}
