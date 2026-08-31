














import * as THREE from 'three';
import {
  ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR,
} from '../../../web-engine/ps1/ps1Shader.mjs';














export const PS1_SNAP = Object.freeze({ x: 320, y: 240 });









export function createPs1Uniforms({ snap = PS1_SNAP, key = KEY_DIR, fill = FILL_DIR } = {}) {
  return {
    uRes: { value: new THREE.Vector2(snap.x, snap.y) },
    uKey: { value: new THREE.Vector3(...key) },
    uFill: { value: new THREE.Vector3(...fill) },
  };
}












export function createPs1Material({ kind = 'colour', uniforms, alpha = 1, map = null, transparent = false } = {}) {
  const make = FRAGMENT[kind];
  if (!make) throw new Error(`unknown PS1 material kind: ${kind}`);

  const u = {
    ...uniforms,
    uAlpha: { value: alpha },
  };
  if (kind === 'textured') {
    if (!map) throw new Error('the textured PS1 material needs a map');
    u.uMap = { value: map };
  }

  return new THREE.RawShaderMaterial === undefined
    
    
    
    ? (() => { throw new Error('three.js is missing ShaderMaterial'); })()
    : new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: ps1Vertex(),
      fragmentShader: make(),
      transparent,
      
      
      
      fog: false,
      lights: false,
      toneMapped: false,
    });
}










export function configurePs1Renderer(renderer) {
  
  
  renderer.setPixelRatio(1);
  
  
  
  
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  if ('toneMapping' in renderer) renderer.toneMapping = THREE.NoToneMapping;
  return renderer;
}
