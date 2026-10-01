






































import { MeshData, compose, translate, rotateY, scale } from '../mesh/meshData.mjs';
import { emit, bend } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc, scaleC } from './kit/shade.mjs';
import { chimney } from './kit/chimney.mjs';
import { windowUnit } from './kit/window.mjs';
import { PRESS, KETTLE_SCALE, fruitPress, stoveKettle, bottlingBench, slatCrate } from './kit/workshop.mjs';
import { barnShell, slidingDoors, hoistBeam, weatherVane, cupola, leanTo } from './kit/barn.mjs';
import { cutoutSign, caskPair, copperCowl, copperFlue, canvasRoll } from './kit/pressYard.mjs';
import { frameOf, boxRect, round3, levelOf } from './kit/plan.mjs';

export const TIER = 'heroBuilding';
export const STAGES = ['level1', 'level2', 'level3'];
export const LODS = [0, 1, 2];

const STYLES = [
  { boards: '#d49d64', trim: '#6e4832', roof: '#79b09f', door: '#c4643f', brace: 'z', loft: 'rect', vane: 'apple', kneeX: 0.6, ridgeShift: 0.06, jam: '#d8463c', lid: '#e8c14a', juice: '#f2a23a', canvas: '#f3e6c8', side: 1 },
  { boards: '#b9503f', trim: '#f4e4c1', roof: '#737c91', door: '#b9503f', brace: 'x', loft: 'rect', vane: 'arrow', kneeX: 0.55, ridgeShift: -0.08, jam: '#8c4aa8', lid: '#e8c14a', juice: '#ee7a3a', canvas: '#f4e4c1', side: -1 },
  { boards: '#b3ab9b', trim: '#5e8455', roof: '#cf8744', door: '#5e8455', brace: 'z', loft: 'round', vane: 'apple', kneeX: 0.65, ridgeShift: 0.09, jam: '#e0584a', lid: '#5e8455', juice: '#f0c23a', canvas: '#eadfc4', side: 1 },
];
const BOARDS = ['#d49d64', '#b9503f', '#b3ab9b', '#a8744c', '#c9b48a'];
const ROOFS = ['#79b09f', '#737c91', '#cf8744', '#9aa36a', '#5f8fa8'];

function styleFor(seed) {
  if (seed >= 1 && seed <= 3) return STYLES[seed - 1];
  const r = new SeededRng(seed).child('processorStyle');
  const base = r.pick(STYLES);
  return { ...base, boards: r.pick(BOARDS), roof: r.pick(ROOFS), side: r.pick([-1, 1]) };
}

const KETTLE_TOP = 1.8, BENCH_TOP = 1.45, CRATE_H = 0.42, BENCH_H = 0.88;
const BARN = Object.freeze({ W: 3.5, D: 2.3, cz: -1.3, eave: 2.6, knee: 3.5, ridge: 4.02 });



function design(level, s) {
  const d = {
    barn: BARN,
    doors: { x: 0.55 * s, opening: 1.05 },
    press: { x: 0.55 * s, z: 0.74, rotY: -0.08 * s },
    sign: { x: -1.12 * s, y: 1.98 },
    loft: { x: -0.2 * s, y: 3.08 },
    
    hoist: { x: 0.3 * s, y: 3.7 },
    vane: { z: -0.45 },
    crates: [{ x: 1.95 * s, z: 1.0, rotY: 0.2 * s }],
  };
  if (level >= 2) {
    d.leanTo = { xWall: -1.75 * s, xOuter: -3.2 * s, zBack: -2.25, zFront: -0.38, yWall: 2.32, yOuter: 2.02, open: false };
    d.stove = { x: -2.5 * s, z: 0.76 };
    
    
    d.chimney = { x: -2.6 * s, z: -0.3, top: 4.55 };
    d.crates.push({ x: -1.25 * s, z: 1.18, rotY: -0.15 * s });
  }
  if (level === 3) {
    d.bay = { xWall: 1.75 * s, xOuter: 3.5 * s, zBack: -2.0, zFront: 1.12, yWall: 2.34, yOuter: 2.14, open: true };
    d.bench = { x: 2.55 * s, z: 0.8, width: 1.5 };
    
    
    d.casks = { x: 2.8 * s, z: -1.0 };
    d.crates[0] = { x: -0.45 * s, z: 1.26, rotY: 0.12 * s };
    d.cupola = { z: -1.55 };
  }
  return d;
}

function plan(seed, stage) {
  const style = styleFor(seed);
  const level = levelOf(STAGES, stage);
  const s = style.side;
  const d = design(level, s);
  const b = d.barn;
  const rects = [[-b.W / 2 - 0.2, b.W / 2 + 0.2, b.cz - b.D / 2 - 0.2, b.cz + b.D / 2 + 0.1]];
  rects.push(boxRect(d.press.x, d.press.z, [-PRESS.halfWidth, PRESS.halfWidth, -PRESS.back, PRESS.front], d.press.rotY));
  for (const sh of [d.leanTo, d.bay]) {
    if (!sh) continue;
    const pad = sh.open ? 0.1 : 0.2;
    const x0 = Math.min(sh.xWall, sh.xOuter), x1 = Math.max(sh.xWall, sh.xOuter);
    rects.push([x0 - (sh.xOuter < sh.xWall ? pad : 0), x1 + (sh.xOuter > sh.xWall ? pad : 0), sh.zBack - 0.1, sh.zFront + 0.1]);
  }
  if (d.stove) rects.push([d.stove.x - 0.52, d.stove.x + 0.52, d.stove.z - 0.5, d.stove.z + 0.54]);
  if (d.bench) rects.push([d.bench.x - d.bench.width / 2 - 0.05, d.bench.x + d.bench.width / 2 + 0.05, d.bench.z - 0.34, d.bench.z + 0.34]);
  for (const c of d.crates) rects.push(boxRect(c.x, c.z, [-0.3, 0.3, -0.23, 0.23], c.rotY));
  return { style, level, s, d, frame: frameOf(rects) };
}

export function anchors({ seed = 1, stage = 'level1' } = {}) {
  const { d, frame } = plan(seed, stage);
  const { ox, oz, hx, hz } = frame;
  const P = (x, z) => ({ x: round3(x + ox), z: round3(z + oz) });
  const stations = [{ ...P(d.press.x, d.press.z), y: round3(PRESS.top + 0.08), rotY: d.press.rotY }];
  const outputs = [{ ...P(d.crates[0].x, d.crates[0].z), y: CRATE_H }];
  if (d.stove) {
    stations.push({ ...P(d.stove.x, d.stove.z), y: KETTLE_TOP, rotY: 0 });
    outputs.push({ ...P(d.crates[1].x, d.crates[1].z), y: CRATE_H });
  }
  if (d.bench) {
    stations.push({ ...P(d.bench.x - 0.36, d.bench.z - 0.04), y: BENCH_TOP, rotY: 0 });
    outputs.push({ ...P(d.bench.x + 0.52, d.bench.z + 0.1), y: BENCH_H });
  }
  return {
    footprint: { hx: round3(hx), hz: round3(hz) },
    front: P(d.press.x, hz - oz + 0.6),
    
    
    door: P(d.press.x > -ox ? -hx - ox + 0.7 : hx - ox - 0.7, hz - oz),
    stations,
    outputs,
  };
}

export function generate({ seed = 1, season = 'summer', stage = 'level1', lod = 0 } = {}) {
  const { style: st, d, frame, s } = plan(seed, stage);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('processor');
  const pal = seasonPalette(season);
  const winter = season === 'winter';
  const snow = winter ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`processor-${seed}-${stage}-${season}-lod${detail}`);
  const R = translate(frame.ox, 0, frame.oz);
  const at = (x, y, z, a = 0) => compose(R, a ? compose(translate(x, y, z), rotateY(a)) : translate(x, y, z));
  const wood = hex('#b3845a'), dark = hex('#86593a'), iron = hex('#4a4658'), copper = hex('#d27a45');
  const boards = hex(st.boards), trim = hex(st.trim), roof = hex(st.roof), stone = hex(pal.stone[1]);

  const b = d.barn;
  const shell = barnShell(mesh, R, {
    ...b, kneeX: st.kneeX, ridgeShift: st.ridgeShift * s, detail, rng: rng.child('barn'),
    stoneColor: stone, boardColor: boards, trimColor: trim, roofColor: roof, snowColor: snow,
  });
  const fz = shell.frontZ;
  slidingDoors(mesh, at(d.doors.x, 0.42, fz), { opening: d.doors.opening, height: 1.92, detail, rng: rng.child('doors'), color: hex(st.door), trimColor: trim, ironColor: iron, glowColor: hex('#7d5439'), brace: st.brace });
  if (detail < 2) windowUnit(mesh, at(d.loft.x, d.loft.y, fz + 0.06), { width: 0.62, height: 0.66, kind: st.loft, muntins: 'cross', detail: detail + 1, rng: rng.child('loft'), frameColor: trim, glassColor: hex('#7fb0d8'), sill: st.loft !== 'round', snowColor: snow });
  hoistBeam(mesh, at(d.hoist.x, d.hoist.y, fz), { reach: 0.82, detail, rng: rng.child('hoist'), wood: dark, iron, rope: hex('#d8c08a'), snowColor: snow });
  cutoutSign(mesh, compose(at(d.sign.x, d.sign.y, fz + 0.1), scale(1.12)), {
    detail, rng: rng.child('sign'), glassColor: hex('#dcefe6'), jamColor: hex(st.jam), labelColor: hex('#fff3dc'), lidColor: hex(st.lid),
    juiceColor: hex(st.juice), corkColor: hex('#b98a5a'), rimColor: hex('#5b3b2c'), markColor: hex('#d8463c'), ironColor: iron, snowColor: snow, flip: s, back: 0.1,
  });
  const ridgeX = st.ridgeShift * s;
  const vaneOpts = { detail, rng: rng.child('vane'), iron, emblemColor: st.vane === 'apple' ? hex('#d8463c') : hex('#e0b44e'), emblem: st.vane };
  if (d.cupola) {
    const cy = b.ridge + 0.02;
    const c = cupola(mesh, at(ridgeX, cy, d.cupola.z), { detail, rng: rng.child('cupola'), boardColor: scaleC(boards, 0.95), trimColor: trim, roofColor: roof, snowColor: snow, lean: rng.rangeF(-0.05, 0.05) });
    weatherVane(mesh, at(ridgeX, cy + c.top - 0.02, d.cupola.z), { ...vaneOpts, height: 0.52 });
  } else {
    weatherVane(mesh, at(ridgeX, b.ridge + 0.1, d.vane.z), vaneOpts);
  }

  fruitPress(mesh, at(d.press.x, 0, d.press.z, d.press.rotY), { detail, rng: rng.child('press'), wood, darkWood: dark, iron });
  d.crates.forEach((c, i) => slatCrate(mesh, at(c.x, 0, c.z, c.rotY), { detail, rng: rng.child(`crate${i}`), color: hex('#c08a55') }));

  if (d.leanTo) {
    leanTo(mesh, R, { ...d.leanTo, detail, rng: rng.child('leanTo'), stoneColor: stone, boardColor: scaleC(boards, 0.9), trimColor: trim, roofColor: roof, woodColor: dark, snowColor: snow });
    const sv = d.stove;
    stoveKettle(mesh, compose(at(sv.x, 0, sv.z), scale(KETTLE_SCALE)), { detail, rng: rng.child('kettle'), stone: hex(pal.stone[0]), copper, iron, wood, fire: hex('#ff9a4a') });
    const ch = d.chimney;
    const chRng = rng.child('chimney');
    const from = 0.9, courseH = 0.66;
    const cs = chimney({ width: 0.78, depth: 0.66, courseH, courses: Math.ceil((ch.top - from) / courseH), stonesFrom: from, detail: Math.min(2, detail + 1), rng: chRng });
    const lean = chRng.rangeF(0.05, 0.1) * -s;
    bend(cs.shape, { along: 1, dir: 0, from: 0, length: cs.height, amount: lean });
    emit(mesh, 'stone', cs.shape, { matrix: at(ch.x, 0, ch.z), color: vc(hex(pal.stone[1]), { useTag: true, groundAO: 0.2, underside: 0.2 }) });
    copperCowl(mesh, at(ch.x + lean, cs.height - 0.03, ch.z), { detail, copper, snowColor: snow, rng: chRng });
    const fx = sv.x - 0.3 * s;
    copperFlue(mesh, R, { path: [[fx, 0.5, sv.z - 0.32], [fx, 0.9, sv.z - 0.44], [fx - 0.02 * s, 1.18, sv.z - 0.62], [fx - 0.03 * s, 1.3, ch.z + 0.26]], detail, copper });
  }

  if (d.bay) {
    const y = d.bay;
    const bay = leanTo(mesh, R, { ...y, detail, rng: rng.child('bay'), stoneColor: stone, boardColor: scaleC(boards, 1.1), trimColor: trim, roofColor: roof, woodColor: dark, snowColor: snow });
    const bn = d.bench;
    bottlingBench(mesh, at(bn.x, 0, bn.z), { width: bn.width, detail, rng: rng.child('bench'), wood: dark, top: wood, copper, iron });
    caskPair(mesh, at(d.casks.x, 0, d.casks.z), { detail: Math.min(2, detail + 1), rng: rng.child('casks'), wood: hex('#cf9864'), darkWood: dark, iron });
    const xr = (y.xWall + y.xOuter) / 2;
    canvasRoll(mesh, at(xr, bay.roofY(xr) - 0.17, y.zFront + 0.02), { length: Math.abs(y.xOuter - y.xWall) - 0.3, detail, rng: rng.child('roll'), color: hex(st.canvas), strapColor: dark });
  }
  return mesh;
}
