










export const SUN = norm([-0.35, 1, 0.75]);
export const INK = '#0d0a14'; 
export const SHADE = [0.42, 0.38, 0.72]; 
export const SAT = { cast: 1.4, scenery: 1.25 }; 


export const SPEC = { cast: 0.965, scenery: 0.993 };
export const REF_H = 648; 
export const HALFTONE_CELL = 7; 
export const HULL = 3; 
export const HULL_THIN = 1.6; 


export const THIN_BELOW = 0.9;
export const NO_HULL_BELOW = 0.28;


export const PIXEL_HEIGHT = 720;


export const CORRUPT = { none: 0, dachi: 1, boss: 2 };
export const CRACK = { dachi: 0.07, boss: 0.045 }; 
export const CRACK_SCALE = 7; 


export function pxScale(h) { return Math.max(0.5, h / REF_H); }




export const LINE_ZOOM = { world: 1, battle: 1.15, portrait: 1.3 };
export function lineZoom(role) { return LINE_ZOOM[role] || 1; }


export function portraitLine(px) { return Math.max(0.8, px / 80) * (px >= 96 ? LINE_ZOOM.portrait : 1); }


export function hullFor(size) {
  if (!(size >= NO_HULL_BELOW)) return 0;
  return size < THIN_BELOW ? HULL_THIN : HULL;
}



export function keepHull(byte, phone) { return byte > 0 && (!phone || byte >= hwByte(HULL)); }

export const NO_HULL_MATERIALS = ['fire', 'lamp-glow', 'glass'];
export function hullMaterial(id) { return !NO_HULL_MATERIALS.includes(id); }


export const hwByte = (px) => Math.max(0, Math.min(255, Math.round(px * 10)));


export function castMode(variant, id) {
  if (id === 'lamp-glow') return { glow: true, corrupt: CORRUPT.none };
  if (variant === 'c') return { glow: false, corrupt: CORRUPT.dachi };
  if (variant === 'b' && id !== 'metal') return { glow: false, corrupt: CORRUPT.boss };
  return { glow: false, corrupt: CORRUPT.none };
}


export function lookName(search = '') {
  const m = /[?&]look=([a-z]+)/.exec(search);
  return m && m[1] === 'cozy' ? 'cozy' : 'cel';
}









export const HULL_CELLS = 5;
export const HULL_CELL_MIN = 0.05;



export const HULL_FINE = 0.16;
export const COARSE_MATERIALS = ['leaf', 'blossom', 'bark'];
export function hullLod(groups, { cells = HULL_CELLS, cellMin = HULL_CELL_MIN, fine = HULL_FINE, keep = () => true, coarse = (m) => COARSE_MATERIALS.includes(m) } = {}) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const g of groups) for (let v = 0; v < g.position.length; v += 3) {
    const x = g.position[v], y = g.position[v + 1], z = g.position[v + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  const size = Math.max(x1 - x0, y1 - y0, z1 - z0);
  const empty = { pos: new Float32Array(0), nor: new Float32Array(0), idx: new Uint32Array(0), size: size > 0 ? size : 0 };
  if (!(size > 0)) return empty;
  const cellC = Math.max(cellMin, size / cells), cellF = Math.max(cellMin, Math.min(fine, size / cells));
  const ids = new Map(), sum = [], tris = [], seen = new Set(), members = [];
  for (const g of groups) {
    if (!keep(g.material)) continue;
    const co = coarse(g.material), cell = co ? cellC : cellF, tag = co ? 'c' : 'f';
    const P = g.position, N = g.normal, I = g.index, at = new Int32Array(P.length / 3);
    for (let v = 0; v < P.length / 3; v++) {
      const k = tag + Math.floor((P[v * 3] - x0) / cell) + ',' + Math.floor((P[v * 3 + 1] - y0) / cell) + ',' + Math.floor((P[v * 3 + 2] - z0) / cell);
      let c = ids.get(k);
      if (c === undefined) { c = ids.size; ids.set(k, c); sum.push(0, 0, 0, 0, 0, 0, 0); }
      const s = c * 7;
      sum[s] += P[v * 3]; sum[s + 1] += P[v * 3 + 1]; sum[s + 2] += P[v * 3 + 2];
      sum[s + 3] += N[v * 3]; sum[s + 4] += N[v * 3 + 1]; sum[s + 5] += N[v * 3 + 2]; sum[s + 6]++;
      at[v] = c;
    }
    members.push([P, at]);
    for (let t = 0; t < I.length; t += 3) {
      const a = at[I[t]], b = at[I[t + 1]], c = at[I[t + 2]];
      if (a === b || b === c || a === c) continue;
      const lo = Math.min(a, b, c), hi = Math.max(a, b, c), key = lo + ',' + (a + b + c - lo - hi) + ',' + hi;
      if (seen.has(key)) continue; 
      seen.add(key); tris.push(a, b, c);
    }
  }
  const n = ids.size, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  for (let c = 0; c < n; c++) {
    const s = c * 7, k = sum[s + 6], l = Math.hypot(sum[s + 3], sum[s + 4], sum[s + 5]) || 1;
    pos[c * 3] = sum[s] / k; pos[c * 3 + 1] = sum[s + 1] / k; pos[c * 3 + 2] = sum[s + 2] / k;
    nor[c * 3] = sum[s + 3] / l; nor[c * 3 + 1] = sum[s + 4] / l; nor[c * 3 + 2] = sum[s + 5] / l;
  }
  
  
  const out = new Float32Array(n);
  for (const [P, at] of members) for (let v = 0; v < at.length; v++) {
    const c = at[v], d = (P[v * 3] - pos[c * 3]) * nor[c * 3] + (P[v * 3 + 1] - pos[c * 3 + 1]) * nor[c * 3 + 1] + (P[v * 3 + 2] - pos[c * 3 + 2]) * nor[c * 3 + 2];
    if (d > out[c]) out[c] = d;
  }
  for (let c = 0; c < n; c++) for (let j = 0; j < 3; j++) pos[c * 3 + j] += nor[c * 3 + j] * out[c];
  return { pos, nor, idx: Uint32Array.from(tris), size };
}






export const GROUND_CLASSES = ['grass', 'tall', 'sand', 'rock', 'lava', 'plaza', 'shallow', 'deep', 'wood', 'cliff',
  'jungle', 'reef', 'kelp', 'ruin', 'glade', 'thicket', 'moss'];
export const GROUND_REGIONS = ['kazan', 'slope', 'jungle', 'road', 'coast', 'shrine', 'coral', 'verdant', 'ember', 'river', 'canopy', 'fig', 'ruins', 'court', 'volcano'];


export const GROUND_BASE = {
  grass: ['#59ad46', '#87cf61'], tall: ['#357f2e', '#4f9f38'], sand: ['#e8c98a', '#f6e2a8'], rock: ['#7d7266', '#9a8f7e'],
  lava: ['#e8541a', '#ffa22e'], plaza: ['#74b04a', '#9ad35e'], shallow: ['#e3c98c', '#f0dca4'], deep: ['#d0b67c', '#e0c890'],
  wood: ['#2f7a34', '#3f9640'], cliff: ['#6a5c56', '#857468'], jungle: ['#2c7d3a', '#3f9a46'], reef: ['#e6c8b0', '#f4dcc6'],
  kelp: ['#2f7f74', '#43a08e'], ruin: ['#97a6b4', '#b4c2cc'], glade: ['#2a6f38', '#3a8a40'], thicket: ['#1f5a32', '#2c7038'],
  moss: ['#6f9a54', '#8cb866'], path: ['#e6bf8f', '#fff4dc'],
};
export const GROUND_REGION = {
  
  
  kazan: { grass: ['#8a8a46', '#a9a35c'], plaza: ['#9a8a5a', '#b8a670'], rock: ['#3e383e', '#5a5058'], cliff: ['#5e4a44', '#7a625a'], path: ['#d9b289', '#fff0d4'] },
  slope: { grass: ['#8a8a46', '#a9a35c'], tall: ['#6e7034', '#8c8a44'], rock: ['#46404a', '#625862'], cliff: ['#5e4a44', '#7a625a'], path: ['#d9b289', '#fff0d4'] },
  jungle: { grass: ['#3f9a3a', '#6cbf48'], jungle: ['#21703a', '#36924a'], tall: ['#2a7430', '#3f9238'] },
  road: {},
  coast: { sand: ['#f0d48e', '#fde9b4'], shallow: ['#ecd294', '#f8e4b0'], grass: ['#5fb04a', '#8fd25e'] },
  
  shrine: { plaza: ['#d6b98a', '#ead2a4'], grass: ['#4fa65a', '#7fcc78'], path: ['#ead0a8', '#ffffff'] },
  
  coral: { reef: ['#a8d8d0', '#c6ece4'], kelp: ['#1f7f80', '#2fa0a0'], ruin: ['#7f9cb4', '#a0bed2'], sand: ['#b8dcd0', '#d4eee4'],
    grass: ['#3a9a86', '#5cbca0'], tall: ['#287c70', '#3a9a86'], path: ['#c8e6e0', '#ffffff'] },
  
  river: { rock: ['#8a5e3a', '#a87a4e'], sand: ['#8a7048', '#a88a5c'], jungle: ['#1f6a36', '#2f8844'], tall: ['#25703a', '#3a8e40'], grass: ['#3a8a3a', '#5aae48'] },
  
  
  canopy: { rock: ['#b08a52', '#d0aa6a'], glade: ['#8cc64a', '#b6e060'], moss: ['#1e5a3a', '#2c7448'], thicket: ['#2a6a2c', '#3c8a34'], cliff: ['#163a26', '#1f4a30'] },
  
  fig: { shallow: ['#5aa8a8', '#8ed4cc'], deep: ['#4a9898', '#7ac4bc'], tall: ['#6aa83a', '#8cc84a'], grass: ['#5aa040', '#7cc050'],
    jungle: ['#21703a', '#36924a'], path: ['#b8784a', '#e8b080'], sand: ['#8e5a34', '#b87c4c'] }, 
  
  ruins: { ruin: ['#c8a46a', '#e0c088'], plaza: ['#d8b47a', '#ecd09a'], cliff: ['#4a5a3a', '#5e6e46'], tall: ['#4a8a30', '#6aaa40'] },
  
  court: { deep: ['#14101e', '#2a2240'], ruin: ['#b8b0c8', '#d4cce0'], rock: ['#8a7fa0', '#a498bc'], plaza: ['#3a3048', '#4c405c'], cliff: ['#1a1622', '#2a2434'],
    grass: ['#2f6a3a', '#3f8a48'], tall: ['#2a5a34', '#3a7a40'] },
  
  
  volcano: { grass: ['#8a8a46', '#a9a35c'], plaza: ['#9a8a5a', '#b8a670'], rock: ['#3e383e', '#5a5058'], cliff: ['#1c1214', '#5a2416'], path: ['#d9b289', '#fff0d4'] },
  verdant: { grass: ['#3a8f34', '#6cc044'], glade: ['#1f6a34', '#3a9a3c'], thicket: ['#164f2e', '#256a36'], moss: ['#5f9a4a', '#8cc65a'] },
  
  
  ember: { rock: ['#4a3f3b', '#5f524b'], cliff: ['#2b2422', '#3d3330'], moss: ['#1f5c58', '#36a08a'], grass: ['#4a3f3b', '#5f524b'],
    path: ['#a8805e', '#e8c89a'] },
};

export function groundPalette(region) {
  return { ...GROUND_BASE, ...(GROUND_REGION[region] || {}) };
}

export function groundPaletteBytes(regions = GROUND_REGIONS, classes = GROUND_CLASSES) {
  const W = classes.length + 1, H = regions.length * 2, out = new Uint8Array(W * H * 4);
  regions.forEach((r, ri) => {
    const p = groundPalette(r);
    [...classes, 'path'].forEach((c, ci) => {
      for (let k = 0; k < 2; k++) {
        const o = ((ri * 2 + k) * W + ci) * 4, [R, G, B] = hexRgb(p[c][k]);
        out[o] = R; out[o + 1] = G; out[o + 2] = B; out[o + 3] = 255;
      }
    });
  });
  return { data: out, width: W, height: H };
}

export function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function luma(h) { const [r, g, b] = hexRgb(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

export function classByte(cls) { const i = GROUND_CLASSES.indexOf(cls); return i < 0 ? 0 : i; }

const GROUND_ALIAS = { village: 'volcano', 'shrine-village': 'shrine', 'tomo-coast': 'coast', shellhaven: 'coral', 'kelp-maze': 'coral', 'temple-porch': 'coral', 'temple-nave': 'coral', 'temple-sanctum': 'coral', 'ember-a': 'ember', 'ember-b': 'ember', hollowroot: 'verdant', 'thorn-upper': 'verdant', 'thorn-lower': 'verdant', 'tree-vault': 'verdant', 'tree-heart': 'verdant', 'tree-roots': 'verdant', vinegate: 'river', 'canopy-walk': 'canopy', 'fig-terraces': 'fig', 'gale-ledges': 'volcano', 'ruin-steps': 'ruins', 'court-stones': 'court', 'court-gallery': 'court', 'court-guards': 'court', 'court-throne': 'court', minehead: 'ember', 'mine-workings': 'ember', 'shaft-a': 'ember', 'shaft-b': 'ember', 'seam-hall': 'ember', 'seam-narrows': 'ember', 'seam-stones': 'ember', 'seam-hollow': 'ember', 'geode-mouth': 'ember', 'geode-prism': 'ember', 'geode-heart': 'ember', 'geode-vault': 'ember' };
export function regionByte(region) { const i = GROUND_REGIONS.indexOf(GROUND_ALIAS[region] || region); return i < 0 ? GROUND_REGIONS.indexOf('road') : i; }




export const WATER_BANDS = [[0.035, '#ffffff'], [0.2, '#5fe8d6'], [0.5, '#19a7e0'], [Infinity, '#1257b8']];
export const WATER_ALPHA = [1, 0.8, 0.94, 0.97];
export const WATER_EDGE = '#0b3f8f'; 


export const WATER_TINT = { minehead: ['#8fa39c', '#2f5a52', '#1d3d38', '#0f2420'] };

export const GROUND_INK = 1.0;
export function waterBand(depth) { let i = 0; while (depth >= WATER_BANDS[i][0]) i++; return i; }

export const LAVA = { base: '#ff6a1a', hot: '#ffb02e', core: '#ffe46a' };

export const SPRING = { base: '#8fe8de', rim: '#3cb8b4', ring: '#ffffff' };

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return v.map((x) => x / l); }
