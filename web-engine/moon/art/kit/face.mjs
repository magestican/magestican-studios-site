















import { strand } from './character.mjs';

function capture(pts, radii, sides) {
  const rec = { positions: [], vertex: (material, p) => { rec.positions.push(p); return rec.positions.length - 1; }, tri: () => {} };
  strand(rec, pts, radii, [1, 1, 1], sides, 'fur');
  return rec.positions;
}








export function strandDeltas(basePts, baseRadii, sides, movedPts, movedRadii = baseRadii) {
  const base = capture(basePts, baseRadii, sides);
  const moved = capture(movedPts, movedRadii, sides);
  return base.map((p, i) => [moved[i][0] - p[0], moved[i][1] - p[1], moved[i][2] - p[2]]);
}











export function strandWithMorphs(md, { pts, radii, color, sides, material, morphs }) {
  const start = md.group(material).positions.length / 3;
  strand(md, pts, radii, color, sides, material);
  if (!morphs) return;
  for (const [name, m] of Object.entries(morphs)) {
    const deltas = strandDeltas(pts, radii, sides, m.pts, m.radii);
    deltas.forEach((d, i) => md.morphDelta(name, material, start + i, d));
  }
}
