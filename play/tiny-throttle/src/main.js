






import { TRACKS, TRACK_ORDER } from './tracks/index.js';
import { createRace, stepRace, standings, PHASE } from './race.js';
import { loadModels, createView, LIVERIES } from './render.js';
import { minimapModel, drawMinimap, wetRuns } from './minimap.js';
import { minimapSize } from '../../../web-engine/kart/minimap.js';
import { PICKUPS } from '../../../web-engine/rc/pickups.js';
import { formatTime, ordinal } from '../../../web-engine/kart/raceProgress.js';
import { countdownText } from '../../../web-engine/kart/raceFlow.js';
import { createTouchSteer } from './touchSteer.js';
import { SIM_SCALE } from '../../../web-engine/rc/rcTuning.js';
import { MOTION, screenTimes, BACK, focusStep, loadSettings, saveSettings, recordBest } from './menus.js';

const q = new URLSearchParams(location.search);

let def = TRACKS[q.get('track') ?? 'H1'] ?? TRACKS.H1;
const lapsFor = (d) => clampInt(q.get('laps'), 1, 9, d.laps);
const opts = {
  laps: lapsFor(def),
  bots: clampInt(q.get('bots'), 0, 11, 11),
  cam: q.get('cam') === 'top' ? 'top' : 'chase',
  auto: q.get('auto') === '1',
};
function clampInt(v, lo, hi, dflt) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
}

const $ = (id) => document.getElementById(id);



function safeStorage() { try { return window.localStorage; } catch { return null; } }
const settings = loadSettings(safeStorage());
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;


let screen = 'title';
let paused = false;


function showScreen(el) {
  clearTimeout(el._tt);
  el.hidden = false;
  el.classList.remove('leave', 'enter');
  [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
  void el.offsetWidth; 
  el.classList.add('enter');
  const t = screenTimes(reduced());
  el._tt = setTimeout(() => el.classList.remove('enter'), t.enter + MOTION.staggerMs * el.children.length + 40);
}
function hideScreen(el) {
  clearTimeout(el._tt);
  if (el.hidden) return;
  el.classList.remove('enter');
  el.classList.add('leave');
  el._tt = setTimeout(() => { el.hidden = true; el.classList.remove('leave'); }, screenTimes(reduced()).leave);
}



function renderTracks() {
  $('blurb').textContent = def.blurb;
  const list = $('trackList');
  list.textContent = '';
  for (const id of TRACK_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.track = id;
    b.append(TRACKS[id].name);
    const best = settings.best[id];
    if (Number.isInteger(best)) {
      const s = document.createElement('small');
      s.textContent = `Best ${ordinal(best)}`;
      b.append(s);
    }
    if (id === def.id) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', () => pickTrack(id));
    list.appendChild(b);
  }
}
renderTracks();

const host = $('game');
const canvas = document.createElement('canvas');
host.appendChild(canvas);




const SFX = {};
let muted = settings.muted;
function sfx(name, volume = 0.7, dir = 'sfx') {
  if (muted) return;
  try {
    const a = (SFX[`${dir}/${name}`] ??= new Audio(`./assets/${dir}/${name}.wav`)).cloneNode();
    a.volume = volume;
    a.play().catch(() => {});
  } catch {  }
}


const keys = new Set();
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right', Space: 'hop', ShiftLeft: 'drift', ShiftRight: 'drift', KeyE: 'use',
};
const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') { toggleSound(); return; }
  
  if (e.code === 'Escape' || (e.code === 'KeyP' && (screen === 'race' || screen === 'pause'))) {
    const to = BACK[screen];
    if (to === 'pause') pause(); else if (to === 'race') resume(); else if (to === 'title') toTitle();
    e.preventDefault();
    return;
  }
  if (screen !== 'race') {
    
    
    if (ARROWS.has(e.code)) { moveFocus(e.code); e.preventDefault(); return; }
    const onControl = document.activeElement?.tagName === 'BUTTON';
    if ((e.code === 'Enter' || e.code === 'Space') && !onControl) {
      if (screen === 'title' && !$('start').disabled) start();
      else if (screen === 'results') start();
      e.preventDefault();
    }
    return;
  }
  const k = KEYMAP[e.code];
  if (k) { keys.add(k); e.preventDefault(); }
});
function visibleControls() {
  const el = $(screen);
  return el ? [...el.querySelectorAll('button:not(:disabled)')] : [];
}
function moveFocus(code) {
  const list = visibleControls();
  const i = focusStep(list.indexOf(document.activeElement), list.length, code);
  if (i >= 0) { list[i].focus(); sfx('tap', 0.5, 'ui'); }
}
addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); });
addEventListener('blur', () => keys.clear());

const touch = new Set();
let isTouch = false;
for (const b of document.querySelectorAll('.pad')) {
  const k = b.dataset.k;
  const on = (e) => { e.preventDefault(); touch.add(k); b.classList.add('on'); };
  const off = (e) => { e.preventDefault(); touch.delete(k); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off);
  b.addEventListener('pointerleave', off);
}
addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' && !isTouch) { isTouch = true; document.body.classList.add('touch'); }
}, { capture: true });
if (matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }



const steerTouch = createTouchSteer();
const steerRing = $('steer');
const fitSteerRange = () => steerTouch.setRange(Math.min(90, Math.max(48, innerWidth * 0.16)));
fitSteerRange();
addEventListener('resize', fitSteerRange);
function showSteer() {
  if (!steerTouch.active) { steerRing.hidden = true; return; }
  steerRing.hidden = false;
  steerRing.style.left = `${steerTouch.centre}px`;
  steerRing.style.setProperty('--knob', `${(steerTouch.x - steerTouch.centre).toFixed(1)}px`);
}
const gameEl = $('game');
gameEl.addEventListener('pointerdown', (e) => {
  if (!running || paused) return;
  if (!steerTouch.down(e.pointerId, e.clientX)) return;
  e.preventDefault();
  try { gameEl.setPointerCapture(e.pointerId); } catch {  }
  steerRing.style.top = `${e.clientY}px`;
  showSteer();
});
gameEl.addEventListener('pointermove', (e) => { steerTouch.move(e.pointerId, e.clientX); showSteer(); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  gameEl.addEventListener(ev, (e) => { steerTouch.up(e.pointerId); showSteer(); });
}

function readInput() {
  const has = (k) => keys.has(k) || touch.has(k);
  
  const throttle = has('down') || has('brake') ? -1 : (has('up') || isTouch ? 1 : 0);
  
  const keySteer = (has('right') ? 1 : 0) - (has('left') ? 1 : 0);
  const steer = keySteer || steerTouch.value();
  return { throttle, steer, drift: has('drift'), jump: has('hop'), use: has('use') };
}


let models = null;
let race = null;
let view = null;
let running = false;
let lastBeat = null;
const STEP = 1 / 120;
let acc = 0;
let last = 0;

function resize() {
  if (view) view.resize(innerWidth, innerHeight);
  fitMinimap();
}


const mapCanvas = $('minimap');
const mapCtx = mapCanvas.getContext('2d');
let mapModel = null;
let mapTints = LIVERIES;
function fitMinimap() {
  if (!race) return;
  
  const size = Math.round(minimapSize(innerWidth, innerHeight) * (innerWidth < 600 ? 0.95 : 0.8));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  document.documentElement.style.setProperty('--map', `${size}px`);
  mapCanvas.width = size * dpr;
  mapCanvas.height = size * dpr;
  mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mapModel = minimapModel(race.track, size);
  
  mapTints = race.racers.map((r, i) => (r.isPlayer ? LIVERIES[0] : LIVERIES[1 + (i % (LIVERIES.length - 1))]));
}
addEventListener('resize', resize);

async function boot() {
  try {
    models = await loadModels(def, './assets', (f) => { $('start').textContent = `Loading ${Math.round(f * 100)}%`; });
  } catch (err) {
    $('start').textContent = 'Could not load';
    console.error(err);
    return;
  }
  
  newRace({ attract: true });
  $('start').textContent = 'Start';
  $('start').disabled = false;
  updateSoundButtons();
  showScreen($('title'));
  $('start').focus();
  requestAnimationFrame(frame);
}


let loadingTrack = false;
async function pickTrack(id) {
  if (loadingTrack || !TRACKS[id] || screen !== 'title') return;
  sfx('tap', 0.6, 'ui');
  if (id === def.id) { $('start').focus(); return; }
  loadingTrack = true;
  def = TRACKS[id];
  opts.laps = lapsFor(def);
  const u = new URL(location.href);
  u.searchParams.set('track', id);
  history.replaceState(null, '', `${u.pathname}${u.search}`);
  renderTracks();
  document.querySelector(`#trackList button[data-track="${id}"]`)?.focus();
  const st = $('start');
  st.disabled = true;
  try {
    models = await loadModels(def, './assets', (f) => { st.textContent = `Loading ${Math.round(f * 100)}%`; });
  } catch (err) {
    st.textContent = 'Could not load';
    console.error(err);
    loadingTrack = false;
    return;
  }
  newRace({ attract: true });
  st.textContent = 'Start';
  st.disabled = false;
  loadingTrack = false;
}

function newRace({ attract = false } = {}) {
  race = createRace(def, {
    bots: attract ? 6 : opts.bots, laps: opts.laps, player: !attract, countdown: attract ? 0 : undefined,
  });
  const old = view;
  view = createView(canvas, race, models);
  if (old) old.renderer.dispose();
  resize();
  lastBeat = null;
  acc = 0;
  fitMinimap();
}

function start() {
  
  if (screen === 'race' || screen === 'pause' || loadingTrack || !models) return;
  sfx('open', 0.7, 'ui');
  document.activeElement?.blur?.();
  hideScreen($('title'));
  hideScreen($('results'));
  goRace();
}
function goRace() {
  screen = 'race';
  paused = false;
  $('hud').hidden = false;
  $('pads').classList.add('on');
  newRace();
  running = true;
  setMusic();
}


function releaseInputs() {
  keys.clear();
  touch.clear();
  for (const b of document.querySelectorAll('.pad.on')) b.classList.remove('on');
  steerTouch.reset();
  showSteer();
}
function pause() {
  if (screen !== 'race' || !running) return;
  screen = 'pause';
  paused = true;
  sfx('back', 0.6, 'ui');
  releaseInputs();
  $('pads').classList.remove('on');
  setMusic();
  showScreen($('pause'));
  $('resume').focus();
}
function resume() {
  if (screen !== 'pause') return;
  sfx('open', 0.6, 'ui');
  screen = 'race';
  paused = false;
  acc = 0;
  last = 0;
  document.activeElement?.blur?.();
  hideScreen($('pause'));
  $('pads').classList.add('on');
  setMusic();
}
function restart() {
  if (screen !== 'pause') return;
  sfx('open', 0.7, 'ui');
  document.activeElement?.blur?.();
  hideScreen($('pause'));
  goRace();
}
function toTitle() {
  if (screen === 'title') return;
  sfx('back', 0.6, 'ui');
  running = false;
  paused = false;
  screen = 'title';
  releaseInputs();
  $('hud').hidden = true;
  $('pads').classList.remove('on');
  $('banner').hidden = true;
  $('toast').hidden = true;
  hideScreen($('pause'));
  hideScreen($('results'));
  setMusic();
  newRace({ attract: true });
  renderTracks();
  showScreen($('title'));
  $('start').focus();
}


function updateSoundButtons() {
  for (const b of document.querySelectorAll('.sound')) {
    b.textContent = muted ? 'Sound off' : 'Sound on';
    b.setAttribute('aria-pressed', String(!muted));
  }
}
function toggleSound() {
  if (!muted) sfx('toggleOff', 0.6, 'ui');
  muted = !muted;
  sfx('toggleOn', 0.6, 'ui');
  settings.muted = muted;
  saveSettings(safeStorage(), settings);
  updateSoundButtons();
  setMusic();
}




let music = null;
function setMusic() {
  try {
    music ??= Object.assign(new Audio('./assets/music/counter-rush.m4a'), { loop: true, volume: 0.45 });
    if (running && !paused && !muted) music.play().catch(() => {}); else music.pause();
  } catch {  }
}

function frame(now) {
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
  last = now;
  acc += dt;
  const player = race.racers.find((r) => r.isPlayer);
  if (paused) acc = 0; 
  while (acc >= STEP) {
    acc -= STEP;
    const input = running && player && !opts.auto ? readInput() : null;
    const { events } = stepRace(race, input, STEP);
    if (running) onEvents(events);
  }
  if (!running && !race.racers.some((r) => r.isPlayer) && race.flow.phase === PHASE.RESULTS) newRace({ attract: true });
  const focus = player?.id ?? race.racers[0].id;
  view.draw(dt, focus, { camMode: running ? opts.cam : 'top' });
  if (running) hud();
  requestAnimationFrame(frame);
}



const PROP_SFX = { can: ['canHit', 'canHit_2', 'canHit_3'], marble: ['marble', 'marble_2', 'marble_3', 'marble_4'],
  block: ['block', 'block_2'] };
let propTake = 0;
function propSound(e, mine) {
  const takes = PROP_SFX[e.kind];
  if (!takes) return;
  let vol = 0.7;
  if (!mine) {
    const me = race.racers.find((r) => r.isPlayer)?.kart;
    const p = race.loose[e.i];
    if (!me || !p) return;
    vol = 0.5 - 0.1 * Math.hypot(me.x / SIM_SCALE - p.x, me.z / SIM_SCALE - p.z);
    if (vol < 0.06) return;
  }
  propTake = (propTake + 1) % takes.length;
  sfx(takes[propTake], Math.min(0.8, vol * Math.min(1.4, 0.5 + e.speed / 2)));
}

function onEvents(events) {
  for (const e of events) {
    const mine = e.id === 'you';
    if (e.type === 'hop' && mine) sfx('hop');
    else if (e.type === 'respawn' && mine) sfx('fall');
    else if (e.type === 'bump') sfx('bump', 0.4);
    else if (e.type === 'prop') propSound(e, mine);
    else if (e.type === 'pickup' && mine) sfx(e.pickup === 'battery' ? 'pickup_2' : 'pickup', 0.7);
    else if (e.type === 'use' && mine) sfx(USE_SFX[e.pickup], 0.75);
    else if (e.type === 'splash' && e.owner === 'you') sfx('splash', 0.6);
    else if (e.type === 'pickupHit' && (mine || e.from === 'you')) sfx(e.pickup === 'gum' ? 'gum_2' : 'bouncyMarble_2', mine ? 0.75 : 0.5);
    else if (e.type === 'worldWarn') { sfx(e.source === 'tap' ? 'tap' : 'sprinkler', 0.75); toast(WORLD_TOAST[e.source], 3.2); }
    else if (e.type === 'worldOn' && e.source === 'sprinkler') sfx('sprinkler', 0.5);
    else if (e.type === 'worldOn' && e.source === 'tap') sfx('splash_2', 0.6);
    else if (e.type === 'lap' && mine) {
      if (e.lap === race.laps - 1) { sfx('finalLap'); banner('Final lap', 1.4); } else if (e.lap < race.laps) sfx('lap');
    } else if (e.type === 'finish' && mine) { sfx('finish'); banner('Finish!', 2); }
  }
  
  const text = countdownText(race.flow);
  if (text && text !== lastBeat) {
    lastBeat = text;
    banner(text, 0.85);
    sfx(text === 'GO!' ? 'go' : 'countdown');
  }
  if (race.flow.phase === PHASE.RESULTS && running) results();
}


const USE_SFX = { battery: 'boost', balloon: 'balloon', marble: 'bouncyMarble', gum: 'gum' };
const WORLD_TOAST = {
  tap: 'The tap is running. Wet worktop ahead.',
  sprinkler: 'The sprinkler is on. Wet grass ahead.',
};
let toastTimer = 0;
function toast(text, secs) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, secs * 1000);
}

let bannerUntil = 0;
function banner(text, secs) {
  const b = $('banner');
  b.textContent = text;
  b.hidden = false;
  bannerUntil = performance.now() + secs * 1000;
  setTimeout(() => { if (performance.now() >= bannerUntil - 5) b.hidden = true; }, secs * 1000);
}

function hud() {
  const table = standings(race.progress);
  const me = table.find((t) => t.id === 'you');
  if (!me) return;
  
  
  let place = me.position;
  if (race.flow.phase === PHASE.COUNTDOWN) {
    const L = race.track.path.length;
    const ahead = (r) => ((r.s - race.track.startS) % L + L * 1.5) % L - L / 2;
    const mine = ahead(race.racers.find((r) => r.isPlayer));
    place = 1 + race.racers.filter((r) => !r.isPlayer && ahead(r) > mine).length;
  }
  $('pos').innerHTML = `${ordinal(place)}<small>/${table.length}</small>`;
  const lap = Math.min(race.laps, (me.lapTimes?.length ?? 0) + 1);
  $('lap').textContent = `Lap ${lap}/${race.laps}`;
  
  const t = me.finished ? me.finishTime : (race.flow.phase === PHASE.COUNTDOWN ? 0 : race.flow.time);
  $('time').textContent = formatTime(t);
  
  const held = race.pickups.held.get('you');
  const slot = $('slot');
  slot.classList.toggle('has', !!held);
  $('slotName').textContent = held ? PICKUPS[held].name : 'No pickup';
  $('slotHint').textContent = held ? (isTouch ? 'Tap Use' : 'E to use') : '';
  document.querySelector('.pad.use')?.classList.toggle('empty', !held);
  if (mapModel) drawMinimap(mapCtx, mapModel, race, 'you', mapTints, wetRuns(mapModel, race));
}

function results() {
  running = false;
  screen = 'results';
  setMusic();
  $('hud').hidden = true;
  
  $('banner').hidden = true;
  bannerUntil = 0;
  $('toast').hidden = true;
  $('pads').classList.remove('on');
  steerTouch.reset();
  showSteer();
  const table = standings(race.progress);
  const me = table.find((t) => t.id === 'you');
  $('place').textContent = me ? `${ordinal(me.position)}${me.position === 1 ? '!' : ''}` : 'Finished';
  const rows = table.map((t) => {
    const time = t.finished ? formatTime(t.finishTime) : 'running';
    const name = t.id === 'you' ? 'You' : `Car ${t.id.replace('bot', '')}`;
    return `<tr class="${t.id === 'you' ? 'you' : ''}"><td>${ordinal(t.position)}</td><td>${name}</td><td>${time}</td></tr>`;
  });
  $('table').innerHTML = rows.join('');
  
  if (me && !opts.auto && recordBest(settings, def.id, me.position)) saveSettings(safeStorage(), settings);
  showScreen($('results'));
  $('again').focus();
}

$('start').addEventListener('click', start);
$('again').addEventListener('click', start);
$('resultsTitle').addEventListener('click', toTitle);
$('pauseBtn').addEventListener('click', pause);
$('resume').addEventListener('click', resume);
$('restart').addEventListener('click', restart);
$('toTitle').addEventListener('click', toTitle);
for (const b of document.querySelectorAll('.sound')) b.addEventListener('click', toggleSound);

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });


window.__tinyThrottle = { get race() { return race; }, opts };

boot();
