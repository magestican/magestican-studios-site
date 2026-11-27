











import {
  SCREENS, SCREEN_FIRST, MATCH_EXIT, navKey, STEP, stepFocus, shouldFocusOnOpen, matchKey,
  padHeld, padPresses, padAction,
} from './menuNav.js';

const FOCUSABLE = 'button, summary, a[href], select, input:not([type=hidden]), [tabindex="0"]';

function visible(el) {
  if (!el || el.disabled || el.hidden) return false;
  if (el.closest('[hidden]')) return false;
  if (!el.getClientRects().length) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

const isField = (t) => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);



export function installMenuInput({ onFocusMove } = {}) {
  const $ = (id) => document.getElementById(id);
  
  let lastInput = null;
  try {
    const coarseOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
    if (coarseOnly) lastInput = 'touch';
  } catch {  }

  const screen = () => SCREENS.find((id) => { const el = $(id); return el && !el.hidden; }) || null;

  
  const boardTarget = () => {
    const block = $('block');
    if (visible(block)) return block;
    const board = $('board');
    if (!visible(board)) return null;
    return board.querySelector('.ll-cell[tabindex="0"]') || board.querySelector('.ll-cell');
  };
  const onBoard = () => {
    const a = document.activeElement;
    return !!a && (a === $('block') || !!$('board')?.contains(a));
  };

  
  const controls = (id) => {
    const root = $(id);
    if (!root) return [];
    return [...root.querySelectorAll(FOCUSABLE)].filter((el) => visible(el)
      && !(id === 'match' && (el.closest('#board') || el.id === 'block')));
  };

  const focus = (el) => { try { el?.focus({ preventScroll: false }); } catch {  } };

  function focusFirst(id) {
    const first = SCREEN_FIRST[id];
    let el = null;
    if (first === 'board') el = boardTarget();
    else if (first === 'primary') el = $(id)?.querySelector('.ll-go');
    else el = $(first);
    focus(visible(el) ? el : controls(id)[0]);
  }

  function step(id, by) {
    const list = controls(id);
    if (!list.length) return;
    const was = document.activeElement;
    focus(list[stepFocus(list.indexOf(was), by, list.length)]);
    if (document.activeElement !== was) { try { onFocusMove?.(); } catch {  } }
  }

  function pressFocused(id) {
    const el = document.activeElement;
    if (el && $(id)?.contains(el) && visible(el)) el.click();
    else focusFirst(id);
  }

  const sendKey = (key) => {
    const t = onBoard() ? document.activeElement : boardTarget();
    if (!t) return;
    if (document.activeElement !== t) focus(t);
    t.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  };

  function run(id, a) {
    if (a.act === 'key') sendKey(a.arg);
    else if (a.act === 'step') step(id, a.arg);
    else if (a.act === 'press') pressFocused(id);
    else if (a.act === 'focus') focus($(a.arg));
    else if (a.act === 'board') focus(boardTarget());
    else if (a.act === 'last') { const list = controls(id).filter((el) => el.tagName === 'BUTTON'); list.at(-1)?.click(); }
  }

  
  window.addEventListener('pointerdown', (e) => {
    lastInput = e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse';
  }, true);
  window.addEventListener('keydown', (e) => { if (e.isTrusted) lastInput = 'keys'; }, true);

  
  let was = screen();
  const observer = new MutationObserver(() => {
    const now = screen();
    if (now === was) return;
    was = now;
    if (!now || !shouldFocusOnOpen(lastInput)) return;
    
    requestAnimationFrame(() => { if (screen() === now) focusFirst(now); });
  });
  for (const id of SCREENS) { const el = $(id); if (el) observer.observe(el, { attributes: true, attributeFilter: ['hidden'] }); }
  if (was && shouldFocusOnOpen(lastInput)) requestAnimationFrame(() => { if (screen() === was) focusFirst(was); });

  
  
  document.addEventListener('keydown', (e) => {
    try {
      const id = screen();
      if (!id || isField(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (id === 'match') {
        const a = matchKey(e.key, onBoard());
        if (a.act === 'none') return;
        e.preventDefault();
        run(id, a);
        return;
      }
      const word = navKey(e.key);
      if (!word) return;
      e.preventDefault();
      step(id, STEP[word]);
    } catch {  }
  });

  
  let padState = null;
  let polling = false;
  function poll() {
    let p = null;
    try { p = [...(navigator.getGamepads?.() || [])].find(Boolean) || null; } catch { p = null; }
    if (!p) { polling = false; padState = null; return; }
    const r = padPresses(padState, padHeld(p), performance.now());
    padState = r.state;
    if (r.presses.length) lastInput = 'pad';
    for (const word of r.presses) {
      const id = screen();
      try { run(id, padAction(id, word, onBoard())); } catch {  }
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

  return { focusFirst, step, screen, exit: MATCH_EXIT };
}
