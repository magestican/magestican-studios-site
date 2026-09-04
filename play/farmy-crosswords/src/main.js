

















import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { GAMES, saveKey, puzzleForDay, LAST_KEY } from '../../../web-engine/words/puzzlePick.js';
import { routeKey, HOME } from '../../../web-engine/words/keyRouter.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';
import { mirror, announce, keysAre } from './a11y.js';
import * as home from './home.js';
import * as wordle from './wordle.js';
import * as bee from './bee.js';
import * as connections from './connections.js';
import * as strands from './strands.js';
import { picker, help, hints, KEY_LINES } from './overlay.js';
import { room as roomPanel, more as morePanel } from './rooms.js';
import { createNet, canPlayTogether } from './net.js';
import {
  puzzleKey, mergeMoves, movesFromState, stateFromMoves, nextSeq,
  nameFor, colourFor, describeRoom, joinIdFrom, shareLinkFor, puzzleFrom,
} from '../../../web-engine/words/coop.js';
import * as sfx from './sfx.js';

initAnalytics({ page: 'farmy-crosswords' });





sfx.install();
startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Farmy Crosswords is available.',
});

const MODULES = { wordle, bee, connections, strands };
const BAR = 60;

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

const app = {
  width: 0,
  height: 0,
  motion: !(reduceMotion?.matches),
  message: '',
  
  
  
  
  keyboardMode: false,
  now: () => performance.now(),
  invalidate,
  announce: (m) => announce(m),
  openGame,
  goHome,
  closeOverlay,
  finished: () => {},
  save: () => {},
  load: () => null,
  
  
  
  
  sound: (event, opts) => sfx.play(event, opts),
  
  
  openHints: (spec) => {
    app.message = '';
    overlay = hints(app, spec);
    overlay.layout();
    invalidate();
  },
};

let screen = null;
let overlay = null;
let current = HOME;
let dirty = true;
let looping = false;
let wasMoving = false;
let barRects = [];
let barHover = -1;
let barHoverAt = 0;








const roomState = {
  active: false,
  me: null,
  peers: [],
  moves: [],
  status: '',
  copied: false,
  key: null,        
  seededKey: null,  
};
let net = null;










const inRoom = () => roomState.active && !!roomState.me;


const last = readJson(LAST_KEY) ?? {};
const indexFor = {};
for (const game of GAMES) {
  const n = MODULES[game.id].count();
  const saved = last.index?.[game.id];
  indexFor[game.id] = Number.isInteger(saved) && saved >= 0 && saved < n ? saved : puzzleForDay(n);
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
  const pad = app.width < 520 ? 10 : 20;
  const top = current === HOME ? 12 : BAR;
  return { x: pad, y: top + 8, width: app.width - pad * 2, height: app.height - top - 20 };
}

function relayout() {
  if (screen) screen.layout(contentBox());
  if (overlay) overlay.layout();
  layoutBar();
}








const soundLabel = () => (sfx.isMuted() ? 'Sound: off' : 'Sound: on');










const togetherLabel = () => {
  if (!roomState.active) return 'Together';
  const n = roomState.peers.length;
  
  
  return n <= 1 ? 'Room open' : `Together: ${n}`;
};


const BAR_WIDE = 820;

function layoutBar() {
  
  
  
  const right = app.width - 14;
  const y = current === HOME ? 12 : 8;
  const h = current === HOME ? 48 : 44;

  
  
  
  
  
  
  if (app.width < BAR_WIDE) {
    barRects = [
      ...(current === HOME ? [] : [{ x: 12, y, w: 52, h, id: 'back', label: '←' }]),
      { x: right - 96, y, w: 96, h, id: 'more', label: roomState.active ? 'Menu •' : 'Menu' },
    ];
    return;
  }

  const helpX = right - 48;
  
  
  
  const soundX = helpX - 8 - 140;
  const togetherX = soundX - 8 - 150;
  if (current === HOME) {
    barRects = [
      { x: helpX, y, w: 48, h, id: 'help', label: '?' },
      { x: soundX, y, w: 140, h, id: 'sound', label: soundLabel() },
      { x: togetherX, y, w: 150, h, id: 'together', label: togetherLabel() },
    ];
    return;
  }
  const pickerX = togetherX - 8 - 118;
  barRects = [
    { x: 12, y, w: 52, h, id: 'back', label: '←' },
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: soundX, y, w: 140, h, id: 'sound', label: soundLabel() },
    { x: togetherX, y, w: 150, h, id: 'together', label: togetherLabel() },
    { x: pickerX, y, w: 118, h, id: 'picker', label: 'Puzzles' },
  ];
}

function drawBar(now) {
  if (current !== HOME) {
    const mod = MODULES[current];
    const name = GAMES.find((x) => x.id === current).name;
    const room = Math.max(120, barRects[barRects.length - 1].x - 90);
    paint.text(g, name, { x: 76, y: 8, width: room, height: 44 },
      { size: SIZES.base, colour: COLORS.ink, align: 'left', fit: true, maxWidth: room });
    paint.text(g, `${indexFor[current] + 1} of ${mod.count()}`,
      { x: 76, y: 8, width: room, height: 44 },
      { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'right', fit: true });
    
    
    
    
    paint.rule(g, 0, BAR - 4, app.width);
  }
  barRects.forEach((b, i) => {
    paint.button(g, b, {
      label: b.label,
      size: b.id === 'picker' ? SIZES.min : SIZES.base,
      hover: i === barHover ? lift(progress(now, barHoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
  });
}

function statusText() {
  return app.message || '';
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
    
    
    
    
    
    
    mirror({ ...d, status: statusText() || d.status, lines: d.lines });
  }
  if (step.again) requestAnimationFrame(frame);
  else looping = false;
}







function applyMoves(moves) {
  roomState.moves = moves;
  if (!inRoom()) return;
  if (current === HOME) return;
  const derived = stateFromMoves(current, moves);
  writeJson(saveKey(current, indexFor[current]), derived);
  screen?.reload?.(derived);
  relayout();
  invalidate();
}
















function contributeLocal() {
  if (!inRoom() || current === HOME) return;
  const key = puzzleKey(current, indexFor[current]);
  if (roomState.seededKey === key) return;
  roomState.seededKey = key;
  const saved = readJson(saveKey(current, indexFor[current]));
  if (!saved) return;
  const made = movesFromState(current, {}, saved, {
    by: roomState.me,
    seq: nextSeq(roomState.moves),
    key,
  });
  if (!made.length) return;
  roomState.moves = mergeMoves(roomState.moves, made, key);
  for (const m of made) net?.share(m);
}

function roomSummary() {
  return describeRoom({ peers: roomState.peers, me: roomState.me });
}


function roomWho() {
  return roomState.peers.map((id) => ({
    name: nameFor(id),
    colour: colourFor(id, roomState.peers),
    you: id === roomState.me,
  }));
}

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => ({
      game: current === HOME ? GAMES[0].id : current,
      index: current === HOME ? 0 : indexFor[current],
      moves: roomState.moves,
    }),
    onMoves: applyMoves,
    onPeers: (peers, me) => {
      
      
      
      
      roomState.peers = peers;
      if (me) roomState.me = me;
      if (!me && !peers.length) { roomState.me = null; roomState.active = false; }
      else roomState.active = true;
      contributeLocal();
      relayout();
      invalidate();
    },
    onPuzzle: (game, index) => {
      
      
      
      if (!MODULES[game]) return;
      if (current === game && indexFor[game] === index) return;
      indexFor[game] = index;
      openGame(game);
    },
    onStatus: (status) => {
      roomState.status = status;
      announce(status);
      relayout();
      invalidate();
    },
  });
  return net;
}

function remember() {
  writeJson(LAST_KEY, { game: current, index: indexFor });
}

function openGame(id, firstLetter) {
  const changed = current !== id || (screen && screen.id !== id);
  current = id;
  overlay = null;
  const index = indexFor[id];
  
  
  
  if (roomState.active && (changed || puzzleKey(id, index) !== roomState.key)) {
    roomState.moves = [];
    roomState.key = puzzleKey(id, index);
    roomState.seededKey = null;
    setTimeout(() => net?.resync(), 0);
  }
  
  
  
  
  
  app.save = (state) => {
    const key = saveKey(id, index);
    const before = readJson(key) ?? {};
    writeJson(key, state);
    if (!inRoom()) return;
    const made = movesFromState(id, before, state, {
      by: roomState.me,
      seq: nextSeq(roomState.moves),
      key: puzzleKey(id, index),
    });
    if (!made.length) return;
    roomState.moves = mergeMoves(roomState.moves, made, puzzleKey(id, index));
    for (const m of made) net?.share(m);
  };
  app.load = () => (inRoom()
    ? stateFromMoves(id, roomState.moves)
    : readJson(saveKey(id, index)));
  app.finished = (won) => trackEvent('puzzle_finished', { game: id, won: won ? 1 : 0 });
  app.message = '';
  screen = MODULES[id].create(app, index);
  keysAre(screen.keys);
  remember();
  contributeLocal();
  relayout();
  invalidate();
  if (firstLetter) screen.key({ type: 'letter', value: firstLetter });
}

function goHome() {
  current = HOME;
  overlay = null;
  app.message = '';
  screen = home.create(app);
  keysAre(screen.keys);
  remember();
  relayout();
  invalidate();
}

function closeOverlay() {
  overlay = null;
  app.message = '';
  keysAre(screen.keys);
  relayout();
  invalidate();
}

function openPicker() {
  
  
  
  app.message = '';
  const mod = MODULES[current];
  overlay = picker(app, {
    count: mod.count(),
    label: mod.label,
    current: indexFor[current],
    today: puzzleForDay(mod.count()),
    onPick: (i) => {
      indexFor[current] = i;
      const id = current;
      overlay = null;
      openGame(id);
    },
  });
  overlay.layout();
  invalidate();
}

function openRoom() {
  app.message = '';
  startNet();
  overlay = roomPanel(app, {
    
    
    
    
    state: {
      get active() { return roomState.active; },
      get code() { return net?.id ?? ''; },
      get summary() { return roomSummary(); },
      get status() { return roomState.status; },
      get who() { return roomWho(); },
      get copied() { return roomState.copied; },
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
      net?.leave();
      net = null;
      roomState.active = false;
      roomState.me = null;
      roomState.peers = [];
      roomState.moves = [];
      roomState.seededKey = null;
      closeOverlay();
    },
    onCopy: () => {
      const link = shareLinkFor(globalThis.location.href, net?.id ?? '', {
        game: current === HOME ? null : current,
        index: current === HOME ? null : indexFor[current],
      });
      try {
        globalThis.navigator?.clipboard?.writeText(link);
        roomState.copied = true;
        announce('Link copied. Send it to whoever you want to play with.');
      } catch {
        announce(`Copy this: ${link}`);
      }
      relayout();
      invalidate();
    },
  });
  overlay.layout();
  invalidate();
}

function openMore() {
  app.message = '';
  const items = [
    ...(current === HOME ? [] : [{ id: 'picker', label: 'Puzzles', run: openPicker }]),
    { id: 'together', label: togetherLabel(), run: openRoom },
    {
      id: 'sound',
      label: soundLabel(),
      run: () => { toggleSound(); openMore(); },
    },
    { id: 'help', label: 'How to play', run: openHelp },
    { id: 'close', label: 'Close', run: () => closeOverlay() },
  ];
  overlay = morePanel(app, { items });
  overlay.layout();
  invalidate();
}

function toggleSound() {
  sfx.setMuted(!sfx.isMuted());
  app.sound('press');
  layoutBar();
  announce(sfx.isMuted() ? 'Sound off.' : 'Sound on.');
  invalidate();
}

function openHelp() {
  app.message = '';
  const lines = current === HOME
    ? [
      'Four word games, all of them free and none of them timed.',
      'Choose one with the mouse, press 1 to 4, or just start typing.',
      'Every puzzle is unlocked - there is a puzzle of the day, and also all of them.',
      'Nothing is sent anywhere. Your progress is kept in this browser.',
      'Play together opens a room: send the link, or read the code out.',
      'You then work the same puzzle between you. Still nothing is timed.',
    ]
    : [...screen.help, ...(current === 'wordle' ? KEY_LINES : [])];
  overlay = help(app, {
    title: current === HOME ? 'Farmy Crosswords' : GAMES.find((x) => x.id === current).name,
    lines,
    keys: screen.keys,
  });
  overlay.layout();
  invalidate();
}





const pointAt = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

canvas.addEventListener('pointerdown', (e) => {
  const pt = pointAt(e);
  
  
  
  
  sfx.wake();
  canvas.setPointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerDown(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar >= 0) return;                       
  screen.pointerDown(pt);
});

canvas.addEventListener('pointermove', (e) => {
  const pt = pointAt(e);
  if (overlay) { overlay.pointerMove(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar !== barHover) { barHover = bar; barHoverAt = performance.now(); invalidate(); }
  
  
  
  canvas.style.cursor = bar >= 0 ? 'pointer' : (screen.cursorRect || screen.id !== 'home' ? 'pointer' : 'default');
  screen.pointerMove(pt);
});

canvas.addEventListener('pointerup', (e) => {
  const pt = pointAt(e);
  canvas.releasePointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerUp(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar >= 0) {
    const id = barRects[bar].id;
    app.sound('press');
    if (id === 'back') goHome();
    else if (id === 'help') openHelp();
    else if (id === 'more') openMore();
    else if (id === 'together') openRoom();
    else if (id === 'sound') toggleSound();
    else openPicker();
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
  sfx.wake();
  const action = routeKey(
    { key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
    { screen: current, overlay: !!overlay, games: GAMES.map((x) => x.id) },
  );
  if (!action) return;
  e.preventDefault();
  if (action.type === 'move') { app.keyboardMode = true; invalidate(); }

  if (action.type === 'back') {
    if (overlay) closeOverlay();
    else if (current !== HOME) goHome();
    return;
  }
  if (action.type === 'help') { if (overlay) closeOverlay(); else openHelp(); return; }
  if (action.type === 'open') { app.sound('press'); openGame(action.game, action.value); return; }

  const active = overlay ?? screen;
  active.key(action);
});

reduceMotion?.addEventListener?.('change', (e) => {
  app.motion = !e.matches;
  invalidate();
});

globalThis.addEventListener('resize', resize);
















globalThis.__fc = {
  get room() {
    return {
      active: roomState.active,
      me: roomState.me,
      peers: roomState.peers,
      moves: roomState.moves.length,
      code: net?.id ?? null,
      hosting: !!net?.hosting,
      status: roomState.status,
    };
  },
  
  
  
  get audio() { return sfx.state(); },
  get screen() { return current; },
  get index() { return indexFor[current] ?? null; },
  get overlay() { return overlay ? 'open' : null; },
  rects: () => [
    ...((overlay ?? screen).rects?.() ?? []),
    ...(overlay ? [] : barRects.map((b) => ({ id: `bar:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h }))),
  ],
};



const linkPuzzle = puzzleFrom(globalThis.location.href);
const linkRoom = joinIdFrom(globalThis.location.href);
if (linkPuzzle.game && MODULES[linkPuzzle.game]) {
  if (Number.isInteger(linkPuzzle.index) && linkPuzzle.index < MODULES[linkPuzzle.game].count()) {
    indexFor[linkPuzzle.game] = linkPuzzle.index;
  }
  openGame(linkPuzzle.game);
} else {
  goHome();
}
if (linkRoom && canPlayTogether()) {
  roomState.active = true;
  startNet().join(linkRoom);
}
resize();
trackEvent('game_start', { game: 'farmy-crosswords' });
