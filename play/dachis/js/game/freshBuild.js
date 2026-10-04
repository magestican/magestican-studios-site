












const EVERY = 4 * 60 * 1000;
const TRIED = 'dachis.freshTried';

export const runningBuild = () => document.querySelector('meta[name=build]')?.content || 'dev';


export function freshUrl(href, id) {
  const u = new URL(href);
  u.searchParams.set('v', id);
  return u.href;
}


export function startFreshBuild({ quiet, beforeReload, say }) {
  const running = runningBuild();
  if (running === 'dev' || /[?&]cheat=/.test(location.search)) return; 
  let pending = null, busy = false, waitTimer = 0;

  const go = () => {
    if (!pending) return;
    if (!quiet()) { clearTimeout(waitTimer); waitTimer = setTimeout(go, 2000); return; }
    try { if (sessionStorage.getItem(TRIED) === pending) return; sessionStorage.setItem(TRIED, pending); } catch {  }
    try { beforeReload(); } catch {  }
    if (!document.hidden) say('Updating to the new version...');
    setTimeout(() => location.replace(freshUrl(location.href, pending)), document.hidden ? 0 : 900);
  };

  const check = async () => {
    if (busy || pending) return;
    busy = true;
    try {
      const r = await fetch(new URL('/version.json?t=' + Date.now(), location.origin), { cache: 'no-store' });
      const live = r.ok ? (await r.json()).buildId : null;
      if (live && live !== running) { pending = live; go(); }
    } catch {  }
    busy = false;
  };

  addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  addEventListener('pageshow', (e) => { if (e.persisted) check(); }); 
  setInterval(() => { if (!document.hidden) check(); }, EVERY);
  check();
}
