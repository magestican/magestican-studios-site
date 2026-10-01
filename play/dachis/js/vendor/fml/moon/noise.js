






export function hash3(x, y, z, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1440670441) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  h = Math.imul(h, 2654435761);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;


export function valueNoise3(x, y, z, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz, seed);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

export function valueNoise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = fade(x - xi), v = fade(y - yi);
  const c = (dx, dy) => hash3(xi + dx, yi + dy, 0, seed);
  return lerp(lerp(c(0, 0), c(1, 0), u), lerp(c(0, 1), c(1, 1), u), v);
}


export function valueNoise2Tile(x, y, p, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = fade(x - xi), v = fade(y - yi);
  const c = (dx, dy) => hash3(mod(xi + dx, p), mod(yi + dy, p), 0, seed);
  return lerp(lerp(c(0, 0), c(1, 0), u), lerp(c(0, 1), c(1, 1), u), v);
}


export function fbm3(x, y, z, { octaves = 4, lacunarity = 2, gain = 0.5, seed = 0 } = {}) {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise3(x * f, y * f, z * f, seed + o * 101);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}


export function fbm2Tile(u, v, p, { octaves = 4, gain = 0.5, seed = 0 } = {}) {
  let sum = 0, amp = 1, norm = 0, period = p;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2Tile(u * period, v * period, period, seed + o * 101);
    norm += amp;
    amp *= gain;
    period *= 2;
  }
  return sum / norm;
}
