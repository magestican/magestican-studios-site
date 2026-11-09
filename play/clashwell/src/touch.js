






export const TAP_SLOP_PX = 12;

export const TAP_MS = 350;





export function createDrag({ press, cellPx }) {
  let finger = null;

  return {
    down(id, x, y, at) {
      if (finger) return; 
      finger = { id, anchor: x, x0: x, y0: y, at, travelled: 0 };
    },
    move(id, x, y) {
      if (!finger || finger.id !== id) return;
      finger.travelled = Math.max(finger.travelled, Math.hypot(x - finger.x0, y - finger.y0));
      const cell = Math.max(8, cellPx());
      while (x - finger.anchor >= cell) { press('right'); finger.anchor += cell; }
      while (finger.anchor - x >= cell) { press('left'); finger.anchor -= cell; }
    },
    up(id, at) {
      if (!finger || finger.id !== id) return;
      const tap = finger.travelled < TAP_SLOP_PX && at - finger.at <= TAP_MS;
      finger = null;
      if (tap) press('cw');
    },
    cancel() { finger = null; },
  };
}
