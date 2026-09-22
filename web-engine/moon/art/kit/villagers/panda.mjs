























import * as S from '../../../mesh/sdf.mjs';
import { fbm3 } from '../../../noise.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { biped, scaler, flap, topShell, knitScarf, spectacles, unionOf, frontPoint, ANIMAL_STRETCH, smooth, mix, add, sub, mul, norm, dist, mirror, distToPolyline } from './common.mjs';


const K = 0.84;
const U = {
  hip: [0.11, 0.235, 0], ankle: [0.112, 0.058, 0], kneeFwd: 0.02,
  thigh: [0.08, 0.07], shin: [0.07, 0.062],
  foot: { c: [0.112, 0.046, 0.035], r: [0.068, 0.048, 0.092] },
  torso: {
    hips: { c: [0, 0.26, -0.015], r: [0.205, 0.14, 0.18] },
    belly: { c: [0, 0.335, 0.035], r: [0.19, 0.165, 0.195] },
    chest: { c: [0, 0.435, 0], r: [0.16, 0.105, 0.14] },
  },
  joints: { hips: [0, 0.25, -0.01], spine: [0, 0.32, 0], chest: [0, 0.415, -0.005], neck: [0, 0.49, 0], head: [0, 0.545, 0.01] },
  
  
  
  
  shoulder: [0.175, 0.45, 0], elbow: [0.295, 0.372, 0.04], wrist: [0.322, 0.3, 0.075],
  
  hand: { kind: 'tip', c: [0.328, 0.27, 0.087], tip: [0.333, 0.24, 0.097], tipR: 0.05 },
  upperArm: [0.06, 0.053], foreArm: [0.053, 0.048],
};







const VARIANTS = [
  { vest: '#f0bcc2', vestBack: '#e3a9b1', trim: '#fff1e2', zip: '#e6c486', accessory: 'bamboo', scarf: ['#b0d6c5', '#fff1e2'], earTilt: 0, patch: 1 },
  { vest: '#b3d4e2', vestBack: '#9dc2d3', trim: '#fbeabf', zip: '#e6c486', accessory: 'glasses', frame: '#a07a66', scarf: ['#f0b8a8', '#fff1e2'], earTilt: 0.16, patch: 0.92 },
  { vest: '#cfc0e8', vestBack: '#bca9dc', trim: '#fff1e2', zip: '#e6c486', accessory: 'bow', bow: '#f2aaa2', scarf: ['#f5dca0', '#bca9dc'], earTilt: -0.14, patch: 1.08 },
];

const WHITE = linear('#faf4ec');
const DARK = linear('#5e5052');
const INNER_EAR = linear('#7a6866');
const NOSE = linear('#4e4244');
const BLUSH = linear('#f5c6c7');
const INK = linear('#3a2f36');

export function panda({ season, lod, L, variant, rng, fuse }) {
  const V = VARIANTS[variant];
  const { P, R } = scaler(K);
  const b = biped(U, K);
  const jit = rng.child('pose');
  const earTilt = V.earTilt + jit.rangeF(-0.04, 0.04);
  const patchJ = V.patch * jit.rangeF(0.97, 1.03);

  
  const neckN = S.capsule(P([0, 0.49, 0]), P([0, 0.555, 0.01]), R(0.1));
  const cranium = S.ellipsoid(P([0, 0.79, -0.01]), [0.285, 0.255, 0.245].map(R));
  const face = S.union(R(0.06),
    cranium,
    S.ellipsoid(P([0.125, 0.67, 0.065]), [0.155, 0.125, 0.14].map(R)),
    S.ellipsoid(P([-0.12, 0.675, 0.06]), [0.15, 0.127, 0.138].map(R)),
    S.ellipsoid(P([0, 0.585, 0.09]), [0.12, 0.07, 0.1].map(R)),
  );
  const muzzle = S.ellipsoid(P([0.006, 0.655, 0.2]), [0.1, 0.072, 0.088].map(R));
  const skull = S.union(R(0.045), face, muzzle);

  
  const rootL = P([0.175, 0.965, -0.02]), rootR = P([-0.172, 0.955, -0.015]);
  const earL = flap(rootL, [0.5, 1, 0.02], [0.2, 0, 1], { centre: [0, R(0.056), 0], r: [0.08, 0.074, 0.04].map(R), cup: [0, R(0.062), R(0.03)], cupR: [0.05, 0.045, 0.02].map(R), inner: INNER_EAR });
  const earR = flap(rootR, [-0.8 + earTilt, 0.86, 0.1], [-0.25, 0, 1], { centre: [0, R(0.052), 0], r: [0.075, 0.07, 0.038].map(R), cup: [0, R(0.058), R(0.028)], cupR: [0.047, 0.042, 0.019].map(R), inner: INNER_EAR });
  const tailN = S.ellipsoid(P([0, 0.27, -0.19]), [0.05, 0.045, 0.04].map(R));

  const joints = {
    ...b.joints,
    earL: rootL, earR: rootR,
    tail1: P([0, 0.27, -0.16]), tail2: P([0, 0.275, -0.19]), tail3: P([0, 0.28, -0.215]),
  };
  const tails = {
    ...b.tails, head: P([0, 1.05, 0]),
    earL: add(rootL, mul(earL.Y, R(0.13))), earR: add(rootR, mul(earR.Y, R(0.12))), tail3: P([0, 0.285, -0.235]),
  };

  
  const eyeAt = [1, -1].map((s) => frontPoint(skull, R(s * 0.132), R(0.79)));
  const torsoD = (x, y, z) => Math.min(b.hipsN.d(x, y, z), b.bellyN.d(x, y, z), b.chestN.d(x, y, z), neckN.d(x, y, z));
  const armsN = [unionOf(0, b.L.arm), unionOf(0, b.R.arm)];
  const legsN = [unionOf(0, b.L.leg), unionOf(0, b.R.leg)];
  const saddle = [b.shoulderL, P([0, 0.475, -0.04]), mirror(b.shoulderL)];
  
  
  
  const patch = (x, y, z, i) => {
    const e = eyeAt[i], side = i === 0 ? 1 : -1;
    const dx = x - (e[0] + side * R(0.028)), dy = y - (e[1] - R(0.032));
    const a = side > 0 ? -0.6 : 0.66;
    const ra = R(0.1) * (side > 0 ? 1 : 1.07) * patchJ, rb = R(0.07) * (side > 0 ? 1 : 1.05);
    
    const u = (dx * Math.cos(a) + dy * Math.sin(a)) / ra;
    const v = (-dx * Math.sin(a) + dy * Math.cos(a)) / (rb * (1 + 0.22 * side * u * Math.sign(Math.cos(a))));
    return (1 - smooth(0.9, 1.04, Math.hypot(u, v))) * smooth(R(0.08), R(0.15), z);
  };
  const blushAt = [P([0.2, 0.66, 0.17]), P([-0.195, 0.665, 0.165])];
  const coat = (x, y, z) => {
    const p = [x, y, z];
    const tD = torsoD(x, y, z);
    let dark = smooth(0.015, -0.015, Math.min(armsN[0].d(x, y, z), armsN[1].d(x, y, z)) - tD);
    dark = Math.max(dark, smooth(0.015, -0.02, Math.min(legsN[0].d(x, y, z), legsN[1].d(x, y, z)) - tD));
    dark = Math.max(dark, smooth(R(0.215), R(0.18), y));
    dark = Math.max(dark, 1 - smooth(R(0.055), R(0.072), distToPolyline(p, saddle)));
    if (y > R(0.85)) dark = Math.max(dark, smooth(0.008, -0.008, Math.min(earL.outer.d(x, y, z), earR.outer.d(x, y, z)) - skull.d(x, y, z)));
    if (z > R(0.05) && y > R(0.68)) dark = Math.max(dark, patch(x, y, z, 0), patch(x, y, z, 1));
    let c = mix(WHITE, DARK, dark);
    let blush = 0;
    for (const q of blushAt) blush = Math.max(blush, 1 - smooth(R(0.024), R(0.052), dist(p, q)));
    c = mix(c, BLUSH, blush * 0.5 * (1 - dark));
    return c;
  };
  const paint = (n) => S.paint(n, { color: coat });

  const earsNode = S.union(0.02, earL.node(paint), earR.node(paint));
  const core = S.union(0.05, paint(S.union(0.035, b.hipsN, b.bellyN, b.chestN, neckN)), S.union(0.02, paint(skull), earsNode));
  const limb = (parts, k) => paint(unionOf(k, parts));
  const body = S.union(0.018,
    S.union(0.03, core, limb(b.L.leg, 0.025), limb(b.R.leg, 0.025), paint(tailN)),
    limb(b.L.arm, 0.022), limb(b.R.arm, 0.022),
  );
  const parts = [
    ['hips', b.hipsN, 0.035], ['spine', b.bellyN, 0.035], ['chest', b.chestN, 0.03], ['neck', neckN, 0.03],
    ['head', skull, 0.03], ['earL', earL.outer, 0.02], ['earR', earR.outer, 0.02],
    ...b.L.arm, ...b.R.arm, ...b.L.leg, ...b.R.leg, ['tail1', tailN, 0.02],
  ];

  
  const C = { vest: linear(V.vest), back: linear(V.vestBack), trim: linear(V.trim) };
  const channel = R(0.058);
  const quilt = (y) => Math.sin(Math.PI * (((y / channel) % 1) + 1) % 1);
  const hemY = () => R(0.2);
  const neckY = (x, z) => R(0.505) - R(0.05) * smooth(R(0.0), R(0.13), z);
  let region = null;
  const vestColor = (x, y, z) => {
    let c = mix(C.back, C.vest, smooth(-0.1, 0.06, z));
    c = mix(mul(c, 0.8), c, smooth(0.0, 0.45, quilt(y)));
    return mix(c, C.trim, smooth(-0.02, -0.011, region(x, y, z)));
  };
  const vest = topShell({
    torso: [b.hipsN, b.bellyN, b.chestN], arms: [b.L.arm[0][1], b.R.arm[0][1]],
    shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
    hemY, neckY, sleeve: 0, armhole: R(0.108), off: 0.013, thick: 0.009,
    folds: (x, y, z) => 0.0052 * Math.pow(quilt(y), 0.6) - 0.0026 + 0.003 * (fbm3(x * 8, y * 8, z * 8, { seed: 71, octaves: 2 }) - 0.5),
    color: vestColor, fuse,
  });
  region = vest.region;

  const cloth = [], fused = [], rigid = [], strands = [];
  const vestBox = [P([-0.3, 0.16, -0.27]), P([0.3, 0.6, 0.3])];
  
  
  if (fuse) fused.push(vest.node); else cloth.push({ name: 'vest', node: vest.node, box: vestBox, tris: L.clothT, exclude: /^(arm|hand|head|ear|tail|legLower|foot)/ });

  
  const zipPts = [];
  for (let i = 0; i <= 8; i++) {
    const y = R(0.215) + (neckY(0, R(0.2)) - R(0.022) - R(0.215)) * (i / 8);
    zipPts.push(S.projectToSurface(vest.outer, [R(0.012), y, R(0.4)]));
  }
  const zipOut = zipPts.map((q) => add(q, mul(S.normalAt(vest.outer, ...q), 0.003)));
  strands.push({ name: 'zip', pts: zipOut, radii: zipOut.map(() => 0.0042), color: linear(V.zip), material: 'metal', soft: /^(arm|hand|head|ear|tail|leg|foot)/ });

  let scarf = null;
  if (season === 'winter') {
    scarf = knitScarf({ at: P([0, 0.53, 0.012]), R: R(0.125), r: R(0.045), tilt: [0.2, -0.05], body: vest.outer, tailSide: -1, tailLen: R(0.17), colors: V.scarf.map(linear) });
    if (fuse) fused.push(scarf); else cloth.push({ name: 'scarf', node: scarf, box: [P([-0.3, 0.3, -0.25]), P([0.3, 0.65, 0.32])], tris: L.neckT, exclude: /^(arm|hand|leg|foot|tail|ear|head)/ });
  }

  
  const noseAt = frontPoint(muzzle, R(0.006), R(0.69));
  const noseN = S.normalAt(muzzle, ...noseAt);
  const nf = S.frameFromNormal(noseN, [0, 1, 0]);
  const nose = S.place(S.paint(S.union(0.01, S.ellipsoid([0, 0, 0], [0.04, 0.026, 0.024].map(R)), S.ellipsoid([0, R(-0.012), 0], [0.02, 0.02, 0.018].map(R))), { material: 'eye', color: NOSE }), add(noseAt, mul(noseN, R(0.004))), nf.X, nf.Y, nf.Z);
  rigid.push({ name: 'nose', node: nose, box: [sub(noseAt, [0.06, 0.06, 0.06]), add(noseAt, [0.06, 0.06, 0.06])], cell: L.small, tris: L.noseT, bone: 'head', material: 'eye', aoMin: 0.8 });

  const onSkin = (p, lift) => { const q = frontPoint(skull, p[0], p[1]); return add(q, mul(S.normalAt(skull, ...q), lift)); };
  
  
  
  
  
  const mouthXY = [[-0.04, 0.624], [-0.02, 0.612], [0.002, 0.618], [0.022, 0.61], [0.046, 0.63]];
  const mouthPts = (dy) => mouthXY.map(([x, y], i) => onSkin(P([x, y + dy[i], 0.4]), 0.002));
  strands.push({
    name: 'mouth', pts: mouthPts([0, 0, 0, 0, 0]), radii: [0.0024, 0.0036, 0.004, 0.0036, 0.0022], color: INK, bone: 'head',
    morphs: {
      mouthSmile: { pts: mouthPts([0.012, -0.004, -0.008, -0.004, 0.012]) },
      mouthFrown: { pts: mouthPts([-0.01, 0.004, 0.008, 0.004, -0.01]) },
    },
  });
  strands.push({ name: 'philtrum', pts: [[0.005, 0.664], [0.003, 0.618]].map(([x, y]) => onSkin(P([x, y, 0.4]), 0.002)), radii: [0.0034, 0.003], color: INK, bone: 'head' });

  
  let accessory = null;
  if (V.accessory === 'bamboo' && L.accT > 0) {
    const at = S.projectToSurface(skull, add(rootL, P([-0.04, -0.035, 0.11])));
    const n = S.normalAt(skull, ...at);
    const f = S.frameFromNormal(n, [0.5, 1, 0]);
    const stem = S.union(0.004,
      S.roundCone(P([-0.05, -0.03, 0]), P([0.0, 0.0, 0.004]), R(0.011), R(0.01)),
      S.roundCone(P([0.0, 0.0, 0.004]), P([0.05, 0.035, 0.006]), R(0.01), R(0.008)),
      S.ellipsoid(P([0, 0, 0.004]), [0.014, 0.008, 0.013].map(R)),
    );
    
    
    const leaf = (c, a, len) => S.transform(S.ellipsoid([0, 0, 0], [len, R(0.014), 0.0075]), { translate: c, rotate: [0.2, 0, a] });
    const sprig = S.union(0.004,
      S.paint(stem, { material: 'cloth', color: (x, y, z) => mix(linear('#bcd89a'), linear('#9cbf7a'), smooth(0.4, 0.9, 0.5 + 0.5 * Math.cos(Math.hypot(x, y) * 190))) }),
      S.paint(S.union(0.003, leaf(P([0.03, 0.045, 0.01]), 0.9, R(0.05)), leaf(P([0.055, 0.02, 0.008]), 0.2, R(0.045)), leaf(P([-0.035, -0.045, 0.006]), -2.4, R(0.04))), { material: 'cloth', color: linear('#9cc58a') }),
    );
    accessory = S.place(sprig, add(at, mul(n, R(0.012))), f.X, f.Y, f.Z);
    rigid.push({ name: 'bamboo', node: accessory, box: [sub(at, [0.1, 0.1, 0.1]), add(at, [0.1, 0.1, 0.1])], cell: L.small, tris: L.accT, bone: 'head', material: 'cloth' });
  } else if (V.accessory === 'glasses' && lod < 2) {
    for (const s of spectacles(eyeAt, skull, { ring: R(0.066), lift: R(0.034), wire: lod === 0 ? 0.0055 : 0.007, templeBack: R(0.16) })) {
      strands.push({ name: 'glasses', ...s, color: linear(V.frame), material: 'metal', bone: 'head' });
    }
  } else if (V.accessory === 'bow' && L.accT > 0) {
    const at = S.projectToSurface(skull, add(rootR, P([0.035, -0.02, 0.085])));
    const n = S.normalAt(skull, ...at);
    const f = S.frameFromNormal(n, [-0.4, 1, 0]);
    const lobe = (sx) => S.transform(S.roundCone([0, 0, 0], [sx * R(0.058), R(0.012), 0], R(0.012), R(0.03)), { scale: [1, 1, 0.55] });
    const tailRib = (sx) => S.transform(S.roundCone([0, 0, 0], [sx * R(0.026), R(-0.05), 0], R(0.011), R(0.013)), { scale: [1, 1, 0.6] });
    const bowShape = S.union(0.008, lobe(1), lobe(-1), tailRib(1), tailRib(-0.7), S.ellipsoid([0, 0, R(0.004)], [0.017, 0.016, 0.012].map(R)));
    const coral = linear(V.bow);
    accessory = S.place(S.paint(bowShape, { material: 'cloth', color: (x, y) => mix(coral, mul(coral, 0.78), smooth(0.6, 0.95, 0.5 + 0.5 * Math.sin(y * 260 + x * 40))) }), add(at, mul(n, R(0.02))), f.X, f.Y, f.Z);
    rigid.push({ name: 'bow', node: accessory, box: [sub(at, [0.09, 0.09, 0.09]), add(at, [0.09, 0.09, 0.09])], cell: L.small, tris: L.accT, bone: 'head', material: 'cloth' });
  }

  const scene = S.union(0, [body, vest.node, ...(scarf ? [scarf] : []), ...(accessory ? [accessory] : [])]);
  const lift = (p) => p;
  return {
    joints, tails, parts, body, fused, skull, cloth, rigid, strands, scene,
    crown: [S.projectToSurface(skull, P([0, 1.3, 0])), S.projectToSurface(earL.outer, add(tails.earL, P([0, 0.2, 0]))), S.projectToSurface(earR.outer, add(tails.earR, P([0, 0.2, 0])))],
    eyes: { at: eyeAt, ER: [0.037, 0.046, 0.026].map(R) },
    bodyBox: [P([-0.45, -0.06, -0.34]), P([0.45, 1.12, 0.4])],
    contacts: b.contacts,
    
    
    hold: lift(P([0, 0.43, 0.25])),
    
    
    
    
    
    
    
    
    
    gait: { walk: { elbow: 0.45, elbowSwing: 0.4, arm: 0.5, tilt: 0.08 }, run: { elbow: 1.1, bob: 0.018 }, pickUp: { drop: 0.72 } },
    
    
    
    stretch: { ...ANIMAL_STRETCH, legs: 0 },
  };
}
