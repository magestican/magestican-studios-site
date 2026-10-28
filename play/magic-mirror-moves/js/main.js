




import { CLIPS, demoPose, makePose } from './demoPose.js';
import { Effects } from './effects.js';
import { createGame, FINALE_S, LEVELS, step, timeLeft } from './game.js';
import { MOVES, MoveTracker, moveVisible } from './moves.js';
import { framingAdvice, hipCentre, seenJoints, shoulderCentre, torsoLength } from './pose/framing.js';
import { mirrorFrame, PoseSmoother } from './pose/pose.js';
import { initialQuality, QUALITY, stepQuality } from './pose/quality.js';
import { COSTUMES, drawCostume, drawFigure, drawMannequin, placeCostume } from './render.js';
import { COSTUMES_3D } from './three/costumes3d.js';

const ART = new URL('../assets/costumes/costumes/', import.meta.url);
const LABELS = {
  arms_up: 'Arms up high!',
  star: 'Star jump!',
  flap: 'Flap your wings!',
  jump: 'Jump!',
  squat: 'Crouch down!',
  twirl: 'Spin around!',
  wand: 'Point your wand!',
  boo: 'Boo!',
  crown: 'Hands on your head!',
};
const COSTUME_NAMES = { wizard: 'Wizard', princess: 'Princess', ghost: 'Ghost', fairy: 'Fairy', dragon: 'Dragon' };
const COSTUME_ICON = { wizard: 'wizard_hat', princess: 'crown', ghost: 'ghost_hood', fairy: 'flower_crown', dragon: 'dragon_horns' };
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
  mode: pick(q.get('mode'), ['show', 'mirror'], 'show'),
  level: pick(q.get('level'), ['little', 'big'], 'little'),
  body: pick(q.get('body'), ['child', 'adult'], 'child'),
  speed: Math.min(8, Math.max(1, Number(q.get('speed')) || 1)),
  
  render: pick(q.get('render'), ['2d', '3d'], '2d'),
};
const cheat = q.get('cheat');

const $ = (id) =>  (document.getElementById(id));
const canvas =  ($('stage'));
const ctx =  (canvas.getContext('2d'));
const video =  ($('cam'));
const cardFig =  ($('card-fig'));
const cardCtx =  (cardFig.getContext('2d'));
const scratch =  (document.createElement('canvas').getContext('2d'));


const images = new Map();
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
  fx: new Effects(7),
  ask: { move: '', start: 0 },
  readyFor: 0,
  placed: 0,
  hits: 0,
  banner: 0,
  nearlyAt: -9,
  pieces3d: 0,
};


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
        images.set(i.id, img);
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
}

function syncChips() {
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === opts.mode));
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === opts.level));
  for (const b of document.querySelectorAll('.costume')) b.setAttribute('aria-checked', String(b.dataset.costume === opts.costume));
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
    img.src = new URL(`svg/sticker/${COSTUME_ICON[id]}.svg`, ART).href;
    img.alt = '';
    b.append(img, COSTUME_NAMES[id]);
    b.addEventListener('click', () => {
      opts.costume = id;
      overlay?.setCostume(id);
      syncChips();
    });
    box.append(b);
  }
  const ul = $('joints');
  for (const [j, name] of Object.entries(JOINT_NAMES)) {
    const li = document.createElement('li');
    li.dataset.joint = j;
    li.textContent = j.startsWith('left') ? `${name} (L)` : j.startsWith('right') ? `${name} (R)` : name;
    ul.append(li);
  }
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
  addEventListener('pagehide', stopCamera);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCamera();
      if (S.screen === 'play') endRound();
    }
  });
  addEventListener('resize', resize);
}



let stream = null;

let estimator = null;
let camRun = 0;
const smoother = new PoseSmoother();
let camFrames = 0;
let quality = initialQuality(); 

async function startCamera() {
  if (stream) return true;
  const note = $('frame-note');
  try {
    note.hidden = false;
    note.textContent = 'Asking for the camera...';
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    note.textContent = 'Waking up the magic mirror...';
    if (!estimator) estimator = await (await import('./pose/detector.js')).createPoseEstimator();
    note.hidden = true;
  } catch (err) {
    stopCamera();
    note.hidden = false;
    note.textContent =
      err?.name === 'NotAllowedError'
        ? 'The camera is switched off. You can still play with the demo player.'
        : 'No camera found. You can still play with the demo player.';
    $('use-demo').hidden = false;
    return false;
  }
  S.source = 'camera';
  smoother.reset();
  const run = ++camRun;
  const loop = async () => {
    while (run === camRun && stream) {
      
      const skip = ++camFrames % QUALITY[quality.level].detectEvery !== 0;
      const f = skip ? null : await estimator.estimate(video, performance.now() / 1000);
      if (f) {
        S.frame = mirrorFrame(smoother.smooth(f));
        S.fresh = true;
      }
      await new Promise((r) => requestAnimationFrame(r));
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
  }
}


async function toFraming() {
  show('frame');
  S.readyFor = 0;
  $('use-demo').hidden = true;
  if (!opts.demo) await startCamera();
}

function beginRound({ tutorial = true } = {}) {
  S.game = createGame({ mode: opts.mode, level: opts.level, seed: opts.demo ? 7 : (Date.now() & 0xffff) + 1, tutorial });
  S.tracker.reset();
  S.hits = 0;
  S.ask = { move: '', start: S.t };
  show('play');
  $('card').style.visibility = opts.mode === 'mirror' ? 'hidden' : 'visible';
  $('time-bar').parentElement.hidden = opts.mode === 'mirror';
  if (S.game.phase === 'tutorial') flash('Ready? Arms up!');
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

function resize() {
  view.dpr = Math.min(QUALITY[quality.level].pixelRatioCap, devicePixelRatio || 1);
  view.cw = innerWidth;
  view.ch = innerHeight;
  canvas.width = Math.round(view.cw * view.dpr);
  canvas.height = Math.round(view.ch * view.dpr);
}

function frameSize() {
  if (S.source === 'camera' && video.videoWidth) return { fw: video.videoWidth, fh: video.videoHeight };
  return { fw: 720, fh: Math.round((720 * view.ch) / view.cw) }; 
}

function demoPlace(fw, fh) {
  const stature = Math.min(fh * 0.66, fw * 0.9);
  
  return { cx: fw / 2, ground: fh * (fh > fw ? 0.8 : 0.9), stature };
}

function wanted() {
  const g = S.game;
  if (S.screen !== 'play' || !g) return null;
  if (g.card) return g.card.moves[g.card.step];
  if (g.mode === 'mirror') return MOVES[Math.floor((S.t - S.ask.start) / 3.2) % MOVES.length];
  return null;
}

function tick(h) {
  S.t += h;
  const { fw, fh } = frameSize();
  if (S.source === 'demo') {
    const want = wanted();
    if (want !== S.ask.move && S.game?.mode !== 'mirror') S.ask = { move: want ?? '', start: S.t };
    const ask = want ? { move: want, since: S.game?.mode === 'mirror' ? (S.t - S.ask.start) % 3.2 : S.t - S.ask.start } : null;
    S.frame = mirrorFrame({ pose: demoPose(S.t, ask, demoPlace(fw, fh), opts.body), width: fw, height: fh, t: S.t });
    S.fresh = true;
  }
  const frame = S.frame;

  if (S.screen === 'frame' && frame) {
    const seen = seenJoints(frame.pose);
    for (const li of $('joints').children) li.classList.toggle('seen', !!seen[li.dataset.joint]);
    const ready = framingAdvice(frame.pose, frame.width, frame.height) === 'ready';
    $('frame-h').textContent = ready ? 'I can see you! Get ready...' : 'Step back until I can see you from head to feet';
    S.readyFor = ready ? S.readyFor + h : 0;
    if (S.readyFor > (opts.demo ? 1.2 : 1)) beginRound();
  }

  if (S.screen === 'play' && S.game && frame) {
    let input = {};
    if (S.fresh) {
      const res = S.tracker.update(frame);
      const visible = new Set(MOVES.filter((m) => moveVisible(frame.pose, m)));
      input = { hits: res.hits, partial: res.partial, visible };
      S.fresh = false;
    }
    for (const ev of step(S.game, h, input)) onEvent(ev, frame);
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
  return { width: frame.width, height: frame.height, centre, ground: feet.length ? Math.max(...feet) : frame.height * 0.95, unit: T };
}

function onEvent(ev, frame) {
  const stage = stageOf(frame);
  if (ev.type === 'hit') {
    S.hits++;
    S.fx.trigger(ev, opts.costume, stage);
    if (ev.power) flash('Power up!');
    else if (ev.combo >= 2) flash(`Combo x${ev.combo}!`, 0.9);
  } else if (ev.type === 'step') S.fx.trigger(ev, opts.costume, stage);
  else if (ev.type === 'nearly' && S.t - S.nearlyAt > 1.5) {
    S.nearlyAt = S.t;
    S.fx.trigger(ev, opts.costume, stage);
    flash('Nearly!', 0.8);
  } else if (ev.type === 'miss') flash('Next one!', 0.8);
  else if (ev.type === 'start') flash('Here we go!');
  else if (ev.type === 'finale') flash('Finale! Double magic!', 2);
  else if (ev.type === 'end') setTimeout(() => S.screen === 'play' && showResult(ev.score, ev.stars), 1200);
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
  view.scale = Math.max(view.cw / fw, view.ch / fh);
  view.ox = (view.cw - fw * view.scale) / 2;
  view.oy = (view.ch - fh * view.scale) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const k = view.dpr * view.scale;
  ctx.setTransform(k, 0, 0, k, view.ox * view.dpr, view.oy * view.dpr);
  const frame = S.frame;
  if (S.source === 'camera' && stream) {
    
    ctx.save();
    ctx.translate(fw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, fw, fh);
    ctx.restore();
  } else if (frame) drawMannequin(ctx, frame.pose);
  if (frame) {
    let placed = placeCostume(opts.costume, frame.pose, iconSet, 'right');
    if (overlay?.ready(opts.costume)) {
      
      const drawn = overlay.render(mirrorFrame(frame).pose, fw, fh, view.scale * view.dpr);
      S.pieces3d = overlay.visibleCount();
      if (drawn) {
        ctx.save();
        ctx.translate(fw, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(overlay.canvas, 0, 0, fw, fh);
        ctx.restore();
        const gone = new Set(COSTUMES_3D[opts.costume].pieces.map((p) => p.replaces));
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
  S.fx.draw(ctx, images);
}

let last = 0;
function loop(now) {
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
  last = now;
  if (S.source === 'camera') {
    const was = quality.level;
    quality = stepQuality(quality, dt);
    if (quality.level !== was) resize();
  }
  let remain = dt * (S.source === 'demo' ? opts.speed : 1);
  while (remain > 1e-6) {
    const h = Math.min(1 / 30, remain);
    remain -= h;
    tick(h);
  }
  draw();
  if (S.screen === 'play') updateHud();
  requestAnimationFrame(loop);
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
        placed: S.placed,
        pieces3d: S.pieces3d,
        card: g?.card?.moves ?? null,
      };
    },
  }),
});


async function start3d() {
  try {
    const { CostumeOverlay } = await import('./three/overlay.js');
    overlay = new CostumeOverlay();
    await overlay.setCostume(opts.costume);
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
  else show('title');
  document.body.dataset.ready = '1';
  requestAnimationFrame(loop);
}

boot();
