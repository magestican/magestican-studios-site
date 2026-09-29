






import { G, S } from '../../state.js';
import { B, INTRO, canRitual, startRitual, parryReady } from './battle.js';
import { STATUS_COLOR, statusOf, BEAM_LEN, TRAP_ARM } from './techniques.js';
import { speciesById } from '../../data/species.js';
const spStage = f => speciesById(f.d.sp).stage;
import { setDachiLook } from '../../art/billboards.js';
import { ART } from '../../art/characters.js';
import { createPixelLayer } from '../../../engine/ui/pixelLayer.js';
import { hpFraction, CAPTURE_HP } from './rules.js';
import { frameView, maxBattleVh } from './arena.js';
import { CHAR_SCALE, VIEW_ZOOM } from '../world/crowd.js';
import { toUV, fromUV, screenS, sectionById, viewFor } from '../world/sections.js';

const scr = (x, y, lift = 0) => S.stage.toScreen(x, y, S.W.groundAt(x, y) + lift);
let layer = null;

const fits = (pts, f, aspect) => pts.every(p => Math.abs(p.u - f.u) <= f.vh * aspect / 2 && Math.abs(p.s - f.s) <= f.vh / 2);

export function battleFocus() {
  const W = S.W, aspect = S.stage.w / S.stage.h, sec = S.cam.sec, win = W.windows[sec];
  const pts = [];
  const add = (x, y, top) => { const [u, v] = toUV(x, y), g = W.groundAt(x, y); pts.push({ u, s: screenS(v, g) }, { u, s: screenS(v, g + top) }); };
  add(G.player.x, G.player.y, 1.5 * CHAR_SCALE); add(B.ally.x, B.ally.y, 1.6 * CHAR_SCALE); add(B.enemy.x, B.enemy.y, 1.6 * CHAR_SCALE); 
  
  const maxVh = maxBattleVh(win, sectionById(sec).zoom, aspect), minVh = Math.min(maxVh, viewFor(win, sectionById(sec).zoom * VIEW_ZOOM, aspect).vh * 1.0); 
  let f = frameView(pts, aspect, minVh, maxVh);
  
  if (f.vh >= maxVh - 1e-6 && !fits(pts, f, aspect)) f = frameView(pts.slice(2), aspect, minVh, maxVh);
  const h = W.groundAt(B.cx, B.cy);
  if (B.state !== 'intro') { const j = B.shake * 1.2; return { u: f.u + (Math.random() - 0.5) * j, s: f.s + (Math.random() - 0.5) * j, vh: f.vh, h }; }
  
  const k = 1 - B.timer / INTRO, [eu, ev] = toUV(B.enemy.x, B.enemy.y), es = screenS(ev, W.groundAt(B.enemy.x, B.enemy.y) + 0.8);
  if (k < 0.45) return { u: eu, s: es, vh: minVh * 0.55, h };
  const e = (k - 0.45) / 0.55, m = e * e * (3 - 2 * e);
  return { u: eu + (f.u - eu) * m, s: es + (f.s - es) * m, vh: minVh * 0.55 + (f.vh - minVh * 0.55) * m, h };
}

export function placeFighters(t) {
  for (const f of [B.ally, B.enemy]) {
    const hidden = f === B.enemy && (B.result === 'capture' || (B.capture && B.capture.t > 0.6));
    f.bb.setVisible(!hidden);
    setDachiLook(f.bb, f.d.sp, { corrupt: f.d.corrupt, flip: f.face < 0 });
    const bob = f.walking ? Math.abs(Math.sin(t * 12 + f.side)) * 0.1 : Math.sin(t * 4 + f.side * 2) * 0.03;
    const lx = f.lunge * 0.25 * f.face;
    f.bb.place(f.x + lx * 0.7, f.y - lx * 0.7, S.W.groundAt(f.x, f.y), bob + (f.z || 0));   
    f.bb.setTint(f.flash > 0 ? '#ffb0b0' : f.charge > 0 && Math.floor(t * 16) % 2 ? '#fff0a0' : f.rage > 0 ? '#ffd0c0' : '#ffffff');
  }
}

export function drawBattleOverlay(ctx, t) {
  const ppu = S.stage.pxPerUnit(), low = S.stage.pixel.low;
  const L = layer || (layer = createPixelLayer());
  L.begin(S.stage.w, S.stage.h, low.x, low.y);
  const P = (x, y, lift = 0) => L.at(...scr(x, y, lift)), u = ppu / L.k; 
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  
  const groundRing = (x, y, r, color, th, n = 40, lift = 0) => {
    const pts = [];
    for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2; pts.push(P(x + Math.cos(a) * r, y + Math.sin(a) * r, lift)); }
    for (let k = 0; k < n; k++) L.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], color, th);
    return pts;
  };

  
  
  const [acu, acv] = toUV(B.cx, B.cy), N = 72;
  const arenaPt = (a, grow = 0) => { const [x, y] = fromUV(acu + Math.cos(a) * (B.ru + grow), acv + Math.sin(a) * (B.rv + grow)); return P(x, y); };
  const edge = [], outer = [];
  for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2; edge.push(arenaPt(a)); outer.push(arenaPt(a, 0.1)); }
  const c = L.ctx;
  c.beginPath(); c.rect(-2, -2, L.w + 4, L.h + 4);
  edge.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  c.fillStyle = 'rgba(12,8,36,0.38)'; c.fill('evenodd'); L.used = true;
  L.alpha(0.5 + pulse * 0.25); for (let k = 0; k < N; k++) L.line(outer[k][0], outer[k][1], outer[k + 1][0], outer[k + 1][1], '#ff7ac8', 3);
  L.alpha(1); for (let k = 0; k < N; k++) L.line(edge[k][0], edge[k][1], edge[k + 1][0], edge[k + 1][1], '#ffe182', 1);
  for (let k = 0; k < 24; k++) {
    const [px, py] = edge[(k * 3 + Math.floor(t * 2)) % N], hgt = Math.round(u * 1.2);
    for (let s = 0; s < 3; s++) { L.alpha((0.45 - s * 0.14) * (0.6 + pulse * 0.4)); L.rect(px - 1, py - Math.round(hgt * (s + 1) / 3), 2, Math.ceil(hgt / 3), '#ffe8a0'); }
  }
  L.alpha(1);

  for (const e of B.fx) { 
    if (e.kind !== 'trail') continue;
    const k = e.t / e.life, [px, py] = P(e.x, e.y, 0.5);
    L.alpha((1 - k) * 0.75); L.disc(px, py, u * (e.big ? 0.5 : 0.24) * (1 - k) + 1, e.color);
    if (k < 0.35) L.disc(px, py, Math.max(1, u * 0.07), '#ffffff');
  }
  L.alpha(1);
  drawG12Under(L, P, groundRing, u, t);
  for (const p of B.proj) { 
    const [px, py] = P(p.x, p.y, 0.55), sp = Math.hypot(p.vx, p.vy) || 1;
    const [bx, by] = P(p.x - p.vx / sp * 0.9, p.y - p.vy / sp * 0.9, 0.55), col = typeColor(p.m.type);
    L.alpha(0.5); L.line(bx, by, px, py, col, 3);
    L.alpha(1); L.line((bx + px) / 2, (by + py) / 2, px, py, '#ffffff', 1);
    if (p.big) { L.alpha(0.5); L.disc(px, py, u * 0.7 + 2 * Math.sin(t * 30), col); L.alpha(1); L.disc(px, py, u * 0.45, col); L.disc(px, py, u * 0.22, '#ffffff'); }
    else if (p.m.kind === 'hex') { 
      const sc = STATUS_COLOR[statusOf(p.m)] || col;
      L.disc(px, py, u * 0.2 + 1, '#2a2244'); L.disc(px, py, u * 0.13, col);
      for (let i = 0; i < 2; i++) { const a = t * 14 + i * Math.PI; L.rect(Math.round(px + Math.cos(a) * u * 0.34) - 1, Math.round(py + Math.sin(a) * u * 0.22) - 1, 3, 3, sc); }
    } else if (p.m.kind === 'drain') { 
      L.disc(px, py, u * 0.22 + 1 + Math.sin(t * 25), '#7dff9a'); L.disc(px, py, u * 0.14, col); L.disc(px, py, Math.max(1, u * 0.06), '#ffffff');
    }
    else { L.disc(px, py, u * 0.2 + 1, col); L.disc(px, py, Math.max(1, u * 0.09), '#ffffff'); }
    const g = Math.round(u * 0.3 + 2 * Math.abs(Math.sin(t * 20 + p.x)));
    if (Math.floor(t * 12) % 2) { L.rect(px - g, py, g * 2 + 1, 1, '#ffffff'); L.rect(px, py - g, 1, g * 2 + 1, '#ffffff'); }
    else for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) L.line(px + dx * 2, py + dy * 2, px + dx * g * 0.7, py + dy * g * 0.7, '#ffffff', 1);
  }
  for (const e of B.fx) {
    const k = e.t / e.life;
    if (e.kind === 'spark') { const [px, py] = P(e.x, e.y, e.z); L.alpha(1 - k); L.rect(px - 1, py - 1, 2, 2, k < 0.3 ? '#ffffff' : e.color); }
    else if (e.kind === 'charge') { 
      const r = (1 - k) * 1.8, [px, py] = P(e.x + Math.cos(e.a) * r, e.y + Math.sin(e.a) * r, 0.6 + (1 - k) * 0.8);
      L.alpha(0.5 + k * 0.5); L.rect(px - 1, py - 1, 3, 3, k > 0.7 ? '#ffffff' : e.color);
    }
    else if (e.kind === 'burst') { 
      const [px, py] = P(e.x, e.y, 0.55), r0 = u * (e.big ? 0.95 : 0.65) * (0.45 + k * 0.8);
      L.alpha(1 - k * k);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 + 0.2, l = i % 2 ? 0.55 : 1;
        L.line(px + Math.cos(a) * r0 * 0.35, py + Math.sin(a) * r0 * 0.35, px + Math.cos(a) * r0 * l, py + Math.sin(a) * r0 * l, i % 2 ? e.color : '#ffffff', k < 0.5 ? 2 : 1);
      }
      if (k < 0.35) L.disc(px, py, r0 * 0.28, '#ffffff');
    } else if (e.kind === 'ring') { 
      L.alpha(1 - k); groundRing(e.x, e.y, Math.max(0.05, e.r * k), e.color, k < 0.5 ? 3 : 2, 32, 0.05);
      L.alpha((1 - k) * 0.5); groundRing(e.x, e.y, Math.max(0.05, e.r * k * 0.75), '#ffffff', 1, 32, 0.05);
    } else if (e.kind === 'label') {
      const [px, py] = P(e.x, e.y, 1.6 * CHAR_SCALE);
      L.alpha(1 - k * k); L.text(e.text, px, py - k * 12 - 8 + (e.dy || 0) / L.k, e.color, { s: 2 });
    }
  }
  L.alpha(1);
  drawG12Over(L, P, groundRing, u, t);
  L.alpha(1);
  const cap = B.capture;
  if (cap) { 
    const k = Math.min(1, cap.t / 0.6);
    const [fx0, fy0] = P(cap.from.x, cap.from.y, 1), [ex, ey] = P(B.enemy.x, B.enemy.y, 0.4);
    let x = fx0 + (ex - fx0) * k, y = fy0 + (ey - fy0) * k - Math.sin(k * Math.PI) * 40 / L.k;
    if (cap.t > 0.6) { x = ex + Math.round(Math.sin(cap.t * 14) * (cap.t < 2.6 ? 3 * Math.max(0, Math.sin(cap.t * 5)) : 0)); y = ey; }
    L.alpha(0.5); L.disc(x, y, 9 + pulse * 2, cap.seal ? '#ff8cc8' : '#ffe6a0'); L.alpha(1);
    L.heart(x, y, 2, cap.seal ? '#ff4fa3' : '#ff7ab8');
  }
  
  for (const cl of B.callouts) {
    
    const f = cl.f, s = Math.max(1, Math.min(cl.big ? 4 : 3, Math.floor(L.w / 100), Math.floor((L.w - 30) / (cl.text.length * 4 + 6)))), k = cl.t / cl.life;
    const [fx0, fy0] = P(f.x, f.y, 2.1);
    const w = L.textWidth(cl.text, s) + s * 6, h = 5 * s + s * 5, grow = Math.min(1, cl.t / 0.1);
    
    const x = cl.big ? Math.round(L.w / 2) : Math.round(Math.max(w / 2 + 4, Math.min(L.w - w / 2 - 4, fx0)));
    const y = cl.big ? Math.round(L.h * 0.2 + h / 2) : Math.round(Math.max(L.h * 0.17 + h / 2, fy0 - 10));
    const ww = Math.round(w * grow);
    L.alpha(k > 0.8 ? (1 - k) * 5 : 1);
    L.rect(x - ww / 2 - 2, y - h / 2 - 2, ww + 4, h + 4, '#1c1830');
    L.rect(x - ww / 2, y - h / 2, ww, h, cl.big ? '#ffe14a' : cl.color);
    L.rect(x - ww / 2 + s, y - h / 2 + s, ww - 2 * s, h - 2 * s, '#2a2244');
    if (grow >= 1) L.text(cl.text, x, y - 2.5 * s, cl.big ? '#ffe14a' : '#ffffff', { s });
    if (cl.big) for (let i = 0; i < 6; i++) { const yy = y - h / 2 + (i + 0.5) * h / 6; L.rect(x - ww / 2 - 10 - ((i * 7 + Math.floor(t * 40)) % 12), yy, 6, 1, '#ffe14a'); L.rect(x + ww / 2 + 4 + ((i * 5 + Math.floor(t * 40)) % 12), yy, 6, 1, '#ffe14a'); }
  }
  L.alpha(1);
  
  if (B.ally.hes > 0) {
    const [px, py] = P(B.ally.x, B.ally.y, 1.5 * CHAR_SCALE);
    L.text('?', px, py - 12 - Math.round(Math.abs(Math.sin(t * 10)) * 4), '#ffe14a', { s: 5 });
  }
  for (const n of B.nums) { 
    const [px, py] = P(n.x, n.y, 1.4 * CHAR_SCALE), s = (n.big ? 4 : 3) + (n.t < 0.08 ? 1 : 0);
    if (n.t > 0.85 && Math.floor(n.t * 20) % 2) continue;
    L.text(n.text, px, py - Math.min(n.t, 0.5) * 40 - 5 * s, n.color, { s });
  }
  L.end(ctx, S.stage.w, S.stage.h, Math.min(2, devicePixelRatio || 1));
  if (B.shout) { const [px, py] = scr(G.player.x, G.player.y, 1.8 * CHAR_SCALE); ART.speech(ctx, px, py, B.shout.text); }

  
  if (canRitual() && !B.ritual) {
    const weak = hpFraction(B.enemy.d) < CAPTURE_HP;
    if (weak) {
      const [x, y] = scr(B.enemy.x, B.enemy.y);
      const [, top] = scr(B.enemy.x, B.enemy.y, 1.5 * CHAR_SCALE);
      S.hints.add({ x, y, r: ppu * 0.6, bubbleY: top - 10, action: 'befriend', label: 'Befriend!', color: '#ff9fd0', onTap: startRitual, priority: 3 });
    }
  }
}

const TYPE_COL = { Ember: '#ff6a3d', Tide: '#3d9dff', Leaf: '#4fc45a', Spark: '#ffd23d', Stone: '#b08b5a', Gale: '#7fd8d2', Frost: '#a9dcff', Shadow: '#7a55b0', Light: '#ffe98a', Metal: '#9aa7b5', Beast: '#d98e5b', Spirit: '#e98ad8' };
const typeColor = t => TYPE_COL[t] || '#fff';



function drawG12Under(L, P, groundRing, u, t) {
  for (const q of B.mines) { 
    const [px, py] = P(q.x, q.y, 0.05), col = typeColor(q.m.type), armed = q.t > TRAP_ARM;
    const r = Math.round(u * 0.32), on = !armed || Math.floor(t * 6) % 2;
    L.alpha(0.5); groundRing(q.x, q.y, 0.55 + (armed ? 0.08 * Math.sin(t * 8) : 0), col, 1, 16, 0.03);
    L.alpha(1);
    L.line(px - r, py, px, py - r * 0.6, '#1c1830', 3); L.line(px, py - r * 0.6, px + r, py, '#1c1830', 3);
    L.line(px + r, py, px, py + r * 0.6, '#1c1830', 3); L.line(px, py + r * 0.6, px - r, py, '#1c1830', 3);
    L.line(px - r, py, px, py - r * 0.6, col, 1); L.line(px, py - r * 0.6, px + r, py, col, 1);
    L.line(px + r, py, px, py + r * 0.6, col, 1); L.line(px, py + r * 0.6, px - r, py, col, 1);
    L.disc(px, py, Math.max(1, Math.round(u * 0.1)), on ? '#ffffff' : col);
  }
  for (const e of B.fx) {
    const k = e.t / e.life;
    if (e.kind === 'mark') { 
      L.alpha(0.5 + 0.5 * k); groundRing(e.x, e.y, Math.max(0.1, e.r * (1 - k * 0.6)), e.color, 2, 32, 0.04);
      L.alpha(0.75); groundRing(e.x, e.y, e.r, '#ffffff', 1, 32, 0.04);
      const [px, py] = P(e.x, e.y, 0.04), c = Math.round(u * 0.3);
      L.line(px - c, py, px + c, py, '#ffffff', 1); L.line(px, py - c / 2, px, py + c / 2, '#ffffff', 1);
    } else if (e.kind === 'toss') { 
      const [ax, ay] = P(e.x + (e.x1 - e.x) * k, e.y + (e.y1 - e.y) * k, 0.4 + Math.sin(k * Math.PI) * 1.1);
      L.alpha(1); L.disc(ax, ay, Math.max(1, Math.round(u * 0.12)), e.color);
    }
  }
  L.alpha(1);
}

function pxRing(L, cx, cy, r, color, th = 1) { L.ring(cx, cy, Math.max(1, r), Math.max(1, r * 0.62), color, th); }
const ANY = (f, k) => f && f[k];


function drawG12Over(L, P, groundRing, u, t) {
  for (const f of [B.ally, B.enemy]) {
    const bm = ANY(f, 'beam');
    if (!bm) continue;
    const col = typeColor(bm.m.type), [sx, sy] = P(f.x, f.y, 0.65);
    if (bm.charge > 0) { 
      const g = (1 - bm.charge / 0.35);
      L.alpha(0.5); L.disc(sx, sy, u * (0.2 + g * 0.35), col); L.alpha(1); L.disc(sx, sy, u * g * 0.18 + 1, '#ffffff');
      continue;
    }
    const [ex, ey] = P(f.x + Math.cos(bm.a) * BEAM_LEN, f.y + Math.sin(bm.a) * BEAM_LEN, 0.65);
    const w = u * (0.42 + 0.08 * Math.sin(t * 40));
    L.alpha(0.5); L.line(sx, sy, ex, ey, col, Math.max(3, Math.round(w)));
    L.alpha(1); L.line(sx, sy, ex, ey, col, Math.max(2, Math.round(w * 0.55)));
    L.line(sx, sy, ex, ey, '#ffffff', Math.max(1, Math.round(w * 0.2)));
    for (let i = 0; i < 6; i++) { 
      const s = ((t * 3 + i / 6) % 1), x = sx + (ex - sx) * s, y = sy + (ey - sy) * s;
      L.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, '#ffffff');
    }
    L.alpha(0.75); L.disc(ex, ey, u * 0.3 + 2 * Math.sin(t * 30), col); L.alpha(1);
    L.disc(sx, sy, u * 0.28, '#ffffff');
  }
  for (const e of B.fx) {
    const k = e.t / e.life;
    if (e.t < 0) continue;
    if (e.kind === 'slash') { 
      const [px, py] = P(e.x, e.y, 0.6), r = u * 0.6;
      L.alpha(1 - k);
      for (const off of [0, 1.9]) {
        const a = e.a + off, cx = Math.cos(a) * r, cy = Math.sin(a) * r * 0.7;
        L.line(px - cx, py - cy, px + cx, py + cy, e.color, 3); L.line(px - cx * 0.8, py - cy * 0.8, px + cx * 0.8, py + cy * 0.8, '#ffffff', 1);
      }
    } else if (e.kind === 'parry') { 
      const [px, py] = P(e.x, e.y, 0.6), col = e.color || '#ffffff';
      L.alpha(1 - k);
      if (k < 0.15) L.disc(px, py, u * 0.3 * (1 - k), '#ffffff');
      const g = u * (0.5 + k * 1.4);
      L.line(px - g, py, px + g, py, col, 2); L.line(px, py - g * 0.8, px, py + g * 0.8, col, 2);
      L.line(px - g * 0.5, py - g * 0.5, px + g * 0.5, py + g * 0.5, col, 1); L.line(px - g * 0.5, py + g * 0.5, px + g * 0.5, py - g * 0.5, col, 1);
      pxRing(L, px, py, u * (0.4 + k * 1.6), col, 2);
    } else if (e.kind === 'parryWin') { 
      const [px, py] = P(e.f.x, e.f.y, 0.6);
      L.alpha(0.75); pxRing(L, px, py, u * 0.62, '#ffffff', 1);
    } else if (e.kind === 'up') { 
      const [px, py] = P(e.x, e.y, 0.3 + k * 1.4), c = Math.max(2, Math.round(u * 0.14));
      L.alpha(1 - k); L.line(px - c, py + c, px, py, e.color, 2); L.line(px, py, px + c, py + c, e.color, 2);
    } else if (e.kind === 'drain') { 
      for (let i = 0; i < 5; i++) {
        const s = Math.max(0, Math.min(1, k * 1.4 - i * 0.08));
        const x = e.x + (e.f.x - e.x) * s, y = e.y + (e.f.y - e.y) * s, [px, py] = P(x, y, 0.6 + Math.sin(s * Math.PI) * 0.7);
        L.alpha(1 - k * 0.5); L.rect(px - 1, py - 1, 3, 3, i % 2 ? '#ffffff' : e.color);
      }
    }
  }
  L.alpha(1);
  for (const f of [B.ally, B.enemy]) {
    if (f.shield > 0) { 
      if (f.shield > 1 || Math.floor(t * 10) % 2) {
        const [px, py] = P(f.x, f.y, 0.6), r = u * 0.78;
        L.alpha(0.25); L.disc(px, py, r * 0.9, '#bfe8ff');
        L.alpha(0.75);
        for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI * 2 + t, a1 = a0 + Math.PI / 3; L.line(px + Math.cos(a0) * r, py + Math.sin(a0) * r * 0.9, px + Math.cos(a1) * r, py + Math.sin(a1) * r * 0.9, '#e8f6ff', 1); }
      }
    }
    const top = 0.95 + 0.3 * (spStage(f) - 1);   
    const [hx, hy] = P(f.x, f.y, top + 0.15 + (f.z || 0));
    let ix = hx - 8;
    for (const st of Object.keys(f.status || {})) { 
      const c = STATUS_COLOR[st];
      if (st === 'burn') { const fl = Math.floor(t * 12) % 2; L.rect(ix - 3, hy - 3 - fl, 7, 7 + fl, '#1c1830'); L.rect(ix - 2, hy - 2 - fl, 5, 5 + fl, c); L.rect(ix - 1, hy - 5 - fl, 3, 3, c); L.rect(ix, hy - 1, 1, 2, '#ffe14a'); }
      else if (st === 'slow') { L.rect(ix - 4, hy, 9, 1, c); L.rect(ix, hy - 4, 1, 9, c); L.line(ix - 3, hy - 3, ix + 3, hy + 3, c, 1); L.line(ix - 3, hy + 3, ix + 3, hy - 3, c, 1); L.rect(ix, hy, 1, 1, '#ffffff'); }
      else continue;
      ix += 11;
    }
    const dizzy = f.status && f.status.dizzy > 0, stun = f.stun > 0;
    if (dizzy || stun) { 
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + i * 2.09, [sx, sy] = P(f.x + Math.cos(a) * 0.35, f.y + Math.sin(a) * 0.35, top + (f.z || 0));
        const c = stun ? '#ffffff' : STATUS_COLOR.dizzy;
        L.rect(sx - 2, sy, 5, 1, c); L.rect(sx, sy - 2, 1, 5, c); L.rect(sx - 1, sy - 1, 3, 3, c);
      }
    }
  }
  
  const a = B.ally;
  if (B.state === 'fight' && !B.ritual && a.threat < 0.55) {
    const [px, py] = P(a.x, a.y, 0.6), ready = parryReady();
    L.alpha(ready ? 1 : 0.5);
    pxRing(L, px, py, u * (0.62 + a.threat * 3.2), ready ? '#ffe14a' : '#b8c4d0', 2);
    const [tx, ty] = P(a.x, a.y, 1.55 * CHAR_SCALE);
    if (ready || Math.floor(t * 10) % 2) L.text('!', tx, ty - 22, ready ? '#ffe14a' : '#b8c4d0', { s: 4 });
  }
  L.alpha(1);
}
