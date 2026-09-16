














import { fbm3 } from '../noise.mjs';

export class Shape {
  constructor() {
    this.p = [];
    this.uv = [];
    this.tag = [];
    this.idx = [];
  }

  add(p, uv = [0, 0], tag = 1) {
    this.p.push([p[0], p[1], p[2]]);
    this.uv.push([uv[0], uv[1]]);
    this.tag.push(tag);
    return this.p.length - 1;
  }

  tri(a, b, c) {
    if (a === b || b === c || a === c) return;
    this.idx.push(a, b, c);
  }

  
  quad(a, b, c, d) {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  merge(other) {
    const base = this.p.length;
    for (let i = 0; i < other.p.length; i++) this.add(other.p[i], other.uv[i], other.tag[i]);
    for (const i of other.idx) this.idx.push(base + i);
    return this;
  }

  get triangleCount() {
    return this.idx.length / 3;
  }
}



export function transform(shape, m) {
  for (const p of shape.p) {
    const [x, y, z] = p;
    p[0] = m[0] * x + m[1] * y + m[2] * z + m[3];
    p[1] = m[4] * x + m[5] * y + m[6] * z + m[7];
    p[2] = m[8] * x + m[9] * y + m[10] * z + m[11];
  }
  if (det3(m) < 0) flipWinding(shape);
  return shape;
}

export function deform(shape, fn) {
  shape.p.forEach((p, i) => {
    const q = fn(p, i, shape.tag[i]);
    if (q) { p[0] = q[0]; p[1] = q[1]; p[2] = q[2]; }
  });
  return shape;
}


export function sag(shape, { along = 0, dir = 1, center = 0, half, amount }) {
  return deform(shape, (p) => {
    const t = (p[along] - center) / half;
    p[dir] -= amount * Math.max(0, 1 - t * t);
  });
}


export function bend(shape, { along = 1, dir = 0, from = 0, length = 1, amount }) {
  return deform(shape, (p) => {
    const t = (p[along] - from) / length;
    p[dir] += amount * t * t;
  });
}


export function taper(shape, { along = 1, axes = [0, 2], from, to, scaleFrom = 1, scaleTo, center = [0, 0, 0] }) {
  return deform(shape, (p) => {
    const t = Math.min(1, Math.max(0, (p[along] - from) / (to - from)));
    const s = scaleFrom + (scaleTo - scaleFrom) * t;
    for (const a of axes) p[a] = center[a] + (p[a] - center[a]) * s;
  });
}


export function roughen(shape, { amount, freq = 1, seed = 0, octaves = 3 }) {
  const n = computeNormals(shape);
  return deform(shape, (p, i) => {
    const d = (fbm3(p[0] * freq, p[1] * freq, p[2] * freq, { seed, octaves }) - 0.5) * 2 * amount;
    p[0] += n[i][0] * d; p[1] += n[i][1] * d; p[2] += n[i][2] * d;
  });
}



const keyOf = (p) => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)},${Math.round(p[2] * 1e4)}`;

export function computeNormals(shape) {
  const keys = shape.p.map(keyOf);
  const acc = new Map();
  const { p, idx } = shape;
  for (let t = 0; t < idx.length; t += 3) {
    const a = p[idx[t]], b = p[idx[t + 1]], c = p[idx[t + 2]];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    for (let k = 0; k < 3; k++) {
      const key = keys[idx[t + k]];
      const s = acc.get(key);
      if (s) { s[0] += n[0]; s[1] += n[1]; s[2] += n[2]; } else acc.set(key, n.slice());
    }
  }
  return keys.map((key) => {
    const s = acc.get(key);
    const len = s ? Math.hypot(s[0], s[1], s[2]) : 0;
    return len > 1e-14 ? [s[0] / len, s[1] / len, s[2] / len] : [0, 1, 0];
  });
}

const WHITE = [1, 1, 1];


export function emit(mesh, material, shape, { matrix = null, color = WHITE } = {}) {
  let s = shape;
  if (matrix) {
    s = new Shape().merge(shape);
    transform(s, matrix);
  }
  const normals = computeNormals(s);
  let base = -1;
  for (let i = 0; i < s.p.length; i++) {
    const c = typeof color === 'function' ? color(s.p[i], normals[i], s.uv[i], s.tag[i], i) : color;
    const idx = mesh.vertex(material, s.p[i], normals[i], [Math.max(0, c[0]), Math.max(0, c[1]), Math.max(0, c[2])], s.uv[i]);
    if (i === 0) base = idx;
  }
  for (let t = 0; t < s.idx.length; t += 3) mesh.tri(material, base + s.idx[t], base + s.idx[t + 1], base + s.idx[t + 2]);
  return mesh;
}






export function roundedBox({ size, radius, bevel = 1, segments = [1, 1, 1], grain = 0, uvScale = 1 }) {
  const half = size.map((s) => s / 2);
  const r = bevel > 0 ? Math.min(radius, ...half.map((h) => h * 0.98)) : 0;
  const samples = half.map((h, a) => axisSamples(h, r, bevel, Math.max(1, segments[a])));
  const s = new Shape();
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const sign of [1, -1]) {
      const grid = [];
      for (let i = 0; i < samples[b].length; i++) {
        const col = [];
        for (let j = 0; j < samples[c].length; j++) {
          const v = [0, 0, 0];
          v[a] = sign * half[a]; v[b] = samples[b][i]; v[c] = samples[c][j];
          const p = roundCorner(v, half, r);
          let u, w;
          if (c === grain) { u = p[c]; w = p[b]; } else { u = p[b]; w = p[c]; }
          col.push(s.add(p, [u * uvScale, w * uvScale]));
        }
        grid.push(col);
      }
      for (let i = 0; i + 1 < grid.length; i++) {
        for (let j = 0; j + 1 < grid[i].length; j++) {
          if (sign > 0) s.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
          else s.quad(grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]);
        }
      }
    }
  }
  return s;
}

function axisSamples(half, r, bevel, seg) {
  const inner = half - r, out = [];
  for (let k = bevel; k >= 1; k--) out.push(-(inner + r * Math.tan((Math.PI / 4) * (k / bevel))));
  for (let k = 0; k <= seg; k++) out.push(-inner + (2 * inner * k) / seg);
  for (let k = 1; k <= bevel; k++) out.push(inner + r * Math.tan((Math.PI / 4) * (k / bevel)));
  return out;
}

function roundCorner(v, half, r) {
  if (r <= 0) return v;
  const inner = v.map((x, k) => Math.max(-(half[k] - r), Math.min(half[k] - r, x)));
  const d = [v[0] - inner[0], v[1] - inner[1], v[2] - inner[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  return [inner[0] + (d[0] / len) * r, inner[1] + (d[1] / len) * r, inner[2] + (d[2] / len) * r];
}






export function lathe({ points, sides = 8, phase = 0, uvScale = 1, radiusFn = null }) {
  const s = new Shape();
  let arc = 0;
  const rMax = Math.max(...points.map((q) => q[0]), 1e-3);
  const rows = points.map(([r, y], j) => {
    if (j > 0) arc += Math.hypot(r - points[j - 1][0], y - points[j - 1][1]);
    if (r < 1e-6) {
      const pole = s.add([0, y, 0], [arc * uvScale, 0.5 * Math.PI * rMax * uvScale], 0);
      return new Array(sides + 1).fill(pole);
    }
    const row = [];
    for (let i = 0; i <= sides; i++) {
      const th = phase + (i / sides) * Math.PI * 2;
      const rr = radiusFn ? radiusFn(th, j, r, i % sides) : r;
      row.push(s.add([rr * Math.sin(th), y, rr * Math.cos(th)], [arc * uvScale, (i / sides) * Math.PI * 2 * rMax * uvScale], r / rMax));
    }
    if (radiusFn) s.p[row[sides]] = s.p[row[0]].slice();
    return row;
  });
  for (let j = 0; j + 1 < rows.length; j++) {
    for (let i = 0; i < sides; i++) s.quad(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]);
  }
  return s;
}


export function capsule({ radius, length, sides = 8, rings = 3, uvScale = 1 }) {
  const pts = [[0, 0]];
  for (let k = 1; k <= rings; k++) {
    const a = -Math.PI / 2 + (k / rings) * (Math.PI / 2);
    pts.push([radius * Math.cos(a), radius + radius * Math.sin(a)]);
  }
  for (let k = 0; k < rings; k++) {
    const a = (k / rings) * (Math.PI / 2);
    pts.push([radius * Math.cos(a), length - radius + radius * Math.sin(a)]);
  }
  pts.push([0, length]);
  return lathe({ points: pts, sides, uvScale });
}


export function roundedCylinder({ radius, height, bevel, sides = 8, bevelSegments = 2, rings = 1, uvScale = 1 }) {
  const b = Math.min(bevel, radius * 0.95, height * 0.49);
  const pts = [[0, 0]];
  for (let k = 0; k <= bevelSegments; k++) {
    const a = -Math.PI / 2 + (k / bevelSegments) * (Math.PI / 2);
    pts.push([radius - b + b * Math.cos(a), b + b * Math.sin(a)]);
  }
  for (let k = 1; k < rings; k++) pts.push([radius, b + ((height - 2 * b) * k) / rings]);
  for (let k = 0; k <= bevelSegments; k++) {
    const a = (k / bevelSegments) * (Math.PI / 2);
    pts.push([radius - b + b * Math.cos(a), height - b + b * Math.sin(a)]);
  }
  pts.push([0, height]);
  return lathe({ points: pts, sides, uvScale });
}













export function sweep({ profile, path, scales = 1, closed = false, caps = 'round', capSegments = 2, capLength = null, capRings = [0.8, 0.5], capProfile = null, up = [0, 1, 0], uvScale = 1 }) {
  let prof = profile.map((q) => q.slice());
  if (signedArea(prof) < 0) prof = prof.reverse();
  const M = prof.length;
  const cx = prof.reduce((a, q) => a + q[0], 0) / M, cy = prof.reduce((a, q) => a + q[1], 0) / M;
  const profV = [0];
  for (let k = 1; k <= M; k++) {
    const a = prof[k - 1], b = prof[k % M];
    profV.push(profV[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const explicitV = prof[0].length > 2;
  const vOf = (k) => {
    if (!explicitV) return profV[k];
    return k < M ? prof[k][2] : prof[M - 1][2] + (profV[M] - profV[M - 1]);
  };

  const n = path.length;
  const T = path.map((_, i) => {
    let a, b;
    if (closed) { a = path[(i - 1 + n) % n]; b = path[(i + 1) % n]; } else { a = path[Math.max(0, i - 1)]; b = path[Math.min(n - 1, i + 1)]; }
    return norm(sub(b, a));
  });
  const N = [];
  let n0 = sub(up, mul(T[0], dot(up, T[0])));
  if (Math.hypot(...n0) < 1e-6) n0 = sub([1, 0, 0], mul(T[0], T[0][0]));
  if (Math.hypot(...n0) < 1e-6) n0 = sub([0, 0, 1], mul(T[0], T[0][2]));
  N.push(norm(n0));
  for (let i = 1; i < n; i++) N.push(norm(sub(N[i - 1], mul(T[i], dot(N[i - 1], T[i])))));
  const B = T.map((t, i) => cross(t, N[i]));

  const dist = [0];
  for (let i = 1; i < n; i++) dist.push(dist[i - 1] + Math.hypot(...sub(path[i], path[i - 1])));
  const total = dist[n - 1] + (closed ? Math.hypot(...sub(path[0], path[n - 1])) : 0);
  const scaleAt = (i) => {
    const v = typeof scales === 'function' ? scales(total ? dist[i] / total : 0, i) : scales;
    return Array.isArray(v) ? v : [v, v];
  };

  const s = new Shape();
  const ring = (i, shrink, offset, tag, uOverride) => {
    const [sx, sy] = scaleAt(i);
    const origin = add(path[i], mul(T[i], offset));
    const row = [];
    for (let k = 0; k <= M; k++) {
      const q = prof[k % M];
      const [qx, qy] = capProfile && shrink !== 1 ? capProfile(q, shrink) : [cx + (q[0] - cx) * shrink, cy + (q[1] - cy) * shrink];
      const px = qx * sx, py = qy * sy;
      const pos = add(origin, add(mul(N[i], px), mul(B[i], py)));
      row.push(s.add(pos, [(uOverride ?? dist[i] + offset) * uvScale, vOf(k) * uvScale], tag));
    }
    return row;
  };
  const pole = (i, offset) => {
    const [sx, sy] = scaleAt(i);
    const pos = add(add(path[i], mul(T[i], offset)), add(mul(N[i], cx * sx), mul(B[i], cy * sy)));
    return new Array(M + 1).fill(s.add(pos, [(dist[i] + offset) * uvScale, 0], 0));
  };
  const [capA, capB] = Array.isArray(caps) ? caps : [caps, caps];
  const radius = capLength ?? Math.max(...prof.map((q) => Math.hypot(q[0] - cx, q[1] - cy))) * 0.6;
  const rows = [];
  const capRowsFor = (type, i, sign) => {
    const out = [];
    if (closed || type === 'none') return out;
    if (type === 'round') {
      for (let k = 1; k <= capSegments; k++) {
        const a = (Math.PI / 2) * (k / (capSegments + 1));
        out.push(ring(i, Math.cos(a), sign * radius * Math.sin(a), Math.cos(a)));
      }
      out.push(pole(i, sign * radius));
    } else {
      for (const f of capRings) out.push(ring(i, f, 0, f, dist[i] + sign * (1 - f) * 0.01));
      out.push(pole(i, 0));
    }
    return out;
  };
  rows.push(...capRowsFor(capA, 0, -1).reverse());
  for (let i = 0; i < n; i++) rows.push(ring(i, 1, 0, 1));
  if (closed) {
    const first = rows[rows.length - n];
    rows.push(first.map((idx) => s.add(s.p[idx], [total * uvScale, s.uv[idx][1]], 1)));
  }
  rows.push(...capRowsFor(capB, n - 1, 1));
  for (let j = 0; j + 1 < rows.length; j++) {
    for (let k = 0; k < M; k++) s.quad(rows[j][k], rows[j][k + 1], rows[j + 1][k + 1], rows[j + 1][k]);
  }
  return s;
}

export function roundedRectProfile(w, h, r, cornerSegments = 2) {
  const rr = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
  const pts = [];
  const corners = [[w / 2 - rr, h / 2 - rr, 0], [-w / 2 + rr, h / 2 - rr, 1], [-w / 2 + rr, -h / 2 + rr, 2], [w / 2 - rr, -h / 2 + rr, 3]];
  for (const [x, y, q] of corners) {
    for (let k = 0; k <= cornerSegments; k++) {
      
      const a = (q + (cornerSegments ? k / cornerSegments : 0.5)) * (Math.PI / 2);
      pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
  }
  return pts;
}

export function circleProfile(r, count = 8, phase = 0, ry = r) {
  const pts = [];
  for (let k = 0; k < count; k++) {
    const a = phase + (k / count) * Math.PI * 2;
    pts.push([r * Math.cos(a), ry * Math.sin(a)]);
  }
  return pts;
}


export function superellipseProfile(a, b, e = 4, count = 12, phase = Math.PI / 4) {
  const pts = [];
  for (let k = 0; k < count; k++) {
    const t = phase + (k / count) * Math.PI * 2;
    const c = Math.cos(t), sn = Math.sin(t);
    const r = 1 / Math.pow(Math.abs(c) ** e + Math.abs(sn) ** e, 1 / e);
    pts.push([a * r * c, b * r * sn]);
  }
  return pts;
}






export function blob({ radii = [1, 1, 1], subdiv = 3, seed = 0, lump = 0.12, lumpFreq = 1.3, flats = [], uvScale = 1 }) {
  const s = new Shape();
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const sign of [1, -1]) {
      const grid = [];
      for (let i = 0; i <= subdiv; i++) {
        const col = [];
        for (let j = 0; j <= subdiv; j++) {
          const v = [0, 0, 0];
          v[a] = sign;
          v[b] = Math.tan((Math.PI / 4) * (2 * i / subdiv - 1));
          v[c] = Math.tan((Math.PI / 4) * (2 * j / subdiv - 1));
          const d = norm(v);
          let p = mul(d, 1 + lump * (fbm3(d[0] * lumpFreq + 7.1, d[1] * lumpFreq, d[2] * lumpFreq, { seed, octaves: 3 }) - 0.5) * 2);
          for (const f of flats) {
            const h = dot(p, f.n);
            p = add(p, mul(f.n, smin(h, f.d, f.k ?? 0.15) - h));
          }
          p = [p[0] * radii[0], p[1] * radii[1], p[2] * radii[2]];
          col.push(s.add(p, [p[b] * uvScale, p[c] * uvScale]));
        }
        grid.push(col);
      }
      for (let i = 0; i < subdiv; i++) {
        for (let j = 0; j < subdiv; j++) {
          if (sign > 0) s.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
          else s.quad(grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]);
        }
      }
    }
  }
  return s;
}





export function surface({ us, vs, at, uv = (u, v) => [u, v], tag = () => 1 }) {
  const s = new Shape();
  const grid = us.map((u, i) => vs.map((v, j) => {
    const p = at(u, v, i, j);
    return s.add(p, uv(u, v, p, i, j), tag(u, v, i, j));
  }));
  for (let i = 0; i + 1 < us.length; i++) {
    for (let j = 0; j + 1 < vs.length; j++) s.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
  }
  return s;
}






export function splitShape(shape, pick) {
  const out = [new Shape(), new Shape()];
  const maps = [new Map(), new Map()];
  for (let t = 0; t < shape.idx.length; t += 3) {
    const tri = [shape.idx[t], shape.idx[t + 1], shape.idx[t + 2]];
    const b = pick(tri, t / 3) ? 1 : 0;
    const ids = tri.map((i) => {
      let j = maps[b].get(i);
      if (j === undefined) { j = out[b].add(shape.p[i], shape.uv[i], shape.tag[i]); maps[b].set(i, j); }
      return j;
    });
    out[b].tri(ids[0], ids[1], ids[2]);
  }
  return out;
}



export function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return s / 2;
}
function det3(m) {
  return m[0] * (m[5] * m[10] - m[6] * m[9]) - m[1] * (m[4] * m[10] - m[6] * m[8]) + m[2] * (m[4] * m[9] - m[5] * m[8]);
}
function flipWinding(shape) {
  for (let t = 0; t < shape.idx.length; t += 3) { const k = shape.idx[t + 1]; shape.idx[t + 1] = shape.idx[t + 2]; shape.idx[t + 2] = k; }
}
