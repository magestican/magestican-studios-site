








import { U } from '../../../engine/core/util.js';

export const JOIN = 0.45; 
export const deckOpen = (dk, flags) => !dk.open || !!(flags && flags[dk.open]);
export const deckH = (dk, t) => dk.h - dk.sag * Math.sin(Math.PI * U.clamp(t, 0, 1));

export function along(dk, x, y) {
  const [ax, ay] = dk.a, [bx, by] = dk.b, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  const t = ((x - ax) * dx + (y - ay) * dy) / L, cx = ax + dx * U.clamp(t, 0, 1), cy = ay + dy * U.clamp(t, 0, 1);
  return { t, d: Math.hypot(x - cx, y - cy) };
}
const onStrip = (dk, a, rad) => a.t >= 0 && a.t <= 1 && a.d < dk.half - rad * 0.5;

export function stepTo(W, who, nx, ny, rad, flags) {
  const decks = W.decks || [];
  const dk = who.deck && decks.find((q) => q.id === who.deck);
  if (who.deck && (!dk || !deckOpen(dk, flags))) who.deck = null;
  if (who.deck) {
    const a = along(dk, nx, ny);
    if (onStrip(dk, a, rad)) return true;
    
    if (W.walkable(nx, ny, rad) && Math.abs(W.groundAt(nx, ny) - deckH(dk, a.t)) < JOIN) { who.deck = null; return true; }
    
    const c = along(dk, who.x, who.y);
    if (!(c.t > -0.05 && c.t < 1.05 && c.d < dk.half + 0.3)) { who.deck = null; return W.walkable(nx, ny, rad); }
    return false;
  }
  
  for (const q of decks) {
    if (!deckOpen(q, flags)) continue;
    const a = along(q, nx, ny);
    if (onStrip(q, a, rad) && Math.abs(W.groundAt(who.x, who.y) - deckH(q, a.t)) < JOIN) { who.deck = q.id; return true; }
  }
  return W.walkable(nx, ny, rad);
}

export function deckLift(W, who) {
  const dk = who.deck && (W.decks || []).find((q) => q.id === who.deck);
  return dk ? Math.max(0, deckH(dk, along(dk, who.x, who.y).t) - W.groundAt(who.x, who.y)) : 0;
}
