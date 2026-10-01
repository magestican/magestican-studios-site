











import * as room from 'moon/art/houseRoom.mjs';
import { toObject3D } from './toMesh.js';

export const HOUSE_ROOM_SPECIES = room.SPECIES;

const built = new Map();

function checked(species) {
  if (!room.SPECIES.includes(species)) throw new Error(`unknown house room species '${species}' (species: ${room.SPECIES.join(', ')})`);
  return species;
}



export function houseRoomKey(species, { seed = 1, season = 'summer', lod = 0, storeys = 1, storey = 0, work = null, level = 1 } = {}) {
  checked(species);
  return `${species}|${seed}|${season}|${lod}${storeys === 2 ? `|floor${storey}` : ''}${work ? `|work-${work}-l${level}` : ''}`;
}


export function houseRoomAnchors(species, { seed = 1 } = {}) {
  return room.anchors({ seed, species: checked(species) });
}

export async function houseRoomObject(species, { seed = 1, season = 'summer', lod = 0, storeys = 1, storey = 0, work = null, level = 1 } = {}) {
  const key = houseRoomKey(species, { seed, season, lod, storeys, storey, work, level });
  if (!built.has(key)) {
    const job = (async () => {
      const data = room.generate({ seed, season, lod, species, storeys, storey, work, level });
      const problems = data.validate();
      if (problems.length) throw new Error(`house room ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `houseRoom:${key}`;
      Object.assign(obj.userData, { room: { species, seed, key, anchors: room.anchors({ seed, species, storeys, storey, work, level }) }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  const obj = (await built.get(key)).clone();
  obj.userData.room = { ...obj.userData.room, anchors: structuredClone(obj.userData.room.anchors) };
  return obj;
}
