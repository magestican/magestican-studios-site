// Four floating breakable steaks — one per edge of the map.
//
//   * Each is a small red steak-shaped mesh floating at y=4.5.
//   * Shootable by any player's hitscan shot. On hit: broadcast STEAK_BREAK,
//     hide mesh, schedule respawn 2s later.
//   * Local counter increments to 5. On reaching 5, the player gets a
//     STEAK weapon: a throwable that sticks + poisons for 2 dmg/sec.
//
// See docs/features/steak-weapon.md.

import * as THREE from 'three';
import { WORLD_SIZE } from '../../../../web-engine/procgen/voxelWorldGen.js';

const SIDES = ['N', 'S', 'E', 'W'];
const RESPAWN_MS = 2_000;
const HIT_RADIUS = 0.9;
const FLOAT_Y = 4.5;

// Positions computed from WORLD_SIZE so each steak floats at the mid-edge of
// its own side. The default is read from the generator rather than written
// here as a number: the steaks are a MAP FEATURE, and a copy of the map's
// width that has to be remembered is a copy that will go stale.
function sidePosition(side, worldSize = WORLD_SIZE.x) {
  const mid = worldSize / 2;
  const edge = 4;
  switch (side) {
    case 'N': return new THREE.Vector3(mid, FLOAT_Y, edge);
    case 'S': return new THREE.Vector3(mid, FLOAT_Y, worldSize - edge);
    case 'E': return new THREE.Vector3(worldSize - edge, FLOAT_Y, mid);
    case 'W': return new THREE.Vector3(edge, FLOAT_Y, mid);
  }
}

function buildSteakMesh() {
  const g = new THREE.Group();
  // Slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.20, 0.6),
    new THREE.MeshLambertMaterial({ color: 0xa02020, flatShading: true, emissive: 0x300808 }),
  );
  g.add(slab);
  // Fat trim (top strip)
  const fat = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.10),
    new THREE.MeshLambertMaterial({ color: 0xffe8b0, flatShading: true }),
  );
  fat.position.set(0, 0.10, 0.30);
  g.add(fat);
  // Rim glow ring so it's visible from far away
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
    this.meshes = new Map();      // side -> Group
    this.status = new Map();      // side -> { alive:bool, respawnAt:number }
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
        // Bob + spin.
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

  // Check if a hitscan ray from `origin` in direction `dir` hits any alive
  // steak within `maxDist`. Returns the side letter or null.
  raycastHit(origin, dir, maxDist = 60) {
    let best = null, bestT = maxDist;
    for (const side of SIDES) {
      if (!this.status.get(side).alive) continue;
      const centre = this.meshes.get(side).position;
      // Closest-approach distance from ray to centre.
      const toC = centre.clone().sub(origin);
      const t = toC.dot(dir);
      if (t < 0.2 || t > maxDist) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      const d = closest.distanceTo(centre);
      if (d < HIT_RADIUS && t < bestT) { bestT = t; best = side; }
    }
    return best;
  }

  // Mark a steak destroyed. Call locally on the shooter's client + on every
  // peer that receives STEAK_BREAK.
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
