












































const ALPHA = 0.5;

function knot(t, a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z, (b.y ?? 0) - (a.y ?? 0));
  return t + Math.pow(d, ALPHA);
}






export function splinePoint(p0, p1, p2, p3, u) {
  const t0 = 0;
  const t1 = knot(t0, p0, p1);
  const t2 = knot(t1, p1, p2);
  const t3 = knot(t2, p2, p3);
  
  
  
  
  
  
  if (!(t1 > t0) || !(t2 > t1) || !(t3 > t2)) {
    return {
      x: p1.x + (p2.x - p1.x) * u,
      y: (p1.y ?? 0) + ((p2.y ?? 0) - (p1.y ?? 0)) * u,
      z: p1.z + (p2.z - p1.z) * u,
    };
  }
  const t = t1 + (t2 - t1) * u;
  const axis = (a, b, ta, tb, key) => {
    const av = key === 'y' ? (a.y ?? 0) : a[key];
    const bv = key === 'y' ? (b.y ?? 0) : b[key];
    return ((tb - t) * av + (t - ta) * bv) / (tb - ta);
  };
  const out = {};
  for (const key of ['x', 'y', 'z']) {
    const a1 = axis(p0, p1, t0, t1, key);
    const a2 = axis(p1, p2, t1, t2, key);
    const a3 = axis(p2, p3, t2, t3, key);
    const b1 = ((t2 - t) * a1 + (t - t0) * a2) / (t2 - t0);
    const b2 = ((t3 - t) * a2 + (t - t1) * a3) / (t3 - t1);
    out[key] = ((t2 - t) * b1 + (t - t1) * b2) / (t2 - t1);
  }
  return out;
}























export function buildPath(control, { samplesPerSegment = 14, defaultWidth = 16 } = {}) {
  if (!Array.isArray(control) || control.length < 4) {
    throw new Error('buildPath: a closed track needs at least 4 control points');
  }
  const n = control.length;
  const at = (i) => control[((i % n) + n) % n];
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1); const p1 = at(i); const p2 = at(i + 1); const p3 = at(i + 2);
    const w1 = p1.width ?? defaultWidth;
    const w2 = p2.width ?? defaultWidth;
    for (let k = 0; k < samplesPerSegment; k += 1) {
      const u = k / samplesPerSegment;
      const p = splinePoint(p0, p1, p2, p3, u);
      const smooth = u * u * (3 - 2 * u);
      pts.push({ x: p.x, y: p.y, z: p.z, width: w1 + (w2 - w1) * smooth });
    }
  }

  
  
  
  
  const m = pts.length;
  const s = new Float64Array(m + 1);
  const tangents = new Array(m);
  for (let i = 0; i < m; i += 1) {
    const a = pts[i]; const b = pts[(i + 1) % m];
    const dx = b.x - a.x; const dz = b.z - a.z;
    const d = Math.hypot(dx, dz) || 1e-9;
    s[i + 1] = s[i] + d;
    tangents[i] = { x: dx / d, z: dz / d };
  }

  
  
  let minX = Infinity; let maxX = -Infinity; let minZ = Infinity; let maxZ = -Infinity;
  for (const p of pts) {
    if (p.x - p.width < minX) minX = p.x - p.width;
    if (p.x + p.width > maxX) maxX = p.x + p.width;
    if (p.z - p.width < minZ) minZ = p.z - p.width;
    if (p.z + p.width > maxZ) maxZ = p.z + p.width;
  }

  return { pts, tangents, s, length: s[m], count: m, bounds: { minX, maxX, minZ, maxZ } };
}






export function wrapS(path, s) {
  const L = path.length;
  return ((s % L) + L) % L;
}










export function signedDelta(path, from, to) {
  const L = path.length;
  let d = wrapS(path, to) - wrapS(path, from);
  if (d > L / 2) d -= L;
  if (d < -L / 2) d += L;
  return d;
}


export function sampleAt(path, s) {
  const t = wrapS(path, s);
  
  
  let lo = 0; let hi = path.count;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (path.s[mid + 1] <= t) lo = mid + 1; else hi = mid;
  }
  const i = Math.min(lo, path.count - 1);
  const a = path.pts[i]; const b = path.pts[(i + 1) % path.count];
  const span = path.s[i + 1] - path.s[i] || 1e-9;
  const u = (t - path.s[i]) / span;
  const tan = path.tangents[i];
  return {
    index: i,
    s: t,
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    z: a.z + (b.z - a.z) * u,
    width: a.width + (b.width - a.width) * u,
    tx: tan.x,
    tz: tan.z,
    
    
    
    
    nx: tan.z,
    nz: -tan.x,
    heading: Math.atan2(tan.x, tan.z),
  };
}













export function nearestOnPath(path, x, z, hint = null, window = 40) {
  let bestI = 0; let bestD = Infinity;
  const scan = (i) => {
    const j = ((i % path.count) + path.count) % path.count;
    const p = path.pts[j];
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < bestD) { bestD = d; bestI = j; }
  };
  if (hint === null || hint === undefined) {
    for (let i = 0; i < path.count; i += 1) scan(i);
  } else {
    for (let k = -window; k <= window; k += 1) scan(hint + k);
  }

  
  
  
  
  const a = path.pts[bestI];
  const b = path.pts[(bestI + 1) % path.count];
  const abx = b.x - a.x; const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz || 1e-9;
  let u = ((x - a.x) * abx + (z - a.z) * abz) / len2;
  if (u < 0) u = 0;
  if (u > 1) u = 1;
  const px = a.x + abx * u;
  const pz = a.z + abz * u;
  const tan = path.tangents[bestI];
  return {
    index: bestI,
    s: path.s[bestI] + Math.sqrt(len2) * u,
    x: px,
    z: pz,
    y: (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * u,
    width: a.width + (b.width - a.width) * u,
    tx: tan.x,
    tz: tan.z,
    nx: tan.z,
    nz: -tan.x,
    heading: Math.atan2(tan.x, tan.z),
    
    lateral: (x - px) * tan.z + (z - pz) * -tan.x,
    dist: Math.hypot(x - px, z - pz),
  };
}










export function trackSurface(path, x, z, hint = null, { shoulder = 7 } = {}) {
  const near = nearestOnPath(path, x, z, hint);
  const half = near.width / 2;
  const over = near.dist - half;
  const onRoad = over <= 0;
  const onShoulder = !onRoad && over <= shoulder;
  return {
    ...near,
    onRoad,
    onShoulder,
    lost: !onRoad && !onShoulder,
    
    
    gripScale: onRoad ? 1 : Math.max(0.35, 1 - (over / Math.max(shoulder, 1e-6)) * 0.65),
    overBy: Math.max(0, over),
  };
}











export function startGrid(path, count, { startS = 0, rowGap = 5.5, laneGap = 0.26 } = {}) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / 2);
    const side = i % 2 === 0 ? 1 : -1;
    const back = rowGap * row + (side < 0 ? rowGap * 0.45 : 0);
    const c = sampleAt(path, startS - back);
    const off = c.width * laneGap * side;
    out.push({
      x: c.x + c.nx * off,
      y: c.y,
      z: c.z + c.nz * off,
      heading: c.heading,
      s: c.s,
      slot: i,
    });
  }
  return out;
}






export function checkpointRing(path, count) {
  const out = [];
  for (let i = 0; i < count; i += 1) out.push((path.length * i) / count);
  return out;
}
