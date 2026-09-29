











export function stackLabels(items, { top = 0, bottom = Infinity, width = Infinity, pad = 1 } = {}) {
  const placed = [], out = [];
  const hits = (x, y, w, h) => placed.find((p) => x - w / 2 < p.x + p.w / 2 + pad && x + w / 2 + pad > p.x - p.w / 2 && y < p.y + p.h + pad && y + h + pad > p.y);
  for (const it of items) {
    let x = Math.max(it.w / 2, Math.min(width - it.w / 2, it.x)), y = it.y;
    if (!it.fixed) {
      
      let up = y, o;
      for (let k = 0; k < 12 && (o = hits(x, up, it.w, it.h)); k++) up = o.y - it.h - pad;
      if (up >= top) y = up;
      else { 
        let dn = y;
        for (let k = 0; k < 12 && (o = hits(x, dn, it.w, it.h)); k++) dn = o.y + o.h + pad;
        y = Math.min(bottom - it.h, dn);
      }
    }
    placed.push({ x, y, w: it.w, h: it.h });
    out.push({ x, y });
  }
  return out;
}


export function overlaps(rects) {
  let n = 0, area = 0;
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 0 && oy > 0) { n++; area += ox * oy; }
  }
  return { n, area };
}
