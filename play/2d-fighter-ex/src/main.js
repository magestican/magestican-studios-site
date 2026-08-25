

import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { CANVAS } from './choreography.js';
import { buildStage } from './stage.js';
import { cursorAt, poseAtTime, TOTAL_MS } from './playback.js';
import { renderFrame } from './render.js';

initAnalytics({ page: '2d-fighter-ex' });

const $ = (id) => document.getElementById(id);

const canvas = $('stage');
const ctx = canvas.getContext('2d');



const params = new URLSearchParams(globalThis.location.search);
const seed = params.get('seed') || 'fighter-ex';
let cells = buildStage(seed);
$('seed').textContent = seed;

let playing = true;
let elapsed = 0;
let last = null;
let speed = 1;

function tick(now) {
  if (last === null) last = now;
  const dt = Math.min(100, now - last);
  last = now;
  if (playing) elapsed += dt * speed;

  const pose = poseAtTime(elapsed);

  renderFrame(ctx, cells, pose);

  $('frame').textContent = String(pose.index + 1);
  $('clock').textContent = `${(((elapsed % TOTAL_MS) / 1000)).toFixed(2)}s`;
  $('beat').textContent = pose.camera.closeup ? 'close-up' : (pose.fx || '-');

  requestAnimationFrame(tick);
}

function setPlaying(next) {
  playing = next;
  $('playpause').textContent = playing ? 'Pause' : 'Play';
  $('playpause').setAttribute('aria-pressed', String(!playing));
}

$('playpause').addEventListener('click', () => setPlaying(!playing));

$('step').addEventListener('click', () => {
  setPlaying(false);
  
  
  const c = cursorAt(elapsed);
  elapsed += c.hold - c.into;
});

$('speed').addEventListener('input', (e) => {
  speed = Number(e.target.value);
  $('speedout').textContent = `${speed.toFixed(2)}x`;
});

$('reseed').addEventListener('click', () => {
  const next = Math.random().toString(36).slice(2, 8);
  const url = new URL(globalThis.location.href);
  url.searchParams.set('seed', next);
  globalThis.location.assign(url.toString());
});

globalThis.addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
  if (e.key === 'ArrowRight') {
    setPlaying(false);
    const c = cursorAt(elapsed);
    elapsed += c.hold - c.into;
  }
  if (e.key === 'ArrowLeft') { setPlaying(false); elapsed = Math.max(0, elapsed - 120); }
});

canvas.width = CANVAS.width;
canvas.height = CANVAS.height;





ctx.imageSmoothingEnabled = false;

trackEvent('game_start', { game: '2d-fighter-ex', seed });








renderFrame(ctx, cells, poseAtTime(0));

requestAnimationFrame(tick);
