














import {
  PRESETS, newGame, act, toggleFlag, flagsLeft, elapsed, clampCustom, recordBest, neighbours,
} from '../../../web-engine/mines/minesRules.js';
import {
  RACE_LEVELS, COUNTDOWN_MS, RESULT_GRACE_MS, ST, raceLayout, raceBoard, openedCanon, flagsCanon, safeCells,
  seatsWith, decideRace, createRoom, startRace, canStart, raceRunning, acceptProgress, isRealSeat,
} from '../../../web-engine/mines/raceRules.js';
import { createSender, createReceiver, createThrottle } from '../../../web-engine/mines/raceWire.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { shareLinkFor } from '../../../web-engine/words/coop.js';
import { ROLE, roomFromHref, watchLinkFor, watchingLabel } from '../../../web-engine/net/watchers.js';
import { createNet, canPlayTogether } from './net.js';
import { applyGameName, gameLang } from '../../../web-engine/i18n/gameNames.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { playUi } from '../../../web-engine/brand/uiSound.js';
import { reportMatch } from '../../../web-engine/progress/report.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { wireTrackButton } from '../../shared/ui/trackButton.js';
import { foldSetup } from '../../shared/ui/setupFold.js';
import { mountPlayAgain } from '../../shared/ui/playAgain.js';
import { mountLevelScene } from '../../shared/ui/levelScene.js';
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
const again = mountPlayAgain({ anchor: document.querySelector('.sw-wrap'), source: faceEl });


mountLevelScene({ levels: ['beginner', 'intermediate', 'expert'] });


document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
for (const el of document.querySelectorAll('[data-t]')) {
  const v = T[el.dataset.t];
  if (v) el.textContent = v;
}
for (const el of document.querySelectorAll('[data-t-ph]')) {
  const v = T[el.dataset.tPh];
  if (v) el.placeholder = v;
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


const HOST = 'host';
const GUEST = 'guest';
let playMode = 'solo';                
let net = null;

const room = { active: false, me: null, peers: [], code: null, watching: false };
let rs = createRoom();                
const race = {
  round: 0, layout: null, counts: null, map: null, live: false, goAt: 0,
  sender: null, throttle: null, rx: new Map(), reports: {}, needAt: new Map(),
  countdown: null, refTimer: null, shownResult: 0,
};



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
  
  
  const availW = Math.min(innerWidth, document.documentElement.clientWidth) - 56;
  const availH = innerHeight - Math.max(0, top) - 150;
  const fit = Math.floor(Math.min(availW / g.cols, Math.max(availH, 200) / g.rows));
  
  
  const cell = Math.min(Math.floor(availW / g.cols), Math.max(24, Math.min(44, fit)));
  document.documentElement.style.setProperty('--cell', `${Math.max(20, cell)}px`);
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
  
  faceEl.disabled = playMode === 'race';
  
  again.update(over && playMode !== 'race');
  modeEl.setAttribute('aria-pressed', String(mode === 'flag'));
  const key = level === 'custom' ? null : level;
  bestEl.textContent = key && Number.isFinite(best[key]) ? `${(best[key] / 1000).toFixed(1)} s` : T.none;
}


function after(before) {
  if (playMode === 'race') { afterRace(before); return; }
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
  if (!canDig()) return;
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

faceEl.addEventListener('click', () => { if (playMode === 'race') return; playUi('tap'); start(); });
modeEl.addEventListener('click', () => {
  mode = mode === 'flag' ? 'dig' : 'flag';
  playUi(mode === 'flag' ? 'toggleOn' : 'toggleOff');
  draw();
});
for (const b of document.querySelectorAll('[data-level]')) {
  b.addEventListener('click', () => {
    
    if (playMode === 'race') { pickRaceLevel(b.dataset.level); return; }
    level = b.dataset.level;
    save(LEVEL_KEY, level);
    playUi('tap');
    start();
  });
}
customEl.addEventListener('submit', (e) => {
  e.preventDefault();
  if (playMode === 'race') return;
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



const seated = () => !!room.me && rs.seats.includes(room.me);
const rivalOf = (id) => rs.seats.find((s) => s !== id && isRealSeat(s)) ?? null;

const viewer = () => playMode === 'race' && room.active
  && (room.watching || (!!room.me && !seated() && rs.seats.every(isRealSeat)));
const codeOf = (id) => String(id ?? '').replace(/^fms-/i, '').toUpperCase();


function canDig() {
  if (playMode !== 'race') return true;
  if (room.watching) return false;
  return room.active && seated() && race.live && !!race.sender && !resultFor(race.round);
}
const resultFor = (round) => (rs.result && rs.result.round === round ? rs.result : null);

function setPressedLevel(l) {
  for (const b of document.querySelectorAll('[data-level]')) {
    b.setAttribute('aria-pressed', String(b.dataset.level === l));
  }
}


function blankBoard(l) {
  level = RACE_LEVELS.includes(l) ? l : 'beginner';
  g = newGame(shapeFor(PRESETS[level]));
  clearInterval(ticker);
  ticker = null;
  customEl.hidden = true;
  setPressedLevel(level);
  build();
  sizeCells();
  draw();
}

function pickRaceLevel(l) {
  if (!RACE_LEVELS.includes(l)) return;
  if (!net?.hosting || raceRunning(rs) || room.watching) return; 
  playUi('tap');
  rs = { ...rs, level: l };
  net.publish();
  blankBoard(l);
  drawRoom();
}


function beginRound(rc, { decided = false } = {}) {
  clearInterval(race.countdown);
  clearTimeout(race.refTimer);
  race.throttle?.cancel();
  Object.assign(race, {
    round: rc.round, layout: raceLayout(rc), map: null, live: false, goAt: 0,
    sender: null, throttle: null, rx: new Map(), reports: {}, needAt: new Map(), refTimer: null,
  });
  
  const L = race.layout;
  race.counts = L.mine.map((_, i) => neighbours(L, Math.floor(i / L.cols), i % L.cols).filter((n) => L.mine[n]).length);
  for (const id of rs.seats.filter(isRealSeat)) race.rx.set(id, createReceiver({ cells: L.rows * L.cols, round: rc.round }));
  blankBoard(rc.level);
  if (decided) { go(); return; }
  let n = Math.round(COUNTDOWN_MS / 1000);
  say(fill(T.countdown, { n }));
  race.countdown = setInterval(() => {
    n -= 1;
    if (n > 0) { say(fill(T.countdown, { n })); playUi('tap'); return; }
    clearInterval(race.countdown);
    race.countdown = null;
    go();
  }, 1000);
  drawRace();
}

function go() {
  race.live = true;
  race.goAt = Date.now();
  if (seated() && !room.watching) {
    const spec = PRESETS[race.layout.level];
    const shaped = shapeFor(spec);
    const b = raceBoard(race.layout, { transpose: shaped.rows !== spec.rows });
    g = b.g;
    race.map = b.map;
    focusIndex = race.map.toLocal(race.layout.start);
    build();
    sizeCells();
    race.sender = createSender({ cells: race.layout.rows * race.layout.cols, round: race.round });
    race.throttle = createThrottle({ flush: sendProgress });
    sendProgress();
    let tick = 0;
    ticker = setInterval(() => {
      clockEl.textContent = pad3(secs(elapsed(g)));
      if (++tick % 2 === 0) drawRace(); 
    }, 250);
    say(T.go, 1200);
    sfx.play('cascade');
  } else {
    ticker = setInterval(() => drawRace(), 500);
    say(T.watching);
  }
  draw();
  drawRoom();
  drawRace();
}


function afterRace(sound) {
  const done = g.state === 'won' || g.state === 'lost';
  if (done) {
    clearInterval(ticker);
    ticker = null;
    sfx.play(g.state === 'won' ? 'win' : 'boom');
    race.throttle?.now(); 
  } else {
    if (sound) sfx.play(sound);
    race.throttle?.poke();
  }
  draw();
}

function myState() {
  const st = g.state === 'won' ? ST.WON : g.state === 'lost' ? ST.BOOM : ST.PLAY;
  return {
    opened: openedCanon(g, race.map), flags: flagsCanon(g, race.map), st, e: elapsed(g),
    x: Number.isInteger(g.exploded) ? race.map.toCanon(g.exploded) : undefined,
  };
}

function sendProgress() {
  if (!race.sender || !net || !g || !race.map) return;
  const msg = race.sender.next(myState());
  if (!msg) return;
  net.progress(msg);
  
  if (net.hosting) report(room.me, msg);
}


function report(id, msg) {
  if (!id || msg.r !== race.round) return;
  race.reports[id] = { st: msg.st, e: msg.e, n: msg.n, at: Date.now() };
  referee();
}

function referee() {
  if (!net?.hosting || !race.layout || resultFor(race.round)) return;
  const res = decideRace({ seats: rs.seats, reports: race.reports, now: Date.now() });
  if (!res) {
    const waiting = Object.values(race.reports).some((r) => r.st !== ST.PLAY);
    if (waiting && !race.refTimer) race.refTimer = setTimeout(() => { race.refTimer = null; referee(); }, RESULT_GRACE_MS + 20);
    return;
  }
  setResult(res);
}

function setResult(res) {
  clearTimeout(race.refTimer);
  race.refTimer = null;
  rs = { ...rs, result: { round: race.round, winner: res.winner, why: res.why } };
  net?.publish();
  showResult();
}


function showResult() {
  const r = resultFor(race.round);
  if (!r) return;
  drawRoom();
  drawRace();
  if (race.shownResult === r.round) return;
  race.shownResult = r.round;
  race.live = false;
  clearInterval(ticker);
  ticker = null;
  race.throttle?.cancel();
  let text;
  if (viewer() || !seated()) {
    const n = rs.seats.indexOf(r.winner) + 1;
    text = r.winner ? fill(T.wins, { who: fill(T.player, { n }) }) : T.draw;
  } else if (!r.winner) text = T.draw;
  else if (r.winner === room.me) text = r.why === 'boom' ? T.winBoom : r.why === 'left' ? T.winLeft : T.winClear;
  else text = r.why === 'boom' ? T.loseBoom : T.loseClear;
  say(text, 0);
  msgEl.textContent = text;
  if (seated() && !room.watching) {
    if (r.winner === room.me) sfx.play('win');
    const seconds = Number((elapsed(g) / 1000).toFixed(1));
    trackEvent('minesweeper_race_finished', { won: r.winner === room.me, why: r.why, level: race.layout?.level, seconds });
    reportMatch({
      game: GAME_ID, outcome: r.winner === room.me ? 'win' : r.winner ? 'loss' : 'draw', mode: 'online',
      seconds: Math.max(1, Math.round(seconds)), metrics: { level: race.layout?.level, race: true },
    }).catch(() => {});
  }
  draw();
}


function adopt(incoming) {
  const before = rs;
  rs = incoming;
  if (rs.race && rs.race.round !== race.round) {
    beginRound(rs.race, { decided: !!resultFor(rs.race.round) });
  } else if (!raceRunning(rs) && rs.level !== before.level && !race.live) {
    blankBoard(rs.level);
  }
  
  if (race.layout) {
    for (const id of rs.seats.filter(isRealSeat)) {
      if (!race.rx.has(id)) race.rx.set(id, createReceiver({ cells: race.layout.rows * race.layout.cols, round: race.round }));
    }
  }
  if (resultFor(race.round)) showResult();
  drawRoom();
  drawRace();
}

function onProposal(action) {
  
  if (action.kind === 'again' && rs.seats.includes(action.by) && canStart(rs)) startNextRace();
}

function startNextRace() {
  if (!net?.hosting || !canStart(rs)) return;
  rs = startRace(rs, Math.floor(Math.random() * 2 ** 31));
  net.publish();
  beginRound(rs.race);
  drawRoom();
}


function onProgress(msg, from) {
  if (!acceptProgress(rs, from) || !race.layout || msg.r !== race.round) return;
  let rx = race.rx.get(from);
  if (!rx) { rx = createReceiver({ cells: race.layout.rows * race.layout.cols, round: race.round }); race.rx.set(from, rx); }
  const res = rx.apply(msg);
  if (res.need) {
    const last = race.needAt.get(from) ?? 0;
    if (Date.now() - last > 500) { race.needAt.set(from, Date.now()); net?.need(from, race.round); }
  }
  if (res.ok && net?.hosting) report(from, msg);
  drawRaceSoon();
}


function resendMine() {
  if (!race.sender || !race.throttle) return;
  race.sender.full();
  race.throttle.now();
}

let raceQueued = false;
function drawRaceSoon() {
  if (raceQueued) return;
  raceQueued = true;
  requestAnimationFrame(() => { raceQueued = false; drawRace(); });
}


const NUM_COLOURS = ['', '#1D4E89', '#1B6B3A', '#A8321E', '#2B2370', '#7A1F12', '#0F5E5E', '#17150F', '#4A4438'];

function paintBoard(cv, rx, cell, numbers) {
  const L = race.layout;
  if (!L || !cv) return;
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const W = L.cols * cell; const H = L.rows * cell;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  cv.style.width = `${W}px`;
  cv.style.height = `${H}px`;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#A88B55';
  c.fillRect(0, 0, W, H);
  const boom = rx?.st === ST.BOOM ? rx.x : null;
  const gap = cell >= 8 ? 1 : 0;
  for (let i = 0; i < L.rows * L.cols; i++) {
    const x = (i % L.cols) * cell; const y = Math.floor(i / L.cols) * cell;
    const open = rx?.opened.has(i);
    if (i === boom) c.fillStyle = '#A8321E';
    else if (open) c.fillStyle = '#FFFDF6';
    else c.fillStyle = '#E9D3A8';
    c.fillRect(x + gap, y + gap, cell - gap, cell - gap);
    if (!open && i !== boom && rx?.flags.has(i)) {
      c.fillStyle = '#A8321E';
      c.beginPath();
      c.moveTo(x + cell * 0.3, y + cell * 0.2); c.lineTo(x + cell * 0.8, y + cell * 0.4); c.lineTo(x + cell * 0.3, y + cell * 0.6);
      c.fill();
    }
    if (numbers && open && race.counts[i]) {
      c.fillStyle = NUM_COLOURS[race.counts[i]];
      c.font = `700 ${Math.floor(cell * 0.62)}px Verdana, sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(race.counts[i]), x + cell / 2 + 0.5, y + cell / 2 + 1);
    }
  }
}

function statText(rx) {
  if (!rx || !race.layout) return '';
  const pct = Math.floor((100 * rx.opened.size) / safeCells(race.layout));
  const st = rx.st === ST.WON ? T.stWon : rx.st === ST.BOOM ? T.stBoom : T.stPlay;
  
  
  const running = rx.st === ST.PLAY && race.live && race.goAt && !resultFor(race.round);
  const ms = running ? Math.max(rx.e, Date.now() - race.goAt) : rx.e;
  return `${fill(T.dug, { p: pct })} · ${secs(ms)} s · ${st}`;
}
const pctOf = (rx) => (rx && race.layout ? Math.min(100, (100 * rx.opened.size) / safeCells(race.layout)) : 0);

function drawRace() {
  const inRace = playMode === 'race' && room.active && !!race.layout;
  const watching = inRace && viewer();
  
  const rival = inRace && !watching && seated() ? rivalOf(room.me) : null;
  $('rival').hidden = !rival;
  if (rival) {
    const rx = race.rx.get(rival);
    const L = race.layout;
    
    
    const tall = innerWidth >= 720 ? 96 : 56;
    const cell = Math.max(2, Math.min(8, Math.floor(Math.min(150 / L.cols, tall / L.rows))));
    paintBoard($('rival-board'), rx, cell, false);
    $('rival-stat').textContent = statText(rx);
    $('rival-bar').style.width = `${pctOf(rx)}%`;
    
    const pill = $('rival-watchers');
    pill.textContent = watchingLabel(T.watchers, net?.watchers ?? 0);
    pill.hidden = !pill.textContent;
  }
  
  $('watch').hidden = !watching;
  document.querySelector('.sw-wrap').hidden = watching;
  document.querySelector('.sw-status').hidden = watching;
  document.querySelector('.sw-foot').hidden = watching;
  if (watching) {
    const L = race.layout;
    const wide = innerWidth >= 720;
    const availW = wide ? (Math.min(innerWidth, 1400) - 120) / 2 : Math.min(innerWidth, document.documentElement.clientWidth) - 72;
    const availH = wide ? innerHeight - 320 : (innerHeight - 300) / 2;
    const cell = Math.max(8, Math.min(28, Math.floor(Math.min(availW / L.cols, availH / L.rows))));
    rs.seats.slice(0, 2).forEach((id, k) => {
      const fig = $(`watch-${k}`);
      const rx = isRealSeat(id) ? race.rx.get(id) : null;
      fig.querySelector('.sw-who').textContent = fill(T.player, { n: k + 1 });
      fig.querySelector('.sw-stat').textContent = statText(rx);
      fig.querySelector('.sw-bar span').style.width = `${pctOf(rx)}%`;
      paintBoard(fig.querySelector('canvas'), rx, cell, cell >= 10);
    });
  }
  resizeIfShifted();
}


let sayTimer = null;
function say(text, ms = 0) {
  const el = $('room-status');
  el.textContent = text;
  clearTimeout(sayTimer);
  sayTimer = null;
  if (ms) sayTimer = setTimeout(() => { sayTimer = null; el.textContent = roomLine(); resizeIfShifted(); }, ms);
  resizeIfShifted();
}


function roomLine() {
  if (!room.active) return '';
  if (viewer()) {
    const r = resultFor(race.round);
    return r ? msgEl.textContent : T.watching;
  }
  if (!room.me) return T.connecting;
  if (resultFor(race.round)) return msgEl.textContent;
  if (raceRunning(rs)) return '';
  if (!rs.seats.every(isRealSeat)) return T.waiting;
  return net?.hosting ? T.joined : T.waitHost;
}

function drawRoom() {
  const on = playMode === 'race';
  $('room').hidden = !on;
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === playMode));
  
  document.querySelector('[data-level="custom"]').hidden = on;
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  
  
  $('room').classList.toggle('racing', room.active && race.live && !viewer() && !resultFor(race.round));
  $('room-code').textContent = room.code ?? '-';
  
  $('copy-link').hidden = room.watching || viewer();
  const watchersEl = $('watchers');
  watchersEl.textContent = watchingLabel(T.watchers, room.active ? (net?.watchers ?? 0) : 0);
  watchersEl.hidden = !watchersEl.textContent;
  
  const goEl = $('race-go');
  const over = !!resultFor(race.round);
  const mayAsk = seated() && !room.watching && over && !net?.hosting;
  const mayStart = !!net?.hosting && seated() && canStart(rs);
  $('room-race').hidden = !(room.active && !viewer() && (mayStart || mayAsk));
  goEl.textContent = rs.race ? T.raceAgain : T.startRace;
  
  const lock = on && room.active && (!net?.hosting || raceRunning(rs));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-disabled', String(lock));
  setPressedLevel(on && room.active ? (rs.race && raceRunning(rs) ? rs.race.level : rs.level) : level);
  if (on && room.active && !sayTimer) $('room-status').textContent = roomLine();
  resizeIfShifted();
}




let lastBoardTop = null;
function resizeIfShifted() {
  requestAnimationFrame(() => {
    const top = Math.round(boardEl.getBoundingClientRect().top + scrollY);
    if (top === lastBoardTop) return;
    lastBoardTop = top;
    sizeCells();
  });
}

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => rs,
    onMatch: adopt,
    onProposal,
    onProgress,
    onNeed: () => resendMine(),
    onChannel: () => resendMine(),
    onPeers: (peers, id) => {
      room.peers = peers;
      if (id) room.me = id;
      if (id && net?.hosting) room.code = codeOf(id);
      if (net?.hosting && room.me && rs.seats[0] === HOST && !raceRunning(rs)) {
        
        rs = { ...rs, seats: [room.me, ...rs.seats.slice(1)] };
      }
      
      if (net?.hosting && room.me) {
        const gone = rs.seats.filter((s) => isRealSeat(s) && s !== room.me && !peers.includes(s));
        if (gone.length) {
          if (raceRunning(rs) && race.layout && !resultFor(race.round)) {
            const stay = rs.seats.find((s) => isRealSeat(s) && !gone.includes(s)) ?? null;
            setResult({ winner: stay, why: 'left' });
          }
          rs = { ...rs, seats: rs.seats.map((s) => (gone.includes(s) ? GUEST : s)) };
          net.publish();
        }
      }
      drawRoom();
      drawRace();
    },
    onArrival: (who) => {
      rs = { ...rs, seats: seatsWith(rs.seats, who, raceRunning(rs)) };
      if (race.layout && !race.rx.has(who) && rs.seats.includes(who)) {
        race.rx.set(who, createReceiver({ cells: race.layout.rows * race.layout.cols, round: race.round }));
      }
    },
    
    
    onUnseat: (who) => {
      if (!rs.seats.includes(who)) return;
      if (raceRunning(rs) && race.layout && !resultFor(race.round)) {
        setResult({ winner: rs.seats.find((s) => s !== who && isRealSeat(s)) ?? null, why: 'left' });
      }
      rs = { ...rs, seats: rs.seats.map((s) => (s === who ? GUEST : s)) };
    },
    onStatus: (kind) => {
      if (kind === 'open') say(T.waiting);
      else if (kind === 'joined' && !room.watching) say(net?.hosting ? T.joined : T.waitHost);
      else if (kind === 'failed') say(T.badCode, 4000);
      drawRoom();
    },
  });
  return net;
}

function enterRace() {
  playMode = 'race';
  msgEl.textContent = '';
  blankBoard(RACE_LEVELS.includes(level) ? level : 'beginner');
  drawRoom();
  drawRace();
}

function openRoom() {
  if (!canPlayTogether()) { say(T.noRooms, 4000); return; }
  room.active = true;
  rs = createRoom({ seats: [HOST, GUEST], level: RACE_LEVELS.includes(level) ? level : 'beginner' });
  startNet().host();
  drawRoom();
}

function joinRoom(code, { watch = false } = {}) {
  if (!canPlayTogether()) { say(T.noRooms, 4000); return false; }
  const out = startNet().join(code, { watch });
  if (out?.error) { net = null; say(T.badCode, 4000); return false; }
  room.active = true;
  room.watching = watch;
  room.code = codeOf(code);
  rs = createRoom({ seats: [GUEST, GUEST] });
  drawRoom();
  return true;
}

function leaveRoom() {
  try { net?.leave(); } catch {  }
  net = null;
  clearInterval(race.countdown);
  clearTimeout(race.refTimer);
  race.throttle?.cancel();
  Object.assign(race, { round: 0, layout: null, live: false, sender: null, throttle: null, rx: new Map(), reports: {}, shownResult: 0 });
  Object.assign(room, { active: false, me: null, peers: [], code: null, watching: false });
  rs = createRoom();
}

for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', () => {
    if (b.dataset.mode === playMode) return;
    playUi('tap');
    if (b.dataset.mode === 'race') { enterRace(); return; }
    leaveRoom();
    playMode = 'solo';
    level = load(LEVEL_KEY, 'beginner');
    drawRoom();
    drawRace();
    start();
  });
}
$('create-room').addEventListener('click', () => { playUi('tap'); openRoom(); });
$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  playUi('tap');
  joinRoom($('join-code').value.trim());
});
$('leave-room').addEventListener('click', () => {
  playUi('toggleOff');
  leaveRoom();
  enterRace();
  say('');
});
$('race-go').addEventListener('click', () => {
  playUi('tap');
  if (net?.hosting) startNextRace();
  else net?.propose({ kind: 'again' });
});
$('copy-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = shareLinkFor(base, net.hosting ? net.id : `fms-${room.code}`, {});
  
  shareLink({ link, gameName: 'Sweepwise', code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') say(T.copied, 4000);
      else if (res?.via === 'manual') say(res.url, 8000);
    }, () => say(link, 8000));
});


$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fms-${room.code}`);
  shareLink({ link, gameName: 'Sweepwise', code: room.code, text: fill(T.watchInvite, { game: 'Sweepwise' }) })
    .then((res) => {
      if (res?.via === 'clipboard') say(T.watchCopied, 4000);
      else if (res?.via === 'manual') say(res.url, 8000);
    }, () => say(link, 8000));
});

let resizeQueued = false;
addEventListener('resize', () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; sizeCells(); drawRace(); });
});

wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });


foldSetup({ stopAt: '#room' });
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Sweepwise' });



const linkRoom = roomFromHref(location.href);
countPlay('minesweeper', { isHost: !linkRoom });
start();
if (linkRoom) {
  enterRace();
  if (!joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH })) drawRoom();
} else drawRoom();





globalThis.sweepwise = Object.freeze({
  state: () => g && g.state,
  board: () => g && { rows: g.rows, cols: g.cols, mines: g.mines },
  neighboursOf: (i) => (g ? neighbours(g, Math.floor(i / g.cols), i % g.cols) : []),
  cells: () => (g ? g.cells.map((x) => ({ ...x })) : []),
  rect: () => { const r = boardEl.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; },
  cellRect: (i) => { const r = boardEl.querySelectorAll('.sw-cell')[i].getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; },
  
  race: () => ({
    mode: playMode, room: { ...room, hosting: !!net?.hosting, watchers: net?.watchers ?? 0 },
    seats: [...rs.seats], level: rs.level, race: rs.race && { ...rs.race }, result: rs.result && { ...rs.result },
    live: race.live, canDig: canDig(), viewer: viewer(), start: race.layout?.start ?? null,
    boards: Object.fromEntries([...race.rx].map(([id, rx]) => [id, { opened: rx.opened.size, st: rx.st, e: rx.e, seq: rx.seq }])),
    mine: g && race.map ? openedCanon(g, race.map).length : null,
  }),
});
