



import * as THREE from 'three';

const LIFE_SEC = 0.20;

export class TracerSystem {
  constructor(scene) {
    this.scene = scene;
    this._active = [];   
  }

  addHitscan(origin, dir, maxDist = 50, color = 0xf4c95d) {
    const geom = new THREE.BufferGeometry();
    const end = origin.clone().addScaledVector(dir, maxDist);
    const pts = new Float32Array([
      origin.x, origin.y, origin.z,
      end.x,    end.y,    end.z,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);
    this._active.push({ line, mat, bornAt: performance.now() / 1000 });
  }

  update(dt, nowSec) {
    this._active = this._active.filter((x) => {
      const age = nowSec - x.bornAt;
      if (age >= LIFE_SEC) { this.scene.remove(x.line); return false; }
      x.mat.opacity = 0.9 * (1 - age / LIFE_SEC);
      return true;
    });
  }
}
