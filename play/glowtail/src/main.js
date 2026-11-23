






import { createState, enqueue, step, tickMs, enterNextDepth } from './sim.js';
import { DEPTHS } from './depths.js';
import { createRenderer } from './render.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { uiSoundOn, setUiSound } from '../../../web-engine/brand/uiSound.js';
import { SFX_TAKES, MENU_CUES, MUSIC_TRACKS, cuesFor, trackFor, followSound } from './sound.js';



const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), Object.keys(SFX_TAKES), SFX_TAKES);
const ui = createGameSfx(new URL('../assets/ui/', import.meta.url), MENU_CUES);
const music = createTrackMusic({ game: 'glowtail', manifestUrl: new URL('../assets/music/music.json', import.meta.url), trackIds: MUSIC_TRACKS });

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const view = createRenderer(canvas, { search: location.search });

const BEST_KEY = 'glowtail.best.v1';
const best = (() => { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; } catch { return {}; } })();
const saveBest = () => { try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch {  } };

let mode = params.get('mode') === 'classic' ? 'classic' : 'dive';
let gentle = params.get('gentle') === '1' || best.gentle === true;
let state = newState();
let running = false;
let paused = false;
let acc = 0;
let timeScale = 1, slowUntil = 0;
let descendAt = 0;

function newState() {
  const depth = Math.max(0, Math.min(DEPTHS.length - 1, (parseInt(params.get('depth'), 10) || 1) - 1));
  const seed = parseInt(params.get('seed'), 10) || Math.floor(Math.random() * 1e9);
  return createState({ mode, depth, seed, gentle });
}


const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
addEventListener('keydown', (e) => {
  if (KEYS[e.code]) {
    e.preventDefault();
    if (running && !paused) enqueue(state, KEYS[e.code]);
    else if (!running && !$('title').hidden && e.code.startsWith('Arrow')) {  }
    return;
  }
  if (e.code === 'Space' || e.code === 'Enter') {
    if (!$('title').hidden) { e.preventDefault(); start(); } else if (!$('over').hidden) { e.preventDefault(); start(); }
  }
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
});


let touch = null;
const SWIPE_PX = 22;
canvas.addEventListener('pointerdown', (e) => { touch = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
canvas.addEventListener('pointermove', (e) => {
  if (!touch || e.pointerId !== touch.id || !running || paused) return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  enqueue(state, dir);
  touch.x = e.clientX; touch.y = e.clientY;
});
const endTouch = () => { touch = null; };
canvas.addEventListener('pointerup', endTouch);
canvas.addEventListener('pointercancel', endTouch);


let padLast = '';
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p) continue;
    let dir = '';
    const b = (i) => p.buttons[i] && p.buttons[i].pressed;
    if (b(12) || p.axes[1] < -0.6) dir = 'up';
    else if (b(13) || p.axes[1] > 0.6) dir = 'down';
    else if (b(14) || p.axes[0] < -0.6) dir = 'left';
    else if (b(15) || p.axes[0] > 0.6) dir = 'right';
    if (dir && dir !== padLast && running && !paused) enqueue(state, dir);
    padLast = dir;
    if (b(0) && (!$('title').hidden || !$('over').hidden)) start();
    if (b(9)) togglePause();
    return;
  }
}


function show(id) {
  for (const s of ['title', 'over', 'pause']) $(s).hidden = s !== id;
  $('hud').hidden = id === 'title';
}


function syncMusic() {
  const t = trackFor({ running, mode: state.mode, depthIndex: state.depthIndex });
  if (music.track() !== t) music.setTrack(t);
  followSound(music, uiSoundOn());
}
function drawSound() {
  const on = uiSoundOn();
  for (const b of document.querySelectorAll('.soundToggle')) {
    b.textContent = on ? 'Sound on' : 'Sound off';
    b.setAttribute('aria-pressed', String(on));
  }
}
for (const b of document.querySelectorAll('.soundToggle')) {
  b.addEventListener('click', () => {
    setUiSound(!uiSoundOn());
    drawSound();
    ui.play('tap');
    followSound(music, uiSoundOn());
  });
}
drawSound();

for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => syncMusic(), { once: true });

function start() {
  ui.play('start');
  state = newState();
  view.reset();
  view.setDepth(state.depth, true);
  acc = 0; timeScale = 1; descendAt = 0;
  running = true; paused = false;
  show(null);
  banner(state.mode === 'classic' ? 'Classic' : state.depth.name, state.mode === 'classic' ? 'Wrap board - eat, grow, circle' : `Depth ${state.depthIndex + 1} of ${DEPTHS.length}`);
  hud();
  syncMusic();
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  ui.play(paused ? 'pause' : 'resume');
  show(paused ? 'pause' : null);
}

let bannerTimer = 0;
function banner(big, small) {
  $('bannerBig').textContent = big;
  $('bannerSmall').textContent = small || '';
  $('banner').classList.remove('on');
  void $('banner').offsetWidth;
  $('banner').classList.add('on');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => $('banner').classList.remove('on'), 2200);
}

function popup(text, kind) {
  const el = document.createElement('div');
  el.className = `pop ${kind || ''}`;
  el.textContent = text;
  $('pops').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function hud() {
  $('score').textContent = state.score.toLocaleString();
  const key = mode;
  $('best').textContent = `Best ${(best[key] || 0).toLocaleString()}`;
  if (state.mode === 'classic') {
    $('depth').textContent = `Classic - length ${state.snake.length}`;
    $('quota').style.setProperty('--fill', '0');
    $('quotaWrap').hidden = true;
  } else {
    $('quotaWrap').hidden = false;
    $('depth').textContent = `${state.depthIndex + 1}. ${state.depth.name}`;
    $('quota').style.setProperty('--fill', String(Math.min(1, state.eatenInDepth / state.depth.quota)));
    $('quotaText').textContent = `${Math.min(state.eatenInDepth, state.depth.quota)} / ${state.depth.quota}`;
  }
}

function vibrate(ms) { if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(ms); }

function handle(events) {
  if (!events.length) return;
  view.onEvents(events, state);
  for (const cue of cuesFor(events)) sfx.play(cue);
  for (const e of events) {
    if (e.type === 'bite') { popup(`+${e.points}`); vibrate(12); }
    if (e.type === 'encircle') {
      popup(e.count > 1 ? `CIRCLED x${e.count}  +${e.points.toLocaleString()}` : `CIRCLED  +${e.points}`, 'big');
      timeScale = 0.3; slowUntil = performance.now() + 450; 
      vibrate([20, 40, 30]);
    }
    if (e.type === 'shoal' && e.first) {
      view.showGhostLoop(e.centre);
      banner('A shoal!', 'Circle it with your body to catch them all');
    }
    if (e.type === 'descend') {
      descendAt = performance.now() + 2400;
      const next = DEPTHS[e.to];
      setTimeout(() => view.setDepth(next), 600);
      banner('Diving deeper', next.name);
    }
    if (e.type === 'surface') finish(true);
    if (e.type === 'death') { vibrate([40, 60, 80]); setTimeout(() => finish(false), 1300); }
  }
  hud();
}

function finish(won) {
  running = false;
  const key = mode;
  const isBest = state.score > (best[key] || 0);
  if (isBest) { best[key] = state.score; saveBest(); }
  $('overTitle').textContent = won ? 'You reached the surface!' : 'Lights out';
  $('overScore').textContent = state.score.toLocaleString();
  $('overBest').textContent = isBest ? 'New best!' : `Best ${(best[key] || 0).toLocaleString()}`;
  $('overDepth').textContent = state.mode === 'classic'
    ? `Length ${state.snake.length}`
    : `Reached ${state.depth.name} (depth ${state.depthIndex + 1} of ${DEPTHS.length})`;
  $('overChain').textContent = state.bestChain > 1 ? `Biggest circle: ${state.bestChain} at once` : 'Tip: circle a shoal with your body to catch it all at once';
  setTimeout(() => { show('over'); syncMusic(); }, won ? 2600 : 0);
  hud();
}


for (const b of document.querySelectorAll('[data-mode]')) {
  b.addEventListener('click', () => { mode = b.dataset.mode; start(); });
}
$('again').addEventListener('click', start);
$('menu').addEventListener('click', () => { ui.play('back'); running = false; show('title'); syncGentle(); syncMusic(); });
$('resume').addEventListener('click', togglePause);
$('pauseBtn').addEventListener('click', togglePause);
function syncGentle() { $('gentle').setAttribute('aria-pressed', String(gentle)); $('gentle').textContent = gentle ? 'Gentle speed: on' : 'Gentle speed: off'; }
$('gentle').addEventListener('click', () => { ui.play('tap'); gentle = !gentle; best.gentle = gentle; saveBest(); syncGentle(); });
syncGentle();
addEventListener('blur', () => { if (running && !paused) togglePause(); });
addEventListener('resize', () => view.resize());


view.setDepth(state.depth, true);
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dtReal = Math.min(0.05, (now - last) / 1000);
  last = now;
  pollPad();
  if (timeScale < 1 && now > slowUntil) timeScale = Math.min(1, timeScale + 0.08);
  const dt = dtReal * timeScale;
  if (running && !paused) {
    if (state.phase === 'play') {
      acc += dt * 1000;
      let guard = 0;
      while (acc >= tickMs(state) && state.phase === 'play' && guard++ < 4) {
        acc -= tickMs(state);
        handle(step(state));
      }
    } else if (state.phase === 'descend' && descendAt && now >= descendAt) {
      enterNextDepth(state);
      descendAt = 0; acc = 0;
      banner(state.depth.name, `Depth ${state.depthIndex + 1} of ${DEPTHS.length}`);
      hud();
      syncMusic();
    }
  }
  const alpha = state.phase === 'play' ? Math.min(1, acc / tickMs(state)) : 1;
  view.frame(state, alpha, paused ? 0 : dt, { idle: !running });
  view.measure(dtReal);
}
requestAnimationFrame(loop);

show('title');
if (params.get('autostart') === '1') start();

window.__glowtail = { get state() { return state; }, start };
