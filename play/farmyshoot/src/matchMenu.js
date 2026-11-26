










import { MATCH_MENU, navKey, STEP, stepFocus, shouldHold, resumeDeadline, leaveStep, menuCue, CONFIRM_MS } from './menuNav.js';


export const MENU_WORDS = Object.freeze({
  'mm-resume': 'Keep playing',
  'mm-settings': 'Open settings',
  'mm-leave': 'Leave match',
  confirm: 'Press again to leave.',
  held: 'The match waits for you.',
  live: 'The match goes on for everyone.',
});


export function humansIn(game) {
  let n = 0;
  for (const [id, m] of game?.playerMeta?.entries?.() ?? []) {
    if (id === game.myId) continue;
    if (m?.bot || game.bots?.has?.(id)) continue;
    n++;
  }
  return n;
}






export const MENU_Z = Object.freeze({ scrim: 10000, card: 10001, plates: 10002, settings: 10003, tiebreak: 10004,
  matchEnd: 10005 });


export const HIDDEN_UNDER_MENU = Object.freeze(['#enable-sound', '#hill-banner', '#carry-banner', '#powerup-pill',
  '#poison-hint', '#chat', '#chat-btn', '#kill-feed']);

export const MENU_CSS = `
  #mm-scrim { position: fixed; inset: 0; z-index: ${MENU_Z.scrim}; display: none; pointer-events: auto;
    background: rgba(6, 9, 14, 0.62); }
  body.mm-open #mm-scrim { display: block; }
  body.mm-open #scoreboard { z-index: ${MENU_Z.card}; }
  body.mm-open #settings-modal { z-index: ${MENU_Z.settings}; }
  body.mm-open #anagramWrap { z-index: ${MENU_Z.tiebreak}; }
  /* A match that ends for everyone while my menu is open (people in the room, so it was not held): the result,
     the vote and the intermission are the news, and they come up over the menu. */
  body.mm-open #round-result, body.mm-open #vote-overlay, body.mm-open #intermission { z-index: ${MENU_Z.matchEnd}; }
  ${HIDDEN_UNDER_MENU.map((s) => `body.mm-open ${s}`).join(', ')} { visibility: hidden !important; }
  #match-menu { position: fixed; left: 50%; bottom: max(24px, 7vh); transform: translateX(-50%);
    z-index: ${MENU_Z.plates}; display: none; flex-direction: column; align-items: center; gap: 12px;
    width: min(760px, 94vw); pointer-events: auto; font-family: system-ui, sans-serif; }
  #match-menu.open { display: flex; animation: mm-rise 180ms ease-out both; }
  #match-menu .mm-row { display: flex; gap: 12px; width: 100%; }
  #match-menu button { flex: 1 1 0; min-height: 56px; padding: 10px 14px; cursor: pointer;
    font: 900 18px/1.1 "Arial Black", "Segoe UI Black", system-ui, sans-serif; letter-spacing: .04em;
    color: #fff8e6; text-shadow: 0 2px 0 #5a1610; background: #8e2f22;
    border: 4px solid #f3e6c4; border-radius: 12px; box-shadow: 0 6px 0 #5a1610;
    transition: transform 120ms ease-out, background-color 120ms ease-out; }
  #match-menu button:hover { background: #b73a2a; }
  #match-menu button:focus-visible, #match-menu button.mm-focus { outline: 3px solid #fff8e6; outline-offset: 3px;
    background: #b73a2a; transform: translateY(-2px); }
  #match-menu button:active { transform: translateY(4px); box-shadow: 0 2px 0 #5a1610; }
  #match-menu #mm-leave.armed { background: #f4c95d; color: #1c1a17; text-shadow: none; }
  #match-menu .mm-line { margin: 0; padding: 6px 14px; border-radius: 8px; background: rgba(8,11,17,0.85);
    color: #cbd3e1; font: 600 14px/1.3 system-ui, sans-serif; text-align: center; }
  @keyframes mm-rise { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @media (max-width: 520px) {
    #match-menu { bottom: max(16px, env(safe-area-inset-bottom)); gap: 10px; }
    #match-menu .mm-row { gap: 8px; }
    #match-menu button { min-height: 60px; padding: 8px 6px; font-size: 15px; border-width: 3px; }
  }
  /* The scoreboard card makes room above the plates (measured at 390 x 844: the plates covered its lower half),
     and the chat bubble at bottom-left steps out of the way while the menu is up. */
  @media (max-width: 520px), (max-height: 600px) {
    body.mm-open #scoreboard { align-items: flex-start; padding: 64px 0 150px; box-sizing: border-box; }
    body.mm-open #scoreboard .sb-card { max-height: 100%; overflow: hidden; }
  }
  @media (prefers-reduced-motion: reduce) { #match-menu.open { animation: none; } #match-menu button { transition: none; } }
`;





export function mountMatchMenu({ game, ui, onLeave, openSettings, now = () => Date.now() }) {
  if (!document.getElementById('match-menu-styles')) {
    const s = document.createElement('style');
    s.id = 'match-menu-styles';
    s.textContent = MENU_CSS;
    document.head.appendChild(s);
  }
  
  const scrim = document.createElement('div');
  scrim.id = 'mm-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim);
  const root = document.createElement('div');
  root.id = 'match-menu';
  root.setAttribute('role', 'menu');
  root.setAttribute('aria-label', 'Match menu');
  root.innerHTML = `<div class="mm-row">${MATCH_MENU.map((id) =>
    `<button type="button" role="menuitem" id="${id}">${MENU_WORDS[id]}</button>`).join('')}</div>
    <p class="mm-line" id="mm-line" aria-live="polite"></p>`;
  document.body.appendChild(root);
  const buttons = MATCH_MENU.map((id) => root.querySelector('#' + id));
  const line = root.querySelector('#mm-line');

  let open = false;
  let heldSince = 0;
  let armedAt = 0;
  let disarm = null;

  const play = (cue) => { try { ui?.play(cue); } catch (_) {  } };
  const focusAt = (i) => { buttons.forEach((b, j) => b.classList.toggle('mm-focus', j === i)); buttons[i]?.focus({ preventScroll: true }); };
  const focusedIndex = () => buttons.indexOf(document.activeElement);

  const disarmLeave = () => {
    armedAt = 0;
    clearTimeout(disarm);
    buttons[2].classList.remove('armed');
    buttons[2].textContent = MENU_WORDS['mm-leave'];
  };

  function show(on) {
    on = !!on;
    if (on === open) return;
    open = on;
    root.classList.toggle('open', on);
    document.body.classList.toggle('mm-open', on);
    if (on) {
      const humans = humansIn(game);
      const hold = shouldHold({ isHost: game.isHost, humans, matchState: game.matchState });
      game._menuHeld = hold;
      heldSince = hold ? now() : 0;
      line.textContent = hold ? MENU_WORDS.held : MENU_WORDS.live;
      disarmLeave();
      play('open');
      focusAt(0);
    } else {
      if (game._menuHeld && heldSince) game._matchEndsAt = resumeDeadline(game._matchEndsAt, now() - heldSince);
      game._menuHeld = false;
      heldSince = 0;
      disarmLeave();
      if (root.contains(document.activeElement)) document.activeElement.blur();
    }
  }

  function resume() {
    play(menuCue('mm-resume'));
    game._paintScoreboard(false);   
    show(false);
    if (!game.isTouch) game.renderer?.domElement?.requestPointerLock?.()?.catch?.(() => {});
  }

  function leave() {
    const step = leaveStep({ humans: humansIn(game), armedAt }, now());
    if (step === 'arm') {
      armedAt = now();
      buttons[2].classList.add('armed');
      buttons[2].textContent = MENU_WORDS.confirm.replace(/\.$/, '');
      line.textContent = MENU_WORDS.confirm;
      play('error');
      clearTimeout(disarm);
      disarm = setTimeout(disarmLeave, CONFIRM_MS);
      return 'arm';
    }
    play(menuCue('mm-leave'));
    onLeave?.();
    return 'leave';
  }

  buttons[0].addEventListener('click', resume);
  buttons[1].addEventListener('click', () => { play(menuCue('mm-settings')); openSettings?.(); });
  buttons[2].addEventListener('click', () => leave());
  buttons.forEach((b, i) => b.addEventListener('focus', () => buttons.forEach((x, j) => x.classList.toggle('mm-focus', j === i))));

  
  
  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (document.getElementById('settings-modal')?.classList.contains('visible')) return;
    const word = navKey(e.key);
    if (!word) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    focusAt(stepFocus(focusedIndex(), STEP[word], buttons.length));
    play('focus');
  }, true);

  return {
    show,
    isOpen: () => open,
    leave,
    resume,
    buttons,
    
    walk(word) { focusAt(stepFocus(focusedIndex(), STEP[word] || 0, buttons.length)); play('focus'); },
    press() { const i = focusedIndex(); (buttons[i >= 0 ? i : 0]).click(); },
  };
}
