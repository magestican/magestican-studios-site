



import * as THREE from 'three';
import { BARN_PAINT, BARN_PALETTE } from './barnPaintSpec.js';
import { GROUND_PAINT, GROUND_PALETTE, TILE_SUN } from './groundPaintSpec.js';

const SIZE = 64;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  return c;
}

function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;   
  t.minFilter = THREE.LinearMipMapNearestFilter;
  return t;
}






function wrapDraw(x, y, fn) {
  const dxs = x < SIZE / 2 ? [0, SIZE] : [0, -SIZE];
  const dys = y < SIZE / 2 ? [0, SIZE] : [0, -SIZE];
  for (const dx of dxs) for (const dy of dys) fn(x + dx, y + dy);
}


function seedRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}












export function makeSnowTexture() {
  const spec = GROUND_PAINT.snow;
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);
  const field = hexRgb(spec.field);

  
  
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * spec.noise;
    img.data[i]   = clamp(field.r + j);
    img.data[i+1] = clamp(field.g + j * 0.8);
    img.data[i+2] = clamp(field.b + j * 0.45);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);

  
  
  for (let i = 0; i < spec.hollows; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const r = SIZE * (0.10 + rng() * 0.16);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, rgba(spec.hollow, spec.hollowAlpha));
    grad.addColorStop(1, rgba(spec.hollow, 0));
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }

  
  
  
  for (let i = 0; i < spec.ripples; i++) {
    const y = rng() * SIZE;
    const rows = spec.rippleRows * (0.7 + rng() * 0.7);
    const phase = rng() * 6.28;
    const wander = (x) => Math.sin(x * 0.11 + phase) * spec.rippleWander
                        + Math.sin(x * 0.31 + phase * 2) * (spec.rippleWander * 0.4);
    for (let x = 0; x < SIZE; x++) {
      const yy = y + wander(x);
      g.fillStyle = rgba(spec.crest, 0.42 + rng() * 0.18);
      g.fillRect(x, Math.round(yy), 1, Math.max(1, Math.round(rows * 0.55)));
      g.fillStyle = rgba(spec.hollow, 0.26 + rng() * 0.12);
      g.fillRect(x, Math.round(yy + rows * 0.55), 1, Math.max(1, Math.round(rows * 0.45)));
    }
  }

  
  
  for (let i = 0; i < spec.grit; i++) {
    g.fillStyle = rgba(GROUND_PALETTE.grit, 0.18 + rng() * 0.22);
    g.beginPath();
    g.arc(rng() * SIZE, rng() * SIZE, 0.6 + rng() * 1.4, 0, Math.PI * 2);
    g.fill();
  }

  
  
  for (let i = 0; i < spec.glints; i++) {
    g.fillStyle = rgba(GROUND_PALETTE.glint, 0.55 + rng() * 0.45);
    g.fillRect(Math.floor(rng() * SIZE), Math.floor(rng() * SIZE), 1, 1);
  }

  drawEdgeCrest(g, rng, spec);
  return toTexture(c);
}







export function makeIceTexture() {
  const spec = GROUND_PAINT.ice;
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);
  const field = hexRgb(spec.field);

  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * spec.noise;
    img.data[i]   = clamp(field.r + j);
    img.data[i+1] = clamp(field.g + j * 0.9);
    img.data[i+2] = clamp(field.b + j * 0.6);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);

  
  for (let i = 0; i < spec.sheens; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const ang = rng() * Math.PI;
    g.save();
    g.translate(x, y); g.rotate(ang);
    const w = SIZE * 1.6, h = 4 + rng() * 9;
    const grad = g.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0,   rgba(spec.crest, 0));
    grad.addColorStop(0.5, rgba(spec.crest, spec.sheenAlpha));
    grad.addColorStop(1,   rgba(spec.crest, 0));
    g.fillStyle = grad;
    g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
  }

  
  
  for (let i = 0; i < spec.bubbles; i++) {
    const x = 2 + rng() * (SIZE - 4), y = 2 + rng() * (SIZE - 4);
    const r = 0.8 + rng() * 2.2;
    g.strokeStyle = rgba(spec.hollow, 0.45);
    g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = rgba(spec.crest, 0.5);
    g.fillRect(Math.round(x - r * 0.3), Math.round(y - r), 1, 1);
  }

  
  
  
  for (let i = 0; i < spec.cracks; i++) {
    
    
    
    const ang = rng() * Math.PI * 2;
    const cxr = SIZE / 2 + Math.cos(ang + Math.PI) * SIZE * 0.8;
    const cyr = SIZE / 2 + Math.sin(ang + Math.PI) * SIZE * 0.8;
    const spine = drawCrack(g, rng, spec, cxr, cyr, ang, SIZE * 1.6);
    
    for (let b = 0; b < spec.crackBranches; b++) {
      const at = spine[Math.floor(rng() * spine.length)];
      const lean = (rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.5);
      drawCrack(g, rng, spec, at[0], at[1], ang + lean, 8 + rng() * 16);
    }
  }

  drawEdgeCrest(g, rng, spec);
  return toTexture(c);
}



function drawCrack(g, rng, spec, x, y, ang, len) {
  const pts = [[x, y]];
  const steps = Math.max(2, Math.round(len / 5));
  for (let i = 0; i < steps; i++) {
    ang += (rng() - 0.5) * spec.crackWander;
    x += Math.cos(ang) * (len / steps);
    y += Math.sin(ang) * (len / steps);
    pts.push([x, y]);
  }
  
  g.strokeStyle = rgba(spec.crest, spec.crackAlpha * 0.55);
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(pts[0][0] + 1, pts[0][1] + 1);
  for (const [px, py] of pts.slice(1)) g.lineTo(px + 1, py + 1);
  g.stroke();
  g.strokeStyle = rgba(spec.hollow, spec.crackAlpha);
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (const [px, py] of pts.slice(1)) g.lineTo(px, py);
  g.stroke();
  return pts;
}






function drawEdgeCrest(g, rng, spec) {
  const E = SIZE - 1;
  
  
  const dash = (x, y, horiz, len, style) => {
    g.fillStyle = style;
    let i = 0;
    while (i < len) {
      const run = 3 + Math.floor(rng() * 9);
      if (rng() < spec.edgeBreakup) {
        const n = Math.min(run, len - i);
        if (horiz) g.fillRect(x + i, y, n, 1);
        else       g.fillRect(x, y + i, 1, n);
      }
      i += run;
    }
  };
  const crest = rgba(spec.crest, spec.edgeCrest);
  const hollow = rgba(spec.hollow, spec.edgeHollow);
  dash(0, 0, true,  SIZE, crest);  dash(0, E, true,  SIZE, crest);
  dash(1, 1, true,  SIZE - 2, hollow);  dash(1, E - 1, true,  SIZE - 2, hollow);
  
  
  
  
  if (spec.edgeOnly === 'horizontal') return;
  dash(0, 0, false, SIZE, crest);  dash(E, 0, false, SIZE, crest);
  dash(1, 1, false, SIZE - 2, hollow);  dash(E - 1, 1, false, SIZE - 2, hollow);
}

















export function makeTroddenTexture(variant = 0) {
  const spec = GROUND_PAINT.trodden;
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.variantSeeds[variant % spec.variantSeeds.length]);
  const field = hexRgb(spec.field);

  
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * spec.noise;
    img.data[i]   = clamp(field.r + j);
    img.data[i+1] = clamp(field.g + j * 0.8);
    img.data[i+2] = clamp(field.b + j * 0.45);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);

  
  
  
  for (let i = 0; i < spec.churn; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const r = SIZE * (0.06 + rng() * 0.14);
    const a0 = rng() * 6.28;
    g.strokeStyle = rgba(spec.hollow, spec.churnAlpha * (0.5 + rng() * 0.7));
    g.lineWidth = 2 + rng() * 4;
    g.beginPath();
    g.arc(x, y, r, a0, a0 + 0.8 + rng() * 1.4);
    g.stroke();
  }

  
  
  
  
  
  
  
  
  
  for (let i = 0; i < spec.mudPatches; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const r = spec.mudRadius * (0.6 + rng() * 0.8);
    wrapDraw(x, y, (ox, oy) => {
      g.fillStyle = rgba(GROUND_PALETTE.mud, spec.mudAlpha * (0.55 + rng() * 0.5));
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.ellipse(ox + (rng() - 0.5) * r, oy + (rng() - 0.5) * r,
                  r * (0.5 + rng() * 0.6), r * (0.4 + rng() * 0.5),
                  rng() * 3.14, 0, Math.PI * 2);
        g.fill();
      }
      
      
      g.fillStyle = rgba(spec.crest, 0.35);
      g.fillRect(Math.round(ox + TILE_SUN.x * r), Math.round(oy + TILE_SUN.y * r), 2, 1);
    });
  }

  
  
  for (let i = 0; i < spec.straws; i++) {
    const sx = rng() * SIZE, sy = rng() * SIZE;
    const n = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const a = rng() * 3.14;
      const len = 2.5 + rng() * 4;
      const x = sx + (rng() - 0.5) * 7, y = sy + (rng() - 0.5) * 7;
      const alpha = 0.32 + rng() * 0.35;
      wrapDraw(x, y, (ox, oy) => {
        g.strokeStyle = rgba(GROUND_PALETTE.straw, alpha);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(ox, oy);
        g.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len);
        g.stroke();
      });
    }
  }

  
  
  
  
  for (let i = 0; i < spec.printPairs; i++) {
    const heading = rng() * Math.PI * 2;
    const px = rng() * SIZE, py = rng() * SIZE;
    const nx = -Math.sin(heading), ny = Math.cos(heading);
    
    
    const age = spec.printFade + (1 - spec.printFade) * (i / spec.printPairs);
    for (const foot of [-0.5, 0.5]) {
      const step = foot * spec.printStride;
      const side = foot * spec.printSpread;
      drawBootPrint(g, spec,
        px + Math.cos(heading) * step + nx * side,
        py + Math.sin(heading) * step + ny * side,
        heading + (rng() - 0.5) * 0.3, age);
    }
  }

  drawEdgeCrest(g, rng, spec);
  return toTexture(c);
}















function drawBootPrint(g, spec, x, y, ang, age = 1) {
  const L = spec.printLen, W = spec.printWide;
  const sole = (gg) => {
    gg.beginPath();
    gg.ellipse(-L * 0.20, 0, L * 0.30, W * 0.50, 0, 0, Math.PI * 2);
    gg.ellipse(L * 0.26, 0, L * 0.17, W * 0.40, 0, 0, Math.PI * 2);
  };
  wrapDraw(x, y, (ox, oy) => {
    g.save();
    g.translate(ox, oy);
    g.rotate(ang);
    
    
    g.save();
    g.translate(TILE_SUN.x * 1.5, TILE_SUN.y * 1.5);
    g.strokeStyle = rgba(spec.crest, spec.printRim * age);
    g.lineWidth = 1.5;
    sole(g);
    g.stroke();
    g.restore();
    
    g.fillStyle = rgba(spec.hollow, spec.printAlpha * age);
    sole(g);
    g.fill();
    
    g.save();
    sole(g);
    g.clip();
    g.fillStyle = rgba(spec.crest, spec.printAlpha * age * 0.7);
    for (let k = 0; k < spec.printLugs; k++) {
      const bx = -L * 0.44 + (k + 0.7) * (L * 0.48 / spec.printLugs);
      g.fillRect(bx, -W, 1, W * 2);
    }
    g.restore();
    g.restore();
  });
}






export function makeRutTexture() {
  const spec = GROUND_PAINT.rut;
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);
  const field = hexRgb(spec.field);

  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * spec.noise;
    img.data[i]   = clamp(field.r + j);
    img.data[i+1] = clamp(field.g + j * 0.8);
    img.data[i+2] = clamp(field.b + j * 0.45);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);

  const half = (SIZE * spec.rutWidth) / 2;
  const midY = SIZE / 2;

  
  
  
  const trough = g.createLinearGradient(0, midY - half, 0, midY + half);
  trough.addColorStop(0,    rgba(spec.hollow, 0));
  trough.addColorStop(0.35, rgba(spec.hollow, 0.55));
  trough.addColorStop(0.55, rgba(spec.hollow, 0.72));
  trough.addColorStop(1,    rgba(spec.hollow, 0));
  g.fillStyle = trough;
  g.fillRect(0, midY - half, SIZE, half * 2);

  
  
  
  
  
  
  
  
  for (const sgn of [-1, 1]) {
    const phase = rng() * 6.28;
    const base = midY + sgn * half;
    for (let x = 0; x < SIZE; x++) {
      const wander = Math.sin(x * 0.13 + phase) * spec.lipWander
                   + Math.sin(x * 0.37 + phase * 2) * (spec.lipWander * 0.4);
      const rows = Math.max(1, Math.round(spec.lipRows * (0.45 + rng() * 0.9)));
      const ly = Math.round(base + wander) - (sgn < 0 ? rows : 0);
      g.fillStyle = rgba(spec.crest, spec.lipAlpha * (0.35 + rng() * 0.85));
      g.fillRect(x, ly, 1, rows);
    }
  }

  
  
  
  const gap = SIZE / spec.treads;
  for (let i = 0; i < spec.treads; i++) {
    const x = i * gap + rng() * 1.5;
    g.save();
    g.translate(x, midY);
    g.rotate(spec.treadLean);
    g.fillStyle = rgba(spec.hollow, spec.treadAlpha * (0.7 + rng() * 0.5));
    g.fillRect(-1.5, -half * 0.92, 3, half * 1.84);
    
    
    g.fillStyle = rgba(spec.crest, spec.treadAlpha * 0.55);
    g.fillRect(1.5, -half * 0.92, 1, half * 1.84);
    g.restore();
  }

  
  for (let i = 0; i < spec.mudSpecks; i++) {
    g.fillStyle = rgba(GROUND_PALETTE.mud, spec.mudAlpha * (0.5 + rng() * 0.6));
    g.beginPath();
    g.arc(rng() * SIZE, midY + (rng() - 0.5) * half * 1.5,
          0.6 + rng() * 1.8, 0, Math.PI * 2);
    g.fill();
  }

  drawEdgeCrest(g, rng, spec);
  return toTexture(c);
}


export function makeWoodTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(23);
  g.fillStyle = '#8a5a2b';
  g.fillRect(0, 0, SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    const brightness = 0.85 + (rng() - 0.5) * 0.15;
    g.fillStyle = `rgba(${Math.floor(0x8a * brightness)}, ${Math.floor(0x5a * brightness)}, ${Math.floor(0x2b * brightness)}, 1)`;
    g.fillRect(0, y, SIZE, 1);
  }
  
  g.strokeStyle = 'rgba(45, 25, 10, 0.35)';
  g.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = Math.floor(rng() * SIZE);
    g.beginPath();
    g.moveTo(0, y);
    
    for (let x = 0; x < SIZE; x += 4) g.lineTo(x, y + Math.sin(x * 0.3) * 1.5);
    g.stroke();
  }
  
  g.fillStyle = 'rgba(50, 25, 8, 0.55)';
  g.beginPath(); g.ellipse(SIZE * 0.7, SIZE * 0.3, 5, 3, 0, 0, Math.PI * 2); g.fill();
  return toTexture(c);
}


export function makeStoneTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(37);
  const base = { r: 0x6d, g: 0x70, b: 0x76 };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 24;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j);
    img.data[i+2] = clamp(base.b + j);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 1;
  for (let i = 16; i < SIZE; i += 16) {
    g.beginPath(); g.moveTo(0, i); g.lineTo(SIZE, i); g.stroke();
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, SIZE); g.stroke();
  }
  return toTexture(c);
}


export function makeHayTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(71);
  g.fillStyle = '#d7b83d';
  g.fillRect(0, 0, SIZE, SIZE);
  
  g.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rng() * SIZE);
    const y = Math.floor(rng() * SIZE);
    const len = 6 + Math.floor(rng() * 12);
    const angle = rng() * Math.PI;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    g.strokeStyle = rng() < 0.5 ? 'rgba(150,110,30,0.7)' : 'rgba(240,220,120,0.8)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
  }
  return toTexture(c);
}







export function makeBloodTinted(baseTexture) {
  const src = baseTexture.image;
  const c = makeCanvas(); const g = c.getContext('2d');
  g.drawImage(src, 0, 0, SIZE, SIZE);
  const rng = seedRng(89);

  const BLOOD_DARK  = (a) => `rgba(96, 8, 8, ${a})`;
  const BLOOD_FRESH = (a) => `rgba(150, 18, 14, ${a})`;

  
  for (let i = 0; i < 3; i++) {
    const x = rng() * SIZE, y = rng() * SIZE * 0.7;   
    const r = 5 + rng() * 8;
    
    for (let b = 0; b < 5; b++) {
      g.fillStyle = BLOOD_FRESH(0.75 + rng() * 0.2);
      g.beginPath();
      g.arc(x + (rng() - 0.5) * r, y + (rng() - 0.5) * r * 0.7, r * (0.45 + rng() * 0.4), 0, Math.PI * 2);
      g.fill();
    }
    
    const dir = rng() * Math.PI * 2;
    for (let d = 0; d < 9; d++) {
      const a = dir + (rng() - 0.5) * 1.6;
      const dist = r + rng() * r * 2.2;
      g.fillStyle = BLOOD_FRESH(0.5 + rng() * 0.4);
      g.beginPath();
      g.arc(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 0.8 + rng() * 2.0, 0, Math.PI * 2);
      g.fill();
    }
    
    for (let d = 0; d < 2 + Math.floor(rng() * 2); d++) {
      const dx = x + (rng() - 0.5) * r * 1.5;
      const len = 8 + rng() * 18;
      g.strokeStyle = BLOOD_DARK(0.7);
      g.lineWidth = 1.2 + rng() * 1.2;
      g.beginPath(); g.moveTo(dx, y + r * 0.4); g.lineTo(dx + (rng() - 0.5) * 2, y + r * 0.4 + len); g.stroke();
      g.fillStyle = BLOOD_DARK(0.8);
      g.beginPath(); g.arc(dx, y + r * 0.4 + len, 1.6 + rng(), 0, Math.PI * 2); g.fill();
    }
  }

  
  {
    const x = rng() * SIZE * 0.6 + SIZE * 0.2, y = rng() * SIZE * 0.5 + SIZE * 0.2;
    const ang = -0.4 + rng() * 0.8;
    g.save();
    g.translate(x, y); g.rotate(ang);
    const grad = g.createLinearGradient(0, 0, 26, 0);
    grad.addColorStop(0, BLOOD_DARK(0.6));
    grad.addColorStop(1, BLOOD_DARK(0.0));
    g.fillStyle = grad;
    g.fillRect(0, -3, 26, 6);
    g.restore();
  }
  return toTexture(c);
}


export function makeDirtTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(53);
  const base = { r: 0x7a, g: 0x5c, b: 0x3d };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 22;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j * 0.9);
    img.data[i+2] = clamp(base.b + j * 0.7);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  return toTexture(c);
}





export function makeMetalTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(71);
  const base = { r: 0xa6, g: 0xac, b: 0xb8 };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 26;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j);
    img.data[i+2] = clamp(base.b + j * 1.1);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  
  g.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const y = Math.floor(rng() * SIZE);
    const len = 8 + Math.floor(rng() * 34);
    const x = Math.floor(rng() * (SIZE - len));
    g.strokeStyle = rng() > 0.45 ? 'rgba(240,246,255,0.42)' : 'rgba(38,42,50,0.38)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (rng() > 0.5 ? 1 : 0)); g.stroke();
  }
  
  for (let i = 0; i < 5; i++) {
    const x = 4 + rng() * (SIZE - 8), y = 4 + rng() * (SIZE - 8);
    const r = 2 + rng() * 3;
    g.fillStyle = 'rgba(46,50,58,0.40)';
    g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(236,243,255,0.32)';
    g.beginPath(); g.ellipse(x, y - r * 0.6, r * 0.8, r * 0.28, 0, 0, Math.PI * 2); g.fill();
  }
  return toTexture(c);
}















export function makeBarnPaintTexture(team) {
  const spec = BARN_PAINT[team];
  if (!spec) throw new Error(`makeBarnPaintTexture: unknown team "${team}"`);
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);

  const paint = hexRgb(spec.paint);
  g.fillStyle = spec.paint;
  g.fillRect(0, 0, SIZE, SIZE);

  
  const bw = SIZE / spec.boards;
  for (let b = 0; b < spec.boards; b++) {
    
    
    
    const v = 1 + (rng() - 0.5) * spec.boardValueSpread;
    g.fillStyle = `rgb(${clamp(paint.r * v)}, ${clamp(paint.g * v)}, ${clamp(paint.b * v)})`;
    g.fillRect(Math.round(b * bw), 0, Math.ceil(bw), SIZE);
    
    
    const sx = Math.round(b * bw);
    g.fillStyle = 'rgba(28,26,23,0.38)';
    g.fillRect(sx, 0, 1, SIZE);
    g.fillStyle = 'rgba(246,241,230,0.16)';
    g.fillRect(sx + 1, 0, 1, SIZE);
  }

  
  g.lineWidth = 1;
  for (let i = 0; i < spec.grainStreaks; i++) {
    const x = Math.floor(rng() * SIZE);
    g.strokeStyle = rng() > 0.5 ? 'rgba(28,26,23,0.22)' : 'rgba(246,241,230,0.13)';
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y < SIZE; y += 8) g.lineTo(x + Math.sin(y * 0.22 + i) * 1.4, y);
    g.stroke();
  }

  
  
  const peelR = Math.sqrt((spec.peelCoverage * SIZE * SIZE) / (Math.PI * Math.max(1, spec.peels)));
  for (let i = 0; i < spec.peels; i++) {
    const px = rng() * SIZE, py = rng() * SIZE;
    const rx = peelR * (0.7 + rng() * 0.7), ry = peelR * (0.7 + rng() * 0.7);
    g.fillStyle = BARN_PALETTE.bareShadow;
    g.beginPath(); g.ellipse(px, py + 1, rx, ry, rng() * 0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = BARN_PALETTE.bareWood;
    g.beginPath(); g.ellipse(px, py, rx * 0.88, ry * 0.85, rng() * 0.6, 0, Math.PI * 2); g.fill();
  }

  
  const damp = g.createLinearGradient(0, SIZE - spec.dampRows, 0, SIZE);
  damp.addColorStop(0, 'rgba(67,48,42,0)');
  damp.addColorStop(1, 'rgba(67,48,42,0.42)');
  g.fillStyle = damp;
  g.fillRect(0, SIZE - spec.dampRows, SIZE, spec.dampRows);

  
  const rime = g.createLinearGradient(0, 0, 0, spec.rimeRows);
  rime.addColorStop(0, 'rgba(219,234,246,0.62)');
  rime.addColorStop(1, 'rgba(219,234,246,0)');
  g.fillStyle = rime;
  g.fillRect(0, 0, SIZE, spec.rimeRows);
  const drips = Math.round(spec.rimeRows / 3);
  for (let i = 0; i < drips; i++) {
    const x = Math.floor(rng() * SIZE);
    const len = spec.rimeRows + Math.floor(rng() * spec.rimeRows * 2);
    g.fillStyle = 'rgba(219,234,246,0.30)';
    g.fillRect(x, 0, 1, len);
  }

  
  g.fillStyle = BARN_PALETTE.nail;
  for (let b = 0; b < spec.boards; b++) {
    const x = Math.round((b + 0.5) * bw);
    g.fillRect(x, 3 + spec.rimeRows, 2, 2);
    g.fillRect(x, SIZE - 5 - Math.round(spec.dampRows / 3), 2, 2);
  }
  return toTexture(c);
}







export function makeEggshellTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(419);

  
  
  
  
  
  
  
  
  
  
  g.fillStyle = '#f2e0ab';
  g.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 14; i++) {
    const x = rng() * SIZE, y = rng() * SIZE, r = 6 + rng() * 12;
    g.fillStyle = rng() > 0.5 ? 'rgba(255,247,222,0.32)' : 'rgba(188,158,110,0.26)';
    g.beginPath(); g.ellipse(x, y, r, r * 0.75, rng() * 3, 0, Math.PI * 2); g.fill();
  }
  
  for (let i = 0; i < 46; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const big = rng() > 0.72;
    g.fillStyle = big ? 'rgba(128,90,50,0.62)' : 'rgba(150,112,68,0.44)';
    g.beginPath();
    g.ellipse(x, y, big ? 2.4 : 1.3, big ? 1.9 : 1.1, rng() * 3, 0, Math.PI * 2);
    g.fill();
  }
  return toTexture(c);
}






export function makeBottleGlassTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(523);
  g.fillStyle = '#f4f0dc';                 
  g.fillRect(0, 0, SIZE, SIZE);
  
  const grad = g.createLinearGradient(0, 0, SIZE, 0);
  grad.addColorStop(0.00, 'rgba(150,152,148,0.24)');
  grad.addColorStop(0.30, 'rgba(255,255,255,0.00)');
  grad.addColorStop(0.62, 'rgba(255,255,255,0.00)');
  grad.addColorStop(1.00, 'rgba(150,152,148,0.22)');
  g.fillStyle = grad;
  g.fillRect(0, 0, SIZE, SIZE);
  
  const hi = g.createLinearGradient(SIZE * 0.34, 0, SIZE * 0.50, 0);
  hi.addColorStop(0, 'rgba(255,255,255,0.00)');
  hi.addColorStop(0.5, 'rgba(255,255,255,0.72)');
  hi.addColorStop(1, 'rgba(255,255,255,0.00)');
  g.fillStyle = hi;
  g.fillRect(SIZE * 0.34, 0, SIZE * 0.16, SIZE);
  
  g.strokeStyle = 'rgba(126,132,128,0.30)'; g.lineWidth = 1;
  for (const x of [SIZE * 0.02, SIZE * 0.74]) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, SIZE); g.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const y = rng() * SIZE, w = 4 + rng() * 10;
    g.strokeStyle = 'rgba(255,255,255,0.28)';
    g.beginPath(); g.moveTo(rng() * SIZE, y); g.lineTo(rng() * SIZE + w, y + 1); g.stroke();
  }
  return toTexture(c);
}






export function makeMilkLabelTexture(repeat = 4) {
  const W = 512, H = 96;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rng = seedRng(607);
  const cell = W / repeat;

  g.fillStyle = '#b73a2a';                 
  g.fillRect(0, 0, W, H);
  
  for (let i = 0; i < 60; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(255,220,200,0.10)' : 'rgba(80,24,16,0.14)';
    g.fillRect(rng() * W, rng() * H, 2 + rng() * 20, 1 + rng() * 3);
  }
  
  g.strokeStyle = '#f2e7cd'; g.lineWidth = 3;
  for (const y0 of [9, H - 9]) {
    g.beginPath(); g.moveTo(0, y0);
    for (let x = 0; x <= W; x += 24) g.lineTo(x, y0 + Math.sin(x * 0.02 + y0) * 1.4);
    g.stroke();
  }

  
  
  
  
  g.font = 'bold 34px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let k = 0; k < repeat; k++) {
    const cx = cell * (k + 0.5);
    
    
    g.fillStyle = 'rgba(242,231,205,0.85)';
    g.beginPath();
    g.ellipse(cx - cell * 0.40, H * 0.52, 7, 10, 0.4, 0, Math.PI * 2);
    g.fill();
    
    const word = 'MILK';
    const widths = [...word].map((ch) => g.measureText(ch).width + 3);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = cx - total / 2 + cell * 0.08;
    for (let i = 0; i < word.length; i++) {
      g.save();
      g.translate(x + widths[i] / 2, H / 2 + 2);
      g.rotate((rng() - 0.5) * 0.10);
      g.fillStyle = 'rgba(70,20,14,0.45)';       
      g.fillText(word[i], 2, 2.5);
      g.fillStyle = '#f6f1e6';
      g.fillText(word[i], 0, 0);
      g.restore();
      x += widths[i];
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;              
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}




export function makeBarnSignTexture(accentHex) {
  const W = 256, H = 64;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rng = seedRng(311);

  
  g.fillStyle = '#e8dcc0';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {                    
    const y = Math.floor(rng() * H);
    g.strokeStyle = rng() > 0.55 ? 'rgba(120,92,56,0.22)' : 'rgba(255,250,235,0.35)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 1.6);
    g.stroke();
  }
  
  g.fillStyle = accentHex;
  g.fillRect(0, 0, 20, H);
  g.fillRect(W - 20, 0, 20, H);
  
  g.strokeStyle = '#1c1a17';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(4, 5); g.lineTo(W - 5, 3.5); g.lineTo(W - 3.5, H - 4); g.lineTo(5, H - 3); g.closePath();
  g.stroke();

  
  const word = 'BARN';
  g.font = 'bold 42px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const widths = [...word].map((ch) => g.measureText(ch).width + 6);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = W / 2 - total / 2;
  for (let i = 0; i < word.length; i++) {
    const cx = x + widths[i] / 2;
    g.save();
    g.translate(cx, H / 2 + 2);
    g.rotate((rng() - 0.5) * 0.10);
    g.fillStyle = 'rgba(28,26,23,0.30)';          
    g.fillText(word[i], 1.5, 2);
    g.fillStyle = '#1c1a17';
    g.fillText(word[i], 0, 0);
    g.restore();
    x += widths[i];
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;   

}

function rgba(hex, a) {
  const { r, g, b } = hexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }




















export function makeRockTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x1204);
  g.fillStyle = '#4c4f57'; g.fillRect(0, 0, SIZE, SIZE);
  
  
  let y = 0;
  while (y < SIZE) {
    const h = 8 + rnd() * 16;
    const v = 0.80 + rnd() * 0.42;
    g.fillStyle = 'rgb(' + Math.round(76 * v) + ',' + Math.round(79 * v) + ',' + Math.round(87 * v) + ')';
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= SIZE; x += 16) g.lineTo(x, y + (rnd() - 0.5) * 5);
    g.lineTo(SIZE, y + h); g.lineTo(0, y + h); g.closePath(); g.fill();
    
    
    
    if (rnd() < 0.7) {
      g.strokeStyle = 'rgba(190,198,210,0.5)'; g.lineWidth = 2;
      let lx = rnd() * 30;
      while (lx < SIZE) {
        const run = 14 + rnd() * 34;
        g.beginPath(); g.moveTo(lx, y + 1); g.lineTo(Math.min(SIZE, lx + run), y + 1); g.stroke();
        lx += run + 10 + rnd() * 30;
      }
    }
    y += h;
  }
  
  
  
  for (let i = 0; i < 7; i++) {
    const x0 = rnd() * SIZE, y0 = rnd() * SIZE;
    wrapDraw(x0, y0, (x, y) => {
      let cx = x, cy = y;
      const pts = [[x, y]];
      for (let s = 0; s < 4; s++) {
        cx += (rnd() - 0.5) * 34; cy += (rnd() - 0.3) * 30;
        pts.push([cx, cy]);
      }
      const stroke = (style, width) => {
        g.strokeStyle = style; g.lineWidth = width;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (const pt of pts.slice(1)) g.lineTo(pt[0], pt[1]);
        g.stroke();
      };
      stroke('rgba(28,30,34,0.75)', 2.6);
      stroke('rgba(226,236,246,0.55)', 1.3);
    });
  }
  return toTexture(c);
}


export function makeRinkTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x2c1e);
  g.fillStyle = '#dff0fa'; g.fillRect(0, 0, SIZE, SIZE);
  
  
  for (let i = 0; i < 5; i++) {
    g.strokeStyle = 'rgba(255,255,255,' + (0.35 + rnd() * 0.3).toFixed(2) + ')';
    g.lineWidth = 6 + rnd() * 7;
    const y0 = rnd() * SIZE;
    g.beginPath(); g.moveTo(-10, y0);
    g.bezierCurveTo(SIZE * 0.3, y0 - 12, SIZE * 0.7, y0 + 12, SIZE + 10, y0);
    g.stroke();
  }
  
  
  for (let i = 0; i < 40; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE, a = rnd() * Math.PI;
    const len = 6 + rnd() * 20;
    const alpha = (0.25 + rnd() * 0.3).toFixed(2);
    wrapDraw(x, y, (px, py) => {
      g.strokeStyle = 'rgba(160,196,220,' + alpha + ')';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      g.stroke();
    });
  }
  
  
  g.fillStyle = 'rgba(56,104,178,0.55)';
  g.fillRect(0, SIZE * 0.42, SIZE, SIZE * 0.09);
  g.fillStyle = 'rgba(178,56,48,0.35)';
  g.beginPath(); g.arc(SIZE * 0.76, SIZE * 0.78, SIZE * 0.09, 0, Math.PI * 2); g.fill();
  return toTexture(c);
}


export function makeBoardsTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x3a77);
  g.fillStyle = '#f0efe8'; g.fillRect(0, 0, SIZE, SIZE);
  
  for (let x = 0; x < SIZE; x += SIZE / 2) {
    g.fillStyle = 'rgba(150,152,150,0.55)'; g.fillRect(x, 0, 2, SIZE);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 2, 0, 2, SIZE);
  }
  
  
  g.fillStyle = '#e2b53c'; g.fillRect(0, SIZE * 0.80, SIZE, SIZE * 0.20);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, SIZE * 0.80, SIZE, 3);
  
  for (let i = 0; i < 14; i++) {
    const x = rnd() * SIZE, y = SIZE * (0.45 + rnd() * 0.45);
    const alpha = (0.14 + rnd() * 0.26).toFixed(2);
    const rx = 3 + rnd() * 7, ry = 2 + rnd() * 3, rot = rnd();
    wrapDraw(x, y, (px, py) => {
      g.fillStyle = 'rgba(30,28,26,' + alpha + ')';
      g.beginPath();
      g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
      g.fill();
    });
  }
  return toTexture(c);
}


export function makePineTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x4f19);
  g.fillStyle = '#1d3d2d'; g.fillRect(0, 0, SIZE, SIZE);
  
  
  for (let i = 0; i < 90; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE;
    const v = rnd();
    const col = v < 0.35 ? 'rgba(20,44,32,0.95)'
              : v < 0.80 ? 'rgba(44,86,62,0.90)'
                         : 'rgba(74,124,90,0.90)';
    const a = Math.PI * 0.35 + rnd() * Math.PI * 0.3;
    wrapDraw(x, y, (px, py) => {
      g.strokeStyle = col; g.lineWidth = 1.6;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(px, py);
        g.lineTo(px + Math.cos(a) * 7 * s, py + Math.sin(a) * 7);
        g.stroke();
      }
    });
  }
  
  for (let i = 0; i < 16; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE;
    const alpha = (0.5 + rnd() * 0.4).toFixed(2);
    const rx = 4 + rnd() * 8, ry = 2 + rnd() * 4;
    wrapDraw(x, y, (px, py) => {
      g.fillStyle = 'rgba(232,242,250,' + alpha + ')';
      g.beginPath();
      g.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    });
  }
  return toTexture(c);
}


export function makePaverTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x5b30);
  g.fillStyle = '#8f887c'; g.fillRect(0, 0, SIZE, SIZE);
  
  
  const R = SIZE / 6;
  const hexAt = (cx, cy) => {
    const tone = 0.86 + rnd() * 0.30;
    g.fillStyle = 'rgb(' + Math.round(155 * tone) + ',' + Math.round(148 * tone)
      + ',' + Math.round(136 * tone) + ')';
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      const px = cx + Math.cos(a) * R * 0.92, py = cy + Math.sin(a) * R * 0.92;
      if (k) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(226,236,246,0.45)'; g.lineWidth = 1.6; g.stroke();
  };
  const dx = R * Math.sqrt(3), dy = R * 1.5;
  for (let row = -1; row * dy < SIZE + R; row++) {
    for (let col = -1; col * dx < SIZE + dx; col++) {
      hexAt(col * dx + (row % 2 ? dx / 2 : 0), row * dy);
    }
  }
  
  for (let i = 0; i < 5; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE;
    const alpha = (0.12 + rnd() * 0.14).toFixed(2);
    const rx = 10 + rnd() * 16, ry = 7 + rnd() * 11, rot = rnd();
    wrapDraw(x, y, (px, py) => {
      g.fillStyle = 'rgba(90,88,84,' + alpha + ')';
      g.beginPath(); g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2); g.fill();
    });
  }
  return toTexture(c);
}


export function makeIglooTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x6d42);
  g.fillStyle = '#e4eef6'; g.fillRect(0, 0, SIZE, SIZE);
  
  
  const rows = 2, cols = 3;
  const bh = SIZE / rows, bw = SIZE / cols;
  for (let r = 0; r < rows; r++) {
    for (let cIdx = -1; cIdx <= cols; cIdx++) {
      const x = cIdx * bw + (r % 2 ? bw / 2 : 0);
      const y = r * bh;
      const tone = 0.93 + rnd() * 0.12;
      g.fillStyle = 'rgb(' + Math.round(228 * tone) + ',' + Math.round(238 * tone)
        + ',' + Math.round(246 * tone) + ')';
      g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      
      g.fillStyle = 'rgba(140,164,190,0.55)';
      g.fillRect(x + 2, y + bh - 4, bw - 4, 3);
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(x + 2, y + 2, bw - 4, 2);
    }
  }
  
  for (let i = 0; i < 12; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE;
    g.strokeStyle = 'rgba(176,198,218,' + (0.2 + rnd() * 0.25).toFixed(2) + ')';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + rnd() * 20, y + (rnd() - 0.5) * 3); g.stroke();
  }
  return toTexture(c);
}






















export function makeHedgeTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rnd = seedRng(0x4d41);

  
  g.fillStyle = '#26401f'; g.fillRect(0, 0, SIZE, SIZE);

  
  
  const GREENS = ['#3c6b30', '#4a7d38', '#2f5527', '#588c40'];
  for (let i = 0; i < 190; i++) {
    const x = rnd() * SIZE, y = rnd() * SIZE;
    
    const lit = 1 - y / SIZE;
    const hex = GREENS[Math.min(GREENS.length - 1, Math.floor(rnd() * 2 + lit * 2))];
    g.strokeStyle = hex;
    g.lineWidth = 2 + rnd() * 2.5;
    g.lineCap = 'round';
    const a = rnd() * Math.PI * 2, r = 3 + rnd() * 5;
    g.beginPath();
    g.arc(x, y, r, a, a + 1.1 + rnd() * 0.9);
    g.stroke();
  }

  
  
  
  const stalks = 4 + Math.floor(rnd() * 2);
  for (let i = 0; i < stalks; i++) {
    const x = (i + 0.25 + rnd() * 0.5) * (SIZE / stalks);
    const top = 4 + rnd() * 16;
    const lean = (rnd() - 0.5) * 7;
    
    g.strokeStyle = '#7d8a3a';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, SIZE); g.lineTo(x + lean, top); g.stroke();
    
    for (let b = 0; b < 3; b++) {
      const by = top + (SIZE - top) * (0.25 + b * 0.24);
      const dir = b % 2 ? 1 : -1;
      g.strokeStyle = '#8d9a42';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + lean * 0.4, by);
      g.quadraticCurveTo(x + dir * 9, by + 2, x + dir * 15, by + 8);
      g.stroke();
    }
    
    
    
    
    const cy = top + 16 + rnd() * 22;
    const cx = x + lean * 0.6;
    g.fillStyle = '#c9982f';
    g.beginPath(); g.ellipse(cx, cy, 3.4, 7.5, 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e2b84e';
    g.beginPath(); g.ellipse(cx - 1, cy - 1, 1.6, 5.4, 0.12, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9aa84a'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 2, cy - 12); g.stroke();
  }

  
  
  
  for (let i = 0; i < 14; i++) {
    g.fillStyle = 'rgba(12,22,10,' + (0.3 + rnd() * 0.35).toFixed(2) + ')';
    const x = rnd() * SIZE, y = rnd() * SIZE;
    g.beginPath(); g.ellipse(x, y, 2 + rnd() * 4, 3 + rnd() * 6, rnd() * 3, 0, Math.PI * 2); g.fill();
  }
  return toTexture(c);
}
