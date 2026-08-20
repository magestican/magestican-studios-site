// First-person player controller with ice-drift movement.
//
// The signature Team Bondage mechanic: whole world behaves like ice. Player
// velocity persists after inputs release, decaying slowly. Every direction
// change is a slide. Air control is even softer.

import * as THREE from 'three';
import { VOX } from 'arbelo/voxel';

const GRAVITY = -24.0;              // m/s^2
const JUMP_SPEED = 8.5;             // m/s
const MOVE_ACCEL_GROUND = 55.0;     // m/s^2 pushed by input on the ground
const MOVE_ACCEL_AIR = 12.0;        // m/s^2 in the air
const MAX_GROUND_SPEED = 8.5;       // hard cap on horizontal speed on ground
const MAX_AIR_SPEED = 10.5;
const ICE_FRICTION_GROUND = 0.96;   // per-frame (~60fps). 1.0 = perfect ice
const ICE_FRICTION_AIR    = 0.995;  // barely any air drag
const HALF_WIDTH  = 0.32;
const HALF_DEPTH  = 0.32;
const HEIGHT      = 1.60;

export class Player {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {import('arbelo/voxel').VoxelGrid} grid
   * @param {{x:number,y:number,z:number}} spawn
   * @param {string} team  'red' | 'blue'
   */
  constructor(camera, grid, spawn, team) {
    this.camera = camera;
    this.grid = grid;
    this.team = team;
    this.spawn = { ...spawn };

    this.pos = new THREE.Vector3(spawn.x, spawn.y, spawn.z);
    this.vel = new THREE.Vector3();
    this.yaw = team === 'red' ? Math.PI / 4 : Math.PI + Math.PI / 4;   // face inward
    this.pitch = 0;

    this.hp = 100;
    this.alive = true;
    this.hasEnemyFlag = false;

    // For anti-teleport smoothing when respawning.
    this.lastGrounded = false;
  }

  respawn() {
    this.pos.set(this.spawn.x, this.spawn.y + 0.5, this.spawn.z);
    this.vel.set(0, 0, 0);
    this.hp = 100;
    this.alive = true;
    this.hasEnemyFlag = false;
  }

  addMouseLook(dx, dy, sensitivity = 0.002) {
    this.yaw   -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    const lim = Math.PI / 2 - 0.05;
    if (this.pitch >  lim) this.pitch =  lim;
    if (this.pitch < -lim) this.pitch = -lim;
  }

  /**
   * Advance one physics tick.
   * @param {number} dt  seconds
   * @param {InputBus} input
   */
  update(dt, input) {
    // ---- Wish direction from input, in world space (yaw only) ------------
    const wish = new THREE.Vector3();
    if (input.isDown('moveForward')) wish.z -= 1;
    if (input.isDown('moveBack'))    wish.z += 1;
    if (input.isDown('moveLeft'))    wish.x -= 1;
    if (input.isDown('moveRight'))   wish.x += 1;
    if (wish.lengthSq() > 0) wish.normalize();
    // Rotate to yaw
    const cosY = Math.cos(this.yaw), sinY = Math.sin(this.yaw);
    const wx = wish.x * cosY - wish.z * sinY;
    const wz = wish.x * sinY + wish.z * cosY;

    const grounded = this._checkGrounded();

    // ---- Horizontal acceleration ----------------------------------------
    const accel = grounded ? MOVE_ACCEL_GROUND : MOVE_ACCEL_AIR;
    this.vel.x += wx * accel * dt;
    this.vel.z += wz * accel * dt;

    // ---- Ice-drift friction ---------------------------------------------
    // Non-frame-rate-independent friction is a common FPS-mover bug; correct
    // it by scaling the ice constant against expected 60Hz.
    const fricBase = grounded ? ICE_FRICTION_GROUND : ICE_FRICTION_AIR;
    const fric = Math.pow(fricBase, dt * 60);
    this.vel.x *= fric;
    this.vel.z *= fric;

    // ---- Speed cap (horizontal) -----------------------------------------
    const cap = grounded ? MAX_GROUND_SPEED : MAX_AIR_SPEED;
    const hsp = Math.hypot(this.vel.x, this.vel.z);
    if (hsp > cap) {
      const s = cap / hsp;
      this.vel.x *= s; this.vel.z *= s;
    }

    // ---- Jump -----------------------------------------------------------
    if (grounded && input.wasPressed('jump')) {
      this.vel.y = JUMP_SPEED;
    }

    // ---- Gravity --------------------------------------------------------
    this.vel.y += GRAVITY * dt;
    if (this.vel.y < -30) this.vel.y = -30;

    // ---- Swept motion vs voxel grid (axis-by-axis) ----------------------
    this._moveAxis('x', this.vel.x * dt);
    this._moveAxis('y', this.vel.y * dt);
    this._moveAxis('z', this.vel.z * dt);

    // ---- Camera follows ------------------------------------------------
    this.camera.position.set(this.pos.x, this.pos.y + HEIGHT - 0.1, this.pos.z);
    const dir = new THREE.Vector3(
      Math.cos(this.pitch) * Math.sin(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.cos(this.yaw),
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));

    // Out-of-world safety.
    if (this.pos.y < -20) this.respawn();
  }

  _moveAxis(axis, delta) {
    if (delta === 0) return;
    const key = axis;   // 'x' | 'y' | 'z'
    const step = 0.25;
    const iters = Math.max(1, Math.ceil(Math.abs(delta) / step));
    const sub = delta / iters;
    for (let i = 0; i < iters; i++) {
      const before = this.pos[key];
      this.pos[key] += sub;
      if (this._intersectsWorld()) {
        this.pos[key] = before;
        if (axis === 'y') {
          // Landed / hit head.
          if (this.vel.y < 0) this.lastGrounded = true;
          this.vel.y = 0;
        } else {
          // Wall friction: zero out on collision axis (slide).
          this.vel[key] = 0;
        }
        break;
      }
    }
  }

  _checkGrounded() {
    // Small ray-ish check: sample a plane just below the feet.
    const y = this.pos.y - 0.02;
    for (const [dx, dz] of FOOT_SAMPLES) {
      const x = this.pos.x + dx;
      const z = this.pos.z + dz;
      if (this.grid.isSolid(x, y - 0.01, z)) return true;
    }
    return false;
  }

  _intersectsWorld() {
    // AABB vs voxels: iterate every voxel in the box's overlap.
    const minX = Math.floor(this.pos.x - HALF_WIDTH);
    const maxX = Math.floor(this.pos.x + HALF_WIDTH);
    const minZ = Math.floor(this.pos.z - HALF_DEPTH);
    const maxZ = Math.floor(this.pos.z + HALF_DEPTH);
    const minY = Math.floor(this.pos.y);
    const maxY = Math.floor(this.pos.y + HEIGHT);
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.grid.get(x, y, z) !== VOX.AIR) return true;
        }
      }
    }
    return false;
  }
}

// 4 corners + centre bottom
const FOOT_SAMPLES = [
  [-HALF_WIDTH, -HALF_DEPTH],
  [ HALF_WIDTH, -HALF_DEPTH],
  [-HALF_WIDTH,  HALF_DEPTH],
  [ HALF_WIDTH,  HALF_DEPTH],
  [0, 0],
];
