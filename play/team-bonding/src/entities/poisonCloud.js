
















import * as THREE from 'three';
import { POISON } from './poisonSpec.js';



function puff(radius, colour, opacity) {
  const geo = new THREE.IcosahedronGeometry(radius, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: colour, transparent: true, opacity,
    depthWrite: false,          
                                
                                
  });
  return new THREE.Mesh(geo, mat);
}

export class PoisonCloud {
  
  
  
  
  constructor(anchor) {
    this.group = new THREE.Group();
    this.group.userData.poisonCloud = true;
    this.puffs = [];
    for (let i = 0; i < POISON.puffCount; i++) {
      const t = i / POISON.puffCount;
      const m = puff(
        POISON.puffRadius * (0.7 + 0.6 * ((i * 7) % 5) / 5),
        i % 2 ? POISON.colourLight : POISON.colourDark,
        POISON.opacity,
      );
      
      const a = t * Math.PI * 2;
      m.position.set(Math.cos(a) * POISON.spread, POISON.height + (i % 3) * 0.12,
                     Math.sin(a) * POISON.spread);
      m.userData.phase = t * Math.PI * 2;
      this.group.add(m);
      this.puffs.push(m);
    }
    this.group.visible = false;
    anchor.add(this.group);
    this._until = 0;
  }

  
  
  
  poke(nowMs) { this._until = nowMs + POISON.holdMs; }

  update(nowMs, dt) {
    const on = nowMs < this._until;
    this.group.visible = on;
    if (!on) return;
    
    const t = nowMs / 1000;
    for (const m of this.puffs) {
      m.position.y = POISON.height + Math.sin(t * POISON.bobHz + m.userData.phase) * POISON.bob;
      m.rotation.y += dt * POISON.spinRate;
    }
    
    const left = this._until - nowMs;
    const k = left < POISON.fadeMs ? left / POISON.fadeMs : 1;
    for (const m of this.puffs) m.material.opacity = POISON.opacity * k;
  }

  dispose() {
    for (const m of this.puffs) { m.geometry.dispose(); m.material.dispose(); }
    this.group.parent?.remove(this.group);
    this.puffs.length = 0;
  }
}
