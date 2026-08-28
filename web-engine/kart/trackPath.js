























































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


























export function buildPath(control, { samplesPerSegment = 14, defaultWidth = 16, branches = null } = {}) {
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

  const path = { pts, tangents, s, length: s[m], count: m, bounds: { minX, maxX, minZ, maxZ } };

  
  
  
  
  path.branches = [];
  for (const spec of branches ?? []) path.branches.push(buildBranch(path, spec));
  return path;
}





































































export function buildBranch(path, spec, { samplesPerSegment = 12 } = {}) {
  const entryS = wrapS(path, (spec.entryAt ?? 0) * path.length);
  const exitS = wrapS(path, (spec.exitAt ?? 0) * path.length);
  const a = sampleAt(path, entryS);
  const b = sampleAt(path, exitS);
  const lead = spec.lead ?? 8;
  const mouthA = {
    x: a.x + a.nx * ((spec.entryLateral ?? 0) * a.width * 0.5),
    z: a.z + a.nz * ((spec.entryLateral ?? 0) * a.width * 0.5),
  };
  const mouthB = {
    x: b.x + b.nx * ((spec.exitLateral ?? 0) * b.width * 0.5),
    z: b.z + b.nz * ((spec.exitLateral ?? 0) * b.width * 0.5),
  };
  
  
  
  
  
  
  const control = [
    { x: mouthA.x - a.tx * lead, z: mouthA.z - a.tz * lead },
    mouthA,
    ...(spec.via ?? []),
    mouthB,
    { x: mouthB.x + b.tx * lead, z: mouthB.z + b.tz * lead },
  ];

  const pts = [];
  for (let i = 1; i < control.length - 2; i += 1) {
    const p0 = control[i - 1]; const p1 = control[i];
    const p2 = control[i + 1]; const p3 = control[i + 2];
    for (let k = 0; k < samplesPerSegment; k += 1) {
      const u = k / samplesPerSegment;
      const p = splinePoint(p0, p1, p2, p3, u);
      pts.push({ x: p.x, y: p.y ?? 0, z: p.z });
    }
  }
  pts.push({ x: mouthB.x, y: b.y ?? 0, z: mouthB.z });

  
  
  
  
  
  
  const m = pts.length;
  const sArr = new Float64Array(m);
  const tangents = new Array(m);
  for (let i = 0; i < m - 1; i += 1) {
    const p = pts[i]; const q = pts[i + 1];
    const dx = q.x - p.x; const dz = q.z - p.z;
    const d = Math.hypot(dx, dz) || 1e-9;
    sArr[i + 1] = sArr[i] + d;
    tangents[i] = { x: dx / d, z: dz / d };
  }
  tangents[m - 1] = tangents[m - 2] ?? { x: 0, z: 1 };

  const length = sArr[m - 1];
  const mainArc = wrapS(path, exitS - entryS);
  return {
    id: spec.id,
    name: spec.name ?? spec.id,
    pts,
    tangents,
    s: sArr,
    count: m,
    length,
    width: spec.width ?? 9,
    shoulder: spec.shoulder ?? 2.5,
    grip: spec.grip ?? 0.8,
    entryS,
    exitS,
    
    
    
    
    
    saving: mainArc - length,
    mainArc,
  };
}












export function nearestOnBranch(branch, x, z) {
  let bestI = 0; let bestD = Infinity;
  for (let i = 0; i < branch.count; i += 1) {
    const p = branch.pts[i];
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < bestD) { bestD = d; bestI = i; }
  }
  const i = Math.min(bestI, branch.count - 2);
  const a = branch.pts[i]; const b = branch.pts[i + 1];
  const abx = b.x - a.x; const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz || 1e-9;
  let u = ((x - a.x) * abx + (z - a.z) * abz) / len2;
  if (u < 0) u = 0;
  if (u > 1) u = 1;
  const px = a.x + abx * u;
  const pz = a.z + abz * u;
  const at = branch.s[i] + Math.sqrt(len2) * u;
  return {
    index: i,
    x: px,
    z: pz,
    s: at,
    u: at / Math.max(branch.length, 1e-6),
    tx: branch.tangents[i].x,
    tz: branch.tangents[i].z,
    dist: Math.hypot(x - px, z - pz),
  };
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
  const out = {
    ...near,
    onRoad,
    onShoulder,
    lost: !onRoad && !onShoulder,
    
    
    
    
    
    
    gripScale: onRoad ? 1 : Math.max(0.6, 1 - (over / Math.max(shoulder, 1e-6)) * 0.4),
    overBy: Math.max(0, over),
    
    branch: null,
    branchU: 0,
  };
  if (!path.branches || path.branches.length === 0) return out;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let best = null;
  for (const br of path.branches) {
    const n = nearestOnBranch(br, x, z);
    const brOver = n.dist - br.width / 2;
    if (brOver > br.shoulder) continue;
    if (best === null || brOver < best.over) best = { br, n, over: brOver };
  }
  if (!best) return out;

  out.branch = best.br.id;
  out.branchU = best.n.u;
  
  
  
  
  
  if (onRoad) return out;

  const onBranch = best.over <= 0;
  out.onRoad = onBranch;
  out.onShoulder = !onBranch;
  out.lost = false;
  
  
  
  
  
  const fade = onBranch ? 1 : Math.max(0.45, 1 - (best.over / Math.max(best.br.shoulder, 1e-6)) * 0.55);
  out.gripScale = best.br.grip * fade;
  out.overBy = Math.max(0, best.over);
  return out;
}











export function branchAt(path, x, z, pad = 0) {
  for (const br of path.branches ?? []) {
    const n = nearestOnBranch(br, x, z);
    if (n.dist <= br.width / 2 + br.shoulder + pad) return br;
  }
  return null;
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
