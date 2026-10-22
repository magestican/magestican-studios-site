




























import {
  createMatch, act, nextHand, rematch, viewFor, viewForPeer, actorId, seatOf, isBot, botLevel, seatsWith, echoView,
} from '../../../web-engine/conga/congaMatch.js';
import { findCut, bestMelds, isJoker, isCongaCard, LIMIT, DECK } from '../../../web-engine/conga/congaRules.js';
import { chooseAction, seededRng, LEVELS } from '../../../web-engine/conga/congaBot.js';
import { loadAtlas, makeCard } from '../../../web-engine/cards/cardArt.js';
import { sortHand, parseCard, DECKS } from '../../../web-engine/cards/cards.js';
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
import { skin } from '../../shared/ui/kit.js';
import { mountPlayAgain } from '../../shared/ui/playAgain.js';
import { fitScreen, bootDone, afterBoot } from '../../shared/ui/fitScreen.js';
import { mountLevelScene } from '../../shared/ui/levelScene.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { PACE, flyCard, rectOf, wait } from '../../shared/ui/cardFlight.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, cardName } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'conga';



const SETTINGS_KEY = 'congawise-settings-v2';
const SOLO = 'you';
const HOST = 'host';      



const BOT_MS = PACE.think;
const BOT_THROW_MS = 800;
const PLAYERS = [2, 3, 4];



const DECK_URL = '../shared/cards/spanish50/deck.json';

const lang = gameLang();



const MUSIC_NAMES = { main: 'Candombe', local: 'Murga' };
const music = createTrackMusic({
  game: 'conga', lang, homeLang: 'es',
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});


const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), ['card', 'draw', 'win', 'lose'], { card: 4, draw: 4 });
const T = stringsFor(lang);
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Congawise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const handEl = $('hand');
const actionsEl = $('actions');
const scoreEl = $('score');
const seatsEl = $('seats');
const centreEl = $('centre');
const resultEl = $('result');
const nextEl = $('next-hand');
const reengEl = $('reenganche');

const again = mountPlayAgain({ anchor: resultEl, source: $('new-game'), scroll: false });


const fit = fitScreen({
  last: () => [$('seat'), $('table')],
  apply: (s) => { fitScale = s; draw(); },
  min: 0.5,
});

mountLevelScene({ levels: ['easy', 'medium', 'hard'] });
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
for (const b of document.querySelectorAll('[data-size]')) b.textContent = fill(T.playersN, { n: b.dataset.size });
$('rules-link').href = T.rules;
handEl.setAttribute('aria-label', T.handLabel);
$('table').setAttribute('aria-label', T.tableLabel);


const GAME_NAME = localGameName(GAME_ID, lang) ?? 'Congawise';


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };
const params = new URLSearchParams(location.search);

const v1 = load('congawise-settings-v1', {}) || {};
const saved = load(SETTINGS_KEY, null) || { size: v1.size, reenganche: v1.reenganche };
const pick = (v, list, d) => (list.includes(v) ? v : d);
const reengParam = params.get('reenganche');
const settings = {
  mode: 'bot',
  size: pick(Number(params.get('players')), PLAYERS, pick(saved.size, PLAYERS, 2)),
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'easy')),
  reenganche: reengParam !== null ? reengParam === '1' : saved.reenganche === true,
};


const persist = () => save(SETTINGS_KEY, { size: settings.size, level: settings.level, reenganche: settings.reenganche });

const seedParam = params.get('seed');
let seedCounter = Number(seedParam) || 0;
function freshSeed() {
  if (seedParam !== null) { seedCounter += 1; return seedCounter; }
  try { return crypto.getRandomValues(new Uint32Array(1))[0] || 1; } catch { return (Math.random() * 2 ** 32) >>> 0 || 1; }
}


const handParam = (params.get('hand') ?? '').split(',').map((s) => s.trim())
  .map((s) => (/^jk[12]$/i.test(s) ? s.toUpperCase() : s.toLowerCase())).filter(isCongaCard);


let match = null;   
let view = null;    
let atlas = null;
let net = null;
let botTimer = null;
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
  game: 'conga',
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

function botSeats(size, level, first) {
  const seats = [first];
  for (let s = 1; s < size; s++) seats.push(`bot:${level}#${s}`);
  return seats;
}

function botRng(id) {
  if (!botRngs.has(id)) botRngs.set(id, seedParam !== null ? seededRng((Number(seedParam) || 1) * 97 + botRngs.size + 1) : Math.random);
  return botRngs.get(id);
}


function begin(m) {
  match = m;
  gameRound += 1;
  reportGate.begin(match.seats);
  startedAt = Date.now();
  refresh();
}

function newMatch({ cheats = false } = {}) {
  stopTimers();
  const first = settings.mode === 'room' ? myId() : SOLO;
  const seats = settings.mode === 'room' && settings.size === 2 ? [first, ''] : botSeats(settings.size, settings.level, first);
  begin(createMatch({
    seats, reenganche: settings.reenganche, seed: freshSeed(),
    fixedHand: cheats && handParam.length === 7 ? handParam : null,
  }));
}




function tableRects() {
  const seats = {};
  for (const b of seatsEl.querySelectorAll('[data-seat]')) seats[b.dataset.seat] = rectOf(b.querySelector('.cg-backs') || b);
  const hand = {};
  for (const c of handEl.querySelectorAll('[data-id]')) hand[c.dataset.id] = rectOf(c);
  return { stock: rectOf(centreEl.querySelector('.cg-stock .cg-card')), pile: rectOf(centreEl.querySelector('.cg-pile .top')), seats, hand };
}

const seatTarget = (s) => {
  const b = seatsEl.querySelector(`[data-seat="${s}"]`);
  return b?.querySelector('.cg-backs .cg-card:last-child') || b;
};



async function flyEvents(events, before) {
  const me = view ? view.you : -1;
  for (const e of events || []) {
    const mine = me >= 0 && e.seat === me;
    if (e.kind === 'draw') {
      const face = e.from === 'pile' ? e.card : (mine ? view.game.hand.drawn?.card : null);
      await flyCard({
        ghost: face ? cardEl(face, { kind: 'pile' }) : cardEl('back', { kind: 'pile', faceDown: true }),
        from: e.from === 'pile' ? before.pile : before.stock,
        target: mine ? handEl.querySelector('.drawn') : seatTarget(e.seat),
      });
    } else if (e.kind === 'discard') {
      await flyCard({
        ghost: cardEl(e.card, { kind: 'pile' }),
        from: mine ? before.hand[e.card] : before.seats[e.seat],
        target: centreEl.querySelector('.cg-pile .top'),
      });
    }
  }
}


let flying = Promise.resolve();
let timerGen = 0;

function refresh(move = null) {
  if (!match) return;
  
  
  view = viewForPeer(match, myId());
  if (net?.hosting) net.publish();
  draw();
  stopTimers();
  if (move) flying = flyEvents(move.events, move.before).catch(() => {}).then(() => wait(PACE.settle));
  const g = match.game;
  if (g.over) { flying.then(() => finished()); return; }
  if (g.hand.over) return;
  const id = actorId(match);
  if (id !== null && isBot(id)) {
    const gen = timerGen;
    const ms = g.hand.phase === 'draw' ? BOT_MS : BOT_THROW_MS;
    flying.then(() => { if (gen === timerGen) botTimer = setTimeout(botMove, ms); });
  }
}

function botMove() {
  botTimer = null;
  if (!match || match.game.over || match.game.hand.over) return;
  const id = actorId(match);
  if (!isBot(id)) return;
  const before = tableRects();
  const seat = seatOf(match, id);
  const choice = chooseAction(viewFor(match, seat), { level: botLevel(id), rng: botRng(id) });
  let r = choice ? act(match, id, choice.action) : { error: 'no move' };
  if (r.error) {
    
    const h = match.game.hand;
    r = h.phase === 'draw' ? act(match, id, { type: 'draw', from: 'stock' }) : act(match, id, { type: 'discard', card: h.hands[seat].find((c) => !isJoker(c)) ?? h.hands[seat][0] });
    if (r.error) return;
  }
  match = r.match;
  sounds(match.game.events, match.game.over);
  noteEvents(match.game.events);
  refresh({ events: match.game.events, before });
}

function dealNext() {
  if (!match || match.game.over || !match.game.hand.over) return;
  match = nextHand(match);
  lastFlash = '';
  sfx.play('card');
  refresh();
}

function stopTimers() {
  timerGen += 1; 
  if (botTimer) clearTimeout(botTimer);
  botTimer = null;
}


function errorText(e) {
  if (/both comodines/i.test(e)) return T.twoJokers;
  if (/cannot cut/i.test(e)) return T.cannotCut;
  return T.notLegal;
}


function doAction(a) {
  if (!view) return false;
  
  if (watcher()) return false;
  if (isGuest()) {
    if (waitingAnswer) return false;
    waitingAnswer = true;
    
    
    
    const echo = echoView(view, a);
    if (echo) {
      confirmedView = view;
      view = echo;
      sounds([{ kind: a.type }], false);
    } else playUi('tap');
    if (echoTimer) clearTimeout(echoTimer);
    echoTimer = setTimeout(echoTimedOut, ECHO_TIMEOUT_MS);
    net.propose(a);
    draw();
    return true;
  }
  const before = tableRects();
  const r = act(match, myId(), a);
  if (r.error) { flash(errorText(r.error)); playUi('error'); return false; }
  match = r.match;
  sounds(match.game.events, match.game.over);
  noteEvents(match.game.events);
  refresh({ events: match.game.events, before });
  return true;
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
  const me = view.you;
  if (s === me) return T.you;
  const id = view.seats[s];
  const n = view.game.opts.players;
  
  
  if (me < 0) {
    const p = fill(T.playerN, { n: s + 1 });
    return isBot(id) ? `${p} (${T.bot})` : p;
  }
  const human = id && !isBot(id);
  if (n === 2) return human ? T.friendName : T.bot;
  
  const rel = (s - me + n) % n;
  const sameKind = [];
  for (let k = 1; k < n; k++) {
    const t = (me + k) % n;
    const tid = view.seats[t];
    if ((tid && !isBot(tid)) === human) sameKind.push(t);
  }
  const k = sameKind.indexOf(s);
  if (human) return sameKind.length > 1 ? fill(T.friendN, { n: k + 1 }) : T.friendName;
  return fill(T.botN, { n: k >= 0 ? k + 1 : rel });
}

const nameOfCard = (c) => (c ? cardName(T, c) : '');


function noteEvents(events) {
  const me = view ? view.you : -1;
  for (const e of events || []) {
    
    
    if ((e.kind === 'draw' || e.kind === 'discard') && e.seat === me) continue;
    if (e.seat === me && me >= 0) {
      if (e.kind === 'cut') { lastFlash = T.youCut; continue; }
      if (e.kind === 'conga') { lastFlash = T.youConga; continue; }
      if (e.kind === 'out') { lastFlash = fill(T.youOutN, { n: e.score }); continue; }
      if (e.kind === 'rejoin') { lastFlash = fill(T.youRejoin, { n: e.score }); continue; }
    }
    if (e.kind === 'draw') lastFlash = e.from === 'pile' ? fill(T.tookPile, { who: seatName(e.seat), card: nameOfCard(e.card) }) : fill(T.drewStock, { who: seatName(e.seat) });
    else if (e.kind === 'discard') lastFlash = fill(T.threw, { who: seatName(e.seat), card: nameOfCard(e.card) });
    else if (e.kind === 'cut') lastFlash = fill(T.cutBy, { who: seatName(e.seat) });
    else if (e.kind === 'conga') lastFlash = fill(T.congaBy, { who: seatName(e.seat) });
    else if (e.kind === 'out') lastFlash = fill(T.outBy, { who: seatName(e.seat), n: e.score });
    else if (e.kind === 'rejoin') lastFlash = fill(T.rejoinBy, { who: seatName(e.seat), n: e.score });
  }
  flashEl.textContent = lastFlash;
}




function sounds(events, over) {
  const list = events || [];
  const e = list[list.length - 1];
  if (!e || over) return;
  if (e.kind === 'draw') sfx.play('draw');
  else if (e.kind === 'hand' || e.kind === 'cut') {
    if (view && e.cutter === view.you && view.you >= 0) sfx.play('win'); else sfx.play('card');
  } else sfx.play('card');
}

let flashTimer = null;
function flash(text, ms = 2800) {
  flashEl.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashEl.textContent = lastFlash; }, ms);
}


const screenW = () => Math.min(window.innerWidth || 400, 900);


let fitScale = 1;

const widthFor = (kind) => {
  const w = screenW();
  let base;
  if (kind === 'hand') base = Math.max(56, Math.min(84, Math.floor(w / 5.2)));
  else if (kind === 'pile') base = Math.max(50, Math.min(72, Math.floor(w / 7)));
  else if (kind === 'meld') base = Math.max(34, Math.min(46, Math.floor(w / 10)));
  else base = Math.max(22, Math.min(30, Math.floor(w / 15)));
  return Math.round(base * fitScale);
};

function cardEl(id, { kind = 'meld', onClick = null, faceDown = false } = {}) {
  const width = widthFor(kind);
  const label = faceDown ? T.faceDown : cardName(T, id);
  const known = faceDown ? atlas?.cards?.back : atlas?.cards?.[id];
  if (atlas && known) return makeCard(document, atlas, id, { width, label, faceDown, onClick, className: `cg-card cg-${kind}` });
  
  
  const el = document.createElement(onClick ? 'button' : 'div');
  el.className = `cg-card cg-${kind} cg-card-text`;
  if (onClick) { el.type = 'button'; el.addEventListener('click', onClick); }
  el.style.width = `${width}px`;
  el.style.height = `${Math.round(width * 1.55)}px`;
  el.textContent = faceDown ? '' : shortName(id);
  if (faceDown) el.classList.add('cg-card-back');
  el.dataset.card = faceDown ? 'back' : id;
  el.setAttribute('aria-label', label);
  return el;
}

const SUIT_LETTER = { e: 'E', b: 'B', o: 'O', c: 'C' };
const shortName = (id) => {
  const p = parseCard(id, DECK);
  if (!p) return '';
  if (p.joker) return '*';
  return `${p.rank}${SUIT_LETTER[p.suit]}`;
};


function sortedHand(cards) {
  const d = DECKS[DECK];
  const key = (id) => {
    const p = parseCard(id, d);
    if (!p) return 1e9;
    if (p.joker) return 1e6 + Number(id.slice(2));
    return d.suits.indexOf(p.suit) * 100 + d.ranks.indexOf(p.rank);
  };
  return sortHand(cards, { deck: DECK, key });
}

function myTurn() {
  if (!view || view.you < 0) return false;
  const g = view.game;
  return !g.over && !g.hand.over && g.hand.turn === view.you && !waitingAnswer
    && !(settings.mode === 'room' && view.seats.includes(''));
}


function myCut() {
  if (!myTurn() || view.game.hand.phase !== 'discard' || view.echo) return null;
  return findCut(view.game.hand.mine);
}

function scoreReadout(n) {
  const el = document.createElement('strong');
  el.className = 'cg-score-n';
  skin(el, 'readout');
  el.textContent = `${n}/${LIMIT}`;
  return el;
}

function statusBadge(s) {
  const g = view.game;
  if (g.out[s]) {
    const b = document.createElement('span');
    b.className = 'cg-tag out';
    skin(b, 'badge');
    b.textContent = T.outTag;
    return b;
  }
  if (g.rejoined[s]) {
    const b = document.createElement('span');
    b.className = 'cg-tag rejoined';
    skin(b, 'badge').classList.add('is-on');
    b.textContent = T.rejoinTag;
    return b;
  }
  return null;
}


function drawScore() {
  scoreEl.replaceChildren();
  if (!view) return;
  const g = view.game;
  const h = g.hand;
  if (view.you >= 0) {
    const me = view.you;
    const row = document.createElement('div');
    row.className = 'cg-score-row us';
    
    skin(row, 'plaque');
    row.classList.toggle('is-on', !h.over && h.turn === me);
    const name = document.createElement('span');
    name.className = 'cg-score-name';
    name.textContent = T.you;
    row.append(name, scoreReadout(g.scores[me]));
    const b = statusBadge(me);
    if (b) row.append(b);
    row.setAttribute('aria-label', `${T.you}: ${g.scores[me]} / ${LIMIT}`);
    scoreEl.append(row);
  }
  const to = document.createElement('div');
  to.className = 'cg-score-to';
  to.textContent = fill(T.handNo, { n: g.handNo + 1 });
  scoreEl.append(to);
}


function drawSeats() {
  seatsEl.replaceChildren();
  if (!view) return;
  const g = view.game;
  const h = g.hand;
  const n = g.opts.players;
  const watching = view.you < 0;
  seatsEl.dataset.n = String(watching ? n : n - 1);
  for (let k = watching ? 0 : 1; k < n; k++) {
    const s = watching ? k : (view.you + k + n) % n;
    const box = document.createElement('div');
    box.className = 'cg-seat';
    skin(box, 'plaque');
    const turn = !h.over && h.turn === s;
    box.classList.toggle('turn', turn);
    box.classList.toggle('is-on', turn);
    box.classList.toggle('is-out', !!g.out[s]);
    box.dataset.seat = String(s);
    const top = document.createElement('div');
    top.className = 'cg-seat-top';
    const name = document.createElement('span');
    name.className = 'cg-seat-name';
    name.textContent = seatName(s);
    top.append(name);
    box.append(top);
    
    
    const mid = document.createElement('div');
    mid.className = 'cg-seat-mid';
    if (!g.out[s]) {
      const backs = document.createElement('div');
      backs.className = 'cg-backs';
      backs.style.setProperty('--cg-mini', `${widthFor('mini')}px`);
      for (let c = 0; c < h.counts[s]; c++) backs.append(cardEl('back', { kind: 'mini', faceDown: true }));
      backs.setAttribute('aria-label', fill(T.cardsN, { n: h.counts[s] }));
      mid.append(backs);
    }
    mid.append(scoreReadout(g.scores[s]));
    box.append(mid);
    const badge = statusBadge(s);
    if (badge) box.append(badge);
    if (!g.out[s]) {
      
      
      const known = (h.known[s] || []);
      if (known.length) {
        const kn = document.createElement('div');
        kn.className = 'cg-known';
        const l = document.createElement('span');
        l.className = 'cg-known-label';
        l.textContent = T.seenTaking;
        kn.append(l);
        for (const c of known) kn.append(cardEl(c, { kind: 'mini' }));
        box.append(kn);
      }
    }
    box.setAttribute('aria-label', `${seatName(s)}: ${g.scores[s]} / ${LIMIT}, ${fill(T.cardsN, { n: h.counts[s] })}`);
    seatsEl.append(box);
  }
}


function drawCentre() {
  centreEl.replaceChildren();
  if (!view) return;
  const h = view.game.hand;
  const turn = myTurn() && h.phase === 'draw';
  const stock = document.createElement('div');
  stock.className = 'cg-stack cg-stock';
  const sc = cardEl('back', { kind: 'pile', faceDown: true, onClick: turn ? () => doAction({ type: 'draw', from: 'stock' }) : null });
  if (turn) sc.classList.add('can');
  sc.setAttribute('aria-label', `${T.stock} (${h.stockCount})${turn ? ` - ${T.drawStock}` : ''}`);
  const sslot = document.createElement('div');
  sslot.className = 'cg-slot';
  skin(sslot, 'slot').classList.toggle('is-on', turn);
  sslot.append(sc);
  const sl = document.createElement('span');
  sl.className = 'cg-stack-label';
  sl.textContent = `${T.stock} ${h.stockCount}`;
  stock.append(sslot, sl);

  const pile = document.createElement('div');
  pile.className = 'cg-stack cg-pile';
  const top = h.pile[h.pile.length - 1];
  const canTake = turn && !!top;
  const pslot = document.createElement('div');
  pslot.className = 'cg-slot cg-pile-slot';
  skin(pslot, 'slot').classList.toggle('is-on', canTake);
  if (!top) {
    const e = document.createElement('span');
    e.className = 'cg-empty';
    e.textContent = T.pileEmpty;
    pslot.append(e);
  } else {
    
    if (h.pile.length > 1) {
      const under = cardEl(h.pile[h.pile.length - 2], { kind: 'pile' });
      under.classList.add('under');
      under.setAttribute('aria-hidden', 'true');
      pslot.append(under);
    }
    const tc = cardEl(top, { kind: 'pile', onClick: canTake ? () => doAction({ type: 'draw', from: 'pile' }) : null });
    tc.classList.add('top');
    if (canTake) { tc.classList.add('can'); tc.setAttribute('aria-label', `${T.takePile}: ${cardName(T, top)}`); }
    if (echoed(top)) tc.classList.add('echo');
    pslot.append(tc);
  }
  const pl = document.createElement('span');
  pl.className = 'cg-stack-label';
  pl.textContent = `${T.pile} (${h.pile.length})`;
  pile.append(pslot, pl);
  centreEl.append(stock, pile);
}

function drawHand() {
  handEl.replaceChildren();
  if (!view || view.you < 0) return;
  const h = view.game.hand;
  const cards = sortedHand(h.mine);
  const canThrow = myTurn() && h.phase === 'discard' && !view.echo;
  
  
  const inMeld = new Set(cards.length ? bestMelds(cards).melds.flat() : []);
  const w = widthFor('hand');
  const total = cards.length + (view.echo?.incoming || 0);
  
  
  const avail = Math.max(w, (handEl.clientWidth || screenW() - 48) - 4);
  const step = total > 1 ? Math.min(w + 6, Math.floor((avail - w) / (total - 1))) : w;
  handEl.style.setProperty('--cg-fan', `${step - w}px`);
  for (const c of cards) {
    const el = cardEl(c, { kind: 'hand', onClick: canThrow ? () => doAction({ type: 'discard', card: c }) : null });
    el.classList.toggle('in-meld', inMeld.has(c));
    el.classList.toggle('wildcard', isJoker(c));
    if (h.drawn && h.drawn.card === c) el.classList.add('drawn');
    el.dataset.id = c;
    if (echoed(c)) el.classList.add('echo');
    handEl.append(el);
  }
  
  for (let k = 0; k < (view.echo?.incoming || 0); k++) {
    const el = cardEl('back', { kind: 'hand', faceDown: true });
    el.classList.add('echo', 'incoming');
    handEl.append(el);
  }
}


const echoed = (c) => !!view?.echo && view.echo.cards.includes(c);

const ACT_ICON = { stock: 'draw_card', pile: 'take_pile', cut: 'check' };

function drawActions() {
  actionsEl.replaceChildren();
  if (!view || view.you < 0) return;
  const h = view.game.hand;
  const add = (key, text, fn, { primary = false, disabled = false } = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `cg-btn cg-act${primary ? ' primary' : ''}`;
    
    skin(b, primary ? 'button_primary' : 'button_secondary', ACT_ICON[key]);
    b.dataset.action = key;
    b.textContent = text;
    b.disabled = disabled || waitingAnswer;
    b.addEventListener('click', fn);
    actionsEl.append(b);
  };
  const note = (text, cls = '') => {
    const p = document.createElement('span');
    p.className = `cg-note${cls ? ` ${cls}` : ''}`;
    p.textContent = text;
    actionsEl.append(p);
  };
  if (myTurn() && h.phase === 'draw') {
    add('stock', T.drawStock, () => doAction({ type: 'draw', from: 'stock' }), { primary: true });
    const top = h.pile[h.pile.length - 1];
    if (top) add('pile', T.takePile, () => doAction({ type: 'draw', from: 'pile' }));
    return;
  }
  const cut = myCut();
  if (cut) {
    add('cut', T.cut, () => doAction({ type: 'cut' }), { primary: true });
    
    
    note(cut.conga ? T.cutConga : cut.points === 0 ? T.cutAll : fill(T.cutHint, { n: cut.points }), 'cg-cut-hint');
    return;
  }
  
  if (h.mine.length && !h.over) note(fill(T.leftNow, { n: bestMelds(h.mine).points }));
}


function drawResult() {
  resultEl.replaceChildren();
  const h = view?.game.hand;
  const wasHidden = resultEl.hidden;
  resultEl.hidden = !(h && h.over && h.result);
  if (resultEl.hidden) return;
  
  if (wasHidden) setTimeout(() => { try { resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {  } }, 60);
  const g = view.game;
  const R = h.result;
  const head = document.createElement('h2');
  head.textContent = fill(T.handOver, { n: g.handNo + 1 });
  resultEl.append(head);
  const list = document.createElement('div');
  list.className = 'cg-shows';
  const cards = (ids, cls) => {
    const row = document.createElement('div');
    row.className = `cg-group ${cls}`;
    for (const c of ids) row.append(cardEl(c, { kind: 'meld' }));
    return row;
  };
  for (const sh of R.shows) {
    const box = document.createElement('section');
    box.className = 'cg-show';
    box.classList.toggle('cutter', sh.seat === R.cutter);
    box.classList.toggle('mine', sh.seat === view.you);
    const top = document.createElement('div');
    top.className = 'cg-show-top';
    const name = document.createElement('span');
    name.className = 'cg-show-name';
    name.textContent = seatName(sh.seat);
    top.append(name);
    if (sh.seat === R.cutter) {
      const t = document.createElement('span');
      t.className = `cg-tag ${R.conga ? 'conga' : 'cutter'}`;
      skin(t, 'badge').classList.add('is-on');
      t.textContent = R.conga ? T.congaTag : T.cutterTag;
      top.append(t);
    }
    const pts = document.createElement('strong');
    pts.className = 'cg-show-points';
    pts.classList.toggle('minus', sh.points < 0);
    skin(pts, 'readout');
    pts.textContent = sh.points > 0 ? `+${sh.points}` : String(sh.points);
    if (sh.points < 0) pts.title = T.allCombined;
    top.append(pts);
    box.append(top);
    const body = document.createElement('div');
    body.className = 'cg-show-body';
    const labelled = (label, node) => {
      const w = document.createElement('div');
      w.className = 'cg-show-part';
      const l = document.createElement('span');
      l.className = 'cg-show-label';
      l.textContent = label;
      w.append(l, node);
      return w;
    };
    if (sh.melds.length) {
      const m = document.createElement('div');
      m.className = 'cg-melds';
      for (const meld of sh.melds) m.append(cards(sortedHand(meld), 'meld'));
      body.append(labelled(T.colCombos, m));
    }
    if (sh.laid.length) body.append(labelled(T.colLaid, cards(sh.laid, 'laid')));
    if (sh.left.length) body.append(labelled(T.colLoose, cards(sortedHand(sh.left), 'loose')));
    else {
      const none = document.createElement('span');
      none.className = 'cg-none';
      none.textContent = sh.points < 0 ? T.allCombined : T.nothingLeft;
      body.append(labelled(T.colLoose, none));
    }
    box.append(body);
    const tot = document.createElement('div');
    tot.className = 'cg-show-total';
    tot.textContent = `${T.colTotal}: ${g.scores[sh.seat]}/${LIMIT}`;
    const b = statusBadge(sh.seat);
    if (b) tot.append(' ', b);
    box.append(tot);
    list.append(box);
  }
  resultEl.append(list);
}

function statusText() {
  if (!view) return settings.mode === 'room' && room.active ? T.waitingHost : '';
  const g = view.game;
  
  
  if (watcher() && !g.over) return T.watching;
  if (settings.mode === 'room' && view.seats.includes('')) return T.waiting;
  if (g.over) {
    if (view.you < 0) return fill(T.winsGame, { who: seatName(g.winner) });
    return g.winner === view.you ? T.youWinGame : T.youLoseGame;
  }
  const h = g.hand;
  if (h.over) return fill(T.handOver, { n: g.handNo + 1 });
  if (view.you >= 0 && g.out[view.you]) return T.youOut;
  if (h.turn === view.you) {
    if (h.phase === 'draw') return T.yourTurnDraw;
    return myCut() ? T.yourTurnDiscard : T.yourTurnDiscardNoCut;
  }
  return fill(T.turnOf, { who: seatName(h.turn) });
}

function draw() {
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-size]')) b.setAttribute('aria-pressed', String(Number(b.dataset.size) === settings.size));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  reengEl.checked = settings.reenganche;
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  const watching = watcher();
  reengEl.disabled = isGuest() || watching;
  
  $('copy-link').hidden = watching;
  const watchersEl = $('watchers');
  watchersEl.textContent = watchingLabel(T.watchers, room.active ? (net?.watchers ?? 0) : 0);
  watchersEl.hidden = !watchersEl.textContent;
  
  handEl.hidden = watching;
  actionsEl.hidden = watching;
  statusEl.textContent = statusText();
  
  $('new-game').hidden = watching;
  
  
  document.querySelector('.cg-foot').hidden = watching;
  again.update(!!view?.game.over && !watching);
  $('table').classList.toggle('my-turn', myTurn());
  drawScore();
  drawSeats();
  drawCentre();
  drawHand();
  drawActions();
  drawResult();
  const h = view?.game.hand;
  nextEl.hidden = !(view && h && h.over && !view.game.over && !isGuest() && !watching);
  fit.refit();
}


function finished() {
  if (!view || finishedRound === gameRound) return;
  finishedRound = gameRound;
  const g = view.game;
  const me = view.you;
  if (me < 0) return;
  const result = g.winner === me ? 'won' : 'lost';
  sfx.play(result === 'won' ? 'win' : 'lose');
  const turn = reportGate.take();
  if (turn) {
    const n = g.opts.players;
    
    const oppSeat = g.winner !== null && g.winner !== me ? g.winner : (me + 1) % n;
    const arg = twoSeatMatch({
      game: GAME_ID, seats: [view.seats[me], view.seats[oppSeat]], me: view.seats[me], result,
      isBot: (id) => isBot(id) || !id, cardFor: (id) => CARDS.get(id), online: settings.mode === 'room',
      startSeats: turn.startSeats ? [turn.startSeats[me], turn.startSeats[oppSeat]] : undefined,
      myDev: deviceId(), hosting: !!net?.hosting, seconds: (Date.now() - startedAt) / 1000,
    });
    if (arg) reportMatch(arg).catch(() => {});
  }
  const conga = (g.events || []).some((e) => e.kind === 'conga');
  trackEvent('conga_finished', {
    mode: settings.mode, players: g.opts.players, level: settings.level, reenganche: g.opts.reenganche,
    result, conga, score: g.scores[me], hands: g.handNo + 1,
  });
}


function restartSolo() {
  if (settings.mode === 'room') return;
  newMatch();
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
for (const b of document.querySelectorAll('[data-size]')) {
  b.addEventListener('click', () => {
    if (room.active) return;
    settings.size = Number(b.dataset.size);
    persist();
    playUi('toggleOn');
    if (settings.mode === 'bot') restartSolo(); else draw();
  });
}
for (const b of document.querySelectorAll('[data-level]')) {
  b.addEventListener('click', () => {
    settings.level = b.dataset.level;
    persist();
    playUi('toggleOn');
    if (settings.mode === 'bot') restartSolo();
    else if (match && !isGuest()) {
      
      match = { ...match, seats: match.seats.map((s) => (isBot(s) ? `bot:${settings.level}#${s.split('#')[1]}` : s)) };
      refresh();
    }
  });
}
reengEl.addEventListener('change', () => {
  settings.reenganche = reengEl.checked;
  persist();
  playUi(reengEl.checked ? 'toggleOn' : 'toggleOff');
  if (settings.mode === 'bot') restartSolo(); else if (room.active && net?.hosting) newMatch();
});
nextEl.addEventListener('click', () => { if (!isGuest()) dealNext(); });
$('new-game').addEventListener('click', () => {
  if (watcher()) return;
  playUi('tap');
  if (isGuest()) { net.propose({ type: 'rematch' }); return; }
  if (match && settings.mode === 'room') { stopTimers(); begin(rematch(match, freshSeed())); return; }
  if (settings.mode === 'room') { flash(T.waiting); return; }
  newMatch();
});
window.addEventListener('resize', () => draw());


const codeOf = (id) => String(id ?? '').replace(/^fcg-/i, '').toUpperCase();
const freshMatch = (m) => m.game.handNo === 0 && m.game.hand.turns === 0 && m.game.hand.phase === 'draw';

function onProposal(action, from) {
  if (!match) return;
  if (action.type === 'rematch') {
    if (match.game.over) { stopTimers(); begin(rematch(match, freshSeed())); }
    else net?.publish();
    return;
  }
  const r = act(match, from, action);
  
  
  if (r.error) { net?.refuse(from); return; }
  match = r.match;
  sounds(match.game.events, match.game.over);
  noteEvents(match.game.events);
  refresh();
}

function onView(v, meta = {}) {
  
  const before = confirmedView ?? view;
  const echoed = confirmedView ? view.echo : null;
  clearEcho();
  waitingAnswer = false;
  view = v;
  if (echoed && meta?.nack) rollBack();
  
  
  settings.size = v.game.opts.players;
  settings.reenganche = v.game.opts.reenganche;
  if (!before || (v.game.handNo === 0 && before.game.handNo > 0) || (before.game.over && !v.game.over)) {
    gameRound += 1;
    reportGate.begin(v.seats);
    startedAt = Date.now();
  }
  if (!before || v.game.handNo !== before.game.handNo) lastFlash = '';
  noteEvents(v.game.events);
  
  const last = v.game.events[v.game.events.length - 1];
  const heard = echoed && !meta?.nack && last && last.seat === v.you && last.kind === echoed.type;
  if (before && !heard && JSON.stringify(before.game.events) !== JSON.stringify(v.game.events)) sounds(v.game.events, v.game.over);
  draw();
  if (v.game.over) finished();
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
        
        match = { ...match, seats: [room.me, ...match.seats.slice(1)] };
        reportGate.begin(match.seats);
        refresh();
        return;
      }
      draw();
    },
    onArrival: (who) => {
      if (!match) return;
      if (freshMatch(match)) {
        const seats = seatsWith(match.seats, who, false);
        if (seats !== match.seats) {
          stopTimers();
          begin(createMatch({ seats, reenganche: match.game.opts.reenganche, seed: freshSeed() }));
          return;
        }
      } else if (match.seats.includes('') && match.game.opts.players === 2) {
        
        stopTimers();
        begin(createMatch({ seats: seatsWith(match.seats, who, false), reenganche: match.game.opts.reenganche, seed: freshSeed() }));
        return;
      } else {
        queuedArrivals.push(who);
        flash(T.seatNext, 4000);
      }
      net?.publish();
    },
    onDeparture: (who) => {
      if (!match) return;
      queuedArrivals = queuedArrivals.filter((x) => x !== who);
      const k = match.seats.indexOf(who);
      if (k > 0) {
        
        const seats = match.seats.slice();
        seats[k] = `bot:${settings.level}#${k}`;
        match = { ...match, seats };
        refresh();
      }
    },
    
    
    
    
    
    onUnseat: (who) => {
      if (!match) return;
      queuedArrivals = queuedArrivals.filter((x) => x !== who);
      const k = match.seats.indexOf(who);
      if (k <= 0) return;
      const seats = match.seats.slice();
      if (freshMatch(match)) {
        seats[k] = match.game.opts.players === 2 ? '' : `bot:${settings.level}#${k}`;
        stopTimers();
        begin(createMatch({ seats, reenganche: match.game.opts.reenganche, seed: freshSeed() }));
        return;
      }
      seats[k] = `bot:${settings.level}#${k}`;
      match = { ...match, seats };
      refresh();
    },
    onStatus: (kind, detail) => {
      if (kind === 'open') flash(T.waiting, 4000);
      else if (kind === 'joined' && !room.watching) flash(T.joined);
      else if (kind === 'failed') flash(T.badCode, 4000);
      else if (kind === 'host' && detail?.iAmHost && view && !match) {
        
        
        
        const seats = view.seats.map((s, i) => (s === detail.previousHost || !s ? `bot:${settings.level}#${i}` : s));
        settings.size = seats.length;
        flash(T.hostLeft, 5000);
        begin(createMatch({ seats, reenganche: view.game.opts.reenganche, seed: freshSeed() }));
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
  const seats = settings.size === 2 ? [HOST, ''] : botSeats(settings.size, settings.level, HOST);
  begin(createMatch({ seats, reenganche: settings.reenganche, seed: freshSeed() }));
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
  const link = shareLinkFor(base, net.hosting ? net.id : `fcg-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});



$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `fcg-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.watchCopied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });

foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Congawise' });



const linkRoom = roomFromHref(location.href);


afterBoot(() => countPlay('conga', { isHost: !linkRoom }));



const atlasReady = loadAtlas(DECK_URL).then((a) => { atlas = a; draw(); }).catch(() => {  });
Promise.race([atlasReady, new Promise((r) => { setTimeout(r, 4000); })]).then(() => { fit.refit({ grow: true }); bootDone(); });

function boot() {
  if (linkRoom) {
    settings.mode = 'room';
    if (!joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH })) { settings.mode = 'bot'; newMatch({ cheats: true }); }
    return;
  }
  if (params.get('mode') === 'room') { settings.mode = 'room'; draw(); return; }
  newMatch({ cheats: true });
}
boot();

trackEvent('game_start', { game: GAME_ID, mode: settings.mode, players: settings.size });



globalThis.congawise = Object.freeze({
  ready: () => !!view,
  mode: () => settings.mode,
  size: () => (view ? view.game.opts.players : settings.size),
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  myTurn: () => myTurn(),
  canCut: () => !!myCut(),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  scores: () => (view ? view.game.scores.slice() : null),
  over: () => !!view?.game.over,
  atlas: () => !!atlas,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [], watchers: net?.watchers ?? 0, watcher: watcher() }),
  act: (a) => doAction(a),
  deal: () => { if (!isGuest()) dealNext(); },
});
