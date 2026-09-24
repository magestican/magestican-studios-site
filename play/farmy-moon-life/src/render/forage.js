










import { generate } from 'moon/art/forageSpot.mjs';
import { toObject3D } from './toMesh.js';

const built = new Map();

export function forageKey(type, { seed = 1, season = 'summer', stage = 'ready', lod = 0 } = {}) {
  return `${type}|${seed}|${season}|${stage}|${lod}`;
}


export function forageMeshData(type, { seed = 1, season = 'summer', stage = 'ready', lod = 0 } = {}) {
  return generate({ type, seed, season, stage, lod });
}



const meshes = new Map();
export function forageMeshCached(type, opts = {}) {
  const key = forageKey(type, opts);
  if (!meshes.has(key)) {
    const data = forageMeshData(type, opts);
    const problems = data.validate();
    if (problems.length) throw new Error(`forage ${key}: ${problems.join('; ')}`);
    meshes.set(key, data);
  }
  return meshes.get(key);
}

export async function forageObject(type, { seed = 1, season = 'summer', stage = 'ready', lod = 0 } = {}) {
  const key = forageKey(type, { seed, season, stage, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = forageMeshData(type, { seed, season, stage, lod });
      const problems = data.validate();
      if (problems.length) throw new Error(`forage ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `forage:${key}`;
      Object.assign(obj.userData, { forage: { type, stage, key }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  return (await built.get(key)).clone();
}
