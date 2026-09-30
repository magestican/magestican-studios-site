










import { InputBus } from '../../vendor/arbelo/input/inputBus.js';


export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

export function createInput({ bindings, padBindings = {}, glyphs = {}, stickZone = null, canStartStick = () => true }) {
  const bus = new InputBus(window);
  bus.bindings = { ...bindings };
  
  let mode = window.matchMedia && matchMedia('(pointer: coarse) and (hover: none)').matches ? 'touch' : 'keys';
  const modeListeners = new Set();
  const setMode = m => {
    if (m === mode) return;
    mode = m;
    document.body.classList.remove('input-keys', 'input-pad', 'input-touch');
    document.body.classList.add('input-' + m);
    modeListeners.forEach(f => f(m));
  };
  document.body.classList.add('input-' + mode);
  window.addEventListener('keydown', () => setMode('keys'));
  window.addEventListener('pointerdown', e => setMode(e.pointerType === 'touch' ? 'touch' : mode === 'touch' ? 'keys' : mode), true);

  
  const stickEl = document.createElement('div'); stickEl.className = 'stick hidden';
  stickEl.innerHTML = '<div class="stick-knob"></div>';
  document.body.appendChild(stickEl);
  const knob = stickEl.firstChild;
  const touch = { id: null, ox: 0, oy: 0, x: 0, y: 0, active: false };
  const STICK_R = 56;
  if (stickZone) {
    stickZone.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || touch.id !== null || !canStartStick(e)) return;
      touch.id = e.pointerId; touch.ox = e.clientX; touch.oy = e.clientY; touch.x = touch.y = 0; touch.active = true;
      stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; stickEl.classList.remove('hidden');
      knob.style.transform = 'translate(-50%,-50%)';
    });
    window.addEventListener('pointermove', e => {
      if (e.pointerId !== touch.id) return;
      let dx = e.clientX - touch.ox, dy = e.clientY - touch.oy;
      const l = Math.hypot(dx, dy); if (l > STICK_R) { dx *= STICK_R / l; dy *= STICK_R / l; }
      touch.x = dx / STICK_R; touch.y = dy / STICK_R;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    const end = e => { if (e.pointerId !== touch.id) return; touch.id = null; touch.active = false; touch.x = touch.y = 0; stickEl.classList.add('hidden'); };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }

  
  const pad = { lx: 0, ly: 0, rx: 0, ry: 0, connected: false };
  const dz = v => (Math.abs(v) < 0.18 ? 0 : v);
  function pollPad() {
    const gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected);
    pad.connected = !!gp;
    if (!gp) return;
    pad.lx = dz(gp.axes[0] || 0); pad.ly = dz(gp.axes[1] || 0); pad.rx = dz(gp.axes[2] || 0); pad.ry = dz(gp.axes[3] || 0);
    let any = Math.abs(pad.lx) + Math.abs(pad.ly) + Math.abs(pad.rx) + Math.abs(pad.ry) > 0.3;
    for (const [action, btns] of Object.entries(padBindings)) {
      const down = btns.some(b => gp.buttons[b] && gp.buttons[b].pressed);
      if (down) any = true;
      bus.setSynthetic(action, down);
    }
    if (gp.buttons[PAD.UP]?.pressed) pad.ly = -1; if (gp.buttons[PAD.DOWN]?.pressed) pad.ly = 1;
    if (gp.buttons[PAD.LEFT]?.pressed) pad.lx = -1; if (gp.buttons[PAD.RIGHT]?.pressed) pad.lx = 1;
    if (any) setMode('pad');
  }

  const api = {
    bus,
    get mode() { return mode; },
    onMode(f) { modeListeners.add(f); return () => modeListeners.delete(f); },
    update() { pollPad(); },
    endFrame() { bus.endFrame(); },
    down: a => bus.isDown(a),
    pressed: a => bus.wasPressed(a),
    
    tap(a) { bus.setSynthetic(a, true); requestAnimationFrame(() => requestAnimationFrame(() => bus.setSynthetic(a, false))); },
    hold(a, down) { bus.setSynthetic(a, down); },
    axis() {
      let x = 0, y = 0;
      if (bus.isDown('left')) x -= 1; if (bus.isDown('right')) x += 1;
      if (bus.isDown('up')) y -= 1; if (bus.isDown('down')) y += 1;
      x += pad.lx + touch.x; y += pad.ly + touch.y;
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      return { x, y, mag: Math.min(1, l) };
    },
    
    stick() {
      if (Math.hypot(pad.rx, pad.ry) > 0.3) return { x: pad.rx, y: pad.ry };
      if (Math.hypot(pad.lx, pad.ly) > 0.3) return { x: pad.lx, y: pad.ly };
      return { x: touch.x, y: touch.y };
    },
    touchActive: () => touch.active,
    
    glyph(action) {
      const g = glyphs[action] || {};
      return mode === 'pad' ? g.pad : mode === 'touch' ? null : g.key;
    },
  };
  return api;
}
