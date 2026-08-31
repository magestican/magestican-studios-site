








































































































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
















export const XANDER_FOOT = Object.freeze({ long: 1.34, wide: 0.98, tall: 1.12 });














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
