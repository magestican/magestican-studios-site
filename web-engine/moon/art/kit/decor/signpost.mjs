












import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, blob, sweep, roundedRectProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary } from '../shade.mjs';
import { rod } from '../rod.mjs';


export function signBoard(mesh, m, { y, bearing, length = 0.62, height = 0.2, thickness = 0.05, detail = 0, rng, boardColor, inkColor, snowColor = null }) {
  const at = compose(m, compose(translate(0, y, 0), rotateY(bearing)));
  const x0 = 0.03, x1 = length;
  
  const shape = sweep({
    
    
    profile: roundedRectProfile(thickness, height, 0.03, detail === 0 ? 1 : 0),
    path: [[x0, 0, 0], [x1 * 0.62, rng.rangeF(-0.004, 0.004), 0], [x1 * 0.84, 0, 0], [x1, 0, 0]],
    up: [0, 1, 0], caps: 'none', scales: (t, i) => [1, 1, 0.92, 0.12][i],
  });
  emit(mesh, 'plank', shape, { matrix: at, color: vc(vary(rng, boardColor, 0.05), { groundAO: 0.1, underside: 0.4 }) });
  
  if (detail === 0) {
    const n = rng.rangeI(3, 5);
    for (let i = 0; i < n; i++) {
      const dot = blob({ radii: [0.022, 0.018, 0.01], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.2 });
      emit(mesh, 'paper', dot, { matrix: compose(at, translate(x0 + 0.1 + i * 0.085, rng.rangeF(-0.014, 0.014), thickness * 0.55)), color: vc(inkColor, { groundAO: 0, underside: 0.2 }) });
    }
  }
  if (snowColor && detail < 2) {
    const snow = sweep({
      profile: roundedRectProfile(0.03, 0.02, 0.008, 0), path: [[x0, height / 2 + 0.012, 0], [x1 * 0.86, height / 2 + 0.016, 0]],
      up: [0, 1, 0], caps: 'none', scales: (t) => [1, 0.8 + 0.3 * Math.sin(Math.PI * t)],
    });
    emit(mesh, 'snow', snow, { matrix: at, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { kind: 'arm', height: 1.5, arms: [{ f: 0.84, len: 0.66, h: 0.21 }], post: '#a5764c', board: '#f3e3c6', ink: '#5b4736' },
  { kind: 'arm', height: 1.72, arms: [{ f: 0.88, len: 0.6, h: 0.19 }, { f: 0.64, len: 0.7, h: 0.23 }], post: '#8f6a48', board: '#cfe0d0', ink: '#41564a' },
  { kind: 'board', height: 1.15, arms: [{ f: 0.74, len: 0.8, h: 0.52 }], post: '#b9895a', board: '#f6ecd8', ink: '#6a4f3a' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('signpost');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(1.1, 1.7) };
  const pal = seasonPalette(season);
  const snow = season === 'winter' && detail < 2 ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`signpost-${seed}-${season}-lod${detail}`);
  const H = st.height;
  const postColor = hex(st.post);
  const lean = rng.rangeF(-0.05, 0.05);

  if (st.kind === 'board') {
    
    for (const s of [-1, 1]) {
      const x = s * 0.2 + rng.rangeF(-0.02, 0.02);
      emit(mesh, 'wood', rod({
        path: [[x, -0.02, s * 0.03], [x * 0.55 + lean * 0.4, H * 0.82, -0.06 + rng.rangeF(-0.02, 0.02)]],
        w: 0.07, h: 0.07, detail: detail === 0 ? 0 : 1, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.03,
      }), { matrix: IDENTITY, color: vc(vary(rng, postColor, 0.05), { groundAO: 0.4 }) });
    }
    const a = st.arms[0];
    const tip = compose(IDENTITY, compose(translate(0, H * a.f, 0.02), rotateZ(rng.rangeF(-0.04, 0.04))));
    signBoard(mesh, compose(tip, compose(rotateY(-Math.PI / 2), translate(-a.len / 2, 0, 0))), {
      y: 0, bearing: 0, length: a.len, height: a.h, thickness: 0.06, detail, rng, boardColor: hex(st.board), inkColor: hex(st.ink), snowColor: snow,
    });
    return mesh;
  }

  
  emit(mesh, 'wood', rod({
    path: [[0, -0.02, 0], [lean * 0.4, H * 0.55, lean * 0.2], [lean, H, lean * 0.5]],
    w: 0.1, h: 0.1, detail: detail === 0 ? 0 : 1, up: [0, 0, 1],
    caps: ['none', 'round'], capSegments: detail === 0 ? 2 : 1, capLength: 0.05,
    scales: (t) => 1 - 0.18 * t,
  }), { matrix: IDENTITY, color: vc(vary(rng, postColor, 0.05), { groundAO: 0.4, groundFade: 0.5 }) });

  const base = rng.rangeF(0, Math.PI * 2);
  st.arms.forEach((a, i) => {
    if (detail === 2 && i > 0) return; 
    signBoard(mesh, IDENTITY, {
      y: H * a.f, bearing: base + i * (Math.PI * 0.82) + rng.rangeF(-0.15, 0.15),
      length: a.len, height: a.h, detail, rng, boardColor: hex(st.board), inkColor: hex(st.ink), snowColor: snow,
    });
  });
  if (snow) {
    const cap = blob({ radii: [0.06, 0.03, 0.06], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.25 });
    emit(mesh, 'snow', cap, { matrix: translate(lean, H + 0.03, lean * 0.5), color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
