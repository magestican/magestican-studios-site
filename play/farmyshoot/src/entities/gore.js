

















import * as THREE from 'three';
import { debrisFor } from '../../../../web-engine/combat/impactDebris.js';

export class GoreSystem {
  constructor(scene) {
    this.scene = scene;
    this._active = [];   
    
    
    
    
    
    
    
    
    
    
    
    
    this._cache = new Map();
  }

  _kit(kind) {
    let k = this._cache.get(kind);
    if (!k) {
      const spec = debrisFor(kind);
      k = {
        spec,
        geo: new THREE.BoxGeometry(spec.size, spec.size, spec.size),
        mat: new THREE.MeshBasicMaterial({ color: spec.color }),
      };
      this._cache.set(kind, k);
    }
    return k;
  }

  
  
  
  
  spatterAt(worldPos, awayDir = null, kind = 'flesh') {
    const { spec, geo, mat } = this._kit(kind);
    const nowSec = performance.now() / 1000;
    const base = awayDir || new THREE.Vector3(0, 1, 0);
    const [upMin, upMax] = spec.up;
    for (let i = 0; i < spec.count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(worldPos);
      const vel = new THREE.Vector3(
        base.x * spec.away + (Math.random() - 0.5) * spec.spread,
        upMin + Math.random() * (upMax - upMin),
        base.z * spec.away + (Math.random() - 0.5) * spec.spread,
      );
      this.scene.add(m);
      this._active.push({ mesh: m, vel, bornAt: nowSec, life: spec.lifetime });
    }
  }

  update(dt) {
    const nowSec = performance.now() / 1000;
    this._active = this._active.filter((p) => {
      const t = nowSec - p.bornAt;
      if (t >= p.life) { this.scene.remove(p.mesh); return false; }
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      
      
      
      const k = 1 - t / p.life;
      p.mesh.scale.setScalar(k * k);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.z += dt * 5;
      return true;
    });
  }
}
