

























import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile, superellipseProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';


export function deckPath({ span, rise, rng, steps = 6 }) {
  const crown = rng.rangeF(0.42, 0.58);
  const bankA = rng.rangeF(0.0, 0.03), bankB = rng.rangeF(0.02, 0.06);
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    const u = t < crown ? t / crown : (1 - t) / (1 - crown);
    const y = (t < crown ? bankA : bankB) + rise * Math.sin(Math.PI * 0.5 * Math.min(1, u)) ** 1.4;
    path.push([(t - 0.5) * span, y, 0]);
  }
  return path;
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { span: 2.3, width: 0.86, rise: 0.3, rails: [0.5, 0.42], deck: '#c09a68', rail: '#a87e50', rope: null },
  { span: 1.7, width: 0.74, rise: 0.12, rails: [0.46, 0], deck: '#cdae7c', rail: '#9a7a52', rope: null },
  { span: 2.7, width: 0.8, rise: 0.42, rails: [0.36, 0.3], deck: '#b0884f', rail: '#8d6b45', rope: '#d9c496' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('bridge');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), rise: rng.rangeF(0.12, 0.42) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`bridge-${seed}-${season}-lod${detail}`);
  
  
  
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.04, 0.04)));
  const steps = detail === 0 ? 6 : detail === 1 ? 4 : 2;
  const path = deckPath({ span: st.span, rise: st.rise, rng, steps });
  const halfW = st.width / 2;
  const deckColor = hex(st.deck);
  const planks = detail === 0 ? 11 : 7;

  
  const deck = sweep({
    profile: roundedRectProfile(0.07, st.width, 0.028, detail === 0 ? 2 : 0),
    path, up: [0, 1, 0], caps: 'round', capSegments: detail === 0 ? 2 : 1, capLength: 0.05,
    scales: (t) => 1 - 0.05 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
  });
  emit(mesh, 'plank', deck, {
    matrix: m,
    
    
    color: (p, n) => {
      const across = (p[2] / st.width + 0.5) * planks;
      const seam = Math.abs(across - Math.round(across));
      const base = paintVertex(deckColor, p, n, { groundAO: 0.24, groundFade: 0.4, mottle: 0.06, seed: 31 });
      return mixC(base, [base[0] * 0.62, base[1] * 0.6, base[2] * 0.62], Math.max(0, 1 - seam * 7));
    },
  });

  if (detail === 2) return mesh;

  
  const railColor = hex(st.rail);
  st.rails.forEach((h, i) => {
    if (h <= 0) return;
    const side = i === 0 ? 1 : -1;
    const trim = i === 0 ? rng.rangeF(0.0, 0.04) : rng.rangeF(0.06, 0.14);
    const rail = path
      .filter((_, k) => k / steps >= trim && k / steps <= 1 - trim * 0.5)
      .map((p) => [p[0], p[1] + h, side * (halfW - 0.05)]);
    if (rail.length < 2) return;
    emit(mesh, 'wood', rod({
      path: rail, w: 0.055, h: 0.045, detail: detail === 0 ? 0 : 1, up: [0, 1, 0], caps: 'round', capLength: 0.03,
    }), { matrix: m, color: vc(vary(rng, railColor, 0.06), { groundAO: 0.2, underside: 0.4 }) });
    
    const n = detail === 0 ? (i === 0 ? 4 : 3) : 2;
    for (let k = 0; k < n; k++) {
      const t = (k + rng.rangeF(0.25, 0.75)) / n;
      const idx = Math.min(path.length - 1, Math.max(0, Math.round(t * steps)));
      const p = path[idx];
      emit(mesh, 'wood', rod({
        path: [[p[0], p[1] + 0.01, side * (halfW - 0.05)], [p[0] + rng.rangeF(-0.015, 0.015), p[1] + h, side * (halfW - 0.05)]],
        w: 0.042, h: 0.036, detail: 1, up: [0, 0, 1], caps: 'none',
      }), { matrix: m, color: vc(vary(rng, railColor, 0.05), { groundAO: 0.1, underside: 0.4 }) });
    }
  });

  
  if (st.rope && detail === 0) {
    const sag = path.map((p, k) => [p[0], p[1] + 0.52 - 0.06 * Math.sin(Math.PI * (k / steps)), -(halfW - 0.04)]);
    emit(mesh, 'cloth', rod({ path: sag, w: 0.022, detail: 1, up: [0, 1, 0], caps: 'none' }),
      { matrix: m, color: vc(hex(st.rope), { groundAO: 0, underside: 0.3 }) });
  }

  if (season === 'winter') {
    emit(mesh, 'snow', sweep({
      profile: superellipseProfile(0.022, halfW * 0.82, 3, detail === 0 ? 8 : 6),
      path: path.map((p) => [p[0] * 0.96, p[1] + 0.045, p[2]]),
      up: [0, 1, 0], caps: 'none',
      
      scales: (t) => 1.0 - 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: m, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
