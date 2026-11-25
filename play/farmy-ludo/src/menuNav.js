









export const TITLE_BUTTONS = Object.freeze(['start', 'see-options']);


export function titleMove(at, dir) {
  if (at < 0) return 0;
  if (dir === 'up') return Math.max(0, at - 1);
  if (dir === 'down') return Math.min(TITLE_BUTTONS.length - 1, at + 1);
  return at;
}


export function titleKey(key) {
  return { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'up', ArrowRight: 'down' }[key] || null;
}






export function stepFocus(at, step, n) {
  if (n <= 0) return -1;
  if (at < 0) return step < 0 ? n - 1 : 0;
  return (((at + Math.sign(step)) % n) + n) % n;
}

const DEAD = 0.5;

export function padHeld(p) {
  const held = new Set();
  if (!p) return held;
  const on = (i) => !!p.buttons?.[i]?.pressed;
  const [x = 0, y = 0] = p.axes || [];
  if (on(12) || y < -DEAD) held.add('up');
  if (on(13) || y > DEAD) held.add('down');
  if (on(14) || x < -DEAD) held.add('left');
  if (on(15) || x > DEAD) held.add('right');
  if (on(0)) held.add('confirm');
  if (on(1)) held.add('back');
  if (on(9)) held.add('start');
  return held;
}

export const REPEAT_DELAY_MS = 400;
export const REPEAT_MS = 150;
const DIRS = new Set(['up', 'down', 'left', 'right']);

export function padPresses(state, held, now) {
  const prev = state?.since || {};
  const since = {};
  const presses = [];
  for (const w of held) {
    if (!(w in prev)) { presses.push(w); since[w] = { next: now + REPEAT_DELAY_MS }; continue; }
    const s = { ...prev[w] };
    if (DIRS.has(w) && now >= s.next) { presses.push(w); s.next = now + REPEAT_MS; }
    since[w] = s;
  }
  return { presses, state: { since } };
}






export const PAD_KEY = Object.freeze({
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', back: 'Escape', start: 'Escape',
});


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus']);

export const MENU_GAINS = Object.freeze({ tap: 0.55, back: 0.55, toggleOn: 0.6, toggleOff: 0.6, open: 0.5, focus: 0.3 });


export function menuCue(id) {
  const bare = String(id ?? '').replace(/^panel:/, '');
  if (bare === 'sound' || bare === 'shake') return null;
  if (bare === 'close' || bare === 'cancel' || bare === 'leave' || bare === 'look') return 'back';
  return 'tap';
}


export const CUE_GAP_MS = 60;

export const PANEL_IN_MS = 180;
export const PANEL_OUT_MS = 140;




export function panelLook(now, at, leaving, motion = true) {
  if (!motion) return leaving ? { alpha: 0, scale: 1, done: true } : { alpha: 1, scale: 1, done: true };
  const ms = leaving ? PANEL_OUT_MS : PANEL_IN_MS;
  const t = Math.max(0, Math.min(1, (now - at) / ms));
  const e = 1 - (1 - t) ** 3;
  return leaving
    ? { alpha: 1 - e, scale: 1 - 0.03 * e, done: t >= 1 }
    : { alpha: e, scale: 0.96 + 0.04 * e, done: t >= 1 };
}






export const HOP_MS = 2400;
export function pieceHop(now, i, n, motion = true, amp = 10) {
  if (!motion || n <= 0) return 0;
  const slot = 1 / n;
  const t = (((now / HOP_MS) - i * slot) % 1 + 1) % 1;
  if (t >= slot * 0.8) return 0;
  return -amp * Math.sin((t / (slot * 0.8)) * Math.PI);
}


export const TITLE_TEAMS = Object.freeze([0, 1, 2, 3]);
