













const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export const vec = { sub, add, mul, dot, cross, norm };



export function spline(points) {
  if (points.length < 2) throw new Error('spline needs at least 2 points');
  const P = [points[0], ...points, points[points.length - 1]];
  const segs = points.length - 1;
  const raw = (s) => {
    const x = Math.min(segs - 1e-9, Math.max(0, s * segs));
    const k = Math.floor(x), t = x - k;
    const p0 = P[k], p1 = P[k + 1], p2 = P[k + 2], p3 = P[k + 3];
    const t2 = t * t, t3 = t2 * t;
    const out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      out[i] = 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2
        + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3);
    }
    return out;
  };
  const N = segs * 48;
  const table = [0];
  let prev = raw(0);
  for (let i = 1; i <= N; i++) {
    const p = raw(i / N);
    table.push(table[i - 1] + Math.hypot(...sub(p, prev)));
    prev = p;
  }
  const length = table[N] || 1e-9;
  const param = (u) => {
    const target = Math.min(1, Math.max(0, u)) * length;
    let lo = 0, hi = N;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (table[mid] < target) lo = mid; else hi = mid; }
    const span = table[hi] - table[lo] || 1;
    return (lo + (target - table[lo]) / span) / N;
  };
  const at = (u) => raw(param(u));
  const tangent = (u) => {
    const e = 1e-3;
    return norm(sub(at(Math.min(1, u + e)), at(Math.max(0, u - e))));
  };
  return { at, tangent, length, points };
}



function frames(sp, ts, up) {
  const out = [];
  let T = sp.tangent(ts[0]);
  let seed = up || [1, 0, 0];
  if (Math.abs(dot(seed, T)) > 0.95) seed = [0, 0, 1];
  let N = norm(sub(seed, mul(T, dot(seed, T))));
  for (const t of ts) {
    T = sp.tangent(t);
    N = sub(N, mul(T, dot(N, T)));
    if (Math.hypot(...N) < 1e-6) N = norm(cross(T, [0, 1, 0.1]));
    N = norm(N);
    out.push({ T, N, B: cross(T, N) });
  }
  return out;
}












export function loft(mesh, material, opts) {
  const {
    points, sides = 8, rings = 6, radius = () => 0.1, distribution = 1, twist = 0,
    color = () => [1, 1, 1], vPerMetre = 1, uRepeat = 1, start = 'open', end = 'open', up,
  } = opts;
  if (rings < 2 || sides < 3) throw new Error('loft needs rings >= 2 and sides >= 3');
  const sp = spline(points);
  const ts = [];
  for (let i = 0; i < rings; i++) ts.push((i / (rings - 1)) ** distribution);
  const fr = frames(sp, ts, up);
  const centres = ts.map((t) => sp.at(t));
  const grid = [];
  for (let i = 0; i < rings; i++) {
    const row = [];
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2 + twist * ts[i];
      const r = Math.max(0, radius(ts[i], a));
      const { N, B } = fr[i];
      const dir = add(mul(N, Math.cos(a)), mul(B, Math.sin(a)));
      row.push({ p: add(centres[i], mul(dir, r)), dir, a });
    }
    grid.push(row);
  }
  const at = (i, j) => grid[Math.min(rings - 1, Math.max(0, i))][((j % sides) + sides) % sides].p;
  const idx = [];
  for (let i = 0; i < rings; i++) {
    const row = [];
    for (let j = 0; j <= sides; j++) {
      const g = grid[i][j];
      const dA = sub(at(i, j + 1), at(i, j - 1));
      const dT = sub(at(i + 1, j), at(i - 1, j));
      let n = cross(dA, dT);
      if (Math.hypot(...n) < 1e-10 || dot(n, g.dir) < -0.2) n = g.dir;
      n = norm(n);
      if (dot(n, g.dir) < 0) n = norm(add(n, mul(g.dir, 2 * Math.abs(dot(n, g.dir)))));
      row.push(mesh.vertex(material, g.p, n, color(ts[i], g.a, g.p), [(j / sides) * uRepeat, ts[i] * sp.length * vPerMetre]));
    }
    idx.push(row);
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = idx[i][j], b = idx[i][j + 1], c = idx[i + 1][j], d = idx[i + 1][j + 1];
      mesh.tri(material, a, b, c);
      mesh.tri(material, b, d, c);
    }
  }
  const capAt = (i, kind, outward) => {
    if (kind === 'open') return;
    const T = mul(fr[i].T, outward);
    const row = grid[i];
    const meanR = row.slice(0, sides).reduce((s, g) => s + Math.hypot(...sub(g.p, centres[i])), 0) / sides;
    const v = ts[i] * sp.length * vPerMetre;
    if (kind === 'point') {
      const tip = mesh.vertex(material, add(centres[i], mul(T, meanR * 0.6 + 1e-4)), T, color(ts[i], 0, centres[i]), [0.5 * uRepeat, v]);
      for (let j = 0; j < sides; j++) {
        if (outward > 0) mesh.tri(material, idx[i][j], idx[i][j + 1], tip);
        else mesh.tri(material, idx[i][j + 1], idx[i][j], tip);
      }
      return;
    }
    const centre = mesh.vertex(material, centres[i], T, color(ts[i], 0, centres[i]), [0.5 * uRepeat, v]);
    const ring = row.map((g) => mesh.vertex(material, g.p, T, color(ts[i], g.a, g.p), [(g.a / (Math.PI * 2)) * uRepeat, v]));
    for (let j = 0; j < sides; j++) {
      if (outward > 0) mesh.tri(material, ring[j], ring[j + 1], centre);
      else mesh.tri(material, ring[j + 1], ring[j], centre);
    }
  };
  capAt(0, start, -1);
  capAt(rings - 1, end, 1);
  return { spline: sp, ts, frames: fr, centres, ring: (i) => grid[i].slice(0, sides).map((g) => g.p) };
}






export function branchPoints(parent, t, dir, { length = 1, rise = 0.5, back = 0.08, bend = 0.2 } = {}) {
  const T = parent.tangent(t);
  const d = norm(sub(dir, mul(T, dot(dir, T))));
  const base = parent.at(Math.max(0, t - back));
  const root = parent.at(t);
  const p1 = add(root, add(mul(T, length * 0.12), mul(d, length * 0.08)));
  const out = norm(add(mul(d, 1 - rise), mul(T, rise)));
  const p2 = add(p1, mul(norm(add(mul(out, 1), mul(T, 0.25))), length * 0.45));
  const p3 = add(p2, add(mul(out, length * 0.45), [0, length * bend, 0]));
  return [base, p1, p2, p3];
}
