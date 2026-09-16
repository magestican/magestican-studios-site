
















import { generate as generateChest } from 'moon/art/kit/decor/chest.mjs';
import { generate as generateCrate } from 'moon/art/kit/decor/crate.mjs';
import { generate as generateBarrel } from 'moon/art/kit/decor/barrel.mjs';
import { toObject3D } from './toMesh.js';

const GENERATE = { chest: generateChest, crate: generateCrate, barrel: generateBarrel };




export const CARRY_LIFT = Object.freeze({ crate: 0.78, barrel: 1.0 });

const built = new Map();

export function containerKey(kind, { style = 1, season = 'summer', open = false, lod = 0 } = {}) {
  return `${kind}|${style}|${season}|${kind === 'chest' && open ? 'open' : 'shut'}|${lod}`;
}





export function containerMeshData(kind, { style = 1, season = 'summer', open = false, lod = 0 } = {}) {
  const generate = GENERATE[kind];
  if (!generate) throw new Error(`unknown container '${kind}'`);
  return kind === 'chest'
    ? generate({ seed: style, season, lod, stage: open ? 'open' : 'shut' })
    : generate({ seed: style, season, lod });
}

export async function containerObject(kind, { style = 1, season = 'summer', open = false, lod = 0 } = {}) {
  const key = containerKey(kind, { style, season, open, lod });
  if (!built.has(key)) {
    const job = (async () => {
      const data = containerMeshData(kind, { style, season, open, lod });
      const problems = data.validate();
      if (problems.length) throw new Error(`container ${key}: ${problems.join('; ')}`);
      const obj = await toObject3D(data);
      obj.name = `container:${key}`;
      const b = data.bounds();
      Object.assign(obj.userData, {
        container: { kind, style, open },
        triangles: data.triangleCount,
        
        top: b.max[1],
        halfWidth: Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]) / 2,
      });
      return obj;
    })();
    built.set(key, job);
    job.catch(() => built.delete(key));
  }
  const source = await built.get(key);
  const clone = source.clone();
  clone.userData = { ...source.userData };
  return clone;
}
