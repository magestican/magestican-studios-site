














import { GRID_LINE } from './palette.js';




export const UNIT = 3;

const snap = (v) => Math.round(v / UNIT) * UNIT;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);






function limbBlocks(x0, y0, x1, y1, rootW, tipW, fill, out, maxLen) {
  let dx = x1 - x0;
  let dy = y1 - y0;
  let len = Math.hypot(dx, dy);
  
  
  
  if (maxLen && len > maxLen) {
    const k = maxLen / len;
    dx *= k; dy *= k; len = maxLen;
  }
  const steps = Math.max(2, Math.ceil(len / UNIT));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const w = snap(rootW + (tipW - rootW) * t) || UNIT;
    const cx = snap(x0 + dx * t);
    const cy = snap(y0 + dy * t);
    out.push({ x: cx - snap(w / 2), y: cy - snap(w / 2), w, h: w, fill });
  }
}















export function buildFigure({ cx, feet, top, width, facing = 1, headX, hands, feetPts, kit }) {
  const h = snap(Math.max(UNIT * 6, feet - top));
  
  
  
  
  const w = snap(Math.max(UNIT * 4, Math.max(h * 0.36, width * 0.6)));
  const f = facing >= 0 ? 1 : -1;

  const headH = snap(h * 0.2);
  const torsoH = snap(h * 0.34);
  const torsoW = snap(w * 0.72);
  const headW = snap(w * 0.78);

  const cxs = snap(cx);
  const topY = snap(top);
  const shoulderY = topY + headH;
  const hipY = shoulderY + torsoH;

  const rects = [];

  
  const hipL = cxs - snap(torsoW * 0.28);
  const hipR = cxs + snap(torsoW * 0.28);
  const legW = Math.max(UNIT * 2, snap(w * 0.26));
  const fpts = feetPts && feetPts.length ? feetPts : [[cxs - legW, feet], [cxs + legW, feet]];
  const hips = [hipL, hipR];
  const legMax = h * 0.62;
  for (let i = 0; i < 2; i += 1) {
    const p = fpts[Math.min(i, fpts.length - 1)];
    limbBlocks(hips[i], hipY, snap(p[0]), snap(p[1]), legW, Math.max(UNIT, legW - UNIT), kit.limb, rects, legMax);
  }

  
  rects.push({ x: cxs - snap(torsoW / 2), y: shoulderY, w: torsoW, h: torsoH, fill: kit.body });
  rects.push({
    x: cxs - snap(torsoW / 2), y: shoulderY + snap(torsoH * 0.55),
    w: torsoW, h: Math.max(UNIT, snap(torsoH * 0.26)), fill: kit.trim,
  });

  
  const armW = Math.max(UNIT * 2, snap(w * 0.22));
  const shoulderL = cxs - snap(torsoW / 2);
  const shoulderR = cxs + snap(torsoW / 2);
  const armY = shoulderY + snap(torsoH * 0.16);
  const hpts = hands && hands.length
    ? hands
    : [[cxs - torsoW, armY + torsoH * 0.4], [cxs + torsoW, armY + torsoH * 0.4]];
  const shoulders = [shoulderL, shoulderR];
  const armMax = h * 0.55;
  for (let i = 0; i < 2; i += 1) {
    const p = hpts[Math.min(i, hpts.length - 1)];
    limbBlocks(shoulders[i], armY, snap(p[0]), snap(p[1]), armW, Math.max(UNIT, armW - UNIT), kit.limb, rects, armMax);
  }

  
  const hx = snap(headX === undefined ? cx : headX);
  const headLeft = clamp(hx - snap(headW / 2), cxs - w, cxs + w);
  rects.push({ x: headLeft + snap(f * headW * 0.06), y: topY, w: headW, h: headH, fill: kit.head });

  return rects;
}


export function drawFigure(ctx, rects) {
  for (const r of rects) {
    ctx.fillStyle = r.fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }
}


export function figureBounds(rects) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const r of rects) {
    if (r.x < x0) x0 = r.x;
    if (r.y < y0) y0 = r.y;
    if (r.x + r.w > x1) x1 = r.x + r.w;
    if (r.y + r.h > y1) y1 = r.y + r.h;
  }
  return { x0, y0, x1, y1 };
}
