








import {
  SCREEN_FIRST, MENU_SCREENS, topScreen, navKey, STEP, stepFocus, shouldFocusOnOpen,
  padMenuHeld, padPresses, padAction,
} from './menuNav.js';

const FOCUSABLE = 'button, summary, a[href], select, input:not([type=hidden])';

function visible(el) {
  if (!el || el.disabled || el.hidden) return false;
  if (el.closest('[hidden]')) return false;
  if (!el.getClientRects().length) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}




export function installMenuInput({ pauseRace, resumeRace, isRacing }) {
  const $ = (id) => document.getElementById(id);
  
  let lastInput = null;
  try {
    const coarseOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
    if (coarseOnly) lastInput = 'touch';
  } catch {  }

  const openScreens = () => new Set(MENU_SCREENS.filter((id) => $(id)?.classList.contains('show')));
  const top = () => topScreen(openScreens());
  const controls = (screenId) => {
    const root = $(screenId);
    return root ? [...root.querySelectorAll(FOCUSABLE)].filter(visible) : [];
  };

  function focusFirst(screenId) {
    const want = $(SCREEN_FIRST[screenId]);
    const el = visible(want) ? want : controls(screenId)[0];
    try { el?.focus({ preventScroll: true }); } catch {  }
  }

  function step(screenId, by) {
    const list = controls(screenId);
    if (!list.length) return;
    const at = list.indexOf(document.activeElement);
    const next = list[stepFocus(at, by, list.length)];
    try { next?.focus({ preventScroll: true }); } catch {  }
  }

  function pressFocused(screenId) {
    const el = document.activeElement;
    const root = $(screenId);
    if (el && root?.contains(el) && visible(el)) el.click();
    else focusFirst(screenId);
  }

  
  window.addEventListener('pointerdown', (e) => {
    lastInput = e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse';
  }, true);
  window.addEventListener('keydown', () => { lastInput = 'keys'; }, true);

  
  
  const wasOpen = new Set();
  const observer = new MutationObserver(() => {
    const open = openScreens();
    for (const id of open) {
      if (!wasOpen.has(id) && id === top() && SCREEN_FIRST[id] && shouldFocusOnOpen(lastInput)) {
        
        requestAnimationFrame(() => { if (top() === id) focusFirst(id); });
      }
    }
    
    if (wasOpen.has('pause') && !open.has('pause') && !top()) {
      try { document.activeElement?.blur?.(); } catch {  }
    }
    wasOpen.clear();
    for (const id of open) wasOpen.add(id);
  });
  for (const id of MENU_SCREENS) {
    const el = $(id);
    if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  }
  for (const id of openScreens()) wasOpen.add(id);
  const first = top();
  if (first && SCREEN_FIRST[first] && shouldFocusOnOpen(lastInput)) focusFirst(first);

  
  document.addEventListener('keydown', (e) => {
    const word = navKey(e.key);
    if (!word) return;
    const screen = top();
    if (!screen) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    e.preventDefault();
    step(screen, STEP[word]);
  });

  
  let padState = null;
  let polling = false;
  function poll() {
    let p = null;
    try { p = [...(navigator.getGamepads?.() || [])].find(Boolean) || null; } catch { p = null; }
    if (!p) { polling = false; padState = null; return; }
    const now = performance.now();
    const r = padPresses(padState, padMenuHeld(p), now);
    padState = r.state;
    if (r.presses.length) lastInput = 'pad';
    for (const word of r.presses) {
      const screen = top();
      const a = padAction(screen, word, !!isRacing());
      try {
        if (a.act === 'pause') pauseRace();
        else if (a.act === 'resume') resumeRace();
        else if (a.act === 'step') step(screen, a.arg);
        else if (a.act === 'press') pressFocused(screen);
        else if (a.act === 'click') { const b = $(a.arg); if (visible(b)) b.click(); }
      } catch {  }
    }
    requestAnimationFrame(poll);
  }
  function startPolling() {
    if (polling) return;
    polling = true;
    requestAnimationFrame(poll);
  }
  window.addEventListener('gamepadconnected', startPolling);
  try { if ([...(navigator.getGamepads?.() || [])].some(Boolean)) startPolling(); } catch {  }

  return { focusFirst, step, top };
}
