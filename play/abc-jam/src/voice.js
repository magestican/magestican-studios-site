




















export function createVoice({ baseUrl, version = '', muted = () => false, onLine = () => {}, makeAudio, fetchJson,
  setTimer = (fn, ms) => setTimeout(fn, ms) } = {}) {
  const base = String(baseUrl);
  
  
  
  
  const at = (file) => {
    const u = new URL(file, base);
    if (version) u.searchParams.set('v', version);
    return u.href;
  };
  const mk = makeAudio || (() => (typeof Audio === 'function' ? new Audio() : null));
  const getJson = fetchJson || ((u) => fetch(u).then((r) => (r.ok ? r.json() : null)));
  let el = null;
  let lines = null;
  let last = '';
  let unlocked = false;
  
  
  let busy = false;
  let pending = null;
  let turn = 0;

  function done(t) {
    if (t !== turn || !busy) return;
    busy = false;
    const next = pending;
    pending = null;
    if (next && !muted()) start(next);
  }

  const ready = Promise.resolve()
    .then(() => getJson(at('voice.json')))
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
      a.src = at(ln.file);
      a.currentTime = 0;
      const t = ++turn;
      busy = true;
      a.onended = () => done(t);
      
      setTimer(() => done(t), (ln.ms || 1000) + 400);
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
    
    sayNext(lineId) {
      if (!lineId) return false;
      if (!busy) return this.say(lineId);
      last = lineId;
      if (muted()) return false;
      pending = lineId;
      return true;
    },
    
    get last() { return last; },
    
    ms(lineId) { return lines?.[lineId]?.ms || 0; },
    stop() {
      pending = null;
      busy = false;
      turn += 1;
      try { el?.pause(); } catch {  }
    },
    
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
          if (ln && typeof fetch === 'function') fetch(at(ln.file)).catch(() => {});
        }
      });
    },
  };
}
