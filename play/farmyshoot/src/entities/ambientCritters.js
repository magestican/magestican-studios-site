


















import * as THREE from 'three';
import { speciesFor, TURN_RATE, BOB, LOOK_RANGE, HUDDLE_TILT, CHEER, CHEER_EVENTS }
  from './ambientCrittersSpec.js';

export class AmbientCritters {
  
  constructor(scene, spots, cfg = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'ambientCritters';
    scene.add(this.group);

    
    
    const mats = new Map();
    const matFor = (hex) => {
      if (!mats.has(hex)) {
        mats.set(hex, new THREE.MeshLambertMaterial({
          color: new THREE.Color(hex), flatShading: true,
        }));
      }
      return mats.get(hex);
    };

    
    
    
    let seed = 0x9E3779B9;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };

    
    
    const species = speciesFor(cfg?.kind);

    
    
    
    
    
    
    this.cheerCfg = species.cheer ? Object.freeze({ ...CHEER, ...species.cheer }) : CHEER;
    const C = this.cheerCfg;

    this.birds = [];
    for (const spot of spots) {
      const bird = new THREE.Group();
      
      
      
      
      
      
      const body = new THREE.Group();
      bird.add(body);
      const scale = species.scale * (0.82 + rnd() * 0.36);   
      
      
      
      const pivots = new Map();
      const limbs = [];
      for (const part of species.parts) {
        const [x, y, z, w, h, d] = part.p;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFor(part.hex));
        if (part.role && part.pivot) {
          
          
          
          
          const [px, py, pz] = part.pivot;
          const key = `${part.role}|${part.side ?? 0}|${px},${py},${pz}`;
          let limb = pivots.get(key);
          if (!limb) {
            const pivot = new THREE.Group();
            pivot.position.set(px, py, pz);
            body.add(pivot);
            limb = { obj: pivot, role: part.role, side: part.side ?? 1,
                     restZ: pivot.rotation.z, restX: pivot.rotation.x };
            pivots.set(key, limb);
            limbs.push(limb);
          }
          mesh.position.set(x - px, y - py, z - pz);
          if (part.tilt) mesh.rotation.x = part.tilt;
          limb.obj.add(mesh);
          continue;
        }
        mesh.position.set(x, y, z);
        if (part.tilt) mesh.rotation.x = part.tilt;
        body.add(mesh);
      }
      const flippers = limbs.filter((l) => l.role === 'flipper');
      const forelegs = limbs.filter((l) => l.role === 'foreleg');
      const heads    = limbs.filter((l) => l.role === 'head');
      const hindlegs = limbs.filter((l) => l.role === 'hindleg');
      bird.position.set(spot.x, spot.y, spot.z);
      bird.scale.setScalar(scale);
      
      
      bird.rotation.y = rnd() * Math.PI * 2;
      this.group.add(bird);
      this.birds.push({
        obj: bird,
        body,
        scale,
        
        
        rearPivotZ: species.rearUp ? species.rearUp.pivotZ : 0,
        
        
        phase: rnd() * Math.PI * 2,
        baseY: spot.y,
        lean: (rnd() - 0.5) * HUDDLE_TILT,
        flippers,
        forelegs,
        heads,
        hindlegs,
        
        
        cheerT: 0,
        cheerDelay: 0,
        cheerAmp: 0,
        
        
        flapHz: C.flapHz + (rnd() - 0.5) * 2 * C.flapJitter,
        ampScale: 1 + (rnd() - 0.5) * 2 * C.amplitudeJitter,
        cheerYaw: null,
      });
    }
    this._t = 0;
  }

  
  
  
  
  
  
  
  
  
  cheer(atPos, kind = 'kill') {
    const intensity = CHEER_EVENTS[kind] ?? CHEER_EVENTS.kill;
    const C = this.cheerCfg;
    if (!atPos || intensity <= 0) return;
    for (const b of this.birds) {
      const dx = atPos.x - b.obj.position.x;
      const dz = atPos.z - b.obj.position.z;
      const dist = Math.hypot(dx, dz);
      const delay = dist / C.waveSpeed;
      
      
      if (b.cheerT > 0 && b.cheerAmp >= intensity) continue;
      b.cheerDelay = delay;
      b.cheerT = C.duration;
      b.cheerAmp = intensity;
      
      b.cheerYaw = Math.atan2(dx, dz);
    }
  }

  update(dt, camPos) {
    if (!camPos) return;
    const C = this.cheerCfg;
    this._t += dt;
    for (const b of this.birds) {
      
      let cheering = 0;             
      if (b.cheerT > 0) {
        if (b.cheerDelay > 0) {
          b.cheerDelay -= dt;       
        } else {
          b.cheerT -= dt;
          
          
          const f = Math.max(0, b.cheerT / C.duration);
          cheering = Math.min(1, f * 1.6) * b.cheerAmp;
          if (b.cheerT <= 0) { b.cheerT = 0; b.cheerYaw = null; b.cheerAmp = 0; }
        }
      }

      
      
      
      let want = null, rate = TURN_RATE;
      if (cheering > 0 && b.cheerYaw !== null) {
        want = b.cheerYaw; rate = C.turnRate;
      } else {
        const dx = camPos.x - b.obj.position.x;
        const dz = camPos.z - b.obj.position.z;
        if (dx * dx + dz * dz < LOOK_RANGE * LOOK_RANGE) want = Math.atan2(dx, dz);
      }
      if (want !== null) {
        
        
        let delta = want - b.obj.rotation.y;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        b.obj.rotation.y += Math.max(-rate * dt, Math.min(rate * dt, delta));
      }

      
      
      
      
      const bob = Math.sin(this._t * BOB.hz * Math.PI * 2 + b.phase) * BOB.amplitude;
      if (cheering > 0) {
        const amp = cheering * b.ampScale;
        
        
        
        
        
        
        const rock = 0.7 + 0.3 * Math.sin(this._t * C.hopHz * Math.PI + b.phase);
        const hop = b.rearPivotZ
          ? 0
          : Math.abs(Math.sin(this._t * C.hopHz * Math.PI + b.phase))
            * C.hopHeight * amp;
        
        
        
        
        
        
        
        let lift = 0;
        if (b.rearPivotZ) {
          const rear = Math.min(C.rearUp * amp, C.rearUp * 1.25) * rock;
          b.body.rotation.x = -rear;
          lift = Math.abs(b.rearPivotZ) * Math.sin(rear) * b.scale;
        }
        b.obj.position.y = b.baseY + hop + lift;
        b.body.rotation.z = b.lean * (1 - cheering);
        
        
        
        
        
        
        
        
        
        
        const swing = (0.5 + 0.5 * Math.sin(this._t * b.flapHz * Math.PI * 2 + b.phase))
                    * C.flipperSwing * amp;
        for (const f of b.flippers) f.obj.rotation.z = f.restZ + swing * f.side;
        
        
        
        
        for (const f of b.forelegs) {
          const paw = 0.5 + 0.5 * Math.sin(this._t * b.flapHz * Math.PI * 2
                                           + b.phase + (f.side > 0 ? 0 : Math.PI));
          f.obj.rotation.x = f.restX - paw * C.foreLegPaw * amp;
        }
        
        
        
        for (const h of b.heads) h.obj.rotation.x = h.restX - C.headToss * amp * rock;
        
        
        const brace = b.rearPivotZ
          ? Math.min(C.rearUp * amp, C.rearUp * 1.25) * rock * C.hindLegBrace
          : 0;
        for (const l of b.hindlegs) l.obj.rotation.x = l.restX + brace;
      } else {
        b.obj.position.y = b.baseY + bob;
        b.body.rotation.z = b.lean;
        b.body.rotation.x = 0;
        for (const f of b.flippers) f.obj.rotation.z = f.restZ;
        for (const f of b.forelegs) f.obj.rotation.x = f.restX;
        for (const h of b.heads) h.obj.rotation.x = h.restX;
        for (const l of b.hindlegs) l.obj.rotation.x = l.restX;
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      o.geometry?.dispose?.();
      if (!Array.isArray(o.material)) o.material?.dispose?.();
    });
  }
}
