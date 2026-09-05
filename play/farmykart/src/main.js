







import { initAnalytics, trackEvent } from 'arbelo/analytics';
import { CHARACTERS, characterById, DEFAULT_CHARACTER } from 'arbelo/kartTuning';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from 'arbelo/kartAi';
import { formatTime, ordinal } from 'arbelo/raceProgress';
import {
  loadProgress, saveProgress, recordRace, trackRecord, isLocked, resetCup, lastCupTrack,
  cupUnlockLine,
} from 'arbelo/raceStats';





import {
  scoreRace, podium, winnerAnnouncement, cupStandings, formatPoints,
} from 'arbelo/raceScore';
import { pickNextTrack } from 'arbelo/trackRotation';
import { kartPublishRows } from 'arbelo/kartLeaderboard';
import { publishScores, fetchTopPlayers, isGlobalEnabled } from 'arbelo/leaderboard';



import { recordSession, syncFromCloud, accountSummary } from '../../../web-engine/account/account.js';
import { levelFrom, totalsFromSummary } from '../../../web-engine/account/playerLevel.js';
import { sessionLines } from '../../../web-engine/account/accountBadge.js';
import { mountProfilePanel } from '../../../web-engine/account/accountUi.js';
import { shareCard } from '../../../web-engine/account/shareCard.js';
import { localDayNumber } from '../../../web-engine/account/dayKey.js';
import { startVersionChecker } from 'arbelo/updater';
import { SeededRng } from 'arbelo/rng';
import { renderPodium, renderCupLine, renderNextUp } from './ui/podium.js';
import { createShowcaseView, freshCanvas } from './render/showcase.js';
import { setMusicMuted, musicClock, musicNow } from './audio/music.js';
import { createLobbyMusic } from '../../../web-engine/audio/lobbyMusic.js';
import { EMOTES, EMOTE_TIME } from 'arbelo/emotes';
import { renderKartBoard } from './ui/kartBoard.js';

import { defaultAssist } from 'arbelo/steerAssist';
import {
  TRACKS, DEFAULT_TRACK, CUPS, DEFAULT_CUP, cupById, tracksInCup, cupLocked, cupOf,
} from './tracks/tracks.js';
import { trackBadges, factsLine, trackPreviewShape } from './tracks/trackFacts.js';
import { createRace } from './game.js';
import { createSession, joinIdFromLocation, shareLinkFor } from './net/session.js';
import { createLobbyUi } from './ui/lobby.js';
import { driverPanelHtml } from './ui/driverPanel.js';
import { drawItemIcon } from './render/itemMesh.js';
import { hex, PALETTE } from './palette.js';
import { showTouchOverlay } from './input/controls.js';
import { createAudio, installAudioUnlock, setMuted as setAudioMuted, audioState, SFX } from './audio/sfx.js';







import { mountSoundToggle, soundLabel, syncSoundToggles } from '../../shared/ui/muteButton.js';



import { pageContexts } from '../../../web-engine/render/contextBudget.js';

const $ = (id) => document.getElementById(id);

const state = {
  
  
  
  accountLines: [],
  track: DEFAULT_TRACK,
  
  
  
  
  
  cup: DEFAULT_CUP,
  character: DEFAULT_CHARACTER,
  difficulty: DEFAULT_DIFFICULTY,
  laps: 3,
  field: 8,
  assist: true,
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











const audio = createAudio();

function boot() {
  initAnalytics();
  installAudioUnlock(audio);
  armMenuBed();
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  window.__fkAudio = () => ({
    ...audioState(audio), musicClock: musicClock(audio), musicNow: musicNow(audio),
    
    
    lobby: lobbyMusic ? lobbyMusic.state() : null,
  });
  state.progress = loadProgress(safeLocalStorage());
  
  
  
  try { Promise.resolve(syncFromCloud()).catch(() => {}); } catch (_) {  }
  
  
  
  state.track = state.progress.lastTrack ?? DEFAULT_TRACK;
  
  
  state.cup = cupOf(state.track);
  state.character = state.progress.lastCharacter ?? DEFAULT_CHARACTER;
  state.difficulty = state.progress.lastDifficulty ?? DEFAULT_DIFFICULTY;
  state.muted = localStorageGet('farmykart.muted') === '1';
  
  
  state.assist = defaultAssist(state.progress);
  state.name = localStorageGet('farmykart.name') ?? '';

  
  
  
  
  
  
  
  
  
  
  
  
  startVersionChecker({ label: 'A new version of Farmy Kart is available.' });

  buildCharacterShowcase();
  buildCupRow();
  buildTrackGrid();
  buildDifficultyRow();
  buildLapRow();
  buildAssistRow();
  buildItemLegend();
  
  
  
  
  
  
  
  
  syncSelection();
  
  
  mountMenuSoundToggles();
  syncMuteButton();
  buildNameField();
  refreshBoard();

  
  
  
  
  $('start-btn').addEventListener('click', () => startRace({ newCup: true }));
  $('host-btn').addEventListener('click', () => openRoom('host'));
  $('mute-btn').addEventListener('click', toggleMute);
  $('results-again').addEventListener('click', () => {
    hide('results');
    
    
    
    if (state.session) { backToLobby(); return; }
    
    
    
    
    if (state.nextTrack) {
      state.track = state.nextTrack.id;
      
      
      
      state.cup = cupOf(state.track);
    }
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

  
  
  
  window.addEventListener('mg-info-open', () => {
    if (state.race && !$('pause').classList.contains('show')) pauseRace();
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

  
  installHistoryRouter();
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  session.mesh.addEventListener('join-failed', (e) => {
    const traversal = e.detail?.stage === 'traversal';
    
    
    
    
    
    
    leaveRoom();
    show('menu');
    $('join-note').textContent = traversal
      ? 'Could not reach that room. Something on your network or theirs is blocking '
        + 'the direct connection - a different wifi, or a phone off wifi, usually '
        + 'gets through. You can race the bots in the meantime.'
      : 'Could not reach the matchmaking server. Check your connection and open the '
        + 'link again. You can race the bots in the meantime.';
  }, { once: true });

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
  
  
  
  state.lobbyUi?.dispose();
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



















let charView = null;

let charArrowsBound = false;

function buildCharacterShowcase() {
  let canvas = $('char-canvas');
  if (!canvas) return;
  
  
  
  
  
  
  
  
  if (charView && pageContexts.has(canvas.id)) return;
  if (charView) {
    charView = null;
    canvas = freshCanvas(canvas);
  }

  charView = createShowcaseView({
    canvas,
    
    
    
    backdrop: true,
    ids: CHARACTERS.map((c) => c.id),
    selected: state.character,
    onSelect: (id) => {
      
      
      state.character = id;
      syncCharacterInfo();
      
      
      
    },
  });

  
  
  
  
  
  
  if (!charArrowsBound) {
    charArrowsBound = true;
    $('char-prev').addEventListener('click', () => charView?.nudge(-1));
    $('char-next').addEventListener('click', () => charView?.nudge(+1));
  }
  syncCharacterInfo();
}







function syncCharacterInfo() {
  const root = $('char-info');
  if (!root) return;
  const c = characterById(state.character) ?? CHARACTERS[0];
  
  
  root.innerHTML = driverPanelHtml(c);
}














function buildCupRow() {
  const root = $('cup-row');
  if (!root) return;
  root.innerHTML = '';
  for (const c of CUPS) {
    const shut = cupLocked(c.id) && tracksInCup(c.id).every((t) => isLocked(state.progress, t));
    const el = document.createElement('button');
    el.className = `chip${shut ? ' locked' : ''}`;
    el.type = 'button';
    el.dataset.id = c.id;
    el.innerHTML = shut ? `${c.name}<em class="chip-lock">locked</em>` : c.name;
    el.addEventListener('click', () => {
      state.cup = c.id;
      
      
      
      const open = tracksInCup(c.id).filter((t) => !isLocked(state.progress, t));
      if (open.length && !open.some((t) => t.id === state.track)) state.track = open[0].id;
      buildTrackGrid();
      syncSelection();
    });
    root.appendChild(el);
  }
}











function syncCupNote() {
  const note = $('cup-note');
  if (!note) return;
  const cup = cupById(state.cup);
  const inCup = tracksInCup(cup.id);
  const shut = inCup.length > 0 && inCup.every((t) => isLocked(state.progress, t));
  note.classList.toggle('shut', shut);
  note.textContent = shut
    ? `${cup.name} opens when you finish on the podium — top three in any race, on any `
      + 'circuit. Have a look at what is in it.'
    : cup.blurb;
}

function buildTrackGrid() {
  const root = $('track-grid');
  root.innerHTML = '';
  
  
  
  for (const t of tracksInCup(state.cup)) {
    const locked = isLocked(state.progress, t);
    const rec = trackRecord(state.progress, t.id);
    const el = document.createElement('button');
    el.className = `track-card${locked ? ' locked' : ''}`;
    el.type = 'button';
    el.dataset.id = t.id;
    const badges = trackBadges(t).map((b) => `<span class="badge">${b}</span>`).join('');
    el.innerHTML = `
      <span class="track-thumb theme-${t.theme}">${trackThumb(t)}</span>
      <span class="track-name"><i class="track-pick" aria-hidden="true"></i>${t.name}${
  locked ? ' <em>locked</em>' : ''}</span>
      <span class="track-tag">${t.tagline}</span>
      ${badges ? `<span class="track-badges">${badges}</span>` : ''}
      <span class="track-facts">${factsLine(t)}</span>
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
  syncCupNote();
}












































function trackThumb(track) {
  const shape = trackPreviewShape(track);
  const path = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const { startLine: sl } = shape;
  return `<svg viewBox="0 0 ${shape.w} ${shape.h}" aria-hidden="true">
    <polygon points="${path(shape.ribbon)}" fill="${hex(PALETTE.roadDark)}"
             stroke="rgba(18,16,14,0.75)" stroke-width="3.2" stroke-linejoin="round"/>
    <polygon points="${path(shape.ribbon)}" fill="${hex(PALETTE.roadLight)}"
             stroke="none"/>
    ${shape.chasm.length > 2 ? `<polygon points="${path(shape.chasm)}"
             fill="${hex(PALETTE.water)}" stroke="none"/>` : ''}
    <line x1="${sl.a.x.toFixed(1)}" y1="${sl.a.y.toFixed(1)}"
          x2="${sl.b.x.toFixed(1)}" y2="${sl.b.y.toFixed(1)}"
          stroke="#f6f1e6" stroke-width="2.6" stroke-linecap="butt"/>
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

function buildAssistRow() {
  const root = $('assist-row');
  root.innerHTML = '';
  for (const [id, label] of [['on', 'Assist on'], ['off', 'Assist off']]) {
    const el = document.createElement('button');
    el.className = 'chip';
    el.dataset.id = id;
    el.textContent = label;
    el.addEventListener('click', () => {
      state.assist = id === 'on';
      
      
      
      state.progress = { ...state.progress, assist: state.assist, assistExplicit: true };
      saveProgress(safeLocalStorage(), state.progress);
      syncSelection();
    });
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











let podiumView = null;

function showPodiumStage(model) {
  const stage = $('podium-stage');
  const bar = $('emote-bar');
  if (!stage) return;

  if (podiumView) { podiumView.dispose(); podiumView = null; }
  const steps = (model.steps ?? []).filter((s) => s.row?.character);

  
  
  
  
  
  
  
  if (state.race?.ceremonyActive) {
    
    
    
    
    stage.hidden = true;
    stage.style.display = 'none';
    buildEmoteBar(model, steps);
    return;
  }
  
  
  
  if (steps.length < 2) { stage.hidden = true; bar.hidden = true; return; }
  stage.hidden = false;
  stage.style.display = '';

  const winnerAt = steps.findIndex((s) => s.place === 1);
  podiumView = createShowcaseView({
    canvas: $('podium-canvas'),
    ids: steps.map((s) => s.row.character),
    places: steps.map((s) => s.place),
    podium: true,
    
    selected: steps[Math.max(0, winnerAt)].row.character,
  });
  $('podium-prev').onclick = () => podiumView.nudge(-1);
  $('podium-next').onclick = () => podiumView.nudge(+1);

  buildEmoteBar(model, steps);
}












function buildEmoteBar(model, steps) {
  const bar = $('emote-bar');
  bar.innerHTML = '';
  const mine = steps.findIndex((s) => s.isPlayer);
  if (mine < 0) {
    
    
    bar.hidden = false;
    const hint = document.createElement('span');
    hint.className = 'emote-hint';
    hint.textContent = 'Finish in the top three to emote.';
    bar.appendChild(hint);
    return;
  }
  bar.hidden = false;
  for (const e of EMOTES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${e.icon} ${e.label}`;
    b.title = e.blurb;
    b.addEventListener('click', () => {
      
      
      if (state.race?.ceremonyActive) {
        state.race.ceremonyEmote(e.id);
        SFX.emote(audio, e.id);
        for (const btn of bar.querySelectorAll('button')) btn.disabled = true;
        setTimeout(() => {
          for (const btn of bar.querySelectorAll('button')) btn.disabled = false;
        }, EMOTE_TIME * 1000);
        return;
      }
      if (!podiumView) return;
      podiumView.emote(mine, e.id);
      SFX.emote(audio, e.id);
      
      
      for (const btn of bar.querySelectorAll('button')) btn.disabled = true;
      const wait = podiumView.emoteCooldown(mine);
      setTimeout(() => {
        for (const btn of bar.querySelectorAll('button')) btn.disabled = false;
      }, Math.max(200, wait * 1000));
    });
    bar.appendChild(b);
  }
}

function syncSelection() {
  
  
  
  
  if (charView && charView.selected() !== state.character) charView.select(state.character);
  syncCharacterInfo();
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  for (const el of $('cup-row').children) {
    el.classList.toggle('on', el.dataset.id === state.cup);
  }
  syncCupNote();
  for (const el of document.querySelectorAll('.track-card')) {
    el.classList.toggle('on', el.dataset.id === state.track);
  }
  for (const el of $('difficulty-row').children) {
    el.classList.toggle('on', el.dataset.id === state.difficulty);
  }
  for (const el of $('lap-row').children) {
    el.classList.toggle('on', el.dataset.id === String(state.laps));
  }
  for (const el of $('assist-row').children) {
    el.classList.toggle('on', el.dataset.id === (state.assist ? 'on' : 'off'));
  }
}




















function startRace({ newCup = false, net = null } = {}) {
  hide('menu');
  hide('lobby');
  hide('results');
  show('hud');
  
  
  
  
  
  
  if (showTouchOverlay()) show('touch-hints');

  
  
  
  const settings = net?.settings ?? null;

  
  
  
  
  if (newCup || !state.rotationRng) {
    state.progress = resetCup(state.progress);
    saveProgress(safeLocalStorage(), state.progress);
    state.rotationRng = new SeededRng((Date.now() & 0x7fffffff) || 1);
  }

  if (state.race) state.race.dispose();
  state.race = createRace({
    
    
    
    
    
    
    
    
    
    
    
    
    canvas: freshCanvas($('scene')),
    hudRoot: document.body,
    minimapCanvas: $('minimap'),
    trackId: settings?.trackId ?? state.track,
    characterId: state.character,
    difficulty: settings?.difficulty ?? state.difficulty,
    laps: settings?.laps ?? state.laps,
    fieldSize: settings?.fieldSize ?? state.field,
    muted: state.muted,
    audio,
    assist: state.assist,
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
  
  
  
  buildCupRow();
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
  showPodiumStage(model);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const preRace = state.progress;
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

  
  
  
  
  
  
  
  
  
  
  const won = result.position === 1;
  
  
  
  
  
  
  
  const onPodium = result.position <= 3 && result.fieldSize >= 4;
  const session = recordSession({
    gameId: 'farmykart',
    metrics: {
      races: 1,
      wins: won ? 1 : 0,
      podiums: onPodium ? 1 : 0,
      points: model.playerRow?.points ?? 0,
    },
    won,
    name: state.name,
  });
  state.accountLines = sessionLines(session.events);

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

  
  
  
  
  for (const line of state.accountLines ?? []) {
    const li = document.createElement('li');
    li.className = 'fk-account';
    li.textContent = line;
    $('results-notable').appendChild(li);
  }

  
  
  
  
  
  
  
  
  
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

  
  
  
  
  
  
  
  
  
  buildCupRow();
  buildTrackGrid();
  $('results-unlock').textContent = cupUnlockLine(preRace, state.progress,
    CUPS.map((c) => ({ ...c, tracks: tracksInCup(c.id) })));

  trackEvent('match_end', {
    track: result.trackId, position: result.position, field: result.fieldSize,
  });
  publishRace();
  
  
  
  
  
  
  
  hide('hud');
  hide('touch-hints');
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














function setMuted(muted) {
  state.muted = !!muted;
  
  
  
  setMusicMuted(audio, state.muted);
  menuBed()?.setMuted(state.muted);
  localStorageSet('farmykart.muted', state.muted ? '1' : '0');
  
  
  
  setAudioMuted(audio, state.muted);
  if (state.race) state.race.setMuted(state.muted);
  syncMuteButton();
}

function toggleMute() { setMuted(!state.muted); }

function syncMuteButton() {
  const b = $('mute-btn');
  
  
  
  
  b.textContent = soundLabel(state.muted);
  b.setAttribute('aria-pressed', String(state.muted));
  
  syncSoundToggles();
}











function mountMenuSoundToggles() {
  const read = () => state.muted;
  const write = (m) => setMuted(m);
  const pauseRow = document.querySelector('#pause .row');
  if (pauseRow) {
    mountSoundToggle({
      host: pauseRow, id: 'pause-sound', className: 'chip', isMuted: read, setMuted: write,
    });
  }
  
  
  const lobbyRow = document.getElementById('lobby-sound-row');
  if (lobbyRow) {
    mountSoundToggle({
      host: lobbyRow, id: 'lobby-sound', className: 'chip', isMuted: read, setMuted: write,
    });
  }
}










function refreshAccountPanel() {
  const host = $('account-panel');
  if (host) mountProfilePanel(host);
  refreshLoginChip();
  
  
  
  const share = $('share-day');
  if (share && !share.dataset.bound) {
    share.dataset.bound = '1';
    share.addEventListener('click', copyDayCard);
  }
}













function refreshLoginChip() {
  const chip = $('login-chip');
  if (!chip) return;
  let summary = null;
  try { summary = accountSummary(); } catch {  }
  chip.hidden = false;
  if (summary && summary.linked) {
    const lvl = levelFrom(totalsFromSummary(summary));
    chip.classList.add('level');
    chip.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = `Lv ${lvl.level}`;
    chip.appendChild(b);
    chip.appendChild(document.createTextNode(
      ` ${summary.name ? String(summary.name).slice(0, 14) : ''}`,
    ));
    chip.title = `${lvl.intoLevel}/${lvl.forNext} xp to level ${lvl.level + 1}`;
  } else {
    chip.classList.remove('level');
    chip.textContent = 'Log in';
    chip.title = 'Sign in to keep your progress everywhere';
  }
  if (!chip.dataset.bound) {
    chip.dataset.bound = '1';
    chip.addEventListener('click', () => {
      const panel = $('account-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}









function copyDayCard() {
  const note = $('share-day-note');
  try {
    const nowMs = Date.now();
    const s = accountSummary(nowMs);
    const text = shareCard({
      day: localDayNumber(nowMs),
      board: s.tasks,
      streak: s.streak,
      season: s.season,
    });
    navigator.clipboard.writeText(text).then(() => {
      if (note) note.textContent = 'Copied - paste it anywhere';
    }).catch(() => {
      
      
      if (note) note.textContent = text;
    });
  } catch {
    if (note) note.textContent = 'Play a round first';
  }
}




















let lobbyMusic = null;
function menuBed() {
  if (lobbyMusic) return lobbyMusic;
  if (!audio.ctx || !audio.master) return null;
  lobbyMusic = createLobbyMusic({
    ctx: audio.ctx,
    
    
    destination: audio.master,
    manifestUrl: new URL('../assets/music/music.json', import.meta.url),
  });
  lobbyMusic.setMuted(state.muted);
  return lobbyMusic;
}
















function armMenuBed() {
  const tryStart = () => {
    const onMenu = $('menu')?.classList.contains('show')
      || $('lobby')?.classList.contains('show');
    if (onMenu) menuBed()?.play();
  };
  for (const t of ['pointerdown', 'touchend', 'keydown', 'click']) {
    window.addEventListener(t, tryStart, true);
  }
}

const show = (id) => {
  $(id)?.classList.add('show');
  
  
  if (id === 'menu' || id === 'lobby' || id === 'results') markScreen(id);
  if (id === 'menu') refreshAccountPanel();
  
  
  
  
  
  
  
  
  
  if (id === 'menu') buildCharacterShowcase();
  
  
  
  if (id === 'menu' || id === 'lobby') menuBed()?.play();
  if (id === 'hud') menuBed()?.stop();
};
const hide = (id) => $(id)?.classList.remove('show');


























const SCREEN_STATE = 'fk-screen';

function markScreen(id) {
  try {
    const at = window.history.state;
    
    
    if (at && at[SCREEN_STATE] === id) return;
    window.history.pushState({ [SCREEN_STATE]: id }, '');
  } catch {  }
}

function routeTo(id) {
  
  
  if (id === 'lobby' && state.session) { hide('menu'); hide('results'); show('lobby'); return; }
  if (id === 'results') { hide('menu'); hide('hud'); hide('touch-hints'); show('results'); return; }
  hide('lobby'); hide('results'); hide('hud'); hide('touch-hints');
  if (state.race) { state.race.dispose(); state.race = null; }
  show('menu');
}

function installHistoryRouter() {
  try {
    
    
    window.history.replaceState({ [SCREEN_STATE]: 'menu' }, '');
    window.history.pushState({ [SCREEN_STATE]: 'menu' }, '');
  } catch {  }
  window.addEventListener('popstate', (e) => {
    const id = e.state && e.state[SCREEN_STATE];
    if (!id) {
      
      
      try { window.history.pushState({ [SCREEN_STATE]: 'menu' }, ''); } catch {  }
      routeTo('menu');
      return;
    }
    routeTo(id);
  });
}









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
