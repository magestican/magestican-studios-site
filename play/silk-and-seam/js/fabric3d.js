







import * as THREE from './vendor/three.module.min.js';
import { fabricSpec, MAP_SIZE } from './fabrics.js';

const texCache = new Map();     
const matCache = new Map();     

function dataTex(bytes, size, tile, srgb, R) {
  const t = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tile[0], 1 / tile[1]);
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.anisotropy = Math.min(8, R?.capabilities?.getMaxAnisotropy?.() || 1);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
function textures(maps, R) {
  const k = `${maps.id}|${maps.hash}|${maps.size}`;
  if (!texCache.has(k)) {
    const { size, tile } = maps;
    texCache.set(k, {
      albedo: dataTex(maps.albedo, size, tile, true, R), normal: dataTex(maps.normal, size, tile, false, R),
      orm: dataTex(maps.orm, size, tile, false, R), aniso: maps.aniso ? dataTex(maps.aniso, size, tile, false, R) : null,
    });
    if (texCache.size > 12) { const [k0, t0] = texCache.entries().next().value; Object.values(t0).forEach((t) => t?.dispose()); texCache.delete(k0); }
  }
  return texCache.get(k);
}


function patch(mat, spec) {
  const m = spec.material, back = spec.back;
  const flags = `${m.shot ? 's' : ''}${m.velvet ? 'v' : ''}`;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.fabDye = { value: new THREE.Color().setRGB(...spec.tint, THREE.SRGBColorSpace) };
    sh.uniforms.fabPale = { value: back.pale };
    sh.uniforms.fabPrint = { value: back.print };
    sh.uniforms.fabShot = { value: new THREE.Color().setRGB(...(m.shot || spec.tint), THREE.SRGBColorSpace) };
    sh.uniforms.fabVelvet = { value: m.velvet };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 fabDye; uniform vec3 fabShot; uniform float fabPale; uniform float fabPrint; uniform float fabVelvet;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        float fr = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        ${m.shot ? 'diffuseColor.rgb = mix(diffuseColor.rgb, fabShot, 0.7 * pow(fr, 1.4));' : ''}
        ${m.velvet ? 'diffuseColor.rgb *= mix(1.0 - fabVelvet, 1.0 + 0.4 * fabVelvet, pow(fr, 1.8));' : ''}
        if (faceDirection < 0.0) {
          diffuseColor.rgb = mix(diffuseColor.rgb, fabDye, fabPrint);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.333))) + 0.12, fabPale);
        }
      }`);
  };
  mat.customProgramCacheKey = () => `fab-${flags}`;
  return mat;
}


export function flatMaterial(spec, tier = 'low') {
  const m = spec.material, color = new THREE.Color().setRGB(...spec.tint, THREE.SRGBColorSpace);
  const base = { color, roughness: m.roughness, metalness: m.metalness * 0.6, vertexColors: true, side: THREE.DoubleSide, transparent: m.opacity < 1, opacity: m.opacity, depthWrite: m.opacity >= 1 };
  const mat = tier === 'low' ? new THREE.MeshStandardMaterial(base) : new THREE.MeshPhysicalMaterial({ ...base, sheen: m.sheen, sheenRoughness: m.sheenRoughness, sheenColor: new THREE.Color().setRGB(...m.sheenColor, THREE.SRGBColorSpace) });
  return patch(mat, spec);
}


export function fabricMaterial(spec, maps, tier = 'low', R = null) {
  const k = `${spec.id}|${spec.hex}|${maps.size}|${tier}`;
  if (matCache.has(k)) return matCache.get(k);
  const m = spec.material, t = textures(maps, R);
  const sheer = m.opacity < 1, cut = m.alphaTest > 0, trans = tier === 'high' && m.transmission > 0;
  const base = {
    map: t.albedo, normalMap: t.normal, normalScale: new THREE.Vector2(m.bump, m.bump), roughnessMap: t.orm, roughness: 1,
    metalnessMap: m.metalness ? t.orm : null, metalness: m.metalness, vertexColors: true, side: THREE.DoubleSide,
    transparent: sheer && !trans, opacity: trans ? 1 : m.opacity, alphaTest: cut ? m.alphaTest : 0, depthWrite: !sheer || trans,
  };
  let mat;
  if (tier === 'low') mat = new THREE.MeshStandardMaterial(base);
  else {
    mat = new THREE.MeshPhysicalMaterial({
      ...base, sheen: m.sheen, sheenRoughness: m.sheenRoughness, sheenColor: new THREE.Color().setRGB(...m.sheenColor, THREE.SRGBColorSpace),
      anisotropy: m.anisotropy, anisotropyMap: t.aniso, iridescence: m.iridescence, iridescenceIOR: 1.4,
      transmission: trans ? m.transmission : 0, thickness: trans ? 0.05 : 0,
    });
  }
  patch(mat, spec);
  matCache.set(k, mat);
  if (matCache.size > 16) { const [k0, m0] = matCache.entries().next().value; m0.dispose(); matCache.delete(k0); }
  return mat;
}


export const specsOf = (design) => ({ 1: fabricSpec(design.fab1 || 'cotton', design.dye1 || 'ivory'), 2: fabricSpec(design.fab2 || design.fab1 || 'cotton', design.dye2 || design.dye1 || 'ivory') });
export const mapSize = (tier) => MAP_SIZE[tier] || MAP_SIZE.low;
