
























const DEADZONE = 0.14;




const TAP_MS = 180;

export function createControls(root) {
  const state = {
    throttle: 0,
    steer: 0,
    drift: false,
    useItem: false,
    jump: false,
    lookBack: false,
    
    throttleHeld: 0,
    
    
    
    
    lastSource: null,
    _keys: new Set(),
    _touchSteer: 0,
    _touchThrottle: 0,
    _touchBrake: false,
    _touchDrift: false,
    _touchItem: false,
    _touchJump: false,
    _pads: false,
    dispose: () => {},
  };

  const onKey = (e, down) => {
    const k = e.key.toLowerCase();
    const known = [
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
      'w', 'a', 's', 'd', ' ', 'shift', 'control', 'e', 'q', 'z', 'x', 'enter',
    ].includes(k);
    if (!known) return;
    
    
    
    
    e.preventDefault();
    if (down) { state._keys.add(k); state.lastSource = 'key'; } else state._keys.delete(k);
  };
  const keyDown = (e) => onKey(e, true);
  const keyUp = (e) => onKey(e, false);
  
  const blur = () => state._keys.clear();

  window.addEventListener('keydown', keyDown, { passive: false });
  window.addEventListener('keyup', keyUp, { passive: false });
  window.addEventListener('blur', blur);

  const touch = attachTouch(root, state);

  state.dispose = () => {
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('blur', blur);
    touch.dispose();
  };
  return state;
}


export function readControls(state, dt) {
  const k = state._keys;
  let steer = 0;
  let throttle = 0;
  let drift = false;
  let useItem = false;
  let jump = false;
  let lookBack = false;

  if (k.has('arrowleft') || k.has('a')) steer -= 1;
  if (k.has('arrowright') || k.has('d')) steer += 1;
  if (k.has('arrowup') || k.has('w')) throttle += 1;
  if (k.has('arrowdown') || k.has('s')) throttle -= 1;
  if (k.has('shift') || k.has('z')) drift = true;
  
  
  
  
  
  
  
  if (k.has(' ')) jump = true;
  if (k.has('control') || k.has('e') || k.has('x') || k.has('enter')) useItem = true;
  if (k.has('q')) lookBack = true;

  
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads
    ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad) continue;
    const ax = pad.axes[0] ?? 0;
    if (Math.abs(ax) > DEADZONE) {
      
      
      steer += Math.sign(ax) * ((Math.abs(ax) - DEADZONE) / (1 - DEADZONE));
      state.lastSource = 'pad';
    }
    const rt = pad.buttons[7]?.value ?? 0;
    const lt = pad.buttons[6]?.value ?? 0;
    if (rt > 0.06) { throttle += rt; state.lastSource = 'pad'; }
    if (lt > 0.06) { throttle -= lt; state.lastSource = 'pad'; }
    if (pad.buttons[0]?.pressed) { jump = true; state.lastSource = 'pad'; }
    if (pad.buttons[1]?.pressed || pad.buttons[5]?.pressed || pad.buttons[4]?.pressed) drift = true;
    if (pad.buttons[2]?.pressed || pad.buttons[3]?.pressed) useItem = true;
  }

  
  steer += state._touchSteer;
  if (state._touchThrottle) throttle += state._touchThrottle;
  if (state._touchBrake) throttle -= 1;
  if (state._touchDrift) drift = true;
  if (state._touchItem) useItem = true;
  if (state._touchJump) jump = true;

  state.steer = Math.max(-1, Math.min(1, steer));
  state.throttle = Math.max(-1, Math.min(1, throttle));
  state.drift = drift;
  state.useItem = useItem;
  state.jump = jump;
  state.lookBack = lookBack;
  state.throttleHeld = state.throttle > 0.1 ? state.throttleHeld + dt : 0;
  return state;
}


export function consumeItemPress(state) {
  if (state.useItem && !state._itemLatch) { state._itemLatch = true; return true; }
  if (!state.useItem) state._itemLatch = false;
  return false;
}


















function attachTouch(root, state) {
  const pointers = new Map();

  const zoneOf = (x, y, w, h) => {
    
    const btnR = Math.max(64, Math.min(96, w * 0.09));
    if (x > w - btnR * 2.6 && y > h - btnR * 2.6) return 'drift';
    if (x > w - btnR * 5.4 && x < w - btnR * 2.8 && y > h - btnR * 2.2) return 'item';
    if (x < w * 0.42) return 'steer';
    return 'throttle';
  };

  const onDown = (e) => {
    if (e.pointerType === 'mouse') return;
    state.lastSource = 'touch';
    const w = window.innerWidth; const h = window.innerHeight;
    const zone = zoneOf(e.clientX, e.clientY, w, h);
    pointers.set(e.pointerId, { zone, startX: e.clientX, startY: e.clientY, downAt: Date.now() });
    apply();
    e.preventDefault();
  };
  const onMove = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    apply();
  };
  const onUp = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    apply();
  };

  function apply() {
    let steer = 0; let throttle = 0; let drift = false; let item = false; let brake = false;
    let jump = false;
    const w = window.innerWidth;
    for (const p of pointers.values()) {
      if (p.zone === 'steer') {
        
        
        const travel = Math.max(60, w * 0.16);
        const dx = (p.x ?? p.startX) - p.startX;
        steer += Math.max(-1, Math.min(1, dx / travel));
        
        
        
        const dy = (p.y ?? p.startY) - p.startY;
        if (dy > 70) brake = true;
      } else if (p.zone === 'throttle') {
        throttle = 1;
      } else if (p.zone === 'drift') {
        
        
        
        
        if (p.downAt !== undefined && Date.now() - p.downAt < TAP_MS) jump = true;
        else drift = true;
        
        
        
        throttle = 1;
      } else if (p.zone === 'item') {
        item = true;
      }
    }
    state._touchSteer = Math.max(-1, Math.min(1, steer));
    state._touchThrottle = throttle;
    state._touchDrift = drift;
    state._touchItem = item;
    state._touchJump = jump;
    state._touchBrake = brake;
  }

  const target = root ?? window;
  target.addEventListener('pointerdown', onDown, { passive: false });
  target.addEventListener('pointermove', onMove, { passive: false });
  target.addEventListener('pointerup', onUp);
  
  target.addEventListener('pointercancel', onUp);
  target.addEventListener('pointerleave', onUp);

  return {
    dispose: () => {
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      target.removeEventListener('pointerleave', onUp);
    },
  };
}


export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window) || (navigator.maxTouchPoints ?? 0) > 0;
}
