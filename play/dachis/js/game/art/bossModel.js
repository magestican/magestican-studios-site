









import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { lin, fur, metal, glow, ell, dachiNode, buildArrays, dark, mix, IVORY, DECAL_UV } from './dachiModel.js';
import { planLayout, SWING } from './dachiPlans.js';
import { BOSSES } from '../data/species.js';

const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const tubeOf = (pts, r, paint) => paint(S.union(0.02, ...pts.slice(1).map((q, i) => S.capsule(pts[i], q, typeof r === 'function' ? r(i / (pts.length - 2 || 1)) : r))));
const BONE = IVORY, EMBER = lin('#ff7a1a'), CYAN = lin('#39e6ff'), OBSIDIAN = lin('#221c2c'), VIOLET = lin('#a070ff');
const DARKM = lin('#3c4652'), LEAF = lin('#5fc864'), BARK = lin('#5a3c26'), GOLDC = lin('#ffcf40'), RED = lin('#ff2a3a');



export { BOSSES };
export const bossById = (id) => BOSSES.find((b) => b.id === id);
export const bossKey = (id) => `boss-${id}`;
const BOSS_CELL = 0.058, BOSS_TRIS = 4200; 


function swung(node, plan, pz) {
  const a = SWING[plan] || 0;
  return a ? S.transform(S.transform(node, { translate: [0, 0, -pz] }), { rotate: [0, a, 0], translate: [0, 0, pz] }) : node;
}


const EXTRAS = {
  ashlo(h) { 
    const out = [], bars = [0.72, 0.92, 1.12, 1.32];
    for (const y of bars) out.push(tubeOf([[-0.5, y, 0.28], [-0.28, y, 0.52], [0, y + 0.02, 0.6], [0.28, y, 0.52], [0.5, y, 0.28]], 0.055, (n) => metal(n, lin('#f39a66'))));
    out.push(metal(S.capsule([0, 0.62, 0.58], [0, 1.45, 0.6], 0.06), lin('#c8784a')));
    out.push(glow(ell([0, 1.02, 0.4], [0.34, 0.38, 0.16]), EMBER));
    for (const s of [-1, 1]) {
      out.push(metal(S.transform(S.roundCylinder([0, 0, 0], 0.13, 0.11, 0.34, 0.03), { translate: [s * 0.36, 1.95, -0.5], rotate: [-0.45, 0, s * 0.2] }), DARKM));
      out.push(glow(S.transform(S.roundCylinder([0, 0, 0], 0.09, 0.09, 0.04, 0.02), { translate: [s * 0.43, 2.26, -0.66], rotate: [-0.45, 0, s * 0.2] }), EMBER));
    }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; out.push(metal(S.transform(S.torus([0, 0, 0], 0.08, 0.025), { translate: [Math.sin(a) * 0.6, 1.58 + Math.cos(a) * 0.04, Math.cos(a) * 0.52 + 0.05], rotate: [Math.PI / 2 * (i % 2), a, 0] }), DARKM)); }
    for (let i = 0; i < 5; i++) { const y = 1.9 - i * 0.26; out.push(fur(S.roundCone([0, y, -0.48], [0, y + 0.2, -0.85 + i * 0.03], 0.09, 0.02), dark(BONE, 0.1))); }
    return out;
  },
  leviathrum(h, pz) { 
    const out = [];
    for (const s of [-1, 1]) for (const z of [-0.15, -0.5, -0.85]) {
      const c = [s * 0.7, 1.18, z];
      out.push(metal(S.transform(S.torus([0, 0, 0], 0.11, 0.035), { translate: c, rotate: [0, 0, Math.PI / 2] }), DARKM), glow(ell(add(c, [s * 0.01, 0, 0]), [0.03, 0.09, 0.09]), CYAN));
    }
    out.push(metal(S.roundBox([0, 1.95, -0.55], [0.17, 0.26, 0.36], 0.08), lin('#8190a6')));
    out.push(tubeOf([[0, 2.1, -0.45], [0, 2.7, -0.42], [0.04, 2.76, -0.25]], 0.045, (n) => metal(n, DARKM)));
    out.push(glow(S.sphere([0.04, 2.76, -0.2], 0.06), CYAN));
    for (const z of [-0.25, -0.6, -0.95]) out.push(fur(S.transform(S.torus([0, 0, 0], 0.76 - Math.abs(z + 0.6) * 0.15, 0.05), { translate: [0, 1.15, z], rotate: [Math.PI / 2, 0, 0] }), BONE));
    for (let i = 0; i < 3; i++) { const a = i * 2.09; out.push(metal(S.transform(ell([0, 0, 0], [0.07, 0.34, 0.03]), { translate: [Math.sin(a) * 0.22, 1.2 + Math.cos(a) * 0.22, -1.62], rotate: [0, 0, -a] }), lin('#f2c25a'))); }
    return out.map((n) => swung(n, 'fish', pz));
  },
  bramble(h) { 
    const out = [], top = h.c[1] + h.r * 0.8;
    for (const s of [-1, 1]) {
      const beam = [[s * 0.35, top, 0], [s * 0.75, top + 0.6, -0.1], [s * 1.05, top + 1.25, -0.2], [s * 1.2, top + 1.8, -0.25]];
      out.push(tubeOf(beam, (t) => 0.12 - t * 0.07, (n) => fur(n, lin('#d8c8a0'))));
      for (const [k, dx, dy] of [[1, 0.35, 0.45], [2, -0.35, 0.5], [2, 0.3, 0.55]]) {
        const b = beam[k], tip = add(b, [s * dx, dy, 0.05]);
        out.push(fur(S.roundCone(b, tip, 0.07, 0.025), lin('#d8c8a0')));
        out.push(fur(S.transform(ell([0, 0, 0], [0.2, 0.1, 0.05]), { translate: add(tip, [0, 0.05, 0]), rotate: [0, 0.3, s * 0.5] }), LEAF), glow(S.sphere(add(tip, [s * 0.1, -0.08, 0.06]), 0.06), GOLDC));
      }
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; out.push(tubeOf([[Math.sin(a) * 0.4, 0.5, Math.cos(a) * 0.35], [Math.sin(a) * 0.8, 0.2, Math.cos(a) * 0.7], [Math.sin(a) * 1.15, 0.03, Math.cos(a) * 1.0]], (t) => 0.1 - t * 0.06, (n) => metal(n, lin('#3c5a3a')))); }
    out.push(fur(S.transform(S.roundCone([0, 0, 0], [0, 0.75, 0], 0.75, 0.55), { translate: [0, 0.05, 0] }), (x, y, z) => (Math.sin(Math.atan2(x, z) * 9) > 0.3 ? BARK : dark(BARK, 0.25))));
    for (const s of [-1, 1]) out.push(fur(S.displace(ell([s * 0.5, 1.62, -0.05], [0.3, 0.14, 0.3]), (x, y, z) => Math.sin(x * 20) * Math.sin(z * 18) * 0.03, 0.03), lin('#4f8a3a')));
    return out;
  },
  kingshade(h) { 
    const out = [];
    for (const s of [-1, 1]) {
      out.push(metal(S.transform(ell([0, 0, 0], [0.5, 0.3, 0.46]), { translate: [s * 1.18, 1.22, 0.05], rotate: [0, 0, s * -0.5] }), OBSIDIAN));
      out.push(glow(S.transform(S.torus([0, 0, 0], 0.44, 0.035), { translate: [s * 1.2, 1.15, 0.05], rotate: [0, 0, s * -0.5] }), VIOLET));
      for (const k of [0, 1]) out.push(metal(S.roundCone([s * (1.25 + k * 0.2), 1.35 - k * 0.08, 0], [s * (1.6 + k * 0.25), 1.8 - k * 0.12, -0.05], 0.11, 0.02), OBSIDIAN));
      out.push(fur(S.sphere([s * 0.92, 0.5, 0.28], 0.3), lin('#2c2634'))); 
    }
    const ct = h.c[1] + h.r * 0.82;
    out.push(metal(S.transform(S.torus([0, 0, 0], 0.46, 0.07), { translate: [0, ct, h.c[2] - 0.05], rotate: [-0.2, 0, 0] }), lin('#ffd84a')));
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.55; out.push(metal(S.roundCone([Math.sin(a) * 0.44, ct + 0.02, h.c[2] - 0.05 + Math.cos(a) * 0.4], [Math.sin(a) * 0.5, ct + 0.42 - Math.abs(i - 2) * 0.1, h.c[2] - 0.1 + Math.cos(a) * 0.44], 0.07, 0.015), lin('#ffd84a'))); }
    out.push(glow(S.sphere([0, ct + 0.1, h.c[2] + 0.4], 0.08), VIOLET));
    out.push(fur(S.transform(S.roundBox([0, 0, 0], [1.05, 1.0, 0.05], 0.04), { translate: [0, 1.0, -0.7], rotate: [0.12, 0, 0] }), (x, y) => (y < 0.18 ? lin('#ffd84a') : lin('#8a1c2c'))));
    out.push(metal(S.transform(S.roundBox([0, 0, 0], [0.09, 0.95, 0.03], 0.02), { translate: [0.2, 1.6, -0.75], rotate: [0, 0, 0.55] }), lin('#c9ccd8')));
    out.push(metal(S.transform(S.roundBox([0, 0, 0], [0.3, 0.05, 0.05], 0.02), { translate: [-0.3, 2.35, -0.75], rotate: [0, 0, 0.55] }), lin('#ffd84a')));
    out.push(glow(S.sphere([-0.4, 2.55, -0.75], 0.07), VIOLET));
    return out;
  },
  quartz(h) { 
    const out = [], hc = h.c, hr = h.r;
    const hood = S.intersect(0.03, S.shell(ell(hc, [hr * 1.1, hr * 1.05, hr * 1.08]), 0.05), S.field((x, y, z) => Math.max(z - hc[2] - 0.35 * hr, hc[1] - 0.25 * hr - y)));
    out.push(fur(S.union(0.05, hood, S.roundCone([0, hc[1] + hr * 0.9, hc[2] - 0.4], [0, hc[1] + hr * 1.4, hc[2] - 0.9], 0.2, 0.03)), lin('#2e2838')));
    out.push(fur(S.roundCone([0, 0.05, 0], [0, 1.5, 0], 0.85, 0.55), (x, y) => (y < 0.15 ? lin('#8a6a3a') : lin('#3a3248'))));
    for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.55, b = [Math.sin(a) * 0.5, 1.45 - Math.abs(i - 3) * 0.08, -0.5]; out.push(glow(S.roundCone(b, add(b, [Math.sin(a) * 1.4, 1.6 - Math.abs(i - 3) * 0.3, -0.2]), 0.17, 0.03), CYAN)); }
    for (const s of [-1, 1]) {
      out.push(glow(S.transform(S.torus([0, 0, 0], 0.2, 0.03), { translate: [s * 0.4, hc[1] + 0.2, hc[2] + hr * 0.92], rotate: [Math.PI / 2, 0, 0] }), CYAN));
      for (let k = 0; k < 3; k++) out.push(fur(S.roundCone([s * 0.85, 0.85, 0.3 + k * 0.08 - 0.08], [s * 1.0, 0.5, 0.55 + k * 0.1 - 0.1], 0.07, 0.015), BONE));
    }
    return out;
  },
  glacius(h, pz) { 
    const out = [], body = [];
    for (const s of [-1, 1]) out.push(tubeOf([[s * 0.32, 1.35, 1.2], [s * 0.5, 0.95, 1.7], [s * 0.6, 1.0, 2.2], [s * 0.5, 1.45, 2.45]], (t) => 0.13 - t * 0.1, (n) => fur(n, BONE)));
    for (let i = 0; i < 3; i++) body.push(metal(S.transform(ell([0, 0, 0], [0.62, 0.14, 0.4]), { translate: [0, 1.46 - i * 0.02, -0.05 - i * 0.45], rotate: [0.12, 0, 0] }), lin('#92c2ff')));
    for (let i = 0; i < 5; i++) body.push(glow(S.roundCone([0, 1.55, 0.1 - i * 0.3], [(i % 2 ? 0.12 : -0.12), 2.05 - Math.abs(i - 2) * 0.1, 0.05 - i * 0.3], 0.1, 0.015), CYAN));
    for (const s of [-1, 1]) body.push(metal(S.transform(S.roundCylinder([0, 0, 0], 0.09, 0.07, 0.18, 0.02), { translate: [s * 0.62, 1.15, -0.7], rotate: [0.6, 0, s * 0.8] }), DARKM));
    return [...out, ...body.map((n) => swung(n, 'quadruped', pz))];
  },
  pyrecrown(h, pz) { 
    const out = [], ct = h.c[1] + h.r * 0.85;
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.5; out.push(glow(S.roundCone([Math.sin(a) * 0.4, ct, h.c[2] - 0.1 + Math.cos(a) * 0.25], [Math.sin(a) * 0.55, ct + 0.55 - Math.abs(i - 2) * 0.12, h.c[2] - 0.2 + Math.cos(a) * 0.3], 0.1, 0.02), lin('#ffd070'))); }
    const body = [];
    for (const s of [-1, 1]) {
      const root = [s * 0.55, 1.35, -0.3], spar = [root, [s * 1.1, 1.9, -0.45], [s * 1.8, 2.3, -0.55]];
      body.push(tubeOf(spar, (t) => 0.08 - t * 0.04, (n) => fur(n, BONE)));
      for (let k = 0; k < 3; k++) body.push(glow(S.transform(ell([0, 0, 0], [0.62 - k * 0.08, 0.16, 0.05]), { translate: [s * (0.95 + k * 0.32), 1.55 + k * 0.22, -0.48], rotate: [0, 0, s * (0.35 + k * 0.2)] }), mix(lin('#ff5a1a'), lin('#ffd070'), k / 3)));
    }
    for (let i = 0; i < 3; i++) body.push(glow(S.roundCone([(i - 1) * 0.15, 0.95, -0.8], [(i - 1) * 0.35, 0.5 + i * 0.1, -1.55 - i * 0.05], 0.12, 0.02), lin('#ff7a1a')));
    return [...out, ...body.map((n) => swung(n, 'bird', pz))];
  },
  oblivar(h) { 
    const out = [], hc = h.c;
    out.push(glow(S.transform(S.torus([0, 0, 0], 1.55, 0.07), { translate: [0, hc[1] + 0.2, hc[2] - 0.9], rotate: [Math.PI / 2, 0, 0] }), RED));
    out.push(fur(ell([0, hc[1] + 0.2, hc[2] - 1.0], [1.4, 1.4, 0.05]), lin('#14081e')));
    for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = t * 3.6 + k * 2.09, rr = 0.2 + t * 1.1; pts.push([Math.cos(a) * rr, hc[1] + 0.2 + Math.sin(a) * rr, hc[2] - 0.93]); } out.push(tubeOf(pts, 0.035, (n) => glow(n, RED))); }
    for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.42; out.push(metal(S.roundCone([Math.sin(a) * 0.7, hc[1] + 0.72, hc[2] - 0.1 + Math.cos(a) * 0.3], [Math.sin(a) * 0.95, hc[1] + 1.35 - Math.abs(i - 3) * 0.12, hc[2] - 0.2 + Math.cos(a) * 0.35], 0.08, 0.015), lin('#1a1424'))); }
    
    const wrist = [1.1, 1.3, 0.3], palm = [1.45, 1.55, 0.65], hand = [ell(palm, [0.32, 0.3, 0.12]), S.capsule(wrist, palm, 0.16)];
    for (let i = 0; i < 4; i++) { const b = add(palm, [(-0.18 + i * 0.12), 0.22, 0.05]), m = add(b, [(-0.1 + i * 0.07), 0.35, 0.18]), t = add(m, [(-0.05 + i * 0.03), 0.22, 0.25]); hand.push(S.capsule(b, m, 0.07), S.capsule(m, t, 0.055)); }
    hand.push(S.capsule(add(palm, [-0.25, -0.05, 0.05]), add(palm, [-0.5, 0.18, 0.3]), 0.08));
    out.push(glow(S.union(0.06, ...hand), lin('#ff3030')));
    return out;
  },
};

export function bossNode(id) {
  const b = bossById(id), sp = { id: bossKey(id), name: b.name, stage: 3, types: b.types, color: b.color, accent: b.accent, look: b.look };
  const node = dachiNode(sp, {});
  const ly = planLayout(b.look.plan, { S, ell }) || { head: { c: [0, 1.14, 0.06], r: 0.98 } };
  const extras = EXTRAS[id](ly.head, ly.head.c[2]);
  const out = S.union(0.03, node, ...extras);
  const lo = node.box.min.slice(), hi = node.box.max.slice();
  for (const d of extras) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], d.b.c[a] - d.b.r); hi[a] = Math.max(hi[a], d.b.c[a] + d.b.r); }
  out.box = { min: lo, max: hi }; out.decals = node.decals;
  return out;
}



const UV_K = 1.5;
export function bossArrays(id) {
  const arr = buildArrays(bossKey(id), bossNode(id), bossById(id).name, undefined, { tris: BOSS_TRIS, cell: BOSS_CELL });
  for (const g of arr.groups) for (let i = 0; i < g.uv.length; i += 2) {
    if (Math.abs(g.uv[i] - DECAL_UV[0]) < 1e-6 && Math.abs(g.uv[i + 1] - DECAL_UV[1]) < 1e-6) continue;
    g.uv[i] *= UV_K; g.uv[i + 1] *= UV_K;
  }
  return arr;
}
