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
  // The pistol is themed as a "shovel that flings poo pellets" - identical
  // stats to a plain pistol, but the projectile visual is a brown ball with
  // a bullet-sound pew.
  // Bryan 2026-08-20: hits do 8 damage (up from 2). ~13 shovel hits to kill
  // a 100-HP player — punchy without being one-shot.
  // Design pass 2026-08-21: shotgun kept 8 dmg/pellet per Bryan's ask, but
  // pellets trimmed 7 → 5. At point-blank a full connect is 40 (2.5 shots
  // to kill), not 56 (near-instant delete). Full TTK table: docs/GAME_DESIGN.md.
  // Bryan 2026-08-21: +50% damage across the board. 8→12, 60→90, 30→45.
  // The shotgun's full 5-pellet connect is now 60 — still not a one-shot, so
  // the "only the chicken may one-shot" rule in GAME_DESIGN.md holds.
  { id: 'shovel',  name: 'Shovel',   cooldown: 0.20, damage: 12, pellets: 1, spread: 0.003, kind: 'hitscan', projectileColor: 0x7a5c3d, tracerColor: 0x7a5c3d },
  { id: 'shotgun', name: 'Shotgun',  cooldown: 0.75, damage: 12, pellets: 5, spread: 0.10,  kind: 'hitscan', tracerColor: 0xf4c95d },
  { id: 'rocket',  name: 'Rocket',   cooldown: 1.10, damage: 90, splash: 45, splashRadius: 3.0, projectileSpeed: 20, kind: 'projectile' },
];

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.slot = 0;
    this.cooldown = 0;
    this.projectiles = [];
    // Multiplier on every weapon's cooldown. 1 normally; the cheese wheel sets
    // it to 1/1.4 for its 20 seconds ("fire 40% faster" is a rate, so the gap
    // between shots is divided, not multiplied — powerUpSpec.js).
    this.cooldownScale = 1;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    // Advance projectiles — STRAIGHT-LINE flight, no gravity, so bullets
    // don't curve down. Bryan 2026-08-20: "I already asked for bullets to
    // go on a straight trajectory and not curve".
    for (const p of this.projectiles) {
      p.age += dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
    }
    // Cull expired.
    this.projectiles = this.projectiles.filter((p) => {
      const maxAge = p.maxAge || 5;
      if (p.age > maxAge) { this.scene.remove(p.mesh); return false; }
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
    this.cooldown = def.cooldown * this.cooldownScale;
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
    const mat = new THREE.MeshBasicMaterial({ color: shot.color || 0xffcc44 });
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

  // Spawn a small, fast-flying visual for a hitscan shot's origin - just so
  // the shooter sees a puff at the muzzle. Poo pellets get a brown sphere
  // that flies straight for ~0.3s along the shot direction, then vanishes.
  spawnMuzzleFx(shot) {
    if (shot.kind !== 'hitscan') return;
    const def = WEAPON_DEFS.find((d) => d.id === shot.weaponId);
    if (!def || !def.projectileColor) return;
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: def.projectileColor });
    const mesh = new THREE.Mesh(geo, mat);
    const origin = new THREE.Vector3().fromArray(shot.origin);
    const dir    = new THREE.Vector3().fromArray(shot.dir);
    mesh.position.copy(origin).addScaledVector(dir, 0.5);
    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      pos: new THREE.Vector3().copy(mesh.position),
      vel: dir.clone().multiplyScalar(30),   // fly forward fast
      shot: { ...shot, cosmetic: true },
      age: 0,
      maxAge: 0.35,
    });
  }
}
