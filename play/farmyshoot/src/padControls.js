









import { padMove, padLook, padButtons, padMenuHeld, padPresses, cycleSlot, navKey } from './menuNav.js';

const PLAY_ACTIONS = ['moveForward', 'moveBack', 'moveLeft', 'moveRight', 'fire', 'jump', 'reload'];





export function mountPadControls({ getGame, menu, walkTitle, escape, settingsOpen }) {
  let raf = 0;
  let last = 0;
  let menuState = {};
  let prevPlay = {};
  let prevEdge = {};

  const firstPad = () => [...(navigator.getGamepads?.() || [])].find((p) => p && p.connected) || null;

  const releasePlay = (game) => {
    for (const a of PLAY_ACTIONS) if (prevPlay[a]) game?.input?.setSynthetic(a, false);
    prevPlay = {};
  };

  const walkSettings = (word) => {
    const card = document.querySelector('#settings-modal .settings-card');
    const items = [...(card?.querySelectorAll('button, input, a[href], select, summary') || [])]
      .filter((el) => el.offsetParent !== null && !el.disabled);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    const step = word === 'up' || word === 'left' ? -1 : 1;
    items[i < 0 ? 0 : (i + step + items.length) % items.length].focus();
  };

  function poll(t) {
    raf = requestAnimationFrame(poll);
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    const p = firstPad();
    if (!p) return;
    const game = getGame();
    const m = menu();
    const inMenu = !game || !!m?.isOpen() || settingsOpen();

    if (inMenu) {
      releasePlay(game);
      const { presses, state } = padPresses(menuState, padMenuHeld(p), t);
      menuState = state;
      for (const w of presses) {
        if (w === 'confirm') {
          const el = document.activeElement;
          if (el && el !== document.body) el.click();
        } else if (w === 'back' || (w === 'menu' && game)) {
          escape();
        } else if (navKey({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[w])) {
          if (settingsOpen()) walkSettings(w);
          else if (m?.isOpen()) m.walk(w);
          else walkTitle(w);
        }
      }
      return;
    }

    
    menuState = {};
    const want = { ...padMove(p) };
    const b = padButtons(p);
    want.fire = b.fire; want.jump = b.jump; want.reload = b.reload;
    for (const a of PLAY_ACTIONS) {
      if (!!want[a] !== !!prevPlay[a]) game.input?.setSynthetic(a, !!want[a]);
    }
    prevPlay = want;
    const [dx, dy] = padLook(p, dt);
    if (dx || dy) game.player?.addMouseLook?.(dx, dy);
    const edge = (k) => b[k] && !prevEdge[k];
    if (edge('prevWeapon') || edge('nextWeapon')) {
      const slot = (game.weapons?.slot ?? 0) + 1;
      game._switchWeapon(cycleSlot(slot, edge('nextWeapon') ? 1 : -1) - 1);
    }
    if (b.scoreboard !== !!prevEdge.scoreboard) game._paintScoreboard(b.scoreboard);
    if (edge('menu')) escape();
    prevEdge = b;
  }

  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(poll); } };
  const stop = () => {
    if (firstPad()) return;
    cancelAnimationFrame(raf); raf = 0;
    releasePlay(getGame());
  };
  window.addEventListener('gamepadconnected', start);
  window.addEventListener('gamepaddisconnected', stop);
  if (firstPad()) start();
  return { start, stop, polling: () => !!raf };
}
