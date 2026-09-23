

















































import * as S from '../../../mesh/sdf.mjs';
import { fbm3 } from '../../../noise.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { biped, flap, topShell, knitScarf, unionOf, frontPoint, smooth, mix, add, sub, mul, norm, dist, mirror } from './common.mjs';

export const BUILDS = Object.freeze(['female', 'male']);




const WRIST0 = [0.246, 0.37, 0.055];
const DIGITS0 = {
  thumb: { head: [0.252, 0.338, 0.086], tip: [0.25, 0.31, 0.106], r: [0.0105, 0.009] },
  index: { head: [0.257, 0.308, 0.08], tip: [0.262, 0.265, 0.09], r: [0.0095, 0.0085] },
  middle: { head: [0.258, 0.304, 0.062], tip: [0.263, 0.256, 0.064], r: [0.0095, 0.0085] },
  ring: { head: [0.257, 0.308, 0.044], tip: [0.262, 0.266, 0.036], r: [0.009, 0.008] },
};
const PALM0 = { c: [0.255, 0.33, 0.062], r: [0.021, 0.032, 0.028] };
const MITTEN0 = { c: [0.258, 0.305, 0.064], r: [0.024, 0.042, 0.036] };
const GRIP0 = [0.255, 0.298, 0.064];



const HEAD0 = 0.82;





const BODY = {
  female: {
    
    hip: [0.09, 0.4, 0], ankle: [0.092, 0.07, 0], kneeFwd: 0.02,
    
    
    
    thigh: [0.055, 0.041], shin: [0.04, 0.029],
    foot: { c: [0.092, 0.04, 0.03], r: [0.041, 0.037, 0.072] },
    torso: {
      hips: { c: [0, 0.445, -0.01], r: [0.116, 0.08, 0.094] },
      belly: { c: [0, 0.515, 0.004], r: [0.088, 0.075, 0.08] },
      chest: { c: [0, 0.59, 0.01], r: [0.1, 0.07, 0.09] },
    },
    joints: { hips: [0, 0.43, -0.01], spine: [0, 0.5, 0], chest: [0, 0.575, -0.005], neck: [0, 0.65, 0], head: [0, 0.71, 0.01] },
    shoulder: [0.118, 0.625, 0], elbow: [0.178, 0.51, 0.025], wrist: [0.203, 0.41, 0.05],
    upperArm: [0.031, 0.027], foreArm: [0.027, 0.023], neckR: 0.036, handS: 1,
    headY: 0.885, headS: 0.92, shoeTop: 0.058,
  },
  male: {
    hip: [0.082, 0.4, 0], ankle: [0.084, 0.07, 0], kneeFwd: 0.02,
    thigh: [0.056, 0.047], shin: [0.046, 0.035],
    foot: { c: [0.084, 0.043, 0.034], r: [0.047, 0.042, 0.084] },
    torso: {
      hips: { c: [0, 0.435, -0.01], r: [0.11, 0.08, 0.098] },
      belly: { c: [0, 0.51, 0.01], r: [0.106, 0.08, 0.092] },
      chest: { c: [0, 0.59, 0.004], r: [0.136, 0.08, 0.1] },
    },
    joints: { hips: [0, 0.43, -0.01], spine: [0, 0.5, 0], chest: [0, 0.575, -0.005], neck: [0, 0.65, 0], head: [0, 0.705, 0.01] },
    shoulder: [0.158, 0.63, 0], elbow: [0.218, 0.514, 0.025], wrist: [0.236, 0.414, 0.05],
    upperArm: [0.038, 0.033], foreArm: [0.033, 0.028], neckR: 0.047, handS: 1.04,
    
    headY: 0.878, headS: 0.89, shoeTop: 0.074,
  },
};



const FACE = {
  female: {
    cheeks: [[0.098, 0.748, 0.08, 0.104, 0.086, 0.094], [-0.095, 0.751, 0.078, 0.102, 0.086, 0.092]],
    chin: [0, 0.688, 0.066, 0.07, 0.045, 0.064], nose: [0.004, 0.774, 0.182, 0.016, 0.014, 0.015],
    ER: [0.034, 0.043, 0.024], lashes: true, lips: true, brow: { r: 0.8, arch: 0.014 },
  },
  male: {
    cheeks: [[0.1, 0.742, 0.07, 0.106, 0.086, 0.09], [-0.098, 0.744, 0.068, 0.104, 0.086, 0.088]],
    
    
    chin: [0, 0.672, 0.058, 0.094, 0.056, 0.076], nose: [0.004, 0.77, 0.188, 0.028, 0.023, 0.025],
    ER: [0.028, 0.032, 0.02], lashes: false, lips: false, brow: { r: 1.8, arch: 0.001, dy: -0.014 },
  },
};





const VILLAGER = {
  female: [
    { skin: '#f3cfb6', blush: '#f2b4ae', hair: '#7e5a45', style: 'bunLoose', look: 'dress', dress: '#f0bcc2', trim: '#fff1e2', shoes: '#a07f86', accent: '#b5d9bf', scarf: ['#b3cbeb', '#fff1e2'] },
    { skin: '#d09a76', blush: '#e39a92', hair: '#dcae7a', style: 'longWavy', look: 'cardigan', top: '#cdb8e0', skirt: '#f2d98f', trim: '#fff1e2', shoes: '#857680', accent: '#f0bcc2', scarf: ['#b5d9bf', '#fff1e2'] },
    { skin: '#96674d', blush: '#b8736c', hair: '#4a3a38', style: 'sidePonyR', look: 'apron', dress: '#b3cbeb', apron: '#fff1e2', trim: '#fff1e2', shoes: '#8a7774', accent: '#f0b8a8', scarf: ['#f2d98f', '#fff1e2'] },
  ],
  male: [
    { skin: '#e8bfa3', blush: '#e8b0a4', hair: '#5c4435', style: 'tousled', look: 'shirt', top: '#b5d9bf', trim: '#fff1e2', trousers: '#b09c86', shoes: '#857680', scarf: ['#eba7a7', '#fff1e2'] },
    { skin: '#bd8a68', blush: '#d0907f', hair: '#7d5238', style: 'sidePart', look: 'vest', top: '#fff1e2', vest: '#b3cbeb', trim: '#fff1e2', trousers: '#a9a3bd', shoes: '#8a7774', scarf: ['#f2d38f', '#fff1e2'] },
    { skin: '#7d5540', blush: '#a06a5e', hair: '#46383a', style: 'curlyCrop', beard: true, look: 'shirt', top: '#f0b8a8', trim: '#fff1e2', trousers: '#a3c4a5', shoes: '#7a6b6c', scarf: ['#a8d2c6', '#fff1e2'] },
  ],
};



const PLAYER = {
  female: [
    { skin: '#f6d6c0', blush: '#f4b6b0', hair: '#98694c', style: 'longWavy', cloth: '#a9c4e6', clothBack: '#94b1d8', kerchief: '#e8a3a3', shirt: '#fff1e2', shoes: '#b08c80' },
    { skin: '#c28d6b', blush: '#d8948a', hair: '#654539', style: 'sidePonyL', cloth: '#f2d48e', clothBack: '#e4c277', kerchief: '#9fd0c4', shirt: '#fff1e2', shoes: '#a38a82' },
    { skin: '#8a5d45', blush: '#ae6c66', hair: '#4d3b36', style: 'braids', cloth: '#b3d6b8', clothBack: '#9dc6a4', kerchief: '#f5dca0', shirt: '#fff1e2', shoes: '#8a7774' },
  ],
  male: [
    { skin: '#efc9ad', blush: '#ebb6aa', hair: '#6e5240', style: 'tousled', cloth: '#a9c4e6', clothBack: '#94b1d8', kerchief: '#e8a3a3', shirt: '#fff1e2', shoes: '#b08c80' },
    { skin: '#b8835f', blush: '#cc8b7e', hair: '#8a5238', style: 'sidePart', cloth: '#f2d48e', clothBack: '#e4c277', kerchief: '#9fd0c4', shirt: '#fbeabf', shoes: '#a38a82' },
    { skin: '#744e3b', blush: '#98655a', hair: '#403334', style: 'curlyCrop', beard: true, cloth: '#b3d6b8', clothBack: '#9dc6a4', kerchief: '#f5dca0', shirt: '#fff1e2', shoes: '#8a7774' },
  ],
};

const INK = linear('#35293a');
const BRASS = linear('#e6c486');
const LIP = linear('#b86f7c');
const LIP_SOFT = linear('#e29aa6');



const CRAN0 = S.ellipsoid([0, 0.82, 0], [0.2, 0.19, 0.185]);
const capCut = (front, back) => S.field((x, y, z) => (front + (back - front) * smooth(0.12, -0.14, z)) - y);
const curls = (node, amp, freq, seed) => S.displace(node, (x, y, z) => -amp * (fbm3(x * freq, y * freq, z * freq, { seed, octaves: 2 }) - 0.5), amp * 0.7);



const waves = (node, amp, freq) => S.displace(node, (x, y, z) => -amp * Math.sin(y * freq + Math.atan2(x, z) * 3) * smooth(0.88, 0.74, y), amp);
const chain = (pts, radii, k) => S.union(k, pts.slice(1).map((p, i) => S.roundCone(pts[i], p, radii[i], radii[i + 1])));
const lerp3 = (pts, t) => {
  const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
  return add(pts[i], mul(sub(pts[i + 1], pts[i]), u));
};



function hairStyle(style, sideJ) {
  switch (style) {
    case 'longWavy': {
      
      
      
      const cap = S.intersect(0.02, S.offset(CRAN0, 0.026), capCut(0.875, 0.72));
      const hem = (x, z) => 0.6 + 0.06 * smooth(0.06, 0.16, Math.abs(x)) + 0.012 * Math.sin(Math.atan2(x, -z) * 7);
      const fall = S.intersect(0.035,
        S.ellipsoid([0, 0.77, -0.03], [0.236, 0.26, 0.212]),
        S.field((x, y, z) => Math.max(hem(x, z) - y, z - (0.02 + 0.09 * smooth(0.13, 0.22, Math.abs(x))))));
      const lock = (s, j) => chain([[s * 0.17, 0.9, 0.12], [s * 0.214, 0.8, 0.105], [s * 0.224, 0.7, 0.08], [s * (0.2 + j), 0.615, 0.05]], [0.034, 0.038, 0.034, 0.018], 0.03);
      const fringe = S.transform(S.ellipsoid([0, 0, 0], [0.14, 0.056, 0.078]), { translate: [0.05 + sideJ, 0.94, 0.132], rotate: [0.55, 0, -0.38] });
      return { hair: waves(S.union(0.03, cap, fall, lock(1, 0.012), lock(-1, -0.006), fringe), 0.005, 38), tie: null, ears: 0.72 };
    }
    case 'sidePonyL':
    case 'sidePonyR': {
      
      
      
      
      
      const s = style === 'sidePonyL' ? 1 : -1;
      const cap = S.intersect(0.02, S.offset(CRAN0, 0.026), capCut(0.875, 0.72));
      const fringe = S.transform(S.ellipsoid([0, 0, 0], [0.13, 0.055, 0.075]), { translate: [-s * 0.045 + sideJ, 0.945, 0.135], rotate: [0.5, 0, s * 0.34] });
      const tieAt = [s * 0.165, 0.8, -0.1];
      const tail = chain([[s * 0.12, 0.86, -0.1], tieAt, [s * 0.212, 0.72, -0.06], [s * 0.222, 0.65, -0.018], [s * 0.205, 0.6, 0.018]], [0.04, 0.05, 0.056, 0.044, 0.014], 0.03);
      const lock = chain([[-s * 0.168, 0.87, 0.115], [-s * 0.204, 0.77, 0.11], [-s * 0.196, 0.67, 0.085]], [0.026, 0.024, 0.009], 0.016);
      const tie = S.transform(S.torus([0, 0, 0], 0.047, 0.018), { translate: tieAt, rotate: [0.35, 0, s * -0.75] });
      return { hair: S.union(0.03, cap, fringe, waves(tail, 0.006, 40), lock), tie };
    }
    case 'bunLoose': {
      
      
      const cap = S.intersect(0.02, S.offset(CRAN0, 0.02), capCut(0.875, 0.71));
      const bun = curls(S.ellipsoid([0.035 + sideJ, 0.985, -0.1], [0.08, 0.072, 0.075]), 0.012, 36, 43);
      const wisp = (s, x0, z0, y1) => chain([[s * x0, 0.89, z0], [s * (x0 + 0.036), 0.79, z0 - 0.008], [s * (x0 + 0.032), 0.7, z0 - 0.03], [s * (x0 + 0.014), y1, z0 - 0.045]], [0.02, 0.018, 0.013, 0.005], 0.012);
      const fringe = S.transform(S.ellipsoid([0, 0, 0], [0.11, 0.038, 0.055]), { translate: [0.055 + sideJ, 0.95, 0.14], rotate: [0.5, 0, -0.42] });
      return { hair: S.union(0.03, cap, bun, fringe, wisp(1, 0.166, 0.12, 0.63), wisp(-1, 0.17, 0.115, 0.655)), tie: null };
    }
    case 'braids': {
      
      
      let cap = S.intersect(0.02, S.offset(CRAN0, 0.02), capCut(0.875, 0.69));
      cap = S.subtract(0.008, cap, S.capsule([0.014, 0.975, 0.17], [0.006, 1.035, -0.01], 0.0065));
      const fringe = S.intersect(0.02, S.offset(CRAN0, 0.03), S.field((x, y, z) => Math.max(0.905 - y + 0.02 * Math.abs(x) * 5, 0.05 - z)));
      const bands = [];
      const braid = (s, n) => {
        
        
        const line = [[s * 0.152, 0.79, -0.07], [s * 0.19, 0.735, -0.05], [s * 0.2, 0.69, -0.03], [s * 0.195, 0.648, -0.015]];
        const beads = [];
        for (let i = 0; i < n; i++) {
          const t = i / 7;
          const p = lerp3(line, t);
          const w = (i % 2 ? 1 : -1) * 0.007;
          beads.push(S.ellipsoid(add(p, [w * 0.6, 0, w]), [0.027 - 0.007 * t, 0.026, 0.025 - 0.007 * t]));
        }
        const end = lerp3(line, (n - 1) / 7);
        bands.push(S.transform(S.torus([0, 0, 0], 0.016, 0.007), { translate: add(end, [0, -0.024, 0]) }));
        return S.union(0.014, ...beads, S.roundCone(add(end, [0, -0.026, 0]), add(end, [s * 0.004, -0.058, 0.008]), 0.016, 0.006));
      };
      return { hair: S.union(0.03, cap, fringe, braid(1, 8), braid(-1, 7)), tie: S.union(0, bands) };
    }
    case 'tousled': {
      const cap = S.intersect(0.02, S.offset(CRAN0, 0.02), capCut(0.875, 0.74));
      const tuft = S.transform(S.ellipsoid([0, 0, 0], [0.1, 0.045, 0.07]), { translate: [0.03 + sideJ, 1.0, 0.1], rotate: [0.6, 0.3, 0.25] });
      const hair = S.displace(S.union(0.03, cap, tuft), (x, y, z) => -0.018 * (fbm3(x * 15, y * 15, z * 15, { seed: 47, octaves: 2 }) - 0.5) * smooth(0.82, 0.96, y), 0.012);
      return { hair, tie: null };
    }
    case 'sidePart': {
      const cap = S.intersect(0.02, S.offset(CRAN0, 0.018), capCut(0.885, 0.745));
      const swoop = S.transform(S.ellipsoid([0, 0, 0], [0.15, 0.05, 0.09]), { translate: [0.035 + sideJ, 0.985, 0.095], rotate: [0.32, 0, 0.2] });
      const burns = [1, -1].map((s) => S.ellipsoid([s * 0.19, 0.785, 0.055], [0.018, 0.04, 0.022]));
      const parting = S.capsule([-0.07, 0.99, 0.16], [-0.088, 1.03, -0.02], 0.0065);
      return { hair: S.subtract(0.006, S.union(0.03, cap, swoop, ...burns), parting), tie: null };
    }
    default: { 
      const cap = S.intersect(0.02, S.offset(CRAN0, 0.024), capCut(0.865, 0.73));
      const burns = [1, -1].map((s) => S.ellipsoid([s * 0.19, 0.785, 0.05], [0.02, 0.04, 0.024]));
      return { hair: curls(S.union(0.02, cap, ...burns), 0.016, 34, 49), tie: null };
    }
  }
}

export function human({ season, lod, L, variant, rng, fuse, role = 'villager', build = 'female' }) {
  if (!BUILDS.includes(build)) throw new Error(`unknown human build '${build}' (builds: ${BUILDS.join(', ')})`);
  const player = role === 'player';
  const her = build === 'female';
  const V = (player ? PLAYER : VILLAGER)[build][variant];
  const U = BODY[build], F = FACE[build];
  const C = { skin: linear(V.skin), blush: linear(V.blush), hair: linear(V.hair) };
  const jit = rng.child('pose');
  const sideJ = jit.rangeF(-0.01, 0.01);

  
  const hm = (p) => add(U.wrist, mul(sub(p, WRIST0), U.handS));
  const DIGITS = Object.fromEntries(Object.entries(DIGITS0).map(([k, d]) => [k, { head: hm(d.head), tip: hm(d.tip), r: d.r.map((r) => r * U.handS) }]));
  const palm = { c: hm(PALM0.c), r: PALM0.r.map((r) => r * U.handS) };
  const b = biped({ ...U, hand: { c: palm.c, tip: DIGITS.middle.tip, node: (s, m) => S.ellipsoid(m(palm.c), palm.r) } }, 1);
  const digits = (s) => {
    const m = s === 'L' ? (p) => p : mirror;
    return Object.entries(DIGITS).map(([name, d]) => [`${name}${s}`, S.roundCone(m(d.head), m(d.tip), d.r[0], d.r[1]), 0.012]);
  };
  const digitsL = digits('L'), digitsR = digits('R');
  
  const mitten = (s) => { const m = s === 'L' ? (p) => p : mirror; return S.ellipsoid(m(hm(MITTEN0.c)), MITTEN0.r.map((r) => r * U.handS)); };
  const handGeom = (s) => (lod === 2 ? mitten(s) : unionOf(0.006, s === 'L' ? digitsL : digitsR));

  
  const calf = (s) => {
    const k = b.joints[`legLower${s}`], a = b.joints[`foot${s}`];
    const r = U.shin[0] + 0.004;
    
    
    const [at, ry] = her ? [0.36, 0.08] : [0.44, 0.07];
    return S.ellipsoid(add(add(k, mul(sub(a, k), at)), [0, 0, -0.004]), [r, ry, r]);
  };
  const legL = [...b.L.leg, ['legLowerL', calf('L'), 0.045]];
  const legR = [...b.R.leg, ['legLowerR', calf('R'), 0.045]];

  
  const HS = U.headS, HY = U.headY;
  const HT = (node) => S.transform(node, { translate: [0, HY - HEAD0 * HS, 0], scale: HS });
  const hp = (p) => [p[0] * HS, HY + (p[1] - HEAD0) * HS, p[2] * HS];
  const hy = (y) => HY + (y - HEAD0) * HS;
  const neckN = S.capsule([0, U.joints.neck[1] - 0.012, 0], [0, hy(0.66), 0.01], U.neckR);
  const ell = (e) => S.ellipsoid([e[0], e[1], e[2]], [e[3], e[4], e[5]]);
  const cranium = HT(CRAN0);
  const face = HT(S.union(0.05, CRAN0, ell(F.cheeks[0]), ell(F.cheeks[1]), ell(F.chin), ell(F.nose)));
  const style = hairStyle(V.style, sideJ);
  const earK = style.ears ?? 1;
  const rootL0 = [0.19, 0.81, 0.0], rootR0 = [-0.188, 0.808, 0.002];
  const earL = flap(rootL0, [0.6, 0.8, -0.1], [0.4, 0, 1], { centre: [0, 0.02, 0], r: [0.026 * earK, 0.038 * earK, 0.018] });
  const earR = flap(rootR0, [-0.62, 0.78, -0.08], [-0.4, 0, 1], { centre: [0, 0.02, 0], r: [0.025 * earK, 0.037 * earK, 0.018] });
  const earLN = HT(earL.outer), earRN = HT(earR.outer);

  const hairShape = HT(style.hair);
  let beard = null;
  if (V.beard) {
    
    beard = HT(S.intersect(0.015, S.offset(S.union(0.04, ell(F.chin), ell(F.cheeks[0]), ell(F.cheeks[1])), 0.007), S.field((x, y, z) => Math.max(y - 0.708, -0.02 - z))));
  }
  const hairPaint = (x, y) => {
    let c = mix(C.hair, mul(C.hair, 1.16), smooth(hy(0.9), hy(1.0), y) * 0.6);
    return mix(c, mul(C.hair, 0.86), smooth(hy(0.76), hy(0.6), y) * 0.6);
  };
  const accent = linear(player ? V.kerchief : V.accent || V.trim);
  let hair = S.paint(beard ? S.union(0.01, hairShape, beard) : hairShape, { color: hairPaint, material: 'fur' });
  if (style.tie) hair = S.union(0.004, hair, S.paint(HT(style.tie), { material: 'cloth', color: accent }));

  const joints = {
    ...b.joints,
    earL: hp(rootL0), earR: hp(rootR0),
    tail1: [0, 0.42, -0.1], tail2: [0, 0.42, -0.11], tail3: [0, 0.42, -0.12],
  };
  const tails = { ...b.tails, head: [0, hy(1.08), 0], earL: hp(add(rootL0, mul(earL.Y, 0.05))), earR: hp(add(rootR0, mul(earR.Y, 0.05))), tail3: [0, 0.42, -0.13] };
  const extra = [];
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? (p) => p : mirror;
    for (const [name, d] of Object.entries(DIGITS)) {
      joints[`${name}${s}`] = m(d.head);
      tails[`${name}${s}`] = m(d.tip);
      extra.push([`${name}${s}`, `hand${s}`]);
    }
  }

  
  const torsoN = S.union(0.035, b.hipsN, b.bellyN, b.chestN);
  const upperArm = (s) => (s === 'L' ? b.L.arm : b.R.arm)[0][1];
  const armsN = [unionOf(0, b.L.arm), unionOf(0, b.R.arm)];
  const band = (lo, hi) => S.field((x, y, z) => Math.max(lo - y, y - hi));
  const cloth = (color) => ({ material: 'cloth', color });
  const shade = (c) => (x, y, z) => mix(mul(c, 0.9), c, smooth(-0.1, 0.06, z));
  
  
  const wear = (node, off, lo, hi, color, { cuff = 0.007, top = 0 } = {}) => S.paint(S.intersect(0.004,
    S.displace(node, (x, y, z) => -(off + cuff * smooth(lo + 0.035, lo, y) + top * smooth(hi - 0.02, hi, y)), off + cuff + top),
    band(lo, hi)), cloth(color));
  const armFrame = (s) => {
    const sh = s === 'L' ? b.shoulderL : mirror(b.shoulderL), el = s === 'L' ? b.elbowL : mirror(b.elbowL);
    return { sh, dir: norm(sub(el, sh)) };
  };
  const along = (s, hi) => {
    const { sh, dir } = armFrame(s);
    return S.field((x, y, z) => ((x - sh[0]) * dir[0] + (y - sh[1]) * dir[1] + (z - sh[2]) * dir[2]) - hi);
  };
  
  
  const puffSleeve = (color) => (s) => {
    const { sh, dir } = armFrame(s);
    const c = add(add(sh, mul(dir, 0.045)), [s === 'L' ? 0.008 : -0.008, 0.004, 0]);
    return S.paint(S.intersect(0.008, S.ellipsoid(c, [0.041, 0.047, 0.041]), along(s, 0.078)), cloth(color));
  };
  const cuffSleeve = (color, len) => (s) => S.paint(S.intersect(0.004,
    S.displace(upperArm(s), (x, y, z) => { const { sh, dir } = armFrame(s); const t = (x - sh[0]) * dir[0] + (y - sh[1]) * dir[1] + (z - sh[2]) * dir[2]; return -(0.007 + 0.007 * smooth(len - 0.03, len, t)); }, 0.014),
    along(s, len)), cloth(color));
  const longSleeve = (color) => (s) => {
    const w = s === 'L' ? b.wristL : mirror(b.wristL), el = s === 'L' ? b.elbowL : mirror(b.elbowL);
    const dir = norm(sub(w, el));
    const t = (x, y, z) => (x - w[0]) * dir[0] + (y - w[1]) * dir[1] + (z - w[2]) * dir[2];
    const armNoHand = unionOf(0.02, (s === 'L' ? b.L.arm : b.R.arm).slice(0, 2));
    return S.paint(S.intersect(0.004, S.displace(armNoHand, (x, y, z) => -(0.006 + 0.007 * smooth(-0.045, -0.018, t(x, y, z))), 0.013), S.field((x, y, z) => t(x, y, z) + 0.018)), cloth(color));
  };
  const shoe = (color) => (s, legNodes) => {
    const f = legNodes.find(([bone]) => bone.startsWith('foot'))[1];
    
    
    
    const sole = U.foot.c[1] - U.foot.r[1];
    return S.paint(S.intersect(0.004, S.offset(f, 0.008), S.field((x, y, z) => Math.max(y - U.shoeTop, sole - y))), cloth(color));
  };
  const onLeg = (lo, hi, color, off, opts) => (s, legNodes) => wear(unionOf(0.022, legNodes), off, lo, hi, color, opts);

  
  
  const armWear = [], legWear = [], coreWear = [];
  let TORSO = null, neckPaint = () => 0;
  const cloths = [], fused = [], rigid = [], strands = [];
  const HANDS_OFF = /^(arm|hand|head|ear|tail|leg|foot|thumb|index|middle|ring)/;
  const NECK_OFF = /^(arm|hand|leg|foot|tail|ear|head|thumb|index|middle|ring)/;
  const button = (at, r, bone = 'chest') => {
    const f = S.frameFromNormal(S.normalAt(torsoN, ...at));
    const node = S.place(S.paint(S.subtract(0.003, S.ellipsoid([0, 0, 0], [r, r, r * 0.55]), S.sphere([0, 0, r], r * 0.62)), { color: BRASS, material: 'metal' }), add(at, mul(f.Z, 0.004)), f.X, f.Y, f.Z);
    rigid.push({ name: 'button', node, box: [sub(at, [0.03, 0.03, 0.03]), add(at, [0.03, 0.03, 0.03])], cell: 0.003, tris: 24, bone, material: 'metal', aoMin: 0.6 });
  };
  const armsClear = S.offset(S.union(0, upperArm('L'), upperArm('R')), her ? 0.024 : 0.018);
  const shellTop = (o) => {
    const t = topShell({
      torso: [b.hipsN, b.bellyN, b.chestN], arms: [upperArm('L'), upperArm('R')],
      shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
      sleeve: 0, fuse, ...o,
    });
    return { ...t, node: S.subtract(0.004, t.node, armsClear) };
  };
  
  
  
  const bell = (top, hem, rTop, rHem, zs = 0.9) => S.displace(
    S.transform(S.roundCone([0, top + 0.04, 0], [0, hem - 0.02, 0], rTop, rHem), { translate: [0, 0, -0.01], scale: [1, 1, zs] }),
    (x, y, z) => -0.006 * smooth(top, hem, y) * Math.sin(Math.atan2(x, z) * 11 + 0.4), 0.006);
  const skirt = (bellN, top, hem, color) => S.paint(S.intersect(0.006, bellN, band(hem, top)), cloth(color));
  const outfit = [];
  const pushOutfit = (name, node, box, tris) => {
    outfit.push(node);
    if (fuse) fused.push(node); else cloths.push({ name, node, box, tris, exclude: HANDS_OFF });
  };

  const sleeveOn = (make) => { armWear.push(make); };
  if (player) {
    
    
    const shirt = linear(V.shirt);
    TORSO = shirt;
    neckPaint = () => 0.662;
    sleeveOn(her ? puffSleeve(shirt) : cuffSleeve(shirt, 0.06));
    const bibC = linear(V.cloth), bibBack = linear(V.clothBack);
    const bib = shellTop({
      hemY: () => 0.49, neckY: (x, z) => 0.62 + 0.005 * smooth(0, 0.1, z), armhole: 0.085, off: 0.011, thick: 0.008,
      folds: (x, y, z) => 0.0035 * (fbm3(x * 9, y * 9, z * 9, { seed: 709, octaves: 2 }) - 0.5),
      color: (x, y, z) => mix(bibBack, bibC, smooth(-0.1, 0.05, z)),
    });
    
    const half = her ? 0.066 : 0.08;
    const bibCut = S.intersect(0.006, bib.node, S.field((x, y, z) => Math.abs(x) - half - 0.035 * smooth(0.56, 0.5, y)));
    const strapSide = (s) => [[s * 0.056, 0.615, 0.08], [s * (her ? 0.082 : 0.094), 0.67, 0.01], [s * (her ? 0.078 : 0.09), 0.648, -0.075], [s * 0.056, 0.56, -0.095]];
    const onOuter = (pts) => pts.map((q) => { const p = S.projectToSurface(bib.outer, q); return add(p, mul(S.normalAt(bib.outer, ...p), 0.004)); });
    const strapL = onOuter(strapSide(1)), strapR = onOuter(strapSide(-1));
    for (const strap of [strapL, strapR]) strands.push({ name: 'strap', pts: strap, radii: strap.map(() => 0.01), color: bibC, material: 'cloth', soft: /^(arm|hand|head|ear|tail|leg|foot|thumb|index|middle|ring|neck)/ });
    if (L.accT > 0) for (const strap of [strapL, strapR]) button(strap[0], 0.012);
    if (her) {
      
      const skirtN = skirt(bell(0.52, 0.29, 0.108, 0.172), 0.53, 0.29, bibC);
      const node = S.union(0.006, S.paint(bibCut, cloth((x, y, z) => mix(bibBack, bibC, smooth(-0.1, 0.05, z)))), S.paint(skirtN, cloth((x, y, z) => mix(bibBack, bibC, smooth(-0.12, 0.06, z)))));
      pushOutfit('pinafore', node, [[-0.22, 0.26, -0.2], [0.22, 0.66, 0.2]], L.clothT + 250);
      legWear.push(shoe(linear(V.shoes)));
    } else {
      pushOutfit('dungarees', bibCut, [[-0.18, 0.46, -0.17], [0.18, 0.66, 0.17]], L.clothT);
      
      coreWear.push(wear(b.hipsN, 0.009, 0.3, 0.52, bibC, { cuff: 0 }));
      legWear.push(onLeg(0.155, 0.46, bibC, 0.009, { cuff: 0.009 }));
      legWear.push(shoe(linear(V.shoes)));
    }
    
    if (season !== 'winter') {
      const k = linear(V.kerchief);
      const R = U.neckR + 0.02;
      const roll = S.transform(S.torus([0, 0, 0], R, 0.015), { translate: [0, 0.664, 0.006], rotate: [0.2, 0, 0.05], scale: [1, 0.7, 1] });
      const at = [R * 0.72, 0.66, R * 0.82];
      const tie = her
        ? S.union(0.008,
          S.transform(S.roundCone([0, 0, 0], [0.032, 0.008, 0], 0.007, 0.018), { translate: at, rotate: [0.3, -0.6, 0], scale: [1, 1, 0.6] }),
          S.transform(S.roundCone([0, 0, 0], [-0.028, 0.01, 0], 0.007, 0.016), { translate: at, rotate: [0.3, -0.6, 0], scale: [1, 1, 0.6] }),
          S.ellipsoid(add(at, [0, 0, 0.003]), [0.011, 0.01, 0.009]))
        : S.union(0.01, S.ellipsoid(at, [0.018, 0.015, 0.016]), S.roundCone(add(at, [0.005, -0.01, 0.01]), add(at, [0.018, -0.038, 0.024]), 0.011, 0.006));
      const kerchief = S.paint(S.union(0.01, roll, tie), { material: 'cloth', color: (x, y) => mix(k, mul(k, 0.84), smooth(0.6, 0.9, 0.5 + 0.5 * Math.sin(x * 60 + y * 90)) * 0.4) });
      if (fuse) fused.push(kerchief); else cloths.push({ name: 'neckerchief', node: kerchief, box: [[-0.12, 0.6, -0.1], [0.14, 0.72, 0.14]], tris: L.neckT || 300, exclude: NECK_OFF });
      outfit.push(kerchief);
    }
  } else if (her) {
    const trim = linear(V.trim);
    const roundCollar = () => S.paint(S.intersect(0.01,
      S.transform(S.torus([0, 0, 0], 0.064, 0.017), { translate: [0, 0.668, 0.014], rotate: [0.25, 0, 0.04], scale: [1.1, 0.45, 1] }),
      S.field((x, y, z) => -0.02 - z + 0.05 * smooth(0.04, 0.085, Math.abs(x)))), cloth(trim));
    const folds = (x, y, z) => 0.003 * (fbm3(x * 11, y * 11, z * 11, { seed: 701, octaves: 2 }) - 0.5);
    if (V.look === 'dress' || V.look === 'apron') {
      const D = linear(V.dress);
      TORSO = D;
      const neckY = (x, z) => 0.672 - 0.025 * smooth(0.0, 0.1, z);
      neckPaint = (x, z) => neckY(x, z) - 0.014;
      sleeveOn(puffSleeve(D));
      const bodice = shellTop({ hemY: () => 0.49, neckY, armhole: 0.07, off: 0.008, thick: 0.006, folds, color: shade(D) });
      const hem = V.look === 'apron' ? 0.25 : 0.28;
      const bellN = bell(0.52, hem, 0.108, V.look === 'apron' ? 0.18 : 0.172);
      let node = S.union(0.006, bodice.node, skirt(bellN, 0.53, hem, shade(D)), roundCollar());
      if (V.look === 'apron') {
        
        
        const A = linear(V.apron);
        const pocket = (x, y) => smooth(0.034, 0.028, Math.abs(x - 0.05)) * smooth(0.03, 0.024, Math.abs(y - 0.39));
        
        const panel = S.intersect(0.006, S.offset(bellN, 0.01),
          S.field((x, y, z) => Math.max(Math.abs(x) - 0.085 - 0.045 * smooth(0.5, 0.3, y), 0.02 - z, hem + 0.035 - y, y - 0.515)));
        const apronBib = S.intersect(0.006, S.offset(torsoN, 0.022),
          S.field((x, y, z) => Math.max(Math.abs(x) - 0.055, 0.03 - z, 0.5 - y, y - 0.62)));
        const waist = S.transform(S.torus([0, 0, 0], 0.098, 0.009), { translate: [0, 0.515, -0.004], scale: [1, 1, 0.94] });
        node = S.union(0.004, node, S.paint(S.union(0.006, panel, apronBib, waist), cloth((x, y, z) => mix(A, mul(A, 0.88), pocket(x, y)))));
      }
      pushOutfit(V.look, node, [[-0.24, 0.22, -0.22], [0.24, 0.72, 0.22]], L.clothT + 250);
    } else {
      
      const T = linear(V.top), K = linear(V.skirt);
      TORSO = T;
      const neckY = (x, z) => 0.672 - 0.09 * smooth(0.02, 0.1, z) * smooth(0.075, 0.0, Math.abs(x));
      neckPaint = (x, z) => neckY(x, z) - 0.014;
      sleeveOn(longSleeve(T));
      const cardigan = shellTop({ hemY: () => 0.45, neckY, armhole: 0.07, off: 0.012, thick: 0.007, folds, color: shade(T) });
      const node = S.union(0.006, cardigan.node, skirt(bell(0.5, 0.25, 0.106, 0.168), 0.5, 0.25, shade(K)), roundCollar());
      pushOutfit('cardigan', node, [[-0.23, 0.22, -0.21], [0.23, 0.72, 0.21]], L.clothT + 250);
      if (L.accT > 0) for (const [i, y] of [0.555, 0.51, 0.465].entries()) button(frontPoint(S.offset(torsoN, 0.024), 0.003 * (i - 1), y), 0.009);
      
      legWear.push(onLeg(0.05, 0.21, linear(V.accent), 0.005, { cuff: 0, top: 0.004 }));
    }
    legWear.push(shoe(linear(V.shoes)));
  } else {
    
    const trim = linear(V.trim);
    const T = linear(V.top);
    const folds = (x, y, z) => 0.003 * (fbm3(x * 11, y * 11, z * 11, { seed: 701, octaves: 2 }) - 0.5);
    const shirtNeck = (x, z) => 0.676 - 0.045 * smooth(0.0, 0.1, z);
    TORSO = T;
    sleeveOn(cuffSleeve(T, 0.07));
    const point = (s) => S.transform(S.roundCone([0, 0, 0], [s * 0.028, -0.042, 0.012], 0.013, 0.006), { translate: [s * 0.032, 0.674, 0.07], rotate: [0.35, 0, s * 0.05] });
    const collar = S.paint(S.union(0.008, point(1), point(-1)), cloth(V.look === 'vest' ? T : trim));
    let node;
    if (V.look === 'vest') {
      const W = linear(V.vest);
      const neckY = (x, z) => 0.676 - 0.11 * smooth(0.02, 0.1, z) * smooth(0.085, 0.0, Math.abs(x));
      neckPaint = shirtNeck;
      const vest = shellTop({ hemY: (x, z) => 0.47 - 0.02 * smooth(0.03, 0.1, z) * smooth(0.06, 0, Math.abs(x)), neckY, armhole: 0.088, off: 0.01, thick: 0.007, folds, color: shade(W) });
      node = S.union(0.006, vest.node, collar);
      if (L.accT > 0) for (const [i, y] of [0.555, 0.515, 0.475].entries()) button(frontPoint(S.offset(torsoN, 0.022), 0.003 * (i - 1), y), 0.009);
    } else {
      neckPaint = (x, z) => shirtNeck(x, z) - 0.014;
      const shirt = shellTop({ hemY: () => 0.47, neckY: shirtNeck, armhole: 0.088, off: 0.008, thick: 0.006, folds, color: shade(T) });
      node = S.union(0.006, shirt.node, collar);
      if (L.accT > 0) for (const [i, y] of [0.625, 0.58, 0.535].entries()) button(frontPoint(S.offset(torsoN, 0.02), 0.004 * (i - 1), y), 0.009);
    }
    pushOutfit(V.look, node, [[-0.24, 0.42, -0.2], [0.24, 0.72, 0.22]], L.clothT);
    const TR = linear(V.trousers);
    coreWear.push(wear(b.hipsN, 0.009, 0.3, 0.5, TR, { cuff: 0 }));
    legWear.push(onLeg(0.115, 0.46, TR, 0.009, { cuff: 0.008 }));
    legWear.push(shoe(linear(V.shoes)));
  }

  let scarf = null;
  if (season === 'winter') {
    const colors = (player ? [V.kerchief, '#fff1e2'] : V.scarf).map(linear);
    scarf = knitScarf({ at: [0, 0.668, 0.008], R: U.neckR + 0.03, r: 0.026, tilt: [0.18, 0.04], body: S.offset(torsoN, 0.02), tailSide: 1, tailLen: 0.1, colors });
    if (fuse) fused.push(scarf); else cloths.push({ name: 'scarf', node: scarf, box: [[-0.16, 0.5, -0.13], [0.16, 0.74, 0.19]], tris: L.neckT, exclude: NECK_OFF });
  }

  
  const eyeAt = [1, -1].map((s) => frontPoint(face, s * 0.07 * HS, hy(0.83)));
  const blushAt = [hp([0.12, 0.745, 0.15]), hp([-0.118, 0.748, 0.148])];
  const skinPaint = (x, y, z) => {
    let c = C.skin, m = 'skin';
    if (y > 0.7) {
      let blush = 0;
      for (const q of blushAt) blush = Math.max(blush, 1 - smooth(0.018, 0.042, dist([x, y, z], q)));
      c = mix(c, C.blush, blush * (her ? 0.6 : 0.35));
    } else if (TORSO && y > 0.28 && y < neckPaint(x, z)) {
      
      const tD = torsoN.d(x, y, z);
      if (tD < 0.02 && Math.min(armsN[0].d(x, y, z), armsN[1].d(x, y, z)) > tD - 0.004) { c = TORSO; m = 'cloth'; }
    }
    return { c, m };
  };
  const paintSkin = (n) => ({ d: n.d, s: (x, y, z) => { const r = n.s(x, y, z); const k = skinPaint(x, y, z); return { d: r.d, c: k.c, m: k.m }; }, b: n.b });

  const head = S.union(0.012, paintSkin(face), hair);
  const earsNode = S.union(0.012, paintSkin(earLN), paintSkin(earRN));
  const core = S.union(0.04, S.union(0.004, paintSkin(S.union(0.035, b.hipsN, b.bellyN, b.chestN, neckN)), ...coreWear), S.union(0.02, head, earsNode));
  const legNode = (legs, s) => S.union(0.004, paintSkin(unionOf(0.022, legs)), ...legWear.map((w) => w(s, legs)));
  const arm = (parts, s) => {
    const upper = unionOf(0.02, parts.filter(([bone]) => !bone.startsWith('hand')));
    const skinArm = S.union(0.012, upper, S.union(0.01, parts.find(([bone]) => bone.startsWith('hand'))[1], handGeom(s)));
    return S.union(0.004, paintSkin(skinArm), ...armWear.map((w) => w(s)));
  };
  const body = S.union(0.016,
    S.union(0.025, core, legNode(legL, 'L'), legNode(legR, 'R')),
    arm(b.L.arm, 'L'), arm(b.R.arm, 'R'),
  );
  const headPart = beard ? S.union(0.02, face, hairShape, beard) : S.union(0.02, face, hairShape);
  const parts = [
    ['hips', b.hipsN, 0.035], ['spine', b.bellyN, 0.035], ['chest', b.chestN, 0.03], ['neck', neckN, 0.03],
    ['head', headPart, 0.03], ['earL', earLN, 0.015], ['earR', earRN, 0.015],
    ...b.L.arm, ...b.R.arm, ...legL, ...legR,
    ...(lod === 2 ? [['handL', mitten('L'), 0.02], ['handR', mitten('R'), 0.02]] : [...digitsL, ...digitsR]),
  ];

  
  const onSkin = (x, y, lift) => { const q = frontPoint(face, x * HS, hy(y)); return add(q, mul(S.normalAt(face, ...q), lift)); };
  if (!beard) {
    
    
    
    
    
    
    
    const mouthXs = [-0.035, -0.012, 0.014, 0.04];
    const mouthBaseY = [0.715, 0.703, 0.705, 0.72];
    const mouthPts = (dy, dx = [0, 0, 0, 0]) => mouthXs.map((x, i) => onSkin(x + dx[i], mouthBaseY[i] + dy[i], 0.002));
    const smile = mouthPts([0, 0, 0, 0]);
    const mouthR = [0.0022, 0.0036, 0.0034, 0.002];
    strands.push({
      name: 'smile', pts: smile, radii: mouthR, color: F.lips ? LIP : INK, bone: 'head', material: 'skin',
      morphs: {
        mouthSmile: { pts: mouthPts([0.012, -0.006, -0.006, 0.012]) },
        mouthFrown: { pts: mouthPts([-0.01, 0.006, 0.006, -0.01]) },
        mouthO: { pts: mouthPts([0, -0.010, -0.010, 0],[0.006, 0, 0, -0.006]), radii: mouthR.map((r) => r * 1.3) },
      },
    });
    
    if (F.lips) strands.push({ name: 'lip', pts: [[-0.015, 0.694], [0.001, 0.689], [0.017, 0.695]].map(([x, y]) => onSkin(x, y, 0.002)), radii: [0.0028, 0.0046, 0.0026], color: LIP_SOFT, bone: 'head', material: 'skin' });
  }
  for (const side of [1, -1]) {
    const lift = side < 0 ? 0.006 : 0;
    const by = F.brow.dy ?? 0;
    
    
    
    
    
    const browXs = [0.045, 0.072, 0.1];
    const browBaseY = [0.892 + by, 0.902 + by + F.brow.arch, 0.89 + by];
    const browPts = (dy) => browXs.map((x, i) => onSkin(side * x, browBaseY[i] + dy[i] + lift, 0.004));
    const pts = browPts([0, 0, 0]);
    strands.push({
      name: 'brow', pts, radii: [0.0042, 0.006, 0.0026].map((r) => r * F.brow.r), color: mul(C.hair, 0.85), bone: 'head', material: 'fur',
      morphs: {
        browsUp: { pts: browPts([0.012, 0.012, 0.012]) },
        browsDown: { pts: browPts([-0.01, -0.01, -0.01]) },
        browsSad: { pts: browPts([0.01, 0.002, -0.006]) },
      },
    });
  }
  const ER = F.ER.map((r) => r * HS);
  if (F.lashes) {
    eyeAt.forEach((e, i) => {
      const side = i === 0 ? 1 : -1;
      const n = norm(add(mul(S.normalAt(face, ...e), 0.72), [0, 0, 0.28]));
      const f = S.frameFromNormal(n, [0, 1, 0]);
      const eyeC = sub(e, mul(n, ER[2] * 0.42));
      
      
      const at = (u, v, w) => add(eyeC, add(mul(f.X, side * u), add(mul(f.Y, v), mul(n, w))));
      const line = [2.75, 2.25, 1.65, 1.05, 0.5].map((t) => at(ER[0] * 1.04 * Math.cos(t), Math.min(ER[1] * 0.95 * Math.sin(t), ER[1] * 0.78) + 0.002, ER[2] * 0.62));
      const outer = line[line.length - 1];
      line.push(add(outer, add(mul(f.X, side * 0.013), add(mul(f.Y, 0.009), mul(n, -0.002)))));
      strands.push({ name: 'lashLine', pts: line, radii: [0.0018, 0.003, 0.0038, 0.0042, 0.0036, 0.001], color: INK, bone: 'head', material: 'skin' });
      for (const [j, u] of [0.62, 0.86].entries()) {
        const base = at(ER[0] * u, ER[1] * 0.74, ER[2] * 0.6);
        const tip = add(base, add(mul(f.Y, 0.01 + 0.002 * j), add(mul(f.X, side * 0.009), mul(n, 0.007))));
        strands.push({ name: 'lash', pts: [base, add(mul(add(base, tip), 0.5), mul(n, 0.002)), tip], radii: [0.0022, 0.0016, 0.0006], color: INK, bone: 'head', material: 'skin' });
      }
    });
  }

  
  
  
  const gripAt = hm(GRIP0);
  const axis = norm([0, -0.2, 1]);
  const contacts = {
    ...b.contacts,
    gripL: { bone: 'handL', at: gripAt, axis },
    gripR: { bone: 'handR', at: mirror(gripAt), axis },
  };

  const scene = S.union(0, [body, ...outfit, ...(scarf ? [scarf] : [])]);
  const crown = [S.projectToSurface(S.union(0.02, cranium, hairShape), [0.02, 1.4, -0.02])];
  return {
    joints, tails, extra, parts, body, fused, skull: face, cloth: cloths, rigid, strands, scene, crown,
    blush: { at: blushAt, inner: 0.018, outer: 0.042, pink: C.blush }, 
    eyes: { at: eyeAt, ER },
    bodyBox: [[-0.34, -0.06, -0.34], [0.34, 1.18, 0.3]],
    
    
    
    
    bodyCell: [0.0075, 0.0095, 0.016][lod],
    skinMaterial: 'skin',
    contacts,
    hold: [0, 0.6, 0.2],
    build,
    
    
    gait: { walk: { elbow: 0.45, elbowSwing: 0.4, arm: 0.5 }, run: { elbow: 1.1, stance: 0.21 } },
    
    stretch: { arms: 0.25, legs: 0 },
  };
}
