





























import * as S from '../../../mesh/sdf.mjs';
import { MeshData } from '../../../mesh/meshData.mjs';
import { linear, seasonPalette } from '../../../palette/seasons.mjs';
import { valueNoise3 } from '../../../noise.mjs';
import { buildItem, tube, bezier, boxOf, leafBlade, farTube, mix, scl, smooth, TAU, add, sub, norm } from './core.mjs';
import { fruitMarkOn, fruitMarkLocal } from './marks.mjs';

function formFor(list, seed, rng) {
  return seed >= 1 && seed <= 3 ? list[seed - 1] : list[rng.rangeI(0, list.length - 1)];
}



const SEED_COLOR = { apple: '#57331f', peach: '#9b6444', cherry: '#dcb68c' };

function seedShape(variant, c, yaw, rng, scale = 1) {
  const col = linear(SEED_COLOR[variant]);
  let node;
  if (variant === 'apple') {
    node = S.transform(S.roundCone([-0.0022, 0, 0], [0.0036, 0, 0], 0.0026 * scale, 0.0009 * scale), { translate: c, rotate: [0, yaw, rng.rangeF(-0.2, 0.2)], scale: [scale, 0.62, 0.9] });
  } else if (variant === 'peach') {
    const n = rng.rangeI(1, 1e6);
    node = S.displace(S.transform(S.ellipsoid([0, 0, 0], [0.0125 * scale, 0.0075 * scale, 0.009 * scale]), { translate: c, rotate: [0.2, yaw, 0] }),
      (x, y, z) => 0.0008 * scale * (valueNoise3(x * 300, y * 300, z * 300, n) - 0.5) * 2, 0.0008 * scale);
  } else {
    node = S.transform(S.ellipsoid([0, 0, 0], [0.005 * scale, 0.0042 * scale, 0.0046 * scale]), { translate: c, rotate: [0, yaw, 0] });
  }
  return S.paint(node, { material: 'wood', color: col });
}

const POUCH_FORMS = [
  { type: 'cinched', cloth: '#dcb27a', lean: 0.1, spill: 2 },
  
  
  { type: 'floppy', cloth: '#e9d1a2', lean: 0.1, spill: 1 },
  { type: 'open', cloth: '#cfa36c', lean: 0.05, spill: 0 },
];

export function seed(ctx) {
  const { lod, rng, key, name, variant } = ctx;
  const form = formFor(POUCH_FORMS, ctx.seed, rng);
  const cloth = linear(form.cloth);
  const wr = rng.rangeI(1, 1e6);
  const ph = rng.rangeF(0, TAU);
  const shear = [rng.rangeF(-1, 1) * form.lean, (rng.chance(0.5) ? 1 : -1) * form.lean * 0.6];
  const wrinkle = (amp) => (x, y, z) => amp * (valueNoise3(x * 90, y * 60, z * 90, wr) - 0.5) * 2;
  let body, neckY, topY;
  if (form.type === 'cinched') {
    neckY = 0.064; topY = 0.09;
    body = S.union(0.012, S.ellipsoid([0, 0.031, 0], [0.033, 0.031, 0.029]), S.roundCone([0, 0.036, 0], [0, neckY, 0], 0.025, 0.0105));
    const ruffle = S.displace(S.roundCylinder([0, (neckY + topY) / 2, 0], 0.0105, 0.021, (topY - neckY) / 2, 0.002),
      (x, y, z) => 0.0026 * Math.cos(7 * Math.atan2(z, x) + ph + 3 * valueNoise3(x * 80, 0, z * 80, wr)) * smooth(neckY + 0.004, topY, y), 0.0026);
    body = S.subtract(0.003, S.union(0.005, body, ruffle), S.sphere([0.002, topY + 0.008, 0], 0.0155));
  } else if (form.type === 'floppy') {
    
    
    neckY = 0.05; topY = 0.08;
    const side = ph > Math.PI ? 1 : -1;
    body = S.union(0.012, S.ellipsoid([0, 0.027, 0], [0.036, 0.027, 0.032]), S.roundCone([0, 0.03, 0], [0.001, neckY, 0], 0.025, 0.012));
    const neckPts = bezier([0.001, neckY - 0.004, 0], [side * 0.004, neckY + 0.032, 0.004], [side * 0.03, neckY + 0.02, 0.012], 6);
    const end = neckPts[5];
    const tuft = S.displace(S.ellipsoid([end[0] + side * 0.005, end[1] - 0.003, end[2]], [0.0115, 0.012, 0.0105]), wrinkle(0.0018), 0.0018);
    body = S.union(0.006, body, tube(neckPts, 0.0115, 0.009, 0.004), tuft);
  } else {
    neckY = 0.04; topY = 0.046;
    body = S.ellipsoid([0, 0.024, 0], [0.037, 0.025, 0.034]);
    const rim = S.transform(S.torus([0, 0, 0], 0.028, 0.0062), { translate: [0, 0.041, 0], rotate: [0.08, 0, -0.06] });
    body = S.subtract(0.004, S.union(0.008, body, rim), S.ellipsoid([0, 0.05, 0], [0.026, 0.016, 0.024]));
  }
  body = S.displace(body, wrinkle(0.0011), 0.0011);
  const sheared = (node) => S.warp(node, (x, y, z) => [x - shear[0] * y * y * 12, y, z - shear[1] * y * y * 12], 0.01);
  let sack = S.paint(body, { material: 'cloth', color: (x, y) => scl(cloth, 0.9 + 0.1 * smooth(0, 0.05, y)) });
  const patchGuess = form.type === 'open' ? [0.008, 0.021, 0.05] : [0.006, 0.028, 0.05];
  const onSack = S.projectToSurface(body, patchGuess, 6);
  const fS = S.frameFromNormal(S.normalAt(body, ...onSack));
  
  
  
  const patch = S.place(S.paint(S.roundBox([0, 0, -0.0012], [0.012, 0.0105, 0.0026], 0.0012), { material: 'cloth', color: linear('#f6e6c6') }), onSack, fS.X, fS.Y, fS.Z);
  const mark = fruitMarkOn(body, add(patchGuess, [0, 0, 0.004]), variant, 0.018, 'cloth', { sink: -0.06 }).node;
  const patchNode = sheared(S.union(0.0008, patch, mark));
  const patchBox = { min: [onSack[0] - 0.026, onSack[1] - 0.024, onSack[2] - 0.016], max: [onSack[0] + 0.026, onSack[1] + 0.024, onSack[2] + 0.016] };
  sack = sheared(sack);

  const twineC = linear('#b98d57');
  const twine = [];
  if (form.type === 'cinched') {
    twine.push(S.transform(S.torus([0, 0, 0], 0.0118, 0.0019), { translate: [0, neckY + 0.001, 0], rotate: [0.12, 0, -0.09] }));
    for (const [side, r, tilt] of [[-1, 0.0065, 0.5], [1, 0.0052, -0.35]]) {
      twine.push(S.transform(S.torus([0, 0, 0], r, 0.0016), { translate: [side * 0.0075, neckY + 0.002, 0.0135], rotate: [Math.PI / 2, 0, tilt] }));
    }
    twine.push(tube(bezier([-0.002, neckY, 0.0135], [-0.006, neckY - 0.012, 0.02], [-0.004, neckY - 0.026, 0.022], 4), 0.0016, 0.0013));
    twine.push(tube(bezier([0.002, neckY, 0.0135], [0.008, neckY - 0.01, 0.019], [0.011, neckY - 0.019, 0.019], 4), 0.0016, 0.0013));
  } else if (form.type === 'floppy') {
    
    const k = ph > Math.PI ? -1 : 1;
    twine.push(S.transform(S.torus([0, 0, 0], 0.0128, 0.0019), { translate: [0.001, neckY - 0.001, 0], rotate: [-0.1, 0, 0.12] }));
    twine.push(S.sphere([k * 0.0115, neckY - 0.001, 0.007], 0.0031));
    twine.push(tube(bezier([k * 0.0115, neckY - 0.002, 0.008], [k * 0.02, neckY - 0.014, 0.014], [k * 0.017, neckY - 0.031, 0.022], 4), 0.0017, 0.0013));
  }
  const spill = [];
  if (form.spill >= 1) spill.push(seedShape(variant, variant === 'peach' ? [0.037, 0.0075, 0.03] : [0.03, 0.0026, 0.033], rng.rangeF(0, TAU), rng));
  if (form.spill >= 2) spill.push(seedShape(variant, variant === 'peach' ? [-0.028, 0.0075, 0.04] : [0.016, 0.0024, 0.041], rng.rangeF(0, TAU), rng));
  const heap = [];
  if (form.type === 'open') {
    const n = variant === 'peach' ? 3 : variant === 'cherry' ? 9 : 11;
    for (let i = 0; i < n; i++) {
      const a = i * 2.4 + rng.rangeF(-0.3, 0.3), rr = (variant === 'peach' ? 0.01 : 0.017) * Math.sqrt((i + 0.5) / n);
      const y = 0.037 + 0.008 * (1 - rr / 0.02) + (variant === 'peach' ? 0.004 : 0);
      heap.push(seedShape(variant, [Math.cos(a) * rr, y, Math.sin(a) * rr], rng.rangeF(0, TAU), rng, variant === 'peach' ? 0.85 : 1.1));
    }
    heap.push(S.paint(S.ellipsoid([0, 0.034, 0], [0.024, 0.007, 0.022]), { material: 'wood', color: scl(linear(SEED_COLOR[variant]), 0.8) }));
  }
  const sackNode = heap.length ? S.union(0.001, sack, sheared(S.union(0.0012, heap))) : sack;

  const parts = [
    { key: `${key}|sack`, node: sackNode, min: [-0.06, -0.01, -0.06], max: [0.06, 0.11, 0.06], cell: 0.0016, share: lod < 2 ? 0.56 : 0.88, material: 'cloth', uvScale: 0.05 },
    lod < 2 ? { key: `${key}|patch`, node: patchNode, ...patchBox, cell: 0.0006, share: 0.16, material: 'cloth', uvScale: 0.03 } : null,
    lod < 2 && twine.length ? { key: `${key}|twine`, node: sheared(S.paint(S.union(0.0012, twine), { material: 'cloth', color: twineC })), min: [-0.04, neckY - 0.045, -0.035], max: [0.04, neckY + 0.03, 0.045], cell: 0.0007, share: 0.18, material: 'cloth', uvScale: 0.02 } : null,
    lod < 2 && spill.length ? { key: `${key}|spill`, node: S.union(0, spill), min: [-0.05, -0.012, 0.012], max: [0.06, 0.022, 0.06], cell: variant === 'apple' ? 0.0006 : 0.0009, share: 0.12, material: 'wood', uvScale: 0.02 } : null,
  ];
  return buildItem({ name, lod, parts, reach: 0.012 });
}



const SAPLING_FORMS = [
  { ball: [0.08, 0.068, 0.076], straps: 1, bands: [0.14], stem: 'lean', twigs: 2, tag: false },
  { ball: [0.09, 0.058, 0.085], straps: 2, bands: [0.125], stem: 'fork', twigs: 1, tag: false },
  { ball: [0.07, 0.082, 0.068], straps: 0, bands: [0.1, 0.132], stem: 'lean3', twigs: 3, tag: true },
];
const BARK = { apple: '#7b5a41', peach: '#8b4f3b', cherry: '#6c3a37' };
const LEAF_SHAPE = { apple: ['oval', 0.052, 0.028], peach: ['lance', 0.068, 0.02], cherry: ['oval', 0.062, 0.026] };
const LEAF_BY_SEASON = { spring: ['#a9dc6c', 7], summer: ['#5aa84a', 9], autumn: ['#e8902f', 5], winter: [null, 0] };

export function sapling(ctx) {
  const { lod, rng, key, name, variant, season } = ctx;
  const form = formFor(SAPLING_FORMS, ctx.seed, rng);
  const [bx, by, bz] = form.ball.map((v) => v * rng.rangeF(0.95, 1.05));
  const wr = rng.rangeI(1, 1e6), ph = rng.rangeF(0, TAU);
  const burlap = linear('#c89e68'), twineC = linear('#9c7446');
  const neckY = by * 2 * 0.93, rimY = neckY + 0.028;

  
  let ball = S.union(0.03, S.ellipsoid([0, by, 0], [bx, by, bz]), S.roundCone([0, by * 1.5, 0], [0.004, neckY, 0.002], bx * 0.62, 0.024));
  ball = S.intersect(0.006, ball, S.plane([0, -1, 0], 0.001));
  const flare = S.displace(S.roundCylinder([0.005, (neckY - 0.004 + rimY) / 2, 0.0025], 0.022, 0.034, (rimY - neckY + 0.004) / 2, 0.003),
    (x, y, z) => 0.0035 * Math.cos(8 * Math.atan2(z, x) + ph + 2 * valueNoise3(x * 40, 0, z * 40, wr)) * smooth(neckY, rimY, y), 0.0035);
  ball = S.subtract(0.004, S.union(0.008, ball, flare), S.ellipsoid([0.006, rimY + 0.01, 0.003], [0.027, 0.016, 0.027]));
  ball = S.displace(ball, (x, y, z) => 0.0022 * (valueNoise3(x * 38, y * 26, z * 38, wr) - 0.5) * 2 + 0.0012 * Math.sin(Math.atan2(z, x) * 11 + y * 60) * smooth(0.01, 0.03, Math.hypot(x, z)), 0.0035);
  const bands = [];
  const strapOf = (nx, nz) => {
    const l = Math.hypot(nx, 0.25, nz);
    const n = [nx / l, 0.25 / l, nz / l];
    return S.intersect(0.001, S.offset(ball, 0.0028), S.field((x, y, z) => Math.abs((x * n[0] + (y - by) * n[1] + z * n[2])) - 0.0032));
  };
  for (const y0 of form.bands) bands.push(S.intersect(0.001, S.offset(ball, 0.003), S.field((x, y) => Math.abs(y - y0) - 0.0035)));
  const sa = rng.rangeF(0, Math.PI);
  for (let i = 0; i < form.straps; i++) bands.push(strapOf(Math.cos(sa + i * 1.7), Math.sin(sa + i * 1.7)));
  const soil = S.paint(S.ellipsoid([0.006, rimY - 0.008, 0.003], [0.028, 0.008, 0.027]), { material: 'soil', color: scl(linear('#9a6c47'), 0.8) }); 
  let ballNode = S.union(0.0015, S.paint(ball, { material: 'cloth', color: (x, y) => scl(burlap, 0.86 + 0.14 * smooth(0, by, y)) }),
    ...bands.map((b) => S.paint(b, { material: 'cloth', color: twineC })), soil);
  if (season === 'winter') {
    
    
    const cap = S.intersect(0.003, S.offset(ball, 0.0026), S.field((x, y, z) => (by * 1.55 + 0.007 * Math.sin(Math.atan2(z, x) * 3 + ph)) - y));
    ballNode = S.union(0.002, ballNode, S.paint(cap, { material: 'snow', color: linear(seasonPalette('winter').snow[0]) }));
  }

  
  const lean = [rng.rangeF(-0.05, 0.05), 0, rng.rangeF(-0.06, 0.06)];
  const base = [0.006, rimY - 0.01, 0.003];
  const H = 0.4;
  const topP = [base[0] + lean[2] * 0.6 + (form.stem === 'lean' ? 0.03 : form.stem === 'lean3' ? -0.035 : 0), H, base[2] + lean[0] * 0.6];
  const ctrl = form.stem === 'fork' ? [base[0] - 0.035, 0.26, base[2] + 0.02] : [base[0] + (topP[0] - base[0]) * 0.2, 0.26, base[2]];
  const trunk = bezier(base, ctrl, form.stem === 'fork' ? [topP[0] + 0.01, 0.33, topP[2]] : topP, 7);
  const stems = [tube(trunk, 0.0068, form.stem === 'fork' ? 0.0045 : 0.003, 0.003)];
  const tips = [];
  const branches = []; 
  if (form.stem === 'fork') {
    const f = trunk[trunk.length - 1];
    for (const [dx, dz, h] of [[-0.035, 0.01, 0.08], [0.03, -0.012, 0.06]]) {
      const pts = bezier(f, [f[0] + dx * 0.3, f[1] + h * 0.6, f[2] + dz * 0.3], [f[0] + dx, f[1] + h, f[2] + dz], 4);
      stems.push(tube(pts, 0.0042, 0.0026));
      branches.push(pts);
      tips.push({ p: pts[3], d: norm([dx, h, dz]) });
    }
  } else {
    tips.push({ p: trunk[trunk.length - 1], d: norm(sub(trunk[trunk.length - 1], trunk[trunk.length - 2])) });
  }
  for (let i = 0; i < form.twigs; i++) {
    const from = trunk[Math.min(trunk.length - 2, 3 + (i % 3))];
    const a = ph + i * 2.5 + rng.rangeF(-0.4, 0.4);
    const len = rng.rangeF(0.05, 0.085);
    const end = [from[0] + Math.cos(a) * len, from[1] + len * rng.rangeF(0.55, 0.9), from[2] + Math.sin(a) * len];
    const pts = bezier(from, [from[0] + Math.cos(a) * len * 0.5, from[1] + len * 0.2, from[2] + Math.sin(a) * len * 0.5], end, 4);
    stems.push(tube(pts, 0.0036, 0.0022));
    tips.push({ p: end, d: norm(sub(end, from)) });
  }
  const barkC = linear(BARK[variant]);
  const buds = tips.map((t) => S.sphere(t.p, 0.0034));
  const stemNode = S.paint(S.union(0.0025, [...stems, ...buds]), { material: 'bark', color: (x, y) => scl(barkC, 0.85 + 0.15 * smooth(0.15, 0.4, y)) });
  const stemBox = boxOf([...trunk, ...tips.map((t) => t.p), [base[0], base[1] - 0.01, base[2]]], 0.014);

  
  let tagNode = null, tagBox = null;
  if (form.tag) {
    const tagC = [bx * 0.55, neckY - 0.02, bz * 0.72];
    const place = { translate: tagC, rotate: [-0.35, 0.5, 0.18] };
    const tagBody = S.transform(S.roundBox([0, 0, 0], [0.013, 0.0085, 0.0014], 0.0012), place);
    const mark = S.transform(S.transform(fruitMarkLocal(variant, 0.013, 'paper'), { translate: [0, 0, 0.0012] }), place);
    const cord = tube(bezier([0.012, neckY - 0.005, 0.02], [tagC[0] - 0.012, neckY - 0.002, tagC[2]], [tagC[0] - 0.008, tagC[1] + 0.006, tagC[2]], 4), 0.0011, 0.0011);
    tagNode = S.union(0.0008, S.paint(tagBody, { material: 'paper', color: linear('#fff4df') }), mark, S.paint(cord, { material: 'cloth', color: twineC }));
    tagBox = boxOf([tagC, [0.012, neckY - 0.005, 0.02]], 0.022);
  }

  const [leafHex, leafCount0] = LEAF_BY_SEASON[season];
  
  
  
  const leafCount = lod === 2 ? Math.min(3, leafCount0) : leafCount0;
  const [shape, llen, lwid] = LEAF_SHAPE[variant];
  const leafSeeds = Array.from({ length: 9 }, () => [rng.rangeF(0, TAU), rng.rangeF(0.85, 1.15), rng.rangeF(-0.1, 0.1)]);
  const extras = (md) => {
    if (lod === 2) {
      farTube(md, 'bark', trunk.filter((_, i) => i % 2 === 0), 0.0074, form.stem === 'fork' ? 0.005 : 0.0034, barkC);
      for (const pts of branches) farTube(md, 'bark', [pts[0], pts[3]], 0.005, 0.003, barkC);
    }
    if (!leafCount) return;
    const local = new MeshData('leaves');
    const leafC = linear(leafHex);
    for (let i = 0; i < leafCount; i++) {
      const [a, k, hue] = leafSeeds[i];
      let at, dir;
      
      
      const drawnTips = lod < 2 ? tips.length : form.stem === 'fork' ? 2 : 1;
      if (i < tips.length && i < drawnTips) { at = tips[i].p; dir = add(scl(tips[i].d, 0.8), [Math.cos(a) * 0.5, 0.2, Math.sin(a) * 0.5]); }
      else { at = trunk[Math.min(trunk.length - 1, 2 + ((i * 3) % (trunk.length - 2)))]; dir = [Math.cos(a), 0.25 + 0.1 * (i % 3), Math.sin(a)]; }
      const c = season === 'autumn' ? mix(leafC, linear(i % 2 ? '#c9552f' : '#f3bf4f'), 0.5 + hue * 3) : scl(leafC, 1 + hue);
      leafBlade(local, { base: at, dir, side: [-dir[2], 0, dir[0]], len: llen * k, wid: lwid * k, color: c, rows: [4, 3, 2][lod], shape, curl: 0.18, droop: 0.12 });
    }
    md.append(local);
  };

  
  
  
  const { baseKey } = ctx;
  const parts = [
    { key: `${baseKey}|ball${season === 'winter' ? '-snow' : ''}`, node: ballNode, min: [-bx - 0.03, -0.012, -bz - 0.03], max: [bx + 0.03, rimY + 0.02, bz + 0.03], cell: 0.0028, share: lod === 0 ? 0.62 : 0.5, material: 'cloth', uvScale: 0.09 },
    
    
    lod < 2 ? { key: `${baseKey}|stem`, node: stemNode, ...stemBox, cell: 0.0014, share: lod === 0 ? 0.28 : 0.5, material: 'bark', uvScale: 0.06, lodCell: [1, 1.15, 1.15], maxCoarsen: lod === 0 ? 0 : 1 } : null,
    lod === 0 && tagNode ? { key: `${baseKey}|tag`, node: tagNode, ...tagBox, cell: 0.0007, share: 0.1, material: 'paper', uvScale: 0.03 } : null,
  ];
  void key;
  return buildItem({ name, lod, parts, extras, reach: 0.03 });
}
