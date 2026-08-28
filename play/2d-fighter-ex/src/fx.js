























import { FRAMES, A, B, CANVAS } from './choreography.js';
import { CEL, FX, mix } from './palette.js';





const feetOf = (spec) => (spec ? spec[2] : null);        
const cxOf = (spec) => (spec ? spec[0] : null);


function rollingBaseline(values, window = 21) {
  const out = new Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const lo = Math.max(0, i - (window >> 1));
    const hi = Math.min(values.length, i + (window >> 1) + 1);
    const near = values.slice(lo, hi).filter((v) => v !== null).sort((a, b) => a - b);
    out[i] = near.length ? near[near.length >> 1] : null;
  }
  return out;
}














export function takeoffs({ minLift = 0.34, minRise = 0.10 } = {}) {
  const out = [];
  for (const [slot, who] of [[A, 'light'], [B, 'dark']]) {
    const feet = FRAMES.map((f) => feetOf(f[slot]));
    const heights = FRAMES.map((f) => (f[slot] ? f[slot][2] - f[slot][1] : null));
    const base = rollingBaseline(feet);
    
    const lift = feet.map((v, i) => (
      v === null || base[i] === null || !heights[i] ? 0 : (base[i] - v) / heights[i]
    ));
    let armed = true;
    for (let i = 1; i < lift.length; i += 1) {
      const rising = lift[i] - lift[i - 1];
      if (armed && lift[i] > minLift && rising > minRise) {
        
        const from = Math.max(0, i - 2);
        const spec = FRAMES[from][slot] || FRAMES[i][slot];
        if (spec) {
          out.push({
            who, frame: i,
            x: cxOf(spec),
            y: base[from] ?? feetOf(spec),
            power: Math.min(1, lift[i] / 0.9),
          });
        }
        armed = false;                        
      }
      if (lift[i] < minLift * 0.5) armed = true;
    }
  }
  return out;
}

















export function chargeWindows({ maxDrift = 5.0, minFrames = 4 } = {}) {
  const still = FRAMES.map((f, i) => {
    const prev = FRAMES[i - 1];
    if (!prev || !f[A] || !f[B] || !prev[A] || !prev[B]) return false;
    const move = Math.abs(f[A][0] - prev[A][0]) + Math.abs(f[B][0] - prev[B][0])
      + Math.abs(f[A][2] - prev[A][2]) + Math.abs(f[B][2] - prev[B][2]);
    return move <= maxDrift;
  });

  const out = [];
  let run = 0;
  for (let i = 0; i <= still.length; i += 1) {
    if (still[i]) { run += 1; continue; }
    if (run >= minFrames) {
      const from = i - run;
      const to = i - 1;
      out.push({ from, to, frames: run });
    }
    run = 0;
  }
  return out;
}


export function chargeAt(index, windows) {
  for (const w of windows) {
    if (index >= w.from && index <= w.to) {
      return { t: w.frames > 1 ? (index - w.from) / (w.frames - 1) : 1, window: w };
    }
  }
  return null;
}
















const GROUND_BY_WHO = { light: null, dark: null };

export function groundUnder(who, index) {
  if (!GROUND_BY_WHO[who]) {
    const slot = who === 'light' ? A : B;
    GROUND_BY_WHO[who] = rollingBaseline(FRAMES.map((f) => (f[slot] ? f[slot][2] : null)));
  }
  const series = GROUND_BY_WHO[who];
  const v = series[Math.max(0, Math.min(series.length - 1, index))];
  return v === null ? null : v;
}


























function seed01(n, salt = 0) {
  let x = (Math.imul(Math.round(n) | 0, 0x9e3779b1)
    ^ Math.imul((salt | 0) + 0x165667b1, 0x85ebca6b)) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x2545f491) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0x27d4eb2f) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}


const pick = (n, salt, lo, hi) => lo + (hi - lo) * seed01(n, salt);













const GLYPHS = {
  
  'ド': [[[0.18, 0.10], [0.66, 0.10]], [[0.42, 0.10], [0.30, 0.86]],
         [[0.78, 0.30], [0.94, 0.36]], [[0.78, 0.52], [0.94, 0.58]]],
  
  'ン': [[[0.20, 0.22], [0.36, 0.30]], [[0.22, 0.52], [0.78, 0.84]]],
  
  'バ': [[[0.30, 0.14], [0.18, 0.84]], [[0.52, 0.14], [0.62, 0.84]],
         [[0.80, 0.30], [0.94, 0.36]], [[0.80, 0.52], [0.94, 0.58]]],
  
  'キ': [[[0.20, 0.30], [0.76, 0.22]], [[0.16, 0.54], [0.84, 0.46]],
         [[0.58, 0.08], [0.44, 0.90]]],
  
  'ゴ': [[[0.18, 0.16], [0.72, 0.16]], [[0.44, 0.16], [0.40, 0.62]],
         [[0.22, 0.62], [0.70, 0.62]], [[0.82, 0.28], [0.96, 0.34]],
         [[0.82, 0.48], [0.96, 0.54]]],
  
  'オ': [[[0.20, 0.26], [0.80, 0.26]], [[0.56, 0.08], [0.48, 0.88]],
         [[0.56, 0.44], [0.24, 0.84]]],
  
  'カ': [[[0.18, 0.26], [0.74, 0.22], [0.64, 0.60], [0.42, 0.84]],
         [[0.34, 0.24], [0.16, 0.84]]],
  
  'ガ': [[[0.14, 0.26], [0.66, 0.22], [0.58, 0.60], [0.38, 0.84]],
         [[0.30, 0.24], [0.12, 0.84]],
         [[0.78, 0.28], [0.94, 0.34]], [[0.78, 0.50], [0.94, 0.56]]],
  
  'ス': [[[0.16, 0.18], [0.82, 0.18], [0.34, 0.86]],
         [[0.46, 0.54], [0.82, 0.88]]],
  
  'ズ': [[[0.14, 0.18], [0.70, 0.18], [0.28, 0.86]],
         [[0.40, 0.54], [0.70, 0.88]],
         [[0.78, 0.28], [0.94, 0.34]], [[0.78, 0.50], [0.94, 0.56]]],
  
  'ク': [[[0.26, 0.12], [0.62, 0.28]],
         [[0.66, 0.18], [0.56, 0.52], [0.28, 0.86]]],
};




















export const WORDS = Object.freeze({
  impact: ['ド', 'ン'],        
  crack: ['バ', 'キ'],         
  charge: ['ゴ', 'オ'],        
  burst: ['ド', 'カ', 'ン'],   
  clang: ['ガ', 'ン'],         
  sink: ['ズ', 'ン'],          
  dull: ['ド', 'ス'],          
  snap: ['バ', 'ク'],          
  bonk: ['ゴ', 'ン'],          
});

const IMPACT_FAMILY = Object.freeze([
  WORDS.impact, WORDS.burst, WORDS.clang, WORDS.sink,
  WORDS.crack, WORDS.dull, WORDS.snap, WORDS.bonk,
]);













const VARIED = new Map([[WORDS.impact, IMPACT_FAMILY]]);

export function glyphStrokes(ch) {
  return GLYPHS[ch] || null;
}









export function variantFor(chars, seed) {
  const family = VARIED.get(chars);
  if (!family) return chars;
  return family[Math.floor(seed01(seed, 31) * family.length) % family.length];
}







export function drawGlyph(ctx, ch, x, y, size, { fill, line, weight = 0.14 }) {
  const strokes = GLYPHS[ch];
  if (!strokes) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pass of [line, fill]) {
    if (!pass) continue;
    ctx.strokeStyle = pass;
    ctx.lineWidth = size * weight * (pass === line ? 1.85 : 1);
    for (const poly of strokes) {
      ctx.beginPath();
      ctx.moveTo(x + poly[0][0] * size, y + poly[0][1] * size);
      for (let i = 1; i < poly.length; i += 1) {
        ctx.lineTo(x + poly[i][0] * size, y + poly[i][1] * size);
      }
      ctx.stroke();
    }
  }
}


















export function drawWord(ctx, chars, x, y, size, { fill, line, tilt = -0.12, seed = null } = {}) {
  const s = seed === null ? x : seed;
  const word = variantFor(chars, s);
  ctx.save();
  ctx.translate(x, y);
  
  ctx.rotate(tilt + pick(s, 41, -0.06, 0.06));
  let cursor = 0;
  word.forEach((ch, i) => {
    
    
    const grow = 1 + i * pick(s, 50 + i, 0.09, 0.19);
    const g = size * grow;
    ctx.save();
    ctx.translate(cursor, pick(s, 60 + i, -0.08, 0.08) * size);
    ctx.rotate(pick(s, 70 + i, -0.12, 0.12));
    drawGlyph(ctx, ch, 0, -g * 0.5, g, { fill, line });
    ctx.restore();
    
    
    
    cursor += g * 0.80;
  });
  ctx.restore();
}


























export function drawDust(ctx, puff, age) {
  const life = 0.55;                              
  if (age < 0 || age > life) return;
  const power = Number.isFinite(puff.power) ? puff.power : 0.62;
  const t = age / life;
  const alpha = (1 - t) * 0.85;
  const spread = 1 + t * 2.4;
  const rise = t * 9;

  
  
  const s = Math.round(puff.x) + (puff.frame || 0) * 13;

  
  
  ctx.save();
  ctx.globalAlpha = alpha;

  const base = 7 + power * 7;
  
  
  
  const lobes = 5 + Math.floor(seed01(s, 1) * 5);
  
  
  const bias = pick(s, 2, -0.55, 0.55);
  for (let i = 0; i < lobes; i += 1) {
    
    
    const a = ((i + pick(s, 10 + i, -0.33, 0.33)) / lobes) * Math.PI * 2;
    const reach = base * spread * pick(s, 20 + i, 0.7, 1.45) * (1 + bias * Math.cos(a));
    const dx = Math.cos(a) * reach;
    const r = base * pick(s, 30 + i, 0.5, 1.05) * (1 + t * 0.6);
    const cy = puff.y - rise - Math.abs(Math.sin(a)) * base * 0.35 * spread;
    
    ctx.beginPath();
    ctx.moveTo(puff.x + dx - r, puff.y - rise * 0.4);
    for (let k = 0; k <= 8; k += 1) {
      const ang = Math.PI + (k / 8) * Math.PI;
      
      
      const wob = 1 + pick(s, 40 + i * 9 + k, -0.16, 0.16);
      ctx.lineTo(puff.x + dx + Math.cos(ang) * r * wob, cy + Math.sin(ang) * r * 0.75 * wob);
    }
    ctx.closePath();
    ctx.fillStyle = i % 2 ? FX.dustLit : FX.dust;
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = FX.dustInk;
    ctx.stroke();
  }

  
  
  
  ctx.fillStyle = FX.dustInk;
  ctx.globalAlpha = alpha * 0.8;
  const grit = 3 + Math.floor(seed01(s, 3) * 4);
  for (let i = 0; i < grit; i += 1) {
    const a = pick(s, 60 + i, -Math.PI, 0);        
    const d = base * (1.2 + t * 3.4) * pick(s, 70 + i, 0.8, 1.6);
    const gx = puff.x + Math.cos(a) * d;
    const gy = puff.y - rise + Math.sin(a) * d * 0.62;
    const sz = pick(s, 80 + i, 1.0, 2.4);
    ctx.fillRect(gx, gy, sz, sz * 1.5);
  }
  ctx.restore();
}






export function drawCharge(ctx, spec, t, phase) {
  if (!spec) return;
  const h = spec.feet - spec.top;
  const cx = spec.cx;
  const groundY = spec.feet;
  const grow = 0.35 + t * 0.65;

  ctx.save();
  
  for (let i = 0; i < 11; i += 1) {
    const seed = i * 2.399 + phase;
    const sx = cx + Math.sin(seed) * h * 0.34;
    
    
    
    const len = h * (0.28 + seed01(i, 5) * 0.42) * grow;
    const wob = Math.sin(phase * 3 + i) * h * 0.03;
    const yTop = groundY - h * 0.15 - len - ((phase * 40 + i * 9) % (h * 0.5));
    ctx.beginPath();
    ctx.moveTo(sx, yTop + len);
    ctx.quadraticCurveTo(sx + wob, yTop + len * 0.5, sx + wob * 0.4, yTop);
    ctx.strokeStyle = i % 3 === 0 ? FX.chargeCore : FX.charge;
    ctx.lineWidth = i % 3 === 0 ? 2.2 : 1.3;
    ctx.globalAlpha = 0.35 + 0.5 * t;
    ctx.stroke();
  }
  
  ctx.globalAlpha = 0.55 * t;
  ctx.fillStyle = FX.dustInk;
  for (let i = 0; i < 8; i += 1) {
    const seed = i * 1.71 + phase * 2;
    const gx = cx + Math.sin(seed) * h * 0.42;
    const gy = groundY - ((phase * 55 + i * 13) % (h * 0.55));
    const s = 1.1 + (i % 3) * 0.5;
    ctx.fillRect(gx, gy, s, s * 1.6);
  }
  ctx.restore();
}










const IMPACT_TINTS = Object.freeze([
  Object.freeze([FX.core, FX.rim]),
  Object.freeze([FX.burst, FX.impactLine]),
  Object.freeze([FX.core, FX.impactLine]),
  Object.freeze([FX.ring, FX.rim]),
  Object.freeze([mix(FX.burst, FX.rim, 0.35), FX.impactLine]),
  Object.freeze([mix(CEL.highlight, CEL.mustard, 0.25), FX.rim]),
]);


function spike(ctx, angle, len, halfWidth) {
  const nx = Math.cos(angle + Math.PI / 2) * halfWidth;
  const ny = Math.sin(angle + Math.PI / 2) * halfWidth;
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
  ctx.lineTo(-nx, -ny);
  ctx.closePath();
  ctx.fill();
}





























export function drawClashExtras(ctx, x, y, scale, phase) {
  const s = Math.round(x);
  const k = Math.max(0.2, scale);
  const shape = Math.floor(seed01(s, 2) * 3);
  const [hot, hard] = IMPACT_TINTS[Math.floor(seed01(s, 3) * IMPACT_TINTS.length)];
  const arm = 34 * k;

  ctx.save();
  ctx.translate(x, y);
  
  
  
  ctx.rotate(pick(s, 4, -Math.PI, Math.PI));

  if (shape === 0) {
    
    
    const arms = 3 + Math.floor(seed01(s, 5) * 3);
    for (const [colour, grow] of [[hard, 1.18], [hot, 1.0]]) {
      ctx.fillStyle = colour;
      let a = 0;
      for (let i = 0; i < arms; i += 1) {
        
        
        a += (Math.PI * 2 / arms) * pick(s, 10 + i, 0.45, 1.55);
        const len = arm * pick(s, 20 + i, 0.8, 2.1) * grow;
        spike(ctx, a, len, 3.2 * k * grow);
      }
    }
  } else if (shape === 1) {
    
    
    
    const a = pick(s, 6, -Math.PI, Math.PI);
    const len = arm * pick(s, 7, 1.5, 2.6);
    const bow = arm * pick(s, 8, 0.35, 0.85);
    const w = 4.5 * k;
    for (const [colour, pad] of [[hard, 1.6], [hot, 0]]) {
      ctx.fillStyle = colour;
      const cx0 = Math.cos(a) * len;
      const cy0 = Math.sin(a) * len;
      const px = Math.cos(a + Math.PI / 2);
      const py = Math.sin(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-cx0 * 0.5, -cy0 * 0.5);
      ctx.quadraticCurveTo(px * bow, py * bow, cx0, cy0);
      ctx.quadraticCurveTo(px * (bow - w - pad), py * (bow - w - pad), -cx0 * 0.5, -cy0 * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    
    
    
    
    
    const lines = 7 + Math.floor(seed01(s, 9) * 6);
    let a = 0;
    for (let i = 0; i < lines; i += 1) {
      a += (Math.PI * 2 / lines) * pick(s, 30 + i, 0.5, 1.5);
      const i0 = arm * pick(s, 40 + i, 0.55, 0.95);
      const i1 = i0 + arm * pick(s, 50 + i, 0.5, 1.7);
      ctx.strokeStyle = i % 3 === 0 ? hot : hard;
      ctx.lineWidth = Math.max(0.8, pick(s, 60 + i, 1.0, 3.2) * k);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * i0, Math.sin(a) * i0);
      ctx.lineTo(Math.cos(a) * i1, Math.sin(a) * i1);
      ctx.stroke();
    }
  }

  
  
  
  
  
  ctx.fillStyle = FX.impactLine;
  const shards = 6 + Math.floor(seed01(s, 11) * 9);
  let d = phase;
  for (let i = 0; i < shards; i += 1) {
    d += (Math.PI * 2 / shards) * pick(s, 70 + i, 0.4, 1.6);
    const dist = arm * pick(s, 80 + i, 0.6, 1.9);
    const sx = Math.cos(d) * dist;
    const sy = Math.sin(d) * dist * pick(s, 90 + i, 0.55, 1.0);
    const sz = pick(s, 100 + i, 1.8, 4.6) * k;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(d + pick(s, 110 + i, -0.6, 0.6));
    if (seed01(s, 120 + i) < 0.34) {
      
      ctx.fillRect(0, -sz * 0.22, sz * 3.1, sz * 0.44);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.8, 0);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.8, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
