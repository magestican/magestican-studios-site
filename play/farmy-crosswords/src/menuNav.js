









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






export function stepCursor(at, n, move) {
  if (n <= 0) return -1;
  if (at < 0 || at >= n) return 0;
  const d = (move?.dy || move?.dx || 0) > 0 ? 1 : (move?.dy || move?.dx || 0) < 0 ? -1 : 0;
  return (at + d + n) % n;
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






export function backTarget(onHome) { return onHome ? 'menu' : 'home'; }


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus']);

export const MENU_GAINS = Object.freeze({ tap: 0.55, back: 0.55, toggleOn: 0.6, toggleOff: 0.6, open: 0.5, focus: 0.3 });


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


export const TITLE_OUT_MS = 220;





export function pageGutter(width) { return width < 520 ? 16 : 20; }
