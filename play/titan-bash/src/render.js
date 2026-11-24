






import { TUNING as T, secs } from '../../../web-engine/titan-bash/tuning.js';
import { HOUSES, TITANS, WEAPONS } from '../../../web-engine/titan-bash/titans.js';
import { poseFor, spriteFor } from './titanSprites.js';
import { floorPattern, DIM } from './floors.js';
import { ARENAS } from '../../../web-engine/titan-bash/arenas.js';
import { ABILITIES } from '../../../web-engine/titan-bash/abilities.js';
import { bounty, isStorm, stormBounds } from '../../../web-engine/titan-bash/sim.js';


const HOUSE = { ...Object.fromEntries(HOUSES.map((h) => [h.id, h])), dummy: { id: 'dummy', name: 'Target', colour: '#8a93a8' } };
const TAU = Math.PI * 2;


const DISPLAY = "'Ringtitans Teko', system-ui, sans-serif";


export const LIP = 6;



export function layout(w, h, dpr = 1, { hud: withHud = true, arena = 'bellRing' } = {}) {
  const g = Math.max(16 * dpr, Math.round(Math.min(w, h) * 0.02));
  
  const rows = w / dpr < 760 ? 2 : 1;
  const row = Math.max(44 * dpr, Math.round(Math.min(h * 0.09, 96 * dpr)));
  const hud = withHud ? g * 0.6 + rows * row + (rows - 1) * 12 * dpr : -g;
  const A = ARENAS[arena] || ARENAS.bellRing;
  
  
  const lip = LIP * dpr;
  const scale = Math.min((w - g * 2 - lip * 2) / A.w, (h - hud - g * 3 - lip * 2) / A.h);
  const aw = A.w * scale; const ah = A.h * scale;
  
  const free = (h - hud - g * 3) - ah;
  const oy = hud + g * 2 + (rows === 2 ? 0 : free / 2) + ah / 2;
  return { g, hud, row, rows, dpr, scale, ox: (w - aw) / 2 + aw / 2, oy, aw, ah };
}




function drawSleeper(ctx, m, X, Y, s) {
  const S = m.sleeper;
  if (!S || S.phase === 'asleep' || S.phase === 'down') return;
  const cx = X(S.x); const cy = Y(S.y);
  if (S.phase === 'warn') {
    const k = 0.5 + 0.5 * Math.sin(m.tick * 0.4);
    ctx.strokeStyle = `rgba(255,${120 + 80 * k},60,${0.6 + 0.4 * k})`; ctx.lineWidth = Math.max(3, s * 0.35);
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) { ctx.lineTo(cx + i * s * 1.4, cy + (i % 2 ? -1 : 1) * s * 0.5); }
    ctx.stroke();
    return;
  }
  if (S.attack === 'telegraph') {
    const k = 1 - S.timer / Math.max(1, secs(T.sleeperTelegraph));
    const half = (T.sleeperArc / 2) * (Math.PI / 180); const R = T.sleeperReach * s;
    ctx.fillStyle = `rgba(255,40,40,${0.18 + 0.32 * k})`;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, S.aim - half, S.aim + half); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,90,70,0.95)'; ctx.lineWidth = Math.max(3, s * 0.3); ctx.stroke();
    
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(S.aim - half + 2 * half * k) * R, cy + Math.sin(S.aim - half + 2 * half * k) * R); ctx.stroke();
  }
  
  const bx = cx - Math.cos(S.dir) * s * 2.6; const by = cy - Math.sin(S.dir) * s * 2.6;
  
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath(); ctx.ellipse(bx + s * 0.4, by + s * 0.6, s * 5.5, s * 2.6, S.dir + Math.PI / 2, 0, TAU); ctx.fill();
  const sg = ctx.createRadialGradient(bx - s * 1.2, by - s * 1.6, s * 0.4, bx, by, s * 5.5);
  sg.addColorStop(0, '#8a6a7e'); sg.addColorStop(0.5, '#4a3448'); sg.addColorStop(1, '#22161f');
  ctx.fillStyle = sg; ctx.strokeStyle = '#140c12'; ctx.lineWidth = Math.max(2, s * 0.2);
  ctx.beginPath(); ctx.ellipse(bx, by, s * 5.5, s * 2.6, S.dir + Math.PI / 2, 0, TAU); ctx.fill(); ctx.stroke();
  const glow = 0.6 + 0.4 * Math.sin(m.tick * 0.2);
  ctx.fillStyle = `rgba(255,150,60,${0.25 * glow})`;
  ctx.beginPath(); ctx.arc(cx, cy, T.sleeperCoreR * s * 1.7, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb03c'; ctx.strokeStyle = '#fff1c9';
  ctx.beginPath(); ctx.arc(cx, cy, T.sleeperCoreR * s, 0, TAU); ctx.fill(); ctx.stroke();
  for (let i = 0; i < T.sleeperCoreHits; i++) {
    const a = -Math.PI / 2 + (i / T.sleeperCoreHits) * TAU;
    ctx.fillStyle = i < T.sleeperCoreHits - S.hits ? '#fff1c9' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * T.sleeperCoreR * s * 1.45, cy + Math.sin(a) * T.sleeperCoreR * s * 1.45, Math.max(2, s * 0.28), 0, TAU); ctx.fill();
  }
}

export function draw(ctx, m, fx, L, opts = {}) {
  const { width: W, height: H } = ctx.canvas;
  const A = ARENAS[m.arena];
  const s = L.scale;
  const X = (x) => L.ox + x * s; const Y = (y) => L.oy + y * s;
  const storm = isStorm(m);
  ctx.save();
  ctx.fillStyle = '#06080d'; ctx.fillRect(0, 0, W, H);
  

  
  const fx0 = X(-A.w / 2); const fy0 = Y(-A.h / 2);
  if (A.floor) {
    
    ctx.fillStyle = storm ? '#1a1838' : '#0b2a3a';
    ctx.fillRect(fx0, fy0, L.aw, L.ah);
    ctx.strokeStyle = 'rgba(140,210,255,0.16)'; ctx.lineWidth = Math.max(1.5, s * 0.12);
    ctx.beginPath();
    for (let y = -A.h / 2 + 2; y < A.h / 2; y += 3) {
      for (let x = -A.w / 2; x < A.w / 2; x += 4) {
        const ph = (m.tick * 0.05 + x * 0.3 + y) % 4;
        ctx.moveTo(X(x + ph * 0.3), Y(y)); ctx.quadraticCurveTo(X(x + 1 + ph * 0.3), Y(y - 0.5), X(x + 2 + ph * 0.3), Y(y));
      }
    }
    ctx.stroke();
    const lip = Math.max(3, s * 0.25);
    hazardLip(ctx, A.floor.map((f) => [X(f.x - f.w / 2) - lip, Y(f.y - f.h / 2) - lip, f.w * s + lip * 2, f.h * s + lip * 2]), lip);
    const stone = floorPattern(ctx, m.arena, s, fx0, fy0);
    ctx.fillStyle = stone || (storm ? '#2a2140' : '#1d2536');
    for (const f of A.floor) ctx.fillRect(X(f.x - f.w / 2), Y(f.y - f.h / 2), f.w * s, f.h * s);
    if (stone) {
      ctx.fillStyle = storm ? `rgba(40,20,80,${DIM + 0.15})` : `rgba(8,12,22,${DIM})`;
      for (const f of A.floor) ctx.fillRect(X(f.x - f.w / 2), Y(f.y - f.h / 2), f.w * s, f.h * s);
    }
    
    if (m.tide && m.tide.warn > 0) {
      const f = A.floor[m.tide.bridge];
      const k = 1 - m.tide.warn / secs(T.tideWarn);
      ctx.fillStyle = `rgba(120,200,255,${0.18 + 0.35 * k + 0.12 * Math.sin(m.tick * 0.4)})`;
      ctx.fillRect(X(f.x - f.w / 2), Y(f.y - f.h / 2), f.w * s, f.h * s);
      ctx.fillStyle = '#e6f6ff'; ctx.font = `700 ${Math.round(s * 1.6)}px system-ui, sans-serif`; ctx.textAlign = 'center';
      for (const lx of tideLabelXs(f, m.sleeper)) ctx.fillText('TIDE', X(lx), Y(f.y) + s * 0.55);
    }
  } else if (A.openEdges) {
    const lip = LIP * L.dpr;
    hazardLip(ctx, [[fx0 - lip, fy0 - lip, L.aw + lip * 2, L.ah + lip * 2]], lip);
  }
  if (!A.floor) {
    const deck = floorPattern(ctx, m.arena, s, fx0, fy0);
    ctx.fillStyle = deck || (storm ? '#2a2140' : '#1d2536');
    ctx.fillRect(fx0, fy0, L.aw, L.ah);
    if (deck) { ctx.fillStyle = storm ? `rgba(40,20,80,${DIM + 0.15})` : `rgba(8,12,22,${DIM})`; ctx.fillRect(fx0, fy0, L.aw, L.ah); }
    ctx.strokeStyle = storm ? 'rgba(190,150,255,0.10)' : 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -A.w / 2; x <= A.w / 2; x += 4) { ctx.moveTo(X(x), fy0); ctx.lineTo(X(x), fy0 + L.ah); }
    for (let y = -A.h / 2; y <= A.h / 2; y += 4) { ctx.moveTo(fx0, Y(y)); ctx.lineTo(fx0 + L.aw, Y(y)); }
    ctx.stroke();
  }

  
  
  if (storm) {
    const { hw, hh } = stormBounds(m);
    const pulse = 0.55 + 0.25 * Math.sin(m.tick * 0.25);
    ctx.fillStyle = `rgba(150,90,255,${0.28 * pulse + 0.12})`;
    ctx.beginPath(); ctx.rect(fx0, fy0, L.aw, L.ah); ctx.rect(X(-hw), Y(-hh), hw * 2 * s, hh * 2 * s); ctx.fill('evenodd');
    ctx.strokeStyle = `rgba(225,200,255,${pulse})`; ctx.lineWidth = Math.max(3, s * 0.3);
    ctx.strokeRect(X(-hw), Y(-hh), hw * 2 * s, hh * 2 * s);
    drawStormCrackle(ctx, stormCrackle(m.tick, hw, hh), X, Y, s);
  }

  
  drawCover(ctx, A, X, Y, s);
  
  drawCrystals(ctx, m, X, Y, s);

  
  for (const c of m.lumen || []) {
    const cx = X(c.x); const cy = Y(c.y) - Math.sin(m.tick * 0.08 + c.x) * s * 0.15; const r = s * 0.7;
    ctx.fillStyle = 'rgba(120,240,255,0.22)'; ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8ff6ff'; ctx.strokeStyle = '#e8feff'; ctx.lineWidth = Math.max(1.5, s * 0.1);
    ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.3); ctx.lineTo(cx + r * 0.75, cy); ctx.lineTo(cx, cy + r * 1.3); ctx.lineTo(cx - r * 0.75, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  
  drawLighting(ctx, L);

  drawSleeper(ctx, m, X, Y, s);

  
  ctx.save(); ctx.beginPath(); ctx.rect(fx0, fy0, L.aw, L.ah); ctx.clip();
  for (const sh of m.shots) {
    const col = HOUSE[m.titans[sh.owner]?.house]?.colour || '#fff';
    if (sh.kind === 'lob') {
      const k = sh.maxLife ? sh.life / sh.maxLife : 0.5;
      drawLobMark(ctx, X(sh.x), Y(sh.y), sh.splash * s, sh.seed ? '#ff3b3b' : col, lobMark(k, sh.splash * s, m.tick), s);
    } else {
      const [nx, ny] = norm(sh.vx, sh.vy);
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, s * 0.35); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(sh.x - nx * 1.2), Y(sh.y - ny * 1.2)); ctx.lineTo(X(sh.x), Y(sh.y)); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, s * 0.12);
      ctx.beginPath(); ctx.moveTo(X(sh.x - nx * 0.6), Y(sh.y - ny * 0.6)); ctx.lineTo(X(sh.x), Y(sh.y)); ctx.stroke();
    }
  }

  ctx.restore();

  
  for (const d of m.decoys || []) {
    const t = m.titans[d.owner];
    ctx.globalAlpha = 0.45; body(ctx, X(d.x), Y(d.y), s, HOUSE[t.house].colour, d.facing); ctx.globalAlpha = 1;
  }

  const big = bounty(m);
  
  drawShadows(ctx, shadowSpots(m, X, Y, s));
  
  for (const t of m.titans.filter((o) => o.alive).sort((a, b) => a.y - b.y)) titan(ctx, m, t, X, Y, s, t === big, opts);
  if (opts.juice) opts.juice.draw(ctx, X, Y, s);

  
  for (const f of fx) {
    const a = Math.min(1, f.ttl / 20);
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (f.kind === 'banner') {
      
      
      const px = bannerPx(ctx, f.text, s, A.w * s);
      ctx.font = `800 ${px}px ${DISPLAY}`;
      
      
      const by = Y(-A.h / 2) + s * 3;
      const pl = bannerPlate(ctx.measureText(f.text).width, px, L.ox, by);
      ctx.fillStyle = 'rgba(6,8,13,0.72)'; roundRect(ctx, pl.x, pl.y, pl.w, pl.h, pl.h * 0.2); ctx.fill();
      ctx.lineWidth = Math.max(3, px * 0.16); ctx.strokeStyle = '#000'; ctx.fillStyle = f.colour || '#fff';
      ctx.strokeText(f.text, L.ox, by); ctx.fillText(f.text, L.ox, by);
    } else {
      ctx.font = `800 ${Math.round(s * (f.big ? 1.8 : 1.2))}px ${DISPLAY}`;
      ctx.lineWidth = Math.max(3, s * 0.25); ctx.strokeStyle = '#000'; ctx.fillStyle = f.colour || '#fff';
      const yy = Y(f.y) - (60 - f.ttl) * 0.02 * s;
      ctx.strokeText(f.text, X(f.x), yy); ctx.fillText(f.text, X(f.x), yy);
    }
    ctx.globalAlpha = 1;
  }

  ctx.translate(-shx, -shy);
  if (!m.endless) scoreboard(ctx, m, L, W, big); 
  if (opts.countdown) drawCountdown(ctx, L, opts.countdown);
  ctx.restore();
}









export const TIDE_LABEL_SPLIT = 11;
export function tideLabelXs(f, sleeper) {
  const up = sleeper && sleeper.phase !== 'asleep' && sleeper.phase !== 'down';
  const reach = T.sleeperCoreR * 1.7;
  const near = up && Math.abs(sleeper.x - f.x) < reach + 2.5 && Math.abs(sleeper.y - f.y) < f.h / 2 + reach;
  return near ? [f.x - TIDE_LABEL_SPLIT, f.x + TIDE_LABEL_SPLIT] : [f.x];
}

export function drawCover(ctx, A, X, Y, s) {
  const off = Math.max(2, s * 0.35);
  const edge = Math.max(2, s * 0.15);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  for (const c of A.circles) { ctx.beginPath(); ctx.arc(X(c.x) + off, Y(c.y) + off * 1.4, c.r * s, 0, TAU); ctx.fill(); }
  for (const b of A.boxes) ctx.fillRect(X(b.x - b.w / 2) + off, Y(b.y - b.h / 2) + off * 1.4, b.w * s, b.h * s);
  for (const c of A.circles) {
    const cx = X(c.x); const cy = Y(c.y); const r = c.r * s;
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#9aa7c6'); g.addColorStop(0.55, '#55617f'); g.addColorStop(1, '#2c3449');
    ctx.fillStyle = g; ctx.strokeStyle = '#1a2030'; ctx.lineWidth = edge;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,232,255,0.55)'; ctx.lineWidth = Math.max(1.5, s * 0.1);
    ctx.beginPath(); ctx.arc(cx, cy, r - edge, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
  }
  for (const b of A.boxes) {
    const x = X(b.x - b.w / 2); const y = Y(b.y - b.h / 2); const w = b.w * s; const h = b.h * s;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#7d8aa8'); g.addColorStop(0.45, '#505c7a'); g.addColorStop(1, '#2e3650');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = edge; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(225,236,255,0.6)'; ctx.fillRect(x + edge, y + edge * 0.5, w - edge * 2, Math.max(1.5, s * 0.12));
  }
  ctx.restore();
}






export function heatRing(painted, cx, cy, r, s) {
  if (!painted) { const R = r + s * 0.55; return { x: cx, y: cy, rx: R, ry: R }; }
  return { x: cx, y: cy + r * 0.7, rx: r * 1.45, ry: r * 0.55 };
}


function drawHeatRing(ctx, m, t, g, s) {
  const k0 = g.ry / g.rx;
  const ell = (grow, a0, a1) => { ctx.beginPath(); ctx.ellipse(g.x, g.y, g.rx + grow, g.ry + grow * k0, 0, a0, a1); ctx.stroke(); };
  ctx.lineWidth = Math.max(3, s * 0.32); ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ell(0, 0, TAU);
  if (t.stall > 0) {
    const flash = (m.tick >> 3) % 2 === 0;
    ctx.strokeStyle = flash ? '#ff3b3b' : '#a01818'; ell(0, 0, TAU);
    const k = Math.max(0, 1 - t.stallAge / secs(T.ventMarkAt));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, s * 0.18); ell(k * s * 3, 0, TAU);
  } else if (t.heat > 0) {
    ctx.strokeStyle = t.heat >= T.redLine ? '#ff3b3b' : t.heat >= T.redLine * 0.7 ? '#ffb02e' : '#e9f0ff';
    ell(0, -Math.PI / 2, -Math.PI / 2 + TAU * (t.heat / 100));
  }
}







export function lungeTrail(painted, cx, cy, dx, dy, r, s) {
  const y = painted ? cy + r * 0.7 : cy;
  const [nx, ny] = norm(dx, dy);
  const len = Math.max(r * 2.5, Math.hypot(dx, dy) * s * 5);
  return { x0: cx, y0: y, x1: cx - nx * len, y1: y - ny * len, nx, ny, head: r * 1.05, tail: 0, flat: painted ? 0.42 : 1 };
}

function drawLungeTrail(ctx, g, colour) {
  
  const px = -g.ny * g.head; const py = g.nx * g.head * g.flat;
  const grad = ctx.createLinearGradient(g.x0, g.y0, g.x1, g.y1);
  grad.addColorStop(0, colour); grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(g.x0 + px, g.y0 + py); ctx.lineTo(g.x1, g.y1); ctx.lineTo(g.x0 - px, g.y0 - py); ctx.closePath(); ctx.fill();
  
  ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, g.head * 0.08); ctx.globalAlpha = 0.45;
  for (const f of [-0.45, 0.45]) {
    ctx.beginPath(); ctx.moveTo(g.x0 + px * f, g.y0 + py * f);
    ctx.lineTo(g.x0 + (g.x1 - g.x0) * 0.7 + px * f * 0.3, g.y0 + (g.y1 - g.y0) * 0.7 + py * f * 0.3); ctx.stroke();
  }
  ctx.restore();
}







export function lobMark(k, R, tick) {
  const near = 1 - Math.max(0, Math.min(1, k));
  return { glow: 0.08 + 0.22 * near, rim: 0.3 + 0.55 * near, dash: [R * 0.3, R * 0.2], offset: -tick * 0.6, closing: R * (1 - near) };
}

function drawLobMark(ctx, x, y, R, colour, mk, s) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, R * 0.35, x, y, R);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, colour);
  ctx.globalAlpha = mk.glow; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  ctx.globalAlpha = mk.rim; ctx.strokeStyle = colour; ctx.lineWidth = Math.max(1.5, s * 0.12);
  ctx.setLineDash(mk.dash); ctx.lineDashOffset = mk.offset; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
  ctx.setLineDash([]); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.1);
  ctx.beginPath(); ctx.arc(x, y, Math.max(1, mk.closing), 0, TAU); ctx.stroke();
  ctx.restore();
}






export function bodyBubble(painted, cx, cy, r, s) {
  if (!painted) { const R = r + s * 1.2; return { x: cx, y: cy, rx: R, ry: R }; }
  return { x: cx, y: cy - r, rx: r * 1.6, ry: r * 2.05 };
}

function drawBubble(ctx, b, colour, width) {
  ctx.save(); ctx.translate(b.x, b.y); ctx.scale(1, b.ry / b.rx);
  const g = ctx.createRadialGradient(0, 0, b.rx * 0.55, 0, 0, b.rx);
  g.addColorStop(0, 'rgba(111,243,255,0)'); g.addColorStop(1, 'rgba(111,243,255,0.32)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.rx, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
}





export const TARGET_RINGS = [
  { k: 1, c: '#2a3142' }, { k: 0.86, c: '#eef1f7' }, { k: 0.66, c: '#e0402e' }, { k: 0.46, c: '#eef1f7' }, { k: 0.26, c: '#e0402e' },
];

export function drawTarget(ctx, cx, cy, r, s) {
  const R = r * 1.15;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(cx + s * 0.25, cy + s * 0.4, R, 0, TAU); ctx.fill();
  for (const ring of TARGET_RINGS) { ctx.fillStyle = ring.c; ctx.beginPath(); ctx.arc(cx, cy, R * ring.k, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1.5, s * 0.12);
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.93, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
}


export function shadowSpots(m, X, Y, s) {
  const r = T.radius * s;
  return m.titans.filter((t) => t.alive).map((t) => ({ id: t.id, x: X(t.x), y: Y(t.y) + r * 0.7, rx: r * 1.35, ry: r * 0.55 }));
}


export function drawShadows(ctx, spots) {
  for (const p of spots) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, p.ry / p.rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.rx);
    g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(0.55, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.rx, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}


export function drawLighting(ctx, L) {
  const x0 = L.ox - L.aw / 2; const y0 = L.oy - L.ah / 2;
  const cy = L.oy - L.ah * 0.18;
  const g = ctx.createRadialGradient(L.ox, cy, Math.min(L.aw, L.ah) * 0.12, L.ox, cy, Math.hypot(L.aw, L.ah) * 0.62);
  g.addColorStop(0, 'rgba(255,236,200,0.06)'); g.addColorStop(0.5, 'rgba(4,6,12,0.08)'); g.addColorStop(1, 'rgba(4,6,12,0.38)');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, L.aw, L.ah);
}


function drawCountdown(ctx, L, cd) {
  const px = Math.round(Math.min(L.aw, L.ah) * 0.22 * cd.scale);
  ctx.save();
  ctx.globalAlpha = cd.alpha; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${px}px ${DISPLAY}`;
  ctx.lineWidth = Math.max(4, px * 0.08); ctx.strokeStyle = '#000';
  ctx.fillStyle = cd.label === 'BASH!' ? '#ff8a1f' : '#ffd040';
  ctx.strokeText(cd.label, L.ox, L.oy); ctx.fillText(cd.label, L.ox, L.oy);
  ctx.restore();
}


export function bannerPx(ctx, text, s, arenaPx) {
  const want = Math.round(s * 2.2);
  ctx.font = `800 ${want}px ${DISPLAY}`;
  const w = ctx.measureText(text).width;
  const room = arenaPx * 0.92;
  return w <= room ? want : Math.max(12, Math.floor(want * room / w));
}

function norm(x, y) { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }

function body(ctx, cx, cy, s, colour, facing) {
  const r = T.radius * s;
  ctx.fillStyle = colour; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = Math.max(2, s * 0.18);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
  
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(facing) * r * 1.25, cy + Math.sin(facing) * r * 1.25);
  ctx.lineTo(cx + Math.cos(facing + 2.5) * r * 0.55, cy + Math.sin(facing + 2.5) * r * 0.55);
  ctx.lineTo(cx + Math.cos(facing - 2.5) * r * 0.55, cy + Math.sin(facing - 2.5) * r * 0.55);
  ctx.closePath(); ctx.fill();
}

function titan(ctx, m, t, X, Y, s, isBounty, opts) {
  const h = HOUSE[t.house];
  let cx = X(t.x); let cy = Y(t.y);
  if (t.rattled > 0) { cx += Math.sin(m.tick * 2.1) * s * 0.25; cy += Math.cos(m.tick * 2.7) * s * 0.25; }
  const r = T.radius * s;
  const spr = t.house !== 'dummy' && spriteFor(t.frame, h.colour);
  const fr = spr && spr.byName[poseFor(t, m.tick, secs(WEAPONS[TITANS[t.frame]?.weapon]?.cooldown || 0))];
  const bub = bodyBubble(!!fr, cx, cy, r, s);

  if (t.overdrive > 0 || t.lumenTime > 0 || isBounty) {
    ctx.fillStyle = t.overdrive > 0 || t.lumenTime > 0 ? 'rgba(120,230,255,0.30)' : 'rgba(255,208,64,0.30)';
    ctx.beginPath(); ctx.ellipse(bub.x, bub.y, bub.rx * 1.15, bub.ry * 1.1, 0, 0, TAU); ctx.fill();
  }
  
  for (let i = 0; i < (t.lumen || 0); i++) {
    const lx = cx + (i - ((t.lumen || 0) - 1) / 2) * s * 0.9; const ly = cy - r * 2.3;
    ctx.fillStyle = '#8ff6ff'; ctx.beginPath();
    ctx.moveTo(lx, ly - s * 0.4); ctx.lineTo(lx + s * 0.25, ly); ctx.lineTo(lx, ly + s * 0.4); ctx.lineTo(lx - s * 0.25, ly);
    ctx.closePath(); ctx.fill();
  }
  
  if (opts.humans && opts.humans.has(t.id)) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, s * 0.12); ctx.setLineDash([s * 0.6, s * 0.5]);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(t.facing) * r * 1.4, cy + Math.sin(t.facing) * r * 1.4);
    ctx.lineTo(cx + Math.cos(t.facing) * r * 5, cy + Math.sin(t.facing) * r * 5); ctx.stroke(); ctx.setLineDash([]);
  }
  if (t.lunge > 0) drawLungeTrail(ctx, lungeTrail(!!fr, cx, cy, t.lungeDx, t.lungeDy, r, s), h.colour);
  let top = cy - r; 
  if (fr) {
    
    
    
    const hgt = r * 3.4; const wid = hgt * (fr.w / fr.h); const feet = cy + r * 0.7;
    ctx.strokeStyle = h.colour; ctx.lineWidth = Math.max(2, s * 0.22);
    ctx.beginPath(); ctx.ellipse(cx, feet, r * 1.1, r * 0.42, 0, 0, TAU); ctx.stroke();
    
    drawHeatRing(ctx, m, t, heatRing(true, cx, cy, r, s), s);
    ctx.save(); ctx.translate(cx, feet);
    if (Math.cos(t.facing) < 0) ctx.scale(-1, 1);
    if (t.hitstop > 0 || opts.juice?.flashing?.(t.id)) ctx.filter = 'brightness(2.2)';
    ctx.drawImage(spr.canvas, fr.x, fr.y, fr.w, fr.h, -wid / 2, -hgt, wid, hgt);
    ctx.restore();
    
    top = Math.min(top, feet - hgt * 0.94);
  } else if (t.dummy) {
    
    if (t.hitstop > 0 || opts.juice?.flashing?.(t.id)) ctx.filter = 'brightness(1.8)';
    drawTarget(ctx, cx, cy, r, s); ctx.filter = 'none';
  } else { body(ctx, cx, cy, s, h.colour, t.facing); drawHeatRing(ctx, m, t, heatRing(false, cx, cy, r, s), s); }
  
  
  const paint = opts.paints && opts.paints[t.id];
  if (paint) {
    ctx.strokeStyle = paint; ctx.lineWidth = Math.max(2, s * 0.28);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, TAU); ctx.stroke();
  }

  
  if (t.shield > 0) drawBubble(ctx, bub, '#6ff3ff', Math.max(2, s * 0.15));
  if (t.aegis > 0) {
    const half = (ABILITIES.aegis.arc / 2) * (Math.PI / 180);
    ctx.strokeStyle = '#9fe3ff'; ctx.lineWidth = Math.max(4, s * 0.5);
    ctx.beginPath(); ctx.ellipse(bub.x, bub.y, bub.rx + s * 0.3, bub.ry + s * 0.3, 0, t.facing - half, t.facing + half); ctx.stroke();
  }

  
  
  const bw = s * 4; const by = fr ? top - s * 0.6 : cy - r - s * 1.6;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(cx - bw / 2, by, bw, Math.max(4, s * 0.4));
  ctx.fillStyle = t.armour / t.maxArmour > 0.35 ? '#7dff8a' : '#ff5a3c';
  ctx.fillRect(cx - bw / 2, by, bw * Math.max(0, t.armour / t.maxArmour), Math.max(4, s * 0.4));
  if (t.rattle > 0) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(cx - bw / 2, by + Math.max(4, s * 0.4), bw * Math.min(1, t.rattle / 100), Math.max(2, s * 0.15)); }
  ctx.font = `700 ${Math.max(11, Math.round(s * 0.95))}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
  const label = (opts.labels && opts.labels[t.id]) || h.name;
  ctx.strokeText(label, cx, by - 2); ctx.fillText(label, cx, by - 2);
  
  if (t.rookie) leaf(ctx, cx - ctx.measureText(label).width / 2 - s * 0.7, by - 2 - s * 0.5, s * 0.6);
  
  
  const tag = teamTag(m, t);
  if (tag) teamBadge(ctx, cx + ctx.measureText(label).width / 2 + s * 0.35, by - 2, s, tag);
}



export const TEAM_BADGE = Object.freeze([
  Object.freeze({ fill: '#f4f6fb', ink: '#0a0d15' }), Object.freeze({ fill: '#1d2438', ink: '#ffffff' }),
  Object.freeze({ fill: '#ffd040', ink: '#1a1205' }), Object.freeze({ fill: '#5fe0ff', ink: '#05202a' }),
]);

export function teamTag(m, t) {
  return m && m.mode === 'team' && t && Number.isInteger(t.team) && t.team >= 0 && t.team < TEAM_BADGE.length ? `T${t.team + 1}` : '';
}
function teamBadge(ctx, x, baseline, s, tag) {
  const team = Number(tag.slice(1)) - 1; const look = TEAM_BADGE[team];
  const h = Math.max(14, s * 1.1); const w = Math.max(22, s * 1.7); const y = baseline - h;
  ctx.save();
  ctx.fillStyle = look.fill; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = look.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.max(10, Math.round(h * 0.7))}px system-ui, sans-serif`;
  ctx.fillText(tag, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function leaf(ctx, x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6);
  ctx.fillStyle = '#5fd06a'; ctx.strokeStyle = '#0b2a10'; ctx.lineWidth = Math.max(1, k * 0.25);
  ctx.beginPath(); ctx.ellipse(0, 0, k, k * 0.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-k, 0); ctx.lineTo(k, 0); ctx.stroke();
  ctx.restore();
}

function scoreboard(ctx, m, L, W, big) {
  const n = m.titans.length;
  const gap = 12 * L.dpr;
  const left = L.g; const top = L.g * 0.6; const ch = L.row;
  const timerW = Math.min(160 * L.dpr, Math.max(72 * L.dpr, W * 0.14));
  const left2 = left + timerW + gap;
  const perRow = Math.ceil(n / L.rows);
  const cw = (W - left2 - L.g + gap) / Math.max(1, perRow);
  const secsLeft = Math.max(0, Math.ceil(T.roundTime - m.tick / 60));
  const storm = isStorm(m);
  const tH = L.rows * ch + (L.rows - 1) * gap;
  ctx.fillStyle = storm ? '#5a2ca8' : '#1b2233';
  roundRect(ctx, left, top, timerW, tH, 10 * L.dpr); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(Math.min(ch * 0.62, timerW * 0.36))}px ${DISPLAY}`;
  ctx.fillText(`${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, '0')}`, left + timerW / 2, top + tH / 2);
  for (let i = 0; i < n; i++) {
    const t = m.titans[i]; const h = HOUSE[t.house];
    const x = left2 + (i % perRow) * cw; const y = top + Math.floor(i / perRow) * (ch + gap);
    const w = cw - gap;
    ctx.fillStyle = t === big ? '#5c4a12' : '#1b2233';
    roundRect(ctx, x, y, w, ch, 10 * L.dpr); ctx.fill();
    ctx.fillStyle = h.colour; ctx.fillRect(x, y, Math.max(6 * L.dpr, w * 0.06), ch);
    const tx = x + Math.max(12 * L.dpr, w * 0.12);
    const fs = Math.min(ch * 0.3, (w - (tx - x) - 6 * L.dpr) / 4);
    ctx.fillStyle = t.alive ? '#fff' : '#8893ad'; ctx.textAlign = 'left';
    ctx.font = `600 ${Math.round(fs * 1.25)}px ${DISPLAY}`;
    ctx.fillText(m.mode === 'team' ? `${h.name} T${t.team + 1}` : h.name, tx, y + ch * 0.32);
    ctx.font = `700 ${Math.round(fs * 1.6)}px ${DISPLAY}`;
    ctx.fillText(t.alive ? String(t.bells) : `${t.bells}  ${Math.ceil(t.respawn / 60)}s`, tx, y + ch * 0.7);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}











export const CRYSTAL_FACETS = Object.freeze(['#5fc7bd', '#3fa39c', '#2a7f7c', '#1c5d5f', '#23696a', '#3a948f']);
export function drawCrystals(ctx, m, X, Y, s) {
  for (const c of m.crystals || []) {
    const cx = X(c.x); const cy = Y(c.y); const r = c.r * s * 1.1;
    const pt = (k, rr = r) => { const a = (k / 6) * TAU + Math.PI / 6; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; };
    const hex = (rr, ox = 0, oy = 0) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const [x, y] = pt(k, rr); ctx.lineTo(x + ox, y + oy); } ctx.closePath(); };
    if (c.down <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; hex(r, s * 0.3, s * 0.45); ctx.fill();
      
      for (let k = 0; k < 6; k++) {
        const [x1, y1] = pt(k); const [x2, y2] = pt(k + 1);
        ctx.fillStyle = CRYSTAL_FACETS[(k + 3) % 6];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(190,255,245,0.5)'; ctx.lineWidth = Math.max(1.5, s * 0.1); hex(r); ctx.stroke();
      ctx.fillStyle = 'rgba(230,255,250,0.75)';
      ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.18, r * 0.09, -0.6, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(159,243,230,0.55)';
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ctx.fillRect(cx + Math.cos(a) * c.r * s - s * 0.15, cy + Math.sin(a) * c.r * s - s * 0.15, s * 0.3, s * 0.3); }
      if (c.down < secs(3)) { ctx.strokeStyle = `rgba(159,243,230,${0.6 * (1 - c.down / secs(3))})`; ctx.lineWidth = Math.max(1.5, s * 0.1); hex(r); ctx.stroke(); }
    }
  }
}






export function hazardLip(ctx, rects, lip) {
  ctx.save();
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath(); for (const [x, y, w, h] of rects) ctx.rect(x, y, w, h); ctx.fill();
  ctx.clip();
  const band = Math.max(4, lip * 1.6);
  ctx.fillStyle = 'rgba(20,14,8,0.55)';
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const [x, y, w, h] of rects) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h); }
  ctx.beginPath();
  for (let x = x0 - (y1 - y0); x < x1; x += band * 2) {
    ctx.moveTo(x, y1); ctx.lineTo(x + band, y1); ctx.lineTo(x + band + (y1 - y0), y0); ctx.lineTo(x + (y1 - y0), y0); ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}






export function stormCrackle(tick, hw, hh) {
  let seed = (Math.floor(tick / 4) * 2654435761) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]];
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i]; const [bx, by] = corners[i + 1];
    const len = Math.hypot(bx - ax, by - ay); const n = Math.max(2, Math.round(len / 1.5));
    const nx = (by - ay) / (len || 1); const ny = -(bx - ax) / (len || 1);
    for (let j = 0; j < n; j++) {
      const t = j / n; const off = (rnd() - 0.5) * 1.2;
      pts.push([ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off]);
    }
  }
  pts.push(pts[0]);
  return pts;
}
function drawStormCrackle(ctx, pts, X, Y, s) {
  ctx.save();
  ctx.lineJoin = 'round';
  for (const [w, col] of [[Math.max(4, s * 0.45), 'rgba(170,110,255,0.35)'], [Math.max(1.5, s * 0.12), 'rgba(245,235,255,0.9)']]) {
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); for (const [x, y] of pts) ctx.lineTo(X(x), Y(y)); ctx.stroke();
  }
  ctx.restore();
}


export function bannerPlate(textW, px, cx, cy) {
  const w = textW + px * 1.2; const h = px * 1.5;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
