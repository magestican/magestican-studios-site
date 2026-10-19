

























import { STEP } from './constants.js';
import { makePath, pathAt } from './slipstream.js';

const LEAF_SINK = 2; 
const SINK_DEPTH = 0.5; 
const SINK_TIME = 0.3; 
const STEER_GAIN = 4; 
const FLOOR_TOL = 0.06; 


export function createRafts(level) {
  if (!level.rafts?.length) return null;
  const list = [];
  const lanes = [];
  for (const d of level.rafts) {
    if (d.mode === 'lane') {
      const lane = { id: d.id, def: d, spawned: 0, next: d.every ? null : 0, leaves: [] };
      lanes.push(lane);
      if (!d.every) list.push(leaf(lane, 0));
      continue;
    }
    list.push(raftFrom(d));
  }
  return { list, lanes };
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
  const vs = best.state === 'sinking' ? -SINK_DEPTH / SINK_TIME : 0;
  return { y: best.y, vs, vx: best.vx, id: best.id, raft: true, floats: best.floats, up: FLOOR_TOL, noWall: true };
}


export function attachRafts(world) {
  const heave = world.floorAt;
  world.floorAt = (b, x = b.x) => {
    const f = raftFloorAt(world.raftState, b, x);
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
