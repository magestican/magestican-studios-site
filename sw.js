





























const BUILD = 'a42ac69d-20261111T203029Z';
const CACHE = `magestican-${BUILD}`;





const SHELL = [
  '/',
  '/offline.html',
  
  
  `/styles.css?v=${BUILD}`,
  '/assets/logo.svg',
  '/assets/icon-192.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    
    
    
    await Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})));
    
    
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('magestican-') && n !== CACHE)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});


const isPage = (req) => req.mode === 'navigate'
  || (req.headers.get('accept') || '').includes('text/html');













const PACK_FILES = 'offline-pack-files';
const PACK_POINTER = 'offline-pack-pointer';
const PACK_POINTER_URL = '/__offline-pack/pointer';
const PACK_BLOB_PREFIX = '/__offline-pack/sha/';
const PACK_BYPASS_PARAM = 'offline-pack';



let packIndex;
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'offline-pack-changed') packIndex = undefined;
});

async function readPackIndex() {
  if (packIndex === undefined) {
    const hit = await (await caches.open(PACK_POINTER)).match(PACK_POINTER_URL);
    packIndex = hit ? (await hit.json()).files : null;
  }
  return packIndex;
}







async function sliceForRange(whole, rangeHeader) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || (!match[1] && !match[2])) return whole;
  const bytes = await whole.arrayBuffer();
  const size = bytes.byteLength;
  
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': whole.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}


async function fromPack(url, request) {
  const index = await readPackIndex();
  if (!index) return null;
  let path = url.pathname;
  try { path = decodeURIComponent(path); } catch {  }
  if (path.endsWith('/')) path += 'index.html';
  const sha = index[path];
  if (!sha) return null;
  const whole = await (await caches.open(PACK_FILES)).match(PACK_BLOB_PREFIX + sha);
  if (!whole) return null;
  const range = request.headers.get('range');
  return range ? sliceForRange(whole, range) : whole;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  
  
  
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  
  
  
  
  
  
  
  if (url.pathname.endsWith('version.json')) return;
  
  
  if (url.searchParams.has(PACK_BYPASS_PARAM)) return;

  if (isPage(request)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const packed = await fromPack(url, request);
        if (packed) return packed;
        const hit = await caches.match(request);
        if (hit) return hit;
        
        
        const fallback = await caches.match('/offline.html');
        return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const immutable = url.search.includes('v=') || url.pathname.startsWith('/assets/');
  
  
  
  
  
  
  
  
  
  const code = !immutable && (request.destination === 'script'
    || request.destination === 'worker'
    || /\.m?js$/.test(url.pathname));

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    const network = fetch(request).then((fresh) => {
      
      
      if (fresh && fresh.status === 200 && fresh.type === 'basic') cache.put(request, fresh.clone());
      return fresh;
    }).catch(() => null);

    if (code) {
      const fresh = await network;
      return fresh || await fromPack(url, request) || hit || new Response('', { status: 504 });
    }
    if (hit && immutable) return hit;
    if (hit) {
      
      event.waitUntil(network);
      return hit;
    }
    const fresh = await network;
    return fresh || await fromPack(url, request) || new Response('', { status: 504 });
  })());
});
