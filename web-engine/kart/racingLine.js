



































export function curvatureOf(path) {
  const n = path.count;
  const segLen = (i) => path.s[i + 1] - path.s[i];
  const k = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const prev = (i - 1 + n) % n;
    const a = path.tangents[prev];
    const b = path.tangents[(i + 1) % n];
    
    
    
    
    const cross = a.z * b.x - a.x * b.z;
    const dot = a.x * b.x + a.z * b.z;
    const dTheta = Math.atan2(cross, dot);
    
    
    
    
    const ds = segLen(prev) + segLen(i);
    k[i] = dTheta / Math.max(ds, 1e-3);
  }
  return k;
}


function smoothRing(values, window, passes) {
  const n = values.length;
  let cur = Float64Array.from(values);
  const half = Math.max(1, Math.round(window / 2));
  for (let p = 0; p < passes; p += 1) {
    const next = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let j = -half; j <= half; j += 1) sum += cur[((i + j) % n + n) % n];
      next[i] = sum / (half * 2 + 1);
    }
    cur = next;
  }
  return cur;
}













export function buildRacingLine(path, { margin = 2.6, latAccel = 20, smoothing = 9 } = {}) {
  const n = path.count;
  const k = curvatureOf(path);

  
  
  
  let peak = 1e-6;
  for (let i = 0; i < n; i += 1) peak = Math.max(peak, Math.abs(k[i]));
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const usable = Math.max(0, path.pts[i].width / 2 - margin);
    
    
    const strength = Math.sqrt(Math.min(1, Math.abs(k[i]) / peak));
    raw[i] = Math.sign(k[i]) * strength * usable;
  }

  
  
  
  
  
  
  
  
  
  
  const smoothed = smoothRing(raw, smoothing, 3);
  let rawPeak = 0; let smoothPeak = 0;
  for (let i = 0; i < n; i += 1) {
    rawPeak = Math.max(rawPeak, Math.abs(raw[i]));
    smoothPeak = Math.max(smoothPeak, Math.abs(smoothed[i]));
  }
  const rescale = smoothPeak > 1e-6 ? Math.min(4, (rawPeak * 0.92) / smoothPeak) : 1;
  const lateral = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    
    
    
    const usable = Math.max(0, path.pts[i].width / 2 - margin);
    lateral[i] = Math.max(-usable, Math.min(usable, smoothed[i] * rescale));
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const pos = new Array(n);
  for (let i = 0; i < n; i += 1) pos[i] = linePointAt({ lateral, path }, i);
  const lineK = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a = pos[(i - 1 + n) % n];
    const b = pos[i];
    const c = pos[(i + 1) % n];
    const abx = b.x - a.x; const abz = b.z - a.z;
    const bcx = c.x - b.x; const bcz = c.z - b.z;
    const lab = Math.hypot(abx, abz) || 1e-6;
    const lbc = Math.hypot(bcx, bcz) || 1e-6;
    const cross = (abz * bcx - abx * bcz) / (lab * lbc);
    const dot = (abx * bcx + abz * bcz) / (lab * lbc);
    lineK[i] = Math.atan2(cross, dot) / ((lab + lbc) / 2);
  }
  const smoothedK = smoothRing(lineK, 5, 2);

  const limit = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const kk = Math.abs(smoothedK[i]);
    limit[i] = kk < 1e-4 ? 999 : Math.sqrt(latAccel / kk);
  }

  
  
  
  
  
  
  const brakeAccel = 22;   
  const speed = Float64Array.from(limit);
  const segLen = (i) => path.s[i + 1] - path.s[i];
  for (let pass = 0; pass < 2; pass += 1) {
    for (let step = 0; step < n; step += 1) {
      const i = (n - 1 - step + n) % n;
      const j = (i + 1) % n;
      const ds = Math.max(0.1, segLen(i));
      
      const reachable = Math.sqrt(speed[j] * speed[j] + 2 * brakeAccel * ds);
      if (reachable < speed[i]) speed[i] = reachable;
    }
  }

  return { lateral, curvature: k, lineCurvature: smoothedK, speed, path };
}


export function linePointAt(line, i) {
  const n = line.path.count;
  const j = ((i % n) + n) % n;
  const p = line.path.pts[j];
  const t = line.path.tangents[j];
  const d = line.lateral[j];
  return { x: p.x + t.z * d, y: p.y, z: p.z - t.x * d, index: j };
}





export function lineAt(line, s) {
  const path = line.path;
  const n = path.count;
  const t = ((s % path.length) + path.length) % path.length;
  let lo = 0; let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (path.s[mid + 1] <= t) lo = mid + 1; else hi = mid;
  }
  const i = Math.min(lo, n - 1);
  const j = (i + 1) % n;
  const span = path.s[i + 1] - path.s[i] || 1e-9;
  const u = (t - path.s[i]) / span;
  const a = linePointAt(line, i);
  const b = linePointAt(line, j);
  const x = a.x + (b.x - a.x) * u;
  const z = a.z + (b.z - a.z) * u;
  const dx = b.x - a.x; const dz = b.z - a.z;
  return {
    x,
    z,
    y: path.pts[i].y + ((path.pts[j].y ?? 0) - (path.pts[i].y ?? 0)) * u,
    s: t,
    index: i,
    speed: line.speed[i] + (line.speed[j] - line.speed[i]) * u,
    heading: Math.atan2(dx, dz),
    curvature: line.lineCurvature[i],
  };
}
