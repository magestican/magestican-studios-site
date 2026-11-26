








import {
  SCREENS, backAction, firstControl, keyAction, padAction, padHeld, padPresses, shouldFocusOnOpen, stepFocus, topScreen,
} from './menuNav.js';






export function installMenuInput({ pause = () => {}, resume = () => {} } = {}) {
  const doc = document;
  let lastInput = 'key';
  const el = (id) => doc.getElementById(id);
  const visible = (b) => !!b && !b.hidden && !b.disabled && b.offsetParent !== null;
  const shown = (id) => visible(el(id));
  const isOpen = (screen) => (screen === 'title' ? doc.body.classList.contains('at-title') : !!el(screen) && !el(screen).hidden);
  const top = () => topScreen(SCREENS.filter(isOpen));
  
  const controls = (screen) => {
    const list = screen === 'title'
      ? [el('start'), doc.querySelector('#more > summary')]
      : [...el('paused').querySelectorAll('button')];
    return list.filter(visible);
  };

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
    if (backAction(screen).act === 'resume') resume();
  }

  
  let was = top();
  function watch() {
    const now = top();
    if (now !== was) { was = now; if (now) requestAnimationFrame(() => { if (top() === now) focusFirst(now); }); }
  }
  const observer = new MutationObserver(watch);
  observer.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  if (el('paused')) observer.observe(el('paused'), { attributes: true, attributeFilter: ['hidden'] });

  addEventListener('pointerdown', (e) => { lastInput = e.pointerType === 'touch' ? 'touch' : 'mouse'; }, true);
  
  
  addEventListener('keydown', (e) => {
    lastInput = 'key';
    const tag = e.target?.tagName;
    if (tag === 'SELECT' || tag === 'INPUT') return;
    const screen = top();
    const a = keyAction(screen, e.key);
    if (a.act === 'pause') { e.preventDefault(); e.stopPropagation(); pause(); }
    else if (a.act === 'resume') { e.preventDefault(); e.stopPropagation(); resume(); }
    else if (a.act === 'step') { e.preventDefault(); e.stopPropagation(); step(screen, a.arg); }
    else if (screen && (e.key === ' ' || e.key === 'Enter') && (tag === 'BUTTON' || tag === 'SUMMARY')) {
      
      e.stopPropagation();
    }
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
      else if (a.act === 'resume') back(screen);
      else if (a.act === 'step') {
        if (controls(screen).includes(doc.activeElement)) step(screen, a.arg); else focusFirst(screen);
      } else if (a.act === 'press') {
        const f = doc.activeElement;
        if (f && controls(screen).includes(f)) f.click(); else el(firstControl(screen, shown) || '')?.click();
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
