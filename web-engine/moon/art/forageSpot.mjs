





































import { SeededRng } from '../../rng/seededRng.js';
import { MeshData } from '../mesh/meshData.mjs';
import * as S from '../mesh/sdf.mjs';
import { SEASONS, linear, seasonPalette } from '../palette/seasons.mjs';
import { valueNoise3, fbm3 } from '../noise.mjs';
import { buildItem, tube, bezier, leafBlade, mix, scl, smooth, TAU, norm } from './kit/items/core.mjs';
import { mushroomLocal } from './kit/items/forage.mjs';

export const TIER = 'dressing';
export const TYPES = Object.freeze(['mushroom', 'berries', 'dig']);
export const STAGES = Object.freeze(['ready', 'picked']);


const RADIUS = Object.freeze({ mushroom: 0.34, berries: 0.46, dig: 0.36 });

export function anchors({ type } = {}) {
  if (!TYPES.includes(type)) throw new Error(`unknown forage type '${type}' (types: ${TYPES.join(', ')})`);
  return { r: RADIUS[type] };
}

const formIndex = (seed, rng) => (seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2));
const ground = (node, k = 0.004) => S.intersect(k, node, S.plane([0, -1, 0], 0));
const LEAF_BAND = [0.08, 0.04, 0.42, 0.46];

export function generate({ seed = 1, season = 'summer', stage = 'ready', lod = 0, type } = {}) {
  if (!TYPES.includes(type)) throw new Error(`unknown forage type '${type}' (types: ${TYPES.join(', ')})`);
  if (!SEASONS.includes(season)) throw new Error(`unknown season '${season}'`);
  if (!STAGES.includes(stage)) throw new Error(`unknown forage stage '${stage}' (stages: ${STAGES.join(', ')})`);
  const d = lod | 0;
  if (!(d >= 0 && d <= 2)) throw new Error(`unknown lod ${lod}`);
  const key = `forage-${type}|${seed}`;
  const name = `forageSpot-${type}-${seed}-${season}-${stage}-lod${d}`;
  const ctx = { seed, season, stage, lod: d, key, name, pal: seasonPalette(season), rng: new SeededRng(seed).child(`forage-${type}`) };
  
  
  return type === 'mushroom' ? mushroomPatch(ctx) : type === 'berries' ? berryBush(ctx).sway({ perMetre: 0.08, power: 1.3 }) : digSpot(ctx);
}


function snowOn(node, above, ph, color) {
  return S.paint(S.intersect(0.004, S.offset(node, 0.0045), S.field((x, y, z) => above + 0.008 * Math.sin(Math.atan2(z, x) * 3 + ph) - y)), { material: 'snow', color });
}



const PATCH_LOOKS = [
  { color: '#eba4a8', stem: '#f3e6d0', spots: 6, conical: false, caps: [[0.052, 0.07], [0.036, 0.05], [0.028, 0.038], [0.02, 0.028]] },
  { color: '#d9ae7e', stem: '#efe2cc', spots: 0, conical: false, fat: true, caps: [[0.056, 0.058], [0.04, 0.046], [0.027, 0.03]] },
  { color: '#c9b6e4', stem: '#f1e8f4', spots: 0, conical: true, caps: [[0.03, 0.1], [0.026, 0.084], [0.022, 0.07], [0.019, 0.058], [0.016, 0.044]] },
];
const PATCH_SPOTS = [[-0.05, 0.03], [0.055, -0.02], [0.005, 0.075], [0.1, 0.055], [-0.105, -0.045]];

function mushroomPatch(ctx) {
  const { seed, season, stage, lod, key, name, pal, rng } = ctx;
  const look = PATCH_LOOKS[formIndex(seed, rng)];
  const ns = rng.rangeI(1, 1e6);
  const [rx, ry, rz] = [0.2 * rng.rangeF(0.95, 1.05), 0.05, 0.17 * rng.rangeF(0.95, 1.05)];
  const lean = rng.rangeF(0.2, 0.5) * (seed % 2 ? 1 : -1);
  const topAt = (x, z) => Math.max(0, ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - (z / rz) ** 2)) * (1 + lean * (x / rx) * 0.4));
  let cushion = S.ellipsoid([0, 0, 0], [rx, ry, rz]);
  cushion = S.union(0.05, cushion, S.ellipsoid([rx * 0.35 * Math.sign(lean), 0.005, -rz * 0.15], [rx * 0.55, ry * 1.2, rz * 0.6]));
  cushion = S.displace(cushion, (x, y, z) => 0.009 * (fbm3(x * 14, y * 14, z * 14, { octaves: 2, seed: ns }) - 0.5) * 2 - 0.004 * valueNoise3(x * 60, y * 60, z * 60, ns + 1), 0.013);
  
  
  
  
  
  
  cushion = ground(cushion, 0.016);
  const g0 = linear(pal.grass[0]), g1 = linear(pal.grass[1]), g2 = linear(pal.grass[2]);
  const cushionNode = S.paint(cushion, { material: 'grass', color: (x, y, z) => mix(mix(g2, g1, smooth(0, 0.03, y)), g0, 0.5 * smooth(0.035, 0.07, y) * valueNoise3(x * 30, y * 30, z * 30, ns + 2)) });
  const parts = [{ key: `${key}|cushion${season === 'winter' ? '-w' : ''}`, node: cushionNode, min: [-rx - 0.1, -0.01, -rz - 0.1], max: [rx + 0.1, 0.12, rz + 0.1], cell: 0.0055, share: 0.36, material: 'grass', uvScale: 0.1, maxCoarsen: 3 }];

  const mushrooms = [];
  const caps = look.caps.map(([capR, stemH], i) => {
    const [x, z] = PATCH_SPOTS[i];
    return { capR, stemH, x: x + rng.rangeF(-0.01, 0.01), z: z + rng.rangeF(-0.01, 0.01), yaw: rng.rangeF(0, TAU), bend: rng.rangeF(-0.2, 0.2) * capR, tilt: [rng.rangeF(-0.15, 0.15), 0, rng.rangeF(-0.2, 0.2)] };
  });
  if (stage === 'ready') {
    for (const c of caps) {
      const m = { capR: c.capR, capH: c.capR * (look.conical ? 0.95 : 0.62), stemH: c.stemH, stemR: c.capR * (look.fat ? 0.42 : look.conical ? 0.24 : 0.3), bend: c.bend, tilt: c.tilt, conical: look.conical, color: look.color, stem: look.stem, spots: look.spots && c.capR > 0.03 ? look.spots : 0 };
      mushrooms.push(S.transform(mushroomLocal(m, rng), { translate: [c.x, topAt(c.x, c.z) - 0.012, c.z], rotate: [0, c.yaw, 0] }));
    }
  } else {
    
    
    
    
    
    
    
    
    const cream = linear(look.stem);
    const cut = scl(linear(look.stem), 0.94);
    const bruise = mix(linear(look.stem), linear(look.color), 0.42);
    caps.slice(0, 3).forEach((c, i) => {
      const r = c.capR * (look.fat ? 0.52 : 0.42);
      
      
      
      
      
      
      const h = c.stemH * 0.58 + 0.023;
      const y0 = topAt(c.x, c.z) - 0.012;
      
      
      const tilt = [rng.rangeF(-0.24, 0.24), 1, rng.rangeF(-0.24, 0.24)];
      const stub = S.intersect(0.0025, S.capsule([c.x, y0 - 0.01, c.z], [c.x + c.bend * 0.45, y0 + h + 0.02, c.z], r), S.plane(tilt, y0 + h));
      mushrooms.push(S.paint(stub, {
        material: 'fruit',
        color: (x, y) => {
          const near = smooth(y0 + h - 0.016, y0 + h - 0.005, y);
          const face = smooth(y0 + h - 0.005, y0 + h, y);
          return mix(mix(cream, bruise, 0.6 * near), cut, face);
        },
      }));
    });
    
    
    
    const b = caps[caps.length - 1];
    mushrooms.push(S.transform(mushroomLocal({ capR: 0.017, capH: 0.013, stemH: 0.018, stemR: 0.006, bend: 0.0015, color: look.color, stem: look.stem }, rng), { translate: [b.x, topAt(b.x, b.z) - 0.007, b.z], rotate: [0, b.yaw, 0] }));
  }
  const group = S.union(0.004, mushrooms);
  const tallest = Math.max(...caps.map((c) => c.stemH + c.capR * 1.6)) + ry + 0.02;
  
  
  
  parts.push({ key: `${key}|${stage}${season === 'winter' ? '-w' : ''}`, node: group, min: [-0.2, -0.01, -0.14], max: [0.2, tallest, 0.16], cell: look.conical ? 0.0028 : 0.0034, share: stage === 'ready' ? 0.5 : 0.38, material: 'fruit', uvScale: 0.05, maxCoarsen: 4 });
  if (season === 'winter') {
    const white = linear(pal.snow[0]);
    const snow = [snowOn(cushion, ry * 0.55, ns, white)];
    if (stage === 'ready') for (const c of caps) snow.push(S.intersect(0.003, S.offset(group, 0.004), S.field((x, y, z) => Math.max(topAt(c.x, c.z) + c.stemH + c.capR * 0.1 - y, Math.hypot(x - c.x, z - c.z) - c.capR * 1.3))));
    parts.push({ key: `${key}|snow-${stage}`, node: S.paint(S.union(0.002, snow), { material: 'snow', color: white }), min: [-rx - 0.1, 0.0, -rz - 0.1], max: [rx + 0.1, tallest + 0.02, rz + 0.1], cell: 0.0045, share: 0.14, material: 'snow', uvScale: 0.1, maxCoarsen: 4 });
  }

  const extras = (md) => {
    const local = new MeshData('blades');
    const n = [11, 6, 2][lod];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rng.rangeF(-0.2, 0.2);
      const base = [Math.cos(a) * rx * 0.8, 0.012, Math.sin(a) * rz * 0.8];
      const dir = norm([Math.cos(a) * 0.55, 1, Math.sin(a) * 0.55]);
      const c = season === 'autumn' ? mix(linear(pal.grass[1]), linear(pal.leaf[0]), 0.3) : linear(pal.grass[i % 2 ? 1 : 0]);
      leafBlade(local, { base, dir, side: [-Math.sin(a), 0, Math.cos(a)], len: rng.rangeF(0.06, 0.09), wid: 0.02, color: c, rows: 2, shape: 'lance', curl: 0.3, droop: 0.25, window: LEAF_BAND });
    }
    if (lod < 2 && season === 'spring') {
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.4, at = [Math.cos(a) * rx * 0.55, 0, Math.sin(a) * rz * 0.5];
        at[1] = topAt(at[0], at[2]) + 0.004;
        for (let k = 0; k < 4; k++) leafBlade(local, { base: at, dir: [Math.cos(k * 1.57 + a), 0.15, Math.sin(k * 1.57 + a)], side: [-Math.sin(k * 1.57 + a), 0, Math.cos(k * 1.57 + a)], len: 0.014, wid: 0.011, color: linear(pal.blossom[k % 2]), rows: 2, cup: 0.4, curl: 0.2, window: LEAF_BAND });
      }
    }
    if (lod < 2 && season === 'autumn') {
      for (let i = 0; i < 2; i++) {
        const a = i * 2.6 + 1, at = [Math.cos(a) * rx * 0.45, 0, Math.sin(a) * rz * 0.45];
        at[1] = topAt(at[0], at[2]) + 0.006;
        leafBlade(local, { base: at, dir: [Math.cos(a + 1), -0.1, Math.sin(a + 1)], side: [-Math.sin(a + 1), 0, Math.cos(a + 1)], len: 0.05, wid: 0.03, color: linear(pal.leaf[i]), rows: 2, cup: 0.2, droop: 0, window: LEAF_BAND });
      }
    }
    md.append(local);
  };
  return buildItem({ name, lod, parts, extras, reach: 0.05 });
}





const BUSH_LOOKS = [
  { berry: '#9db7e6', size: [0.34, 0.26, 0.3], height: 0.29, lean: 0.03, lobes: 7, cluster: 3, berryR: 0.022 },
  { berry: '#ee9fb4', size: [0.42, 0.2, 0.33], height: 0.235, lean: -0.05, lobes: 8, cluster: 2, berryR: 0.025 },
  { berry: '#c9a8e0', size: [0.28, 0.32, 0.27], height: 0.33, lean: 0.06, lobes: 6, cluster: 4, berryR: 0.017 },
];

function berryBush(ctx) {
  const { seed, season, stage, lod, key, name, pal, rng } = ctx;
  const look = BUSH_LOOKS[formIndex(seed, rng)];
  const ns = rng.rangeI(1, 1e6);
  const C = [look.lean, look.height, 0];
  const [sx, sy, sz] = look.size;
  const lobes = [S.ellipsoid(C, [sx * 0.72, sy * 0.78, sz * 0.72])];
  for (let i = 0; i < look.lobes; i++) {
    const a = (i / look.lobes) * TAU + rng.rangeF(-0.3, 0.3), e = rng.rangeF(-0.25, 0.85);
    const big = i === 0 ? 1.3 : 1; 
    lobes.push(S.sphere([C[0] + Math.cos(a) * sx * 0.58 * Math.cos(e), C[1] + sy * 0.55 * Math.sin(e), C[2] + Math.sin(a) * sz * 0.58 * Math.cos(e)], rng.rangeF(0.12, 0.16) * big * (sx / 0.34) ** 0.5));
  }
  let canopy = S.union(0.08, lobes);
  
  
  canopy = S.displace(canopy, (x, y, z) => 0.022 * (fbm3(x * 7, y * 7, z * 7, { octaves: 2, seed: ns }) - 0.5) * 2 - 0.02 * valueNoise3(x * 20, y * 20, z * 20, ns + 1), 0.04);
  canopy = S.intersect(0.05, canopy, S.plane([0, -1, 0], -0.05));
  const l0 = linear(pal.leaf[0]), l1 = linear(pal.leaf[1]), l2 = linear(pal.leaf[2]);
  const blossom = linear(pal.blossom[0]);
  const canopyNode = S.paint(canopy, {
    material: 'leaf',
    color: (x, y, z) => {
      let c = mix(mix(l2, l1, smooth(0.12, C[1], y)), l0, 0.55 * smooth(C[1], C[1] + sy * 0.6, y));
      c = scl(c, 0.92 + 0.12 * valueNoise3(x * 18, y * 18, z * 18, ns + 2));
      if (season === 'spring') c = mix(c, blossom, 0.85 * smooth(0.78, 0.86, valueNoise3(x * 45, y * 45, z * 45, ns + 3)));
      return c;
    },
  });
  
  
  const bandUV = (p) => {
    const t = (p[1] / 0.3) % 2;
    return [(Math.atan2(p[2] - C[2], p[0] - C[0]) / TAU + 0.5) * 3, 0.02 + 0.46 * (t <= 1 ? t : 2 - t)];
  };
  const box = { min: [C[0] - sx - 0.12, -0.01, -sz - 0.12], max: [C[0] + sx + 0.12, C[1] + sy + 0.14, sz + 0.12] };
  const parts = [{ key: `${key}|canopy${season === 'spring' ? '-sp' : ''}`, node: canopyNode, ...box, cell: 0.011, share: stage === 'ready' ? 0.52 : 0.75, material: 'leaf', uv: { leaf: bandUV }, maxCoarsen: 3 }];
  
  const bark = linear(pal.bark ? pal.bark[0] : '#b3845a');
  const stemPts = [[-0.05, 0.02], [0.045, -0.03], [0.01, 0.05]].map(([x, z]) => [[x + C[0] * 0.3, -0.01, z], [x * 0.5 + C[0] * 0.7, 0.12, z * 0.5]]);
  if (lod < 2) {
    parts.push({ key: `${key}|stems`, node: S.paint(S.union(0.012, stemPts.map(([a, b]) => S.roundCone(a, b, 0.02, 0.013))), { material: 'bark', color: bark }), min: [-0.1 + C[0] * 0.3, -0.02, -0.08], max: [0.1 + C[0], 0.16, 0.09], cell: 0.0065, share: 0.06, material: 'bark', uvScale: 0.1, maxCoarsen: 3 });
  }
  if (stage === 'ready') {
    const berryC = linear(look.berry), shine = mix(linear(look.berry), [1, 1, 1], 0.4);
    const spheres = [];
    const nClusters = [14, 10, 6][lod];
    for (let i = 0; i < nClusters; i++) {
      const a = (i / nClusters) * TAU * 1.618 + rng.rangeF(-0.2, 0.2), e = rng.rangeF(0.05, 0.9);
      
      const dir = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.abs(Math.sin(a)) * Math.cos(e) * 0.9 - 0.25 * Math.cos(e)];
      const p = S.projectToSurface(canopy, [C[0] + dir[0] * sx * 1.6, C[1] + dir[1] * sy * 1.6, C[2] + dir[2] * sz * 1.6], 10);
      for (let k = 0; k < look.cluster; k++) {
        const r = look.berryR * rng.rangeF(0.85, 1.12);
        spheres.push(S.sphere([p[0] + rng.rangeF(-1, 1) * r * 1.1, p[1] + rng.rangeF(-0.6, 0.8) * r, p[2] + rng.rangeF(-1, 1) * r * 1.1], r));
      }
    }
    parts.push({ key: `${key}|berries-${lod === 2 ? 'far' : 'near'}`, node: S.paint(S.union(0.003, spheres), { material: 'fruit', color: (x, y, z) => mix(berryC, shine, 0.3 * smooth(0.6, 0.9, valueNoise3(x * 90, y * 90, z * 90, ns + 4))) }), min: box.min, max: box.max, cell: look.berryR * 0.3, share: 0.36, material: 'fruit', uvScale: 0.03, maxCoarsen: 3 });
  }
  if (season === 'winter') {
    parts.push({ key: `${key}|snow`, node: snowOn(canopy, C[1] + sy * 0.25, ns, linear(pal.snow[0])), min: box.min, max: box.max, cell: 0.01, share: 0.16, material: 'snow', uvScale: 0.1, maxCoarsen: 3 });
  }
  const extras = lod === 2 ? null : (md) => {
    const local = new MeshData('cards');
    
    const n = lod === 0 ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rng.rangeF(-0.15, 0.15), e = rng.rangeF(-0.2, 0.5);
      const dir = norm([Math.cos(a) * Math.cos(e), Math.sin(e) + 0.2, Math.sin(a) * Math.cos(e)]);
      const p = S.projectToSurface(canopy, [C[0] + dir[0] * sx * 1.7, C[1] + dir[1] * sy * 1.7, dir[2] * sz * 1.7], 10);
      const base = [p[0] - dir[0] * 0.02, p[1] - dir[1] * 0.02, p[2] - dir[2] * 0.02];
      leafBlade(local, { base, dir, side: [-dir[2], 0, dir[0]], len: 0.085, wid: 0.05, color: scl(mix(linear(pal.leaf[0]), linear(pal.leaf[1]), 0.35), 1.02 + 0.06 * (i % 2)), rows: 2, cup: 0.3, curl: 0.2, window: LEAF_BAND });
    }
    md.append(local);
  };
  return buildItem({ name, lod, parts, extras, reach: 0.12 });
}



const DIG_LOOKS = [
  { sprouts: 'carrot', soil: '#b88f6e' },
  { sprouts: 'potato', soil: '#ad8a6c' },
  { sprouts: 'seedling', soil: '#bf9676' },
];

function digSpot(ctx) {
  const { seed, season, stage, lod, key, name, pal, rng } = ctx;
  const look = DIG_LOOKS[formIndex(seed, rng)];
  const ns = rng.rangeI(1, 1e6);
  const soil = linear(look.soil), dark = scl(linear(look.soil), 0.68), crumb = mix(linear(look.soil), [1, 0.95, 0.88], 0.2);
  const ready = stage === 'ready';
  
  
  const [rx, ry, rz] = ready ? [0.2, 0.066, 0.175] : [0.225, 0.042, 0.2];
  let mound = S.ellipsoid([0, 0, 0], [rx, ry, rz]);
  const clods = [];
  const nClods = ready ? 3 : 5;
  for (let i = 0; i < nClods; i++) {
    const a = (i / nClods) * TAU + rng.rangeF(-0.4, 0.4), rr = ready ? rng.rangeF(0.35, 0.75) : rng.rangeF(0.95, 1.2);
    const r = ready ? rng.rangeF(0.024, 0.035) : rng.rangeF(0.024, 0.04);
    clods.push(S.ellipsoid([Math.cos(a) * rx * rr, ready ? ry * 0.7 : r * 0.35, Math.sin(a) * rz * rr], [r, r * 0.7, r * 0.9]));
  }
  mound = S.union(0.015, mound, ...clods);
  const holeC = [0.01, ry * 0.9, -0.005];
  if (!ready) mound = S.subtract(0.026, mound, S.ellipsoid(holeC, [0.092, 0.054, 0.078]));
  mound = S.displace(mound, (x, y, z) => 0.006 * (fbm3(x * 20, y * 20, z * 20, { octaves: 2, seed: ns }) - 0.5) * 2, 0.006);
  mound = ground(mound);
  
  
  const snowParts = season === 'winter' && lod < 2;
  const farSnow = season === 'winter' && lod === 2 ? linear(pal.snow[0]) : null;
  const moundNode = S.paint(mound, {
    material: 'soil',
    color: (x, y, z) => {
      const inHole = ready ? 0 : smooth(0.082, 0.04, Math.hypot(x - holeC[0], z - holeC[2])) * smooth(ry * 0.9, ry * 0.2, y);
      const c = mix(mix(soil, crumb, 0.35 * smooth(0.55, 0.8, valueNoise3(x * 50, y * 50, z * 50, ns + 1))), dark, 0.25 * smooth(0.02, 0, y) + 0.6 * inHole);
      return farSnow ? mix(c, farSnow, 0.85 * smooth(ry * 0.3, ry * 0.6, y) * (1 - inHole)) : c;
    },
  });
  const parts = [{ key: `${key}|${stage}${farSnow ? '-w' : ''}`, node: moundNode, min: [-rx - 0.08, -0.01, -rz - 0.08], max: [rx + 0.08, ry + 0.06, rz + 0.08], cell: 0.005, share: snowParts ? 0.8 : 1, material: 'soil', uvScale: 0.1, maxCoarsen: 3 }];
  if (snowParts) {
    const snow = ready ? snowOn(mound, ry * 0.45, ns, linear(pal.snow[0]))
      : S.intersect(0.004, snowOn(mound, ry * 0.3, ns, linear(pal.snow[0])), S.field((x, y, z) => 0.112 - Math.hypot(x - holeC[0], z - holeC[2])));
    parts.push({ key: `${key}|snow-${stage}`, node: S.paint(snow, { material: 'snow', color: linear(pal.snow[0]) }), min: [-rx - 0.08, 0, -rz - 0.08], max: [rx + 0.08, ry + 0.06, rz + 0.08], cell: 0.0045, share: 0.2, material: 'snow', uvScale: 0.1, maxCoarsen: 4 });
  }
  const winterDim = season === 'winter' ? 0.75 : 1;
  const sprout = mix(linear('#8fcf6a'), [1, 1, 1], season === 'winter' ? 0.35 : 0);
  const extras = (md) => {
    const local = new MeshData('sprouts');
    const rows = [3, 2, 2][lod];
    const top = [0.004, ry * 0.92, -0.004];
    if (ready) {
      
      if (look.sprouts === 'carrot') {
        const n = [5, 4, 2][lod];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + 0.5;
          const dir = norm([Math.cos(a) * 0.45, 1, Math.sin(a) * 0.45]);
          leafBlade(local, { base: top, dir, side: [-Math.sin(a), 0, Math.cos(a)], len: rng.rangeF(0.12, 0.16), wid: 0.03, color: scl(sprout, 0.95 + 0.05 * (i % 2)), rows, shape: 'lance', curl: 0.3, droop: 0.3, window: LEAF_BAND });
        }
      } else if (look.sprouts === 'potato') {
        const n = [6, 4, 2][lod];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          const dir = norm([Math.cos(a), 0.7, Math.sin(a)]);
          leafBlade(local, { base: top, dir, side: [-Math.sin(a), 0, Math.cos(a)], len: rng.rangeF(0.08, 0.1), wid: 0.056, color: scl(sprout, 0.9 + 0.08 * (i % 2)), rows, cup: 0.35, curl: 0.15, droop: 0.2, window: LEAF_BAND });
        }
      } else {
        for (const [x, z, ph] of [[-0.054, 0.014, 0.3], [0.06, -0.027, 1.9]].slice(0, lod === 2 ? 1 : 2)) {
          const at = [x, ry * 0.75, z];
          for (const s of [1, -1]) leafBlade(local, { base: at, dir: norm([Math.cos(ph) * s, 0.9, Math.sin(ph) * s]), side: [-Math.sin(ph), 0, Math.cos(ph)], len: 0.06 * (s > 0 ? 1 : 0.85), wid: 0.04, color: sprout, rows, cup: 0.4, curl: 0.25, window: LEAF_BAND });
        }
      }
    }
    if (lod < 2 && season === 'autumn') leafBlade(local, { base: [-rx * 0.5, ry * 0.5, rz * 0.3], dir: [0.8, -0.15, 0.3], side: [-0.3, 0, 0.8], len: 0.05, wid: 0.03, color: linear(pal.leaf[1]), rows: 2, cup: 0.2, droop: 0, window: LEAF_BAND });
    void winterDim;
    md.append(local);
  };
  return buildItem({ name, lod, parts, extras, reach: 0.04 });
}
