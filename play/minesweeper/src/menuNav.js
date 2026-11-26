















export function showsTitle(params, { linkRoom = false, framed = false } = {}) {
  if (linkRoom || framed) return false;
  for (const k of ['play', 'seed', 'watch', 'join']) if (params.has(k)) return false;
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





export function resumedStart(startedAt, pausedAt, now, playing = true) {
  if (!playing || startedAt === null || startedAt === undefined || !Number.isFinite(pausedAt)) return startedAt;
  return startedAt + Math.max(0, now - pausedAt);
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
  if (on(2) || on(3)) held.add('flag');
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
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  confirm: 'Enter', flag: 'f', back: 'Escape', start: 'Escape',
});


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus', 'error']);


export const MENU_GAINS = Object.freeze({ tap: 0.36, back: 0.36, toggleOn: 0.38, toggleOff: 0.38, open: 0.34, focus: 0.18, error: 0.4 });


export function menuCue(id) {
  if (id === 'menu-resume' || id === 'leave-room' || id === 'menu-title') return 'back';
  if (id === 'see-options' || id === 'menu-options' || id === 'see-prizes') return 'open';
  return 'tap';
}


export const TITLE_OUT_MS = 220;
export const TITLE_IN_MS = 260;
export const MENU_IN_MS = 180;






export const PATCH = Object.freeze([
  '', '', '', '', '',
  1, 1, 1, 2, '',
  0, 0, 0, 1, 'F',
  0, 0, 0, 1, 1,
  0, 0, 0, 0, 0,
]);


export const MINES = Object.freeze([0, 3, 14]);

export function cascadeOrder(patch = PATCH, from = 12, cols = 5) {
  const r0 = Math.floor(from / cols);
  const c0 = from % cols;
  return patch.map((v, i) => [i, Math.max(Math.abs(Math.floor(i / cols) - r0), Math.abs((i % cols) - c0))])
    .filter(([i]) => patch[i] !== '' && patch[i] !== 'F')
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
export const CASCADE_STEP_MS = 60;
export const FLAG_AFTER_MS = 600;
export const SCENE_CYCLE_MS = 5000;
