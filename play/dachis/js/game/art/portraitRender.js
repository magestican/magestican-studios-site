
















import * as THREE from 'three';
import { createPixelPass } from '../../engine/iso/pixelPass.js';
import { requestModel, requestJob, material, geometries, modelKeyOf } from './dachiActor.js';
import { modelKey, hatGeo } from './dachiModel.js';
import { formVariant } from '../data/forms.js';
import { kidKey, KID_RIG } from './kidModel.js';
import { humanRig, seatVertex, fallVertex, FALL, SEAT, KID_BODY_W, KID_SPLAY } from './humanRig.js';
import { ELDER_KEY, ELDER_RIG } from './elderModel.js';
import { aerowingKey } from './aerowingModel.js';
import { speciesById } from '../data/species.js';
import { activeLook } from './look/celLook.js';

const OUTLINE = [28, 24, 48]; 
const KID_HIP = KID_RIG.hip;
const STAGE_R = [1, 1.2, 1.38];


const VIEW = new THREE.Vector3(-0.3, 0.36, 0.9).normalize(); 

const BUST_VIEW = new THREE.Vector3(-0.3, 0.1, 1).normalize();

let R = null, pass = null, scene = null, cam = null, hemi = null, key = null, stage = null;
export function setPortraitStage(st) { stage = st; }

function setup() {
  if (R) return;
  R = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: false, preserveDrawingBuffer: true });
  R.setPixelRatio(1);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.NeutralToneMapping;
  R.setClearColor(0x000000, 0);
  pass = createPixelPass(R, { height: 4096 });
  scene = new THREE.Scene();
  hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  key = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(hemi, key, key.target);
  cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
}

function syncLight() {
  const sun = stage && stage.sun, sky = stage && stage.hemi;
  if (sky) { hemi.color.copy(sky.color); hemi.groundColor.copy(sky.groundColor); hemi.intensity = sky.intensity; }
  else { hemi.color.setRGB(0.9, 0.95, 1); hemi.groundColor.setRGB(0.6, 0.5, 0.4); hemi.intensity = 1.2; }
  if (sun) { key.color.copy(sun.color); key.intensity = sun.intensity; }
  else key.intensity = 2.5;
  R.toneMappingExposure = stage ? stage.renderer.toneMappingExposure : 1.2;
}





const CUSTOM_OPEN = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
function ungradedToneMapping() {
  const c = THREE.ShaderChunk.tonemapping_pars_fragment;
  if (!c.includes('fmlNeutralBase') || !c.includes(CUSTOM_OPEN)) return THREE.NeutralToneMapping;
  THREE.ShaderChunk.tonemapping_pars_fragment = c.replace(CUSTOM_OPEN, '') + '\nvec3 CustomToneMapping( vec3 color ) { return fmlNeutralBase( color ); }\n';
  return THREE.CustomToneMapping;
}
let UNGRADED = null;



function renderParts(parts, variant, out, mode, stageN, o = {}) {
  setup(); syncLight();
  const px = out.width, root = new THREE.Group(), view = o.view || (mode === 'bust' ? BUST_VIEW : VIEW);
  const look = activeLook(); 
  for (const { geo, id, m } of parts) {
    const mesh = new THREE.Mesh(geo, material(variant, id, '#ffffff'));
    if (m) { mesh.matrixAutoUpdate = false; mesh.matrix.copy(m); }
    root.add(mesh);
    if (look) look.portrait(mesh);
  }
  if (look) { R.toneMapping = THREE.NoToneMapping; pass.setDither(0); look.portraitSize(px); }
  else if (o.grade === false) R.toneMapping = UNGRADED ??= ungradedToneMapping();
  scene.add(root);
  
  cam.position.copy(view).multiplyScalar(40); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  key.position.copy(view).multiplyScalar(20).addScaledVector(right, -18).addScaledVector(up, 22);
  
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const v = new THREE.Vector3(), inv = cam.matrixWorldInverse;
  for (const { geo, m } of parts) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); if (m) v.applyMatrix4(m); v.applyMatrix4(inv);
      if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x; if (v.y < y0) y0 = v.y; if (v.y > y1) y1 = v.y;
    }
  }
  let S, left, bottom;
  if (mode === 'fixed') { 
    S = 6.4 / STAGE_R[(stageN || 1) - 1];
    const feet = new THREE.Vector3(0, 0, 0).applyMatrix4(inv);
    left = feet.x - S / 2; bottom = feet.y - S * 16 / 128;
  } else if (o.frame) { 
    const c = new THREE.Vector3(...o.frame.c).applyMatrix4(inv);
    S = o.frame.h; left = c.x - S / 2; bottom = c.y - S / 2;
  } else if (mode === 'bust') { 
    const hgt = (y1 - y0) * 0.6, m = hgt * 3 / px;
    S = hgt + m * 2; left = (x0 + x1) / 2 - S / 2; bottom = y1 + m - S;
  } else { 
    const m = Math.max(x1 - x0, y1 - y0) * 2 / (px - 4);
    S = Math.max(x1 - x0, y1 - y0) + m * 2; left = (x0 + x1) / 2 - S / 2; bottom = y0 - m;
  }
  cam.left = left; cam.right = left + S; cam.bottom = bottom; cam.top = bottom + S;
  cam.updateProjectionMatrix();
  R.setSize(px, px, false);
  pass.resize(px, px);
  pass.render(scene, cam);
  scene.remove(root);
  R.toneMapping = THREE.NeutralToneMapping;
  const ctx = out.getContext('2d');
  ctx.clearRect(0, 0, px, px);
  ctx.drawImage(R.domElement, 0, 0);
  outline(ctx, px, px);
}


function outline(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data, a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (a[i]) { d[i * 4 + 3] = 255; continue; }
    if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) {
      d[i * 4] = OUTLINE[0]; d[i * 4 + 1] = OUTLINE[1]; d[i * 4 + 2] = OUTLINE[2]; d[i * 4 + 3] = 255;
    } else d[i * 4 + 3] = 0;
  }
  ctx.putImageData(img, 0, 0);
}

const CACHE = new Map();
function entry(k, px) {
  let e = CACHE.get(k);
  if (e) return e;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = px;
  e = { canvas, ready: false, cbs: [], when(cb) { if (e.ready) cb(e); else e.cbs.push(cb); return e; } };
  e.done = () => { e.ready = true; const cbs = e.cbs; e.cbs = []; for (const cb of cbs) cb(e); };
  CACHE.set(k, e);
  return e;
}



export function dachiPortrait(spId, opts = {}, px = 32, mode = 'fit') {
  const geo = { bandage: !!opts.bandage, hat: hatGeo(opts.hat) }, variant = speciesById(spId).boss ? 'b' : opts.corrupt ? 'c' : formVariant(opts.form) || 'n'; 
  const k = `d${modelKey(spId, geo)}${variant}${opts.silhouette ? 's' : ''}|${px}|${mode}`;
  const e = entry(k, px);
  if (e.started) return e;
  e.started = true;
  if (opts.silhouette) { 
    dachiPortrait(spId, { ...opts, silhouette: false }, px, mode).when((src) => {
      const ctx = e.canvas.getContext('2d');
      ctx.drawImage(src.canvas, 0, 0);
      ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#1b1530'; ctx.fillRect(0, 0, px, px);
      ctx.globalCompositeOperation = 'source-over';
      e.done();
    });
    return e;
  }
  const stageN = speciesById(spId).stage;
  requestModel(spId, geo, (arr) => { renderParts(geometries(modelKeyOf(spId, geo), arr), variant, e.canvas, mode, stageN); e.done(); });
  return e;
}


export function castPortrait(kind, opts = {}, px = 56, mode = 'bust') {
  const k = kind === 'kid' ? kidKey(opts) : ELDER_KEY;
  const e = entry(`c${k}|${px}|${mode}`, px);
  if (e.started) return e;
  e.started = true;
  
  
  const RG = kind === 'kid' ? KID_RIG : ELDER_RIG, frame = mode === 'bust' ? { c: [0, RG.eye - (kind === 'kid' ? 0.3 : 0.4) * RG.hh, 0], h: (kind === 'kid' ? 1.9 : 2.2) * RG.hh } : null;
  requestJob({ key: k, kind, opts: { gender: opts.gender } }, (arr) => { renderParts(geometries(k, arr), 'n', e.canvas, mode, 1, { frame }); e.done(); });
  return e;
}




export function aerowingPortrait(frame = 1, px = 112, mode = 'fit', shot = null) {
  const k = aerowingKey(frame), e = entry(`a${k}|${px}|${mode}|${shot ? JSON.stringify(shot) : ''}`, px);
  if (e.started) return e;
  e.started = true;
  const o = shot ? { view: new THREE.Vector3(...shot.view).normalize(), frame: shot.frame, grade: false } : { grade: false };
  requestJob({ key: k, kind: 'aerowing', opts: { frame } }, (arr) => { renderParts(geometries(k, arr), 'n', e.canvas, mode, 1, o); e.done(); }); 
  return e;
}




const BACK_VIEW = new THREE.Vector3(0.3, 0.3, -1).normalize();

export function castFigure(kind, gender, px = 96, view = 'front') {
  const k = kind === 'kid' ? kidKey({ gender }) : ELDER_KEY, e = entry(`f${k}|${px}|${view}`, px);
  if (e.started) return e;
  e.started = true;
  requestJob({ key: k, kind, opts: { gender } }, (arr) => {
    renderParts(geometries(k, arr), 'n', e.canvas, 'fit', 1, { view: view === 'back' ? BACK_VIEW : VIEW, grade: false });
    e.done();
  });
  return e;
}






export const RIDE = { scale: 0.33, hip: [0, 0.82, -0.66], pitch: -0.3, seat: true }; 






export const RIDE_SHOT = { view: [0.85, 0.3, 0.3], frame: { c: [0, -0.2, 0], h: 5.3 } };


const SEATED = new Map(), SEAT_RIG = humanRig({ bodyW: KID_BODY_W, splay: KID_SPLAY });
function seated(key, parts) {
  if (SEATED.has(key)) return SEATED.get(key);
  const out = parts.map(({ geo, id }) => {
    const g = geo.clone(), P = g.attributes.position, N = g.attributes.normal, T = g.attributes.rigTag;
    const pos = P.array.slice(), nor = N.array.slice();
    for (let i = 0; i < P.count; i++) {
      const rest = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], tag = T ? Math.round(T.array[i]) : 0;
      const p = seatVertex(SEAT_RIG, rest, rest, tag), n = seatVertex(SEAT_RIG, [nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]], rest, tag, SEAT, false);
      P.array.set(p, i * 3); N.array.set(n, i * 3);
    }
    P.needsUpdate = N.needsUpdate = true; g.computeBoundingSphere();
    return { geo: g, id };
  });
  SEATED.set(key, out);
  return out;
}


export const FALL_FRAMES = FALL.length;
const FALLEN = new Map();
export function kidFallFigure(gender, px = 110, frame = 0) {
  const k = kidKey({ gender }), e = entry(`fall${k}|${px}|${frame}`, px);
  if (e.started) return e;
  e.started = true;
  requestJob({ key: k, kind: 'kid', opts: { gender } }, (arr) => {
    const fk = k + '|' + frame;
    let parts = FALLEN.get(fk);
    if (!parts) {
      parts = geometries(k, arr).map(({ geo, id }) => {
        const g = geo.clone(), P = g.attributes.position, N = g.attributes.normal, T = g.attributes.rigTag;
        const pos = P.array.slice(), nor = N.array.slice();
        for (let i = 0; i < P.count; i++) {
          const rest = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], tag = T ? Math.round(T.array[i]) : 0;
          P.array.set(fallVertex(SEAT_RIG, rest, rest, tag, frame), i * 3);
          N.array.set(fallVertex(SEAT_RIG, [nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]], rest, tag, frame, false), i * 3);
        }
        P.needsUpdate = N.needsUpdate = true; g.computeBoundingSphere();
        return { geo: g, id };
      });
      FALLEN.set(fk, parts);
    }
    renderParts(parts, 'n', e.canvas, 'fit', 1, { view: VIEW, grade: false });
    e.done();
  });
  return e;
}


export function aerowingRidePortrait(frame = 1, px = 200, gender = 'boy', view = null) {
  const ak = aerowingKey(frame), kk = kidKey({ gender }), e = entry(`r${ak}${kk}|${px}|${RIDE.seat}|${view ? view.join() : JSON.stringify(RIDE_SHOT)}`, px);
  if (e.started) return e;
  e.started = true;
  requestJob({ key: kk, kind: 'kid', opts: { gender } }, (karr) => requestJob({ key: ak, kind: 'aerowing', opts: { frame } }, (aarr) => {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...RIDE.hip),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(RIDE.pitch, 0, 0)), new THREE.Vector3(RIDE.scale, RIDE.scale, RIDE.scale))
      .multiply(new THREE.Matrix4().makeTranslation(0, -KID_HIP, 0));
    const parts = [...geometries(ak, aarr), ...(RIDE.seat ? seated(kk, geometries(kk, karr)) : geometries(kk, karr)).map((p) => ({ ...p, m }))];
    renderParts(parts, 'n', e.canvas, 'fit', 1, view ? { view: new THREE.Vector3(...view).normalize(), grade: false }
      : { view: new THREE.Vector3(...RIDE_SHOT.view).normalize(), frame: RIDE_SHOT.frame, grade: false });
    e.done();
  }));
  return e;
}





const idle = globalThis.requestIdleCallback || ((cb) => setTimeout(cb, 50));
export function prewarmDex(ids, px = 32) {
  for (const id of ids) {
    requestModel(id, {}, () => idle(() => dachiPortrait(id, {}, px)), true);
  }
}


export function prewarmPortraits(list, px = 32, mode = 'fit') { for (const [spId, opts] of list) dachiPortrait(spId, opts || {}, px, mode); }



const big = document.createElement('canvas'), bctx = big.getContext('2d');
export function blitSharp(ctx, src, x, y, w, h) {
  const m = Math.max(1, Math.ceil(Math.max(w / src.width, h / src.height)));
  if (m === 1) { ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(src, x, y, w, h); ctx.restore(); return; }
  if (big.width !== src.width * m || big.height !== src.height * m) { big.width = src.width * m; big.height = src.height * m; }
  bctx.imageSmoothingEnabled = false;
  bctx.clearRect(0, 0, big.width, big.height);
  bctx.drawImage(src, 0, 0, big.width, big.height);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(big, x, y, w, h);
  ctx.restore();
}



export function dachiCanvas(spId, opts, cssPx) {
  const cv = document.createElement('canvas'); cv.width = cv.height = cssPx * 2;
  dachiPortrait(spId, opts, Math.round(cssPx / 1.5)).when((e) => blitSharp(cv.getContext('2d'), e.canvas, 0, 0, cv.width, cv.height));
  return cv;
}
