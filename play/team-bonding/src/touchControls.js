


























export const TAP_MAX_MOVE_PX = 14;
export const TAP_MAX_MS = 300;

export function isTapToFire(touch, endedAt) {
  if (!touch) return false;
  const dt = endedAt - touch.startedAt;
  if (!(dt >= 0) || dt > TAP_MAX_MS) return false;
  return (touch.maxMove ?? 0) <= TAP_MAX_MOVE_PX;
}

export class TouchControls {
  




  constructor(container, input, handlers) {
    this.container = container;
    this.input = input;
    this.handlers = handlers;

    
    this._joystickTouch = null; 
    this._lookTouch = null;     

    this._buildDom();
    this._wireEvents();
  }

  _buildDom() {
    const el = document.createElement('div');
    el.id = 'touch-controls';
    el.innerHTML = `
      <div id="tc-joystick-base"><span id="tc-joystick-hint">DRAG →</span></div>
      <div id="tc-joystick-knob"></div>
      <div id="tc-buttons">
        <button class="tc-btn tc-weapon" data-w="0" aria-label="Shovel">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14 3l7 7-3 3-2-2-7 7-3-3 7-7-2-2z" fill="#c99a63" stroke="#402208" stroke-width="1.4" stroke-linejoin="round"/><circle cx="6" cy="18" r="2.2" fill="#6b3d16"/></svg>
          <span class="tc-key">1</span></button>
        <button class="tc-btn tc-weapon" data-w="1" aria-label="Shotgun">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="10" width="13" height="4" rx="1" fill="#3d2a1e" stroke="#0f0e0c" stroke-width="1"/><rect x="15" y="7" width="6" height="10" rx="1.2" fill="#7a5233" stroke="#0f0e0c" stroke-width="1"/></svg>
          <span class="tc-key">2</span></button>
        <button class="tc-btn tc-weapon" data-w="2" aria-label="Rocket">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2c3 3 4 7 4 10v6l-4 3-4-3v-6c0-3 1-7 4-10z" fill="#e8d9a0" stroke="#402208" stroke-width="1.2"/><circle cx="12" cy="10" r="1.7" fill="#7fa8d4"/></svg>
          <span class="tc-key">3</span></button>
        <button class="tc-btn tc-jump"   aria-label="Jump">JUMP</button>
        <button class="tc-btn tc-fire"   aria-label="Fire">FIRE</button>
      </div>
    `;
    this._el = el;
    
    
    
    
    
    
    
    
    
    
    
    this._joystickBase = el.querySelector('#tc-joystick-base');
    this._joystickKnob = el.querySelector('#tc-joystick-knob');
    this._joystickBase.style.display = 'none';
    this._joystickKnob.style.display = 'none';
    this.container.appendChild(el);

    
    if (!document.getElementById('tc-styles')) {
      const s = document.createElement('style');
      s.id = 'tc-styles';
      s.textContent = TOUCH_CSS;
      document.head.appendChild(s);
    }
  }

  _wireEvents() {
    
    for (const btn of this._el.querySelectorAll('.tc-weapon')) {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handlers.onWeapon(Number(btn.dataset.w));
        this._markActive(btn);
      }, { passive: false });
    }
    const jump = this._el.querySelector('.tc-jump');
    jump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.input.setSynthetic('jump', true);
      this._markActive(jump);
      
      setTimeout(() => this.input.setSynthetic('jump', false), 80);
    }, { passive: false });

    const fire = this._el.querySelector('.tc-fire');
    fire.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.input.setSynthetic('fire', true);
      this._markActive(fire);
    }, { passive: false });
    fire.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.input.setSynthetic('fire', false);
    }, { passive: false });
    fire.addEventListener('touchcancel', () => this.input.setSynthetic('fire', false));

    
    
    for (const target of [window, document]) {
      target.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
      target.addEventListener('touchmove',  (e) => this._onTouchMove(e),  { passive: false });
      target.addEventListener('touchend',   (e) => this._onTouchEnd(e),   { passive: false });
      target.addEventListener('touchcancel',(e) => this._onTouchEnd(e),   { passive: false });
    }
    
    
    this._touchCount = 0;
  }

  _onTouchStart(e) {
    this._touchCount++;
    for (const t of e.changedTouches) {
      
      
      
      
      if (t.target && t.target.closest && (
        t.target.closest('#tc-buttons') ||
        t.target.closest('button') ||
        t.target.closest('input') ||
        t.target.closest('.vc-banner') ||
        t.target.closest('#lobby-banner') ||
        t.target.closest('#anagramWrap') ||
        t.target.closest('#enable-sound') ||
        t.target.closest('.device-qr-card')
      )) continue;
      const isLeft = t.clientX < window.innerWidth / 2;
      if (isLeft && !this._joystickTouch) {
        this._joystickTouch = { id: t.identifier, cx: t.clientX, cy: t.clientY };
        this._joystickBase.style.display = 'block';
        this._joystickKnob.style.display = 'block';
        this._joystickBase.style.left = (t.clientX - 60) + 'px';
        this._joystickBase.style.top  = (t.clientY - 60) + 'px';
        this._joystickKnob.style.left = (t.clientX - 25) + 'px';
        this._joystickKnob.style.top  = (t.clientY - 25) + 'px';
        e.preventDefault();
      } else if (!isLeft && !this._lookTouch) {
        
        
        
        
        
        this._lookTouch = { id: t.identifier, lastX: t.clientX, lastY: t.clientY,
                            startX: t.clientX, startY: t.clientY,
                            startedAt: Date.now(), maxMove: 0 };
        e.preventDefault();
      }
    }
  }

  _onTouchMove(e) {
    for (const t of e.changedTouches) {
      if (this._joystickTouch && t.identifier === this._joystickTouch.id) {
        const { cx, cy } = this._joystickTouch;
        let dx = t.clientX - cx;
        let dy = t.clientY - cy;
        const R = 55;
        const len = Math.hypot(dx, dy);
        if (len > R) { dx = dx * R / len; dy = dy * R / len; }
        this._joystickKnob.style.left = (cx + dx - 25) + 'px';
        this._joystickKnob.style.top  = (cy + dy - 25) + 'px';
        
        const nx = dx / R, ny = dy / R;
        const DZ = 0.10;   
        this.input.setSynthetic('moveLeft',    nx < -DZ);
        this.input.setSynthetic('moveRight',   nx >  DZ);
        this.input.setSynthetic('moveForward', ny < -DZ);
        this.input.setSynthetic('moveBack',    ny >  DZ);
        e.preventDefault();
      } else if (this._lookTouch && t.identifier === this._lookTouch.id) {
        const dx = t.clientX - this._lookTouch.lastX;
        const dy = t.clientY - this._lookTouch.lastY;
        this._lookTouch.lastX = t.clientX;
        this._lookTouch.lastY = t.clientY;
        this._lookTouch.maxMove = Math.max(this._lookTouch.maxMove ?? 0,
          Math.hypot(t.clientX - this._lookTouch.startX,
                     t.clientY - this._lookTouch.startY));
        this.handlers.onLook(dx, dy);
        e.preventDefault();
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (this._joystickTouch && t.identifier === this._joystickTouch.id) {
        this._joystickTouch = null;
        this._joystickBase.style.display = 'none';
        this._joystickKnob.style.display = 'none';
        this.input.setSynthetic('moveLeft', false);
        this.input.setSynthetic('moveRight', false);
        this.input.setSynthetic('moveForward', false);
        this.input.setSynthetic('moveBack', false);
      }
      if (this._lookTouch && t.identifier === this._lookTouch.id) {
        
        
        if (isTapToFire(this._lookTouch, Date.now())) this._pulseFire();
        this._lookTouch = null;
      }
    }
  }

  
  
  
  
  
  
  
  _pulseFire() {
    this.input.setSynthetic('fire', true);
    const release = () => this.input.setSynthetic('fire', false);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(release));
    } else {
      setTimeout(release, 32);
    }
    const btn = this._el && this._el.querySelector('.tc-fire');
    if (btn) this._markActive(btn);
  }

  _markActive(btn) {
    btn.classList.add('tc-flash');
    setTimeout(() => btn.classList.remove('tc-flash'), 130);
  }

  destroy() { if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el); }
}

const TOUCH_CSS = `
#touch-controls {
  position: fixed; inset: 0; z-index: 6;
  /* No pointer-events:none -- we want touches on the joystick area to be
     consumed by the overlay, not slip through to the canvas underneath. */
  touch-action: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
#tc-joystick-base {
  position: absolute; width: 120px; height: 120px;
  border: 2px solid rgba(244,201,93,0.7);
  border-radius: 50%;
  background: rgba(0,0,0,0.25);
  display: flex; align-items: center; justify-content: center;
}
#tc-joystick-hint {
  font: 700 12px -apple-system, "Segoe UI", sans-serif;
  color: #f4c95d;
  pointer-events: none;
}
#tc-joystick-knob {
  position: absolute; width: 50px; height: 50px;
  border: 2px solid rgba(255,255,255,0.55);
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
}
#tc-buttons {
  position: absolute; right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  display: grid; grid-template-columns: 60px 60px 100px; grid-template-rows: 60px 60px;
  gap: 8px;
  grid-template-areas:
    "w1 w2 fire"
    "w3 jump fire";
}
.tc-btn {
  font: 700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.08s ease;
}
.tc-btn.tc-flash { background: rgba(244,201,93,0.7); }
.tc-btn.tc-weapon { display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 2px; padding: 4px; }
.tc-btn.tc-weapon .tc-key { font-size: 10px; opacity: 0.8; letter-spacing: 0.05em; }
.tc-btn.tc-weapon[data-w="0"] { grid-area: w1; }
.tc-btn.tc-weapon[data-w="1"] { grid-area: w2; }
.tc-btn.tc-weapon[data-w="2"] { grid-area: w3; }
.tc-btn.tc-jump { grid-area: jump; }
.tc-btn.tc-fire { grid-area: fire; background: rgba(183,58,42,0.55); border-color: rgba(255,124,106,0.7); font-size: 20px; }

/* Also cover the whole game area so browser scroll/zoom is suppressed. */
canvas { touch-action: none; }
`;
