











import { generate, itemOf } from 'moon/art/item.mjs';
import { toObject3D } from './toMesh.js';

const built = new Map();

export function itemKey(good, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const { kind, variant } = itemOf(good);
  return `${kind}|${variant ?? ''}|${seed}|${season}|${lod}`;
}


export function itemMeshData(good, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const { kind, variant } = itemOf(good);
  return generate({ kind, variant, seed, season, lod });
}

export async function itemObject(good, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const key = itemKey(good, { seed, season, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = itemMeshData(good, { seed, season, lod });
      const problems = data.validate();
      if (problems.length) throw new Error(`item ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `item:${key}`;
      Object.assign(obj.userData, { item: { good, key }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  return (await built.get(key)).clone();
}
