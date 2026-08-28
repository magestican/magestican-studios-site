





































import * as THREE from 'three';
import {
  planExplosion, shakeAtDistance, nearFade,
  KICK_METRES, KICK_ROLL, FADE_LAYERS, EX_PALETTE,
} from './explosionSpec.js';

export { EX_PALETTE };






const GEO = {
  ico:  () => new THREE.IcosahedronGeometry(1, 0),   
  box:  () => new THREE.BoxGeometry(1, 1, 1),
  ring: () => new THREE.RingGeometry(0.85, 1, 28, 1),   
  disc: () => new THREE.CircleGeometry(1, 20),
};
const _geoCache = {};
function geometry(name) {
  if (!_geoCache[name]) {
    if (!GEO[name]) throw new Error(`unknown explosion geometry: ${name}`);
    _geoCache[name] = GEO[name]();
  }
  return _geoCache[name];
}





const EMISSIVE_MIX = 0.34;

function makeMaterial(p) {
  const common = {
    transparent: true,
    opacity: p.opacity ?? 1,
    depthWrite: false,
    side: THREE.DoubleSide,
  };
  if (p.lit) {
    const c = new THREE.Color(p.color);
    return new THREE.MeshLambertMaterial({
      ...common,
      color: c,
      emissive: c.clone().multiplyScalar(EMISSIVE_MIX),
      flatShading: true,
    });
  }
  return new THREE.MeshBasicMaterial({
    ...common,
    color: p.color,
    blending: p.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

export class ExplosionField {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    
    this.shake = 0;
    
    
    
    
    
    
    
    this.listener = null;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  spawn(pos, { kind = 'slingshot', radius, groundY = 1, colors, rng, listener } = {}) {
    const plan = planExplosion({ kind, radius, colors, rng });
    for (const p of plan) this._add(p, pos, groundY);
    
    
    
    
    const ear = listener || this.listener;
    const dist = ear ? ear.distanceTo(pos) : NaN;
    this.shake = Math.max(this.shake, shakeAtDistance(kind, dist));
    return plan.length;
  }

  _add(p, pos, groundY) {
    const m = new THREE.Mesh(geometry(p.geo), makeMaterial(p));
    m.renderOrder = p.order || 0;
    if (p.ground) {
      
      m.position.set(pos.x, groundY + (p.lift || 0), pos.z);
      m.rotation.x = -Math.PI / 2;
    } else {
      m.position.copy(pos);
      if (p.at) m.position.add(new THREE.Vector3(p.at[0], p.at[1], p.at[2]));
      if (p.tumble) m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    }
    m.scale.setScalar(p.from);
    
    
    if (p.delay) m.visible = false;
    this.scene.add(m);
    this.parts.push({
      spec: p,
      m,
      age: 0,
      vel: p.vel ? new THREE.Vector3(p.vel[0], p.vel[1], p.vel[2]) : null,
      groundY,
      baseOpacity: p.opacity ?? 1,
      cFrom: p.colorTo != null ? new THREE.Color(p.color) : null,
      cTo: p.colorTo != null ? new THREE.Color(p.colorTo) : null,
      tmp: p.colorTo != null ? new THREE.Color() : null,
    });
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 1.8);
    if (!this.parts.length) return;
    this.parts = this.parts.filter((q) => {
      const p = q.spec;
      q.age += dt;
      const live = q.age - (p.delay || 0);
      if (live < 0) return true;             
      const t = live / p.life;
      if (t >= 1) {
        this.scene.remove(q.m);
        q.m.material.dispose();
        return false;
      }
      q.m.visible = true;
      
      
      const e = 1 - Math.pow(1 - t, 2.2);
      q.m.scale.setScalar(p.from + (p.to - p.from) * e);

      if (q.vel) {
        if (p.gravity) q.vel.y -= p.gravity * dt;
        if (p.drag) q.vel.multiplyScalar(Math.max(0, 1 - p.drag * dt));
        q.m.position.addScaledVector(q.vel, dt);
        
        
        if (p.bounce && q.m.position.y < q.groundY + 0.08) {
          q.m.position.y = q.groundY + 0.08;
          q.vel.y = Math.abs(q.vel.y) * 0.32;
          q.vel.x *= 0.6; q.vel.z *= 0.6;
        }
      }
      if (p.spin) {
        q.m.rotation.x += p.spin * dt;
        q.m.rotation.z += p.spin * 0.7 * dt;
      }
      if (q.cFrom) {
        q.tmp.copy(q.cFrom).lerp(q.cTo, t);
        q.m.material.color.copy(q.tmp);
        
        
        
        if (q.m.material.emissive) {
          q.m.material.emissive.copy(q.tmp).multiplyScalar(EMISSIVE_MIX);
        }
      }

      
      const ft = p.hold ? Math.max(0, (t - p.hold) / (1 - p.hold)) : t;
      let opacity = q.baseOpacity * (p.fade === 'linear' ? 1 - ft : Math.pow(1 - ft, 1.5));

      
      
      
      
      
      
      if (this.listener && FADE_LAYERS.includes(p.layer)) {
        
        
        opacity *= nearFade(this.listener.distanceTo(q.m.position), q.m.scale.x);
      }

      q.m.material.opacity = opacity;
      return true;
    });
  }

  
  
  
  
  
  
  
  shakeOffset() {
    if (this.shake <= 0) return null;
    const s = this.shake * this.shake * KICK_METRES;
    return {
      x: (Math.random() - 0.5) * s,
      y: (Math.random() - 0.5) * s,
      roll: (Math.random() - 0.5) * s * KICK_ROLL,
    };
  }

  
  
  
  clear() {
    for (const q of this.parts) {
      this.scene.remove(q.m);
      q.m.material.dispose();
    }
    this.parts.length = 0;
    this.shake = 0;
  }
}
