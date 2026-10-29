





















import {
  createMatch, act, nextRound, matchOver, viewFor, viewForPeer, actorId, seatOf, isBot, botLevel, seatsWith, echoView,
  ROUND_CHOICES,
} from '../../../web-engine/koikoi/koikoiMatch.js';
import { stopScore, yaku, month, kind } from '../../../web-engine/koikoi/koikoiRules.js';
import { chooseAction, viewActions, LEVELS, seededRng } from '../../../web-engine/koikoi/koikoiBot.js';
import { loadAtlas, makeCard } from '../../../web-engine/cards/cardArt.js';
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
import { foldSetup } from '../../shared/ui/setupFold.js';
import { skin } from '../../shared/ui/kit.js';
import { mountPlayAgain } from '../../shared/ui/playAgain.js';
import { mountLevelScene } from '../../shared/ui/levelScene.js';
import { fitScreen, bootDone, afterBoot } from '../../shared/ui/fitScreen.js';
import { PACE, flyCard, rectOf, wait, reducedMotion } from '../../shared/ui/cardFlight.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, cardName, yakuName } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'koikoi';
const SETTINGS_KEY = 'hanawise-settings-v1';
const SOLO = 'you';
const HOST = 'host';      
const BOT_MS = PACE.think;

const NEXT_MS = 4200;
const BANNER_MS = 1500;
const FLIP_MS = 170;      
const DECK_URL = '../shared/cards/hanafuda48/deck.json';
const KINDS = ['H', 'T', 'R', 'K'];


const lang = gameLang(undefined, undefined, undefined, { zh: true });
const T = stringsFor(lang);
applyGameName(GAME_ID, document, lang);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Hanawise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const handEl = $('hand');
const actionsEl = $('actions');
const scoreEl = $('score');
const fieldEl = $('field');
const stockEl = $('stock');
const bannerEl = $('banner');
const nextEl = $('next-round');
const roundsEl = $('rounds');
const roomEl = $('room');
const again = mountPlayAgain({ anchor: $('table'), source: $('new-game') });
const fit = fitScreen({
  last: () => [$('seat'), $('table')],
  apply: (s) => { fitScale = s; draw(); },
  min: 0.5,
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
handEl.setAttribute('aria-label', T.handLabel);
fieldEl.setAttribute('aria-label', T.field);
stockEl.setAttribute('aria-label', T.stock);
$('table').setAttribute('aria-label', T.tableLabel);
const GAME_NAME = localGameName(GAME_ID, lang);
for (const n of ROUND_CHOICES) {
  const o = document.createElement('option');
  o.value = String(n);
  o.textContent = fill(T.roundsN, { n });
  roundsEl.append(o);
}


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };
const params = new URLSearchParams(location.search);
const saved = load(SETTINGS_KEY, null) || {};
const pick = (v, list, d) => (list.includes(v) ? v : d);
const settings = {
  mode: 'bot',
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'easy')),
  rounds: pick(Number(params.get('rounds')), ROUND_CHOICES, pick(saved.rounds, ROUND_CHOICES, 6)),
};
const persist = () => save(SETTINGS_KEY, { level: settings.level, rounds: settings.rounds });

const seedParam = params.get('seed');
let seedCounter = Number(seedParam) || 0;
function freshSeed() {
  if (seedParam !== null) { seedCounter += 1; return seedCounter; }
  try { return crypto.getRandomValues(new Uint32Array(1))[0] || 1; } catch { return (Math.random() * 2 ** 32) >>> 0 || 1; }
}
const handParam = (params.get('hand') ?? '').split(',').map((s) => s.trim()).filter(Boolean);


let match = null;   
let view = null;    
let atlas = null;
let net = null;
let botTimer = null;
let nextTimer = null;
let waitingAnswer = false;
let confirmedView = null;   
let echoTimer = null;
const ECHO_TIMEOUT_MS = 8000;
let lastFlash = '';
let finishedRound = -1;
let gameRound = 0;
let queuedArrivals = [];
const room = { active: false, me: null, peers: [], code: null, watching: false };
const presence = roomPresence({
  game: 'koikoi', 
  net: () => net,
  players: () => new Set([room.me, ...room.peers].filter(Boolean)).size || 1,
  ids: () => [room.me, ...room.peers].filter(Boolean),
});
const reportGate = createReportGate();
let startedAt = Date.now();
const botRngs = new Map();

const isGuest = () => settings.mode === 'room' && room.active && net && !net.hosting;
const myId = () => (settings.mode === 'room' ? (room.me ?? HOST) : SOLO);
const watcher = () => settings.mode === 'room' && room.active
  && (room.watching || (isGuest() && !!view && view.you < 0));

const viewSeat = () => (view && view.you >= 0 ? view.you : 0);

function botRng(id) {
  if (!botRngs.has(id)) botRngs.set(id, seedParam !== null ? seededRng((Number(seedParam) || 1) * 97 + botRngs.size + 1) : Math.random);
  return botRngs.get(id);
}


function begin(m) {
  match = m;
  gameRound += 1;
  reportGate.begin(match.seats);
  startedAt = Date.now();
  lastFlash = '';
  refresh();
}

function newMatch({ keepHand = false } = {}) {
  stopTimers();
  const first = settings.mode === 'room' ? myId() : SOLO;
  const seats = settings.mode === 'room' ? [first, ''] : [first, `bot:${settings.level}#1`];
  begin(createMatch({
    seats, rounds: settings.rounds, seed: freshSeed(), oya: 0,
    fixed: keepHand && handParam.length === 8 ? handParam : null,
  }));
}




function tableRects() {
  const hand = {};
  for (const c of handEl.querySelectorAll('[data-id]')) hand[c.dataset.id] = rectOf(c);
  const field = {};
  for (const c of fieldEl.querySelectorAll('[data-id]')) field[c.dataset.id] = rectOf(c);
  const pend = stockEl.querySelector('.kk-pending [data-id]');
  return {
    hand,
    field,
    backs: rectOf($('side-them').querySelector('.kk-backs .kk-card:last-child') || $('side-them')),
    stock: rectOf(stockEl.querySelector('.kk-pile .kk-card') || stockEl),
    pending: pend ? { id: pend.dataset.id, rect: rectOf(pend) } : null,
    logLen: view ? view.log.length : 0,
    roundNo: view ? view.roundNo : 0,
    hadPending: view?.pending?.card ?? null,
    koikoi: view ? view.koikoi.slice() : [0, 0],
  };
}


function pinned(id, rect, faceDown = false) {
  const el = cardEl(id, { faceDown });
  const s = el.style;
  Object.assign(s, { position: 'fixed', left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px`,
    margin: '0', zIndex: '9998', pointerEvents: 'none' });
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  return el;
}


async function flipAt(id, rect) {
  if (!rect || reducedMotion()) return;
  const back = pinned('back', rect, true);
  try {
    await back.animate([{ transform: 'perspective(700px) rotateY(0deg)' }, { transform: 'perspective(700px) rotateY(90deg)' }],
      { duration: FLIP_MS, easing: 'ease-in' }).finished;
  } catch {  }
  back.remove();
  const face = pinned(id, rect);
  face.classList.add('kk-lit');
  try {
    await face.animate([{ transform: 'perspective(700px) rotateY(-90deg)' }, { transform: 'perspective(700px) rotateY(0deg)' }],
      { duration: FLIP_MS, easing: 'ease-out' }).finished;
  } catch {  }
  await wait(PACE.settle);
  face.remove();
}

const sideOf = (seat) => $(seat === viewSeat() ? 'side-me' : 'side-them');
const capturedEl = (seat, id) => sideOf(seat).querySelector(`.kk-cap [data-id="${id}"]`);


async function flyMoves(before) {
  if (!view || !before || before.roundNo !== view.roundNo) return;
  const me = view.you;
  const entries = view.log.slice(before.logLen);
  
  
  const hidden = [];
  const hide = (el) => { if (el) { el.style.visibility = 'hidden'; hidden.push(el); } };
  for (const e of entries) {
    if (e.koikoi) continue;
    if (e.took.length) for (const c of [e.card, ...e.took]) hide(capturedEl(e.seat, c));
    else hide(fieldEl.querySelector(`[data-id="${e.card}"]`));
  }
  const newPending = view.pending && view.pending.card !== before.hadPending ? view.pending : null;
  if (newPending) hide(stockEl.querySelector('.kk-pending [data-id]'));
  try {
    for (const e of entries) {
      if (e.koikoi) { await banner(fill(T.calledKoikoi, { who: seatName(e.seat) }), 'koikoi'); continue; }
      let from;
      if (before.pending && before.pending.id === e.card) from = before.pending.rect;
      else if (e.source === 'stock') { from = before.stock; await flipAt(e.card, from); }
      else from = me >= 0 && e.seat === me ? before.hand[e.card] : before.backs;
      if (!e.took.length) {
        await flyCard({ ghost: cardEl(e.card), from, target: fieldEl.querySelector(`[data-id="${e.card}"]`) });
        continue;
      }
      
      
      const at = before.field[e.took[0]];
      const stand = e.took.map((c) => (before.field[c] ? pinned(c, before.field[c]) : null)).filter(Boolean);
      if (at) await flyCard({ ghost: cardEl(e.card), from, to: at });
      const mid = at ? pinned(e.card, at) : null;
      if (mid) stand.push(mid);
      await wait(PACE.settle / 2);
      for (const s of stand) s.remove();
      await Promise.all([e.card, ...e.took].map((c, k) => wait(k * 90).then(() => flyCard({
        ghost: cardEl(c), from: before.field[c] || at || from, target: capturedEl(e.seat, c),
      }))));
    }
    if (newPending) {
      const target = stockEl.querySelector('.kk-pending [data-id]');
      if (newPending.source === 'stock') { await flipAt(newPending.card, before.stock); await flyCard({ ghost: cardEl(newPending.card), from: before.stock, target }); }
      else await flyCard({ ghost: cardEl(newPending.card), from: me >= 0 && view.turn === me ? before.hand[newPending.card] : before.backs, target });
    }
  } finally {
    for (const el of hidden) el.style.visibility = '';
  }
  
  if (view.phase === 'decide') {
    const list = yaku(view.captured[view.turn]).list.map((y) => yakuName(T, y.id)).join(' · ');
    await banner(fill(T.made, { who: seatName(view.turn), yaku: list }), 'yaku');
  } else if (view.phase === 'over' && view.result && before.logLen !== view.log.length) {
    resultBanner();
    await wait(BANNER_MS);
  }
}







async function dealIn() {
  if (reducedMotion()) return;
  const stock = rectOf(stockEl.querySelector('.kk-pile .kk-card') || stockEl);
  if (!stock) return;
  const cards = [...fieldEl.querySelectorAll('.kk-card'), ...$('side-them').querySelectorAll('.kk-backs .kk-card'), ...handEl.querySelectorAll('.kk-card')];
  const flights = cards.map((el, k) => {
    const r = rectOf(el);
    if (!r) return null;
    const dx = stock.x + stock.w / 2 - (r.x + r.w / 2);
    const dy = stock.y + stock.h / 2 - (r.y + r.h / 2);
    return el.animate([
      { transform: `translate(${dx}px, ${dy}px) rotate(-8deg) scale(0.8)`, opacity: 0 },
      { opacity: 1, offset: 0.25 },
      { transform: 'none', opacity: 1 },
    ], { duration: 340, delay: k * 38, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }).finished.catch(() => {});
  });
  await Promise.all(flights);
}

let bannerTimer = null;

function banner(text, kindName) {
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerEl.textContent = text;
  bannerEl.className = `kk-banner kk-banner-${kindName}`;
  bannerEl.hidden = false;
  
  void bannerEl.offsetWidth;
  bannerEl.classList.add('on');
  if (kindName === 'koikoi' || kindName === 'yaku') playUi('toggleOn');
  return new Promise((r) => {
    bannerTimer = setTimeout(() => { bannerEl.hidden = true; bannerEl.classList.remove('on'); r(); }, BANNER_MS);
  });
}

function resultBanner() {
  const r = view?.result;
  if (!r) return;
  bannerEl.hidden = true;
  if (r.noGame) { banner(T.noGame, 'none'); return; }
  const names = r.handYaku ? yakuName(T, r.handYaku) : r.yaku.map((y) => yakuName(T, y.id)).join(' · ');
  banner(`${fill(T.roundTo, { who: seatName(r.winner), n: r.points })} - ${names}`, r.winner === view.you ? 'win' : 'yaku');
}

let flying = Promise.resolve();
let timerGen = 0;


function refresh(before = null) {
  if (!match) return;
  view = viewForPeer(match, myId());
  if (net?.hosting) net.publish();
  draw();
  stopTimers();
  if (before) flying = flyMoves(before).catch(() => {}).then(() => wait(PACE.settle));
  else if (view.phase === 'over' && view.result?.handYaku) { resultBanner(); flying = wait(BANNER_MS); }
  else if (view.log.length === 0 && view.phase !== 'over') flying = dealIn();
  else flying = Promise.resolve();
  const gen = timerGen;
  
  if (match.state.phase === 'over') noteResult(); else flashEl.textContent = lastFlash;
  if (matchOver(match)) { flying.then(() => finished()); return; }
  if (match.state.phase === 'over') {
    flying.then(() => { if (gen === timerGen) nextTimer = setTimeout(dealNext, NEXT_MS); });
    return;
  }
  const id = actorId(match);
  if (id !== null && isBot(id)) flying.then(() => { if (gen === timerGen) botTimer = setTimeout(botMove, BOT_MS); });
}

function botMove() {
  botTimer = null;
  if (!match || match.state.phase === 'over') return;
  const id = actorId(match);
  if (!isBot(id)) return;
  const before = tableRects();
  const a = chooseAction(viewFor(match, seatOf(match, id)), { level: botLevel(id), rng: botRng(id) });
  if (!a || !act(match, id, a)) return;
  sound(a);
  refresh(before);
}

function dealNext() {
  nextTimer = null;
  if (!match || matchOver(match) || match.state.phase !== 'over') return;
  for (const who of queuedArrivals) match.seats = seatsWith(match.seats, who, false);
  queuedArrivals = [];
  if (!nextRound(match)) return;
  lastFlash = '';
  playUi('tap');
  refresh();
}

function stopTimers() {
  timerGen += 1;
  if (botTimer) clearTimeout(botTimer);
  if (nextTimer) clearTimeout(nextTimer);
  botTimer = null;
  nextTimer = null;
}

function sound(a) {
  if (a.type === 'koikoi') playUi('toggleOn');
  else if (a.type === 'stop') playUi('toggleOff');
  else playUi('tap');
}


function doAction(a) {
  if (!view || watcher()) return;
  if (isGuest()) {
    if (waitingAnswer) return;
    waitingAnswer = true;
    const echo = echoView(view, a);
    if (echo) { confirmedView = view; view = echo; }
    if (echoTimer) clearTimeout(echoTimer);
    echoTimer = setTimeout(echoTimedOut, ECHO_TIMEOUT_MS);
    net.propose(a);
    sound(a);
    draw();
    return;
  }
  const before = tableRects();
  if (!act(match, myId(), a)) { playUi('error'); return; }
  sound(a);
  refresh(before);
}

function clearEcho() {
  if (echoTimer) clearTimeout(echoTimer);
  echoTimer = null;
  confirmedView = null;
}

function rollBack() {
  playUi('error');
  flash(T.refused, 3200);
}

function echoTimedOut() {
  echoTimer = null;
  if (!waitingAnswer) return;
  if (confirmedView) view = confirmedView;
  clearEcho();
  waitingAnswer = false;
  rollBack();
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

function noteResult() {
  const r = view?.result;
  if (!r) return;
  if (r.noGame) lastFlash = T.noGame;
  else if (r.handYaku) lastFlash = fill(T.atDeal, { who: seatName(r.winner), yaku: yakuName(T, r.handYaku), n: r.points });
  else {
    const extra = [r.doubled7 ? T.doubled7 : '', r.koikoiDoubled ? T.koikoiDoubled : ''].filter(Boolean).join(' · ');
    lastFlash = fill(T.roundTo, { who: seatName(r.winner), n: r.points }) + (extra ? ` (${extra})` : '');
  }
  flashEl.textContent = lastFlash;
}

let flashTimer = null;
function flash(text, ms = 2600) {
  flashEl.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashEl.textContent = lastFlash; }, ms);
}




let fitScale = 1;
const cardWidth = (size) => {
  const w = Math.min(window.innerWidth || 400, 900);
  const base = size === 'hand' ? Math.max(44, Math.min(86, Math.floor((w - 40) / 8.6)))
    : size === 'field' ? Math.max(38, Math.min(70, Math.floor((w - 60) / 9)))
      : Math.max(24, Math.min(36, Math.floor(w / 24)));
  return Math.round(base * fitScale);
};

function cardEl(id, { size = 'field', onClick = null, faceDown = false } = {}) {
  const width = cardWidth(size);
  const label = faceDown ? T.faceDown : cardName(T, id);
  let el;
  if (atlas) el = makeCard(document, atlas, id, { width, label, faceDown, onClick, className: 'kk-card' });
  else {
    
    el = document.createElement(onClick ? 'button' : 'div');
    el.className = 'kk-card kk-card-text';
    if (onClick) { el.type = 'button'; el.addEventListener('click', onClick); }
    el.style.width = `${width}px`;
    el.style.height = `${Math.round(width * 1.55)}px`;
    el.textContent = faceDown ? '' : label;
    if (faceDown) el.classList.add('kk-card-back');
    el.setAttribute('aria-label', label);
  }
  if (!faceDown) el.dataset.id = id;
  return el;
}

const byMonth = (a, b) => a.localeCompare(b);

function drawScore() {
  scoreEl.replaceChildren();
  if (!view) return;
  const me = viewSeat();
  const month1 = document.createElement('span');
  month1.className = 'kk-month';
  skin(month1, 'badge');
  month1.textContent = fill(T.monthOf, { n: view.roundNo, m: view.rounds });
  for (const s of [me, 1 - me]) {
    const row = document.createElement('div');
    row.className = `kk-score-row ${s === me ? 'us' : 'them'}`;
    skin(row, 'plaque');
    row.classList.toggle('is-on', view.phase !== 'over' && view.turn === s);
    const name = document.createElement('span');
    name.className = 'kk-score-name';
    name.textContent = seatName(s);
    const n = document.createElement('strong');
    n.className = 'kk-score-n';
    skin(n, 'readout');
    n.textContent = String(view.scores[s]);
    row.append(name, n);
    if (view.oya === s) {
      const b = document.createElement('span');
      b.className = 'kk-badge';
      skin(b, 'badge');
      b.textContent = T.oya;
      row.append(b);
    }
    row.setAttribute('aria-label', `${seatName(s)}: ${fill(T.points, { n: view.scores[s] })}`);
    scoreEl.append(row);
  }
  scoreEl.append(month1);
}


function capturedGroups(cards) {
  const wrap = document.createElement('div');
  wrap.className = 'kk-cap';
  for (const k of KINDS) {
    const list = cards.filter((c) => kind(c) === k).sort(byMonth);
    const g = document.createElement('div');
    g.className = `kk-group kk-group-${k}`;
    g.title = T[`kind_${k}`];
    if (!list.length) g.classList.add('empty');
    
    const lap = `${-Math.round(cardWidth('small') * 0.45)}px`;
    list.forEach((c, k) => {
      const el = cardEl(c, { size: 'small' });
      if (k) el.style.marginLeft = lap;
      g.append(el);
    });
    const n = document.createElement('span');
    n.className = 'kk-count';
    n.textContent = String(list.length);
    g.append(n);
    wrap.append(g);
  }
  return wrap;
}

function sideHead(s) {
  const head = document.createElement('div');
  head.className = 'kk-side-head';
  const name = document.createElement('span');
  name.className = 'kk-name';
  name.textContent = fill(T.capturedOf, { who: seatName(s) });
  head.append(name);
  const total = yaku(view.captured[s]).total;
  if (total > 0) {
    const t = document.createElement('span');
    t.className = 'kk-badge kk-yaku-total';
    skin(t, 'badge');
    t.textContent = fill(T.points, { n: total });
    head.append(t);
  }
  if (view.koikoi[s] > 0) {
    const k = document.createElement('span');
    k.className = 'kk-bubble';
    skin(k, 'badge').classList.add('is-on');
    k.textContent = T.koikoi;
    head.append(k);
  }
  return head;
}

function drawTable(legal) {
  const them = $('side-them');
  const mine = $('side-me');
  them.replaceChildren();
  mine.replaceChildren();
  fieldEl.replaceChildren();
  stockEl.replaceChildren();
  if (!view) return;
  const me = viewSeat();
  const o = 1 - me;
  const over = view.phase === 'over';
  them.classList.toggle('turn', !over && view.turn === o);
  mine.classList.toggle('turn', !over && view.turn === me);
  
  const backs = document.createElement('div');
  backs.className = 'kk-backs';
  if (over && view.hands) for (const c of [...view.hands[o]].sort(byMonth)) backs.append(cardEl(c, { size: 'small' }));
  else for (let k = 0; k < view.handCounts[o]; k++) backs.append(cardEl('back', { size: 'small', faceDown: true }));
  them.append(sideHead(o), backs, capturedGroups(view.captured[o]));
  mine.append(sideHead(me), capturedGroups(view.captured[me]));
  
  if (view.you < 0) {
    const b2 = document.createElement('div');
    b2.className = 'kk-backs';
    for (let k = 0; k < view.handCounts[me]; k++) b2.append(cardEl('back', { size: 'small', faceDown: true }));
    mine.insertBefore(b2, mine.children[1]);
  }

  
  const pile = document.createElement('div');
  pile.className = 'kk-pile';
  if (view.stockCount > 0) pile.append(cardEl('back', { faceDown: true }));
  const cnt = document.createElement('span');
  cnt.className = 'kk-count';
  cnt.textContent = String(view.stockCount);
  pile.append(cnt);
  stockEl.append(pile);
  const pend = document.createElement('div');
  pend.className = 'kk-pending';
  if (view.pending) {
    const el = cardEl(view.pending.card);
    el.classList.add('kk-lit');
    pend.append(el);
  } else if (view.echo) {
    const el = cardEl(view.echo.card);
    el.classList.add('echo');
    pend.append(el);
  }
  stockEl.append(pend);

  
  
  const picks = new Set(legal.filter((a) => a.type === 'pick').map((a) => a.card));
  const myMonths = new Set(legal.filter((a) => a.type === 'play').map((a) => month(a.card)));
  for (const c of [...view.field].sort(byMonth)) {
    const can = picks.has(c) && !waitingAnswer;
    const el = cardEl(c, { onClick: can ? () => doAction({ type: 'pick', card: c }) : null });
    if (can) el.classList.add('kk-choice');
    else if (myMonths.has(month(c))) el.classList.add('kk-match');
    fieldEl.append(el);
  }
}

function drawHand(legal) {
  handEl.replaceChildren();
  if (!view || view.you < 0) return;
  const playable = new Set(legal.filter((a) => a.type === 'play').map((a) => a.card));
  const fieldMonths = new Set(view.field.map(month));
  for (const c of [...view.hand].sort(byMonth)) {
    const can = playable.has(c) && !waitingAnswer;
    const el = cardEl(c, { size: 'hand', onClick: can ? () => doAction({ type: 'play', card: c }) : null });
    el.classList.toggle('playable', can);
    if (can && fieldMonths.has(month(c))) el.classList.add('kk-match');
    handEl.append(el);
  }
}

function drawActions(legal) {
  actionsEl.replaceChildren();
  if (!view || !legal.some((a) => a.type === 'stop')) return;
  const me = view.you;
  const pts = stopScore(view.lastTotal[me], view.koikoi[1 - me] > 0);
  const stop = document.createElement('button');
  stop.type = 'button';
  stop.className = 'kk-btn kk-call kk-call-stop';
  skin(stop, 'button_secondary', 'check');
  stop.textContent = fill(T.stopBtn, { n: pts });
  stop.dataset.action = 'stop';
  stop.disabled = waitingAnswer;
  stop.addEventListener('click', () => doAction({ type: 'stop' }));
  const kk = document.createElement('button');
  kk.type = 'button';
  kk.className = 'kk-btn kk-call kk-call-koikoi';
  skin(kk, 'button_primary', 'star');
  kk.textContent = T.koikoiBtn;
  kk.dataset.action = 'koikoi';
  kk.disabled = waitingAnswer;
  kk.addEventListener('click', () => doAction({ type: 'koikoi' }));
  actionsEl.append(stop, kk);
}

function statusText() {
  if (!view) return settings.mode === 'room' && room.active ? T.connecting : T.loading;
  if (watcher() && !view.matchOver) return T.watching;
  if (settings.mode === 'room' && view.seats.includes('')) return T.waiting;
  if (view.matchOver) {
    const [a, b] = [view.scores[viewSeat()], view.scores[1 - viewSeat()]];
    if (a === b) return T.drawGame;
    if (view.you < 0) return fill(T.winsGame, { who: seatName(a > b ? viewSeat() : 1 - viewSeat()) });
    return a > b ? T.youWinGame : T.youLoseGame;
  }
  if (view.phase === 'over') return fill(T.monthOf, { n: view.roundNo, m: view.rounds });
  const s = view.turn;
  if (s === view.you) {
    if (view.phase === 'decide') return fill(T.decideYou, { n: stopScore(view.lastTotal[s], view.koikoi[1 - s] > 0) });
    if (view.phase === 'pickHand' || view.phase === 'pickDraw') return T.pickYou;
    return T.yourTurn;
  }
  return fill(view.phase === 'decide' ? T.decideOf : T.turnOf, { who: seatName(s) });
}

function draw() {
  const legal = view && view.you >= 0 && !waitingAnswer ? viewActions(view) : [];
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  roundsEl.value = String(view ? view.rounds : settings.rounds);
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  const guest = isGuest();
  const watching = watcher();
  roundsEl.disabled = guest || watching;
  $('copy-link').hidden = watching;
  const watchersEl = $('watchers');
  watchersEl.textContent = watchingLabel(T.watchers, room.active ? (net?.watchers ?? 0) : 0);
  watchersEl.hidden = !watchersEl.textContent;
  statusEl.textContent = statusText();
  drawScore();
  drawTable(legal);
  drawHand(legal);
  drawActions(legal);
  handEl.hidden = watching;
  nextEl.hidden = !(view && view.phase === 'over' && !view.matchOver && !guest && !watching);
  $('new-game').hidden = watching;
  document.querySelector('.kk-foot').hidden = watching;
  again.update(!!view?.matchOver && !watching);
  fit.refit();
}


function finished() {
  if (!view || finishedRound === gameRound) return;
  finishedRound = gameRound;
  const me = view.you;
  if (me < 0) return;
  const [a, b] = [view.scores[me], view.scores[1 - me]];
  const result = a > b ? 'won' : a < b ? 'lost' : 'draw';
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
  trackEvent('koikoi_finished', { mode: settings.mode, level: settings.level, rounds: view.rounds, result, us: a, them: b });
}


for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    if (mode === settings.mode) return;
    playUi('toggleOn');
    if (settings.mode === 'room') leaveRoom();
    settings.mode = mode;
    if (mode === 'bot') newMatch();
    else { stopTimers(); match = null; view = null; draw(); }
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
roundsEl.addEventListener('change', () => {
  settings.rounds = pick(Number(roundsEl.value), ROUND_CHOICES, 6);
  persist();
  playUi('toggleOn');
  if (settings.mode === 'bot') newMatch(); else if (room.active && net?.hosting) restartRoom();
});
nextEl.addEventListener('click', () => { if (!isGuest()) { stopTimers(); dealNext(); } });
$('new-game').addEventListener('click', () => {
  if (watcher()) return;
  playUi('tap');
  if (isGuest()) { net.propose({ type: 'rematch' }); return; }
  if (match && settings.mode === 'room') { restartRoom(); return; }
  if (settings.mode === 'room') { flash(T.waiting); return; }
  newMatch();
});
window.addEventListener('resize', () => draw());

function restartRoom(seats = match.seats) {
  stopTimers();
  begin(createMatch({ seats, rounds: settings.rounds, seed: freshSeed(), oya: 0 }));
}


const codeOf = (id) => String(id ?? '').replace(/^fkk-/i, '').toUpperCase();
const freshMatch = (m) => m.roundNo === 1 && m.state.log.length === 0;

function onProposal(action, from) {
  if (!match) return;
  if (action.type === 'rematch') {
    if (matchOver(match)) restartRoom();
    else net?.publish();
    return;
  }
  const before = tableRects();
  if (!act(match, from, action)) { net?.refuse(from); return; }
  sound(action);
  refresh(before);
}

function onView(v, meta = {}) {
  const shown = view;
  const before = tableRects();
  const real = confirmedView ?? view;
  const echoed = !!confirmedView;
  clearEcho();
  waitingAnswer = false;
  
  if (echoed && real) { before.logLen = real.log.length; before.roundNo = real.roundNo; before.hadPending = real.pending?.card ?? null; }
  view = v;
  if (echoed && meta?.nack) rollBack();
  if (!real || (v.roundNo === 1 && real.roundNo > 1) || (real.matchOver && !v.matchOver)) {
    gameRound += 1;
    reportGate.begin(v.seats);
    startedAt = Date.now();
  }
  if (!real || v.roundNo !== real.roundNo) lastFlash = '';
  if (v.phase === 'over') noteResult(); else flashEl.textContent = lastFlash;
  draw();
  if (shown && real && v.roundNo === real.roundNo) flyMoves(before).catch(() => {});
  if (v.matchOver) finished();
}

function startNet() {
  if (net) return net;
  net = createNet({
    viewFor: (peer) => (match ? viewForPeer(match, peer) : null),
    onView,
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
        flash(T.hostLeft, 5000);
        settings.rounds = view.rounds;
        restartRoom(seats);
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
  stopTimers();
  begin(createMatch({ seats: [HOST, ''], rounds: settings.rounds, seed: freshSeed(), oya: 0 }));
  startNet().host();
}

function joinRoom(code, { watch = false } = {}) {
  if (!canPlayTogether()) { flash(T.noRooms, 4000); return false; }
  const out = startNet().join(code, { watch });
  if (out?.error) { net = null; flash(T.badCode, 4000); return false; }
  stopTimers();
  settings.mode = 'room';
  room.watching = watch;
  room.active = true;
  room.code = codeOf(code);
  match = null;
  view = null;
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
  const link = shareLinkFor(base, net.hosting ? net.id : `fkk-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});
$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fkk-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.watchCopied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Hanawise' });
const linkRoom = roomFromHref(location.href);
afterBoot(() => countPlay(GAME_ID, { isHost: !linkRoom }));

const atlasReady = loadAtlas(DECK_URL).then((a) => { atlas = a; draw(); }).catch(() => {  });
Promise.race([atlasReady, new Promise((r) => { setTimeout(r, 4000); })]).then(() => { fit.refit({ grow: true }); bootDone(); });

function boot() {
  if (linkRoom) {
    settings.mode = 'room';
    if (!joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH })) { settings.mode = 'bot'; newMatch({ keepHand: true }); }
    return;
  }
  newMatch({ keepHand: true });
}
boot();

trackEvent('game_start', { game: GAME_ID, mode: settings.mode });



globalThis.hanawise = Object.freeze({
  ready: () => !!view,
  mode: () => settings.mode,
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  legal: () => (view && view.you >= 0 ? viewActions(view) : []),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  scores: () => (view ? view.scores.slice() : null),
  over: () => !!view?.matchOver,
  atlas: () => !!atlas,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [], watchers: net?.watchers ?? 0, watcher: watcher() }),
  act: (a) => doAction(a),
  deal: () => { if (!isGuest()) { stopTimers(); dealNext(); } },
});
