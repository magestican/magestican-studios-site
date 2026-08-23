


import * as THREE from 'three';

const SPATTER_COUNT = 14;
const LIFETIME = 1.0;

export class GoreSystem {
  constructor(scene) {
    this.scene = scene;
    this._active = [];   
    this._geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this._mat = new THREE.MeshBasicMaterial({ color: 0xb0100e, transparent: true, opacity: 0.95 });
  }

  spatterAt(worldPos, awayDir = null) {
    const nowSec = performance.now() / 1000;
    const base = awayDir || new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < SPATTER_COUNT; i++) {
      const m = new THREE.Mesh(this._geo, this._mat.clone());
      m.position.copy(worldPos);
      const spread = 4;
      const vel = new THREE.Vector3(
        base.x * 2 + (Math.random() - 0.5) * spread,
        1.5 + Math.random() * 3.0,
        base.z * 2 + (Math.random() - 0.5) * spread,
      );
      this.scene.add(m);
      this._active.push({ mesh: m, vel, bornAt: nowSec });
    }
  }

  update(dt) {
    const nowSec = performance.now() / 1000;
    this._active = this._active.filter((p) => {
      const t = nowSec - p.bornAt;
      if (t >= LIFETIME) { this.scene.remove(p.mesh); return false; }
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = 0.95 * (1 - t / LIFETIME);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.z += dt * 5;
      return true;
    });
  }
}
