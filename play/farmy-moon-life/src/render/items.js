











import { generate, itemOf } from 'moon/art/item.mjs';
import { fromPayload } from 'moon/mesh/meshPayload.mjs';
import { POP_VARIANTS } from 'moon/play/pop.mjs';
import { toObject3D } from './toMesh.js';

const built = new Map();

export function itemKey(good, { seed = 1, season = 'summer', lod = 0 } = {}) {
  const { kind, variant } = itemOf(good);
  return `${kind}|${variant ?? ''}|${seed}|${season}|${lod}`;
}











export const itemStats = { onMainThread: 0, keys: [], skipped: 0 };


export function itemMeshData(good, { seed = 1, season = 'summer', lod = 0 } = {}, by = 'itemMeshData') {
  const { kind, variant } = itemOf(good);
  itemStats.onMainThread += 1;
  itemStats.keys.push(`${by}:${good}|${seed}|${season}|${lod}`);
  if (itemStats.keys.length > 20) itemStats.keys.shift();
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
  const make = () => { if (!built.has(key)) remember(key, (async () => objectOf(good, key, itemMeshData(good, { seed, season, lod }, 'itemObject')))()); };
  make();
  try {
    return (await built.get(key)).clone();
  } catch (e) {
    
    
    if (!(e && e.message === SKIPPED)) throw e;
    make();
    return (await built.get(key)).clone();
  }
}






























let offThread = null;
let workerLive = () => true;
export function setItemWorker(run, { live = () => true } = {}) { offThread = run; workerLive = live; }

export function itemWorkerLive() {
  if (!offThread) return false;
  try { return workerLive() !== false; } catch { return false; }
}



const SKIPPED = 'background item skipped: no live item worker';

export function primeItem(good, { seed = 1, season = 'summer', lod = 0 } = {}, { background = false } = {}) {
  const key = itemKey(good, { seed, season, lod });
  if (built.has(key)) return built.get(key).then(() => true, () => false);
  if (background && !itemWorkerLive()) { itemStats.skipped += 1; return Promise.resolve(false); }
  const run = offThread;
  const job = (async () => {
    let data = null;
    if (run && itemWorkerLive()) {
      try { data = fromPayload((await run({ good, seed, season, lod })).payload); } catch { data = null; }
    }
    if (!data && background) { itemStats.skipped += 1; throw new Error(SKIPPED); }
    return objectOf(good, key, data || itemMeshData(good, { seed, season, lod }, 'primeItem'));
  })();
  remember(key, job);
  return job.then(() => true, () => false);
}







export async function prewarmItems(goods, { season = 'summer' } = {}) {
  for (const good of new Set(goods)) {
    for (let v = 1; v <= POP_VARIANTS; v += 1) {
      if (!itemWorkerLive()) return;
      if (itemPrimed(good, { seed: v, season, lod: 0 })) continue;
      await primeItem(good, { seed: v, season, lod: 0 }, { background: true });
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}


export function itemPrimed(good, opts = {}) {
  return built.has(itemKey(good, opts));
}
