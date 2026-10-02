



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
function label(ctx, text, x, y, px, align = 'center') {
  ctx.font = `400 ${px}px "Permanent Marker", cursive`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = px * 0.32; ctx.strokeStyle = PAPER; ctx.strokeText(text, x, y);
  ctx.fillStyle = INK; ctx.fillText(text, x, y);
}

export function kidDot(ctx, x, y, s) {
  const p = (6 + Math.sin(performance.now() / 150) * 1.5) * s;
  ctx.lineWidth = 3.2 * s; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke();
  ctx.lineWidth = 2 * s; ctx.strokeStyle = '#ff3ea5'; ctx.beginPath(); ctx.arc(x, y, p, 0, 6.3); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 2.4 * s, 0, 6.3); ctx.fill();
}


let worldBase = null, worldKey = '';
function paintWorld(size, page, mapOf) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), u = size / 100; 
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x * u, y * u, w * u, h * u, [].concat(r).map((k) => k * u)); };
  rr(1.5, 1.5, 97, 97, 5); ctx.fillStyle = PAPER; ctx.fill();
  ctx.save(); rr(1.5, 1.5, 97, 97, 5); ctx.clip();
  
  ctx.strokeStyle = SEA_INK; ctx.lineWidth = 0.35 * u; ctx.lineCap = 'round';
  for (let j = 0; j < 15; j++) for (let i = 0; i < 9; i++) {
    const x = (6 + i * 11 + (j % 2) * 5.5) * u, y = (12 + j * 6) * u;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 1.2 * u, y - 1.1 * u, x + 2.4 * u, y); ctx.quadraticCurveTo(x + 3.6 * u, y - 1.1 * u, x + 4.8 * u, y); ctx.stroke();
  }
  
  for (const p of page.places) {
    const W = mapOf(p.region), home = p.region === HOME, px = ([a, b]) => [a * size, b * size];
    const toPx = (x, y) => px(worldUV(p.region, x, y));
    const [cx, cy] = px(p.at);
    ctx.fillStyle = 'rgba(30,227,207,.18)'; ctx.beginPath(); ctx.arc(cx, cy, p.r * size * 1.02, 0, 6.3); ctx.fill();
    if (W) {
      const a = toPx(0, 0), b = toPx(1, 0), tile = Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.5;
      paintLand(ctx, W, home, toPx, tile, '#c3e09a');
    } else { 
      ctx.fillStyle = '#c3e09a'; ctx.strokeStyle = INK; ctx.lineWidth = 0.4 * u;
      for (const id of regionById(p.region).sections) {
        const r = sectionById(id).rect; ctx.beginPath();
        [[r.u[0], r.v[0]], [r.u[1], r.v[0]], [r.u[1], r.v[1]], [r.u[0], r.v[1]]].forEach(([a, b], k) => { const q = toPx(...fromUV(a, b)); k ? ctx.lineTo(...q) : ctx.moveTo(...q); });
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    if (p.glyph === 'volcano') { 
      const s = size * 0.03, [vx, vy0] = toPx(VOLC.x, VOLC.y), vy = vy0 - s * 1.7; 
      ctx.beginPath(); ctx.moveTo(vx - s, vy + s * 0.6); ctx.lineTo(vx - s * 0.25, vy - s * 0.7); ctx.lineTo(vx + s * 0.25, vy - s * 0.7); ctx.lineTo(vx + s, vy + s * 0.6); ctx.closePath();
      ctx.fillStyle = '#c9a27c'; ctx.fill(); ctx.lineWidth = s * 0.16; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#ff2a3a'; ctx.fillRect(vx - s * 0.25, vy - s * 0.78, s * 0.5, s * 0.22);
    }
    label(ctx, p.name.toUpperCase(), cx, cy + p.r * size * 1.02 + 2.6 * u, 4.4 * u);
    if (p.here) label(ctx, 'YOU ARE HERE', cx, cy - p.r * size * 1.02 - 2.4 * u, 2.8 * u);
  }
  
  for (const p of page.places) for (const q of p.perches) {
    const [x, y] = [q.uv[0] * size, q.uv[1] * size], on = q.visited && q.open;
    perchMark(ctx, x, y, 1.7 * u, on);
    if (q.visited) label(ctx, q.name, x + 2.6 * u, y, 2.6 * u, 'left');
  }
  if (page.x) xMark(ctx, page.x.uv[0] * size, page.x.uv[1] * size, 1.9 * u);
  ctx.restore();
  
  ctx.save(); rr(1.5, 1.5, 97, 9, [4, 4, 0, 0]); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  ctx.font = `800 ${5.2 * u}px Rubik, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.fillText('THE WORLD', 50 * u, 6.3 * u);
  const [nx, ny] = [90 * u, 19 * u];
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(nx, ny - 4 * u); ctx.lineTo(nx + 1.6 * u, ny + 1.5 * u); ctx.lineTo(nx, ny + 0.6 * u); ctx.lineTo(nx - 1.6 * u, ny + 1.5 * u); ctx.closePath(); ctx.fill();
  label(ctx, 'N', nx, ny + 4 * u, 3.2 * u);
  const ky = 92;
  xMark(ctx, 6 * u, ky * u, 1.2 * u); label(ctx, 'NEXT GOAL', 9 * u, ky * u, 2.7 * u, 'left');
  perchMark(ctx, 33 * u, ky * u, 1.3 * u, true); label(ctx, 'AEROWING PERCH', 36 * u, ky * u, 2.7 * u, 'left');
  kidDot(ctx, 67 * u, ky * u, 0.22 * u); label(ctx, 'YOU', 70 * u, ky * u, 2.7 * u, 'left');
  rr(1.5, 1.5, 97, 97, 5); ctx.lineWidth = 1.6 * u; ctx.strokeStyle = INK; ctx.stroke();
  return c;
}

export function drawWorld(canvas, flags, region, player, mapOf, fontsKey = '') {
  const page = worldPage(flags, region), key = fontsKey + canvas.width + page.key;
  if (!worldBase || key !== worldKey) { worldBase = paintWorld(canvas.width, page, mapOf); worldKey = key; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(worldBase, 0, 0);
  const uv = worldUV(region, player.x, player.y);
  if (uv) kidDot(ctx, uv[0] * canvas.width, uv[1] * canvas.width, canvas.width / 380 * 0.9);
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
