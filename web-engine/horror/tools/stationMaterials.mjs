


























import {
  createSheet, palette, fill, gradient, shade, noise, speckle, stripes, weave, twill,
  seam, rivet, scratches, crack, grime, quantise, blood, dither, hex, set, get, hash2, mulberry32,
} from './texturePaint.mjs';
import { paintMaterial } from './materials.mjs';

const R = (size, f) => Math.max(1, Math.round(size * f));
const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));


export function bytes(c) {
  if (typeof c === 'number') return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  return hex(c);
}






export const RAMP_K = Object.freeze([0.42, 0.62, 0.82, 1.0, 1.18, 1.36]);
export const RAMP_NAMES = Object.freeze(['dark', 'deep', 'shadow', 'base', 'lit', 'hi']);
export function ramp(colour, { k = RAMP_K } = {}) {
  const b = bytes(colour);
  const stops = k.map((f) => Object.freeze([clampByte(b[0] * f), clampByte(b[1] * f), clampByte(b[2] * f)]));
  const by = {};
  RAMP_NAMES.forEach((n, i) => { by[n] = stops[i]; });
  return Object.freeze({ name: 'ramp', stops: Object.freeze(stops), by: Object.freeze(by) });
}





export const FONT = Object.freeze({
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'], '3': ['###', '..#', '###', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'], '7': ['###', '..#', '..#', '..#', '..#'],
  '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['###', '#..', '#..', '#..', '###'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '###', '#..', '###'], F: ['###', '#..', '###', '#..', '#..'],
  G: ['###', '#..', '#.#', '#.#', '###'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['###', '#.#', '#.#', '#.#', '###'], P: ['###', '#.#', '###', '#..', '#..'],
  Q: ['###', '#.#', '#.#', '###', '..#'], R: ['###', '#.#', '##.', '#.#', '#.#'],
  S: ['###', '#..', '###', '..#', '###'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  ' ': ['...', '...', '...', '...', '...'], '-': ['...', '...', '###', '...', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'], '.': ['...', '...', '...', '...', '.#.'],
});


export function textWidth(str, scale = 1) { return (str.length * 4 - 1) * scale; }


export function text(sheet, str, { x = 0, y = 0, scale = 1, colour, shadow = null } = {}) {
  const C = bytes(colour); const S = shadow === null ? null : bytes(shadow);
  const chars = String(str).toUpperCase();
  for (let i = 0; i < chars.length; i += 1) {
    const g = FONT[chars[i]] || FONT[' '];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (g[row][col] !== '#') continue;
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const px = x + (i * 4 + col) * scale + sx; const py = y + row * scale + sy;
            if (S) set(sheet, px + 1, py + 1, S);
            set(sheet, px, py, C);
          }
        }
      }
    }
  }
  return sheet;
}









const HAZARD_YELLOW = [214, 172, 44];
const HAZARD_BLACK = [28, 26, 22];
const WATER_STOPS = [[6, 9, 14], [12, 17, 24], [20, 28, 38], [34, 46, 58]];

export const RECIPES = {
  
  wallPlate(size, seed, pal) {
    const P = ramp(pal.wall); const G = P.by; const S = palette('steel').by; const U = palette('rust').by;
    const s = createSheet(size, size);
    fill(s, G.base);
    noise(s, [null, G.shadow, null, null, null, G.lit], { seed, freq: 1 / R(size, 0.07), spread: 1.3 });
    const h = R(size, 0.5);
    seam(s, { from: [0, h], to: [size - 1, h], dark: G.dark, light: G.lit });
    seam(s, { from: [h, 0], to: [h, size - 1], dark: G.dark, light: G.lit });
    const rr = size >= 128 ? 2 : 1; const step = R(size, 0.25);
    for (let i = 0; i < 4; i += 1) {
      rivet(s, { x: R(size, 0.125) + i * step, y: h - rr - 1, r: rr, base: G.lit, light: G.hi, dark: G.dark });
      rivet(s, { x: h - rr - 1, y: R(size, 0.125) + i * step, r: rr, base: G.lit, light: G.hi, dark: G.dark });
    }
    grime(s, { seed: seed + 1, strength: 0.42, freq: 1 / R(size, 0.11) });
    quantise(s, P);
    scratches(s, S.lit, { seed: seed + 2, count: R(size, 0.05), minLen: R(size, 0.03), maxLen: R(size, 0.1) });
    noise(s, [U.deep, U.base, null, null, null, null, null], { seed: seed + 3, freq: 1 / R(size, 0.06), rect: { x: R(size, 0.55), y: R(size, 0.62), w: R(size, 0.45), h: R(size, 0.38) }, spread: 1.2 });
    return s;
  },
  
  wallRibbed(size, seed, pal) {
    const P = ramp(pal.wall); const G = P.by; const U = palette('rust').by;
    const s = createSheet(size, size);
    const rib = Math.max(2, R(size, 0.0625));
    stripes(s, [[G.dark, 1], [G.shadow, 1], [G.base, rib - 4], [G.lit, 2]], { axis: 'x' });
    const rail = R(size, 0.72);
    for (let y = rail; y < rail + Math.max(2, R(size, 0.03)); y += 1) stripes(s, [[G.hi, 1]], { rect: { x: 0, y, w: size, h: 1 } });
    seam(s, { from: [0, rail - 1], to: [size - 1, rail - 1], dark: G.dark, light: null });
    seam(s, { from: [0, rail + Math.max(2, R(size, 0.03))], to: [size - 1, rail + Math.max(2, R(size, 0.03))], dark: G.dark, light: null });
    grime(s, { seed: seed + 1, strength: 0.36, freq: 1 / R(size, 0.16) });
    quantise(s, P);
    scratches(s, U.deep, { seed: seed + 2, count: R(size, 0.08), minLen: R(size, 0.08), maxLen: R(size, 0.3), angle: Math.PI / 2, jitter: 0.04, rect: { x: 0, y: 0, w: size, h: R(size, 0.45) } });
    scratches(s, U.base, { seed: seed + 3, count: R(size, 0.05), minLen: R(size, 0.04), maxLen: R(size, 0.16), angle: Math.PI / 2, jitter: 0.04, rect: { x: 0, y: 0, w: size, h: R(size, 0.35) } });
    return s;
  },
  
  wallBand(size, seed, pal) {
    const P = ramp(pal.wall); const G = P.by; const T = ramp(pal.trim).by;
    const s = createSheet(size, size);
    fill(s, G.base);
    noise(s, [null, G.shadow, null, null, G.lit], { seed, freq: 1 / R(size, 0.05), spread: 1.2 });
    const y0 = R(size, 0.36); const y1 = R(size, 0.62);
    fill(s, T.base, { x: 0, y: y0, w: size, h: y1 - y0 });
    
    shade(s, G.base, 0.45, { x: 0, y: y0, w: size, h: R(size, 0.03) });
    shade(s, G.base, 0.45, { x: 0, y: y1 - R(size, 0.03), w: size, h: R(size, 0.03) });
    speckle(s, G.shadow, { seed: seed + 1, density: 0.06, rect: { x: 0, y: y0, w: size, h: y1 - y0 } });
    seam(s, { from: [0, y0 - 1], to: [size - 1, y0 - 1], dark: G.dark, light: G.lit });
    seam(s, { from: [0, y1], to: [size - 1, y1], dark: G.dark, light: G.lit });
    grime(s, { seed: seed + 2, strength: 0.4, freq: 1 / R(size, 0.13) });
    quantise(s, [...P.stops, ...ramp(pal.trim).stops]);
    const rnd = mulberry32(seed + 9);
    const splats = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < splats; i += 1) {
      blood(s, { x: R(size, 0.15 + rnd() * 0.7), y: R(size, 0.15 + rnd() * 0.5), r: R(size, 0.03 + rnd() * 0.05), seed: seed + 20 + i, drips: 2 });
    }
    return s;
  },
  
  floorGrating(size, seed, pal) {
    const P = ramp(pal.floor); const F = P.by;
    const s = createSheet(size, size);
    
    
    
    fill(s, [8, 8, 8]);
    noise(s, [null, F.dark, null, null], { seed, freq: 1 / R(size, 0.05), spread: 1.6 });
    const cell = Math.max(4, R(size, 0.0625)); const bar = size >= 128 ? 2 : 1;
    for (let x = 0; x < size; x += cell) {
      fill(s, F.base, { x, y: 0, w: bar, h: size });
      fill(s, F.lit, { x, y: 0, w: 1, h: size });
    }
    for (let y = 0; y < size; y += cell) {
      fill(s, F.base, { x: 0, y, w: size, h: bar });
      fill(s, F.lit, { x: 0, y, w: size, h: 1 });
    }
    grime(s, { seed: seed + 1, strength: 0.3, freq: 1 / R(size, 0.15) });
    return quantise(s, [...P.stops, [8, 8, 8]]);
  },
  
  floorConcrete(size, seed, pal, { litter = 'straw' } = {}) {
    const P = ramp(pal.floor); const C = P.by;
    const s = createSheet(size, size);
    noise(s, [C.shadow, C.base, C.base, C.lit], { seed, freq: 1 / R(size, 0.03), octaves: 2, spread: 1.4 });
    speckle(s, C.deep, { seed: seed + 1, density: 0.03 });
    speckle(s, C.hi, { seed: seed + 2, density: 0.015 });
    crack(s, C.dark, { x: R(size, 0.2), y: R(size, 0.1), len: R(size, 0.7), seed, angle: Math.PI * 0.4 });
    crack(s, C.dark, { x: R(size, 0.75), y: R(size, 0.9), len: R(size, 0.35), seed: seed + 3, angle: -Math.PI * 0.6 });
    grime(s, { seed: seed + 4, strength: 0.34, freq: 1 / R(size, 0.12) });
    quantise(s, P);
    if (litter === 'straw') {
      const T = palette('straw').by;
      scratches(s, T.base, { seed: seed + 5, count: R(size, 0.35), minLen: R(size, 0.03), maxLen: R(size, 0.09) });
      scratches(s, T.lit, { seed: seed + 6, count: R(size, 0.15), minLen: R(size, 0.02), maxLen: R(size, 0.06) });
    } else if (litter === 'water') {
      noise(s, [WATER_STOPS[1], WATER_STOPS[2], null, null, null, null], { seed: seed + 5, freq: 1 / R(size, 0.2), spread: 1.4 });
    }
    const rnd = mulberry32(seed + 7);
    for (let i = 0; i < 2; i += 1) blood(s, { x: R(size, rnd()), y: R(size, rnd()), r: R(size, 0.025 + rnd() * 0.04), seed: seed + 30 + i, drips: 0 });
    return s;
  },
  
  floorTiles(size, seed, pal) {
    const P = ramp(pal.floor); const F = P.by;
    const s = createSheet(size, size);
    fill(s, F.base);
    noise(s, [null, F.shadow, null, null, F.lit], { seed, freq: 1 / R(size, 0.04), spread: 1.2 });
    const tile = Math.max(6, R(size, 0.25));
    for (let x = 0; x < size; x += tile) fill(s, F.dark, { x, y: 0, w: 1, h: size });
    for (let y = 0; y < size; y += tile) fill(s, F.dark, { x: 0, y, w: size, h: 1 });
    
    scratches(s, F.hi, { seed: seed + 1, count: R(size, 0.12), minLen: R(size, 0.02), maxLen: R(size, 0.06), angle: 0.2, jitter: 0.1 });
    grime(s, { seed: seed + 2, strength: 0.36, freq: 1 / R(size, 0.14) });
    quantise(s, P);
    const rnd = mulberry32(seed + 5);
    for (let i = 0; i < 3; i += 1) blood(s, { x: R(size, rnd()), y: R(size, rnd()), r: R(size, 0.03 + rnd() * 0.05), seed: seed + 40 + i, drips: 0 });
    return s;
  },
  
  ceilingTrunking(size, seed, pal) {
    const P = ramp(pal.ceiling); const C = P.by; const S = palette('steel').by;
    const s = createSheet(size, size);
    fill(s, C.base);
    noise(s, [null, C.shadow, null, null, C.lit], { seed, freq: 1 / R(size, 0.06), spread: 1.2 });
    const h = R(size, 0.5);
    seam(s, { from: [h, 0], to: [h, size - 1], dark: C.dark, light: C.lit });
    
    const y0 = R(size, 0.4); const y1 = R(size, 0.6);
    fill(s, C.lit, { x: 0, y: y0, w: size, h: y1 - y0 });
    seam(s, { from: [0, y0], to: [size - 1, y0], dark: C.dark, light: C.hi });
    seam(s, { from: [0, y1], to: [size - 1, y1], dark: C.dark, light: null });
    const rr = size >= 128 ? 2 : 1;
    for (let i = 0; i < 6; i += 1) rivet(s, { x: R(size, 0.08) + i * R(size, 0.17), y: (y0 + y1) >> 1, r: rr, base: C.lit, light: C.hi, dark: C.dark });
    grime(s, { seed: seed + 1, strength: 0.4, freq: 1 / R(size, 0.12) });
    quantise(s, P);
    scratches(s, S.shadow, { seed: seed + 2, count: R(size, 0.03), minLen: R(size, 0.03), maxLen: R(size, 0.08) });
    return s;
  },
  
  pipe(size, seed, pal, { rusty = true } = {}) {
    const P = rusty ? palette('rust') : palette('steel'); const B = P.by;
    const s = createSheet(size, size);
    
    gradient(s, P, { rect: { x: 0, y: 0, w: size, h: R(size, 0.35) }, axis: 'y', from: 1, to: 5, dither: true });
    gradient(s, P, { rect: { x: 0, y: R(size, 0.35), w: size, h: size - R(size, 0.35) }, axis: 'y', from: 5, to: 1, dither: true });
    
    const fx = R(size, 0.5);
    fill(s, B.dark, { x: fx - 2, y: 0, w: 4, h: size });
    fill(s, B.hi, { x: fx - 3, y: 0, w: 1, h: size });
    fill(s, B.hi, { x: fx + 2, y: 0, w: 1, h: size });
    speckle(s, B.dark, { seed, density: 0.03 });
    scratches(s, B.deep, { seed: seed + 1, count: R(size, 0.06), minLen: R(size, 0.05), maxLen: R(size, 0.2), angle: Math.PI / 2, jitter: 0.05 });
    grime(s, { seed: seed + 2, strength: 0.25, freq: 1 / R(size, 0.2) });
    return quantise(s, P);
  },
  
  door(size, seed, pal) {
    const P = ramp(pal.trim); const D = P.by; const S = palette('steel').by; const Br = palette('brass').by;
    const s = createSheet(size, size);
    fill(s, D.base);
    noise(s, [null, D.shadow, null, null, D.lit], { seed, freq: 1 / R(size, 0.06), spread: 1.2 });
    
    const ix = R(size, 0.12); const iy = R(size, 0.1); const iw = size - 2 * ix; const ih = R(size, 0.5);
    seam(s, { from: [ix, iy], to: [ix + iw, iy], dark: D.dark, light: D.hi });
    seam(s, { from: [ix, iy + ih], to: [ix + iw, iy + ih], dark: D.dark, light: D.hi });
    seam(s, { from: [ix, iy], to: [ix, iy + ih], dark: D.dark, light: D.hi });
    seam(s, { from: [ix + iw, iy], to: [ix + iw, iy + ih], dark: D.dark, light: D.hi });
    
    const wx = R(size, 0.3); const wy = R(size, 0.2); const ww = R(size, 0.4); const wh = R(size, 0.16);
    fill(s, [10, 12, 14], { x: wx, y: wy, w: ww, h: wh });
    fill(s, [40, 48, 56], { x: wx + 2, y: wy + 2, w: R(size, 0.08), h: 1 });
    seam(s, { from: [wx, wy - 1], to: [wx + ww, wy - 1], dark: D.dark, light: D.hi });
    seam(s, { from: [wx, wy + wh], to: [wx + ww, wy + wh], dark: D.dark, light: D.hi });
    
    fill(s, S.base, { x: 0, y: R(size, 0.8), w: size, h: size - R(size, 0.8) });
    stripes(s, [[S.base, 3], [S.shadow, 1], [S.lit, 1]], { rect: { x: 0, y: R(size, 0.8), w: size, h: size - R(size, 0.8) }, axis: 'y' });
    seam(s, { from: [0, R(size, 0.8) - 1], to: [size - 1, R(size, 0.8) - 1], dark: D.dark, light: null });
    
    const hx = R(size, 0.8); const hy = R(size, 0.66);
    fill(s, Br.base, { x: hx, y: hy, w: R(size, 0.1), h: Math.max(2, R(size, 0.03)) });
    set(s, hx, hy, Br.hi);
    grime(s, { seed: seed + 1, strength: 0.4, freq: 1 / R(size, 0.12) });
    quantise(s, [...P.stops, S.base, S.shadow, S.lit, Br.base, Br.hi, [10, 12, 14], [40, 48, 56]]);
    blood(s, { x: R(size, 0.55), y: R(size, 0.5), r: R(size, 0.05), seed: seed + 50, drips: 3 });
    return s;
  },
  
  grille(size, seed) {
    const P = palette('steel'); const S = P.by;
    const s = createSheet(size, size);
    fill(s, S.shadow);
    const louvre = Math.max(3, R(size, 0.0625));
    stripes(s, [[[8, 9, 10], 1], [S.dark, 1], [S.base, louvre - 3], [S.lit, 1]], { axis: 'y' });
    const fr = Math.max(2, R(size, 0.05));
    fill(s, S.base, { x: 0, y: 0, w: size, h: fr }); fill(s, S.base, { x: 0, y: size - fr, w: size, h: fr });
    fill(s, S.base, { x: 0, y: 0, w: fr, h: size }); fill(s, S.base, { x: size - fr, y: 0, w: fr, h: size });
    seam(s, { from: [fr, fr], to: [size - fr, fr], dark: S.dark, light: S.hi });
    seam(s, { from: [fr, size - fr], to: [size - fr, size - fr], dark: S.dark, light: null });
    grime(s, { seed, strength: 0.3, freq: 1 / R(size, 0.2) });
    return quantise(s, [...P.stops, [8, 9, 10]]);
  },
  
  sign(size, seed, pal, { line1 = 'DECK', line2 = '01' } = {}) {
    const P = ramp(pal.trim); const D = P.by;
    const s = createSheet(size, size);
    fill(s, D.deep);
    noise(s, [null, D.shadow, null, null], { seed, freq: 1 / R(size, 0.08), spread: 1.2 });
    const border = Math.max(3, R(size, 0.08));
    const period = Math.max(4, R(size, 0.0625));
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const onBorder = x < border || y < border || x >= size - border || y >= size - border;
        if (!onBorder) continue;
        set(s, x, y, ((((x + y) % period) + period) % period) < period / 2 ? HAZARD_YELLOW : HAZARD_BLACK);
      }
    }
    grime(s, { seed: seed + 1, strength: 0.3, freq: 1 / R(size, 0.15) });
    quantise(s, [...P.stops, HAZARD_YELLOW, HAZARD_BLACK]);
    const big = Math.max(1, Math.floor((size - 2 * border - 4) / textWidth(line2, 1)));
    const small = Math.max(1, Math.floor((size - 2 * border - 4) / textWidth(line1, 1)));
    const ink = [236, 232, 220]; const ink2 = [12, 12, 12];
    const w1 = textWidth(line1, small); const w2 = textWidth(line2, big);
    text(s, line1, { x: (size - w1) >> 1, y: border + R(size, 0.06), scale: small, colour: ink, shadow: ink2 });
    text(s, line2, { x: (size - w2) >> 1, y: border + R(size, 0.06) + 5 * small + R(size, 0.08), scale: big, colour: ink, shadow: ink2 });
    return s;
  },
  
  hazardStripes(size, seed) {
    const s = createSheet(size, size);
    const period = Math.max(6, R(size, 0.125));
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) set(s, x, y, ((((x + y) % period) + period) % period) < period / 2 ? HAZARD_YELLOW : HAZARD_BLACK);
    }
    grime(s, { seed, strength: 0.35, freq: 1 / R(size, 0.15) });
    return quantise(s, [HAZARD_YELLOW, [150, 122, 34], HAZARD_BLACK, [14, 13, 11]]);
  },
  
  hessian(size, seed) {
    const P = palette('straw'); const T = P.by;
    const s = createSheet(size, size);
    weave(s, [[T.shadow, 2], [T.deep, 1]], [[T.base, 2], [T.shadow, 1]], { mix: 'twill' });
    speckle(s, T.dark, { seed, density: 0.04 });
    grime(s, { seed: seed + 1, strength: 0.3, freq: 1 / R(size, 0.2) });
    return quantise(s, P);
  },
  
  woodSlats(size, seed) {
    const P = palette('leather'); const W = P.by;      
    const s = createSheet(size, size);
    const plank = Math.max(6, R(size, 0.17));
    stripes(s, [[W.dark, 1], [W.shadow, 1], [W.base, plank - 3], [W.lit, 1]], { axis: 'x' });
    scratches(s, W.shadow, { seed, count: R(size, 0.5), minLen: R(size, 0.1), maxLen: R(size, 0.4), angle: Math.PI / 2, jitter: 0.03 });
    scratches(s, W.lit, { seed: seed + 1, count: R(size, 0.25), minLen: R(size, 0.08), maxLen: R(size, 0.3), angle: Math.PI / 2, jitter: 0.03 });
    speckle(s, W.dark, { seed: seed + 2, density: 0.015 });
    grime(s, { seed: seed + 3, strength: 0.3, freq: 1 / R(size, 0.2) });
    return quantise(s, P);
  },
  
  rubberBelt(size, seed) {
    const P = ramp(0x3a3d40); const B = P.by;
    const s = createSheet(size, size);
    stripes(s, [[B.dark, 1], [B.base, 4], [B.lit, 1]], { axis: 'y' });
    scratches(s, B.hi, { seed, count: R(size, 0.06), minLen: R(size, 0.04), maxLen: R(size, 0.15), angle: 0, jitter: 0.1 });
    grime(s, { seed: seed + 1, strength: 0.3, freq: 1 / R(size, 0.2) });
    quantise(s, P);
    blood(s, { x: R(size, 0.4), y: R(size, 0.45), r: R(size, 0.07), seed: seed + 60, drips: 0 });
    return s;
  },
  
  water(size, seed) {
    const s = createSheet(size, size);
    noise(s, WATER_STOPS, { seed, freq: 1 / R(size, 0.2), spread: 1.3 });
    const rnd = mulberry32(seed + 3);
    for (let i = 0; i < R(size, 0.08); i += 1) {
      crack(s, [64, 78, 92], { x: R(size, rnd()), y: R(size, rnd()), len: R(size, 0.15 + rnd() * 0.2), seed: seed + 100 + i, angle: (rnd() - 0.5) * 0.6, wander: 0.15 });
    }
    return quantise(s, [...WATER_STOPS, [64, 78, 92]]);
  },
  
  vinyl(size, seed) {
    const P = ramp(0x2a2a2e); const V = P.by;
    const s = createSheet(size, size);
    fill(s, V.base);
    noise(s, [null, V.shadow, null, null, V.lit], { seed, freq: 1 / R(size, 0.15), spread: 1.4 });
    const rnd = mulberry32(seed + 1);
    for (let i = 0; i < 4; i += 1) {
      crack(s, V.hi, { x: R(size, rnd()), y: R(size, rnd()), len: R(size, 0.3), seed: seed + 10 + i, angle: rnd() * Math.PI, wander: 0.2 });
    }
    const zx = R(size, 0.5);
    for (let y = 0; y < size; y += 2) { set(s, zx, y, V.hi); set(s, zx + 1, y + 1, V.dark); }
    grime(s, { seed: seed + 2, strength: 0.2, freq: 1 / R(size, 0.2) });
    return quantise(s, P);
  },
};

export const STATION_RECIPES = Object.freeze(Object.keys(RECIPES));


export const ARCHETYPE_SURFACES = Object.freeze({
  stock: { floor: 'floorConcrete', litter: 'straw', pipeRusty: true },
  processing: { floor: 'floorTiles', litter: null, pipeRusty: false },
  dark: { floor: 'floorGrating', litter: 'water', pipeRusty: true },
});






export function stationKit(arch, { size = 128, seed = 1, deckNo = 1 } = {}) {
  const pal = arch.palette;
  const surf = ARCHETYPE_SURFACES[arch.name] || ARCHETYPE_SURFACES.stock;
  const small = Math.max(64, size >> 1);
  const kit = {
    wallA: RECIPES.wallPlate(size, seed + 1, pal),
    wallB: RECIPES.wallRibbed(size, seed + 2, pal),
    wallC: RECIPES.wallBand(size, seed + 3, pal),
    floor: RECIPES[surf.floor](size, seed + 4, pal, { litter: surf.litter }),
    floorAlt: RECIPES.floorConcrete(size, seed + 5, pal, { litter: surf.litter }),
    ceiling: RECIPES.ceilingTrunking(size, seed + 6, pal),
    pipe: RECIPES.pipe(small, seed + 7, pal, { rusty: surf.pipeRusty }),
    door: RECIPES.door(size, seed + 8, pal),
    grille: RECIPES.grille(small, seed + 9, pal),
    sign: RECIPES.sign(size, seed + 10, pal, { line1: arch.name === 'processing' ? 'PROC' : arch.name === 'dark' ? 'DECK' : 'STOCK', line2: String(deckNo).padStart(2, '0') }),
    stripes: RECIPES.hazardStripes(small, seed + 11),
    hessian: RECIPES.hessian(small, seed + 12),
    wood: RECIPES.woodSlats(small, seed + 13),
    rubber: RECIPES.rubberBelt(small, seed + 14),
    water: RECIPES.water(size, seed + 15),
    vinyl: RECIPES.vinyl(small, seed + 16),
    steel: paintMaterial('steel', { size: small, seed: seed + 17 }),
    rust: paintMaterial('rust', { size: small, seed: seed + 18 }),
    concrete: paintMaterial('concrete', { size: small, seed: seed + 19 }),
    straw: paintMaterial('straw', { size: small, seed: seed + 20 }),
    brass: paintMaterial('brass', { size: small, seed: seed + 21 }),
  };
  return kit;
}

export const KIT_NAMES = Object.freeze([
  'wallA', 'wallB', 'wallC', 'floor', 'floorAlt', 'ceiling', 'pipe', 'door', 'grille', 'sign', 'stripes',
  'hessian', 'wood', 'rubber', 'water', 'vinyl', 'steel', 'rust', 'concrete', 'straw', 'brass',
]);


export function meanHue(sheet) {
  let r = 0; let g = 0; let b = 0; const n = sheet.width * sheet.height;
  for (let i = 0; i < n; i += 1) { r += sheet.data[i * 4]; g += sheet.data[i * 4 + 1]; b += sheet.data[i * 4 + 2]; }
  r /= n; g /= n; b /= n;
  return { mean: [r, g, b], hue: hueOf([r, g, b]), sat: satOf([r, g, b]) };
}
export function hueOf([r, g, b]) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return h;
}
export function satOf([r, g, b]) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
export function hueDistance(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }


export const _ops = Object.freeze({ dither, get, hash2, twill });
