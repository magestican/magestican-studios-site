






import { MeshData } from 'moon/mesh/meshData.mjs';
import { FOOTPRINTS, PLOT_SIGN } from 'moon/world/collision.mjs';
import { toObject3D } from '../render/toMesh.js';



const FACES = [
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
];
function box(md, material, [cx, cy, cz], [hx, hy, hz], color) {
  const h = [hx, hy, hz];
  const dot = (a) => Math.abs(a[0]) * h[0] + Math.abs(a[1]) * h[1] + Math.abs(a[2]) * h[2];
  for (const [n, u, v] of FACES) {
    const hn = dot(n), hu = dot(u), hv = dot(v);
    const idx = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => md.vertex(material, [
      cx + n[0] * hn + u[0] * hu * a + v[0] * hv * b,
      cy + n[1] * hn + u[1] * hu * a + v[1] * hv * b,
      cz + n[2] * hn + u[2] * hu * a + v[2] * hv * b,
    ], n, color, [(a + 1) / 2, (b + 1) / 2]));
    md.tri(material, idx[0], idx[1], idx[2]);
    md.tri(material, idx[0], idx[2], idx[3]);
  }
}

const BOARD = [0.86, 0.78, 0.62];
const DARK = [0.45, 0.36, 0.3];
const ROPE = [0.93, 0.9, 0.82];

function plotMesh() {
  const f = FOOTPRINTS.processor.level1;
  const md = new MeshData('build-plot');
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(md, 'wood', [sx * f.halfXM, 0.25, sz * f.halfZM], [0.05, 0.25, 0.05], BOARD);
  box(md, 'cloth', [0, 0.36, f.halfZM], [f.halfXM, 0.015, 0.015], ROPE);
  box(md, 'cloth', [0, 0.36, -f.halfZM], [f.halfXM, 0.015, 0.015], ROPE);
  box(md, 'cloth', [f.halfXM, 0.36, 0], [0.015, 0.015, f.halfZM], ROPE);
  box(md, 'cloth', [-f.halfXM, 0.36, 0], [0.015, 0.015, f.halfZM], ROPE);
  box(md, 'wood', [PLOT_SIGN.xM, 0.55, PLOT_SIGN.zM], [0.05, 0.55, 0.05], DARK);
  box(md, 'plank', [PLOT_SIGN.xM, 1.05, PLOT_SIGN.zM + 0.06], [0.42, 0.24, 0.03], BOARD);
  return md;
}

export const plotProblems = [];

let plot = null;
export async function plotObject() {
  if (!plot) {
    const md = plotMesh();
    plotProblems.push(...md.validate());
    plot = await toObject3D(md);
    plot.userData.triangles = md.triangleCount;
  }
  return plot.clone();
}
