


















import { MeshData, compose, translate, rotateY } from '../mesh/meshData.mjs';
import { emit, bend, sweep, roundedRectProfile } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc, scaleC } from './kit/shade.mjs';
import { wallPanel, plinth } from './kit/wall.mjs';
import { cornerPost } from './kit/post.mjs';
import { door } from './kit/door.mjs';
import { windowUnit } from './kit/window.mjs';
import { gableRoof, awning } from './kit/roof.mjs';
import { chimney } from './kit/chimney.mjs';
import { flowerBox, steppingStone } from './kit/flowerBox.mjs';

export const TIER = 'house';
export const LODS = [0, 1, 2];

const STYLES = [
  {
    ridge: 'x', W: 5.0, D: 4.0, wallH: 2.25, rise: 1.4, sag: 0.16,
    roof: '#e0674e', wall: '#f7dba0', trim: '#fff4e0', door: '#3f9e8e', knob: '#e0b44e',
    doorX: 0, windows: [{ x: -1.5, w: 0.85, h: 0.9, box: true }, { x: 1.5, w: 0.85, h: 0.9, box: true }],
    chimney: { x: 1.35, z: -0.95 }, awning: false, porthole: false,
  },
  {
    ridge: 'z', W: 4.4, D: 4.6, wallH: 2.1, rise: 1.5, sag: 0.11,
    roof: '#5d82c9', wall: '#bfe0a8', trim: '#fff4e0', door: '#c95a42', knob: '#e0b44e',
    doorX: -0.75, windows: [{ x: 1.05, w: 0.95, h: 0.95, box: true }], gableWindow: true,
    chimney: { x: -1.25, z: -1.2 }, awning: true, porthole: true,
  },
  {
    ridge: 'x', W: 5.2, D: 3.9, wallH: 2.2, rise: 1.55, sag: 0.2,
    roof: '#8a6cc0', wall: '#f7c7b8', trim: '#b3845a', door: '#e6b84a', knob: '#6b4a3a',
    doorX: -1.25, windows: [{ x: 1.15, w: 1.5, h: 0.95, shutters: true, box: true }],
    chimney: { x: 1.85, z: -0.85 }, awning: false, porthole: false, porch: true,
  },
];
const ROOFS = ['#e0674e', '#5d82c9', '#8a6cc0', '#6fae6b', '#e6a13e'];
const WALLS = ['#f7dba0', '#bfe0a8', '#f7c7b8', '#bcd8f0', '#f5e2b0'];
const DOORS = ['#3f9e8e', '#c95a42', '#e6b84a', '#6a7fd0', '#b3845a'];

function styleFor(seed) {
  if (seed >= 1 && seed <= 3) return STYLES[seed - 1];
  const r = new SeededRng(seed).child('style');
  const base = r.pick(STYLES);
  return {
    ...base,
    roof: r.pick(ROOFS), wall: r.pick(WALLS), door: r.pick(DOORS),
    sag: r.rangeF(0.05, 0.15), rise: base.rise * r.rangeF(0.92, 1.08),
    chimney: { x: base.chimney.x * r.pick([-1, 1]), z: base.chimney.z },
  };
}

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const st = styleFor(seed);
  const rng = new SeededRng(seed).child('cottage');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const pal = seasonPalette(season);
  const winter = season === 'winter';
  const snow = winter ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`cottage-${seed}-${season}-lod${detail}`);

  const { W, D, wallH, rise } = st;
  const base = 0.36, wallTop = base + wallH;
  const alongX = st.ridge === 'x';
  const halfSpan = alongX ? D / 2 : W / 2;
  const wallC = hex(st.wall), trimC = hex(st.trim), roofC = hex(st.roof), stoneC = hex(pal.stone[1]);
  const woodC = hex('#a8784e'), ironC = hex('#4a4658'), glassC = hex('#7fb0d8');

  emit(mesh, 'stone', plinth({ width: W, depth: D, height: 0.46, thickness: 0.34, detail, rng: rng.child('plinth') }), { color: vc(stoneC, { useTag: true, groundAO: 0.15 }) });

  const gable = { eaveY: wallH, ridgeY: wallH + rise };
  const walls = [
    { m: translate(0, base, D / 2), width: W, gable: !alongX, d: detail },
    { m: compose(translate(0, base, -D / 2), rotateY(Math.PI)), width: W, gable: !alongX, d: Math.min(2, detail + 1) },
    { m: compose(translate(W / 2, base, 0), rotateY(Math.PI / 2)), width: D, gable: alongX, d: Math.min(2, detail + 1) },
    { m: compose(translate(-W / 2, base, 0), rotateY(-Math.PI / 2)), width: D, gable: alongX, d: Math.min(2, detail + 1) },
  ];
  walls.forEach((w, i) => {
    const panel = wallPanel({ width: w.width + 0.02, height: wallH, detail: w.d, rng: rng.child(`wall${i}`), gable: w.gable ? gable : null, cols: w.width > 4.5 ? 6 : 5, bulge: 0.02 });
    emit(mesh, 'plank', panel, { matrix: w.m, color: vc(wallC, { useTag: true, groundAO: 0.15, groundFade: 0.9 }) });
  });

  const postRng = rng.child('posts');
  for (const [x, z] of [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]]) {
    const post = cornerPost({ height: wallTop - 0.2, radius: 0.16, detail: z < 0 ? Math.min(2, detail + 1) : detail, rng: postRng });
    emit(mesh, 'wood', post, { matrix: translate(x, 0, z), color: vc(trimC, { groundAO: 0.25 }) });
  }

  const front = (x, y, z = 0) => translate(x, y, D / 2 + z);
  const doorH = st.awning ? 1.85 : 1.8;
  door(mesh, front(st.doorX, base, 0.075), {
    width: 0.98, height: doorH, detail, rng: rng.child('door'), color: hex(st.door), frameColor: trimC,
    knobColor: hex(st.knob), ironColor: ironC, glassColor: glassC, porthole: st.porthole,
  });

  const winRng = rng.child('windows');
  const flowers = rng.child('flowers');
  const winY = base + 1.22;
  for (const w of st.windows) {
    windowUnit(mesh, front(w.x, winY, 0.08), {
      width: w.w, height: w.h, detail, rng: winRng, frameColor: trimC, glassColor: glassC,
      shutters: w.shutters, shutterColor: hex(st.door), snowColor: w.box ? null : snow,
      muntins: w.w > 1.2 ? 'cross' : 'cross',
    });
    if (w.box) {
      flowerBox(mesh, front(w.x, winY - w.h / 2 - 0.36, 0.1), { width: w.w + 0.3, detail, rng: flowers, season, boxColor: woodC, leafColor: hex(pal.leaf[2]), snowColor: snow });
    }
  }
  if (detail < 2) {
    for (const side of [1, -1]) {
      const m = compose(translate(side * W / 2, winY, 0), compose(rotateY(side * Math.PI / 2), translate(side * 0.35, 0, 0.08)));
      windowUnit(mesh, m, { width: 0.7, height: 0.8, detail: 2, rng: winRng, frameColor: trimC, glassColor: glassC, snowColor: snow, muntins: 'cross' });
    }
  }
  if (st.gableWindow && !alongX) {
    windowUnit(mesh, front(0.05, wallTop + rise * 0.36, 0.08), { width: 0.62, height: 0.62, kind: 'round', detail, rng: winRng, frameColor: trimC, glassColor: glassC, sill: false });
  }

  const roofM = alongX ? translate(0, wallTop, 0) : compose(translate(0, wallTop, 0), rotateY(Math.PI / 2));
  const roofLen = (alongX ? W : D) + 0.75;
  const thickness = 0.26;
  gableRoof(mesh, roofM, {
    length: roofLen, halfSpan, rise, thickness, overhang: alongX ? 0.3 : 0.42, rows: 6, detail, rng: rng.child('roof'),
    color: roofC, ridgeColor: scaleC(roofC, 0.72), sag: st.sag, snowColor: snow,
  });

  const ch = st.chimney;
  const len = Math.hypot(halfSpan, rise);
  const roofTopAt = (z) => rise * (1 - Math.abs(z) / halfSpan) + (thickness * len) / halfSpan;
  const chRng = rng.child('chimney');
  const chW = 0.74, chD = 0.64;
  const lowY = roofTopAt(Math.abs(ch.z) + chD / 2) - 0.3;
  const courseH = 0.3;
  const stoneY = roofTopAt(Math.abs(ch.z) + chD / 2) - 0.06;
  const courses = Math.max(3, Math.ceil((rise + 0.75 - stoneY) / courseH));
  const chim = chimney({ width: chW, depth: chD, courseH, courses, stonesFrom: stoneY - lowY, detail, rng: chRng });
  bend(chim.shape, { along: 1, dir: 0, from: 0, length: chim.height, amount: chRng.rangeF(0.05, 0.09) * (ch.x < 0 ? -1 : 1) });
  const chimM = compose(roofM, translate(alongX ? ch.x : ch.z, lowY, alongX ? ch.z : ch.x));
  emit(mesh, 'stone', chim.shape, { matrix: chimM, color: vc(hex(pal.stone[0]), { useTag: true, groundAO: 0, underside: 0.2 }) });

  if (st.porch) {
    
    const pm = compose(translate(st.doorX, wallTop - 0.3, D / 2 + 0.2), rotateY(Math.PI / 2));
    gableRoof(mesh, pm, {
      length: 1.9, halfSpan: 0.8, rise: 0.5, thickness: 0.18, overhang: 0.18, rows: 3, detail: Math.min(2, detail + 1), cols: 2,
      rng: rng.child('porch'), color: roofC, ridgeColor: scaleC(roofC, 0.72), sag: 0.05, snowColor: detail === 2 ? null : snow,
    });
    if (detail < 2) {
      const pr = rng.child('porchPosts');
      for (const side of [-1, 1]) {
        const post = cornerPost({ height: wallTop - 0.36, radius: 0.11, detail: Math.min(2, detail + 1), rng: pr });
        emit(mesh, 'wood', post, { matrix: translate(st.doorX + side * 0.68, 0, D / 2 + 0.98), color: vc(trimC, { groundAO: 0.25 }) });
      }
      const beam = sweep({ profile: roundedRectProfile(0.1, 0.1, 0.03, 0), path: [[st.doorX - 0.8, wallTop - 0.42, D / 2 + 0.98], [st.doorX + 0.8, wallTop - 0.43, D / 2 + 0.98]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05 });
      emit(mesh, 'wood', beam, { color: vc(trimC, { groundAO: 0 }) });
    }
  }

  if (st.awning) {
    awning(mesh, front(st.doorX, base + doorH + 0.42, 0.06), { width: 1.55, depth: 0.78, drop: 0.3, detail, rng: rng.child('awning'), color: roofC, braceColor: trimC, snowColor: snow });
  }

  const stepRng = rng.child('steps');
  const steps = detail === 2 ? 2 : 3;
  for (let i = 0; i < steps; i++) {
    const stone = steppingStone({ rng: stepRng, size: 0.55 - i * 0.04, detail: i === 2 ? Math.max(1, detail) : detail });
    const m = compose(front(st.doorX + stepRng.rangeF(-0.16, 0.16) + i * 0.07, 0, 0.5 + i * 0.56), rotateY(stepRng.rangeF(0, Math.PI)));
    emit(mesh, 'stone', stone, { matrix: m, color: vc(hex(pal.stone[winter ? 0 : 1]), { groundAO: 0.1 }) });
  }
  return mesh;
}
