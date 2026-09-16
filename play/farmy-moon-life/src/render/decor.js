









import { anchorsOf, artOf, generate } from 'moon/art/decor.mjs';
import { toObject3D } from './toMesh.js';

const built = new Map();

export const decorKey = (item, { season = 'summer', lod = 0 } = {}) => `${item}|${season}|${lod}`;


export const decorMeshData = (item, { season = 'summer', lod = 0 } = {}) => generate({ ...artOf(item), season, lod });


export const decorAnchors = (item) => anchorsOf(item);

export async function decorObject(item, { season = 'summer', lod = 0 } = {}) {
  const key = decorKey(item, { season, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = decorMeshData(item, { season, lod });
      const problems = data.validate();
      if (problems.length) throw new Error(`decor ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `decor:${key}`;
      Object.assign(obj.userData, { decor: { item, key }, triangles: data.triangleCount });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  return (await built.get(key)).clone();
}
