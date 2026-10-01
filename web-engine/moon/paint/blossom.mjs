




import { SeededRng } from '../../rng/seededRng.js';
import { ATLAS, canvas, leaf, toImage, bandRect, cellRect } from './leaf.mjs';

export { ATLAS };
export const SURFACE = { roughness: 0.8, metalness: 0, doubleSide: false, alphaTest: 0.5, size: 512 }; 

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function flower(cv, { cx, cy, R, rot, tone = 1, rect, wrap = false }) {
  const { size, val, alpha, warm } = cv;
  const TAU = Math.PI * 2, sector = TAU / 5;
  const pass = (ox, oy, grow, fn) => {
    for (let y = Math.floor(cy - R - 3); y <= Math.ceil(cy + R + 3); y++) {
      for (let x = Math.floor(cx - R - 3); x <= Math.ceil(cx + R + 3); x++) {
        let px = x, py = y;
        if (wrap) {
          px = rect.x0 + (((x - rect.x0) % rect.w) + rect.w) % rect.w;
          py = rect.y0 + (((y - rect.y0) % rect.h) + rect.h) % rect.h;
        } else if (x < rect.x0 || y < rect.y0 || x >= rect.x0 + rect.w || y >= rect.y0 + rect.h) continue;
        const dx = x + 0.5 - cx - ox, dy = y + 0.5 - cy - oy;
        const r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx) - rot;
        const rel = ((((ang % sector) + sector) % sector) - sector / 2);
        let pr = R * (0.5 + 0.5 * Math.sqrt(Math.max(0, Math.cos(rel * 2.5))));
        pr *= 1 - 0.13 * Math.exp(-((rel * 9) ** 2));
        pr += grow;
        const cov = clamp(pr - r + 0.5, 0, 1);
        if (cov <= 0) continue;
        fn(py * size + px, cov, r / Math.max(pr, 1e-3), rel);
      }
    }
  };
  pass(1.5, -2.5, 1.2, (i, cov) => { val[i] *= 1 - 0.25 * cov; });
  pass(0, 0, 0, (i, cov, q, rel) => {
    let v = tone * (0.76 + 0.24 * smooth(0.12, 0.75, q));
    v *= 1 - 0.14 * smooth(0.55, 1, Math.abs(rel) / (sector / 2)) * smooth(0.2, 0.5, q);
    v *= 1 - 0.1 * smooth(0.85, 1, q);
    let w = 0;
    if (q < 0.2) { w = smooth(0.2, 0.08, q); v = v * (1 - w) + 0.95 * w; }
    val[i] = val[i] * (1 - cov) + clamp(v, 0.3, 1) * cov;
    warm[i] = warm[i] * (1 - cov) + w * cov;
    alpha[i] = Math.max(alpha[i], cov);
  });
}

export function paint({ size = 512 } = {}) {
  const s = size / 512;
  const cv = canvas(size);
  const rng = new SeededRng(9127);
  const band = bandRect(size);
  for (let y = band.y0; y < band.y0 + band.h; y++) {
    for (let x = 0; x < size; x++) { cv.val[y * size + x] = 0.74; cv.alpha[y * size + x] = 1; }
  }
  for (let k = 0; k < 40; k++) {
    const len = rng.rangeF(30, 46) * s;
    leaf(cv, { bx: rng.rangeF(0, band.w), by: rng.rangeF(0, band.h), a: rng.rangeF(0, 6.283), len, wid: len * 0.48, tone: 0.78, rect: band, wrap: true, shadow: 0.1 });
  }
  for (let k = 0; k < 230; k++) {
    flower(cv, { cx: rng.rangeF(0, band.w), cy: rng.rangeF(0, band.h), R: rng.rangeF(13, 21) * s, rot: rng.rangeF(0, 6.283), tone: rng.rangeF(0.85, 1), rect: band, wrap: true });
  }
  const specs = [{ cell: ATLAS.cells[0], flowers: 9 }, { cell: ATLAS.cells[1], flowers: 6 }];
  for (const c of specs) {
    const r = cellRect(size, c.cell);
    const cyc = r.y0 + r.h * (c.cell.anchor > 0.4 ? 0.5 : 0.56);
    const bx = r.x0 + r.w / 2, by = c.cell.anchor > 0.4 ? cyc : r.y0 + r.h * 0.08;
    leaf(cv, { bx, by, a: Math.PI / 2 - 0.9 + (c.cell.anchor > 0.4 ? Math.PI : 0), len: r.h * 0.42, wid: r.h * 0.2, tone: 0.66, rect: r });
    leaf(cv, { bx, by, a: Math.PI / 2 + 0.8, len: r.h * 0.38, wid: r.h * 0.18, tone: 0.62, rect: r });
    for (let k = 0; k < c.flowers + 3; k++) {
      const ang = rng.rangeF(0, Math.PI * 2), rad = Math.sqrt(rng.next()) * r.w * 0.26;
      const R = r.w * rng.rangeF(0.13, 0.19);
      flower(cv, {
        cx: r.x0 + r.w / 2 + Math.cos(ang) * rad, cy: cyc + Math.sin(ang) * rad * 1.05,
        R: Math.min(R, r.w * 0.22), rot: rng.rangeF(0, 6.283), tone: rng.rangeF(0.88, 1), rect: r,
      });
    }
  }
  return toImage(cv);
}
