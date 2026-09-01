

















import * as THREE from 'three';

import {
  RAMP_LENGTH, RAMP_ANGLE_DEG, RAMP_WIDTH_FRAC, rampHeight,
} from '../../../../web-engine/kart/milkRamps.js';
import { sampleAt } from 'arbelo/trackPath';
import { surface, applyShadows } from './materials.js';
import { makeMilkTexture } from './textures.js';













let MILK_MAPS = null;
function milkMaps() {
  if (MILK_MAPS === null) MILK_MAPS = makeMilkTexture() ?? false;
  return MILK_MAPS || {};
}

function milkMaterial() {
  const m = milkMaps();
  return surface({
    
    
    
    
    
    map: m.map ?? null,
    roughnessMap: m.roughnessMap ?? null,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    color: 0xb6bcb6,
    
    
    roughness: 0.85,
    metalness: 0.03,
    envMapIntensity: 1.05,
    rim: { strength: 0.34, power: 2.2 },
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

  
  
  
  const dripMat = milkMaterial();
  for (let i = 0; i < 6; i += 1) {
    const t = (i + 0.5) / 6;
    const len = 0.22 + Math.abs(Math.sin(i * 2.9)) * 0.5;
    const drip = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.07, len, 3, 6), dripMat,
    );
    drip.position.set((t - 0.5) * w * 0.86, h - len * 0.45, L / 2 + 0.06);
    g.add(drip);
  }

  
  
  
  
  
  
  const puddle = new THREE.Shape();
  const pts = 12;
  for (let i = 0; i <= pts; i += 1) {
    const ang = (i / pts) * Math.PI * 2;
    const rad = w * (0.5 + Math.sin(i * 2.3) * 0.09 + Math.sin(i * 5.1) * 0.05);
    const px = Math.cos(ang) * rad;
    const pz = Math.sin(ang) * rad * 0.6;
    if (i === 0) puddle.moveTo(px, pz); else puddle.lineTo(px, pz);
  }
  const spill = new THREE.Mesh(new THREE.ShapeGeometry(puddle), spillMaterial());
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.012, -L / 2 - w * 0.16);
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
