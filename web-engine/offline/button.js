



const POINTER_CACHE = 'offline-pack-pointer';
const POINTER_URL = '/__offline-pack/pointer';

export function formatSize(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / 1e6))} MB`;
}


const SHARE_WAIT_MS = 120_000;

const fill = (text, values = {}) => text.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);































export async function shareWithGameWorkers(files, { waitMs = SHARE_WAIT_MS } = {}) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    const scope = new URL(reg.scope).pathname;
    if (scope === '/' || !reg.active) continue;
    const paths = Object.keys(files).map((p) => p.replace(/index\.html$/, ''));
    const own = paths.filter((p) => p.startsWith(scope));
    if (!own.length) continue;
    const shared = paths.filter((p) => p.startsWith('/web-engine/'));
    await keepOffline(reg.active, [...await pageUrls(reg.scope), ...own, ...shared], waitMs);
  }
}


function keepOffline(worker, urls, waitMs) {
  return new Promise((resolve) => {
    const { port1, port2 } = new MessageChannel();
    const finish = () => {
      clearTimeout(timer);
      port1.close();
      resolve();
    };
    const timer = setTimeout(finish, waitMs);
    port1.onmessage = finish;
    worker.postMessage({ type: 'keep-offline', urls }, [port2]);
  });
}


async function pageUrls(pageUrl) {
  const res = await fetch(pageUrl).catch(() => null);
  if (!res || !res.ok) return [];
  const html = await res.text();
  const { origin } = new URL(pageUrl);
  const urls = [];
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"|<link[^>]+href="([^"]+)"/g)) {
    const u = new URL(m[1] ?? m[2], pageUrl);
    if (u.origin === origin) urls.push(u.pathname + u.search);
  }
  return urls;
}

export function mountOfflinePack(section) {
  if (!section || !('serviceWorker' in navigator) || !('caches' in window)) return;

  const say = {};
  for (const el of section.querySelectorAll('[data-k]')) say[el.dataset.k] = el.textContent;
  const main = section.querySelector('[data-role="main"]');
  const remove = section.querySelector('[data-role="remove"]');
  const bar = section.querySelector('progress');
  const status = section.querySelector('[data-role="status"]');

  let pointer = null;
  let liveBuild = null;
  let liveBytes = 0;
  let running = null;
  let interrupted = false;

  const paint = () => {
    bar.hidden = !running;
    remove.hidden = Boolean(running) || !pointer;
    if (running) {
      main.textContent = say.stop;
      main.hidden = false;
      return;
    }
    const current = pointer && (!liveBuild || pointer.buildId === liveBuild);
    main.hidden = Boolean(current);
    if (current) {
      status.textContent = say.ready;
    } else if (interrupted) {
      main.textContent = say.resume;
    } else if (pointer) {
      main.textContent = say.update;
      status.textContent = say.outdated;
    } else {
      main.textContent = liveBytes
        ? fill(say.downloadSized, { size: formatSize(liveBytes) })
        : say.download;
      status.textContent = '';
    }
  };

  const start = async () => {
    const controller = new AbortController();
    running = controller;
    interrupted = false;
    status.textContent = say.starting;
    paint();
    try {
      const pack = await import('./pack.js');
      
      
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist().catch(() => false);
      }
      await pack.downloadPack({
        signal: controller.signal,
        onProgress: ({ doneBytes, totalBytes }) => {
          bar.max = totalBytes;
          bar.value = doneBytes;
          status.textContent = fill(say.progress, {
            done: formatSize(doneBytes), total: formatSize(totalBytes),
          });
        },
      });
      pointer = await pack.readPointer();
      liveBuild = pointer.buildId;
      const worker = await navigator.serviceWorker.ready;
      worker.active?.postMessage({ type: 'offline-pack-changed' });
      await shareWithGameWorkers(pointer.files);
    } catch (err) {
      interrupted = true;
      if (err.name === 'AbortError') status.textContent = say.stopped;
      else if (err.name === 'NotEnoughSpace') {
        status.textContent = fill(say.full, {
          need: formatSize(err.need), free: formatSize(err.free),
        });
      } else status.textContent = say.failed;
    }
    running = null;
    paint();
  };

  main.addEventListener('click', () => {
    if (running) running.abort();
    else start();
  });

  remove.addEventListener('click', async () => {
    const pack = await import('./pack.js');
    await pack.removePack();
    pointer = null;
    interrupted = false;
    const worker = await navigator.serviceWorker.ready;
    worker.active?.postMessage({ type: 'offline-pack-changed' });
    status.textContent = '';
    paint();
  });

  section.hidden = false;

  (async () => {
    const hit = await (await caches.open(POINTER_CACHE)).match(POINTER_URL);
    if (hit) pointer = await hit.json();
    paint();
    
    
    try {
      const res = await fetch('/offline-pages.json', { cache: 'no-cache' });
      if (res.ok) {
        const live = await res.json();
        liveBuild = live.buildId;
        liveBytes = live.totalBytes;
        if (!running) paint();
        
        
        if (pointer) await shareWithGameWorkers(pointer.files);
      }
    } catch {  }
  })();
}
