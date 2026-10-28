
























import {
  createMatch, act, actorId, viewForPeer, echoView, seatsWith, isBot, botLevel, COLORS, positionOf,
} from '../../../web-engine/shogi/shogiMatch.js';
import {
  START_SFEN, parseSfen, toSfen, legalMoves, moveToUsi, inCheck, MOVES, typeOf, ownerOf,
  HAND_ORDER, sqName, sqFromName,
} from '../../../web-engine/shogi/shogiRules.js';
import { chooseMove, LEVELS, seededRng } from '../../../web-engine/shogi/shogiBot.js';
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
import { stringsFor, fill, kanjiFor, pieceName } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'shogi';
const SETTINGS_KEY = 'shogiwise-settings-v1';
const SOLO = 'you';
const HOST = 'host';
const SLIDE_MS = 320;
const FLIP_MS = 160;
const BANNER_MS = 1300;
const RANK_KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];


const lang = gameLang(undefined, undefined, undefined, { zh: true });
const T = stringsFor(lang);
applyGameName(GAME_ID, document, lang);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Shogiwise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const boardEl = $('board');
const bannerEl = $('banner');
const promoteEl = $('promote');
const roomEl = $('room');
const again = mountPlayAgain({ anchor: $('table'), source: $('new-game') });


const fit = fitScreen({
  last: () => [$('board'), $('stand-me')],
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


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };
const params = new URLSearchParams(location.search);
const saved = load(SETTINGS_KEY, null) || {};
const pick = (v, list, d) => (list.includes(v) ? v : d);
const settings = {
  mode: 'bot',
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'easy')),
  side: pick(params.get('side'), ['b', 'w'], pick(saved.side, ['b', 'w'], 'b')),
  
  guide: params.has('guide') ? params.get('guide') !== '0' : (typeof saved.guide === 'boolean' ? saved.guide : lang !== 'ja'),
};
const persist = () => save(SETTINGS_KEY, { level: settings.level, side: settings.side, guide: settings.guide });



const startParam = (() => {
  const raw = /[?&]sfen=([^&]*)/.exec(location.search);
  if (!raw) return START_SFEN;
  try { return toSfen(parseSfen(decodeURIComponent(raw[1]).replace(/_/g, ' '))); } catch { return START_SFEN; }
})();
const seedParam = params.get('seed');
let seedCounter = Number(seedParam) || 0;
function freshSeed() {
  if (seedParam !== null) { seedCounter += 1; return seedCounter; }
  try { return crypto.getRandomValues(new Uint32Array(1))[0] || 1; } catch { return (Math.random() * 2 ** 32) >>> 0 || 1; }
}


let match = null;   
let view = null;    
let pos = null;     
let posKey = '';
let net = null;
let selected = null; 
let pendingPromo = null;
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
  game: 'shogi', 
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

const myColor = () => (view && view.you >= 0 ? COLORS[view.you] : 'b');
const flipped = () => myColor() === 'w';


let worker = null;
try {
  worker = new Worker(new URL('../../../web-engine/shogi/shogiWorker.js', import.meta.url), { type: 'module' });
} catch { worker = null; }
let botRng = seedParam !== null ? seededRng(Number(seedParam) || 1) : Math.random;
function askBot(sfen, level) {
  const seed = Math.floor(botRng() * 2 ** 31) + 1;
  if (worker) {
    return new Promise((resolve) => {
      const id = seed;
      const onMsg = (e) => {
        if (e.data?.id !== id) return;
        worker.removeEventListener('message', onMsg);
        resolve(e.data.usi);
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ sfen, level, seed, id });
    });
  }
  return wait(30).then(() => {
    const m = chooseMove(parseSfen(sfen), { level, rng: seededRng(seed) });
    return m ? moveToUsi(m) : null;
  });
}


function begin(m) {
  match = m;
  gameNo += 1;
  reportGate.begin(match.seats);
  startedAt = Date.now();
  lastFlash = '';
  selected = null;
  closePromo();
  refresh();
}

function soloSeats() {
  const bot = `bot:${settings.level}#1`;
  return settings.side === 'b' ? [SOLO, bot] : [bot, SOLO];
}

function newMatch() {
  botGen += 1;
  const seats = settings.mode === 'room' ? [myId(), ''] : soloSeats();
  begin(createMatch({ seats, startSfen: startParam }));
}

function syncPos() {
  if (!view) { pos = null; posKey = ''; return; }
  const key = `${view.startSfen}|${view.moves.join(' ')}`;
  if (key === posKey) return;
  pos = match && !isGuest() && !confirmedView && view.moves.length === match.moves.length ? match.pos : positionOf(view);
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
  const sfen = toSfen(match.pos);
  draw();
  Promise.all([askBot(sfen, botLevel(id)), wait(PACE.think * 0.6)]).then(([usi]) => {
    botBusy = false;
    if (gen !== botGen || !match || match.result || actorId(match) !== id) return;
    const before = snapshot();
    if (!usi || !act(match, id, { type: 'move', usi })) {
      act(match, id, { type: 'resign' });
      refresh();
      return;
    }
    sound(usi);
    refresh(before);
  });
}

function sound(usi) {
  playUi(usi.includes('*') ? 'tap' : 'toggleOn');
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
    if (a.usi) sound(a.usi);
    show(echo ? before : null);
    return;
  }
  const before = snapshot();
  if (!act(match, myId(), a)) { playUi('error'); draw(); return; }
  if (a.usi) sound(a.usi);
  refresh(a.usi ? before : null);
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
    case 'noMoves': return fill(T.noMoves, { who: seatName(loser) });
    case 'resign': return fill(T.resigned, { who: seatName(loser) });
    case 'perpetualCheck': return fill(T.perpetual, { who: seatName(loser) });
    case 'sennichite': return T.sennichite;
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
  bannerEl.className = `sg-banner ${kind}`;
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
  trackEvent('shogi_finished', { mode: settings.mode, level: settings.level, side: settings.side, result,
    reason: view.result.reason, moves: view.moves.length });
}



const cellOf = (sq) => (flipped() ? 80 - sq : sq);
const sqOfCell = (cell) => (flipped() ? 80 - cell : cell);

function legalNow() {
  if (!pos || !view || view.result || watcher() || view.you < 0) return [];
  if (COLORS[view.you] !== pos.turn || waitingAnswer) return [];
  if (settings.mode === 'bot' && botBusy) return [];
  return legalMoves(pos);
}


function guideMarks(type) {
  const mv = MOVES[type];
  const out = [];
  for (const [dr, dc] of mv.steps) out.push(`<i class="sg-dot" style="--dx:${dc};--dy:${dr}"></i>`);
  for (const [dr, dc] of mv.slides) {
    const rot = Math.round((Math.atan2(dc, -dr) * 180) / Math.PI);
    out.push(`<i class="sg-bar" style="--dx:${dc};--dy:${dr};--rot:${rot}deg"></i>`);
  }
  for (const [dr, dc] of mv.jumps || []) out.push(`<i class="sg-dot sg-jump" style="--dx:${dc};--dy:${dr / 2}"></i>`);
  return out.join('');
}

function pieceEl(p, { hand = false } = {}) {
  const el = document.createElement('span');
  const type = typeOf(p);
  const color = ownerOf(p);
  el.className = `sg-piece sg-${type.replace('+', 'p')} ${color === myColor() ? 'mine' : 'theirs'}${type[0] === '+' ? ' promoted' : ''}`;
  el.dataset.piece = p;
  
  
  el.innerHTML = `<span class="sg-face"><span class="sg-kanji">${kanjiFor(type, color)}</span>${settings.guide && !hand ? guideMarks(type) : ''}</span>`;
  return el;
}

function drawCoords() {
  const files = [];
  const ranks = [];
  for (let i = 0; i < 9; i += 1) {
    files.push(`<span>${flipped() ? i + 1 : 9 - i}</span>`);
    ranks.push(`<span>${RANK_KANJI[flipped() ? 8 - i : i]}</span>`);
  }
  $('files').innerHTML = files.join('');
  $('ranks').innerHTML = ranks.join('');
}

function lastMoveSquares() {
  if (!view?.moves.length) return [];
  const u = view.moves[view.moves.length - 1];
  return u.includes('*') ? [sqFromName(u.slice(2, 4))] : [sqFromName(u.slice(0, 2)), sqFromName(u.slice(2, 4))];
}

function drawBoard(legal) {
  boardEl.textContent = '';
  if (!pos) return;
  const targets = new Map();
  if (selected) {
    for (const m of legal) {
      const ok = selected.drop ? m.from === null && m.piece === selected.drop : m.from === selected.from;
      if (ok) targets.set(m.to, true);
    }
  }
  const movable = new Set(legal.filter((m) => m.from !== null).map((m) => m.from));
  const last = new Set(lastMoveSquares());
  const kingInCheck = inCheck(pos, pos.turn) ? pos.kings[pos.turn] : -1;
  for (let cell = 0; cell < 81; cell += 1) {
    const sq = sqOfCell(cell);
    const p = pos.board[sq];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sg-sq';
    b.dataset.sq = String(sq);
    b.setAttribute('role', 'gridcell');
    if (last.has(sq)) b.classList.add('last');
    if (sq === kingInCheck) b.classList.add('check');
    if (selected && selected.from === sq) b.classList.add('sel');
    if (targets.has(sq)) b.classList.add(p ? 'target capture' : 'target');
    if (movable.has(sq)) b.classList.add('movable');
    const name = sqName(sq);
    b.setAttribute('aria-label', p ? fill(T.pieceOn, { piece: pieceName(T, typeOf(p)), sq: name }) : fill(T.emptySq, { sq: name }));
    if (p) b.append(pieceEl(p));
    if (view?.echo && lastMoveSquares().at(-1) === sq) b.classList.add('echo');
    b.addEventListener('click', () => onSquare(sq, legal));
    boardEl.append(b);
  }
}

function drawStand(el, color, legal) {
  el.textContent = '';
  if (!pos) return;
  const seat = COLORS.indexOf(color);
  const head = document.createElement('div');
  head.className = 'sg-stand-head';
  head.textContent = fill(T.inHand, { who: seatName(seat) });
  if (pos.turn === color && !view?.result) el.classList.add('turn'); else el.classList.remove('turn');
  el.append(head);
  const row = document.createElement('div');
  row.className = 'sg-stand-row';
  const drops = new Set(legal.filter((m) => m.from === null).map((m) => m.piece));
  for (const t of HAND_ORDER) {
    const n = pos.hands[color][t];
    if (!n) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sg-handpiece';
    b.dataset.hand = `${color}${t}`;
    b.append(pieceEl(color === 'b' ? t : t.toLowerCase(), { hand: true }));
    if (n > 1) {
      const c = document.createElement('span');
      c.className = 'sg-count';
      c.textContent = `×${n}`;
      b.append(c);
    }
    b.setAttribute('aria-label', `${fill(T.dropOf, { piece: pieceName(T, t) })}${n > 1 ? ` ×${n}` : ''}`);
    if (color === myColor() && drops.has(t)) {
      b.classList.add('droppable');
      if (selected?.drop === t) b.classList.add('sel');
      b.addEventListener('click', () => {
        selected = selected?.drop === t ? null : { drop: t };
        playUi('tap');
        draw();
      });
    } else b.disabled = true;
    row.append(b);
  }
  el.append(row);
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
  if (selected && !legal.some((m) => (selected.drop ? m.piece === selected.drop && m.from === null : m.from === selected.from))) selected = null;
  drawCoords();
  drawBoard(legal);
  drawStand($('stand-me'), myColor(), legal);
  drawStand($('stand-them'), myColor() === 'b' ? 'w' : 'b', legal);
  statusEl.textContent = watching && view ? `${T.watching} ${statusText()}` : statusText();
  $('resign').hidden = !view || !!view.result || view.you < 0 || watching;
  $('new-game').hidden = watching;
  again.update(!!view?.result && !watching);
}


function onSquare(sq, legal) {
  if (!legal.length) return;
  if (selected) {
    const options = legal.filter((m) => m.to === sq && (selected.drop ? m.from === null && m.piece === selected.drop : m.from === selected.from));
    if (options.length === 1) { doAction({ type: 'move', usi: moveToUsi(options[0]) }); return; }
    if (options.length === 2) { askPromotion(options); return; }
  }
  const p = pos.board[sq];
  if (p && ownerOf(p) === pos.turn && legal.some((m) => m.from === sq)) {
    selected = selected?.from === sq ? null : { from: sq };
    playUi('tap');
  } else selected = null;
  draw();
}

function askPromotion(options) {
  pendingPromo = options;
  const row = $('promote-row');
  row.textContent = '';
  const base = pos.board[options[0].from];
  for (const promote of [true, false]) {
    const m = options.find((o) => o.promote === promote);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sg-btn sg-promo-btn';
    const shown = promote ? `+${base}` : base;
    b.append(pieceEl(shown, { hand: true }));
    const label = document.createElement('span');
    label.textContent = promote ? T.promoteYes : T.promoteNo;
    b.append(label);
    b.addEventListener('click', () => { closePromo(); doAction({ type: 'move', usi: moveToUsi(m) }); });
    row.append(b);
  }
  promoteEl.hidden = false;
  row.querySelector('button')?.focus();
}

function closePromo() {
  pendingPromo = null;
  promoteEl.hidden = true;
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pendingPromo) { closePromo(); selected = null; draw(); }
});



function snapshot() {
  const squares = {};
  for (const b of boardEl.querySelectorAll('.sg-sq')) squares[b.dataset.sq] = rectOf(b);
  const hands = {};
  for (const b of document.querySelectorAll('[data-hand]')) hands[b.dataset.hand] = rectOf(b);
  return { squares, hands, stands: { me: rectOf($('stand-me')), them: rectOf($('stand-them')) }, n: view ? view.moves.length : 0, flip: flipped(), board: pos ? pos.board.slice() : null };
}

function pinnedPiece(p, rect) {
  const el = pieceEl(p, { hand: true });
  Object.assign(el.style, { position: 'fixed', left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px`, zIndex: '9998', pointerEvents: 'none', margin: '0' });
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  return el;
}

async function animate(before) {
  if (!view || !before || view.moves.length !== before.n + 1 || before.flip !== flipped()) return;
  if (reducedMotion()) { await wait(PACE.settle); return; }
  const usi = view.moves[view.moves.length - 1];
  const drop = usi.includes('*');
  const to = sqFromName(usi.slice(2, 4));
  const target = boardEl.querySelector(`[data-sq="${to}"] .sg-piece`);
  if (!target) return;
  const toRect = rectOf(target.parentElement);
  const color = ownerOf(pos.board[to]);
  let fromRect;
  if (drop) fromRect = before.hands[`${color}${usi[0]}`] || (color === myColor() ? before.stands.me : before.stands.them);
  else fromRect = before.squares[String(sqFromName(usi.slice(0, 2)))];
  const flights = [];
  
  const captured = before.board && before.board[to];
  if (captured && !drop) {
    const ghost = pinnedPiece(captured, toRect);
    const standRect = color === myColor() ? rectOf($('stand-me')) : rectOf($('stand-them'));
    const dx = standRect.x + standRect.w / 2 - (toRect.x + toRect.w / 2);
    const dy = standRect.y + standRect.h / 2 - (toRect.y + toRect.h / 2);
    flights.push(ghost.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.7) rotate(180deg)`, opacity: 0.2 },
    ], { duration: SLIDE_MS + 160, easing: 'ease-in', delay: SLIDE_MS * 0.5 }).finished.catch(() => {}).then(() => ghost.remove()));
  }
  if (fromRect) {
    const dx = fromRect.x - toRect.x;
    const dy = fromRect.y - toRect.y;
    target.style.zIndex = '5';
    flights.push(target.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${drop ? 1.15 : 1.08})` },
      { transform: 'translate(0, 0) scale(1)' },
    ], { duration: SLIDE_MS, easing: 'cubic-bezier(.2,.7,.2,1)' }).finished.catch(() => {}));
  }
  await Promise.all(flights);
  target.style.zIndex = '';
  
  if (usi.endsWith('+')) {
    try {
      await target.animate([
        { transform: 'perspective(500px) rotateY(0deg)' },
        { transform: 'perspective(500px) rotateY(90deg)' },
        { transform: 'perspective(500px) rotateY(0deg)' },
      ], { duration: FLIP_MS * 2, easing: 'ease-in-out' }).finished;
    } catch {  }
  }
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
  begin(createMatch({ seats, startSfen: startParam }));
}


const codeOf = (id) => String(id ?? '').replace(/^fsg-/i, '').toUpperCase();
const freshMatch = (m) => m.moves.length === 0 && !m.result;

function onProposal(action, from) {
  if (!match) return;
  if (action.type === 'rematch') {
    if (match.result) restartRoom(); else net?.publish();
    return;
  }
  const before = snapshot();
  if (!act(match, from, action)) { net?.refuse(from); return; }
  if (action.usi) sound(action.usi);
  refresh(action.usi ? before : null);
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
        const m = createMatch({ seats, startSfen: view.startSfen });
        for (const usi of view.moves) act(m, m.seats[COLORS.indexOf(m.pos.turn)], { type: 'move', usi });
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
  begin(createMatch({ seats: [HOST, ''], startSfen: startParam }));
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
  const link = shareLinkFor(base, net.hosting ? net.id : `fsg-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});
$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fsg-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.watchCopied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Shogiwise' });
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



globalThis.shogiwise = Object.freeze({
  ready: () => !!view && !!pos,
  mode: () => settings.mode,
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  sfen: () => (pos ? toSfen(pos) : null),
  legal: () => legalNow().map(moveToUsi),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  over: () => !!view?.result,
  thinking: () => botBusy,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [], watchers: net?.watchers ?? 0, watcher: watcher() }),
  act: (usi) => doAction(usi === 'resign' ? { type: 'resign' } : { type: 'move', usi }),
  select: (sq) => { const n = typeof sq === 'string' ? sqFromName(sq) : sq; onSquare(n, legalNow()); },
});
