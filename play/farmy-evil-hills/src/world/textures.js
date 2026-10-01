








import * as THREE from 'three';
import { KEY_DIR, FILL_DIR } from '../../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../../shared/ps1Render/ps1Material.js';
import { hash2 } from '../constants.js';
import { lookShaders, lookUniforms, registerLookMaterial } from '../render/materials.js';




export { bindSheet } from '../render/textures.js';























export const TEX = 128;

export function grimeTexture({ base, seams, rivets, mud, blood, hay }) {
  const cv = document.createElement('canvas');
  cv.width = TEX; cv.height = TEX;
  const g = cv.getContext('2d');
  const img = g.createImageData(TEX, TEX);
  const b = new THREE.Color(base);

  
  for (let y = 0; y < TEX; y += 1) {
    for (let x = 0; x < TEX; x += 1) {
      const i = (y * TEX + x) * 4;
      const k = 0.84 + hash2(x * 0.9, y * 0.9) * 0.17 + hash2(x * 0.23, y * 0.21) * 0.13;
      img.data[i] = Math.min(255, b.r * 255 * k);
      img.data[i + 1] = Math.min(255, b.g * 255 * k);
      img.data[i + 2] = Math.min(255, b.b * 255 * k);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  if (seams) {
    g.strokeStyle = 'rgba(0,0,0,0.42)';
    g.lineWidth = 1;
    for (const at of [0, TEX / 2]) {
      g.beginPath(); g.moveTo(0, at + 0.5); g.lineTo(TEX, at + 0.5); g.stroke();
      g.beginPath(); g.moveTo(at + 0.5, 0); g.lineTo(at + 0.5, TEX); g.stroke();
    }
  }
  if (rivets) {
    g.fillStyle = 'rgba(0,0,0,0.34)';
    for (let i = 0; i < 24; i += 1) {
      g.fillRect(Math.floor(hash2(i * 3.1, 1.7) * TEX), Math.floor(hash2(i * 1.3, 9.2) * TEX), 2, 2);
    }
  }

  
  
  
  const blob = (cx, cy, r, fill, drips) => {
    g.fillStyle = fill;
    g.beginPath();
    for (let a = 0; a <= 22; a += 1) {
      const th = (a / 22) * Math.PI * 2;
      const rr = r * (0.5 + hash2(cx + Math.cos(th) * 9, cy + Math.sin(th) * 9) * 0.85);
      const x = cx + Math.cos(th) * rr; const y = cy + Math.sin(th) * rr;
      if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    if (drips) {
      for (let d = 0; d < 3; d += 1) {
        const dx = cx + (hash2(cx + d, cy) - 0.5) * r * 1.5;
        g.fillRect(Math.round(dx), Math.round(cy), 1, Math.round(r * (0.8 + hash2(cx, cy + d) * 2.4)));
      }
    }
  };
  for (let i = 0; i < mud; i += 1) {
    blob(hash2(i * 5.1, 2.3) * TEX, hash2(i * 2.7, 8.1) * TEX, 4 + hash2(i, 3) * 10,
      'rgba(84,62,33,0.5)', false);
  }
  for (let i = 0; i < blood; i += 1) {
    blob(hash2(i * 7.7, 4.9) * TEX, hash2(i * 3.3, 1.1) * TEX, 3 + hash2(i, 7) * 6,
      'rgba(66,17,17,0.6)', true);
  }
  g.fillStyle = 'rgba(206,182,96,0.7)';
  for (let i = 0; i < hay; i += 1) {
    g.save();
    g.translate(hash2(i * 9.1, 6.4) * TEX, hash2(i * 4.2, 3.8) * TEX);
    g.rotate(hash2(i, 1.4) * Math.PI);
    g.fillRect(0, 0, 4 + hash2(i, 2) * 5, 1);
    g.restore();
  }

  const t = new THREE.CanvasTexture(cv);
  
  
  
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}











export const FLASH_MATS = [];








export function texturedMaterial(map, { side = THREE.FrontSide } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
      uKey: { value: new THREE.Vector3(...KEY_DIR) },
      uFill: { value: new THREE.Vector3(...FILL_DIR) },
      uAlpha: { value: 1 },
      uMap: { value: map },
      uDim: { value: 0.30 },
      uFlashPos: { value: new THREE.Vector3(0, 1.2, 0) },
      uFlash: { value: 0 },
      ...lookUniforms(),
    },
    ...lookShaders('textured'),
    fog: false, lights: false, toneMapped: false, side,
  });
  FLASH_MATS.push(m);
  registerLookMaterial(m);
  return m;
}












export function panel(w, h, tile, place) {
  const sw = Math.max(1, Math.round(w / 2.5));
  const sh = Math.max(1, Math.round(h / 2.5));
  const g = new THREE.PlaneGeometry(w, h, sw, sh);
  const n = g.attributes.position.count;
  const uv = g.attributes.uv.array;
  for (let i = 0; i < n; i += 1) {
    uv[i * 2] *= w / tile;
    uv[i * 2 + 1] *= h / tile;
  }
  
  
  
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const m = new THREE.Mesh(g, place.mat);
  place.apply(m);
  return m;
}
