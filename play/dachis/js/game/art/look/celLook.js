

















import * as THREE from 'three';
import { patchSeeThrough } from '../../../engine/iso/seeThrough.js';
import { applyLook } from '../../../engine/iso/cozyStage.js';
import * as R from './celRules.js';
import { CEL_PARS_V, celMainV, CEL_PARS_F, CEL_MAIN_F, hullVertex, HULL_FRAG } from './celGlsl.js';

const LIT = new Set(['MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial']);

export const celUniforms = {
  uCelSun: { value: new THREE.Vector3(...R.SUN) },
  uCelShade: { value: new THREE.Vector3(...R.SHADE) },
  uCelCell: { value: R.HALFTONE_CELL },
  uCelCrackScale: { value: R.CRACK_SCALE },
  uCelRes: { value: new THREE.Vector2(1, 1) },
  uCelPx: { value: 1 },
};
const INK = new THREE.Color(R.INK);


const celCache = new WeakMap();
function celFrom(src) {
  let m = celCache.get(src);
  if (m) return m;
  const info = src.userData.look || {}, pose = src.userData.pose || null;
  m = new THREE.MeshBasicMaterial({
    color: src.color, vertexColors: src.vertexColors, map: info.keepMap ? src.map : null,
    transparent: src.transparent, opacity: src.opacity, alphaTest: src.alphaTest, side: src.side,
  });
  if (src.flatShading) m.flatShading = true;
  m.name = 'cel:' + (src.name || info.role || '');
  const cast = info.role === 'cast';
  const sat = { value: R.SAT[cast ? 'cast' : 'scenery'] }, spec = { value: R.SPEC[cast ? 'cast' : 'scenery'] };
  const head = (info.glow ? '#define CEL_GLOW\n' : '') + '#define CEL_CORRUPT ' + (info.corrupt || 0) + '\n';
  m.userData = { cel: true, look: info, pose };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, celUniforms, { uCelSat: sat, uCelSpec: spec }, pose ? pose.uniforms : {});
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + CEL_PARS_V + (pose ? pose.glsl : ''))
      .replace('#include <project_vertex>', '#include <project_vertex>\n' + celMainV(pose ? 'celN = kidPose( celN, position, 0.0 );' : ''));
    if (pose) sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed = kidPose( transformed, position, 1.0 );');
    sh.fragmentShader = head + sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + CEL_PARS_F)
      .replace('#include <opaque_fragment>', CEL_MAIN_F + '#include <opaque_fragment>');
  };
  const key = 'cel' + (info.glow ? 'G' : '') + (info.corrupt || 0) + (pose ? 'P' : '');
  m.customProgramCacheKey = () => key;
  celCache.set(src, m);
  return m;
}


function wants(src) {
  if (!src || !LIT.has(src.type) || src.userData.look === false) return false;
  return !src.userData.uFmlRim || !!src.userData.look;
}


function makeHull({ attr = false, pose = null, see = null } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...celUniforms, uHullW: { value: R.HULL }, uInk: { value: INK }, ...(pose ? pose.uniforms : {}) },
    vertexShader: hullVertex(pose ? { pars: pose.glsl, p: 'p = kidPose( p, position, 1.0 );', n: 'n = kidPose( n, position, 0.0 );' } : undefined),
    fragmentShader: HULL_FRAG, side: THREE.BackSide, defines: attr ? { HULL_ATTR: 1 } : {},
  });
  m.name = 'cel-hull';
  if (see) patchSeeThrough(m, { actor: see === 'actor' });
  return m;
}
const hulls = new Map(), poseHulls = new WeakMap();
function hullMat(attr, see, pose) {
  if (pose) { 
    let h = poseHulls.get(pose);
    if (!h) poseHulls.set(pose, h = {});
    return h[see || '-'] ||= makeHull({ pose, see });
  }
  const k = (attr ? 'a' : 'm') + (see || '-');
  if (!hulls.has(k)) hulls.set(k, makeHull({ attr, see }));
  return hulls.get(k);
}


function decorate(mesh, see) {
  let h = mesh.userData.celHull;
  if (h === undefined) {
    const info = mesh.material.userData.look || {};
    if (mesh.isInstancedMesh || info.glow || info.hull === false) { mesh.userData.celHull = null; return; }
    const kind = mesh.material.userData.seeThrough ? (see ? 'scenery' : 'actor') : see ? 'scenery' : null;
    h = new THREE.Mesh(mesh.geometry, hullMat(false, kind, mesh.material.userData.pose));
    h.userData.hull = true; h.raycast = () => {}; h.castShadow = h.receiveShadow = false;
    mesh.add(h); mesh.userData.celHull = h;
  }
  if (!h) return;
  if (h.geometry !== mesh.geometry) h.geometry = mesh.geometry;
  h.visible = mesh.visible;
}



function decorateBatch(group, see) {
  const a = group.userData.hullArrays;
  if (!a) return;
  if (ACTIVE.phone) { 
    const keep = [];
    for (let t = 0; t < a.idx.length; t += 3) if (R.keepHull(a.hw[a.idx[t]], true)) keep.push(a.idx[t], a.idx[t + 1], a.idx[t + 2]);
    a.idx = Uint32Array.from(keep);
  }
  if (!a.idx.length) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(a.pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(a.nor, 3, true));
  geo.setAttribute('hw', new THREE.BufferAttribute(a.hw, 1));
  geo.setIndex(new THREE.BufferAttribute(a.idx, 1));
  geo.computeBoundingSphere();
  delete group.userData.hullArrays; 
  const h = new THREE.Mesh(geo, hullMat(true, see ? 'scenery' : null));
  h.name = group.name + ':hull'; h.userData.hull = true; h.raycast = () => {}; h.castShadow = h.receiveShadow = false;
  group.add(h);
}


function sizeUniforms(w, h, boost = 1) {
  const k = R.pxScale(h) * boost;
  celUniforms.uCelRes.value.set(w, h);
  celUniforms.uCelPx.value = k;
  celUniforms.uCelCell.value = Math.max(3, R.HALFTONE_CELL * k);
}
let ACTIVE = null;
export function activeLook() { return ACTIVE; }

export function celLook({ phone = false } = {}) {
  if (ACTIVE) return ACTIVE;
  ACTIVE = {
    name: 'cel', phone,
    post: { toneMapping: THREE.NoToneMapping, dither: 0, pixelHeight: R.PIXEL_HEIGHT },
    material: (src) => (wants(src) ? celFrom(src) : null),
    decorate, decorateBatch,
    beforeRender(stage) {
      const t = stage.pixel && stage.pixel.enabled ? stage.pixel.target : null;
      if (t) sizeUniforms(t.width, t.height);
      else { const b = stage.renderer.getDrawingBufferSize(new THREE.Vector2()); sizeUniforms(b.x, b.y); }
    },
    
    portrait(mesh) {
      const m = ACTIVE.material(mesh.material);
      if (m) { mesh.material = m; decorate(mesh, false); }
    },
    
    
    portraitSize(px) {
      const line = Math.max(0.8, px / 80);
      celUniforms.uCelRes.value.set(px, px);
      celUniforms.uCelPx.value = line / R.HULL;
      celUniforms.uCelCell.value = Math.max(3, px / 28);
    },
    
    
    
    prewarm(stage, materials = []) {
      const { renderer, scene, camera, pixel } = stage;
      applyLook(scene, ACTIVE);
      const tmp = new THREE.Scene(), geo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
      geo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(geo.attributes.position.count * 3).fill(1), 3));
      for (const src of materials) {
        for (const see of [false, true]) {
          const mesh = new THREE.Mesh(geo, src); mesh.userData.seeThrough = see;
          const g = new THREE.Group(); g.add(mesh); tmp.add(g);
        }
      }
      applyLook(tmp, ACTIVE);
      for (const see of [null, 'actor', 'scenery']) tmp.add(new THREE.Mesh(geo, hullMat(false, see)));
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(pixel && pixel.enabled ? pixel.target : null);
      renderer.compile(scene, camera);
      renderer.compile(tmp, camera, scene);
      renderer.setRenderTarget(prev);
      return renderer.info.programs.length;
    },
  };
  return ACTIVE;
}
