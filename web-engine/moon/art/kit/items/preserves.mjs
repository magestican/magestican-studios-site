



































import * as S from '../../../mesh/sdf.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { valueNoise3 } from '../../../noise.mjs';
import { buildItem, tube, bezier, cylinderUV, mix, scl, smooth, TAU } from './core.mjs';
import { fruitMarkLocal, fruitMarkOn } from './marks.mjs';


const GLASS = linear('#e6f6f3');
const TWINE = linear('#b98d57');
const PAPER = linear('#fff3dc');
const LIQUID = { apple: ['#e38a22', '#f6b83e'], peach: ['#ee7336', '#ffac60'], cherry: ['#7e0f2c', '#c02946'], orchard: ['#e5572f', '#f7bf48'] };
const JAM = { apple: ['#c26d1a', '#e99a33'], peach: ['#d9612a', '#f5903f'], cherry: ['#5f0c23', '#951a37'] };
const CLOTH = { apple: '#d9534a', peach: '#f5a06a', cherry: '#e56f8c' };
const UV = { bottle: cylinderUV([0, 0, 0], 0.2) };

function formFor(list, seed, rng) {
  return seed >= 1 && seed <= 3 ? list[seed - 1] : list[rng.rangeI(0, list.length - 1)];
}



function glassParts(key, glass, fill, [lo, hi], box, cell, [liquidShare, emptyShare]) {
  const a = linear(lo), b = linear(hi);
  const liquid = S.paint(S.intersect(0, glass, S.plane([0, 1, 0], fill)), {
    material: 'bottle', color: (x, y) => mix(mix(a, b, smooth(0, fill, y)), GLASS, 0.22 * smooth(0.005, 0.001, y)),
  });
  
  
  const empty = S.paint(S.intersect(0, glass, S.plane([0, -1, 0], -fill)), { material: 'bottle', color: mix(GLASS, b, 0.22) });
  return [
    { key: `${key}|liquid`, node: liquid, min: box.min, max: [box.max[0], fill + 0.002, box.max[2]], cell, share: liquidShare, material: 'bottle', uvScale: 0.08, uv: UV },
    { key: `${key}|empty`, node: empty, min: [box.min[0], fill - 0.002, box.min[2]], max: box.max, cell, share: emptyShare, material: 'bottle', uvScale: 0.08, uv: UV },
  ];
}






function wrapLabel(surface, { yc, hh, ha, yaw = 0, slant = 0, lift = 0.0014 }) {
  const band = S.field((x, y, z) => {
    let a = Math.atan2(x, z) - yaw;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    const r = Math.hypot(x, z);
    return Math.max(Math.abs(y - yc - slant * a * r) - hh, (Math.abs(a) - ha) * r);
  });
  return S.paint(S.intersect(0.0005, S.shell(S.offset(surface, lift * 0.5), lift * 0.5 + 0.0003), band), { material: 'paper', color: PAPER });
}

function labelPart(key, node, { yc, hh, r }) {
  
  
  
  return { key: `${key}|label`, node, min: [-r - 0.01, yc - hh - 0.014, -0.004], max: [r + 0.01, yc + hh + 0.014, r + 0.014], cell: 0.0006, share: 0.2, material: 'paper', uvScale: 0.05, reach: 0.0025, aoMin: 0.85 };
}

function wobble(node, seed, amp = 0.0005) {
  return S.displace(node, (x, y, z) => amp * (valueNoise3(x * 60, y * 25, z * 60, seed) - 0.5) * 2, amp);
}


function hangingTag(variant, from, at, yaw, r = 0.011) {
  const place = { translate: at, rotate: [-0.2, yaw, 0.12] };
  const disc = S.transform(S.transform(S.roundCylinder([0, 0, 0], r, r, 0.0009, 0.0007), { rotate: [Math.PI / 2, 0, 0] }), place);
  const mark = S.transform(S.transform(fruitMarkLocal(variant, r * 1.25, 'paper'), { translate: [0, 0, 0.001] }), place);
  const cord = tube(bezier(from, [(from[0] + at[0]) / 2, Math.max(from[1], at[1]) + 0.004, (from[2] + at[2]) / 2], [at[0], at[1] + r * 0.9, at[2]], 4), 0.0009);
  return S.union(0.0008, S.paint(disc, { material: 'paper', color: PAPER }), mark, S.paint(cord, { material: 'cloth', color: TWINE }));
}



function clothCover({ r, rim, drop, dome, cinch, wall, ph, ws, wave = 0.045 }) {
  const outer = S.union(r * 0.18,
    S.ellipsoid([r * 0.03, 0, 0], [r, dome, r * 0.98]),
    S.roundCylinder([r * 0.02, -drop / 2, r * 0.03], rim, r, drop / 2, 0.0018));
  const waved = S.displace(outer, (x, y, z) => wave * r * Math.cos(9 * Math.atan2(z, x) + ph + 1.2 * valueNoise3(x * 40, 0, z * 40, ws)) * smooth(-drop * 0.3, -drop, y)
    + 0.06 * r * Math.exp(-(((y - cinch) / (drop * 0.16)) ** 2)), 0.07 * r);
  return S.subtract(0.0012, waved, S.roundCylinder([r * 0.02, -drop / 2 - wall, r * 0.03], rim - wall * 1.4, r - wall * 1.9, drop / 2, 0.0012));
}



const BOTTLE_FORMS = ['milk', 'swing', 'flask'];

export function juice(ctx) {
  const { lod, rng, key, name, variant } = ctx;
  const form = formFor(BOTTLE_FORMS, ctx.seed, rng);
  const ws = rng.rangeI(1, 1e6), ph = rng.rangeF(0, TAU);
  let glass, fill, label = null, labelAt = null, detail, detailBox, capFar, glassTop;
  if (form === 'milk') {
    fill = 0.1; glassTop = 0.152;
    const body = S.union(0.014, S.roundCylinder([0, 0.05, 0], 0.031, 0.03, 0.05, 0.011), S.roundCone([0, 0.098, 0], [0, 0.131, 0], 0.027, 0.0115));
    glass = wobble(S.union(0.003, S.union(0.006, body, S.roundCylinder([0, 0.138, 0], 0.0115, 0.011, 0.01, 0.003)), S.torus([0, 0.147, 0], 0.0108, 0.0028)), ws);
    labelAt = { yc: 0.054, hh: 0.02, r: 0.032 };
    label = S.union(0.0006, wrapLabel(body, { ...labelAt, ha: 0.95, yaw: rng.rangeF(-0.12, 0.12) }),
      fruitMarkOn(S.offset(body, 0.0014), [0, 0.054, 0.04], variant, 0.022, 'paper', { sink: -0.03 }).node);
    const cork = S.paint(S.roundCylinder([0, 0.152, 0], 0.0094, 0.0099, 0.006, 0.002), { material: 'wood', color: linear('#c9955e') });
    const clothC = linear(CLOTH[variant === 'orchard' ? 'peach' : variant]), hem = linear('#fff1dc');
    const tilt = [rng.rangeF(0.05, 0.1), 0, rng.rangeF(-0.1, -0.05)];
    const capShell = clothCover({ r: 0.0172, rim: 0.0196, drop: 0.017, dome: 0.0085, cinch: -0.011, wall: 0.0016, ph, ws });
    const cap = S.transform(S.paint(capShell, { material: 'cloth', color: (x, y) => mix(clothC, hem, smooth(-0.013, -0.016, y)) }), { translate: [0, 0.156, 0], rotate: tilt });
    const twine = S.paint(S.union(0.001,
      S.transform(S.torus([0, 0, 0], 0.0166, 0.0015), { translate: [0, 0.145, 0], rotate: [tilt[0], 0, tilt[2]] }),
      tube(bezier([0.0155, 0.1445, 0.005], [0.022, 0.137, 0.009], [0.02, 0.125, 0.013], 4), 0.0013, 0.0011),
      tube(bezier([0.0155, 0.1445, 0.005], [0.023, 0.14, 0.001], [0.027, 0.13, -0.001], 4), 0.0013, 0.0011)), { material: 'cloth', color: TWINE });
    detail = S.union(0.0008, cork, cap, twine);
    capFar = S.union(0.002, cork, cap);
    detailBox = { min: [-0.03, 0.118, -0.03], max: [0.035, 0.172, 0.03] };
  } else if (form === 'swing') {
    fill = 0.112; glassTop = 0.168;
    const body = S.union(0.02, S.roundCylinder([0, 0.058, 0], 0.0242, 0.0236, 0.058, 0.009), S.roundCone([0, 0.108, 0], [0, 0.156, 0], 0.0215, 0.0098));
    glass = wobble(S.union(0.003, body, S.torus([0, 0.162, 0], 0.0098, 0.0026)), ws);
    const yaw = rng.rangeF(-0.2, 0.2);
    labelAt = { yc: 0.062, hh: 0.028, r: 0.026 };
    label = S.union(0.0006, wrapLabel(body, { ...labelAt, ha: 0.72, yaw, slant: 0.09 }),
      fruitMarkOn(S.offset(body, 0.0014), [Math.sin(yaw) * 0.03, 0.064, Math.cos(yaw) * 0.03], variant, 0.02, 'paper', { sink: -0.03 }).node);
    const stopper = S.union(0.002,
      S.paint(S.ellipsoid([0.0008, 0.1715, 0], [0.0102, 0.0068, 0.0102]), { material: 'stone', color: linear('#f7f0e6') }),
      S.paint(S.torus([0, 0.1655, 0], 0.0086, 0.0018), { material: 'cloth', color: linear('#d6473f') }));
    const wire = S.paint(S.union(0.0008,
      S.torus([0, 0.155, 0], 0.0118, 0.0011),
      tube(bezier([0.0118, 0.155, 0], [0.0152, 0.168, 0.0], [0.0066, 0.1765, 0], 5), 0.001),
      tube(bezier([-0.0118, 0.155, 0], [-0.0152, 0.168, 0.0], [-0.0066, 0.1765, 0], 5), 0.001),
      tube([[0.0066, 0.1765, 0], [0, 0.178, 0.0005], [-0.0066, 0.1765, 0]], 0.001),
      tube(bezier([0.0125, 0.157, 0.002], [0.021, 0.147, 0.006], [0.0175, 0.132, 0.008], 4), 0.0012, 0.001)), { material: 'metal', color: linear('#8f8aa0') });
    detail = S.union(0.0006, stopper, wire);
    capFar = stopper;
    detailBox = { min: [-0.026, 0.12, -0.02], max: [0.03, 0.182, 0.022] };
  } else {
    fill = 0.058; glassTop = 0.107;
    let body = S.intersect(0.004, S.ellipsoid([0, 0.041, 0], [0.043, 0.041, 0.037]), S.plane([0, -1, 0], -0.0015));
    body = S.union(0.012, body, S.roundCylinder([0, 0.086, 0], 0.016, 0.0122, 0.016, 0.003));
    const handle = S.intersect(0.002, S.transform(S.torus([0, 0, 0], 0.018, 0.0046), { translate: [0.036, 0.066, 0.002], rotate: [Math.PI / 2, 0.12, 0.25] }), S.plane([-1, 0, 0], -0.032));
    glass = wobble(S.union(0.003, S.union(0.006, body, handle), S.torus([0, 0.1015, 0], 0.0124, 0.003)), ws);
    const cork = S.paint(S.roundCylinder([0.0003, 0.108, 0.0002], 0.0104, 0.0124, 0.008, 0.002), { material: 'wood', color: linear('#c48f58') });
    const neckRing = S.paint(S.torus([0, 0.091, 0], 0.0143, 0.0012), { material: 'cloth', color: TWINE });
    const tag = hangingTag(variant, [-0.009, 0.09, 0.011], [-0.019, 0.07, 0.036], -0.3, 0.012);
    detail = S.union(0.0008, cork, neckRing, tag);
    capFar = cork;
    detailBox = { min: [-0.04, 0.05, -0.025], max: [0.025, 0.12, 0.052] };
  }
  const box = { min: [-0.056, -0.008, -0.05], max: [0.062, glassTop, 0.05] };
  const parts = [
    ...glassParts(key, glass, fill, LIQUID[variant], box, 0.0015, lod === 2 ? [0.45, 0.33] : [0.3, 0.22]),
    lod < 2 && label ? labelPart(key, label, labelAt) : null,
    lod < 2
      ? { key: `${key}|detail`, node: detail, ...detailBox, cell: 0.0007, share: 0.34, material: 'wood', uvScale: 0.03 }
      : { key: `${key}|cap-far`, node: capFar, ...detailBox, cell: 0.0012, share: 0.22, material: 'wood', uvScale: 0.03 },
  ];
  return buildItem({ name, lod, parts, reach: 0.018 });
}



const JAR_FORMS = ['cloth', 'lid', 'hex'];

export function jam(ctx) {
  const { lod, rng, key, name, variant } = ctx;
  const form = formFor(JAR_FORMS, ctx.seed, rng);
  const ws = rng.rangeI(1, 1e6), ph = rng.rangeF(0, TAU);
  
  let glass, fill, label = null, labelAt = null, detail, detailBox, far, bodyMaxY, detailCell = 0.001;
  if (form === 'cloth') {
    fill = 0.062; bodyMaxY = 0.082;
    const body = S.union(0.006, S.roundCylinder([0, 0.034, 0], 0.0345, 0.0338, 0.034, 0.01), S.roundCylinder([0, 0.072, 0], 0.0305, 0.0305, 0.0085, 0.003));
    glass = wobble(body, ws, 0.0004);
    const yaw = rng.rangeF(-0.15, 0.15);
    labelAt = { yc: 0.032, hh: 0.015, r: 0.036 };
    label = S.union(0.0006, wrapLabel(body, { ...labelAt, ha: 0.85, yaw }),
      fruitMarkOn(S.offset(body, 0.0014), [Math.sin(yaw) * 0.04, 0.032, Math.cos(yaw) * 0.04], variant, 0.02, 'paper', { sink: -0.03 }).node);
    const clothC = linear(CLOTH[variant]), hem = linear('#fff1dc');
    const shell = clothCover({ r: 0.037, rim: 0.044, drop: 0.02, dome: 0.011, cinch: -0.0085, wall: 0.0022, ph, ws, wave: 0.035 });
    const cover = S.transform(S.paint(shell, { material: 'cloth', color: (x, y) => mix(clothC, hem, smooth(-0.016, -0.019, y)) }), { translate: [0, 0.083, 0], rotate: [0.04, 0, -0.05] });
    const twine = S.paint(S.union(0.001,
      S.transform(S.torus([0, 0, 0], 0.0355, 0.0018), { translate: [0, 0.0745, 0], rotate: [0.04, 0, -0.05] }),
      S.transform(S.torus([0, 0, 0], 0.0058, 0.0015), { translate: [0.02, 0.0765, 0.0305], rotate: [Math.PI / 2, 0.55, 0.5] }),
      S.transform(S.torus([0, 0, 0], 0.0048, 0.0015), { translate: [0.029, 0.075, 0.0235], rotate: [Math.PI / 2, 0.9, -0.4] }),
      tube(bezier([0.024, 0.074, 0.029], [0.028, 0.066, 0.034], [0.026, 0.056, 0.036], 4), 0.0014, 0.0011),
      tube(bezier([0.024, 0.074, 0.029], [0.019, 0.066, 0.037], [0.015, 0.059, 0.039], 4), 0.0014, 0.0011)), { material: 'cloth', color: TWINE });
    detail = S.union(0.0008, cover, twine);
    far = cover;
    detailBox = { min: [-0.05, 0.05, -0.05], max: [0.05, 0.1, 0.05] };
  } else if (form === 'lid') {
    fill = 0.052; bodyMaxY = 0.066; detailCell = 0.0009;
    const body = S.union(0.004, S.roundCylinder([0, 0.029, 0], 0.0395, 0.0385, 0.029, 0.011), S.roundCylinder([0, 0.0595, 0], 0.034, 0.034, 0.0045, 0.0015));
    glass = wobble(body, ws, 0.0004);
    labelAt = { yc: 0.03, hh: 0.011, r: 0.04 };
    label = wrapLabel(body, { ...labelAt, ha: 0.7, yaw: rng.rangeF(0.1, 0.3), slant: -0.05 });
    const lidC = linear('#e0b154');
    const lid = S.paint(S.displace(S.roundCylinder([0, 0.0695, 0], 0.0368, 0.0362, 0.0068, 0.0026),
      (x, y, z) => -0.0006 * Math.cos(20 * Math.atan2(z, x)) * smooth(0.074, 0.07, y), 0.0006), { material: 'metal', color: lidC });
    const disc = S.paint(S.roundCylinder([0.002, 0.0768, -0.001], 0.024, 0.024, 0.0008, 0.0006), { material: 'paper', color: PAPER });
    const mark = S.place(fruitMarkLocal(variant, 0.026, 'paper'), [0.002, 0.0773, -0.001], [1, 0, 0], [0, 0, -1], [0, 1, 0]);
    detail = S.union(0.0006, lid, disc, mark);
    far = S.union(0.0006, lid, disc);
    detailBox = { min: [-0.042, 0.058, -0.042], max: [0.042, 0.084, 0.042] };
  } else {
    fill = 0.074; bodyMaxY = 0.098;
    const rot = rng.rangeF(0, Math.PI / 3);
    const hex = S.field((x, y, z) => {
      let d = -1e9;
      for (let i = 0; i < 6; i++) { const a = rot + (i * Math.PI) / 3; d = Math.max(d, x * Math.cos(a) + z * Math.sin(a) - 0.027); }
      return Math.max(d, Math.abs(y - 0.041) - 0.037);
    });
    const body = S.union(0.008, S.offset(hex, 0.004), S.roundCylinder([0, 0.089, 0], 0.022, 0.021, 0.008, 0.003));
    glass = wobble(body, ws, 0.0003);
    const cork = S.paint(S.roundCylinder([0, 0.1005, 0], 0.0198, 0.0212, 0.0058, 0.002), { material: 'wood', color: linear('#c9955e') });
    const waxC = linear(variant === 'cherry' ? '#8c1b30' : variant === 'peach' ? '#d85a33' : '#b8322f');
    const da = rng.rangeF(0, TAU);
    const drips = [0.011, 0.006, 0.0085].map((len, i) => {
      const a = da + i * 0.55;
      const x = Math.cos(a) * 0.0218, z = Math.sin(a) * 0.0218;
      return S.roundCone([x, 0.105, z], [x * 1.02, 0.105 - len, z * 1.02], 0.0022, 0.0017 + 0.0004 * (i % 2));
    });
    const wax = S.paint(S.union(0.002, S.ellipsoid([0.0005, 0.1072, 0], [0.0215, 0.0048, 0.0215]), ...drips), { material: 'fruit', color: waxC });
    const neckRing = S.paint(S.torus([0, 0.086, 0], 0.0228, 0.0013), { material: 'cloth', color: TWINE });
    const tag = hangingTag(variant, [0.012, 0.085, 0.019], [0.012, 0.062, 0.038], 0.25, 0.012);
    detail = S.union(0.0008, cork, wax, neckRing, tag);
    far = S.union(0.001, cork, wax);
    detailBox = { min: [-0.03, 0.045, -0.03], max: [0.03, 0.115, 0.053] };
  }
  const box = { min: [-0.045, -0.006, -0.045], max: [0.045, bodyMaxY, 0.045] };
  const parts = [
    ...glassParts(key, glass, fill, JAM[variant], box, 0.0015, lod === 2 ? [0.42, 0.28] : [0.3, 0.2]),
    lod < 2 && label ? labelPart(key, label, labelAt) : null,
    lod < 2
      ? { key: `${key}|detail`, node: detail, ...detailBox, cell: detailCell, share: 0.36, material: 'cloth', uvScale: 0.04 }
      : { key: `${key}|far`, node: far, ...detailBox, cell: 0.0014, share: 0.3, material: 'cloth', uvScale: 0.04 },
  ];
  return buildItem({ name, lod, parts, reach: 0.016 });
}



const SACK_FORMS = ['tied', 'bag', 'open'];
const BLUE = linear('#6f9bd6');


function sugarMark(s, material) {
  const white = linear('#ffffff');
  return S.union(0.02 * s,
    S.paint(S.transform(S.roundBox([0, 0, 0], [0.24 * s, 0.24 * s, 0.14 * s], 0.07 * s), { translate: [-0.14 * s, -0.12 * s, 0], rotate: [0, 0, 0.12] }), { material, color: white }),
    S.paint(S.transform(S.roundBox([0, 0, 0], [0.2 * s, 0.2 * s, 0.13 * s], 0.06 * s), { translate: [0.2 * s, 0.2 * s, 0.01 * s], rotate: [0.1, 0.2, 0.62] }), { material, color: scl(white, 0.94) }));
}

export function sugar(ctx) {
  const { lod, rng, key, name } = ctx;
  const form = formFor(SACK_FORMS, ctx.seed, rng);
  const ws = rng.rangeI(1, 1e6), ph = rng.rangeF(0, TAU);
  const crinkle = (amp, f = 70) => (x, y, z) => amp * (valueNoise3(x * f, y * f, z * f, ws) - 0.5) * 2;
  let body, material, cloth, stripeY, detail = null, detailBox = null, top;
  if (form === 'tied') {
    
    material = 'cloth'; cloth = linear('#f2e7d4'); stripeY = 0.05; top = 0.132;
    body = S.union(0.016, S.ellipsoid([0, 0.043, 0], [0.046, 0.043, 0.041]), S.roundCone([0, 0.06, 0], [0.002, 0.095, 0], 0.036, 0.0125));
    const frill = S.displace(S.roundCylinder([0.003, 0.109, 0.001], 0.0125, 0.027, 0.013, 0.002),
      (x, y, z) => 0.0035 * Math.cos(6 * Math.atan2(z - 0.001, x - 0.003) + ph) * smooth(0.1, 0.122, y) + crinkle(0.001)(x, y, z), 0.0045);
    body = S.subtract(0.003, S.union(0.005, body, frill), S.sphere([0.003, 0.131, 0.001], 0.02));
    body = S.displace(body, crinkle(0.0012, 55), 0.0012);
    detail = S.paint(S.union(0.001, S.transform(S.torus([0, 0, 0], 0.0134, 0.0019), { translate: [0.002, 0.096, 0], rotate: [0.08, 0, 0.1] }),
      tube(bezier([-0.011, 0.095, 0.007], [-0.018, 0.086, 0.012], [-0.016, 0.075, 0.017], 4), 0.0016, 0.0012)), { material: 'cloth', color: TWINE });
    detailBox = { min: [-0.028, 0.066, -0.02], max: [0.022, 0.108, 0.028] };
  } else if (form === 'bag') {
    material = 'paper'; cloth = linear('#d7b487'); stripeY = 0.045; top = 0.115;
    const taper = (node) => S.warp(node, (x, y, z) => [x / (1 - 0.12 * (y / 0.1)), y, z / (1 - 0.05 * (y / 0.1))], 0.006);
    body = taper(S.roundBox([0, 0.05, 0], [0.035, 0.05, 0.024], 0.006));
    const roll = S.transform(S.capsule([-0.03, 0, 0], [0.03, 0, 0], 0.0085), { translate: [0.001, 0.101, 0.004], rotate: [0, 0.05, 0.04] });
    body = S.union(0.006, body, roll);
    body = S.displace(body, (x, y, z) => crinkle(0.0014, 45)(x, y, z) + 0.0012 * Math.sin(y * 260 + x * 40) * smooth(0.02, 0.09, y), 0.0024);
  } else {
    material = 'cloth'; cloth = linear('#efe4cf'); stripeY = 0.03; top = 0.078;
    body = S.ellipsoid([0, 0.036, 0], [0.047, 0.037, 0.043]);
    const rim = S.displace(S.transform(S.torus([0, 0, 0], 0.037, 0.0085), { translate: [0, 0.063, 0], rotate: [0.06, 0, -0.05] }), crinkle(0.0015, 60), 0.0015);
    body = S.subtract(0.004, S.union(0.01, body, rim), S.ellipsoid([0, 0.072, 0], [0.034, 0.02, 0.031]));
    body = S.displace(body, crinkle(0.0011, 55), 0.0011);
    const heap = S.displace(S.ellipsoid([0.002, 0.063, -0.002], [0.034, 0.019, 0.031]), (x, y, z) => 0.001 * (valueNoise3(x * 110, y * 110, z * 110, ws + 1) - 0.5) * 2, 0.001);
    const scoop = S.paint(S.union(0.002,
      tube([[0.006, 0.07, 0.004], [0.03, 0.093, 0.022], [0.043, 0.1, 0.03]], 0.0034, 0.0028),
      S.subtract(0.001, S.ellipsoid([0.0, 0.069, -0.001], [0.013, 0.007, 0.011]), S.ellipsoid([0, 0.075, -0.001], [0.011, 0.006, 0.009]))), { material: 'wood', color: linear('#c08a55') });
    detail = S.union(0.001, S.paint(heap, { material: 'snow', color: linear('#fbfaf4') }), scoop);
    detailBox = { min: [-0.042, 0.04, -0.04], max: [0.052, 0.108, 0.04] };
  }
  const stripe = S.paint(S.intersect(0.001, S.offset(body, 0.0016), S.field((x, y) => Math.abs(y - stripeY) - 0.0045)), { material, color: BLUE });
  const onBody = S.projectToSurface(body, [0.006, stripeY + 0.024, 0.06], 6);
  const f = S.frameFromNormal(S.normalAt(body, ...onBody));
  const patchS = form === 'bag' ? 0.024 : 0.022;
  
  const patch = S.place(S.union(0.0008,
    S.paint(S.roundBox([0, 0, -0.001], [patchS * 0.6, patchS * 0.52, 0.0022], 0.001), { material, color: linear('#fffaf0') }),
    S.transform(sugarMark(patchS * 0.8, material), { translate: [0, 0, 0.0014] })), onBody, f.X, f.Y, f.Z);
  const sack = S.union(0.0012, S.paint(body, { material, color: (x, y) => scl(cloth, 0.9 + 0.1 * smooth(0, 0.05, y)) }), stripe);
  const withDetail = detail && !(lod === 2 && form === 'tied');
  const parts = [
    { key: `${key}|sack`, node: sack, min: [-0.06, -0.01, -0.055], max: [0.06, top, 0.06], cell: 0.0017, share: withDetail ? 0.55 : 0.85, material, uvScale: 0.06 },
    lod < 2 ? { key: `${key}|patch`, node: patch, min: [onBody[0] - 0.02, onBody[1] - 0.02, onBody[2] - 0.012], max: [onBody[0] + 0.02, onBody[1] + 0.02, onBody[2] + 0.012], cell: 0.0007, share: 0.14, material, uvScale: 0.04, reach: 0.003, aoMin: 0.8 } : null,
    withDetail ? { key: `${key}|detail`, node: detail, ...detailBox, cell: form === 'open' ? 0.0012 : 0.0007, share: 0.3, material: 'cloth', uvScale: 0.04 } : null,
  ];
  return buildItem({ name, lod, parts, reach: 0.018 });
}
