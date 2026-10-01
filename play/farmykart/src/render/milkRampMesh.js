

















import * as THREE from 'three';

import {
  RAMP_LENGTH, RAMP_ANGLE_DEG, RAMP_WIDTH_FRAC, rampHeight,
} from '../../../../web-engine/kart/milkRamps.js';
import { sampleAt } from 'arbelo/trackPath';
import { surface, applyShadows } from './materials.js';













function milkMaterial() {
  return surface({
    
    
    
    
    
    
    
    color: 0xd9d5c8,
    roughness: 0.20,
    metalness: 0.02,
    envMapIntensity: 1.0,
    rim: { strength: 0.30, power: 2.4 },
  });
}


function spillMaterial() {
  return surface({
    color: 0xe6e2d4,
    roughness: 0.22,
    metalness: 0.0,
    envMapIntensity: 0.75,
    transparent: true,
    opacity: 0.85,
    
    
    
    depthWrite: false,
    
    
    unique: true,
  });
}











function buildOne(width) {
  const g = new THREE.Group();
  const h = rampHeight();
  const w = width;
  const L = RAMP_LENGTH;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const profile = new THREE.Shape();
  profile.moveTo(-L / 2, 0);
  profile.lineTo(L / 2, 0);
  profile.lineTo(L / 2, h);
  profile.closePath();

  const geo = new THREE.ExtrudeGeometry(profile, {
    depth: w, bevelEnabled: false, steps: 1,
  });
  
  
  
  
  
  geo.translate(0, 0, -w / 2);
  geo.rotateY(-Math.PI / 2);

  const ramp = new THREE.Mesh(geo, milkMaterial());
  g.add(ramp);

  
  
  
  const spill = new THREE.Mesh(new THREE.CircleGeometry(w * 0.55, 20), spillMaterial());
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.012, -L / 2 - w * 0.16);
  spill.scale.set(1, 1, 0.55);
  g.add(spill);

  return g;
}








export function buildMilkRamps(path, track) {
  const group = new THREE.Group();
  group.name = 'milk-ramps';
  const ramps = track && track.ramps;
  if (!path || !ramps || !ramps.length) return group;

  for (const ramp of ramps) {
    const at = sampleAt(path, ramp.at * path.length);
    const width = Math.max(4, (at.width ?? 40) * RAMP_WIDTH_FRAC);
    const one = buildOne(width);
    one.position.set(at.x, at.y, at.z);
    
    
    
    
    one.rotation.y = Math.atan2(at.tx, at.tz);
    group.add(one);
  }

  
  
  
  
  applyShadows(group, 'milkRamp');
  return group;
}
