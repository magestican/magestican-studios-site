




















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


















const GATE_THEMES = {
  sunflower: { frame: 0x7c4a2d, boards: 0xf4c95d, ornament: 'sunflowers' },
  muddybottom: { frame: 0x4a3a28, boards: 0x8a6a45, ornament: 'mudsplats' },
  frostfield: { frame: 0x8fb7d9, boards: 0xeaf4fc, ornament: 'icicles' },
  millrace: { frame: 0x6d5638, boards: 0xcbb489, ornament: 'waterwheel' },
  saltmarsh: { frame: 0x6f7d6a, boards: 0xb9c4a8, ornament: 'reeds' },
  canyon: { frame: 0xa9613c, boards: 0xd9a06a, ornament: 'stones' },
};


function buildOrnament(kind, span, y0) {
  const g = new THREE.Group();
  if (kind === 'sunflowers') {
    
    const petal = paintedSurface({ color: 0xf4c95d, flatShading: true });
    const heart = paintedSurface({ color: 0x5a3a1e, flatShading: true });
    for (let i = -2; i <= 2; i += 1) {
      const head = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 10), petal);
      disc.rotation.x = Math.PI / 2;
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 8), heart);
      core.rotation.x = Math.PI / 2;
      core.position.z = 0.03;
      head.add(disc); head.add(core);
      head.position.set(i * (span / 5.4), 1.0, 0);
      g.add(head);
    }
  } else if (kind === 'mudsplats') {
    
    
    const mud = paintedSurface({ color: 0x3f3120, flatShading: true, roughness: 0.95 });
    for (let i = 0; i < 7; i += 1) {
      const splat = new THREE.Mesh(new THREE.SphereGeometry(0.5 + (i % 3) * 0.18, 7, 5), mud);
      splat.scale.z = 0.25;
      splat.position.set((i / 6 - 0.5) * span * 0.9, 0.2 + Math.sin(i * 2.1) * 0.5, 0.1);
      g.add(splat);
    }
  } else if (kind === 'icicles') {
    
    
    const ice = surface({ color: 0xdff0fc, roughness: 0.15, metalness: 0.0, flatShading: true });
    for (let i = 0; i < 11; i += 1) {
      const len = 1.0 + Math.abs(Math.sin(i * 2.4)) * 1.6;
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, len, 5), ice);
      c.rotation.x = Math.PI;
      c.position.set((i / 10 - 0.5) * span * 0.92, -0.55 - len / 2, 0);
      g.add(c);
    }
  } else if (kind === 'waterwheel') {
    
    
    const wood = paintedSurface({ color: 0x5a4630, flatShading: true });
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.14, 6, 18), wood);
    wheel.add(rim);
    for (let i = 0; i < 6; i += 1) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.9, 0.1), wood);
      spoke.rotation.z = (i / 6) * Math.PI;
      wheel.add(spoke);
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.24), wood);
      const a = (i / 6) * Math.PI * 2;
      paddle.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0);
      paddle.rotation.z = a;
      wheel.add(paddle);
    }
    wheel.position.set(-span / 2 + 0.2, -1.6, 0);
    g.add(wheel);
  } else if (kind === 'reeds') {
    
    
    const stem = paintedSurface({ color: 0x5d7042, flatShading: true });
    const head = paintedSurface({ color: 0x6b4a2a, flatShading: true });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i += 1) {
        const h = 2.4 + Math.abs(Math.sin(i * 3.1 + side)) * 1.4;
        const r = new THREE.Group();
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, h, 4), stem);
        st.position.y = h / 2;
        const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 5), head);
        hd.position.y = h + 0.1;
        r.add(st); r.add(hd);
        r.position.set(side * (span / 2 - 0.4) + Math.sin(i * 5) * 0.5,
          -GANTRY_HEIGHT + 0.3, 0.4 + Math.cos(i * 3) * 0.35);
        g.add(r);
      }
    }
    
    
    
    
    for (let i = -2; i <= 2; i += 1) {
      const h = 1.3 + Math.abs(Math.sin(i * 2.2)) * 0.6;
      const r = new THREE.Group();
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, h, 4), stem);
      st.position.y = h / 2;
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 5), head);
      hd.position.y = h + 0.15;
      r.add(st); r.add(hd);
      r.rotation.z = Math.sin(i * 3.7) * 0.12;
      r.position.set(i * (span / 5.6), 0.28, 0);
      g.add(r);
    }
  } else if (kind === 'stones') {
    
    
    const rock = paintedSurface({ color: 0xb5714a, flatShading: true, roughness: 0.9 });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(1.8 - i * 0.3, 0.75, 1.3 - i * 0.2), rock,
        );
        b.position.set(side * (span / 2 - 0.3), 0.7 + i * 0.72, 0);
        b.rotation.y = Math.sin(i * 7 + side) * 0.2;
        g.add(b);
      }
    }
  }
  g.position.y = y0;
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
  const gt = GATE_THEMES[track?.id] ?? { frame: PALETTE.barn, boards: PALETTE.gold, ornament: null };
  const postMat = paintedSurface({ color: gt.frame, flatShading: true });

  for (const side of [1, -1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(p.x + nx * out * side, y0, p.z + nz * out * side);
    post.castShadow = true;
    group.add(post);

    
    
    
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.9, 0.16),
      paintedSurface({ color: gt.boards, flatShading: true }),
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
    paintedSurface({ color: gt.frame, flatShading: true }),
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

  
  if (gt.ornament) {
    const orn = buildOrnament(gt.ornament, span, 0);
    orn.position.set(p.x, y0 + GANTRY_HEIGHT - 0.3, p.z);
    orn.rotation.y = yaw;
    group.add(orn);
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
