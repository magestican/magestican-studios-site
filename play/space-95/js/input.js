


const KEYS_LEFT = ['ArrowLeft', 'KeyA'];
const KEYS_RIGHT = ['ArrowRight', 'KeyD'];
const KEYS_DOWN = ['ArrowDown', 'KeyS'];
const KEYS_UP = ['ArrowUp', 'KeyW']; 
const KEYS_JUMP = ['Space', 'KeyJ', 'KeyZ'];
const KEYS_DASH = ['ShiftLeft', 'ShiftRight', 'KeyL', 'KeyX'];
const KEYS_TETHER = ['KeyK', 'KeyC']; 
const GAME_KEYS = new Set([...KEYS_LEFT, ...KEYS_RIGHT, ...KEYS_DOWN, ...KEYS_UP, ...KEYS_JUMP, ...KEYS_DASH, ...KEYS_TETHER]);

export function createInput(target = window) {
  const down = new Set();
  const touch = { x: 0, down: false, up: false, jump: false, dash: false, tether: false };
  target.addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    down.add(e.code);
  });
  target.addEventListener('keyup', (e) => down.delete(e.code));
  target.addEventListener('blur', () => down.clear());
  const any = (codes) => codes.some((c) => down.has(c));

  return {
    touch,
    
    sample() {
      let x = (any(KEYS_RIGHT) ? 1 : 0) - (any(KEYS_LEFT) ? 1 : 0);
      let dn = any(KEYS_DOWN);
      let up = any(KEYS_UP);
      let jump = any(KEYS_JUMP);
      let dash = any(KEYS_DASH);
      let tether = any(KEYS_TETHER);
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (!pad) continue;
        const ax = pad.axes[0] ?? 0;
        const ay = pad.axes[1] ?? 0;
        if (Math.abs(ax) > 0.3) x = Math.sign(ax);
        if (pad.buttons[14]?.pressed) x = -1;
        if (pad.buttons[15]?.pressed) x = 1;
        if (ay > 0.6 || pad.buttons[13]?.pressed) dn = true;
        if (ay < -0.6 || pad.buttons[12]?.pressed) up = true;
        if (pad.buttons[0]?.pressed || pad.buttons[1]?.pressed) jump = true;
        if (pad.buttons[2]?.pressed || pad.buttons[5]?.pressed || pad.buttons[7]?.pressed) dash = true;
        if (pad.buttons[3]?.pressed) tether = true; 
      }
      if (touch.x !== 0) x = touch.x;
      if (touch.down) dn = true;
      if (touch.up) up = true;
      if (touch.jump) jump = true;
      if (touch.dash) dash = true;
      if (touch.tether) tether = true;
      return { x, down: dn, up, jump, dash, tether };
    },
  };
}






export function mountTouchControls(root, touch) {
  const stick = root.querySelector('[data-touch="stick"]');
  const knob = root.querySelector('[data-touch="knob"]');
  const jump = root.querySelector('[data-touch="jump"]');
  if (!stick || !jump) return;
  let stickId = null;
  let ox = 0;
  let oy = 0;
  const setKnob = (dx, dy) => {
    if (knob) knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  stick.addEventListener('pointerdown', (e) => {
    stickId = e.pointerId;
    ox = e.clientX;
    oy = e.clientY;
    stick.setPointerCapture(e.pointerId);
  });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    const dx = Math.max(-48, Math.min(48, e.clientX - ox));
    const dy = Math.max(-48, Math.min(48, e.clientY - oy));
    touch.x = Math.abs(dx) > 14 ? Math.sign(dx) : 0;
    touch.down = dy > 30;
    touch.up = dy < -30;
    setKnob(dx, dy);
  });
  const release = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    touch.x = 0;
    touch.down = false;
    touch.up = false;
    setKnob(0, 0);
  };
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);
  holdButton(jump, (on) => {
    touch.jump = on;
  });
  const dash = root.querySelector('[data-touch="dash"]');
  if (dash) {
    holdButton(dash, (on) => {
      touch.dash = on;
    });
  }
  
  const tether = root.querySelector('[data-touch="tether"]');
  if (tether) {
    holdButton(tether, (on) => {
      touch.tether = on;
    });
  }
}


function holdButton(el, set) {
  el.addEventListener('pointerdown', (e) => {
    set(true);
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-down');
  });
  const up = () => {
    set(false);
    el.classList.remove('is-down');
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
