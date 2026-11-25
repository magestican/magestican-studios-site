














export function showsTitle(params, { linkRoom = false, framed = false } = {}) {
  if (linkRoom || framed) return false;
  for (const k of ['go', 'mode', 'moves', 'watch', 'join']) if (params.has(k)) return false;
  return true;
}


export const TITLE_BUTTONS = Object.freeze(['start', 'see-options']);





export const MENU_BUTTONS = Object.freeze(['menu-resume', 'menu-new', 'menu-options', 'menu-title']);


export function navKey(key) {
  return { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key] || null;
}





export function stepFocus(at, step, n) {
  if (n <= 0) return -1;
  if (at < 0) return 0;
  return (((at + Math.sign(step)) % n) + n) % n;
}


export const STEP = Object.freeze({ up: -1, left: -1, down: 1, right: 1 });






export function gridStep(p, word, n) {
  if (!(n > 0) || !(p >= 0) || p >= n * n) return p;
  const r = Math.floor(p / n);
  const c = p % n;
  if (word === 'up') return r > 0 ? p - n : p;
  if (word === 'down') return r < n - 1 ? p + n : p;
  if (word === 'left') return c > 0 ? p - 1 : p;
  if (word === 'right') return c < n - 1 ? p + 1 : p;
  return p;
}


export function startPoint(n) {
  return n > 0 ? Math.floor((n * n) / 2) : 0;
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


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus', 'error']);

export const MENU_GAINS = Object.freeze({ tap: 0.55, back: 0.55, toggleOn: 0.6, toggleOff: 0.6, open: 0.5, focus: 0.3, error: 0.6 });


export function menuCue(id) {
  if (id === 'menu-resume' || id === 'leave-room' || id === 'menu-title') return 'back';
  if (id === 'see-options' || id === 'menu-options' || id === 'prizes-btn') return 'open';
  return 'tap';
}


export const TITLE_OUT_MS = 220;
export const TITLE_IN_MS = 260;
export const MENU_IN_MS = 180;

export const STONE_STEP_MS = 140;
export const CAPTURE_CYCLE_MS = 4400;
