











import { Shape, sweep, emit, circleProfile, roundedRectProfile } from '../../mesh/bevel.mjs';
import { compose, rotateX, rotateY } from '../../mesh/meshData.mjs';
import { pillow } from './door.mjs';
import { hex, vc, vary } from './shade.mjs';
import { rod } from './rod.mjs';
import { bloom, BLOOMS } from './blooms.mjs';

export function wreath(mesh, m, { radius = 0.19, detail = 0, rng, season = 'summer', leafColor }) {
  if (detail === 2) return;
  const N = detail === 0 ? 9 : 7;
  const path = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; path.push([Math.sin(a) * radius, Math.cos(a) * radius, 0.04]); }
  const lumps = path.map(() => rng.rangeF(0.8, 1.22));
  const ring = sweep({ profile: circleProfile(0.036, 4, Math.PI / 4, 0.055), path, closed: true, up: [0, 0, 1], scales: (t, i) => lumps[i] });
  emit(mesh, 'grass', ring, { matrix: m, color: vc(leafColor, { groundAO: 0, underside: 0.3 }) });
  const berries = season === 'autumn' || season === 'winter';
  const n = detail === 0 ? 3 : 2;
  const start = rng.rangeF(0, Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 1.3;
    bloom(mesh, m, [Math.sin(a) * radius, Math.cos(a) * radius, 0.08], { r: berries ? 0.03 : 0.045, rng, season, colors: berries ? BLOOMS.winter : null });
  }
}



export function bunting(mesh, m, { from, to, sag = 0.14, flags = 7, flagH = 0.2, detail = 0, rng, colors, stringColor, material = 'canvas' }) {
  if (detail === 2) return;
  const n = detail === 0 ? flags : Math.max(2, Math.ceil(flags / 2));
  const P = (t) => [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag * 4 * t * (1 - t), from[2] + (to[2] - from[2]) * t];
  emit(mesh, 'wood', rod({ path: [0, 0.25, 0.5, 0.75, 1].map(P), w: 0.018, sides: 3, detail: 2, caps: 'none' }), { matrix: m, color: vc(stringColor, { groundAO: 0 }) });
  const cloth = new Shape();
  const tints = [];
  for (let k = 0; k < n; k++) {
    const t0 = (k + 0.14) / n, t1 = (k + 0.86) / n;
    const a = P(t0), b = P(t1), mid = P((t0 + t1) / 2);
    const swing = rng.rangeF(-0.05, 0.05);
    const h = flagH * rng.rangeF(0.9, 1.08);
    const c = [mid[0] + rng.rangeF(-0.015, 0.015), mid[1] - h, mid[2] + swing];
    const d = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3 + 0.014 + swing * 0.3];
    const col = vary(rng, hex(colors[k % colors.length]), 0.05);
    const ids = [a, b, c, d].map((p, j) => { tints.push(col); return cloth.add(p, [[0, 0], [1, 0], [0.5, 1], [0.5, 0.4]][j]); });
    cloth.tri(ids[0], ids[2], ids[3]);
    cloth.tri(ids[2], ids[1], ids[3]);
    cloth.tri(ids[1], ids[0], ids[3]);
  }
  emit(mesh, material, cloth, { matrix: m, color: (p, nn, uv, tag, i) => vc(tints[i], { groundAO: 0, underside: 0.1 })(p, nn, uv, tag) });
}


export function doormat(mesh, m, { width = 0.8, depth = 0.48, detail = 0, rng, color, material = 'canvas' }) {
  const outline = (d) => roundedRectProfile(width - 2 * d, depth - 2 * d, 0.07, detail === 0 ? 1 : 0);
  const mat = pillow({ outline, insets: detail === 2 ? [0] : [0, 0.05], zs: [0, 0.022], centre: [0, 0], centreZ: 0.028, uv: ([x, y]) => [x * 2.2, y * 2.2] });
  emit(mesh, material, mat, { matrix: compose(m, compose(rotateY(rng.rangeF(-0.07, 0.07)), rotateX(-Math.PI / 2))), color: vc(color, { useTag: true, groundAO: 0.1, groundFade: 0.05 }) });
}
