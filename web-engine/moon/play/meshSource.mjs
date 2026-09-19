





























import { generate, VILLAGER_VERSION } from '../art/villager.mjs';
import { toPayload, fromPayload } from '../mesh/meshPayload.mjs';








































export const WORKERS_BY_DEFAULT = false;






export function poolSize(cores = 2) {
  const n = Math.min(3, (cores || 2) - 1);
  return n >= 2 ? n : 0;
}






export function villagerKey({ species, seed = 1, season = 'summer', lod = 0, build }) {
  return `v${VILLAGER_VERSION}|${species}|${seed}|${season}|${lod}|${build || 'auto'}`;
}






export function createWorkerPool({ url, size = poolSize(globalThis.navigator?.hardwareConcurrency), Worker = globalThis.Worker } = {}) {
  if (!Worker || !url || size < 1) return null;
  const workers = [];
  try {
    for (let i = 0; i < size; i++) workers.push({ worker: new Worker(url, { type: 'module' }), busy: false });
  } catch {
    for (const w of workers) { try { w.worker.terminate(); } catch {  } }
    return null;
  }

  const waiting = [];          
  const pending = new Map();   
  let nextId = 1;
  let dead = false;

  function fail(reason) {
    
    
    
    dead = true;
    for (const { reject } of pending.values()) reject(new Error(reason));
    pending.clear();
    for (const { reject } of waiting.splice(0)) reject(new Error(reason));
    for (const w of workers) { try { w.worker.terminate(); } catch {  } }
  }

  for (const slot of workers) {
    slot.worker.onmessage = (e) => {
      const { id, payload, error } = e.data || {};
      const job = pending.get(id);
      if (!job) return;
      pending.delete(id);
      slot.busy = false;
      if (error) job.reject(new Error(error));
      else job.resolve({ payload, ms: e.data.ms });
      pump();
    };
    
    
    slot.worker.onerror = () => fail('the villager worker stopped');
    slot.worker.onmessageerror = () => fail('the villager worker sent something uncloneable');
  }

  function pump() {
    if (dead) return;
    for (const slot of workers) {
      if (slot.busy || !waiting.length) continue;
      const job = waiting.shift();
      const id = nextId++;
      slot.busy = true;
      pending.set(id, { resolve: job.resolve, reject: job.reject, slot });
      try {
        slot.worker.postMessage({ id, spec: job.spec });
      } catch (e) {
        pending.delete(id);
        slot.busy = false;
        job.reject(e);
      }
    }
  }

  return {
    size: workers.length,
    get queued() { return waiting.length; },
    run(spec) {
      if (dead) return Promise.reject(new Error('the villager worker stopped'));
      return new Promise((resolve, reject) => { waiting.push({ spec, resolve, reject }); pump(); });
    },
    close() { fail('the villager worker was closed'); },
  };
}





export function onIdle(fn, ms = 1000) {
  if (typeof globalThis.requestIdleCallback === 'function') globalThis.requestIdleCallback(fn, { timeout: ms });
  else setTimeout(fn, ms);
}






export function createVillagerSource({ cache = null, pool = null, generateMesh = generate, schedule = onIdle } = {}) {
  const inflight = new Map();
  
  
  
  
  
  
  
  
  
  const stats = { hits: 0, misses: 0, fromWorker: 0, fromMain: 0, stored: 0, workers: pool ? pool.size : 0, cache: 'none', workMs: 0, outstanding: 0 };
  const clock = () => (globalThis.performance ? performance.now() : Date.now());
  let cacheReady = null;

  async function theCache() {
    if (!cache) return null;
    if (!cacheReady) {
      cacheReady = Promise.resolve(cache).then(
        (c) => { stats.cache = c ? c.kind : 'none'; return c; },
        () => { stats.cache = 'none'; return null; },
      );
    }
    return cacheReady;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const absent = new Set();
  const pending = [];
  let flushing = false;

  function store(c, key, payload) {
    if (!c) return;
    absent.delete(key);
    pending.push({ key, payload });
    if (!flushing) { flushing = true; schedule(() => { flushing = false; flush(c); }); }
  }

  function flush(c) {
    const rows = pending.splice(0);
    if (!rows.length) return;
    const write = c.putMany ? c.putMany(rows) : Promise.all(rows.map((r) => c.put(r.key, r.payload)));
    Promise.resolve(write).then((ok) => { if (ok !== false) stats.stored += rows.length; }, () => {});
  }

  async function build(spec, key) {
    const c = await theCache();
    if (c && !absent.has(key)) {
      const hit = await c.get(key);
      if (hit) {
        
        
        const t0 = clock();
        const data = fromPayload(hit);
        stats.hits += 1;
        took(t0);
        return data;
      }
    }
    stats.misses += 1;
    if (pool) {
      try {
        const { payload, ms: workerMs } = await pool.run(spec);
        stats.fromWorker += 1;
        stats.workMs = Math.round((stats.workMs + (workerMs || 0)) * 10) / 10;
        store(c, key, payload);
        return fromPayload(payload);
      } catch {
        
        
      }
    }
    const t0 = clock();
    const data = generateMesh({ ...spec, ...(spec.build ? { build: spec.build } : {}) });
    stats.fromMain += 1;
    took(t0);
    
    
    
    if (c) store(c, key, toPayload(data));
    return data;
  }

  function started() {
    stats.outstanding += 1;
  }

  function finished() {
    stats.outstanding -= 1;
  }

  const took = (t0) => { stats.workMs = Math.round((stats.workMs + (clock() - t0)) * 10) / 10; };

  function meshFor(spec) {
    const key = villagerKey(spec);
    
    
    let p = inflight.get(key);
    if (!p) {
      started();
      p = build(spec, key);
      p.then(finished, finished);
      inflight.set(key, p);
      
      
      p.catch(() => inflight.delete(key));
    }
    return p;
  }

  

















  async function warm(specs) {
    const c = await theCache();
    if (!c || !c.getMany) return 0;
    const keys = specs.map(villagerKey).filter((k) => !inflight.has(k));
    if (!keys.length) return 0;
    const found = await c.getMany(keys);
    let got = 0;
    for (const [i, payload] of found.entries()) {
      if (!payload) { absent.add(keys[i]); continue; }
      if (inflight.has(keys[i])) continue;
      stats.hits += 1;
      got += 1;
      const t0 = clock();
      const data = fromPayload(payload);
      took(t0);
      inflight.set(keys[i], Promise.resolve(data));
    }
    return got;
  }

  return {
    stats,
    meshFor,
    warm,
    
    prefetch(specs) { for (const spec of specs) meshFor(spec); },
    





    async sweep() {
      const c = await theCache();
      return c && c.sweep ? c.sweep() : 0;
    },
    close() { if (pool) pool.close(); },
  };
}
