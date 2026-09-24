





























import * as S from '../../../mesh/sdf.mjs';
import { fbm3 } from '../../../noise.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { biped, scaler, flap, topShell, unionOf, frontPoint, ANIMAL_STRETCH, smooth, mix, add, sub, mul, dist, mirror, distToPolyline } from '../villagers/common.mjs';



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

export const GUEST_LOOK = Object.freeze({
  fairy: Object.freeze({ K: 0.7, head: 'round', skin: 'skin', coat: '#f7dccb', hair: '#cdb3ee', ears: 'elf' }),
  mummy: Object.freeze({ K: 0.95, head: 'round', skin: 'skin', coat: '#efe4cc', ears: 'none' }),
  werewolf: Object.freeze({ K: 1.12, head: 'canine', skin: 'fur', coat: '#9ea6bc', cream: '#f1e8d8', sock: '#6f7488', muzzle: 0.3, shaggy: 1 }),
  fox: Object.freeze({ K: 0.86, head: 'canine', skin: 'fur', coat: '#eba571', cream: '#fcf0e0', sock: '#7a5c5a', muzzle: 0.27, shaggy: 0 }),
});

const EYE_DARK = linear('#3a2f36');
const NOSE = linear('#4e4244');
const BLUSH = linear('#f5c0c0');

export function guestFigure(kind, { season, lod, L, rng, fuse }) {
  const G = GUEST_LOOK[kind];
  if (!G) throw new Error(`unknown guest '${kind}'`);
  const { P, R } = scaler(G.K);
  const b = biped(U, G.K);
  const jit = rng.child('pose');
  const j = (a, c) => jit.rangeF(a, c);
  const COAT = linear(G.coat);

  
  const neckN = S.capsule(P([0, 0.49, 0]), P([0, 0.555, 0.01]), R(0.1));
  let skull, muzzle = null, eyeY, eyeX, earRoots, earSpec;
  if (G.head === 'canine') {
    const m = G.muzzle;
    const cranium = S.ellipsoid(P([0, 0.765, -0.02]), [0.215, 0.195, 0.195].map(R));
    const ruff = S.union(R(0.05),
      S.ellipsoid(P([0.135, 0.665, 0.02]), [0.13, 0.1, 0.12].map(R)),
      S.ellipsoid(P([-0.128, 0.672, 0.018]), [0.122, 0.096, 0.115].map(R)),
    );
    muzzle = S.roundCone(P([0, 0.7, 0.09]), P([0.006, 0.662, 0.09 + m]), R(0.088), R(0.036));
    let head = S.union(R(0.05), cranium, ruff, muzzle);
    
    if (G.shaggy) head = S.displace(head, (x, y, z) => R(0.012) * (fbm3(x * 22, y * 22, z * 22, { seed: 311, octaves: 2 }) - 0.35), R(0.012));
    skull = head;
    eyeX = [R(0.088), R(-0.082)]; eyeY = [R(0.775), R(0.78)];
    earRoots = [P([0.12, 0.9, -0.035]), P([-0.118, 0.895, -0.03])];
    earSpec = (i) => ({
      up: i === 0 ? [0.3, 1, -0.05] : [-0.42 - j(0, 0.08), 0.95, 0],
      
      r: [G.shaggy ? 0.05 : 0.068, G.shaggy ? 0.125 : 0.13, 0.032], cupR: [G.shaggy ? 0.03 : 0.042, 0.09, 0.018],
    });
  } else {
    const cranium = S.ellipsoid(P([0, 0.79, -0.01]), [0.265, 0.245, 0.235].map(R));
    const cheeks = kind === 'mummy'
      ? S.ellipsoid(P([0, 0.66, 0.06]), [0.2, 0.13, 0.15].map(R))
      : S.union(R(0.05), S.ellipsoid(P([0.115, 0.665, 0.07]), [0.14, 0.115, 0.13].map(R)), S.ellipsoid(P([-0.11, 0.67, 0.065]), [0.135, 0.117, 0.128].map(R)));
    const noseBump = S.ellipsoid(P([0.004, 0.69, 0.21]), [0.034, 0.028, 0.03].map(R));
    let head = S.union(R(0.05), cranium, cheeks, S.ellipsoid(P([0, 0.585, 0.09]), [0.12, 0.07, 0.1].map(R)));
    head = S.union(R(0.02), head, noseBump);
    if (kind === 'fairy') {
      
      const cap = S.ellipsoid(P([0.01, 0.84, -0.04]), [0.285, 0.235, 0.255].map(R));
      const bun = S.ellipsoid(P([0.11, 1.04, -0.08]), [0.105, 0.095, 0.1].map(R));
      head = S.union(R(0.04), head, cap, bun);
    }
    skull = head;
    eyeX = [R(0.118), R(-0.114)]; eyeY = [R(0.765), R(0.77)];
    earRoots = [P([0.235, 0.79, -0.03]), P([-0.232, 0.785, -0.03])];
    earSpec = (i) => ({
      up: i === 0 ? [1, 0.55, -0.1] : [-1, 0.7 + j(0, 0.1), -0.12],
      r: [0.035, 0.085, 0.022], cupR: [0.02, 0.055, 0.012],
    });
  }

  const eyeAt = [0, 1].map((i) => frontPoint(skull, eyeX[i], eyeY[i]));
  const CREAM = G.cream ? linear(G.cream) : COAT;
  const SOCK = G.sock ? linear(G.sock) : COAT;
  const ears = earRoots.map((root, i) => {
    const e = earSpec(i);
    return flap(root, e.up, [0.1 * (i ? -1 : 1), 0, 1], {
      centre: [0, R(e.r[1] * 0.7), 0], r: e.r.map(R), cup: [0, R(e.r[1] * 0.7), R(e.r[2] * 0.6)], cupR: e.cupR.map(R),
      inner: kind === 'fairy' ? linear('#f1bfb4') : CREAM,
    });
  });

  
  const tailJ = [P([0, 0.27, -0.16]), P([0, 0.33, -0.33]), P([0.025, 0.45, -0.44])];
  const tailEnd = P([0.035, 0.55, -0.47]);
  const canine = G.head === 'canine';
  const tailSegs = canine
    ? [S.roundCone(tailJ[0], tailJ[1], R(0.05), R(0.095)), S.roundCone(tailJ[1], tailJ[2], R(0.095), R(0.1)), S.roundCone(tailJ[2], tailEnd, R(0.1), R(0.05))]
    : [S.ellipsoid(P([0, 0.27, -0.19]), [0.04, 0.035, 0.03].map(R))];

  const joints = { ...b.joints, earL: earRoots[0], earR: earRoots[1], tail1: tailJ[0], tail2: tailJ[1], tail3: tailJ[2] };
  const tails = {
    ...b.tails, head: P([0, 1.05, 0]),
    earL: add(earRoots[0], mul(ears[0].Y, R(0.14))), earR: add(earRoots[1], mul(ears[1].Y, R(0.14))), tail3: tailEnd,
  };

  
  const torsoD = (x, y, z) => Math.min(b.hipsN.d(x, y, z), b.bellyN.d(x, y, z), b.chestN.d(x, y, z), neckN.d(x, y, z));
  const armsN = [unionOf(0, b.L.arm), unionOf(0, b.R.arm)];
  const legsN = [unionOf(0, b.L.leg), unionOf(0, b.R.leg)];
  const blushAt = [P([0.19, 0.665, 0.16]), P([-0.186, 0.67, 0.155])];
  const HAIR = G.hair ? linear(G.hair) : COAT;
  const LINEN_DARK = linear('#cbbb9c');
  const SLIT = linear('#6a5a52');
  const coat = (x, y, z) => {
    const p = [x, y, z];
    if (kind === 'mummy') {
      
      
      const limb = Math.min(armsN[0].d(x, y, z), armsN[1].d(x, y, z), legsN[0].d(x, y, z), legsN[1].d(x, y, z)) < torsoD(x, y, z) ? 1 : 0;
      const tilt = y > R(0.56) ? -0.28 : limb ? 0.55 : 0.22;
      
      
      
      const u = (y + tilt * x + 0.08 * z) / R(0.12) + 0.08 * Math.sin(x * 9 + z * 7);
      const f = u - Math.floor(u);
      const edge = smooth(0.0, 0.3, f) * smooth(1.0, 0.7, f);
      let c = mix(mul(LINEN_DARK, 0.82), COAT, edge);
      c = mul(c, 0.94 + 0.08 * fbm3(x * 6, y * 6, z * 6, { seed: 5, octaves: 2 }));
      const slit = 1 - smooth(R(0.03), R(0.05), Math.abs(y - R(0.768) - 0.08 * x));
      if (z > 0 && Math.abs(x) < R(0.22)) c = mix(c, SLIT, slit * 0.85);
      return c;
    }
    if (kind === 'fairy') {
      const hairD = y > R(0.76) && (z < R(0.12) || y > R(0.93)) ? 1 : 0;
      let c = COAT;
      if (hairD) c = mix(COAT, HAIR, smooth(R(0.76), R(0.8), y) * (1 - smooth(R(0.1), R(0.16), z) * (1 - smooth(R(0.92), R(0.97), y))));
      let blush = 0;
      for (const q of blushAt) blush = Math.max(blush, 1 - smooth(R(0.022), R(0.05), dist(p, q)));
      return mix(c, BLUSH, blush * 0.55);
    }
    
    
    const tD = torsoD(x, y, z);
    let cream = 0;
    if (y > R(0.56)) cream = smooth(R(0.72), R(0.66), y + 0.25 * Math.max(0, z - R(0.12))) * smooth(R(0.0), R(0.08), z);
    else cream = smooth(R(0.02), R(0.12), z) * smooth(R(0.5), R(0.44), y) * smooth(R(0.2), R(0.28), y) * smooth(0.02, -0.01, tD);
    let sock = smooth(R(0.14), R(0.1), y) * smooth(0.01, -0.01, Math.min(legsN[0].d(x, y, z), legsN[1].d(x, y, z)) - tD);
    sock = Math.max(sock, smooth(R(0.33), R(0.28), y) * smooth(0.01, -0.01, Math.min(armsN[0].d(x, y, z), armsN[1].d(x, y, z)) - tD));
    if (y > R(0.9)) sock = Math.max(sock, smooth(R(1.0), R(1.06), y));
    let c = mix(COAT, CREAM, cream);
    if (canine && y > R(0.3) && z < R(-0.3)) c = mix(c, CREAM, smooth(R(0.08), R(0.03), dist(p, tailEnd)));
    if (G.shaggy) c = mul(c, 0.92 + 0.12 * fbm3(x * 26, y * 26, z * 26, { seed: 19, octaves: 2 }));
    return mix(c, SOCK, sock);
  };
  const paint = (n) => S.paint(n, { color: coat });

  const earsNode = G.ears === 'none' ? null : S.union(0.02, ears[0].node(paint), ears[1].node(paint));
  const headNode = earsNode ? S.union(0.02, paint(skull), earsNode) : paint(skull);
  const core = S.union(0.05, paint(S.union(0.035, b.hipsN, b.bellyN, b.chestN, neckN)), headNode);
  const limb = (parts, k) => paint(unionOf(k, parts));
  const body = S.union(0.018,
    S.union(0.03, core, limb(b.L.leg, 0.025), limb(b.R.leg, 0.025), paint(S.union(0.02, ...tailSegs))),
    limb(b.L.arm, 0.022), limb(b.R.arm, 0.022),
  );
  const parts = [
    ['hips', b.hipsN, 0.035], ['spine', b.bellyN, 0.035], ['chest', b.chestN, 0.03], ['neck', neckN, 0.03],
    ['head', skull, 0.03],
    ...(G.ears === 'none' ? [] : [['earL', ears[0].outer, 0.02], ['earR', ears[1].outer, 0.02]]),
    ...b.L.arm, ...b.R.arm, ...b.L.leg, ...b.R.leg,
    ...tailSegs.map((n, i) => [`tail${i + 1}`, n, 0.02]),
  ];

  
  const cloth = [], fused = [], rigid = [], strands = [];
  const garment = GARMENTS[kind] && GARMENTS[kind]({ b, P, R, fuse, j });
  if (garment) {
    const box = [P([-0.32, 0.1, -0.3]), P([0.32, 0.6, 0.32])];
    if (fuse) fused.push(garment); else cloth.push({ name: 'garment', node: garment, box, tris: L.clothT, exclude: /^(arm|hand|head|ear|tail|legLower|foot)/ });
  }

  
  if (canine) {
    const noseAt = frontPoint(muzzle, R(0.006), R(0.672));
    const n = S.normalAt(muzzle, ...noseAt);
    const f = S.frameFromNormal(n, [0, 1, 0]);
    const nose = S.place(S.paint(S.union(0.01, S.ellipsoid([0, 0, 0], [0.034, 0.024, 0.024].map(R)), S.ellipsoid([0, R(-0.01), 0], [0.018, 0.018, 0.016].map(R))), { material: 'eye', color: NOSE }), add(noseAt, mul(n, R(0.004))), f.X, f.Y, f.Z);
    rigid.push({ name: 'nose', node: nose, box: [sub(noseAt, [0.06, 0.06, 0.06]), add(noseAt, [0.06, 0.06, 0.06])], cell: L.small, tris: L.noseT, bone: 'head', material: 'eye', aoMin: 0.8 });
  }
  const onSkin = (x, y, lift = 0.002) => { const q = frontPoint(skull, x, y); return add(q, mul(S.normalAt(skull, ...q), lift)); };
  const mouthY = canine ? 0.635 : 0.628;
  const mouthXY = canine
    ? [[-0.05, mouthY + 0.012], [-0.024, mouthY - 0.004], [0.004, mouthY + 0.002], [0.028, mouthY - 0.006], [0.054, mouthY + 0.016]]
    : [[-0.042, mouthY + 0.01], [-0.02, mouthY - 0.002], [0.002, mouthY + 0.002], [0.022, mouthY - 0.004], [0.046, mouthY + 0.012]];
  const mouthPts = (dy) => mouthXY.map(([x, y], i) => onSkin(R(x), R(y + dy[i])));
  strands.push({
    name: 'mouth', pts: mouthPts([0, 0, 0, 0, 0]), radii: [0.0024, 0.0036, 0.004, 0.0036, 0.0022].map((r) => r * G.K / 0.84), color: EYE_DARK, bone: 'head',
    morphs: {
      mouthSmile: { pts: mouthPts([0.012, -0.004, -0.008, -0.004, 0.012]) },
      mouthFrown: { pts: mouthPts([-0.01, 0.004, 0.008, 0.004, -0.01]) },
    },
  });

  
  const hand = b.joints.handL, tip = b.tails.handL;
  if (L.accT > 0) {
    const prop = PROPS[kind]({ at: add(tip, P([0.01, -0.02, 0.03])), P, R, j });
    rigid.push({ name: prop.name, node: prop.node, box: prop.box, cell: L.acc, tris: L.accT * 2, bone: 'handL', material: 'cloth', aoMin: 0.6 });
    if (kind === 'fairy') {
      
      const handR = mirror(tip);
      const wandTop = add(handR, P([-0.02, 0.16, 0.12]));
      const stick = S.paint(S.roundCone(add(handR, P([0.005, -0.04, -0.03])), wandTop, R(0.012), R(0.009)), { material: 'cloth', color: linear('#d9b68c') });
      rigid.push({ name: 'wand', node: stick, box: [sub(handR, [0.12, 0.12, 0.12]), add(handR, [0.12, 0.2, 0.2])], cell: L.small, tris: L.accT >> 1, bone: 'handR', material: 'cloth' });
      const star = S.paint(starNode(wandTop, R(0.04), R(0.016)), { material: 'lamp-glow', color: linear('#fff0b8') });
      rigid.push({ name: 'star', node: star, box: [sub(wandTop, [0.07, 0.07, 0.07]), add(wandTop, [0.07, 0.07, 0.07])], cell: L.small, tris: L.accT >> 1, bone: 'handR', material: 'lamp-glow', aoMin: 1 });
    }
  }
  if (kind === 'fairy') {
    
    const back = P([0, 0.46, -0.13]);
    const wing = (side, up, len, wid, tiltZ) => S.transform(S.ellipsoid([0, 0, 0], [len, wid, 0.007]), { translate: add(back, P([side * 0.2, up, -0.05])), rotate: [0.35, side * 0.45, side * tiltZ] });
    const wings = S.union(0.01,
      wing(1, 0.1, R(0.24), R(0.12), 0.55 + j(0, 0.05)), wing(-1, 0.12, R(0.225), R(0.115), 0.72),
      wing(1, -0.07, R(0.15), R(0.08), -0.35), wing(-1, -0.06, R(0.16), R(0.085), -0.22),
    );
    const wingColor = (x, y, z) => mix(linear('#dff5ee'), linear('#e7dafa'), smooth(-0.3, 0.3, Math.sin(x * 40 + y * 25)) * 0.8);
    rigid.push({ name: 'wings', node: S.paint(wings, { material: 'cloth', color: wingColor }), box: [add(back, P([-0.62, -0.35, -0.4])), add(back, P([0.62, 0.45, 0.1]))], cell: L.small * 1.4, tris: Math.max(120, L.accT), bone: 'chest', material: 'cloth', aoMin: 0.9 });
  }
  if (kind === 'mummy' && lod < 2) {
    
    
    const w = b.joints.handR;
    const pts = [add(w, P([0, 0.01, 0])), add(w, P([-0.02, -0.07, -0.02])), add(w, P([0.005, -0.15, -0.03])), add(w, P([-0.015, -0.21, -0.02]))];
    strands.push({ name: 'looseEnd', pts, radii: pts.map((_, i) => R(0.012 - i * 0.002)), color: COAT, material: 'skin', bone: 'handR' });
  }

  const scene = S.union(0, [body, ...(garment ? [garment] : [])]);
  return {
    joints, tails, parts, body, fused, skull, cloth, rigid, strands, scene,
    skinMaterial: G.skin,
    blush: { at: blushAt, inner: R(0.022), outer: R(0.05), pink: BLUSH },
    crown: [S.projectToSurface(skull, P([0, 1.3, 0])), ...(G.ears === 'none' ? [] : ears.map((e, i) => S.projectToSurface(e.outer, add(i ? tails.earR : tails.earL, P([0, 0.2, 0])))))],
    eyes: { at: eyeAt, ER: [0.035, 0.044, 0.025].map(R) },
    bodyBox: [P([-0.48, -0.06, -0.62]), P([0.48, 1.2, 0.5])],
    contacts: b.contacts,
    hold: P([0, 0.43, 0.25]),
    gait: { walk: { elbow: 0.45, elbowSwing: 0.4, arm: 0.5, tilt: 0.08 }, run: { elbow: 1.1, bob: 0.018 }, pickUp: { drop: 0.72 } },
    stretch: { ...ANIMAL_STRETCH, legs: 0 },
  };
}



const GARMENTS = {
  fairy: ({ b, P, R, fuse, j }) => {
    const petal = (x, z) => R(0.19) + R(0.035) * Math.abs(Math.sin(Math.atan2(x, z) * 3 + 0.4));
    return topShell({
      torso: [b.hipsN, b.bellyN, b.chestN], arms: [b.L.arm[0][1], b.R.arm[0][1]],
      shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
      hemY: petal, neckY: (x, z) => R(0.5) - R(0.045) * smooth(0, R(0.13), z) - R(0.01) * x / R(0.2),
      sleeve: 0, armhole: R(0.108), off: 0.012, thick: 0.008,
      folds: (x, y, z) => 0.003 * (fbm3(x * 10, y * 10, z * 10, { seed: 41, octaves: 2 }) - 0.5),
      color: (x, y) => mix(linear('#f4b8cc'), linear('#c9e8c4'), smooth(R(0.3), R(0.22), y + 0.02 * Math.sin(x * 60))), fuse,
    }).node;
  },
  werewolf: ({ b, P, R, fuse }) => topShell({
    torso: [b.hipsN, b.bellyN, b.chestN], arms: [b.L.arm[0][1], b.R.arm[0][1]],
    shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
    hemY: (x) => R(0.23) - R(0.015) * (x > 0 ? 1 : 0), neckY: (x, z) => R(0.5) - R(0.06) * smooth(0, R(0.13), z),
    sleeve: 0, armhole: R(0.11), off: 0.014, thick: 0.009,
    folds: (x, y, z) => 0.004 * (fbm3(x * 8, y * 8, z * 8, { seed: 13, octaves: 2 }) - 0.5),
    color: (x, y) => {
      
      const c1 = smooth(-0.25, 0.25, Math.sin(x / R(0.022))), c2 = smooth(-0.25, 0.25, Math.sin(y / R(0.022)));
      return mix(linear('#f2e6d0'), linear('#cf7f86'), 0.4 * c1 + 0.4 * c2 + 0.2 * c1 * c2);
    }, fuse,
  }).node,
  fox: ({ b, P, R, fuse }) => topShell({
    torso: [b.hipsN, b.bellyN, b.chestN], arms: [b.L.arm[0][1], b.R.arm[0][1]],
    shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
    
    hemY: (x, z) => R(0.17) + R(0.04) * smooth(R(-0.1), R(0.15), z), neckY: (x, z) => R(0.51) - R(0.07) * smooth(0, R(0.13), z),
    sleeve: 0, armhole: R(0.108), off: 0.013, thick: 0.009,
    folds: (x, y, z) => 0.004 * (fbm3(x * 7, y * 12, z * 7, { seed: 23, octaves: 2 }) - 0.5),
    color: (x, y, z) => {
      let c = mix(linear('#5ea7a0'), linear('#78bdb3'), smooth(-0.1, 0.1, z));
      
      for (let i = 0; i < 3; i++) {
        const d = Math.hypot(x + R(0.03), y - R(0.28 + i * 0.07));
        if (z > R(0.1)) c = mix(c, linear('#ecc97a'), 1 - smooth(R(0.012), R(0.018), d));
      }
      return c;
    }, fuse,
  }).node,
};


const PROPS = {
  fairy: ({ at, P, R }) => {
    
    const c = add(at, P([0, -0.02, 0.02]));
    const node = S.union(R(0.01),
      S.paint(S.roundCone(c, add(c, P([0.01, -0.08, 0])), R(0.01), R(0.008)), { color: linear('#9cc58a') }),
      S.paint(S.ellipsoid(add(c, P([0.02, 0.02, 0.01])), [0.028, 0.024, 0.026].map(R)), { color: linear('#f5b3c4') }),
      S.paint(S.ellipsoid(add(c, P([-0.022, 0.012, 0.0])), [0.024, 0.022, 0.024].map(R)), { color: linear('#fbe39a') }),
      S.paint(S.ellipsoid(add(c, P([0.002, 0.03, -0.022])), [0.022, 0.02, 0.022].map(R)), { color: linear('#cdb3ee') }),
    );
    return { name: 'posy', node, box: [sub(c, [0.1, 0.12, 0.1]), add(c, [0.1, 0.1, 0.1])] };
  },
  mummy: ({ at, P, R }) => {
    
    const c = add(at, P([0, -0.06, 0.03]));
    const jar = S.union(R(0.02),
      S.roundCone(add(c, P([0, -0.07, 0])), add(c, P([0, 0.03, 0])), R(0.05), R(0.058)),
      S.ellipsoid(add(c, P([0, 0.065, 0])), [0.05, 0.035, 0.05].map(R)),
      S.roundCone(add(c, P([0.02, 0.09, 0])), add(c, P([0.028, 0.13, -0.005])), R(0.013), R(0.004)),
      S.roundCone(add(c, P([-0.02, 0.09, 0])), add(c, P([-0.024, 0.125, 0.004])), R(0.012), R(0.004)),
    );
    const col = (x, y) => (Math.abs(((y - c[1]) / R(0.03)) % 1) < 0.18 ? linear('#e8c46e') : y > c[1] + R(0.04) ? linear('#6fb0c4') : linear('#8ccfd0'));
    return { name: 'jar', node: S.paint(jar, { color: col }), box: [sub(c, [0.1, 0.12, 0.1]), add(c, [0.1, 0.18, 0.1])] };
  },
  werewolf: ({ at, P, R }) => {
    
    const c = add(at, P([0, -0.13, 0.03]));
    const rim = c[1] + R(0.03);
    const bowl = S.intersect(R(0.01), S.ellipsoid(c, [0.095, 0.08, 0.09].map(R)), S.plane([0, 1, 0], rim));
    const handle = S.intersect(R(0.005), S.transform(S.torus([0, 0, 0], R(0.085), R(0.011)), { translate: [c[0], rim, c[2]], rotate: [Math.PI / 2, 0, 0.2] }), S.plane([0, -1, 0], -rim));
    const cover = S.ellipsoid(add(c, P([0.01, 0.035, 0])), [0.085, 0.022, 0.08].map(R));
    const col = (x, y, z) => (y > rim && Math.hypot(x - c[0], z - c[2]) < R(0.086)
      ? (Math.sin(x / R(0.02)) * Math.sin(z / R(0.02)) > 0 ? linear('#f2e6d0') : linear('#d98b86'))
      : mix(linear('#c89a68'), linear('#a97d52'), smooth(-0.3, 0.3, Math.sin(Math.atan2(x - c[0], z - c[2]) * 16) * Math.sin((y - c[1]) / R(0.012)))));
    return { name: 'basket', node: S.paint(S.union(R(0.012), bowl, handle, cover), { color: col }), box: [sub(c, [0.14, 0.1, 0.14]), add(c, [0.14, 0.2, 0.14])] };
  },
  fox: ({ at, P, R }) => {
    
    const c = add(at, P([0, -0.12, 0.02]));
    const sack = S.union(R(0.03),
      S.ellipsoid(c, [0.085, 0.1, 0.075].map(R)),
      S.roundCone(add(c, P([0, 0.08, 0])), add(c, P([0, 0.13, 0])), R(0.035), R(0.022)),
    );
    const frame = S.transform(S.roundBox([0, 0, 0], [0.06, 0.06, 0.008].map(R), R(0.004)), { translate: add(c, P([0.045, 0.1, 0.0])), rotate: [0.1, 0.3, 0.6] });
    const node = S.union(R(0.006),
      S.paint(sack, { color: (x, y, z) => mul(linear('#d6bf98'), 0.9 + 0.1 * Math.sin(x / R(0.008)) * Math.sin(y / R(0.008))) }),
      S.paint(frame, { color: linear('#e8c46e') }),
    );
    return { name: 'sack', node, box: [sub(c, [0.13, 0.14, 0.12]), add(c, [0.14, 0.2, 0.12])] };
  },
};


function starNode(c, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? inner : outer;
    pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]]);
  }
  const arms = [];
  for (let i = 0; i < 10; i += 2) arms.push(S.roundCone(c, pts[i], inner * 0.9, inner * 0.35));
  return S.union(inner * 0.5, ...arms);
}
