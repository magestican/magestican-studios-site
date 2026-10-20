





import * as THREE from 'three';

const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });





export function sovereignEntityView(e, g) {
  if (e.kind === 'board') {
    const pad = new THREE.Mesh(new THREE.BoxGeometry((e.w ?? 3) + 1.6, 0.25, 1.6), lam(0x8a8f9e));
    pad.position.y = 0.12;
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, (e.w ?? 3) - 0.9, 6, 14), lam(0x2fd6c8));
    hull.rotation.z = Math.PI / 2;
    hull.position.y = 0.75;
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xf4fbff));
    canopy.position.set(0.3, 1.1, 0);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 2.2), lam(0x1fb3a8));
    wing.position.y = 0.7;
    g.add(pad, hull, canopy, wing);
    return true;
  }
  if (e.kind === 'hatch') {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(e.w ?? 2, e.h ?? 2, 0.3), lam(0xe8c45a, 0x2a1e00));
    plate.position.y = (e.h ?? 2) / 2;
    const slot = new THREE.Mesh(new THREE.BoxGeometry((e.w ?? 2) * 0.5, 0.25, 0.32), lam(0x2a2a36));
    slot.position.set(0, (e.h ?? 2) * 0.55, 0.02);
    g.add(plate, slot);
    return true;
  }
  return false;
}
