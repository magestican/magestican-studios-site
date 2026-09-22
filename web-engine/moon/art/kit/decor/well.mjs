













import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { lathe, emit, blob } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { RIPPLE, surfaceRamp } from '../water.mjs';
import { rod } from '../rod.mjs';






export function well(mesh, m, {
  radius = 0.52, wall = 0.62, frame = 1.35, roof = null, detail = 0, rng,
  stoneColor, woodColor, roofColor, ropeColor, waterColor, snowColor = null, coins = false, frozen = false,
}) {
  const sides = detail === 0 ? 12 : detail === 1 ? 9 : 6;
  const R = radius, H = wall;
  const wob = rng.rangeF(0, 6);
  
  const pts = detail === 2
    ? [[0, 0], [R, 0], [R, H], [R * 0.78, H], [0, H - 0.06]]
    : [[0, 0], [R * 0.99, 0], [R * 0.95, H * 0.3], [R * 0.99, H * 0.34], [R * 0.94, H * 0.62], [R * 0.99, H * 0.66],
      [R * 0.96, H - 0.09], [R * 1.06, H - 0.06], [R * 1.06, H], [R * 0.93, H + 0.012],
      [R * 0.78, H - 0.005], [R * 0.74, H - 0.16], [0, H - 0.2]];
  
  const drum = lathe({
    points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 2.4,
    radiusFn: detail === 2 ? null : (th, j, r) => r * (1 + 0.016 * Math.sin(th * 5 + wob + j) + 0.008 * Math.sin(th * 11 + j * 2)),
  });
  const deep = drum.p.map((p) => p[1] < H - 0.12 && Math.hypot(p[0], p[2]) < R * 0.8);
  
  
  
  
  const ramp = surfaceRamp(drum.p.map((p) => Math.hypot(p[0], p[2])), R * 0.8);
  emit(mesh, 'stone', drum, {
    matrix: m,
    color: (p, n, nn, tag, i) => {
      const c = paintVertex(stoneColor, p, n, { groundAO: 0.34, groundFade: 0.3, mottle: 0.09, seed: 7 });
      return deep[i] ? mixC(c, waterColor, snowColor ? 0.55 : 0.9) : c;
    },
    ripple: frozen ? 0 : (p, n, nn, tag, i) => (deep[i] ? RIPPLE.basin * ramp[i] : 0),
  });

  
  
  
  
  
  
  
  
  
  
  
  if (!frozen) {
    const wellSkinR = R * 0.78;
    const wellSkin = lathe({
      points: [[wellSkinR, H - 0.13], [wellSkinR * 0.6, H - 0.135], [0, H - 0.14]],
      sides, phase: rng.child('water').rangeF(0, 1),
    });
    const wellSkinRamp = surfaceRamp(wellSkin.p.map((p) => Math.hypot(p[0], p[2])), wellSkinR);
    emit(mesh, 'water', wellSkin, {
      matrix: m,
      color: vc(waterColor, { groundAO: 0, underside: 0.15 }),
      ripple: (p, n, nn, tag, i) => RIPPLE.basin * wellSkinRamp[i],
    });
  }

  if (detail === 2) return { top: H };

  
  const axis = rng.rangeF(0, Math.PI * 2);
  const ux = Math.sin(axis) * R * 0.86, uz = Math.cos(axis) * R * 0.86;
  const lean = [rng.rangeF(-0.04, 0.02), rng.rangeF(-0.02, 0.05)];
  [1, -1].forEach((s, i) => {
    emit(mesh, 'wood', rod({
      path: [[s * ux, H - 0.1, s * uz], [s * ux * (1 + lean[i]), frame, s * uz * (1 + lean[i])]],
      w: 0.075, h: 0.07, detail: detail === 0 ? 0 : 1, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.03,
    }), { matrix: m, color: vc(vary(rng, woodColor, 0.06), { groundAO: 0.4 }) });
  });
  const barrelY = frame - 0.12;
  const across = compose(m, rotateY(axis));
  emit(mesh, 'wood', rod({
    path: [[0, barrelY, -R * 0.95], [0, barrelY, R * 0.95]],
    w: 0.1, h: 0.1, detail: detail === 0 ? 0 : 1, up: [0, 1, 0], caps: 'round', capLength: 0.035,
    scales: (t) => 1 - 0.12 * Math.abs(t - 0.5),
  }), { matrix: across, color: vc(vary(rng, woodColor, 0.05), { groundAO: 0.25, underside: 0.4 }) });
  
  if (detail === 0) {
    emit(mesh, 'metal', rod({
      path: [[0, barrelY, R * 1.0], [0, barrelY, R * 1.12], [0.13, barrelY - 0.02, R * 1.12], [0.13, barrelY - 0.02, R * 1.2]],
      w: 0.035, detail: 1, up: [0, 1, 0], caps: 'round', capLength: 0.02,
    }), { matrix: across, color: vc(hex('#6c6874'), { groundAO: 0.2, underside: 0.4 }) });
  }

  
  const hang = rng.rangeF(-0.3, 0.3);
  const onCoping = roof === null;
  const bx = onCoping ? Math.sin(axis + 1.9) * R * 0.86 : hang * R * 0.5;
  const bz = onCoping ? Math.cos(axis + 1.9) * R * 0.86 : 0;
  const by = onCoping ? H + 0.02 : H + 0.22;
  const bucket = lathe({
    points: [[0, 0], [0.09, 0], [0.105, 0.05], [0.115, 0.16], [0.12, 0.19], [0.1, 0.2], [0.095, 0.05], [0, 0.03]],
    sides: detail === 0 ? 7 : 5, phase: rng.rangeF(0, 1),
  });
  const bucketAt = compose(m, compose(translate(bx, by, bz), rotateY(rng.rangeF(0, 6))));
  emit(mesh, 'wood', bucket, { matrix: bucketAt, color: vc(vary(rng, woodColor, 0.08), { groundAO: 0.2, underside: 0.4 }) });
  if (!onCoping) {
    emit(mesh, 'cloth', rod({
      path: [[bx, by + 0.2, bz], [bx + hang * 0.04, barrelY - 0.05, bz]], w: 0.018, detail: 1, up: [0, 1, 0], caps: 'none',
    }), { matrix: m, color: vc(ropeColor, { groundAO: 0, underside: 0.3 }) });
  }

  
  if (roof) {
    const ridge = frame + roof.height;
    const eave = frame + roof.height * 0.42;
    for (const s of [-1, 1]) {
      const span = roof.span * (1 + (s > 0 ? 0.05 : -0.04));
      emit(mesh, 'roof', rod({
        path: [[0, ridge, 0], [s * span * 0.5, (ridge + eave) / 2 + 0.02, 0], [s * span, eave, 0]],
        w: 0.05, h: R * 2.1, detail: detail === 0 ? 0 : 1, corner: 0, up: [0, 1, 0], caps: 'none',
      }), { matrix: across, color: vc(vary(rng, roofColor, 0.05), { groundAO: 0.1, underside: 0.5 }) });
    }
    if (snowColor) {
      for (const s of [-1, 1]) {
        emit(mesh, 'snow', rod({
          path: [[0, ridge + 0.05, 0], [s * roof.span * 0.9, eave + 0.05, 0]], w: 0.035, h: R * 1.9, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none',
        }), { matrix: across, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
      }
    }
  } else if (snowColor) {
    emit(mesh, 'snow', lathe({ points: [[R * 1.04, H + 0.014], [R * 0.99, H + 0.05], [R * 0.82, H + 0.045], [R * 0.79, H + 0.01]], sides, phase: rng.rangeF(0, 1) }),
      { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }

  
  if (coins && detail === 0) {
    for (let i = 0; i < 3; i++) {
      const a = rng.rangeF(0, Math.PI * 2);
      const c = blob({ radii: [0.028, 0.006, 0.028], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.1 });
      emit(mesh, 'gold', c, { matrix: compose(m, translate(Math.sin(a) * R * 0.9, H + 0.022, Math.cos(a) * R * 0.9)), color: vc(hex('#f0c74e'), { groundAO: 0, underside: 0.3 }) });
    }
  }
  return { top: H };
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { radius: 0.52, wall: 0.62, frame: 1.4, roof: { height: 0.34, span: 0.66 }, stone: '#c4bcb0', wood: '#a4784e', roofC: '#b4705a', rope: '#d8c49a', coins: false },
  { radius: 0.58, wall: 0.5, frame: 1.28, roof: null, stone: '#cfc6b6', wood: '#96724c', roofC: '#a8735c', rope: '#cdb88f', coins: false },
  { radius: 0.5, wall: 0.68, frame: 1.5, roof: { height: 0.44, span: 0.62 }, stone: '#b9b3c0', wood: '#8f6c4a', roofC: '#7f8fb0', rope: '#e2c06a', coins: true },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('well');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), radius: rng.rangeF(0.48, 0.6) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`well-${seed}-${season}-lod${detail}`);
  well(mesh, compose(IDENTITY, rotateY(rng.rangeF(0, Math.PI * 2))), {
    radius: st.radius, wall: st.wall, frame: st.frame, roof: st.roof, detail, rng, coins: st.coins,
    stoneColor: hex(st.stone), woodColor: hex(st.wood), roofColor: hex(st.roofC), ropeColor: hex(st.rope),
    waterColor: hex('#3f5a66'), snowColor: season === 'winter' && detail < 2 ? hex(pal.snow[0]) : null,
    
    
    frozen: season === 'winter',
  });
  return mesh;
}
