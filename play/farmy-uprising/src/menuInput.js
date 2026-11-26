









import {
  SCREENS, backAction, firstControl, keyAction, nextChoice, padAction, padHeld, padPresses, shouldFocusOnOpen,
  stepFocus, topScreen,
} from './menuNav.js';


const ROOT = Object.freeze({ title: 'title', menu: 'menu', lobby: 'lobby', paused: 'pausecard', end: 'endcard' });







export function installMenuInput({ pause = () => {}, resume = () => {}, toTitle = () => {} } = {}) {
  const doc = document;
  let lastInput = 'key';
  const el = (id) => doc.getElementById(id);
  const visible = (b) => !!b && !b.hidden && !b.disabled && b.offsetParent !== null;
  const shown = (id) => visible(el(id));
  const isOpen = (screen) => (screen === 'title'
    ? doc.body.classList.contains('at-title')
    : !!el(ROOT[screen]) && el(ROOT[screen]).classList.contains('show'));
  const top = () => topScreen(SCREENS.filter(isOpen));
  
  const controls = (screen) => (screen
    ? [...el(ROOT[screen]).querySelectorAll('button, select, input')].filter(visible)
    : []);

  function focusFirst(screen) {
    if (!screen || !shouldFocusOnOpen(lastInput)) return;
    const id = firstControl(screen, shown);
    (id ? el(id) : controls(screen)[0])?.focus({ preventScroll: true });
  }

  function step(screen, by) {
    const list = controls(screen);
    const next = list[stepFocus(list.indexOf(doc.activeElement), by, list.length)];
    next?.focus({ preventScroll: true });
  }

  function back(screen) {
    const a = backAction(screen).act;
    if (a === 'title') toTitle();
    else if (a === 'back') el('lob-back')?.click();
    else if (a === 'resume') resume();
  }

  
  function press(f) {
    if (f.tagName === 'SELECT') {
      const i = nextChoice(f.selectedIndex, f.options.length);
      if (i >= 0) { f.selectedIndex = i; f.dispatchEvent(new Event('change', { bubbles: true })); }
    } else if (f.tagName !== 'INPUT') f.click();
  }

  
  let was = top();
  function watch() {
    const now = top();
    if (now !== was) { was = now; if (now) requestAnimationFrame(() => { if (top() === now) focusFirst(now); }); }
  }
  const observer = new MutationObserver(watch);
  observer.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  for (const id of Object.values(ROOT)) if (el(id)) observer.observe(el(id), { attributes: true, attributeFilter: ['class'] });

  addEventListener('pointerdown', (e) => { lastInput = e.pointerType === 'touch' ? 'touch' : 'mouse'; }, true);
  
  
  addEventListener('keydown', (e) => {
    lastInput = 'key';
    const tag = e.target?.tagName;
    const field = tag === 'SELECT' ? 'select' : tag === 'INPUT' ? 'input' : null;
    const screen = top();
    const a = keyAction(screen, e.key, field);
    if (a.act === 'step') { e.preventDefault(); e.stopPropagation(); step(screen, a.arg); }
    else if (a.act !== 'none') { e.preventDefault(); e.stopPropagation(); back(screen); }
  }, true);

  let padState = null;
  function poll(now) {
    const pad = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
    const r = padPresses(padState, padHeld(pad), now);
    padState = r.state;
    if (r.presses.length) lastInput = 'pad';
    for (const w of r.presses) {
      const screen = top();
      const a = padAction(screen, w);
      if (a.act === 'pause') pause();
      else if (a.act === 'title' || a.act === 'back' || a.act === 'resume') back(screen);
      else if (a.act === 'step') {
        if (controls(screen).includes(doc.activeElement)) step(screen, a.arg); else focusFirst(screen);
      } else if (a.act === 'press') {
        const f = doc.activeElement;
        if (f && controls(screen).includes(f)) press(f);
        else { const id = firstControl(screen, shown); if (id) press(el(id)); }
      }
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);

  
  if (globalThis.matchMedia?.('(pointer: coarse)').matches) lastInput = 'touch';
  const first = top();
  if (first) requestAnimationFrame(() => focusFirst(first));
  return { top, focusFirst };
}
