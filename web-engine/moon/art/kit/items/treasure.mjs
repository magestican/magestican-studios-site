































import * as S from '../../../mesh/sdf.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { valueNoise3, fbm3 } from '../../../noise.mjs';
import { buildItem, tube, bezier, mix, scl, smooth, TAU, norm } from './core.mjs';

function formIndex(seed, rng) {
  return seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2);
}



const COIN_R = 0.023, COIN_T = 0.0072;


function coinLocal(rng, { turn = 0, nick = true } = {}) {
  const gold = linear('#ffc948'), light = linear('#fff0a8'), deep = linear('#e39d34');
  let disc = S.roundCylinder([0, 0, 0], COIN_R, COIN_R, COIN_T / 2, 0.0022);
  disc = S.union(0.0008, disc,
    S.torus([0, COIN_T / 2 - 0.0005, 0], COIN_R - 0.0026, 0.0012),
    S.torus([0, -COIN_T / 2 + 0.0005, 0], COIN_R - 0.0026, 0.0012));
  if (nick) {
    const a = rng.rangeF(0, TAU);
    disc = S.subtract(0.0012, disc, S.sphere([Math.cos(a) * (COIN_R + 0.0012), 0.001, Math.sin(a) * (COIN_R + 0.0012)], 0.0026));
  }
  const c = Math.cos(turn), s = Math.sin(turn);
  const rotXZ = (x, z) => [c * x - s * z, s * x + c * z];
  const moon = S.field((x, y, z) => {
    const [u, v] = rotXZ(x - 0.0015, z);
    const outer = Math.hypot(u, v) - 0.0105;
    const inner = 0.0088 - Math.hypot(u - 0.0052, v + 0.0022);
    return Math.max(Math.max(outer, inner), Math.abs(y - COIN_T / 2) - 0.0011);
  });
  const star = S.field((x, y, z) => {
    const [u, v] = rotXZ(x, z);
    return Math.hypot(u - 0.0092, v + 0.0088, (y - COIN_T / 2) * 1.6) - 0.0021;
  });
  const emblem = S.union(0.0008, S.offset(moon, 0.0003), star);
  return S.paint(S.union(0.0007, disc, emblem), {
    material: 'gold',
    color: (x, y, z) => {
      const r = Math.hypot(x, z) / COIN_R;
      const col = mix(gold, deep, 0.3 * smooth(0.82, 1, r));
      return mix(col, light, 0.55 * smooth(COIN_T / 2 + 0.0002, COIN_T / 2 + 0.001, Math.abs(y)) * smooth(0.7, 0.5, r));
    },
  });
}

export function coin(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = formIndex(seed, rng);
  const coins = [];
  if (form === 0) {
    coins.push(S.transform(coinLocal(rng, { turn: rng.rangeF(0, TAU) }), { translate: [0, COIN_T / 2, 0], rotate: [0, rng.rangeF(0, TAU), 0] }));
  } else if (form === 1) {
    [[0, 0], [0.0035, -0.0022], [-0.003, 0.0026]].forEach(([dx, dz], i) => {
      const tip = i === 2 ? [0.07, 0, -0.05] : [0, 0, 0];
      coins.push(S.transform(coinLocal(rng, { turn: rng.rangeF(0, TAU), nick: i !== 1 }), { translate: [dx, COIN_T / 2 + i * (COIN_T - 0.0004) + (i === 2 ? 0.0012 : 0), dz], rotate: [tip[0], rng.rangeF(0, TAU), tip[2]] }));
    });
  } else {
    coins.push(S.transform(coinLocal(rng, { turn: rng.rangeF(0, TAU) }), { translate: [-0.008, COIN_T / 2, 0.002], rotate: [0, rng.rangeF(0, TAU), 0] }));
    coins.push(S.transform(coinLocal(rng, { turn: rng.rangeF(0, TAU) }), { translate: [0.019, 0.0125, -0.003], rotate: [0.05, 0.4, 0.42] }));
  }
  const node = coins.length > 1 ? S.union(0.0006, coins) : coins[0];
  const tall = form === 1 ? 0.028 : form === 2 ? 0.03 : 0.012;
  const parts = [{ key: `${key}|coins`, node, min: [-0.036, -0.004, -0.032], max: [0.048, tall, 0.032], cell: 0.00075, share: 1, material: 'gold', uvScale: 0.03 }];
  return buildItem({ name, lod, parts, reach: 0.006 });
}



const BOX_FORMS = [
  { half: [0.082, 0.058, 0.08], lid: 0.018, paper: '#f5a3b7', ribbon: '#fff1d8', bands: [[1, 0], [0, 1]], bow: [0.004, 0.006], tag: false },
  
  
  { half: [0.064, 0.082, 0.062], lid: 0.016, paper: '#9edac1', ribbon: '#f0654f', bands: [[1, 0]], bow: [0.016, 0.01], tag: true },
  { half: [0.1, 0.038, 0.078], lid: 0.014, paper: '#bca9ea', ribbon: '#f4c64a', bands: [[Math.cos(0.55), Math.sin(0.55)]], bow: [-0.03, 0.012], tag: false },
];

export function giftBox(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const f = BOX_FORMS[formIndex(seed, rng)];
  const [hx, hy, hz] = f.half;
  const lidTurn = rng.rangeF(0.03, 0.06) * (rng.chance(0.5) ? 1 : -1);
  const baseH = 2 * hy - f.lid * 0.8;
  const base = S.roundBox([0, baseH / 2, 0], [hx, baseH / 2, hz], 0.006);
  const lid = S.transform(S.roundBox([0, 0, 0], [hx + 0.004, f.lid / 2, hz + 0.004], 0.005), { translate: [0, 2 * hy - f.lid / 2, 0], rotate: [0, lidTurn, 0] });
  
  
  
  const box = S.union(0.002, base, lid);
  const bands = f.bands.map(([nx, nz]) => S.intersect(0.0015, S.offset(box, 0.0034), S.field((x, y, z) => Math.abs(x * nx + z * nz) - 0.0115)));
  const paper = linear(f.paper), ribbon = linear(f.ribbon);
  const boxNode = S.union(0.0015,
    S.paint(box, { material: 'paper', color: (x, y) => scl(paper, y < baseH - 0.002 ? 0.94 : 1.02) }),
    ...bands.map((b) => S.paint(b, { material: 'cloth', color: ribbon })));

  
  const top = 2 * hy + 0.0025;
  const [bx, bz] = f.bow;
  const yaw = rng.rangeF(0, TAU);
  const loopR = [0.021 * rng.rangeF(0.95, 1.05), 0.017 * rng.rangeF(0.95, 1.05)];
  const loops = [1, -1].map((side, i) => S.transform(S.torus([0, 0, 0], loopR[i], 0.0048), {
    translate: [bx + Math.cos(yaw) * side * loopR[i] * 0.95, top + loopR[i] * 0.72, bz + Math.sin(yaw) * side * loopR[i] * 0.95],
    rotate: [Math.PI / 2 - 0.55, -yaw, side * (0.35 + 0.1 * i)],
    scale: [1, 1, 0.55],
  }));
  const knot = S.ellipsoid([bx, top + 0.006, bz], [0.0085, 0.0075, 0.0085]);
  const tails = [[0.035, 0.6], [0.026, -0.75]].map(([len, da]) => {
    const a = yaw + Math.PI / 2 + da;
    return tube(bezier([bx, top + 0.003, bz], [bx + Math.cos(a) * len * 0.5, top + 0.004, bz + Math.sin(a) * len * 0.5], [bx + Math.cos(a) * len, top + 0.0005, bz + Math.sin(a) * len], 4), 0.0042, 0.0034);
  });
  let bow = S.paint(S.union(0.003, ...loops, knot, ...tails), { material: 'cloth', color: (x, y) => scl(ribbon, 0.9 + 0.1 * smooth(top, top + 0.03, y)) });
  if (f.tag) {
    const tagC = [hx * 0.55, 2 * hy - 0.03, hz + 0.012];
    const place = { translate: tagC, rotate: [-0.12, -0.15, 0.3] };
    const tag = S.transform(S.roundBox([0, 0, 0], [0.018, 0.011, 0.0013], 0.0015), place);
    const heart = S.transform(S.union(0.002, S.sphere([-0.003, 0.001, 0.0014], 0.0036), S.sphere([0.003, 0.001, 0.0014], 0.0036), S.sphere([0, -0.004, 0.0012], 0.0022)), place);
    const cord = tube(bezier([bx, top + 0.004, bz], [tagC[0] + 0.004, top - 0.004, tagC[2] - 0.004], [tagC[0] - 0.012, tagC[1] + 0.008, tagC[2]], 5), 0.0011);
    bow = S.union(0.001, bow,
      S.paint(tag, { material: 'paper', color: linear('#fff4df') }),
      S.paint(heart, { material: 'paper', color: linear('#e8505b') }),
      S.paint(cord, { material: 'cloth', color: ribbon }));
  }
  const pad = 0.012;
  const parts = [
    { key: `${key}|box`, node: boxNode, min: [-hx - pad - 0.006, -0.006, -hz - pad - 0.006], max: [hx + pad + 0.006, 2 * hy + 0.008, hz + pad + 0.006], cell: 0.0034, share: 0.62, material: 'paper', uvScale: 0.12 },
    { key: `${key}|bow`, node: bow, min: [bx - 0.05, top - (f.tag ? 0.075 : 0.04), bz - 0.05], max: [bx + 0.05 + (f.tag ? hx : 0), top + 0.05, bz + 0.05 + (f.tag ? hz : 0)], cell: 0.0013, share: 0.38, material: 'cloth', uvScale: 0.05 },
  ];
  return buildItem({ name, lod, parts, reach: 0.03 });
}



const ROCK_FORMS = [
  { radii: [0.05, 0.04, 0.046], craters: [0.019, 0.013, 0.009], crystals: 0 },
  { radii: [0.064, 0.03, 0.036], craters: [0.022, 0.01, 0.0075], crystals: 0 },
  { radii: [0.046, 0.042, 0.044], craters: [0.017, 0.009], crystals: 3 },
];

export function moonRock(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = ROCK_FORMS[formIndex(seed, rng)];
  const [rx, ry, rz] = form.radii.map((v) => v * rng.rangeF(0.94, 1.06));
  const ns = rng.rangeI(1, 1e6);
  const yaw = rng.rangeF(0, TAU);
  let rock = S.transform(S.ellipsoid([0, 0, 0], [rx, ry, rz]), { translate: [0, ry * 0.92, 0], rotate: [rng.rangeF(-0.12, 0.12), yaw, rng.rangeF(-0.12, 0.12)] });
  for (let i = 0; i < 3; i++) {
    const th = rng.rangeF(0.3, 1.1), phi = rng.rangeF(0, TAU);
    const n = [Math.sin(th) * Math.cos(phi), Math.cos(th), Math.sin(th) * Math.sin(phi)];
    const d = rng.rangeF(0.72, 0.85) * Math.min(rx, ry, rz);
    rock = S.intersect(0.012, rock, S.plane(n, d + n[1] * ry * 0.92));
  }
  rock = S.intersect(0.006, rock, S.plane([0, -1, 0], 0));
  rock = S.displace(rock, (x, y, z) => 0.003 * (fbm3(x * 28, y * 28, z * 28, { octaves: 3, seed: ns }) - 0.5) * 2, 0.003);
  
  const craters = form.craters.map((r, i) => {
    const a = 1.57 + (i - 0.3) * 1.9 + rng.rangeF(-0.35, 0.35), up = rng.rangeF(0.6, 1.1);
    const p = S.projectToSurface(rock, [Math.cos(a) * rx * 0.9, ry * (1.0 + up), Math.sin(a) * rz * 0.9], 8);
    return { p, n: S.normalAt(rock, ...p), r };
  });
  let shaped = rock;
  for (const { p, n, r } of craters) {
    const f = S.frameFromNormal(n);
    
    
    const rim = S.place(S.torus([0, 0, 0], r * 0.92, r * 0.24), [p[0] - n[0] * r * 0.05, p[1] - n[1] * r * 0.05, p[2] - n[2] * r * 0.05], f.X, f.Z, f.Y);
    shaped = S.union(r * 0.3, shaped, rim);
    shaped = S.subtract(r * 0.28, shaped, S.sphere([p[0] + n[0] * r * 0.38, p[1] + n[1] * r * 0.38, p[2] + n[2] * r * 0.38], r * 0.9));
  }
  const base = linear('#c7c1d6'), dark = linear('#7d7597'), fleck = linear('#f4f0fb');
  let node = S.paint(shaped, {
    material: 'stone',
    color: (x, y, z) => {
      let c = base;
      for (const { p, r } of craters) {
        const dd = Math.hypot(x - p[0], y - p[1], z - p[2]);
        c = mix(c, dark, 0.75 * smooth(r * 0.85, r * 0.2, dd));
      }
      c = mix(c, fleck, 0.65 * smooth(0.78, 0.9, valueNoise3(x * 170, y * 170, z * 170, ns + 3)));
      return scl(c, 0.9 + 0.1 * smooth(0, ry, y));
    },
  });
  if (form.crystals) {
    const { p, n } = craters[0];
    const gem = linear('#a48af0');
    const crystals = [0.036, 0.026, 0.02].slice(0, form.crystals).map((len, i) => {
      const dir = norm([n[0] + (i - 1) * 0.45 + rng.rangeF(-0.1, 0.1), n[1] + 0.3, n[2] + rng.rangeF(-0.3, 0.3)]);
      const f = S.frameFromNormal(dir);
      const at = [p[0] - dir[0] * 0.006 + f.X[0] * (i - 1) * 0.006, p[1] - dir[1] * 0.006 + (i - 1) * 0.002, p[2] - dir[2] * 0.006 + f.X[2] * (i - 1) * 0.006];
      return S.place(crystalZ(len, 0.0058 - i * 0.0008, rng.rangeF(0, 1)), at, f.X, f.Y, f.Z);
    });
    node = S.union(0.0015, node, S.paint(S.union(0.001, crystals), { material: 'gem', color: (x, y) => mix(gem, linear('#e2d6ff'), smooth(0.05, 0.1, y)) }));
  }
  const ext = Math.max(rx, rz) + 0.03;
  const parts = [{ key: `${key}|rock`, node, min: [-ext, -0.006, -ext], max: [ext, 2 * ry + 0.05, ext], cell: 0.0019, share: 1, material: 'stone', uvScale: 0.07 }];
  return buildItem({ name, lod, parts, reach: 0.02 });
}







function crystalZ(len, w, twist = 0, { tipTop = len * 0.34, tipBottom = 0 } = {}) {
  const lt = Math.hypot(tipTop, w), lb = Math.hypot(tipBottom, w);
  const cs = Array.from({ length: 6 }, (_, i) => [Math.cos(twist + (i * Math.PI) / 3), Math.sin(twist + (i * Math.PI) / 3)]);
  return S.offset(S.field((x, y, z) => {
    let d = tipBottom > 0 ? -1e9 : -z;
    for (const [ca, sa] of cs) {
      const radial = x * ca + y * sa;
      d = Math.max(d, radial - w, ((radial - w) * tipTop + (z - (len - tipTop)) * w) / lt);
      if (tipBottom > 0) d = Math.max(d, ((radial - w) * tipBottom - (z - tipBottom) * w) / lb);
    }
    return d;
  }), 0.0004);
}



function brilliantUnit({ crown = 0.34, table = 0.56, pavilion = 0.9, girdle = 0.035 } = {}) {
  const lc = Math.hypot(crown, 1 - table), lp = Math.hypot(pavilion, 1);
  const g = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4 + Math.PI / 8), Math.sin((i * Math.PI) / 4 + Math.PI / 8)]);
  const c = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
  return S.field((x, y, z) => {
    let d = y - (crown + girdle);
    for (let i = 0; i < 8; i++) {
      const rg = x * g[i][0] + z * g[i][1];
      const rc = x * c[i][0] + z * c[i][1];
      d = Math.max(d, rg - 1,
        ((rc - 1) * crown + (y - girdle) * (1 - table)) / lc,
        ((rg - 1) * pavilion - (y + girdle)) / lp);
    }
    return d;
  });
}

export function gem(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = formIndex(seed, rng);
  let node, box, cell;
  if (form === 0) {
    const pink = linear('#f08fd2'), pale = linear('#ffd9f1');
    const nubN = rng.rangeI(1, 1e6);
    const nub = S.paint(S.displace(S.ellipsoid([0, 0.008, 0], [0.024, 0.011, 0.021]), (x, y, z) => 0.0025 * (valueNoise3(x * 90, y * 90, z * 90, nubN) - 0.5) * 2, 0.0025), { material: 'stone', color: linear('#a79fb8') });
    const specs = [[0.052, 0.0072, [0.12, 1, -0.05]], [0.036, 0.0058, [-0.55, 0.8, 0.2]], [0.028, 0.005, [0.35, 0.7, 0.55]]];
    const crystals = specs.map(([len, w, d], i) => {
      const dir = norm(d.map((v) => v + rng.rangeF(-0.06, 0.06)));
      const f = S.frameFromNormal(dir);
      return S.place(crystalZ(len, w, rng.rangeF(0, 1)), [dir[0] * 0.004 + (i - 1) * 0.004, 0.006, dir[2] * 0.004], f.X, f.Y, f.Z);
    });
    node = S.union(0.0018, nub, S.paint(S.union(0.0015, crystals), { material: 'gem', color: (x, y) => mix(pink, pale, smooth(0.02, 0.055, y)) }));
    box = { min: [-0.04, -0.006, -0.036], max: [0.04, 0.065, 0.04] };
    cell = 0.0011;
  } else if (form === 1) {
    
    
    const teal = linear('#34bdb6'), pale = linear('#c4f7ef');
    const cut = S.transform(S.offset(brilliantUnit({ crown: 0.4, table: 0.52, pavilion: 0.95 }), 0.015), { scale: [0.029, 0.022, 0.023] });
    const lying = S.transform(cut, { translate: [0, 0.017, 0], rotate: [0.62, rng.rangeF(-0.5, 0.5), 0.12] });
    node = S.paint(lying, { material: 'gem', color: (x, y) => mix(teal, pale, 0.55 * smooth(0.015, 0.04, y)) });
    box = { min: [-0.042, -0.012, -0.042], max: [0.042, 0.052, 0.042] };
    cell = 0.0007;
  } else {
    const violet = linear('#8577ee'), pale = linear('#d6d0ff');
    const len = 0.058, w = 0.0105;
    const both = crystalZ(len, w, rng.rangeF(0, 1), { tipTop: 0.017, tipBottom: 0.0095 });
    const lying = S.transform(both, { translate: [-len * 0.4, w * 0.9, 0], rotate: [0.12, Math.PI / 2 + rng.rangeF(-0.4, 0.4), 0.08] });
    node = S.paint(lying, { material: 'gem', color: (x, y) => mix(violet, pale, 0.55 * smooth(0.006, 0.02, y)) });
    box = { min: [-0.06, -0.012, -0.06], max: [0.06, 0.035, 0.06] };
    cell = 0.00095;
  }
  const parts = [{ key: `${key}|gem`, node, ...box, cell, share: 1, material: 'gem', uvScale: 0.04 }];
  return buildItem({ name, lod, parts, reach: 0.008 });
}
