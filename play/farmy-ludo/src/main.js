








































import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import * as sfx from './sfx.js';
import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { tick } from '../../../web-engine/words/frameLoop.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { DURATION, easeOut, lift, progress } from '../../../web-engine/words/motion.js';
import {
  colourFor, joinIdFrom, nameFor, shareLinkFor, spokenCode,
} from '../../../web-engine/words/coop.js';
import {
  HOME, TEAM_COUNT, boardLayout, cellRect, cellFor, pickToken, tokenSpots,
} from '../../../web-engine/board/ludoBoard.js';
import { TEAMS, teamAt, teamLabel } from '../../../web-engine/board/ludoTeams.js';
import {
  advance, progressOf, standings, start, stepOnce,
} from '../../../web-engine/board/ludoRules.js';
import { choose } from '../../../web-engine/board/ludoBots.js';
import { describe, describeEvent, statusOf } from '../../../web-engine/board/ludoDescribe.js';
import {
  buildChain, linkFor, mixSeed, randomSecret,
} from '../../../web-engine/board/ludoDie.js';
import {
  acceptMove, acceptRoll, sayingText, seatOf, seatsFor, withEntry,
} from '../../../web-engine/board/ludoRoom.js';
import { KEY_HELP, routeKey } from '../../../web-engine/board/ludoKeys.js';
import * as paint from './paint.js';
import * as overlays from './overlay.js';
import { announce, keysAre, mirror } from './a11y.js';
import { canPlayTogether, createNet } from './net.js';

initAnalytics({ page: 'farmy-ludo' });






sfx.install();


























































const PACE = {
  roll: 950, move: 700, capture: 1150, afterPass: 620,
  
  
  
  retry: 380,
};

const MOVE_MS = 460;
const DIE_MS = 560;


const SOLO = 'you';

const BAR = 60;
const BAR_WIDE = 900;

const canvas = document.getElementById('board');
const g = canvas.getContext('2d');

const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');

const app = {
  g,
  width: 0,
  height: 0,
  motion: !(reduceMotion?.matches),
  keys: KEY_HELP,
  now: () => performance.now(),
  invalidate,
};





let seats = seatsFor({ peers: [SOLO], host: SOLO });
let entries = [];
let match = start(seats);
let message = '';
let cursor = 0;          


let chain = buildChain(randomSecret());
let head = chain[0];
let headAt = 0;

const room = {
  active: false,
  me: SOLO,
  peers: [],
  status: '',
  copied: false,
  said: null,
};
let net = null;














const whoIs = (seat) => (seat.kind === 'bot'
  ? 'Computer'
  : (seat.by === room.me ? 'You' : nameFor(seat.by)));


const iAmHost = () => !room.active || !!net?.hosting;
const mySeat = () => seatOf(match.seats, room.me);
const myTurn = () => match.awaiting === 'move' && mySeat() === match.turn;
const myRoll = () => match.awaiting === 'roll' && mySeat() === match.turn;





let screenBox = { x: 0, y: 0, width: 0, height: 0 };
let boardBox = { x: 0, y: 0, width: 0, height: 0 };
let panelBox = { x: 0, y: 0, width: 0, height: 0 };
let barRects = [];
let seatRects = [];
let dieRect = { x: 0, y: 0, w: 0, h: 0 };
let statusBox = { x: 0, y: 0, w: 0, h: 0 };
let spots = [];
let barHover = -1;
let barHoverAt = 0;
let tokenHover = -1;
let tokenHoverAt = 0;
let overlay = null;
let dirty = true;
let looping = false;
let wasMoving = false;

let anim = null;
let dieAt = -1e9;
let pumpTimer = 0;

function invalidate() {
  dirty = true;
  if (!looping) {
    looping = true;
    requestAnimationFrame(frame);
  }
}

function say(text) {
  message = text;
  announce(text);
  invalidate();
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

function relayout() {
  const pad = app.width < 520 ? 10 : 20;
  screenBox = {
    x: pad, y: BAR + 6, width: app.width - pad * 2, height: app.height - BAR - 16,
  };

  
  
  
  if (app.width >= BAR_WIDE) {
    const col = 320;
    boardBox = {
      x: screenBox.x, y: screenBox.y, width: screenBox.width - col - 18, height: screenBox.height,
    };
    panelBox = {
      x: screenBox.x + screenBox.width - col, y: screenBox.y, width: col, height: screenBox.height,
    };
  } else {
    const strip = 236;
    boardBox = {
      x: screenBox.x, y: screenBox.y, width: screenBox.width, height: screenBox.height - strip - 10,
    };
    panelBox = {
      x: screenBox.x, y: screenBox.y + screenBox.height - strip, width: screenBox.width, height: strip,
    };
  }
  layoutPanel();
  layoutBar();
  spots = tokenSpots(match.tokens, boardBox);
  if (overlay) overlay.layout();
}

function layoutPanel() {
  const wide = app.width >= BAR_WIDE;
  if (wide) {
    const size = Math.min(132, panelBox.width - 40);
    dieRect = {
      x: Math.round(panelBox.x + (panelBox.width - size) / 2), y: panelBox.y, w: size, h: size,
    };
    statusBox = {
      x: panelBox.x, y: dieRect.y + size + 12, w: panelBox.width, h: 84,
    };
    const top = statusBox.y + statusBox.h + 8;
    const rowH = Math.max(56, Math.min(72, (panelBox.height - (top - panelBox.y) - 8) / TEAM_COUNT - 8));
    seatRects = TEAMS.map((unused, t) => ({
      id: `seat:${t}`, team: t, x: panelBox.x, y: top + t * (rowH + 8), w: panelBox.width, h: rowH,
    }));
    return;
  }
  
  const size = 96;
  dieRect = { x: panelBox.x, y: panelBox.y, w: size, h: size };
  statusBox = {
    x: panelBox.x + size + 12, y: panelBox.y, w: panelBox.width - size - 12, h: size,
  };
  const top = panelBox.y + size + 10;
  const colW = Math.floor((panelBox.width - 8) / 2);
  const rowH = Math.max(56, Math.floor((panelBox.height - (top - panelBox.y)) / 2) - 6);
  seatRects = TEAMS.map((unused, t) => ({
    id: `seat:${t}`,
    team: t,
    x: panelBox.x + (t % 2) * (colW + 8),
    y: top + Math.floor(t / 2) * (rowH + 8),
    w: colW,
    h: rowH,
  }));
}

const togetherLabel = () => {
  if (!room.active) return 'Together';
  const n = room.peers.length;
  return n <= 1 ? 'Room open' : `Together: ${n}`;
};

function layoutBar() {
  const y = 8;
  const h = 44;
  const right = app.width - 14;
  if (app.width < BAR_WIDE) {
    
    
    
    
    
    barRects = [{ x: right - 104, y, w: 104, h, id: 'more', label: room.active ? 'Menu •' : 'Menu' }];
    return;
  }
  const helpX = right - 48;
  const newX = helpX - 8 - 132;
  const togetherX = newX - 8 - 158;
  barRects = [
    { x: helpX, y, w: 48, h, id: 'help', label: '?' },
    { x: newX, y, w: 132, h, id: 'again', label: 'New game' },
    { x: togetherX, y, w: 158, h, id: 'together', label: togetherLabel() },
  ];
}





function schedulePump(ms) {
  clearTimeout(pumpTimer);
  pumpTimer = setTimeout(pump, ms);
}









function pump() {
  clearTimeout(pumpTimer);
  const r = stepOnce(match, entries);

  if (r.did === 'over') return;

  if (r.did === 'wait-roll') {
    if (iAmHost()) revealNext();
    else schedulePump(400);          
    return;
  }

  if (r.did === 'wait-move') {
    const seat = match.seats[match.turn];
    if (mySeat() === match.turn) {
      cursor = 0;
      
      
      sfx.play('yours');
      invalidate();
      return;
    }
    
    
    
    if (iAmHost() && seat.by && !room.peers.includes(seat.by)) {
      seats = match.seats.map((s, i) => (i === match.turn
        ? { ...s, kind: 'bot', by: null, name: null } : s));
      rebuild();
      net?.setup();
      say(`${teamAt(match.turn).name} left. The computer plays their pieces now.`);
      schedulePump(PACE.move);
      return;
    }
    
    
    
    schedulePump(600);
    return;
  }

  if (r.did === 'stuck') {
    say('This game cannot go on: a move arrived that does not fit the rules. '
      + 'Somebody may be running a different version.');
    return;
  }

  applyStep(r);
}


function paceFor(did, event) {
  if (did === 'roll') {
    if (event?.kind === 'retry') return PACE.retry;
    return (event?.kind === 'pass' || event?.kind === 'forfeit') ? PACE.afterPass : PACE.roll;
  }
  return event?.captures?.length ? PACE.capture : PACE.move;
}

function applyStep(r) {
  const before = match.tokens;
  match = r.state;
  const now = performance.now();
  if (r.did === 'move') anim = { at: now, before, after: match.tokens };
  else { dieAt = now; sfx.play('roll'); setTimeout(() => sfx.play('settle'), 420); }
  
  
  
  if (r.did === 'move') sfx.playEvent(match.event);
  spots = tokenSpots(match.tokens, boardBox);
  if (match.event) say(describeEvent(match.event, match));
  cursor = 0;
  invalidate();

  if (match.awaiting === 'over') {
    sfx.play('win');
    trackEvent('ludo_finished', { winner: match.winner });
    setTimeout(showResults, 1100);
    return;
  }
  schedulePump(paceFor(r.did, match.event));
}


function revealNext() {
  const n = match.n;
  if (entries[n]?.link) { pump(); return; }
  let link = linkFor(chain, n);
  if (!link) {
    
    
    newChain(n);
    link = linkFor(chain, 0);
  }
  if (!recordRoll(n, link)) return;
  net?.roll(n, link);
  pump();
}

function newChain(at) {
  chain = buildChain(mixSeed([...room.peers, room.me], randomSecret()));
  head = chain[0];
  headAt = at;
}


function recordRoll(n, link) {
  
  
  const r = acceptRoll(entries, head, n, link, headAt);
  if (!r.ok) {
    if (r.duplicate || r.early) return false;
    say(`A die was refused: ${r.why}.`);
    return false;
  }
  entries = withEntry(entries, n, { link, die: r.die });
  return true;
}


function rebuild() {
  match = advance(start(seats), entries).state;
  spots = tokenSpots(match.tokens, boardBox);
  anim = null;
  relayout();
  invalidate();
}


function newMatch() {
  seats = room.active
    ? seatsFor({ peers: room.peers, host: net?.hosting ? room.me : null })
    : seatsFor({ peers: [SOLO], host: SOLO });
  entries = [];
  newChain(0);
  match = start(seats);
  anim = null;
  overlay = null;
  cursor = 0;
  message = '';
  spots = tokenSpots(match.tokens, boardBox);
  net?.setup();
  relayout();
  invalidate();
  trackEvent('ludo_start', { people: seats.filter((s) => s.kind === 'person').length });
  schedulePump(PACE.roll);
}


function playToken(token) {
  if (!myTurn()) return;
  const n = match.n - 1;
  const check = acceptMove(match, match.seats, { n, token, by: room.me });
  if (!check.ok) { say('That piece cannot make this move.'); return; }
  entries = withEntry(entries, n, { token, by: room.me });
  net?.move(n, token);
  pump();
}






const myMoves = () => (myTurn() ? match.moves : []);

function animating(now) {
  if (overlay?.animating(now)) return true;
  if (anim && now - anim.at < MOVE_MS) return true;
  if (now - dieAt < DIE_MS) return true;
  if (barHover >= 0 && now - barHoverAt < DURATION.hover) return true;
  if (tokenHover >= 0 && now - tokenHoverAt < DURATION.hover) return true;
  return false;
}

function drawBoard(now) {
  paint.board(g, boardBox, { tokens: match.tokens });
  const L = boardLayout(boardBox);

  
  
  for (const m of myMoves()) {
    const cell = cellFor(match.turn, m.to);
    const centre = cell
      ? { x: cellRect(L, cell).x + L.cell / 2, y: cellRect(L, cell).y + L.cell / 2 }
      : null;
    if (!centre) continue;
    paint.ghost(g, TEAMS[match.turn].shape, centre.x, centre.y, L.cell * 0.36);
  }

  
  
  
  const p = anim ? easeOut(progress(now, anim.at, MOVE_MS, app.motion)) : 1;
  const from = anim ? tokenSpots(anim.before, boardBox) : null;
  const legal = new Set(myMoves().map((m) => m.token));
  spots.forEach((spot, i) => {
    const a = from?.[i];
    
    
    
    
    
    
    
    const dist = a ? Math.hypot(spot.x - a.x, spot.y - a.y) : 0;
    const arc = a && p < 1 ? Math.sin(p * Math.PI) * Math.min(46, dist * 0.22) : 0;
    const shown = a && p < 1
      ? {
        ...spot,
        x: a.x + (spot.x - a.x) * p,
        y: a.y + (spot.y - a.y) * p - arc,
        
        
        r: (a.r + (spot.r - a.r) * p) * (1 + Math.sin(p * Math.PI) * 0.16),
      }
      : spot;
    const canMove = spot.team === match.turn && legal.has(spot.token);
    const cursorHere = canMove && myMoves()[cursor]?.token === spot.token;
    paint.token(g, shown, {
      lift: i === tokenHover ? lift(progress(now, tokenHoverAt, DURATION.hover, app.motion), app.motion) : 0,
      legal: canMove,
      chosen: cursorHere && app.keyboardMode,
      moving: p < 1,
    });
  });
}

function drawPanel(now) {
  const pressable = myRoll();
  paint.die(g, dieRect, {
    face: match.awaiting === 'roll' && !match.die ? null : match.die,
    tumble: progress(now, dieAt, DIE_MS, app.motion),
    hover: pressable ? 2 : 0,
    hint: pressable ? 'ROLL' : '',
  });

  const lines = paint.wrap(g, message || statusOf(match, whoIs), statusBox.w - 4, { size: SIZES.min });
  lines.slice(0, Math.floor(statusBox.h / 24)).forEach((line, i) => {
    paint.text(g, line, { x: statusBox.x, y: statusBox.y + i * 24, w: statusBox.w, h: 24 },
      { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left' });
  });

  const compact = app.width < BAR_WIDE;
  for (const r of seatRects) {
    const seat = match.seats[r.team];
    paint.seat(g, r, {
      team: r.team,
      who: whoIs(seat),
      ...progressOf(match.tokens[r.team]),
      active: match.turn === r.team && match.awaiting !== 'over',
      finished: match.finished.includes(r.team),
      compact,
    });
  }

  
  
  
  if (!compact && seatRects.length) {
    const last = seatRects[seatRects.length - 1];
    const foot = {
      x: panelBox.x,
      y: last.y + last.h + 14,
      w: panelBox.width,
      h: Math.max(0, panelBox.y + panelBox.height - (last.y + last.h) - 14),
    };
    if (foot.h > 40) {
      const note = roomLine() || 'Playing on your own. Press Together to share a link.';
      paint.wrap(g, `${note} Press ? for how to play.`, foot.w - 4, { size: SIZES.min })
        .slice(0, Math.floor(foot.h / 24))
        .forEach((line, i) => {
          paint.text(g, line, { x: foot.x, y: foot.y + i * 24, w: foot.w, h: 24 },
            { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left' });
        });
    }
  }
}

function drawBar(now) {
  paint.text(g, 'Farmy Ludo', { x: 14, y: 8, w: Math.max(120, app.width - 360), h: 44 },
    { size: SIZES.h2, align: 'left', fit: true, maxWidth: Math.max(120, app.width - 360) });
  paint.rule(g, 0, BAR - 4, app.width);
  barRects.forEach((b, i) => {
    paint.button(g, b, {
      label: b.label,
      size: SIZES.min,
      hover: i === barHover ? lift(progress(now, barHoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
  });
}

function roomLine() {
  if (!room.active) return '';
  const others = room.peers.filter((p) => p !== room.me);
  if (!others.length) return `Room ${spokenCode(net?.id ?? '')} is open. Waiting for somebody to join.`;
  return `Room ${spokenCode(net?.id ?? '')}: playing with ${others.map(nameFor).join(', ')}.`;
}

function frame() {
  const now = performance.now();
  const step = tick({ dirty, moving: animating(now), wasMoving });
  dirty = false;
  wasMoving = step.wasMoving;
  if (step.draw) {
    paint.clear(g, app.width, app.height);
    drawBoard(now);
    drawPanel(now);
    drawBar(now);
    if (overlay) overlay.draw(g, now);
    const d = overlay
      ? overlay.describe()
      : describe(match, { message, room: roomLine(), who: whoIs });
    
    
    
    
    mirror({
      title: d.title,
      status: d.status || message || statusOf(match, whoIs),
      lines: d.lines,
    });
  }
  if (step.again) requestAnimationFrame(frame);
  else looping = false;
}





function closeOverlay() {
  overlay = null;
  keysAre(KEY_HELP);
  relayout();
  invalidate();
}

function openHelp() {
  overlay = overlays.help(app, { onClose: closeOverlay });
  overlay.layout();
  invalidate();
}

function openSay() {
  overlay = overlays.say(app, {
    onSay: (id) => {
      net?.say(id);
      say(`You said: ${sayingText(id)}`);
      closeOverlay();
    },
    onClose: closeOverlay,
  });
  overlay.layout();
  invalidate();
}

function openMenu() {
  const items = [
    { id: 'together', label: togetherLabel(), run: openRoom },
    ...(room.active && room.peers.length > 1
      ? [{ id: 'say', label: 'Say something', run: openSay }] : []),
    {
      id: 'again',
      label: iAmHost() ? 'New game' : 'The host starts the next game',
      disabled: !iAmHost(),
      run: () => { closeOverlay(); newMatch(); },
    },
    
    
    
    
    
    {
      id: 'sound',
      label: sfx.isMuted() ? 'Sound: off' : 'Sound: on',
      run: () => {
        sfx.setMuted(!sfx.isMuted());
        sfx.play('yours');
        closeOverlay();
        openMenu();
      },
    },
    { id: 'help', label: 'How to play', run: openHelp },
  ];
  overlay = overlays.menu(app, { items, onClose: closeOverlay });
  overlay.layout();
  invalidate();
}

function openRoom() {
  startNet();
  overlay = overlays.room(app, {
    
    
    
    
    state: {
      get active() { return room.active; },
      get code() { return net?.id ?? ''; },
      get copied() { return room.copied; },
      get who() {
        return room.peers.map((id) => ({
          by: id,
          colour: colourFor(id, room.peers),
          line: `${id === room.me ? 'You' : nameFor(id)}`
            + `${seatOf(match.seats, id) >= 0 ? ` - ${teamLabel(seatOf(match.seats, id))}` : ' - watching'}`,
        }));
      },
    },
    onHost: () => {
      room.active = true;
      room.copied = false;
      startNet().host();
      relayout();
      invalidate();
    },
    onJoin: (code) => {
      room.active = true;
      room.copied = false;
      startNet().join(code);
      relayout();
      invalidate();
    },
    onCopy: () => {
      const link = shareLinkFor(globalThis.location.href, net?.id ?? '');
      try {
        globalThis.navigator?.clipboard?.writeText(link);
        room.copied = true;
        say('Link copied. Send it to whoever you want to play with.');
      } catch {
        say(`Copy this: ${link}`);
      }
      overlay?.relayout();
      invalidate();
    },
    onLeave: () => {
      net?.leave();
      net = null;
      room.active = false;
      room.me = SOLO;
      room.peers = [];
      closeOverlay();
      newMatch();
    },
    onClose: closeOverlay,
  });
  overlay.layout();
  invalidate();
}

function showResults() {
  const rows = standings(match);
  overlay = overlays.results(app, {
    state: {
      winnerName: teamAt(match.winner).name,
      blurb: match.seats[match.winner].kind === 'bot'
        ? 'The computer got all four home first. Have another go.'
        : `${match.seats[match.winner].by === room.me ? 'You' : nameFor(match.seats[match.winner].by)} got all four home first.`,
      rows: rows.map((r, i) => ({
        line: `${i + 1}. ${teamLabel(r.team)}, ${whoIs(r.seat).toLowerCase()}: `
          + `${r.done} of 4 home, ${r.travelled} squares.`,
      })),
    },
    onAgain: () => { closeOverlay(); if (iAmHost()) newMatch(); else say('The host starts the next game.'); },
    onClose: closeOverlay,
  });
  overlay.layout();
  invalidate();
}





function startNet() {
  if (net) return net;
  net = createNet({
    hello: () => ({
      seats: match.seats.map((s) => ({ team: s.team, kind: s.kind, by: s.by })),
      head,
      headAt,
      
      
      entries: entries.map((e, n) => (e ? { ...e, n } : null)).filter(Boolean),
    }),
    onPeers: ({ peers, me }) => {
      room.peers = peers;
      if (me) room.me = me;
      room.active = !!peers.length || !!me;
      if (!peers.length && !me) { room.active = false; room.me = SOLO; }
      
      
      
      
      
      
      if (net?.hosting && match.n < 8 && seatOf(match.seats, peers[peers.length - 1]) < 0) newMatch();
      else net?.setup();
      relayout();
      invalidate();
    },
    onSetup: (m) => {
      if (net?.hosting) return;                 
      seats = m.seats.map((s, i) => ({ ...s, team: i }));
      head = m.head;
      headAt = m.headAt ?? 0;
      entries = [];
      for (const e of m.entries ?? []) entries = withEntry(entries, e.n, e);
      rebuild();
      schedulePump(200);
    },
    onRoll: (m) => {
      if (net?.hosting) return;                 
      if (recordRoll(m.n, m.link)) pump();
    },
    onMove: (m) => {
      
      
      
      
      if (typeof m.n !== 'number' || typeof m.token !== 'number') return;
      entries = withEntry(entries, m.n, { token: m.token, by: m.by });
      pump();
    },
    onSay: (m) => {
      const text = sayingText(m.say);
      if (!text) return;
      say(`${nameFor(m.by)}: ${text}`);
    },
    onStatus: (text) => { room.status = text; say(text); },
    onHostChange: ({ hosting }) => {
      
      
      
      if (!hosting) return;
      newChain(match.n);
      net?.setup();
      schedulePump(300);
    },
  });
  return net;
}





const pointAt = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};










function tokenAt(pt) {
  const legal = new Set(myMoves().map((m) => m.token));
  return pickToken(spots, pt, (s) => s.team === match.turn && legal.has(s.token));
}

const inDie = (pt) => pt.x >= dieRect.x && pt.x <= dieRect.x + dieRect.w
  && pt.y >= dieRect.y && pt.y <= dieRect.y + dieRect.h;

canvas.addEventListener('pointerdown', (e) => {
  const pt = pointAt(e);
  canvas.setPointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerDown(pt); return; }
});

canvas.addEventListener('pointermove', (e) => {
  const pt = pointAt(e);
  if (overlay) { overlay.pointerMove(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar !== barHover) { barHover = bar; barHoverAt = performance.now(); invalidate(); }
  const tk = tokenAt(pt);
  const canTake = tk >= 0 && spots[tk].team === match.turn
    && myMoves().some((m) => m.token === spots[tk].token);
  const at = canTake ? tk : -1;
  if (at !== tokenHover) { tokenHover = at; tokenHoverAt = performance.now(); invalidate(); }
  
  
  
  canvas.style.cursor = (bar >= 0 || canTake || (inDie(pt) && myRoll())) ? 'pointer' : 'default';
});

canvas.addEventListener('pointerup', (e) => {
  const pt = pointAt(e);
  canvas.releasePointerCapture?.(e.pointerId);
  if (overlay) { overlay.pointerUp(pt); return; }
  const bar = rectAt(barRects, pt.x, pt.y);
  if (bar >= 0) {
    const id = barRects[bar].id;
    if (id === 'help') openHelp();
    else if (id === 'more') openMenu();
    else if (id === 'together') openRoom();
    else if (id === 'again') newMatch();
    return;
  }
  
  
  if (inDie(pt) && myRoll()) { pump(); return; }
  const tk = tokenAt(pt);
  if (tk >= 0 && spots[tk].team === match.turn) playToken(spots[tk].token);
});

canvas.addEventListener('pointerleave', () => {
  barHover = -1;
  tokenHover = -1;
  if (overlay) overlay.pointerLeave();
  invalidate();
});



canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

document.addEventListener('keydown', (e) => {
  sfx.wake();
  const action = routeKey(
    { key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
    { overlay: !!overlay, typing: !!overlay?.typing?.() },
  );
  if (!action) return;
  e.preventDefault();
  if (action.type === 'move') { app.keyboardMode = true; invalidate(); }

  if (overlay) { overlay.key(action); return; }
  if (action.type === 'help') { openHelp(); return; }
  if (action.type === 'back') { openMenu(); return; }

  const moves = myMoves();
  if (action.type === 'move' && moves.length) {
    cursor = (cursor + action.value + moves.length) % moves.length;
    invalidate();
    return;
  }
  if (action.type === 'token' && moves.some((m) => m.token === action.value)) {
    playToken(action.value);
    return;
  }
  if (action.type === 'enter') {
    if (myRoll()) { pump(); return; }
    if (moves.length) playToken(moves[cursor % moves.length].token);
  }
});

reduceMotion?.addEventListener?.('change', (ev) => { app.motion = !ev.matches; invalidate(); });
globalThis.addEventListener('resize', resize);
















globalThis.__fl = {
  
  
  get audio() { return sfx.state(); },
  get game() {
    return {
      turn: match.turn,
      awaiting: match.awaiting,
      die: match.die,
      n: match.n,
      winner: match.winner,
      tokens: match.tokens.map((row) => row.slice()),
      moves: match.moves.map((m) => m.token),
      seats: match.seats.map((s) => ({ team: s.team, kind: s.kind, by: s.by })),
      mySeat: mySeat(),
    };
  },
  get room() {
    return {
      active: room.active,
      me: room.me,
      peers: room.peers,
      code: net?.id ?? null,
      hosting: !!net?.hosting,
      rolls: entries.filter(Boolean).length,
      status: room.status,
    };
  },
  get overlay() { return overlay ? overlay.id : null; },
  rects: () => (overlay
    ? overlay.rects()
    : [
      ...spots.map((s) => ({ id: `token:${s.team}:${s.token}`, ...s.hit })),
      { id: 'die', ...dieRect },
      ...seatRects.map((r) => ({ id: r.id, x: r.x, y: r.y, w: r.w, h: r.h })),
      ...barRects.map((b) => ({ id: `bar:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h })),
    ]),
};





keysAre(KEY_HELP);
resize();


const linkRoom = joinIdFrom(globalThis.location.href);
if (linkRoom && canPlayTogether()) {
  room.active = true;
  startNet().join(linkRoom);
} else {
  newMatch();
}
trackEvent('game_start', { game: 'farmy-ludo' });
