// Team Bondage - entry.
// Wires the character-select / host-join menu, then hands off to Game.

import { Game } from './game.js';
import { PeerMesh } from 'arbelo/net';
import { SeededRng, seedToCode, codeToSeed } from 'arbelo/rng';

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

// Persist + prefill name.
$('nameInput').value = localStorage.getItem('tb.name') || '';
$('nameInput').addEventListener('input', (e) => {
  state.name = e.target.value.trim();
  localStorage.setItem('tb.name', state.name);
});

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
  const name = $('nameInput').value.trim();
  state.name = name;
  if (!name) { alert('Enter a player name first.'); return false; }
  if (!state.team) { alert('Pick a team (red or blue).'); return false; }
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
    canvasParent: $('app'),
    onReady: goInGame,
  });

  window.__tbGame = game;   // for debugging
  await game.boot();
}
