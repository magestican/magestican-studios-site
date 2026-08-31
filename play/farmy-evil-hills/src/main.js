






















import * as THREE from 'three';

import { solve, RIG as FRIG, ARCH } from '../../2d-fighter-ex/src/animeRig.mjs';
import { poseById } from '../../2d-fighter-ex/src/moveSet.mjs';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter, jointBall } from '../../../web-engine/ps1/ps1Mesh.mjs';
import { head3d, hair3d } from '../../../web-engine/ps1/ps1Head.mjs';
import { buildChicken } from '../../../web-engine/ps1/creatures/chicken.mjs';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';




import { lockZoom } from '../../shared/input/zoomLock.js';

import { emptyCamera, stepCamera, cameraPlacement } from '../../../web-engine/horror/camera.js';
import { spawnVitals, tickVitals, damage, beginGrapple, endGrapple, MAX_HEALTH, CHICKEN_LATCH_SLOW } from '../../../web-engine/horror/health.js';
import { spawn as spawnCreature, resolveHit, applyDamage, mobilityOf, statusOf } from '../../../web-engine/horror/dismemberment.js';
import { readyWeapon, tickWeapon, canFire, fire } from '../../../web-engine/horror/weapons.js';
import { createStruggle, VERB_FOR, promptFor } from '../../../web-engine/horror/struggle.js';
import { initAnalytics, trackEvent } from 'arbelo/analytics';

const XANDER_H = 1.80;
const CHICKEN_H = 0.72;
const HALL_W = 3.2;
















const HALL_H = 3.6;




const CEIL_CULL = 11;








const WALL_H = 6.4;










const HALL_LEN = 64;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));








const XCOL = {
  top: 0xb8503a,      
  pant: 0x3d5486,     
  accent: 0x6b452a,   
  skin: 0xe8b590,
  hair: 0xcfae5e,     
                      
                      
  eye: 0x2f6fd0,      
};
const CCOL = {
  torso: 0xb9b07a, wingL: 0xa89a68, wingR: 0xa89a68, tail: 0x8d8352,
  head: 0xc9a98c, beak: 0xd8c27a, comb: 0x8e3b46,
  legL: 0xc4a06d, legR: 0xc4a06d, eyeL: 0x241a1c, eyeR: 0x241a1c,
};









function partsToGeometry(parts, colourOf, targetHeight, measureAgainst, keepUv) {
  let lo = Infinity; let hi = -Infinity;
  
  
  
  
  for (const p of (measureAgainst || parts)) {
    for (let i = 2; i < p.mesh.positions.length; i += 3) {
      if (p.mesh.positions[i] < lo) lo = p.mesh.positions[i];
      if (p.mesh.positions[i] > hi) hi = p.mesh.positions[i];
    }
  }
  const s = (hi - lo) > 1e-6 ? targetHeight / (hi - lo) : 1;

  const pos = []; const col = []; const idx = [];
  for (const p of parts) {
    const base = pos.length / 3;
    const c = new THREE.Color(colourOf(p.name));
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      pos.push(
        p.mesh.positions[i] * s,
        p.mesh.positions[i + 1] * s,
        (p.mesh.positions[i + 2] - lo) * s,   
      );
      col.push(c.r, c.g, c.b);
    }
    for (const i of p.mesh.indices) idx.push(base + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  
  
  if (keepUv) {
    const uvs = [];
    for (const p of parts) {
      const src = p.mesh.uvs || [];
      for (let i = 0; i < (p.mesh.positions.length / 3) * 2; i += 1) uvs.push(src[i] ?? 0);
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  } else {
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  }
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}





























const FACE_PX = 128;













const EXPRESSIONS = Object.freeze({
  calm: { brow: 0, open: 1, lid: 1, mouth: 0 },
  alert: { brow: -0.055, open: 1.18, lid: 0.82, mouth: 0.10 },
  afraid: { brow: -0.095, open: 1.36, lid: 0.62, mouth: 0.38 },
  hurt: { brow: 0.045, open: 0.52, lid: 1.5, mouth: 0.30 },
});

function xanderFaceSheet(exprName = 'calm') {
  const X = EXPRESSIONS[exprName] || EXPRESSIONS.calm;
  const cv = document.createElement('canvas');
  cv.width = FACE_PX * 2;
  cv.height = Math.round(FACE_PX / 0.75);
  const c = cv.getContext('2d');

  
  
  
  
  const SKIN = '#d3a07c';
  const SKIN_SHADE = '#b07e5e';
  const SKIN_DEEP = '#8e6247';
  const SKIN_LIT = '#e6b895';
  const HAIR = '#c8a860';
  const HAIR_DARK = '#8f7332';
  const HAIR_LIT = '#e3cb8c';
  const EYE_WHITE = '#ded6c8';        
  const IRIS = '#3a6fa8';
  const IRIS_DARK = '#1f4368';
  const LINE = '#33221a';
  const MOUTH = '#7d4436';

  c.fillStyle = SKIN;
  c.fillRect(0, 0, cv.width, cv.height);

  const sx = cv.width * 0.52;
  const wash = c.createLinearGradient(sx, 0, cv.width, 0);
  wash.addColorStop(0, SKIN);
  wash.addColorStop(1, SKIN_DEEP);
  c.fillStyle = wash;
  c.fillRect(sx, 0, cv.width - sx, cv.height);

  
  const S = FACE_PX;
  const crown = 0;
  const chin = (0.7275 / 0.75) * S;
  const r = (chin - crown) / 2.06;
  const cxp = S * 0.5;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const eyeY = crown + 1.02 * r;
  const eyeDX = r * 0.40;
  const eyeW = r * 0.30;
  const eyeH = r * 0.098 * X.open;    

  c.save();
  c.beginPath(); c.rect(0, 0, S, chin + r * 0.2); c.clip();
  c.lineJoin = 'round';
  c.lineCap = 'round';

  
  
  

  
  c.fillStyle = SKIN_SHADE;
  c.globalAlpha = 0.5;
  c.beginPath();
  c.moveTo(cxp - r * 1.02, eyeY - r * 0.62);
  c.quadraticCurveTo(cxp - r * 0.92, chin - r * 0.28, cxp - r * 0.30, chin - r * 0.02);
  c.lineTo(cxp - r * 1.02, chin + r * 0.3);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(cxp + r * 1.02, eyeY - r * 0.62);
  c.quadraticCurveTo(cxp + r * 0.92, chin - r * 0.28, cxp + r * 0.30, chin - r * 0.02);
  c.lineTo(cxp + r * 1.02, chin + r * 0.3);
  c.closePath(); c.fill();
  c.globalAlpha = 1;

  
  
  c.fillStyle = SKIN_SHADE;
  c.globalAlpha = 0.55;
  c.fillRect(cxp - r * 0.78, eyeY - r * 0.30, r * 1.56, r * 0.17);
  c.globalAlpha = 1;

  
  c.fillStyle = SKIN_LIT;
  c.globalAlpha = 0.42;
  c.beginPath();
  c.ellipse(cxp, eyeY - r * 0.62, r * 0.52, r * 0.22, 0, 0, Math.PI * 2);
  c.fill();
  for (const d of [-1, 1]) {
    c.beginPath();
    c.ellipse(cxp + d * r * 0.52, eyeY + r * 0.26, r * 0.24, r * 0.13, d * 0.22, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.28;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.ellipse(cxp + d * r * 0.50, eyeY + r * 0.56, r * 0.20, r * 0.15, d * 0.3, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  
  const eye = (dir) => {
    const ex = cxp + dir * eyeDX;

    
    c.fillStyle = SKIN_DEEP;
    c.globalAlpha = 0.30;
    c.beginPath();
    c.ellipse(ex, eyeY + eyeH * 0.2, eyeW * 1.35, eyeH * 2.1, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;

    
    c.fillStyle = EYE_WHITE;
    c.beginPath();
    c.moveTo(ex - eyeW, eyeY + eyeH * 0.10);
    c.quadraticCurveTo(ex, eyeY - eyeH * 1.30, ex + eyeW, eyeY + eyeH * 0.22);
    c.quadraticCurveTo(ex, eyeY + eyeH * 1.20, ex - eyeW, eyeY + eyeH * 0.10);
    c.fill();

    
    
    const ir = eyeH * 1.02;
    c.save();
    c.beginPath();
    c.moveTo(ex - eyeW, eyeY + eyeH * 0.10);
    c.quadraticCurveTo(ex, eyeY - eyeH * 1.30, ex + eyeW, eyeY + eyeH * 0.22);
    c.quadraticCurveTo(ex, eyeY + eyeH * 1.20, ex - eyeW, eyeY + eyeH * 0.10);
    c.clip();
    c.fillStyle = IRIS;
    c.beginPath(); c.arc(ex + dir * eyeW * 0.06, eyeY, ir, 0, Math.PI * 2); c.fill();
    c.fillStyle = IRIS_DARK;
    c.beginPath(); c.arc(ex + dir * eyeW * 0.06, eyeY, ir * 0.48, 0, Math.PI * 2); c.fill();
    c.restore();

    
    
    c.strokeStyle = LINE;
    c.lineWidth = Math.max(2, r * 0.055);
    c.beginPath();
    c.moveTo(ex - eyeW * 1.06, eyeY - eyeH * 0.05);
    c.quadraticCurveTo(ex, eyeY - eyeH * 1.55 * X.lid, ex + eyeW * 1.08, eyeY + eyeH * 0.10);
    c.stroke();
    
    c.strokeStyle = SKIN_DEEP;
    c.globalAlpha = 0.75;
    c.lineWidth = Math.max(1, r * 0.028);
    c.beginPath();
    c.moveTo(ex - eyeW * 0.86, eyeY + eyeH * 0.62);
    c.quadraticCurveTo(ex, eyeY + eyeH * 1.35, ex + eyeW * 0.90, eyeY + eyeH * 0.70);
    c.stroke();
    c.globalAlpha = 1;

    
    
    c.fillStyle = '#f4efe6';
    c.fillRect(Math.round(ex - dir * eyeW * 0.16), Math.round(eyeY - eyeH * 0.55), 2, 2);
  };
  eye(-1); eye(1);

  
  
  
  
  c.strokeStyle = HAIR_DARK;
  c.lineCap = 'butt';
  for (const dir of [-1, 1]) {
    const ex = cxp + dir * eyeDX;
    c.lineWidth = Math.max(2.6, r * 0.10);
    c.beginPath();
    c.moveTo(ex - dir * eyeW * 1.18, eyeY - r * (0.235 - X.brow));
    c.lineTo(ex + dir * eyeW * 0.95, eyeY - r * (0.30 - X.brow * 1.4));
    c.stroke();
  }
  c.lineCap = 'round';

  
  c.strokeStyle = SKIN_DEEP;
  c.globalAlpha = 0.55;
  c.lineWidth = Math.max(1.6, r * 0.045);
  c.beginPath();
  c.moveTo(cxp + r * 0.085, eyeY - r * 0.10);
  c.lineTo(cxp + r * 0.105, eyeY + r * 0.42);
  c.stroke();
  c.globalAlpha = 0.42;
  c.beginPath();
  c.ellipse(cxp, eyeY + r * 0.50, r * 0.16, r * 0.075, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = SKIN_DEEP;
  c.fillRect(Math.round(cxp - r * 0.135), Math.round(eyeY + r * 0.505), 2, 2);
  c.fillRect(Math.round(cxp + r * 0.095), Math.round(eyeY + r * 0.505), 2, 2);

  
  if (X.mouth > 0.02) {
    
    c.fillStyle = '#3a1c18';
    c.beginPath();
    c.ellipse(cxp, eyeY + r * (0.80 + X.mouth * 0.06), r * (0.13 + X.mouth * 0.10), r * X.mouth * 0.20, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = MOUTH;
  c.lineWidth = Math.max(1.8, r * 0.055);
  c.beginPath();
  c.moveTo(cxp - r * 0.20, eyeY + r * 0.79);
  c.quadraticCurveTo(cxp, eyeY + r * (0.815 + X.mouth * 0.12), cxp + r * 0.20, eyeY + r * 0.79);
  c.stroke();
  c.fillStyle = SKIN_LIT;
  c.globalAlpha = 0.45;
  c.beginPath();
  c.ellipse(cxp, eyeY + r * 0.87, r * 0.15, r * 0.055, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.24;
  c.beginPath();
  c.ellipse(cxp, eyeY + r * 0.99, r * 0.20, r * 0.07, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  
  
  c.fillStyle = SKIN_DEEP;
  for (let i = 0; i < 260; i += 1) {
    const a = hash2(i * 1.7, 3.3) * Math.PI * 2;
    const rad = 0.55 + hash2(i * 2.1, 8.8) * 0.42;
    const px = cxp + Math.cos(a) * r * rad * 0.86;
    const py = eyeY + r * 0.72 + Math.sin(a) * r * rad * 0.34;
    if (py < eyeY + r * 0.5) continue;
    c.globalAlpha = 0.10 + hash2(i, 1.1) * 0.14;
    c.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  c.globalAlpha = 1;

  
  
  
  c.fillStyle = HAIR;
  c.beginPath();
  c.moveTo(cxp - r * 1.04, crown);
  c.lineTo(cxp + r * 1.04, crown);
  c.lineTo(cxp + r * 1.04, eyeY - r * 0.60);
  c.quadraticCurveTo(cxp + r * 0.40, eyeY - r * 0.40, cxp - r * 0.10, eyeY - r * 0.50);
  c.quadraticCurveTo(cxp - r * 0.62, eyeY - r * 0.62, cxp - r * 1.04, eyeY - r * 0.34);
  c.closePath();
  c.fill();
  
  c.strokeStyle = HAIR_DARK;
  c.lineWidth = Math.max(2, r * 0.06);
  c.beginPath();
  c.moveTo(cxp + r * 0.34, crown + r * 0.02);
  c.quadraticCurveTo(cxp + r * 0.16, eyeY - r * 0.72, cxp - r * 0.34, eyeY - r * 0.52);
  c.stroke();
  c.strokeStyle = HAIR_LIT;
  c.globalAlpha = 0.55;
  c.lineWidth = Math.max(1.4, r * 0.038);
  for (const dx of [-0.72, -0.46, 0.52, 0.78]) {
    c.beginPath();
    c.moveTo(cxp + r * dx, crown + r * 0.06);
    c.lineTo(cxp + r * dx * 0.88, eyeY - r * 0.46);
    c.stroke();
  }
  c.globalAlpha = 1;
  c.restore();

  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.userData = { canvas: cv, faceSize: FACE_PX };
  return t;
}






















function makePortrait(headGeo, faces) {
  const el = document.getElementById('portrait');
  if (!el) return null;
  let current = null;
  return {
    set(expr) {
      if (expr === current || !faces[expr]) return;
      current = expr;
      paintPortrait(faces[expr]);
    },
    get expr() { return current; },
    draw() {  },
  };
}


















function paintPortrait(tex) {
  const el = document.getElementById('portrait');
  if (!el || !tex || !tex.userData || !tex.userData.canvas) return;
  const g = el.getContext('2d');
  const W = el.width; const H = el.height;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, W, H);

  
  
  g.fillStyle = '#0a1512';
  g.fillRect(0, 0, W, H);
  const pool = g.createRadialGradient(W * 0.5, H * 0.42, W * 0.06, W * 0.5, H * 0.42, W * 0.52);
  pool.addColorStop(0, 'rgba(70,110,96,0.55)');
  pool.addColorStop(1, 'rgba(10,21,18,0)');
  g.fillStyle = pool;
  g.fillRect(0, 0, W, H);

  
  
  
  const shoulderTop = H * 0.72;
  g.fillStyle = '#b8503a';                       
  g.beginPath();
  g.moveTo(W * 0.06, H);
  g.quadraticCurveTo(W * 0.16, shoulderTop, W * 0.36, shoulderTop + H * 0.05);
  g.lineTo(W * 0.64, shoulderTop + H * 0.05);
  g.quadraticCurveTo(W * 0.84, shoulderTop, W * 0.94, H);
  g.closePath();
  g.fill();
  
  g.fillStyle = '#3d5486';
  g.beginPath();
  g.moveTo(W * 0.34, H);
  g.lineTo(W * 0.34, H * 0.90);
  g.lineTo(W * 0.66, H * 0.90);
  g.lineTo(W * 0.66, H);
  g.closePath();
  g.fill();
  for (const x of [0.395, 0.605]) {
    g.beginPath();
    g.moveTo(W * (x - 0.035), H);
    g.quadraticCurveTo(W * (x - 0.02), H * 0.86, W * (x + 0.02), shoulderTop + H * 0.045);
    g.lineTo(W * (x + 0.055), shoulderTop + H * 0.05);
    g.quadraticCurveTo(W * (x + 0.03), H * 0.87, W * (x + 0.03), H);
    g.closePath();
    g.fill();
  }
  
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.fillRect(0, shoulderTop + H * 0.02, W * 0.14, H);
  g.fillRect(W * 0.86, shoulderTop + H * 0.02, W * 0.14, H);

  
  g.fillStyle = '#c08a68';
  g.fillRect(W * 0.40, H * 0.60, W * 0.20, H * 0.20);
  g.fillStyle = 'rgba(0,0,0,0.30)';
  g.fillRect(W * 0.40, H * 0.60, W * 0.20, H * 0.05);

  
  
  
  
  const n = tex.userData.faceSize;
  const chinRow = (0.7275 / 0.75) * n;
  const hw = W * 0.56;
  const hh = hw * (chinRow / n) * 1.24;
  g.drawImage(tex.userData.canvas, 0, 0, n, chinRow, (W - hw) / 2, H * 0.06, hw, hh);

  
  
  g.globalAlpha = 0.35;
  g.fillStyle = '#e3cb8c';
  g.fillRect((W - hw) / 2 + hw - 3, H * 0.09, 2, hh * 0.5);
  g.globalAlpha = 1;

  g.strokeStyle = 'rgba(111,240,216,0.22)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, W - 1, H - 1);
}










function xanderHeadGeometry() {
  const A = ARCH.renji;
  const pose = poseById('guard');
  const K = solve(pose, { flip: false });
  const hc = [K.head[0], 0, K.head[1]];
  return {
    mesh: head3d({ centre: hc, r: FRIG.headR, jaw: A.jaw, brow: A.brow, forward: [1, 0, 0] }),
    centre: hc,
  };
}

function xanderParts() {
  
  
  
  
  
  
  
  
  



const A = { ...ARCH.renji, hair: 'crop', jaw: ARCH.renji.jaw, brow: ARCH.renji.brow };
  
  
  
  
  
  const build = 1.16;
  const pose = poseById('guard');
  const K = solve(pose, { flip: false });
  const o = { flip: false, build };
  const built = buildFighter(K, {
    segments: segmentsOf(K, o), torso: torsoBoxOf(K, o),
    joints: jointsOf(K, o), girdle: girdleOf(K, o),
    headR: FRIG.headR, arch: { build, jaw: A.jaw, brow: A.brow, hair: 'crop' },
    flip: false, pose, head: false,
  });
  
  
  
  
  
  
  
  
  const hc = [K.head[0], 0, K.head[1]];
  const r = FRIG.headR;
  return [...built.parts,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    { name: 'hair', mesh: hair3d('crop', { centre: hc, r: r * 1.07, forward: [1, 0, 0] }) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);
}
const xColour = (n) => (n === 'hair' ? XCOL.hair
  : /^eye/.test(n) ? XCOL.eye
  : /^pelvis|^thigh|^shin|^hip\d|^knee|^ankle/.test(n) ? XCOL.pant
    : /^torso|^trapezius/.test(n) ? XCOL.top
      : /^foot/.test(n) ? XCOL.accent : XCOL.skin);







function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}























const TEX = 128;

function grimeTexture({ base, seams, rivets, mud, blood, hay }) {
  const cv = document.createElement('canvas');
  cv.width = TEX; cv.height = TEX;
  const g = cv.getContext('2d');
  const img = g.createImageData(TEX, TEX);
  const b = new THREE.Color(base);

  
  for (let y = 0; y < TEX; y += 1) {
    for (let x = 0; x < TEX; x += 1) {
      const i = (y * TEX + x) * 4;
      const k = 0.84 + hash2(x * 0.9, y * 0.9) * 0.17 + hash2(x * 0.23, y * 0.21) * 0.13;
      img.data[i] = Math.min(255, b.r * 255 * k);
      img.data[i + 1] = Math.min(255, b.g * 255 * k);
      img.data[i + 2] = Math.min(255, b.b * 255 * k);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  if (seams) {
    g.strokeStyle = 'rgba(0,0,0,0.42)';
    g.lineWidth = 1;
    for (const at of [0, TEX / 2]) {
      g.beginPath(); g.moveTo(0, at + 0.5); g.lineTo(TEX, at + 0.5); g.stroke();
      g.beginPath(); g.moveTo(at + 0.5, 0); g.lineTo(at + 0.5, TEX); g.stroke();
    }
  }
  if (rivets) {
    g.fillStyle = 'rgba(0,0,0,0.34)';
    for (let i = 0; i < 24; i += 1) {
      g.fillRect(Math.floor(hash2(i * 3.1, 1.7) * TEX), Math.floor(hash2(i * 1.3, 9.2) * TEX), 2, 2);
    }
  }

  
  
  
  const blob = (cx, cy, r, fill, drips) => {
    g.fillStyle = fill;
    g.beginPath();
    for (let a = 0; a <= 22; a += 1) {
      const th = (a / 22) * Math.PI * 2;
      const rr = r * (0.5 + hash2(cx + Math.cos(th) * 9, cy + Math.sin(th) * 9) * 0.85);
      const x = cx + Math.cos(th) * rr; const y = cy + Math.sin(th) * rr;
      if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    if (drips) {
      for (let d = 0; d < 3; d += 1) {
        const dx = cx + (hash2(cx + d, cy) - 0.5) * r * 1.5;
        g.fillRect(Math.round(dx), Math.round(cy), 1, Math.round(r * (0.8 + hash2(cx, cy + d) * 2.4)));
      }
    }
  };
  for (let i = 0; i < mud; i += 1) {
    blob(hash2(i * 5.1, 2.3) * TEX, hash2(i * 2.7, 8.1) * TEX, 4 + hash2(i, 3) * 10,
      'rgba(84,62,33,0.5)', false);
  }
  for (let i = 0; i < blood; i += 1) {
    blob(hash2(i * 7.7, 4.9) * TEX, hash2(i * 3.3, 1.1) * TEX, 3 + hash2(i, 7) * 6,
      'rgba(66,17,17,0.6)', true);
  }
  g.fillStyle = 'rgba(206,182,96,0.7)';
  for (let i = 0; i < hay; i += 1) {
    g.save();
    g.translate(hash2(i * 9.1, 6.4) * TEX, hash2(i * 4.2, 3.8) * TEX);
    g.rotate(hash2(i, 1.4) * Math.PI);
    g.fillRect(0, 0, 4 + hash2(i, 2) * 5, 1);
    g.restore();
  }

  const t = new THREE.CanvasTexture(cv);
  
  
  
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texturedMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
      uKey: { value: new THREE.Vector3(...KEY_DIR) },
      uFill: { value: new THREE.Vector3(...FILL_DIR) },
      uAlpha: { value: 1 },
      uMap: { value: map },
    },
    vertexShader: ps1Vertex(),
    fragmentShader: FRAGMENT.textured(),
    fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
  });
}












function panel(w, h, tile, place) {
  const sw = Math.max(1, Math.round(w / 2.5));
  const sh = Math.max(1, Math.round(h / 2.5));
  const g = new THREE.PlaneGeometry(w, h, sw, sh);
  const n = g.attributes.position.count;
  const uv = g.attributes.uv.array;
  for (let i = 0; i < n; i += 1) {
    uv[i * 2] *= w / tile;
    uv[i * 2 + 1] *= h / tile;
  }
  
  
  
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const m = new THREE.Mesh(g, place.mat);
  place.apply(m);
  return m;
}

function buildHall(scene) {
  const strips = [];
  const ceilingPieces = [];

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const walls = [
    grimeTexture({ base: 0x9aa48c, seams: true, rivets: true, mud: 5, blood: 4, hay: 0 }),
    grimeTexture({ base: 0x939d86, seams: true, rivets: false, mud: 9, blood: 2, hay: 0 }),
    grimeTexture({ base: 0xa1ab92, seams: true, rivets: true, mud: 3, blood: 8, hay: 0 }),
    grimeTexture({ base: 0x8f9982, seams: true, rivets: true, mud: 7, blood: 1, hay: 0 }),
  ];
  const floors = [
    grimeTexture({ base: 0x6f7562, seams: true, rivets: false, mud: 13, blood: 6, hay: 22 }),
    grimeTexture({ base: 0x6a705e, seams: true, rivets: false, mud: 8, blood: 11, hay: 34 }),
    grimeTexture({ base: 0x737a66, seams: true, rivets: true, mud: 17, blood: 3, hay: 14 }),
  ];
  const ceils = [
    grimeTexture({ base: 0x555c48, seams: true, rivets: true, mud: 3, blood: 2, hay: 0 }),
    grimeTexture({ base: 0x4f5644, seams: true, rivets: true, mud: 1, blood: 5, hay: 0 }),
  ];
  const endTex = grimeTexture({ base: 0x5e6552, seams: true, rivets: true, mud: 5, blood: 5, hay: 0 });

  const mats = new Map();
  const matFor = (tex) => {
    if (!mats.has(tex)) mats.set(tex, texturedMaterial(tex));
    return mats.get(tex);
  };

  const SEG = 8;
  const count = Math.ceil(HALL_LEN / SEG);
  for (let i = 0; i < count; i += 1) {
    const z0 = -4 + i * SEG;
    const mid = z0 + SEG / 2;
    const pick = (arr, salt) => arr[Math.floor(hash2(i * 7.3 + salt, 2.1) * arr.length) % arr.length];
    
    
    const off = hash2(i * 3.7, 5.5);

    const add = (w, h, tex, tile, fn) => {
      const m = panel(w, h, tile, { mat: matFor(tex), apply: fn });
      const uv = m.geometry.attributes.uv;
      for (let k = 0; k < uv.count; k += 1) uv.setX(k, uv.getX(k) + off * 3.1);
      uv.needsUpdate = true;
      scene.add(m);
      return m;
    };

    add(HALL_W, SEG, pick(floors, 0.1), 2.2, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0, mid); });
    add(SEG, WALL_H, pick(walls, 0.2), 2.2, (m) => { m.rotation.y = Math.PI / 2; m.position.set(-HALL_W / 2, WALL_H / 2, mid); });
    add(SEG, WALL_H, pick(walls, 0.9), 2.2, (m) => { m.rotation.y = -Math.PI / 2; m.position.set(HALL_W / 2, WALL_H / 2, mid); });
    ceilingPieces.push(add(HALL_W, SEG, pick(ceils, 0.4), 2.2,
      (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, HALL_H, mid); }));
  }

  const endMat = matFor(endTex);
  scene.add(panel(HALL_W, HALL_H, 2.2, { mat: endMat, apply: (m) => { m.position.set(0, HALL_H / 2, -4 + count * SEG); m.rotation.y = Math.PI; } }));
  scene.add(panel(HALL_W, HALL_H, 2.2, { mat: endMat, apply: (m) => { m.position.set(0, HALL_H / 2, -4); } }));

  const stripTex = grimeTexture({ base: 0xe8f0c8, seams: false, rivets: false, mud: 1, blood: 0, hay: 0 });
  for (let z = 2; z < HALL_LEN - 6; z += 7) {
    const lm = texturedMaterial(stripTex);
    lm.transparent = true;
    const strip = panel(0.5, 1.6, 1.6, {
      mat: lm,
      apply: (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, HALL_H - 0.02, z); },
    });
    scene.add(strip);
    strips.push({ mesh: strip, mat: lm, phase: hash2(z * 3.1, 7.7) * 10, next: 3 + hash2(z, 2.2) * 12 });
  }
  return { strips, ceilingPieces };
}

































const MAP = Object.freeze({
  pitch: 0.58,      
  eye: 26,          
  focal: 260,       
  range: 40,        
  behind: 9,        
  deckGap: 7.5,     
});









function mapProject(wx, wy, wz, player, cx, cy) {
  const dx = wx - player.x;
  const dy = wy - 1.2;                    
  const dz = wz - player.z;

  
  const c = Math.cos(-player.yaw); const sn = Math.sin(-player.yaw);
  const rx = dx * c - dz * sn;
  const rz = dx * sn + dz * c;

  
  const cp = Math.cos(MAP.pitch); const sp = Math.sin(MAP.pitch);
  const ry = dy * cp - rz * sp;
  const rzz = dy * sp + rz * cp;

  const depth = rzz + MAP.eye;
  if (depth < 1.2) return null;
  const f = MAP.focal / depth;
  return [cx + rx * f, cy - ry * f];
}

function drawMap(cv, player, birds, exitZ, level) {
  const g = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  g.clearRect(0, 0, W, H);
  const cx = W / 2; const cy = H * 0.52;
  const p = (x, y, z) => mapProject(x, y, z, player, cx, cy);

  const seg = (a, b, colour, width) => {
    if (!a || !b) return;                 
    g.strokeStyle = colour; g.lineWidth = width || 1;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  };

  const NEON = '#6ff0d8';
  const MID = 'rgba(111,240,216,0.5)';
  const FAINT = 'rgba(111,240,216,0.22)';
  const GHOST = 'rgba(111,240,216,0.12)';

  const hw = HALL_W / 2;
  const z0 = player.z - MAP.behind;
  const z1 = player.z + MAP.range;

  
  for (const dy of [-MAP.deckGap, MAP.deckGap]) {
    seg(p(-hw, dy, z0), p(-hw, dy, z1), GHOST, 1);
    seg(p(hw, dy, z0), p(hw, dy, z1), GHOST, 1);
    for (let z = Math.ceil(z0 / 12) * 12; z < z1; z += 12) {
      seg(p(-hw, dy, z), p(hw, dy, z), GHOST, 1);
    }
  }

  
  seg(p(-hw, 0, z0), p(-hw, 0, z1), MID, 1.6);
  seg(p(hw, 0, z0), p(hw, 0, z1), MID, 1.6);
  seg(p(-hw, HALL_H, z0), p(-hw, HALL_H, z1), FAINT, 1);
  seg(p(hw, HALL_H, z0), p(hw, HALL_H, z1), FAINT, 1);

  for (let z = Math.ceil(z0 / 4) * 4; z < z1; z += 4) {
    seg(p(-hw, 0, z), p(hw, 0, z), FAINT, 1);                 
    
    
    if (Math.round(z / 4) % 3 === 0) {
      seg(p(-hw, 0, z), p(-hw, HALL_H, z), FAINT, 1);
      seg(p(hw, 0, z), p(hw, HALL_H, z), FAINT, 1);
      seg(p(-hw, HALL_H, z), p(hw, HALL_H, z), 'rgba(111,240,216,0.12)', 1);
    }
  }

  
  for (const b of birds) {
    if (!b.alive) continue;
    if (b.z < z0 - 4 || b.z > z1) continue;
    const foot = p(b.x, 0, b.z);
    const top = p(b.x, 0.9, b.z);
    if (!foot || !top) continue;
    seg(foot, top, 'rgba(255,90,74,0.75)', 1);
    g.fillStyle = '#ff5a4a';
    g.fillRect(top[0] - 2.5, top[1] - 2.5, 5, 5);
  }

  
  if (exitZ > z0 - 6 && exitZ < z1 + 10) {
    const w = 1.1;
    const corners = [[-w, exitZ - 0.8], [w, exitZ - 0.8], [w, exitZ + 0.8], [-w, exitZ + 0.8]];
    for (let i = 0; i < 4; i += 1) {
      const a = corners[i]; const b = corners[(i + 1) % 4];
      seg(p(a[0], 0, a[1]), p(b[0], 0, b[1]), NEON, 1.4);
      seg(p(a[0], HALL_H, a[1]), p(b[0], HALL_H, b[1]), NEON, 1.4);
      seg(p(a[0], 0, a[1]), p(a[0], HALL_H, a[1]), NEON, 1.4);
    }
    const label = p(0, HALL_H + 1.1, exitZ);
    if (label) {
      g.fillStyle = NEON;
      g.font = 'bold 9px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('LIFT', label[0], label[1]);
      g.font = '8px ui-monospace, monospace';
      g.fillText(`${Math.max(0, Math.round(exitZ - player.z))}m`, label[0], label[1] + 9);
    }
  }

  
  const foot = p(0, 0, player.z - player.z);
  const head = p(0, 1.8, 0);
  if (foot && head) {
    seg(foot, head, 'rgba(234,255,242,0.5)', 1);
    g.strokeStyle = '#eafff2'; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(foot[0], foot[1] - 6);
    g.lineTo(foot[0] - 4.5, foot[1] + 3);
    g.lineTo(foot[0] + 4.5, foot[1] + 3);
    g.closePath(); g.stroke();
  }

  g.strokeStyle = 'rgba(111,240,216,0.55)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, W - 1, H - 1);
  g.fillStyle = 'rgba(111,240,216,0.8)';
  g.font = '8px ui-monospace, monospace';
  g.textAlign = 'left';
  g.fillText(`DECK ${level}`, 6, 12);
}

export function boot(canvas, hud) {
  let renderer;
  try {
    
    
    
    
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  } catch (e) {
    hud.fatal('This browser could not start WebGL, so the station stays dark.');
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x05060a, 1);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  if ('toneMapping' in renderer) renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
      uKey: { value: new THREE.Vector3(...KEY_DIR) },
      uFill: { value: new THREE.Vector3(...FILL_DIR) },
      uAlpha: { value: 1 },
    },
    vertexShader: ps1Vertex(),
    fragmentShader: FRAGMENT.colour(),
    fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
  });

  const { strips, ceilingPieces } = buildHall(scene);

  
  
  
  
  
  
  const bodyParts = xanderParts();
  const headBuilt = xanderHeadGeometry();
  const allParts = [...bodyParts, { name: 'head', mesh: headBuilt.mesh }];
  const xGeo = partsToGeometry(bodyParts, xColour, XANDER_H, allParts);
  const xander = new THREE.Mesh(xGeo, mat);
  xander.rotation.x = -Math.PI / 2;   
  scene.add(xander);

  const faces = {
    calm: xanderFaceSheet('calm'),
    alert: xanderFaceSheet('alert'),
    afraid: xanderFaceSheet('afraid'),
    hurt: xanderFaceSheet('hurt'),
  };
  const faceMat = texturedMaterial(faces.calm);
  const headGeo = partsToGeometry([{ name: 'head', mesh: headBuilt.mesh }], () => 0xffffff, XANDER_H, allParts, true);
  const xHead = new THREE.Mesh(headGeo, faceMat);
  xander.add(xHead);
  const portrait = makePortrait(headGeo, faces);

  const chickenGeo = partsToGeometry(buildChicken().parts, (n) => CCOL[n] ?? 0xb9b07a, CHICKEN_H);

  const player = {
    x: 0, z: 0, yaw: 0,
    vitals: spawnVitals(),
    
    
    
    
    
    
    
    
    
    
    weapon: readyWeapon('boltDriver', { ammo: 48 }),
    cam: emptyCamera(1),
    struggle: null,
    latchedBy: null,
    dead: false,
  };

  const birds = [];
  function addChicken(z, x) {
    const mesh = new THREE.Mesh(chickenGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    birds.push({
      mesh, x, z, alive: true,
      creature: spawnCreature('chicken'),
      latched: false,
      cool: 0,
    });
  }
  
  
  
  
  
  
  
  
  
  
  [30, 48].forEach((z, i) => addChicken(z, (i % 2 ? 1 : -1) * 0.55));

  
  const EXIT_Z = HALL_LEN - 12;
  const lift = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.4).toNonIndexed(),
    mat,
  );
  {
    const n = lift.geometry.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(0x2f6f4a);
    for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    lift.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    lift.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
    lift.geometry.computeVertexNormals();
  }
  lift.position.set(0, 1.2, EXIT_Z + 0.02);
  lift.rotation.y = Math.PI;
  scene.add(lift);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  
  
  renderer.setSize(canvas.clientWidth || 960, canvas.clientHeight || 540, false);
  camera.aspect = (canvas.clientWidth || 960) / (canvas.clientHeight || 540);
  camera.updateProjectionMatrix();

  
  const keys = new Set();
  let fireHeld = false;
  let aiming = false;
  addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (player.struggle) {
      
      
      if (e.code === 'KeyA') player.struggle.press('a');
      if (e.code === 'KeyD') player.struggle.press('d');
    }
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('pointerdown', (e) => {
    if (player.struggle) { player.struggle.press('tap'); return; }
    if (e.button === 2) { aiming = true; return; }
    fireHeld = true;
  });
  addEventListener('pointerup', () => { fireHeld = false; aiming = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.struggle) player.struggle.press('tap'); else fireHeld = true;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { fireHeld = false; }, { passive: false });

  
  
  
  
  
  const touch = { fwd: 0, turn: 0, active: false };
  if ((navigator.maxTouchPoints || 0) > 0) {
    const wrap = document.getElementById('touch');
    if (wrap) wrap.style.display = 'block';
    const stick = document.getElementById('stick');
    const nub = document.getElementById('nub');
    const fireBtn = document.getElementById('fireBtn');
    if (stick && nub) {
      const R = 46;
      const set = (e) => {
        const r = stick.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        let dx = t.clientX - (r.left + r.width / 2);
        let dy = t.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
        nub.style.transform = `translate(${dx}px, ${dy}px)`;
        
        
        touch.fwd = -dy / R;
        touch.turn = -dx / R;
        touch.active = true;
      };
      const clear = () => {
        nub.style.transform = 'translate(0,0)';
        touch.fwd = 0; touch.turn = 0; touch.active = false;
      };
      stick.addEventListener('touchstart', (e) => { e.preventDefault(); set(e); }, { passive: false });
      stick.addEventListener('touchmove', (e) => { e.preventDefault(); set(e); }, { passive: false });
      stick.addEventListener('touchend', (e) => { e.preventDefault(); clear(); }, { passive: false });
      stick.addEventListener('touchcancel', clear);
    }
    if (fireBtn) {
      const down = (e) => {
        e.preventDefault();
        
        
        if (player.struggle) player.struggle.press('tap'); else fireHeld = true;
      };
      fireBtn.addEventListener('touchstart', down, { passive: false });
      fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); fireHeld = false; }, { passive: false });
    }
  }

  
  let last = 0;
  let shotFlash = 0;
  let paIn = 12 + Math.random() * 14;
  
  
  
  
  
  let shake = 0;
  let level = 1;
  let liftIn = 0;
  const mapCv = document.getElementById('map');
  
  
  
  
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tmpV = new THREE.Vector3();

  function step(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now;

    if (!player.dead) {
      
      
      
      
      const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || (touch.active && touch.fwd > 0.75);
      let fwd = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
      let turn = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) turn += 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) turn -= 1;
      if (touch.active) { fwd = touch.fwd; turn = touch.turn; }
      
      if (player.struggle) turn = 0;

      player.yaw += turn * 2.1 * dt;
      const slow = player.latchedBy ? (1 - CHICKEN_LATCH_SLOW) : 1;
      const speed = (player.struggle ? 0 : (sprint ? 5.5 : 2.4)) * slow;
      player.x -= Math.sin(player.yaw) * fwd * speed * dt;
      player.z += Math.cos(player.yaw) * fwd * speed * dt;
      player.x = clamp(player.x, -HALL_W / 2 + 0.4, HALL_W / 2 - 0.4);
      player.z = clamp(player.z, -2, HALL_LEN - 10);

      const mode = player.struggle ? 'walk' : (sprint && fwd ? 'sprint' : 'walk');
      tickVitals(player.vitals, dt, mode);
    }

    
    tickWeapon(player.weapon, dt);
    if (fireHeld && !player.struggle && !player.dead && canFire(player.weapon)) {
      fire(player.weapon);
      shotFlash = 0.06;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const muzzleY = 1.30;
      const aimDrop = keys.has('ControlLeft') || keys.has('KeyQ') ? 1.0 : 0.30;
      for (const b of birds) {
        if (!b.alive) continue;
        const dx = player.x - b.x; const dz = player.z - b.z;
        const dist = Math.hypot(dx, dz);
        if (dist > (player.weapon.spec?.range ?? 18)) continue;
        
        const fx = dx / dist; const fz = dz / dist;
        const rx = fz; const rz = -fx;                 
        const toLocal = (wx, wy, wz) => {
          const ox = wx - b.x; const oz = wz - b.z;
          return {
            x: (ox * rx + oz * rz) / CHICKEN_H,
            y: wy / CHICKEN_H,
            z: (ox * fx + oz * fz) / CHICKEN_H,
          };
        };
        const tipY = muzzleY - aimDrop * (dist / 6);
        const hit = resolveHit(
          b.creature,
          toLocal(player.x, muzzleY, player.z),
          toLocal(player.x - Math.sin(player.yaw) * 30, tipY, player.z + Math.cos(player.yaw) * 30),
        );
        if (!hit) continue;
        applyDamage(b.creature, hit.id, player.weapon.spec?.limbDamage ?? 12);
        const st = statusOf(b.creature);
        
        
        if (!st.alive) {
          b.alive = false;
          b.mesh.visible = false;
          if (b.latched) { player.latchedBy = null; player.struggle = null; endGrapple(player.vitals); }
        }
        break;                                        
      }
    }

    
    for (const b of birds) {
      if (!b.alive) continue;
      const dx = player.x - b.x; const dz = player.z - b.z;
      const dist = Math.hypot(dx, dz);
      const mob = mobilityOf(b.creature);
      const spd = 6.2 * (typeof mob === 'number' ? mob : (mob?.speed ?? 1));
      if (!b.latched && dist > 0.75 && !player.dead) {
        b.x += (dx / dist) * spd * dt;
        b.z += (dz / dist) * spd * dt;
      } else if (!b.latched && !player.dead && b.cool <= 0) {
        b.latched = true;
        player.latchedBy = b;
        
        
        
        
        player.struggle = createStruggle({ verb: VERB_FOR.chicken ?? 'mash', mode: 'reduced' });
        shake = Math.max(shake, 0.55);
        beginGrapple(player.vitals, 'chicken');
      }
      b.cool -= dt;
      b.mesh.position.set(b.x, 0, b.z);
      b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI;
    }

    
    if (player.struggle) {
      player.struggle.update(dt);
      if (player.struggle.progress >= 1 || player.struggle.done) {
        const b = player.latchedBy;
        if (b) { b.latched = false; b.cool = 1.6; b.x -= Math.sin(player.yaw) * -0.8; }
        player.latchedBy = null;
        player.struggle = null;
        endGrapple(player.vitals);
      }
    }

    if (player.vitals.health <= 0 && !player.dead) {
      player.dead = true;
      hud.dead();
    }

    
    
    
    
    const roomBehind = Math.max(0.6, player.z + 3.4);
    player.cam = stepCamera(player.cam, { aiming }, dt, roomBehind);
    const place = cameraPlacement(player.cam, { x: player.x, y: 0, z: player.z }, player.yaw);
    camera.fov = place.fov;
    camera.updateProjectionMatrix();
    
    if (player.struggle) shake = Math.min(0.9, Math.max(shake, player.struggle.progress * 0.25 + 0.35));
    shake = Math.max(0, shake - dt * 1.9);
    const sx = shake ? (Math.random() - 0.5) * shake * 0.34 : 0;
    const sy = shake ? (Math.random() - 0.5) * shake * 0.28 : 0;
    camera.position.set(place.eye.x + sx, place.eye.y + sy, place.eye.z);
    camera.lookAt(place.target.x + sx * 0.4, place.target.y + sy * 0.4, place.target.z);

    xander.position.set(player.x, 0, player.z);
    xander.rotation.z = player.yaw;

    
    const w = canvas.clientWidth || 960; const h = canvas.clientHeight || 540;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    
    
    
    
    
    if (!calm) {
      for (const st of strips) {
        st.next -= dt;
        if (st.next <= 0) {
          st.next = 4 + Math.random() * 14;
          st.phase = 0.42 + Math.random() * 0.3;      
        }
        const fit = st.phase > 0;
        if (fit) {
          st.phase -= dt;
          const w = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 26 + st.next));
          st.mat.uniforms.uAlpha.value = w;
        } else if (st.mat.uniforms.uAlpha.value !== 1) {
          st.mat.uniforms.uAlpha.value = 1;
        }
      }
    }

    
    paIn -= dt;
    if (paIn <= 0 && !player.dead) {
      paIn = 22 + Math.random() * 26;
      paVoice(PA_KINDS[Math.floor(Math.random() * PA_KINDS.length)]);
    }

    
    const hunted = birds.some((b) => b.alive && Math.hypot(b.x - player.x, b.z - player.z) < 13);
    audio.duck(hunted);

    
    if (!player.dead && Math.abs(player.z - EXIT_Z) < 1.6 && Math.abs(player.x) < 1.1) {
      if (liftIn <= 0) {
        liftIn = 2.4;
        hud.lift(level + 1);
        
        
        
        liftChime();
      }
    }
    if (liftIn > 0) {
      liftIn -= dt;
      if (liftIn <= 0) {
        level += 1;
        player.z = 0; player.x = 0; player.yaw = 0;
        birds.forEach((b, i) => {
          b.alive = true; b.mesh.visible = true;
          b.creature = spawnCreature('chicken');
          b.latched = false; b.cool = 0;
          b.z = 24 + i * (13 - Math.min(6, level)); b.x = (i % 2 ? 1 : -1) * (0.5 + i * 0.25);
        });
        player.latchedBy = null; player.struggle = null;
        
        
        player.weapon = readyWeapon('boltDriver', { ammo: 48 });
        hud.lift(0);
      }
    }

    
    
    
    
    for (const c of ceilingPieces) c.visible = Math.abs(c.position.z - player.z) > CEIL_CULL;

    
    
    
    
    
    if (portrait) {
      const nearest = birds.reduce((d, b) => (b.alive
        ? Math.min(d, Math.hypot(b.x - player.x, b.z - player.z)) : d), Infinity);
      let expr = 'calm';
      if (player.struggle) expr = 'afraid';
      else if (player.vitals.health < 55) expr = 'hurt';
      else if (nearest < 7) expr = 'afraid';
      else if (nearest < 20) expr = 'alert';
      portrait.set(expr);
      
      faceMat.uniforms.uMap.value = faces[expr];
      portrait.draw(now);
    }

    if (mapCv) drawMap(mapCv, player, birds, EXIT_Z, level);

    renderer.render(scene, camera);
    shotFlash = Math.max(0, shotFlash - dt);
    hud.paint({
      health: player.vitals.health,
      maxHealth: MAX_HEALTH,
      stamina: player.vitals.stamina,
      struggle: player.struggle,
      alive: !player.dead,
      remaining: birds.filter((b) => b.alive).length,
      ammo: player.weapon.ammo,
      range: Math.round(player.weapon.spec?.range ?? 0),
      ep: 100 - Math.min(100, level * 6),
      flash: shotFlash > 0,
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  return { player, birds };
}

export { promptFor };













const $ = (id) => document.getElementById(id);









const audio = (() => {
  let ctx = null; let music = null; let sfx = null;
  return {
    get ctx() { return ctx; },
    get musicBus() { return music; },
    get sfxBus() { return sfx; },
    ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      music = ctx.createGain(); music.gain.value = 0.50; music.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.85; sfx.connect(ctx.destination);
      return ctx;
    },
    get running() { return !!ctx && ctx.state === 'running'; },
    
    
    duck(on) {
      if (music && ctx) music.gain.setTargetAtTime(on ? 0.18 : 0.50, ctx.currentTime, 0.4);
    },
  };
})();
















const FORMANTS = {
  oh: [[500, 860], [0.95, 0.5]],
  no: [[400, 1100], [1.0, 0.55]],
  ah: [[730, 1150], [1.0, 0.6]],
  sob: [[430, 1250], [0.7, 0.45]],
};

function paVoice(kind) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const [freqs, amps] = FORMANTS[kind] || FORMANTS.oh;
  const t0 = ctx.currentTime + 0.03;
  const dur = kind === 'sob' ? 0.42 : 1.1 + Math.random() * 0.8;

  const speaker = ctx.createBiquadFilter();
  speaker.type = 'bandpass'; speaker.frequency.value = 1500; speaker.Q.value = 0.7;
  const crunch = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 2.6); }
  crunch.curve = curve;
  const out = ctx.createGain(); out.gain.value = 0.5;
  speaker.connect(crunch); crunch.connect(out); out.connect(audio.sfxBus);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = 115 + Math.random() * 95;
  osc.frequency.setValueAtTime(base * 1.15, t0);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, t0 + dur);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(0.45, t0 + (kind === 'sob' ? 0.05 : 0.2));
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  freqs.forEach((f, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 8;
    const g = ctx.createGain(); g.gain.value = amps[i];
    amp.connect(bp); bp.connect(g); g.connect(speaker);
  });
  osc.start(t0); osc.stop(t0 + dur + 0.12);

  for (const at of [t0 - 0.02, t0 + dur + 0.03]) {
    const c = ctx.createOscillator(); const cg = ctx.createGain();
    c.frequency.value = 1900;
    cg.gain.setValueAtTime(0.05, at);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    c.connect(cg); cg.connect(audio.sfxBus); c.start(at); c.stop(at + 0.05);
  }
}

function liftChime() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.05;
  
  
  [392.0, 493.9, 587.3, 880.0].forEach((f, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const at = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.1);
    o.connect(g); g.connect(audio.musicBus); o.start(at); o.stop(at + 2.2);
  });
}

const PA_KINDS = ['oh', 'no', 'ah', 'sob', 'sob'];

const tape = (() => {
  let timer = null; let bar = 0; let on = false;
  const D = 146.83;
  const dorian = [0, 2, 3, 5, 7, 9, 10];
  const hz = (deg, oct = 0) => D * (2 ** ((dorian[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12));
  const ctx = () => audio.ctx;
  const bus = () => audio.musicBus;

  const tone = (type, f, t, dur, gain) => {
    const o = ctx().createOscillator(); const g = ctx().createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus()); o.start(t); o.stop(t + dur + 0.05);
  };
  const kick = (t) => {
    const o = ctx().createOscillator(); const g = ctx().createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(bus()); o.start(t); o.stop(t + 0.2);
  };
  const hat = (t) => {
    const b = ctx().createBuffer(1, 1024, ctx().sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    const n = ctx().createBufferSource(); n.buffer = b;
    const hp = ctx().createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx().createGain(); g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(hp); hp.connect(g); g.connect(bus()); n.start(t); n.stop(t + 0.06);
  };

  function schedule() {
    if (!ctx()) return;
    const spb = 60 / 104;
    const t0 = ctx().currentTime + 0.06;
    const r = [0, 0, 3, 2][bar % 4];
    for (let b = 0; b < 4; b += 1) {
      const t = t0 + b * spb;
      kick(t); hat(t + spb * 0.5);
      tone('sawtooth', hz(r, -1), t, 0.34, 0.15);
      if (b % 2 === 0) {
        tone('triangle', hz(r + 2), t + 0.02, 0.5, 0.07);
        tone('triangle', hz(r + 4), t + 0.02, 0.5, 0.055);
      }
    }
    bar += 1;
    timer = setTimeout(schedule, spb * 4 * 1000 - 60);
  }

  return {
    toggle() {
      const c = audio.ensure();
      if (!c) return false;
      if (on) { clearTimeout(timer); timer = null; on = false; } else { if (c.resume) c.resume(); on = true; schedule(); }
      return on;
    },
    
    
    
    get audible() { return on && audio.running; },
  };
})();

const hud = {
  fatal(text) { const b = $('boot'); if (b) { b.style.display = 'flex'; b.innerHTML = `<div style="max-width:46ch">${text}</div>`; } },
  lift(toLevel) {
    const el = $('msg');
    el.textContent = toLevel ? `LIFT — DECK ${toLevel}` : '';
  },
  dead() {
    $('overTitle').textContent = 'THE LIVESTOCK HAD OPINIONS';
    $('overBody').textContent = 'Xander does not report back.';
    $('over').style.display = 'flex';
  },
  paint(s) {
    const pct = (v, m) => `${Math.max(0, Math.min(100, (v / m) * 100))}%`;
    $('hpFill').style.width = pct(s.health, s.maxHealth);
    $('hpVal').textContent = Math.max(0, Math.round(s.health));
    $('spFill').style.width = pct(s.stamina, 100);
    $('spVal').textContent = Math.max(0, Math.round(s.stamina));
    
    
    
    $('epFill').style.width = pct(s.ep ?? 100, 100);
    $('epVal').textContent = Math.round(s.ep ?? 100);

    $('wpAmmo').textContent = s.ammo == null ? '--' : s.ammo;
    $('wpRange').textContent = s.range == null ? '--' : s.range;

    $('count').textContent = s.remaining ? `${s.remaining} ON THE DECK` : 'DECK CLEAR';
    $('flash').style.opacity = s.flash ? '0.30' : '0';
    $('retic').style.opacity = s.alive ? '0.9' : '0';

    if (s.struggle) {
      $('qte').style.display = 'block';
      $('qteFill').style.width = `${Math.min(100, s.struggle.progress * 100)}%`;
      $('qteHow').textContent = 'alternate A and D — or hit the button';
    } else {
      $('qte').style.display = 'none';
    }
    $('tapeMini').classList.toggle('on', tape.audible);
  },
};

function start() {
  lockZoom();
  
  
  try { initAnalytics(); trackEvent('game_open', { game: 'farmy-evil-hills' }); } catch {  }
  $('tapeMini').addEventListener('click', () => {
    const playing = tape.toggle();
    $('tapeMini').classList.toggle('on', tape.audible);
    $('tapeCap').textContent = playing ? (tape.audible ? 'SIDE A' : 'TAP') : 'OFF';
  });
  $('again').addEventListener('click', () => window.location.reload());
  $('qteBtn').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
    if (st) st.press('tap');
  });

  
  
  
  
  
  
  
  try {
    const api = boot($('game'), hud);
    window.__feh = api;
    if (api) {
      let started = false;
      const go = () => {
        if (started) return;
        started = true;
        $('boot').style.display = 'none';
        $('hint').style.display = 'block';
        
        
        
        
        
        if (!tape.audible) {
          tape.toggle();
          $('tapeMini').classList.toggle('on', tape.audible);
          $('tapeCap').textContent = tape.audible ? 'SIDE A' : 'TAP';
        }
      };
      $('startBtn').addEventListener('click', go);
      $('boot').addEventListener('click', go);
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') go();
      });
    }
  } catch (err) {
    hud.fatal(`The station did not come up.<br><small style="opacity:.6">${String(err).slice(0, 300)}</small>`);
    throw err;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
