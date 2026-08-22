// Chat. Log always visible, input only while composing.
//
// The one rule that shapes the whole thing: in a game where WASD moves you,
// a text field that is always focusable will eat your movement keys. So the
// input is a MODE — Enter opens it, Enter sends and closes it, Escape
// abandons it — and while it is closed the field is display:none and cannot
// take focus at all. `isComposing()` lets the game suppress input handling for
// exactly as long as the field is open.
//
// Lines fade rather than disappear so the log never becomes a wall, but the
// last few stay readable; opening the composer un-fades everything, because
// the moment you decide to talk is the moment you want to read what was said.

const MAX_LINES = 7;
const FADE_AFTER_MS = 9000;

export class Chat {
  // onSend(text) is called with the trimmed, non-empty message.
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
      // Stop game keybinds from seeing anything typed here.
      e.stopPropagation();
      if (e.key === 'Escape') { this.input.value = ''; this.close(); }
    });
    this.btn?.addEventListener('click', (e) => { e.preventDefault(); this.toggle(); });
    this.btn?.addEventListener('touchstart', (e) => { e.preventDefault(); this.toggle(); },
      { passive: false });

    // Enter opens the composer from anywhere in the game.
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
    // Release pointer lock so the player can actually see and type.
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.input?.focus();
  }

  close() {
    if (!this.root) return;
    this.root.classList.remove('composing');
    this.input?.blur();
  }

  toggle() { this.isComposing() ? this.close() : this.open(); }

  // kind: 'say' | 'taunt' | 'system'
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
      // textContent, never innerHTML — chat is untrusted input from peers and
      // this is the one place in the game where somebody else's string reaches
      // the DOM.
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
