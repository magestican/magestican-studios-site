








import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BULLET_TYPES, rasterBullet } from './bullets.js';
import { FIELD_W, FIELD_H, TILE_PX, GROUND_TINT, GROUND_TILES, groundTileAt } from './field.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { uiSoundOn, setUiSound } from '../../../web-engine/brand/uiSound.js';
import { SFX_TAKES, MENU_CUES, MUSIC_TRACKS, createFlipWatch, soundToggleCue, followSound } from './sound.js';
import { BURST_COST, ENEMY_CAP, TICK_HZ, createSim, step } from './sim/sim.js';
import { FP } from './sim/fixed.js';
import { MOVE_MAX, pack } from './sim/input.js';
import { BOSS_AT, SCROLL, cueAt } from './sim/stage.js';
import { stickToMove } from './controls.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);


const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), Object.keys(SFX_TAKES), SFX_TAKES);
const ui = createGameSfx(new URL('../assets/ui/', import.meta.url), MENU_CUES);
const music = createTrackMusic({ game: 'polarity-shmup', manifestUrl: new URL('../assets/music/music.json', import.meta.url), trackIds: MUSIC_TRACKS });
const p1Flip = createFlipWatch();
const soundBtn = $('sound');
function drawSound() {
  const on = uiSoundOn();
  soundBtn.textContent = on ? 'Sound on' : 'Sound off';
  soundBtn.setAttribute('aria-pressed', String(on));
}
drawSound();
addEventListener('pointerdown', () => followSound(music, uiSoundOn()), { once: true });
soundBtn.addEventListener('click', () => {
  setUiSound(!uiSoundOn());
  drawSound();
  ui.play(soundToggleCue(uiSoundOn()));
  followSound(music, uiSoundOn());
});


const SHIP_LEN = 44, DART_LEN = 36, TURRET_W = 64, WARDEN_W = 96, BOSS_W = 330, PROP_SCALE = 4.6;
const wx = (x) => x / FP - FIELD_W / 2;
const wz = (y) => y / FP - FIELD_H / 2;

const host = $('field');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14161c);
const camera = new THREE.OrthographicCamera(-FIELD_W / 2, FIELD_W / 2, FIELD_H / 2, -FIELD_H / 2, 1, 4000);
camera.position.set(0, 2000, 0);
camera.up.set(0, 0, -1);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x3a3328, 1.1));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.set(-260, 700, -320);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 520, bottom: -520, near: 10, far: 2000 });
scene.add(sun, sun.target);


const texLoader = new THREE.TextureLoader();
const tileMats = {};
for (const id of GROUND_TILES) {
  const tex = texLoader.load(`assets/stage1-ground/stage1_ground/tiles/${id}.png`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.color.setScalar(GROUND_TINT);
  tileMats[id] = m;
}
const COLS = Math.round(FIELD_W / TILE_PX), ROWS = Math.ceil(FIELD_H / TILE_PX) + 2;
const tileGeo = new THREE.PlaneGeometry(TILE_PX, TILE_PX).rotateX(-Math.PI / 2);
const tiles = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const mesh = new THREE.Mesh(tileGeo, tileMats.dust_plain);
  scene.add(mesh);
  tiles.push(mesh);
}
const shadowSheet = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W + 40, FIELD_H + 40).rotateX(-Math.PI / 2),
  new THREE.ShadowMaterial({ opacity: 0.32 }));
shadowSheet.position.y = 0.5;
shadowSheet.receiveShadow = true;
scene.add(shadowSheet);

const dusk = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W + 40, FIELD_H + 40).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x0b0a12, transparent: true, opacity: 0, depthWrite: false }));
dusk.position.y = 0.3;
scene.add(dusk);


const gltf = new GLTFLoader();
const loadGlb = (path) => new Promise((ok, fail) => gltf.load(path, (g) => ok(g.scene), undefined, fail));

function fit(obj, len, { axis = 'x' } = {}) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const s = len / (axis === 'x' ? size.x : axis === 'z' ? size.z : Math.max(size.x, size.z));
  const centre = box.getCenter(new THREE.Vector3());
  obj.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
  obj.scale.setScalar(s);
  const wrap = new THREE.Group();
  wrap.add(obj);
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return wrap;
}

let ship = null;           
const pools = {};          
let warden = null, furnace = null;
const props = [];

function pool(key, proto, n, y) {
  pools[key] = [];
  for (let i = 0; i < n; i++) {
    const o = proto.clone(true);
    o.visible = false;
    o.position.y = y;
    scene.add(o);
    pools[key].push(o);
  }
}

async function loadModels() {
  const [e, v, de, di, te, ti, fe, fi] = await Promise.all([
    'craft/fighter_p1_ember/fighter_p1_ember', 'craft/fighter_p1_iris/fighter_p1_iris', 'craft/dart_ember/dart_ember',
    'craft/dart_iris/dart_iris', 'craft/turret_ember/turret_ember', 'craft/turret_iris/turret_iris',
    'craft/furnace_ember/furnace_ember', 'craft/furnace_iris/furnace_iris',
  ].map((p) => loadGlb(`assets/${p}.glb`)));
  const roll = new THREE.Group();
  const ember = fit(e, SHIP_LEN), iris = fit(v, SHIP_LEN);
  ember.rotation.y = iris.rotation.y = Math.PI / 2; 
  roll.add(ember, iris);
  const group = new THREE.Group();
  group.add(roll);
  group.position.y = 40;
  const core = new THREE.Mesh(new THREE.CircleGeometry(3, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, toneMapped: false }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(3, 4.2, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x101018, depthTest: false, toneMapped: false }));
  core.position.y = ring.position.y = 60; core.renderOrder = ring.renderOrder = 30;
  group.add(ring, core);
  
  const halo = new THREE.Mesh(new THREE.RingGeometry(22, 25, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.6, depthTest: false, toneMapped: false }));
  halo.position.y = 58; halo.renderOrder = 29;
  group.add(halo);
  scene.add(group);
  ship = { group, roll, ember, iris, halo, lastX: 0, bank: 0, flipT: 0, pol: 0 };

  for (const [key, src, len, y, opts, rot] of [
    ['dart0', de, DART_LEN, 60, {}, -Math.PI / 2], ['dart1', di, DART_LEN, 60, {}, -Math.PI / 2],
    ['turret0', te, TURRET_W, 0, { axis: 'max' }, 0], ['turret1', ti, TURRET_W, 0, { axis: 'max' }, 0],
  ]) {
    const proto = fit(src.clone(true), len, opts);
    proto.rotation.y = rot;
    pool(key, proto, key.startsWith('dart') ? 20 : 6, y);
  }
  warden = fit(ti.clone(true), WARDEN_W, { axis: 'max' });
  warden.visible = false;
  scene.add(warden);
  const fEmber = fit(fe, BOSS_W, { axis: 'z' }), fIris = fit(fi, BOSS_W, { axis: 'z' });
  furnace = new THREE.Group();
  furnace.add(fEmber, fIris);
  furnace.rotation.y = Math.PI / 2; 
  furnace.visible = false;
  scene.add(furnace);
  furnace.userData = { ember: fEmber, iris: fIris };

  const propIds = ['bunker', 'hangar', 'pylon', 'radar', 'rock', 'silo'];
  const models = await Promise.all(propIds.map((id) => loadGlb(`assets/props/${id}/${id}.glb`)));
  let seed = 1729;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296); 
  for (let n = 0; n < 14; n++) {
    const p = models[n % models.length].clone(true);
    p.scale.setScalar(PROP_SCALE);
    p.rotation.y = Math.floor(rnd() * 4) * (Math.PI / 2);
    p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    p.userData.x = (rnd() - 0.5) * (FIELD_W - 70);
    p.userData.z0 = -n * 120 - rnd() * 40;
    scene.add(p);
    props.push(p);
  }
}



const ENEMY_TYPES = BULLET_TYPES.slice(0, 4);
const SHOT_TYPE = BULLET_TYPES.find((t) => t.id === 'shot');
const ORB_TYPE = BULLET_TYPES.find((t) => t.id === 'orb');
let sets = null; 

function makeSet(type, pol, pxScale, cap) {
  const r = rasterBullet(type, pol ? 'iris' : 'ember', pxScale);
  const tex = new THREE.DataTexture(new Uint8Array(r.data.buffer), r.w, r.h, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(r.w / pxScale, r.h / pxScale).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
  const mesh = new THREE.InstancedMesh(geo, mat, cap);
  mesh.renderOrder = 10;
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  return mesh;
}

function buildBullets(pxScale) {
  if (sets) for (const m of [...sets.enemy.flat(), ...sets.shot, ...sets.burst]) {
    scene.remove(m); m.geometry.dispose(); m.material.map.dispose(); m.material.dispose();
  }
  sets = {
    enemy: ENEMY_TYPES.map((t) => [0, 1].map((pol) => makeSet(t, pol, pxScale, 1024))),
    shot: [0, 1].map((pol) => makeSet(SHOT_TYPE, pol, pxScale, 256)),
    burst: [0, 1].map((pol) => makeSet(ORB_TYPE, pol, pxScale, 64)),
  };
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);
function put(mesh, x, z, ang) {
  _p.set(x, 70, z);
  _q.setFromAxisAngle(UP, ang);
  _m.compose(_p, _q, _s);
  mesh.setMatrixAt(mesh.count++, _m);
}

function drawBullets(s) {
  for (const m of [...sets.enemy.flat(), ...sets.shot, ...sets.burst]) m.count = 0;
  for (let i = 0; i < s.nb; i++) {
    
    put(sets.enemy[s.bkind[i]][s.bpol[i]], wx(s.bx[i]), wz(s.by[i]), -Math.atan2(s.bvx[i], s.bvy[i]));
  }
  for (let i = 0; i < s.ns; i++) {
    const pol = s.players[s.sown[i]].iris;
    const set = s.sdmg[i] > 1 ? sets.burst[pol] : sets.shot[pol];
    if (set.count < set.instanceMatrix.count) put(set, wx(s.sx[i]), wz(s.sy[i]), -Math.atan2(s.svx[i], -14 * FP));
  }
  for (const m of [...sets.enemy.flat(), ...sets.shot, ...sets.burst]) m.instanceMatrix.needsUpdate = true;
}


const flashGeo = new THREE.RingGeometry(0.6, 1, 32).rotateX(-Math.PI / 2);
const flashes = [];
function flash(x, z, size, color) {
  const m = new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, toneMapped: false }));
  m.position.set(x, 80, z);
  m.renderOrder = 25;
  m.userData = { t: 0, size };
  scene.add(m);
  flashes.push(m);
}
function stepFlashes(dt) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.userData.t += dt;
    const k = f.userData.t / 0.45;
    if (k >= 1) { scene.remove(f); f.material.dispose(); flashes.splice(i, 1); continue; }
    f.scale.setScalar(f.userData.size * (0.3 + k));
    f.material.opacity = 1 - k;
  }
}


const keys = new Set();
let flipLevel = 0, bombQueued = false;
function flip() { flipLevel ^= 1; }
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'j' || k === 'z') { flip(); e.preventDefault(); }
  else if (k === 'k' || k === 'x') bombQueued = true;
  else if (k === 'escape' || k === 'p') togglePause();
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); if (mode === 'play') setPaused(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') setPaused(true); });


const drag = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
let fieldScale = 1;
host.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  if (drag.id !== null && e.pointerType === 'touch') { flip(); return; }
  drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY;
});
host.addEventListener('pointermove', (e) => {
  if (e.pointerId !== drag.id) return;
  drag.dx += ((e.clientX - drag.x) / fieldScale) * 1.2;
  drag.dy += ((e.clientY - drag.y) / fieldScale) * 1.2;
  drag.x = e.clientX; drag.y = e.clientY;
});
for (const ev of ['pointerup', 'pointercancel']) host.addEventListener(ev, (e) => { if (e.pointerId === drag.id) drag.id = null; });
$('flip').addEventListener('pointerdown', (e) => { e.preventDefault(); flip(); });
$('bomb').addEventListener('pointerdown', (e) => { e.preventDefault(); bombQueued = true; });

let padFlipHeld = false, padBombHeld = false;
function readInput() {
  let x = 0, y = 0, focus = keys.has('shift');
  if (keys.has('arrowleft') || keys.has('a')) x -= MOVE_MAX;
  if (keys.has('arrowright') || keys.has('d')) x += MOVE_MAX;
  if (keys.has('arrowup') || keys.has('w')) y -= MOVE_MAX;
  if (keys.has('arrowdown') || keys.has('s')) y += MOVE_MAX;
  const pad = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
  if (pad) {
    const m = stickToMove(pad.axes[0] || 0, pad.axes[1] || 0);
    if (m.x || m.y) { x = m.x; y = m.y; }
    const a = !!pad.buttons[0]?.pressed, b = !!(pad.buttons[1]?.pressed || pad.buttons[2]?.pressed);
    if (a && !padFlipHeld) flip();
    if (b && !padBombHeld) bombQueued = true;
    padFlipHeld = a; padBombHeld = b;
    if (pad.buttons[6]?.pressed || pad.buttons[7]?.pressed) focus = true;
  }
  if (drag.dx || drag.dy) { 
    const per = 4.5; 
    const mx = Math.max(-per, Math.min(per, drag.dx)), my = Math.max(-per, Math.min(per, drag.dy));
    drag.dx -= mx; drag.dy -= my;
    x = Math.round((mx / per) * MOVE_MAX); y = Math.round((my / per) * MOVE_MAX);
  }
  const bomb = bombQueued; bombQueued = false;
  return pack({ x, y, iris: flipLevel === 1, bomb, focus });
}


let sim = null, mode = 'title', paused = false, gentle = true;
let acc = 0, last = performance.now();
const seen = { boom: 0, absorbed: 0, bursts: 0, hits: 0, kills: 0, shotTick: 0 };

function start(isGentle) {
  gentle = isGentle;
  
  sim = createSim({ seed: (Date.now() & 0x7fffffff) || 1, gentle });
  flipLevel = 0; drag.dx = drag.dy = 0;
  Object.assign(seen, { boom: 0, absorbed: 0, bursts: 0, hits: 0, kills: 0, shotTick: 0 });
  mode = 'play';
  setPaused(false);
  $('title').hidden = true; $('tally').hidden = true;
  $('lives').hidden = gentle;
  ui.play('open');
  followSound(music, uiSoundOn());
}
$('start').addEventListener('click', () => start(true));
$('arcade').addEventListener('click', () => start(false));
$('again').addEventListener('click', () => start(gentle));

function setPaused(p) {
  paused = p && mode === 'play';
  $('paused').hidden = !paused;
  last = performance.now(); acc = 0;
}
function togglePause() { if (mode === 'play') setPaused(!paused); }
$('paused').addEventListener('click', () => setPaused(false));

function showTally(s) {
  mode = 'tally';
  const p = s.players[0];
  const secs = Math.round(s.tick / TICK_HZ);
  $('tally-head').textContent = s.over ? 'Shot down' : s.boss.beaten ? 'Dustline clear' : 'The Furnace got away';
  $('t-score').textContent = p.score.toLocaleString();
  $('t-drunk').textContent = String(p.absorbed);
  $('t-bursts').textContent = String(p.bursts);
  $('t-kills').textContent = String(p.kills);
  $('t-time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $('again').textContent = s.over ? 'Try again' : 'Play again';
  $('tally').hidden = false;
  ui.play('open');
}


const hud = { score: $('score'), meter: $('meter'), lives: $('lives'), pol: $('pol'), bombs: $('bombs'), flipBtn: $('flip') };
const enemyMeshes = new Map(); 

function syncEnemies(s) {
  const live = new Set();
  for (let e = 0; e < s.ne; e++) {
    const id = s.eid[e], k = s.ek[e];
    live.add(id);
    let o = enemyMeshes.get(id);
    if (!o) {
      if (k === 2) o = warden;
      else o = pools[`${k === 0 ? 'dart' : 'turret'}${s.ep[e]}`]?.find((m) => !m.visible);
      if (!o) continue;
      o.visible = true;
      enemyMeshes.set(id, o);
    }
    o.position.x = wx(s.ex[e]);
    o.position.z = wz(s.ey[e]);
    if (k !== 0 && ship) { 
      const p = s.players[0];
      o.rotation.y = Math.atan2(wx(p.x) - o.position.x, wz(p.y) - o.position.z) - Math.PI / 2;
    }
  }
  for (const [id, o] of enemyMeshes) if (!live.has(id)) { o.visible = false; enemyMeshes.delete(id); }
}

function draw(s, dt) {
  const scrollPx = (s.tick * SCROLL) / FP;
  const base = Math.floor(scrollPx / TILE_PX);
  let i = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) {
    const row = base + r - 1;
    tiles[i].position.set(-FIELD_W / 2 + TILE_PX * (c + 0.5), 0, FIELD_H / 2 - TILE_PX * (row + 0.5) + scrollPx);
    tiles[i].material = tileMats[groundTileAt(c, row)];
  }
  const span = 14 * 120 + 200;
  for (const p of props) {
    let z = p.userData.z0 + (scrollPx % span);
    if (z > FIELD_H / 2 + 80) z -= span;
    p.position.set(p.userData.x, 0, z);
  }
  dusk.material.opacity = Math.max(0, Math.min(0.35, (s.tick - (BOSS_AT - 360)) / 360 * 0.35));
  if (!ship) return;

  const p = s.players[0];
  ship.group.visible = p.on === 1 && p.lives > 0; 
  const x = wx(p.x), z = wz(p.y);
  const vx = x - ship.group.position.x;
  ship.group.position.x = x; ship.group.position.z = z;
  ship.bank += (Math.max(-1, Math.min(1, vx / 4)) - ship.bank) * Math.min(1, dt * 10);
  if (p.iris !== ship.pol) { ship.pol = p.iris; ship.flipT = 0.3; }
  if (ship.flipT > 0) ship.flipT = Math.max(0, ship.flipT - dt);
  const flipping = ship.flipT > 0;
  
  ship.ember.visible = flipping && ship.flipT > 0.15 ? !!p.iris : !p.iris;
  ship.iris.visible = !ship.ember.visible;
  ship.roll.rotation.z = flipping ? (1 - ship.flipT / 0.3) * Math.PI * 2 : -ship.bank * 0.55;
  ship.halo.visible = p.inv > 0 && Math.floor(s.tick / 6) % 2 === 0;
  const cue = p1Flip(p.iris ? 'iris' : 'ember');
  if (cue) sfx.play(cue);

  syncEnemies(s);
  if (furnace) {
    furnace.visible = s.boss.on === 1;
    furnace.position.set(wx(s.boss.x), 90, wz(s.boss.y));
    const irisPhase = s.boss.phase === 1;
    furnace.userData.ember.visible = !irisPhase;
    furnace.userData.iris.visible = irisPhase;
  }
  drawBullets(s);

  
  for (; seen.boom < s.nboom; seen.boom++) {
    const n = seen.boom % 16, k = s.boomK[n];
    flash(wx(s.boomX[n]), wz(s.boomY[n]), [40, 64, 120, 260][k], k === 3 ? 0xfff1c0 : 0xffd27a);
    sfx.play(k >= 2 ? 'boom' : 'pop');
  }
  if (p.absorbed > seen.absorbed) { sfx.play('absorb'); seen.absorbed = p.absorbed; }
  if (p.bursts > seen.bursts) { sfx.play('release'); seen.bursts = p.bursts; flash(x, z, 60, p.iris ? 0xa878ff : 0xffc440); }
  if (p.hits > seen.hits) { sfx.play('hurt'); seen.hits = p.hits; }
  if (s.tick - seen.shotTick >= 15 && mode === 'play' && !s.clear) { sfx.play('shot'); seen.shotTick = s.tick; }

  
  hud.score.textContent = p.score.toLocaleString();
  hud.meter.style.transform = `scaleX(${Math.min(1, p.energy / BURST_COST)})`;
  hud.meter.dataset.pol = p.iris ? 'iris' : 'ember';
  hud.lives.textContent = `Lives ${Math.max(0, p.lives)}`;
  hud.pol.textContent = p.iris ? 'IRIS' : 'EMBER';
  hud.pol.dataset.pol = p.iris ? 'iris' : 'ember';
  hud.bombs.textContent = String(p.bombs);
  const c = cueAt(s.tick);
  hud.flipBtn.dataset.pol = p.iris ? 'iris' : 'ember';
  hud.flipBtn.dataset.cue = c < 0 || c === p.iris ? '' : c ? 'iris' : 'ember'; 
}


let pxScale = 0;
function layout() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = Math.min(vw / FIELD_W, vh / FIELD_H);
  const w = Math.floor(FIELD_W * s), h = Math.floor(FIELD_H * s);
  fieldScale = s;
  host.style.width = `${w}px`; host.style.height = `${h}px`;
  document.documentElement.style.setProperty('--fs', String(s));
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = `${w}px`; renderer.domElement.style.height = `${h}px`;
  const next = s * renderer.getPixelRatio();
  if (Math.abs(next - pxScale) > 0.01) { pxScale = next; buildBullets(pxScale); }
}
window.addEventListener('resize', layout);


const idle = createSim({ seed: 1 });
const DT = 1 / TICK_HZ;
let fpsFrames = 0, fpsAt = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (mode === 'title') { step(idle, [0, 0, 0, 0]); draw(idle, dt); }
  else if (sim) {
    if (!paused && mode === 'play') {
      acc += dt;
      let n = 0;
      while (acc >= DT && n < 5) { step(sim, [readInput(), 0, 0, 0]); acc -= DT; n++; }
      if (n === 5) acc = 0;
      if (sim.clear && sim.tick - sim.clear > 150) showTally(sim);
      else if (sim.over && sim.tick - sim.over > 90) showTally(sim);
    } else if (mode === 'tally') step(sim, [pack({}), 0, 0, 0]);
    draw(sim, paused ? 0 : dt);
  }
  stepFlashes(paused ? 0 : dt);
  renderer.render(scene, camera);
  fpsFrames++;
  if (now - fpsAt >= 1000) { document.body.dataset.fps = String(fpsFrames); fpsFrames = 0; fpsAt = now; }
  requestAnimationFrame(frame);
}

layout();
loadModels().then(() => {
  document.body.dataset.ready = '1';
  
  const play = params.get('play');
  if (play) {
    start(play !== 'arcade');
    const skip = Math.min(20000, Number(params.get('skip')) || 0);
    for (let t = 0; t < skip; t++) {
      const dx = (195 * FP - sim.players[0].x) >> 8;
      step(sim, [pack({ x: dx > 2 ? 32 : dx < -2 ? -32 : 0 }), 0, 0, 0]);
    }
  }
}).catch((err) => {
  $('err').textContent = `A model failed to load: ${err && err.message ? err.message : err}`;
});
requestAnimationFrame(frame);
window.__flipwing = { get sim() { return sim; }, start, scene, renderer, ENEMY_CAP };
