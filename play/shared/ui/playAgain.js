

















import { kitClass } from './kit.js';

const STYLE_ID = 'mg-again-style';

const CSS = `
.mg-again { display: block; margin: 16px auto; min-height: 48px; padding: 12px 28px;
  border: 3px solid currentColor; border-radius: 14px; font: inherit; font-size: 18px; font-weight: 700;
  cursor: pointer; background: #2f7d32; color: #fff; border-color: #1f5a22;
  box-shadow: 0 3px 0 #1f5a22; touch-action: manipulation; }
.mg-again:active { transform: translateY(2px); box-shadow: 0 1px 0 #1f5a22; }
.mg-again:focus-visible { outline: 3px solid #f2c94c; outline-offset: 3px; }
.mg-again:disabled { opacity: .55; cursor: default; }
.mg-again[hidden] { display: none; }
`;

function injectStyle(doc) {
  if (!doc?.head || doc.getElementById?.(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  doc.head.appendChild(s);
}


export function labelOf(source) {
  const text = String(source?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const aria = source?.getAttribute?.('aria-label') ?? '';
  
  return /\p{L}/u.test(text) ? text : (aria || text);
}









export function mountPlayAgain({ anchor, source, scroll = true, doc = globalThis.document }) {
  injectStyle(doc);
  const el = doc.createElement('button');
  el.type = 'button';
  
  
  const kit = kitClass('button_primary', 'rematch', doc);
  el.className = kit ? `mg-again ${kit}` : 'mg-again';
  el.id = 'play-again';
  el.hidden = true;
  el.addEventListener('click', () => { if (!source.disabled) source.click(); });
  anchor.after(el);
  return {
    el,
    update(over) {
      const wasHidden = el.hidden;
      el.hidden = !over;
      if (!over) return;
      const label = labelOf(source);
      const text = kit ? label : `↻ ${label}`;
      if (el.textContent !== text) el.textContent = text;
      el.disabled = !!source.disabled;
      if (wasHidden && scroll) {
        setTimeout(() => { try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch {  } }, 60);
      }
    },
  };
}
