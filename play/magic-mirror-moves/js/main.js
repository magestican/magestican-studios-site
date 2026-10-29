




import { costumeIcon, costumeName } from './costumes.js';
import { CLIPS, demoPose, makePose } from './demoPose.js';
import { Effects } from './effects.js';
import { createEvents, EVENT_HITS, EVENT_S, stepEvents } from './events.js';
import { createGame, FINALE_S, LEVELS, step, timeLeft } from './game.js';
import { MOVES, MoveTracker, moveVisible } from './moves.js';
import { framingAdvice, hipCentre, seenJoints, shoulderCentre, torsoLength } from './pose/framing.js';
import { mirrorFrame, onlyInFrame, PoseSmoother, seen } from './pose/pose.js';
import {
  devicePlan,
  initialPower,
  initialQuality,
  LOW_CAMERA,
  LOW_PARTICLES,
  QUALITY,
  step3d,
  stepPower,
  stepQuality,
} from './pose/quality.js';
import { COSTUMES, drawCostume, drawFigure, drawMannequin, placeCostume } from './render.js';
import { createSound, cuesForGame, cuesForWorld, namesFor } from './sound.js';
import { COSTUMES_3D } from './three/costumes3d.js';
import { startVoice, voiceSupport } from './voice.js';
import { localVoiceSupported, startLocalVoice } from './voiceLocal.js';

const sound = createSound(window, (n) => {
  document.getElementById('sound').dataset.played = String(n); 
});
const ART = new URL('../assets/costumes/costumes/', import.meta.url);
const LABELS = {
  arms_up: 'Put your arms up high!',
  star: 'Star jump!',
  flap: 'Flap your wings!',
  jump: 'Jump!',
  squat: 'Crouch down!',
  twirl: 'Spin around!',
  wand: 'Point your wand!',
  boo: 'Boo!',
  crown: 'Put your hands on your head!',
};
const CLOSE_START_S = 3; 
const ALONE_START_S = 6; 

const WORLD_WIN = {
  meteor_shower: 'Coins from the sky!',
  storm_cloud: 'A rainbow!',
  bubble_flood: 'Giant bubble pop!',
  night_falls: 'Fireflies!',
  power_up: 'Full power!',
};
const JOINT_NAMES = {
  nose: 'Head',
  left_shoulder: 'Shoulder',
  right_shoulder: 'Shoulder',
  left_hip: 'Hip',
  right_hip: 'Hip',
  left_ankle: 'Foot',
  right_ankle: 'Foot',
};




const q = new URLSearchParams(location.search);
const pick = (v, ok, d) => (ok.includes(v) ? v : d);
const opts = {
  demo: q.get('demo') === '1',
  costume: pick(q.get('costume'), Object.keys(COSTUMES), 'wizard'),
  mode: pick(q.get('mode'), ['show', 'mirror'], 'mirror'),
  level: pick(q.get('level'), ['little', 'big'], 'little'),
  body: pick(q.get('body'), ['child', 'adult'], 'child'),
  close: q.get('close') === '1', 
  speed: Math.min(8, Math.max(1, Number(q.get('speed')) || 1)),
  
  render: q.get('render') ?? '',
  
  
  players:  (q.get('players') === '2' ? 2 : 1),
};
const cheat = q.get('cheat');


const plan = devicePlan({
  coarse: matchMedia('(pointer: coarse)').matches,
  ua: navigator.userAgent,
  model: q.get('model') ?? '',
  memory:  (navigator).deviceMemory,
  cores: navigator.hardwareConcurrency,
  power: q.get('power') ?? '',
});
opts.render = pick(opts.render, ['2d', '3d'], plan.default3d ? '3d' : '2d');
if (!plan.allow3d) opts.render = '2d'; 

const $ = (id) =>  (document.getElementById(id));
const canvas =  ($('stage'));
const ctx =  (canvas.getContext('2d'));
const video =  ($('cam'));
const cardFig =  ($('card-fig'));
const cardCtx =  (cardFig.getContext('2d'));
const scratch =  (document.createElement('canvas').getContext('2d'));


const images = new Map();



const STICKER_PX = plan.stickerPx;
function rasterise(img) {
  const c = document.createElement('canvas');
  c.width = STICKER_PX;
  c.height = STICKER_PX;
   (c.getContext('2d')).drawImage(img, 0, 0, STICKER_PX, STICKER_PX);
  return c;
}
let iconSet = { icons: [] };
let BACK_PIECES = new Set();

const S = {
  screen: 'title',
  source: 'demo', 
  t: 0,
  
  frame: null,
  fresh: false,
  
  game: null,
  tracker: new MoveTracker(),
  fx: new Effects(7, plan.maxParticles),
  ask: { move: '', start: 0 },
  readyFor: 0,
  closeFor: 0, 
  aloneFor: 0, 
  placed: 0,
  hits: 0,
  banner: 0,
  nearlyAt: -9,
  pieces3d: 0,
  
  hint: null,
  
  events: null,
  eventsWon: 0,
  
  visible: new Set(),
  
  
  detect: { runs: 0, people: 0, joints: 0, at: -1, error: '', both: 0, at2: -1 },
  
  
  p2: {
    
    frame: null,
    fresh: false,
    tracker: new MoveTracker(),
    smoother: new PoseSmoother(),
    costume: 'princess',
  },
};
S.p2.costume = otherCostume(opts.costume, q.get('costume2'));


function otherCostume(p1, wanted = null) {
  const ids = Object.keys(COSTUMES);
  if (wanted && wanted !== p1 && ids.includes(wanted)) return wanted;
  return ids[(ids.indexOf(p1) + 1) % ids.length];
}


function players() {
  const out = [{ frame: S.frame, tracker: S.tracker, costume: opts.costume }];
  if (opts.players === 2) out.push({ frame: S.p2.frame, tracker: S.p2.tracker, costume: S.p2.costume });
  return out;
}


let overlay = null;


async function loadArt() {
  iconSet = await (await fetch(new URL('icons.json', ART))).json();
  BACK_PIECES = new Set(iconSet.icons.filter((i) => i.group === 'back').map((i) => i.id));
  await Promise.all(
    iconSet.icons.map(async (i) => {
      const img = new Image();
      img.src = new URL(`svg/sticker/${i.id}.svg`, ART).href;
      try {
        await img.decode();
        images.set(i.id, rasterise(img));
      } catch {
        console.warn(`Magic Mirror Moves: sticker ${i.id} did not load; the game goes on without it.`);
      }
    }),
  );
}


function show(id) {
  S.screen = id;
  for (const el of document.querySelectorAll('.screen')) el.hidden = el.id !== id;
  if (id !== 'play' && id !== 'frame') stopCamera();
  document.body.dataset.screen = id;
  $('bar').hidden = id !== 'play' && id !== 'frame';
  dockH = 0;
  layout();
}

function syncChips() {
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === opts.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === opts.level));
  for (const b of document.querySelectorAll('.costume')) b.setAttribute('aria-checked', String(b.dataset.costume === opts.costume));
  $('mode-switch').textContent = opts.mode === 'mirror' ? 'Score points' : 'Free play';
  
  
  const pl = $('players');
  pl.textContent = opts.players === 2 ? '\u{1F464}' : '\u{1F465}';
  pl.setAttribute('aria-label', opts.players === 2 ? 'One player' : 'Two players');
  pl.title = pl.getAttribute('aria-label') ?? '';
  pl.setAttribute('aria-pressed', String(opts.players === 2));
  document.body.dataset.players = String(opts.players);
  document.body.dataset.mode = opts.mode;
  layout();
}

function setCostume(id) {
  opts.costume = id;
  if (S.p2.costume === id) S.p2.costume = otherCostume(id);
  overlay?.setCostume(id);
  syncChips();
  sound.preload(namesFor(id));
  sound.play([{ name: 'costume' }]);
}

function buildDressingRoom() {
  const box = $('costumes');
  for (const id of Object.keys(COSTUMES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'costume';
    b.dataset.costume = id;
    b.setAttribute('role', 'radio');
    const img = document.createElement('img');
    img.src = new URL(`svg/sticker/${costumeIcon(id)}.svg`, ART).href;
    img.alt = '';
    b.append(img, costumeName(id));
    b.addEventListener('click', () => setCostume(id));
    box.append(b);
    const mini =  (b.cloneNode(true));
    mini.classList.add('mini');
    mini.setAttribute('aria-label', costumeName(id));
    mini.addEventListener('click', () => setCostume(id));
    $('bar-costumes').append(mini);
  }
  const ul = $('joints');
  for (const [j, name] of Object.entries(JOINT_NAMES)) {
    const li = document.createElement('li');
    li.dataset.joint = j;
    li.textContent = j.startsWith('left') ? `${name} (L)` : j.startsWith('right') ? `${name} (R)` : name;
    ul.append(li);
  }
}


function setMode(mode) {
  if (opts.mode === mode) return;
  opts.mode = mode;
  syncChips();
  if (S.screen === 'play') beginRound({ tutorial: false });
}
function setPlayers(n) {
  if (opts.players === n) return;
  opts.players = n;
  S.p2.frame = null;
  S.p2.smoother.reset();
  syncChips();
  if (S.screen === 'play') beginRound({ tutorial: false });
}
function setMuted(muted) {
  sound.setMuted(muted);
  const sb = $('sound');
  sb.innerHTML = sound.muted ? '&#x1F507;' : '&#x1F50A;';
  sb.setAttribute('aria-pressed', String(sound.muted));
  sb.setAttribute('aria-label', sound.muted ? 'Turn sound on' : 'Turn sound off');
  sb.title = sb.getAttribute('aria-label') ?? '';
}

function applyCommand(cmd) {
  if (cmd.kind === 'costume' && cmd.value !== opts.costume) setCostume(cmd.value);
  else if (cmd.kind === 'players') setPlayers(cmd.value);
  else if (cmd.kind === 'mode') setMode(cmd.value);
  else if (cmd.kind === 'sound' && sound.muted === cmd.value) setMuted(!cmd.value);
}



async function wireVoice() {
  const engine = (await voiceSupport(window)) !== 'none' ? startVoice : localVoiceSupported(window) ? startLocalVoice : null;
  if (!engine) return;
  const btn = $('voice');
  btn.hidden = false;
  layout();
  let stop = null;
  let starting = 0; 
  let starts = 0;
  const set = (on) => {
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Stop listening' : 'Say a costume');
  };
  btn.addEventListener('click', async () => {
    if (stop || starting) {
      stop?.();
      stop = null;
      starting = 0;
      set(false);
      return;
    }
    set(true);
    const me = ++starts;
    starting = me;
    try {
      const s = await engine(window, applyCommand);
      if (starting !== me) return s(); 
      starting = 0;
      stop = s;
    } catch (e) {
      if (starting !== me) return;
      starting = 0;
      console.warn('Magic Mirror Moves: voice is off on this device.', e);
      set(false);
      btn.hidden = true;
      layout();
    }
  });
}

function wire() {
  for (const b of document.querySelectorAll('[data-mode]'))
    b.addEventListener('click', () => {
      opts.mode = b.dataset.mode;
      syncChips();
    });
  for (const b of document.querySelectorAll('[data-level]'))
    b.addEventListener('click', () => {
      opts.level = b.dataset.level;
      syncChips();
    });
  for (const b of document.querySelectorAll('[data-back]')) b.addEventListener('click', () => show(b.dataset.back));
  $('play').addEventListener('click', () => show('dress'));
  $('dress-next').addEventListener('click', () => toFraming());
  $('start').addEventListener('click', () => beginRound());
  $('again').addEventListener('click', () => toFraming());
  $('stop').addEventListener('click', () => endRound());
  $('use-demo').addEventListener('click', () => {
    opts.demo = true;
    toFraming();
  });
  const dlg =  ($('privacy'));
  for (const b of document.querySelectorAll('[data-privacy]')) b.addEventListener('click', () => dlg.showModal());
  $('privacy-close').addEventListener('click', () => dlg.close());
  $('forget').addEventListener('click', () => {
    forgetScores();
    $('forget').textContent = 'Scores forgotten';
  });
  
  
  const resume = () => {
    if (!document.hidden && !opts.demo && (S.screen === 'frame' || S.screen === 'play')) startCamera();
  };
  addEventListener('pagehide', stopCamera);
  addEventListener('pageshow', resume);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return resume();
    stopCamera();
    if (S.screen === 'play' && opts.mode !== 'mirror') endRound();
  });
  addEventListener('resize', layout);
  const watch = new ResizeObserver(() => layout());
  for (const el of [$('bar'), $('card'), document.querySelector('#frame .dock')]) if (el) watch.observe(el);
  $('mode-switch').addEventListener('click', () => setMode(opts.mode === 'mirror' ? 'show' : 'mirror'));
  $('players').addEventListener('click', () => setPlayers(opts.players === 2 ? 1 : 2));
  $('menu').addEventListener('click', () => show('title'));
  
  const root =  (document.documentElement);
  const fsOn = () => !!(document.fullscreenElement ||  (document).webkitFullscreenElement);
  if (document.fullscreenEnabled ||  (document).webkitFullscreenEnabled) {
    const fs = $('fullscreen');
    fs.hidden = false;
    fs.addEventListener('click', () => {
      if (fsOn()) (document.exitFullscreen ??  (document).webkitExitFullscreen).call(document);
      else (root.requestFullscreen ?? root.webkitRequestFullscreen).call(root);
    });
    const label = () => {
      fs.setAttribute('aria-label', fsOn() ? 'Exit full screen' : 'Go full screen');
      fs.setAttribute('aria-pressed', String(fsOn()));
    };
    document.addEventListener('fullscreenchange', label);
    document.addEventListener('webkitfullscreenchange', label);
  }
  
  const unlock = () => {
    sound.unlock();
    sound.preload(namesFor(opts.costume));
  };
  addEventListener('pointerdown', unlock, { capture: true });
  addEventListener('keydown', unlock, { capture: true });
  addEventListener('click', (e) => {
    if ( (e.target).closest?.('button')) sound.play([{ name: 'click' }]);
  });
  $('sound').addEventListener('click', () => setMuted(!sound.muted));
  
  wireVoice();
  
  let installer = null;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installer = e;
    $('install').hidden = false;
  });
  $('install').addEventListener('click', async () => {
    if (!installer) return;
    installer.prompt();
    await installer.userChoice;
    installer = null;
    $('install').hidden = true;
  });
  addEventListener('appinstalled', () => {
    $('install').hidden = true;
  });
}



let stream = null;

let estimator = null;
let camRun = 0;
const smoother = new PoseSmoother();
let camFrames = 0;
let quality = initialQuality(plan.start); 
let power = { ...initialPower(), low: plan.lowPower };



function enterLowPower() {
  plan.maxPixelRatio = 1;
  S.fx.setMax(LOW_PARTICLES);
  if (overlay) {
    overlay.dispose();
    overlay = null;
    S.pieces3d = 0;
  }
  opts.render = '2d';
  stream
    ?.getVideoTracks()[0]
    ?.applyConstraints(LOW_CAMERA)
    .catch(() => {});
  resize();
}



let estimatorLoad = null;
function loadEstimator() {
  estimatorLoad ??= (async () => {
    const { createPoseEstimator } = await import('./pose/detector.js');
    for (let attempt = 1; ; attempt++) {
      try {
        return await createPoseEstimator(plan);
      } catch (err) {
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  })().catch((err) => {
    estimatorLoad = null; 
    throw err;
  });
  return estimatorLoad;
}



let threeD = { off: false, secs: 0 };
function drop3d() {
  if (!overlay) return;
  overlay.dispose();
  overlay = null;
  S.pieces3d = 0;
  opts.render = '2d';
  quality = initialQuality('medium');
  resize();
}

async function startCamera() {
  if (stream) return true;
  const note = $('frame-note');
  
  
  
  const run = ++camRun;
  const current = () => run === camRun;
  let stage = 'camera';
  try {
    note.hidden = false;
    note.textContent = 'Asking for the camera...';
    const s = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', ...plan.camera },
      audio: false,
    });
    if (!current()) {
      for (const tr of s.getTracks()) tr.stop();
      return false;
    }
    stream = s;
    video.srcObject = stream;
    await video.play();
    if (!current()) return false;
    stage = 'model';
    note.textContent = 'Waking up the magic mirror...';
    if (!estimator) estimator = await loadEstimator();
    if (!current()) return false;
    note.hidden = true;
  } catch (err) {
    if (!current()) return false; 
    stopCamera();
    note.hidden = false;
    note.textContent =
      stage === 'model'
        ? 'The mirror is sleepy. Play the demo!'
        : err?.name === 'NotAllowedError'
          ? 'Camera off. Play the demo!'
          : 'No camera here. Play the demo!';
    $('use-demo').hidden = false;
    return false;
  }
  S.source = 'camera';
  S.detect = { runs: 0, people: 0, joints: 0, at: -1, error: '', both: 0, at2: -1 };
  smoother.reset();
  S.p2.smoother.reset();
  const sleepy = () => {
    
    stopCamera();
    note.hidden = false;
    note.textContent = 'The mirror is sleepy. Play the demo!';
    $('use-demo').hidden = false;
    if (S.screen !== 'frame') show('frame');
  };
  let oops = 0; 
  const loop = async () => {
    while (current() && stream) {
      try {
        await cameraStep();
        oops = 0;
      } catch (err) {
        console.warn('Magic Mirror Moves: a camera frame failed.', err);
        if (++oops >= 30) return sleepy();
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
  };
  const cameraStep = async () => {
    
    const skip = ++camFrames % QUALITY[quality.level].detectEvery !== 0;
    const found = skip ? [] : await estimator.estimate(video, performance.now() / 1000, opts.players);
    if (!current()) return;
    const f = found[0] ?? null;
    const f2 = opts.players === 2 ? (found[1] ?? null) : null;
    if (estimator.failed()) return sleepy();
    if (!skip) {
      const d = S.detect;
      d.runs++;
      d.error = estimator.lastError();
      const count = (fr) => (fr ? Object.values(fr.pose).filter((j) => seen(j)).length : 0);
      d.joints = count(f) || count(f2);
      if (d.joints > 0) {
        d.people++;
        d.at = S.t;
      }
      if (count(f2) > 0) d.at2 = S.t;
      if (count(f) > 0 && count(f2) > 0) d.both++;
    }
    if (f) {
      S.frame = mirrorFrame(smoother.smooth(f));
      S.fresh = true;
    }
    if (f2) {
      S.p2.frame = mirrorFrame(S.p2.smoother.smooth(f2));
      S.p2.fresh = true;
    }
  };
  loop();
  return true;
}

function stopCamera() {
  camRun++;
  if (stream) for (const tr of stream.getTracks()) tr.stop();
  stream = null;
  video.srcObject = null;
  if (S.source === 'camera') {
    S.source = 'demo';
    S.frame = null;
    S.p2.frame = null;
  }
}


async function toFraming() {
  show('frame');
  S.readyFor = 0;
  S.closeFor = 0;
  S.aloneFor = 0;
  $('use-demo').hidden = true;
  if (!opts.demo) await startCamera();
}

function beginRound({ tutorial = true } = {}) {
  S.game = createGame({ mode: opts.mode, level: opts.level, seed: opts.demo ? 7 : (Date.now() & 0xffff) + 1, tutorial });
  S.tracker.reset();
  S.p2.tracker.reset();
  S.hits = 0;
  S.ask = { move: '', start: S.t };
  S.events = opts.mode === 'mirror' ? createEvents(opts.demo ? 5 : (Date.now() & 0xffff) + 3) : null;
  S.eventsWon = 0;
  show('play');
  $('card').style.visibility = opts.mode === 'mirror' ? 'hidden' : 'visible';
  $('time-bar').parentElement.hidden = opts.mode === 'mirror';
  if (S.game.phase === 'tutorial') flash('Get ready! Arms up!');
}

function endRound() {
  if (!S.game) return show('title');
  showResult(S.game.score, opts.mode === 'mirror' ? 0 : S.game.stars || 1);
}

const bestKey = () => `mmm.best.${opts.mode}.${opts.level}`;
function forgetScores() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('mmm.best.')) localStorage.removeItem(k);
  } catch {}
}

function showResult(score, stars) {
  let best = 0;
  try {
    best = Number(localStorage.getItem(bestKey())) || 0;
    if (score > best) {
      localStorage.setItem(bestKey(), String(score));
    }
  } catch {}
  $('final').textContent = score.toLocaleString('en');
  $('best').textContent =
    score > best && best > 0 ? 'Your best ever!' : best > 0 ? `Your best: ${best.toLocaleString('en')}` : 'Your first round!';
  const box = $('stars');
  box.replaceChildren();
  box.hidden = stars === 0;
  box.setAttribute('aria-label', `${stars} of 3 stars`);
  for (let i = 0; i < 3; i++) {
    const img = document.createElement('img');
    img.src = new URL('svg/sticker/star.svg', ART).href;
    img.alt = '';
    if (i >= stars) img.className = 'off';
    box.append(img);
  }
  show('result');
}

function flash(text, seconds = 1.4) {
  const b = $('banner');
  b.textContent = text;
  b.hidden = false;
  S.banner = seconds;
}


const view = { fw: 720, fh: 540, scale: 1, ox: 0, oy: 0, cw: 1, ch: 1, dpr: 1 };



let dockH = 0;
function layout() {
  const bar = $('bar');
  
  const worn =  (document.querySelector(`.bar-costumes [data-costume="${opts.costume}"]`));
  const row = worn?.parentElement;
  if (worn && row && row.scrollWidth > row.clientWidth)
    row.scrollLeft = Math.max(0, worn.offsetLeft - row.offsetLeft - (row.clientWidth - worn.offsetWidth) / 2);
  const top = bar.hidden ? 0 : Math.ceil(bar.getBoundingClientRect().bottom);
  
  
  
  const dock = S.screen === 'play' ? $('card') : S.screen === 'frame' ? document.querySelector('#frame .dock') : null;
  if (dock && !dock.hidden && dock.offsetHeight) dockH = Math.max(dockH, Math.ceil(innerHeight - dock.getBoundingClientRect().top) + 8);
  const style = document.documentElement.style;
  style.setProperty('--top', `${top}px`);
  style.setProperty('--bottom', `${dock ? dockH : 0}px`);
  resize();
}

function resize() {
  view.dpr = Math.min(QUALITY[quality.level].pixelRatioCap, plan.maxPixelRatio, devicePixelRatio || 1);
  view.cw = canvas.clientWidth || innerWidth;
  view.ch = canvas.clientHeight || innerHeight;
  
  
  const w = Math.round(view.cw * view.dpr);
  const h = Math.round(view.ch * view.dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

function frameSize() {
  if (S.source === 'camera' && video.videoWidth) return { fw: video.videoWidth, fh: video.videoHeight };
  return { fw: 720, fh: Math.round((720 * view.ch) / view.cw) }; 
}

function demoPlace(fw, fh, slot = 0) {
  if (opts.close) return { cx: fw / 2, ground: fh * 1.77, stature: fh * 1.42 }; 
  if (opts.players === 2) {
    
    const stature = Math.min(fh * 0.6, fw * 0.42);
    return { cx: fw * (slot === 0 ? 0.73 : 0.27), ground: fh * (fh > fw ? 0.8 : 0.9), stature };
  }
  const stature = Math.min(fh * 0.66, fw * 0.9);
  
  return { cx: fw / 2, ground: fh * (fh > fw ? 0.8 : 0.9), stature };
}

function wanted() {
  const g = S.game;
  if (S.screen !== 'play' || !g) return null;
  if (g.card) return g.card.moves[g.card.step];
  if (g.mode === 'mirror' && S.events?.active) return S.events.active.moves[0]; 
  if (g.mode === 'mirror' && S.hint) return S.hint.move; 
  if (g.mode === 'mirror') return MOVES[Math.floor((S.t - S.ask.start) / 3.2) % MOVES.length];
  return null;
}



function updateSeenLight() {
  const el = $('seen-light');
  const on = S.source === 'camera' && (S.screen === 'frame' || S.screen === 'play');
  el.hidden = !on;
  if (!on) return;
  const d = S.detect;
  let state = 'off';
  let text = 'Waking up the magic mirror...';
  if (d.error) [state, text] = ['error', 'The mirror is stuck. Reload the page.'];
  else if (d.runs > 0 && S.t - d.at > 0.5) text = 'Looking for you...';
  else if (d.runs > 0) {
    const seenNow = Object.values(seenJoints(S.frame?.pose ?? S.p2.frame?.pose ?? null));
    const all = seenNow.every(Boolean);
    [state, text] = all ? ['seen', 'I can see you!'] : ['part', 'I can see part of you'];
    if (opts.players === 2) {
      
      const both = S.t - d.at2 <= 0.5 && !!S.frame && S.t - d.at <= 0.5 && d.both > 0;
      [state, text] = both ? ['seen', 'I can see you both!'] : ['part', 'I can see one of you'];
    }
  }
  if (el.dataset.state !== state || $('seen-text').textContent !== text) {
    el.dataset.state = state;
    $('seen-text').textContent = text;
  }
}

function tick(h) {
  S.t += h;
  if (S.hint && S.t > S.hint.until) S.hint = null;
  updateSeenLight();
  const { fw, fh } = frameSize();
  if (S.source === 'demo') {
    const want = wanted();
    if (want !== S.ask.move && S.game?.mode !== 'mirror') S.ask = { move: want ?? '', start: S.t };
    const since = S.hint ? S.t - S.hint.at : S.game?.mode === 'mirror' ? (S.t - S.ask.start) % 3.2 : S.t - S.ask.start;
    const ask = want ? { move: want, since } : null;
    const pose = demoPose(S.t, ask, demoPlace(fw, fh), opts.body);
    S.frame = mirrorFrame({ pose: opts.close ? onlyInFrame(pose, fw, fh) : pose, width: fw, height: fh, t: S.t });
    S.fresh = true;
    if (opts.players === 2) {
      
      const ask2 = ask ? { move: ask.move, since: ask.since - 0.35 } : null;
      const pose2 = demoPose(S.t + 0.35, ask2 && ask2.since >= 0 ? ask2 : null, demoPlace(fw, fh, 1), 'child');
      S.p2.frame = mirrorFrame({ pose: pose2, width: fw, height: fh, t: S.t });
      S.p2.fresh = true;
    }
  }
  const frame = S.frame ?? (opts.players === 2 ? S.p2.frame : null);

  if (S.screen === 'frame' && frame) {
    const seen = seenJoints(frame.pose);
    for (const li of $('joints').children) li.classList.toggle('seen', !!seen[li.dataset.joint]);
    const advice = framingAdvice(frame.pose, frame.width, frame.height);
    
    const advice2 = opts.players === 2 ? (S.p2.frame ? framingAdvice(S.p2.frame.pose, fw, fh) : 'searching') : 'ready';
    const one = advice === 'ready' || advice2 === 'ready';
    const ready = advice === 'ready' && advice2 === 'ready';
    
    
    const close = advice === 'close' || advice === 'step-back';
    $('frame-h').textContent = ready
      ? opts.players === 2
        ? 'Get ready, I can see you both!'
        : 'Get ready, I can see you!'
      : opts.players === 2 && one
        ? 'Stand one on each side!'
        : close
          ? 'Step back for jumps, or play close up with your arms!'
          : 'Step back until I can see you from head to feet';
    S.readyFor = ready ? S.readyFor + h : 0;
    S.closeFor = close ? S.closeFor + h : 0;
    S.aloneFor = opts.players === 2 && one && !ready ? S.aloneFor + h : 0;
    if (S.readyFor > (opts.demo ? 1.2 : 1) || S.closeFor > CLOSE_START_S || S.aloneFor > ALONE_START_S) beginRound();
  }

  if (S.screen === 'play' && S.game && frame) {
    let input = {};
    
    const by = new Map();
    const everyone = players();
    if (S.fresh || S.p2.fresh) {
      const hits = [];
      const partial = [];
      const visible = new Set();
      everyone.forEach((p, i) => {
        if (!p.frame || !(i === 0 ? S.fresh : S.p2.fresh)) return;
        const res = p.tracker.update(p.frame);
        for (const hit of res.hits) {
          if (by.has(hit.move)) continue; 
          by.set(hit.move, i);
          hits.push(hit);
        }
        partial.push(...res.partial);
        for (const m of MOVES) if (moveVisible(p.frame.pose, m)) visible.add(m);
      });
      input = { hits, partial: [...new Set(partial)], visible };
      S.visible = visible;
      S.fresh = false;
      S.p2.fresh = false;
    }
    const landed = [];
    for (const ev of step(S.game, h, input)) {
      const who = ev.type === 'hit' ? (by.get(String(ev.move)) ?? 0) : 0;
      onEvent(ev, everyone[who].frame ?? frame, everyone[who].costume);
      if (ev.type === 'hit') landed.push(String(ev.move));
    }
    
    if (S.events && S.game.phase === 'play') {
      const stage = stageOf(frame);
      const seenNow = S.source === 'demo' || (S.detect.runs > 0 && S.t - S.detect.at <= 0.5);
      for (const ev of stepEvents(S.events, h, { seen: seenNow, visible: S.visible, hits: landed })) onWorld(ev, stage);
      if (S.events.active && seenNow) S.fx.worldFlow(S.events.active.id, h, stage);
    }
  }
  S.fx.update(h);
  if (S.banner > 0) {
    S.banner -= h;
    if (S.banner <= 0) $('banner').hidden = true;
  }
}

function stageOf(frame) {
  const p = frame.pose;
  const T = torsoLength(p) ?? frame.height * 0.2;
  const centre = hipCentre(p) ?? shoulderCentre(p) ?? { x: frame.width / 2, y: frame.height / 2 };
  const feet = [p.left_ankle, p.right_ankle].filter((j) => j && j.score >= 0.5).map((j) => j.y);
  
  const head = p.nose && p.nose.score >= 0.5 ? { x: p.nose.x, y: p.nose.y } : undefined;
  return { width: frame.width, height: frame.height, centre, ground: feet.length ? Math.max(...feet) : frame.height * 0.95, unit: T, head };
}

function onEvent(ev, frame, costume = opts.costume) {
  const stage = stageOf(frame);
  sound.play(cuesForGame(ev, opts.costume));
  if (ev.type === 'hit') {
    S.hits++;
    S.fx.trigger(ev, costume, stage);
    if (ev.name) {
      flash(String(ev.name), 1.6); 
      S.hint = null;
    } else if (ev.power) flash('Power up!');
    else if (ev.combo >= 2) flash(`Combo x${ev.combo}!`, 0.9);
  } else if (ev.type === 'step') S.fx.trigger(ev, costume, stage);
  else if (ev.type === 'nearly' && S.t - S.nearlyAt > 1.5) {
    S.nearlyAt = S.t;
    S.fx.trigger(ev, costume, stage);
    flash('Nearly!', 0.8);
  } else if (ev.type === 'miss') flash('Next one!', 0.8);
  else if (ev.type === 'hint' && S.game?.mode === 'mirror')
    
    S.hint = { move: String(ev.next), at: S.t, until: S.t + Number(ev.for) };
  else if (ev.type === 'start') flash('Here we go!');
  else if (ev.type === 'finale') flash('Finale! Double magic!', 2);
  else if (ev.type === 'end') setTimeout(() => S.screen === 'play' && showResult(ev.score, ev.stars), 1200);
}


function onWorld(ev, stage) {
  sound.play(cuesForWorld(ev));
  if (ev.type === 'event_start') {
    S.fx.worldStart(String(ev.id), stage);
    flash(String(ev.name), 2.2);
  } else if (ev.type === 'event_hit') {
    S.fx.worldHit(String(ev.id), Number(ev.count), stage);
    if (Number(ev.count) < Number(ev.of)) flash(`${ev.count} of ${ev.of}!`, 0.8);
  } else if (ev.type === 'event_end') {
    S.fx.worldEnd(String(ev.id), !!ev.success, stage);
    if (ev.success) {
      S.game.score += Number(ev.points);
      S.eventsWon++;
      flash(`${WORLD_WIN[String(ev.id)] ?? 'You did it!'} +${ev.points}`, 2);
    } else flash('Bye bye! Good try!', 1.2); 
  }
}

function updateHud() {
  const g = S.game;
  if (!g) return;
  $('score').textContent = g.score.toLocaleString('en');
  $('combo').textContent = `x${Math.max(1, Math.min(4, g.streak))}`;
  const round = LEVELS[g.level].round;
  $('time-bar').style.transform = `scaleX(${g.phase === 'tutorial' ? 1 : timeLeft(g) / round})`;
  const move = g.card ? g.card.moves[g.card.step] : null;
  const card = $('card');
  if (g.mode !== 'mirror') card.style.visibility = move ? 'visible' : 'hidden';
  else {
    
    
    const e = S.events?.active;
    card.style.visibility = S.hint || e ? 'visible' : 'hidden';
    if (e) {
      const label = `${LABELS[e.moves[0]]} ${'●'.repeat(e.count)}${'○'.repeat(EVENT_HITS - e.count)}`;
      if ($('card-label').textContent !== label) $('card-label').textContent = label;
      $('card-bar').style.transform = `scaleX(${Math.max(0, 1 - e.age / EVENT_S)})`;
      drawCardFigure(e.moves[0]);
    } else if (S.hint) {
      const label = `Now: ${LABELS[S.hint.move]}`;
      if ($('card-label').textContent !== label) $('card-label').textContent = label;
      $('card-bar').style.transform = `scaleX(${Math.max(0, (S.hint.until - S.t) / (S.hint.until - S.hint.at))})`;
      drawCardFigure(S.hint.move);
    }
  }
  if (move) {
    const label = g.card.moves.length > 1 ? `${LABELS[g.card.moves[0]]} then ${LABELS[g.card.moves[1]]}` : LABELS[move];
    if ($('card-label').textContent !== label) $('card-label').textContent = label;
    const left = Number.isFinite(g.card.window) ? Math.max(0, 1 - g.card.age / g.card.window) : 1;
    $('card-bar').style.transform = `scaleX(${left})`;
    drawCardFigure(move);
  }
}

function drawCardFigure(move) {
  const w = cardFig.width;
  cardCtx.clearRect(0, 0, w, w);
  const clipT = (S.t % 2.4) * 1;
  const pose = mirrorFrame({
    pose: makePose(CLIPS[move](clipT), 'child', { cx: w / 2, ground: w * 0.86, stature: w * 0.62 }),
    width: w,
    height: w,
    t: 0,
  }).pose;
  drawFigure(cardCtx, pose, { colour: '#ffe08a', width: w * 0.045, headR: w * 0.07 });
}

function draw() {
  const { fw, fh } = frameSize();
  view.fw = fw;
  view.fh = fh;
  
  view.scale = (opts.players === 2 ? Math.min : Math.max)(view.cw / fw, view.ch / fh);
  view.ox = (view.cw - fw * view.scale) / 2;
  view.oy = (view.ch - fh * view.scale) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const k = view.dpr * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.dpr, view.oy * view.dpr);
  const frame = S.frame;
  
  
  
  const mirror = S.source === 'camera' && !!stream;
  if (video.hidden === mirror) video.hidden = !mirror;
  const second = opts.players === 2 ? S.p2.frame : null;
  if (!mirror && frame) drawMannequin(ctx, frame.pose);
  if (!mirror && second) drawMannequin(ctx, second.pose);
  const night = S.events?.active ? S.fx.dim(S.events.active.id, S.events.active.count) * Math.min(1, S.events.active.age) : 0;
  if (night > 0) {
    
    ctx.fillStyle = `rgba(12, 10, 40, ${night})`;
    ctx.fillRect(0, 0, fw, fh);
  }
  if (frame) {
    let placed = placeCostume(opts.costume, frame.pose, iconSet, 'right');
    
    if (opts.players === 1 && overlay?.ready(opts.costume)) {
      
      const drawn = overlay.render(mirrorFrame(frame).pose, fw, fh, view.scale * view.dpr);
      S.pieces3d = overlay.visibleCount();
      if (drawn) {
        ctx.save();
        ctx.translate(fw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(overlay.canvas, 0, 0, fw, fh);
        ctx.restore();
        const gone = new Set(COSTUMES_3D[opts.costume].pieces.flatMap((p) => p.replaces));
        placed = placed.filter((p) => !gone.has(p.id));
      }
    }
    S.placed = placed.length;
    if (scratch.canvas.width !== canvas.width || scratch.canvas.height !== canvas.height) {
      scratch.canvas.width = canvas.width;
      scratch.canvas.height = canvas.height;
    }
    drawCostume(ctx, scratch, placed, images, BACK_PIECES, frame.pose);
  }
  if (opts.players === 2) S.pieces3d = 0;
  if (!frame) S.placed = 0;
  if (second) {
    if (scratch.canvas.width !== canvas.width || scratch.canvas.height !== canvas.height) {
      scratch.canvas.width = canvas.width;
      scratch.canvas.height = canvas.height;
    }
    const placed2 = placeCostume(S.p2.costume, second.pose, iconSet, 'right');
    S.placed += placed2.length;
    drawCostume(ctx, scratch, placed2, images, BACK_PIECES, second.pose);
  }
  S.fx.draw(ctx, images);
}

let last = 0;


let frameErrors = 0;
function loop(now) {
  try {
    frame(now);
  } catch (err) {
    if (frameErrors++ < 3) console.warn('Magic Mirror Moves: a frame failed.', err);
  }
  requestAnimationFrame(loop);
}

function frame(now) {
  const wall = last ? (now - last) / 1000 : 0;
  const dt = Math.min(0.1, wall); 
  last = now;
  if (S.source === 'camera') {
    
    
    const was = quality.level;
    quality = stepQuality(quality, wall);
    if (quality.level !== was) resize();
    if (overlay) {
      threeD = step3d(threeD, quality, wall);
      if (threeD.off) drop3d();
    } else if (!power.low) {
      power = stepPower(power, quality, wall);
      if (power.low) enterLowPower();
    }
  }
  let remain = dt * (S.source === 'demo' ? opts.speed : 1);
  while (remain > 1e-6) {
    const h = Math.min(1 / 30, remain);
    remain -= h;
    tick(h);
  }
  draw();
  if (S.screen === 'play') updateHud();
}


Object.defineProperty(window, '__mmm', {
  value: Object.freeze({
    get state() {
      const g = S.game;
      return {
        screen: S.screen,
        source: S.source,
        phase: g?.phase ?? null,
        score: g?.score ?? 0,
        hits: S.hits,
        particles: S.fx.particles.length,
        fxKinds: [...new Set(S.fx.particles.map((p) => p.kind))], 
        placed: S.placed,
        pieces3d: S.pieces3d,
        combos: g ? [...g.combos] : [],
        hint: S.hint?.move ?? null,
        event: S.events?.active ? { id: S.events.active.id, count: S.events.active.count } : null,
        eventsWon: S.eventsWon,
        players: opts.players,
        costumes: opts.players === 2 ? [opts.costume, S.p2.costume] : [opts.costume],
        
        seenAt: players().map((p) => {
          const c = p.frame ? (hipCentre(p.frame.pose) ?? shoulderCentre(p.frame.pose)) : null;
          return c ? Math.round((c.x / p.frame.width) * 100) / 100 : null;
        }),
        
        screenX: players().map((p) => {
          const c = p.frame ? (hipCentre(p.frame.pose) ?? shoulderCentre(p.frame.pose)) : null;
          return c ? Math.round(((c.x * view.scale + view.ox) / view.cw) * 100) / 100 : null;
        }),
        card: g?.card?.moves ?? null,
        detect: { ...S.detect, backend: estimator?.backend() ?? '' },
        perf: {
          quality: quality.level,
          lowPower: power.low,
          render: opts.render,
          maxParticles: S.fx.max,
          fps: Math.round(quality.fps * 10) / 10,
          canvas: [canvas.width, canvas.height],
          model: estimator?.stats() ?? null,
        },
      };
    },
  }),
});


async function start3d() {
  try {
    const { CostumeOverlay } = await import('./three/overlay.js');
    overlay = new CostumeOverlay();
    await overlay.setCostume(opts.costume);
    if (power.low) enterLowPower(); 
  } catch (e) {
    console.warn('Magic Mirror Moves: 3D costumes are off on this device; stickers play instead.', e);
    overlay = null;
  }
}

async function boot() {
  resize();
  buildDressingRoom();
  wire();
  syncChips();
  await loadArt();
  if (opts.render === '3d') await start3d();
  if (cheat === 'play' || cheat === 'finale') {
    opts.demo = opts.demo || !navigator.mediaDevices;
    if (!opts.demo) await startCamera();
    beginRound({ tutorial: false });
    if (cheat === 'finale') S.game.clock = LEVELS[opts.level].round - FINALE_S - 0.5;
  } else if (cheat === 'result') showResult(LEVELS[opts.level].stars[0] + 1234, 2);
  else if (cheat === 'menu') show('title');
  else toFraming(); 
  document.body.dataset.ready = '1';
  requestAnimationFrame(loop);
}

boot();
