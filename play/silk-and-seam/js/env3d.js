





import * as THREE from './vendor/three.module.min.js';
import { MOODS } from './gfxrules.js';
import { onRestore, currentTier } from './gfx.js';



export function roomCanvas(mood = 'day') {
  const e = (MOODS[mood] || MOODS.day).env, W = 512, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, e.wall); g.addColorStop(0.55, e.wall); g.addColorStop(0.62, e.floor); g.addColorStop(1, e.floor);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(60,40,24,0.35)';                              
  for (let i = 0; i < 8; i++) x.fillRect(i * 64 + 20, 0, 14, 34);
  x.fillStyle = e.sky;                                                
  x.fillRect(W * 0.43, H * 0.14, W * 0.14, H * 0.4);
  x.fillStyle = 'rgba(70,50,30,0.8)';                                 
  x.fillRect(W * 0.498, H * 0.14, 3, H * 0.4); x.fillRect(W * 0.43, H * 0.33, W * 0.14, 3);
  if (e.lampOn > 0) {                                                 
    for (const u of [0.18, 0.82]) {
      const r = x.createRadialGradient(u * W, H * 0.36, 1, u * W, H * 0.36, 26);
      r.addColorStop(0, e.lamp); r.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = e.lampOn; x.fillStyle = r; x.fillRect(u * W - 30, H * 0.36 - 30, 60, 60); x.globalAlpha = 1;
    }
  }
  return cv;
}

const cache = new WeakMap();      
let hooked = false;
export function envMap(R, mood = 'day') {
  if (!hooked) { hooked = true; onRestore((r) => { const c = cache.get(r); if (c) Object.values(c).forEach((t) => t.dispose()); cache.delete(r); }); }
  let c = cache.get(R);
  if (!c) { c = {}; cache.set(R, c); }
  if (c[mood]) return c[mood];
  const tex = new THREE.CanvasTexture(roomCanvas(mood));
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(R);
  c[mood] = pm.fromEquirectangular(tex).texture;
  pm.dispose(); tex.dispose();
  return c[mood];
}



export function lightRig(mood = 'day') {
  const m = MOODS[mood] || MOODS.day, g = new THREE.Group();
  g.name = `rig-${mood}`;
  const hemi = new THREE.HemisphereLight(m.hemi[0], m.hemi[1], m.hemi[2]);
  const key = new THREE.DirectionalLight(m.key[0], m.key[1]);
  key.position.set(-120, 260, 220); key.castShadow = true;
  key.shadow.radius = 6; key.shadow.bias = -0.0008; key.shadow.normalBias = 1.2;
  Object.assign(key.shadow.camera, { left: -120, right: 120, top: 260, bottom: -10, near: 10, far: 800 });
  const rim = new THREE.DirectionalLight(m.rim[0], m.rim[1]);
  rim.position.set(160, 200, -200);
  g.add(hemi, key, rim);
  return g;
}




export function lightScene(R, scene, mood = 'day') {
  const old = scene.getObjectByName(`rig-${scene.userData.mood}`);
  if (old) scene.remove(old);
  scene.add(lightRig(mood));
  scene.environment = currentTier() === 'low' ? null : envMap(R, mood);
  scene.environmentIntensity = (MOODS[mood] || MOODS.day).env.intensity;
  scene.userData.mood = mood;
}
