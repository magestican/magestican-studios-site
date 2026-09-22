






































import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, lathe, sag } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC } from '../shade.mjs';
import { rod } from '../rod.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];




const STYLES = [
  { kind: 'table', topR: 0.27, topH: 0.045, legH: 0.50, splay: 0.075, legW: 0.042, wood: '#d8b183', trim: '#a97f4f' },
  { kind: 'stool', topR: 0.185, topH: 0.05, legH: 0.42, splay: 0.095, legW: 0.036, wood: '#c99a63', trim: '#8f6a42' },
  { kind: 'shelf', width: 0.62, depth: 0.26, legH: 1.02, legW: 0.032, wood: '#e0c096', trim: '#ab8355' },
];





function roundTop(mesh, m, { radius, thick, dish = 0, detail, rng, color }) {
  const sides = detail === 0 ? 14 : detail === 1 ? 9 : 5;
  const a = rng.rangeF(0, 6.283), b = rng.rangeF(0, 6.283);
  const wobble = detail === 2 ? 0 : 0.022;
  
  
  const points = [
    [0, 0],
    [radius * 0.82, 0],
    [radius, thick * 0.42],
    [radius * 0.985, thick],
    [radius * 0.5, thick - dish * 0.62],
    [0, thick - dish],
  ];
  
  
  
  const shape = lathe({
    points, sides, phase: rng.rangeF(0, (Math.PI * 2) / sides),
    radiusFn: (th, j, r) => r * (1 + wobble * (Math.sin(th * 3 + a) * 0.6 + Math.sin(th * 5 + b) * 0.4)),
  });
  emit(mesh, 'plank', shape, { matrix: m, color });
}


function threeLegs(mesh, m, { radius, height, splay, w, detail, rng, color, drop = 0 }) {
  const phase = rng.rangeF(0, 2.094);
  const feet = [];
  for (let i = 0; i < 3; i++) {
    const ang = phase + (i * 2.094) + rng.rangeF(-0.13, 0.13);
    const lean = splay * rng.rangeF(0.82, 1.18);
    const top = radius * 0.62;
    const ax = Math.cos(ang) * top, az = Math.sin(ang) * top;
    const bx = Math.cos(ang) * (top + lean), bz = Math.sin(ang) * (top + lean);
    feet.push([bx, bz, ang]);
    emit(mesh, 'wood', rod({
      path: [[bx, 0, bz], [ax * 0.96, height * 0.55, az * 0.96], [ax, height + drop, az]],
      w: w * rng.rangeF(0.92, 1.08), detail, caps: ['round', 'none'], capLength: w * 0.3,
    }), { matrix: m, color: vc(vary(rng, color, 0.05), { groundAO: 0.45, underside: 0.5 }) });
  }
  return feet;
}


function brace(mesh, m, { from, to, y, w, h, detail, rng, color }) {
  const shape = rod({
    path: [[from[0], y, from[1]], [to[0], y - 0.006, to[1]]],
    w, h, detail, corner: 0, up: [0, 1, 0], caps: 'none',
  });
  emit(mesh, 'wood', sag(shape, { along: 0, dir: -1, center: (from[0] + to[0]) / 2, half: Math.max(0.05, Math.hypot(to[0] - from[0], to[1] - from[1]) / 2), amount: 0.006 }), {
    matrix: m, color: vc(vary(rng, color, 0.04), { groundAO: 0.35, underside: 0.5 }),
  });
}


function bookshelf(mesh, m, st, { detail, rng, woodColor, trimColor }) {
  const hw = st.width / 2, hd = st.depth / 2, H = st.legH;
  const boardC = (k = 0.06) => vc(vary(rng, woodColor, k), { groundAO: 0.3, underside: 0.45 });
  
  for (const sx of [-1, 1]) {
    const lean = rng.rangeF(-0.016, 0.016);
    emit(mesh, 'plank', rod({
      path: [[sx * hw, 0, 0], [sx * hw + lean, H, 0]],
      w: st.legW, h: st.depth * 0.92, detail, corner: detail === 0 ? 1 : 0, up: [0, 0, 1], caps: ['none', 'round'], capLength: 0.02,
    }), { matrix: m, color: vc(vary(rng, trimColor, 0.05), { groundAO: 0.4, underside: 0.5 }) });
  }
  
  
  const at = detail === 0 ? [0.17, 0.46, 0.75] : [0.2, 0.62];
  for (const f of at) {
    const y = H * f + rng.rangeF(-0.008, 0.008);
    const board = rod({
      path: [[-hw + 0.01, y, 0], [hw - 0.01, y + rng.rangeF(-0.006, 0.006), 0]],
      w: 0.026, h: st.depth * 0.86, detail, corner: 0, up: [0, 1, 0], caps: 'none',
    });
    emit(mesh, 'plank', sag(board, { along: 0, dir: -1, center: 0, half: hw, amount: rng.rangeF(0.004, 0.011) }), { matrix: m, color: boardC() });
  }
  
  
  const railY = H * rng.rangeF(0.3, 0.62);
  emit(mesh, 'wood', rod({
    path: [[-hw, railY, -hd * 0.78], [hw, railY + rng.rangeF(-0.01, 0.01), -hd * 0.78]],
    w: 0.02, h: 0.055, detail, corner: 0, up: [0, 1, 0], caps: 'none',
  }), { matrix: m, color: vc(vary(rng, trimColor, 0.05), { groundAO: 0.3, underside: 0.5 }) });
  const over = rng.rangeF(0.02, 0.05);
  const top = rod({
    path: [[-hw - over, H + 0.015, 0], [hw + over * 0.35, H + 0.015 + rng.rangeF(-0.006, 0.006), 0]],
    w: 0.034, h: st.depth, detail, corner: detail === 0 ? 1 : 0, up: [0, 1, 0], caps: 'none',
  });
  emit(mesh, 'plank', top, { matrix: m, color: boardC(0.04) });
  
  
  if (detail < 2) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const y = 0.028 + rng.rangeF(-0.004, 0.004);
        emit(mesh, 'wood', rod({
          path: [[sx * hw, y, sz * hd * 0.6], [sx * hw, 0, sz * hd * 0.6]],
          w: 0.034, detail, caps: ['round', 'none'], capLength: 0.012,
        }), { matrix: m, color: vc(vary(rng, trimColor, 0.04), { groundAO: 0.5 }) });
      }
    }
  }
}

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('furniture');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : rng.pick(STYLES);
  const pal = seasonPalette(season);
  
  
  
  const tint = (c) => mixC(hex(c), hex(pal.grass[1]), 0.12);
  const woodColor = tint(st.wood), trimColor = tint(st.trim);
  const mesh = new MeshData(`furniture-${seed}-${season}-lod${detail}`);
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.09, 0.09)));

  if (st.kind === 'shelf') {
    bookshelf(mesh, m, st, { detail, rng, woodColor, trimColor });
    return mesh;
  }

  const dish = st.kind === 'stool' ? st.topH * 0.45 : 0;
  const feet = threeLegs(mesh, m, {
    radius: st.topR, height: st.legH, splay: st.splay, w: st.legW, detail, rng,
    color: trimColor, drop: -st.topH * 0.2,
  });
  
  
  if (detail < 2) {
    const y = st.kind === 'table' ? st.legH * 0.78 : st.legH * 0.42;
    brace(mesh, m, {
      from: [feet[0][0] * 0.82, feet[0][1] * 0.82], to: [feet[1][0] * 0.82, feet[1][1] * 0.82],
      y, w: 0.022, h: st.kind === 'table' ? 0.05 : 0.03, detail, rng, color: trimColor,
    });
  }
  roundTop(mesh, compose(m, translate(0, st.legH - st.topH * 0.2, 0)), {
    radius: st.topR, thick: st.topH, dish, detail, rng,
    color: vc(vary(rng, woodColor, 0.05), { groundAO: 0.12, underside: 0.55 }),
  });
  return mesh;
}
