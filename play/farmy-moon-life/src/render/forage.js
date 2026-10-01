










import { generate } from 'moon/art/forageSpot.mjs';
import { fromRaw } from 'moon/mesh/meshRaw.mjs';
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














let offThread = null;
let workerLive = () => true;
export function setForageWorker(run, { live = () => true } = {}) { offThread = run; workerLive = live; }
const forageWorkerLive = () => { if (!offThread) return false; try { return workerLive() !== false; } catch { return false; } };
const priming = new Map();


export function foragePrimed(type, opts = {}) {
  return meshes.has(forageKey(type, opts));
}


export function primeForage(type, opts = {}, { background = false } = {}) {
  const key = forageKey(type, opts);
  if (meshes.has(key)) return Promise.resolve(true);
  if (priming.has(key)) return priming.get(key);
  if (background && !forageWorkerLive()) return Promise.resolve(false);
  const { seed = 1, season = 'summer', stage = 'ready', lod = 0 } = opts;
  const run = offThread;
  const job = (async () => {
    if (run && forageWorkerLive()) {
      try {
        const { payload } = await run({ art: 'forage', type, seed, season, stage, lod });
        if (!meshes.has(key)) meshes.set(key, fromRaw(payload));
        return true;
      } catch {  }
    }
    if (background) return false;
    await new Promise((r) => setTimeout(r, 0));
    forageMeshCached(type, opts);
    return true;
  })().catch(() => false).finally(() => priming.delete(key));
  priming.set(key, job);
  return job;
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
