








































import { MeshData } from '../mesh/meshData.mjs';
import * as S from '../mesh/sdf.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { fbm3, valueNoise3 } from '../noise.mjs';
import { linear, SEASONS, seasonPalette } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';
import { smooth, mix, add, sub, mul, norm, strand } from './kit/character.mjs';
import { eyeVertexCount, eyeMorphs, strandWithMorphs } from './kit/face.mjs';


export const FACE_K = 0.7;

export const TIER = 'heroCharacter';
export const MOUND_TIER = 'dressing';












export const SCALE = 1.8;


export const MOUND_DEFAULT = Object.freeze({ widthM: 0.55, heightM: 0.22 });

const TAU = Math.PI * 2;








const VARIANTS = [
  {
    coat: '#7d7183', belly: '#f7ecd9', muzzle: '#a99bad', nose: '#e79aa6', claw: '#f6ead2',
    blaze: 0.55, pawUp: 'eyes', specs: false,
  },
  {
    coat: '#a4836a', belly: '#fbf2df', muzzle: '#c9ad92', nose: '#e08e94', claw: '#f5e8c8',
    blaze: 0.35, pawUp: 'chest', specs: false,
  },
  {
    coat: '#7f93a3', belly: '#f6f1e5', muzzle: '#adbcc7', nose: '#dd93a4', claw: '#efe2c9',
    blaze: 0.8, pawUp: 'chest', specs: true,
  },
];

const INK = linear('#2a2430');
const IRIS = linear('#1d1a2e');
const GLINT = linear('#fff6ea');
const WHISKER = linear('#f3e7d6');
const SMOKE = linear('#3c3340');



const LODS = [
  { body: 0.0062, small: 0.0028, eyeT: 90, glintT: 16, noseT: 90, specT: 0, sides: 4, whiskers: 4, brows: true },
  { body: 0.0075, small: 0.0034, eyeT: 44, glintT: 10, noseT: 42, specT: 0, sides: 3, whiskers: 3, brows: true },
  { body: 0.0115, small: 0.005, eyeT: 16, glintT: 0, noseT: 14, specT: 0, sides: 3, whiskers: 0, brows: false },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const L = LODS[lod];
  if (!L) throw new Error(`unknown lod ${lod}`);
  const budget = budgetFor(TIER, lod);
  const V = VARIANTS[(((seed - 1) % 3) + 3) % 3];
  const rng = new SeededRng(seed * 6151 + 29);
  const pose = rng.child('pose');
  const tilt = pose.rangeF(0.06, 0.12);          
  const turn = pose.rangeF(-0.16, -0.06);        
  const hipShift = pose.rangeF(0.008, 0.018);    
  
  
  
  
  
  
  
  
  const digSide = pose.chance(0.5) ? 1 : -1;
  const digLift = pose.rangeF(0.026, 0.038);
  const tailKick = pose.rangeF(0.22, 0.42);
  const ns = seed * 97 + 13;

  const C = {
    coat: linear(V.coat), belly: linear(V.belly), muzzle: linear(V.muzzle),
    nose: linear(V.nose), claw: linear(V.claw),
  };

  
  const hips = S.ellipsoid([hipShift, 0.145, -0.012], [0.098, 0.092, 0.101]);
  const belly = S.ellipsoid([hipShift * 0.4, 0.198, 0.016], [0.112, 0.1, 0.116]);
  const chest = S.ellipsoid([digSide * digLift * 0.5, 0.272, 0.006], [0.131, 0.101, 0.113]);
  
  
  
  
  
  
  
  const shoulder = S.ellipsoid([digSide * 0.04, 0.292 + digLift, 0.012], [0.058, 0.07, 0.07]);
  const haunch = S.ellipsoid([-digSide * 0.042, 0.150 - digLift * 0.7, -0.018], [0.062, 0.058, 0.07]);
  
  const headC = [turn * 0.09, 0.338, 0.062];
  const skullN = S.ellipsoid(headC, [0.093, 0.083, 0.098]);
  
  const snoutTip = [turn * 0.16 + 0.004, 0.302, 0.208];
  const snout = S.roundCone([headC[0], headC[1] - 0.004, headC[2] + 0.03], snoutTip, 0.058, 0.022);
  
  const earL = S.ellipsoid([0.07, 0.392, 0.012], [0.026, 0.021, 0.026]);
  const earR = S.ellipsoid([-0.073, 0.382, 0.006], [0.023, 0.019, 0.024]);

  
  
  const spadePaw = (at, side, outward) => {
    const parts = [S.ellipsoid([0, 0, 0], [0.026, 0.055, 0.042])];
    for (let i = 0; i < 4; i++) {
      const t = (i - 1.5) / 1.5;
      const len = 0.036 - Math.abs(t) * 0.008 + rng.rangeF(-0.003, 0.003);
      const base = [0, 0.046 - Math.abs(t) * 0.006, t * 0.028];
      parts.push(S.paint(S.roundCone(base, [0, base[1] + len, t * 0.034], 0.0085, 0.0028), { color: C.claw }));
    }
    const hand = S.union(0.008, parts);
    return S.transform(hand, { translate: at, rotate: [outward[0], side * outward[1], side * outward[2]] });
  };
  const shoulderL = [0.118, 0.288, 0.028], shoulderR = [-0.118, 0.284, 0.024];
  
  
  
  
  const upWrist = V.pawUp === 'eyes' ? [0.112, 0.372, 0.148] : [0.088, 0.268, 0.126];
  const armL = S.roundCone(shoulderL, upWrist, 0.043, 0.03);
  const wristR = [-0.128, 0.176, 0.086];
  const armR = S.roundCone(shoulderR, wristR, 0.044, 0.031);
  const pawL = spadePaw(upWrist, 1, V.pawUp === 'eyes' ? [1.15, 0.35, -1.25] : [0.9, 0.5, -0.5]);
  const pawR = spadePaw(wristR, -1, [0.35, 0.4, -0.55]);

  
  const legL = S.roundCone([0.066, 0.118, -0.004], [0.079, 0.03, 0.026], 0.036, 0.026);
  const legR = S.roundCone([-0.066, 0.114, -0.008], [-0.086, 0.03, 0.006], 0.036, 0.026);
  const footL = S.transform(S.ellipsoid([0, 0, 0], [0.026, 0.02, 0.046]), { translate: [0.081, 0.023, 0.036], rotate: [0, 0.35, 0] });
  const footR = S.transform(S.ellipsoid([0, 0, 0], [0.026, 0.02, 0.044]), { translate: [-0.088, 0.023, 0.016], rotate: [0, -0.45, 0] });

  
  const tail = S.roundCone([0, 0.152, -0.09], [Math.sin(tailKick) * 0.062, 0.108, -0.09 - Math.cos(tailKick) * 0.062], 0.019, 0.0065);

  
  const blazeAt = (x, y, z) => {
    if (z < 0) return 0;
    const wide = 0.052 + V.blaze * 0.05 + 0.02 * Math.sin(y * 21 + seed);
    const along = smooth(0.09, 0.15, y) * smooth(0.36, 0.3, y);
    return along * smooth(wide, wide * 0.35, Math.abs(x - 0.012 * V.blaze)) * smooth(0.02, 0.06, z);
  };
  const muzzleAt = (x, y, z) => smooth(0.1, 0.17, z) * smooth(0.365, 0.315, y);

  const coatColour = (x, y, z) => {
    
    const broad = valueNoise3(x * 9 + ns, y * 9, z * 9, ns);
    const grain = fbm3(x * 46, y * 46, z * 46, { octaves: 2, seed: ns + 4 });
    let c = mix(mul(C.coat, 0.93), mul(C.coat, 1.09), broad);
    c = mix(c, mul(c, 1.06), grain * 0.4);
    c = mix(c, C.muzzle, muzzleAt(x, y, z) * 0.85);
    return mix(c, C.belly, blazeAt(x, y, z));
  };

  
  
  
  
  const bodyN = S.union(0.02, [hips, belly, chest, shoulder, haunch, skullN, snout, earL, earR, armL, armR, legL, legR]);
  const withLimbs = S.union(0.012, [bodyN, pawL, pawR, footL, footR, tail]);
  
  const body = S.paint(S.displace(withLimbs, (x, y, z) => 0.0016 * (fbm3(x * 34, y * 34, z * 34, { octaves: 2, seed: ns + 9 }) - 0.5) * 2, 0.0016),
    { material: 'fur', color: coatColour });

  
  const md = new MeshData(`mole-${seed}-lod${lod}`);
  md.parts = [];
  const details = [];
  const detail = (name) => { const d = new MeshData(name); details.push(d); return d; };
  const groundAO = (x, y, z, c) => mul(c, 0.74 + 0.26 * smooth(0, 0.07, y));
  const part = (name, node, lo, hi, cell, target, opts, into = md) => {
    if (target <= 0) return;
    md.parts.push({ name, ...S.sdfPart(into, node, { min: lo, max: hi, cell, targetTris: target, ...opts }) });
  };

  const up = [0, 1, 0];
  const headTilt = S.rotationMatrix([tilt, turn, 0]);
  const fwd = S.applyRotation(headTilt, [0, 0, 1]);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const eyeCentres = [];
  const skin = S.union(0.02, [skullN, snout]);
  for (const side of [1, -1]) {
    const aim = [side * 0.052, 0.364, 0.122];
    const onHead = S.projectToSurface(skin, aim);
    const n = norm(add(mul(S.normalAt(skin, ...onHead), 0.7), mul(fwd, 0.3)));
    const f = S.frameFromNormal(n, up);
    
    const ER = [0.028, side > 0 ? 0.0115 : 0.0098, 0.011];
    const lens = S.transform(S.ellipsoid([0, 0, 0], ER), { rotate: [0, 0, side * -0.22] });
    const c = add(onHead, mul(n, 0.002));
    eyeCentres.push(c);
    const eyeFrom = eyeVertexCount(md);
    const eye =S.place(S.paint(lens, { material: 'eye', color: (x, y) => mix(IRIS, mul(IRIS, 2.1), smooth(-ER[1], ER[1], y)) }), c, f.X, f.Y, f.Z);
    part('eye', eye, sub(c, [0.05, 0.05, 0.05]), add(c, [0.05, 0.05, 0.05]), L.small, L.eyeT, { scene: skin, uvScale: 0.08, material: 'eye', aoMin: 0.72 });
    if (L.glintT > 0) {
      const g = add(c, add(mul(f.X, side * 0.008), add(mul(f.Y, ER[1] * 0.45), mul(f.Z, ER[2] * 0.8))));
      const glint = S.place(S.paint(S.ellipsoid([0, 0, 0], [0.005, 0.003, 0.0026]), { material: 'eye', color: GLINT }), g, f.X, f.Y, f.Z);
      part('glint', glint, sub(g, [0.02, 0.02, 0.02]), add(g, [0.02, 0.02, 0.02]), Math.min(L.small, 0.002), L.glintT, { uvScale: 0.08, material: 'eye', aoMin: 1 });
    }
    eyeMorphs(md, { from: eyeFrom, c, X: f.X, Y: f.Y, ER }); 
  }

  
  {
    const at = S.projectToSurface(S.union(0.042, [skullN, snout]), add(snoutTip, [0, 0.004, 0.03]));
    const n = norm(add(S.normalAt(snout, ...at), mul(fwd, 0.55)));
    const f = S.frameFromNormal(n, up);
    const pad = S.union(0.012, S.ellipsoid([0, 0.002, 0], [0.028, 0.019, 0.016]), S.ellipsoid([0, -0.011, 0.002], [0.013, 0.011, 0.013]));
    const nostrils = S.union(0.004,
      S.ellipsoid([0.011, 0.004, 0.012], [0.0055, 0.0075, 0.008]),
      S.ellipsoid([-0.0105, 0.0055, 0.012], [0.005, 0.0072, 0.008]));
    const c = sub(at, mul(n, 0.006));
    const nose = S.place(S.paint(S.subtract(0.003, pad, nostrils), { color: C.nose, material: 'fur' }), c, f.X, f.Y, f.Z);
    part('nose', nose, sub(c, [0.05, 0.05, 0.05]), add(c, [0.05, 0.05, 0.05]), L.small, L.noseT, { scene: body, uvScale: 0.08, aoMin: 0.78 });
  }

  
  
  const head = S.union(0.02, [skullN, snout]);
  const onSkin = (p, lift) => {
    const s = S.projectToSurface(head, p);
    return add(s, mul(S.normalAt(head, ...s), lift));
  };
  if (L.brows) {
    
    
    
    
    const browC = mul(C.coat, 0.42);
    for (const side of [1, -1]) {
      const y0 = 0.3825 + (side < 0 ? 0.003 : 0);
      
      
      
      
      const browPts = (dy) => [[side * 0.03, y0 - 0.004], [side * 0.055, y0], [side * 0.078, y0 - 0.005]]
        .map(([x, y], i) => onSkin([x, y + dy[i] * FACE_K, 0.135], 0.002));
      strandWithMorphs(md, {
        pts: browPts([0, 0, 0]), radii: [0.0026, 0.0042, 0.0022], color: browC, sides: L.sides, material: 'fur',
        morphs: {
          browsUp: { pts: browPts([0.010, 0.010, 0.010]) },
          browsDown: { pts: browPts([-0.012, -0.008, -0.008]) },
          browsSad: { pts: browPts([0.008, 0.001, -0.006]) },
        },
      });
    }
    const mouthPts = (dx, dy) => [[-0.03, 0.296], [-0.012, 0.288], [0.006, 0.289], [0.028, 0.298]]
      .map(([x, y], i) => onSkin([x + dx[i] * FACE_K, y + dy[i] * FACE_K, 0.16], 0.002));
    const mouthR = [0.0022, 0.0032, 0.0032, 0.002];
    const Z4 = [0, 0, 0, 0];
    strandWithMorphs(md, {
      pts: mouthPts(Z4, Z4), radii: mouthR, color: INK, sides: L.sides, material: 'fur',
      morphs: {
        mouthSmile: { pts: mouthPts([-0.004, 0, 0, 0.004], [0.012, -0.002, -0.002, 0.012]) },
        mouthFrown: { pts: mouthPts([0.002, 0, 0, -0.002], [-0.014, 0, 0, -0.014]) },
        mouthO: { pts: mouthPts([0.006, 0, 0, -0.006], [0, -0.010, -0.010, 0]), radii: mouthR.map((r) => r * 1.3) },
      },
    });
  }
  const whiskerSpecs = [
    [1, 0.318, 0.16, 0.115], [1, 0.304, 0.0, 0.128], [1, 0.291, -0.16, 0.104], [1, 0.33, 0.3, 0.09],
    [-1, 0.32, 0.14, 0.11], [-1, 0.302, -0.02, 0.125], [-1, 0.289, -0.17, 0.1], [-1, 0.333, 0.28, 0.086],
  ].filter((_, i) => i % 4 < L.whiskers);
  for (const [side, y0, fan, len] of whiskerSpecs) {
    const root = onSkin([side * 0.03, y0, 0.185], -0.003);
    const dir = norm([side * 1, fan, 0.42]);
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push(add(root, add(mul(dir, t * len), [0, -0.028 * t * t, 0])));
    }
    strand(detail('whisker'), pts, [0.0028, 0.0023, 0.0018, 0.0012, 0.0006], WHISKER, 3);
  }

  
  
  if (V.specs && lod < 2) {
    const [a, b] = eyeCentres;
    const ring = (c, side) => {
      const n = norm(add(sub(c, [0, 0.33, 0.06]), mul(fwd, 0.5)));
      const f = S.frameFromNormal(n, up);
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = (i / 12) * TAU;
        pts.push(add(add(c, mul(n, 0.012)), add(mul(f.X, Math.cos(t) * 0.036), mul(f.Y, Math.sin(t) * 0.033))));
      }
      strand(detail('specs'), pts, pts.map(() => 0.0032), SMOKE, 3, 'metal');
      return add(c, mul(n, 0.012));
    };
    const ca = ring(a, 1), cb = ring(b, -1);
    strand(detail('specs-bridge'), [ca, mul(add(ca, cb), 0.5), cb], [0.0026, 0.0026, 0.0026], SMOKE, 3, 'metal');
  }

  const detailTris = details.reduce((s, d) => s + d.triangleCount, 0);
  part('body', body, [-0.22, -0.02, -0.21], [0.24, 0.5, 0.29], L.body, budget - md.triangleCount - detailTris - 4, {
    scene: body, uvScale: 0.14, material: 'fur', tint: groundAO, ao: { reach: 0.08, strength: 1.1 }, aoMin: 0.58,
  });
  for (const d of details) {
    if (md.triangleCount + d.triangleCount > budget) { md.parts.push({ name: `${d.name} (dropped)`, fine: 0, tris: 0 }); continue; }
    md.append(d);
  }

  
  
  
  for (const g of md.groups.values()) for (let i = 0; i < g.positions.length; i++) g.positions[i] *= SCALE;
  for (const m of Object.values(md.morphs)) for (const d of m.index.values()) for (let k = 0; k < 3; k++) d[k] *= SCALE;
  const minY = md.bounds().min[1];
  for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) g.positions[i] -= minY;
  return md;
}








const MOUND_LODS = [
  { cell: 0.0135, clods: 7, snowT: 110 },
  { cell: 0.0175, clods: 5, snowT: 55 },
  { cell: 0.026, clods: 3, snowT: 0 },
];

export function generateMound({ seed = 1, season = 'summer', lod = 0, widthM = MOUND_DEFAULT.widthM, heightM = MOUND_DEFAULT.heightM } = {}) {
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  const L = MOUND_LODS[lod];
  if (!L) throw new Error(`unknown lod ${lod}`);
  const rng = new SeededRng(seed * 4813 + 7);
  const ns = rng.rangeI(1, 1e6);
  const pal = seasonPalette(season);
  const soil = linear('#6b5138'), soilDark = linear('#4a3826'), soilLight = linear('#8a6b49');

  
  const rx = (widthM / 2) * rng.rangeF(0.94, 1.06);
  const rz = (widthM / 2) * rng.rangeF(0.94, 1.06);
  const lean = [rng.rangeF(-0.05, 0.05) * widthM, 0, rng.rangeF(-0.05, 0.05) * widthM];
  let heap = S.ellipsoid(lean, [rx, heightM, rz]);
  for (let i = 0; i < L.clods; i++) {
    const a = rng.rangeF(0, TAU), rr = rng.rangeF(0.55, 1.02);
    const s = rng.rangeF(0.1, 0.19) * widthM;
    heap = S.union(0.018 * widthM / 0.55, heap, S.ellipsoid(
      [Math.cos(a) * rx * rr, rng.rangeF(0.02, 0.5) * heightM, Math.sin(a) * rz * rr],
      [s, s * rng.rangeF(0.5, 0.8), s * rng.rangeF(0.8, 1.2)],
    ));
  }
  const amp = 0.05 * heightM;
  heap = S.displace(heap, (x, y, z) => amp * (fbm3(x * 26, y * 26, z * 26, { octaves: 3, seed: ns }) - 0.5) * 2, amp);
  heap = S.intersect(0.004, heap, S.plane([0, -1, 0], 0));

  const node = S.paint(heap, {
    material: 'soil',
    color: (x, y, z) => {
      const crumb = valueNoise3(x * 90, y * 90, z * 90, ns + 3);
      const high = smooth(heightM * 0.25, heightM * 0.85, y);
      return mix(mix(soilDark, soil, crumb), soilLight, high * 0.45);
    },
  });

  const md = new MeshData(`moleMound-${seed}-${season}-lod${lod}`);
  md.parts = [];
  const pad = 0.05 * widthM;
  const box = [
    [-rx - widthM * 0.25 - pad, -0.01, -rz - widthM * 0.25 - pad],
    [rx + widthM * 0.25 + pad, heightM * 1.35 + pad, rz + widthM * 0.25 + pad],
  ];
  const budget = budgetFor(MOUND_TIER, lod);
  const snow = season === 'winter' && L.snowT > 0;
  const cell = L.cell * (widthM / MOUND_DEFAULT.widthM);
  md.parts.push({ name: 'heap', ...S.sdfPart(md, node, { min: box[0], max: box[1], cell, targetTris: budget - (snow ? L.snowT : 0) - 4, material: 'soil', uvScale: 0.14, aoMin: 0.6 }) });
  if (snow) {
    
    const cap = S.paint(S.intersect(0.01, S.offset(heap, 0.006), S.plane([0, -1, 0], heightM * 0.45)), { material: 'snow', color: linear(pal.snow[0]) });
    md.parts.push({ name: 'snow', ...S.sdfPart(md, cap, { min: box[0], max: box[1], cell: cell * 2.4, targetTris: L.snowT, scene: node, material: 'snow', uvScale: 0.14, aoMin: 0.7 }) });
  }
  const minY = md.bounds().min[1];
  for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) g.positions[i] -= minY;
  return md;
}
