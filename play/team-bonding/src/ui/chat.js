












import { isObserver } from '../../../../web-engine/match/observer.js';
import { iconFor } from '../../../../web-engine/ui/characterIcon.js';












const MAX_LINES = 3;









const FADE_AFTER_MS = 14000;


















export function chatLineLabel({ team, localTeam, self = false } = {}) {
  if (self) return { relation: 'you', tag: '» ME' };
  
  
  
  
  
  
  
  
  if (isObserver(team) || isObserver(localTeam)) {
    return { relation: 'observer', tag: '👁 WATCHING' };
  }
  if (team && localTeam) {
    return team === localTeam
      ? { relation: 'ally',  tag: '+ US' }
      : { relation: 'enemy', tag: '× THEM' };
  }
  
  
  
  
  if (team) return { relation: 'unknown', tag: String(team).toUpperCase() };
  return { relation: 'unknown', tag: '' };
}

export class Chat {
  
  
  
  
  
  
  
  constructor({ onSend, getLocalTeam, getLocalId, getCharacter } = {}) {
    this.root  = document.getElementById('chat');
    this.log   = document.getElementById('chat-log');
    this.form  = document.getElementById('chat-form');
    this.input = document.getElementById('chat-input');
    this.btn   = document.getElementById('chat-btn');
    this.onSend = onSend || (() => {});
    this._getLocalTeam = getLocalTeam || null;
    this._getLocalId   = getLocalId || null;
    
    
    
    
    
    
    
    
    
    this._getCharacter = getCharacter || null;
    this._localTeam = null;   
    this._localId   = null;
    this._sendingSelf = false;
    this._lines = [];
    if (!this.root) return;

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (this.input.value || '').trim();
      this.input.value = '';
      this.close();
      if (text) this._send(text);
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

  
  setLocalIdentity({ id, team } = {}) {
    if (id != null) this._localId = id;
    if (team != null) this._localTeam = team;
  }

  localTeam() { return this._getLocalTeam?.() ?? this._localTeam ?? null; }
  localId()   { return this._getLocalId?.()   ?? this._localId   ?? null; }

  
  
  
  
  
  
  
  _send(text) {
    this._sendingSelf = true;
    try { this.onSend(text); } finally { this._sendingSelf = false; }
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

  
  push({ name, text, team, from, character, kind = 'say' }) {
    if (!this.log || !text) return;
    
    if (this._sendingSelf) {
      if (from != null) this._localId = from;
      if (team != null) this._localTeam = team;
    }
    const localId = this.localId();
    const self = this._sendingSelf || (localId != null && from != null && from === localId);
    const label = chatLineLabel({ team, localTeam: this.localTeam(), self });

    const el = document.createElement('div');
    el.className = 'chat-line ' + (kind === 'system' ? 'system' : (team || ''))
                 + (kind === 'taunt' ? ' taunt' : '')
                 + (kind === 'system' ? '' : ' ' + label.relation);
    if (kind === 'system') {
      el.textContent = text;
    } else {
      if (label.tag) {
        
        
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = label.tag;
        el.appendChild(tag);
      }
      
      
      
      
      
      
      
      
      
      const ch = character || this._getCharacter?.(from) || null;
      const icon = document.createElement('span');
      icon.className = 'chat-icon';
      icon.textContent = iconFor(ch);
      el.appendChild(icon);

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
