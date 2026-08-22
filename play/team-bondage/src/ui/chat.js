












const MAX_LINES = 7;
const FADE_AFTER_MS = 9000;

export class Chat {
  
  constructor({ onSend } = {}) {
    this.root  = document.getElementById('chat');
    this.log   = document.getElementById('chat-log');
    this.form  = document.getElementById('chat-form');
    this.input = document.getElementById('chat-input');
    this.btn   = document.getElementById('chat-btn');
    this.onSend = onSend || (() => {});
    this._lines = [];
    if (!this.root) return;

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (this.input.value || '').trim();
      this.input.value = '';
      this.close();
      if (text) this.onSend(text);
    });
    this.input?.addEventListener('keydown', (e) => {
      
      e.stopPropagation();
      if (e.key === 'Escape') { this.input.value = ''; this.close(); }
    });
    this.btn?.addEventListener('click', (e) => { e.preventDefault(); this.toggle(); });
    this.btn?.addEventListener('touchstart', (e) => { e.preventDefault(); this.toggle(); },
      { passive: false });

    
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || this.isComposing()) return;
      if (document.activeElement && /input|textarea/i.test(document.activeElement.tagName)) return;
      e.preventDefault();
      this.open();
    });
    this._tick = setInterval(() => this._fadeOld(), 1000);
  }

  isComposing() { return !!this.root?.classList.contains('composing'); }

  open() {
    if (!this.root) return;
    this.root.classList.add('composing');
    
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.input?.focus();
  }

  close() {
    if (!this.root) return;
    this.root.classList.remove('composing');
    this.input?.blur();
  }

  toggle() { this.isComposing() ? this.close() : this.open(); }

  
  push({ name, text, team, kind = 'say' }) {
    if (!this.log || !text) return;
    const el = document.createElement('div');
    el.className = 'chat-line ' + (kind === 'system' ? 'system' : (team || ''))
                 + (kind === 'taunt' ? ' taunt' : '');
    if (kind === 'system') {
      el.textContent = text;
    } else {
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = name + ':';
      el.appendChild(who);
      
      
      
      el.appendChild(document.createTextNode(text));
    }
    el.dataset.at = String(Date.now());
    this.log.appendChild(el);
    this._lines.push(el);
    while (this._lines.length > MAX_LINES) this._lines.shift().remove();
  }

  system(text) { this.push({ text, kind: 'system' }); }

  _fadeOld() {
    const now = Date.now();
    for (const el of this._lines) {
      el.classList.toggle('faded', now - Number(el.dataset.at) > FADE_AFTER_MS);
    }
  }

  dispose() { clearInterval(this._tick); }
}
