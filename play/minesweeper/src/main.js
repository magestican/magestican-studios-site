







import {
  PRESETS, newGame, act, toggleFlag, flagsLeft, elapsed, clampCustom, recordBest, neighbours,
} from '../../../web-engine/mines/minesRules.js';
import { applyGameName, gameLang } from '../../../web-engine/i18n/gameNames.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { playUi } from '../../../web-engine/brand/uiSound.js';
import { reportMatch } from '../../../web-engine/progress/report.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { wireTrackButton } from '../../shared/ui/trackButton.js';
import { foldSetup } from '../../shared/ui/setupFold.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill } from './strings.js';

const GAME_ID = 'minesweeper';
const LEVEL_KEY = 'sweepwise-level-v1';
const BEST_KEY = 'sweepwise-best-v1';
const CUSTOM_KEY = 'sweepwise-custom-v1';
const LONG_PRESS_MS = 420;

const lang = gameLang();


const MUSIC_NAMES = { main: 'Lo-fi', local: 'Dangdut' };
const music = createTrackMusic({
  game: 'minesweeper', lang, homeLang: 'id',
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});

const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), ['dig', 'cascade', 'flag', 'unflag', 'boom', 'win']);
const T = stringsFor(lang);
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Sweepwise is available.' });

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const minesEl = $('mines-left');
const clockEl = $('clock');
const faceEl = $('new-game');
const modeEl = $('mode');
const bestEl = $('best');
const msgEl = $('message');
const customEl = $('custom');


document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
for (const el of document.querySelectorAll('[data-t]')) {
  const v = T[el.dataset.t];
  if (v) el.textContent = v;
}
$('rules-link').href = T.rules;
faceEl.setAttribute('aria-label', T.newGame);
faceEl.title = T.newGame;


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };

const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');
let level = params.get('level') || load(LEVEL_KEY, 'beginner');
if (!PRESETS[level] && level !== 'custom') level = 'beginner';
let custom = clampCustom(load(CUSTOM_KEY, { rows: 12, cols: 12, mines: 24 }));
let best = load(BEST_KEY, {});
let mode = 'dig';
let g = null;
let focusIndex = 0;
let ticker = null;
let reported = false;



function shapeFor(spec) {
  const narrow = innerWidth < spec.cols * 26 + 24 && innerHeight > innerWidth;
  return narrow && spec.cols > spec.rows ? { ...spec, rows: spec.cols, cols: spec.rows } : spec;
}

function start() {
  const spec = shapeFor(level === 'custom' ? custom : PRESETS[level]);
  g = newGame({ ...spec, seed: seedParam !== null ? Number(seedParam) : undefined });
  focusIndex = Math.floor(g.rows / 2) * g.cols + Math.floor(g.cols / 2);
  reported = false;
  clearInterval(ticker);
  ticker = null;
  msgEl.textContent = '';
  for (const b of document.querySelectorAll('[data-level]')) {
    b.setAttribute('aria-pressed', String(b.dataset.level === level));
  }
  customEl.hidden = level !== 'custom';
  build();
  sizeCells();
  draw();
  trackEvent('game_start', { game: GAME_ID, level });
}

function build() {
  boardEl.textContent = '';
  boardEl.style.setProperty('--cols', g.cols);
  boardEl.setAttribute('aria-rowcount', g.rows);
  boardEl.setAttribute('aria-colcount', g.cols);
  for (let r = 0; r < g.rows; r++) {
    const row = document.createElement('div');
    row.className = 'sw-row';
    row.setAttribute('role', 'row');
    for (let c = 0; c < g.cols; c++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sw-cell';
      b.setAttribute('role', 'gridcell');
      b.dataset.i = r * g.cols + c;
      row.appendChild(b);
    }
    boardEl.appendChild(row);
  }
}

function sizeCells() {
  if (!g) return;
  const top = boardEl.getBoundingClientRect().top + scrollY;
  const availW = Math.min(innerWidth, document.documentElement.clientWidth) - 32;
  const availH = innerHeight - Math.max(0, top) - 150;
  const fit = Math.floor(Math.min(availW / g.cols, Math.max(availH, 200) / g.rows));
  document.documentElement.style.setProperty('--cell', `${Math.max(24, Math.min(44, fit))}px`);
}


const pad3 = (n) => String(Math.max(-99, Math.min(999, n))).padStart(3, '0');
const secs = (ms) => Math.floor(ms / 1000);

function describe(cell, i) {
  const r = Math.floor(i / g.cols) + 1;
  const c = (i % g.cols) + 1;
  let s;
  if (cell.open && cell.mine) s = T.mine;
  else if (cell.open) s = cell.count ? fill(T.near, { n: cell.count }) : T.empty;
  else if (cell.flag) s = T.flagged;
  else s = T.closed;
  return fill(T.cell, { r, c, s });
}

function draw() {
  const over = g.state === 'won' || g.state === 'lost';
  const buttons = boardEl.querySelectorAll('.sw-cell');
  g.cells.forEach((cell, i) => {
    const b = buttons[i];
    let cls = 'sw-cell';
    let text = '';
    if (cell.open && cell.mine) { cls += ' open boom'; text = '💣'; }
    else if (cell.open) { cls += ' open'; if (cell.count) { cls += ` n${cell.count}`; text = String(cell.count); } }
    else if (over && g.state === 'lost' && cell.mine && !cell.flag) { cls += ' open'; text = '💣'; }
    else if (over && g.state === 'lost' && cell.flag && !cell.mine) { cls += ' wrong'; text = '❌'; }
    else if (cell.flag) text = '🚩';
    if (b.className !== cls) b.className = cls;
    if (b.textContent !== text) b.textContent = text;
    b.tabIndex = i === focusIndex ? 0 : -1;
    b.setAttribute('aria-label', describe(cell, i));
  });
  minesEl.textContent = pad3(flagsLeft(g));
  clockEl.textContent = pad3(secs(elapsed(g)));
  faceEl.textContent = g.state === 'won' ? '😎' : g.state === 'lost' ? '😵' : '🙂';
  modeEl.setAttribute('aria-pressed', String(mode === 'flag'));
  const key = level === 'custom' ? null : level;
  bestEl.textContent = key && Number.isFinite(best[key]) ? `${(best[key] / 1000).toFixed(1)} s` : T.none;
}


function after(before) {
  if (g.state === 'playing' && !ticker) {
    ticker = setInterval(() => { clockEl.textContent = pad3(secs(elapsed(g))); }, 250);
  }
  if ((g.state === 'won' || g.state === 'lost') && !reported) {
    reported = true;
    clearInterval(ticker);
    ticker = null;
    const seconds = Number((elapsed(g) / 1000).toFixed(1));
    if (g.state === 'won') {
      const r = recordBest(best, g);
      best = r.table;
      if (r.isBest) save(BEST_KEY, best);
      msgEl.textContent = fill(T.won, { t: seconds }) + (r.isBest ? ` ${T.best}` : '');
      sfx.play('win');
    } else {
      msgEl.textContent = T.lost;
      sfx.play('boom');
    }
    trackEvent('minesweeper_finished', { won: g.state === 'won', level, seconds });
    
    
    reportMatch({
      game: GAME_ID, outcome: g.state === 'won' ? 'win' : 'loss', mode: 'solo',
      seconds: Math.max(1, Math.round(seconds)), metrics: { level },
    }).catch(() => {});
  } else if (before !== null) {
    sfx.play(before);
  }
  draw();
}

function doAt(i, how) {
  if (!g || i < 0 || i >= g.cells.length) return;
  const r = Math.floor(i / g.cols);
  const c = i % g.cols;
  const cell = g.cells[i];
  const wasFlag = cell.flag;
  const openCount = () => g.cells.reduce((n, x) => n + (x.open ? 1 : 0), 0);
  const openedBefore = openCount();
  const changed = how === 'flag' && !cell.open ? toggleFlag(g, r, c) : act(g, r, c, how);
  if (!changed) return;
  
  
  let sound = openCount() - openedBefore > 1 ? 'cascade' : 'dig';
  if (how === 'flag' && !cell.open) sound = wasFlag ? 'unflag' : 'flag';
  after(sound);
}

const cellIndex = (target) => {
  const b = target && target.closest && target.closest('.sw-cell');
  return b ? Number(b.dataset.i) : -1;
};



let pressTimer = null;
let pressAt = null;
let swallowUntil = 0;
boardEl.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;
  const i = cellIndex(e.target);
  if (i < 0) return;
  pressAt = { x: e.clientX, y: e.clientY };
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    pressTimer = null;
    swallowUntil = Date.now() + 700;
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch {  } }
    doAt(i, 'flag');
  }, LONG_PRESS_MS);
});
const cancelPress = () => { clearTimeout(pressTimer); pressTimer = null; };
boardEl.addEventListener('pointermove', (e) => {
  if (pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 10) cancelPress();
});
boardEl.addEventListener('pointerup', cancelPress);
boardEl.addEventListener('pointercancel', cancelPress);

boardEl.addEventListener('click', (e) => {
  const i = cellIndex(e.target);
  if (i < 0) return;
  if (Date.now() < swallowUntil) return;
  focusIndex = i;
  doAt(i, mode);
});
boardEl.addEventListener('contextmenu', (e) => {
  const i = cellIndex(e.target);
  if (i < 0) return;
  e.preventDefault();
  if (Date.now() < swallowUntil) return;
  focusIndex = i;
  doAt(i, 'flag');
});


boardEl.addEventListener('keydown', (e) => {
  if (!g) return;
  const r = Math.floor(focusIndex / g.cols);
  const c = focusIndex % g.cols;
  const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (moves[e.key]) {
    e.preventDefault();
    const nr = Math.min(g.rows - 1, Math.max(0, r + moves[e.key][0]));
    const nc = Math.min(g.cols - 1, Math.max(0, c + moves[e.key][1]));
    focusIndex = nr * g.cols + nc;
    draw();
    boardEl.querySelectorAll('.sw-cell')[focusIndex].focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    doAt(focusIndex, 'dig');
  } else if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    doAt(focusIndex, 'flag');
  }
});

faceEl.addEventListener('click', () => { playUi('tap'); start(); });
modeEl.addEventListener('click', () => {
  mode = mode === 'flag' ? 'dig' : 'flag';
  playUi(mode === 'flag' ? 'toggleOn' : 'toggleOff');
  draw();
});
for (const b of document.querySelectorAll('[data-level]')) {
  b.addEventListener('click', () => {
    level = b.dataset.level;
    save(LEVEL_KEY, level);
    playUi('tap');
    start();
  });
}
customEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(customEl);
  custom = clampCustom({ rows: f.get('rows'), cols: f.get('cols'), mines: f.get('mines') });
  save(CUSTOM_KEY, custom);
  customEl.rows.value = custom.rows;
  customEl.cols.value = custom.cols;
  customEl.mines.value = custom.mines;
  start();
});
customEl.rows.value = custom.rows;
customEl.cols.value = custom.cols;
customEl.mines.value = custom.mines;

let resizeQueued = false;
addEventListener('resize', () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; sizeCells(); });
});

wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });

foldSetup({ stopAt: '.sw-status' });
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Sweepwise' });



countPlay('minesweeper', { isHost: true });
start();





globalThis.sweepwise = Object.freeze({
  state: () => g && g.state,
  board: () => g && { rows: g.rows, cols: g.cols, mines: g.mines },
  neighboursOf: (i) => (g ? neighbours(g, Math.floor(i / g.cols), i % g.cols) : []),
  cells: () => (g ? g.cells.map((x) => ({ ...x })) : []),
  rect: () => { const r = boardEl.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; },
  cellRect: (i) => { const r = boardEl.querySelectorAll('.sw-cell')[i].getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; },
});
