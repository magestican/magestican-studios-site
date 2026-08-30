


































































export const LIMB_DEPTH = 0.055;














export const CLAVICLE = 0.27;





export const SHOULDER_SPAN = CLAVICLE;









export const HIP_SPAN_RATIO = 0.62;







const MIN_SEPARATION = 0.34;










const BUILD_SHOULDER = 0.8;
const BUILD_HIP = 0.3;









export const DEPTHS = Object.freeze({ chest: 0.150, waist: 0.124, pelvis: 0.143 });



























export const SEG = {
  upperArm: [0.066, 0.066],
  foreArm: [0.055, 0.055],
  thigh: [0.095, 0.097],
  shin: [0.073, 0.075],
  neck: [0.048, 0.048],
};


const sideSign = (i, flip) => (flip ? (i === 0 ? -1 : 1) : (i === 0 ? 1 : -1));


export function spansFor(build = 1) {
  const shoulder = SHOULDER_SPAN * (1 + (build - 1) * BUILD_SHOULDER);
  const hip = SHOULDER_SPAN * HIP_SPAN_RATIO * (1 + (build - 1) * BUILD_HIP);
  return { shoulder, hip };
}











































function girdleBar(a, b, L, sx, flip) {
  const dx = (b[0] - a[0]) * sx;          
  const dz = b[1] - a[1];                 
  const room = L * L - dx * dx - dz * dz;
  const ySep = Math.max(L * MIN_SEPARATION, room > 0 ? Math.sqrt(room) : 0);
  
  
  const yaw = Math.atan2(dx, ySep);
  const p0 = [a[0] * sx, sideSign(0, flip) * (ySep / 2), a[1]];
  const p1 = [b[0] * sx, sideSign(1, flip) * (ySep / 2), b[1]];
  return {
    points: [p0, p1],
    mid: [(p0[0] + p1[0]) / 2, 0, (p0[2] + p1[2]) / 2],
    
    
    
    span: L,
    ySep,
    yaw,
  };
}











export function girdleOf(K, { flip = false, build = 1 } = {}) {
  const sx = flip ? -1 : 1;
  const { shoulder: shL, hip: hipL } = spansFor(build);

  const sh = girdleBar(K.sh[0], K.sh[1], shL, sx, flip);
  const hip = girdleBar(K.hip[0], K.hip[1], hipL, sx, flip);

  return {
    shoulder: sh,
    hip,
    chestDepth: DEPTHS.chest * (1 + (build - 1) * BUILD_SHOULDER),
    waistDepth: DEPTHS.waist * (1 + (build - 1) * BUILD_HIP),
    pelvisDepth: DEPTHS.pelvis * (1 + (build - 1) * BUILD_HIP),
    
    neck: [K.neck[0] * sx, 0, K.neck[1]],
    head: [K.head[0] * sx, 0, K.head[1]],
  };
}












export function segmentsOf(K, { flip = false, build = 1 } = {}) {
  const sx = flip ? -1 : 1;
  const g = girdleOf(K, { flip, build });
  const out = [];
  const seg = (a, b, [w, d], part) => out.push({ a, b, w, d, part });
  const at = (v, y) => [v[0] * sx, y, v[1]];

  for (let i = 0; i < 2; i += 1) {
    const ay = g.shoulder.points[i][1];
    const ly = g.hip.points[i][1];
    seg(g.shoulder.points[i], at(K.elb[i], ay), SEG.upperArm, `upperArm${i}`);
    seg(at(K.elb[i], ay), at(K.hands[i], ay), SEG.foreArm, `foreArm${i}`);
    seg(g.hip.points[i], at(K.kne[i], ly), SEG.thigh, `thigh${i}`);
    seg(at(K.kne[i], ly), at(K.feet[i], ly), SEG.shin, `shin${i}`);
  }
  seg(g.neck, g.head, SEG.neck, 'neck');
  return out;
}













export function jointsOf(K, { flip = false, build = 1 } = {}) {
  const sx = flip ? -1 : 1;
  const g = girdleOf(K, { flip, build });
  const at = (v, y) => [v[0] * sx, y, v[1]];
  const out = [];
  for (let i = 0; i < 2; i += 1) {
    const ay = g.shoulder.points[i][1];
    const ly = g.hip.points[i][1];
    
    
    
    out.push({ centre: g.shoulder.points[i], r: SEG.upperArm[0] * 0.72, part: `shoulder${i}` });
    out.push({ centre: at(K.elb[i], ay), r: SEG.foreArm[0] * 0.60, part: `elbow${i}` });
    out.push({ centre: at(K.hands[i], ay), r: SEG.foreArm[0] * 0.46, part: `wrist${i}` });
    out.push({ centre: g.hip.points[i], r: SEG.thigh[0] * 0.56, part: `hip${i}` });
    out.push({ centre: at(K.kne[i], ly), r: SEG.shin[0] * 0.64, part: `knee${i}` });
    out.push({ centre: at(K.feet[i], ly), r: SEG.shin[0] * 0.44, part: `ankle${i}` });
  }
  return out;
}








export function torsoBoxOf(K, { flip = false, build = 1 } = {}) {
  const g = girdleOf(K, { flip, build });
  return {
    top: g.shoulder.mid,
    bottom: g.hip.mid,
    topW: g.shoulder.span,
    bottomW: g.hip.span,
    topYaw: g.shoulder.yaw,
    bottomYaw: g.hip.yaw,
    topD: g.chestDepth,
    bottomD: g.pelvisDepth,
    waistD: g.waistDepth,
    
    
    depth: g.chestDepth,
  };
}


export function headBoxOf(K, headR, { flip = false } = {}) {
  const sx = flip ? -1 : 1;
  return {
    centre: [K.head[0] * sx, 0, K.head[1]],
    
    
    w: headR * 1.70,
    d: headR * 1.62,
    h: headR * 2.05,
  };
}
