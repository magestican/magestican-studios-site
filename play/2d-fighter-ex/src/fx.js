








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
};

export const WORDS = Object.freeze({
  impact: ['ド', 'ン'],        
  crack: ['バ', 'キ'],         
  charge: ['ゴ', 'オ'],        
});

export function glyphStrokes(ch) {
  return GLYPHS[ch] || null;
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


export function drawWord(ctx, chars, x, y, size, { fill, line, tilt = -0.12 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  chars.forEach((ch, i) => {
    
    const s = size * (1 + i * 0.14);
    drawGlyph(ctx, ch, i * size * 0.86, -s * 0.5, s, { fill, line });
  });
  ctx.restore();
}












export function drawDust(ctx, puff, age) {
  const life = 0.55;                              
  if (age < 0 || age > life) return;
  const t = age / life;
  const alpha = (1 - t) * 0.85;
  const spread = 1 + t * 2.4;
  const rise = t * 9;

  
  
  ctx.save();
  ctx.globalAlpha = alpha;

  const base = 7 + puff.power * 7;
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2 + puff.x * 0.01;
    const dx = Math.cos(a) * base * spread * (i % 2 ? 1.25 : 0.8);
    const r = base * (0.55 + (i % 3) * 0.18) * (1 + t * 0.6);
    const cy = puff.y - rise - Math.abs(Math.sin(a)) * base * 0.35 * spread;
    
    ctx.beginPath();
    ctx.moveTo(puff.x + dx - r, puff.y - rise * 0.4);
    for (let k = 0; k <= 8; k += 1) {
      const ang = Math.PI + (k / 8) * Math.PI;
      ctx.lineTo(puff.x + dx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.75);
    }
    ctx.closePath();
    ctx.fillStyle = i % 2 ? FX.dustLit : FX.dust;
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = FX.dustInk;
    ctx.stroke();
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
    const len = h * (0.28 + ((i * 7) % 5) / 5 * 0.42) * grow;
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


export function drawClashExtras(ctx, x, y, scale, phase) {
  ctx.save();
  ctx.translate(x, y);
  
  ctx.fillStyle = FX.core;
  const arm = 34 * scale;
  const thick = 4.5 * scale;
  ctx.fillRect(-arm, -thick / 2, arm * 2, thick);
  ctx.fillRect(-thick / 2, -arm, thick, arm * 2);
  
  ctx.fillStyle = FX.impactLine;
  for (let i = 0; i < 9; i += 1) {
    const a = i * 0.698 + phase;
    const d = arm * (0.7 + (i % 4) * 0.22);
    const sx = Math.cos(a) * d;
    const sy = Math.sin(a) * d * 0.7;
    const s = (2.2 + (i % 3)) * scale;
    ctx.beginPath();
    ctx.moveTo(sx, sy - s);
    ctx.lineTo(sx + s * 0.8, sy);
    ctx.lineTo(sx, sy + s);
    ctx.lineTo(sx - s * 0.8, sy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
