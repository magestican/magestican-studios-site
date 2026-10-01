









import { MeshData, compose, translate, rotateY } from '../mesh/meshData.mjs';
import { sweep, lathe, emit, transform, deform, bend, computeNormals, splitShape, circleProfile, smoothstep } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { valueNoise3 } from '../noise.mjs';
import { hex, mixC, paintVertex, vary, vc } from './kit/shade.mjs';
import { rockShape } from './rock.mjs';
import { ring, slot } from './kit/useSlots.mjs';
import { RIPPLE, jetRamp } from './kit/water.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const BARK = '#6b4630', RING_LIGHT = '#e2bd86', RING_DARK = '#c29058', PITH = '#e8c690', CHAR = '#3b3038', SOOT = '#5a4f58';
const FIRE_ROOT = '#ffe9a6', FIRE_MID = '#ffb347', FIRE_TIP = '#ff6f3c';


export const WARM_RING = Object.freeze({ count: 6, r: 0.9 });
export function uses() {
  return ring(WARM_RING.count, WARM_RING.r, Math.PI / WARM_RING.count, (x, z, a) => slot('warm', x, z, a + Math.PI, 'warmHands', { facing: 'centre' }));
}

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('firepit');
  const d = Math.max(0, Math.min(2, lod | 0));
  const pal = seasonPalette(season);
  const mesh = new MeshData(`firepit-${seed}-${season}-lod${d}`);
  const snowC = season === 'winter' ? hex(pal.snow[0]) : null;

  const count = [7, 7, 5][d] + (d === 0 && seed % 2 === 0 ? 1 : 0);
  const ringR = 0.47 * rng.rangeF(0.95, 1.05);
  const soot = hex(SOOT);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rng.rangeF(-0.14, 0.14);
    const r = ringR + rng.rangeF(-0.03, 0.04);
    const s = rockShape(rng, [rng.rangeF(0.17, 0.23) * (count > 7 ? 0.9 : 1), rng.rangeF(0.12, 0.18), rng.rangeF(0.14, 0.18)], d === 0 ? 2 : 1);
    transform(s, compose(translate(Math.sin(a) * r, 0, Math.cos(a) * r), rotateY(a + Math.PI / 2 + rng.rangeF(-0.3, 0.3))));
    const minY = Math.min(...s.p.map((p) => p[1]));
    deform(s, (p) => { p[1] -= minY + 0.02; });
    const base = vary(rng, hex(rng.pick(pal.stone.slice(0, 2))), 0.05);
    const stoneColor = (p, n) => {
      const inward = -(n[0] * p[0] + n[2] * p[2]) / (Math.hypot(p[0], p[2]) || 1);
      return paintVertex(mixC(base, soot, smoothstep(0.1, 0.8, inward) * 0.55), p, n, { groundAO: 0.3, groundFade: 0.12 });
    };
    if (snowC) {
      const n0 = computeNormals(s);
      const up = s.p.map((p, j) => n0[j][1] + (valueNoise3(p[0] * 9, p[1] * 9, p[2] * 9, i) - 0.5) * 0.4);
      const [rock, snow] = splitShape(s, (tri) => (up[tri[0]] + up[tri[1]] + up[tri[2]]) / 3 > 0.62);
      emit(mesh, 'stone', rock, { color: stoneColor });
      emit(mesh, 'snow', snow, { color: vc(snowC, { groundAO: 0, underside: 0.2 }) });
    } else {
      emit(mesh, 'stone', s, { color: stoneColor });
    }
  }

  if (d < 2) {
    const ash = lathe({ points: [[0, 0.03], [0.26, 0.026], [0.4, 0.012], [0.44, -0.01]], sides: 8, phase: rng.rangeF(0, 1) });
    emit(mesh, 'stone', ash, { color: vc(hex('#524852'), { groundAO: 0, mottle: 0.12 }) });
  }

  const logs = [3, 3, 2][d];
  const spin = rng.rangeF(0, Math.PI * 2);
  for (let j = 0; j < logs; j++) {
    const a = spin + (j / logs) * Math.PI * 2 + rng.rangeF(-0.25, 0.25);
    const outR = rng.rangeF(0.34, 0.4), inR = rng.rangeF(-0.06, 0.02);
    const yIn = rng.rangeF(0.3, 0.38);
    const radius = rng.rangeF(0.07, 0.085);
    const p0 = [Math.sin(a) * outR, radius + 0.01, Math.cos(a) * outR];
    const p2 = [Math.sin(a) * inR, yIn, Math.cos(a) * inR];
    const mid = [(p0[0] + p2[0]) / 2 + rng.rangeF(-0.02, 0.02), (p0[1] + p2[1]) / 2 + 0.015, (p0[2] + p2[2]) / 2];
    const log = sweep({
      profile: circleProfile(radius, [6, 5, 4][d], rng.rangeF(0, 1)),
      path: d === 2 ? [p0, p2] : [p0, mid, p2],
      up: [0, 1, 0], caps: 'flat', capRings: [[0.62], [0.6], []][d],
    });
    const [bodyShape, ends] = splitShape(log, (tri) => Math.min(log.tag[tri[0]], log.tag[tri[1]], log.tag[tri[2]]) < 1);
    const charred = (p, c) => mixC(c, hex(CHAR), smoothstep(0.2, 0.02, Math.hypot(p[0], p[2])) * 0.75);
    emit(mesh, 'bark', bodyShape, { color: (p, n) => paintVertex(charred(p, hex(BARK)), p, n, { groundAO: 0.25, groundFade: 0.15 }) });
    emit(mesh, 'wood', ends, {
      color: (p, n, uv, tag) => {
        
        const c = tag >= 1 ? hex(BARK) : tag > 0.3 ? hex(RING_LIGHT) : hex(RING_DARK);
        return paintVertex(charred(p, c), p, n, { groundAO: 0.15, groundFade: 0.15, mottle: 0.03 });
      },
    });
  }

  const flames = [3, 2, 1][d];
  const heights = [rng.rangeF(0.64, 0.76), rng.rangeF(0.46, 0.56), rng.rangeF(0.32, 0.4)];
  const root = hex(FIRE_ROOT), midC = hex(FIRE_MID), tip = hex(FIRE_TIP);
  for (let f = 0; f < flames; f++) {
    const h = heights[f], w = h * rng.rangeF(0.27, 0.32);
    
    const pts = d === 2
      ? [[0, 0], [w, h * 0.25], [0, h]]
      : [[0, 0], [w * 0.85, h * 0.06], [w * 1.12, h * 0.2], [w * 1.0, h * 0.36], [w * 0.6, h * 0.58], [w * 0.22, h * 0.84], [0, h]];
    const flame = lathe({ points: pts, sides: d === 0 ? [7, 6, 5][f] : [5, 4][d - 1], phase: rng.rangeF(0, 1) });
    bend(flame, { along: 1, dir: 0, from: 0, length: h, amount: rng.rangeF(-0.08, 0.08) });
    bend(flame, { along: 1, dir: 2, from: 0, length: h, amount: rng.rangeF(-0.05, 0.05) });
    const off = f === 0 ? [0, 0] : [rng.rangeF(-0.12, 0.12), rng.rangeF(-0.12, 0.12)];
    
    
    
    
    const flameRamp = jetRamp(flame.p.map((q) => q[1]));
    emit(mesh, 'fire', flame, {
      matrix: compose(translate(off[0], 0.06, off[1]), rotateY(rng.rangeF(0, Math.PI * 2))),
      color: (p) => { const t = Math.min(1, Math.max(0, (p[1] - 0.06) / h)); return t < 0.45 ? mixC(root, midC, t / 0.45) : mixC(midC, tip, (t - 0.45) / 0.55); },
      ripple: (p, n, uv, tag, i) => -RIPPLE.flame * flameRamp[i],
    });
  }
  return mesh;
}
