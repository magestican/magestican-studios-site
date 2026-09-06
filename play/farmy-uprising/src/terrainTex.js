















































import {
  TERRAIN_RECIPE, markKind, markEnveloped, ROW_ENVELOPE_LO, ROW_ENVELOPE_MEAN,
} from '../../../web-engine/rts/art/terrainRecipe.js';















export const TEX_METRES = 50;
export const TEX_PX = 1024;
const PX_PER_M = TEX_PX / TEX_METRES;

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;


function rgba(c, a) {
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
}


function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}








function scatterCount(w, h, coverage) {
  const want = coverage * TEX_PX * TEX_PX;
  return Math.max(1, Math.round((want / (w * h)) * 1.35));
}







function wrapped(ctx, x, y, w, h, draw) {
  for (const dx of [-TEX_PX, 0, TEX_PX]) {
    for (const dy of [-TEX_PX, 0, TEX_PX]) {
      const px = x + dx;
      const py = y + dy;
      if (px + w < 0 || px - w > TEX_PX || py + h < 0 || py - h > TEX_PX) continue;
      draw(px, py);
    }
  }
}


function drawBlobs(ctx, mark, rand) {
  const w = Math.max(1, mark.scaleMetres[0] * PX_PER_M);
  const h = Math.max(1, mark.scaleMetres[1] * PX_PER_M);
  ctx.globalAlpha = mark.alpha;
  ctx.fillStyle = hex(mark.colour);
  const n = scatterCount(w, h, mark.coverage);
  for (let i = 0; i < n; i += 1) {
    const x = rand() * TEX_PX;
    const y = rand() * TEX_PX;
    
    
    const jw = w * (0.7 + rand() * 0.6);
    const jh = h * (0.7 + rand() * 0.6);
    wrapped(ctx, x, y, jw, jh, (px, py) => {
      ctx.beginPath();
      ctx.ellipse(px, py, jw / 2, jh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.globalAlpha = 1;
}
















const SOFT_GAIN = 1.309;

function drawSoft(ctx, mark, rand) {
  const w = Math.max(1, mark.scaleMetres[0] * PX_PER_M) * SOFT_GAIN;
  const h = Math.max(1, mark.scaleMetres[1] * PX_PER_M) * SOFT_GAIN;
  const n = scatterCount(w / SOFT_GAIN, h / SOFT_GAIN, mark.coverage);
  for (let i = 0; i < n; i += 1) {
    const x = rand() * TEX_PX;
    const y = rand() * TEX_PX;
    const jw = w * (0.75 + rand() * 0.5);
    const jh = h * (0.75 + rand() * 0.5);
    wrapped(ctx, x, y, jw, jh, (px, py) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(jw / 2, jh / 2);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, rgba(mark.colour, mark.alpha));
      g.addColorStop(0.5, rgba(mark.colour, mark.alpha));
      g.addColorStop(1, rgba(mark.colour, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}






















































const ENV_LO = ROW_ENVELOPE_LO;
const ENV_MEAN = ROW_ENVELOPE_MEAN;

function drawRows(ctx, mark, rand) {
  const across = mark.scaleMetres[0] <= mark.scaleMetres[1] ? 0 : 1;
  const widthPx = Math.max(1.5, Math.min(mark.scaleMetres[0], mark.scaleMetres[1]) * PX_PER_M);
  const n = Math.max(1, Math.round(TEX_METRES / mark.periodMetres));
  const periodPx = TEX_PX / n;
  const phase = (mark.phase || 0) * periodPx;
  const span = widthPx * 1.4;
  
  
  
  
  const amp = Math.min(periodPx * 0.09, widthPx * 0.40);
  const SEG = 48;
  const segLen = TEX_PX / SEG;

  for (let i = 0; i < n; i += 1) {
    
    
    
    
    
    
    const jitter = (rand() - 0.5) * periodPx * 0.20;
    const centre = i * periodPx + phase + jitter;
    
    
    const cycles = 1 + Math.floor(rand() * 3);
    const wobblePhase = rand() * Math.PI * 2;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const enveloped = markEnveloped(mark);
    const a = Math.min(1, (mark.alpha * (0.78 + rand() * 0.30)) / (enveloped ? ENV_MEAN : 1));
    
    
    
    const envCycles = 2 + Math.floor(rand() * 3);
    const envPhase = rand() * Math.PI * 2;
    const g = ctx.createLinearGradient(-span / 2, 0, span / 2, 0);
    g.addColorStop(0, rgba(mark.colour, 0));
    g.addColorStop(0.3, rgba(mark.colour, a));
    g.addColorStop(0.7, rgba(mark.colour, a));
    g.addColorStop(1, rgba(mark.colour, 0));
    for (let k = 0; k < SEG; k += 1) {
      const t = (k + 0.5) / SEG;
      const off = amp * Math.sin(cycles * 2 * Math.PI * t + wobblePhase);
      const c = centre + off;
      ctx.globalAlpha = enveloped
        ? ENV_LO + (1 - ENV_LO) * (0.5 + 0.5 * Math.sin(envCycles * 2 * Math.PI * t + envPhase))
        : 1;
      for (const d of [-TEX_PX, 0, TEX_PX]) {
        const cc = c + d;
        if (cc + span < 0 || cc - span > TEX_PX) continue;
        ctx.save();
        
        
        
        
        
        
        
        if (across === 0) ctx.translate(cc, k * segLen);
        else { ctx.translate(k * segLen, cc); ctx.rotate(-Math.PI / 2); }
        ctx.fillStyle = g;
        ctx.fillRect(-span / 2, 0, span, segLen + 1);
        ctx.restore();
      }
    }
  }
  ctx.globalAlpha = 1;
}

























export const MACRO_PX = 512;
const MACRO_LATTICE = [6, 18, 54];   


function latticeValue(grid, n, u, v) {
  const x = u * n;
  const y = v * n;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const at = (i, j) => grid[((j % n) + n) % n * n + (((i % n) + n) % n)];
  const a = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
  const b = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
  return a * (1 - sy) + b * sy;
}







export function paintMacroShade(seed = 20260906) {
  const rand = seeded(seed);
  const grids = MACRO_LATTICE.map((n) => {
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i += 1) g[i] = rand();
    return g;
  });
  const c = document.createElement('canvas');
  c.width = MACRO_PX;
  c.height = MACRO_PX;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(MACRO_PX, MACRO_PX);
  for (let y = 0; y < MACRO_PX; y += 1) {
    const v = (y + 0.5) / MACRO_PX;
    for (let x = 0; x < MACRO_PX; x += 1) {
      const u = (x + 0.5) / MACRO_PX;
      const o = (y * MACRO_PX + x) * 4;
      for (let k = 0; k < 3; k += 1) {
        img.data[o + k] = Math.max(0, Math.min(255,
          Math.round(latticeValue(grids[k], MACRO_LATTICE[k], u, v) * 255)));
      }
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}









export function buildMacroTexture(THREE, seed = 20260906) {
  const tex = new THREE.CanvasTexture(paintMacroShade(seed));
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}





























export const DETAIL_PX = 512;
const DETAIL_MOTTLE = [8, 40];   






const DETAIL_MASK = 40;











export const GROUND_LIGHT = Object.freeze({
  
  bombOffset: [0.37, 0.61],
  













  bombScale: 1.27,
  
  bombEdge: [0.42, 0.58],
  
  mottleLo: 0.84,
  mottleSpan: 0.32,
  
  shadeLo: 0.74,
  shadeSpan: 0.52,
  macroWeights: [0.52, 0.30, 0.18],
  
  cool: [0.86, 0.95, 1.12],
  warm: [1.09, 1.00, 0.86],
});


export function paintDetailField(seed = 71349) {
  const rand = seeded(seed);
  const mottle = DETAIL_MOTTLE.map((n) => {
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i += 1) g[i] = rand();
    return g;
  });
  const mask = new Float32Array(DETAIL_MASK * DETAIL_MASK);
  for (let i = 0; i < mask.length; i += 1) mask[i] = rand();

  const c = document.createElement('canvas');
  c.width = DETAIL_PX;
  c.height = DETAIL_PX;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(DETAIL_PX, DETAIL_PX);
  for (let y = 0; y < DETAIL_PX; y += 1) {
    const v = (y + 0.5) / DETAIL_PX;
    for (let x = 0; x < DETAIL_PX; x += 1) {
      const u = (x + 0.5) / DETAIL_PX;
      const o = (y * DETAIL_PX + x) * 4;
      const m = latticeValue(mottle[0], DETAIL_MOTTLE[0], u, v) * 0.62
        + latticeValue(mottle[1], DETAIL_MOTTLE[1], u, v) * 0.38;
      img.data[o] = Math.max(0, Math.min(255, Math.round(m * 255)));
      img.data[o + 1] = Math.max(0, Math.min(255,
        Math.round(latticeValue(mask, DETAIL_MASK, u, v) * 255)));
      img.data[o + 2] = 0;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}


export function buildDetailTexture(THREE, seed = 71349) {
  const tex = new THREE.CanvasTexture(paintDetailField(seed));
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}


function drawMark(ctx, mark, rand) {
  const kind = markKind(mark);
  if (kind === 'rows') drawRows(ctx, mark, rand);
  else if (kind === 'soft') drawSoft(ctx, mark, rand);
  else drawBlobs(ctx, mark, rand);
  ctx.globalAlpha = 1;
}








export function paintTerrain(id, seed = 1) {
  const recipe = TERRAIN_RECIPE[id];
  if (!recipe) throw new Error(`no terrain recipe '${id}'`);
  const c = document.createElement('canvas');
  c.width = TEX_PX;
  c.height = TEX_PX;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hex(recipe.base);
  ctx.fillRect(0, 0, TEX_PX, TEX_PX);
  const rand = seeded(seed);
  
  
  for (const mark of recipe.marks) drawMark(ctx, mark, rand);
  return c;
}












export function buildTerrainTextures(THREE, ids = Object.keys(TERRAIN_RECIPE)) {
  const out = Object.create(null);
  let n = 0;
  for (const id of ids) {
    n += 1;
    if (!TERRAIN_RECIPE[id]) continue;
    const tex = new THREE.CanvasTexture(paintTerrain(id, 1000 + n * 7919));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    
    
    
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    out[id] = tex;
  }
  return out;
}











































export const SURROUND_PX = 1024;











export const SURROUND_REPEAT = 3;









const SURROUND_TONES = [
  0x55603c, 0x4a5636, 0x606a40, 0x6d7047, 0x7a7550, 0x585f3a,
  0x6a6b45, 0x4f5a38, 0x74704b, 0x616540,
];
const SURROUND_HEDGE = 0x333a26;
const SURROUND_TREE = 0x2c3520;








function splitPaddocks(rand, x0, y0, x1, y1, depth, out) {
  const w = x1 - x0;
  const h = y1 - y0;
  
  if (depth >= 5 || (w < 190 && h < 190) || w < 96 || h < 96) {
    out.push([x0, y0, x1, y1]);
    return;
  }
  
  
  let vertical = w > h;
  if (w === h) vertical = rand() > 0.5;
  const t = 0.34 + rand() * 0.32;
  if (vertical) {
    const cut = Math.round(x0 + w * t);
    splitPaddocks(rand, x0, y0, cut, y1, depth + 1, out);
    splitPaddocks(rand, cut, y0, x1, y1, depth + 1, out);
  } else {
    const cut = Math.round(y0 + h * t);
    splitPaddocks(rand, x0, y0, x1, cut, depth + 1, out);
    splitPaddocks(rand, x0, cut, x1, y1, depth + 1, out);
  }
}







export function paintSurround(seed = 5150407) {
  const rand = seeded(seed);
  const S = SURROUND_PX;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hex(SURROUND_TONES[0]);
  ctx.fillRect(0, 0, S, S);

  const paddocks = [];
  splitPaddocks(rand, 0, 0, S, S, 0, paddocks);
  for (const p of paddocks) {
    const [x0, y0, x1, y1] = p;
    ctx.fillStyle = hex(SURROUND_TONES[Math.floor(rand() * SURROUND_TONES.length)]);
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    
    
    if (rand() < 0.34) {
      const across = rand() > 0.5;
      const period = 3 + Math.floor(rand() * 4);
      ctx.globalAlpha = 0.16 + rand() * 0.14;
      ctx.fillStyle = hex(0x3d3122);
      if (across) {
        for (let y = y0 + 1; y < y1; y += period) ctx.fillRect(x0, y, x1 - x0, 1);
      } else {
        for (let x = x0 + 1; x < x1; x += period) ctx.fillRect(x, y0, 1, y1 - y0);
      }
      ctx.globalAlpha = 1;
    }
  }

  
  
  
  for (const p of paddocks) {
    const [x0, y0, x1, y1] = p;
    const t = 2 + Math.floor(rand() * 2);
    ctx.globalAlpha = 0.55 + rand() * 0.35;
    ctx.fillStyle = hex(SURROUND_HEDGE);
    ctx.fillRect(x0, y0, x1 - x0, t);
    ctx.fillRect(x0, y0, t, y1 - y0);
    
    
    const n = Math.floor((x1 - x0 + y1 - y0) / 26);
    ctx.fillStyle = hex(SURROUND_TREE);
    for (let i = 0; i < n; i += 1) {
      const onX = rand() > 0.5;
      const px = onX ? x0 + rand() * (x1 - x0) : x0 + (rand() - 0.5) * 5;
      const py = onX ? y0 + (rand() - 0.5) * 5 : y0 + rand() * (y1 - y0);
      const r = 2.2 + rand() * 3.4;
      ctx.beginPath();
      ctx.ellipse(px, py, r, r * (0.8 + rand() * 0.4), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  
  
  
  
  
  for (let i = 0; i < 14; i += 1) {
    const dark = i % 4 !== 0;
    const px = rand() * S;
    const py = rand() * S;
    const r = 150 + rand() * 300;
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        if (px + dx + r < 0 || px + dx - r > S || py + dy + r < 0 || py + dy - r > S) continue;
        const g = ctx.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r);
        g.addColorStop(0, dark ? 'rgba(24,32,22,0.30)' : 'rgba(196,200,150,0.16)');
        g.addColorStop(1, dark ? 'rgba(24,32,22,0)' : 'rgba(196,200,150,0)');
        ctx.fillStyle = g;
        ctx.fillRect(px + dx - r, py + dy - r, r * 2, r * 2);
      }
    }
  }
  return c;
}









export function buildSurroundTexture(THREE, seed = 5150407) {
  const tex = new THREE.CanvasTexture(paintSurround(seed));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(SURROUND_REPEAT, SURROUND_REPEAT);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  return tex;
}
