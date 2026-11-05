










import { CELL, createBlockMatch, createMatch, fill as fillMatch, publicView } from '../../../web-engine/lamps/lampsMatch.js';
import { BOT_LEVELS, createBot, thinkMove, thinkMsFor } from '../../../web-engine/lamps/lampsBot.js';
import { TOWERS, blockSide, groupOf, isBlock, towerById, towersOfGroup } from '../../../web-engine/lamps/towers.js';
import { BLOCK_SIZES } from '../../../web-engine/lamps/blocks.js';
import { roomAt, roomIndex } from '../../../web-engine/lamps/lampsBlock.js';
import { diffViews } from '../../../web-engine/lamps/lampsWire.js';
import {
  COUNTDOWN_MS, GUEST, canStart, createRoom, freeSeatsOf, isRealSeat, leftResult, matchRunning,
  seatOf, seatsWith, setHostSeat, startRound,
} from '../../../web-engine/lamps/lampsRoom.js';
import { CHEAT_STATES, applyCheat } from '../../../web-engine/lamps/lampsCheats.js';
import { ROLE, roomFromHref, watchLinkFor, watchingLabel } from '../../../web-engine/net/watchers.js';
import { shareLinkFor } from '../../../web-engine/words/coop.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { applyGameName, gameLang } from '../../../web-engine/i18n/gameNames.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { playUi } from '../../../web-engine/brand/uiSound.js';
import { bootDone } from '../../shared/ui/fitScreen.js';
import { mountLevelScene } from '../../shared/ui/levelScene.js';
import { createNet, canPlayTogether } from './net.js';
import { AIM_BELOW_PX, availableBoard, layoutBlock, layoutBoard } from './layout.js';
import { NO_CUT, maxCut } from './blockView.js';
import { stringsFor, pictureName, count, fill } from './strings.js';

const GAME_ID = 'lamplighters';
const SETUP_KEY = 'lamplighters-setup-v1';

function canDrawBlocks() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch { return false; }
}
const SIZES = [5, 10, 15, ...(canDrawBlocks() ? BLOCK_SIZES : [])];
const CUT_AXES = [['y', 'cutTop'], ['x', 'cutSide'], ['z', 'cutFront']];
const LEVELS = Object.keys(BOT_LEVELS);
const PENDING_MS = 1500;
const LONG_PRESS_MS = 420;
const BLACKOUT_MS = 800;
const BLACKOUT_REDUCED_MS = 200;
const TICK_MS = 150;
const BOT_SEAT = 1;

const $ = (id) => document.getElementById(id);
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const codeOf = (id) => String(id ?? '').replace(/^flt-/i, '').toUpperCase();
const sum = (clue) => clue.reduce((a, b) => a + b, 0);

const lang = gameLang();
const T = stringsFor(lang);
document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
applyGameName(GAME_ID);
initAnalytics({ page: GAME_ID });
startVersionChecker({ versionUrl: './version.json', label: 'A new version of Lamplighters is available.' });

function loadSetup() {
  try {
    const s = JSON.parse(localStorage.getItem(SETUP_KEY));
    return s && typeof s === 'object' ? s : {};
  } catch { return {}; }
}
const saved = loadSetup();
const setup = {
  size: SIZES.includes(saved.size) ? saved.size : 5,
  picture: towerById(saved.picture) ? saved.picture : towersOfGroup(5)[0].id,
  rival: LEVELS.includes(saved.rival) ? saved.rival : 'apprentice',
};
if (groupOf(towerById(setup.picture)) !== setup.size) setup.picture = towersOfGroup(setup.size)[0].id;
const saveSetup = () => { try { localStorage.setItem(SETUP_KEY, JSON.stringify(setup)); } catch {  } };


let screen = 'setup';
let mode = 'bot'; 
let picture = null;
let match = null; 
let view = null;
let round = 0;
let goAt = 0;
let endShownFor = 0;
let endTimer = null;
let bot = null;
let botTimer = null;
let botLevel = null;
let inputMode = 'light';
let aimCell = -1;
let focusCell = 0;
let shape = null;
let cellEls = [];
let rowClueEls = [];
let colClueEls = [];
const cellClass = [];
const marks = new Set();
const pending = new Map();
const anim = new Map();


let blockMod = null;
let blockLoad = null;
let blockScene = null;
let blockCut = NO_CUT;
let blockCursor = -1;
let blockSig = '';
let viewStamp = 0;

let net = null;
let room = createRoom();
const roomUi = { active: false, me: null, peers: [], code: null, watching: false, asked: false, gone: false };

const isHost = () => mode === 'room' && !!net?.hosting;
const mySeat = () => {
  if (mode === 'bot') return 0;
  return roomUi.me ? seatOf(room, roomUi.me) : -1;
};
const viewer = () => mode === 'room' && mySeat() < 0;

function show(which) {
  screen = which;
  if (which === 'setup') disposeBlock();
  for (const id of ['setup', 'match', 'end']) $(id).hidden = id !== which;
  
  $('rules-link').hidden = which !== 'setup';
  scrollTo(0, 0);
}

let toastTimer = null;
function toast(text, ms = 3000) {
  clearTimeout(toastTimer);
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, ms);
}


function towerNumber(id) {
  const t = towerById(id);
  return t ? towersOfGroup(groupOf(t)).findIndex((x) => x.id === id) + 1 : 0;
}

const groupLabel = (group) => {
  const side = blockSide(group);
  return side ? fill(T.blockSize, { n: side }) : fill(T.towerSize, { n: group });
};


function loadBlockMod() {
  if (!blockLoad) {
    blockLoad = import('./blockScene.js').then((mod) => { blockMod = mod; return mod; });
    blockLoad.catch(() => { blockLoad = null; });
  }
  return blockLoad;
}

function chip(label, pressed, locked, onPick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'll-chip skin-stone-toggle';
  b.textContent = label;
  b.setAttribute('aria-pressed', String(pressed));
  b.setAttribute('aria-disabled', String(locked));
  b.addEventListener('click', () => {
    if (locked) return;
    playUi('tap');
    onPick();
  });
  return b;
}

function pickPicture(id) {
  setup.picture = id;
  setup.size = groupOf(towerById(id));
  saveSetup();
  
  if (isBlock(towerById(id))) loadBlockMod().catch(() => {});
  if (roomUi.active && net?.hosting) {
    room = { ...room, picture: id };
    net.publish();
  }
  drawSetup();
}

function drawSetup() {
  const inRoom = roomUi.active;
  const locked = inRoom && (!net?.hosting || matchRunning(room));
  const shown = inRoom && room.picture ? room.picture : setup.picture;
  const size = groupOf(towerById(shown));
  $('sizes').replaceChildren(...SIZES.map((n) => chip(groupLabel(n), n === size, locked, () => {
    pickPicture(towersOfGroup(n)[0].id);
  })));
  $('towers').replaceChildren(...towersOfGroup(size).map((p, i) => chip(String(i + 1), p.id === shown, locked, () => {
    pickPicture(p.id);
  })));
  $('rivals').replaceChildren(...LEVELS.map((lv) => chip(T.rivals[lv], lv === setup.rival, false, () => {
    setup.rival = lv;
    saveSetup();
    drawSetup();
  })));
  $('solo-card').hidden = inRoom;
  $('room-start').hidden = inRoom;
  $('room-live').hidden = !inRoom;
  if (!inRoom) return;

  $('room-code').textContent = roomUi.code ?? '-';
  const watchers = $('watchers');
  watchers.textContent = watchingLabel(T.watchers, net?.watchers ?? 0);
  watchers.hidden = !watchers.textContent;
  $('copy-link').hidden = roomUi.watching || viewer();
  const hostSeated = !!net?.hosting && mySeat() >= 0;
  const mayStart = hostSeated && canStart(room);
  $('start-room').hidden = !mayStart;
  $('room-status').textContent = roomLine();
}

function roomLine() {
  if (!roomUi.me && !net?.id) return T.connecting;
  if (roomUi.watching || viewer()) return T.roomWatching;
  if (roomUi.gone) return T.roomLeft;
  if (roomUi.asked) return T.roomAsk;
  if (!room.seats.every(isRealSeat)) return net?.hosting ? T.roomWaiting : T.roomWaitHost;
  return net?.hosting ? T.roomReady : T.roomWaitHost;
}


function clearMatchTimers() {
  clearTimeout(botTimer);
  clearTimeout(endTimer);
  botTimer = null;
  endTimer = null;
}

function enterMatch(pictureId) {
  picture = towerById(pictureId);
  view = null;
  aimCell = -1;
  inputMode = 'light';
  marks.clear();
  pending.clear();
  anim.clear();
  endShownFor = 0;
  disposeBlock();
  const block = isBlock(picture);
  $('board').hidden = block;
  $('block').hidden = !block;
  $('cut').hidden = !block;
  $('block').parentElement.classList.toggle('block', block);
  if (block) buildBlock();
  else buildBoard();
  show('match');
  relayout();
}

const newMatchOn = (id) => {
  const t = towerById(id);
  return isBlock(t) ? createBlockMatch({ model: t }) : createMatch({ lines: t.lines });
};





function waitForBlockMod(id, again) {
  if (!isBlock(towerById(id)) || blockMod) return false;
  loadBlockMod().then(again, () => toast(T.noBlock, 4000));
  return true;
}

function startBotMatch(pictureId, level, cheat = null) {
  if (waitForBlockMod(pictureId, () => startBotMatch(pictureId, level, cheat))) return;
  clearMatchTimers();
  mode = 'bot';
  botLevel = level;
  round += 1;
  match = newMatchOn(pictureId);
  bot = createBot(level, (Date.now() ^ (round * 2654435761)) >>> 0);
  const now = Date.now();
  const cheated = cheat ? applyCheat(match, cheat, now) : false;
  
  goAt = cheated ? 0 : now + COUNTDOWN_MS;
  enterMatch(pictureId);
  onView(publicView(match));
  scheduleBot(goAt ? COUNTDOWN_MS : 0);
  trackEvent('game_start', { game: GAME_ID, level, picture: pictureId });
}

function botPause(size) { return thinkMsFor(bot.cfg, size) * (0.7 + bot.rand() * 0.6); }

function scheduleBot(extra) {
  if (!match || match.finished) return;
  const myRound = round;
  botTimer = setTimeout(() => {
    if (round !== myRound || mode !== 'bot' || !match || match.finished) return;
    
    const cell = thinkMove(bot, publicView(match));
    if (cell !== null) {
      fillMatch(match, BOT_SEAT, cell, Date.now());
      onView(publicView(match));
    }
    scheduleBot(0);
  }, extra + botPause(isBlock(picture) ? picture.size : match.rows));
}


function disposeBlock() {
  blockScene?.dispose();
  blockScene = null;
  blockSig = '';
}


function buildBlock() {
  cellEls = [];
  rowClueEls = [];
  colClueEls = [];
  cellClass.length = 0;
  shape = { block: true, rows: picture.floors.length, layout: { aim: false } };
  blockCut = NO_CUT;
  blockCursor = -1;
  drawCut();
  const model = picture;
  if (blockMod) { makeBlockScene(); return; }
  loadBlockMod().then(() => {
    if (picture !== model || blockScene) return;
    makeBlockScene();
    relayout();
    if (screen === 'end') revealBlock();
  }, () => toast(T.noBlock, 4000));
}

function makeBlockScene() {
  try {
    blockScene = blockMod.createBlockScene($('block'), {
      model: picture,
      on: { tap: (room, type) => activate(room, type), mark: (room) => toggleMark(room) },
    });
  } catch {
    
    blockScene = null;
    toast(T.noBlock, 4000);
  }
  blockSig = '';
}

function paintBlock() {
  if (!blockScene || !view) return;
  const frozen = frozenLeft(mySeat()) > 0;
  const sig = [viewStamp, [...marks].join(), [...pending.keys()].join(), blockCut.axis, blockCut.layers, aimCell, blockCursor, frozen, veiled()].join('|');
  if (sig === blockSig) return;
  blockSig = sig;
  blockScene.update(view, { marks, pending, cut: blockCut, aim: aimCell, cursor: blockCursor, frozen, veiled: veiled() });
}

function drawCut() {
  const axis = blockCut.axis ?? 'y';
  $('cut-axes').replaceChildren(...CUT_AXES.map(([a, key]) => {
    const b = chip(T[key], a === axis, false, () => {
      blockCut = { axis: a, layers: 0 };
      drawCut();
      paint();
    });
    b.classList.add('ll-tool');
    return b;
  }));
  const range = $('cut-range');
  range.setAttribute('aria-label', T.cutH);
  const dims = view?.dims ?? [picture.floors[0][0].length, picture.floors.length, picture.floors[0].length];
  range.max = String(maxCut(dims, axis));
  range.value = String(blockCut.layers);
}

function moveCursor(key) {
  const { dims } = view;
  const [x, y, z] = blockCursor >= 0 ? roomAt(dims, blockCursor) : [0, dims[1] - 1, 0];
  const at = [x, y, z];
  if (blockCursor >= 0) {
    if (key === 'ArrowLeft') at[0] -= 1;
    if (key === 'ArrowRight') at[0] += 1;
    if (key === 'ArrowUp') at[2] += 1; 
    if (key === 'ArrowDown') at[2] -= 1;
    if (key === 'PageUp') at[1] += 1;
    if (key === 'PageDown') at[1] -= 1;
  }
  const next = at.map((v, k) => Math.max(0, Math.min(dims[k] - 1, v)));
  blockCursor = roomIndex(dims, next[0], next[1], next[2]);
  $('block-live').textContent = labelFor(blockCursor);
  paint();
}

function wireBlockInput() {
  const host = $('block');
  host.addEventListener('keydown', (e) => {
    if (!view || !shape?.block) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      moveCursor(e.key);
    } else if (blockCursor >= 0 && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      if (inputMode === 'mark') toggleMark(blockCursor);
      else lightWindow(blockCursor);
      $('block-live').textContent = labelFor(blockCursor);
    } else if (blockCursor >= 0 && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      toggleMark(blockCursor);
      $('block-live').textContent = labelFor(blockCursor);
    }
  });
  $('cut-range').addEventListener('input', (e) => {
    blockCut = { axis: blockCut.axis ?? 'y', layers: Number(e.target.value) };
    paint();
  });
}


function revealBlock() {
  if (!blockScene) return;
  blockCursor = -1; 
  const { clientWidth, clientHeight } = document.documentElement;
  blockScene.moveTo($('reveal'));
  blockScene.resize(Math.min(clientWidth - 32, 620), Math.min(Math.round(clientHeight * 0.5), 520));
  blockScene.reveal({ finished: !!view?.finished });
}


function buildBoard() {
  const { lines } = picture;
  const rows = lines.length;
  const cols = lines[0].length;
  const blank = createMatch({ lines });
  shape = { rows, cols, rowClues: blank.rowClues, colClues: blank.colClues };
  const board = $('board');
  board.style.setProperty('--rows', rows);
  board.style.setProperty('--cols', cols);
  board.setAttribute('aria-rowcount', rows);
  board.setAttribute('aria-colcount', cols);
  board.className = 'll-board';
  cellEls = [];
  rowClueEls = [];
  colClueEls = [];
  cellClass.length = 0;

  const clueEl = (cls, clue, label) => {
    const el = document.createElement('div');
    el.className = `ll-clue ${cls}`;
    el.setAttribute('role', 'columnheader');
    el.setAttribute('aria-label', label);
    (clue.length ? clue : [0]).forEach((n) => {
      const s = document.createElement('span');
      s.textContent = String(n);
      el.append(s);
    });
    return el;
  };

  const frag = document.createDocumentFragment();
  const header = document.createElement('div');
  header.className = 'll-rowline';
  header.setAttribute('role', 'row');
  const corner = document.createElement('div');
  corner.setAttribute('role', 'presentation');
  header.append(corner);
  shape.colClues.forEach((clue, c) => {
    const el = clueEl('col', clue, fill(T.colClue, { c: c + 1, clue: clue.join(' ') || T.emptyClue }));
    colClueEls.push(el);
    header.append(el);
  });
  frag.append(header);

  for (let r = 0; r < rows; r += 1) {
    const line = document.createElement('div');
    line.className = 'll-rowline';
    line.setAttribute('role', 'row');
    const clue = shape.rowClues[r];
    const rowEl = clueEl('row', clue, fill(T.rowClue, { r: r + 1, clue: clue.join(' ') || T.emptyClue }));
    rowEl.setAttribute('role', 'rowheader');
    rowClueEls.push(rowEl);
    line.append(rowEl);
    for (let c = 0; c < cols; c += 1) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.cell = String(r * cols + c);
      b.setAttribute('role', 'gridcell');
      b.tabIndex = -1;
      cellEls.push(b);
      line.append(b);
    }
    frag.append(line);
  }
  board.replaceChildren(frag);
  focusCell = 0;
  cellEls[0].tabIndex = 0;
}

function relayout() {
  if (!shape) return;
  
  
  
  const { clientWidth, clientHeight } = document.documentElement;
  if (shape.block) {
    if (screen === 'end') { revealBlock(); return; }
    const b = layoutBlock(clientWidth, clientHeight);
    const host = $('block');
    host.style.width = `${b.width}px`;
    host.style.height = `${b.height}px`;
    blockScene?.resize(b.width, b.height);
    
    shape.layout = { aim: !!blockScene && blockScene.pxPerRoom() < AIM_BELOW_PX };
    $('arena').classList.toggle('beside', b.crewsBeside);
    paint();
    return;
  }
  const area = availableBoard(clientWidth, clientHeight);
  const l = layoutBoard(shape, area.width, area.height);
  shape.layout = l;
  const root = document.documentElement.style;
  root.setProperty('--cell', `${l.cell}px`);
  root.setProperty('--gw', `${l.gutterW}px`);
  root.setProperty('--gh', `${l.gutterH}px`);
  root.setProperty('--clue', `${l.fontPx}px`);
  $('arena').classList.toggle('beside', area.crewsBeside);
  paint();
}


function edgeClass(i) {
  const { cols } = shape;
  const r = Math.floor(i / cols);
  const c = i % cols;
  return `${c > 0 && c % 5 === 0 ? ' edge-c' : ''}${r > 0 && r % 5 === 0 ? ' edge-r' : ''}`;
}





function tileVariant(i, n) {
  return 'abc'[(Math.imul(i + 1, 2654435761) >>> 13) % n];
}

function classFor(i) {
  const st = view ? view.state[i] : CELL.DARK;
  let cls = `ll-cell${edgeClass(i)}`;
  if (st === CELL.LIT) cls += ` lit${view.owner[i]} v${tileVariant(i, 3)}`;
  else if (st === CELL.DARK && !marks.has(i)) cls += ` v${tileVariant(i, 2)}`;
  else if (st === CELL.SHUT) cls += ' shut';
  else if (st === CELL.FUSED) cls += ' fused';
  else if (st === CELL.OFF) cls += ' off';
  else if (marks.has(i)) cls += ' marked';
  if (pending.has(i)) cls += ' pending';
  if (aimCell === i) cls += ' aimed';
  else if (aimCell >= 0) {
    const { cols } = shape;
    if (Math.floor(aimCell / cols) === Math.floor(i / cols) || aimCell % cols === i % cols) cls += ' axis';
  }
  if (anim.has(i)) cls += ` ${anim.get(i)}`;
  return cls;
}

function labelFor(i) {
  let at;
  let floor = '';
  if (shape.block) {
    const [x, y, z] = roomAt(view.dims, i);
    at = { r: z + 1, c: x + 1 };
    floor = `${fill(T.floor, { f: y + 1 })}, `;
  } else {
    const { cols } = shape;
    at = { r: Math.floor(i / cols) + 1, c: (i % cols) + 1 };
  }
  const st = view ? view.state[i] : CELL.DARK;
  if (st === CELL.LIT) return floor + fill(T.cellLit, { ...at, crew: crewName(view.owner[i]) });
  if (st === CELL.SHUT) return floor + fill(T.cellShut, at);
  if (st === CELL.FUSED) return floor + fill(T.cellFused, at);
  if (st === CELL.OFF) return floor + fill(T.cellOff, at);
  return floor + fill(marks.has(i) ? T.cellMarked : T.cellDark, at);
}

function crewName(seat) {
  if (mode === 'bot') return seat === 0 ? T.you : T.rivals[botLevel];
  const me = mySeat();
  if (me < 0) return seat === 0 ? T.crewAmber : T.crewCyan;
  return seat === me ? T.you : T.friend;
}

const veiled = () => Date.now() < goAt;
const frozenLeft = (seat) => (view && seat >= 0 ? Math.max(0, view.frozenUntil[seat] - Date.now()) : 0);


function paintClues() {
  
  if (!view || shape.block) return;
  const { rows, cols } = shape;
  const litIn = (start, step, count) => {
    let n = 0;
    for (let k = 0; k < count; k += 1) if (view.state[start + k * step] === CELL.LIT) n += 1;
    return n;
  };
  const crossR = aimCell >= 0 ? Math.floor(aimCell / cols) : -1;
  const crossC = aimCell >= 0 ? aimCell % cols : -1;
  const one = (el, closed, need, have, crossed) => {
    let cls = el.dataset.base ?? (el.dataset.base = el.className);
    if (closed) cls += ' closed';
    else if (need - have === 1) cls += ' short';
    if (crossed) cls += ' crossed';
    if (el.className !== cls) el.className = cls;
  };
  shape.rowClues.forEach((clue, r) => one(rowClueEls[r], view.closedRows[r], sum(clue), litIn(r * cols, 1, cols), r === crossR));
  shape.colClues.forEach((clue, c) => one(colClueEls[c], view.closedCols[c], sum(clue), litIn(c, cols, rows), c === crossC));
}

function paintCrews() {
  if (!view) return;
  [0, 1].forEach((seat) => {
    const windows = view.owner.filter((o) => o === seat).length;
    const left = frozenLeft(seat);
    $(`crew${seat}`).replaceChildren(...[
      ['name', crewName(seat)],
      ['pts', count(T.score, view.scores[seat])],
      ['sub win', count(T.windows, windows)],
      left > 0 ? ['frozen', fill(T.frozen, { n: Math.ceil(left / 1000) })] : ['sub', count(T.slips, view.wrong[seat])],
    ].map(([cls, text]) => {
      const el = document.createElement('div');
      el.className = cls;
      el.textContent = text;
      return el;
    }));
  });
}

function paintTools() {
  const watching = viewer();
  $('tools').querySelector('.ll-toggle').hidden = watching;
  $('mode-light').setAttribute('aria-pressed', String(inputMode === 'light'));
  $('mode-mark').setAttribute('aria-pressed', String(inputMode === 'mark'));
  $('commit').hidden = watching || aimCell < 0 || inputMode !== 'light';
  const block = !!shape?.block;
  let hint = block ? T.hintBlockMouse : T.hintMouse;
  const touch = globalThis.matchMedia?.('(pointer: coarse)').matches;
  if (touch && block) hint = shape.layout?.aim ? T.hintBlockAim : T.hintBlockTouch;
  else if (touch) hint = shape?.layout?.aim ? T.hintAim : T.hintTouch;
  if (touch && inputMode === 'mark') hint = block ? T.hintBlockMark : T.hintMark;
  if (frozenLeft(mySeat()) > 0) hint = T.hintFrozen;
  if (watching) hint = T.hintWatch;
  const el = $('hint');
  if (el.textContent !== hint) el.textContent = hint;
}

function paint() {
  if (screen !== 'match' || !shape) return;
  cellEls.forEach((el, i) => {
    const cls = classFor(i);
    if (cellClass[i] === cls) return;
    cellClass[i] = cls;
    el.className = cls;
    el.setAttribute('aria-label', labelFor(i));
  });
  paintClues();
  paintCrews();
  paintTools();
  $('tower-label').textContent = `${fill(T.towerName, { n: towerNumber(picture.id) })} · ${groupLabel(groupOf(picture))}`;
  $('lastcall').hidden = !view?.lastCall;
  $('lastcall').textContent = T.lastCall;
  const board = $('board');
  board.classList.toggle('veiled', veiled());
  board.classList.toggle('frozen', frozenLeft(mySeat()) > 0);
  $('block').classList.toggle('veiled', veiled());
  paintBlock();
  const count = $('countdown');
  count.hidden = !veiled();
  if (veiled()) count.textContent = String(Math.max(1, Math.ceil((goAt - Date.now()) / 1000)));
}

function flash(i, cls) {
  anim.set(i, cls);
  setTimeout(() => { if (anim.get(i) === cls) { anim.delete(i); paint(); } }, 320);
}


function onView(next) {
  const diff = diffViews(view, next);
  view = next;
  viewStamp += 1;
  next.state.forEach((st, i) => { if (st !== CELL.DARK) marks.delete(i); });
  if (aimCell >= 0 && next.state[aimCell] !== CELL.DARK && next.state[aimCell] !== CELL.OFF) aimCell = -1;
  if (!diff.fresh) {
    const me = mySeat();
    if (!shape.block) {
      diff.lit.forEach(({ cell }) => flash(cell, 'pop'));
      diff.fused.forEach((cell) => flash(cell, 'blow'));
    }
    const closes = diff.closedRows.length + diff.closedCols.length + diff.closedLines.length;
    if (diff.finished) {
      
    } else if (diff.lastCallStarted) playUi('badge');
    else if (closes > 0) playUi('xp');
    else if (diff.fused.length > 0) playUi(next.wrong[me] > 0 && diff.gained[me] <= 0 && frozenLeft(me) > 0 ? 'error' : 'tick');
    else if (diff.lit.length > 0) playUi(diff.lit.some((l) => l.seat === me) ? 'tap' : 'tick');
  }
  paint();
  
  if (!diff.fresh) blockScene?.announce(diff);
  if (next.finished) beginEnd();
}


function beginEnd() {
  if (endShownFor === round || endTimer) return;
  clearTimeout(botTimer);
  if (isHost()) room = { ...room, done: true };
  
  $('board').classList.add('blackout');
  $('board').classList.remove('frozen', 'veiled');
  blockScene?.blackout();
  endTimer = setTimeout(() => {
    endTimer = null;
    showEnd();
  }, reducedMotion() ? BLACKOUT_REDUCED_MS : BLACKOUT_MS);
}

function endTitle() {
  const me = mySeat();
  const result = room.result;
  if (mode === 'room' && result) {
    if (result.winner === null) return T.draw;
    if (result.winner === me) return T.leftWin;
    return fill(T.leftOther, { crew: crewName(result.winner) });
  }
  if (view.draw) return T.draw;
  if (view.winner === me) return T.won;
  return fill(T.rivalWon, { crew: crewName(view.winner) });
}

function endButton(label, go, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = go ? 'll-go skin-stone-button_primary' : 'll-btn skin-stone-button_secondary';
  b.textContent = label;
  b.addEventListener('click', () => { playUi('tap'); onClick(); });
  return b;
}

function nextTowerId(id) {
  const same = towersOfGroup(groupOf(towerById(id)));
  return same[(same.findIndex((p) => p.id === id) + 1) % same.length].id;
}

function drawFlatReveal(rev, finished) {
  const lines = picture.lines;
  const rows = lines.length;
  const cols = lines[0].length;
  const { clientWidth, clientHeight } = document.documentElement;
  const px = Math.max(4, Math.min(16, Math.floor(Math.min(clientWidth - 56, clientHeight * 0.32) / Math.max(rows, cols))));
  rev.style.setProperty('--cols', cols);
  rev.style.setProperty('--px', `${px}px`);
  
  const on = (r, c) => (finished ? lines[r][c] === '#' : view?.state[r * cols + c] === CELL.LIT);
  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = document.createElement('i');
      if (on(r, c)) i.className = 'on';
      frag.append(i);
    }
  }
  rev.replaceChildren(frag);
}

function showEnd() {
  endShownFor = round;
  const me = mySeat();
  const finished = !!view?.finished;
  const block = isBlock(picture);
  const rev = $('reveal');
  rev.classList.toggle('block', block);
  if (block) rev.replaceChildren();
  else drawFlatReveal(rev, finished);
  rev.setAttribute('aria-label', finished ? fill(T.revealAlt, { name: pictureName(lang, picture) }) : T.noPicture);

  $('end-title').textContent = endTitle();
  const was = block ? T.modelWas : T.pictureWas;
  $('end-picture').textContent = finished ? fill(was, { name: pictureName(lang, picture) }) : T.noPicture;
  $('tally').replaceChildren(...[0, 1].map((seat) => {
    const el = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = crewName(seat);
    const pts = document.createElement('b');
    pts.textContent = count(T.score, view?.scores[seat] ?? 0);
    const sub = document.createElement('span');
    sub.textContent = `${count(T.windows, view?.owner.filter((o) => o === seat).length ?? 0)}, ${count(T.slips, view?.wrong[seat] ?? 0)}`;
    el.append(name, pts, sub);
    return el;
  }));
  const won = finished ? view.winner === me : room.result?.winner === me;
  if (me >= 0) playUi(won ? 'trophy' : 'levelUp');
  drawEndButtons();
  show('end');
  if (block) revealBlock();
  if (mode === 'bot') trackEvent('game_end', { game: GAME_ID, level: botLevel, won });
}

function drawEndButtons() {
  const box = $('end-buttons');
  const status = $('end-status');
  status.textContent = '';
  if (mode === 'bot') {
    box.replaceChildren(
      endButton(T.next, true, () => {
        setup.picture = nextTowerId(picture.id);
        saveSetup();
        startBotMatch(setup.picture, botLevel);
      }),
      endButton(T.again, false, () => startBotMatch(picture.id, botLevel)),
      endButton(T.changeRival, false, () => { show('setup'); drawSetup(); }),
    );
    return;
  }
  const seated = mySeat() >= 0;
  if (net?.hosting && seated) {
    const ready = canStart(room);
    status.textContent = roomUi.gone ? T.roomLeft : roomUi.asked ? T.roomAsk : '';
    const buttons = [endButton(T.backRoom, false, () => { show('setup'); drawSetup(); })];
    if (ready) {
      buttons.unshift(
        endButton(T.next, true, () => startRoomRound(nextTowerId(picture.id))),
        endButton(T.again, false, () => startRoomRound(picture.id)),
      );
    }
    box.replaceChildren(...buttons);
    return;
  }
  status.textContent = seated ? '' : T.waitNext;
  const buttons = [endButton(T.leave, false, leaveToSetup)];
  if (seated && !room.result) {
    buttons.unshift(endButton(T.ask, true, () => {
      net?.propose({ kind: 'another' });
      $('end-status').textContent = T.asked;
    }));
  }
  box.replaceChildren(...buttons);
}


function canLight(i) {
  if (!view || view.finished || veiled()) return false;
  const st = view.state[i];
  return st === CELL.DARK || st === CELL.OFF;
}

function lightWindow(i) {
  const seat = mySeat();
  if (seat < 0 || !canLight(i) || marks.has(i) || pending.has(i)) return;
  
  if (frozenLeft(seat) > 0) return;
  aimCell = -1;
  if (match) {
    fillMatch(match, seat, i, Date.now());
    afterRefereeChange();
    return;
  }
  pending.set(i, Date.now() + PENDING_MS);
  net?.fill(round, i);
  paint();
}


function afterRefereeChange() {
  const next = publicView(match);
  if (isHost()) {
    if (match.finished) room = { ...room, done: true };
    net.publish();
  }
  onView(next);
}

function toggleMark(i, force = null) {
  if (!view || view.state[i] !== CELL.DARK || viewer() || view.finished) return;
  const on = force ?? !marks.has(i);
  if (on) marks.add(i);
  else marks.delete(i);
  paint();
}

function activate(i, pointerType) {
  if (viewer()) return;
  if (inputMode === 'mark') { toggleMark(i); return; }
  if (pointerType === 'touch' && shape.layout?.aim) {
    if (aimCell !== i) {
      if (!canLight(i)) return;
      aimCell = i;
      paint();
      return;
    }
  }
  lightWindow(i);
}

let press = null;
const cellFromEl = (el) => {
  const v = el?.dataset?.cell;
  return v === undefined ? -1 : Number(v);
};
const cellAt = (x, y) => cellFromEl(document.elementFromPoint(x, y));

function wireBoardInput() {
  const board = $('board');
  board.addEventListener('pointerdown', (e) => {
    const cell = cellFromEl(e.target);
    if (cell < 0 || viewer()) return;
    const painting = e.button === 2 || inputMode === 'mark';
    press = { id: e.pointerId, type: e.pointerType, cell, moved: false, long: false, button: e.button, paint: null, timer: null };
    if (painting) {
      press.paint = !marks.has(cell);
      toggleMark(cell, press.paint);
    } else if (e.pointerType !== 'mouse') {
      press.timer = setTimeout(() => {
        if (!press) return;
        press.long = true;
        toggleMark(press.cell);
      }, LONG_PRESS_MS);
    }
  });
  addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell < 0 || cell === press.cell) return;
    press.cell = cell;
    press.moved = true;
    clearTimeout(press.timer);
    if (press.paint !== null) toggleMark(cell, press.paint);
  });
  addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    clearTimeout(p.timer);
    
    if (p.long || p.moved || p.paint !== null || p.button !== 0) return;
    activate(p.cell, p.type);
  });
  addEventListener('pointercancel', () => {
    if (press) clearTimeout(press.timer);
    press = null;
  });
  board.addEventListener('contextmenu', (e) => e.preventDefault());
  
  board.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const cell = cellFromEl(e.target);
    if (cell >= 0) activate(cell, 'keyboard');
  });
  board.addEventListener('keydown', (e) => {
    const cell = cellFromEl(e.target);
    if (cell < 0) return;
    const { cols, rows } = shape;
    const moves = { ArrowLeft: cell % cols ? -1 : 0, ArrowRight: (cell + 1) % cols ? 1 : 0, ArrowUp: cell >= cols ? -cols : 0, ArrowDown: cell < cols * (rows - 1) ? cols : 0 };
    if (e.key in moves) {
      e.preventDefault();
      cellEls[focusCell].tabIndex = -1;
      focusCell = cell + moves[e.key];
      cellEls[focusCell].tabIndex = 0;
      cellEls[focusCell].focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (inputMode === 'mark') toggleMark(cell);
      else lightWindow(cell);
    } else if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      toggleMark(cell);
    }
  });
}


function roomSnapshot() {
  return {
    ...room,
    view: match ? publicView(match) : view,
    startsIn: Math.max(0, goAt - Date.now()),
  };
}

function startRoomRound(pictureId) {
  if (!net?.hosting || mySeat() < 0) return;
  if (waitForBlockMod(pictureId, () => startRoomRound(pictureId))) return;
  clearMatchTimers();
  mode = 'room';
  const base = { ...room, picture: pictureId };
  if (!canStart({ ...base, result: null, done: true })) return;
  room = startRound(base);
  round = room.round;
  roomUi.asked = false;
  roomUi.gone = false;
  setup.picture = pictureId;
  setup.size = groupOf(towerById(pictureId));
  saveSetup();
  match = newMatchOn(pictureId);
  goAt = Date.now() + COUNTDOWN_MS;
  enterMatch(pictureId);
  onView(publicView(match));
  net.publish();
  trackEvent('game_start', { game: GAME_ID, level: 'room', picture: pictureId });
}


function onProposal(action, from) {
  const seat = seatOf(room, from);
  if (seat < 0) return;
  if (action.kind === 'fill') {
    if (!match || action.round !== room.round || !matchRunning(room) || Date.now() < goAt) { net.publish(); return; }
    const res = fillMatch(match, seat, action.cell, Date.now());
    if (res.ok) afterRefereeChange();
    else net.publish();
    return;
  }
  if (action.kind === 'another') {
    roomUi.asked = true;
    if (screen === 'end') drawEndButtons();
    else drawSetup();
  }
}


function adoptRoom(r) {
  const newRound = r.round !== round;
  room = { ...room, seats: r.seats, picture: r.picture, round: r.round, result: r.result, done: !!r.view?.finished };
  pending.clear();
  if (r.round > 0 && r.picture && (newRound || picture?.id !== r.picture)) {
    round = r.round;
    match = null;
    clearMatchTimers();
    enterMatch(r.picture);
  }
  round = r.round;
  goAt = r.startsIn > 0 ? Date.now() + r.startsIn : 0;
  if (r.round > 0 && r.view) onView(r.view);
  if (r.result && endShownFor !== r.round && !endTimer) {
    clearMatchTimers();
    showEnd();
  } else if (screen === 'end') {
    drawEndButtons();
  } else if (screen === 'setup') {
    drawSetup();
  } else {
    paint();
  }
}

function forfeit(goneId) {
  if (!matchRunning(room) || view?.finished) return;
  room = { ...room, result: leftResult(room, goneId) };
  clearMatchTimers();
  if (match) match = null;
  showEnd();
}

function startNet() {
  if (net) return net;
  net = createNet({
    snapshot: roomSnapshot,
    onMatch: adoptRoom,
    onProposal,
    onPeers: (peers, id) => {
      roomUi.peers = peers;
      if (id) roomUi.me = id;
      if (id && net?.hosting) roomUi.code = codeOf(id);
      if (net?.hosting && roomUi.me) {
        
        if (!net.watching && !room.seats.includes(roomUi.me) && !matchRunning(room)) room = setHostSeat(room, roomUi.me);
        const gone = room.seats.filter((s) => isRealSeat(s) && s !== roomUi.me && !peers.includes(s));
        if (gone.length) {
          forfeit(gone[0]);
          room = { ...room, seats: freeSeatsOf(room.seats, gone) };
          roomUi.gone = true;
          net.publish();
          if (screen === 'end') drawEndButtons();
        }
      }
      if (screen === 'setup') drawSetup();
      else if (screen === 'match') paint();
    },
    onArrival: (who) => {
      room = { ...room, seats: seatsWith(room.seats, who, matchRunning(room)) };
      roomUi.gone = false;
      if (screen === 'end') drawEndButtons();
    },
    
    onUnseat: (who) => {
      if (!room.seats.includes(who)) return;
      forfeit(who);
      room = { ...room, seats: freeSeatsOf(room.seats, [who]) };
    },
    onStatus: (kind) => {
      if (kind === 'failed') {
        toast(T.badCode, 4000);
        leaveRoom();
        show('setup');
      }
      if (kind === 'host' && net?.hosting) {
        match = null;
        roomUi.code = roomUi.code ?? codeOf(net.id);
      }
      if (screen === 'setup') drawSetup();
    },
  });
  return net;
}

function openRoom() {
  if (!canPlayTogether()) { toast(T.noRooms, 4000); return; }
  mode = 'room';
  roomUi.active = true;
  room = createRoom({ picture: setup.picture });
  startNet().host();
  drawSetup();
}

function joinRoom(code, { watch = false } = {}) {
  if (!canPlayTogether()) { toast(T.noRooms, 4000); return false; }
  const out = startNet().join(code, { watch });
  if (out?.error) { net = null; toast(T.badCode, 4000); return false; }
  mode = 'room';
  roomUi.active = true;
  roomUi.watching = watch;
  roomUi.code = codeOf(code);
  room = createRoom({ seats: [GUEST, GUEST] });
  drawSetup();
  return true;
}

function leaveRoom() {
  try { net?.leave(); } catch {  }
  net = null;
  match = null;
  view = null;
  round = 0;
  goAt = 0;
  Object.assign(roomUi, { active: false, me: null, peers: [], code: null, watching: false, asked: false, gone: false });
  room = createRoom();
  mode = 'bot';
}

function leaveToSetup() {
  clearMatchTimers();
  if (roomUi.active) leaveRoom();
  else { match = null; view = null; }
  show('setup');
  drawSetup();
}


function fillStaticText() {
  $('rules-link').textContent = T.how;
  $('pitch').textContent = T.pitch;
  $('size-h').textContent = T.sizeH;
  $('tower-h').textContent = T.towerH;
  $('rival-h').textContent = T.rivalH;
  $('start-bot').textContent = T.startBot;
  $('friend-h').textContent = T.friendH;
  $('create-room').textContent = T.createRoom;
  $('join-btn').textContent = T.join;
  $('join-code').placeholder = T.joinHint;
  $('room-h').textContent = T.roomH;
  $('copy-link').textContent = T.share;
  $('watch-link').textContent = T.watchLink;
  $('leave-room').textContent = T.leave;
  $('start-room').textContent = T.startRoom;
  $('how-h').textContent = T.howH;
  $('how-list').replaceChildren(...T.howLines.map((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    return li;
  }));
  $('quit').textContent = T.quit;
  $('mode-light').textContent = T.light;
  $('mode-mark').textContent = T.mark;
  $('commit').textContent = T.commit;
}

function shareBase() { return `${location.origin}${location.pathname}`; }
function roomId() { return net?.hosting ? net.id : `flt-${roomUi.code}`; }

function wireButtons() {
  $('start-bot').addEventListener('click', () => { playUi('tap'); startBotMatch(setup.picture, setup.rival); });
  $('create-room').addEventListener('click', () => { playUi('tap'); openRoom(); });
  $('join-form').addEventListener('submit', (e) => {
    e.preventDefault();
    playUi('tap');
    joinRoom($('join-code').value.trim());
  });
  $('leave-room').addEventListener('click', () => { playUi('toggleOff'); leaveToSetup(); });
  $('start-room').addEventListener('click', () => { playUi('tap'); startRoomRound(room.picture ?? setup.picture); });
  $('copy-link').addEventListener('click', () => {
    if (!net?.id) return;
    const link = shareLinkFor(shareBase(), roomId(), {});
    
    shareLink({ link, gameName: 'Lamplighters', code: roomUi.code })
      .then((res) => {
        if (res?.via === 'clipboard') toast(T.copied);
        else if (res?.via === 'manual') toast(res.url, 8000);
      }, () => toast(link, 8000));
  });
  
  $('watch-link').addEventListener('click', () => {
    if (!net?.id) return;
    const link = watchLinkFor(shareBase(), roomId());
    shareLink({ link, gameName: 'Lamplighters', code: roomUi.code, text: fill(T.watchInvite, { game: 'Lamplighters' }) })
      .then((res) => {
        if (res?.via === 'clipboard') toast(T.watchCopied);
        else if (res?.via === 'manual') toast(res.url, 8000);
      }, () => toast(link, 8000));
  });
  $('quit').addEventListener('click', () => { playUi('back'); leaveToSetup(); });
  $('mode-light').addEventListener('click', () => { playUi('toggleOff'); inputMode = 'light'; paint(); });
  $('mode-mark').addEventListener('click', () => { playUi('toggleOn'); inputMode = 'mark'; aimCell = -1; paint(); });
  $('commit').addEventListener('click', () => { if (aimCell >= 0) lightWindow(aimCell); });
  wireBoardInput();
  wireBlockInput();

  let queued = false;
  addEventListener('resize', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; relayout(); });
  });
  
  setInterval(() => {
    if (screen !== 'match') return;
    const now = Date.now();
    for (const [cell, until] of pending) if (now >= until) pending.delete(cell);
    paint();
  }, TICK_MS);
}

fillStaticText();
wireButtons();
show('setup');
drawSetup();
const params = new URLSearchParams(location.search);
const linkRoom = roomFromHref(location.href);
if (linkRoom) {
  joinRoom(linkRoom.code, { watch: linkRoom.role === ROLE.WATCH });
} else if (params.get('picture') && towerById(params.get('picture'))) {
  
  const id = params.get('picture');
  setup.picture = id;
  setup.size = groupOf(towerById(id));
  drawSetup();
  const asked = params.get('state');
  const level = params.get('bot');
  if (LEVELS.includes(level) || CHEAT_STATES.includes(asked)) {
    startBotMatch(id, LEVELS.includes(level) ? level : 'apprentice', CHEAT_STATES.includes(asked) ? asked : null);
  }
}
bootDone();


mountLevelScene({ levels: ['night'], base: './assets/scene' });


globalThis.lamplighters = Object.freeze({
  screen: () => screen,
  mode: () => mode,
  seat: () => mySeat(),
  view: () => view && { ...view, state: [...view.state], owner: [...view.owner] },
  picture: () => picture?.id ?? null,
  layout: () => shape?.layout ?? null,
  aim: () => aimCell,
  marks: () => [...marks],
  pending: () => [...pending.keys()],
  room: () => ({ ...room, seats: [...room.seats], hosting: !!net?.hosting, code: roomUi.code, watchers: net?.watchers ?? 0, id: net?.id ?? null }),
  pictures: () => TOWERS.map((p) => p.id),
  block: () => blockScene,
  cellRect: (i) => {
    if (blockScene) {
      const p = blockScene.roomOnScreen(i);
      const w = blockScene.pxPerRoom();
      return { x: p.x - w / 2 + scrollX, y: p.y - w / 2 + scrollY, w, h: w };
    }
    const r = cellEls[i]?.getBoundingClientRect();
    return r ? { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height } : null;
  },
});
