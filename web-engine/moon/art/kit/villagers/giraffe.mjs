
























import * as S from '../../../mesh/sdf.mjs';
import { fbm3 } from '../../../noise.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { biped, flap, topShell, knitScarf, unionOf, frontPoint, ANIMAL_STRETCH, smooth, mix, add, sub, mul, norm, dist, mirror, distToPolyline } from './common.mjs';

const U = {
  
  hip: [0.1, 0.4, 0], ankle: [0.105, 0.07, 0], kneeFwd: 0.02,
  thigh: [0.066, 0.056], shin: [0.052, 0.046],
  foot: { c: [0.105, 0.045, 0.03], r: [0.055, 0.045, 0.085] },
  torso: {
    hips: { c: [0, 0.43, -0.01], r: [0.16, 0.11, 0.14] },
    belly: { c: [0, 0.5, 0.025], r: [0.15, 0.12, 0.15] },
    chest: { c: [0, 0.6, 0], r: [0.13, 0.09, 0.12] },
  },
  joints: { hips: [0, 0.42, -0.01], spine: [0, 0.49, 0], chest: [0, 0.58, -0.005], neck: [0, 0.65, 0], head: [0, 1.16, 0.1] },
  
  
  shoulder: [0.155, 0.62, 0], elbow: [0.235, 0.52, 0.035], wrist: [0.255, 0.43, 0.06],
  hand: { kind: 'tip', c: [0.26, 0.4, 0.07], tip: [0.262, 0.37, 0.08], tipR: 0.04 },
  upperArm: [0.046, 0.042], foreArm: [0.042, 0.038],
};




const VARIANTS = [
  { patch: '#dcae7c', apron: '#b5d9bf', apronBand: '#fff1e2', accessory: 'bowTie', bow: '#e8a0a0', scarf: ['#f0b8a8', '#fff1e2'], earDroop: 0.0 },
  { patch: '#d3a172', apron: '#f0bcc2', apronBand: '#fff1e2', accessory: 'satchel', leather: '#c49d7c', scarf: ['#b3cbeb', '#fff1e2'], earDroop: 0.18 },
  { patch: '#e3b98a', apron: '#f2d98f', apronBand: '#fff1e2', accessory: 'garland', scarf: ['#b5d9bf', '#fff1e2'], earDroop: -0.12 },
];

const CREAM = linear('#f8ecd2');
const PALE = linear('#fdf6e8');
const MANE = linear('#b98b66');
const KNOB = linear('#8a6a58');
const HOOF = linear('#9a7d6c');
const INNER_EAR = linear('#f6ccd0');
const NOSTRIL = linear('#a07f74');
const INK = linear('#35293a');

export function giraffe({ season, lod, L, variant, rng, fuse }) {
  const V = VARIANTS[variant];
  const jit = rng.child('pose');
  const hatTilt = jit.rangeF(-0.06, 0.06);
  const b = biped(U, 1);

  
  
  
  const calf = (s) => {
    const k = b.joints[`legLower${s}`], a = b.joints[`foot${s}`];
    return S.ellipsoid(add(add(k, mul(sub(a, k), 0.38)), [0, 0, -0.004]), [0.056, 0.075, 0.056]);
  };
  const legL = [...b.L.leg, ['legLowerL', calf('L'), 0.045]];
  const legR = [...b.R.leg, ['legLowerR', calf('R'), 0.045]];

  
  const N = [[0, 0.64, 0], [0, 0.8, 0.03], [0, 0.96, 0.065], [0, 1.12, 0.095], [0, 1.2, 0.11]];
  const NR = [0.075, 0.064, 0.056, 0.05, 0.05];
  const neckN = S.roundCone(N[0], N[1], NR[0], NR[1]);
  const neck2N = S.roundCone(N[1], N[2], NR[1], NR[2]);
  const neck3N = S.roundCone(N[2], N[3], NR[2], NR[3]);
  const neckTop = S.roundCone(N[3], N[4], NR[3], NR[4]);

  
  const cranium = S.ellipsoid([0, 1.27, 0.06], [0.15, 0.14, 0.15]);
  const muzzle = S.ellipsoid([0.004, 1.2, 0.2], [0.1, 0.085, 0.12]);
  const face = S.union(0.05,
    cranium, muzzle,
    S.ellipsoid([0.08, 1.225, 0.1], [0.09, 0.08, 0.1]),
    S.ellipsoid([-0.077, 1.228, 0.098], [0.088, 0.08, 0.1]),
    S.ellipsoid([0, 1.33, 0.1], [0.12, 0.07, 0.1]),
  );
  
  const ossi = (base, top, rb, rt, knobR) => S.union(0.014, S.roundCone(base, top, rb, rt), S.sphere(top, knobR));
  const knobs = [[0.078, 1.5, -0.012], [-0.066, 1.495, -0.004]];
  const ossicones = S.union(0,
    ossi([0.05, 1.37, 0.02], knobs[0], 0.024, 0.018, 0.03),
    ossi([-0.048, 1.37, 0.022], knobs[1], 0.023, 0.018, 0.029),
  );
  const nostrils = S.union(0,
    S.sphere(frontPoint(muzzle, 0.03, 1.215), 0.012),
    S.sphere(frontPoint(muzzle, -0.026, 1.213), 0.011),
  );

  
  const rootL = [0.12, 1.34, 0.0], rootR = [-0.118, 1.335, 0.002];
  const earL = flap(rootL, [1, 0.25, -0.2], [0.3, 0.1, 1], { centre: [0, 0.062, 0], r: [0.036, 0.068, 0.017], cup: [0, 0.066, 0.012], cupR: [0.022, 0.046, 0.01], inner: INNER_EAR });
  const earR = flap(rootR, [-1, 0.12 - V.earDroop, -0.22], [-0.3, 0.1, 1], { centre: [0, 0.06, 0], r: [0.035, 0.066, 0.017], cup: [0, 0.064, 0.012], cupR: [0.021, 0.044, 0.01], inner: INNER_EAR });

  
  const TT = [[0, 0.45, -0.14], [0.01, 0.4, -0.18], [0.02, 0.33, -0.2], [0.025, 0.27, -0.2]];
  const tuftC = [0.028, 0.235, -0.2];
  const tailPieces = [
    ['tail1', S.roundCone(TT[0], TT[1], 0.014, 0.012), 0.012],
    ['tail2', S.roundCone(TT[1], TT[2], 0.012, 0.011), 0.012],
    ['tail3', S.union(0.012, S.roundCone(TT[2], TT[3], 0.011, 0.01), S.ellipsoid(tuftC, [0.02, 0.034, 0.02])), 0.012],
  ];

  const joints = {
    ...b.joints,
    neck2: [0, 0.82, 0.035], neck3: [0, 0.99, 0.07],
    earL: rootL, earR: rootR,
    tail1: TT[0], tail2: TT[1], tail3: TT[2],
  };
  const tails = {
    ...b.tails, head: [0, 1.53, 0],
    earL: add(rootL, mul(earL.Y, 0.13)), earR: add(rootR, mul(earR.Y, 0.126)), tail3: [0.028, 0.2, -0.2],
  };
  const extra = [['neck2', 'neck'], ['neck3', 'neck2']];
  const reparent = { head: 'neck3' };

  
  
  const bodyGeom = S.union(0.04, b.hipsN, b.bellyN, b.chestN, neckN, neck2N, neck3N, neckTop, face,
    unionOf(0.02, legL), unionOf(0.02, legR), unionOf(0.02, b.L.arm), unionOf(0.02, b.R.arm));
  const prng = rng.child('patches');
  const seedsPts = [];
  const along = (a, c, t) => add(a, mul(sub(c, a), t));
  const scatter = (count, pick) => {
    for (let i = 0; i < count; i++) {
      const p = pick();
      seedsPts.push(S.projectToSurface(bodyGeom, p));
    }
  };
  const around = (c, r) => () => [c[0] + prng.rangeF(-r[0], r[0]), c[1] + prng.rangeF(-r[1], r[1]), c[2] + prng.rangeF(-r[2], r[2])];
  
  
  scatter(16, () => { const q = along(N[0], N[4], prng.rangeF(0, 1)); const a = prng.rangeF(0, Math.PI * 2); return add(q, [Math.cos(a) * 0.12, prng.rangeF(-0.02, 0.02), Math.sin(a) * 0.12]); });
  scatter(12, around([0, 0.52, 0], [0.22, 0.14, 0.2]));
  for (const s of [1, -1]) {
    scatter(3, () => { const q = along([s * 0.1, 0.4, 0], [s * 0.105, 0.07, 0], prng.rangeF(0, 0.5)); const a = prng.rangeF(0, Math.PI * 2); return add(q, [Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1]); });
  }
  scatter(3, around([0, 1.3, 0.02], [0.13, 0.06, 0.1]));
  const armsN = [unionOf(0, b.L.arm), unionOf(0, b.R.arm)];
  const torsoN = S.union(0.035, b.hipsN, b.bellyN, b.chestN);
  const tints = seedsPts.map(() => prng.rangeF(0.9, 1.08));
  const PATCH = linear(V.patch);
  const cell = (p) => {
    let d1 = Infinity, d2 = Infinity, i1 = 0;
    for (let i = 0; i < seedsPts.length; i++) {
      const d = dist(p, seedsPts[i]);
      if (d < d1) { d2 = d1; d1 = d; i1 = i; } else if (d < d2) d2 = d;
    }
    return { edge: d2 - d1, i: i1 };
  };

  
  const eyeAt = [1, -1].map((s) => frontPoint(face, s * 0.085, 1.29));
  const maneLine = [N[0].map((v, k) => (k === 2 ? v - 0.07 : v)), [0, 0.95, -0.005], [0.006, 1.2, 0.02], [0.004, 1.31, -0.06]];
  const coat = (x, y, z) => {
    const p = [x, y, z];
    const c0 = y > 1.13 && z > 0.12 ? PALE : CREAM;
    let c = c0;
    
    const faceFront = smooth(1.13, 1.17, y) * smooth(0.1, 0.16, z);
    const bellyFront = smooth(0.12, 0.17, z) * smooth(0.4, 0.44, y) * (1 - smooth(0.6, 0.64, y));
    const lowLeg = 1 - smooth(0.1, 0.2, y);
    const onArm = y > 0.3 && y < 0.7 && Math.abs(x) > 0.1 ? smooth(0.015, -0.015, Math.min(armsN[0].d(x, y, z), armsN[1].d(x, y, z)) - torsoN.d(x, y, z)) : 0;
    const keep = (1 - faceFront) * (1 - bellyFront) * (1 - lowLeg) * (1 - onArm);
    if (keep > 0.01) {
      const { edge, i } = cell(p);
      
      const inPatch = smooth(0.03, 0.042, edge);
      c = mix(c, mul(PATCH, tints[i]), inPatch * keep);
    }
    
    if (y > 0.62 && z < 0.05) c = mix(c, MANE, (1 - smooth(0.018, 0.028, distToPolyline(p, maneLine))) * smooth(0.64, 0.7, y));
    
    for (const k of knobs) c = mix(c, KNOB, 1 - smooth(0.026, 0.036, dist(p, k)));
    if (y < 0.06) c = mix(c, HOOF, smooth(0.05, 0.03, y));
    if (y < 0.3 && z < -0.15) c = mix(c, KNOB, 1 - smooth(0.02, 0.036, dist(p, tuftC)));
    return c;
  };
  const paint = (n) => S.paint(n, { color: coat });
  const headGeom = S.subtract(0.005, paint(S.union(0.03, face, ossicones)), S.paint(nostrils, { color: NOSTRIL }), { cutColor: true });
  const earsNode = S.union(0.018, earL.node(paint), earR.node(paint));
  const neckAll = S.union(0.03, neckN, neck2N, neck3N, neckTop);
  const core = S.union(0.04, paint(S.union(0.035, b.hipsN, b.bellyN, b.chestN)), paint(neckAll), S.union(0.025, headGeom, earsNode));
  const limb = (parts, k) => paint(unionOf(k, parts));
  const body = S.union(0.016,
    S.union(0.025, core, limb(legL, 0.022), limb(legR, 0.022), paint(unionOf(0.01, tailPieces))),
    limb(b.L.arm, 0.02), limb(b.R.arm, 0.02),
  );
  const parts = [
    ['hips', b.hipsN, 0.035], ['spine', b.bellyN, 0.035], ['chest', b.chestN, 0.03],
    ['neck', neckN, 0.04], ['neck2', neck2N, 0.04], ['neck3', neck3N, 0.04],
    ['head', S.union(0.03, face, ossicones, neckTop), 0.035], ['earL', earL.outer, 0.02], ['earR', earR.outer, 0.02],
    ...b.L.arm, ...b.R.arm, ...legL, ...legR, ...tailPieces,
  ];

  
  const A = { main: linear(V.apron), band: linear(V.apronBand) };
  const hemY = () => 0.425;
  const neckY = (x, z) => 0.665 + 0.01 * smooth(0.0, 0.1, z);
  const pocketC = [0.045, 0.49];
  const pocketMask = (x, y, z) => (z > 0.05 ? smooth(0.05, 0.042, Math.abs(x - pocketC[0])) * smooth(0.042, 0.034, Math.abs(y - pocketC[1])) : 0);
  const apronColor = (x, y, z) => {
    let c = mix(mul(A.main, 0.9), A.main, smooth(-0.02, 0.08, z));
    c = mix(c, A.band, smooth(0.6, 0.62, y));
    return mix(c, mul(c, 0.86), pocketMask(x, y, z));
  };
  const apronShell = topShell({
    torso: [b.hipsN, b.bellyN, b.chestN], arms: [b.L.arm[0][1], b.R.arm[0][1]],
    shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
    hemY, neckY, sleeve: 0, armhole: 0.1, off: 0.01, thick: 0.008,
    folds: (x, y, z) => 0.0035 * (fbm3(x * 10, y * 10, z * 10, { seed: 523, octaves: 2 }) - 0.5) + 0.004 * pocketMask(x, y, z),
    color: apronColor, fuse,
  });
  
  const apronNode = S.intersect(0.006, apronShell.node, S.field((x, y, z) => -0.01 - z));

  const cloth = [], fused = [], rigid = [], strands = [];
  if (fuse) fused.push(apronNode);
  else cloth.push({ name: 'apron', node: apronNode, box: [[-0.26, 0.36, -0.08], [0.26, 0.74, 0.27]], tris: L.clothT, exclude: /^(arm|hand|head|ear|tail|leg|foot|neck2|neck3)/ });

  
  const onField = (field, pts, lift) => pts.map((q) => { const s = S.projectToSurface(field, q); return add(s, mul(S.normalAt(field, ...s), lift)); });
  const strapField = S.union(0.03, neckN, b.chestN);
  const strap = onField(strapField, [[0.085, 0.665, 0.1], [0.08, 0.72, 0.03], [0.03, 0.75, -0.07], [-0.03, 0.75, -0.07], [-0.08, 0.72, 0.03], [-0.085, 0.665, 0.1]], 0.012);
  strands.push({ name: 'strap', pts: strap, radii: strap.map(() => 0.0075), color: A.main, material: 'cloth', soft: /^(arm|hand|head|ear|tail|leg|foot|neck3)/ });
  const tieField = S.union(0.035, b.hipsN, b.bellyN);
  const tie = onField(tieField, [[0.15, 0.45, 0.02], [0.13, 0.46, -0.1], [0.04, 0.47, -0.15], [0.0, 0.47, -0.15]], 0.01);
  strands.push({ name: 'tie', pts: tie, radii: tie.map(() => 0.007), color: A.main, material: 'cloth', soft: /^(arm|hand|head|ear|tail|leg|foot|neck)/ });
  const tie2 = onField(tieField, [[-0.15, 0.45, 0.02], [-0.13, 0.46, -0.1], [-0.02, 0.47, -0.15], [0.03, 0.44, -0.17]], 0.01);
  strands.push({ name: 'tie', pts: tie2, radii: tie2.map(() => 0.007), color: A.main, material: 'cloth', soft: /^(arm|hand|head|ear|tail|leg|foot|neck)/ });

  let scarf = null;
  if (season === 'winter') {
    scarf = knitScarf({ at: [0, 0.72, 0.01], R: 0.1, r: 0.042, tilt: [0.15, 0.05], body: S.union(0.03, apronShell.outer, neckN), tailSide: -1, tailLen: 0.14, colors: V.scarf.map(linear) });
    if (fuse) fused.push(scarf); else cloth.push({ name: 'scarf', node: scarf, box: [[-0.22, 0.52, -0.18], [0.22, 0.82, 0.24]], tris: L.neckT, exclude: /^(arm|hand|leg|foot|tail|ear|head|neck3)/ });
  }

  
  const onSkin = (x, y, lift) => { const q = frontPoint(face, x, y); return add(q, mul(S.normalAt(face, ...q), lift)); };
  
  
  
  
  
  
  const mouthXY = [[-0.04, 1.15], [-0.012, 1.14], [0.018, 1.143], [0.045, 1.156]];
  const mouthPts = (dy) => mouthXY.map(([x, y], i) => onSkin(x, y + dy[i], 0.002));
  strands.push({
    name: 'smile', pts: mouthPts([0, 0, 0, 0]), radii: [0.0024, 0.0038, 0.0036, 0.002], color: INK, bone: 'head',
    morphs: {
      mouthSmile: { pts: mouthPts([0.012, -0.006, -0.006, 0.012]) },
      mouthFrown: { pts: mouthPts([-0.01, 0.006, 0.006, -0.01]) },
    },
  });
  
  const ER = [0.032, 0.04, 0.022];
  eyeAt.forEach((e, i) => {
    const side = i === 0 ? 1 : -1;
    const n = norm(add(mul(S.normalAt(face, ...e), 0.72), [0, 0, 0.28]));
    const f = S.frameFromNormal(n, [0, 1, 0]);
    const lashes = side > 0 ? [0.25, 0.58, 0.9] : [0.3, 0.62, 0.86];
    for (const [j, u] of lashes.entries()) {
      const base = add(add(e, mul(f.Y, ER[1] * 0.92)), add(mul(f.X, side * ER[0] * u), mul(n, 0.004)));
      const tip = add(base, add(mul(f.Y, 0.016 + 0.003 * j), add(mul(f.X, side * (0.008 + 0.006 * u)), mul(n, 0.01))));
      strands.push({ name: 'lash', pts: [base, add(mul(add(base, tip), 0.5), mul(n, 0.003)), tip], radii: [0.0028, 0.002, 0.0008], color: INK, bone: 'head' });
    }
  });

  
  let accessory = null;
  if (V.accessory === 'bowTie' && L.accT > 0) {
    const at = frontPoint(neckN, 0, 0.7);
    const n = S.normalAt(neckN, ...at);
    const f = S.frameFromNormal(n, [0.1, 1, 0]);
    const lobe = (sx) => S.transform(S.roundCone([0, 0, 0], [sx * 0.05, 0.006, 0], 0.012, 0.028), { scale: [1, 1, 0.55] });
    const tie = S.union(0.008, lobe(1), lobe(-1), S.ellipsoid([0, 0, 0.004], [0.016, 0.015, 0.012]));
    const red = linear(V.bow);
    accessory = S.place(S.paint(tie, { material: 'cloth', color: (x) => mix(red, mul(red, 0.8), smooth(0.02, 0.05, Math.abs(x))) }), add(at, mul(n, 0.02)), f.X, f.Y, f.Z);
    rigid.push({ name: 'bowTie', node: accessory, box: [sub(at, [0.09, 0.09, 0.09]), add(at, [0.09, 0.09, 0.09])], cell: L.small, tris: L.accT, bone: 'neck', material: 'cloth' });
  } else if (V.accessory === 'satchel' && L.accT > 0) {
    const bagC = [0.175, 0.46, 0.05];
    const leather = linear(V.leather);
    const bag = S.union(0.01,
      S.transform(S.roundBox([0, 0, 0], [0.025, 0.055, 0.065], 0.02), { translate: bagC, rotate: [0, 0.3, 0.06] }),
      S.transform(S.roundBox([0, 0.035, 0.012], [0.028, 0.03, 0.068], 0.015), { translate: bagC, rotate: [0, 0.3, 0.06] }),
    );
    accessory = S.paint(bag, { material: 'cloth', color: (x, y) => mix(leather, mul(leather, 0.8), smooth(bagC[1] + 0.02, bagC[1] + 0.035, y)) });
    rigid.push({ name: 'satchel', node: accessory, box: [sub(bagC, [0.1, 0.1, 0.1]), add(bagC, [0.1, 0.1, 0.1])], cell: L.acc, tris: L.accT, bone: 'hips', material: 'cloth' });
    const sash = onField(S.union(0.04, b.chestN, b.bellyN, b.hipsN), [[-0.12, 0.66, 0.02], [-0.06, 0.63, 0.13], [0.04, 0.57, 0.17], [0.13, 0.5, 0.13], [0.17, 0.5, 0.06]], 0.018);
    strands.push({ name: 'sash', pts: sash, radii: sash.map(() => 0.007), color: leather, material: 'cloth', soft: /^(arm|hand|head|ear|tail|leg|foot|neck)/ });
  } else if (V.accessory === 'garland' && L.accT > 0) {
    const flowers = [];
    const cols = ['#f7bfd0', '#fff4e0', '#f7e3a0', '#cdbfe6'].map(linear);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const at = S.projectToSurface(face, [Math.cos(a) * 0.2, 1.36, 0.04 + Math.sin(a) * 0.2]);
      const n = S.normalAt(face, ...at);
      const f = S.frameFromNormal(n);
      const petals = [];
      for (let k = 0; k < 5; k++) {
        const pa = (k / 5) * Math.PI * 2 + i;
        petals.push(S.transform(S.ellipsoid([0, 0, 0], [0.016, 0.011, 0.007]), { translate: [Math.cos(pa) * 0.017, Math.sin(pa) * 0.017, 0], rotate: [0, 0, pa] }));
      }
      flowers.push(S.place(S.union(0.004,
        S.paint(S.union(0.004, petals), { material: 'cloth', color: cols[i % cols.length] }),
        S.paint(S.sphere([0, 0, 0.006], 0.009), { material: 'cloth', color: linear('#f3d27a') }),
      ), add(at, mul(n, 0.012)), f.X, f.Y, f.Z));
    }
    accessory = S.union(0, flowers);
    rigid.push({ name: 'garland', node: accessory, box: [[-0.26, 1.24, -0.2], [0.26, 1.48, 0.28]], cell: L.small, tris: L.accT, bone: 'head', material: 'cloth' });
  }

  const scene = S.union(0, [body, apronNode, ...(scarf ? [scarf] : []), ...(accessory ? [accessory] : [])]);
  const crown = knobs.map((k) => S.projectToSurface(ossicones, add(k, [0, 0.2, 0])));
  return {
    joints, tails, extra, reparent, parts, body, fused, skull: face, cloth, rigid, strands, scene, crown,
    eyes: { at: eyeAt, ER },
    bodyBox: [[-0.4, -0.06, -0.3], [0.4, 1.6, 0.4]],
    contacts: b.contacts,
    hold: [0, 0.6, 0.23],
    
    
    
    
    
    
    
    
    
    
    gait: { walk: { elbow: 0.45, elbowSwing: 0.4, arm: 0.5 }, run: { elbow: 1.1, yaw: 0.1, tilt: 0.075, bob: 0.028 } },
    stretch: ANIMAL_STRETCH,
  };
}
