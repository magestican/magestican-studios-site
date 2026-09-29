















import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { lin, fur, metal, glow, METAL, GOLD, buildArrays, dark, light, mix, ell, INK } from './dachiModel.js';
import { humanRig, ELDER_HEADS, ELDER_HEIGHT } from './humanRig.js';
import { hex, surf, normalOf, part, finePart, tube, spline, humanHead, humanEyes, humanHand, overlay, onSurface, punch } from './humanModel.js';

const SKIN = lin('#dcae88'), ROBE = punch(lin('#6a3a96')), CREAM = lin('#efe4c8'), WHITE_HAIR = lin('#f1eee8'), FUR = lin('#9a6436');
const WOOD = lin('#6b4424'), EMBER = lin('#ff6a30'), LENS = lin('#ff3a3a'), DARKM = lin('#3c4652'), STEEL = light(METAL, 0.15);
const RIG = humanRig({ height: ELDER_HEIGHT, heads: ELDER_HEADS });
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

export function elderNode() {
  const r = RIG, H = r.hh, e = r.eye, body = [], fine = [];
  
  const robe = S.union(0.2,
    S.transform(S.roundCone([0, 0, 0], [0, r.chest + 0.05 * H, 0], 0.98 * H, 0.6 * H), { translate: [0, 0.04 * H, 0], scale: [1, 1, 0.8] }), 
    ...[-1, 1].map((s) => ell([s * (r.shoulderX - 0.2 * H), r.shoulder - 0.12 * H, -0.02 * H], [0.3 * H, 0.17 * H, 0.28 * H])));
  body.push(fur(robe, ROBE));
  const rbox = (y0, y1) => ({ min: [-0.95 * H, y0, -0.75 * H], max: [0.95 * H, y1, 0.75 * H] });
  fine.push(overlay(robe, (x, y) => (y - 0.16 * H) * 0.9, GOLD, H, { box: rbox(0, 0.22 * H), tris: 300, cell: 0.02 })); 
  
  const lapel = (s) => (x, y, z) => { const t = (r.shoulder + 0.05 * H - y) / (r.shoulder - r.waist), cx = s * (0.2 - t * 0.28) * H; return Math.max(Math.abs(x - cx) - 0.07 * H, 0.1 * H - z, y - r.shoulder - 0.05 * H, r.waist - y) * 0.8; };
  for (const s of [-1, 1]) fine.push(overlay(robe, lapel(s), s < 0 ? CREAM : light(CREAM, 0.05), H, { box: rbox(r.waist - 0.05 * H, r.shoulder + 0.1 * H), tris: 180, cell: 0.02, off: s < 0 ? 0.018 : 0.01 }));
  
  body.push(metal(S.transform(S.torus([0, 0, 0], 0.66 * H, 0.075 * H), { translate: [0, r.waist, 0], rotate: [0, 0, 0.06], scale: [1, 1, 0.8] }), GOLD));
  body.push(metal(S.union(0.03, S.sphere([-0.2 * H, r.waist, 0.56 * H], 0.09 * H), S.roundCone([-0.2 * H, r.waist - 0.05 * H, 0.58 * H], [-0.26 * H, r.waist - 0.55 * H, 0.66 * H], 0.06 * H, 0.04 * H),
    S.roundCone([-0.16 * H, r.waist - 0.05 * H, 0.58 * H], [-0.08 * H, r.waist - 0.45 * H, 0.66 * H], 0.055 * H, 0.035 * H)), GOLD));
  
  for (const s of [-1, 1]) {
    body.push(fur(S.roundBox([s * 0.28 * H, 0.03 * H, 0.52 * H], [0.13 * H, 0.03 * H, 0.2 * H], 0.02 * H), WOOD));
    body.push(fur(ell([s * 0.28 * H, 0.1 * H, 0.56 * H], [0.11 * H, 0.07 * H, 0.17 * H]), SKIN));
    body.push(fur(S.transform(S.torus([0, 0, 0], 0.1 * H, 0.025 * H), { translate: [s * 0.28 * H, 0.1 * H, 0.52 * H], rotate: [0, 0, Math.PI / 2] }), dark(WOOD, 0.2)));
  }
  
  const mantle = S.displace(S.transform(S.torus([0, 0, 0], 0.42 * H, 0.16 * H), { translate: [0, r.shoulder - 0.02 * H, -0.02 * H], rotate: [0.18, 0, 0], scale: [1, 0.8, 0.95] }),
    (x, y, z) => Math.sin(x * 29 / H + z * 13 / H) * Math.sin(y * 31 / H + x * 7 / H) * 0.025 * H, 0.03 * H);
  body.push(fur(mantle, (x, y, z) => mix(FUR, light(FUR, 0.3), Math.max(0, Math.sin(x * 40 / H) * Math.sin(z * 37 / H)) * 0.8)));
  
  const tp = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, a = t * 4.6; tp.push([(-0.25 - Math.sin(a) * 0.3 * t - t * 0.55) * H, (0.6 + t * 1.6 + Math.sin(a) * 0.25) * H, (-0.62 - t * 0.3 - Math.cos(a) * 0.28 * t) * H]); }
  body.push(fur(S.union(0.06, ...tp.slice(1).map((q, i) => S.roundCone(tp[i], q, (0.11 - i * 0.0055) * H, (0.11 - (i + 1) * 0.0055) * H))), (x, y) => (y > tp[11][1] - 0.1 * H ? light(FUR, 0.25) : FUR)));

  
  
  const staffX = -(r.elbow[0] + 0.3 * H), staffZ = 0.55 * H, grip = [staffX + 0.05 * H, r.waist + 0.15 * H, staffZ]; 
  const Ls = [-r.shoulderX, r.shoulder - 0.14 * H, 0], Le = [-(r.elbow[0] + 0.06 * H), r.elbow[1] + 0.12 * H, 0.1 * H], Lw = [staffX + 0.4 * H, grip[1], staffZ - 0.1 * H];
  body.push(fur(S.union(0.1, S.sphere(Ls, 0.24 * H), S.roundCone(Ls, Le, 0.23 * H, 0.22 * H), S.roundCone(Le, Lw, 0.2 * H, 0.25 * H)), ROBE));
  fine.push(overlay(S.roundCone(Le, Lw, 0.2 * H, 0.25 * H), (x, y, z) => (Math.hypot(x - Lw[0], y - Lw[1], z - Lw[2]) - 0.1 * H) * 0.9, GOLD, H, { box: { min: add(Lw, [-0.4 * H, -0.4 * H, -0.4 * H]), max: add(Lw, [0.4 * H, 0.4 * H, 0.4 * H]) }, tris: 120, cell: 0.02 })); 
  fine.push(finePart(humanHand(r, -1, [staffX + 0.3 * H, grip[1], staffZ - 0.04 * H], norm([-1, -0.12, 0.12]), SKIN, { curl: 0.95 }), 320, 0.014)); 
  
  const Rs = [r.shoulderX, r.shoulder - 0.12 * H, 0], Re = [r.elbow[0], r.elbow[1] + 0.08 * H, 0.05 * H], Rw = [0.44 * H, r.waist + 0.04 * H, 0.46 * H];
  body.push(metal(S.transform(ell([0, 0, 0], [0.26 * H, 0.16 * H, 0.26 * H]), { translate: add(Rs, [0.02 * H, 0.1 * H, 0]), rotate: [0, 0, -0.35] }), STEEL));
  body.push(metal(S.union(0.03, S.capsule(Rs, Re, 0.13 * H), S.capsule(Re, Rw, 0.11 * H)), METAL));
  body.push(metal(S.sphere(Re, 0.16 * H), DARKM));
  body.push(metal(S.capsule(add(Rs, [0.12 * H, -0.15 * H, 0.1 * H]), add(Re, [0.08 * H, 0.18 * H, 0.12 * H]), 0.04 * H), DARKM)); 
  const hand = [ell(add(Rw, [0, -0.04 * H, 0.06 * H]), [0.13 * H, 0.1 * H, 0.12 * H])];
  for (let i = 0; i < 4; i++) hand.push(S.capsule(add(Rw, [(-0.09 + i * 0.06) * H, -0.08 * H, 0.14 * H]), add(Rw, [(-0.1 + i * 0.065) * H, -0.2 * H, 0.16 * H]), 0.03 * H));
  body.push(metal(S.union(0.02, ...hand), light(METAL, 0.1)));
  
  const top = r.crown + 0.35 * H;
  body.push(fur(S.union(0.04, S.capsule([staffX, 0, staffZ], [staffX - 0.05 * H, top, staffZ], 0.07 * H), S.sphere([staffX - 0.02 * H, r.waist + 0.9 * H, staffZ], 0.09 * H), S.sphere([staffX - 0.03 * H, r.shoulder, staffZ], 0.085 * H)), WOOD));
  body.push(fur(S.transform(S.torus([0, 0, 0], 0.2 * H, 0.055 * H), { translate: [staffX - 0.05 * H, top + 0.22 * H, staffZ], rotate: [Math.PI / 2, 0, 0] }), WOOD));
  body.push(glow(S.sphere([staffX - 0.05 * H, top + 0.22 * H, staffZ], 0.15 * H), EMBER));

  
  const hd = humanHead(r, { skin: SKIN, age: 'old', lips: mix(SKIN, lin('#a0505a'), 0.35) }), P = hd.P, R3 = hd.R;
  const parts = [hd.skin];
  
  const hairZ = S.intersect(0.03, ell(P(0, 0.08, -0.07), R3(0.42, 0.45, 0.5)),
    S.field((x, y, z) => Math.max(y - e - 0.2 * H + Math.max(0, -z) * 0.25, z - 0.02 * H, e - 0.4 * H - y) * 0.7));
  const longBack = S.roundCone(P(0, -0.1, -0.35), P(0, -0.55, -0.42), 0.26 * H, 0.18 * H);
  const knot = S.union(0.04, S.sphere(P(0, 0.62, -0.12), 0.11 * H), S.roundCone(P(0, 0.62, -0.12), P(0.02, 0.8, -0.2), 0.07 * H, 0.03 * H));
  const strand = (x, y, z) => mix(WHITE_HAIR, dark(WHITE_HAIR, 0.12), Math.max(0, Math.sin(x * 45 / H + y * 8 / H)) ** 2);
  parts.push(fur(S.union(0.05, hairZ, longBack, knot), strand), metal(S.transform(S.torus([0, 0, 0], 0.07 * H, 0.022 * H), { translate: P(0, 0.66, -0.14) }), GOLD));
  
  const beard = S.union(0.08, ell(P(-0.02, -0.4, 0.2), R3(0.27, 0.16, 0.18)), ell(P(-0.03, -0.62, 0.24), R3(0.22, 0.2, 0.15)),
    S.roundCone(P(-0.03, -0.7, 0.26), [-0.05 * H, r.chest - 0.1 * H, 0.42 * H], 0.18 * H, 0.05 * H));
  const moustache = S.union(0.02, ...[-1, 1].map((s) => S.roundCone(P(s * 0.03, -0.27, 0.43), P(s * 0.2, -0.4, 0.34), 0.045 * H, 0.025 * H)));
  parts.push(fur(S.subtract(0.02, beard, ell(P(0, -0.34, 0.37), R3(0.09, 0.035, 0.08))), strand), fur(moustache, WHITE_HAIR)); 
  
  const plate = S.intersect(0.015, S.offset(S.union(0.07, ell(P(0, 0.1, -0.05), R3(0.385, 0.42, 0.46)), ell(P(0.19, -0.12, 0.2), R3(0.12, 0.1, 0.12))), 0.03 * H),
    S.field((x, y, z) => Math.max(0.03 * H - x, e - 0.2 * H - y) * 0.9));
  parts.push(metal(plate, STEEL));
  const earDisc = S.transform(S.roundCylinder([0, 0, 0], 0.11 * H, 0.1 * H, 0.04 * H, 0.015 * H), { translate: P(0.385, -0.07, -0.04), rotate: [0, 0, -Math.PI / 2] });
  parts.push(metal(earDisc, DARKM));
  parts.push(metal(S.capsule(P(0.4, 0.05, -0.08), P(0.62, 0.62, -0.14), 0.02 * H), DARKM));
  const headNode = S.union(0.012, ...parts);
  fine.push({ ...finePart(headNode, 3000, 0.019), box: { min: [-0.62 * H, r.chest - 0.2 * H, -0.95 * H], max: [0.72 * H, r.crown + 0.4 * H, 0.66 * H] } });
  fine.push(part(glow(S.sphere(P(0.63, 0.66, -0.145), 0.045 * H), LENS), 40, 0.012)); 
  
  fine.push(...humanEyes(hd.skin, r, { iris: '#b8782a', hair: WHITE_HAIR, lips: mix(SKIN, lin('#a0505a'), 0.35), brow: 1.9, lens: (s) => s > 0 }));
  const lp = surf(hd.skin, 0.155 * H, e), ln = norm(add(normalOf(hd.skin, lp), [0, 0, 1.2]));
  const lf = S.frameFromNormal(ln), cell = 0.005 * H;
  fine.push(part(metal(S.place(S.torus([0, 0, 0], 0.085 * H, 0.03 * H), add(lp, ln, 0.04 * H), lf.X, lf.Z, lf.Y), DARKM), 90, cell * 1.5)); 
  fine.push(part(glow(S.place(ell([0, 0, 0], [0.07 * H, 0.07 * H, 0.035 * H]), add(lp, ln, 0.04 * H), lf.X, lf.Y, lf.Z), LENS), 60, cell * 1.5));
  fine.push(part(fur(S.place(ell([0, 0, 0], [0.02 * H, 0.02 * H, 0.008 * H]), add(add(add(lp, ln, 0.075 * H), lf.X, -0.022 * H), lf.Y, 0.024 * H), lf.X, lf.Y, lf.Z), [1, 1, 1]), 20, cell));
  
  for (const [u, v] of [[0.06, 0.62], [0.06, 0.4], [0.07, 0.18], [0.26, 0.08], [0.38, 0.0], [0.3, 0.42]]) {
    const q = surf(plate, u * H, e + v * H, 0.25 * H * 0);
    fine.push(part(metal(S.sphere(add(q, normalOf(plate, q), 0.004 * H), 0.024 * H), DARKM), 20, 0.008));
  }
  const skinLine = mix(SKIN, lin('#6a3a2a'), 0.35);
  for (const v of [0.26, 0.32]) fine.push(part(tube(onSurface(hd.skin, [-0.22, -0.14, -0.06, 0.0].map((u) => [u * H, e + (v + Math.abs(u) * 0.05) * H]), false, 0.004 * H), 0.008 * H, skinLine), 40, 0.008));

  const node = S.union(0.03, ...body);
  node.box = { min: [-1.6 * H, 0, -1.25 * H], max: [1.05 * H, top + 0.45 * H, 0.95 * H] };
  node.decals = fine;
  return node;
}

export const ELDER_KEY = 'elder';
export const ELDER_RIG = { eye: RIG.eye, hh: RIG.hh, height: RIG.H };
export function elderArrays() { return buildArrays(ELDER_KEY, elderNode(), 'Elder Ojiji', undefined, { tris: 3000, cell: 0.05 }); }
