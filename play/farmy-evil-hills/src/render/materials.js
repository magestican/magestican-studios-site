


















import * as THREE from 'three';
import { lookVertex, lookFragment, lookModeUniforms, FOG } from '../../../../web-engine/horror/lookShader.mjs';


export const LOOK_MATS = [];


export function lookUniforms() {
  return {
    uFogNear: { value: FOG.near },
    uFogFar: { value: FOG.far },
    uPrelit: { value: 1 },
    uLocal: { value: new THREE.Vector3(1, 1, 1) },
  };
}


export function lookShaders(kind) {
  return { vertexShader: lookVertex(), fragmentShader: lookFragment(kind) };
}

export function registerLookMaterial(m) {
  LOOK_MATS.push(m);
  return m;
}

let currentMode = null;
let currentFog = { near: FOG.near, far: FOG.far };





export function setLookMode(mode) {
  if (mode === currentMode) return false;
  currentMode = mode;
  const u = lookModeUniforms(mode, currentFog);
  for (const m of LOOK_MATS) {
    const U = m.uniforms;
    if (!U || !U.uFogNear) continue;
    U.uFogNear.value = u.uFogNear;
    U.uFogFar.value = u.uFogFar;
    U.uPrelit.value = u.uPrelit;
    if (U.uDim) U.uDim.value = u.uDim;
  }
  return true;
}


export function setFog(near, far) {
  currentFog = { near, far };
  if (currentMode === 'game') { currentMode = null; setLookMode('game'); }
  return currentFog;
}

export function lookState() {
  return { mode: currentMode, fogNear: currentFog.near, fogFar: currentFog.far, materials: LOOK_MATS.length };
}






export function litMover(mesh, sample) {
  const white = new THREE.Vector3(1, 1, 1);
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
    const u = material.uniforms && material.uniforms.uLocal;
    if (!u) return;
    sample(u.value, mesh);
    material.uniformsNeedUpdate = true;
  };
  mesh.onAfterRender = (renderer, scene, camera, geometry, material) => {
    const u = material.uniforms && material.uniforms.uLocal;
    if (!u) return;
    u.value.copy(white);
    material.uniformsNeedUpdate = true;
  };
  return mesh;
}
