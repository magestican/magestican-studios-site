


import RAPIER from '../../../web-engine/vendor/rapier-0.14.0/rapier.es.js';
import { Game, DT, mul, conj, normalize } from './game.js';
import { DRAWERS, LEVELS, buildSpec } from './levels.js';
import { TREASURE, ROCK, FATIGUE_FROM } from './structure.js';
import { PlateView } from './view.js';
import { stringsFor, fill, count } from './strings.js';
import { createBenchSound } from './sound.js';
import { mountSoundToggle, readMuted, writeMuted } from '../../shared/ui/muteButton.js';
import { applyGameName, gameLang } from '../../../web-engine/i18n/gameNames.js';

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
  const at = LEVELS.findIndex((l) => l.id === level.id);
  return at === 0 || !!save.best[LEVELS[at - 1].id];
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
  $('hud').hidden = name !== 'bench';
  $('plate').classList.toggle('off', name === 'cabinet');
  $('plate').style.pointerEvents = name === 'bench' ? 'auto' : 'none';
  if (name === 'cabinet') endGame();
  requestAnimationFrame(reframe);
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
  setHint(game.level.survey ? S.drawerNotes.survey : level.id === 'cockle' || !told.drag ? S.hintStart : '');
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
  const level = game.level, at = LEVELS.findIndex((l) => l.id === level.id) + 1;
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
  g.fillStyle = solved ? level.pigment : '#2b1c10';
  const ox = Math.floor((N - nx) / 2), oy = Math.floor((N - ny) / 2);
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    for (let z = 0; z < nz; z++) if (spec.cells(x, y, z)?.kind === TREASURE) { g.fillRect(ox + x, N - 1 - (oy + y), 1, 1); break; }
  }
  return c;
}

function buildCabinet(openId) {
  const root = $('drawers');
  root.innerHTML = '';
  for (const d of DRAWERS) {
    const opened = d.levels.some((l) => isOpen(l));
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


function currentDrawer() {
  for (const d of DRAWERS) if (d.levels.some((l) => !save.best[l.id] && isOpen(l))) return d.id;
  return DRAWERS[DRAWERS.length - 1].id;
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
  $('r-plate').textContent = fill(S.plate, { n: LEVELS.findIndex((l) => l.id === level.id) + 1 });
  $('r-name').textContent = S.names[level.id];
  $('r-line').textContent = won ? fill(S.labelWon, { name: S.names[level.id] }) : game.reason === 'broken' ? S.labelBroken : S.labelCollapse;
  $('r-stats').textContent = [count(S.statBlows, game.pokes), count(S.statCracks, game.cracks), count(S.statFell, game.largestFall)].join(' \u00b7 ');
  if (won) {
    const had = save.best[level.id];
    if (!had || GRADE_RANK[grade] > GRADE_RANK[had]) { save.best[level.id] = grade; writeSave(); }
  }
  const at = LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = LEVELS[at + 1];
  const next = $('r-next');
  next.hidden = !(won && nextLevel);
  $('r-again').textContent = S.again;
  next.textContent = S.next;
  $('r-cabinet').textContent = S.toCabinet;
  if (won && !nextLevel) $('r-line').textContent = S.complete;
  $('hud').classList.add('ended');
  $('result').hidden = false;
  $('r-next').onclick = () => startGame(nextLevel);
  $('r-again').onclick = () => startGame(level);
  $('r-cabinet').onclick = () => openCabinet(level.drawer);
  requestAnimationFrame(reframe);
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
  if (screen === 'cabinet' || !game) return;
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

    if ((game.state === 'freed' || game.state === 'done' || game.state === 'fallen') && !endedAt) { endedAt = now; view.setGhost(0); view.setHover(null); }
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

  $('t-title').textContent = S.title;
  $('t-sub').textContent = S.titleSub;
  $('t-blurb').textContent = S.titleBlurb;
  $('t-imprint').textContent = S.imprint;
  $('t-open').textContent = S.open;
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
  $('t-open').addEventListener('click', () => openCabinet());
  $('h-back').addEventListener('click', () => openCabinet(game?.level.drawer));
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

  
  window.__fossick = { get game() { return game; }, get view() { return view; }, stats, get screen() { return screen; } };

  if (cheats.drawer && DRAWERS.some((d) => d.id === cheats.drawer)) openCabinet(cheats.drawer);
  else if (cheats.level || cheats.win || cheats.lose || cheats.dug != null) {
    startGame(LEVELS.find((l) => l.id === cheats.level) || LEVELS[0]);
  } else startGame(LEVELS[0], { title: true });

  last = performance.now();
  requestAnimationFrame(frame);
}

boot().catch((err) => { console.error(err); document.body.append(String(err)); });
