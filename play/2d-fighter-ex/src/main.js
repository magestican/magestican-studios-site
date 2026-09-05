

import { initAnalytics, trackEvent } from '../../../web-engine/analytics/analytics.js';


import { countPlay } from '../../../web-engine/stats/firebaseLeaderboard.js';



import { recordSession, accountSummary, syncFromCloud } from '../../../web-engine/account/account.js';
import { mountAccountBadge } from '../../../web-engine/account/accountBadge.js';
import { startVersionChecker } from '../../../web-engine/updater/versionChecker.js';
import { CANVAS } from './choreography.js';
import { buildStage } from './stage.js';
import { WORLD_IDS } from './worlds.js';
import { CAST, CAST_IDS, DEFAULT_A, DEFAULT_B, atlasFile, castId } from './cast.js';
import { cursorAt, stateAt, totalMs, sceneAt } from './fightPlayback.js';
import { FPS } from './fightScript.js';
import { renderFrame, setFighter3dFactory } from './render.js';
import { installAudio } from './audio.js';
































const FIGHTER_3D_TIMEOUT_MS = 5000;
const loaded = await Promise.race([
  import('./ps1/fighter3d.js').catch((err) => ({ err })),
  new Promise((done) => { setTimeout(() => done({ err: new Error('timed out') }), FIGHTER_3D_TIMEOUT_MS); }),
]);
if (loaded && loaded.createFighter3d) {
  setFighter3dFactory(loaded.createFighter3d);
} else {
  
  
  console.warn('[fighter-ex] 3D fighters unavailable, drawing baked sprites instead',
    loaded && loaded.err);
}

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

















const DEFAULT_WORLD = 'feudal';
let world = WORLD_IDS.includes(params.get('world')) ? params.get('world') : DEFAULT_WORLD;






let castA = castId(params.get('a'), DEFAULT_A);
let castB = castId(params.get('b'), DEFAULT_B);
let moodNow = mood;




const fxOn = { shadow: true, weather: true, impact: true, words: true };











const sound = installAudio({ search: globalThis.location.search });



sound.setWorld(world);


function syncUrl() {
  const u = new URL(window.location.href);
  if (castA === DEFAULT_A) u.searchParams.delete('a');
  else u.searchParams.set('a', castA);
  if (castB === DEFAULT_B) u.searchParams.delete('b');
  else u.searchParams.set('b', castB);
  if (world === DEFAULT_WORLD) u.searchParams.delete('world');
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









function loadCast() {
  for (const [who, id] of [['light', castA], ['dark', castB]]) {
    const img = new Image();
    const src = bust(new URL(`../assets/${atlasFile(id)}`, import.meta.url).href);
    if (sprites[who] && sprites[who].src !== src) delete sprites[who];
    img.onload = () => { sprites[who] = img; };
    img.src = src;
  }
}
loadCast();
$('seed').textContent = seed;




if ($('frames')) $('frames').textContent = String(Math.round(totalMs() / (1000 / FPS)));

let playing = true;
let elapsed = 0;
let last = null;
let speed = 1;












let fightCounted = false;





let lastBadgePaint = 0;

function recordFightWatched() {
  if (fightCounted) return;
  fightCounted = true;
  try {
    recordSession({ gameId: '2d-fighter-ex', metrics: { fights: 1 } });
    paintAccount(true);
  } catch (_) {  }
}




function paintAccount(force = false) {
  const host = $('account');
  if (!host) return;
  const nowMs = Date.now();
  if (!force && nowMs - lastBadgePaint < 1000) return;
  lastBadgePaint = nowMs;
  try {
    mountAccountBadge(host, accountSummary(nowMs), '2d-fighter-ex');
  } catch (_) { host.textContent = ''; }
}

function tick(now) {
  if (last === null) last = now;
  const dt = Math.min(100, now - last);
  last = now;
  if (playing) elapsed += dt * speed;

  const pose = stateAt(elapsed);
  pose.sprites = sprites;
  
  
  
  sound.tick(pose);

  
  
  
  
  const shake = pose.shake || 0;
  ctx.save();
  if (shake > 0) {
    const k = pose.index * 2.3994;
    ctx.translate(Math.sin(k) * 5 * shake, Math.cos(k * 1.7) * 4 * shake);
  }
  renderFrame(ctx, cells, { ...pose, cast: { a: castA, b: castB } }, moodNow,
    { season, world, timeMs: elapsed, fx: fxOn });
  ctx.restore();

  const total = totalMs();
  
  
  
  if (playing && elapsed >= total) recordFightWatched();
  paintAccount();
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













countPlay('2d-fighter-ex', { isHost: true });




try { Promise.resolve(syncFromCloud()).catch(() => {}); } catch (_) {  }
paintAccount(true);








renderFrame(ctx, cells, { ...stateAt(0), sprites, cast: { a: castA, b: castB } }, moodNow,
  { season, world, timeMs: 0, fx: fxOn });

requestAnimationFrame(tick);






for (const [elId, get, set] of [
  ['castA', () => castA, (v) => { castA = v; }],
  ['castB', () => castB, (v) => { castB = v; }],
]) {
  const sel = $(elId);
  if (!sel) continue;
  for (const c of CAST) {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = `${c.name} - ${c.role}`;
    sel.appendChild(o);
  }
  sel.value = get();
  sel.addEventListener('change', () => {
    set(CAST_IDS.includes(sel.value) ? sel.value : get());
    loadCast();
    syncUrl();
  });
}

const worldSel = $('world');
if (worldSel) {
  worldSel.value = world;
  worldSel.addEventListener('change', () => {
    world = worldSel.value;
    
    
    sound.setWorld(world);
    
    
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
