








































































































import { elbow, knee } from '../ps1/limbSolve.mjs';













export const SOURCE_RIG = Object.freeze({
  shoulderX: 0.101,
  shoulderZ: 0.691,
  hipX: 0.061,
  hipZ: 0.473,
  upperArm: 0.170,
  foreArm: 0.165,
  thigh: 0.262,
  shin: 0.246,
  neckZ: 0.735,
  headR: 0.118,
});















export const XANDER_RIG = Object.freeze({
  
  shoulderZ: 0.818,
  
  hipZ: 0.530,
  
  neckZ: 0.858,
  





  headZ: 0.9346,
  







  headR: 0.0594,
  
  upperArm: 0.186,
  
  foreArm: 0.146,
  
















  thigh: 0.245,
  shin: 0.288,
});

















export const XANDER_SPANS = Object.freeze({ shoulder: 0.262, hip: 0.153 });










export const XANDER_DEPTHS = Object.freeze({ chest: 0.163, waist: 0.126, pelvis: 0.145 });






























export const XANDER_SEG = Object.freeze({
  upperArm: [0.072, 0.072],
  foreArm: [0.060, 0.060],
  thigh: [0.112, 0.114],
  shin: [0.079, 0.081],
  neck: [0.070, 0.074],
});
















export const XANDER_FOOT = Object.freeze({
  long: 1.34,
  








  wide: 1.12,
  tall: 1.12,
  



















































  cuff: Object.freeze({
    rings: Object.freeze([
      Object.freeze([0.050, 0.0330]),
      Object.freeze([0.034, 0.0348]),
      Object.freeze([0.018, 0.0318]),
    ]),
    








    depth: 0.95,
    at: 0,
    

















    pitchShare: 0,
  }),
});






































































































export const XANDER_LIMB_PROFILE = Object.freeze({
  
  thigh: Object.freeze([
    Object.freeze([0.00, 0.94, 0.95, 0.14, 0.00]),  
    Object.freeze([0.32, 0.84, 0.87, 0.00, 0.00]),  
    Object.freeze([0.72, 0.68, 0.74, -0.12, 0.00]), 
    Object.freeze([1.00, 0.58, 0.62, -0.06, 0.00]), 
  ]),
  shin: Object.freeze([
    Object.freeze([0.00, 0.85, 0.83, -0.10, 0.00]), 
    Object.freeze([0.14, 0.90, 0.88, 0.20, 0.00]),  
    Object.freeze([0.30, 1.00, 0.97, 0.40, 0.14]),  
    Object.freeze([0.55, 0.84, 0.83, 0.22, 0.10]),  
    Object.freeze([0.91, 0.54, 0.56, 0.03, 0.02]),  
    
    
    
    
    
  ]),
});
























export function xanderJoints(list) {
  const out = [];
  for (const j of list) {
    if (/^ankle\d$/.test(j.part)) continue;
    out.push(/^knee\d$/.test(j.part) ? { ...j, r: j.r * (0.50 / 0.64) } : j);
  }
  return out;
}














export const FOOT_LEVER = Object.freeze({
  toe: 0.062 * 1.34,
  heel: 0.042 * 1.34,
});





















export const GIRDLE_TURN = Object.freeze({ shoulder: 0.072, hip: 0.055 });

const mid = (a, b) => (a + b) / 2;














export function humanise(K, o = {}) {
  const R = o.rig || XANDER_RIG;
  const S = o.source || SOURCE_RIG;
  const turn = o.turn || GIRDLE_TURN;

  
  
  
  
  
  
  const dSh = R.shoulderZ - S.shoulderZ;
  const dHip = R.hipZ - S.hipZ;

  
  
  
  
  
  
  
  
  
  
  
  
  const tw = Math.max(-1, Math.min(1, K.twist || 0));
  const shX = mid(K.sh[0][0], K.sh[1][0]);
  const hipX = mid(K.hip[0][0], K.hip[1][0]);
  const sTurn = tw * turn.shoulder;
  const hTurn = -tw * turn.hip;

  const sh = [
    [shX - sTurn, K.sh[0][1] + dSh],
    [shX + sTurn, K.sh[1][1] + dSh],
  ];
  const hip = [
    [hipX - hTurn, K.hip[0][1] + dHip],
    [hipX + hTurn, K.hip[1][1] + dHip],
  ];

  
  
  
  
  const elb = [
    elbow(sh[0], K.hands[0], R.upperArm, R.foreArm),
    elbow(sh[1], K.hands[1], R.upperArm, R.foreArm),
  ];
  const kne = [
    knee(hip[0], K.feet[0], R.thigh, R.shin),
    knee(hip[1], K.feet[1], R.thigh, R.shin),
  ];

  const shMidX = mid(sh[0][0], sh[1][0]);
  const shMidZ = mid(sh[0][1], sh[1][1]);
  
  
  const neckZ = shMidZ + (R.neckZ - R.shoulderZ);
  const headZ = shMidZ + (R.headZ - R.shoulderZ);

  return {
    ...K,
    sh,
    hip,
    elb,
    kne,
    neck: [shMidX + tw * 0.012, neckZ],
    head: [shMidX + tw * 0.020, headZ],
    chest: [shMidX * 0.66 + hipX * 0.34, shMidZ + (mid(hip[0][1], hip[1][1]) - shMidZ) * 0.34],
    waist: [shMidX * 0.22 + hipX * 0.78, shMidZ + (mid(hip[0][1], hip[1][1]) - shMidZ) * 0.78],
  };
}













export function proportionsOf(parts, K) {
  let lo = Infinity;
  let hi = -Infinity;
  let headLo = Infinity;
  let headHi = -Infinity;
  for (const p of parts) {
    const isHead = p.name === 'head' || p.name === 'hair';
    for (let i = 2; i < p.mesh.positions.length; i += 3) {
      const z = p.mesh.positions[i];
      if (z < lo) lo = z;
      if (z > hi) hi = z;
      if (isHead) {
        if (z < headLo) headLo = z;
        if (z > headHi) headHi = z;
      }
    }
  }
  const H = hi - lo;
  const headH = headHi - headLo;
  const f = (z) => (z - lo) / H;
  return {
    height: H,
    headHeight: headH,
    headsTall: headH > 0 ? H / headH : 0,
    shoulder: f(mid(K.sh[0][1], K.sh[1][1])),
    hip: f(mid(K.hip[0][1], K.hip[1][1])),
    knee: f(mid(K.kne[0][1], K.kne[1][1])),
    wrist: f(mid(K.hands[0][1], K.hands[1][1])),
    chin: f(headLo),
  };
}
