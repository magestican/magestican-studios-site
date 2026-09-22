


























import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile, superellipseProfile, blob } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';






export function awning(mesh, m, {
  width = 1.5, depth = 0.9, eave = 1.5, rise = 0.34, ridge = 0.42, overhang = 0.1,
  detail = 0, rng, cloth, stripe, stripes = 7,
}) {
  const zFront = depth * ridge, zBack = -depth * (1 - ridge);
  const sagF = rng.rangeF(0.04, 0.08), sagB = rng.rangeF(0.03, 0.07);
  const path = detail === 0
    ? [[0, eave, zFront + overhang], [0, eave + rise * 0.5 - sagF, zFront * 0.5], [0, eave + rise, 0],
      [0, eave + rise * 0.55 - sagB, zBack * 0.5], [0, eave + 0.02, zBack - overhang * 0.7]]
    : [[0, eave, zFront + overhang], [0, eave + rise, 0], [0, eave + 0.02, zBack - overhang * 0.7]];
  
  const endA = rng.rangeF(1.0, 1.06), endB = rng.rangeF(1.06, 1.14);
  const shape = sweep({
    profile: roundedRectProfile(0.018, width, 0.009, 0),
    path, up: [0, 1, 0], caps: 'none',
    scales: (t) => (t < 0.5 ? endA : endB),
  });
  emit(mesh, 'canvas', shape, {
    matrix: m,
    
    
    color: (p, n) => {
      const band = Math.floor(((p[0] / width) + 0.5) * stripes);
      const base = band % 2 === 0 ? cloth : stripe;
      return paintVertex(base, p, n, { groundAO: 0, groundFade: 0.2, underside: 0.55, mottle: 0.04, seed: 41 });
    },
  });
  return { zFront: zFront + overhang, zBack: zBack - overhang * 0.7, top: eave + rise };
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { width: 1.44, depth: 0.86, eave: 1.5, rise: 0.34, ridge: 0.42, counter: 0.86, valance: true, shelf: false, stripes: 7, cloth: '#f4ece0', stripe: '#d1786a', wood: '#b58a58', goods: '#e0894a' },
  { width: 1.8, depth: 0.96, eave: 1.38, rise: 0.22, ridge: 0.46, counter: 0.8, valance: false, shelf: false, stripes: 9, cloth: '#eef0e2', stripe: '#7fa88c', wood: '#c09a68', goods: '#c2506a' },
  { width: 1.18, depth: 0.78, eave: 1.62, rise: 0.46, ridge: 0.38, counter: 0.9, valance: true, shelf: true, stripes: 5, cloth: '#f6e6c8', stripe: '#6f86b2', wood: '#9a7a52', goods: '#e8c45a' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('marketStall');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), eave: rng.rangeF(1.38, 1.62) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`marketStall-${seed}-${season}-lod${detail}`);
  
  
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.05, 0.05)));
  const woodColor = hex(st.wood);
  const halfW = st.width / 2, halfD = st.depth / 2;

  
  
  const short = rng.rangeI(0, 3);
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const postTops = corners.map(([sx, sz], i) => {
    const h = st.eave * (i === short ? rng.rangeF(0.93, 0.96) : rng.rangeF(0.99, 1.01));
    const lx = rng.rangeF(-0.03, 0.03), lz = rng.rangeF(-0.03, 0.03);
    const x = sx * (halfW - 0.08), z = sz * (halfD - 0.06);
    
    
    
    
    
    
    
    const spine = detail === 2
      ? [[x, -0.03, z], [x + lx * 1.4, h, z + lz * 1.4]]
      : [[x, -0.03, z], [x + lx, h * 0.6, z + lz], [x + lx * 1.4, h, z + lz * 1.4]];
    emit(mesh, 'wood', rod({
      path: spine,
      w: 0.06, h: 0.055, detail: detail === 0 ? 0 : detail === 1 ? 1 : 2, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.025,
      scales: (t) => 1 - 0.1 * t,
    }), { matrix: m, color: (p, n) => paintVertex(woodColor, p, n, { groundAO: 0.42, groundFade: 0.5, mottle: 0.07, seed: 37 }) });
    return [x + lx * 1.4, h, z + lz * 1.4];
  });

  
  const cy = st.counter;
  const bow = rng.rangeF(0.02, 0.05);
  emit(mesh, 'plank', sweep({
    profile: roundedRectProfile(0.05, st.depth * 0.76, 0.02, detail === 0 ? 1 : 0),
    path: [[-halfW * 0.96, cy, 0], [0, cy + 0.006, bow], [halfW * 0.96, cy - 0.004, 0]],
    up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.03,
  }), { matrix: m, color: (p, n) => paintVertex(vary(rng, woodColor, 0.05), p, n, { groundAO: 0.18, groundFade: 0.3, mottle: 0.06, seed: 43 }) });

  if (st.shelf && detail === 0) {
    emit(mesh, 'plank', sweep({
      profile: roundedRectProfile(0.035, st.depth * 0.5, 0.015, 0),
      path: [[-halfW * 0.8, cy * 0.44, -0.04], [halfW * 0.8, cy * 0.44 + 0.006, -0.03]],
      up: [0, 1, 0], caps: 'none',
    }), { matrix: m, color: vc(vary(rng, woodColor, 0.06), { groundAO: 0.3, underside: 0.45 }) });
  }

  
  
  {
    const a = awning(mesh, m, {
      width: st.width, depth: st.depth, eave: Math.min(...postTops.map((p) => p[1])) + 0.02,
      rise: st.rise, ridge: st.ridge, overhang: 0.1, detail, rng,
      cloth: hex(st.cloth), stripe: hex(st.stripe), stripes: st.stripes,
    });
    
    if (st.valance && detail === 0) {
      const scallops = 6;
      emit(mesh, 'canvas', sweep({
        profile: superellipseProfile(0.07, 0.014, 2.4, 6),
        path: [[-halfW, 0, 0], [0, -0.01, 0.004], [halfW, 0, 0]],
        up: [0, 1, 0], caps: 'none',
        scales: (t) => 0.8 + 0.3 * Math.abs(Math.sin(t * Math.PI * scallops)),
      }), {
        matrix: compose(m, translate(0, a.top - st.rise - 0.05, a.zFront)),
        color: vc(vary(rng, hex(st.stripe), 0.05), { groundAO: 0, underside: 0.55 }),
      });
    }
    
    if (detail === 0) {
      const side = rng.chance(0.5) ? 1 : -1;
      const n = rng.rangeI(4, 6);
      for (let i = 0; i < n; i++) {
        const g = blob({ radii: [0.058, 0.05, 0.055], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.26 });
        emit(mesh, 'fruit', g, {
          matrix: compose(m, translate(side * halfW * rng.rangeF(0.2, 0.74), cy + 0.06, rng.rangeF(-0.1, 0.16))),
          color: vc(vary(rng, hex(st.goods), 0.09), { groundAO: 0.1, underside: 0.35 }),
        });
      }
    }
    if (season === 'winter' && detail < 2) {
      
      
      emit(mesh, 'snow', sweep({
        profile: superellipseProfile(0.02, st.width * 0.44, 3, detail === 0 ? 8 : 6),
        path: [[0, a.top - st.rise * 0.52, a.zFront * 0.62], [0, a.top + 0.025, 0], [0, a.top - st.rise * 0.5, a.zBack * 0.62]],
        up: [0, 1, 0], caps: 'none',
        scales: (t) => 1.0 - 0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
      }), { matrix: m, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
    }
  }
  return mesh;
}
