// First-person weapon viewmodel - mounted to the camera as a child, so it
// always renders at the bottom-right of the screen no matter where the
// player looks. Right now only the SHOVEL model exists; shotgun + rocket
// slots reuse the same silhouette for MVP (each slot is easy to swap in
// once we have hand-drawn viewmodel sprites per DESIGN_PRINCIPLES.md).

import * as THREE from 'three';

export class FirstPersonWeapon {
  constructor(camera) {
    this.camera = camera;
    this.rig = new THREE.Group();
    this.rig.position.set(0.35, -0.30, -0.55);   // bottom-right of the frame
    this.camera.add(this.rig);

    this._models = {
      shovel:  buildShovel(),
      shotgun: buildShotgun(),
      rocket:  buildRocket(),
    };
    for (const m of Object.values(this._models)) {
      m.visible = false;
      this.rig.add(m);
    }
    this.setWeapon('shovel');

    this._recoilT = 0;
  }

  setWeapon(id) {
    for (const [k, m] of Object.entries(this._models)) m.visible = (k === id);
    this._current = this._models[id];
  }

  // Play a small recoil kick (called from game.js when we fire).
  kick() { this._recoilT = 0.15; }

  update(dt) {
    // Recoil back-and-forward: quick pull-back, slower return.
    if (this._recoilT > 0) {
      this._recoilT -= dt;
      const k = Math.max(0, this._recoilT / 0.15);
      this.rig.position.z = -0.55 + k * 0.18;
      this.rig.rotation.x = -k * 0.35;
    } else {
      this.rig.position.z = -0.55;
      this.rig.rotation.x = 0;
    }
  }
}

// -- Models (# PLACEHOLDER ART) --------------------------------------------

function buildShovel() {
  const g = new THREE.Group();
  // Wooden handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0x8a5a2b, flatShading: true }),
  );
  handle.rotation.x = Math.PI / 4;
  handle.position.set(0, 0, 0);
  g.add(handle);
  // Metal spade head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.28, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x8a90a0, flatShading: true }),
  );
  head.position.set(-0.13, -0.35, 0.13);
  head.rotation.x = Math.PI / 4;
  g.add(head);
  // Poo blob sitting on the spade (visible ammo)
  const poo = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x7a5c3d, flatShading: true }),
  );
  poo.position.set(-0.13, -0.30, 0.13);
  g.add(poo);
  return g;
}

function buildShotgun() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8),
    new THREE.MeshLambertMaterial({ color: 0x3a3d44, flatShading: true }),
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.02, -0.15);
  g.add(barrel);
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.10, 0.28),
    new THREE.MeshLambertMaterial({ color: 0x7a4d2b, flatShading: true }),
  );
  stock.position.set(0, -0.06, 0.18);
  g.add(stock);
  return g;
}

function buildRocket() {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.10, 0.65, 10),
    new THREE.MeshLambertMaterial({ color: 0x555a66, flatShading: true }),
  );
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0, -0.15);
  g.add(tube);
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.14, 10),
    new THREE.MeshLambertMaterial({ color: 0xd0503e, flatShading: true }),
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, -0.5);
  g.add(nose);
  return g;
}
