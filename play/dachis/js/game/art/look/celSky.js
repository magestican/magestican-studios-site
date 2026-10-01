



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
}

export function island(ctx, cx, cy, R, line = 3) {
  const blob = (rx, ry, fill, ox = 0, oy = 0) => {
    ctx.beginPath(); ctx.ellipse(cx + ox, cy + oy, rx, ry, 0, 0, 6.2832);
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke();
  };
  ctx.fillStyle = '#5fe8d6'; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.3, R * 1.15, 0, 0, 6.2832); ctx.fill(); 
  blob(R * 1.1, R * 0.98, '#f6e2a8');
  blob(R, R * 0.88, '#59ad46');
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.88, 0, 0, 6.2832); ctx.clip();
  ctx.fillStyle = '#87cf61';
  for (const [a, b, r] of [[-0.4, 0.3, 0.32], [0.35, 0.4, 0.28], [0.2, -0.45, 0.25], [-0.55, -0.2, 0.2]]) { ctx.beginPath(); ctx.ellipse(cx + a * R, cy + b * R, r * R, r * R * 0.8, 0.4, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  blob(R * 0.45, R * 0.42, '#8c7466', -R * 0.2, -R * 0.2);
  blob(R * 0.16, R * 0.15, '#ff6a1a', -R * 0.2, -R * 0.2);
  ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.ellipse(cx - R * 0.23, cy - R * 0.23, R * 0.06, R * 0.05, 0, 0, 6.2832); ctx.fill();
}

export function speedLines(ctx, w, h, t, rows) {
  for (const [a, b] of rows) {
    const x = a * w, y = ((b * h - t * 1500) % h + h) % h;
    ctx.fillStyle = INK; ctx.fillRect(x - 2, y, 4, 90);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y + 4, 2, 70);
  }
}

export function sunset(ctx, w, h) {
  bands(ctx, 0, 0, w, h * 0.5, ['#5a3c8c', '#a04a9a', '#ff7a6a', '#ffb46a', '#ffd08a'], Math.max(6, Math.round(h / 90)));
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.4, h * 0.07, 0, 6.2832); ctx.fillStyle = '#fff3b0'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
}
