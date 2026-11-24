











const shortStep = (d, n) => (d > n / 2 ? d - n : d < -n / 2 ? d + n : d);









export function unwrapEel(cur, prev, alpha, W, H, outX, outY) {
  const n = Math.min(cur.length, outX.length);
  for (let i = 0; i < n; i++) {
    const a = prev[Math.min(i, prev.length - 1)], b = cur[i];
    const dx = shortStep(b.x - a.x, W), dy = shortStep(b.y - a.y, H);
    let x = b.x, y = b.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) { x = a.x + dx * alpha; y = a.y + dy * alpha; }
    if (i > 0) {
      x += Math.round((outX[i - 1] - x) / W) * W;
      y += Math.round((outY[i - 1] - y) / H) * H;
    }
    outX[i] = x; outY[i] = y;
  }
  return n;
}


export const wrapCoord = (v, n) => ((((v + 0.5) % n) + n) % n) - 0.5;


export function edgeFade(x, y, W, H) {
  const e = Math.min(x + 0.5, W - 0.5 - x, y + 0.5, H - 0.5 - y);
  const t = Math.max(0, Math.min(1, e / 0.5));
  return t * t * (3 - 2 * t);
}
