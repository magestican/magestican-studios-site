






import { paintCanvas, cellHash, tileFbm, smoothstep } from '../art/kit/paintUtil.mjs';

export const SURFACE = { roughness: 0.9, metalness: 0, doubleSide: false, alphaTest: 0, emissive: '#000000', emissiveIntensity: 0, size: 512 };
export const ROWS_PER_TILE = 4;
export const TABS_PER_ROW = 4;

function tab(u, row) {
  const x = u * TABS_PER_ROW + (row % 2) * 0.5;
  const i = Math.floor(x);
  const tx = x - i;
  const c = Math.abs(tx - 0.5) * 2;
  return { i: ((i % TABS_PER_ROW) + TABS_PER_ROW) % TABS_PER_ROW, tx, edge: 1 - 0.3 * (1 - Math.sqrt(Math.max(0, 1 - c * c))) };
}

function body(t, row, ty) {
  let val = 0.9 + (cellHash(t.i, row % ROWS_PER_TILE, 9) - 0.5) * 0.16;
  val -= (1 - smoothstep(0, 0.22, ty)) * 0.12;
  val -= (1 - smoothstep(0, 0.05, Math.min(t.tx, 1 - t.tx))) * 0.28;
  val -= smoothstep(t.edge - 0.06, t.edge, ty) * 0.2;
  val += smoothstep(t.edge - 0.3, t.edge - 0.1, ty) * (1 - smoothstep(t.edge - 0.1, t.edge - 0.05, ty)) * 0.06;
  return val;
}

export function paint({ size = SURFACE.size } = {}) {
  return paintCanvas(size, (u, v) => {
    const rowF = v * ROWS_PER_TILE;
    const row = Math.floor(rowF);
    const ty = rowF - row;
    const t = tab(u, row);
    const mottle = (tileFbm(u, v, 3, 3, { octaves: 4, seed: 23 }) - 0.5) * 0.12 + (tileFbm(u, v, 24, 24, { octaves: 2, seed: 5 }) - 0.5) * 0.05;
    if (ty > t.edge) {
      const shadow = 1 - (ty - t.edge) / Math.max(1e-6, 1 - t.edge);
      return body(tab(u, row + 1), row + 1, 0) + mottle - 0.24 * shadow;
    }
    return body(t, row, ty) + mottle;
  });
}
