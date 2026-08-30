








import * as THREE from 'three';
import { computeWishDelta, cameraHorizontalAxes } from 'arbelo/input-movement';
import { stepJump, newJumpState } from '../../../../web-engine/movement/jump.js';
import { checkFloor, clampAboveFloor, groundTopOrVoid, columnOnMap }
  from '../../../../web-engine/movement/floorRescue.js';
import { stepFreeFly, flyWish } from '../../../../web-engine/movement/freeFly.js';
import { isObserver } from '../../../../web-engine/match/observer.js';
import { groundHeightAt } from '../../../../web-engine/ai/botStep.js';
import * as SFX from '../audio/sfx.js';
import {
  CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS, EYE_OFFSET as EYE_HEIGHT_OFFSET,
  capsuleFor, centreKeepingFeet, eyeHeightFor,
} from './powerUpSpec.js';




const MOVE_ACCEL_GROUND = 55.0;
const MOVE_ACCEL_AIR = 12.0;
const MAX_GROUND_SPEED = 8.5;
const MAX_AIR_SPEED = 10.5;




const ICE_FRICTION_GROUND = 0.96;
const ICE_FRICTION_AIR    = 0.995;









const OBSERVER_LIFT = 6.0;

export class Player {
  constructor(camera, physics, spawn, team, character = 'cow', opts = {}) {
    this.camera = camera;
    this.physics = physics;
    this.team = team;
    this.character = character;
    this.spawn = { ...spawn };
    this.groundFriction = opts.friction ?? ICE_FRICTION_GROUND;
    
    
    this.observer = isObserver(team);
    
    
    this.grid = opts.grid ?? null;

    
    const { body, collider } = physics.addCharacter({
      position: { x: spawn.x, y: spawn.y + 1.0, z: spawn.z },
      halfHeight: CAPSULE_HALF_HEIGHT,
      radius: CAPSULE_RADIUS,
    });
    this.body = body;
    this.collider = collider;

    
    
    
    this.sizeScale = 1;
    this.capsule = capsuleFor(1);

    this.vel = new THREE.Vector3();
    this.yaw = team === 'red' ? Math.PI / 4 : Math.PI + Math.PI / 4;
    this.pitch = 0;

    this.hp = 100;
    this.alive = true;
    this.hasEnemyFlag = false;

    
    
    
    this.pos = new THREE.Vector3(spawn.x, spawn.y + 1.0, spawn.z);
    this._grounded = false;
    this.jumpCount = 0;
    
    this._jump = newJumpState();
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  rebindWorld(physics, spawn, opts = {}) {
    this.physics = physics;
    this.spawn = { ...spawn };
    
    
    
    if (opts.grid !== undefined) this.grid = opts.grid;
    
    
    if (opts.friction != null) this.groundFriction = opts.friction;
    
    
    this.sizeScale = 1;
    this.capsule = capsuleFor(1);
    const { body, collider } = physics.addCharacter({
      position: { x: spawn.x, y: spawn.y + 1.0, z: spawn.z },
      halfHeight: this.capsule.halfHeight,
      radius: this.capsule.radius,
    });
    
    this.body = body;
    this.collider = collider;
    this.respawn();
  }

  
  
  setSizeScale(scale) {
    if (Math.abs(scale - this.sizeScale) < 1e-6) return;
    const next = capsuleFor(scale);
    
    
    
    const t = this.body.translation();
    let y = centreKeepingFeet(t.y, this.capsule.total, next.total);
    
    
    
    
    
    
    
    if (this.grid) {
      
      
      
      
      y = clampAboveFloor(y, next.total, groundTopOrVoid(
        columnOnMap(this.grid, this.pos.x, this.pos.z),
        groundHeightAt(this.grid, this.pos.x, this.pos.z, t.y),
      ));
    }
    const ok = this.physics.setCharacterSize?.(this.collider, next.halfHeight, next.radius);
    if (ok === false) return;         
    this.body.setNextKinematicTranslation({ x: t.x, y, z: t.z });
    this.pos.y = y;
    this.sizeScale = scale;
    this.capsule = next;
  }

  
  
  
  headroom() {
    if (!this.grid || this.sizeScale <= 1) return Infinity;
    const feet = this.pos.y - this.capsule.total / 2;
    const x = this.pos.x, z = this.pos.z;
    for (let y = Math.floor(feet) + 1; y < feet + 7; y++) {
      
      
      
      if (!this.grid.inBounds(x | 0, y, z | 0)) return Infinity;
      if (this.grid.isSolid(x, y + 0.5, z)) return y - feet;
    }
    return Infinity;
  }

  respawn() {
    
    
    
    
    this.setSizeScale(1);
    const t = { x: this.spawn.x, y: this.spawn.y + 1.0, z: this.spawn.z };
    
    
    
    
    
    
    
    
    
    
    this.body.setTranslation(t, true);
    this.body.setNextKinematicTranslation(t);
    this.pos.set(t.x, t.y, t.z);
    this.vel.set(0, 0, 0);
    
    
    this._jump = newJumpState();
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

  
  _rescueFromFloor() {
    if (!this.grid || !this.body) return false;
    const t = this.body.translation();
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const feetY = t.y - this.capsule.total / 2;
    const feetSolid = this.grid.isSolid
      ? this.grid.isSolid(Math.floor(t.x), Math.floor(feetY + 0.05), Math.floor(t.z))
      : null;
    const fix = checkFloor({
      centreY: t.y,
      capsuleTotal: this.capsule.total,
      feetInSolid: feetSolid,
      groundTop: groundTopOrVoid(
        columnOnMap(this.grid, t.x, t.z),
        groundHeightAt(this.grid, t.x, t.z, feetY),
      ),
    });
    if (!fix) return false;
    
    
    
    
    
    
    this.body.setTranslation({ x: t.x, y: fix.y, z: t.z }, true);
    this.pos.y = fix.y;
    if (this.vel) this.vel.y = 0;      
    console.warn(`[floor] rescued a body from below the floor (${fix.reason})`);
    return true;
  }

  
  
  
  setObserver(on) {
    const want = !!on;
    if (this.observer === want) return;
    this.observer = want;
    if (want) {
      
      
      
      this.setSizeScale(1);
      this.vel.set(0, 0, 0);
      this.alive = true;      
      this.hp = 100;
      this.hasEnemyFlag = false;
      
      
      
      this.pos.y += OBSERVER_LIFT;
      this.body.setTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z }, true);
    } else {
      
      
      
      this.vel.set(0, 0, 0);
      this._jump = newJumpState();
    }
  }

  
  
  
  
  
  
  
  
  _updateObserver(dt, input) {
    const { forward, right } = cameraHorizontalAxes(this.camera, THREE);
    
    
    
    
    
    const look = {
      x: Math.cos(this.pitch) * Math.sin(this.yaw),
      y: Math.sin(this.pitch),
      z: Math.cos(this.pitch) * Math.cos(this.yaw),
    };
    const wish = flyWish(look, right, {
      forward: input.isDown('moveForward'),
      back:    input.isDown('moveBack'),
      left:    input.isDown('moveLeft'),
      right:   input.isDown('moveRight'),
      up:      input.isDown('jump'),
      down:    input.isDown('crouch') || input.isDown('observerDown'),
    });
    const next = stepFreeFly({
      pos: this.pos, vel: this.vel, wish, dt,
      boost: input.isDown('sprint') || input.isDown('observerBoost'),
      crawl: input.isDown('observerCrawl'),
    });
    this.pos.set(next.pos.x, next.pos.y, next.pos.z);
    this.vel.set(next.vel.x, next.vel.y, next.vel.z);
    
    
    
    
    this.body.setTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z }, true);
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z });

    
    
    this.camera.position.set(this.pos.x, this.pos.y, this.pos.z);
    const dir = new THREE.Vector3(
      Math.cos(this.pitch) * Math.sin(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.cos(this.yaw),
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));
    
    
    
  }

  update(dt, input) {
    
    
    
    
    
    
    
    
    
    
    if (this.observer) return this._updateObserver(dt, input);

    
    
    
    
    
    
    
    
    this._rescueFromFloor();

    
    
    
    const { forward, right } = cameraHorizontalAxes(this.camera, THREE);
    const delta = computeWishDelta(forward, right, {
      forward: input.isDown('moveForward'),
      back:    input.isDown('moveBack'),
      right:   input.isDown('moveRight'),
      left:    input.isDown('moveLeft'),
    });
    const wx = delta.x, wz = delta.z;

    
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

    
    
    
    
    
    
    
    
    
    const jres = stepJump(this._jump, {
      velY: this.vel.y,
      grounded: this._grounded,
      jumpDown: input.isDown('jump'),
      dt,
    });
    this.vel.y = jres.velY;
    if (jres.jumped) {
      this.jumpCount++;
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (jres.jumped === 'air') {
        try { this.onJumpVoice?.(); } catch (_) {}
      }
    }

    
    
    

    
    const desired = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.physics.characterCtrl.computeColliderMovement(this.collider, desired);
    const corrected = this.physics.characterCtrl.computedMovement();
    const t = this.body.translation();
    const next = { x: t.x + corrected.x, y: t.y + corrected.y, z: t.z + corrected.z };
    this.body.setNextKinematicTranslation(next);

    
    this._grounded = this.physics.characterCtrl.computedGrounded();
    
    if (this._grounded && this.vel.y < 0) this.vel.y = 0;
    
    if (!this._grounded && Math.abs(corrected.y - desired.y) > 0.001 && this.vel.y > 0) {
      this.vel.y = 0;
    }

    
    this.pos.set(next.x, next.y, next.z);

    
    
    
    
    
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

    
    if (this.pos.y < -20) this.respawn();
  }
}
