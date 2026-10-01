















import { strand, smooth } from './character.mjs';

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





















export const LID_LINE = -0.35;
export const WIDE_Y = 0.22;
export const WIDE_X = 0.08;



export function eyeVertexCount(md, material = 'eye') {
  const g = md.groups.get(material);
  return g ? g.positions.length / 3 : 0;
}






export function eyeMorphs(md, { from, c, X, Y, ER, material = 'eye' }) {
  const g = md.groups.get(material);
  if (!g) return;
  const p = g.positions, yLid = LID_LINE * ER[1];
  for (let i = from; i < p.length / 3; i++) {
    const dx = p[3 * i] - c[0], dy = p[3 * i + 1] - c[1], dz = p[3 * i + 2] - c[2];
    const x = dx * X[0] + dy * X[1] + dz * X[2];
    const y = dx * Y[0] + dy * Y[1] + dz * Y[2];
    const shut = -(y - yLid);
    md.morphDelta('lidsClose', material, i, [shut * Y[0], shut * Y[1], shut * Y[2]]);
    md.morphDelta('eyesWide', material, i, [0, 1, 2].map((k) => WIDE_Y * y * Y[k] + WIDE_X * x * X[k]));
  }
}












export const BLUSH_SPREAD = 1.6;
export function blushMorph(md, { group, from = 0, to, at, inner, outer: paintOuter, pink }) {
  const outer = paintOuter * BLUSH_SPREAD;
  const g = md.groups.get(group);
  if (!g) return 0;
  const end = Math.min(to ?? g.positions.length / 3, g.positions.length / 3);
  const p = g.positions, col = g.colors;
  let n = 0;
  for (let i = from; i < end; i++) {
    let w = 0;
    for (const q of at) w = Math.max(w, 1 - smooth(inner, outer, Math.hypot(p[3 * i] - q[0], p[3 * i + 1] - q[1], p[3 * i + 2] - q[2])));
    if (!(w > 0)) continue;
    md.morphColor('blush', group, i, [0, 1, 2].map((k) => (pink[k] - col[3 * i + k]) * w));
    n++;
  }
  return n;
}




export function cheekPoints(eyesAt, ER) {
  const outer = 1.4 * ER[1];
  return {
    at: eyesAt.map((e, i) => [e[0] + (i === 0 ? 1 : -1) * 0.8 * ER[0], e[1] - 1.6 * ER[1], e[2]]),
    inner: outer * (0.018 / 0.042),
    outer,
  };
}









export function mouthCornerLift(md, morph = 'mouthSmile') {
  const m = md.morphs?.[morph];
  const g = m && md.groups.get(m.group);
  if (!g || !m.index?.size) return null;
  const p = g.positions;
  const rows = [...m.index].map(([i, d]) => ({ x: p[3 * i], dy: d[1] }));
  const xs = rows.map((r) => r.x);
  const lo = Math.min(...xs), hi = Math.max(...xs), cx = (lo + hi) / 2, reach = (hi - lo) / 2 * 0.2;
  const mean = (a) => a.reduce((s, r) => s + r.dy, 0) / (a.length || 1);
  const left = rows.filter((r) => r.x <= lo + reach && r.x < cx);
  const right = rows.filter((r) => r.x >= hi - reach && r.x > cx);
  if (!left.length || !right.length) return null;
  return Math.min(mean(left), mean(right));
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
