

















import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { GAMES, saveKey, puzzleForDay, LAST_KEY } from '../../../web-engine/words/puzzlePick.js';
import { routeKey, HOME } from '../../../web-engine/words/keyRouter.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { createCelebration } from '../../shared/ui/celebrate.js';
import { scoreIn, isSolved, levelOf } from '../../../web-engine/words/scoring.js';
import {
  COUNT_MS, countAt, beatShare, counting as isCounting, freshPuzzle, freshScores,
  sessionButton, remainingMs, sessionOver, clockText, clockUrgent, SESSION_MINUTES,
} from '../../../web-engine/words/match.js';
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
import {
  room as roomPanel, more as morePanel, results as resultsPanel, say as sayPanel,
  length as lengthPanel, nameEditor as namePanel,
} from './rooms.js';
import { createNet, canPlayTogether } from './net.js';
import {
  puzzleKey, mergeMoves, movesFromState, stateFromMoves, nextSeq,
  nameFor, colourFor, describeRoom, joinIdFrom, shareLinkFor, puzzleFrom,
  creditFor, creditForGroup, describeFind, describeSaying, sayingText,
  scoreboard, winnerOf, GAME_NAMES, MODES, movesForBoard, displayName, cleanName, chipsFor,
} from '../../../web-engine/words/coop.js';
import * as sfx from './sfx.js';
import * as music from '../../shared/audio/lofi.js';
import { watchViewport } from '../../shared/ui/viewport.js';

initAnalytics({ page: 'farmy-crosswords' });





sfx.install();
startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Farmy Crosswords is available.',
});

const MODULES = { wordle, bee, connections, strands };




const NAME_KEY = 'farmy-crosswords:v2:name';
const BAR = 60;



const INFO = 40;

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
  
  
  
  relayout: () => relayout(),
  announce: (m) => announce(m),
  openGame,
  goHome,
  closeOverlay,
  



















  leaveFor: (url) => openFamily(url),
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






const party = createCelebration({
  now: () => app.now(),
  colours: COLORS,
  motion: () => app.motion,
});








const roomState = {
  active: false,
  me: null,
  peers: [],
  moves: [],
  status: '',
  copied: false,
  key: null,        
  seededKey: null,  
  
  
  where: [],
  said: null,       
  shownResult: null, 
  
  
  
  mode: MODES.TOGETHER,
  
  names: {},
};
let net = null;





let countAtMs = -1;










const match = {
  startedAt: null,   
  minutes: SESSION_MINUTES[0],
  pausedMs: 0,       
  pausedAt: null,    
  scores: {},        
};










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
  
  
  
  
  
  
  
  
  
  const top = current === HOME ? BAR : BAR + INFO;
  return { x: pad, y: top + 8, width: app.width - pad * 2, height: app.height - top - 20 };
}















function infoRow() {
  const pad = app.width < 520 ? 10 : 20;
  const mod = MODULES[current];
  
  
  
  
  
  const narrow = app.width < 520;
  const label = narrow
    ? `${indexFor[current] + 1} of ${mod.count()}`
    : `Puzzle ${indexFor[current] + 1} of ${mod.count()}`;
  
  
  
  
  
  
  g.font = paint.font(SIZES.min, 700);
  const need = Math.ceil(g.measureText(label).width) + 30;
  const w = narrow
    ? Math.min(Math.max(120, need), Math.max(120, app.width * 0.5))
    : Math.min(220, Math.max(150, need, app.width * 0.42));
  return {
    pad,
    y: BAR + 2,
    height: INFO - 6,
    button: { x: pad, y: BAR + 2, w, h: INFO - 6, id: 'index', label },
  };
}

function relayout() {
  if (screen) screen.layout(contentBox());
  if (overlay) overlay.layout();
  layoutBar();
}








const soundLabel = () => (sfx.isMuted() ? 'Sound: off' : 'Sound: on');










function scoreLabel() {
  const level = levelOf(lifetimeScore());
  const here = scoreHere();
  return here > 0 ? `${level.name} ${level.points} (+${here})` : `${level.name} ${level.points}`;
}










function sessionChip() {
  if (!inRoom()) return null;
  if (matchLive()) {
    return { id: 'clock', label: clockText(remainingMs(matchArgs())), enabled: false, clock: true };
  }
  return sessionButton({
    hosting: !!net?.hosting,
    peers: roomState.peers,
    started: match.startedAt !== null && !sessionOver(matchArgs()),
    paused: match.pausedAt !== null,
    counting: countAtMs >= 0 && isCounting(app.now() - countAtMs),
  });
}










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

  
  
  
  
  
  
  
  
  
  const chip = sessionChip();
  const chipRect = (x, w) => (chip && chip.label
    ? [{ x, y, w, h, id: chip.id, label: chip.label, off: !chip.enabled, clock: chip.clock }]
    : []);

  if (app.width < BAR_WIDE) {
    const moreX = right - 96;
    barRects = [
      ...(current === HOME ? [] : [{ x: 12, y, w: 52, h, id: 'back', label: '←' }]),
      ...chipRect(moreX - 8 - 132, 132),
      { x: moreX, y, w: 96, h, id: 'more', label: roomState.active ? 'Menu •' : 'Menu' },
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
      ...chipRect(togetherX - 8 - 150, 150),
    ];
    return;
  }
  
  
  
  
  
  
  
  barRects = [
    { x: 12, y, w: 52, h, id: 'back', label: '←' },
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: soundX, y, w: 140, h, id: 'sound', label: soundLabel() },
    { x: togetherX, y, w: 150, h, id: 'together', label: togetherLabel() },
    ...chipRect(togetherX - 8 - 150, 150),
  ];
}








function drawCount(now) {
  const ms = now - countAtMs;
  const text = countAt(ms);
  if (text === null) return;
  const share = beatShare(ms);
  const go = text === 'GO';

  
  
  
  
  
  
  
  const side = Math.round(Math.min(app.width, app.height, 520) * (go ? 0.46 : 0.38));
  
  
  const grow = app.motion ? 1 + 0.14 * (1 - Math.min(1, share * 3)) : 1;
  const w = Math.round(side * (go ? 1.45 : 1) * grow);
  const h = Math.round(side * grow);
  const card = {
    x: Math.round(app.width / 2 - w / 2),
    y: Math.round(app.height / 2 - h / 2),
    w,
    h,
  };

  
  
  
  paint.scrim(g, app.width, app.height, 0.38);
  paint.surface(g, card, { fill: go ? COLORS.green : COLORS.card, offset: SIZES.shadow + 4 });

  
  
  if (!go) {
    const trackW = Math.round(card.w * 0.62);
    const trackX = Math.round(card.x + (card.w - trackW) / 2);
    const trackY = card.y + card.h - 26;
    g.fillStyle = COLORS.paper;
    paint.roundRect(g, trackX, trackY, trackW, 8, 4);
    g.fill();
    g.fillStyle = COLORS.green;
    paint.roundRect(g, trackX, trackY, Math.max(4, Math.round(trackW * (1 - share))), 8, 4);
    g.fill();
  }

  paint.text(g, text, { x: card.x, y: card.y - (go ? 0 : 10), w: card.w, h: card.h }, {
    size: Math.round(h * (go ? 0.44 : 0.62)),
    colour: go ? COLORS.card : COLORS.ink,
    fit: true,
    maxWidth: card.w - 24,
  });
}

function drawBar(now) {
  if (current !== HOME) {
    const mod = MODULES[current];
    const name = GAMES.find((x) => x.id === current).name;
    const leftmost = barRects.reduce((m, b) => (b.x > 70 && b.x < m ? b.x : m), app.width);
    const room = Math.max(90, leftmost - 90);
    paint.text(g, name, { x: 76, y: 8, width: room, height: 44 },
      { size: SIZES.base, colour: COLORS.ink, align: 'left', fit: true, maxWidth: room });
    
    const row = infoRow();
    paint.button(g, row.button, {
      label: row.button.label,
      size: SIZES.min,
      hover: barHover === -2
        ? lift(progress(now, barHoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
    
    
    
    
    
    
    
    
    
    
    const chips = inRoom() && roomState.peers.length > 1
      ? chipsFor(rankedRoom().map((r) => ({ ...r, name: nameOf(r.by) })))
      : [];
    let right = app.width - row.pad;
    if (chips.length) {
      for (const chip of chips.slice(0, 4)) {
        const text = chip.score ? `${chip.initials} ${chip.score}` : chip.initials;
        g.font = paint.font(SIZES.min, 700);
        const w = Math.ceil(g.measureText(text).width) + 34;
        const r = { x: right - w, y: row.y + 2, w, h: row.height - 4 };
        if (r.x < row.pad + row.button.w + 8) break;
        paint.surface(g, r, { fill: chip.you ? COLORS.card : COLORS.paper, offset: 0 });
        paint.surface(g, { x: r.x + 6, y: r.y + (r.h - 16) / 2, w: 16, h: 16 },
          { fill: COLORS[chip.colour] ?? COLORS.slate, offset: 0 });
        paint.text(g, text, { x: r.x + 26, y: r.y, w: r.w - 32, h: r.h },
          { size: SIZES.min, colour: COLORS.ink, align: 'left', fit: true, maxWidth: r.w - 32 });
        right = r.x - 6;
      }
    }
    const scoreX = row.pad + row.button.w + 12;
    if (right - scoreX > 90) {
      paint.text(g, scoreLabel(),
        { x: scoreX, y: row.y, width: right - scoreX, height: row.height },
        { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'right',
          fit: true, maxWidth: right - scoreX });
    }

    
    
    
    
    paint.rule(g, 0, BAR + INFO - 4, app.width);
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
  
  
  
  
  
  
  const partying = party.running();
  
  
  
  const ticking = (countAtMs >= 0 && isCounting(now - countAtMs)) || matchLive();
  
  
  
  if (match.startedAt !== null && match.pausedAt === null && sessionOver(matchArgs())) endMatch();
  const step = tick({ dirty, moving: !!(active && active.animating(now)) || partying || ticking, wasMoving });
  dirty = false;
  wasMoving = step.wasMoving;
  if (step.draw) {
    paint.clear(g, app.width, app.height);
    if (screen) screen.draw(g, now);
    drawBar(now);
    if (overlay) overlay.draw(g, now);
    
    
    if (countAtMs >= 0) {
      if (isCounting(now - countAtMs)) drawCount(now);
      else countAtMs = -1;
    }
    party.draw(g, app.width, app.height);
    const d = active.describe();
    
    
    
    
    
    
    mirror({ ...d, status: statusText() || d.status, lines: d.lines });
  }
  if (step.again) requestAnimationFrame(frame);
  else looping = false;
}







function applyMoves(moves) {
  const before = new Set(roomState.moves.map((m) => m.id));
  roomState.moves = moves;
  if (!inRoom()) return;
  
  
  
  
  const arrived = moves.filter((m) => !before.has(m.id) && m.by !== roomState.me);
  const news = arrived
    .map((m) => describeFind({ by: m.by, value: Array.isArray(m.value) ? m.value.join(', ') : m.value, me: roomState.me }))
    .filter(Boolean);
  if (news.length) {
    app.message = news[news.length - 1];
    announce(news.join(' '));
  }
  if (current === HOME) return;
  const derived = stateFromMoves(current, movesForBoard(moves, { mode: roomState.mode, me: roomState.me }));
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








const matchArgs = () => ({
  startedAt: match.startedAt,
  minutes: match.minutes,
  now: app.now(),
  pausedMs: match.pausedMs,
  pausedAt: match.pausedAt,
});


const matchLive = () => match.startedAt !== null && match.pausedAt === null
  && !sessionOver(matchArgs());


function puzzleOf(game, index) {
  try { return MODULES[game]?.puzzleAt?.(index) ?? null; } catch { return null; }
}


function scoreHere() {
  if (current === HOME) return 0;
  const saved = readJson(saveKey(current, indexFor[current])) ?? {};
  return scoreIn(current, puzzleOf(current, indexFor[current]), saved);
}










let lifetime = null;
function lifetimeScore() {
  if (lifetime !== null) return lifetime;
  let total = 0;
  for (const game of GAMES) {
    const n = MODULES[game.id].count();
    for (let i = 0; i < n; i += 1) {
      const saved = readJson(saveKey(game.id, i));
      if (saved) total += scoreIn(game.id, puzzleOf(game.id, i), saved);
    }
  }
  lifetime = total;
  return total;
}







function solvedIn(game) {
  const out = [];
  const n = MODULES[game].count();
  for (let i = 0; i < n; i += 1) {
    const saved = readJson(saveKey(game, i));
    if (saved && isSolved(game, puzzleOf(game, i), saved)) out.push(i);
  }
  return out;
}


function myName() {
  try { return cleanName(globalThis.localStorage?.getItem(NAME_KEY)); } catch { return null; }
}


function nameOf(id) {
  return displayName(id, roomState.names);
}

function myProgress() {
  if (current === HOME || !MODULES[current]) return { done: 0, total: 0, label: '' };
  const saved = readJson(saveKey(current, indexFor[current])) ?? {};
  try {
    return MODULES[current].progressIn(indexFor[current], saved);
  } catch {
    return { done: 0, total: 0, label: '' };
  }
}







function creditOf(kind, value) {
  if (!inRoom() || roomState.peers.length < 2) return null;
  const by = Array.isArray(value)
    ? creditForGroup(roomState.moves, value)
    : creditFor(roomState.moves, kind, value);
  if (!by || by === roomState.me) return null;
  return { by, name: nameFor(by), colour: colourFor(by, roomState.peers) };
}


function rankedRoom() {
  return scoreboard(roomState.where, {
    me: roomState.me,
    game: current === HOME ? null : current,
    index: current === HOME ? null : indexFor[current],
  });
}

function roomSummary() {
  return describeRoom({ peers: roomState.peers, me: roomState.me });
}








function roomWho() {
  const ranked = rankedRoom().map((r) => ({ ...r, name: nameOf(r.by) }));
  if (ranked.length) return ranked;
  
  return roomState.peers.map((id) => ({
    by: id,
    name: nameFor(id),
    colour: colourFor(id, roomState.peers),
    you: id === roomState.me,
    where: 'Just arrived',
  }));
}

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: () => ({
      game: current === HOME ? GAMES[0].id : current,
      index: current === HOME ? 0 : indexFor[current],
      moves: roomState.moves,
      mode: roomState.mode,
      
      
      solved: current === HOME ? [] : solvedIn(current),
      name: myName(),
      ...myProgress(),
    }),
    onMoves: applyMoves,
    onPeers: (peers, me) => {
      
      
      
      
      
      
      
      
      if (peers.length < roomState.peers.length && match.startedAt !== null) {
        pauseMatch('Somebody dropped out. The session is paused.');
      }
      roomState.peers = peers;
      if (me) roomState.me = me;
      if (!me && !peers.length) { roomState.me = null; roomState.active = false; }
      else roomState.active = true;
      contributeLocal();
      relayout();
      invalidate();
    },
    onPuzzle: (game, index, mode) => {
      if (mode) roomState.mode = mode;
      
      
      
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
    onPresence: (where) => {
      roomState.where = where;
      for (const w of where) if (w?.by && w.name) roomState.names[w.by] = w.name;
      relayout();
      invalidate();
    },
    onStart: (spec) => { if (spec) applyStart({ ...spec, at: app.now() }); },
    onResume: () => {
      if (match.pausedAt === null) return;
      match.pausedMs += Math.max(0, app.now() - match.pausedAt);
      match.pausedAt = null;
      announce('Back on.');
      layoutBar();
      invalidate();
    },
    onSay: ({ say, by }) => {
      const line = describeSaying({ by, id: say, me: roomState.me });
      if (!line) return;
      roomState.said = { by, id: say };
      app.message = line;
      announce(line);
      app.sound('word');
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
    lifetime = null;   
    if (!inRoom()) return;
    const made = movesFromState(id, before, state, {
      by: roomState.me,
      seq: nextSeq(roomState.moves),
      key: puzzleKey(id, index),
    });
    if (!made.length) return;
    roomState.moves = mergeMoves(roomState.moves, made, puzzleKey(id, index));
    for (const m of made) net?.share(m);
    
    
    
    net?.here();
  };
  app.load = () => (inRoom()
    ? stateFromMoves(id, movesForBoard(roomState.moves, { mode: roomState.mode, me: roomState.me }))
    : readJson(saveKey(id, index)));
  app.finished = (won) => {
    trackEvent('puzzle_finished', { game: id, won: won ? 1 : 0 });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (roomState.shownResult === puzzleKey(id, index)) return;
    roomState.shownResult = puzzleKey(id, index);
    if (inRoom()) net?.here();
    
    
    
    
    
    
    if (won) { party.start(); invalidate(); }
    setTimeout(() => openResults(won), 900);
  };
  
  app.credit = creditOf;
  app.message = '';
  screen = MODULES[id].create(app, index);
  keysAre(screen.keys);
  remember();
  contributeLocal();
  
  if (inRoom()) setTimeout(() => net?.here(), 0);
  relayout();
  invalidate();
  if (firstLetter) screen.key({ type: 'letter', value: firstLetter });
}


































const familyFrame = document.getElementById('family');
const familyBack = document.getElementById('family-back');


let familyUrl = null;









const shellUrl = (() => {
  try { return globalThis.location.pathname + globalThis.location.search; } catch { return '/'; }
})();

function showFamily(url) {
  familyUrl = url;
  if (url) {
    
    
    if (familyFrame.getAttribute('src') !== url) familyFrame.setAttribute('src', url);
    familyFrame.hidden = false;
    canvas.hidden = true;
    familyBack.hidden = false;
    
    try { familyFrame.focus(); } catch {  }
  } else {
    familyFrame.hidden = true;
    canvas.hidden = false;
    familyBack.hidden = true;
    
    
    familyFrame.removeAttribute('src');
    try { canvas.focus(); } catch {  }
    resize();
  }
}


function openFamily(url) {
  if (!familyFrame || !url) {
    try { globalThis.location.assign(url); } catch {  }
    return;
  }
  showFamily(url);
  try { globalThis.history.pushState({ family: url }, '', url); } catch {  }
}














function closeFamily(fromPopstate = false) {
  if (!familyUrl) return;
  showFamily(null);
  if (fromPopstate) return;
  const was = globalThis.location?.pathname;
  try { globalThis.history.back(); } catch {  }
  globalThis.setTimeout(() => {
    try {
      if (globalThis.location.pathname === was) {
        globalThis.history.replaceState({}, '', shellUrl);
      }
    } catch {  }
  }, 120);
}

if (familyBack) familyBack.addEventListener('click', () => closeFamily());




globalThis.addEventListener('popstate', (e) => {
  const want = e.state?.family ?? null;
  if (want === familyUrl) return;
  if (want) showFamily(want);
  else showFamily(null);
});

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
    
    
    
    
    
    
    game: current,
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
      get mode() { return roomState.mode; },
    },
    onHost: () => {
      roomState.copied = false;
      roomState.active = true;
      startNet().host();
      relayout();
      invalidate();
    },
    
    
    
    onMode: (mode) => {
      if (!net?.hosting && roomState.active) return;
      roomState.mode = mode;
      net?.here();
      net?.resync();
      if (screen && current !== HOME) screen.reload?.(app.load() ?? {});
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

function openResults(won = true) {
  app.message = '';
  const here = current;
  const at = indexFor[current];
  overlay = resultsPanel(app, {
    state: {
      won,
      get rows() { return inRoom() && roomState.peers.length > 1 ? rankedRoom() : []; },
      get winner() { return winnerOf(rankedRoom()); },
      get me() { return roomState.me; },
      get score() { return myProgress().label; },
      get game() { return GAME_NAMES[here] ?? 'this puzzle'; },
      get next() { return ((at + 1) % MODULES[here].count()) + 1; },
    },
    
    
    
    onNext: () => {
      indexFor[here] = (at + 1) % MODULES[here].count();
      openGame(here);
    },
    onGames: () => { closeOverlay(); goHome(); },
    onClose: () => closeOverlay(),
  });
  overlay.layout();
  invalidate();
}

function openSay() {
  app.message = '';
  overlay = sayPanel(app, {
    onSay: (id) => {
      net?.say(id);
      const line = describeSaying({ by: roomState.me, id, me: roomState.me });
      if (line) { app.message = line; announce(line); }
      app.sound('press');
      closeOverlay();
    },
  });
  overlay.layout();
  invalidate();
}









function openStart() {
  app.message = '';
  overlay = lengthPanel(app, {
    minutes: SESSION_MINUTES,
    onPick: (mins) => {
      closeOverlay();
      beginMatch(mins);
    },
  });
  overlay.layout();
  invalidate();
}








function beginMatch(minutes) {
  const game = current === HOME ? GAMES[0].id : current;
  const mine = solvedIn(game);
  const theirs = roomState.where.map((w) => w.solved ?? []);
  const index = freshPuzzle(MODULES[game].count(), [mine, ...theirs]);
  const at = app.now();
  applyStart({ game, index: index ?? indexFor[game], minutes, at });
  net?.start({ game, index: index ?? indexFor[game], minutes });
}


function applyStart({ game, index, minutes, at }) {
  match.minutes = minutes;
  match.startedAt = null;
  match.pausedMs = 0;
  match.pausedAt = null;
  match.scores = freshScores(roomState.peers);
  countAtMs = at;
  roomState.shownResult = null;
  if (MODULES[game]) {
    indexFor[game] = index;
    openGame(game);
  }
  announce('Starting together. Three, two, one.');
  
  
  setTimeout(() => {
    match.startedAt = app.now();
    layoutBar();
    invalidate();
  }, COUNT_MS);
  layoutBar();
  invalidate();
}










function pauseMatch(why) {
  if (match.startedAt === null || match.pausedAt !== null) return;
  match.pausedAt = app.now();
  announce(why ?? 'The session is paused.');
  layoutBar();
  invalidate();
}

function resumeMatch() {
  if (match.pausedAt === null) return;
  match.pausedMs += Math.max(0, app.now() - match.pausedAt);
  match.pausedAt = null;
  net?.resume();
  announce('Back on.');
  layoutBar();
  invalidate();
}








function endMatch() {
  if (match.startedAt === null) return;
  match.startedAt = null;
  match.pausedAt = null;
  party.start();
  app.sound('win');
  announce('Time. Here is how everybody did.');
  openResults(true);
  layoutBar();
  invalidate();
}

function openName() {
  app.message = '';
  overlay = namePanel(app, {
    current: nameOf(roomState.me ?? 'me'),
    onSave: (name) => {
      try {
        if (name) globalThis.localStorage?.setItem(NAME_KEY, name);
        else globalThis.localStorage?.removeItem(NAME_KEY);
      } catch {  }
      if (roomState.me) roomState.names[roomState.me] = name ?? null;
      net?.here();
      announce(`You are ${nameOf(roomState.me ?? 'me')}.`);
      closeOverlay();
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
    ...(inRoom() && roomState.peers.length > 1
      ? [{ id: 'say', label: 'Say something', run: openSay }]
      : []),
    {
      id: 'sound',
      label: soundLabel(),
      run: () => { toggleSound(); openMore(); },
    },
    { id: 'name', label: `Your name: ${nameOf(roomState.me ?? 'me')}`, run: openName },
    { id: 'help', label: 'How to play', run: openHelp },
    
    
    
    
    
    ...(current === HOME ? [] : [{ id: 'games', label: 'Choose another game', run: () => { closeOverlay(); goHome(); } }]),
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
  
  
  
  const over = current !== HOME && rectAt([infoRow().button], pt.x, pt.y) === 0;
  const bar = over ? -2 : rectAt(barRects, pt.x, pt.y);
  if (bar !== barHover) { barHover = bar; barHoverAt = performance.now(); invalidate(); }
  
  
  
  canvas.style.cursor = bar >= 0 || bar === -2 ? 'pointer' : (screen.cursorRect || screen.id !== 'home' ? 'pointer' : 'default');
  screen.pointerMove(pt);
});

canvas.addEventListener('pointerup', (e) => {
  const pt = pointAt(e);
  canvas.releasePointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerUp(pt); return; }
  
  
  
  if (current !== HOME && rectAt([infoRow().button], pt.x, pt.y) === 0) {
    app.sound('press');
    openPicker();
    return;
  }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar >= 0) {
    const b = barRects[bar];
    if (b.off) return;                       
    app.sound('press');
    if (b.id === 'back') goHome();
    else if (b.id === 'help') openHelp();
    else if (b.id === 'more') openMore();
    else if (b.id === 'together') openRoom();
    else if (b.id === 'sound') toggleSound();
    else if (b.id === 'start') openStart();
    else if (b.id === 'resume') resumeMatch();
    else if (b.id === 'clock') openRoom();
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






canvas.addEventListener('wheel', (e) => {
  
  
  
  const target = overlay ?? screen;
  if (!target?.wheel) return;
  if (target.wheel(e.deltaY)) e.preventDefault();
}, { passive: false });

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








watchViewport(resize, canvas);































function wireMusic() {
  const btn = document.getElementById('music-btn');
  if (!btn) return;
  const paint_ = () => {
    const on = music.isOn();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Stop the music' : 'Play music');
    btn.setAttribute('title', on ? 'Stop the music' : 'Play music');
  };
  btn.addEventListener('click', () => {
    const on = music.toggle();
    paint_();
    announce(on ? 'Music on.' : 'Music off.');
    app.sound('press');
  });
  paint_();
}
wireMusic();

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
  get music() { return music.state(); },
  get screen() { return current; },
  get index() { return indexFor[current] ?? null; },
  get overlay() { return overlay ? 'open' : null; },
  
  
  
  
  
  
  
  
  
  
  
  
  rects: () => {
    const box = canvas.getBoundingClientRect();
    const shift = (r) => ({ ...r, x: r.x + box.left, y: r.y + box.top });
    return [
      ...((overlay ?? screen).rects?.() ?? []),
      ...(overlay ? [] : barRects.map((b) => ({ id: `bar:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h }))),
      
      
      
      ...(overlay || current === HOME ? [] : [(() => {
        const b = infoRow().button;
        return { id: 'bar:index', x: b.x, y: b.y, w: b.w, h: b.h };
      })()]),
    ].map(shift);
  },
};



const linkPuzzle = puzzleFrom(globalThis.location.href);
const linkRoom = joinIdFrom(globalThis.location.href);
if (linkPuzzle.game && MODULES[linkPuzzle.game]) {
  if (Number.isInteger(linkPuzzle.index) && linkPuzzle.index < MODULES[linkPuzzle.game].count()) {
    indexFor[linkPuzzle.game] = linkPuzzle.index;
  }
  openGame(linkPuzzle.game);
} else if (last.game && MODULES[last.game]) {
  
  
  
  
  
  
  
  
  
  openGame(last.game);
} else {
  goHome();
}
if (linkRoom && canPlayTogether()) {
  roomState.active = true;
  startNet().join(linkRoom);
}
resize();
trackEvent('game_start', { game: 'farmy-crosswords' });
