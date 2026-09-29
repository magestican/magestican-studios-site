





















export const KID_HEADS = 6.0; 
export const KID_HEIGHT = 7.6; 
export const KID_WORLD_H = 1.6; 
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
};


export function humanRig({ height = KID_HEIGHT, heads = KID_HEADS } = {}) {
  const hh = height / heads, at = (f) => f * height, k = (w) => w * hh;
  const crown = height, eye = crown - 0.5 * hh, chin = crown - hh;
  const shoulder = chin - F.shoulderGap * hh; 
  const tanA = Math.tan(W.splay), sx = k(W.shoulderX);
  const elbowY = at(F.elbow), wristY = at(F.wrist);
  const elbow = [sx + (shoulder - elbowY) * tanA, elbowY, -k(0.02)];
  const wrist = [elbow[0] + (elbowY - wristY) * tanA * 1.1, wristY, k(W.foreArmFwd)];
  const dir = [wrist[0] - sx, wrist[1] - shoulder], len = Math.hypot(dir[0], dir[1]);
  return {
    H: height, heads, hh, crown, eye, chin, shoulder,
    chest: at(F.chest), waist: at(F.waist), hip: at(F.hip), crotch: at(F.crotch), knee: at(F.knee), ankle: at(F.ankle),
    shoulderX: sx, chestHalf: k(W.chestHalf), chestDepth: k(W.chestDepth), waistHalf: k(W.waistHalf), waistDepth: k(W.waistDepth),
    hipHalf: k(W.hipHalf), hipDepth: k(W.hipDepth), neckR: k(W.neckR),
    legX: k(W.legX), thighR: k(W.thighR), kneeR: k(W.kneeR), calfR: k(W.calfR), ankleR: k(W.ankleR),
    upperArmR: k(W.upperArmR), foreArmR: k(W.foreArmR), handHalf: k(W.handHalf), jacketOff: k(W.jacketOff),
    elbow, wrist, fingertip: at(F.fingertip),
    
    
    armLine: { sx, sy: shoulder, dx: dir[0] / len, dy: dir[1] / len, len, rTop: k(0.16), rBot: k(0.17), band: k(0.07) },
    upperArm: Math.hypot(elbow[0] - sx, elbow[1] - shoulder), 
    armLow: at(F.fingertip) - k(0.1), 
    legBlend: k(0.2), 
    kneeBlend: k(0.1), 
    headR: k(0.37), 
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
