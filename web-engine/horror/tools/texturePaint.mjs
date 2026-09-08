





















































































export const SIZES = Object.freeze([64, 128, 256]);















export const DEFAULT_GUTTER = 4;
export function gutterFor(mipLevels = 0) {
  if (!Number.isInteger(mipLevels) || mipLevels < 0) throw new TypeError('gutterFor: mipLevels must be a non-negative integer');
  return Math.max(DEFAULT_GUTTER, 2 ** mipLevels);
}





export function hex(h) {
  if (Array.isArray(h)) return h;
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(h));
  if (!m) throw new TypeError(`hex: not a #rrggbb colour: ${h}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function toHex(c) {
  return `#${[c[0], c[1], c[2]].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}
export function luma(c) { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }

export function to15(c) { return [c[0], c[1], c[2]].map((v) => Math.round((Math.round((v / 255) * 31) / 31) * 255)); }



const rgb = (c) => {
  if (typeof c === 'string') return hex(c);
  if (!Array.isArray(c) || c.length < 3) throw new TypeError(`texturePaint: not a colour: ${c} (did you mean palette(...).by.<stop>?)`);
  return c;
};
const key = (r, g, b) => `${r},${g},${b}`;












const RAW = {
  skin: [['#573925', 'dark'], ['#7c5439', 'deep'], ['#a4744f', 'shadow'], ['#cf9d74', 'base'], ['#e3b78d', 'lit'], ['#eec9a2', 'hi']],
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  hair: [['#1a1108', 'dark'], ['#33210f', 'deep'], ['#4d3418', 'shadow'], ['#6b4a24', 'base'], ['#8d6733', 'hi'], ['#a07d42', 'light']],
  plaid: [['#241210', 'black'], ['#5a1f18', 'dark'], ['#9c4436', 'red'], ['#b85a48', 'redLit'], ['#c9a35a', 'mustard'], ['#e2c98a', 'mustardLit']],
  denim: [['#151a29', 'dark'], ['#222c47', 'deep'], ['#2f4068', 'shadow'], ['#3a4f7d', 'base'], ['#5a6f9c', 'lit'], ['#8a9cc0', 'weft']],
  leather: [['#1d120b', 'dark'], ['#3a2416', 'deep'], ['#5a3a22', 'shadow'], ['#7a5230', 'base'], ['#986b41', 'lit'], ['#b5895a', 'hi']],
  brass: [['#3f2c0c', 'dark'], ['#6e4f16', 'deep'], ['#96742a', 'shadow'], ['#b5893f', 'base'], ['#d3ab55', 'lit'], ['#f0d78c', 'hi']],
  steel: [['#22252a', 'dark'], ['#3c4047', 'deep'], ['#585d65', 'shadow'], ['#767c85', 'base'], ['#989ea6', 'lit'], ['#c4c9cf', 'hi']],
  rust: [['#2b170c', 'dark'], ['#4b2711', 'deep'], ['#6c3917', 'shadow'], ['#8c4e20', 'base'], ['#a8652c', 'lit'], ['#c48343', 'hi']],
  concrete: [['#35342f', 'dark'], ['#4c4b45', 'deep'], ['#63625b', 'shadow'], ['#7b7a72', 'base'], ['#93928a', 'lit'], ['#aeada5', 'hi']],
  panel: [['#1f2a1e', 'dark'], ['#33422f', 'deep'], ['#485a41', 'shadow'], ['#5e7254', 'base'], ['#7a8e6d', 'lit'], ['#9aac8c', 'hi']],
  hidePig: [['#4a2f2c', 'dark'], ['#6f4a45', 'deep'], ['#946660', 'shadow'], ['#b3827b', 'base'], ['#c19a92', 'lit'], ['#d9b8b0', 'hi']],
  hideCow: [['#0f0d0f', 'black'], ['#262327', 'blackLit'], ['#4a4548', 'grey'], ['#8f8a83', 'greyLit'], ['#b8b3ab', 'white'], ['#e0dcd3', 'whiteHi']],
  feather: [['#3b2d18', 'dark'], ['#5c4828', 'deep'], ['#7d653a', 'shadow'], ['#9f8551', 'base'], ['#bfa66e', 'lit'], ['#dccb96', 'hi']],
  straw: [['#5a4218', 'dark'], ['#7e5f22', 'deep'], ['#a3822e', 'shadow'], ['#ceb660', 'base'], ['#e0cb7c', 'lit'], ['#efe0a2', 'hi']],
  blood: [['#1a0505', 'rim'], ['#3c0c0c', 'deep'], ['#5e1313', 'base'], ['#7d1c1a', 'lit'], ['#962521', 'fresh']],
  thread: [['#6e4a18', 'dark'], ['#a87a2e', 'shadow'], ['#d9a04a', 'base'], ['#f0c878', 'hi']],
};

const PALETTES = new Map();
export function paletteNames() { return Object.keys(RAW); }
export function palette(name) {
  const cached = PALETTES.get(name);
  if (cached) return cached;
  const raw = RAW[name];
  if (!raw) throw new Error(`palette: no such family "${name}" (have ${paletteNames().join(', ')})`);
  const stops = raw.map(([h]) => Object.freeze(hex(h)));
  const by = {};
  raw.forEach(([, n], i) => { by[n] = stops[i]; });
  const p = Object.freeze({ name, stops: Object.freeze(stops), by: Object.freeze(by) });
  PALETTES.set(name, p);
  return p;
}
const stopsOf = (pal) => (Array.isArray(pal) ? pal.map(rgb) : pal.stops);

export function nearestStop(stops, c) {
  let best = 0; let bd = Infinity;
  for (let i = 0; i < stops.length; i += 1) {
    const s = stops[i];
    const dr = s[0] - c[0]; const dg = s[1] - c[1]; const db = s[2] - c[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}





export function createSheet(width, height, colour = null) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new TypeError(`createSheet: width and height must be positive integers (got ${width}x${height})`);
  }
  const data = new Uint8ClampedArray(width * height * 4);
  const c = colour ? rgb(colour) : [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) { data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255; }
  return { width, height, data };
}


export function createPage(size, colour = null) {
  if (!SIZES.includes(size)) throw new RangeError(`createPage: a page is ${SIZES.join('/')} square, not ${size}`);
  return createSheet(size, size, colour);
}

export function get(sheet, x, y) {
  const i = (y * sheet.width + x) * 4; const d = sheet.data;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
}
export function set(sheet, x, y, c) {
  if (x < 0 || y < 0 || x >= sheet.width || y >= sheet.height) return;
  const i = (y * sheet.width + x) * 4; const d = sheet.data;
  d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c.length > 3 ? c[3] : 255;
}
function box(sheet, rect) {
  if (!rect) return { x: 0, y: 0, w: sheet.width, h: sheet.height };
  const x0 = Math.max(0, rect.x | 0); const y0 = Math.max(0, rect.y | 0);
  const x1 = Math.min(sheet.width, (rect.x | 0) + (rect.w | 0));
  const y1 = Math.min(sheet.height, (rect.y | 0) + (rect.h | 0));
  return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
}
const inBox = (b, x, y) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h;

export function clone(sheet) {
  return { width: sheet.width, height: sheet.height, data: new Uint8ClampedArray(sheet.data) };
}


export function blit(dst, src, x, y, srcRect = null) {
  const b = box(src, srcRect);
  for (let yy = 0; yy < b.h; yy += 1) {
    for (let xx = 0; xx < b.w; xx += 1) set(dst, x + xx, y + yy, get(src, b.x + xx, b.y + yy));
  }
  return dst;
}


export function scaleNearest(sheet, k) {
  if (!Number.isInteger(k) || k < 1) throw new TypeError('scaleNearest: k must be a positive integer');
  const out = createSheet(sheet.width * k, sheet.height * k);
  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) set(out, x, y, get(sheet, (x / k) | 0, (y / k) | 0));
  }
  return out;
}


export function colourSet(sheet, rect = null) {
  const b = box(sheet, rect); const m = new Map();
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      const c = get(sheet, x, y); const k = key(c[0], c[1], c[2]);
      m.set(k, (m.get(k) || 0) + 1);
    }
  }
  return m;
}
export function meanColour(sheet, rect = null) {
  const b = box(sheet, rect); let r = 0; let g = 0; let bl = 0; let n = 0;
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) { const c = get(sheet, x, y); r += c[0]; g += c[1]; bl += c[2]; n += 1; }
  }
  return n ? [r / n, g / n, bl / n] : [0, 0, 0];
}





export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export function hash2(x, y, seed = 0) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul((seed | 0) + 0x3c6ef372, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}


export function valueNoise(x, y, seed = 0) {
  const x0 = Math.floor(x); const y0 = Math.floor(y);
  const fx = x - x0; const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed); const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed); const d = hash2(x0 + 1, y0 + 1, seed);
  const top = a + (b - a) * sx; const bot = c + (d - c) * sx;
  return top + (bot - top) * sy;
}




export const BAYER4 = Object.freeze([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(Object.freeze));
export function bayer(x, y) { return (BAYER4[y & 3][x & 3] + 0.5) / 16; }





export function fill(sheet, colour, rect = null) {
  const b = box(sheet, rect); const c = rgb(colour);
  for (let y = b.y; y < b.y + b.h; y += 1) for (let x = b.x; x < b.x + b.w; x += 1) set(sheet, x, y, c);
  return sheet;
}







export function gradient(sheet, pal, { rect = null, axis = 'y', from = 0, to = null, dither: dith = false } = {}) {
  const stops = stopsOf(pal); const b = box(sheet, rect);
  const end = to === null ? stops.length - 1 : to;
  const lo = Math.min(from, end); const hi = Math.max(from, end);
  const len = axis === 'y' ? b.h : b.w;
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      const s = len <= 1 ? 0 : (axis === 'y' ? y - b.y : x - b.x) / (len - 1);
      const f = from + s * (end - from);
      let idx;
      if (dith) { const fl = Math.floor(f); idx = (f - fl) > bayer(x, y) ? fl + 1 : fl; } else idx = Math.round(f);
      set(sheet, x, y, stops[Math.max(lo, Math.min(hi, idx))]);
    }
  }
  return sheet;
}


export function dither(sheet, a, b, t, rect = null) {
  const bx = box(sheet, rect); const A = rgb(a); const B = rgb(b);
  for (let y = bx.y; y < bx.y + bx.h; y += 1) {
    for (let x = bx.x; x < bx.x + bx.w; x += 1) set(sheet, x, y, t > bayer(x, y) ? B : A);
  }
  return sheet;
}






export function shade(sheet, colour, t, rect = null) {
  const bx = box(sheet, rect); const C = rgb(colour);
  for (let y = bx.y; y < bx.y + bx.h; y += 1) {
    for (let x = bx.x; x < bx.x + bx.w; x += 1) if (t > bayer(x, y)) set(sheet, x, y, C);
  }
  return sheet;
}







export function noise(sheet, stops, { rect = null, seed = 1, freq = 0.25, octaves = 1, spread = 1.6 } = {}) {
  const st = stops.map((c) => (c === null ? null : rgb(c))); const b = box(sheet, rect);
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      let n = 0; let amp = 1; let norm = 0; let f = freq;
      for (let o = 0; o < octaves; o += 1) { n += valueNoise(x * f, y * f, seed + o * 101) * amp; norm += amp; amp *= 0.5; f *= 2.3; }
      n = Math.max(0, Math.min(0.999999, (n / norm - 0.5) * spread + 0.5));
      const c = st[Math.floor(n * st.length)];
      if (c) set(sheet, x, y, c);
    }
  }
  return sheet;
}


export function speckle(sheet, colour, { rect = null, seed = 1, density = 0.05, over = null } = {}) {
  const b = box(sheet, rect); const c = rgb(colour); const rnd = mulberry32(seed);
  const allow = over ? new Set(over.map(rgb).map((o) => key(o[0], o[1], o[2]))) : null;
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      const r = rnd();
      if (r >= density) continue;
      if (allow) { const p = get(sheet, x, y); if (!allow.has(key(p[0], p[1], p[2]))) continue; }
      set(sheet, x, y, c);
    }
  }
  return sheet;
}


function patternAt(pattern, p) {
  let total = 0;
  for (const [, w] of pattern) total += w;
  let q = ((p % total) + total) % total;
  for (const [c, w] of pattern) { if (q < w) return c; q -= w; }
  return pattern[pattern.length - 1][0];
}
const normPattern = (pattern) => pattern.map(([c, w]) => [rgb(c), Math.max(1, w | 0)]);


export function stripes(sheet, pattern, { rect = null, axis = 'x', offset = 0 } = {}) {
  const b = box(sheet, rect); const pat = normPattern(pattern);
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) set(sheet, x, y, patternAt(pat, (axis === 'x' ? x - b.x : y - b.y) + offset));
  }
  return sheet;
}










export function weave(sheet, warp, weft, { rect = null, mix = 'twill', offset = [0, 0] } = {}) {
  const b = box(sheet, rect); const wa = normPattern(warp); const we = normPattern(weft);
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      const cx = patternAt(wa, x - b.x + offset[0]); const cy = patternAt(we, y - b.y + offset[1]);
      let c;
      if (mix === 'multiply') c = [(cx[0] * cy[0]) / 255, (cx[1] * cy[1]) / 255, (cx[2] * cy[2]) / 255];
      else if (mix === 'checker') c = ((x + y) & 1) ? cx : cy;
      else c = (((x + y) & 3) < 2) ? cx : cy;
      set(sheet, x, y, c);
    }
  }
  return sheet;
}


export function twill(sheet, ridge, base = null, { rect = null, period = 3, width = 1, dir = 1, offset = 0 } = {}) {
  const b = box(sheet, rect); const R = rgb(ridge); const B = base === null ? null : rgb(base);
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      const d = ((((dir > 0 ? x - y : x + y) + offset) % period) + period) % period;
      if (d < width) set(sheet, x, y, R); else if (B) set(sheet, x, y, B);
    }
  }
  return sheet;
}


function line(from, to, f) {
  const dx = to[0] - from[0]; const dy = to[1] - from[1];
  const n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= n; i += 1) f(Math.round(from[0] + (dx * i) / n), Math.round(from[1] + (dy * i) / n), i, n);
  return [dx, dy];
}

const across = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? [0, 1] : [1, 0]);


export function stitches(sheet, { from, to, light, dark = null, dash = 2, gap = 2, phase = 0 } = {}) {
  const L = rgb(light); const D = dark === null ? null : rgb(dark);
  const [sx, sy] = across(to[0] - from[0], to[1] - from[1]);
  line(from, to, (x, y, i) => {
    if (((i + phase) % (dash + gap)) < dash) { if (D) set(sheet, x + sx, y + sy, D); set(sheet, x, y, L); }
  });
  return sheet;
}


export function seam(sheet, { from, to, dark, light = null } = {}) {
  const D = rgb(dark); const L = light === null ? null : rgb(light);
  const [sx, sy] = across(to[0] - from[0], to[1] - from[1]);
  line(from, to, (x, y) => { if (L) set(sheet, x - sx, y - sy, L); set(sheet, x, y, D); });
  return sheet;
}


export function rivet(sheet, { x, y, r = 2, base = null, light, dark } = {}) {
  const L = rgb(light); const D = rgb(dark); const B = base === null ? null : rgb(base);
  const R = Math.ceil(r + 1);
  for (let dy = -R; dy <= R; dy += 1) {
    for (let dx = -R; dx <= R; dx += 1) {
      const d = Math.hypot(dx, dy);
      if (d < r - 0.5) { if (B) set(sheet, x + dx, y + dy, B); } else if (d <= r + 0.5) set(sheet, x + dx, y + dy, dx + dy < 0 ? L : D);
    }
  }
  return sheet;
}


export function scratches(sheet, colour, { rect = null, seed = 1, count = 8, minLen = 4, maxLen = 16, angle = null, jitter = 0.35 } = {}) {
  const b = box(sheet, rect); const c = rgb(colour); const rnd = mulberry32(seed);
  for (let i = 0; i < count; i += 1) {
    const x0 = b.x + rnd() * b.w; const y0 = b.y + rnd() * b.h;
    const a = angle === null ? rnd() * Math.PI : angle + (rnd() - 0.5) * 2 * jitter;
    const len = minLen + rnd() * (maxLen - minLen);
    line([x0, y0], [x0 + Math.cos(a) * len, y0 + Math.sin(a) * len], (x, y) => { if (inBox(b, x, y)) set(sheet, x, y, c); });
  }
  return sheet;
}


export function crack(sheet, colour, { x, y, len = 24, seed = 1, angle = null, wander = 0.5, rect = null } = {}) {
  const b = box(sheet, rect); const c = rgb(colour); const rnd = mulberry32(seed);
  let a = angle === null ? rnd() * Math.PI * 2 : angle; let px = x; let py = y;
  for (let i = 0; i < len; i += 1) {
    if (i % 3 === 0) a += (rnd() - 0.5) * 2 * wander;
    px += Math.cos(a); py += Math.sin(a);
    const ix = Math.round(px); const iy = Math.round(py);
    if (inBox(b, ix, iy)) set(sheet, ix, iy, c);
  }
  return sheet;
}






export function grime(sheet, { rect = null, seed = 1, strength = 0.35, freq = 1 / 12, tint = [1, 1, 1] } = {}) {
  const b = box(sheet, rect);
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      let n = 0.65 * valueNoise(x * freq, y * freq, seed) + 0.35 * valueNoise(x * freq * 2.7, y * freq * 2.7, seed + 7);
      n = Math.max(0, Math.min(1, (n - 0.5) * 1.8 + 0.5));
      const k = 1 - strength * n; const p = get(sheet, x, y);
      set(sheet, x, y, [p[0] * (1 - (1 - tint[0]) * n) * k, p[1] * (1 - (1 - tint[1]) * n) * k, p[2] * (1 - (1 - tint[2]) * n) * k, p[3]]);
    }
  }
  return sheet;
}







export function blood(sheet, { x, y, r = 6, seed = 1, pal = null, drips = 2, rect = null } = {}) {
  const P = pal || palette('blood'); const b = box(sheet, rect); const rnd = mulberry32(seed);
  const N = 24; const prof = [];
  for (let k = 0; k < N; k += 1) prof.push(0.55 + rnd() * 0.8);
  const radiusAt = (th) => {
    const t = ((th / (Math.PI * 2)) * N + N) % N; const k0 = Math.floor(t); const f = t - k0;
    return r * (prof[k0 % N] + (prof[(k0 + 1) % N] - prof[k0 % N]) * f);
  };
  const R = Math.ceil(r * 1.4) + 1;
  const inside = (px, py) => { const dx = px - x; const dy = py - y; return Math.hypot(dx, dy) <= radiusAt(Math.atan2(dy, dx)); };
  const cells = [];
  for (let py = y - R; py <= y + R; py += 1) {
    for (let px = x - R; px <= x + R; px += 1) if (inBox(b, px, py) && inside(px, py)) cells.push([px, py]);
  }
  for (const [px, py] of cells) set(sheet, px, py, P.by.base);
  for (const [px, py] of cells) {
    if (!inside(px - 1, py) || !inside(px + 1, py) || !inside(px, py - 1) || !inside(px, py + 1)) set(sheet, px, py, P.by.rim);
  }
  for (let d = 0; d < drips; d += 1) {
    const dx = Math.round(x + (rnd() - 0.5) * r * 1.2);
    let bottom = -1;
    for (const [px, py] of cells) if (px === dx && py > bottom) bottom = py;
    if (bottom < 0) continue;
    const len = Math.round(r * (0.8 + rnd() * 2.0));
    for (let i = 1; i <= len; i += 1) if (inBox(b, dx, bottom + i)) set(sheet, dx, bottom + i, i === len ? P.by.rim : P.by.deep);
  }
  return sheet;
}


export function patch(sheet, { rect, colour, light, dark, stitch = null } = {}) {
  const b = box(sheet, rect); if (b.w < 2 || b.h < 2) return sheet;
  fill(sheet, colour, b);
  const L = rgb(light); const D = rgb(dark);
  const x1 = b.x + b.w - 1; const y1 = b.y + b.h - 1;
  for (let x = b.x; x <= x1; x += 1) { set(sheet, x, b.y, L); set(sheet, x, y1, D); }
  for (let y = b.y; y <= y1; y += 1) { set(sheet, b.x, y, L); set(sheet, x1, y, D); }
  if (stitch && b.w >= 6 && b.h >= 6) {
    const s = { light: stitch.light, dark: stitch.dark || null, dash: stitch.dash || 2, gap: stitch.gap || 2 };
    stitches(sheet, { ...s, from: [b.x + 2, b.y + 2], to: [x1 - 2, b.y + 2] });
    stitches(sheet, { ...s, from: [b.x + 2, y1 - 2], to: [x1 - 2, y1 - 2] });
    stitches(sheet, { ...s, from: [b.x + 2, b.y + 2], to: [b.x + 2, y1 - 2] });
    stitches(sheet, { ...s, from: [x1 - 2, b.y + 2], to: [x1 - 2, y1 - 2] });
  }
  return sheet;
}


export function quantise(sheet, pal, rect = null) {
  const stops = stopsOf(pal); const b = box(sheet, rect);
  for (let y = b.y; y < b.y + b.h; y += 1) {
    for (let x = b.x; x < b.x + b.w; x += 1) {
      const p = get(sheet, x, y); const s = stops[nearestStop(stops, p)];
      set(sheet, x, y, [s[0], s[1], s[2], p[3]]);
    }
  }
  return sheet;
}


















export function atlas(parts, { size = 256, gutter = DEFAULT_GUTTER, vUp = false, background = [255, 0, 255] } = {}) {
  if (!SIZES.includes(size)) throw new RangeError(`atlas: a page is ${SIZES.join('/')} square, not ${size}`);
  if (!Number.isInteger(gutter) || gutter < 1) throw new RangeError('atlas: gutter must be a positive integer');
  const list = Array.isArray(parts) ? parts.slice() : Object.entries(parts).map(([name, sheet]) => ({ name, sheet }));
  const seen = new Set();
  for (const p of list) {
    if (!p || typeof p.name !== 'string' || !p.sheet) throw new TypeError('atlas: each part is { name, sheet }');
    if (seen.has(p.name)) throw new Error(`atlas: duplicate part name "${p.name}"`);
    seen.add(p.name);
  }
  
  
  
  list.sort((a, b) => (b.sheet.height - a.sheet.height) || (b.sheet.width - a.sheet.width) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const page = createSheet(size, size, background);
  const rects = {};
  let cx = 0; let cy = 0; let shelf = 0; let used = 0;
  for (const { name, sheet } of list) {
    const pw = sheet.width + 2 * gutter; const ph = sheet.height + 2 * gutter;
    if (pw > size || ph > size) throw new Error(`atlas: part "${name}" (${sheet.width}x${sheet.height} + ${gutter} gutter) does not fit a ${size} page`);
    if (cx + pw > size) { cx = 0; cy += shelf; shelf = 0; }
    if (cy + ph > size) throw new Error(`atlas: parts do not fit a ${size} page (ran out at "${name}"); use a bigger page or smaller parts`);
    const ox = cx + gutter; const oy = cy + gutter; const w = sheet.width; const h = sheet.height;
    blit(page, sheet, ox, oy);
    
    
    for (let g = 1; g <= gutter; g += 1) {
      for (let yy = oy; yy < oy + h; yy += 1) { set(page, ox - g, yy, get(page, ox, yy)); set(page, ox + w - 1 + g, yy, get(page, ox + w - 1, yy)); }
    }
    for (let g = 1; g <= gutter; g += 1) {
      for (let xx = ox - gutter; xx < ox + w + gutter; xx += 1) { set(page, xx, oy - g, get(page, xx, oy)); set(page, xx, oy + h - 1 + g, get(page, xx, oy + h - 1)); }
    }
    const v0 = oy / size; const v1 = (oy + h) / size;
    rects[name] = Object.freeze({
      x: ox, y: oy, w, h,
      u0: ox / size, u1: (ox + w) / size,
      v0: vUp ? 1 - v1 : v0, v1: vUp ? 1 - v0 : v1,
    });
    cx += pw; shelf = Math.max(shelf, ph); used += pw * ph;
  }
  return { sheet: page, rects, size, gutter, vUp, used: used / (size * size) };
}
