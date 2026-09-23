











import { surface, sweep, roundedRectProfile, deform, clamp } from '../../mesh/bevel.mjs';
import { valueNoise3 } from '../../noise.mjs';





export function wallPanel({ width, height, plankH = 0.26, lap = 0.045, detail = 0, rng, gable = null, bulge = 0.03, cols = 6, flat = false }) {
  if (flat) bulge = 0;
  const wobK = flat ? 0 : 1;
  const topY = gable ? gable.ridgeY - 0.1 : height;
  const eaveY = gable ? gable.eaveY : height;
  const halfWidth = (y) => (y <= eaveY || !gable ? width / 2 : (width / 2) * Math.max(0.05, (gable.ridgeY - y) / (gable.ridgeY - eaveY)));
  const rows = [];
  const tileH = 4 * plankH;
  const n = Math.ceil(topY / plankH);
  for (let k = 0; k < n; k++) {
    const y0 = k * plankH;
    const jit = rng.rangeF(0.75, 1.25), shade = rng.rangeF(0.92, 1.06);
    const tilt = rng.rangeF(-1, 1) * lap * 0.4, droop = rng.rangeF(0, 0.012);
    const add = (y, z, ao) => { if (y < topY - 0.02) rows.push({ y, z, ao: ao * shade, tilt: tilt * wobK, droop: droop * wobK, v: y / tileH }); };
    if (detail === 0) {
      add(y0, 0, 0.62);
      add(y0 + 0.07 * plankH, lap * 0.72 * jit, 0.92);
      add(y0 + 0.36 * plankH, lap * jit, 1.1);
    } else if (detail === 1) {
      add(y0, 0, 0.68);
      add(y0 + 0.14 * plankH, lap * jit, 1.02);
    } else if (k === 0) {
      add(0, lap * 0.5, 0.95);
    }
  }
  if (gable && !rows.some((r) => Math.abs(r.y - eaveY) < 0.03) && eaveY < topY) {
    const at = rows.findIndex((r) => r.y > eaveY);
    const prev = rows[Math.max(0, at - 1)];
    const row = { ...prev, y: eaveY, z: lap * 0.55, ao: 0.95, v: eaveY / tileH };
    if (at < 0) rows.push(row); else rows.splice(at, 0, row);
  }
  rows.push({ y: topY, z: detail === 2 ? lap * 0.5 : 0, ao: 0.82, tilt: 0, droop: 0, v: topY / tileH });

  const us = [];
  const c = detail === 2 ? Math.max(2, Math.ceil(cols / 3)) : detail === 1 ? Math.max(3, cols - 2) : cols;
  for (let i = 0; i <= c; i++) us.push(-1 + (2 * i) / c);
  const seed = rng.rangeI(1, 1e6);
  return surface({
    us,
    vs: rows.map((_, j) => j),
    at: (u, j) => {
      const r = rows[j];
      const x = u * halfWidth(r.y);
      const belly = bulge * (1 - u * u) * Math.sin(Math.PI * clamp(r.y / topY));
      const wob = (valueNoise3(x * 1.3, r.y * 3.1, 0, seed) - 0.5) * 0.012 * wobK;
      return [x, r.y - r.droop * (1 - u * u) + wob, r.z + r.tilt * u + belly];
    },
    uv: (u, j, p) => [p[0] / tileH, rows[j].v],
    tag: (u, j) => rows[j].ao,
  });
}





export function plinth({ width, depth, height = 0.44, thickness = 0.32, detail = 0, rng }) {
  const corners = roundedRectProfile(width + thickness * 0.2, depth + thickness * 0.2, 0.32, 1);
  const stoneLen = detail === 0 ? 0.72 : detail === 1 ? 1.3 : 99;
  const path = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i], b = corners[(i + 1) % corners.length];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / stoneLen));
    for (let k = 0; k < n; k++) path.push([a[0] + ((b[0] - a[0]) * k) / n, height / 2 - 0.03, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const bulge = path.map((_, i) => (i % 2 ? rng.rangeF(-0.03, 0) : rng.rangeF(0.02, 0.06)));
  const value = path.map((_, i) => (i % 2 ? 0.72 : rng.rangeF(0.9, 1.12)));
  const s = sweep({
    profile: roundedRectProfile(height, thickness, 0.11, 0), path, closed: true, up: [0, 1, 0], uvScale: 0.8,
    scales: (t, i) => [1 + bulge[i] * 0.6, 1 + bulge[i]],
  });
  const seed = rng.rangeI(1, 1e6);
  const per = path.length;
  const rowLen = s.p.length / (per + 1);
  s.tag = s.tag.map((_, v) => value[Math.floor(v / rowLen) % per]);
  return deform(s, (p) => {
    const lump = (valueNoise3(p[0] * 2.2, p[1] * 2.2, p[2] * 2.2, seed) - 0.5) * 0.05;
    if (p[1] > 0) p[1] += lump;
    p[0] *= 1 + lump * 0.1;
  });
}
