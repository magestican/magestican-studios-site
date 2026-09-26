











import { formHalfWidth, bodyScale, HIP_Y } from './logic.js';

export const U = 0.4;                          
export const Y_TOP = 56, Y_NECK = 88, Y_BOT = 600, WAIST_Y = 226;
export const toY = (y) => (620 - y) * U;       
export const toDressY = (Y) => 620 - Y / U;



const DF = [[56, 14], [88, 14], [100, 16], [112, 18], [135, 26], [155, 30], [185, 25], [226, 20], [270, 23], [300, 25], [360, 24], [620, 22]];
const DB = [[56, 14], [88, 14], [100, 14.5], [112, 16], [140, 20], [185, 18], [226, 16], [270, 22], [300, 26], [360, 24], [620, 22]];


function lerpK(k, y) {
  if (y <= k[0][0]) return k[0][1];
  const n = k.length;
  if (y >= k[n - 1][0]) return k[n - 1][1];
  let i = 1; while (k[i][0] < y) i++;
  const sl = (j) => (k[j + 1][1] - k[j][1]) / (k[j + 1][0] - k[j][0]);
  const tan = (j) => {
    if (j === 0) return sl(0);
    if (j === n - 1) return sl(n - 2);
    const a = sl(j - 1), b = sl(j);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  };
  const x0 = k[i - 1][0], x1 = k[i][0], h = x1 - x0, t = (y - x0) / h;
  const h00 = 2 * t ** 3 - 3 * t * t + 1, h10 = t ** 3 - 2 * t * t + t, h01 = -2 * t ** 3 + 3 * t * t, h11 = t ** 3 - t * t;
  return h00 * k[i - 1][1] + h10 * h * tan(i - 1) + h01 * k[i][1] + h11 * h * tan(i);
}








export const ARM = { y0: 118, y1: 200, from: 170, r: 4.4, clear: 1.1, splay: 2.5 };
function armOf(form, sh) {
  const r = ARM.r * (1 + (sh - 1) * 0.6), Yt = toY(ARM.y0), Yb = toY(ARM.y1);
  const xt = section(form, ARM.y0).a + r * 0.5;
  let xb = xt + ARM.splay;
  for (let y = ARM.from; y <= ARM.y1; y += 2) {
    const need = section(form, y).a + r + ARM.clear, t = (y - ARM.y0) / (ARM.y1 - ARM.y0);
    xb = Math.max(xb, xt + (need - xt) / t);
  }
  return { top: [xt, Yt], bot: [xb, Yb], r };
}

const STEP = 0.5;                               
const N = Math.ceil((Y_BOT - Y_TOP) / STEP) + 1;
const cache = new Map();





const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const UNDER = {
  crinoline: (y) => { if (y < WAIST_Y + 4) return null; const t = Math.min(1, (y - WAIST_Y) / (548 - WAIST_Y)); const w = 34 + (148 - 34) * (1 - (1 - t) ** 2.1); return { a: w, f: w * 0.92, b: w * 0.95 }; },
  bustle: (y) => { const t = (y - 228) / 110; if (t <= 0 || t >= 1) return null; const k = Math.sin(Math.PI * t) ** 2; return { b: 16 + 38 * k }; },
  bubble: (y) => { const t = (y - 272) / 146; if (t <= 0 || t >= 1) return null; const w = 40 + 36 * Math.sin(Math.PI * t) ** 0.8; return { a: w, f: w * 0.82, b: w * 0.82 }; },
  
  petticoat: (y) => { if (y < WAIST_Y + 4 || y > 480) return null; const t = (y - WAIST_Y) / (480 - WAIST_Y); const w = 34 + 70 * (1 - (1 - t) ** 1.8); return { a: w, f: w * 0.9, b: w * 0.9 }; },
};
export const UNDER_OF = { ballgown: 'crinoline', odette: 'crinoline', bustle: 'bustle', bubble: 'bubble', tea: 'petticoat' };



export function formOf(id = 'classic', under = null) {
  const key = id + '|' + (under || '');
  if (cache.has(key)) return cache.get(key);
  const a = new Float64Array(N), f = new Float64Array(N), b = new Float64Array(N);
  const U2 = under && UNDER[under];
  for (let i = 0; i < N; i++) {
    const y = Y_TOP + i * STEP;
    const s = y <= Y_NECK ? 1 : bodyScale(id, y);
    const ds = 1 + (s - 1) * 0.85;
    a[i] = (y <= Y_NECK ? 14 : formHalfWidth(y)) * s * U;
    f[i] = lerpK(DF, y) * ds * U;
    b[i] = lerpK(DB, y) * ds * U;
    const x = U2 && U2(y);
    if (x) {
      const hs = 1 + (bodyScale(id, 300) - 1) * 0.8;          
      if (x.a) a[i] = Math.max(a[i], x.a * hs * U);
      if (x.f) f[i] = Math.max(f[i], x.f * hs * U);
      if (x.b) b[i] = Math.max(b[i], x.b * hs * U);
    }
  }
  const form = { id, under, a, f, b };
  form.arm = armOf(form, bodyScale(id, 112));
  cache.set(key, form);
  return form;
}


export function section(form, y) {
  const t = Math.min(N - 1, Math.max(0, (y - Y_TOP) / STEP)), i = Math.min(N - 2, Math.floor(t)), u = t - i;
  return { a: form.a[i] + (form.a[i + 1] - form.a[i]) * u, f: form.f[i] + (form.f[i + 1] - form.f[i]) * u, b: form.b[i] + (form.b[i + 1] - form.b[i]) * u };
}




function sdEllipse(px, pz, a, b) {
  const x0 = px / a, z0 = pz / b, x1 = x0 / a, z1 = z0 / b;
  const k0 = Math.sqrt(x0 * x0 + z0 * z0), k1 = Math.sqrt(x1 * x1 + z1 * z1);
  if (k1 < 1e-9) return -Math.min(a, b);
  return (k0 * (k0 - 1)) / k1;
}
function sdCapsule(px, py, pz, ax, ay, bx, by, r) {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const h = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  const ex = wx - vx * h, ey = wy - vy * h;
  return Math.sqrt(ex * ex + ey * ey + pz * pz) - r;
}


export function sdf(form, X, Y, Z, arms = true) {
  const y = 620 - Y / U;
  const yc = y < Y_TOP ? Y_TOP : y > Y_BOT ? Y_BOT : y;
  const t = (yc - Y_TOP) / STEP, i = t >= N - 1 ? N - 2 : t | 0, u = t - i;
  const sa = form.a[i] + (form.a[i + 1] - form.a[i]) * u;
  const sb = Z >= 0 ? form.f[i] + (form.f[i + 1] - form.f[i]) * u : form.b[i] + (form.b[i + 1] - form.b[i]) * u;
  const d2 = sdEllipse(X, Z, sa, sb);
  const v = y < Y_TOP ? (Y_TOP - y) * U : y > Y_BOT ? (y - Y_BOT) * U : -Math.min(y - Y_TOP, Y_BOT - y) * U;
  let d = v > 0 ? (d2 > 0 ? Math.sqrt(d2 * d2 + v * v) : v) : Math.max(d2, v);
  if (arms) {
    const A = form.arm, ax = X < 0 ? -X : X;
    if (ax > A.top[0] - A.r * 2 && Y < A.top[1] + A.r * 2 && Y > A.bot[1] - A.r * 2) d = Math.min(d, sdCapsule(ax, Y, Z, A.top[0], A.top[1], A.bot[0], A.bot[1], A.r));
  }
  return d;
}





export function sdfNormal(form, X, Y, Z, arms = true, out = [0, 0, 0, 1]) {
  const h = 0.02;
  const a = sdf(form, X + h, Y - h, Z - h, arms), b = sdf(form, X - h, Y - h, Z + h, arms);
  const c = sdf(form, X - h, Y + h, Z - h, arms), d = sdf(form, X + h, Y + h, Z + h, arms);
  const nx = a - b - c + d, ny = -a - b + c + d, nz = -a + b - c + d;
  const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  out[0] = nx / l; out[1] = ny / l; out[2] = nz / l; out[3] = l / (4 * h);
  return out;
}



const GN = [0, 0, 0, 1];
export function formDistance(form, X, Y, Z, arms = true) {
  const d = sdf(form, X, Y, Z, arms);
  sdfNormal(form, X, Y, Z, arms, GN);
  return d / Math.max(1, GN[3]);
}



export function surfacePoint(form, phi, y, off = 0) {
  const s = section(form, Math.min(Y_BOT, Math.max(Y_TOP, y)));
  const sn = Math.sin(phi), cs = Math.cos(phi), b = cs >= 0 ? s.f : s.b;
  let nx = sn / s.a, nz = cs / b; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
  return [s.a * sn + nx * off, toY(y), b * cs + nz * off];
}




export function formMesh(form, { rings = 72, segs = 48, yStart = Y_TOP, yEnd = 345 } = {}) {
  const pos = [], idx = [], uv = [];
  for (let r = 0; r <= rings; r++) {
    const y = yStart + (yEnd - yStart) * (r / rings) ** 1.15;
    for (let s = 0; s <= segs; s++) {
      const p = surfacePoint(form, (s / segs) * Math.PI * 2, y, 0);
      pos.push(p[0], p[1], p[2]); uv.push(s / segs, r / rings);
    }
  }
  for (let r = 0; r < rings; r++) for (let s = 0; s < segs; s++) {
    const i = r * (segs + 1) + s, j = i + segs + 1;
    idx.push(i, j, i + 1, i + 1, j, j + 1);
  }
  return { pos, idx, uv };
}

export { HIP_Y };
