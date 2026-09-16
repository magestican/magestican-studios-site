













import { blob, emit, deform, computeNormals, splitShape } from '../../mesh/bevel.mjs';
import { hex, vc, vary } from './shade.mjs';
import { rod } from './rod.mjs';

export function hedge(mesh, m, { length = 1.6, height = 0.6, depth = 0.5, detail = 0, rng, leafColor, snowColor = null }) {
  const lobes = detail === 2 ? 1 : Math.max(2, Math.round(length / 0.55));
  const bendZ = rng.rangeF(-0.08, 0.08);
  const tip = [leafColor[0] * 1.25, leafColor[1] * 1.2, leafColor[2] * 1.05];
  const leaf = (p, nn, uv, tag) => {
    const base = vc(leafColor, { groundAO: 0.35, groundFade: 0.4, underside: 0.3, mottle: 0.12 })(p, nn, uv, tag);
    const t = Math.max(0, nn[1]) * 0.35;
    return [base[0] + (tip[0] - leafColor[0]) * t, base[1] + (tip[1] - leafColor[1]) * t, base[2] + (tip[2] - leafColor[2]) * t];
  };
  const step = length / lobes;
  for (let i = 0; i < lobes; i++) {
    const cx = -length / 2 + step * (i + 0.5) + (lobes > 1 ? rng.rangeF(-0.06, 0.06) : 0);
    const h = height * (lobes > 1 ? rng.rangeF(0.86, 1.08) : 1);
    const rx = lobes > 1 ? step * rng.rangeF(0.68, 0.78) : length / 2;
    const shape = blob({
      radii: [rx, h / 2, (depth / 2) * rng.rangeF(0.9, 1.06)], subdiv: detail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6),
      lump: detail === 2 ? 0.05 : 0.16, lumpFreq: 2.8, flats: [{ n: [0, -1, 0], d: 0.55, k: 0.15 }],
    });
    const cz = bendZ * (1 - (2 * cx / length) ** 2) + rng.rangeF(-0.03, 0.03);
    deform(shape, (p) => { p[0] += cx; p[1] += h * 0.5 * 0.55 - 0.03; p[2] += cz; });
    if (!snowColor) { emit(mesh, 'grass', shape, { matrix: m, color: leaf }); continue; }
    const n = computeNormals(shape);
    const [bare, snowy] = splitShape(shape, (tri) => (n[tri[0]][1] + n[tri[1]][1] + n[tri[2]][1]) / 3 > 0.45);
    emit(mesh, 'grass', bare, { matrix: m, color: leaf });
    emit(mesh, 'snow', snowy, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export function picketFence(mesh, m, { length = 1.8, height = 0.62, spacing = 0.17, detail = 0, rng, color, snowColor = null }) {
  const c = () => vc(vary(rng, color, 0.05), { groundAO: 0.3 });
  const railYs = detail === 2 ? [height * 0.55] : [height * 0.3, height * 0.72];
  for (const y of railYs) {
    const rail = rod({ path: [[-0.03, y + rng.rangeF(-0.01, 0.01), -0.035], [length / 2, y + rng.rangeF(-0.015, 0.015), -0.04], [length + 0.03, y, -0.035]], w: 0.055, h: 0.035, detail: 1 });
    emit(mesh, 'wood', rail, { matrix: m, color: c() });
  }
  const n = detail === 2 ? 3 : Math.max(2, Math.round(length / (detail === 0 ? spacing : spacing * 1.5)) + 1);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * length + rng.rangeF(-0.012, 0.012);
    const h = height * rng.rangeF(0.93, 1.05);
    const picket = rod({ path: [[x, -0.03, 0], [x + rng.rangeF(-0.025, 0.025), h, rng.rangeF(-0.01, 0.01)]], w: 0.075, h: 0.028, detail: 1, up: [1, 0, 0], caps: ['none', 'round'], capLength: 0.07 });
    emit(mesh, 'wood', picket, { matrix: m, color: c() });
  }
  if (snowColor && detail < 2) {
    const y = railYs[railYs.length - 1] + 0.035;
    emit(mesh, 'snow', rod({ path: [[0.02, y, -0.035], [length / 2, y + 0.01, -0.04], [length - 0.04, y, -0.035]], w: 0.04, h: 0.05, detail: 1, capLength: 0.05, scales: (t) => [1, 0.8 + 0.3 * Math.sin(Math.PI * t)] }), { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export { hex };
