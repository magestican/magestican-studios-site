


























function hash2(x, y, seed) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) % 10000) / 10000;
}


export function noise1(t, seed) {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash2(i, 0, seed);
  const b = hash2(i + 1, 0, seed);
  const u = f * f * (3 - 2 * f);
  return (a + (b - a) * u) * 2 - 1;
}


export function seedOf(pts) {
  let s = 7;
  for (const p of pts) {
    s = (Math.imul(s, 31) + ((p[0] * 7 + p[1] * 13) | 0)) | 0;
  }
  return s >>> 0;
}










export function roughen(pts, { amp = 1.1, step = 7, seed = 0, closed = true } = {}) {
  if (pts.length < 2) return pts.slice();
  const out = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const segs = Math.max(1, Math.round(len / step));
    const nx = len > 0 ? -dy / len : 0;
    const ny = len > 0 ? dx / len : 0;
    for (let k = 0; k < segs; k += 1) {
      const t = k / segs;
      const w = noise1(i * 9.7 + t * segs * 1.7, seed) * amp;
      out.push([a[0] + dx * t + nx * w, a[1] + dy * t + ny * w]);
    }
  }
  if (!closed) out.push(pts[pts.length - 1].slice());
  return out;
}


export function roughEllipse(cx, cy, rx, ry, { amp = 0.9, seed = 0, segs = 22 } = {}) {
  const pts = [];
  for (let i = 0; i < segs; i += 1) {
    const a = (i / segs) * Math.PI * 2;
    const w = 1 + noise1(i * 1.31, seed) * (amp / Math.max(2, Math.min(rx, ry)));
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  return pts;
}






export function inkRibbon(pts, { base = 1.2, vary = 0.7, seed = 0 } = {}) {
  const n = pts.length;
  if (n < 3) return null;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i += 1) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = Math.max(0.25, base + noise1(i * 0.83, seed ^ 0x9e37) * vary) * 0.5;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return left.concat(right.reverse());
}





function tracePoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}






export function drawHand(ctx, pts, { fill, line, amp = 1.1, ink = 1.2, seed }) {
  const s = seed === undefined ? seedOf(pts) : seed;
  if (fill) {
    const paint = roughen(pts, { amp: amp * 1.25, step: 8, seed: s ^ 0x51ed });
    tracePoly(ctx, paint);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (line) {
    const outline = roughen(pts, { amp, step: 7, seed: s });
    const ribbon = inkRibbon(outline, { base: ink, vary: ink * 0.6, seed: s });
    if (ribbon) {
      tracePoly(ctx, ribbon);
      ctx.fillStyle = line;
      ctx.fill();
    }
  }
}


export function drawStroke(ctx, pts, { line, width = 1.4, amp = 0.9, seed = 0 }) {
  const rough = roughen(pts, { amp, step: 6, seed, closed: false });
  ctx.strokeStyle = line;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < rough.length; i += 1) {
    const t = i / rough.length;
    ctx.lineWidth = Math.max(0.3, width * (1 - 0.55 * t) * (1 + noise1(i * 0.7, seed) * 0.35));
    ctx.beginPath();
    ctx.moveTo(rough[i - 1][0], rough[i - 1][1]);
    ctx.lineTo(rough[i][0], rough[i][1]);
    ctx.stroke();
  }
}
