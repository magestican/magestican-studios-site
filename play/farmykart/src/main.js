







import { initAnalytics, trackEvent } from 'arbelo/analytics';
import { CHARACTERS, characterById, statBars, DEFAULT_CHARACTER } from 'arbelo/kartTuning';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from 'arbelo/kartAi';
import { formatTime, ordinal } from 'arbelo/raceProgress';
import {
  loadProgress, saveProgress, recordRace, trackRecord, isLocked, resetCup, lastCupTrack,
} from 'arbelo/raceStats';





import {
  scoreRace, podium, winnerAnnouncement, cupStandings, formatPoints,
} from 'arbelo/raceScore';
import { pickNextTrack } from 'arbelo/trackRotation';
import { kartPublishRows } from 'arbelo/kartLeaderboard';
import { publishScores, fetchTopPlayers, isGlobalEnabled } from 'arbelo/leaderboard';
import { startVersionChecker } from 'arbelo/updater';
import { SeededRng } from 'arbelo/rng';
import { renderPodium, renderCupLine, renderNextUp } from './ui/podium.js';
import { renderKartBoard } from './ui/kartBoard.js';

import { TRACKS, DEFAULT_TRACK } from './tracks/tracks.js';
import { createRace } from './game.js';
import { createSession, joinIdFromLocation, shareLinkFor } from './net/session.js';
import { createLobbyUi } from './ui/lobby.js';
import { drawItemIcon } from './render/itemMesh.js';
import { hex, PALETTE } from './palette.js';
import { isTouchDevice } from './input/controls.js';

const $ = (id) => document.getElementById(id);

const state = {
  track: DEFAULT_TRACK,
  character: DEFAULT_CHARACTER,
  difficulty: DEFAULT_DIFFICULTY,
  laps: 3,
  field: 8,
  muted: false,
  race: null,
  progress: null,
  
  
  
  
  
  
  
  session: null,
  lobbyUi: null,
  
  
  
  
  
  name: '',
  
  
  
  
  nextTrack: null,
  rotationRng: null,
  
  
  
  
  boardRows: null,
};

function boot() {
  initAnalytics();
  state.progress = loadProgress(safeLocalStorage());
  
  
  
  state.track = state.progress.lastTrack ?? DEFAULT_TRACK;
  state.character = state.progress.lastCharacter ?? DEFAULT_CHARACTER;
  state.difficulty = state.progress.lastDifficulty ?? DEFAULT_DIFFICULTY;
  state.muted = localStorageGet('farmykart.muted') === '1';
  state.name = localStorageGet('farmykart.name') ?? '';

  
  
  
  
  
  
  
  
  
  
  
  
  startVersionChecker({ label: 'A new version of Farmy Kart is available.' });

  buildCharacterGrid();
  buildTrackGrid();
  buildDifficultyRow();
  buildLapRow();
  buildItemLegend();
  
  
  
  
  
  
  
  
  syncSelection();
  syncMuteButton();
  buildNameField();
  refreshBoard();

  
  
  
  
  $('start-btn').addEventListener('click', () => startRace({ newCup: true }));
  $('host-btn').addEventListener('click', () => openRoom('host'));
  $('mute-btn').addEventListener('click', toggleMute);
  $('results-again').addEventListener('click', () => {
    hide('results');
    
    
    
    if (state.session) { backToLobby(); return; }
    
    
    
    
    if (state.nextTrack) state.track = state.nextTrack.id;
    startRace({ newCup: false });
  });
  $('results-menu').addEventListener('click', () => {
    hide('results');
    if (state.session) { backToLobby(); return; }
    
    
    
    
    refreshBoard();
    show('menu');
  });
  $('pause-resume').addEventListener('click', resumeRace);
  $('pause-quit').addEventListener('click', quitRace);
  $('pause-btn').addEventListener('click', pauseRace);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!state.race) return;
    if ($('pause').classList.contains('show')) resumeRace(); else pauseRace();
  });

  
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.race && !$('pause').classList.contains('show')) pauseRace();
  });

  
  
  
  state.lobbyUi = createLobbyUi({
    tracks: TRACKS,
    difficulties: Object.values(DIFFICULTIES),
    onClaim: (id) => { state.character = id; state.session?.claim(id); },
    onReady: (flag) => state.session?.ready(flag),
    onSettings: (patch) => state.session?.settings(patch),
    onStart: () => state.session?.start(),
    onLeave: leaveRoom,
  });

  window.__fkBooted = true;
  $('boot-gate')?.remove();

  
  
  const invite = joinIdFromLocation(location.href);
  if (invite) {
    $('join-note').textContent = 'Joining room ' + invite + '\u2026';
    show('menu');
    openRoom('join', invite);
    return;
  }
  show('menu');
}













async function openRoom(mode, hostId = null) {
  if (state.session) return;
  $('host-btn').disabled = true;
  if (mode === 'host') $('join-note').textContent = 'Opening a room\u2026';
  let session;
  try {
    session = await createSession({
      mode,
      hostId,
      name: null,
      characterId: state.character,
      settings: {
        trackId: state.track,
        difficulty: state.difficulty,
        laps: state.laps,
        fieldSize: state.field,
      },
    });
  } catch (err) {
    $('join-note').textContent = 'Could not open the room: ' + err.message
      + '. You can still race the bots.';
    $('host-btn').disabled = false;
    return;
  }
  state.session = session;
  $('host-btn').disabled = false;
  $('join-note').textContent = '';

  const shareLink = shareLinkFor(location.href, session.myId);
  const paint = (note) => state.lobbyUi.render(session.lobby, {
    myId: session.myId, isHost: session.isHost, shareLink, note,
  });

  session.addEventListener('lobby', () => paint());
  session.addEventListener('peer-joined', () => paint());
  session.addEventListener('peer-left', () => paint());
  session.addEventListener('host-changed', (e) => paint(e.detail.iAmHost
    ? 'The host left. You are the host now.'
    : 'The host left. Somebody else has taken over.'));
  session.addEventListener('net-error', (e) => paint('Network: ' + e.detail.message));
  session.addEventListener('start', (e) => startRace({ net: e.detail, newCup: true }));

  if (session.isHost) {
    
    
    
    
    try { window.history.replaceState({}, '', shareLink); } catch {  }
  }
  hide('menu');
  show('lobby');
  paint(session.isHost ? null : 'Connecting\u2026');
}


function backToLobby() {
  if (!state.session) { show('menu'); return; }
  hide('hud');
  hide('touch-hints');
  if (state.race) { state.race.dispose(); state.race = null; }
  state.session.reopen();
  state.lobbyUi.render(state.session.lobby, {
    myId: state.session.myId,
    isHost: state.session.isHost,
    shareLink: shareLinkFor(location.href, state.session.myId),
  });
  show('lobby');
}

function leaveRoom() {
  if (state.race) { state.race.dispose(); state.race = null; }
  state.session?.destroy();
  state.session = null;
  hide('lobby');
  hide('hud');
  
  
  
  try {
    const url = new URL(location.href);
    url.searchParams.delete('join');
    window.history.replaceState({}, '', url.toString());
  } catch {  }
  $('join-note').textContent = '';
  show('menu');
}





function buildCharacterGrid() {
  const root = $('char-grid');
  root.innerHTML = '';
  for (const c of CHARACTERS) {
    const bars = statBars(c);
    const el = document.createElement('button');
    el.className = 'char-card';
    el.dataset.id = c.id;
    el.innerHTML = `
      <span class="char-swatch" style="background:${hex(c.tint)}"></span>
      <span class="char-name">${c.name}</span>
      <span class="char-species">${c.species}</span>
      <span class="char-blurb">${c.blurb}</span>
      <span class="stats">
        ${bar('Speed', bars.speed)}
        ${bar('Accel', bars.accel)}
        ${bar('Turn', bars.handling)}
        ${bar('Grip', bars.grip)}
        ${bar('Weight', bars.weight)}
      </span>`;
    el.addEventListener('click', () => {
      state.character = c.id;
      syncSelection();
    });
    root.appendChild(el);
  }
}

const bar = (label, v) => `<span class="stat"><i>${label}</i><b><u style="width:${Math.round(Math.max(0.06, v) * 100)}%"></u></b></span>`;

function buildTrackGrid() {
  const root = $('track-grid');
  root.innerHTML = '';
  for (const t of TRACKS) {
    const locked = isLocked(state.progress, t);
    const rec = trackRecord(state.progress, t.id);
    const el = document.createElement('button');
    el.className = `track-card${locked ? ' locked' : ''}`;
    el.dataset.id = t.id;
    el.innerHTML = `
      <span class="track-thumb theme-${t.theme}">${trackThumb(t)}</span>
      <span class="track-name">${t.name}${locked ? ' <em>locked</em>' : ''}</span>
      <span class="track-tag">${locked ? 'Finish on the podium on any track to open this one.' : t.tagline}</span>
      <span class="track-rec">${
  rec.races
    ? `Best lap ${formatTime(rec.bestLap)} &middot; best finish ${ordinal(rec.bestPosition)} &middot; ${rec.races} race${rec.races === 1 ? '' : 's'}${rec.bestPoints ? ` &middot; ${formatPoints(rec.bestPoints)}` : ''}`
    : 'Not raced yet'
}</span>`;
    if (!locked) {
      el.addEventListener('click', () => { state.track = t.id; syncSelection(); });
    }
    root.appendChild(el);
  }
}









function trackThumb(track) {
  const xs = track.control.map((p) => p.x);
  const zs = track.control.map((p) => p.z);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const scale = Math.min(86 / spanX, 52 / spanZ);
  const pts = track.control.map((p) => {
    const x = 50 + (p.x - (minX + maxX) / 2) * scale;
    
    
    const y = 32 - (p.z - (minZ + maxZ) / 2) * scale;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg viewBox="0 0 100 64" aria-hidden="true">
    <polygon points="${pts}" fill="none" stroke="rgba(28,26,23,0.55)" stroke-width="7"
             stroke-linejoin="round"/>
    <polygon points="${pts}" fill="none" stroke="${hex(PALETTE.roadLight)}" stroke-width="4"
             stroke-linejoin="round"/>
  </svg>`;
}

function buildDifficultyRow() {
  const root = $('difficulty-row');
  root.innerHTML = '';
  for (const d of Object.values(DIFFICULTIES)) {
    const el = document.createElement('button');
    el.className = 'chip';
    el.dataset.id = d.id;
    el.textContent = d.label;
    el.addEventListener('click', () => { state.difficulty = d.id; syncSelection(); });
    root.appendChild(el);
  }
}

function buildLapRow() {
  const root = $('lap-row');
  root.innerHTML = '';
  for (const n of [2, 3, 5]) {
    const el = document.createElement('button');
    el.className = 'chip';
    el.dataset.id = String(n);
    el.textContent = `${n} laps`;
    el.addEventListener('click', () => { state.laps = n; syncSelection(); });
    root.appendChild(el);
  }
}








function buildItemLegend() {
  const root = $('item-legend');
  if (!root) return;
  const items = [
    ['cowpat', 'Cowpat', 'Drop it. Whoever hits it spins.'],
    ['egg', 'Egg', 'Fires straight. Hold back to throw it behind.'],
    ['rooster', 'Rooster', 'Homes in on the kart ahead of you.'],
    ['feedbag', 'Feed Bag', 'A short burst of speed.'],
    ['haybale', 'Hay Bale', 'Drop it. Bounces whoever hits it.'],
    ['scarecrow', 'Scarecrow', 'Blocks the next hit, whatever it is.'],
    ['thunder', 'Thunderstorm', 'Squashes everyone in front of you.'],
    ['tractor', 'Runaway Tractor', 'Last place only. Drives itself, fast.'],
  ];
  root.innerHTML = '';
  for (const [id, name, desc] of items) {
    const wrap = document.createElement('div');
    wrap.className = 'legend-item';
    const canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 48;
    drawItemIcon(canvas.getContext('2d'), id, 48);
    wrap.appendChild(canvas);
    const text = document.createElement('div');
    text.innerHTML = `<b>${name}</b><span>${desc}</span>`;
    wrap.appendChild(text);
    root.appendChild(wrap);
  }
}

function syncSelection() {
  for (const el of document.querySelectorAll('.char-card')) {
    el.classList.toggle('on', el.dataset.id === state.character);
  }
  for (const el of document.querySelectorAll('.track-card')) {
    el.classList.toggle('on', el.dataset.id === state.track);
  }
  for (const el of $('difficulty-row').children) {
    el.classList.toggle('on', el.dataset.id === state.difficulty);
  }
  for (const el of $('lap-row').children) {
    el.classList.toggle('on', el.dataset.id === String(state.laps));
  }
}




















function startRace({ newCup = false, net = null } = {}) {
  hide('menu');
  hide('lobby');
  hide('results');
  show('hud');
  if (isTouchDevice()) show('touch-hints');

  
  
  
  const settings = net?.settings ?? null;

  
  
  
  
  if (newCup || !state.rotationRng) {
    state.progress = resetCup(state.progress);
    saveProgress(safeLocalStorage(), state.progress);
    state.rotationRng = new SeededRng((Date.now() & 0x7fffffff) || 1);
  }

  if (state.race) state.race.dispose();
  state.race = createRace({
    canvas: $('scene'),
    hudRoot: document.body,
    minimapCanvas: $('minimap'),
    trackId: settings?.trackId ?? state.track,
    characterId: state.character,
    difficulty: settings?.difficulty ?? state.difficulty,
    laps: settings?.laps ?? state.laps,
    fieldSize: settings?.fieldSize ?? state.field,
    muted: state.muted,
    session: net ? state.session : null,
    seats: net?.seats ?? null,
    resume: net?.resume ?? null,
    
    
    seed: net?.seed ?? ((Date.now() & 0x7fffffff) || 1),
    onFinish: showResults,
  });
  state.race.start();
  trackEvent('game_start', {
    track: settings?.trackId ?? state.track,
    character: state.character,
    difficulty: settings?.difficulty ?? state.difficulty,
    laps: settings?.laps ?? state.laps,
    multiplayer: !!net,
  });
}

function pauseRace() {
  if (!state.race) return;
  state.race.stop();
  show('pause');
}

function resumeRace() {
  hide('pause');
  if (state.race) state.race.start();
}

function quitRace() {
  hide('pause');
  hide('hud');
  hide('touch-hints');
  if (state.session) {
    
    
    
    
    
    backToLobby();
    return;
  }
  if (state.race) { state.race.dispose(); state.race = null; }
  show('menu');
  buildTrackGrid();
  syncSelection();
  refreshBoard();
}

function showResults(result) {
  hide('hud');
  hide('touch-hints');

  
  
  
  
  
  
  
  
  
  
  
  
  const scored = scoreRace(result.table, { fieldSize: result.fieldSize });
  const model = podium(scored, { playerId: 'player' });
  renderPodium($('podium'), model, winnerAnnouncement(model));

  
  
  
  
  
  
  
  
  
  
  const { progress, notable } = recordRace(state.progress, {
    trackId: result.trackId,
    characterId: result.characterId,
    position: result.position,
    fieldSize: result.fieldSize,
    bestLap: result.bestLap,
    raceTime: result.raceTime,
    difficulty: result.difficulty,
    points: model.playerRow?.points ?? 0,
    cupRows: model.playerRow ? [model.playerRow] : null,
  });
  state.progress = progress;
  saveProgress(safeLocalStorage(), progress);

  $('results-title').textContent =
    `${ordinal(result.position)} of ${result.fieldSize} · ${formatPoints(model.playerRow?.points ?? 0)}`;
  $('results-title').className = result.position === 1 ? 'win' : (result.position <= 3 ? 'podium' : '');

  $('results-table').innerHTML = scored.map((r) => `
    <tr class="${r.isPlayer ? 'me' : ''}">
      <td class="pos">${r.position}</td>
      <td><span class="dot" style="background:${hex(r.tint ?? PALETTE.ceiling)}"></span>${r.name}</td>
      <td class="time">${r.finished ? formatTime(r.time) : 'DNF'}</td>
      <td class="time">${r.bestLap != null ? formatTime(r.bestLap) : '--'}</td>
      <td class="pts">${r.points}${r.fastestLap ? ' <em>FL</em>' : ''}</td>
    </tr>`).join('');

  $('results-notable').innerHTML = notable.length
    ? notable.map((n) => {
      if (n.type === 'bestLap') return `<li class="good">New best lap &mdash; ${formatTime(n.value)}</li>`;
      if (n.type === 'bestRace') return `<li class="good">New best race &mdash; ${formatTime(n.value)}</li>`;
      if (n.type === 'bestPosition') return `<li class="good">Best finish here &mdash; ${ordinal(n.value)}</li>`;
      if (n.type === 'bestPoints') return `<li class="good">Best points here &mdash; ${formatPoints(n.value)}</li>`;
      return '';
    }).join('')
    : '';

  
  
  
  
  
  
  
  
  
  const cupTable = cupStandings(state.progress.cup);
  const cupRow = cupTable.find((r) => r.id === 'player');
  renderCupLine($('results-cup'), {
    races: state.progress.cup?.races ?? 0,
    points: cupRow?.points ?? 0,
    
    
    
    
    position: cupTable.length > 1 ? (cupRow?.position ?? null) : null,
  });
  state.nextTrack = pickNextTrack(
    state.rotationRng, state.progress, TRACKS,
    
    
    
    
    { exclude: lastCupTrack(state.progress) ?? result.trackId },
  );
  renderNextUp($('results-next'), state.nextTrack);

  
  
  const wasLocked = TRACKS.some((t) => t.locked);
  buildTrackGrid();
  const nowOpen = wasLocked && TRACKS.some((t) => t.locked && !isLocked(state.progress, t));
  $('results-unlock').textContent = nowOpen ? 'Frostfield Loop unlocked.' : '';

  trackEvent('match_end', {
    track: result.trackId, position: result.position, field: result.fieldSize,
  });
  publishRace();
  show('results');
}


























function publishRace() {
  if (!isGlobalEnabled()) return;
  const rows = kartPublishRows(state.progress, {
    name: state.name, character: state.character,
  });
  if (!rows.length) return;
  try {
    Promise.resolve(publishScores(rows))
      
      
      .then(() => { state.boardRows = null; refreshBoard(); })
      .catch(() => {});
  } catch (_) {  }
}










function refreshBoard() {
  const root = $('global-board');
  if (!root) return;
  const paint = () => renderKartBoard(root, {
    rows: state.boardRows,
    globalEnabled: isGlobalEnabled(),
    myName: state.name,
    deviceRaces: state.progress?.totalRaces ?? 0,
    deviceWins: state.progress?.totalWins ?? 0,
  });
  paint();
  if (!isGlobalEnabled() || state.boardRows !== null) return;
  
  
  
  fetchTopPlayers(10, undefined, { orderField: 'wins' })
    .then((rows) => { state.boardRows = rows ?? []; paint(); })
    .catch(() => { state.boardRows = []; paint(); });
}









function buildNameField() {
  const input = $('player-name');
  if (!input) return;
  input.value = state.name;
  input.addEventListener('input', () => {
    state.name = input.value;
    localStorageSet('farmykart.name', state.name);
  });
  
  
  input.addEventListener('blur', refreshBoard);
}





function toggleMute() {
  state.muted = !state.muted;
  localStorageSet('farmykart.muted', state.muted ? '1' : '0');
  if (state.race) state.race.setMuted(state.muted);
  syncMuteButton();
}

function syncMuteButton() {
  const b = $('mute-btn');
  b.textContent = state.muted ? 'Sound off' : 'Sound on';
  b.setAttribute('aria-pressed', String(state.muted));
}

const show = (id) => $(id)?.classList.add('show');
const hide = (id) => $(id)?.classList.remove('show');









function safeLocalStorage() {
  try {
    window.localStorage.setItem('farmykart.probe', '1');
    window.localStorage.removeItem('farmykart.probe');
    return window.localStorage;
  } catch {
    return null;
  }
}
const localStorageGet = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const localStorageSet = (k, v) => { try { window.localStorage.setItem(k, v); } catch {  } };

boot();
