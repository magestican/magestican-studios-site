


































import * as THREE from 'three';
import { applyBend, bentDepthMaterial } from './material.js';
import { PALETTE } from 'moon/palette/seasons.mjs';


export const SILHOUETTE_COLOR = PALETTE.spring.blossom[1];
export const SILHOUETTE_OPACITY = 0.55;
export const SILHOUETTE_ORDER = 1;
export const BODY_ORDER = 2;

export function silhouetteMaterial() {
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(SILHOUETTE_COLOR),
    opacity: SILHOUETTE_OPACITY,
    transparent: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthTest: true,
    depthFunc: THREE.GreaterDepth,
    depthWrite: false,
    colorWrite: false,
    fog: false,
  });
  
  
  return applyBend(m);
}


export function mergedSilhouette(body, material) {
  const parts = body.children.filter((c) => c.isSkinnedMesh);
  if (!parts.length) return null;
  let verts = 0, idx = 0;
  for (const p of parts) {
    verts += p.geometry.attributes.position.count;
    idx += p.geometry.index.count;
  }
  const position = new Float32Array(verts * 3);
  const skinIndex = new Uint16Array(verts * 4);
  const skinWeight = new Float32Array(verts * 4);
  const index = new Uint32Array(idx);
  let v = 0, i = 0;
  for (const p of parts) {
    const g = p.geometry;
    position.set(g.attributes.position.array, v * 3);
    skinIndex.set(g.attributes.skinIndex.array, v * 4);
    skinWeight.set(g.attributes.skinWeight.array, v * 4);
    const src = g.index.array;
    for (let k = 0; k < src.length; k++) index[i + k] = src[k] + v;
    v += g.attributes.position.count;
    i += src.length;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.bind(parts[0].skeleton, new THREE.Matrix4());
  mesh.name = `${body.name || 'body'}/silhouette`;
  
  mesh.castShadow = parts.some((p) => p.castShadow);
  mesh.customDepthMaterial = bentDepthMaterial();
  mesh.receiveShadow = false;
  mesh.frustumCulled = false; 
  mesh.renderOrder = SILHOUETTE_ORDER;
  return mesh;
}






export function createSilhouette({ shadow = true } = {}) {
  const material = silhouetteMaterial();
  let body = null, mesh = null;
  const api = {
    get visible() { return Boolean(mesh && material.colorWrite); },
    get mesh() { return mesh; },
    
    update(object, on) {
      if (object !== body) {
        if (mesh) {
          
          if (shadow) for (const c of body.children) if (c.isSkinnedMesh && c !== mesh) c.castShadow = mesh.castShadow;
          mesh.parent?.remove(mesh);
          mesh.geometry.dispose();
          mesh = null;
        }
        body = object;
        if (body) {
          mesh = mergedSilhouette(body, material);
          if (mesh && !shadow) mesh.castShadow = false;
          for (const c of body.children) {
            if (!c.isSkinnedMesh || c === mesh) continue;
            c.renderOrder = BODY_ORDER;
            if (shadow) c.castShadow = false;
          }
          if (mesh) body.add(mesh);
        }
      }
      if (!mesh) return;
      
      
      
      if (on && !material.colorWrite) body.traverse((o) => { if (o.isMesh && o !== mesh) o.renderOrder = BODY_ORDER; });
      material.colorWrite = Boolean(on);
    },
    dispose() {
      api.update(null, false);
      material.dispose();
    },
  };
  return api;
}
