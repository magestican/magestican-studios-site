






















import { MeshData } from '../mesh/meshData.mjs';
import { eyeVertexCount, eyeMorphs, strandWithMorphs } from './kit/face.mjs';
import * as S from '../mesh/sdf.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { fbm3 } from '../noise.mjs';
import { linear, SEASONS } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';

export const TIER = 'heroCharacter';

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const VARIANTS = [
  {
    pattern: 'tabby', base: '#f5ad63', dark: '#d8783f', cream: '#fff2e0', brow: '#b9612f',
    vest: '#4f9d91', vestBack: '#3d7f7a', hat: 'bowler', hatScale: 1.4, hatColor: '#6b5048', band: '#f1d49a', whisker: '#fff6ea',
  },
  {
    pattern: 'calico', base: '#fcf1e1', patchA: '#f0a055', patchB: '#8a746c', cream: '#fff6ea', brow: '#6f5a57',
    vest: '#5c74bb', vestBack: '#4a5e9c', hat: 'boater', hatScale: 1.35, hatColor: '#ecca7e', band: '#cf5750', whisker: '#e6d6c4',
  },
  {
    
    pattern: 'tuxedo', base: '#554c4a', cream: '#fff4e8', brow: '#2e2726',
    vest: '#e6ab3e', vestBack: '#c68c2c', hat: 'topHat', hatScale: 1.08, hatColor: '#8e5282', band: '#f2c95c', whisker: '#fff6ea',
  },
];

const INK = linear('#2f2638');
const NOSE = linear('#ef8f9f');
const INNER_EAR = linear('#f5b1ba');
const EYE = linear('#1c1d42');
const EYE_LOW = linear('#36498f');
const HIGHLIGHT = linear('#fff8ec');
const GOLD = linear('#eab85a');
const STEEL = linear('#c9c4bd');



const LODS = [
  { body: 0.014, vest: 0.0105, hat: 0.008, small: 0.0045, vestT: 1000, hatT: 500, eyeT: 100, hiT: 16, noseT: 44, btnT: 32, keysT: 150, scarfT: 430, sides: 4, whiskers: 3, chain: true },
  { body: 0.015, vest: 0.01, hat: 0.009, small: 0.0055, vestT: 470, hatT: 240, eyeT: 50, hiT: 10, noseT: 22, btnT: 14, keysT: 64, scarfT: 200, sides: 3, whiskers: 2, chain: true },
  { body: 0.02, vest: 0.013, hat: 0.012, small: 0.007, vestT: 130, hatT: 70, eyeT: 18, hiT: 8, noseT: 10, btnT: 0, keysT: 0, scarfT: 60, sides: 3, whiskers: 0, chain: false },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const L = LODS[lod];
  if (!L) throw new Error(`unknown lod ${lod}`);
  const budget = budgetFor(TIER, lod);
  const vIndex = (((seed - 1) % 3) + 3) % 3;
  const V = VARIANTS[vIndex];
  const rng = new SeededRng(seed * 7919 + 17);
  const pose = rng.child('pose');
  const tilt = pose.rangeF(0.07, 0.13);
  const earFlop = pose.rangeF(0.42, 0.56);
  const tailSwing = pose.rangeF(-0.04, 0.04);
  const hatTilt = pose.rangeF(0.16, 0.26);
  const noiseSeed = seed * 131;

  const C = {
    base: linear(V.base), dark: linear(V.dark || V.base), cream: linear(V.cream), brow: linear(V.brow),
    patchA: linear(V.patchA || V.base), patchB: linear(V.patchB || V.base),
    vest: linear(V.vest), vestBack: linear(V.vestBack), hat: linear(V.hatColor), band: linear(V.band),
    whisker: linear(V.whisker),
  };

  
  
  
  const P = [0, 0.62, 0];
  const HS = 1.12;
  const R = S.rotationMatrix([0, 0, tilt]);
  const RT = transpose(R);
  const hp = (p) => add(S.applyRotation(R, mul(sub(p, P), HS)), P);
  const toHead = (p) => add(mul(S.applyRotation(RT, sub(p, P)), 1 / HS), P);
  const rel = (p) => sub(p, P);
  const H = (node) => S.transform(node, { translate: P, rotate: [0, 0, tilt], scale: HS });

  
  const pawBelly = [0.115, 0.37, 0.265];
  const pawKeys = [-0.3, 0.33, 0.07];
  const footL = [0.118, 0.046, 0.07];
  const footR = [-0.165, 0.046, 0.1];
  const paws = [pawBelly, pawKeys, footL, footR];
  const muzzleC = hp([0, 0.705, 0.27]);

  const tailPts = catmull([
    [0.02, 0.24, -0.14], [0.08, 0.16, -0.3], [0.22 + tailSwing, 0.17, -0.4], [0.35 + tailSwing, 0.3, -0.42],
    [0.39 + tailSwing, 0.48, -0.36], [0.33 + tailSwing, 0.62, -0.31], [0.22 + tailSwing, 0.64, -0.3], [0.19 + tailSwing, 0.56, -0.31],
  ], 3);
  const tailTip = tailPts[tailPts.length - 1];

  
  
  
  const coat = (x, y, z) => {
    const p = [x, y, z];
    const q = toHead(p); 
    const muzzle = 1 - smooth(0.07, 0.11, dist(q, [0, 0.705, 0.27]));
    const face = (1 - smooth(0.17, 0.22, Math.hypot(q[0] / 1.15, q[1] - 0.8))) * smooth(0.0, 0.12, q[2]);
    const bellyE = ((x - 0.01) / 0.13) ** 2 + ((y - 0.33) / 0.17) ** 2;
    const belly = (1 - smooth(0.8, 1.0, bellyE)) * smooth(0.06, 0.14, z);
    
    let paw = 0;
    for (const c of paws) paw = Math.max(paw, 1 - smooth(0.045, 0.085, dist(p, c)));
    if (V.pattern === 'tabby') {
      
      const back = smooth(0.1, -0.15, z);
      const wave = 0.04 * Math.sin(x * 9 + z * 7);
      let stripe = smooth(0.68, 0.76, 0.5 + 0.5 * Math.sin((y + wave) * 30 + Math.atan2(x, -z) * 0.5)) * back;
      const tail = 1 - smooth(0.05, 0.09, distToPolyline(p, tailPts));
      if (tail > 0) stripe = Math.max(stripe, tail * smooth(0.66, 0.74, 0.5 + 0.5 * Math.sin((x - z + y) * 26)));
      stripe *= 1 - face;
      const c = mix(C.base, C.dark, stripe * 0.75);
      return mix(c, C.cream, Math.max(muzzle, belly * 0.9, paw * 0.8));
    }
    if (V.pattern === 'calico') {
      
      
      
      
      const orange = Math.max(
        1 - smooth(0.15, 0.18, dist(q, [0.24, 0.97, 0.0])),
        1 - smooth(0.17, 0.2, dist(p, [0.12, 0.38, -0.2])),
        (1 - smooth(0.05, 0.09, distToPolyline(p, tailPts))) * smooth(0.35, 0.45, y),
      );
      const darkPatch = Math.max(1 - smooth(0.13, 0.16, dist(q, [-0.25, 1.0, 0.0])), 1 - smooth(0.12, 0.15, dist(p, [-0.14, 0.25, -0.12])));
      const clear = Math.max(muzzle, belly, paw, face);
      const a = orange * (1 - clear);
      const b = darkPatch * (1 - clear) * (1 - a);
      return mix(mix(C.base, C.patchA, a), C.patchB, b);
    }
    
    const bib = (1 - smooth(0.8, 1, (x / 0.14) ** 2 + ((y - 0.5) / 0.2) ** 2)) * smooth(0.04, 0.12, z);
    const blaze = (1 - smooth(0.75, 1, (q[0] / 0.05) ** 2 + ((q[1] - 0.77) / 0.075) ** 2)) * smooth(0.1, 0.2, q[2]);
    const tipW = 1 - smooth(0.07, 0.1, dist(p, tailTip));
    return mix(C.base, C.cream, Math.max(muzzle, bib, blaze, paw, tipW, belly * 0.6));
  };
  const coatHead = (x, y, z) => coat(...hp(add([x, y, z], P)));

  
  const cranium = S.ellipsoid(rel([-0.005, 0.8, 0.02]), [0.315, 0.265, 0.27]);
  const skull = S.union(0.06,
    cranium,
    S.ellipsoid(rel([0.19, 0.715, 0.12]), [0.13, 0.1, 0.12]),
    S.ellipsoid(rel([-0.2, 0.712, 0.115]), [0.13, 0.1, 0.12]),
    S.ellipsoid(rel([0.038, 0.712, 0.262]), [0.062, 0.05, 0.052]),
    S.ellipsoid(rel([-0.036, 0.71, 0.262]), [0.062, 0.05, 0.052]),
    S.ellipsoid(rel([0, 0.668, 0.225]), [0.055, 0.035, 0.045]),
  );
  const tufts = [
    [[0.27, 0.73, 0.06], [0.36, 0.69, 0.04], 0.05],
    [[0.25, 0.66, 0.07], [0.33, 0.615, 0.06], 0.04],
    [[-0.27, 0.72, 0.06], [-0.37, 0.675, 0.05], 0.052],
    [[-0.255, 0.65, 0.08], [-0.315, 0.605, 0.08], 0.036],
    [[-0.22, 0.61, 0.1], [-0.25, 0.575, 0.12], 0.03],
  
  ].map(([a, b, r]) => S.roundCone(rel(a), rel(add(a, mul(sub(b, a), 0.8))), r, r * 0.45));
  const ear = (side, flop) => {
    const outer = S.transform(S.roundCone([0, 0, 0], [0, 0.18, 0], 0.1, 0.02), { scale: [1, 1, 0.42] });
    const cup = S.transform(S.roundCone([0, 0.03, 0], [0, 0.165, 0], 0.068, 0.009), { scale: [1, 1, 0.34], translate: [0, 0, 0.03] });
    const where = { translate: rel([side * 0.185, 0.975, -0.01]), rotate: [-0.12, side * -0.3, side * -flop] };
    return S.subtract(0.014, S.paint(S.transform(outer, where), { color: coatHead }),
      S.paint(S.transform(cup, where), { color: INNER_EAR }), { cutColor: true });
  };
  const headLocal = S.union(0.035,
    S.union(0.04, S.paint(skull, { color: coatHead }), ear(1, 0.3), ear(-1, earFlop)),
    S.paint(S.union(0, tufts), { color: coatHead }),
  );
  const head = H(headLocal);

  
  const torso = S.union(0.08,
    S.ellipsoid([0.018, 0.33, -0.01], [0.235, 0.215, 0.205]),
    S.ellipsoid([-0.005, 0.47, 0.0], [0.18, 0.14, 0.165]),
    S.sphere([0.012, 0.31, 0.07], 0.15),
  );
  const core = S.union(0.07, S.paint(torso, { color: coat }), head);
  
  
  const armBelly = S.union(0.045,
    S.roundCone([0.13, 0.52, 0.0], [0.25, 0.41, 0.08], 0.095, 0.074),
    S.roundCone([0.25, 0.41, 0.08], pawBelly, 0.074, 0.066),
    S.ellipsoid(pawBelly, [0.074, 0.068, 0.066]),
  );
  const armKeys = S.union(0.045,
    S.roundCone([-0.13, 0.52, 0.0], [-0.24, 0.42, 0.035], 0.095, 0.076),
    S.roundCone([-0.24, 0.42, 0.035], [-0.29, 0.345, 0.06], 0.076, 0.068),
    S.ellipsoid(pawKeys, [0.074, 0.072, 0.07]),
  );
  const legs = S.union(0.03,
    S.roundCone([0.1, 0.2, 0.0], [0.114, 0.075, 0.03], 0.085, 0.065),
    S.transform(S.ellipsoid([0, 0, 0], [0.07, 0.048, 0.1]), { translate: footL, rotate: [0, -0.08, 0] }),
    S.roundCone([-0.085, 0.21, 0.01], [-0.155, 0.08, 0.06], 0.08, 0.062),
    S.transform(S.ellipsoid([0, 0, 0], [0.068, 0.048, 0.1]), { translate: footR, rotate: [0, -0.4, 0] }),
  );
  const tailRad = (i) => 0.056 - 0.024 * (i / (tailPts.length - 1));
  const tail = S.union(0, tailPts.slice(1).map((p, i) => S.roundCone(tailPts[i], p, tailRad(i), tailRad(i + 1))));
  const body = S.union(0.05,
    S.union(0.05, core, S.paint(armBelly, { color: coat }), S.paint(armKeys, { color: coat })),
    S.paint(legs, { color: coat }),
    S.paint(tail, { color: coat }),
  );

  
  const vestOff = 0.013, vestT = 0.0095;
  const folds = (x, y, z) => {
    const belly = Math.exp(-(((x - 0.05) / 0.13) ** 2 + ((y - 0.31) / 0.09) ** 2)) * smooth(-0.05, 0.12, z);
    const side = smooth(0.13, 0.22, Math.abs(x)) * smooth(0.36, 0.26, y);
    const drag = fbm3(x * 9, y * 9, z * 9, { seed: noiseSeed + 5, octaves: 2 }) - 0.5;
    return 0.0045 * Math.sin(y * 58 + x * 20) * belly + 0.003 * Math.sin(y * 85 + z * 12) * side + 0.006 * drag;
  };
  const hemY = (x, z) => {
    const front = smooth(0.02, 0.16, z);
    const point = Math.max(0, 1 - Math.abs(Math.abs(x) - 0.055) / 0.09);
    return 0.235 - front * 0.055 * point;
  };
  
  
  
  const fuse = lod > 0;
  const cut = (node) => {
    let v = S.intersect(0.008, node, S.field((x, y, z) => Math.max(hemY(x, z) - y, y - 0.585)));
    return S.subtract(0.012, v, S.field((x, y, z) => Math.max((Math.abs(x) - (y - 0.425) * 0.72) / 1.23, 0.03 - z)));
  };
  let vest = fuse
    ? cut(S.displace(torso, (x, y, z) => -(vestOff + 2 * vestT) - folds(x, y, z), 0.04))
    : cut(S.shell(S.displace(torso, (x, y, z) => -(vestOff + vestT) - folds(x, y, z), 0.04), vestT));
  if (!fuse) vest = S.subtract(0.015, vest, S.union(0, S.capsule([0.12, 0.535, 0.0], [0.27, 0.45, 0.03], 0.095), S.capsule([-0.12, 0.535, 0.0], [-0.27, 0.45, 0.03], 0.095)));
  const vestOuter = S.offset(torso, vestOff + 2 * vestT);
  const pocketAt = S.projectToSurface(vestOuter, [0.12, 0.285, 0.35]);
  {
    const f = S.frameFromNormal(S.normalAt(vestOuter, ...pocketAt));
    const flap = S.place(S.roundBox([0, 0, 0], [0.05, 0.016, 0.01], 0.008), sub(pocketAt, mul(f.Z, 0.003)), f.X, f.Y, f.Z);
    vest = S.union(0.006, vest, flap);
  }
  const vestColor = (x, y, z) => {
    let c = mix(C.vestBack, C.vest, smooth(-0.1, 0.02, z));
    const hemBand = smooth(0.03, 0.012, y - hemY(x, z));
    c = mix(c, mul(c, 0.8), hemBand);
    return c;
  };
  vest = S.paint(vest, { color: vestColor, material: 'cloth' });

  
  const hatNode = buildHat(V.hat, C, lod === 2 ? 2 : 1);
  const hatBase = S.projectToSurface(head, hp([0.03, 1.2, 0.03]));
  const hatN = S.normalAt(head, ...hatBase);
  
  
  const hat = S.transform(hatNode, { translate: sub(hatBase, mul(hatN, 0.022 * V.hatScale)), rotate: [-0.12, 0.3, tilt - hatTilt], scale: V.hatScale });

  
  let scarf = null;
  if (season === 'winter') {
    const red = linear('#d9544d'), stripe = linear('#fff1e2');
    
    
    
    
    
    
    const roll = S.transform(S.torus([0, 0, 0], 0.185, 0.052), { translate: [0, 0.585, 0.01], rotate: [0.16, 0, -0.05], scale: [1, 0.8, 1] });
    const tailTop = [0.11, 0.56, 0.2];
    const tailBot = S.projectToSurface(vestOuter, [0.14, 0.4, 0.35]);
    const tailN = S.normalAt(vestOuter, ...tailBot);
    const tailF = S.frameFromNormal(tailN, sub(tailTop, tailBot));
    const tailLen = dist(tailTop, tailBot);
    const tailPiece = S.place(S.roundBox([0, -tailLen / 2, 0], [0.04, tailLen / 2 + 0.01, 0.012], 0.011), add(tailTop, mul(tailN, 0.025)), tailF.X, tailF.Y, tailF.Z);
    scarf = S.paint(S.union(0.03, roll, tailPiece), {
      material: 'cloth',
      color: (x, y) => (y < 0.5 ? mix(red, stripe, smooth(0.6, 0.8, 0.5 + 0.5 * Math.sin(y * 70))) : red),
    });
  }

  const scene = S.union(0, [body, vest, hat, ...(scarf ? [scarf] : [])]);
  const wearer = fuse
    ? S.union(0.004, [body, vest, ...(scarf ? [scarf] : []), ...(lod === 2 ? [hat] : [])])
    : body;
  const md = new MeshData(`cat-${seed}-${season}-lod${lod}`);
  md.parts = [];
  
  
  
  const details = [];
  const detail = (name) => { const d = new MeshData(name); details.push(d); return d; };
  const groundAO = (x, y, z, c) => mul(c, 0.72 + 0.28 * smooth(0.0, 0.08, y));

  const part = (name, node, lo, hi, cell, target, opts, into = md) => {
    if (target <= 0) return;
    md.parts.push({ name, ...S.sdfPart(into, node, { min: lo, max: hi, cell, targetTris: target, ...opts }) });
  };

  
  
  const fwd = S.applyRotation(R, [0, 0, 1]);
  const up = S.applyRotation(R, [0, 1, 0]);
  for (const side of [1, -1]) {
    const onHead = S.projectToSurface(head, hp([side * 0.128, 0.812, 0.4]));
    const n = norm(add(mul(S.normalAt(head, ...onHead), 0.7), mul(fwd, 0.3)));
    const f = S.frameFromNormal(n, up);
    
    
    const ES = 1.1; 
    const ER = [0.046 * ES, 0.058 * ES, 0.03 * ES];
    const lid = (o) => S.plane([side * 0.35, -1, 0], o);
    const shape = S.intersect(0.008, S.ellipsoid([0, 0, 0], ER), lid(0.045 * ES));
    const eyeC = sub(onHead, mul(n, 0.012));
    const eyeFrom = eyeVertexCount(md);
    const eye =S.place(S.paint(shape, { material: 'eye', color: (x, y) => mix(EYE, EYE_LOW, smooth(-0.005, -0.045, y) * 0.8) }), eyeC, f.X, f.Y, f.Z);
    part('eye', eye, sub(eyeC, [0.08, 0.08, 0.08]), add(eyeC, [0.08, 0.08, 0.08]), L.small, L.eyeT, { scene: head, uvScale: 0.1, material: 'eye', aoMin: 0.7 });
    
    
    const eyeRingC = sub(eyeC, mul(n, 0.01));
    const eyeRing = S.place(S.paint(S.intersect(0.008, S.ellipsoid([0, 0, 0], [0.053 * ES, 0.065 * ES, 0.028 * ES]), lid(0.051 * ES)), { material: 'eye', color: HIGHLIGHT }), eyeRingC, f.X, f.Y, f.Z);
    
    
    if (lod < 2) part('eyeRing', eyeRing, sub(eyeRingC, [0.08, 0.08, 0.08]), add(eyeRingC, [0.08, 0.08, 0.08]), L.small, L.eyeT >> 1, { scene: head, uvScale: 0.1, material: 'eye', aoMin: 0.6 });
    const his = [[0.013 * ES, 0.02 * ES, [0.016 * ES, 0.02 * ES, 0.006]], [-0.012 * ES, -0.022 * ES, [0.008 * ES, 0.008 * ES, 0.004]]];
    for (const [hx, hy, r] of his.slice(0, lod === 2 ? 1 : 2)) {
      const hz = ER[2] * Math.sqrt(Math.max(0, 1 - (hx / ER[0]) ** 2 - (hy / ER[1]) ** 2)) - 0.0015;
      const c = add(eyeC, add(mul(f.X, hx), add(mul(f.Y, hy), mul(f.Z, hz))));
      const hi = S.place(S.paint(S.ellipsoid([0, 0, 0], r), { material: 'eye', color: HIGHLIGHT }), c, f.X, f.Y, f.Z);
      part('highlight', hi, sub(c, [0.03, 0.03, 0.03]), add(c, [0.03, 0.03, 0.03]), Math.min(L.small, 0.0035), L.hiT, { uvScale: 0.1, material: 'eye', aoMin: 1 });
    }
    eyeMorphs(md, { from: eyeFrom, c: eyeC, X: f.X, Y: f.Y, ER }); 
  }
  
  {
    const at = S.projectToSurface(head, hp([0, 0.752, 0.45]));
    const n = norm(add(S.normalAt(head, ...at), mul(fwd, 0.5)));
    const f = S.frameFromNormal(n, up);
    const shape = S.union(0.018, S.ellipsoid([0, 0.004, 0], [0.034, 0.02, 0.022]), S.ellipsoid([0, -0.012, 0.003], [0.013, 0.012, 0.016]));
    const c = sub(at, mul(n, 0.008));
    const nose = S.place(S.paint(shape, { color: NOSE, material: 'fur' }), c, f.X, f.Y, f.Z);
    part('nose', nose, sub(c, [0.06, 0.06, 0.06]), add(c, [0.06, 0.06, 0.06]), L.small, L.noseT, { scene: head, uvScale: 0.1, aoMin: 0.75 });
  }
  
  const onSkin = (p, lift) => {
    const s = S.projectToSurface(head, hp(p));
    return add(s, mul(S.normalAt(head, ...s), lift));
  };
  const sides = L.sides;
  const mouthY = 0.712;
  
  
  
  
  
  
  
  
  
  const MOUTH_K = 2.3;
  const moveTo = (xy, dx, dy) => xy.map(([x, y], i) => onSkin([x + dx[i], y + dy[i] * MOUTH_K, 0.45], 0.002));
  const MOUTH_L = [[-0.058, 0.719], [-0.04, 0.699], [-0.018, 0.697], [0, mouthY], [0, 0.738]];
  const MOUTH_R = [[0, mouthY], [0.02, 0.697], [0.043, 0.701], [0.064, 0.726]];
  const RL = [0.0028, 0.0042, 0.0045, 0.0045, 0.0025], RR = [0.0045, 0.0045, 0.0042, 0.0026];
  const Z5 = [0, 0, 0, 0, 0], Z4 = [0, 0, 0, 0];
  strand(md, moveTo(MOUTH_L, Z5, Z5), RL, INK, sides, 'fur', {
    mouthSmile: { pts: moveTo(MOUTH_L, [-0.004, -0.002, 0, 0, 0], [0.012, 0.005, 0, -0.002, -0.002]) },
    mouthFrown: { pts: moveTo(MOUTH_L, [0.002, 0.001, 0, 0, 0], [-0.014, -0.004, 0.001, 0, 0]) },
    mouthO: { pts: moveTo(MOUTH_L, [0.006, 0.003, 0, 0, 0], [0, -0.006, -0.009, -0.010, -0.004]), radii: RL.map((r) => r * 1.3) },
  });
  strand(md, moveTo(MOUTH_R, Z4, Z4), RR, INK, sides, 'fur', {
    mouthSmile: { pts: moveTo(MOUTH_R, [0, 0, 0.002, 0.004], [-0.002, 0, 0.005, 0.012]) },
    mouthFrown: { pts: moveTo(MOUTH_R, [0, 0, -0.001, -0.002], [0, 0.001, -0.004, -0.014]) },
    mouthO: { pts: moveTo(MOUTH_R, [0, 0, -0.003, -0.006], [-0.010, -0.009, -0.006, 0]), radii: RR.map((r) => r * 1.3) },
  });
  for (const side of [1, -1]) {
    
    const browPts = (dy) => [[0.074, 0.924], [0.119, 0.938], [0.162, 0.922]].map(([x, y], i) => onSkin([side * x, y + dy[i] + (side < 0 ? 0.005 : 0), 0.5], 0.004));
    strand(md, browPts([0, 0, 0]), [0.006, 0.0085, 0.0035], C.brow, sides, 'fur', {
      browsUp: { pts: browPts([0.010, 0.010, 0.010]) },
      browsDown: { pts: browPts([-0.012, -0.008, -0.008]) },
      browsSad: { pts: browPts([0.008, 0.001, -0.006]) },
    });
  }
  const whiskerSpecs = [
    [1, 0.735, 0.1, 0.2], [1, 0.718, -0.02, 0.21], [1, 0.702, -0.14, 0.18],
    [-1, 0.732, 0.12, 0.19], [-1, 0.714, 0.0, 0.215], [-1, 0.7, -0.12, 0.17],
  ].filter((_, i) => (L.whiskers === 3 ? true : L.whiskers === 2 ? i % 3 !== 1 : false));
  for (const [side, y0, fan, len] of whiskerSpecs) {
    const root = onSkin([side * 0.075, y0, 0.45], -0.004);
    const dir = norm(S.applyRotation(R, [side * 1, fan, -0.18]));
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push(add(root, add(mul(dir, t * len), mul(up, -0.03 * t * t))));
    }
    strand(detail('whisker'), pts, [0.0035, 0.003, 0.0024, 0.0016, 0.0008], C.whisker, 3);
  }

  
  const buttonYs = [0.405, 0.335, 0.265];
  const buttons = buttonYs.map((y) => {
    const at = S.projectToSurface(vestOuter, [0, y, 0.4]);
    return { at, n: S.normalAt(vestOuter, ...at) };
  });
  if (L.btnT > 0) {
    for (const { at, n } of buttons) {
      const f = S.frameFromNormal(n);
      const shape = S.subtract(0.004, S.ellipsoid([0, 0, 0], [0.017, 0.017, 0.008]), S.sphere([0, 0, 0.016], 0.011));
      const btn = S.place(S.paint(shape, { color: GOLD, material: 'metal' }), at, f.X, f.Y, f.Z);
      part('button', btn, sub(at, [0.03, 0.03, 0.03]), add(at, [0.03, 0.03, 0.03]), 0.003, L.btnT, { scene: vest, uvScale: 0.05, material: 'metal', aoMin: 0.6 }, detail('button'));
    }
  }
  if (L.chain) {
    const from = buttons[1].at;
    const to = add(pocketAt, [-0.02, 0.012, 0]);
    const pts = [];
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = add(mix(from, to, t), [0, -0.05 * Math.sin(Math.PI * t), 0]);
      const s = S.projectToSurface(vestOuter, p);
      pts.push(add(s, mul(S.normalAt(vestOuter, ...s), 0.008)));
    }
    const radii = pts.map((_, i) => (i === N ? 0.0015 : 0.0038 + 0.0018 * Math.abs(Math.sin(i * 1.7))));
    strand(detail('chain'), pts, radii, GOLD, sides, 'metal');
  }
  
  if (L.keysT > 0) {
    const ringC = add(pawKeys, [-0.012, -0.075, 0.03]);
    const ring = S.transform(S.torus([0, 0, 0], 0.034, 0.0055), { translate: ringC, rotate: [Math.PI / 2, 0.3, 0] });
    const key = (angle, len) => {
      const k = S.union(0.004,
        S.torus([0, 0, 0], 0.013, 0.005),
        S.roundCone([0, 0, -0.012], [0, 0, -len], 0.0055, 0.0045),
        S.roundBox([0.008, 0, -len + 0.012], [0.007, 0.003, 0.004], 0.002),
        S.roundBox([0.007, 0, -len + 0.026], [0.005, 0.003, 0.003], 0.002),
      );
      return S.transform(k, { translate: add(ringC, [Math.sin(angle) * 0.034, -Math.cos(angle) * 0.034, 0]), rotate: [Math.PI / 2 - 0.1, angle, 0] });
    };
    const keys = S.union(0.003, S.paint(ring, { color: STEEL, material: 'metal' }),
      S.paint(key(0.35, 0.075), { color: GOLD, material: 'metal' }), S.paint(key(-0.3, 0.06), { color: STEEL, material: 'metal' }));
    part('keys', keys, sub(ringC, [0.1, 0.12, 0.08]), add(ringC, [0.1, 0.06, 0.08]), 0.0035, L.keysT, { scene: S.union(0, body, keys), uvScale: 0.05, material: 'metal', aoMin: 0.6 }, detail('keys'));
  }

  
  if (lod < 2) part('hat', hat, sub(hatBase, [0.4, 0.14, 0.4]), add(hatBase, [0.4, 0.42, 0.4]), L.hat, L.hatT, { scene, uvScale: 0.1, material: 'cloth' });
  if (!fuse) {
    part('vest', vest, [-0.34, 0.12, -0.3], [0.34, 0.64, 0.36], L.vest, L.vestT, { scene, uvScale: 0.1, material: 'cloth' });
    if (scarf) part('scarf', scarf, [-0.36, 0.28, -0.32], [0.36, 0.7, 0.4], L.vest, L.scarfT, { scene, uvScale: 0.1, material: 'cloth' });
  }

  
  
  const detailTris = details.reduce((s, d) => s + d.triangleCount, 0);
  
  
  const top = lod === 2 ? 1.6 : 1.36;
  
  
  part('body', wearer, [-0.52, -0.06, -0.54], [0.54, top, 0.46], L.body, budget - md.triangleCount - detailTris - 4, {
    scene, uvScale: 0.28, material: 'fur', tint: groundAO, ao: { reach: 0.12, strength: 1.1 }, aoMin: 0.55,
  });
  for (const d of details) {
    if (md.triangleCount + d.triangleCount > budget) { md.parts.push({ name: `${d.name} (dropped)`, fine: 0, tris: 0 }); continue; }
    md.append(d);
  }

  
  const minY = md.bounds().min[1];
  for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) g.positions[i] -= minY;
  return md;
}



function buildHat(style, C, thick = 1) {
  const bandColor = (lo, hi) => (x, y) => mix(C.hat, C.band, smooth(lo - 0.004, lo, y) * smooth(hi + 0.004, hi, y));
  const curl = (node, c) => S.warp(node, (x, y, z) => [x, y - c * x * x, z], 0.06);
  const brimOf = (r, h, e, c) => curl(S.roundCylinder([0, h * thick, 0], r, r, h * thick, e * thick), c);
  if (style === 'bowler') {
    const crown = S.intersect(0.01, S.ellipsoid([0, 0.02, 0], [0.108, 0.115, 0.1]), S.plane([0, -1, 0], 0));
    const brim = brimOf(0.158, 0.006, 0.0055, 1.6);
    return S.union(0.014, S.paint(crown, { color: bandColor(0.012, 0.038), material: 'cloth' }), S.paint(brim, { color: C.hat, material: 'cloth' }));
  }
  if (style === 'boater') {
    const crown = S.roundCylinder([0, 0.048, 0], 0.104, 0.1, 0.046, 0.014);
    const brim = brimOf(0.18, 0.0055, 0.005, -0.4);
    return S.union(0.01, S.paint(crown, { color: bandColor(0.014, 0.046), material: 'cloth' }), S.paint(brim, { color: C.hat, material: 'cloth' }));
  }
  const crown = S.roundCylinder([0, 0.093, 0], 0.084, 0.1, 0.088, 0.014);
  const brim = brimOf(0.148, 0.006, 0.0055, 2.2);
  return S.union(0.012, S.paint(crown, { color: bandColor(0.016, 0.05), material: 'cloth' }), S.paint(brim, { color: C.hat, material: 'cloth' }));
}

function transpose(R) {
  return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
}


function catmull(ctrl, per) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1].slice());
  return out;
}

function distToPolyline(p, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], ab = sub(pts[i + 1], a);
    const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
    best = Math.min(best, dist(p, add(a, mul(ab, t))));
  }
  return best;
}







function strand(md, pts, radii, color, sides, material = 'fur', morphs = null) {
  strandWithMorphs(md, { pts, radii, color, sides, material, morphs });
}
