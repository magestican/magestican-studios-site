







import { CELL } from '../../../web-engine/lamps/lampsMatch.js';
import { roomAt } from '../../../web-engine/lamps/lampsBlock.js';

export const AXES = Object.freeze(['x', 'y', 'z']);


export const TONE = Object.freeze({ OPEN: 0, SHORT: 1, CLOSED: 2 });


export const ATLAS_COLS = 7;
export const ATLAS_ROWS = 3;
export const clueTile = ({ count, groups }) => (count > 0 ? (groups - 1) * ATLAS_COLS + count : 0);


export const TAP_SLOP_PX = 8;


export function faceLinesOf(view) {
  const faces = new Int16Array(view.state.length * 3).fill(-1);
  view.lines.forEach((line, li) => {
    const axis = AXES.indexOf(line.axis);
    for (const cell of line.cells) faces[cell * 3 + axis] = li;
  });
  return faces;
}

export function lineTone(view, li) {
  if (view.closedLines[li]) return TONE.CLOSED;
  const { cells, count } = view.lines[li];
  const lit = cells.reduce((n, i) => n + (view.state[i] === CELL.LIT ? 1 : 0), 0);
  return count - lit === 1 ? TONE.SHORT : TONE.OPEN;
}


export const NO_CUT = Object.freeze({ axis: null, layers: 0 });


export const maxCut = (dims, axis) => Math.max(0, dims[AXES.indexOf(axis)] - 1);

export function cutHides(dims, cut, [x, y, z]) {
  if (!cut?.axis || cut.layers <= 0) return false;
  if (cut.axis === 'x') return x >= dims[0] - cut.layers;
  if (cut.axis === 'y') return y >= dims[1] - cut.layers;
  return z < cut.layers;
}


export function roomStands(view, i, cut = NO_CUT) {
  const st = view.state[i];
  if (st === CELL.SHUT || st === CELL.FUSED) return false;
  return !cutHides(view.dims, cut, roomAt(view.dims, i));
}

export function roomCentre([X, Y, Z], [x, y, z]) {
  return [x - (X - 1) / 2, y - (Y - 1) / 2, (Z - 1) / 2 - z];
}





export function pickRoom(origin, dir, dims, stands, half = 0.5) {
  const count = dims[0] * dims[1] * dims[2];
  let best = null;
  for (let i = 0; i < count; i += 1) {
    if (!stands(i)) continue;
    const c = roomCentre(dims, roomAt(dims, i));
    let near = -Infinity;
    let far = Infinity;
    let axis = 0;
    for (let k = 0; k < 3; k += 1) {
      if (Math.abs(dir[k]) < 1e-9) {
        if (Math.abs(origin[k] - c[k]) > half) { near = Infinity; break; }
        continue;
      }
      const a = (c[k] - half - origin[k]) / dir[k];
      const b = (c[k] + half - origin[k]) / dir[k];
      const lo = Math.min(a, b);
      if (lo > near) { near = lo; axis = k; }
      far = Math.min(far, Math.max(a, b));
    }
    if (near > far || far < 0 || near === Infinity) continue;
    if (!best || near < best.t) best = { room: i, t: near, axis: AXES[axis] };
  }
  return best;
}
