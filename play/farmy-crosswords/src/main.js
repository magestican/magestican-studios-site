

















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
import { picker, help, KEY_LINES } from './overlay.js';

initAnalytics({ page: 'farmy-crosswords' });
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

function layoutBar() {
  if (current === HOME) {
    barRects = [{ x: app.width - 62, y: 12, w: 48, h: 48, id: 'help', label: '?' }];
    return;
  }
  barRects = [
    { x: 12, y: 8, w: 52, h: 44, id: 'back', label: '←' },
    { x: app.width - 62, y: 8, w: 48, h: 44, id: 'help', label: '?' },
    { x: app.width - 62 - 130, y: 8, w: 124, h: 44, id: 'picker', label: 'Puzzles' },
  ];
}

function drawBar(now) {
  if (current !== HOME) {
    const mod = MODULES[current];
    const name = GAMES.find((x) => x.id === current).name;
    paint.text(g, name, { x: 76, y: 8, width: app.width - 340, height: 44 },
      { size: SIZES.base, colour: COLORS.ink, align: 'left', fit: true, maxWidth: app.width - 350 });
    paint.text(g, `${indexFor[current] + 1} of ${mod.count()}`,
      { x: 76, y: 8, width: app.width - 340, height: 44 },
      { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'right', fit: true });
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

function remember() {
  writeJson(LAST_KEY, { game: current, index: indexFor });
}

function openGame(id, firstLetter) {
  current = id;
  overlay = null;
  const index = indexFor[id];
  app.save = (state) => writeJson(saveKey(id, index), state);
  app.load = () => readJson(saveKey(id, index));
  app.finished = (won) => trackEvent('puzzle_finished', { game: id, won: won ? 1 : 0 });
  app.message = '';
  screen = MODULES[id].create(app, index);
  keysAre(screen.keys);
  remember();
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

function openHelp() {
  app.message = '';
  const lines = current === HOME
    ? [
      'Four word games, all of them free and none of them timed.',
      'Choose one with the mouse, press 1 to 4, or just start typing.',
      'Every puzzle is unlocked - there is a puzzle of the day, and also all of them.',
      'Nothing is sent anywhere. Your progress is kept in this browser.',
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
    if (id === 'back') goHome();
    else if (id === 'help') openHelp();
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
  if (action.type === 'open') { openGame(action.game, action.value); return; }

  const active = overlay ?? screen;
  active.key(action);
});

reduceMotion?.addEventListener?.('change', (e) => {
  app.motion = !e.matches;
  invalidate();
});

globalThis.addEventListener('resize', resize);
















globalThis.__fc = {
  get screen() { return current; },
  get index() { return indexFor[current] ?? null; },
  get overlay() { return overlay ? 'open' : null; },
  rects: () => [
    ...((overlay ?? screen).rects?.() ?? []),
    ...(overlay ? [] : barRects.map((b) => ({ id: `bar:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h }))),
  ],
};

goHome();
resize();
trackEvent('game_start', { game: 'farmy-crosswords' });
