














import { GRID_LINE } from './palette.js';




export const UNIT = 3;

const snap = (v) => Math.round(v / UNIT) * UNIT;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);














export function buildFigure({ cx, feet, top, width, facing = 1, reach = 0, kit }) {
  
  
  
  const h = snap(Math.max(UNIT * 4, feet - top));
  const w = snap(Math.max(UNIT * 2, width));
  const f = facing >= 0 ? 1 : -1;
  const r = clamp(reach, 0, 1);

  
  
  
  const headH = snap(h * 0.22);
  const torsoH = snap(h * 0.38);
  
  const legH = Math.max(UNIT, h - headH - torsoH);

  const torsoW = snap(w * 0.62);
  
  
  const headW = snap(w * 0.66);
  const legW = snap(torsoW * 0.42);
  const armW = Math.max(UNIT, snap(w * 0.2));

  const cxs = snap(cx);
  const feetY = snap(feet);
  const torsoY = feetY - legH - torsoH;
  const headY = torsoY - headH;

  const rects = [];

  
  
  const stance = snap(legW * (0.6 + r * 1.4));
  rects.push({ x: cxs - legW - snap(stance * 0.25), y: feetY - legH, w: legW, h: legH, fill: kit.limb });
  rects.push({ x: cxs + snap(stance * 0.25), y: feetY - legH, w: legW, h: legH, fill: kit.limb });

  
  rects.push({ x: cxs - snap(torsoW / 2), y: torsoY, w: torsoW, h: torsoH, fill: kit.body });
  rects.push({
    x: cxs - snap(torsoW / 2), y: torsoY + snap(torsoH * 0.55),
    w: torsoW, h: Math.max(UNIT, snap(torsoH * 0.28)), fill: kit.trim,
  });

  
  
  const armY = torsoY + snap(torsoH * 0.18);
  const armLen = snap(torsoH * (0.5 + r * 0.9));
  rects.push({ x: cxs - snap(torsoW / 2) - armW, y: armY, w: armW, h: snap(torsoH * 0.5), fill: kit.limb });
  const leadX = f > 0 ? cxs + snap(torsoW / 2) : cxs - snap(torsoW / 2) - armLen;
  rects.push({ x: leadX, y: armY, w: armLen, h: armW, fill: kit.limb });

  
  rects.push({ x: cxs - snap(headW / 2) + snap(f * headW * 0.12), y: headY, w: headW, h: headH, fill: kit.head });

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
