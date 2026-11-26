











export const SCREEN_FIRST = Object.freeze({
  menu: 'start-btn',
  pause: 'pause-resume',
  results: 'results-again',
});


export const MENU_SCREENS = Object.freeze(['menu', 'lobby', 'results', 'pause']);


export function topScreen(open) {
  let top = null;
  for (const id of MENU_SCREENS) if (open.has(id)) top = id;
  return top;
}


export function navKey(key) {
  return { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key] || null;
}


export const STEP = Object.freeze({ up: -1, left: -1, down: 1, right: 1 });





export function stepFocus(at, step, n) {
  if (n <= 0) return -1;
  if (at < 0) return 0;
  return (((at + Math.sign(step)) % n) + n) % n;
}





export function shouldFocusOnOpen(lastInput) {
  return lastInput !== 'touch';
}







export function padMenuHeld(p) {
  const held = new Set();
  if (!p) return held;
  const on = (i) => !!p.buttons?.[i]?.pressed;
  const [x = 0, y = 0] = p.axes || [];
  if (on(12) || y < -0.5) held.add('up');
  if (on(13) || y > 0.5) held.add('down');
  if (on(14) || x < -0.5) held.add('left');
  if (on(15) || x > 0.5) held.add('right');
  if (on(0)) held.add('confirm');
  if (on(1)) held.add('back');
  if (on(9)) held.add('menu');
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












export function padAction(screen, word, racing) {
  if (!screen) {
    if (racing && word === 'menu') return { act: 'pause' };
    return { act: 'none' };
  }
  if (DIRS.has(word)) return { act: 'step', arg: STEP[word] };
  if (word === 'confirm') return { act: 'press' };
  if (screen === 'pause' && (word === 'menu' || word === 'back')) return { act: 'resume' };
  if (screen === 'results' && word === 'back') return { act: 'click', arg: 'results-menu' };
  if (screen === 'lobby' && word === 'back') return { act: 'click', arg: 'lobby-leave' };
  return { act: 'none' };
}


export const SCREEN_IN_MS = 220;
export const STAGGER_MS = 45;
export const CARD_IN_MS = 180;
