



import { PHASE, createMatch, hashMatch } from '../../../web-engine/clashwell/match.js';
import { HASH_EVERY } from '../../../web-engine/clashwell/session.js';
import { seatOf, seatsWith, freeSeats, SEAT_OPEN } from '../../../web-engine/clashwell/wire.js';
import { ROLE, roomFromHref, watchLinkFor } from '../../../web-engine/net/watchers.js';
import { shareLinkFor } from '../../../web-engine/words/coop.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { initAnalytics } from '../../../web-engine/visits/visits.js';
import { bootDone } from '../../shared/ui/fitScreen.js';
import { createHands } from './hands.js';
import { createClock } from './clock.js';
import { createDuel } from './duel.js';
import { layoutMatch } from './layout.js';
import { drawMatch } from './render.js';
import { CHEATS, applyCheat } from './cheats.js';
import { createNet, canPlayTogether } from './net.js';
import { T, fill } from './strings.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['title', 'select', 'room', 'match', 'end'];
const LEVELS = ['adaptive', 'easy', 'medium', 'hard'];
const FIGHTERS = 4;
const STEP_MS = 16;
const MAX_CATCH_UP = 2;
const OVER_PAUSE_MS = 1600;
const EFFECT_TICKS = 70;

const KEYBOARD = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', ArrowUp: 'cw', KeyX: 'cw', KeyZ: 'ccw', Space: 'hard',
  KeyA: 'left', KeyD: 'right', KeyS: 'soft', KeyW: 'cw',
};

let screen = 'title';
const choice = { fighter: 0, level: 'adaptive' };
const hands = createHands();
let clock = createClock();
let duel = null;
let mine = 0;
let effects = [];
let lastWake = 0;
let overTimer = null;
let endNote = '';

let net = null;
let room = { seats: ['host', 'guest'], running: false };
let code = null;
let waitingFriend = null;
let lastHashed = 0;
const watcherStarted = new Set();
let desyncs = 0;
let hadHost = false;

const isTouch = () => matchMedia('(pointer: coarse)').matches;

function show(name) {
  screen = name;
  for (const id of SCREENS) $(id).hidden = id !== name;
  if (name !== 'match') {
    hands.clear();
    duel = name === 'end' ? duel : null;
  }
}

function toast(text, ms = 3000) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, ms);
}

function effect(text, seat, { colour, big } = {}) {
  effects.push({ text, seat, colour, big, left: EFFECT_TICKS, total: EFFECT_TICKS });
}



function stage(events) {
  for (const e of events) {
    if (e.type === 'lock' && e.steps.length > 1) effect(fill(T.chain, { n: e.steps.length }), e.player, { colour: '#ffd166' });
    else if (e.type === 'fire') effect(`${e.kind === 'heavy' ? T.heavy : T.light} ${e.stones}`, e.from, { colour: e.kind === 'heavy' ? '#f5803d' : '#f5c93d' });
    else if (e.type === 'clash') effect(e.winner === null ? T.draw : T.clash, null, { colour: '#ffffff', big: true });
    else if (e.type === 'land') effect(T.hit, e.to, { colour: '#ff5c5c' });
    else if (e.type === 'squeeze') effect(T.squeeze, null, { colour: '#ff9f7a' });
    else if (e.type === 'round') onRound(e);
    else if (e.type === 'over') onOver(e);
  }
}

function onRound(e) {
  if (e.winner !== null) effect(T.ko, 1 - e.winner, { colour: '#ff5c5c', big: true });
  if (net?.hosting && waitingFriend) seatFriend();
}

function onOver(e) {
  clearTimeout(overTimer);
  overTimer = setTimeout(() => endMatch(e.winner), OVER_PAUSE_MS);
}

function endMatch(winner, note = '') {
  const match = duel?.view;
  clearTimeout(overTimer);
  const watching = net?.watching || mine === null;
  $('end-title').textContent = watching
    ? fill(T.winsIs, { name: labelFor(winner) })
    : (winner === mine ? T.youWin : T.youLose);
  $('end-score').textContent = match ? fill(T.score, { a: match.wins[0], b: match.wins[1] }) : '';
  endNote = note;
  $('end-note').textContent = endNote;
  $('rematch').hidden = !!watching;
  room.running = false;
  net?.publish();
  show('end');
}

function labelFor(seat) {
  if (mine === seat) return T.you;
  const who = room.seats[seat];
  if (net?.active && !SEAT_OPEN.includes(who)) return mine === null ? fill(T.player, { n: seat + 1 }) : T.rival;
  return net?.active && mine === null ? fill(T.player, { n: seat + 1 }) : T.cpu;
}

function labels() {
  return {
    seats: [labelFor(0), labelFor(1)], round: T.round, light: T.light, heavy: T.heavy,
  };
}



function resize() {
  const canvas = $('stage');
  const ratio = window.devicePixelRatio || 1;
  const box = canvas.getBoundingClientRect();
  const w = Math.round(box.width * ratio);
  const h = Math.round(box.height * ratio);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { width: box.width, height: box.height, ratio };
}

function paint() {
  requestAnimationFrame(paint);
  if (screen !== 'match' || !duel) return;
  const size = resize();
  const ctx = $('stage').getContext('2d');
  ctx.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
  
  const layout = layoutMatch(size.width, size.height, { touch: false, mine: mine ?? 0 });
  drawMatch(ctx, size, layout, duel.view, effects, labels());
}

function wake() {
  const now = performance.now();
  const passed = now - lastWake;
  lastWake = now;
  if (screen !== 'match' || !duel) return;
  let ticks = clock.advance(passed);
  if (net?.active) ticks += Math.min(MAX_CATCH_UP, duel.behind);
  for (let i = 0; i < ticks; i += 1) {
    const events = duel.tick(hands.tick());
    if (events.length) stage(events);
    if (!duel) return;
    afterTick();
  }
  if (ticks) effects = effects.map((e) => ({ ...e, left: e.left - ticks })).filter((e) => e.left > 0);
}

function afterTick() {
  if (!net?.hosting) return;
  const tick = duel.confirmedTick - (duel.confirmedTick % HASH_EVERY);
  if (tick > lastHashed) {
    const hash = duel.hashAt(tick);
    if (hash !== null) net.sendHash(tick, hash);
    lastHashed = tick;
  }
}



function enterMatch(newDuel, seat) {
  duel = newDuel;
  mine = seat;
  effects = [];
  clock = createClock();
  lastWake = performance.now();
  lastHashed = 0;
  clearTimeout(overTimer);
  const watching = seat === null;
  $('pad').hidden = watching || !isTouch();
  $('cheer').hidden = !watching;
  $('match-watch').hidden = !watching;
  show('match');
}

function startSolo(state = null) {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const match = createMatch({ seed });
  if (state) applyCheat(match, state);
  enterMatch(createDuel({
    match, local: [0, 1], human: 0, cpus: { 1: { level: choice.level, seed: seed ^ 0x5bd1 } },
  }), 0);
}

const keySender = (seat, upTo, frames) => net?.sendKeys(seat, upTo, frames);


function hostStart(match = null) {
  const friend = !SEAT_OPEN.includes(room.seats[1]);
  const seed = Math.floor(Math.random() * 2 ** 31);
  const start = match ?? createMatch({ seed });
  room.running = true;
  enterMatch(createDuel({
    match: start,
    local: friend ? [0] : [0, 1],
    human: 0,
    cpus: friend ? {} : { 1: { level: choice.level, seed: seed ^ 0x5bd1 } },
    send: keySender,
  }), 0);
  net.publish();
  net.sendStart(start, room.seats);
  watcherStarted.clear();
  for (const id of net.peers()) if (net.isWatcher(id)) watcherStarted.add(id);
}


function seatFriend() {
  room.seats = seatsWith(room.seats, waitingFriend);
  waitingFriend = null;
  hostStart(duel.confirmed);
}

function guestStart({ snapshot, seats }) {
  room.seats = seats;
  room.running = true;
  const seat = net.watching ? -1 : seatOf(seats, net.id);
  const playing = seat >= 0;
  enterMatch(createDuel({ match: snapshot, local: playing ? [seat] : [], human: playing ? seat : null, send: playing ? keySender : null }), playing ? seat : null);
  $('match-watch').textContent = T.watching;
}



function makeNet() {
  net = createNet({
    snapshot: () => ({ seats: room.seats, running: room.running }),
    onMatch: (message) => {
      room.seats = message.seats;
      hadHost = true;
      
      
      
      if (net?.watching && screen === 'match' && message.running === false && SEAT_OPEN.includes(message.seats[1])) endMatch(0, T.playerLeft);
      drawRoom();
    },
    onStart: guestStart,
    onKeys: ({ seat, upTo, frames }) => duel?.receive(seat, upTo, frames),
    onHash: ({ tick, hash }) => {
      if (duel?.check(tick, hash) !== 'differs') return;
      desyncs += 1;
      net.wantSync();
    },
    onSync: (snapshot) => duel?.adopt(snapshot),
    onWantSync: (from) => { if (duel) net.sendSync(from, duel.confirmed); },
    onCheer: () => { if (screen === 'match') effect(T.cheered, null, { colour: '#7ad7ff' }); },
    onProposal: (action) => { if (action.kind === 'rematch' && screen === 'end') hostStart(); },
    onPeers: (peers, me) => {
      if (net?.hosting && me && room.seats[0] === 'host') room.seats = [me, room.seats[1]];
      if (net?.hosting && duel && room.running) {
        for (const id of peers) {
          if (!net.isWatcher(id) || watcherStarted.has(id)) continue;
          watcherStarted.add(id);
          sendLate(id);
        }
      }
      if (!net?.hosting && hadHost && !peers.length) hostGone();
      if (screen === 'room') drawRoom();
      $('match-watch').textContent = net?.watching ? T.watching : fill(T.watchers, { n: net?.watchers ?? 0 });
      if (net?.hosting && screen === 'match') $('match-watch').hidden = !net.watchers;
    },
    onArrival: (id) => {
      if (!room.running) {
        room.seats = seatsWith(room.seats, id);
        return;
      }
      
      waitingFriend = id;
      sendLate(id);
    },
    onUnseat: (id) => {
      if (waitingFriend === id) waitingFriend = null;
      room.seats = freeSeats(room.seats, [id]);
    },
    onGone: (id) => {
      if (waitingFriend === id) waitingFriend = null;
      if (!net?.hosting || !room.seats.includes(id)) return;
      room.seats = freeSeats(room.seats, [id]);
      if (screen === 'match') endMatch(0, T.rivalLeft);
      else net.publish();
      if (screen === 'room') drawRoom();
    },
    onStatus: (kind) => {
      if (kind === 'failed') {
        toast(T.badCode, 4000);
        leaveRoom();
      }
      if (kind === 'host' && net?.hosting && hadHost) hostGone();
      if (screen === 'room') drawRoom();
    },
  });
  return net;
}


function sendLate(id) {
  const snapshot = duel.confirmed;
  net.sendStart(snapshot, room.seats, id);
  for (const seat of [0, 1]) net.sendKeys(seat, duel.seatKnown(seat), duel.outgoing(seat, snapshot.tick));
}

function hostGone() {
  if (!net) return;
  hadHost = false;
  toast(T.hostLeft, 4000);
  leaveRoom();
}

function leaveRoom() {
  net?.leave();
  net = null;
  code = null;
  room = { seats: ['host', 'guest'], running: false };
  waitingFriend = null;
  watcherStarted.clear();
  hadHost = false;
  show('title');
}

function drawRoom() {
  if (!net) return;
  if (net.hosting) code = net.id ?? code;
  $('room-code').textContent = code ?? '-';
  const friend = !SEAT_OPEN.includes(room.seats[1]);
  const hosting = net.hosting;
  $('host-links').hidden = !hosting;
  $('start-room').hidden = !hosting;
  $('start-room').textContent = friend ? T.startRoom : T.startCpu;
  $('room-status').textContent = hosting ? (friend ? T.roomReady : T.roomWait) : (net.peers().length ? T.guestWait : T.connecting);
  $('watchers').hidden = !net.watchers;
  $('watchers').textContent = fill(T.watchers, { n: net.watchers });
}

function createRoom() {
  if (!canPlayTogether()) { toast(T.noRooms, 4000); return; }
  makeNet().host();
  show('room');
  drawRoom();
}

function joinRoom(typed, { watch = false } = {}) {
  if (!canPlayTogether()) { toast(T.noRooms, 4000); return; }
  const result = makeNet().join(typed, { watch });
  if (result.error) {
    net = null;
    toast(T.badCode, 4000);
    return;
  }
  code = typed;
  show('room');
  drawRoom();
}


async function invite(link, text = null) {
  const res = await shareLink({ link, gameName: 'Clashwell', code, text });
  if (res?.via === 'clipboard') toast(T.copied, 1500);
  else if (res?.via === 'manual') toast(res.url, 6000);
}



function fillStatic() {
  const text = {
    pitch: T.pitch, 'play-now': T.playNow, 'friend-h': T.friendH, 'create-room': T.createRoom, 'join-btn': T.join, 'how-h': T.howH,
    'keys-line': T.keysLine, 'keys-drop': T.keysDrop, 'select-h': T.selectH, 'fighter-note': T.fighterNote, 'level-h': T.levelH, fight: T.fight,
    'select-back': T.back, 'room-h': T.roomH, 'copy-link': T.share, 'watch-link': T.watchLink, 'leave-room': T.leave,
    cheer: T.cheer, quit: T.quit, rematch: T.rematch, 'to-title': T.title,
  };
  for (const [id, value] of Object.entries(text)) $(id).textContent = value;
  $('join-code').placeholder = T.joinHint;
  $('how-list').replaceChildren(...T.howLines.map((line) => Object.assign(document.createElement('li'), { textContent: line })));
}

function drawSelect() {
  const pick = (container, items, isOn, onPick) => {
    $(container).replaceChildren(...items.map(([value, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(isOn(value)));
      b.addEventListener('click', () => { onPick(value); drawSelect(); });
      return b;
    }));
  };
  pick('fighters', Array.from({ length: FIGHTERS }, (_, i) => [i, fill(T.fighter, { n: i + 1 })]), (v) => v === choice.fighter, (v) => { choice.fighter = v; });
  pick('levels', LEVELS.map((l) => [l, T.levels[l]]), (v) => v === choice.level, (v) => { choice.level = v; });
}

function wire() {
  $('play-now').addEventListener('click', () => { drawSelect(); show('select'); });
  $('fight').addEventListener('click', () => startSolo());
  $('select-back').addEventListener('click', () => show('title'));
  $('create-room').addEventListener('click', createRoom);
  $('join-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const typed = $('join-code').value.trim();
    if (typed) joinRoom(typed);
  });
  $('copy-link').addEventListener('click', () => invite(shareLinkFor(location.href, net?.id)));
  $('watch-link').addEventListener('click', () => invite(watchLinkFor(location.href, net?.id), T.watchInvite));
  $('leave-room').addEventListener('click', leaveRoom);
  $('start-room').addEventListener('click', () => hostStart());
  $('cheer').addEventListener('click', () => net?.cheer());
  $('quit').addEventListener('click', () => { if (net) leaveRoom(); else show('title'); });
  $('rematch').addEventListener('click', () => {
    if (net?.active && !net.hosting) net.propose({ kind: 'rematch' });
    else if (net?.active) hostStart();
    else startSolo();
  });
  $('to-title').addEventListener('click', () => { if (net) leaveRoom(); else show('title'); });

  addEventListener('keydown', (e) => {
    const key = KEYBOARD[e.code];
    if (!key || screen !== 'match') return;
    e.preventDefault();
    hands.down(key);
  });
  addEventListener('keyup', (e) => { const key = KEYBOARD[e.code]; if (key) hands.up(key); });
  addEventListener('blur', () => hands.clear());
  for (const button of $('pad').querySelectorAll('button')) {
    const key = button.dataset.key;
    button.addEventListener('pointerdown', (e) => { e.preventDefault(); button.setPointerCapture?.(e.pointerId); hands.down(key); });
    for (const end of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(end, () => hands.up(key));
  }
}

initAnalytics({ page: 'clashwell' });
fillStatic();
wire();
show('title');
drawSelect();
bootDone();

const params = new URLSearchParams(location.search);
const linkRoom = roomFromHref(location.href);
if (linkRoom) {
  joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH });
} else if (CHEATS.includes(params.get('state'))) {
  if (LEVELS.includes(params.get('level'))) choice.level = params.get('level');
  startSolo(params.get('state'));
  if (params.get('state') === 'over') endMatch(0);
} else if (params.has('solo')) {
  startSolo();
}


lastWake = performance.now();
setInterval(wake, STEP_MS);
requestAnimationFrame(paint);


globalThis.clashwell = Object.freeze({
  screen: () => screen,
  view: () => (duel ? structuredClone(duel.view) : null),
  mine: () => mine,
  confirmedTick: () => duel?.confirmedTick ?? null,
  hash: () => (duel ? hashMatch(duel.confirmed) : null),
  room: () => ({ seats: [...room.seats], hosting: !!net?.hosting, id: net?.id ?? null, code, watchers: net?.watchers ?? 0 }),
  phase: () => duel?.view.phase ?? null,
  
  desyncs: () => desyncs,
  PHASE,
});
