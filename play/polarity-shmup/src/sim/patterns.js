











import { ANG, FP, angWrap, iatan2, muldiv, polar } from './fixed.js';

export const FIELD_W = 390 * FP;
export const FIELD_H = 844 * FP;


export const gentleSpeed = (v, thin) => (thin ? muldiv(v, 3, 5) : v);

export function nearestPlayer(players, x, y) {
  let best = null, bd = Infinity;
  for (const p of players) {
    if (!p.on || p.lives <= 0) continue;
    const dx = (p.x - x) / FP, dy = (p.y - y) / FP; 
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}


export function aimAt(players, x, y) {
  const t = nearestPlayer(players, x, y);
  return t ? iatan2(t.x - x, t.y - y) : 0;
}







export function noseAt(x, y, aim, r) {
  const o = polar(aim, r * FP);
  return [x + o.vx, y + o.vy];
}


export function ring(out, x, y, n, off, speed, pol, kind, thin) {
  const v0 = gentleSpeed(speed, thin);
  for (let i = 0; i < n; i++) {
    if (thin && (i & 1)) continue;
    const v = polar(angWrap(off + Math.trunc((i * ANG) / n)), v0);
    out.push([x, y, v.vx, v.vy, pol, kind]);
  }
}


export function fan(out, x, y, n, aim, step, speed, pol, kind, thin) {
  const v0 = gentleSpeed(speed, thin);
  const h = (n - 1) >> 1;
  for (let i = -h; i <= n - 1 - h; i++) {
    if (thin && (i & 1)) continue;
    const v = polar(angWrap(aim + i * step), v0);
    out.push([x, y, v.vx, v.vy, pol, kind]);
  }
}
