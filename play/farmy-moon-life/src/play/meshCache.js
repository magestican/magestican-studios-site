



































import { PAYLOAD_VERSION, payloadBytes, validatePayload } from 'moon/mesh/meshPayload.mjs';

export const MESH_DB_NAME = 'farmy-moon-life-mesh';
export const MESH_DB_VERSION = 1;
export const MESH_STORE = 'meshes';





export const MAX_ROWS = 48;




const OPEN_TIMEOUT_MS = 3000;


export function memoryMeshCache(why = null) {
  const held = new Map();
  return {
    kind: 'memory',
    why,
    async get(key) { return held.has(key) ? held.get(key) : null; },
    async getMany(keys) { return keys.map((k) => (held.has(k) ? held.get(k) : null)); },
    async put(key, payload) { held.set(key, payload); },
    async putMany(rows) { for (const { key, payload } of rows) held.set(key, payload); return true; },
    async sweep() { return 0; },
    async clear() { held.clear(); },
    close() {},
  };
}

const request = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error || new Error('the request failed'));
});




export async function openMeshCache({ indexedDB = globalThis.indexedDB, name = MESH_DB_NAME } = {}) {
  if (!indexedDB) return memoryMeshCache('this browser has no IndexedDB');
  let db;
  try {
    db = await openDb(indexedDB, name);
  } catch (e) {
    return memoryMeshCache(String(e && e.message ? e.message : e));
  }

  let live = true;
  
  
  
  db.onversionchange = () => { live = false; db.close(); };

  const tx = (mode, run) => new Promise((resolve, reject) => {
    if (!live) { reject(new Error('the mesh cache was closed')); return; }
    let t;
    try {
      t = db.transaction(MESH_STORE, mode);
    } catch (e) { reject(e); return; }
    let result;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error || new Error('the transaction failed'));
    t.onabort = () => reject(t.error || new Error('the transaction was aborted'));
    Promise.resolve(run(t.objectStore(MESH_STORE))).then((r) => { result = r; }, reject);
  });

  
  
  
  const sound = (row) => Boolean(row && row.payload && row.payload.v === PAYLOAD_VERSION && validatePayload(row.payload).length === 0);

  async function get(key) {
    try {
      const row = await tx('readonly', (store) => request(store.get(key)));
      if (!sound(row)) {
        if (row) drop(key);
        return null;
      }
      touch(key, row);
      return row.payload;
    } catch {
      return null;
    }
  }

  
  
  
  async function getMany(keys) {
    try {
      const rows = await tx('readonly', async (store) => {
        const out = [];
        for (const key of keys) out.push(await request(store.get(key)));
        return out;
      });
      return rows.map((row, i) => {
        if (!sound(row)) {
          if (row) drop(keys[i]);
          return null;
        }
        touch(keys[i], row);
        return row.payload;
      });
    } catch {
      return keys.map(() => null);
    }
  }

  async function put(key, payload) {
    return putMany([{ key, payload }]);
  }

  









  async function putMany(rows) {
    if (!rows.length) return true;
    const at = Date.now();
    try {
      await tx('readwrite', (store) => {
        for (const { key, payload } of rows) store.put({ key, at, bytes: payloadBytes(payload), payload });
      });
      return true;
    } catch {
      
      
      sweep().catch(() => {});
      return false;
    }
  }

  
  
  
  function touch(key, row) {
    const at = Date.now();
    if (at - row.at < 60_000) return;
    tx('readwrite', (store) => store.put({ ...row, at })).catch(() => {});
  }

  function drop(key) {
    tx('readwrite', (store) => store.delete(key)).catch(() => {});
  }

  



  async function sweep(max = MAX_ROWS) {
    try {
      return await tx('readwrite', async (store) => {
        const rows = await request(store.getAll());
        let gone = 0;
        const keep = [];
        for (const row of rows) {
          if (!row || !row.payload || row.payload.v !== PAYLOAD_VERSION) {
            store.delete(row.key);
            gone += 1;
          } else keep.push(row);
        }
        keep.sort((a, b) => (b.at || 0) - (a.at || 0));
        for (const row of keep.slice(max)) {
          store.delete(row.key);
          gone += 1;
        }
        return gone;
      });
    } catch {
      return 0;
    }
  }

  return {
    kind: 'idb',
    why: null,
    get,
    getMany,
    put,
    putMany,
    sweep,
    async clear() { try { await tx('readwrite', (store) => store.clear()); } catch {  } },
    close() { live = false; try { db.close(); } catch {  } },
  };
}

function openDb(indexedDB, name) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, value) => { if (!settled) { settled = true; fn(value); } };
    const timer = setTimeout(() => done(reject, new Error('opening the mesh cache timed out')), OPEN_TIMEOUT_MS);
    let req;
    try {
      req = indexedDB.open(name, MESH_DB_VERSION);
    } catch (e) {
      clearTimeout(timer);
      done(reject, e);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MESH_STORE)) db.createObjectStore(MESH_STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => { clearTimeout(timer); done(resolve, req.result); };
    req.onerror = () => { clearTimeout(timer); done(reject, req.error || new Error('the mesh cache would not open')); };
    
    req.onblocked = () => { clearTimeout(timer); done(reject, new Error('another tab holds the mesh cache')); };
  });
}
