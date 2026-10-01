


































import * as S from '../../../mesh/sdf.mjs';
import { MeshData } from '../../../mesh/meshData.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { buildItem, tube, bezier, boxOf, rotationAffine, leafBlade, farTube, sphereUV, mix, scl, smooth, clamp01, TAU } from './core.mjs';

const LEAF_GREEN = ['#6db84e', '#4f9e45', '#86c25a'];

const APPLE_FORMS = [
  { tall: 1.0, width: 1.0, lean: 0.07, leaves: 1, bend: 0.25, skin: '#df3f38', other: '#f7c95a', otherAmt: 0.26 },
  { tall: 1.1, width: 0.93, lean: 0.21, leaves: 0, bend: 0.8, skin: '#cc2f45', other: '#ffd66e', otherAmt: 0.42 },
  { tall: 0.86, width: 1.07, lean: 0.11, leaves: 2, bend: -0.35, skin: '#e2503a', other: '#c4d85a', otherAmt: 0.38 },
];
const GOLDS = [['#f3c24a', '#ffe9a3', '#c9852a'], ['#eeb25a', '#ffe0b0', '#c07a38'], ['#f4d36a', '#fff3c4', '#cf9a34']];

function formFor(list, seed, rng) {
  return seed >= 1 && seed <= 3 ? list[seed - 1] : list[rng.rangeI(0, list.length - 1)];
}


function appleBody(rng, R, form) {
  const H = 1.78 * R * form.tall, W = R * form.width;
  const lobePhase = rng.rangeF(0, TAU);
  const shoulder = rng.rangeF(0, TAU), cs = Math.cos(shoulder), sn = Math.sin(shoulder);
  const cav = [rng.rangeF(-0.08, 0.08) * W, rng.rangeF(-0.08, 0.08) * W];
  
  
  let shape = S.union(W * 0.3, S.ellipsoid([0, 0.52 * H, 0], [W, 0.5 * H, W * 0.96]), S.roundCylinder([0, 0.36 * H, 0], W * 0.62, W * 0.9, 0.2 * H, W * 0.16));
  shape = S.displace(shape, (x, y, z) => {
    const a = Math.atan2(z, x);
    const low = clamp01(1 - y / (0.55 * H));
    const hi = clamp01((y - 0.45 * H) / (0.55 * H));
    return -W * 0.03 * Math.cos(5 * a + lobePhase) * low * low + W * 0.065 * hi * ((x * cs + z * sn) / W);
  }, W * 0.12);
  shape = S.subtract(W * 0.24, shape, S.sphere([cav[0], H + W * 0.1, cav[1]], W * 0.3));
  shape = S.subtract(W * 0.14, shape, S.sphere([0, -W * 0.13, 0], W * 0.24));
  return { shape, H, W, cav };
}

function appleLike(ctx, { gold }) {
  const { seed, lod, rng, key, name } = ctx;
  const form = formFor(APPLE_FORMS, seed, rng);
  const R = rng.rangeF(0.038, 0.042);
  const { shape, H, W, cav } = appleBody(rng, R, form);
  const lean = [rng.rangeF(-1, 1) * form.lean, 0, (rng.chance(0.5) ? 1 : -1) * form.lean];
  const blushA = rng.rangeF(0, TAU), bc = Math.cos(blushA), bs = Math.sin(blushA);
  const palette = gold ? GOLDS[(seed - 1 + 30) % 3] : null;
  const skin = linear(gold ? palette[0] : form.skin), other = linear(gold ? palette[1] : form.other), deep = linear(gold ? palette[2] : '#8e2a2a');
  const color = (x, y, z) => {
    const t = y / H, rad = Math.hypot(x, z) / W;
    const c = mix(skin, other, clamp01(form.otherAmt * smooth(0.5, -0.7, (x * bc + z * bs) / W) + 0.22 * smooth(0.4, 0.05, t)));
    return mix(c, deep, 0.45 * smooth(0.86, 1.0, t) * smooth(0.4, 0.05, rad));
  };
  const body = S.transform(S.paint(shape, { material: gold ? 'gold' : 'fruit', color }), { rotate: lean });
  const R3 = S.rotationMatrix(lean);

  const stemTop = [cav[0] + form.bend * W * 0.28, H + W * 0.36, cav[1] + W * 0.05];
  const stemCurve = [[cav[0], H - W * 0.12, cav[1]], [cav[0] + form.bend * W * 0.02, H + W * 0.2, cav[1]], stemTop];
  const stemPts = bezier(...stemCurve, 4);
  const stemColor = linear(gold ? palette[2] : '#74513a');
  const stemMat = gold ? 'gold' : 'bark';
  const stem = S.transform(S.paint(tube(stemPts, W * 0.078, W * 0.055), { material: stemMat, color: stemColor }), { rotate: lean });
  const stemBox = boxOf(stemPts.map((p) => S.applyRotation(R3, p)), W * 0.2);

  const leafCount = lod === 2 ? Math.min(1, form.leaves) : form.leaves;
  const leafA = rng.rangeF(0, TAU);
  const leafColor = gold ? linear(palette[1]) : linear(LEAF_GREEN[seed % 3]);
  const extras = (md) => {
    const local = new MeshData('extras');
    if (lod === 2) farTube(local, stemMat, [stemPts[0], stemPts[2], stemPts[3]], W * 0.085, W * 0.06, stemColor);
    const along = bezier(...stemCurve, 5);
    for (let i = 0; i < leafCount; i++) {
      const a = leafA + i * 2.3;
      leafBlade(local, {
        base: along[2 + (i % 2)], dir: [Math.cos(a), 0.3 + 0.15 * i, Math.sin(a)], side: [-Math.sin(a), 0, Math.cos(a)],
        len: W * (1.35 - 0.2 * i), wid: W * 0.64, color: scl(leafColor, 1 - 0.08 * i), rows: [4, 3, 2][lod],
        material: gold ? 'gold' : 'leaf', curl: 0.16, droop: 0.12,
      });
    }
    md.append(local, rotationAffine(lean));
  };

  const box = { min: [-1.5 * W, -0.5 * R, -1.5 * W], max: [1.5 * W, H * 1.3, 1.5 * W] };
  const parts = [
    { key: `${key}|body`, node: body, ...box, cell: R / 13.5, share: lod === 2 ? 1 : 0.82, material: gold ? 'gold' : 'fruit', uv: { [gold ? 'gold' : 'fruit']: sphereUV(S.applyRotation(R3, [0, 0.52 * H, 0])) } },
    lod < 2 ? { key: `${key}|stem`, node: stem, ...stemBox, cell: W * 0.036, share: 0.18, material: stemMat, uvScale: 0.03 } : null,
  ];
  return buildItem({ name, lod, parts, extras, reach: R * 0.5 });
}

export function apple(ctx) { return appleLike(ctx, { gold: false }); }
export function goldenApple(ctx) { return appleLike(ctx, { gold: true }); }

const PEACH_FORMS = [
  { r: 0.041, lean: 0.08, leaves: 2, stub: true, blush: 0.75, cream: 0.3 },
  { r: 0.04, lean: 0.62, leaves: 0, stub: true, blush: 0.95, cream: 0.2 },
  { r: 0.036, lean: 0.14, leaves: 1, stub: false, blush: 0.5, cream: 0.55 },
];

export function peach(ctx) {
  const { seed, lod, rng, key, name } = ctx;
  const form = formFor(PEACH_FORMS, seed, rng);
  const R = form.r * rng.rangeF(0.96, 1.04);
  const tip = [rng.rangeF(-0.12, 0.12) * R, 2.02 * R, rng.rangeF(-0.12, 0.12) * R];
  const ga = rng.rangeF(0, TAU), gn = [Math.cos(ga), 0, Math.sin(ga)], gt = [-Math.sin(ga), 0, Math.cos(ga)];
  let shape = S.union(R * 0.55, S.ellipsoid([0, R * 0.98, 0], [R, R * 0.98, R * 0.95]), S.roundCone([0, R * 1.1, 0], tip, R * 0.6, R * 0.05));
  shape = S.displace(shape, (x, y, z) => {
    const across = x * gn[0] + z * gn[2], along = x * gt[0] + z * gt[2];
    return R * 0.075 * Math.exp(-((across / (R * 0.15)) ** 2)) * smooth(-0.2 * R, 0.5 * R, along) * smooth(0.25 * R, 1.3 * R, y);
  }, R * 0.08);
  
  
  
  const blushA = 2.03 + rng.rangeF(-0.6, 0.6), bc = Math.cos(blushA), bs = Math.sin(blushA);
  const base = linear('#ffa66e'), blush = linear('#f0555e'), cream = linear('#ffd894');
  const color = (x, y, z) => {
    const side = (x * bc + z * bs) / R;
    let c = mix(base, cream, form.cream * smooth(0.2, -0.9, side) * smooth(1.6, 0.3, y / R));
    c = mix(c, blush, form.blush * smooth(-0.2, 0.9, side) * (0.55 + 0.45 * smooth(0.4, 1.6, y / R)));
    const across = Math.abs(x * gn[0] + z * gn[2]);
    return scl(c, 1 - 0.14 * Math.exp(-((across / (R * 0.12)) ** 2)) * smooth(0.4 * R, 1.4 * R, y));
  };
  const lean = [rng.rangeF(-0.3, 0.3) * form.lean, 0, form.lean];
  const R3 = S.rotationMatrix(lean);
  const body = S.transform(S.paint(shape, { material: 'fruit', color }), { rotate: lean });
  const top = S.projectToSurface(shape, [tip[0] * 0.2 - R * 0.28 * gn[0], 1.95 * R, tip[2] * 0.2 - R * 0.28 * gn[2]]);
  const stubPts = [[top[0] * 0.9, top[1] - R * 0.08, top[2] * 0.9], [top[0], top[1] + R * 0.1, top[2]], [top[0] - gn[0] * R * 0.08, top[1] + R * 0.2, top[2] - gn[2] * R * 0.08]];
  const stubColor = linear('#6f4e36');
  const stub = S.transform(S.paint(tube(stubPts, R * 0.075, R * 0.06), { material: 'bark', color: stubColor }), { rotate: lean });
  const stubBox = boxOf(stubPts.map((p) => S.applyRotation(R3, p)), R * 0.22);

  const leafCount = lod === 2 ? Math.min(1, form.leaves) : form.leaves;
  const la = ga + Math.PI + rng.rangeF(-0.4, 0.4);
  const extras = (md) => {
    const local = new MeshData('extras');
    if (lod === 2 && form.stub) farTube(local, 'bark', stubPts, R * 0.08, R * 0.06, stubColor);
    for (let i = 0; i < leafCount; i++) {
      const a = la + (i ? 1.9 : 0);
      leafBlade(local, {
        base: [top[0], top[1] + R * 0.06, top[2]], dir: [Math.cos(a), 0.22, Math.sin(a)], side: [-Math.sin(a), 0, Math.cos(a)],
        len: R * (1.7 - 0.35 * i), wid: R * 0.52, color: linear(LEAF_GREEN[(seed + i) % 3]), rows: [4, 3, 2][lod], shape: 'lance', curl: 0.2, droop: 0.16,
      });
    }
    md.append(local, rotationAffine(lean));
  };
  const parts = [
    { key: `${key}|body`, node: body, min: [-1.8 * R, -0.9 * R, -1.8 * R], max: [1.8 * R, 2.5 * R, 1.8 * R], cell: R / 13.5, share: lod === 2 ? 1 : 0.86, material: 'fruit', uv: { fruit: sphereUV(S.applyRotation(R3, [0, R, 0])) } },
    lod < 2 && form.stub ? { key: `${key}|stub`, node: stub, ...stubBox, cell: R * 0.036, share: 0.14, material: 'bark', uvScale: 0.03 } : null,
  ];
  return buildItem({ name, lod, parts, extras, reach: R * 0.5 });
}


const CHERRY_FORMS = [
  { fruits: [[-0.0135, 0.002, 1.0], [0.0125, -0.005, 0.94]], joint: [0.003, 0.064, -0.008], leaves: 1 },
  { fruits: [[0, 0, 1.06]], joint: [0.02, 0.055, 0.006], leaves: 1 },
  { fruits: [[-0.014, 0.008, 0.95], [0.013, 0.01, 1.08], [0.001, -0.016, 0.9]], joint: [-0.002, 0.07, 0.004], leaves: 2 },
];

export function cherry(ctx) {
  const { seed, lod, rng, key, name } = ctx;
  const form = formFor(CHERRY_FORMS, seed, rng);
  const r0 = 0.0125;
  const deep = linear('#b51d38'), light = linear('#e24a5c'), dark = linear('#7c1230');
  const joint = form.joint.map((v) => v * rng.rangeF(0.92, 1.08));
  const fruits = [], stems = [];
  for (const [fx, fz, k] of form.fruits) {
    const r = r0 * k * rng.rangeF(0.95, 1.05);
    const c = [fx, r * 0.95, fz];
    const ga = rng.rangeF(0, TAU), gn = [Math.cos(ga), 0, Math.sin(ga)];
    let f = S.ellipsoid(c, [r * 1.03, r * 0.94, r]);
    f = S.subtract(r * 0.35, f, S.sphere([c[0], c[1] + r * 1.08, c[2]], r * 0.34));
    f = S.displace(f, (x, y, z) => r * 0.06 * Math.exp(-((((x - c[0]) * gn[0] + (z - c[2]) * gn[2]) / (r * 0.18)) ** 2)), r * 0.06);
    fruits.push(S.paint(f, {
      material: 'fruit',
      color: (x, y) => mix(mix(dark, deep, smooth(c[1] - r, c[1] - 0.2 * r, y)), light, 0.45 * smooth(c[1], c[1] + r, y)),
    }));
    const top = [c[0], c[1] + r * 0.78, c[2]];
    const ctrl = [c[0] * 1.5 + (joint[0] - c[0]) * 0.1, (top[1] + joint[1]) * 0.62, c[2] * 1.5 + (joint[2] - c[2]) * 0.1];
    stems.push(bezier(top, ctrl, joint, 6));
  }
  const stemColor = linear('#7e8b3c');
  const stemNode = S.paint(S.union(0.0012, [...stems.map((p) => tube(p, 0.0012, 0.0009)), S.sphere(joint, 0.0019)]), { material: 'bark', color: stemColor });
  const fruitBox = boxOf(form.fruits.map(([fx, fz]) => [fx, 0.012, fz]), 0.024);
  fruitBox.min[1] = -0.006; fruitBox.max[1] = 0.034;
  const stemBox = boxOf(stems.flat(), 0.006);

  const leafCount = lod === 2 ? 1 : form.leaves;
  const la = rng.rangeF(0, TAU);
  const extras = (md) => {
    
    
    if (lod === 2) for (const p of stems) farTube(md, 'bark', [p[0], p[2], p[5]], 0.0016, 0.0012, stemColor);
    for (let i = 0; i < leafCount; i++) {
      const a = la + i * 2.6;
      leafBlade(md, {
        base: joint, dir: [Math.cos(a), 0.5 - 0.2 * i, Math.sin(a)], side: [-Math.sin(a), 0, Math.cos(a)],
        len: 0.046 - 0.008 * i, wid: 0.02, color: linear(LEAF_GREEN[(seed + i + 1) % 3]), rows: [4, 3, 2][lod], curl: 0.1, droop: 0.2,
      });
    }
  };
  
  
  const far = lod === 2 && fruits.length > 1;
  const parts = [
    far
      ? { key: `${key}|fruit-far`, node: S.union(0.005, fruits), ...fruitBox, cell: 0.0019, share: 1, material: 'fruit', uv: { fruit: sphereUV([0, 0.012, 0], 3) } }
      : { key: `${key}|fruit`, node: S.union(0.002, fruits), ...fruitBox, cell: 0.00105, share: lod === 2 ? 1 : 0.7, material: 'fruit', uv: { fruit: sphereUV([0, 0.012, 0], 3) } },
    lod < 2 ? { key: `${key}|stems`, node: stemNode, ...stemBox, cell: 0.00052, share: 0.3, material: 'bark', uvScale: 0.02 } : null,
  ];
  return buildItem({ name, lod, parts, extras, reach: 0.008 });
}
