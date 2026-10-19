


const KEYS_LEFT = ['ArrowLeft', 'KeyA'];
const KEYS_RIGHT = ['ArrowRight', 'KeyD'];
const KEYS_DOWN = ['ArrowDown', 'KeyS'];
const KEYS_JUMP = ['Space', 'KeyJ', 'ArrowUp', 'KeyW', 'KeyZ'];
const GAME_KEYS = new Set([...KEYS_LEFT, ...KEYS_RIGHT, ...KEYS_DOWN, ...KEYS_JUMP]);

export function createInput(target = window) {
  const down = new Set();
  const touch = { x: 0, down: false, jump: false };
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
      let jump = any(KEYS_JUMP);
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (!pad) continue;
        const ax = pad.axes[0] ?? 0;
        const ay = pad.axes[1] ?? 0;
        if (Math.abs(ax) > 0.3) x = Math.sign(ax);
        if (pad.buttons[14]?.pressed) x = -1;
        if (pad.buttons[15]?.pressed) x = 1;
        if (ay > 0.6 || pad.buttons[13]?.pressed) dn = true;
        if (pad.buttons[0]?.pressed || pad.buttons[1]?.pressed) jump = true;
      }
      if (touch.x !== 0) x = touch.x;
      if (touch.down) dn = true;
      if (touch.jump) jump = true;
      return { x, down: dn, jump };
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
    setKnob(dx, dy);
  });
  const release = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    touch.x = 0;
    touch.down = false;
    setKnob(0, 0);
  };
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);
  jump.addEventListener('pointerdown', (e) => {
    touch.jump = true;
    jump.setPointerCapture(e.pointerId);
    jump.classList.add('is-down');
  });
  const up = () => {
    touch.jump = false;
    jump.classList.remove('is-down');
  };
  jump.addEventListener('pointerup', up);
  jump.addEventListener('pointercancel', up);
}
