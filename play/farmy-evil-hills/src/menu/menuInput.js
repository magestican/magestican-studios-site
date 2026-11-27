













import {
  SCREENS, backAction, firstControl, keyAction, padAction, padHeld, padPresses, shouldFocusOnOpen, stepFocus,
  topScreen,
} from './menuNav.js';


const ROOT = Object.freeze({ over: 'over', boot: 'boot', paused: 'pause' });
const BODY = Object.freeze({ over: 'over', boot: 'bootCard', paused: 'pauseCard' });








export function installMenuInput({
  pause = () => {}, resume = () => {}, skipFilm = () => {}, filmActive = () => false,
} = {}) {
  const doc = document;
  let lastInput = 'key';
  const el = (id) => doc.getElementById(id);
  const visible = (b) => !!b && !b.hidden && !b.disabled && b.offsetParent !== null;
  const shown = (id) => visible(el(id));
  const isOpen = (screen) => { const r = el(ROOT[screen]); return !!r && getComputedStyle(r).display !== 'none'; };
  const top = () => topScreen(SCREENS.filter(isOpen));
  
  const controls = (screen) => (screen && el(BODY[screen])
    ? [...el(BODY[screen]).querySelectorAll('button, summary, input')].filter(visible)
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
    if (a === 'resume') resume();
    else if (a === 'options') {
      const more = el('bootMore');
      if (more && more.open) { more.open = false; more.querySelector('summary')?.focus({ preventScroll: true }); }
    }
  }

  
  function press(f) {
    if (f.tagName === 'INPUT' && f.type !== 'checkbox') return;
    f.click();
  }

  
  let was = top();
  function watch() {
    const now = top();
    if (now !== was) { was = now; if (now) requestAnimationFrame(() => { if (top() === now) focusFirst(now); }); }
  }
  const observer = new MutationObserver(watch);
  for (const id of Object.values(ROOT)) if (el(id)) observer.observe(el(id), { attributes: true, attributeFilter: ['style'] });

  addEventListener('pointerdown', (e) => { lastInput = e.pointerType === 'touch' ? 'touch' : 'mouse'; }, true);
  
  
  addEventListener('keydown', (e) => {
    lastInput = 'key';
    const t = e.target;
    const field = t?.tagName === 'INPUT' ? (t.type === 'range' ? 'range' : t.type === 'checkbox' ? null : 'text') : null;
    const screen = top();
    const a = keyAction(screen, e.key, field);
    if (a.act === 'pass') return;
    e.preventDefault(); e.stopPropagation();
    if (a.act === 'step') step(screen, a.arg);
    else back(screen);
  }, true);

  let padState = null;
  function poll(now) {
    const pad = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
    const r = padPresses(padState, padHeld(pad), now);
    padState = r.state;
    if (r.presses.length) lastInput = 'pad';
    for (const w of r.presses) {
      const card = top();
      const screen = card || (filmActive() ? 'film' : null);
      const a = padAction(screen, w);
      if (a.act === 'pause') pause();
      else if (a.act === 'skip') skipFilm();
      else if (a.act === 'resume' || a.act === 'options') back(screen);
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
