









import { LAYOUT, LAMPS, TREES } from './townmap.js';

export const THETA = 28 * Math.PI / 180;
const C = Math.cos(THETA), S = Math.sin(THETA);
export const toWorld = (x, gy, h) => [x, h / C, gy / S];

export const TILE = { brick: 48, stone: 64, plaster: 80, roof: 36, wood: 40, trim: 64, glass: 40, glassLit: 40, metal: 40, cobble: 40 };


const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [lin(((n >> 16) & 255) / 255), lin(((n >> 8) & 255) / 255), lin((n & 255) / 255)];
}
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

function rand(seed) {
  let k = 0;
  for (const ch of String(seed)) k = (k * 31 + ch.charCodeAt(0)) >>> 0;
  k = k % 2147483646 + 1;
  return () => ((k = (k * 16807) % 2147483647) / 2147483647);
}


export class Mesher {
  constructor() { this.b = {}; this.cur = 0; }   
  bucket(m) { return (this.b[m] ||= { p: [], n: [], uv: [], c: [], id: [] }); }
  
  
  poly(m, pts, uvs, col, out) {
    const w = pts.map((p) => toWorld(p[0], p[1], p[2]));
    let n = cross(sub(w[1], w[0]), sub(w[2], w[0]));
    if (len(n) < 1e-9) { for (let i = 3; i < w.length && len(n) < 1e-9; i++) n = cross(sub(w[1], w[0]), sub(w[i], w[0])); }
    if (len(n) < 1e-9) return;
    if (out && dot(n, out) < 0) { w.reverse(); uvs = [...uvs].reverse(); n = n.map((v) => -v); }
    const nn = norm(n), B = this.bucket(m), c = typeof col === 'string' ? rgb(col) : col;
    for (let i = 1; i < w.length - 1; i++) for (const k of [0, i, i + 1]) {
      B.p.push(w[k][0], w[k][1], w[k][2]); B.n.push(nn[0], nn[1], nn[2]); B.uv.push(uvs[k][0], uvs[k][1]); B.c.push(c[0], c[1], c[2]); B.id.push(this.cur);
    }
  }
  
  box(m, x0, x1, gy0, gy1, h0, h1, col, { skip = '', topM, frontM, frontUV } = {}) {
    const T = TILE[m] || 48, t = (v) => v / T;
    const F = (n) => !skip.includes(n);
    
    if (F('f')) this.poly(frontM || m, [[x0, gy1, h0], [x1, gy1, h0], [x1, gy1, h1], [x0, gy1, h1]], frontUV || [[t(x0), t(h0)], [t(x1), t(h0)], [t(x1), t(h1)], [t(x0), t(h1)]], frontM ? '#ffffff' : col, [0, 0, 1]);
    if (F('k')) this.poly(m, [[x0, gy0, h0], [x1, gy0, h0], [x1, gy0, h1], [x0, gy0, h1]], [[t(x0), t(h0)], [t(x1), t(h0)], [t(x1), t(h1)], [t(x0), t(h1)]], col, [0, 0, -1]);
    if (F('t')) this.poly(topM || m, [[x0, gy0, h1], [x1, gy0, h1], [x1, gy1, h1], [x0, gy1, h1]], [[t(x0), t(gy0)], [t(x1), t(gy0)], [t(x1), t(gy1)], [t(x0), t(gy1)]], col, [0, 1, 0]);
    if (F('l')) this.poly(m, [[x0, gy0, h0], [x0, gy1, h0], [x0, gy1, h1], [x0, gy0, h1]], [[t(gy0), t(h0)], [t(gy1), t(h0)], [t(gy1), t(h1)], [t(gy0), t(h1)]], col, [-1, 0, 0]);
    if (F('r')) this.poly(m, [[x1, gy0, h0], [x1, gy1, h0], [x1, gy1, h1], [x1, gy0, h1]], [[t(gy0), t(h0)], [t(gy1), t(h0)], [t(gy1), t(h1)], [t(gy0), t(h1)]], col, [1, 0, 0]);
  }
  
  cyl(m, x, gy, rw, h0, h1, col, seg = 12, cap = true, rz = rw) {
    const pt = (a, h) => [x + rw * Math.cos(a), gy + rz * S * Math.sin(a), h];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2, am = (a0 + a1) / 2;
      this.poly(m, [pt(a0, h0), pt(a1, h0), pt(a1, h1), pt(a0, h1)], [[i / seg * 4, h0 / 40], [(i + 1) / seg * 4, h0 / 40], [(i + 1) / seg * 4, h1 / 40], [i / seg * 4, h1 / 40]], col, [Math.cos(am), 0, Math.sin(am)]);
      if (cap) this.poly(m, [[x, gy, h1], pt(a0, h1), pt(a1, h1)], [[0.5, 0.5], [0.5 + 0.5 * Math.cos(a0), 0.5 + 0.5 * Math.sin(a0)], [0.5 + 0.5 * Math.cos(a1), 0.5 + 0.5 * Math.sin(a1)]], col, [0, 1, 0]);
    }
  }
  
  dome(m, x, gy, rw, h0, rise, col, seg = 16, rings = 6) {
    const pt = (a, r) => { const k = r / rings, rr = Math.cos(k * Math.PI / 2); return [x + rw * rr * Math.cos(a), gy + rw * rr * S * Math.sin(a), h0 + rise * Math.sin(k * Math.PI / 2)]; };
    for (let r = 0; r < rings; r++) for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2, am = (a0 + a1) / 2, k = (r + 0.5) / rings;
      const out = [Math.cos(am) * Math.cos(k * Math.PI / 2), Math.sin(k * Math.PI / 2), Math.sin(am) * Math.cos(k * Math.PI / 2)];
      this.poly(m, [pt(a0, r), pt(a1, r), pt(a1, r + 1), pt(a0, r + 1)], [[i / seg * 6, r / rings * 2], [(i + 1) / seg * 6, r / rings * 2], [(i + 1) / seg * 6, (r + 1) / rings * 2], [i / seg * 6, (r + 1) / rings * 2]], col, out);
    }
  }
  
  pyramid(m, x0, x1, gy0, gy1, h0, h1, col) {
    const ax = (x0 + x1) / 2, ag = (gy0 + gy1) / 2, A = [ax, ag, h1], T = TILE[m] || 36;
    this.poly(m, [[x0, gy1, h0], [x1, gy1, h0], A], [[0, 0], [(x1 - x0) / T, 0], [(x1 - x0) / 2 / T, (h1 - h0) / T]], col, [0, 0.5, 1]);
    this.poly(m, [[x1, gy0, h0], [x0, gy0, h0], A], [[0, 0], [(x1 - x0) / T, 0], [(x1 - x0) / 2 / T, (h1 - h0) / T]], col, [0, 0.5, -1]);
    this.poly(m, [[x0, gy0, h0], [x0, gy1, h0], A], [[0, 0], [1, 0], [0.5, (h1 - h0) / T]], col, [-1, 0.5, 0]);
    this.poly(m, [[x1, gy1, h0], [x1, gy0, h0], A], [[0, 0], [1, 0], [0.5, (h1 - h0) / T]], col, [1, 0.5, 0]);
  }
  
  card(m, x0, x1, gy, h0, h1, uvr, col = '#ffffff') {
    this.poly(m, [[x0, gy, h0], [x1, gy, h0], [x1, gy, h1], [x0, gy, h1]], [[uvr[0], uvr[1]], [uvr[2], uvr[1]], [uvr[2], uvr[3]], [uvr[0], uvr[3]]], col, [0, 0, 1]);
  }
  
  wallWithHoles(m, x0, x1, h0, h1, gy, holes, col) {
    const xs = [...new Set([x0, x1, ...holes.flatMap((o) => [o.x0, o.x1])].filter((v) => v >= x0 && v <= x1))].sort((a, b) => a - b);
    const hs = [...new Set([h0, h1, ...holes.flatMap((o) => [o.h0, o.h1])].filter((v) => v >= h0 && v <= h1))].sort((a, b) => a - b);
    const T = TILE[m] || 48;
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < hs.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2, ch = (hs[j] + hs[j + 1]) / 2;
      if (holes.some((o) => cx > o.x0 && cx < o.x1 && ch > o.h0 && ch < o.h1)) continue;
      const a = xs[i], b = xs[i + 1], c = hs[j], d = hs[j + 1];
      this.poly(m, [[a, gy, c], [b, gy, c], [b, gy, d], [a, gy, d]], [[a / T, c / T], [b / T, c / T], [b / T, d / T], [a / T, d / T]], col, [0, 0, 1]);
    }
  }
  
  reveal(m, o, gy, dr, col) {
    this.poly(m, [[o.x0, gy - dr, o.h0], [o.x0, gy, o.h0], [o.x0, gy, o.h1], [o.x0, gy - dr, o.h1]], [[0, 0], [0.2, 0], [0.2, 1], [0, 1]], col, [1, 0, 0]);
    this.poly(m, [[o.x1, gy - dr, o.h0], [o.x1, gy, o.h0], [o.x1, gy, o.h1], [o.x1, gy - dr, o.h1]], [[0, 0], [0.2, 0], [0.2, 1], [0, 1]], col, [-1, 0, 0]);
    this.poly(m, [[o.x0, gy - dr, o.h0], [o.x1, gy - dr, o.h0], [o.x1, gy, o.h0], [o.x0, gy, o.h0]], [[0, 0], [1, 0], [1, 0.2], [0, 0.2]], col, [0, 1, 0]);
    this.poly(m, [[o.x0, gy - dr, o.h1], [o.x1, gy - dr, o.h1], [o.x1, gy, o.h1], [o.x0, gy, o.h1]], [[0, 0], [1, 0], [1, 0.2], [0, 0.2]], col, [0, -1, 0]);
  }
  count() { return Object.values(this.b).reduce((s, B) => s + B.p.length / 9, 0); }
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };



export const ATLAS = { size: 2048, cols: 8, rows: 16 };
export function atlasCells(ids) {
  const out = {}, cw = 1 / ATLAS.cols, ch = 1 / ATLAS.rows;
  ids.forEach((id, i) => {
    const c = i % ATLAS.cols, r = Math.floor(i / ATLAS.cols);
    
    out[id] = { i, rect: [c * cw + 0.002, 1 - (r + 1) * ch + 0.002, (c + 1) * cw - 0.002, 1 - r * ch - 0.002], px: [c * ATLAS.size / ATLAS.cols, r * ATLAS.size / ATLAS.rows, ATLAS.size / ATLAS.cols, ATLAS.size / ATLAS.rows] };
  });
  return out;
}

export function atlasIds() {
  const ids = [];
  for (const id of Object.keys(LAYOUT)) ids.push(`sign:${id}`, `shop:${id}`);
  ids.push('rose', 'lancet', 'churchdoor', 'clock', 'poster:tosca', 'poster:flute', 'opera:sign', 'opera:door', 'tympanum', 'dormer', 'roundwin', 'neon');
  return ids;
}


export function windowSpots(L) {
  const x0 = L.x - L.w / 2, top = L.y - L.h, n = L.w > 160 ? 3 : 2, out = [];
  for (let r = 0; r < L.floors - 1; r++) for (let k = 0; k < n; k++) {
    const wx = x0 + (L.w / n) * (k + 0.5) - 14, wy = top + 18 + r * 58;
    out.push({ r, k, x0: wx, x1: wx + 28, h0: L.y - (wy + 36), h1: L.y - wy, night: (r * 7 + k * 3 + L.x) % 5 !== 0 });
  }
  return out;
}


export const DEPTH = { opera: 44, stanne: 30, fishmarket: 24 };
const depthOf = (id) => DEPTH[id] || 28;
const wallMat = (L, id) => (id === 'opera' || L.grand || id === 'stanne' || id === 'herald' ? 'stone' : L.roof === 'stall' ? 'wood' : id === 'washhouse' || id === 'bakery' || id === 'orchid' ? 'plaster' : 'brick');


export function buildingGeo(id, M = new Mesher(), cells = atlasCells(atlasIds())) {
  const L = LAYOUT[id];
  if (id === 'opera') return opera(L, M, cells);
  if (L.roof === 'church') return church(L, M, cells);
  if (L.roof === 'stall') return stall(L, M, cells);
  const x0 = L.x - L.w / 2, x1 = x0 + L.w, g = L.y, d = depthOf(id), back = g - d, wm = wallMat(L, id);
  const wall = L.wall, trim = L.trim, dark = shade(L.wall, -0.45);
  
  const wins = windowSpots(L);
  const sw = L.w * 0.56, shop = { x0: x0 + 12, x1: x0 + 12 + sw, h0: 16, h1: 74 };
  const door = { x0: x1 - 46, x1: x1 - 12, h0: 0, h1: 74 };
  const holes = [...wins, shop, door];
  M.wallWithHoles(wm, x0, x1, 0, L.h, g, holes, wall);
  M.box(wm, x0, x1, back, g, 0, L.h, wall, { skip: 'ft' });
  
  for (const w of wins) {
    M.reveal('trim', w, g, 4, shade(wall, -0.25));
    M.poly(w.night ? 'glassLit' : 'glass', [[w.x0, g - 4, w.h0], [w.x1, g - 4, w.h0], [w.x1, g - 4, w.h1], [w.x0, g - 4, w.h1]], [[0, 0], [1, 0], [1, 1], [0, 1]], '#ffffff', [0, 0, 1]);
    const mx = (w.x0 + w.x1) / 2, mh = (w.h0 + w.h1) / 2;
    M.box('trim', mx - 1, mx + 1, g - 4, g - 3, w.h0, w.h1, dark, { skip: 'k' });
    M.box('trim', w.x0, w.x1, g - 4, g - 3, mh - 1, mh + 1, dark, { skip: 'k' });
    M.box('stone', w.x0 - 3, w.x1 + 3, g - 1, g + 3, w.h0 - 4, w.h0, shade(wall, 0.3), { skip: 'k' });
    if (!L.grand) for (const sx of [w.x0 - 10, w.x1 + 2]) M.box('wood', sx, sx + 8, g, g + 1.5, w.h0, w.h1, trim, { skip: 'k' });
  }
  
  M.reveal('trim', shop, g, 5, shade(wall, -0.35));
  const sc = cells[`shop:${id}`];
  if (sc) M.card('display', shop.x0, shop.x1, g - 5, shop.h0, shop.h1, sc.rect);
  M.box('trim', shop.x0 - 4, shop.x1 + 4, g, g + 2, shop.h0 - 6, shop.h0, shade(wall, -0.35), { skip: 'k' });
  M.box('trim', shop.x0 - 4, shop.x1 + 4, g, g + 2, shop.h1, shop.h1 + 4, shade(wall, -0.35), { skip: 'k' });
  
  M.reveal('trim', door, g, 6, shade(wall, -0.3));
  M.poly('wood', [[door.x0, g - 6, 0], [door.x1, g - 6, 0], [door.x1, g - 6, 74], [door.x0, g - 6, 74]], [[0, 0], [1, 0], [1, 2], [0, 2]], L.door || shade(L.wall, -0.5), [0, 0, 1]);
  M.box('metal', door.x1 - 8, door.x1 - 5, g - 6, g - 4, 36, 39, '#e2c06b', { skip: 'k' });
  M.box('stone', door.x0 - 4, door.x1 + 4, g, g + 6, 0, 3, '#b8ad96', { skip: 'k' });
  
  M.box('stone', x0 - 6, x1 + 6, back - 2, g + 3, 0, 4, '#a89c84', { skip: 'k' });
  if (L.grand) {
    for (const px of [x1 - 56, x1 - 8]) M.box('stone', px, px + 6, g, g + 3, 0, 80, '#f4efe2', { skip: 'k' });
    M.box('metal', x0 - 6, x1 + 6, g + 8, g + 9, 12, 14, '#2a2a2a');
    for (let i = 0; i <= 12; i++) { const px = x0 - 4 + i * (L.w + 8) / 12; M.box('metal', px, px + 1.5, g + 8, g + 9, 0, 14, '#2a2a2a', { skip: 'k' }); }
  }
  
  
  if (L.awning) awning(M, shop.x0 - 8, shop.x1 + 8, g, 82, 70, 12, L.awning);
  
  const sgw = Math.min(L.w * 0.92, 152), sgc = cells[`sign:${id}`];
  
  M.box('wood', L.x - sgw / 2, L.x + sgw / 2, g, g + 5, 84, 106, L.neon ? '#141a30' : '#3a2612', { skip: 'k', frontM: 'atlas', frontUV: sgc && [[sgc.rect[0], sgc.rect[1]], [sgc.rect[2], sgc.rect[1]], [sgc.rect[2], sgc.rect[3]], [sgc.rect[0], sgc.rect[3]]] });
  
  for (let r = 1; r < L.floors; r++) { const h = L.h - 18 - r * 58 + 54; if (h > 110 && h < L.h - 8) M.box(wm, x0 - 2, x1 + 2, g, g + 2, h, h + 4, shade(wall, 0.2), { skip: 'k' }); }
  
  roofOf(L, M, x0, x1, back, g, id, cells);
  if (L.chimney) {
    const cx = x0 + L.w * 0.72;
    M.box('brick', cx, cx + 18, g - d * 0.6, g - d * 0.6 + 12, L.h - 10, L.h + 70, shade(L.wall, -0.3));
    M.box('stone', cx - 3, cx + 21, g - d * 0.6 - 2, g - d * 0.6 + 14, L.h + 66, L.h + 73, shade(L.wall, -0.45));
  }
  if (L.lanterns) for (const lx of [x0 + 8, L.x, x1 - 8]) lantern(M, lx, g + 6, L.h - 6);
  if (L.garland) for (let i = 0; i < 15; i++) { const t = i / 14, gx = x0 + 4 + t * (L.w - 8), gh = L.h - 6 - Math.sin(t * Math.PI * 3) ** 2 * 7; M.box('cloth', gx - 3, gx + 3, g, g + 4, gh - 3, gh + 3, i % 2 ? '#f29a1f' : '#f5c43a'); }
  if (L.display === 'laundry') {
    M.box('wood', x0 - 62, x0 - 58, g - 4, g, 0, L.h - 6, '#6b4a2f');
    M.box('metal', x0 - 60, x0, g - 3, g - 2, L.h - 14, L.h - 13, '#6b5a4a');   
    ['#f4f4ee', '#cfe0ea', '#f4d8d8'].forEach((c, i) => M.box('cloth', x0 - 56 + i * 18, x0 - 42 + i * 18, g - 3, g - 2, L.h - 33 - (i === 1 ? 4 : 0), L.h - 13, c));
  }
  if (L.neon) M.box('neon', L.x - sgw / 2 - 2, L.x + sgw / 2 + 2, g + 5, g + 6, 82, 84, '#6ab0e8');
  return M;
}

function awning(M, x0, x1, g, hTop, hFront, out, [c0, c1]) {
  const n = 8, w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) M.poly('cloth', [[x0 + i * w, g, hTop], [x0 + (i + 1) * w, g, hTop], [x0 + (i + 1) * w, g + out, hFront], [x0 + i * w, g + out, hFront]], [[0, 0], [1, 0], [1, 1], [0, 1]], i % 2 ? c1 : c0, [0, 1, 1]);
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w, b = a + w, m = (a + b) / 2;
    M.poly('cloth', [[a, g + out, hFront], [b, g + out, hFront], [b, g + out, hFront - 4], [m, g + out, hFront - 9], [a, g + out, hFront - 4]], [[0, 0], [1, 0], [1, 0.3], [0.5, 0.6], [0, 0.3]], i % 2 ? c1 : c0, [0, 0, 1]);
  }
}

function lantern(M, x, gy, h) {
  M.box('metal', x - 0.8, x + 0.8, gy - 7, gy + 0.8, h - 1, h + 1, '#3a2a22');   
  M.box('metal', x - 0.5, x + 0.5, gy - 0.5, gy + 0.5, h - 6, h, '#3a2a22');
  M.cyl('lantern', x, gy, 7, h - 24, h - 6, '#e0322f', 8);
  M.box('metal', x - 4, x + 4, gy - 2, gy + 2, h - 7, h - 5, '#e8b84a');
}


function roofOf(L, M, x0, x1, back, g, id, cells) {
  const h = L.h, cx = (x0 + x1) / 2, rc = shade(L.wall, -0.45);
  const slope = (m, ex0, ex1, rise, col, ov, finials) => {
    
    const e = h - 2, apex = h + rise, gf = g + 4, gb = back - 4;
    const T = TILE.roof, sl = Math.hypot((ex1 - ex0) / 2, rise);
    M.poly('roof', [[ex0, gb, e], [ex0, gf, e], [cx, gf, apex], [cx, gb, apex]], [[0, gb / T], [0, gf / T], [sl / T, gf / T], [sl / T, gb / T]], col, [-1, 1, 0]);
    M.poly('roof', [[ex1, gb, e], [ex1, gf, e], [cx, gf, apex], [cx, gb, apex]], [[0, gb / T], [0, gf / T], [sl / T, gf / T], [sl / T, gb / T]], col, [1, 1, 0]);
    
    const k = (ex1 - ex0) / 2, top = h + rise * ((L.w / 2) / k);
    for (const gy of [g, back]) M.poly(m, [[x0, gy, h], [x1, gy, h], [cx, gy, top]], [[x0 / 48, h / 48], [x1 / 48, h / 48], [cx / 48, top / 48]], L.wall, [0, 0, gy === g ? 1 : -1]);
    
    for (const [a, b] of [[[ex0, e], [cx, apex]], [[ex1, e], [cx, apex]]]) {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
        M.poly('trim', [[p0[0], gf + 1, p0[1] - 4], [p1[0], gf + 1, p1[1] - 4], [p1[0], gf + 1, p1[1] + 1], [p0[0], gf + 1, p0[1] + 1]], [[0, 0], [1, 0], [1, 1], [0, 1]], finials ? '#e8b84a' : shade(col, -0.3), [0, 0, 1]);
      }
    }
    M.box('roof', cx - 3, cx + 3, gb, gf + 1, apex - 2, apex + 3, shade(col, -0.25), { skip: 'k' });
    return top;
  };
  switch (L.roof) {
    case 'gable': {
      const top = slope(wallMat(L, id), x0 - 10, x1 + 10, 58, rc);
      
      const rw = cells.roundwin;
      if (rw) M.card('glassArt', cx - 10, cx + 10, g + 0.5, h + 16, h + 36, rw.rect);
      return top;
    }
    case 'thai': {
      slope(wallMat(L, id), x0 - 12, x1 + 12, 64, '#b8423a', true);
      
      for (const [hx, hh, s] of [[cx, h + 64, 0], [x0 - 12, h - 2, -1], [x1 + 12, h - 2, 1]]) M.poly('gold', [[hx - 2, g + 6, hh], [hx + 2, g + 6, hh], [hx + 2 + s * 8, g + 6, hh + 14], [hx + s * 8, g + 6, hh + 16]], [[0, 0], [1, 0], [1, 1], [0, 1]], '#e8b84a', [0, 0, 1]);
      return;
    }
    case 'mansard': {
      M.box('stone', x0 - 8, x1 + 8, back - 2, g + 4, h - 4, h + 4, shade(L.wall, 0.3));
      const bl = [x0 - 6, back - 2], br = [x1 + 6, g + 2], tl = [x0 + 12, back + 8], tr = [x1 - 12, g - 8], hh = h + 44, c = '#4a5462';
      M.poly('roof', [[bl[0], br[1], h + 4], [br[0], br[1], h + 4], [tr[0], tr[1], hh], [tl[0], tr[1], hh]], [[bl[0] / 36, 0], [br[0] / 36, 0], [tr[0] / 36, 1.3], [tl[0] / 36, 1.3]], c, [0, 1, 1]);
      M.poly('roof', [[bl[0], bl[1], h + 4], [bl[0], br[1], h + 4], [tl[0], tr[1], hh], [tl[0], tl[1], hh]], [[0, 0], [1, 0], [1, 1], [0, 1]], c, [-1, 1, 0]);
      M.poly('roof', [[br[0], bl[1], h + 4], [br[0], br[1], h + 4], [tr[0], tr[1], hh], [tr[0], tl[1], hh]], [[0, 0], [1, 0], [1, 1], [0, 1]], c, [1, 1, 0]);
      M.poly('roof', [[tl[0], tl[1], hh], [tr[0], tl[1], hh], [tr[0], tr[1], hh], [tl[0], tr[1], hh]], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(c, -0.15), [0, 1, 0]);
      
      const dc = cells.dormer;
      for (const k of [0.3, 0.7]) {
        const dx = x0 + L.w * k;
        M.box('stone', dx - 13, dx + 13, g - 6, g + 1, h + 8, h + 36, shade(L.wall, 0.2), { skip: 'fk' });
        M.box('stone', dx - 13, dx + 13, g - 6, g + 1, h + 8, h + 36, shade(L.wall, 0.2), { skip: 'kltr', frontM: 'glassArt', frontUV: dc && [[dc.rect[0], dc.rect[1]], [dc.rect[2], dc.rect[1]], [dc.rect[2], dc.rect[3]], [dc.rect[0], dc.rect[3]]] });
        M.pyramid('roof', dx - 15, dx + 15, g - 8, g + 2, h + 36, h + 46, c);
      }
      return;
    }
    case 'flat': {
      M.box('stone', x0 - 8, x1 + 8, back - 2, g + 2, h - 14, h + 2, shade(L.wall, 0.25));
      M.box('trim', x0 - 9, x1 + 9, back - 3, g + 3, h + 2, h + 4, L.trim);
      if (!L.garland) M.box('stone', cx - 30, cx + 30, back + 4, g - 6, h + 2, h + 22, shade(L.wall, 0.15));
      return;
    }
    case 'shed': {
      const c = rc, hl = h + 36, hr = h + 16;
      M.poly('roof', [[x0 - 10, back - 4, hl], [x1 + 10, back - 4, hr], [x1 + 10, g + 4, hr], [x0 - 10, g + 4, hl]], [[x0 / 36, back / 36], [x1 / 36, back / 36], [x1 / 36, g / 36], [x0 / 36, g / 36]], c, [0, 1, 0]);
      const m = wallMat(L, id);
      M.poly(m, [[x0, g, h], [x1, g, h], [x1, g, hr - 1], [x0, g, hl - 1]], [[0, 0], [3, 0], [3, 0.3], [0, 0.7]], L.wall, [0, 0, 1]);
      M.poly('trim', [[x0 - 10, g + 4.5, hl - 4], [x1 + 10, g + 4.5, hr - 4], [x1 + 10, g + 4.5, hr + 1], [x0 - 10, g + 4.5, hl + 1]], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(c, -0.3), [0, 0, 1]);
      return;
    }
    case 'pagoda': {
      pagodaTier(M, x0 - 22, x1 + 22, back - 6, g + 10, h - 4, h + 30, 14, '#2f5a4a');
      M.box(wallMat(L, id), x0 + 20, x1 - 20, back + 4, g - 6, h + 20, h + 36, shade(L.wall, -0.2));
      pagodaTier(M, x0 + 12, x1 - 12, back, g - 2, h + 32, h + 58, 9, '#2f5a4a');
      M.cyl('gold', cx, (back + g) / 2, 5, h + 56, h + 64, L.trim, 8);
      return;
    }
  }
}


function pagodaTier(M, xa, xb, gb, gf, he, hr, curl, col) {
  const nu = 10, nv = 4, gm = (gb + gf) / 2, ridgeIn = (xb - xa) * 0.18;
  const eave = (u, gy) => [xa + (xb - xa) * u, gy, he + curl * Math.pow(Math.abs(2 * u - 1), 5)];
  const ridge = (u) => [xa + ridgeIn + (xb - xa - 2 * ridgeIn) * u, gm, hr];
  const at = (u, v, gy) => { const e = eave(u, gy), r = ridge(u), vv = Math.pow(v, 1.5); return [e[0] + (r[0] - e[0]) * v, e[1] + (r[1] - e[1]) * v, e[2] + (r[2] - e[2]) * vv]; };
  for (const [gy, out] of [[gf, 1], [gb, -1]]) for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
    M.poly('roof', [at(u0, v0, gy), at(u1, v0, gy), at(u1, v1, gy), at(u0, v1, gy)], [[u0 * 4, v0], [u1 * 4, v0], [u1 * 4, v1], [u0 * 4, v1]], col, [0, 1, out]);
  }
  
  for (const [u, s] of [[0, -1], [1, 1]]) {
    for (let j = 0; j < nv; j++) {
      const v0 = j / nv, v1 = (j + 1) / nv;
      M.poly('roof', [at(u, v0, gf), at(u, v0, gb), at(u, v1, gb), at(u, v1, gf)], [[0, v0], [1, v0], [1, v1], [0, v1]], shade(col, -0.1), [s, 1, 0]);
    }
  }
  
  for (let i = 0; i < nu; i++) {
    const a = eave(i / nu, gf + 0.5), b = eave((i + 1) / nu, gf + 0.5);
    M.poly('trim', [[a[0], a[1], a[2] - 4], [b[0], b[1], b[2] - 4], [b[0], b[1], b[2]], [a[0], a[1], a[2]]], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(col, -0.35), [0, 0, 1]);
  }
  M.box('roof', xa + ridgeIn, xb - ridgeIn, gm - 2, gm + 2, hr - 1, hr + 3, shade(col, -0.25));
}


function stall(L, M, cells) {
  const x0 = L.x - L.w / 2, x1 = x0 + L.w, g = L.y, back = g - depthOf('fishmarket'), [c0, c1] = L.awning;
  M.box('wood', x0, x1, back + 6, g, 0, 50, '#8a6a4a');
  M.box('wood', x0 - 2, x1 + 2, back + 4, g + 2, 50, 54, '#6b4a2f');
  for (let i = 0; i < 3; i++) M.box('wood', x0 + 14 + i * 56, x0 + 56 + i * 56, g, g + 4, 6, 30, '#a07a4a', { skip: 'k' });
  const fc = cells['shop:fishmarket'];
  if (fc) M.poly('display', [[x0 + 8, g - 4, 54], [x1 - 8, g - 4, 54], [x1 - 8, back + 10, 86], [x0 + 8, back + 10, 86]], [[fc.rect[0], fc.rect[1]], [fc.rect[2], fc.rect[1]], [fc.rect[2], fc.rect[3]], [fc.rect[0], fc.rect[3]]], '#ffffff', [0, 1, 1]);
  for (const px of [x0 + 2, x1 - 6]) for (const pg of [g - 4, back + 4]) M.box('wood', px, px + 4, pg - 2, pg + 2, 0, L.h + 2, '#6b4a2f');
  
  const n = 10, w = (x1 - x0 + 28) / n;
  for (let i = 0; i < n; i++) M.poly('cloth', [[x0 - 14 + i * w, back - 4, L.h + 40], [x0 - 14 + (i + 1) * w, back - 4, L.h + 40], [x0 - 14 + (i + 1) * w, g + 8, L.h], [x0 - 14 + i * w, g + 8, L.h]], [[0, 0], [1, 0], [1, 1], [0, 1]], i % 2 ? c1 : c0, [0, 1, 1]);
  for (let i = 0; i < n; i++) { const a = x0 - 14 + i * w, b = a + w; M.poly('cloth', [[a, g + 8, L.h], [b, g + 8, L.h], [b, g + 8, L.h - 4], [(a + b) / 2, g + 8, L.h - 10], [a, g + 8, L.h - 4]], [[0, 0], [1, 0], [1, 0.3], [0.5, 0.6], [0, 0.3]], i % 2 ? c1 : c0, [0, 0, 1]); }
  const sc = cells['sign:fishmarket'];
  M.box('wood', L.x - 76, L.x + 76, g + 9, g + 12, L.h + 40, L.h + 62, '#3a2612', { skip: 'k', frontM: 'atlas', frontUV: sc && [[sc.rect[0], sc.rect[1]], [sc.rect[2], sc.rect[1]], [sc.rect[2], sc.rect[3]], [sc.rect[0], sc.rect[3]]] });
  for (const px of [L.x - 60, L.x + 56]) M.box('wood', px, px + 4, g + 9, g + 11, L.h - 2, L.h + 42, '#6b4a2f');
  return M;
}


function church(L, M, cells) {
  const x0 = L.x - L.w / 2, x1 = x0 + L.w, g = L.y, back = g - depthOf('stanne'), h = L.h, cx = L.x;
  const tx = x0 - 16, tw = 44, tt = h + 50;   
  const lanA = { x0: x0 + 15, x1: x0 + 33, h0: 66, h1: 126 }, lanB = { x0: x1 - 33, x1: x1 - 15, h0: 66, h1: 126 }, door = { x0: cx - 20, x1: cx + 20, h0: 0, h1: 66 };
  M.wallWithHoles('stone', x0, x1, 0, h, g, [lanA, lanB, door], L.wall);
  M.box('stone', x0, x1, back, g, 0, h, L.wall, { skip: 'ft' });
  for (const o of [lanA, lanB]) { M.reveal('stone', o, g, 5, shade(L.wall, -0.2)); M.card('glassArt', o.x0, o.x1, g - 5, o.h0, o.h1, cells.lancet.rect); }
  M.reveal('stone', door, g, 7, shade(L.wall, -0.2));
  M.card('display', door.x0, door.x1, g - 7, 0, 66, cells.churchdoor.rect);
  
  const rise = 62, e = h - 4;
  for (const [ex, s] of [[x0 - 8, -1], [x1 + 8, 1]]) M.poly('roof', [[ex, back - 4, e], [ex, g + 3, e], [cx, g + 3, h + rise], [cx, back - 4, h + rise]], [[0, 0], [0, 1.5], [2, 1.5], [2, 0]], '#4a5462', [s, 1, 0]);
  for (const gy of [g, back]) M.poly('stone', [[x0, gy, h], [x1, gy, h], [cx, gy, h + rise * (L.w / 2) / (L.w / 2 + 8)]], [[0, 0], [2, 0], [1, 1]], L.wall, [0, 0, gy === g ? 1 : -1]);
  M.card('glassArt', cx - 19, cx + 19, g + 0.5, h - 4 + 14 - 19, h + 14 + 19 - 4, cells.rose.rect);
  M.box('stone', x0 - 6, x1 + 6, back - 2, g + 3, 0, 4, '#a89c84', { skip: 'k' });
  
  const tg = g + 2, tb = tg - 22;
  M.box('stone', tx, tx + tw, tb, tg, 0, tt, shade(L.wall, -0.06));
  M.box('stone', tx - 2, tx + tw + 2, tb - 2, tg + 2, tt - 4, tt + 2, shade(L.wall, 0.15));
  M.box('wood', tx + 12, tx + 32, tg, tg + 0.5, tt - 38, tt - 16, '#3a3040', { skip: 'k' });
  M.card('display', tx + 12, tx + 32, tg + 1, tt - 68, tt - 48, cells.clock.rect);
  M.pyramid('roof', tx - 4, tx + tw + 4, tb - 4, tg + 4, tt + 2, tt + 98, '#4a5462');
  M.box('gold', tx + tw / 2 - 1.5, tx + tw / 2 + 1.5, (tb + tg) / 2 - 1, (tb + tg) / 2 + 1, tt + 96, tt + 114, L.trim);
  M.box('gold', tx + tw / 2 - 6, tx + tw / 2 + 6, (tb + tg) / 2 - 1, (tb + tg) / 2 + 1, tt + 106, tt + 109, L.trim);
  
  for (const s of [-1, 1]) {
    M.box('wood', cx + s * 36 - 8, cx + s * 36 + 8, g + 2, g + 10, 0, 14, '#8a6a4a');
    for (let i = 0; i < 3; i++) {
      M.box('leaf', cx + s * 36 - 4.5 + i * 5, cx + s * 36 - 3.5 + i * 5, g + 5.5, g + 6.5, 12, 23 + (i % 2) * 4, '#4a7a3a');   
      M.box('cloth', cx + s * 36 - 6 + i * 5, cx + s * 36 - 2 + i * 5, g + 5, g + 7, 22 + (i % 2) * 4, 32 + (i % 2) * 4, '#fbf6ea');
    }
  }
  const sc = cells['sign:stanne'];
  M.box('wood', cx - 48, cx + 48, g, g + 3, h - 110, h - 90, '#3a2612', { skip: 'k', frontM: 'atlas', frontUV: sc && [[sc.rect[0], sc.rect[1]], [sc.rect[2], sc.rect[1]], [sc.rect[2], sc.rect[3]], [sc.rect[0], sc.rect[3]]] });
  return M;
}


function opera(L, M, cells) {
  const x0 = L.x - L.w / 2, x1 = x0 + L.w, g = L.y, h = L.h, cx = L.x, back = g - depthOf('opera');
  const stone = L.wall, wallG = g - 14;
  
  M.box('stone', x0 - 20, x1 + 20, back, g + 8, 0, 4, '#cdbfa6');
  M.box('stone', x0 - 10, x1 + 10, back, g + 2, 4, 8, '#d9ccb4');
  
  const doors = [0, 1, 2].map((i) => ({ x0: cx - 50 + i * 36, x1: cx - 22 + i * 36, h0: 8, h1: 78 }));
  M.wallWithHoles('stone', x0 + 6, x1 - 6, 8, h - 50, wallG, doors, shade(stone, -0.05));
  M.box('stone', x0 + 6, x1 - 6, back, wallG, 8, h - 50, stone, { skip: 'ft' });
  for (const o of doors) { M.reveal('stone', o, wallG, 6, shade(stone, -0.25)); M.card('display', o.x0, o.x1, wallG - 6, o.h0, o.h1, cells['opera:door'].rect); }
  M.card('atlas', x0 + 44, x0 + 74, wallG + 0.5, 44, 86, cells['poster:tosca'].rect);
  M.card('atlas', x1 - 74, x1 - 44, wallG + 0.5, 44, 86, cells['poster:flute'].rect);
  
  for (let i = 0; i < 6; i++) {
    const px = x0 + 22 + i * (L.w - 44) / 5;
    M.box('stone', px - 9, px + 9, g - 9, g + 1, 8, 13, '#e2d4bc');
    M.cyl('stone', px, g - 4, 7, 13, h - 62, '#f7efe0', 10, false);
    M.box('stone', px - 10, px + 10, g - 10, g + 2, h - 62, h - 56, '#e2d4bc');
  }
  
  M.box('stone', x0 - 12, x1 + 12, back, g + 3, h - 56, h - 48, '#e9dcc6');
  M.card('atlas', cx - 70, cx + 70, g + 3.5, h - 82, h - 64, cells['opera:sign'].rect);
  M.box('wood', cx - 72, cx + 72, g + 1, g + 3, h - 84, h - 62, '#3a2612', { skip: 'kf' });
  const pd = [[x0 - 14, g + 3, h - 48], [x1 + 14, g + 3, h - 48], [cx, g + 3, h + 2]];
  M.poly('stone', pd, [[0, 0], [4, 0], [2, 1]], '#e9dcc6', [0, 0, 1]);
  M.card('atlas', cx - 44, cx + 44, g + 3.5, h - 46, h - 14, cells.tympanum.rect);
  for (const [ex, s] of [[x0 - 14, -1], [x1 + 14, 1]]) M.poly('roof', [[ex, back, h - 48], [ex, g + 3, h - 48], [cx, g + 3, h + 2], [cx, back, h + 2]], [[0, 0], [0, 1], [3, 1], [3, 0]], '#cdbb9a', [s, 1, 0]);
  
  
  const dg = back + 20;
  M.box('stone', cx - 74, cx + 74, back + 2, dg + 14, h - 48, h + 8, '#ddd0b8');   
  M.cyl('stone', cx, dg, 62, h + 4, h + 30, '#e9dcc6', 20);
  M.box('stone', cx - 66, cx + 66, dg - 3, dg + 30, h + 26, h + 30, '#cdbb9a', { skip: 'k' });
  M.dome('dome', cx, dg, 56, h + 30, 72, '#6a8a7a', 20, 7);
  M.cyl('stone', cx, dg, 9, h + 98, h + 112, '#e9dcc6', 10);
  M.dome('gold', cx, dg, 10, h + 112, 8, L.trim, 10, 3);
  M.box('gold', cx - 1.5, cx + 1.5, dg - 1, dg + 1, h + 118, h + 132, L.trim);
  return M;
}


export function townExtras(M = new Mesher(), cells = atlasCells(atlasIds())) {
  
  const g = 520, b = g - 19;
  M.box('brick', 765, 805, b, g, 0, 190, '#b8926a');
  M.box('stone', 762, 808, b - 2, g + 2, 0, 6, '#a89c84');
  M.box('stone', 762, 808, b - 2, g + 2, 150, 155, '#d8c4a4');
  M.card('display', 770, 800, g + 0.5, 143, 173, cells.clock.rect);
  M.box('wood', 775, 795, g - 1, g + 0.5, 0, 50, '#5a3a2a', { skip: 'k' });
  M.box('stone', 776, 794, g - 1, g + 0.5, 176, 186, '#3a2a22', { skip: 'k' });
  M.pyramid('roof', 759, 811, b - 4, g + 4, 188, 236, '#6b4a3a');
  M.box('gold', 784, 786, (b + g) / 2 - 1, (b + g) / 2 + 1, 234, 248, '#e2c06b');
  
  M.cyl('stone', 785, 566, 32, 0, 9, '#b8a888', 20);
  M.cyl('water', 785, 566, 28, 0, 9.5, '#5a8aa0', 20);
  M.cyl('stone', 785, 566, 4, 9, 30, '#cfc3a8', 8);
  M.cyl('stone', 785, 566, 11, 28, 32, '#cfc3a8', 12);
  M.cyl('water', 785, 566, 3, 32, 44, '#d9ecf0', 6);
  
  for (const [x, y] of LAMPS) {
    M.box('metal', x - 1.8, x + 1.8, y - 1.8, y + 1.8, 0, 44, '#2f2a28');
    M.box('metal', x - 5, x + 5, y - 3, y + 3, 0, 3, '#2f2a28');
    M.box('lampGlass', x - 4, x + 4, y - 3, y + 3, 44, 54, '#fff2bf');
    M.pyramid('metal', x - 7, x + 7, y - 5, y + 5, 54, 60, '#3a3430');
  }
  
  TREES.forEach(([x, y], i) => {
    const s = 0.8 + (i % 3) * 0.15, r = rand(`tree${i}`);
    M.cyl('bark', x, y, 4 * s, 0, 30 * s, '#6b4a2f', 6);
    for (let k = 0; k < 3; k++) {
      const cx = x + (k - 1) * 16 * s + (r() - 0.5) * 6, ch = (40 + (k === 1 ? 18 : 0) + r() * 8) * s, rr = (24 + r() * 6) * s;
      M.dome('leaf', cx, y + (k === 1 ? -2 : 2), rr, ch - rr * 0.55, rr * 0.9, k === 1 ? '#5d8a45' : '#6a9a4f', 9, 3);
      M.dome('leaf', cx, y + (k === 1 ? -2 : 2), rr, ch - rr * 0.55, -rr * 0.5, '#4a7238', 9, 2);
    }
  });
  
  const bx0 = 683, bx1 = 892, bh = 98, bg = 532, cols = ['#d25a6e', '#e8c46a', '#6aa0c8', '#7fb069'];
  for (let i = 0; i < 12; i++) {
    const t0 = i / 12, t1 = (i + 1) / 12, sag = (t) => Math.sin(t * Math.PI) * 18;
    M.box('metal', bx0 + (bx1 - bx0) * t0, bx0 + (bx1 - bx0) * t1, bg - 0.4, bg + 0.4, bh - sag((t0 + t1) / 2) - 0.6, bh - sag((t0 + t1) / 2) + 0.6, '#5a4030');
    if (i > 0) { const fx = bx0 + (bx1 - bx0) * t0, fh = bh - sag(t0); M.poly('cloth', [[fx - 6, bg, fh], [fx + 6, bg, fh], [fx, bg, fh - 13]], [[0, 0], [1, 0], [0.5, 1]], cols[i % 4], [0, 0, 1]); }
  }
  for (const hx of [bx0, bx1]) M.box('metal', hx - 1, hx + 1, 524, bg + 0.6, bh - 1, bh + 1, '#5a4030');   
  
  [[90, 690], [190, 780]].forEach(([x, y], i) => {
    M.poly('wood', [[x - 44, y, 0], [x + 44, y, 0], [x + 30, y, -16], [x - 30, y, -16]], [[0, 0], [1, 0], [1, 1], [0, 1]], i ? '#8a3a2a' : '#5a4a3a', [0, 0, 1]);
    M.poly('wood', [[x - 44, y - 16, 0], [x + 44, y - 16, 0], [x + 44, y, 0], [x - 44, y, 0]], [[0, 0], [1, 0], [1, 1], [0, 1]], '#6b4a2f', [0, 1, 0]);
    M.box('wood', x - 2, x + 2, y - 10, y - 6, 0, 82, '#4a3322');
    M.poly('cloth', [[x + 3, y - 8, 78], [x + 42, y - 8, 8], [x + 3, y - 8, 8]], [[0, 1], [1, 0], [0, 0]], '#f4ead8', [0, 0, 1]);
    M.poly('cloth', [[x - 3, y - 8, 70], [x - 30, y - 8, 10], [x - 3, y - 8, 10]], [[0, 1], [1, 0], [0, 0]], '#e8dcc0', [0, 0, 1]);
  });
  return M;
}


export function hillsGeo(M = new Mesher()) {
  for (const [k, gy, col, hmax] of [[0.4, 214, '#9fb889', 74], [1.7, 252, '#a9c08c', 44]]) {
    const n = 48;
    for (let i = 0; i < n; i++) {
      const xa = -60 + i * 1720 / n, xb = xa + 1720 / n;
      const hh = (x) => hmax * (0.5 + 0.3 * Math.sin(x / 260 + k) + 0.2 * Math.sin(x / 97 + k * 3));
      M.poly('grassFar', [[xa, gy, 0], [xb, gy, 0], [xb, gy - 40, hh(xb)], [xa, gy - 40, hh(xa)]], [[xa / 200, 0], [xb / 200, 0], [xb / 200, 1], [xa / 200, 1]], col, [0, 0.6, 1]);
    }
  }
  return M;
}




const glow = (M, x, gy, h, rx, rh, col) => M.poly('glow', [[x - rx, gy, h - rh], [x + rx, gy, h - rh], [x + rx, gy, h + rh], [x - rx, gy, h + rh]], [[0, 0], [1, 0], [1, 1], [0, 1]], col, [0, 0, 1]);
export function glowGeo(M = new Mesher(), ids = Object.keys(LAYOUT)) {
  ids.forEach((id, i) => {
    const L = LAYOUT[id], g = L.y;
    M.cur = i + 1;
    if (id === 'opera') { for (let k = 0; k < 3; k++) glow(M, L.x - 36 + k * 36, g - 13, 44, 26, 46, '#ffb860'); return; }
    if (L.roof === 'church') { glow(M, L.x, g + 1, L.h + 10, 40, 40, '#ffcf8a'); for (const dx of [-L.w / 2 + 24, L.w / 2 - 24]) glow(M, L.x + dx, g + 1, 96, 18, 40, '#ffcf8a'); return; }
    for (const w of windowSpots(L)) if (w.night && w.h0 > 104) glow(M, (w.x0 + w.x1) / 2, g + 1, (w.h0 + w.h1) / 2, 34, 34, '#ffc870');
    if (L.roof !== 'stall') { const sx = L.x - L.w / 2 + 12 + L.w * 0.28; glow(M, sx, g + 14, 30, L.w * 0.42, 30, '#ffc070'); }
    if (L.lanterns) for (const lx of [L.x - L.w / 2 + 8, L.x, L.x + L.w / 2 - 8]) glow(M, lx, g + 8, L.h - 15, 18, 18, '#ff6a40');
    if (L.neon) glow(M, L.x, g + 7, 95, L.w * 0.5, 22, '#7fc8ff');
  });
  M.cur = 0;
  for (const [x, y] of LAMPS) { glow(M, x, y + 3, 49, 34, 34, '#ffd27a'); glow(M, x, y + 6, 4, 30, 8, '#ffd27a'); }
  return M;
}


export function townGeo(ids = Object.keys(LAYOUT)) {
  const cells = atlasCells(atlasIds()), M = new Mesher(), per = {};
  ids.forEach((id, i) => {
    const before = M.count();
    M.cur = i + 1;
    buildingGeo(id, M, cells);
    per[id] = { tris: M.count() - before };
  });
  M.cur = 0;
  townExtras(M, cells);
  quayGeo(M);
  glowGeo(M, ids);
  hillsGeo(M);
  return { M, per, cells };
}


export const SHORE = [[0, 560], [120, 590], [210, 640], [250, 700], [290, 760], [380, 800], [470, 830]];
export function shorePoints(n = 40) {
  const seg = [[SHORE[0], SHORE[1], SHORE[2], SHORE[3]], [SHORE[3], SHORE[4], SHORE[5], SHORE[6]]], out = [];
  for (const [a, b, c, d] of seg) for (let i = 0; i < n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]);
  }
  out.push(SHORE[6]);
  return out;
}
export const WATER_H = -10;
export function quayGeo(M = new Mesher()) {
  const pts = shorePoints();
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ag] = pts[i], [bx, bg] = pts[i + 1];
    M.poly('stone', [[ax, ag, WATER_H], [bx, bg, WATER_H], [bx, bg, 0], [ax, ag, 0]], [[ax / 30, 0], [bx / 30, 0], [bx / 30, 0.3], [ax / 30, 0.3]], '#b8ab90', [-(bg - ag), 0, (bx - ax)]);
  }
  return M;
}


export function geoHash(M) {
  let h = 2166136261 >>> 0;
  for (const k of Object.keys(M.b).sort()) {
    for (const ch of k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    for (const v of M.b[k].p) h = Math.imul(h ^ (Math.round(v * 100) | 0), 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}


export const screenY = (gy, h) => gy - h;
