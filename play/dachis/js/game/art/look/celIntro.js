











const INK = '#0d0a14';
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, t) => a + (b - a) * t;






export function puffs(ctx, { x, y, t, scale = 1, drift = 0.5, n = 12, palette = ['#7d7590', '#aaa3ba', '#e6e0f0'], line = 3, rise = 300, speed = 0.06, alpha = 1 }) {
  const balls = [];
  for (let i = 0; i < n; i++) {
    const p = (t * speed + i / n) % 1, grow = Math.min(1, p * 5), shrink = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
    const r = (12 + p * 52) * scale * grow * shrink;
    if (r < 2) continue;
    const px = x + p * rise * drift + Math.sin(p * 6 + i * 1.7) * 10 * scale, py = y - p * rise, rot = p * 2.4 + i;
    balls.push([px, py, r], [px + Math.cos(rot) * r * 0.62, py + Math.sin(rot) * r * 0.3, r * 0.74], [px - Math.cos(rot) * r * 0.58, py - r * 0.22, r * 0.68]);
  }
  if (!balls.length) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const all = (grow) => { ctx.beginPath(); for (const [bx, by, br] of balls) { ctx.moveTo(bx + br + grow, by); ctx.arc(bx, by, br + grow, 0, 6.2832); } };
  ctx.fillStyle = INK; all(line); ctx.fill();
  ctx.fillStyle = palette[1]; all(0); ctx.fill();
  all(0); ctx.clip();
  ctx.fillStyle = palette[0]; 
  for (const [bx, by, br] of balls) { ctx.beginPath(); ctx.arc(bx + br * 0.35, by + br * 0.4, br * 0.8, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = palette[1]; 
  for (const [bx, by, br] of balls) { ctx.beginPath(); ctx.arc(bx - br * 0.12, by - br * 0.14, br * 0.78, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = palette[2]; 
  for (const [bx, by, br] of balls) { ctx.beginPath(); ctx.ellipse(bx - br * 0.32, by - br * 0.42, br * 0.36, br * 0.2, -0.5, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}



export function puddles(ctx, list, reflect, t) {
  for (const [cx, cy, rx, ry] of list) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.2832, k = 1 + 0.18 * Math.sin(a * 3 + cx) + 0.1 * Math.sin(a * 5 + cy); const px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = '#0c0a18'; ctx.fill(); ctx.lineWidth = Math.max(2, ry * 0.12); ctx.strokeStyle = INK; ctx.stroke(); ctx.save(); ctx.clip();
    
    ctx.fillStyle = '#2a2050'; ctx.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 1.1); ctx.fillStyle = '#3d2f6e'; ctx.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 0.5);
    for (const L of reflect) { 
      if (Math.abs(L.x - cx) > rx * 1.6) continue;
      for (let k = 0; k < 6; k++) { const y = cy - ry + (k + 0.5) * ry * 2 / 6, wob = Math.sin(t * 3 + k * 1.9) * rx * 0.08; ctx.fillStyle = `rgba(${L.rgb},${0.7 - k * 0.08})`; ctx.fillRect(L.x - rx * 0.18 + wob, y, rx * 0.36, ry * 0.18); }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(160,170,220,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.15, rx * 0.95, ry * 0.95, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx - rx * 0.45, cy - ry * 0.25, rx * 0.16, Math.max(1.5, ry * 0.18), -0.15, 0, 6.2832); ctx.fill(); 
    ctx.beginPath(); ctx.ellipse(cx - rx * 0.2, cy - ry * 0.3, rx * 0.05, Math.max(1, ry * 0.12), -0.15, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
}



const BRICKS = ['#8a3a2a', '#7a2e24', '#9a4632', '#6a2620', '#a0502e', '#83352a'];
export function brickWall(ctx, { x0, xIn, top, bot, h, t = 0, dark = false, light = null, windows = [], pipe = null, ac = null }) {
  const P = (e, f) => [lerp(x0, xIn, e), lerp(f * h, top + f * (bot - top), e)];
  const quad = (e0, e1, f0, f1) => { const a = P(e0, f0), b = P(e1, f0), c = P(e1, f1), d = P(e0, f1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
  ctx.save();
  quad(0, 1, 0, 1); ctx.fillStyle = dark ? '#1c0b0b' : '#241010'; ctx.fill(); ctx.clip(); 
  const ROWS = 46, COLS = 11;
  for (let k = 0; k < ROWS; k++) for (let m = -1; m < COLS; m++) {
    const off = (k % 2) * 0.5, e0 = Math.max(0, (m + off) / COLS), e1 = Math.min(1, (m + off + 1) / COLS);
    if (e1 <= e0) continue;
    const f0 = k / ROWS, f1 = (k + 1) / ROWS, ge = (e1 - e0) * 0.06, gf = (f1 - f0) * 0.14;
    const v = hash(k, m + (dark ? 50 : 0)), fade = (e0 + e1) / 2; 
    ctx.fillStyle = BRICKS[Math.floor(v * BRICKS.length)];
    quad(e0 + ge, e1 - ge, f0 + gf, f1 - gf); ctx.fill();
    
    ctx.fillStyle = 'rgba(255,190,150,0.16)'; quad(e0 + ge, e1 - ge, f0 + gf, f0 + gf * 2.6); ctx.fill();
    ctx.fillStyle = 'rgba(20,4,8,0.35)'; quad(e0 + ge, e1 - ge, f1 - gf * 2.4, f1 - gf); ctx.fill();
    if (v > 0.93) { ctx.fillStyle = 'rgba(10,6,12,0.45)'; quad(e0 + ge, lerp(e0, e1, 0.6), f0 + gf, f1 - gf); ctx.fill(); } 
    if (fade > 0.05) { ctx.fillStyle = `rgba(20,8,40,${(fade * (dark ? 0.75 : 0.6)).toFixed(3)})`; quad(e0, e1, f0, f1); ctx.fill(); }
  }
  
  const g = ctx.createLinearGradient(0, h * 0.55, 0, h); g.addColorStop(0, 'rgba(10,6,12,0)'); g.addColorStop(1, 'rgba(10,6,12,0.7)');
  ctx.fillStyle = g; quad(0, 1, 0, 1); ctx.fill();
  for (let i = 0; i < 9; i++) {
    const e = 0.04 + hash(i, 7) * 0.8, f0 = hash(i, 8) * 0.5, f1 = f0 + 0.15 + hash(i, 9) * 0.35;
    ctx.fillStyle = 'rgba(12,8,22,0.28)'; quad(e, e + 0.012, f0, f1); ctx.fill();
  }
  
  for (const wdw of windows) {
    const { e, f, ew = 0.16, fh = 0.1, lit = true, who = false } = wdw;
    ctx.fillStyle = INK; quad(e - 0.012, e + ew + 0.012, f - 0.008, f + fh + 0.012); ctx.fill();
    ctx.fillStyle = lit ? '#ffcf7a' : '#1a1430'; quad(e, e + ew, f, f + fh); ctx.fill();
    if (lit) {
      ctx.fillStyle = 'rgba(160,90,40,0.55)'; for (let s = 1; s < 6; s++) { quad(e, e + ew, f + fh * s / 6 - 0.003, f + fh * s / 6); ctx.fill(); }
      if (who) { const [sx, sy] = P(e + ew * 0.55, f + fh * 0.45), [, sy2] = P(e + ew * 0.55, f + fh); ctx.fillStyle = 'rgba(40,20,30,0.85)'; ctx.beginPath(); ctx.arc(sx, sy, (sy2 - sy) * 0.28, 0, 6.2832); ctx.fill(); ctx.fillRect(sx - (sy2 - sy) * 0.35, sy + (sy2 - sy) * 0.2, (sy2 - sy) * 0.7, (sy2 - sy) * 0.6); }
    }
    ctx.fillStyle = '#5a5060'; quad(e - 0.02, e + ew + 0.02, f + fh + 0.012, f + fh + 0.022); ctx.fill();
  }
  if (ac) { 
    const { e, f } = ac; ctx.fillStyle = INK; quad(e - 0.006, e + 0.106, f - 0.006, f + 0.056); ctx.fill();
    ctx.fillStyle = '#9a9aa8'; quad(e, e + 0.1, f, f + 0.05); ctx.fill();
    ctx.fillStyle = '#6a6a7a'; for (let s = 1; s < 5; s++) { quad(e + 0.01, e + 0.09, f + 0.05 * s / 5, f + 0.05 * s / 5 + 0.004); ctx.fill(); }
    const dp = (t * 1.6) % 1, [dx, dy] = P(e + 0.05, f + 0.056 + dp * 0.12); ctx.fillStyle = 'rgba(180,200,255,0.8)'; ctx.fillRect(dx - 1, dy, 2, 4);
  }
  if (pipe) { 
    const { e } = pipe, [ax, ay] = P(e, 0), [bx, by] = P(e, 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = '#4a4a58'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#7a7a8a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax - 1.5, ay); ctx.lineTo(bx - 1.5, by); ctx.stroke();
    for (let s = 1; s < 6; s++) { const [cx, cy] = P(e, s / 6); ctx.fillStyle = INK; ctx.fillRect(cx - 7, cy - 2, 14, 5); }
  }
  if (light) { 
    const lg = ctx.createRadialGradient(light.x, light.y, 2, light.x, light.y, light.r);
    lg.addColorStop(0, `rgba(${light.rgb},${light.a ?? 0.45})`); lg.addColorStop(1, `rgba(${light.rgb},0)`);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lg; quad(0, 1, 0, 1); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  
  const [ix, iy] = P(1, 0), [jx, jy] = P(1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(jx, jy); ctx.stroke();
}


export function seaHorizon(ctx, { w, y0, y1, t, sunX }) {
  const bands = ['#9cc8f0', '#6aa6e4', '#3f82cf', '#2a62b0', '#1f4f98'];
  for (let i = 0; i < bands.length; i++) { const a = lerp(y0, y1, (i / bands.length) ** 1.6), b = lerp(y0, y1, ((i + 1) / bands.length) ** 1.6); ctx.fillStyle = bands[i]; ctx.fillRect(0, a, w, b - a + 1); }
  
  for (let r = 0; r < 26; r++) {
    const f = r / 26, y = lerp(y0 + 2, y1, f ** 1.3), half = lerp(4, w * 0.09, f), len = lerp(3, 26, f);
    for (let k = 0; k < 4; k++) {
      if (Math.sin(t * 5 + r * 2.3 + k * 1.7) < 0.2) continue;
      const x = sunX + (hash(r, k) - 0.5) * 2 * half;
      ctx.fillStyle = k % 2 ? '#fff6c8' : '#ffd88a'; ctx.fillRect(x - len / 2, y, len, Math.max(1, f * 3));
    }
  }
  
  for (let r = 0; r < 7; r++) {
    const f = (r + 0.5) / 7, y = lerp(y0, y1, f ** 1.4), sz = lerp(4, 16, f), gap = sz * 5;
    for (let x = ((t * 12 * (0.5 + f) + r * 37) % gap) - gap; x < w + gap; x += gap) {
      ctx.strokeStyle = '#183f80'; ctx.lineWidth = Math.max(1, f * 2.5); ctx.beginPath(); ctx.moveTo(x - sz, y + 1); ctx.quadraticCurveTo(x, y - sz * 0.35, x + sz, y + 1); ctx.stroke();
      ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = Math.max(1, f * 1.6); ctx.beginPath(); ctx.moveTo(x - sz * 0.6, y - sz * 0.05); ctx.quadraticCurveTo(x, y - sz * 0.4, x + sz * 0.5, y - sz * 0.1); ctx.stroke();
    }
  }
  ctx.fillStyle = '#e0f0ff'; ctx.fillRect(0, y0, w, 1.5); 
}


export function oceanTop(ctx, { w, h, t, cx, cy, R }) {
  ctx.fillStyle = '#0f4a9e'; ctx.fillRect(0, 0, w, h);
  for (const [k, c] of [[3.4, '#14569e'], [2.6, '#1a64b8'], [2.0, '#2274cc']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, R * k, R * k * 0.9, 0, 0, 6.2832); ctx.fill(); }
  
  const gl = ctx.createRadialGradient(w * 0.25, h * 0.2, 4, w * 0.25, h * 0.2, Math.max(w, h) * 0.35);
  gl.addColorStop(0, 'rgba(255,250,220,0.35)'); gl.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
  
  const n = 90, S = Math.max(5, Math.min(w, h) * 0.018);
  for (let i = 0; i < n; i++) {
    const x = ((hash(i, 1) * w + t * 9 * (0.6 + hash(i, 3))) % (w + 40)) - 20, y = hash(i, 2) * h;
    if (Math.hypot(x - cx, (y - cy) / 0.9) < R * 1.45) continue; 
    const s = S * (0.6 + hash(i, 4) * 0.8), on = 0.55 + 0.45 * Math.sin(t * 1.5 + i);
    ctx.strokeStyle = 'rgba(8,40,90,0.55)'; ctx.lineWidth = Math.max(1.5, s * 0.22); ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.25); ctx.quadraticCurveTo(x, y - s * 0.1, x + s, y + s * 0.25); ctx.stroke();
    ctx.strokeStyle = `rgba(240,250,255,${on.toFixed(2)})`; ctx.lineWidth = Math.max(1, s * 0.16); ctx.beginPath(); ctx.moveTo(x - s * 0.8, y); ctx.quadraticCurveTo(x, y - s * 0.35, x + s * 0.7, y - s * 0.05); ctx.stroke();
  }
  
  for (let i = 0; i < 4; i++) {
    const x = ((hash(i, 5) * w + t * 22) % (w + 300)) - 150, y = hash(i, 6) * h;
    ctx.fillStyle = 'rgba(6,24,60,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, 110 + hash(i, 7) * 60, 50 + hash(i, 8) * 30, 0.3, 0, 6.2832); ctx.fill();
  }
}





export function paving(ctx, { y0, y1, xa0, xb0, xa1, xb1, rows = 16, cols = 9, stones, gap = '#14121c', lip = 'rgba(255,230,200,0.18)', under = 'rgba(8,6,14,0.45)', seed = 0, moss = null, sheen = null, t = 0 }) {
  const P = (u, f) => { const y = lerp(y0, y1, f), xa = lerp(xa0, xa1, f), xb = lerp(xb0, xb1, f); return [lerp(xa, xb, u), y]; };
  const F = (k) => (k / rows) ** 1.7; 
  const quad = (u0, u1, f0, f1) => { const a = P(u0, f0), b = P(u1, f0), c = P(u1, f1), d = P(u0, f1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
  ctx.save();
  quad(0, 1, 0, 1); ctx.fillStyle = gap; ctx.fill(); ctx.clip();
  for (let k = 0; k < rows; k++) {
    const f0 = F(k), f1 = F(k + 1), gf = (f1 - f0) * 0.12, off = hash(k, seed) * 0.5;
    for (let m = -1; m < cols + 1; m++) {
      const wv = 0.75 + hash(k * 7 + seed, m) * 0.5, u0 = (m + off) / cols, u1 = (m + off + wv) / cols, gu = 0.08 / cols;
      if (u1 < 0 || u0 > 1) continue;
      ctx.fillStyle = stones[Math.floor(hash(k + seed, m * 3) * stones.length)];
      quad(u0 + gu, u1 - gu, f0 + gf, f1 - gf); ctx.fill();
      ctx.fillStyle = lip; quad(u0 + gu, u1 - gu, f0 + gf, f0 + gf + (f1 - f0) * 0.18); ctx.fill();
      ctx.fillStyle = under; quad(u0 + gu, u1 - gu, f1 - gf - (f1 - f0) * 0.16, f1 - gf); ctx.fill();
      
      
      quad(u0 + gu, u1 - gu, f0 + gf, f1 - gf); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 0.6 + 2.6 * f1; ctx.stroke();
      if (hash(m * 5 + seed, k) > 0.8) { ctx.fillStyle = 'rgba(255,240,220,0.4)'; quad(lerp(u0, u1, 0.2), lerp(u0, u1, 0.45), lerp(f0, f1, 0.28), lerp(f0, f1, 0.42)); ctx.fill(); }
      if (hash(m, k + seed) > 0.9) { ctx.strokeStyle = gap; ctx.lineWidth = 1.5; const a = P(lerp(u0, u1, 0.3), lerp(f0, f1, 0.2)), b = P(lerp(u0, u1, 0.6), lerp(f0, f1, 0.8)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } 
      if (moss && hash(m + 3, k + seed) > 0.8) { const [mx, my] = P(u0, f1); ctx.fillStyle = moss; for (let q = 0; q < 3; q++) ctx.fillRect(mx - 3 + q * 3, my - 2 - q % 2 * 2, 2, 3 + q % 2 * 2); }
    }
  }
  if (sheen) { 
    const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(${sheen.rgb},0.4)`); g.addColorStop(1, `rgba(${sheen.rgb},0)`);
    ctx.fillStyle = g; ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath(); ctx.moveTo(sheen.x - 6, y0); ctx.lineTo(sheen.x + 6, y0); ctx.lineTo(sheen.x + sheen.spread, y1); ctx.lineTo(sheen.x - sheen.spread, y1); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  
  const hz = ctx.createLinearGradient(0, y0, 0, lerp(y0, y1, 0.35)); hz.addColorStop(0, 'rgba(20,10,40,0.55)'); hz.addColorStop(1, 'rgba(20,10,40,0)');
  ctx.fillStyle = hz; ctx.fillRect(Math.min(xa0, xa1), y0, Math.max(xb0, xb1) - Math.min(xa0, xa1), y1 - y0);
  ctx.restore();
}


export function cumulus(ctx, x, y, s, line = 3) {
  const B = [[-48, 6, 30], [-22, -8, 36], [8, -16, 40], [38, -4, 32], [60, 8, 22], [-4, 10, 30], [26, 12, 26]].map(([dx, dy, r]) => [x + dx * s, y + dy * s, r * s]);
  const all = (g) => { ctx.beginPath(); for (const [bx, by, br] of B) { ctx.moveTo(bx + br + g, by); ctx.arc(bx, by, br + g, 0, 6.2832); } };
  ctx.save();
  ctx.fillStyle = INK; all(line); ctx.fill();
  ctx.fillStyle = '#c9c0ec'; all(0); ctx.fill();
  all(0); ctx.clip();
  ctx.fillStyle = '#ffffff'; for (const [bx, by, br] of B) { ctx.beginPath(); ctx.arc(bx - br * 0.1, by - br * 0.22, br * 0.86, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = '#a99fd6'; ctx.fillRect(x - 90 * s, y + 18 * s, 180 * s, 30 * s); 
  ctx.fillStyle = '#fffbe8'; for (const [bx, by, br] of B) { ctx.beginPath(); ctx.ellipse(bx - br * 0.3, by - br * 0.5, br * 0.34, br * 0.18, -0.4, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}



export function hut(ctx, x, y, s, roof, t = 0) {
  const w = 26 * s, h = 22 * s, ry = y + 6 - h, lw = Math.max(1.5, 2.2 * s);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = lw;
  ctx.fillStyle = 'rgba(20,8,4,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + 8 * s, w * 1.35, w * 0.45, 0, 0, 6.2832); ctx.fill();
  const face = (sx, col) => { ctx.beginPath(); ctx.moveTo(x + sx * w, y - w * 0.5 + 6); ctx.lineTo(x, y + 6); ctx.lineTo(x, ry); ctx.lineTo(x + sx * w, y - w * 0.5 + 6 - h); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); };
  face(-1, '#d9b27a'); face(1, '#a87a46');
  ctx.lineWidth = Math.max(1, lw * 0.5); ctx.strokeStyle = 'rgba(60,30,10,0.55)'; 
  for (let i = 1; i < 6; i++) for (const sx of [-1, 1]) { const px = x + sx * w * i / 6, dy = -w * 0.5 * i / 6; ctx.beginPath(); ctx.moveTo(px, y + 6 + dy); ctx.lineTo(px, y + 6 + dy - h); ctx.stroke(); }
  for (let i = 0; i < 7; i++) { const e = i / 6, px = lerp(x - w, x + w, e), py = y + 6 - Math.abs(e - 0.5) * w; ctx.fillStyle = '#6a6070'; ctx.beginPath(); ctx.ellipse(px, py, 5 * s, 3 * s, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, lw * 0.6); ctx.stroke(); } 
  
  const fl = 0.75 + 0.25 * Math.sin(t * 9 + x);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(x + w * 0.24, y - 15 * s, 11 * s, 18 * s, [5 * s, 5 * s, 0, 0]); ctx.fill();
  ctx.fillStyle = `rgb(255,${Math.round(170 + 40 * fl)},80)`; ctx.beginPath(); ctx.roundRect(x + w * 0.24 + 1.5 * s, y - 13.5 * s, 8 * s, 16.5 * s, [4 * s, 4 * s, 0, 0]); ctx.fill();
  ctx.fillStyle = '#c0392b'; ctx.fillRect(x + w * 0.24 + 1.5 * s, y - 13.5 * s, 8 * s, 4 * s);
  const lg = ctx.createRadialGradient(x + w * 0.62, y - 10 * s, 1, x + w * 0.62, y - 10 * s, 26 * s); lg.addColorStop(0, `rgba(255,200,90,${(0.5 * fl).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = lg; ctx.fillRect(x, y - 40 * s, 60 * s, 60 * s);
  ctx.fillStyle = INK; ctx.fillRect(x + w * 0.62 - 3 * s, y - 14 * s, 6 * s, 8 * s); ctx.fillStyle = '#ffd36a'; ctx.fillRect(x + w * 0.62 - 2 * s, y - 13 * s, 4 * s, 6 * s);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - w * 0.5, y - 10 * s, 5 * s, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#ffcf7a'; ctx.beginPath(); ctx.arc(x - w * 0.5, y - 10 * s, 3.4 * s, 0, 6.2832); ctx.fill(); 
  
  for (const [k, lift, peak, light] of [[1.3, 0.3, 14, 0.08], [1.0, 0.95, 24, 0.22], [0.66, 1.7, 34, 0.38]]) {
    const bx = w * k, by = ry - w * 0.3 * k - lift * 6 * s, top = ry - (peak + 6) * s;
    ctx.fillStyle = shade(roof, light - 0.25); ctx.strokeStyle = INK; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x - bx, by); ctx.lineTo(x, top); ctx.lineTo(x + bx, by);
    for (let i = 0; i <= 12; i++) { const e = 1 - i / 12, px = lerp(x - bx, x + bx, e), sag = (1 - Math.abs(e - 0.5) * 2) * 10 * s * k; ctx.lineTo(px, by + sag + (i % 2 ? 4 * s : 0)); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = shade(roof, light + 0.15); ctx.lineWidth = Math.max(1, lw * 0.45);
    for (let i = 1; i < 9; i++) { const e = i / 9, px = lerp(x - bx, x + bx, e); ctx.beginPath(); ctx.moveTo(lerp(x, px, 0.55), lerp(top, by, 0.55)); ctx.lineTo(px, by + (1 - Math.abs(e - 0.5) * 2) * 8 * s * k); ctx.stroke(); }
  }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, ry - 42 * s, 3 * s, 0, 6.2832); ctx.fill(); 
  ctx.restore();
}
