













export const SNAP_HZ = 15;
export const SNAP_MS = 1000 / SNAP_HZ;
export const INPUT_HZ = 30;
export const INTERP_MS = 100; 
const R = (v, d = 1000) => Math.round(v * d) / d;

const SENT_EVENTS = new Set(['hop', 'respawn', 'pickup', 'use', 'lap', 'finish', 'worldWarn', 'worldOn', 'bump', 'splash']);






export function makeSnap(race, { seq, events = [], table }) {
  const f = race.flow;
  return {
    t: 's',
    q: seq,
    c: R(race.clock),
    
    f: [f.phase, R(f.time), R(f.countdown ?? 0), f.playerFinishedAt == null ? null : R(f.playerFinishedAt)],
    
    k: race.racers.map((r) => {
      const k = r.kart;
      return [R(k.x), R(k.y), R(k.z), R(k.heading), R(k.steerVisual ?? 0, 100), k.respawning ? 1 : 0, R(k.vx, 100), R(k.vz, 100), R(r.s)];
    }),
    
    l: (race.loose ?? []).map((p) => [R(p.x), R(p.y), R(p.z), R(p.heading, 100), R(p.roll, 100), p.down ? 1 : 0]),
    
    
    st: table.map((t) => [t.id, t.position, t.finished ? 1 : 0, R(t.finishTime ?? 0), t.lapTimes?.length ?? 0, R(t.distance ?? 0, 10),
      [...(t.visited ?? [])].reduce((m, g) => m | (1 << g), 0), (t.lapTimes ?? []).map((v) => R(v))]),
    
    h: [...(race.pickups?.held ?? new Map())].filter(([, v]) => v),
    e: events.filter((e) => SENT_EVENTS.has(e.type)).slice(0, 24),
  };
}

const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}


export function createSnapBuffer() {
  return { list: [], lastSeq: -1 };
}


export function receiveSnap(buf, snap, now) {
  if (!snap || typeof snap.q !== 'number' || snap.q <= buf.lastSeq) return null;
  buf.lastSeq = snap.q;
  buf.list.push({ at: now, snap });
  if (buf.list.length > 4) buf.list.shift();
  return Array.isArray(snap.e) ? snap.e : [];
}





export function applySnaps(race, buf, now, { delay = INTERP_MS } = {}) {
  const L = buf.list;
  if (!L.length) return false;
  const at = now - delay;
  let a = L[0]; let b = L[0];
  for (let i = 0; i < L.length - 1; i += 1) {
    if (L[i].at <= at && L[i + 1].at >= at) { a = L[i]; b = L[i + 1]; break; }
    if (L[i + 1].at < at) { a = L[i + 1]; b = L[i + 1]; }
  }
  const t = b.at > a.at ? Math.max(0, Math.min(1, (at - a.at) / (b.at - a.at))) : 1;
  const A = a.snap; const B = b.snap;
  race.clock = lerp(A.c, B.c, t);
  const [phase, time, countdown] = B.f;
  race.flow.phase = phase;
  race.flow.time = lerp(A.f[1], time, t);
  race.flow.countdown = countdown;
  race.racers.forEach((r, i) => {
    const ka = A.k[i]; const kb = B.k[i];
    if (!ka || !kb) return;
    r.kart = {
      ...r.kart,
      x: lerp(ka[0], kb[0], t), y: lerp(ka[1], kb[1], t), z: lerp(ka[2], kb[2], t),
      heading: lerpAngle(ka[3], kb[3], t), steerVisual: kb[4], respawning: !!kb[5], vx: kb[6], vz: kb[7],
    };
    r.s = kb[8];
  });
  (race.loose ?? []).forEach((p, i) => {
    const la = A.l?.[i]; const lb = B.l?.[i];
    if (!la || !lb) return;
    p.x = lerp(la[0], lb[0], t); p.y = lerp(la[1], lb[1], t); p.z = lerp(la[2], lb[2], t);
    p.heading = lb[3]; p.roll = lb[4]; p.down = !!lb[5];
  });
  race.netTable = B.st.map(([id, position, finished, finishTime, laps, distance]) => ({
    id, position, finished: !!finished, finishTime, lapTimes: new Array(laps).fill(0), distance,
  }));
  if (race.pickups?.held) {
    race.pickups.held.clear();
    for (const [id, v] of B.h ?? []) race.pickups.held.set(id, v);
  }
  return true;
}









export function resumeRace(race, snap) {
  const buf = createSnapBuffer();
  receiveSnap(buf, snap, 0);
  applySnaps(race, buf, 0, { delay: 0 });
  delete race.netTable; 
  const fin = snap.f?.[3];
  race.flow.playerFinishedAt = typeof fin === 'number' ? fin : (race.flow.phase === 'finished' ? race.flow.time : null);
  if (race.flow.phase !== 'countdown' && race.flow.startedAt == null) race.flow.startedAt = 0;
  const path = race.progress.path;
  const len = path.length;
  for (const r of race.racers) {
    r.safeS = r.s;
    const rec = race.progress.racers.get(r.id);
    if (rec) rec.lastS = ((r.s % len) + len) % len;
  }
  for (const row of snap.st ?? []) {
    const [id, , finished, finishTime, laps, distance, mask = 0, times = null] = row;
    const rec = race.progress.racers.get(id);
    if (!rec) continue;
    rec.lap = laps;
    rec.distance = distance;
    rec.finished = !!finished;
    rec.finishTime = finished ? finishTime : null;
    rec.lapTimes = Array.isArray(times) ? times.slice() : new Array(laps).fill(0);
    rec.bestLap = rec.lapTimes.length ? Math.min(...rec.lapTimes) : null;
    rec.visited = new Set();
    for (let g = 0; g < race.progress.checkpoints; g += 1) if (mask & (1 << g)) rec.visited.add(g);
  }
  return race;
}



export function packInput(i) {
  
  return ['i', R(i.throttle ?? 0, 100), R(i.steer ?? 0, 100), i.drift ? 1 : 0, i.jump ? 1 : 0, i.use ? 1 : 0, R(i.assist ?? 0, 100)];
}

const clamp1 = (v) => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);

export function unpackInput(a) {
  if (!Array.isArray(a) || a[0] !== 'i') return null;
  return {
    throttle: clamp1(a[1]), steer: clamp1(a[2]), drift: a[3] === 1, jump: a[4] === 1, use: a[5] === 1,
    assist: Math.max(0, clamp1(a[6] ?? 0)),
  };
}
