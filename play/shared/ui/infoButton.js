






























const STYLE_ID = 'mg-info-style';













function installStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.mg-info-btn {
  width: 44px; height: 44px; padding: 0; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.72); background: rgba(12,14,18,0.78);
  color: #fff; font: 700 24px/1 Georgia, 'Times New Roman', serif;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent;
}
.mg-info-btn:hover, .mg-info-btn:focus-visible {
  background: rgba(28,32,40,0.92); border-color: #fff; outline: none;
}
.mg-info-btn:focus-visible { box-shadow: 0 0 0 3px rgba(120,170,255,0.9); }
.mg-info-btn.mg-info-float {
  position: fixed; z-index: 2147483000;
  top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right));
}
.mg-info-back {
  position: fixed; inset: 0; z-index: 2147483001; display: none;
  align-items: center; justify-content: center; padding: 16px;
  background: rgba(4,6,10,0.86);
}
.mg-info-back.mg-info-on { display: flex; }
.mg-info-panel {
  box-sizing: border-box; width: 100%; max-width: 560px; max-height: 86vh; overflow: auto;
  background: #14171d; color: #eef1f6; border: 2px solid #7d8797; border-radius: 12px;
  padding: 20px 22px 16px;
  font: 400 16px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-overflow-scrolling: touch;
}
.mg-info-panel h2 { margin: 0 0 12px; font-size: 22px; line-height: 1.2; }
.mg-info-panel h2, .mg-info-panel h3 { color: #ffd98a; }
.mg-info-panel h3 { margin: 16px 0 6px; font-size: 17px; }
.mg-info-panel ul { margin: 0 0 12px; padding-left: 22px; }
.mg-info-panel li { margin: 0 0 6px; }
.mg-info-panel p { margin: 0 0 12px; }
.mg-info-panel kbd {
  display: inline-block; min-width: 1.4em; padding: 1px 6px; margin: 0 1px;
  background: #262b34; border: 1px solid #4d5563; border-radius: 4px;
  font: 600 14px/1.5 ui-monospace, Menlo, Consolas, monospace; text-align: center;
}
.mg-info-panel a { color: #9fc4ff; }
.mg-info-close {
  display: block; width: 100%; margin-top: 8px; padding: 13px;
  border: 0; border-radius: 8px; background: #ffd98a; color: #1c1a17;
  font: 700 16px/1 inherit; cursor: pointer;
}
.mg-info-close:hover, .mg-info-close:focus-visible { background: #ffe6ad; outline: none; }
@media (max-width: 480px) {
  .mg-info-panel { font-size: 15px; padding: 16px 16px 12px; }
  .mg-info-panel h2 { font-size: 20px; }
}
@media (prefers-reduced-motion: reduce) { .mg-info-btn { transition: none; } }
`;
  doc.head.appendChild(style);
}

















export function installInfo({
  title = 'How to play',
  html = '',
  contentFrom = null,
  into = null,
  label = 'How to play',
  onOpen = null,
  doc = typeof document === 'undefined' ? null : document,
} = {}) {
  if (!doc) return null;
  installStyle(doc);

  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'mg-info-btn';
  button.id = 'mg-info-btn';
  
  
  
  
  
  button.textContent = 'i';
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-expanded', 'false');

  const host = typeof into === 'string' ? doc.querySelector(into) : into;
  if (host) host.appendChild(button);
  else { button.classList.add('mg-info-float'); doc.body.appendChild(button); }

  let back = null;
  let panel = null;

  if (!onOpen) {
    back = doc.createElement('div');
    back.className = 'mg-info-back';
    back.id = 'mg-info-back';
    panel = doc.createElement('div');
    panel.className = 'mg-info-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', title);
    back.appendChild(panel);
    doc.body.appendChild(back);
  }

  const fill = () => {
    if (!panel) return;
    const source = contentFrom ? doc.querySelector(contentFrom) : null;
    const body = source ? source.innerHTML : html;
    panel.innerHTML = `<h2>${title}</h2>${body}`;
    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'mg-info-close';
    close.textContent = 'Close';
    close.addEventListener('click', () => api.close());
    panel.appendChild(close);
    
    
    
    try { close.focus(); } catch {  }
  };

  let open = false;

  const api = {
    button,
    get panel() { return panel; },
    get isOpen() { return open; },

    open() {
      if (open) return;
      open = true;
      button.setAttribute('aria-expanded', 'true');
      
      
      try { window.dispatchEvent(new CustomEvent('mg-info-open')); } catch {  }
      if (onOpen) { onOpen(); return; }
      fill();
      back.classList.add('mg-info-on');
    },

    close() {
      if (!open) return;
      open = false;
      button.setAttribute('aria-expanded', 'false');
      if (back) back.classList.remove('mg-info-on');
      try { window.dispatchEvent(new CustomEvent('mg-info-close')); } catch {  }
      try { button.focus(); } catch {  }
    },

    toggle() { return open ? api.close() : api.open(); },
  };

  button.addEventListener('click', (e) => { e.preventDefault(); api.toggle(); });

  if (back) {
    
    
    back.addEventListener('click', (e) => { if (e.target === back) api.close(); });
  }

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { e.preventDefault(); api.close(); }
  });

  return api;
}
