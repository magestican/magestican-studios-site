











import * as THREE from 'three';
import { ITEM_RESPAWN_MS, ITEM_FIRST_SPAWN_MS }
  from '../../../../web-engine/ui/itemClock.js';
import { createPickupPad } from './pickupPad.js';

const PICKUP_RADIUS = 1.6;

export class ChickenPickup {
  constructor(scene, hillSpawn, opts = {}) {
    this.scene = scene;
    this.spawnAt = { ...hillSpawn };
    this.onPickup = opts.onPickup || (() => {});
    this.available = false;
    this.mesh = buildChickenMesh();
    this.mesh.position.copy(new THREE.Vector3(this.spawnAt.x, this.spawnAt.y + 1.2, this.spawnAt.z));
    this.mesh.visible = false;
    scene.add(this.mesh);
    this._bobT = 0;
    this._nextSpawnAt = performance.now() + ITEM_FIRST_SPAWN_MS;
    
    
    
    this.pad = createPickupPad(0xffffff);
    this.pad.group.position.set(this.spawnAt.x, this.spawnAt.y + 0.06, this.spawnAt.z);
    scene.add(this.pad.group);
  }

  update(dt, hostPlayers) {
    
    if (this.mesh.visible) {
      this._bobT += dt;
      this.mesh.position.y = this.spawnAt.y + 1.2 + Math.sin(this._bobT * 3) * 0.2;
      this.mesh.rotation.y += dt * 1.5;
    }
    const now = performance.now();
    if (!this.available && now >= this._nextSpawnAt) {
      this.available = true;
      this.mesh.visible = true;
    }
    
    
    
    this.pad?.setRemaining(this.available ? null : Math.max(0, this._nextSpawnAt - now));
    this.pad?.faceCamera(this.listener);
    
    if (this.available && hostPlayers) {
      for (const p of hostPlayers) {
        const dx = p.pos.x - this.spawnAt.x;
        const dz = p.pos.z - this.spawnAt.z;
        if (Math.hypot(dx, dz) < PICKUP_RADIUS) {
          this.available = false;
          this.mesh.visible = false;
          this._nextSpawnAt = now + ITEM_RESPAWN_MS;
          this.onPickup(p.peerId);
          break;
        }
      }
    }
  }

  isAvailable() { return this.available; }
  position() { return this.spawnAt; }
  
  
  clockState() {
    return { id: 'chicken', available: this.available, nextSpawnAt: this._nextSpawnAt };
  }
}

function buildChickenMesh() {
  const g = new THREE.Group();
  
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
  );
  body.position.set(0, 0.6, 0);
  g.add(body);
  
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
  );
  head.position.set(0, 1.15, 0.3);
  g.add(head);
  
  const comb = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.20, 0.35),
    new THREE.MeshLambertMaterial({ color: 0xb73a2a, flatShading: true }),
  );
  comb.position.set(0, 1.45, 0.28);
  g.add(comb);
  
  const beak = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.10, 0.25),
    new THREE.MeshLambertMaterial({ color: 0xf4c95d, flatShading: true }),
  );
  beak.position.set(0, 1.10, 0.58);
  g.add(beak);
  
  for (const lx of [-0.12, 0.12]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.30, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xf4a83d, flatShading: true }),
    );
    leg.position.set(lx, 0.15, 0);
    g.add(leg);
  }
  
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 24),
    new THREE.MeshBasicMaterial({ color: 0xf4c95d, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(ring);
  return g;
}
