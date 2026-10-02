

























export const KID_HEADS = 5.2; 
export const KID_BODY_W = 0.85;
export const KID_SPLAY = 0.17; 
export const KID_HEIGHT = 7.6; 
export const KID_WORLD_H = 1.4; 
export const ELDER_HEADS = 5.8; 
export const ELDER_HEIGHT = 8.2;
export const ELDER_WORLD_H = 1.8;



const F = { shoulderGap: 0.24, chest: 0.705, waist: 0.6, hip: 0.495, crotch: 0.465, knee: 0.28, ankle: 0.04,
  elbow: 0.615, wrist: 0.475, fingertip: 0.385 };

const W = {
  shoulderX: 0.68, 
  chestHalf: 0.56, chestDepth: 0.4, waistHalf: 0.45, waistDepth: 0.33, hipHalf: 0.55, hipDepth: 0.37,
  neckR: 0.22, legX: 0.3, thighR: 0.25, kneeR: 0.15, calfR: 0.16, ankleR: 0.1,
  upperArmR: 0.15, foreArmR: 0.12, handHalf: 0.1, jacketOff: 0.06,
  splay: 0.1, 
  foreArmFwd: 0.14, 
  
  
  
  jeansX: 0.32, jeansThigh: 0.3, jeansKnee: 0.26, jeansHem: 0.28,
};


export function humanRig({ height = KID_HEIGHT, heads = KID_HEADS, bodyW = 1, splay = W.splay } = {}) {
  const hh = height / heads, at = (f) => f * height, k = (w) => w * hh * bodyW; 
  const crown = height, eye = crown - 0.5 * hh, chin = crown - hh;
  const shoulder = chin - F.shoulderGap * hh; 
  const tanA = Math.tan(splay), sx = k(W.shoulderX);
  const elbowY = at(F.elbow), wristY = at(F.wrist);
  const elbow = [sx + (shoulder - elbowY) * tanA, elbowY, -k(0.02)];
  const wrist = [elbow[0] + (elbowY - wristY) * tanA * 1.1, wristY, k(W.foreArmFwd)];
  const dir = [wrist[0] - sx, wrist[1] - shoulder], len = Math.hypot(dir[0], dir[1]);
  return {
    H: height, heads, hh, bodyW, crown, eye, chin, shoulder,
    chest: at(F.chest), waist: at(F.waist), hip: at(F.hip), crotch: at(F.crotch), knee: at(F.knee), ankle: at(F.ankle),
    shoulderX: sx, chestHalf: k(W.chestHalf), chestDepth: k(W.chestDepth), waistHalf: k(W.waistHalf), waistDepth: k(W.waistDepth),
    hipHalf: k(W.hipHalf), hipDepth: k(W.hipDepth), neckR: k(W.neckR),
    legX: k(W.legX), thighR: k(W.thighR), kneeR: k(W.kneeR), calfR: k(W.calfR), ankleR: k(W.ankleR),
    upperArmR: k(W.upperArmR), foreArmR: k(W.foreArmR), handHalf: k(W.handHalf), jacketOff: k(W.jacketOff),
    elbow, wrist, fingertip: at(F.fingertip),
    jeansX: k(W.jeansX), jeansThigh: k(W.jeansThigh), jeansKnee: k(W.jeansKnee), jeansHem: k(W.jeansHem),
    
    
    armLine: { sx, sy: shoulder, dx: dir[0] / len, dy: dir[1] / len, len, rTop: k(0.16), rBot: k(0.17), band: k(0.07) },
    upperArm: Math.hypot(elbow[0] - sx, elbow[1] - shoulder), 
    armLow: at(F.fingertip) - k(0.1), 
    legBlend: k(0.2), 
    kneeBlend: k(0.1), 
    headR: 0.37 * hh, 
  };
}




export function armWeight(rig, x, y) {
  const A = rig.armLine, qx = Math.abs(x) - A.sx, qy = y - A.sy;
  const along = qx * A.dx + qy * A.dy, t = qx * -A.dy + qy * A.dx; 
  const r = A.rTop + (A.rBot - A.rTop) * Math.max(0, Math.min(1, along / A.len));
  const ss = (a, b, v) => { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
  return ss(-r - A.band, -r, t) * (y >= rig.armLow ? 1 : 0) * (1 - ss(A.sy + 0.25 * rig.hh, A.sy + 0.45 * rig.hh, y));
}



export const WALK = { leg: 0.48, arm: 0.38, knee: 0.85, kneeRest: 0.06, elbow: 0.7, elbowRest: 0.22 };




export const KID_OUTFITS = {
  boy: {
    skin: '#e3b08a', hair: '#3a2418', eyes: '#5a3a22', lips: '#b86a5e',
    cap: { crown: '#c8101c', brim: '#15151c', button: '#15151c', worn: 'backwards' },
    top: { kind: 'windbreaker', base: '#18a89c', block: '#6a2fc0', stripe: '#ff3d8b', yoke: '#ffd21f', cuff: '#ffd21f', open: true },
    tee: '#f6f4ee',
    legs: { kind: 'baggy jeans', denim: '#6c8fc8', fade: '#a9c1e6', belt: '#2a1c14' },
    shoes: { kind: 'high-tops', upper: '#f7f5f0', panel: '#d4202c', sole: '#f2efe8', laces: '#1b1b22', tongue: '#d4202c' },
    headphones: { band: '#b9c0c8', pads: '#ff8a1c', worn: 'neck' },
    tapePlayer: { body: '#ffc61a', panel: '#2b2d36', window: '#1a1418', reels: '#e8e4dc', worn: 'belt', side: -1 },
  },
  girl: {
    skin: '#b97d57', hair: '#221410', eyes: '#3a2416', lips: '#a24f55',
    hairdo: { kind: 'high ponytail', scrunchie: '#ff3d8b', bangs: 'teased' },
    earrings: '#f0c040',
    top: { kind: 'denim jacket', base: '#8fb2dc', seam: '#e0b060', collar: '#7a9cc8', rolled: true, open: true },
    tee: '#ff3d8b',
    legs: { kind: 'bike shorts', shorts: '#1c1a24', stripe: '#27d6c6', socks: '#fbfaf6' },
    shoes: { kind: 'high-tops', upper: '#fbfaf6', panel: '#27d6c6', sole: '#f2efe8', laces: '#fbfaf6', tongue: '#ff3d8b' },
    headphones: { band: '#b9c0c8', pads: '#ff8a1c', worn: 'neck' },
    tapePlayer: { body: '#27d6c6', panel: '#2b2d36', window: '#1a1418', reels: '#e8e4dc', worn: 'belt', side: -1 },
  },
};






export const SEAT = { hip: 1.35, knee: 1.5, astride: 0.42, shoulder: 0.75, elbow: 0.55 };
const turnX = (v, a, py, pz) => { const c = Math.cos(a), s = Math.sin(a), y = v[1] - py, z = v[2] - pz; return [v[0], c * y - s * z + py, s * y + c * z + pz]; };
const turnY = (v, a, px, pz) => { const c = Math.cos(a), s = Math.sin(a), x = v[0] - px, z = v[2] - pz; return [c * x + s * z + px, v[1], -s * x + c * z + pz]; };
const ss = (a, b, v) => { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };







export const FALL = [
  { arm: [2.2, 2.7], elbow: [0.6, 0.2], leg: [0.45, 0.2], knee: [0.5, 1.1] },
  { arm: [2.6, 2.3], elbow: [0.3, 0.7], leg: [0.3, 0.5], knee: [1.0, 0.6] },
  { arm: [2.4, 2.0], elbow: [0.8, 0.4], leg: [0.55, 0.35], knee: [0.7, 0.9] },
];



export const POSES = {
  land: { arm: [0.75, 0.85], elbow: [0.35, 0.3], leg: [0.22, 0.22], knee: [0.4, 0.35] },
  surprised: { arm: [1.05, 1.0], elbow: [1.45, 1.5], leg: [0.12, 0.12], knee: [0.12, 0.12] },
  cheer: { arm: [0.3, 2.75], elbow: [0.35, 0.55], leg: [0.1, 0.12], knee: [0, 0.1] },
};
const turnZ = (v, a, px, py) => { const c = Math.cos(a), s = Math.sin(a), x = v[0] - px, y = v[1] - py; return [c * x - s * y + px, s * x + c * y + py, v[2]]; };


export function fallVertex(rig, v, pos, tag = 0, frame = 0, point = true) {
  const f = typeof frame === 'string' ? POSES[frame] : FALL[frame % FALL.length], [x, y] = pos, side = x < 0 ? -1 : 1, i = side < 0 ? 0 : 1, k = point ? 1 : 0;
  const isArm = tag === 1 ? 1 : 0, isBody = tag === 2 ? 1 : 0;
  const armW = isArm + (1 - isArm - isBody) * armWeight(rig, x, y);
  const A = rig.armLine, along = (Math.abs(x) - A.sx) * A.dx + (y - A.sy) * A.dy;
  const foreW = armW * ss(rig.upperArm - 0.12 * rig.hh, rig.upperArm + 0.06 * rig.hh, along);
  const legW = (1 - ss(rig.hip - rig.legBlend, rig.hip, y)) * (1 - armW) * (1 - isBody);
  const shinW = legW * (1 - ss(rig.knee - rig.kneeBlend, rig.knee + rig.kneeBlend, y));
  let p = turnZ(v, side * f.elbow[i] * foreW, side * rig.elbow[0] * k, rig.elbow[1] * k);
  p = turnZ(p, side * f.arm[i] * armW, side * rig.shoulderX * k, rig.shoulder * k);
  p = turnX(p, f.knee[i] * shinW, rig.knee * k, 0.05 * rig.hh * k);
  return turnZ(p, side * f.leg[i] * legW, side * rig.legX * k, rig.hip * k);
}

export function seatVertex(rig, v, pos, tag = 0, pose = SEAT, point = true) {
  const [x, y] = pos, side = x < 0 ? -1 : 1, k = point ? 1 : 0;
  const isArm = tag === 1 ? 1 : 0, isBody = tag === 2 ? 1 : 0;
  const armW = isArm + (1 - isArm - isBody) * armWeight(rig, x, y);
  const A = rig.armLine, along = (Math.abs(x) - A.sx) * A.dx + (y - A.sy) * A.dy;
  const foreW = armW * ss(rig.upperArm - 0.12 * rig.hh, rig.upperArm + 0.06 * rig.hh, along);
  const legW = (1 - ss(rig.hip - rig.legBlend, rig.hip, y)) * (1 - armW) * (1 - isBody);
  const shinW = legW * (1 - ss(rig.knee - rig.kneeBlend, rig.knee + rig.kneeBlend, y));
  let p = turnX(v, -pose.elbow * foreW, rig.elbow[1] * k, rig.elbow[2] * k);
  p = turnX(p, -pose.shoulder * armW, rig.shoulder * k, 0);
  p = turnX(p, pose.knee * shinW, rig.knee * k, 0.05 * rig.hh * k);
  p = turnX(p, -pose.hip * legW, rig.hip * k, 0);
  return turnY(p, side * pose.astride * legW, side * rig.legX * k, 0);
}
