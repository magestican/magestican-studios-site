







import { fbm2Tile, hash3 } from '../noise.mjs';



export const SURFACE = Object.freeze({ roughness: 0.9, metalness: 0, rim: 0.35, size: 1024 });

export function paint({ size = SURFACE.size } = {}) {
  const n = size;
  const val = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      val[y * n + x] = 0.915 + 0.09 * (fbm2Tile(x / n, y / n, 6, { octaves: 3, seed: 7 }) - 0.5);
    }
  }

  const k = n / 1024;
  const width = Math.max(0.75, 1.25 * k);
  const inv = 1 / (width * width);
  const spacing = 0.6;
  const norm = spacing / (width * Math.sqrt(Math.PI));
  const strokes = Math.floor((n * n) / 150);
  const rnd = (i, j) => hash3(i, j, 0, 9001);
  for (let s = 0; s < strokes; s++) {
    const x0 = rnd(s, 1) * n, y0 = rnd(s, 2) * n;
    const sway = (fbm2Tile(x0 / n, y0 / n, 3, { octaves: 2, seed: 21 }) - 0.5) * 1.1;
    const ang = sway + (rnd(s, 3) - 0.5) * 0.45;
    const dx = Math.sin(ang), dy = Math.cos(ang);
    const len = (10 + rnd(s, 4) * 22) * k;
    
    const amp = (rnd(s, 5) < 0.6 ? 1 : -1.2) * (0.03 + rnd(s, 6) * 0.04);
    const steps = Math.max(2, Math.ceil(len / spacing));
    for (let t = 0; t <= steps; t++) {
      const f = t / steps;
      const profile = f < 0.2 ? f / 0.2 : 1 - (f - 0.2) / 0.8;
      const a = amp * profile * norm;
      const px = x0 + dx * len * f, py = y0 + dy * len * f;
      const ix0 = Math.floor(px - 2), iy0 = Math.floor(py - 2);
      for (let iy = iy0; iy <= iy0 + 4; iy++) {
        const ddy = iy - py;
        const row = (((iy % n) + n) % n) * n;
        for (let ix = ix0; ix <= ix0 + 4; ix++) {
          const ddx = ix - px;
          const w = Math.exp(-(ddx * ddx + ddy * ddy) * inv);
          val[row + (((ix % n) + n) % n)] += a * w;
        }
      }
    }
  }

  const data = new Uint8ClampedArray(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    const v = Math.round(255 * Math.min(0.985, Math.max(0.76, val[i])));
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  return { width: n, height: n, data };
}
