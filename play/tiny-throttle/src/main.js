






import { TRACKS } from './tracks/index.js';
import { createRace, stepRace, standings, PHASE } from './race.js';
import { loadModels, createView } from './render.js';
import { formatTime, ordinal } from '../../../web-engine/kart/raceProgress.js';
import { countdownText } from '../../../web-engine/kart/raceFlow.js';

const q = new URLSearchParams(location.search);
const def = TRACKS[q.get('track') ?? 'H1'] ?? TRACKS.H1;
const opts = {
  laps: clampInt(q.get('laps'), 1, 9, def.laps),
  bots: clampInt(q.get('bots'), 0, 11, 11),
  cam: q.get('cam') === 'top' ? 'top' : 'chase',
  auto: q.get('auto') === '1',
};
function clampInt(v, lo, hi, dflt) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
}

const $ = (id) => document.getElementById(id);
const host = $('game');
const canvas = document.createElement('canvas');
host.appendChild(canvas);




const SFX = {};
let muted = false;
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
  ArrowRight: 'right', KeyD: 'right', Space: 'hop', ShiftLeft: 'drift', ShiftRight: 'drift',
};
addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code];
  if (k) { keys.add(k); e.preventDefault(); }
  if (e.code === 'KeyM') { if (!muted) sfx('toggleOff', 0.6, 'ui'); muted = !muted; sfx('toggleOn', 0.6, 'ui'); setMusic(); }
  if ((e.code === 'Enter' || e.code === 'Space') && !$('title').hidden && !$('start').disabled) start();
  if (e.code === 'Enter' && !$('results').hidden) start();
});
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

function readInput() {
  const has = (k) => keys.has(k) || touch.has(k);
  
  const throttle = has('down') || has('brake') ? -1 : (has('up') || isTouch ? 1 : 0);
  
  const steer = (has('right') ? 1 : 0) - (has('left') ? 1 : 0);
  return { throttle, steer, drift: has('drift'), jump: has('hop') };
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
  $('start').focus();
  requestAnimationFrame(frame);
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
}

function start() {
  sfx('open', 0.7, 'ui');
  $('title').hidden = true;
  $('results').hidden = true;
  $('hud').hidden = false;
  $('pads').classList.add('on');
  newRace();
  running = true;
  setMusic();
}




let music = null;
function setMusic() {
  try {
    music ??= Object.assign(new Audio('./assets/music/counter-rush.m4a'), { loop: true, volume: 0.45 });
    if (running && !muted) music.play().catch(() => {}); else music.pause();
  } catch {  }
}

function frame(now) {
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
  last = now;
  acc += dt;
  const player = race.racers.find((r) => r.isPlayer);
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

function onEvents(events) {
  for (const e of events) {
    const mine = e.id === 'you';
    if (e.type === 'hop' && mine) sfx('hop');
    else if (e.type === 'respawn' && mine) sfx('fall');
    else if (e.type === 'bump') sfx('bump', 0.4);
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
}

function results() {
  running = false;
  setMusic();
  $('hud').hidden = true;
  
  $('banner').hidden = true;
  bannerUntil = 0;
  $('pads').classList.remove('on');
  const table = standings(race.progress);
  const me = table.find((t) => t.id === 'you');
  $('place').textContent = me ? `${ordinal(me.position)}${me.position === 1 ? '!' : ''}` : 'Finished';
  const rows = table.map((t) => {
    const time = t.finished ? formatTime(t.finishTime) : 'running';
    const name = t.id === 'you' ? 'You' : `Car ${t.id.replace('bot', '')}`;
    return `<tr class="${t.id === 'you' ? 'you' : ''}"><td>${ordinal(t.position)}</td><td>${name}</td><td>${time}</td></tr>`;
  });
  $('table').innerHTML = rows.join('');
  $('results').hidden = false;
  $('again').focus();
}

$('start').addEventListener('click', start);
$('again').addEventListener('click', start);


window.__tinyThrottle = { get race() { return race; }, opts };

boot();
