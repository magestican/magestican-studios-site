










const WIRE = 1;
export const STATE_MS = 50; 
export const INTERP_MS = 100; 
const MSG = Object.freeze({
  HELLO: 'hello', 
  SEAT: 'seat', 
  STATE: 'st', 
  CLAIM: 'claim', 
  GOT: 'got', 
  CHECK: 'check', 
  CLEAR: 'clear', 
  BYE: 'bye',
});

const stamp = (m) => ({ g: 's95', v: WIRE, ...m });



export function createCoopSession({ role, transport, level, variant = 'jo' }) {
  const host = role === 'host';
  const s = {
    role,
    level,
    seated: host, 
    intel: new Set(), 
    checkpoint: 0,
    cleared: null, 
    partnerVariant: null,
    events: [],
    nextSend: -Infinity,
    snaps: [], 
  };
  const emit = (e) => s.events.push(e);
  const send = (m) => transport.send(stamp(m));

  function verdictIntel(id, by) {
    if (s.intel.has(id)) return;
    s.intel.add(id);
    send({ t: MSG.GOT, id, by });
    emit({ type: 'intel', id, by });
  }
  function verdictCheck(i, by) {
    if (i <= s.checkpoint) return;
    s.checkpoint = i;
    send({ t: MSG.CHECK, i, by });
    emit({ type: 'checkpoint', i, by });
  }
  function verdictClear(by) {
    if (s.cleared) return;
    s.cleared = by;
    send({ t: MSG.CLEAR, by });
    emit({ type: 'clear', by });
  }

  transport.onMessage((m, nowMs = 0) => {
    if (!m || m.g !== 's95' || m.v !== WIRE) return; 
    switch (m.t) {
      case MSG.HELLO:
        if (!host) return;
        s.partnerVariant = m.variant ?? 'bolt';
        send({ t: MSG.SEAT, level: s.level, checkpoint: s.checkpoint, intel: [...s.intel], hostVariant: variant });
        emit({ type: 'joined', variant: s.partnerVariant });
        return;
      case MSG.SEAT:
        if (host) return;
        s.seated = true;
        s.level = m.level;
        s.checkpoint = m.checkpoint;
        s.intel = new Set(m.intel);
        s.partnerVariant = m.hostVariant;
        emit({ type: 'seated', level: m.level, checkpoint: m.checkpoint, intel: [...m.intel] });
        return;
      case MSG.STATE:
        s.snaps.push({ t: nowMs, body: unpackBody(m.b), anim: m.a });
        if (s.snaps.length > 2) s.snaps.shift();
        return;
      case MSG.CLAIM:
        if (host) verdictIntel(m.id, 'guest');
        return;
      case MSG.GOT:
        if (host || s.intel.has(m.id)) return;
        s.intel.add(m.id);
        emit({ type: 'intel', id: m.id, by: m.by });
        return;
      case MSG.CHECK:
        if (host) verdictCheck(m.i, 'guest');
        else if (m.i > s.checkpoint) {
          s.checkpoint = m.i;
          emit({ type: 'checkpoint', i: m.i, by: m.by });
        }
        return;
      case MSG.CLEAR:
        if (host) verdictClear('guest');
        else if (!s.cleared) {
          s.cleared = m.by;
          emit({ type: 'clear', by: m.by });
        }
        return;
      case MSG.BYE:
        s.snaps = [];
        emit({ type: 'left' });
        return;
    }
  });

  return {
    state: s,
    hello() {
      if (!host) send({ t: MSG.HELLO, variant });
    },
    
    tick(body, anim, nowMs) {
      if (nowMs < s.nextSend) return;
      
      s.nextSend = s.nextSend + STATE_MS > nowMs ? s.nextSend + STATE_MS : nowMs + STATE_MS;
      send({ t: MSG.STATE, b: packBody(body), a: anim });
    },
    
    claimIntel(id) {
      if (host) verdictIntel(id, 'host');
      else if (!s.intel.has(id)) send({ t: MSG.CLAIM, id });
    },
    reachCheckpoint(i) {
      if (host) verdictCheck(i, 'host');
      else send({ t: MSG.CHECK, i });
    },
    clockOut() {
      if (host) verdictClear('host');
      else send({ t: MSG.CLEAR });
    },
    leave() {
      send({ t: MSG.BYE });
    },
    
    partnerAt(nowMs) {
      return bodyAt(s.snaps, nowMs - INTERP_MS);
    },
    
    beamTarget(nowMs) {
      const b = this.partnerAt(nowMs);
      return b && b.alive && b.grounded ? { x: b.x, y: b.y } : null;
    },
    
    drain() {
      return s.events.splice(0);
    },
  };
}

const r3 = (v) => Math.round(v * 1000) / 1000;
function packBody(b) {
  return [r3(b.x), r3(b.y), r3(b.vx), r3(b.vy), b.facing < 0 ? -1 : 1, b.grounded ? 1 : 0, b.alive === false ? 0 : 1];
}
function unpackBody(a) {
  return { x: a[0], y: a[1], vx: a[2], vy: a[3], facing: a[4], grounded: a[5] === 1, alive: a[6] === 1 };
}


export function bodyAt(snaps, t) {
  if (snaps.length === 0) return null;
  const last = snaps[snaps.length - 1];
  if (snaps.length === 1 || t >= last.t) return { ...last.body };
  const prev = snaps[0];
  if (t <= prev.t) return { ...prev.body };
  const k = (t - prev.t) / (last.t - prev.t);
  const lerp = (a, b) => a + (b - a) * k;
  return { ...last.body, x: lerp(prev.body.x, last.body.x), y: lerp(prev.body.y, last.body.y) };
}


export function createLoopback({ latencyMs = 0 } = {}) {
  let now = 0;
  const queue = [];
  const side = (other) => ({
    handlers: [],
    send(m) {
      queue.push({ at: now + latencyMs, to: other, m: JSON.stringify(m) });
    },
    onMessage(fn) {
      this.handlers.push(fn);
    },
  });
  const a = side(null);
  const b = side(null);
  a.send = (m) => queue.push({ at: now + latencyMs, to: b, m: JSON.stringify(m) });
  b.send = (m) => queue.push({ at: now + latencyMs, to: a, m: JSON.stringify(m) });
  return {
    a,
    b,
    
    advance(t) {
      for (;;) {
        queue.sort((x, y) => x.at - y.at);
        if (!queue.length || queue[0].at > t) break;
        const d = queue.shift();
        now = Math.max(now, d.at); 
        for (const fn of d.to.handlers) fn(JSON.parse(d.m), d.at);
      }
      now = t;
    },
  };
}
