
























































import { insideLevel, progressAt, runRect } from './level.js';

export const DOLLY = Object.freeze({
  
  
  
  
  
  
  back: 6.8,
  
  
  
  
  
  
  
  eyeH: 2.35,
  
  
  
  targetH: 1.15,
  
  
  
  
  
  closeEyeH: 1.65,
  
  
  closeSide: 0.35,
  
  
  
  
  
  
  
  lead: 1.0,
  
  
  
  
  
  lateral: 0.55,
  
  
  
  
  
  ease: 1.5,
  
  
  
  subjectH: 1.8,
  
  
  
  
  
  minFrameHeight: 0.30,
  
  
  
  
  pinholeMargin: 0.02,
  
  
  
  
  
  
  
  
  
  
  
  fovH: Object.freeze({ desktop: 60, mobile: 68, aim: 44 }),
  aspect: 16 / 9,
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  rates: Object.freeze({ eye: 8, eyeIn: 2.5, target: 6, lead: 4, aim: 10, orbit: 1.5, fov: 10, pull: 14, let: 1.6 }),
  
  
  
  
  
  
  
  
  
  
  
  slack: 0.25,
  maxSpeed: 9,
  maxTargetSpeed: 18,
  
  
  
  
  
  
  eyePad: 0.3,
  
  
  
  
  snap: 12,
  walkSpeed: 2.4,
  
  
  roofMargin: 0.4,
  floorMin: 1.0,
  
  
  
  
  
  
  
  
  arena: 'dolly',
  
  
  shutBay: false,
});

export const ORBIT = Object.freeze({
  
  
  step: 0.1,
  
  
  
  minDist: 0.3,
  
  
  
  clear: 0.6,
});



export const AIM = Object.freeze({
  dist: 2.2,          
  shoulder: 0.42,     
  pivotH: 1.52,
  rise: 0.35,         
  ahead: 6.0,         
});





const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));






export const facingOf = (yaw) => ({ x: -Math.sin(yaw || 0), z: Math.cos(yaw || 0) });







export const rightOf = (f) => ({ x: -f.z, z: f.x });







export function approach(current, target, rate, dt) {
  if (!(dt > 0)) return current;
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}





const DEG = Math.PI / 180;


export function verticalFov(fovH, aspect = DOLLY.aspect) {
  return 2 * Math.atan(Math.tan((fovH * DEG) / 2) / aspect) / DEG;
}













export function frameHeightFraction(subjectH, distance, fovV) {
  return subjectH / (2 * distance * Math.tan((fovV * DEG) / 2));
}


export function maxFovForFrameHeight(subjectH, distance, minFraction) {
  return 2 * Math.atan(subjectH / (2 * distance * minFraction)) / DEG;
}









export function fovFor(cfg, mode = 'dolly') {
  const h = mode === 'aim' ? cfg.fovH.aim : (cfg.mobile ? cfg.fovH.mobile : cfg.fovH.desktop);
  const v = verticalFov(h, cfg.aspect);
  if (mode === 'aim') return v;
  const cap = maxFovForFrameHeight(cfg.subjectH, cfg.back, cfg.minFrameHeight + cfg.pinholeMargin);
  return Math.min(v, cap);
}







export function projectPoint(placement, point, aspect = DOLLY.aspect) {
  const e = placement.eye; const t = placement.target;
  
  let zx = e.x - t.x; let zy = e.y - t.y; let zz = e.z - t.z;
  const zm = Math.hypot(zx, zy, zz) || 1; zx /= zm; zy /= zm; zz /= zm;
  
  let xx = 1 * zz - 0 * zy; let xy = 0 * zx - 0 * zz; let xz = 0 * zy - 1 * zx;
  const xm = Math.hypot(xx, xy, xz) || 1; xx /= xm; xy /= xm; xz /= xm;
  
  const yx = zy * xz - zz * xy; const yy = zz * xx - zx * xz; const yz = zx * xy - zy * xx;
  const vx = point.x - e.x; const vy = point.y - e.y; const vz = point.z - e.z;
  const cx = vx * xx + vy * xy + vz * xz;
  const cy = vx * yx + vy * yy + vz * yz;
  const depth = -(vx * zx + vy * zy + vz * zz);
  const th = Math.tan((placement.fov * DEG) / 2);
  const d = Math.abs(depth) < 1e-9 ? 1e-9 : depth;
  return { x: (cx / d) / (th * aspect), y: (cy / d) / th, depth };
}








const routeCache = new WeakMap();
function routeInfo(level) {
  let info = routeCache.get(level);
  if (info) return info;
  const breaks = [0]; let total = 0;
  for (const q of level.runs) {
    total += Math.hypot(q.x1 - q.x0, q.z1 - q.z0);
    breaks.push(total);
  }
  const w = level.width ?? 3.2;
  
  
  
  
  
  
  
  
  
  
  
  
  let reach = w / 2;
  const arr = (level.bays || []).find((b) => b.kind === 'arrival' && !b.side);
  if (arr && level.runs.length) {
    const q = level.runs[0];
    const len = Math.hypot(q.x1 - q.x0, q.z1 - q.z0) || 1;
    const dx = (q.x1 - q.x0) / len; const dz = (q.z1 - q.z0) / len;
    for (const [cx, cz] of [[arr.x0, arr.z0], [arr.x1, arr.z0], [arr.x0, arr.z1], [arr.x1, arr.z1]]) {
      reach = Math.max(reach, -((cx - q.x0) * dx + (cz - q.z0) * dz));
    }
  }
  info = {
    breaks,
    total,
    
    
    
    
    sMin: -reach + DOLLY.eyePad + 0.05,
    sMax: total + (w / 2) - DOLLY.eyePad - 0.05,
  };
  routeCache.set(level, info);
  return info;
}


export function routePointAt(level, s) {
  const { breaks, sMin, sMax } = routeInfo(level);
  const runs = level.runs;
  const sc = clamp(s, sMin, sMax);
  let i = 0;
  while (i < runs.length - 1 && sc >= breaks[i + 1]) i += 1;
  const q = runs[i];
  const len = breaks[i + 1] - breaks[i];
  const t = len > 0 ? (sc - breaks[i]) / len : 0;
  return { x: q.x0 + (q.x1 - q.x0) * t, z: q.z0 + (q.z1 - q.z0) * t };
}










export function routePoint(level, s, ease = DOLLY.ease) {
  if (!(ease > 0)) return routePointAt(level, s);
  const { breaks, sMin, sMax } = routeInfo(level);
  const a = s - ease; const b = s + ease;
  const cuts = [a];
  for (const c of breaks) if (c > a && c < b) cuts.push(c);
  if (sMin > a && sMin < b) cuts.push(sMin);
  if (sMax > a && sMax < b) cuts.push(sMax);
  cuts.push(b);
  cuts.sort((p, q) => p - q);
  let x = 0; let z = 0;
  for (let i = 1; i < cuts.length; i += 1) {
    const w = cuts[i] - cuts[i - 1];
    if (!(w > 0)) continue;
    const m = routePointAt(level, (cuts[i - 1] + cuts[i]) / 2);
    x += m.x * w; z += m.z * w;
  }
  return { x: x / (b - a), z: z / (b - a) };
}


export function routeTangent(level, s, ease = DOLLY.ease) {
  const h = 0.25;
  const p0 = routePoint(level, s - h, ease);
  const p1 = routePoint(level, s + h, ease);
  const dx = p1.x - p0.x; const dz = p1.z - p0.z;
  const m = Math.hypot(dx, dz);
  if (m > 1e-9) return { x: dx / m, z: dz / m };
  
  const q = level.runs[s < 0 ? 0 : level.runs.length - 1];
  const L = Math.hypot(q.x1 - q.x0, q.z1 - q.z0) || 1;
  return { x: (q.x1 - q.x0) / L, z: (q.z1 - q.z0) / L };
}

const eyeHeight = (level, cfg, want) => clamp(want, cfg.floorMin, (level.height ?? 2.95) - cfg.roofMargin);











export function easedPull(state, key, want, dt, cfg) {
  if (!state || !(dt > 0)) { if (state) state[key] = want; return want; }
  const had = state[key];
  if (!(had > 0)) { state[key] = want; return want; }
  const rate = want < had ? cfg.rates.pull : cfg.rates.let;
  const now = approach(had, want, rate, dt);
  state[key] = now;
  return now;
}


























export function routeProgress(level, x, z) {
  const { breaks } = routeInfo(level);
  const runs = level.runs;
  let first = -1; let last = -1;
  for (let i = 0; i < runs.length; i += 1) {
    const r = runRect(runs[i]);
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) { if (first < 0) first = i; last = i; }
  }
  if (first < 0) return progressAt(level, x, z);          
  const alongOf = (q) => (q.axis === 'z'
    ? (z - q.z0) * Math.sign(q.z1 - q.z0 || 1)
    : (x - q.x0) * Math.sign(q.x1 - q.x0 || 1));
  if (last === first) {
    const q = runs[first];
    const len = breaks[first + 1] - breaks[first];
    const hi = first === runs.length - 1 ? Infinity : len;
    return breaks[first] + clamp(alongOf(q), 0, hi);
  }
  
  
  const i = first;
  const a = runs[i]; const b = runs[i + 1];
  const la = Math.hypot(a.x1 - a.x0, a.z1 - a.z0) || 1;
  const lb = Math.hypot(b.x1 - b.x0, b.z1 - b.z0) || 1;
  const da = { x: (a.x1 - a.x0) / la, z: (a.z1 - a.z0) / la };
  const db = { x: (b.x1 - b.x0) / lb, z: (b.z1 - b.z0) / lb };
  const hw = (a.w ?? level.width ?? 3.2) / 2;
  
  
  const inner = { x: a.x1 + db.x * hw - da.x * hw, z: a.z1 + db.z * hw - da.z * hw };
  const along = Math.max(0, (x - inner.x) * da.x + (z - inner.z) * da.z);     
  const across = Math.max(0, (inner.x - x) * db.x + (inner.z - z) * db.z);    
  const theta = Math.atan2(along, across);                                     
  return breaks[i + 1] - hw + (2 * hw) * ((2 * theta) / Math.PI);
}





const inRect = (r, x, z, pad) => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;











export function eyeInside(level, x, z, pad = DOLLY.eyePad) {
  if (!insideLevel(level, x, z, pad)) return false;
  if (level.bays) {
    for (const b of level.bays) {
      if (!b.side || z < b.z0 || z > b.z1) continue;
      if (b.side > 0 ? x > b.x1 - pad : x < b.x0 + pad) return false;
    }
  }
  return true;
}






function stepEye(level, from, dx, dz, pad) {
  const ok = (x, z) => eyeInside(level, x, z, pad);
  if (ok(from.x + dx, from.z + dz)) return { x: from.x + dx, z: from.z + dz };
  if (ok(from.x + dx, from.z)) return { x: from.x + dx, z: from.z };
  if (ok(from.x, from.z + dz)) return { x: from.x, z: from.z + dz };
  return { x: from.x, z: from.z };
}








export function cellAt(level, x, z) {
  for (let i = 0; i < level.rooms.length; i += 1) {
    if (inRect(level.rooms[i], x, z, 0)) return { kind: 'room', i };
  }
  if (level.bays) {
    for (let i = 0; i < level.bays.length; i += 1) {
      const b = level.bays[i];
      
      
      
      if (b.kind === 'arrival' && inRect(b, x, z, 0)) return { kind: 'bay', i };
    }
  }
  return null;
}

const sameCell = (a, b) => (!a && !b) || (!!a && !!b && a.kind === b.kind && a.i === b.i);


export function portalOf(level, cell) {
  if (cell.kind === 'room') {
    const d = level.rooms[cell.i].door;
    return { x: d.x, z: d.z };
  }
  
  
  
  const b = level.bays[cell.i];
  const f = b.car.face || { x: 0, z: -1 };
  const half = f.x !== 0 ? (b.x1 - b.x0) / 2 : (b.z1 - b.z0) / 2;
  return { x: b.car.x + f.x * half, z: b.car.z + f.z * half };
}












export function fixedPlacement(level, cfg = DOLLY) {
  const f = cfg.fixed;
  return {
    eye: { x: f.eye.x, y: eyeHeight(level, cfg, f.eye.y), z: f.eye.z },
    target: { x: f.target.x, y: f.target.y, z: f.target.z },
    fov: f.fov,
    mode: 'fixed',
  };
}



















export function roundHim(level, eye, head, player, clear = ORBIT.clear, pad = DOLLY.eyePad) {
  if (Math.hypot(head.x - player.x, head.z - player.z) < clear) return head;
  const dx = head.x - eye.x; const dz = head.z - eye.z;
  const L2 = dx * dx + dz * dz;
  if (L2 < 1e-12) return head;
  const t = ((player.x - eye.x) * dx + (player.z - eye.z) * dz) / L2;
  if (t <= 0 || t >= 1) return head;
  let nx = eye.x + dx * t - player.x; let nz = eye.z + dz * t - player.z;
  let nl = Math.hypot(nx, nz);
  if (nl >= clear) return head;
  if (nl < 1e-6) { const L = Math.sqrt(L2); nx = dz / L; nz = -dx / L; nl = 1; }
  nx /= nl; nz /= nl;
  for (const side of [1, -1]) {
    const w = { x: player.x + nx * side * clear, y: head.y, z: player.z + nz * side * clear };
    if (eyeInside(level, w.x, w.z, pad)) return w;
  }
  return head;
}






export function baseMode(level, player, cfg = DOLLY) {
  if (cellAt(level, player.x, player.z)) return 'orbit';
  if (level.boss) return cfg.arena;
  return 'dolly';
}

export function pickMode(level, player, opts = {}) {
  if (opts.aiming) return 'aim';
  return baseMode(level, player, { ...DOLLY, ...opts });
}













export function clampInsideLevel(level, from, eye, pad = DOLLY.eyePad, step = ORBIT.step) {
  const dx = eye.x - from.x; const dz = eye.z - from.z;
  const L = Math.hypot(dx, dz);
  if (L < 1e-9) return { x: from.x, z: from.z, dist: 0, clamped: false };
  const ux = dx / L; const uz = dz / L;
  let ok = 0;
  const n = Math.ceil(L / step);
  for (let i = 1; i <= n; i += 1) {
    const d = Math.min(L, i * step);
    const px = from.x + ux * d; const pz = from.z + uz * d;
    if (!eyeInside(level, px, pz, pad)) break;
    ok = d;
  }
  return { x: from.x + ux * ok, z: from.z + uz * ok, dist: ok, clamped: ok < L - 1e-9 };
}







export function dollyPlacement(level, player, state = null, cfg = DOLLY) {
  const p = routeProgress(level, player.x, player.z);
  
  
  
  
  
  
  const tp = routeTangent(level, p, cfg.ease);
  const along = (player.vx || 0) * tp.x + (player.vz || 0) * tp.z;
  
  const s = Math.max(p + along / cfg.rates.eye - cfg.back,
    cfg.shutBay ? -(level.runs[0].w / 2 - cfg.eyePad) : -Infinity);
  const c = routePoint(level, s, cfg.ease);
  const r = rightOf(routeTangent(level, s, cfg.ease));
  const lead = state ? state.lead : { x: 0, z: 0 };
  const ex = c.x + r.x * cfg.lateral; const ez = c.z + r.z * cfg.lateral;
  
  
  
  const k = clamp(Math.hypot(ex - player.x, ez - player.z) / cfg.back, 0, 1);
  return {
    eye: { x: ex, y: eyeHeight(level, cfg, cfg.eyeH), z: ez },
    target: {
      x: player.x + (r.x * cfg.lateral + lead.x) * k,
      y: cfg.targetH,
      z: player.z + (r.z * cfg.lateral + lead.z) * k,
    },
    fov: fovFor(cfg, 'dolly'),
    mode: 'dolly',
  };
}






export function orbitPlacement(level, player, state, cfg = DOLLY, dt = 0) {
  const dir = state && state.dir ? state.dir : facingOf(player.yaw);
  const r = rightOf(dir);
  const lead = state ? state.lead : { x: 0, z: 0 };
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const behindShoulder = (l) => {
    const s = clampInsideLevel(level, player, { x: player.x + r.x * l, z: player.z + r.z * l }, cfg.eyePad, ORBIT.step);
    return { s, c: clampInsideLevel(level, s, { x: s.x - dir.x * cfg.back, z: s.z - dir.z * cfg.back }, cfg.eyePad, ORBIT.step) };
  };
  let { s: shoulder, c } = behindShoulder(cfg.lateral);
  const narrow = Math.min(cfg.lateral, c.dist * cfg.closeSide);
  if (narrow < cfg.lateral) ({ s: shoulder, c } = behindShoulder(narrow));
  if (c.dist < ORBIT.minDist && state && state.orbitEye
    && eyeInside(level, state.orbitEye.x, state.orbitEye.z, cfg.eyePad)) {
    c = state.orbitEye;
  }
  
  
  
  
  
  
  
  
  
  
  
  const rawDist = Math.hypot(c.x - shoulder.x, c.z - shoulder.z);
  const dist = easedPull(state, 'orbitPull', rawDist, dt, cfg);
  c = { ...c, x: shoulder.x - dir.x * dist, z: shoulder.z - dir.z * dist };
  const k = clamp(dist / cfg.back, 0, 1);
  const kh = Math.max(0.5, k);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let behind = 1; let lensDist = dist;
  if (state && state.eye) {
    const bx = player.x - state.eye.x; const bz = player.z - state.eye.z;
    const bl = Math.hypot(bx, bz);
    behind = bl > 1e-6 ? clamp((bx * dir.x + bz * dir.z) / bl, 0, 1) : 0;
    lensDist = Math.min(dist, bl);
  }
  const close = clamp(1 - lensDist / (cfg.back * 0.5), 0, 1);
  const near = close * behind;
  const far = {
    x: player.x + (r.x * cfg.lateral + lead.x) * k,
    z: player.z + (r.z * cfg.lateral + lead.z) * k,
  };
  const ahead = {
    x: player.x + dir.x * AIM.ahead + r.x * AIM.shoulder,
    z: player.z + dir.z * AIM.ahead + r.z * AIM.shoulder,
  };
  return {
    eye: { x: c.x, y: eyeHeight(level, cfg, lerp(cfg.targetH + (cfg.eyeH - cfg.targetH) * kh, cfg.closeEyeH, close)), z: c.z },
    target: {
      x: lerp(far.x, ahead.x, near),
      y: lerp(cfg.targetH, AIM.pivotH, close),
      z: lerp(far.z, ahead.z, near),
    },
    fov: fovFor(cfg, 'orbit'),
    mode: 'orbit',
  };
}






export function aimPlacement(level, player, cfg = DOLLY, state = null, dt = 0) {
  const f = facingOf(player.yaw);
  const r = rightOf(f);
  const want = {
    x: player.x - f.x * AIM.dist + r.x * AIM.shoulder,
    z: player.z - f.z * AIM.dist + r.z * AIM.shoulder,
  };
  const c = clampInsideLevel(level, player, want, cfg.eyePad, ORBIT.step);
  
  
  
  const dWant = Math.hypot(want.x - player.x, want.z - player.z) || 1;
  const used = easedPull(state, 'aimPull', c.dist, dt, cfg);
  const ux = (want.x - player.x) / dWant; const uz = (want.z - player.z) / dWant;
  const e = { x: player.x + ux * used, z: player.z + uz * used };
  return {
    eye: { x: e.x, y: eyeHeight(level, cfg, AIM.pivotH + AIM.rise), z: e.z },
    target: { x: player.x + f.x * AIM.ahead + r.x * AIM.shoulder, y: AIM.pivotH, z: player.z + f.z * AIM.ahead + r.z * AIM.shoulder },
    fov: fovFor(cfg, 'aim'),
    mode: 'aim',
  };
}





function withOpts(opts) {
  if (!opts) return DOLLY;
  return {
    ...DOLLY,
    ...opts,
    fovH: { ...DOLLY.fovH, ...(opts.fovH || {}) },
    rates: { ...DOLLY.rates, ...(opts.rates || {}) },
  };
}







export function createCameraState(level, player, mode = 'auto', opts = {}) {
  const state = {
    eye: null,
    target: null,
    fov: 0,
    mode: 'dolly',
    lead: { x: 0, z: 0 },
    dir: facingOf(player.yaw),
    aim: 0,
    orbitEye: null,
    snaps: 0,
    frames: 0,
  };
  cameraFor(level, player, mode, state, 0, opts);
  return state;
}

const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
























const SEALED = new WeakMap();
function sealedView(level) {
  if (!level.bays || !level.bays.some((b) => b.kind === 'arrival')) return level;
  let v = SEALED.get(level);
  if (!v) { v = { ...level, bays: level.bays.filter((b) => b.kind !== 'arrival') }; SEALED.set(level, v); }
  return v;
}

export function cameraFor(level, player, mode, state, dt, opts) {
  const cfg = withOpts(opts);
  if (cfg.shutBay) level = sealedView(level);
  const forced = mode && mode !== 'auto' ? mode : null;
  const aiming = forced ? forced === 'aim' : !!cfg.aiming;
  const base = forced && forced !== 'aim' ? forced : baseMode(level, player, cfg);
  if (base === 'fixed' && !cfg.fixed) throw new Error('cameraFor: mode "fixed" needs opts.fixed = { eye, target, fov }');

  const vx = player.vx || 0; const vz = player.vz || 0;
  const speed = Math.hypot(vx, vz);
  const moving = speed > 0.3;

  
  const k = speed > 1e-9 ? Math.min(1, speed / cfg.walkSpeed) * cfg.lead / speed : 0;
  state.lead = {
    x: approach(state.lead.x, vx * k, cfg.rates.lead, dt),
    z: approach(state.lead.z, vz * k, cfg.rates.lead, dt),
  };
  
  
  if (moving && dt > 0) {
    const a0 = Math.atan2(state.dir.z, state.dir.x);
    const a1 = Math.atan2(vz, vx);
    let d = a1 - a0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const a = a0 + d * (1 - Math.exp(-cfg.rates.orbit * dt));
    state.dir = { x: Math.cos(a), z: Math.sin(a) };
  }

  const shot = base === 'fixed' ? fixedPlacement(level, cfg)
    : base === 'orbit' ? orbitPlacement(level, player, state, cfg, dt)
      : dollyPlacement(level, player, state, cfg);
  if (base === 'orbit') state.orbitEye = { x: shot.eye.x, z: shot.eye.z };

  
  
  state.aim = dt > 0 ? approach(state.aim, aiming ? 1 : 0, cfg.rates.aim, dt) : (aiming ? 1 : 0);
  let goal = shot;
  if (state.aim > 1e-4) {
    const a = aimPlacement(level, player, cfg, state, dt);
    const u = state.aim;
    goal = {
      eye: { x: lerp(shot.eye.x, a.eye.x, u), y: lerp(shot.eye.y, a.eye.y, u), z: lerp(shot.eye.z, a.eye.z, u) },
      target: { x: lerp(shot.target.x, a.target.x, u), y: lerp(shot.target.y, a.target.y, u), z: lerp(shot.target.z, a.target.z, u) },
      fov: lerp(shot.fov, a.fov, u),
      mode: aiming ? 'aim' : shot.mode,
    };
  }

  const fresh = !state.eye;
  const relocated = !fresh && dt > 0 && dist3(state.eye, goal.eye) > cfg.snap;
  if (fresh || relocated) {
    if (relocated) state.snaps += 1;
    state.eye = { ...goal.eye };
    state.target = { ...goal.target };
    state.fov = goal.fov;
  } else if (!(dt > 0)) {
    
    
  } else {
    
    
    
    
    
    const cg = cellAt(level, goal.eye.x, goal.eye.z);
    const ce = cellAt(level, state.eye.x, state.eye.z);
    let head = goal.eye;
    
    
    
    if (base !== 'fixed' && !sameCell(cg, ce)) {
      const cell = cg || ce;
      const p = portalOf(level, cell);
      
      
      
      
      
      
      
      
      
      const into = cell.kind === 'room'
        ? { x: level.rooms[cell.i].side, z: 0 }
        : { x: -(level.bays[cell.i].car.face || { x: 0, z: -1 }).x, z: -(level.bays[cell.i].car.face || { x: 0, z: -1 }).z };
      const dir = cg ? 1 : -1;
      head = { x: p.x + dir * into.x * 0.6, y: goal.eye.y, z: p.z + dir * into.z * 0.6 };
    }
    if (base !== 'fixed') head = roundHim(level, state.eye, head, player);
    
    
    
    
    
    
    
    
    
    
    
    const dEyeNow = Math.hypot(state.eye.x - player.x, state.eye.z - player.z);
    const dEyeGoal = Math.hypot(head.x - player.x, head.z - player.z);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const closingFromExcess = base === 'dolly'
      && dEyeGoal < dEyeNow && dEyeNow > cfg.back + cfg.slack;
    const eyeRate = closingFromExcess ? cfg.rates.eyeIn : cfg.rates.eye;
    const ke = 1 - Math.exp(-eyeRate * dt);
    const key = 1 - Math.exp(-cfg.rates.eye * dt);
    let sx = (head.x - state.eye.x) * ke;
    let sy = (goal.eye.y - state.eye.y) * key;
    let sz = (head.z - state.eye.z) * ke;
    const sl = Math.hypot(sx, sy, sz);
    const cap = cfg.maxSpeed * dt;
    if (sl > cap) { const f = cap / sl; sx *= f; sy *= f; sz *= f; }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const from = { x: state.eye.x, z: state.eye.z };
    if (base === 'fixed' || !eyeInside(level, from.x, from.z, cfg.eyePad)) {
      state.eye = { x: from.x + sx, y: state.eye.y + sy, z: from.z + sz };
    } else {
      const moved = stepEye(level, from, sx, sz, cfg.eyePad);
      if (eyeInside(level, moved.x, moved.z, cfg.eyePad)) {
        state.eye = { x: moved.x, y: state.eye.y + sy, z: moved.z };
      } else {
        state.snaps += 1;
        state.eye = { ...goal.eye };
      }
    }
    const kt = 1 - Math.exp(-cfg.rates.target * dt);
    let tx = (goal.target.x - state.target.x) * kt;
    let ty = (goal.target.y - state.target.y) * kt;
    let tz = (goal.target.z - state.target.z) * kt;
    const tl = Math.hypot(tx, ty, tz);
    const tcap = cfg.maxTargetSpeed * dt;
    if (tl > tcap) { const f = tcap / tl; tx *= f; ty *= f; tz *= f; }
    state.target = { x: state.target.x + tx, y: state.target.y + ty, z: state.target.z + tz };
    state.fov = approach(state.fov, goal.fov, cfg.rates.fov, dt);
  }
  state.eye.y = eyeHeight(level, cfg, state.eye.y);
  state.mode = goal.mode;
  state.frames += 1;
  return {
    eye: { ...state.eye },
    target: { ...state.target },
    fov: state.fov,
    mode: state.mode,
  };
}
