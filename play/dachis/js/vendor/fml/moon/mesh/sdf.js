






















const WHITE = Object.freeze([1, 1, 1]);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function leaf(d, b) {
  return { d, s: (x, y, z) => ({ d: d(x, y, z), c: WHITE, m: null }), b };
}

const bound = (c, r, f = 1) => ({ c, r, f });




export function field(fn) {
  return leaf(fn);
}

export function sphere([cx, cy, cz], r) {
  return leaf((x, y, z) => {
    const X = x - cx, Y = y - cy, Z = z - cz;
    return Math.sqrt(X * X + Y * Y + Z * Z) - r;
  }, bound([cx, cy, cz], r));
}



export function ellipsoid([cx, cy, cz], [rx, ry, rz]) {
  const ix = 1 / rx, iy = 1 / ry, iz = 1 / rz;
  const ix2 = ix * ix, iy2 = iy * iy, iz2 = iz * iz;
  const rmin = Math.min(rx, ry, rz), rmax = Math.max(rx, ry, rz);
  return leaf((x, y, z) => {
    const X = x - cx, Y = y - cy, Z = z - cz;
    const a = X * ix, b = Y * iy, c = Z * iz;
    const k0 = Math.sqrt(a * a + b * b + c * c);
    const e = X * ix2, f = Y * iy2, g = Z * iz2;
    const k1 = Math.sqrt(e * e + f * f + g * g);
    return k1 < 1e-12 ? -rmin : (k0 * (k0 - 1)) / k1;
  }, bound([cx, cy, cz], rmax, rmin / rmax));
}


export function roundCone([ax, ay, az], [bx, by, bz], ra, rb = ra) {
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  if (l2 < 1e-12) return sphere([ax, ay, az], Math.max(ra, rb));
  const rr = ra - rb;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const srr = Math.sign(rr) * rr * rr;
  const b = bound([(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2], Math.sqrt(l2) / 2 + Math.max(ra, rb));
  return leaf((x, y, z) => {
    const pax = x - ax, pay = y - ay, paz = z - az;
    const yy = pax * bax + pay * bay + paz * baz;
    const zz = yy - l2;
    const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
    const x2 = qx * qx + qy * qy + qz * qz;
    const y2 = yy * yy * l2;
    const z2 = zz * zz * l2;
    const k = srr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - ra;
  }, b);
}

export function capsule(a, b, r) {
  return roundCone(a, b, r, r);
}


export function roundBox([cx, cy, cz], [hx, hy, hz], r) {
  return leaf((x, y, z) => {
    const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r;
    const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0;
    const inside = Math.min(Math.max(qx, qy, qz), 0);
    return Math.sqrt(ox * ox + oy * oy + oz * oz) + inside - r;
  }, bound([cx, cy, cz], Math.hypot(hx, hy, hz)));
}


export function torus([cx, cy, cz], R, r) {
  return leaf((x, y, z) => {
    const X = x - cx, Z = z - cz, Y = y - cy;
    const q = Math.sqrt(X * X + Z * Z) - R;
    return Math.sqrt(q * q + Y * Y) - r;
  }, bound([cx, cy, cz], R + r));
}



export function roundCylinder([cx, cy, cz], ra, rb, h, e) {
  return leaf((x, y, z) => {
    const X = x - cx, Y = y - cy, Z = z - cz;
    const t = clamp01((Y + h) / (2 * h));
    const rad = ra + (rb - ra) * t - e;
    const dx = Math.sqrt(X * X + Z * Z) - rad;
    const dy = Math.abs(Y) - h + e;
    const ox = dx > 0 ? dx : 0, oy = dy > 0 ? dy : 0;
    return Math.min(Math.max(dx, dy), 0) + Math.sqrt(ox * ox + oy * oy) - e;
  }, bound([cx, cy, cz], Math.hypot(Math.max(ra, rb), h), 0.9));
}


export function plane([nx, ny, nz], o = 0) {
  const l = Math.hypot(nx, ny, nz);
  const a = nx / l, b = ny / l, c = nz / l, oo = o / l;
  return leaf((x, y, z) => a * x + b * y + c * z - oo);
}




export function rotationMatrix([rx, ry, rz]) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
}

export function applyRotation(R, [x, y, z]) {
  return [R[0] * x + R[1] * y + R[2] * z, R[3] * x + R[4] * y + R[5] * z, R[6] * x + R[7] * y + R[8] * z];
}




export function transform(node, { translate = [0, 0, 0], rotate = [0, 0, 0], scale = 1 } = {}) {
  const [tx, ty, tz] = translate;
  const R = rotationMatrix(rotate);
  const [sx, sy, sz] = typeof scale === 'number' ? [scale, scale, scale] : scale;
  const smin = Math.min(sx, sy, sz), smax = Math.max(sx, sy, sz);
  const isx = 1 / sx, isy = 1 / sy, isz = 1 / sz;
  
  const m0 = R[0] * isx, m1 = R[3] * isx, m2 = R[6] * isx;
  const m3 = R[1] * isy, m4 = R[4] * isy, m5 = R[7] * isy;
  const m6 = R[2] * isz, m7 = R[5] * isz, m8 = R[8] * isz;
  let b;
  if (node.b) {
    const c = node.b.c;
    const w = applyRotation(R, [c[0] * sx, c[1] * sy, c[2] * sz]);
    b = bound([w[0] + tx, w[1] + ty, w[2] + tz], node.b.r * smax, (node.b.f * smin) / smax);
  }
  return {
    d: (x, y, z) => {
      const X = x - tx, Y = y - ty, Z = z - tz;
      return node.d(m0 * X + m1 * Y + m2 * Z, m3 * X + m4 * Y + m5 * Z, m6 * X + m7 * Y + m8 * Z) * smin;
    },
    s: (x, y, z) => {
      const X = x - tx, Y = y - ty, Z = z - tz;
      const r = node.s(m0 * X + m1 * Y + m2 * Z, m3 * X + m4 * Y + m5 * Z, m6 * X + m7 * Y + m8 * Z);
      return { d: r.d * smin, c: r.c, m: r.m };
    },
    b,
  };
}




export function place(node, [ox, oy, oz], X, Y, Z) {
  let b;
  if (node.b) {
    const [a, e, g] = node.b.c;
    b = bound([ox + X[0] * a + Y[0] * e + Z[0] * g, oy + X[1] * a + Y[1] * e + Z[1] * g, oz + X[2] * a + Y[2] * e + Z[2] * g], node.b.r, node.b.f);
  }
  return {
    d: (x, y, z) => {
      const px = x - ox, py = y - oy, pz = z - oz;
      return node.d(px * X[0] + py * X[1] + pz * X[2], px * Y[0] + py * Y[1] + pz * Y[2], px * Z[0] + py * Z[1] + pz * Z[2]);
    },
    s: (x, y, z) => {
      const px = x - ox, py = y - oy, pz = z - oz;
      return node.s(px * X[0] + py * X[1] + pz * X[2], px * Y[0] + py * Y[1] + pz * Y[2], px * Z[0] + py * Z[1] + pz * Z[2]);
    },
    b,
  };
}


export function frameFromNormal(n, up = [0, 1, 0]) {
  const d = up[0] * n[0] + up[1] * n[1] + up[2] * n[2];
  let Y = [up[0] - n[0] * d, up[1] - n[1] * d, up[2] - n[2] * d];
  const l = Math.hypot(Y[0], Y[1], Y[2]) || 1;
  Y = [Y[0] / l, Y[1] / l, Y[2] / l];
  const X = [Y[1] * n[2] - Y[2] * n[1], Y[2] * n[0] - Y[0] * n[2], Y[0] * n[1] - Y[1] * n[0]];
  return { X, Y, Z: n };
}




export function warp(node, fn, pad = null) {
  return {
    d: (x, y, z) => { const q = fn(x, y, z); return node.d(q[0], q[1], q[2]); },
    s: (x, y, z) => { const q = fn(x, y, z); return node.s(q[0], q[1], q[2]); },
    b: node.b && pad !== null ? bound(node.b.c, node.b.r + pad, node.b.f * 0.8) : undefined,
  };
}



export function displace(node, fn, amp = null) {
  return {
    d: (x, y, z) => node.d(x, y, z) + fn(x, y, z),
    s: (x, y, z) => {
      const r = node.s(x, y, z);
      return { d: r.d + fn(x, y, z), c: r.c, m: r.m };
    },
    b: node.b && amp !== null ? bound(node.b.c, node.b.r + amp / node.b.f, node.b.f) : undefined,
  };
}

export function offset(node, o) {
  return displace(node, () => -o, Math.abs(o));
}


export function shell(node, t) {
  return {
    d: (x, y, z) => Math.abs(node.d(x, y, z)) - t,
    s: (x, y, z) => {
      const r = node.s(x, y, z);
      return { d: Math.abs(r.d) - t, c: r.c, m: r.m };
    },
    b: node.b ? bound(node.b.c, node.b.r + t / node.b.f, node.b.f) : undefined,
  };
}



export function paint(node, { color, material } = {}) {
  const fn = typeof color === 'function' ? color : null;
  return {
    d: node.d,
    s: (x, y, z) => {
      const r = node.s(x, y, z);
      return { d: r.d, c: fn ? fn(x, y, z, r.c) : color || r.c, m: material ?? r.m };
    },
    b: node.b,
  };
}



function smin(a, b, k) {
  const m = a < b ? a : b;
  if (k <= 0) return m;
  const h = k - Math.abs(a - b);
  return h <= 0 ? m : m - (h * h * 0.25) / k;
}

function weightA(a, b, k) {
  return k <= 0 ? (a <= b ? 1 : 0) : clamp01(0.5 + (0.5 * (b - a)) / k);
}

function mergeBounds(nodes, grow) {
  if (!nodes.every((n) => n.b)) return undefined;
  let c = nodes[0].b.c.slice(), r = nodes[0].b.r, f = nodes[0].b.f;
  for (const n of nodes.slice(1)) {
    const o = n.b.c;
    const d = Math.hypot(o[0] - c[0], o[1] - c[1], o[2] - c[2]);
    f = Math.min(f, n.b.f);
    if (d + n.b.r <= r) continue;
    if (d + r <= n.b.r) { c = o.slice(); r = n.b.r; continue; }
    const nr = (d + r + n.b.r) / 2;
    const t = (nr - r) / d;
    c = [c[0] + (o[0] - c[0]) * t, c[1] + (o[1] - c[1]) * t, c[2] + (o[2] - c[2]) * t];
    r = nr;
  }
  return bound(c, r + grow / f, f);
}




export function union(k, ...nodes) {
  nodes = nodes.flat();
  if (nodes.length === 1) return nodes[0];
  const n = nodes.length;
  
  
  const has = new Uint8Array(n), bx = new Float64Array(n), by = new Float64Array(n), bz = new Float64Array(n);
  const br = new Float64Array(n), bif = new Float64Array(n);
  nodes.forEach((c, i) => {
    if (!c.b || !(c.b.f > 0)) return;
    has[i] = 1; [bx[i], by[i], bz[i]] = c.b.c; br[i] = c.b.r; bif[i] = 1 / c.b.f;
  });
  const far = (i, x, y, z, acc) => {
    if (!has[i]) return false;
    const lim = (acc + k) * bif[i] + br[i];
    if (lim < 0) return true;
    const dx = x - bx[i], dy = y - by[i], dz = z - bz[i];
    return dx * dx + dy * dy + dz * dz > lim * lim;
  };
  return {
    d: (x, y, z) => {
      let acc = nodes[0].d(x, y, z);
      for (let i = 1; i < n; i++) {
        if (has[i]) {
          const lim = (acc + k) * bif[i] + br[i];
          if (lim < 0) continue;
          const dx = x - bx[i], dy = y - by[i], dz = z - bz[i];
          if (dx * dx + dy * dy + dz * dz > lim * lim) continue;
        }
        acc = smin(acc, nodes[i].d(x, y, z), k);
      }
      return acc;
    },
    s: (x, y, z) => {
      let acc = nodes[0].s(x, y, z);
      for (let i = 1; i < n; i++) {
        if (far(i, x, y, z, acc.d)) continue;
        const b = nodes[i].s(x, y, z);
        const w = weightA(acc.d, b.d, k);
        
        
        
        acc = { d: smin(acc.d, b.d, k), c: mix3(b.c, acc.c, w), m: w >= 0.5 ? acc.m : b.m };
      }
      return acc;
    },
    b: mergeBounds(nodes, Math.max(k, 0) / 4),
  };
}



export function subtract(k, a, b, { cutColor = false } = {}) {
  return {
    d: (x, y, z) => -smin(-a.d(x, y, z), b.d(x, y, z), k),
    s: (x, y, z) => {
      const ra = a.s(x, y, z);
      const rb = b.s(x, y, z);
      const d = -smin(-ra.d, rb.d, k);
      if (!cutColor) return { d, c: ra.c, m: ra.m };
      
      
      const w = weightA(ra.d, -rb.d, k);
      return { d, c: mix3(ra.c, rb.c, w), m: w >= 0.5 ? rb.m ?? ra.m : ra.m };
    },
    b: a.b,
  };
}

export function intersect(k, a, b) {
  return {
    d: (x, y, z) => -smin(-a.d(x, y, z), -b.d(x, y, z), k),
    s: (x, y, z) => {
      const ra = a.s(x, y, z);
      return { d: -smin(-ra.d, -b.d(x, y, z), k), c: ra.c, m: ra.m };
    },
    b: a.b,
  };
}




export function normalAt(node, x, y, z, e = 1e-3) {
  const a = node.d(x + e, y - e, z - e);
  const b = node.d(x - e, y - e, z + e);
  const c = node.d(x - e, y + e, z - e);
  const d = node.d(x + e, y + e, z + e);
  const gx = a - b - c + d, gy = -a - b + c + d, gz = -a + b - c + d;
  const l = Math.sqrt(gx * gx + gy * gy + gz * gz);
  return l < 1e-12 ? [0, 1, 0] : [gx / l, gy / l, gz / l];
}


export function projectToSurface(node, p, steps = 4) {
  let [x, y, z] = p;
  for (let i = 0; i < steps; i++) {
    const d = node.d(x, y, z);
    const n = normalAt(node, x, y, z);
    x -= n[0] * d; y -= n[1] * d; z -= n[2] * d;
  }
  return [x, y, z];
}



const CORNERS = [];
for (let i = 0; i < 8; i++) CORNERS.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
const EDGES = [];
for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) if (!(i & (1 << b))) EDGES.push([i, i | (1 << b)]);





export function polygonise(node, { min, max, cell, lipschitz = 1.5, project = true }) {
  const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
  const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
  const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
  const sxy = nx * ny;
  const vals = new Float32Array(nx * ny * nz);
  const active = new Uint8Array(nx * ny * nz);
  const B = 4;
  for (let bk = 0; bk < nz; bk += B) {
    const ek = Math.min(bk + B, nz);
    for (let bj = 0; bj < ny; bj += B) {
      const ej = Math.min(bj + B, ny);
      for (let bi = 0; bi < nx; bi += B) {
        const ei = Math.min(bi + B, nx);
        const ci = (bi + ei - 1) / 2, cj = (bj + ej - 1) / 2, ck = (bk + ek - 1) / 2;
        const dc = node.d(min[0] + ci * cell, min[1] + cj * cell, min[2] + ck * cell);
        const rad = Math.hypot(ei - 1 - ci, ej - 1 - cj, ek - 1 - ck) * cell;
        const far = Math.abs(dc) > (rad + 2 * cell) * lipschitz;
        for (let k = bk; k < ek; k++) {
          const z = min[2] + k * cell;
          for (let j = bj; j < ej; j++) {
            const y = min[1] + j * cell;
            let idx = bi + j * nx + k * sxy;
            for (let i = bi; i < ei; i++, idx++) {
              if (far) vals[idx] = dc;
              else { vals[idx] = node.d(min[0] + i * cell, y, z); active[idx] = 1; }
            }
          }
        }
      }
    }
  }

  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const cv = new Float64Array(8);
  const offs = CORNERS.map(([a, b, c]) => a + b * nx + c * sxy);
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const base = i + j * nx + k * sxy;
        if (!active[base]) continue;
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          cv[c] = vals[base + offs[c]];
          if (cv[c] < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, cnt = 0;
        for (const [a, b] of EDGES) {
          const ia = (mask >> a) & 1, ib = (mask >> b) & 1;
          if (ia === ib) continue;
          const t = cv[a] / (cv[a] - cv[b]);
          const A = CORNERS[a], Bc = CORNERS[b];
          sx += A[0] + (Bc[0] - A[0]) * t;
          sy += A[1] + (Bc[1] - A[1]) * t;
          sz += A[2] + (Bc[2] - A[2]) * t;
          cnt++;
        }
        let x = min[0] + (i + sx / cnt) * cell, y = min[1] + (j + sy / cnt) * cell, z = min[2] + (k + sz / cnt) * cell;
        if (project) {
          const d = node.d(x, y, z);
          const n = normalAt(node, x, y, z, cell * 0.25);
          const step = Math.max(-cell, Math.min(cell, d));
          x -= n[0] * step; y -= n[1] * step; z -= n[2] * step;
        }
        cellVert[base] = pos.length / 3;
        pos.push(x, y, z);
      }
    }
  }

  const idx = [];
  const quad = (a, b, c, d) => {
    const p = (v, o) => pos[v * 3 + o];
    const d1 = (p(a, 0) - p(c, 0)) ** 2 + (p(a, 1) - p(c, 1)) ** 2 + (p(a, 2) - p(c, 2)) ** 2;
    const d2 = (p(b, 0) - p(d, 0)) ** 2 + (p(b, 1) - p(d, 1)) ** 2 + (p(b, 2) - p(d, 2)) ** 2;
    if (d1 <= d2) idx.push(a, b, c, a, c, d);
    else idx.push(a, b, d, b, c, d);
  };
  for (let k = 1; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const p = i + j * nx + k * sxy;
        if (!active[p]) continue;
        const inside = vals[p] < 0;
        if (inside !== vals[p + 1] < 0) {
          const c00 = cellVert[p - nx - sxy], c10 = cellVert[p - sxy], c11 = cellVert[p], c01 = cellVert[p - nx];
          if (inside) quad(c00, c10, c11, c01); else quad(c00, c01, c11, c10);
        }
        if (inside !== vals[p + nx] < 0) {
          const a = cellVert[p - 1 - sxy], b = cellVert[p - 1], c = cellVert[p], d = cellVert[p - sxy];
          if (inside) quad(a, b, c, d); else quad(a, d, c, b);
        }
        if (inside !== vals[p + sxy] < 0) {
          const a = cellVert[p - 1 - nx], b = cellVert[p - nx], c = cellVert[p], d = cellVert[p - 1];
          if (inside) quad(a, b, c, d); else quad(a, d, c, b);
        }
      }
    }
  }
  return { positions: Float64Array.from(pos), indices: Uint32Array.from(idx) };
}






export function decimate(mesh, targetTris) {
  const P = Float64Array.from(mesh.positions);
  const F = Int32Array.from(mesh.indices);
  const nv = P.length / 3, nf = F.length / 3;
  if (nf <= targetTris) return { positions: P, indices: Uint32Array.from(F) };
  const Q = new Float64Array(nv * 10);
  const vf = Array.from({ length: nv }, () => []);
  const faceAlive = new Uint8Array(nf).fill(1);
  const vAlive = new Uint8Array(nv).fill(1);
  const ver = new Uint32Array(nv);

  let area = 0;
  for (let f = 0; f < nf; f++) {
    const a = F[f * 3], b = F[f * 3 + 1], c = F[f * 3 + 2];
    vf[a].push(f); vf[b].push(f); vf[c].push(f);
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
    let px = uy * wz - uz * wy, py = uz * wx - ux * wz, pz = ux * wy - uy * wx;
    const l = Math.sqrt(px * px + py * py + pz * pz);
    area += l / 2;
    if (l < 1e-18) continue;
    const w = l / 2;
    px /= l; py /= l; pz /= l;
    const d = -(px * P[a * 3] + py * P[a * 3 + 1] + pz * P[a * 3 + 2]);
    for (const v of [a, b, c]) {
      const o = v * 10;
      Q[o] += px * px * w; Q[o + 1] += px * py * w; Q[o + 2] += px * pz * w; Q[o + 3] += px * d * w;
      Q[o + 4] += py * py * w; Q[o + 5] += py * pz * w; Q[o + 6] += py * d * w;
      Q[o + 7] += pz * pz * w; Q[o + 8] += pz * d * w; Q[o + 9] += d * d * w;
    }
  }
  
  const lambda = (area / Math.max(targetTris, 1)) * 0.02;

  
  let cap = 1 << 16;
  let eCost = new Float64Array(cap), eA = new Int32Array(cap), eB = new Int32Array(cap);
  let eVA = new Uint32Array(cap), eVB = new Uint32Array(cap), eX = new Float64Array(cap), eY = new Float64Array(cap), eZ = new Float64Array(cap);
  let heap = new Int32Array(cap);
  let pool = 0, hsize = 0;
  const free = [];
  const grow = () => {
    const n = cap * 2;
    const g = (A, T) => { const r = new T(n); r.set(A); return r; };
    eCost = g(eCost, Float64Array); eA = g(eA, Int32Array); eB = g(eB, Int32Array);
    eVA = g(eVA, Uint32Array); eVB = g(eVB, Uint32Array); eX = g(eX, Float64Array); eY = g(eY, Float64Array); eZ = g(eZ, Float64Array);
    heap = g(heap, Int32Array);
    cap = n;
  };
  const heapPush = (id) => {
    let i = hsize++;
    const c = eCost[id];
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (eCost[heap[p]] <= c) break;
      heap[i] = heap[p]; i = p;
    }
    heap[i] = id;
  };
  const heapPop = () => {
    const top = heap[0];
    const last = heap[--hsize];
    if (hsize > 0) {
      const c = eCost[last];
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, mc = c;
        if (l < hsize && eCost[heap[l]] < mc) { m = l; mc = eCost[heap[l]]; }
        if (r < hsize && eCost[heap[r]] < mc) m = r;
        if (m === i) break;
        heap[i] = heap[m]; i = m;
      }
      heap[i] = last;
    }
    return top;
  };

  const QS = new Float64Array(10); 
  const evalS = (x, y, z) =>
    QS[0] * x * x + 2 * QS[1] * x * y + 2 * QS[2] * x * z + 2 * QS[3] * x
    + QS[4] * y * y + 2 * QS[5] * y * z + 2 * QS[6] * y + QS[7] * z * z + 2 * QS[8] * z + QS[9];
  const pushEdge = (a, b) => {
    for (let i = 0; i < 10; i++) QS[i] = Q[a * 10 + i] + Q[b * 10 + i];
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const bx = P[b * 3], by = P[b * 3 + 1], bz = P[b * 3 + 2];
    const mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2;
    let x = mx, y = my, z = mz;
    const A0 = QS[0], A1 = QS[1], A2 = QS[2], A4 = QS[4], A5 = QS[5], A7 = QS[7];
    const det = A0 * (A4 * A7 - A5 * A5) - A1 * (A1 * A7 - A5 * A2) + A2 * (A1 * A5 - A4 * A2);
    const len2 = (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2;
    let cost = 0;
    let ok = false;
    if (Math.abs(det) > 1e-14) {
      const r0 = -QS[3], r1 = -QS[6], r2 = -QS[8];
      const ox = (r0 * (A4 * A7 - A5 * A5) - A1 * (r1 * A7 - A5 * r2) + A2 * (r1 * A5 - A4 * r2)) / det;
      const oy = (A0 * (r1 * A7 - r2 * A5) - r0 * (A1 * A7 - A5 * A2) + A2 * (A1 * r2 - r1 * A2)) / det;
      const oz = (A0 * (A4 * r2 - A5 * r1) - A1 * (A1 * r2 - r1 * A2) + r0 * (A1 * A5 - A4 * A2)) / det;
      if ((ox - mx) ** 2 + (oy - my) ** 2 + (oz - mz) ** 2 <= len2) {
        x = ox; y = oy; z = oz; ok = true;
        cost = evalS(x, y, z);
      }
    }
    if (!ok) {
      const ca = evalS(ax, ay, az), cb = evalS(bx, by, bz), cm = evalS(mx, my, mz);
      cost = cm;
      if (ca < cost) { cost = ca; x = ax; y = ay; z = az; }
      if (cb < cost) { cost = cb; x = bx; y = by; z = bz; }
    }
    const id = free.length ? free.pop() : pool++;
    if (id >= cap) grow();
    eCost[id] = Math.max(cost, 0) + lambda * len2;
    eA[id] = a; eB[id] = b; eVA[id] = ver[a]; eVB[id] = ver[b];
    eX[id] = x; eY[id] = y; eZ[id] = z;
    heapPush(id);
  };

  
  
  
  
  for (let f = 0; f < nf; f++) {
    for (let e = 0; e < 3; e++) {
      const a = F[f * 3 + e], b = F[f * 3 + ((e + 1) % 3)];
      if (a < b) pushEdge(a, b);
    }
  }

  const markA = new Uint32Array(nv), markB = new Uint32Array(nv);
  let stamp = 0;
  let faces = nf;
  const nbrs = [];
  const faceOK = (f, a, b, x, y, z) => {
    const i0 = F[f * 3], i1 = F[f * 3 + 1], i2 = F[f * 3 + 2];
    const px = (v, o) => P[v * 3 + o];
    const ax = px(i0, 0), ay = px(i0, 1), az = px(i0, 2);
    const bx = px(i1, 0), by = px(i1, 1), bz = px(i1, 2);
    const cx = px(i2, 0), cy = px(i2, 1), cz = px(i2, 2);
    let ux = bx - ax, uy = by - ay, uz = bz - az, wx = cx - ax, wy = cy - ay, wz = cz - az;
    const n0x = uy * wz - uz * wy, n0y = uz * wx - ux * wz, n0z = ux * wy - uy * wx;
    const q = (v, o, orig) => (v === a || v === b ? (o === 0 ? x : o === 1 ? y : z) : orig);
    const Ax = q(i0, 0, ax), Ay = q(i0, 1, ay), Az = q(i0, 2, az);
    const Bx = q(i1, 0, bx), By = q(i1, 1, by), Bz = q(i1, 2, bz);
    const Cx = q(i2, 0, cx), Cy = q(i2, 1, cy), Cz = q(i2, 2, cz);
    ux = Bx - Ax; uy = By - Ay; uz = Bz - Az; wx = Cx - Ax; wy = Cy - Ay; wz = Cz - Az;
    const n1x = uy * wz - uz * wy, n1y = uz * wx - ux * wz, n1z = ux * wy - uy * wx;
    const l0 = Math.sqrt(n0x * n0x + n0y * n0y + n0z * n0z), l1 = Math.sqrt(n1x * n1x + n1y * n1y + n1z * n1z);
    return l1 > 1e-14 && n0x * n1x + n0y * n1y + n0z * n1z >= 0.2 * l0 * l1;
  };

  while (faces > targetTris && hsize) {
    const id = heapPop();
    free.push(id);
    const a = eA[id], b = eB[id];
    if (!vAlive[a] || !vAlive[b] || ver[a] !== eVA[id] || ver[b] !== eVB[id]) continue;
    stamp++;
    let degA = 0, degB = 0, common = 0, shared = 0;
    for (const f of vf[a]) {
      for (let i = 0; i < 3; i++) { const u = F[f * 3 + i]; if (u !== a && markA[u] !== stamp) { markA[u] = stamp; degA++; } }
    }
    if (markA[b] !== stamp) continue;
    for (const f of vf[b]) {
      let hasA = false;
      for (let i = 0; i < 3; i++) {
        const u = F[f * 3 + i];
        if (u === a) hasA = true;
        if (u !== b && markB[u] !== stamp) { markB[u] = stamp; degB++; if (markA[u] === stamp) common++; }
      }
      if (hasA) shared++;
    }
    if (common !== 2 || shared !== 2 || degA <= 3 || degB <= 3) continue;
    const x = eX[id], y = eY[id], z = eZ[id];
    let ok = true;
    for (const f of vf[a]) {
      const i0 = F[f * 3], i1 = F[f * 3 + 1], i2 = F[f * 3 + 2];
      if (i0 === b || i1 === b || i2 === b) continue;
      if (!faceOK(f, a, b, x, y, z)) { ok = false; break; }
    }
    if (ok) {
      for (const f of vf[b]) {
        const i0 = F[f * 3], i1 = F[f * 3 + 1], i2 = F[f * 3 + 2];
        if (i0 === a || i1 === a || i2 === a) continue;
        if (!faceOK(f, a, b, x, y, z)) { ok = false; break; }
      }
    }
    if (!ok) continue;

    P[a * 3] = x; P[a * 3 + 1] = y; P[a * 3 + 2] = z;
    for (let i = 0; i < 10; i++) Q[a * 10 + i] += Q[b * 10 + i];
    for (const f of vf[b]) {
      const i0 = F[f * 3], i1 = F[f * 3 + 1], i2 = F[f * 3 + 2];
      if (i0 === a || i1 === a || i2 === a) {
        faceAlive[f] = 0;
        faces--;
        for (const v of [i0, i1, i2]) {
          if (v === b) continue;
          const Lst = vf[v]; const at = Lst.indexOf(f); if (at >= 0) Lst.splice(at, 1);
        }
      } else {
        for (let i = 0; i < 3; i++) if (F[f * 3 + i] === b) F[f * 3 + i] = a;
        vf[a].push(f);
      }
    }
    vf[b] = [];
    vAlive[b] = 0;
    ver[a]++;
    stamp++;
    nbrs.length = 0;
    for (const f of vf[a]) {
      for (let i = 0; i < 3; i++) { const u = F[f * 3 + i]; if (u !== a && markA[u] !== stamp) { markA[u] = stamp; nbrs.push(u); } }
    }
    for (const u of nbrs) pushEdge(a, u);
  }

  const remap = new Int32Array(nv).fill(-1);
  const outP = [], outI = [];
  for (let f = 0; f < nf; f++) {
    if (!faceAlive[f]) continue;
    for (let i = 0; i < 3; i++) {
      const v = F[f * 3 + i];
      if (remap[v] < 0) { remap[v] = outP.length / 3; outP.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); }
      outI.push(remap[v]);
    }
  }
  return { positions: Float64Array.from(outP), indices: Uint32Array.from(outI) };
}





export function occlusion(scene, p, n, { reach = 0.16, strength = 1.6 } = {}) {
  let occ = 0, w = 1, total = 0;
  for (let i = 1; i <= 5; i++) {
    const h = (reach * i) / 5;
    const d = scene.d(p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h);
    occ += w * Math.max(0, h - d);
    total += w * h;
    w *= 0.6;
  }
  return clamp01(1 - (strength * occ) / total);
}






export function emit(md, mesh, node, {
  scene = node, material = 'fur', uvScale = 0.35, ao = {}, aoMin = 0.35, tint = null,
} = {}) {
  const nv = mesh.positions.length / 3;
  const norms = new Array(nv), cols = new Array(nv), mats = new Array(nv);
  const P = mesh.positions;
  for (let v = 0; v < nv; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    const s = node.s(x, y, z);
    const n = normalAt(node, x, y, z, 2e-3);
    const o = aoMin + (1 - aoMin) * occlusion(scene, [x, y, z], n, ao);
    let c = s.c;
    if (tint) c = tint(x, y, z, c, n);
    norms[v] = n;
    cols[v] = [c[0] * o, c[1] * o, c[2] * o];
    mats[v] = s.m || material;
  }
  const I = mesh.indices;
  const keyMap = new Map();
  const inv = 1 / uvScale;
  for (let f = 0; f < I.length; f += 3) {
    const a = I[f], b = I[f + 1], c = I[f + 2];
    const ma = mats[a], mb = mats[b], mc = mats[c];
    const mat = mb === mc ? mb : ma;
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
    const fx = Math.abs(uy * wz - uz * wy), fy = Math.abs(uz * wx - ux * wz), fz = Math.abs(ux * wy - uy * wx);
    const axis = fx >= fy && fx >= fz ? 0 : fy >= fz ? 1 : 2;
    const out = [a, b, c].map((v) => {
      const key = `${v}|${axis}|${mat}`;
      let i = keyMap.get(key);
      if (i === undefined) {
        const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
        const uv = axis === 0 ? [z * inv, y * inv] : axis === 1 ? [x * inv, z * inv] : [x * inv, y * inv];
        i = md.vertex(mat, [x, y, z], norms[v], cols[v], uv);
        keyMap.set(key, i);
      }
      return i;
    });
    md.tri(mat, out[0], out[1], out[2]);
  }
  return md;
}










export function sdfPart(md, node, { min, max, cell, targetTris, ...emitOpts }) {
  const fine = polygonise(node, { min, max, cell });
  const mesh = decimate(fine, targetTris);
  const P = mesh.positions;
  for (let v = 0; v < P.length; v += 3) {
    const d = node.d(P[v], P[v + 1], P[v + 2]);
    const n = normalAt(node, P[v], P[v + 1], P[v + 2], cell * 0.25);
    const step = Math.max(-cell, Math.min(cell, d));
    P[v] -= n[0] * step; P[v + 1] -= n[1] * step; P[v + 2] -= n[2] * step;
  }
  emit(md, mesh, node, emitOpts);
  return { fine: fine.indices.length / 3, tris: mesh.indices.length / 3 };
}
