


























const BUILD = '039b78c-20260906T233912Z';
const CACHE = `magestican-${BUILD}`;





const SHELL = [
  '/',
  '/offline.html',
  '/styles.css',
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  
  
  
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  
  
  
  
  
  
  
  if (url.pathname.endsWith('version.json')) return;

  if (isPage(request)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const hit = await caches.match(request);
        if (hit) return hit;
        
        
        const fallback = await caches.match('/offline.html');
        return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const immutable = url.search.includes('v=') || url.pathname.startsWith('/assets/');

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    const network = fetch(request).then((fresh) => {
      
      
      if (fresh && fresh.status === 200 && fresh.type === 'basic') cache.put(request, fresh.clone());
      return fresh;
    }).catch(() => null);

    if (hit && immutable) return hit;
    if (hit) {
      
      event.waitUntil(network);
      return hit;
    }
    const fresh = await network;
    return fresh || new Response('', { status: 504 });
  })());
});
