


















import * as THREE from 'three';

export const CORN = Object.freeze({
  heal: 50,             
  lifetimeMs: 20000,    
  pickupRadius: 1.8,    
  floatY: 1.1,          
  bobAmplitude: 0.18,
  bobHz: 0.9,
  spinRate: 1.4,        
});

const KERNEL = 0xf7c94a;
const KERNEL_LIT = 0xffe98f;
const HUSK = 0x5f8f37;


let _proto = null;
function protoCob() {
  if (_proto) return _proto;
  const g = new THREE.Group();

  
  
  
  const rows = 7;
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.30, 0.16),
      new THREE.MeshLambertMaterial({
        color: i % 2 ? KERNEL : KERNEL_LIT,
        flatShading: true,
        emissive: 0x3a2c00,      
      }),
    );
    seg.position.z = (t - 0.5) * 1.05;
    
    const taper = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.45;
    seg.scale.set(taper, taper, 1);
    g.add(seg);
  }

  
  
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.34, 0.44),
      new THREE.MeshLambertMaterial({ color: HUSK, flatShading: true }),
    );
    leaf.position.set(side * 0.13, 0, -0.72);
    leaf.rotation.x = 0.3 * side;
    g.add(leaf);
  }

  
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.86, 24),
    new THREE.MeshBasicMaterial({
      color: KERNEL, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.9;
  g.add(ring);

  _proto = g;
  return g;
}

export class CornDrops {
  constructor(scene) {
    this.scene = scene;
    this.drops = [];
    this._t = 0;
  }

  
  drop(pos, groundY = null) {
    if (!pos) return null;
    const mesh = protoCob().clone(true);
    const baseY = (groundY ?? pos.y) + CORN.floatY;
    mesh.position.set(pos.x, baseY, pos.z);
    this.scene.add(mesh);
    const d = { mesh, baseY, bornAt: this._t, phase: Math.random() * Math.PI * 2 };
    this.drops.push(d);
    return d;
  }

  
  
  update(dt) {
    this._t += dt;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const age = (this._t - d.bornAt) * 1000;
      if (age >= CORN.lifetimeMs) { this._remove(i); continue; }
      d.mesh.rotation.y += CORN.spinRate * dt;
      d.mesh.position.y = d.baseY
        + Math.sin(this._t * CORN.bobHz * Math.PI * 2 + d.phase) * CORN.bobAmplitude;
      
      const left = CORN.lifetimeMs - age;
      if (left < 1000) d.mesh.visible = Math.floor(left / 120) % 2 === 0;
    }
  }

  
  collect(pos) {
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      const dx = d.mesh.position.x - pos.x;
      const dz = d.mesh.position.z - pos.z;
      if (Math.hypot(dx, dz) <= CORN.pickupRadius) {
        this._remove(i);
        return CORN.heal;
      }
    }
    return 0;
  }

  _remove(i) {
    const d = this.drops[i];
    this.scene.remove(d.mesh);
    this.drops.splice(i, 1);
  }

  dispose() {
    while (this.drops.length) this._remove(0);
  }
}
