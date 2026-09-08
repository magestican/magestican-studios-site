
































import {
  atlas, createSheet, palette, gradient, noise, speckle, stripes, grime,
  dither, scratches, seam, stitches, blood, to15, set, valueNoise,
} from '../../ps1/texturePaint.mjs';


export const CREATURE_SPECIES = Object.freeze(['chicken', 'porker', 'cow', 'horse']);




export const CREATURE_ATLAS_PARTS = Object.freeze({
  chicken: Object.freeze(['torso', 'wing', 'neck', 'head', 'leg', 'tail', 'comb']),
  porker: Object.freeze(['torso', 'arm', 'head', 'leg', 'snout', 'ear']),
  cow: Object.freeze(['torso', 'udder', 'tentacle', 'head', 'leg', 'horn', 'tail']),
  horse: Object.freeze(['barrel', 'neck', 'leg', 'tail']),
});




const P = 32;










function chickenParts(seed) {
  const f = palette('feather');
  const s = palette('hidePig');   
  const b = palette('blood');
  const straw = palette('straw');

  const torso = createSheet(P, P, f.by.base);
  gradient(torso, f, { axis: 'y', from: 4, to: 1, dither: true });
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  noise(torso, [f.by.shadow, f.by.base, f.by.lit], { seed, freq: 1.1, octaves: 1, spread: 0.8 });
  for (let row = 0; row < P; row += 6) {
    dither(torso, f.by.deep, f.by.hi, 0.5, [0, row, P, 2]);
    dither(torso, f.by.lit, f.by.base, 0.4, [0, row + 3, P, 2]);
  }
  speckle(torso, f.by.dark, { seed: seed + 1, density: 0.05 });
  grime(torso, { seed: seed + 2, strength: 0.22, freq: 1 / 9 });

  const wing = createSheet(P, P, f.by.shadow);
  stripes(wing, [[f.by.deep, 2], [f.by.shadow, 2], [f.by.base, 2], [f.by.lit, 1]], { axis: 'x' });
  noise(wing, [f.by.dark, f.by.shadow, f.by.base], { seed: seed + 3, freq: 0.6 });
  
  
  
  
  speckle(wing, f.by.hi, { seed: seed + 12, density: 0.22, over: [f.by.base, f.by.lit] });
  grime(wing, { seed: seed + 4, strength: 0.3 });

  const neck = createSheet(P, P, s.by.base);
  gradient(neck, s, { axis: 'y', from: 4, to: 2, dither: true });
  noise(neck, [s.by.shadow, s.by.base, s.by.lit], { seed: seed + 5, freq: 0.7 });
  
  dither(neck, s.by.deep, b.by.deep, 0.35, [0, Math.round(P * 0.62), P, P]);
  speckle(neck, b.by.rim, { seed: seed + 6, density: 0.05 });

  const head = createSheet(P, P, s.by.lit);
  noise(head, [s.by.base, s.by.lit, s.by.hi], { seed: seed + 7, freq: 0.8 });
  grime(head, { seed: seed + 8, strength: 0.2 });

  const leg = createSheet(P, P, straw.by.shadow);
  stripes(leg, [[straw.by.deep, 1], [straw.by.shadow, 2], [straw.by.base, 1]], { axis: 'y' });
  scratches(leg, straw.by.dark, { seed: seed + 9, count: 10, minLen: 3, maxLen: 7 });

  const tail = createSheet(P, P, f.by.deep);
  stripes(tail, [[f.by.dark, 2], [f.by.deep, 2], [f.by.shadow, 1]], { axis: 'x' });
  noise(tail, [f.by.dark, f.by.deep], { seed: seed + 10, freq: 0.5 });

  const comb = createSheet(P, P, b.by.base);
  gradient(comb, b, { axis: 'y', from: 4, to: 1, dither: true });
  noise(comb, [b.by.deep, b.by.base, b.by.fresh], { seed: seed + 11, freq: 0.9 });

  return { torso, wing, neck, head, leg, tail, comb };
}








function porkerParts(seed) {
  const h = palette('hidePig');
  const b = palette('blood');
  const th = palette('thread');

  const torso = createSheet(P, P, h.by.base);
  gradient(torso, h, { axis: 'y', from: 4, to: 2, dither: true });
  noise(torso, [h.by.deep, h.by.base, h.by.lit], { seed, freq: 0.45, octaves: 2 });
  
  
  
  
  speckle(torso, h.by.dark, { seed: seed + 1, density: 0.06 });
  scratches(torso, h.by.dark, { seed: seed + 2, count: 18, minLen: 2, maxLen: 5, angle: -1.35, jitter: 0.5 });
  
  seam(torso, { from: [Math.round(P * 0.30), 2], to: [Math.round(P * 0.38), P - 3], dark: b.by.deep, light: h.by.hi });
  stitches(torso, {
    from: [Math.round(P * 0.30), 2], to: [Math.round(P * 0.38), P - 3],
    light: th.by.base, dark: th.by.dark, dash: 1, gap: 3,
  });
  blood(torso, { x: Math.round(P * 0.34), y: Math.round(P * 0.55), r: 4, seed: seed + 3, pal: b, drips: 2 });
  grime(torso, { seed: seed + 4, strength: 0.35, freq: 1 / 10 });

  const arm = createSheet(P, P, h.by.lit);
  gradient(arm, h, { axis: 'x', from: 4, to: 2, dither: true });
  noise(arm, [h.by.shadow, h.by.lit, h.by.hi], { seed: seed + 5, freq: 0.6 });
  speckle(arm, h.by.deep, { seed: seed + 6, density: 0.06 });
  grime(arm, { seed: seed + 7, strength: 0.28 });

  const head = createSheet(P, P, h.by.base);
  noise(head, [h.by.shadow, h.by.base, h.by.lit], { seed: seed + 8, freq: 0.7 });
  seam(head, { from: [4, Math.round(P * 0.30)], to: [P - 5, Math.round(P * 0.34)], dark: b.by.deep, light: h.by.hi });
  stitches(head, {
    from: [4, Math.round(P * 0.30)], to: [P - 5, Math.round(P * 0.34)],
    light: th.by.base, dark: th.by.dark, dash: 1, gap: 3,
  });

  const leg = createSheet(P, P, h.by.shadow);
  gradient(leg, h, { axis: 'y', from: 3, to: 1, dither: true });
  speckle(leg, h.by.dark, { seed: seed + 9, density: 0.12 });
  grime(leg, { seed: seed + 10, strength: 0.5, freq: 1 / 6 });

  const snout = createSheet(P, P, h.by.hi);
  noise(snout, [h.by.lit, h.by.hi], { seed: seed + 11, freq: 1.1 });
  speckle(snout, h.by.shadow, { seed: seed + 12, density: 0.08 });

  const ear = createSheet(P, P, h.by.deep);
  gradient(ear, h, { axis: 'y', from: 1, to: 3, dither: true });

  return { torso, arm, head, leg, snout, ear };
}










function cowParts(seed) {
  const c = palette('hideCow');
  const h = palette('hidePig');
  const b = palette('blood');

  const torso = createSheet(P, P, c.by.white);
  noise(torso, [c.by.whiteHi, c.by.white, c.by.greyLit], { seed, freq: 0.4, octaves: 2 });
  
  
  
  
  
  
  
  patches(torso, seed + 1, 0.52, c.by.black, c.by.blackLit);
  grime(torso, { seed: seed + 2, strength: 0.3, freq: 1 / 8, tint: [1, 0.96, 0.9] });

  const udder = createSheet(P, P, h.by.hi);
  gradient(udder, h, { axis: 'y', from: 5, to: 3, dither: true });
  noise(udder, [h.by.lit, h.by.hi], { seed: seed + 3, freq: 0.9 });
  
  
  
  stripes(udder, [[h.by.lit, 5], [h.by.hi, 2], [h.by.lit, 9]], { axis: 'y', offset: 2 });
  speckle(udder, b.by.rim, { seed: seed + 4, density: 0.03 });

  const tentacle = createSheet(P, P, h.by.lit);
  gradient(tentacle, h, { axis: 'x', from: 5, to: 3, dither: true });
  stripes(tentacle, [[h.by.lit, 3], [h.by.hi, 1]], { axis: 'x' });
  noise(tentacle, [h.by.base, h.by.lit], { seed: seed + 5, freq: 1.0 });
  speckle(tentacle, b.by.deep, { seed: seed + 6, density: 0.04 });

  const head = createSheet(P, P, c.by.white);
  noise(head, [c.by.greyLit, c.by.white, c.by.whiteHi], { seed: seed + 7, freq: 0.6 });
  patches(head, seed + 8, 0.46, c.by.black, c.by.blackLit);

  const leg = createSheet(P, P, c.by.whiteHi);
  patches(leg, seed + 9, 0.44, c.by.black, c.by.blackLit);
  grime(leg, { seed: seed + 10, strength: 0.55, freq: 1 / 6 });

  const horn = createSheet(P, P, c.by.greyLit);
  gradient(horn, c, { axis: 'y', from: 5, to: 3, dither: true });
  stripes(horn, [[c.by.grey, 1], [c.by.greyLit, 3]], { axis: 'x' });

  const tail = createSheet(P, P, c.by.blackLit);
  noise(tail, [c.by.black, c.by.blackLit, c.by.grey], { seed: seed + 11, freq: 0.7 });

  return {
    torso, udder, tentacle, head, leg, horn, tail,
  };
}








function horseParts(seed) {
  const l = palette('leather');
  const s = palette('steel');
  const b = palette('blood');

  const barrel = createSheet(P, P, l.by.deep);
  gradient(barrel, l, { axis: 'y', from: 1, to: 3, dither: true });
  noise(barrel, [l.by.dark, l.by.deep, l.by.shadow], { seed, freq: 0.4, octaves: 2 });
  
  dither(barrel, l.by.shadow, s.by.lit, 0.30, [Math.round(P * 0.55), 0, Math.round(P * 0.80), P]);
  speckle(barrel, s.by.hi, { seed: seed + 1, density: 0.12, rect: [Math.round(P * 0.55), 0, Math.round(P * 0.25), P] });
  grime(barrel, { seed: seed + 2, strength: 0.4, freq: 1 / 9 });

  const neck = createSheet(P, P, l.by.dark);
  gradient(neck, l, { axis: 'y', from: 0, to: 3, dither: true });
  stripes(neck, [[l.by.dark, 2], [l.by.deep, 3]], { axis: 'x' });
  dither(neck, l.by.deep, s.by.shadow, 0.28, [0, Math.round(P * 0.45), P, P]);
  speckle(neck, b.by.deep, { seed: seed + 3, density: 0.03 });

  const leg = createSheet(P, P, l.by.dark);
  gradient(leg, l, { axis: 'y', from: 2, to: 0, dither: true });
  grime(leg, { seed: seed + 4, strength: 0.6, freq: 1 / 5 });

  const tail = createSheet(P, P, l.by.dark);
  stripes(tail, [[l.by.dark, 2], [l.by.deep, 1]], { axis: 'x' });
  noise(tail, [l.by.dark, l.by.deep], { seed: seed + 5, freq: 0.8 });

  return { barrel, neck, leg, tail };
}






function patches(sheet, seed, cut, dark, edge) {
  const inside = [];
  for (let y = 0; y < sheet.height; y += 1) {
    for (let x = 0; x < sheet.width; x += 1) {
      
      
      const n = valueAt(x, y, seed, 0.16) * 0.7 + valueAt(x, y, seed + 97, 0.42) * 0.3;
      inside.push(n < cut);
    }
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= sheet.width || y >= sheet.height ? false : inside[y * sheet.width + x]);
  for (let y = 0; y < sheet.height; y += 1) {
    for (let x = 0; x < sheet.width; x += 1) {
      if (!at(x, y)) continue;
      const rim = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      set(sheet, x, y, to15(rim ? edge : dark));
    }
  }
  return sheet;
}





function valueAt(x, y, seed, freq) {
  return valueNoise(x * freq, y * freq, seed);
}

const PAINTERS = {
  chicken: chickenParts, porker: porkerParts, cow: cowParts, horse: horseParts,
};









export function paintCreatureAtlas(species, { seed = 11, size = 128 } = {}) {
  const paint = PAINTERS[species];
  if (!paint) throw new Error(`paintCreatureAtlas: no painter for "${species}" (have ${CREATURE_SPECIES.join(', ')})`);
  const parts = paint(seed);
  
  
  
  
  
  
  
  for (const sheet of Object.values(parts)) {
    for (let i = 0; i < sheet.data.length; i += 4) {
      const q = to15([sheet.data[i], sheet.data[i + 1], sheet.data[i + 2]]);
      sheet.data[i] = q[0]; sheet.data[i + 1] = q[1]; sheet.data[i + 2] = q[2];
    }
  }
  const names = CREATURE_ATLAS_PARTS[species];
  for (const n of names) {
    if (!parts[n]) throw new Error(`paintCreatureAtlas: ${species} declares part "${n}" and paints nothing for it`);
  }
  for (const n of Object.keys(parts)) {
    if (!names.includes(n)) throw new Error(`paintCreatureAtlas: ${species} paints "${n}", which is not in CREATURE_ATLAS_PARTS`);
  }
  return atlas(parts, { size });
}


export function paintBestiary(opts = {}) {
  const out = {};
  for (const s of CREATURE_SPECIES) out[s] = paintCreatureAtlas(s, opts);
  return out;
}
