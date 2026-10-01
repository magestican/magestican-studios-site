






























export const DECK = Object.freeze({
  width: 3.2,          
  
  
  
  
  
  
  
  height: 2.95,
  
  
  longRun: [15, 22],
  
  
  crossRun: [7, 12],
  
  
  legs: 5,
  roomW: 6.4,          
  roomD: 6.4,
  doorW: 1.6,
});




function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}











export const seededRng = rng;

const lerp = (a, b, t) => a + (b - a) * t;







export function buildLevel(seed = 1, opt = {}) {
  const cfg = { ...DECK, ...opt };
  const r = rng(seed);
  const runs = [];
  const rooms = [];

  let x = 0; let z = 0;
  
  
  for (let leg = 0; leg < cfg.legs; leg += 1) {
    const len = leg === 0
      ? cfg.longRun[1]
      : lerp(cfg.longRun[0], cfg.longRun[1], r());
    runs.push({ axis: 'z', x0: x, z0: z, x1: x, z1: z + len, w: cfg.width });
    z += len;

    if (leg === cfg.legs - 1) break;      

    
    
    const dir = r() < 0.5 ? 1 : -1;
    const cross = lerp(cfg.crossRun[0], cfg.crossRun[1], r());
    runs.push({ axis: 'x', x0: x, z0: z, x1: x + dir * cross, z1: z, w: cfg.width });
    x += dir * cross;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const BAY = { w: 3.0, d: 3.4, car: 3.1 };
  
  
  
  
  
  r();
  const head = runs[0];
  
  
  
  
  
  
  const mouthZ = head.z0 - cfg.width / 2;
  const bays = [
    {
      kind: 'arrival',
      x0: head.x0 - BAY.w / 2,
      x1: head.x0 + BAY.w / 2,
      z0: mouthZ - BAY.d,
      z1: mouthZ,
      
      
      side: 0,
      
      
      
      
      car: { x: head.x0, z: mouthZ - BAY.d + BAY.car / 2, face: { x: 0, z: 1 } },
    },
    {
      kind: 'departure',
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      x0: x - BAY.w / 2,
      x1: x + BAY.w / 2,
      z0: z + cfg.width / 2,
      z1: z + cfg.width / 2 + BAY.d,
      side: 0,
      car: { x, z: z + cfg.width / 2 + BAY.d - BAY.car / 2, face: { x: 0, z: -1 } },
    },
  ];
  
  
  const exit = { x, z: z + cfg.width / 2 - 0.5 };
  
  
  
  
  
  
  
  
  
  const start = { x: head.x0, z: mouthZ + 1.5 };

  
  
  
  
  
  
  const forward = runs.filter((q) => q.axis === 'z');
  const safeOn = forward[Math.max(1, Math.floor(forward.length / 2))];
  rooms.push(makeRoom(safeOn, 'safe', r() < 0.5 ? 1 : -1, 0.55, cfg));

  
  
  
  
  
  
  const candidates = forward.filter((q) => q !== safeOn && q !== forward[0]);
  const count = candidates.length > 1 && r() < 0.7 ? 2 : 1;
  for (let i = 0; i < count && i < candidates.length; i += 1) {
    const on = candidates[Math.floor(r() * candidates.length * 0.999)] || candidates[i];
    if (rooms.some((m) => m.on === on)) continue;
    const roll = r();
    rooms.push({
      ...makeRoom(on, 'back', r() < 0.5 ? 1 : -1, lerp(0.3, 0.75, r()), cfg),
      
      
      
      
      
      
      
      
      
      
      
      contents: i === 0 ? 'item' : (roll < 0.5 ? 'enemy' : 'empty'),
    });
  }

  return {
    seed, runs, rooms, start, exit, bays,
    width: cfg.width,
    height: cfg.height,
    length: runs.reduce((n, q) => n + Math.hypot(q.x1 - q.x0, q.z1 - q.z0), 0),
  };
}

function makeRoom(on, kind, side, t, cfg) {
  
  const z = lerp(on.z0, on.z1, t);
  const doorX = on.x0 + side * (cfg.width / 2);
  return {
    kind,
    on,
    side,
    
    x0: side > 0 ? doorX : doorX - cfg.roomW,
    x1: side > 0 ? doorX + cfg.roomW : doorX,
    z0: z - cfg.roomD / 2,
    z1: z + cfg.roomD / 2,
    door: { x: doorX, z, w: cfg.doorW },
  };
}



















export function runRect(run) {
  const h = run.w / 2;
  return run.axis === 'z'
    ? {
      x0: run.x0 - h,
      x1: run.x0 + h,
      z0: Math.min(run.z0, run.z1) - h,
      z1: Math.max(run.z0, run.z1) + h,
    }
    : {
      x0: Math.min(run.x0, run.x1) - h,
      x1: Math.max(run.x0, run.x1) + h,
      z0: run.z0 - h,
      z1: run.z0 + h,
    };
}

const inRect = (r, x, z, pad) => x >= r.x0 + pad && x <= r.x1 - pad
  && z >= r.z0 + pad && z <= r.z1 - pad;















const BAY_MOUTH = Object.freeze({ reach: 1.6 });

export function insideLevel(level, x, z, pad = 0.4) {
  for (const run of level.runs) if (inRect(runRect(run), x, z, pad)) return true;
  
  
  
  
  
  
  if (level.bays) {
    for (const b of level.bays) {
      if (inRect(b, x, z, pad)) return true;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const f = b.car.face;
      const R = BAY_MOUTH.reach + 1.2;
      const ox = b.car.x + f.x * R; const oz = b.car.z + f.z * R;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const p = Math.min(pad, 0.25);
      const bridged = f.x !== 0
        ? (x >= Math.min(b.car.x, ox) + p && x <= Math.max(b.car.x, ox) - p
          && z >= b.z0 + pad && z <= b.z1 - pad)
        : (z >= Math.min(b.car.z, oz) + p && z <= Math.max(b.car.z, oz) - p
          && x >= b.x0 + pad && x <= b.x1 - pad);
      if (bridged) return true;
    }
  }
  for (const m of level.rooms) {
    if (inRect(m, x, z, pad)) return true;
    
    
    
    const d = m.door;
    const dr = m.side > 0
      ? { x0: d.x - 0.7, x1: d.x + 0.7, z0: d.z - d.w / 2, z1: d.z + d.w / 2 }
      : { x0: d.x - 0.7, x1: d.x + 0.7, z0: d.z - d.w / 2, z1: d.z + d.w / 2 };
    if (inRect(dr, x, z, Math.min(pad, 0.25))) return true;
  }
  return false;
}









const NO_PROPS = Object.freeze([]);


export const PROP_SLACK = 1e-4;



















export function clearOfProps(obstacles, x, z) {
  for (let i = 0; i < obstacles.length; i += 1) {
    const o = obstacles[i];
    if (o.halfLen !== undefined) {
      if (rectDistance(o, x, z) < o.r) return false;
      continue;
    }
    const dx = x - o.x; const dz = z - o.z;
    if (dx * dx + dz * dz < o.r * o.r) return false;
  }
  return true;
}






















export function rectDistance(o, x, z) {
  const dx = x - o.x; const dz = z - o.z;
  const a = dx * o.ax + dz * o.az;
  const f = dx * o.fx + dz * o.fz;
  const qa = Math.max(0, Math.abs(a) - o.halfLen);
  const qf = Math.max(0, Math.abs(f) - o.halfThick);
  return Math.hypot(qa, qf);
}













export function nearestOnRect(o, x, z) {
  const dx = x - o.x; const dz = z - o.z;
  const a = Math.max(-o.halfLen, Math.min(dx * o.ax + dz * o.az, o.halfLen));
  const f = Math.max(-o.halfThick, Math.min(dx * o.fx + dz * o.fz, o.halfThick));
  return { x: o.x + o.ax * a + o.fx * f, z: o.z + o.az * a + o.fz * f };
}


export function firstBlocking(obstacles, x, z) {
  for (let i = 0; i < obstacles.length; i += 1) {
    const o = obstacles[i];
    if (o.halfLen !== undefined) {
      if (rectDistance(o, x, z) < o.r) return o;
      continue;
    }
    const dx = x - o.x; const dz = z - o.z;
    if (dx * dx + dz * dz < o.r * o.r) return o;
  }
  return null;
}

export function pushOutOfProps(obstacles, x, z, slack = 0) {
  
  
  
  
  
  
  
  
  let px = x; let pz = z;
  for (let i = 0; i < obstacles.length; i += 1) {
    const o = obstacles[i];
    if (o.halfLen !== undefined) {
      
      
      
      
      
      const d = rectDistance(o, px, pz);
      if (d >= o.r) continue;
      const dx = px - o.x; const dz = pz - o.z;
      const a = dx * o.ax + dz * o.az;
      const f = dx * o.fx + dz * o.fz;
      if (d < 1e-6) {
        const s = f >= 0 ? 1 : -1;
        px = o.x + a * o.ax + s * (o.halfThick + o.r) * o.fx;
        pz = o.z + a * o.az + s * (o.halfThick + o.r) * o.fz;
        continue;
      }
      
      
      const ca = Math.max(-o.halfLen, Math.min(o.halfLen, a));
      const cf = Math.max(-o.halfThick, Math.min(o.halfThick, f));
      const sx = o.x + ca * o.ax + cf * o.fx; const sz = o.z + ca * o.az + cf * o.fz;
      const nx = (px - sx) / d; const nz = (pz - sz) / d;
      px = sx + nx * (o.r + slack); pz = sz + nz * (o.r + slack);
      continue;
    }
    const dx = px - o.x; const dz = pz - o.z;
    const d = Math.hypot(dx, dz);
    if (d >= o.r) continue;
    
    
    
    if (d < 1e-6) { px = o.x + o.r + slack; pz = o.z; continue; }
    px = o.x + (dx / d) * (o.r + slack);
    pz = o.z + (dz / d) * (o.r + slack);
  }
  return { x: px, z: pz };
}















export function moveInLevel(level, from, dx, dz, pad = 0.4, obstacles = NO_PROPS) {
  const ok = (x, z) => insideLevel(level, x, z, pad)
    && (obstacles.length === 0 || clearOfProps(obstacles, x, z));
  const both = { x: from.x + dx, z: from.z + dz };
  if (ok(both.x, both.z)) return both;
  
  
  
  
  
  
  const slideX = { x: from.x + dx, z: from.z };
  if (Math.abs(dx) > 1e-9 && ok(slideX.x, slideX.z)) return slideX;
  const slideZ = { x: from.x, z: from.z + dz };
  if (Math.abs(dz) > 1e-9 && ok(slideZ.x, slideZ.z)) return slideZ;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (obstacles.length) {
    const out = pushOutOfProps(obstacles, both.x, both.z, PROP_SLACK);
    if ((out.x !== both.x || out.z !== both.z) && ok(out.x, out.z)) return out;
  }
  
  
  
  if (obstacles.length && !clearOfProps(obstacles, from.x, from.z)) {
    const out = pushOutOfProps(obstacles, from.x, from.z, PROP_SLACK);
    if (insideLevel(level, out.x, out.z, pad)) return out;
  }
  return { x: from.x, z: from.z };
}









export function runAt(level, x, z) {
  let best = 0; let bestD = Infinity;
  for (let i = 0; i < level.runs.length; i += 1) {
    const r = runRect(level.runs[i]);
    const cx = Math.max(r.x0, Math.min(x, r.x1));
    const cz = Math.max(r.z0, Math.min(z, r.z1));
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}


export function progressAt(level, x, z) {
  const i = runAt(level, x, z);
  let done = 0;
  for (let k = 0; k < i; k += 1) {
    const q = level.runs[k];
    done += Math.hypot(q.x1 - q.x0, q.z1 - q.z0);
  }
  const q = level.runs[i];
  const along = q.axis === 'z'
    ? (z - q.z0) * Math.sign(q.z1 - q.z0 || 1)
    : (x - q.x0) * Math.sign(q.x1 - q.x0 || 1);
  return done + Math.max(0, along);
}








export function pointBehind(level, x, z, back) {
  let want = progressAt(level, x, z) - back;
  if (want < 0) want = 0;
  let done = 0;
  for (const q of level.runs) {
    const len = Math.hypot(q.x1 - q.x0, q.z1 - q.z0);
    if (done + len >= want) {
      const t = len > 0 ? (want - done) / len : 0;
      return { x: lerp(q.x0, q.x1, t), z: lerp(q.z0, q.z1, t) };
    }
    done += len;
  }
  return { x: level.exit.x, z: level.exit.z };
}




















export function chaseWaypoint(level, from, to, lookahead = 3) {
  const pf = progressAt(level, from.x, from.z);
  const pt = progressAt(level, to.x, to.z);
  const delta = pt - pf;
  
  if (Math.abs(delta) <= lookahead) return { x: to.x, z: to.z };
  
  
  return pointBehind(level, from.x, from.z, -Math.sign(delta) * lookahead);
}



























export function routeLength(level) {
  return level.runs.reduce((n, q) => n + Math.hypot(q.x1 - q.x0, q.z1 - q.z0), 0);
}






export function routePointAt(level, progress) {
  const want = Math.max(0, progress);
  let done = 0;
  for (let i = 0; i < level.runs.length; i += 1) {
    const q = level.runs[i];
    const len = Math.hypot(q.x1 - q.x0, q.z1 - q.z0);
    const last = i === level.runs.length - 1;
    if (done + len >= want || last) {
      const t = len > 0 ? Math.min(1, Math.max(0, (want - done) / len)) : 0;
      return {
        x: lerp(q.x0, q.x1, t),
        z: lerp(q.z0, q.z1, t),
        run: i,
        t,
        dir: { x: len > 0 ? (q.x1 - q.x0) / len : 0, z: len > 0 ? (q.z1 - q.z0) / len : 1 },
      };
    }
    done += len;
  }
  
  
  return { x: 0, z: 0, run: 0, t: 0, dir: { x: 0, z: 1 } };
}







export function wallPointAt(level, progress, side = 1) {
  const p = routePointAt(level, progress);
  const q = level.runs[p.run];
  const h = q.w / 2;
  const s = side >= 0 ? 1 : -1;
  return q.axis === 'z'
    ? { x: p.x + s * h, z: p.z, nx: -s, nz: 0, run: p.run, t: p.t, side: s }
    : { x: p.x, z: p.z + s * h, nx: 0, nz: -s, run: p.run, t: p.t, side: s };
}







export function corners(level) {
  const out = [];
  let done = 0;
  for (let i = 0; i < level.runs.length - 1; i += 1) {
    const q = level.runs[i];
    done += Math.hypot(q.x1 - q.x0, q.z1 - q.z0);
    out.push({ index: i + 1, x: q.x1, z: q.z1, progress: done, runBefore: i, runAfter: i + 1 });
  }
  return out;
}
