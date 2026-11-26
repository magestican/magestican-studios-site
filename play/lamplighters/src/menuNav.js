











export const SCREENS = Object.freeze(['setup', 'match', 'end']);





export const SCREEN_FIRST = Object.freeze({ setup: 'start-bot', match: 'board', end: 'primary' });


export const MATCH_EXIT = 'quit';


export function navKey(key) {
  return { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key] || null;
}


export const STEP = Object.freeze({ up: -1, left: -1, down: 1, right: 1 });


export const BOARD_KEY = Object.freeze({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' });





export function stepFocus(at, step, n) {
  if (n <= 0) return -1;
  if (at < 0) return 0;
  return (((at + Math.sign(step)) % n) + n) % n;
}





export function shouldFocusOnOpen(lastInput) {
  return lastInput !== 'touch';
}






export function matchKey(key, onBoard) {
  if (key === 'Escape') return onBoard ? { act: 'focus', arg: MATCH_EXIT } : { act: 'board' };
  const word = navKey(key);
  if (word && !onBoard) return { act: 'step', arg: STEP[word] };
  return { act: 'none' };
}






export function padHeld(p) {
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
  if (on(2)) held.add('mark');
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











export function padAction(screen, word, onBoard) {
  if (screen === 'match') {
    if (onBoard) {
      if (DIRS.has(word)) return { act: 'key', arg: BOARD_KEY[word] };
      if (word === 'confirm') return { act: 'key', arg: 'Enter' };
      if (word === 'mark') return { act: 'key', arg: 'x' };
      if (word === 'back' || word === 'menu') return { act: 'focus', arg: MATCH_EXIT };
      return { act: 'none' };
    }
    if (DIRS.has(word)) return { act: 'step', arg: STEP[word] };
    if (word === 'confirm') return { act: 'press' };
    if (word === 'back' || word === 'menu') return { act: 'board' };
    return { act: 'none' };
  }
  if (screen === 'setup' || screen === 'end') {
    if (DIRS.has(word)) return { act: 'step', arg: STEP[word] };
    if (word === 'confirm') return { act: 'press' };
    if (screen === 'end' && word === 'back') return { act: 'last' };
  }
  return { act: 'none' };
}


export const RISE_MS = 260;
export const STAGGER_MS = 60;
export const SCREEN_IN_MS = 200;
export const CARD_IN_MS = 240;
