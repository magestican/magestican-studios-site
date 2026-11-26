











export const TITLE_BUTTONS = Object.freeze(['t-open', 't-layers', 't-room']);


export const MENU_BUTTONS = Object.freeze(['m-resume', 'm-layers', 'm-title']);


export function navKey(key) {
  return { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key] || null;
}





export function stepFocus(at, step, n) {
  if (n <= 0) return -1;
  if (at < 0) return 0;
  return (((at + Math.sign(step)) % n) + n) % n;
}


export const STEP = Object.freeze({ up: -1, left: -1, down: 1, right: 1 });






export function backAction(screen, menuOpen = false) {
  if (screen === 'bench') return menuOpen ? 'resume' : 'menu';
  if (screen === 'cabinet') return 'title';
  if (screen === 'lobby') return 'leave';
  return null;
}






export const AIM_KEYS = Object.freeze({ i: 'up', k: 'down', j: 'left', l: 'right' });

export const AIM_STEP_PX = 14;


export function aimStart(box) {
  return { x: Math.round(box.x + box.w / 2), y: Math.round(box.y + box.h / 2) };
}


export function aimMove(aim, word, box, step = AIM_STEP_PX) {
  const a = aim || aimStart(box);
  const dx = word === 'left' ? -step : word === 'right' ? step : 0;
  const dy = word === 'up' ? -step : word === 'down' ? step : 0;
  return {
    x: Math.min(Math.max(a.x + dx, box.x), box.x + box.w),
    y: Math.min(Math.max(a.y + dy, box.y), box.y + box.h),
  };
}

const DEAD = 0.5;




export function padHeld(p, { stickDirs = true } = {}) {
  const held = new Set();
  if (!p) return held;
  const on = (i) => !!p.buttons?.[i]?.pressed;
  const [x = 0, y = 0] = stickDirs ? (p.axes || []) : [];
  if (on(12) || y < -DEAD) held.add('up');
  if (on(13) || y > DEAD) held.add('down');
  if (on(14) || x < -DEAD) held.add('left');
  if (on(15) || x > DEAD) held.add('right');
  if (on(0)) held.add('confirm');
  if (on(1)) held.add('back');
  if (on(2)) held.add('tool');
  if (on(3)) held.add('level');
  if (on(9)) held.add('start');
  return held;
}


export const TURN_DEAD = 0.18;




export function padTurn(p) {
  const [x = 0, y = 0] = p?.axes || [];
  const f = (v) => (Math.abs(v) <= TURN_DEAD ? 0 : Math.sign(v) * Math.min(1, (Math.abs(v) - TURN_DEAD) / (1 - TURN_DEAD)));
  return [f(x), f(y)];
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






export const PAD_KEY_MENU = Object.freeze({
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', confirm: 'Enter', back: 'Escape', start: 'Escape',
});
export const PAD_KEY_BENCH = Object.freeze({
  up: 'i', down: 'k', left: 'j', right: 'l', confirm: ' ', tool: 'x', level: 'r', back: 'Escape', start: 'Escape',
});


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus', 'error']);


export const MENU_GAINS = Object.freeze({ tap: 0.4, back: 0.4, toggleOn: 0.42, toggleOff: 0.42, open: 0.36, focus: 0.2, error: 0.42 });


export function menuCue(id) {
  if (id === 'm-resume' || id === 'm-title' || id === 'c-to-title' || id === 'h-back' || id === 'l-leave') return 'back';
  if (id === 't-layers' || id === 'm-layers' || id === 'r-cabinet') return 'open';
  return 'tap';
}


export const SCREEN_IN_MS = 220;
export const STAGGER_MS = 45;
export const MENU_IN_MS = 180;
