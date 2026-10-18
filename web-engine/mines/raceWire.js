


























export const THROTTLE_MS = 100;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';


export function bitsetEncode(indices, cells) {
  const bytes = new Uint8Array(Math.ceil(cells / 8));
  for (const i of indices) if (i >= 0 && i < cells) bytes[i >> 3] |= 1 << (i & 7);
  let len = bytes.length;
  while (len > 0 && bytes[len - 1] === 0) len--;
  let out = '';
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i]; const b = i + 1 < len ? bytes[i + 1] : 0; const c = i + 2 < len ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < len) out += B64[(n >> 6) & 63];
    if (i + 2 < len) out += B64[n & 63];
  }
  return out;
}


export function bitsetDecode(text, cells) {
  if (typeof text !== 'string' || text.length > Math.ceil(Math.ceil(cells / 8) * 4 / 3)) return null;
  const vals = [];
  for (const ch of text) { const v = B64.indexOf(ch); if (v < 0) return null; vals.push(v); }
  const bytes = [];
  for (let i = 0; i < vals.length; i += 4) {
    const n = (vals[i] << 18) | ((vals[i + 1] ?? 0) << 12) | ((vals[i + 2] ?? 0) << 6) | (vals[i + 3] ?? 0);
    const k = Math.min(3, vals.length - i - 1);
    if (k >= 1) bytes.push((n >> 16) & 255);
    if (k >= 2) bytes.push((n >> 8) & 255);
    if (k >= 3) bytes.push(n & 255);
  }
  const out = [];
  bytes.forEach((byte, j) => { for (let b = 0; b < 8; b++) if (byte & (1 << b)) { const i = j * 8 + b; if (i < cells) out.push(i); } });
  return out;
}


export function runsEncode(sorted) {
  const parts = [];
  for (let k = 0; k < sorted.length;) {
    const start = sorted[k];
    let end = start;
    while (k + 1 < sorted.length && sorted[k + 1] === end + 1) { k++; end++; }
    k++;
    parts.push(end > start ? `${start.toString(36)}+${(end - start).toString(36)}` : start.toString(36));
  }
  return parts.join('.');
}


export function runsDecode(text, cells) {
  if (typeof text !== 'string' || text.length > cells * 4) return null;
  if (text === '') return [];
  const out = [];
  for (const part of text.split('.')) {
    const m = /^([0-9a-z]{1,3})(?:\+([0-9a-z]{1,3}))?$/.exec(part);
    if (!m) return null;
    const start = parseInt(m[1], 36);
    const extra = m[2] ? parseInt(m[2], 36) : 0;
    if (start + extra >= cells) return null;
    for (let i = start; i <= start + extra; i++) out.push(i);
  }
  return out;
}

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);






export function createSender({ cells, round, type = 'fms-prog' }) {
  let seq = 0;
  let sentOpened = new Set();
  let sentFlags = [];
  let sentSt = null;
  let wantFull = true; 
  return {
    full() { wantFull = true; },
    get seq() { return seq; },
    next(state, { force = false } = {}) {
      const delta = state.opened.filter((i) => !sentOpened.has(i));
      const flagsChanged = !sameList(state.flags, sentFlags);
      if (!force && !wantFull && !delta.length && !flagsChanged && state.st === sentSt) return null;
      const msg = { t: type, r: round, s: ++seq, st: state.st, e: Math.max(0, Math.round(state.e)), n: state.opened.length };
      
      const runs = runsEncode(delta);
      const bits = bitsetEncode(state.opened, cells);
      if (wantFull || runs.length >= bits.length || delta.length !== state.opened.length - sentOpened.size) msg.f = bits;
      else if (delta.length) msg.d = runs;
      if (wantFull || flagsChanged) msg.g = bitsetEncode(state.flags, cells);
      if (Number.isInteger(state.x)) msg.x = state.x;
      sentOpened = new Set(state.opened);
      sentFlags = state.flags.slice();
      sentSt = state.st;
      wantFull = false;
      return msg;
    },
  };
}






export function createReceiver({ cells, round }) {
  const self = {
    round, seq: 0, opened: new Set(), flags: new Set(), st: 'p', e: 0, n: 0, x: null, synced: false,
    apply(msg) {
      if (!msg || typeof msg !== 'object' || msg.r !== self.round) return { ok: false, need: false };
      if (!Number.isInteger(msg.s) || msg.s <= self.seq) return { ok: false, need: false }; 
      const gap = msg.s !== self.seq + 1;
      self.seq = msg.s;
      let need = false;
      if (typeof msg.f === 'string') {
        const all = bitsetDecode(msg.f, cells);
        if (all) { self.opened = new Set(all); self.synced = true; } else need = true;
      } else if (typeof msg.d === 'string') {
        const add = runsDecode(msg.d, cells);
        if (add) for (const i of add) self.opened.add(i); else need = true;
      }
      if (typeof msg.g === 'string') {
        const fl = bitsetDecode(msg.g, cells);
        if (fl) self.flags = new Set(fl); else need = true;
      }
      if (['p', 'w', 'b'].includes(msg.st)) self.st = msg.st;
      if (Number.isFinite(msg.e) && msg.e >= 0) self.e = msg.e;
      if (Number.isInteger(msg.n) && msg.n >= 0) self.n = msg.n;
      if (Number.isInteger(msg.x) && msg.x >= 0 && msg.x < cells) self.x = msg.x;
      
      if ((gap && typeof msg.f !== 'string') || !self.synced || self.opened.size !== self.n) need = true;
      return { ok: true, need };
    },
  };
  return self;
}





export function createThrottle({ flush, gapMs = THROTTLE_MS, clock = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout }) {
  let last = -Infinity;
  let timer = null;
  const fire = () => { timer = null; last = clock(); flush(); };
  return {
    poke() {
      if (timer) return;
      const wait = last + gapMs - clock();
      if (wait <= 0) fire();
      else timer = setTimer(fire, wait);
    },
    now() { if (timer) { clearTimer(timer); timer = null; } fire(); },
    cancel() { if (timer) { clearTimer(timer); timer = null; } },
  };
}
