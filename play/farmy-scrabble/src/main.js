








































import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { routeKey } from '../../../web-engine/words/keyRouter.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import { isWord } from '../../../web-engine/words/scrabbleWords.js';
import {
  applyAction, replay, seatsWith, isMyTurn, standings,
} from '../../../web-engine/words/scrabbleMatch.js';
import { describeResult, describeLast } from '../../../web-engine/words/scrabbleDescribe.js';
import {
  nameFor, colourFor, shareLinkFor, joinIdFrom, describeSaying, describeRoom,
} from '../../../web-engine/words/coop.js';
import * as paint from './paint.js';
import * as boardScreen from './board.js';
import { mirror, announce, keysAre } from './a11y.js';
import { help, values, letters, room as roomPanel, say as sayPanel, results, menu } from './panels.js';
import { createNet, canPlayTogether } from './net.js';

initAnalytics({ page: 'farmy-scrabble' });
startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Farmy Scrabble is available.',
});


const BAR = 56;

const BAR_WIDE = 760;

const SAVE_KEY = 'fs.solo.match';

const SOLO = 'you';

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


let match = { seed: freshSeed(), seats: [SOLO], actions: [] };
let derived = replay(match, isWord);

function freshSeed() {
  
  
  
  return Math.floor(Math.random() * 0x7FFFFFFF);
}

const roomState = {
  active: false,
  me: null,
  peers: [],
  status: '',
  copied: false,
  said: null,
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
  isWord,
  me: SOLO,
  state: () => derived,
  myTurn: () => isMyTurn(derived, app.me),
  nameOf: (id) => (id === SOLO ? 'You' : nameFor(id)),
  colourOf: (id) => (id === SOLO ? 'blue' : colourFor(id, roomState.peers)),
  act,
  chooseLetter: openLetters,
  
  
  
  
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
  derived = replay(match, isWord);
  if (!roomState.active) writeJson(SAVE_KEY, match);
  screen?.reload?.();
  checkFinished();
}







function act(action) {
  const check = applyAction(derived, action, isWord);
  if (check.error) return check.error;
  if (roomState.active && net && !net.hosting) {
    net.propose(action);
    app.message = 'Sent to the room...';
    return null;
  }
  match = { ...match, actions: [...match.actions, action] };
  rederive();
  net?.publish();
  app.message = describeLast(derived, { me: app.me, nameOf: app.nameOf });
  announce(app.message);
  trackEvent('scrabble_move', { kind: action.kind, score: check.state.last?.score ?? 0 });
  return null;
}


function onProposal(action) {
  const { error } = applyAction(derived, action, isWord);
  if (error) {
    
    
    
    
    net?.publish();
    return;
  }
  match = { ...match, actions: [...match.actions, action] };
  rederive();
  net?.publish();
  app.message = describeLast(derived, { me: app.me, nameOf: app.nameOf });
  announce(app.message);
  relayout();
  invalidate();
}


function adopt(incoming) {
  if (!incoming || !Array.isArray(incoming.seats) || !incoming.seats.length) return;
  match = {
    seed: incoming.seed,
    seats: incoming.seats,
    actions: Array.isArray(incoming.actions) ? incoming.actions : [],
  };
  app.me = meId();
  rederive();
  relayout();
  invalidate();
}








function restart(seats = match.seats) {
  match = { seed: freshSeed(), seats, actions: [] };
  roomState.shownResult = false;
  app.me = meId();
  rederive();
  net?.publish();
  app.message = 'A new game. Your turn.';
  announce(app.message);
  relayout();
  invalidate();
}


function seat(id) {
  const seats = seatsWith(match.seats, id, match.actions.length > 0);
  if (seats === match.seats) return;
  
  
  
  match = { seed: match.seed, seats, actions: [] };
  rederive();
  net?.publish();
  relayout();
  invalidate();
}

function checkFinished() {
  if (!derived.over || roomState.shownResult) return;
  roomState.shownResult = true;
  trackEvent('scrabble_finished', { seats: derived.seats.length });
  setTimeout(openResults, 700);
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
  const tilesX = helpX - 8 - 110;
  const togetherX = tilesX - 8 - 150;
  
  
  
  
  const newX = togetherX - 8 - 150;
  barRects = [
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: tilesX, y, w: 110, h, id: 'values', label: 'Tiles' },
    { x: togetherX, y, w: 150, h, id: 'together', label: togetherLabel() },
    { x: newX, y, w: 150, h, id: 'new', label: 'New game' },
  ];
}

function drawBar(now) {
  const room = Math.max(120, (barRects[barRects.length - 1]?.x ?? app.width) - 24);
  paint.text(g, 'Farmy Scrabble', { x: 12, y: 6, width: room, height: 44 }, {
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
  const step = tick({ dirty, moving: !!(active && active.animating(now)), wasMoving });
  dirty = false;
  wasMoving = step.wasMoving;
  if (step.draw) {
    paint.clear(g, app.width, app.height);
    if (screen) screen.draw(g, now);
    drawBar(now);
    if (overlay) overlay.draw(g, now);
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

const openValues = () => show(values(app, { onClose: closeOverlay }));







function openLetters(onPick) {
  show(letters(app, {
    onPick: (ch) => { closeOverlay(); onPick(ch); },
    onCancel: closeOverlay,
  }));
}

function openResults() {
  const table = standings(derived);
  show(results(app, {
    state: {
      summary: describeResult(derived, { me: app.me, nameOf: app.nameOf }),
      rows: table.map((r) => `${r.id === app.me ? 'You' : app.nameOf(r.id)}: ${r.score}`),
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
        return standings(derived).map((r) => ({
          name: app.nameOf(r.id), you: r.id === app.me, score: r.score,
        }));
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
    onStart: () => { restart([...new Set([roomState.me, ...roomState.peers])].filter(Boolean)); closeOverlay(); },
    onLeave: () => {
      net?.leave();
      net = null;
      roomState.active = false;
      roomState.me = null;
      roomState.peers = [];
      app.me = SOLO;
      
      const saved = readJson(SAVE_KEY);
      match = saved?.seats?.length ? saved : { seed: freshSeed(), seats: [SOLO], actions: [] };
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
      { id: 'values', label: 'What the tiles are worth', run: openValues },
      { id: 'help', label: 'How to play', run: openHelp },
      { id: 'close', label: 'Close', run: closeOverlay },
    ],
  }));
}





function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => match,
    onMatch: adopt,
    onProposal,
    onPeers: (peers, me) => {
      roomState.peers = peers;
      if (me) roomState.me = me;
      roomState.active = !!(me || peers.length);
      app.me = meId();
      if (net?.hosting) {
        
        
        
        if (roomState.me && !match.seats.includes(roomState.me) && !match.actions.length) {
          match = { seed: match.seed, seats: [roomState.me], actions: [] };
          rederive();
        }
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
      roomState.said = { by, id: say };
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
    else if (id === 'values') openValues();
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
    { screen: 'scrabble', overlay: !!overlay, games: ['scrabble'] },
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

globalThis.addEventListener('resize', resize);
















globalThis.__fs = {
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
      seed: match.seed,
      seats: match.seats,
      actions: match.actions.length,
      turn: derived.turn,
      scores: derived.scores,
      bag: derived.bag.length,
      over: derived.over,
    };
  },
  get overlay() { return overlay ? overlay.id : null; },
  rects: () => [
    ...((overlay ?? screen).rects?.() ?? []),
    ...(overlay ? [] : barRects.map((b) => ({ id: `bar:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h }))),
  ],
};









const saved = readJson(SAVE_KEY);
if (saved && Array.isArray(saved.seats) && saved.seats.length && Array.isArray(saved.actions)) {
  match = saved;
  derived = replay(match, isWord);
}

screen = boardScreen.create(app);
keysAre(screen.keys);
screen.reload();
resize();

const linkRoom = joinIdFrom(globalThis.location.href);
if (linkRoom && canPlayTogether()) {
  roomState.active = true;
  startNet().join(linkRoom);
}

trackEvent('game_start', { game: 'farmy-scrabble' });
