

















import { LANGS, LINKS, defaultLink, isLink } from '../../../web-engine/wordchain/wordchainLang.js';
import { loadDict, display } from '../../../web-engine/wordchain/wordchainDict.js';
import { needed, winner } from '../../../web-engine/wordchain/wordchainRules.js';
import { chooseWord, LEVELS, seededRng } from '../../../web-engine/wordchain/wordchainBot.js';
import {
  SOLO, TIMERS, DEFAULT_TIMER, createMatch, replayMatch, applyAction, withToken, seatsWith,
  rematch, isMyTurn, seatOf, sanitiseMatch,
} from '../../../web-engine/wordchain/wordchainMatch.js';
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
import { wireTrackButton } from '../../shared/ui/trackButton.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';
import { stringsFor, fill, EXAMPLES, LANG_NAMES } from './strings.js';
import { createNet, canPlayTogether } from './net.js';

const GAME_ID = 'word-chain';
const SETTINGS_KEY = 'relaywise-settings-v1';
const BOT = 'bot';
const GUEST = 'guest';        
const HOST = 'host';          
const GUEST_GRACE_MS = 1500;  
const TICK_FROM = 5;      

const lang = gameLang();


const MUSIC_NAMES = { main: { ja: 'シティポップ', default: 'City pop' }, local: 'Bolero' };
const music = createTrackMusic({
  game: 'word-chain', lang, homeLang: 'vi',
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});
const T = stringsFor(lang);
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Relaywise is available.' });

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const needEl = $('need');
const flashEl = $('flash');
const chainEl = $('chain');
const countEl = $('count');
const inputEl = $('word');
const sendEl = $('send');
const formEl = $('word-form');
const clockEl = $('clock');
const clockBar = $('clock-bar');
const wordLangEl = $('word-lang');
const linkEl = $('link');
const timerEl = $('timer');
const newGameEl = $('new-game');
const giveUpEl = $('give-up');
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
const GAME_NAME = localGameName(GAME_ID, lang);


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } };

const params = new URLSearchParams(location.search);
const saved = load(SETTINGS_KEY, {});
const pick = (v, list, d) => (list.includes(v) ? v : d);
const pageWords = LANGS.includes(lang) ? lang : 'en';
const timerParam = params.get('timer') === null ? NaN : Number(params.get('timer'));
const settings = {
  mode: pick(params.get('mode'), ['bot', 'local'], pick(saved.mode, ['bot', 'local'], 'bot')),
  level: pick(params.get('level'), LEVELS, pick(saved.level, LEVELS, 'medium')),
  wordLang: pick(params.get('wl'), LANGS, pick(saved.wordLang, LANGS, pageWords)),
  link: null,
  timer: pick(timerParam, TIMERS, pick(saved.timer, TIMERS, DEFAULT_TIMER)),
};
settings.link = isLink(settings.wordLang, params.get('link')) ? params.get('link')
  : (isLink(settings.wordLang, saved.links?.[settings.wordLang]) ? saved.links[settings.wordLang] : defaultLink(settings.wordLang));

let wordLangChosen = LANGS.includes(saved.wordLang);
const linksChosen = { ...(saved.links ?? {}) };
const persist = () => save(SETTINGS_KEY, {
  mode: settings.mode === 'room' ? 'bot' : settings.mode,
  level: settings.level,
  timer: settings.timer,
  ...(wordLangChosen ? { wordLang: settings.wordLang } : {}),
  links: linksChosen,
});
const seedParam = params.get('seed');
const rng = seedParam !== null ? seededRng(Number(seedParam) || 1) : Math.random;


const dicts = new Map();
function getDict(l) {
  if (!dicts.has(l)) dicts.set(l, loadDict(l).catch((e) => { dicts.delete(l); throw e; }));
  return dicts.get(l);
}


let match = null;
let state = null;
let dict = null;
let loading = false;
let net = null;
let botTimer = null;
let botBlanked = false;
const room = { active: false, me: null, peers: [], code: null };



const presence = roomPresence({
  game: 'wordchain',
  net: () => net,
  players: () => new Set([room.me, ...room.peers].filter(Boolean)).size || 1,
  ids: () => [room.me, ...room.peers].filter(Boolean),
});
const reportGate = createReportGate();
let startedAt = Date.now();

const me = () => (settings.mode === 'room' ? (room.me ?? HOST) : SOLO);

function seatsForMode() {
  if (settings.mode === 'local') return [SOLO, SOLO];
  if (settings.mode === 'room') return [room.me ?? HOST, GUEST];
  return [SOLO, BOT];
}


const seatOwner = () => (state.seats[0] === state.seats[1] ? null : me());


async function rederive() {
  if (!dict || dict.lang !== match.lang) {
    loading = true;
    draw();
    try {
      dict = await getDict(match.lang);
    } finally {
      loading = false;
    }
  }
  state = replayMatch(dict, match);
}

async function begin(m) {
  match = m;
  botBlanked = false;
  await rederive();
  reportGate.begin(match.seats);
  startedAt = Date.now();
}

async function newMatch() {
  stopBot();
  await begin(createMatch({ seats: seatsForMode(), lang: settings.wordLang, link: settings.link, timer: settings.timer }));
}


function nameOfSeat(seat) {
  if (settings.mode === 'local') return seat === 0 ? T.p1 : T.p2;
  const id = state.seats[seat];
  if (settings.mode === 'bot') return id === BOT ? T.bot : T.you;
  return id === me() ? T.you : T.friendName;
}

function statusText() {
  if (loading || !state) return T.loading;
  const { game } = state;
  if (settings.mode === 'room') {
    if (!room.active) return '';
    if (!room.me) return T.connecting;
  }
  if (game.over) {
    const w = winner(game);
    const loserName = nameOfSeat(game.loser);
    let why = '';
    if (game.reason === 'timeout') why = fill(T.whyTimeout, { who: loserName });
    else if (game.reason === 'n') why = fill(T.whyN, { who: loserName });
    else if (settings.mode === 'bot' && state.seats[game.loser] === BOT && botBlanked) why = T.botBlank;
    else why = fill(T.whyResign, { who: loserName });
    let head;
    if (settings.mode === 'local' || seatOf(state, me()) < 0) head = fill(T.wins, { who: nameOfSeat(w) });
    else head = state.seats[w] === me() ? T.youWin : T.youLose;
    return `${head} ${why}`;
  }
  if (settings.mode === 'local') return fill(T.turnOf, { who: nameOfSeat(game.turn) });
  if (settings.mode === 'bot') return isMyTurn(state, SOLO) ? T.yourTurn : T.botThinking;
  if (state.seats.includes(GUEST)) return T.waiting;
  if (seatOf(state, me()) < 0) return T.watching;
  return isMyTurn(state, me()) ? T.yourTurn : T.theirTurn;
}

function drawNeed() {
  needEl.replaceChildren();
  if (!state || loading) return;
  const need = needed(dict, state.game);
  if (!need.length) { needEl.textContent = T.anyWord; return; }
  const [before, after = ''] = T.startsWith.split('{x}');
  needEl.append(document.createTextNode(before));
  need.forEach((x, k) => {
    if (k) needEl.append(document.createTextNode(' / '));
    const chip = document.createElement('span');
    chip.className = 'wc-link';
    chip.lang = state.game.lang;
    chip.textContent = x;
    needEl.append(chip);
  });
  needEl.append(document.createTextNode(after));
}

function drawChain() {
  chainEl.replaceChildren();
  if (!state) return;
  const { game } = state;
  countEl.textContent = game.chain.length ? `(${fill(T.wordCount, { n: game.chain.length })})` : '';
  for (let k = game.chain.length - 1; k >= 0; k--) {
    const li = document.createElement('li');
    const seat = k % 2;
    li.className = `p${seat}`;
    const word = document.createElement('span');
    word.lang = game.lang;
    word.textContent = display(dict, game.chain[k]);
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = nameOfSeat(seat);
    li.append(word, who);
    chainEl.append(li);
  }
}

let flashTimer = null;
function flash(text, ms = 2600) {
  flashEl.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashEl.textContent = ''; }, ms);
}

function drawControls() {
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === settings.level));
  $('bot-row').hidden = settings.mode !== 'bot';
  const lockSettings = settings.mode === 'room' && (!net?.hosting || (state?.game.chain.length ?? 0) > 0);
  const shown = match ?? settings;
  wordLangEl.value = match?.lang ?? settings.wordLang;
  fillLinks(match?.lang ?? settings.wordLang);
  linkEl.value = match?.link ?? settings.link;
  timerEl.value = String(shown.timer);
  wordLangEl.disabled = lockSettings;
  linkEl.disabled = lockSettings;
  timerEl.disabled = lockSettings;
  roomEl.hidden = settings.mode !== 'room';
  $('room-start').hidden = room.active;
  $('room-live').hidden = !room.active;
  $('room-code').textContent = room.code ?? '-';
  const over = !!state?.game.over;
  newGameEl.textContent = settings.mode === 'room' ? T.rematch : T.newGame;
  newGameEl.disabled = settings.mode === 'room' && (!room.active || (!over && !(net?.hosting && !state?.game.chain.length)));
  giveUpEl.disabled = !canType();
  inputEl.disabled = !canType();
  sendEl.disabled = !canType();
  inputEl.lang = match?.lang ?? settings.wordLang;
  const wl = match?.lang ?? settings.wordLang;
  $('example').textContent = EXAMPLES[wl];
  $('example').lang = wl;
  $('n-loses').hidden = wl !== 'ja';
}

function draw() {
  statusEl.textContent = statusText();
  drawNeed();
  drawChain();
  drawControls();
}



let clock = { key: null, deadline: 0, total: 0, lastTick: null };
let clockTimer = null;

function clockKey() { return state ? `${match.log.length}|${state.seats.join(',')}|${match.timer}` : null; }

function moverIsTimed() {
  const { game } = state;
  if (game.over || !match.timer || loading) return false;
  if (settings.mode === 'bot') return state.seats[game.turn] !== BOT;
  if (settings.mode === 'room') return room.active && !!room.me && !state.seats.includes(GUEST);
  return true;
}

function restartClock() {
  const key = clockKey();
  if (!moverIsTimed()) { clock.key = null; clockEl.hidden = true; return; }
  clockEl.hidden = false;
  if (clock.key === key) return;
  clock = { key, deadline: Date.now() + match.timer * 1000, total: match.timer * 1000, lastTick: null };
  if (!clockTimer) clockTimer = setInterval(tickClock, 100);
  tickClock();
}

function tickClock() {
  if (!state || clock.key === null || clock.key !== clockKey() || !moverIsTimed()) {
    clockEl.hidden = !state || !moverIsTimed();
    return;
  }
  const left = clock.deadline - Date.now();
  const frac = Math.max(0, Math.min(1, left / clock.total));
  clockBar.style.transform = `scaleX(${frac})`;
  clockEl.classList.toggle('low', left < TICK_FROM * 1000);
  const mine = settings.mode === 'local' || isMyTurn(state, me());
  const secs = Math.ceil(left / 1000);
  if (mine && secs <= TICK_FROM && secs > 0 && secs !== clock.lastTick) { clock.lastTick = secs; playUi('tick'); }
  if (left > 0) return;
  
  
  if (settings.mode === 'room') {
    if (!net?.hosting) return;
    const moverIsMe = state.seats[state.game.turn] === me();
    if (!moverIsMe && left > -GUEST_GRACE_MS) return;
  }
  clock.key = null;
  commit('!timeout');
}


function canType() {
  if (!state || loading || state.game.over) return false;
  if (settings.mode === 'local') return true;
  if (settings.mode === 'bot') return isMyTurn(state, SOLO) && !botTimer;
  return room.active && !!room.me && isMyTurn(state, me()) && !state.seats.includes(GUEST);
}

function errorText(code, need) {
  switch (code) {
    case 'shape': return state.game.lang === 'vi' ? T.errShapeVi : state.game.lang === 'ja' ? T.errShapeJa : T.errShape;
    case 'notWord': return T.errNotWord;
    case 'link': return fill(T.errLink, { x: need.join(' / ') });
    case 'used': return T.errUsed;
    case 'killer': return T.errKiller;
    case 'turn': return T.errTurn;
    default: return '';
  }
}


async function commit(token) {
  stopBot();
  match = withToken(match, token);
  await rederive();
  if (!token.startsWith('!')) playUi('tap');
  if (net?.hosting) net.publish();
  afterChange();
}

function submitWord() {
  if (!canType()) return;
  const text = inputEl.value;
  if (!text.trim()) return;
  const res = applyAction(dict, state, { kind: 'word', text, by: seatOwner() });
  if (res.error) {
    playUi('error');
    flash(errorText(res.error, needed(dict, state.game)));
    inputEl.select();
    return;
  }
  inputEl.value = '';
  flashEl.textContent = '';
  if (settings.mode === 'room' && !net?.hosting) {
    
    playUi('tap');
    net?.propose({ kind: 'word', text: res.token });
    return;
  }
  commit(res.token);
}

function afterChange() {
  draw();
  if (state.game.over) { stopClock(); finished(); return; }
  restartClock();
  maybeBot();
  if (canType() && document.activeElement !== inputEl && settings.mode !== 'room') inputEl.focus({ preventScroll: true });
}

function stopClock() {
  clock.key = null;
  clockEl.hidden = true;
}

function finished() {
  const { game } = state;
  const w = winner(game);
  const mine = seatOf(state, me());
  const result = state.seats[w] === me() ? 'won' : 'lost';
  if (settings.mode !== 'local' && mine >= 0) playUi(result === 'won' ? 'trophy' : 'error');
  else playUi('trophy');
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
  trackEvent('word_chain_finished', {
    mode: settings.mode, level: settings.level, words: game.lang, link: game.link,
    timer: match.timer, result, reason: game.reason, length: game.chain.length,
  });
}

function stopBot() {
  if (botTimer) clearTimeout(botTimer);
  botTimer = null;
}

function maybeBot() {
  if (settings.mode !== 'bot' || state.game.over || botTimer) return;
  if (state.seats[state.game.turn] !== BOT) return;
  const delay = 650 + Math.floor(rng() * 700);
  botTimer = setTimeout(() => {
    botTimer = null;
    if (settings.mode !== 'bot' || state.game.over) return;
    const p = chooseWord(dict, state.game, { level: settings.level, rng });
    if (p === null) { botBlanked = true; commit('!resign'); return; }
    commit(dict.words[p]);
  }, delay);
  draw();
}


formEl.addEventListener('submit', (e) => { e.preventDefault(); submitWord(); });
inputEl.addEventListener('keydown', (e) => {
  
  if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault();
});


function fillLinks(wl) {
  const want = LINKS[wl].join(',');
  if (linkEl.dataset.for !== want) {
    linkEl.replaceChildren(...LINKS[wl].map((l) => new Option(T[`link_${l}`] ?? l, l)));
    linkEl.dataset.for = want;
  }
  $('link-wrap').hidden = LINKS[wl].length < 2;
}
wordLangEl.replaceChildren(...LANGS.map((l) => new Option(LANG_NAMES[l], l)));
timerEl.replaceChildren(...TIMERS.map((n) => new Option(n ? fill(T.seconds, { n }) : T.timerOff, String(n))));

async function settingsChanged() {
  persist();
  if (settings.mode === 'room') {
    if (!net?.hosting || state.game.chain.length) return;
    match = { ...match, lang: settings.wordLang, link: settings.link, timer: settings.timer };
    await rederive();
    net.publish();
    afterChange();
    return;
  }
  await newMatch();
  afterChange();
}

wordLangEl.addEventListener('change', () => {
  settings.wordLang = wordLangEl.value;
  wordLangChosen = true;
  settings.link = isLink(settings.wordLang, linksChosen[settings.wordLang]) ? linksChosen[settings.wordLang] : defaultLink(settings.wordLang);
  playUi('toggleOn');
  settingsChanged();
});
linkEl.addEventListener('change', () => {
  settings.link = linkEl.value;
  linksChosen[settings.wordLang] = settings.link;
  playUi('toggleOn');
  settingsChanged();
});
timerEl.addEventListener('change', () => {
  settings.timer = Number(timerEl.value);
  playUi('toggleOn');
  settingsChanged();
});
for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', async () => {
    const mode = b.dataset.mode;
    if (mode === settings.mode) return;
    playUi('toggleOn');
    if (settings.mode === 'room') leaveRoom();
    settings.mode = mode;
    persist();
    await newMatch();
    afterChange();
  });
}
for (const b of document.querySelectorAll('[data-level]')) {
  b.addEventListener('click', async () => {
    if (b.dataset.level === settings.level) return;
    playUi('toggleOn');
    settings.level = b.dataset.level;
    persist();
    await newMatch();
    afterChange();
  });
}
newGameEl.addEventListener('click', async () => {
  playUi('tap');
  if (settings.mode === 'room') {
    if (net?.hosting) {
      await begin(state.game.chain.length || state.game.over ? rematch(match) : match);
      net.publish();
      afterChange();
    } else if (state.game.over) {
      net?.propose({ kind: 'rematch' });
    }
    return;
  }
  await newMatch();
  afterChange();
});
giveUpEl.addEventListener('click', () => {
  if (!canType()) return;
  playUi('toggleOff');
  if (settings.mode === 'room' && !net?.hosting) { net?.propose({ kind: 'resign' }); return; }
  commit('!resign');
});


const codeOf = (id) => String(id ?? '').replace(/^fwc-/i, '').toUpperCase();

let adopting = Promise.resolve();
function adopt(incoming) {
  
  
  adopting = adopting.then(async () => {
    if (!incoming.seats.length) return;
    const fresh = incoming.log.length === 0;
    const before = match;
    match = incoming;
    await rederive();
    if (fresh && (before?.log?.length || !before)) { reportGate.begin(match.seats); startedAt = Date.now(); }
    else if (fresh) reportGate.begin(match.seats);
    settings.wordLang = match.lang;
    settings.link = match.link;
    settings.timer = match.timer;
    if (incoming.log.length && before && incoming.log.length > before.log.length) playUi('tap');
    afterChange();
  }).catch(() => {});
}

function onProposal(action) {
  if (action.kind === 'rematch') {
    if (state.game.over) { begin(rematch(match)).then(() => { net.publish(); afterChange(); }); }
    return;
  }
  const check = applyAction(dict, state, action);
  if (check.error) { net?.publish(); return; }
  commit(check.token);
}

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => match,
    onMatch: (m) => adopt(sanitiseMatch(m)),
    onProposal,
    onPeers: (peers, id) => {
      room.peers = peers;
      
      presence.sync();
      if (id) room.me = id;
      if (id && net?.hosting) room.code = codeOf(id);
      if (net?.hosting && room.me && match.seats[0] === HOST && !match.log.length) {
        
        
        match = { ...match, seats: [room.me, match.seats[1]] };
        state = replayMatch(dict, match);
        reportGate.begin(match.seats);
      }
      afterChange();
    },
    onArrival: (who) => {
      const seats = seatsWith(match.seats, who, match.log.length > 0);
      if (seats !== match.seats) {
        match = { ...match, seats };
        state = replayMatch(dict, match);
        reportGate.begin(match.seats);
        startedAt = Date.now();
      }
    },
    onStatus: (kind) => {
      if (kind === 'open') flash(T.waiting);
      else if (kind === 'joined') flash(T.joined);
      else if (kind === 'failed') flash(T.badCode, 4000);
      if (state) afterChange();
    },
  });
  return net;
}

async function openRoom() {
  if (!canPlayTogether()) { flash(T.noRooms, 4000); return; }
  room.active = true;
  await begin(createMatch({ seats: [HOST, GUEST], lang: settings.wordLang, link: settings.link, timer: settings.timer }));
  startNet().host();
  afterChange();
}

async function joinRoom(code) {
  if (!canPlayTogether()) { flash(T.noRooms, 4000); return false; }
  const out = startNet().join(code);
  if (out?.error) { net = null; flash(T.badCode, 4000); return false; }
  room.active = true;
  room.code = codeOf(code);
  await begin(createMatch({ seats: [GUEST, GUEST], lang: settings.wordLang, link: settings.link, timer: settings.timer }));
  afterChange();
  return true;
}

function leaveRoom() {
  presence.withdraw();
  try { net?.leave(); } catch {  }
  net = null;
  Object.assign(room, { active: false, me: null, peers: [], code: null });
}

$('create-room').addEventListener('click', () => { playUi('tap'); openRoom(); });
$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  playUi('tap');
  joinRoom($('join-code').value.trim());
});
$('leave-room').addEventListener('click', async () => {
  playUi('toggleOff');
  leaveRoom();
  await newMatch();
  afterChange();
});
$('copy-link').addEventListener('click', () => {
  if (!net?.id) return;
  const base = `${location.origin}${location.pathname}`;
  const link = shareLinkFor(base, net.hosting ? net.id : `fwc-${room.code}`, {});
  
  shareLink({ link, gameName: GAME_NAME, code: room.code })
    .then((res) => {
      if (res?.via === 'clipboard') flash(T.copied);
      else if (res?.via === 'manual') flash(res.url, 8000);
    }, () => flash(link, 8000));
});


wireMusicButton({ music });
wireTrackButton({ music, names: MUSIC_NAMES, lang });
mountLevelChip(document.querySelector('.studio-bar'), { share: 'Relaywise' });



countPlay('word-chain', { isHost: !joinIdFrom(location.href) });

async function boot() {
  const linkRoom = joinIdFrom(location.href);
  if (linkRoom) {
    settings.mode = 'room';
    await newMatch();
    if (!(await joinRoom(linkRoom))) draw();
    return;
  }
  await newMatch();
  
  const cheat = (params.get('words') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const text of cheat) {
    const r = applyAction(dict, state, { kind: 'word', text });
    if (r.error) break;
    match = withToken(match, r.token);
    state = replayMatch(dict, match);
  }
  if (cheat.length) reportGate.settle();
  afterChange();
}
boot().catch(() => { statusEl.textContent = T.loading; });

trackEvent('game_start', { game: GAME_ID, mode: settings.mode, words: settings.wordLang });



globalThis.relaywise = Object.freeze({
  mode: () => settings.mode,
  wordLang: () => match?.lang ?? null,
  link: () => match?.link ?? null,
  chain: () => (state ? state.game.chain.map((i) => dict.words[i]) : []),
  need: () => (state ? needed(dict, state.game) : []),
  over: () => !!state?.game.over,
  winner: () => (state?.game.over ? nameOfSeat(winner(state.game)) : null),
  status: () => statusEl.textContent,
  ready: () => !!state && !loading,
  dictSize: () => dict?.words.length ?? 0,
  room: () => ({ ...room, hosting: !!net?.hosting, seats: state ? [...state.seats] : [] }),
});
