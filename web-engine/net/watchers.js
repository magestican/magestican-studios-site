
























export const ROLE = Object.freeze({ PLAY: 'play', WATCH: 'watch' });


export const WATCH_PARAM = 'watch';







export const HELLO_WAIT_MS = 2500;


export const MAX_WATCHERS = 64;
const MAX_ID = 64;


export const roleOf = (message) => (message && message.role === ROLE.WATCH ? ROLE.WATCH : ROLE.PLAY);


export const helloFor = (t, by, role) => ({ t, by, role: role === ROLE.WATCH ? ROLE.WATCH : ROLE.PLAY });


export function watchIdFrom(href) {
  try {
    return new URL(href).searchParams.get(WATCH_PARAM) || null;
  } catch {
    return null;
  }
}





export function roomFromHref(href, joinParam = 'join') {
  let params;
  try { params = new URL(href).searchParams; } catch { return null; }
  const join = params.get(joinParam);
  if (join) return { code: join, role: ROLE.PLAY };
  const watch = params.get(WATCH_PARAM);
  if (watch) return { code: watch, role: ROLE.WATCH };
  return null;
}


export function watchLinkFor(href, id) {
  const url = new URL(href);
  url.searchParams.delete('join');
  url.searchParams.set(WATCH_PARAM, id);
  url.hash = '';
  return url.toString();
}


export function sanitiseWatchers(list) {
  if (!Array.isArray(list)) return [];
  const out = new Set();
  for (const id of list) {
    if (typeof id !== 'string' || !id || id.length > MAX_ID) continue;
    out.add(id);
    if (out.size >= MAX_WATCHERS) break;
  }
  return [...out].sort();
}


export function watchingLabel(template, count) {
  const n = Number.isInteger(count) && count > 0 ? count : 0;
  if (!n) return '';
  return String(template).replace('{n}', String(n));
}












export function createWatchers({
  onSeat, onUnseat = () => {}, onChange = () => {}, waitMs = HELLO_WAIT_MS,
  setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = (h) => clearTimeout(h),
} = {}) {
  
  const peers = new Map();
  
  let adopted = [];

  const entry = (id) => {
    let e = peers.get(id);
    if (!e) { e = { role: null, declared: false, seated: false, present: false, timer: null }; peers.set(id, e); }
    return e;
  };
  const stop = (e) => { if (e.timer !== null) { clearTimer(e.timer); e.timer = null; } };
  const seat = (id, e) => {
    if (e.seated || e.role === ROLE.WATCH) return;
    e.seated = true;
    onSeat(id);
  };

  return {
    



    arrived(id) {
      if (!id) return;
      const e = entry(id);
      e.present = true;
      
      if (e.role === ROLE.WATCH || adopted.includes(id)) return;
      if (e.declared) { seat(id, e); return; }
      if (e.timer !== null || e.seated) return;
      e.timer = setTimer(() => {
        e.timer = null;
        if (e.declared || !peers.has(id)) return;
        e.role = ROLE.PLAY; 
        seat(id, e);
      }, waitMs);
    },

    




    hello(id, role) {
      if (!id) return null;
      const e = entry(id);
      if (e.declared) return e.role;
      const wanted = role === ROLE.WATCH ? ROLE.WATCH : ROLE.PLAY;
      stop(e);
      e.declared = true;
      e.role = wanted;
      if (wanted === ROLE.WATCH) {
        if (e.seated) { e.seated = false; onUnseat(id); }
        onChange(id);
        return wanted;
      }
      if (e.present) seat(id, e);
      return wanted;
    },

    
    left(id) {
      const e = peers.get(id);
      if (e) { stop(e); peers.delete(id); }
      const was = adopted.includes(id) || e?.role === ROLE.WATCH;
      adopted = adopted.filter((x) => x !== id);
      if (was) onChange(id);
    },

    
    adopt(list) {
      adopted = sanitiseWatchers(list);
    },

    
    isWatcher(id) {
      return peers.get(id)?.role === ROLE.WATCH || adopted.includes(id);
    },

    
    list() {
      const out = new Set(adopted);
      for (const [id, e] of peers) if (e.role === ROLE.WATCH) out.add(id);
      return [...out].sort();
    },

    
    get count() { return this.list().length; },

    
    reset() {
      for (const e of peers.values()) stop(e);
      peers.clear();
      adopted = [];
    },
  };
}
