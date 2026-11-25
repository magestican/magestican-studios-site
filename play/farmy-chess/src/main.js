












































import { localGameName, applyGameName } from '../../../web-engine/i18n/gameNames.js';


const GAME_NAME = localGameName('farmy-chess');
applyGameName('farmy-chess');
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { routeKey } from '../../../web-engine/words/keyRouter.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';








import {
  displayName, shareLinkFor, joinIdFrom, describeSaying, describeRoom,
} from '../../../web-engine/words/coop.js';
import {
  WHITE, BLACK, squareName, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
} from '../../../web-engine/chess/position.js';
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
  prizes as prizesPanel,
} from './panels.js';
import { createNet, canPlayTogether } from './net.js';
import { forgetRoomCode } from './net.js';
import { watchViewport } from '../../shared/ui/viewport.js';
import * as music from '../../shared/audio/lofi.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import * as sfx from './sfx.js';


import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { addUiMuteSource, uiSoundOn } from '../../../web-engine/brand/uiSound.js';
import {
  TITLE_BUTTONS, titleMove, titleKey, padHeld, padPresses, PAD_KEY, boardBack, MENU_CUES, MENU_GAINS, menuCue,
  CUE_GAP_MS, panelLook, pieceBob,
} from './menuNav.js';
import { cueFor } from '../../../web-engine/chess/chessSound.js';
import { easeOut } from '../../../web-engine/words/motion.js';
import { createCelebration } from '../../shared/ui/celebrate.js';
import { roomPresence } from '../../shared/net/roomPresence.js';
import { mountLiveBadge } from '../../shared/ui/liveBadge.js';
import { LIVE_PATH } from '../../../web-engine/net/presence.js';
import { reportMatch } from '../../../web-engine/progress/report.js';
import { CARDS, deviceId } from '../../../web-engine/progress/peerCards.js';
import { twoSeatMatch, createReportGate } from '../../../web-engine/progress/matchArgs.js';
import { mountLevelChip } from '../../../web-engine/progress/levelChip.js';
import {
  cleanRecord, recordAfter, newPrizes, nextGoal, rankFill, prizeCount, prizeLines, helpLines,
  newPrizeLine, GOAL_HEADING, PRIZES_HEADING,
} from './progress.js';








try {
  if (globalThis.self !== globalThis.top) document.documentElement.classList.add('framed');
} catch {
  
  
  
}









const params = new URLSearchParams(globalThis.location.search);
const framed = document.documentElement.classList.contains('framed');
let atTitle = !params.has('go') && !joinIdFrom(globalThis.location.href) && !framed;
if (!atTitle) document.body.classList.remove('at-title');

initAnalytics({ page: 'farmy-chess' });
startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of Rookwise is available.',
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



let record = cleanRecord(readJson(RECORD_KEY));

let lastGame = { prizes: [], vsBot: false };
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





const progressState = { startedAt: Date.now(), adopted: false };
const reportGate = createReportGate();
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
  
  cue: (id) => { const c = menuCue(id); if (c) uiCue(c); },
  
  focusMoved: () => uiCue('focus'),
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
  
  
  
  
  
  
  
  
  const incomingOver = replay(match).over;
  if (!match.moves.length) {
    reportGate.begin(match.seats);
    progressState.startedAt = Date.now();
  } else if (!progressState.adopted) {
    reportGate.begin(null);
    if (incomingOver) reportGate.settle();
  }
  progressState.adopted = true;
  if (!incomingOver) roomState.shownResult = false;
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
  progressState.startedAt = Date.now();
  reportGate.begin(match.seats);
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
  
  
  
  const before = record;
  const vsBot = match.seats.some(isBot);
  record = recordAfter(record, outcome, { vsBot });
  lastGame = { prizes: newPrizes(before, record), vsBot };
  writeJson(RECORD_KEY, record);
  showProgress();
  
  
  bot = botFor(levelFrom(record));
  
  
  
  
  const turn = reportGate.take();
  if (turn) {
    const arg = twoSeatMatch({
      game: 'farmy-chess', seats: match.seats, me: app.me, result: outcome, isBot,
      cardFor: (id) => CARDS.get(id), online: roomState.active,
      startSeats: turn.startSeats, myDev: deviceId(), hosting: !!net?.hosting,
      seconds: (Date.now() - progressState.startedAt) / 1000,
    });
    if (arg) reportMatch(arg);
  }
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
  if (!roomState.active) return 'Multiplayer';
  const n = roomState.peers.length;
  
  
  return n <= 1 ? 'Room open' : `${n} players`;
};

function layoutBar() {
  
  
  
  const right = app.width - 12;
  const y = 6;
  const h = 44;
  if (app.width < BAR_WIDE) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    barRects = [
      ...(roomState.active ? [] : [{
        x: right - 100 - 8 - 56, y, w: 56, h, id: 'together',
        label: '', icon: 'people',
      }]),
      { x: right - 100, y, w: 100, h, id: 'menu', label: roomState.active ? 'Menu •' : 'Menu' },
    ];
    return;
  }
  const helpX = right - 48;
  
  
  const togetherX = helpX - 8 - 176;
  const sidesX = togetherX - 8 - 150;
  const newX = sidesX - 8 - 150;
  
  const prizesX = newX - 8 - 140;
  barRects = [
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: togetherX, y, w: 176, h, id: 'together', label: togetherLabel(), icon: 'people' },
    { x: sidesX, y, w: 150, h, id: 'sides', label: 'Play a bot' },
    { x: newX, y, w: 150, h, id: 'new', label: 'New game' },
    { x: prizesX, y, w: 140, h, id: 'prizes', label: 'See prizes' },
  ];
}

function drawBar(now) {
  
  
  
  
  
  
  
  
  const leftmost = barRects.reduce((m, b) => Math.min(m, b.x), app.width);
  const room = Math.max(120, leftmost - 24);
  paint.text(g, GAME_NAME, { x: 12, y: 6, width: room, height: 44 }, {
    size: SIZES.h2, colour: COLORS.ink, align: 'left', fit: true, maxWidth: room,
  });
  
  
  paint.rule(g, 0, BAR - 4, app.width);
  barRects.forEach((b, i) => {
    paint.button(g, b, {
      label: b.label,
      
      
      icon: b.icon ?? null,
      size: SIZES.min,
      hover: i === barHover ? lift(progress(now, barHoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
  });
}

function frame() {
  const now = performance.now();
  const active = overlay ?? screen;
  
  const opening = !!overlay && !panelLook(now, overlayAt, false, app.motion).done;
  if (leaving && panelLook(now, leaving.at, true, app.motion).done) leaving = null;
  const step = tick({
    dirty,
    moving: !!(active && active.animating(now)) || party.running() || opening || !!leaving,
    wasMoving,
  });
  dirty = false;
  wasMoving = step.wasMoving;
  if (step.draw) {
    paint.clear(g, app.width, app.height);
    if (screen) screen.draw(g, now);
    drawBar(now);
    if (leaving && !overlay) drawPanel(leaving.panel, panelLook(now, leaving.at, true, app.motion), now);
    if (overlay) drawPanel(overlay, panelLook(now, overlayAt, false, app.motion), now);
    
    
    
    party.draw(g, app.width, app.height);
    const d = active.describe();
    
    
    
    mirror({ ...d, status: app.message || d.status, lines: d.lines });
  }
  if (step.again) requestAnimationFrame(frame);
  else looping = false;
}








const ui = createGameSfx(new URL('../assets/ui/', import.meta.url), MENU_CUES, {}, Math.random, MENU_GAINS);
addUiMuteSource(() => sfx.isMuted());
let lastCueAt = -Infinity;

function uiCue(name) {
  const now = performance.now();
  if (now - lastCueAt < CUE_GAP_MS) return;
  lastCueAt = now;
  if (uiSoundOn()) ui.play(name);
}



let overlayAt = -Infinity;
let leaving = null;
function drawPanel(panel, look, now) {
  if (look.alpha <= 0) return;
  g.save();
  g.globalAlpha = look.alpha;
  if (look.scale !== 1) {
    g.translate(app.width / 2, app.height / 2);
    g.scale(look.scale, look.scale);
    g.translate(-app.width / 2, -app.height / 2);
  }
  panel.draw(g, now);
  g.restore();
}

function closeOverlay() {
  if (overlay) { leaving = { panel: overlay, at: performance.now() }; uiCue('back'); }
  overlay = null;
  app.message = '';
  keysAre(screen.keys);
  relayout();
  invalidate();
}






function show(panel, { focus = null } = {}) {
  app.message = '';
  if (!overlay) uiCue('open');
  overlayAt = performance.now();
  leaving = null;
  overlay = panel;
  overlay.layout();
  if (app.keyboardMode) overlay.focusOn?.(focus);
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
      
      
      more: [
        ...lastGame.prizes.map(newPrizeLine),
        ...(lastGame.vsBot ? helpLines(record) : []),
        `${rankFill(record).text}. ${prizeCount(record)}.`,
        `${GOAL_HEADING}. ${nextGoal(record)}`,
      ],
    },
    onAgain: () => { closeOverlay(); restart(); },
    onSwap: () => { closeOverlay(); const s = swapSides(match); match = s; roomState.shownResult = false; reportGate.begin(match.seats); progressState.startedAt = Date.now(); rederive(); net?.publish(); relayout(); invalidate(); },
    onClose: closeOverlay,
  }));
}

function openRoom() {
  startNet();
  show(roomPanel(app, {
    
    
    
    
    state: {
      get active() { return roomState.active; },
      get hosting() { return !!net?.hosting; },
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
    
    
    onNewCode: () => {
      if (!net?.hosting) return;
      presence.withdraw();
      forgetRoomCode();
      net.leave();
      net = null;
      roomState.copied = false;
      startNet().host();
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
      
      
      reportGate.begin(match.seats);
      if (replay(match).over) reportGate.settle();
      progressState.adopted = false;
      rederive();
      closeOverlay();
    },
    onCopy: () => {
      const link = shareLinkFor(globalThis.location.href, net?.id ?? '', {});
      
      
      
      
      shareLink({ link, gameName: GAME_NAME, code: net?.id ? String(net.id).toUpperCase() : null })
        .then((res) => {
          if (res?.via === 'clipboard') {
            roomState.copied = true;
            announce('Link copied. Send it to whoever you want to play with.');
          } else if (res?.via === 'manual') {
            announce(`Copy this: ${res.url}`);
          }
          overlay?.refresh();
          invalidate();
        }, () => announce(`Copy this: ${link}`));
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


function openMenu({ focus = null } = {}) {
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
          
          if (!sfx.isMuted()) uiCue('toggleOff');
          const muted = sfx.setMuted(!sfx.isMuted());
          if (!muted) uiCue('toggleOn');
          announce(muted ? 'Sound off.' : 'Sound on.');
          openMenu({ focus: 'sound' });
        },
      },
      { id: 'prizes', label: 'See prizes', run: openPrizes },
      { id: 'help', label: 'How to play', run: openHelp },
      
      { id: 'title', label: 'Title screen', run: () => { closeOverlay(); showTitle(); } },
      { id: 'close', label: 'Close', run: closeOverlay },
    ],
  }), { focus });
}

function openPrizes() {
  show(prizesPanel(app, {
    state: {
      title: PRIZES_HEADING,
      lines: [
        `${prizeCount(record)}.`, ...prizeLines(record),
        `${rankFill(record).text}.`, `${GOAL_HEADING}. ${nextGoal(record)}`,
      ],
    },
    onClose: closeOverlay,
  }));
}




function showProgress() {
  const fill = rankFill(record);
  const $goal = document.getElementById('goal');
  const $bar = document.getElementById('rank-bar');
  const $rank = document.getElementById('rank-text');
  if ($goal) $goal.textContent = `${GOAL_HEADING}. ${nextGoal(record)}`;
  if ($bar) $bar.style.width = `${Math.round(fill.share * 100)}%`;
  if ($rank) $rank.textContent = `${fill.text}. ${prizeCount(record)}.`;
}
showProgress();



















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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  players: () => new Set([roomState.me, ...roomState.peers].filter(Boolean)).size || 1,
  
  
  ids: () => [roomState.me, ...roomState.peers].filter(Boolean),
  bots: () => (derived.seats ?? []).filter((s) => isBot(s)).length,
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
        
        if (!match.moves.length) reportGate.begin(match.seats);
        rederive();
      }
      relayout();
      invalidate();
    },
    onArrival: (id) => {
      const seats = seatsWith(match.seats, id);
      if (seats === match.seats) return;
      match = { ...match, seats };
      
      
      
      if (!match.moves.length) reportGate.begin(seats);
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
  
  if (e.pointerType === 'touch') app.keyboardMode = false;
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
    else if (id === 'prizes') openPrizes();
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





function pressKey(key, mods = {}) {
  if (atTitle) return titlePress(key);
  const action = routeKey(
    { key, ctrl: !!mods.ctrl, meta: !!mods.meta, alt: !!mods.alt },
    { screen: 'chess', overlay: !!overlay, games: ['chess'] },
  );
  if (!action) return false;
  if (action.type === 'move' && overlay && !app.keyboardMode) {
    
    app.keyboardMode = true;
    overlay.focusOn?.(null);
    uiCue('focus');
    return true;
  }
  if (action.type === 'move' || action.type === 'submit' || action.type === 'back') {
    app.keyboardMode = true;
    invalidate();
  }
  if (action.type === 'back') {
    if (overlay) { closeOverlay(); return true; }
    
    if (boardBack(screen.hasSelection()) === 'drop') { screen.clearSelection(); uiCue('back'); invalidate(); }
    else openMenu({ focus: 'close' });
    return true;
  }
  if (action.type === 'help') { if (overlay) closeOverlay(); else openHelp(); return true; }
  (overlay ?? screen).key(action);
  return true;
}

document.addEventListener('keydown', (e) => {
  if (atTitle) {
    
    if (titleKey(e.key) && titlePress(e.key)) e.preventDefault();
    return;
  }
  if (pressKey(e.key, { ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey })) e.preventDefault();
});


const titleButtons = () => TITLE_BUTTONS.map((id) => document.getElementById(id));
function titlePress(key) {
  const buttons = titleButtons();
  const at = buttons.indexOf(document.activeElement);
  if (key === 'Enter') { (buttons[at] ?? buttons[0]).click(); return true; }
  const dir = titleKey(key);
  if (!dir) return false;
  const next = titleMove(at, dir);
  if (next !== at) { buttons[next].focus(); uiCue('focus'); }
  return true;
}



let padState = null;
let padLoop = false;
function pollPad() {
  const pads = [...(navigator.getGamepads?.() ?? [])].filter(Boolean);
  if (!pads.length) { padLoop = false; padState = null; return; }
  const held = new Set();
  for (const p of pads) for (const w of padHeld(p)) held.add(w);
  const r = padPresses(padState, held, performance.now());
  padState = r.state;
  for (const w of r.presses) {
    const key = PAD_KEY[w];
    if (!key) continue;
    if (atTitle) { if (w !== 'back' && w !== 'start') titlePress(key); }
    else pressKey(key);
  }
  requestAnimationFrame(pollPad);
}
globalThis.addEventListener('gamepadconnected', () => {
  if (padLoop) return;
  padLoop = true;
  requestAnimationFrame(pollPad);
});

reduceMotion?.addEventListener?.('change', (e) => {
  app.motion = !e.matches;
  invalidate();
});











sfx.install();




watchViewport(resize, canvas);




wireMusicButton({ music, announce, });

mountLevelChip(document.querySelector('.studio-bar'), { share: 'Rookwise' });

















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
  
























    





  get myTurn() { try { return !!app.myTurn(); } catch { return false; } },
  get plays() {
    try {
      if (derived.over) return [];
      return (derived.legal ?? []).map((m) => ({
        press: [`sq:${squareName(m.from)}`, `sq:${squareName(m.to)}`],
        promo: m.promo ?? null,
      }));
    } catch { return []; }
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


reportGate.begin(match.seats);
if (derived.over) reportGate.settle();

screen = boardScreen.create(app);
keysAre(screen.keys);
screen.reload();
resize();
maybeThink();







const TITLE_OUT_MS = 220;
const isTouch = () => !!globalThis.matchMedia?.('(pointer: coarse)').matches;
function leaveTitle() {
  if (!atTitle) return;
  atTitle = false;
  const done = () => {
    document.body.classList.remove('at-title', 'title-leaving');
    invalidate();
  };
  if (app.motion) {
    document.body.classList.add('title-leaving');
    setTimeout(done, TITLE_OUT_MS);
  } else done();
  canvas.focus({ preventScroll: true });
  invalidate();
}

function showTitle() {
  if (atTitle) return;
  atTitle = true;
  document.body.classList.remove('title-leaving');
  document.body.classList.add('at-title');
  showProgress();
  startTitleMotion();
  if (!isTouch() || app.keyboardMode) $start.focus({ preventScroll: true });
}
const $start = document.getElementById('start');
const $seeOptions = document.getElementById('see-options');
$start.addEventListener('click', () => { uiCue('tap'); leaveTitle(); });
$seeOptions.addEventListener('click', () => { leaveTitle(); openMenu(); });



const $mark = document.getElementById('title-pieces');
const markG = $mark?.getContext?.('2d') ?? null;
const ROW = [ROOK, KNIGHT, BISHOP, QUEEN, KING, PAWN];
let titleMoving = false;
function drawTitlePieces(now) {
  if (!markG) return;
  const dpr = globalThis.devicePixelRatio || 1;
  const cssW = $mark.clientWidth || 360;
  const cssH = $mark.clientHeight || 64;
  if ($mark.width !== Math.round(cssW * dpr)) { $mark.width = Math.round(cssW * dpr); $mark.height = Math.round(cssH * dpr); }
  markG.setTransform(dpr, 0, 0, dpr, 0, 0);
  markG.clearRect(0, 0, cssW, cssH);
  const s = Math.min(cssH - 10, cssW / ROW.length - 6);
  const gap = (cssW - s * ROW.length) / (ROW.length + 1);
  ROW.forEach((code, i) => {
    const y = cssH - s - 2 + pieceBob(now, i, ROW.length, app.motion);
    paint.chip(markG, { x: gap + i * (s + gap), y, w: s, h: s }, i % 2 ? -code : code);
  });
}
function titleFrame(now) {
  if (!atTitle) { titleMoving = false; return; }
  drawTitlePieces(now);
  if (app.motion) requestAnimationFrame(titleFrame);
  else titleMoving = false;
}
function startTitleMotion() {
  if (titleMoving || !markG) return;
  titleMoving = true;
  requestAnimationFrame(titleFrame);
}
const $name = document.getElementById('title-name');
if ($name) $name.textContent = GAME_NAME;
if (atTitle) {
  startTitleMotion();
  
  if (!isTouch()) $start.focus({ preventScroll: true });
}

const linkRoom = joinIdFrom(globalThis.location.href);
if (linkRoom && canPlayTogether()) {
  roomState.active = true;
  startNet().join(linkRoom);
}

trackEvent('game_start', { game: 'farmy-chess' });
