




















import * as S from '../../../mesh/sdf.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { valueNoise3, fbm3 } from '../../../noise.mjs';
import { buildItem, mix, scl, smooth, TAU, norm, add } from './core.mjs';

const ground = (node) => S.intersect(0.0015, node, S.plane([0, -1, 0], 0));
const formIndex = (seed, rng) => (seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2));










const FORMS = [
  {
    skin: '#5b4642', flesh: '#e7dcc2', vein: '#5d5140', crumbs: 5,
    lumps: [{ at: [0, 0.03, 0], r: [0.034, 0.029, 0.031], rot: [0.18, 0.4, -0.12], warts: 22, nick: [2.1, 0.75, 0.016] }],
  },
  {
    skin: '#6d5340', flesh: '#efe6cd', vein: '#6d5a41', crumbs: 3,
    lumps: [
      { at: [-0.008, 0.028, 0.002], r: [0.031, 0.027, 0.029], rot: [-0.1, 1.1, 0.2], warts: 18, nick: [4.4, 0.6, 0.013] },
      { at: [0.036, 0.016, -0.009], r: [0.019, 0.017, 0.018], rot: [0.3, -0.5, -0.25], warts: 9, nick: null },
    ],
  },
  {
    skin: '#6b5f53', flesh: '#f2ebd6', vein: '#7b6a4e', crumbs: 7,
    lumps: [
      { at: [0, 0.031, 0], r: [0.035, 0.03, 0.032], rot: [0.25, -0.7, 0.16], warts: 26, nick: [0.7, 0.85, 0.02] },
      { at: [0.03, 0.022, 0.018], r: [0.016, 0.015, 0.015], rot: [0, 0.2, 0.6], warts: 6, nick: null },
    ],
  },
];


const onLump = (lump, a, el) => add(lump.at, [
  Math.sin(el) * Math.cos(a) * lump.r[0],
  Math.cos(el) * lump.r[1],
  Math.sin(el) * Math.sin(a) * lump.r[2],
]);

export function truffle(ctx) {
  const { rng, key, name, seed, lod } = ctx;
  const form = FORMS[formIndex(seed, rng)];
  const ns = rng.rangeI(1, 1e6);
  const skin = linear(form.skin), flesh = linear(form.flesh), vein = linear(form.vein);

  const nicks = [];
  const bodies = form.lumps.map((lump, li) => {
    let b = S.ellipsoid([0, 0, 0], lump.r);
    
    
    const warts = [];
    for (let i = 0; i < lump.warts; i++) {
      const a = i * 2.39996 + rng.rangeF(-0.25, 0.25);
      const el = Math.acos(1 - 2 * ((i + 0.5) / lump.warts)) * 0.94 + rng.rangeF(-0.08, 0.08);
      const p = onLump({ at: [0, 0, 0], r: lump.r }, a, el);
      const out = norm(p);
      const h = rng.rangeF(0.0035, 0.0062);
      warts.push(S.roundCone(scl(p, 0.86), add(p, scl(out, h)), rng.rangeF(0.006, 0.0095), rng.rangeF(0.0012, 0.0024)));
    }
    b = S.union(0.0055, b, ...warts);
    b = S.displace(b, (x, y, z) => 0.0022 * (fbm3(x * 55, y * 55, z * 55, { octaves: 3, seed: ns + li }) - 0.5) * 2, 0.0022);
    const placed = S.transform(b, { translate: lump.at, rotate: lump.rot });
    if (lump.nick) {
      const [a, el, r] = lump.nick;
      const p = onLump(lump, a, el);
      nicks.push({ at: p, r });
    }
    return placed;
  });

  let node = S.union(0.006, bodies);
  
  
  for (const n of nicks) {
    node = S.subtract(0.0035, node, S.paint(S.ellipsoid(n.at, [n.r, n.r * 0.86, n.r]), {
      color: (x, y, z) => mix(flesh, vein, smooth(0.45, 0.72, valueNoise3(x * 190, y * 190, z * 190, ns + 3))),
    }), { cutColor: true });
  }

  node = S.paint(node, {
    material: 'paper',
    color: (x, y, z) => {
      
      
      const grain = valueNoise3(x * 260, y * 260, z * 260, ns + 11);
      const broad = valueNoise3(x * 34, y * 34, z * 34, ns + 5);
      return mix(scl(skin, 0.86 + 0.24 * broad), scl(skin, 1.18), smooth(0.55, 0.85, grain) * 0.5);
    },
  });

  
  
  const crumbC = scl(linear('#4a3a2c'), 1);
  const crumbs = [];
  for (let i = 0; i < form.crumbs; i++) {
    const a = rng.rangeF(0, TAU), rr = rng.rangeF(0.026, 0.044);
    crumbs.push(S.paint(S.ellipsoid([Math.cos(a) * rr, rng.rangeF(0.002, 0.007), Math.sin(a) * rr], [rng.rangeF(0.004, 0.008), rng.rangeF(0.003, 0.005), rng.rangeF(0.004, 0.008)]), { color: crumbC }));
  }
  node = ground(S.union(0.004, node, ...crumbs));

  const parts = [{
    key: `${key}|body`, node, min: [-0.062, -0.01, -0.062], max: [0.07, 0.075, 0.062],
    cell: 0.0018, share: 1, material: 'paper', uvScale: 0.05, maxCoarsen: 3,
  }];
  void lod;
  return buildItem({ name, lod, parts, reach: 0.02 });
}
