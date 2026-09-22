























import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ, rotateX } from '../../../mesh/meshData.mjs';
import { emit, lathe, sweep, superellipseProfile, roundedRectProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';


export function tower(mesh, m, { radius = 0.42, height = 1.6, capRise = 0.34, detail = 0, rng, wallColor, capColor }) {
  const R = radius, H = height;
  const sides = detail === 0 ? 12 : detail === 1 ? 9 : 6;
  const wob = rng.rangeF(0, 6);
  const pts = detail === 2
    ? [[0, 0], [R * 1.08, 0], [R * 0.7, H], [R * 0.44, H + capRise * 0.6], [0, H + capRise]]
    : [[0, 0], [R * 1.14, -0.01], [R * 1.08, 0.05], [R * 0.96, H * 0.34], [R * 0.84, H * 0.7],
      [R * 0.76, H * 0.95], [R * 0.74, H], [R * 0.9, H + capRise * 0.1], [R * 0.86, H + capRise * 0.2],
      [R * 0.66, H + capRise * 0.58], [R * 0.36, H + capRise * 0.88], [0, H + capRise]];
  const shape = lathe({
    points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 2.2,
    radiusFn: detail === 2 ? null : (th, j, r) => r * (1 + 0.015 * Math.sin(th * 7 + wob) + 0.007 * Math.sin(th * 13 + j)),
  });
  const capFrom = H + capRise * 0.1;
  emit(mesh, 'plank', shape, {
    matrix: m,
    
    
    color: (p, n) => {
      const isCap = p[1] > capFrom - 0.02;
      const base = paintVertex(isCap ? capColor : wallColor, p, n, { groundAO: isCap ? 0.05 : 0.34, groundFade: 0.45, mottle: 0.07, seed: 29 });
      const eave = Math.max(0, 1 - Math.abs(p[1] - capFrom) * 14);
      return [base[0] * (1 - 0.3 * eave), base[1] * (1 - 0.3 * eave), base[2] * (1 - 0.28 * eave)];
    },
  });
  return H + capRise * 0.34;
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { radius: 0.4, height: 1.62, capRise: 0.34, sails: 4, sail: 0.62, wall: '#f0e5cf', cap: '#b4705a', trim: '#9a7a52', gallery: false },
  { radius: 0.5, height: 1.24, capRise: 0.3, sails: 3, sail: 0.7, wall: '#e2d3b4', cap: '#7f6a5c', trim: '#8d6b45', gallery: false },
  { radius: 0.34, height: 1.92, capRise: 0.38, sails: 4, sail: 0.54, wall: '#c8c2b6', cap: '#7f8fb0', trim: '#a08b6c', gallery: true },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('windmill');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(1.24, 1.92) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`windmill-${seed}-${season}-lod${detail}`);
  const m = compose(IDENTITY, rotateY(rng.rangeF(0, Math.PI * 2)));
  const shaftY = tower(mesh, m, {
    radius: st.radius, height: st.height, capRise: st.capRise, detail, rng,
    wallColor: hex(st.wall), capColor: hex(st.cap),
  });

  if (detail === 2) return mesh;

  const trim = hex(st.trim);
  
  const face = rng.rangeF(0, Math.PI * 2);
  const tilt = rng.rangeF(0.05, 0.13);
  const hubZ = st.radius * 0.92;
  const hub = compose(m, compose(rotateY(face), compose(translate(0, shaftY, hubZ), rotateX(-tilt))));
  emit(mesh, 'wood', rod({
    path: [[0, 0, -st.radius * 0.5], [0, 0, 0.06]], w: 0.075, detail: detail === 0 ? 0 : 1, up: [0, 1, 0], caps: 'round', capLength: 0.03,
  }), { matrix: hub, color: vc(vary(rng, trim, 0.05), { groundAO: 0.05, underside: 0.45 }) });

  
  const n = detail === 0 ? st.sails : Math.max(2, st.sails - 1);
  const runt = rng.rangeI(0, n - 1);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.rangeF(-0.16, 0.16);
    const len = st.sail * (i === runt ? rng.rangeF(0.62, 0.74) : rng.rangeF(0.94, 1.06));
    const pitch = rng.rangeF(0.12, 0.26) * (rng.chance(0.5) ? 1 : -1);
    const at = compose(hub, compose(rotateZ(a), rotateY(pitch)));
    
    emit(mesh, 'wood', rod({
      path: [[0.05, 0, 0.02], [len * 0.55, 0, 0.02], [len, 0, 0.02]],
      w: 0.045, h: 0.03, detail: detail === 0 ? 1 : 2, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.02,
      scales: (t) => 1 - 0.3 * t,
    }), { matrix: at, color: vc(vary(rng, trim, 0.06), { groundAO: 0, underside: 0.45 }) });
    
    emit(mesh, 'canvas', sweep({
      profile: roundedRectProfile(len * 0.24, 0.012, 0.01, 0),
      path: [[len * 0.26, 0, -0.012], [len * 0.62, 0, -0.016], [len * 0.97, 0, -0.012]],
      up: [0, 0, 1], caps: 'none',
      scales: (t) => 0.72 + 0.4 * t,
    }), { matrix: at, color: vc(vary(rng, hex(st.cap), 0.07), { groundAO: 0, underside: 0.6 }) });
  }

  
  if (st.gallery && detail === 0) {
    const y = st.height * 0.52;
    const ring = [];
    for (let k = 0; k <= 12; k++) {
      const th = (k / 12) * Math.PI * 2;
      ring.push([Math.sin(th) * st.radius * 0.95, y + 0.008 * Math.sin(th * 3), Math.cos(th) * st.radius * 0.95]);
    }
    emit(mesh, 'wood', sweep({
      profile: roundedRectProfile(0.05, 0.06, 0.02, 0), path: ring, closed: true, up: [0, 1, 0], caps: 'none',
    }), { matrix: m, color: vc(vary(rng, trim, 0.05), { groundAO: 0.2, underside: 0.45 }) });
  }

  
  if (detail === 0) {
    const da = rng.rangeF(0, Math.PI * 2);
    emit(mesh, 'plank', sweep({
      profile: superellipseProfile(0.16, 0.085, 2.6, 8),
      path: [[0, 0, 0], [0, 0, 0.03]], up: [0, 1, 0], caps: ['none', 'round'], capLength: 0.015,
    }), {
      matrix: compose(m, compose(rotateY(da), translate(0, 0.19, st.radius * 0.99))),
      color: vc(vary(rng, hex(st.trim), 0.05), { groundAO: 0.35, underside: 0.4 }),
    });
  }

  if (season === 'winter') {
    
    
    const lee = rng.rangeF(0, Math.PI * 2);
    const capTop = st.height + st.capRise;
    emit(mesh, 'snow', lathe({
      points: [[st.radius * 0.6, capTop - st.capRise * 0.44], [st.radius * 0.46, capTop - st.capRise * 0.2], [st.radius * 0.2, capTop - 0.01], [0, capTop + 0.02]],
      sides: detail === 0 ? 10 : 7, phase: rng.rangeF(0, 1),
      radiusFn: (th, j, r) => r * (1 - 0.34 * Math.max(0, Math.cos(th - lee))),
    }), { matrix: m, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
