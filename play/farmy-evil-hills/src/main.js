






















import * as THREE from 'three';

import { solve, RIG as FRIG, ARCH } from '../../2d-fighter-ex/src/animeRig.mjs';
import { poseById, blendPose } from '../../2d-fighter-ex/src/moveSet.mjs';
import {
  gaitPose, firePose, strugglePose, deathPose,
} from '../../../web-engine/horror/gait.js';
import { buildBoltDriver, muzzlePoint } from '../../../web-engine/ps1/props/boltDriver.mjs';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter, jointBall } from '../../../web-engine/ps1/ps1Mesh.mjs';








import {
  head3d, hair3d, JAW, HEAD_RINGS,
} from '../../../web-engine/ps1/ps1Head.mjs';
import { buildChicken } from '../../../web-engine/ps1/creatures/chicken.mjs';
import {
  emptyChickenAnim, stepChicken, chickenPose, RANGE as CHICK_RANGE,
} from '../../../web-engine/horror/creatureAnim.js';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';




import { lockZoom } from '../../shared/input/zoomLock.js';

import { railNodesForRuns, nodeAt, railPlacement } from '../../../web-engine/horror/railCamera.js';
import {
  buildLevel, moveInLevel, progressAt, pointBehind, runRect,
} from '../../../web-engine/horror/level.js';
import { spawnVitals, tickVitals, damage, beginGrapple, endGrapple, MAX_HEALTH, CHICKEN_LATCH_SLOW } from '../../../web-engine/horror/health.js';
import { spawn as spawnCreature, resolveHit, applyDamage, mobilityOf, statusOf } from '../../../web-engine/horror/dismemberment.js';
import { readyWeapon, tickWeapon, canFire, fire } from '../../../web-engine/horror/weapons.js';
import { createStruggle, VERB_FOR, promptFor } from '../../../web-engine/horror/struggle.js';
import { initAnalytics, trackEvent } from 'arbelo/analytics';

const XANDER_H = 1.80;












const XANDER_POSE = 'idle';
const CHICKEN_H = 0.72;
const HALL_W = 3.2;
















const HALL_H = 3.6;












const WALL_H = 6.4;













const clamp = (v, a, b) => Math.max(a, Math.min(b, v));








const XCOL = {
  top: 0x9c4436,      
  pant: 0x3a4f7d,     
  accent: 0xb5893f,   
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
  
  
  
  const seen = new Map();
  const colourAt = (hex) => {
    let c = seen.get(hex);
    if (!c) { c = new THREE.Color(hex); seen.set(hex, c); }
    return c;
  };
  for (const p of parts) {
    const base = pos.length / 3;
    
    
    
    
    
    
    
    
    
    
    const per = colourOf(p.name);
    const fn = typeof per === 'function' ? per : null;
    const flat = fn ? null : colourAt(per);
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      const bx = p.mesh.positions[i];
      const by = p.mesh.positions[i + 1];
      const bz = (p.mesh.positions[i + 2] - lo) / ((hi - lo) || 1);
      pos.push(
        bx * s,
        by * s,
        (p.mesh.positions[i + 2] - lo) * s,   
      );
      const c = fn ? colourAt(fn(bx, by, bz)) : flat;
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





































const HEAD_NARROW = 0.84;


































const XANDER_JAW = 'long';


const FACE_JAW = JAW[XANDER_JAW] || JAW.oval;








function faceRingHalfWidth(ring) {
  const J = FACE_JAW;
  const mix = (t) => J.cheek + (J.chin - J.cheek) * t;
  switch (ring.key) {
    case 'crown': return J.crown * ring.hw;
    case 'chin': return J.chin * ring.hw;
    case 'mix45': return mix(0.45) * ring.hw;
    case 'mix82': return mix(0.82) * ring.hw;
    default: return J.cheek * ring.hw;
  }
}




















































const FACE = (() => {
  const S = FACE_PX;
  const rows = HEAD_RINGS.map((r) => ({
    name: r.name,
    z: r.drop !== undefined ? -FACE_JAW.drop * r.drop : r.z,
    v: r.v,
    hw: faceRingHalfWidth(r),
  }));
  let yMax = 1e-6;
  for (const r of rows) yMax = Math.max(yMax, r.hw);

  
  
  const a = rows[0];
  const b = rows[rows.length - 1];
  const PX_V = ((b.v - a.v) * S) / (a.z - b.z);   
  const PX_U = (0.46 * S) / yMax;                 
  const Y = (z) => a.v * S + (a.z - z) * PX_V;
  const X = (y) => S * 0.5 + y * PX_U;

  
  const line = [{ name: 'apex', y: Y(1.02), half: 0 }]
    .concat(rows.map((r) => ({ name: r.name, y: Y(r.z), half: r.hw * PX_U })));
  const at = {};
  for (const r of line) at[r.name] = r;

  
  const halfAt = (y) => {
    if (y <= line[0].y) return 0;
    for (let i = 0; i + 1 < line.length; i += 1) {
      const p = line[i]; const q = line[i + 1];
      if (y >= p.y && y <= q.y) {
        return p.half + (q.half - p.half) * ((y - p.y) / Math.max(1e-6, q.y - p.y));
      }
    }
    
    
    const last = line[line.length - 1];
    return Math.max(0, last.half * (1 - (y - last.y) / 10));
  };

  return {
    S,
    X,
    Y,
    rows: at,
    halfAt,
    crown: 0,
    chin: at.chin.y,
    





    AY: (HEAD_NARROW * PX_V) / PX_U,
  };
})();

















const EXPRESSIONS = Object.freeze({
  calm: { brow: 0, tilt: 0.10, open: 1, lid: 1, mouth: 0, tension: 0.25 },
  alert: { brow: -0.030, tilt: 0.34, open: 1.16, lid: 0.80, mouth: 0.10, tension: 0.60 },
  afraid: { brow: -0.062, tilt: -0.40, open: 1.34, lid: 0.55, mouth: 0.40, tension: 0.85 },
  hurt: { brow: 0.030, tilt: 0.55, open: 0.42, lid: 1.6, mouth: 0.34, tension: 1.0 },
});



















































function xanderFaceSheet(exprName = 'calm') {
  const X = EXPRESSIONS[exprName] || EXPRESSIONS.calm;
  const cv = document.createElement('canvas');
  cv.width = FACE_PX * 2;
  cv.height = Math.round(FACE_PX / 0.75);
  const c = cv.getContext('2d');

  
  
  
  
  const SKIN = '#cf9d74';
  const SKIN_LIT = '#e3b78d';
  const SKIN_HI = '#eec9a2';
  const SKIN_SH = '#a4744f';
  const SKIN_DEEP = '#7c5439';
  const SKIN_DARK = '#573925';
  
  
  
  const HAIR = '#cfae5e';
  const HAIR_SH = '#9a7c34';
  const HAIR_HI = '#e8d18d';
  
  
  
  const BROW = '#6b4a2c';
  const SCLERA = '#c9c0b0';        
  const IRIS = '#2f6fb8';
  const IRIS_DK = '#17395e';
  const PUPIL = '#101820';
  const LINE = '#2b1c14';
  const LIP = '#8a5245';
  const LIP_LINE = '#57302a';
  const MOUTH_IN = '#2a1512';

  const S = FACE.S;
  const cxp = S * 0.5;
  const CHIN = FACE.chin;

  
  
  
  
  
  const HW = FACE.rows.eye.half;
  const eDX = HW * 0.40;              
  const eW = HW * 0.44;               
  const AY = FACE.AY;
  const ay = (w) => w * AY;           
  const eH = ay(eW / 3) * X.open;     
  
  
  
  
  
  
  const mouthHalf = eW * 0.82;
  const noseHalf = eW * 0.46;

  
  
  
  
  const yHair = CHIN * 0.225;
  const yBrow = FACE.rows.browLip.y;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const yEye = FACE.rows.eye.y;
  const yNose = CHIN * 0.725;
  const yMouth = CHIN * 0.845;
  
  
  
  
  const browY = yBrow - ay(eW * 0.11) - CHIN * (X.brow || 0);

  const HAIR_TOP = -6;                

  c.fillStyle = SKIN;
  c.fillRect(0, 0, cv.width, cv.height);

  
  
  
  
  
  
  
  const sx = cv.width * 0.52;
  const sw = cv.width - sx;
  c.fillStyle = SKIN_SH;
  c.fillRect(sx, 0, sw, cv.height);
  c.fillStyle = SKIN_DEEP;
  c.fillRect(sx + sw * 0.22, 0, sw * 0.56, cv.height);

  
  
  
  
  const eaX = sx + sw * 0.22;
  const eaY = cv.height * 0.40;
  const eaW = sw * 0.14;
  const eaH = cv.height * 0.16;
  c.fillStyle = SKIN;
  c.beginPath();
  c.ellipse(eaX + eaW * 0.5, eaY + eaH * 0.5, eaW * 0.5, eaH * 0.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = SKIN_SH;
  c.beginPath();
  c.ellipse(eaX + eaW * 0.56, eaY + eaH * 0.52, eaW * 0.30, eaH * 0.34, 0.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = SKIN_DEEP;
  c.beginPath();
  c.ellipse(eaX + eaW * 0.60, eaY + eaH * 0.58, eaW * 0.16, eaH * 0.20, 0.2, 0, Math.PI * 2);
  c.fill();

  
  
  
  c.save();
  c.beginPath();
  c.rect(0, 0, S, cv.height);
  c.clip();
  c.lineJoin = 'round';
  c.lineCap = 'round';

  {
    const top = FACE.rows.cheek.y;
    for (let y = Math.round(top); y < CHIN + 3; y += 1) {
      const k = Math.min(1, (y - top) / (CHIN - top));
      
      
      
      
      c.fillStyle = k < 0.5 ? SKIN_LIT : SKIN_HI;
      c.globalAlpha = 0.14 + 0.52 * k;
      const h = FACE.halfAt(y) * 0.98;
      c.fillRect(Math.round(cxp - h), y, Math.round(h * 2), 1);
    }
    c.globalAlpha = 1;
  }

  
  const sidePath = (dir, inset, y0, y1) => {
    c.beginPath();
    const step = 1.5;
    for (let y = y0; y <= y1; y += step) {
      const px = cxp + dir * FACE.halfAt(y);
      if (y === y0) c.moveTo(px, y); else c.lineTo(px, y);
    }
    for (let y = y1; y >= y0; y -= step) {
      const h = FACE.halfAt(y);
      c.lineTo(cxp + dir * Math.max(0, h - inset(y, h)), y);
    }
    c.closePath();
  };

  
  
  
  
  
  
  const rim = (y, h) => {
    const t = y / CHIN;
    const wide = h * 0.26;
    const narrow = h * 0.11;
    
    
    const k = Math.min(1, Math.abs(t - 0.62) / 0.30);
    return narrow + (wide - narrow) * k;
  };
  c.fillStyle = SKIN_SH;
  c.globalAlpha = 0.40;
  for (const d of [-1, 1]) { sidePath(d, rim, 6, CHIN); c.fill(); }
  c.globalAlpha = 1;
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.22;
  for (const d of [-1, 1]) { sidePath(d, (y, h) => rim(y, h) * 0.34, 6, CHIN); c.fill(); }
  c.globalAlpha = 1;

  
  
  
  
  
  
  
  
  
  
  
  c.fillStyle = SKIN_LIT;
  c.globalAlpha = 0.62;
  c.beginPath();
  c.moveTo(cxp - HW * 0.56, yHair + CHIN * 0.075);
  c.lineTo(cxp + HW * 0.56, yHair + CHIN * 0.075);
  c.lineTo(cxp + HW * 0.44, browY - ay(eW * 0.06));
  c.lineTo(cxp + eW * 0.34, browY - ay(eW * 0.26));
  c.lineTo(cxp - eW * 0.34, browY - ay(eW * 0.26));
  c.lineTo(cxp - HW * 0.44, browY - ay(eW * 0.06));
  c.closePath();
  c.fill();
  c.globalAlpha = 1;

  
  
  
  
  
  
  
  
  
  c.fillStyle = SKIN_HI;
  c.globalAlpha = 0.45;
  c.beginPath();
  c.moveTo(cxp - eW * 0.20, FACE.Y(0.13));
  c.lineTo(cxp + eW * 0.20, FACE.Y(0.13));
  c.lineTo(cxp + eW * 0.30, FACE.Y(-0.33));
  c.lineTo(cxp - eW * 0.30, FACE.Y(-0.33));
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = SKIN_LIT;

  
  
  
  c.globalAlpha = 0.45;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(cxp + d * HW * 0.70, FACE.rows.eye.y + ay(eW * 0.26));
    c.lineTo(cxp + d * eW * 0.60, yNose - ay(eW * 0.26));
    c.lineTo(cxp + d * eW * 0.80, yNose + ay(eW * 0.04));
    c.lineTo(cxp + d * HW * 0.66, yNose - ay(eW * 0.02));
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;

  
  c.fillStyle = SKIN_HI;
  c.globalAlpha = 0.45;
  c.beginPath();
  c.moveTo(cxp - mouthHalf * 0.78, yMouth + ay(eW * 0.44));
  c.lineTo(cxp + mouthHalf * 0.72, yMouth + ay(eW * 0.42));
  c.lineTo(cxp + mouthHalf * 0.46, CHIN - ay(eW * 0.10));
  c.lineTo(cxp - mouthHalf * 0.46, CHIN - ay(eW * 0.10));
  c.closePath();
  c.fill();
  c.globalAlpha = 1;

  
  
  
  
  c.fillStyle = SKIN_SH;
  c.globalAlpha = 0.20;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(cxp + d * HW * 0.62, yNose - ay(eW * 0.10));
    c.lineTo(cxp + d * eW * 0.86, yNose + ay(eW * 0.08));
    c.lineTo(cxp + d * mouthHalf * 1.04, yMouth - ay(eW * 0.18));
    c.lineTo(cxp + d * FACE.halfAt(yMouth) * 0.86, yMouth - ay(eW * 0.40));
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;

  
  
  
  const jawY = FACE.rows.jaw.y;
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.18;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(cxp + d * FACE.halfAt(jawY), jawY - ay(eW * 0.30));
    c.lineTo(cxp + d * FACE.halfAt(jawY) * 0.30, CHIN + 2);
    c.lineTo(cxp + d * FACE.halfAt(jawY) * 0.30, CHIN - ay(eW * 0.16));
    c.quadraticCurveTo(cxp + d * FACE.halfAt(jawY) * 0.80, jawY + ay(eW * 0.10),
      cxp + d * FACE.halfAt(jawY) * 0.92, jawY - ay(eW * 0.30));
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;

  
  
  
  
  
  
  
  
  
  
  
  const beardTop = yNose + ay(eW * 0.50);
  const beardBot = CHIN - 1;
  c.fillStyle = SKIN_DEEP;
  for (let y = Math.round(beardTop); y < beardBot; y += 1) {
    const h = FACE.halfAt(y) * 0.95;
    const t = (y - beardTop) / Math.max(1, beardBot - beardTop);
    
    const w = h * Math.min(1, 0.34 + 1.5 * t);
    c.globalAlpha = 0.115;
    c.fillRect(Math.round(cxp - w), y, Math.round(w * 2), 1);
    for (let k = 0; k < 4; k += 1) {
      if (hash2(y * 3.1 + k, 5.7) > 0.42) continue;
      c.fillRect(Math.round(cxp - w - k), y, 1, 1);
      c.fillRect(Math.round(cxp + w + k), y, 1, 1);
    }
  }
  c.globalAlpha = 1;

  
  
  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.10;
  for (const d of [-1, 1]) {
    c.beginPath();
    const y0 = FACE.rows.eye.y + ay(eW * 0.30);
    for (let y = y0; y <= beardBot; y += 3) c.lineTo(cxp + d * FACE.halfAt(y) * 0.99, y);
    for (let y = beardBot; y >= y0; y -= 3) {
      const k = (y - y0) / Math.max(1, beardBot - y0);
      c.lineTo(cxp + d * FACE.halfAt(y) * (0.85 - 0.22 * k), y);
    }
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;

  
  
  
  
  
  
  c.fillStyle = SKIN_LIT;
  c.globalAlpha = 0.55;
  c.beginPath();
  c.ellipse(cxp, yNose + ay(eW * 0.26), noseHalf * 0.40, ay(eW * 0.20), 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  
  
  
  
  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.40;
  c.beginPath();
  c.moveTo(cxp - HW * 0.84, browY + 1);
  c.lineTo(cxp + HW * 0.84, browY + 1);
  c.lineTo(cxp + HW * 0.70, FACE.rows.eye.y - ay(eW * 0.16));
  c.lineTo(cxp - HW * 0.70, FACE.rows.eye.y - ay(eW * 0.16));
  c.closePath();
  c.fill();
  c.globalAlpha = 1;

  
  const eye = (dir) => {
    const ex = cxp + dir * eDX;
    
    c.fillStyle = SKIN_DEEP;
    c.globalAlpha = 0.22;
    c.beginPath();
    c.ellipse(ex + dir * eW * 0.14, yEye - ay(eW * 0.16), eW * 0.70, ay(eW * 0.38), 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;

    
    
    
    const inner = ex - dir * eW * 0.50;
    const outer = ex + dir * eW * 0.50;
    const tilt = ay(eW * 0.05);
    const aperture = () => {
      c.beginPath();
      c.moveTo(inner, yEye + tilt * 0.4);
      c.quadraticCurveTo(ex - dir * eW * 0.18, yEye - eH * 1.5, outer, yEye - tilt * 0.2);
      c.quadraticCurveTo(ex - dir * eW * 0.05, yEye + eH * 1.25, inner, yEye + tilt * 0.4);
      c.closePath();
    };
    c.fillStyle = SCLERA;
    aperture();
    c.fill();

    c.save();
    aperture();
    c.clip();
    
    
    
    const ir = eW * 0.21;
    const ix = ex - dir * eW * 0.02;
    c.fillStyle = IRIS;
    c.beginPath(); c.ellipse(ix, yEye, ir, ay(ir), 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = IRIS_DK;
    c.beginPath(); c.ellipse(ix, yEye, ir, ay(ir), 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = PUPIL;
    c.beginPath(); c.ellipse(ix, yEye, ir * 0.44, ay(ir * 0.44), 0, 0, Math.PI * 2); c.fill();
    
    
    
    c.fillStyle = SKIN;
    c.fillRect(ex - eW, yEye - eH * 1.6, eW * 2, eH * 1.6 - ay(ir) * (1.05 - 0.52 * X.lid));
    c.fillStyle = SKIN_SH;
    c.globalAlpha = 0.55;
    c.fillRect(ex - eW, yEye - eH * 1.6, eW * 2, eH * 1.6 - ay(ir) * (1.30 - 0.52 * X.lid));
    c.globalAlpha = 1;
    c.restore();

    
    
    c.strokeStyle = LINE;
    c.lineCap = 'butt';
    c.lineWidth = Math.max(2.6, ay(eW * 0.13));
    c.beginPath();
    c.moveTo(inner, yEye + tilt * 0.4);
    c.quadraticCurveTo(ex - dir * eW * 0.18, yEye - eH * 1.5, outer, yEye - tilt * 0.2);
    c.stroke();
    
    
    c.lineWidth = Math.max(1.6, ay(eW * 0.08));
    c.beginPath();
    c.moveTo(outer - dir * eW * 0.10, yEye - tilt * 0.1);
    c.lineTo(outer + dir * eW * 0.12, yEye + tilt * 0.5);
    c.stroke();
    
    
    c.strokeStyle = SKIN_HI;
    c.globalAlpha = 0.55;
    c.lineWidth = Math.max(1, ay(eW * 0.06));
    c.beginPath();
    c.moveTo(inner + dir * eW * 0.06, yEye + eH * 1.15);
    c.quadraticCurveTo(ex, yEye + eH * 1.45, outer - dir * eW * 0.10, yEye + eH * 0.6);
    c.stroke();
    c.globalAlpha = 1;

    
    
    c.strokeStyle = SKIN_DEEP;
    c.globalAlpha = 0.6;
    c.lineWidth = Math.max(1, ay(eW * 0.06));
    c.beginPath();
    c.moveTo(inner + dir * eW * 0.10, yEye - eH * 1.5);
    c.quadraticCurveTo(ex - dir * eW * 0.10, yEye - eH * 2.5, outer - dir * eW * 0.04, yEye - eH * 1.1);
    c.stroke();
    c.globalAlpha = 1;
    c.lineCap = 'round';

    
    
    c.fillStyle = '#f6f1e6';
    c.fillRect(Math.round(ix - eW * 0.10), Math.round(yEye - ay(ir) * 0.55), 2, 2);
  };
  eye(-1); eye(1);

  
  
  
  
  
  c.strokeStyle = BROW;
  c.lineCap = 'round';
  c.lineWidth = Math.max(3.2, ay(eW * 0.20));
  for (const dir of [-1, 1]) {
    const ex = cxp + dir * eDX;
    const inX = ex - dir * eW * 0.62;
    const outX = ex + dir * eW * 0.66;
    c.beginPath();
    c.moveTo(inX, browY + ay(eW * 0.10) * X.tilt);
    c.quadraticCurveTo(ex, browY - ay(eW * 0.10), outX, browY + ay(eW * 0.16));
    c.stroke();
  }
  
  
  
  c.lineWidth = Math.max(1.4, ay(eW * 0.08));
  for (const dir of [-1, 1]) {
    const ex = cxp + dir * eDX;
    c.beginPath();
    c.moveTo(ex + dir * eW * 0.50, browY + ay(eW * 0.13));
    c.lineTo(ex + dir * eW * 0.86, browY + ay(eW * 0.22));
    c.stroke();
  }

  
  
  
  
  
  
  
  
  c.fillStyle = SKIN_SH;
  c.globalAlpha = 0.22;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.ellipse(cxp + d * noseHalf * 0.84, yNose - ay(eW * 0.06),
      noseHalf * 0.22, ay(noseHalf * 0.16), 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  c.fillStyle = SKIN_DARK;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.ellipse(cxp + d * noseHalf * 0.44, yNose - ay(eW * 0.01),
      noseHalf * 0.17, ay(noseHalf * 0.12), d * -0.5, 0, Math.PI * 2);
    c.fill();
  }

  
  
  
  
  if (X.mouth > 0.02) {
    c.fillStyle = MOUTH_IN;
    c.beginPath();
    c.ellipse(cxp, yMouth + ay(eW * 0.06) * X.mouth,
      mouthHalf * (0.66 + 0.16 * X.mouth), ay(eW * 0.42) * X.mouth, 0, 0, Math.PI * 2);
    c.fill();
  }
  
  c.fillStyle = SKIN_SH;
  c.globalAlpha = 0.15;
  c.beginPath();
  c.moveTo(cxp - mouthHalf, yMouth + ay(eW * 0.02));
  c.quadraticCurveTo(cxp - mouthHalf * 0.5, yMouth - ay(eW * 0.15), cxp, yMouth - ay(eW * 0.04));
  c.quadraticCurveTo(cxp + mouthHalf * 0.5, yMouth - ay(eW * 0.15), cxp + mouthHalf, yMouth + ay(eW * 0.02));
  c.quadraticCurveTo(cxp, yMouth + ay(eW * 0.02), cxp - mouthHalf, yMouth + ay(eW * 0.02));
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
  
  c.strokeStyle = LIP_LINE;
  c.lineCap = 'round';
  c.lineWidth = Math.max(1.8, ay(eW * 0.075));
  c.beginPath();
  c.moveTo(cxp - mouthHalf, yMouth - ay(eW * 0.03));
  c.quadraticCurveTo(cxp, yMouth + ay(eW * 0.04 + X.mouth * 0.12), cxp + mouthHalf, yMouth - ay(eW * 0.03));
  c.stroke();
  
  c.fillStyle = LIP;
  c.globalAlpha = 0.34;
  c.beginPath();
  c.ellipse(cxp, yMouth + ay(eW * 0.16), mouthHalf * 0.70, ay(eW * 0.13), 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = SKIN_HI;
  c.globalAlpha = 0.55;
  c.beginPath();
  c.ellipse(cxp, yMouth + ay(eW * 0.175), mouthHalf * 0.44, ay(eW * 0.070), 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.30;
  c.beginPath();
  c.ellipse(cxp, yMouth + ay(eW * 0.30), mouthHalf * 0.50, ay(eW * 0.06), 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  
  
  
  
  c.strokeStyle = SKIN_DEEP;
  c.globalAlpha = 0.09 + 0.26 * X.tension;
  c.lineWidth = Math.max(1.2, ay(eW * 0.06));
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(cxp + d * noseHalf * 0.98, yNose + ay(eW * 0.02));
    c.quadraticCurveTo(cxp + d * mouthHalf * 1.02, yNose + ay(eW * 0.30),
      cxp + d * mouthHalf * 1.00, yMouth - ay(eW * 0.06));
    c.stroke();
  }
  c.globalAlpha = 1;

  
  
  
  
  
  
  c.fillStyle = HAIR;
  c.beginPath();
  c.moveTo(cxp - HW * 1.10, HAIR_TOP);
  c.lineTo(cxp + HW * 1.10, HAIR_TOP);
  c.lineTo(cxp + HW * 1.10, yHair + CHIN * 0.10);
  
  c.lineTo(cxp + HW * 0.86, yHair + CHIN * 0.055);
  c.quadraticCurveTo(cxp + HW * 0.52, yHair - CHIN * 0.035, cxp + HW * 0.16, yHair - CHIN * 0.012);
  c.quadraticCurveTo(cxp - HW * 0.24, yHair + CHIN * 0.008, cxp - HW * 0.62, yHair + CHIN * 0.030);
  c.lineTo(cxp - HW * 0.86, yHair + CHIN * 0.052);
  c.lineTo(cxp - HW * 1.10, yHair + CHIN * 0.10);
  c.closePath();
  c.fill();

  
  c.fillStyle = HAIR;
  for (const d of [-1, 1]) {
    const y0 = yHair + CHIN * 0.02;
    const y1 = FACE.rows.eye.y - CHIN * 0.01;
    c.beginPath();
    for (let y = y0; y <= y1; y += 3) c.lineTo(cxp + d * FACE.halfAt(y), y);
    for (let y = y1; y >= y0; y -= 3) {
      const k = 1 - (y - y0) / (y1 - y0);
      c.lineTo(cxp + d * (FACE.halfAt(y) - HW * (0.03 + 0.12 * k)), y);
    }
    c.closePath();
    c.fill();
  }

  
  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.42;
  c.beginPath();
  c.moveTo(cxp - HW * 0.92, yHair + CHIN * 0.055);
  c.quadraticCurveTo(cxp - HW * 0.24, yHair + CHIN * 0.008, cxp + HW * 0.16, yHair - CHIN * 0.012);
  c.quadraticCurveTo(cxp + HW * 0.52, yHair - CHIN * 0.035, cxp + HW * 0.86, yHair + CHIN * 0.055);
  c.lineTo(cxp + HW * 0.86, yHair + CHIN * 0.100);
  c.quadraticCurveTo(cxp, yHair + CHIN * 0.055, cxp - HW * 0.92, yHair + CHIN * 0.100);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;

  
  c.strokeStyle = HAIR_SH;
  c.lineWidth = Math.max(2, ay(eW * 0.11));
  c.beginPath();
  c.moveTo(cxp + HW * 0.34, HAIR_TOP + 2);
  c.quadraticCurveTo(cxp + HW * 0.20, yHair - CHIN * 0.075, cxp - HW * 0.22, yHair - CHIN * 0.010);
  c.stroke();
  c.strokeStyle = HAIR_HI;
  c.globalAlpha = 0.55;
  c.lineWidth = Math.max(1.2, ay(eW * 0.06));
  for (const dx of [-0.78, -0.50, -0.28, 0.50, 0.74, 0.94]) {
    c.beginPath();
    c.moveTo(cxp + HW * dx, HAIR_TOP + 3);
    c.quadraticCurveTo(cxp + HW * dx * 0.94, yHair * 0.5, cxp + HW * dx * 0.86, yHair - CHIN * 0.005);
    c.stroke();
  }
  c.globalAlpha = 1;

  c.restore();

  const t = new THREE.CanvasTexture(cv);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  t.flipY = false;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.userData = { canvas: cv, faceSize: FACE_PX };
  return t;
}



















function makePortrait(headGeo, shouldersGeo, faces, bodyMat) {
  const el = document.getElementById('portrait');
  if (!el) return null;
  let r2;
  try {
    r2 = new THREE.WebGLRenderer({ canvas: el, antialias: false, alpha: false });
  } catch (e) {
    return null;                        
  }
  r2.setPixelRatio(1);
  r2.setSize(el.width, el.height, false);
  r2.setClearColor(0x0a1512, 1);
  if ('outputColorSpace' in r2) r2.outputColorSpace = THREE.LinearSRGBColorSpace;
  if ('toneMapping' in r2) r2.toneMapping = THREE.NoToneMapping;

  const sc = new THREE.Scene();
  const faceMat = texturedMaterial(faces.calm);

  
  const bust = new THREE.Group();
  const head = new THREE.Mesh(headGeo, faceMat);
  bust.add(head);
  if (shouldersGeo) bust.add(new THREE.Mesh(shouldersGeo, bodyMat));

  
  
  
  
  
  bust.rotation.x = -Math.PI / 2;
  
  
  
  
  
  sc.add(bust);

  
  
  
  
  
  
  
  
  bust.updateMatrixWorld(true);
  const headBox = new THREE.Box3().setFromObject(head);
  const hc2 = headBox.getCenter(new THREE.Vector3());
  const hsz = headBox.getSize(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 20);
  const dist = Math.max(hsz.x, hsz.y) * 3.1;
  
  
  
  
  
  
  
  
  
  
  
  
  
  cam.position.set(hc2.x + dist, hc2.y + hsz.y * 0.10, hc2.z);
  cam.lookAt(hc2.x, hc2.y - hsz.y * 0.14, hc2.z);

  let current = null;
  return {
    set(expr) {
      if (expr === current || !faces[expr]) return;
      current = expr;
      faceMat.uniforms.uMap.value = faces[expr];
    },
    get expr() { return current; },
    draw(t) {
      
      
      bust.rotation.y = Math.sin(t * 0.7) * 0.11;
      r2.render(sc, cam);
    },
  };
}










function xanderHeadGeometry() {
  const A = ARCH.renji;
  const pose = poseById(XANDER_POSE);
  const K = solve(pose, { flip: false });
  const hc = [K.head[0], 0, K.head[1]];
  return {
    mesh: narrowAcross(head3d({
      centre: hc, r: FRIG.headR, jaw: XANDER_JAW, brow: A.brow, forward: [1, 0, 0],
    })),
    centre: hc,
  };
}
























function narrowAcross(mesh, k = HEAD_NARROW) {
  if (!mesh || !mesh.positions) return mesh;
  for (let i = 1; i < mesh.positions.length; i += 3) mesh.positions[i] *= k;
  return mesh;
}































const WALK_FRAMES = 14;
const SPRINT_FRAMES = 12;
const FIRE_FRAMES = 6;
const STRUGGLE_FRAMES = 8;
const DEATH_FRAMES = 6;

const FIRE_TIME = 0.42;
const DEATH_TIME = 0.9;
const WALK_AMPLITUDE = 0.55;
const STRIDE = 1.55;                    

















function walkPose(phase, mode = 'walk') {
  const idle = poseById(XANDER_POSE);
  const g = gaitPose(phase, mode);
  
  
  return { ...idle, ...g };
}

function xanderParts(pose) {
  
  
  
  
  
  
  
  
  



const A = { ...ARCH.renji, hair: 'crop', jaw: ARCH.renji.jaw, brow: ARCH.renji.brow };
  
  
  
  
  
  const build = 1.16;
  
  
  
  
  
  
  pose = pose || poseById(XANDER_POSE);
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
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    {
      name: 'hair',
      mesh: narrowAcross(hair3d('crop', {
        centre: hc, r: r * 1.07, forward: [1, 0, 0], jaw: XANDER_JAW, brow: A.brow,
      })),
    },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);
}
























const overallsAt = (x, y, z) => {
  if (z < 0.44) return XCOL.pant;
  if (z < 0.68) return x > -0.01 ? XCOL.pant : XCOL.top;
  if (z < 0.715) return (x > -0.01 && Math.abs(y) > 0.055) ? XCOL.accent : (x > -0.01 ? XCOL.pant : XCOL.top);
  if (z < 0.86) return Math.abs(y) > 0.055 && Math.abs(y) < 0.135 ? XCOL.pant : XCOL.top;
  return XCOL.top;
};

const xColour = (n) => (n === 'hair' ? XCOL.hair
  : /^eye/.test(n) ? XCOL.eye
  : /^pelvis|^hip\d/.test(n) ? XCOL.pant
    : /^thigh|^shin|^knee|^ankle/.test(n) ? XCOL.pant
      : /^torso|^trapezius/.test(n) ? overallsAt
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































function buildDeck(scene, level) {
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
  
  
  
  const safeTex = grimeTexture({ base: 0x7f8a94, seams: true, rivets: true, mud: 2, blood: 0, hay: 4 });

  const mats = new Map();
  const matFor = (tex) => {
    if (!mats.has(tex)) mats.set(tex, texturedMaterial(tex));
    return mats.get(tex);
  };

  let salt = 0;
  const add = (w, h, tex, tile, fn) => {
    salt += 1;
    const off = hash2(salt * 3.7, 5.5);
    const m = panel(w, h, tile, { mat: matFor(tex), apply: fn });
    const uv = m.geometry.attributes.uv;
    for (let k = 0; k < uv.count; k += 1) uv.setX(k, uv.getX(k) + off * 3.1);
    uv.needsUpdate = true;
    scene.add(m);
    return m;
  };
  const pick = (arr, i, s2) => arr[Math.floor(hash2(i * 7.3 + s2, 2.1) * arr.length) % arr.length];

  const W = level.width;
  const H = level.height;
  const HALFW = W / 2;
  const SEG = 3.2;                 

  
  const doors = level.rooms.map((m) => ({ x: m.door.x, z: m.door.z, w: m.door.w }));
  const inDoor = (x, z) => doors.some((d) => Math.abs(x - d.x) < W * 0.6 && Math.abs(z - d.z) < d.w);

  
  level.runs.forEach((run, i) => {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len;
    const dz = (run.z1 - run.z0) / len;
    const px = -dz; const pz = dx;                 
    
    
    const t0 = i === 0 ? -HALFW : HALFW;
    const t1 = i === level.runs.length - 1 ? len + HALFW : len - HALFW;
    const span = t1 - t0;
    if (!(span > 0.1)) return;

    const count = Math.max(1, Math.round(span / SEG));
    for (let k = 0; k < count; k += 1) {
      const a = t0 + (k / count) * span;
      const b = t0 + ((k + 1) / count) * span;
      const mid = (a + b) / 2;
      const segLen = b - a;
      const cx = run.x0 + dx * mid;
      const cz = run.z0 + dz * mid;
      const yaw = Math.atan2(dx, dz);              

      add(W, segLen, pick(floors, i * 9 + k, 0.1), 2.2, (m) => {
        m.rotation.x = -Math.PI / 2; m.rotation.z = -yaw; m.position.set(cx, 0, cz);
      });
      ceilingPieces.push(add(W, segLen, pick(ceils, i * 9 + k, 0.4), 2.2, (m) => {
        m.rotation.x = Math.PI / 2; m.rotation.z = yaw; m.position.set(cx, H, cz);
      }));

      for (const sgn of [-1, 1]) {
        const wx = cx + px * HALFW * sgn;
        const wz = cz + pz * HALFW * sgn;
        if (inDoor(wx, wz)) continue;              
        add(segLen, WALL_H, pick(walls, i * 9 + k, sgn > 0 ? 0.9 : 0.2), 2.2, (m) => {
          m.rotation.y = yaw + (sgn > 0 ? -Math.PI / 2 : Math.PI / 2);
          m.position.set(wx, WALL_H / 2, wz);
        });
      }
    }
  });

  
  for (let i = 0; i < level.runs.length - 1; i += 1) {
    const a = level.runs[i]; const b = level.runs[i + 1];
    const jx = a.x1; const jz = a.z1;
    add(W, W, pick(floors, i, 3.3), 2.2, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(jx, 0, jz); });
    ceilingPieces.push(add(W, W, pick(ceils, i, 4.4), 2.2,
      (m) => { m.rotation.x = Math.PI / 2; m.position.set(jx, H, jz); }));

    
    
    
    const alen = Math.hypot(a.x1 - a.x0, a.z1 - a.z0);
    const blen = Math.hypot(b.x1 - b.x0, b.z1 - b.z0);
    const inDir = { x: (a.x1 - a.x0) / alen, z: (a.z1 - a.z0) / alen };   
    const outDir = { x: (b.x1 - b.x0) / blen, z: (b.z1 - b.z0) / blen };  
    const sides = [
      { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    ];
    for (const sd of sides) {
      const open = (sd.x * outDir.x + sd.z * outDir.z) > 0.5     
        || (sd.x * -inDir.x + sd.z * -inDir.z) > 0.5;            
      if (open) continue;
      add(W, WALL_H, pick(walls, i, 5.5), 2.2, (m) => {
        m.rotation.y = Math.atan2(sd.x, sd.z) + Math.PI;
        m.position.set(jx + sd.x * HALFW, WALL_H / 2, jz + sd.z * HALFW);
      });
    }
  }

  
  for (const m of level.rooms) {
    const rw = m.x1 - m.x0; const rd = m.z1 - m.z0;
    const cx = (m.x0 + m.x1) / 2; const cz = (m.z0 + m.z1) / 2;
    const tex = m.kind === 'safe' ? safeTex : pick(walls, 3, 6.6);
    add(rw, rd, m.kind === 'safe' ? safeTex : pick(floors, 2, 7.7), 2.6,
      (p2) => { p2.rotation.x = -Math.PI / 2; p2.position.set(cx, 0, cz); });
    ceilingPieces.push(add(rw, rd, pick(ceils, 1, 8.8), 2.6,
      (p2) => { p2.rotation.x = Math.PI / 2; p2.position.set(cx, H, cz); }));

    
    add(rw, WALL_H, tex, 2.6, (p2) => { p2.position.set(cx, WALL_H / 2, m.z0); p2.rotation.y = 0; });
    add(rw, WALL_H, tex, 2.6, (p2) => { p2.position.set(cx, WALL_H / 2, m.z1); p2.rotation.y = Math.PI; });
    const far = m.side > 0 ? m.x1 : m.x0;
    add(rd, WALL_H, tex, 2.6, (p2) => {
      p2.position.set(far, WALL_H / 2, cz);
      p2.rotation.y = m.side > 0 ? -Math.PI / 2 : Math.PI / 2;
    });
    
    const near = m.door.x;
    const gap = m.door.w / 2;
    for (const [za, zb] of [[m.z0, m.door.z - gap], [m.door.z + gap, m.z1]]) {
      const h2 = zb - za;
      if (h2 < 0.2) continue;
      add(h2, WALL_H, tex, 2.6, (p2) => {
        p2.position.set(near, WALL_H / 2, (za + zb) / 2);
        p2.rotation.y = m.side > 0 ? Math.PI / 2 : -Math.PI / 2;
      });
    }
  }

  
  const endMat = matFor(endTex);
  const first = level.runs[0];
  scene.add(panel(W, H, 2.2, {
    mat: endMat,
    apply: (m) => { m.position.set(first.x0, H / 2, first.z0 - HALFW); },
  }));
  const last = level.runs[level.runs.length - 1];
  scene.add(panel(W, H, 2.2, {
    mat: endMat,
    apply: (m) => { m.position.set(last.x1, H / 2, last.z1 + HALFW); m.rotation.y = Math.PI; },
  }));

  
  const stripTex = grimeTexture({ base: 0xe8f0c8, seams: false, rivets: false, mud: 1, blood: 0, hay: 0 });
  for (const run of level.runs) {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    for (let t = 2; t < len - 1; t += 7) {
      const lm = texturedMaterial(stripTex);
      lm.transparent = true;
      const x = run.x0 + dx * t; const z = run.z0 + dz * t;
      const strip = panel(0.5, 1.6, 1.6, {
        mat: lm,
        apply: (m) => {
          m.rotation.x = Math.PI / 2;
          m.rotation.z = Math.atan2(dx, dz);
          m.position.set(x, H - 0.02, z);
        },
      });
      scene.add(strip);
      strips.push({ mesh: strip, mat: lm, phase: hash2(x * 3.1 + z, 7.7) * 10, next: 3 + hash2(z, 2.2) * 12 });
    }
  }
  return { strips, ceilingPieces };
}















const GAS_PER_LEAK = 46;

function makeLeak(x, y, z, dir) {
  const pos = new Float32Array(GAS_PER_LEAK * 3);
  const life = new Float32Array(GAS_PER_LEAK);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    
    
    
    color: 0x6d7a72, size: 0.15, sizeAttenuation: true,
    transparent: true, opacity: 0.16, depthWrite: false,
  }));
  pts.frustumCulled = false;
  for (let i = 0; i < GAS_PER_LEAK; i += 1) life[i] = Math.random();
  return {
    points: pts,
    step(dt) {
      for (let i = 0; i < GAS_PER_LEAK; i += 1) {
        life[i] += dt * 0.42;
        if (life[i] > 1) life[i] -= 1;
        const t = life[i];
        
        const travel = (2.6 / 3.1) * (1 - Math.exp(-3.1 * t));
        const spread = t * t * 0.55;
        const seed = i * 12.9898;
        pos[i * 3] = x + dir[0] * travel + (hash2(seed, 1.1) - 0.5) * spread;
        pos[i * 3 + 1] = y + dir[1] * travel + t * 0.62 + (hash2(seed, 2.2) - 0.5) * spread;
        pos[i * 3 + 2] = z + dir[2] * travel + (hash2(seed, 3.3) - 0.5) * spread;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}











function makeWire(x, z, len, seed) {
  const N = 7;
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x14110e }));
  line.frustumCulled = false;
  return {
    line,
    tip: [x, HALL_H - len, z],
    step(t) {
      const sway = Math.sin(t * 0.6 + seed) * 0.16;
      for (let i = 0; i < N; i += 1) {
        const f = i / (N - 1);
        
        pos[i * 3] = x + sway * f * f;
        pos[i * 3 + 1] = HALL_H - len * f - Math.sin(f * Math.PI) * 0.10;
        pos[i * 3 + 2] = z + Math.cos(t * 0.5 + seed) * 0.06 * f * f;
      }
      this.tip[0] = pos[(N - 1) * 3];
      this.tip[1] = pos[(N - 1) * 3 + 1];
      this.tip[2] = pos[(N - 1) * 3 + 2];
      geo.attributes.position.needsUpdate = true;
    },
  };
}

function sparkSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;
  
  
  
  for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k += 1) {
    const at = t + k * (0.03 + Math.random() * 0.07);
    const b = ctx.createBuffer(1, 1024, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = ctx.createBufferSource(); n.buffer = b;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16 + Math.random() * 0.12, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    n.connect(hp); hp.connect(g); g.connect(audio.sfxBus);
    n.start(at); n.stop(at + 0.06);
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'square'; o.frequency.value = 3200 + Math.random() * 2600;
    og.gain.setValueAtTime(0.05, at);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    o.connect(og); og.connect(audio.sfxBus); o.start(at); o.stop(at + 0.05);
  }
}












function creakSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.02;
  const dur = 1.4 + Math.random() * 2.0;
  const base = 52 + Math.random() * 70;

  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(base, t);
  o.frequency.linearRampToValueAtTime(base * (1.1 + Math.random() * 0.5), t + dur);

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(base * 7, t);
  bp.frequency.linearRampToValueAtTime(base * 11, t + dur);
  bp.Q.value = 14;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  
  
  let at = t;
  while (at < t + dur) {
    const stepLen = 0.045 + Math.random() * 0.16;
    g.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.10, at + stepLen * 0.35);
    g.gain.exponentialRampToValueAtTime(0.004, at + stepLen);
    at += stepLen;
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);

  o.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  o.start(t); o.stop(t + dur + 0.3);
}

































const CZ = { legs: { lo: 0.03, hi: 0.21 }, torso: { lo: 0.22, hi: 0.74 }, head: { lo: 0.75, hi: 0.99 } };
const CT_H = CZ.torso.hi - CZ.torso.lo;
const CHICK_PIVOT = {
  legL: [-0.010, -0.062, CZ.legs.hi],
  legR: [-0.010, 0.062, CZ.legs.hi],
  wingL: [-0.010, -0.240 * 0.82, CZ.torso.lo + CT_H * 0.72],
  wingR: [-0.010, 0.240 * 0.82, CZ.torso.lo + CT_H * 0.72],
  tail: [-0.190, 0, CZ.torso.lo + CT_H * 0.55],
  torso: [0, 0, (CZ.torso.lo + CZ.torso.hi) / 2],
  head: [0.02, 0, CZ.head.lo],
  beak: [0.02, 0, CZ.head.lo],
  comb: [0.02, 0, CZ.head.lo],
  eyeL: [0.02, 0, CZ.head.lo],
  eyeR: [0.02, 0, CZ.head.lo],
};
const BODY_PIVOT = [0, 0, (CZ.torso.lo + CZ.torso.hi) / 2];
const HEAD_PIVOT = [0.02, 0, CZ.head.lo];

function chickenRig(parts, colourOf, targetHeight, material) {
  
  
  
  let lo = Infinity; let hi = -Infinity;
  for (const p of parts) {
    for (let i = 2; i < p.mesh.positions.length; i += 3) {
      if (p.mesh.positions[i] < lo) lo = p.mesh.positions[i];
      if (p.mesh.positions[i] > hi) hi = p.mesh.positions[i];
    }
  }
  const sc = (hi - lo) > 1e-6 ? targetHeight / (hi - lo) : 1;

  const geoFor = (p, pivot) => {
    const pos = []; const col = [];
    const c = new THREE.Color(colourOf(p.name));
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      pos.push(
        (p.mesh.positions[i] - pivot[0]) * sc,
        (p.mesh.positions[i + 1] - pivot[1]) * sc,
        (p.mesh.positions[i + 2] - lo - (pivot[2] - lo)) * sc,
      );
      col.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex([...p.mesh.indices]);
    g.computeVertexNormals();
    return g;
  };

  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  body.position.set(BODY_PIVOT[0] * sc, BODY_PIVOT[1] * sc, (BODY_PIVOT[2] - lo) * sc);
  head.position.set((HEAD_PIVOT[0] - BODY_PIVOT[0]) * sc, 0, (HEAD_PIVOT[2] - BODY_PIVOT[2]) * sc);
  body.add(head);
  root.add(body);

  const named = {};
  const HEADPARTS = new Set(['head', 'beak', 'comb', 'eyeL', 'eyeR']);
  for (const p of parts) {
    const pivot = CHICK_PIVOT[p.name] || [0, 0, lo];
    const m = new THREE.Mesh(geoFor(p, pivot), material);
    named[p.name] = m;
    if (p.name === 'legL' || p.name === 'legR') {
      m.position.set(pivot[0] * sc, pivot[1] * sc, (pivot[2] - lo) * sc);
      root.add(m);
    } else if (HEADPARTS.has(p.name)) {
      head.add(m);                    
    } else {
      m.position.set(
        (pivot[0] - BODY_PIVOT[0]) * sc,
        (pivot[1] - BODY_PIVOT[1]) * sc,
        (pivot[2] - BODY_PIVOT[2]) * sc,
      );
      body.add(m);
    }
  }
  return { root, body, head, named, scale: sc };
}







function applyChickenPose(rig, pose) {
  rig.body.rotation.y = pose.torsoPitch;
  rig.body.rotation.x = pose.bodyRoll;
  rig.body.position.z = (BODY_PIVOT[2] - CZ.legs.lo) * rig.scale + pose.bodyLift * CHICKEN_H;
  rig.head.rotation.y = pose.headPitch;
  rig.head.position.x = pose.headThrust * CHICKEN_H;
  rig.head.position.z = ((HEAD_PIVOT[2] - BODY_PIVOT[2]) * rig.scale) + pose.headBob * CHICKEN_H;
  if (rig.named.legL) {
    rig.named.legL.rotation.y = pose.legL.swing;
    rig.named.legL.position.z = (CHICK_PIVOT.legL[2] - CZ.legs.lo) * rig.scale + pose.legL.lift * CHICKEN_H;
  }
  if (rig.named.legR) {
    rig.named.legR.rotation.y = pose.legR.swing;
    rig.named.legR.position.z = (CHICK_PIVOT.legR[2] - CZ.legs.lo) * rig.scale + pose.legR.lift * CHICKEN_H;
  }
  
  
  
  if (rig.named.wingL) rig.named.wingL.rotation.x = -(pose.wingFlap + pose.mutantLag * 0.16);
  if (rig.named.wingR) rig.named.wingR.rotation.x = pose.wingFlap * 0.86 - pose.mutantLag * 0.22;
  if (rig.named.tail) rig.named.tail.rotation.y = -pose.tailFlick + pose.mutantLag * 0.1;
}







const SEVER_PART = { 'leg-l': 'legL', 'leg-r': 'legR', 'wing-l': 'wingL', 'wing-r': 'wingR', head: 'head' };


















const CHICK_CALL = {
  
  idle:   { f0: 340, to: 260, dur: 0.16, gain: 0.16, q: 9 },
  alert:  { f0: 520, to: 980, dur: 0.34, gain: 0.42, q: 13 },
  windup: { f0: 300, to: 210, dur: 0.26, gain: 0.26, q: 8 },
  strike: { f0: 900, to: 1500, dur: 0.20, gain: 0.55, q: 16 },
  hurt:   { f0: 760, to: 300, dur: 0.38, gain: 0.50, q: 11 },
  die:    { f0: 430, to: 120, dur: 0.75, gain: 0.55, q: 7 },
};

function chickVoice(bird, kind, dist) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const spec = CHICK_CALL[kind];
  if (!spec) return;
  
  const near = Math.max(0, 1 - dist / 30);
  if (near <= 0.02) return;
  const t = ctx.currentTime + 0.01;
  const v = bird.voice;
  const dur = spec.dur * (2 - v) * 0.9;

  
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(spec.f0 * v * 0.55, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, spec.to * v * 0.55), t + dur);

  
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.Q.value = spec.q;
  f1.frequency.setValueAtTime(spec.f0 * v, t);
  f1.frequency.exponentialRampToValueAtTime(Math.max(60, spec.to * v), t + dur);
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.Q.value = spec.q * 0.6;
  f2.frequency.setValueAtTime(spec.f0 * v * 2.4, t);
  f2.frequency.exponentialRampToValueAtTime(Math.max(120, spec.to * v * 2.1), t + dur);

  
  const air = ctx.createBiquadFilter();
  air.type = 'lowpass';
  air.frequency.value = 700 + near * 9000;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(spec.gain * near * near, t + dur * 0.14);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(f1); f1.connect(f2); f2.connect(air); air.connect(g); g.connect(audio.sfxBus);
  o.start(t); o.stop(t + dur + 0.05);
}


function hitSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.005;
  const b = ctx.createBuffer(1, 2048, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const n = ctx.createBufferSource(); n.buffer = b;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  n.connect(lp); lp.connect(g); g.connect(audio.sfxBus);
  n.start(t); n.stop(t + 0.18);
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

function drawMap(cv, player, birds, exit, level, deck) {
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

  const hw = deck.width / 2;
  const H3 = deck.height;

  
  
  
  
  const here = deck.runs[Math.min(deck.runs.length - 1, Math.max(0,
    deck.runs.findIndex((q) => {
      const r = runRect(q);
      return player.x >= r.x0 && player.x <= r.x1 && player.z >= r.z0 && player.z <= r.z1;
    })))] || deck.runs[0];
  {
    const len = Math.hypot(here.x1 - here.x0, here.z1 - here.z0) || 1;
    const dx = (here.x1 - here.x0) / len; const dz = (here.z1 - here.z0) / len;
    const px = -dz; const pz = dx;
    for (const dy of [-MAP.deckGap, MAP.deckGap]) {
      for (const sgn of [-1, 1]) {
        seg(p(here.x0 + px * hw * sgn, dy, here.z0 + pz * hw * sgn),
          p(here.x1 + px * hw * sgn, dy, here.z1 + pz * hw * sgn), GHOST, 1);
      }
      for (let t = 0; t < len; t += 12) {
        const x = here.x0 + dx * t; const z = here.z0 + dz * t;
        seg(p(x - px * hw, dy, z - pz * hw), p(x + px * hw, dy, z + pz * hw), GHOST, 1);
      }
    }
  }

  
  
  for (const run of deck.runs) {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    if (!(len > 0)) continue;
    
    
    const mid = { x: (run.x0 + run.x1) / 2, z: (run.z0 + run.z1) / 2 };
    if (Math.hypot(mid.x - player.x, mid.z - player.z) > MAP.range + len) continue;
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    const px = -dz; const pz = dx;
    const at = (t, sgn) => ({ x: run.x0 + dx * t + px * hw * sgn, z: run.z0 + dz * t + pz * hw * sgn });

    for (const sgn of [-1, 1]) {
      const s0 = at(-hw, sgn); const s1 = at(len + hw, sgn);
      seg(p(s0.x, 0, s0.z), p(s1.x, 0, s1.z), MID, 1.6);
      seg(p(s0.x, H3, s0.z), p(s1.x, H3, s1.z), FAINT, 1);
    }
    for (let t = 0; t <= len; t += 4) {
      const l = at(t, -1); const r = at(t, 1);
      seg(p(l.x, 0, l.z), p(r.x, 0, r.z), FAINT, 1);          
      
      
      if (Math.round(t / 4) % 3 === 0) {
        seg(p(l.x, 0, l.z), p(l.x, H3, l.z), FAINT, 1);
        seg(p(r.x, 0, r.z), p(r.x, H3, r.z), FAINT, 1);
        seg(p(l.x, H3, l.z), p(r.x, H3, r.z), 'rgba(111,240,216,0.12)', 1);
      }
    }
  }

  
  for (const m of deck.rooms) {
    const c = { x: (m.x0 + m.x1) / 2, z: (m.z0 + m.z1) / 2 };
    if (Math.hypot(c.x - player.x, c.z - player.z) > MAP.range + 12) continue;
    const safe = m.kind === 'safe';
    const col = safe ? 'rgba(140,255,190,0.85)' : 'rgba(111,240,216,0.4)';
    const corners = [[m.x0, m.z0], [m.x1, m.z0], [m.x1, m.z1], [m.x0, m.z1]];
    for (let i = 0; i < 4; i += 1) {
      const q = corners[i]; const w2 = corners[(i + 1) % 4];
      seg(p(q[0], 0, q[1]), p(w2[0], 0, w2[1]), col, safe ? 1.5 : 1);
      seg(p(q[0], H3, q[1]), p(w2[0], H3, w2[1]), col, 1);
      seg(p(q[0], 0, q[1]), p(q[0], H3, q[1]), col, 1);
    }
    if (safe) {
      const label = p(c.x, H3 + 0.9, c.z);
      if (label) {
        g.fillStyle = 'rgba(140,255,190,0.95)';
        g.font = 'bold 8px ui-monospace, monospace';
        g.textAlign = 'center';
        g.fillText('SAFE', label[0], label[1]);
      }
    }
  }

  
  for (const b of birds) {
    if (!b.alive) continue;
    if (Math.hypot(b.x - player.x, b.z - player.z) > MAP.range) continue;
    const foot = p(b.x, 0, b.z);
    const top = p(b.x, 0.9, b.z);
    if (!foot || !top) continue;
    seg(foot, top, 'rgba(255,90,74,0.75)', 1);
    g.fillStyle = '#ff5a4a';
    g.fillRect(top[0] - 2.5, top[1] - 2.5, 5, 5);
  }

  
  if (Math.hypot(exit.x - player.x, exit.z - player.z) < MAP.range + 14) {
    const w = 1.1;
    const corners = [
      [exit.x - w, exit.z - 0.8], [exit.x + w, exit.z - 0.8],
      [exit.x + w, exit.z + 0.8], [exit.x - w, exit.z + 0.8],
    ];
    for (let i = 0; i < 4; i += 1) {
      const a2 = corners[i]; const b2 = corners[(i + 1) % 4];
      seg(p(a2[0], 0, a2[1]), p(b2[0], 0, b2[1]), NEON, 1.4);
      seg(p(a2[0], HALL_H, a2[1]), p(b2[0], HALL_H, b2[1]), NEON, 1.4);
      seg(p(a2[0], 0, a2[1]), p(a2[0], HALL_H, a2[1]), NEON, 1.4);
    }
    const label = p(exit.x, HALL_H + 1.1, exit.z);
    if (label) {
      g.fillStyle = NEON;
      g.font = 'bold 9px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('LIFT', label[0], label[1]);
      g.font = '8px ui-monospace, monospace';
      
      
      
      const togo = Math.max(0, progressAt(deck, exit.x, exit.z) - progressAt(deck, player.x, player.z));
      g.fillText(`${Math.round(togo)}m`, label[0], label[1] + 9);
    }
  }

  
  const foot = p(player.x, 0, player.z);
  const head = p(player.x, 1.8, player.z);
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
  
  
  
  
  renderer.setClearColor(0x000000, 1);
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

  
  
  
  
  
  const deck = buildLevel(1);
  const { strips, ceilingPieces } = buildDeck(scene, deck);

  
  
  const leaks = [];
  const wires = [];
  for (const run of deck.runs) {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    const px = -dz; const pz = dx;
    for (let t = 5; t < len - 3; t += 11) {
      const x = run.x0 + dx * t; const z = run.z0 + dz * t;
      const side = hash2(x + z, 1.7) > 0.5 ? 1 : -1;
      
      
      
      leaks.push(makeLeak(
        x + px * side * (HALL_W / 2 - 0.12),
        0.55 + hash2(x, 2.9) * 1.5,
        z + pz * side * (HALL_W / 2 - 0.12),
        [-px * side * 0.9, 0.25, -pz * side * 0.9],
      ));
      if (hash2(x + z, 5.5) > 0.42) {
        wires.push(makeWire(
          x + px * (hash2(z, 6.1) - 0.5) * HALL_W * 0.7,
          z + pz * (hash2(z, 6.1) - 0.5) * HALL_W * 0.7 + dz * 3,
          0.7 + hash2(z, 7.3) * 1.5, x + z,
        ));
      }
    }
  }
  for (const l of leaks) scene.add(l.points);
  for (const w of wires) scene.add(w.line);

  
  
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  const sparkPt = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    color: 0xcfe6ff, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0,
    depthWrite: false,
  }));
  sparkPt.frustumCulled = false;
  scene.add(sparkPt);

  
  
  
  
  
  
  const bodyParts = xanderParts();
  const headBuilt = xanderHeadGeometry();
  const allParts = [...bodyParts, { name: 'head', mesh: headBuilt.mesh }];

  
  
  
  
  
  
  const bake = (pose) => partsToGeometry(xanderParts(pose), xColour, XANDER_H, allParts);
  const walkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) walkGeo.push(bake(walkPose(i / WALK_FRAMES, 'walk')));
  
  
  
  
  
  
  
  const sprintGeo = [];
  for (let i = 0; i < SPRINT_FRAMES; i += 1) sprintGeo.push(bake(walkPose(i / SPRINT_FRAMES, 'sprint')));
  const fireGeo = [];
  for (let i = 0; i < FIRE_FRAMES; i += 1) {
    fireGeo.push(bake({ ...poseById(XANDER_POSE), ...firePose((i / (FIRE_FRAMES - 1)) * FIRE_TIME) }));
  }
  const struggleGeo = [];
  for (let i = 0; i < STRUGGLE_FRAMES; i += 1) {
    
    struggleGeo.push(bake({ ...poseById(XANDER_POSE), ...strugglePose((i / STRUGGLE_FRAMES) * (Math.PI * 2 / 13.5), 0.8) }));
  }
  const deathGeo = [];
  for (let i = 0; i < DEATH_FRAMES; i += 1) {
    deathGeo.push(bake({ ...poseById(XANDER_POSE), ...deathPose(i / (DEATH_FRAMES - 1)) }));
  }
  const xGeo = partsToGeometry(bodyParts, xColour, XANDER_H, allParts);

  
  
  
  
  
  
  
  
  
  
  
  
  const gunGeo = (() => {
    const built = buildBoltDriver();
    const pos = []; const col = []; const idx = [];
    
    
    
    const GCOL = {
      receiver: 0x4a4f52, nose: 0x5b6165, guard: 0x2f3335,
      bottle: 0x6a5f4a, magazine: 0x3d4143, grip: 0x241f1c, trigger: 0x2a2d2f,
    };
    for (const p of built.parts) {
      const base = pos.length / 3;
      const c = new THREE.Color(GCOL[p.name] ?? 0x4a4f52);
      for (let i = 0; i < p.mesh.positions.length; i += 3) {
        pos.push(p.mesh.positions[i], p.mesh.positions[i + 1], p.mesh.positions[i + 2]);
        col.push(c.r, c.g, c.b);
      }
      for (const i of p.mesh.indices) idx.push(base + i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  })();
  const gun = new THREE.Mesh(gunGeo, mat);
  gun.visible = false;

  
  
  
  const flashGeo = new THREE.PlaneGeometry(0.34, 0.34);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(...muzzlePoint());
  gun.add(flash);
  const xander = new THREE.Mesh(xGeo, mat);
  xander.rotation.x = -Math.PI / 2;   
  xander.add(gun);
  scene.add(xander);

  
  
  const torsoParts = bodyParts.filter((p) => /^torso|^trapezius|^shoulder|^hip/.test(p.name));
  const shouldersGeo = torsoParts.length
    ? partsToGeometry(torsoParts, xColour, XANDER_H, allParts)
    : null;

  const faces = {
    calm: xanderFaceSheet('calm'),
    alert: xanderFaceSheet('alert'),
    afraid: xanderFaceSheet('afraid'),
    hurt: xanderFaceSheet('hurt'),
  };
  const faceMat = texturedMaterial(faces.calm);
  const headGeo = partsToGeometry([{ name: 'head', mesh: headBuilt.mesh }], () => 0xffffff, XANDER_H, allParts, true);
  
  
  
  
  
  
  
  headGeo.computeBoundingBox();
  const hb = headGeo.boundingBox;
  const headMid = new THREE.Vector3(
    (hb.min.x + hb.max.x) / 2, (hb.min.y + hb.max.y) / 2, (hb.min.z + hb.max.z) / 2,
  );
  headGeo.translate(-headMid.x, -headMid.y, -headMid.z);
  
  
  
  
  
  
  
  
  
  
  
  
  if (shouldersGeo) shouldersGeo.translate(-headMid.x, -headMid.y, -headMid.z);
  const neck = new THREE.Group();
  neck.position.copy(headMid);
  const xHead = new THREE.Mesh(headGeo, faceMat);
  neck.add(xHead);
  xander.add(neck);
  const portrait = makePortrait(headGeo, shouldersGeo, faces, mat);

  const chickenParts = buildChicken().parts;

  const player = {
    
    
    
    
    
    
    
    x: deck.start.x, z: deck.start.z, yaw: 0,
    vitals: spawnVitals(),
    
    
    
    
    
    
    
    
    
    
    weapon: readyWeapon('boltDriver', { ammo: 48 }),
    struggle: null,
    latchedBy: null,
    dead: false,
  };

  const birds = [];
  let chickSeed = 0;
  function addChicken(z, x) {
    const rig = chickenRig(chickenParts, (n) => CCOL[n] ?? 0xb9b07a, CHICKEN_H, mat);
    rig.root.rotation.x = -Math.PI / 2;
    scene.add(rig.root);
    chickSeed += 0.37;
    birds.push({
      
      mesh: rig.root, rig, x, z, alive: true,
      creature: spawnCreature('chicken'),
      anim: emptyChickenAnim(chickSeed % 1),
      
      
      
      
      voice: 0.78 + (chickSeed * 1.7) % 0.62,
      idleIn: 1 + Math.random() * 5,
      latched: false,
      cool: 0,
    });
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  [18, 30].forEach((back, i) => {
    const p = pointBehind(deck, deck.start.x, deck.start.z, back);
    addChicken(p.z, p.x + (i % 2 ? 1 : -1) * 0.5);
  });

  
  const EXIT = deck.exit;
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
  lift.position.set(EXIT.x, 1.2, EXIT.z + 0.9);
  lift.rotation.y = Math.PI;
  scene.add(lift);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  
  
  renderer.setSize(canvas.clientWidth || 960, canvas.clientHeight || 540, false);
  camera.aspect = (canvas.clientWidth || 960) / (canvas.clientHeight || 540);
  camera.updateProjectionMatrix();

  
  const keys = new Set();
  let fireHeld = false;
  let aimLow = false;
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
    if (e.button === 2) { aimLow = true; return; }
    fireHeld = true;
  });
  addEventListener('pointerup', () => { fireHeld = false; aimLow = false; });
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
  let headLook = 0;
  let creakIn = 6 + Math.random() * 10;
  let sparkIn = 3 + Math.random() * 7;
  let sparkFlash = 0;
  const rails = railNodesForRuns(deck.runs);
  let camNode = nodeAt(rails, progressAt(deck, deck.start.x, deck.start.z));
  let cutFlash = 0;
  let target = null;
  let walkDist = 0;
  let fireT = 99;        
  let deathT = 0;
  let sprintNow = false;
  let level = 1;
  let liftIn = 0;
  const mapCv = document.getElementById('map');
  
  
  
  
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tmpV = new THREE.Vector3();
  const reticEl = document.getElementById('retic');
  const gradeEl = document.getElementById('grade');

  function step(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now;

    if (!player.dead) {
      
      
      
      
      const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || (touch.active && touch.fwd > 0.75);
      sprintNow = sprint;
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
      
      
      
      
      
      
      
      
      
      const moved = moveInLevel(deck,
        player,
        -Math.sin(player.yaw) * fwd * speed * dt,
        Math.cos(player.yaw) * fwd * speed * dt);
      player.x = moved.x;
      player.z = moved.z;
      
      
      
      walkDist += Math.abs(fwd) * speed * dt + Math.abs(turn) * 0.85 * dt;

      const mode = player.struggle ? 'walk' : (sprint && fwd ? 'sprint' : 'walk');
      tickVitals(player.vitals, dt, mode);
    }

    
    
    
    
    
    
    
    
    target = null;
    if (!player.dead && !player.struggle) {
      let best = Infinity;
      const range = player.weapon.spec?.range ?? 18;
      for (const b of birds) {
        if (!b.alive) continue;
        const dx = b.x - player.x; const dz = b.z - player.z;
        const d = Math.hypot(dx, dz);
        if (d > range || d > best) continue;
        
        let off = Math.atan2(-dx, dz) - player.yaw;
        off = Math.atan2(Math.sin(off), Math.cos(off));
        if (Math.abs(off) > 0.61) continue;          
        best = d; target = b;
      }
    }

    
    fireT += dt;
    tickWeapon(player.weapon, dt);
    if (fireHeld && !player.struggle && !player.dead && canFire(player.weapon)) {
      fire(player.weapon);
      shotFlash = 0.06;
      fireT = 0;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const muzzleY = 1.30;
      const aimDrop = (aimLow || keys.has('ControlLeft') || keys.has('KeyQ')) ? 1.0 : 0.30;
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
        
        
        
        
        
        
        const aimYaw = (target === b) ? Math.atan2(-(b.x - player.x), b.z - player.z) : player.yaw;
        const hit = resolveHit(
          b.creature,
          toLocal(player.x, muzzleY, player.z),
          toLocal(player.x - Math.sin(aimYaw) * 30, tipY, player.z + Math.cos(aimYaw) * 30),
        );
        if (!hit) continue;
        applyDamage(b.creature, hit.id, player.weapon.spec?.limbDamage ?? 12);
        const st = statusOf(b.creature);
        
        
        if (!st.alive) {
          chickVoice(b, 'die', Math.hypot(player.x - b.x, player.z - b.z));
          b.alive = false;
          b.mesh.visible = false;
          if (b.latched) { player.latchedBy = null; player.struggle = null; endGrapple(player.vitals); }
        }
        break;                                        
      }
    }

    
    for (const b of birds) {
      if (!b.alive) continue;

      
      if (b.kick > 0) {
        b.kick -= dt;
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        b.vy -= 14 * dt;                       
                                               
        b.mesh.position.set(b.x, Math.max(0, b.mesh.position.y + b.vy * dt), b.z);
        b.mesh.rotation.x = -Math.PI / 2 + b.spin * (0.85 - b.kick);
        if (b.kick <= 0) { b.alive = false; b.mesh.visible = false; }
        continue;
      }
      const dx = player.x - b.x; const dz = player.z - b.z;
      const dist = Math.hypot(dx, dz);
      const mob = mobilityOf(b.creature);
      const mobScale = (typeof mob === 'number' ? mob : (mob?.speed ?? 1));

      
      
      
      
      if (b.latched) b.anim.state = 'latched';
      const r = stepChicken(b.anim, dt, player.dead ? 1e6 : dist);
      b.anim = r.anim;

      
      if (r.event === 'alert') chickVoice(b, 'alert', dist);
      else if (r.event === 'windup') chickVoice(b, 'windup', dist);
      else if (r.event === 'strike') chickVoice(b, 'strike', dist);

      
      
      b.idleIn -= dt;
      if (b.idleIn <= 0) {
        b.idleIn = 3 + Math.random() * 7;
        if (b.anim.state === 'dormant' && dist < 26) chickVoice(b, 'idle', dist);
      }

      if (!b.latched && !player.dead && r.speed !== 0 && dist > 0.05) {
        const move = r.speed * mobScale * dt;
        b.x += (dx / dist) * move;
        b.z += (dz / dist) * move;
      }
      
      if (r.canLatch && !b.latched && !player.dead && !player.struggle && b.cool <= 0) {
        b.latched = true;
        player.latchedBy = b;
        
        
        
        
        player.struggle = createStruggle({ verb: VERB_FOR.chicken ?? 'mash', mode: 'reduced' });
        shake = Math.max(shake, 0.55);
        hitSfx();
        beginGrapple(player.vitals, 'chicken');
      }
      b.cool -= dt;

      
      const sev = statusOf(b.creature).severedLimbs;
      if (sev.length !== (b.sevShown ?? 0)) {
        b.sevShown = sev.length;
        for (const id of sev) {
          const part = b.rig.named[SEVER_PART[id]];
          if (part && part.visible) { part.visible = false; chickVoice(b, 'hurt', dist); }
        }
      }

      applyChickenPose(b.rig, chickenPose(b.anim));
      b.mesh.position.set(b.x, 0, b.z);
      b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI;
    }

    
    if (player.struggle) {
      player.struggle.update(dt);
      if (player.struggle.progress >= 1 || player.struggle.done) {
        const b = player.latchedBy;
        if (b) {
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          b.latched = false;
          b.kick = 0.85;                       
          b.vz = -Math.cos(player.yaw) * 9.5;  
          b.vx = Math.sin(player.yaw) * 9.5;
          b.vy = 5.4;                          
          b.spin = 11 + Math.random() * 6;
          kickSfx();
          shake = Math.max(shake, 0.5);
        }
        player.latchedBy = null;
        player.struggle = null;
        endGrapple(player.vitals);
      }
    }

    if (player.vitals.health <= 0 && !player.dead) {
      player.dead = true;
      hud.dead();
    }

    
    
    
    
    
    
    
    
    
    
    
    
    const wasNode = camNode;
    
    
    
    camNode = nodeAt(rails, progressAt(deck, player.x, player.z), camNode);
    if (camNode !== wasNode) cutFlash = 0.05;   
    const place = railPlacement(rails, camNode, player);
    camera.fov = place.fov;
    camera.updateProjectionMatrix();
    
    if (player.struggle) shake = Math.min(0.9, Math.max(shake, player.struggle.progress * 0.25 + 0.35));
    shake = Math.max(0, shake - dt * 1.9);
    const sx = shake ? (Math.random() - 0.5) * shake * 0.34 : 0;
    const sy = shake ? (Math.random() - 0.5) * shake * 0.28 : 0;
    camera.position.set(place.eye.x + sx, place.eye.y + sy, place.eye.z);
    camera.lookAt(place.target.x + sx * 0.4, place.target.y + sy * 0.4, place.target.z);

    
    
    
    
    
    
    const moving = !player.dead && !player.struggle
      && (keys.has('KeyW') || keys.has('KeyS') || keys.has('ArrowUp') || keys.has('ArrowDown') || (touch.active && Math.abs(touch.fwd) > 0.15));
    
    
    
    const turning = !player.dead && !player.struggle && !moving
      && (keys.has('KeyA') || keys.has('KeyD') || keys.has('ArrowLeft') || keys.has('ArrowRight')
        || (touch.active && Math.abs(touch.turn) > 0.2));
    let lean = 0;
    let bob = 0;

    if (player.dead) {
      deathT = Math.min(DEATH_TIME, deathT + dt);
      const f = Math.min(DEATH_FRAMES - 1, Math.floor((deathT / DEATH_TIME) * DEATH_FRAMES));
      if (xander.geometry !== deathGeo[f]) xander.geometry = deathGeo[f];
      
      xander.rotation.x = -Math.PI / 2 + (deathT / DEATH_TIME) * 1.15;
    } else if (player.struggle) {
      xander.rotation.x = -Math.PI / 2;
      const drive = player.struggle.progress ?? 0;
      const f = Math.floor(now * 9 + drive * 4) % STRUGGLE_FRAMES;
      if (xander.geometry !== struggleGeo[f]) xander.geometry = struggleGeo[f];
      
      
      lean = Math.sin(now * 13.5) * (0.06 + drive * 0.16);
      bob = -0.05 - drive * 0.03;
    } else if (fireT < FIRE_TIME) {
      xander.rotation.x = -Math.PI / 2;
      const f = Math.min(FIRE_FRAMES - 1, Math.floor((fireT / FIRE_TIME) * FIRE_FRAMES));
      if (xander.geometry !== fireGeo[f]) xander.geometry = fireGeo[f];
      lean = -Math.exp(-fireT * 14) * 0.10;      
    } else if (moving || turning) {
      xander.rotation.x = -Math.PI / 2;
      const running = sprintNow && moving;
      const set = running ? sprintGeo : walkGeo;
      const n = running ? SPRINT_FRAMES : WALK_FRAMES;
      const stride = running ? STRIDE * 1.55 : STRIDE;
      const ph = (walkDist / stride) % 1;
      const frame = Math.floor(ph * n) % n;
      if (xander.geometry !== set[frame]) xander.geometry = set[frame];
      
      
      bob = running ? Math.max(0, Math.sin(ph * Math.PI * 2)) * 0.055 : 0;
      lean = running ? 0.16 : 0.05;
    } else {
      xander.rotation.x = -Math.PI / 2;
      if (xander.geometry !== xGeo) xander.geometry = xGeo;
    }
    
    
    
    
    
    
    
    {
      let hand;
      if (player.dead) hand = deathPose(deathT / DEATH_TIME).hands[0];
      else if (player.struggle) hand = strugglePose(now, player.struggle.progress ?? 0).hands[0];
      else if (fireT < FIRE_TIME) hand = firePose(fireT).hands[0];
      else if (moving || turning) {
        hand = gaitPose((walkDist / ((sprintNow && moving) ? STRIDE * 1.55 : STRIDE)) % 1,
          (sprintNow && moving) ? 'sprint' : 'walk').hands[0];
      } else hand = poseById(XANDER_POSE).hands[0];

      gun.position.set(hand[0] * XANDER_H, 0.17, hand[1] * XANDER_H);
      
      
      
      const ready = (fireT < FIRE_TIME * 2.2) || !!target;
      gun.rotation.y = ready ? 0.02 : 0.78;
      gun.rotation.z = ready ? 0 : -0.25;
      
      
      
      
      
      
      gun.visible = !player.dead && (ready || !!target);
      flashMat.opacity = Math.max(0, 1 - fireT / 0.055) * 0.9;
      flash.rotation.y = now * 9;      
    }

    xander.position.set(player.x, bob, player.z);
    xander.rotation.z = player.yaw;
    
    
    
    
    xander.rotation.y = lean;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    let wantLook = 0;
    let seen = Infinity;
    for (const b of birds) {
      if (!b.alive) continue;
      const d = Math.hypot(b.x - player.x, b.z - player.z);
      if (d >= seen || d > 26) continue;
      
      const world = Math.atan2(player.x - b.x, b.z - player.z);
      let rel = world - player.yaw;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) > Math.PI / 2) continue;      
      seen = d;
      wantLook = clamp(rel * 0.55, -1.08, 1.08);      
    }
    
    
    
    headLook = headLook + (wantLook - headLook) * (1 - Math.exp(-6.5 * dt));
    neck.rotation.z = headLook;

    
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

    
    for (const l of leaks) l.step(dt);
    for (const w of wires) w.step(now);

    creakIn -= dt;
    if (creakIn <= 0) { creakIn = 9 + Math.random() * 16; creakSfx(); }

    sparkIn -= dt;
    if (sparkIn <= 0 && wires.length) {
      sparkIn = 4 + Math.random() * 9;
      const w = wires[Math.floor(Math.random() * wires.length)];
      sparkGeo.attributes.position.setXYZ(0, w.tip[0], w.tip[1], w.tip[2]);
      sparkGeo.attributes.position.needsUpdate = true;
      sparkFlash = 0.16;
      sparkSfx();
    }
    cutFlash = Math.max(0, cutFlash - dt);
    if (gradeEl) gradeEl.style.background = cutFlash > 0
      ? 'rgba(0,0,0,0.86)' : 'rgba(2, 5, 4, 0.34)';
    sparkFlash = Math.max(0, sparkFlash - dt);
    
    
    sparkPt.material.opacity = sparkFlash > 0 ? (Math.random() > 0.35 ? 0.95 : 0.2) : 0;

    
    for (const l of leaks) l.step(dt);
    for (const w of wires) w.step(now);

    creakIn -= dt;
    if (creakIn <= 0) { creakIn = 9 + Math.random() * 16; creakSfx(); }

    sparkIn -= dt;
    if (sparkIn <= 0 && wires.length) {
      sparkIn = 4 + Math.random() * 9;
      const w = wires[Math.floor(Math.random() * wires.length)];
      sparkGeo.attributes.position.setXYZ(0, w.tip[0], w.tip[1], w.tip[2]);
      sparkGeo.attributes.position.needsUpdate = true;
      sparkFlash = 0.16;
      sparkSfx();
    }
    sparkFlash = Math.max(0, sparkFlash - dt);
    
    
    sparkPt.material.opacity = sparkFlash > 0 ? (Math.random() > 0.35 ? 0.95 : 0.2) : 0;

    
    
    
    
    
    
    
    if (reticEl) {
      if (target) {
        tmpV.set(target.x, CHICKEN_H * 0.62, target.z).project(camera);
        const on = tmpV.z < 1;
        reticEl.style.opacity = on ? '0.92' : '0';
        if (on) {
          reticEl.style.left = `${(tmpV.x * 0.5 + 0.5) * 100}%`;
          reticEl.style.top = `${(-tmpV.y * 0.5 + 0.5) * 100}%`;
        }
      } else {
        reticEl.style.opacity = '0';
      }
    }

    
    paIn -= dt;
    if (paIn <= 0 && !player.dead) {
      paIn = 22 + Math.random() * 26;
      paVoice(PA_KINDS[Math.floor(Math.random() * PA_KINDS.length)]);
    }

    
    const hunted = birds.some((b) => b.alive && Math.hypot(b.x - player.x, b.z - player.z) < 13);
    audio.duck(hunted);

    
    if (!player.dead && Math.hypot(player.x - EXIT.x, player.z - EXIT.z) < 1.8) {
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
        player.z = deck.start.z; player.x = deck.start.x; player.yaw = 0;
        birds.forEach((b, i) => {
          b.alive = true; b.mesh.visible = true;
          b.creature = spawnCreature('chicken');
          b.latched = false; b.cool = 0;
          
          const p = pointBehind(deck, deck.start.x, deck.start.z, 14 + i * (10 + Math.min(6, level)));
          b.z = p.z;
          b.x = p.x + (i % 2 ? 1 : -1) * 0.5;
        });
        player.latchedBy = null; player.struggle = null;
        
        
        player.weapon = readyWeapon('boltDriver', { ammo: 48 });
        hud.lift(0);
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    for (const c of ceilingPieces) {
      c.visible = Math.hypot(c.position.x - place.eye.x, c.position.z - place.eye.z) > 2.2;
    }

    
    
    
    
    
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

    if (mapCv) drawMap(mapCv, player, birds, EXIT, level, deck);

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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  return { player, birds, touch, faces, head: xHead, neck };
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

function kickSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;
  
  
  const b = ctx.createBuffer(1, 2048, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 1.1;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus); n.start(t); n.stop(t + 0.16);

  
  
  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(1250, t + 0.07);
  o.frequency.exponentialRampToValueAtTime(300, t + 0.42);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
  o.connect(og); og.connect(hp); hp.connect(audio.sfxBus);
  o.start(t); o.stop(t + 0.5);
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
  const MANIFEST = './assets/music/music.json';
  let manifest = null;
  let loading = null;
  const buffers = new Map();
  let source = null;
  let side = -1;             
  let gain = null;

  async function load() {
    const ctx = audio.ensure();
    if (!ctx) return false;
    if (!manifest) {
      const r = await fetch(new URL(MANIFEST, import.meta.url));
      if (!r.ok) throw new Error(`music manifest ${r.status}`);
      manifest = await r.json();
    }
    
    
    
    await Promise.all(manifest.tracks.map(async (t) => {
      if (buffers.has(t.id)) return;
      const res = await fetch(new URL(`./assets/music/${t.file}`, import.meta.url));
      if (!res.ok) throw new Error(`${t.file} ${res.status}`);
      buffers.set(t.id, await ctx.decodeAudioData(await res.arrayBuffer()));
    }));
    return true;
  }

  function stop() {
    if (source) { try { source.stop(); } catch {  } source.disconnect(); }
    source = null;
  }

  function play(i) {
    const ctx = audio.ensure();
    const track = manifest?.tracks?.[i];
    const buf = track && buffers.get(track.id);
    if (!ctx || !buf) return false;
    stop();
    if (!gain) { gain = ctx.createGain(); gain.gain.value = 0.85; gain.connect(audio.musicBus); }
    source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.loopStart = 0;
    
    
    
    
    source.loopEnd = (manifest.loopSamples ?? buf.length) / (manifest.sampleRate ?? ctx.sampleRate);
    source.connect(gain);
    source.start();
    return true;
  }

  return {
    
    toggle() {
      const ctx = audio.ensure();
      if (!ctx) return false;
      if (ctx.resume) ctx.resume();
      if (side >= 0 && side < 1) { side = 1; play(side); return true; }
      if (side === 1) { side = -1; stop(); return false; }
      side = 0;
      if (!loading) {
        loading = load().catch((e) => {
          
          
          
          console.warn('cassette:', e.message);
          side = -1;
          return false;
        });
      }
      loading.then((ok) => { if (ok !== false && side === 0) play(0); });
      return true;
    },
    
    get audible() { return !!source && audio.running; },
    get sideName() { return side === 1 ? 'SIDE B' : (side === 0 ? 'SIDE A' : 'OFF'); },
    get title() { return manifest?.tracks?.[side]?.title ?? ''; },
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
    $('tapeCap').textContent = playing ? tape.sideName : 'OFF';
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
          $('tapeCap').textContent = tape.sideName;
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
