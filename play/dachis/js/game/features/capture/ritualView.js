



import { S } from '../../state.js';
import { B, finishRitual } from '../battle/battle.js';
import { judge, expired, dueAt, captureChance, nodeFromDirection, RARITY_CAP } from './ritual.js';
import { createPixelLayer } from '../../../engine/ui/pixelLayer.js';

const $ = id => document.getElementById(id);
const POS = { 1: [0.2, 0.62], 2: [0.5, 0.2], 3: [0.8, 0.62] };
let wired = false, drag = null, stickWas = 0, popups = [];

function wire() {
  if (wired) return; wired = true;
  const cv = $('ritualCanvas');
  const nodeAt = (e) => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    for (const n of [1, 2, 3]) { const [nx, ny] = POS[n]; if (Math.hypot((x - nx) * r.width, (y - ny) * r.height) < 38) return n; }
    return 0;
  };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); drag = { last: 0, x: e.clientX, y: e.clientY }; const n = nodeAt(e); if (n) { drag.last = n; pass(n); } cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; drag.x = e.clientX; drag.y = e.clientY; const n = nodeAt(e); if (n && n !== drag.last) { drag.last = n; pass(n); } });
  const up = () => { drag = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}

export function pass(node) {
  const R = B && B.ritual;
  if (!R || R.i >= R.pattern.nodes.length) return;
  const g = judge(R.pattern, R.i, node, R.t);
  R.grades.push(g); R.trail.push(node); R.i++;
  popups.push({ node, text: g.grade === 'wrong' ? 'Wrong!' : g.grade[0].toUpperCase() + g.grade.slice(1) + '!', t: 0, good: g.score > 0 });
  S.sfx.play(g.grade === 'perfect' ? 'perfect' : g.score > 0 ? 'node' : 'miss');
}


export function updateRitual(dt) {
  const R = B && B.ritual;
  $('ritual').classList.toggle('hidden', !R);
  if (!R) { popups = []; return; }
  wire();
  for (const n of [1, 2, 3]) if (S.input.pressed('rit' + n)) pass(n);
  const st = S.input.stick(), sn = nodeFromDirection(st.x, st.y);
  if (sn && sn !== stickWas && !S.input.touchActive()) pass(sn);
  stickWas = sn;
  while (R.i < R.pattern.nodes.length && expired(R.pattern, R.i, R.t)) { R.grades.push({ grade: 'miss', score: 0 }); R.trail.push(0); popups.push({ node: R.pattern.nodes[R.i], text: 'Miss!', t: 0, good: false }); R.i++; S.sfx.play('miss'); }
  popups.forEach(p => { p.t += dt; }); popups = popups.filter(p => p.t < 0.8);
  if (R.i >= R.pattern.nodes.length && !R.doneAt) R.doneAt = R.t;
  
  if (R.doneAt && R.t - R.doneAt > 0.5) finishRitual(captureChance(R.grades, R.rarity), R.grades.length > 0 && R.grades.every((g) => g.grade === 'perfect'));
  draw(R);
}



let layer = null;
function draw(R) {
  const cv = $('ritualCanvas'), dpr = Math.min(2, devicePixelRatio || 1);
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const L = layer || (layer = createPixelLayer());
  const k = S.stage ? S.stage.h / S.stage.pixel.low.y : 1.5; 
  L.begin(w, h, Math.max(1, Math.round(w / k)), Math.max(1, Math.round(h / k)));
  const P = n => [POS[n][0] * L.w, POS[n][1] * L.h];
  const nodes = R.pattern.nodes, next = R.i < nodes.length ? nodes[R.i] : 0, NR = Math.round(26 / L.k);
  
  const done = R.trail.filter(Boolean);
  if (done.length) {
    const pts = done.map(P);
    if (drag) { const r = cv.getBoundingClientRect(); pts.push(L.at(drag.x - r.left, drag.y - r.top)); }
    for (let i = 1; i < pts.length; i++) { L.line(...pts[i - 1], ...pts[i], '#ff7ab8', 5); L.line(...pts[i - 1], ...pts[i], '#ffe0f0', 1); }
  }
  
  if (next) {
    const prev = done.length ? done[done.length - 1] : 0;
    if (prev && prev !== next) {
      const [ax, ay] = P(prev), [bx, by] = P(next), n = Math.floor(Math.hypot(bx - ax, by - ay) / 6);
      L.alpha(0.6);
      for (let i = 1; i < n; i++) L.rect(ax + (bx - ax) * i / n - 1, ay + (by - ay) * i / n - 1, 2, 2, '#ffffff');
      L.alpha(1);
    }
  }
  const glyph = { keys: { 1: '1', 2: '2', 3: '3' }, pad: { 1: 'X', 2: 'Y', 3: 'B' }, touch: { 1: '', 2: '', 3: '' } }[S.input.mode];
  for (const n of [1, 2, 3]) {
    const [x, y] = P(n), isNext = n === next;
    L.disc(x, y + 2, NR + 1, 'rgba(0,0,0,0.35)'); 
    L.disc(x, y, NR + 1, '#1c1830');
    L.disc(x, y, NR, isNext ? '#ff7ab8' : '#8a78c8');
    L.disc(x - 2, y - 2, NR - 4, isNext ? '#ffb8dc' : '#b4a6e8');
    L.disc(x - Math.round(NR * 0.4), y - Math.round(NR * 0.4), Math.max(1, Math.round(NR * 0.18)), '#ffffff');
    if (glyph && glyph[n]) L.text(glyph[n], x, y - 5, '#ffffff', { s: 2 });
    else L.heart(x, y, 2, '#ffffff');
    if (isNext) { 
      
      
      const room = Math.max(0, Math.min(x, L.w - 1 - x, y, L.h - 1 - y) - 2 - (NR + 2));
      const left = dueAt(R.pattern, R.i) - R.t, kk = Math.max(0, left / R.pattern.beat), rr = NR + 2 + Math.min(1, kk) * Math.min(34 / L.k, room);
      L.alpha(Math.min(1, 1.2 - kk * 0.4)); L.ring(x, y, rr, rr, '#ffffff', 2); L.alpha(1);
    }
  }
  for (const p of popups) {
    const [x, y] = P(p.node);
    L.alpha(1 - p.t / 0.8); L.text(p.text, x, y - NR - 12 - p.t * 20, p.good ? '#ffe46a' : '#ff6a6a', { s: 2 });
  }
  L.alpha(1);
  L.end(ctx, w, h, dpr);
  const cap = Math.round((RARITY_CAP[R.rarity] ?? 1) * 100);
  $('ritualInfo').textContent = `${R.rarity.toUpperCase()} · best chance ${cap}% · pass ${Math.min(R.i + 1, nodes.length)} / ${nodes.length}`;
}
