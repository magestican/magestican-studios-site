






import { TUNING as T, secs } from '../../../web-engine/titan-bash/tuning.js';
import { HOUSES } from '../../../web-engine/titan-bash/titans.js';
import { ARENAS } from '../../../web-engine/titan-bash/arenas.js';
import { ABILITIES } from '../../../web-engine/titan-bash/abilities.js';
import { bounty, isStorm, stormBounds } from '../../../web-engine/titan-bash/sim.js';


const HOUSE = { ...Object.fromEntries(HOUSES.map((h) => [h.id, h])), dummy: { id: 'dummy', name: 'Target', colour: '#8a93a8' } };
const TAU = Math.PI * 2;


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
  ctx.fillStyle = '#3b2a3a'; ctx.strokeStyle = '#a36a78'; ctx.lineWidth = Math.max(2, s * 0.2);
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
    ctx.fillStyle = '#ff8a1f';
    for (const f of A.floor) ctx.fillRect(X(f.x - f.w / 2) - lip, Y(f.y - f.h / 2) - lip, f.w * s + lip * 2, f.h * s + lip * 2);
    ctx.fillStyle = storm ? '#2a2140' : '#1d2536';
    for (const f of A.floor) ctx.fillRect(X(f.x - f.w / 2), Y(f.y - f.h / 2), f.w * s, f.h * s);
    
    if (m.tide && m.tide.warn > 0) {
      const f = A.floor[m.tide.bridge];
      const k = 1 - m.tide.warn / secs(T.tideWarn);
      ctx.fillStyle = `rgba(120,200,255,${0.18 + 0.35 * k + 0.12 * Math.sin(m.tick * 0.4)})`;
      ctx.fillRect(X(f.x - f.w / 2), Y(f.y - f.h / 2), f.w * s, f.h * s);
      ctx.fillStyle = '#e6f6ff'; ctx.font = `700 ${Math.round(s * 1.6)}px system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('TIDE', X(f.x), Y(f.y) + s * 0.55);
    }
  } else if (A.openEdges) {
    ctx.fillStyle = '#ff8a1f';
    const lip = LIP * L.dpr;
    ctx.fillRect(fx0 - lip, fy0 - lip, L.aw + lip * 2, L.ah + lip * 2);
  }
  if (!A.floor) {
    ctx.fillStyle = storm ? '#2a2140' : '#1d2536';
    ctx.fillRect(fx0, fy0, L.aw, L.ah);
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
  }

  
  ctx.fillStyle = '#4a5570'; ctx.strokeStyle = '#8693b3'; ctx.lineWidth = Math.max(2, s * 0.15);
  for (const c of A.circles) { ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), c.r * s, 0, TAU); ctx.fill(); ctx.stroke(); }
  for (const b of A.boxes) { ctx.fillRect(X(b.x - b.w / 2), Y(b.y - b.h / 2), b.w * s, b.h * s); ctx.strokeRect(X(b.x - b.w / 2), Y(b.y - b.h / 2), b.w * s, b.h * s); }
  
  
  for (const c of m.crystals || []) {
    const cx = X(c.x); const cy = Y(c.y); const r = c.r * s;
    const hex = (rr) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); };
    if (c.down <= 0) {
      ctx.fillStyle = '#2f8f8a'; ctx.strokeStyle = '#9ff3e6'; ctx.lineWidth = Math.max(2, s * 0.15);
      hex(r * 1.1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(200,255,245,0.35)'; hex(r * 0.45); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(159,243,230,0.55)';
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ctx.fillRect(cx + Math.cos(a) * r - s * 0.15, cy + Math.sin(a) * r - s * 0.15, s * 0.3, s * 0.3); }
      if (c.down < secs(3)) { ctx.strokeStyle = `rgba(159,243,230,${0.6 * (1 - c.down / secs(3))})`; ctx.lineWidth = Math.max(1.5, s * 0.1); hex(r * 1.1); ctx.stroke(); }
    }
  }

  
  for (const c of m.lumen || []) {
    const cx = X(c.x); const cy = Y(c.y) - Math.sin(m.tick * 0.08 + c.x) * s * 0.15; const r = s * 0.7;
    ctx.fillStyle = 'rgba(120,240,255,0.22)'; ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8ff6ff'; ctx.strokeStyle = '#e8feff'; ctx.lineWidth = Math.max(1.5, s * 0.1);
    ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.3); ctx.lineTo(cx + r * 0.75, cy); ctx.lineTo(cx, cy + r * 1.3); ctx.lineTo(cx - r * 0.75, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  drawSleeper(ctx, m, X, Y, s);

  
  ctx.save(); ctx.beginPath(); ctx.rect(fx0, fy0, L.aw, L.ah); ctx.clip();
  for (const sh of m.shots) {
    const col = HOUSE[m.titans[sh.owner]?.house]?.colour || '#fff';
    if (sh.kind === 'lob') {
      const k = sh.maxLife ? sh.life / sh.maxLife : 0.5;
      ctx.strokeStyle = sh.seed ? '#ff3b3b' : col; ctx.lineWidth = Math.max(2, s * 0.18);
      ctx.beginPath(); ctx.arc(X(sh.x), Y(sh.y), sh.splash * s, 0, TAU); ctx.stroke();
      ctx.fillStyle = sh.seed ? 'rgba(255,59,59,0.25)' : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(X(sh.x), Y(sh.y), sh.splash * s * (1 - k), 0, TAU); ctx.fill();
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
  for (const t of m.titans) if (t.alive) titan(ctx, m, t, X, Y, s, t === big, opts);

  
  for (const f of fx) {
    const a = Math.min(1, f.ttl / 20);
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (f.kind === 'banner') {
      
      
      const px = bannerPx(ctx, f.text, s, A.w * s);
      ctx.font = `800 ${px}px system-ui, sans-serif`;
      ctx.lineWidth = Math.max(3, px * 0.16); ctx.strokeStyle = '#000'; ctx.fillStyle = f.colour || '#fff';
      ctx.strokeText(f.text, L.ox, Y(-A.h / 2) + s * 3); ctx.fillText(f.text, L.ox, Y(-A.h / 2) + s * 3);
    } else {
      ctx.font = `800 ${Math.round(s * (f.big ? 1.8 : 1.2))}px system-ui, sans-serif`;
      ctx.lineWidth = Math.max(3, s * 0.25); ctx.strokeStyle = '#000'; ctx.fillStyle = f.colour || '#fff';
      const yy = Y(f.y) - (60 - f.ttl) * 0.02 * s;
      ctx.strokeText(f.text, X(f.x), yy); ctx.fillText(f.text, X(f.x), yy);
    }
    ctx.globalAlpha = 1;
  }

  if (!m.endless) scoreboard(ctx, m, L, W, big); 
  ctx.restore();
}


export function bannerPx(ctx, text, s, arenaPx) {
  const want = Math.round(s * 2.2);
  ctx.font = `800 ${want}px system-ui, sans-serif`;
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

  if (t.overdrive > 0 || t.lumenTime > 0 || isBounty) {
    ctx.fillStyle = t.overdrive > 0 || t.lumenTime > 0 ? 'rgba(120,230,255,0.30)' : 'rgba(255,208,64,0.30)';
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.9, 0, TAU); ctx.fill();
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
  if (t.lunge > 0) {
    ctx.strokeStyle = h.colour; ctx.globalAlpha = 0.5; ctx.lineWidth = r * 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - t.lungeDx * s * 4, cy - t.lungeDy * s * 4); ctx.stroke(); ctx.globalAlpha = 1;
  }
  body(ctx, cx, cy, s, h.colour, t.facing);
  
  
  const paint = opts.paints && opts.paints[t.id];
  if (paint) {
    ctx.strokeStyle = paint; ctx.lineWidth = Math.max(2, s * 0.28);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, TAU); ctx.stroke();
  }

  
  const ringR = r + s * 0.55;
  ctx.lineWidth = Math.max(3, s * 0.32); ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, TAU); ctx.stroke();
  if (t.stall > 0) {
    const flash = (m.tick >> 3) % 2 === 0;
    ctx.strokeStyle = flash ? '#ff3b3b' : '#a01818';
    ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, TAU); ctx.stroke();
    const k = Math.max(0, 1 - t.stallAge / secs(T.ventMarkAt));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, s * 0.18);
    ctx.beginPath(); ctx.arc(cx, cy, ringR + k * s * 3, 0, TAU); ctx.stroke();
  } else if (t.heat > 0) {
    ctx.strokeStyle = t.heat >= T.redLine ? '#ff3b3b' : t.heat >= T.redLine * 0.7 ? '#ffb02e' : '#e9f0ff';
    ctx.beginPath(); ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + TAU * (t.heat / 100)); ctx.stroke();
  }
  if (t.shield > 0) { ctx.strokeStyle = '#6ff3ff'; ctx.lineWidth = Math.max(2, s * 0.15); ctx.beginPath(); ctx.arc(cx, cy, r + s * 1.2, 0, TAU); ctx.stroke(); }
  if (t.aegis > 0) {
    const half = (ABILITIES.aegis.arc / 2) * (Math.PI / 180);
    ctx.strokeStyle = '#9fe3ff'; ctx.lineWidth = Math.max(4, s * 0.5);
    ctx.beginPath(); ctx.arc(cx, cy, r + s * 1.3, t.facing - half, t.facing + half); ctx.stroke();
  }

  
  const bw = s * 4; const by = cy - r - s * 1.6;
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
  ctx.font = `800 ${Math.round(Math.min(ch * 0.5, timerW * 0.3))}px system-ui, sans-serif`;
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
    ctx.font = `700 ${Math.round(fs)}px system-ui, sans-serif`;
    ctx.fillText(m.mode === 'team' ? `${h.name} T${t.team + 1}` : h.name, tx, y + ch * 0.32);
    ctx.font = `800 ${Math.round(fs * 1.3)}px system-ui, sans-serif`;
    ctx.fillText(t.alive ? String(t.bells) : `${t.bells}  ${Math.ceil(t.respawn / 60)}s`, tx, y + ch * 0.7);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

