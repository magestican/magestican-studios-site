










































import { elbow, knee } from './limbSolve.mjs';






















































export const ARCH = {
  renji: {
    label: 'RENJI - the lead',
    heightMul: 0.96,
    pal: {
      skin: '#ffd6b8', skinSh: '#c6846c', line: '#120e1a',
      hair: '#f0705a', hairLo: '#8a2422', hairHi: '#ff9a7e',
      top: '#7182b8', topSh: '#44508f',
      pant: '#3d4870', pantSh: '#28304a',
      accent: '#f6c854', accentSh: '#b08a24',
      eye: '#6cc0e8', eyeLo: '#2c72b0', white: '#faf8f4',
    },
    jaw: 'oval', eye: [0.92, 0.83], lid: 0, brow: 4, browLift: 0, mouth: 'set',
    hair: 'spike', kit: 'band', build: 1.00, browAngle: -0.30,
  },
  kira: {
    label: 'KIRA - the rival',
    heightMul: 1.02,
    pal: {
      skin: '#f0cbb2', skinSh: '#b07f6e', line: '#0b0812',
      hair: '#a48ce0', hairLo: '#3e2a78', hairHi: '#c4b0f2',
      top: '#6a4fb4', topSh: '#3e2a78',
      pant: '#4a3a71', pantSh: '#32284f',
      accent: '#e04068', accentSh: '#8e1c3c',
      eye: '#ff90a8', eyeLo: '#c02a52', white: '#f4eef8',
    },
    jaw: 'taper', eye: [0.92, 1.00], lid: 2, brow: 6, browLift: -1, mouth: 'flat',
    hair: 'curtain', kit: 'patch', build: 0.92, browAngle: -0.62,
  },
  momo: {
    label: 'MOMO - the bright one',
    heightMul: 0.90,
    pal: {
      skin: '#ffe6d2', skinSh: '#d69880', line: '#160f1e',
      hair: '#ffdc78', hairLo: '#c07018', hairHi: '#fff0b4',
      top: '#ff7a9c', topSh: '#d63c68',
      pant: '#8ceccc', pantSh: '#22a888',
      accent: '#ffe9a0', accentSh: '#d6a83c',
      eye: '#8ceccc', eyeLo: '#22a888', white: '#fffaf2',
    },
    jaw: 'round', eye: [1.23, 1.33], lid: -2, brow: 1, browLift: 2, mouth: 'smile',
    hair: 'tails', kit: 'ribbon', build: 0.94, browAngle: -0.08,
  },
  tetsu: {
    label: 'TETSU - the heavy',
    heightMul: 1.06,
    pal: {
      skin: '#e8be9a', skinSh: '#a4704f', line: '#0e0c0c',
      
      
      
      hair: '#6a5a4a', hairLo: '#2a2218', hairHi: '#8a7862',
      top: '#9c8a६e'.replace('६','6'), topSh: '#645440',
      pant: '#6b6050', pantSh: '#463e32',
      accent: '#d8532a', accentSh: '#8e3116',
      eye: '#7a6a52', eyeLo: '#4a4238', white: '#f0e6d8',
    },
    jaw: 'square', eye: [0.92, 0.83], lid: 1, brow: 7, browLift: -2, mouth: 'grim',
    hair: 'crop', kit: 'scar', build: 1.22, browAngle: -0.70,
  },
  yuki: {
    label: 'YUKI - the stoic',
    heightMul: 1.04,
    pal: {
      skin: '#f4d2bc', skinSh: '#b2806e', line: '#0d0f1a',
      hair: '#f2f6fa', hairLo: '#8c9aac', hairHi: '#ffffff',
      top: '#54628c', topSh: '#2f3a58',
      pant: '#404b6b', pantSh: '#2b3350',
      accent: '#6ad0c0', accentSh: '#2f8c80',
      eye: '#a0e8d8', eyeLo: '#2f8c80', white: '#fbf7f2',
    },
    jaw: 'long', eye: [0.92, 1.00], lid: 3, brow: 2, browLift: 1, mouth: 'flat',
    hair: 'topknot', kit: 'collar', build: 0.94, browAngle: -0.20,
  },
  ami: {
    label: 'AMI - the mechanic',
    heightMul: 0.94,
    pal: {
      skin: '#ffdcc4', skinSh: '#c48a6e', line: '#0f1016',
      hair: '#8ef0e0', hairLo: '#1c7a78', hairHi: '#c8fff4',
      top: '#a08659', topSh: '#63513a',
      pant: '#786450', pantSh: '#4e4136',
      accent: '#ff8a3c', accentSh: '#b0501a',
      eye: '#ffca5c', eyeLo: '#d08a18', white: '#f8f4ee',
    },
    jaw: 'wide', eye: [1.08, 1.00], lid: 0, brow: 2, browLift: 1, mouth: 'smirk',
    hair: 'bob', kit: 'goggles', build: 1.02, browAngle: -0.14,
  },
};

export const CAST_IDS = Object.keys(ARCH);


































export const FACE_CLEAR = 1.36;


























export function paintFace(ctx, size, archId, face = 'set', chart = {}) {
  const A = ARCH[archId] || ARCH.renji;
  const P = A.pal;
  
  
  
  
  
  
  
  
  
  
  
  
  
  const crown = chart.crown ?? size * 0.06;
  const chin = chart.chin ?? size * 0.86;
  const r = (chin - crown) / 2.06;
  const S = r / RIG.headR;
  const head = [size * 0.5, crown + 1.06 * r];

  ctx.save();
  ctx.clearRect(0, 0, size, size);
  
  
  
  ctx.fillStyle = P.skin;
  ctx.fillRect(0, 0, size, size);
  ctx.lineJoin = 'round';

  drawFace(ctx, S, head, r, P, A, face);
  drawHairFront(ctx, S, head, r, P, A);
  
  
  
  
  
  if (A.kit !== 'collar') drawKit(ctx, S, head, r, P, A);
  drawBrows(ctx, S, head, r, P, A, face);
  ctx.restore();
}









export function bodyPalette(archId) {
  const A = ARCH[archId] || ARCH.renji;
  const P = A.pal;
  return {
    skin: P.skin, skinShade: shadeOf(P.skin),
    top: P.top, topShade: shadeOf(P.top),
    pant: P.pant, pantShade: shadeOf(P.pant),
    hair: P.hair, hairShade: shadeOf(P.hair),
    accent: P.accent, accentShade: shadeOf(P.accent),
    line: P.line,
    build: A.build, heightMul: A.heightMul, jaw: A.jaw, hair_: A.hair, kit: A.kit,
  };
}

export const PART_ORDER = Object.freeze([
  'hairBack', 'legFar', 'legNear', 'pelvis',
  'armFarBack', 'torso', 'armFarFront', 'head', 'armNear',
]);




export const RIG = {
  shoulderX: 0.101, shoulderZ: 0.691,
  hipX: 0.061, hipZ: 0.473,
  upperArm: 0.170, foreArm: 0.165,   
  thigh: 0.262, shin: 0.246,         
  neckZ: 0.735, headR: 0.118,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;















const FAR = 0;
const NEAR = 1;






































const FAR_PARALLAX = {
  shoulderX: -0.030, shoulderZ: -0.014,
  handX: -0.022, handZ: -0.010,
  hipX: -0.018, footX: -0.020,
};







































































































const TRUNK = {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ROLL_Z: 0.019,
  SINK_Z: 0.008,
  
  
  
  PELVIS_ROLL: 0.34,
  
  
  
  
  
  LEAN_X: 0.150,
  HIP_LEAN: 0.34,
  
  
  REST_ROLL: 0.58,
};
























































const FAR_GIRTH = 0.92;


































































const SHADE_K = 0.74;
const SHADE_SAT = 1.12;


function rgbaOf(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const shadeCache = new Map();
function shadeOf(hex) {
  const got = shadeCache.get(hex);
  if (got) return got;
  const n = parseInt(hex.slice(1), 16);
  const lit = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v * SHADE_K);
  
  
  
  
  const mx = Math.max(...lit);
  const ch = lit.map((v) => mx - (mx - v) * SHADE_SAT);
  const out = `#${ch.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
  shadeCache.set(hex, out);
  return out;
}






























export function solve(pose, opts = {}) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const farI = opts.flip ? NEAR : FAR;
  const drop = pose.drop || 0;
  const air = pose.air || 0;
  const twist = pose.twist || 0;
  
  
  
  const lift = air * 0.30;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const pelvisZ = pose.pelvis !== undefined
    ? pose.pelvis + lift
    : RIG.hipZ - drop + lift;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const SPINE = RIG.shoulderZ - RIG.hipZ;            
  const shoulderZ = pelvisZ + SPINE;
  
  
  const sw = lerp(1.0, 0.62, clamp(Math.abs(twist), 0, 1));

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const pw = lerp(1.0, 0.80, clamp(Math.abs(twist), 0, 1));

  const sh = [[-RIG.shoulderX * sw, shoulderZ], [RIG.shoulderX * sw, shoulderZ]];
  const hip = [[-RIG.hipX * pw, pelvisZ], [RIG.hipX * pw, pelvisZ]];
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const hands = pose.hands.map((h) => [h[0], h[1] + lift]);
  
  
  
  
  
  
  const feet = pose.feet.map((f) => [f[0], f[1]]);

  
  
  
  
  
  
  
  
  
  
  
  
  const SPAN = RIG.upperArm + RIG.foreArm;
  const ext = clamp(Math.max(
    Math.hypot(hands[0][0] - sh[0][0], hands[0][1] - sh[0][1]),
    Math.hypot(hands[1][0] - sh[1][0], hands[1][1] - sh[1][1]),
  ) / SPAN, 0, 1);
  const trunk = clamp(twist, -1, 1) * lerp(TRUNK.REST_ROLL, 1.0, ext);
  
  
  
  
  const roll = trunk * TRUNK.ROLL_Z;
  
  
  
  const sink = Math.abs(trunk) * TRUNK.SINK_Z;
  sh[0][1] -= roll + sink;
  sh[1][1] += roll - sink;
  hip[0][1] += roll * TRUNK.PELVIS_ROLL;
  hip[1][1] -= roll * TRUNK.PELVIS_ROLL;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const leanSrc = Math.max(hands[0][0], hands[1][0]);
  const lean = clamp(leanSrc - 0.22, -0.12, 0.20) * TRUNK.LEAN_X;
  sh[0][0] += lean;
  sh[1][0] += lean;
  hip[0][0] -= lean * TRUNK.HIP_LEAN;
  hip[1][0] -= lean * TRUNK.HIP_LEAN;
  
  
  
  
  const shMid = [(sh[0][0] + sh[1][0]) / 2, (sh[0][1] + sh[1][1]) / 2];
  const hipMid = [(hip[0][0] + hip[1][0]) / 2, (hip[0][1] + hip[1][1]) / 2];

  
  
  sh[farI][0] += FAR_PARALLAX.shoulderX;
  sh[farI][1] += FAR_PARALLAX.shoulderZ;
  hands[farI][0] += FAR_PARALLAX.handX;
  hands[farI][1] += FAR_PARALLAX.handZ;
  hip[farI][0] += FAR_PARALLAX.hipX;
  
  
  
  feet[farI][0] += FAR_PARALLAX.footX;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const FACE_R = RIG.headR * FACE_CLEAR;
  const ARM = (RIG.upperArm + RIG.foreArm) * 0.995;
  
  
  
  
  
  const faceX = shMid[0] + twist * 0.020;
  const faceZ = shoulderZ + 0.044 + RIG.headR * 0.92;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  for (let pass = 0; pass < 6; pass += 1) {
    for (const h of hands) {
      let dx = h[0] - faceX;
      let dz = h[1] - faceZ;
      let d = Math.hypot(dx, dz);
      
      
      
      if (d < 1e-3) { dx = 0.30; dz = -0.95; d = 1; }
      if (d < FACE_R) {
        h[0] = faceX + (dx / d) * FACE_R;
        h[1] = faceZ + (dz / d) * FACE_R;
      }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    for (let i = 0; i < 2; i += 1) {
      const el = elbow(sh[i], hands[i], RIG.upperArm, RIG.foreArm);
      
      
      
      
      
      
      let worst = null;
      for (const [p0, p1] of [[sh[i], el], [el, hands[i]]]) {
        const vx = p1[0] - p0[0];
        const vz = p1[1] - p0[1];
        const L2 = vx * vx + vz * vz;
        if (L2 <= 1e-9) continue;
        let t = ((faceX - p0[0]) * vx + (faceZ - p0[1]) * vz) / L2;
        t = Math.max(0, Math.min(1, t));
        const c0 = p0[0] + vx * t;
        const c1 = p0[1] + vz * t;
        const d0 = Math.hypot(c0 - faceX, c1 - faceZ);
        if (!worst || d0 < worst.d) worst = { cx: c0, cz: c1, d: d0 };
      }
      if (worst) {
        const cx = worst.cx;
        const cz = worst.cz;
        let ox = cx - faceX;
        let oz = cz - faceZ;
        let od = worst.d;
        if (od < 1e-3) { ox = 0.30; oz = -0.95; od = 1; }
        if (od < FACE_R) {
          
          
          
          
          const push = FACE_R - od;
          hands[i][0] += (ox / od) * push;
          hands[i][1] += (oz / od) * push;
        }
      }
    }
    for (let i = 0; i < 2; i += 1) {
      const ax = hands[i][0] - sh[i][0];
      const az = hands[i][1] - sh[i][1];
      const ad = Math.hypot(ax, az);
      if (ad > ARM) {
        hands[i][0] = sh[i][0] + (ax / ad) * ARM;
        hands[i][1] = sh[i][1] + (az / ad) * ARM;
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const LEG = (RIG.thigh + RIG.shin) * 0.995;
  for (let i = 0; i < 2; i += 1) {
    const fx = feet[i][0] - hip[i][0];
    const fz = feet[i][1] - hip[i][1];
    const fd = Math.hypot(fx, fz);
    if (fd <= LEG) continue;
    if (feet[i][1] <= 0.001) {
      
      const span = Math.sqrt(Math.max(0, LEG * LEG - fz * fz));
      feet[i][0] = hip[i][0] + Math.sign(fx || 1) * span;
    } else {
      feet[i][0] = hip[i][0] + (fx / fd) * LEG;
      feet[i][1] = hip[i][1] + (fz / fd) * LEG;
    }
  }

  const elb = [elbow(sh[0], hands[0], RIG.upperArm, RIG.foreArm),
               elbow(sh[1], hands[1], RIG.upperArm, RIG.foreArm)];
  
  
  
  const kne = [knee(hip[0], feet[0], RIG.thigh, RIG.shin),
               knee(hip[1], feet[1], RIG.thigh, RIG.shin)];
  const neckZ = shoulderZ + 0.044;
  const headZ = neckZ + RIG.headR * 0.92;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const handMeanX = (hands[0][0] + hands[1][0]) / 2;
  const headTilt = clamp(
    (handMeanX - 0.16) * 0.62 - air * 0.20 + drop * 0.40,
    -0.34, 0.34,
  );

  return {
    sh, hip, elb, kne, hands, feet, twist, air, lift, headTilt,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    neck: [shMid[0] + twist * 0.012, neckZ],
    head: [shMid[0] + twist * 0.020, headZ],
    chest: [lerp(shMid[0], hipMid[0], 0.34) + twist * 0.008,
            lerp(shMid[1], hipMid[1], 0.34)],
    waist: [lerp(shMid[0], hipMid[0], 0.78) + twist * 0.004,
            lerp(shMid[1], hipMid[1], 0.78)],
    
    
    
    
    trunk,
  };
}












function capsulePath(ctx, a, b, r1, r2) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / L, ny = dx / L;
  const ang = Math.atan2(dy, dx);
  ctx.moveTo(a[0] + nx * r1, a[1] + ny * r1);
  ctx.arc(a[0], a[1], r1, ang + Math.PI / 2, ang - Math.PI / 2);
  ctx.lineTo(b[0] + nx * -r2, b[1] + ny * -r2);
  ctx.arc(b[0], b[1], r2, ang - Math.PI / 2, ang + Math.PI / 2);
  ctx.closePath();
}

function capsule(ctx, a, b, r1, r2) {
  ctx.beginPath();
  capsulePath(ctx, a, b, r1, r2);
}

function ink(ctx, S, w = 0.020) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, S * w);
  ctx.stroke();
}

























function limb(ctx, S, a, b, r1, r2, fill, shade) {
  capsule(ctx, a, b, r1 * S, r2 * S);
  ctx.fillStyle = fill;
  ctx.fill();
  if (!shade) return;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / L;
  const ny = dx / L;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const rr = ((r1 + r2) / 2) * S;
  ctx.save();
  ctx.clip();
  const g = ctx.createLinearGradient(
    mx + nx * rr * 0.10, my + ny * rr * 0.10,
    mx + nx * rr * 1.05, my + ny * rr * 1.05,
  );
  g.addColorStop(0, rgbaOf(shade, 0));
  g.addColorStop(1, rgbaOf(shade, 0.92));
  ctx.fillStyle = g;
  ctx.fillRect(
    Math.min(a[0], b[0]) - rr * 2, Math.min(a[1], b[1]) - rr * 2,
    Math.abs(dx) + rr * 4, Math.abs(dy) + rr * 4,
  );
  ctx.restore();
}




export function drawFighter(ctx, W, H, pose, opts = {}) {
  const A = ARCH[opts.arch || 'boy'];
  const P = A.pal;
  const face = opts.face || 'set';
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const K = solve(pose, opts);

  
  
  
  
  
  
  
  
  const S = opts.scale !== undefined ? opts.scale : H * 0.78 * A.heightMul;
  const floorY = opts.floorY !== undefined ? opts.floorY : H * 0.955;
  const cx = W * 0.5;
  const p = (q) => [cx + q[0] * S, floorY - q[1] * S];

  const b = A.build;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const R_LIMB = 0.10 * S;              
  const hr = 0.118 * S;                 
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const q of [K.sh[0], K.sh[1], K.elb[0], K.elb[1], K.hands[0], K.hands[1],
    K.hip[0], K.hip[1], K.kne[0], K.kne[1], K.feet[0], K.feet[1],
    K.neck, K.chest, K.waist]) {
    const v = p(q);
    if (v[0] < x0) x0 = v[0];
    if (v[0] > x1) x1 = v[0];
    if (v[1] < y0) y0 = v[1];
    if (v[1] > y1) y1 = v[1];
  }
  x0 -= R_LIMB; x1 += R_LIMB; y0 -= R_LIMB; y1 += R_LIMB;
  
  
  
  
  
  const hd = p(K.head);
  x0 = Math.min(x0, hd[0] - hr * 2.0);
  x1 = Math.max(x1, hd[0] + hr * 2.0);
  y0 = Math.min(y0, hd[1] - hr * 2.4);
  y1 = Math.max(y1, hd[1] + hr * 3.7);
  
  
  const pad = Math.ceil(Math.max(1.0, S * 0.011)) + 2;
  
  
  
  const ox = Math.max(0, Math.floor(x0 - pad));
  const oy = Math.max(0, Math.floor(y0 - pad));
  const bw = Math.min(W, Math.ceil(x1 + pad)) - ox;
  const bh = Math.min(H, Math.ceil(y1 + pad)) - oy;
  if (bw <= 0 || bh <= 0) return;       

  const buf = makeBuffer(bw, bh);
  const bx = buf.getContext('2d');
  bx.setTransform(1, 0, 0, 1, 0, 0);
  bx.clearRect(0, 0, bw, bh);
  
  
  
  
  bx.translate(-ox, -oy);
  bx.lineJoin = 'round';

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const far = opts.flip ? NEAR : FAR;
  const near = opts.flip ? FAR : NEAR;

  
  
  
  
  
  
  
  
  
  
  
  
  const only = opts.only ? new Set(opts.only) : null;
  const part = (name, fn) => { if (!only || only.has(name)) fn(); };

  part('hairBack', () => drawHairBack(bx, S, p(K.head), P, A));
  part('legFar', () => drawLeg(bx, S, p, K, far, P, b, true));
  part('legNear', () => drawLeg(bx, S, p, K, near, P, b, false));
  part('pelvis', () => drawPelvis(bx, S, p, K, P, b));
  part('armFarBack', () => drawArm(bx, S, p, K, far, P, b, true, 'back'));
  part('torso', () => drawTorso(bx, S, p, K, P, b, A));
  part('armFarFront', () => drawArm(bx, S, p, K, far, P, b, true, 'front'));
  part('head', () => drawHead(bx, S, p(K.head), p(K.neck), P, A, face, K.headTilt));
  part('armNear', () => drawArm(bx, S, p, K, near, P, b, false));

  ctx.save();
  if (opts.flip) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  
  
  
  
  
  
  
  
  
  
  
  if (only) ctx.drawImage(buf, 0, 0, bw, bh, ox, oy, bw, bh);
  else outlineAndBlit(ctx, buf, bw, bh, ox, oy, Math.max(1.0, S * 0.011), P.line);
  ctx.restore();
}























































let spreadC = null;
let maskC = null;
let tmpC = null;

function scratch(ref, w, h) {
  let c = ref.c;
  if (!c || c.width !== w || c.height !== h) {
    c = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(w, h)
      : document.createElement('canvas');
    c.width = w;
    c.height = h;
    ref.c = c;
  }
  const x = c.getContext('2d');
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;
  x.clearRect(0, 0, w, h);
  return { c, x };
}


function spreadRing(x, src, k, n = 12) {
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    x.drawImage(src, Math.cos(a) * k, Math.sin(a) * k);
  }
}

function weldJoints(buf, k) {
  const w = buf.width;
  const h = buf.height;

  
  const sp = scratch(spreadC = spreadC || {}, w, h);
  spreadRing(sp.x, buf, k);
  sp.x.drawImage(buf, 0, 0);

  
  
  
  const mk = scratch(maskC = maskC || {}, w, h);
  mk.x.fillStyle = '#000';
  mk.x.fillRect(0, 0, w, h);
  mk.x.globalCompositeOperation = 'destination-out';
  mk.x.drawImage(sp.c, 0, 0);                       
  mk.x.globalCompositeOperation = 'source-over';

  const tm = scratch(tmpC = tmpC || {}, w, h);
  spreadRing(tm.x, mk.c, k);
  tm.x.drawImage(mk.c, 0, 0);                       

  mk.x.globalCompositeOperation = 'source-over';
  mk.x.clearRect(0, 0, w, h);
  mk.x.fillStyle = '#000';
  mk.x.fillRect(0, 0, w, h);
  mk.x.globalCompositeOperation = 'destination-out';
  mk.x.drawImage(tm.c, 0, 0);                       
  mk.x.globalCompositeOperation = 'source-over';

  
  
  
  
  sp.x.globalCompositeOperation = 'destination-in';
  sp.x.drawImage(mk.c, 0, 0);
  sp.x.globalCompositeOperation = 'source-over';

  const bx = buf.getContext('2d');
  bx.globalCompositeOperation = 'destination-over';
  bx.drawImage(sp.c, 0, 0);
  bx.globalCompositeOperation = 'source-over';
}















let bufCanvas = null;
function makeBuffer(w, h) {
  const need = (v) => Math.ceil(v / 32) * 32;
  if (!bufCanvas || bufCanvas.width < w || bufCanvas.height < h) {
    const nw = Math.max(need(w), bufCanvas ? bufCanvas.width : 0);
    const nh = Math.max(need(h), bufCanvas ? bufCanvas.height : 0);
    bufCanvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(nw, nh)
      : document.createElement('canvas');
    bufCanvas.width = nw;
    bufCanvas.height = nh;
  }
  
  
  
  return bufCanvas;
}

let inkCanvas = null;












function outlineAndBlit(ctx, buf, bw, bh, ox, oy, w, colour) {
  if (!inkCanvas || inkCanvas.width < bw || inkCanvas.height < bh) {
    const nw = Math.max(Math.ceil(bw / 32) * 32, inkCanvas ? inkCanvas.width : 0);
    const nh = Math.max(Math.ceil(bh / 32) * 32, inkCanvas ? inkCanvas.height : 0);
    inkCanvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(nw, nh)
      : document.createElement('canvas');
    inkCanvas.width = nw;
    inkCanvas.height = nh;
  }
  const ix = inkCanvas.getContext('2d');
  ix.setTransform(1, 0, 0, 1, 0, 0);
  ix.globalCompositeOperation = 'source-over';
  ix.clearRect(0, 0, bw, bh);
  ix.drawImage(buf, 0, 0, bw, bh, 0, 0, bw, bh);
  ix.globalCompositeOperation = 'source-in';
  ix.fillStyle = colour;
  ix.fillRect(0, 0, bw, bh);
  ix.globalCompositeOperation = 'source-over';

  
  
  
  
  
  const N = 12;
  for (let k = 0; k < N; k += 1) {
    const a = (k / N) * Math.PI * 2;
    ctx.drawImage(inkCanvas, 0, 0, bw, bh,
      ox + Math.cos(a) * w, oy + Math.sin(a) * w, bw, bh);
  }
  ctx.drawImage(buf, 0, 0, bw, bh, ox, oy, bw, bh);
}

function shade(hex, far) {
  return far ? hex : hex;   
}

function drawLeg(ctx, S, p, K, i, P, b, far) {
  const hip = p(K.hip[i]), kne = p(K.kne[i]), foot = p(K.feet[i]);
  const fill = far ? shadeOf(P.pant) : P.pant;
  const g = far ? FAR_GIRTH : 1;          
  const sh = far ? null : shadeOf(P.pant);
  
  
  
  
  
  
  if (far) {
    const swing = clamp(Math.abs(kne[0] - hip[0]) / (0.20 * S), 0, 1);
    jointMass(ctx, S, hip, kne, 0.066 * b * g, swing, fill, null);
  }
  limb(ctx, S, hip, kne, 0.082 * b * g, 0.060 * b * g, fill, sh);
  
  
  
  
  
  
  const kneeR = { r1: 0.082 * b * g, rj: 0.062 * b * g, r2: 0.060 * b * g, r3: 0.040 * b * g };
  jointBulge(ctx, S, hip, kne, foot, kneeR, fill);
  limb(ctx, S, kne, foot, 0.060 * b * g, 0.040 * b * g, fill, sh);
  jointCrease(ctx, S, hip, kne, foot, kneeR, sh);
  
  ctx.beginPath();
  ctx.moveTo(foot[0] - 0.030 * S, foot[1] - 0.014 * S);
  ctx.lineTo(foot[0] + 0.052 * S, foot[1] - 0.008 * S);
  ctx.lineTo(foot[0] + 0.050 * S, foot[1] + 0.014 * S);
  ctx.lineTo(foot[0] - 0.034 * S, foot[1] + 0.014 * S);
  ctx.closePath();
  ctx.fillStyle = far ? shadeOf(P.accent) : P.accent;
  ctx.fill();
}

























function drawPelvis(ctx, S, p, K, P, b) {
  const hipL = p(K.hip[0]), hipR = p(K.hip[1]);
  
  
  
  
  limb(ctx, S,
    [hipL[0], hipL[1] - 0.020 * S], [hipR[0], hipR[1] - 0.020 * S],
    0.079 * b, 0.079 * b, P.pant, null);
  
  
  const hip = p(K.hip[NEAR]), kne = p(K.kne[NEAR]);
  const swing = clamp(Math.abs(kne[0] - hip[0]) / (0.20 * S), 0, 1);
  jointMass(ctx, S, hip, kne, 0.072 * b, swing, P.pant, shadeOf(P.pant));
}





























function jointMass(ctx, S, root, toward, r, swell, fill, shade) {
  const dx = toward[0] - root[0];
  const dy = toward[1] - root[1];
  const L = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / L;
  const uy = dy / L;
  const R = r * S * (1 + swell * 0.34);
  
  
  
  
  
  
  ctx.save();
  ctx.translate(root[0] + ux * R * 0.62, root[1] + uy * R * 0.62);
  ctx.rotate(Math.atan2(uy, ux));
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.12, R * 0.94, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (shade) {
    ctx.beginPath();
    ctx.ellipse(0, R * 0.34, R * 1.02, R * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = shade;
    ctx.globalAlpha = 0.55;
    ctx.fill();
  }
  ctx.restore();
}













































function flexOf(a, j, c) {
  const ax = a[0] - j[0], ay = a[1] - j[1];
  const cx = c[0] - j[0], cy = c[1] - j[1];
  const la = Math.hypot(ax, ay) || 1e-6;
  const lc = Math.hypot(cx, cy) || 1e-6;
  const ux = ax / la, uy = ay / la;
  const vx = cx / lc, vy = cy / lc;
  const bend = clamp((ux * vx + uy * vy + 1) / 2, 0, 1);
  let bx = ux + vx, by = uy + vy;
  const bl = Math.hypot(bx, by);
  if (bl < 1e-4) { bx = -uy; by = ux; } else { bx /= bl; by /= bl; }
  return { bend, bx, by };
}


function jointBulge(ctx, S, a, j, c, r, fill) {
  const { bend, bx, by } = flexOf(a, j, c);
  const R = r.rj * S;
  ctx.save();
  ctx.translate(j[0] - bx * R * 0.26 * bend, j[1] - by * R * 0.26 * bend);
  ctx.rotate(Math.atan2(-by, -bx));
  ctx.beginPath();
  ctx.ellipse(0, 0, R * (1 + 0.34 * bend), R * (1 + 0.08 * bend), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

















function jointCrease(ctx, S, a, j, c, r, shade) {
  if (!shade) return;
  const { bend, bx, by } = flexOf(a, j, c);
  
  
  
  
  
  
  
  
  
  
  
  
  if (bend < 0.07) return;
  const R = r.rj * S;
  ctx.save();
  
  
  
  
  ctx.beginPath();
  capsulePath(ctx, a, j, r.r1 * S, r.rj * S);
  capsulePath(ctx, j, c, r.r2 * S, r.r3 * S);
  ctx.clip();
  ctx.translate(j[0] + bx * R * 0.72, j[1] + by * R * 0.72);
  ctx.rotate(Math.atan2(by, bx));
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.86 * bend, R * 1.15, 0, 0, Math.PI * 2);
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.60;
  ctx.fill();
  ctx.restore();
}
































































function drawArm(ctx, S, p, K, i, P, b, far, section = 'all') {
  const back = section !== 'front';
  const front = section !== 'back';
  const sh = p(K.sh[i]), elb = p(K.elb[i]), hand = p(K.hands[i]);
  const g = far ? FAR_GIRTH : 1;
  const fill = far ? shadeOf(P.skin) : P.skin;
  
  
  const sd = far ? null : shadeOf(P.skin);
  
  
  const lift = Math.max(0, Math.min(1,
    1 - (elb[1] - sh[1]) / (0.18 * S)));
  
  
  if (back) {
    jointMass(ctx, S, sh, elb, 0.050 * b * g, lift, fill, sd);
    limb(ctx, S, sh, elb, 0.066 * b * g, 0.048 * b * g, fill, sd);
  }
  if (!front) return;
  
  
  
  
  
  
  const elbR = { r1: 0.066 * b * g, rj: 0.052 * b * g, r2: 0.050 * b * g, r3: 0.036 * b * g };
  jointBulge(ctx, S, sh, elb, hand, elbR, fill);
  limb(ctx, S, elb, hand, 0.050 * b * g, 0.036 * b * g, fill, sd);
  jointCrease(ctx, S, sh, elb, hand, elbR, sd);
  
  
  ctx.beginPath();
  ctx.arc(hand[0], hand[1], 0.048 * b * g * S, 0, Math.PI * 2);
  ctx.fillStyle = far ? shadeOf(P.accent) : P.accent;
  ctx.fill();
  if (!far) {
    ctx.beginPath();
    ctx.moveTo(hand[0] - 0.022 * S, hand[1] - 0.012 * S);
    ctx.lineTo(hand[0] + 0.020 * S, hand[1] - 0.018 * S);
    ctx.strokeStyle = P.line;
    ink(ctx, S, 0.012);
  }
}

function drawTorso(ctx, S, p, K, P, b, A) {
  const shL = p(K.sh[0]), shR = p(K.sh[1]);
  const hipL = p(K.hip[0]), hipR = p(K.hip[1]);
  const w = 0.074 * S * b;
  ctx.beginPath();
  ctx.moveTo(shL[0] - w, shL[1] - 0.012 * S);
  ctx.quadraticCurveTo(p(K.chest)[0], p(K.chest)[1] - 0.10 * S,
                       shR[0] + w, shR[1] - 0.012 * S);
  ctx.quadraticCurveTo(shR[0] + w * 1.2, p(K.waist)[1], hipR[0] + w * 0.9,
                       hipR[1] + 0.030 * S);
  ctx.lineTo(hipL[0] - w * 0.9, hipL[1] + 0.030 * S);
  ctx.quadraticCurveTo(shL[0] - w * 1.2, p(K.waist)[1], shL[0] - w,
                       shL[1] - 0.012 * S);
  ctx.closePath();
  ctx.fillStyle = P.top;
  ctx.fill();
  
  
  
  
  
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(shR[0] + w * 0.10, shR[1] - 0.10 * S);
  ctx.quadraticCurveTo(shR[0] + w * 1.4, p(K.waist)[1], hipR[0] + w, hipR[1] + 0.05 * S);
  ctx.lineTo(hipR[0] + w * 1.6, hipR[1] + 0.05 * S);
  ctx.lineTo(shR[0] + w * 1.6, shR[1] - 0.10 * S);
  ctx.closePath();
  
  {
    const gx = ctx.createLinearGradient(p(K.chest)[0], 0, shR[0] + w * 1.6, 0);
    gx.addColorStop(0, rgbaOf(shadeOf(P.top), 0));
    gx.addColorStop(1, rgbaOf(shadeOf(P.top), 0.85));
    ctx.fillStyle = gx;
  }
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(shL[0] - w * 0.9, shL[1] + 0.030 * S);
  ctx.quadraticCurveTo(p(K.chest)[0], p(K.chest)[1] + 0.020 * S,
                       shR[0] + w * 0.9, shR[1] + 0.030 * S);
  ctx.lineTo(shR[0] + w * 0.9, shR[1] - 0.02 * S);
  ctx.lineTo(shL[0] - w * 0.9, shL[1] - 0.02 * S);
  ctx.closePath();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = shadeOf(P.top);
  ctx.fill();
  ctx.restore();
  for (const sh of [shL, shR]) {
    ctx.beginPath();
    ctx.arc(sh[0], sh[1], 0.074 * S * b, 0, Math.PI * 2);
    ctx.fillStyle = P.top;
    ctx.fill();
  }
  
  
  const wz = p(K.waist);
  ctx.beginPath();
  ctx.moveTo(hipL[0] - w * 0.92, wz[1] + 0.020 * S);
  ctx.lineTo(hipR[0] + w * 0.92, wz[1] + 0.014 * S);
  ctx.lineWidth = 0.034 * S;
  ctx.strokeStyle = P.accent;
  ctx.lineCap = 'butt';
  ctx.stroke();
}














function drawHairBack(ctx, S, head, P, A) {
  const r = 0.118 * S;
  const skull = (rx, ry, dy) => {
    ctx.beginPath();
    ctx.ellipse(head[0], head[1] + dy * S, rx * S, ry * S, 0, 0, Math.PI * 2);
    ctx.fillStyle = P.hairLo;
    ctx.fill();
  };
  
  
  const lock = (cx, top, bot, wTop, wBot) => {
    ctx.beginPath();
    ctx.moveTo(head[0] + cx - wTop, head[1] + top);
    ctx.lineTo(head[0] + cx + wTop, head[1] + top);
    ctx.lineTo(head[0] + cx + wBot, head[1] + bot);
    ctx.lineTo(head[0] + cx - wBot, head[1] + bot);
    ctx.closePath();
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    ctx.fillStyle = P.hairLo;
    ctx.fill();
  };

  switch (A.hair) {
    case 'curtain':
      
      
      skull(0.138, 0.150, 0.010);
      lock(-r * 0.94, -r * 0.30, r * 3.30, r * 0.44, r * 0.30);
      lock(r * 0.94, -r * 0.30, r * 3.10, r * 0.44, r * 0.28);
      break;
    case 'tails':
      
      
      skull(0.130, 0.142, 0.010);
      
      
      
      lock(-r * 1.22, -r * 0.55, r * 2.95, r * 0.40, r * 0.11);
      lock(r * 1.22, -r * 0.55, r * 2.95, r * 0.40, r * 0.11);
      break;
    case 'topknot': {
      
      
      
      
      
      
      
      
      
      skull(0.124, 0.136, 0.006);
      lock(r * 0.62, -r * 0.10, r * 3.40, r * 0.26, r * 0.18);
      
      
      
      
      
      
      
      break;
    }
    case 'bob':
      
      skull(0.150, 0.148, 0.026);
      break;
    case 'crop':
      
      
      skull(0.122, 0.128, 0.002);
      break;
    default:
      skull(0.136, 0.146, 0.010);
  }
}

function drawHead(ctx, S, head, neck, P, A, face, tilt = 0) {
  
  
  
  
  limb(ctx, S, neck, [head[0], head[1] + 0.06 * S], 0.040, 0.044, shadeOf(P.skin), null);

  
  
  
  
  
  ctx.save();
  ctx.translate(neck[0], neck[1]);
  ctx.rotate(tilt);
  ctx.translate(-neck[0], -neck[1]);
  
  
  
  
  
  
  
  
  
  
  const JAW = {
    oval:   { cheek: 0.96, chin: 0.86, drop: 0.98, crown: 1.02 },
    taper:  { cheek: 0.94, chin: 0.62, drop: 1.06, crown: 1.00 },
    round:  { cheek: 1.00, chin: 0.92, drop: 0.88, crown: 1.04 },
    square: { cheek: 1.04, chin: 1.00, drop: 0.90, crown: 1.02 },
    long:   { cheek: 0.90, chin: 0.78, drop: 1.16, crown: 0.96 },
    wide:   { cheek: 1.10, chin: 0.94, drop: 0.86, crown: 1.08 },
  };
  const J = JAW[A.jaw] || JAW.oval;
  const r = 0.118 * S;
  ctx.beginPath();
  ctx.moveTo(head[0] - r * J.cheek, head[1] - r * 0.20);
  ctx.quadraticCurveTo(head[0] - r * J.crown, head[1] - r * 1.02,
                       head[0], head[1] - r * 1.06);
  ctx.quadraticCurveTo(head[0] + r * J.crown, head[1] - r * 1.02,
                       head[0] + r * J.cheek, head[1] - r * 0.20);
  ctx.quadraticCurveTo(head[0] + r * J.chin, head[1] + r * J.drop * 0.63,
                       head[0], head[1] + r * J.drop);
  ctx.quadraticCurveTo(head[0] - r * J.chin, head[1] + r * J.drop * 0.63,
                       head[0] - r * J.cheek, head[1] - r * 0.20);
  ctx.closePath();
  ctx.fillStyle = P.skin;
  ctx.fill();
  
  
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(head[0] + r * 0.34, head[1] - r * 1.1);
  ctx.quadraticCurveTo(head[0] + r * 0.52, head[1] + r * 0.2,
                       head[0] + r * 0.20, head[1] + r * 1.1);
  ctx.lineTo(head[0] + r * 1.3, head[1] + r * 1.1);
  ctx.lineTo(head[0] + r * 1.3, head[1] - r * 1.1);
  ctx.closePath();
  {
    const gy = ctx.createLinearGradient(head[0] + r * 0.20, 0, head[0] + r * 1.05, 0);
    gy.addColorStop(0, rgbaOf(shadeOf(P.skin), 0));
    gy.addColorStop(1, rgbaOf(shadeOf(P.skin), 0.80));
    ctx.fillStyle = gy;
  }
  ctx.fill();
  ctx.restore();

  drawFace(ctx, S, head, r, P, A, face);
  drawHairFront(ctx, S, head, r, P, A);
  drawKit(ctx, S, head, r, P, A);
  drawBrows(ctx, S, head, r, P, A, face);
  ctx.restore();
}

function drawFace(ctx, S, head, r, P, A, face) {
  const closed = face === 'hit' || face === 'ko';
  const eyeY = head[1] + r * 0.06;
  const dx = r * 0.44;
  
  
  const eW = r * 0.34 * (A.eye ? A.eye[0] : 1);
  const eH = r * 0.30 * (A.eye ? A.eye[1] : 1)
    * (face === 'shout' ? 1.25 : face === 'smug' ? 0.70 : 1.0);

  for (const s of [-1, 1]) {
    const x = head[0] + s * dx;
    if (closed) {
      
      
      ctx.beginPath();
      ctx.moveTo(x - eW, eyeY);
      ctx.quadraticCurveTo(x, eyeY + eH * 0.55, x + eW, eyeY);
      ctx.strokeStyle = P.line;
      ink(ctx, S, 0.016);
      continue;
    }
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, eyeY, eW, eH, 0, 0, Math.PI * 2);
    ctx.fillStyle = P.white;
    ctx.fill();
    ctx.clip();                       
    const ir = eW * 0.92;
    const g = ctx.createLinearGradient(0, eyeY - ir, 0, eyeY + ir);
    g.addColorStop(0, P.eyeLo);
    g.addColorStop(1, P.eye);
    ctx.beginPath();
    ctx.ellipse(x + s * eW * 0.06, eyeY + eH * 0.10, ir, ir * 1.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + s * eW * 0.06, eyeY + eH * 0.14, ir * 0.40, ir * 0.54, 0, 0, Math.PI * 2);
    ctx.fillStyle = P.line;
    ctx.fill();
    
    
    
    
    
    
    
    
    const lid = Math.max(-0.30, Math.min(0.46, (A.lid || 0) / 8));
    if (lid > 0) {
      ctx.fillStyle = shadeOf(P.skin);
      ctx.fillRect(x - eW, eyeY - eH, eW * 2, eH * 2 * lid);
    }
    
    ctx.beginPath();
    ctx.ellipse(x - s * ir * 0.36, eyeY - ir * 0.44 + eH * lid, ir * 0.32, ir * 0.24, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + s * ir * 0.34, eyeY + ir * 0.42, ir * 0.16, ir * 0.13, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fill();
    ctx.restore();
    
    ctx.beginPath();
    ctx.moveTo(x - eW * 1.04, eyeY - eH * 0.34);
    ctx.quadraticCurveTo(x, eyeY - eH * 1.38, x + eW * 1.06, eyeY - eH * 0.42);
    ctx.strokeStyle = P.line;
    ink(ctx, S, 0.020);
  }

  
  ctx.beginPath();
  ctx.moveTo(head[0] - r * 0.10, head[1] + r * 0.40);
  ctx.lineTo(head[0] - r * 0.02, head[1] + r * 0.46);
  ctx.strokeStyle = shadeOf(P.skin);
  ink(ctx, S, 0.013);
  
  ctx.beginPath();
  if (face === 'shout') {
    ctx.ellipse(head[0], head[1] + r * 0.66, r * 0.20, r * 0.17, 0, 0, Math.PI * 2);
    ctx.fillStyle = P.line;
    ctx.fill();
  } else {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const REST = { set: 0.04, flat: 0.0, smile: 0.24, grim: -0.12, smirk: 0.15 };
    const curve = face === 'smug' ? 0.18
      : face === 'hit' ? -0.20
        : (REST[A.mouth] ?? 0.04);
    
    
    const tilt = (A.mouth === 'smirk' && face === 'set') ? r * 0.06 : 0;
    const wide = A.mouth === 'grim' ? 0.26 : 0.20;
    ctx.moveTo(head[0] - r * wide, head[1] + r * 0.64 + tilt);
    ctx.quadraticCurveTo(head[0], head[1] + r * (0.64 + curve),
                         head[0] + r * wide, head[1] + r * 0.64 - tilt);
    ctx.strokeStyle = P.line;
    
    
    
    
    ink(ctx, S, A.mouth === 'grim' ? 0.012 : 0.009);
  }
}

function drawHairFront(ctx, S, head, r, P, A) {
  
  
  
  
  
  const X = (t) => head[0] + r * t;
  const Y = (t) => head[1] + r * t;
  const fill = (colour) => {
    ctx.closePath();
    ctx.fillStyle = colour;
    ctx.fill();
  };

  
  switch (A.hair) {
    case 'spike': {
      
      
      
      const spikes = [[-1.16, -0.62, -1.62, -1.16], [-0.66, -1.06, -0.94, -1.86],
        [-0.06, -1.20, 0.04, -2.02], [0.60, -1.06, 1.00, -1.78],
        [1.14, -0.60, 1.66, -1.06]];
      ctx.beginPath();
      ctx.moveTo(X(-1.06), Y(-0.16));
      for (const [bx, by, tx, ty] of spikes) {
        ctx.lineTo(X(tx), Y(ty));
        ctx.lineTo(X(bx), Y(by));
      }
      ctx.lineTo(X(1.06), Y(-0.16));
      ctx.quadraticCurveTo(X(0), Y(-0.52), X(-1.06), Y(-0.16));
      fill(P.hair);
      break;
    }
    case 'curtain':
      
      
      ctx.beginPath();
      ctx.moveTo(X(-1.08), Y(-0.10));
      ctx.quadraticCurveTo(X(-1.14), Y(-1.20), X(0), Y(-1.30));
      ctx.quadraticCurveTo(X(1.14), Y(-1.20), X(1.08), Y(-0.10));
      ctx.quadraticCurveTo(X(0.60), Y(-0.62), X(0.04), Y(-0.56));
      ctx.quadraticCurveTo(X(-0.58), Y(-0.62), X(-1.08), Y(-0.10));
      fill(P.hair);
      break;
    case 'tails':
      
      ctx.beginPath();
      ctx.moveTo(X(-1.06), Y(-0.14));
      ctx.quadraticCurveTo(X(-1.16), Y(-1.24), X(0), Y(-1.34));
      ctx.quadraticCurveTo(X(1.16), Y(-1.24), X(1.06), Y(-0.14));
      ctx.quadraticCurveTo(X(0.70), Y(-0.34), X(0.36), Y(-0.72));
      ctx.quadraticCurveTo(X(0.06), Y(-0.30), X(-0.30), Y(-0.74));
      ctx.quadraticCurveTo(X(-0.66), Y(-0.34), X(-1.06), Y(-0.14));
      fill(P.hair);
      break;
    case 'crop':
      
      
      ctx.beginPath();
      ctx.moveTo(X(-1.02), Y(-0.44));
      ctx.quadraticCurveTo(X(-1.10), Y(-1.16), X(0), Y(-1.24));
      ctx.quadraticCurveTo(X(1.10), Y(-1.16), X(1.02), Y(-0.44));
      ctx.lineTo(X(0.86), Y(-0.56));
      ctx.quadraticCurveTo(X(0), Y(-0.76), X(-0.86), Y(-0.56));
      fill(P.hair);
      break;
    case 'topknot':
      
      
      
      
      
      
      
      
      
      
      ctx.beginPath();
      ctx.moveTo(X(-1.02), Y(-0.44));
      ctx.quadraticCurveTo(X(-1.06), Y(-1.18), X(0), Y(-1.26));
      ctx.quadraticCurveTo(X(1.06), Y(-1.18), X(1.02), Y(-0.44));
      ctx.quadraticCurveTo(X(0), Y(-0.86), X(-1.02), Y(-0.44));
      fill(P.hair);
      break;
    default: {
      
      
      ctx.beginPath();
      ctx.moveTo(X(-1.12), Y(-0.12));
      ctx.quadraticCurveTo(X(-1.20), Y(-1.22), X(0), Y(-1.32));
      ctx.quadraticCurveTo(X(1.20), Y(-1.22), X(1.12), Y(-0.12));
      ctx.lineTo(X(0.96), Y(-0.30));
      ctx.lineTo(X(-0.96), Y(-0.30));
      fill(P.hair);
      break;
    }
  }

  
  
  
  
  
  if (A.hair === 'curtain') {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(sx * 1.06), Y(-0.52));
      ctx.lineTo(X(sx * 0.74), Y(-0.34));
      ctx.lineTo(X(sx * 0.84), Y(1.42));
      ctx.lineTo(X(sx * 1.16), Y(0.72));
      fill(P.hair);
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  if (A.hair === 'topknot') {
    
    
    
    
    
    
    
    
    ctx.beginPath();
    ctx.moveTo(X(0.06), Y(-0.94));
    ctx.lineTo(X(0.76), Y(-1.30));
    ctx.lineTo(X(0.34), Y(-0.62));
    ctx.closePath();
    ctx.fillStyle = P.hair;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(X(0.60), Y(-1.28), r * 0.38, r * 0.34, 0, 0, Math.PI * 2);
    fill(P.hair);
  }

  
  
  ctx.beginPath();
  ctx.moveTo(X(-0.68), Y(-0.78));
  ctx.lineTo(X(0.10), Y(-0.96));
  ctx.lineTo(X(0.52), Y(-0.80));
  ctx.lineTo(X(0.06), Y(-0.84));
  ctx.closePath();
  ctx.fillStyle = P.hairHi;
  ctx.fill();
}










function drawKit(ctx, S, head, r, P, A) {
  const X = (t) => head[0] + r * t;
  const Y = (t) => head[1] + r * t;
  switch (A.kit) {
    case 'band':
      ctx.beginPath();
      ctx.moveTo(X(-1.10), Y(-0.30));
      ctx.lineTo(X(1.10), Y(-0.30));
      ctx.lineTo(X(1.08), Y(-0.62));
      ctx.lineTo(X(-1.08), Y(-0.62));
      ctx.closePath();
      ctx.fillStyle = P.accent;
      ctx.fill();
      ctx.strokeStyle = P.line;
      ink(ctx, S);
      break;
    case 'patch': {
      
      
      
      
      
      
      
      
      
      
      ctx.beginPath();
      ctx.ellipse(X(-0.46), Y(0.06), r * 0.46, r * 0.40, -0.12, 0, Math.PI * 2);
      ctx.fillStyle = P.hairLo;
      ctx.fill();
      
      
      
      
      
      
      ctx.beginPath();
      ctx.moveTo(X(-1.16), Y(-0.24));
      ctx.lineTo(X(-0.16), Y(-0.06));
      ctx.strokeStyle = P.accent;
      ink(ctx, S, 0.010);
      break;
    }
    case 'ribbon':
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(X(sx * 1.10), Y(-0.72));
        ctx.lineTo(X(sx * 1.62), Y(-1.02));
        ctx.lineTo(X(sx * 1.66), Y(-0.42));
        ctx.closePath();
        ctx.fillStyle = P.accent;
        ctx.fill();
        ctx.strokeStyle = P.line;
        ink(ctx, S);
      }
      break;
    case 'scar':
      
      
      
      
      ctx.beginPath();
      ctx.moveTo(X(0.30), Y(-0.86));
      ctx.lineTo(X(0.56), Y(0.02));
      ctx.strokeStyle = P.accent;
      ink(ctx, S, 0.020);
      ctx.beginPath();
      ctx.moveTo(X(0.24), Y(-0.50));
      ctx.lineTo(X(0.64), Y(-0.42));
      ctx.strokeStyle = P.accent;
      ink(ctx, S, 0.014);
      break;
    case 'collar':
      
      
      ctx.beginPath();
      ctx.moveTo(X(-0.78), Y(1.18));
      ctx.lineTo(X(0.78), Y(1.18));
      ctx.lineTo(X(0.86), Y(1.62));
      ctx.lineTo(X(-0.86), Y(1.62));
      ctx.closePath();
      ctx.fillStyle = P.accent;
      ctx.fill();
      ctx.strokeStyle = P.line;
      ink(ctx, S);
      break;
    default: {
      
      
      ctx.beginPath();
      ctx.moveTo(X(-1.12), Y(-0.44));
      ctx.lineTo(X(1.12), Y(-0.44));
      ctx.lineTo(X(1.10), Y(-0.86));
      ctx.lineTo(X(-1.10), Y(-0.86));
      ctx.closePath();
      ctx.fillStyle = shadeOf(P.pant);
      ctx.fill();
      ctx.strokeStyle = P.line;
      ink(ctx, S);
      for (const sx of [-0.56, 0.56]) {
        ctx.beginPath();
        ctx.ellipse(X(sx), Y(-0.65), r * 0.30, r * 0.24, 0, 0, Math.PI * 2);
        ctx.fillStyle = P.accent;
        ctx.fill();
        ctx.strokeStyle = P.line;
        ink(ctx, S, 0.012);
      }
      break;
    }
  }
}

function drawBrows(ctx, S, head, r, P, A, face) {
  
  
  
  
  
  
  
  
  const wt = 0.72 + (A.brow ?? 4) * 0.085;
  const y = head[1] - r * 0.34 - r * 0.05 * (A.browLift ?? 0)
    + (face === 'shout' ? -r * 0.10 : 0);
  const ang = A.browAngle + (face === 'smug' ? -0.18 : face === 'hit' ? 0.42 : 0);
  for (const s of [-1, 1]) {
    
    
    
    
    if (A.kit === 'patch' && s === -1) continue;
    const x = head[0] + s * r * 0.44;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-s * ang);
    ctx.beginPath();
    ctx.moveTo(-r * 0.30, r * 0.06 * wt);
    ctx.lineTo(r * 0.32, -r * 0.04 * wt);
    ctx.lineTo(r * 0.30, r * 0.09 * wt);
    ctx.lineTo(-r * 0.30, r * 0.17 * wt);
    ctx.closePath();
    ctx.fillStyle = P.line;
    ctx.fill();
    ctx.restore();
  }
}
