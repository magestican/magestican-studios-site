





import { sdf, sdfNormal } from './form3d.js';

export const GRAVITY = -981;                    





export const K = { STRETCH: 0, SHEAR: 1, BEND: 2, SEAM: 3, BAND: 4 };
export const BAND_PASSES = 4;

export function createCloth(capacity = 4096) {
  return {
    n: 0,
    pos: new Float64Array(capacity * 3), prev: new Float64Array(capacity * 3), rest: new Float64Array(capacity * 3),
    w: new Float64Array(capacity),              
    thick: new Float64Array(capacity),          
    fric: new Float64Array(capacity),
    noArm: new Uint8Array(capacity),            
    cons: [],                                   
    tris: [],                                   
    panels: [],                                 
    teth: [],                                   
  };
}





export function addTether(c, i, a, max) { c.teth.push([i, a, max]); }




export function addStitch(c, i, j, k, t) { (c.st || (c.st = [])).push([i, j, k, t]); }
export function stitchGap(c, [i, j, k, t]) {
  const p = c.pos, s = 1 - t;
  return Math.hypot(p[i * 3] - s * p[j * 3] - t * p[k * 3], p[i * 3 + 1] - s * p[j * 3 + 1] - t * p[k * 3 + 1], p[i * 3 + 2] - s * p[j * 3 + 2] - t * p[k * 3 + 2]);
}
function stitches(c) {
  const { sti, stt, pos, w } = c;
  if (!sti) return;
  for (let q = 0; q < stt.length; q++) {
    const i = sti[q * 3], j = sti[q * 3 + 1], k = sti[q * 3 + 2], t = stt[q], s = 1 - t;
    const wsum = w[i] + s * s * w[j] + t * t * w[k];
    if (wsum === 0) continue;
    for (let a = 0; a < 3; a++) {
      const d = (pos[i * 3 + a] - s * pos[j * 3 + a] - t * pos[k * 3 + a]) / wsum;
      pos[i * 3 + a] -= w[i] * d; pos[j * 3 + a] += s * w[j] * d; pos[k * 3 + a] += t * w[k] * d;
    }
  }
}
function tethers(c) {
  const { ti, tm, pos } = c;
  if (!ti) return;
  for (let q = 0; q < tm.length; q++) {
    const i = ti[q * 2] * 3, a = ti[q * 2 + 1] * 3;
    const dx = pos[i] - pos[a], dy = pos[i + 1] - pos[a + 1], dz = pos[i + 2] - pos[a + 2];
    const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (l <= tm[q]) continue;
    const s = tm[q] / l;
    pos[i] = pos[a] + dx * s; pos[i + 1] = pos[a + 1] + dy * s; pos[i + 2] = pos[a + 2] + dz * s;
  }
}

export function addParticle(c, x, y, z, { mass = 1, thick = 0.3, fric = 0.6, noArms = false } = {}) {
  const i = c.n++;
  if (i >= c.w.length) throw new Error('cloth capacity exceeded');
  c.pos[i * 3] = c.prev[i * 3] = c.rest[i * 3] = x;
  c.pos[i * 3 + 1] = c.prev[i * 3 + 1] = c.rest[i * 3 + 1] = y;
  c.pos[i * 3 + 2] = c.prev[i * 3 + 2] = c.rest[i * 3 + 2] = z;
  c.w[i] = mass > 0 ? 1 / mass : 0; c.thick[i] = thick; c.fric[i] = fric; c.noArm[i] = noArms ? 1 : 0;
  return i;
}

export const dist = (c, i, j) => Math.hypot(c.pos[i * 3] - c.pos[j * 3], c.pos[i * 3 + 1] - c.pos[j * 3 + 1], c.pos[i * 3 + 2] - c.pos[j * 3 + 2]);





export function addConstraint(c, i, j, kind, stiff, rest = null, scale = 1, slack = false) {
  const r = rest == null ? dist(c, i, j) * scale : rest;
  c.cons.push([i, j, slack ? -r : r, stiff, kind]);
}


export function finalize(c) {
  const m = c.cons.length;
  c.ci = new Int32Array(m * 2); c.cr = new Float64Array(m); c.ck = new Float64Array(m); c.cs = new Float64Array(m);
  c.cons.sort((p, q) => p[4] - q[4]);
  c.cons.forEach(([i, j, r, k], n) => { c.ci[n * 2] = i; c.ci[n * 2 + 1] = j; c.cr[n] = r; c.ck[n] = k; });
  c.m = m;
  c.band0 = m; while (c.band0 > 0 && c.cons[c.band0 - 1][4] === K.BAND) c.band0--;
  if (c.teth.length) {
    c.ti = new Int32Array(c.teth.length * 2); c.tm = new Float64Array(c.teth.length);
    c.teth.forEach(([i, a, l], n) => { c.ti[n * 2] = i; c.ti[n * 2 + 1] = a; c.tm[n] = l; });
  }
  if (c.st) {
    c.sti = new Int32Array(c.st.length * 3); c.stt = new Float64Array(c.st.length);
    c.st.forEach(([i, j, k, t], n) => { c.sti[n * 3] = i; c.sti[n * 3 + 1] = j; c.sti[n * 3 + 2] = k; c.stt[n] = t; });
  }
  return c;
}



export function step(c, dt, { form = null, iters = 10, damping = 0.98, wind = null, arms = true, floor = 0 } = {}) {
  const { pos, prev, w, n } = c;
  const g = GRAVITY * dt * dt;
  const wx = wind ? wind[0] * dt * dt : 0, wy = wind ? wind[1] * dt * dt : 0, wz = wind ? wind[2] * dt * dt : 0;
  
  for (let i = 0; i < n; i++) {
    if (w[i] === 0) continue;
    const k = i * 3;
    const vx = (pos[k] - prev[k]) * damping, vy = (pos[k + 1] - prev[k + 1]) * damping, vz = (pos[k + 2] - prev[k + 2]) * damping;
    prev[k] = pos[k]; prev[k + 1] = pos[k + 1]; prev[k + 2] = pos[k + 2];
    pos[k] += vx + wx; pos[k + 1] += vy + g + wy; pos[k + 2] += vz + wz;
  }
  for (let it = 0; it < iters; it++) {
    solve(c, 0, c.m);
    for (let k = 0; k < BAND_PASSES; k++) solve(c, c.band0, c.m);
    stitches(c);
    tethers(c);
    if (form && (it & 1) === 1) collide(c, form, arms, false);
  }
  if (form) collide(c, form, arms, true);
  stitches(c);   
  if (floor != null) for (let i = 0; i < n; i++) if (pos[i * 3 + 1] < floor + 0.2) pos[i * 3 + 1] = floor + 0.2;
}

function solve(c, q0, q1) {
  const { ci, cr, ck, pos, w } = c;
  for (let q = q0; q < q1; q++) {
    const i = ci[q * 2], j = ci[q * 2 + 1];
    const wi = w[i], wj = w[j], ws = wi + wj;
    if (ws === 0) continue;
    const a = i * 3, b = j * 3;
    const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
    const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (l < 1e-9) continue;
    let r = cr[q];
    if (r < 0) { r = -r; if (l < r) continue; }       
    const s = (ck[q] * (l - r)) / (l * ws);
    pos[a] += dx * s * wi; pos[a + 1] += dy * s * wi; pos[a + 2] += dz * s * wi;
    pos[b] -= dx * s * wj; pos[b + 1] -= dy * s * wj; pos[b + 2] -= dz * s * wj;
  }
}

const NRM = [0, 0, 0, 1];
export const FRIC_S = 1.6;          




function collide(c, form, arms, friction) {
  const { pos, prev, w, thick, fric, noArm, n } = c;
  const far = c.far || (c.far = new Float64Array(c.w.length));
  for (let i = 0; i < n; i++) {
    if (w[i] === 0) continue;
    const k = i * 3, x = pos[k], y = pos[k + 1], z = pos[k + 2], t = thick[i];
    if (!friction && far[i] > t * 3 + 1.5) continue;
    const ar = arms && !noArm[i];
    let d = sdf(form, x, y, z, ar);
    if (friction) far[i] = d;
    if (d >= t * 3) continue;
    sdfNormal(form, x, y, z, ar, NRM);
    d /= Math.max(1, NRM[3]);
    if (d >= t) continue;
    const push = t - d;
    pos[k] = x + NRM[0] * push; pos[k + 1] = y + NRM[1] * push; pos[k + 2] = z + NRM[2] * push;
    if (friction && fric[i] > 0) {
      
      
      
      let vx = pos[k] - prev[k], vy = pos[k + 1] - prev[k + 1], vz = pos[k + 2] - prev[k + 2];
      const vn = vx * NRM[0] + vy * NRM[1] + vz * NRM[2];
      vx -= vn * NRM[0]; vy -= vn * NRM[1]; vz -= vn * NRM[2];
      const vt = Math.sqrt(vx * vx + vy * vy + vz * vz), mu = fric[i];
      const f = vt < mu * FRIC_S * push ? 1 : Math.min(1, (mu * push) / (vt || 1));
      pos[k] -= vx * f; pos[k + 1] -= vy * f; pos[k + 2] -= vz * f;
    }
  }
}


export function settle(c, opts = {}) {
  const { steps = 90, dt = 1 / 60, tol = 0.004, onStep = null, substeps = 1 } = opts;
  const sub = { ...opts, iters: Math.max(1, Math.round((opts.iters ?? 10) / substeps)) };
  let s = 0, moved = Infinity;
  for (; s < steps; s++) {
    for (let k = 0; k < substeps; k++) step(c, dt / substeps, sub);
    if (onStep) onStep(c, s);
    if (s > 20 && s % 5 === 0) {
      moved = 0;
      for (let i = 0; i < c.n * 3; i++) { const v = Math.abs(c.pos[i] - c.prev[i]); if (v > moved) moved = v; }
      if (moved < tol) { s++; break; }
    }
  }
  return { steps: s, moved };
}


export function normals(c, out = new Float32Array(c.n * 3)) {
  out.fill(0);
  const p = c.pos;
  for (const [a, b, d] of c.tris) {
    const ax = p[b * 3] - p[a * 3], ay = p[b * 3 + 1] - p[a * 3 + 1], az = p[b * 3 + 2] - p[a * 3 + 2];
    const bx = p[d * 3] - p[a * 3], by = p[d * 3 + 1] - p[a * 3 + 1], bz = p[d * 3 + 2] - p[a * 3 + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    for (const v of [a, b, d]) { out[v * 3] += nx; out[v * 3 + 1] += ny; out[v * 3 + 2] += nz; }
  }
  for (let i = 0; i < c.n; i++) {
    const l = Math.hypot(out[i * 3], out[i * 3 + 1], out[i * 3 + 2]) || 1;
    out[i * 3] /= l; out[i * 3 + 1] /= l; out[i * 3 + 2] /= l;
  }
  return out;
}


export function hashCloth(c) {
  let h = 2166136261;
  for (let i = 0; i < c.n * 3; i++) {
    const v = Math.round(c.pos[i] * 1000) | 0;
    h ^= v & 0xffff; h = Math.imul(h, 16777619); h ^= v >>> 16; h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
