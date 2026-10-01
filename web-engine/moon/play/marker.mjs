



























const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const MARKER = Object.freeze({
  
  
  
  
  
  
  insetPx: 22,
  
  
  arrivedM: 4,
});























export function markerAt({ x = 0, y = 0, behind = false, width, height, inset = MARKER.insetPx, band = null, clearPx = 0 } = {}) {
  
  const nx = behind ? -x : x;
  const ny = behind ? -y : y;
  const sx = ((nx + 1) / 2) * width;
  const sy = ((1 - ny) / 2) * height;
  const onScreen = !behind && Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
  if (onScreen) return { onScreen: true, x: sx, y: sy, angleRad: 0 };

  
  
  const cx = width / 2;
  const cy = height / 2;
  let dx = sx - cx;
  let dy = sy - cy;
  
  
  
  
  if (dx === 0 && dy === 0) { dx = 0; dy = 1; }
  const halfW = Math.max(1, cx - inset);
  const halfH = Math.max(1, cy - inset);
  
  const scale = Math.min(
    dx === 0 ? Infinity : halfW / Math.abs(dx),
    dy === 0 ? Infinity : halfH / Math.abs(dy),
  );
  const out = {
    onScreen: false,
    x: clamp(cx + dx * scale, inset, width - inset),
    y: clamp(cy + dy * scale, inset, height - inset),
    angleRad: Math.atan2(dy, dx),
  };
  return band ? pushOutOfBand(out, band, { width, height, inset, clearPx }) : out;
}











function pushOutOfBand(m, band, { width, height, inset, clearPx = 0 }) {
  
  
  
  
  const clear = clearPx + 1;
  const inX = m.x > band.left - clearPx && m.x < band.right + clearPx;
  const inY = m.y > band.top - clearPx && m.y < band.bottom + clearPx;
  if (!inX || !inY) return m;
  const spansX = band.left <= 0 && band.right >= width;
  const spansY = band.top <= 0 && band.bottom >= height;
  
  if (spansX && !spansY) {
    const up = m.y - band.top, down = band.bottom - m.y;
    return { ...m, y: up <= down ? Math.max(inset, band.top - clear) : Math.min(height - inset, band.bottom + clear) };
  }
  if (spansY && !spansX) {
    const left = m.x - band.left, right = band.right - m.x;
    return { ...m, x: left <= right ? Math.max(inset, band.left - clear) : Math.min(width - inset, band.right + clear) };
  }
  
  
  return m;
}


export const distanceLabel = (metres) => `${Math.max(0, Math.round(metres))} m`;


export const arrived = (metres) => metres <= MARKER.arrivedM;
