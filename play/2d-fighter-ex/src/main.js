

import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { CANVAS } from './choreography.js';
import { buildStage } from './stage.js';
import { WORLD_IDS } from './worlds.js';
import { cursorAt, stateAt, totalMs, sceneAt } from './fightPlayback.js';
import { FPS } from './fightScript.js';
import { renderFrame } from './render.js';

initAnalytics({ page: '2d-fighter-ex' });






startVersionChecker({
  versionUrl: './version.json',
  label: 'A new version of 2D Fighter EX is available.',
});

const $ = (id) => document.getElementById(id);

const canvas = $('stage');
const ctx = canvas.getContext('2d');



const params = new URLSearchParams(globalThis.location.search);
const seed = params.get('seed') || 'fighter-ex';


const mood = ['dark', 'juvenile', 'angry'].includes(params.get('mood')) ? params.get('mood') : 'none';



let season = params.get('season') === 'winter' ? 'winter' : 'spring';










let world = WORLD_IDS.includes(params.get('world')) ? params.get('world') : '';
let moodNow = mood;




const fxOn = { shadow: true, weather: true, impact: true, words: true };


function syncUrl() {
  const u = new URL(window.location.href);
  if (!world) u.searchParams.delete('world');
  else u.searchParams.set('world', world);
  if (season === 'spring') u.searchParams.delete('season');
  else u.searchParams.set('season', season);
  if (moodNow === 'none') u.searchParams.delete('mood');
  else u.searchParams.set('mood', moodNow);
  window.history.replaceState({}, '', u);
}
let cells = buildStage(seed, season, world);



const sprites = {};

















const BUILD_TAG = new URL(import.meta.url).searchParams.get('v') || '';
const bust = (u) => (BUILD_TAG ? `${u}?v=${encodeURIComponent(BUILD_TAG)}` : u);

for (const [who, file] of [['light', 'fighter-light.png'], ['dark', 'fighter-dark.png']]) {
  const img = new Image();
  img.src = bust(new URL(`../assets/${file}`, import.meta.url).href);
  img.onload = () => { sprites[who] = img; };
}
$('seed').textContent = seed;




if ($('frames')) $('frames').textContent = String(Math.round(totalMs() / (1000 / FPS)));

let playing = true;
let elapsed = 0;
let last = null;
let speed = 1;

function tick(now) {
  if (last === null) last = now;
  const dt = Math.min(100, now - last);
  last = now;
  if (playing) elapsed += dt * speed;

  const pose = stateAt(elapsed);
  pose.sprites = sprites;

  
  
  
  
  const shake = pose.shake || 0;
  ctx.save();
  if (shake > 0) {
    const k = pose.index * 2.3994;
    ctx.translate(Math.sin(k) * 5 * shake, Math.cos(k * 1.7) * 4 * shake);
  }
  renderFrame(ctx, cells, pose, moodNow, { season, world, timeMs: elapsed, fx: fxOn });
  ctx.restore();

  const total = totalMs();
  $('frame').textContent = String(pose.index + 1);
  $('clock').textContent = `${(((elapsed % total) / 1000)).toFixed(1)}s`;
  
  
  $('beat').textContent = pose.scene || '-';

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
  elapsed += (1 - c.into) * (1000 / FPS);
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
    elapsed += (1 - c.into) * (1000 / FPS);
  }
  if (e.key === 'ArrowLeft') {
    setPlaying(false);
    elapsed = Math.max(0, elapsed - 1000 / FPS);
  }
});

canvas.width = CANVAS.width;
canvas.height = CANVAS.height;





ctx.imageSmoothingEnabled = false;

trackEvent('game_start', { game: '2d-fighter-ex', seed });








renderFrame(ctx, cells, { ...stateAt(0), sprites }, moodNow, { season, world, timeMs: 0, fx: fxOn });

requestAnimationFrame(tick);




const worldSel = $('world');
if (worldSel) {
  worldSel.value = world;
  worldSel.addEventListener('change', () => {
    world = worldSel.value;
    
    
    cells = buildStage(seed, season, world);
    syncUrl();
  });
}

const seasonSel = $('season');
if (seasonSel) {
  seasonSel.value = season;
  seasonSel.addEventListener('change', () => {
    season = seasonSel.value;
    
    
    cells = buildStage(seed, season, world);
    syncUrl();
  });
}

const moodSel = $('mood');
if (moodSel) {
  moodSel.value = moodNow;
  moodSel.addEventListener('change', () => {
    moodNow = moodSel.value;
    syncUrl();
  });
}

for (const [id, key] of [['fxShadow', 'shadow'], ['fxWeather', 'weather'],
                         ['fxImpact', 'impact'], ['fxWords', 'words']]) {
  const box = $(id);
  if (!box) continue;
  box.checked = fxOn[key];
  box.addEventListener('change', () => {
    fxOn[key] = box.checked;
  });
}
