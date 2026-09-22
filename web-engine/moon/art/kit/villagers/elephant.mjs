






















import * as S from '../../../mesh/sdf.mjs';
import { fbm3 } from '../../../noise.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { biped, flap, topShell, knitScarf, unionOf, frontPoint, ANIMAL_STRETCH, smooth, mix, add, sub, mul, norm, cross, dist, mirror } from './common.mjs';


const U = {
  hip: [0.137, 0.275, 0], ankle: [0.142, 0.068, 0], kneeFwd: 0.015,
  thigh: [0.082, 0.078], shin: [0.078, 0.074],
  foot: { c: [0.142, 0.05, 0.03], r: [0.086, 0.052, 0.1] },
  torso: {
    hips: { c: [0, 0.3, -0.02], r: [0.245, 0.16, 0.21] },
    belly: { c: [0, 0.39, 0.045], r: [0.235, 0.19, 0.23] },
    chest: { c: [0, 0.525, 0], r: [0.2, 0.13, 0.17] },
  },
  joints: { hips: [0, 0.29, -0.01], spine: [0, 0.38, 0], chest: [0, 0.5, -0.005], neck: [0, 0.6, 0], head: [0, 0.67, 0.02] },
  
  
  
  
  
  
  
  shoulder: [0.235, 0.55, 0], elbow: [0.36, 0.452, 0.05], wrist: [0.385, 0.365, 0.09],
  
  hand: { kind: 'tip', c: [0.391, 0.33, 0.104], tip: [0.397, 0.3, 0.116], tipR: 0.058 },
  upperArm: [0.064, 0.06], foreArm: [0.06, 0.056],
};




const VARIANTS = [
  { skin: '#cfc6d6', innerEar: '#f4cbd3', blush: '#f2bcc4', jumper: '#eeb4a8', jumperBack: '#dfa092', accessory: 'cap', tweed: ['#a8927e', '#c2ad97'], scarf: ['#a8d2c6', '#fff1e2'] },
  { skin: '#d6cbc4', innerEar: '#f6d0cc', blush: '#f3c0bb', jumper: '#b5d9bf', jumperBack: '#9ec7a9', accessory: 'daisy', scarf: ['#f2d38f', '#fff1e2'] },
  { skin: '#c9c4d4', innerEar: '#f1c8d6', blush: '#efbccb', jumper: '#b3cbeb', jumperBack: '#9db8de', accessory: 'beanie', beanie: '#f2d98f', pom: '#fff1e2', scarf: ['#eba7a7', '#fff1e2'] },
];

const INK = linear('#35293a');
const NOSTRIL = linear('#7d5e66');
const NAIL = linear('#f3e6d0');
const CREAM = linear('#fff1e2');

export function elephant({ season, lod, L, variant, rng, fuse }) {
  const V = VARIANTS[variant];
  const C = Object.fromEntries(Object.entries(V).filter(([, v]) => typeof v === 'string' && v.startsWith('#')).map(([k, v]) => [k, linear(v)]));
  const jit = rng.child('pose');
  const curl = jit.rangeF(0.0, 0.02);
  const hatTilt = jit.rangeF(-0.07, 0.07);
  const earDrop = jit.rangeF(-0.04, 0.04);
  const b = biped(U, 1);

  
  const neckN = S.capsule([0, 0.6, 0], [0, 0.69, 0.02], 0.125);
  const cranium = S.ellipsoid([0, 0.94, -0.01], [0.28, 0.26, 0.25]);
  const dome = S.ellipsoid([0.008, 1.0, 0.07], [0.2, 0.15, 0.18]);
  const face = S.union(0.06,
    cranium, dome,
    S.ellipsoid([0.13, 0.84, 0.09], [0.15, 0.125, 0.145]),
    S.ellipsoid([-0.126, 0.845, 0.086], [0.146, 0.126, 0.142]),
    S.ellipsoid([0, 0.765, 0.1], [0.12, 0.06, 0.1]),
  );
  
  const T = [[0, 0.87, 0.17], [0.004, 0.8, 0.27], [0.014, 0.72, 0.325], [0.03, 0.65, 0.36], [0.05 + curl * 0.5, 0.605, 0.395], [0.07 + curl, 0.598, 0.432], [0.085 + curl, 0.622, 0.458]];
  const TR = [0.09, 0.072, 0.06, 0.05, 0.043, 0.039, 0.037];
  const TB = ['trunk1', 'trunk1', 'trunk2', 'trunk2', 'trunk3', 'trunk3'];
  const trunkPieces = T.slice(1).map((p, i) => [TB[i], S.roundCone(T[i], p, TR[i], TR[i + 1]), 0.025]);
  const trunkN = S.union(0.02, trunkPieces.map(([, n]) => n));
  const tipDir = norm(sub(T[6], T[5]));
  const across = norm(cross(tipDir, [0, 1, 0]));
  const nostrils = S.union(0,
    S.sphere(add(add(T[6], mul(tipDir, 0.03)), mul(across, 0.013)), 0.012),
    S.sphere(add(add(T[6], mul(tipDir, 0.03)), mul(across, -0.012)), 0.011),
  );

  
  const rootL = [0.2, 0.96, -0.03], rootR = [-0.198, 0.955, -0.03];
  const earL = flap(rootL, [0.25, 1, -0.15], [0.55, 0, 0.85], { centre: [0.12, -0.04, -0.005], r: [0.16, 0.19, 0.032], cup: [0.13, -0.045, 0.026], cupR: [0.118, 0.142, 0.018], inner: C.innerEar });
  const earR = flap(rootR, [-0.38, 1, -0.24], [-0.55, 0, 0.85], { centre: [-0.125, -0.055 + earDrop, -0.005], r: [0.166, 0.2, 0.032], cup: [-0.135, -0.06 + earDrop, 0.026], cupR: [0.122, 0.148, 0.018], inner: C.innerEar });

  
  const TT = [[0, 0.31, -0.215], [0.012, 0.27, -0.262], [0.028, 0.21, -0.285], [0.04, 0.16, -0.29]];
  const tuftC = [0.045, 0.128, -0.29];
  const tailPieces = [
    ['tail1', S.roundCone(TT[0], TT[1], 0.02, 0.017), 0.012],
    ['tail2', S.roundCone(TT[1], TT[2], 0.017, 0.014), 0.012],
    ['tail3', S.union(0.012, S.roundCone(TT[2], TT[3], 0.014, 0.012), S.ellipsoid(tuftC, [0.022, 0.036, 0.022])), 0.012],
  ];

  const joints = {
    ...b.joints,
    earL: rootL, earR: rootR,
    tail1: TT[0], tail2: TT[1], tail3: TT[2],
    trunk1: [0.002, 0.83, 0.225], trunk2: T[2], trunk3: T[4],
  };
  const tails = {
    ...b.tails, head: [0, 1.2, 0],
    earL: add(rootL, add(mul(earL.X, 0.27), mul(earL.Y, -0.05))), earR: add(rootR, add(mul(earR.X, -0.28), mul(earR.Y, -0.07))),
    tail3: [0.045, 0.095, -0.29], trunk3: T[6],
  };
  const extra = [['trunk1', 'head'], ['trunk2', 'trunk1'], ['trunk3', 'trunk2']];

  
  const eyeAt = [1, -1].map((s) => frontPoint(face, s * 0.128, 0.945));
  const blushAt = [[0.175, 0.845, 0.175], [-0.17, 0.85, 0.17]];
  const footN = [S.ellipsoid(b.foot.c, b.foot.r), S.ellipsoid(mirror(b.foot.c), b.foot.r)];
  const nails = [];
  for (const [i, s] of [[0, 1], [1, -1]]) for (const dx of [-0.047, 0, 0.047]) nails.push(S.projectToSurface(footN[i], [s * b.foot.c[0] + dx, 0.05, 0.3]));
  const tip = C.skin.map((v, i) => v * 0.55 + linear('#e7c3c6')[i] * 0.45);
  const coat = (x, y, z) => {
    const p = [x, y, z];
    let c = mix(C.skin, mul(C.skin, 0.9), smooth(1.02, 1.19, y) * 0.7);
    if (z > 0.15 && y > 0.55 && y < 0.9) {
      const onTrunk = smooth(0.012, -0.012, trunkN.d(x, y, z) - face.d(x, y, z));
      if (onTrunk > 0) {
        const ring = smooth(0.6, 0.92, 0.5 + 0.5 * Math.sin(y * 150 - z * 70));
        c = mix(c, mul(c, 0.86), ring * onTrunk * 0.55);
        c = mix(c, tip, (1 - smooth(0.02, 0.07, dist(p, T[6]))) * onTrunk);
      }
    }
    let blush = 0;
    for (const q of blushAt) blush = Math.max(blush, 1 - smooth(0.024, 0.06, dist(p, q)));
    c = mix(c, C.blush, blush * 0.5);
    if (y < 0.1) {
      let nail = 0;
      for (const q of nails) nail = Math.max(nail, 1 - smooth(0.015, 0.022, dist(p, q)));
      c = mix(c, NAIL, nail);
    }
    if (y < 0.2 && z < -0.2) c = mix(c, mul(C.skin, 0.58), 1 - smooth(0.02, 0.04, dist(p, tuftC)));
    return c;
  };
  const paint = (n) => S.paint(n, { color: coat });
  const headGeom = S.subtract(0.006, paint(S.union(0.05, face, trunkN)), S.paint(nostrils, { color: NOSTRIL }), { cutColor: true });
  const earsNode = S.union(0.02, earL.node(paint), earR.node(paint));
  const core = S.union(0.05, paint(S.union(0.035, b.hipsN, b.bellyN, b.chestN, neckN)), S.union(0.03, headGeom, earsNode));
  const limb = (parts, k) => paint(unionOf(k, parts));
  const body = S.union(0.018,
    S.union(0.03, core, limb(b.L.leg, 0.025), limb(b.R.leg, 0.025), paint(unionOf(0.01, tailPieces))),
    limb(b.L.arm, 0.022), limb(b.R.arm, 0.022),
  );
  const parts = [
    ['hips', b.hipsN, 0.035], ['spine', b.bellyN, 0.035], ['chest', b.chestN, 0.03], ['neck', neckN, 0.03],
    ['head', face, 0.03], ...trunkPieces, ['earL', earL.outer, 0.025], ['earR', earR.outer, 0.025],
    ...b.L.arm, ...b.R.arm, ...b.L.leg, ...b.R.leg, ...tailPieces,
  ];

  
  const J = { front: C.jumper, back: C.jumperBack };
  const hemY = (x, z) => 0.245 + 0.012 * smooth(-0.1, 0.15, z);
  const neckY = (x, z) => 0.642 - 0.022 * smooth(0.02, 0.15, z);
  const ang = (x, z) => Math.atan2(x, z);
  
  
  
  
  const jumperColor = (x, y, z) => {
    let c = mix(J.back, J.front, smooth(-0.12, 0.06, z));
    
    
    const yoke = smooth(-0.012, 0.012, y - (0.492 - 0.12 * x));
    c = mix(c, mix(c, CREAM, 0.5), yoke);
    const rib = Math.max(smooth(0.045, 0.035, y - hemY(x, z)), smooth(-0.03, -0.02, y - neckY(x, z)));
    return mix(c, mul(c, 0.84), rib * (0.55 + 0.45 * smooth(0.3, 0.7, 0.5 + 0.5 * Math.sin(ang(x, z) * 64))));
  };
  const jumper = topShell({
    torso: [b.hipsN, b.bellyN, b.chestN], arms: [b.L.arm[0][1], b.R.arm[0][1]],
    shoulders: [b.shoulderL, mirror(b.shoulderL)], elbows: [b.elbowL, mirror(b.elbowL)],
    
    
    hemY, neckY, sleeve: 0, armhole: 0.125, off: 0.011, thick: 0.0085,
    folds: (x, y, z) => {
      const drag = 0.004 * (fbm3(x * 9, y * 9, z * 9, { seed: 311, octaves: 2 }) - 0.5);
      const cable = z > 0.05 ? 0.0018 * Math.sin(x * 95) * smooth(0.05, 0.15, z) : 0;
      const hemRib = y < hemY(x, z) + 0.04 ? 0.0024 * Math.sin(ang(x, z) * 64) : cable;
      return drag + hemRib;
    },
    color: jumperColor, fuse,
  });
  const collar = S.paint(S.transform(S.torus([0, 0, 0], 0.13, 0.03), { translate: [0, 0.642, 0.012], rotate: [0.12, 0, 0.03], scale: [1, 0.8, 1] }), {
    material: 'cloth', color: (x, y, z) => mix(mul(J.front, 0.9), mul(J.front, 0.76), smooth(0.3, 0.7, 0.5 + 0.5 * Math.sin(ang(x, z) * 56))),
  });
  const jumperNode = S.union(0.012, jumper.node, collar);

  const cloth = [], fused = [], rigid = [], strands = [];
  
  
  if (fuse) fused.push(jumperNode);
  else cloth.push({ name: 'jumper', node: jumperNode, box: [[-0.46, 0.2, -0.3], [0.46, 0.7, 0.34]], tris: L.clothT, exclude: /^(arm|hand|head|ear|tail|leg|foot|trunk)/ });

  let scarf = null;
  if (season === 'winter') {
    scarf = knitScarf({ at: [0, 0.628, 0.012], R: 0.15, r: 0.05, tilt: [0.18, 0.05], body: jumper.outer, tailSide: 1, tailLen: 0.17, colors: V.scarf.map(linear) });
    if (fuse) fused.push(scarf); else cloth.push({ name: 'scarf', node: scarf, box: [[-0.3, 0.38, -0.26], [0.3, 0.73, 0.34]], tris: L.neckT, exclude: /^(arm|hand|leg|foot|tail|ear|head|trunk)/ });
  }

  
  const onSkin = (p, lift) => { const q = frontPoint(face, p[0], p[1]); return add(q, mul(S.normalAt(face, ...q), lift)); };
  
  
  
  
  const mouthXY = [[0.05, 0.786], [0.07, 0.781], [0.092, 0.795]];
  const mouthPts = (dy) => mouthXY.map(([x, y], i) => onSkin([x, y + dy[i], 0.4], 0.002));
  strands.push({
    name: 'smile', pts: mouthPts([0, 0, 0]), radii: [0.0028, 0.0042, 0.0024], color: INK, bone: 'head',
    morphs: {
      mouthSmile: { pts: mouthPts([0.01, -0.008, 0.012]) },
      mouthFrown: { pts: mouthPts([-0.008, 0.006, -0.01]) },
    },
  });
  for (const side of [1, -1]) {
    const lift = side < 0 ? 0.006 : 0;
    const browXY = [[0.09, 1.02], [0.128, 1.032], [0.168, 1.018]];
    const browPts = (dy) => browXY.map(([x, y], i) => onSkin([side * x, y + lift + dy[i], 0.5], 0.004));
    strands.push({
      name: 'brow', pts: browPts([0, 0, 0]), radii: [0.005, 0.0072, 0.003], color: mul(C.skin, 0.6), bone: 'head',
      morphs: {
        browsUp: { pts: browPts([0.012, 0.012, 0.012]) },
        browsDown: { pts: browPts([-0.01, -0.01, -0.01]) },
        browsSad: { pts: browPts([0.01, 0.002, -0.006]) },
      },
    });
  }

  
  const skullTop = S.projectToSurface(S.union(0.06, cranium, dome), [0.02, 1.5, 0.02]);
  let accessory = null, hat = false;
  if (V.accessory === 'cap') {
    const [c1, c2] = V.tweed.map(linear);
    const tweed = (x, y, z) => {
      const check = Math.max(smooth(0.7, 0.9, Math.sin(x * 70)), smooth(0.7, 0.9, Math.sin(z * 70)));
      return mix(c1, c2, check * 0.8);
    };
    const crown = S.intersect(0.012, S.ellipsoid([0, 0, -0.01], [0.225, 0.105, 0.232]), S.plane([0, -1, 0], -0.004));
    const visor = S.intersect(0.006, S.ellipsoid([0, 0.014, 0.17], [0.16, 0.014, 0.11]), S.plane([0, 0, -1], -0.1));
    const capShape = S.union(0.022, crown, visor, S.sphere([0, 0.1, -0.01], 0.017));
    accessory = S.transform(S.paint(capShape, { material: 'cloth', color: tweed }), { translate: sub(skullTop, [0, 0.085, 0]), rotate: [-0.12, 0.35, 0.08 + hatTilt] });
    hat = true;
  } else if (V.accessory === 'daisy') {
    const at = S.projectToSurface(face, [0.19, 1.08, 0.12]);
    const n = S.normalAt(face, ...at);
    const f = S.frameFromNormal(norm(add(n, [0.2, 0.3, 0.3])));
    const petals = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.2;
      
      petals.push(S.transform(S.ellipsoid([0, 0, 0], [0.032, 0.013, 0.009]), { translate: [Math.cos(a) * 0.038, Math.sin(a) * 0.038, 0], rotate: [0, 0, a] }));
    }
    const flower = S.union(0.004,
      S.paint(S.union(0.006, petals), { material: 'cloth', color: linear('#fff4e0') }),
      S.paint(S.sphere([0, 0, 0.008], 0.018), { material: 'cloth', color: linear('#f3d27a') }),
      S.paint(S.transform(S.ellipsoid([0, 0, 0], [0.034, 0.013, 0.0085]), { translate: [0.03, -0.05, -0.008], rotate: [0, 0, -0.9] }), { material: 'cloth', color: linear('#9cc58a') }),
    );
    accessory = S.place(flower, add(at, mul(n, 0.012)), f.X, f.Y, f.Z);
  } else {
    const yarn = linear(V.beanie), pom = linear(V.pom);
    const cut = (x, y, z) => 1.03 + 0.3 * z - y;
    const capSolid = S.intersect(0.015, S.offset(S.union(0.06, cranium, dome), 0.02), S.field(cut));
    const pomAt = add(skullTop, [0.012, 0.055, -0.02]);
    const pompom = S.displace(S.sphere(pomAt, 0.058), (x, y, z) => -0.008 * (fbm3(x * 60, y * 60, z * 60, { seed: 91, octaves: 2 }) - 0.5), 0.006);
    const beanie = S.union(0.02,
      S.paint(capSolid, { material: 'cloth', color: (x, y, z) => {
        const brim = smooth(-0.045, -0.035, cut(x, y, z));
        const rib = 0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 60);
        return mix(yarn, mul(yarn, 0.8), (0.25 + 0.75 * brim) * rib);
      } }),
      S.paint(pompom, { material: 'cloth', color: pom }),
    );
    accessory = S.transform(beanie, { translate: [0, 0, 0], rotate: [0, 0, hatTilt * 0.4] });
    hat = true;
  }
  if (hat && lod === 2) fused.push(accessory);
  else if (L.accT > 0) rigid.push({ name: V.accessory, node: accessory, box: [add(skullTop, [-0.34, -0.3, -0.34]), add(skullTop, [0.34, 0.2, 0.34])], cell: L.acc, tris: L.accT, bone: 'head', material: 'cloth' });

  const scene = S.union(0, [body, jumperNode, ...(scarf ? [scarf] : []), ...(accessory ? [accessory] : [])]);
  return {
    joints, tails, extra, parts, body, fused, skull: face, cloth, rigid, strands, scene,
    crown: [S.projectToSurface(S.union(0.06, cranium, dome), [0.01, 1.5, 0.02]), earL.outer, earR.outer].map((n, i) => (i === 0 ? n : S.projectToSurface(n, add(i === 1 ? rootL : rootR, [0, 0.4, 0])))),
    eyes: { at: eyeAt, ER: [0.037, 0.047, 0.026] },
    bodyBox: [[-0.66, -0.06, -0.42], [0.66, hat && lod === 2 ? 1.36 : 1.26, 0.56]],
    contacts: b.contacts,
    
    
    hold: [0, 0.5, 0.35],
    
    
    gait: { walk: { elbow: 0.45, elbowSwing: 0.4, arm: 0.5 }, run: { elbow: 1.1 } },
    stretch: ANIMAL_STRETCH,
  };
}
