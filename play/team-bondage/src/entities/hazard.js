// Egg + milk-pint rain hazards.
//
// Host-authoritative: only the host spawns hazards (using a shared seed so
// same-seed worlds could later replay). Broadcasts one HAZARD_SPAWN event per
// item with {kind, x, z, spawnAt, landAt}. All peers add the falling mesh +
// ground shadow to their local scene and, on impact, deal splash damage to
// any local player within SPLASH_RADIUS.

import * as THREE from 'three';

export const HAZARD_KINDS = ['egg', 'milk'];
const SPAWN_HEIGHT = 22;      // y where items appear
const GROUND_Y = 1;           // top of the ground layer
const FALL_TIME = 2.0;        // seconds from spawn to impact
const SPLASH_RADIUS = 2.2;    // metres
const SPLASH_DAMAGE = 20;
const EXPLOSION_LIFE_SEC = 0.65;

export class HazardSystem {
  constructor(scene, grid, opts = {}) {
    this.scene = scene;
    this.grid = grid;
    this.active = [];   // { kind, x, z, spawnAt, landAt, mesh, shadow, done }
    this.opts = { intervalMs: [3000, 6000], batch: [2, 3], ...opts };
    this._egg  = makeEggMesh();
    this._milk = makeMilkMesh();
  }

  update(dt, nowMs) {
    for (const h of this.active) {
      if (h.done) continue;
      const t = Math.min(1, (nowMs - h.spawnAt) / (h.landAt - h.spawnAt));
      const y = SPAWN_HEIGHT + (GROUND_Y - SPAWN_HEIGHT) * t;
      h.mesh.position.set(h.x, y, h.z);
      // Shadow grows + darkens as impact nears.
      const s = 0.5 + t * 0.6;
      h.shadow.scale.set(s, s, s);
      h.shadow.material.opacity = 0.15 + t * 0.55;
      // Wobble
      h.mesh.rotation.x = t * 8;
      h.mesh.rotation.z = t * 5;
      if (nowMs >= h.landAt) {
        h.done = true;
        h.impactPoint = new THREE.Vector3(h.x, GROUND_Y, h.z);
        this._splashDecal(h);
        this._spawnExplosion(h);
        setTimeout(() => this._despawn(h), 800);
      }
    }
    // Update explosions (independent lifetime from hazard tiles).
    const nowSec = nowMs / 1000;
    this._explosions = (this._explosions || []).filter((ex) => {
      const t = (nowSec - ex.bornAt) / EXPLOSION_LIFE_SEC;
      if (t >= 1) { this.scene.remove(ex.mesh); return false; }
      if (ex.shard) {
        // Ballistic shard with gravity.
        const d = ex.mesh.userData;
        ex.mesh.position.x += d.vx * dt;
        ex.mesh.position.z += d.vz * dt;
        d.vy -= 9.8 * dt;
        ex.mesh.position.y += d.vy * dt;
        ex.mesh.material.opacity = (1 - t) * 0.9;
      } else {
        // Grow outward + fade (sphere)
        const s = 0.4 + t * 3.4;
        ex.mesh.scale.set(s, s, s);
        ex.mesh.material.opacity = (1 - t) * 0.85;
      }
      return true;
    });
    this.active = this.active.filter((h) => h.mesh.parent !== null || !h.done);
  }

  _spawnExplosion(h) {
    // Bright expanding sphere + a ring on the ground.
    const color = h.kind === 'egg' ? 0xf5e9c5 : 0xffe6ec;
    const geo = new THREE.SphereGeometry(0.4, 12, 10);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.85,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(h.x, GROUND_Y + 0.3, h.z);
    this.scene.add(mesh);
    if (!this._explosions) this._explosions = [];
    this._explosions.push({ mesh, bornAt: performance.now() / 1000 });

    // A dozen ejecta shards for a chunkier feel.
    for (let i = 0; i < 10; i++) {
      const shard = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.10, 0.10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      );
      shard.position.set(h.x, GROUND_Y + 0.2, h.z);
      const ang = (i / 10) * Math.PI * 2;
      shard.userData = {
        vx: Math.cos(ang) * (2 + Math.random() * 2),
        vy: 3 + Math.random() * 2,
        vz: Math.sin(ang) * (2 + Math.random() * 2),
        bornAt: performance.now() / 1000,
      };
      this.scene.add(shard);
      this._explosions.push({ mesh: shard, bornAt: performance.now() / 1000, shard: true });
    }
  }

  // Locally check: did any active-and-just-landed hazard hit `playerPos`?
  // Returns array of damage points (each a number).
  consumeHitsFor(playerPos) {
    const hits = [];
    for (const h of this.active) {
      if (!h.done || h._hitConsumed || !h.impactPoint) continue;
      const dx = playerPos.x - h.impactPoint.x;
      const dz = playerPos.z - h.impactPoint.z;
      const dy = playerPos.y - h.impactPoint.y;
      if (dx * dx + dz * dz + dy * dy * 0.25 <= SPLASH_RADIUS * SPLASH_RADIUS) {
        // Falloff: full at 0 distance, 30% at edge.
        const d = Math.hypot(dx, dz);
        const falloff = 1 - Math.min(1, d / SPLASH_RADIUS) * 0.7;
        hits.push(Math.round(SPLASH_DAMAGE * falloff));
      }
      h._hitConsumed = true;
    }
    return hits;
  }

  // Called on a peer from HAZARD_SPAWN net message.
  spawn({ kind, x, z, spawnAt, landAt }) {
    const proto = kind === 'milk' ? this._milk : this._egg;
    const mesh = proto.clone();
    mesh.position.set(x, SPAWN_HEIGHT, z);
    this.scene.add(mesh);

    // Ground shadow: red circle so the player knows where the impact will be.
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(SPLASH_RADIUS, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff4a3a, transparent: true, opacity: 0.15,
        depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, GROUND_Y + 0.01, z);
    this.scene.add(shadow);

    this.active.push({
      kind, x, z, spawnAt, landAt, mesh, shadow, done: false,
    });
  }

  _splashDecal(h) {
    // Replace shadow with a bright flash briefly
    h.shadow.material.color.setHex(h.kind === 'egg' ? 0xf5e9c5 : 0xffffff);
    h.shadow.material.opacity = 0.75;
  }

  _despawn(h) {
    this.scene.remove(h.mesh);
    this.scene.remove(h.shadow);
  }
}

// -- Meshes ----------------------------------------------------------------

function makeEggMesh() {
  const g = new THREE.SphereGeometry(0.22, 12, 10);
  // Elongate into an egg shape (Y-axis).
  g.scale(1, 1.35, 1);
  const mat = new THREE.MeshLambertMaterial({ color: 0xf5e9c5 });
  const m = new THREE.Mesh(g, mat);
  m.castShadow = false;
  return m;
}

function makeMilkMesh() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.55, 12),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  );
  group.add(body);
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.14, 12),
    new THREE.MeshLambertMaterial({ color: 0xf07a92 }),
  );
  label.position.y = 0.02;
  group.add(label);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, 0.08, 8),
    new THREE.MeshLambertMaterial({ color: 0xefe9d8 }),
  );
  cap.position.y = 0.32;
  group.add(cap);
  return group;
}

// -- Host-side scheduler ---------------------------------------------------

// The host runs this on a timer; returns an array of hazards ready to
// broadcast. Each item = { kind, x, z, spawnAt, landAt }.
export function makeHostSchedule(worldSize, rng, nowMs) {
  const count = rng.rangeI(2, 3);
  const items = [];
  for (let i = 0; i < count; i++) {
    // Stagger spawn times over ~0.6s so a wave doesn't land in one instant.
    const spawnAt = nowMs + rng.rangeI(0, 600);
    items.push({
      kind: rng.chance(0.5) ? 'egg' : 'milk',
      x: rng.rangeF(2, worldSize.x - 2),
      z: rng.rangeF(2, worldSize.z - 2),
      spawnAt,
      landAt: spawnAt + Math.round(FALL_TIME * 1000),
    });
  }
  return items;
}
