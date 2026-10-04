



import { T, VOLC } from '../world/mapgen.js';
import { sectionById, fromUV } from '../world/sections.js';
import { HOME, regionById } from '../world/regions.js';
import { PERCHES, visited as perchVisited } from '../world/travel.js';
import { worldPage, worldUV, localUV, placeOf } from '../world/worldMap.js';

const INK = '#111', PAPER = '#f1e4c3', SEA_INK = 'rgba(70,90,120,.28)';
const land = (W, home, k) => (home ? W.type[k] > T.SHALLOW : W.reach[k] === 1);


function paintLand(ctx, W, home, toPx, tile, tone) {
  ctx.fillStyle = tone;
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    if (!land(W, home, W.idx(i, j))) continue;
    const [x, y] = toPx(i + 0.5, j + 0.5); ctx.fillRect(x - tile / 2, y - tile / 2, tile, tile);
  }
  ctx.fillStyle = INK;
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    if ((i + j) % 2 || !land(W, home, W.idx(i, j))) continue;
    const edge = [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([a, b]) => !W.inMap(i + a, j + b) || !land(W, home, W.idx(i + a, j + b)));
    if (edge) { const [x, y] = toPx(i + 0.5, j + 0.5); ctx.fillRect(x - tile * 0.38, y - tile * 0.38, tile * 0.76, tile * 0.76); }
  }
}

function perchMark(ctx, x, y, r, on) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3);
  if (on) { ctx.fillStyle = '#ff3ea5'; ctx.fill(); ctx.lineWidth = r * 0.45; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = r * 0.22; ctx.strokeStyle = INK; ctx.stroke(); }
  else { ctx.setLineDash([r * 0.5, r * 0.4]); ctx.lineWidth = r * 0.3; ctx.strokeStyle = 'rgba(17,17,17,.6)'; ctx.stroke(); ctx.setLineDash([]); }
  if (on) { 
    ctx.lineWidth = r * 0.28; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.05); ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.5, x, y + r * 0.15);
    ctx.quadraticCurveTo(x + r * 0.2, y - r * 0.5, x + r * 0.55, y - r * 0.05); ctx.stroke();
  }
}
function xMark(ctx, x, y, r) {
  ctx.lineCap = 'round';
  for (const [w, col] of [[r * 1.1, '#fff'], [r * 0.65, '#ff2a3a']]) {
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath();
    ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
  }
}

export function kidDot(ctx, x, y, s) {
  const p = (6 + Math.sin(performance.now() / 150) * 1.5) * s;
  ctx.lineWidth = 3.2 * s; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke();
  ctx.lineWidth = 2 * s; ctx.strokeStyle = '#ff3ea5'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 2.4 * s, 0, 6.3); ctx.fill();
}









const BASE = 2048;
let worldBase = null, worldKey = '';
function paintWorldBase(page, mapOf) {
  const size = BASE, c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), u = size / 100;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = SEA_INK; ctx.lineWidth = 0.3 * u; ctx.lineCap = 'round';
  for (let j = 0; j < 17; j++) for (let i = 0; i < 9; i++) {
    const x = (4 + i * 11 + (j % 2) * 5.5) * u, y = (4 + j * 6) * u;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 1.2 * u, y - 1.1 * u, x + 2.4 * u, y); ctx.quadraticCurveTo(x + 3.6 * u, y - 1.1 * u, x + 4.8 * u, y); ctx.stroke();
  }
  const home = page.places.find((p) => p.region === HOME), W = home && mapOf(HOME);
  if (home && W) {
    const toPx = (x, y) => { const [a, b] = worldUV(HOME, x, y); return [a * size, b * size]; };
    const [cx, cy] = [home.at[0] * size, home.at[1] * size];
    ctx.fillStyle = 'rgba(30,227,207,.2)'; ctx.beginPath(); ctx.arc(cx, cy, home.r * size * 1.04, 0, 6.3); ctx.fill();
    const a = toPx(0, 0), b = toPx(1, 0);
    paintLand(ctx, W, true, toPx, Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.5, '#c3e09a');
    const s = size * 0.026, [vx, vy0] = toPx(VOLC.x, VOLC.y), vy = vy0 - s * 0.6;
    ctx.beginPath(); ctx.moveTo(vx - s, vy + s * 0.6); ctx.lineTo(vx - s * 0.25, vy - s * 0.7); ctx.lineTo(vx + s * 0.25, vy - s * 0.7); ctx.lineTo(vx + s, vy + s * 0.6); ctx.closePath();
    ctx.fillStyle = '#c9a27c'; ctx.fill(); ctx.lineWidth = s * 0.16; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#ff2a3a'; ctx.fillRect(vx - s * 0.25, vy - s * 0.78, s * 0.5, s * 0.22);
  }
  return c;
}


export const KIND_STYLE = {
  town: { fill: '#ffb341', label: 'Town (safe)' }, cave: { fill: '#8a6a9a', label: 'Cave' }, sea: { fill: '#3fb8e0', label: 'Under the sea' },
  forest: { fill: '#4caf50', label: 'Forest' }, ruin: { fill: '#b0a48c', label: 'Ruins' }, peak: { fill: '#9fb4c8', label: 'Cliffs' }, field: { fill: '#9ccc65', label: 'Fields' },
};
function kindIcon(ctx, kind, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 10, r / 10);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 1.4; ctx.strokeStyle = INK; ctx.fillStyle = '#fff';
  const P = (pts) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  if (kind === 'town') { P([[-5, 5], [-5, -1], [0, -5.5], [5, -1], [5, 5]]); ctx.fillStyle = INK; ctx.fillRect(-1.3, 1, 2.6, 4); }
  else if (kind === 'cave') { ctx.beginPath(); ctx.moveTo(-6, 5); ctx.lineTo(-6, 0); ctx.arc(0, 0, 6, Math.PI, 0); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-3, 1); ctx.arc(0, 1, 3, Math.PI, 0); ctx.lineTo(3, 5); ctx.closePath(); ctx.fill(); }
  else if (kind === 'sea') { ctx.lineWidth = 1.8; ctx.strokeStyle = '#fff'; for (const dy of [-3, 1, 5]) { ctx.beginPath(); ctx.moveTo(-6, dy); ctx.quadraticCurveTo(-3, dy - 3, 0, dy); ctx.quadraticCurveTo(3, dy + 3, 6, dy); ctx.stroke(); } }
  else if (kind === 'forest') { P([[0, -7], [5, 0], [2, 0], [6, 5], [-6, 5], [-2, 0], [-5, 0]]); ctx.fillStyle = INK; ctx.fillRect(-1, 5, 2, 2.5); }
  else if (kind === 'ruin') { P([[-6, -5], [6, -5], [6, -3], [-6, -3]]); P([[-5, -3], [-2.5, -3], [-2.5, 5], [-5, 5]]); P([[2.5, -3], [5, -3], [5, 5], [2.5, 5]]); }
  else if (kind === 'peak') { P([[-7, 5], [-2, -5], [1, 0], [3, -2], [7, 5]]); }
  else { ctx.lineWidth = 1.8; ctx.strokeStyle = '#fff'; for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(dx - 1.5, 4); ctx.lineTo(dx, -3); ctx.lineTo(dx + 1.5, 4); ctx.stroke(); } }
  ctx.restore();
}
function sticker(ctx, x, y, r, kind, here) {
  const st = KIND_STYLE[kind] || KIND_STYLE.field;
  ctx.beginPath(); ctx.arc(x + r * 0.18, y + r * 0.22, r, 0, 6.3); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill(); 
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * 0.84, 0, 6.3); ctx.fillStyle = st.fill; ctx.fill(); ctx.lineWidth = r * 0.09; ctx.strokeStyle = INK; ctx.stroke();
  kindIcon(ctx, kind, x, y, r * 0.62);
  if (here) { const p = r * (1.22 + Math.sin(performance.now() / 160) * 0.05); ctx.lineWidth = r * 0.16; ctx.strokeStyle = '#ff3ea5'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke(); }
}

function nameAt(ctx, text, x, y, px, sub) {
  ctx.font = `400 ${px}px "Permanent Marker", cursive`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = px * 0.34; ctx.strokeStyle = PAPER; ctx.strokeText(text, x, y); ctx.fillStyle = INK; ctx.fillText(text, x, y);
  if (sub) { const sp = px * 0.62; ctx.font = `800 ${sp}px Rubik, sans-serif`; ctx.lineWidth = sp * 0.4; ctx.strokeText(sub, x, y + px * 0.85); ctx.fillStyle = '#d81b7a'; ctx.fillText(sub, x, y + px * 0.85); }
}


export function clampView(v) {
  const s = Math.max(1, Math.min(5, v.s)), h = 0.5 / s;
  return { s, cx: Math.max(h, Math.min(1 - h, v.cx)), cy: Math.max(h, Math.min(1 - h, v.cy)) };
}

export function drawWorld(canvas, flags, region, player, mapOf, fontsKey = '', view = { s: 1, cx: 0.5, cy: 0.5 }, doors = [], px = 1) {
  const page = worldPage(flags, region, { doors }), key = fontsKey + page.key;
  if (!worldBase || key !== worldKey) { worldBase = paintWorldBase(page, mapOf); worldKey = key; }
  const v = clampView(view), size = canvas.width, ctx = canvas.getContext('2d');
  const toS = ([a, b]) => [(a - v.cx) * v.s * size + size / 2, (b - v.cy) * v.s * size + size / 2];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, size, size);
  ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, size, size, 18 * px); ctx.clip();
  const sw = BASE / v.s; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(worldBase, (v.cx - 0.5 / v.s) * BASE, (v.cy - 0.5 / v.s) * BASE, sw, sw, 0, 0, size, size);
  const R = (p) => (p.region === HOME ? p.r * v.s * size : Math.max(13 * px, Math.min(30 * px, p.r * v.s * size * 0.55)));
  const edge = (p, toward) => { const c = toS(p.at); if (p.region !== HOME) return c; const d = Math.hypot(toward[0] - c[0], toward[1] - c[1]) || 1, r = R(p) * 0.92; return [c[0] + (toward[0] - c[0]) / d * r, c[1] + (toward[1] - c[1]) / d * r]; };
  
  ctx.setLineDash([7 * px, 6 * px]); ctx.lineWidth = 2.6 * px; ctx.strokeStyle = 'rgba(17,17,17,.55)'; ctx.lineCap = 'round';
  for (const [a, b] of page.links) {
    const pa = page.places.find((p) => p.region === a), pb = page.places.find((p) => p.region === b); if (!pa || !pb) continue;
    const s0 = edge(pa, toS(pb.at)), s1 = edge(pb, toS(pa.at));
    ctx.beginPath(); ctx.moveTo(...s0); ctx.lineTo(...s1); ctx.stroke();
  }
  ctx.setLineDash([]);
  
  const boxes = [];
  for (const p of page.places) {
    if (p.region === HOME) continue;
    const [x, y] = toS(p.at), r = R(p);
    sticker(ctx, x, y, r, p.kind, p.here); boxes.push({ l: x - r, r: x + r, t: y - r, b: y + r });
  }
  for (const p of page.places) for (const q of p.perches) { if (!q.uv) continue; const [x, y] = toS(q.uv); perchMark(ctx, x, y, (v.s > 1.6 ? 7 : 5.5) * px, q.visited && q.open); }
  if (page.x) { const [x, y] = toS(page.x.uv); xMark(ctx, x, y, 7 * px); boxes.push({ l: x - 9 * px, r: x + 9 * px, t: y - 9 * px, b: y + 9 * px }); }
  const uv = worldUV(region, player.x, player.y);
  if (uv) { const [x, y] = toS(uv); kidDot(ctx, x, y, px * 1.2); }
  
  const px13 = 13 * px, order = page.places.slice().sort((a, b) => (b.here - a.here) || (b.region === HOME) - (a.region === HOME) || b.r - a.r);
  const M = 12 * px; 
  const free = (bx) => bx.l >= M && bx.r <= size - M && bx.t >= M && bx.b <= size - M && !boxes.some((o) => bx.l < o.r && bx.r > o.l && bx.t < o.b && bx.b > o.t);
  ctx.font = `400 ${px13}px "Permanent Marker", cursive`;
  for (const p of order) {
    const name = p.name.toUpperCase(), sub = p.here ? 'YOU ARE HERE' : '', w = ctx.measureText(name).width + 10 * px, h = px13 * (sub ? 2 : 1.25);
    const [x, y] = toS(p.at), r = p.region === HOME ? Math.min(R(p) * 0.25, 40 * px) : R(p);
    if (x < 0 || x > size || y < 0 || y > size) continue; 
    const tries = p.region === HOME ? [[0, r + h / 2]] : [[0, r + h / 2 + 2 * px], [0, -r - h / 2 - 2 * px], [r + w / 2 + 3 * px, 0], [-r - w / 2 - 3 * px, 0]];
    let placed = false;
    for (const [dx, dy] of tries) {
      let lx = x + dx, ly = y + dy;
      lx = Math.max(w / 2 + M, Math.min(size - w / 2 - M, lx)); 
      const bx = { l: lx - w / 2, r: lx + w / 2, t: ly - px13 * 0.62, b: ly - px13 * 0.62 + h };
      if (!free(bx)) continue;
      nameAt(ctx, name, lx, ly, px13, sub); boxes.push(bx); placed = true; break;
    }
    if (!placed && p.here) { 
      const lx = Math.max(w / 2 + M, Math.min(size - w / 2 - M, x)), ly = Math.max(M + px13, Math.min(size - M - h, y - r - h / 2 - 4 * px));
      nameAt(ctx, name, lx, ly, px13, sub); boxes.push({ l: lx - w / 2, r: lx + w / 2, t: ly - px13 * 0.62, b: ly - px13 * 0.62 + h });
    }
  }
  ctx.restore();
  ctx.lineWidth = 5 * px; ctx.strokeStyle = INK; ctx.beginPath(); ctx.roundRect(2.5 * px, 2.5 * px, size - 5 * px, size - 5 * px, 16 * px); ctx.stroke();
  return v;
}


let miniBase = null, miniKey = '';
function paintRegionMini(size, W, region, flags) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), u = size / 100, R = regionById(region);
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x * u, y * u, w * u, h * u, [].concat(r).map((k) => k * u)); };
  rr(1.5, 1.5, 97, 97, 5); ctx.fillStyle = '#f4efe0'; ctx.fill();
  
  const toPx = (x, y) => { const [a, b] = localUV(region, x, y); return [(8 + a * 84) * u, (14 + b * 82) * u]; };
  const a = toPx(0, 0), b = toPx(1, 0);
  ctx.save(); rr(1.5, 1.5, 97, 97, 5); ctx.clip();
  paintLand(ctx, W, region === HOME, toPx, Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.5, '#cfe6a8');
  for (const q of PERCHES.filter((p) => p.region === region)) { const [x, y] = toPx(q.at.x, q.at.y); perchMark(ctx, x, y, 4 * u, perchVisited(flags, q.id)); }
  ctx.restore();
  ctx.save(); rr(1.5, 1.5, 97, 13, [4, 4, 0, 0]); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  ctx.font = `800 ${7.2 * u}px Rubik, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.fillText((R ? R.name : region).toUpperCase(), 50 * u, 8.4 * u);
  rr(1.5, 1.5, 97, 97, 5); ctx.lineWidth = 2.6 * u; ctx.strokeStyle = INK; ctx.stroke();
  return { c, toPx };
}
let miniToPx = null;
export function drawRegionMini(canvas, W, region, flags, player, fontsKey = '') {
  const perches = PERCHES.filter((p) => p.region === region).map((p) => +perchVisited(flags, p.id)).join('');
  const key = fontsKey + region + perches;
  if (!miniBase || key !== miniKey) { const m = paintRegionMini(canvas.width, W, region, flags); miniBase = m.c; miniToPx = m.toPx; miniKey = key; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(miniBase, 0, 0);
  const [x, y] = miniToPx(player.x, player.y);
  kidDot(ctx, x, y, canvas.width / 190);
}
export const hasPlace = (region) => !!placeOf(region);
