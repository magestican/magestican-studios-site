




















import * as THREE from 'three';

import { sampleAt } from 'arbelo/trackPath';
import { surface, paintedSurface } from './materials.js';
import { PALETTE } from '../palette.js';


const GANTRY_HEIGHT = 6.4;


function chequerTexture(cols = 8, rows = 2, size = 128) {
  const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!c) return null;
  c.width = size; c.height = Math.max(2, Math.round((size / cols) * rows));
  const g = c.getContext('2d');
  const cw = c.width / cols;
  const ch = c.height / rows;
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      g.fillStyle = (i + j) % 2 === 0 ? '#f6f1e6' : '#1c1a17';
      g.fillRect(i * cw, j * ch, cw + 1, ch + 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}










function buildFlag(colourA, colourB) {
  const g = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 2.5, 6),
    surface({ color: PALETTE.fence, flatShading: true }),
  );
  pole.position.y = 1.25;
  g.add(pole);

  const SEGMENTS = 6;
  const segW = 0.26;
  const cloth = new THREE.Group();
  cloth.position.set(0, 2.24, 0);
  
  
  
  
  
  
  
  
  
  const segs = [];
  let parent = cloth;
  for (let i = 0; i < SEGMENTS; i += 1) {
    const geo = new THREE.PlaneGeometry(segW, 0.78);
    geo.translate(segW / 2, 0, 0);
    const seg = new THREE.Mesh(
      geo,
      
      
      surface({
        color: i % 2 === 0 ? colourA : colourB,
        flatShading: true, side: THREE.DoubleSide, rim: false,
      }),
    );
    seg.position.x = i === 0 ? 0 : segW;
    seg.userData.i = i;
    segs.push(seg);
    parent.add(seg);
    parent = seg;
  }
  g.add(cloth);
  g.userData.segs = segs;
  return g;
}


function buildMarshal(tint) {
  const g = new THREE.Group();
  
  
  
  
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.34, 1.15, 7),
    surface({ color: tint, flatShading: true }),
  );
  body.position.y = 0.58;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.25, 0),
    surface({ color: 0xe8c9a0, flatShading: true }),
  );
  head.position.y = 1.38;
  head.castShadow = true;
  g.add(head);

  
  
  const armGeo = new THREE.BoxGeometry(0.14, 0.72, 0.14);
  armGeo.translate(0, -0.36, 0);
  const arm = new THREE.Mesh(armGeo, surface({ color: tint, flatShading: true }));
  arm.position.set(0.28, 1.24, 0);
  g.add(arm);

  const flag = buildFlag(0xf6f1e6, 0x1c1a17);
  flag.position.set(0.34, 0.42, 0.06);
  flag.rotation.z = -0.5;
  g.add(flag);

  g.userData.arm = arm;
  g.userData.flag = flag;
  return g;
}








export function buildStartGate(path, track) {
  const group = new THREE.Group();
  group.name = 'startGate';
  const p = sampleAt(path, 0);
  const half = p.width / 2;
  
  
  const out = half + 5.2;
  const yaw = Math.atan2(p.tx, p.tz);
  const nx = p.tz;
  const nz = -p.tx;
  const y0 = p.y ?? 0;

  const postGeo = new THREE.CylinderGeometry(0.22, 0.28, GANTRY_HEIGHT, 8);
  postGeo.translate(0, GANTRY_HEIGHT / 2, 0);
  const postMat = paintedSurface({ color: PALETTE.barn, flatShading: true });

  for (const side of [1, -1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(p.x + nx * out * side, y0, p.z + nz * out * side);
    post.castShadow = true;
    group.add(post);

    
    
    
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.9, 0.16),
      paintedSurface({ color: PALETTE.gold, flatShading: true }),
    );
    board.position.set(
      p.x + nx * (out - 1.1) * side,
      y0 + 3.1,
      p.z + nz * (out - 1.1) * side,
    );
    board.rotation.y = yaw;
    board.castShadow = true;
    group.add(board);
  }

  
  const span = out * 2 + 0.5;
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(span, 0.55, 0.5),
    paintedSurface({ color: PALETTE.barn, flatShading: true }),
  );
  beam.position.set(p.x, y0 + GANTRY_HEIGHT - 0.3, p.z);
  beam.rotation.y = yaw;
  beam.castShadow = true;
  group.add(beam);

  
  
  const tex = chequerTexture(16, 2);
  if (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(span, 0.62),
      surface({ map: tex, flatShading: true, side: THREE.DoubleSide, rim: false }),
    );
    strip.position.set(p.x, y0 + GANTRY_HEIGHT - 1.05, p.z + 0.01);
    strip.rotation.y = yaw;
    group.add(strip);
  }

  
  
  
  const marshals = [];
  for (const side of [1, -1]) {
    const m = buildMarshal(side > 0 ? PALETTE.barn : 0x3f6fa8);
    const mo = half + 2.9;
    m.position.set(p.x + nx * mo * side, y0, p.z + nz * mo * side);
    
    
    m.rotation.y = Math.atan2(-nz * side, -nx * side) + 0.35 * side;
    marshals.push(m);
    group.add(m);
  }

  group.userData.marshals = marshals;
  group.userData.wave = 0;
  return group;
}









export function updateStartGate(gate, time, intensity = 0) {
  if (!gate) return;
  
  
  gate.userData.wave += (intensity - gate.userData.wave) * 0.05;
  const w = gate.userData.wave;

  for (let i = 0; i < gate.userData.marshals.length; i += 1) {
    const m = gate.userData.marshals[i];
    const phase = i * 1.7;
    
    
    const rate = 1.4 + w * 6.5;
    const swing = Math.sin(time * rate + phase);
    m.userData.arm.rotation.z = -0.25 - w * (1.5 + swing * 0.85);
    m.userData.arm.rotation.x = swing * 0.3 * w;
    m.rotation.z = swing * 0.05 * w;

    
    
    const flag = m.userData.flag;
    
    
    
    
    const amp = 0.06 + w * 0.20;
    for (const seg of flag.userData.segs) {
      const k = seg.userData.i;
      seg.rotation.z = Math.sin(time * (3 + w * 7) + phase - k * 0.9) * amp;
      seg.rotation.y = Math.sin(time * (2.2 + w * 5) + phase - k * 0.7) * amp * 1.6;
    }
  }
}
