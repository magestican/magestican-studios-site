














































import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { routeKey } from '../../../web-engine/words/keyRouter.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import { levelOf } from '../../../web-engine/words/scoring.js';
import {
  nameFor, shareLinkFor, joinIdFrom, describeSaying, describeRoom,
} from '../../../web-engine/words/coop.js';
import { SIDE_NAMES } from '../../../web-engine/checkers/checkersRules.js';
import {
  SOLO, createMatch, replay, applyAction, withMove, wireMove, undoPlies,
  undoMatch, seatsWith, standings, isMyTurn, sideOfSeat, seatOfSide,
} from '../../../web-engine/checkers/checkersMatch.js';
import {
  describeTurn, describeLast, describeResult, moveList,
} from '../../../web-engine/checkers/checkersDescribe.js';
import { botFor } from '../../../web-engine/checkers/checkersBot.js';
import * as paint from './paint.js';
import * as boardScreen from './board.js';
import { mirror, announce, keysAre } from './a11y.js';
import {
  help, room as roomPanel, say as sayPanel, results, menu, moves as movesPanel,
  bot as botPanel,
} from './panels.js';
import { createNet, canPlayTogether } from './net.js';
import { watchViewport } from '../../shared/ui/viewport.js';
import * as music from '../../shared/audio/lofi.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { createCelebration } from '../../shared/ui/celebrate.js';
import { roomPresence } from '../../shared/net/roomPresence.js';
import { mountLiveBadge } from '../../shared/ui/liveBadge.js';
import { LIVE_PATH } from '../../../web-engine/net/presence.js';
import { think } from './bot.js';







try {
  if (globalThis.self !== globalThis.top) document.documentElement.classList.add('framed');
} catch {
  
  
  
}

initAnalytics({ page: 'farmy-checkers' });
startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Farmy Checkers is available.',
});


const BAR = 56;

const BAR_WIDE = 700;

const SAVE_KEY = 'fch.solo.match';

const RECORD_KEY = 'fch.record';

const BOT = 'bot';

const canvas = document.getElementById('board');
const g = canvas.getContext('2d');




const readJson = (key) => {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeJson = (key, value) => {
  try { globalThis.localStorage?.setItem(key, JSON.stringify(value)); } catch {  }
};

const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');









let match = createMatch({ seats: [SOLO, SOLO] });
let derived = replay(match);









const record = readJson(RECORD_KEY) ?? { played: 0, won: 0, drawn: 0, points: 0 };

const bot = {
  
  seat: -1,
  strength: 0,
  name: 'Bot',
  kind: '',
  thinking: false,
  cancel: null,
};

const roomState = {
  active: false,
  me: null,
  peers: [],
  status: '',
  copied: false,
  shownResult: false,
};
let net = null;


const meId = () => (roomState.active && roomState.me ? roomState.me : SOLO);

const app = {
  width: 0,
  height: 0,
  motion: !(reduceMotion?.matches),
  message: '',
  keyboardMode: false,
  now: () => performance.now(),
  invalidate,
  announce: (m) => announce(m),
  me: SOLO,
  state: () => derived,
  myTurn: () => (bot.thinking ? false : isMyTurn(derived, app.me)),
  nameOf: (id) => {
    if (id === SOLO) return 'You';
    if (id === BOT) return bot.name;
    return nameFor(id);
  },
  seatName: (seat) => {
    const id = derived.seats[seat];
    const side = SIDE_NAMES[sideOfSeat(seat)];
    
    if (id === app.me && derived.seats[0] !== derived.seats[1]) return `${side} (you)`;
    return side;
  },
  isBotSeat: (seat) => bot.seat === seat,
  inRoom: () => roomState.active,
  
  mySide: () => {
    if (derived.seats[0] === derived.seats[1]) return -1;
    const seat = derived.seats.indexOf(app.me);
    return seat < 0 ? -1 : sideOfSeat(seat);
  },
  






  viewFlipped: () => {
    if (derived.seats[0] === derived.seats[1]) return false;
    return derived.seats.indexOf(app.me) === 1;
  },
  hasBot: () => bot.seat >= 0,
  botLabel: () => (bot.seat >= 0 ? `Bot: ${SIDE_NAMES[sideOfSeat(bot.seat)]}` : 'Play a bot'),
  botLine: () => `${bot.name} is a computer opponent, ${bot.kind}, playing the ${SIDE_NAMES[sideOfSeat(bot.seat)].toLowerCase()}.`,
  turnMessage: () => (bot.thinking
    ? `${bot.name} is thinking. It is a computer opponent.`
    : describeTurn(derived, { me: app.me, nameOf: app.nameOf })),
  act,
  undo,
  canUndo: () => derived.history.length > 0 && !bot.thinking,
  openPanel: (id) => {
    if (id === 'moves') openMoves();
    else if (id === 'bot') openBot();
  },
  
  
  
  
  wrap: (string, width, opts) => paint.wrap(g, string, width, opts),
};

let screen = null;
let overlay = null;
let dirty = true;
let looping = false;
let wasMoving = false;
let barRects = [];
let barHover = -1;
let barHoverAt = 0;






function rederive() {
  derived = replay(match);
  if (!roomState.active) writeJson(SAVE_KEY, { match, botSeat: bot.seat });
  screen?.reload?.();
  checkFinished();
  maybeThink();
}







function act(action) {
  const check = applyAction(derived, { ...action, by: seatOwner() });
  if (check.error) return check.error;
  if (roomState.active && net && !net.hosting) {
    net.propose({ ...action, by: app.me });
    app.message = 'Sent to the room...';
    return null;
  }
  commit(check.move);
  return null;
}









const seatOwner = () => (derived.seats[0] === derived.seats[1] ? null : app.me);


function commit(move) {
  match = withMove(match, move);
  rederive();
  net?.publish();
  app.message = describeLast(derived, { me: app.me, nameOf: app.nameOf });
  announce(app.message);
  trackEvent('checkers_move', { took: (move.captured ?? []).length, bot: bot.seat >= 0 });
  relayout();
  invalidate();
}


function onProposal(action) {
  const check = applyAction(derived, action);
  if (check.error) {
    
    
    
    
    net?.publish();
    return;
  }
  commit(check.move);
}


function adopt(incoming) {
  if (!incoming || !Array.isArray(incoming.seats) || !incoming.seats.length) return;
  stopThinking();
  match = { seats: incoming.seats, moves: Array.isArray(incoming.moves) ? incoming.moves : [] };
  app.me = meId();
  rederive();
  relayout();
  invalidate();
}


function restart(seats = match.seats) {
  stopThinking();
  match = createMatch({ seats });
  roomState.shownResult = false;
  app.me = meId();
  rederive();
  net?.publish();
  app.message = describeTurn(derived, { me: app.me, nameOf: app.nameOf });
  announce(`A new game. ${app.message}`);
  relayout();
  invalidate();
}


function seat(id) {
  const seats = seatsWith(match.seats, id, match.moves.length > 0);
  if (seats === match.seats) return;
  match = { seats, moves: match.moves };
  
  
  if (bot.seat >= 0 && !seats.includes(BOT)) stopBot();
  rederive();
  net?.publish();
  relayout();
  invalidate();
}








function undo() {
  const count = undoPlies(derived, { me: app.me, bots: [BOT] });
  if (!count) return;
  if (roomState.active && net && !net.hosting) {
    
    
    
    app.message = 'Only the person who opened the room can take a move back.';
    announce(app.message);
    invalidate();
    return;
  }
  stopThinking();
  match = undoMatch(match, count);
  roomState.shownResult = false;
  rederive();
  net?.publish();
  app.message = `Taken back. ${describeTurn(derived, { me: app.me, nameOf: app.nameOf })}`;
  announce(app.message);
  relayout();
  invalidate();
}







const party = createCelebration({
  now: () => performance.now(),
  colours: COLORS,
  motion: () => app.motion,
});

function checkFinished() {
  if (!derived.over || roomState.shownResult) return;
  roomState.shownResult = true;
  const seat = derived.seats.indexOf(app.me);
  const won = !derived.draw && seat >= 0 && seatOfSide(derived.winner) === seat;
  
  
  
  if (seatOwner()) {
    record.played += 1;
    if (derived.draw) record.drawn += 1;
    else if (won) record.won += 1;
    
    record.points += derived.draw ? 40 : (won ? 100 : 15);
    writeJson(RECORD_KEY, record);
  }
  
  
  
  
  if (won && seatOwner()) { party.start(); invalidate(); }
  trackEvent('checkers_finished', { won, draw: derived.draw, reason: derived.reason });
  setTimeout(openResults, 700);
}





function stopThinking() {
  bot.cancel?.();
  bot.cancel = null;
  bot.thinking = false;
}

function stopBot() {
  stopThinking();
  bot.seat = -1;
  match = { seats: match.seats.map((s) => (s === BOT ? SOLO : s)), moves: match.moves };
}








function playBot(mySeat) {
  const seat = mySeat === 0 ? 1 : 0;
  const level = levelOf(record.points).share;
  const made = botFor(level, { index: 0 });
  bot.seat = seat;
  bot.strength = made.strength;
  bot.kind = made.kind;
  bot.name = 'Bot';
  const seats = seat === 1 ? [SOLO, BOT] : [BOT, SOLO];
  app.me = SOLO;
  restart(seats);
  trackEvent('checkers_bot', { seat, strength: Number(made.strength.toFixed(2)) });
}


function maybeThink() {
  if (bot.seat < 0 || derived.over || bot.thinking) return;
  if (derived.seats[seatOfSide(derived.turn)] !== BOT) return;
  const at = match.moves.length;
  bot.thinking = true;
  invalidate();
  bot.cancel = think({
    board: derived.board,
    side: derived.turn,
    strength: bot.strength,
    
    
    
    stillValid: () => bot.seat >= 0 && match.moves.length === at && !derived.over,
    play: (move) => {
      bot.thinking = false;
      bot.cancel = null;
      commit(wireMove(move));
    },
  });
}





function invalidate() {
  dirty = true;
  if (!looping) {
    looping = true;
    requestAnimationFrame(frame);
  }
}

function resize() {
  const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  app.width = w;
  app.height = h;
  relayout();
  invalidate();
}

function contentBox() {
  const pad = app.width < 520 ? 8 : 20;
  return { x: pad, y: BAR + 6, width: app.width - pad * 2, height: app.height - BAR - 16 };
}

function relayout() {
  layoutBar();
  if (screen) screen.layout(contentBox());
  if (overlay) overlay.layout();
}

const togetherLabel = () => {
  if (!roomState.active) return 'Together';
  const n = roomState.peers.length;
  return n <= 1 ? 'Room open' : 'Together: 2';
};

function layoutBar() {
  
  
  
  const right = app.width - 12;
  const y = 6;
  const h = 44;
  if (app.width < BAR_WIDE) {
    
    
    
    
    barRects = [{
      x: right - 100, y, w: 100, h, id: 'menu', label: roomState.active ? 'Menu •' : 'Menu',
    }];
    return;
  }
  const helpX = right - 48;
  const togetherX = helpX - 8 - 150;
  const newX = togetherX - 8 - 150;
  barRects = [
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: togetherX, y, w: 150, h, id: 'together', label: togetherLabel() },
    { x: newX, y, w: 150, h, id: 'new', label: 'New game' },
  ];
}

function drawBar(now) {
  const room = Math.max(120, (barRects[barRects.length - 1]?.x ?? app.width) - 24);
  paint.text(g, 'Farmy Checkers', { x: 12, y: 6, width: room, height: 44 }, {
    size: SIZES.h2, colour: COLORS.ink, align: 'left', fit: true, maxWidth: room,
  });
  
  
  paint.rule(g, 0, BAR - 4, app.width);
  barRects.forEach((b, i) => {
    paint.button(g, b, {
      label: b.label,
      size: SIZES.min,
      hover: i === barHover ? lift(progress(now, barHoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
  });
}

function frame() {
  const now = performance.now();
  const active = overlay ?? screen;
  const step = tick({
    dirty,
    moving: !!(active && active.animating(now)) || party.running(),
    wasMoving,
  });
  dirty = false;
  wasMoving = step.wasMoving;
  if (step.draw) {
    paint.clear(g, app.width, app.height);
    if (screen) screen.draw(g, now);
    drawBar(now);
    if (overlay) overlay.draw(g, now);
    
    
    
    party.draw(g, app.width, app.height);
    const d = active.describe();
    
    
    
    mirror({ ...d, status: app.message || d.status, lines: d.lines });
  }
  if (step.again) requestAnimationFrame(frame);
  else looping = false;
}





function closeOverlay() {
  overlay = null;
  app.message = '';
  keysAre(screen.keys);
  relayout();
  invalidate();
}

function show(panel) {
  app.message = '';
  overlay = panel;
  overlay.layout();
  invalidate();
}

const openHelp = () => show(help(app, {
  lines: screen.help,
  keys: screen.keys,
  onClose: closeOverlay,
}));

const openMoves = () => show(movesPanel(app, {
  state: {
    list: () => moveList(derived),
    canUndo: () => app.canUndo(),
  },
  onUndo: () => { closeOverlay(); undo(); },
  onClose: closeOverlay,
}));

const openBot = () => show(botPanel(app, {
  state: {
    active: () => bot.seat >= 0,
    otherSeat: () => (bot.seat === 0 ? 1 : 0),
    describe: () => app.botLine(),
  },
  onPlay: (mySeat) => { closeOverlay(); playBot(mySeat); },
  onStop: () => { closeOverlay(); stopBot(); rederive(); relayout(); invalidate(); },
  onClose: closeOverlay,
}));

function openResults() {
  show(results(app, {
    state: {
      summary: () => describeResult(derived, { me: app.me, nameOf: app.nameOf }),
      rows: () => standings(derived).map((r) => (
        `${app.nameOf(r.id)} played the ${SIDE_NAMES[r.side].toLowerCase()}: ${r.left} left, ${r.taken} taken`
      )),
    },
    onAgain: () => { closeOverlay(); restart(); },
    onClose: closeOverlay,
  }));
}

function openRoom() {
  startNet();
  show(roomPanel(app, {
    
    
    
    
    state: {
      get active() { return roomState.active; },
      get code() { return net?.id ?? ''; },
      get summary() { return describeRoom({ peers: roomState.peers, me: roomState.me }); },
      get status() { return roomState.status; },
      get copied() { return roomState.copied; },
      get canStart() { return !!net?.hosting && roomState.peers.length > 1; },
      get who() {
        return derived.seats.map((id, seatIndex) => ({
          name: app.nameOf(id),
          you: id === app.me,
          side: SIDE_NAMES[sideOfSeat(seatIndex)].toLowerCase(),
        }));
      },
    },
    onHost: () => {
      roomState.copied = false;
      roomState.active = true;
      
      
      stopBot();
      
      
      
      startNet().host();
      relayout();
      invalidate();
    },
    onJoin: (code) => {
      roomState.copied = false;
      roomState.active = true;
      stopBot();
      const outcome = startNet().join(code);
      
      
      
      if (outcome?.error) {
        roomState.active = false;
        net = null;
        app.message = outcome.error;
        announce(outcome.error);
      }
      relayout();
      invalidate();
    },
    onStart: () => {
      restart([...new Set([roomState.me, ...roomState.peers])].filter(Boolean).slice(0, 2));
      closeOverlay();
    },
    onLeave: () => {
      presence.withdraw();
      net?.leave();
      net = null;
      roomState.active = false;
      roomState.me = null;
      roomState.peers = [];
      app.me = SOLO;
      
      const saved = readJson(SAVE_KEY);
      match = saved?.match?.seats?.length ? saved.match : createMatch({ seats: [SOLO, SOLO] });
      bot.seat = Number.isInteger(saved?.botSeat) ? saved.botSeat : -1;
      if (bot.seat >= 0) {
        const made = botFor(levelOf(record.points).share, { index: 0 });
        bot.strength = made.strength;
        bot.kind = made.kind;
      }
      rederive();
      closeOverlay();
    },
    onCopy: () => {
      const link = shareLinkFor(globalThis.location.href, net?.id ?? '', {});
      try {
        globalThis.navigator?.clipboard?.writeText(link);
        roomState.copied = true;
        announce('Link copied. Send it to whoever you want to play with.');
      } catch {
        announce(`Copy this: ${link}`);
      }
      overlay?.refresh();
      invalidate();
    },
    onClose: closeOverlay,
  }));
}

const openSay = () => show(sayPanel(app, {
  onSay: (id) => {
    net?.say(id);
    const line = describeSaying({ by: roomState.me, id, me: roomState.me });
    if (line) { closeOverlay(); app.message = line; announce(line); }
  },
  onClose: closeOverlay,
}));

function openMenu() {
  show(menu(app, {
    items: [
      { id: 'together', label: togetherLabel(), tone: 'blue', run: openRoom },
      ...(roomState.active && roomState.peers.length > 1
        ? [{ id: 'say', label: 'Say something', run: openSay }] : []),
      { id: 'new', label: 'New game', run: () => { closeOverlay(); restart(); } },
      { id: 'bot', label: app.botLabel(), run: openBot },
      { id: 'help', label: 'How to play', run: openHelp },
      { id: 'close', label: 'Close', run: closeOverlay },
    ],
  }));
}












const presence = roomPresence({
  game: 'checkers',
  net: () => net,
  players: () => new Set([roomState.me, ...roomState.peers].filter(Boolean)).size || 1,
});

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => match,
    onMatch: adopt,
    onProposal,
    onPeers: (peers, me) => {
      roomState.peers = peers;
      
      
      presence.sync();
      if (me) roomState.me = me;
      roomState.active = !!(me || peers.length);
      app.me = meId();
      if (net?.hosting && roomState.me && !match.seats.includes(roomState.me)
        && !match.moves.length) {
        
        
        
        match = { seats: [roomState.me, match.seats[1]], moves: [] };
        rederive();
      }
      relayout();
      invalidate();
    },
    onArrival: seat,
    onStatus: (status) => {
      roomState.status = status;
      announce(status);
      overlay?.refresh?.();
      relayout();
      invalidate();
    },
    onSay: ({ say, by }) => {
      const line = describeSaying({ by, id: say, me: roomState.me });
      if (!line) return;
      app.message = line;
      announce(line);
      invalidate();
    },
  });
  return net;
}





const pointAt = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

canvas.addEventListener('pointerdown', (e) => {
  const pt = pointAt(e);
  canvas.setPointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerDown(pt); return; }
  if (rectAt(barRects, pt.x, pt.y) >= 0) return;   
  screen.pointerDown(pt);
});

canvas.addEventListener('pointermove', (e) => {
  const pt = pointAt(e);
  if (overlay) { overlay.pointerMove(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar !== barHover) { barHover = bar; barHoverAt = performance.now(); invalidate(); }
  
  
  
  canvas.style.cursor = 'pointer';
  screen.pointerMove(pt);
});

canvas.addEventListener('pointerup', (e) => {
  const pt = pointAt(e);
  canvas.releasePointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerUp(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar >= 0) {
    const id = barRects[bar].id;
    if (id === 'help') openHelp();
    else if (id === 'together') openRoom();
    else if (id === 'menu') openMenu();
    else if (id === 'new') restart();
    return;
  }
  screen.pointerUp(pt);
});

canvas.addEventListener('pointerleave', () => {
  barHover = -1;
  if (overlay) overlay.pointerLeave();
  else screen.pointerLeave();
});




canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

document.addEventListener('keydown', (e) => {
  const action = routeKey(
    { key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
    { screen: 'checkers', overlay: !!overlay, games: ['checkers'] },
  );
  if (!action) return;
  e.preventDefault();
  if (action.type === 'move') { app.keyboardMode = true; invalidate(); }
  if (action.type === 'back') { if (overlay) { closeOverlay(); return; } }
  if (action.type === 'help') { if (overlay) closeOverlay(); else openHelp(); return; }
  (overlay ?? screen).key(action);
});

reduceMotion?.addEventListener?.('change', (e) => {
  app.motion = !e.matches;
  invalidate();
});






watchViewport(resize, canvas);




wireMusicButton({ music, announce });




{
  const bar = document.querySelector('.studio-bar');
  if (bar) {
    mountLiveBadge({
      host: bar,
      mine: () => net?.id ?? null,
      onJoin: (room) => {
        const path = LIVE_PATH[room.game];
        if (!path) return false;
        globalThis.location.href = `${path}?join=${encodeURIComponent(room.code)}`;
        return true;
      },
    });
  }
}

















globalThis.__fch = {
  get room() {
    return {
      active: roomState.active,
      me: roomState.me,
      peers: roomState.peers,
      code: net?.id ?? null,
      hosting: !!net?.hosting,
      status: roomState.status,
    };
  },
  get match() {
    return {
      seats: derived.seats,
      moves: match.moves.length,
      turn: derived.turn,
      counts: derived.counts,
      mustCapture: derived.mustCapture,
      over: derived.over,
      draw: derived.draw,
      winner: derived.winner,
      reason: derived.reason,
      board: derived.board.join(''),
    };
  },
  get bot() {
    return {
      seat: bot.seat, strength: bot.strength, thinking: bot.thinking, name: bot.name,
    };
  },
  get overlay() { return overlay ? overlay.id : null; },
  
  
  
  
  
  
  
  
  
  
  
  
  
  rects: () => {
    const box = canvas.getBoundingClientRect();
    const shift = (r) => ({ ...r, x: r.x + box.left, y: r.y + box.top });
    return [
      ...((overlay ?? screen).rects?.() ?? []),
      ...(overlay ? [] : barRects.map((b) => ({ id: `bar:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h }))),
    ].map(shift);
  },
};









const saved = readJson(SAVE_KEY);
if (saved?.match && Array.isArray(saved.match.seats) && Array.isArray(saved.match.moves)) {
  match = saved.match;
  if (Number.isInteger(saved.botSeat) && saved.botSeat >= 0) {
    const made = botFor(levelOf(record.points).share, { index: 0 });
    bot.seat = saved.botSeat;
    bot.strength = made.strength;
    bot.kind = made.kind;
  }
  derived = replay(match);
}

screen = boardScreen.create(app);
keysAre(screen.keys);
screen.reload();
resize();
maybeThink();










const linkRoom = joinIdFrom(globalThis.location.href);
if (linkRoom && canPlayTogether()) {
  roomState.active = true;
  stopBot();
  const outcome = startNet().join(linkRoom);
  if (outcome?.error) {
    roomState.active = false;
    net = null;
    app.message = outcome.error;
    announce(outcome.error);
    invalidate();
  }
}

trackEvent('game_start', { game: 'farmy-checkers' });
