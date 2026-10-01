












import * as shop from 'moon/art/shop.mjs';
import * as processor from 'moon/art/processor.mjs';
import { toObject3D } from './toMesh.js';

const MODULES = { shop, processor };
export const BUILDING_TYPES = Object.freeze(Object.keys(MODULES));

const built = new Map();

function moduleOf(type) {
  const mod = MODULES[type];
  if (!mod) throw new Error(`unknown building type '${type}' (types: ${BUILDING_TYPES.join(', ')})`);
  return mod;
}

export function buildingKey(type, { seed = 1, season = 'summer', stage = 'level1', lod = 0 } = {}) {
  moduleOf(type);
  return `${type}|${seed}|${season}|${stage}|${lod}`;
}

export function buildingMeshData(type, { seed = 1, season = 'summer', stage = 'level1', lod = 0 } = {}) {
  return moduleOf(type).generate({ seed, season, stage, lod });
}


export function buildingAnchors(type, { seed = 1, stage = 'level1' } = {}) {
  return moduleOf(type).anchors({ seed, stage });
}

export async function buildingObject(type, { seed = 1, season = 'summer', stage = 'level1', lod = 0 } = {}) {
  const key = buildingKey(type, { seed, season, stage, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = buildingMeshData(type, { seed, season, stage, lod });
      const problems = data.validate();
      if (problems.length) throw new Error(`building ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data, { shadowProxy: true });
      obj.name = `building:${key}`;
      Object.assign(obj.userData, { building: { type, key, stage, anchors: buildingAnchors(type, { seed, stage }) }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  const obj = (await built.get(key)).clone();
  
  
  obj.userData.building = { ...obj.userData.building, anchors: structuredClone(obj.userData.building.anchors) };
  return obj;
}
