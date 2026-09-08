






















































import {
  createSheet, palette, fill, shade, stitches, seam, rivet, patch, blit, set, get, atlas,
  speckle, quantise, mulberry32,
} from './texturePaint.mjs';
import { paintMaterial } from './materials.mjs';

export const XANDER_PARTS = Object.freeze({
  torso: [128, 64], pelvis: [64, 40], leg: [32, 96], sleeve: [32, 48], trap: [48, 24],
  boot: [48, 32], cuff: [24, 16], hand: [24, 24], skin: [32, 32], hair: [48, 32],
});






const FIELD = Object.freeze({
  torso: () => palette('plaid').by.red, sleeve: () => palette('plaid').by.red, trap: () => palette('plaid').by.red,
  pelvis: () => palette('denim').by.base, leg: () => palette('denim').by.base,
  boot: () => palette('leather').by.base, cuff: () => palette('leather').by.base,
  hand: () => palette('skin').by.lit, skin: () => palette('skin').by.lit,
  hair: () => palette('hair').by.base,
});





























export function xanderPlaid(w, h, seed, { period = 16, offset = [0, 0] } = {}) {
  const P = palette('plaid'); const B = P.by; const s = createSheet(w, h);
  const q = period / 16;
  const n = (k) => Math.max(1, Math.round(k * q));
  const sett = [[B.dark, n(2)], [B.red, n(6)], [B.mustard, n(1)], [B.red, n(6)], [B.redLit, n(1)]];
  const seq = [];
  for (const [c, k] of sett) for (let i = 0; i < k; i += 1) seq.push(c);
  const L = seq.length;
  const at = (i) => seq[((i % L) + L) % L];
  const is = (c, stop) => c[0] === stop[0] && c[1] === stop[1] && c[2] === stop[2];
  const cross = (a, b) => {
    const da = is(a, B.dark); const db = is(b, B.dark);
    if (da && db) return B.black;
    if (da || db) return B.dark;
    const ma = is(a, B.mustard); const mb = is(b, B.mustard);
    if (ma && mb) return B.mustardLit;
    if (ma || mb) return B.mustard;
    if (is(a, B.redLit) || is(b, B.redLit)) return B.redLit;
    return B.red;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) set(s, x, y, cross(at(x + offset[0]), at(y + offset[1])));
  }
  
  
  
  speckle(s, B.dark, { seed, density: 0.02, over: [B.red] });
  return quantise(s, P);
}


function denimInto(s, denim, x, y, w, h) {
  return blit(s, denim, x, y, { x: x % denim.width, y: y % denim.height, w, h });
}




function torsoPanel(seed) {
  const [W, H] = XANDER_PARTS.torso;
  const D = palette('denim').by; const L = palette('leather').by;
  const BR = palette('brass').by; const TH = palette('thread').by;
  const s = xanderPlaid(W, H, seed);
  const denim = paintMaterial('denim', { size: 128, seed: seed + 2 });
  const leather = paintMaterial('leather', { size: 128, seed: seed + 3 });

  
  const WAIST = 48;
  
  
  
  
  const BIB_TOP = 28; const BIB_W = 24;
  const SW = 5;                         

  
  denimInto(s, denim, 0, WAIST, W, H - WAIST);
  
  denimInto(s, denim, 0, BIB_TOP, BIB_W, H - BIB_TOP);
  denimInto(s, denim, W - BIB_W, BIB_TOP, BIB_W, H - BIB_TOP);
  
  
  seam(s, { from: [0, BIB_TOP], to: [BIB_W - 1, BIB_TOP], dark: D.dark, light: D.lit });
  seam(s, { from: [W - BIB_W, BIB_TOP], to: [W - 1, BIB_TOP], dark: D.dark, light: D.lit });
  seam(s, { from: [BIB_W - 1, BIB_TOP], to: [BIB_W - 1, WAIST - 1], dark: D.dark });
  seam(s, { from: [W - BIB_W, BIB_TOP], to: [W - BIB_W, WAIST - 1], dark: D.dark });
  
  
  
  
  
  
  
  
  stitches(s, { from: [BIB_W - 3, BIB_TOP + 2], to: [BIB_W - 3, WAIST - 2], light: TH.shadow, dash: 1, gap: 3 });
  stitches(s, { from: [W - BIB_W + 2, BIB_TOP + 2], to: [W - BIB_W + 2, WAIST - 2], light: TH.shadow, dash: 1, gap: 3 });
  
  
  
  const PY = 33; const PH = 9; const PW = 6;
  fill(s, D.shadow, { x: 0, y: PY, w: PW, h: PH }); fill(s, D.shadow, { x: W - PW, y: PY, w: PW, h: PH });
  for (let x = 0; x < PW; x += 1) {
    set(s, x, PY, D.lit); set(s, W - 1 - x, PY, D.lit);
    set(s, x, PY + PH - 1, D.dark); set(s, W - 1 - x, PY + PH - 1, D.dark);
  }
  for (let y = PY; y < PY + PH; y += 1) { set(s, PW - 1, y, D.dark); set(s, W - PW, y, D.lit); }
  stitches(s, { from: [1, PY + 1], to: [PW - 3, PY + 1], light: TH.shadow });
  stitches(s, { from: [W - PW + 2, PY + 1], to: [W - 2, PY + 1], light: TH.shadow });
  
  
  for (const x0 of [BIB_W - SW - 1, W - BIB_W + 1]) {
    denimInto(s, denim, x0, 0, SW, BIB_TOP);
    seam(s, { from: [x0, 0], to: [x0, BIB_TOP - 1], dark: D.dark });
    seam(s, { from: [x0 + SW - 1, 0], to: [x0 + SW - 1, BIB_TOP - 1], dark: D.dark, light: D.lit });
    stitches(s, { from: [x0 + 2, 0], to: [x0 + 2, BIB_TOP - 1], light: TH.shadow, dash: 1, gap: 3 });
    patch(s, { rect: { x: x0 - 1, y: BIB_TOP - 3, w: SW + 2, h: 5 }, colour: BR.base, light: BR.hi, dark: BR.dark });
    set(s, x0 + 1, BIB_TOP - 1, BR.dark); set(s, x0 + 2, BIB_TOP - 1, BR.dark); set(s, x0 + 3, BIB_TOP - 1, BR.dark);
  }
  
  
  for (const x0 of [50, 73]) {
    denimInto(s, denim, x0, 0, SW, WAIST);
    seam(s, { from: [x0, 0], to: [x0, WAIST - 1], dark: D.dark });
    seam(s, { from: [x0 + SW - 1, 0], to: [x0 + SW - 1, WAIST - 1], dark: D.dark, light: D.lit });
    stitches(s, { from: [x0 + 2, 0], to: [x0 + 2, WAIST - 1], light: TH.shadow, dash: 1, gap: 3 });
  }
  
  
  
  
  blit(s, leather, 0, WAIST - 2, { x: 0, y: 40, w: W, h: 4 });
  fill(s, L.hi, { x: 0, y: WAIST - 2, w: W, h: 1 });
  fill(s, L.deep, { x: 0, y: WAIST + 1, w: W, h: 1 });
  
  stitches(s, { from: [0, WAIST + 3], to: [W - 1, WAIST + 3], light: TH.shadow, dash: 2, gap: 4 });
  return s;
}




function pelvisPanel(seed) {
  const [W, H] = XANDER_PARTS.pelvis;          
  const D = palette('denim').by; const TH = palette('thread').by;
  const s = createSheet(W, H);
  blit(s, paintMaterial('denim', { size: 64, seed: seed + 4 }), 0, 0, { x: 0, y: 0, w: W, h: H });
  
  
  seam(s, { from: [0, 0], to: [0, H - 1], dark: D.dark });
  stitches(s, { from: [2, 1], to: [2, H - 3], light: TH.shadow, dash: 1, gap: 3 });
  
  
  
  for (const x0 of [22, 34]) {
    patch(s, { rect: { x: x0, y: 5, w: 8, h: 10 }, colour: D.base, light: D.lit, dark: D.dark, stitch: { light: TH.base, dark: TH.dark } });
  }
  seam(s, { from: [32, 0], to: [32, H - 1], dark: D.deep });
  
  for (const x of [16, 48]) seam(s, { from: [x, 0], to: [x, H - 1], dark: D.deep });
  return s;
}




function legPanel(seed) {
  const [W, H] = XANDER_PARTS.leg;             
  const D = palette('denim').by; const TH = palette('thread').by;
  const s = createSheet(W, H);
  blit(s, paintMaterial('denim', { size: 128, seed: seed + 5 }), 0, 0, { x: 0, y: 0, w: W, h: H });
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  for (const x0 of [0, W - 8]) shade(s, D.lit, 0.18, { x: x0, y: 6, w: 8, h: 36 });
  for (const x0 of [0, W - 5]) { shade(s, D.lit, 0.45, { x: x0, y: 12, w: 5, h: 24 }); shade(s, D.lit, 0.88, { x: x0, y: 16, w: 5, h: 16 }); }
  
  
  
  for (const x0 of [0, W - 7]) { shade(s, D.lit, 0.45, { x: x0, y: 41, w: 7, h: 14 }); shade(s, D.lit, 0.90, { x: x0, y: 44, w: 7, h: 8 }); }
  for (const y of [40, 55]) {
    seam(s, { from: [0, y], to: [6, y], dark: D.deep });
    seam(s, { from: [W - 7, y], to: [W - 1, y], dark: D.deep });
  }
  
  
  
  for (const x of [8, 24]) seam(s, { from: [x, 0], to: [x, H - 1], dark: D.deep });
  stitches(s, { from: [25, 0], to: [25, H - 1], light: TH.shadow, dash: 1, gap: 3 });
  
  fill(s, D.shadow, { x: 0, y: H - 4, w: W, h: 4 });
  seam(s, { from: [0, H - 4], to: [W - 1, H - 4], dark: D.dark, light: D.lit });
  stitches(s, { from: [0, H - 6], to: [W - 1, H - 6], light: TH.shadow, dash: 2, gap: 4 });
  return s;
}





function sleevePanel(seed) {
  const [W, H] = XANDER_PARTS.sleeve;          
  const B = palette('plaid').by;
  const s = xanderPlaid(W, H, seed + 6);
  seam(s, { from: [16, 0], to: [16, H - 1], dark: B.black });    
  
  
  blit(s, xanderPlaid(W, 9, seed + 7, { offset: [5, 3] }), 0, 39);
  seam(s, { from: [0, 39], to: [W - 1, 39], dark: B.black, light: B.redLit });
  shade(s, B.dark, 0.35, { x: 0, y: 46, w: W, h: 2 });
  return s;
}





function trapPanel(seed) {
  const [W, H] = XANDER_PARTS.trap;            
  const B = palette('plaid').by; const D = palette('denim').by; const TH = palette('thread').by;
  const s = xanderPlaid(W, H, seed + 8);
  blit(s, xanderPlaid(W, 4, seed + 9, { offset: [3, 6] }), 0, 1);
  seam(s, { from: [0, 5], to: [W - 1, 5], dark: B.black, light: B.redLit });
  
  
  
  const denim = paintMaterial('denim', { size: 64, seed: seed + 10 });
  for (const [x0, w] of [[6, 11], [31, 11]]) {
    blit(s, denim, x0, 15, { x: x0, y: 15, w, h: H - 15 });
    seam(s, { from: [x0, 15], to: [x0 + w - 1, 15], dark: D.dark, light: D.lit });
    stitches(s, { from: [x0 + 1, 18], to: [x0 + w - 2, 18], light: TH.shadow, dash: 1, gap: 3 });
    stitches(s, { from: [x0 + 1, 22], to: [x0 + w - 2, 22], light: TH.shadow, dash: 1, gap: 3, phase: 2 });
  }
  return s;
}





function bootPanel(seed) {
  const [W, H] = XANDER_PARTS.boot;
  const L = palette('leather').by; const BR = palette('brass').by; const TH = palette('thread').by;
  const s = createSheet(W, H);
  blit(s, paintMaterial('leather', { size: 64, seed: seed + 11 }), 0, 0, { x: 0, y: 0, w: W, h: H });
  
  
  fill(s, L.dark, { x: 0, y: 0, w: 2, h: H }); fill(s, L.dark, { x: W - 2, y: 0, w: 2, h: H });
  seam(s, { from: [3, 0], to: [3, H - 1], dark: L.deep, light: L.hi });
  seam(s, { from: [W - 4, 0], to: [W - 4, H - 1], dark: L.deep, light: L.hi });
  stitches(s, { from: [5, 1], to: [5, H - 2], light: TH.shadow, dash: 1, gap: 3 });
  stitches(s, { from: [W - 6, 1], to: [W - 6, H - 2], light: TH.shadow, dash: 1, gap: 3 });
  
  
  shade(s, L.shadow, 0.5, { x: 20, y: 6, w: 8, h: 14 });
  for (const y of [8, 12, 16]) {
    rivet(s, { x: 19, y, r: 1, base: BR.base, light: BR.hi, dark: BR.dark });
    rivet(s, { x: 28, y, r: 1, base: BR.base, light: BR.hi, dark: BR.dark });
    stitches(s, { from: [21, y], to: [26, y], light: TH.base, dark: TH.dark, dash: 8, gap: 0 });
  }
  
  seam(s, { from: [4, 25], to: [W - 5, 25], dark: L.deep, light: L.hi });
  seam(s, { from: [4, 6], to: [W - 5, 6], dark: L.deep });
  return s;
}




function cuffPanel(seed) {
  const [W, H] = XANDER_PARTS.cuff;            
  const L = palette('leather').by; const TH = palette('thread').by;
  const s = createSheet(W, H);
  blit(s, paintMaterial('leather', { size: 64, seed: seed + 12 }), 0, 0, { x: 0, y: 0, w: W, h: H });
  fill(s, L.lit, { x: 0, y: 2, w: W, h: 2 }); fill(s, L.hi, { x: 0, y: 3, w: W, h: 1 });
  seam(s, { from: [0, 5], to: [W - 1, 5], dark: L.deep });
  stitches(s, { from: [0, 7], to: [W - 1, 7], light: TH.shadow, dash: 1, gap: 3 });
  shade(s, L.shadow, 0.5, { x: 0, y: 12, w: W, h: 4 });
  return s;
}


























function handPanel(seed) {
  const [W, H] = XANDER_PARTS.hand;                    
  const P = palette('skin'); const S = P.by;
  const s = createSheet(W, H, S.lit);
  speckle(s, S.base, { seed: seed + 13, density: 0.04 });
  const back = { tip: Math.round(H * 0.10), knuckle: Math.round(H * 0.22) };   
  const palm = { crease: Math.round(H * 0.78), tip: Math.round(H * 0.90) };     
  const x0 = Math.round(W * 0.34); const x1 = Math.round(W * 0.66);            
  const fingers = [x0 + 2, x0 + 4, x0 + 6];                                     
  for (const x of fingers) {
    for (let y = back.tip; y < back.knuckle; y += 1) set(s, x, y, S.base);
    for (let y = palm.crease + 1; y <= palm.tip; y += 1) set(s, x, y, S.base);
  }
  for (let x = x0 + 1; x < x1; x += 1) { set(s, x, back.knuckle, S.shadow); set(s, x, palm.crease, S.shadow); }
  return quantise(s, P);
}




function hairPanel(seed) {
  const [W, H] = XANDER_PARTS.hair;
  const P = palette('hair'); const Hh = P.by;
  const s = createSheet(W, H, Hh.base);
  
  
  
  
  
  
  
  
  
  
  
  
  
  const rnd = mulberry32(seed + 20);
  let x = 3 + Math.floor(rnd() * 4);
  let lock = 0;
  while (x < W - 3) {
    const lw = 2;
    let dx = 0;
    for (let y = 0; y < H; y += 1) {
      if (y % 8 === 0 && y > 0) dx += Math.round((rnd() - 0.5) * 2);
      const xx = x + dx;
      for (let k = 0; k < lw; k += 1) set(s, xx + k, y, Hh.shadow);
      if (lock % 2 === 0 && y < H * 0.33) set(s, xx - 1, y, Hh.hi);
    }
    x += lw + 7 + Math.floor(rnd() * 5);
    lock += 1;
  }
  
  for (let y = H - 3; y < H; y += 1) shade(s, Hh.deep, 0.2 + ((y - (H - 3)) / 3) * 0.6, { x: 0, y, w: W, h: 1 });
  speckle(s, Hh.light, { seed: seed + 21, density: 0.03, rect: { x: 0, y: 0, w: W, h: Math.floor(H * 0.3) } });
  return quantise(s, P);
}


export function paintXanderParts({ seed = 7 } = {}) {
  return {
    torso: torsoPanel(seed),
    pelvis: pelvisPanel(seed),
    leg: legPanel(seed),
    sleeve: sleevePanel(seed),
    trap: trapPanel(seed),
    boot: bootPanel(seed),
    cuff: cuffPanel(seed),
    hand: handPanel(seed),
    skin: paintMaterial('skin', { size: XANDER_PARTS.skin[0], seed: seed + 14 }),
    hair: hairPanel(seed),
  };
}








export function fieldPointOf(name, sheet) {
  const want = FIELD[name] ? FIELD[name]() : null;
  if (!want) return [0.5, 0.5];
  const cx = sheet.width >> 1; const cy = sheet.height >> 1;
  const R = Math.max(sheet.width, sheet.height);
  for (let r = 0; r < R; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx + dx; const y = cy + dy;
        if (x < 0 || y < 0 || x >= sheet.width || y >= sheet.height) continue;
        const c = get(sheet, x, y);
        if (c[0] === want[0] && c[1] === want[1] && c[2] === want[2]) return [(x + 0.5) / sheet.width, (y + 0.5) / sheet.height];
      }
    }
  }
  throw new Error(`xanderAtlas: part "${name}" has no texel of its field colour`);
}





export function paintXanderAtlas({ seed = 7, size = 256, gutter = undefined } = {}) {
  const parts = paintXanderParts({ seed });
  const A = atlas(parts, gutter === undefined ? { size } : { size, gutter });
  const rects = {};
  for (const [name, r] of Object.entries(A.rects)) rects[name] = Object.freeze({ ...r, solid: Object.freeze(fieldPointOf(name, parts[name])) });
  return { ...A, rects };
}
