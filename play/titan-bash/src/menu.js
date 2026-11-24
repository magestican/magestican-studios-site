






export const PRIMARY = Object.freeze({ title: 'start', end: 'again', night: 'night-again' });

export const primaryFor = (screen) => PRIMARY[screen] ?? null;






export function createPadNav() {
  const was = new Map();
  const on = (b) => !!b && (b.pressed || b.value > 0.5);
  return {
    read(p) {
      const b = p.buttons || []; const a = p.axes || [];
      const ax = a[0] || 0; const ay = a[1] || 0;
      const now = on(b[0]) ? 'confirm' : on(b[1]) ? 'back'
        : on(b[12]) || on(b[14]) || ay < -0.6 || ax < -0.6 ? 'prev'
          : on(b[13]) || on(b[15]) || ay > 0.6 || ax > 0.6 ? 'next' : null;
      const before = was.get(p.index) ?? null;
      was.set(p.index, now);
      return now !== before ? now : null;
    },
  };
}





export function createLeave() {
  let asking = false;
  return {
    get asking() { return asking; },
    get paused() { return asking; },
    press(kind) {
      if (!asking) {
        if (kind === 'escape' || kind === 'quit') { asking = true; return 'ask'; }
        return 'none';
      }
      if (kind === 'leave') { asking = false; return 'leave'; }
      if (kind === 'escape' || kind === 'stay') { asking = false; return 'resume'; }
      return 'none';
    },
    reset() { asking = false; },
  };
}
