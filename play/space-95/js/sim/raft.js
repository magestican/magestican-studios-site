

























import { STEP } from './constants.js';
import { makePath, pathAt } from './slipstream.js';

const LEAF_SINK = 2; 
const SINK_DEPTH = 0.5; 
const SINK_TIME = 0.3; 
const STEER_GAIN = 4; 
const FLOOR_TOL = 0.06; 








const PACKET_SINK = 0.15; 
const PACKET_SINK_DEPTH = 0.5; 


export function createRafts(level) {
  if (!level.rafts?.length) return null;
  const list = [];
  const lanes = [];
  const packets = [];
  for (const d of level.rafts) {
    if (d.mode === 'packet') {
      packets.push({ id: d.id, def: d });
      continue;
    }
    if (d.mode === 'lane') {
      const lane = { id: d.id, def: d, spawned: 0, next: d.every ? null : 0, leaves: [] };
      lanes.push(lane);
      if (!d.every) list.push(leaf(lane, 0));
      continue;
    }
    list.push(raftFrom(d));
  }
  return packets.length ? { list, lanes, packets } : { list, lanes };
}


const PATHS = new Map();
function lanePath(d) {
  let path = PATHS.get(d);
  if (!path) {
    path = makePath({ x: d.points[0][0], y: d.points[0][1], path: d.points.slice(1) });
    PATHS.set(d, path);
  }
  return path;
}


function syncPackets(s, R) {
  const t = s.time;
  const p = s.player;
  const standing = p.grounded ? p.raft : null;
  const live = new Set();
  for (const lane of R.packets) {
    const d = lane.def;
    const path = lanePath(d);
    const speed = d.speed ?? 6;
    const life = path.len / speed + PACKET_SINK;
    const off = d.offset ?? 0;
    const k0 = Math.ceil((t - life - off) / d.period - 1e-9);
    const k1 = Math.floor((t - off) / d.period + 1e-9);
    for (let k = k0; k <= k1; k++) {
      const age = t - (off + k * d.period);
      if (age < 0 || age > life) continue;
      const id = `${d.id}-${k}`;
      let r = R.list.find((o) => o.id === id);
      if (!r) {
        r = {
          id,
          mode: 'packet',
          packet: true,
          lane: d.id,
          k,
          w: d.w ?? 3,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          floats: false,
          state: 'go',
          boarded: false,
        };
        R.list.push(r);
      }
      const dist = age * speed;
      const at = pathAt(path, Math.min(dist, path.len));
      r.vx = at.dx * speed;
      r.vy = at.dy * speed;
      if (dist <= path.len) {
        r.x = at.x;
        r.y = at.y;
        r.state = 'go';
      } else {
        const u = (dist - path.len) / speed; 
        r.x = at.x + at.dx * speed * u;
        r.y = at.y + at.dy * speed * u - PACKET_SINK_DEPTH * Math.min(1, u / PACKET_SINK);
        r.vy = at.dy * speed - PACKET_SINK_DEPTH / PACKET_SINK;
        r.state = 'sinking';
      }
      live.add(id);
      if (standing === id && !r.boarded) {
        r.boarded = true;
        s.events.push({ type: 'packetBoard', id, lane: d.id, x: r.x, y: r.y });
      }
    }
  }
  R.list = R.list.filter((r) => r.mode !== 'packet' || live.has(r.id));
}

function raftFrom(d) {
  return {
    id: d.id,
    mode: d.mode,
    x: d.x,
    y: d.y,
    y0: d.y,
    w: d.w ?? 4,
    vx: 0,
    floats: d.floats !== false,
    sinks: d.sinks ?? null,
    state: d.startOnBoard || d.mode === 'motor' ? 'hold' : d.mode === 'pad' ? 'still' : 'go',
    t: 0,
    boarded: false,
    
    s: 0,
    leg: 1,
    def: d,
  };
}

function leaf(lane, k) {
  const d = lane.def;
  lane.spawned++;
  const r = raftFrom({ ...d, id: `${d.id}-${k + 1}`, mode: 'leaf', lane: d.id });
  r.state = d.startOnBoard && !d.every ? 'hold' : 'go';
  r.lane = d.id;
  r.k = k;
  return r;
}


function pathOf(r) {
  r.path ??= makePath({ x: r.def.x, y: r.def.y, path: [[r.def.to, r.def.y]] });
  return r.path;
}


export function stepRafts(s) {
  const R = s.rafts;
  if (!R) return;
  if (R.packets) syncPackets(s, R);
  const p = s.player;
  const standing = p.grounded ? p.raft : null;
  const carrying = !p.grounded ? p.carryFrom : null;
  for (const lane of R.lanes) {
    const d = lane.def;
    if (!d.every) continue;
    if (lane.next === null && (d.trigger === undefined || p.x >= d.trigger)) lane.next = s.time;
    if (lane.next !== null && s.time >= lane.next - 1e-9) {
      R.list.push(leaf(lane, lane.spawned));
      lane.next += d.every;
      s.events.push({ type: 'raftSpawn', id: R.list[R.list.length - 1].id, lane: d.id, x: d.x });
    }
  }
  for (const r of R.list) {
    if (r.packet) continue; 
    const on = standing === r.id;
    if (on && !r.boarded) {
      r.boarded = true;
      s.events.push({ type: 'raftBoard', id: r.id, mode: r.mode });
    }
    const px = r.x;
    if (r.mode === 'ferry' || r.mode === 'leaf') stepPathMover(s, r, on);
    else if (r.mode === 'pad') stepPad(s, r, on);
    else if (r.mode === 'motor') stepMotor(r, p, on || carrying === r.id);
    r.vx = (r.x - px) / STEP;
  }
  
  R.list = R.list.filter((r) => r.state !== 'gone');
}

function stepPathMover(s, r, on) {
  const d = r.def;
  if (r.state === 'hold') {
    if (on && d.startOnBoard) r.state = 'go';
    return;
  }
  const path = pathOf(r);
  if (r.state === 'wait') {
    r.t += STEP;
    if (r.t >= (d.wait ?? 0) - 1e-9) {
      r.state = 'go';
      r.leg = -r.leg;
    }
    return;
  }
  if (r.state === 'sinking') {
    r.t += STEP;
    if (r.t >= LEAF_SINK - 1e-9) {
      r.state = 'gone';
      s.events.push({ type: 'raftSink', id: r.id, x: r.x });
    }
    return;
  }
  r.s = Math.max(0, Math.min(path.len, r.s + r.leg * (d.speed ?? 4) * STEP));
  r.x = pathAt(path, r.s).x;
  const atEnd = r.leg > 0 ? r.s >= path.len : r.s <= 0;
  if (!atEnd) return;
  r.t = 0;
  if (r.mode === 'leaf') r.state = 'sinking';
  else {
    r.state = 'wait';
    s.events.push({ type: 'raftDock', id: r.id, x: r.x });
  }
}

function stepPad(s, r, on) {
  const k = r.sinks;
  if (!k) return;
  if (r.state === 'still') {
    if (on) {
      r.state = 'armed';
      r.t = 0;
    }
    return;
  }
  r.t += STEP;
  if (r.state === 'armed' && r.t >= k.after - 1e-9) {
    r.state = 'sinking';
    r.t = 0;
    s.events.push({ type: 'padSink', id: r.id, x: r.x, y: r.y0 });
  } else if (r.state === 'sinking') {
    r.y = r.y0 - SINK_DEPTH * Math.min(1, r.t / SINK_TIME);
    if (r.t >= SINK_TIME - 1e-9) {
      r.state = 'under';
      r.t = 0;
    }
  } else if (r.state === 'under' && r.t >= k.back - 1e-9) {
    r.state = 'still';
    r.y = r.y0;
    r.t = 0;
    s.events.push({ type: 'padUp', id: r.id, x: r.x });
  }
}

function stepMotor(r, p, aboard) {
  const d = r.def;
  if (r.state === 'hold') {
    if (!aboard) return;
    r.state = 'go';
  }
  let v = 0;
  if (aboard) v = d.cruise ?? 7;
  else if (Math.abs(p.x - r.x) <= (d.leash ?? 12)) {
    const chase = d.chase ?? 11;
    v = Math.max(-chase, Math.min(chase, (p.x - r.x) * STEER_GAIN));
  }
  r.x = Math.max(d.x, Math.min(d.to ?? Number.POSITIVE_INFINITY, r.x + v * STEP));
}


const isFloor = (r) => r.state !== 'under' && r.state !== 'gone';





function raftFloorAt(R, b, x = b.x) {
  if (!R) return null;
  let best = null;
  for (const r of R.list) {
    if (!isFloor(r)) continue;
    if (x + b.w / 2 <= r.x - r.w / 2 || x - b.w / 2 >= r.x + r.w / 2) continue;
    if (r.y > b.y + FLOOR_TOL) continue;
    if (!best || r.y > best.y) best = r;
  }
  if (!best) return null;
  const vs = best.packet ? 0 : best.state === 'sinking' ? -SINK_DEPTH / SINK_TIME : 0;
  const deck = { y: best.y, vs, vx: best.vx, id: best.id, raft: true, floats: best.floats, up: FLOOR_TOL, noWall: true };
  if (best.packet) deck.packet = true;
  return deck;
}


function solidTopIn(world, b, x, lo, hi) {
  const T = world.tile;
  for (let r = Math.ceil((lo + 1e-7) / T) - 1; (r + 1) * T <= hi + 1e-6; r++)
    for (let c = Math.floor((x - b.w / 2 + 1e-7) / T); c <= Math.floor((x + b.w / 2 - 1e-7) / T); c++)
      if (world.solid(c, r) || world.oneWay(c, r)) return true;
  return false;
}


export function attachRafts(world) {
  const heave = world.floorAt;
  world.floorAt = (b, x = b.x) => {
    let f = raftFloorAt(world.raftState, b, x);
    
    
    if (f?.packet && f.y < b.y - 1e-9 && solidTopIn(world, b, x, f.y, b.y)) f = null;
    const h = heave ? heave(b, x) : null;
    if (!h) return f;
    if (!f) return h;
    return f.y >= h.y ? f : h;
  };
  return world;
}


export function raftById(R, id) {
  if (!R || id === null || id === undefined) return null;
  return R.list.find((r) => r.id === id) ?? null;
}
