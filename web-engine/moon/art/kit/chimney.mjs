










import { Shape } from '../../mesh/bevel.mjs';

export function chimney({ width = 0.72, depth = 0.62, courseH = 0.3, courses = 4, stonesFrom = 0, detail = 0, rng }) {
  const s = new Shape();
  const stones = detail === 0 ? 4 : detail === 1 ? 3 : 0;
  const M = stones ? stones * 3 : 8;
  const e = 3.2, g = 0.035;
  const TWO_PI = Math.PI * 2;
  const point = (th, y, disp) => {
    const c = Math.cos(th), sn = Math.sin(th);
    const r = 1 / Math.pow(Math.abs(c) ** e + Math.abs(sn) ** e, 1 / e);
    const k = 1 + disp / ((width + depth) / 4);
    return [(width / 2) * r * sn * k, y, (depth / 2) * r * c * k];
  };
  const ring = (y, offset, fn, pinch = 1) => {
    const idx = [], ang = [];
    for (let j = 0; j <= M; j++) {
      const th = ((j + offset) / M) * TWO_PI;
      const [disp, tag, dy = 0] = fn(j % M);
      const p = point(th, y + dy, disp);
      p[0] *= pinch; p[2] *= pinch;
      idx.push(j === M ? s.add(s.p[idx[0]], [(th / TWO_PI) * 2.6, y], tag) : s.add(p, [(th / TWO_PI) * 2.6, y], tag));
      ang.push(th);
    }
    return { idx, ang };
  };
  const quads = (A, B) => { for (let j = 0; j < M; j++) s.quad(A.idx[j], A.idx[j + 1], B.idx[j + 1], B.idx[j]); };
  const stitch = (A, B) => {
    let i = 0, j = 0;
    while (i < M || j < M) {
      if (j >= M || (i < M && A.ang[i + 1] <= B.ang[j + 1])) { s.tri(A.idx[i], A.idx[i + 1], B.idx[j]); i++; } else { s.tri(A.idx[i], B.idx[j + 1], B.idx[j]); j++; }
    }
  };

  const topY = stonesFrom + courses * courseH;
  let prevTop = ring(0, 0, () => [-g, 0.6]);
  let offset = 0;
  if (!stones) {
    const b = ring(topY, 0, () => [-0.01, 0.92]);
    quads(prevTop, b);
    prevTop = b;
  } else {
    for (let k = 0; k < courses; k++) {
      offset = k % 2 ? 0.5 : 0;
      const shift = k % 2 ? 2 : 0;
      const bulge = Array.from({ length: stones }, () => rng.rangeF(0.012, 0.05));
      const value = Array.from({ length: stones }, () => rng.rangeF(0.82, 1.14));
      const hJit = Array.from({ length: stones }, () => rng.rangeF(-0.03, 0.03));
      const role = (j) => (j + shift) % 3;
      const stone = (j) => Math.floor((j + shift) / 3) % stones;
      const y0 = stonesFrom + k * courseH, y1 = y0 + courseH;
      const bottom = ring(y0 + 0.02, offset, (j) => [role(j) === 0 ? -g : -g * 0.4, (role(j) === 0 ? 0.55 : 0.78) * value[stone(j)]]);
      const mid = ring(y0 + courseH * 0.5, offset, (j) => [role(j) === 0 ? -g * 0.7 : bulge[stone(j)], (role(j) === 0 ? 0.68 : 1.04) * value[stone(j)], hJit[stone(j)]]);
      const top = ring(y1 - 0.02, offset, (j) => [role(j) === 0 ? -g : -g * 0.4, (role(j) === 0 ? 0.55 : 0.8) * value[stone(j)]]);
      if (k === 0 && offset === 0) quads(prevTop, bottom); else stitch(prevTop, bottom);
      quads(bottom, mid);
      quads(mid, top);
      prevTop = top;
    }
  }
  const rim = ring(topY + 0.06, offset, () => [0.015, 0.95]);
  quads(prevTop, rim);
  const throat = ring(topY + 0.02, offset, () => [0, 0.3], 0.74);
  quads(rim, throat);
  const pole = s.add([0, topY - 0.3, 0], [0, 0], 0.16);
  for (let j = 0; j < M; j++) s.tri(throat.idx[j], throat.idx[j + 1], pole);
  return { shape: s, height: topY + 0.06 };
}
