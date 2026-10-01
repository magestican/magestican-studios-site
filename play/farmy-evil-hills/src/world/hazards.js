







import * as THREE from 'three';
import { HALL_H, hash2 } from '../constants.js';















export const GAS_PER_LEAK = 46;

export function makeLeak(x, y, z, dir) {
  const pos = new Float32Array(GAS_PER_LEAK * 3);
  const life = new Float32Array(GAS_PER_LEAK);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    
    
    
    color: 0x6d7a72, size: 0.15, sizeAttenuation: true,
    transparent: true, opacity: 0.16, depthWrite: false,
  }));
  pts.frustumCulled = false;
  for (let i = 0; i < GAS_PER_LEAK; i += 1) life[i] = Math.random();
  return {
    points: pts,
    step(dt) {
      for (let i = 0; i < GAS_PER_LEAK; i += 1) {
        life[i] += dt * 0.42;
        if (life[i] > 1) life[i] -= 1;
        const t = life[i];
        
        const travel = (2.6 / 3.1) * (1 - Math.exp(-3.1 * t));
        const spread = t * t * 0.55;
        const seed = i * 12.9898;
        pos[i * 3] = x + dir[0] * travel + (hash2(seed, 1.1) - 0.5) * spread;
        pos[i * 3 + 1] = y + dir[1] * travel + t * 0.62 + (hash2(seed, 2.2) - 0.5) * spread;
        pos[i * 3 + 2] = z + dir[2] * travel + (hash2(seed, 3.3) - 0.5) * spread;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}













export let SPARK_SPRITE = null;

export function sparkSprite() {
  if (SPARK_SPRITE) return SPARK_SPRITE;
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(214,232,255,0.75)');
  grad.addColorStop(1, 'rgba(140,180,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 16);
  SPARK_SPRITE = new THREE.CanvasTexture(c);
  return SPARK_SPRITE;
}

export function makeWire(x, z, len, seed) {
  const N = 7;
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  
  
  
  
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x3a332b }));
  line.frustumCulled = false;
  return {
    line,
    tip: [x, HALL_H - len, z],
    step(t) {
      const sway = Math.sin(t * 0.6 + seed) * 0.16;
      for (let i = 0; i < N; i += 1) {
        const f = i / (N - 1);
        
        pos[i * 3] = x + sway * f * f;
        pos[i * 3 + 1] = HALL_H - len * f - Math.sin(f * Math.PI) * 0.10;
        pos[i * 3 + 2] = z + Math.cos(t * 0.5 + seed) * 0.06 * f * f;
      }
      this.tip[0] = pos[(N - 1) * 3];
      this.tip[1] = pos[(N - 1) * 3 + 1];
      this.tip[2] = pos[(N - 1) * 3 + 2];
      geo.attributes.position.needsUpdate = true;
    },
  };
}
