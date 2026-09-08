








import * as THREE from 'three';
import { solve, ARCH } from '../../../2d-fighter-ex/src/animeRig.mjs';
import { standPose } from '../../../../web-engine/horror/gait.js';
import { humanise, XANDER_RIG } from '../../../../web-engine/horror/xanderRig.js';








import { head3d, JAW, HEAD_RINGS, NOSE } from '../../../../web-engine/ps1/ps1Head.mjs';
import { makeRowMap } from '../../../../web-engine/ps1/faceChart.mjs';
import { FACE_SKIN, hash2 } from '../constants.js';


import { palette, toHex } from '../../../../web-engine/horror/tools/texturePaint.mjs';


import { MOVER } from '../../../../web-engine/horror/prelightDeck.mjs';
import { texturedMaterial } from '../world/textures.js';




























export const FACE_PX = 128;





































export const HEAD_NARROW = 0.84;


































export const XANDER_JAW = 'long';


export const FACE_JAW = JAW[XANDER_JAW] || JAW.oval;








export function faceRingHalfWidth(ring) {
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




















































export const FACE = (() => {
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const V = makeRowMap(rows);
  const Y = (z) => V(z) * S;
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

















export const EXPRESSIONS = Object.freeze({
  calm: { brow: 0, tilt: 0.10, open: 1, lid: 1, mouth: 0, tension: 0.25 },
  alert: { brow: -0.030, tilt: 0.34, open: 1.16, lid: 0.80, mouth: 0.10, tension: 0.60 },
  afraid: { brow: -0.062, tilt: -0.40, open: 1.34, lid: 0.55, mouth: 0.40, tension: 0.85 },
  hurt: { brow: 0.030, tilt: 0.55, open: 0.42, lid: 1.6, mouth: 0.34, tension: 1.0 },
});



















































export function xanderFaceSheet(exprName = 'calm') {
  const X = EXPRESSIONS[exprName] || EXPRESSIONS.calm;
  const cv = document.createElement('canvas');
  cv.width = FACE_PX * 2;
  cv.height = Math.round(FACE_PX / 0.75);
  const c = cv.getContext('2d');

  
  
  
  
  const {
    SKIN, SKIN_LIT, SKIN_HI, SKIN_SH, SKIN_DEEP, SKIN_DARK,
  } = FACE_SKIN;
  
  
  
  
  
  
  
  
  
  const HAIR = toHex(palette('hair').by.base);
  const HAIR_SH = toHex(palette('hair').by.shadow);
  const HAIR_HI = toHex(palette('hair').by.hi);
  
  
  
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const yNose = FACE.Y(NOSE.tip);
  
  const yNoseWing = FACE.Y(NOSE.wing);
  const yMouth = yNose + (CHIN - yNose) * 0.34;
  
  
  
  
  const browY = yBrow - ay(eW * 0.11) - CHIN * (X.brow || 0);

  const HAIR_TOP = -6;                

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  c.fillStyle = SKIN_LIT;
  c.fillRect(0, 0, cv.width, cv.height);

  
  
  
  
  
  const sx = cv.width * 0.52;
  const sw = cv.width - sx;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const napeY = cv.height * 0.34;
  c.fillStyle = HAIR;
  c.fillRect(sx, 0, sw, napeY);
  c.beginPath();
  c.moveTo(sx, napeY);
  c.quadraticCurveTo(sx + sw * 0.28, napeY + cv.height * 0.035, sx + sw * 0.54, napeY + cv.height * 0.008);
  c.quadraticCurveTo(sx + sw * 0.78, napeY + cv.height * 0.042, sx + sw, napeY + cv.height * 0.012);
  c.lineTo(sx + sw, napeY);
  c.closePath();
  c.fill();
  
  
  c.strokeStyle = HAIR_SH;
  c.lineWidth = Math.max(2, cv.height * 0.008);
  for (const f of [0.34, 0.68]) {
    c.beginPath();
    c.moveTo(sx + sw * f, 0);
    c.quadraticCurveTo(sx + sw * (f + 0.05), napeY * 0.55, sx + sw * (f + 0.02), napeY * 0.92);
    c.stroke();
  }

  
  
  
  
  const eaX = sx + sw * 0.22;
  const eaY = cv.height * 0.40;
  const eaW = sw * 0.14;
  const eaH = cv.height * 0.16;
  c.fillStyle = SKIN_LIT;
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

  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  c.fillStyle = SKIN_HI;
  c.globalAlpha = 0.45;
  c.beginPath();
  c.moveTo(cxp - eW * 0.20, FACE.Y(NOSE.root));
  c.lineTo(cxp + eW * 0.20, FACE.Y(NOSE.root));
  c.lineTo(cxp + eW * 0.30, FACE.Y(NOSE.tip));
  c.lineTo(cxp - eW * 0.30, FACE.Y(NOSE.tip));
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

  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const beardTop = yNose + ay(eW * 0.50);
  const beardBot = CHIN - 1;
  c.fillStyle = SKIN_DEEP;
  for (let y = Math.round(beardTop); y < beardBot; y += 1) {
    const h = FACE.halfAt(y) * 0.95;
    const t = (y - beardTop) / Math.max(1, beardBot - beardTop);
    
    const w = h * Math.min(1, 0.34 + 1.5 * t);
    c.globalAlpha = 0.055;
    c.fillRect(Math.round(cxp - w), y, Math.round(w * 2), 1);
    for (let k = 0; k < 4; k += 1) {
      if (hash2(y * 3.1 + k, 5.7) > 0.42) continue;
      c.fillRect(Math.round(cxp - w - k), y, 1, 1);
      c.fillRect(Math.round(cxp + w + k), y, 1, 1);
    }
  }
  c.globalAlpha = 1;

  
  
  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.05;
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
  c.globalAlpha = 0.24;
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
    c.globalAlpha = 0.16;
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const nx = 128 * NOSE.halfU;                 
  const nyMid = yNoseWing + (yNose - yNoseWing) * 0.55;
  
  
  
  c.fillStyle = SKIN_DEEP;
  c.globalAlpha = 0.55;
  c.beginPath();
  c.moveTo(cxp - nx, yNoseWing);
  c.lineTo(cxp + nx, yNoseWing);
  c.lineTo(cxp + nx * 0.30, yNose);
  c.lineTo(cxp - nx * 0.30, yNose);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
  
  
  
  c.fillStyle = SKIN_DARK;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.ellipse(cxp + d * nx * 0.52, nyMid, nx * 0.30, (yNose - yNoseWing) * 0.26,
      d * 0.45, 0, Math.PI * 2);
    c.fill();
  }
  
  
  
  c.fillStyle = SKIN_LIT;
  c.globalAlpha = 0.75;
  c.beginPath();
  c.moveTo(cxp - nx * 0.15, yNoseWing);
  c.lineTo(cxp + nx * 0.15, yNoseWing);
  c.lineTo(cxp + nx * 0.10, yNose);
  c.lineTo(cxp - nx * 0.10, yNose);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
  
  
  
  
  c.fillStyle = SKIN_SH;
  c.globalAlpha = 0.20;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.ellipse(cxp + d * noseHalf * 0.80, yNoseWing - ay(eW * 0.02),
      noseHalf * 0.20, ay(noseHalf * 0.14), 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  
  
  
  
  c.fillStyle = SKIN_SH;
  c.globalAlpha = 0.16;
  c.beginPath();
  c.ellipse(cxp, yNose + (yMouth - yNose) * 0.16, nx * 1.05,
    (yMouth - yNose) * 0.13, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  
  
  
  
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
  c.lineWidth = Math.max(1.3, ay(eW * 0.055));
  c.beginPath();
  c.moveTo(cxp - mouthHalf, yMouth - ay(eW * 0.03));
  c.quadraticCurveTo(cxp, yMouth + ay(eW * 0.04 + X.mouth * 0.12), cxp + mouthHalf, yMouth - ay(eW * 0.03));
  c.stroke();
  
  c.fillStyle = LIP;
  c.globalAlpha = 0.28;
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
  c.globalAlpha = 0.16;
  c.beginPath();
  c.ellipse(cxp, yMouth + ay(eW * 0.30), mouthHalf * 0.50, ay(eW * 0.06), 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  
  
  
  
  c.strokeStyle = SKIN_DEEP;
  c.globalAlpha = 0.05 + 0.24 * X.tension;
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



















export function makePortrait(headGeo, shouldersGeo, faces, bodyMat) {
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
  
  
  const shoulders = shouldersGeo ? new THREE.Mesh(shouldersGeo, bodyMat) : null;
  if (shoulders) bust.add(shoulders);

  
  
  
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const PORTRAIT_LIGHT = MOVER.ceiling;
  
  
  const _litMats = [faceMat, bodyMat].filter((m) => m && m.uniforms && m.uniforms.uLocal);
  const _kept = _litMats.map(() => new THREE.Vector3());
  const withPortraitLight = (draw) => {
    _litMats.forEach((m, i) => {
      _kept[i].copy(m.uniforms.uLocal.value);
      m.uniforms.uLocal.value.setScalar(PORTRAIT_LIGHT);
      m.uniformsNeedUpdate = true;
    });
    try { draw(); } finally {
      _litMats.forEach((m, i) => { m.uniforms.uLocal.value.copy(_kept[i]); m.uniformsNeedUpdate = true; });
    }
  };

  
  
  
  
  
  
  
  
  
  
  
  
  const _pv = new THREE.Vector3();
  





  const boxOf = (obj, names) => {
    if (!obj) return null;
    obj.updateWorldMatrix(true, false);
    const geo = obj.geometry;
    const P = geo.getAttribute('position');
    const ranges = ((geo.userData && geo.userData.parts) || []).filter((r) => names.includes(r.name));
    const list = ranges.length ? ranges : [{ start: 0, count: P.count }];
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity; let n = 0;
    for (const r of list) {
      for (let i = r.start; i < r.start + r.count; i += 1) {
        _pv.fromBufferAttribute(P, i).applyMatrix4(obj.matrixWorld).project(cam);
        if (!(_pv.z < 1 && _pv.z > -1)) continue;
        const sx = (_pv.x + 1) / 2; const sy = (1 - _pv.y) / 2;
        if (sx < x0) x0 = sx; if (sx > x1) x1 = sx;
        if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
        n += 1;
      }
    }
    return n ? { x0, y0, x1, y1 } : null;
  };

  let current = null;
  return {
    set(expr) {
      if (expr === current || !faces[expr]) return;
      current = expr;
      faceMat.uniforms.uMap.value = faces[expr];
    },
    get expr() { return current; },
    





    readback() {
      const sway = bust.rotation.y;
      bust.rotation.y = 0;
      withPortraitLight(() => r2.render(sc, cam));
      const gl = r2.getContext();
      const w = el.width; const h = el.height;
      const up = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, up);
      const data = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y += 1) data.set(up.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      const boxes = { head: boxOf(head, ['head']), torso: boxOf(shoulders, ['torso']) };
      bust.rotation.y = sway;
      return { width: w, height: h, data, boxes };
    },
    draw(t) {
      
      
      bust.rotation.y = Math.sin(t * 0.7) * 0.11;
      withPortraitLight(() => r2.render(sc, cam));
    },
  };
}










export function xanderHeadGeometry() {
  const A = ARCH.renji;
  const pose = standPose(0);
  const K = humanise(solve(pose, { flip: false }));
  const hc = [K.head[0], 0, K.head[1]];
  return {
    mesh: narrowAcross(head3d({
      centre: hc, r: XANDER_RIG.headR, jaw: XANDER_JAW, brow: A.brow, forward: [1, 0, 0],
      
      
      
      
      
      
      
      
      
      
      nose: 'human',
    })),
    centre: hc,
  };
}
























export function narrowAcross(mesh, k = HEAD_NARROW) {
  if (!mesh || !mesh.positions) return mesh;
  for (let i = 1; i < mesh.positions.length; i += 3) mesh.positions[i] *= k;
  return mesh;
}
