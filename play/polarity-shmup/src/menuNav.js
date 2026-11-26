













export const SCREENS = Object.freeze(['title', 'pick', 'brief', 'paused', 'tally', 'ending', 'lobby']);






export const SCREEN_FIRST = Object.freeze({
  title: ['start'],
  pick: ['pick-go'],
  brief: ['b-launch'],
  paused: ['p-resume'],
  tally: ['t-go', 'again'],
  ending: ['e-next'],
  lobby: ['coop-start', 'lobby-leave'],
});





export const SCREEN_BACK = Object.freeze({ pick: 'pick-back', brief: 'b-back', lobby: 'lobby-leave' });


export function backAction(screen) {
  if (screen === 'paused') return { act: 'resume' };
  const id = SCREEN_BACK[screen];
  return id ? { act: 'press', arg: id } : { act: 'none' };
}


export function topScreen(open) {
  for (let i = SCREENS.length - 1; i >= 0; i--) if (open.includes(SCREENS[i])) return SCREENS[i];
  return null;
}


export function firstControl(screen, shown) {
  for (const id of SCREEN_FIRST[screen] || []) if (shown(id)) return id;
  return null;
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









export function padAction(screen, word) {
  if (!screen) return word === 'menu' ? { act: 'pause' } : { act: 'none' };
  if (DIRS.has(word)) return { act: 'step', arg: STEP[word] };
  if (word === 'confirm') return { act: 'press' };
  if (word === 'back') return { act: 'back' };
  if (word === 'menu' && screen === 'paused') return { act: 'back' };
  return { act: 'none' };
}






export const QUIT_ARM_MS = 4000;

export function quitPress(armedAt, now) {
  if (armedAt > 0 && now - armedAt <= QUIT_ARM_MS) return { quit: true, armedAt: 0 };
  return { quit: false, armedAt: now };
}
