









import * as THREE from 'three';
import { PALETTE } from '../palette.js';
import { surface, applyShadows } from './materials.js';

const lambert = (colour, opts = {}) => surface({ color: colour, flatShading: true, ...opts });








export function buildItemBoxMesh() {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const mat = surface({
    color: PALETTE.sunflower, flatShading: true, transparent: true, opacity: 0.92,
  });
  const cube = new THREE.Mesh(geo, mat);
  group.add(cube);
  
  
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), lambert(PALETTE.barnRed));
  group.add(inner);
  group.userData.cube = cube;
  group.userData.inner = inner;
  
  
  
  
  
  
  
  
  applyShadows(group, 'itemBox');
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
































const ICON_INK = '#221f1b';









function inked(ctx, size, colour, draw, { weight = 0.055, outline = true } = {}) {
  ctx.beginPath();
  draw();
  ctx.fillStyle = colour;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = Math.max(1.25, size * weight);
    ctx.strokeStyle = ICON_INK;
    ctx.stroke();
  }
}

export function drawItemIcon(ctx, itemId, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const ink = (colour, draw, opts) => inked(ctx, s, colour, draw, opts);
  
  
  const P = (u) => s * u;
  const dot = (x, y, r) => ctx.arc(P(x), P(y), P(r), 0, Math.PI * 2);
  const oval = (x, y, rx, ry, rot = 0) => ctx.ellipse(P(x), P(y), P(rx), P(ry), rot, 0, Math.PI * 2);
  const box = (x, y, w, h, r) => ctx.roundRect(P(x), P(y), P(w), P(h), P(r));
  const poly = (pts) => {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(P(x), P(y)) : ctx.moveTo(P(x), P(y))));
    ctx.closePath();
  };
  
  
  const eye = (x, y) => ink(ICON_INK, () => dot(x, y, 0.045), { outline: false });

  switch (itemId) {
    case 'cowpat':
      
      
      ink('#7a6144', () => oval(0.5, 0.66, 0.36, 0.19));
      ink('#96764f', () => oval(0.46, 0.58, 0.20, 0.11));
      for (const [x, y] of [[0.26, 0.30], [0.44, 0.22], [0.66, 0.31]]) {
        ink('#2f2b26', () => dot(x, y, 0.045), { outline: false });
        ctx.strokeStyle = '#2f2b26';
        ctx.lineWidth = Math.max(1, s * 0.018);
        ctx.beginPath();
        ctx.moveTo(P(x - 0.05), P(y - 0.05)); ctx.lineTo(P(x + 0.05), P(y + 0.05));
        ctx.moveTo(P(x + 0.05), P(y - 0.05)); ctx.lineTo(P(x - 0.05), P(y + 0.05));
        ctx.stroke();
      }
      break;

    case 'haybale':
      
      
      ink('#e8c243', () => box(0.14, 0.30, 0.72, 0.44, 0.14));
      ink('#f2d76a', () => oval(0.30, 0.52, 0.15, 0.21));
      ctx.strokeStyle = '#8a6f2a';
      ctx.lineWidth = Math.max(1, s * 0.035);
      for (const x of [0.56, 0.72]) {
        ctx.beginPath(); ctx.moveTo(P(x), P(0.31)); ctx.lineTo(P(x), P(0.73)); ctx.stroke();
      }
      break;

    case 'egg':
      
      
      
      
      ink('#faf6ec', () => {
        ctx.moveTo(P(0.5), P(0.15));
        ctx.bezierCurveTo(P(0.70), P(0.26), P(0.82), P(0.48), P(0.82), P(0.62));
        ctx.bezierCurveTo(P(0.82), P(0.79), P(0.68), P(0.89), P(0.5), P(0.89));
        ctx.bezierCurveTo(P(0.32), P(0.89), P(0.18), P(0.79), P(0.18), P(0.62));
        ctx.bezierCurveTo(P(0.18), P(0.48), P(0.30), P(0.26), P(0.5), P(0.15));
      });
      ink('#ffffff', () => oval(0.37, 0.45, 0.07, 0.12, -0.35), { outline: false });
      break;

    case 'rooster': {
      
      
      
      
      ink('#2f2b26', () => poly([[0.30, 0.52], [0.08, 0.28], [0.10, 0.52], [0.06, 0.68], [0.30, 0.66]]));
      ink('#f6f1e6', () => oval(0.46, 0.62, 0.26, 0.21));
      ink('#b73a2a', () => poly([[0.56, 0.38], [0.61, 0.24], [0.68, 0.35],
        [0.74, 0.22], [0.78, 0.38], [0.70, 0.42]]));
      ink('#f6f1e6', () => dot(0.66, 0.44, 0.145));
      ink('#f4c95d', () => poly([[0.79, 0.44], [0.93, 0.48], [0.79, 0.52]]));
      ink('#b73a2a', () => oval(0.70, 0.57, 0.045, 0.07));
      eye(0.70, 0.41);
      break;
    }

    case 'feedbag':
    case 'tripleFeedbag': {
      
      
      
      
      
      const sack = (cx, cy, scale, grain) => {
        const X = (u) => cx + (u - 0.5) * scale;
        const Y = (v) => cy + (v - 0.5) * scale;
        ink('#c7a94f', () => {
          ctx.moveTo(P(X(0.38)), P(Y(0.34)));
          ctx.bezierCurveTo(P(X(0.30)), P(Y(0.52)), P(X(0.18)), P(Y(0.68)), P(X(0.22)), P(Y(0.82)));
          ctx.bezierCurveTo(P(X(0.26)), P(Y(0.92)), P(X(0.74)), P(Y(0.92)), P(X(0.78)), P(Y(0.82)));
          ctx.bezierCurveTo(P(X(0.82)), P(Y(0.68)), P(X(0.70)), P(Y(0.52)), P(X(0.62)), P(Y(0.34)));
          ctx.closePath();
        });
        
        ink('#8a6f2a', () => {
          ctx.roundRect(P(X(0.36)), P(Y(0.26)), P(0.28 * scale), P(0.10 * scale), P(0.04 * scale));
        });
        ink('#c7a94f', () => poly([[X(0.40), Y(0.26)], [X(0.34), Y(0.13)],
          [X(0.50), Y(0.19)], [X(0.66), Y(0.12)], [X(0.60), Y(0.26)]]));
        if (!grain) return;
        for (const [gx, gy] of [[0.42, 0.66], [0.57, 0.62], [0.50, 0.78]]) {
          ink('#f5d53a', () => {
            ctx.arc(P(X(gx)), P(Y(gy)), P(0.055 * scale), 0, Math.PI * 2);
          }, { weight: 0.035 });
        }
      };
      if (itemId === 'tripleFeedbag') {
        
        
        
        sack(0.30, 0.56, 0.62, false);
        sack(0.70, 0.56, 0.62, false);
        sack(0.50, 0.62, 0.72, true);
      } else {
        sack(0.5, 0.5, 1, true);
      }
      break;
    }

    case 'scarecrow':
      
      
      ctx.strokeStyle = ICON_INK;
      ctx.lineWidth = Math.max(1.5, s * 0.055);
      ctx.beginPath();
      ctx.moveTo(P(0.5), P(0.34)); ctx.lineTo(P(0.5), P(0.90));
      ctx.moveTo(P(0.18), P(0.52)); ctx.lineTo(P(0.82), P(0.52));
      ctx.stroke();
      ink('#b73a2a', () => poly([[0.30, 0.52], [0.70, 0.52], [0.64, 0.78], [0.36, 0.78]]));
      ink('#e0c88a', () => dot(0.5, 0.32, 0.15));
      ink('#8d7551', () => box(0.28, 0.16, 0.44, 0.08, 0.04));
      eye(0.45, 0.31);
      eye(0.56, 0.31);
      break;

    case 'thunder':
      
      
      ink('#9fb2c4', () => {
        ctx.arc(P(0.36), P(0.34), P(0.15), Math.PI * 0.9, Math.PI * 2.1);
        ctx.arc(P(0.60), P(0.32), P(0.17), Math.PI * 1.1, Math.PI * 2.0);
        ctx.closePath();
      });
      ink('#f4c95d', () => poly([[0.58, 0.30], [0.32, 0.66], [0.48, 0.66],
        [0.40, 0.92], [0.72, 0.54], [0.54, 0.54]]));
      break;

    case 'tractor':
      
      
      ink('#b73a2a', () => box(0.20, 0.44, 0.52, 0.22, 0.05));
      ink('#b73a2a', () => box(0.42, 0.24, 0.30, 0.22, 0.05));
      ink('#2b2723', () => dot(0.66, 0.68, 0.20));
      ink('#8d7551', () => dot(0.66, 0.68, 0.075), { weight: 0.035 });
      ink('#2b2723', () => dot(0.28, 0.74, 0.13));
      ink('#8d7551', () => dot(0.28, 0.74, 0.05), { weight: 0.035 });
      break;

    default:
      
      
      ink('#f4c95d', () => dot(0.5, 0.5, 0.30));
      ctx.fillStyle = ICON_INK;
      ctx.font = `700 ${Math.round(s * 0.42)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', s * 0.5, s * 0.54);
  }
}
