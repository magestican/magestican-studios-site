










export const SUN = norm([-0.35, 1, 0.75]);
export const INK = '#0d0a14'; 
export const SHADE = [0.42, 0.38, 0.72]; 
export const SAT = { cast: 1.4, scenery: 1.25 }; 


export const SPEC = { cast: 0.965, scenery: 0.993 };
export const REF_H = 648; 
export const HALFTONE_CELL = 7; 
export const HULL = 3; 
export const HULL_THIN = 1.6; 


export const THIN_BELOW = 0.9;
export const NO_HULL_BELOW = 0.28;


export const PIXEL_HEIGHT = 720;


export const CORRUPT = { none: 0, dachi: 1, boss: 2 };
export const CRACK = { dachi: 0.07, boss: 0.045 }; 
export const CRACK_SCALE = 7; 


export function pxScale(h) { return Math.max(0.5, h / REF_H); }


export function hullFor(size) {
  if (!(size >= NO_HULL_BELOW)) return 0;
  return size < THIN_BELOW ? HULL_THIN : HULL;
}



export function keepHull(byte, phone) { return byte > 0 && (!phone || byte >= hwByte(HULL)); }

export const NO_HULL_MATERIALS = ['fire', 'lamp-glow', 'glass'];
export function hullMaterial(id) { return !NO_HULL_MATERIALS.includes(id); }


export const hwByte = (px) => Math.max(0, Math.min(255, Math.round(px * 10)));


export function castMode(variant, id) {
  if (id === 'lamp-glow') return { glow: true, corrupt: CORRUPT.none };
  if (variant === 'c') return { glow: false, corrupt: CORRUPT.dachi };
  if (variant === 'b' && id !== 'metal') return { glow: false, corrupt: CORRUPT.boss };
  return { glow: false, corrupt: CORRUPT.none };
}


export function lookName(search = '') {
  const m = /[?&]look=([a-z]+)/.exec(search);
  return m && m[1] === 'cozy' ? 'cozy' : 'cel';
}









export const HULL_CELLS = 5;
export const HULL_CELL_MIN = 0.05;



export const HULL_FINE = 0.16;
export const COARSE_MATERIALS = ['leaf', 'blossom', 'bark'];
export function hullLod(groups, { cells = HULL_CELLS, cellMin = HULL_CELL_MIN, fine = HULL_FINE, keep = () => true, coarse = (m) => COARSE_MATERIALS.includes(m) } = {}) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const g of groups) for (let v = 0; v < g.position.length; v += 3) {
    const x = g.position[v], y = g.position[v + 1], z = g.position[v + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  const size = Math.max(x1 - x0, y1 - y0, z1 - z0);
  const empty = { pos: new Float32Array(0), nor: new Float32Array(0), idx: new Uint32Array(0), size: size > 0 ? size : 0 };
  if (!(size > 0)) return empty;
  const cellC = Math.max(cellMin, size / cells), cellF = Math.max(cellMin, Math.min(fine, size / cells));
  const ids = new Map(), sum = [], tris = [], seen = new Set(), members = [];
  for (const g of groups) {
    if (!keep(g.material)) continue;
    const co = coarse(g.material), cell = co ? cellC : cellF, tag = co ? 'c' : 'f';
    const P = g.position, N = g.normal, I = g.index, at = new Int32Array(P.length / 3);
    for (let v = 0; v < P.length / 3; v++) {
      const k = tag + Math.floor((P[v * 3] - x0) / cell) + ',' + Math.floor((P[v * 3 + 1] - y0) / cell) + ',' + Math.floor((P[v * 3 + 2] - z0) / cell);
      let c = ids.get(k);
      if (c === undefined) { c = ids.size; ids.set(k, c); sum.push(0, 0, 0, 0, 0, 0, 0); }
      const s = c * 7;
      sum[s] += P[v * 3]; sum[s + 1] += P[v * 3 + 1]; sum[s + 2] += P[v * 3 + 2];
      sum[s + 3] += N[v * 3]; sum[s + 4] += N[v * 3 + 1]; sum[s + 5] += N[v * 3 + 2]; sum[s + 6]++;
      at[v] = c;
    }
    members.push([P, at]);
    for (let t = 0; t < I.length; t += 3) {
      const a = at[I[t]], b = at[I[t + 1]], c = at[I[t + 2]];
      if (a === b || b === c || a === c) continue;
      const lo = Math.min(a, b, c), hi = Math.max(a, b, c), key = lo + ',' + (a + b + c - lo - hi) + ',' + hi;
      if (seen.has(key)) continue; 
      seen.add(key); tris.push(a, b, c);
    }
  }
  const n = ids.size, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  for (let c = 0; c < n; c++) {
    const s = c * 7, k = sum[s + 6], l = Math.hypot(sum[s + 3], sum[s + 4], sum[s + 5]) || 1;
    pos[c * 3] = sum[s] / k; pos[c * 3 + 1] = sum[s + 1] / k; pos[c * 3 + 2] = sum[s + 2] / k;
    nor[c * 3] = sum[s + 3] / l; nor[c * 3 + 1] = sum[s + 4] / l; nor[c * 3 + 2] = sum[s + 5] / l;
  }
  
  
  const out = new Float32Array(n);
  for (const [P, at] of members) for (let v = 0; v < at.length; v++) {
    const c = at[v], d = (P[v * 3] - pos[c * 3]) * nor[c * 3] + (P[v * 3 + 1] - pos[c * 3 + 1]) * nor[c * 3 + 1] + (P[v * 3 + 2] - pos[c * 3 + 2]) * nor[c * 3 + 2];
    if (d > out[c]) out[c] = d;
  }
  for (let c = 0; c < n; c++) for (let j = 0; j < 3; j++) pos[c * 3 + j] += nor[c * 3 + j] * out[c];
  return { pos, nor, idx: Uint32Array.from(tris), size };
}

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return v.map((x) => x / l); }
