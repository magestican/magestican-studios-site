








export const HOLD_MS = 160;   
export const MOVE_OPEN = 12;  
export const DEAD = 26;       



export const RING_R = { x: 134, y: 100 };
export const SLOT = { w: 92, h: 34 }; 


export function ringCentre(x, y, vw, vh, r = RING_R, pad = 6) {
  const mx = r.x + SLOT.w / 2 + pad, my = r.y + SLOT.h / 2 + pad;
  const cx = vw > 2 * mx ? Math.min(Math.max(x, mx), vw - mx) : vw / 2;
  const cy = vh > 2 * my ? Math.min(Math.max(y, my), vh - my) : vh / 2;
  return [cx, cy];
}

export function ringSlots(n, r = RING_R) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; out.push([Math.sin(a) * r.x, -Math.cos(a) * r.y]); }
  return out;
}

export function pickSlot(dx, dy, n, dead = DEAD, r = RING_R) {
  if (!n || Math.hypot(dx, dy) < dead) return -1;
  const a = Math.atan2(dx / r.x, -dy / r.y); 
  const turn = (a / (Math.PI * 2) + 1) % 1;
  return Math.round(turn * n) % n;
}

export const ringOpens = (heldMs, movedPx) => heldMs >= HOLD_MS || movedPx >= MOVE_OPEN;
