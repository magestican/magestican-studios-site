
























import {
  createMatch, act, actorId, viewForPeer, echoView, seatsWith, isBot, botLevel, COLORS, matchOf, replay, seatToMove,
} from '../../../web-engine/go/goMatch.js';
import {
  BLACK, WHITE, PASS, SIZES, RULES, toSgf, fromSgf, label, score, play as playPos,
} from '../../../web-engine/go/goRules.js';
import { chooseMove, LEVELS, seededRng } from '../../../web-engine/go/goBot.js';
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
import { stringsFor, fill } from './strings.js';
import { guideFor, libertiesAt } from './guide.js';
import { needsConfirm } from './confirm.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'go';
const SETTINGS_KEY = 'weiqiwise-settings-v1';
const SOLO = 'you';
const HOST = 'host';
const BANNER_MS = 1300;
const FLY_MS = 480;
const BOWL_SHOWN = 24;

const lang = gameLang(undefined, undefined, undefined, { zh: true });
const T = stringsFor(lang);
applyGameName(GAME_ID, document, lang);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Weiqiwise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const boardEl = $('board');
const bannerEl = $('banner');
const roomEl = $('room');
const again = mountPlayAgain({ anchor: $('table'), source: $('new-game') });




const fit = fitScreen({
  last: () => [$('board'), $('bowl-me'), document.querySelector('.wq-foot')],
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
  size: pick(Number(params.get('size')), SIZES, pick(saved.size, SIZES, 9)),
  rules: pick(params.get('rules'), RULES, pick(saved.rules, RULES, 'japanese')),
  guide: params.has('guide') ? params.get('guide') !== '0' : (typeof saved.guide === 'boolean' ? saved.guide : true),
};
const persist = () => save(SETTINGS_KEY, { level: settings.level, side: settings.side, size: settings.size, rules: settings.rules, guide: settings.guide });
const movesParam = (params.get('moves') || '').split('.').filter(Boolean);
const seedParam = params.get('seed');


let match = null;   
let view = null;    
let live = null;    
let liveKey = '';
let net = null;
let ghost = -1;      
let shownLibs = -1;  
let toldTapAgain = false;
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
  game: 'go', 
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

const myColor = () => (view && view.you >= 0 ? COLORS[view.you] : BLACK);
const colorName = (c) => (c === BLACK ? T.black : T.white);


let worker = null;
try {
  worker = new Worker(new URL('../../../web-engine/go/goWorker.js', import.meta.url), { type: 'module' });
} catch { worker = null; }
const botRng = seedParam !== null ? seededRng(Number(seedParam) || 1) : Math.random;
function askBot(m, level) {
  const seed = Math.floor(botRng() * 2 ** 31) + 1;
  const msg = { n: m.n, rules: m.rules, moves: [...m.moves], level, seed, id: seed };
  if (worker) {
    return new Promise((resolve) => {
      const onMsg = (e) => {
        if (e.data?.id !== msg.id) return;
        worker.removeEventListener('message', onMsg);
        resolve(e.data.mv);
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage(msg);
    });
  }
  return wait(30).then(() => {
    const r = replay({ n: msg.n, rules: msg.rules, moves: msg.moves });
    return toSgf(chooseMove(r.pos, { level, rules: msg.rules, rng: seededRng(seed) }), msg.n);
  });
}


function begin(m) {
  match = m;
  gameNo += 1;
  reportGate.begin(match.seats);
  startedAt = Date.now();
  lastFlash = '';
  ghost = -1;
  shownLibs = -1;
  bowlSeen.ready = false;
  refresh();
}

function soloSeats() {
  const bot = `bot:${settings.level}#1`;
  return settings.side === 'b' ? [SOLO, bot] : [bot, SOLO];
}

function freshFromSettings(seats) {
  const m = createMatch({ seats, n: settings.size, rules: settings.rules });
  
  for (const mv of movesParam) if (!act(m, m.seats[seatToMove(m)], { type: 'move', mv })) break;
  return m;
}

function newMatch() {
  botGen += 1;
  const seats = settings.mode === 'room' ? [myId(), ''] : soloSeats();
  begin(freshFromSettings(seats));
}

function syncLive() {
  if (!view) { live = null; liveKey = ''; return; }
  const key = `${view.n}|${view.rules}|${view.moves.join(' ')}|${view.accepts.join(',')}|${view.seats.join(',')}`;
  if (key === liveKey) return;
  live = match && !isGuest() && !confirmedView && view.moves.length === match.moves.length ? match : matchOf(view);
  liveKey = key;
}


function refresh(before = null) {
  if (!match) return;
  view = viewForPeer(match, myId());
  if (net?.hosting) net.publish();
  show(before);
  maybeBot();
}

function show(before) {
  syncLive();
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
  draw();
  Promise.all([askBot(match, botLevel(id)), wait(PACE.think * 0.6)]).then(([mv]) => {
    botBusy = false;
    if (gen !== botGen || !match || match.result || actorId(match) !== id) return;
    const before = snapshot();
    
    if (!act(match, id, { type: 'move', mv: mv || 'pass' })) act(match, id, { type: 'move', mv: 'pass' });
    sound(before);
    refresh(before);
  });
}


function sound(before) {
  if (!before || !view) return;
  const mv = view.moves.at(-1);
  syncLive();
  if (!live || mv === 'pass' || mv === 'resume') { playUi('toggleOff'); return; }
  const took = capturedSince(before).length > 0;
  playUi(took ? 'tap' : 'toggleOn');
}


function doAction(a) {
  if (!view || watcher()) return;
  ghost = -1;
  shownLibs = -1;
  if (isGuest()) {
    if (waitingAnswer) return;
    waitingAnswer = true;
    const before = snapshot();
    const echo = echoView(view, a);
    if (echo) { confirmedView = view; view = echo; }
    if (echoTimer) clearTimeout(echoTimer);
    echoTimer = setTimeout(echoTimedOut, ECHO_TIMEOUT_MS);
    net.propose(a);
    show(echo ? before : null);
    if (echo) sound(before);
    return;
  }
  const before = snapshot();
  if (!act(match, myId(), a)) { playUi('error'); draw(); return; }
  refresh(a.mv ? before : null);
  if (a.mv) sound(before);
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
  syncLive();
  draw();
}


function seatName(s) {
  if (!view) return '';
  if (s === view.you) return T.you;
  const id = view.seats[s];
  if (view.you < 0) {
    const p = `${colorName(COLORS[s])}`;
    return isBot(id) ? `${p} (${T.bot})` : p;
  }
  return isBot(id) ? T.bot : T.friendName;
}

const points = (x) => String(x);

function resultText() {
  const r = view?.result;
  if (!r) return '';
  if (r.reason === 'resign') return fill(T.resigned, { who: seatName(1 - r.winner) });
  const m = points(r.count?.margin ?? 0);
  if (view.you >= 0) return r.winner === view.you ? fill(T.youWin, { m }) : fill(T.youLose, { who: seatName(r.winner), m });
  return fill(T.winsBy, { who: seatName(r.winner), m });
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
  bannerEl.className = `wq-banner ${kind}`;
  bannerEl.hidden = false;
  bannerTimer = setTimeout(() => { bannerEl.hidden = true; }, view?.result ? BANNER_MS * 2.2 : BANNER_MS);
}


function madeAtari() {
  const mv = view?.moves.at(-1);
  if (!live || !mv || mv === 'pass' || mv === 'resume') return false;
  const p = fromSgf(mv, live.n);
  const b = live.pos.board;
  const enemy = b.cells[p] === BLACK ? WHITE : BLACK;
  return b.t.nbr.slice(p * 4, p * 4 + 4).some((q) => q >= 0 && b.cells[q] === enemy && b.chain(q).libs.length === 1);
}


function announce(before) {
  if (!view || !live) return;
  if (view.result) {
    lastFlash = resultText();
    flashEl.textContent = lastFlash;
    const won = view.result.winner === view.you;
    banner(lastFlash, won ? 'win' : '');
    return;
  }
  if (!before) return;
  const mv = view.moves.at(-1);
  if (mv === 'pass') {
    flash(fill(T.passed, { who: seatName(1 - seatToMove(live)) }), 2400);
  } else if (mv === 'resume') flash(T.resumed, 4200);
  if (live.phase === 'count') banner(live.capped ? T.capped : T.countTitle);
  else if (madeAtari()) banner(T.atari, 'atari');
}


function finished() {
  if (!view?.result || finishedGame === gameNo) return;
  finishedGame = gameNo;
  const me = view.you;
  if (me < 0) return;
  const w = view.result.winner;
  const result = w === me ? 'won' : 'lost';
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
  trackEvent('go_finished', { mode: settings.mode, level: settings.level, side: settings.side, size: view.n,
    rules: view.rules, result, reason: view.result.reason, moves: view.moves.length });
}


const myTurnToPlay = () => !!live && !!view && !view.result && !watcher() && view.you >= 0
  && live.phase === 'play' && seatToMove(live) === view.you && !waitingAnswer
  && !(settings.mode === 'bot' && botBusy);


function linesSvg(n) {
  const a = 0.5;
  const z = n - 0.5;
  const parts = [`<rect class="frame" x="${a}" y="${a}" width="${n - 1}" height="${n - 1}"/>`];
  for (let i = 1; i < n - 1; i += 1) {
    parts.push(`<line class="grid" x1="${a}" y1="${i + a}" x2="${z}" y2="${i + a}"/>`, `<line class="grid" x1="${i + a}" y1="${a}" x2="${i + a}" y2="${z}"/>`);
  }
  const star = n === 9 ? [2, 6] : n === 13 ? [3, 9] : [3, 9, 15];
  const spots = n === 19 ? star.flatMap((r) => star.map((c) => [r, c])) : [...star.flatMap((r) => star.map((c) => [r, c])), [(n - 1) / 2, (n - 1) / 2]];
  for (const [r, c] of spots) parts.push(`<circle class="hoshi" cx="${c + a}" cy="${r + a}" r="${n === 19 ? 0.11 : 0.09}"/>`);
  return `<svg class="wq-lines" viewBox="0 0 ${n} ${n}" preserveAspectRatio="none" aria-hidden="true">${parts.join('')}</svg>`;
}
const LINES = new Map();

function stoneEl(color, { last = false } = {}) {
  const el = document.createElement('span');
  el.className = `wq-stone ${color === BLACK ? 'b' : 'w'}${last ? ' last' : ''}`;
  return el;
}

function lastPoint() {
  const mv = view?.moves.at(-1);
  return mv && live ? fromSgf(mv, live.n) : null;
}


function whyNot(p) {
  const b = live.pos.board;
  if (b.cells[p]) return null;
  if (p === b.ko) return 'ko';
  const t = b.clone();
  return t.play(p, live.pos.turn) ? 'ko' : 'suicide';
}

function drawBoard() {
  const n = live ? live.n : settings.size;
  $('table').style.setProperty('--n', String(n));
  if (!LINES.has(n)) LINES.set(n, linesSvg(n));
  boardEl.innerHTML = LINES.get(n);
  if (!live) return;
  const b = live.pos.board;
  const mine = myTurnToPlay();
  const guide = settings.guide && live.phase === 'play' && !view.result ? guideFor(live.pos) : null;
  const atari = new Set(guide ? guide.atari : []);
  const lastLibs = new Set(guide ? guide.atariLibs : []);
  
  const illegal = new Set(mine ? (guide || guideFor(live.pos)).illegal : []);
  const nogo = settings.guide ? illegal : new Set();
  const libs = shownLibs >= 0 && b.cells[shownLibs] ? new Set(libertiesAt(live.pos, shownLibs).libs) : new Set();
  const counting = live.phase === 'count' || view.result?.reason === 'score';
  const dead = new Set(counting ? live.dead : []);
  const owner = counting ? score(b, { rules: live.rules, dead: live.dead }).owner : null;
  const last = lastPoint();
  let inked = 0;
  for (let p = 0; p < b.size; p += 1) {
    const c = b.cells[p];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'wq-pt';
    el.dataset.p = String(p);
    el.setAttribute('role', 'gridcell');
    const sq = label(p, n);
    if (c) {
      el.append(stoneEl(c, { last: p === last }));
      el.setAttribute('aria-label', fill(T.stoneOn, { color: colorName(c), sq, libs: b.chain(p).libs.length }));
      if (atari.has(p)) el.classList.add('atari');
      if (dead.has(p)) el.classList.add('dead');
    } else {
      el.setAttribute('aria-label', fill(T.emptySq, { sq }));
      if (mine && !illegal.has(p)) el.classList.add('can');
      if (nogo.has(p)) el.classList.add('nogo');
      if (lastLibs.has(p)) el.classList.add('lastlib');
      if (libs.has(p)) { el.classList.add('lib'); el.style.setProperty('--i', String(Math.min(inked++, 20))); }
      if (p === ghost) el.classList.add('ghost');
    }
    if (owner && (!c || dead.has(p)) && owner[p]) {
      el.classList.add(owner[p] === BLACK ? 'own-b' : 'own-w');
      el.style.setProperty('--i', String(p % 97));
    }
    if (view?.echo && p === last) el.classList.add('echo');
    el.addEventListener('click', (e) => onPoint(p, e.pointerType));
    boardEl.append(el);
  }
}


const bowlSeen = { [BLACK]: 0, [WHITE]: 0, ready: false };


function drawBowl(el, color) {
  el.textContent = '';
  if (!live) return;
  const seat = COLORS.indexOf(color);
  el.classList.toggle('turn', live.pos.turn === color && live.phase === 'play' && !view?.result);
  const head = document.createElement('div');
  head.className = 'wq-bowl-head';
  const n = live.pos.board.caps[color];
  head.append(stoneEl(color));
  head.append(document.createTextNode(fill(T.prisoners, { who: seatName(seat), n })));
  el.append(head);
  const row = document.createElement('div');
  row.className = 'wq-bowl-row';
  for (let i = 0; i < Math.min(n, BOWL_SHOWN); i += 1) {
    const s = stoneEl(color === BLACK ? WHITE : BLACK);
    if (bowlSeen.ready && i >= bowlSeen[color]) s.classList.add('fresh');
    row.append(s);
  }
  if (n > BOWL_SHOWN) {
    const more = document.createElement('span');
    more.className = 'wq-bowl-more';
    more.textContent = `+${n - BOWL_SHOWN}`;
    row.append(more);
  }
  el.append(row);
  bowlSeen[color] = Math.min(n, BOWL_SHOWN);
}

function statusText() {
  if (!view || !live) return T.loading;
  if (view.result) return resultText();
  if (live.phase === 'count') return live.capped ? T.capped : T.countTitle;
  const turnSeat = seatToMove(live);
  
  if (view.you >= 0 && turnSeat === view.you) return `${T.yourTurn.replace(/[.。]$/, '')} · ${fill(T.moveN, { n: live.pos.plies + 1 })}`;
  const who = seatName(turnSeat);
  if (isBot(view.seats[turnSeat]) && botBusy) return fill(T.thinking, { who });
  return fill(T.turnOf, { who });
}

function drawCount() {
  const el = $('count');
  const counting = live && (live.phase === 'count' || view.result?.reason === 'score');
  el.hidden = !counting;
  if (!counting) return;
  const s = view.result?.count ?? live.count;
  el.innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = fill(T.countLine, { b: points(s.black), w: points(s.white), k: points(s.komi) });
  el.append(strong);
  if (!view.result && view.you >= 0 && live.accepts[view.you] && !live.accepts[1 - view.you]) {
    el.append(document.createTextNode(fill(T.waitAccept, { who: seatName(1 - view.you) })));
  }
}

function draw() {
  const watching = watcher();
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  $('watch-link').hidden = !room.active || watching;
  const w = $('watchers');
  const nw = net?.watchers ?? 0;
  w.hidden = !room.active || nw < 1;
  if (nw > 0) w.textContent = fill(T.watchers, { n: nw });
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  for (const b of document.querySelectorAll('[data-side]')) {
    b.setAttribute('aria-pressed', String(b.dataset.side === settings.side));
    b.hidden = settings.mode === 'room';
  }
  const shownSize = live ? live.n : settings.size;
  const shownRules = live ? live.rules : settings.rules;
  
  const canSetup = settings.mode === 'bot' || (!isGuest() && (!match || match.result || match.moves.length === 0));
  for (const b of document.querySelectorAll('[data-size]')) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.size) === shownSize));
    b.disabled = !canSetup;
  }
  for (const b of document.querySelectorAll('[data-rules]')) {
    b.setAttribute('aria-pressed', String(b.dataset.rules === shownRules));
    b.disabled = !canSetup;
  }
  $('guide').setAttribute('aria-pressed', String(settings.guide));
  document.documentElement.dataset.me = myColor() === BLACK ? 'b' : 'w';
  drawBoard();
  drawBowl($('bowl-me'), myColor());
  drawBowl($('bowl-them'), myColor() === BLACK ? WHITE : BLACK);
  bowlSeen.ready = !!live;
  drawCount();
  statusEl.textContent = watching && view ? `${T.watching} ${statusText()}` : statusText();
  const seated = !!view && view.you >= 0 && !watching && !view.result;
  const counting = !!live && live.phase === 'count';
  $('pass').hidden = !seated || counting;
  $('pass').disabled = !myTurnToPlay();
  $('accept').hidden = !seated || !counting || live.accepts[view.you];
  $('resume').hidden = !seated || !counting || live.capped;
  $('resign').hidden = !seated;
  $('new-game').hidden = watching;
  again.update(!!view?.result && !watching);
}


function cellPx() {
  const el = boardEl.querySelector('.wq-pt');
  return el ? el.getBoundingClientRect().width : 99;
}

function onPoint(p, pointerType) {
  if (!live) return;
  const b = live.pos.board;
  if (b.cells[p]) {
    
    shownLibs = shownLibs === p ? -1 : p;
    ghost = -1;
    playUi('tap');
    draw();
    return;
  }
  if (!myTurnToPlay()) return;
  if (!playPos(live.pos, p)) {
    playUi('error');
    flash(whyNot(p) === 'ko' ? T.koHere : T.notHere, 3200);
    return;
  }
  if (needsConfirm(cellPx(), pointerType) && ghost !== p) {
    ghost = p;
    shownLibs = -1;
    if (!toldTapAgain) { flash(T.tapAgain, 3200); toldTapAgain = true; }
    playUi('tap');
    draw();
    return;
  }
  doAction({ type: 'move', mv: toSgf(p, live.n) });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (ghost >= 0 || shownLibs >= 0)) { ghost = -1; shownLibs = -1; draw(); }
});



function snapshot() {
  const rects = {};
  for (const el of boardEl.querySelectorAll('.wq-pt')) rects[el.dataset.p] = rectOf(el);
  return { rects, n: view ? view.moves.length : 0, cells: live ? Int8Array.from(live.pos.board.cells) : null, size: live ? live.n : 0 };
}

function capturedSince(before) {
  if (!before?.cells || !live || before.size !== live.n) return [];
  const now = live.pos.board.cells;
  const out = [];
  for (let p = 0; p < now.length; p += 1) if (before.cells[p] && !now[p]) out.push(p);
  return out;
}

async function animate(before) {
  if (!view || !before || view.moves.length !== before.n + 1 || !live || before.size !== live.n) return;
  const p = lastPoint();
  if (p === null || p === PASS) return;
  const cell = boardEl.querySelector(`[data-p="${p}"]`);
  if (!cell) return;
  if (reducedMotion()) { await wait(PACE.settle); return; }
  cell.classList.add('landed');
  const flights = [];
  const capturer = live.pos.board.cells[p];
  const bowl = rectOf(capturer === myColor() ? $('bowl-me') : $('bowl-them'));
  const gone = capturedSince(before);
  gone.forEach((q, i) => {
    const r = before.rects[String(q)];
    if (!r) return;
    const el = stoneEl(before.cells[q]);
    Object.assign(el.style, { position: 'fixed', left: `${r.x + r.w * 0.03}px`, top: `${r.y + r.h * 0.03}px`, width: `${r.w * 0.94}px`, height: `${r.h * 0.94}px`, zIndex: '9998', pointerEvents: 'none', margin: '0' });
    el.setAttribute('aria-hidden', 'true');
    document.body.append(el);
    const dx = bowl.x + bowl.w / 2 - (r.x + r.w / 2);
    const dy = bowl.y + bowl.h / 2 - (r.y + r.h / 2);
    flights.push(el.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: 'translate(0, -6px) scale(1.12)', opacity: 1, offset: 0.25 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.45)`, opacity: 0.25 },
    ], { duration: FLY_MS, easing: 'ease-in', delay: 160 + Math.min(i, 12) * 40 }).finished.catch(() => {}).then(() => el.remove()));
  });
  await Promise.all(flights);
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
    else { match = null; view = null; live = null; liveKey = ''; draw(); }
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
function setupChanged() {
  persist();
  playUi('toggleOn');
  if (settings.mode === 'bot') newMatch();
  else if (match && !isGuest()) restartRoom();
}
for (const b of document.querySelectorAll('[data-size]')) {
  b.addEventListener('click', () => {
    const n = Number(b.dataset.size);
    if (b.disabled || n === (live ? live.n : settings.size)) return;
    settings.size = n;
    setupChanged();
  });
}
for (const b of document.querySelectorAll('[data-rules]')) {
  b.addEventListener('click', () => {
    if (b.disabled || b.dataset.rules === (live ? live.rules : settings.rules)) return;
    settings.rules = b.dataset.rules;
    setupChanged();
  });
}
$('guide').addEventListener('click', () => {
  settings.guide = !settings.guide;
  persist();
  playUi(settings.guide ? 'toggleOn' : 'toggleOff');
  draw();
});
$('pass').addEventListener('click', () => {
  if (!myTurnToPlay()) return;
  doAction({ type: 'move', mv: 'pass' });
});
$('accept').addEventListener('click', () => { playUi('toggleOn'); doAction({ type: 'accept' }); });
$('resume').addEventListener('click', () => { playUi('tap'); doAction({ type: 'resume' }); });
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
  begin(freshFromSettings(seats));
}


const codeOf = (id) => String(id ?? '').replace(/^fwq-/i, '').toUpperCase();
const freshMatch = (m) => m.moves.length === 0 && !m.result;

function onProposal(action, from) {
  if (!match) return;
  if (action.type === 'rematch') {
    if (match.result) restartRoom(); else net?.publish();
    return;
  }
  const before = snapshot();
  if (!act(match, from, action)) { net?.refuse(from); return; }
  refresh(action.mv ? before : null);
  if (action.mv) sound(before);
}

function onView(v, meta = {}) {
  const real = confirmedView ?? view;
  const echoed = !!confirmedView;
  const before = snapshot();
  if (echoed && real) before.n = real.moves.length;
  clearEcho();
  waitingAnswer = false;
  if (echoed && meta?.nack) { playUi('error'); flash(T.refused, 3200); }
  if (!real || v.moves.length < real.moves.length || v.n !== real.n || (real.result && !v.result)) {
    gameNo += 1;
    reportGate.begin(v.seats);
    startedAt = Date.now();
    lastFlash = '';
  }
  view = v;
  
  const animateIt = real && v.moves.length === real.moves.length + 1 && !(echoed && v.moves.at(-1) === real.moves.at(-1));
  show(animateIt ? before : null);
  if (animateIt) sound(before);
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
        if (match.phase === 'count') match.accepts[1] = true;
        refresh();
      }
    },
    onUnseat: (who) => {
      if (!match) return;
      queuedArrivals = queuedArrivals.filter((x) => x !== who);
      if (match.seats.indexOf(who) !== 1) return;
      if (freshMatch(match)) { restartRoom([match.seats[0], '']); return; }
      match.seats = [match.seats[0], `bot:${settings.level}#1`];
      if (match.phase === 'count') match.accepts[1] = true;
      refresh();
    },
    onStatus: (kindName, detail) => {
      if (kindName === 'open') flash(T.waiting, 4000);
      else if (kindName === 'joined' && !room.watching) flash(T.joined);
      else if (kindName === 'failed') flash(T.badCode, 4000);
      else if (kindName === 'host' && detail?.iAmHost && view && !match) {
        
        
        const seats = view.seats.map((s) => (s === detail.previousHost || !s ? `bot:${settings.level}#1` : s));
        const m = replay({ seats, n: view.n, rules: view.rules, moves: view.moves, accepts: view.accepts });
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
  begin(freshFromSettings([HOST, '']));
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
  live = null;
  liveKey = '';
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
  const link = shareLinkFor(base, net.hosting ? net.id : `fwq-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});
$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fwq-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.watchCopied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Weiqiwise' });
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



globalThis.weiqiwise = Object.freeze({
  ready: () => !!view && !!live,
  mode: () => settings.mode,
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  board: () => (live ? live.pos.board.toString() : null),
  phase: () => (live ? (view.result ? 'over' : live.phase) : null),
  count: () => (live?.count ? { ...live.count } : null),
  legal: () => (myTurnToPlay() ? Array.from({ length: live.pos.board.size }, (_, p) => p).filter((p) => !live.pos.board.cells[p] && playPos(live.pos, p)).map((p) => toSgf(p, live.n)) : []),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  over: () => !!view?.result,
  thinking: () => botBusy,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [], watchers: net?.watchers ?? 0, watcher: watcher() }),
  act: (mv) => doAction(['resign', 'accept', 'resume'].includes(mv) ? { type: mv } : { type: 'move', mv }),
  tap: (sgf) => { if (live) onPoint(fromSgf(sgf, live.n)); },
});

