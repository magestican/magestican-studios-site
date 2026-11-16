








import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BULLET_TYPES, POLARITY, rasterBullet } from './bullets.js';
import { FIELD_W, FIELD_H, TILE_PX, GROUND_TINT, GROUND_TILES, groundTileAt } from './field.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { uiSoundOn, setUiSound } from '../../../web-engine/brand/uiSound.js';
import { SFX_TAKES, MENU_CUES, MUSIC_TRACKS, createFlipWatch, soundToggleCue, followSound } from './sound.js';



const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), Object.keys(SFX_TAKES), SFX_TAKES);
const ui = createGameSfx(new URL('../assets/ui/', import.meta.url), MENU_CUES);
const music = createTrackMusic({ game: 'polarity-shmup', manifestUrl: new URL('../assets/music/music.json', import.meta.url), trackIds: MUSIC_TRACKS });
const p1Flip = createFlipWatch();
const soundBtn = document.getElementById('sound');
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

const params = new URLSearchParams(location.search);
const FROZEN_T = params.has('t') ? Number(params.get('t')) : null;
const BULLET_TARGET = Math.max(0, Math.min(2000, Number(params.get('bullets') ?? 600)));
const SCROLL_PX_S = 38; 


const SHIP_LEN = 44, POPCORN_LEN = 36, TURRET_W = 64, BOSS_W = 330, PROP_SCALE = 4.6;

const host = document.getElementById('field');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

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
  mesh.userData = { c };
  scene.add(mesh);
  tiles.push(mesh);
}

const shadowSheet = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W + 40, FIELD_H + 40).rotateX(-Math.PI / 2),
  new THREE.ShadowMaterial({ opacity: 0.32 }));
shadowSheet.position.y = 0.5;
shadowSheet.receiveShadow = true;
scene.add(shadowSheet);


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

const ships = []; 
const enemies = [];
let boss = null, turret = null;
const props = [];

async function loadModels() {
  const livery = [1, 2, 3, 4];
  const shipJobs = livery.map(async (n, i) => {
    const [e, v] = await Promise.all([
      loadGlb(`assets/craft/fighter_p${n}_ember/fighter_p${n}_ember.glb`),
      loadGlb(`assets/craft/fighter_p${n}_iris/fighter_p${n}_iris.glb`),
    ]);
    const roll = new THREE.Group(); 
    const ember = fit(e, SHIP_LEN), iris = fit(v, SHIP_LEN);
    
    ember.rotation.y = iris.rotation.y = Math.PI / 2;
    roll.add(ember, iris);
    const group = new THREE.Group();
    group.add(roll);
    group.position.y = 40; 
    scene.add(group);
    
    const core = new THREE.Mesh(new THREE.CircleGeometry(3, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, toneMapped: false }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(3, 4.2, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x101018, depthTest: false, toneMapped: false }));
    core.position.y = ring.position.y = 60; core.renderOrder = ring.renderOrder = 20;
    group.add(ring, core);
    ships[i] = { group, roll, ember, iris, pol: i % 2 ? 'iris' : 'ember', phase: i * 1.7 };
  });
  const enemyJob = (async () => {
    for (const [k, pol] of [[0, 'ember'], [1, 'iris'], [2, 'ember']]) {
      const m = fit(await loadGlb(`assets/craft/dart_${pol}/dart_${pol}.glb`), POPCORN_LEN);
      m.rotation.y = -Math.PI / 2; 
      m.position.y = 60;
      scene.add(m);
      enemies.push({ m, k, pol });
    }
  })();
  const turretJob = loadGlb('assets/craft/turret_iris/turret_iris.glb').then((g) => {
    turret = fit(g, TURRET_W, { axis: 'max' });
    scene.add(turret);
  });
  const bossJob = loadGlb('assets/craft/furnace_ember/furnace_ember.glb').then((g) => {
    boss = fit(g, BOSS_W, { axis: 'z' });
    boss.rotation.y = Math.PI / 2; 
    boss.position.set(0, 90, -FIELD_H / 2 + 120);
    scene.add(boss);
  });
  const propIds = ['bunker', 'hangar', 'pylon', 'radar', 'rock', 'silo'];
  const propJob = Promise.all(propIds.map((id) => loadGlb(`assets/props/${id}/${id}.glb`))).then((models) => {
    
    let seed = 1729;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    for (let n = 0; n < 14; n++) {
      const src = models[n % models.length];
      const p = src.clone(true);
      p.scale.setScalar(PROP_SCALE);
      p.rotation.y = Math.floor(rnd() * 4) * (Math.PI / 2);
      p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      p.userData.x = (rnd() - 0.5) * (FIELD_W - 70);
      p.userData.z0 = -n * 120 - rnd() * 40;
      scene.add(p);
      props.push(p);
    }
  });
  await Promise.all([...shipJobs, enemyJob, turretJob, bossJob, propJob]);
}


const bulletSets = [];
function buildBullets(pxScale) {
  for (const s of bulletSets) { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.map.dispose(); s.mesh.material.dispose(); }
  bulletSets.length = 0;
  const kinds = BULLET_TYPES.length * 2;
  const per = Math.ceil(BULLET_TARGET * 1.7 / kinds); 
  let order = 0;
  for (const t of BULLET_TYPES) for (const pol of Object.keys(POLARITY)) {
    const r = rasterBullet(t, pol, pxScale);
    const tex = new THREE.DataTexture(new Uint8Array(r.data.buffer), r.w, r.h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    
    const geo = new THREE.PlaneGeometry(r.w / pxScale, r.h / pxScale).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
    const mesh = new THREE.InstancedMesh(geo, mat, per);
    mesh.renderOrder = 10;
    mesh.frustumCulled = false;
    scene.add(mesh);
    bulletSets.push({ t, pol, mesh, per, order: order++ });
  }
}


const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);
function bulletAt(set, n, t) {
  const life = 7; 
  const k = set.order * 977 + n * 131;
  const born = ((k * 0.0123) % life);
  const age = (t + born) % life;
  let x, z, ang;
  if (set.t.id === 'shot') {
    const ship = ships[n % 4];
    const sx = ship ? ship.group.position.x : 0, sz = ship ? ship.group.position.z : 300;
    const a = (t * 6 + n * 0.37) % 1;
    x = sx + ((n % 3) - 1) * 7;
    z = sz - 20 - a * 700;
    ang = 0;
  } else {
    const fromBoss = n % 3 !== 0;
    const ox = fromBoss ? 0 : ((n % 2) ? -110 : 110);
    const oz = fromBoss ? -FIELD_H / 2 + 120 : -210;
    const arms = 12 + set.order;
    ang = (n % arms) / arms * Math.PI * 2 + Math.floor((t + born) / life) * 0.21 + set.order * 0.4 + (fromBoss ? age * 0.18 : 0);
    const speed = 60 + (set.order % 4) * 14;
    x = ox + Math.sin(ang) * speed * age;
    z = oz + Math.cos(ang) * speed * age;
  }
  return { x, z, ang };
}

function updateBullets(t) {
  let shown = 0;
  for (const set of bulletSets) {
    for (let n = 0; n < set.per; n++) {
      const b = bulletAt(set, n, t);
      _p.set(b.x, 70, b.z);
      _q.setFromAxisAngle(UP, -b.ang); 
      _m.compose(_p, _q, _s);
      set.mesh.setMatrixAt(n, _m);
      if (Math.abs(b.x) < FIELD_W / 2 + 10 && Math.abs(b.z) < FIELD_H / 2 + 10) shown++;
    }
    set.mesh.instanceMatrix.needsUpdate = true;
  }
  return shown;
}


function update(t) {
  const scroll = t * SCROLL_PX_S;
  
  const base = Math.floor(scroll / TILE_PX);
  let i = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) {
    const row = base + r - 1;
    const m = tiles[i];
    m.position.set(-FIELD_W / 2 + TILE_PX * (c + 0.5), 0, FIELD_H / 2 - TILE_PX * (row + 0.5) + scroll);
    m.material = tileMats[groundTileAt(c, row)];
  }
  const span = 14 * 120 + 200;
  for (const p of props) {
    let z = p.userData.z0 + (scroll % span);
    if (z > FIELD_H / 2 + 80) z -= span;
    p.position.set(p.userData.x, 0, z);
  }
  if (turret) {
    const z = ((scroll * 1 + 200) % (FIELD_H + 200)) - FIELD_H / 2 - 100;
    turret.position.set(120, 0, z);
    turret.rotation.y = Math.atan2(-(ships[0]?.group.position.x ?? 0) + 120, 300 - z) - Math.PI / 2;
  }
  
  ships.forEach((s, i) => {
    if (!s) return;
    const x = -135 + i * 90 + Math.sin(t * 0.9 + s.phase) * 26;
    const vx = Math.cos(t * 0.9 + s.phase);
    s.group.position.x = x;
    s.group.position.z = 190 + Math.sin(t * 0.6 + i) * 18;
    const flipT = (t + i * 0.9) % 3.2;
    const flipping = flipT < 0.35;
    const pol = Math.floor((t + i * 0.9) / 3.2) % 2 ? 'iris' : 'ember';
    s.pol = flipping ? s.pol : pol;
    if (i === 0 && FROZEN_T === null) { const cue = p1Flip(s.pol); if (cue) sfx.play(cue); }
    s.ember.visible = (flipping ? flipT > 0.175 : true) ? pol === 'ember' : pol !== 'ember';
    s.iris.visible = !s.ember.visible;
    
    s.roll.rotation.z = flipping ? (flipT / 0.35) * Math.PI * 2 : -vx * 0.55;
  });
  enemies.forEach((e) => {
    const x = (e.k - 1) * 110 + Math.sin(t * 1.3 + e.k) * 30;
    e.m.position.x = x;
    e.m.position.z = -210 + Math.cos(t * 1.1 + e.k) * 20;
  });
  if (boss) boss.position.x = Math.sin(t * 0.4) * 20;
  return updateBullets(t);
}


let pxScale = 1;
function layout() {
  
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = Math.min(vw / FIELD_W, vh / FIELD_H);
  const w = Math.floor(FIELD_W * s), h = Math.floor(FIELD_H * s);
  host.style.width = `${w}px`; host.style.height = `${h}px`;
  document.documentElement.style.setProperty('--fs', String(s)); 
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = `${w}px`; renderer.domElement.style.height = `${h}px`;
  const next = s * renderer.getPixelRatio();
  if (Math.abs(next - pxScale) > 0.01 || !bulletSets.length) { pxScale = next; buildBullets(pxScale); }
}
window.addEventListener('resize', layout);

const fpsEl = document.getElementById('fps');
const countEl = document.getElementById('bullets');
const polEl = document.getElementById('pol');
let frames = 0, lastFpsAt = performance.now();
const t0 = performance.now();

function frame(now) {
  const t = FROZEN_T ?? (now - t0) / 1000;
  const shown = update(t);
  renderer.render(scene, camera);
  frames++;
  if (now - lastFpsAt >= 500) {
    fpsEl.textContent = `${Math.round(frames * 1000 / (now - lastFpsAt))} fps`;
    frames = 0; lastFpsAt = now;
    countEl.textContent = `${shown} bullets`;
    const p = ships[0]?.pol ?? 'ember';
    polEl.textContent = p === 'ember' ? 'EMBER' : 'IRIS';
    polEl.dataset.pol = p;
  }
  requestAnimationFrame(frame);
}

layout();
loadModels().then(() => {
  document.body.dataset.ready = '1';
}).catch((err) => {
  document.getElementById('err').textContent = `A model failed to load: ${err && err.message ? err.message : err}`;
});
requestAnimationFrame(frame);
window.__polarityProof = { scene, renderer };
