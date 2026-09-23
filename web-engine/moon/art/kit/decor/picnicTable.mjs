











import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, lathe } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary } from '../shade.mjs';
import { rod } from '../rod.mjs';
import { slot, turned } from '../useSlots.mjs';

const TOP_Y = 0.72, SEAT_Y = 0.44;


export function picnicTable(mesh, m, { length = 1.6, width = 0.74, detail = 0, rng, woodColor, topColor, frameColor, snowColor = null }) {
  const hl = length / 2, hw = width / 2;
  const put = (shape, color, material = 'wood') => emit(mesh, material, shape, { matrix: m, color });
  const topC = () => vc(vary(rng, topColor, 0.06), { groundAO: 0.12, underside: 0.45 });
  const frameC = () => vc(vary(rng, frameColor, 0.05), { groundAO: 0.38 });
  const seatOut = hw + 0.32;

  
  
  for (const s of [-1, 1]) {
    const x = s * (hl - 0.28) + rng.rangeF(-0.02, 0.02);
    const lean = rng.rangeF(-0.03, 0.03);
    for (const t of [-1, 1]) {
      put(rod({
        path: [[x, -0.02, t * (seatOut - 0.08)], [x + lean, SEAT_Y - 0.03, t * (hw * 0.62)], [x + lean * 1.4, TOP_Y - 0.03, t * 0.07]],
        w: 0.07, h: 0.065, detail: detail === 0 ? 0 : 1, up: [0, 0, 1], caps: ['none', 'none'],
      }), frameC());
    }
    if (detail === 0) {
      
      put(rod({ path: [[x + lean * 0.6, SEAT_Y - 0.09, -hw * 0.9], [x + lean * 0.6, SEAT_Y - 0.085, hw * 0.9]], w: 0.05, h: 0.05, detail: 1, up: [0, 1, 0] }), frameC());
    }
  }
  
  if (detail < 2) {
    put(rod({ path: [[-hl + 0.2, SEAT_Y - 0.13, 0], [hl - 0.2, SEAT_Y - 0.125, 0]], w: 0.05, h: 0.05, detail: 1, up: [0, 1, 0] }), frameC());
  }

  
  const planks = detail === 2 ? [0] : detail === 1 ? [-0.18, 0.18] : [-0.26, 0, 0.26];
  const pw = detail === 2 ? width * 0.98 : detail === 1 ? width * 0.47 : width * 0.31;
  for (const z of planks) {
    const y = TOP_Y + rng.rangeF(-0.005, 0.005);
    put(rod({
      path: [[-hl - rng.rangeF(0, 0.03), y, z], [0, y - 0.008, z + rng.rangeF(-0.006, 0.006)], [hl + rng.rangeF(0, 0.03), y, z]],
      w: 0.045, h: pw, detail: detail === 0 ? 0 : 1, corner: 0, up: [0, 1, 0], caps: 'none',
    }), topC());
  }

  
  if (detail < 2) {
    for (const t of [-1, 1]) {
      const z = t * seatOut, y = SEAT_Y + rng.rangeF(-0.006, 0.006);
      put(rod({
        path: [[-hl + 0.02, y, z], [0, y - 0.007, z + rng.rangeF(-0.01, 0.01)], [hl - 0.02, y, z]],
        w: 0.04, h: 0.24, detail: detail === 0 ? 0 : 1, corner: 0, up: [0, 1, 0], caps: 'none',
      }), vc(vary(rng, woodColor, 0.06), { groundAO: 0.2, underside: 0.42 }));
    }
  }

  if (snowColor && detail < 2) {
    put(rod({
      path: [[-hl + 0.1, TOP_Y + 0.045, 0], [0, TOP_Y + 0.055, 0.01], [hl - 0.12, TOP_Y + 0.04, 0]],
      w: 0.04, h: width * 0.82, detail: 1, corner: 0, up: [0, 1, 0], caps: 'none', scales: (t) => [1, 0.82 + 0.25 * Math.sin(Math.PI * t)],
    }), vc(snowColor, { groundAO: 0, underside: 0.2 }), 'snow');
  }
  return { topY: TOP_Y, seatY: SEAT_Y };
}


function roundTable(mesh, m, { radius = 0.46, stools = 3, detail = 0, rng, woodColor, topColor, frameColor, snowColor = null }) {
  const sides = detail === 0 ? 10 : detail === 1 ? 8 : 5;
  const wob = rng.rangeF(0, 6);
  
  const pts = detail === 2
    ? [[0, 0], [0.2, 0.02], [0.07, 0.2], [0.07, TOP_Y - 0.05], [radius, TOP_Y - 0.02], [radius * 0.96, TOP_Y], [0, TOP_Y]]
    : [[0, 0], [0.22, 0], [0.19, 0.055], [0.085, 0.16], [0.07, 0.34], [0.095, 0.52], [0.07, TOP_Y - 0.08],
      [0.16, TOP_Y - 0.055], [radius * 0.98, TOP_Y - 0.045], [radius, TOP_Y - 0.01], [radius * 0.94, TOP_Y], [radius * 0.5, TOP_Y - 0.004], [0, TOP_Y - 0.002]];
  const shape = lathe({ points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 1.6, radiusFn: detail === 2 ? null : (th, j, r) => r * (1 + 0.02 * Math.sin(th * 2 + wob + j * 0.4)) });
  emit(mesh, 'wood', shape, { matrix: m, color: vc(vary(rng, topColor, 0.05), { groundAO: 0.3, groundFade: 0.3 }) });

  if (detail === 2) return { topY: TOP_Y, seatY: SEAT_Y };
  const base = rng.rangeF(0, Math.PI * 2);
  
  
  const count = detail === 0 ? stools : Math.max(2, stools - 1);
  for (let i = 0; i < count; i++) {
    const a = base + (i / count) * Math.PI * 2 + rng.rangeF(-0.25, 0.25);
    const d = radius + rng.rangeF(0.26, 0.4);
    const at = compose(m, compose(translate(Math.sin(a) * d, 0, Math.cos(a) * d), rotateY(rng.rangeF(0, 6))));
    const sh = SEAT_Y + rng.rangeF(-0.03, 0.03);
    const stool = lathe({
      points: [[0, 0], [0.13, 0.01], [0.055, 0.1], [0.05, sh - 0.06], [0.17, sh - 0.035], [0.175, sh], [0.13, sh + 0.005], [0, sh]],
      sides: detail === 0 ? 7 : 5, phase: rng.rangeF(0, 1),
    });
    emit(mesh, 'wood', stool, { matrix: at, color: vc(vary(rng, frameColor, 0.06), { groundAO: 0.35 }) });
    if (snowColor && detail === 0) {
      emit(mesh, 'snow', lathe({ points: [[0.15, sh + 0.008], [0.1, sh + 0.035], [0, sh + 0.042]], sides: 5 }), { matrix: at, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
    }
  }
  if (snowColor) {
    emit(mesh, 'snow', lathe({ points: [[radius * 0.9, TOP_Y + 0.006], [radius * 0.62, TOP_Y + 0.04], [radius * 0.3, TOP_Y + 0.052], [0, TOP_Y + 0.055]], sides, phase: rng.rangeF(0, 1) }),
      { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
  return { topY: TOP_Y, seatY: SEAT_Y };
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { kind: 'long', length: 1.6, width: 0.74, wood: '#d2a36a', top: '#deb178', frame: '#a3764c' },
  { kind: 'long', length: 1.44, width: 0.7, wood: '#8fb9a8', top: '#f0e3cb', frame: '#5f8b7c' },
  { kind: 'round', radius: 0.46, stools: 3, wood: '#cf9c68', top: '#e3bd86', frame: '#9c7048' },
];





export function uses({ seed = 1 } = {}) {
  const rng = new SeededRng(seed).child('picnicTable');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES) };
  if (st.kind !== 'long') return [];
  const yaw = rng.rangeF(-0.1, 0.1);
  const out = st.width / 2 + 0.32;
  const out4 = [];
  for (const t of [1, -1]) for (const x of [-0.25, 0.25]) out4.push(turned(slot('seat', x * st.length, t * out, t > 0 ? Math.PI : 0, 'sit', { seatY: SEAT_Y, facing: 'centre' }), yaw));
  return out4;
}

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('picnicTable');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES) };
  const pal = seasonPalette(season);
  const snow = season === 'winter' ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`picnicTable-${seed}-${season}-lod${detail}`);
  const opts = { detail, rng, woodColor: hex(st.wood), topColor: hex(st.top), frameColor: hex(st.frame), snowColor: snow };
  const turn = rotateY(rng.rangeF(-0.1, 0.1));
  if (st.kind === 'round') roundTable(mesh, compose(IDENTITY, turn), { radius: st.radius, stools: st.stools, ...opts });
  else picnicTable(mesh, compose(IDENTITY, turn), { length: st.length, width: st.width, ...opts });
  return mesh;
}
