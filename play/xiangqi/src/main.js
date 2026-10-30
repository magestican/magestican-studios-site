

























import {
  createMatch, act, actorId, viewForPeer, echoView, seatsWith, isBot, botLevel, COLORS, positionOf,
} from '../../../web-engine/xiangqi/xiangqiMatch.js';
import {
  START_FEN, parseFen, toFen, legalMoves, moveToIccs, inCheck, typeOf, ownerOf, sqName, sqFromName, SIZE,
} from '../../../web-engine/xiangqi/xiangqiRules.js';
import { chooseMove, LEVELS, seededRng } from '../../../web-engine/xiangqi/xiangqiBot.js';
import { applyGameName, gameLang, localGameName } from '../../../web-engine/i18n/gameNames.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { playUi } from '../../../web-engine/brand/uiSound.js';
import { reportMatch } from '../../../web-engine/progress/report.js';
import { CARDS, deviceId } from '../../../web-engine/progress/peerCards.js';
import { twoSeatMatch, createReportGate } from '../../../web-engine/progress/matchArgs.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { shareLinkFor } from '../../../web-engine/words/coop.js';
import { ROLE, roomFromHref, watchLinkFor } from '../../../web-engine/net/watchers.js';
import { roomPresence } from '../../shared/net/roomPresence.js';
import { foldSetup } from '../../shared/ui/setupFold.js';
import { mountPlayAgain } from '../../shared/ui/playAgain.js';
import { mountLevelScene } from '../../shared/ui/levelScene.js';
import { fitScreen, bootDone, afterBoot } from '../../shared/ui/fitScreen.js';
import { PACE, rectOf, wait, reducedMotion } from '../../shared/ui/cardFlight.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, glyphFor, pieceName, riverFor } from './strings.js';
import { guideFor } from './guide.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'xiangqi';
const SETTINGS_KEY = 'xiangqiwise-settings-v1';
const SOLO = 'you';
const HOST = 'host';
const SLIDE_MS = 320;
const BANNER_MS = 1300;


const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const TRAY_ORDER = ['R', 'C', 'N', 'B', 'A', 'P'];

const lang = gameLang(undefined, undefined, undefined, { zh: true });
const T = stringsFor(lang);
applyGameName(GAME_ID, document, lang);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Xiangqiwise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const boardEl = $('board');
const bannerEl = $('banner');
const roomEl = $('room');
const again = mountPlayAgain({ anchor: $('table'), source: $('new-game') });


const fit = fitScreen({
  last: () => [$('board'), $('tray-me')],
  apply: (s) => { $('table').style.setProperty('--fit', String(s)); },
  min: 0.6,
});
mountLevelScene({ levels: ['easy', 'medium', 'hard'] });

$('music-btn').hidden = true;


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
$('table').setAttribute('aria-label', T.boardLabel);
const GAME_NAME = localGameName(GAME_ID, lang);
const RIVER = riverFor(lang);


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };
const params = new URLSearchParams(location.search);
const saved = load(SETTINGS_KEY, null) || {};
const pick = (v, list, d) => (list.includes(v) ? v : d);
const settings = {
  mode: 'bot',
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'easy')),
  side: pick(params.get('side'), ['r', 'b'], pick(saved.side, ['r', 'b'], 'r')),
  
  guide: params.has('guide') ? params.get('guide') !== '0' : (typeof saved.guide === 'boolean' ? saved.guide : !lang.startsWith('zh')),
};
const persist = () => save(SETTINGS_KEY, { level: settings.level, side: settings.side, guide: settings.guide });


const startParam = (() => {
  const raw = params.get('fen');
  if (!raw) return START_FEN;
  try { return toFen(parseFen(raw.replace(/_/g, ' '))); } catch { return START_FEN; }
})();
const seedParam = params.get('seed');


let match = null;   
let view = null;    
let pos = null;     
let posKey = '';
let startCounts = null; 
let net = null;
let selected = null; 
let botBusy = false;
let botGen = 0;
let waitingAnswer = false;
let confirmedView = null;
let echoTimer = null;
const ECHO_TIMEOUT_MS = 8000;
let lastFlash = '';
let finishedGame = -1;
let gameNo = 0;
let queuedArrivals = [];
const room = { active: false, me: null, peers: [], code: null, watching: false };
const presence = roomPresence({
  game: 'xiangqi', 
  net: () => net,
  players: () => new Set([room.me, ...room.peers].filter(Boolean)).size || 1,
  ids: () => [room.me, ...room.peers].filter(Boolean),
});
const reportGate = createReportGate();
let startedAt = Date.now();

const isGuest = () => settings.mode === 'room' && room.active && net && !net.hosting;
const myId = () => (settings.mode === 'room' ? (room.me ?? HOST) : SOLO);
const watcher = () => settings.mode === 'room' && room.active
  && (room.watching || (isGuest() && !!view && view.you < 0));

const myColor = () => (view && view.you >= 0 ? COLORS[view.you] : 'r');
const flipped = () => myColor() === 'b';


let worker = null;
try {
  worker = new Worker(new URL('../../../web-engine/xiangqi/xiangqiWorker.js', import.meta.url), { type: 'module' });
} catch { worker = null; }
const botRng = seedParam !== null ? seededRng(Number(seedParam) || 1) : Math.random;
function askBot(fen, level) {
  const seed = Math.floor(botRng() * 2 ** 31) + 1;
  if (worker) {
    return new Promise((resolve) => {
      const id = seed;
      const onMsg = (e) => {
        if (e.data?.id !== id) return;
        worker.removeEventListener('message', onMsg);
        resolve(e.data.mv);
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ fen, level, seed, id });
    });
  }
  return wait(30).then(() => {
    const m = chooseMove(parseFen(fen), { level, rng: seededRng(seed) });
    return m ? moveToIccs(m) : null;
  });
}


function begin(m) {
  match = m;
  gameNo += 1;
  reportGate.begin(match.seats);
  startedAt = Date.now();
  lastFlash = '';
  selected = null;
  traySeen.ready = false;
  refresh();
}

function soloSeats() {
  const bot = `bot:${settings.level}#1`;
  return settings.side === 'r' ? [SOLO, bot] : [bot, SOLO];
}

function newMatch() {
  botGen += 1;
  const seats = settings.mode === 'room' ? [myId(), ''] : soloSeats();
  begin(createMatch({ seats, startFen: startParam }));
}

function countPieces(board) {
  const n = {};
  for (const p of board) if (p) n[p] = (n[p] || 0) + 1;
  return n;
}

function syncPos() {
  if (!view) { pos = null; posKey = ''; startCounts = null; return; }
  const key = `${view.startFen}|${view.moves.join(' ')}`;
  if (key === posKey) return;
  pos = match && !isGuest() && !confirmedView && view.moves.length === match.moves.length ? match.pos : positionOf(view);
  startCounts = countPieces(parseFen(view.startFen).board);
  posKey = key;
}


function refresh(before = null) {
  if (!match) return;
  view = viewForPeer(match, myId());
  if (net?.hosting) net.publish();
  show(before);
  maybeBot();
}

function show(before) {
  syncPos();
  draw();
  const anim = before ? animate(before) : Promise.resolve();
  anim.then(() => announce(before)).catch(() => {});
  if (view?.result) finished();
}

function maybeBot() {
  if (!match || match.result) return;
  const id = actorId(match);
  if (!isBot(id) || botBusy) return;
  botBusy = true;
  const gen = botGen;
  const fen = toFen(match.pos);
  draw();
  Promise.all([askBot(fen, botLevel(id)), wait(PACE.think * 0.6)]).then(([mv]) => {
    botBusy = false;
    if (gen !== botGen || !match || match.result || actorId(match) !== id) return;
    const before = snapshot();
    if (!mv || !act(match, id, { type: 'move', mv })) {
      act(match, id, { type: 'resign' });
      refresh();
      return;
    }
    sound(before, mv);
    refresh(before);
  });
}


function sound(before, mv) {
  const took = before?.board && before.board[sqFromName(mv.slice(2, 4))];
  playUi(took ? 'tap' : 'toggleOn');
}


function doAction(a) {
  if (!view || watcher()) return;
  selected = null;
  if (isGuest()) {
    if (waitingAnswer) return;
    waitingAnswer = true;
    const before = snapshot();
    const echo = echoView(view, a);
    if (echo) { confirmedView = view; view = echo; }
    if (echoTimer) clearTimeout(echoTimer);
    echoTimer = setTimeout(echoTimedOut, ECHO_TIMEOUT_MS);
    net.propose(a);
    if (a.mv) sound(before, a.mv);
    show(echo ? before : null);
    return;
  }
  const before = snapshot();
  if (!act(match, myId(), a)) { playUi('error'); draw(); return; }
  if (a.mv) sound(before, a.mv);
  refresh(a.mv ? before : null);
}

function clearEcho() {
  if (echoTimer) clearTimeout(echoTimer);
  echoTimer = null;
  confirmedView = null;
}

function echoTimedOut() {
  echoTimer = null;
  if (!waitingAnswer) return;
  if (confirmedView) view = confirmedView;
  clearEcho();
  waitingAnswer = false;
  playUi('error');
  flash(T.refused, 3200);
  syncPos();
  draw();
}


function seatName(s) {
  if (!view) return '';
  if (s === view.you) return T.you;
  const id = view.seats[s];
  if (view.you < 0) {
    const p = fill(T.playerN, { n: s + 1 });
    return isBot(id) ? `${p} (${T.bot})` : p;
  }
  return isBot(id) ? T.bot : T.friendName;
}

function resultText() {
  const r = view?.result;
  if (!r) return '';
  const winner = r.winner === null ? null : r.winner;
  const loser = winner === null ? null : 1 - winner;
  switch (r.reason) {
    case 'checkmate':
      if (view.you >= 0) return winner === view.you ? T.youWin : fill(T.youLose, { who: seatName(winner) });
      return fill(T.mateBy, { who: seatName(winner) });
    case 'stalemate': return fill(T.stalemate, { who: seatName(loser) });
    case 'resign': return fill(T.resigned, { who: seatName(loser) });
    case 'perpetualCheck': return fill(T.perpetual, { who: seatName(loser) });
    case 'repetition': return T.repetition;
    case 'idle': return T.idle;
    case 'moveCap': return T.moveCap;
    default: return '';
  }
}

let flashTimer = null;
function flash(text, ms = 2600) {
  flashEl.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashEl.textContent = lastFlash; }, ms);
}

let bannerTimer = null;
function banner(text, kind = '') {
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerEl.textContent = text;
  bannerEl.className = `xq-banner ${kind}`;
  bannerEl.hidden = false;
  bannerTimer = setTimeout(() => { bannerEl.hidden = true; }, view?.result ? BANNER_MS * 2.2 : BANNER_MS);
}


function announce(before) {
  if (!view || !pos) return;
  if (view.result) {
    lastFlash = resultText();
    flashEl.textContent = lastFlash;
    const won = view.result.winner !== null && view.result.winner === view.you;
    banner(lastFlash, won ? 'win' : view.result.winner === null ? 'none' : '');
    return;
  }
  if (before && inCheck(pos, pos.turn)) banner(T.check, 'check');
}


function finished() {
  if (!view?.result || finishedGame === gameNo) return;
  finishedGame = gameNo;
  const me = view.you;
  if (me < 0) return;
  const w = view.result.winner;
  const result = w === null ? 'draw' : w === me ? 'won' : 'lost';
  playUi(result === 'won' ? 'toggleOn' : 'toggleOff');
  const turn = reportGate.take();
  if (turn) {
    const arg = twoSeatMatch({
      game: GAME_ID, seats: [view.seats[me], view.seats[1 - me]], me: view.seats[me], result,
      isBot: (id) => isBot(id) || !id, cardFor: (id) => CARDS.get(id), online: settings.mode === 'room',
      startSeats: turn.startSeats ? [turn.startSeats[me], turn.startSeats[1 - me]] : undefined,
      myDev: deviceId(), hosting: !!net?.hosting, seconds: (Date.now() - startedAt) / 1000,
    });
    if (arg) reportMatch(arg).catch(() => {});
  }
  trackEvent('xiangqi_finished', { mode: settings.mode, level: settings.level, side: settings.side, result,
    reason: view.result.reason, moves: view.moves.length });
}



const sqOfCell = (cell) => (flipped() ? SIZE - 1 - cell : cell);

function legalNow() {
  if (!pos || !view || view.result || watcher() || view.you < 0) return [];
  if (COLORS[view.you] !== pos.turn || waitingAnswer) return [];
  if (settings.mode === 'bot' && botBusy) return [];
  return legalMoves(pos);
}


function guideMarks(p, sq) {
  const s = flipped() ? -1 : 1;
  return guideFor(p, sq).map(({ kind, dr, dc }) => {
    const dx = dc * s;
    const dy = dr * s;
    if (kind === 'slide') {
      const rot = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
      return `<i class="xq-bar" style="--dx:${dx * 1.6};--dy:${dy * 1.6};--rot:${rot}deg"></i>`;
    }
    
    const k = kind === 'jump' ? 0.8 : 1.6;
    return `<i class="xq-dot${kind === 'jump' ? ' xq-jump' : ''}" style="--dx:${dx * k};--dy:${dy * k}"></i>`;
  }).join('');
}

function pieceEl(p, { sq = -1, small = false } = {}) {
  const el = document.createElement('span');
  const type = typeOf(p);
  const color = ownerOf(p);
  el.className = `xq-piece xq-${type} ${color === 'r' ? 'red' : 'black'} ${color === myColor() ? 'mine' : 'theirs'}`;
  el.dataset.piece = p;
  el.innerHTML = `<span class="xq-glyph">${glyphFor(type, color, lang)}</span>${settings.guide && !small && sq >= 0 ? guideMarks(p, sq) : ''}`;
  return el;
}


function linesSvg() {
  const L = (x1, y1, x2, y2, cls = 'grid') => `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const parts = ['<rect class="frame" x="0.5" y="0.5" width="8" height="9"/>'];
  for (let r = 1; r < 9; r += 1) parts.push(L(0.5, r + 0.5, 8.5, r + 0.5));
  for (let c = 1; c < 8; c += 1) parts.push(L(c + 0.5, 0.5, c + 0.5, 4.5), L(c + 0.5, 5.5, c + 0.5, 9.5));
  parts.push(L(3.5, 0.5, 5.5, 2.5), L(5.5, 0.5, 3.5, 2.5), L(3.5, 7.5, 5.5, 9.5), L(5.5, 7.5, 3.5, 9.5));
  
  const marks = [[2, 1], [2, 7], [7, 1], [7, 7], ...[3, 6].flatMap((r) => [0, 2, 4, 6, 8].map((c) => [r, c]))];
  const g = 0.07;
  const a = 0.17;
  for (const [r, c] of marks) {
    const x = c + 0.5;
    const y = r + 0.5;
    for (const sx of [-1, 1]) {
      if ((c === 0 && sx < 0) || (c === 8 && sx > 0)) continue;
      for (const sy of [-1, 1]) {
        const px = x + sx * g;
        const py = y + sy * g;
        parts.push(`<path class="mark" d="M${px + sx * a} ${py} H${px} V${py + sy * a}"/>`);
      }
    }
  }
  return `<svg class="xq-lines" viewBox="0 0 9 10" preserveAspectRatio="none" aria-hidden="true">${parts.join('')}</svg>`
    + `<div class="xq-river" aria-hidden="true"><span>${RIVER[0]}</span><span>${RIVER[1]}</span></div>`;
}
const LINES = linesSvg();

function drawCoords() {
  const label = (color, i) => {
    
    const bottom = color === myColor();
    const n = bottom ? 9 - i : i + 1;
    return color === 'r' ? CN_NUM[n - 1] : String(n);
  };
  const row = (color) => Array.from({ length: 9 }, (_, i) => `<span>${label(color, i)}</span>`).join('');
  $('files-bottom').innerHTML = row(myColor());
  $('files-top').innerHTML = row(myColor() === 'r' ? 'b' : 'r');
}

function lastMoveSquares() {
  if (!view?.moves.length) return [];
  const u = view.moves[view.moves.length - 1];
  return [sqFromName(u.slice(0, 2)), sqFromName(u.slice(2, 4))];
}

function drawBoard(legal) {
  boardEl.innerHTML = LINES;
  if (!pos) return;
  const targets = new Set();
  if (selected) for (const m of legal) if (m.from === selected.from) targets.add(m.to);
  const movable = new Set(legal.map((m) => m.from));
  const last = new Set(lastMoveSquares());
  const kingInCheck = inCheck(pos, pos.turn) ? pos.kings[pos.turn] : -1;
  let inked = 0;
  for (let cell = 0; cell < SIZE; cell += 1) {
    const sq = sqOfCell(cell);
    const p = pos.board[sq];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'xq-pt';
    b.dataset.sq = String(sq);
    b.setAttribute('role', 'gridcell');
    if (last.has(sq)) b.classList.add('last');
    if (sq === kingInCheck) b.classList.add('check');
    if (selected && selected.from === sq) b.classList.add('sel');
    if (targets.has(sq)) {
      b.classList.add('target');
      if (p) b.classList.add('capture');
      
      b.style.setProperty('--i', String(Math.min(inked++, 12)));
    }
    if (movable.has(sq)) b.classList.add('movable');
    const name = sqName(sq);
    b.setAttribute('aria-label', p ? fill(T.pieceOn, { piece: pieceName(T, typeOf(p)), sq: name }) : fill(T.emptySq, { sq: name }));
    if (p) b.append(pieceEl(p, { sq }));
    if (view?.echo && lastMoveSquares().at(-1) === sq) b.classList.add('echo');
    b.addEventListener('click', () => onPoint(sq, legal));
    boardEl.append(b);
  }
}


const traySeen = { r: {}, b: {}, ready: false };


function drawTray(el, color) {
  el.textContent = '';
  if (!pos || !startCounts) return;
  const seat = COLORS.indexOf(color);
  const head = document.createElement('div');
  head.className = 'xq-tray-head';
  head.textContent = fill(T.taken, { who: seatName(seat) });
  el.classList.toggle('turn', pos.turn === color && !view?.result);
  el.append(head);
  const row = document.createElement('div');
  row.className = 'xq-tray-row';
  const now = countPieces(pos.board);
  const seen = {};
  for (const t of TRAY_ORDER) {
    const p = color === 'r' ? t.toLowerCase() : t; 
    const gone = Math.max(0, (startCounts[p] || 0) - (now[p] || 0));
    seen[p] = gone;
    for (let i = 0; i < gone; i += 1) {
      const piece = pieceEl(p, { small: true });
      piece.setAttribute('role', 'img');
      piece.setAttribute('aria-label', pieceName(T, t));
      if (traySeen.ready && i >= (traySeen[color][p] || 0)) piece.classList.add('fresh');
      row.append(piece);
    }
  }
  el.append(row);
  traySeen[color] = seen;
}

function statusText() {
  if (!view || !pos) return T.loading;
  if (view.result) return resultText();
  const turnSeat = COLORS.indexOf(pos.turn);
  
  if (view.you >= 0 && turnSeat === view.you) return `${T.yourTurn.replace(/[.。]$/, '')} · ${fill(T.moveN, { n: view.moves.length + 1 })}`;
  const who = seatName(turnSeat);
  const id = view.seats[turnSeat];
  if (isBot(id) && botBusy) return fill(T.thinking, { who });
  return fill(T.turnOf, { who });
}

function draw() {
  const watching = watcher();
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  $('watch-link').hidden = !room.active || watching;
  const w = $('watchers');
  const n = net?.watchers ?? 0;
  w.hidden = !room.active || n < 1;
  if (n > 0) w.textContent = fill(T.watchers, { n });
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  for (const b of document.querySelectorAll('[data-side]')) {
    b.setAttribute('aria-pressed', String(b.dataset.side === settings.side));
    b.hidden = settings.mode === 'room';
  }
  $('guide').setAttribute('aria-pressed', String(settings.guide));
  document.documentElement.dataset.flip = flipped() ? '1' : '0';
  const legal = legalNow();
  if (selected && !legal.some((m) => m.from === selected.from)) selected = null;
  drawCoords();
  drawBoard(legal);
  drawTray($('tray-me'), myColor());
  drawTray($('tray-them'), myColor() === 'r' ? 'b' : 'r');
  traySeen.ready = !!pos;
  statusEl.textContent = watching && view ? `${T.watching} ${statusText()}` : statusText();
  $('resign').hidden = !view || !!view.result || view.you < 0 || watching;
  $('new-game').hidden = watching;
  again.update(!!view?.result && !watching);
}


function onPoint(sq, legal) {
  if (!legal.length) return;
  if (selected) {
    const m = legal.find((o) => o.from === selected.from && o.to === sq);
    if (m) { doAction({ type: 'move', mv: moveToIccs(m) }); return; }
  }
  const p = pos.board[sq];
  if (p && ownerOf(p) === pos.turn && legal.some((m) => m.from === sq)) {
    selected = selected?.from === sq ? null : { from: sq };
    playUi('tap');
  } else selected = null;
  draw();
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selected) { selected = null; draw(); }
});



function snapshot() {
  const points = {};
  for (const b of boardEl.querySelectorAll('.xq-pt')) points[b.dataset.sq] = rectOf(b);
  return { points, n: view ? view.moves.length : 0, flip: flipped(), board: pos ? pos.board.slice() : null };
}

function pinnedPiece(p, rect) {
  const el = pieceEl(p, { small: true });
  Object.assign(el.style, { position: 'fixed', left: `${rect.x + rect.w * 0.06}px`, top: `${rect.y + rect.h * 0.06}px`, width: `${rect.w * 0.88}px`, height: `${rect.h * 0.88}px`, zIndex: '9998', pointerEvents: 'none', margin: '0' });
  el.style.setProperty('--cell', `${rect.w}px`);
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  return el;
}

async function animate(before) {
  if (!view || !before || view.moves.length !== before.n + 1 || before.flip !== flipped()) return;
  if (reducedMotion()) { await wait(PACE.settle); return; }
  const mv = view.moves[view.moves.length - 1];
  const to = sqFromName(mv.slice(2, 4));
  const target = boardEl.querySelector(`[data-sq="${to}"] .xq-piece`);
  if (!target) return;
  const toRect = rectOf(target.parentElement);
  const color = ownerOf(pos.board[to]);
  const fromRect = before.points[String(sqFromName(mv.slice(0, 2)))];
  const flights = [];
  
  const captured = before.board && before.board[to];
  if (captured) {
    const ghost = pinnedPiece(captured, toRect);
    const trayRect = color === myColor() ? rectOf($('tray-me')) : rectOf($('tray-them'));
    const dx = trayRect.x + trayRect.w / 2 - (toRect.x + toRect.w / 2);
    const dy = trayRect.y + trayRect.h / 2 - (toRect.y + toRect.h / 2);
    flights.push(ghost.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.6) rotate(200deg)`, opacity: 0.2 },
    ], { duration: SLIDE_MS + 160, easing: 'ease-in', delay: SLIDE_MS * 0.5 }).finished.catch(() => {}).then(() => ghost.remove()));
  }
  if (fromRect) {
    const dx = fromRect.x - toRect.x;
    const dy = fromRect.y - toRect.y;
    target.style.zIndex = '5';
    flights.push(target.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(1.1)` },
      { transform: 'translate(0, 0) scale(1)' },
    ], { duration: SLIDE_MS, easing: 'cubic-bezier(.2,.7,.2,1)' }).finished.catch(() => {}));
  }
  await Promise.all(flights);
  target.style.zIndex = '';
  target.parentElement.classList.add('landed');
}


for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    if (mode === settings.mode) return;
    playUi('toggleOn');
    if (settings.mode === 'room') leaveRoom();
    settings.mode = mode;
    botGen += 1;
    if (mode === 'bot') newMatch();
    else { match = null; view = null; pos = null; posKey = ''; draw(); }
  });
}
for (const b of document.querySelectorAll('[data-level]')) {
  b.addEventListener('click', () => {
    settings.level = b.dataset.level;
    persist();
    playUi('toggleOn');
    if (settings.mode === 'bot') newMatch();
    else if (match && !isGuest()) {
      match.seats = match.seats.map((s) => (isBot(s) ? `bot:${settings.level}#1` : s));
      refresh();
    }
  });
}
for (const b of document.querySelectorAll('[data-side]')) {
  b.addEventListener('click', () => {
    if (settings.mode !== 'bot' || b.dataset.side === settings.side) return;
    settings.side = b.dataset.side;
    persist();
    playUi('toggleOn');
    newMatch();
  });
}
$('guide').addEventListener('click', () => {
  settings.guide = !settings.guide;
  persist();
  playUi(settings.guide ? 'toggleOn' : 'toggleOff');
  draw();
});
let resignArmed = null;
$('resign').addEventListener('click', () => {
  if (!view || view.result || view.you < 0) return;
  
  if (!resignArmed) {
    $('resign').textContent = `${T.resign}?`;
    resignArmed = setTimeout(() => { resignArmed = null; $('resign').textContent = T.resign; }, 3000);
    return;
  }
  clearTimeout(resignArmed);
  resignArmed = null;
  $('resign').textContent = T.resign;
  doAction({ type: 'resign' });
});
$('new-game').addEventListener('click', () => {
  if (watcher()) return;
  playUi('tap');
  if (isGuest()) { net.propose({ type: 'rematch' }); return; }
  if (match && settings.mode === 'room') { restartRoom(); return; }
  if (settings.mode === 'room') { flash(T.waiting); return; }
  newMatch();
});
let resizeTimer = null;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(draw, 80); });

function restartRoom(seats = match.seats) {
  botGen += 1;
  begin(createMatch({ seats, startFen: startParam }));
}


const codeOf = (id) => String(id ?? '').replace(/^fxq-/i, '').toUpperCase();
const freshMatch = (m) => m.moves.length === 0 && !m.result;

function onProposal(action, from) {
  if (!match) return;
  if (action.type === 'rematch') {
    if (match.result) restartRoom(); else net?.publish();
    return;
  }
  const before = snapshot();
  if (!act(match, from, action)) { net?.refuse(from); return; }
  if (action.mv) sound(before, action.mv);
  refresh(action.mv ? before : null);
}

function onView(v, meta = {}) {
  const real = confirmedView ?? view;
  const echoed = !!confirmedView;
  const before = snapshot();
  if (echoed && real) before.n = real.moves.length;
  clearEcho();
  waitingAnswer = false;
  if (echoed && meta?.nack) { playUi('error'); flash(T.refused, 3200); }
  if (!real || v.moves.length < real.moves.length || (real.result && !v.result)) {
    gameNo += 1;
    reportGate.begin(v.seats);
    startedAt = Date.now();
    lastFlash = '';
  }
  view = v;
  
  const animateIt = real && v.moves.length === real.moves.length + 1 && !(echoed && v.moves.at(-1) === real.moves.at(-1));
  show(animateIt ? before : null);
}

function startNet() {
  if (net) return net;
  net = createNet({
    viewFor: (peer) => (match ? viewForPeer(match, peer) : null),
    onView: (raw, meta) => onView(raw, meta),
    onProposal,
    onPeers: (peers, id) => {
      room.peers = peers;
      presence.sync();
      if (id) room.me = id;
      if (id && net?.hosting) room.code = codeOf(id);
      if (net?.hosting && room.me && match && match.seats[0] === HOST) {
        match.seats = [room.me, match.seats[1]];
        reportGate.begin(match.seats);
        refresh();
        return;
      }
      draw();
    },
    onArrival: (who) => {
      if (!match) return;
      if (freshMatch(match) || match.seats.includes('')) {
        const seats = seatsWith(match.seats, who, false);
        if (seats !== match.seats) { restartRoom(seats); return; }
      } else {
        queuedArrivals.push(who);
        flash(T.seatNext, 4000);
      }
      net?.publish();
    },
    onDeparture: (who) => {
      if (!match) return;
      queuedArrivals = queuedArrivals.filter((x) => x !== who);
      if (match.seats.indexOf(who) === 1) {
        
        match.seats = [match.seats[0], `bot:${settings.level}#1`];
        refresh();
      }
    },
    onUnseat: (who) => {
      if (!match) return;
      queuedArrivals = queuedArrivals.filter((x) => x !== who);
      if (match.seats.indexOf(who) !== 1) return;
      if (freshMatch(match)) { restartRoom([match.seats[0], '']); return; }
      match.seats = [match.seats[0], `bot:${settings.level}#1`];
      refresh();
    },
    onStatus: (kindName, detail) => {
      if (kindName === 'open') flash(T.waiting, 4000);
      else if (kindName === 'joined' && !room.watching) flash(T.joined);
      else if (kindName === 'failed') flash(T.badCode, 4000);
      else if (kindName === 'host' && detail?.iAmHost && view && !match) {
        
        
        const seats = view.seats.map((s) => (s === detail.previousHost || !s ? `bot:${settings.level}#1` : s));
        const m = createMatch({ seats, startFen: view.startFen });
        for (const mv of view.moves) act(m, m.seats[COLORS.indexOf(m.pos.turn)], { type: 'move', mv });
        flash(T.hostLeft, 5000);
        botGen += 1;
        match = m;
        reportGate.begin(m.seats);
        refresh();
        return;
      }
      draw();
    },
  });
  return net;
}

function openRoom() {
  if (!canPlayTogether()) { flash(T.noRooms, 4000); return; }
  room.active = true;
  settings.mode = 'room';
  botGen += 1;
  begin(createMatch({ seats: [HOST, ''], startFen: startParam }));
  startNet().host();
}

function joinRoom(code, { watch = false } = {}) {
  if (!canPlayTogether()) { flash(T.noRooms, 4000); return false; }
  const out = startNet().join(code, { watch });
  if (out?.error) { net = null; flash(T.badCode, 4000); return false; }
  botGen += 1;
  settings.mode = 'room';
  room.watching = watch;
  room.active = true;
  room.code = codeOf(code);
  match = null;
  view = null;
  pos = null;
  posKey = '';
  draw();
  return true;
}

function leaveRoom() {
  presence.withdraw();
  try { net?.leave(); } catch {  }
  net = null;
  queuedArrivals = [];
  clearEcho();
  waitingAnswer = false;
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
  settings.mode = 'bot';
  newMatch();
});
$('copy-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = shareLinkFor(base, net.hosting ? net.id : `fxq-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});
$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fxq-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.watchCopied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Xiangqiwise' });
const linkRoom = roomFromHref(location.href);
afterBoot(() => countPlay(GAME_ID, { isHost: !linkRoom }));

function boot() {
  if (linkRoom) {
    settings.mode = 'room';
    if (!joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH })) { settings.mode = 'bot'; newMatch(); }
  } else newMatch();
  requestAnimationFrame(() => { fit.refit({ grow: true }); bootDone(); });
}
boot();

trackEvent('game_start', { game: GAME_ID, mode: settings.mode });



globalThis.xiangqiwise = Object.freeze({
  ready: () => !!view && !!pos,
  mode: () => settings.mode,
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  fen: () => (pos ? toFen(pos) : null),
  legal: () => legalNow().map(moveToIccs),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  over: () => !!view?.result,
  thinking: () => botBusy,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [], watchers: net?.watchers ?? 0, watcher: watcher() }),
  act: (mv) => doAction(mv === 'resign' ? { type: 'resign' } : { type: 'move', mv }),
  select: (sq) => { const n = typeof sq === 'string' ? sqFromName(sq) : sq; onPoint(n, legalNow()); },
});
