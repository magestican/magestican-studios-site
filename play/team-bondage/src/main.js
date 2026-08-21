// Team Bondage - entry.
// Wires the character-select / host-join menu, then hands off to Game.

import { Game } from './game.js';
import { MAPS, MAP_IDS, DEFAULT_MAP } from 'arbelo/mapspec';
import { MODES, MODE_IDS, DEFAULT_MODE } from 'arbelo/modes';
import { PeerMesh } from 'arbelo/net';
import { SeededRng, seedToCode, codeToSeed } from 'arbelo/rng';
import { startVersionChecker } from 'arbelo/updater';
import { mountDeviceQr }       from 'arbelo/qr';

// Cache-busting: polls /version.json every 60s and shows a Refresh banner
// when the deployed build id changes.
startVersionChecker({ label: 'A new version of Team Bondage is available.' });

// Desktop-only helper: shows a QR code so the person watching on their laptop
// can point their phone camera at it and open the exact same page (including
// the ?join=xxx room code if they're mid-lobby).
mountDeviceQr({ label: 'Play on your phone', sublabel: 'Scan this to open Team Bondage (and any join code) on your phone.' });

const $ = (id) => document.getElementById(id);

// Modules loaded => hide the "Loading..." splash immediately so the menu is
// visible. The splash is only re-shown briefly as the WebGL scene builds
// (see startGame -> goInGame).
$('loading').classList.add('done');

// Surface any uncaught error so we can debug from a headless capture.
window.addEventListener('error', (e) => {
  const msg = `Uncaught: ${e.message} @ ${e.filename}:${e.lineno}`;
  console.error(msg);
  document.title = `TB ERROR: ${e.message}`;
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = `Promise: ${e.reason?.message || e.reason}`;
  console.error(msg);
  document.title = `TB PROMISE ERROR: ${e.reason?.message || e.reason}`;
});

// -----------------------------------------------------------------------------
// Menu state
// -----------------------------------------------------------------------------

const state = {
  character: 'cow',
  team: null,             // 'red' | 'blue'
  name: '',
  mode: null,             // 'host' | 'join'
  initialBots: 0,         // number of AI bots the host wants at start
  // Host-chosen and sent to joiners in the WELCOME. A joiner's own picks are
  // ignored on purpose: two peers on different maps is the same failure as
  // two peers on different seeds.
  mapId: localStorage.getItem('tb.map') || DEFAULT_MAP,
  gameMode: localStorage.getItem('tb.mode') || DEFAULT_MODE,
};

// Highlight the selected character/team button.
function selectFrom(rowId, dataAttr, value, target) {
  const row = $(rowId);
  for (const btn of row.querySelectorAll('button')) btn.classList.remove('selected');
  if (target) target.classList.add('selected');
  else {
    for (const btn of row.querySelectorAll('button')) {
      if (btn.dataset[dataAttr] === value) btn.classList.add('selected');
    }
  }
}

// -----------------------------------------------------------------------------
// Map + mode pickers, built from the registries so adding a map or a mode is a
// data change and never a markup change.
// -----------------------------------------------------------------------------
function buildPicker(rowId, blurbId, entries, dataAttr, initial, onPick) {
  const row = document.getElementById(rowId);
  const blurb = document.getElementById(blurbId);
  if (!row) return;
  for (const e of entries) {
    const btn = document.createElement('button');
    btn.dataset[dataAttr] = e.id;
    btn.innerHTML = `<span class="emoji">${e.emoji}</span><span class="lbl">${e.short || e.name}</span>`;
    btn.title = e.blurb;
    btn.addEventListener('click', () => {
      onPick(e.id);
      for (const b of row.querySelectorAll('button')) b.classList.remove('selected');
      btn.classList.add('selected');
      if (blurb) blurb.textContent = e.blurb;
    });
    row.appendChild(btn);
  }
  const chosen = entries.find((e) => e.id === initial) || entries[0];
  onPick(chosen.id);
  const btn = row.querySelector(`button[data-${dataAttr.toLowerCase()}="${chosen.id}"]`);
  if (btn) btn.classList.add('selected');
  if (blurb) blurb.textContent = chosen.blurb;
}

buildPicker('mapRow', 'mapBlurb', MAP_IDS.map((id) => MAPS[id]), 'map', state.mapId,
  (id) => { state.mapId = id; localStorage.setItem('tb.map', id); });
buildPicker('modeRow', 'modeBlurb', MODE_IDS.map((id) => MODES[id]), 'gmode', state.gameMode,
  (id) => { state.gameMode = id; localStorage.setItem('tb.mode', id); });

// Default character = cow.
selectFrom('characterRow', 'char', 'cow');

for (const btn of $('characterRow').querySelectorAll('button')) {
  btn.addEventListener('click', () => {
    state.character = btn.dataset.char;
    selectFrom('characterRow', 'char', state.character, btn);
  });
}
for (const btn of $('teamRow').querySelectorAll('button')) {
  btn.addEventListener('click', () => {
    state.team = btn.dataset.team;
    selectFrom('teamRow', 'team', state.team, btn);
  });
}

// AI bot count buttons (0..4).
document.querySelectorAll('button[data-bots]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.initialBots = parseInt(btn.dataset.bots, 10);
    for (const b of document.querySelectorAll('button[data-bots]')) b.classList.remove('selected');
    btn.classList.add('selected');
  });
});
// Default: 0 bots selected.
document.querySelector('button[data-bots="0"]')?.classList.add('selected');

// Persist + prefill name. If nothing saved, generate a random one so people
// can just tap Host without typing.
const ADJ = ['Fierce','Swift','Cunning','Salty','Wooly','Cranky','Feral','Nimble','Bumpy','Rowdy','Sleepy','Grumpy','Merry','Quiet','Rustic','Muddy','Fuzzy','Crimson','Cobalt','Stormy'];
const NOUN = ['Cow','Chicken','Pig','Sheep','Bandit','Ranger','Farmer','Scout','Sniper','Buccaneer','Cadet','Marshal','Wanderer'];
function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${a}${n}${num}`;
}
$('nameInput').value = localStorage.getItem('tb.name') || randomName();
state.name = $('nameInput').value.trim();
$('nameInput').addEventListener('input', (e) => {
  state.name = e.target.value.trim();
  localStorage.setItem('tb.name', state.name);
});

// (SSO block removed 2026-08-20 — Bryan clarified he meant SEO, not SSO.
// The game stays account-free; no third-party script loaded here.)

// -----------------------------------------------------------------------------
// First-run "How to play" overlay. Shows once per browser; a returning
// player never sees it again (localStorage tb.howto). Remote-team players
// usually arrive cold from a pasted room code — this is their 15-second
// orientation. docs/GAME_DESIGN.md § Onboarding.
// -----------------------------------------------------------------------------
(function howtoOnboarding() {
  const overlay = document.getElementById('howto-overlay');
  const close = document.getElementById('howto-close');
  if (!overlay || !close) return;
  if (!localStorage.getItem('tb.howto')) {
    overlay.style.display = 'flex';
  }
  close.addEventListener('click', () => {
    localStorage.setItem('tb.howto', '1');
    overlay.style.display = 'none';
  });
})();

// Also auto-pick a random team so first-time players can just tap Host.
const initialTeam = Math.random() < 0.5 ? 'red' : 'blue';
state.team = initialTeam;
selectFrom('teamRow', 'team', initialTeam);

// -----------------------------------------------------------------------------
// Auto-join from URL: ?join=<peerId>
// -----------------------------------------------------------------------------

const url = new URL(location.href);
const joinFromUrl = url.searchParams.get('join');
if (joinFromUrl) {
  $('joinIdInput').value = joinFromUrl;
}

// -----------------------------------------------------------------------------
// Host / Join click handlers
// -----------------------------------------------------------------------------

$('hostBtn').addEventListener('click', async () => {
  if (!validate()) return;
  state.mode = 'host';
  await startGame(null);
});

$('joinBtn').addEventListener('click', async () => {
  if (!validate()) return;
  const hostId = $('joinIdInput').value.trim();
  if (!hostId) { alert('Enter the room code your host sent you.'); return; }
  state.mode = 'join';
  await startGame(hostId);
});

function validate() {
  const name = $('nameInput').value.trim() || randomName();
  state.name = name;
  $('nameInput').value = name;
  localStorage.setItem('tb.name', name);
  if (!state.team) {
    state.team = Math.random() < 0.5 ? 'red' : 'blue';
    selectFrom('teamRow', 'team', state.team);
  }
  return true;
}

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------

async function startGame(hostIdToJoin) {
  // Deterministic-ish room-id prefix so shared links look tidy.
  const hostIdHint = state.mode === 'host'
    ? `tb-${Math.random().toString(36).slice(2, 8)}`
    : undefined;

  const mesh = new PeerMesh({ hostIdHint });

  // Wait for our own peer id.
  const myId = await new Promise((resolve, reject) => {
    mesh.addEventListener('open', (e) => resolve(e.detail.id), { once: true });
    mesh.addEventListener('error', (e) => {
      // If a hosting hint collides, PeerJS emits 'unavailable-id' - retry with
      // no hint so PeerJS assigns a fresh random id.
      if (String(e.detail.message).includes('unavailable-id')) {
        console.warn('room code taken - taking a random one');
      } else {
        reject(new Error(e.detail.message));
      }
    });
  }).catch((err) => {
    alert('Network error opening room: ' + err.message);
    throw err;
  });

  if (state.mode === 'host') {
    mesh.host();
    // Show shareable link
    const link = new URL(location.href);
    link.searchParams.set('join', myId);
    $('linkOutWrap').style.display = 'block';
    $('linkOut').textContent = link.toString();
    $('linkOut').addEventListener('click', () => {
      navigator.clipboard.writeText(link.toString());
      $('linkOut').textContent = link.toString() + '  (copied!)';
    });
  } else {
    mesh.connectTo(hostIdToJoin);
  }

  // Give the host UI a chance to appear + let joiners connect before we hide
  // the menu; the actual "in-game" transition happens when Game.start() is
  // called by the user (space or auto after 1s for host).
  const seed = state.mode === 'host'
    ? (Math.random() * 2 ** 32) >>> 0
    : null;   // joiner gets the seed from the host on 'welcome'

  // Move to the loading screen.
  const goInGame = () => {
    $('menu').style.display = 'none';
    $('hud').style.display = 'block';
    $('loading').classList.add('done');
    game.pointerLock();
  };

  const game = new Game({
    mesh,
    myId,
    character: state.character,
    team: state.team,
    name: state.name,
    isHost: state.mode === 'host',
    seed,
    // Only the host's picks matter; a joiner's are overwritten by the WELCOME.
    mapId: state.mapId,
    mode: state.gameMode,
    initialBots: state.mode === 'host' ? state.initialBots : 0,
    canvasParent: $('app'),
    onReady: goInGame,
  });

  window.__tbGame = game;   // for debugging
  await game.boot();
}
