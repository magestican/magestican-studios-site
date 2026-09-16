





import { blob, emit } from '../../mesh/bevel.mjs';
import { compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { hex, vc, vary } from './shade.mjs';

export const BLOOMS = Object.freeze({
  spring: Object.freeze(['#f7a8c4', '#fff1f5', '#f6d05b', '#e886a9']),
  summer: Object.freeze(['#e8545a', '#f6c453', '#9b7ee0', '#ff8f6b']),
  autumn: Object.freeze(['#e5812f', '#c9402f', '#f8c056', '#a8456b']),
  winter: Object.freeze(['#d8473a', '#c9402f', '#e8545a']),
});


export function bloom(mesh, m, [x, y, z], { r = 0.07, rng, season, colors = null }) {
  const palette = colors || BLOOMS[season] || BLOOMS.summer;
  const shape = blob({ radii: [r, r * 0.72, r], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.25 });
  emit(mesh, 'petal', shape, { matrix: compose(m, compose(translate(x, y, z), rotateY(rng.rangeF(0, 3)))), color: vc(vary(rng, hex(rng.pick(palette)), 0.05), { groundAO: 0, underside: 0.2 }) });
}
