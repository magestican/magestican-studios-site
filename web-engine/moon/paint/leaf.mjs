














import { SeededRng } from '../../rng/seededRng.js';





export const SURFACE = { roughness: 0.82, metalness: 0, doubleSide: false, alphaTest: 0.5, size: 512 };

export const ATLAS = Object.freeze({
  band: Object.freeze({ v0: 0.01, v1: 0.49 }),
  
  cells: Object.freeze([
    Object.freeze({ u0: 0.0, v0: 0.5, u1: 0.5, v1: 1.0, anchor: 0.5 }),
    Object.freeze({ u0: 0.5, v0: 0.5, u1: 1.0, v1: 1.0, anchor: 0.2 }),
  ]),
});

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };


export function canvas(size) {
  return { size, val: new Float32Array(size * size).fill(0.8), alpha: new Float32Array(size * size), warm: new Float32Array(size * size) };
}





export function leaf(cv, { bx, by, a, len, wid, tone = 1, rect, wrap = false, shadow = 0.28, quiet = false }) {
  const { size, val, alpha } = cv;
  const ca = Math.cos(a), sa = Math.sin(a);
  const reach = len + wid;
  const cx = bx + ca * len * 0.5, cy = by + sa * len * 0.5;
  const pass = (ox, oy, grow, fn) => {
    for (let y = Math.floor(cy - reach); y <= Math.ceil(cy + reach); y++) {
      for (let x = Math.floor(cx - reach); x <= Math.ceil(cx + reach); x++) {
        let px = x, py = y;
        if (wrap) {
          px = rect.x0 + (((x - rect.x0) % rect.w) + rect.w) % rect.w;
          py = rect.y0 + (((y - rect.y0) % rect.h) + rect.h) % rect.h;
        } else if (x < rect.x0 || y < rect.y0 || x >= rect.x0 + rect.w || y >= rect.y0 + rect.h) continue;
        const dx = x + 0.5 - bx - ox, dy = y + 0.5 - by - oy;
        const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        const t = lx / len;
        if (t < -0.02 || t > 1.02) continue;
        const tt = clamp(t, 0, 1);
        const w = (wid / 2) * Math.sin(Math.PI * tt ** 0.8) ** 0.85 + grow;
        const cov = clamp(w - Math.abs(ly) + 0.5, 0, 1) * clamp((1.02 - t) * len, 0, 1);
        if (cov <= 0) continue;
        fn(py * size + px, cov, tt, ly, w);
      }
    }
  };
  if (shadow > 0) pass(1.5, -2.5, 1.5, (i, cov) => { val[i] *= 1 - shadow * cov; });
  pass(0, 0, 0, (i, cov, t, ly, w) => {
    const e = w > 0 ? (w - Math.abs(ly)) / w : 0;
    let v = tone * (0.8 + 0.2 * smooth(0, 0.7, t));
    v *= ly > 0 ? 1 : 0.88;
    v *= 1 - 0.16 * (1 - smooth(0, 0.3, e));
    if (!quiet) v += 0.03 * smooth(0.25, 0.05, Math.abs(e - 0.3)) * (ly > 0 ? 1 : 0);
    const rib = Math.abs(ly);
    if (rib < 1.1 && t < 0.92) v *= quiet ? 0.93 : 0.84;
    else if (rib < 2.2 && t < 0.92 && !quiet) v *= 1.04;
    const vein = Math.abs((((t * len - Math.abs(ly) * 1.1) / (len / 5)) % 1) - 0.5);
    if (!quiet && vein < 0.05 && e > 0.12 && t > 0.1 && t < 0.9) v *= 0.93;
    val[i] = val[i] * (1 - cov) + clamp(v, 0.35, 1) * cov;
    alpha[i] = Math.max(alpha[i], cov);
  });
}

export function toImage(cv) {
  const { size, val, alpha, warm } = cv;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = clamp(val[i], 0, 1), w = warm[i];
    data[i * 4] = Math.round(v * 255);
    data[i * 4 + 1] = Math.round(v * (1 - 0.1 * w) * 255);
    data[i * 4 + 2] = Math.round(v * (1 - 0.35 * w) * 255);
    data[i * 4 + 3] = Math.round(clamp(alpha[i], 0, 1) * 255);
  }
  return { width: size, height: size, data };
}

export function bandRect(size) {
  return { x0: 0, y0: 0, w: size, h: size / 2 };
}

export function cellRect(size, cell, margin = 6) {
  const x0 = Math.round(cell.u0 * size) + margin, y0 = Math.round(cell.v0 * size) + margin;
  return { x0, y0, w: Math.round((cell.u1 - cell.u0) * size) - margin * 2, h: Math.round((cell.v1 - cell.v0) * size) - margin * 2 };
}

export function paint({ size = 512 } = {}) {
  const s = size / 512;
  const cv = canvas(size);
  const rng = new SeededRng(4471);
  const band = bandRect(size);
  for (let y = band.y0; y < band.y0 + band.h; y++) {
    for (let x = 0; x < size; x++) { cv.val[y * size + x] = 0.87; cv.alpha[y * size + x] = 1; }
  }
  
  
  for (let y = band.h; y < size; y++) for (let x = 0; x < size; x++) cv.val[y * size + x] = 0.74;
  
  
  for (let k = 0; k < 120; k++) {
    const len = rng.rangeF(46, 64) * s;
    leaf(cv, {
      bx: rng.rangeF(0, band.w), by: rng.rangeF(0, band.h), a: -Math.PI / 2 + rng.rangeF(-1.25, 1.25),
      len, wid: len * rng.rangeF(0.6, 0.7), tone: rng.rangeF(0.95, 1.02), rect: band, wrap: true, shadow: 0.05, quiet: true,
    });
  }
  
  
  {
    const r = cellRect(size, ATLAS.cells[0]);
    const cx = r.x0 + r.w / 2, cy = r.y0 + r.h / 2;
    const outer = 14;
    const a0 = rng.rangeF(0, Math.PI * 2);
    for (let k = 0; k < outer; k++) {
      const a = a0 + (k / outer) * Math.PI * 2 + rng.rangeF(-0.15, 0.15);
      const len = r.w * rng.rangeF(0.3, 0.42);
      leaf(cv, { bx: cx + Math.cos(a) * r.w * 0.05, by: cy + Math.sin(a) * r.w * 0.05, a, len, wid: len * rng.rangeF(0.5, 0.6), tone: rng.rangeF(0.8, 0.92), rect: r, shadow: 0.18 });
    }
    for (let k = 0; k < 9; k++) {
      const a = rng.rangeF(0, Math.PI * 2);
      const len = r.w * rng.rangeF(0.2, 0.3);
      leaf(cv, { bx: cx + rng.rangeF(-0.06, 0.06) * r.w, by: cy + rng.rangeF(-0.06, 0.06) * r.w, a, len, wid: len * 0.56, tone: rng.rangeF(0.9, 1), rect: r, shadow: 0.2 });
    }
  }
  
  {
    const r = cellRect(size, ATLAS.cells[1]);
    const bx = r.x0 + r.w / 2, by = r.y0 + r.h * 0.08;
    const n = 13;
    const order = [];
    for (let k = 0; k < n; k++) {
      const f = (k / (n - 1)) * 2 - 1;
      order.push({ f, z: -Math.abs(f) + rng.rangeF(-0.3, 0.3) });
    }
    order.sort((p, q) => p.z - q.z);
    for (const { f } of order) {
      const along = (1 - Math.abs(f)) * rng.rangeF(0.1, 0.4) + rng.rangeF(0, 0.1);
      const len = r.h * rng.rangeF(0.34, 0.46) * (1 - 0.2 * Math.abs(f));
      const a = Math.PI / 2 + f * 1.35 + rng.rangeF(-0.1, 0.1);
      leaf(cv, { bx: bx + f * r.w * 0.05, by: by + along * r.h, a, len, wid: len * rng.rangeF(0.5, 0.58), tone: rng.rangeF(0.84, 1), rect: r, shadow: 0.2 });
    }
  }
  return toImage(cv);
}
