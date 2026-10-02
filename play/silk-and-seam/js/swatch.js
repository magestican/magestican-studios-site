








import { fabricMaps, fabricSpec, hashBytes } from './fabrics.js';


export const SWATCH = { card: { cm: 6, fold: 0.5, max: 256 }, lamp: { cm: 12, fold: 0.8, lamp: true, max: 512 } };
export const swatchKey = (fab, dye, o = {}) => `${fab}|${dye}|${o.w}x${o.h}|${o.cm}|${o.size || o.max || 256}|${o.fold ?? 0}|${o.lamp ? 1 : 0}|${o.bg || 'paper'}`;

const PAPER = [239, 230, 210], GRID = [196, 178, 146];


function under(bg, x, y, pxPerCm) {
  if (bg === 'checker') { const c = ((x >> 3) + (y >> 3)) & 1 ? 200 : 150; return [c, c, c]; }
  const gx = (x / pxPerCm) % 1, gy = (y / pxPerCm) % 1, line = 1.2 / pxPerCm;
  return gx < line || gy < line ? GRID : PAPER;
}



const wrap = (i, n) => ((i % n) + n) % n;
function tap(m, x, y, bil, S) {
  const n = m.size;
  if (!bil) {
    const t = (wrap(Math.floor(x), n) + wrap(Math.floor(y), n) * n) * 4;
    S[0] = m.albedo[t]; S[1] = m.albedo[t + 1]; S[2] = m.albedo[t + 2]; S[3] = m.albedo[t + 3];
    S[4] = m.normal[t]; S[5] = m.normal[t + 1]; S[6] = m.normal[t + 2]; S[8] = m.orm[t + 1]; S[9] = m.orm[t + 2];
    return;
  }
  const fx = x - 0.5, fy = y - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
  const a = (wrap(x0, n) + wrap(y0, n) * n) * 4, b = (wrap(x0 + 1, n) + wrap(y0, n) * n) * 4;
  const c = (wrap(x0, n) + wrap(y0 + 1, n) * n) * 4, d = (wrap(x0 + 1, n) + wrap(y0 + 1, n) * n) * 4;
  const w0 = (1 - ax) * (1 - ay), w1 = ax * (1 - ay), w2 = (1 - ax) * ay, w3 = ax * ay;
  const mix = (A, o) => A[a + o] * w0 + A[b + o] * w1 + A[c + o] * w2 + A[d + o] * w3;
  S[0] = mix(m.albedo, 0); S[1] = mix(m.albedo, 1); S[2] = mix(m.albedo, 2); S[3] = mix(m.albedo, 3);
  S[4] = mix(m.normal, 0); S[5] = mix(m.normal, 1); S[6] = mix(m.normal, 2); S[8] = mix(m.orm, 1); S[9] = mix(m.orm, 2);
}

export function shadeSwatch(m, { w = 160, h = w, cm = 6, fold = 0, lamp = false, bg = 'paper' } = {}) {
  const out = new Uint8ClampedArray(w * h * 4), size = m.size, [tx, ty] = m.tile;
  const pxPerCm = w / cm, tpp = (size / tx) / pxPerCm;
  
  const k = Math.max(1, Math.min(2, Math.ceil(tpp - 0.25))), bil = tpp < 0.95;
  const S = new Float32Array(12);
  
  const L = [-0.5, -0.6, 0.62], ll = Math.hypot(L[0], L[1], L[2]);
  const Lx = L[0] / ll, Ly = L[1] / ll, Lz = L[2] / ll;
  
  const Hx = Lx, Hy = Ly, Hz = Lz + 1, hl = Math.hypot(Hx, Hy, Hz);
  const acc = [0, 0, 0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    
    const fx = x / w, fy = y / h;
    const slope = fold * (0.55 * Math.cos(fx * Math.PI * 2.2 + 0.6) + 0.18 * Math.cos(fx * Math.PI * 5.1 + fy * 1.3));
    
    const pool = lamp ? 1.08 - 0.28 * Math.hypot(fx - 0.35, fy - 0.3) : 1;
    acc[0] = acc[1] = acc[2] = 0;
    const bgc = under(bg, x, y, pxPerCm);
    for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) {
      const u = ((x + (sx + 0.5) / k) / pxPerCm), v = ((y + (sy + 0.5) / k) / pxPerCm);
      tap(m, (u / tx) * size, (v / ty) * size, bil, S);
      let nx = S[4] / 127.5 - 1 - slope, ny = S[5] / 127.5 - 1, nz = S[6] / 127.5 - 1;
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const ndl = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
      const rough = S[8] / 255, metal = S[9] / 255;
      const lit = (0.55 + 0.6 * ndl) * pool;
      
      const ndh = Math.max(0, (nx * Hx + ny * Hy + nz * Hz) / hl);
      const spec = (1 - rough) * (0.35 * (metal + 0.3) + 0.5 * Math.pow(ndh, 2 + 60 * (1 - rough) * (1 - rough))) * pool;
      const a = S[3] / 255;
      for (let c = 0; c < 3; c++) {
        const alb = S[c];
        const sc = metal > 0.5 ? alb : 255;          
        acc[c] += Math.min(255, alb * lit + sc * spec) * a + bgc[c] * (1 - a);
      }
    }
    const o = (y * w + x) * 4, n = k * k;
    out[o] = acc[0] / n; out[o + 1] = acc[1] / n; out[o + 2] = acc[2] / n; out[o + 3] = 255;
  }
  return out;
}




export function mapSizeFor(fab, { w = 160, cm = 6 } = {}, max = 256) {
  const want = fabricSpec(fab).tile[0] * (w / cm) * 1.5;
  let s = 64;
  while (s < want && s < max) s *= 2;
  return s;
}
export function swatchPixels(fab, dye, opts = {}) {
  return shadeSwatch(fabricMaps(fab, dye, opts.size || mapSizeFor(fab, opts, opts.max || 256)), opts);
}
export const swatchHash = (px) => hashBytes(px);
