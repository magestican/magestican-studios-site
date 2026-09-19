































































const CACHE = 'farmy-moon-l19-1';
const CACHE_PREFIX = 'farmy-moon-';




const CDN_HOSTS = [];


const SHELL = ['./'];

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
      .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});


function keep(url) {
  if (!url) return false;
  let u;
  try {
    u = new URL(String(url), self.location.origin);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.pathname.endsWith('version.json')) return false;
  if (u.origin === self.location.origin) return true;
  return CDN_HOSTS.indexOf(u.hostname) !== -1;
}










async function keepOne(cache, url) {
  const request = new Request(url, { mode: 'cors', credentials: 'omit' });
  const res = await fetch(request);
  if (!res || !res.ok) throw new Error(`not ok: ${url}`);
  await cache.put(url, res.clone());
  return true;
}





self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'keep-offline') return;
  const urls = Array.isArray(data.urls) ? data.urls : [];
  const reply = (payload) => {
    if (event.source && event.source.postMessage) event.source.postMessage(payload);
    for (const port of event.ports || []) port.postMessage(payload);
  };
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let kept = 0;
    let failed = 0;
    
    
    
    for (const url of urls) {
      if (!keep(url)) continue;
      const already = await cache.match(url, { ignoreVary: true });
      if (already) { kept += 1; continue; }
      try {
        await keepOne(cache, url);
        kept += 1;
      } catch {
        failed += 1;
      }
    }
    const all = await cache.keys();
    reply({ type: 'kept-offline', kept, failed, files: all.length, cache: CACHE });
  })());
});

const isPage = (req) => req.mode === 'navigate'
  || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  
  
  if (request.method !== 'GET') return;
  if (!keep(request.url)) return;

  if (isPage(request)) {
    
    
    
    
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(request);
        
        
        
        
        if (fresh && fresh.ok) cache.put(self.registration.scope, fresh.clone());
        return fresh;
      } catch {
        const hit = await cache.match(self.registration.scope, { ignoreSearch: true, ignoreVary: true })
          || await cache.match(request, { ignoreSearch: true, ignoreVary: true });
        if (hit) return hit;
        return new Response('<!doctype html><meta charset=utf-8><title>Farmy Moon Life</title>'
          + '<p style="font:16px/1.4 system-ui;padding:24px">Open this page once with a connection '
          + 'and it will work without one afterwards.',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  
  
  
  
  
  
  
  
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, { ignoreVary: true });
    const network = fetch(request).then((fresh) => {
      
      
      if (fresh && fresh.ok && fresh.type !== 'opaque') cache.put(request, fresh.clone());
      return fresh;
    }).catch(() => null);

    if (hit) {
      event.waitUntil(network);
      return hit;
    }
    const fresh = await network;
    return fresh || new Response('', { status: 504 });
  })());
});
