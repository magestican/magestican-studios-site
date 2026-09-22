

































import { MeshData } from '../mesh/meshData.mjs';
import * as S from '../mesh/sdf.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { fbm3 } from '../noise.mjs';
import { linear, SEASONS } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';
import { createSkeleton, kneeBetween, boneIndex } from '../rig/skeleton.mjs';
import { partWeights, rigidWeights, setSkin } from '../rig/skin.mjs';
import { smooth, mix, add, sub, mul, dot, norm, cross, dist, mirror, densify, distToPolyline, strand } from './kit/character.mjs';
import { strandWithMorphs } from './kit/face.mjs';
import { generate as generateVillager } from './villager.mjs';

export const TIER = 'heroCharacter';



export const SPECIES = Object.freeze(['pig', 'human']);
export const PLANNED_SPECIES = Object.freeze(['pig', 'sheep', 'cow', 'goat']);

const VARIANTS = [
  {
    coat: 'pink', skin: '#f2b0ae', snout: '#ef9ba3', blush: '#ea8796', hoof: '#9a6d64', innerEar: '#f59aa6',
    cloth: '#5f86c4', clothBack: '#4c6ea6', stitch: '#f6e7c6', kerchief: '#d9544d', accessory: 'strawHat',
    straw: '#e9c97f', band: '#cf5750', earOut: 1.0,
  },
  {
    coat: 'spotted', skin: '#f5e2d0', snout: '#f0b3ab', blush: '#eda3a2', hoof: '#8c6f67', innerEar: '#f3b3b3', spot: '#8f7a74',
    cloth: '#e3ab45', clothBack: '#c48f33', stitch: '#fff1d6', kerchief: '#4f9d91', accessory: 'bandana',
    bandana: '#d65a50', dots: '#fff1e2', earOut: 0.72,
  },
  {
    
    
    coat: 'berkshire', skin: '#6b5653', pale: '#f3dace', snout: '#f1c6bd', blush: '#c98a8e', hoof: '#d7b6ab', innerEar: '#d99aa0',
    cloth: '#7fae7a', clothBack: '#679266', stitch: '#fff1d6', kerchief: '#efc75e', accessory: 'flower',
    petal: '#f59fb8', petalCentre: '#f7d66a', leaf: '#7fb069', earOut: 0.62,
  },
];

const INK = linear('#2f2638');
const EYE = linear('#1c1d42');
const EYE_LOW = linear('#36498f');
const HIGHLIGHT = linear('#fff8ec');
const NOSTRIL = linear('#6e4a5a'); 
const BRASS = linear('#e3b25a');



const LODS = [
  { body: 0.013, cloth: 0.0095, acc: 0.008, small: 0.0045, clothT: 1250, kerchiefT: 320, scarfT: 420, accT: 520, eyeT: 100, hiT: 16, btnT: 32, sides: 4 },
  { body: 0.014, cloth: 0.01, acc: 0.009, small: 0.0055, clothT: 0, kerchiefT: 0, scarfT: 0, accT: 250, eyeT: 50, hiT: 10, btnT: 14, sides: 3 },
  { body: 0.018, cloth: 0.013, acc: 0.012, small: 0.007, clothT: 0, kerchiefT: 0, scarfT: 0, accT: 0, eyeT: 18, hiT: 8, btnT: 0, sides: 3 },
];

export function generate({ seed = 1, season = 'summer', lod = 0, species = 'pig', build } = {}) {
  if (species === 'human') return generateVillager({ seed, season, lod, species: 'human', role: 'player', build: build ?? 'female' });
  if (!SPECIES.includes(species)) {
    throw new Error(`species '${species}' is not built yet: G2 ships the pig; ${PLANNED_SPECIES.filter((s) => !SPECIES.includes(s)).join(', ')} come later on this rig`);
  }
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const L = LODS[lod];
  if (!L) throw new Error(`unknown lod ${lod}`);
  const budget = budgetFor(TIER, lod);
  const V = VARIANTS[(((seed - 1) % 3) + 3) % 3];
  const rng = new SeededRng(seed * 6271 + 29);
  const jitter = rng.child('pose');
  const fold = jitter.rangeF(0.88, 1.12);
  const tailTurn = jitter.rangeF(-0.25, 0.25);
  const hatTilt = jitter.rangeF(-0.06, 0.06);
  const droop = jitter.rangeF(0.85, 1.15);
  const noiseSeed = seed * 173;
  const fuse = lod > 0;
  const C = Object.fromEntries(Object.entries(V).filter(([, v]) => typeof v === 'string' && v.startsWith('#')).map(([k, v]) => [k, linear(v)]));

  
  const hipL = [0.1, 0.215, 0], ankleL = [0.105, 0.055, 0];
  const kneeL = kneeBetween(hipL, ankleL, 0.015);
  
  
  
  
  const shoulderL = [0.172, 0.43, 0], elbowL = [0.25, 0.362, 0.035], wristL = [0.274, 0.302, 0.06];
  const handL = [0.282, 0.27, 0.072], handTipL = [0.286, 0.246, 0.08];
  const footL = [0.105, 0.045, 0.035];
  const earRootL = [0.19, 0.87, 0.04], earRootR = [-0.188, 0.872, 0.04];
  const tailPts = corkscrew([0, 0.262, -0.19], tailTurn);
  const joints = {
    root: [0, 0, 0], hips: [0, 0.24, -0.01], spine: [0, 0.305, 0], chest: [0, 0.395, -0.005], neck: [0, 0.47, 0], head: [0, 0.525, 0.01],
    earL: earRootL, earR: earRootR,
    armUpperL: shoulderL, armLowerL: elbowL, handL: wristL,
    armUpperR: mirror(shoulderL), armLowerR: mirror(elbowL), handR: mirror(wristL),
    legUpperL: hipL, legLowerL: kneeL, footL: ankleL,
    legUpperR: mirror(hipL), legLowerR: mirror(kneeL), footR: mirror(ankleL),
    tail1: tailPts[0], tail2: tailPts[6], tail3: tailPts[12],
  };

  
  
  
  
  
  
  const snoutAt = { translate: [0.005, 0.608, 0.248], rotate: [Math.PI / 2 - 0.1, 0, 0.04], scale: [1, 1, 0.9] };
  const snout = S.transform(S.roundCylinder([0, 0, 0], 0.084, 0.078, 0.042, 0.028), snoutAt);
  const cranium = S.ellipsoid([0, 0.76, 0], [0.272, 0.245, 0.23]);
  const face = S.union(0.06,
    cranium,
    S.ellipsoid([0.13, 0.625, 0.07], [0.135, 0.11, 0.125]),
    S.ellipsoid([-0.126, 0.63, 0.066], [0.13, 0.112, 0.122]),
    S.ellipsoid([0, 0.55, 0.095], [0.11, 0.07, 0.1]),
  );
  const headParts = [face, snout];
  const skull = S.union(0.028, face, snout);
  const nostrils = S.union(0,
    S.transform(S.ellipsoid([0.03, 0.05, -0.004], [0.016, 0.026, 0.021]), snoutAt),
    S.transform(S.ellipsoid([-0.028, 0.05, -0.002], [0.014, 0.024, 0.019]), snoutAt),
  );

  
  
  const earPiece = (start, dir, face, len, r0, r1) => {
    const Y = norm(dir), Z = norm(sub(face, mul(Y, dot(face, Y)))), X = cross(Y, Z);
    const outer = S.place(S.transform(S.roundCone([0, 0, 0], [0, len, 0], r0, r1), { scale: [1, 1, 0.36] }), start, X, Y, Z);
    const cup = S.place(S.transform(S.roundCone([0, 0.024, 0], [0, len - 0.026, 0], r0 * 0.62, r1 * 0.45), { scale: [1, 1, 0.3], translate: [0, 0, 0.024] }), start, X, Y, Z);
    return { outer, cup, end: add(start, mul(Y, len)) };
  };
  
  
  
  
  
  
  
  const earA0 = earPiece(earRootL, [0.72 * V.earOut, 0.4, 0.56], [0.1, 0.6, 1], 0.12, 0.1, 0.076);
  const earA1 = earPiece(earA0.end, [0.62 * V.earOut, 0.02, 0.78], [0.05, 0.9, 0.5], 0.1, 0.076, 0.034);
  const earB0 = earPiece(earRootR, [-0.72, 0.4, 0.56], [-0.1, 0.6, 1], 0.12, 0.098, 0.074);
  const earB1 = earPiece(earB0.end, [-0.36, -0.5 * fold, 0.79], [-0.05, 0.95, 0.35], 0.1, 0.074, 0.034);
  const earA = { outer: S.union(0.02, earA0.outer, earA1.outer), cup: S.union(0.01, earA0.cup, earA1.cup), end: earA1.end };
  const earROuter = S.union(0.02, earB0.outer, earB1.outer);
  const earNode = (outer, cup) => S.subtract(0.012, outer, S.paint(cup, { color: C.innerEar }), { cutColor: true });
  const tails = {
    head: [0, 0.98, 0], earL: earA.end, earR: earB1.end,
    handL: handTipL, handR: mirror(handTipL), footL: [0.105, 0.03, 0.115], footR: [-0.105, 0.03, 0.115],
    tail3: tailPts[tailPts.length - 1],
  };
  const skeleton = createSkeleton(joints, tails);
  const B = (name) => boneIndex(skeleton, name);

  
  const hipsN = S.ellipsoid([0, 0.245, -0.015], [0.19, 0.13, 0.17]);
  const bellyN = S.ellipsoid([0, 0.31, 0.035], [0.165, 0.14, 0.185]);
  const chestN = S.ellipsoid([0, 0.405, 0], [0.14, 0.1, 0.13]);
  const neckN = S.capsule([0, 0.47, 0], [0, 0.53, 0.01], 0.09);
  const limbParts = (s) => {
    const J = (n) => joints[`${n}${s}`];
    const m = s === 'L' ? (p) => p : mirror;
    return {
      arm: [
        [`armUpper${s}`, S.roundCone(J('armUpper'), J('armLower'), 0.058, 0.052), 0.045],
        [`armLower${s}`, S.roundCone(J('armLower'), J('hand'), 0.052, 0.047), 0.045],
        [`hand${s}`, S.ellipsoid(m(handL), [0.05, 0.054, 0.052]), 0.03],
      ],
      leg: [
        [`legUpper${s}`, S.roundCone(J('legUpper'), J('legLower'), 0.072, 0.062), 0.045],
        [`legLower${s}`, S.roundCone(J('legLower'), J('foot'), 0.062, 0.055), 0.045],
        [`foot${s}`, S.ellipsoid(m(footL), [0.06, 0.045, 0.086]), 0.03],
      ],
    };
  };
  const limbsL = limbParts('L'), limbsR = limbParts('R');
  const tailRad = (i) => 0.017 - 0.008 * (i / (tailPts.length - 1));
  const tailPieces = tailPts.slice(1).map((p, i) => [i < 6 ? 'tail1' : i < 12 ? 'tail2' : 'tail3', S.roundCone(tailPts[i], p, tailRad(i), tailRad(i + 1)), 0.012]);
  const partSpec = [
    ['hips', hipsN, 0.035], ['spine', bellyN, 0.035], ['chest', chestN, 0.03], ['neck', neckN, 0.03],
    ...headParts.map((n) => ['head', n, 0.03]),
    ['earL', earA.outer, 0.02], ['earR', earROuter, 0.02],
    ...limbsL.arm, ...limbsR.arm, ...limbsL.leg, ...limbsR.leg, ...tailPieces,
  ];
  const skinParts = partSpec.map(([bone, node, blend]) => ({ bone: B(bone), node, blend }));
  
  
  const partsFor = (exclude) => skinParts.filter((p) => !exclude.test(skeleton.bones[p.bone].name));
  const parents = skeleton.bones.map((b) => b.parent);

  
  
  const blushAt = [[0.19, 0.7, 0.17], [-0.186, 0.704, 0.166]];
  const eyeAt = [1, -1].map((side) => S.projectToSurface(skull, [side * 0.148, 0.845, 0.45]));
  const handsAt = [handL, mirror(handL)], feetAt = [footL, mirror(footL)];
  const coat = (x, y, z) => {
    const p = [x, y, z];
    const sd = snout.d(x, y, z);
    const onSnout = 1 - smooth(-0.002, 0.012, sd);
    
    const rim = onSnout * smooth(0.075, 0.086, Math.hypot(x - snoutAt.translate[0], (y - snoutAt.translate[1]) / 0.9));
    let blush = 0;
    for (const c of blushAt) blush = Math.max(blush, 1 - smooth(0.022, 0.048, dist(p, c)));
    let hoof = 0;
    for (const c of handsAt) hoof = Math.max(hoof, (1 - smooth(0.065, 0.08, dist(p, c))) * smooth(-0.008, -0.024, y - c[1]));
    for (const c of feetAt) hoof = Math.max(hoof, (1 - smooth(0.1, 0.12, dist(p, c))) * smooth(0.034, 0.018, y));
    let c = C.skin;
    if (V.coat === 'spotted') {
      
      
      const spot = Math.max(
        1 - smooth(0.066, 0.078, dist(p, eyeAt[1])),
        1 - smooth(0.1, 0.115, dist(p, [0.13, 0.3, -0.16])),
        1 - smooth(0.07, 0.082, dist(p, [-0.1, 0.43, -0.11])),
        1 - smooth(0.04, 0.052, dist(p, earA.end)),
      );
      c = mix(c, C.spot, spot * (1 - onSnout));
    }
    if (V.coat === 'berkshire') {
      const socks = smooth(0.1, 0.075, y);
      const tip = 1 - smooth(0.02, 0.035, distToPolyline(p, tailPts.slice(12)));
      let mitt = 0;
      for (const h of handsAt) mitt = Math.max(mitt, 1 - smooth(0.055, 0.07, dist(p, h)));
      c = mix(c, C.pale, Math.max(socks, tip, mitt));
    }
    c = mix(c, C.snout, onSnout);
    c = mix(c, mul(C.snout, 0.86), rim);
    c = mix(c, C.blush, blush * (V.coat === 'berkshire' ? 0.3 : 0.6));
    return mix(c, C.hoof, hoof * 0.85);
  };
  const paint = (node) => S.paint(node, { color: coat });
  const head = S.subtract(0.006, paint(skull), S.paint(nostrils, { color: NOSTRIL }), { cutColor: true });
  const trunk = S.union(0.035, hipsN, bellyN, chestN, neckN);
  const earsNode = S.union(0.02, paint(earNode(earA.outer, earA.cup)), paint(earNode(earROuter, S.union(0.01, earB0.cup, earB1.cup))));
  const core = S.union(0.05, paint(trunk), S.union(0.02, head, earsNode));
  const limb = (parts, k) => paint(S.union(k, parts.map(([, n]) => n)));
  const body = S.union(0.018,
    S.union(0.03, core, limb(limbsL.leg, 0.025), limb(limbsR.leg, 0.025), paint(S.union(0, tailPieces.map(([, n]) => n)))),
    limb(limbsL.arm, 0.022), limb(limbsR.arm, 0.022),
  );

  
  
  
  const wearField = S.union(0.03, S.union(0.035, hipsN, bellyN, chestN), S.union(0, limbsL.leg[0][1], limbsR.leg[0][1]));
  const off = 0.011, thick = 0.0085;
  const clothOuter = S.offset(wearField, off + 2 * thick);
  const hemY = 0.155;
  const waistY = (x, z) => 0.335 + 0.012 * smooth(-0.1, 0.15, z);
  const bibHalf = (y) => 0.098 + 0.018 * smooth(0.46, 0.34, y);
  const onCloth = (pts) => densify(pts.map((q) => S.projectToSurface(clothOuter, q)), 4).map((q) => S.projectToSurface(clothOuter, q));
  const strapL = onCloth([[0.082, 0.462, 0.13], [0.104, 0.495, 0.07], [0.11, 0.505, -0.02], [0.09, 0.455, -0.11], [0.072, 0.36, -0.16]]);
  const strapR = onCloth([[-0.082, 0.462, 0.13], [-0.118 - 0.02 * droop, 0.49, 0.075], [-0.14 - 0.02 * droop, 0.482, -0.01], [-0.11, 0.43, -0.105], [-0.072, 0.36, -0.16]]);
  
  
  const region = (x, y, z) => {
    const shorts = Math.max(y - waistY(x, z), hemY - y);
    const bib = Math.max(0.03 - z, Math.abs(x) - bibHalf(y), y - 0.465, 0.3 - y);
    let r = Math.min(shorts, bib);
    if (r > -0.03 && y > 0.3) {
      const p = [x, y, z];
      r = Math.min(r, Math.min(distToPolyline(p, strapL), distToPolyline(p, strapR)) - 0.021);
    }
    
    return Math.max(r, (0.205 - y) * 0.55 - Math.abs(x) + 0.008);
  };
  const pocketAt = S.projectToSurface(clothOuter, [0.03, 0.385, 0.3]);
  const pocketF = S.frameFromNormal(S.normalAt(clothOuter, ...pocketAt));
  
  
  
  const pocketMask = (p) => {
    const q = sub(p, pocketAt);
    if (Math.abs(dot(q, pocketF.Z)) > 0.05) return 0;
    return smooth(0.058, 0.05, Math.abs(dot(q, pocketF.X))) * smooth(0.045, 0.037, Math.abs(dot(q, pocketF.Y)));
  };
  const folds = (x, y, z) => {
    const m = pocketMask([x, y, z]);
    const drag = fbm3(x * 9, y * 9, z * 9, { seed: noiseSeed + 5, octaves: 2 }) - 0.5;
    const crease = Math.exp(-(((y - 0.2) / 0.05) ** 2)) * smooth(0.02, 0.1, Math.abs(x)) * 0.003 * Math.sin(x * 70 + z * 30);
    return (0.005 * drag + crease) * (1 - m) + 0.0035 * m;
  };
  const clothColor = (x, y, z) => {
    let c = mix(C.clothBack, C.cloth, smooth(-0.12, 0.05, z));
    
    const band = Math.max(smooth(0.03, 0.022, y - hemY), smooth(0.012, 0.004, Math.abs(y - waistY(x, z) + 0.01)));
    c = mix(c, mul(c, 0.8), band);
    
    
    return mix(c, mul(c, 0.84), pocketMask([x, y, z]));
  };
  const dungareesShape = fuse
    ? S.intersect(0.006, S.displace(wearField, (x, y, z) => -(off + 2 * thick) - folds(x, y, z), 0.03), S.field(region))
    : S.intersect(0.006, S.shell(S.displace(wearField, (x, y, z) => -(off + thick) - folds(x, y, z), 0.03), thick), S.field(region));
  const dungarees = S.paint(dungareesShape, { color: clothColor, material: 'cloth' });

  
  let neckwear;
  if (season === 'winter') {
    const red = linear('#d9544d'), cream = linear('#fff1e2');
    const roll = S.transform(S.torus([0, 0, 0], 0.13, 0.045), { translate: [0, 0.495, 0.01], rotate: [0.22, 0, -0.05], scale: [1, 0.78, 1] });
    const tailTop = [-0.07, 0.48, 0.15];
    const tailBot = S.projectToSurface(clothOuter, [-0.1, 0.33, 0.3]);
    const tf = S.frameFromNormal(S.normalAt(clothOuter, ...tailBot), sub(tailTop, tailBot));
    const len = dist(tailTop, tailBot);
    const strip = S.place(S.roundBox([0, -len / 2, 0], [0.042, len / 2 + 0.01, 0.012], 0.011), add(tailTop, mul(tf.Z, 0.03)), tf.X, tf.Y, tf.Z);
    neckwear = S.paint(S.union(0.03, roll, strip), { material: 'cloth', color: (x, y) => (y < 0.45 ? mix(red, cream, smooth(0.6, 0.8, 0.5 + 0.5 * Math.sin(y * 80))) : red) });
  } else {
    const roll = S.transform(S.torus([0, 0, 0], 0.122, 0.028), { translate: [0, 0.478, 0.006], rotate: [0.2, 0, 0.05], scale: [1, 0.72, 1] });
    const flapTop = S.projectToSurface(S.offset(chestN, 0.03), [0.02, 0.47, 0.25]);
    const ff = S.frameFromNormal(S.normalAt(S.offset(chestN, 0.03), ...flapTop), [0.15, 1, 0]);
    const flap = S.place(S.transform(S.roundCone([0, 0, 0], [0, -0.085, 0], 0.052, 0.012), { scale: [1, 1, 0.24] }), add(flapTop, mul(ff.Z, 0.012)), ff.X, ff.Y, ff.Z);
    const knot = S.union(0.012,
      S.ellipsoid([0.098, 0.482, 0.098], [0.03, 0.025, 0.026]),
      S.roundCone([0.105, 0.47, 0.11], [0.13, 0.43, 0.13], 0.016, 0.008),
      S.roundCone([0.1, 0.47, 0.11], [0.11, 0.425, 0.14], 0.014, 0.007),
    );
    const dark = mul(C.kerchief, 0.82);
    neckwear = S.paint(S.union(0.014, roll, flap, knot), {
      material: 'cloth',
      color: (x, y, z) => mix(C.kerchief, dark, smooth(0.6, 0.9, 0.5 + 0.5 * Math.sin(x * 60 + y * 90 + z * 20)) * 0.5),
    });
  }

  
  const skullTop = S.projectToSurface(skull, [0.02, 1.1, -0.03]);
  let accessory, accBone = 'head', accBox;
  if (V.accessory === 'strawHat') {
    
    
    
    const bandColor = (x, y) => mix(C.straw, C.band, smooth(0.014, 0.02, y) * smooth(0.056, 0.05, y));
    const crown = S.roundCylinder([0, 0.056, 0], 0.13, 0.11, 0.056, 0.026);
    const brim = S.warp(S.roundCylinder([0, 0.007, 0], 0.27, 0.27, 0.007, 0.006), (x, y, z) => [x, y + 0.75 * (x * x + z * z) - 0.012, z], 0.07);
    
    
    
    const hat = lod === 2
      ? S.paint(S.roundCylinder([0, 0.05, 0], 0.17, 0.11, 0.05, 0.03), { color: bandColor, material: 'cloth' })
      : S.union(0.016, S.paint(crown, { color: bandColor, material: 'cloth' }), S.paint(brim, { color: C.straw, material: 'cloth' }));
    const n = S.normalAt(skull, ...skullTop);
    accessory = S.transform(hat, { translate: sub(skullTop, mul(n, 0.045)), rotate: [-0.24, 0.3, -0.12 + hatTilt] });
    accBox = [add(skullTop, [-0.36, -0.2, -0.36]), add(skullTop, [0.36, 0.22, 0.36])];
  } else if (V.accessory === 'bandana') {
    
    
    const cap = lod === 2 ? S.offset(cranium, 0.02) : S.shell(S.offset(cranium, 0.014), 0.0075);
    const capShell = S.intersect(0.012, cap, S.plane([0, -1, 0.45], -0.83));
    const knot = S.union(0.012,
      S.ellipsoid([0.1, 0.815, -0.2], [0.032, 0.028, 0.026]),
      S.roundCone([0.105, 0.8, -0.21], [0.15, 0.73, -0.25], 0.017, 0.008),
      S.roundCone([0.095, 0.8, -0.21], [0.09, 0.72, -0.26], 0.015, 0.007),
    );
    const dotted = (x, y, z) => {
      const d = 0.5 + 0.5 * Math.sin(x * 70) * Math.sin(y * 70 + 1.3) * Math.sin(z * 70 + 0.7);
      return mix(C.bandana, C.dots, smooth(0.8, 0.88, d));
    };
    accessory = S.paint(S.union(0.01, capShell, knot), { color: dotted, material: 'cloth' });
    accBox = [[-0.32, 0.62, -0.34], [0.32, 1.04, 0.3]];
  } else {
    
    const at = add(earRootL, [0.03, 0.045, 0.06]);
    const f = S.frameFromNormal(norm([0.45, 0.25, 1]));
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const c = [Math.cos(a) * 0.024, Math.sin(a) * 0.024, 0];
      petals.push(S.transform(S.ellipsoid([0, 0, 0], [0.019, 0.012, 0.006]), { translate: c, rotate: [0, 0, a] }));
    }
    const leaf = S.transform(S.ellipsoid([0, 0, 0], [0.026, 0.01, 0.004]), { translate: [0.02, -0.035, -0.006], rotate: [0, 0, -0.9] });
    const flower = S.union(0.004,
      S.paint(S.union(0.006, petals), { color: C.petal, material: 'cloth' }),
      S.paint(S.sphere([0, 0, 0.004], 0.011), { color: C.petalCentre, material: 'cloth' }),
      S.paint(leaf, { color: C.leaf, material: 'cloth' }),
    );
    accessory = S.place(flower, at, f.X, f.Y, f.Z);
    accBone = 'earL';
    accBox = [sub(at, [0.08, 0.08, 0.08]), add(at, [0.08, 0.08, 0.08])];
  }

  const scene = S.union(0, [body, dungarees, neckwear, accessory]);
  const fusedHat = lod === 2;
  const wearer = fuse ? S.union(0.004, [body, dungarees, neckwear, ...(fusedHat ? [accessory] : [])]) : body;

  
  const md = new MeshData(`player-${species}-${seed}-${season}-lod${lod}`);
  md.parts = [];
  const plan = [];
  const counts = (m) => new Map([...m.groups].map(([k, g]) => [k, g.positions.length / 3]));
  const track = (into, rule, emit) => {
    const before = counts(into);
    emit();
    plan.push({ into, before, after: counts(into), rule });
  };
  const part = (name, node, lo, hi, cell, target, opts, rule, into = md) => {
    if (target <= 0) return;
    track(into, rule, () => md.parts.push({ name, ...S.sdfPart(into, node, { min: lo, max: hi, cell, targetTris: target, ...opts }) }));
  };
  const details = [];
  const detail = (name) => { const d = new MeshData(name); details.push(d); return d; };
  const rigid = (bone) => ({ bone });
  const SOFT = { soft: skinParts };
  
  
  const SHORTS = { soft: partsFor(/^(arm|hand|head|ear|tail|legLower|foot)/) };
  const NECKWEAR = { soft: partsFor(/^(arm|hand|leg|foot|tail|ear|head)/) };

  
  const up = [0, 1, 0];
  for (const side of [1, -1]) {
    const onHead = eyeAt[side > 0 ? 0 : 1];
    const n = norm(add(mul(S.normalAt(skull, ...onHead), 0.72), [0, 0, 0.28]));
    const f = S.frameFromNormal(n, up);
    const ER = [0.037, 0.047, 0.026];
    const lid = (o) => S.plane([side * 0.35, -1, 0], o);
    const eyeC = sub(onHead, mul(n, 0.011));
    const lens = S.place(S.paint(S.intersect(0.007, S.ellipsoid([0, 0, 0], ER), lid(0.036)), { material: 'eye', color: (x, y) => mix(EYE, EYE_LOW, smooth(-0.004, -0.038, y) * 0.8) }), eyeC, f.X, f.Y, f.Z);
    part('eye', lens, sub(eyeC, [0.07, 0.07, 0.07]), add(eyeC, [0.07, 0.07, 0.07]), L.small, L.eyeT, { scene: skull, uvScale: 0.1, material: 'eye', aoMin: 0.7 }, rigid('head'));
    const rimC = sub(eyeC, mul(n, 0.009));
    const rim = S.place(S.paint(S.intersect(0.007, S.ellipsoid([0, 0, 0], [0.043, 0.054, 0.023]), lid(0.042)), { material: 'eye', color: HIGHLIGHT }), rimC, f.X, f.Y, f.Z);
    if (lod < 2) part('eyeRim', rim, sub(rimC, [0.07, 0.07, 0.07]), add(rimC, [0.07, 0.07, 0.07]), L.small, L.eyeT >> 1, { scene: skull, uvScale: 0.1, material: 'eye', aoMin: 0.6 }, rigid('head'));
    const his = [[0.01, 0.016, [0.013, 0.016, 0.005]], [-0.009, -0.018, [0.0065, 0.0065, 0.0035]]];
    for (const [hx, hy, r] of his.slice(0, lod === 2 ? 1 : 2)) {
      const hz = ER[2] * Math.sqrt(Math.max(0, 1 - (hx / ER[0]) ** 2 - (hy / ER[1]) ** 2)) - 0.0015;
      const c = add(eyeC, add(mul(f.X, hx), add(mul(f.Y, hy), mul(f.Z, hz))));
      const hi = S.place(S.paint(S.ellipsoid([0, 0, 0], r), { material: 'eye', color: HIGHLIGHT }), c, f.X, f.Y, f.Z);
      part('highlight', hi, sub(c, [0.03, 0.03, 0.03]), add(c, [0.03, 0.03, 0.03]), Math.min(L.small, 0.0035), L.hiT, { uvScale: 0.1, material: 'eye', aoMin: 1 }, rigid('head'));
    }
  }

  
  if (!fusedHat) part(V.accessory, accessory, accBox[0], accBox[1], L.acc, L.accT, { scene, uvScale: 0.1, material: 'cloth' }, rigid(accBone));

  
  if (!fuse) {
    part('dungarees', dungarees, [-0.3, 0.09, -0.29], [0.3, 0.56, 0.32], L.cloth, L.clothT, { scene, uvScale: 0.1, material: 'cloth' }, SHORTS);
    part(season === 'winter' ? 'scarf' : 'neckerchief', neckwear, [-0.24, 0.26, -0.2], [0.24, 0.6, 0.3], L.cloth, season === 'winter' ? L.scarfT : L.kerchiefT, { scene, uvScale: 0.1, material: 'cloth' }, NECKWEAR);
  }

  
  const onSkin = (p, lift) => {
    const s = S.projectToSurface(skull, p);
    return add(s, mul(S.normalAt(skull, ...s), lift));
  };
  track(md, rigid('head'), () => {
    
    
    
    
    
    
    
    const mouthXY = [[-0.044, 0.514], [-0.021, 0.504], [0, 0.503], [0.021, 0.506], [0.048, 0.52]];
    const mouthPts = (dy) => mouthXY.map(([x, y], i) => onSkin([x, y + dy[i], 0.35], 0.002));
    strandWithMorphs(md, {
      pts: mouthPts([0, 0, 0, 0, 0]), radii: [0.0026, 0.004, 0.0044, 0.004, 0.0024], color: INK, sides: L.sides, material: 'fur',
      morphs: {
        mouthSmile: { pts: mouthPts([0.012, -0.006, -0.008, -0.006, 0.012]) },
        mouthFrown: { pts: mouthPts([-0.01, 0.006, 0.008, 0.006, -0.01]) },
      },
    });
    for (const side of [1, -1]) {
      
      const browXY = [[0.1, 0.938], [0.142, 0.945], [0.184, 0.925]];
      const lift = side < 0 ? 0.005 : 0;
      const browPts = (dy) => browXY.map(([x, y], i) => onSkin([side * x, y + lift + dy[i], 0.5], 0.004));
      strandWithMorphs(md, {
        pts: browPts([0, 0, 0]), radii: [0.0055, 0.008, 0.0032], color: V.coat === 'berkshire' ? mul(C.pale, 0.9) : mul(C.skin, 0.55), sides: L.sides, material: 'fur',
        morphs: {
          browsUp: { pts: browPts([0.012, 0.012, 0.012]) },
          browsDown: { pts: browPts([-0.01, -0.01, -0.01]) },
          browsSad: { pts: browPts([0.01, 0.002, -0.006]) },
        },
      });
    }
  });

  
  if (L.btnT > 0) {
    for (const strap of [strapL, strapR]) {
      const at = strap[0];
      const n = S.normalAt(clothOuter, ...at);
      const f = S.frameFromNormal(n);
      const shape = S.subtract(0.004, S.ellipsoid([0, 0, 0], [0.016, 0.016, 0.008]), S.sphere([0, 0, 0.015], 0.01));
      const btn = S.place(S.paint(shape, { color: BRASS, material: 'metal' }), add(at, mul(n, 0.002)), f.X, f.Y, f.Z);
      const d = detail('button');
      part('button', btn, sub(at, [0.03, 0.03, 0.03]), add(at, [0.03, 0.03, 0.03]), 0.003, L.btnT, { scene: dungarees, uvScale: 0.05, material: 'metal', aoMin: 0.6 }, rigid('chest'), d);
    }
  }

  
  const detailTris = details.reduce((s, d) => s + d.triangleCount, 0);
  const top = fusedHat ? 1.25 : 1.12;
  const groundAO = (x, y, z, c) => mul(c, 0.72 + 0.28 * smooth(0.0, 0.08, y));
  part('body', wearer, [-0.42, -0.05, -0.36], [0.42, top, 0.4], L.body, budget - md.triangleCount - detailTris - 4, {
    scene, uvScale: 0.28, material: 'fur', tint: groundAO, ao: { reach: 0.12, strength: 1.1 }, aoMin: 0.55,
  }, SOFT);

  
  for (const { into, before, after, rule } of plan) {
    for (const [mat, end] of after) {
      const start = before.get(mat) || 0;
      if (end <= start) continue;
      const g = into.groups.get(mat);
      setSkin(g, start, rule.soft ? partWeights(g.positions, rule.soft, { from: start, to: end, parents }) : rigidWeights(end - start, B(rule.bone)));
    }
  }
  for (const d of details) {
    if (md.triangleCount + d.triangleCount > budget) { md.parts.push({ name: `${d.name} (dropped)`, fine: 0, tris: 0 }); continue; }
    md.append(d);
  }

  
  const minY = md.bounds().min[1];
  for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) g.positions[i] -= minY;
  const lift = (p) => [p[0], p[1] - minY, p[2]];
  md.rig = {
    species,
    bones: skeleton.bones.map((b) => ({ ...b, head: lift(b.head), ...(b.tail ? { tail: lift(b.tail) } : {}) })),
    
    contacts: {
      footL: [[0.105, 0, -0.04], [0.105, 0, 0.11]],
      footR: [[-0.105, 0, -0.04], [-0.105, 0, 0.11]],
    },
    
    
    hold: lift([0, 0.44, 0.2]),
  };
  return md;
}



function corkscrew(base, turn) {
  const axis = norm([0, 0.5, -1]);
  const u = norm(cross(axis, [1, 0, 0]));
  const w = cross(axis, u);
  const pts = [];
  const N = 18;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const ang = turn + t * Math.PI * 2 * 1.35;
    const r = 0.026 * smooth(0, 0.3, t);
    pts.push(add(base, add(mul(axis, 0.078 * t), add(mul(u, r * Math.cos(ang)), mul(w, r * Math.sin(ang))))));
  }
  return pts;
}
