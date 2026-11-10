



















export function createVoice({ baseUrl, muted = () => false, onLine = () => {}, makeAudio, fetchJson } = {}) {
  const base = String(baseUrl);
  const mk = makeAudio || (() => (typeof Audio === 'function' ? new Audio() : null));
  const getJson = fetchJson || ((u) => fetch(u).then((r) => (r.ok ? r.json() : null)));
  let el = null;
  let lines = null;
  let last = '';
  let unlocked = false;

  const ready = Promise.resolve()
    .then(() => getJson(new URL('voice.json', base).href))
    .then((m) => { lines = m?.lines || {}; })
    .catch(() => { lines = {}; });

  function element() {
    if (!el) {
      el = mk();
      if (el) el.preload = 'auto';
    }
    return el;
  }

  function start(lineId) {
    const ln = lines?.[lineId];
    const a = element();
    if (!ln || !a) return false;
    try {
      a.pause();
      a.src = new URL(ln.file, base).href;
      a.currentTime = 0;
      const p = a.play();
      p?.catch?.(() => {  });
      onLine(ln.ms);
      return true;
    } catch {
      return false;
    }
  }

  return {
    ready,
    
    say(lineId) {
      if (!lineId) return false;
      last = lineId;
      if (muted()) return false;
      if (lines) return start(lineId);
      ready.then(() => { if (last === lineId && !muted()) start(lineId); });
      return true;
    },
    
    get last() { return last; },
    
    ms(lineId) { return lines?.[lineId]?.ms || 0; },
    stop() { try { el?.pause(); } catch {  } },
    
    unlock(silentUrl) {
      if (unlocked) return;
      const a = element();
      if (!a || !silentUrl) return;
      unlocked = true;
      try {
        a.src = silentUrl;
        a.play()?.catch?.(() => { unlocked = false; });
      } catch { unlocked = false; }
    },
    
    prefetch(ids) {
      ready.then(() => {
        for (const i of ids || []) {
          const ln = lines?.[i];
          if (ln && typeof fetch === 'function') fetch(new URL(ln.file, base).href).catch(() => {});
        }
      });
    },
  };
}
