











import { generate, itemOf } from 'moon/art/item.mjs';
import { fromPayload } from 'moon/mesh/meshPayload.mjs';
import { POP_VARIANTS } from 'moon/play/pop.mjs';
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

async function objectOf(good, key, data) {
  const problems = data.validate();
  if (problems.length) throw new Error(`item ${key}: ${problems.join('; ')}`);
  const obj = await toObject3D(data);
  obj.name = `item:${key}`;
  Object.assign(obj.userData, { item: { good, key }, triangles: data.triangleCount });
  return obj;
}

function remember(key, job) {
  built.set(key, job);
  job.catch(() => built.delete(key));
  return job;
}

export async function itemObject(good, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const key = itemKey(good, { seed, season, lod });
  if (!built.has(key)) remember(key, (async () => objectOf(good, key, itemMeshData(good, { seed, season, lod })))());
  return (await built.get(key)).clone();
}















let offThread = null;
export function setItemWorker(run) { offThread = run; }

export function primeItem(good, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const key = itemKey(good, { seed, season, lod });
  if (built.has(key)) return built.get(key).then(() => true, () => false);
  const run = offThread;
  const job = (async () => {
    let data = null;
    if (run) {
      try { data = fromPayload((await run({ good, seed, season, lod })).payload); } catch { data = null; }
    }
    return objectOf(good, key, data || itemMeshData(good, { seed, season, lod }));
  })();
  remember(key, job);
  return job.then(() => true, () => false);
}







export async function prewarmItems(goods, { season = 'summer' } = {}) {
  for (const good of new Set(goods)) {
    for (let v = 1; v <= POP_VARIANTS; v += 1) {
      if (itemPrimed(good, { seed: v, season, lod: 0 })) continue;
      await primeItem(good, { seed: v, season, lod: 0 });
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}


export function itemPrimed(good, opts = {}) {
  return built.has(itemKey(good, opts));
}
