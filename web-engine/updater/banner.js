


























const STACK_ID = 'vc-banner-stack';
const STYLE_ID = 'vc-styles';











export function showBanner(spec) {
  if (typeof document === 'undefined' || !document.body) return null;
  injectStyles();
  const stack = ensureStack();
  let el = document.getElementById(spec.id);
  if (!el) {
    el = document.createElement('div');
    el.id = spec.id;
    el.className = 'vc-banner';
    
    
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    const text = document.createElement('span');
    text.className = 'vc-text';
    el.appendChild(text);
    stack.appendChild(el);
  }
  el.querySelector('.vc-text').textContent = spec.text;

  const existing = el.querySelector('.vc-btn');
  if (!spec.actionLabel) {
    existing?.remove();
  } else {
    const btn = existing ?? document.createElement('button');
    if (!existing) {
      btn.type = 'button';
      btn.className = 'vc-btn';
      el.appendChild(btn);
    }
    btn.textContent = spec.actionLabel;
    
    
    
    
    btn.onclick = spec.onAction ?? null;
  }
  return el;
}


export function hideBanner(id) {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.remove();
  return true;
}









function ensureStack() {
  let stack = document.getElementById(STACK_ID);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = STACK_ID;
    document.body.appendChild(stack);
  }
  return stack;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    #${STACK_ID} {
      position: fixed; z-index: 100000;
      left: 50%; transform: translateX(-50%);
      bottom: max(16px, env(safe-area-inset-bottom));
      display: flex; flex-direction: column-reverse; align-items: center;
      gap: 8px;
      max-width: 92vw;
      /* THE STACK MUST NOT EAT TOUCHES. It spans the width of the widest
         banner in it and sits over the bottom of a game whose steering and
         accelerator are down there; without this, an invisible strip of the
         touch controls stops working the moment any banner appears. The
         banners themselves take their pointer events back below. */
      pointer-events: none;
    }
    .vc-banner {
      pointer-events: auto;
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px;
      background: #1c1a17; color: #f6f1e6;
      font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #f4c95d;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      max-width: 92vw;
    }
    .vc-text { flex: 1 1 auto; }
    .vc-btn {
      appearance: none; border: 0; cursor: pointer;
      background: #f4c95d; color: #1c1a17;
      font: 600 13px inherit; padding: 6px 12px;
      border-radius: 6px;
    }
    .vc-btn:hover { background: #ffd670; }
  `;
  document.head.appendChild(s);
}
