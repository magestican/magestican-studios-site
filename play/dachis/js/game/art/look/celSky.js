



const INK = '#0d0a14';



export function bands(ctx, x, y, w, h, colors, cell = 9) {
  const n = colors.length, bh = h / n;
  for (let k = 0; k < n; k++) { ctx.fillStyle = colors[k]; ctx.fillRect(x, y + k * bh, w, Math.ceil(bh) + 1); }
  for (let k = 1; k < n; k++) dots(ctx, x, y + k * bh - cell * 3, w, cell * 3, colors[k], cell, true);
}

export function dots(ctx, x, y, w, h, color, cell = 9, grow = true) {
  ctx.fillStyle = color;
  const rows = Math.ceil(h / cell);
  for (let r = 0; r < rows; r++) {
    const f = (r + 0.5) / rows, rad = cell * 0.5 * (grow ? f : 1 - f) * 1.05, off = (r % 2) * cell / 2;
    if (rad < 0.4) continue;
    ctx.beginPath();
    for (let c = -1; c * cell < w + cell; c++) { const cx = x + c * cell + off, cy = y + r * cell + cell / 2; ctx.moveTo(cx + rad, cy); ctx.arc(cx, cy, rad, 0, 6.2832); }
    ctx.fill();
  }
}


export function cloud(ctx, x, y, s, line = 3) {
  const puffs = [[-45, 0, 50, 26], [-15, -10, 46, 30], [15, -4, 50, 28], [45, 4, 42, 22]].map(([dx, dy, rx, ry]) => [x + dx * s, y + dy * s, rx * s, ry * s]);
  const draw = (grow, color) => { ctx.fillStyle = color; for (const [cx, cy, rx, ry] of puffs) { ctx.beginPath(); ctx.ellipse(cx, cy, rx + grow, ry + grow, 0, 0, 6.2832); ctx.fill(); } };
  draw(line, INK);
  draw(0, '#ffffff');
  ctx.save(); ctx.beginPath();
  for (const [cx, cy, rx, ry] of puffs) { ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); }
  ctx.clip(); ctx.fillStyle = '#c9c2f0'; ctx.fillRect(x - 120 * s, y + 10 * s, 240 * s, 40 * s); ctx.restore();
}

export function ocean(ctx, w, h, t, marks) {
  ctx.fillStyle = '#1a8fe0'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1257b8';
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.ellipse(w / 2, h / 2, w * 0.62, h * 0.62, 0, 0, 6.2832, true); ctx.fill('evenodd');
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [a, b] of marks) {
    const x = ((a * w + t * 10) % w + w) % w, y = b * h;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 6, x + 22, y); ctx.stroke();
  }
  
  ctx.fillStyle = '#ffffff';
  marks.forEach(([a, b], i) => {
    if (Math.sin(t * 4 + i * 1.7) < 0.75) return;
    const x = ((b * w * 1.3 + i * 17) % w), y = ((a * h * 1.1 + i * 29) % h), r = 2 + (i % 3);
    ctx.fillRect(x - r * 2, y - 0.5, r * 4, 1.5); ctx.fillRect(x - 0.5, y - r * 2, 1.5, r * 4);
  });
}






const coast = (a) => 1 + 0.11 * Math.sin(3 * a + 1.1) + 0.07 * Math.sin(5 * a + 2.3) + 0.04 * Math.sin(9 * a + 0.4) + 0.025 * Math.sin(17 * a);
function shore(ctx, cx, cy, R, k, sq = 0.88) {
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.2832, r = R * k * coast(a); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * sq; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath();
}
const hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
export function island(ctx, cx, cy, R, line = 3, t = 0) {
  ctx.save(); ctx.lineJoin = 'round';
  shore(ctx, cx, cy, R, 1.42); ctx.fillStyle = 'rgba(95,232,214,0.45)'; ctx.fill(); 
  shore(ctx, cx, cy, R, 1.2); ctx.fillStyle = '#7ff0de'; ctx.fill(); 
  
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, line * 0.8); ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * 6.2832 + t * 0.05, r = R * 1.13 * coast(a) + Math.sin(t * 2 + i) * R * 0.015;
    ctx.beginPath(); ctx.arc(cx, cy, r, a, a + 0.07); ctx.stroke();
  }
  shore(ctx, cx, cy, R, 1.07); ctx.fillStyle = '#f6e2a8'; ctx.fill(); ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke();
  shore(ctx, cx, cy, R, 0.97); ctx.fillStyle = '#3f9a3a'; ctx.fill(); ctx.stroke();
  
  ctx.save(); shore(ctx, cx, cy, R, 0.97); ctx.clip();
  for (let i = 0; i < 70; i++) {
    const a = hash(i, 1) * 6.2832, d = Math.sqrt(hash(i, 2)) * 0.95, r = R * (0.07 + hash(i, 3) * 0.07);
    const x = cx + Math.cos(a) * d * R, y = cy + Math.sin(a) * d * R * 0.88;
    ctx.fillStyle = '#2f7f30'; ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.25, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = hash(i, 4) > 0.5 ? '#59ad46' : '#4fa240'; ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#87cf61'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
  
  const vx = cx - R * 0.16, vy = cy - R * 0.18;
  ctx.beginPath(); ctx.ellipse(vx, vy, R * 0.5, R * 0.45, 0, 0, 6.2832); ctx.fillStyle = '#8c6a58'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5e4236'; ctx.lineWidth = Math.max(1, line * 0.7);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832 + 0.2; ctx.beginPath(); ctx.moveTo(vx + Math.cos(a) * R * 0.17, vy + Math.sin(a) * R * 0.15); ctx.lineTo(vx + Math.cos(a + 0.08) * R * (0.42 + hash(i, 5) * 0.06), vy + Math.sin(a + 0.08) * R * (0.38 + hash(i, 5) * 0.05)); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(vx, vy, R * 0.25, R * 0.22, 0, 0, 6.2832); ctx.fillStyle = '#a5887a'; ctx.fill(); ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke();
  
  ctx.strokeStyle = '#e9cf8e'; ctx.lineWidth = Math.max(2, R * 0.035); ctx.setLineDash([R * 0.06, R * 0.03]);
  ctx.beginPath(); ctx.moveTo(vx + R * 0.1, vy + R * 0.2); ctx.bezierCurveTo(vx + R * 0.45, vy + R * 0.42, cx - R * 0.15, cy + R * 0.5, cx + R * 0.05, cy + R * 0.78); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, line * 0.6);
  ctx.beginPath(); ctx.arc(cx + R * 0.05, cy + R * 0.8, R * 0.05, 0, 6.2832); ctx.fill(); ctx.stroke(); 
  
  for (let i = 0; i < 6; i++) { const a = -2.2 + i * 0.32; const x = vx + Math.cos(a) * R * 0.2, y = vy + Math.sin(a) * R * 0.18; ctx.fillStyle = i % 2 ? '#d8763a' : '#e0a040'; ctx.fillRect(x - R * 0.018, y - R * 0.018, R * 0.036, R * 0.036); }
  const glow = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.beginPath(); ctx.ellipse(vx, vy, R * 0.13, R * 0.115, 0, 0, 6.2832); ctx.fillStyle = '#3a2020'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(vx, vy, R * 0.09, R * 0.08, 0, 0, 6.2832); ctx.fillStyle = '#ff6a1a'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(vx, vy, R * (0.035 + glow * 0.015), R * (0.03 + glow * 0.013), 0, 0, 6.2832); ctx.fillStyle = '#ffcf3a'; ctx.fill();
  
  for (let i = 0; i < 9; i++) {
    const p = (t * 0.12 + i / 9) % 1, r = R * (0.06 + p * 0.16);
    const x = vx + p * R * 0.9, y = vy - p * R * 0.35;
    ctx.globalAlpha = 0.75 * (1 - p); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, r + line, 0, 6.2832); ctx.fill();
    ctx.fillStyle = i % 2 ? '#d9d3e6' : '#c3bad6'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}



export function speedLines(ctx, w, h, t, rows) {
  ctx.save();
  rows.forEach(([a, b], i) => {
    const L = 40 + ((i * 37) % 110), sp = 1300 + ((i * 53) % 700);
    const x = a * w, y = ((b * h - t * sp) % (h + L) + h + L) % (h + L) - L;
    const wd = 1 + (i % 3);
    ctx.globalAlpha = 0.35 + (i % 4) * 0.12; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x - wd, y + L); ctx.lineTo(x + wd, y + L); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

export function sunset(ctx, w, h) {
  bands(ctx, 0, 0, w, h * 0.5, ['#5a3c8c', '#a04a9a', '#ff7a6a', '#ffb46a', '#ffd08a'], Math.max(6, Math.round(h / 90)));
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.4, h * 0.07, 0, 6.2832); ctx.fillStyle = '#fff3b0'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
}
