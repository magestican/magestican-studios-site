















import { MeshData, IDENTITY, compose, scale, translate, rotateY } from '../../../mesh/meshData.mjs';
import { lathe, emit, sweep, circleProfile, blob } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { RIPPLE, surfaceRamp, fallRamp, jetRamp } from '../water.mjs';





const ribbonProfile = (w) => circleProfile(w, 3, 0, w * 0.28);







function dropBeads(mesh, at, { rng, key, waterColor, n = 4 }) {
  const r = rng.child(`beads-${key}`);
  for (let i = 0; i < n; i++) {
    const br = r.rangeF(0.006, 0.013);
    const off = [r.rangeF(-0.03, 0.03), r.rangeF(-0.04, 0.005), r.rangeF(-0.03, 0.03)];
    const bead = blob({ radii: [br, br, br], subdiv: 1, seed: r.rangeI(1, 1e6), lump: 0.08 });
    emit(mesh, 'water', bead, {
      matrix: compose(at, translate(off[0], off[1], off[2])),
      color: vc(waterColor, { groundAO: 0, underside: 0.15 }),
    });
  }
}


function arc(mesh, m, { a, r0, y0, r1, y1, w = 0.03, detail, waterColor, rng, beads = true, steps = null }) {
  const path = [];
  if (steps === null) steps = detail === 0 ? 4 : 3;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    path.push([r0 + (r1 - r0) * Math.sqrt(t), y0 - (y0 - y1) * t * t, 0]);
  }
  const ribbon = sweep({
    profile: ribbonProfile(w), path, up: [0, 1, 0], caps: 'none',
    
    scales: (t) => 1.35 - 0.7 * t,
  });
  
  
  
  const fall = fallRamp(ribbon.p.map((q) => q[1]));
  const at = compose(m, rotateY(a));
  emit(mesh, 'water', ribbon, {
    matrix: at,
    color: vc(waterColor, { groundAO: 0, underside: 0.15 }),
    ripple: (p, n, uv, tag, i) => -RIPPLE.flow * fall[i],
  });
  if (beads && detail === 0 && rng) {
    const tail = path[path.length - 1];
    dropBeads(mesh, compose(at, translate(tail[0], tail[1], tail[2])), { rng, waterColor });
  }
}





export function fountain(mesh, m, {
  radius = 0.95, kerb = 0.34, tiers = [], jet = 0, square = false, detail = 0, rng,
  stoneColor, waterColor, snowColor = null, frozen = false,
}) {
  const sides = square ? (detail === 0 ? 16 : detail === 1 ? 12 : 8) : detail === 0 ? 12 : detail === 1 ? 9 : 6;
  
  
  const squareR = (th) => 1 / (Math.abs(Math.cos(th)) ** 4 + Math.abs(Math.sin(th)) ** 4) ** 0.25;
  const R = radius, H = kerb;
  const wob = rng.rangeF(0, 6);
  
  
  
  
  
  const pool = H - 0.06;   
  const floorY = H - 0.16; 
  
  
  
  
  
  
  const pts = detail === 2
    ? [[0, 0], [R, 0], [R, H], [R * 0.86, H], [R * 0.82, floorY + 0.02], [0, floorY]]
    : detail === 1
      ? [[0, 0], [R * 0.92, 0], [R, H - 0.12], [R * 1.02, H], [R * 0.86, H - 0.02], [R * 0.82, pool], [R * 0.78, floorY + 0.03], [0, floorY]]
      : [[0, 0], [R * 0.9, 0], [R * 0.97, 0.06], [R, H - 0.12], [R * 0.99, H - 0.05], [R * 1.02, H],
        [R * 0.96, H - 0.02], [R * 0.84, H - 0.03], [R * 0.82, pool], [R * 0.78, floorY + 0.04], [R * 0.5, floorY + 0.01], [0, floorY]];
  const basin = lathe({
    points: pts, sides, phase: square ? 0.125 : rng.rangeF(0, 1), uvScale: 2.6,
    radiusFn: square
      ? (th, j, r) => r * squareR(th) * (1 + 0.01 * Math.sin(th * 3 + wob))
      : detail === 2 ? null : (th, j, r) => r * (1 + 0.012 * Math.sin(th * 4 + wob) + 0.006 * Math.sin(th * 9 + j)),
  });
  
  
  
  
  const wet = basin.p.map((p) => p[1] < pool && Math.hypot(p[0], p[2]) < R * 0.84);
  
  
  
  const floorRamp = surfaceRamp(basin.p.map((p) => Math.hypot(p[0], p[2])), R * 0.84);
  emit(mesh, 'stone', basin, {
    matrix: m,
    color: (p, n, uv, tag, i) => {
      if (wet[i]) return frozen ? mixC(waterColor, [1, 1, 1], 0.25) : waterColor;
      return paintVertex(stoneColor, p, n, { groundAO: 0.2, groundFade: 0.22, mottle: 0.08, seed: 5 });
    },
    ripple: frozen ? 0 : (p, n, uv, tag, i) => (wet[i] ? RIPPLE.pool * 0.33 * floorRamp[i] : 0),
  });

  if (detail === 2) return { r: R };

  
  
  
  
  
  
  
  
  
  const skinR = R * 0.822;
  const skin = lathe({
    points: [[skinR, pool], [skinR * 0.72, pool - 0.005], [skinR * 0.4, pool - 0.008], [0, pool - 0.009]],
    sides, phase: square ? 0.125 : rng.rangeF(0, 1),
    radiusFn: square ? (th, j, r) => r * squareR(th) : null,
  });
  const skinRamp = surfaceRamp(skin.p.map((p) => Math.hypot(p[0], p[2])), skinR);
  emit(mesh, 'water', skin, {
    matrix: m,
    color: vc(frozen ? mixC(waterColor, [1, 1, 1], 0.3) : waterColor, { groundAO: 0, underside: 0.15 }),
    ripple: frozen ? 0 : (p, n, uv, tag, i) => RIPPLE.pool * skinRamp[i],
  });

  
  let below = { y: pool, r: R * 0.8 };
  tiers.forEach((t, i) => {
    const stem = lathe({
      points: [[R * 0.28, floorY], [R * 0.16, (t.y + floorY) * 0.5], [R * 0.2, t.y - 0.14],
        [t.r, t.y - 0.035], [t.r * 1.03, t.y], [t.r * 0.5, t.y - 0.03], [0, t.y - 0.035]],
      sides: detail === 0 ? 9 : 6, phase: rng.rangeF(0, 1),
      radiusFn: (th, j, r) => r * (1 + 0.015 * Math.sin(th * 3 + wob + i)),
    });
    emit(mesh, 'stone', stem, { matrix: m, color: vc(vary(rng, stoneColor, 0.05), { groundAO: 0.25, underside: 0.45 }) });
    
    if (!frozen) {
      const n = detail === 0 ? 3 : 1;
      const base = rng.rangeF(0, Math.PI * 2);
      for (let k = 0; k < n; k++) {
        arc(mesh, m, {
          a: base + (k / n) * Math.PI * 2 + rng.rangeF(-0.3, 0.3),
          r0: t.r * 0.94, y0: t.y - 0.015, r1: below.r * rng.rangeF(0.45, 0.62), y1: below.y + 0.02,
          w: 0.036 - i * 0.005, detail, waterColor, rng, key: `tier${i}-${k}`,
          
          
          
          
          beads: i === 0 && k === 0,
        });
      }
    }
    below = { y: t.y, r: t.r };
  });

  
  
  
  
  if (jet > 0 && !frozen) {
    const top = tiers.length ? tiers[tiers.length - 1] : { y: pool, r: R * 0.5 };
    const lean = rng.rangeF(-0.06, 0.06);
    const plume = sweep({
      profile: circleProfile(0.032, detail === 0 ? 6 : 4),
      path: [[0, top.y, 0], [lean * 0.3, top.y + jet * 0.5, 0], [lean, top.y + jet, 0]],
      up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.04, scales: (t) => 1 - 0.45 * t,
    });
    
    
    const rise = jetRamp(plume.p.map((q) => q[1]));
    emit(mesh, 'water', plume, {
      matrix: m,
      color: vc(waterColor, { groundAO: 0, underside: 0.15 }),
      ripple: (p, n, uv, tag, i) => -RIPPLE.jet * rise[i],
    });
    
    
    
    if (detail === 0) {
      const cr = rng.child('jetCrown');
      const tipAt = compose(m, translate(lean, top.y + jet, 0));
      const crownN = cr.rangeI(4, 5);
      const crownBase = cr.rangeF(0, Math.PI * 2);
      for (let k = 0; k < crownN; k++) {
        arc(mesh, tipAt, {
          a: crownBase + (k / crownN) * Math.PI * 2 + cr.rangeF(-0.15, 0.15),
          r0: 0, y0: 0.01, r1: jet * cr.rangeF(0.12, 0.22), y1: -jet * cr.rangeF(0.04, 0.1),
          w: 0.016, detail, waterColor, rng: cr, key: `crown${k}`, beads: false, steps: 2,
        });
      }
    }
  }

  
  if (square) {
    const a = rng.rangeF(0, Math.PI * 2);
    const wall = lathe({
      points: [[R * 0.26, floorY], [R * 0.24, H + 0.36], [R * 0.27, H + 0.5], [R * 0.2, H + 0.66], [0, H + 0.7]],
      sides: detail === 0 ? 8 : 5, phase: 0.125, radiusFn: (th, j, r) => r * squareR(th),
    });
    emit(mesh, 'stone', wall, { matrix: compose(m, compose(translate(Math.sin(a) * R * 0.86, 0, Math.cos(a) * R * 0.86), rotateY(a))), color: vc(vary(rng, stoneColor, 0.04), { groundAO: 0.25 }) });
    if (!frozen) arc(mesh, m, { a: a + Math.PI, r0: R * 0.66, y0: H + 0.42, r1: R * 0.25, y1: pool + 0.02, w: 0.04, detail, waterColor, rng, key: 'spout' });
  }

  if (snowColor) {
    const cap = lathe({
      points: [[R * 1.0, H + 0.008], [R * 0.95, H + 0.05], [R * 0.86, H + 0.045], [R * 0.83, H]],
      sides, phase: square ? 0.125 : rng.rangeF(0, 1), radiusFn: square ? (th, j, r) => r * squareR(th) : null,
    });
    emit(mesh, 'snow', cap, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
  return { r: R };
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { radius: 0.92, kerb: 0.42, square: false, tiers: [{ y: 0.92, r: 0.42 }], jet: 0.22, stone: '#ded6c8', water: '#a9dcea' },
  { radius: 0.82, kerb: 0.38, square: true, tiers: [], jet: 0, stone: '#e3dccd', water: '#b2e2ec', wide: 1.25 },
  { radius: 0.88, kerb: 0.46, square: false, tiers: [{ y: 0.88, r: 0.44 }, { y: 1.42, r: 0.27 }], jet: 0.3, stone: '#d6d1dc', water: '#b8e6f2' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('fountain');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), radius: rng.rangeF(0.8, 1.0) };
  const pal = seasonPalette(season);
  const winter = season === 'winter';
  const mesh = new MeshData(`fountain-${seed}-${season}-lod${detail}`);
  
  const at = st.wide
    ? compose(IDENTITY, compose(rotateY(rng.rangeF(0, Math.PI * 2)), scale(st.wide, 1, 1 / st.wide)))
    : compose(IDENTITY, rotateY(rng.rangeF(0, Math.PI * 2)));
  fountain(mesh, at, {
    radius: st.radius, kerb: st.kerb, tiers: st.tiers, jet: st.jet, square: st.square, detail, rng,
    stoneColor: hex(st.stone), waterColor: hex(winter ? '#cfe4ea' : st.water),
    snowColor: winter && detail < 2 ? hex(pal.snow[0]) : null, frozen: winter,
  });
  return mesh;
}
