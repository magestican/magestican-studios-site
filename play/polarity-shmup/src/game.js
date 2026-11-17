












import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BULLET_TYPES, rasterBullet } from './bullets.js';
import { FIELD_W, FIELD_H, TILE_PX, STAGE_GROUND, groundTileAt } from './field.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { uiSoundOn, setUiSound } from '../../../web-engine/brand/uiSound.js';
import { SFX_TAKES, MENU_CUES, MUSIC_TRACKS, createFlipWatch, soundToggleCue, followSound } from './sound.js';
import { BOOM_BOSS, BOOM_DEFLECT, BURST_COST, ENEMY_CAP, REVIVE_TICKS, TICK_HZ, createSim, step, teamScore } from './sim/sim.js';
import { FP } from './sim/fixed.js';
import { MOVE_MAX, pack } from './sim/input.js';
import { OTHER_ONLY, SCROLL } from './sim/stage.js';
import {
  BOSS_NAMES, CROWN, CROWN_SWITCH, STAGES, TWIN, TWIN_SPLIT, bossShowsIris, stageCue, twinPol,
} from './sim/stages.js';
import { dragFeed, dragRelease, dragTake, stickToMove } from './controls.js';
import { renderEnding } from './ending.js';
import { createFx, makeAura, pulseAura, stepAura } from './fx.js';
import { HIGH_SPAN, PARALLAX, highLayout, propLayout, propSpan, runwayLights } from './scenery.js';

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


const SKIFF_LEN = 32, BULWARK_W = 60, GUNSHIP_W = 92, LOOM_W = 300;

const TWIN_HALF_W = 2 * TWIN_SPLIT;

const STAGE_PROPS = [
  ['props/bunker/bunker', 'props/hangar/hangar', 'props/pylon/pylon', 'props/radar/radar', 'props/rock/rock', 'props/silo/silo'],
  ['stages-props/cairn/cairn', 'stages-props/pump/pump', 'stages-props/tank/tank'],
  ['stages-props/chimney/chimney', 'stages-props/crane/crane', 'stages-props/pipes/pipes'],
  ['stages-props/buoy/buoy', 'stages-props/platform/platform', 'stages-props/wreck/wreck'],
  ['stages-props/spire/spire', 'stages-props/shard/shard', 'stages-props/arch/arch'],
];
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

const fx = createFx(scene);


const texLoader = new THREE.TextureLoader();

const tileMats = STAGE_GROUND.map((g) => Object.fromEntries([g.base, g.strip].map((id) => {
  const tex = texLoader.load(`assets/${g.dir}/tiles/${id}.png`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.color.setScalar(g.tint * (1 - (g.veil || 0)));
  if (g.veil) {
    
    
    const add = g.veil * g.veilL;
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
        `#include <map_fragment>\n\tdiffuseColor.rgb += vec3(${add.toFixed(5)});`);
    };
    m.customProgramCacheKey = () => `veil${add.toFixed(5)}`;
  }
  return [id, m];
})));
const matAt = (c, row, stage) => tileMats[Math.min(stage, tileMats.length - 1)][groundTileAt(c, row, stage)];
const COLS = Math.round(FIELD_W / TILE_PX), ROWS = Math.ceil(FIELD_H / TILE_PX) + 2;
const tileGeo = new THREE.PlaneGeometry(TILE_PX, TILE_PX).rotateX(-Math.PI / 2);
const tiles = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const mesh = new THREE.Mesh(tileGeo, matAt(c, r, 0));
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
const ships = [];          

function makeShip(e, v) {
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
  
  const aura = makeAura();
  group.add(aura);
  group.visible = false;
  scene.add(group);
  return { group, roll, ember, iris, halo, aura, lastX: 0, bank: 0, flipT: 0, pol: 0 };
}


const tethers = [0, 1].map(() => {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.85, depthTest: false, toneMapped: false }));
  l.renderOrder = 28; l.visible = false; l.frustumCulled = false;
  scene.add(l);
  return l;
});
const pools = {};          
let warden = null, furnace = null;
const bosses = []; 
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
  const fighters = [1, 2, 3, 4].flatMap((n) => [`craft/fighter_p${n}_ember/fighter_p${n}_ember`, `craft/fighter_p${n}_iris/fighter_p${n}_iris`]);
  const loaded = await Promise.all([
    ...fighters, 'craft/dart_ember/dart_ember',
    'craft/dart_iris/dart_iris', 'craft/turret_ember/turret_ember', 'craft/turret_iris/turret_iris',
    'craft/furnace_ember/furnace_ember', 'craft/furnace_iris/furnace_iris',
  ].map((p) => loadGlb(`assets/${p}.glb`)));
  const [de, di, te, ti, fe, fi] = loaded.slice(8);
  
  for (let n = 0; n < 4; n++) ships.push(makeShip(loaded[n * 2], loaded[n * 2 + 1]));
  ship = ships[0];

  for (const [key, src, len, y, opts, rot] of [
    ['dart0', de, DART_LEN, 60, {}, -Math.PI / 2], ['dart1', di, DART_LEN, 60, {}, -Math.PI / 2],
    ['turret0', te, TURRET_W, 0, { axis: 'max' }, 0], ['turret1', ti, TURRET_W, 0, { axis: 'max' }, 0],
  ]) {
    const proto = fit(src.clone(true), len, opts);
    proto.rotation.y = rot;
    pool(key, proto, key.startsWith('dart') ? 28 : 8, y); 
  }
  warden = fit(ti.clone(true), WARDEN_W, { axis: 'max' });
  warden.visible = false;
  scene.add(warden);
  furnace = bossGroup(fe, fi, BOSS_W);
  bosses[0] = furnace;

  
  const craft = ['skiff', 'bulwark', 'gunship', 'loom', 'anvil', 'twin', 'crown'];
  const more = await Promise.all(craft.flatMap((c) => ['ember', 'iris'].map((pol) =>
    loadGlb(`assets/stages-craft/${c}_${pol}/${c}_${pol}.glb`))));
  const [se, si, be, bi, ge, gi, le, li, ae, ai, twe, twi, ce, ci] = more;
  for (const [key, src, len, y, opts, rot, n] of [
    ['skiff0', se, SKIFF_LEN, 60, {}, -Math.PI / 2, 32], ['skiff1', si, SKIFF_LEN, 60, {}, -Math.PI / 2, 32],
    ['bulwark0', be, BULWARK_W, 50, { axis: 'max' }, 0, 6], ['bulwark1', bi, BULWARK_W, 50, { axis: 'max' }, 0, 6], 
    ['gunship0', ge, GUNSHIP_W, 70, { axis: 'max' }, 0, 1], ['gunship1', gi, GUNSHIP_W, 70, { axis: 'max' }, 0, 1],
  ]) {
    const proto = fit(src.clone(true), len, opts);
    proto.rotation.y = rot;
    pool(key, proto, n, y);
  }
  bosses[1] = bossGroup(le, li, LOOM_W);
  bosses[2] = bossGroup(ae, ai, BOSS_W);
  bosses[3] = bossGroup(twe, twi, TWIN_HALF_W); 
  bosses[4] = bossGroup(ce, ci, BOSS_W);
  for (const pol of [0, 1]) { 
    const r = new THREE.Mesh(new THREE.RingGeometry(52, 58, 40), new THREE.MeshBasicMaterial({
      color: pol ? 0xa878ff : 0xffc440, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2;
    pool(`halo${pol}`, r, 4, 66);
  }
  await loadProps(stagePropsShown = 0);
}


function bossGroup(e, i, w) {
  const ember = fit(e, w, { axis: 'z' }), iris = fit(i, w, { axis: 'z' });
  const g = new THREE.Group();
  g.add(ember, iris);
  g.rotation.y = Math.PI / 2;
  g.visible = false;
  scene.add(g);
  g.userData = { ember, iris };
  return g;
}


let stagePropsShown = -1;
const propCache = new Map();
async function loadProps(n) {
  const ids = STAGE_PROPS[n] ?? STAGE_PROPS[0];
  const models = await Promise.all(ids.map((id) => {
    if (!propCache.has(id)) propCache.set(id, loadGlb(`assets/${id}.glb`));
    return propCache.get(id);
  }));
  for (const p of props) scene.remove(p);
  props.length = 0;
  
  
  for (const m of models) m.traverse((o) => {
    if (!o.isMesh) return;
    for (const mat of [].concat(o.material)) if (mat && mat.color && !mat.userData.night) { mat.color.multiplyScalar(0.55); mat.userData.night = 1; }
  });
  const place = (spec, scale, high) => {
    const p = models[spec.model % models.length].clone(true);
    p.scale.setScalar(scale);
    p.rotation.y = spec.rot * (Math.PI / 2);
    p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    Object.assign(p.userData, { x: spec.x, z0: spec.z0, high });
    scene.add(p);
    props.push(p);
  };
  for (const spec of propLayout(n)) place(spec, PROP_SCALE, false);  
  for (const spec of highLayout(n)) place(spec, PROP_SCALE * 1.7, true); 
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
  fx.glowBegin();
  for (let i = 0; i < s.nb; i++) {
    
    const bx = wx(s.bx[i]), bz = wz(s.by[i]);
    put(sets.enemy[s.bkind[i]][s.bpol[i]], bx, bz, -Math.atan2(s.bvx[i], s.bvy[i]));
    fx.glowAdd(bx, bz, s.bpol[i], 34);
  }
  for (let i = 0; i < s.ns; i++) fx.glowAdd(wx(s.sx[i]), wz(s.sy[i]), s.players[s.sown[i]].iris, s.sdmg[i] > 1 ? 40 : 18);
  fx.glowEnd();
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
  
  const m = new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false,
    toneMapped: false, blending: THREE.AdditiveBlending }));
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



addEventListener('blur', () => { keys.clear(); if (mode === 'play' && !net) setPaused(true); });
document.addEventListener('visibilitychange', () => {
  if (net) { net.room?.setHidden(document.hidden); return; }
  if (document.hidden && mode === 'play') setPaused(true);
});


const drag = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
let fieldScale = 1;
host.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  if (drag.id !== null && e.pointerType === 'touch') { flip(); return; }
  drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY;
});
host.addEventListener('pointermove', (e) => {
  if (e.pointerId !== drag.id) return;
  dragFeed(drag, e.clientX - drag.x, e.clientY - drag.y, fieldScale); 
  drag.x = e.clientX; drag.y = e.clientY;
});
for (const ev of ['pointerup', 'pointercancel']) host.addEventListener(ev, (e) => { if (e.pointerId === drag.id) dragRelease(drag); });
$('flip').addEventListener('pointerdown', (e) => { e.preventDefault(); flip(); });
$('bomb').addEventListener('pointerdown', (e) => { e.preventDefault(); bombQueued = true; });

let padFlipHeld = false, padBombHeld = false;
function readInput() {
  if (botSeat && net?.room?.session) { 
    const t = net.room.session.tick;
    const ph = Math.trunc(t / 40) + net.room.seat * 3;
    return pack({ x: ((ph * 37) % 129) - 64, y: ((ph * 53) % 129) - 64, iris: Math.trunc(t / 150) % 2 === 1 });
  }
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
  const dm = dragTake(drag); 
  if (dm) { x = dm.x; y = dm.y; }
  const bomb = bombQueued; bombQueued = false;
  return pack({ x, y, iris: flipLevel === 1, bomb, focus });
}


let sim = null, mode = 'title', paused = false, gentle = true;

let net = null;
const botSeat = params.get('bot') === '1';
let acc = 0, last = performance.now();
const seen = { boom: 0, absorbed: 0, bursts: 0, hits: 0, kills: 0, shotTick: 0, chain: 0, stage: 0 };
const SEEN0 = { boom: 0, absorbed: 0, bursts: 0, hits: 0, kills: 0, shotTick: 0, chain: 0, stage: 0 };



const SAVE_KEY = 'flipwing.unlocked';
function unlocked() {
  try { return Math.max(0, Math.min(STAGES.length - 1, Number(localStorage.getItem(SAVE_KEY)) || 0)); } catch { return 0; }
}
function unlock(n) {
  try { if (n > unlocked()) localStorage.setItem(SAVE_KEY, String(n)); } catch {  }
}
function drawContinue() {
  const n = unlocked();
  $('continue').hidden = n === 0;
  $('continue').textContent = `Continue: stage ${n + 1}, ${STAGES[n].name}`;
}
drawContinue();

function start(isGentle, stage = 0) {
  gentle = isGentle;
  
  sim = createSim({ seed: (Date.now() & 0x7fffffff) || 1, gentle, stage });
  flipLevel = 0; drag.dx = drag.dy = 0;
  Object.assign(seen, SEEN0, { stage });
  mode = 'play';
  setPaused(false);
  $('title').hidden = true; $('tally').hidden = true; $('ending').hidden = true;
  $('lives').hidden = gentle;
  ui.play('open');
  followSound(music, uiSoundOn());
}
$('start').addEventListener('click', () => start(true));
$('arcade').addEventListener('click', () => start(false));
$('continue').addEventListener('click', () => start(true, unlocked()));
$('again').addEventListener('click', () => (net ? leaveCoop() : start(gentle)));

function setPaused(p) {
  paused = p && mode === 'play';
  $('paused').hidden = !paused;
  last = performance.now(); acc = 0;
}
function togglePause() { if (mode === 'play') setPaused(!paused); }
$('paused').addEventListener('click', () => setPaused(false));


const runGoesOn = (s) => !s.over && s.clear > 0 && s.stage + 1 < STAGES.length;

function showTally(s) {
  mode = 'tally';
  const p = s.players[viewSeat(s)];
  const st = STAGES[s.stage];
  const secs = Math.round((s.tick - s.st0) / TICK_HZ);
  const last = !runGoesOn(s) && !s.over;
  $('tally-head').textContent = s.over ? 'Shot down' : s.boss.beaten ? (last ? 'Run complete' : `${st.name} clear`) : `${BOSS_NAMES[st.boss]} got away`;
  $('t-score').textContent = p.score.toLocaleString();
  $('t-drunk').textContent = String(p.absorbed);
  $('t-bursts').textContent = String(p.bursts);
  $('t-kills').textContent = String(p.kills);
  $('t-chain').textContent = String(s.sbest);
  $('t-time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $('again').textContent = s.over ? 'Try again' : 'Play again';
  
  $('again').hidden = runGoesOn(s);
  $('t-next').hidden = !runGoesOn(s);
  if (runGoesOn(s)) $('t-next').textContent = `Next: stage ${s.stage + 2}, ${STAGES[s.stage + 1].name}`;
  const list = $('t-pilots');
  list.hidden = !net;
  if (net) {
    
    
    $('t-score').textContent = teamScore(s).toLocaleString();
    $('t-drunk').textContent = String(s.players.reduce((n, q) => n + (q.on ? q.absorbed : 0), 0));
    $('t-bursts').textContent = String(s.players.reduce((n, q) => n + (q.on ? q.bursts : 0), 0));
    $('t-kills').textContent = String(s.players.reduce((n, q) => n + (q.on ? q.kills : 0), 0));
    list.replaceChildren(...s.players.map((q, i) => {
      if (!q.on) return null;
      const li = document.createElement('li');
      li.style.setProperty('--c', `var(--p${i + 1})`);
      li.textContent = `${seatName(i)}  ${q.score.toLocaleString()}`;
      return li;
    }).filter(Boolean));
    $('again').textContent = 'Back to the title';
  }
  
  
  if (last && s.boss.beaten) {
    renderEnding($('e-cards'));
    $('ending').hidden = false;
  } else $('tally').hidden = false;
  ui.play('open');
}

$('e-next').addEventListener('click', () => {
  $('ending').hidden = true;
  $('tally').hidden = false;
  ui.play('open');
});


function stageBegins(s) {
  seen.stage = s.stage;
  if (!net) unlock(s.stage);
  mode = 'play';
  $('tally').hidden = true; $('ending').hidden = true;
  toast(`Stage ${s.stage + 1}: ${STAGES[s.stage].name}`, 3000);
}


const seatName = (i) => `P${i + 1}${net && i === net.room.seat ? ' (you)' : ''}`;


function viewSeat(s) {
  const seat = net?.room?.seat;
  if (seat !== null && seat !== undefined) return seat;
  if (!net) return 0;
  const i = s.players.findIndex((q) => q.on);
  return i < 0 ? 0 : i;
}

const nameChips = [0, 1, 2, 3].map((i) => {
  const el = document.createElement('span');
  el.style.setProperty('--c', `var(--p${i + 1})`);
  el.hidden = true;
  $('names').appendChild(el);
  return el;
});
function drawNames(s) {
  for (let i = 0; i < 4; i++) {
    const q = s.players[i], el = nameChips[i];
    const show = !!net && q.on === 1 && (q.lives > 0 || q.pod === 1);
    if (el.hidden !== !show) el.hidden = !show;
    if (!show) continue;
    const label = q.pod ? `${seatName(i)} down` : seatName(i);
    if (el.textContent !== label) el.textContent = label;
    el.style.left = `${(q.x / FP) * fieldScale}px`;
    el.style.top = `${(q.y / FP + 28) * fieldScale}px`;
  }
}

let toastTimer = 0;
function toast(text, ms = 4000) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

function lobbyStatus(text) { $('lobby-status').textContent = text; }

function drawSeats(room) {
  const seats = [{ seat: 0, who: room.role === 'host' ? 'you, host' : 'host' }];
  if (room.role === 'host') {
    for (const g of room.guests.values()) if (g.seat !== null) seats.push({ seat: g.seat, who: 'friend' });
  } else if (room.seat !== null) seats.push({ seat: room.seat, who: 'you' });
  const watching = room.role === 'host' ? [...room.guests.values()].filter((g) => g.seat === null).length : 0;
  const rows = [0, 1, 2, 3].map((i) => {
    const li = document.createElement('li');
    li.style.setProperty('--c', `var(--p${i + 1})`);
    const s = seats.find((x) => x.seat === i);
    li.className = s ? '' : 'empty';
    li.textContent = s ? `P${i + 1}  ${s.who}` : `P${i + 1}  open`;
    return li;
  });
  if (watching) {
    const li = document.createElement('li');
    li.textContent = `${watching} watching`;
    rows.push(li);
  }
  $('seats').replaceChildren(...rows);
}

function onRoomEvent(e) {
  const room = net?.room;
  if (!room) return;
  if (e.type === 'lobby') {
    drawSeats(room);
    const n = [...room.guests.values()].filter((g) => g.seat !== null).length + 1;
    if (!room.started) lobbyStatus(n === 1 ? 'Share the Play link with up to three friends.' : `${n} pilots ready. Start when everyone is in.`);
  } else if (e.type === 'seat') {
    drawSeats(room);
    if (e.seat === null) lobbyStatus(e.why === 'late' ? 'The run has started, so you are watching it.' : e.why === 'full' ? 'The room is full, so you are watching.' : 'You are watching.');
    else lobbyStatus(`You are P${e.seat + 1}. The host starts the run.`);
  } else if (e.type === 'start') {
    beginCoopRun(e.gentle);
  } else if (e.type === 'unseated') {
    if (e.me) toast(e.why === 'away' ? 'You left the game, so you are watching now.' : 'Your connection fell behind, so you are watching now.', 6000);
    else toast(e.why === 'away' ? 'A pilot left the game and is watching.' : 'A pilot fell behind and is watching.');
  } else if (e.type === 'pause') {
    if (e.on) toast('The host stepped away. The game waits for them.', 0); else $('toast').hidden = true;
  } else if (e.type === 'desync') {
    toast('Screens fell out of step. Start a new room.', 0);
  } else if (e.type === 'ended') {
    toast('The host left, so the room has closed.', 0);
    lobbyStatus('The host left, so the room has closed.');
  } else if (e.type === 'error') {
    if (!room.started) lobbyStatus(`Network trouble: ${e.message}`);
  }
}

async function openCoop() {
  if (net) return;
  net = { room: null };
  mode = 'lobby';
  $('title').hidden = true; $('tally').hidden = true; $('ending').hidden = true;
  $('lobby').hidden = false; $('links').hidden = true; $('host-go').hidden = true;
  $('seats').replaceChildren();
  lobbyStatus('Opening a room...');
  ui.play('open');
  try {
    const { openRoom } = await import('./coop.js');
    const room = await openRoom({ onEvent: onRoomEvent });
    net.room = room;
    drawSeats(room);
    if (room.role === 'host') {
      $('join-link').value = room.links.join;
      $('watch-link').value = room.links.watch;
      $('links').hidden = false;
      $('host-go').hidden = false;
      lobbyStatus('Share the Play link with up to three friends.');
    } else {
      $('lobby-head').textContent = room.role === 'watch' ? 'Watching' : 'Joining';
      lobbyStatus('Connecting to the host...');
    }
  } catch (err) {
    lobbyStatus(`Could not open a room: ${err.message}`);
  }
}

function beginCoopRun(isGentle) {
  gentle = isGentle;
  flipLevel = 0; drag.dx = drag.dy = 0;
  Object.assign(seen, SEEN0);
  mode = 'play';
  $('lobby').hidden = true; $('title').hidden = true; $('tally').hidden = true; $('ending').hidden = true;
  $('lives').hidden = gentle || net.room.seat === null;
  for (const id of ['flip', 'bomb']) $(id).hidden = net.room.seat === null;
  if (net.room.seat === null) toast('Watching. Ships are named by seat.', 5000);
  followSound(music, uiSoundOn());
}

function leaveCoop() {
  
  
  const url = new URL(location.href);
  url.search = '';
  location.href = url.toString();
}

$('friends').addEventListener('click', openCoop);
$('coop-start').addEventListener('click', () => net?.room?.start({ gentle: true }));
$('coop-arcade').addEventListener('click', () => net?.room?.start({ gentle: false }));
$('lobby-leave').addEventListener('click', leaveCoop);
for (const id of ['join', 'watch']) {
  $(`share-${id}`).addEventListener('click', async () => {
    const { shareLink } = await import('../../../web-engine/share/shareInvite.js');
    shareLink({ link: $(`${id}-link`).value, gameName: 'Flipwake', code: net?.room?.mesh.myId ?? null,
      button: $(`share-${id}`), field: $(`${id}-link`) });
  });
}


const hud = { score: $('score'), meter: $('meter'), lives: $('lives'), pol: $('pol'), bombs: $('bombs'), flipBtn: $('flip'), chain: $('chain') };
const enemyMeshes = new Map(); 
const haloMeshes = new Map();  
const POOL_OF = ['dart', 'turret', 'warden', 'skiff', 'bulwark', 'gunship']; 
const BOOM_SIZE = [40, 64, 120, 36, 90, 130];



const enemySeen = new Map(); 
let enemyGone = [];          
function syncEnemies(s) {
  const live = new Set();
  const myPol = s.players[viewSeat(s)]?.iris || 0;
  for (let e = 0; e < s.ne; e++) {
    const id = s.eid[e], k = s.ek[e];
    live.add(id);
    const ex = wx(s.ex[e]), ez = wz(s.ey[e]);
    const was = enemySeen.get(id);
    if (was) {
      if (s.ehp[e] < was.hp) fx.hit(ex + (Math.random() - 0.5) * 10, ez + 8, myPol);
      was.x = ex; was.z = ez; was.hp = s.ehp[e];
    } else enemySeen.set(id, { x: ex, z: ez, pol: s.ep[e], hp: s.ehp[e] });
    let o = enemyMeshes.get(id);
    if (!o) {
      if (k === 2) o = warden;
      else o = pools[`${POOL_OF[k]}${s.ep[e]}`]?.find((m) => !m.visible);
      if (!o) continue;
      o.visible = true;
      enemyMeshes.set(id, o);
    }
    o.position.x = wx(s.ex[e]);
    o.position.z = wz(s.ey[e]);
    if (s.ef[e] & OTHER_ONLY) { 
      let h = haloMeshes.get(id);
      if (!h) {
        h = pools[`halo${1 - s.ep[e]}`]?.find((m) => !m.visible);
        if (h) { h.visible = true; haloMeshes.set(id, h); }
      }
      if (h) { h.position.x = o.position.x; h.position.z = o.position.z; }
    }
    if ((k === 1 || k === 2) && ship) { 
      const p = s.players[viewSeat(s)];
      o.rotation.y = Math.atan2(wx(p.x) - o.position.x, wz(p.y) - o.position.z) - Math.PI / 2;
    }
  }
  for (const [id, o] of enemyMeshes) if (!live.has(id)) { o.visible = false; enemyMeshes.delete(id); }
  for (const [id, o] of haloMeshes) if (!live.has(id)) { o.visible = false; haloMeshes.delete(id); }
  enemyGone = [];
  for (const [id, v] of enemySeen) if (!live.has(id)) { enemyGone.push(v); enemySeen.delete(id); }
}

function goneColour(x, z) {
  let best = -1, bd = 40 * 40;
  for (const g of enemyGone) {
    const d = (g.x - x) ** 2 + (g.z - z) ** 2;
    if (d < bd) { bd = d; best = g.pol; }
  }
  return best;
}

function draw(s, dt) {
  const scrollPx = (s.tick * SCROLL) / FP;
  const base = Math.floor(scrollPx / TILE_PX);
  let i = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) {
    const row = base + r - 1;
    tiles[i].position.set(-FIELD_W / 2 + TILE_PX * (c + 0.5), 0, FIELD_H / 2 - TILE_PX * (row + 0.5) + scrollPx);
    tiles[i].material = matAt(c, row, s.stage);
  }
  const span = propSpan();
  for (const p of props) {
    const hi = p.userData.high, sp = hi ? HIGH_SPAN : span;
    let z = p.userData.z0 + ((hi ? scrollPx * PARALLAX : scrollPx) % sp);
    if (z > FIELD_H / 2 + (hi ? 160 : 80)) z -= sp;
    p.position.set(p.userData.x, hi ? 8 : 0, z);
  }
  
  fx.lightsBegin();
  for (const [x, z, pol, size, a] of runwayLights(scrollPx, performance.now() / 1000)) fx.lightAdd(x, z, pol, size, a);
  fx.lightsEnd();
  const lt = s.tick - s.st0, st = STAGES[s.stage];
  dusk.material.opacity = s.clear ? 0 : Math.max(0, Math.min(0.35, (lt - (st.bossAt - 360)) / 360 * 0.35));
  if (!ship) return;
  if (stagePropsShown !== s.stage) { stagePropsShown = s.stage; loadProps(s.stage); }

  const me = viewSeat(s);
  const p = s.players[me];
  const coop = !!net;
  for (let i = 0; i < ships.length; i++) {
    const q = s.players[i], sh = ships[i];
    const pod = coop && q.on === 1 && q.pod === 1;
    sh.group.visible = q.on === 1 && (q.lives > 0 || pod); 
    if (!sh.group.visible) continue;
    const qx = wx(q.x), qz = wz(q.y);
    const vx = qx - sh.group.position.x;
    sh.group.position.x = qx; sh.group.position.z = qz;
    sh.bank += (Math.max(-1, Math.min(1, vx / 4)) - sh.bank) * Math.min(1, dt * 10);
    if (q.iris !== sh.pol) {
      sh.pol = q.iris; sh.flipT = 0.3;
      if (dt > 0) { fx.flip(qx, qz, q.iris); pulseAura(sh.aura, 1); }
    }
    stepAura(sh.aura, q.iris, dt, s.tick / 60);
    sh.aura.visible = !pod;
    if (dt > 0 && !pod && q.lives > 0) fx.wake(qx, qz, q.iris, dt);
    if (sh.flipT > 0) sh.flipT = Math.max(0, sh.flipT - dt);
    const flipping = sh.flipT > 0;
    
    sh.ember.visible = flipping && sh.flipT > 0.15 ? !!q.iris : !q.iris;
    sh.iris.visible = !sh.ember.visible;
    if (pod) { 
      sh.group.scale.setScalar(0.7);
      sh.roll.rotation.z = (s.tick / 20) % (Math.PI * 2);
      sh.halo.visible = true;
      sh.halo.material.opacity = 0.25 + 0.75 * (q.rev / REVIVE_TICKS);
    } else {
      sh.group.scale.setScalar(1);
      sh.roll.rotation.z = flipping ? (1 - sh.flipT / 0.3) * Math.PI * 2 : -sh.bank * 0.55;
      sh.halo.material.opacity = 0.6;
      sh.halo.visible = q.inv > 0 && Math.floor(s.tick / 6) % 2 === 0;
    }
  }
  
  let nt = 0;
  for (let i = 0; i < s.players.length && nt < tethers.length; i++) {
    const d = s.players[i].duet;
    if (!d || d - 1 < i) continue;
    const a = ships[i].group.position, b = ships[d - 1].group.position;
    const pos = tethers[nt].geometry.attributes.position;
    pos.setXYZ(0, a.x, 70, a.z); pos.setXYZ(1, b.x, 70, b.z); pos.needsUpdate = true;
    tethers[nt++].visible = true;
  }
  for (; nt < tethers.length; nt++) tethers[nt].visible = false;
  drawNames(s, me);
  const x = wx(p.x), z = wz(p.y);
  const cue = p1Flip(p.iris ? 'iris' : 'ember');
  if (cue) sfx.play(cue);

  syncEnemies(s);
  for (let k = 0; k < bosses.length; k++) {
    const b = bosses[k];
    if (!b) continue;
    b.visible = s.boss.on === 1 && s.boss.kind === k;
    if (!b.visible) continue;
    b.position.set(wx(s.boss.x), 90, wz(s.boss.y));
    const { ember, iris } = b.userData;
    if (k === TWIN) { 
      const ph = s.boss.phase;
      ember.visible = ph < 2;
      iris.visible = true;
      
      ember.position.z = ph < 2 ? (twinPol(0, ph) === 0 ? -TWIN_SPLIT : TWIN_SPLIT) : 0;
      iris.position.z = ph < 2 ? -ember.position.z : 0;
      continue;
    }
    let irisNow = bossShowsIris(k, s.boss.phase, s.boss.fa); 
    if (k === CROWN && s.boss.phase === 3 && s.boss.rest === 0) {
      
      const left = CROWN_SWITCH - (s.boss.fa % CROWN_SWITCH);
      if (left <= 60 && ((left >> 3) & 1)) irisNow = !irisNow;
    }
    ember.visible = !irisNow;
    iris.visible = irisNow;
  }
  drawBullets(s);

  
  for (; seen.boom < s.nboom; seen.boom++) {
    const n = seen.boom % 16, k = s.boomK[n];
    const bx = wx(s.boomX[n]), bz = wz(s.boomY[n]);
    if (k === BOOM_DEFLECT) { flash(bx, bz, 14, 0x8a8a90); fx.hit(bx, bz, 0); continue; } 
    const boss = k === BOOM_BOSS;
    const size = boss ? 260 : BOOM_SIZE[k] ?? 40;
    const pol = boss ? (s.boss.phase & 1) : goneColour(bx, bz);
    flash(bx, bz, size, boss ? 0xfff1c0 : pol === 1 ? 0xb890ff : 0xffd27a);
    fx.explode(bx, bz, size, Math.max(0, pol), { boss });
    sfx.play(boss || k === 2 || k >= 4 ? 'boom' : 'pop');
  }
  if (s.chain !== seen.chain) {
    if (s.chain > seen.chain) flash(x, z - 30, 30 + Math.min(s.chain, 8) * 6, s.chainPol ? 0xa878ff : 0xffc440);
    seen.chain = s.chain;
  }
  if (p.absorbed > seen.absorbed) {
    
    for (let a = 0, n = Math.min(6, p.absorbed - seen.absorbed); a < n; a++) {
      const t = Math.random() * Math.PI - Math.PI; 
      fx.absorb(x + Math.cos(t) * 30, z + Math.sin(t) * 30, x, z, p.iris);
    }
    pulseAura(ships[me].aura, 0.25);
    sfx.play('absorb'); seen.absorbed = p.absorbed;
  }
  if (p.bursts > seen.bursts) {
    sfx.play('release'); seen.bursts = p.bursts; flash(x, z, 60, p.iris ? 0xa878ff : 0xffc440);
    fx.flip(x, z, p.iris); pulseAura(ships[me].aura, 1.2);
  }
  if (p.hits > seen.hits) { sfx.play('hurt'); seen.hits = p.hits; }
  if (s.tick - seen.shotTick >= 15 && mode === 'play' && !s.clear) { sfx.play('shot'); seen.shotTick = s.tick; }

  
  hud.score.textContent = (coop ? teamScore(s) : p.score).toLocaleString();
  hud.meter.style.transform = `scaleX(${Math.min(1, p.energy / BURST_COST)})`;
  hud.meter.dataset.pol = p.iris ? 'iris' : 'ember';
  hud.lives.textContent = `Lives ${Math.max(0, p.lives)}`;
  hud.pol.textContent = p.iris ? 'IRIS' : 'EMBER';
  hud.pol.dataset.pol = p.iris ? 'iris' : 'ember';
  hud.bombs.textContent = String(p.bombs);
  
  const chainText = s.chain || s.chainN ? `Chain ${s.chain} ${'●'.repeat(s.chainN)}${'○'.repeat(3 - s.chainN)}` : '';
  if (hud.chain.textContent !== chainText) hud.chain.textContent = chainText;
  hud.chain.hidden = !chainText;
  hud.chain.dataset.pol = s.chainPol ? 'iris' : 'ember';
  const c = stageCue(s.stage, lt);
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
  fx.setScale(next);
}
window.addEventListener('resize', layout);


const idle = createSim({ seed: 1 });
const DT = 1 / TICK_HZ;
let fpsFrames = 0, fpsAt = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (net) {
    
    
    const room = net.room, se = room?.session;
    if (se) {
      room.poll(now);
      if (!room.ended) se.update(now, readInput);
      const s = se.view();
      if (s.stage !== seen.stage) { if (mode === 'play' || mode === 'tally') stageBegins(s); }
      else if (mode === 'play' && ((s.clear && s.tick - s.clear > 150) || (s.over && s.tick - s.over > 90))) showTally(s);
      draw(s, dt);
    } else { step(idle, [0, 0, 0, 0]); draw(idle, dt); }
  } else if (mode === 'title') { step(idle, [0, 0, 0, 0]); draw(idle, dt); }
  else if (sim) {
    if (!paused && mode === 'play') {
      acc += dt;
      let n = 0;
      while (acc >= DT && n < 5) { step(sim, [readInput(), 0, 0, 0]); acc -= DT; n++; }
      if (n === 5) acc = 0;
      if (sim.stage !== seen.stage) stageBegins(sim); 
      else if (sim.clear && sim.tick - sim.clear > 150) showTally(sim);
      else if (sim.over && sim.tick - sim.over > 90) showTally(sim);
    } else if (mode === 'tally') {
      
      
      acc += dt;
      let n = 0;
      while (acc >= DT && n < 5) { step(sim, [pack({}), 0, 0, 0]); acc -= DT; n++; }
      if (n === 5) acc = 0;
      if (sim.stage !== seen.stage) stageBegins(sim);
    }
    draw(sim, paused ? 0 : dt);
  }
  stepFlashes(paused ? 0 : dt);
  fx.step(paused ? 0 : dt);
  const [shx, shz] = fx.shakeOffset();
  camera.position.x = shx; camera.position.z = shz;
  renderer.render(scene, camera);
  fpsFrames++;
  if (now - fpsAt >= 1000) { document.body.dataset.fps = String(fpsFrames); fpsFrames = 0; fpsAt = now; }
  requestAnimationFrame(frame);
}

layout();
loadModels().then(() => {
  document.body.dataset.ready = '1';
  
  const play = params.get('play');
  if (params.has('join') || params.has('watch')) openCoop(); 
  else if (play) {
    start(play !== 'arcade', Math.max(0, Math.min(STAGES.length - 1, (Number(params.get('stage')) || 1) - 1)));
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
window.__flipwing = {
  get sim() { return net?.room?.session ? net.room.session.view() : sim; }, start, scene, renderer, ENEMY_CAP, openCoop,
  
  get net() {
    const r = net?.room, se = r?.session;
    if (!r) return null;
    return { role: r.role, seat: r.seat, started: r.started, ended: r.ended, id: r.mesh.myId, links: r.links ?? null,
      tick: se?.tick ?? 0, confirmed: se?.cs.tick ?? 0, desyncs: se?.desyncs ?? 0, stalls: se?.stalls ?? 0,
      hashes: se ? [...se.hashes.entries()].slice(-10) : [], seats: se?.seats ?? [], gentle: r.gentle };
  },
};
