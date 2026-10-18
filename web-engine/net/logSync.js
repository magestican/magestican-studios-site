


























export const SYNC = Object.freeze({ FULL: 'full', DELTA: 'delta' });


export const SYNC_VERSION = 1;

const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);


export function isExtension(prefix, items) {
  if (!Array.isArray(prefix) || !Array.isArray(items) || items.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) if (!same(prefix[i], items[i])) return false;
  return true;
}

function split(snap, list) {
  const head = {};
  for (const [k, v] of Object.entries(snap || {})) if (k !== list) head[k] = v;
  const items = Array.isArray(snap?.[list]) ? snap[list].slice() : [];
  return { head, items };
}








export function createLogSender({ list }) {
  let seq = 0;
  let sentHead = null; 
  let head = null;
  let sent = null; 

  const full = () => ({ k: SYNC.FULL, seq, ...head, [list]: sent.slice() });

  return {
    get seq() { return seq; },
    




    next(snap, { full: force = false } = {}) {
      const s = split(snap, list);
      const h = JSON.stringify(s.head);
      if (!force && sent && h === sentHead && isExtension(sent, s.items)) {
        if (s.items.length === sent.length) return null;
        seq += 1;
        const from = sent.length;
        sent = s.items;
        return { k: SYNC.DELTA, seq, from, add: s.items.slice(from) };
      }
      seq += 1;
      sentHead = h;
      head = s.head;
      sent = s.items;
      return full();
    },
    
    current() { return sent ? full() : null; },
    reset() { seq = 0; sentHead = null; head = null; sent = null; },
  };
}












export function createLogReceiver({ list }) {
  let seq = -1;
  let src = null;
  let value = null;

  return {
    get seq() { return seq; },
    get value() { return value; },
    take(msg, from = null) {
      if (!msg || typeof msg !== 'object') return { kind: 'bad' };
      const k = msg.k ?? SYNC.FULL;
      if (k === SYNC.FULL) {
        const n = Number.isInteger(msg.seq) ? msg.seq : null;
        
        if (n !== null && from === src && value && n < seq) return { kind: 'dup' };
        const { seq: _s, k: _k, ...rest } = msg;
        value = { ...rest, [list]: Array.isArray(msg[list]) ? msg[list].slice() : [] };
        seq = n ?? -1;
        src = from;
        return { kind: 'full', value };
      }
      if (k !== SYNC.DELTA) return { kind: 'bad' };
      if (!Number.isInteger(msg.seq) || !Number.isInteger(msg.from) || !Array.isArray(msg.add)) return { kind: 'bad' };
      if (!value || from !== src || seq < 0) return { kind: 'need' };
      if (msg.seq <= seq) return { kind: 'dup' };
      if (msg.seq !== seq + 1 || msg.from !== value[list].length) return { kind: 'need' };
      seq = msg.seq;
      value = { ...value, [list]: [...value[list], ...msg.add] };
      return { kind: 'append', value, added: msg.add.slice() };
    },
    reset() { seq = -1; src = null; value = null; },
  };
}






export function createViewSender() {
  let seq = 0;
  const last = new Map();
  return {
    get seq() { return seq; },
    offer(peer, payload, { force = false } = {}) {
      const json = JSON.stringify(payload);
      if (!force && last.get(peer) === json) return null;
      last.set(peer, json);
      seq += 1;
      return { seq, ...payload };
    },
    forget(peer) { last.delete(peer); },
    reset() { seq = 0; last.clear(); },
  };
}






export function createViewReceiver() {
  let seq = -1;
  let src = null;
  return {
    take(msg, from = null) {
      const n = Number.isInteger(msg?.seq) ? msg.seq : null;
      if (n !== null && from === src && n <= seq) return false;
      seq = n ?? -1;
      src = from;
      return true;
    },
    reset() { seq = -1; src = null; },
  };
}
