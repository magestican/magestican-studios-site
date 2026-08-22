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
    // No #tc-debug element is built any more — the on-screen debug HUD was
    // removed on 2026-08-20 (docs/BACKLOG.md, "Debug HUD overlay removed").
    // `_paintDebug()` below is therefore a permanent no-op; it is kept only
    // because game.js still calls it every tick. Deleting it means deleting
    // that call and the `window.__tbDebug` snapshot it feeds at the same time.
    this._debug = null;
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

    // Attach to BOTH window and document to maximise coverage (some Safari
    // versions deliver touch events to only one).
    for (const target of [window, document]) {
      target.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
      target.addEventListener('touchmove',  (e) => this._onTouchMove(e),  { passive: false });
      target.addEventListener('touchend',   (e) => this._onTouchEnd(e),   { passive: false });
      target.addEventListener('touchcancel',(e) => this._onTouchEnd(e),   { passive: false });
    }
    // Debug counter of events received so user can prove input is (or isn't)
    // reaching our handlers.
    this._touchCount = 0;
    this._paintDebug();
  }

  _paintDebug() {
    if (!this._debug) return;
    const actions = ['moveForward','moveBack','moveLeft','moveRight','fire','jump']
      .filter((a) => this.input.isDown(a)).join(',') || '(none)';
    // The optional game snapshot is set every frame by game.js._tick so we
    // can see WHY movement isn't happening on the phone (position, velocity,
    // match state, alive, tick count).
    const gs = window.__tbDebug || {};
    this._debug.textContent =
      `touches: ${this._touchCount}  active: ${this._joystickTouch ? 'J' : '-'}${this._lookTouch ? 'L' : '-'}\n` +
      `actions: ${actions}\n` +
      `state:   ${gs.match || '?'}   alive: ${gs.alive === undefined ? '?' : gs.alive}   ticks: ${gs.ticks ?? 0}\n` +
      `grounded:${gs.grounded === undefined ? '?' : gs.grounded}   jumps: ${gs.jumps ?? 0}\n` +
      `pos:     ${gs.pos || '?'}\n` +
      `vel:     ${gs.vel || '?'}`;
  }

  _onTouchStart(e) {
    this._touchCount++;
    for (const t of e.changedTouches) {
      // If touch landed on any BUTTON or interactive overlay (refresh banner,
      // mute, mature, add-bot, enable-sound, lobby banner, anagram input),
      // let the browser fire its normal click - do NOT consume the event or
      // it'll get swallowed by preventDefault below.
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
        this._lookTouch = { id: t.identifier, lastX: t.clientX, lastY: t.clientY };
        e.preventDefault();
      }
    }
    this._paintDebug();
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
        this._paintDebug();
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
    this._paintDebug();
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
