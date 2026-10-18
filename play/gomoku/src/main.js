















import { SIZE, BLACK, WHITE, EMPTY, RULES, toCoord, fromCoord } from '../../../web-engine/gomoku/gomokuRules.js';
import { chooseMove, LEVELS, seededRng } from '../../../web-engine/gomoku/gomokuBot.js';
import {
  SOLO, createMatch, replayMatch, applyAction, withMove, undoPlies, undoMatch, seatsWith,
  rematch, winnerSeat, isMyTurn, seatOf, colourOfSeat, seatOfColour,
} from '../../../web-engine/gomoku/gomokuMatch.js';
import { applyGameName, gameLang, localGameName } from '../../../web-engine/i18n/gameNames.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { playUi } from '../../../web-engine/brand/uiSound.js';
import { reportMatch } from '../../../web-engine/progress/report.js';
import { CARDS, deviceId } from '../../../web-engine/progress/peerCards.js';
import { twoSeatMatch, createReportGate } from '../../../web-engine/progress/matchArgs.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { shareLinkFor } from '../../../web-engine/words/coop.js';
import { ROLE, roomFromHref, watchLinkFor, watchingLabel } from '../../../web-engine/net/watchers.js';
import { roomPresence } from '../../shared/net/roomPresence.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { wireTrackButton } from '../../shared/ui/trackButton.js';
import { foldSetup } from '../../shared/ui/setupFold.js';
import { mountPlayAgain } from '../../shared/ui/playAgain.js';
import { fitScreen, bootDone, afterBoot } from '../../shared/ui/fitScreen.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, defaultRules } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'gomoku';
const SETTINGS_KEY = 'gomowise-settings-v1';
const BOT = 'bot';
const GUEST = 'guest';        
const HOST = 'host';          
const BOT_DELAY_MS = 320;
const SVGNS = 'http://www.w3.org/2000/svg';

const lang = gameLang();


const MUSIC_NAMES = { main: 'Lo-fi', local: { ko: '트로트', default: 'Trot' } };
const music = createTrackMusic({
  game: 'gomoku', lang, homeLang: 'ko',
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});

const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), ['stone', 'stoneThem', 'win', 'lose']);
const T = stringsFor(lang);
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Gomowise is available.' });

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const statusEl = $('status');
const sayEl = $('cursor-say');
const rulesEl = $('rules');
const newGameEl = $('new-game');
const again = mountPlayAgain({ anchor: document.querySelector('.gm-board-wrap'), source: newGameEl });

let fit = null;
const undoEl = $('undo');
const roomEl = $('room');


document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
for (const el of document.querySelectorAll('[data-t]')) {
  const v = T[el.dataset.t];
  if (v) el.textContent = v;
}
for (const el of document.querySelectorAll('[data-t-ph]')) {
  const v = T[el.dataset.tPh];
  if (v) { el.placeholder = v; el.setAttribute('aria-label', v); }
}
$('rules-link').href = T.rules;
boardEl.setAttribute('aria-label', T.boardLabel);
const GAME_NAME = localGameName(GAME_ID, lang);


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };

const params = new URLSearchParams(location.search);
const saved = load(SETTINGS_KEY, {});
const pick = (v, list, d) => (list.includes(v) ? v : d);
const settings = {
  mode: pick(params.get('mode'), ['bot', 'local'], pick(saved.mode, ['bot', 'local'], 'bot')),
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'medium')),
  rules: pick(params.get('rules'), RULES, pick(saved.rules, RULES, defaultRules(lang))),
  colour: pick(params.get('colour'), ['black', 'white'], pick(saved.colour, ['black', 'white'], 'black')),
};



let rulesChosen = RULES.includes(saved.rules);
const persist = () => save(SETTINGS_KEY, {
  mode: settings.mode === 'room' ? 'bot' : settings.mode,
  level: settings.level, colour: settings.colour,
  ...(rulesChosen ? { rules: settings.rules } : {}),
});
const seedParam = params.get('seed');
const rng = seedParam !== null ? seededRng(Number(seedParam) || 1) : Math.random;


let match = null;
let state = null;
let net = null;
let botTimer = null;

const room = { active: false, me: null, peers: [], code: null, watching: false };



const presence = roomPresence({
  game: 'gomoku',
  net: () => net,
  players: () => new Set([room.me, ...room.peers].filter(Boolean)).size || 1,
  ids: () => [room.me, ...room.peers].filter(Boolean),
});
const reportGate = createReportGate();
let startedAt = Date.now();
let pending = -1;                     




let echo = null;
const ECHO_TIMEOUT_MS = 8000;         
let hover = -1;                       
let cursor = Math.floor(SIZE / 2) * SIZE + Math.floor(SIZE / 2);

const me = () => (settings.mode === 'room' ? (room.me ?? HOST) : SOLO);

function seatsForMode() {
  if (settings.mode === 'local') return [SOLO, SOLO];
  if (settings.mode === 'room') return [room.me ?? HOST, GUEST];
  return settings.colour === 'black' ? [SOLO, BOT] : [BOT, SOLO];
}


const seatOwner = () => (state.seats[0] === state.seats[1] ? null : me());

function rederive() {
  state = replayMatch(match);
}

function begin(m) {
  match = m;
  rederive();
  reportGate.begin(match.seats);
  startedAt = Date.now();
  pending = -1;
  clearEcho();
}

function newMatch() {
  stopBot();
  begin(createMatch({ seats: seatsForMode(), rules: settings.rules }));
}


const el = (name, attrs = {}) => {
  const n = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};
const xy = (i) => [(i % SIZE) + 1, Math.floor(i / SIZE) + 1];

function drawGrid() {
  const defs = el('defs');
  const g1 = el('radialGradient', { id: 'gm-black', cx: '35%', cy: '30%', r: '70%' });
  g1.append(el('stop', { offset: '0%', 'stop-color': '#6b6b6b' }), el('stop', { offset: '100%', 'stop-color': '#0b0b0b' }));
  const g2 = el('radialGradient', { id: 'gm-white', cx: '35%', cy: '30%', r: '75%' });
  g2.append(el('stop', { offset: '0%', 'stop-color': '#ffffff' }), el('stop', { offset: '100%', 'stop-color': '#d9d2c3' }));
  defs.append(g1, g2);
  boardEl.append(defs, el('rect', { class: 'wood', x: 0, y: 0, width: 16, height: 16, rx: 0.4 }));
  for (let k = 1; k <= SIZE; k++) {
    boardEl.append(el('line', { class: 'grid', x1: 1, y1: k, x2: SIZE, y2: k }));
    boardEl.append(el('line', { class: 'grid', x1: k, y1: 1, x2: k, y2: SIZE }));
    const letter = el('text', { class: 'label', x: k, y: 0.45 });
    letter.textContent = 'ABCDEFGHIJKLMNO'[k - 1];
    const num = el('text', { class: 'label', x: 0.42, y: k });
    num.textContent = String(SIZE + 1 - k);
    boardEl.append(letter, num);
  }
  boardEl.append(el('rect', { class: 'edge', x: 1, y: 1, width: SIZE - 1, height: SIZE - 1 }));
  for (const [c, r] of [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]) {
    boardEl.append(el('circle', { class: 'star', cx: c + 1, cy: r + 1, r: 0.11 }));
  }
}

const layer = el('g');

function stone(i, colour, extra = '') {
  const [x, y] = xy(i);
  return el('circle', { class: `${colour === BLACK ? 'stone-black' : 'stone-white'} ${extra}`.trim(), cx: x, cy: y, r: 0.45 });
}

function draw() {
  layer.replaceChildren();
  const { game } = state;
  game.cells.forEach((x, i) => { if (x !== EMPTY) layer.append(stone(i, x, echo && echo.at === i ? 'stone-echo' : '')); });
  const last = game.moves[game.moves.length - 1];
  if (last !== undefined) {
    const [x, y] = xy(last);
    layer.append(el('circle', { class: 'last', cx: x, cy: y, r: 0.13 }));
  }
  if (game.line) {
    for (const i of game.line) { const [x, y] = xy(i); layer.append(el('circle', { class: 'win', cx: x, cy: y, r: 0.5 })); }
  }
  const ghostAt = pending >= 0 ? pending : hover;
  if (ghostAt >= 0 && canPlace() && game.cells[ghostAt] === EMPTY) {
    layer.append(stone(ghostAt, game.turn, 'ghost'));
    if (pending >= 0) { const [x, y] = xy(pending); layer.append(el('circle', { class: 'pending', cx: x, cy: y, r: 0.55 })); }
  }
  if (document.activeElement === boardEl && boardEl.matches(':focus-visible')) {
    const [x, y] = xy(cursor);
    layer.append(el('rect', { class: 'cursor', x: x - 0.5, y: y - 0.5, width: 1, height: 1, rx: 0.12 }));
  }
  drawStatus();
  drawControls();
}

const colourName = (c) => (c === BLACK ? T.black : T.white);

function statusText() {
  const { game } = state;
  if (settings.mode === 'room') {
    if (!room.active) return '';
    if (!room.me) return T.connecting;
  }
  if (game.over) {
    if (game.draw) return T.draw;
    const ws = winnerSeat(state);
    if (settings.mode === 'local') return fill(T.wins, { who: colourName(game.winner) });
    if (settings.mode === 'room' && seatOf(state, me()) < 0) return fill(T.wins, { who: colourName(game.winner) });
    return state.seats[ws] === me() ? T.youWin : T.youLose;
  }
  if (settings.mode === 'local') return fill(T.turnOf, { who: colourName(game.turn) });
  if (settings.mode === 'bot') return isMyTurn(state, SOLO) ? T.yourTurn : T.botThinking;
  if (room.watching) return T.watching;
  if (state.seats.includes(GUEST)) return T.waiting;
  if (seatOf(state, me()) < 0) return T.watching;
  return isMyTurn(state, me()) ? T.yourTurn : T.theirTurn;
}

let lastStatus = '';
let flash = '';
function drawStatus() {
  const text = flash || statusText();
  if (text === lastStatus) return;
  lastStatus = text;
  statusEl.replaceChildren();
  if (!flash && !state.game.over && text) {
    const dot = document.createElement('span');
    dot.className = `gm-dot ${state.game.turn === BLACK ? 'black' : 'white'}`;
    dot.setAttribute('aria-hidden', 'true');
    statusEl.append(dot);
  }
  statusEl.append(document.createTextNode(text));
}

function say(text, ms = 2400) {
  flash = text;
  drawStatus();
  setTimeout(() => { if (flash === text) { flash = ''; drawStatus(); } }, ms);
}

function drawControls() {
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  for (const b of document.querySelectorAll('[data-colour]')) b.setAttribute('aria-pressed', String(b.dataset.colour === settings.colour));
  $('bot-row').hidden = settings.mode !== 'bot';
  $('colour-row').hidden = settings.mode !== 'bot';
  rulesEl.value = state.game.rules;
  
  rulesEl.disabled = settings.mode === 'room' && (!net?.hosting || state.game.moves.length > 0);
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  
  $('copy-link').hidden = room.watching;
  const watchersEl = $('watchers');
  watchersEl.textContent = watchingLabel(T.watchers, room.active ? (net?.watchers ?? 0) : 0);
  watchersEl.hidden = !watchersEl.textContent;
  undoEl.hidden = settings.mode === 'room';
  undoEl.disabled = state.game.moves.length === 0 || (settings.mode === 'bot' && !!botTimer);
  newGameEl.textContent = settings.mode === 'room' ? T.rematch : T.newGame;
  
  newGameEl.hidden = settings.mode === 'room' && room.watching;
  newGameEl.disabled = settings.mode === 'room' && (room.watching || !room.active || (!state.game.over && !(net?.hosting && state.game.moves.length === 0)));
  again.update(state.game.over && !(settings.mode === 'room' && room.watching));
  fit?.refit();
}


function canPlace() {
  if (state.game.over) return false;
  if (settings.mode === 'local') return true;
  if (settings.mode === 'bot') return isMyTurn(state, SOLO) && !botTimer;
  if (room.watching) return false;
  return room.active && !!room.me && isMyTurn(state, me()) && !state.seats.includes(GUEST);
}


function commit(at) {
  match = withMove(match, at);
  rederive();
  pending = -1;
  sfx.play(stoneSound(at));
  sayEl.textContent = fill(T.placed, { who: colourName(state.game.cells[at]), p: toCoord(at).toUpperCase() });
  if (net?.hosting) net.publish();
  afterChange();
}

function tryPlace(i) {
  if (!canPlace()) return;
  const owner = seatOwner();
  const check = applyAction(state, { kind: 'move', at: i, by: owner });
  if (check.error) {
    if (check.rule === 'doubleThree') { playUi('error'); say(T.doubleThree); }
    return;
  }
  if (settings.mode === 'room' && !net?.hosting) {
    
    
    pending = -1;
    echo = { at: check.at, index: match.moves.length, base: match, timer: setTimeout(echoTimedOut, ECHO_TIMEOUT_MS) };
    match = withMove(match, check.at);
    rederive();
    sfx.play('stone');
    net?.propose({ kind: 'move', at: i });
    draw();
    return;
  }
  commit(check.at);
}

function clearEcho() {
  if (echo?.timer) clearTimeout(echo.timer);
  echo = null;
}


function rollBack() {
  playUi('error');
  say(T.refused, 3200);
}

function echoTimedOut() {
  if (!echo) return;
  match = echo.base;
  clearEcho();
  rederive();
  rollBack();
  draw();
}




function stoneSound(at) {
  const seat = seatOfColour(state.game.cells[at]);
  return settings.mode === 'local' || state.seats[seat] === me() ? 'stone' : 'stoneThem';
}

function afterChange() {
  draw();
  if (state.game.over) finished();
  else maybeBot();
}

function finished() {
  const { game } = state;
  const ws = winnerSeat(state);
  const mine = seatOf(state, me());
  const result = game.draw ? 'draw' : (state.seats[ws] === me() ? 'won' : 'lost');
  if (settings.mode !== 'local' && mine >= 0) { if (result !== 'draw') sfx.play(result === 'won' ? 'win' : 'lose'); }
  else sfx.play('win');
  const turn = seatOwner() && mine >= 0 ? reportGate.take() : null;
  if (turn) {
    const arg = twoSeatMatch({
      game: GAME_ID, seats: state.seats, me: me(), result,
      isBot: (id) => id === BOT, cardFor: (id) => CARDS.get(id), online: settings.mode === 'room',
      startSeats: turn.startSeats, myDev: deviceId(), hosting: !!net?.hosting,
      seconds: (Date.now() - startedAt) / 1000,
    });
    if (arg) reportMatch(arg).catch(() => {});
  }
  trackEvent('gomoku_finished', {
    mode: settings.mode, level: settings.level, rules: game.rules, result, moves: game.moves.length,
  });
}

function stopBot() {
  if (botTimer) clearTimeout(botTimer);
  botTimer = null;
}

function maybeBot() {
  if (settings.mode !== 'bot' || state.game.over || botTimer) return;
  if (state.seats[seatOfColour(state.game.turn)] !== BOT) return;
  botTimer = setTimeout(() => {
    botTimer = null;
    if (settings.mode !== 'bot' || state.game.over) return;
    commit(chooseMove(state.game, { level: settings.level, rng }));
  }, BOT_DELAY_MS);
  draw();
}


function pointAt(ev) {
  const ctm = boardEl.getScreenCTM();
  if (!ctm) return -1;
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
  const c = Math.round(p.x - 1);
  const r = Math.round(p.y - 1);
  if (c < 0 || r < 0 || c >= SIZE || r >= SIZE) return -1;
  if (Math.hypot(p.x - (c + 1), p.y - (r + 1)) > 0.62) return -1;
  return r * SIZE + c;
}

boardEl.addEventListener('pointermove', (ev) => {
  if (ev.pointerType !== 'mouse') return;
  const i = pointAt(ev);
  if (i !== hover) { hover = i; draw(); }
});
boardEl.addEventListener('pointerleave', () => { if (hover >= 0) { hover = -1; draw(); } });
boardEl.addEventListener('pointerup', (ev) => {
  const i = pointAt(ev);
  if (i < 0 || state.game.cells[i] !== EMPTY) return;
  cursor = i;
  
  
  
  if (ev.pointerType !== 'mouse' && pending !== i) {
    if (!canPlace()) return;
    pending = i;
    sayEl.textContent = T.tapAgain;
    draw();
    return;
  }
  tryPlace(i);
});


function describe(i) {
  const x = state.game.cells[i];
  return fill(T.point, { p: toCoord(i).toUpperCase(), s: x === EMPTY ? T.empty : colourName(x) });
}
boardEl.addEventListener('keydown', (ev) => {
  const r = Math.floor(cursor / SIZE);
  const c = cursor % SIZE;
  const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (moves[ev.key]) {
    ev.preventDefault();
    const [dr, dc] = moves[ev.key];
    cursor = Math.min(SIZE - 1, Math.max(0, r + dr)) * SIZE + Math.min(SIZE - 1, Math.max(0, c + dc));
    sayEl.textContent = describe(cursor);
    draw();
  } else if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    tryPlace(cursor);
  }
});
boardEl.addEventListener('focus', () => { sayEl.textContent = describe(cursor); draw(); });
boardEl.addEventListener('blur', () => draw());


for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    if (mode === settings.mode) return;
    playUi('toggleOn');
    if (settings.mode === 'room') leaveRoom();
    settings.mode = mode;
    persist();
    newMatch();
    afterChange();
  });
}
for (const b of document.querySelectorAll('[data-level]')) {
  b.addEventListener('click', () => {
    if (b.dataset.level === settings.level) return;
    playUi('toggleOn');
    settings.level = b.dataset.level;
    persist();
    newMatch();
    afterChange();
  });
}
for (const b of document.querySelectorAll('[data-colour]')) {
  b.addEventListener('click', () => {
    if (b.dataset.colour === settings.colour) return;
    playUi('toggleOn');
    settings.colour = b.dataset.colour;
    persist();
    newMatch();
    afterChange();
  });
}
rulesEl.addEventListener('change', () => {
  settings.rules = rulesEl.value;
  rulesChosen = true;
  persist();
  if (settings.mode === 'room') {
    if (!net?.hosting || state.game.moves.length) return;
    match = { ...match, rules: settings.rules };
    rederive();
    net.publish();
    draw();
    return;
  }
  newMatch();
  afterChange();
});
newGameEl.addEventListener('click', () => {
  playUi('tap');
  if (settings.mode === 'room') {
    if (net?.hosting) {
      begin(state.game.moves.length ? rematch(match) : match);
      net.publish();
      afterChange();
    } else if (state.game.over) {
      net?.propose({ kind: 'rematch' });
    }
    return;
  }
  newMatch();
  afterChange();
});
undoEl.addEventListener('click', () => {
  if (settings.mode === 'room') return;
  stopBot();
  const n = settings.mode === 'bot' ? undoPlies(state, { me: SOLO, bots: [BOT] }) : 1;
  if (!n) return;
  playUi('toggleOff');
  match = undoMatch(match, n);
  rederive();
  
  reportGate.begin(match.seats);
  afterChange();
});


const codeOf = (id) => String(id ?? '').replace(/^fgo-/i, '').toUpperCase();

function adopt(incoming, meta = {}) {
  if (!incoming.seats.length) return;
  
  
  
  let rolledBack = false;
  if (echo) {
    const { at, index } = echo;
    if (incoming.moves.length > index) {
      rolledBack = incoming.moves[index] !== at;
      clearEcho();
    } else if (meta?.nack) {
      rolledBack = true;
      clearEcho();
    } else if (incoming.moves.length < index) {
      clearEcho(); 
    } else if (applyAction(replayMatch(incoming), { kind: 'move', at, by: me() }).at === undefined) {
      rolledBack = true; 
      clearEcho();
    } else {
      echo.base = incoming;
      incoming = withMove(incoming, at);
    }
  }
  const fresh = incoming.moves.length === 0;
  const before = match;
  match = incoming;
  rederive();
  if (fresh && (before?.moves?.length || !before)) { reportGate.begin(match.seats); startedAt = Date.now(); }
  else if (fresh) reportGate.begin(match.seats);
  settings.rules = match.rules;
  pending = -1;
  
  if (incoming.moves.length && before && incoming.moves.length > before.moves.length) {
    const at = incoming.moves[incoming.moves.length - 1];
    if (stoneSound(at) === 'stoneThem') sfx.play('stoneThem');
  }
  if (rolledBack) rollBack();
  afterChange();
}

function onProposal(action, from) {
  if (action.kind === 'rematch') {
    if (state.game.over) { begin(rematch(match)); net.publish(); afterChange(); }
    return;
  }
  const check = applyAction(state, action);
  
  
  
  if (check.error) { net?.refuse(from); return; }
  commit(check.at);
}

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => match,
    onMatch: adopt,
    onProposal,
    onPeers: (peers, id) => {
      room.peers = peers;
      
      presence.sync();
      if (id) room.me = id;
      if (id && net?.hosting) room.code = codeOf(id);
      if (net?.hosting && room.me && match.seats[0] === HOST && !match.moves.length) {
        
        
        match = { ...match, seats: [room.me, match.seats[1]] };
        rederive();
        reportGate.begin(match.seats);
      }
      draw();
    },
    onArrival: (who) => {
      const seats = seatsWith(match.seats, who, match.moves.length > 0);
      if (seats !== match.seats) {
        match = { ...match, seats };
        rederive();
        reportGate.begin(match.seats);
        startedAt = Date.now();
      }
    },
    
    
    onUnseat: (who) => {
      if (match.moves.length || !match.seats.includes(who)) return;
      match = { ...match, seats: match.seats.map((s) => (s === who ? GUEST : s)) };
      rederive();
      reportGate.begin(match.seats);
    },
    onStatus: (kind) => {
      if (kind === 'open') say(T.waiting);
      else if (kind === 'joined' && !room.watching) say(T.joined);
      else if (kind === 'failed') { say(T.badCode, 4000); }
      
      else if (kind === 'host' && net?.hosting && echo) { clearEcho(); net.publish(); }
      draw();
    },
  });
  return net;
}

function openRoom() {
  if (!canPlayTogether()) { say(T.noRooms, 4000); return; }
  room.active = true;
  begin(createMatch({ seats: [HOST, GUEST], rules: settings.rules }));
  startNet().host();
  afterChange();
}

function joinRoom(code, { watch = false } = {}) {
  if (!canPlayTogether()) { say(T.noRooms, 4000); return false; }
  const out = startNet().join(code, { watch });
  if (out?.error) { net = null; say(T.badCode, 4000); return false; }
  room.active = true;
  room.watching = watch;
  room.code = codeOf(code);
  begin(createMatch({ seats: [GUEST, GUEST], rules: settings.rules }));
  afterChange();
  return true;
}

function leaveRoom() {
  presence.withdraw();
  try { net?.leave(); } catch {  }
  net = null;
  Object.assign(room, { active: false, me: null, peers: [], code: null, watching: false });
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
  newMatch();
  afterChange();
});
$('copy-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = shareLinkFor(base, net.hosting ? net.id : `fgo-${room.code}`, {});
  
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') say(T.copied);
      else if (res?.via === 'manual') say(res.url, 8000);
    }, () => say(link, 8000));
});


$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fgo-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') say(T.watchCopied);
      else if (res?.via === 'manual') say(res.url, 8000);
    }, () => say(link, 8000));
});


drawGrid();
boardEl.append(layer);
wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });

foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Gomowise' });




const linkRoom = roomFromHref(location.href);


afterBoot(() => countPlay('gomoku', { isHost: !linkRoom }));




const boardWrap = document.querySelector('.gm-board-wrap');
fit = fitScreen({
  last: () => [boardWrap, document.querySelector('.gm-foot')],
  apply: (s) => { boardWrap.style.setProperty('--gm-fit', String(s)); },
  min: 0.4,
});

if (linkRoom) {
  settings.mode = 'room';
  newMatch();
  if (!joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH })) draw();
} else {
  newMatch();
  
  const cheat = (params.get('moves') ?? '').split(',').map((s) => fromCoord(s)).filter((i) => i >= 0);
  if (cheat.length) {
    match = { ...match, moves: cheat };
    rederive();
    match = { ...match, moves: state.game.moves.slice() };
    reportGate.settle();
  }
  afterChange();
}

fit.refit({ grow: true });
bootDone();

trackEvent('game_start', { game: GAME_ID, mode: settings.mode, rules: settings.rules });



globalThis.gomowise = Object.freeze({
  mode: () => settings.mode,
  rules: () => state.game.rules,
  moves: () => state.game.moves.map((i) => toCoord(i)),
  over: () => state.game.over,
  winner: () => (state.game.winner === BLACK ? 'black' : state.game.winner === WHITE ? 'white' : null),
  status: () => statusEl.textContent,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: [...state.seats], watchers: net?.watchers ?? 0 }),
  pointRect: (coord) => {
    const i = fromCoord(coord);
    const [x, y] = xy(i);
    const ctm = boardEl.getScreenCTM();
    const p = new DOMPoint(x, y).matrixTransform(ctm);
    return { x: p.x + scrollX, y: p.y + scrollY };
  },
  colourOfSeat,
});
