






import { TRACKS, TRACK_ORDER } from './tracks/index.js';
import { createRace, stepRace, standings, PHASE } from './race.js';
import { loadModels, createView, LIVERIES } from './render.js';
import { minimapModel, drawMinimap, wetRuns } from './minimap.js';
import { minimapSize } from '../../../web-engine/kart/minimap.js';
import { PICKUPS } from '../../../web-engine/rc/pickups.js';
import { formatTime, ordinal } from '../../../web-engine/kart/raceProgress.js';
import { countdownText } from '../../../web-engine/kart/raceFlow.js';
import { createTouchSteer, steerRangeFor, steerZone } from './touchSteer.js';
import { assistFor } from './driveAssist.js';
import { SIM_SCALE } from '../../../web-engine/rc/rcTuning.js';
import { MOTION, screenTimes, BACK, focusStep, loadSettings, saveSettings, recordBest } from './menus.js';
import { createHostLink, createGuestLink, linkFrom, joinLinkFor, watchLinkOf, canLink } from './netRoom.js';
import { makeSnap, createSnapBuffer, receiveSnap, applySnaps, resumeRace, packInput, SNAP_MS, INPUT_HZ } from './netSync.js';
import { successorOf, takeOverRoom, RECLAIM_MS } from './hostMigration.js';
import { applyRoom, roleOf, carOf, grid as roomGrid, ROLE, RACER_SEATS } from './room.js';
import { newCodeButton } from '../../../web-engine/net/stickyRoomCode.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';

const q = new URLSearchParams(location.search);

let def = TRACKS[q.get('track') ?? 'H1'] ?? TRACKS.H1;
const lapsFor = (d) => clampInt(q.get('laps'), 1, 9, d.laps);
const opts = {
  laps: lapsFor(def),
  bots: clampInt(q.get('bots'), 0, 11, 11),
  cam: q.get('cam') === 'top' ? 'top' : 'chase',
  auto: q.get('auto') === '1',
  
  render: q.get('render') !== 'off',
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
  if (screen === 'room' && e.code === 'Escape') { leaveOnline(); e.preventDefault(); return; }
  if (screen === 'race' && net && !me && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
    spectate(e.code === 'ArrowRight' ? 1 : -1);
    e.preventDefault();
    return;
  }
  
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
      else if (screen === 'results') again();
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
  if (e.pointerType === 'touch' && !isTouch) { isTouch = true; document.body.classList.add('touch'); updateAssistButtons(); }
}, { capture: true });
if (matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }



const steerTouch = createTouchSteer();
const steerRing = $('steer');

let steerRange = steerRangeFor(innerWidth);
let steerY = 0;
let steerKey = '';
const fitSteerRange = () => {
  steerRange = steerRangeFor(innerWidth);
  steerTouch.setRange(steerRange);
  steerRing.style.setProperty('--range', `${steerRange}px`);
};
fitSteerRange();
addEventListener('resize', fitSteerRange);
function showSteer() {
  const driving = isTouch && running && !paused && screen === 'race' && $('pads').classList.contains('on');
  const z = steerZone({ width: innerWidth, height: innerHeight, range: steerRange, driving, steer: steerTouch, y: steerY });
  const key = `${z.show}|${z.idle}|${z.cx}|${z.cy}|${z.knob.toFixed(1)}`;
  if (key === steerKey) return; 
  steerKey = key;
  steerRing.hidden = !z.show;
  if (!z.show) return;
  steerRing.classList.toggle('idle', z.idle);
  steerRing.style.left = `${z.cx}px`;
  steerRing.style.top = `${z.cy}px`;
  steerRing.style.setProperty('--knob', `${z.knob.toFixed(1)}px`);
}
const gameEl = $('game');
gameEl.addEventListener('pointerdown', (e) => {
  if (!running || paused) return;
  if (!steerTouch.down(e.pointerId, e.clientX)) return;
  e.preventDefault();
  try { gameEl.setPointerCapture(e.pointerId); } catch {  }
  steerY = e.clientY;
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
  
  return { throttle, steer, drift: has('drift'), jump: has('hop'), use: has('use'), assist: assistFor(settings.assist, isTouch) };
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
  
  mapTints = race.racers.map((r, i) => (r.id === me ? LIVERIES[0] : LIVERIES[1 + (i % (LIVERIES.length - 1))]));
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
  updateAssistButtons();
  requestAnimationFrame(frame);
  const link = linkFrom(location.href);
  if (link && canLink()) { joinOnline(link.code, link.watch); return; }
  showScreen($('title'));
  $('start').focus();
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

function newRace({ attract = false, cars = null, laps = opts.laps, seed } = {}) {
  race = createRace(def, {
    bots: attract ? 6 : opts.bots, laps, player: !attract, countdown: attract ? 0 : undefined, cars, seed,
  });
  if (!cars) me = attract ? null : 'you';
  race.me = me;
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
  paused = !net;
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
  if (screen !== 'pause' || net) return;
  sfx('open', 0.7, 'ui');
  document.activeElement?.blur?.();
  hideScreen($('pause'));
  goRace();
}
function toTitle() {
  if (screen === 'title') return;
  if (net) { leaveOnline(); return; }
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


function assistOn() { return assistFor(settings.assist, isTouch) > 0; }
function updateAssistButtons() {
  for (const b of document.querySelectorAll('.assist')) {
    b.textContent = assistOn() ? 'Assist on' : 'Assist off';
    b.setAttribute('aria-pressed', String(assistOn()));
  }
}
function toggleAssist() {
  settings.assist = !assistOn();
  sfx(settings.assist ? 'toggleOn' : 'toggleOff', 0.6, 'ui');
  saveSettings(safeStorage(), settings);
  updateAssistButtons();
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
  const player = me ? race.racers.find((r) => r.id === me) : null;
  if (paused) acc = 0; 
  if (net?.kind === 'guest' && net.racing) {
    acc = 0;
    applySnaps(race, net.buf, now);
    if (me && running && now - net.sentAt >= 1000 / INPUT_HZ) {
      net.sentAt = now;
      
      if (!opts.auto) net.link.sendInput(packInput(screen === 'race' ? readInput() : { throttle: 0, steer: 0 }));
    }
    if (running && race.flow.phase === PHASE.RESULTS && screen === 'race') results();
  } else {
    while (acc >= STEP) {
      acc -= STEP;
      let input = running && player && !opts.auto ? readInput() : null;
      if (net?.kind === 'host' && net.racing) {
        const byId = Object.fromEntries(net.link.inputs);
        if (me && !opts.auto) byId[me] = screen === 'race' ? readInput() : { throttle: 0, steer: 0 };
        input = { byId };
      }
      const { events } = stepRace(race, input, STEP);
      if (net?.kind === 'host' && net.racing) net.events.push(...events);
      if (running) onEvents(events);
    }
    if (net?.kind === 'host' && net.racing && now - net.sentAt >= SNAP_MS) {
      net.sentAt = now;
      net.seq += 1;
      net.link.snap(makeSnap(race, { seq: net.seq, events: net.events, table: standings(race.progress) }));
      net.events = [];
    }
  }
  if (!running && !net && !race.racers.some((r) => r.isPlayer) && race.flow.phase === PHASE.RESULTS) newRace({ attract: true });
  const focus = player?.id ?? (net && !me ? spectateFocus() : race.racers[0].id);
  if (opts.render) view.draw(dt, focus, { camMode: running ? opts.cam : 'top' });
  if (running) hud();
  showSteer();
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
    const k = race.racers.find((r) => r.id === (me ?? spectateFocus()))?.kart;
    const p = race.loose[e.i];
    if (!k || !p) return;
    vol = 0.5 - 0.1 * Math.hypot(k.x / SIM_SCALE - p.x, k.z / SIM_SCALE - p.z);
    if (vol < 0.06) return;
  }
  propTake = (propTake + 1) % takes.length;
  sfx(takes[propTake], Math.min(0.8, vol * Math.min(1.4, 0.5 + e.speed / 2)));
}

function onEvents(events) {
  for (const e of events) {
    const mine = !!me && e.id === me;
    if (e.type === 'hop' && mine) sfx('hop');
    else if (e.type === 'respawn' && mine) sfx('fall');
    
    else if (e.type === 'bump' && me && (e.a === me || e.b === me)) { sfx('bump', 0.4); view?.shake(0.25); }
    else if (e.type === 'prop') { propSound(e, mine); if (mine) view?.shake(Math.min(0.5, (e.speed ?? 0) / 40)); }
    else if (e.type === 'pickup' && mine) sfx(e.pickup === 'battery' ? 'pickup_2' : 'pickup', 0.7);
    else if (e.type === 'use' && mine) sfx(USE_SFX[e.pickup], 0.75);
    else if (e.type === 'splash' && me && e.owner === me) sfx('splash', 0.6);
    else if (e.type === 'pickupHit' && (mine || (me && e.from === me))) sfx(e.pickup === 'gum' ? 'gum_2' : 'bouncyMarble_2', mine ? 0.75 : 0.5);
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
  if (race.flow.phase === PHASE.RESULTS && running && net?.kind !== 'guest') results();
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
  const table = race.netTable ?? standings(race.progress);
  const hudId = me ?? spectateFocus();
  const watching = $('watching');
  watching.hidden = !net?.watchers;
  if (net?.watchers) watching.textContent = `${net.watchers} watching`;
  if (net && !me) $('specName').textContent = `Watching ${carName(hudId)}`;
  const mine = table.find((t) => t.id === hudId);
  if (!mine) return;
  hudRow(table, mine, hudId, !!me);
}
function hudRow(table, me, hudId, driving) {
  
  
  let place = me.position;
  if (race.flow.phase === PHASE.COUNTDOWN) {
    const L = race.track.path.length;
    const ahead = (r) => ((r.s - race.track.startS) % L + L * 1.5) % L - L / 2;
    const mine = ahead(race.racers.find((r) => r.id === hudId));
    place = 1 + race.racers.filter((r) => r.id !== hudId && ahead(r) > mine).length;
  }
  $('pos').innerHTML = `${ordinal(place)}<small>/${table.length}</small>`;
  const lap = Math.min(race.laps, (me.lapTimes?.length ?? 0) + 1);
  $('lap').textContent = `Lap ${lap}/${race.laps}`;
  
  const t = me.finished ? me.finishTime : (race.flow.phase === PHASE.COUNTDOWN ? 0 : race.flow.time);
  $('time').textContent = formatTime(t);
  
  const held = race.pickups.held.get(hudId);
  const slot = $('slot');
  slot.classList.toggle('has', !!held);
  $('slotName').textContent = held ? PICKUPS[held].name : 'No pickup';
  $('slotHint').textContent = held && driving ? (isTouch ? 'Tap Use' : 'E to use') : '';
  document.querySelector('.pad.use')?.classList.toggle('empty', !held);
  if (mapModel) drawMinimap(mapCtx, mapModel, race, hudId, mapTints, wetRuns(mapModel, race));
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
  const table = race.netTable ?? standings(race.progress);
  const mine = me ? table.find((t) => t.id === me) : null;
  $('place').textContent = mine ? `${ordinal(mine.position)}${mine.position === 1 ? '!' : ''}` : 'Finished';
  const rows = table.map((t) => {
    const time = t.finished ? formatTime(t.finishTime) : 'running';
    const name = esc(carName(t.id));
    return `<tr class="${t.id === me ? 'you' : ''}"><td>${ordinal(t.position)}</td><td>${name}</td><td>${time}</td></tr>`;
  });
  $('table').innerHTML = rows.join('');
  
  if (mine && !net && !opts.auto && recordBest(settings, def.id, mine.position)) saveSettings(safeStorage(), settings);
  
  if (net?.kind === 'host') {
    
    net.seq += 1;
    net.link.snap(makeSnap(race, { seq: net.seq, events: [], table: standings(race.progress) }));
    net.racing = false;
    net.link.end();
  }
  if (net?.kind === 'guest') net.racing = false;
  $('again').hidden = net?.kind === 'guest';
  $('resultsWait').hidden = net?.kind !== 'guest';
  $('resultsTitle').textContent = net ? 'Leave room' : 'Pick a track';
  $('spectate').hidden = true;
  showScreen($('results'));
  ($('again').hidden ? $('resultsTitle') : $('again')).focus();
}
function again() {
  if (net?.kind === 'host') hostStart();
  else if (!net) start();
}

$('start').addEventListener('click', start);
$('again').addEventListener('click', again);
$('resultsTitle').addEventListener('click', toTitle);
$('pauseBtn').addEventListener('click', pause);
$('resume').addEventListener('click', resume);
$('restart').addEventListener('click', restart);
$('toTitle').addEventListener('click', toTitle);
for (const b of document.querySelectorAll('.sound')) b.addEventListener('click', toggleSound);
for (const b of document.querySelectorAll('.assist')) b.addEventListener('click', toggleAssist);

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });



let me = null;  
let net = null; 
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function carName(id) {
  if (id === me) return 'You';
  if (id === 'you') return 'You';
  const seat = Number(String(id).replace(/^(p|bot)/, ''));
  const s = net?.room?.seats?.[seat];
  if (/^p\d/.test(id) && s) return s.name;
  return `Car ${/^bot/.test(id) && !net ? seat : seat + 1}`;
}
function spectateFocus() {
  if (!race) return null;
  const table = race.netTable ?? standings(race.progress);
  if (!net || net.focus === 'lead') return table[0]?.id ?? race.racers[0].id;
  return race.racers[((net.focus % race.racers.length) + race.racers.length) % race.racers.length].id;
}
function spectate(step) {
  if (!net) return;
  sfx('tap', 0.5, 'ui');
  if (step === 0) { net.focus = 'lead'; return; }
  const cur = race.racers.findIndex((r) => r.id === spectateFocus());
  net.focus = cur + step;
}
$('specPrev').addEventListener('click', () => spectate(-1));
$('specNext').addEventListener('click', () => spectate(1));
$('specLead').addEventListener('click', () => spectate(0));

const newCode = newCodeButton($('copyWatch'), { onReset: () => { if (net?.kind === 'host') { net.link.newCode(); } } });
function openRoomScreen() {
  for (const id of ['title', 'results', 'pause']) hideScreen($(id));
  $('hud').hidden = true;
  $('spectate').hidden = true;
  $('pads').classList.remove('on');
  running = false;
  screen = 'room';
  showScreen($('room'));
}
function drawRoom() {
  if (!net) return;
  const room = net.room;
  const myId = net.kind === 'host' ? room?.hostId : net.link.myId;
  const role = room ? roleOf(room, myId) : null;
  const seats = room ? roomGrid(room) : [];
  $('seats').innerHTML = seats.map((c) => {
    const mine = c.peerId && c.peerId === myId;
    const label = c.human ? (mine ? `${c.seat + 1}. You` : `${c.seat + 1}. ${esc(c.name)}`) : `${c.seat + 1}. Bot`;
    return `<li class="${c.human ? '' : 'bot'} ${mine ? 'me' : ''}">${label}</li>`;
  }).join('');
  const w = room?.watchers?.length ?? 0;
  net.watchers = w;
  $('watchCount').textContent = w ? `${w} watching` : 'Twelve drive, the rest watch';
  $('roomRole').textContent = role === ROLE.RACER ? (net.kind === 'host' ? 'You host and drive car 1' : `You drive car ${seatNo(room, myId)}.`)
    : role === ROLE.WATCHER ? 'You watch until a seat frees' : '';
  $('roomStart').hidden = net.kind !== 'host';
  $('roomStart').disabled = !room;
  $('roomLinks').hidden = !room;
  newCode.show(net.kind === 'host' && !!room);
}
const seatNo = (room, id) => room.seats.findIndex((x) => x && x.peerId === id) + 1;

const codeLabel = (code) => `Room code ${code.replace(/^tql-/, '').toUpperCase()}`;
function makeHostLink(takeover = null) {
  const link = createHostLink({
    takeover,
    onRoom: (room) => { if (net?.link === link) { net.room = room; drawRoom(); } },
    onCode: (code, state) => {
      if (net?.link !== link) return;
      
      if (takeover && !code && /^trouble/.test(state)) { leaveOnline(); toast('The host left. The room is closed.', 4); return; }
      $('roomCode').textContent = code ? codeLabel(code) : state === 'opening' ? 'Opening a room' : 'The room could not open. Try again soon.';
      drawRoom();
    },
  });
  return link;
}
function hostOnline() {
  if (net || !canLink() || !models) return;
  sfx('open', 0.7, 'ui');
  const link = makeHostLink();
  net = { kind: 'host', link, racing: false, seq: 0, sentAt: 0, events: [], watchers: 0, room: null, focus: 'lead' };
  openRoomScreen();
  drawRoom();
  link.host(0);
  $('roomStart').focus();
}

function makeGuestLink(code, { watch, was = null }) {
  const link = createGuestLink(code, {
    watch,
    was,
    onRoom: (wire) => { if (net?.link !== link) return; net.room = applyRoom(wire); drawRoom(); },
    onStart: (msg) => { if (net?.link === link) guestStart(msg); },
    onSnap: (snap) => {
      if (net?.link !== link || !net.racing) return;
      const events = receiveSnap(net.buf, snap, performance.now());
      if (events && running) onEvents(events.filter((e) => !me || e.id === me || e.type === 'worldWarn' || e.type === 'worldOn'));
    },
    onEnd: () => {
      if (net?.link !== link) return;
      applySnaps(race, net.buf, Infinity, { delay: 0 }); 
      if (running && screen !== 'results') results();
    },
    onState: (state) => {
      if (net?.link !== link) return;
      if (state === 'host-gone') hostGone();
      else if (state === 'closed') { leaveOnline(); toast('The host left. The room is closed.', 4); }
      else if (state === 'full') { leaveOnline(); toast('That room is full.', 4); }
      else if (/^failed/.test(state) && net.redialUntil) redial(); 
      else if (/^failed/.test(state)) { leaveOnline(); toast('Could not join that room. Check the code.', 4); }
      else if (state === 'joined') { net.redialUntil = 0; $('roomCode').textContent = codeLabel(code); }
      else if (!net.redialUntil) $('roomCode').textContent = 'Joining the room';
    },
  });
  return link;
}
function joinOnline(code, watch) {
  if (net || !canLink() || !models) return;
  const link = makeGuestLink(code, { watch });
  net = { kind: 'guest', link, racing: false, buf: createSnapBuffer(), sentAt: 0, watchers: 0, room: null, focus: 'lead', code, watch };
  openRoomScreen();
  $('roomCode').textContent = 'Joining the room';
  drawRoom();
  $('roomLeave').focus();
}




function hostGone() {
  const old = net;
  const myId = old.link.myId;
  const code = old.code;
  const next = old.room ? successorOf(old.room, code) : null;
  try { old.link.leave(); } catch {  }
  if (!next) { leaveOnline(); toast('The host left. The room is closed.', 4); return; }
  if (next === myId) { takeOver(old, myId); return; }
  const seat = old.room.seats.findIndex((s) => s && !s.left && s.peerId === next);
  toast(seat >= 0 ? `The host left. Car ${seat + 1} hosts now.` : 'The host left. A watcher hosts now.', 3);
  net.was = myId;
  net.redialUntil = performance.now() + RECLAIM_MS - 2000;
  net.buf = createSnapBuffer(); 
  net.link = { myId, sendInput() {}, leave() {} }; 
  setTimeout(() => { if (net === old && net.redialUntil) redial(); }, 1000); 
}
function redial() {
  if (!net || net.kind !== 'guest') return;
  if (performance.now() > net.redialUntil) { net.redialUntil = 0; leaveOnline(); toast('The host left. The room is closed.', 4); return; }
  const cur = net;
  setTimeout(() => {
    if (net !== cur || !net.redialUntil) return;
    try { net.link.leave(); } catch {  }
    net.link = makeGuestLink(net.code, { watch: !!net.watch, was: net.was });
  }, 1500);
}
function takeOver(old, myId) {
  const code = old.code;
  const { room, awaiting } = takeOverRoom(old.room, { goneHostId: code, me: myId, newHostId: code });
  const link = makeHostLink({ code, room, awaiting, started: old.start ?? null });
  const lastSnap = old.buf?.list?.at(-1)?.snap;
  if (old.racing && lastSnap) resumeRace(race, lastSnap);
  net = {
    kind: 'host', link, racing: old.racing && !!lastSnap, seq: (old.buf?.lastSeq ?? 0) + 1, sentAt: 0, events: [],
    watchers: old.watchers, room, focus: old.focus,
  };
  link.host(0);
  toast('The host left. You host the room now.', 3);
  drawRoom();
}

function goOnlineRace(cars, laps, seed) {
  hideScreen($('room'));
  hideScreen($('results'));
  screen = 'race';
  paused = false;
  $('hud').hidden = false;
  $('pads').classList.toggle('on', !!me);
  $('spectate').hidden = !!me;
  newRace({ cars, laps, seed });
  running = true;
  setMusic();
}

function hostStart() {
  if (net?.kind !== 'host' || !net.room) return;
  sfx('open', 0.7, 'ui');
  const seed = (Math.random() * 1e9) | 0;
  const cars = net.link.start({ track: def.id, laps: opts.laps, seed });
  if (!cars) return;
  me = carOf(net.link.room, net.link.room.hostId);
  net.racing = true;
  net.seq = 0;
  net.events = [];
  goOnlineRace(cars, opts.laps, seed);
}

async function guestStart(msg) {
  if (!TRACKS[msg.track] || !Array.isArray(msg.grid)) return;
  const link = net.link;
  
  
  if (net.racing && net.start && net.start.seed === msg.seed && msg.track === def.id) { net.start = msg; net.buf = createSnapBuffer(); return; }
  net.start = msg;
  if (msg.track !== def.id) {
    def = TRACKS[msg.track];
    try { models = await loadModels(def, './assets', () => {}); } catch (err) { console.error(err); return; }
    if (net?.link !== link) return;
  }
  const cars = msg.grid.slice(0, RACER_SEATS).map((c, i) => ({ seat: i, carId: String(c.carId), human: !!c.human, name: String(c.name ?? '') }));
  me = net.room ? carOf(net.room, link.myId) : null;
  
  if (!me) me = cars.find((c) => msg.grid.find((g) => g.carId === c.carId)?.peerId === link.myId)?.carId ?? null;
  net.racing = true;
  net.buf = createSnapBuffer();
  goOnlineRace(cars, clampInt(msg.laps, 1, 9, def.laps), msg.seed);
}

function leaveOnline() {
  if (!net) return;
  sfx('back', 0.6, 'ui');
  try { net.link.leave(); } catch {  }
  net = null;
  me = null;
  const u = new URL(location.href);
  u.searchParams.delete('join');
  u.searchParams.delete('watch');
  history.replaceState(null, '', `${u.pathname}${u.search}`);
  hideScreen($('room'));
  $('again').hidden = false;
  $('resultsWait').hidden = true;
  $('resultsTitle').textContent = 'Pick a track';
  $('spectate').hidden = true;
  $('watching').hidden = true;
  screen = 'results'; 
  toTitle();
}




$('online').addEventListener('click', hostOnline);
$('roomStart').addEventListener('click', hostStart);
$('roomLeave').addEventListener('click', leaveOnline);
$('copyJoin').addEventListener('click', (e) => { const c = net?.link?.code ?? net?.code; if (c) shareLink({ link: joinLinkFor(location.href, c), gameName: 'Tiny Throttle', code: c, button: e.currentTarget }); });
$('copyWatch').addEventListener('click', (e) => { const c = net?.link?.code ?? net?.code; if (c) shareLink({ link: watchLinkOf(location.href, c), gameName: 'Tiny Throttle', code: c, button: e.currentTarget, text: 'Watch my Tiny Throttle race' }); });
if (!canLink()) $('online').hidden = true;


window.__tinyThrottle = { get race() { return race; }, opts, get net() { return net; }, get me() { return me; } };

boot();
