






















import * as THREE from 'three';

import { solve, ARCH } from '../../2d-fighter-ex/src/animeRig.mjs';
import {
  gaitPose, firePose, strugglePose, deathPose, standPose, gripOf, cycleTravel, settleStep, SETTLE_TIME, aimPose, aimedGait,
  woundedGait, wallLeanPose, dangerGait, forearmLeanPose, limpWarp,
  feedPose,
  startPhaseAdvance, START_DIST,
  kickPose, KICK_TIME, flinchAdd, FLINCH_TIME, turnStep, TURN_RATE_MIN, reachPose, REACH_TIME,
} from '../../../web-engine/horror/gait.js';









import {
  humanise, XANDER_RIG, XANDER_SEG, XANDER_SPANS, XANDER_DEPTHS, XANDER_FOOT,
  XANDER_LIMB_PROFILE, xanderJoints,
} from '../../../web-engine/horror/xanderRig.js';
import { buildBoltDriver, muzzlePoint } from '../../../web-engine/ps1/props/boltDriver.mjs';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter, jointBall } from '../../../web-engine/ps1/ps1Mesh.mjs';








import {
  head3d, hair3d, JAW, HEAD_RINGS, NOSE,
} from '../../../web-engine/ps1/ps1Head.mjs';
import { makeRowMap } from '../../../web-engine/ps1/faceChart.mjs';
import { buildChicken } from '../../../web-engine/ps1/creatures/chicken.mjs';
import { buildPorker, PORKER_HEIGHT_M } from '../../../web-engine/ps1/creatures/porker.mjs';
import { buildCow, COW_HEIGHT_M } from '../../../web-engine/ps1/creatures/cow.mjs';
import { buildHorse, HORSE_HEIGHT_M } from '../../../web-engine/ps1/creatures/horse.mjs';
import {
  ARENA, HORSE as BOSS_HORSE, createBossFight, stepBossFight, cutCable, bossLevel, pillars,
} from '../../../web-engine/horror/boss.js';
import {
  emptyChickenAnim, stepChicken, chickenPose, staggerHit, stepHorseGait,
  horsePose, deathTwitch, RANGE as CHICK_RANGE, PORKER, COW,
} from '../../../web-engine/horror/creatureAnim.js';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';




import { lockZoom } from '../../shared/input/zoomLock.js';

import { railNodesForRuns, nodeAt, railPlacement, safeRoomCamera } from '../../../web-engine/horror/railCamera.js';
import { chapterFor } from '../../../web-engine/horror/lore.js';
import { MAP, mapProject } from '../../../web-engine/horror/minimap.js';
import { panOf, levelAt, makeImpulse } from '../../../web-engine/horror/audioSpace.js';
import {
  LIFT, createLift, stepLift, mapRise, insideCar, keepOut, carIsSafe, clearOfCar,
  carLocal, carWorld,
} from '../../../web-engine/horror/lift.js';
import {
  createHide, stepHide, hideProtects, hideDrawsPlayer, hideSettled,
} from '../../../web-engine/horror/hideout.js';
import {
  buildLevel, moveInLevel, progressAt, pointBehind, runRect, clearOfProps, insideLevel,
  chaseWaypoint,
} from '../../../web-engine/horror/level.js';
import { spawnVitals, tickVitals, damage, beginGrapple, endGrapple, MAX_HEALTH, CHICKEN_LATCH_SLOW } from '../../../web-engine/horror/health.js';
import {
  spawn as spawnCreature, resolveHit, applyDamage, mobilityOf, statusOf, legAimHeight,
} from '../../../web-engine/horror/dismemberment.js';
import {
  readyWeapon, tickWeapon, canFire, fire, WEAPONS,
} from '../../../web-engine/horror/weapons.js';
import { createStruggle, VERB_FOR, promptFor } from '../../../web-engine/horror/struggle.js';



import {
  createBarks, say, stepBarks, combatSay, currentBark,
} from '../../../web-engine/horror/barks.js';
import { compileMumble, seedOf } from '../../../web-engine/horror/mumble.js';
import { AIM_LATCH, createAimLatch, stepAimLatch, acquires, releases, raiseMix } from '../../../web-engine/horror/aimLatch.js';
import { INTRO_SHOTS, createIntro, stepIntro, introFade, introCam } from '../../../web-engine/horror/intro.js';
import {
  isBossDeck, rosterFor, actCardFor, actFor, isFinalDeck, FINAL_DECK,
} from '../../../web-engine/horror/acts.js';
import { gatesFor, OPENING_FIRE } from '../../../web-engine/horror/gates.js';


import {
  SAVE_KEY, makeSave, normaliseSave, newerOf, describeSave,
} from '../../../web-engine/horror/saveGame.js';
import { createFatigue, tickFatigue } from '../../../web-engine/horror/chaseFatigue.js';
import { createEntrance, stepEntrance, isProtectedPhase, emergeAt, emergeY } from '../../../web-engine/horror/entrance.js';
import { createDirector, stepDirector } from '../../../web-engine/horror/director.js';
import { createBench, stockBench, benchOffers, benchSwap, nextOffer, recoveredAt } from '../../../web-engine/horror/workbench.js';
import { INJURY, isInjured, isDanger, nextStumbleAt, wallSupport } from '../../../web-engine/horror/injury.js';
import { getUpAt, restTravel, restPose } from '../../../web-engine/horror/groundPoses.js';
import {
  ACCESS_KEYS, resolveAccess, shakeScale, flashScale, flashGap, struggleMode, textScale,
} from '../../../web-engine/horror/access.js';
import { initAnalytics, trackEvent } from 'arbelo/analytics';

const XANDER_H = 1.80;

















const CHICKEN_H = 0.72;
const HALL_W = 3.2;
















const HALL_H = 2.95;   


























const WALL_H = HALL_H;













const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
























const FACE_SKIN = Object.freeze({
  SKIN: '#cf9d74',
  SKIN_LIT: '#e3b78d',
  SKIN_HI: '#eec9a2',
  SKIN_SH: '#a4744f',
  SKIN_DEEP: '#7c5439',
  SKIN_DARK: '#573925',
});


const hexNum = (h) => parseInt(h.slice(1), 16);

const XCOL = {
  top: 0x9c4436,      
  pant: 0x3a4f7d,     
  accent: 0xb5893f,   
  
  
  
  skin: hexNum(FACE_SKIN.SKIN_LIT),
  hair: 0xcfae5e,     
                      
                      
  
  
  
  eye: 0x2f6fd0,      
};







const WCOL = {
  torso: 0xb8b3ab, udder: 0xc19a92, head: 0x8f8a83,
  hornL: 0xcfc6ad, hornR: 0xcfc6ad, earL: 0x8f8a83, earR: 0x8f8a83,
  tentacleL: 0xc19a92, tentacleR: 0xb98f88,
  legL: 0x6e6a64, legR: 0x6e6a64, tail: 0x6e6a64,
  eyeL: 0x120f10, eyeR: 0x120f10,
};


const HCOL = {
  barrel: 0x2b2724, tail: 0x1d1a18,
  neckC: 0x3a3531, neckL: 0x322d2a, neckR: 0x322d2a,
  legFL: 0x241f1d, legFR: 0x241f1d, legHL: 0x241f1d, legHR: 0x241f1d,
};
const PCOL = {
  torso: 0xb08a86, head: 0xbe9691, earL: 0xa87f7c, earR: 0xa87f7c,
  snout: 0xc9a09a, armL: 0xb5908b, armR: 0xa17c78,
  legL: 0x9c7874, legR: 0x9c7874, eyeL: 0x1a1416, eyeR: 0x1a1416,
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

  
  
  
  
  const {
    SKIN, SKIN_LIT, SKIN_HI, SKIN_SH, SKIN_DEEP, SKIN_DARK,
  } = FACE_SKIN;
  
  
  
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const yNose = FACE.Y(NOSE.tip);
  
  const yNoseWing = FACE.Y(NOSE.wing);
  const yMouth = yNose + (CHIN - yNose) * 0.34;
  
  
  
  
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
























function narrowAcross(mesh, k = HEAD_NARROW) {
  if (!mesh || !mesh.positions) return mesh;
  for (let i = 1; i < mesh.positions.length; i += 3) mesh.positions[i] *= k;
  return mesh;
}


































const DEATH_FALL = 0.75;
const DEATH_LIE = 3.2;
const WALK_FRAMES = 14;



const AIM_FRAMES = 10;
const RAISE_FRAMES = 7;
const TALK_FRAMES = 7;
const TALK_TIME = 1.5;
const FIDGET_TIME = 2.2;


const TALK_TO = Object.freeze({
  hands: [[0.24, 0.60], [0.07, 0.51]],
  twist: 0.14, lean: 0.02, grip: 'open',
});
const SPRINT_FRAMES = 12;












const IDLE_FRAMES = 6;
const IDLE_TIME = 3.5;
const FIRE_FRAMES = 6;
const STRUGGLE_FRAMES = 8;
const DEATH_FRAMES = 6;






const KICK_FRAMES = 8;


const REACH_FRAMES = 8;




const SHUFFLE_FRAMES = 10;

const FIRE_TIME = 0.42;
const DEATH_TIME = 0.9;













const STRIDE = cycleTravel('walk') * XANDER_H;
const SPRINT_STRIDE = cycleTravel('sprint') * XANDER_H;

















function walkPose(phase, mode = 'walk') {
  const idle = standPose(0);
  const g = gaitPose(phase, mode);
  
  
  return { ...idle, ...g };
}

function xanderParts(pose) {
  
  
  
  
  
  
  
  
  



const A = { ...ARCH.renji, hair: 'sleek', jaw: ARCH.renji.jaw, brow: ARCH.renji.brow };
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  pose = pose || standPose(0);
  const K = humanise(solve(pose, { flip: false }));
  const o = {
    flip: false, seg: XANDER_SEG, spans: XANDER_SPANS, depths: XANDER_DEPTHS,
  };
  const built = buildFighter(K, {
    segments: segmentsOf(K, o), torso: torsoBoxOf(K, o),
    
    
    
    
    
    
    
    
    profiles: XANDER_LIMB_PROFILE,
    joints: xanderJoints(jointsOf(K, o)), girdle: girdleOf(K, o),
    headR: XANDER_RIG.headR, arch: { build: 1, jaw: A.jaw, brow: A.brow, hair: 'sleek' },
    flip: false, pose, head: false,
    
    
    footScale: XANDER_FOOT,
    
    
    
    hands: gripOf(pose),
  });
  
  
  
  
  
  
  
  
  const hc = [K.head[0], 0, K.head[1]];
  const r = XANDER_RIG.headR;
  return [...built.parts,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    {
      name: 'hair',
      mesh: narrowAcross(hair3d('sleek', {
        centre: hc, r: r * 1.07, forward: [1, 0, 0], jaw: XANDER_JAW, brow: A.brow,
      })),
    },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);
}






























const overallsAt = (x, y, z) => {
  if (z < 0.575) return XCOL.pant;                       
  
  
  
  
  
  
  
  const bib = x > -0.01 && Math.abs(y) < 0.068;
  
  
  if (bib && z > 0.60 && z < 0.665 && Math.abs(y) < 0.040) return clothNoise(0x32456e, x, y, z);
  if (z < 0.735) return clothNoise(bib ? XCOL.pant : XCOL.top, x, y, z);
  
  
  
  if (z < 0.762) return bib && Math.abs(y) > 0.042 ? XCOL.accent : (bib ? XCOL.pant : XCOL.top);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (z < 0.865) {
    const ay = Math.abs(y);
    return x > -0.01
      ? (ay > 0.042 && ay < 0.088 ? XCOL.pant : XCOL.top)
      : (ay > 0.035 && ay < 0.125 ? XCOL.pant : XCOL.top);
  }
  return XCOL.top;                                       
};
















const trapAt = (x, y, z) => (z < 0.865 ? XCOL.pant : XCOL.top);
































const clothNoise = (base, x, y, z) => {
  const n = hash2(x * 40 + z * 13, y * 40 + z * 7);
  const k = 0.95 + n * 0.10;
  const r = Math.min(255, Math.round(((base >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((base >> 8) & 255) * k));
  const b = Math.min(255, Math.round((base & 255) * k));
  return (r << 16) | (g << 8) | b;
};




const SLEEVE_END = 0.62;
const sleeveAt = (x, y, z) => {
  
  
  
  
  
  
  
  if (z > 0.86) return clothNoise(0xc4614f, x, y, z);   
  return clothNoise(XCOL.top, x, y, z);                  
};


const legAt = (x, y, z) => {
  if (z > 0.30 && z < 0.40) return clothNoise(0x32456e, x, y, z);   
  if (z < 0.11) return clothNoise(0x2c3a5c, x, y, z);               
  return clothNoise(XCOL.pant, x, y, z);
};

const xColour = (n) => (n === 'hair' ? XCOL.hair
  : /^eye/.test(n) ? XCOL.eye
  : /^pelvis|^hip\d/.test(n) ? ((x, y, z) => clothNoise(XCOL.pant, x, y, z))
    : /^thigh|^shin|^knee|^ankle/.test(n) ? legAt
      
      
      
      
      
      
      : /^shoulder/.test(n) ? ((x, y, z) => clothNoise(XCOL.top, x, y, z))
        : /^upperArm/.test(n) ? sleeveAt
          : /^trapezius/.test(n) ? trapAt
            : /^torso/.test(n) ? overallsAt
              : /^foot/.test(n) ? ((x, y, z) => clothNoise(XCOL.accent, x, y, z)) : XCOL.skin);







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











const FLASH_MATS = [];

function texturedMaterial(map) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
      uKey: { value: new THREE.Vector3(...KEY_DIR) },
      uFill: { value: new THREE.Vector3(...FILL_DIR) },
      uAlpha: { value: 1 },
      uMap: { value: map },
      uDim: { value: 0.58 },
      uFlashPos: { value: new THREE.Vector3(0, 1.2, 0) },
      uFlash: { value: 0 },
    },
    vertexShader: ps1Vertex({ flash: true }),
    fragmentShader: FRAGMENT.textured(),
    fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
  });
  FLASH_MATS.push(m);
  return m;
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













let SPARK_SPRITE = null;
function sparkSprite() {
  if (SPARK_SPRITE) return SPARK_SPRITE;
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(214,232,255,0.75)');
  grad.addColorStop(1, 'rgba(140,180,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 16);
  SPARK_SPRITE = new THREE.CanvasTexture(c);
  return SPARK_SPRITE;
}

function makeWire(x, z, len, seed) {
  const N = 7;
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  
  
  
  
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x3a332b }));
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

function sparkSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;

  
  
  
  
  
  
  
  
  
  if (sfxSheet.play('spark', {
    dest: out, gain: 0.85, rate: 0.90 + Math.random() * 0.24,
  })) return;
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
    n.connect(hp); hp.connect(g); g.connect(out);
    n.start(at); n.stop(at + 0.06);
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'square'; o.frequency.value = 3200 + Math.random() * 2600;
    og.gain.setValueAtTime(0.05, at);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    o.connect(og); og.connect(out); o.start(at); o.stop(at + 0.05);
  }
}












function creakSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  
  
  
  
  {
    const out = audio.at(x, z);
    if (out && sfxSheet.play('creak', {
      dest: out, gain: 0.7, rate: 0.85 + Math.random() * 0.3,
    })) return;
  }
  const out = audio.at(x, z);
  if (!out) return;
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

  o.connect(bp); bp.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.3);
}












function settleSfx(x, z) {
  const out = audio.at(x, z);
  if (!out) return false;
  return !!sfxSheet.play('settle', {
    dest: out, gain: 0.34, rate: 0.9 + Math.random() * 0.2,
  });
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









const PZ = { legs: { lo: 0.0, hi: 0.44 }, torso: { lo: 0.40, hi: 0.80 }, arms: { lo: 0.52, hi: 0.80 }, head: { lo: 0.80, hi: 1.0 } };
const PORKER_RIG = {
  bodyPivot: [0.04, 0, (PZ.torso.lo + PZ.torso.hi) / 2],
  headPivot: [0.15, 0, PZ.head.lo],
  headParts: ['head', 'earL', 'earR', 'eyeL', 'eyeR', 'snout'],
  legParts: ['legL', 'legR'],
  pivots: {
    legL: [0.010, -0.082, PZ.legs.hi],
    legR: [0.010, 0.082, PZ.legs.hi],
    armL: [0.115, -0.245 * 0.86, PZ.arms.lo + (PZ.arms.hi - PZ.arms.lo) * 0.98],
    armR: [0.115, 0.260 * 0.86, PZ.arms.lo + (PZ.arms.hi - PZ.arms.lo) * 0.98],
    torso: [0.04, 0, (PZ.torso.lo + PZ.torso.hi) / 2],
    head: [0.15, 0, PZ.head.lo],
    earL: [0.15, 0, PZ.head.lo], earR: [0.15, 0, PZ.head.lo],
    eyeL: [0.15, 0, PZ.head.lo], eyeR: [0.15, 0, PZ.head.lo],
    snout: [0.15, 0, PZ.head.lo],
  },
};



const CWZ = { legs: { lo: 0.0, hi: 0.42 }, torso: { lo: 0.38, hi: 0.86 }, udder: { lo: 0.30, hi: 0.58 }, head: { lo: 0.80, hi: 1.0 } };
const COW_RIG = {
  bodyPivot: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
  headPivot: [-0.09, 0, CWZ.head.lo - 0.06],
  headParts: ['head', 'hornL', 'hornR', 'earL', 'earR', 'eyeL', 'eyeR'],
  legParts: ['legL', 'legR'],
  pivots: {
    legL: [-0.010, -0.098, CWZ.legs.hi],
    legR: [-0.010, 0.098, CWZ.legs.hi],
    tentacleL: [0.130, -0.150, CWZ.udder.hi - 0.02],
    tentacleR: [0.130, 0.150, CWZ.udder.hi - 0.02],
    torso: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
    udder: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
    tail: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
    head: [-0.09, 0, CWZ.head.lo - 0.06],
    hornL: [-0.09, 0, CWZ.head.lo - 0.06], hornR: [-0.09, 0, CWZ.head.lo - 0.06],
    earL: [-0.09, 0, CWZ.head.lo - 0.06], earR: [-0.09, 0, CWZ.head.lo - 0.06],
    eyeL: [-0.09, 0, CWZ.head.lo - 0.06], eyeR: [-0.09, 0, CWZ.head.lo - 0.06],
  },
};





const HRZ = { legs: { lo: 0.0, hi: 0.50 }, barrel: { lo: 0.44, hi: 0.76 }, necks: { lo: 0.70, hi: 1.0 } };
const HORSE_RIG = {
  bodyPivot: [0, 0, (HRZ.barrel.lo + HRZ.barrel.hi) / 2],
  headPivot: [0.66, 0, HRZ.necks.lo - 0.02],
  headParts: ['neckC', 'eyeCa', 'eyeCb'],
  legParts: ['legFL', 'legFR', 'legHL', 'legHR'],
  pivots: {
    legFL: [0.50, -0.108, HRZ.legs.hi], legFR: [0.50, 0.108, HRZ.legs.hi],
    legHL: [-0.44, -0.126, HRZ.legs.hi], legHR: [-0.44, 0.126, HRZ.legs.hi],
    barrel: [0, 0, (HRZ.barrel.lo + HRZ.barrel.hi) / 2],
    tail: [0, 0, (HRZ.barrel.lo + HRZ.barrel.hi) / 2],
    neckC: [0.66, 0, HRZ.necks.lo - 0.02],
    neckL: [0.66, -0.055, HRZ.necks.lo - 0.02],
    neckR: [0.66, 0.055, HRZ.necks.lo - 0.02],
    eyeCa: [0.66, 0, HRZ.necks.lo - 0.02], eyeCb: [0.66, 0, HRZ.necks.lo - 0.02],
    eyeLa: [0.66, -0.055, HRZ.necks.lo - 0.02], eyeLb: [0.66, -0.055, HRZ.necks.lo - 0.02],
    eyeRa: [0.66, 0.055, HRZ.necks.lo - 0.02], eyeRb: [0.66, 0.055, HRZ.necks.lo - 0.02],
  },
};
const CHICKEN_RIG_CFG = {
  bodyPivot: BODY_PIVOT,
  headPivot: HEAD_PIVOT,
  headParts: ['head', 'beak', 'comb', 'eyeL', 'eyeR'],
  legParts: ['legL', 'legR'],
  pivots: CHICK_PIVOT,
};

function chickenRig(parts, colourOf, targetHeight, material, cfg = CHICKEN_RIG_CFG) {
  
  
  
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

  const BP = cfg.bodyPivot;
  const HP = cfg.headPivot;
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  body.position.set(BP[0] * sc, BP[1] * sc, (BP[2] - lo) * sc);
  head.position.set((HP[0] - BP[0]) * sc, 0, (HP[2] - BP[2]) * sc);
  body.add(head);
  root.add(body);

  const named = {};
  const HEADPARTS = new Set(cfg.headParts);
  const LEGPARTS = new Set(cfg.legParts);
  for (const p of parts) {
    const pivot = cfg.pivots[p.name] || [0, 0, lo];
    const m = new THREE.Mesh(geoFor(p, pivot), material);
    named[p.name] = m;
    if (LEGPARTS.has(p.name)) {
      m.position.set(pivot[0] * sc, pivot[1] * sc, (pivot[2] - lo) * sc);
      root.add(m);
    } else if (HEADPARTS.has(p.name)) {
      head.add(m);                    
    } else {
      m.position.set(
        (pivot[0] - BP[0]) * sc,
        (pivot[1] - BP[1]) * sc,
        (pivot[2] - BP[2]) * sc,
      );
      body.add(m);
    }
  }
  return { root, body, head, named, scale: sc, cfg, lo, height: targetHeight };
}







function applyChickenPose(rig, pose) {
  const BP = rig.cfg.bodyPivot;
  const HP = rig.cfg.headPivot;
  const P = rig.cfg.pivots;
  const legLo = rig.cfg === CHICKEN_RIG_CFG ? CZ.legs.lo : 0;
  const HGT = rig.height;
  rig.body.rotation.y = pose.torsoPitch;
  rig.body.rotation.x = pose.bodyRoll;
  rig.body.position.z = (BP[2] - legLo) * rig.scale + pose.bodyLift * HGT;
  
  
  
  rig.body.position.x = BP[0] * rig.scale + (pose.shoveX || 0) * HGT;
  rig.body.position.y = BP[1] * rig.scale + (pose.shoveY || 0) * HGT;
  
  
  const br = 1 + (pose.breath || 0);
  rig.body.scale.set(1, br, br);
  rig.head.rotation.y = pose.headPitch;
  
  rig.head.rotation.z = pose.headYaw || 0;
  rig.head.position.x = ((HP[0] - BP[0]) * rig.scale) + pose.headThrust * HGT;
  rig.head.position.z = ((HP[2] - BP[2]) * rig.scale) + pose.headBob * HGT;
  if (rig.named.legL) {
    rig.named.legL.rotation.y = pose.legL.swing;
    rig.named.legL.position.z = (P.legL[2] - legLo) * rig.scale + pose.legL.lift * HGT;
  }
  if (rig.named.legR) {
    rig.named.legR.rotation.y = pose.legR.swing;
    rig.named.legR.position.z = (P.legR[2] - legLo) * rig.scale + pose.legR.lift * HGT;
  }
  
  
  
  
  
  
  
  const armAxis = rig.cfg === CHICKEN_RIG_CFG ? 'x' : 'y';
  const armL = rig.named.wingL || rig.named.armL || rig.named.tentacleL;
  const armR = rig.named.wingR || rig.named.armR || rig.named.tentacleR;
  if (armL) armL.rotation[armAxis] = -(pose.wingFlap + pose.mutantLag * 0.16);
  if (armR) armR.rotation[armAxis] = (armAxis === 'x' ? 1 : -1)
    * (pose.wingFlap * 0.86 - pose.mutantLag * 0.22);

  
  
  
  
  
  
  if (pose.swing) {
    rig.body.rotation.z = pose.swing * 0.55;
    if (armL) armL.rotation.z = -pose.swing * 0.42;
    if (armR) armR.rotation.z = -pose.swing * 0.42;
  } else if (rig.body.rotation.z) {
    rig.body.rotation.z = 0;
    if (armL) armL.rotation.z = 0;
    if (armR) armR.rotation.z = 0;
  }
  if (rig.named.tail) rig.named.tail.rotation.y = -pose.tailFlick + pose.mutantLag * 0.1;
}







function applyHorsePose(rig, pose, basePitch = 0) {
  const BP = rig.cfg.bodyPivot;
  const P = rig.cfg.pivots;
  const HGT = rig.height;
  rig.body.rotation.y = basePitch + pose.bodyPitch;
  rig.body.rotation.x = pose.bodyRoll;
  rig.body.position.z = (BP[2] - rig.lo) * rig.scale + pose.bodyLift * HGT;
  for (const name of ['legFL', 'legFR', 'legHL', 'legHR']) {
    const m = rig.named[name];
    if (!m) continue;
    m.rotation.y = pose[name].swing;
    m.position.z = (P[name][2] - rig.lo) * rig.scale + pose[name].lift * HGT;
  }
  if (rig.named.tail) rig.named.tail.rotation.z = pose.tailSwish;
}







const SEVER_PART = {
  'leg-l': 'legL', 'leg-r': 'legR',
  'wing-l': 'wingL', 'wing-r': 'wingR',
  'arm-l': 'armL', 'arm-r': 'armR',
  'tentacle-l': 'tentacleL', 'tentacle-r': 'tentacleR',
  head: 'head',
};


















const CHICK_CALL = {
  
  idle:   { f0: 340, to: 260, dur: 0.16, gain: 0.16, q: 9 },
  alert:  { f0: 520, to: 980, dur: 0.34, gain: 0.42, q: 13 },
  windup: { f0: 300, to: 210, dur: 0.26, gain: 0.26, q: 8 },
  strike: { f0: 900, to: 1500, dur: 0.20, gain: 0.55, q: 16 },
  hurt:   { f0: 760, to: 300, dur: 0.38, gain: 0.50, q: 11 },
  die:    { f0: 430, to: 120, dur: 0.75, gain: 0.55, q: 7 },
};






























const SHEET_VOICE = {
  chicken: {
    idle: 'chickIdle', alert: 'chickAlert', windup: 'chickAlert', strike: 'chickAttack', hurt: 'chickAlert', die: 'chickAttack',
  },
  porker: {
    idle: 'porkerIdle', alert: 'porkerAlert', windup: 'porkerAlert', strike: 'porkerAttack', hurt: 'porkerAlert', die: 'porkerAttack',
  },
  cow: {
    idle: 'cowIdle', alert: 'cowIdle', windup: 'cowIdle', strike: 'cowAttack', hurt: 'cowIdle', die: 'cowAttack',
  },
  horse: {
    idle: 'horseCry', alert: 'horseCry', windup: 'horseCry', strike: 'horseCry', hurt: 'horseCry', die: 'horseCry',
  },
};

function sheetVoice(beast, kind) {
  const table = SHEET_VOICE[beast && beast.kind] || SHEET_VOICE.chicken;
  const effect = table[kind];
  if (!effect) return false;
  const out = audio.at(beast.x, beast.z);
  if (!out) return false;
  
  
  
  const seed = typeof beast.voice === 'number' ? beast.voice : 1;
  return sfxSheet.play(effect, {
    dest: out, gain: 0.95, rate: 0.92 + (seed - 0.78) * 0.30,
  });
}


























const CREATURE_FACE = Math.PI / 2;

function chickVoice(bird, kind, dist) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  if (sheetVoice(bird, kind)) return;
  const spec = CHICK_CALL[kind];
  if (!spec) return;
  
  
  
  
  
  
  
  
  const out = audio.at(bird.x, bird.z);
  if (!out) return;
  const near = 1;
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

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(spec.gain * near * near, t + dur * 0.14);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.05);
}





const PORK_CALL = {
  idle:   { f0: 130, to: 96, dur: 0.34, gain: 0.22, squeal: 0.0 },
  alert:  { f0: 180, to: 420, dur: 0.62, gain: 0.46, squeal: 1.0 },
  windup: { f0: 150, to: 108, dur: 0.50, gain: 0.34, squeal: 0.2 },
  strike: { f0: 300, to: 780, dur: 0.34, gain: 0.60, squeal: 1.2 },
  hurt:   { f0: 480, to: 190, dur: 0.55, gain: 0.58, squeal: 1.4 },
  die:    { f0: 260, to: 62, dur: 1.10, gain: 0.58, squeal: 0.6 },
};

function porkVoice(beast, kind, dist) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  if (sheetVoice(beast, kind)) return;
  const spec = PORK_CALL[kind];
  if (!spec) return;
  const out = audio.at(beast.x, beast.z);
  if (!out) return;
  const near = 1;
  const t = ctx.currentTime + 0.01;
  void dist;
  const v = beast.voice;
  const dur = spec.dur * (2 - v) * 0.9;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(spec.gain * near * near, t + dur * 0.10);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const air = ctx.createGain();
  air.connect(g); g.connect(out);

  
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(spec.f0 * v * 0.5, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, spec.to * v * 0.5), t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 4;
  o.connect(lp); lp.connect(air);
  o.start(t); o.stop(t + dur + 0.05);

  
  if (spec.squeal > 0) {
    const sq = ctx.createOscillator();
    sq.type = 'sawtooth';
    sq.frequency.setValueAtTime(spec.f0 * v * 3.1, t);
    sq.frequency.exponentialRampToValueAtTime(Math.max(80, spec.to * v * 3.6), t + dur * 0.8);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500 * v; bp.Q.value = 7;
    const sg = ctx.createGain();
    sg.gain.value = 0.34 * spec.squeal;
    sq.connect(bp); bp.connect(sg); sg.connect(air);
    sq.start(t); sq.stop(t + dur + 0.05);
  }
}




function hideSfx() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;
  const thump = ctx.createOscillator(); const tg = ctx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(180, t);
  thump.frequency.exponentialRampToValueAtTime(48, t + 0.13);
  tg.gain.setValueAtTime(0.4, t);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  thump.connect(tg); tg.connect(audio.sfxBus); thump.start(t); thump.stop(t + 0.25);

  const at = t + 0.16;
  const b = ctx.createBuffer(1, 512, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  n.start(at); n.stop(at + 0.06);
}






function pushOutOfPillars(list, p, pad) {
  for (const q of list) {
    const dx = p.x - q.x; const dz = p.z - q.z;
    const d = Math.hypot(dx, dz);
    const min = q.r + pad;
    if (d < min && d > 1e-6) {
      return { x: q.x + (dx / d) * min, z: q.z + (dz / d) * min };
    }
  }
  return p;
}






function doorSfx(opening) {
  
  
  
  
  
  if (sfxSheet.play(opening ? 'doorOpen' : 'doorClose', {
    gain: 0.8, rate: 0.94 + Math.random() * 0.12,
  })) return;
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;

  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.1);
  og.gain.setValueAtTime(0.26, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(og); og.connect(audio.sfxBus); o.start(t); o.stop(t + 0.18);

  
  
  const dur = 1.15;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) {
    const u = i / d.length;
    d[i] = (Math.random() * 2 - 1) * Math.sin(u * Math.PI) * 0.8;
  }
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(opening ? 380 : 900, t + 0.05);
  bp.frequency.linearRampToValueAtTime(opening ? 900 : 340, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t + 0.05);
  g.gain.linearRampToValueAtTime(0.14, t + 0.2);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  n.start(t + 0.05); n.stop(t + dur + 0.05);
}







let liftVoice = null;
function liftHum(on) {
  const ctx = audio.ensure();
  if (!ctx) return;
  if (!on) {
    if (liftVoice) {
      liftVoice.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5);
      const dying = liftVoice;
      setTimeout(() => { try { dying.stop(); } catch {  } }, 2000);
      liftVoice = null;
    }
    return;
  }
  if (liftVoice) return;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  g.connect(audio.musicBus);
  const stops = [];

  
  
  
  
  
  const drone = sfxSheet.play('liftLoop', {
    loop: true, dest: g, gain: 0.9, rate: 0.94 + Math.random() * 0.1,
  });
  if (drone) {
    stops.push(() => drone.stop(0.1));
  } else {
    
    
    
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 46;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 190; lp.Q.value = 3;
    const wob = ctx.createOscillator(); const wg = ctx.createGain();
    wob.frequency.value = 2.7; wg.gain.value = 5;
    wob.connect(wg); wg.connect(o.frequency);
    o.connect(lp); lp.connect(g);
    o.start(); wob.start();
    stops.push(() => { try { o.stop(); wob.stop(); } catch {  } });
  }

  
  
  
  
  for (const [hz, lvl] of [[196, 0.05], [294, 0.035], [392, 0.022]]) {
    const v = ctx.createOscillator(); const vg = ctx.createGain();
    v.type = 'sine'; v.frequency.value = hz; vg.gain.value = lvl;
    v.connect(vg); vg.connect(g); v.start();
    stops.push(() => { try { v.stop(); } catch {  } });
  }
  g.gain.setTargetAtTime(0.55, ctx.currentTime, 0.6);
  liftVoice = { gain: g, stop() { for (const s of stops) s(); } };
}































const TONE_BED = 0.08;
const TONE_SAFE = 0.016;
function startRecordedTone() {
  const h = sfxSheet.play('roomTone', {
    loop: true, gain: TONE_BED, rate: 0.97 + Math.random() * 0.06,
  });
  if (!h) return false;
  tone = {
    recorded: true,
    setLevel(quiet) {
      if (!audio.ctx) return;
      h.gain.gain.setTargetAtTime(quiet ? TONE_SAFE : TONE_BED, audio.ctx.currentTime, 0.8);
    },
    stop() { h.stop(1.0); },
  };
  return true;
}
function roomTone() {
  const ctx = audio.ensure();
  if (!ctx || tone) return;
  if (startRecordedTone()) return;

  
  
  
  
  

  
  
  const n = Math.floor(ctx.sampleRate * 8);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  
  
  
  let last = 0;
  for (let i = 0; i < n; i += 1) {
    last = (last + (Math.random() * 2 - 1) * 0.09) * 0.985;
    d[i] = last;
  }
  
  
  const fade = Math.floor(ctx.sampleRate * 0.25);
  for (let i = 0; i < fade; i += 1) {
    const k = i / fade;
    d[i] = d[i] * k + d[n - fade + i] * (1 - k);
  }

  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.7;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.055;                 
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 140;
  lfo.connect(lfoGain); lfoGain.connect(lp.frequency);

  const g = ctx.createGain(); g.gain.value = 0.0001;
  src.connect(lp); lp.connect(g); g.connect(audio.sfxBus);
  src.start(); lfo.start();
  g.gain.setTargetAtTime(0.5, ctx.currentTime, 2.5);   

  
  const hum = ctx.createOscillator(); const hg = ctx.createGain();
  hum.type = 'sine'; hum.frequency.value = 38;
  hg.gain.value = 0.0001;
  hum.connect(hg); hg.connect(audio.sfxBus); hum.start();
  hg.gain.setTargetAtTime(0.10, ctx.currentTime, 3.5);

  tone = {
    recorded: false,
    setLevel(quiet) {
      if (!audio.ctx) return;
      g.gain.setTargetAtTime(quiet ? 0.10 : 0.5, audio.ctx.currentTime, 0.8);
      hg.gain.setTargetAtTime(quiet ? 0.02 : 0.10, audio.ctx.currentTime, 0.8);
    },
    stop() {
      if (!audio.ctx) return;
      g.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.6);
      hg.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.6);
      setTimeout(() => {
        try { src.stop(); lfo.stop(); hum.stop(); } catch {  }
      }, 2500);
    },
  };

  
  
  
  
  
  
  
  
  
  
  
  
  let upTries = 60;
  const up = setInterval(() => {
    upTries -= 1;
    if (!tone || tone.recorded || upTries <= 0) { clearInterval(up); return; }
    if (!sfxSheet.ready) return;
    const synth = tone;
    tone = null;
    if (!startRecordedTone()) { tone = synth; return; }
    synth.stop();
    clearInterval(up);
  }, 1000);
}








function roomToneLevel(quiet) {
  if (tone) tone.setLevel(quiet);
}












function breathSfx(hard) {
  
  
  
  
  
  
  
  if (sfxSheet.play('breath', {
    gain: hard ? 0.38 : 0.2, rate: (hard ? 1.02 : 0.9) + Math.random() * 0.08,
  })) return;
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.01;
  const dur = hard ? 0.34 : 0.5;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) {
    
    const u = i / d.length;
    d[i] = (Math.random() * 2 - 1) * Math.sin(u * Math.PI) ** 1.4;
  }
  const n = ctx.createBufferSource(); n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = hard ? 620 : 420;
  bp.Q.value = 1.1;
  const g = ctx.createGain();
  g.gain.value = hard ? 0.16 : 0.075;
  n.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
  n.start(t); n.stop(t + dur + 0.05);
}













let shadowTex = null;
let shadowGeo = null;
function shadowAssets() {
  if (!shadowTex) {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    const g2 = cv.getContext('2d');
    
    
    
    const grad = g2.createRadialGradient(16, 16, 1, 16, 16, 16);
    grad.addColorStop(0.00, 'rgba(0,0,0,1)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.72)');
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 32, 32);
    shadowTex = new THREE.CanvasTexture(cv);
    shadowGeo = new THREE.PlaneGeometry(2, 2);
    
    shadowGeo.rotateX(-Math.PI / 2);
  }
  return { tex: shadowTex, geo: shadowGeo };
}


function makeBlob(r, opacity = 0.4) {
  const { tex, geo } = shadowAssets();
  const m = new THREE.MeshBasicMaterial({
    
    
    
    color: 0x0d1410, map: tex, transparent: true, opacity, depthWrite: false,
  });
  const q = new THREE.Mesh(geo, m);
  q.scale.set(r, 1, r);
  
  
  q.position.y = 0.02;
  q.renderOrder = 2;
  q.frustumCulled = false;
  return q;
}















const DECALS = 40;
let decalTex = null;


function decalTexture() {
  if (decalTex) return decalTex;
  const n = 64;
  const cv = document.createElement('canvas');
  cv.width = n; cv.height = n;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, n, n);
  
  
  
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + hash2(i, 1.3) * 1.2;
    const r = n * (0.16 + hash2(i, 2.7) * 0.14);
    const d = n * hash2(i, 3.9) * 0.16;
    const x = n / 2 + Math.cos(a) * d;
    const y = n / 2 + Math.sin(a) * d;
    const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    grad.addColorStop(0, 'rgba(90,14,10,0.95)');
    grad.addColorStop(0.7, 'rgba(70,10,8,0.55)');
    grad.addColorStop(1, 'rgba(60,8,6,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  decalTex = new THREE.CanvasTexture(cv);
  return decalTex;
}

function makeDecals() {
  const tex = decalTexture();
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const pool = [];
  const group = new THREE.Group();
  for (let i = 0; i < DECALS; i += 1) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false,
    }));
    m.position.y = -50;
    m.renderOrder = 3;
    m.frustumCulled = false;
    group.add(m);
    pool.push(m);
  }
  let next = 0;
  return {
    group,
    
    put(x, z, size, dark) {
      const m = pool[next];
      next = (next + 1) % DECALS;
      m.position.set(x, 0.015 + (next % 4) * 0.002, z);
      
      
      
      m.rotation.y = Math.random() * Math.PI * 2;
      const w = size * (0.8 + Math.random() * 0.5);
      m.scale.set(w, 1, w * (0.75 + Math.random() * 0.5));
      m.material.opacity = 0.55 + dark * 0.4;
    },
  };
}
























const IMPACT_PARTS = 96;
const TRACERS = 6;




const BOLT_LIFE = 0.09;
const RICOCHET_PARTS = 72;






















function makeTracers() {
  const pos = new Float32Array(TRACERS * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xffe9c0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  const shots = [];
  
  let holdFrames = 0;
  for (let i = 0; i < TRACERS; i += 1) shots.push({ life: 0 });
  let next = 0;
  for (let i = 0; i < TRACERS * 6; i += 3) pos[i + 1] = -50;

  return {
    lines,
    freeze(frames) { holdFrames = frames; },
    fire(from, to) {
      const i = next; next = (next + 1) % TRACERS;
      shots[i] = { life: BOLT_LIFE, from: [...from], to: [...to] };
    },
    step(dt) {
      let lit = 0;
      for (let i = 0; i < TRACERS; i += 1) {
        const sh = shots[i];
        if (!sh || sh.life <= 0) { pos[i * 6 + 1] = -50; pos[i * 6 + 4] = -50; continue; }
        
        if (holdFrames <= 0) sh.life -= dt;
        lit += 1;
        
        
        const u = Math.max(0, Math.min(1, 1 - sh.life / BOLT_LIFE));
        const head = u;
        const tail = Math.max(0, u - 0.34);
        for (let k = 0; k < 3; k += 1) {
          pos[i * 6 + k] = sh.from[k] + (sh.to[k] - sh.from[k]) * tail;
          pos[i * 6 + 3 + k] = sh.from[k] + (sh.to[k] - sh.from[k]) * head;
        }
      }
      if (holdFrames > 0) holdFrames -= 1;
      geo.attributes.position.needsUpdate = true;
      mat.opacity = lit ? 0.85 : 0;
      return lit;
    },
  };
}


















function makeRicochets() {
  const pos = new Float32Array(RICOCHET_PARTS * 3);
  const vel = new Float32Array(RICOCHET_PARTS * 3);
  const life = new Float32Array(RICOCHET_PARTS);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.055, sizeAttenuation: true,
    transparent: true, opacity: 0.95, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  pts.frustumCulled = false;
  let next = 0;
  for (let i = 0; i < RICOCHET_PARTS; i += 1) pos[i * 3 + 1] = -50;

  return {
    points: pts,
    
    burst(x, y, z, dir, n) {
      
      const dot = dir.x * n.x + dir.z * n.z;
      const rx = dir.x - 2 * dot * n.x;
      const rz = dir.z - 2 * dot * n.z;
      for (let k = 0; k < 12; k += 1) {
        const i = next; next = (next + 1) % RICOCHET_PARTS;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        const spread = 1.5;
        vel[i * 3] = rx * (3.2 + Math.random() * 3.4) + (Math.random() - 0.5) * spread;
        vel[i * 3 + 1] = 0.6 + Math.random() * 2.6;
        vel[i * 3 + 2] = rz * (3.2 + Math.random() * 3.4) + (Math.random() - 0.5) * spread;
        life[i] = 0.22 + Math.random() * 0.34;
      }
      geo.attributes.position.needsUpdate = true;
    },
    step(dt) {
      let any = false;
      for (let i = 0; i < RICOCHET_PARTS; i += 1) {
        if (life[i] <= 0) continue;
        any = true;
        life[i] -= dt;
        vel[i * 3 + 1] -= 15 * dt;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        
        if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3 + 1] *= -0.25; }
        if (life[i] <= 0) pos[i * 3 + 1] = -50;
      }
      if (any) geo.attributes.position.needsUpdate = true;
      return any;
    },
  };
}

function makeImpacts() {
  const pos = new Float32Array(IMPACT_PARTS * 3);
  const vel = new Float32Array(IMPACT_PARTS * 3);
  const life = new Float32Array(IMPACT_PARTS);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    
    
    color: 0x8e2b24, size: 0.09, sizeAttenuation: true,
    transparent: true, opacity: 0.9, depthWrite: false,
  }));
  pts.frustumCulled = false;
  let next = 0;
  
  
  for (let i = 0; i < IMPACT_PARTS; i += 1) pos[i * 3 + 1] = -50;

  return {
    points: pts,
    
    burst(x, y, z, dir) {
      for (let k = 0; k < 14; k += 1) {
        const i = next; next = (next + 1) % IMPACT_PARTS;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        
        
        const back = k < 3 ? -0.45 : 1;
        vel[i * 3] = dir.x * 2.6 * back + (Math.random() - 0.5) * 2.2;
        vel[i * 3 + 1] = 1.1 + Math.random() * 2.0;
        vel[i * 3 + 2] = dir.z * 2.6 * back + (Math.random() - 0.5) * 2.2;
        life[i] = 0.55 + Math.random() * 0.35;
      }
      geo.attributes.position.needsUpdate = true;
    },
    step(dt) {
      let any = false;
      for (let i = 0; i < IMPACT_PARTS; i += 1) {
        if (life[i] <= 0) continue;
        any = true;
        life[i] -= dt;
        vel[i * 3 + 1] -= 11 * dt;                  
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (pos[i * 3 + 1] < 0.02) {
          
          
          pos[i * 3 + 1] = 0.02;
          vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0;
        }
        if (life[i] <= 0) pos[i * 3 + 1] = -50;
      }
      if (any) geo.attributes.position.needsUpdate = true;
    },
  };
}




function meatSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;
  
  
  if (sfxSheet.play('meat', {
    dest: out, gain: 0.85, rate: 0.92 + Math.random() * 0.18,
  })) return;
  const t = ctx.currentTime + 0.005;

  const b = ctx.createBuffer(1, 2600, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) {
    const u = i / d.length;
    d[i] = (Math.random() * 2 - 1) * (1 - u) ** 3;
  }
  const n = ctx.createBufferSource(); n.buffer = b;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.42, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  n.connect(lp); lp.connect(g); g.connect(out);
  n.start(t); n.stop(t + 0.16);

  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(64, t + 0.09);
  og.gain.setValueAtTime(0.26, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.17);
}























function footSfx(x, z, running) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;
  
  
  
  
  
  
  
  
  
  
  
  if (sfxSheet.play('stepDeck', {
    dest: out,
    gain: (running ? 1.0 : 0.62) * (0.9 + Math.random() * 0.2),
    rate: (running ? 0.94 : 1.0) * (0.94 + Math.random() * 0.12),
  })) return;
  const t = ctx.currentTime + 0.005;
  const v = 0.9 + Math.random() * 0.25;
  const hard = running ? 1.5 : 1;

  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150 * v, t);
  o.frequency.exponentialRampToValueAtTime(52 * v, t + 0.075);
  og.gain.setValueAtTime(0.22 * hard, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.16);

  const r = ctx.createOscillator(); const rg = ctx.createGain();
  r.type = 'triangle';
  r.frequency.value = (running ? 320 : 260) * v;
  rg.gain.setValueAtTime(0.09 * hard, t + 0.004);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  r.connect(rg); rg.connect(out); r.start(t); r.stop(t + 0.11);

  const b = ctx.createBuffer(1, 1600, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const n = ctx.createBufferSource(); n.buffer = b;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1900;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.085 / hard, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.08);
}













const gunSfx = { shots: 0, dry: 0, fromSheet: 0 };






































const voxSheet = (() => {
  let manifest = null;
  let buffer = null;
  let loading = null;
  let failed = null;
  let played = 0;
  let lastId = null;

  async function load() {
    const ctx = audio.ensure();
    if (!ctx) return false;
    if (buffer) return true;
    if (failed) return false;
    if (!loading) {
      loading = (async () => {
        const r = await fetch(new URL('../assets/sfx/vox.json', import.meta.url));
        if (!r.ok) throw new Error(`vox manifest ${r.status}`);
        manifest = await r.json();
        const a = await fetch(new URL('../assets/sfx/vox.webm', import.meta.url));
        if (!a.ok) throw new Error(`vox.webm ${a.status}`);
        buffer = await ctx.decodeAudioData(await a.arrayBuffer());
        return true;
      })().catch((e) => { failed = String(e && e.message ? e.message : e); loading = null; return false; });
    }
    return loading;
  }

  
  function speak(id, gain = 0.85) {
    const ctx = audio.ensure();
    if (!ctx || !audio.running || !buffer || !manifest) return 0;
    const clip = manifest.clips[id];
    if (!clip) return 0;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(audio.sfxBus);
    src.start(ctx.currentTime + 0.01, clip.offset, clip.duration);
    played += 1;
    lastId = id;
    return clip.duration;
  }

  return {
    load,
    speak,
    get ready() { return !!buffer; },
    get failure() { return failed; },
    get played() { return played; },
    get lastId() { return lastId; },
  };
})();

const sfxSheet = (() => {
  const MANIFEST = '../assets/sfx/sfx.json';
  let manifest = null;
  let buffer = null;
  let loading = null;
  let failed = null;
  
  
  
  const last = new Map();
  let played = 0;
  
  
  
  const byEffect = Object.create(null);

  async function load() {
    const ctx = audio.ensure();
    if (!ctx) return false;
    if (buffer) return true;
    if (failed) return false;
    if (!loading) {
      loading = (async () => {
        const r = await fetch(new URL(MANIFEST, import.meta.url));
        if (!r.ok) throw new Error(`sfx manifest ${r.status}`);
        manifest = await r.json();
        const a = await fetch(new URL('../assets/sfx/sfx.webm', import.meta.url));
        if (!a.ok) throw new Error(`sfx.webm ${a.status}`);
        buffer = await ctx.decodeAudioData(await a.arrayBuffer());
        return true;
      })().catch((e) => { failed = String(e && e.message ? e.message : e); loading = null; return false; });
    }
    return loading;
  }

  

















  function play(effect, {
    gain = 1, rate = 1, dest = null, when = 0, loop = false,
  } = {}) {
    const ctx = audio.ensure();
    if (!ctx || !audio.running || !buffer || !manifest) return false;
    const names = manifest.effects[effect];
    if (!names || !names.length) return false;
    let name;
    if (names.length === 1) {
      [name] = names;
    } else {
      const prev = last.get(effect);
      const pool = names.filter((n) => n !== prev);
      name = pool[Math.floor(Math.random() * pool.length)];
    }
    last.set(effect, name);
    const clip = manifest.clips[name];
    if (!clip) return false;
    if (loop && !clip.wrap) return false;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(dest || audio.sfxBus);
    const t = ctx.currentTime + Math.max(0, when) + 0.002;
    if (loop) {
      src.loop = true;
      src.loopStart = clip.offset;
      src.loopEnd = clip.offset + clip.duration - clip.wrap;
      
      
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(gain, t, 0.4);
      src.start(t, clip.offset);
      played += 1;
      byEffect[effect] = (byEffect[effect] || 0) + 1;
      return {
        gain: g,
        stop(fadeSec = 0.6) {
          g.gain.setTargetAtTime(0.0001, ctx.currentTime, Math.max(0.02, fadeSec / 3));
          
          
          
          setTimeout(() => { try { src.stop(); } catch {  } }, fadeSec * 1000 + 400);
        },
      };
    }
    
    
    src.start(t, clip.offset, clip.duration / rate);
    played += 1;
    byEffect[effect] = (byEffect[effect] || 0) + 1;
    return true;
  }

  return {
    load,
    play,
    get ready() { return !!buffer; },
    get failure() { return failed; },
    get played() { return played; },
    get byEffect() { return { ...byEffect }; },
    
    
    get effectNames() { return manifest ? Object.keys(manifest.effects) : null; },
  };
})();






























function shotSfx() {
  
  
  
  if (sfxSheet.play('shot', { gain: 1.0, rate: 0.97 + Math.random() * 0.06 })) { gunSfx.shots += 1; gunSfx.fromSheet += 1; return; }
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.005;

  
  
  const cd = 0.05;
  const cb = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * cd)), ctx.sampleRate);
  const cdat = cb.getChannelData(0);
  for (let i = 0; i < cdat.length; i += 1) {
    const u = i / cdat.length;
    cdat[i] = (Math.random() * 2 - 1) * (1 - u) ** 2.2;
  }
  const cn = ctx.createBufferSource(); cn.buffer = cb;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 1300; hp.Q.value = 0.7;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.42, t);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + cd);
  cn.connect(hp); hp.connect(cg); cg.connect(audio.sfxBus);
  cn.start(t); cn.stop(t + cd + 0.01);

  
  
  const o = ctx.createOscillator(); const og = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(210, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.07);
  og.gain.setValueAtTime(0.3, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 900;
  o.connect(lp); lp.connect(og); og.connect(audio.sfxBus);
  o.start(t); o.stop(t + 0.13);

  
  
  const hd = 0.34;
  const hb = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * hd)), ctx.sampleRate);
  const hdat = hb.getChannelData(0);
  for (let i = 0; i < hdat.length; i += 1) hdat[i] = Math.random() * 2 - 1;
  const hn = ctx.createBufferSource(); hn.buffer = hb;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(4200, t + 0.02);
  bp.frequency.exponentialRampToValueAtTime(1500, t + hd);
  const hg = ctx.createGain();
  hg.gain.setValueAtTime(0.0001, t + 0.015);
  hg.gain.linearRampToValueAtTime(0.13, t + 0.045);
  hg.gain.exponentialRampToValueAtTime(0.0001, t + hd);
  hn.connect(bp); bp.connect(hg); hg.connect(audio.sfxBus);
  hn.start(t + 0.015); hn.stop(t + hd + 0.02);

  
  
  const r = ctx.createOscillator(); const rg = ctx.createGain();
  r.type = 'triangle';
  r.frequency.setValueAtTime(1720 + Math.random() * 90, t + 0.02);
  rg.gain.setValueAtTime(0.055, t + 0.02);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  r.connect(rg); rg.connect(audio.sfxBus);
  r.start(t + 0.02); r.stop(t + 0.32);
  gunSfx.shots += 1;
}







function dryClickSfx() {
  
  if (sfxSheet.play('dryClick', { gain: 0.8, rate: 0.96 + Math.random() * 0.09 })) { gunSfx.dry += 1; gunSfx.fromSheet += 1; return; }
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.005;
  for (const [at, gain] of [[0, 0.16], [0.055, 0.1]]) {
    const d = 0.02;
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * d)), ctx.sampleRate);
    const dat = b.getChannelData(0);
    for (let i = 0; i < dat.length; i += 1) {
      dat[i] = (Math.random() * 2 - 1) * (1 - i / dat.length) ** 3;
    }
    const n = ctx.createBufferSource(); n.buffer = b;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
    n.connect(hp); hp.connect(g); g.connect(audio.sfxBus);
    n.start(t + at); n.stop(t + at + d + 0.01);
  }
  gunSfx.dry += 1;
}




















function ricochetSfx(x, z) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const out = audio.at(x, z);
  if (!out) return;

  
  
  if (sfxSheet.play('ricochet', {
    dest: out, gain: 0.55, rate: 0.95 + Math.random() * 0.5,
  })) return;

  const t = ctx.currentTime + 0.004;
  
  const d = 0.03;
  const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * d)), ctx.sampleRate);
  const dat = b.getChannelData(0);
  for (let i = 0; i < dat.length; i += 1) dat[i] = (Math.random() * 2 - 1) * (1 - i / dat.length) ** 2;
  const n = ctx.createBufferSource(); n.buffer = b;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.30, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(hp); hp.connect(g); g.connect(out);
  n.start(t); n.stop(t + d + 0.01);

  
  
  
  const base = 1900 + Math.random() * 1500;
  for (const [mult, gain, dur] of [[1, 0.085, 0.16], [2.41, 0.05, 0.12]]) {
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(base * mult, t);
    
    o.frequency.exponentialRampToValueAtTime(base * mult * 0.88, t + dur);
    og.gain.setValueAtTime(gain, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og); og.connect(out);
    o.start(t); o.stop(t + dur + 0.02);
  }
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







































function drawMap(cv, player, birds, exit, level, deck, bearing, rise = 0) {
  const g = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  g.clearRect(0, 0, W, H);
  const cx = W / 2; const cy = H * 0.52;
  
  const p = (x, y, z) => mapProject(x, y - rise, z, player, cx, cy, bearing);

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

  
  
  
  
  
  
  
  
  
  
  if (deck.bays) {
    const pCar = (x, y, z) => mapProject(x, y, z, player, cx, cy, bearing);
    for (const b of deck.bays) {
      const near2 = Math.hypot((b.x0 + b.x1) / 2 - player.x, (b.z0 + b.z1) / 2 - player.z);
      if (near2 > MAP.range + 8) continue;
      const cs = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]];
      for (let i = 0; i < 4; i += 1) {
        const a2 = cs[i]; const b2 = cs[(i + 1) % 4];
        
        seg(p(a2[0], 0, a2[1]), p(b2[0], 0, b2[1]), NEON, 1.8);
        seg(p(a2[0], H3 * 0.8, a2[1]), p(b2[0], H3 * 0.8, b2[1]), MID, 1);
      }
      
      const hwc = 1.1;
      const cc = [[b.car.x - hwc, b.car.z - hwc], [b.car.x + hwc, b.car.z - hwc],
        [b.car.x + hwc, b.car.z + hwc], [b.car.x - hwc, b.car.z + hwc]];
      for (let i = 0; i < 4; i += 1) {
        const a3 = cc[i]; const b3 = cc[(i + 1) % 4];
        seg(pCar(a3[0], 0, a3[1]), pCar(b3[0], 0, b3[1]), NEON, 1.2);
        seg(pCar(a3[0], H3 * 0.55, a3[1]), pCar(b3[0], H3 * 0.55, b3[1]), NEON, 1);
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
      
      
      
      
      
      
      
      
      
      
      
      uDim: { value: 0.58 },
      uFlashPos: { value: new THREE.Vector3(0, 1.2, 0) },
      uFlash: { value: 0 },
    },
    vertexShader: ps1Vertex({ flash: true }),
    fragmentShader: FRAGMENT.colour(),
    fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
  });
  FLASH_MATS.push(mat);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let isBoss = false;
  let fight = null;
  let boulder = null;
  let cable = null;
  let arenaPillars = [];
  let impacts = null;
  let ricochets = null;
  let tracers = null;
  let decals = null;
  let liftCar = null;
  let liftDoors = null;
  let liftGroup = null;
  
  
  let sealedDoors = null;
  let liftLamp = null;
  function paintGeo(geo, hex) {
    const n = geo.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
    geo.computeVertexNormals();
  }
  let ride = createLift();

  














  function placeCar(bay) {
    liftCar = { x: bay.car.x, z: bay.car.z, face: bay.car.face, kind: bay.kind };
    if (liftGroup) {
      
      
      
      liftGroup.position.set(
        bay.car.x + bay.car.face.x * (LIFT.depth / 2 + 0.1),
        0,
        bay.car.z + bay.car.face.z * (LIFT.depth / 2 + 0.1),
      );
      liftGroup.rotation.y = Math.atan2(-bay.car.face.x, -bay.car.face.z);
    }
  }
  let deck = buildLevel(1);
  let deckGroup = null;
  let strips = [];
  let ceilingPieces = [];
  let leaks = [];
  let wires = [];
  let props = [];
  
  
  
  
  
  
  
  
  const CREATURE_PAD = 0.22;
  let solidProps = [];
  
  
  
  
  const sparkStats = { fired: 0, near: 0 };
  const SPARK_N = 14;
  
  
  function sparkAt(tip) {
    if (!sparkGeo) return;
    const a = sparkGeo.attributes.position;
    for (let i = 0; i < SPARK_N; i += 1) {
      a.setXYZ(
        i,
        tip[0] + (Math.random() - 0.5) * 0.42,
        tip[1] - Math.random() * 0.50 + 0.06,
        tip[2] + (Math.random() - 0.5) * 0.42,
      );
    }
    a.needsUpdate = true;
  }
  let sparkGeo = null;
  let sparkPt = null;
  let lockers = [];
  
  
  
  let hide = createHide();
  let hideLocker = null;
  let hideWant = false;
  let hideFrom = null;
  let pickups = [];
  let lift = null;
  let EXIT = deck.exit;
  let rails = railNodesForRuns(deck.runs);
  let safeRoom = deck.rooms.find((m) => m.kind === 'safe') || null;
  
  
  let library = null;
  
  
  
  let actCardT = 0;
  
  
  
  let gateMeshes = [];
  
  let entrances = [];
  let debrisPool = [];
  let director = null;
  let openingPending = [];
  let openingCooldown = 0;
  let bench = createBench();
  let workbench = null;
  let nearBench = false;

  
  
  
  
  
  
  const bodyParts = xanderParts();
  const headBuilt = xanderHeadGeometry();
  const allParts = [...bodyParts, { name: 'head', mesh: headBuilt.mesh }];

  
  
  
  
  
  
  const bake = (pose) => partsToGeometry(xanderParts(pose), xColour, XANDER_H, allParts);
  const walkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) walkGeo.push(bake(walkPose(i / WALK_FRAMES, 'walk')));
  
  
  
  
  
  
  
  const sprintGeo = [];
  for (let i = 0; i < SPRINT_FRAMES; i += 1) sprintGeo.push(bake(walkPose(i / SPRINT_FRAMES, 'sprint')));
  
  
  
  
  
  
  
  
  
  
  
  const aimGeo = [];
  for (let i = 0; i < AIM_FRAMES; i += 1) {
    aimGeo.push(bake({ ...standPose(0), ...aimPose((i / AIM_FRAMES) * (1 / 0.9)) }));
  }
  
  
  
  
  const raiseGeo = [];
  for (let i = 0; i < RAISE_FRAMES; i += 1) {
    raiseGeo.push(bake(raiseMix(standPose(0), aimPose(0), i / (RAISE_FRAMES - 1))));
  }
  
  
  
  
  
  
  
  
  const FEED_FRAMES = 9;
  const feedGeo = [];
  const feedDrop = [];
  for (let i = 0; i < FEED_FRAMES; i += 1) {
    const fp = feedPose(i / (FEED_FRAMES - 1));
    feedGeo.push(bake(fp));
    feedDrop.push(fp.drop || 0);
  }
  const talkGeo = [];
  {
    for (let i = 0; i < TALK_FRAMES; i += 1) {
      talkGeo.push(bake(raiseMix(standPose(0), { ...standPose(0), ...TALK_TO }, i / (TALK_FRAMES - 1))));
    }
  }
  const walkAimGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    walkAimGeo.push(bake(aimedGait(
      walkPose(i / WALK_FRAMES, 'walk'),
      aimPose((i / WALK_FRAMES) * (1 / 0.9)),
    )));
  }
  const fireGeo = [];
  for (let i = 0; i < FIRE_FRAMES; i += 1) {
    fireGeo.push(bake({ ...standPose(0), ...firePose((i / (FIRE_FRAMES - 1)) * FIRE_TIME) }));
  }
  const struggleGeo = [];
  for (let i = 0; i < STRUGGLE_FRAMES; i += 1) {
    
    struggleGeo.push(bake({ ...standPose(0), ...strugglePose((i / STRUGGLE_FRAMES) * (Math.PI * 2 / 13.5), 0.8) }));
  }
  const deathGeo = [];
  for (let i = 0; i < DEATH_FRAMES; i += 1) {
    deathGeo.push(bake({ ...standPose(0), ...deathPose(i / (DEATH_FRAMES - 1)) }));
  }
  
  
  
  
  const kickGeo = [];
  for (let i = 0; i < KICK_FRAMES; i += 1) {
    kickGeo.push(bake({ ...standPose(0), ...kickPose((i / (KICK_FRAMES - 1)) * KICK_TIME) }));
  }
  
  const reachGeo = [];
  for (let i = 0; i < REACH_FRAMES; i += 1) {
    reachGeo.push(bake({ ...standPose(0), ...reachPose((i / (REACH_FRAMES - 1)) * REACH_TIME) }));
  }
  
  
  
  
  
  const shuffleGeo = [];
  for (let i = 0; i < SHUFFLE_FRAMES; i += 1) {
    shuffleGeo.push(bake(walkPose(i / SHUFFLE_FRAMES, 'shuffle')));
  }
  
  
  
  
  
  
  const woundedWalkGeo = [];
  const woundedWallWalkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    woundedWalkGeo.push(bake(woundedGait(walkPose(i / WALK_FRAMES, 'walk'), false)));
    woundedWallWalkGeo.push(bake(woundedGait(walkPose(i / WALK_FRAMES, 'walk'), true)));
  }
  
  
  
  const dangerWalkGeo = [];
  const dangerWallWalkGeo = [];
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    const wp = limpWarp(i / WALK_FRAMES, INJURY.limpBias);
    dangerWalkGeo.push(bake(dangerGait(walkPose(wp, 'walk'), false)));
    dangerWallWalkGeo.push(bake(dangerGait(walkPose(wp, 'walk'), true)));
  }
  const FOREARM_FRAMES = 10;
  const forearmLeanGeo = [];
  for (let i = 0; i < FOREARM_FRAMES; i += 1) {
    forearmLeanGeo.push(bake(forearmLeanPose((i / FOREARM_FRAMES) * (1 / 0.83))));
  }
  const dangerIdleGeo = [];
  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    dangerIdleGeo.push(bake(dangerGait(standPose((i / (IDLE_FRAMES - 1)) * (Math.PI / 0.9)))));
  }
  
  
  
  
  
  
  
  const FIDGET_FRAMES = 9;
  const fidgetGeo = [[], []];
  for (let i = 0; i < FIDGET_FRAMES; i += 1) {
    
    const k = Math.sin(Math.PI * (i / (FIDGET_FRAMES - 1)));
    const base = standPose(0);
    fidgetGeo[0].push(bake({
      ...base,
      
      feet: [[base.feet[0][0] - 0.03 * k, 0], [base.feet[1][0] + 0.05 * k, 0]],
      hands: [base.hands[0], [base.hands[1][0] + 0.045 * k, base.hands[1][1] + 0.02 * k]],
      twist: (base.twist ?? 0) + 0.06 * k,
      lean: (base.lean ?? 0) + 0.012 * k,
    }));
    fidgetGeo[1].push(bake({
      ...base,
      
      twist: (base.twist ?? 0) + 0.13 * k,
      hands: [[base.hands[0][0] + 0.02 * k, base.hands[0][1] + 0.035 * k], base.hands[1]],
      lean: (base.lean ?? 0) - 0.02 * k,
    }));
  }
  const WALLLEAN_FRAMES = 10;
  const wallLeanGeo = [];
  for (let i = 0; i < WALLLEAN_FRAMES; i += 1) {
    wallLeanGeo.push(bake(wallLeanPose((i / WALLLEAN_FRAMES) * (1 / 0.9))));
  }
  
  
  
  
  
  const REST_FRAMES = 10;
  const restGeo = [];
  const restPitch = [];
  const restLift = [];
  for (let i = 0; i < REST_FRAMES; i += 1) {
    const rt = restTravel(i / (REST_FRAMES - 1), true);
    restGeo.push(bake(rt.pose));
    restPitch.push(rt.pitch);
    restLift.push(rt.lift);
  }
  const seatGeo = [bake(restPose(false).pose), bake(restPose(true).pose)];
  const seatPitch = [restPose(false).pitch, restPose(true).pitch];
  const seatLift = [restPose(false).lift, restPose(true).lift];
  const GETUP_FRAMES = 14;
  const getUpGeo = [];
  const getUpPitch = [];
  const getUpLift = [];
  for (let i = 0; i < GETUP_FRAMES; i += 1) {
    const gu = getUpAt(i / (GETUP_FRAMES - 1));
    getUpGeo.push(bake(gu.pose));
    getUpPitch.push(gu.pitch);
    getUpLift.push(gu.lift);
  }
  const idleGeo = [];
  const woundedIdleGeo = [];
  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    idleGeo.push(bake(standPose((i / (IDLE_FRAMES - 1)) * (Math.PI / 0.9))));
    woundedIdleGeo.push(bake(woundedGait(standPose((i / (IDLE_FRAMES - 1)) * (Math.PI / 0.9)))));
  }
  const xGeo = idleGeo[0];

  
  
  
  
  
  
  
  
  
  
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const flashTex = (() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,245,1)');
    grad.addColorStop(0.22, 'rgba(255,226,150,0.95)');
    grad.addColorStop(0.55, 'rgba(255,150,54,0.45)');
    grad.addColorStop(1, 'rgba(255,110,30,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
    
    g.globalCompositeOperation = 'lighter';
    for (const [ang, len, wide] of [[0, 30, 7], [1.62, 20, 5], [3.05, 26, 6], [4.9, 15, 4]]) {
      g.save(); g.translate(32, 32); g.rotate(ang);
      const p = g.createLinearGradient(0, 0, len, 0);
      p.addColorStop(0, 'rgba(255,240,200,0.9)');
      p.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = p;
      g.beginPath(); g.moveTo(0, -wide); g.lineTo(len, 0); g.lineTo(0, wide); g.closePath(); g.fill();
      g.restore();
    }
    return new THREE.CanvasTexture(c);
  })();
  const flashMat = new THREE.MeshBasicMaterial({
    map: flashTex, color: 0xffffff, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const flashGeo = new THREE.PlaneGeometry(0.46, 0.46);
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(...muzzlePoint());
  gun.add(flash);
  
  const flashCross = new THREE.Mesh(flashGeo, flashMat);
  flashCross.position.set(...muzzlePoint());
  flashCross.rotation.x = Math.PI / 2;
  gun.add(flashCross);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const xRig = new THREE.Group();
  const xTilt = new THREE.Group();
  const xander = new THREE.Mesh(xGeo, mat);
  xander.rotation.x = -Math.PI / 2;   
  xander.rotation.z = -Math.PI / 2;   
  xander.add(gun);
  xTilt.add(xander);
  xRig.add(xTilt);
  scene.add(xRig);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const shadowRig = new THREE.Group();
  const shadowMats = [];
  const blobs = [];
  {
    for (let i = 0; i < 3; i += 1) {
      const q = makeBlob(1, 0.4);
      shadowMats.push(q.material);
      blobs.push(q);
      shadowRig.add(q);
    }
  }
  scene.add(shadowRig);

  
  
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
  
  
  
  
  const neckHomeZ = neck.position.z;
  const xHead = new THREE.Mesh(headGeo, faceMat);
  neck.add(xHead);
  xander.add(neck);
  const portrait = makePortrait(headGeo, shouldersGeo, faces, mat);

  const chickenParts = buildChicken().parts;
  const porkerParts = buildPorker().parts;
  const cowParts = buildCow().parts;
  const horseParts = buildHorse().parts;

  const player = {
    
    
    
    
    
    
    
    x: deck.start.x, z: deck.start.z, yaw: 0,
    vitals: spawnVitals(),
    
    
    
    
    
    
    
    
    
    
    weapon: readyWeapon('boltDriver', { ammo: 48 }),
    struggle: null,
    latchedBy: null,
    dead: false,
  };

  
  
  
  
  
  const barks = createBarks((Date.now() % 100000) | 1);
  
  
  
  
  let barkHealthWas = MAX_HEALTH;
  let barkAmmoWas = Infinity;
  let barkSpottedWas = false;

  const birds = [];
  let chickSeed = 0;
  function addChicken(z, x, kind = 'chicken') {
    
    
    const SPECIES = {
      chicken: [chickenParts, (n) => CCOL[n] ?? 0xb9b07a, CHICKEN_H, undefined],
      porker: [porkerParts, (n) => PCOL[n] ?? 0xb08a86, PORKER_HEIGHT_M, PORKER_RIG],
      cow: [cowParts, (n) => WCOL[n] ?? 0xb8b3ab, COW_HEIGHT_M, COW_RIG],
      horse: [horseParts, (n) => (/^eye/.test(n) ? 0x120e0c : (HCOL[n] ?? 0x2b2724)),
        HORSE_HEIGHT_M, HORSE_RIG],
    };
    
    
    
    
    if (liftCar) {
      const k = keepOut(liftCar, x, z, 0.6);
      x = k.x; z = k.z;
    }
    const [sParts, sCol, sH, sRig] = SPECIES[kind] || SPECIES.chicken;
    const rig = chickenRig(sParts, sCol, sH, mat, sRig);
    rig.root.rotation.x = -Math.PI / 2;
    (deckGroup || scene).add(rig.root);
    
    
    
    const shade = makeBlob(sH * (kind === 'horse' ? 1.15 : 0.62), 0.44);
    (deckGroup || scene).add(shade);
    chickSeed += 0.37;
    birds.push({
      
      mesh: rig.root, rig, shade, x, z, alive: true, kind,
      
      
      
      
      
      creature: kind === 'horse' ? null : spawnCreature(kind),
      anim: emptyChickenAnim(chickSeed % 1),
      
      
      
      
      voice: 0.78 + (chickSeed * 1.7) % 0.62,
      idleIn: 1 + Math.random() * 5,
      latched: false,
      cool: 0,
    });
    return birds[birds.length - 1];
  }

  
  
  
  
  
  
  
  function buildWorld(seed) {
    if (deckGroup) {
      deckGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      scene.remove(deckGroup);
    }
    deckGroup = new THREE.Group();
    scene.add(deckGroup);

    
    
    isBoss = isBossDeck(seed);
    deck = isBoss ? bossLevel() : buildLevel(seed);
    
    
    fight = isBoss ? createBossFight({ endurance: 1 + (actFor(seed) - 1) * 0.25 }) : null;
    EXIT = deck.exit;
    rails = railNodesForRuns(deck.runs);
    safeRoom = deck.rooms.find((m) => m.kind === 'safe') || null;
    
    
    
    
    library = null;
    workbench = null;
    nearBench = false;
    leaks = [];
    wires = [];
    lockers = [];
    pickups = [];

    ({ strips, ceilingPieces } = buildDeck(deckGroup, deck));

    
    
    leaks = [];
    wires = [];
    props = [];
    solidProps = [];
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
        
        
        
        
        
        
        
        
        
        
        
        
        for (let u = 0; u < 3; u += 1) {
          const wt = t + u * 3.7;
          if (wt >= len - 3) break;
          if (hash2(wt + z, 5.5) <= 0.30) continue;
          const wx = run.x0 + dx * wt; const wz = run.z0 + dz * wt;
          wires.push(makeWire(
            wx + px * (hash2(wz, 6.1) - 0.5) * HALL_W * 0.7,
            wz + pz * (hash2(wz, 6.1) - 0.5) * HALL_W * 0.7,
            0.7 + hash2(wz, 7.3) * 1.5, wx + wz,
          ));
        }
      }
    }
    for (const l of leaks) deckGroup.add(l.points);
    for (const w of wires) deckGroup.add(w.line);

    
    
    
    
    
    
    sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARK_N * 3), 3));
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    sparkPt = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: 0xdfe9ff, size: 0.20, sizeAttenuation: true, transparent: true, opacity: 0,
      map: sparkSprite(), blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sparkPt.frustumCulled = false;
    deckGroup.add(sparkPt);

    
    
    
    
    impacts = makeImpacts();
    ricochets = makeRicochets();
    tracers = makeTracers();
    deckGroup.add(ricochets.points);
    deckGroup.add(tracers.lines);
    deckGroup.add(impacts.points);
    decals = makeDecals();
    deckGroup.add(decals.group);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    lockers = [];
    for (const run of deck.runs) {
      if (run.axis !== 'z') continue;
      const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
      for (let t = 6; t < len - 4; t += 9.5) {
        if (hash2(run.z0 + t, 4.2) < 0.45) continue;
        const side = hash2(run.z0 + t, 8.1) > 0.5 ? 1 : -1;
        const x = run.x0 + side * (HALL_W / 2 - 0.22);
        const z = run.z0 + t;
        
        if (deck.rooms.some((m) => Math.abs(m.door.x - x) < 1.4 && Math.abs(m.door.z - z) < 1.6)) continue;
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.0, 0.72).toNonIndexed(), mat);
        const n = box.geometry.attributes.position.count;
        const col = new Float32Array(n * 3);
        const c = new THREE.Color(0x4a5348);
        for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        box.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
        box.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
        box.geometry.computeVertexNormals();
        box.position.set(x, 1.0, z);
        deckGroup.add(box);
        
        
        
        
        
        const hinge = new THREE.Group();
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.9, 0.035).toNonIndexed(), mat);
        {
          const pn = panel.geometry.attributes.position.count;
          const pcol = new Float32Array(pn * 3);
          const pc = new THREE.Color(0x3e463d);
          for (let i = 0; i < pn; i += 1) { pcol[i * 3] = pc.r; pcol[i * 3 + 1] = pc.g; pcol[i * 3 + 2] = pc.b; }
          panel.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(pcol, 3));
          panel.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pn * 2).fill(0), 2));
          panel.geometry.computeVertexNormals();
        }
        
        
        panel.position.x = 0.19;
        hinge.add(panel);
        
        hinge.position.set(x - 0.19, 1.0, z - side * 0.37 * 0 + (0.72 / 2 + 0.02) * -side);
        deckGroup.add(hinge);
        lockers.push({
          mesh: box, door: hinge, x: x - side * 0.5, z, side,
          
          inX: x - side * 0.26, inZ: z,
        });
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    props = [];
    for (const run of deck.runs) {
      const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
      const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
      const px = -dz; const pz = dx;
      for (let t = 3.5; t < len - 3; t += 5.5) {
        if (hash2(run.z0 + t, 11.3) < 0.34) continue;
        const side = hash2(run.x0 + t, 12.7) > 0.5 ? 1 : -1;
        const x = run.x0 + dx * t + px * side * (HALL_W / 2 - 0.34);
        const z = run.z0 + dz * t + pz * side * (HALL_W / 2 - 0.34);
        if (deck.rooms.some((m) => Math.abs(m.door.x - x) < 1.6 && Math.abs(m.door.z - z) < 1.8)) continue;
        if (liftCar && Math.hypot(x - liftCar.x, z - liftCar.z) < 3.4) continue;
        const barrel = hash2(z, 13.9) > 0.42;
        const h = barrel ? 0.86 : 0.52;
        const geo = barrel
          ? new THREE.CylinderGeometry(0.27, 0.27, h, 8, 1).toNonIndexed()
          : new THREE.BoxGeometry(0.54, h, 0.48).toNonIndexed();
        const box = new THREE.Mesh(geo, mat);
        const n = geo.attributes.position.count;
        const col = new Float32Array(n * 3);
        
        
        const c = new THREE.Color(barrel ? 0x6b4a34 : 0x5c5140);
        for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
        geo.computeVertexNormals();
        box.position.set(x, h / 2, z);
        box.rotation.y = hash2(x, 14.6) * Math.PI;
        deckGroup.add(box);

        const shGeo = new THREE.PlaneGeometry(1, 1);
        const shMat = new THREE.MeshBasicMaterial({
          color: 0x000000, transparent: true, opacity: 0, depthWrite: false,
        });
        const sh = new THREE.Mesh(shGeo, shMat);
        sh.rotation.x = -Math.PI / 2;
        sh.position.set(x, 0.012, z);
        deckGroup.add(sh);
        props.push({
          mesh: box, shadow: sh, mat: shMat, x, z, r: barrel ? 0.27 : 0.30, h,
        });
        
        
        
        
        
        
        
        solidProps.push({ x, z, r: (barrel ? 0.27 : 0.30) + 0.16 });
      }
    }

    
    
    
    
    
    
    pickups = [];
    for (const m of deck.rooms) {
      if (m.contents !== 'item') continue;
      const cx = (m.x0 + m.x1) / 2; const cz = (m.z0 + m.z1) / 2;
      const ammo = hash2(cx, cz) > 0.45;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.30, 0.26).toNonIndexed(), mat);
      {
        const n = box.geometry.attributes.position.count;
        const col = new Float32Array(n * 3);
        const c = new THREE.Color(ammo ? 0xb5893f : 0xc4534a);
        for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        box.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
        box.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
        box.geometry.computeVertexNormals();
      }
      box.position.set(cx, 0.15, cz);
      deckGroup.add(box);
      pickups.push({ mesh: box, x: cx, z: cz, ammo, taken: false });
    }

    
    
    
    
    
    
    
    
    
    if (safeRoom) {
      const cx = (safeRoom.x0 + safeRoom.x1) / 2;
      const cz = (safeRoom.z0 + safeRoom.z1) / 2;
      const far = safeRoom.side > 0 ? safeRoom.x1 : safeRoom.x0;
      
      
      
      const paint = (geo, hex) => {
        const n = geo.attributes.position.count;
        const col = new Float32Array(n * 3);
        const c = new THREE.Color(hex);
        for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
        geo.computeVertexNormals();
        return new THREE.Mesh(geo, mat);
      };

      
      
      
      
      
      
      
      
      {
        const kit = new THREE.Group();
        
        
        
        kit.add(paint(new THREE.BoxGeometry(0.42, 0.30, 0.30).toNonIndexed(), 0xd8d4c8));
        
        for (const zs of [-1, 1]) {
          const h = paint(new THREE.BoxGeometry(0.24, 0.075, 0.02).toNonIndexed(), 0xb6392c);
          h.position.set(0, 0, zs * 0.155);
          const v = paint(new THREE.BoxGeometry(0.075, 0.24, 0.02).toNonIndexed(), 0xb6392c);
          v.position.set(0, 0, zs * 0.155);
          kit.add(h, v);
        }
        kit.position.set(cx, 0.95, cz);
        deckGroup.add(kit);
        pickups.push({
          mesh: kit, x: cx, z: cz, medkit: true, taken: false,
          
          
          baseY: 0.95, bob: 0.09, spin: 0.7,
        });
      }

      
      
      
      
      
      
      
      
      
      
      {
        const lx = cx + safeRoom.side * 0.8;
        const lz = safeRoom.z1 - 0.32;
        const shelf = paint(new THREE.BoxGeometry(1.5, 2.05, 0.52).toNonIndexed(), 0x4a5347);
        shelf.position.set(lx, 1.025, lz);
        deckGroup.add(shelf);
        
        for (const y of [0.62, 1.15, 1.68]) {
          const lip = paint(new THREE.BoxGeometry(1.42, 0.05, 0.06).toNonIndexed(), 0x2e352d);
          lip.position.set(lx, y, lz - 0.29);
          deckGroup.add(lip);
        }
        
        
        
        
        
        
        
        
        
        const scrMat = new THREE.MeshBasicMaterial({ color: 0x6ff0d8 });
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.42), scrMat);
        scr.position.set(lx, 1.42, safeRoom.z1 - 0.60);
        scr.rotation.y = Math.PI;
        deckGroup.add(scr);
        
        
        solidProps.push({ x: lx, z: lz, r: 0.85 });
        library = { x: lx, z: lz, screen: scr };
      }

      
      
      
      
      {
        const near = safeRoom.side > 0 ? safeRoom.x0 : safeRoom.x1;
        const wx = near + safeRoom.side * 0.55;
        const wz = safeRoom.z0 + 1.6;
        const table = paint(new THREE.BoxGeometry(0.6, 0.92, 1.5).toNonIndexed(), 0x525a55);
        table.position.set(wx, 0.46, wz);
        deckGroup.add(table);
        
        
        const tool = paint(new THREE.BoxGeometry(0.12, 0.1, 0.9).toNonIndexed(), 0x8a5a3a);
        tool.position.set(wx - safeRoom.side * 0.08, 0.97, wz - 0.15);
        tool.rotation.y = 0.35;
        deckGroup.add(tool);
        const box2 = paint(new THREE.BoxGeometry(0.28, 0.18, 0.28).toNonIndexed(), 0x3e463f);
        box2.position.set(wx, 1.01, wz + 0.45);
        deckGroup.add(box2);
        solidProps.push({ x: wx, z: wz, r: 0.7 });
        workbench = { x: wx, z: wz };
      }
    }

    
  
  
  
  
  
  
  
  
  {
    const cw = LIFT.width; const cd = LIFT.depth; const ch = LIFT.height;
    
    
    
    
    
    
    
    
    liftGroup = new THREE.Group();
    deckGroup.add(liftGroup);
    const cx = 0; const cz = cd / 2 + 0.1;
    placeCar(deck.bays[1]);

    
    
    
    
    
    sealedDoors = null;
    for (const bay of deck.bays) {
      const f = bay.car.face;
      const yaw = Math.atan2(-f.x, -f.z);
      const mouth = {
        x: bay.car.x + f.x * (LIFT.depth / 2 + 0.12),
        z: bay.car.z + f.z * (LIFT.depth / 2 + 0.12),
      };
      const frame = new THREE.Group();
      frame.position.set(mouth.x, 0, mouth.z);
      frame.rotation.y = yaw;
      const jambGeo = new THREE.BoxGeometry(0.22, LIFT.height + 0.15, 0.3).toNonIndexed();
      for (const sideX of [-1, 1]) {
        const j = new THREE.Mesh(jambGeo.clone(), mat);
        paintGeo(j.geometry, 0x565e52);
        j.position.set(sideX * (LIFT.width / 2 + 0.11), (LIFT.height + 0.15) / 2, 0);
        frame.add(j);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(LIFT.width + 0.66, 0.3, 0.3).toNonIndexed(), mat);
      paintGeo(lintel.geometry, 0x565e52);
      lintel.position.set(0, LIFT.height + 0.15, 0);
      frame.add(lintel);
      
      
      
      const lampMat = new THREE.MeshBasicMaterial({ color: 0x2a4a3e });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.1), lampMat);
      lamp.position.set(0, LIFT.height - 0.05, 0.18);
      frame.add(lamp);
      deckGroup.add(frame);
      if (bay.kind === 'departure') liftLamp = lampMat;
      if (bay.kind === 'arrival') {
        
        
        const sd = new THREE.Group();
        sd.position.copy(frame.position);
        sd.rotation.y = yaw;
        for (const sideX of [-1, 1]) {
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(LIFT.width / 2, LIFT.height, 0.09).toNonIndexed(), mat);
          paintGeo(leaf.geometry, 0x49544b);
          leaf.position.set(sideX * (LIFT.width / 4), LIFT.height / 2, 0.02);
          sd.add(leaf);
        }
        sd.visible = false;
        deckGroup.add(sd);
        sealedDoors = sd;
      }
    }

    const carMat = texturedMaterial(grimeTexture({
      base: 0x7a8a80, seams: true, rivets: true, mud: 2, blood: 3, hay: 0,
    }));
    const put = (w, h, tile, fn) => {
      const m = panel(w, h, tile, { mat: carMat, apply: fn });
      liftGroup.add(m);
      return m;
    };
    put(cw, cd, 2.0, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.01, cz); });
    put(cw, cd, 2.0, (m) => { m.rotation.x = Math.PI / 2; m.position.set(cx, ch, cz); });
    put(cw, ch, 2.0, (m) => { m.position.set(cx, ch / 2, cz + cd / 2); m.rotation.y = Math.PI; });
    put(cd, ch, 2.0, (m) => { m.position.set(cx - cw / 2, ch / 2, cz); m.rotation.y = Math.PI / 2; });
    put(cd, ch, 2.0, (m) => { m.position.set(cx + cw / 2, ch / 2, cz); m.rotation.y = -Math.PI / 2; });

    
    
    
    const doorMat = texturedMaterial(grimeTexture({
      base: 0x9fb0a4, seams: true, rivets: true, mud: 1, blood: 2, hay: 0,
    }));
    liftDoors = [-1, 1].map((side) => {
      const d = panel(cw / 2, ch, 1.6, {
        mat: doorMat,
        apply: (m) => { m.position.set(cx + side * cw / 4, ch / 2, cz - cd / 2); },
      });
      d.userData.side = side;
      d.userData.homeX = cx + side * cw / 4;
      liftGroup.add(d);
      return d;
    });

    
    
    const call = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.26).toNonIndexed(), mat);
    {
      const n = call.geometry.attributes.position.count;
      const col = new Float32Array(n * 3);
      const c = new THREE.Color(0x7dffc4);
      for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      call.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
      call.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
      call.geometry.computeVertexNormals();
    }
    call.position.set(cx + cw / 2 - 0.05, 1.35, cz - cd / 2 - 0.06);
    liftGroup.add(call);
    lift = call;
  }

    
    boulder = null;
    cable = null;
    arenaPillars = [];
    if (isBoss) {
      const bp = deck.boulder;
      boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0).toNonIndexed(), mat);
      {
        const n = boulder.geometry.attributes.position.count;
        const col = new Float32Array(n * 3);
        const c = new THREE.Color(0x4a4640);
        for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        boulder.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
        boulder.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
        boulder.geometry.computeVertexNormals();
      }
      boulder.position.set(bp.x, bp.y, bp.z);
      deckGroup.add(boulder);

      
      
      
      
      
      
      
      
      
      
      for (const q of pillars()) {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(q.r, q.r * 1.12, ARENA.height, 7).toNonIndexed(),
          mat,
        );
        const n = col.geometry.attributes.position.count;
        const cc = new Float32Array(n * 3);
        const c2 = new THREE.Color(0x5d6357);
        for (let i = 0; i < n; i += 1) { cc[i * 3] = c2.r; cc[i * 3 + 1] = c2.g; cc[i * 3 + 2] = c2.b; }
        col.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(cc, 3));
        col.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
        col.geometry.computeVertexNormals();
        col.position.set(q.x, ARENA.height / 2, q.z);
        deckGroup.add(col);
        arenaPillars.push(q);
      }

      
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        bp.x, ARENA.height, bp.z, bp.x, bp.y + 0.9, bp.z,
      ]), 3));
      cable = new THREE.Line(cg, new THREE.LineBasicMaterial({ color: 0x8a7f68 }));
      cable.frustumCulled = false;
      deckGroup.add(cable);
    }

    
    
    
    
    
    for (const b of birds) {
      scene.remove(b.mesh);
      if (b.shade) scene.remove(b.shade);
      if (b.flame) { scene.remove(b.flame); b.flame = null; }
      b.alive = false;
    }
    birds.length = 0;
    player.latchedBy = null;
    player.struggle = null;

    
  
  
  
  
  
  
  
  
  if (isBoss) {
    addChicken(deck.length * 0.90, 0, 'horse');
    return;
  }

  
    
    
    
    
    
    
    
    const plan = rosterFor(seed);
    plan.behind.forEach((back, i) => {
      const p = pointBehind(deck, deck.start.x, deck.start.z, back);
      addChicken(p.z, p.x + (i % 2 ? 1 : -1) * 0.5);
    });

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const openingBreach = [];
    deck.runs.forEach((run, i) => {
      if (run.axis !== 'x' || i < plan.porkerFromCorner) return;
      openingBreach.push({ species: 'porker', x: (run.x0 + run.x1) / 2, z: run.z1 });
    });

    
    
    
    
    
    
    
    
    
    {
      
      
      
      
      const zRuns = deck.runs.filter((r) => r.axis === 'z');
      const last = zRuns[zRuns.length - 1];
      openingBreach.push({
        species: 'cow', x: last.x0, z: last.z0 + (last.z1 - last.z0) * 0.45,
      });
      if (plan.cows >= 2 && zRuns.length > 2) {
        const mid = zRuns[Math.floor(zRuns.length / 2) - 1];
        openingBreach.push({
          species: 'cow', x: mid.x0, z: mid.z0 + (mid.z1 - mid.z0) * 0.5,
        });
      }
    }
    
    
    if (plan.ahead >= 1 && deck.runs.length > 2) {
      const r2 = deck.runs[2];
      addChicken((r2.z0 + r2.z1) / 2, (r2.x0 + r2.x1) / 2);
    }

    
    
    for (const m of deck.rooms) {
      if (m.contents === 'enemy') addChicken((m.z0 + m.z1) / 2, (m.x0 + m.x1) / 2, 'porker');
    }

    
    
    bench = stockBench(bench, seed, player.weapon.id);

    
    
    
    
    
    
    
    
    
    gateMeshes = [];
    entrances = [];
    for (const d of debrisPool) { d.live = false; d.settled = false; if (d.mesh) d.mesh.visible = false; }
    
    
    
    director = null;
    openingPending = [];
    openingCooldown = 0;
    if (!isBoss) {
      const gs = gatesFor(deck, seed, { act: actFor(seed) });
      for (const g of gs) {
        if (g.kind === 'drop') {
          
          
          
          
          const dg = new THREE.Group();
          dg.position.set(g.x, HALL_H, g.z);
          const tile = introPaint(new THREE.BoxGeometry(1.3, 0.06, 1.3).toNonIndexed(), 0x3a3f3b);
          tile.position.y = -0.03;
          tile.rotation.x = 0.04;   
          dg.add(tile);
          deckGroup.add(dg);
          gateMeshes.push({ gate: g, group: dg, tile });
          continue;
        }
        const gg = new THREE.Group();
        const yaw2 = Math.atan2(g.nx, g.nz);
        gg.position.set(g.x, 0, g.z);
        gg.rotation.y = yaw2;
        if (g.kind === 'duct') {
          
          
          const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x050807 }));
          hole.position.set(0, 0.24, 0.02);
          gg.add(hole);
          const frame2 = introPaint(new THREE.BoxGeometry(0.72, 0.06, 0.06).toNonIndexed(), 0x565a5e);
          frame2.position.set(0, 0.47, 0.05); gg.add(frame2);
          const sill = introPaint(new THREE.BoxGeometry(0.72, 0.05, 0.08).toNonIndexed(), 0x565a5e);
          sill.position.set(0, 0.03, 0.05); gg.add(sill);
          const grille = new THREE.Group();
          for (let li = 0; li < 5; li += 1) {
            const louvre = introPaint(new THREE.BoxGeometry(0.62, 0.045, 0.03).toNonIndexed(), 0x6f7377);
            louvre.position.set(0, 0.09 + li * 0.075, 0.06);
            louvre.rotation.x = 0.5;
            grille.add(louvre);
          }
          gg.add(grille);
          gateMeshes.push({ gate: g, group: gg, grille });
        } else {
          
          
          
          const panel = introPaint(new THREE.BoxGeometry(1.5, 1.9, 0.05).toNonIndexed(), 0x4b524d);
          panel.position.set(0, 1.0, 0.03); gg.add(panel);
          const crackG = new THREE.Group();
          for (const [cx3, cy3, len3, rot3] of [[0, 1.2, 0.9, 0.5], [-0.2, 0.8, 0.7, -0.9], [0.25, 1.5, 0.5, 1.2], [0.1, 0.5, 0.6, -0.3]]) {
            const ck = new THREE.Mesh(new THREE.PlaneGeometry(len3, 0.025),
              new THREE.MeshBasicMaterial({ color: 0x120f0c }));
            ck.position.set(cx3, cy3, 0.062);
            ck.rotation.z = rot3;
            crackG.add(ck);
          }
          gg.add(crackG);
          gateMeshes.push({ gate: g, group: gg, cracks: crackG });
        }
        deckGroup.add(gg);
      }
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      openingPending = [];
      {
        const used = new Set();
        for (const item of openingBreach) {
          let best = -1;
          let bestD = Infinity;
          gateMeshes.forEach((m, gi) => {
            if (m.gate.kind !== 'breach' || used.has(gi)) return;
            const d = Math.hypot(m.gate.x - item.x, m.gate.z - item.z);
            if (d < bestD) { bestD = d; best = gi; }
          });
          if (best >= 0) {
            used.add(best);
            openingPending.push({
              gi: best, species: item.species, gate: gateMeshes[best].gate,
            });
          } else {
            addChicken(item.z, item.x, item.species);
          }
        }
      }

      
      
      
      
      director = seed > 1 ? createDirector(seed, actFor(seed), gateMeshes.length) : null;
    }

    
    
    
    const rec = recoveredAt(seed);
    const recName = rec ? `RECOVERED: ${WEAPONS[rec].name}` : null;
    const card = actCardFor(seed);
    const note = card && recName ? `${card}  •  ${recName}` : (card || recName);
    if (note) { hud.msg(note); actCardT = 5; }
  }

  
  
  
  
  player.vitals.health = MAX_HEALTH * INJURY.startHealthFrac;
  
  
  
  
  for (let i = 0; i < 12; i += 1) {
    const sz = 0.06 + (i % 4) * 0.03;
    const chunk = introPaintVaried(new THREE.BoxGeometry(sz, sz * 0.7, sz * 0.9).toNonIndexed(), 0x4b524d, 0.2);
    chunk.visible = false;
    scene.add(chunk);
    debrisPool.push({ mesh: chunk, vx: 0, vy: 0, vz: 0, live: false });
  }
  for (let i = 0; i < 4; i += 1) {
    const dq = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x8b877d, transparent: true, opacity: 0, depthWrite: false }));
    dq.visible = false;
    scene.add(dq);
    debrisPool.push({ mesh: dq, vx: 0, vy: 0.4, vz: 0, live: false, dust: true });
  }
  buildWorld(1);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  
  
  renderer.setSize(canvas.clientWidth || 960, canvas.clientHeight || 540, false);
  camera.aspect = (canvas.clientWidth || 960) / (canvas.clientHeight || 540);
  camera.updateProjectionMatrix();

  
  const keys = new Set();
  let fireHeld = false;
  let aimLow = false;
  addEventListener('keydown', (e) => {
    lastInput = 'key';
    if (e.code === 'KeyE' && nearBench && benchOffers(bench).length) {
      
      
      
      
      const takeId = nextOffer(bench, player.weapon.id);
      const r = benchSwap(bench, player.weapon, takeId);
      bench = r.bench;
      player.weapon = r.weapon;
      const ammoTxt = r.weapon.ammo === Infinity ? '\u221E' : String(r.weapon.ammo);
      hud.msg(`${r.weapon.spec.name}  \u2022  ${ammoTxt}`);
      actCardT = 3;
      sfxSheet.play('settle', { gain: 0.7, rate: 1.3 });
      return;
    }
    if (e.code === 'KeyE') {
      
      
      
      
      
      
      if (hidden || !hideSettled(hide) ) { hideWant = true; return; }
      if (nearLocker) { hideLocker = nearLocker; hideWant = true; hideSfx(); }
      return;
    }
    keys.add(e.code);
    if (player.struggle) {
      
      
      if (e.code === 'KeyA') player.struggle.press('a');
      if (e.code === 'KeyD') player.struggle.press('d');
    }
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('pointerdown', (e) => {
    
    
    if (player.struggle && !player.weapon.spec?.breaksGrapple) { player.struggle.press('tap'); return; }
    if (e.button === 2) { aimLow = true; return; }
    fireHeld = true;
  });
  addEventListener('pointerup', () => { fireHeld = false; aimLow = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.struggle && !player.weapon.spec?.breaksGrapple) player.struggle.press('tap');
    else fireHeld = true;
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
        touch.turn = dx / R;
        touch.active = true;
        lastInput = 'touch';
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
        
        
        if (player.struggle && !player.weapon.spec?.breaksGrapple) player.struggle.press('tap');
        else fireHeld = true;
      };
      fireBtn.addEventListener('touchstart', down, { passive: false });
      fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); fireHeld = false; }, { passive: false });
    }
  }

  
  let last = 0;
  let shotFlash = 0;
  
  
  const FLASH_WORLD = new THREE.Vector3();
  let shotEnd = null;
  
  const shotStats = { bolts: 0, ricochets: 0, forcedAt: null };
  let flashHeld = false;
  let flashTicks = 0;
  let paIn = 12 + Math.random() * 14;
  
  
  
  
  
  let shake = 0;
  let headLook = 0;
  let prevYaw = 0;
  let creakIn = 6 + Math.random() * 10;
  let sparkIn = 3 + Math.random() * 7;
  let sparkFlash = 0;
  let camNode = nodeAt(rails, progressAt(deck, deck.start.x, deck.start.z));
  let cutFlash = 0;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let studio = null;
  let studioBg = null;
  let soloSaved = null;
  let target = null;
  let aimLatch = createAimLatch();
  let walkArmsShown = false;
  let wasGaitBranch = false;
  let wallRoll = 0;
  let bankRoll = 0;
  let flinchSide = 1;
  let lastPosedFeet = null;
  let lastFlashAt = -99;
  let sinceArrive = -1;
  let liftForced = 0;
  let deckCardT = 0;
  let stumbleAt = nextStumbleAt(0);
  let stumbleT = -1;
  let walkedTotal = 0;
  let injuryDbg = { injured: false, wall: null, touch: false, leanClose: false };
  let bossMoved = 0;
  let bossWonIn = 0;

  
  
  
  
  
  
  
  
  
  let paused = false;
  
  
  let api_setPaused = null;


  
  function runState() {
    return {
      deck: level,
      health: player.vitals.health,
      stamina: player.vitals.stamina ?? 100,
      ammo: player.weapon?.ammo ?? 0,
      weapon: player.weapon?.id ?? '',
      x: player.x, z: player.z, yaw: player.yaw,
    };
  }

  function readLocalSave() {
    try { return normaliseSave(localStorage.getItem(SAVE_KEY)); } catch { return null; }
  }
  function writeLocalSave(save) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
  }

  











  let accountMod = null;
  let accountTried = false;
  async function account() {
    if (accountTried) return accountMod;
    accountTried = true;
    try {
      accountMod = await import('../../../web-engine/account/account.js');
    } catch { accountMod = null; }
    return accountMod;
  }

  
  async function cloudWho() {
    try {
      const a = await account();
      if (!a || !a.accountSummary) return null;
      const sum = a.accountSummary();
      return (sum && sum.signedIn) ? (sum.name || 'your account') : null;
    } catch { return null; }
  }

  




  async function cloudPush(save) {
    try {
      const a = await account();
      if (!a) return false;
      if (typeof a.putGameSave === 'function') return !!(await a.putGameSave('farmy-evil-hills', save));
      
      
      
      if (typeof a.recordSession === 'function') {
        a.recordSession({ gameId: 'farmy-evil-hills', metrics: { deck: save.deck } });
      }
      return false;
    } catch { return false; }
  }

  async function cloudPull() {
    try {
      const a = await account();
      if (!a || typeof a.getGameSave !== 'function') return null;
      return normaliseSave(await a.getGameSave('farmy-evil-hills'));
    } catch { return null; }
  }
  
  let frameCount = 0;
  let bossHorseSpeed = 0;
  let nearLocker = null;
  let hidden = false;
  const bars = document.getElementById('bars');
  let hintShown = true;
  
  
  let lastInput = 'key';
  
  
  let moveBasis = null;
  let lastMoved = 0;
  let lastGait = 0;
  let stepCount = 0;
  let hitCount = 0;
  let paCount = 0;
  
  
  
  
  
  
  
  
  
  function tannoy() {
    paCount += 1;
    const line = say(barks, null, { who: 'pa', force: true });
    
    
    
    
    
    
    const dur = line ? voxSheet.speak(line.id) : 0;
    if (dur > 0) {
      if (barks.current) barks.current.until = barks.t + dur + 0.4;
      barks.quietUntil = Math.max(barks.quietUntil, barks.t + dur + 0.8);
    } else {
      
      paVoice(PA_KINDS[Math.floor(Math.random() * PA_KINDS.length)]);
    }
  }
  let breathIn = 2;
  
  
  
  let camEye = { x: 0, z: -1 };
  let camTarget = { x: 0, z: 0 };
  
  
  const HINT_HTML = document.getElementById('hint')?.innerHTML ?? '';
  let inSafe = false;
  let safeResupplied = false;
  
  
  
  
  let usingSafeCam = false;
  
  
  
  let nearLibrary = false;
  let walkDist = 0;
  
  
  
  
  let startDist = 0;
  let startPhase = 0;
  let groundNow = 0;
  
  
  
  let safeIdle = 0;
  let restT = 0;
  let resting = false;
  let blown = false;
  
  
  
  let talkT = -1;
  let lastTalkKey = null;
  let fidgetT = -1;
  let fidgetWhich = 0;
  let fidgetBag = [0, 1];
  let fidgetAt = 26;
  let restNow = null;
  const REST_AFTER = 6;
  let restRigPitch = 0;
  let restRigLift = 0;
  
  
  let walkPhase = 0;
  let settle = 0;

  let fireT = 99;        
  
  
  let kickT = 99;        
  let reachT = 99;       
  let flinchT = 99;      
  
  
  
  let flinchHp = MAX_HEALTH;
  
  
  let pendingPickup = null;
  
  
  
  let wasTurnStep = false;
  
  
  let stillFor = 0;
  let glanceAt = 10 + Math.random() * 4;   
  let glanceDir = 1;
  let deathT = 0;
  let sprintNow = false;
  let level = 1;
  const mapCv = document.getElementById('map');
  
  
  
  
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  
  
  let access = resolveAccess(loadAccess(), { prefersReducedMotion: !!calm });
  const applyAccess = () => {
    const el = document.getElementById('vox');
    if (el) el.style.setProperty('--voxScale', String(textScale(access)));
  };
  applyAccess();
  const tmpV = new THREE.Vector3();
  const reticEl = document.getElementById('retic');
  const gradeEl = document.getElementById('grade');

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let intro = null;
  let introDone = false;
  let introSkip = false;
  let introStage = null;
  let introOnDone = null;
  let introCapUntil = 0;
  let introActs = null;
  let introRefs = null;
  let introBed = null;
  let introDrop = 0;
  const INTRO_SET = {
    title: { x: 0, z: -600 }, moonFarm: { x: 0, z: -600 }, call: { x: 0, z: -600 },
    ship: { x: 0, z: -600 }, transit: { x: 150, z: -600 }, crash: { x: 300, z: -600 },
    wreck: { x: 300, z: -600 },
  };
  const introSkipPress = () => {
    
    
    
    
    
    if (!intro || intro.done || intro.t <= 0.8) return;
    introSkip = true;
  };

  
  
  
  
  function introPaintVaried(geo, hex, amount = 0.12) {
    const nn = geo.attributes.position.count;
    const col = new Float32Array(nn * 3);
    const c = new THREE.Color(hex);
    let sd = 1234567;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (let i = 0; i < nn; i += 1) {
      const k = 1 + (rnd() * 2 - 1) * amount;
      col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    }
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(nn * 2).fill(0), 2));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }

  
  
  function introPlanetTexture(w, h, painter) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    painter(cv.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  function introPaint(geo, hex) {
    const nn = geo.attributes.position.count;
    const col = new Float32Array(nn * 3);
    const c = new THREE.Color(hex);
    for (let i = 0; i < nn; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(nn * 2).fill(0), 2));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }

  
  
  
  
  
  
  
  
  
  
  function introRocket(basic, variant = 'pad') {
    const g = new THREE.Group();
    const bits = { beacons: [], screens: [], survivor: null };
    const dead = variant === 'wreck';
    const glow = (w, h, hex) => {
      const m = basic(new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: hex })));
      g.add(m);
      return m;
    };

    
    const skirt = introPaintVaried(new THREE.CylinderGeometry(0.78, 1.15, 0.9, 12).toNonIndexed(), 0x33363a, 0.2);
    skirt.position.y = 0.45; g.add(skirt);
    const lower = introPaintVaried(new THREE.CylinderGeometry(0.85, 0.92, 2.2, 12).toNonIndexed(), 0xd9dde0, 0.05);
    lower.position.y = 2.0; g.add(lower);
    const stripe = introPaint(new THREE.CylinderGeometry(0.935, 0.94, 0.18, 12).toNonIndexed(), 0xb04a3a);
    stripe.position.y = 2.72; g.add(stripe);
    const collar = introPaint(new THREE.CylinderGeometry(0.87, 0.87, 0.5, 12).toNonIndexed(), 0x44484d);
    collar.position.y = 3.35; g.add(collar);
    const upper = introPaintVaried(new THREE.CylinderGeometry(0.66, 0.84, 1.9, 12).toNonIndexed(), 0xc8ccd0, 0.05);
    upper.position.y = 4.55; g.add(upper);
    const crew = introPaintVaried(new THREE.CylinderGeometry(0.52, 0.66, 0.9, 12).toNonIndexed(), 0xd9dde0, 0.05);
    crew.position.y = 5.95; g.add(crew);
    const nose = introPaint(new THREE.ConeGeometry(0.53, 1.5, 12).toNonIndexed(), 0xb04a3a);
    nose.position.y = 7.15; g.add(nose);

    
    const conduit = introPaint(new THREE.BoxGeometry(0.1, 4.4, 0.14).toNonIndexed(), 0x6f7377);
    conduit.position.set(-0.02, 3.1, -0.9); g.add(conduit);
    const mast = introPaint(new THREE.CylinderGeometry(0.022, 0.022, 1.1, 6).toNonIndexed(), 0x8a9096);
    mast.position.set(0.55, 6.9, 0.15); g.add(mast);

    
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2;
      const leg = introPaint(new THREE.BoxGeometry(0.14, 1.7, 0.14).toNonIndexed(), 0x565a5e);
      leg.position.set(Math.cos(a) * 1.2, 0.75, Math.sin(a) * 1.2);
      leg.rotation.z = Math.cos(a) * 0.35; leg.rotation.x = -Math.sin(a) * 0.35;
      g.add(leg);
      const fin = introPaint(new THREE.BoxGeometry(0.07, 1.9, 0.85).toNonIndexed(), 0xd9dde0);
      fin.position.set(Math.cos(a) * 1.05, 1.35, Math.sin(a) * 1.05);
      fin.rotation.y = -a;
      g.add(fin);
      const tip = introPaint(new THREE.BoxGeometry(0.075, 0.5, 0.85).toNonIndexed(), 0xb04a3a);
      tip.position.set(Math.cos(a) * 1.05, 2.55, Math.sin(a) * 1.05);
      tip.rotation.y = -a;
      g.add(tip);
    }

    
    
    
    for (const off of [-0.2, 0.2]) {
      const pane = glow(0.34, 0.42, dead ? 0x16211f : 0x6fd8e8);
      pane.position.set(off, 6.0, 0.58);
      pane.rotation.x = -0.18; pane.rotation.y = off * 0.9;
      bits.screens.push(pane);
    }
    
    
    const hatch = glow(0.55, 0.95, 0x181c1e);
    hatch.position.set(0.905, 1.75, 0); hatch.rotation.y = Math.PI / 2;
    for (const [sy, sw] of [[0.55, 0.6], [0.25, 0.75]]) {
      const stepB = introPaint(new THREE.BoxGeometry(0.3, 0.09, sw).toNonIndexed(), 0x565a5e);
      stepB.position.set(1.05, sy, 0); g.add(stepB);
    }
    
    
    const term = glow(0.22, 0.15, dead ? 0x14201c : 0x6ff0d8);
    term.position.set(0.93, 2.45, 0.42); term.rotation.y = Math.PI / 2 + 0.35;
    bits.screens.push(term);
    
    
    [0x74e08a, 0x74e08a, 0xe0b674].forEach((hex, i) => {
      const lamp2 = basic(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07),
        new THREE.MeshBasicMaterial({ color: dead ? (i === 2 ? 0xe0b674 : 0x1c1f1c) : hex })));
      lamp2.position.set(0.9, 2.9 + i * 0.16, -0.25);
      g.add(lamp2);
      if (dead && i === 2) bits.survivor = lamp2;
    });
    
    
    for (const [bx2, by2, bz2] of [[0, 7.95, 0], [0.55, 7.5, 0.15]]) {
      const bcn = basic(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: dead ? 0x2a1512 : 0xff5040 })));
      bcn.position.set(bx2, by2, bz2);
      g.add(bcn);
      if (!dead) bits.beacons.push(bcn);
    }
    return { group: g, bits };
  }

  function buildIntroStage() {
    const stage = new THREE.Group();
    const basics = [];
    const basic = (m) => { basics.push(m); return m; };
    const refs = { basics };

    
    const moon = new THREE.Group();
    moon.position.set(INTRO_SET.moonFarm.x, 0, INTRO_SET.moonFarm.z);
    
    
    const ground = introPaintVaried(new THREE.CircleGeometry(50, 40).toNonIndexed(), 0xa9ac9f, 0.12);
    ground.rotation.x = -Math.PI / 2; moon.add(ground);
    for (const [cx2, cz2, cr] of [[-8, -10, 3.4], [10, -14, 5], [6, 9, 2.2], [-14, 6, 2.8]]) {
      const crater = introPaintVaried(new THREE.CircleGeometry(cr, 14).toNonIndexed(), 0x83867a, 0.1);
      crater.rotation.x = -Math.PI / 2; crater.position.set(cx2, 0.02, cz2);
      moon.add(crater);
      
      
      const rim = introPaint(new THREE.RingGeometry(cr * 0.92, cr * 1.18, 14).toNonIndexed(), 0xc2c5b6);
      rim.rotation.x = -Math.PI / 2; rim.position.set(cx2, 0.035, cz2);
      moon.add(rim);
    }
    
    
    for (const [hx, hz, hw, hh] of [[-30, -28, 22, 3.4], [8, -38, 26, 4.2], [34, -20, 18, 2.8], [-38, 8, 16, 2.4], [26, 26, 20, 3.0]]) {
      const hill = introPaintVaried(new THREE.SphereGeometry(1, 10, 6).toNonIndexed(), 0x565952, 0.1);
      hill.scale.set(hw, hh, hw * 0.5);
      hill.position.set(hx, 0, hz);
      moon.add(hill);
    }
    
    for (const [rx3, rz3, rs3] of [[-11, 2, 0.5], [7, -6, 0.7], [12, 3, 0.4], [-4, 12, 0.6], [3, -11, 0.5], [-16, -4, 0.8]]) {
      const rock = introPaintVaried(new THREE.BoxGeometry(rs3, rs3 * 0.6, rs3 * 0.8).toNonIndexed(), 0x8f9288, 0.15);
      rock.position.set(rx3, rs3 * 0.25, rz3); rock.rotation.y = rx3 * 1.3;
      moon.add(rock);
    }
    
    
    
    
    const earthTex = introPlanetTexture(64, 48, (g, w, h) => {
      g.fillStyle = '#3f6ea8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4e7a45';
      for (const [bx, by, bw2, bh3] of [[6, 14, 16, 10], [30, 20, 14, 12], [46, 8, 12, 8], [18, 30, 10, 8], [50, 30, 9, 9]]) {
        g.beginPath(); g.ellipse(bx, by, bw2 / 2, bh3 / 2, 0.4, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#e8eef2';
      g.fillRect(0, 0, w, 5); g.fillRect(0, h - 4, w, 4);
      g.globalAlpha = 0.35; g.fillStyle = '#dfe7ec';
      for (const [sx, sy] of [[10, 22], [38, 12], [26, 38], [54, 22]]) g.fillRect(sx, sy, 12, 3);
    });
    const earth = basic(new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 12),
      new THREE.MeshBasicMaterial({ map: earthTex })));
    earth.rotation.y = 2.2;
    earth.position.set(16, 15, -30); moon.add(earth);
    
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        const post = introPaint(new THREE.BoxGeometry(0.1, 0.9, 0.1).toNonIndexed(), 0xa89a7e);
        post.position.set(1.4 + i * 1.0, 0.45, j === 0 ? 0.2 : 2.2);
        moon.add(post);
      }
    }
    for (const rz of [0.2, 2.2]) {
      const rail = introPaint(new THREE.BoxGeometry(3.2, 0.07, 0.07).toNonIndexed(), 0xa89a7e);
      rail.position.set(2.9, 0.72, rz); moon.add(rail);
    }
    const trough = introPaint(new THREE.BoxGeometry(1.2, 0.28, 0.4).toNonIndexed(), 0x8a9083);
    trough.position.set(2.6, 0.14, 1.2); moon.add(trough);
    
    const hab = introPaint(new THREE.SphereGeometry(2.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed(), 0xb4b8bf);
    hab.position.set(-6.5, 0, -4.5); moon.add(hab);
    
    
    const habWin = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0 })));
    habWin.position.set(-5.05, 1.1, -2.9); habWin.rotation.y = 0.95;
    moon.add(habWin);
    
    const habPool = basic(new THREE.Mesh(new THREE.CircleGeometry(1.2, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.14 })));
    habPool.rotation.x = -Math.PI / 2; habPool.position.set(-4.5, 0.045, -2.4);
    moon.add(habPool);
    const lampPost = introPaint(new THREE.BoxGeometry(0.09, 1.9, 0.09).toNonIndexed(), 0x6f7377);
    lampPost.position.set(4.7, 0.95, 1.2); moon.add(lampPost);
    const penLamp = basic(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xffcf8e })));
    penLamp.position.set(4.7, 1.92, 1.2); moon.add(penLamp);
    
    const radio = introPaint(new THREE.BoxGeometry(0.3, 1.5, 0.3).toNonIndexed(), 0x4a5347);
    radio.position.set(1.6, 0.75, 3.4); moon.add(radio);
    const lampM = new THREE.MeshBasicMaterial({ color: 0x2a4a3e });
    const lamp = basic(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), lampM));
    lamp.position.set(1.6, 1.6, 3.4); moon.add(lamp);
    refs.lamp = lamp;
    
    const radioPool = basic(new THREE.Mesh(new THREE.CircleGeometry(0.7, 12),
      new THREE.MeshBasicMaterial({ color: 0x9df5d9, transparent: true, opacity: 0.05 })));
    radioPool.rotation.x = -Math.PI / 2; radioPool.position.set(1.6, 0.05, 3.4);
    moon.add(radioPool);
    refs.radioPool = radioPool;
    
    for (const [fx2, fz2] of [[-1.3, -0.9], [-4.9, -4.4]]) {
      const pole = introPaint(new THREE.BoxGeometry(0.08, 2.6, 0.08).toNonIndexed(), 0x565a5e);
      pole.position.set(fx2, 1.3, fz2); moon.add(pole);
      const head = basic(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.14),
        new THREE.MeshBasicMaterial({ color: 0xffe9c0 })));
      head.position.set(fx2, 2.62, fz2); moon.add(head);
      const pool = basic(new THREE.Mesh(new THREE.CircleGeometry(1.0, 12),
        new THREE.MeshBasicMaterial({ color: 0xffe9c0, transparent: true, opacity: 0.12 })));
      pool.rotation.x = -Math.PI / 2; pool.position.set(fx2 - 0.5, 0.05, fz2 - 0.5);
      moon.add(pool);
    }
    
    
    
    const pad = introPaintVaried(new THREE.CircleGeometry(2.3, 18).toNonIndexed(), 0x6e716b, 0.12);
    pad.rotation.x = -Math.PI / 2; pad.position.set(-3.2, 0.025, -2.6);
    moon.add(pad);
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const clamp2 = introPaint(new THREE.BoxGeometry(0.3, 0.5, 0.5).toNonIndexed(), 0x5a5e5a);
      clamp2.position.set(-3.2 + Math.cos(a) * 1.7, 0.25, -2.6 + Math.sin(a) * 1.7);
      clamp2.rotation.y = -a;
      moon.add(clamp2);
    }
    const rocketR = introRocket(basic, 'pad');
    const rocket = rocketR.group;
    rocket.position.set(-3.2, 0, -2.6); moon.add(rocket);
    refs.rocket = rocket;
    refs.rocketBits = rocketR.bits;
    const flame = basic(new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb361 })));
    flame.rotation.x = Math.PI; flame.position.set(-3.2, -0.4, -2.6);
    flame.visible = false; moon.add(flame);
    refs.flame = flame;
    const flameCore = basic(new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff2c8 })));
    flameCore.rotation.x = Math.PI; flameCore.position.set(-3.2, -0.3, -2.6);
    flameCore.visible = false; moon.add(flameCore);
    refs.flameCore = flameCore;
    
    
    refs.mach = [];
    for (const [my, mr, mh] of [[-0.95, 0.2, 0.5], [-1.35, 0.15, 0.4]]) {
      const md = basic(new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 7),
        new THREE.MeshBasicMaterial({ color: 0x9cc8ff })));
      md.rotation.x = Math.PI; md.position.set(-3.2, my, -2.6);
      md.visible = false; moon.add(md);
      refs.mach.push(md);
    }
    
    
    const padGlow = basic(new THREE.Mesh(new THREE.CircleGeometry(2.0, 16),
      new THREE.MeshBasicMaterial({ color: 0xffc27a, transparent: true, opacity: 0 })));
    padGlow.rotation.x = -Math.PI / 2; padGlow.position.set(-3.2, 0.05, -2.6);
    moon.add(padGlow);
    refs.padGlow = padGlow;
    
    
    refs.igSmoke = [];
    for (let i = 0; i < 3; i += 1) {
      const sq = basic(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9),
        new THREE.MeshBasicMaterial({ color: 0xb9bcae, transparent: true, opacity: 0, depthWrite: false })));
      sq.position.set(-3.2, 0.5, -2.6);
      sq.rotation.y = 0.9;
      moon.add(sq);
      refs.igSmoke.push({ mesh: sq, dir: (i - 1) * 1.2 + 0.4, seed: i * 0.7 });
    }
    
    
    
    const dust = basic(new THREE.Mesh(new THREE.RingGeometry(0.8, 2.0, 18),
      new THREE.MeshBasicMaterial({ color: 0xcfd2c2, transparent: true, opacity: 0 })));
    dust.rotation.x = -Math.PI / 2; dust.position.set(-3.2, 0.06, -2.6);
    moon.add(dust);
    refs.dust = dust;
    stage.add(moon);
    refs.moon = moon;

    
    {
      const pts = [];
      let sd = 91;
      const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      
      
      
      for (let i = 0; i < 700; i += 1) {
        const a = rnd() * Math.PI * 2; const e = rnd() * Math.PI * 0.48 + 0.03;
        const r = 260;
        pts.push(150 + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -600 + Math.sin(a) * Math.cos(e) * r);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const stars = basic(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd8de, size: 0.55, sizeAttenuation: false })));
      stage.add(stars);
    }

    
    const transit = new THREE.Group();
    transit.position.set(INTRO_SET.transit.x, 0, INTRO_SET.transit.z);
    const shipR = introRocket(basic, 'transit');
    const shipSmall = shipR.group;
    refs.transitBits = shipR.bits;
    shipSmall.scale.setScalar(0.42);
    shipSmall.rotation.z = -Math.PI / 2;   
    shipSmall.position.set(6, 0.6, 0);
    transit.add(shipSmall);
    refs.shipSmall = shipSmall;
    const venusTex = introPlanetTexture(48, 32, (g, w, h) => {
      g.fillStyle = '#c8935a'; g.fillRect(0, 0, w, h);
      for (const [by, bh4, cc] of [[4, 4, '#d8a86e'], [11, 3, '#b57f47'], [17, 5, '#d3a061'], [25, 4, '#ba854e']]) {
        g.fillStyle = cc; g.fillRect(0, by, w, bh4);
      }
    });
    const venus = basic(new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 12),
      new THREE.MeshBasicMaterial({ map: venusTex })));
    venus.position.set(-11, 2.2, -7); transit.add(venus);
    
    const tFlame = basic(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 7),
      new THREE.MeshBasicMaterial({ color: 0xffc27a })));
    tFlame.rotation.z = -Math.PI / 2;
    transit.add(tFlame);
    refs.tFlame = tFlame;
    
    
    refs.streaks = [];
    {
      let sd2 = 47;
      const rnd2 = () => { sd2 = (sd2 * 16807) % 2147483647; return sd2 / 2147483647; };
      for (let i = 0; i < 12; i += 1) {
        const st2 = basic(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.02),
          new THREE.MeshBasicMaterial({ color: 0xaebac2, transparent: true, opacity: 0.16 + rnd2() * 0.2 })));
        st2.position.set(rnd2() * 16 - 8, rnd2() * 4 - 1.2, rnd2() * -8 - 1);
        transit.add(st2);
        refs.streaks.push(st2);
      }
    }
    stage.add(transit);

    
    const venusSet = new THREE.Group();
    venusSet.position.set(INTRO_SET.crash.x, 0, INTRO_SET.crash.z);
    const vGround = introPaintVaried(new THREE.CircleGeometry(60, 36).toNonIndexed(), 0x94664f, 0.16);
    vGround.rotation.x = -Math.PI / 2; venusSet.add(vGround);
    for (const [rx, rz2, rs] of [[-4, -6, 1.1], [5, -3, 0.8], [-2, 4, 0.6], [7, 5, 1.4], [-8, 2, 0.9]]) {
      const rock = introPaint(new THREE.BoxGeometry(rs, rs * 0.7, rs * 0.9).toNonIndexed(), 0x5e3d30);
      rock.position.set(rx, rs * 0.3, rz2); rock.rotation.y = rx * 0.7;
      venusSet.add(rock);
    }
    
    refs.stationWin = [];
    for (const [bx, bw, bh] of [[-6, 8, 4], [3, 6, 6], [10, 9, 3]]) {
      const slab = introPaint(new THREE.BoxGeometry(bw, bh, 3).toNonIndexed(), 0x3a2a22);
      slab.position.set(bx, bh / 2, -34); venusSet.add(slab);
      
      
      
      for (let wi = 0; wi < 3; wi += 1) {
        const win = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35),
          new THREE.MeshBasicMaterial({ color: 0xd8a050 })));
        win.position.set(bx - bw / 3 + wi * (bw / 3), bh * (0.35 + 0.3 * ((wi + 1) % 2)), -32.45);
        venusSet.add(win);
        refs.stationWin.push(win);
      }
    }
    
    
    
    
    const trench = introPaintVaried(new THREE.PlaneGeometry(11, 1.7).toNonIndexed(), 0x3f2a20, 0.12);
    trench.rotation.x = -Math.PI / 2; trench.rotation.z = 0.5;
    trench.position.set(4.6, 0.03, -3.2);
    venusSet.add(trench);
    const scorch = introPaintVaried(new THREE.CircleGeometry(3.1, 16).toNonIndexed(), 0x2e1d15, 0.1);
    scorch.rotation.x = -Math.PI / 2; scorch.position.set(0.9, 0.04, -1.2);
    venusSet.add(scorch);
    const wreckR = introRocket(basic, 'wreck');
    const wreck = wreckR.group;
    refs.wreckBits = wreckR.bits;
    wreck.rotation.z = 1.45; wreck.rotation.y = 0.5;
    wreck.position.set(0.6, 0.9, -1.2);
    venusSet.add(wreck);
    
    for (const [dx2, dz2, ds2, dr2] of [[3.4, -2.6, 0.5, 0.7], [5.8, -3.8, 0.4, 2.1], [2.2, -0.2, 0.3, 1.2], [7.4, -4.6, 0.55, 0.3], [1.4, -2.9, 0.35, 2.8]]) {
      const shard = introPaint(new THREE.BoxGeometry(ds2, ds2 * 0.25, ds2 * 0.7).toNonIndexed(), 0x8a9096);
      shard.position.set(dx2, ds2 * 0.12, dz2); shard.rotation.y = dr2; shard.rotation.z = 0.15;
      venusSet.add(shard);
    }
    const stuckFin = introPaint(new THREE.BoxGeometry(0.08, 1.2, 0.65).toNonIndexed(), 0xb04a3a);
    stuckFin.position.set(6.6, 0.45, -2.4); stuckFin.rotation.z = 0.35; stuckFin.rotation.y = 1.1;
    venusSet.add(stuckFin);
    
    
    
    refs.smoke = [];
    for (let i = 0; i < 2; i += 1) {
      const sm = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.8 + i * 0.4, 0.9 + i * 0.4),
        new THREE.MeshBasicMaterial({ color: 0x777672, transparent: true, opacity: 0.3, depthWrite: false })));
      sm.position.set(1.5, 1.4 + i * 0.7, -0.7);
      sm.rotation.y = 0.7;
      venusSet.add(sm);
      refs.smoke.push({ mesh: sm, y0: 1.4 + i * 0.7, phase: i * 0.9 });
    }
    const ember = basic(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xff7a30, transparent: true, opacity: 0.5 })));
    ember.position.set(1.5, 0.55, -0.65); ember.rotation.y = 0.7;
    venusSet.add(ember);
    refs.ember = ember;
    const sparkBit = basic(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xbfe8ff })));
    sparkBit.position.set(1.6, 1.3, -0.6); sparkBit.visible = false;
    venusSet.add(sparkBit);
    refs.sparkBit = sparkBit;
    stage.add(venusSet);

    scene.add(stage);
    return { stage, refs };
  }

  function introStatic() {
    const ctx = audio.ensure();
    if (!ctx || !audio.running) return;
    const dur = 1.1;
    const buf = ctx.createBuffer(1, Math.floor(dur * ctx.sampleRate), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 0.8;
    const g = ctx.createGain();
    const t0 = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.34, t0 + 0.09);
    g.gain.setValueAtTime(0.34, t0 + dur - 0.15);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(audio.sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  
  
  
  function introHiss() {
    const ctx = audio.ensure();
    if (!ctx || !audio.running) return;
    const dur = 1.7;
    const buf = ctx.createBuffer(1, Math.floor(dur * ctx.sampleRate), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 720;
    const g = ctx.createGain();
    const t0 = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.42, t0 + 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    src.connect(lp); lp.connect(g); g.connect(audio.sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  
  
  function introBlip() {
    const ctx = audio.ensure();
    if (!ctx || !audio.running) return;
    const t0 = ctx.currentTime + 0.02;
    for (const [at, f] of [[0, 880], [0.11, 990]]) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.linearRampToValueAtTime(0.22, t0 + at + 0.012);
      g.gain.linearRampToValueAtTime(0.0001, t0 + at + 0.07);
      o.connect(g); g.connect(audio.sfxBus);
      o.start(t0 + at); o.stop(t0 + at + 0.09);
    }
  }

  function introCaption(text, cls, seconds) {
    const el = document.getElementById('vox');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('pa', cls === 'pa');
    introCapUntil = intro.t + seconds;
  }

  function routeIntroCue(e) {
    if (e.kind === 'caption') introCaption(e.text, 'pa', 3.4);
    else if (e.kind === 'agency') {
      const dur = voxSheet.speak(e.voxId);
      introCaption(e.text, 'pa', (dur > 0 ? dur : 3.5) + 0.5);
    } else if (e.kind === 'xander') {
      
      
      
      const spoken = e.voxId ? voxSheet.speak(e.voxId) : 0;
      const dur = spoken > 0 ? spoken : (mumbleSay(e.text) || 2.2);
      introCaption(e.text, '', dur + 0.7);
      if (introActs) introActs.talk = 0;
    } else if (e.kind === 'sfx') {
      if (e.effect === 'static') introStatic();
      else if (e.effect === 'hiss') introHiss();
      else if (e.effect === 'blip') introBlip();
      else sfxSheet.play(e.effect, { gain: e.gain ?? 1, rate: e.rate ?? 1 });
    } else if (e.kind === 'act') {
      if (e.act === 'walk') introActs.walking = 0;
      else if (e.act === 'feed') introActs.feed = 0;
      else if (e.act === 'toRadio') introActs.toRadio = 0;
      else if (e.act === 'step') introActs.step = 0;
      else if (e.act === 'board') { introActs.walking = -1; xRig.visible = false; }
      else if (e.act === 'ignite') introActs.ignite = 0;
      else if (e.act === 'shake') introActs.shake = 1;
      else if (e.act === 'impact') {
        introActs.impact = 0.4;
        if (introBed) { introBed.stop(); introBed = null; }
      }
      else if (e.act === 'rise') introActs.rise = 0;
    } else if (e.kind === 'shotStart') {
      if (e.shotId === 'wreck') {
        
        
        
        
        const o = INTRO_SET.wreck;
        const gu0 = getUpAt(0);
        xRig.visible = true;
        xRig.position.set(o.x + 2.4, gu0.lift * XANDER_H, o.z + 1.4);
        xRig.rotation.y = 0.6;
        xRig.rotation.x = gu0.pitch;
        xander.geometry = getUpGeo[0];
      }
      if (e.shotId === 'transit' || e.shotId === 'crash') xRig.visible = false;
      if (e.shotId === 'transit' && !introBed) {
        
        
        
        const h = sfxSheet.play('liftLoop', { loop: true, rate: 0.5, gain: 0.55 });
        if (h && h.stop) introBed = h;
      }
      if (e.shotId === 'wreck' && introBed) { introBed.stop(); introBed = null; }
    }
  }

  function beginIntro(onDone) {
    introOnDone = onDone || null;
    intro = createIntro();
    introActs = {
      walking: -1, ignite: -1, shake: 0, impact: 0, rise: -1, walkDist: 0,
      feed: -1, toRadio: -1, step: -1, talk: -1,
    };
    const built = buildIntroStage();
    introStage = built.stage;
    introRefs = built.refs;
    document.body.classList.add('introMode');
    
    
    
    
    
    
    
    
    
    gun.visible = false;
    
    const o = INTRO_SET.moonFarm;
    xRig.visible = true;
    
    
    xRig.position.set(o.x + 0.9, 0, o.z + 1.5);
    xRig.rotation.y = -Math.atan2(-(2.9 - 0.9), 1.2 - 1.5);
    
    
    for (let i = 0; i < 2 && i < birds.length; i += 1) {
      const b = birds[i];
      if (!b.mesh) continue;
      b.mesh.visible = true;
      b.mesh.position.set(o.x + 2.2 + i * 0.9, 0, o.z + 1.0 + i * 0.7);
      b.mesh.rotation.y = 1.2 + i;
    }
    window.addEventListener('keydown', introSkipPress);
    window.addEventListener('pointerdown', introSkipPress);
  }

  function endIntro() {
    window.removeEventListener('keydown', introSkipPress);
    window.removeEventListener('pointerdown', introSkipPress);
    document.body.classList.remove('introMode');
    if (introStage) {
      scene.remove(introStage);
      
      
      introStage.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      for (const bm of introRefs.basics) { if (bm.material) bm.material.dispose(); }
    }
    introStage = null; introRefs = null; introActs = null;
    if (introBed) { introBed.stop(); introBed = null; }
    xRig.rotation.x = 0;
    xRig.position.y = 0;
    neck.position.z = neckHomeZ;
    const el = document.getElementById('vox');
    if (el) { el.textContent = ''; el.classList.remove('pa'); }
    const tEl = document.getElementById('introTitle');
    if (tEl) tEl.style.opacity = '0';
    xRig.visible = true;
    intro = null;
    introDone = true;
    if (introOnDone) { const fcb = introOnDone; introOnDone = null; fcb(); }
  }

  
  
  
  
  function beginEntrance(gateIdx, speciesOverride) {
    const gm = gateMeshes[gateIdx];
    if (!gm || gm.opened) return false;
    
    
    
    
    
    
    
    const kind = speciesOverride || (gm.gate.kind === 'duct' ? 'chicken' : 'porker');
    const inWall = emergeAt(gm.gate, 0);
    const b = addChicken(inWall.z, inWall.x, kind);
    if (!b) return false;
    b.homeX = gm.gate.x + gm.gate.nx * 2; b.homeZ = gm.gate.z + gm.gate.nz * 2;
    b.mesh.visible = false;   
    if (b.shade) b.shade.visible = false;
    b.entering = true;
    entrances.push({ e: createEntrance(gm.gate.kind), gm, b, telegraphSfxT: 0 });
    return true;
  }

  function throwDebris(x, z, nx, nz, n = 6) {
    let thrown = 0;
    for (const d of debrisPool) {
      if (d.live || thrown >= n) continue;
      d.live = true;
      d.mesh.visible = true;
      d.settled = false;
      d.mesh.position.set(x + nx * 0.2, 0.5 + Math.random() * 0.8, z + nz * 0.2);
      if (d.dust) {
        d.mesh.material.opacity = 0.35;
        d.vy = 0.3 + Math.random() * 0.3;
        d.vx = nx * 0.3; d.vz = nz * 0.3;
      } else {
        d.vx = nx * (1 + Math.random() * 2) + (Math.random() - 0.5);
        d.vz = nz * (1 + Math.random() * 2) + (Math.random() - 0.5);
        d.vy = 1 + Math.random() * 2;
      }
      thrown += 1;
    }
  }

  function runIntroFrame(now, dt) {
    
    
    
    
    
    
    introDrop = 0;
    const pressed = introSkip; introSkip = false;
    const r = stepIntro(intro, dt, pressed);
    intro = r.state;
    for (const e of r.events) routeIntroCue(e);
    if (intro.done) { endIntro(); return; }

    const shotId = INTRO_SHOTS[intro.shot].id;
    const o = INTRO_SET[shotId];
    const cam = introCam(intro);
    let ex = o.x + cam.eye[0]; let ey = cam.eye[1]; let ez = o.z + cam.eye[2];
    const lx = o.x + cam.look[0]; const ly = cam.look[1]; const lz = o.z + cam.look[2];
    if (introActs.shake > 0) {
      introActs.shake = Math.max(0, introActs.shake - dt * 0.5);
      const sh = introActs.shake * 0.25;
      ex += (Math.random() * 2 - 1) * sh; ey += (Math.random() * 2 - 1) * sh; ez += (Math.random() * 2 - 1) * sh;
    }
    camera.position.set(ex, ey, ez);
    camera.lookAt(lx, ly, lz);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    audio.listen(lx, lz, { x: ex, y: ey, z: ez }, { x: lx, y: ly, z: lz });

    
    
    {
      const cad = (now % 1.2) < 0.13;
      const bitSet = shotId === 'transit' ? introRefs.transitBits : introRefs.rocketBits;
      if (bitSet) for (const bc of bitSet.beacons) bc.visible = cad;
      if (shotId === 'wreck' && introRefs.wreckBits && introRefs.wreckBits.survivor) {
        
        introRefs.wreckBits.survivor.visible = (now % 1.7) < 0.3;
      }
    }
    if (shotId === 'moonFarm' || shotId === 'call' || shotId === 'ship') {
      
      for (let i = 0; i < 2 && i < birds.length; i += 1) {
        const m = birds[i].mesh;
        if (m) m.rotation.x = Math.abs(Math.sin(now * 2.1 + i * 1.7)) * 0.28;
      }
    }
    if (shotId === 'moonFarm' || shotId === 'call') {
      
      
      let gestured = false;
      if (introActs.feed >= 0) {
        introActs.feed += dt;
        const FT = 1.6;
        if (introActs.feed < FT) {
          const fr2 = Math.min(FEED_FRAMES - 1, Math.floor((introActs.feed / FT) * FEED_FRAMES));
          if (xander.geometry !== feedGeo[fr2]) xander.geometry = feedGeo[fr2];
          introDrop = feedDrop[fr2];
          gestured = true;
        } else introActs.feed = -1;
      }
      
      
      
      if (!gestured && introActs.toRadio >= 0) {
        const o2 = INTRO_SET.call;
        const from2 = { x: o2.x + 0.9, z: o2.z + 1.5 };
        const to2 = { x: o2.x + 1.25, z: o2.z + 2.55 };
        const total2 = Math.hypot(to2.x - from2.x, to2.z - from2.z);
        introActs.toRadio = Math.min(1, introActs.toRadio + (dt * 0.85) / total2);
        const k2 = introActs.toRadio;
        xRig.position.set(from2.x + (to2.x - from2.x) * k2, 0, from2.z + (to2.z - from2.z) * k2);
        if (k2 < 1) {
          introActs.walkDist += dt * 0.85;
          const wf2 = Math.floor(((introActs.walkDist / STRIDE) % 1) * WALK_FRAMES) % WALK_FRAMES;
          if (xander.geometry !== walkGeo[wf2]) xander.geometry = walkGeo[wf2];
          introDrop = walkPose(wf2 / WALK_FRAMES, 'walk').drop || 0;
          xRig.rotation.y = -Math.atan2(-(to2.x - from2.x), to2.z - from2.z);
          gestured = true;
        } else {
          
          xRig.rotation.y = -Math.atan2(-(1.6 - 1.25), 3.4 - 2.55);
          introActs.toRadio = -1;
        }
      }
      
      
      if (!gestured && introActs.talk >= 0) {
        introActs.talk += dt;
        const TT = 1.5;
        if (introActs.talk < TT) {
          const k3 = Math.sin(Math.PI * (introActs.talk / TT));
          const tf = Math.round(k3 * (TALK_FRAMES - 1));
          if (xander.geometry !== talkGeo[tf]) xander.geometry = talkGeo[tf];
          gestured = true;
        } else introActs.talk = -1;
      }
      if (!gestured) {
        const span = IDLE_FRAMES * 2 - 2;
        const k = Math.floor((now / IDLE_TIME) * span) % span;
        const fi = k < IDLE_FRAMES ? k : span - k;
        if (xander.geometry !== idleGeo[fi]) xander.geometry = idleGeo[fi];
      }
    }
    if (shotId === 'call' && introRefs.lamp) {
      const ringing = Math.sin(now * 9) > 0;
      introRefs.lamp.material.color.setHex(ringing ? 0x9df5d9 : 0x2a4a3e);
      
      if (introRefs.radioPool) introRefs.radioPool.material.opacity = ringing ? 0.2 : 0.05;
    }
    if (shotId === 'ship') {
      if (introActs.walking >= 0) {
        
        
        const oM = INTRO_SET.ship;
        const from = { x: oM.x + 1.25, z: oM.z + 2.55 };
        const to = { x: oM.x - 3.2 + 1.55, z: oM.z - 2.6 };   
        const total = Math.hypot(to.x - from.x, to.z - from.z);
        introActs.walking = Math.min(1, introActs.walking + (dt * 1.25) / total);
        const wk = introActs.walking;
        xRig.position.set(from.x + (to.x - from.x) * wk, 0, from.z + (to.z - from.z) * wk);
        xRig.rotation.y = -Math.atan2(-(to.x - from.x), to.z - from.z);
        introActs.walkDist += dt * 1.25;
        const wf = Math.floor(((introActs.walkDist / STRIDE) % 1) * WALK_FRAMES) % WALK_FRAMES;
        if (xander.geometry !== walkGeo[wf]) xander.geometry = walkGeo[wf];
        introDrop = walkPose(wf / WALK_FRAMES, 'walk').drop || 0;
      }
      if (introActs.ignite >= 0 && introRefs.flame && introRefs.rocket) {
        introActs.ignite += dt;
        const fl = introRefs.flame;
        fl.visible = true;
        fl.scale.set(1, 0.8 + Math.random() * 0.6, 1);
        const core = introRefs.flameCore;
        if (core) { core.visible = true; core.scale.set(1, 0.7 + Math.random() * 0.7, 1); }
        if (introActs.ignite > 1.1) {
          const risen = (introActs.ignite - 1.1);
          introRefs.rocket.position.y = risen * risen * 2.2;
          fl.position.y = -0.4 + introRefs.rocket.position.y;
          if (core) core.position.y = -0.3 + introRefs.rocket.position.y;
        }
        for (const md of introRefs.mach || []) {
          md.visible = introActs.ignite > 0.25;
          md.scale.set(1, 0.7 + Math.random() * 0.6, 1);
          md.position.y = md.userData.baseY ?? (md.userData.baseY = md.position.y);
          md.position.y = md.userData.baseY + (introRefs.rocket ? introRefs.rocket.position.y : 0);
        }
        if (introRefs.padGlow) {
          
          const clear2 = Math.max(0, 1 - (introRefs.rocket ? introRefs.rocket.position.y : 0) / 4);
          introRefs.padGlow.material.opacity = clear2 * (0.3 + Math.random() * 0.25);
        }
        for (const sq of introRefs.igSmoke || []) {
          const tIg = introActs.ignite - sq.seed * 0.3;
          if (tIg > 0 && tIg < 3.2) {
            const kIg = tIg / 3.2;
            sq.mesh.material.opacity = 0.4 * (1 - kIg);
            sq.mesh.position.set(-3.2 + INTRO_SET.ship.x + Math.cos(sq.dir) * (0.8 + kIg * 3.2),
              0.4 + kIg * 0.9, -2.6 + INTRO_SET.ship.z + Math.sin(sq.dir) * (0.8 + kIg * 3.2));
            sq.mesh.scale.setScalar(0.7 + kIg * 2.2);
          } else sq.mesh.material.opacity = 0;
        }
        if (introRefs.dust) {
          
          
          const du = Math.min(1, introActs.ignite / 2.8);
          introRefs.dust.scale.setScalar(0.6 + du * 3.2);
          introRefs.dust.material.opacity = Math.max(0, 0.65 * (1 - du * du));
        }
      }
    }
    if (shotId === 'transit' && introRefs.streaks) {
      for (const st2 of introRefs.streaks) {
        st2.position.x += dt * 7.5;
        if (st2.position.x > 9) st2.position.x = -9;
      }
    }
    if (shotId === 'transit' && introRefs.shipSmall) {
      const sh2 = introRefs.shipSmall;
      sh2.position.x -= dt * 1.05;
      sh2.position.y = 0.6 + Math.sin(now * 0.8) * 0.1;
      sh2.rotation.z = -Math.PI / 2 + Math.sin(now * 1.3) * 0.035;
      if (introRefs.tFlame) {
        introRefs.tFlame.position.set(sh2.position.x + 1.35, sh2.position.y, sh2.position.z);
        introRefs.tFlame.scale.set(1, 0.7 + Math.random() * 0.7, 1);
        introRefs.tFlame.visible = Math.random() > 0.08;
      }
    }
    if (shotId === 'wreck') {
      if (introRefs.sparkBit) introRefs.sparkBit.visible = Math.random() < 0.09;
      
      if (introRefs.smoke) {
        for (const sm of introRefs.smoke) {
          const m2 = sm.mesh;
          m2.position.y += dt * 0.42;
          const life = (m2.position.y - sm.y0) / 1.7;
          m2.material.opacity = Math.max(0, 0.32 * (1 - life));
          if (life >= 1) m2.position.y = sm.y0;
        }
      }
      if (introRefs.ember) {
        introRefs.ember.material.opacity = 0.3 + Math.abs(Math.sin(now * 5.2 + Math.sin(now * 2.1))) * 0.35;
      }
      
      
      if (introActs.step >= 0 && introActs.rise >= 3.4) {
        introActs.step += dt;
        const ST2 = 0.9;
        if (introActs.step < ST2) {
          const sf2 = Math.floor((introActs.step / ST2) * SHUFFLE_FRAMES) % SHUFFLE_FRAMES;
          if (xander.geometry !== shuffleGeo[sf2]) xander.geometry = shuffleGeo[sf2];
          xRig.position.x -= dt * 0.22;
        } else introActs.step = -1;
      }
      if (introActs.rise >= 0) {
        introActs.rise += dt;
        
        
        
        
        const RISE_T = 4.6;
        if (introActs.rise < RISE_T) {
          const u = introActs.rise / RISE_T;
          const gu = getUpAt(u);
          const fd = Math.min(GETUP_FRAMES - 1, Math.floor(u * GETUP_FRAMES));
          if (xander.geometry !== getUpGeo[fd]) xander.geometry = getUpGeo[fd];
          xRig.rotation.x = gu.pitch;
          xRig.position.y = gu.lift * XANDER_H;
        } else if (!(introActs.step >= 0 && introActs.step < 0.9)) {
          xRig.rotation.x = 0;
          xRig.position.y = 0;
          const span = IDLE_FRAMES * 2 - 2;
          const k = Math.floor((now / IDLE_TIME) * span) % span;
          const fi = k < IDLE_FRAMES ? k : span - k;
          if (xander.geometry !== idleGeo[fi]) xander.geometry = idleGeo[fi];
        }
      }
    }

    
    
    
    {
      const el = document.getElementById('introTitle');
      if (el) {
        if (shotId === 'title') {
          const tt = intro.tShot;
          const shotDur = INTRO_SHOTS[intro.shot].dur;
          const inK = Math.min(1, Math.max(0, (tt - 0.3) / 0.9));
          const outK = Math.min(1, Math.max(0, (shotDur - tt) / 1.1));
          const flick = 0.86 + Math.sin(now * 13.7) * 0.07 + Math.sin(now * 3.4) * 0.07;
          el.style.opacity = (Math.min(inK, outK) * flick).toFixed(3);
        } else if (el.style.opacity !== '0') el.style.opacity = '0';
      }
    }

    
    neck.position.z = neckHomeZ - introDrop * XANDER_H;

    
    if (intro.t > introCapUntil) {
      const el = document.getElementById('vox');
      if (el && el.textContent) { el.textContent = ''; el.classList.remove('pa'); }
    }
    const f = introFade(intro);
    if (shotId === 'crash' && introActs.impact <= 0) {
      
      
      const pulse = 0.10 + Math.abs(Math.sin(now * 6.3)) * 0.14;
      gradeEl.style.background = `rgba(150,20,10,${Math.max(pulse, f * 0.9).toFixed(3)})`;
      renderer.render(scene, camera);
      return;
    }
    if (introActs.impact > 0) {
      introActs.impact = Math.max(0, introActs.impact - dt);
      gradeEl.style.background = `rgba(255,244,230,${(introActs.impact / 0.4) * 0.95})`;
    } else {
      gradeEl.style.background = `rgba(0,0,0,${Math.max(0.2, f).toFixed(3)})`;
    }
    renderer.render(scene, camera);
  }

  
  
  
  function creatureDeath(b, bh, fallSide) {
    const voice = b.kind === 'chicken' ? chickVoice : porkVoice;
    voice(b, 'die', Math.hypot(player.x - b.x, player.z - b.z));
    b.alive = false;
    b.dying = 0;
    if (decals) decals.put(b.x, b.z, bh * 1.5, 0.9);
    b.fallSide = fallSide;
    if (b.latched) { player.latchedBy = null; player.struggle = null; endGrapple(player.vitals); }
    combatSay(barks, 'kill');
  }

  function step(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now;

    
    
    
    
    
    if (paused) {
      
      
      
      
      
      
      
      
      
      requestAnimationFrame(step);
      return;
    }

    
    if (intro && !intro.done) {
      runIntroFrame(now, dt);
      requestAnimationFrame(step);
      return;
    }

    lastMoved = 0;
    groundNow = 0;
    if (!player.dead && !hidden) {
      
      
      
      
      const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || (touch.active && touch.fwd > 0.75);
      sprintNow = sprint;
      let fwd = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
      let strafe = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1;
      if (touch.active) { fwd = touch.fwd; strafe = touch.turn; }
      
      if (player.struggle) strafe = 0;

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const pressing = Math.abs(fwd) > 0.05 || Math.abs(strafe) > 0.05;
      if (!pressing) {
        
        moveBasis = null;
      }
      if (pressing && !moveBasis) {
        const f = { x: camTarget.x - camEye.x, z: camTarget.z - camEye.z };
        const m = Math.hypot(f.x, f.z) || 1;
        moveBasis = { fx: f.x / m, fz: f.z / m, rx: -f.z / m, rz: f.x / m };
      }

      const slow = (player.latchedBy ? (1 - CHICKEN_LATCH_SLOW) : 1)
        * (isDanger(player.vitals.health, MAX_HEALTH) ? INJURY.dangerMoveScale
          : (isInjured(player.vitals.health, MAX_HEALTH) ? INJURY.moveScale : 1));
      
      
      
      
      
      const speed = ((player.struggle || reachT < REACH_TIME) ? 0 : (sprint ? 5.5 : 2.4)) * slow;
      
      
      
      
      
      
      
      
      
      let dx = 0; let dz = 0;
      if (pressing && moveBasis) {
        dx = moveBasis.fx * fwd + moveBasis.rx * strafe;
        dz = moveBasis.fz * fwd + moveBasis.rz * strafe;
        const m = Math.hypot(dx, dz);
        if (m > 1) { dx /= m; dz /= m; }        
        
        
        
        
        
        const want = Math.atan2(-dx, dz);
        let d = want - player.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));   
        player.yaw += d * (1 - Math.exp(-9 * dt));
      }
      
      
      
      
      
      
      
      
      
      let moved = moveInLevel(deck, player, dx * speed * dt, dz * speed * dt, 0.4, solidProps);
      
      
      
      
      
      moved = pushOutOfPillars(arenaPillars, moved, 0.42);
      lastMoved = Math.hypot(moved.x - player.x, moved.z - player.z);
      player.x = moved.x;
      player.z = moved.z;
      
      
      
      
      
      
      groundNow = Math.hypot(dx, dz) * speed * dt;
      walkDist += groundNow;
      startDist += groundNow;

      const mode = player.struggle ? 'walk' : (sprint && pressing ? 'sprint' : 'walk');
      tickVitals(player.vitals, dt, mode, INJURY.enemyDamageScale);
    }

    
    
    
    
    
    
    
    
    
    
    
    if (entrances.length) {
      entrances = entrances.filter((en) => {
        const was2 = en.e.phase;
        en.e = stepEntrance(en.e, dt);
        const g = en.gm.gate;
        if (en.e.phase === 'telegraph') {
          en.telegraphSfxT -= dt;
          if (en.telegraphSfxT <= 0) {
            en.telegraphSfxT = g.kind === 'breach' ? 0.9 : 0.45;
            sfxSheet.play(g.kind === 'duct' ? 'ductRattle' : (g.kind === 'breach' ? 'wallThud' : 'debrisFall'),
              { dest: audio.at(g.x, g.z) || undefined, gain: 0.9 });
          }
          
          
          const sh3 = Math.sin(now * 43) * 0.012 * en.e.k;
          if (en.gm.grille) en.gm.grille.position.x = sh3;
          if (en.gm.cracks) en.gm.cracks.position.x = sh3 * 0.6;
          if (en.gm.tile) {
            en.gm.tile.position.y = -0.03 - en.e.k * 0.08;
            en.gm.tile.rotation.x = 0.04 + en.e.k * 0.10;
            if (Math.random() < 0.25 * en.e.k) throwDebris(g.x, g.z, 0, 0, 1);
          }
        }
        if (en.e.event === 'burst') {
          en.gm.opened = true;
          sfxSheet.play('breach', { dest: audio.at(g.x, g.z) || undefined, gain: 1.0 });
          sfxSheet.play('debrisFall', { dest: audio.at(g.x, g.z) || undefined, gain: 0.7, when: 0.12 });
          throwDebris(g.x, g.z, g.nx, g.nz, g.kind === 'breach' ? 8 : 5);
          shake = Math.max(shake, g.kind === 'breach' ? 0.5 : 0.3);
          if (en.gm.grille) {
            
            en.gm.grille.userData.fly = { vx: g.nx * 3, vz: g.nz * 3, vy: 2.2 };
          }
          if (en.gm.cracks && en.gm.group) {
            
            en.gm.cracks.visible = false;
            const hole2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6),
              new THREE.MeshBasicMaterial({ color: 0x050807 }));
            hole2.position.set(0, 0.95, 0.065);
            en.gm.group.add(hole2);
          }
          if (en.gm.tile) {
            
            en.gm.tile.userData.fall = { vy: -0.5, spin: 6 };
            const chole = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3),
              new THREE.MeshBasicMaterial({ color: 0x050807 }));
            chole.rotation.x = Math.PI / 2; chole.position.set(g.x, HALL_H - 0.01, g.z);
            deckGroup.add(chole);
          }
          en.b.mesh.visible = true;
          if (en.b.shade) en.b.shade.visible = true;
        }
        if (en.e.phase === 'emerge' || en.e.event === 'emerged') {
          const p2 = emergeAt(g, en.e.phase === 'emerge' ? en.e.k : 1);
          en.b.x = p2.x; en.b.z = p2.z;
          if (en.b.mesh) en.b.mesh.position.set(en.b.x, g.kind === 'drop' ? emergeY(en.e.k) : 0, en.b.z);
        }
        if (en.e.event === 'emerged') {
          en.b.entering = false;
          return false;   
        }
        en.b.entering = isProtectedPhase(en.e);
        return true;
      });
    }
    
    for (const gm of gateMeshes) {
      const tf = gm.tile && gm.tile.userData.fall;
      if (tf) {
        gm.tile.position.y += tf.vy * dt;
        gm.tile.rotation.z += tf.spin * dt;
        tf.vy -= dt * 9;
        if (gm.group.position.y + gm.tile.position.y < 0.06) {
          gm.tile.userData.fall = null;   
        }
      }
      const fly = gm.grille && gm.grille.userData.fly;
      if (fly) {
        gm.grille.position.x += fly.vx * dt * 0.2;
        gm.grille.position.y += fly.vy * dt;
        gm.grille.position.z += fly.vz * dt * 0.2;
        gm.grille.rotation.x += dt * 6;
        fly.vy -= dt * 9;
        if (gm.grille.position.y < -0.9) {
          gm.grille.position.y = -0.9;
          gm.grille.userData.fly = null;   
        }
      }
    }
    for (const d of debrisPool) {
      if (!d.live || d.settled) continue;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      if (d.dust) {
        d.mesh.material.opacity = Math.max(0, d.mesh.material.opacity - dt * 0.25);
        if (d.mesh.material.opacity <= 0) { d.live = false; d.mesh.visible = false; }
      } else {
        d.vy -= dt * 9;
        if (d.mesh.position.y <= 0.03) {
          d.mesh.position.y = 0.03;
          d.settled = true;   
        }
      }
    }

    
    
    
    
    if (director && !player.dead && deck && deck.exit) {
      const progress = Math.min(1, Math.hypot(player.x - deck.start.x, player.z - deck.start.z)
        / (Math.hypot(deck.exit.x - deck.start.x, deck.exit.z - deck.start.z) || 1));
      const gctx = gateMeshes.map((m) => ({
        kind: m.gate.kind, opened: !!m.opened,
        dist: Math.hypot(m.gate.x - player.x, m.gate.z - player.z),
      }));
      const r = stepDirector(director, dt, {
        progress, gates: gctx,
        inStruggle: !!player.struggle,
        healthFrac: player.vitals.health / MAX_HEALTH,
      });
      director = r.d;
      if (r.fire >= 0) beginEntrance(r.fire);
    }
    
    
    
    
    
    
    openingCooldown = Math.max(0, openingCooldown - dt);
    if (openingPending.length && !player.dead && openingCooldown <= 0) {
      
      
      
      
      
      
      
      
      
      
      const atLift = liftCar && Math.hypot(player.x - liftCar.x, player.z - liftCar.z) < 7;
      const idx = (inSafe || atLift || player.struggle) ? -1 : openingPending.findIndex((op) => {
        const gm = gateMeshes[op.gi];
        if (!gm || gm.opened) return false;
        const d2 = Math.hypot(gm.gate.x - player.x, gm.gate.z - player.z);
        return d2 < OPENING_FIRE.max && d2 > OPENING_FIRE.min;
      });
      if (idx >= 0 && entrances.length < 2) {
        beginEntrance(openingPending[idx].gi, openingPending[idx].species);
        openingPending.splice(idx, 1);
        openingCooldown = 5;
      }
    }
    openingPending = openingPending.filter((op) => {
      const gm = gateMeshes[op.gi];
      return gm && !gm.opened;
    });

    
    
    
    
    
    
    
    {
      const cbT = currentBark(barks);
      const keyT = cbT && cbT.who === 'xander' ? cbT.text : null;
      if (keyT !== lastTalkKey) {
        lastTalkKey = keyT;
        if (keyT) talkT = 0;
      }
      if (talkT >= 0) {
        talkT += dt;
        if (talkT > TALK_TIME) talkT = -1;
      }
    }

    
    
    
    const injuredNow = !player.dead && isInjured(player.vitals.health, MAX_HEALTH);
    const dangerNow = !player.dead && isDanger(player.vitals.health, MAX_HEALTH);
    
    
    
    
    
    if (stumbleT >= 0) {
      stumbleT += dt;
      if (stumbleT >= INJURY.stumbleTime) stumbleT = -1;
    }
    if (dangerNow) {
      walkedTotal += lastMoved;
      if (walkedTotal >= stumbleAt && stumbleT < 0) {
        stumbleT = 0;
        stumbleAt = nextStumbleAt(walkedTotal);
      }
    } else {
      
      
      walkedTotal = 0;
      stumbleAt = nextStumbleAt(0);
    }
    const wall = injuredNow && deck ? wallSupport(deck, player.x, player.z) : null;
    const wallTouch = !!wall && wall.dist <= INJURY.touchReach;
    const wallLeanClose = !!wall && wall.dist <= INJURY.leanReach;
    {
      
      
      
      const fx2 = -Math.sin(player.yaw);
      const fz2 = Math.cos(player.yaw);
      const side2 = wall ? (Math.sign(wall.dx * fz2 - wall.dz * fx2) || 1) : 0;
      const rollTarget = (injuredNow && (wallTouch || wallLeanClose)) ? side2 * 0.085 : 0;
      wallRoll += (rollTarget - wallRoll) * Math.min(1, dt * 6);
      injuryDbg = {
        injured: injuredNow,
        wall: wall ? { dist: +wall.dist.toFixed(2), side: side2 } : null,
        touch: wallTouch, leanClose: wallLeanClose,
      };
    }

    
    
    
    
    
    
    
    const bearingTo = (b) => {
      const off = Math.atan2(-(b.x - player.x), b.z - player.z) - player.yaw;
      return Math.atan2(Math.sin(off), Math.cos(off));
    };
    const range = player.weapon.spec?.range ?? 18;
    if (player.dead || player.struggle) target = null;
    if (target && (!target.alive
      || releases(Math.hypot(target.x - player.x, target.z - player.z), bearingTo(target), range))) {
      target = null;
    }
    if (!target && !player.dead && !player.struggle) {
      let best = Infinity;
      for (const b of birds) {
        if (!b.alive || b.kind === 'horse') continue;
        const d = Math.hypot(b.x - player.x, b.z - player.z);
        if (d > best || !acquires(d, bearingTo(b), range)) continue;
        best = d; target = b;
      }
    }
    
    aimLatch = stepAimLatch(aimLatch, dt, !player.dead && !!target);

    
    fireT += dt;
    kickT += dt;
    reachT += dt;
    flinchT += dt;
    tickWeapon(player.weapon, dt);
    
    
    
    
    const mayFire = fireHeld && (!player.struggle || player.weapon.spec?.breaksGrapple)
      && !player.dead && !hidden;
    
    
    
    if (mayFire && !canFire(player.weapon) && player.weapon.ammo <= 0) {
      if (fireT > 1 / (player.weapon.spec?.fireRate ?? 1.6)) { dryClickSfx(); fireT = 0; }
    }
    if (mayFire && canFire(player.weapon)) {
      fire(player.weapon);
      if (player.struggle && player.weapon.spec?.breaksGrapple) {
        
        
        const gb = player.latchedBy;
        if (gb) {
          gb.latched = false;
          gb.kick = 0.6;
          gb.stagger = Math.max(gb.stagger || 0, 0.9);
        }
        player.latchedBy = null;
        player.struggle = null;
        endGrapple(player.vitals);
      }
      
      
      
      shotEnd = null;
      
      
      
      shotSfx();
      shotFlash = 0.06;
      lastFlashAt = now;
      fireT = 0;
      
      
      
      say(barks, 'firstShot');

      
      
      
      
      
      
      
      
      if (isBoss && fight && fight.boulder === 'hung') {
        const b0 = deck.boulder;
        const near = Math.hypot(player.x - b0.x, player.z - b0.z) < 9;
        const bearing = Math.atan2(-(b0.x - player.x), b0.z - player.z);
        let off = bearing - player.yaw;
        off = Math.atan2(Math.sin(off), Math.cos(off));
        if (near && Math.abs(off) < 0.5) {
          fight = cutCable(fight);
          liftChime();
        }
      }
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const lowNow = aimLow || keys.has('ControlLeft') || keys.has('KeyQ') || !!target;
      const muzzleY = lowNow ? 0.62 : 1.30;
      
      
      
      
      const SHOT_OVERSHOOT = 1.8;
      const aimDrop = lowNow ? 1.0 : 0.30;
      let lastAimYaw = player.yaw;
      
      
      
      
      
      let targetsLeft = player.weapon.spec?.targets ?? 1;
      const shotOrder = [...birds].sort((p, q) => (
        Math.hypot(player.x - p.x, player.z - p.z) - Math.hypot(player.x - q.x, player.z - q.z)));
      for (const b of shotOrder) {
        
        
        
        if (!b.alive || !b.creature) continue;
        const dx = player.x - b.x; const dz = player.z - b.z;
        const dist = Math.hypot(dx, dz);
        if (dist > (player.weapon.spec?.range ?? 18)) continue;
        
        const fx = dx / dist; const fz = dz / dist;
        const rx = fz; const rz = -fx;                 
        const bh = { porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[b.kind] ?? CHICKEN_H;
        const toLocal = (wx, wy, wz) => {
          const ox = wx - b.x; const oz = wz - b.z;
          return {
            
            
            
            
            
            x: (ox * rx + oz * rz) / bh,
            y: wy / bh,
            z: (ox * fx + oz * fz) / bh,
          };
        };
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const aimAt = lowNow ? legAimHeight(b.kind) : 0.50;
        const tipY = aimAt * bh;
        void aimDrop;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        let aimX = b.x;
        let aimZ = b.z;
        if (lowNow) {
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          const gone = new Set(statusOf(b.creature).severedLimbs || []);
          const cand = [];
          for (const [id, sgn] of [['leg-l', -1], ['leg-r', 1]]) {
            if (gone.has(id)) continue;
            const lx = b.x + rx * sgn * 0.062 * bh;
            const lz = b.z + rz * sgn * 0.062 * bh;
            let d = Math.atan2(-(lx - player.x), lz - player.z) - player.yaw;
            d = Math.atan2(Math.sin(d), Math.cos(d));
            cand.push({ lx, lz, err: Math.abs(d) });
          }
          if (cand.length) {
            cand.sort((p, q) => p.err - q.err);
            aimX = cand[0].lx;
            aimZ = cand[0].lz;
          }
        }
        
        
        
        
        
        
        
        
        
        
        
        
        const aimYaw = target
          ? Math.atan2(-(aimX - player.x), aimZ - player.z)
          : player.yaw;
        
        
        
        
        lastAimYaw = aimYaw;
        const hit = resolveHit(
          b.creature,
          toLocal(player.x, muzzleY, player.z),
          
          
          
          
          
          
          
          
          
          
          
          
          
          toLocal(
            player.x - Math.sin(aimYaw) * dist * SHOT_OVERSHOOT,
            muzzleY + (tipY - muzzleY) * SHOT_OVERSHOOT,
            player.z + Math.cos(aimYaw) * dist * SHOT_OVERSHOOT,
          ),
        );
        if (!hit) continue;
        
        
        
        
        applyDamage(b.creature, hit.id,
          player.weapon.spec?.limbDamage ?? WEAPONS.boltDriver.limbDamage);
        
        
        
        
        
        if ((player.weapon.spec?.burnDps ?? 0) > 0 && hit.id !== 'torso') {
          b.burn = {
            left: player.weapon.spec.burnSeconds,
            dps: player.weapon.spec.burnDps,
            limb: hit.id,
          };
        }
        
        
        
        
        
        
        
        
        if (b.anim) {
          const boltX = -Math.sin(aimYaw);
          const boltZ = Math.cos(aimYaw);
          b.anim = staggerHit(
            b.anim,
            player.weapon.spec?.stagger ?? WEAPONS.boltDriver.stagger,
            Math.atan2(boltX * rx + boltZ * rz, boltX * fx + boltZ * fz),
          );
        }

        
        
        
        
        
        
        
        const hy = (hit.z ?? 0.5) * bh;
        
        shotEnd = [b.x, Math.max(0.1, hy), b.z];
        impacts.burst(
          b.x, Math.max(0.1, hy), b.z,
          { x: -Math.sin(aimYaw), z: Math.cos(aimYaw) },
        );
        meatSfx(b.x, b.z);
        
        
        if (decals) decals.put(b.x, b.z, bh * 0.5, 0.15);
        hitCount += 1;
        
        
        shake = Math.max(shake, 0.16);

        const st = statusOf(b.creature);
        
        
        
        
        
        if (!st.alive) {
          creatureDeath(b, bh,
            (hit.id === 'leg-l') ? -1 : ((hit.id === 'leg-r') ? 1 : (Math.random() < 0.5 ? -1 : 1)));
        }
        
        
        
        
        
        targetsLeft -= 1;
        if (targetsLeft <= 0) break;
      }

      
      
      
      
      
      
      
      
      
      
      if (fireT === 0) {
        const muzzle = [
          player.x - Math.sin(player.yaw) * 0.34,
          lowNow ? 0.72 : 1.16,
          player.z + Math.cos(player.yaw) * 0.34,
        ];
        if (!shotEnd) {
          
          
          
          
          
          
          const range = player.weapon.spec?.range ?? 18;
          const dirX = -Math.sin(lastAimYaw);
          const dirZ = Math.cos(lastAimYaw);
          let d = 0.4;
          let wallAt = null;
          while (d < range) {
            const px = player.x + dirX * d;
            const pz = player.z + dirZ * d;
            if (!insideLevel(deck, px, pz, 0.02)) { wallAt = [px, pz, d]; break; }
            d += 0.22;
          }
          if (wallAt) {
            
            
            
            const bx = player.x + dirX * (wallAt[2] - 0.22);
            const bz = player.z + dirZ * (wallAt[2] - 0.22);
            const acrossX = Math.abs(wallAt[0] - bx) > Math.abs(wallAt[1] - bz);
            const n = acrossX
              ? { x: dirX > 0 ? -1 : 1, z: 0 }
              : { x: 0, z: dirZ > 0 ? -1 : 1 };
            const wy = muzzle[1] + (0.02 * (Math.random() - 0.5));
            shotEnd = [wallAt[0], wy, wallAt[1]];
            if (ricochets) { ricochets.burst(wallAt[0], wy, wallAt[1], { x: dirX, z: dirZ }, n); shotStats.ricochets += 1; }
            ricochetSfx(wallAt[0], wallAt[1]);
          } else {
            shotEnd = [player.x + dirX * range, muzzle[1], player.z + dirZ * range];
          }
        }
        if (tracers) { tracers.fire(muzzle, shotEnd); shotStats.bolts += 1; }
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const keepClear = (b) => {
      if (!liftCar) return;
      const kept = keepOut(liftCar, b.x, b.z, 0.2);
      if (!kept.moved) return;
      b.x = kept.x; b.z = kept.z;
      if (b.mesh) b.mesh.position.set(b.x, b.mesh.position.y, b.z);
    };

    
    
    
    
    
    
    for (const b of birds) {
      if (!b.burn) continue;
      if (!b.alive) { if (b.flame) b.flame.visible = false; b.burn = null; continue; }
      b.burn.left -= dt;
      applyDamage(b.creature, b.burn.limb, b.burn.dps * dt);
      const bh2 = { porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[b.kind] ?? CHICKEN_H;
      
      
      if (!b.flame) {
        b.flame = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.09),
          new THREE.MeshBasicMaterial({ color: 0xff9a3d }));
        scene.add(b.flame);
      }
      b.flame.visible = Math.random() > 0.15;
      b.flame.position.set(b.x + (b.burn.limb === 'leg-l' ? -0.05 : 0.05) * bh2, bh2 * 0.28, b.z);
      b.flame.scale.setScalar(0.8 + Math.random() * 0.5);
      const stB = statusOf(b.creature);
      if (!stB.alive) {
        creatureDeath(b, bh2, b.burn.limb === 'leg-l' ? -1 : 1);
      } else if ((stB.severedLimbs || []).includes(b.burn.limb)) {
        
        b.burn = null; b.flame.visible = false;
      }
      if (b.burn && b.burn.left <= 0) { b.burn = null; b.flame.visible = false; }
    }

    for (const b of birds) {
      
      
      
      
      if (b.entering) continue;
      keepClear(b);

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (b.latched && ride && carIsSafe(ride, liftCar, player.x, player.z)) {
        b.latched = false;
        b.cool = 1.2;
        if (player.latchedBy === b) player.latchedBy = null;
        player.struggle = null;
        keepClear(b);
      }

      
      
      
      
      
      
      if (!b.alive && b.dying !== undefined && b.dying < DEATH_LIE) {
        b.dying += dt;
        const u = Math.min(1, b.dying / DEATH_FALL);
        
        
        const fall = u * u;
        
        
        
        b.mesh.rotation.x = -Math.PI / 2;
        b.mesh.rotation.y = b.fallSide * fall * (Math.PI / 2);
        
        
        b.mesh.position.set(b.x, -fall * 0.10, b.z);
        
        
        if (u < 1) {
          const tw = Math.exp(-u * 5) * Math.sin(u * 34) * 0.10;
          b.mesh.rotation.y += tw;
          
          
          
          
          
          const dtw = deathTwitch(u, b.anim ? b.anim.seed : 0);
          const kickLeg = b.rig.named[dtw.side < 0 ? 'legL' : 'legR'];
          if (kickLeg && kickLeg.visible) kickLeg.rotation.y = dtw.legKick;
          const spasmAxis = b.rig.cfg === CHICKEN_RIG_CFG ? 'x' : 'y';
          const wing = b.rig.named.wingL || b.rig.named.armL || b.rig.named.tentacleL;
          if (wing && wing.visible) wing.rotation[spasmAxis] = -dtw.wingSpasm;
        }
        if (b.shade) {
          
          b.shade.visible = true;
          const k = 1 + fall * 0.5;
          const base = (b.kind === 'horse' ? 1.15 : 0.62)
            * ({ porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M, horse: HORSE_HEIGHT_M }[b.kind] ?? CHICKEN_H);
          b.shade.position.set(b.x, 0.02, b.z);
          b.shade.scale.set(base * k, 1, base * k);
          b.shade.material.opacity = 0.44 * (1 - fall * 0.35);
        }
        
        
        const left = DEATH_LIE - b.dying;
        if (left < 0.6) {
          const a = Math.max(0, left / 0.6);
          b.mesh.visible = a > 0.02;
          if (b.shade) b.shade.material.opacity *= a;
        }
        if (b.dying >= DEATH_LIE) {
          b.mesh.visible = false;
          if (b.shade) b.shade.visible = false;
        }
        continue;
      }
      if (!b.alive) continue;

      
      if (b.kick > 0) {
        b.kick -= dt;
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        keepClear(b);
        b.vy -= 14 * dt;                       
                                               
        b.mesh.position.set(b.x, Math.max(0, b.mesh.position.y + b.vy * dt), b.z);
        b.mesh.rotation.x = -Math.PI / 2 + b.spin * (0.85 - b.kick);
        if (b.kick <= 0) { b.alive = false; b.mesh.visible = false; if (b.shade) b.shade.visible = false; }
        continue;
      }
      const dx = player.x - b.x; const dz = player.z - b.z;
      const dist = Math.hypot(dx, dz);
      
      
      
      
      
      const mob = b.creature ? mobilityOf(b.creature) : 1;
      const mobScale = (typeof mob === 'number' ? mob : (mob?.speed ?? 1));

      
      
      
      
      if (b.latched) b.anim.state = 'latched';
      const prof = b.kind === 'porker' ? PORKER : (b.kind === 'cow' ? COW : undefined);
      
      
      
      
      
      
      if (b.kind === 'horse' && fight) {
        const step = stepBossFight(fight, dt, {
          dist,
          metres: bossMoved,
          toBoulder: Math.hypot(b.x - deck.boulder.x, b.z - deck.boulder.z),
        });
        fight = step.fight;
        bossHorseSpeed = step.speed;
        bossMoved = 0;

        
        
        
        
        if (fight.dead) hud.msg('IT IS DOWN');
        else if (fight.boulder === 'rewinding') hud.msg('THE BOULDER IS SPENT');
        else if (step.blown) hud.msg('IT IS BLOWN');
        else hud.msg('');
        if (fight.event === 'blown') porkVoice(b, 'die', dist);
        else if (fight.event === 'recovered') porkVoice(b, 'alert', dist);

        if (!fight.dead && step.speed > 0 && dist > 1.1 && !player.dead) {
          const move = step.speed * dt;
          
          
          const want = pushOutOfPillars(
            arenaPillars,
            { x: b.x + (dx / dist) * move, z: b.z + (dz / dist) * move },
            1.15,
          );
          
          
          bossMoved = Math.hypot(want.x - b.x, want.z - b.z);
          b.x = want.x; b.z = want.z;
        }
        
        
        
        if (!fight.dead && dist < 1.3 && !player.dead && b.cool <= 0) {
          b.cool = 1.6;
          player.vitals.health -= 16 * INJURY.enemyDamageScale;
          shake = Math.max(shake, 0.8);
          hitSfx();
        }
        b.cool -= dt;

        
        
        
        
        
        const tired = step.exhaustion ?? 0;
        
        
        
        
        
        
        
        b.gallopGait = stepHorseGait(b.gallopGait || 0, dt, step.speed, tired);
        const hp = horsePose(b.gallopGait, step.speed / BOSS_HORSE.speed, tired);
        const sag = (k, ph) => {
          const m = b.rig.named[k];
          if (m) m.rotation.y = hp.neckPump + tired * (0.30 + 0.22 * Math.sin(now * (1.3 + ph) + ph * 2));
        };
        sag('neckC', 0); sag('neckL', 0.7); sag('neckR', 1.4);
        applyHorsePose(b.rig, hp, tired * 0.16 + (fight.dead ? 0.7 : 0));
        
        b.rig.body.scale.set(1, 1 + Math.sin(now * (3 + tired * 5)) * 0.02 * (0.4 + tired), 1);

        if (fight.dead && b.alive) {
          b.alive = false;
          
          
          
          
          
          
          
          
          
          
          
          
          if (isFinalDeck(level)) bossWonIn = 0.9;
          else { hud.msg('IT IS DOWN  -  THE WAY UP IS OPEN'); actCardT = 4.5; }
        }
        b.mesh.position.set(b.x, 0, b.z);
        
        
        
        b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI + CREATURE_FACE;
        continue;
      }

      
      
      
      
      
      
      
      
      
      const unseen = player.dead || inSafe
        || (hidden && b.anim.state !== 'stalk' && b.anim.state !== 'strike' && b.anim.state !== 'windup');

      
      
      
      
      
      
      
      if (!unseen) b.lastSeen = { x: player.x, z: player.z };

      
      
      
      
      if (!b.fatigue) b.fatigue = createFatigue(b.kind);
      const chasing = !unseen && b.anim.state !== 'dormant' && !b.latched;
      b.fatigue = tickFatigue(b.fatigue, dt, {
        pursuing: chasing,
        metres: Math.hypot(b.x - (b.lastX ?? b.x), b.z - (b.lastZ ?? b.z)),
      });
      b.lastX = b.x; b.lastZ = b.z;

      
      
      
      const r = stepChicken(b.anim, dt, unseen ? 1e6 : dist, {
        ...(prof || {}),
        legsLost: (mob && typeof mob === 'object') ? mob.legsLost : 0,
        giveUp: b.fatigue.gaveUp,
      });
      b.anim = r.anim;
      
      
      if (r.event === 'giveup') b.lastSeen = null;

      
      const voice = b.kind === 'chicken' ? chickVoice : porkVoice;
      if (r.event) voice(b, r.event === 'recover' ? 'idle' : r.event, dist);

      
      
      b.idleIn -= dt;
      if (b.idleIn <= 0) {
        b.idleIn = 3 + Math.random() * 7;
        if (b.anim.state === 'dormant' && dist < 30) voice(b, 'idle', dist);
      }

      
      
      
      
      
      const seek = (unseen && b.lastSeen) ? b.lastSeen : (unseen ? null : player);
      
      
      
      
      
      
      
      
      const aim = (seek && !isBoss) ? chaseWaypoint(deck, b, seek) : seek;
      const sdx = aim ? aim.x - b.x : 0;
      const sdz = aim ? aim.z - b.z : 0;
      const sdist = Math.hypot(sdx, sdz);
      const toTarget = seek ? Math.hypot(seek.x - b.x, seek.z - b.z) : 0;
      if (!b.latched && !player.dead && r.speed !== 0 && seek && toTarget > 0.35 && sdist > 0.01) {
        const move = r.speed * mobScale * dt;
        const stepX = (sdx / sdist) * move;
        const stepZ = (sdz / sdist) * move;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        if (b.entering || !insideLevel(deck, b.x, b.z, 0)) {
          b.x += stepX;
          b.z += stepZ;
        } else {
          const n = moveInLevel(deck, b, stepX, stepZ, CREATURE_PAD, solidProps);
          b.x = n.x;
          b.z = n.z;
        }
        keepClear(b);
      }
      
      
      
      
      
      
      
      if (ride && carIsSafe(ride, liftCar, player.x, player.z)) continue;
      if (r.canLatch && !b.latched && !player.dead && !player.struggle && b.cool <= 0) {
        b.latched = true;
        player.latchedBy = b;
        
        
        
        
        
        
        
        
        
        
        
        
        player.struggle = createStruggle({
          verb: VERB_FOR[b.kind] ?? VERB_FOR.chicken ?? 'mash',
          mode: struggleMode(access, 'reduced'),
        });
        shake = Math.max(shake, 0.55);
        hitSfx();
        beginGrapple(player.vitals, b.kind);
        
        
        combatSay(barks, 'hurt');
      }
      b.cool -= dt;

      
      const sev = statusOf(b.creature).severedLimbs;
      if (sev.length !== (b.sevShown ?? 0)) {
        b.sevShown = sev.length;
        for (const id of sev) {
          const part = b.rig.named[SEVER_PART[id]];
          if (part && part.visible) { part.visible = false; voice(b, 'hurt', dist); }
        }
      }

      applyChickenPose(b.rig, chickenPose(b.anim, {
        ...(prof || {}),
        
        
        
        severed: { legL: sev.includes('leg-l'), legR: sev.includes('leg-r') },
      }));

      
      
      
      
      
      
      
      
      
      
      
      
      if (b.latched) {
        const grip = b.kind === 'chicken' ? 0.42 : 0.72;
        b.x = player.x - Math.sin(player.yaw) * grip;
        b.z = player.z + Math.cos(player.yaw) * grip;
        const lift = b.kind === 'chicken' ? 0.28 : 0.42;
        b.mesh.position.set(b.x, lift * (0.6 + 0.4 * Math.abs(Math.sin(now * 11))), b.z);
        
        
        
        b.mesh.rotation.z = player.yaw + CREATURE_FACE;
        
        
        b.mesh.rotation.y = Math.sin(now * 9.5) * 0.30;
      } else {
        b.mesh.position.set(b.x, 0, b.z);
        b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI + CREATURE_FACE;
        b.mesh.rotation.y = 0;
      }

      
      
      
      
      
      
      
      if (b.shade) {
        const air = Math.max(0, b.mesh.position.y);
        const k = 1 / (1 + air * 2.4);
        b.shade.visible = b.alive;
        b.shade.position.set(b.x, 0.02, b.z);
        const base = (b.kind === 'horse' ? 1.15 : 0.62)
          * ({ porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M, horse: HORSE_HEIGHT_M }[b.kind] ?? CHICKEN_H);
        b.shade.scale.set(base * k, 1, base * k);
        b.shade.material.opacity = 0.44 * k;
      }
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
          
          
          
          
          
          kickT = 0;
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
      
      
      
      
      feh_track('run_death', { deck: level, act: actFor(level) });
    }

    
    
    
    
    
    
    
    
    
    
    
    
    const wasNode = camNode;
    
    
    
    camNode = nodeAt(rails, progressAt(deck, player.x, player.z), camNode);
    if (camNode !== wasNode) cutFlash = 0.05;   
    let place = railPlacement(rails, camNode, player);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const safeCam = inSafe && safeRoom ? safeRoomCamera(safeRoom) : null;
    if (!!safeCam !== usingSafeCam) { cutFlash = 0.05; usingSafeCam = !!safeCam; }
    if (safeCam) place = safeCam;

    
    
    
    
    
    
    
    
    
    
    
    
    
    if (liftCar && ride.phase !== 'idle' && ride.phase !== 'opening' && ride.phase !== 'boarding') {
      place = {
        
        
        
        
        
        
        
        
        eye: { ...carWorld(liftCar, -(LIFT.depth / 2 - 0.16), LIFT.width * 0.34), y: 2.55 },
        
        
        
        target: { ...carWorld(liftCar, LIFT.depth / 2, -0.1), y: 0.85 },
        fov: 72,
      };
    }
    camEye = place.eye;
    camTarget = place.target;
    
    
    
    audio.listen(player.x, player.z, place.eye, place.target);
    
    
    
    
    const wideLens = navigator.maxTouchPoints > 1 || touch.active;
    camera.fov = wideLens ? Math.max(place.fov, 90) : place.fov;
    camera.updateProjectionMatrix();
    
    
    
    
    
    
    
    
    
    
    
    if (wideLens && place.fov <= 64 && !intro) {
      const headroom = 1.15;
      const drop = Math.max(0, (HALL_H - place.eye.y) < headroom ? headroom - (HALL_H - place.eye.y) : 0);
      place.eye = { ...place.eye, y: place.eye.y - drop };
    }
    
    if (player.struggle) shake = Math.min(0.9, Math.max(shake, player.struggle.progress * 0.25 + 0.35));
    shake = Math.max(0, shake - dt * 1.9);
    
    
    const shakeK = shakeScale(access);
    const sx = shake ? (Math.random() - 0.5) * shake * 0.34 * shakeK : 0;
    const sy = shake ? (Math.random() - 0.5) * shake * 0.28 : 0;
    camera.position.set(place.eye.x + sx, place.eye.y + sy, place.eye.z);
    camera.lookAt(place.target.x + sx * 0.4, place.target.y + sy * 0.4, place.target.z);
    if (studio) {
      
      
      
      
      
      
      
      
      
      
      const a = player.yaw + Math.PI + (studio.bearing ?? 0);
      camera.fov = studio.fov ?? 34;
      camera.updateProjectionMatrix();
      const d = studio.dist ?? 3.2;
      camera.position.set(player.x + Math.sin(a) * d, studio.eye ?? 1.05, player.z + Math.cos(a) * d);
      camera.lookAt(player.x, studio.aim ?? 0.95, player.z);
      
      
      
      
      
      if (studio.solo) {
        if (!soloSaved) {
          soloSaved = new Map(scene.children.map((c) => [c, c.visible]));
        }
        for (const c of scene.children) c.visible = (c === xRig || c === shadowRig);
        scene.background = studioBg || (studioBg = new THREE.Color(studio.bg ?? 0x11161a));
      } else if (soloSaved) {
        for (const [c, v] of soloSaved) c.visible = v;
        soloSaved = null;
        scene.background = null;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    if (player.vitals.health < flinchHp - 2 && !player.dead
        && !player.struggle && !player.latchedBy) {
      flinchT = 0;
      
      
      
      
      let near = null;
      let nd = Infinity;
      for (const b of birds) {
        if (!b.alive) continue;
        const d2 = Math.hypot(b.x - player.x, b.z - player.z);
        if (d2 < nd) { nd = d2; near = b; }
      }
      if (near) {
        const rx2 = Math.cos(player.yaw);
        const rz2 = Math.sin(player.yaw);
        flinchSide = Math.sign((near.x - player.x) * rx2 + (near.z - player.z) * rz2) || 1;
      }
    }
    flinchHp = player.vitals.health;

    
    
    
    
    
    
    
    
    
    
    const moving = !player.dead && !player.struggle && lastMoved > 0.02;
    
    
    
    
    
    
    
    
    
    let dYaw = player.yaw - prevYaw;
    dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
    const turning = !player.dead && !player.struggle && !moving
      && kickT >= KICK_TIME && reachT >= REACH_TIME && fireT >= FIRE_TIME
      && dt > 0 && Math.abs(dYaw) / dt > TURN_RATE_MIN;
    let lean = 0;
    let bob = 0;
    
    
    
    
    let posed = null;
    let studioPose = null;
    
    
    
    let fall = 0;

    
    
    
    
    
    
    if (!moving && settle <= 0) { startDist = 0; startPhase = 0; }
    if (sprintNow && moving) startDist = START_DIST;
    if (moving || turning) settle = SETTLE_TIME;
    else if (settle > 0) {
      const st = settleStep(walkPhase, settle, dt);
      walkPhase = st.phase;
      settle = st.settle;
    }

    if (player.dead) {
      deathT = Math.min(DEATH_TIME, deathT + dt);
      const f = Math.min(DEATH_FRAMES - 1, Math.floor((deathT / DEATH_TIME) * DEATH_FRAMES));
      if (xander.geometry !== deathGeo[f]) xander.geometry = deathGeo[f];
      
      
      fall = (deathT / DEATH_TIME) * 1.15;
    } else if (player.struggle) {
      const drive = player.struggle.progress ?? 0;
      const f = Math.floor(now * 9 + drive * 4) % STRUGGLE_FRAMES;
      if (xander.geometry !== struggleGeo[f]) xander.geometry = struggleGeo[f];
      
      
      lean = Math.sin(now * 13.5) * (0.06 + drive * 0.16);
      bob = -0.05 - drive * 0.03;
    } else if (kickT < KICK_TIME) {
      
      
      
      
      const f = Math.min(KICK_FRAMES - 1, Math.floor((kickT / KICK_TIME) * KICK_FRAMES));
      if (xander.geometry !== kickGeo[f]) xander.geometry = kickGeo[f];
      
      
      lean = kickPose(kickT).lean;
    } else if (fireT < FIRE_TIME) {
      const f = Math.min(FIRE_FRAMES - 1, Math.floor((fireT / FIRE_TIME) * FIRE_FRAMES));
      if (xander.geometry !== fireGeo[f]) xander.geometry = fireGeo[f];
      lean = -Math.exp(-fireT * 14) * 0.10;      
    } else if (reachT < REACH_TIME) {
      
      
      
      const f = Math.min(REACH_FRAMES - 1, Math.floor((reachT / REACH_TIME) * REACH_FRAMES));
      if (xander.geometry !== reachGeo[f]) xander.geometry = reachGeo[f];
      lean = reachPose(reachT).lean;             
    } else if (moving || turning || settle > 0) {
      const running = sprintNow && moving;
      
      
      
      
      
      
      
      
      
      
      
      
      
      const gunUp = !player.dead && aimLatch.up && !running;
      
      
      
      
      if (!wasGaitBranch) walkArmsShown = gunUp;
      wasGaitBranch = true;
      
      
      
      
      
      
      
      const turnOnly = turning && !moving;
      if (turnOnly) { walkPhase = turnStep(walkPhase, dYaw, dt); wasTurnStep = true; }
      if (moving) wasTurnStep = false;
      const useShuffle = turnOnly || (!moving && wasTurnStep);
      
      
      
      
      
      
      
      
      
      
      const woundedSet = injuredNow && !running && !walkArmsShown && !useShuffle
        ? (dangerNow
          ? (wallTouch ? dangerWallWalkGeo : dangerWalkGeo)
          : (wallTouch ? woundedWallWalkGeo : woundedWalkGeo))
        : null;
      const set = woundedSet || (useShuffle ? shuffleGeo
        : (running ? sprintGeo : (walkArmsShown ? walkAimGeo : walkGeo)));
      const n = useShuffle ? SHUFFLE_FRAMES
        : (running ? SPRINT_FRAMES : WALK_FRAMES);
      const stride = running ? SPRINT_STRIDE : STRIDE;
      
      
      
      
      
      
      
      if (moving) {
        startPhase = (startPhase + startPhaseAdvance(startDist - groundNow, groundNow, stride)) % 1;
      }
      const ph = (walkPhase = moving
        ? startPhase
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        : walkPhase);
      const frame = Math.floor(ph * n) % n;
      if (xander.geometry !== set[frame]) xander.geometry = set[frame];

      
      
      
      
      
      
      
      
      
      
      
      const half = (v) => ((v % 0.5) + 0.5) % 0.5;
      if (half(ph) < half(lastGait) || Math.abs(ph - lastGait) > 0.4) {
        footSfx(player.x, player.z, running);
        stepCount += 1;
        walkArmsShown = gunUp;
      }
      lastGait = ph;
      
      
      
      
      
      bob = 0;
      
      
      lean = useShuffle ? 0.015 : (running ? 0.16 : 0.05);
    } else if (!player.dead && aimLatch.u > 0.001) {
      
      
      
      
      
      
      
      walkPhase = 0;
      wasGaitBranch = false;
      if (aimLatch.u < 1) {
        
        
        
        const fr = Math.round(aimLatch.u * (RAISE_FRAMES - 1));
        if (xander.geometry !== raiseGeo[fr]) xander.geometry = raiseGeo[fr];
      } else {
        
        
        
        
        const span = AIM_FRAMES * 2 - 2;
        const k = Math.floor(now * 9) % span;
        const fa = k < AIM_FRAMES ? k : span - k;
        if (xander.geometry !== aimGeo[fa]) xander.geometry = aimGeo[fa];
      }
    } else if (restNow) {
      
      
      
      
      walkPhase = 0;
      wasGaitBranch = false;
      if (restNow.seated) {
        const seat = injuredNow ? 1 : 0;
        if (xander.geometry !== seatGeo[seat]) xander.geometry = seatGeo[seat];
        restRigPitch = seatPitch[seat];
        restRigLift = seatLift[seat];
      } else {
        const fr3 = Math.min(REST_FRAMES - 1, Math.round(restNow.k * (REST_FRAMES - 1)));
        if (xander.geometry !== restGeo[fr3]) xander.geometry = restGeo[fr3];
        restRigPitch = restPitch[fr3];
        restRigLift = restLift[fr3];
      }
    } else if (injuredNow) {
      
      
      walkPhase = 0;
      wasGaitBranch = false;
      if (wallLeanClose) {
        
        
        const set2 = dangerNow ? forearmLeanGeo : wallLeanGeo;
        const n2 = dangerNow ? FOREARM_FRAMES : WALLLEAN_FRAMES;
        const fl2 = Math.floor(now * 9) % n2;
        if (xander.geometry !== set2[fl2]) xander.geometry = set2[fl2];
      } else {
        const span = IDLE_FRAMES * 2 - 2;
        const k = Math.floor((now / IDLE_TIME) * span) % span;
        const fi = k < IDLE_FRAMES ? k : span - k;
        const idleSet = dangerNow ? dangerIdleGeo : woundedIdleGeo;
        if (xander.geometry !== idleSet[fi]) xander.geometry = idleSet[fi];
      }
    } else if (talkT >= 0 && !injuredNow) {
      
      walkPhase = 0;
      wasGaitBranch = false;
      const kT = Math.sin(Math.PI * (talkT / TALK_TIME));
      const fT = Math.round(kT * (TALK_FRAMES - 1));
      if (xander.geometry !== talkGeo[fT]) xander.geometry = talkGeo[fT];
    } else if (fidgetT >= 0 && !injuredNow) {
      
      walkPhase = 0;
      wasGaitBranch = false;
      const fF = Math.min(FIDGET_FRAMES - 1, Math.floor((fidgetT / FIDGET_TIME) * FIDGET_FRAMES));
      const setF = fidgetGeo[fidgetWhich];
      if (xander.geometry !== setF[fF]) xander.geometry = setF[fF];
    } else {
      walkPhase = 0;
      wasGaitBranch = false;
      
      
      
      const span = IDLE_FRAMES * 2 - 2;
      const k = Math.floor((now / IDLE_TIME) * span) % span;
      const f = k < IDLE_FRAMES ? k : span - k;
      if (xander.geometry !== idleGeo[f]) xander.geometry = idleGeo[f];
    }
    
    
    
    if (studio && studio.clip) {
      const SETS = {
        idle: [xGeo], walk: walkGeo, sprint: sprintGeo,
        fire: fireGeo, struggle: struggleGeo, death: deathGeo,
        kick: kickGeo, reach: reachGeo, shuffle: shuffleGeo,
      };
      const set = SETS[studio.clip] || [xGeo];
      const f = Math.max(0, Math.min(set.length - 1, Math.floor((studio.phase ?? 0) * set.length)));
      if (xander.geometry !== set[f]) xander.geometry = set[f];
      lean = studio.lean ?? 0;
      bob = 0;
      
      
      
      if (studio.clip === 'death') fall = (studio.phase ?? 0) * 1.15;
      
      
      
      
      
      
      
      
      
      
      
      
      const ph = f / set.length;
      
      
      
      const phEnd = f / Math.max(1, set.length - 1);
      studioPose = studio.clip === 'idle'
        ? standPose(0)
        : studio.clip === 'kick' ? kickPose(phEnd * KICK_TIME)
          : studio.clip === 'reach' ? reachPose(phEnd * REACH_TIME)
            : gaitPose(ph, (studio.clip === 'sprint' || studio.clip === 'shuffle') ? studio.clip : 'walk');
      
      
      
      if (studio.clip === 'kick' || studio.clip === 'reach') lean = studioPose.lean;
    }

    
    
    
    
    
    
    
    {
      
      
      
      
      
      
      
      
      if (player.dead) posed = deathPose(deathT / DEATH_TIME);
      else if (player.struggle) posed = strugglePose(now, player.struggle.progress ?? 0);
      else if (kickT < KICK_TIME) posed = kickPose(kickT);
      else if (fireT < FIRE_TIME) posed = firePose(fireT);
      else if (reachT < REACH_TIME) posed = reachPose(reachT);
      else if (turning && !moving) posed = gaitPose(walkPhase, 'shuffle');
      else if (moving) {
        
        
        const ph2 = walkPhase;
        const g = gaitPose(ph2, sprintNow ? 'sprint' : 'walk');
        
        
        
        
        
        
        
        
        const gd = dangerNow ? gaitPose(limpWarp(ph2, INJURY.limpBias), 'walk') : g;
        posed = (injuredNow && !sprintNow && !walkArmsShown)
          ? (dangerNow ? dangerGait(gd, wallTouch) : woundedGait(g, wallTouch))
          : ((walkArmsShown && !sprintNow) ? aimedGait(g, aimPose(ph2 * (1 / 0.9))) : g);
      } else if (settle > 0) {
        
        
        
        
        
        
        const g = gaitPose(walkPhase, wasTurnStep ? 'shuffle' : 'walk');
        posed = (injuredNow && !wasTurnStep && !walkArmsShown)
          ? (dangerNow ? dangerGait(g, wallTouch) : woundedGait(g, wallTouch))
          : ((walkArmsShown && !wasTurnStep) ? aimedGait(g, aimPose(walkPhase * (1 / 0.9))) : g);
      } else if (!player.dead && aimLatch.u > 0.001) {
        
        
        
        if (aimLatch.u < 1) {
          const k = Math.round(aimLatch.u * (RAISE_FRAMES - 1)) / (RAISE_FRAMES - 1);
          posed = raiseMix(standPose(0), aimPose(0), k);
        } else {
          const span = AIM_FRAMES * 2 - 2;
          const kk = Math.floor(now * 9) % span;
          const fa = kk < AIM_FRAMES ? kk : span - kk;
          posed = { ...standPose(0), ...aimPose((fa / AIM_FRAMES) * (1 / 0.9)) };
        }
      } else if (restNow) {
        posed = restNow.seated ? restPose(injuredNow).pose : restTravel(restNow.k, true).pose;
      } else if (talkT >= 0 && !injuredNow) {
        const kT2 = Math.sin(Math.PI * (talkT / TALK_TIME));
        const q = Math.round(kT2 * (TALK_FRAMES - 1)) / (TALK_FRAMES - 1);
        posed = raiseMix(standPose(0), { ...standPose(0), ...TALK_TO }, q);
      } else if (injuredNow) {
        posed = wallLeanClose
          ? (dangerNow ? forearmLeanPose(now) : wallLeanPose(now))
          : (dangerNow ? dangerGait(standPose(now)) : woundedGait(standPose(now)));
      } else posed = standPose(now);
      if (studioPose) posed = studioPose;
      
      
      lastPosedFeet = posed.feet ? posed.feet.map((f) => [+f[0].toFixed(4), +f[1].toFixed(4)]) : null;
      const hand = posed.hands[0];

      gun.position.set(hand[0] * XANDER_H, 0.17, hand[1] * XANDER_H);
      
      
      
      const ready = (fireT < FIRE_TIME * 2.2) || !!target;
      gun.rotation.y = ready ? 0.02 : 0.78;
      gun.rotation.z = ready ? 0 : -0.25;
      
      
      
      
      
      
      gun.visible = !player.dead && (ready || !!target);
      
      
      
      
      const fk = flashHeld ? 1 : Math.max(0, 1 - fireT / 0.055);
      flashMat.opacity = fk * fk * 1.0;
      
      if (fireT < 0.004) {
        flash.rotation.z = Math.random() * Math.PI * 2;
        flashCross.rotation.z = Math.random() * Math.PI * 2;
        const sc = 0.85 + Math.random() * 0.4;
        flash.scale.set(sc, sc, sc);
        flashCross.scale.set(sc * 0.9, sc * 0.9, sc * 0.9);
      }
      
      
      
      {
        
        
        
        
        
        
        
        
        
        FLASH_WORLD.set(
          player.x - Math.sin(player.yaw) * 0.34,
          (aimLow || keys.has('ControlLeft') || keys.has('KeyQ') || !!target) ? 0.72 : 1.16,
          player.z + Math.cos(player.yaw) * 0.34,
        );
        for (const fm of FLASH_MATS) {
          if (!fm.uniforms.uFlash) continue;
          fm.uniforms.uFlashPos.value.copy(FLASH_WORLD);
          fm.uniforms.uFlash.value = fk * fk;
        }
        
        
        
        const lit = fk * fk;
        flashTicks += 1;
        for (const p of props) {
          if (lit <= 0.01) { if (p.mat.opacity !== 0) p.mat.opacity = 0; continue; }
          const ox = p.x - FLASH_WORLD.x; const oz = p.z - FLASH_WORLD.z;
          const d = Math.hypot(ox, oz) || 1;
          if (d > 9) { p.mat.opacity = 0; continue; }
          
          
          
          const long = Math.min(4.2, (p.h * d) / Math.max(0.35, FLASH_WORLD.y));
          p.shadow.scale.set(p.r * 2.1, long, 1);
          p.shadow.position.set(p.x + (ox / d) * long * 0.5, 0.012, p.z + (oz / d) * long * 0.5);
          p.shadow.rotation.z = -Math.atan2(ox, oz);
          p.mat.opacity = Math.min(0.72, lit * 0.85) * Math.max(0, 1 - d / 9);
        }
      }
      flash.rotation.y = now * 9;      
    }

    
    
    
    
    
    
    
    
    
    
    neck.position.z = neckHomeZ - ((posed && posed.drop) || 0) * XANDER_H;

    
    
    
    
    
    
    
    
    if (!studio && !player.dead && flinchT < FLINCH_TIME) {
      const add = flinchAdd(flinchT);
      lean += add.lean;
      bob += add.bob;
    }
    
    
    
    
    
    if (!studio && !player.dead && stillFor > 10) {
      const in_ = Math.min(1, (stillFor - 10) / 2);
      lean += Math.sin(now * 0.31) * 0.007 * in_;
      bob += Math.sin(now * 0.23 + 1.7) * 0.004 * in_;
    }

    
    {
      const was = hide.phase;
      hide = stepHide(hide, dt, { wantToggle: hideWant });
      hideWant = false;
      if (hide.event === 'creak' && hideLocker) creakSfx(hideLocker.x, hideLocker.z);
      if (hide.event === 'clank' && hideLocker) hitSfx();
      if (was === 'out' && hide.phase === 'opening') {
        hideFrom = { x: player.x, z: player.z };
      }
      if (hideLocker) {
        
        hideLocker.door.rotation.y = hide.door * 1.83 * (hideLocker.side || 1);
        
        if (hideFrom && !hideSettled(hide)) {
          const u = hide.step;
          player.x = hideFrom.x + (hideLocker.inX - hideFrom.x) * u;
          player.z = hideFrom.z + (hideLocker.inZ - hideFrom.z) * u;
          
          player.yaw = Math.atan2(-(hideFrom.x - hideLocker.inX), hideFrom.z - hideLocker.inZ);
        }
        if (hide.phase === 'out') { hideLocker = null; hideFrom = null; }
      }
      
      
      hidden = hideProtects(hide);
    }
    xRig.visible = !player.dead ? hideDrawsPlayer(hide) : xRig.visible;
    
    
    
    
    xRig.rotation.x = restRigPitch;
    xRig.position.set(player.x, bob + restRigLift * XANDER_H, player.z);
    
    
    
    xRig.rotation.y = -player.yaw;

    
    
    
    
    
    
    {
      const fwdX = -Math.sin(player.yaw); const fwdZ = Math.cos(player.yaw);
      const sideX = Math.cos(player.yaw); const sideZ = Math.sin(player.yaw);
      
      const HALF = XANDER_SPANS.hip * 0.5 * XANDER_H;
      const feet = posed.feet || [[0, 0], [0, 0]];
      for (let i = 0; i < 2; i += 1) {
        const f = feet[i][0] * XANDER_H;
        const lift = feet[i][1] * XANDER_H;
        const lat = (i === 0 ? 1 : -1) * HALF;
        blobs[i].position.x = fwdX * f + sideX * lat;
        blobs[i].position.z = fwdZ * f + sideZ * lat;
        
        
        
        
        const k = Math.min(1, lift / 0.30);
        blobs[i].scale.setScalar(0.20 * (1 + k * 0.85));
        shadowMats[i].opacity = 0.46 * (1 - k) ** 1.5;
      }
      
      
      blobs[2].position.set(fwdX * 0.04, 0.02, fwdZ * 0.04);
      blobs[2].scale.setScalar(0.36);
      shadowMats[2].opacity = player.dead ? 0.28 : 0.17;
      shadowRig.position.set(player.x, 0, player.z);
      shadowRig.visible = !hidden;
    }
    
    
    
    
    
    
    
    let stumbleLean = 0;
    if (stumbleT >= 0) {
      const su = stumbleT / INJURY.stumbleTime;
      stumbleLean = Math.sin(Math.PI * (su ** 0.65)) * 0.22;
    }
    
    
    
    if (!restNow) { restRigPitch = 0; restRigLift = 0; }
    xTilt.rotation.x = lean + fall + stumbleLean;
    
    
    
    
    
    const bank = clamp(-dYaw * 0.9, -0.05, 0.05);
    bankRoll += (bank - bankRoll) * Math.min(1, dt * 7);
    let flinchRoll = 0;
    if (flinchT < FLINCH_TIME) {
      const fu = flinchT / FLINCH_TIME;
      flinchRoll = Math.sin(Math.PI * fu) * 0.055 * flinchSide;
    }
    xTilt.rotation.z = clamp(wallRoll + bankRoll + flinchRoll, -0.16, 0.16);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
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
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (!Number.isFinite(seen)) {
      const rate = dt > 0 ? (player.yaw - prevYaw) / dt : 0;
      wantLook = clamp(rate * 0.16, -0.5, 0.5);
      
      
      
      
      
      
      
      
      if (stillFor > 10 && Math.abs(wantLook) < 0.05) {
        const gt = stillFor - glanceAt;
        if (gt >= 0 && gt < 1.4) wantLook = glanceDir * 0.42;
        else if (gt >= 1.4) {
          glanceAt = stillFor + 4 + Math.random() * 6;
          glanceDir = Math.random() < 0.5 ? -1 : 1;
        }
      }
    }
    
    
    if (moving || turning || player.dead || player.struggle || target
        || kickT < KICK_TIME || reachT < REACH_TIME || fireT < FIRE_TIME) {
      if (stillFor > 0) { stillFor = 0; glanceAt = 10 + Math.random() * 4; }
    } else {
      stillFor += dt;
      
      
      
      if (fidgetT < 0 && stillFor > fidgetAt) {
        if (!fidgetBag.length) fidgetBag = [0, 1];
        const pick = Math.floor(Math.random() * fidgetBag.length);
        fidgetWhich = fidgetBag.splice(pick, 1)[0];
        fidgetT = 0;
        fidgetAt = stillFor + 20 + Math.random() * 14;
      }
    }
    if (fidgetT >= 0) {
      fidgetT += dt;
      if (fidgetT > FIDGET_TIME) fidgetT = -1;
    }
    if (stillFor < 0.2) { fidgetT = -1; fidgetAt = 26; }
    prevYaw = player.yaw;

    
    
    
    headLook = headLook + (wantLook - headLook) * (1 - Math.exp(-6.5 * dt));
    
    
    
    
    
    neck.rotation.z = -headLook;

    
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

    
    if (impacts) impacts.step(dt);
    if (ricochets) ricochets.step(dt);
    if (tracers) tracers.step(dt);
    for (const l of leaks) l.step(dt);
    for (const w of wires) w.step(now);

    creakIn -= dt;
    if (creakIn <= 0) {
      creakIn = 9 + Math.random() * 16;
      
      
      
      
      
      const gx = player.x + (Math.random() - 0.5) * 9;
      const gz = player.z + (Math.random() - 0.5) * 22;
      if (!(Math.random() < 0.25 && settleSfx(gx, gz))) creakSfx(gx, gz);
    }

    sparkIn -= dt;
    if (sparkIn <= 0 && wires.length) {
      sparkIn = 3.5 + Math.random() * 6;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const inRange = wires.filter(
        (q) => Math.hypot(q.tip[0] - player.x, q.tip[2] - player.z) < 16,
      );
      const pool = inRange.length ? inRange : wires;
      const w = pool[Math.floor(Math.random() * pool.length)];
      sparkStats.fired += 1;
      if (Math.hypot(w.tip[0] - player.x, w.tip[2] - player.z) < 14) sparkStats.near += 1;
      sparkAt(w.tip);
      sparkFlash = 0.34;
      sparkSfx(w.tip[0], w.tip[2]);
    }
    if (actCardT > 0) { actCardT -= dt; if (actCardT <= 0) hud.msg(''); }
    {
      const el = document.getElementById('deckCard');
      if (el) {
        deckCardT = Math.max(0, deckCardT - dt);
        
        el.style.opacity = Math.min(1, deckCardT / 0.9).toFixed(3);
      }
    }
    cutFlash = Math.max(0, cutFlash - dt);
    if (gradeEl) gradeEl.style.background = cutFlash > 0
      ? 'rgba(0,0,0,0.86)' : 'rgba(2, 5, 4, 0.34)';
    
    
    
    
    
    if (library && library.screen) {
      const hum = 0.92 + Math.sin(now * 13.7) * 0.03 + Math.sin(now * 3.1) * 0.03;
      const drop = (Math.sin(now * 0.43) > 0.997) ? 0.55 : 1;
      
      
      
      library.screen.material.color.setHex(0x6ff0d8).multiplyScalar(hum * drop);
    }
    sparkFlash = Math.max(0, sparkFlash - dt);
    
    
    sparkPt.material.opacity = sparkFlash > 0
      ? (Math.random() > 0.35 ? 0.95 : 0.2) * flashScale(access) : 0;
    
    
    if (sparkFlash > 0 && sparkGeo) {
      const a = sparkGeo.attributes.position;
      for (let i = 0; i < SPARK_N; i += 1) {
        a.setY(i, a.getY(i) - dt * (0.9 + i * 0.15));
      }
      a.needsUpdate = true;
    }


    
    
    
    
    
    
    
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
      tannoy();
    }

    
    
    
    
    
    
    
    
    const barkSpotted = !player.dead
      && birds.some((b) => b.alive && b.anim && b.anim.state !== 'dormant'
        && Math.hypot(b.x - player.x, b.z - player.z) < 16);
    stepBarks(barks, dt, {
      busy: barkSpotted || !!player.struggle || !!player.latchedBy || player.dead,
    });
    
    
    
    
    
    {
      const cb = currentBark(barks);
      const key = cb ? cb.who + '|' + cb.text : null;
      if (key !== lastMumbleKey) {
        lastMumbleKey = key;
        if (cb && cb.who === 'xander') {
          
          
          
          
          
          
          
          const dv = voxSheet.speak(`x_${cb.id}`);
          if (dv > 0 && barks.current) {
            barks.current.until = Math.max(barks.current.until, barks.t + dv + 0.3);
            barks.quietUntil = Math.max(barks.quietUntil, barks.t + dv + 0.7);
          } else mumbleSay(cb.text);
        } else if (mumbleStop) { mumbleStop(); mumbleStop = null; }
      }
    }
    if (barkSpotted && !barkSpottedWas) {
      
      
      
      say(barks, barks.fired.has('see1') ? 'sight' : 'firstSight');
    }
    barkSpottedWas = barkSpotted;
    
    
    
    if (!player.dead) {
      if (player.vitals.health < 30 && barkHealthWas >= 30) say(barks, 'lowHealth');
      if (player.weapon.ammo <= 0 && barkAmmoWas > 0) say(barks, 'empty');
      else if (player.weapon.ammo < 10 && barkAmmoWas >= 10) say(barks, 'lowAmmo');
    }
    barkHealthWas = player.vitals.health;
    barkAmmoWas = player.weapon.ammo;

    
    const hunted = birds.some((b) => b.alive && Math.hypot(b.x - player.x, b.z - player.z) < 13);
    
    
    audio.duck(hunted || inSafe);
    
    
    
    
    roomToneLevel(inSafe);

    
    
    
    breathIn -= dt;
    if (breathIn <= 0 && !player.dead) {
      const sp = player.vitals.stamina ?? 100;
      const spent = Math.max(0, 1 - sp / 100);
      if (spent > 0.25) {
        breathSfx(spent > 0.65);
        breathIn = 1.5 - spent * 0.85;
      } else {
        breathIn = 1.2;
      }
    }

    
    nearLocker = null;
    if (!player.dead && !player.struggle) {
      for (const l of lockers) {
        if (Math.hypot(player.x - l.x, player.z - l.z) < 1.05) { nearLocker = l; break; }
      }
    }
    
    
    
    
    
    if (hidden && !nearLocker && hideSettled(hide)) {
      hide = createHide(); hideLocker = null; hideFrom = null; hidden = false;
    }
    const hint = $('hint');
    if (hint) {
      
      
      hint.style.display = (nearLocker || hidden) ? 'block' : (hintShown ? 'block' : 'none');
      if (nearLocker || hidden) hint.innerHTML = hidden ? '<kbd>E</kbd> come out' : '<kbd>E</kbd> hide';
      else if (hintShown) hint.innerHTML = HINT_HTML;
    }
    if (hidden) {
      
      player.x = nearLocker.x;
      player.z = nearLocker.z;
    }
    if (bars) bars.style.opacity = hidden ? '1' : '0';

    
    if (isBoss && boulder && fight) {
      const bp = deck.boulder;
      let y = bp.y;
      if (fight.boulder === 'falling') {
        
        const u = fight.boulderT / 0.42;
        y = bp.y - (bp.y - 0.9) * u * u;
      } else if (fight.boulder === 'landed') {
        y = 0.9;
      } else if (fight.boulder === 'rewinding') {
        y = 0.9 + (bp.y - 0.9) * Math.min(1, fight.boulderT / BOSS_HORSE.rewind);
      }
      boulder.position.y = y;
      boulder.rotation.set(now * 0.3, now * 0.21, 0);
      if (cable) {
        const cp = cable.geometry.attributes.position;
        cp.setXYZ(1, bp.x, y + 0.9, bp.z);
        cp.needsUpdate = true;
        cable.visible = fight.boulder === 'hung' || fight.boulder === 'rewinding';
      }
    }
    if (bossWonIn > 0) {
      bossWonIn -= dt;
      if (bossWonIn <= 0) { hud.won(); feh_track('run_win', { deck: level }); }
    }

    
    
    
    
    
    
    
    
    
    if (pendingPickup && reachT >= REACH_TIME * 0.5) {
      const it = pendingPickup;
      pendingPickup = null;
      it.mesh.visible = false;
      if (it.ammo) player.weapon.ammo += 24;
      
      
      
      
      
      else if (it.medkit) player.vitals.health = MAX_HEALTH;
      else player.vitals.health = Math.min(MAX_HEALTH, player.vitals.health + 35);
      liftChime();
    }
    for (const it of pickups) {
      if (it.taken) continue;
      
      
      
      
      it.mesh.rotation.y = now * (it.spin ?? 1.1);
      it.mesh.position.y = (it.baseY ?? 0.15) + Math.sin(now * 2.2) * (it.bob ?? 0.03);
      
      
      
      
      
      
      if (!player.dead && !player.struggle && reachT >= REACH_TIME
          && Math.hypot(player.x - it.x, player.z - it.z) < 0.9) {
        it.taken = true;
        reachT = 0;
        pendingPickup = it;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const wasSafe = inSafe;
    inSafe = !player.dead && safeRoom
      && player.x > safeRoom.x0 && player.x < safeRoom.x1
      && player.z > safeRoom.z0 && player.z < safeRoom.z1;
    if (inSafe !== wasSafe) {
      hud.msg(inSafe ? 'SAFE' : '');
      if (inSafe) {
        liftChime();
        
        
        say(barks, 'safe');
      }
    }
    
    
    
    
    
    
    {
      
      
      
      
      
      
      const canRest = !player.dead && !player.struggle
        && !moving && !turning && !fireHeld && !hidden;
      const sp = player.vitals.stamina ?? 100;
      if (sp <= 1) blown = true;
      if (sp > 35 || !canRest) blown = false;
      const wantRest = canRest && (inSafe || blown);
      if (wantRest) safeIdle += dt; else safeIdle = 0;
      
      if (safeIdle > (blown ? 0.15 : REST_AFTER)) resting = true;
      if (!wantRest) resting = false;
      const RT = 1.45;
      restT = Math.max(0, Math.min(RT, restT + (resting ? dt : -dt * 1.6)));
      restNow = restT > 0 ? { k: restT / RT, seated: restT >= RT } : null;
    }
    if (inSafe) {
      player.vitals.health = Math.min(MAX_HEALTH, player.vitals.health + 5.5 * dt);
      if (!safeResupplied) {
        safeResupplied = true;
        player.weapon.ammo += 30;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    {
      const nearLib = !!library && !player.dead
        && Math.hypot(player.x - library.x, player.z - library.z) < 1.6;
      nearBench = !!workbench && !player.dead
        && Math.hypot(player.x - workbench.x, player.z - workbench.z) < 1.7;
      if (nearLib !== nearLibrary) {
        nearLibrary = nearLib;
        hud.lore(nearLib ? chapterFor(level) : null);
      }
    }

    
    
    
    
    
    
    
    
    
    if (liftCar && !player.dead) {
      const near = Math.hypot(player.x - liftCar.x, player.z - liftCar.z) < LIFT.callRadius;
      const inCar = insideCar(liftCar, player.x, player.z, 0.35);
      const was = ride.phase;
      ride = stepLift(ride, dt, { near, inside: inCar });
      
      
      
      
      
      
      
      
      if (sinceArrive >= 0) {
        sinceArrive += dt;
        if (ride.phase === 'clear' || ride.phase === 'idle') sinceArrive = -1;
        else if (sinceArrive > (LIFT.settle + LIFT.doorTime) * 2 + 1) {
          ride = { ...ride, phase: 'clear', t: 0, door: 1, sealed: false, event: 'ready' };
          liftForced += 1;
          sinceArrive = -1;
        }
      }

      
      
      
      
      
      
      
      
      
      
      
      
      if (was !== 'closing' && ride.phase === 'closing') {
        for (const b of birds) {
          b.alive = false;
          b.latched = false;
          if (b.mesh) b.mesh.visible = false;
          if (b.flame) b.flame.visible = false;
          b.burn = null;
        }
        player.latchedBy = null;
        player.struggle = null;
      }
      if (ride.event === 'open') { liftChime(); hud.msg('LIFT'); }
      else if (ride.event === 'shut') { doorSfx(false); hud.msg(''); }
      else if (ride.event === 'arrive') { sinceArrive = 0; }
      else if (ride.event === 'ready') {
        
        
        
        const el = document.getElementById('deckCard');
        if (el) el.textContent = `DECK ${level}`;
        deckCardT = 3.4;
        sinceArrive = -1;
      }
      else if (ride.event === 'depart') {
        
        
        
        level += 1;
        
        
        saveProgress({ deck: level });
        feh_track('deck_reached', { deck: level, act: actFor(level) });
        buildWorld(level);
        
        
        
        
        
        
        
        placeCar(deck.bays[0]);
        player.x = liftCar.x; player.z = liftCar.z;
        
        
        player.yaw = Math.atan2(-liftCar.face.x, liftCar.face.z);
        camNode = nodeAt(rails, progressAt(deck, player.x, player.z));
        
        
        
        
        hide = createHide(); hideLocker = null; hideFrom = null;
        hidden = false;
        inSafe = false;
        
        
        player.weapon = readyWeapon('boltDriver', { ammo: 48 });
        safeResupplied = false;
        hud.lift(level);
        liftHum(true);
        
        
        say(barks, 'lift');
      } else if (ride.event === 'arrive') {
        liftHum(false);
        
        
        
        if (!sfxSheet.play('liftChime', { gain: 0.9 })) {  }
        doorSfx(true);
      }
      else if (ride.event === 'ready') { hud.lift(0); hud.msg(''); }
      
      
      
      
      
      
      
      
      if (ride.phase === 'idle' && liftCar && liftCar.kind === 'arrival') {
        placeCar(deck.bays[1]);
        if (sealedDoors) sealedDoors.visible = true;
      }
      
      if (liftLamp && liftCar) {
        const nearLift = Math.hypot(player.x - liftCar.x, player.z - liftCar.z) < LIFT.callRadius;
        liftLamp.color.setHex(nearLift ? 0x9df5d9 : 0x2a4a3e);
      }
      if (was === 'idle' && ride.phase === 'opening') doorSfx(true);

      
      
      if (liftDoors) {
        for (const d of liftDoors) {
          d.position.x = d.userData.homeX + d.userData.side * ride.door * (LIFT.width / 2);
        }
      }

      
      
      
      
      
      
      
      
      if (ride.sealed) {
        const lc = carLocal(liftCar, player.x, player.z);
        const u = clamp(lc.u, -(LIFT.depth / 2 - 0.35), LIFT.depth / 2 - 0.35);
        const v = clamp(lc.v, -(LIFT.width / 2 - 0.35), LIFT.width / 2 - 0.35);
        const w = carWorld(liftCar, u, v);
        player.x = w.x; player.z = w.z;
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    {
      const fx = place.target.x - place.eye.x;
      const fz = place.target.z - place.eye.z;
      const fm = Math.hypot(fx, fz) || 1;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      let cullR = 2.9;
      if (camera.fov > 70) {
        const dh = HALL_H - place.eye.y;
        const pitch = Math.atan2(place.eye.y - place.target.y, fm);
        const halfV = (camera.fov * Math.PI / 180) / 2;
        const cone = halfV - pitch;
        const dNear = cone > 0.05 ? dh / Math.tan(cone) : 0;
        cullR = Math.max(2.9, dNear + 2.2);
      }
      for (const c of ceilingPieces) {
        const ox = c.position.x - place.eye.x;
        const oz = c.position.z - place.eye.z;
        const ahead = (ox * fx + oz * fz) / fm;
        const flat = Math.hypot(ox, oz);
        c.visible = !(flat < cullR || (ahead < 1.1 && flat < cullR + 0.5));
      }
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

    if (mapCv) {
      
      
      const mb = Math.atan2(-(place.target.x - place.eye.x), place.target.z - place.eye.z);
      
      
      
      
      drawMap(mapCv, player, birds, EXIT, level, deck, mb, mapRise(ride, MAP.deckGap));
    }

    renderer.render(scene, camera);
    frameCount += 1;
    shotFlash = Math.max(0, shotFlash - dt);
    
    
    const flashK = flashScale(access);
    hud.paint({
      health: player.vitals.health,
      maxHealth: MAX_HEALTH,
      stamina: player.vitals.stamina,
      struggle: player.struggle,
      lastInput,
      alive: !player.dead,
      
      
      
      
      
      
      
      
      
      
      
      
      remaining: birds.filter((b) => b.alive && b.anim
        && b.anim.state !== 'dormant' && !(b.fatigue && b.fatigue.gaveUp)).length,
      ammo: player.weapon.ammo,
      range: Math.round(player.weapon.spec?.range ?? 0),
      
      
      
      
      
      
      
      
      
      
      ep: Math.max(0, 100 - gateMeshes.filter((m) => m.opened).length * 9
        - Math.min(30, (level - 1) * 3)),
      deckNo: level,
      flash: shotFlash > 0 && flashK > 0.3 && (now - lastFlashAt) >= flashGap(access),
      bark: currentBark(barks),
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  
  {
    const el = (id) => document.getElementById(id);
    const setPaused = (on) => {
      
      
      if (on && (intro && !intro.done)) return;
      if (on && player.dead) return;
      paused = !!on;
      const p = el('pause');
      if (p) p.style.display = paused ? 'flex' : 'none';
      document.body.classList.toggle('modalOpen', paused);
      if (paused) {
        const w = el('pauseWhere');
        if (w) w.textContent = `DECK ${level}`;
        const st = el('saveState');
        const existing = readLocalSave();
        if (st) st.textContent = existing ? `Last save: ${describeSave(existing, Date.now())}` : 'No save yet.';
        
        
        
        const cl = el('saveCloud');
        if (cl) {
          cl.textContent = 'Checking your account…';
          cloudWho().then((who) => {
            cl.textContent = who
              ? `Signed in as ${who} — saves also go to your account.`
              : 'Saved on this browser only. Sign up on magesticanstudios.com to keep your save if you clear your browser or switch device.';
          }).catch(() => { cl.textContent = 'Saved on this browser only.'; });
        }
      }
    };
    el('resumeBtn')?.addEventListener('click', () => setPaused(false));
    el('pause')?.addEventListener('click', (e) => { if (e.target === el('pause')) setPaused(false); });
    el('saveBtn')?.addEventListener('click', async () => {
      const btn = el('saveBtn');
      const st = el('saveState');
      if (btn) btn.disabled = true;
      const save = makeSave(runState(), Date.now());
      const okLocal = writeLocalSave(save);
      
      
      saveProgress({ deck: save.deck, seenIntro: true });
      if (st) st.textContent = okLocal ? 'Saved on this browser…' : 'This browser refused to store the save.';
      if (okLocal) {
        const up = await cloudPush(save);
        if (st) {
          st.textContent = up
            ? `Saved — ${describeSave(save, Date.now())} — and copied to your account.`
            : `Saved — ${describeSave(save, Date.now())} — on this browser.`;
        }
        feh_track('game_saved', { deck: save.deck, cloud: up });
      }
      if (btn) btn.disabled = false;
    });
    
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' && e.code !== 'KeyP') return;
      if (intro && !intro.done) return;      
      e.preventDefault();
      setPaused(!paused);
    });
    
    
    window.addEventListener('blur', () => { if (!player.dead) setPaused(true); });
    api_setPaused = setPaused;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  return {
    beginIntro,
    
    
    progress: () => loadProgress(),
    markIntroSeen: () => saveProgress({ seenIntro: true }),
    
    
    
    loadSave(raw) {
      const save = normaliseSave(raw);
      if (!save) return null;
      level = Math.max(1, save.deck);
      buildWorld(level);
      
      
      
      
      if (insideLevel(deck, save.x, save.z, 0.3)) {
        player.x = save.x; player.z = save.z; player.yaw = save.yaw;
      } else {
        player.x = deck.start.x; player.z = deck.start.z;
      }
      player.vitals.health = Math.max(1, save.health);
      if (player.vitals.stamina !== undefined) player.vitals.stamina = save.stamina;
      if (save.weapon) {
        try { player.weapon = readyWeapon(save.weapon, { ammo: save.ammo }); } catch {  }
      }
      
      player.latchedBy = null; player.struggle = null;
      for (const b of birds) b.latched = false;
      saveProgress({ deck: level, seenIntro: true });
      return level;
    },
    resumeAt(deck) {
      const n = Math.max(1, Math.floor(deck) || 1);
      level = n;
      buildWorld(n);
      
      
      player.x = deck.start.x;
      player.z = deck.start.z;
      player.vitals.health = MAX_HEALTH;
      saveProgress({ deck: n });
      return level;
    },
    
    setAccess(patch) {
      access = resolveAccess({ ...access, ...patch }, { prefersReducedMotion: !!calm });
      saveAccess(access);
      applyAccess();
      return { ...access };
    },
    getAccess() { return { ...access }; },
    introActive: () => !!(intro && !intro.done),
    player, birds, touch, faces, head: xHead, neck,
    
    
    
    
    get lockers() { return lockers; },
    get safeRoom() { return safeRoom; },
    get deck() { return deck; },
    debug: {
      get hidden() { return hidden; },
      get inSafe() { return inSafe; },
      get nearLocker() { return !!nearLocker; },
      get pickups() { return pickups.filter((q) => !q.taken).length; },
      goTo(x, z) { player.x = x; player.z = z; },
      get level() { return level; },
      
      
      
      
      
      get deck() {
        return {
          start: deck.start, exit: deck.exit, bays: deck.bays,
          runs: deck.runs.map((r) => ({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 })),
        };
      },
      
      
      
      
      
      get cameraEye() { return { ...camEye }; },
      get cameraTarget() { return { ...camTarget }; },
      
      
      
      get medkit() {
        const it = pickups.find((q) => q.medkit);
        return it ? { x: it.x, z: it.z, taken: it.taken } : null;
      },
      get library() { return library ? { ...library, near: nearLibrary } : null; },
      
      
      
      giveWeapon(wid, ammo) { player.weapon = readyWeapon(wid, { ammo: ammo ?? 48 }); return player.weapon.id; },
      creatureStatus(i) {
        const b = birds[i];
        return b && b.creature ? { ...statusOf(b.creature), burn: b.burn ? { ...b.burn } : null } : null;
      },
      get workbench() {
        return workbench ? {
          x: workbench.x, z: workbench.z, near: nearBench,
          offers: benchOffers(bench), carried: player.weapon.id,
        } : null;
      },
      
      
      
      
      get fireState() {
        return {
          fireHeld,
          hidden,
          dead: player.dead,
          struggling: !!player.struggle,
          ammo: player.weapon.ammo,
          cooldown: player.weapon.cooldown,
          canFire: canFire(player.weapon),
          fireT,
        };
      },
      
      
      
      get liftCar() { return liftCar ? { ...liftCar } : null; },
      clearOfCar(x, z) { return liftCar ? clearOfCar(liftCar, x, z, 0.2) : true; },
      
      
      
      
      
      
      
      get sfxSheet() {
        return {
          ready: sfxSheet.ready,
          failure: sfxSheet.failure,
          played: sfxSheet.played,
          byEffect: sfxSheet.byEffect,
        };
      },
      
      
      voice(b, kind) {
        if (!b) return 'no creature';
        const fn = b.kind === 'chicken' ? chickVoice : porkVoice;
        fn(b, kind, Math.hypot(b.x - player.x, b.z - player.z));
        return 'called';
      },
      
      
      
      whyVoice(b, kind) {
        if (!b) return { ok: false, why: 'no creature' };
        const table = SHEET_VOICE[b.kind] || SHEET_VOICE.chicken;
        return {
          ok: sheetVoice(b, kind),
          kind: b.kind,
          effect: table[kind] || null,
          hasNode: !!audio.at(b.x, b.z),
          sheetReady: sfxSheet.ready,
          audioRunning: audio.running,
          knownEffects: sfxSheet.effectNames,
          dist: Math.hypot(b.x - player.x, b.z - player.z),
        };
      },
      get wires() {
        let nearest = Infinity;
        for (const w of wires) {
          nearest = Math.min(nearest, Math.hypot(w.tip[0] - player.x, w.tip[2] - player.z));
        }
        return { count: wires.length, nearest: Number.isFinite(nearest) ? nearest : null };
      },
      get sparks() { return { ...sparkStats }; },
      
      
      sparkNow() {
        let best = null; let bd = Infinity;
        for (const w of wires) {
          const d = Math.hypot(w.tip[0] - player.x, w.tip[2] - player.z);
          if (d < bd) { bd = d; best = w; }
        }
        if (!best) return null;
        sparkAt(best.tip);
        sparkFlash = 0.34;
        sparkSfx(best.tip[0], best.tip[2]);
        return { at: [...best.tip], dist: bd };
      },
      
      
      freshCreature(kind) { return spawnCreature(kind); },
      
      
      
      
      
      
      maim(kind, limb = 'leg-l') {
        const b = birds.find((q) => q.alive && q.kind === kind && q.creature);
        if (!b || !b.creature.limbs[limb]) return null;
        b.creature.limbs[limb].integrity = 0;
        b.creature.limbs[limb].severed = true;
        return statusOf(b.creature);
      },
      
      
      
      
      staggerNow(kind, amount = 1, dir = Math.PI) {
        const b = birds.find((q) => q.alive && q.kind === kind && q.anim);
        if (!b) return null;
        b.anim = staggerHit(b.anim, amount, dir);
        return { staggerT: b.anim.staggerT, staggerAmt: b.anim.staggerAmt };
      },
      
      
      animOf(kind) {
        const b = birds.find((q) => q.alive && q.kind === kind && q.anim);
        return b ? { ...b.anim, gallopGait: b.gallopGait } : null;
      },
      
      
      
      settleNow() { return settleSfx(player.x + 4, player.z + 6); },
      
      
      
      
      
      
      
      facingOf(b) {
        if (!b || !b.mesh) return null;
        b.mesh.updateMatrixWorld(true);
        const m = b.mesh.matrixWorld.elements;
        
        const axis = (i) => ({ x: m[i * 4], y: m[i * 4 + 1], z: m[i * 4 + 2] });
        const dx = player.x - b.x; const dz = player.z - b.z;
        const len = Math.hypot(dx, dz) || 1;
        const toPlayer = { x: dx / len, z: dz / len };
        const dot = (a) => {
          const l = Math.hypot(a.x, a.z) || 1;
          return (a.x / l) * toPlayer.x + (a.z / l) * toPlayer.z;
        };
        return {
          toPlayer,
          localX: axis(0),
          localY: axis(1),
          localZ: axis(2),
          dotX: dot(axis(0)),
          dotY: dot(axis(1)),
          dotZ: dot(axis(2)),
          rotZ: b.mesh.rotation.z,
        };
      },
      
      
      
      holdFlash(on) {
        flashHeld = !!on;
        if (!on && mat && mat.uniforms.uFlash) mat.uniforms.uFlash.value = 0;
      },
      get flashTicks() { return flashTicks; },
      get dim() { return mat && mat.uniforms.uDim ? mat.uniforms.uDim.value : 1; },
      
      
      toProp() {
        let best = null; let bd = Infinity;
        for (const p of props) {
          const d = Math.hypot(p.x - player.x, p.z - player.z);
          if (d < bd) { bd = d; best = p; }
        }
        if (!best) return null;
        
        
        
        
        
        
        
        
        
        for (let i = 0; i < 16; i += 1) {
          const a = (i / 16) * Math.PI * 2;
          const px = best.x + Math.sin(a) * 1.5;
          const pz = best.z + Math.cos(a) * 1.5;
          if (!insideLevel(deck, px, pz, 0.45)) continue;
          if (!clearOfProps(solidProps, px, pz)) continue;
          player.x = px; player.z = pz;
          return { x: best.x, z: best.z, from: { x: px, z: pz }, was: bd };
        }
        return null;
      },
      
      
      step(dx, dz) {
        const m = moveInLevel(deck, player, dx, dz, 0.4, solidProps);
        player.x = m.x; player.z = m.z;
        return { x: m.x, z: m.z };
      },
      clearOfProp(x, z) { return clearOfProps(solidProps, x, z); },
      get props() {
        return {
          count: props.length,
          solid: solidProps.length,
          litShadows: props.filter((p) => p.mat.opacity > 0.01).length,
        };
      },
      
      
      
      
      
      
      poseShot() {
        const yaw = player.yaw;
        const dx = -Math.sin(yaw); const dz = Math.cos(yaw);
        const from = [player.x + dx * 0.34, 1.16, player.z + dz * 0.34];
        const to = [player.x + dx * 6, 1.06, player.z + dz * 6];
        if (tracers) { tracers.fire(from, to); tracers.freeze(40); }
        if (ricochets) ricochets.burst(to[0], to[1], to[2], { x: dx, z: dz }, { x: -dx, z: -dz });
        return { from, to };
      },
      get shots() { return { ...shotStats }; },
      
      
      shootWall() {
        shotStats.forcedAt = null;
        const range = player.weapon.spec?.range ?? 18;
        for (const yaw of [player.yaw, player.yaw + 1.57, player.yaw + 3.14, player.yaw + 4.71]) {
          const dx = -Math.sin(yaw); const dz = Math.cos(yaw);
          for (let d2 = 0.4; d2 < range; d2 += 0.22) {
            if (!insideLevel(deck, player.x + dx * d2, player.z + dz * d2, 0.02)) {
              player.yaw = yaw;
              shotStats.forcedAt = d2;
              return { yaw, dist: d2 };
            }
          }
        }
        return null;
      },
      get hide() {
        return {
          phase: hide.phase, door: hide.door, step: hide.step,
          protectedNow: hideProtects(hide), draws: hideDrawsPlayer(hide),
        };
      },
      
      
      hideNow() {
        let best = null; let bd = Infinity;
        for (const l of lockers) {
          const d = Math.hypot(l.x - player.x, l.z - player.z);
          if (d < bd) { bd = d; best = l; }
        }
        if (!best) return null;
        player.x = best.x; player.z = best.z;
        hideLocker = best; hideWant = true;
        return { x: best.x, z: best.z };
      },
      unhideNow() { hideWant = true; return hide.phase; },
      
      
      
      
      
      snapCamera() {
        camNode = nodeAt(rails, progressAt(deck, player.x, player.z));
        return camNode;
      },
      get mumble() { return { count: mumbleCount, playing: !!mumbleStop }; },
      get gunVisible() { return gun.visible; },
      get injury() { return injuryDbg; },
      get liftForced() { return liftForced; },
      beginEntrance(i, species) { return beginEntrance(i, species); },
      
      
      
      clearOpeningPending() { const n = openingPending.length; openingPending = []; return n; },
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      forceStruggle(verb) {
        
        
        
        
        
        
        
        
        
        let b = birds.find((q) => q.alive && q.kind !== 'horse');
        if (!b) {
          b = birds.find((q) => q.kind !== 'horse' && q.mesh);
          if (!b) return null;
          b.alive = true;
          b.dying = undefined;
          if (b.mesh) b.mesh.visible = true;
          b.x = player.x; b.z = player.z + 0.8;
        }
        b.latched = true;
        b.cool = 0;
        player.latchedBy = b;
        player.struggle = createStruggle({
          verb: verb || 'mash',
          mode: struggleMode(access, 'reduced'),
        });
        return player.struggle.verb;
      },
      get paused() { return paused; },
      setPaused(on) { if (api_setPaused) api_setPaused(on); return paused; },
      saveNow() {
        const save = makeSave(runState(), Date.now());
        writeLocalSave(save);
        return save;
      },
      readSave() { return readLocalSave(); },
      get frames() { return frameCount; },
      get render() {
        const i = renderer.info;
        return {
          tris: i.render.triangles,
          calls: i.render.calls,
          geometries: i.memory.geometries,
          textures: i.memory.textures,
        };
      },
      get opening() {
        return openingPending.map((op) => ({
          species: op.species,
          kind: op.gate.kind,
          fromStart: +Math.hypot(op.gate.x - deck.start.x, op.gate.z - deck.start.z).toFixed(1),
        }));
      },
      get litter() { return debrisPool.filter((d) => d.live && d.settled).length; },
      camFov() { return camera.fov; },
      ceilVis() { let v = 0; for (const c of ceilingPieces) if (c.visible) v += 1; return { visible: v, total: ceilingPieces.length }; },
      get director() {
        return director ? { budget: director.budget, fired: director.fired, cooldown: +director.cooldown.toFixed(1) } : null;
      },
      get entrances() {
        return entrances.map((en) => ({
          kind: en.gm.gate.kind, phase: en.e.phase, k: +(en.e.k || 0).toFixed(2),
          bx: +en.b.x.toFixed(2), bz: +en.b.z.toFixed(2), entering: !!en.b.entering,
        }));
      },
      get gates() {
        return gateMeshes.map((m) => ({
          kind: m.gate.kind, x: +m.gate.x.toFixed(2), z: +m.gate.z.toFixed(2),
          nx: m.gate.nx, nz: m.gate.nz, drawn: !!m.group,
        }));
      },
      get deckCard() {
        const el = document.getElementById('deckCard');
        return { text: el ? el.textContent : '', opacity: el ? +(el.style.opacity || 0) : 0 };
      },
      get danger() {
        return {
          danger: isDanger(player.vitals.health, MAX_HEALTH),
          stumbling: stumbleT >= 0,
          walked: +walkedTotal.toFixed(2),
          nextStumble: +stumbleAt.toFixed(2),
        };
      },
      get intro() {
        if (intro) {
          return {
            shot: INTRO_SHOTS[intro.shot].id, t: +intro.t.toFixed(2),
            tShot: +intro.tShot.toFixed(2), leaving: intro.leaving, done: false,
          };
        }
        return introDone ? { done: true } : null;
      },
      
      
      introJump(shotId) {
        if (!intro) return false;
        const idx = INTRO_SHOTS.findIndex((sh) => sh.id === shotId);
        if (idx < 0) return false;
        intro = { ...intro, shot: idx, tShot: 0, fired: 0 };
        routeIntroCue({ kind: 'shotStart', shotId });
        return true;
      },
      get aim() { return { up: aimLatch.up, u: +aimLatch.u.toFixed(3), target: !!target, armsShown: walkArmsShown }; },
      get vox() {
        return {
          ready: voxSheet.ready, failure: voxSheet.failure,
          played: voxSheet.played, lastId: voxSheet.lastId,
        };
      },
      
      
      
      
      
      holdPA(seconds) { paIn = seconds; return paIn; },
      get gunSfx() { return { ...gunSfx }; },
      
      
      emptyGun() { player.weapon.ammo = 0; },
      get camBasis() {
        const f = { x: camTarget.x - camEye.x, z: camTarget.z - camEye.z };
        const m = Math.hypot(f.x, f.z) || 1;
        return { fx: f.x / m, fz: f.z / m, rx: -f.z / m, rz: f.x / m };
      },
      
      
      toLift() {
        if (liftCar) { player.x = liftCar.x; player.z = liftCar.z; }
        else { player.x = EXIT.x; player.z = EXIT.z; }
      },
      
      
      
      
      buildDeck(n) { level = n; buildWorld(n); return level; },
      get ride() {
        return {
          phase: ride.phase, door: ride.door, rise: ride.rise, sealed: ride.sealed,
        };
      },
      
      
      
      get audio() { return audio; },
      
      
      
      
      
      get tape() {
        return { audible: tape.audible, side: tape.sideName, title: tape.title };
      },
      get steps() { return stepCount; },
      
      
      
      
      
      
      get hits() { return hitCount; },
      
      
      
      
      get pa() { return paCount; },
      firePA() { tannoy(); },
      
      
      
      
      
      get barks() {
        const c = currentBark(barks);
        return {
          current: c ? { ...c } : null,
          saidCount: barks.said.size,
          
          
          
          t: barks.t,
          quietUntil: barks.quietUntil,
        };
      },
      sayNow(trigger) {
        return trigger === 'pa'
          ? say(barks, null, { who: 'pa', force: true })
          : say(barks, trigger, { force: true });
      },
      get lights() {
        let lit = 0;
        for (const st of strips) if (st.mat && st.mat.uniforms && st.mat.uniforms.uAlpha) {
          if (st.mat.uniforms.uAlpha.value < 0.98) lit += 1;
        }
        return { total: strips.length, dimmed: lit };
      },
      
      
      toPickup() {
        const it = pickups.find((q) => !q.taken);
        if (!it) return null;
        player.x = it.x; player.z = it.z;
        return { ammo: it.ammo };
      },
      
      
      
      
      testShot() {
        const b = birds.find((q) => q.alive && q.creature);
        if (!b) return null;
        const dx = player.x - b.x; const dz = player.z - b.z;
        const dist = Math.hypot(dx, dz);
        const fx = dx / dist; const fz = dz / dist;
        const rx = fz; const rz = -fx;
        const bh = { porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[b.kind] ?? CHICKEN_H;
        const toLocal = (wx, wy, wz) => {
          const ox = wx - b.x; const oz = wz - b.z;
          return {
            x: (ox * rx + oz * rz) / bh,
            y: wy / bh,
            z: (ox * fx + oz * fz) / bh,
          };
        };
        const side = ((player.x - b.x) * rx + (player.z - b.z) * rz) >= 0 ? 1 : -1;
        const lx = b.x + rx * side * 0.062 * bh;
        const lz = b.z + rz * side * 0.062 * bh;
        const aimYaw = Math.atan2(-(b.x - player.x), b.z - player.z);
        const legYaw = Math.atan2(-(lx - player.x), lz - player.z);
        const from = toLocal(player.x, 0.62, player.z);
        
        
        const shot = (mz, aimAt, yaw) => {
          const f2 = toLocal(player.x, mz, player.z);
          const t2 = toLocal(
            player.x - Math.sin(yaw) * dist * 1.8,
            mz + (aimAt * bh - mz) * 1.8,
            player.z + Math.cos(yaw) * dist * 1.8,
          );
          return { from: f2, to: t2, hit: resolveHit(b.creature, f2, t2) };
        };
        const high = shot(1.30, 0.50, aimYaw);
        const low = shot(0.62, 0.14, legYaw);
        return {
          kind: b.kind, dist, bh, from, to: low.to,
          high: high.hit, low: low.hit,
          keysQ: keys.has('KeyQ'),
          hit: low.hit,
          
          
          
          limbs: Object.values(b.creature.limbs).map((l) => [l.id, l.integrity, l.severed]),
        };
      },
      get isBoss() { return isBoss; },
      get fight() { return fight; },
      get horseSpeed() { return bossHorseSpeed; },
      
      
      
      
      
      
      
      
      
      exhaustBoss() {
        if (!fight) return;
        fight.fatigue.value = 100;
        fight.fatigue.gaveUp = true;
        fight.fatigue.givenUpFor = BOSS_HORSE.giveUpSeconds;
      },
      
      setStudio(o) { studio = o; },
      get studio() { return studio; },
      
      
      
      
      
      
      kickNow() { kickT = 0; },
      flinchNow() { flinchT = 0; },
      reachNow() { reachT = 0; },
      get kickT() { return kickT; },
      get flinchT() { return flinchT; },
      get reachT() { return reachT; },
      get walkPhase() { return walkPhase; },
      get pendingPickup() { return !!pendingPickup; },
      
      
      
      get pickupItems() {
        return pickups.map((q) => ({
          x: q.x, z: q.z, taken: q.taken, medkit: !!q.medkit, ammo: !!q.ammo,
        }));
      },
      
      
      get poseLean() { return xTilt.rotation.x; },
      
      
      
      
      get poseFeet() { return lastPosedFeet; },
      get startStep() { return { dist: +startDist.toFixed(3), phase: +startPhase.toFixed(3) }; },
      
      
      
      
      say(trigger) { const l = say(barks, trigger, { force: true }); return l ? l.id : null; },
      get access() { return { ...access, shake: shakeScale(access), flash: flashScale(access) }; },
      get body() {
        return {
          talking: talkT >= 0, fidget: fidgetT >= 0 ? fidgetWhich : -1,
          still: +stillFor.toFixed(1),
          roll: +xTilt.rotation.z.toFixed(4), flinchSide,
        };
      },
      get rest() {
        return {
          safeIdle: +safeIdle.toFixed(2), resting,
          k: restNow ? +restNow.k.toFixed(2) : 0, seated: !!(restNow && restNow.seated),
          blown,
        };
      },
      get bobY() { return xRig.position.y; },
      
      
      
      
      
      
      
      
      
      
      
      
      get facing() {
        const v = new THREE.Vector3(1, 0, 0);
        xander.updateWorldMatrix(true, false);
        v.applyQuaternion(xander.getWorldQuaternion(new THREE.Quaternion()));
        return {
          mesh: [v.x, v.z],
          rule: [-Math.sin(player.yaw), Math.cos(player.yaw)],
          yaw: player.yaw,
        };
      },
    },
  };
}

export { promptFor };













const $ = (id) => document.getElementById(id);









let tone = null;





























let silentEl = null;


function silentWavDataUrl() {
  const samples = 1024;
  const bytes = 44 + samples * 2;
  const b = new Uint8Array(bytes);
  const view = new DataView(b.buffer);
  const ascii = (off, str) => { for (let i = 0; i < str.length; i += 1) b[off + i] = str.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, bytes - 8, true); ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true); view.setUint32(28, 44100, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, samples * 2, true);
  let bin = '';
  for (let i = 0; i < bytes; i += 1) bin += String.fromCharCode(b[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

function startSilentKeepAlive() {
  if (silentEl) return;
  try {
    const el = document.createElement('audio');
    el.loop = true;
    
    
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.volume = 0;
    el.src = silentWavDataUrl();
    el.play().catch(() => {  });
    silentEl = el;
  } catch {  }
}

function installAudioUnlock() {
  const unlock = () => {
    const ctx = audio.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    
    try {
      const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {  }
    startSilentKeepAlive();
  };
  for (const t of ['pointerdown', 'touchend', 'keydown', 'click']) {
    window.addEventListener(t, unlock, true);
  }
  const wake = () => {
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    if (silentEl && silentEl.paused) silentEl.play().catch(() => {});
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('focus', wake);
  window.addEventListener('pageshow', wake);
}
const audio = (() => {
  let ctx = null; let music = null; let sfx = null; let verb = null; let verbIn = null;
  
  
  const ear = { px: 0, pz: 0, cx: 0, cz: -1, fx: 0, fz: 1 };
  return {
    get ctx() { return ctx; },
    get musicBus() { return music; },
    get sfxBus() { return sfx; },
    get ear() { return ear; },
    ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      music = ctx.createGain(); music.gain.value = 0.50; music.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.85; sfx.connect(ctx.destination);

      
      
      
      
      
      
      
      
      try {
        const ir = makeImpulse(ctx.sampleRate);
        const buf = ctx.createBuffer(2, ir.length, ctx.sampleRate);
        buf.copyToChannel(ir.left, 0);
        buf.copyToChannel(ir.right, 1);
        verb = ctx.createConvolver();
        verb.normalize = true;
        verb.buffer = buf;
        const wet = ctx.createGain(); wet.gain.value = 0.9;
        verb.connect(wet); wet.connect(sfx);
        verbIn = ctx.createGain(); verbIn.gain.value = 1;
        verbIn.connect(verb);
      } catch (e) {
        
        verb = null; verbIn = null;
      }
      return ctx;
    },

    











    at(x, z) {
      if (!ctx || !sfx) return null;
      const dist = Math.hypot(x - ear.px, z - ear.pz);
      const lv = levelAt(dist);
      if (!lv) return null;
      const air = ctx.createBiquadFilter();
      air.type = 'lowpass';
      air.frequency.value = lv.air;
      const pan = ctx.createStereoPanner
        ? ctx.createStereoPanner()
        : null;
      const dry = ctx.createGain();
      dry.gain.value = lv.gain;
      if (pan) {
        pan.pan.value = panOf({ x, z }, { x: ear.cx, z: ear.cz }, { x: ear.fx, z: ear.fz });
        air.connect(pan); pan.connect(dry);
      } else {
        air.connect(dry);
      }
      dry.connect(sfx);
      if (verbIn) {
        const send = ctx.createGain();
        send.gain.value = lv.wet * lv.gain;
        (pan || air).connect(send);
        send.connect(verbIn);
      }
      return air;
    },

    
    listen(px, pz, cam, target) {
      ear.px = px; ear.pz = pz;
      ear.cx = cam.x; ear.cz = cam.z;
      const fx = target.x - cam.x; const fz = target.z - cam.z;
      const m = Math.hypot(fx, fz) || 1;
      ear.fx = fx / m; ear.fz = fz / m;
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














let mumbleStop = null;
let lastMumbleKey = null;
let mumbleCount = 0;
function mumbleSay(text) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return 0;
  if (mumbleStop) { mumbleStop(); mumbleStop = null; }
  const { events, total } = compileMumble(text, seedOf(text));
  const t0 = ctx.currentTime + 0.03;
  const out = ctx.createGain();
  
  
  
  out.gain.value = 0.34;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 2600;
  out.connect(lp); lp.connect(audio.sfxBus);
  const nodes = [];
  for (const e of events) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(e.f0, t0 + e.at);
    
    
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, e.f0 * 0.94), t0 + e.at + e.dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0 + e.at);
    env.gain.linearRampToValueAtTime(e.amp, t0 + e.at + 0.018);
    env.gain.setValueAtTime(e.amp, t0 + e.at + e.dur * 0.7);
    env.gain.linearRampToValueAtTime(0.0001, t0 + e.at + e.dur);
    
    
    osc.connect(env);
    for (const [freq, q, gn] of [[e.f1, 8, 1.0], [e.f2, 10, 0.5]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const bg = ctx.createGain(); bg.gain.value = gn;
      env.connect(bp); bp.connect(bg); bg.connect(out);
    }
    
    if (e.burst) {
      const nb = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, Math.floor(0.02 * ctx.sampleRate), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      nb.buffer = buf;
      const ng = ctx.createGain(); ng.gain.value = 0.35 * e.amp;
      const nf = ctx.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 1200;
      nb.connect(nf); nf.connect(ng); ng.connect(out);
      nb.start(t0 + e.at); nb.stop(t0 + e.at + 0.02);
      nodes.push(nb);
    }
    osc.start(t0 + e.at);
    osc.stop(t0 + e.at + e.dur + 0.01);
    nodes.push(osc);
  }
  mumbleCount += 1;
  mumbleStop = () => {
    for (const n of nodes) { try { n.stop(); } catch {  } }
    try { out.gain.setValueAtTime(0, ctx.currentTime); } catch {  }
  };
  return total;
}




function loadAccess() {
  try { return JSON.parse(localStorage.getItem('feh.access') || 'null'); } catch { return null; }
}
function saveAccess(a) {
  try { localStorage.setItem('feh.access', JSON.stringify(a)); } catch {  }
}



















function feh_track(name, props) {
  try { trackEvent(name, { game: 'farmy-evil-hills', ...props }); } catch {  }
}

const PROGRESS_KEY = 'feh.progress';
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (!p || typeof p.deck !== 'number' || !(p.deck >= 1)) return null;
    return { deck: Math.min(99, Math.floor(p.deck)), seenIntro: !!p.seenIntro };
  } catch { return null; }
}
function saveProgress(next) {
  try {
    const was = loadProgress() || { deck: 1, seenIntro: false };
    
    
    const merged = {
      deck: Math.max(was.deck, next.deck ?? was.deck),
      seenIntro: was.seenIntro || !!next.seenIntro,
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
  } catch {  }
}

function paVoice(kind) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (sfxSheet.play('tannoy', { gain: 0.8, rate: 0.94 + Math.random() * 0.12 })) return;
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
  
  
  
  
  
  
  
  if (sfxSheet.play('kick', { gain: 1.0, rate: 0.94 + Math.random() * 0.12 })) return;
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const MANIFEST = '../assets/music/music.json';
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
      const res = await fetch(new URL(`../assets/music/${t.file}`, import.meta.url));
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
  
  
  
  msg(text) { $('msg').textContent = text || ''; },
  
  
  
  lore(ch) {
    const el = $('lore');
    if (!el) return;
    if (!ch) { el.style.display = 'none'; return; }
    $('loreTag').textContent = 'STATION ARCHIVE - RECOVERED DOCUMENT';
    $('loreTitle').textContent = ch.title;
    $('loreBody').textContent = ch.text;
    el.style.display = 'block';
  },
  dead() {
    $('overTitle').textContent = 'THE LIVESTOCK HAD OPINIONS';
    $('overBody').textContent = 'Xander does not report back.';
    $('over').style.display = 'flex';
  },
  won() {
    $('overTitle').textContent = 'HESPER-4 IS QUIET AGAIN';
    $('overBody').textContent = 'The Agency will want the paperwork before the survivors.';
    
    
    const b = $('again');
    if (b) b.textContent = 'Again, from the top';
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

    
    
    
    
    
    
    $('count').textContent = s.remaining
      ? `DECK ${s.deckNo} \u00b7 ${s.remaining} HUNTING`
      : `DECK ${s.deckNo} \u00b7 CLEAR`;
    $('flash').style.opacity = s.flash ? '0.30' : '0';

    if (s.struggle) {
      $('qte').style.display = 'block';
      $('qteFill').style.width = `${Math.min(100, s.struggle.progress * 100)}%`;
      
      
      
      
      
      
      
      
      const how = promptFor(s.struggle.verb ?? 'mash', s.lastInput ?? 'key');
      $('qteHow').textContent = how.text;
      $('qte').dataset.icon = how.icon;
      
      
      
      
      
      $('qteBtn').textContent = how.icon === 'mash' ? 'MASH'
        : (how.icon === 'dial' ? 'CIRCLE' : 'SLASH');
    } else {
      $('qte').style.display = 'none';
    }
    $('tapeMini').classList.toggle('on', tape.audible);

    
    
    
    
    const vox = document.getElementById('vox');
    if (vox) {
      if (s.bark) {
        const pa = s.bark.who === 'pa';
        
        
        vox.textContent = pa ? `[ PA ] ${s.bark.text}` : s.bark.text;
        vox.classList.toggle('pa', pa);
        vox.style.display = 'block';
      } else if (vox.textContent) {
        vox.textContent = '';
        vox.style.display = 'none';
      }
    }
  },
};

function start() {
  lockZoom();
  
  
  
  
  installAudioUnlock();
  
  
  
  
  
  
  
  
  
  
  try { sfxSheet.load(); } catch {  }
  try { voxSheet.load(); } catch {  }
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  {
    const pad = $('qtePad');
    const dot = $('qteDot');
    const toUnit = (e) => {
      const r = pad.getBoundingClientRect();
      const half = r.width / 2;
      if (!(half > 0)) return null;
      return {
        x: (e.clientX - (r.left + half)) / half,
        
        
        
        y: -(e.clientY - (r.top + r.height / 2)) / half,
      };
    };
    const showDot = (p) => {
      if (!p) { dot.style.opacity = '0'; return; }
      const r = pad.getBoundingClientRect();
      const half = r.width / 2;
      dot.style.transform = `translate(${p.x * half}px, ${-p.y * half}px)`;
      dot.style.opacity = '0.9';
    };
    let drawing = false;
    const sample = (e) => {
      const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
      if (!st) return;
      const p = toUnit(e);
      if (!p) return;
      st.point(p.x, p.y);
      showDot(p);
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      drawing = true;
      try { pad.setPointerCapture(e.pointerId); } catch {  }
      sample(e);
    });
    pad.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      e.preventDefault();
      sample(e);
    });
    const end = (e) => {
      if (!drawing) return;
      drawing = false;
      showDot(null);
      const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
      
      
      
      if (st && typeof st.release === 'function') st.release();
      if (e && e.pointerId != null) {
        try { pad.releasePointerCapture(e.pointerId); } catch {  }
      }
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('pointerleave', end);
  }

  
  
  
  
  
  
  
  try {
    const api = boot($('game'), hud);
    window.__feh = api;
    if (api) {
      let started = false;
      
      
      
      document.body.classList.add('modalOpen');
      let resumeDeck = 0;
      
      let resumeSave = null;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const go = () => {
        if (started) return;
        
        
        
        
        if (api.introActive && api.introActive()) return;
        started = true;
        $('boot').style.display = 'none';
        
        
        document.body.classList.remove('modalOpen');
        $('hint').style.display = 'block';
        
        
        
        audio.ensure();
        
        
        
        
        
        const seen = api.progress && api.progress() && api.progress().seenIntro;
        if (api.beginIntro && !seen && !resumeDeck) {
          
          
          
          
          if (api.markIntroSeen) api.markIntroSeen();
          api.beginIntro(() => { startStationAudio(); });
          return;
        }
        if (resumeSave && api.loadSave) api.loadSave(resumeSave);
        else if (resumeDeck && api.resumeAt) api.resumeAt(resumeDeck);
        startStationAudio();
      };
      
      
      
      
      
      const startStationAudio = () => {
        if (!tape.audible) {
          tape.toggle();
          $('tapeMini').classList.toggle('on', tape.audible);
          $('tapeCap').textContent = tape.sideName;
        }
        roomTone();
      };
      
      
      
      
      {
        const boxes = {
          reducedMotion: $('acReduced'), noFlash: $('acFlash'),
          holdStruggle: $('acHold'), bigText: $('acText'),
        };
        const cur = api.getAccess ? api.getAccess() : {};
        for (const k of ACCESS_KEYS) {
          const box = boxes[k];
          if (!box) continue;
          box.checked = !!cur[k];
          box.addEventListener('change', () => {
            if (api.setAccess) api.setAccess({ [k]: box.checked });
          });
        }
      }
      $('startBtn').addEventListener('click', () => { resumeDeck = 0; go(); });
      
      {
        const prog = api.progress ? api.progress() : null;
        
        
        
        
        
        let saved = null;
        try { saved = normaliseSave(localStorage.getItem(SAVE_KEY)); } catch { saved = null; }
        if (saved || (prog && prog.deck > 1)) {
          const btn = $('contBtn');
          const num = $('contDeck');
          if (btn && num) {
            num.textContent = String(saved ? saved.deck : prog.deck);
            btn.style.display = 'inline-block';
            if (saved) {
              const line = document.createElement('div');
              line.style.cssText = 'margin-top:6px;opacity:.5;font-size:11px';
              line.textContent = describeSave(saved, Date.now());
              btn.insertAdjacentElement('afterend', line);
            }
            btn.addEventListener('click', () => {
              resumeDeck = saved ? saved.deck : prog.deck;
              resumeSave = saved;
              go();
            });
          }
          const note = $('bootNote');
          
          
          
          
          if (note) {
            note.textContent = (saved || (prog && prog.seenIntro))
              ? 'BEGIN starts a new run from deck 1 · sound on'
              : 'opens with a short film · sound on · any key skips it';
          }
        }
      }
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
