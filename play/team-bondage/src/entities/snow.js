// Falling voxel snow. THREE.Points isn't voxel-y enough, so we manually
// spawn N small BoxGeometry instances via InstancedMesh and re-cycle each
// flake back to the sky when it hits the ground.

import * as THREE from 'three';

const FLAKES = 400;
const SPREAD_XZ = 60;             // half-extents of the fall area
const SPAWN_HEIGHT = 22;
const FALL_MIN = 2.5, FALL_MAX = 5.5;

export class SnowSystem {
  constructor(scene, playerPos) {
    this.scene = scene;
    this.playerPos = playerPos;
    const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const mat = new THREE.MeshLambertMaterial({
      color: 0xffffff, transparent: true, opacity: 0.85, flatShading: true,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, FLAKES);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    // Per-flake state.
    this._flakes = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < FLAKES; i++) {
      const p = { x: rand(-SPREAD_XZ, SPREAD_XZ), y: rand(0, SPAWN_HEIGHT), z: rand(-SPREAD_XZ, SPREAD_XZ),
                  vy: rand(FALL_MIN, FALL_MAX),
                  driftPhase: Math.random() * Math.PI * 2 };
      this._flakes.push(p);
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this._dummy = dummy;
    this._t = 0;
  }

  update(dt) {
    this._t += dt;
    // Follow the player horizontally so snow always surrounds them.
    const px = this.playerPos.x, pz = this.playerPos.z;
    for (let i = 0; i < FLAKES; i++) {
      const f = this._flakes[i];
      f.y -= f.vy * dt;
      // Gentle horizontal drift like actual snow.
      const drift = Math.sin(this._t * 0.6 + f.driftPhase) * 0.4;
      const targetX = f.x + drift * dt;
      // Recycle to top when it hits ground (y<=1).
      if (f.y < 1) {
        f.x = px + rand(-SPREAD_XZ, SPREAD_XZ);
        f.z = pz + rand(-SPREAD_XZ, SPREAD_XZ);
        f.y = SPAWN_HEIGHT + Math.random() * 6;
        f.vy = rand(FALL_MIN, FALL_MAX);
      } else if (Math.abs(f.x - px) > SPREAD_XZ || Math.abs(f.z - pz) > SPREAD_XZ) {
        // Also recycle if the player walked away from the flake.
        f.x = px + rand(-SPREAD_XZ, SPREAD_XZ);
        f.z = pz + rand(-SPREAD_XZ, SPREAD_XZ);
      }
      this._dummy.position.set(targetX, f.y, f.z);
      this._dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

function rand(a, b) { return a + Math.random() * (b - a); }
