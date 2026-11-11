





























export const FILES_CACHE = 'offline-pack-files';
export const POINTER_CACHE = 'offline-pack-pointer';
export const POINTER_URL = '/__offline-pack/pointer';
export const BLOB_PREFIX = '/__offline-pack/sha/';



export const BYPASS_PARAM = 'offline-pack';


export class NotEnoughSpace extends Error {
  constructor(need, free) {
    super(`not enough storage: need ${need}, have ${free}`);
    this.name = 'NotEnoughSpace';
    this.need = need;
    this.free = free;
  }
}









export function planFiles(appManifest, pagesManifest) {
  const files = {};
  for (const source of [appManifest.files, pagesManifest.files]) {
    for (const [rel, entry] of Object.entries(source)) {
      if (rel.endsWith('version.json')) continue;
      files[`/${rel}`] = { sha256: entry.sha256, bytes: entry.bytes };
    }
  }
  return files;
}


export async function readPointer(cacheStorage = caches) {
  const cache = await cacheStorage.open(POINTER_CACHE);
  const hit = await cache.match(POINTER_URL);
  return hit ? hit.json() : null;
}

export async function removePack(cacheStorage = caches) {
  await cacheStorage.delete(POINTER_CACHE);
  await cacheStorage.delete(FILES_CACHE);
}

const hexOf = (buffer) => [...new Uint8Array(buffer)]
  .map((b) => b.toString(16).padStart(2, '0')).join('');


async function fetchBlob({ path, sha256, cache, fetchImpl, digest, buildId, signal }) {
  const url = `${path}?${BYPASS_PARAM}=${encodeURIComponent(buildId)}`;
  const res = await fetchImpl(url, { signal });
  if (!res.ok) return false;
  const bytes = await res.arrayBuffer();
  if (hexOf(await digest('SHA-256', bytes)) !== sha256) return false;
  
  
  const type = res.headers.get('content-type') || 'application/octet-stream';
  await cache.put(BLOB_PREFIX + sha256, new Response(bytes, {
    status: 200, headers: { 'Content-Type': type },
  }));
  return true;
}

async function loadPlan(fetchImpl, signal) {
  const read = async (name) => {
    const res = await fetchImpl(`/${name}?${BYPASS_PARAM}=${Date.now()}`, { signal });
    if (!res.ok) throw new Error(`${name} answered ${res.status}`);
    return res.json();
  };
  const [app, pages] = await Promise.all([read('app-manifest.json'), read('offline-pages.json')]);
  
  if (app.buildId !== pages.buildId) return null;
  return { buildId: app.buildId, files: planFiles(app, pages) };
}








export async function downloadPack({
  fetchImpl = (...a) => fetch(...a),
  cacheStorage = caches,
  digest = (...a) => crypto.subtle.digest(...a),
  storage = typeof navigator !== 'undefined' ? navigator.storage : undefined,
  onProgress = () => {},
  signal,
  concurrency = 6,
  maxBuilds = 3,
} = {}) {
  const cache = await cacheStorage.open(FILES_CACHE);
  let lastBuild = null;

  for (let round = 0; round < maxBuilds; round += 1) {
    const plan = await loadPlan(fetchImpl, signal);
    if (!plan) continue;

    const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    const wanted = new Map();
    for (const [path, { sha256, bytes }] of Object.entries(plan.files)) {
      if (!wanted.has(sha256)) wanted.set(sha256, { path, sha256, bytes });
    }
    const missing = [...wanted.values()].filter((f) => !have.has(BLOB_PREFIX + f.sha256));
    const missingBytes = missing.reduce((n, f) => n + f.bytes, 0);
    const totalBytes = [...wanted.values()].reduce((n, f) => n + f.bytes, 0);
    let doneBytes = totalBytes - missingBytes;
    onProgress({ doneBytes, totalBytes });

    
    
    if (storage && storage.estimate && missingBytes > 0) {
      const { quota = Infinity, usage = 0 } = await storage.estimate();
      if (quota - usage < missingBytes) throw new NotEnoughSpace(missingBytes, quota - usage);
    }

    let next = 0;
    let badFile = null;
    const worker = async () => {
      while (next < missing.length && !badFile) {
        const file = missing[next];
        next += 1;
        const ok = await fetchBlob({
          ...file, cache, fetchImpl, digest, buildId: plan.buildId, signal,
        });
        if (!ok) { badFile = file.path; return; }
        doneBytes += file.bytes;
        onProgress({ doneBytes, totalBytes });
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, missing.length) }, worker));

    if (badFile) {
      if (plan.buildId === lastBuild) throw new Error(`could not fetch ${badFile} intact`);
      lastBuild = plan.buildId;
      continue;
    }

    const files = {};
    for (const [path, { sha256 }] of Object.entries(plan.files)) files[path] = sha256;
    const pointer = await cacheStorage.open(POINTER_CACHE);
    await pointer.put(POINTER_URL, new Response(JSON.stringify({ buildId: plan.buildId, files }), {
      headers: { 'Content-Type': 'application/json' },
    }));

    
    
    const keep = new Set([...wanted.keys()].map((sha) => BLOB_PREFIX + sha));
    await Promise.all((await cache.keys())
      .filter((r) => !keep.has(new URL(r.url).pathname))
      .map((r) => cache.delete(r)));

    return { buildId: plan.buildId, totalBytes };
  }
  throw new Error('the site kept changing during the download');
}
