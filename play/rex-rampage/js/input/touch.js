


export const FINGER_OFFSET = 0.08; 


export function toNdc(cx, cy, rect) {
  const x = (2 * (cx - rect.left)) / rect.width - 1;
  const y = 1 - (2 * (cy - rect.top)) / rect.height + FINGER_OFFSET;
  return { x: Math.min(1, Math.max(-1, x)), y: Math.min(1, Math.max(-1, y)) };
}


export function createTouch(el) {
  
  const active = new Map();
  let touched = false;
  const at = (e) => toNdc(e.clientX, e.clientY, el.getBoundingClientRect());
  const down = (e) => {
    touched = true;
    if (active.size < 2) active.set(e.pointerId, at(e));
  };
  const move = (e) => {
    if (!active.has(e.pointerId)) return;
    touched = true;
    active.set(e.pointerId, at(e));
  };
  const up = (e) => active.delete(e.pointerId);
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return {
    
    pointers: () => [...active.values()],
    
    takeTouched() {
      const t = touched;
      touched = false;
      return t;
    },
    dispose() {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    },
  };
}
