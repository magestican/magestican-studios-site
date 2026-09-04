













import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { GAMES, saveKey, puzzleForDay, LAST_KEY } from '../../../web-engine/words/puzzlePick.js';
import { el, clear } from './ui.js';
import * as wordle from './wordle.js';
import * as bee from './bee.js';
import * as connections from './connections.js';
import * as strands from './strands.js';

initAnalytics({ page: 'farmy-crosswords' });




startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Farmy Crosswords is available.',
});

const MODULES = { wordle, bee, connections, strands };

const tabBar = document.getElementById('tabs');
const panel = document.getElementById('panel');





function readJson(key) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    
  }
}

const last = readJson(LAST_KEY) ?? {};
let currentGame = GAMES.some((g) => g.id === last.game) ? last.game : GAMES[0].id;
const indexFor = {};
for (const g of GAMES) {
  const n = MODULES[g.id].count();
  const saved = last.index?.[g.id];
  indexFor[g.id] = Number.isInteger(saved) && saved >= 0 && saved < n
    ? saved
    : puzzleForDay(n);
}

let teardown = () => {};

function show(gameId) {
  teardown();
  currentGame = gameId;
  writeJson(LAST_KEY, { game: currentGame, index: indexFor });

  for (const button of tabBar.querySelectorAll('.tab')) {
    button.setAttribute('aria-selected', button.dataset.game === gameId ? 'true' : 'false');
  }

  const mod = MODULES[gameId];
  const index = indexFor[gameId];
  clear(panel);

  
  
  
  const select = el('select', {
    id: `pick-${gameId}`,
    onchange: (e) => {
      indexFor[gameId] = Number(e.target.value);
      writeJson(LAST_KEY, { game: currentGame, index: indexFor });
      show(gameId);
    },
  });
  for (let i = 0; i < mod.count(); i += 1) {
    const option = el('option', { value: i, text: mod.label(i) });
    if (i === index) option.selected = true;
    select.appendChild(option);
  }
  const today = puzzleForDay(mod.count());
  panel.appendChild(el('div', { class: 'picker' }, [
    el('label', { for: `pick-${gameId}`, text: 'Playset' }),
    select,
    el('button', {
      type: 'button',
      text: "Today's",
      disabled: index === today,
      onclick: () => { indexFor[gameId] = today; show(gameId); },
    }),
    el('span', { class: 'hint-note', text: `${mod.count()} to choose from` }),
  ]));

  const body = el('div');
  panel.appendChild(body);

  teardown = mod.mount(body, {
    index,
    load: () => readJson(saveKey(gameId, index)),
    save: (state) => writeJson(saveKey(gameId, index), state),
    finished: (won) => trackEvent('puzzle_finished', { game: gameId, won: won ? 1 : 0 }),
  }) ?? (() => {});
}

clear(tabBar);
for (const g of GAMES) {
  const button = el('button', {
    type: 'button',
    class: 'tab',
    role: 'tab',
    text: g.name,
    'aria-selected': 'false',
    'aria-controls': 'panel',
    onclick: () => show(g.id),
  });
  button.dataset.game = g.id;
  tabBar.appendChild(el('li', { role: 'presentation' }, [button]));
}

show(currentGame);
trackEvent('game_start', { game: 'farmy-crosswords' });
