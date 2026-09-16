









import { MeshData, IDENTITY } from '../../mesh/meshData.mjs';
import { emit } from '../../mesh/bevel.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { seasonPalette } from '../../palette/seasons.mjs';
import { hex, vc, vary } from './shade.mjs';
import { rod } from './rod.mjs';

export const SEAT_Y = 0.44;

export function bench(mesh, m, { width = 1.1, detail = 0, rng, woodColor, frameColor, snowColor = null }) {
  const hw = width / 2, sy = SEAT_Y;
  const slatC = () => vc(vary(rng, woodColor, 0.06), { groundAO: 0.2, underside: 0.4 });
  const frameC = () => vc(vary(rng, frameColor, 0.04), { groundAO: 0.35 });
  const put = (shape, color) => emit(mesh, 'wood', shape, { matrix: m, color });

  if (detail === 2) {
    put(rod({ path: [[-hw, sy - 0.02, 0.01], [hw, sy - 0.02, 0.01]], w: 0.07, h: 0.36, detail: 1 }), slatC());
    put(rod({ path: [[-hw + 0.03, 0.72, -0.25], [hw - 0.04, 0.72, -0.25]], w: 0.05, h: 0.26, detail: 1, up: [0, 0.26, 0.97] }), slatC());
    for (const s of [-1, 1]) put(rod({ path: [[s * (hw - 0.1), -0.02, -0.16], [s * (hw - 0.1), sy, -0.15], [s * (hw - 0.1), 0.86, -0.3]], w: 0.06, h: 0.06, detail: 1, up: [0, 0, 1] }), frameC());
    return { seatY: sy };
  }

  for (const s of [-1, 1]) {
    const x = s * (hw - 0.1) + rng.rangeF(-0.015, 0.015);
    const lean = rng.rangeF(-0.02, 0.02);
    const rear = detail === 0
      ? [[x, -0.02, -0.17], [x, sy - 0.03, -0.15], [x + lean * 0.5, 0.66, -0.215], [x + lean, 0.9, -0.3]]
      : [[x, -0.02, -0.17], [x, sy - 0.03, -0.15], [x + lean, 0.9, -0.3]];
    put(rod({ path: rear, w: 0.065, h: 0.06, detail: 1, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.035 }), frameC());
    put(rod({ path: [[x, -0.02, 0.17], [x + lean * 0.3, sy - 0.03, 0.16]], w: 0.06, h: 0.06, detail: 1, up: [0, 0, 1], caps: 'none' }), frameC());
    if (detail === 0) put(rod({ path: [[x, sy - 0.065, 0.21], [x, sy - 0.07, -0.19]], w: 0.05, h: 0.05, detail: 1, up: [0, 1, 0] }), frameC());
  }

  const seat = detail === 0 ? [0.125, 0, -0.125] : [0.09, -0.09];
  const slatD = detail === 0 ? 0.11 : 0.165;
  for (const z of seat) {
    const x0 = -hw + rng.rangeF(-0.02, 0.03), x1 = hw + rng.rangeF(-0.03, 0.02);
    const path = [[x0, sy + rng.rangeF(-0.006, 0.006), z], [x1, sy + rng.rangeF(-0.006, 0.006), z + rng.rangeF(-0.006, 0.006)]];
    put(rod({ path, w: 0.045, h: slatD, detail, corner: 0, up: [0, 1, 0] }), slatC());
  }
  const back = detail === 0 ? [[0.64, -0.215, 0.1], [0.8, -0.275, 0.1]] : [[0.72, -0.245, 0.22]];
  for (const [y, z, h] of back) {
    const x0 = -hw - 0.02 + rng.rangeF(0, 0.04), x1 = hw + 0.02 - rng.rangeF(0, 0.04);
    put(rod({ path: [[x0, y, z], [x1, y + rng.rangeF(-0.008, 0.008), z]], w: 0.04, h, detail, corner: 0, up: [0, 0.26, 0.97] }), slatC());
  }
  if (snowColor) {
    const snow = rod({ path: [[-hw + 0.07, sy + 0.03, 0.01], [0, sy + 0.045, 0.02], [hw - 0.1, sy + 0.028, 0]], w: 0.05, h: 0.3, detail: 1, capSegments: 0, capLength: 0.06, scales: (t) => [1, 0.8 + 0.25 * Math.sin(Math.PI * t)] });
    emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
  return { seatY: sy };
}

export const TIER = 'dressing';
const STYLES = [
  { width: 1.1, wood: '#d6a468', frame: '#9a6a44' },
  { width: 0.95, wood: '#7fb7d8', frame: '#f3e6cf' },
  { width: 1.45, wood: '#c9955f', frame: '#6b4a3a' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('bench');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), width: rng.rangeF(0.9, 1.4) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`bench-${seed}-${season}-lod${detail}`);
  bench(mesh, IDENTITY, { width: st.width, detail, rng, woodColor: hex(st.wood), frameColor: hex(st.frame), snowColor: season === 'winter' && detail < 2 ? hex(pal.snow[0]) : null });
  return mesh;
}
