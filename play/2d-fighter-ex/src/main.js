

import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { CANVAS } from './choreography.js';
import { buildStage } from './stage.js';
import { frameAt, poseAt, TOTAL_MS } from './playback.js';
import { renderFrame } from './render.js';

initAnalytics({ page: '2d-fighter-ex' });

const $ = (id) => document.getElementById(id);

const canvas = $('stage');
const ctx = canvas.getContext('2d');


ctx.imageSmoothingEnabled = false;



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

  const i = frameAt(elapsed);
  const pose = poseAt(i);
  renderFrame(ctx, cells, pose);

  $('frame').textContent = String(i + 1);
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
  const i = frameAt(elapsed);
  elapsed += poseAt(i).holdMs;
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
  if (e.key === 'ArrowRight') { setPlaying(false); elapsed += poseAt(frameAt(elapsed)).holdMs; }
  if (e.key === 'ArrowLeft') { setPlaying(false); elapsed = Math.max(0, elapsed - 120); }
});

canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

trackEvent('game_start', { game: '2d-fighter-ex', seed });
requestAnimationFrame(tick);
