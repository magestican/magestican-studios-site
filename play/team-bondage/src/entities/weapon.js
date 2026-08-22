






import * as THREE from 'three';

export const WEAPON_DEFS = [
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  { id: 'shovel',  name: 'Shovel',   cooldown: 0.20, damage: 12, pellets: 1, spread: 0.003, kind: 'projectile', projectileSpeed: 62, hitRadius: 0.95, projectileColor: 0x7a5c3d, tracerColor: 0x7a5c3d },
  { id: 'shotgun', name: 'Shotgun',  cooldown: 0.75, damage: 12, pellets: 5, spread: 0.10,  kind: 'projectile', projectileSpeed: 78, hitRadius: 0.85, projectileColor: 0xf4c95d, tracerColor: 0xf4c95d },
  { id: 'rocket',  name: 'Rocket',   cooldown: 1.10, damage: 90, splash: 45, splashRadius: 3.0, projectileSpeed: 20, kind: 'projectile' },
];

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.slot = 0;
    this.cooldown = 0;
    this.projectiles = [];
    
    
    
    this.cooldownScale = 1;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    
    
    
    for (const p of this.projectiles) {
      p.age += dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
    }
    
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

  
  
  tryFire(originPos, dirVec, rng, ownerId) {
    if (this.cooldown > 0) return [];
    const def = this.currentDef();
    this.cooldown = def.cooldown * this.cooldownScale;
    const shots = [];

    if (def.kind === 'hitscan') {
      for (let i = 0; i < def.pellets; i++) {
        
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

  
  
  spawnProjectileMesh(shot) {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: shot.color || 0xffcc44 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.fromArray(shot.origin);
    this.scene.add(mesh);
    const rec = {
      mesh,
      pos: new THREE.Vector3().fromArray(shot.origin),
      vel: new THREE.Vector3().fromArray(shot.vel),
      shot, age: 0,
    };
    this.projectiles.push(rec);
    
    
    return rec;
  }

  
  
  
  despawnProjectile(rec) {
    const i = this.projectiles.indexOf(rec);
    if (i >= 0) this.projectiles.splice(i, 1);
    this.scene.remove(rec.mesh);
    rec.mesh.geometry?.dispose?.();
    rec.mesh.material?.dispose?.();
  }

  
  
  
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
      vel: dir.clone().multiplyScalar(30),   
      shot: { ...shot, cosmetic: true },
      age: 0,
      maxAge: 0.35,
    });
  }
}
