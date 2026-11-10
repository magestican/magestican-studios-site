


import RAPIER from '../../../web-engine/vendor/rapier-0.14.0/rapier.es.js';
import { Game, DT, mul, conj, normalize } from './game.js';
import { COLLECTIONS, LEVELS, levelsOf, buildSpec } from './levels.js';
import { TREASURE, ROCK, FATIGUE_FROM } from './structure.js';
import { PlateView } from './view.js';
import { stringsFor, fill, count } from './strings.js';
import { createBenchSound } from './sound.js';
import { mountSoundToggle, readMuted, writeMuted } from '../../shared/ui/muteButton.js';
import { applyGameName, gameLang } from '../../../web-engine/i18n/gameNames.js';
import { joinIdFrom, shareLinkFor, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { shareInvite, publicUrlFor } from '../../../web-engine/share/shareInvite.js';
import { createRoomNet, canPlayTogether } from './net.js';
import { createRoomUi, seatLevel, dugStatus, fakeRoom } from './roomUi.js';
import { tell, tellFelt, onBack } from './appBridge.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'fossick.v1';
const lang = gameLang();
const S = stringsFor(lang);
document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
applyGameName('fossick');
const DRAG_RAD_PER_PX = 0.0065;
const TAP_SLOP_PX = 6;            
const KEY_RATE = 0.85;            
const STEADY = 0.25;
const LEVEL_RATE = 0.4;
const MAX_TICKS_PER_FRAME = 4;    
const SHOW_LABEL_AFTER = { won: 1.1, lost: 0 };
const IDLE_TURN = 0.03;           

const params = new URLSearchParams(location.search);
const cheats = {
  level: params.get('level'),
  dug: params.has('dug') ? Number(params.get('dug')) : null,
  tunnel: params.has('tunnel'),   
  win: params.has('win'),
  lose: params.has('lose'),
  drawer: params.get('drawer'),
  rivals: params.has('rivals') ? Number(params.get('rivals')) : null, 
};


const loadSave = () => {
  try { return { best: {}, ...(JSON.parse(localStorage.getItem(SAVE_KEY)) || {}) }; } catch { return { best: {} }; }
};
const save = loadSave();
const writeSave = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {  } };
const GRADE_RANK = { worn: 1, fine: 2, mint: 3 };


const unlockAll = !!cheats.drawer;
const isOpen = (level) => {
  if (unlockAll) return true;
  const list = levelsOf(level.collection);
  const at = list.findIndex((l) => l.id === level.id);
  return at === 0 || !!save.best[list[at - 1].id];
};


let view;
let game = null;
let screen = 'title';
let steadyLever = false;
let tool = 'pick';
let endedAt = 0;
let labelShown = false;
let turnedShow = 0;
const held = new Set();
let levelling = false;
let last = performance.now();
let acc = 0;
let lastPointer = null;
let hoverCheck = 0;
const stats = { tickMs: 0, tickWorst: 0, frameMs: 0, ticks: 0, frames: 0 };
const told = { drag: false, strike: false, strain: false, treasure: false, creak: false };

const toldBasics = () => { if (matchMedia('(hover: hover)').matches) setHint(S.hintKeys, 9000); else setHint(''); };


const seismo = {
  canvas: null, g: null, buf: new Float32Array(600), at: 0,
  
  
  settle: 0,
  push(v) { if (this.settle > 0) { this.settle--; this.buf.fill(v); } this.buf[this.at] = v; this.at = (this.at + 1) % this.buf.length; },
  draw() {
    const c = this.canvas, g = this.g;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(c.clientWidth * dpr), H = Math.round(c.clientHeight * dpr);
    if (!W || !H) return;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    g.clearRect(0, 0, W, H);
    const yOf = (u) => H - 3 * dpr - (Math.min(u, 1.3) / 1.3) * (H - 8 * dpr);
    
    g.strokeStyle = 'rgba(43,28,16,.14)'; g.lineWidth = 1;
    g.beginPath();
    for (let x = W % (24 * dpr); x < W; x += 24 * dpr) { g.moveTo(x, 0); g.lineTo(x, H); }
    g.stroke();
    g.setLineDash([4 * dpr, 3 * dpr]);
    g.strokeStyle = 'rgba(176,23,15,.55)';
    g.beginPath(); g.moveTo(0, yOf(FATIGUE_FROM)); g.lineTo(W, yOf(FATIGUE_FROM)); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = 'rgba(176,23,15,.9)';
    g.beginPath(); g.moveTo(0, yOf(1)); g.lineTo(W, yOf(1)); g.stroke();
    
    const n = this.buf.length, step = dpr * 1.3, count = Math.min(n, Math.ceil(W / step));
    const line = (colour, test) => {
      g.strokeStyle = colour; g.lineWidth = 1.5 * dpr; g.lineJoin = 'round';
      g.beginPath();
      let pen = false;
      for (let k = 0; k < count; k++) {
        const v = this.buf[(this.at - 1 - k + n * 2) % n];
        const x = W - k * step;
        if (!test(v)) { pen = false; continue; }
        if (pen) g.lineTo(x, yOf(v)); else g.moveTo(x, yOf(v));
        pen = true;
      }
      g.stroke();
    };
    line('#2b1c10', (v) => v <= FATIGUE_FROM + 0.02);
    line('#b0170f', (v) => v > FATIGUE_FROM - 0.02);
  },
};


const show = (name) => {
  screen = name;
  $('title').hidden = name !== 'title';
  $('cabinet').hidden = name !== 'cabinet';
  $('lobby').hidden = name !== 'lobby';
  $('hud').hidden = name !== 'bench';
  $('plate').classList.toggle('off', name === 'cabinet' || name === 'lobby');
  $('plate').style.pointerEvents = name === 'bench' ? 'auto' : 'none';
  if (name === 'cabinet' || name === 'lobby') endGame();
  requestAnimationFrame(reframe);
  tell('screen', { screen: name });
};

function reframe() {
  const el = screen === 'title' ? $('title-stage') : $('stage');
  const r = el.getBoundingClientRect();
  
  const cap = screen === 'title' ? 0 : $('h-hint').offsetHeight + 12;
  view.setStage({ x: r.left, y: r.top, w: Math.max(40, r.width), h: Math.max(40, r.height - cap) });
}

function endGame() {
  if (game) { view.clearGame(); game.free(); game = null; }
}

const startGame = (level, opts = {}) => {
  endGame();
  game = new Game(RAPIER, level, { mobile: view.coarse });
  view.setGame(game);
  turnedShow = 0;
  endedAt = 0;
  labelShown = false;
  levelling = false;
  view.zoomGoal = view.zoom = 1;
  view.fit = null;
  if (opts.title) { show('title'); reframe(); view.fit = { ...view.fitGoal }; return; }
  tool = 'pick';
  $('hud').classList.remove('ended');
  $('result').hidden = true;
  show('bench');
  fillHud();
  reframe();
  view.fit = { ...view.fitGoal };
  applyCheats();
  tell('level_start', { level: level.id, collection: level.collection, survey: !!level.survey, room: inRoom });
  setHint(game.level.survey ? S.drawerNotes.survey : levelsOf(level.collection)[0].id === level.id || !told.drag ? S.hintStart : '');
};


function applyCheats() {
  if (!game) return;
  if (cheats.dug != null) {
    
    const b = game.block, rows = [];
    const treasure = [];
    for (let i = 0; i < b.n; i++) if (b.kind[i] === TREASURE) treasure.push(b.xyz(i));
    for (let i = 0; i < b.n; i++) {
      if (b.kind[i] !== ROCK) continue;
      const [x, y, z] = b.xyz(i);
      let best = 99;
      for (const t of treasure) best = Math.min(best, Math.abs(x - t[0]) + Math.abs(y - t[1]) + Math.abs(z - t[2]));
      rows.push({ i, best: cheats.tunnel ? z : best });
    }
    rows.sort((p, q) => q.best - p.best);
    const count = Math.min(rows.length - 1, Math.floor(rows.length * cheats.dug));
    for (let k = 0; k < count; k++) b.release(rows[k].i);
    b.changed = true;
    game.takeLoose(0);
    game.fallLog = [];
    game.largestFall = 0;
    seismo.settle = 45;
    cheats.dug = null;
  }
  if (cheats.win) {
    cheats.win = false;
    const b = game.block;
    for (let i = 0; i < b.n; i++) if (b.kind[i] === ROCK) b.release(i);
    b.changed = true;
  }
  if (cheats.lose) { cheats.lose = false; game.lose('collapse'); }
}

const SOUND_KEY = 'fossick.muted';
const sound = createBenchSound();

const PICK_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M21.5 13 L8 36 l-3-1.7 L18.4 11.3z" fill="#c9a26a" stroke="#1d1008"/><path d="M6 13C13 3 27 2 36 10c-7-3.6-13-3.9-16-1.7-3.4-.2-9 1.2-14 4.7z" fill="#a9aeb0" stroke="#1d1008"/></svg>`;
const MALLET_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M23.5 15 L10.5 37 l-3-1.7 L20.5 13.3z" fill="#c9a26a" stroke="#1d1008"/><path d="M11 6.5 L27.5 16 L32.5 7.5 L16 -1.5z" transform="translate(0 5)" fill="#8c6a3a" stroke="#1d1008"/></svg>`;

function fillHud() {
  const level = game.level, at = levelsOf(level.collection).findIndex((l) => l.id === level.id) + 1;
  $('h-plate').textContent = fill(S.plate, { n: at });
  $('h-name').textContent = S.names[level.id];
  $('h-left').textContent = count(S.rockLeft, game.block.rockLeft);
  $('h-back').textContent = S.back;
  $('h-lever-name').textContent = S.steady;
  $('h-lever-note').textContent = S.steadyNote;
  $('h-seismo-note').textContent = S.seismoNote;
  const roll = $('h-roll');
  roll.innerHTML = '';
  for (const [id, svg, name, note] of [['pick', PICK_SVG, S.toolPick, S.toolPickNote], ['mallet', MALLET_SVG, S.toolMallet, S.toolMalletNote]]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool';
    b.dataset.tool = id;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(tool === id));
    if (id === 'mallet' && !level.mallet) b.classList.add('absent');
    b.innerHTML = `${svg}<span><b>${name}</b><i>${note}</i></span>`;
    b.addEventListener('click', () => pickTool(id));
    roll.append(b);
  }
  drawSeals();
  seismo.settle = 45;
}

function pickTool(id) {
  if (id === 'mallet' && !game?.level.mallet) return;
  tool = id;
  for (const b of $('h-roll').children) b.setAttribute('aria-checked', String(b.dataset.tool === id));
}

function drawSeals() {
  const el = $('h-seals');
  const cracks = game ? game.cracks : 0;
  el.setAttribute('aria-label', fill(S.sealsLabel, { n: cracks }));
  if (el.children.length !== 3) { el.innerHTML = '<span class="seal"></span><span class="seal"></span><span class="seal"></span>'; }
  [...el.children].forEach((s, k) => s.classList.toggle('broken', k < cracks));
}

let hintTimer = 0;
function setHint(text, ms = 0) {
  $('h-hint').textContent = text;
  clearTimeout(hintTimer);
  if (ms) hintTimer = setTimeout(() => { $('h-hint').textContent = ''; }, ms);
}


function silhouette(level, solved) {
  const spec = buildSpec(level);
  const [nx, ny, nz] = spec.size;
  const c = document.createElement('canvas');
  const N = Math.max(nx, ny) + 2;
  c.width = c.height = N;
  const g = c.getContext('2d');
  const inkOf = (tone) => (!solved ? '#2b1c10' : tone === 1 ? level.accent || level.pigment : tone === 2 ? level.eye || level.pigment : level.pigment);
  const ox = Math.floor((N - nx) / 2), oy = Math.floor((N - ny) / 2);
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    for (let z = 0; z < nz; z++) { const cell = spec.cells(x, y, z); if (cell?.kind !== TREASURE) continue; g.fillStyle = inkOf(cell.tone); g.fillRect(ox + x, N - 1 - (oy + y), 1, 1); break; }
  }
  return c;
}


const collectionNow = () => (COLLECTIONS.some((c) => c.id === save.collection) ? save.collection : COLLECTIONS[0].id);
const drawersNow = () => COLLECTIONS.find((c) => c.id === collectionNow()).drawers;

function buildThemes() {
  const host = $('c-themes');
  host.innerHTML = '';
  for (const c of COLLECTIONS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme-cube';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(c.id === collectionNow()));
    b.dataset.collection = c.id;
    b.textContent = S.collections[c.id];
    b.addEventListener('click', () => {
      if (c.id === collectionNow()) return;
      save.collection = c.id;
      writeSave();
      sound.play('drawer');
      buildCabinet();
    });
    host.append(b);
  }
}

function buildCabinet(openId) {
  const root = $('drawers');
  root.innerHTML = '';
  buildThemes();
  for (const d of drawersNow()) {
    const opened = d.levels.some((l) => isOpen(LEVELS.find((L) => L.id === l.id)));
    const done = d.levels.filter((l) => save.best[l.id]).length;
    const el = document.createElement('div');
    el.className = 'drawer';
    el.dataset.drawer = d.id;
    const face = document.createElement('button');
    face.type = 'button';
    face.className = 'drawer-face';
    face.disabled = !opened;
    face.setAttribute('aria-expanded', 'false');
    face.innerHTML = `<span class="card-holder"><b>${S.drawers[d.id]}</b><i>${opened ? S.drawerNotes[d.id] : S.locked}</i></span><span class="drawer-tally">${done}/3</span><span class="pull" aria-hidden="true"></span>`;
    face.addEventListener('click', () => toggleDrawer(el));
    const body = document.createElement('div');
    body.className = 'drawer-body';
    const tray = document.createElement('div');
    tray.className = 'drawer-tray';
    const grid = document.createElement('div');
    grid.className = 'specimens';
    for (const level of d.levels.map((l) => LEVELS.find((L) => L.id === l.id))) {
      const wrap = document.createElement('div');
      wrap.className = 'spec-wrap';
      if (isOpen(level)) {
        const best = save.best[level.id];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'spec-label';
        b.dataset.level = level.id;
        b.append(silhouette(level, !!best));
        b.insertAdjacentHTML('beforeend', `<span class="nm">${S.names[level.id]}</span><span class="st">${best ? '' : S.unsolved}</span>`);
        if (best) b.insertAdjacentHTML('beforeend', `<span class="spec-stamp ${best}">${S.grades[best]}</span>`);
        b.addEventListener('click', () => startGame(level));
        wrap.append(b);
      } else {
        const blank = document.createElement('div');
        blank.className = 'spec-label blank';
        blank.innerHTML = `<canvas width="1" height="1"></canvas><span class="st">${S.locked}</span>`;
        wrap.append(blank);
      }
      grid.append(wrap);
    }
    tray.append(grid);
    body.append(tray);
    el.append(face, body);
    root.append(el);
  }
  const first = openId || currentDrawer();
  const target = root.querySelector(`[data-drawer="${first}"]`);
  if (target) toggleDrawer(target);
}


function nextToDig() {
  const listed = drawersNow().flatMap((d) => d.levels).map((l) => LEVELS.find((L) => L.id === l.id));
  return listed.find((l) => !save.best[l.id] && isOpen(l)) || listed[0];
}


function currentDrawer() {
  const drawers = drawersNow();
  for (const d of drawers) if (d.levels.some((l) => !save.best[l.id] && isOpen(LEVELS.find((L) => L.id === l.id)))) return d.id;
  return drawers[drawers.length - 1].id;
}

function toggleDrawer(el) {
  const was = el.classList.contains('open');
  sound.play('drawer');
  for (const d of $('drawers').children) { d.classList.remove('open'); d.firstChild.setAttribute('aria-expanded', 'false'); }
  if (!was) { el.classList.add('open'); el.firstChild.setAttribute('aria-expanded', 'true'); }
}

function openCabinet(openId) {
  buildCabinet(openId);
  show('cabinet');
}


function showLabel() {
  labelShown = true;
  const level = game.level, won = game.result === 'won';
  const stamp = $('r-stamp');
  const grade = won ? game.grade() : null;
  stamp.className = 'stamp' + (won ? ` ${grade}` : '');
  stamp.textContent = won ? S.grades[grade] : game.reason === 'broken' ? S.broken : S.fallen;
  
  stamp.style.animation = 'none';
  void stamp.offsetWidth;
  stamp.style.animation = '';
  sound.play('stamp');
  tell('level_end', {
    level: level.id, collection: level.collection, result: won ? 'won' : game.reason === 'broken' ? 'broken' : 'fallen',
    grade: grade || '', pokes: game.pokes, cracks: game.cracks, room: inRoom,
  });
  $('r-plate').textContent = fill(S.plate, { n: levelsOf(level.collection).findIndex((l) => l.id === level.id) + 1 });
  $('r-name').textContent = S.names[level.id];
  $('r-line').textContent = won ? fill(S.labelWon, { name: S.names[level.id] }) : game.reason === 'broken' ? S.labelBroken : S.labelCollapse;
  $('r-stats').textContent = [count(S.statBlows, game.pokes), count(S.statCracks, game.cracks), count(S.statFell, game.largestFall)].join(' \u00b7 ');
  if (won) {
    const had = save.best[level.id];
    if (!had || GRADE_RANK[grade] > GRADE_RANK[had]) { save.best[level.id] = grade; writeSave(); }
  }
  const list = levelsOf(level.collection);
  const nextLevel = list[list.findIndex((l) => l.id === level.id) + 1];
  const next = $('r-next');
  next.hidden = !(won && nextLevel);
  $('r-again').hidden = false;
  $('r-wait').hidden = true;
  $('r-again').textContent = S.again;
  next.textContent = S.next;
  $('r-cabinet').textContent = S.toCabinet;
  if (won && !nextLevel) $('r-line').textContent = S.complete;
  $('hud').classList.add('ended');
  $('result').hidden = false;
  $('r-next').onclick = () => startGame(nextLevel);
  $('r-again').onclick = () => startGame(level);
  $('r-cabinet').onclick = () => openCabinet(level.drawer);
  if (inRoom) roomLabel();
  requestAnimationFrame(reframe);
}


let net = null;
let inRoom = false;
let room = null;
let roomAt = 0;
let playedRound = 0;
let joinCode = null;
let roomUi = null;

const levelById = (id) => LEVELS.find((l) => l.id === id);

function setRoomClass(on) {
  
  $('hud').classList.toggle('in-room', on);
  $('rivals').hidden = !on;
}

function drawTitleButtons() {
  const can = canPlayTogether();
  $('t-open').textContent = joinCode ? S.roomJoinStart : S.open;
  $('t-room').textContent = S.roomOpen;
  $('t-room').hidden = !can || !!joinCode;
}


function forgetJoinLink() {
  if (!joinCode) return;
  joinCode = null;
  const url = new URL(location.href);
  url.searchParams.delete('join');
  history.replaceState(null, '', url);
  drawTitleButtons();
}

function lobbyMessage(line, note = '') {
  $('l-line').textContent = line;
  $('l-note').textContent = note;
}

function drawLobby() {
  const hosting = !!net?.hosting;
  const code = net?.active && hosting ? net.code : null;
  $('l-code-row').hidden = !code;
  $('l-code').textContent = code ?? '';
  $('l-start').hidden = !(code && room);
  
  $('l-join-fold').hidden = !!net?.active && !hosting;
  const you = room?.you;
  $('l-you').hidden = you == null;
  if (you != null) {
    const words = document.createElement('span');
    words.textContent = fill(S.roomYou, { name: S.names[seatLevel(you).id] });
    $('l-you').replaceChildren(roomUi.seatIcon(you), words);
  }
  roomUi.drawSeats($('l-seats'), room?.rows ?? []);
}

function enterLobby(line) {
  inRoom = true;
  room = null;
  playedRound = 0;
  roomUi.clearBox();
  setRoomClass(true);
  lobbyMessage(line);
  $('l-code-in').value = '';
  $('l-join-fold').open = false;
  show('lobby');
  drawLobby();
}

function hostRoom() {
  net.leave();
  enterLobby(S.roomOpening);
  net.host();
  tell('room', { action: 'host' });
}

function joinRoom(typed) {
  net.leave();
  enterLobby(S.roomJoining);
  
  if (net.join(typed).error) failedRoom(S.roomBadCode);
  else { drawLobby(); tell('room', { action: 'join' }); }
}

function leaveRoom() {
  net?.leave();
  inRoom = false;
  room = null;
  playedRound = 0;
  roomUi.clearBox();
  setRoomClass(false);
  forgetJoinLink();
  startGame(LEVELS[0], { title: true });
}

function playRound(round) {
  playedRound = round.n;
  startGame(levelById(round.level));
  net.report();
}


function hostNext() {
  const list = levelsOf(game.level.collection);
  const at = list.findIndex((l) => l.id === game.level.id);
  net.startRound(list[(at + 1) % list.length].id);
  playRound(net.round);
}


function roomLabel() {
  const hosting = net.hosting;
  const closed = net.closed;
  const newer = !!net.round && net.round.n > playedRound;
  const next = $('r-next');
  $('r-again').hidden = true;
  $('r-cabinet').textContent = S.roomLeave;
  $('r-cabinet').onclick = leaveRoom;
  next.textContent = S.next;
  next.hidden = closed || !(hosting || newer);
  next.onclick = hosting ? hostNext : () => playRound(net.round);
  $('r-wait').textContent = S.roomNextWait;
  $('r-wait').hidden = hosting || closed || newer;
}

function onRoom(r) {
  room = r;
  roomAt = performance.now();
  if (screen === 'lobby') {
    
    if (r.round && r.round.n > playedRound) playRound(r.round);
    else { drawLobby(); return; }
  }
  roomUi.drawBox(room, 0, net.closed);
  
  if (screen === 'bench' && labelShown) roomLabel();
}

function failedRoom(line) {
  net.leave();
  room = null;
  forgetJoinLink();
  lobbyMessage(line);
  drawLobby();
  
  $('l-join-fold').open = true;
}

function onRoomStatus(kind) {
  if (!inRoom) return;
  if (kind === 'open') { lobbyMessage(S.roomInvite); drawLobby(); }
  else if (kind === 'joined') lobbyMessage(S.roomWait);
  else if (kind === 'full') failedRoom(S.roomFull);
  else if (kind === 'failed') failedRoom(S.roomFailed);
  
  else if (kind === 'trouble' && screen === 'lobby' && !room) failedRoom(S.roomFailed);
  else if (kind === 'closed') {
    if (screen === 'lobby') { failedRoom(S.roomHostGone); return; }
    setHint(S.roomClosed, 6000);
    roomUi.drawBox(room, performance.now() - roomAt, true);
    if (labelShown) roomLabel();
  }
}

async function shareRoom() {
  const link = shareLinkFor(location.origin + location.pathname, net.code);
  
  
  
  
  const { via } = await shareInvite({ url: publicUrlFor(link) });
  tell('share', { via });
  if (via === 'clipboard') $('l-note').textContent = S.roomCopied;
  else if (via === 'manual') $('l-note').textContent = link;
}

function wireRoom() {
  roomUi = createRoomUi({ S, silhouette, box: $('rivals') });
  $('rivals').setAttribute('aria-label', S.roomBox);
  $('l-title').textContent = S.roomTitle;
  $('l-code-label').textContent = S.roomCode;
  $('l-share').textContent = S.roomShare;
  $('l-start').textContent = S.open;
  $('l-join-label').textContent = S.roomHave;
  $('l-join-go').textContent = S.roomJoin;
  $('l-leave').textContent = S.roomLeave;
  if (canPlayTogether()) {
    net = createRoomNet({
      status: () => dugStatus(game, playedRound, screen === 'bench'),
      isLevel: (id) => !!levelById(id),
      onRoom,
      onStatus: onRoomStatus,
    });
    joinCode = joinIdFrom(location.href);
  }
  drawTitleButtons();
  $('t-room').addEventListener('click', hostRoom);
  $('l-start').addEventListener('click', () => net.startRound(nextToDig().id));
  $('l-share').addEventListener('click', shareRoom);
  $('l-leave').addEventListener('click', leaveRoom);
  $('l-join').addEventListener('submit', (e) => {
    e.preventDefault();
    const typed = $('l-code-in').value;
    
    if (!normaliseCode(typed, GAME_PREFIX.fossick)) { $('l-note').textContent = S.roomBadCode; return; }
    joinRoom(typed);
  });
  
  setInterval(() => {
    if (inRoom && room && screen === 'bench') roomUi.drawBox(room, performance.now() - roomAt, net.closed);
  }, 1000);
}


const pointers = new Map();
let press = null;
let pinch = null;

const steadyNow = () => steadyLever || held.has('Shift');

function canvasDown(e) {
  if (screen !== 'bench' || !game) return;
  $('plate').setPointerCapture?.(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = Math.hypot(a.x - b.x, a.y - b.y);
    press = null;            
    return;
  }
  press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false };
  levelling = false;
}

function canvasMove(e) {
  lastPointer = { x: e.clientX, y: e.clientY };
  if (screen !== 'bench' || !game) return;
  const p = pointers.get(e.pointerId);
  if (p) { p.x = e.clientX; p.y = e.clientY; }
  if (pointers.size >= 2 && pinch) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch > 0) view.addZoom(d / pinch);
    pinch = d;
    return;
  }
  if (!press || press.id !== e.pointerId) { refreshHover(); return; }
  if (!press.moved && Math.hypot(e.clientX - press.x0, e.clientY - press.y0) > TAP_SLOP_PX) {
    press.moved = true;
    view.setHover(null);
    $('plate').style.cursor = 'grabbing';
  }
  if (press.moved) {
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    turnByDrag(dx, dy);
    if (!told.drag && Math.hypot(e.clientX - press.x0, e.clientY - press.y0) > 40) { told.drag = true; if (told.strike) toldBasics(); }
  }
  press.x = e.clientX; press.y = e.clientY;
}

function turnByDrag(dx, dy) {
  const { right, up } = view.axes();
  const k = DRAG_RAD_PER_PX * (steadyNow() ? STEADY : 1);
  if (dx) game.turn(up, dx * k);
  if (dy) game.turn(right, dy * k);
}

function canvasUp(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (!press || press.id !== e.pointerId) return;
  const p = press;
  press = null;
  $('plate').style.cursor = '';
  if (e.type === 'pointerup' && !p.moved) strikeAt(e.clientX, e.clientY);
  refreshHover();
}

function strikeAt(x, y) {
  if (!game || game.state !== 'play') return;
  const hit = view.pickAt(x, y);
  if (!hit) return;
  const r = game.strike(hit.i, tool, hit.normal);
  if (!r) return;
  if (!told.strike) { told.strike = true; if (told.drag) toldBasics(); }
  if (r === 'treasure' && !told.treasure) { told.treasure = true; setHint(S.hintTreasure, 6000); }
}

function refreshHover() {
  if (!game || screen !== 'bench' || !lastPointer || press?.moved || game.state !== 'play') { if (view) view.setHover(null); return; }
  if (view.coarse) return;
  const hit = view.pickAt(lastPointer.x, lastPointer.y);
  view.setHover(hit ? hit.i : null);
  view.hoverHit = hit;
  const plate = $('plate');
  if (!hit) { plate.style.cursor = 'grab'; return; }
  plate.style.cursor = game.block.kind[hit.i] === TREASURE ? 'not-allowed' : pickCursor;
}


const pickCursor = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M2 26 L15 11" stroke="#2b1c10" stroke-width="3.2"/><path d="M2 26 L15 11" stroke="#c9a26a" stroke-width="1.4"/><path d="M6 6c6-4 12-3 19 3-5-2-8-1-10 1-3 0-6 0-9-4z" fill="#a9aeb0" stroke="#2b1c10"/></svg>')}") 3 25, crosshair`;

const KEY_TURN = {
  ArrowLeft: ['up', -1], a: ['up', -1], ArrowRight: ['up', 1], d: ['up', 1],
  ArrowUp: ['right', -1], w: ['right', -1], ArrowDown: ['right', 1], s: ['right', 1],
  q: ['back', 1], e: ['back', -1],
};
const normKey = (e) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

addEventListener('keydown', (e) => {
  if (screen !== 'bench' || !game) return;
  const k = normKey(e);
  held.add(k);
  if (KEY_TURN[k]) { levelling = false; e.preventDefault(); }
  if (e.repeat) return;
  if (k === ' ') {
    
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    e.preventDefault();
    if (lastPointer) strikeAt(lastPointer.x, lastPointer.y);
  }
  if (k === '1') pickTool('pick');
  if (k === '2') pickTool('mallet');
  if (k === 'r') levelling = true;
});
addEventListener('keyup', (e) => held.delete(normKey(e)));
addEventListener('blur', () => held.clear());

function applyKeys(dt) {
  if (!game || screen !== 'bench') return;
  const rate = KEY_RATE * (steadyNow() ? STEADY : 1) * dt;
  const axes = view.axes();
  for (const k of held) {
    const t = KEY_TURN[k];
    if (t) game.turn(axes[t[0]], t[1] * rate);
  }
  if (levelling) {
    
    const q = mul([0, 0, 0, 1], conj(game.qT));
    const s = q[3] < 0 ? -1 : 1;
    const v = [q[0] * s, q[1] * s, q[2] * s];
    const len = Math.hypot(v[0], v[1], v[2]);
    const angle = 2 * Math.atan2(len, q[3] * s);
    if (angle < 0.002) { levelling = false; game.qT = normalize([0, 0, 0, 1]); return; }
    game.turn(v, Math.min(angle, LEVEL_RATE * (steadyNow() ? STEADY : 1) * dt));
  }
}


function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (screen === 'cabinet' || screen === 'lobby' || !game) return;
  const t0 = performance.now();

  if (screen === 'title') game.turn([0, 1, 0], IDLE_TURN * dt);
  applyKeys(dt);

  acc += dt;
  let ticks = 0;
  const tickStart = performance.now();
  while (acc >= DT && ticks < MAX_TICKS_PER_FRAME) { game.step(); acc -= DT; ticks++; }
  if (ticks === MAX_TICKS_PER_FRAME) acc = 0;
  if (ticks) {
    const per = (performance.now() - tickStart) / ticks;
    stats.tickMs += (per - stats.tickMs) * 0.05;
    if (per > stats.tickWorst) stats.tickWorst = per;
    stats.ticks += ticks;
  }

  const ev = game.drain();
  view.handle(ev);

  if (screen === 'bench') {
    sound.events(ev);
    tellFelt(ev);
    for (const e of ev) {
      if (e.type === 'crack') drawSeals();
      
      if (e.type === 'creak' && !told.creak && game.state === 'play') { told.creak = true; setHint(S.hintCreak, 6000); }
    }
    $('h-left').textContent = count(S.rockLeft, game.block.rockLeft);
    seismo.push(game.state === 'play' ? game.tremor + Math.min(0.05, Math.hypot(...game.w) * 0.02) * Math.sin(now * 0.09) : 0);
    seismo.draw();
    if (!told.strain && view.worstRed > FATIGUE_FROM && game.state === 'play') { told.strain = true; setHint(S.hintStrain, 8000); }
    hoverCheck += dt;
    if (hoverCheck > 0.12) { hoverCheck = 0; refreshHover(); }

    if ((game.state === 'freed' || game.state === 'done' || game.state === 'fallen') && !endedAt) {
      endedAt = now;
      view.setGhost(0);
      view.setHover(null);
      if (inRoom) net.report(); 
    }
    if (game.state === 'done' && !labelShown) {
      
      const wait = SHOW_LABEL_AFTER[game.result];
      if ((now - endedAt) / 1000 >= wait) showLabel();
    }
    if (endedAt && game.result === 'won' && turnedShow < Math.PI * 2) {
      const a = Math.min(Math.PI * 2 - turnedShow, 0.9 * dt);
      game.turn([0, 1, 0], a);
      turnedShow += a;
    }
  }
  view.frame(dt);
  const spent = performance.now() - t0;
  stats.frameMs += (spent - stats.frameMs) * 0.05;
  stats.frames++;
}

async function boot() {
  await RAPIER.init();
  
  try { await document.fonts.load('52px "IM Fell English"'); } catch {  }
  view = new PlateView($('plate'));
  seismo.canvas = $('seismo');
  seismo.g = seismo.canvas.getContext('2d');

  
  const letters = [...S.title];
  const tTitle = $('t-title');
  tTitle.setAttribute('aria-label', S.title);
  tTitle.style.setProperty('--letters', letters.length);
  tTitle.innerHTML = letters.map((ch) => `<span class="letter" aria-hidden="true">${ch}</span>`).join('');
  $('t-sub').textContent = S.titleSub;
  $('t-blurb').textContent = S.titleBlurb;
  $('t-imprint').textContent = S.imprint;
  wireRoom();
  $('c-title').textContent = S.cabinet;
  $('c-sub').textContent = S.cabinetSub;
  $('c-home').textContent = S.home;
  
  for (const [host, prepend] of [[$('c-sound'), false], [$('stage'), false]]) {
    mountSoundToggle({
      host, prepend, className: 'sound-switch',
      isMuted: () => readMuted(SOUND_KEY),
      setMuted: (m) => writeMuted(SOUND_KEY, m),
      label: (m) => (m ? S.soundOff : S.soundOn),
      describe: (m) => (m ? S.soundOff : S.soundOn),
    });
  }
  
  
  $('t-open').addEventListener('click', () => (joinCode ? joinRoom(joinCode) : startGame(nextToDig())));
  $('h-back').addEventListener('click', () => (inRoom ? leaveRoom() : openCabinet(game?.level.drawer)));
  
  
  onBack(() => {
    if (screen === 'bench') { $('h-back').click(); return true; }
    if (screen === 'lobby') { leaveRoom(); return true; }
    if (screen === 'cabinet') { startGame(LEVELS[0], { title: true }); return true; }
    return false;
  });
  $('h-lever').addEventListener('click', () => {
    steadyLever = !steadyLever;
    $('h-lever').setAttribute('aria-pressed', String(steadyLever));
  });
  const plate = $('plate');
  plate.addEventListener('pointerdown', canvasDown);
  plate.addEventListener('pointermove', canvasMove);
  plate.addEventListener('pointerup', canvasUp);
  plate.addEventListener('pointercancel', canvasUp);
  plate.addEventListener('wheel', (e) => { e.preventDefault(); view.addZoom(Math.exp(-e.deltaY * 0.0012)); }, { passive: false });
  addEventListener('resize', () => requestAnimationFrame(reframe));

  
  window.__fossick = { get game() { return game; }, get view() { return view; }, stats, get screen() { return screen; }, get room() { return room; }, get net() { return net; } };

  if (cheats.rivals != null) {
    setRoomClass(true);
    roomUi.drawBox(fakeRoom(cheats.rivals), 0, false);
  }
  if (params.has('collection')) save.collection = params.get('collection');
  if (cheats.drawer && drawersNow().some((d) => d.id === cheats.drawer)) openCabinet(cheats.drawer);
  else if (cheats.level || cheats.win || cheats.lose || cheats.dug != null) {
    startGame(LEVELS.find((l) => l.id === cheats.level) || LEVELS[0]);
  } else startGame(LEVELS[0], { title: true });

  last = performance.now();
  requestAnimationFrame(frame);
}

boot().catch((err) => { console.error(err); document.body.append(String(err)); });
