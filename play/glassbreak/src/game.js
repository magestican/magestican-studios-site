










import { createSim, snapshot, step, PH_CLEAR, PH_DONE, PH_FAIL, PH_PLAY, FIELD_W, PAR_TICKS, LANTERNS, MODE_GENTLE } from './sim/sim.js';
import { newCodeButton } from '../../../web-engine/net/stickyRoomCode.js';
import { PILOTS, SEAT_COLOURS, SEAT_CSS, SPEAKER_CSS } from './kindlers.js';
import { CAST, STORY } from './story.js';
import { IDLE } from './sim/input.js';
import { botInput } from './sim/bot.js';
import { WINDOWS, ACTS } from './sim/windows.js';
import { Painter } from './render.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { createLobbyMusic } from '../../../web-engine/audio/lobbyMusic.js';
import { uiSoundOn, setUiSound } from '../../../web-engine/brand/uiSound.js';
import { DUCK_CUES, MENU_CUES, MUSIC_TRACKS, SFX_GAINS, SFX_NAMES, SFX_TAKES, createCuePlayer, followSound, followTrack, menuCue, musicFor, musicVolume, scaledGains } from './sound.js';
import {
  Controls, EventFeed, SCR_END, SCR_FAIL, SCR_PAUSE, SCR_PLAY, SCR_SELECT, SCR_SETTINGS, SCR_STORY, SCR_TALLY, SCR_TITLE, StoryReader, portraitFor,
  TINT_CSS, feelFor, fitWithHud, parseLaunch, readProgress, recordClear, scenesBefore, screenFor, unlocked, windowLabel,
  writeProgress, readSettings, writeSettings, stepVolume, volumeGain, storyScenes, eraseTap, emptyProgress, launchHintShown,
} from './view.js';

import { reportMatch } from '../../../web-engine/progress/report.js';
import { emptyMarks, reportFor } from './report.js';
import { BACK, keyAction, padHeld, padPresses, pickNext } from './menuNav.js';
import { breakRate, popsFor, tallyPlan, tallyTimes } from './juice.js';

const $ = (id) => document.getElementById(id);
const store = (() => { try { return window.localStorage; } catch { return null; } })();
const memStore = { getItem: () => null, setItem: () => {} };

const launchOpts = parseLaunch(location.search);
let progress = readProgress(store || memStore);
let mode = launchOpts.mode !== 'normal' ? launchOpts.mode : progress.mode;
const cheat = launchOpts.stage !== null;


const autoPlay = (() => { try { return new URLSearchParams(location.search).has('bot'); } catch { return false; } })();
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
let settings = readSettings(store || memStore, reduceMotion);

const painter = new Painter($('c'));
const feed = new EventFeed();
const controls = new Controls();



const fxLevel = () => volumeGain(settings.sfx);
const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), SFX_NAMES, SFX_TAKES, Math.random, scaledGains(SFX_NAMES, SFX_GAINS, fxLevel));
const ui = createGameSfx(new URL('../assets/ui/', import.meta.url), MENU_CUES, {}, Math.random, scaledGains(MENU_CUES, {}, fxLevel));
const musicVol = musicVolume(createLobbyMusic, volumeGain(settings.music));
const music = createTrackMusic({ game: 'glassbreak', manifestUrl: new URL('../assets/music/music.json', import.meta.url), trackIds: MUSIC_TRACKS, createPlayer: musicVol.createPlayer });

const sounds = createCuePlayer((cue, e) => { sfx.play(cue, breakRate(e)); if (DUCK_CUES.has(cue)) music.duck(0.4, 600); });
function drawSound() {
  const on = uiSoundOn();
  for (const id of ['soundPause', 'setSound']) { $(id).textContent = on ? 'Sound: on' : 'Sound: off'; $(id).setAttribute('aria-pressed', String(on)); }
  
  $('sound').setAttribute('aria-pressed', String(on));
  $('sound').setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
}

let sim = null;        
let attract = null;    
let screen = SCR_TITLE;
let paused = false;
let hitstop = 0;
let lastPhase = -1, lastWi = -1;
let fit = fitWithHud(innerWidth, innerHeight);


function layout() {
  fit = fitWithHud(innerWidth, innerHeight);
  painter.resize(innerWidth, innerHeight, fit);
  const f = $('field');
  Object.assign(f.style, { left: `${fit.x}px`, top: `${fit.y}px`, width: `${fit.w}px`, height: `${fit.h}px` });
  document.documentElement.style.setProperty('--fs', String(fit.fs));
  
  document.documentElement.style.setProperty('--hudlift', `${fit.top}px`);
  
  document.documentElement.style.setProperty('--tintdrop', `${fit.bottom}px`);
}
addEventListener('resize', layout);
layout();


const SCREENS = { [SCR_TITLE]: 'title', [SCR_SELECT]: 'select', [SCR_PAUSE]: 'pause', [SCR_TALLY]: 'tally',
  [SCR_FAIL]: 'fail', [SCR_END]: 'end', [SCR_STORY]: 'story', [SCR_SETTINGS]: 'settings' };



const SUBMENUS = new Set([SCR_SELECT, SCR_SETTINGS]);
let opener = null; 
function show(scr) {
  const prev = screen;
  const a = document.activeElement;
  if (SUBMENUS.has(scr) && !SUBMENUS.has(prev)) opener = SCREENS[prev] && a && $(SCREENS[prev]).contains(a) ? { scr: prev, el: a } : null;
  screen = scr;
  for (const [k, id] of Object.entries(SCREENS)) $(id).hidden = k !== scr;
  const r = run();
  const inRun = r && (scr === SCR_PLAY || scr === SCR_PAUSE || scr === SCR_TALLY || scr === SCR_FAIL);
  const flying = !net || (net.room && net.room.seat !== null);
  $('hud').hidden = !inRun;
  $('tints').hidden = !(r && scr === SCR_PLAY && flying);
  $('hint').hidden = !(scr === SCR_PLAY && flying && launchHintShown(r, net ? net.room?.seat : 0));
  if (scr === SCR_TITLE) drawStart();
  
  
  const focus = { [SCR_TITLE]: 'start', [SCR_PAUSE]: 'resume', [SCR_TALLY]: 'next', [SCR_END]: 'endTitle', [SCR_STORY]: 'storyNext',
    [SCR_SETTINGS]: 'settingsBack', [SCR_FAIL]: 'failSelect' }[scr];
  
  
  $('pauseBtn').style.visibility = scr === SCR_PLAY ? '' : 'hidden';
  const back = SUBMENUS.has(prev) && opener?.scr === scr ? opener.el : null;
  const backOk = back && back.isConnected && !back.disabled && back.offsetParent !== null;
  const el = backOk ? back : focus ? $(focus) : scr === SCR_SELECT ? selectPrimary() : focusables()[0];
  if (el) el.focus({ preventScroll: scr !== SCR_SELECT });
  else if (scr === SCR_PLAY) document.activeElement?.blur?.();
}



function drawStart() {
  const wi = cheat ? launchOpts.stage : Math.min(progress.reached, WINDOWS.length - 1);
  const back = !cheat && progress.reached > 0;
  $('startLabel').textContent = back ? 'Continue' : 'Start';
  const l = windowLabel(wi);
  $('startWhere').textContent = back ? `${l.act} · ${l.name}` : '';
}





let navMode = false;
function focusables() {
  const id = SCREENS[screen];
  if (!id) return [];
  return [...$(id).querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null);
}
function selectPrimary() {
  const list = [...$('acts').querySelectorAll('button')];
  const wi = Math.min(progress.reached, list.length - 1);
  return list[wi] && !list[wi].disabled ? list[wi] : list.find((b) => !b.disabled);
}
function navMove(dir) {
  const list = focusables();
  if (!list.length) return;
  const from = list.indexOf(document.activeElement);
  const rects = list.map((b) => { const q = b.getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; });
  const i = pickNext(rects, from, dir);
  if (i < 0) return;
  if (i !== from) {
    list[i].focus({ preventScroll: true });
    list[i].scrollIntoView?.({ block: 'nearest' });
    if (uiSoundOn()) ui.play('focus');
  } else markLit(list[i]);
}
function navConfirm() {
  const list = focusables();
  const a = document.activeElement;
  (list.includes(a) ? a : list[0])?.click();
}
function navBack() {
  const id = BACK[SCREENS[screen]];
  if (id && $(id) && !$(id).hidden) $(id).click();
}
function markLit(el) {
  for (const x of document.querySelectorAll('.lit')) if (x !== el) x.classList.remove('lit');
  if (el && navMode) el.classList.add('lit');
}
document.addEventListener('focusin', (e) => markLit(e.target.closest?.('button') || null));
addEventListener('pointerdown', () => { navMode = false; markLit(null); }, true);

function startRun(wi) {
  sim = createSim({ seed: (Date.now() & 0xffff) | 1, gentle: mode === 'gentle', hard: mode === 'hard', stage: wi });
  attract = null;
  feed.reset();
  painter.clearFx();
  paused = false; hitstop = 0; lastPhase = -1; lastWi = -1;
  controls.x = FIELD_W / 2;
  show(SCR_PLAY);
}

function toTitle() {
  sim = null; paused = false;
  startAttract();
  show(SCR_TITLE);
}

function startAttract() {
  attract = createSim({ seed: 7 });
  feed.reset();
  painter.clearFx();
}

function setMode(m) {
  mode = m;
  progress = { ...progress, mode: m };
  writeProgress(store || memStore, progress);
  for (const b of $('modes').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
}

function buildSelect() {
  const box = $('acts');
  box.textContent = '';
  ACTS.forEach((act, ai) => {
    const sec = document.createElement('div');
    sec.className = 'act';
    const h = document.createElement('h3');
    h.textContent = `${ai + 1}. ${act.name}`;
    sec.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'grid';
    WINDOWS.forEach((w, wi) => {
      if (w.act !== ai) return;
      const b = document.createElement('button');
      const open = cheat || unlocked(progress, wi);
      b.disabled = !open;
      if (w.boss) b.classList.add('boss');
      b.textContent = open ? w.name : 'Locked';
      const st = document.createElement('small');
      const n = progress.stars[wi] || 0;
      
      
      const nextLocked = !open && (wi === 0 || cheat || unlocked(progress, wi - 1));
      st.textContent = open ? '★'.repeat(n) + '☆'.repeat(3 - n) : nextLocked ? `Clear ${WINDOWS[wi - 1]?.name ?? ''}` : '';
      if (!open) b.setAttribute('aria-label', `Locked: clear ${WINDOWS[wi - 1]?.name ?? 'the window before'} first`);
      b.appendChild(st);
      b.addEventListener('click', () => startRun(wi));
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    box.appendChild(sec);
  });
}

function showSelect() { buildSelect(); show(SCR_SELECT); }

function banner(wi) {
  const l = windowLabel(wi);
  $('bannerAct').textContent = l.act;
  $('bannerName').textContent = l.name;
  const b = $('banner');
  
  const boss = !!(WINDOWS[wi] && WINDOWS[wi].boss);
  b.classList.toggle('boss', boss);
  b.classList.add('on');
  clearTimeout(banner.t);
  banner.t = setTimeout(() => b.classList.remove('on'), boss ? 3200 : 2200);
}




let tallyTimers = [];
function fillTally(s, bestBefore = 0) {
  for (const t of tallyTimers) clearTimeout(t);
  tallyTimers = [];
  const plan = tallyPlan(s, bestBefore, PAR_TICKS(s.wi));
  $('tallyName').textContent = `${WINDOWS[s.wi].name} — clear`;
  $('tallyStars').innerHTML = '';
  const secs = Math.round((s.phT - s.wt) / 60);
  const rows = [
    ['Time', `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`],
    ['Par', `${Math.round(PAR_TICKS(s.wi) / 60)} s`],
    ['Lanterns kept', s.mode === MODE_GENTLE ? '—' : `${s.lanterns} / ${LANTERNS[s.mode]}`],
    ['Longest chain', String(s.stats.maxChain)],
    ['Light freed', s.light],
  ];
  const at = tallyTimes(plan.stars.length, rows.length, reduceMotion);
  plan.stars.forEach((st, i) => {
    const cell = document.createElement('div');
    cell.className = st.earned ? 'star' : 'star off';
    const glyph = document.createElement('span'); glyph.textContent = '★'; glyph.setAttribute('aria-hidden', 'true');
    const why = document.createElement('small'); why.textContent = st.why;
    cell.append(glyph, why);
    cell.setAttribute('aria-label', `${st.why}: ${st.earned ? 'earned' : 'missed'}`);
    $('tallyStars').appendChild(cell);
    tallyTimers.push(setTimeout(() => {
      cell.classList.add('in');
      if (st.earned) sfx.play('break', 2 ** ((i * 4) / 12));
    }, at.stars[i]));
  });
  $('tallyRows').innerHTML = '';
  rows.forEach(([k, v], i) => {
    const a = document.createElement('span'); a.textContent = k;
    const b = document.createElement('b'); b.textContent = typeof v === 'number' ? '0' : v;
    a.className = 'row-in'; b.className = 'row-in';
    $('tallyRows').append(a, b);
    tallyTimers.push(setTimeout(() => {
      a.classList.add('in'); b.classList.add('in');
      if (typeof v !== 'number') return;
      if (!at.countMs) { b.textContent = v.toLocaleString(); return; }
      const t0 = performance.now();
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / at.countMs);
        b.textContent = Math.round(v * (1 - (1 - k) ** 3)).toLocaleString();
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, at.rows[i]));
  });
  $('tallyBest').hidden = true;
  if (plan.newBest) tallyTimers.push(setTimeout(() => { $('tallyBest').hidden = false; sfx.play('sun'); }, at.best));
  $('next').textContent = s.wi + 1 >= WINDOWS.length ? 'Daylight' : 'Next window';
}

function fillEnd(s) {
  const total = progress.stars.reduce((a, b) => a + b, 0);
  const rows = [['Windows broken', String(s.stats.windows)], ['Bosses', String(s.stats.bosses)],
    ['Stars', `${total} / ${WINDOWS.length * 3}`], ['Light freed', s.light.toLocaleString()]];
  $('endRows').innerHTML = '';
  for (const [k, v] of rows) {
    const a = document.createElement('span'); a.textContent = k;
    const b = document.createElement('b'); b.textContent = v;
    $('endRows').append(a, b);
  }
}





const seenScenes = new Set();
let reader = null, afterStory = null;
function openStory(ids, then) {
  const fresh = storyScenes(ids, settings).filter((id) => !seenScenes.has(id));
  if (!fresh.length) { then(); return; }
  fresh.forEach((id) => seenScenes.add(id));
  reader = new StoryReader(STORY, fresh);
  afterStory = then;
  show(SCR_STORY);
  paintStory();
}
function paintStory() {
  const l = reader?.line;
  if (!l) { const t = afterStory; reader = afterStory = null; t?.(); return; }
  $('storyScene').textContent = l.title;
  if (l.stage) { $('storyStage').textContent = l.stage; $('storySay').hidden = true; $('storyFace').hidden = true; return; }
  if (l.first) $('storyStage').textContent = '';
  $('storySay').hidden = false;
  $('storyWho').textContent = CAST.name[l.who] ?? l.who;
  $('storyWho').style.color = SPEAKER_CSS[l.who] ?? 'var(--brass)';
  $('storyText').textContent = l.text;
  const face = portraitFor(l.who, portraits);
  $('storyFace').hidden = !face;
  if (face) { $('storyFace').src = new URL(`../assets/portraits/${face}`, import.meta.url).href; $('storyFace').alt = CAST.name[l.who] ?? ''; }
}

let portraits = null;
fetch(new URL('../assets/portraits/portraits.json', import.meta.url)).then((r) => (r.ok ? r.json() : null))
  .then((m) => { portraits = m; }).catch(() => {});
function storyNext() { if (reader) { reader.next(); paintStory(); } }
$('story').addEventListener('click', storyNext);
$('storyNext').addEventListener('click', (e) => { e.stopPropagation(); storyNext(); });
$('storySkip').addEventListener('click', (e) => { e.stopPropagation(); reader?.skip(); paintStory(); });
$('titleName').textContent = CAST.heading.title;
$('blurb').textContent = CAST.message.blurb;


const SCR_LOBBY = 'lobby';
SCREENS[SCR_LOBBY] = 'lobby';
let net = null;        
let frozen = null;     


function run() { return net?.room?.session ? net.room.session.view() : sim; }

function toast(text, ms = 3500) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.t);
  if (ms > 0) toast.t = setTimeout(() => { t.hidden = true; }, ms);
}

const lobbyStatus = (text) => { $('lobbyStatus').textContent = text; };

function drawSeats(room) {
  const box = $('seats');
  box.textContent = '';
  for (let s = 0; s < PILOTS.length; s++) {
    const d = document.createElement('div');
    const taken = room.pilots[s] !== null;
    d.className = taken ? 'seat' : 'seat empty';
    d.style.setProperty('--c', SEAT_CSS[s]);
    const b = document.createElement('b');
    b.textContent = PILOTS[s].name;
    d.appendChild(b);
    d.append(taken ? (s === room.seat ? ' · you' : ' · ready') : ' · open');
    box.appendChild(d);
  }
}

async function openCoop() {
  if (net) return;
  net = { room: null };
  sim = null; paused = false;
  $('lobbyHead').textContent = 'Play with friends';
  $('links').hidden = true; $('coopStart').hidden = true;
  $('seats').textContent = '';
  lobbyStatus('Opening a room...');
  show(SCR_LOBBY);
  try {
    const { openRoom } = await import('./coop.js');
    const room = await openRoom({ onEvent: onRoomEvent });
    net.room = room;
    drawSeats(room);
    if (room.role === 'host') {
      $('joinLink').value = room.links.join;
      $('watchLink').value = room.links.watch;
      $('links').hidden = false;
      $('coopStart').hidden = false;
      
      if (screen === SCR_LOBBY) $('coopStart').focus({ preventScroll: true });
      newCode.show(true);
      lobbyStatus('Share the Play link with up to three friends. Friends can join a window already under way.');
    } else {
      $('lobbyHead').textContent = room.role === 'watch' ? 'Watching' : 'Joining';
      lobbyStatus('Connecting to the host...');
    }
  } catch (err) {
    lobbyStatus(`Could not open a room: ${err.message}`);
  }
}


function closeRoom() {
  try { net?.room?.mesh.destroy(); } catch {  }
  net = null;
  newCode.show(false);
}


function leaveCoop() {
  const url = new URL(location.href);
  url.search = '';
  location.href = url.toString();
}

function beginCoopRun(e) {
  attract = null; sim = null; frozen = null;
  feed.reset();
  painter.clearFx();
  paused = false; lastPhase = -1; lastWi = -1;
  controls.x = FIELD_W / 2;
  newCode.show(false);
  for (const id of ['restart', 'pauseSelect']) $(id).hidden = true;
  $('pauseTitle').textContent = 'Leave room';
  show(SCR_PLAY);
  if (net.room.seat === null) toast(e.why === 'full' ? 'The room is full, so you are watching.' : 'Watching. You join the next free seat once you have caught up.', 5000);
  else toast(`You are ${PILOTS[net.room.seat].name}.`, 3500);
}

function onRoomEvent(e) {
  const room = net?.room;
  if (!room) return;
  if (e.type === 'lobby' || e.type === 'pilots') {
    drawSeats(room);
    const n = room.pilots.filter((p) => p !== null).length;
    if (!room.started && room.role === 'host') lobbyStatus(n === 1 ? 'Share the Play link with up to three friends.' : `${n} Kindlers ready. Start when everyone is in.`);
  } else if (e.type === 'seat' && e.why === 'joined') {
    toast(`You are in: ${PILOTS[e.seat].name}.`, 4000);
  } else if (e.type === 'joined') {
    toast(`${PILOTS[e.seat].name} joined the window.`, 3000);
  } else if (e.type === 'retrying') {
    if (!room.started) lobbyStatus(`Looking for the host's room (try ${e.n + 1})...`);
  } else if (e.type === 'seat') {
    drawSeats(room);
    if (e.seat === null) lobbyStatus(e.why === 'late' ? 'The window has started: you watch, then join.' : e.why === 'full' ? 'The room is full, so you are watching.' : 'You are watching.');
    else lobbyStatus(`You are ${PILOTS[e.seat].name}. The host starts the window.`);
  } else if (e.type === 'start') {
    beginCoopRun(e);
  } else if (e.type === 'unseated') {
    if (e.me) toast(e.why === 'away' ? 'You left the game, so you are watching. You play again when you are back.' : 'Your connection fell behind, so you are watching. You play again once it catches up.', 6000);
    else toast(e.why === 'away' ? 'A Kindler stepped away and is watching.' : 'A Kindler fell behind and is watching.');
  } else if (e.type === 'pause') {
    if (e.on) toast('The host stepped away. The window waits for them.', 0); else $('toast').hidden = true;
  } else if (e.type === 'desync') {
    console.warn('[glassbreak] desync', e);
    toast('Screens fell out of step. Start a new room.', 0);
  } else if (e.type === 'ended') {
    toast('The host left, so the room has closed.', 0);
  } else if (e.type === 'error') {
    if (room.started) toast(e.message, 5000); else lobbyStatus(e.message);
  }
}




const newCode = newCodeButton($('shareJoin'), {
  lang: document.documentElement.lang || 'en',
  onReset: async () => {
    if (!net?.room || net.room.role !== 'host' || net.room.started) return;
    const { forgetRoomCode } = await import('./coop.js');
    forgetRoomCode();
    closeRoom();
    openCoop();
  },
});
for (const id of ['Join', 'Watch']) {
  $(`share${id}`).addEventListener('click', async () => {
    const field = $(`${id.toLowerCase()}Link`);
    if (!field.value) return;
    const { shareLink } = await import('../../../web-engine/share/shareInvite.js');
    shareLink({ link: field.value, gameName: 'Emberpane', code: net?.room?.mesh.myId ?? null, button: $(`share${id}`), field });
  });
}
$('friends').addEventListener('click', () => openCoop());
$('coopStart').addEventListener('click', () => {
  const stage = cheat ? launchOpts.stage : Math.min(progress.reached, WINDOWS.length - 1);
  net?.room?.start({ gentle: mode === 'gentle', hard: mode === 'hard', stage });
});
$('lobbyLeave').addEventListener('click', () => { if (net?.room?.role === 'host' && !net.room.started) { closeRoom(); toTitle(); } else leaveCoop(); });


$('start').addEventListener('click', () => startRun(cheat ? launchOpts.stage : Math.min(progress.reached, WINDOWS.length - 1)));
$('toSelect').addEventListener('click', showSelect);
$('selectBack').addEventListener('click', () => (sim ? show(SCR_PAUSE) : show(SCR_TITLE)));
for (const b of $('modes').querySelectorAll('button')) b.addEventListener('click', () => setMode(b.dataset.mode));
$('pauseBtn').addEventListener('click', () => setPaused(true));
$('resume').addEventListener('click', () => setPaused(false));
$('restart').addEventListener('click', () => startRun(sim.wi));
$('pauseSelect').addEventListener('click', showSelect);
$('pauseTitle').addEventListener('click', () => (net ? leaveCoop() : toTitle()));
$('next').addEventListener('click', () => controls.next());
$('tallySelect').addEventListener('click', showSelect);
$('failSelect').addEventListener('click', showSelect);
$('failTitle').addEventListener('click', () => (net ? leaveCoop() : toTitle()));
$('endTitle').addEventListener('click', () => (net ? leaveCoop() : toTitle()));
for (const b of $('tints').querySelectorAll('button')) {
  b.addEventListener('pointerdown', (e) => { e.stopPropagation(); controls.setTint(Number(b.dataset.tint)); });
}



let settingsFrom = SCR_TITLE, eraseArmed = null, eraseTimer = 0;
function drawSettings() {
  const flag = (id, label, on) => { $(id).textContent = `${label}: ${on ? 'on' : 'off'}`; $(id).setAttribute('aria-pressed', String(on)); };
  flag('setShake', 'Screen shake', settings.shake);
  flag('setStory', 'Story scenes', settings.story);
  for (const k of ['music', 'sfx']) {
    const v = settings[k];
    $(k + 'Val').textContent = v ? v + '%' : 'Off';
    $(k + 'Bar').style.setProperty('--v', v + '%');
    $(k + 'Meter').dataset.off = v ? '0' : '1';
    $(k + 'Down').disabled = v <= 0;
    $(k + 'Up').disabled = v >= 100;
  }
  const armed = eraseArmed !== null;
  $('setErase').textContent = armed ? 'Tap again to erase' : 'Erase progress';
  $('setErase').dataset.armed = armed ? '1' : '0';
  drawSound();
}
function openSettings(from) { settingsFrom = from; eraseArmed = null; drawSettings(); show(SCR_SETTINGS); }
function saveSettings(next) { settings = next; writeSettings(store || memStore, settings); drawSettings(); }
$('toSettings').addEventListener('click', () => openSettings(SCR_TITLE));
$('pauseSettings').addEventListener('click', () => openSettings(SCR_PAUSE));
$('settingsBack').addEventListener('click', () => show(settingsFrom === SCR_PAUSE && run() ? SCR_PAUSE : SCR_TITLE));
$('setShake').addEventListener('click', () => saveSettings({ ...settings, shake: !settings.shake }));
$('setStory').addEventListener('click', () => saveSettings({ ...settings, story: !settings.story }));

for (const k of ['music', 'sfx']) {
  for (const [id, dir] of [[k + 'Down', -1], [k + 'Up', 1]]) {
    $(id).addEventListener('click', () => {
      const was = document.activeElement;
      saveSettings({ ...settings, [k]: stepVolume(settings[k], dir) });
      if (k === 'music') musicVol.set(volumeGain(settings.music));
      
      if (was === $(id) && $(id).disabled) $(k + (dir < 0 ? 'Up' : 'Down')).focus();
    });
  }
}
$('setErase').addEventListener('click', () => {
  const t = eraseTap(eraseArmed, performance.now());
  eraseArmed = t.armedAt;
  clearTimeout(eraseTimer);
  if (t.erase) {
    progress = { ...emptyProgress(), mode };
    writeProgress(store || memStore, progress);
    toast('Progress erased', 2000);
  } else eraseTimer = setTimeout(() => { eraseArmed = null; drawSettings(); }, 4000);
  drawSettings();
});

function setPaused(p) {
  
  
  const r = run();
  if (!r || r.phase !== PH_PLAY) return;
  paused = p;
  show(p ? SCR_PAUSE : SCR_PLAY);
}

addEventListener('keydown', (e) => {
  if (screen === SCR_PLAY) {
    if (e.code === 'Escape' || e.code === 'KeyP') { setPaused(true); return; }
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    controls.key(e.code, true);
    return;
  }
  
  if (screen === SCR_PAUSE && e.code === 'KeyP') { setPaused(false); return; }
  const act = keyAction(e.code);
  if (!act) return;
  if (e.target?.tagName === 'INPUT' && (act === 'left' || act === 'right' || act === 'back')) return;
  e.preventDefault();
  navMode = true;
  if (act === 'back') { if (!e.repeat) navBack(); return; }
  if (act === 'confirm') { if (!e.repeat) navConfirm(); return; }
  navMove(act);
});
addEventListener('keyup', (e) => controls.key(e.code, false));
addEventListener('blur', () => { controls.keys.clear(); setPaused(true); });
document.addEventListener('visibilitychange', () => { net?.room?.setHidden(document.hidden); if (document.hidden) setPaused(true); });


const canvas = $('c');
let hold = null;
const fieldX = (clientX) => ((clientX - fit.x) / fit.w) * FIELD_W;
canvas.addEventListener('pointermove', (e) => {
  if (screen !== SCR_PLAY) return;
  controls.pointer(fieldX(e.clientX));
  if (hold && Math.abs(e.clientX - hold.x) > 14) { clearTimeout(hold.t); hold = null; }
});
canvas.addEventListener('pointerdown', (e) => {
  if (screen !== SCR_PLAY) return;
  controls.pointer(fieldX(e.clientX));
  controls.pointerDown = true;
  controls.tap();
  if (e.pointerType === 'touch') {
    hold = { x: e.clientX, t: setTimeout(() => { controls.cycle(1); hold = null; }, 450) };
  }
});
const up = () => { controls.pointerDown = false; if (hold) { clearTimeout(hold.t); hold = null; } };
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', up);




const popPool = [];
function showPops(evs) {
  for (const p of popsFor(evs)) {
    let el = popPool.find((n) => !n.isConnected);
    if (!el) { el = document.createElement('div'); if (popPool.length < 24) popPool.push(el); }
    el.className = `pop ${p.kind}${p.big ? ' big' : ''}`;
    el.textContent = p.text;
    el.style.left = `${Math.round(p.x * fit.scale)}px`;
    el.style.top = `${Math.round(-p.y * fit.scale)}px`;
    el.onanimationend = () => el.remove();
    $('pops').appendChild(el);
    if (p.kind === 'light') pulseLight();
  }
}
let pulseAt = 0;
function pulseLight() {
  const now = performance.now();
  if (now - pulseAt < 120) return;
  pulseAt = now;
  const c = $('light');
  c.classList.remove('gain'); void c.offsetWidth; c.classList.add('gain');
}


const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function hud(s) {
  
  if (!$('hint').hidden && !launchHintShown(s, net ? net.room?.seat : 0)) $('hint').hidden = true;
  setText('light', s.light.toLocaleString());
  const l = windowLabel(s.wi);
  
  const where = `${l.act}|${l.name}`;
  if (hudCache.where !== where) {
    hudCache.where = where;
    const small = document.createElement('small'); small.textContent = l.act;
    const name = document.createElement('b'); name.textContent = l.name;
    $('where').replaceChildren(small, name);
  }
  setText('lanterns', s.mode === MODE_GENTLE ? '✦ ∞' : `${'✦'.repeat(Math.max(0, s.lanterns))}${s.lanterns <= 0 ? '—' : ''}`);
  const b = s.boss;
  const on = !!(b.on && !b.beaten);
  $('bossbar').hidden = !on;
  if (on) $('bossfill').style.transform = `scaleX(${Math.max(0, b.hp / (b.max || 1))})`;
  const t = controls.tint;
  if (hudCache.tint !== t) {
    hudCache.tint = t;
    for (const btn of $('tints').querySelectorAll('button')) btn.setAttribute('aria-pressed', String(Number(btn.dataset.tint) === t));
    document.documentElement.style.setProperty('--tint', TINT_CSS[t]);
  }
}


const DT = 1 / 60;
let acc = 0, last = performance.now();


let padState = null;
const padKeys = new Set();
function padKey(code, down) {
  if (down === padKeys.has(code)) return;
  if (down) padKeys.add(code); else padKeys.delete(code);
  controls.key(code, down);
}
function pollPad(now) {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  if (!pads.length && !padState) return;
  const held = new Set();
  for (const p of pads) for (const w of padHeld(p)) held.add(w);
  const r = padPresses(padState, held, now);
  padState = pads.length ? r.state : null;
  if (screen === SCR_PLAY) {
    padKey('ArrowLeft', held.has('left'));
    padKey('ArrowRight', held.has('right'));
    padKey('Space', held.has('confirm'));
    for (const w of r.presses) {
      if (w === 'tintPrev') controls.cycle(-1);
      else if (w === 'tintNext') controls.cycle(1);
      else if (w === 'start' || w === 'back') setPaused(true);
    }
    return;
  }
  for (const code of [...padKeys]) padKey(code, false);
  if (r.presses.length) navMode = true;
  for (const w of r.presses) {
    if (w === 'back') navBack();
    else if (w === 'confirm') navConfirm();
    else if (w === 'start') { if (screen === SCR_PAUSE) setPaused(false); else navConfirm(); }
    else navMove(w);
    if (screen === SCR_PLAY) break;
  }
}


const MUSIC_RUN_SCREENS = new Set([SCR_PLAY, SCR_PAUSE, SCR_TALLY, SCR_FAIL]);
function syncMusic(s) {
  followTrack(music, musicFor({ inRun: !!s && MUSIC_RUN_SCREENS.has(screen), boss: !!(s && WINDOWS[s.wi]?.boss) }));
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  pollPad(now);
  if (net) { coopFrame(now, dt); return; }
  syncMusic(sim);
  acc += dt;
  let steps = 0;
  const s = sim || attract;
  while (acc >= DT && steps < 5) {
    acc -= DT; steps++;
    if (sim) {
      if (paused || screen === SCR_SELECT || screen === SCR_STORY) continue;
      if (hitstop > 0) { hitstop--; continue; }
      step(sim, [autoPlay ? botInput(sim, 0) : controls.frame(), IDLE, IDLE, IDLE]);
      const evs = feed.take(sim);
      painter.events(sim, evs);
      sounds(evs);
      showPops(evs);
      const f = feelFor(evs);
      hitstop = Math.max(hitstop, f.stop);
      if (f.shake && settings.shake) painter.addShake(f.shake);
      onPhase(sim);
    } else if (attract) {
      step(attract, [botInput(attract, 0), IDLE, IDLE, IDLE]);
      painter.events(attract, feed.take(attract));
      if (attract.phase !== PH_PLAY || attract.tick > 60 * 90) startAttract();
    }
  }
  if (acc > DT * 5) acc = 0;
  if (s) {
    painter.draw(sim || attract, dt);
    if (sim) hud(sim);
  }
}


function coopFrame(now, dt) {
  const room = net.room, se = room?.session;
  if (!se) { syncMusic(null); if (attract) { step(attract, [botInput(attract, 0), IDLE, IDLE, IDLE]); painter.draw(attract, dt); } return; }
  room.poll(now);
  if (!room.ended && !room.hostPaused) se.update(now, () => controls.frame());
  const v = se.view();
  const evs = feed.take(v);
  painter.events(v, evs);
  sounds(evs);
  showPops(evs);
  const f = feelFor(evs);
  if (f.stop > 0) frozen = { s: frozen && now < frozen.until ? frozen.s : snapshot(v), until: Math.max(frozen?.until ?? 0, now + (f.stop * 1000) / 60) };
  if (f.shake && settings.shake) painter.addShake(f.shake);
  if (frozen && now >= frozen.until) frozen = null;
  onPhase(v);
  syncMusic(v);
  painter.draw(frozen ? frozen.s : v, dt, SEAT_COLOURS, room.seat ?? -1);
  hud(v);
}




let marks = emptyMarks(), marksRun = null;
function reportEnd(s) {
  if (cheat || s === attract) return;
  const coop = !!net;
  if (coop && (!net.room || net.room.seat === null)) return;
  const key = coop ? net.room : sim;
  if (marksRun !== key) { marksRun = key; marks = emptyMarks(); }
  const r = reportFor(s, marks, { coop, reached: progress.reached });
  marks = r.marks;
  if (r.msg) reportMatch(r.msg).catch(() => {});
}

function onPhase(s) {
  if (s.wi !== lastWi && s.phase === PH_PLAY) {
    lastWi = s.wi;
    progress = { ...progress, reached: Math.max(progress.reached, s.wi) };
    writeProgress(store || memStore, progress);
    const scenes = scenesBefore(s.wi);
    if (net) {
      if (screen !== SCR_PLAY) show(SCR_PLAY);
      banner(s.wi);
      const act = scenes.find((id) => id.startsWith('act-'));
      if (act) toast(STORY.scenes[act].title, 3000);
    } else {
      openStory(scenes, () => { show(SCR_PLAY); banner(s.wi); });
    }
  }
  if (s.phase === lastPhase) return;
  lastPhase = s.phase;
  reportEnd(s);
  if (s.phase === PH_CLEAR) {
    const bestBefore = progress.stars[s.wi] || 0;
    progress = recordClear(progress, s.wi, s.stars[s.wi] || 0);
    writeProgress(store || memStore, progress);
    fillTally(s, bestBefore);
  }
  if (s.phase === PH_DONE) { fillEnd(s); openStory(['ending'], () => show(SCR_END)); return; }
  if (s.phase === PH_PLAY && screen !== SCR_PLAY && screen !== SCR_PAUSE && screen !== SCR_STORY && screen !== SCR_SETTINGS) show(SCR_PLAY);
  else if (s.phase !== PH_PLAY) show(screenFor(s.phase, paused));
}


document.addEventListener('click', (e) => {
  const b = e.target.closest?.('button');
  if (!b) return;
  const cue = menuCue(b.id, uiSoundOn(), !!b.closest('#tints'));
  if (cue) ui.play(cue);
});

addEventListener('pointerdown', () => followSound(music, uiSoundOn()), { once: true });
addEventListener('keydown', () => followSound(music, uiSoundOn()), { once: true });
for (const id of ['sound', 'soundPause', 'setSound']) {
  $(id).addEventListener('click', () => { setUiSound(!uiSoundOn()); drawSound(); followSound(music, uiSoundOn()); });
}
drawSound();

setMode(mode);
startAttract();
show(SCR_TITLE);
if (/[?&](join|watch)=/.test(location.search)) openCoop();
else if (cheat) startRun(launchOpts.stage);
requestAnimationFrame(frame);


window.__gbk = { get sim() { return run(); }, get screen() { return screen; }, get room() { return net?.room ?? null; }, startRun, controls, openCoop };
