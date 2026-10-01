















import { sweep, surface, emit, deform, circleProfile, clamp } from '../../mesh/bevel.mjs';
import { valueNoise3 } from '../../noise.mjs';
import { vc, vary } from './shade.mjs';

export function canvasAwning(mesh, m, {
  width = 2, depth = 1, drop = 0.3, hang = 0.24, stripes = 8, colors, detail = 0, rng,
  barColor = null, snowColor = null, belly = 0.035,
}) {
  const hw = width / 2;
  const seed = rng.rangeI(1, 1e6);
  const barSag = rng.rangeF(0.015, 0.035);
  const droop = rng.rangeF(0.02, 0.05);
  const droopRight = rng.rangeF(0, 1) < 0.5;
  const flare = rng.rangeF(0.03, 0.07);
  const rb = 0.045;
  const tOf = (x) => (clamp(x, -hw, hw) + hw) / width;
  const barY = (x) => {
    const t = tOf(x), c = droopRight ? t : 1 - t;
    return -drop - barSag * 4 * t * (1 - t) - droop * c * c;
  };
  const between = (x) => { const f = (tOf(x) * stripes) / 2; return Math.sin(Math.PI * (f - Math.floor(f))) ** 2; };

  
  const at = (x, row, scal = 0) => {
    const xc = clamp(x, -hw, hw);
    const by = barY(xc);
    if (row.k === 'slope') {
      const s = row.s;
      const b = belly * Math.sin(Math.PI * s) * (0.35 + 0.65 * between(xc));
      const wob = (valueNoise3(xc * 2.1, s * 3.3, 0, seed) - 0.5) * 0.018 * Math.sin(Math.PI * s);
      return [xc, by * s - b + wob, depth * s];
    }
    if (row.k === 'fold') return [xc, by - rb * (1 - Math.cos(row.a)), depth + rb * Math.sin(row.a)];
    const h = row.h;
    const len = hang * (0.68 + 0.32 * scal);
    const flutter = (valueNoise3(xc * 1.6, 2.5, 3, seed) - 0.5) * 0.06 * h;
    return [xc, by - rb - len * h, depth + rb + flare * h * h + flutter];
  };

  const slope = (ss) => ss.map((s) => ({ k: 'slope', s }));
  const rows = detail === 0
    ? [...slope([0, 0.25, 0.5, 0.75, 1]), { k: 'fold', a: Math.PI / 4 }, { k: 'fold', a: Math.PI / 2 }, { k: 'hang', h: 0.5 }, { k: 'hang', h: 1 }]
    : detail === 1
      ? [...slope([0, 0.5, 1]), { k: 'fold', a: Math.PI / 2 }, { k: 'hang', h: 1 }]
      : [...slope([0, 1]), { k: 'hang', h: 1 }];
  const cols = detail === 0 ? 4 : detail === 1 ? 2 : 1;
  const arc = [0];
  for (let j = 1; j < rows.length; j++) {
    const a = at(0, rows[j - 1]), b = at(0, rows[j]);
    arc.push(arc[j - 1] + Math.hypot(a[1] - b[1], a[2] - b[2]));
  }

  const sw = width / stripes;
  const fs = Array.from({ length: cols + 1 }, (_, i) => i / cols);
  for (let k = 0; k < stripes; k++) {
    
    const strip = surface({
      us: rows.map((_, j) => j),
      vs: fs,
      at: (j, f) => at(-hw + (k + f) * sw, rows[j], rows[j].k === 'hang' ? Math.sin(Math.PI * f) : 0),
      uv: (j, f, p) => [p[0] * 1.4, arc[j] * 1.4],
    });
    const base = colors[k % colors.length];
    mesh.swayPiece({ perMetre: 0.06, hang: true }, (p) => emit(p, 'canvas', strip, { matrix: m, color: vc(vary(rng, base, 0.03), { groundAO: 0, underside: 0.3, mottle: 0.05 }) })); 
  }

  if (barColor && detail < 2) {
    const n = detail === 0 ? 4 : 2;
    const path = [];
    for (let i = 0; i <= n; i++) {
      
      const x = -hw + 0.03 + ((width - 0.06) * i) / n;
      path.push([x, barY(x) - rb, depth]);
    }
    emit(mesh, 'wood', sweep({ profile: circleProfile(rb * 0.8, detail === 0 ? 6 : 4), path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.03 }), { matrix: m, color: vc(barColor, { groundAO: 0 }) });
  }

  if (snowColor) {
    
    const P = detail === 0
      ? [[-0.02, 0.03], [0.05, 0.03], [0.09, 0.3], [0.1, 0.62], [0.08, 0.92], [0.03, 1.0], [-0.02, 0.99], [-0.03, 0.5]]
      : [[-0.02, 0.04], [0.08, 0.1], [0.08, 0.9], [-0.02, 0.99]];
    const stations = detail === 0 ? Math.max(3, Math.round(stripes / 2)) : 2;
    const path = [];
    for (let i = 0; i <= stations; i++) path.push([-hw + 0.05 + ((width - 0.1) * i) / stations, 0, 0]);
    const snow = sweep({ profile: P, path, up: [0, 1, 0], caps: 'round', capSegments: detail === 0 ? 1 : 0, capLength: 0.05, uvScale: 0.5 });
    deform(snow, ([x, off, s]) => {
      const c = at(x, { k: 'slope', s: clamp(s) });
      const lump = off > 0.03 ? (valueNoise3(x * 1.3, s * 2, 9, seed) - 0.5) * 0.05 : 0;
      return [x, c[1] + off + lump, c[2]];
    });
    emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.25, mottle: 0.04 }) });
  }
  return { hemY: barY(0) - rb - hang, frontZ: depth + rb };
}
