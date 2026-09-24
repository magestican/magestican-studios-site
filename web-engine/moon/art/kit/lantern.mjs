










import { MeshData, IDENTITY, compose, translate } from '../../mesh/meshData.mjs';
import { sweep, lathe, emit, superellipseProfile } from '../../mesh/bevel.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { seasonPalette } from '../../palette/seasons.mjs';
import { hex, vc, scaleC } from './shade.mjs';



export function lanternHead(mesh, at, { k = 1, detail = 0, ironColor, glowColor, capColor, snowColor = null }) {
  const sides = detail === 0 ? 6 : detail === 1 ? 5 : 4;
  const K = (pts) => pts.map(([r, y]) => [r * k, y * k]);
  emit(mesh, 'metal', lathe({ points: K(detail === 2 ? [[0.06, -0.02], [0.08, 0.03], [0, 0.05]] : [[0.042, -0.04], [0.08, 0.012], [0.056, 0.05], [0, 0.056]]), sides }), { matrix: at, color: vc(ironColor, { groundAO: 0 }) });
  const facet = (th) => 1 - 0.1 * Math.abs(Math.cos(th * 2));
  const glassPts = K(detail === 0 ? [[0.05, 0.05], [0.08, 0.1], [0.09, 0.17], [0.075, 0.23], [0.05, 0.26]] : [[0.05, 0.05], [0.09, 0.15], [0.05, 0.26]]);
  emit(mesh, 'lamp-glow', lathe({ points: glassPts, sides, phase: Math.PI / sides, radiusFn: detail === 0 ? (th, j, r) => r * facet(th) : null }), { matrix: at, color: glowColor });
  const hatPts = K(detail === 2 ? [[0, 0.23], [0.13, 0.25], [0, 0.36]]
    : detail === 1 ? [[0, 0.235], [0.13, 0.25], [0.07, 0.31], [0.025, 0.36], [0, 0.39]]
      : [[0, 0.235], [0.125, 0.245], [0.13, 0.265], [0.075, 0.31], [0.022, 0.35], [0.032, 0.372], [0, 0.39]]);
  emit(mesh, 'metal', lathe({ points: hatPts, sides }), { matrix: at, color: vc(capColor, { groundAO: 0, underside: 0.45 }) });
  if (snowColor && detail < 2) {
    emit(mesh, 'snow', lathe({ points: K([[0.138, 0.262], [0.112, 0.298], [0.056, 0.338], [0.03, 0.37], [0, 0.382]]), sides }), { matrix: at, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export function postLantern(mesh, m, { height = 1.35, scale = 1, detail = 0, rng, postColor, ironColor, glowColor, capColor, snowColor = null }) {
  const sides = detail === 0 ? 7 : detail === 1 ? 5 : 4;
  const lx = rng.rangeF(-0.035, 0.035), lz = rng.rangeF(-0.025, 0.025);
  const k = scale;
  const postTop = height - 0.36 * k;
  const n = detail === 0 ? 4 : 2;
  const path = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); path.push([lx * t * t, -0.03 + t * (postTop + 0.03), lz * t * t]); }
  const post = sweep({ profile: superellipseProfile(0.05 * k, 0.05 * k * rng.rangeF(0.9, 1.05), 3, sides), path, up: [0, 0, 1], caps: 'none', scales: (t) => 1.5 - 0.95 * t + 0.4 * t * t });
  emit(mesh, 'wood', post, { matrix: m, color: vc(postColor, { groundAO: 0.3 }) });
  lanternHead(mesh, compose(m, translate(lx, postTop, lz)), { k, detail, ironColor, glowColor, capColor, snowColor });
  return { top: postTop + 0.39 * k, glow: [lx, postTop + 0.15 * k, lz] };
}



export function wallLantern(mesh, m, { reach = 0.34, detail = 0, rng, ironColor, glowColor, capColor, snowColor = null }) {
  const n = detail === 0 ? 4 : 2;
  const arm = [];
  for (let i = 0; i <= n; i++) { const t = i / n; arm.push([0, 0.06 * Math.sin(Math.PI * t) - 0.02 * t, t * reach]); }
  const droop = rng.rangeF(-0.015, 0.015);
  emit(mesh, 'metal', sweep({ profile: superellipseProfile(0.014, 0.02, 3, 4, 0), path: arm, up: [0, 1, 0], caps: ['none', 'round'], capSegments: 0, capLength: 0.015 }), { matrix: m, color: vc(ironColor, { groundAO: 0 }) });
  const k = 0.9;
  const at = compose(m, translate(droop, -0.02 - 0.39 * k - 0.05, reach));
  if (detail < 2) emit(mesh, 'metal', sweep({ profile: superellipseProfile(0.008, 0.008, 2, 3, 0), path: [[0, 0, 0], [droop, -0.07, 0]], up: [0, 0, 1], caps: 'none' }), { matrix: compose(m, translate(0, -0.015, reach)), color: vc(ironColor, { groundAO: 0 }) });
  mesh.swayPiece({ perMetre: 0.1, hang: true }, (piece) => lanternHead(piece, at, { k, detail, ironColor, glowColor, capColor, snowColor })); 
}

export const TIER = 'dressing';
const STYLES = [
  { height: 1.35, scale: 1, post: '#9a6a44', iron: '#4a4658', cap: '#3f6f5e' },
  { height: 2.3, scale: 1.25, post: '#6b5a7a', iron: '#3d3a52', cap: '#4a4658' },
  { height: 0.78, scale: 0.85, post: '#c9955f', iron: '#5a4a40', cap: '#c95a42' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('postLantern');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(1.0, 2.0) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`postLantern-${seed}-${season}-lod${detail}`);
  postLantern(mesh, IDENTITY, {
    height: st.height, scale: st.scale, detail, rng, postColor: hex(st.post), ironColor: hex(st.iron), glowColor: hex('#ffd38a'),
    capColor: scaleC(hex(st.cap), 1), snowColor: season === 'winter' ? hex(pal.snow[0]) : null,
  });
  return mesh;
}
