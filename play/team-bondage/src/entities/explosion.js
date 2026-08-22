


















import * as THREE from 'three';


const HOT    = 0xfff6e0;   
const GOLD   = 0xf4c95d;   
const RED    = 0xb73a2a;   
const SMOKE  = 0x4a4038;   
const SCORCH = 0x2a241d;



const G_CHUNK  = new THREE.IcosahedronGeometry(1, 0);
const G_BOX    = new THREE.BoxGeometry(1, 1, 1);
const G_RING   = new THREE.RingGeometry(0.72, 1, 24, 1);
const G_DISC   = new THREE.CircleGeometry(1, 20);

export class ExplosionField {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    
    this.shake = 0;
  }

  
  
  spawn(pos, { radius = 3, groundY = 1, kind = 'rocket' } = {}) {
    const R = radius;
    const big = kind !== 'hazard';

    
    this._add(mesh(G_CHUNK, HOT, 1.0, true), pos, {
      life: 0.09, from: R * 0.35, to: R * 1.5, fade: 'linear',
    });

    
    this._add(mesh(G_CHUNK, GOLD, 0.95), pos, {
      life: 0.34, from: R * 0.25, to: R * 0.95, spin: 1.6,
      colorTo: RED, colorFrom: HOT,
    });
    this._add(mesh(G_CHUNK, RED, 0.55), pos, {
      life: 0.52, from: R * 0.4, to: R * 1.35, spin: -1.1,
    });

    
    const ring = mesh(G_RING, GOLD, 0.85);
    ring.rotation.x = -Math.PI / 2;
    this._add(ring, new THREE.Vector3(pos.x, groundY + 0.06, pos.z), {
      life: 0.42, from: R * 0.3, to: R * 1.9, flat: true,
    });

    
    const puffs = big ? 7 : 4;
    for (let i = 0; i < puffs; i++) {
      const a = (i / puffs) * Math.PI * 2 + Math.random() * 0.6;
      const m = mesh(G_BOX, SMOKE, 0.55);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this._add(m, pos, {
        life: 1.1 + Math.random() * 0.5,
        from: R * 0.22, to: R * 0.55,
        vel: new THREE.Vector3(Math.cos(a) * R * 0.5, 1.4 + Math.random(), Math.sin(a) * R * 0.5),
        drag: 1.6, spin: 0.8,
      });
    }

    
    const chunks = big ? 14 : 8;
    for (let i = 0; i < chunks; i++) {
      const a = (i / chunks) * Math.PI * 2 + Math.random() * 0.5;
      const speed = R * (1.1 + Math.random() * 1.3);
      const m = mesh(G_BOX, i % 3 === 0 ? RED : SMOKE, 1);
      this._add(m, pos, {
        life: 0.9 + Math.random() * 0.5,
        from: 0.10 + Math.random() * 0.12, to: 0.08,
        vel: new THREE.Vector3(Math.cos(a) * speed, 3 + Math.random() * 4, Math.sin(a) * speed),
        gravity: 14, spin: 6, bounceY: groundY,
      });
    }

    
    for (let i = 0; i < (big ? 12 : 6); i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9, Math.random() - 0.5)
        .normalize().multiplyScalar(R * (2.2 + Math.random() * 2));
      this._add(mesh(G_BOX, GOLD, 1, true), pos, {
        life: 0.22 + Math.random() * 0.18,
        from: 0.075, to: 0.02, vel: d, gravity: 6,
      });
    }

    
    const disc = mesh(G_DISC, SCORCH, 0.7);
    disc.rotation.x = -Math.PI / 2;
    this._add(disc, new THREE.Vector3(pos.x, groundY + 0.03, pos.z), {
      life: 3.4, from: R * 0.55, to: R * 0.7, flat: true, hold: 0.5,
    });

    
    this.shake = Math.max(this.shake, big ? 0.55 : 0.25);
  }

  _add(m, pos, o) {
    m.position.copy(pos);
    m.scale.setScalar(o.from);
    this.scene.add(m);
    this.parts.push({
      m, age: 0,
      vel: o.vel ? o.vel.clone() : null,
      ...o,
      baseOpacity: m.material.opacity,
      cFrom: o.colorFrom != null ? new THREE.Color(o.colorFrom) : null,
      cTo: o.colorTo != null ? new THREE.Color(o.colorTo) : null,
    });
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 1.8);
    this.parts = this.parts.filter((p) => {
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        this.scene.remove(p.m);
        p.m.material.dispose();
        return false;
      }
      
      const e = 1 - Math.pow(1 - t, 2.2);
      p.m.scale.setScalar(p.from + (p.to - p.from) * e);

      if (p.vel) {
        if (p.gravity) p.vel.y -= p.gravity * dt;
        if (p.drag) p.vel.multiplyScalar(Math.max(0, 1 - p.drag * dt));
        p.m.position.addScaledVector(p.vel, dt);
        
        if (p.bounceY != null && p.m.position.y < p.bounceY + 0.08) {
          p.m.position.y = p.bounceY + 0.08;
          p.vel.y = Math.abs(p.vel.y) * 0.32;
          p.vel.x *= 0.6; p.vel.z *= 0.6;
        }
      }
      if (p.spin) {
        p.m.rotation.x += p.spin * dt;
        p.m.rotation.z += p.spin * 0.7 * dt;
      }
      if (p.cFrom && p.cTo) p.m.material.color.copy(p.cFrom).lerp(p.cTo, t);

      
      const ft = p.hold ? Math.max(0, (t - p.hold) / (1 - p.hold)) : t;
      p.m.material.opacity = p.baseOpacity * (p.fade === 'linear' ? 1 - ft : Math.pow(1 - ft, 1.5));
      return true;
    });
  }

  
  shakeOffset() {
    if (this.shake <= 0) return null;
    const s = this.shake * this.shake * 0.09;
    return {
      x: (Math.random() - 0.5) * s,
      y: (Math.random() - 0.5) * s,
      roll: (Math.random() - 0.5) * s * 0.5,
    };
  }
}

function mesh(geo, color, opacity, additive = false) {
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  }));
}
