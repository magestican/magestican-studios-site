





























import * as S from '../../../mesh/sdf.mjs';
import { MeshData } from '../../../mesh/meshData.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { valueNoise3, fbm3 } from '../../../noise.mjs';
import { buildItem, tube, bezier, boxOf, leafBlade, sphereUV, mix, scl, smooth, TAU, norm, add, sub } from './core.mjs';

const formIndex = (seed, rng) => (seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2));
const ground = (node) => S.intersect(0.0015, node, S.plane([0, -1, 0], 0));


const placed = (p, rot, t) => add(S.applyRotation(S.rotationMatrix(rot), p), t);





export function mushroomLocal(m, rng) {
  const { capR, capH, stemH, stemR, bend, tilt = [0, 0, 0], conical = false } = m;
  const top = [bend, stemH, 0];
  const stem = tube(bezier([0, -0.004, 0], [bend * 0.15, stemH * 0.5, 0], top, 5), stemR * 1.3, stemR * 0.88);
  let cap = S.ellipsoid([0, capH * 0.25, 0], [capR, capH, capR]);
  if (conical) cap = S.union(capR * 0.35, cap, S.roundCone([0, capH * 0.2, 0], [0, capH * 1.55, 0], capR * 0.82, capR * 0.18));
  cap = S.intersect(capH * 0.2, cap, S.plane([0, -1, 0], capH * 0.12));
  cap = S.subtract(capH * 0.18, cap, S.ellipsoid([0, -capH * 0.22, 0], [capR * 0.8, capH * 0.45, capR * 0.8]));
  const spots = [];
  for (let i = 0; i < (m.spots || 0); i++) {
    const a = (i / m.spots) * TAU + rng.rangeF(-0.4, 0.4), el = rng.rangeF(0.35, 1.15);
    const dir = [Math.sin(el) * Math.cos(a) * capR, Math.cos(el) * capH * 1.2 + capH * 0.25, Math.sin(el) * Math.sin(a) * capR];
    spots.push({ p: S.projectToSurface(cap, [dir[0] * 1.3, dir[1] * 1.3, dir[2] * 1.3], 8), r: capR * rng.rangeF(0.12, 0.2) });
  }
  
  if (spots.length) {
    cap = S.union(0.0015, cap, ...spots.map((s) => {
      const f = S.frameFromNormal(S.normalAt(cap, ...s.p));
      return S.place(S.ellipsoid([0, 0, 0], [s.r * 0.7, s.r * 0.7, s.r * 0.14]), s.p, f.X, f.Y, f.Z);
    }));
  }
  const placedCap = S.transform(cap, { translate: top, rotate: tilt });
  const R = S.rotationMatrix(tilt);
  const capC = linear(m.color), cream = linear(m.spotColor || '#fbf1dc'), gill = linear('#f4e3c8'), stemC = linear(m.stem || '#f3e6d0');
  const body = S.union(stemR * 0.6, stem, placedCap);
  return S.paint(body, {
    material: 'fruit',
    color: (x, y, z) => {
      
      const q = [x - top[0], y - top[1], z - top[2]];
      const l = [R[0] * q[0] + R[3] * q[1] + R[6] * q[2], R[1] * q[0] + R[4] * q[1] + R[7] * q[2], R[2] * q[0] + R[5] * q[1] + R[8] * q[2]];
      const rr = Math.hypot(l[0], l[2]);
      const onCap = smooth(-capH * 0.3, -capH * 0.05, l[1]) * smooth(stemR * 1.05, stemR * 1.7, rr);
      const under = smooth(capH * 0.2, capH * 0.02, l[1]) * smooth(capR * 0.95, capR * 0.7, rr);
      let c = mix(scl(stemC, 0.9 + 0.1 * smooth(0, stemH, y)), capC, onCap);
      c = mix(c, scl(gill, 0.88 + 0.12 * Math.abs(Math.cos(Math.atan2(l[2], l[0]) * 22))), onCap * under);
      let spot = 0;
      for (const s of spots) spot = Math.max(spot, smooth(s.r, s.r * 0.6, Math.hypot(l[0] - s.p[0], l[1] - s.p[1], l[2] - s.p[2])));
      return mix(c, cream, spot * (1 - under));
    },
  });
}

const MUSHROOM_FORMS = [
  [{ capR: 0.034, capH: 0.022, stemH: 0.036, stemR: 0.011, bend: 0.004, tilt: [0.05, 0, 0.14], color: '#eba4a8', spots: 7, at: [0, 0, 0], yaw: 0.3 }],
  [
    { capR: 0.03, capH: 0.02, stemH: 0.03, stemR: 0.016, bend: -0.003, tilt: [0.1, 0, 0.05], color: '#d9ae7e', stem: '#efe2cc', at: [-0.012, 0, 0.004], yaw: 0 },
    { capR: 0.021, capH: 0.015, stemH: 0.022, stemR: 0.0115, bend: 0.007, tilt: [-0.15, 0, -0.3], color: '#dfb98e', stem: '#f1e5d2', at: [0.03, 0, -0.008], yaw: 2.6 },
  ],
  [
    { capR: 0.02, capH: 0.019, stemH: 0.056, stemR: 0.0068, bend: 0.009, tilt: [0, 0, -0.1], color: '#c9b6e4', conical: true, at: [0, 0, 0], yaw: 0.2 },
    { capR: 0.016, capH: 0.015, stemH: 0.043, stemR: 0.006, bend: -0.011, tilt: [0.1, 0, 0.2], color: '#d3c2ea', conical: true, at: [0.017, 0, 0.01], yaw: 1.9 },
    { capR: 0.013, capH: 0.012, stemH: 0.031, stemR: 0.0054, bend: 0.007, tilt: [-0.1, 0, -0.15], color: '#bfaadf', conical: true, at: [-0.012, 0, 0.015], yaw: 4.1 },
  ],
];

export function mushroom(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = MUSHROOM_FORMS[formIndex(seed, rng)];
  const nodes = form.map((m) => S.transform(mushroomLocal(m, rng), { translate: m.at, rotate: [0, m.yaw + rng.rangeF(-0.1, 0.1), 0] }));
  if (form.length === 3) nodes.push(S.paint(S.ellipsoid([0.002, 0.002, 0.008], [0.024, 0.008, 0.02]), { material: 'fruit', color: linear('#e9dcc8') }));
  const node = ground(S.union(0.003, nodes));
  const slim = form[0].stemR < 0.008;
  const parts = [{ key: `${key}|body`, node, min: [-0.05, -0.008, -0.05], max: [0.058, 0.09, 0.05], cell: slim ? 0.0014 : 0.0019, share: 1, material: 'fruit', uv: { fruit: sphereUV([0, 0.03, 0]) }, maxCoarsen: 4 }];
  return buildItem({ name, lod, parts, reach: 0.02 });
}



function blueberry(c, r, rot) {
  let b = S.ellipsoid([0, 0, 0], [r, r * 0.86, r]);
  b = S.subtract(r * 0.14, b, S.sphere([0, r * 0.92, 0], r * 0.34));
  const crown = Array.from({ length: 5 }, (_, i) => S.sphere([Math.cos(i * 1.2566) * r * 0.3, r * 0.74, Math.sin(i * 1.2566) * r * 0.3], r * 0.12));
  return S.transform(S.union(r * 0.05, b, ...crown), { translate: c, rotate: rot });
}

function raspberry(c, r, rot) {
  const bumps = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1;
    const a = Math.atan2(z, x), b = Math.acos(Math.max(-1, Math.min(1, y / l)));
    return (0.5 - 0.5 * Math.cos(a * 9 + b * 2)) * (0.5 - 0.5 * Math.cos(b * 10));
  };
  let b = S.displace(S.ellipsoid([0, 0, 0], [r, r * 1.22, r]), (x, y, z) => -0.0021 * bumps(x, y, z), 0.0022);
  b = S.subtract(r * 0.15, b, S.ellipsoid([0, r * 1.15, 0], [r * 0.42, r * 0.3, r * 0.42]));
  return S.transform(b, { translate: c, rotate: rot });
}

function strawberry(c, r, rot) {
  const body = S.union(r * 0.6, S.ellipsoid([0, r * 0.5, 0], [r * 1.02, r * 0.78, r * 0.96]), S.roundCone([0, r * 0.3, 0], [0.0005, -r * 1.3, 0.0008], r * 0.78, r * 0.18));
  return S.transform(body, { translate: c, rotate: rot });
}

const BERRY_FORMS = [
  { kind: 'blue', color: '#9db7e6', bloom: '#d0dcf3', dark: '#7383b6', berries: [
    [-0.021, 0.011, 0.004, 0.0115], [0.0, 0.0125, -0.013, 0.0125], [0.004, 0.013, 0.014, 0.0132],
    [0.025, 0.011, 0.0, 0.011], [-0.006, 0.031, 0.002, 0.0122], [0.016, 0.028, 0.011, 0.0104],
  ], twig: [[-0.038, 0.016, -0.012], [-0.005, 0.03, -0.018], [0.036, 0.022, 0.016]], leaves: [[-0.038, 0.016, -0.012, -1, 0.3, -0.4, 0.034], [0.036, 0.022, 0.016, 1, 0.35, 0.5, 0.028]] },
  { kind: 'rasp', color: '#ee9fb4', bloom: '#f8c7d3', dark: '#c77590', berries: [
    [-0.017, 0.0135, 0.0, 0.0128, [0.2, 0, 1.35]], [0.019, 0.0135, 0.007, 0.0122, [-0.3, 0.5, -1.4]], [0.002, 0.014, -0.021, 0.0118, [1.4, 0.2, 0.1]],
  ], leaves: [[0.004, 0.012, 0.022, 0.2, 0.2, 1, 0.038]] },
  { kind: 'straw', color: '#f4a3a3', bloom: '#fbc9c2', dark: '#d97f86', berries: [
    [-0.012, 0.0155, 0.004, 0.0158, [0.15, 0.3, 1.45]], [0.024, 0.0135, -0.012, 0.0138, [-0.2, 2.4, 1.35]],
  ], leaves: [] },
];

export function berries(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = BERRY_FORMS[formIndex(seed, rng)];
  const base = linear(form.color), bloom = linear(form.bloom), dark = linear(form.dark);
  const ns = rng.rangeI(1, 1e6);
  const specs = form.berries.map(([x, y, z, r, rot]) => ({ c: [x, y, z], r: r * rng.rangeF(0.96, 1.04), rot: rot || [rng.rangeF(-0.4, 0.4), rng.rangeF(0, TAU), rng.rangeF(-0.4, 0.4)] }));
  const make = form.kind === 'blue' ? blueberry : form.kind === 'rasp' ? raspberry : strawberry;
  const seedDot = linear('#fbeaa8');
  const node = S.paint(S.union(0.0015, specs.map((s) => make(s.c, s.r, s.rot))), {
    material: 'fruit',
    color: (x, y, z) => {
      let best = specs[0], bd = Infinity;
      for (const s of specs) { const d = Math.hypot(x - s.c[0], y - s.c[1], z - s.c[2]) / s.r; if (d < bd) { bd = d; best = s; } }
      const R = S.rotationMatrix(best.rot);
      const q = [x - best.c[0], y - best.c[1], z - best.c[2]];
      const l = [R[0] * q[0] + R[3] * q[1] + R[6] * q[2], R[1] * q[0] + R[4] * q[1] + R[7] * q[2], R[2] * q[0] + R[5] * q[1] + R[8] * q[2]];
      const up = l[1] / best.r;
      let c = mix(base, bloom, 0.45 * smooth(0.45, 0.75, valueNoise3(x * 160, y * 160, z * 160, ns)));
      if (form.kind === 'blue') c = mix(c, dark, smooth(0.62, 0.9, up) * smooth(0.45, 0.2, Math.hypot(l[0], l[2]) / best.r));
      if (form.kind === 'rasp') c = mix(c, dark, 0.35 * smooth(0.9, 1.2, up));
      if (form.kind === 'straw') {
        const a = (Math.atan2(l[2], l[0]) / TAU) * 11, b = (l[1] / best.r) * 4.2 + 0.5 * Math.floor(a);
        const dot = smooth(0.2, 0.08, Math.hypot(a - Math.floor(a) - 0.5, b - Math.floor(b) - 0.5));
        c = mix(c, seedDot, dot * smooth(1.05, 0.4, up));
        c = mix(c, scl(base, 1.08), 0.3 * smooth(0.6, 1.0, up));
      }
      return c;
    },
  });
  const parts = [{ key: `${key}|berries`, node: ground(node), ...boxOf(specs.map((s) => s.c), 0.034), cell: 0.0016, share: form.twig ? 0.72 : 0.8, material: 'fruit', uvScale: 0.03, maxCoarsen: 2 }];
  if (form.twig && lod < 2) {
    parts.push({ key: `${key}|twig`, node: S.paint(tube(bezier(...form.twig, 6), 0.0026, 0.002), { material: 'bark', color: linear('#9b7a5e') }), ...boxOf(form.twig, 0.012), cell: 0.0012, share: 0.14, material: 'bark', uvScale: 0.03, maxCoarsen: 1 });
  }
  const leafC = linear('#8fcb73');
  const extras = (md) => {
    const local = new MeshData('leaves');
    const rows = [4, 3, 2][lod];
    for (const [x, y, z, dx, dy, dz, len] of form.leaves) {
      if (lod === 2 && form.leaves.length > 1 && x > 0) continue;
      const dir = norm([dx, dy, dz]);
      leafBlade(local, { base: [x, y, z], dir, side: [-dir[2], 0, dir[0]], len, wid: len * 0.5, color: leafC, rows, curl: 0.2, droop: 0.15 });
    }
    if (form.kind === 'straw' && lod < 2) {
      
      for (const s of specs) {
        const crown = placed([0, s.r * 1.2, 0], s.rot, s.c), axis = S.applyRotation(S.rotationMatrix(s.rot), [0, 1, 0]);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU + 0.3;
          const radial = S.applyRotation(S.rotationMatrix(s.rot), [Math.cos(a), 0, Math.sin(a)]);
          const dir = norm(add(radial, scl(axis, 0.15)));
          leafBlade(local, { base: crown, dir, side: norm([-dir[2], 0, dir[0]]), len: s.r * (0.95 + 0.1 * (i % 2)), wid: s.r * 0.42, color: scl(leafC, 0.9), rows: lod === 0 ? 2 : 2, shape: 'lance', curl: 0.3, droop: 0.05 });
        }
      }
    }
    if (form.kind === 'rasp' && lod === 0) {
      const s = specs[0];
      const crown = placed([0, s.r * 1.15, 0], s.rot, s.c);
      for (let i = 0; i < 5; i++) {
        const radial = S.applyRotation(S.rotationMatrix(s.rot), [Math.cos(i * 1.2566), 0.3, Math.sin(i * 1.2566)]);
        leafBlade(local, { base: crown, dir: norm(radial), side: norm([-radial[2], 0, radial[0]]), len: 0.01, wid: 0.004, color: scl(leafC, 0.85), rows: 2, shape: 'lance', curl: 0.35 });
      }
    }
    md.append(local);
  };
  return buildItem({ name, lod, parts, extras, reach: 0.02 });
}



const CARROT_FORMS = [
  [{ L: 0.12, R0: 0.017, bend: 0.006, fork: false, at: [-0.05, 0, 0], yaw: 0.1, tops: 5 }],
  [{ L: 0.1, R0: 0.022, bend: -0.014, fork: true, at: [-0.045, 0, 0.004], yaw: -0.15, tops: 4 }],
  [
    { L: 0.086, R0: 0.0135, bend: 0.005, fork: false, at: [-0.03, 0, -0.022], yaw: 0.38, tops: 3 },
    { L: 0.08, R0: 0.0128, bend: -0.004, fork: false, at: [-0.028, 0, 0.024], yaw: -0.42, tops: 3 },
  ],
];

function carrotLocal(c, ns) {
  const { L, R0, bend } = c;
  const pts = bezier([0, R0, 0], [L * 0.45, R0 * 0.8, bend * 0.3], [L, 0.0032, bend], 8);
  let root = S.union(R0 * 0.35, tube(pts, R0, 0.0024), S.ellipsoid([-R0 * 0.12, R0 * 1.02, 0], [R0 * 0.5, R0 * 0.94, R0 * 0.94]));
  let fork = null;
  if (c.fork) {
    fork = bezier(pts[5], [L * 0.86, 0.006, bend - 0.012], [L * 0.95, 0.003, bend - 0.024], 4);
    root = S.union(0.003, root, tube(fork, R0 * 0.3, 0.0022));
  }
  root = S.displace(root, (x, y, z) => 0.0008 * smooth(0.55, 1, Math.sin(x * 430 + 3 * valueNoise3(x * 50, y * 50, z * 50, ns))), 0.0008);
  return { root, pts, fork };
}

export function carrot(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = CARROT_FORMS[formIndex(seed, rng)];
  const orange = linear('#f5b07a'), light = linear('#fbd0a6'), shoulder = linear('#bcd98d'), groove = linear('#df9463');
  const ns = rng.rangeI(1, 1e6);
  const pieces = form.map((c) => {
    const { root, pts } = carrotLocal(c, ns);
    const painted = S.paint(root, {
      material: 'fruit',
      color: (x, y, z) => {
        const g = smooth(0.7, 1, Math.sin(x * 430 + 3 * valueNoise3(x * 50, y * 50, z * 50, ns)));
        const col = mix(mix(orange, light, 0.3 * smooth(c.R0 * 0.6, c.R0 * 1.6, y)), groove, 0.4 * g);
        return mix(col, shoulder, smooth(c.R0 * 0.25, -c.R0 * 0.45, x) * smooth(c.R0 * 0.9, c.R0 * 1.7, y));
      },
    });
    return { node: S.transform(painted, { translate: c.at, rotate: [0, c.yaw, 0] }), pts: pts.map((p) => placed(p, [0, c.yaw, 0], c.at)), c };
  });
  const node = ground(S.union(0.002, pieces.map((p) => p.node)));
  const all = pieces.flatMap((p) => p.pts);
  const parts = [{ key: `${key}|root`, node, ...boxOf(all, 0.03), cell: form[0].R0 < 0.015 ? 0.0013 : 0.0015, share: 1, material: 'fruit', uvScale: 0.03, maxCoarsen: 2 }];
  const leafC = linear('#8fcf6a');
  const extras = (md) => {
    const local = new MeshData('tops');
    for (const { c } of pieces) {
      const n = lod === 2 ? 2 : c.tops;
      for (let i = 0; i < n; i++) {
        const spread = (i - (n - 1) / 2) * 0.5 + rng.rangeF(-0.12, 0.12);
        const localDir = [-Math.cos(spread), 0.55 + 0.25 * ((i + 1) % 2), Math.sin(spread)];
        const dir = norm(S.applyRotation(S.rotationMatrix([0, c.yaw, 0]), localDir));
        const base = placed([-c.R0 * 0.4, c.R0 * 1.6, 0], [0, c.yaw, 0], c.at);
        const len = (0.055 + 0.02 * ((i * 7) % 3) / 2) * (c.R0 / 0.017) ** 0.5;
        leafBlade(local, { base, dir, side: norm([-dir[2], 0, dir[0]]), len, wid: len * 0.26, color: scl(leafC, 0.92 + 0.05 * (i % 3)), rows: [4, 3, 2][lod], shape: 'lance', curl: 0.25, droop: 0.2 });
      }
    }
    md.append(local);
  };
  return buildItem({ name, lod, parts, extras, reach: 0.02 });
}



const POTATO_FORMS = [
  { color: '#e4c9a0', spuds: [{ r: [0.043, 0.028, 0.032], at: [0, 0.027, 0], rot: [0.05, 0.4, 0.04], eyes: 5 }] },
  { color: '#e3b1a2', spuds: [
    { r: [0.038, 0.026, 0.03], at: [-0.014, 0.025, 0], rot: [0, -0.3, 0.03], eyes: 4 },
    { r: [0.026, 0.02, 0.022], at: [0.035, 0.026, 0.016], rot: [0.3, 0.8, 0.45], eyes: 3 },
  ] },
  { color: '#dcc39a', spuds: [{ r: [0.04, 0.03, 0.031], at: [0, 0.029, 0], rot: [0.02, 1.1, -0.05], eyes: 4, knob: [0.03, 0.012, 0.012, 0.018] }], sprout: true },
];

export function potato(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = POTATO_FORMS[formIndex(seed, rng)];
  const skin = linear(form.color), freckle = scl(linear(form.color), 0.78), eyeC = scl(linear(form.color), 0.62);
  const ns = rng.rangeI(1, 1e6);
  const eyes = [];
  const bodies = form.spuds.map((sp, i) => {
    let b = S.ellipsoid([0, 0, 0], sp.r);
    if (sp.knob) b = S.union(0.012, b, S.ellipsoid([sp.knob[0], sp.knob[1], sp.knob[2]], [sp.knob[3], sp.knob[3] * 0.85, sp.knob[3] * 0.9]));
    b = S.displace(b, (x, y, z) => 0.0038 * (fbm3(x * 22, y * 22, z * 22, { octaves: 2, seed: ns + i }) - 0.5) * 2, 0.0038);
    const placedB = S.transform(b, { translate: sp.at, rotate: sp.rot });
    for (let k = 0; k < sp.eyes; k++) {
      const a = rng.rangeF(0, TAU), el = rng.rangeF(0.3, 1.5);
      const dir = [Math.sin(el) * Math.cos(a) * sp.r[0], Math.cos(el) * sp.r[1], Math.sin(el) * Math.sin(a) * sp.r[2]];
      const out = placed(scl(dir, 1.6), sp.rot, sp.at);
      eyes.push(S.projectToSurface(placedB, out, 10));
    }
    return placedB;
  });
  let node = S.union(0.004, bodies);
  node = S.subtract(0.0022, node, ...eyes.map((p) => S.sphere(p, 0.0034)));
  node = ground(S.paint(node, {
    material: 'paper',
    color: (x, y, z) => {
      let eye = 0;
      for (const p of eyes) eye = Math.max(eye, smooth(0.0065, 0.002, Math.hypot(x - p[0], y - p[1], z - p[2])));
      const f = smooth(0.62, 0.8, valueNoise3(x * 220, y * 220, z * 220, ns + 7));
      return mix(mix(scl(skin, 0.94 + 0.08 * valueNoise3(x * 40, y * 40, z * 40, ns)), freckle, 0.6 * f), eyeC, eye);
    },
  }));
  const parts = [{ key: `${key}|body`, node, min: [-0.06, -0.01, -0.05], max: [0.07, 0.07, 0.05], cell: 0.0022, share: 1, material: 'paper', uvScale: 0.05, maxCoarsen: 2 }];
  const sproutC = linear('#c4e39a');
  const extras = form.sprout ? (md) => {
    const local = new MeshData('sprout');
    const top = eyes.reduce((a, b) => (b[1] > a[1] ? b : a));
    for (const [dx, dz, len] of [[0.6, 0.3, 0.018], [-0.5, -0.4, 0.014]]) {
      const dir = norm([dx, 1.1, dz]);
      leafBlade(local, { base: top, dir, side: norm([-dir[2], 0, dir[0]]), len, wid: len * 0.55, color: sproutC, rows: [3, 2, 2][lod], curl: 0.3, droop: 0.05 });
    }
    md.append(local);
  } : null;
  void sub;
  return buildItem({ name, lod, parts, extras, reach: 0.02 });
}
