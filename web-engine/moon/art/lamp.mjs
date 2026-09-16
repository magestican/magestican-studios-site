











import { MeshData, compose, translate, rotateY } from '../mesh/meshData.mjs';
import { sweep, lathe, surface, emit, circleProfile, superellipseProfile } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc } from './kit/shade.mjs';
import { rockShape } from './rock.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const IRON = '#4d4a5e', BRASS = '#c99a4a', WOOD = '#8a5a3c', GLASS = '#e4f0f4', GLOW = '#ffd27a';

export function lantern(mesh, m, { sides = 4, hw = 0.11, glassH = 0.26, detail = 0, frame, snowColor = null }) {
  const R = hw / Math.cos(Math.PI / sides);
  const phase = Math.PI / sides;
  const metal = vc(frame, { groundAO: 0 });
  const d0 = detail === 0;
  emit(mesh, 'metal', lathe({ points: [[0, 0], [R * 0.72, 0], [R * 1.1, 0.035], [R * 1.03, 0.075]], sides, phase }), { matrix: m, color: metal });

  const y0 = 0.07, y1 = y0 + glassH;
  const edge = hw * Math.tan(Math.PI / sides);
  for (let k = 0; k < sides; k++) {
    const th = (k / sides) * Math.PI * 2;
    const dir = [Math.sin(th), 0, Math.cos(th)], tan = [Math.cos(th), 0, -Math.sin(th)];
    const pane = surface({
      us: d0 ? [-1, 0, 1] : [-1, 1], vs: [0, 1],
      at: (u, v) => {
        const bulge = 0.006 * (1 - u * u);
        return [dir[0] * (hw + bulge) + tan[0] * u * edge * 0.94, y0 + v * glassH, dir[2] * (hw + bulge) + tan[2] * u * edge * 0.94];
      },
      uv: (u, v) => [(u + 1) / 2, v],
    });
    emit(mesh, 'glass', pane, { matrix: m, color: hex(GLASS) });
    if (detail < 2) {
      const ca = th + Math.PI / sides, cr = R * 0.99;
      const bar = sweep({ profile: circleProfile(0.013, d0 ? 5 : 4), path: [[Math.sin(ca) * cr, y0 - 0.01, Math.cos(ca) * cr], [Math.sin(ca) * cr, y1 + 0.02, Math.cos(ca) * cr]], up: [1, 0, 0], caps: 'none' });
      emit(mesh, 'metal', bar, { matrix: m, color: metal });
    }
  }

  const roofPts = detail === 2
    ? [[R * 1.25, y1 + 0.01], [R * 0.5, y1 + 0.16], [0, y1 + 0.22]]
    : [[R * 0.95, y1], [R * 1.34, y1 + 0.02], [R * 1.3, y1 + 0.055], [R * 0.62, y1 + 0.14], [R * 0.22, y1 + 0.2], [0, y1 + 0.22]];
  emit(mesh, 'metal', lathe({ points: roofPts, sides, phase }), { matrix: m, color: metal });
  let top = y1 + 0.22;
  if (d0) {
    emit(mesh, 'metal', lathe({ points: [[0, top - 0.01], [0.024, top + 0.005], [0.032, top + 0.04], [0.013, top + 0.075], [0, top + 0.088]], sides: 6 }), { matrix: m, color: metal });
    top += 0.088;
  }
  const s = glassH / 0.26;
  const flame = [[0, 0.1], [0.032, 0.125], [0.04, 0.17], [0.022, 0.23], [0, 0.27]].map(([r, y]) => [r * Math.min(1.2, s), y0 + (y - 0.07) * s]);
  emit(mesh, 'lamp-glow', lathe({ points: detail === 2 ? [flame[0], flame[2], flame[4]] : flame, sides: [6, 5, 4][detail] }), { matrix: m, color: hex(GLOW) });

  if (snowColor) {
    const pts = [[R * 1.36, y1 + 0.05], [R * 1.05, y1 + 0.12], [R * 0.55, y1 + 0.2], [0, y1 + 0.25]];
    emit(mesh, 'snow', lathe({ points: pts, sides: detail === 2 ? 4 : 6, phase: 0.3 }), { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.3 }) });
  }
  return top;
}

function scroll(cx, cy, r0, turns, dir, n) {
  const path = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = Math.PI + dir * t * turns * Math.PI * 2;
    const r = r0 * (1 - 0.65 * t);
    path.push([cx + dir * r * Math.cos(a) * -1 * -1, cy + r * Math.sin(a), 0]);
  }
  return path;
}

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('lamp');
  const d = Math.max(0, Math.min(2, lod | 0));
  const variant = seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2);
  const mesh = new MeshData(`lamp-${seed}-${season}-lod${d}`);
  const snowColor = season === 'winter' ? hex(seasonPalette(season).snow[0]) : null;
  const iron = vc(hex(IRON), { groundAO: 0.2, groundFade: 0.3 });
  const sides = [8, 6, 4][d];
  const k = rng.rangeF(0.96, 1.04);

  const foot = (h = 1) => lathe({ points: [[0.2 * h, 0], [0.19 * h, 0.05], [0.12 * h, 0.11], [0.075, 0.22 * h], [0.058, 0.36 * h]], sides });
  const lanternHeight = (glassH) => 0.07 + glassH + 0.22 + (d === 0 ? 0.088 : 0);

  if (variant === 0) {
    if (d < 2) emit(mesh, 'metal', foot(1), { color: iron });
    const H = 2.08 * k, rr = 0.225;
    const path = [];
    const straight = [4, 3, 1][d];
    const y0 = d < 2 ? 0.25 : 0;
    for (let i = 0; i < straight; i++) { const t = i / straight; path.push([0.015 * Math.sin(t * 5), y0 + (H - y0) * t, 0]); }
    const arcN = [10, 6, 3][d];
    for (let i = 0; i <= arcN; i++) { const a = Math.PI - (i / arcN) * Math.PI; path.push([rr + rr * Math.cos(a), H + rr * Math.sin(a), 0]); }
    path.push([2 * rr, H - 0.06, 0]);
    const post = sweep({ profile: circleProfile(0.056, sides), path, up: [0, 0, 1], scales: (t) => 1.12 - 0.42 * t, caps: ['none', d === 2 ? 'flat' : 'round'], capRings: [], capSegments: 1, capLength: 0.025 });
    emit(mesh, 'metal', post, { color: iron });
    if (d === 0) {
      const sc = scroll(0.16, H - 0.1, 0.15, 1.05, 1, 11);
      emit(mesh, 'metal', sweep({ profile: circleProfile(0.025, 5), path: sc, up: [0, 0, 1], scales: (t) => 1 - 0.45 * t, caps: 'round', capSegments: 1, capLength: 0.02 }), { color: iron });
    }
    const glassH = 0.3;
    lantern(mesh, compose(translate(2 * rr, H - 0.05 - lanternHeight(glassH), 0), rotateY(rng.rangeF(-0.2, 0.2))), { sides: 4, hw: 0.135, glassH, detail: d, frame: hex(IRON), snowColor });
  } else if (variant === 1) {
    const H = 1.85 * k;
    const n = [4, 3, 2][d];
    const bendX = rng.rangeF(0.04, 0.08), bendZ = rng.rangeF(-0.03, 0.03);
    const path = Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [bendX * Math.sin(Math.PI * t), H * t, bendZ * t * t]; });
    const post = sweep({ profile: superellipseProfile(0.1, 0.092, 3, sides), path, up: [0, 0, 1], scales: (t) => 1.18 - 0.28 * t, caps: ['none', 'flat'], capRings: [] });
    emit(mesh, 'wood', post, { color: vc(hex(WOOD), { groundAO: 0.3, groundFade: 0.3 }) });
    if (d < 2) {
      const base = rockShape(rng, [0.24, 0.16, 0.22], d === 0 ? 2 : 1);
      const minY = Math.min(...base.p.map((p) => p[1]));
      emit(mesh, 'stone', base, { matrix: translate(0, -minY - 0.06, 0), color: vc(hex('#b9b2aa'), { groundAO: 0.3, groundFade: 0.15 }) });
    }
    const top = path[n - 1];
    const plate = lathe({ points: [[0, -0.005], [0.17, 0], [0.19, 0.03], [0.165, 0.058], [0, 0.062]], sides: d === 2 ? 4 : 6, phase: 0.2 });
    emit(mesh, 'wood', plate, { matrix: translate(top[0], top[1], top[2]), color: vc(hex(WOOD), { groundAO: 0 }) });
    lantern(mesh, compose(translate(top[0], top[1] + 0.055, top[2]), rotateY(rng.rangeF(0, 0.5))), { sides: 4, hw: 0.15, glassH: 0.32, detail: d, frame: hex(BRASS), snowColor });
  } else {
    if (d < 2) emit(mesh, 'metal', foot(1.25), { color: iron });
    const H = 1.88 * k;
    const n = [4, 3, 2][d];
    const y0 = d < 2 ? 0.3 : 0;
    const path = Array.from({ length: n }, (_, i) => [0, y0 + (H - y0) * (i / (n - 1)), 0]);
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.052, sides), path, up: [0, 0, 1], scales: (t) => 1.15 - 0.3 * t, caps: ['none', 'flat'], capRings: [] }), { color: iron });
    if (d < 2) {
      emit(mesh, 'metal', lathe({ points: [[0.055, 1.14], [0.09, 1.18], [0.092, 1.25], [0.055, 1.3]], sides }), { color: iron });
    }
    if (d === 0) {
      for (const [dir, r0] of [[1, 0.14], [-1, 0.1]]) {
        const sc = scroll(0, H - 0.22, r0, 0.95, dir, 10).map(([x, y, z]) => [x + dir * 0.03, y, z]);
        emit(mesh, 'metal', sweep({ profile: circleProfile(0.022, 5), path: sc, up: [0, 0, 1], scales: (t) => 1 - 0.45 * t, caps: 'round', capSegments: 1, capLength: 0.018 }), { color: iron });
      }
    }
    lantern(mesh, translate(0, H, 0), { sides: 6, hw: 0.135, glassH: 0.32, detail: d, frame: hex(IRON), snowColor });
  }
  return mesh;
}
