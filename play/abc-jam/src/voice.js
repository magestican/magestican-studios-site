




















export function createVoice({ baseUrl, version = '', muted = () => false, onLine = () => {}, makeAudio, fetchJson,
  setTimer = (fn, ms) => setTimeout(fn, ms) } = {}) {
  const base = String(baseUrl);
  const LOAD_GRACE_MS = 6000;
  
  
  
  
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
  
  
  
  
  
  const QUEUE_MAX = 2;
  let busy = false;
  let queue = [];
  let turn = 0;

  function done(t) {
    if (t !== turn || !busy) return;
    busy = false;
    const next = queue.shift();
    if (next && !muted()) start(next);
    else queue = [];
  }

  function enqueue(lineId) {
    queue.push(lineId);
    while (queue.length > QUEUE_MAX) queue.shift();
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
      
      
      
      
      const ms = (ln.ms || 1000) + 400;
      let clocked = false;
      a.onplaying = () => { if (clocked || t !== turn) return; clocked = true; setTimer(() => done(t), ms); };
      a.onerror = () => done(t);
      setTimer(() => { if (!clocked) done(t); }, ms + LOAD_GRACE_MS);
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
      if (!lines) {
        ready.then(() => { if (last === lineId && !muted()) this.say(lineId); });
        return true;
      }
      if (!lines[lineId]) return false;
      if (busy) { enqueue(lineId); return true; }
      return start(lineId);
    },
    
    sayNext(lineId) {
      if (!lineId) return false;
      if (!busy) return this.say(lineId);
      last = lineId;
      if (muted()) return false;
      queue = [lineId];
      return true;
    },
    
    get last() { return last; },
    
    ms(lineId) { return lines?.[lineId]?.ms || 0; },
    stop() {
      queue = [];
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
