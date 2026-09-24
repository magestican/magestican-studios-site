





import { Shape, sweep, lathe, roundedRectProfile, circleProfile, emit } from '../../mesh/bevel.mjs';
import { compose, translate, rotateX, applyPoint, applyDir } from '../../mesh/meshData.mjs';
import { vc } from './shade.mjs';




export const DOOR_HINGE = Object.freeze({ kind: 'hinge', max: 1.5, speed: 2.5 });


export function pillow({ outline, insets, zs, centre, centreZ, uv }) {
  const s = new Shape();
  const rings = insets.map((d, r) => outline(d).map(([x, y]) => s.add([x, y, zs[r]], uv([x, y]), r === 0 ? 0.72 : 1)));
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r], B = rings[r + 1], M = A.length;
    for (let k = 0; k < M; k++) s.quad(A[k], A[(k + 1) % M], B[(k + 1) % M], B[k]);
  }
  const c = s.add([centre[0], centre[1], centreZ], uv(centre), 1.04);
  const last = rings[rings.length - 1];
  for (let k = 0; k < last.length; k++) s.tri(last[k], last[(k + 1) % last.length], c);
  return s;
}

export function archOutline(w, h, d, arcSegs) {
  const hw = w / 2 - d, cy = h - w / 2;
  const pts = [[-hw, d], [hw, d], [hw, (d + cy) / 2]];
  for (let k = 0; k <= arcSegs; k++) {
    const a = (k / arcSegs) * Math.PI;
    pts.push([hw * Math.cos(a), cy + hw * Math.sin(a)]);
  }
  pts.push([-hw, (d + cy) / 2]);
  return pts;
}

export function door(mesh, m, { width = 0.95, height = 1.9, detail = 0, rng, color, frameColor, knobColor, ironColor, glassColor, porthole = false, part = null }) {
  const frame = mesh;
  if (part) mesh = frame.part(part, { pivot: applyPoint(m, [-width / 2, 0, 0.04]), axis: applyDir(m, [0, 1, 0]), clip: DOOR_HINGE });
  const arcSegs = detail === 0 ? 6 : detail === 1 ? 4 : 2;
  const insets = detail === 0 ? [0, 0.035, 0.085] : detail === 1 ? [0, 0.06] : [0];
  const zs = [0.015, 0.06, 0.075];
  const tile = 0.88;
  const slab = pillow({
    outline: (d) => archOutline(width, height, d, arcSegs),
    insets, zs,
    centre: [0, (height - width / 2) * 0.75], centreZ: detail === 2 ? 0.05 : 0.08,
    uv: ([x, y]) => [y / tile, x / tile + 0.5],
  });
  emit(mesh, 'plank', slab, { matrix: m, color: vc(color, { useTag: true }) });

  const fw = width / 2 + 0.065, cy = height - width / 2;
  const path = [[-fw, -0.02, 0]];
  for (let k = 0; k <= arcSegs; k++) {
    const a = Math.PI - (k / arcSegs) * Math.PI;
    path.push([fw * Math.cos(a), cy + fw * Math.sin(a), 0]);
  }
  path.push([fw, -0.02, 0]);
  const frameProfile = roundedRectProfile(0.12, 0.14, 0.04, detail === 0 ? 1 : 0).map(([x, y]) => [x + 0.045, y]);
  emit(frame, 'wood', sweep({ profile: frameProfile, path, up: [0, 0, 1], caps: 'none' }), { matrix: m, color: vc(frameColor) });

  if (detail < 2) {
    const knob = lathe({ points: [[0, 0], [0.03, 0.004], [0.042, 0.035], [0.03, 0.06], [0, 0.066]], sides: detail === 0 ? 7 : 5 });
    emit(mesh, 'metal', knob, { matrix: compose(m, compose(translate(width / 2 - 0.15, height * 0.47, 0.07), rotateX(Math.PI / 2))), color: vc(knobColor, { groundAO: 0 }) });
  }
  if (detail === 0) {
    for (const y of [0.32, cy - 0.12]) {
      const strap = sweep({ profile: roundedRectProfile(0.018, 0.055, 0.008, 0), path: [[-width / 2 + 0.04, y, 0.082], [-width / 2 + 0.34 + rng.rangeF(-0.02, 0.02), y + rng.rangeF(-0.01, 0.01), 0.082]], up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: 0.025 });
      emit(mesh, 'metal', strap, { matrix: m, color: vc(ironColor, { groundAO: 0 }) });
    }
  }
  if (porthole && detail < 2) {
    const r = width * 0.17, py = cy + 0.02;
    const glass = new Shape();
    const ring = circleProfile(r, 8).map(([x, y]) => glass.add([x, py + y, 0.09], [x / (2 * r) + 0.5, y / (2 * r) + 0.5]));
    const c = glass.add([0, py, 0.085], [0.5, 0.5]);
    for (let k = 0; k < 8; k++) glass.tri(ring[k], ring[(k + 1) % 8], c);
    emit(mesh, 'glass', glass, { matrix: m, color: glassColor });
    const loop = circleProfile(r + 0.02, detail === 0 ? 8 : 6).map(([x, y]) => [x, py + y, 0.09]);
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.022, 4, Math.PI / 4), path: loop, closed: true, up: [0, 0, 1] }), { matrix: m, color: vc(ironColor, { groundAO: 0 }) });
  }
}
