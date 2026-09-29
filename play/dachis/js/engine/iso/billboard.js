


import * as THREE from 'three';

const TEX = new Map();
export function textureFor(key, paint) {
  let t = TEX.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(paint());
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    TEX.set(key, t);
  }
  return t;
}

let shadowTex = null;
function blobTexture() {
  if (shadowTex) return shadowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const ctx = cv.getContext('2d'), g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(10,20,30,0.55)'); g.addColorStop(1, 'rgba(10,20,30,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  shadowTex = new THREE.CanvasTexture(cv);
  return shadowTex;
}

export class Billboard {
  
  constructor(scene, { size = 1.2, shadow = 0.5, anchorY = 0.07 } = {}) {
    this.mat = new THREE.SpriteMaterial({ alphaTest: 0.35, transparent: false, depthWrite: true });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.center.set(0.5, anchorY);
    this.size = size; this.sprite.scale.set(size, size, 1);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.scale.set(shadow * 2, shadow * 2, 1);
    this.shadow.renderOrder = 3;
    scene.add(this.sprite, this.shadow);
    this.key = null;
  }
  setTexture(key, paint) {
    if (key === this.key) return;
    this.key = key; this.mat.map = textureFor(key, paint); this.mat.needsUpdate = true;
  }
  place(x, y, ground, lift = 0) {
    this.sprite.position.set(x, ground + lift, y);
    this.shadow.position.set(x, ground + 0.03, y);
  }
  setSize(s) { this.size = s; this.sprite.scale.set(s, s, 1); }
  setVisible(v) { this.sprite.visible = v; this.shadow.visible = v; }
  setTint(hex) { this.mat.color.set(hex); }
  dispose(scene) { scene.remove(this.sprite, this.shadow); this.mat.dispose(); }
}
