









import * as THREE from 'three';
import { CHICKEN_NECK_TOP_T } from '../../../../web-engine/ps1/creatures/chicken.mjs';
import { tentacleJoints } from '../../../../web-engine/ps1/creatures/cow.mjs';
































export const CZ = { legs: { lo: 0.03, hi: 0.21 }, torso: { lo: 0.22, hi: 0.74 }, head: { lo: 0.75, hi: 0.99 } };

export const CT_H = CZ.torso.hi - CZ.torso.lo;

export const CHICK_PIVOT = {
  legL: [-0.010, -0.062, CZ.legs.hi],
  legR: [-0.010, 0.062, CZ.legs.hi],
  wingL: [-0.010, -0.240 * 0.82, CZ.torso.lo + CT_H * 0.72],
  wingR: [-0.010, 0.240 * 0.82, CZ.torso.lo + CT_H * 0.72],
  tail: [-0.190, 0, CZ.torso.lo + CT_H * 0.55],
  torso: [0, 0, (CZ.torso.lo + CZ.torso.hi) / 2],
  
  
  
  
  neck: [0.02, 0, CZ.head.lo],
  head: [0.02, 0, CZ.head.lo],
  beak: [0.02, 0, CZ.head.lo],
  comb: [0.02, 0, CZ.head.lo],
  eyeL: [0.02, 0, CZ.head.lo],
  eyeR: [0.02, 0, CZ.head.lo],
};

export const BODY_PIVOT = [0, 0, (CZ.torso.lo + CZ.torso.hi) / 2];

export const HEAD_PIVOT = [0.02, 0, CZ.head.lo];









export const PZ = { legs: { lo: 0.0, hi: 0.44 }, torso: { lo: 0.40, hi: 0.80 }, arms: { lo: 0.52, hi: 0.80 }, head: { lo: 0.80, hi: 1.0 } };

export const PORKER_RIG = {
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




export const CWZ = { legs: { lo: 0.0, hi: 0.42 }, torso: { lo: 0.38, hi: 0.86 }, udder: { lo: 0.30, hi: 0.58 }, head: { lo: 0.80, hi: 1.0 } };

export const COW_RIG = {
  bodyPivot: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
  headPivot: [-0.09, 0, CWZ.head.lo - 0.06],
  headParts: ['head', 'hornL', 'hornR', 'earL', 'earR', 'eyeL', 'eyeR'],
  legParts: ['legL', 'legR'],
  
  
  
  nest: {
    tentacleL1: 'tentacleL', tentacleL2: 'tentacleL1',
    tentacleR1: 'tentacleR', tentacleR2: 'tentacleR1',
  },
  pivots: {
    legL: [-0.010, -0.098, CWZ.legs.hi],
    legR: [-0.010, 0.098, CWZ.legs.hi],
    
    
    
    
    
    tentacleL: tentacleJoints(-1)[0],
    tentacleL1: tentacleJoints(-1)[1],
    tentacleL2: tentacleJoints(-1)[2],
    tentacleR: tentacleJoints(+1)[0],
    tentacleR1: tentacleJoints(+1)[1],
    tentacleR2: tentacleJoints(+1)[2],
    torso: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
    udder: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
    tail: [-0.02, 0, (CWZ.torso.lo + CWZ.torso.hi) / 2],
    head: [-0.09, 0, CWZ.head.lo - 0.06],
    hornL: [-0.09, 0, CWZ.head.lo - 0.06], hornR: [-0.09, 0, CWZ.head.lo - 0.06],
    earL: [-0.09, 0, CWZ.head.lo - 0.06], earR: [-0.09, 0, CWZ.head.lo - 0.06],
    eyeL: [-0.09, 0, CWZ.head.lo - 0.06], eyeR: [-0.09, 0, CWZ.head.lo - 0.06],
  },
};






export const HRZ = { legs: { lo: 0.0, hi: 0.50 }, barrel: { lo: 0.44, hi: 0.76 }, necks: { lo: 0.70, hi: 1.0 } };

export const HORSE_RIG = {
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

export const CHICKEN_RIG_CFG = {
  bodyPivot: BODY_PIVOT,
  headPivot: HEAD_PIVOT,
  
  
  
  
  headParts: ['neck', 'head', 'beak', 'comb', 'eyeL', 'eyeR'],
  legParts: ['legL', 'legR'],
  pivots: CHICK_PIVOT,
};







export const CHICK_NECK_LEN = (CZ.head.hi - CZ.head.lo) * CHICKEN_NECK_TOP_T;

export function chickenRig(parts, colourOf, targetHeight, material, cfg = CHICKEN_RIG_CFG) {
  
  
  
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
    
    
    
    
    
    
    
    
    
    
    if (p.mesh.uvs && p.mesh.uvs.length * 3 === p.mesh.positions.length * 2) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute([...p.mesh.uvs], 2));
    }
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  const NEST = cfg.nest || {};
  const deferred = [];
  for (const p of parts) {
    const pivot = cfg.pivots[p.name] || [0, 0, lo];
    const m = new THREE.Mesh(geoFor(p, pivot), material);
    named[p.name] = m;
    if (NEST[p.name]) {
      deferred.push([p.name, pivot, m]);
    } else if (LEGPARTS.has(p.name)) {
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
  
  
  
  for (const [name, pivot, m] of deferred) {
    const parentName = NEST[name];
    const parent = named[parentName];
    const pp = cfg.pivots[parentName] || [0, 0, lo];
    if (!parent) { body.add(m); continue; }
    m.position.set((pivot[0] - pp[0]) * sc, (pivot[1] - pp[1]) * sc, (pivot[2] - pp[2]) * sc);
    parent.add(m);
  }
  return { root, body, head, named, scale: sc, cfg, lo, height: targetHeight };
}







export function applyChickenPose(rig, pose) {
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
  
  
  
  const armKeyL = rig.named.wingL ? 'wingL' : (rig.named.armL ? 'armL' : 'tentacleL');
  const armKeyR = rig.named.wingR ? 'wingR' : (rig.named.armR ? 'armR' : 'tentacleR');
  const armL = rig.named[armKeyL];
  const armR = rig.named[armKeyR];
  if (armL) armL.rotation[armAxis] = -(pose.wingFlap + pose.mutantLag * 0.16);
  if (armR) armR.rotation[armAxis] = (armAxis === 'x' ? 1 : -1)
    * (pose.wingFlap * 0.86 - pose.mutantLag * 0.22);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (pose.crawl) {
    rig.body.scale.set(pose.bodySquash ?? 1, br, br);
    for (const [m, key, w] of [[armL, armKeyL, pose.wingL], [armR, armKeyR, pose.wingR]]) {
      if (!m || !w || !P[key]) continue;
      m.rotation.y = -w.reach;
      m.rotation.x = w.spread || 0;
      m.position.z = (P[key][2] - BP[2]) * rig.scale - (w.press || 0) * 0.06 * HGT;
    }
    
    
    
    
    
    
    const reach = 1 + 0.55 * (pose.neckReach || 0);
    if (rig.named.neck) {
      rig.named.neck.scale.z = reach;
      const grown = CHICK_NECK_LEN * (reach - 1) * rig.scale;
      for (const n of ['head', 'beak', 'comb', 'eyeL', 'eyeR']) {
        const m = rig.named[n];
        if (m) m.position.z = grown;
      }
    } else {
      rig.head.scale.x = 0.8 + 0.4 * (pose.neckReach || 0);
    }
  } else {
    rig.body.scale.set(1, br, br);
    
    
    
    
    
    
    
    
    const restAxis = armAxis === 'x' ? 'y' : 'x';
    for (const [m, key] of [[armL, armKeyL], [armR, armKeyR]]) {
      if (!m || !P[key]) continue;
      m.rotation[restAxis] = 0;
      m.position.z = (P[key][2] - BP[2]) * rig.scale;
    }
    if (rig.named.neck) {
      rig.named.neck.scale.z = 1;
      for (const n of ['head', 'beak', 'comb', 'eyeL', 'eyeR']) {
        const m = rig.named[n];
        if (m) m.position.z = 0;
      }
    } else if (rig.head.scale.x !== 1) {
      rig.head.scale.x = 1;
    }
  }

  
  
  
  
  
  
  
  if (pose.sway) rig.body.rotation.z += pose.sway;
  if (pose.tentacleWhip) {
    const whip = pose.tentacleWhip;
    if (rig.named.tentacleL) rig.named.tentacleL.rotation.x = whip * 0.9;
    if (rig.named.tentacleR) rig.named.tentacleR.rotation.x = -whip * 0.9;
    
    
    
    if (rig.named.tentacleL1) rig.named.tentacleL1.rotation.x = whip * 0.6;
    if (rig.named.tentacleR1) rig.named.tentacleR1.rotation.x = -whip * 0.6;
    if (rig.named.tentacleL2) rig.named.tentacleL2.rotation.x = whip * 0.35;
    if (rig.named.tentacleR2) rig.named.tentacleR2.rotation.x = -whip * 0.35;
  } else if (rig.named.tentacleL1 && rig.named.tentacleL1.rotation.x) {
    for (const n of ['tentacleL1', 'tentacleL2', 'tentacleR1', 'tentacleR2']) {
      if (rig.named[n]) rig.named[n].rotation.x = 0;
    }
  }

  
  
  
  
  
  
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







export function applyHorsePose(rig, pose, basePitch = 0) {
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







export const SEVER_PART = {
  'leg-l': 'legL', 'leg-r': 'legR',
  'wing-l': 'wingL', 'wing-r': 'wingR',
  'arm-l': 'armL', 'arm-r': 'armR',
  'tentacle-l': 'tentacleL', 'tentacle-r': 'tentacleR',
  head: 'head',
};


























export const CREATURE_FACE = Math.PI / 2;
