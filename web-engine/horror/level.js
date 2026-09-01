






























export const DECK = Object.freeze({
  width: 3.2,          
  height: 3.6,
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const BAY = { w: 3.0, d: 3.4 };
  const arrivalSide = r() < 0.5 ? 1 : -1;
  const bays = [
    {
      kind: 'arrival',
      
      x0: arrivalSide > 0 ? runs[0].x0 + cfg.width / 2 : runs[0].x0 - cfg.width / 2 - BAY.d,
      x1: arrivalSide > 0 ? runs[0].x0 + cfg.width / 2 + BAY.d : runs[0].x0 - cfg.width / 2,
      z0: 16 - BAY.w / 2,
      z1: 16 + BAY.w / 2,
      side: arrivalSide,
      
      
      car: {
        x: runs[0].x0 + arrivalSide * (cfg.width / 2 + BAY.d / 2),
        z: 16,
        face: { x: -arrivalSide, z: 0 },
      },
    },
    {
      kind: 'departure',
      x0: x - BAY.w / 2,
      x1: x + BAY.w / 2,
      z0: z,
      z1: z + BAY.d,
      side: 0,
      car: { x, z: z + BAY.d / 2, face: { x: 0, z: -1 } },
    },
  ];
  
  
  const exit = { x, z: z - 0.4 };
  
  
  
  
  const start = { x: runs[0].x0, z: 16 };

  
  
  
  
  
  
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









export function insideLevel(level, x, z, pad = 0.4) {
  for (const run of level.runs) if (inRect(runRect(run), x, z, pad)) return true;
  
  
  
  if (level.bays) {
    for (const b of level.bays) {
      if (inRect(b, x, z, Math.min(pad, 0.3))) return true;
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



















export function clearOfProps(obstacles, x, z) {
  for (let i = 0; i < obstacles.length; i += 1) {
    const o = obstacles[i];
    const dx = x - o.x; const dz = z - o.z;
    if (dx * dx + dz * dz < o.r * o.r) return false;
  }
  return true;
}








export function pushOutOfProps(obstacles, x, z) {
  let px = x; let pz = z;
  for (let i = 0; i < obstacles.length; i += 1) {
    const o = obstacles[i];
    const dx = px - o.x; const dz = pz - o.z;
    const d = Math.hypot(dx, dz);
    if (d >= o.r) continue;
    
    
    
    if (d < 1e-6) { px = o.x + o.r; pz = o.z; continue; }
    px = o.x + (dx / d) * o.r;
    pz = o.z + (dz / d) * o.r;
  }
  return { x: px, z: pz };
}















export function moveInLevel(level, from, dx, dz, pad = 0.4, obstacles = NO_PROPS) {
  const ok = (x, z) => insideLevel(level, x, z, pad)
    && (obstacles.length === 0 || clearOfProps(obstacles, x, z));
  const both = { x: from.x + dx, z: from.z + dz };
  if (ok(both.x, both.z)) return both;
  const slideX = { x: from.x + dx, z: from.z };
  if (ok(slideX.x, slideX.z)) return slideX;
  const slideZ = { x: from.x, z: from.z + dz };
  if (ok(slideZ.x, slideZ.z)) return slideZ;
  
  
  
  if (obstacles.length && !clearOfProps(obstacles, from.x, from.z)) {
    const out = pushOutOfProps(obstacles, from.x, from.z);
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
