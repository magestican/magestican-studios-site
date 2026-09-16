



















import * as THREE from 'three';
import { itemObject } from './items.js';
import { decorObject } from './decor.js';
import { curveUniforms, cozyUniforms } from './material.js';

const YAW = THREE.MathUtils.degToRad(-32); 
const PITCH = THREE.MathUtils.degToRad(26);
const MARGIN = 0.08;
const SUPERSAMPLE = 2;


const DAY = { uFmlWrap: 0.45, uFmlShadeTint: [0.86, 0.82, 1.0], uFmlShadeLift: [0.01, 0.008, 0.025], uFmlRimColor: [0.5, 0.55, 0.6], uFmlMottle: 0.06 };

let stage = null;
const icons = new Map();
let queue = Promise.resolve();

function makeStage() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff4e4', '#b7a9d6', 1.5));
  const key = new THREE.DirectionalLight('#fff0da', 2.7);
  const fill = new THREE.DirectionalLight('#cdd6ff', 0.65);
  scene.add(key, key.target, fill, fill.target);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 10);
  return { renderer, scene, camera, key, fill };
}

export function iconFor(good, { size = 128 } = {}) {
  return cached(`item:${good}`, good, size, () => itemObject(good, { seed: 1, season: 'summer', lod: 0 }));
}







export function decorIconFor(item, { size = 128, lod = 1 } = {}) {
  return cached(`decor:${item}|${lod}`, item, size, () => decorObject(item, { season: 'summer', lod }));
}

function cached(key, name, size, build) {
  const k = `${key}|${size}`;
  if (!icons.has(k)) {
    const job = queue.then(() => renderIcon(build, size));
    queue = job.catch(() => {});
    icons.set(k, job);
    job.catch(() => icons.delete(k));
  }
  return icons.get(k).then((master) => {
    const out = document.createElement('canvas');
    out.width = out.height = size;
    out.getContext('2d').drawImage(master, 0, 0);
    out.dataset.good = name;
    return out;
  });
}

async function renderIcon(build, size) {
  stage ||= makeStage();
  const { renderer, scene, camera, key, fill } = stage;
  const obj = await build();
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;

  
  
  const dir = new THREE.Vector3(Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH));
  camera.position.copy(centre).addScaledVector(dir, radius * 4);
  camera.up.set(0, 1, 0);
  camera.lookAt(centre);
  camera.updateMatrixWorld(true);
  const view = camera.matrixWorldInverse;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(view);
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const half = Math.max(maxX - minX, maxY - minY) / 2 * (1 + MARGIN);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  Object.assign(camera, { left: cx - half, right: cx + half, top: cy + half, bottom: cy - half, near: radius * 0.5, far: radius * 8 });
  camera.updateProjectionMatrix();

  key.position.copy(centre).add(new THREE.Vector3(-1.3, 2.4, 1.5).multiplyScalar(radius));
  key.target.position.copy(centre);
  fill.position.copy(centre).add(new THREE.Vector3(1.6, 0.5, -0.6).multiplyScalar(radius));
  fill.target.position.copy(centre);

  const saved = {
    curve: curveUniforms.uCurve.value,
    focus: curveUniforms.uCurveFocus.value.clone(),
    cozy: Object.fromEntries(Object.keys(DAY).map((k) => [k, cozyUniforms[k].value?.clone ? cozyUniforms[k].value.clone() : cozyUniforms[k].value])),
  };
  const px = size * SUPERSAMPLE;
  scene.add(obj);
  try {
    curveUniforms.uCurve.value = 0;
    curveUniforms.uCurveFocus.value.copy(centre);
    for (const [k, v] of Object.entries(DAY)) {
      if (Array.isArray(v)) cozyUniforms[k].value.setRGB(v[0], v[1], v[2]); else cozyUniforms[k].value = v;
    }
    renderer.setSize(px, px, false);
    renderer.render(scene, camera);
  } finally {
    scene.remove(obj);
    curveUniforms.uCurve.value = saved.curve;
    curveUniforms.uCurveFocus.value.copy(saved.focus);
    for (const [k, v] of Object.entries(saved.cozy)) {
      if (v && v.isColor) cozyUniforms[k].value.copy(v); else cozyUniforms[k].value = v;
    }
  }
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(renderer.domElement, 0, 0, size, size);
  return out;
}









const PORTRAIT_YAW = THREE.MathUtils.degToRad(18);  
const PORTRAIT_PITCH = THREE.MathUtils.degToRad(8);

export function portraitOf(object, { width = 240, height = 320 } = {}) {
  const job = queue.then(() => renderPortrait(object, width, height));
  queue = job.catch(() => {});
  return job;
}

function renderPortrait(object, width, height) {
  stage ||= makeStage();
  const { renderer, scene, camera, key, fill } = stage;
  const parent = object.parent;
  const pos = object.position.clone(), quat = object.quaternion.clone(), scl = object.scale.clone();
  const culled = [];
  object.traverse((o) => { if (o.isMesh) { culled.push([o, o.frustumCulled]); o.frustumCulled = false; } });
  object.position.set(0, 0, 0);
  object.quaternion.identity();
  object.scale.set(1, 1, 1);
  scene.add(object);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;

  const dir = new THREE.Vector3(Math.sin(PORTRAIT_YAW) * Math.cos(PORTRAIT_PITCH), Math.sin(PORTRAIT_PITCH), Math.cos(PORTRAIT_YAW) * Math.cos(PORTRAIT_PITCH));
  camera.position.copy(centre).addScaledVector(dir, radius * 4);
  camera.up.set(0, 1, 0);
  camera.lookAt(centre);
  camera.updateMatrixWorld(true);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(camera.matrixWorldInverse);
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  
  const aspect = width / height;
  let hw = (maxX - minX) / 2, hh = (maxY - minY) / 2;
  if (hw / hh > aspect) hh = hw / aspect; else hw = hh * aspect;
  hw *= 1 + MARGIN * 1.5; hh *= 1 + MARGIN * 1.5;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  Object.assign(camera, { left: cx - hw, right: cx + hw, top: cy + hh, bottom: cy - hh, near: radius * 0.5, far: radius * 8 });
  camera.updateProjectionMatrix();
  key.position.copy(centre).add(new THREE.Vector3(-1.3, 2.4, 1.5).multiplyScalar(radius));
  key.target.position.copy(centre);
  fill.position.copy(centre).add(new THREE.Vector3(1.6, 0.5, -0.6).multiplyScalar(radius));
  fill.target.position.copy(centre);

  const saved = {
    curve: curveUniforms.uCurve.value,
    focus: curveUniforms.uCurveFocus.value.clone(),
    cozy: Object.fromEntries(Object.keys(DAY).map((k) => [k, cozyUniforms[k].value?.clone ? cozyUniforms[k].value.clone() : cozyUniforms[k].value])),
  };
  try {
    curveUniforms.uCurve.value = 0;
    curveUniforms.uCurveFocus.value.copy(centre);
    for (const [k, v] of Object.entries(DAY)) {
      if (Array.isArray(v)) cozyUniforms[k].value.setRGB(v[0], v[1], v[2]); else cozyUniforms[k].value = v;
    }
    renderer.setSize(width * SUPERSAMPLE, height * SUPERSAMPLE, false);
    renderer.render(scene, camera);
  } finally {
    scene.remove(object);
    if (parent) parent.add(object);
    object.position.copy(pos); object.quaternion.copy(quat); object.scale.copy(scl);
    object.updateMatrixWorld(true);
    for (const [o, c] of culled) o.frustumCulled = c;
    curveUniforms.uCurve.value = saved.curve;
    curveUniforms.uCurveFocus.value.copy(saved.focus);
    for (const [k, v] of Object.entries(saved.cozy)) {
      if (v && v.isColor) cozyUniforms[k].value.copy(v); else cozyUniforms[k].value = v;
    }
  }
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(renderer.domElement, 0, 0, width, height);
  return out;
}
