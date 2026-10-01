




















import {
  createSheet, palette, fill, gradient, shade, noise, speckle, stripes, weave, twill,
  seam, rivet, scratches, crack, grime, quantise, hash2, set,
} from './texturePaint.mjs';

const R = (size, f) => Math.max(1, Math.round(size * f));




function sett(P, period) {
  const s = [[P.black, 0.125], [P.red, 0.3], [P.mustard, 0.075], [P.red, 0.3], [P.black, 0.125], [P.redLit, 0.075]];
  return s.map(([c, f]) => [c, Math.max(1, Math.round(period * f))]);
}

const RECIPES = {
  skin(size, seed) {
    const P = palette('skin').by; const s = createSheet(size, size);
    
    
    fill(s, P.lit);
    speckle(s, P.base, { seed, density: 0.04 });
    return quantise(s, palette('skin'));
  },
  hair(size, seed) {
    const P = palette('hair'); const H = P.by; const s = createSheet(size, size);
    
    
    const pat = [];
    for (let i = 0; i < 24; i += 1) {
      const r = hash2(i, 3, seed); pat.push([r < 0.25 ? H.deep : r < 0.6 ? H.shadow : r < 0.9 ? H.base : H.hi, 1 + (hash2(i, 5, seed) < 0.4 ? 1 : 0)]);
    }
    stripes(s, pat, { axis: 'x' });
    
    
    const third = R(size, 1 / 3);
    for (let y = size - third; y < size; y += 1) shade(s, H.dark, ((y - (size - third)) / third) * 0.8, { x: 0, y, w: size, h: 1 });
    speckle(s, H.light, { seed: seed + 1, density: 0.06, rect: { x: 0, y: 0, w: size, h: third } });
    return quantise(s, P);
  },
  plaid(size, seed) {
    const P = palette('plaid'); const B = P.by; const s = createSheet(size, size);
    const period = R(size, 0.25);
    weave(s, sett(B, period), sett(B, period), { mix: 'twill' });
    
    speckle(s, B.dark, { seed, density: 0.05, over: [B.red, B.redLit] });
    speckle(s, B.black, { seed: seed + 1, density: 0.06, over: [B.dark] });
    speckle(s, B.mustardLit, { seed: seed + 2, density: 0.08, over: [B.mustard] });
    return quantise(s, P);
  },
  denim(size, seed) {
    const P = palette('denim'); const D = P.by; const s = createSheet(size, size);
    fill(s, D.base);
    
    
    
    
    twill(s, D.shadow, null, { period: 3, width: 1 });
    
    
    
    
    
    
    
    
    
    
    
    
    
    speckle(s, D.weft, { seed, density: 0.012 });
    speckle(s, D.lit, { seed: seed + 1, density: 0.06, over: [D.base] });
    grime(s, { seed: seed + 2, strength: 0.16, freq: 1 / R(size, 0.3) });
    return quantise(s, P);
  },
  leather(size, seed) {
    const P = palette('leather'); const L = P.by; const s = createSheet(size, size);
    
    
    
    
    noise(s, [L.base, L.base, L.base, L.base, L.base, L.lit, L.base, L.shadow], { seed, freq: 1 / R(size, 0.025), spread: 1.2 });
    grime(s, { seed: seed + 3, strength: 0.28, freq: 1 / R(size, 0.2) });
    speckle(s, L.dark, { seed: seed + 1, density: 0.02 });
    for (let i = 0; i < 2; i += 1) {
      const y0 = R(size, 0.2 + hash2(i, 1, seed) * 0.6); const x0 = R(size, hash2(i, 2, seed) * 0.25);
      const len = R(size, 0.55); const ang = (hash2(i, 3, seed) - 0.5) * 0.3;
      crack(s, L.lit, { x: x0, y: y0 - 1, len, seed: seed + 10 + i, angle: ang, wander: 0.25 });
      crack(s, L.deep, { x: x0, y: y0, len, seed: seed + 10 + i, angle: ang, wander: 0.25 });
    }
    scratches(s, L.hi, { seed: seed + 2, count: R(size, 0.04), minLen: R(size, 0.03), maxLen: R(size, 0.08) });
    return quantise(s, P);
  },
  brass(size, seed) {
    const P = palette('brass'); const B = P.by; const s = createSheet(size, size);
    
    
    
    const half = R(size, 0.5);
    gradient(s, P, { rect: { x: 0, y: 0, w: size, h: half }, axis: 'y', from: 1, to: 5, dither: true });
    gradient(s, P, { rect: { x: 0, y: half, w: size, h: size - half }, axis: 'y', from: 5, to: 2, dither: true });
    scratches(s, B.hi, { seed, count: R(size, 0.06), minLen: R(size, 0.04), maxLen: R(size, 0.12), angle: 0, jitter: 0.15 });
    speckle(s, B.dark, { seed: seed + 1, density: 0.02 });
    grime(s, { seed: seed + 2, strength: 0.12, freq: 1 / R(size, 0.25), tint: [1, 0.9, 0.7] });
    return quantise(s, P);
  },
  steel(size, seed) {
    const P = palette('steel'); const S = P.by; const s = createSheet(size, size);
    
    stripes(s, [[S.base, 3], [S.shadow, 1], [S.base, 2], [S.lit, 1], [S.base, 4], [S.shadow, 1]], { axis: 'y' });
    scratches(s, S.hi, { seed, count: R(size, 0.08), minLen: R(size, 0.05), maxLen: R(size, 0.2), angle: 0, jitter: 0.08 });
    speckle(s, S.dark, { seed: seed + 1, density: 0.02 });
    grime(s, { seed: seed + 2, strength: 0.10, freq: 1 / R(size, 0.25) });
    return quantise(s, P);
  },
  rust(size, seed) {
    const P = palette('rust'); const U = P.by; const s = createSheet(size, size);
    noise(s, [U.dark, U.deep, U.shadow, U.base, U.lit, U.hi], { seed, freq: 1 / R(size, 0.04), octaves: 2, spread: 1.9 });
    speckle(s, U.dark, { seed: seed + 1, density: 0.06 });
    
    scratches(s, U.deep, { seed: seed + 2, count: R(size, 0.1), minLen: R(size, 0.06), maxLen: R(size, 0.25), angle: Math.PI / 2, jitter: 0.06 });
    grime(s, { seed: seed + 3, strength: 0.3, freq: 1 / R(size, 0.15) });
    return quantise(s, P);
  },
  concrete(size, seed) {
    const P = palette('concrete'); const C = P.by; const s = createSheet(size, size);
    noise(s, [C.shadow, C.base, C.base, C.lit], { seed, freq: 1 / R(size, 0.025), octaves: 2, spread: 1.4 });
    speckle(s, C.deep, { seed: seed + 1, density: 0.03 });
    speckle(s, C.hi, { seed: seed + 2, density: 0.02 });
    crack(s, C.dark, { x: R(size, 0.2), y: R(size, 0.1), len: R(size, 0.7), seed, angle: Math.PI * 0.4 });
    crack(s, C.dark, { x: R(size, 0.75), y: R(size, 0.9), len: R(size, 0.35), seed: seed + 3, angle: -Math.PI * 0.6 });
    grime(s, { seed: seed + 4, strength: 0.3, freq: 1 / R(size, 0.12) });
    return quantise(s, P);
  },
  panel(size, seed) {
    
    
    
    const P = palette('panel'); const G = P.by; const S = palette('steel').by; const U = palette('rust').by;
    const s = createSheet(size, size);
    fill(s, G.base);
    noise(s, [null, G.shadow, null, null, G.lit], { seed, freq: 1 / R(size, 0.06), spread: 1.3 });
    const h = R(size, 0.5);
    seam(s, { from: [0, h], to: [size - 1, h], dark: G.dark, light: G.lit });
    seam(s, { from: [h, 0], to: [h, size - 1], dark: G.dark, light: G.lit });
    const rr = size >= 128 ? 2 : 1; const step = R(size, 0.25);
    for (let i = 0; i < 4; i += 1) {
      rivet(s, { x: R(size, 0.125) + i * step, y: h - rr - 1, r: rr, base: G.lit, light: G.hi, dark: G.dark });
      rivet(s, { x: h - rr - 1, y: R(size, 0.125) + i * step, r: rr, base: G.lit, light: G.hi, dark: G.dark });
    }
    grime(s, { seed: seed + 1, strength: 0.4, freq: 1 / R(size, 0.1) });
    quantise(s, P);
    scratches(s, S.lit, { seed: seed + 2, count: R(size, 0.05), minLen: R(size, 0.03), maxLen: R(size, 0.1) });
    noise(s, [U.deep, U.base, null, null, null, null, null], { seed: seed + 3, freq: 1 / R(size, 0.06), rect: { x: R(size, 0.6), y: R(size, 0.6), w: R(size, 0.4), h: R(size, 0.4) }, spread: 1.2 });
    return s;
  },
  hidePig(size, seed) {
    const P = palette('hidePig'); const H = P.by; const s = createSheet(size, size);
    noise(s, [H.shadow, H.base, H.base, H.lit, H.lit], { seed, freq: 1 / R(size, 0.05), octaves: 2 });
    
    scratches(s, H.deep, { seed: seed + 1, count: R(size, 0.5), minLen: 2, maxLen: R(size, 0.03), angle: Math.PI / 2, jitter: 0.5 });
    speckle(s, H.dark, { seed: seed + 2, density: 0.015 });
    grime(s, { seed: seed + 3, strength: 0.25, freq: 1 / R(size, 0.14), tint: [1, 0.85, 0.75] });
    return quantise(s, P);
  },
  hideCow(size, seed) {
    const P = palette('hideCow'); const C = P.by; const s = createSheet(size, size);
    
    
    noise(s, [C.black, C.black, C.blackLit, C.greyLit, C.white, C.white], { seed, freq: 1 / R(size, 0.2), spread: 3.0 });
    speckle(s, C.blackLit, { seed: seed + 1, density: 0.08, over: [C.black] });
    speckle(s, C.whiteHi, { seed: seed + 2, density: 0.06, over: [C.white] });
    speckle(s, C.grey, { seed: seed + 3, density: 0.04, over: [C.white] });
    grime(s, { seed: seed + 4, strength: 0.2, freq: 1 / R(size, 0.12) });
    return quantise(s, P);
  },
  feather(size, seed) {
    const P = palette('feather'); const F = P.by; const s = createSheet(size, size);
    fill(s, F.base);
    
    
    
    
    
    
    const cw = R(size, 0.0625); const ch = R(size, 0.07);
    for (let row = 0; row * ch < size + ch; row += 1) {
      const off = (row & 1) ? cw >> 1 : 0;
      for (let col = -1; col * cw < size + cw; col += 1) {
        const x0 = col * cw + off; const y0 = row * ch; const y1 = y0 + ch - 1;
        for (let x = x0; x < x0 + cw; x += 1) {
          const t = (x - x0) / (cw - 1); const dip = Math.round((1 - Math.abs(t - 0.5) * 2) * (ch * 0.45));
          for (let dy = 0; dy <= dip; dy += 1) set(s, x, y1 - dy, F.dark);
          set(s, x, y1 - dip - 1, F.lit);
        }
        const qx = x0 + (cw >> 1);
        for (let y = y0 + 1; y < y1 - Math.round(ch * 0.45) - 1; y += 1) set(s, qx, y, F.shadow);
      }
    }
    speckle(s, F.hi, { seed, density: 0.03, over: [F.base, F.lit] });
    grime(s, { seed: seed + 1, strength: 0.22, freq: 1 / R(size, 0.15) });
    return quantise(s, P);
  },
  straw(size, seed) {
    const P = palette('straw'); const T = P.by; const s = createSheet(size, size);
    fill(s, T.dark);
    
    scratches(s, T.deep, { seed, count: R(size, 1.2), minLen: R(size, 0.04), maxLen: R(size, 0.12) });
    scratches(s, T.shadow, { seed: seed + 1, count: R(size, 1.2), minLen: R(size, 0.04), maxLen: R(size, 0.12) });
    scratches(s, T.base, { seed: seed + 2, count: R(size, 1.0), minLen: R(size, 0.04), maxLen: R(size, 0.1) });
    scratches(s, T.lit, { seed: seed + 3, count: R(size, 0.6), minLen: R(size, 0.03), maxLen: R(size, 0.08) });
    scratches(s, T.hi, { seed: seed + 4, count: R(size, 0.25), minLen: R(size, 0.02), maxLen: R(size, 0.06) });
    return quantise(s, P);
  },
};

export const MATERIALS = Object.freeze(Object.keys(RECIPES));


export function materialColours(name) {
  const base = palette(name === 'hair' ? 'hair' : name).stops.slice();
  if (name === 'panel') return base.concat([palette('steel').by.lit, palette('rust').by.deep, palette('rust').by.base]);
  return base;
}


export function paintMaterial(name, { size = 128, seed = 1 } = {}) {
  const recipe = RECIPES[name];
  if (!recipe) throw new Error(`paintMaterial: no recipe "${name}" (have ${MATERIALS.join(', ')})`);
  if (!Number.isInteger(size) || size < 8) throw new RangeError(`paintMaterial: size must be an integer >= 8 (got ${size})`);
  return recipe(size, seed | 0);
}
