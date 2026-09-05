












































import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { routeKey } from '../../../web-engine/words/keyRouter.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';








import {
  displayName, shareLinkFor, joinIdFrom, describeSaying, describeRoom,
} from '../../../web-engine/words/coop.js';
import { WHITE, BLACK } from '../../../web-engine/chess/position.js';
import { speakMove } from '../../../web-engine/chess/notation.js';
import {
  newMatch, replay, applyMove, undo, resign, swapSides, seatsWith,
  sideFor, isMyTurn, describeMatch, resultFor, SOLO,
} from '../../../web-engine/chess/chessMatch.js';
import {
  botFor, levelFrom, rankFrom, describeBotPlayer, BOT_ID, isBot,
} from '../../../web-engine/chess/chessBot.js';
import { startThinking } from './bot.js';
import * as paint from './paint.js';
import * as boardScreen from './board.js';
import { mirror, announce, keysAre } from './a11y.js';
import {
  help, room as roomPanel, say as sayPanel, results, menu, sides, promotion, moves as movesPanel,
} from './panels.js';
import { createNet, canPlayTogether } from './net.js';
import { watchViewport } from '../../shared/ui/viewport.js';
import * as music from '../../shared/audio/lofi.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import * as sfx from './sfx.js';
import { cueFor } from '../../../web-engine/chess/chessSound.js';
import { easeOut } from '../../../web-engine/words/motion.js';
import { createCelebration } from '../../shared/ui/celebrate.js';
import { roomPresence } from '../../shared/net/roomPresence.js';
import { mountLiveBadge } from '../../shared/ui/liveBadge.js';
import { LIVE_PATH } from '../../../web-engine/net/presence.js';









try {
  if (globalThis.self !== globalThis.top) document.documentElement.classList.add('framed');
} catch {
  
  
  
}

initAnalytics({ page: 'farmy-chess' });
startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Farmy Chess is available.',
});


const BAR = 56;

const BAR_WIDE = 820;

const SAVE_KEY = 'fchess.solo.match';

const RECORD_KEY = 'fchess.record';

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

let record = readJson(RECORD_KEY) ?? { won: 0, drawn: 0, lost: 0 };
let bot = botFor(levelFrom(record));


let match = newMatch({ seats: [SOLO, BOT_ID] });
let derived = replay(match);

const roomState = {
  active: false,
  me: null,
  peers: [],
  status: '',
  copied: false,
  shownResult: false,
};
let net = null;
let thinker = null;
let thinkingAt = null;


const meId = () => (roomState.active && roomState.me ? roomState.me : SOLO);

const app = {
  width: 0,
  height: 0,
  motion: !(reduceMotion?.matches),
  message: '',
  keyboardMode: false,
  now: () => performance.now(),
  invalidate,
  announce: (m) => { app.message = m; announce(m); invalidate(); },
  
  
  slide: (now) => slide(now),
  sound: (event) => sfx.play(event),
  me: SOLO,
  state: () => derived,
  myTurn: () => isMyTurn(derived, app.me) && !isBot(derived.turnId),
  notYourTurn: () => (derived.over
    ? 'The game is over. Start a new one.'
    : (isBot(derived.turnId) ? 'The bot is thinking.' : 'It is not your move.')),
  play,
  control,
  controlDisabled: (id) => {
    if (id === 'undo') return !match.moves.length && !match.resigned;
    if (id === 'resign') return derived.over;
    return false;
  },
  choosePromotion: openPromotion,
  nameOf,
  








  seatLabel: (i) => (derived.seats[0] === derived.seats[1]
    ? (i === 0 ? 'White' : 'Black')
    : nameOf(derived.seats[i])),
  names: () => Object.fromEntries(derived.seats.map((id) => [id, nameOf(id)])),
  isBotSeat: isBot,
  botLine: () => (derived.seats.some(isBot) ? describeBotPlayer(bot) : null),
  status: () => app.message || describeMatch(derived, { me: app.me, names: app.names() }),
  orientation,
  thinking: () => thinkingAt,
  
  
  
  
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











const chosen = {};
function nameOf(id) {
  if (isBot(id)) return 'The bot';
  if (id === app.me) return 'You';
  if (id === SOLO) return 'You';
  return displayName(id, chosen);
}








function orientation() {
  const side = sideFor(derived.seats, app.me);
  if (!side) return 'white';
  return side === BLACK ? 'black' : 'white';
}






function rederive() {
  derived = replay(match);
  if (!roomState.active) writeJson(SAVE_KEY, match);
  screen?.reload?.();
  checkFinished();
  maybeThink();
}







function play(key) {
  const check = applyMove(match, key, roomState.active ? app.me : null);
  if (check.error) { app.announce(check.error); return check.error; }
  if (roomState.active && net && !net.hosting) {
    net.propose({ kind: 'move', key });
    app.message = 'Sent to the room...';
    invalidate();
    return null;
  }
  land(check.match, key);
  return null;
}










const SLIDE_MS = 280;

let slideFrom = -1;
let slideTo = -1;
let slideAt = 0;









function slide(now) {
  if (!app.motion || slideFrom < 0) return null;
  const t = (now - slideAt) / SLIDE_MS;
  if (t >= 1 || t < 0) return null;
  return { from: slideFrom, to: slideTo, t: easeOut(t) };
}








function announceMoveAloud() {
  const last = derived.moves[derived.moves.length - 1];
  if (!last) return;
  slideFrom = last.from;
  slideTo = last.to;
  slideAt = app.now();
  sfx.playEvent({
    from: last.from,
    to: last.to,
    captured: last.captured || undefined,
    promotion: last.promo || undefined,
    castle: !!last.castle,
    check: !!derived.check,
    over: !!derived.over,
  });
}


function land(next, key) {
  match = next;
  rederive();
  announceMoveAloud();
  net?.publish();
  const said = derived.moves.length
    ? describeMoveJustPlayed()
    : 'A new game.';
  app.message = said;
  announce(said);
  trackEvent('chess_move', { key, moves: match.moves.length });
  relayout();
  invalidate();
}

function describeMoveJustPlayed() {
  const at = derived.positions[derived.positions.length - 2];
  const last = derived.moves[derived.moves.length - 1];
  if (!at || !last) return '';
  
  
  
  return `${speakMove(at, last)}${derived.over ? ` ${derived.outcome.text}` : ''}`;
}


function onProposal(action) {
  if (!action || typeof action !== 'object') return;
  if (action.kind === 'move') {
    const check = applyMove(match, action.key, undefined);
    if (check.error) {
      
      
      
      
      net?.publish();
      return;
    }
    land(check.match, action.key);
    return;
  }
  if (action.kind === 'undo') { doUndo(); return; }
  if (action.kind === 'resign') {
    const r = resign(match, action.by);
    if (r.match) land(r.match, 'resign');
  }
}













function adopt(incoming) {
  if (!incoming || !Array.isArray(incoming.seats)) return;
  const had = match.moves.length;
  match = {
    startFen: incoming.startFen,
    seats: incoming.seats,
    moves: Array.isArray(incoming.moves) ? incoming.moves : [],
    resigned: incoming.resigned ?? null,
  };
  app.me = meId();
  stopThinking();
  rederive();
  if (derived.moves.length > had) {
    const said = describeMoveJustPlayed();
    if (said) { app.message = said; announce(said); }
  } else if (derived.moves.length < had) {
    app.message = 'The other player took a move back.';
    announce(app.message);
  }
  relayout();
  invalidate();
}


function restart(seats = match.seats) {
  stopThinking();
  match = newMatch({ seats });
  roomState.shownResult = false;
  app.me = meId();
  rederive();
  net?.publish();
  app.message = 'A new game.';
  announce(app.message);
  relayout();
  invalidate();
}

function doUndo() {
  const r = undo(match);
  if (r.error) { app.announce(r.error); return; }
  stopThinking();
  match = r.match;
  roomState.shownResult = false;
  rederive();
  net?.publish();
  app.message = 'Taken back.';
  announce(app.message);
  relayout();
  invalidate();
}

function control(id) {
  if (id === 'undo') {
    
    
    
    
    if (roomState.active && net && !net.hosting) { net.propose({ kind: 'undo' }); return; }
    doUndo();
    return;
  }
  if (id === 'resign') {
    if (derived.over) { app.announce('The game is already over.'); return; }
    if (roomState.active && net && !net.hosting) { net.propose({ kind: 'resign', by: app.me }); return; }
    const r = resign(match, app.me);
    if (r.error) { app.announce(r.error); return; }
    land(r.match, 'resign');
    return;
  }
  if (id === 'moves') openMoves();
}







const party = createCelebration({
  now: () => performance.now(),
  colours: COLORS,
  motion: () => app.motion,
});

function checkFinished() {
  if (!derived.over) return;
  if (roomState.shownResult) return;
  roomState.shownResult = true;
  const outcome = resultFor(derived, app.me);
  
  
  if (outcome === 'won') { party.start(); invalidate(); }
  if (outcome === 'won') record = { ...record, won: record.won + 1 };
  else if (outcome === 'lost') record = { ...record, lost: record.lost + 1 };
  else if (outcome === 'draw') record = { ...record, drawn: record.drawn + 1 };
  writeJson(RECORD_KEY, record);
  
  
  bot = botFor(levelFrom(record));
  trackEvent('chess_finished', { reason: derived.outcome.reason, result: derived.outcome.result });
  setTimeout(openResults, 700);
}





function stopThinking() {
  thinker?.cancel();
  thinker = null;
  thinkingAt = null;
}










function maybeThink() {
  stopThinking();
  if (derived.over) return;
  if (!isBot(derived.turnId)) return;
  
  
  
  if (roomState.active && net && !net.hosting) return;
  thinkingAt = 0;
  relayout();
  invalidate();
  thinker = startThinking(derived.pos, bot, {
    onProgress: (share) => { thinkingAt = share; invalidate(); },
    onMove: (key) => {
      thinker = null;
      thinkingAt = null;
      if (!key) { relayout(); invalidate(); return; }
      const check = applyMove(match, key, undefined);
      if (!check.match) { relayout(); invalidate(); return; }
      land(check.match, key);
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (w <= 0 || h <= 0) {
    if (app.width > 0 && app.height > 0) return;
    globalThis.requestAnimationFrame(() => resize());
    return;
  }
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  app.width = w;
  app.height = h;
  relayout();
  invalidate();
}










function contentBox() {
  const pad = app.width < 520 ? 2 : 16;
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
  return n <= 1 ? 'Room open' : `Together: ${n}`;
};

function layoutBar() {
  
  
  
  const right = app.width - 12;
  const y = 6;
  const h = 44;
  if (app.width < BAR_WIDE) {
    
    
    
    
    barRects = [{ x: right - 100, y, w: 100, h, id: 'menu', label: roomState.active ? 'Menu •' : 'Menu' }];
    return;
  }
  const helpX = right - 48;
  const togetherX = helpX - 8 - 150;
  const sidesX = togetherX - 8 - 150;
  const newX = sidesX - 8 - 150;
  barRects = [
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: togetherX, y, w: 150, h, id: 'together', label: togetherLabel() },
    { x: sidesX, y, w: 150, h, id: 'sides', label: 'Play a bot' },
    { x: newX, y, w: 150, h, id: 'new', label: 'New game' },
  ];
}

function drawBar(now) {
  const room = Math.max(120, (barRects[barRects.length - 1]?.x ?? app.width) - 24);
  paint.text(g, 'Farmy Chess', { x: 12, y: 6, width: room, height: 44 }, {
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

const openHelp = () => show(help(app, { onClose: closeOverlay }));

const openMoves = () => show(movesPanel(app, {
  state: { rows: derived.list.map((r) => `${r.number}. ${r.white}${r.black ? ` ${r.black}` : ''}`) },
  onClose: closeOverlay,
}));

function openPromotion(white, onPick) {
  show(promotion(app, {
    white,
    onPick: (letter) => { closeOverlay(); onPick(letter); },
    onCancel: () => { screen.clearSelection(); closeOverlay(); },
  }));
}

function openSides() {
  show(sides(app, {
    state: {
      get botLine() {
        return `${describeBotPlayer(bot)} You are ${rankFrom(record)}, from ${record.won + record.drawn + record.lost} games.`;
      },
    },
    onChoose: ({ bot: wantsBot, white }) => {
      closeOverlay();
      const you = meId();
      const seats = wantsBot
        ? (white ? [you, BOT_ID] : [BOT_ID, you])
        : [you, you];
      restart(seats);
    },
    onClose: closeOverlay,
  }));
}

function openResults() {
  show(results(app, {
    state: {
      summary: derived.outcome.text,
      detail: `${record.won} won, ${record.drawn} drawn, ${record.lost} lost. You are ${rankFrom(record)}.`,
    },
    onAgain: () => { closeOverlay(); restart(); },
    onSwap: () => { closeOverlay(); const s = swapSides(match); match = s; roomState.shownResult = false; rederive(); net?.publish(); relayout(); invalidate(); },
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
      get who() {
        return derived.seats.map((id, i) => `${i === 0 ? 'White' : 'Black'}: ${nameOf(id)}`);
      },
    },
    onHost: () => {
      roomState.copied = false;
      roomState.active = true;
      
      
      
      
      
      startNet().host();
      relayout();
      invalidate();
    },
    onJoin: (code) => {
      roomState.copied = false;
      roomState.active = true;
      startNet().join(code);
      relayout();
      invalidate();
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
      match = saved?.seats?.length ? saved : newMatch({ seats: [SOLO, BOT_ID] });
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
      { id: 'sides', label: 'Play a bot, or choose a side', tone: 'blue', run: openSides },
      { id: 'together', label: togetherLabel(), run: openRoom },
      ...(roomState.active && roomState.peers.length > 1
        ? [{ id: 'say', label: 'Say something', run: openSay }] : []),
      { id: 'new', label: 'New game', run: () => { closeOverlay(); restart(); } },
      { id: 'moves', label: 'The moves so far', run: openMoves },
      
      
      
      
      {
        id: 'sound',
        label: sfx.isMuted() ? 'Sound: off' : 'Sound: on',
        run: () => {
          const muted = sfx.setMuted(!sfx.isMuted());
          if (!muted) sfx.play('lift');
          announce(muted ? 'Sound off.' : 'Sound on.');
          openMenu();
        },
      },
      { id: 'help', label: 'How to play', run: openHelp },
      { id: 'close', label: 'Close', run: closeOverlay },
    ],
  }));
}

















function wireLiveBadge() {
  const bar = document.querySelector('.studio-bar');
  if (!bar) return;
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
wireLiveBadge();

const presence = roomPresence({
  game: 'chess',
  net: () => net,
  players: () => roomState.peers.length + 1,
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
      if (net?.hosting && roomState.me && !match.seats.includes(roomState.me)) {
        
        
        
        match = { ...match, seats: match.seats.map((s) => (s === SOLO ? roomState.me : s)) };
        rederive();
      }
      relayout();
      invalidate();
    },
    onArrival: (id) => {
      const seats = seatsWith(match.seats, id);
      if (seats === match.seats) return;
      match = { ...match, seats };
      rederive();
      net?.publish();
      relayout();
      invalidate();
    },
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
    else if (id === 'sides') openSides();
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
    { screen: 'chess', overlay: !!overlay, games: ['chess'] },
  );
  if (!action) return;
  e.preventDefault();
  if (action.type === 'move') { app.keyboardMode = true; invalidate(); }
  if (action.type === 'back') { if (overlay) closeOverlay(); return; }
  if (action.type === 'help') { if (overlay) closeOverlay(); else openHelp(); return; }
  (overlay ?? screen).key(action);
});

reduceMotion?.addEventListener?.('change', (e) => {
  app.motion = !e.matches;
  invalidate();
});











sfx.install();




watchViewport(resize, canvas);




wireMusicButton({ music, announce, });

















globalThis.__fchess = {
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
      keys: match.moves,
      turn: derived.turn === WHITE ? 'white' : 'black',
      turnId: derived.turnId,
      check: derived.check,
      over: derived.over,
      result: derived.outcome.result,
      reason: derived.outcome.reason,
      list: derived.list,
      fen: derived.startFen,
    };
  },
  get bot() { return { ...bot, thinking: thinkingAt }; },
  get record() { return { ...record }; },
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
if (saved && Array.isArray(saved.seats) && saved.seats.length && Array.isArray(saved.moves)) {
  match = { resigned: null, ...saved };
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
  startNet().join(linkRoom);
}

trackEvent('game_start', { game: 'farmy-chess' });
