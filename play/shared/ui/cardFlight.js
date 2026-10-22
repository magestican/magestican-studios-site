





















export const PACE = Object.freeze({ think: 1000, flight: 560, settle: 420, baza: 900 });


export function reducedMotion(win = globalThis.window) {
  try { return !!win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch { return false; }
}


export function rectOf(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;
  const r = el.getBoundingClientRect();
  if (!r || !(r.width > 0) || !(r.height > 0)) return null;
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}


export function snap(map) {
  const out = {};
  for (const [k, el] of Object.entries(map || {})) out[k] = rectOf(el);
  return out;
}







export function flyCard({ ghost, from, target = null, to = null, ms = PACE.flight, doc = globalThis.document, win = globalThis.window } = {}) {
  const end = to || rectOf(target);
  if (!ghost || !from || !end || !doc?.body || reducedMotion(win) || typeof ghost.animate !== 'function') return Promise.resolve(false);
  const s = ghost.style;
  s.position = 'fixed';
  s.left = `${end.x}px`;
  s.top = `${end.y}px`;
  s.width = `${end.w}px`;
  s.height = `${end.h}px`;
  s.margin = '0';
  s.zIndex = '9999';
  s.pointerEvents = 'none';
  s.transformOrigin = '0 0';
  s.boxShadow = '0 10px 22px rgba(0,0,0,0.35)';
  if (ghost.setAttribute) ghost.setAttribute('aria-hidden', 'true');
  if (target?.style) target.style.visibility = 'hidden';
  doc.body.appendChild(ghost);
  const dx = from.x - end.x;
  const dy = from.y - end.y;
  const k = from.w / end.w || 1;
  
  const frames = [
    { transform: `translate(${dx}px, ${dy}px) scale(${k})` },
    { transform: `translate(${dx / 2}px, ${dy / 2 - 18}px) scale(${(k + 1) / 2 * 1.08}) rotate(-4deg)`, offset: 0.5 },
    { transform: 'translate(0px, 0px) scale(1)' },
  ];
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { ghost.remove(); } catch {  }
      if (target?.style) target.style.visibility = '';
      resolve(true);
    };
    try {
      const a = ghost.animate(frames, { duration: ms, easing: 'cubic-bezier(.25,.75,.3,1)' });
      a.onfinish = finish;
      a.oncancel = finish;
    } catch { finish(); }
    
    setTimeout(finish, ms + 400);
  });
}


export const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });
