




import { soundsFor, stageCue } from './audio/audioManifest.js';
import { createSound } from './audio/sound.js';
import { Aim } from './input/aim.js';
import { demoHands } from './input/demoHands.js';
import { readHands } from './input/hands.js';
import { createModeSwitch } from './input/mode.js';
import { createTouch } from './input/touch.js';
import { railSeconds } from './net/clock.js';
import { mergeReport } from './net/hitsync.js';
import { createLocalRoom, createRoom, roomView, stepRoom } from './net/localRoom.js';
import { advanceTo, createLockstep } from './net/lockstep.js';
import { clampPlayers } from './net/scaling.js';
import { createPoseEstimator } from './pose/detector.js';
import { devicePlan } from './pose/device.js';
import { mirrorFrame, PoseSmoother } from './pose/pose.js';
import { bossPhase, createGame, endStage, stepGame } from './sim.js';
import { createHud } from './ui/hud.js';
import { GUN_FILE } from './world/artManifest.js';
import { createScene } from './world/scene.js';
import { createViewmodels } from './world/viewmodel.js';

const q = new URLSearchParams(location.search);
const demo = q.get('demo') === '1';
const forced = q.get('input');
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const urlDifficulty = DIFFICULTIES.includes(q.get('difficulty') ?? '') ? q.get('difficulty') : 'easy';
const STAGES = ['s0-dropzone', 's1-jungle', 's2-visitor', 's3-river', 's4-volcano', 's5-stadium'];
const cheat = q.get('cheat');
const urlStage = cheat === 'boss' ? 5 : Math.min(5, Math.max(0, Math.floor(Number(q.get('stage') ?? 1)) || 0));



const roomParam = q.get('room');
const online = roomParam === null ? null : await openOnline(roomParam);
async function openOnline(code) {
  const [{ openRoom }, { createLobby }] = await Promise.all([import('./net/firestore.js'), import('./ui/lobby.js')]);
  const ui = createLobby( (document.getElementById('hud')));
  return openRoom({ code: code.toUpperCase(), emu: q.get('emu') === '1', ui, stage: urlStage, difficulty: urlDifficulty ?? 'easy' });
}

const difficulty =  (
  online && DIFFICULTIES.includes(online.difficulty) ? online.difficulty : urlDifficulty
);
const stageNo = online ? Math.min(5, Math.max(0, online.stage)) : urlStage;
const MAX_SKIP_S = 600; 


function goToStage(n) {
  const u = new URL(location.href);
  for (const k of ['t', 'cheat', 'phase']) u.searchParams.delete(k);
  u.searchParams.set('stage', String(n));
  location.assign(u);
}

const canvas =  (document.getElementById('view'));
const video =  (document.getElementById('cam'));
const plan = devicePlan({
  coarse: matchMedia('(pointer: coarse)').matches,
  ua: navigator.userAgent,
  model: q.get('model') ?? undefined,
  memory:  (navigator).deviceMemory,
  cores: navigator.hardwareConcurrency,
  power: q.get('power') ?? undefined,
});

const stageJson = await (await fetch(new URL(`../stages/${STAGES[stageNo]}.json`, import.meta.url))).json();

const players = online ? clampPlayers(online.size) : clampPlayers(Number(q.get('players') ?? 1));
const game = createGame({ stage: stageJson, difficulty, players, godmode: q.get('godmode') === '1' });


const room = online
  ? createRoom({ me: online.me, name: online.name })
  : players > 1
    ? createLocalRoom(players, Number(q.get('seed') ?? 1) || 1)
    : null;
if (online && room) online.listen((id, report) => mergeReport(room.ledger, id, report));
const lockstep = createLockstep();
let lobbyShown = !!online;
const view = createScene(canvas, game.stage, plan);
const guns3d = createViewmodels(view.camera);
view.art.then((a) => guns3d.setModel(a?.models[GUN_FILE]));

const sound = createSound();
sound.music(stageCue(stageJson) ?? 'menu');
const hud = createHud( (document.getElementById('hud')), {
  sound,
  onSkip: () => goToStage(stageNo + 1),
  
  onNext: stageNo < 5 && !online ? () => goToStage(stageNo + 1) : null,
});
const touch = createTouch(canvas);
const mode = createModeSwitch({ cameraAvailable: demo });

const idle = { guns: [], ray: () => null };
const phase = Number(q.get('phase') ?? 0);
const skipTo = online ? 0 : Math.min(MAX_SKIP_S, Number(q.get('t') ?? 0) || (cheat === 'rank' ? MAX_SKIP_S : 0));
if (skipTo || phase > 1) {
  const god = game.godmode;
  game.godmode = true;
  for (let t = 0; t < skipTo && !game.ended; t += 0.5) stepGame(game, 0.5, idle);
  for (let t = 0; phase > 1 && !game.boss && t < 30; t += 0.5) stepGame(game, 0.5, idle);
  if (phase > 1) {
    bossPhase(game, phase);
    stepGame(game, 0.2, idle);
  }
  if (cheat === 'rank') endStage(game);
  game.godmode = god;
  game.events.length = 0;
}


let aim = new Aim({ width: 640, height: 480 });
const smoother = new PoseSmoother();

let hands = null;
let estimator = null;

async function startCamera() {
  if (demo || q.get('nocamera') === '1' || !navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', ...plan.camera }, audio: false });
    video.srcObject = stream;
    await video.play();
    estimator = await createPoseEstimator(plan);
    aim = new Aim({ width: video.videoWidth || 640, height: video.videoHeight || 480 });
    mode.setCamera(true);
    poseLoop();
  } catch (err) {
    console.info('Rex Rampage: camera not available, touch aim only.', err instanceof Error ? err.message : err);
    mode.setCamera(false);
  }
}

async function poseLoop() {
  if (!estimator || estimator.failed()) {
    mode.setCamera(false);
    return;
  }
  const t = performance.now() / 1000;
  const f = await estimator.estimate(video, t);
  hands = f ? readHands(smoother.smooth(mirrorFrame(f)).pose) : null;
  
  setTimeout(poseLoop, mode.mode === 'camera' ? 0 : 200);
}


let last = performance.now();
let leaving = false;
const stats = { frames: 0, fps: 0 };
function frame(now) {
  const dt = Math.min(0.5, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  if (demo) hands = readHands(demoHands(t).pose);
  const touched = touch.takeTouched();
  if (forced !== 'touch' && forced !== 'camera') mode.update(t, { touched, body: !!hands?.body });
  else mode.mode = forced;

  
  const state = { left: { ndc: null, up: false }, right: { ndc: null, up: false } };
  if (game.stage.cutscene) {
    
    if (game.ended && !leaving) {
      leaving = true;
      goToStage(stageNo + 1);
    }
  } else if (mode.mode === 'camera' && hands) {
    for (const side of  (['left', 'right'])) {
      const h = hands[side];
      state[side] = { ndc: h.up ? null : aim.point(side, h, t), up: h.up };
    }
  } else {
    const p = touch.pointers();
    const up = hud.reloadHeld();
    state.right = { ndc: up ? null : (p[0] ?? null), up };
    state.left = { ndc: up ? null : (p[1] ?? null), up: up && !!p[1] };
  }
  const ammoBefore = { left: { ammo: game.guns.left.ammo }, right: { ammo: game.guns.right.ammo } };
  const input = { guns: Object.entries(state).map(([side, s]) => ({ side, ...s })), ray: view.ray };
  if (online) {
    const toStart = online.startAtMs - (Date.now() + online.offsetMs);
    if (toStart > 0) online.ui.status(`Starting in ${Math.ceil(toStart / 1000)}`);
    else if (lobbyShown) {
      lobbyShown = false;
      online.ui.hide();
    }
    advanceTo(lockstep, game, railSeconds(Date.now(), online.startAtMs, online.offsetMs), input);
  } else stepGame(game, dt, input);
  if (room && !game.stage.cutscene) {
    const mine = stepRoom(room, game, dt, now);
    if (online && mine) online.send(mine);
  }
  online?.pump();
  const events = game.events.splice(0);
  const heard = soundsFor(events, ammoBefore, game.guns);
  sound.play(heard.sfx);
  if (heard.music) sound.music(heard.music);
  for (const ev of events) {
    if (ev.type === 'kill') stats.kills = (stats.kills ?? 0) + 1;
  }
  guns3d.update(
    { left: { ...state.left, reloading: game.guns.left.reloading }, right: { ...state.right, reloading: game.guns.right.reloading } },
    events,
    dt,
  );
  view.draw(game, events, dt);
  hud.update(game, mode, state, events, dt, room ? roomView(room, now, view.project) : null);
  stats.frames++;
  stats.fps += (1 / Math.max(dt, 1e-3) - stats.fps) * 0.05;
  requestAnimationFrame(frame);
}

function resize() {
  view.resize(innerWidth, innerHeight);
}
addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
startCamera();


Object.assign(window, {
  __rr: {
    stats: () => ({
      ...stats,
      kills: game.score.kills,
      shots: game.score.shots,
      points: game.score.points,
      hearts: game.life.hearts,
      dist: game.run.dist,
      ended: game.ended,
      rank: game.rank,
      mode: mode.mode,
      hint: mode.hint,
      sound: sound.state(),
      enemies: game.enemies.length,
      stage: stageNo,
      cutscene: game.stage.cutscene,
      crouched: game.crouched,
      cover: game.cover,
      vehicle: game.vehicle,
      phase: game.boss ? game.boss.phase : 0,
      bossDone: !!game.boss?.done,
      hostages: { ...game.hostages },
      players,
      remoteKills: room?.remoteKills ?? 0,
      remoteHits: room?.remoteHits ?? 0,
      room: online?.code ?? null,
      labels: document.querySelectorAll('.hud-confetti:not([hidden])').length,
      board: document.querySelectorAll('.hud-board:not([hidden]) .hud-board-row').length,
    }),
    
    targets: () =>
      game.enemies
        .filter((e) => !e.dead)
        .map((e) => view.project(e.pos))
        .filter((p) => p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1)
        .map((p) => ({ x: ((p.x + 1) / 2) * innerWidth, y: ((1 - p.y) / 2) * innerHeight })),
  },
});
