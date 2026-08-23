









import * as THREE from 'three';
import { WORLD_SIZE } from '../../../../web-engine/procgen/voxelWorldGen.js';

const SIDES = ['N', 'S', 'E', 'W'];
const RESPAWN_MS = 2_000;
const HIT_RADIUS = 0.9;
const FLOAT_Y = 4.5;

const OUTSIDE_MARGIN = 3;





function sidePosition(side, worldSize = WORLD_SIZE.x) {
  const mid = worldSize / 2;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const out = -OUTSIDE_MARGIN;
  switch (side) {
    case 'N': return new THREE.Vector3(mid, FLOAT_Y, out);
    case 'S': return new THREE.Vector3(mid, FLOAT_Y, worldSize - out);
    case 'E': return new THREE.Vector3(worldSize - out, FLOAT_Y, mid);
    case 'W': return new THREE.Vector3(out, FLOAT_Y, mid);
  }
}

function buildSteakMesh() {
  const g = new THREE.Group();
  
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.20, 0.6),
    new THREE.MeshLambertMaterial({ color: 0xa02020, flatShading: true, emissive: 0x300808 }),
  );
  g.add(slab);
  
  const fat = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.10),
    new THREE.MeshLambertMaterial({ color: 0xffe8b0, flatShading: true }),
  );
  fat.position.set(0, 0.10, 0.30);
  g.add(fat);
  
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 1.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.20;
  g.add(ring);
  return g;
}

export class SteakPickups {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.onShotBroken = opts.onShotBroken || (() => {});
    this.worldSize = opts.worldSize || WORLD_SIZE.x;
    this.meshes = new Map();      
    this.status = new Map();      
    this._bobT = 0;
    for (const side of SIDES) {
      const m = buildSteakMesh();
      m.position.copy(sidePosition(side, this.worldSize));
      scene.add(m);
      this.meshes.set(side, m);
      this.status.set(side, { alive: true, respawnAt: 0 });
    }
  }

  update(dt) {
    this._bobT += dt;
    const now = performance.now();
    for (const side of SIDES) {
      const m = this.meshes.get(side);
      const s = this.status.get(side);
      if (s.alive) {
        
        m.visible = true;
        const base = sidePosition(side, this.worldSize);
        m.position.set(base.x, base.y + Math.sin(this._bobT * 2.4 + SIDES.indexOf(side)) * 0.2, base.z);
        m.rotation.y += dt * 1.1;
      } else {
        m.visible = false;
        if (now >= s.respawnAt) {
          s.alive = true;
          s.respawnAt = 0;
        }
      }
    }
  }

  
  
  raycastHit(origin, dir, maxDist = 60) {
    let best = null, bestT = maxDist;
    for (const side of SIDES) {
      if (!this.status.get(side).alive) continue;
      const centre = this.meshes.get(side).position;
      
      const toC = centre.clone().sub(origin);
      const t = toC.dot(dir);
      if (t < 0.2 || t > maxDist) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      const d = closest.distanceTo(centre);
      if (d < HIT_RADIUS && t < bestT) { bestT = t; best = side; }
    }
    return best;
  }

  
  
  
  
  
  
  
  
  
  segmentHit(from, to) {
    let best = null, bestT = Infinity;
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const len2 = dx * dx + dy * dy + dz * dz;
    for (const side of SIDES) {
      if (!this.status.get(side).alive) continue;
      const c = this.meshes.get(side).position;
      
      
      let t = len2 < 1e-12 ? 0
        : ((c.x - from.x) * dx + (c.y - from.y) * dy + (c.z - from.z) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = from.x + dx * t, py = from.y + dy * t, pz = from.z + dz * t;
      const d = Math.hypot(c.x - px, c.y - py, c.z - pz);
      if (d < HIT_RADIUS && t < bestT) { bestT = t; best = side; }
    }
    return best;
  }

  
  
  markBroken(side) {
    const s = this.status.get(side);
    if (!s || !s.alive) return false;
    s.alive = false;
    s.respawnAt = performance.now() + RESPAWN_MS;
    return true;
  }

  positionOf(side) { return sidePosition(side, this.worldSize); }
}

export { SIDES, sidePosition };
