




















import * as THREE from 'three';
import { POWER_UPS } from './powerUpSpec.js';

const RESPAWN_MS = 30_000;     
const PICKUP_RADIUS = 1.6;
const FIRST_SPAWN_MS = 3_000;
const FLOAT_ABOVE_DECK = 1.2;  

export class PowerUpPickups {
  constructor(scene, spawns, opts = {}) {
    this.scene = scene;
    this.onPickup = opts.onPickup || (() => {});
    this.items = new Map();
    this._bobT = 0;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    for (const id of Object.keys(POWER_UPS)) {
      const at = spawns?.[id];
      if (!at) continue;
      const mesh = id === 'protein-shake' ? buildProteinShakeMesh() : buildCheeseWheelMesh();
      mesh.position.set(at.x, at.y + FLOAT_ABOVE_DECK, at.z);
      mesh.visible = false;
      scene.add(mesh);
      this.items.set(id, {
        id, mesh, at: { ...at },
        available: false,
        nextSpawnAt: now + FIRST_SPAWN_MS,
      });
    }
  }

  update(dt, hostPlayers) {
    this._bobT += dt;
    const now = performance.now();
    let phase = 0;
    for (const it of this.items.values()) {
      if (it.mesh.visible) {
        
        
        it.mesh.position.y = it.at.y + FLOAT_ABOVE_DECK
          + Math.sin(this._bobT * 2.6 + phase) * 0.22;
        it.mesh.rotation.y += dt * 1.2;
      }
      phase += 1.7;
      if (!it.available && now >= it.nextSpawnAt) {
        it.available = true;
        it.mesh.visible = true;
      }
      if (it.available && hostPlayers) {
        for (const p of hostPlayers) {
          if (Math.hypot(p.pos.x - it.at.x, p.pos.z - it.at.z) < PICKUP_RADIUS) {
            this.markTaken(it.id, now + RESPAWN_MS);
            this.onPickup(it.id, p.peerId);
            break;
          }
        }
      }
    }
  }

  
  
  
  markTaken(id, nextSpawnAt) {
    const it = this.items.get(id);
    if (!it) return false;
    it.available = false;
    it.mesh.visible = false;
    it.nextSpawnAt = nextSpawnAt;
    return true;
  }

  isAvailable(id) { return this.items.get(id)?.available === true; }
  position(id) { return this.items.get(id)?.at ?? null; }
  nextSpawnAt(id) { return this.items.get(id)?.nextSpawnAt ?? 0; }
}





const lambert = (hex, emissive) => new THREE.MeshLambertMaterial({
  color: hex, flatShading: true, ...(emissive ? { emissive } : {}),
});

function box(w, h, d, hex, x, y, z, emissive) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(hex, emissive));
  m.position.set(x, y, z);
  return m;
}




function glowRing(hex, y) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 24),
    new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  
  
  
  
  ring.position.y = y;
  return ring;
}























function buildProteinShakeMesh() {
  const g = new THREE.Group();
  const CREAM = 0xf7f0e0, CREAM_DK = 0xcdc0a4;
  const SHAKE = 0xf2789f, BERRY = 0xff5fa2, BERRY_DK = 0xa8265c;

  g.add(box(0.60, 0.08, 0.60, BERRY_DK, 0, 0.04, 0));      
  g.add(box(0.56, 0.44, 0.56, SHAKE,    0, 0.30, 0));      
  g.add(box(0.56, 0.24, 0.56, CREAM,    0, 0.64, 0));      
  g.add(box(0.42, 0.11, 0.42, CREAM_DK, 0, 0.81, 0));      
  g.add(box(0.58, 0.20, 0.58, BERRY,    0, 0.97, 0));      
  
  
  
  g.add(box(0.20, 0.15, 0.24, BERRY_DK, 0, 1.12, 0.15));
  g.add(glowRing(BERRY, 0.01));
  return g;
}













function buildCheeseWheelMesh() {
  const g = new THREE.Group();
  const wheel = new THREE.Group();
  
  
  
  
  
  const RIND = 0xd4801f, PASTE = 0xffef9e, HOLE = 0x8a5c12;

  const SEG = 10;
  const CUT = Math.PI * 2 * 0.78;   

  
  const rind = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.34, SEG, 1, false, 0, CUT),
    lambert(RIND),
  );
  
  
  const paste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.37, SEG, 1, false, 0, CUT),
    lambert(PASTE),
  );
  wheel.add(rind, paste);

  
  
  
  
  
  for (const face of [1, -1]) {
    for (const [hx, hz, r] of [[0.12, 0.16, 0.15], [-0.17, -0.05, 0.19], [0.07, -0.23, 0.12]]) {
      wheel.add(box(r, 0.06, r, HOLE, hx, face * 0.185, hz));
    }
  }

  
  wheel.rotation.x = Math.PI / 2;
  wheel.rotation.z = 0.34;
  g.add(wheel);
  g.add(glowRing(RIND, -0.5));
  return g;
}

export { buildProteinShakeMesh, buildCheeseWheelMesh };
