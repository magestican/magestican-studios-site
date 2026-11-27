










import { ARENAS } from '../../../web-engine/titan-bash/arenas.js';


export const ZOOM = Object.freeze({ touch: 1.8, desktop: 1.3 });

export const EDGE_MARGIN = 4;

export const GROUP_PAD = 10;

export const EASE_S = 0.16;

export const PROX_RANGE = 30;

export const PROX_MAX = 4;





export function viewRect(W, H, L, edgeToEdge) {
  const d = L.dpr || 1;
  if (edgeToEdge) { const y = Math.max(0, L.hud) + 4 * d; return { x: 0, y, w: W, h: Math.max(1, H - y) }; }
  const g = L.g || 0; const y = Math.max(0, L.hud) + g;
  return { x: g, y, w: Math.max(1, W - g * 2), h: Math.max(1, H - y - g) };
}


export function frameTarget(m, focus, last = null) {
  const pts = focus.map((i) => m.titans[i]).filter((t) => t && t.alive);
  if (!pts.length) return last; 
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
  for (const t of pts) { x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); y0 = Math.min(y0, t.y); y1 = Math.max(y1, t.y); }
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, sx: x1 - x0, sy: y1 - y0 };
}


export function zoomFor(target, want, fit, view, rot) {
  if (!target) return 1;
  const sw = (rot ? target.sy : target.sx) + GROUP_PAD * 2; 
  const sh = (rot ? target.sx : target.sy) + GROUP_PAD * 2;
  const room = Math.min(view.w / (sw * fit), view.h / (sh * fit));
  return Math.max(1, Math.min(want, room));
}


export function clampCentre(c, half, arenaHalf) {
  const lo = -arenaHalf - EDGE_MARGIN + half; const hi = arenaHalf + EDGE_MARGIN - half;
  return lo > hi ? 0 : Math.min(Math.max(c, lo), hi);
}


export function createCamera() { return { x: 0, y: 0, z: 1, key: null, last: null }; }





export function stepCamera(cam, m, L, W, H, { focus = [], touch = false, dt = 1 / 60, cut = false } = {}) {
  if (!m || !focus.length) { cam.key = null; return L; }
  const target = frameTarget(m, focus, cam.last);
  if (!target) { cam.key = null; return L; }
  cam.last = target;
  const A0 = ARENAS[m.arena] || ARENAS.bellRing;
  const rot = !!L.rot;
  const view = viewRect(W, H, L, touch);
  const Aw = rot ? A0.h : A0.w; const Ah = rot ? A0.w : A0.h; 
  const fit = Math.min(view.w / Aw, view.h / Ah);
  const z = zoomFor(target, touch ? ZOOM.touch : ZOOM.desktop, fit, view, rot);
  const key = `${m.arena}|${W}x${H}|${rot}|${touch}`;
  const k = cut || cam.key !== key ? 1 : 1 - Math.exp(-Math.max(0, dt) / EASE_S);
  cam.key = key;
  cam.z += (z - cam.z) * k;
  const s = fit * cam.z;
  
  const hx = (rot ? view.h : view.w) / 2 / s; const hy = (rot ? view.w : view.h) / 2 / s;
  const tx = clampCentre(target.x, hx, A0.w / 2); const ty = clampCentre(target.y, hy, A0.h / 2);
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  cam.x = clampCentre(cam.x, hx, A0.w / 2); cam.y = clampCentre(cam.y, hy, A0.h / 2);
  const vcx = view.x + view.w / 2; const vcy = view.y + view.h / 2;
  
  const ox = rot ? vcx + cam.y * s : vcx - cam.x * s;
  const oy = rot ? vcy - cam.x * s : vcy - cam.y * s;
  return { ...L, scale: s, ox, oy, aw: Aw * s, ah: Ah * s, vw: A0.w * s, vh: A0.h * s, view, follow: true };
}


export function wordsBox(L) {
  if (!L.view) return L;
  const v = L.view;
  return { ...L, ox: v.x + v.w / 2, oy: v.y + v.h / 2, aw: v.w, ah: v.h };
}


export function edgePoint(view, a, inset) {
  const cx = view.x + view.w / 2; const cy = view.y + view.h / 2;
  const hw = Math.max(1, view.w / 2 - inset); const hh = Math.max(1, view.h / 2 - inset);
  const dx = Math.cos(a); const dy = Math.sin(a);
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return [cx + dx * t, cy + dy * t];
}






export function proximityMarks(m, Lc, focus, project) {
  if (!Lc.view || !focus.length) return [];
  const v = Lc.view; const d = Lc.dpr || 1;
  const mine = focus.map((i) => m.titans[i]).filter((t) => t && t.alive);
  if (!mine.length) return [];
  const out = [];
  m.titans.forEach((t, i) => {
    if (!t.alive || focus.includes(i)) return;
    const [sx, sy] = project(t.x, t.y);
    const pad = 4 * d; 
    if (sx >= v.x + pad && sx <= v.x + v.w - pad && sy >= v.y + pad && sy <= v.y + v.h - pad) return;
    const dist = Math.min(...mine.map((o) => Math.hypot(o.x - t.x, o.y - t.y)));
    if (dist > PROX_RANGE) return;
    const near = 1 - dist / PROX_RANGE;
    const a = Math.atan2(sy - (v.y + v.h / 2), sx - (v.x + v.w / 2));
    const size = (9 + 5 * near) * d;
    const [x, y] = edgePoint(v, a, size + 8 * d);
    out.push({ i, x, y, a, near, size, alpha: 0.3 + 0.55 * near, dist });
  });
  return out.sort((p, q) => p.dist - q.dist).slice(0, PROX_MAX);
}


export function drawProximity(ctx, marks, colourOf) {
  for (const k of marks) {
    ctx.save();
    ctx.globalAlpha = k.alpha;
    ctx.translate(k.x, k.y);
    ctx.fillStyle = 'rgba(6,8,13,0.55)';
    ctx.beginPath(); ctx.arc(0, 0, k.size * 1.05, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(k.a);
    ctx.fillStyle = colourOf(k.i); ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = Math.max(1, k.size * 0.14);
    ctx.beginPath();
    ctx.moveTo(k.size * 0.8, 0); ctx.lineTo(-k.size * 0.5, -k.size * 0.62); ctx.lineTo(-k.size * 0.18, 0);
    ctx.lineTo(-k.size * 0.5, k.size * 0.62); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
