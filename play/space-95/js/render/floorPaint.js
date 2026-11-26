


const lcg = (seed) => {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));


function normals(h, n, k) {
  const out = new Uint8ClampedArray(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const at = (dx, dy) => h[((y + dy + n) % n) * n + ((x + dx + n) % n)];
      const gx = (at(1, 0) - at(-1, 0)) * k;
      const gy = (at(0, 1) - at(0, -1)) * k;
      const l = Math.hypot(gx, gy, 1);
      const i = (y * n + x) * 4;
      out[i] = 128 - (127 * gx) / l;
      out[i + 1] = 128 - (127 * gy) / l;
      out[i + 2] = 128 + 127 / l;
      out[i + 3] = 255;
    }
  return out;
}

const TONES = [
  [243, 234, 214], 
  [158, 214, 196], 
];


export function kitchenTiles(n = 256) {
  const q = n / 2;
  const rnd = lcg(1313);
  const color = new Uint8ClampedArray(n * n * 4);
  const h = new Float32Array(n * n);
  const vary = [0, 1, 2, 3].map(() => (rnd() - 0.5) * 14);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const tx = Math.floor(x / q);
      const ty = Math.floor(y / q);
      const u = x % q;
      const v = y % q;
      const d = Math.min(u, v, q - 1 - u, q - 1 - v);
      const i = (y * n + x) * 4;
      const ht = smooth((d - 2) / 7);
      h[y * n + x] = ht;
      let c;
      if (d < 2) c = [150, 138, 118].map((g) => g + (rnd() - 0.5) * 16);
      else {
        const tone = TONES[(tx + ty) % 2];
        
        const lit = ht < 1 ? (d === u || d === v ? 26 : -30) * (1 - ht) : 0;
        const sheen = Math.max(0, 1 - Math.abs(u - v - q * 0.25) / (q * 0.12)) * (u + v < q ? 16 : 0);
        const m = vary[ty * 2 + tx] + (rnd() - 0.5) * 7;
        c = tone.map((g) => g + lit + sheen + m);
      }
      color.set(c, i);
      color[i + 3] = 255;
    }
  return { size: n, color, normal: normals(h, n, 3) };
}


export function officeCarpet(n = 128) {
  const rnd = lcg(4646);
  const color = new Uint8ClampedArray(n * n * 4);
  const h = new Float32Array(n * n);
  const L = 4; 
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const row = Math.floor(y / L);
      const ox = (row % 2) * (L / 2);
      const lx = ((x + ox) % L) - L / 2 + 0.5;
      const ly = (y % L) - L / 2 + 0.5;
      const loop = Math.max(0, 1 - Math.hypot(lx, ly) / (L * 0.62));
      h[y * n + x] = loop;
      const stripe = Math.floor(y / (L * 4)) % 2 ? 10 : -6;
      const f = rnd();
      const fleck = f < 0.025 ? 40 : f < 0.06 ? -22 : 0;
      const s = loop * 44 - 22 + stripe + fleck;
      color.set([86 + s, 96 + s, 126 + s * 1.1, 255], (y * n + x) * 4);
    }
  return { size: n, color, normal: normals(h, n, 2.4) };
}
