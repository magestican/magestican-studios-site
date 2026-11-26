










import {
  SCREENS, backAction, firstControl, navKey, padAction, padHeld, padPresses, shouldFocusOnOpen, stepFocus, topScreen, STEP,
} from './menuNav.js';








export function installMenuInput({ cue = () => {}, playing = () => false, pause = () => {}, resume = () => {} } = {}) {
  const doc = document;
  let lastInput = 'key';
  const el = (id) => doc.getElementById(id);
  const shown = (id) => { const b = el(id); return !!b && !b.hidden && b.offsetParent !== null && !b.disabled; };
  const openScreens = () => SCREENS.filter((id) => el(id) && !el(id).hidden);
  const top = () => topScreen(openScreens());
  
  const controls = (screen) => [...el(screen).querySelectorAll('button, select')]
    .filter((b) => !b.disabled && !b.hidden && b.offsetParent !== null);

  function focusFirst(screen) {
    if (!shouldFocusOnOpen(lastInput)) return;
    const id = firstControl(screen, shown);
    const target = id ? el(id) : controls(screen)[0];
    target?.focus({ preventScroll: true });
  }

  function step(screen, by) {
    const list = controls(screen);
    const at = list.indexOf(doc.activeElement);
    const next = list[stepFocus(at, by, list.length)];
    if (!next || next === doc.activeElement) return;
    next.focus({ preventScroll: true });
    if (!next.classList.contains('plate')) cue('tap'); 
  }

  function back(screen) {
    const b = backAction(screen);
    if (b.act === 'resume') resume();
    else if (b.act === 'press' && shown(b.arg)) el(b.arg).click();
  }

  
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      const id = r.target.id;
      if (r.oldValue !== null && !r.target.hidden) requestAnimationFrame(() => { if (top() === id) focusFirst(id); });
    }
  });
  for (const id of SCREENS) {
    if (el(id)) observer.observe(el(id), { attributes: true, attributeFilter: ['hidden'], attributeOldValue: true });
  }

  addEventListener('pointerdown', (e) => { lastInput = e.pointerType === 'touch' ? 'touch' : 'mouse'; }, true);
  
  addEventListener('keydown', (e) => {
    lastInput = 'key';
    const screen = top();
    if (!screen) return;
    const tag = e.target?.tagName;
    const word = navKey(e.key);
    if (word && tag !== 'SELECT' && tag !== 'INPUT') {
      e.preventDefault(); e.stopPropagation();
      step(screen, STEP[word]);
    } else if (e.key === 'Escape' && screen !== 'paused') {
      
      e.stopPropagation();
      back(screen);
    } else if (e.key === ' ' && (tag === 'BUTTON' || tag === 'SELECT')) {
      e.stopPropagation(); 
    }
  }, true);

  
  
  let padState = null;
  function poll(now) {
    const pad = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
    const held = padHeld(pad);
    const r = padPresses(padState, held, now);
    padState = r.state;
    if (r.presses.length) lastInput = 'pad';
    for (const w of r.presses) {
      const screen = top();
      if (!screen && !playing()) continue;
      const a = padAction(screen, w);
      if (a.act === 'pause') pause();
      else if (a.act === 'step') {
        
        if (controls(screen).includes(doc.activeElement)) step(screen, a.arg); else focusFirst(screen);
      } else if (a.act === 'press') {
        const f = doc.activeElement;
        if (f && controls(screen).includes(f)) f.click(); else el(firstControl(screen, shown) || '')?.click();
      } else if (a.act === 'back') back(screen);
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);

  
  if (matchMedia?.('(pointer: coarse)').matches) lastInput = 'touch';
  const first = top();
  if (first) requestAnimationFrame(() => focusFirst(first));
  return { top, focusFirst };
}
