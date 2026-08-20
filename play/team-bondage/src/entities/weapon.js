// Three weapons for Team Bondage:
//   0 Pistol   - fast semi-auto, 1 shot per click, hitscan
//   1 Shotgun  - 7-pellet cone spread, hitscan
//   2 Rocket   - slow projectile, gravity, splash damage
//
// Ammo is infinite; each weapon has a fire-rate cooldown so spam is limited.

import * as THREE from 'three';

export const WEAPON_DEFS = [
  // Bullets do 2 damage per hit (100 HP; kills take 50 hits). Rocket is not a
  // bullet - it's explosive, so it keeps its larger damage numbers.
  { id: 'pistol',  name: 'Pistol',   cooldown: 0.20, damage: 2,  pellets: 1, spread: 0.003, kind: 'hitscan' },
  { id: 'shotgun', name: 'Shotgun',  cooldown: 0.75, damage: 2,  pellets: 7, spread: 0.10,  kind: 'hitscan' },
  { id: 'rocket',  name: 'Rocket',   cooldown: 1.10, damage: 60, splash: 30, splashRadius: 3.0, projectileSpeed: 20, kind: 'projectile' },
];

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.slot = 0;
    this.cooldown = 0;
    this.projectiles = [];
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    // Advance projectiles (gravity + drag).
    for (const p of this.projectiles) {
      p.age += dt;
      p.vel.y -= 9.8 * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
    }
    // Cull expired.
    this.projectiles = this.projectiles.filter((p) => {
      if (p.age > 5) { this.scene.remove(p.mesh); return false; }
      return true;
    });
  }

  selectSlot(i) {
    if (i >= 0 && i < WEAPON_DEFS.length) this.slot = i;
  }

  currentDef() { return WEAPON_DEFS[this.slot]; }

  // Called on click. Returns an array of "shots" to broadcast to peers +
  // apply locally (see game.js).
  tryFire(originPos, dirVec, rng, ownerId) {
    if (this.cooldown > 0) return [];
    const def = this.currentDef();
    this.cooldown = def.cooldown;
    const shots = [];

    if (def.kind === 'hitscan') {
      for (let i = 0; i < def.pellets; i++) {
        // Apply random spread cone.
        const jx = (rng.next() - 0.5) * def.spread * 2;
        const jy = (rng.next() - 0.5) * def.spread * 2;
        const d = new THREE.Vector3().copy(dirVec);
        d.x += jx; d.y += jy;
        d.normalize();
        shots.push({
          kind: 'hitscan',
          origin: originPos.toArray(),
          dir: d.toArray(),
          damage: def.damage,
          weaponId: def.id,
          ownerId,
        });
      }
    } else if (def.kind === 'projectile') {
      const pos = originPos.clone().addScaledVector(dirVec, 0.6);
      const vel = dirVec.clone().multiplyScalar(def.projectileSpeed);
      shots.push({
        kind: 'projectile',
        origin: pos.toArray(),
        vel: vel.toArray(),
        damage: def.damage,
        splash: def.splash,
        splashRadius: def.splashRadius,
        weaponId: def.id,
        ownerId,
      });
    }
    return shots;
  }

  // Add a projectile to the local scene (for visualisation only; damage is
  // resolved in game.js).
  spawnProjectileMesh(shot) {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.fromArray(shot.origin);
    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      pos: new THREE.Vector3().fromArray(shot.origin),
      vel: new THREE.Vector3().fromArray(shot.vel),
      shot, age: 0,
    });
  }
}
