// Rapier-driven first-person player controller with ice-drift movement.
//
// The heavy lifting (collision detection, slide-along-walls, auto-step,
// snap-to-ground, safe-unstuck) is done by rapier's KinematicCharacter-
// Controller. This file only computes the DESIRED movement each frame -
// horizontal wish direction + accumulated velocity with ice-drift friction,
// vertical gravity + jump - then asks rapier "what's the closest collision-
// free movement to that?" and applies the correction.

import * as THREE from 'three';
import { computeWishDelta, cameraHorizontalAxes } from 'arbelo/input-movement';
import * as SFX from '../audio/sfx.js';
import {
  CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS, EYE_OFFSET as EYE_HEIGHT_OFFSET,
  capsuleFor, centreKeepingFeet, eyeHeightFor,
} from './powerUpSpec.js';

const GRAVITY = -30.0;
const JUMP_SPEED = 9.0;
const MOVE_ACCEL_GROUND = 55.0;
const MOVE_ACCEL_AIR = 12.0;
const MAX_GROUND_SPEED = 8.5;
const MAX_AIR_SPEED = 10.5;
// The FARM's ground friction, and the default. Since 2026-08-21 each map
// brings its own (mapSpec.js FRICTION) — every map keeps ice-drift, but a
// swept rink is faster than a snow field and a wind-scoured rock terrace has
// grip. Every tuning note in the README refers to this number.
const ICE_FRICTION_GROUND = 0.96;
const ICE_FRICTION_AIR    = 0.995;
// The capsule and the eye offset now live in powerUpSpec.js, imported above.
// They moved because the power-ups do arithmetic ON them (a giant's collider
// is derived from the doorway clearance and the standing player's height), and
// two files owning the same three numbers is how that arithmetic goes quietly
// wrong. The VALUES are unchanged: 0.65 / 0.32 / 0.55.

export class Player {
  constructor(camera, physics, spawn, team, character = 'cow', opts = {}) {
    this.camera = camera;
    this.physics = physics;
    this.team = team;
    this.character = character;
    this.spawn = { ...spawn };
    this.groundFriction = opts.friction ?? ICE_FRICTION_GROUND;
    // The voxel grid, for the headroom probe the giant's camera needs. Optional
    // — without it the eye simply never ducks.
    this.grid = opts.grid ?? null;

    // rapier body + collider handles
    const { body, collider } = physics.addCharacter({
      position: { x: spawn.x, y: spawn.y + 1.0, z: spawn.z },
      halfHeight: CAPSULE_HALF_HEIGHT,
      radius: CAPSULE_RADIUS,
    });
    this.body = body;
    this.collider = collider;

    // Power-up size. 1 = the shipped player; 2 = protein shake; 0.2 = cheese
    // wheel. `capsule` is what physics is actually using right now, which is
    // NOT simply the scale times the base capsule — see capsuleFor().
    this.sizeScale = 1;
    this.capsule = capsuleFor(1);

    this.vel = new THREE.Vector3();
    this.yaw = team === 'red' ? Math.PI / 4 : Math.PI + Math.PI / 4;
    this.pitch = 0;

    this.hp = 100;
    this.alive = true;
    this.hasEnemyFlag = false;

    // Expose pos as a THREE.Vector3 driven from the body's translation so
    // the rest of the game (HUD, hazard hit-tests, etc.) can keep reading
    // player.pos.x/y/z the same way.
    this.pos = new THREE.Vector3(spawn.x, spawn.y + 1.0, spawn.z);
    this._grounded = false;
    this.jumpCount = 0;
  }

  // Grow or shrink the player. Idempotent, so game.js can call it every frame
  // from the power-up state without churning rapier.
  setSizeScale(scale) {
    if (Math.abs(scale - this.sizeScale) < 1e-6) return;
    const next = capsuleFor(scale);
    // Feet stay planted. Rapier positions a body by its CENTRE, so growing a
    // capsule about its centre buries half the growth in the floor — a giant
    // born a metre underground, a mouse born hovering.
    const t = this.body.translation();
    const y = centreKeepingFeet(t.y, this.capsule.total, next.total);
    const ok = this.physics.setCharacterSize?.(this.collider, next.halfHeight, next.radius);
    if (ok === false) return;         // rapier refused: stay exactly as we were
    this.body.setNextKinematicTranslation({ x: t.x, y, z: t.z });
    this.pos.y = y;
    this.sizeScale = scale;
    this.capsule = next;
  }

  // The clear air above the player's head, in metres, or Infinity under open
  // sky. Only a player BIGGER than normal can ever be limited by it, so the
  // probe is skipped entirely at 1x and below — this runs every frame.
  headroom() {
    if (!this.grid || this.sizeScale <= 1) return Infinity;
    const feet = this.pos.y - this.capsule.total / 2;
    const x = this.pos.x, z = this.pos.z;
    for (let y = Math.floor(feet) + 1; y < feet + 7; y++) {
      // inBounds FIRST: voxelGrid.get() answers STONE outside the array, so an
      // unguarded probe finds a ceiling directly above every player standing
      // under the open sky at the top of the world (styles/voxel.md).
      if (!this.grid.inBounds(x | 0, y, z | 0)) return Infinity;
      if (this.grid.isSolid(x, y + 0.5, z)) return y - feet;
    }
    return Infinity;
  }

  respawn() {
    // Back to normal size FIRST — the spawn Y below assumes a normal capsule,
    // and a giant respawning at a giant's height drops a metre on arrival.
    // (game.js also drops the power-up on death; this is the belt to its
    // braces, because respawn() is reachable from the out-of-world guard too.)
    this.setSizeScale(1);
    const t = { x: this.spawn.x, y: this.spawn.y + 1.0, z: this.spawn.z };
    // HARD teleport, not just a kinematic target.
    //
    // `setNextKinematicTranslation` only takes effect on the next physics
    // step — and `update()` runs BEFORE that step, reads `body.translation()`
    // (still the place you died), adds this frame's movement to it and calls
    // setNextKinematicTranslation again with the result. The respawn target
    // was overwritten before it was ever applied, so you carried on standing
    // where you were killed. `setTranslation` moves the body immediately, so
    // the next update() reads the base. Bryan: "when I die and re-spawn, I
    // should re-spawn at base."
    this.body.setTranslation(t, true);
    this.body.setNextKinematicTranslation(t);
    this.pos.set(t.x, t.y, t.z);
    this.vel.set(0, 0, 0);
    this.hp = 100;
    this.alive = true;
    this.hasEnemyFlag = false;
  }

  addMouseLook(dx, dy, sensitivity = 0.002) {
    // Empirical convention (Bryan on iOS Safari, 2026-08-20):
    //   drag RIGHT -> view rotates RIGHT (world -X comes into view when
    //     starting from looking +Z), which under my yaw formula
    //     dir = (sin yaw, 0, cos yaw) means yaw DECREASES.
    //   drag DOWN -> look DOWN (pitch decreases).
    this.yaw   -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    const lim = Math.PI / 2 - 0.05;
    if (this.pitch >  lim) this.pitch =  lim;
    if (this.pitch < -lim) this.pitch = -lim;
  }

  update(dt, input) {
    // -- Read input, derive world movement from the actual camera vectors --
    // See web-engine/input/movementMath.js for the pure function + tests.
    // No more sin/cos yaw arithmetic in game code - the camera is the truth.
    const { forward, right } = cameraHorizontalAxes(this.camera, THREE);
    const delta = computeWishDelta(forward, right, {
      forward: input.isDown('moveForward'),
      back:    input.isDown('moveBack'),
      right:   input.isDown('moveRight'),
      left:    input.isDown('moveLeft'),
    });
    const wx = delta.x, wz = delta.z;

    // -- Horizontal accel + ice-drift friction + speed cap --
    const accel = this._grounded ? MOVE_ACCEL_GROUND : MOVE_ACCEL_AIR;
    this.vel.x += wx * accel * dt;
    this.vel.z += wz * accel * dt;
    const fricBase = this._grounded ? this.groundFriction : ICE_FRICTION_AIR;
    const fric = Math.pow(fricBase, dt * 60);
    this.vel.x *= fric;
    this.vel.z *= fric;
    const cap = this._grounded ? MAX_GROUND_SPEED : MAX_AIR_SPEED;
    const hsp = Math.hypot(this.vel.x, this.vel.z);
    if (hsp > cap) {
      const s = cap / hsp;
      this.vel.x *= s; this.vel.z *= s;
    }

    // -- Jump (with DOUBLE JUMP: one grounded jump + one mid-air jump). --
    if (this._grounded) this._airJumpsLeft = 1;   // reset the mid-air budget each landing
    const jumpPressed = input.wasPressed('jump')
      || (input.isDown('jump') && !this._jumpingDown);
    if (jumpPressed) {
      if (this._grounded) {
        this.vel.y = JUMP_SPEED;
        this._jumpingDown = true;
        this.jumpCount++;
      } else if (this._airJumpsLeft > 0) {
        // Double jump: overwrite vertical velocity (feels snappier than
        // adding to it — you always get a fresh boost). Also play the
        // player's animal voice — moo/oink/bheee/cluck. Bryan 2026-08-20.
        this.vel.y = JUMP_SPEED * 0.95;
        this._airJumpsLeft--;
        this._jumpingDown = true;
        this.jumpCount++;
        try { SFX.animalVoice(this.character, 1.0); } catch (_) {}
      }
    }
    if (!input.isDown('jump')) this._jumpingDown = false;

    // -- Gravity --
    this.vel.y += GRAVITY * dt;
    if (this.vel.y < -30) this.vel.y = -30;

    // -- Ask rapier's character controller for the corrected movement --
    const desired = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.physics.characterCtrl.computeColliderMovement(this.collider, desired);
    const corrected = this.physics.characterCtrl.computedMovement();
    const t = this.body.translation();
    const next = { x: t.x + corrected.x, y: t.y + corrected.y, z: t.z + corrected.z };
    this.body.setNextKinematicTranslation(next);

    // Grounded state (rapier's controller knows).
    this._grounded = this.physics.characterCtrl.computedGrounded();
    // If grounded, kill downward velocity so gravity doesn't accumulate.
    if (this._grounded && this.vel.y < 0) this.vel.y = 0;
    // If we hit a ceiling, kill upward velocity.
    if (!this._grounded && Math.abs(corrected.y - desired.y) > 0.001 && this.vel.y > 0) {
      this.vel.y = 0;
    }

    // -- Mirror rapier's position to this.pos for the rest of the game --
    this.pos.set(next.x, next.y, next.z);

    // -- Move the camera --
    // At 1x this is exactly the old `next.y + EYE_HEIGHT_OFFSET`. Above 1x the
    // eye rises with the player and then DUCKS under whatever is over his head
    // — a three-metre eye inside a two-metre barn would put the camera inside
    // a roof voxel, where it sees straight through the world.
    const eye = this.sizeScale === 1
      ? EYE_HEIGHT_OFFSET + this.capsule.total / 2
      : eyeHeightFor(this.sizeScale, this.headroom());
    this.camera.position.set(next.x, next.y - this.capsule.total / 2 + eye, next.z);
    const dir = new THREE.Vector3(
      Math.cos(this.pitch) * Math.sin(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.cos(this.yaw),
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));

    // Out-of-world safety.
    if (this.pos.y < -20) this.respawn();
  }
}
