








































import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toObject3D, applyPose } from '../render/toMesh.js';
import { KINDS, VARIANTS, ITEM_OF_GOOD, TOOLS, TOOL_GRIP, generate as generateItem } from 'moon/art/item.mjs';
import { ACT_NAMES } from 'moon/rig/clips.mjs';
import { bindCharacter } from '../render/character.js';
import { sampleClip, blendPose } from 'moon/rig/pose.mjs';
import { curveUniforms, windUniforms, waterUniforms } from '../render/material.js';
import { createSky } from '../render/sky.js';
import { createDaylight } from '../render/daylight.js';
import { createNightLights } from '../render/nightLights.js';
import { createPost } from '../render/post.js';
import { viewerGround } from '../render/ground.js';
import { buildMoonScene, lightSourcesOf } from './scene.js';
import { dayCycle } from 'moon/light/dayCycle.mjs';
import { SETTINGS, tierFromParam, decideTier, rendererFlags, isCapturing } from 'moon/light/quality.mjs';
import { CURVE_K } from 'moon/world/curve.mjs';
import { heightAt } from 'moon/world/moonLayout.mjs';

const q = new URLSearchParams(location.search);
const pinnedTier = tierFromParam(q.get('tier'));
const state = {
  asset: q.get('asset') || 'tree',
  seed: Number(q.get('seed') || 1),
  season: q.get('season') || 'summer',
  stage: q.get('stage') || '',
  lod: Number(q.get('lod') || 0),
  view: q.get('view') || 'lineup',
  camera: q.get('camera') || 'gameplay',
  time: Number(q.get('time') ?? 12),
  silhouette: q.get('silhouette') === '1',
  tier: pinnedTier || 'auto',
  speed: Number(q.get('speed') || 0),
  tonemap: q.get('tonemap') || 'neutral',
  
  
  curve: Number(q.get('curve') ?? ((q.get('view') || 'lineup') === 'scene' ? CURVE_K : 0)),
  yaw: Number(q.get('yaw') || 0),
  clip: q.get('clip') || '',
  phase: q.get('phase') === null || q.get('phase') === '' ? null : Number(q.get('phase')),
  move: q.get('move') === null || q.get('move') === '' ? null : Number(q.get('move')),
  carry: q.get('carry') === '1',
  kind: q.get('kind') || 'apple',
  variant: q.get('variant') || '',
  size: Number(q.get('size') || 128),
  compare: q.get('compare') || '',
  species: q.get('species') || (q.get('asset') === 'villager' ? 'elephant' : ''),
  progress: q.get('progress') === null || q.get('progress') === '' ? undefined : Number(q.get('progress')),
  role: q.get('role') || '',
  build: q.get('build') || '',
  type: q.get('type') || '',
  tool: q.get('tool') || '',
  
  
  windT: q.get('t') === null || q.get('t') === '' ? null : Number(q.get('t')),
};
windUniforms.uFmlWind.value = q.get('wind') === '0' ? 0 : 1;

waterUniforms.uFmlWater.value = q.get('water') === '0' ? 0 : 1;

const TOOL_OF_CLIP = { chop: 'axe', dig: 'shovel', mine: 'pickaxe', water: 'wateringCan' };
if (state.view === 'walk' && !state.clip) state.clip = 'walk';
if (q.get('shot') === '1') document.body.classList.add('shot');

const tier = pinnedTier || 'high';
const settings = SETTINGS[tier];
const fml = (window.__fml = { ready: false, error: null, state, tier, triangles: 0, drawCalls: 0, problems: [], missing: [], notes: [] });
const statusEl = document.getElementById('status');

const form = document.getElementById('panel');
for (const [k, v] of Object.entries(state)) {
  const el = form.elements[k];
  if (!el) continue;
  if (el.type === 'checkbox') el.checked = Boolean(v); else el.value = v;
}

const TONEMAPS = { neutral: THREE.NeutralToneMapping, aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, none: THREE.NoToneMapping };
const canvas = document.getElementById('view');




const flags = rendererFlags({
  settings,
  devicePixelRatio: window.devicePixelRatio,
  coarsePointer: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
  capturing: isCapturing(q, navigator),
});
const renderer = new THREE.WebGLRenderer({ canvas, ...flags });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = TONEMAPS[state.tonemap] ?? THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.info.autoReset = false;
curveUniforms.uCurve.value = state.curve;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 700);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;



const inks = new Map();
function inkFor(material) {
  if (!inks.has(material)) {
    const cut = material.alphaTest > 0 && material.map;
    inks.set(material, new THREE.MeshBasicMaterial({ color: '#1d1b2e', map: cut ? material.map : null, alphaTest: cut ? material.alphaTest : 0, side: material.side, toneMapped: false }));
  }
  return inks.get(material);
}
const isScene = state.view === 'scene';

const BUILDING_ASSETS = ['shop', 'processor', 'villagerHome'];
const isHomes = state.asset === 'villagerHome' && state.view === 'homes';
let sky = null, daylight = null, night = null, post = null;

if (state.silhouette) {
  scene.background = new THREE.Color('#fff3de');
} else {
  sky = createSky();
  scene.add(sky.mesh);
  
  fml.skyMask = (on) => { sky.mesh.visible = !on; scene.background = on ? new THREE.Color(0xff00ff) : null; };
  
  daylight = createDaylight(scene, settings, { shadowExtent: isScene ? 22 : isHomes ? 40 : state.asset === 'item' ? 1.2 : BUILDING_ASSETS.includes(state.asset) ? 24 : 14 });
}
if (state.asset === 'item') {
  camera.near = 0.005;
  camera.updateProjectionMatrix();
}

const root = new THREE.Group();
scene.add(root);

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (post) post.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();


function frameCamera(target, pitchDeg, dist, yaw = 0) {
  const pitch = THREE.MathUtils.degToRad(pitchDeg);
  controls.target.copy(target);
  const flat = Math.cos(pitch) * dist;
  camera.position.set(target.x + Math.sin(yaw) * flat, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * flat);
  controls.update();
}

async function loadScene() {
  const world = await buildMoonScene({ scene, state, settings, fml });
  if (state.camera === 'wide') {
    frameCamera(new THREE.Vector3(0, -2, 0), 32, 118);
    if (daylight) daylight.fogScale = 0.12;
  } else {
    
    
    
    const portrait = camera.aspect < 1;
    const frame = portrait ? world.focus.portrait : world.focus.desktop;
    if (portrait) { camera.fov = 50; camera.updateProjectionMatrix(); }
    const focus = new THREE.Vector3(frame.x, heightAt(frame.x, frame.z) + 0.7, frame.z);
    const fit = frame.halfWidth / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    frameCamera(focus, 35, Number(q.get('dist')) || Math.max(9, fit), frame.yaw);
    if (sky) sky.anchorYaw = -frame.yaw;
  }
  controls.minPolarAngle = THREE.MathUtils.degToRad(40);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(72);
  controls.minDistance = 8;
  controls.maxDistance = 140;
  if (!state.silhouette) night = createNightLights({ scene, sources: world.sources, size: settings.lights, groundHeight: heightAt });
}


const posed = [];
function poseClip(pc, phase) {
  const clip = pc.clips[state.clip];
  let pose = sampleClip(pc.rig, clip, phase);
  if (clip.mask) {
    const base = sampleClip(pc.rig, pc.clips.idle, phase);
    pose = blendPose(pc.rig, base, base, pose, 1, clip.mask);
  }
  applyPose(pc.object.userData.rig, pose);
}




function assetSpecs(mod) {
  if (isHomes) return mod.SPECIES.flatMap((species, row) => mod.STAGES.map((stage) => ({ seed: state.seed, species, stage, row })));
  const isItem = state.asset === 'item';
  
  
  const isDecor = state.asset === 'decor';
  if (isDecor && state.view === 'kinds') {
    return mod.KINDS.filter((kind) => kind !== 'house').map((kind, i) => ({ seed: state.seed, kind, row: Math.floor(i / 6) }));
  }
  if (isItem && state.view === 'items') return KINDS.map((kind, i) => ({ seed: state.seed, kind, row: Math.floor(i / 8) }));
  if (isItem && state.view === 'tools') return TOOLS.map((kind) => ({ seed: state.seed, kind }));
  if (state.asset === 'forageSpot' && state.view === 'types') return mod.TYPES.flatMap((type, row) => mod.STAGES.map((stage) => ({ seed: state.seed, type, stage, row })));
  if (state.view === 'walk' && ACT_NAMES.includes(state.clip)) return [0.14, 0.36, 0.47, 0.57, 0.8].map((phase) => ({ seed: state.seed, phase }));
  if (isItem && state.view === 'goods') {
    const all = [...Object.values(ITEM_OF_GOOD), { kind: 'coin' }, { kind: 'giftBox' }];
    return all.map((it, i) => ({ seed: state.seed, kind: it.kind, variant: it.variant ?? undefined, row: Math.floor(i / Math.ceil(all.length / 3)) }));
  }
  if (state.view === 'walk') return [0, 0.125, 0.25, 0.375, 0.5].map((phase) => ({ seed: state.seed, phase }));
  const seeds = state.view === 'lineup' ? [state.seed, state.seed + 1, state.seed + 2] : [state.seed];
  if (isDecor) return seeds.map((seed) => ({ seed, kind: state.kind || 'fountain', variant: state.variant || undefined }));
  return seeds.map((seed) => (isItem ? { seed, kind: state.kind, variant: state.variant || (VARIANTS[state.kind] || [])[0] || undefined } : { seed }));
}



async function castSpecs(mod) {
  const specs = [];
  for (const species of mod.VILLAGER_SPECIES) {
    try {
      mod.generate({ species, seed: state.seed, season: state.season, lod: 2 });
      for (const build of species === 'human' ? ['female', 'male'] : [undefined]) specs.push({ seed: state.seed, species, build });
    } catch (e) {
      if (!/not built yet/.test(String(e))) throw e;
      fml.notes.push(`cast: ${species} not built yet`);
    }
  }
  const player = await import('moon/art/player.mjs');
  for (const species of player.SPECIES) {
    if (species === 'pig') continue;
    for (const build of species === 'human' ? ['female', 'male'] : [undefined]) specs.push({ seed: state.seed, asset: 'player', species, build });
  }
  specs.push({ seed: state.seed, asset: 'cat' });
  return specs;
}





async function placeAnchorGoods(obj, a) {
  const { itemObject } = await import('../render/items.js');
  const put = async (good, x, y, z, rotY = 0) => {
    const it = await itemObject(good, { season: state.season });
    it.position.set(x, y, z);
    it.rotation.y = rotY;
    obj.add(it);
  };
  for (const [k, sh] of (a.shelves || []).entries()) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const u = ((i + 0.5) / n - 0.5) * sh.width;
      await put(k % 2 ? 'appleJam' : 'apple', sh.x + u * Math.cos(sh.rotY), sh.y, sh.z - u * Math.sin(sh.rotY), sh.rotY);
    }
  }
  for (const o of a.outputs || []) for (const dx of [-0.07, 0.07]) await put('appleJuice', o.x + dx, o.y, o.z);
  for (const s of a.stations || []) await put('coin', s.x, s.y, s.z);
  if (a.counter) await put('coin', a.counter.x, a.counter.y, a.counter.z);
}

async function loadAssets() {
  const mod = await import(`moon/art/${state.asset}.mjs`);
  const parts = [];
  const sources = [];
  let specs = assetSpecs(mod);
  if (state.view === 'stages' && mod.STAGES) specs = mod.STAGES.map((stage) => ({ seed: state.seed, stage }));
  if (state.view === 'cast' && mod.VILLAGER_SPECIES) specs = await castSpecs(mod);
  if (state.compare) specs.push({ seed: 1, asset: state.compare });
  for (const spec of specs) {
    const { seed } = spec;
    const gen = spec.asset ? await import(`moon/art/${spec.asset}.mjs`) : mod;
    
    const species = spec.asset ? spec.species : spec.species ?? (state.species || undefined);
    const build = spec.build ?? (spec.asset ? undefined : state.build || undefined);
    const data = gen.generate({ seed, season: state.season, stage: spec.stage || (spec.asset ? undefined : state.stage || undefined), lod: state.lod, kind: spec.kind, variant: spec.variant ?? undefined, species, role: spec.asset ? undefined : state.role || undefined, ...(species === 'human' && build ? { build } : {}), progress: state.progress, ...(spec.type || state.type ? { type: spec.type || state.type } : {}) });
    fml.problems.push(...data.validate());
    fml.triangles += data.triangleCount;
    if (data.rig && data.rig.height_m) fml.notes.push(`${data.name}: height_m ${data.rig.height_m} top_m ${data.rig.top_m}`);
    const obj = await toObject3D(data);
    if ((state.clip || state.move !== null) && data.rig) {
      const pc = bindCharacter(data, obj);
      if (state.clip && !pc.clips[state.clip]) throw new Error(`unknown clip '${state.clip}' (clips: ${Object.keys(pc.clips).join(', ')})`);
      if (spec.phase !== undefined) pc.fixedPhase = spec.phase;
      
      const toolKind = state.tool === 'none' ? '' : state.tool || TOOL_OF_CLIP[state.clip] || '';
      if (toolKind) {
        const toolData = generateItem({ kind: toolKind, seed, season: state.season, lod: state.lod });
        fml.problems.push(...toolData.validate());
        fml.triangles += toolData.triangleCount;
        pc.holdTool(await toObject3D(toolData), TOOL_GRIP[toolKind]);
      }
      posed.push(pc);
      if (state.clip) poseClip(pc, spec.phase ?? state.phase ?? 0);
    } else if (state.clip || state.move !== null) {
      if (!specs.some((s) => s.asset)) throw new Error(`clip/move: ${state.asset} has no rig`);
    }
    if (state.silhouette) obj.traverse((o) => { if (o.isMesh) o.material = inkFor(o.material); });
    const b = data.bounds();
    if (q.get('goods') === '1' && !state.silhouette && !spec.asset && gen.anchors) await placeAnchorGoods(obj, gen.anchors({ seed, stage: spec.stage || state.stage || undefined }));
    parts.push({ obj, data, min: b.min[0], width: b.max[0] - b.min[0], depth: b.max[2] - b.min[2], row: spec.row || 0 });
  }
  
  const isItem = state.asset === 'item';
  const gap = isItem ? Math.max(0.03, 0.45 * Math.max(...parts.map((p) => p.width))) : 1.2;
  const isForageTypes = state.asset === 'forageSpot' && state.view === 'types';
  const rowDepth = isItem ? Math.max(...parts.map((p) => p.depth)) * 1.9 : isHomes || isForageTypes ? Math.max(...parts.map((p) => p.depth)) * 1.7 : 0;
  for (const row of new Set(parts.map((p) => p.row))) {
    const inRow = parts.filter((p) => p.row === row);
    const total = inRow.reduce((s, p) => s + p.width, 0) + gap * (inRow.length - 1);
    let cursor = -total / 2;
    for (const p of inRow) {
      p.obj.position.x = cursor - p.min;
      p.obj.position.z = -row * rowDepth;
      cursor += p.width + gap;
    }
  }
  for (const p of parts) {
    root.add(p.obj);
    for (const kind of ['lamp', 'fire']) {
      const group = p.data.groups.get(kind === 'lamp' ? 'lamp-glow' : 'fire');
      if (group) sources.push(...lightSourcesOf(p.data, [1, 0, 0, p.obj.position.x, 0, 1, 0, 0, 0, 0, 1, 0], kind));
    }
  }
  if (!state.silhouette) {
    root.add(await viewerGround(state.season));
    night = createNightLights({ scene, sources, size: settings.lights });
  }

  const box = new THREE.Box3();
  for (const p of parts) box.expandByObject(p.obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const gameplay = state.camera === 'gameplay';
  const fit = Math.max(size.y, size.x / camera.aspect, isHomes ? size.z * 0.75 : 0) * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = gameplay ? Math.max(14, fit * 1.2) : fit * 1.35;
  frameCamera(new THREE.Vector3(center.x, gameplay ? box.min.y + 1 : center.y, center.z), gameplay ? 35 : 12, dist, THREE.MathUtils.degToRad(state.yaw));
}



async function loadIcons() {
  const { iconFor } = await import('../render/icons.js');
  canvas.style.visibility = 'hidden';
  const goods = [...Object.keys(ITEM_OF_GOOD), 'coin', 'giftBox'];
  const sheet = document.createElement('div');
  sheet.style.cssText = 'position:fixed;inset:0;display:grid;grid-template-rows:1fr 1fr;gap:8px;padding:10px;background:#efe3cf;overflow:hidden';
  for (const plate of ['#fff8ec', '#4d4160']) {
    const row = document.createElement('div');
    row.style.cssText = `display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:4px 10px;background:${plate};border-radius:14px;padding:6px`;
    for (const good of goods) {
      const cell = document.createElement('figure');
      cell.style.cssText = `margin:0;display:flex;flex-direction:column;align-items:center;font:11px system-ui;color:${plate === '#fff8ec' ? '#5a4a40' : '#f3e8ff'}`;
      const icon = await iconFor(good, { size: state.size });
      icon.style.cssText = `width:${Math.min(state.size, 96)}px;height:${Math.min(state.size, 96)}px`;
      const label = document.createElement('figcaption');
      label.textContent = good;
      cell.append(icon, label);
      row.append(cell);
    }
    sheet.append(row);
  }
  document.body.append(sheet);
}

const load = isScene ? loadScene : state.view === 'icons' ? loadIcons : loadAssets;

let frames = 0;
const clock = new THREE.Clock();
const samples = [];
let measureStart = 0;
let seconds = 0;

function frame(now) {
  const dt = clock.getDelta();
  seconds += dt;
  windUniforms.uFmlTime.value = state.windT ?? seconds; 
  if (state.view === 'turntable') root.rotation.y += dt * 0.6;
  if (state.move !== null) for (const pc of posed) pc.update(dt, { speed: state.move, carrying: state.carry });
  else if (state.clip && state.phase === null) for (const pc of posed) if (pc.fixedPhase === undefined) poseClip(pc, (seconds / pc.clips[state.clip].duration) % 1);
  if (state.speed) state.time = (state.time + dt * state.speed) % 24;
  controls.update();
  curveUniforms.uCurveFocus.value.copy(controls.target);
  const cycle = dayCycle(state.time);
  if (daylight) {
    daylight.apply(cycle, controls.target, renderer);
    sky.update(cycle, camera, controls.target, seconds, curveUniforms.uCurve.value);
  }
  if (night) {
    const pixelsPerRadian = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    night.update(cycle, controls.target, pixelsPerRadian * 1.0);
  }
  if (post) post.setBloom(cycle.bloom * settings.effects);
  renderer.info.reset();
  if (post) post.render(); else renderer.render(scene, camera);

  if (!pinnedTier && frames > 3) {
    if (!measureStart) measureStart = now;
    samples.push(dt * 1000);
    const decision = decideTier(samples, samples.length, now - measureStart);
    if (decision && fml.tier === 'high' && decision.tier !== 'high') {
      fml.tier = decision.tier;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, SETTINGS[decision.tier].pixelRatio));
      resize();
    }
  }
  if (++frames === 3) {
    fml.drawCalls = renderer.info.render.calls;
    fml.ready = true;
    statusEl.textContent = `${isScene ? 'scene' : state.asset} ${state.season} ${state.time}h tier ${tier}  tris ${fml.triangles}  calls ${fml.drawCalls}`
      + (fml.missing.length ? `\nMISSING: ${fml.missing.join('; ')}` : '')
      + (fml.problems.length ? `\nPROBLEMS: ${fml.problems.join('; ')}` : '');
  }
  requestAnimationFrame(frame);
}

load().then(() => {
  if (!state.silhouette) {
    post = createPost(renderer, scene, camera, settings);
    resize();
  }
  requestAnimationFrame(frame);
}, (e) => {
  fml.error = String(e && e.stack ? e.stack : e);
  statusEl.textContent = `failed: ${fml.error}`;
  console.error(e);
});
