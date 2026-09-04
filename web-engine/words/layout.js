


















import { SIZES } from './style.js';











export function fitCell({ width, height, cols, rows, gap, min = SIZES.target, max = 999 }) {
  const byWidth = (width - gap * (cols - 1)) / cols;
  const byHeight = (height - gap * (rows - 1)) / rows;
  return Math.max(min, Math.min(max, Math.floor(Math.min(byWidth, byHeight))));
}








export function grid({ box, cols, rows, gap = 8, maxCell = 999, min = SIZES.target, centreY = false }) {
  const cell = fitCell({ width: box.width, height: box.height, cols, rows, gap, min, max: maxCell });
  const width = cols * cell + gap * (cols - 1);
  const height = rows * cell + gap * (rows - 1);
  const left = Math.round(box.x + (box.width - width) / 2);
  
  
  
  const top = centreY ? Math.round(box.y + Math.max(0, (box.height - height) / 2)) : box.y;
  const rects = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      rects.push({
        x: left + c * (cell + gap),
        y: top + r * (cell + gap),
        w: cell,
        h: cell,
        col: c,
        row: r,
      });
    }
  }
  return { rects, cell, width, height, x: left, y: top, bottom: top + height };
}
































export function hive({ cx, cy, cell, gap = 10 }) {
  const step = cell + gap;
  const at = (dx, dy, centre = false) => ({
    x: Math.round(cx + dx - cell / 2),
    y: Math.round(cy + dy - cell / 2),
    w: cell,
    h: cell,
    centre,
  });
  return [
    at(0, 0, true),
    at(-step / 2, -step),   
    at(step / 2, -step),    
    at(step, 0),            
    at(step / 2, step),     
    at(-step / 2, step),    
    at(-step, 0),           
  ];
}










export function keyboard({ box, rows, gap = 6, wideUnits = 1.6, maxKey = 64 }) {
  const widest = Math.max(...rows.map((r) => r.reduce((n, k) => n + (k.length > 1 ? wideUnits : 1), 0)));
  const perRow = rows.length;
  const byWidth = (box.width - gap * (widest - 1)) / widest;
  const byHeight = (box.height - gap * (perRow - 1)) / perRow;
  const unit = Math.min(maxKey, Math.floor(byWidth));
  const h = Math.max(SIZES.target, Math.min(maxKey, Math.floor(byHeight)));
  const out = [];
  rows.forEach((keys, r) => {
    const units = keys.reduce((n, k) => n + (k.length > 1 ? wideUnits : 1), 0);
    const width = units * unit + gap * (keys.length - 1);
    let x = Math.round(box.x + (box.width - width) / 2);
    const y = box.y + r * (h + gap);
    for (const label of keys) {
      const w = Math.round((label.length > 1 ? wideUnits : 1) * unit);
      out.push({ x, y, w, h, label });
      x += w + gap;
    }
  });
  return { rects: out, height: rows.length * h + gap * (rows.length - 1), bottom: box.y + rows.length * h + gap * (rows.length - 1) };
}


export function rectAt(rects, px, py) {
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}










export function rectAtLoose(rects, px, py, inset = 0) {
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (px < r.x - inset || px >= r.x + r.w + inset) continue;
    if (py < r.y - inset || py >= r.y + r.h + inset) continue;
    const dx = px - (r.x + r.w / 2);
    const dy = py - (r.y + r.h / 2);
    const d = dx * dx + dy * dy;
    if (d < bestDistance) { bestDistance = d; best = i; }
  }
  return best;
}


export const centreOf = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });









export function stack(box, heights, gap = 12) {
  const out = [];
  let y = box.y;
  for (const h of heights) {
    out.push({ x: box.x, y, width: box.width, height: h });
    y += h + gap;
  }
  return { bands: out, rest: { x: box.x, y, width: box.width, height: Math.max(0, box.y + box.height - y) } };
}










export function flow({ box, sizes, gap = 8, lineHeight = null }) {
  const rects = [];
  let x = box.x;
  let y = box.y;
  let line = 0;
  for (const s of sizes) {
    const h = s.h;
    if (x > box.x && x + s.w > box.x + box.width) {
      x = box.x;
      y += (lineHeight ?? h) + gap;
      line += 1;
    }
    rects.push({ x, y, w: s.w, h, line });
    x += s.w + gap;
  }
  const last = rects[rects.length - 1];
  return { rects, height: rects.length ? (last.y + last.h) - box.y : 0, lines: line + 1 };
}
