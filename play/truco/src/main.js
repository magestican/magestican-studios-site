

















import {
  createMatch, act, nextHand, rematch, viewFor, viewForPeer, actorId, seatOf, isBot, botLevel, seatsWith, myNumbers,
} from '../../../web-engine/truco/trucoMatch.js';
import { legalActions, actor, team, power, TRUCO_CALLS, half } from '../../../web-engine/truco/trucoRules.js';
import { chooseAction, LEVELS, seededRng } from '../../../web-engine/truco/trucoBot.js';
import { loadAtlas, makeCard } from '../../../web-engine/cards/cardArt.js';
import { sortHand } from '../../../web-engine/cards/cards.js';
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
import { mountLevelScene } from '../../shared/ui/levelScene.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, cardName } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'truco';
const SETTINGS_KEY = 'trucowise-settings-v1';
const SOLO = 'you';
const HOST = 'host';      
const BOT_MS = 850;       
const NEXT_MS = 2800;     
const DECK_URL = '../shared/cards/spanish40/deck.json';

const lang = gameLang();


const MUSIC_NAMES = { main: 'Tango', local: 'Cumbia' };
const music = createTrackMusic({
  game: 'truco', lang, homeLang: 'es',
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});

const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), ['card', 'call', 'point', 'win', 'lose']);
const T = stringsFor(lang);
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Trucowise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const flashEl = $('flash');
const handEl = $('hand');
const actionsEl = $('actions');
const mineEl = $('mine');
const scoreEl = $('score');
const nextEl = $('next-hand');
const again = mountPlayAgain({ anchor: $('table'), source: $('new-game') });


mountLevelScene({ levels: ['easy', 'medium', 'hard'] });
const roomEl = $('room');
const targetEl = $('target');
const florEl = $('flor');


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
for (const n of [15, 30]) {
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
  target: pick(Number(params.get('to')), [15, 30], pick(saved.target, [15, 30], 15)),
  flor: params.get('flor') !== null ? params.get('flor') === '1' : saved.flor === true,
};


const persist = () => save(SETTINGS_KEY, { size: settings.size, level: settings.level, target: settings.target, flor: settings.flor });

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
let lastFlash = '';
let finishedRound = -1;
let gameRound = 0;
let queuedArrivals = [];

const room = { active: false, me: null, peers: [], code: null, watching: false };



const presence = roomPresence({
  game: 'truco',
  net: () => net,
  players: () => new Set([room.me, ...room.peers].filter(Boolean)).size || 1,
  ids: () => [room.me, ...room.peers].filter(Boolean),
});
const reportGate = createReportGate();
let startedAt = Date.now();
const botRngs = new Map();

const isGuest = () => settings.mode === 'room' && room.active && net && !net.hosting;
const myId = () => (settings.mode === 'room' ? (room.me ?? HOST) : SOLO);
const mySeat = () => (view ? view.you : (match ? seatOf(match, myId()) : 0));





const watcher = () => settings.mode === 'room' && room.active
  && (room.watching || (isGuest() && !!view && view.you < 0));

const viewSeat = () => (view && view.you >= 0 ? view.you : 0);

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

function newMatch({ keepHand = false } = {}) {
  stopTimers();
  const first = settings.mode === 'room' ? myId() : SOLO;
  const seats = settings.mode === 'room' && settings.size === 2 ? [first, ''] : botSeats(settings.size, settings.level, first);
  begin(createMatch({
    seats, target: settings.target, flor: settings.flor, seed: freshSeed(),
    fixedHand: keepHand && handParam.length === 3 ? handParam : null,
  }));
}


function refresh() {
  if (!match) return;
  
  
  view = viewForPeer(match, myId());
  if (net?.hosting) net.publish();
  draw();
  stopTimers();
  const g = match.game;
  if (g.over) { finished(); return; }
  if (g.hand.over) {
    nextTimer = setTimeout(dealNext, NEXT_MS);
    return;
  }
  const id = actorId(match);
  if (id !== null && isBot(id)) botTimer = setTimeout(botMove, BOT_MS);
}

function botMove() {
  botTimer = null;
  if (!match || match.game.over || match.game.hand.over) return;
  const id = actorId(match);
  if (!isBot(id)) return;
  const seat = seatOf(match, id);
  const d = chooseAction(viewFor(match, seat), { level: botLevel(id), rng: botRng(id) });
  if (!d) return;
  const r = act(match, id, d.action);
  if (r.error) return;
  match = r.match;
  sounds(match.game.events);
  noteEvents(match.game.events);
  refresh();
}

function dealNext() {
  nextTimer = null;
  if (!match || match.game.over || !match.game.hand.over) return;
  let m = nextHand(match);
  
  for (const who of queuedArrivals) m = { ...m, seats: seatsWith(m.seats, who, false) };
  queuedArrivals = [];
  match = m;
  lastFlash = '';
  sfx.play('card');
  refresh();
}

function stopTimers() {
  if (botTimer) clearTimeout(botTimer);
  if (nextTimer) clearTimeout(nextTimer);
  botTimer = null;
  nextTimer = null;
}


function doAction(a) {
  if (!view) return;
  
  if (watcher()) return;
  if (isGuest()) {
    if (waitingAnswer) return;
    waitingAnswer = true;
    net.propose(a);
    playUi('tap');
    draw();
    return;
  }
  const r = act(match, myId(), a);
  if (r.error) { flash(r.error); playUi('error'); return; }
  match = r.match;
  sounds(match.game.events);
  noteEvents(match.game.events);
  refresh();
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
  if (n === 2) return isBot(id) ? T.bot : T.friendName;
  const rel = (s - me + 4) % 4;
  const pos = rel === 1 ? T.right : rel === 2 ? T.partner : T.left;
  return id && !isBot(id) ? `${T.friendName} (${pos})` : pos;
}

function teamName(t) {
  if (!view) return '';
  if (view.you < 0) return view.game.opts.players === 2 ? seatName(t) : fill(T.teamN, { n: t + 1 });
  if (view.game.opts.players === 2) return t === team(view.you) ? T.you : seatName(1 - view.you);
  return t === team(view.you) ? T.us : T.them;
}

function callWord(c) {
  if (c.type === 'truco') return T[`call_${TRUCO_CALLS[(c.level || 1) - 1]}`];
  if (c.type === 'envido') return T[`call_${c.call}`];
  if (c.type === 'contraflor') return c.resto ? T.call_contraflorResto : T.call_contraflor;
  return T[`call_${c.type}`] || c.type;
}


function noteEvents(events) {
  for (const e of events || []) {
    if (e.kind === 'envido') {
      lastFlash = e.accepted ? fill(T.envidoTo, { who: seatName(e.seat), n: e.points, pts: e.worth })
        : fill(T.envidoNo, { who: teamName(e.team), pts: e.worth });
    } else if (e.kind === 'flor') {
      lastFlash = fill(T.florTo, { who: teamName(e.team), pts: e.worth });
    } else if (e.kind === 'points' && (e.why === 'bazas' || e.why === 'noquiero' || e.why === 'mazo')) {
      lastFlash = fill(T.handTo, { who: teamName(e.team), pts: e.pts });
    } else if (e.kind === 'points' && e.why === 'flor' && !lastFlash) {
      lastFlash = fill(T.florTo, { who: teamName(e.team), pts: e.pts });
    } else if (e.kind === 'baza' && e.result === 'parda') {
      lastFlash = T.parda;
    }
  }
  flashEl.textContent = lastFlash;
}




function sounds(events) {
  const kinds = new Set((events || []).map((e) => e.kind));
  if (kinds.has('call')) sfx.play('call');
  else if (kinds.has('points')) sfx.play('point');
  else if (kinds.has('play')) sfx.play('card');
  else playUi('toggleOn');
}

let flashTimer = null;
function flash(text, ms = 2600) {
  flashEl.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashEl.textContent = lastFlash; }, ms);
}


const cardWidth = (big) => {
  const w = Math.min(window.innerWidth || 400, 640);
  return big ? Math.max(64, Math.min(104, Math.floor((w - 48) / 3.3))) : Math.max(40, Math.min(66, Math.floor(w / 7.5)));
};

function cardEl(id, { big = false, onClick = null, faceDown = false } = {}) {
  const width = cardWidth(big);
  const label = faceDown ? T.faceDown : cardName(T, id);
  if (atlas) {
    const el = makeCard(document, atlas, id, { width, label, faceDown, onClick, className: 'tr-card' });
    return el;
  }
  
  const el = document.createElement(onClick ? 'button' : 'div');
  el.className = 'tr-card tr-card-text';
  if (onClick) { el.type = 'button'; el.addEventListener('click', onClick); }
  el.style.width = `${width}px`;
  el.style.height = `${Math.round(width * 1.55)}px`;
  el.textContent = faceDown ? '' : label;
  if (faceDown) el.classList.add('tr-card-back');
  el.setAttribute('aria-label', label);
  return el;
}

function tally(points, target) {
  
  
  const boxes = target / 5;
  const W = 26;
  const gap = 8;
  const sep = target === 30 ? 10 : 0;
  const width = boxes * (W + gap) + sep;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${W + 6}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(W + 6));
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('tr-tally');
  let left = Math.min(points, target);
  for (let b = 0; b < boxes; b++) {
    const x = 3 + b * (W + gap) + (target === 30 && b >= 3 ? sep : 0);
    const y = 3;
    const segs = [[x, y, x + W, y], [x + W, y, x + W, y + W], [x + W, y + W, x, y + W], [x, y + W, x, y], [x, y, x + W, y + W]];
    for (let k = 0; k < 5; k++) {
      const line = document.createElementNS(ns, 'line');
      const [x1, y1, x2, y2] = segs[k];
      line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('class', left > 0 ? 'on' : 'off');
      left -= 1;
      svg.append(line);
    }
  }
  if (target === 30) {
    const l = document.createElementNS(ns, 'line');
    const x = 3 + 3 * (W + gap) + sep / 2 - gap / 2;
    l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', 0); l.setAttribute('y2', W + 6);
    l.setAttribute('class', 'mid');
    svg.append(l);
  }
  return svg;
}

function drawScore() {
  scoreEl.replaceChildren();
  if (!view) return;
  const g = view.game;
  
  const mine = team(viewSeat());
  for (const t of [mine, 1 - mine]) {
    const row = document.createElement('div');
    row.className = `tr-score-row ${t === mine ? 'us' : 'them'}`;
    const name = document.createElement('span');
    name.className = 'tr-score-name';
    name.textContent = teamName(t);
    const n = document.createElement('strong');
    n.className = 'tr-score-n';
    n.textContent = String(g.scores[t]);
    const h = half(g, t);
    row.append(name, n, tally(g.scores[t], g.opts.target));
    if (h) {
      const tag = document.createElement('span');
      tag.className = 'tr-half';
      tag.textContent = T[h];
      row.append(tag);
    }
    row.setAttribute('aria-label', `${teamName(t)}: ${g.scores[t]} ${fill(T.pointsTo, { n: g.opts.target })}`);
    scoreEl.append(row);
  }
}

function spotFor(rel, n) {
  if (rel === 0) return 'spot-bottom';
  if (n === 2) return 'spot-top';
  return rel === 1 ? 'spot-right' : rel === 2 ? 'spot-top' : 'spot-left';
}

function drawTable() {
  for (const id of ['spot-top', 'spot-left', 'spot-right', 'spot-bottom']) { $(id).replaceChildren(); $(id).hidden = true; }
  if (!view) return;
  const g = view.game;
  const h = g.hand;
  const n = g.opts.players;
  const lastCall = new Map();
  for (const c of h.calls || []) lastCall.set(c.seat, c);
  const turnSeat = actor(g);
  $('table').classList.toggle('two', n === 2);
  for (let s = 0; s < n; s++) {
    
    
    const rel = (s - viewSeat() + n) % n;
    const spot = $(spotFor(rel, n));
    spot.hidden = false;
    spot.classList.toggle('turn', turnSeat === s);
    spot.classList.toggle('partner', view.you >= 0 && team(s) === team(view.you));
    const head = document.createElement('div');
    head.className = 'tr-spot-head';
    const name = document.createElement('span');
    name.className = 'tr-name';
    name.textContent = seatName(s);
    head.append(name);
    if (g.mano === s) {
      const b = document.createElement('span');
      b.className = 'tr-badge';
      b.textContent = T.mano;
      head.append(b);
    }
    const c = lastCall.get(s);
    if (c) {
      const bubble = document.createElement('span');
      bubble.className = 'tr-bubble';
      bubble.textContent = callWord(c);
      head.append(bubble);
    }
    spot.append(head);
    const row = document.createElement('div');
    row.className = 'tr-played';
    h.bazas.forEach((baza, k) => {
      const p = baza.find((x) => x.seat === s);
      if (!p) return;
      const el = cardEl(p.card);
      const res = h.results[k];
      if (res !== undefined) el.classList.add(res === 'parda' ? 'parda' : (res === team(s) ? 'won' : 'lost'));
      row.append(el);
    });
    if (s !== view.you) {
      const backs = document.createElement('div');
      backs.className = 'tr-backs';
      for (let k = 0; k < h.hands[s].length; k++) backs.append(cardEl('back', { faceDown: true }));
      spot.append(backs);
    }
    spot.append(row);
  }
}

function drawHand(legal) {
  handEl.replaceChildren();
  if (!view) return;
  const h = view.game.hand;
  const cards = sortHand((h.hands[view.you] || []).filter(Boolean), { key: power });
  const playable = new Set(legal.filter((a) => a.type === 'play').map((a) => a.card));
  for (const c of cards) {
    if (!c) continue;
    const can = playable.has(c) && !waitingAnswer;
    const el = cardEl(c, { big: true, onClick: can ? () => doAction({ type: 'play', card: c }) : null });
    el.classList.toggle('playable', can);
    el.dataset.play = c;
    handEl.append(el);
  }
}

function drawActions(legal) {
  actionsEl.replaceChildren();
  if (!view) return;
  const g = view.game;
  for (const a of legal) {
    if (a.type === 'play') continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `tr-btn tr-call tr-call-${a.type}`;
    let word;
    if (a.type === 'truco') {
      const p = g.hand.pending;
      const level = p && p.kind === 'truco' ? p.level + 1 : g.hand.truco.level + 1;
      word = T[`call_${TRUCO_CALLS[level - 1]}`];
    } else word = callWord(a);
    b.textContent = word;
    b.dataset.action = a.type;
    if (a.call) b.dataset.call = a.call;
    if (a.type === 'contraflor') b.dataset.resto = a.resto ? '1' : '0';
    b.disabled = waitingAnswer;
    b.addEventListener('click', () => doAction({ type: a.type, call: a.call, resto: a.resto }));
    actionsEl.append(b);
  }
}

function statusText(legal) {
  if (!view) return settings.mode === 'room' && room.active ? T.connecting : T.loading;
  const g = view.game;
  
  
  if (watcher() && !g.over) return T.watching;
  
  if (settings.mode === 'room' && view.seats.includes('')) return T.waiting;
  if (g.over) {
    if (view.you < 0) return fill(T.winsGame, { who: teamName(g.winner) });
    return g.winner === team(view.you) ? T.youWinGame : T.youLoseGame;
  }
  const h = g.hand;
  if (h.over) return fill(T.handNo, { n: g.handNo + 2 });
  const s = actor(g);
  const p = h.pending;
  if (p) {
    const by = (h.calls || []).filter((c) => c.seat === p.by).pop();
    const callTxt = by ? callWord(by) : '';
    if (s === view.you) return fill(T.answerYou, { call: callTxt });
    return fill(T.answerOf, { who: seatName(s) });
  }
  if (s === view.you && legal.length) return T.yourTurn;
  return fill(T.turnOf, { who: seatName(s) });
}

function draw() {
  const legal = view && !view.game.over && view.you >= 0 ? legalActions(view.game, view.you) : [];
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-size]')) b.setAttribute('aria-pressed', String(Number(b.dataset.size) === settings.size));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  targetEl.value = String(settings.target);
  florEl.checked = settings.flor;
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  const guest = isGuest();
  const watching = watcher();
  for (const el of [targetEl, florEl]) el.disabled = guest || watching;
  
  $('copy-link').hidden = watching;
  const watchersEl = $('watchers');
  watchersEl.textContent = watchingLabel(T.watchers, room.active ? (net?.watchers ?? 0) : 0);
  watchersEl.hidden = !watchersEl.textContent;
  statusEl.textContent = statusText(legal);
  drawScore();
  drawTable();
  drawHand(legal);
  drawActions(view ? legal : []);
  
  handEl.hidden = watching;
  const nums = view && myNumbers(view);
  const h = view?.game.hand;
  if (nums && h && h.results.length === 0 && !h.over) {
    mineEl.textContent = view.game.opts.flor && nums.flor ? fill(T.myFlor, { n: nums.envido }) : fill(T.myEnvido, { n: nums.envido });
  } else mineEl.textContent = '';
  
  nextEl.hidden = !(view && h && h.over && !view.game.over && !guest && !watching);
  $('new-game').hidden = watching;
  
  
  document.querySelector('.tr-foot').hidden = watching;
  again.update(!!view?.game.over && !watching);
}


function finished() {
  if (!view || finishedRound === gameRound) return;
  finishedRound = gameRound;
  const g = view.game;
  const me = view.you;
  if (me < 0) return;
  const result = g.winner === team(me) ? 'won' : 'lost';
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
  trackEvent('truco_finished', {
    mode: settings.mode, size: g.opts.players, level: settings.level, target: g.opts.target,
    flor: g.opts.flor, result, us: g.scores[team(me)], them: g.scores[1 - team(me)],
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
  settings.target = Number(targetEl.value) === 30 ? 30 : 15;
  persist();
  playUi('toggleOn');
  if (settings.mode === 'bot') restartSolo(); else if (room.active && net?.hosting) newMatch();
});
florEl.addEventListener('change', () => {
  settings.flor = florEl.checked;
  persist();
  playUi('toggleOn');
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


const codeOf = (id) => String(id ?? '').replace(/^ftr-/i, '').toUpperCase();
const freshMatch = (m) => m.game.handNo === 0 && !m.game.hand.bazas[0].length && !(m.game.hand.calls || []).length;

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
  
  
  settings.size = v.game.opts.players;
  if (!before || (v.game.handNo === 0 && before.game.handNo > 0) || (before.game.over && !v.game.over)) {
    gameRound += 1;
    reportGate.begin(v.seats);
    startedAt = Date.now();
  }
  if (!before || v.game.handNo !== before.game.handNo) lastFlash = '';
  noteEvents(v.game.events);
  if (before && JSON.stringify(before.game.hand.bazas) !== JSON.stringify(v.game.hand.bazas)) sfx.play('card');
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
          begin(createMatch({ seats, target: match.game.opts.target, flor: match.game.opts.flor, seed: freshSeed() }));
          return;
        }
      } else if (match.seats.includes('') && match.game.opts.players === 2) {
        
        stopTimers();
        begin(createMatch({ seats: seatsWith(match.seats, who, false), target: match.game.opts.target, flor: match.game.opts.flor, seed: freshSeed() }));
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
        begin(createMatch({ seats, target: match.game.opts.target, flor: match.game.opts.flor, seed: freshSeed() }));
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
        begin(createMatch({ seats, target: view.game.opts.target, flor: view.game.opts.flor, seed: freshSeed() }));
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
  begin(createMatch({ seats, target: settings.target, flor: settings.flor, seed: freshSeed() }));
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
  const link = shareLinkFor(base, net.hosting ? net.id : `ftr-${room.code}`, {});
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});



$('watch-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = watchLinkFor(base, net.hosting ? net.id : `ftr-${room.code}`);
  shareLink({ link, gameName: GAME_NAME, code: room.code, text: fill(T.watchInvite, { game: GAME_NAME }) })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.watchCopied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });

foldSetup();
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Trucowise' });



const linkRoom = roomFromHref(location.href);
countPlay('truco', { isHost: !linkRoom });

loadAtlas(DECK_URL).then((a) => { atlas = a; draw(); }).catch(() => {  });

function boot() {
  if (linkRoom) {
    settings.mode = 'room';
    if (!joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH })) { settings.mode = 'bot'; newMatch({ keepHand: true }); }
    return;
  }
  newMatch({ keepHand: true });
}
boot();

trackEvent('game_start', { game: GAME_ID, mode: settings.mode, size: settings.size });




globalThis.trucowise = Object.freeze({
  ready: () => !!view,
  mode: () => settings.mode,
  size: () => (view ? view.game.opts.players : settings.size),
  view: () => (view ? JSON.parse(JSON.stringify(view)) : null),
  legal: () => (view && view.you >= 0 ? legalActions(view.game, view.you) : []),
  status: () => statusEl.textContent,
  flash: () => flashEl.textContent,
  scores: () => (view ? view.game.scores.slice() : null),
  over: () => !!view?.game.over,
  atlas: () => !!atlas,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: view ? view.seats.slice() : [], watchers: net?.watchers ?? 0, watcher: watcher() }),
  act: (a) => doAction(a),
  deal: () => { if (!isGuest()) dealNext(); },
});
