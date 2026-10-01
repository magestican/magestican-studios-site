



import { S, form, lin, jit } from './kit.js';

const C = {
  stone: lin('#b9ada0'), daub: lin('#ffe4b4'), wood: lin('#8a5a36'), dark: lin('#5c3a22'),
  thatch: lin('#f2d58c'), inside: lin('#2a1a14'),
};

const WINDOWS = [1.25, -1.25, 2.5, -2.5];

function hutNode() {
  const R = 0.72;
  const footing = S.paint(S.roundCylinder([0, 0.05, 0], 0.84, 0.82, 0.07, 0.04), { color: C.stone, material: 'stone' });
  let wall = S.paint(S.roundCylinder([0, 0.5, 0], R + 0.03, R - 0.03, 0.42, 0.04), { color: C.daub, material: 'plank' });
  
  const win = (a) => S.transform(S.roundBox([0, 0, 0], [0.13, 0.11, 0.3], 0.03), { translate: [Math.sin(a) * R, 0.6, Math.cos(a) * R], rotate: [0, a, 0] });
  const doorway = S.roundBox([0, 0.33, R], [0.19, 0.33, 0.25], 0.04);
  wall = S.subtract(0.015, wall, S.union(0, doorway, ...WINDOWS.map(win)));
  const inside = S.paint(S.roundCylinder([0, 0.5, 0], R - 0.12, R - 0.12, 0.4, 0.02), { color: C.inside, material: 'glass' });
  
  const leaf = S.paint(S.union(0.01,
    S.roundBox([0, 0.31, R - 0.1], [0.16, 0.3, 0.025], 0.012),
    S.roundBox([0, 0.2, R - 0.07], [0.15, 0.025, 0.012], 0.008),
    S.roundBox([0, 0.45, R - 0.07], [0.15, 0.025, 0.012], 0.008)), { color: C.wood, material: 'wood' });
  const frame = S.paint(S.union(0.02,
    S.capsule([-0.21, 0.02, R + 0.02], [-0.21, 0.68, R + 0.02], 0.035),
    S.capsule([0.21, 0.02, R + 0.02], [0.21, 0.68, R + 0.02], 0.035),
    S.capsule([-0.27, 0.7, R + 0.03], [0.27, 0.7, R + 0.03], 0.04)), { color: C.dark, material: 'wood' });
  
  const sill = (a) => S.union(0.01,
    S.transform(S.roundBox([0, 0, 0], [0.17, 0.022, 0.05], 0.015), { translate: [Math.sin(a) * (R + 0.03), 0.48, Math.cos(a) * (R + 0.03)], rotate: [0, a, 0] }),
    S.transform(S.roundBox([0, 0, 0], [0.012, 0.11, 0.012], 0.006), { translate: [Math.sin(a) * (R - 0.03), 0.6, Math.cos(a) * (R - 0.03)], rotate: [0, a, 0] }),
    S.transform(S.roundBox([0, 0, 0], [0.13, 0.012, 0.012], 0.006), { translate: [Math.sin(a) * (R - 0.03), 0.6, Math.cos(a) * (R - 0.03)], rotate: [0, a, 0] }));
  const sills = S.paint(S.union(0, ...WINDOWS.map(sill)), { color: C.wood, material: 'wood' });
  
  const posts = S.paint(S.union(0.02, ...[0.62, 1.9, 3.14, 4.38, 5.66].map((a) => {
    const x = Math.sin(a) * (R + 0.01), z = Math.cos(a) * (R + 0.01);
    return S.capsule([x, 0.06, z], [x * 0.97, 0.86, z * 0.97], 0.04);
  })), { color: C.dark, material: 'wood' });
  
  const courses = (x, y, z) => {
    const r = Math.hypot(x, z), a = Math.atan2(x, z);
    return Math.sin(y * 17.0) * 0.018 + Math.sin(a * 23 + y * 4) * 0.008 + (y < 1.05 ? Math.sin(a * 9) * 0.02 * (1.05 - y) * 4 : 0) - (r > 0 ? 0 : 0);
  };
  const cone = S.displace(S.roundCylinder([0, 1.38, 0], 1.02, 0.1, 0.5, 0.07), courses, 0.06);
  const knot = S.union(0.03, S.roundCylinder([0, 1.95, 0], 0.13, 0.08, 0.1, 0.04), S.sphere([0, 2.06, 0], 0.08));
  const thatch = S.paint(S.union(0.05, cone, knot), {
    material: 'roof',
    color: (x, y, z) => {
      const dark = y < 0.95 ? 0.72 : 1;  
      const band = Math.abs(Math.sin(y * 17.0 + 1.2)) < 0.25 ? 0.86 : 1; 
      const k = (0.9 + jit(Math.floor(Math.atan2(x, z) * 30), 3) * 0.2) * dark * band;
      return [C.thatch[0] * k, C.thatch[1] * k, C.thatch[2] * k];
    },
  });
  const tie = S.paint(S.torus([0, 1.9, 0], 0.13, 0.025), { color: C.dark, material: 'wood' });
  return S.union(0.02, footing, wall, inside, leaf, frame, sills, posts, thatch, tie);
}

export const hutForm = () => form('hut', hutNode, { min: [-1.3, -0.05, -1.3], max: [1.3, 2.2, 1.3], cell: 0.045, tris: 2400 });


export function placeHuts(batch, W) {
  const f = hutForm(), base = lin('#f2d58c');
  for (const o of W.objects) {
    if (o.kind !== 'hut') continue;
    const t = lin(o.roof);
    batch.add(f, { x: o.x, h: W.groundAt(o.x, o.y) - 0.02, y: o.y, rot: o.rot, s: o.s || 1 },
      { roof: [t[0] / base[0], t[1] / base[1], t[2] / base[2]].map((v) => Math.min(1.6, v)) });
  }
}
