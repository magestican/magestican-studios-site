
















import { emit, blob, deform } from '../../mesh/bevel.mjs';
import { compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { vc, vary } from './shade.mjs';
import { rod } from './rod.mjs';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (a, b, x) => clamp01((x - a) / (b - a));

export function timberFrame(mesh, m, { W, D, base = 0.3, wallH, rise, ridge = 'x', door = { x: 0, w: 0.8, h: 1.5 }, progress = 0.65, detail = 0, rng, color }) {
  const p = clamp01(progress);
  const d = detail === 0 ? 0 : 1;
  const wood = () => vc(vary(rng, color, 0.08), { groundAO: 0.2, groundFade: 0.4 });
  const beam = (a, b, { up = [0, 1, 0], w = 0.12, h = 0.12 } = {}) => emit(mesh, 'wood', rod({ path: [a, b], w, h, detail: d, up }), { matrix: m, color: wood() });
  const post = (x, z, h, lean = 0) => { if (h > 0.08) beam([x, base - 0.02, z], [x + lean, base + h, z], { up: [0, 0, 1], w: 0.13, h: 0.13 }); };
  const hw = W / 2, hd = D / 2, ys = base + 0.05, top = base + wallH;

  beam([-hw - 0.06, ys, hd], [hw + 0.06, ys, hd]);
  beam([-hw - 0.06, ys, -hd], [hw + 0.06, ys, -hd]);
  beam([hw, ys + 0.01, -hd - 0.06], [hw, ys, hd + 0.06], { up: [0, 1, 0] });
  beam([-hw, ys, -hd - 0.06], [-hw, ys + 0.01, hd + 0.06], { up: [0, 1, 0] });

  const g1 = ramp(0, 0.45, p) * wallH;
  for (const [x, z] of [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) post(x, z, g1, rng.rangeF(-0.02, 0.02));
  if (detail === 2) {
    if (p >= 0.5) { beam([-hw - 0.08, top, hd], [hw + 0.08, top, hd]); beam([-hw - 0.08, top, -hd], [hw + 0.08, top, -hd]); }
  } else {
    const g2 = ramp(0.12, 0.55, p) * wallH;
    const jamb = door.w / 2 + 0.08;
    post(door.x - jamb, hd, Math.min(g2, door.h + 0.08));
    post(door.x + jamb, hd, Math.min(g2, door.h + 0.08));
    if (g2 >= door.h) beam([door.x - jamb - 0.06, base + door.h + 0.08, hd], [door.x + jamb + 0.06, base + door.h + 0.08, hd], { h: 0.1 });
    post(rng.rangeF(-0.25, 0.25), -hd, g2);
    post(hw, rng.rangeF(-0.2, 0.2), g2 * 0.97);
    if (p > 0.35) {
      const u = ramp(0.35, 0.55, p);
      beam([-hw, ys + 0.05, -hd + 0.1], [-hw, ys + 0.05 + (wallH * 0.8) * u, -hd + 0.1 + (D * 0.6) * u], { up: [1, 0, 0], w: 0.09, h: 0.1 });
      beam([hw - 0.1, ys + 0.05, -hd], [hw - 0.1 - (W * 0.55) * u, ys + 0.05 + (wallH * 0.8) * u, -hd], { up: [0, 0, 1], w: 0.09, h: 0.1 });
    }
    if (p >= 0.5) { beam([-hw - 0.08, top, hd], [hw + 0.08, top, hd]); beam([-hw - 0.08, top + 0.01, -hd], [hw + 0.08, top, -hd]); }
    if (p >= 0.56) { beam([hw, top + 0.06, -hd - 0.08], [hw, top + 0.06, hd + 0.08]); beam([-hw, top + 0.06, -hd - 0.08], [-hw, top + 0.07, hd + 0.08]); }
  }

  const alongX = ridge === 'x';
  const len = alongX ? W : D, span = alongX ? hd : hw;
  const pairs = detail === 0 ? 4 : detail === 1 ? 3 : 2;
  const shown = Math.round(pairs * ramp(0.6, 0.9, p));
  const peak = top + rise;
  for (let i = 0; i < shown; i++) {
    const s = -len / 2 + 0.1 + ((len - 0.2) * i) / (pairs - 1);
    for (const side of [-1, 1]) {
      const eave = alongX ? [s, top + 0.08, side * (span + 0.14)] : [side * (span + 0.14), top + 0.08, s];
      const apex = alongX ? [s, peak, 0] : [0, peak, s];
      beam(eave, apex, { up: alongX ? [1, 0, 0] : [0, 0, 1], w: 0.08, h: 0.12 });
    }
  }
  if (p >= 0.92) beam(alongX ? [-hw - 0.2, peak + 0.04, 0] : [0, peak + 0.04, -hd - 0.2], alongX ? [hw + 0.2, peak + 0.02, 0] : [0, peak + 0.02, hd + 0.2], { w: 0.12, h: 0.1 });
}

export function scaffold(mesh, m, { width = 1.8, height = 2.3, depth = 0.7, detail = 0, rng, poleColor, plankColor }) {
  const d = detail === 0 ? 0 : 1;
  const hw = width / 2;
  for (const [x, z] of [[-hw, 0.08], [hw, 0.08], [-hw, depth], [hw, depth]]) {
    const pole = rod({ path: [[x, -0.03, z], [x + rng.rangeF(-0.03, 0.03), height + rng.rangeF(-0.05, 0.12), z + rng.rangeF(-0.02, 0.02)]], w: 0.08, detail: d, up: [0, 0, 1], sides: detail === 0 ? 6 : 4 });
    emit(mesh, 'wood', pole, { matrix: m, color: vc(vary(rng, poleColor, 0.06), { groundAO: 0.25 }) });
  }
  const lifts = detail === 2 ? [height * 0.85] : [height * 0.45, height * 0.88];
  lifts.forEach((y, li) => {
    for (const z of [0.08, depth]) {
      emit(mesh, 'wood', rod({ path: [[-hw - 0.1, y, z + 0.05], [hw + 0.1, y + rng.rangeF(-0.02, 0.02), z + 0.05]], w: 0.06, detail: d, sides: 4 }), { matrix: m, color: vc(poleColor, { groundAO: 0 }) });
    }
    if (detail === 2 || (detail === 1 && li === 0)) return;
    for (const f of [0.3, 0.72]) {
      const z = 0.08 + (depth - 0.08) * f + rng.rangeF(-0.02, 0.02);
      const board = rod({ path: [[-hw - 0.14 + rng.rangeF(0, 0.08), y + 0.075, z], [hw + 0.14 - rng.rangeF(0, 0.08), y + 0.075 + rng.rangeF(-0.01, 0.01), z]], w: 0.035, h: (depth - 0.08) * 0.4, detail: d });
      emit(mesh, 'plank', board, { matrix: m, color: vc(vary(rng, plankColor, 0.06), { groundAO: 0, underside: 0.4 }) });
    }
  });
  if (detail < 2) emit(mesh, 'wood', rod({ path: [[-hw, 0.12, depth + 0.1], [hw, lifts[lifts.length - 1] - 0.05, depth + 0.1]], w: 0.055, detail: d, sides: 4 }), { matrix: m, color: vc(poleColor, { groundAO: 0.2 }) });
}

export function plankStack(mesh, m, { length = 1.4, count = 4, detail = 0, rng, color, sleeperColor, snowColor = null }) {
  const d = detail === 0 ? 0 : 1;
  const n = detail === 2 ? 2 : count;
  if (detail < 2) {
    for (const x of [-length * 0.3, length * 0.28]) emit(mesh, 'wood', rod({ path: [[x, 0.035, -0.2], [x + rng.rangeF(-0.03, 0.03), 0.035, 0.2]], w: 0.08, h: 0.09, detail: 1 }), { matrix: m, color: vc(sleeperColor, { groundAO: 0.4 }) });
  }
  let y = detail === 2 ? 0.03 : 0.1;
  for (let i = 0; i < n; i++) {
    const a = rng.rangeF(-0.06, 0.06), dx = rng.rangeF(-0.07, 0.07), dz = rng.rangeF(-0.03, 0.03);
    const board = rod({ path: [[-length / 2, y, 0], [length / 2, y + rng.rangeF(-0.004, 0.004), 0]], w: 0.045, h: 0.24, detail: d });
    emit(mesh, 'plank', board, { matrix: compose(m, compose(translate(dx, 0, dz), rotateY(a))), color: vc(vary(rng, color, 0.07), { groundAO: 0.25, underside: 0.45 }) });
    y += 0.047;
  }
  if (snowColor && detail < 2) {
    const snow = blob({ radii: [length * 0.42, 0.05, 0.13], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.2, flats: [{ n: [0, -1, 0], d: 0.2, k: 0.2 }] });
    deform(snow, (q) => { q[1] += y + 0.01; });
    emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
  return { top: y };
}
