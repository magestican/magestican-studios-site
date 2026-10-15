




















import {
  createMatch, act, nextHand, rematch, viewFor, actorId, seatOf, isBot, botLevel, seatsWith,
} from '../../../web-engine/buraco/buracoMatch.js';
import { meldInfo, teamOf, TARGETS, isWildCard } from '../../../web-engine/buraco/buracoRules.js';
import { botAction, LEVELS } from '../../../web-engine/buraco/buracoBot.js';
import { loadAtlas, makeCard } from '../../../web-engine/cards/cardArt.js';
import { sortHand, parseCard, rngFrom, DECKS } from '../../../web-engine/cards/cards.js';
import { applyGameName, gameLang, localGameName } from '../../../web-engine/i18n/gameNames.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { playUi } from '../../../web-engine/brand/uiSound.js';
import { reportMatch } from '../../../web-engine/progress/report.js';
import { CARDS, deviceId } from '../../../web-engine/progress/peerCards.js';
import { twoSeatMatch, createReportGate } from '../../../web-engine/progress/matchArgs.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { shareLinkFor, joinIdFrom } from '../../../web-engine/words/coop.js';
import { roomPresence } from '../../shared/net/roomPresence.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { wireTrackButton } from '../../shared/ui/trackButton.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, cardName } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'buraco';
const SETTINGS_KEY = 'buracowise-settings-v1';
const SOLO = 'you';
const HOST = 'host';      
const BOT_MS = 750;       
const BOT_PLAY_MS = 420;  
const DECK_URL = '../shared/cards/french52/deck.json';

const lang = gameLang();


const MUSIC_NAMES = { main: 'Bossa nova', local: 'Pagode' };
const music = createTrackMusic({
  game: 'buraco', lang, homeLang: 'pt',
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});

const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), ['card', 'draw', 'meld', 'canastra', 'win', 'lose']);
const T = stringsFor(lang);
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Buracowise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const handEl = $('hand');
const actionsEl = $('actions');
const scoreEl = $('score');
const seatsEl = $('seats');
const centreEl = $('centre');
const meldsEl = $('melds');
const resultEl = $('result');
const nextEl = $('next-hand');
const roomEl = $('room');
const targetEl = $('target');
const sortEl = $('sort');


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
$('table').setAttribute('aria-label', T.tableLabel);
const GAME_NAME = localGameName(GAME_ID, lang);
for (const n of TARGETS) {
  const o = document.createElement('option');
  o.value = String(n);
  o.textContent = fill(T.pointsN, { n });
  targetEl.append(o);
}


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };
const params = new URLSearchParams(location.search);
const saved = load(SETTINGS_KEY, {});
const pick = (v, list, d) => (list.includes(v) ? v : d);
const modeParam = params.get('mode');
const settings = {
  mode: 'bot',
  size: modeParam === '2v2' ? 4 : modeParam === '1v1' ? 2 : pick(saved.size, [2, 4], 2),
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'medium')),
  target: pick(Number(params.get('to')), TARGETS, pick(saved.target, TARGETS, 3000)),
  sort: pick(saved.sort, ['suit', 'rank'], 'suit'),
};


const persist = () => save(SETTINGS_KEY, { size: settings.size, level: settings.level, target: settings.target, sort: settings.sort });

const seedParam = params.get('seed');
let seedCounter = Number(seedParam) || 0;
function freshSeed() {
  if (seedParam !== null) { seedCounter += 1; return seedCounter; }
  try { return crypto.getRandomValues(new Uint32Array(1))[0] || 1; } catch { return (Math.random() * 2 ** 32) >>> 0 || 1; }
}
const handParam = (params.get('hand') ?? '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const mortoParam = params.get('morto') === '1';


let match = null;   
let view = null;    
let atlas = null;
let net = null;
let botTimer = null;
let waitingAnswer = false;   
let lastFlash = '';
let finishedRound = -1;
let gameRound = 0;
let queuedArrivals = [];
let selected = new Set();
const room = { active: false, me: null, peers: [], code: null };



const presence = roomPresence({
  game: 'buraco',
  net: () => net,
  players: () => new Set([room.me, ...room.peers].filter(Boolean)).size || 1,
  ids: () => [room.me, ...room.peers].filter(Boolean),
});
const reportGate = createReportGate();
let startedAt = Date.now();
const botRngs = new Map();

const isGuest = () => settings.mode === 'room' && room.active && net && !net.hosting;
const myId = () => (settings.mode === 'room' ? (room.me ?? HOST) : SOLO);

function botSeats(size, level, first) {
  const seats = [first];
  for (let s = 1; s < size; s++) seats.push(`bot:${level}#${s}`);
  return seats;
}

function botRng(id) {
  if (!botRngs.has(id)) botRngs.set(id, seedParam !== null ? rngFrom((Number(seedParam) || 1) * 97 + botRngs.size + 1) : Math.random);
  return botRngs.get(id);
}


function begin(m) {
  match = m;
  gameRound += 1;
  selected = new Set();
  reportGate.begin(match.seats);
  startedAt = Date.now();
  refresh();
}

function newMatch({ cheats = false } = {}) {
  stopTimers();
  const first = settings.mode === 'room' ? myId() : SOLO;
  const seats = settings.mode === 'room' && settings.size === 2 ? [first, ''] : botSeats(settings.size, settings.level, first);
  begin(createMatch({
    seats, target: settings.target, seed: freshSeed(),
    fixedHand: cheats && handParam.length ? handParam : null,
    mortoTaken: cheats && mortoParam,
  }));
}


function refresh() {
  if (!match) return;
  const me = seatOf(match, myId());
  view = viewFor(match, me < 0 ? 0 : me);
  if (net?.hosting) net.publish();
  pruneSelection();
  draw();
  stopTimers();
  const g = match.game;
  if (g.over) { finished(); return; }
  if (g.hand.over) return;
  const id = actorId(match);
  if (id !== null && isBot(id)) botTimer = setTimeout(botMove, g.hand.phase === 'draw' ? BOT_MS : BOT_PLAY_MS);
}

function botMove() {
  botTimer = null;
  if (!match || match.game.over || match.game.hand.over) return;
  const id = actorId(match);
  if (!isBot(id)) return;
  const seat = seatOf(match, id);
  const a = botAction(viewFor(match, seat), botLevel(id), botRng(id));
  let r = act(match, id, a);
  if (r.error) {
    
    const h = match.game.hand;
    r = h.phase === 'draw' ? act(match, id, { type: 'draw' }) : act(match, id, { type: 'discard', card: h.hands[seat][0] });
    if (r.error) return;
  }
  match = r.match;
  sounds(match.game.events);
  noteEvents(match.game.events);
  refresh();
}

function dealNext() {
  if (!match || match.game.over || !match.game.hand.over) return;
  let m = nextHand(match);
  
  for (const who of queuedArrivals) m = { ...m, seats: seatsWith(m.seats, who, false) };
  queuedArrivals = [];
  match = m;
  lastFlash = '';
  selected = new Set();
  sfx.play('card');
  refresh();
}

function stopTimers() {
  if (botTimer) clearTimeout(botTimer);
  botTimer = null;
}


function errorText(e) {
  if (/cannot go out/i.test(e)) return T.cannotOut;
  if (/A jogo is/i.test(e)) return T.badMeld;
  if (/do not fit/i.test(e)) return T.noFit;
  return T.notLegal;
}


function doAction(a) {
  if (!view) return false;
  if (isGuest()) {
    if (waitingAnswer) return false;
    waitingAnswer = true;
    net.propose(a);
    playUi('tap');
    draw();
    return true;
  }
  const r = act(match, myId(), a);
  if (r.error) { flash(errorText(r.error)); playUi('error'); return false; }
  match = r.match;
  if (a.type !== 'draw' && a.type !== 'take') selected = new Set();
  sounds(match.game.events);
  noteEvents(match.game.events);
  refresh();
  return true;
}


function seatName(s) {
  if (!view) return '';
  const me = view.you;
  if (s === me) return T.you;
  const id = view.seats[s];
  const n = view.game.opts.players;
  if (n === 2) return id && !isBot(id) ? T.friendName : T.bot;
  const rel = (s - me + 4) % 4;
  const pos = rel === 1 ? T.left : rel === 2 ? T.partner : T.right;
  return id && !isBot(id) ? `${T.friendName} (${pos})` : pos;
}

function teamName(t) {
  if (!view) return '';
  const mine = teamOf(Math.max(0, view.you));
  if (view.game.opts.players === 2) return t === mine ? T.you : seatName(1 - Math.max(0, view.you));
  return t === mine ? T.us : T.them;
}


function noteEvents(events) {
  for (const e of events || []) {
    if (e.type === 'take') lastFlash = fill(T.tookPile, { who: seatName(e.seat), n: (e.cards || []).length });
    else if (e.type === 'meld' && e.canastra) lastFlash = fill(T.canastraBy, { who: seatName(e.seat) });
    else if (e.type === 'layoff' && e.canastra) lastFlash = fill(T.canastraBy, { who: seatName(e.seat) });
    else if (e.type === 'meld') lastFlash = fill(T.melded, { who: seatName(e.seat) });
    else if (e.type === 'morto') lastFlash = fill(T.tookMorto, { who: seatName(e.seat) });
    else if (e.type === 'batida') lastFlash = fill(T.wentOut, { who: seatName(e.seat) });
    else if (e.type === 'handOver' && e.reason === 'stock') lastFlash = T.stockOut;
  }
  flashEl.textContent = lastFlash;
}

function sounds(events) {
  const e = (events || [])[events.length - 1];
  if (!e) return;
  
  
  
  if (e.canastra || e.type === 'morto' || e.type === 'batida' || e.type === 'handOver') sfx.play('canastra');
  else if (e.type === 'meld' || e.type === 'layoff') sfx.play('meld');
  else if (e.type === 'draw' || e.type === 'take' || e.type === 'mortoStock') sfx.play('draw');
  else sfx.play('card');
}

let flashTimer = null;
function flash(text, ms = 2800) {
  flashEl.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashEl.textContent = lastFlash; }, ms);
}


const screenW = () => Math.min(window.innerWidth || 400, 900);

const widthFor = (kind) => {
  const w = screenW();
  if (kind === 'hand') return Math.max(56, Math.min(84, Math.floor(w / 6.2)));
  if (kind === 'meld') return Math.max(40, Math.min(58, Math.floor(w / 9.5)));
  if (kind === 'pile') return Math.max(46, Math.min(64, Math.floor(w / 8)));
  return Math.max(26, Math.min(36, Math.floor(w / 14)));
};

function cardEl(id, { kind = 'meld', onClick = null, faceDown = false } = {}) {
  const width = widthFor(kind);
  const label = faceDown ? T.faceDown : cardName(T, id);
  if (atlas) return makeCard(document, atlas, id, { width, label, faceDown, onClick, className: `bu-card bu-${kind}` });
  
  const el = document.createElement(onClick ? 'button' : 'div');
  el.className = `bu-card bu-${kind} bu-card-text`;
  if (onClick) { el.type = 'button'; el.addEventListener('click', onClick); }
  el.style.width = `${width}px`;
  el.style.height = `${Math.round(width * 1.55)}px`;
  el.textContent = faceDown ? '' : shortName(id);
  if (faceDown) el.classList.add('bu-card-back');
  el.setAttribute('aria-label', label);
  return el;
}

const shortName = (id) => {
  const p = parseCard(id, 'french52');
  if (!p) return '';
  if (p.joker) return '*';
  return `${p.rank}${{ S: '♠', H: '♥', D: '♦', C: '♣' }[p.suit]}`;
};


function sortedHand(cards) {
  const d = DECKS.french52;
  const key = (id) => {
    const p = parseCard(id, d);
    if (!p) return 1e9;
    if (p.joker) return 1e6 + 1;
    if (p.rank === '2') return 1e6 - 10 + d.suits.indexOf(p.suit);
    const r = d.ranks.indexOf(p.rank);
    const s = d.suits.indexOf(p.suit);
    return settings.sort === 'rank' ? r * 10 + s : s * 100 + r;
  };
  return sortHand(cards, { deck: 'french52', key });
}

function myTurn() {
  if (!view || view.you < 0) return false;
  const g = view.game;
  return !g.over && !g.hand.over && g.hand.turn === view.you && !waitingAnswer
    && !(settings.mode === 'room' && view.seats.includes(''));
}

function pruneSelection() {
  if (!view) { selected = new Set(); return; }
  const mine = new Set(view.game.hand.mine);
  selected = new Set([...selected].filter((c) => mine.has(c)));
}

function drawScore() {
  scoreEl.replaceChildren();
  if (!view) return;
  const g = view.game;
  const h = g.hand;
  const mine = teamOf(Math.max(0, view.you));
  for (const t of [mine, 1 - mine]) {
    const row = document.createElement('div');
    row.className = `bu-score-row ${t === mine ? 'us' : 'them'}`;
    const name = document.createElement('span');
    name.className = 'bu-score-name';
    name.textContent = teamName(t);
    const n = document.createElement('strong');
    n.className = 'bu-score-n';
    n.textContent = String(g.scores[t]);
    const morto = document.createElement('span');
    morto.className = `bu-morto-tag ${h.mortoTaken[t] ? 'taken' : 'waiting'}`;
    morto.textContent = h.mortoTaken[t] ? T.mortoTaken : T.mortoWaiting;
    row.append(name, n, morto);
    row.setAttribute('aria-label', `${teamName(t)}: ${g.scores[t]} ${fill(T.pointsTo, { n: g.opts.target })}`);
    scoreEl.append(row);
  }
  const to = document.createElement('div');
  to.className = 'bu-score-to';
  to.textContent = `${fill(T.handNo, { n: g.handNo + 1 })} - ${fill(T.pointsTo, { n: g.opts.target })}`;
  scoreEl.append(to);
}

function drawSeats() {
  seatsEl.replaceChildren();
  if (!view) return;
  const g = view.game;
  const h = g.hand;
  const n = g.opts.players;
  for (let k = 1; k < n; k++) {
    const s = (view.you + k + n) % n;
    const box = document.createElement('div');
    box.className = 'bu-seat';
    box.classList.toggle('turn', !h.over && h.turn === s);
    box.classList.toggle('partner', teamOf(s) === teamOf(view.you));
    const name = document.createElement('span');
    name.className = 'bu-seat-name';
    name.textContent = seatName(s);
    const count = document.createElement('span');
    count.className = 'bu-seat-count';
    count.append(cardEl('back', { kind: 'mini', faceDown: true }));
    const c = document.createElement('span');
    c.textContent = fill(T.cardsN, { n: h.counts[s] });
    count.append(c);
    box.append(name, count);
    seatsEl.append(box);
  }
}

function drawCentre() {
  centreEl.replaceChildren();
  if (!view) return;
  const h = view.game.hand;
  const turn = myTurn() && h.phase === 'draw';
  
  const stock = document.createElement('div');
  stock.className = 'bu-stack bu-stock';
  const sc = cardEl('back', { kind: 'pile', faceDown: true, onClick: turn ? () => doAction({ type: 'draw' }) : null });
  if (turn) sc.classList.add('can');
  const sl = document.createElement('span');
  sl.className = 'bu-stack-label';
  sl.textContent = `${T.stock} ${h.stockCount}`;
  stock.append(sc, sl);
  
  const mortos = document.createElement('div');
  mortos.className = 'bu-stack bu-mortos';
  const mrow = document.createElement('div');
  mrow.className = 'bu-morto-row';
  for (let k = 0; k < h.mortosLeft; k++) mrow.append(cardEl('back', { kind: 'mini', faceDown: true }));
  const ml = document.createElement('span');
  ml.className = 'bu-stack-label';
  ml.textContent = `${T.mortoLabel}: ${fill(T.mortosLeft, { n: h.mortosLeft })}`;
  mortos.append(mrow, ml);
  
  const pile = document.createElement('div');
  pile.className = 'bu-stack bu-pile';
  const prow = document.createElement('div');
  prow.className = 'bu-pile-row';
  const canTake = turn && h.pile.length > 0;
  if (!h.pile.length) {
    const e = document.createElement('span');
    e.className = 'bu-empty';
    e.textContent = T.pileEmpty;
    prow.append(e);
  }
  h.pile.forEach((c, i) => {
    const el = cardEl(c, { kind: 'pile', onClick: canTake ? () => doAction({ type: 'take' }) : null });
    if (i === h.pile.length - 1) el.classList.add('top');
    prow.append(el);
  });
  if (canTake) prow.classList.add('can');
  const pl = document.createElement('span');
  pl.className = 'bu-stack-label';
  pl.textContent = `${T.pile} (${h.pile.length})`;
  pile.append(prow, pl);
  centreEl.append(stock, mortos, pile);
}

function badgeFor(info) {
  if (!info.ok || !info.canastra) return null;
  const b = document.createElement('span');
  b.className = `bu-badge bu-badge-${info.canastra}`;
  b.textContent = T[`can_${info.canastra}`];
  return b;
}

function drawMelds() {
  meldsEl.replaceChildren();
  if (!view) return;
  const h = view.game.hand;
  const mine = teamOf(Math.max(0, view.you));
  const canLay = myTurn() && h.phase === 'play' && selected.size > 0;
  for (const t of [1 - mine, mine]) {
    const sec = document.createElement('section');
    sec.className = `bu-team ${t === mine ? 'us' : 'them'}`;
    const head = document.createElement('h2');
    head.className = 'bu-team-head';
    head.textContent = fill(T.jogosOf, { who: teamName(t) });
    sec.append(head);
    const list = document.createElement('div');
    list.className = 'bu-meld-list';
    if (!h.melds[t].length) {
      const e = document.createElement('span');
      e.className = 'bu-empty';
      e.textContent = T.noJogos;
      list.append(e);
    }
    h.melds[t].forEach((m, k) => {
      const info = meldInfo(m);
      const own = t === mine;
      const box = document.createElement(own && canLay ? 'button' : 'div');
      box.className = 'bu-meld';
      if (own && canLay) {
        box.type = 'button';
        box.classList.add('can');
        box.addEventListener('click', () => layOff(k));
      }
      box.dataset.meld = String(k);
      box.dataset.team = String(t);
      if (info.canastra) box.classList.add(`canastra-${info.canastra}`);
      const row = document.createElement('div');
      row.className = 'bu-meld-cards';
      for (const c of info.ok ? info.order : m) {
        const el = cardEl(c, { kind: 'meld' });
        if (info.wild === c) el.classList.add('wild');
        row.append(el);
      }
      box.append(row);
      const b = badgeFor(info);
      if (b) box.append(b);
      box.setAttribute('aria-label', `${m.map((c) => cardName(T, c)).join(', ')}${info.canastra ? ` - ${T[`can_${info.canastra}`]}` : ''}`);
      list.append(box);
    });
    sec.append(list);
    meldsEl.append(sec);
  }
}

function drawHand() {
  handEl.replaceChildren();
  if (!view || view.you < 0) return;
  const cards = sortedHand(view.game.hand.mine);
  const canPick = myTurn() && view.game.hand.phase === 'play';
  for (const c of cards) {
    const el = cardEl(c, { kind: 'hand', onClick: canPick ? () => toggle(c) : null });
    el.classList.toggle('sel', selected.has(c));
    el.classList.toggle('wildcard', isWildCard(c));
    el.dataset.id = c;
    if (canPick) el.setAttribute('aria-pressed', String(selected.has(c)));
    handEl.append(el);
  }
}

function toggle(c) {
  if (selected.has(c)) selected.delete(c); else selected.add(c);
  playUi('tap');
  draw();
}

function layOff(k) {
  if (!selected.size) { flash(T.pickCards); return; }
  const h = view.game.hand;
  const own = h.melds[teamOf(view.you)][k];
  if (!own || !meldInfo([...own, ...selected]).ok) { flash(T.noFit); playUi('error'); return; }
  doAction({ type: 'layoff', meld: k, cards: [...selected] });
}

function drawActions() {
  actionsEl.replaceChildren();
  if (!view) return;
  const h = view.game.hand;
  const add = (key, text, fn, { primary = false, disabled = false } = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `bu-btn bu-act${primary ? ' primary' : ''}`;
    b.dataset.action = key;
    b.textContent = text;
    b.disabled = disabled || waitingAnswer;
    b.addEventListener('click', fn);
    actionsEl.append(b);
  };
  if (!myTurn()) return;
  if (h.phase === 'draw') {
    add('draw', T.draw, () => doAction({ type: 'draw' }), { primary: true });
    add('take', fill(T.take, { n: h.pile.length }), () => doAction({ type: 'take' }), { disabled: !h.pile.length });
    return;
  }
  const sel = [...selected];
  add('meld', T.meld, () => {
    if (sel.length < 3 || !meldInfo(sel).ok) { flash(T.badMeld); playUi('error'); return; }
    doAction({ type: 'meld', cards: sel });
  }, { primary: sel.length >= 3, disabled: sel.length < 3 });
  add('discard', T.discard, () => {
    if (sel.length !== 1) { flash(T.pickOne); playUi('error'); return; }
    doAction({ type: 'discard', card: sel[0] });
  }, { primary: sel.length === 1, disabled: sel.length !== 1 });
  add('clear', T.clear, () => { selected = new Set(); draw(); }, { disabled: !sel.length });
  const count = document.createElement('span');
  count.className = 'bu-selcount';
  count.textContent = sel.length ? fill(T.selectedN, { n: sel.length }) : '';
  actionsEl.append(count);
}

function drawResult() {
  resultEl.replaceChildren();
  const h = view?.game.hand;
  const wasHidden = resultEl.hidden;
  resultEl.hidden = !(h && h.over && h.result);
  if (resultEl.hidden) return;
  
  if (wasHidden) setTimeout(() => { try { resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {  } }, 60);
  const g = view.game;
  const mine = teamOf(Math.max(0, view.you));
  const order = [mine, 1 - mine];
  const head = document.createElement('h2');
  head.textContent = fill(T.handOver, { n: g.handNo + 1 });
  const table = document.createElement('table');
  table.className = 'bu-result-table';
  const tr = (cells, cls = '') => {
    const r = document.createElement('tr');
    if (cls) r.className = cls;
    cells.forEach((c, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      td.textContent = c;
      r.append(td);
    });
    table.append(r);
  };
  tr(['', ...order.map(teamName)]);
  const L = h.result.lines;
  const sign = (n) => (n > 0 ? `+${n}` : String(n));
  tr([T.rowJogos, ...order.map((t) => sign(L[t].melded))]);
  tr([T.rowBonus, ...order.map((t) => sign(L[t].bonus))]);
  tr([T.rowBatida, ...order.map((t) => sign(L[t].batida))]);
  tr([T.rowHand, ...order.map((t) => sign(L[t].inHand))]);
  tr([T.rowMorto, ...order.map((t) => sign(L[t].morto))]);
  tr([T.rowTotal, ...order.map((t) => sign(L[t].total))], 'total');
  tr([T.rowGame, ...order.map((t) => String(g.scores[t]))], 'game');
  resultEl.append(head, table);
}

function statusText() {
  if (!view) return settings.mode === 'room' && room.active ? T.waitingHost : '';
  const g = view.game;
  if (settings.mode === 'room' && view.seats.includes('')) return T.waiting;
  if (g.over) {
    if (view.you < 0) return fill(T.winsGame, { who: teamName(g.winner) });
    return g.winner === teamOf(view.you) ? T.youWinGame : T.youLoseGame;
  }
  const h = g.hand;
  if (h.over) return fill(T.handOver, { n: g.handNo + 1 });
  if (h.turn === view.you) return h.phase === 'draw' ? T.yourTurnDraw : T.yourTurnPlay;
  return fill(T.turnOf, { who: seatName(h.turn) });
}

function draw() {
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-size]')) b.setAttribute('aria-pressed', String(Number(b.dataset.size) === settings.size));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  targetEl.value = String(settings.target);
  sortEl.textContent = settings.sort === 'suit' ? T.sortRank : T.sortSuit;
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  targetEl.disabled = isGuest();
  statusEl.textContent = statusText();
  $('table').classList.toggle('my-turn', myTurn());
  drawScore();
  drawSeats();
  drawCentre();
  drawMelds();
  drawHand();
  drawActions();
  drawResult();
  const h = view?.game.hand;
  nextEl.hidden = !(view && h && h.over && !view.game.over && !isGuest());
}


function finished() {
  if (!view || finishedRound === gameRound) return;
  finishedRound = gameRound;
  const g = view.game;
  const me = view.you;
  if (me < 0) return;
  const result = g.winner === teamOf(me) ? 'won' : 'lost';
  sfx.play(result === 'won' ? 'win' : 'lose');
  const turn = reportGate.take();
  if (turn) {
    const n = g.opts.players;
    const opp = view.seats[(me + 1) % n];
    const arg = twoSeatMatch({
      game: GAME_ID, seats: [view.seats[me], opp], me: view.seats[me], result,
      isBot: (id) => isBot(id) || !id, cardFor: (id) => CARDS.get(id), online: settings.mode === 'room',
      startSeats: turn.startSeats ? [turn.startSeats[me], turn.startSeats[(me + 1) % n]] : undefined,
      myDev: deviceId(), hosting: !!net?.hosting, seconds: (Date.now() - startedAt) / 1000,
    });
    if (arg) reportMatch(arg).catch(() => {});
  }
  trackEvent('buraco_finished', {
    mode: settings.mode, size: g.opts.players, level: settings.level, target: g.opts.target,
    result, us: g.scores[teamOf(me)], them: g.scores[1 - teamOf(me)], hands: g.handNo + 1,
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
targetEl.addEventListener('change', () => {
  settings.target = pick(Number(targetEl.value), TARGETS, 3000);
  persist();
  playUi('toggleOn');
  if (settings.mode === 'bot') restartSolo(); else if (room.active && net?.hosting) newMatch();
});
sortEl.addEventListener('click', () => {
  settings.sort = settings.sort === 'suit' ? 'rank' : 'suit';
  persist();
  playUi('toggleOn');
  draw();
});
nextEl.addEventListener('click', () => { if (!isGuest()) dealNext(); });
$('new-game').addEventListener('click', () => {
  playUi('tap');
  if (isGuest()) { net.propose({ type: 'rematch' }); return; }
  if (match && settings.mode === 'room') { stopTimers(); begin(rematch(match, freshSeed())); return; }
  if (settings.mode === 'room') { flash(T.waiting); return; }
  newMatch();
});
window.addEventListener('resize', () => draw());


const codeOf = (id) => String(id ?? '').replace(/^fbu-/i, '').toUpperCase();
const freshMatch = (m) => m.game.handNo === 0 && m.game.hand.turns === 0 && m.game.hand.phase === 'draw';

function onProposal(action, from) {
  if (!match) return;
  if (action.type === 'rematch') {
    if (match.game.over) { stopTimers(); begin(rematch(match, freshSeed())); }
    else net?.publish();
    return;
  }
  const r = act(match, from, action);
  if (r.error) { net?.publish(); return; }
  match = r.match;
  sounds(match.game.events);
  noteEvents(match.game.events);
  refresh();
}

function onView(v) {
  const before = view;
  waitingAnswer = false;
  view = v;
  if (!before || (v.game.handNo === 0 && before.game.handNo > 0) || (before.game.over && !v.game.over)) {
    gameRound += 1;
    reportGate.begin(v.seats);
    startedAt = Date.now();
  }
  if (!before || v.game.handNo !== before.game.handNo) { lastFlash = ''; selected = new Set(); }
  pruneSelection();
  noteEvents(v.game.events);
  if (before && JSON.stringify(before.game.events) !== JSON.stringify(v.game.events)) sounds(v.game.events);
  draw();
  if (v.game.over) finished();
}

function startNet() {
  if (net) return net;
  net = createNet({
    viewFor: (peer) => (match ? viewFor(match, seatOf(match, peer)) : null),
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
          begin(createMatch({ seats, target: match.game.opts.target, seed: freshSeed() }));
          return;
        }
      } else if (match.seats.includes('') && match.game.opts.players === 2) {
        
        stopTimers();
        begin(createMatch({ seats: seatsWith(match.seats, who, false), target: match.game.opts.target, seed: freshSeed() }));
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
    onStatus: (kind, detail) => {
      if (kind === 'open') flash(T.waiting, 4000);
      else if (kind === 'joined') flash(T.joined);
      else if (kind === 'failed') flash(T.badCode, 4000);
      else if (kind === 'host' && detail?.iAmHost && view && !match) {
        
        
        
        const seats = view.seats.map((s, i) => (s === detail.previousHost || !s ? `bot:${settings.level}#${i}` : s));
        settings.size = seats.length;
        flash(T.hostLeft, 5000);
        begin(createMatch({ seats, target: view.game.opts.target, seed: freshSeed() }));
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
  const seats = settings.size === 2 ? [HOST, ''] : botSeats(4, settings.level, HOST);
  begin(createMatch({ seats, target: settings.target, seed: freshSeed() }));
  startNet().host();
}

function joinRoom(code) {
  if (!canPlayTogether()) { flash(T.noRooms, 4000); return false; }
  const out = startNet().join(code);
  if (out?.error) { net = null; flash(T.badCode, 4000); return false; }
  stopTimers();
  settings.mode = 'room';
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
  Object.assign(room, { active: false, me: null, peers: [], code: null });
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
  const link = shareLinkFor(base, net.hosting ? net.id : `fbu-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Buracowise' });



countPlay('buraco', { isHost: !joinIdFrom(location.href) });

loadAtlas(DECK_URL).then((a) => { atlas = a; draw(); }).catch(() => {  });

function boot() {
  const linkRoom = joinIdFrom(location.href);
  if (linkRoom) {
    settings.mode = 'room';
    if (!joinRoom(linkRoom)) { settings.mode = 'bot'; newMatch({ cheats: true }); }
    return;
  }
  newMatch({ cheats: true });
}
boot();

trackEvent('game_start', { game: GAME_ID, mode: settings.mode, size: settings.size });




globalThis.buracowise = Object.freeze({
  ready: () => !!view,
  mode: () => settings.mode,
  size: () => (view ? view.game.opts.players : settings.size),
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  myTurn: () => myTurn(),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  scores: () => (view ? view.game.scores.slice() : null),
  over: () => !!view?.game.over,
  atlas: () => !!atlas,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [] }),
  act: (a) => doAction(a),
  select: (ids) => { selected = new Set(ids); draw(); return [...selected]; },
  deal: () => { if (!isGuest()) dealNext(); },
});
