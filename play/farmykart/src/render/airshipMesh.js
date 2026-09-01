


















import * as THREE from 'three';

import { surface, applyShadows } from './materials.js';


export const ENVELOPE_LENGTH = 26;
export const ENVELOPE_RADIUS = 5.4;












function envelope() {
  const geo = new THREE.SphereGeometry(ENVELOPE_RADIUS, 22, 14);
  
  
  
  
  
  geo.scale(0.72, 0.72, ENVELOPE_LENGTH / (ENVELOPE_RADIUS * 2));
  const m = new THREE.Mesh(geo, surface({
    
    
    
    
    color: 0xcdc6b4, roughness: 0.62, metalness: 0.0, envMapIntensity: 0.55,
    rim: { strength: 0.45, power: 1.9 },
  }));
  return m;
}











function patches() {
  const g = new THREE.Group();
  const mat = surface({ color: 0x2b2622, roughness: 0.7, metalness: 0.0 });
  const spots = [
    { z: -6.5, a: 0.7, s: 2.6 }, { z: 1.5, a: 2.4, s: 3.2 },
    { z: 6.0, a: 4.1, s: 2.2 }, { z: -1.5, a: 5.2, s: 2.8 },
  ];
  
  
  
  
  
  
  const rx = ENVELOPE_RADIUS * 0.72;
  for (const sp of spots) {
    const geo = new THREE.SphereGeometry(sp.s * 0.6, 12, 8);
    geo.scale(1, 1, 0.5);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(Math.cos(sp.a) * rx * 0.88, Math.sin(sp.a) * rx * 0.88, sp.z);
    m.lookAt(0, 0, sp.z);
    g.add(m);
  }
  return g;
}


function fins() {
  const g = new THREE.Group();
  const mat = surface({ color: 0xc4302b, roughness: 0.5, metalness: 0.05 });
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(4.4, 1.2);
  shape.lineTo(4.4, 3.6);
  shape.lineTo(0, 4.2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  geo.translate(0, 0, -0.11);
  for (let i = 0; i < 4; i += 1) {
    const f = new THREE.Mesh(geo, mat);
    f.rotation.z = (i / 4) * Math.PI * 2 + Math.PI / 4;
    f.rotation.y = Math.PI / 2;
    f.position.z = ENVELOPE_LENGTH / 2 - 4.6;
    g.add(f);
  }
  return g;
}


function gondola() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.5, 6.2),
    surface({ color: 0x8a5a32, roughness: 0.62, metalness: 0.04 }),
  );
  body.position.y = -ENVELOPE_RADIUS * 0.72 - 1.4;
  g.add(body);

  
  const strutMat = surface({ color: 0x4a4038, roughness: 0.6, metalness: 0.2 });
  for (const z of [-2.2, 2.2]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), strutMat);
    strut.position.set(0, -ENVELOPE_RADIUS * 0.72 - 0.5, z);
    g.add(strut);
  }
  return g;
}






export function buildAirship() {
  const g = new THREE.Group();
  g.name = 'rescue-airship';
  g.add(envelope());
  g.add(patches());
  g.add(fins());
  g.add(gondola());

  
  
  
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 1, 5),
    surface({ color: 0x2e2a25, roughness: 0.8, metalness: 0.05 }),
  );
  cable.name = 'cable';
  g.add(cable);

  applyShadows(g, 'airship');
  g.visible = false;
  return g;
}









export function updateAirship(ship, kart, height, t = 0) {
  if (!ship) return;
  if (!kart) { ship.visible = false; return; }
  ship.visible = true;

  
  
  const above = 11;
  
  
  const bob = Math.sin(t * 0.9) * 0.5 + Math.sin(t * 0.37 + 1.1) * 0.3;
  ship.position.set(kart.x, kart.y + above + bob, kart.z);
  ship.rotation.y = kart.heading ?? 0;
  
  ship.rotation.x = -0.05;

  const cable = ship.getObjectByName('cable');
  if (cable) {
    
    const from = -ENVELOPE_RADIUS * 0.72 - 2.1;
    const to = -(above + bob) + 0.6;
    const len = Math.max(0.2, from - to);
    cable.scale.set(1, len, 1);
    cable.position.set(0, from - len / 2, 0);
  }
  
  
  const strain = Math.min(1, height / 9);
  ship.rotation.z = Math.sin(t * 0.6) * 0.03 * (1 - strain);
}
