













import * as THREE from 'three';
import { makeBarnSignTexture, makeWoodTexture } from '../map/textures.js';



const SIGN_W = 2.6, SIGN_H = 0.62, SIGN_D = 0.09;
const ACCENT = { red: '#b73a2a', blue: '#336bbf' };


let _wood = null;
const _face = {};

export function buildBarnSign(team) {
  const group = new THREE.Group();
  group.name = `barnSign-${team}`;

  if (!_wood) _wood = makeWoodTexture();
  if (!_face[team]) _face[team] = makeBarnSignTexture(ACCENT[team] || ACCENT.red);

  
  
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(SIGN_W, SIGN_H, SIGN_D),
    new THREE.MeshLambertMaterial({ map: _wood, color: 0xb99164, flatShading: true }),
  );
  group.add(plank);

  
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(SIGN_W * 0.98, SIGN_H * 0.94),
    new THREE.MeshLambertMaterial({ map: _face[team] }),
  );
  face.position.z = SIGN_D / 2 + 0.005;
  group.add(face);

  
  
  const strapMat = new THREE.MeshLambertMaterial({ color: 0x5c5f66, flatShading: true });
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, SIGN_D + 0.03), strapMat);
      strap.position.set(sx * SIGN_W * 0.42, sy * SIGN_H * 0.36, 0);
      group.add(strap);
    }
  }
  return group;
}


export function addBarnSigns(scene, world) {
  const group = new THREE.Group();
  group.name = 'barnSigns';
  for (const team of ['red', 'blue']) {
    const a = world.barnSigns?.[team];
    if (!a) continue;
    const sign = buildBarnSign(team);
    sign.position.set(a.x, a.y, a.z);
    sign.rotation.y = a.yaw;
    
    
    sign.rotation.z = (team === 'red' ? 1 : -1) * 0.022;
    group.add(sign);
  }
  scene.add(group);
  return group;
}
