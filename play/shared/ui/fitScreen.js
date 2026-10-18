


























export function bootDone() {
  try { globalThis.mgBoot?.done?.(); } catch {  }
}


export function afterBoot(fn) {
  const b = globalThis.mgBoot;
  if (b && typeof b.after === 'function') b.after(fn);
  else fn();
}


export function viewportHeight(w = globalThis) {
  return w.innerHeight || w.document?.documentElement?.clientHeight || 0;
}


export function lowestBottom(els, w = globalThis) {
  let b = 0;
  for (const el of els) {
    if (!el || el.hidden || !el.getClientRects?.().length) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0) b = Math.max(b, r.bottom + (w.scrollY || 0));
  }
  return b;
}





export function searchScale({ bottomAt, limit, min = 0.55, max = 1, current = max, slack = 28, steps = 7, grow = true }) {
  const fits = (s) => bottomAt(s) <= limit;
  const now = bottomAt(current);
  
  
  if (now <= limit && (!grow || current >= max || limit - now < slack)) return current;
  if (fits(max)) return max;
  let lo = min;
  let hi = max;
  let best = min;
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) { best = mid; lo = mid; } else hi = mid;
  }
  const s = Math.round(best * 100) / 100;
  bottomAt(s);
  return s;
}










export function fitScreen({ last, apply, min = 0.55, max = 1, gap = 12, w = globalThis } = {}) {
  let scale = max;
  let busy = false;
  let queued = false;
  
  
  
  
  
  function refit({ grow = false } = {}) {
    if (busy) return;
    busy = true;
    try {
      const limit = viewportHeight(w) - gap;
      scale = searchScale({
        bottomAt: (s) => { if (s !== scale) { scale = s; apply(s); } return lowestBottom(last(), w); },
        limit, min, max, current: scale, grow,
      });
    } finally {
      busy = false;
    }
  }
  const later = () => {
    if (queued) return;
    queued = true;
    (w.requestAnimationFrame ?? setTimeout)(() => { queued = false; refit({ grow: true }); });
  };
  
  
  
  for (const [t, type] of [[w, 'resize'], [w, 'orientationchange'], [w, 'pageshow'], [w.visualViewport, 'resize']]) {
    try { t?.addEventListener?.(type, later); } catch {  }
  }
  try { w.document?.fonts?.ready?.then(later); } catch {  }
  return { refit, later, scale: () => scale };
}
