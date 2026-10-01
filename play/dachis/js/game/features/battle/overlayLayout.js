














export function stackLabels(items, { top = 0, bottom = Infinity, width = Infinity, pad = 1, avoid = [] } = {}) {
  const placed = avoid.map((a) => ({ ...a, hud: true })), out = [];
  const over = (p, x, y, w, h) => x - w / 2 < p.x + p.w / 2 + pad && x + w / 2 + pad > p.x - p.w / 2 && y < p.y + p.h + pad && y + h + pad > p.y;
  const hits = (x, y, w, h) => placed.find((p) => over(p, x, y, w, h));
  const hud = (x, y, w, h) => placed.find((p) => p.hud && over(p, x, y, w, h));
  const gap = pad + 3;
  
  
  const sideways = (it, x, y) => {
    const h0 = hits(x, y, it.w, it.h);
    if (!h0) return x;
    const walk = (dir) => {
      let sx = x, o = h0;
      for (let k = 0; k < 6 && o; k++) {
        sx = dir < 0 ? o.x - o.w / 2 - gap - it.w / 2 : o.x + o.w / 2 + gap + it.w / 2;
        if (sx < it.w / 2 || sx > width - it.w / 2) return null;
        o = hits(sx, y, it.w, it.h);
      }
      return o ? null : sx;
    };
    const tries = [walk(-1), walk(1)].filter((s) => s != null).sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
    return tries.length ? tries[0] : null;
  };
  for (const it of items) {
    let x = Math.max(it.w / 2, Math.min(width - it.w / 2, it.x)), y = it.y;
    if (!it.fixed || hud(x, y, it.w, it.h)) {
      
      let up = y, o;
      for (let k = 0; k < 12 && (o = hits(x, up, it.w, it.h)); k++) up = o.y - it.h - pad;
      if (up >= top) y = up;
      else { 
        let dn = y;
        for (let k = 0; k < 12 && (o = hits(x, dn, it.w, it.h)); k++) dn = o.y + o.h + pad;
        
        
        const across = dn + it.h > bottom && y >= top && y + it.h <= bottom ? sideways(it, x, y) : null;
        if (across != null) x = across;
        else y = Math.min(bottom - it.h, dn);
      }
      
      const sx = sideways(it, x, y);
      if (sx != null) x = sx;
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
