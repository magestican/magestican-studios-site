






import { S, form, lin } from './kit.js';

const STONE = lin('#d8d0c2'), STONE_DARK = lin('#b0a698'), RED = lin('#d0402f'), TEAL = lin('#2f9c86'), TEAL_DARK = lin('#1f6c5e');
const DAUB = lin('#fff0d0'), GOLD = lin('#f0c050'), ORB = lin('#ffe58a'), DOOR = lin('#2a1a14'), INK = lin('#3a1e1c');





function hipRoof(y0, ex, pitch, cut, ez = ex) {
  const n = [1, pitch], l = Math.hypot(...n), a = n[0] / l, b = n[1] / l, ox = a * ex + b * y0, oz = a * ez + b * y0;
  let r = S.intersect(0.02, S.plane([0, -1, 0], -y0), S.plane([a, b, 0], ox));
  r = S.intersect(0.02, r, S.plane([-a, b, 0], ox));
  r = S.intersect(0.02, r, S.plane([0, b, a], oz));
  r = S.intersect(0.02, r, S.plane([0, b, -a], oz));
  if (cut) r = S.intersect(0.02, r, S.plane([0, 1, 0], cut));
  return r;
}

function templeNode() {
  const plinth = S.paint(S.union(0.02,
    S.roundBox([0, 0.12, 0], [1.5, 0.12, 1.5], 0.03), S.roundBox([0, 0.36, 0], [1.28, 0.12, 1.28], 0.03), S.roundBox([0, 0.6, 0], [1.06, 0.12, 1.06], 0.03)), {
    material: 'stone', color: (x, y) => (Math.abs((y / 0.24) % 1 - 0.5) > 0.42 ? STONE_DARK : STONE),
  });
  const stair = S.paint(S.union(0.01, ...[0, 1, 2].map((k) => S.roundBox([0, 0.12 + k * 0.24, 1.72 - k * 0.24], [0.36, 0.12, 0.13], 0.02))), { color: STONE, material: 'stone' });
  let sanctum = S.roundBox([0, 1.17, 0], [0.7, 0.45, 0.7], 0.03);
  sanctum = S.subtract(0.01, sanctum, S.roundBox([0, 1.05, 0.72], [0.22, 0.33, 0.08], 0.02));
  const walls = S.paint(sanctum, { color: DAUB, material: 'plank' });
  const door = S.paint(S.roundBox([0, 1.05, 0.64], [0.2, 0.32, 0.02], 0.01), { color: DOOR, material: 'glass' });
  const pillars = S.paint(S.union(0.01, ...[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, z]) => S.roundCylinder([x, 1.17, z], 0.075, 0.075, 0.45, 0.02))), { color: RED, material: 'wood' });
  const roof1 = S.paint(hipRoof(1.62, 1.32, 0.55, 2.0), { material: 'roof', color: (x, y) => (y < 1.7 ? TEAL_DARK : TEAL) });
  const band = S.paint(S.roundBox([0, 1.64, 0], [1.3, 0.03, 1.3], 0.01), { color: GOLD, material: 'wood' });
  
  
  
  const upper = S.paint(S.roundBox([0, 2.2, 0], [0.6, 0.22, 0.42], 0.03), { color: RED, material: 'wood' });
  const RIDGE_Y = 2.4 + 0.72 * 0.65; 
  const roof2 = S.paint(hipRoof(2.4, 1.02, 1 / 0.65, 0, 0.72), { material: 'roof', color: (x, y) => (y < 2.47 ? TEAL_DARK : TEAL) });
  const ridge = S.paint(S.capsule([-0.3, RIDGE_Y + 0.01, 0], [0.3, RIDGE_Y + 0.01, 0], 0.045), { color: INK, material: 'wood' });
  const finials = S.paint(S.union(0.01, S.sphere([-0.34, RIDGE_Y + 0.07, 0], 0.05), S.sphere([0.34, RIDGE_Y + 0.07, 0], 0.05)), { color: GOLD, material: 'wood' });
  const orb = S.paint(S.union(0.02, S.capsule([0, RIDGE_Y, 0], [0, RIDGE_Y + 0.16, 0], 0.03), S.sphere([0, RIDGE_Y + 0.24, 0], 0.1)), { color: ORB, material: 'fire' });
  return S.union(0.015, plinth, stair, walls, door, pillars, roof1, band, upper, roof2, ridge, finials, orb);
}
export const templeForm = () => form('temple', templeNode, { min: [-1.7, -0.05, -1.7], max: [1.7, 3.35, 2.0], cell: 0.05, tris: 1800 }); 

function lanternNode() {
  const stone = S.union(0.02,
    S.roundCylinder([0, 0.05, 0], 0.2, 0.17, 0.05, 0.015), S.roundCylinder([0, 0.32, 0], 0.07, 0.06, 0.24, 0.015),
    S.roundBox([0, 0.58, 0], [0.16, 0.03, 0.16], 0.01),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => S.roundBox([x * 0.12, 0.7, z * 0.12], [0.025, 0.1, 0.025], 0.008)),
    S.roundCylinder([0, 0.86, 0], 0.25, 0.05, 0.07, 0.02), S.sphere([0, 0.96, 0], 0.04));
  const core = S.paint(S.roundBox([0, 0.7, 0], [0.09, 0.08, 0.09], 0.02), { color: lin('#ffd070'), material: 'fire' });
  return S.union(0.01, S.paint(stone, { color: STONE, material: 'stone' }), core);
}
export const lanternForm = () => form('lantern', lanternNode, { min: [-0.32, -0.03, -0.32], max: [0.32, 1.02, 0.32], cell: 0.022, tris: 260 });

function gateNode() {
  const posts = S.union(0.01, S.roundCylinder([-0.95, 0.95, 0], 0.085, 0.07, 0.95, 0.02), S.roundCylinder([0.95, 0.95, 0], 0.085, 0.07, 0.95, 0.02));
  const nuki = S.roundBox([0, 1.6, 0], [1.1, 0.05, 0.05], 0.015);
  const red = S.paint(S.union(0.01, posts, nuki), { color: RED, material: 'wood' });
  const kasagi = S.paint(S.union(0.03, S.roundBox([0, 1.92, 0], [1.32, 0.06, 0.1], 0.02), S.roundBox([0, 2.0, 0], [1.42, 0.035, 0.12], 0.015)), { color: INK, material: 'wood' });
  return S.union(0.01, red, kasagi);
}
export const gateForm = () => form('gate', gateNode, { min: [-1.55, -0.03, -0.2], max: [1.55, 2.1, 0.2], cell: 0.03, tris: 320 });

export function placeTemple(batch, W) {
  for (const o of W.objects) {
    const at = { x: o.x, h: W.groundAt(o.x, o.y) - 0.02, y: o.y, rot: o.rot || 0 };
    if (o.kind === 'temple') batch.add(templeForm(), at);
    else if (o.kind === 'lantern') batch.add(lanternForm(), at);
    else if (o.kind === 'gate') batch.add(gateForm(), at);
  }
}
