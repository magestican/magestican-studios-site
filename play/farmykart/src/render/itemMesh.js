









import * as THREE from 'three';
import { PALETTE } from '../palette.js';

const lambert = (colour, opts = {}) => new THREE.MeshLambertMaterial({ color: colour, flatShading: true, ...opts });








export function buildItemBoxMesh() {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const mat = new THREE.MeshLambertMaterial({
    color: PALETTE.sunflower, flatShading: true, transparent: true, opacity: 0.92,
  });
  const cube = new THREE.Mesh(geo, mat);
  group.add(cube);
  
  
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), lambert(PALETTE.barnRed));
  group.add(inner);
  group.userData.cube = cube;
  group.userData.inner = inner;
  return group;
}


export function animateItemBox(mesh, time, taken) {
  mesh.rotation.y = time * 1.5;
  mesh.rotation.x = Math.sin(time * 0.9) * 0.22;
  mesh.position.y = mesh.userData.baseY + Math.sin(time * 2.1 + mesh.userData.phase) * 0.22;
  const cube = mesh.userData.cube;
  const inner = mesh.userData.inner;
  if (taken) {
    mesh.visible = false;
  } else {
    mesh.visible = true;
    cube.material.opacity = 0.92;
    inner.rotation.y = -time * 2.6;
  }
}


export function buildHazardMesh(itemId) {
  switch (itemId) {
    case 'cowpat': {
      
      
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.16, 9), lambert(0x5a4630));
      base.position.y = 0.08;
      g.add(base);
      const lump = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 5), lambert(0x6b543c));
      lump.scale.set(1, 0.5, 1);
      lump.position.y = 0.18;
      g.add(lump);
      
      
      for (let i = 0; i < 3; i += 1) {
        const fly = new THREE.Mesh(new THREE.SphereGeometry(0.07, 4, 3), lambert(PALETTE.night));
        fly.position.set(Math.cos(i * 2.1) * 0.6, 0.55 + i * 0.14, Math.sin(i * 2.1) * 0.6);
        fly.userData.orbit = i * 2.1;
        g.add(fly);
      }
      g.userData.spin = 0;
      return g;
    }
    case 'haybale': {
      const g = new THREE.Group();
      const geo = new THREE.CylinderGeometry(1.0, 1.0, 1.5, 10);
      geo.rotateZ(Math.PI / 2);
      const bale = new THREE.Mesh(geo, lambert(PALETTE.hay));
      bale.position.y = 1.0;
      g.add(bale);
      
      
      for (const x of [-0.42, 0.42]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.05, 4, 10), lambert(0x8a6f2a));
        ring.rotation.y = Math.PI / 2;
        ring.position.set(x, 1.0, 0);
        g.add(ring);
      }
      return g;
    }
    case 'egg': {
      const g = new THREE.Group();
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), lambert(PALETTE.ceiling));
      egg.scale.set(0.85, 1.15, 0.85);
      egg.position.y = 0.45;
      g.add(egg);
      return g;
    }
    case 'rooster': {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 6), lambert(PALETTE.ceiling));
      body.position.y = 0.5;
      g.add(body);
      
      
      
      const comb = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 4), lambert(PALETTE.barnRed));
      comb.position.set(0, 0.92, 0.08);
      g.add(comb);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 4), lambert(PALETTE.sunflower));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.52, 0.5);
      g.add(beak);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 4), lambert(0x2f2b26));
      tail.rotation.x = -0.9;
      tail.position.set(0, 0.72, -0.42);
      g.add(tail);
      g.userData.flap = true;
      return g;
    }
    default: {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 5), lambert(PALETTE.sunflower)));
      return g;
    }
  }
}


export function animateHazard(mesh, hazard, time) {
  mesh.position.set(hazard.x, hazard.y, hazard.z);
  if (hazard.kind === 'projectile') {
    mesh.rotation.y = hazard.heading + Math.PI;
    if (mesh.userData.flap) {
      mesh.position.y = hazard.y + Math.abs(Math.sin(time * 14)) * 0.28;
      mesh.rotation.z = Math.sin(time * 14) * 0.18;
    } else {
      mesh.rotation.x = time * 9;
    }
    return;
  }
  for (const child of mesh.children) {
    if (child.userData.orbit === undefined) continue;
    const a = child.userData.orbit + time * 3.4;
    child.position.x = Math.cos(a) * 0.6;
    child.position.z = Math.sin(a) * 0.6;
    child.position.y = 0.5 + Math.sin(a * 2.3) * 0.1;
  }
}










export function drawItemIcon(ctx, itemId, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.lineJoin = 'round';
  const fill = (c) => { ctx.fillStyle = c; };
  const stroke = (c) => { ctx.strokeStyle = c; };
  const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

  switch (itemId) {
    case 'cowpat':
      fill(hex(0x6b543c));
      ctx.beginPath(); ctx.ellipse(s / 2, s * 0.62, s * 0.34, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      fill(hex(0x86694a));
      ctx.beginPath(); ctx.ellipse(s / 2, s * 0.54, s * 0.19, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      fill(hex(0x1c1a17));
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(s * (0.32 + i * 0.18), s * (0.30 + (i % 2) * 0.08), s * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'haybale':
      fill(hex(0xf5d53a));
      ctx.beginPath(); ctx.roundRect(s * 0.16, s * 0.28, s * 0.68, s * 0.46, s * 0.1); ctx.fill();
      stroke(hex(0x8a6f2a));
      for (const x of [0.36, 0.64]) {
        ctx.beginPath(); ctx.moveTo(s * x, s * 0.28); ctx.lineTo(s * x, s * 0.74); ctx.stroke();
      }
      break;
    case 'egg':
      fill(hex(0xf6f1e6));
      ctx.beginPath(); ctx.ellipse(s / 2, s * 0.54, s * 0.24, s * 0.31, 0, 0, Math.PI * 2); ctx.fill();
      stroke(hex(0xb9a98e));
      ctx.beginPath(); ctx.ellipse(s / 2, s * 0.54, s * 0.24, s * 0.31, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'rooster':
      fill(hex(0xf6f1e6));
      ctx.beginPath(); ctx.arc(s * 0.48, s * 0.58, s * 0.24, 0, Math.PI * 2); ctx.fill();
      fill(hex(0xb73a2a));
      ctx.beginPath();
      ctx.moveTo(s * 0.40, s * 0.36); ctx.lineTo(s * 0.46, s * 0.20);
      ctx.lineTo(s * 0.53, s * 0.34); ctx.lineTo(s * 0.60, s * 0.22);
      ctx.lineTo(s * 0.62, s * 0.38); ctx.closePath(); ctx.fill();
      fill(hex(0xf4c95d));
      ctx.beginPath();
      ctx.moveTo(s * 0.70, s * 0.56); ctx.lineTo(s * 0.86, s * 0.60);
      ctx.lineTo(s * 0.70, s * 0.65); ctx.closePath(); ctx.fill();
      fill(hex(0x2f2b26));
      ctx.beginPath();
      ctx.moveTo(s * 0.26, s * 0.50); ctx.lineTo(s * 0.10, s * 0.30);
      ctx.lineTo(s * 0.14, s * 0.62); ctx.closePath(); ctx.fill();
      break;
    case 'feedbag':
      fill(hex(0xc7a94f));
      ctx.beginPath(); ctx.roundRect(s * 0.26, s * 0.30, s * 0.48, s * 0.50, s * 0.06); ctx.fill();
      fill(hex(0x8a6f2a));
      ctx.beginPath(); ctx.roundRect(s * 0.30, s * 0.22, s * 0.40, s * 0.12, s * 0.05); ctx.fill();
      fill(hex(0xf5d53a));
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(s * (0.36 + (i % 3) * 0.14), s * (0.50 + Math.floor(i / 3) * 0.15), s * 0.045, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'scarecrow':
      stroke(hex(0x8d7551));
      ctx.beginPath(); ctx.moveTo(s * 0.5, s * 0.26); ctx.lineTo(s * 0.5, s * 0.84); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.20, s * 0.46); ctx.lineTo(s * 0.80, s * 0.46); ctx.stroke();
      fill(hex(0xc7a94f));
      ctx.beginPath(); ctx.arc(s * 0.5, s * 0.28, s * 0.15, 0, Math.PI * 2); ctx.fill();
      fill(hex(0xb73a2a));
      ctx.beginPath(); ctx.roundRect(s * 0.30, s * 0.46, s * 0.40, s * 0.26, s * 0.05); ctx.fill();
      break;
    case 'thunder':
      fill(hex(0xf4c95d));
      ctx.beginPath();
      ctx.moveTo(s * 0.56, s * 0.14); ctx.lineTo(s * 0.30, s * 0.54);
      ctx.lineTo(s * 0.47, s * 0.54); ctx.lineTo(s * 0.38, s * 0.88);
      ctx.lineTo(s * 0.72, s * 0.44); ctx.lineTo(s * 0.53, s * 0.44);
      ctx.closePath(); ctx.fill();
      break;
    case 'tractor':
      fill(hex(0xb73a2a));
      ctx.beginPath(); ctx.roundRect(s * 0.24, s * 0.36, s * 0.48, s * 0.26, s * 0.05); ctx.fill();
      ctx.beginPath(); ctx.roundRect(s * 0.44, s * 0.20, s * 0.24, s * 0.20, s * 0.04); ctx.fill();
      fill(hex(0x2b2723));
      ctx.beginPath(); ctx.arc(s * 0.68, s * 0.66, s * 0.19, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.32, s * 0.70, s * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    default:
      fill(hex(0xf4c95d));
      ctx.beginPath(); ctx.arc(s / 2, s / 2, s * 0.28, 0, Math.PI * 2); ctx.fill();
  }
}
