










import * as THREE from 'three';
import { makeCozy, curveUniforms } from '../../vendor/fml/render/material.js';
import { createDaylight } from '../../vendor/fml/render/daylight.js';
import { dayCycle } from '../../vendor/fml/moon/light/dayCycle.js';
import { patchSeeThrough } from './seeThrough.js';



curveUniforms.uCurve.value = 0;






const KEY_FROM = Math.atan2(6, -16);








export function createCozyLight(scene, renderer, { hours = 10.5, shadows = true, shadowExtent = 13, fogScale = 0, exposure = 1.2 } = {}) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const day = createDaylight(scene, { shadowMapSize: 2048, shadowRadius: 3 }, { shadowExtent });
  day.key.castShadow = shadows;
  day.fogScale = fogScale;
  let cycle = dayCycle(hours);
  const focus = new THREE.Vector3();
  return {
    day,
    get cycle() { return cycle; },
    setHours(h) { cycle = dayCycle(h); },
    
    apply(x, y, z) {
      focus.set(x, y, z);
      day.apply(cycle, focus, renderer);
      renderer.toneMappingExposure = cycle.exposure * exposure;
      const [dx, dy, dz] = cycle.keyDirection, flat = Math.hypot(dx, dz);
      day.key.position.set(x + Math.cos(KEY_FROM) * flat * 60, y + dy * 60, z + Math.sin(KEY_FROM) * flat * 60);
    },
    
    horizon() { return new THREE.Color().setRGB(...cycle.skyHorizon, THREE.LinearSRGBColorSpace); },
  };
}

const LIT = new Set(['MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial']);
const swapped = new WeakMap();

function cozyFrom(src, rim) {
  if (swapped.has(src)) return swapped.get(src);
  const m = new THREE.MeshStandardMaterial({
    color: src.color, map: src.map, vertexColors: src.vertexColors,
    emissive: src.emissive || 0x000000, emissiveIntensity: src.emissiveIntensity ?? 1,
    roughness: 0.92, metalness: 0,
    transparent: src.transparent, opacity: src.opacity, alphaTest: src.alphaTest,
    side: src.side, flatShading: src.flatShading,
  });
  if (m.map) pixelTexture(m.map);
  makeCozy(m, { rim, key: 'dachi' });
  swapped.set(src, m); swappedSeeSrc.set(m, src);
  return m;
}




const swappedSee = new WeakMap();
function cozySee(src, rim) {
  if (swappedSee.has(src)) return swappedSee.get(src);
  const base = cozyFrom(src, rim), m = base.clone();
  m.userData = { ...base.userData }; m.defaultAttributeValues = base.defaultAttributeValues;
  m.onBeforeCompile = base.onBeforeCompile; m.customProgramCacheKey = base.customProgramCacheKey;
  patchSeeThrough(m);
  swappedSee.set(src, m);
  return m;
}
export function cozify(root, { rim = 0.18 } = {}) {
  const walk = (o, see) => {
    see = see || !!o.userData.seeThrough;
    if (o.isMesh && !o.userData.keepMaterial) {
      const swap = (m) => {
        if (m.userData.seeThrough) return m;
        const src = swappedSeeSrc.get(m) || m, lit = LIT.has(src.type) && !src.userData.uFmlRim;
        return lit ? (see ? cozySee(src, rim) : cozyFrom(src, rim)) : m;
      };
      if (Array.isArray(o.material)) o.material = o.material.map(swap);
      else if (o.material) o.material = swap(o.material);
    }
    for (const c of o.children) walk(c, see);
  };
  walk(root, false);
  return root;
}


const swappedSeeSrc = new WeakMap();

export function pixelTexture(tex) {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = 1;
  tex.needsUpdate = true;
  return tex;
}
