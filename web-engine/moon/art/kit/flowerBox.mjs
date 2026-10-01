




import { sweep, blob, roundedRectProfile, circleProfile, emit, deform } from '../../mesh/bevel.mjs';
import { compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { hex, vc, vary } from './shade.mjs';

const BLOOMS = {
  spring: ['#f7a8c4', '#fff1f5', '#f6d05b', '#e886a9'],
  summer: ['#e8545a', '#f6c453', '#9b7ee0', '#ff8f6b'],
  autumn: ['#e5812f', '#c9402f', '#f8c056', '#a8456b'],
};

export function flowerBox(mesh, m, { width = 1, detail = 0, rng, season, boxColor, leafColor, snowColor }) {
  const hw = width / 2;
  if (detail === 2) return;
  const box = sweep({
    profile: roundedRectProfile(0.18, 0.2, 0.05, detail === 0 ? 1 : 0).map(([x, y]) => [x + 0.09, y + 0.1]),
    path: [[-hw, 0, 0], [hw, 0, 0]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05,
  });
  emit(mesh, 'wood', box, { matrix: m, color: vc(boxColor, { groundAO: 0 }) });
  if (detail === 2) return;
  const winter = season === 'winter';
  const mound = sweep({
    profile: circleProfile(0.09, detail === 0 ? 6 : 5, 0, 0.07).map(([x, y]) => [y + 0.17, x + 0.1]),
    path: [[-hw + 0.05, 0, 0], [hw - 0.05, 0, 0]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.06,
    scales: 1,
  });
  if (winter) {
    deform(mound, (p) => { p[1] += 0.02; });
    emit(mesh, 'snow', mound, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
    return;
  }
  emit(mesh, 'grass', mound, { matrix: m, color: vc(leafColor, { groundAO: 0 }) });
  if (detail === 0) {
    const colours = BLOOMS[season] || BLOOMS.summer;
    const n = Math.max(4, Math.round(width / 0.13));
    for (let i = 0; i < n; i++) {
      const x = -hw + 0.08 + ((width - 0.16) * (i + rng.rangeF(0.2, 0.8))) / n;
      const r = rng.rangeF(0.065, 0.09);
      const bloom = blob({ radii: [r, r * 0.75, r], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.25 });
      const mm = compose(m, compose(translate(x, 0.27 + rng.rangeF(0, 0.07), 0.1 + rng.rangeF(-0.05, 0.06)), rotateY(rng.rangeF(0, 3))));
      emit(mesh, 'petal', bloom, { matrix: mm, color: vc(vary(rng, hex(rng.pick(colours)), 0.05), { groundAO: 0, underside: 0.2 }) });
    }
  }
}

export function steppingStone({ rng, size = 0.5, detail = 0 }) {
  const s = blob({
    radii: [size * 0.5 * rng.rangeF(0.85, 1.1), 0.08, size * 0.44 * rng.rangeF(0.85, 1.1)],
    subdiv: detail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6), lump: 0.18,
    flats: [{ n: [0, 1, 0], d: 0.45, k: 0.35 }, { n: [0, -1, 0], d: 0.2, k: 0.2 }],
  });
  const minY = Math.min(...s.p.map((p) => p[1]));
  return deform(s, (p) => { p[1] -= minY + 0.04; });
}
