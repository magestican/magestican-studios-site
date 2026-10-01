










import { MeshData, IDENTITY, compose, scale, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, blob, lathe } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary } from '../shade.mjs';
import { rod } from '../rod.mjs';


export function crateBox(mesh, m, { size = [0.52, 0.42, 0.44], flare = 0.035, detail = 0, rng, woodColor, rimColor, snowColor = null }) {
  const [W, H, D] = size;
  const hw = W / 2, hd = D / 2;
  const put = (shape, color, material = 'plank') => emit(mesh, material, shape, { matrix: m, color });
  const boardC = (k = 0.07) => vc(vary(rng, woodColor, k), { groundAO: 0.3, underside: 0.45 });

  
  
  if (detail === 2) {
    
    
    const box = lathe({ points: [[0, 0], [0.707, 0], [0.707 * (1 + flare), 1], [0, 1]], sides: 4, phase: 0.125 });
    emit(mesh, 'plank', box, { matrix: compose(m, scale(W, H, D)), color: boardC(0.04) });
    return { top: H };
  }

  
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * (hw - 0.03), z = sz * (hd - 0.03);
      const out = flare + rng.rangeF(-0.008, 0.008);
      put(rod({
        path: [[x, -0.01, z], [x + sx * out, H, z + sz * out]],
        w: 0.055, h: 0.055, detail: detail === 0 ? 0 : 1, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.02,
      }), vc(vary(rng, rimColor, 0.05), { groundAO: 0.4 }));
    }
  }

  
  const rows = detail === 1 ? [0.14, 0.62] : [0.1, 0.44, 0.78];
  for (const f of rows) {
    const y = H * f + rng.rangeF(-0.008, 0.008);
    const out = flare * f;
    for (const [along, sign] of [[0, -1], [0, 1], [1, -1], [1, 1]]) {
      const half = (along === 0 ? hw : hd) + out;
      const off = (along === 0 ? hd : hw) + out;
      const a = [-half + rng.rangeF(-0.01, 0.01), y, sign * off];
      const b = [half - rng.rangeF(-0.01, 0.01), y + rng.rangeF(-0.008, 0.008), sign * off];
      const path = along === 0 ? [a, b] : [[a[2], a[1], a[0]], [b[2], b[1], b[0]]];
      put(rod({ path, w: 0.022, h: H * 0.2, detail: detail === 0 ? 0 : 1, corner: 0, up: [0, 1, 0], caps: 'none' }), boardC());
    }
  }

  
  if (detail < 2) {
    const y = H + 0.012;
    const o = flare + 0.012;
    for (const [along, sign] of [[0, -1], [0, 1], [1, -1], [1, 1]]) {
      const half = (along === 0 ? hw : hd) + o;
      const off = (along === 0 ? hd : hw) + o;
      const lift = rng.rangeF(-0.004, 0.006);
      const a = [-half, y + lift, sign * off], b = [half, y + lift * 0.4, sign * off];
      const path = along === 0 ? [a, b] : [[a[2], a[1], a[0]], [b[2], b[1], b[0]]];
      put(rod({ path, w: 0.03, h: 0.05, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none' }), vc(vary(rng, rimColor, 0.05), { groundAO: 0.15, underside: 0.4 }));
    }
  }

  if (snowColor && detail < 2) {
    const y = H + 0.045;
    put(rod({ path: [[-hw * 0.86, y, 0], [0, y + 0.015, 0], [hw * 0.86, y - 0.004, 0]], w: 0.035, h: D * 0.86, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none' }),
      vc(snowColor, { groundAO: 0, underside: 0.2 }), 'snow');
  }
  return { top: H };
}


function fruit(mesh, m, { top, size, detail, rng, colors, snowColor }) {
  const [W, , D] = size;
  const n = detail === 0 ? 7 : 4;
  for (let i = 0; i < n; i++) {
    const r = rng.rangeF(0.055, 0.082);
    const x = rng.rangeF(-1, 1) * (W / 2 - r), z = rng.rangeF(-1, 1) * (D / 2 - r);
    const y = top - 0.02 + (i < n / 2 ? 0 : r * 0.9) + rng.rangeF(0, 0.02);
    const shape = blob({ radii: [r, r * rng.rangeF(0.85, 1.0), r], subdiv: detail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6), lump: 0.16 });
    emit(mesh, 'fruit', shape, {
      matrix: compose(m, compose(translate(x, y, z), rotateY(rng.rangeF(0, 6)))),
      color: vc(vary(rng, hex(rng.pick(colors)), 0.06), { groundAO: 0, underside: 0.35 }),
    });
  }
  if (snowColor) {
    const shape = blob({ radii: [W * 0.3, 0.035, D * 0.3], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.3 });
    emit(mesh, 'snow', shape, { matrix: compose(m, translate(rng.rangeF(-0.04, 0.04), top + 0.1, 0)), color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { size: [0.52, 0.42, 0.44], stack: 1, fill: null, wood: '#d2a874', rim: '#a87848' },
  { size: [0.48, 0.38, 0.42], stack: 2, fill: null, wood: '#c49a6a', rim: '#8f6a46' },
  { size: [0.56, 0.36, 0.46], stack: 1, fill: ['#e05a46', '#e8a13c', '#c2452f'], wood: '#e0bd8c', rim: '#b4855a' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('crate');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), stack: 1 };
  const pal = seasonPalette(season);
  const snow = season === 'winter' ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`crate-${seed}-${season}-lod${detail}`);
  const woodColor = hex(st.wood), rimColor = hex(st.rim);
  let y = 0;
  for (let i = 0; i < st.stack; i++) {
    
    const k = 1 - i * 0.12;
    const size = st.size.map((v) => v * k);
    const at = compose(IDENTITY, compose(
      translate(i === 0 ? 0 : rng.rangeF(-0.05, 0.05), y, i === 0 ? 0 : rng.rangeF(-0.05, 0.05)),
      rotateY(i === 0 ? rng.rangeF(-0.12, 0.12) : rng.rangeF(-0.5, 0.5)),
    ));
    const top = crateBox(mesh, at, {
      size, flare: 0.035, detail, rng, woodColor, rimColor,
      snowColor: i === st.stack - 1 && !st.fill ? snow : null,
    }).top;
    if (st.fill && i === st.stack - 1 && detail < 2) fruit(mesh, at, { top, size, detail, rng, colors: st.fill, snowColor: snow });
    y += top + 0.02;
  }
  return mesh;
}
