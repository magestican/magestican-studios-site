









import * as THREE from 'three';
import { makeCozy } from '../../vendor/fml/render/material.js';
import { pixelTexture } from '../../engine/iso/cozyStage.js';
import { seeActorMaterial } from '../../engine/iso/seeThrough.js';
import { castMode } from './look/celRules.js';
import { formCode, formVariant } from '../data/forms.js';
import { page, tn } from './scenery/kit.js';
import { hash2 } from '../../vendor/arbelo/paint/texturePaint.js';
import { dachiArrays, modelKey, hatGeo, DECAL_UV } from './dachiModel.js';
import { kidArrays } from './kidModel.js';
import { elderArrays } from './elderModel.js';
import { bossArrays, bossKey, bossById } from './bossModel.js';
import { aerowingArrays } from './aerowingModel.js';
import { knightArrays } from './knightModel.js';
import { speciesById } from '../data/species.js';
import { dachiFx } from './dachiFx.js';


const arrays = new Map(), pending = new Map(), queue = [], low = []; 
export const actorStats = { requested: 0, built: 0, buildMs: 0, maxMs: 0, worker: null, log: [] };
globalThis.__dachiModels = actorStats; 
let pool = null;
function makePool() {
  if (pool) return pool;
  pool = [];
  try {
    const search = new URL(import.meta.url).search || '?dev=' + Date.now(); 
    const url = new URL('./dachiWorker.js' + search, import.meta.url);
    for (let i = 0; i < 2; i++) {
      const w = new Worker(url, { type: 'module' });
      w.job = null;
      w.onmessage = (e) => { const job = w.job; w.job = null; finish(job, e.data.arrays, e.data.ms); pump(); };
      w.onerror = (e) => { e.preventDefault?.(); const job = w.job; w.job = null; pool = pool.filter((x) => x !== w); w.terminate(); if (job) queue.unshift(job); pump(); };
      pool.push(w);
    }
    actorStats.worker = true;
  } catch (err) { actorStats.worker = false; pool = []; }
  return pool;
}
function finish(job, arr, ms) {
  arrays.set(job.key, arr);
  actorStats.built++; actorStats.buildMs += ms; actorStats.maxMs = Math.max(actorStats.maxMs, ms);
  actorStats.log.push({ key: job.key, ms: Math.round(ms), tris: arr.triangles });
  const p = pending.get(job.key); pending.delete(job.key);
  for (const cb of p) cb(arr);
}
function pump() {
  const ws = makePool();
  if (!ws.length) { 
    const job = queue.shift() || low.shift();
    if (!job) return;
    const t0 = performance.now(); const arr = buildJob(job);
    finish(job, arr, performance.now() - t0);
    if (queue.length || low.length) setTimeout(pump, 0);
    return;
  }
  for (const w of ws) {
    if (w.job || !(queue.length || low.length)) continue;
    w.job = queue.shift() || low.shift();
    w.postMessage({ kind: w.job.kind, spId: w.job.spId, opts: w.job.opts });
  }
}

export function requestModel(spId, opts, cb, lowPri = false) {
  const geo = { bandage: !!opts.bandage, hat: hatGeo(opts.hat) }, boss = speciesById(spId).boss;
  
  
  if (boss) return requestJob({ key: bossKey(boss), kind: 'boss', opts: { boss } }, cb, lowPri);
  return requestJob({ key: modelKey(spId, geo), kind: 'dachi', spId, opts: geo }, cb, lowPri);
}

export const modelKeyOf = (spId, geo = {}) => { const b = speciesById(spId).boss; return b ? bossKey(b) : modelKey(spId, geo); };

export function requestJob(job, cb, lowPri = false) {
  const key = job.key;
  if (arrays.has(key)) { cb(arrays.get(key)); return true; }
  if (pending.has(key)) { 
    pending.get(key).push(cb);
    const i = low.findIndex((j) => j.key === key);
    if (i >= 0 && !lowPri) queue.push(...low.splice(i, 1));
    return false;
  }
  pending.set(key, [cb]); actorStats.requested++;
  (lowPri ? low : queue).push(job);
  pump();
  return false;
}
const buildJob = (job) => (job.kind === 'kid' ? kidArrays(job.opts) : job.kind === 'elder' ? elderArrays() : job.kind === 'aerowing' ? aerowingArrays(job.opts) : job.kind === 'boss' ? bossArrays(job.opts.boss) : job.kind === 'knight' ? knightArrays(job.opts) : dachiArrays(job.spId, job.opts));

export function prewarm(list) { for (const [spId, opts] of list) requestModel(spId, opts || {}, () => {}); }



const FURSTOPS = ['#cfc8c0', '#e0dad3', '#eee9e3', '#f8f5f0', '#ffffff'];



const DT = [Math.floor(DECAL_UV[0] * 32), Math.floor((1 - DECAL_UV[1]) * 32)];
const atDecal = (x, y) => Math.abs(x - DT[0]) <= 1 && Math.abs(y - DT[1]) <= 1;
const furPage = () => page(91, (x, y) => atDecal(x, y) ? 1 : 0.6 + (tn(x, y, 8, 91) - 0.5) * 0.5 + (hash2(x, Math.floor((y + (x % 2) * 2) / 4), 92) - 0.5) * 0.35, FURSTOPS);

const metalPage = () => page(81, (x, y) => {
  const row = Math.floor(y / 11), px = (x + row * 8) % 16, py = y % 11;
  if (px === 0 || py === 0) return 0.05;
  if (px === 2 && py === 2) return 0.98;
  return 0.55 + (tn(x, y, 4, 81) - 0.5) * 0.4 + (py === 1 ? 0.25 : 0);
}, ['#aab1b9', '#c6cbd1', '#dadee2', '#eceef1', '#fbfcfd']);

const CELLS = Array.from({ length: 7 }, (_, i) => [hash2(i, 1, 71) * 32, hash2(i, 2, 71) * 32]);
const crackValue = (x, y) => {
  let d1 = 1e9, d2 = 1e9;
  for (const [cx, cy] of CELLS) for (let ox = -32; ox <= 32; ox += 32) for (let oy = -32; oy <= 32; oy += 32) {
    const d = Math.hypot(x + 0.5 - cx - ox, y + 0.5 - cy - oy);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return d2 - d1;
};
const crackGlow = () => page(72, (x, y) => { if (atDecal(x, y)) return 0.7; const e = crackValue(x, y); return e < 0.9 ? 0.9 : e < 1.6 ? 0.45 : 0; }, ['#000000', '#000000', '#000000', '#6a0410', '#b80c16']); 


const crackSkin = () => page(73, (x, y) => { if (atDecal(x, y)) return 1; const e = crackValue(x, y); return e < 1.6 ? 0.1 : 0.5 + (tn(x, y, 8, 73) - 0.5) * 0.4; }, ['#1c0408', '#4e2238', '#5a2840', '#68304a', '#ffffff']);






const BOSS_CRACK = 0.42, BOSS_SCORCH = 1.5; 
function page64(fn) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), img = g.createImageData(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const [r, gg, b] = fn(x / 2, y / 2, x, y), i = (y * 64 + x) * 4;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  return tex;
}
const decal64 = (x, y) => atDecal(Math.floor(x), Math.floor(y));
const bossGlow = () => page64((x, y) => (decal64(x, y) ? [150, 10, 20] : crackValue(x, y) < BOSS_CRACK ? [184, 12, 22] : [0, 0, 0]));
const bossFur = () => page64((x, y, px, py) => {
  if (decal64(x, y)) return [255, 255, 255];
  const e = crackValue(x, y), f = 0.6 + (tn(Math.floor(x), Math.floor(y), 8, 91) - 0.5) * 0.5 + (hash2(px, py, 93) - 0.5) * 0.12;
  const v = Math.round(207 + Math.max(0, Math.min(1, f)) * 48); 
  const k = e < BOSS_CRACK ? 0.5 : e < BOSS_SCORCH ? 0.5 + 0.42 * (e - BOSS_CRACK) / (BOSS_SCORCH - BOSS_CRACK) : 1;
  return [v * k, v * k * 0.96, v * k * 0.94];
});

function cozy(key, { map = null, color = '#ffffff', emissive = '#000000', emissiveMap = null, emissiveIntensity = 1, roughness = 0.92, metalness = 0, vertexGlow = false }) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map, color, emissive, emissiveMap, emissiveIntensity, roughness, metalness });
  if (map) pixelTexture(map);
  if (emissiveMap) pixelTexture(emissiveMap);
  makeCozy(m, { rim: 0.18, key: 'dachi-' + key });
  if (vertexGlow) { 
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      prev(sh, r);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;');
    };
  }
  return m;
}
let TEX = null;
const MATS = new Map();
export function material(variant, id, tint) {
  const key = `${variant}|${id}|${tint}`;
  let m = MATS.get(key);
  if (m) return m;
  if (tint !== '#ffffff') { 
    const base = material(variant, id, '#ffffff');
    m = base.clone(); 
    m.onBeforeCompile = base.onBeforeCompile; m.customProgramCacheKey = base.customProgramCacheKey;
    m.defaultAttributeValues = base.defaultAttributeValues; m.userData = base.userData;
    m.color.multiply(new THREE.Color(tint));
    MATS.set(key, m);
    return m;
  }
  TEX ||= { fur: furPage(), metal: metalPage(), glow: crackGlow(), skin: crackSkin() };
  const c = variant === 'c';
  if (id === 'lamp-glow') m = cozy('glow', { color: c ? '#ff8080' : '#ffffff', emissive: '#ffffff', emissiveIntensity: c ? 1.1 : 0.95, vertexGlow: true });
  else if (id === 'metal') m = c ? cozy('metal-c', { map: TEX.skin, color: '#f0e4e8', emissive: '#ff1a2a', emissiveMap: TEX.glow, roughness: 0.55, metalness: 0.3 })
    : cozy('metal', { map: TEX.metal, roughness: 0.5, metalness: 0.12 }); 
  else if (variant === 'b') m = cozy('fur-b', { map: TEX.bossFur ||= bossFur(), emissive: '#ff1a2a', emissiveMap: TEX.bossGlow ||= bossGlow(), emissiveIntensity: 0.75 }); 
  else m = c ? cozy('fur-c', { map: TEX.skin, color: '#ffffff', emissive: '#ff1a2a', emissiveMap: TEX.glow })
    : cozy('fur', { map: TEX.fur });
  
  const mode = castMode(variant, id);
  m.userData.look = { role: 'cast', ...mode, hull: !mode.glow, shiny: !mode.glow && variant === 'w' ? 1 : !mode.glow && variant === 'g' ? 2 : 0, form: mode.glow ? 0 : formCode(variant) }; 
  MATS.set(key, m);
  return m;
}


export function modelExtent(parts) {
  let x = 0, z = 0, y0 = Infinity, y1 = -Infinity;
  for (const { geo } of parts) {
    if (!geo.boundingBox) geo.computeBoundingBox();
    const b = geo.boundingBox;
    x = Math.max(x, -b.min.x, b.max.x); z = Math.max(z, -b.min.z, b.max.z); y0 = Math.min(y0, b.min.y); y1 = Math.max(y1, b.max.y);
  }
  return y1 > y0 ? { tall: y1 - Math.min(0, y0), half: Math.max(x, z) } : null;
}


const GEO = new Map();
export function geometries(key, arr) {
  let g = GEO.get(key);
  if (g) return g;
  g = arr.groups.map((grp) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(grp.position, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(grp.normal, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(grp.color, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(grp.uv, 2));
    if (grp.rig) geo.setAttribute('rigTag', new THREE.BufferAttribute(grp.rig, 1)); 
    geo.setIndex(new THREE.BufferAttribute(grp.index, 1));
    geo.computeBoundingSphere();
    return { geo, id: grp.material };
  });
  GEO.set(key, g);
  return g;
}


const R_PX = 20 / 128, STAGE_R = [1, 1.2, 1.38];







const FACE_CAM = Math.PI / 4, YAW_RIGHT = FACE_CAM + 0.3;



export function planMotion(plan, t, gait, moving) {
  switch (plan) {
    case 'fish': case 'ghost': return { lift: 0.14 + Math.sin(t * 2.2) * 0.07, roll: Math.sin(t * 2.2 + 1) * 0.07, pitch: Math.sin(t * 1.1) * 0.05, yaw: 0 };
    case 'bird': return moving ? { lift: Math.abs(Math.sin(gait * 0.9)) * 0.16, roll: 0, pitch: -0.08, yaw: 0 }
      : { lift: 0, roll: 0, pitch: Math.max(0, Math.sin(t * 1.3)) ** 10 * 0.35, yaw: 0 };
    case 'serpent': { const w = moving ? gait * 0.7 : t * 2.2; return { lift: 0, roll: Math.sin(w) * 0.1, pitch: 0, yaw: Math.sin(w + 0.8) * (moving ? 0.22 : 0.1) }; }
    case 'bug': return moving ? { lift: Math.abs(Math.sin(gait * 2)) * 0.04, roll: Math.sin(gait * 2.3) * 0.04, pitch: 0, yaw: Math.sin(gait * 1.7) * 0.08 }
      : { lift: 0, roll: 0, pitch: 0, yaw: (Math.sin(t * 0.9) > 0.97 ? Math.sin(t * 40) * 0.08 : 0) };
    case 'plant': return { lift: 0, roll: Math.sin(t * 1.6) * 0.07, pitch: Math.sin(t * 1.1) * 0.03, yaw: 0 };
    
    case 'crab': return moving ? { lift: Math.abs(Math.sin(gait * 2.4)) * 0.03, roll: Math.sin(gait * 2.4) * 0.06, pitch: 0, yaw: Math.sin(gait * 1.2) * 0.25 }
      : { lift: 0, roll: 0, pitch: 0, yaw: (Math.sin(t * 0.7) > 0.95 ? Math.sin(t * 30) * 0.12 : 0) };
    case 'strider': return moving ? { lift: Math.abs(Math.sin(gait * 0.45)) * 0.08, roll: 0, pitch: Math.sin(gait * 0.9) * 0.05, yaw: 0 } 
      : { lift: 0, roll: Math.sin(t * 0.9) * 0.025, pitch: Math.sin(t * 0.6) * 0.03, yaw: 0 };
    case 'jelly': { const pulse = Math.max(0, Math.sin(t * 2.6)) ** 3; return { lift: 0.08 + pulse * 0.16 - Math.sin(t * 1.3) * 0.04, roll: Math.sin(t * 1.1) * 0.05, pitch: -pulse * 0.06, yaw: 0 }; }
    case 'quadruped': return moving ? { lift: Math.abs(Math.sin(gait * 0.5)) * 0.05, roll: 0, pitch: Math.sin(gait) * 0.07, yaw: 0 }
      : { lift: 0, roll: Math.sin(t * 1.5) * 0.02, pitch: 0, yaw: 0 };
    default: return moving ? { lift: 0, roll: Math.sin(gait * 0.5) * 0.14, pitch: 0, yaw: 0 } 
      : { lift: 0, roll: Math.sin(t * 1.5) * 0.03, pitch: 0, yaw: 0 };
  }
}

export class DachiActor {
  constructor(scene, { size = 1.47, world = 1, see = false } = {}) { 
    this.scene = scene; this.size = size; this.world = world; this.see = see; this.ext = null;
    this.root = new THREE.Group(); this.root.name = 'dachi';
    this.body = new THREE.Group(); this.root.add(this.body);
    scene.add(this.root);
    this.key = null; this.variant = 'n'; this.tint = '#ffffff'; this.stage = 1;
    this.yaw = YAW_RIGHT; this.targetYaw = YAW_RIGHT; this.phase = Math.random() * 6; this.last = performance.now();
    this.side = 1; this.targetSide = 1; this.plan = 'round'; this.gait = 0; this.px = null; this.py = 0; this.forceMove = null; 
    this.disposed = false;
  }
  setLook(spId, opts = {}) {
    this.targetSide = opts.flip ? -1 : 1;
    
    
    const boss = speciesById(spId).boss, variant = boss && !opts.calm ? 'b' : opts.corrupt ? 'c' : opts.shiny === 'gold' ? 'g' : opts.shiny ? 'w' : formVariant(opts.form) || 'n', key = modelKeyOf(spId, opts) + variant;
    if (key === this.key) return;
    const sp = speciesById(spId);
    this.key = key; this.variant = variant; this.stage = sp.stage; this.bossScale = boss ? bossById(boss).scale : 0;
    this.plan = sp.stage >= 2 ? sp.look.plan || 'round' : 'round'; 
    this.fx = { aura: sp.stage >= 3 ? sp.color : null, flame: sp.look.tail === 'flame' }; 
    const mk = modelKeyOf(spId, opts);
    requestModel(spId, opts, (arr) => { if (!this.disposed && this.key === key) this.show(geometries(mk, arr)); });
  }
  show(parts) {
    this.body.clear();
    this.parts = parts;
    this.ext = modelExtent(parts);
    for (const { geo, id } of parts) {
      const mesh = new THREE.Mesh(geo, this.mat(id, this.tint));
      mesh.userData.dachiMat = id;
      mesh.castShadow = id !== 'lamp-glow'; mesh.receiveShadow = true;
      this.body.add(mesh);
    }
  }
  get scale() { return (this.bossScale || this.size * R_PX * STAGE_R[this.stage - 1]) * this.world; }
  place(x, y, ground, lift = 0) {
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    let d = this.targetYaw - this.yaw;
    this.yaw += d * Math.min(1, dt * 10);
    const ds = this.targetSide - this.side;
    this.side += Math.sign(ds) * Math.min(Math.abs(ds), dt * 9);
    const moving = this.forceMove ?? (this.px !== null && Math.hypot(x - this.px, y - this.py) > dt * 0.3);
    this.px = x; this.py = y;
    if (moving) this.gait += dt * 12;
    const m = planMotion(this.plan, now / 1000 + this.phase, this.gait, moving);
    this.root.position.set(x, ground + lift + m.lift, y);
    this.root.rotation.y = this.side >= 0 ? this.yaw : Math.PI / 2 - this.yaw;
    this.body.rotation.set(m.pitch, m.yaw, m.roll);
    const s = this.scale, breathe = 1 + Math.sin(now / 1000 * 3.1 + this.phase) * 0.025;
    const fx = Math.sign(this.side || 1) * Math.max(0.04, Math.abs(this.side));
    this.body.scale.set(s * (2 - breathe) * fx, s * breathe, s * (2 - breathe));
    if (this.fx && (this.fx.aura || this.fx.flame)) dachiFx(this, this.fx);
  }
  setSize(size) { this.size = size; }
  setVisible(v) { this.root.visible = v; }
  setTint(hex) {
    const t = new THREE.Color(hex).getHexString();
    const tint = '#' + t;
    if (tint === this.tint) return;
    this.tint = tint;
    for (const m of this.body.children) m.material = this.mat(m.userData.dachiMat, tint);
  }
  mat(id, tint) { const m = material(this.variant, id, tint); return this.see ? seeActorMaterial(m) : m; }
  
  
  extent() { const e = this.ext, s = this.scale; return e ? { tall: e.tall * s, half: e.half * s } : null; }
  dispose(scene) { this.disposed = true; (scene || this.scene).remove(this.root); }
}
