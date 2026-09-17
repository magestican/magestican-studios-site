













import { STICK, KEYS, stickFromPointer, dragOrigin, keyboardIntent, worldIntent } from 'moon/play/stick.mjs';


const GAME_KEYS = new Set(Object.values(KEYS).flat().filter((code) => !KEYS.cancel.includes(code)));
export const TAP = Object.freeze({ maxMs: 350, maxPx: 12 });

export function createInput({
  surface, ring, knob, ghost, pickButton, jumpButton = null,
  onPress = () => {}, onRelease = () => {}, onFell = () => {}, onSeed = () => {}, onTap = () => {}, onToggleCarry = () => {},
  onCraft = () => {}, onTurn = () => {}, onCancel = () => {}, onJump = () => {},
  onJumpDown = () => {}, onJumpUp = () => {},
  cfg = STICK,
}) {
  const pressed = new Set();
  const offs = [];
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); offs.push(() => target.removeEventListener(type, fn, opts)); };
  let stick = null; 
  const taps = new Map(); 
  let buttonDown = false, keyDown = false;

  if (ghost && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ghost.hidden = false;

  function draw() {
    if (!stick) { ring.hidden = true; return; }
    const r = stickFromPointer(stick.origin, stick.pointer, { wasRunning: stick.running }, cfg);
    ring.hidden = false;
    ring.style.transform = `translate(${stick.origin.x}px, ${stick.origin.y}px)`;
    knob.style.transform = `translate(${r.knobX}px, ${r.knobY}px)`;
    ring.classList.toggle('run', r.run);
  }

  const press = () => onPress();
  const release = () => { if (!buttonDown && !keyDown) onRelease(); };

  on(surface, 'pointerdown', (e) => {
    
    
    taps.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    
    if (stick || e.clientX > window.innerWidth / 2) return;
    e.preventDefault();
    stick = { id: e.pointerId, origin: { x: e.clientX, y: e.clientY }, pointer: { x: e.clientX, y: e.clientY }, running: false };
    try { surface.setPointerCapture(e.pointerId); } catch {  }
    if (ghost) ghost.hidden = true;
    draw();
  });
  on(window, 'pointermove', (e) => {
    const tap = taps.get(e.pointerId);
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP.maxPx) taps.delete(e.pointerId);
    if (!stick || e.pointerId !== stick.id) return;
    e.preventDefault();
    stick.pointer = { x: e.clientX, y: e.clientY };
    stick.origin = dragOrigin(stick.origin, stick.pointer, cfg);
    draw();
  }, { passive: false });
  const up = (e) => {
    const tap = taps.get(e.pointerId);
    taps.delete(e.pointerId);
    if (e.type === 'pointerup' && tap && e.timeStamp - tap.t <= TAP.maxMs && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) <= TAP.maxPx) {
      onTap(e.clientX, e.clientY);
    }
    if (!stick || e.pointerId !== stick.id) return;
    stick = null;
    draw();
  };
  on(window, 'pointerup', up);
  on(window, 'pointercancel', up);

  on(pickButton, 'pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pickButton.classList.add('down');
    if (buttonDown) return;
    buttonDown = true;
    press();
  });
  const unpress = () => {
    pickButton.classList.remove('down');
    if (!buttonDown) return;
    buttonDown = false;
    release();
  };
  on(pickButton, 'pointerup', unpress);
  on(pickButton, 'pointercancel', unpress);
  on(pickButton, 'pointerleave', unpress);

  
  
  
  
  
  if (jumpButton) {
    on(jumpButton, 'pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      jumpButton.classList.add('down');
      
      
      
      
      onJumpDown(e.timeStamp);
      onJump(e.timeStamp);
    });
    const jumpUp = () => { jumpButton.classList.remove('down'); onJumpUp(); };
    on(jumpButton, 'pointerup', jumpUp);
    on(jumpButton, 'pointercancel', jumpUp);
    on(jumpButton, 'pointerleave', jumpUp);
  }

  on(window, 'keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (KEYS.pickUp.includes(e.code)) { if (!keyDown) { keyDown = true; press(); } return; }
    if (KEYS.fell.includes(e.code)) { onFell(); return; }
    if (KEYS.seed.includes(e.code)) { onSeed(); return; }
    if (KEYS.carry.includes(e.code)) { onToggleCarry(); return; }
    
    if (KEYS.craft.includes(e.code)) { onCraft(); return; }
    if (KEYS.turn.includes(e.code)) { onTurn(); return; }
    if (KEYS.cancel.includes(e.code)) { onCancel(); return; }
    if (KEYS.jump.includes(e.code)) { onJumpDown(e.timeStamp); onJump(e.timeStamp); return; }
    pressed.add(e.code);
  });
  on(window, 'keyup', (e) => {
    pressed.delete(e.code);
    if (KEYS.pickUp.includes(e.code) && keyDown) { keyDown = false; release(); }
    
    
    if (KEYS.jump.includes(e.code)) onJumpUp();
  });
  on(window, 'blur', () => {
    pressed.clear();
    stick = null;
    taps.clear();
    draw();
    if (buttonDown || keyDown) { buttonDown = keyDown = false; onRelease(); }
    
    onJumpUp();
  });

  
  const stop = (e) => e.preventDefault();
  on(document, 'touchmove', stop, { passive: false });
  on(document, 'gesturestart', stop);
  on(document, 'dblclick', stop);
  on(surface, 'contextmenu', stop);

  return {
    
    read(cameraYaw) {
      if (stick) {
        const r = stickFromPointer(stick.origin, stick.pointer, { wasRunning: stick.running }, cfg);
        stick.running = r.run;
        return worldIntent(r, cameraYaw);
      }
      return worldIntent(keyboardIntent(pressed), cameraYaw);
    },
    
    get stick() { return stick ? { origin: { ...stick.origin }, pointer: { ...stick.pointer }, running: stick.running } : null; },
    
    get holding() { return buttonDown || keyDown; },
    dispose() { for (const off of offs.splice(0)) off(); },
  };
}
