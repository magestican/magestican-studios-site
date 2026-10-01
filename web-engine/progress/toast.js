















import { queueFrom } from './toastModel.js';
import { TIER_COLOUR } from '../account/achievements.js';





export const PROGRESS_EVENT = 'magestican:progress';

export const TOAST_MS = 2400;
const STYLE_ID = 'mg-progress-toast-style';
const FLAG = '__mgProgressToast';

const ART = { level: '★', trophy: '♔', badge: '◆', rating: '↗', xp: '✦' };

function injectStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const st = doc.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
.mg-toast-host{position:fixed;left:50%;top:max(12px,env(safe-area-inset-top));transform:translateX(-50%);
  z-index:2147483000;pointer-events:none;display:flex;flex-direction:column;align-items:center;max-width:min(92vw,420px)}
.mg-toast{display:flex;align-items:center;gap:10px;padding:9px 16px 9px 10px;border-radius:999px;
  background:rgba(28,26,23,.92);color:#fffbf2;font:600 14px/1.25 system-ui,-apple-system,"Segoe UI",sans-serif;
  box-shadow:0 6px 24px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.14);
  animation:mg-toast-in 220ms ease-out both}
.mg-toast.mg-out{animation:mg-toast-out 220ms ease-in both}
.mg-toast-art{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;
  font-size:15px;background:#f6f1e6;color:#1c1a17}
.mg-toast-sub{display:block;font-weight:400;font-size:12px;opacity:.8}
@keyframes mg-toast-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes mg-toast-out{to{opacity:0;transform:translateY(-8px)}}
@media (prefers-reduced-motion: reduce){.mg-toast,.mg-toast.mg-out{animation:none}}
`;
  (doc.head ?? doc.documentElement).appendChild(st);
}

function render(doc, host, item) {
  const el = doc.createElement('div');
  el.className = 'mg-toast';
  el.setAttribute('role', 'status');
  const art = doc.createElement('span');
  art.className = 'mg-toast-art';
  art.setAttribute('aria-hidden', 'true');
  art.textContent = ART[item.art] ?? '★';
  if (item.kind === 'badge' && TIER_COLOUR[item.tier]) art.style.background = TIER_COLOUR[item.tier];
  if (item.kind === 'level' || item.kind === 'trophy') art.style.background = TIER_COLOUR.legendary;
  const text = doc.createElement('span');
  text.textContent = item.title;
  if (item.sub) {
    const sub = doc.createElement('span');
    sub.className = 'mg-toast-sub';
    sub.textContent = item.sub;
    text.appendChild(sub);
  }
  el.append(art, text);
  host.replaceChildren(el);
  return el;
}


export function installProgressToast(doc = globalThis.document) {
  try {
    if (!doc || typeof doc.addEventListener !== 'function') return false;
    if (doc[FLAG]) return true;
    doc[FLAG] = true;
    const queue = [];
    let host = null;
    let busy = false;

    const next = () => {
      const item = queue.shift();
      if (!item) { busy = false; host?.replaceChildren(); return; }
      busy = true;
      try {
        injectStyle(doc);
        if (!host || !host.isConnected) {
          host = doc.createElement('div');
          host.className = 'mg-toast-host';
          host.setAttribute('aria-live', 'polite');
          doc.body.appendChild(host);
        }
        const el = render(doc, host, item);
        setTimeout(() => { el.classList.add('mg-out'); }, TOAST_MS - 220);
      } catch {  }
      setTimeout(next, TOAST_MS);
    };

    doc.addEventListener(PROGRESS_EVENT, (ev) => {
      try {
        queue.push(...queueFrom(ev?.detail));
        if (!busy) next();
      } catch {  }
    });
    return true;
  } catch {
    return false;
  }
}
