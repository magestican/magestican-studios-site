// Touch controls for iOS / Android. Rendered as an HTML overlay on top of
// the canvas. Three regions:
//
//   * Left thumb: virtual analog stick -> feeds moveForward/Back/Left/Right
//     into the shared InputBus as synthetic actions.
//   * Right half of the screen (minus the button cluster): drag to look.
//     Yaw/pitch delta is applied to the player each move.
//   * Bottom-right cluster: FIRE (big), JUMP (medium), 1/2/3 weapon chips.
//
// The controls are transparent-until-touched; the joystick base only appears
// on the initial finger-down so you can plant your thumb anywhere on the
// left half.

export class TouchControls {
  /**
   * @param {HTMLElement} container - the game's canvas parent
   * @param {import('arbelo/input').InputBus} input
   * @param {{onLook:(dx:number,dy:number)=>void, onFire:()=>void, onWeapon:(i:number)=>void, onJump:()=>void}} handlers
   */
  constructor(container, input, handlers) {
    this.container = container;
    this.input = input;
    this.handlers = handlers;

    // Track active touches per region.
    this._joystickTouch = null; // { id, cx, cy }
    this._lookTouch = null;     // { id, lastX, lastY }

    this._buildDom();
    this._wireEvents();
  }

  _buildDom() {
    const el = document.createElement('div');
    el.id = 'touch-controls';
    el.innerHTML = `
      <div id="tc-joystick-base"></div>
      <div id="tc-joystick-knob"></div>
      <div id="tc-debug"></div>
      <div id="tc-buttons">
        <button class="tc-btn tc-weapon" data-w="0" aria-label="Pistol">1</button>
        <button class="tc-btn tc-weapon" data-w="1" aria-label="Shotgun">2</button>
        <button class="tc-btn tc-weapon" data-w="2" aria-label="Rocket">3</button>
        <button class="tc-btn tc-jump"   aria-label="Jump">JUMP</button>
        <button class="tc-btn tc-fire"   aria-label="Fire">FIRE</button>
      </div>
    `;
    this._el = el;
    this._debug = el.querySelector('#tc-debug');
    this._joystickBase = el.querySelector('#tc-joystick-base');
    this._joystickKnob = el.querySelector('#tc-joystick-knob');
    this._joystickBase.style.display = 'none';
    this._joystickKnob.style.display = 'none';
    this.container.appendChild(el);

    // Inject the CSS once.
    if (!document.getElementById('tc-styles')) {
      const s = document.createElement('style');
      s.id = 'tc-styles';
      s.textContent = TOUCH_CSS;
      document.head.appendChild(s);
    }
  }

  _wireEvents() {
    // Button taps: fire, jump, weapon-switch
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
      // Release next frame so it's a one-shot.
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

    // Window-level touch listeners so we get events regardless of what
    // element the touch landed on (canvas, container, HUD - all pass-through
    // when pointer-events:none is set on some layers).
    window.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    window.addEventListener('touchmove',  (e) => this._onTouchMove(e),  { passive: false });
    window.addEventListener('touchend',   (e) => this._onTouchEnd(e),   { passive: false });
    window.addEventListener('touchcancel',(e) => this._onTouchEnd(e),   { passive: false });
  }

  _onTouchStart(e) {
    for (const t of e.changedTouches) {
      // If touch landed on a button, let the button handler own it.
      if (t.target && t.target.closest && t.target.closest('#tc-buttons')) continue;
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
        this._lookTouch = { id: t.identifier, lastX: t.clientX, lastY: t.clientY };
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
        // Convert stick to WASD synthetic actions with a small dead-zone.
        const nx = dx / R, ny = dy / R;
        const DZ = 0.10;   // small dead zone so tiny thumb drift still moves
        this.input.setSynthetic('moveLeft',    nx < -DZ);
        this.input.setSynthetic('moveRight',   nx >  DZ);
        this.input.setSynthetic('moveForward', ny < -DZ);
        this.input.setSynthetic('moveBack',    ny >  DZ);
        // Live debug so we can see the joystick actually feeding the input bus.
        if (this._debug) {
          this._debug.textContent = `JS  x=${nx.toFixed(2)}  y=${ny.toFixed(2)}  ` +
            `[${['moveLeft','moveRight','moveForward','moveBack']
              .filter((a) => this.input.isDown(a)).join(',') || '-'}]`;
        }
        e.preventDefault();
      } else if (this._lookTouch && t.identifier === this._lookTouch.id) {
        const dx = t.clientX - this._lookTouch.lastX;
        const dy = t.clientY - this._lookTouch.lastY;
        this._lookTouch.lastX = t.clientX;
        this._lookTouch.lastY = t.clientY;
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
        this._lookTouch = null;
      }
    }
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
#tc-debug {
  position: absolute; left: 12px; top: 100px;
  font: 11px "SF Mono", Menlo, Consolas, monospace;
  color: #f4c95d; background: rgba(0,0,0,0.5);
  padding: 3px 6px; border-radius: 4px;
  pointer-events: none;
}
#tc-joystick-base {
  position: absolute; width: 120px; height: 120px;
  border: 2px solid rgba(255,255,255,0.35);
  border-radius: 50%;
  background: rgba(0,0,0,0.15);
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
.tc-btn.tc-weapon[data-w="0"] { grid-area: w1; }
.tc-btn.tc-weapon[data-w="1"] { grid-area: w2; }
.tc-btn.tc-weapon[data-w="2"] { grid-area: w3; }
.tc-btn.tc-jump { grid-area: jump; }
.tc-btn.tc-fire { grid-area: fire; background: rgba(183,58,42,0.55); border-color: rgba(255,124,106,0.7); font-size: 20px; }

/* Also cover the whole game area so browser scroll/zoom is suppressed. */
canvas { touch-action: none; }
`;
