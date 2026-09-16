























export const DB_NAME = 'farmy-moon-life';
export const DB_VERSION = 1;
export const STORE = 'saves';



const OPEN_TIMEOUT_MS = 4000;


export function memorySaveStore(why = null) {
  const held = new Map();
  return {
    kind: 'memory',
    why,
    async get(slot) { return held.has(slot) ? held.get(slot) : null; },
    async put(slot, doc) { held.set(slot, doc); },
    async remove(slot) { held.delete(slot); },
    close() {},
  };
}

const request = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error || new Error('the request failed'));
});




export async function openSaveStore({ indexedDB = globalThis.indexedDB, name = DB_NAME } = {}) {
  if (!indexedDB) return memorySaveStore('this browser has no IndexedDB');
  let db;
  try {
    db = await openDb(indexedDB, name);
  } catch (e) {
    return memorySaveStore(String(e && e.message ? e.message : e));
  }

  
  
  
  let live = true;
  const fallback = memorySaveStore('another tab upgraded the save database');
  db.onversionchange = () => { live = false; db.close(); };

  const tx = (mode, run) => new Promise((resolve, reject) => {
    let out;
    let t;
    try {
      t = db.transaction(STORE, mode);
    } catch (e) {                      
      reject(e);
      return;
    }
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error || new Error('the transaction failed'));
    t.onabort = () => reject(t.error || new Error('the transaction was aborted'));
    run(t.objectStore(STORE)).then((v) => { out = v; }, reject);
  });

  return {
    kind: 'idb',
    why: null,
    async get(slot) {
      if (!live) return fallback.get(slot);
      const v = await tx('readonly', (s) => request(s.get(slot)));
      return v === undefined ? null : v;
    },
    async put(slot, doc) {
      if (!live) return fallback.put(slot, doc);
      
      
      
      return tx('readwrite', (s) => request(s.put(doc, slot)));
    },
    async remove(slot) {
      if (!live) return fallback.remove(slot);
      return tx('readwrite', (s) => request(s.delete(slot)));
    },
    close() { live = false; db.close(); },
  };
}

function openDb(indexedDB, name) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, v) => { if (!settled) { settled = true; fn(v); } };
    const timer = setTimeout(() => finish(reject, new Error(`IndexedDB did not answer in ${OPEN_TIMEOUT_MS} ms`)), OPEN_TIMEOUT_MS);
    const done = (fn, v) => { clearTimeout(timer); finish(fn, v); };
    let req;
    try {
      req = indexedDB.open(name, DB_VERSION);
    } catch (e) {                      
      done(reject, e);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => done(resolve, req.result);
    req.onerror = () => done(reject, req.error || new Error('IndexedDB refused to open'));
    req.onblocked = () => done(reject, new Error('another tab is holding an older save database open'));
  });
}
