

















export const FADE = Object.freeze({
  
  
  
  
  alpha: 0.25,
  
  
  pad: 0.2,
  
  
  near: 0.5,
  
  
  
  focus: Object.freeze([1.7, 1.15]),
  
  
  
  out: 14,
  back: 3,
});







export function inTheWay(eye, him, prop, cfg = FADE) {
  const h = prop.h ?? 0;
  const dx = him.x - eye.x; const dz = him.z - eye.z;
  const L2 = dx * dx + dz * dz;
  for (const c of prop.circles) {
    const ex = c.x - eye.x; const ez = c.z - eye.z;
    if (Math.hypot(ex, ez) < c.r + cfg.near && h > eye.y - cfg.near) return true;
    if (L2 < 1e-12) continue;
    const t = (ex * dx + ez * dz) / L2;
    if (t <= 0 || t >= 1) continue;
    if (Math.hypot(ex - dx * t, ez - dz * t) >= c.r + cfg.pad) continue;
    for (const fy of cfg.focus) if (h > eye.y + (fy - eye.y) * t) return true;
  }
  return false;
}


export function stepAlpha(a, blocking, dt, cfg = FADE) {
  const want = blocking ? cfg.alpha : 1;
  const rate = want < a ? cfg.out : cfg.back;
  const next = want + (a - want) * Math.exp(-rate * Math.max(0, dt));
  return Math.abs(next - want) < 0.005 ? want : next;
}
