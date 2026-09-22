





























import { clamp, smoothstep } from './math.mjs';

export const MORPH_NAMES = Object.freeze([
  'browsUp', 'browsDown', 'browsSad', 'lidsClose', 'eyesWide',
  'mouthSmile', 'mouthO', 'mouthFrown', 'blush',
]);


export const BLEND_S = 0.25;



export const ANGER_CAP = Object.freeze({ browsDown: 0.6, mouthFrown: 0.4 });

const w = (weights) => Object.freeze(Object.fromEntries(MORPH_NAMES.map((n) => [n, weights[n] || 0])));

export const EXPRESSIONS = Object.freeze({
  neutral: Object.freeze({ intensity: 0, weights: w({}) }),
  happy: Object.freeze({ intensity: 1, weights: w({ mouthSmile: 1, eyesWide: 0.15, blush: 0.35, browsUp: 0.1 }) }),
  concern: Object.freeze({ intensity: 0.8, weights: w({ browsSad: 0.55, mouthFrown: 0.25, eyesWide: 0.1 }) }),
  interest: Object.freeze({ intensity: 0.8, weights: w({ browsUp: 0.45, eyesWide: 0.35 }) }),
  amazement: Object.freeze({ intensity: 1, weights: w({ browsUp: 0.85, eyesWide: 0.9, mouthO: 0.55 }) }),
  anger: Object.freeze({ intensity: 0.7, weights: w({ browsDown: 0.6, mouthFrown: 0.35 }) }),
  frustration: Object.freeze({ intensity: 0.75, weights: w({ browsDown: 0.45, mouthFrown: 0.4, lidsClose: 0.05 }) }),
  sad: Object.freeze({ intensity: 0.8, weights: w({ browsSad: 0.75, mouthFrown: 0.55 }) }),
  sleepy: Object.freeze({ intensity: 0.6, weights: w({ lidsClose: 0.55, browsDown: 0.1 }) }),
});

const ZERO = w({});



















export function faceAt({ seed = 0, t = 0, expression = 'neutral', intensity, from = null, since = 0, blink = 0, talking = false, activity = 0 } = {}) {
  const def = EXPRESSIONS[expression] || EXPRESSIONS.neutral;
  const amt = Number.isFinite(intensity) ? intensity : def.intensity;
  const target = {};
  for (const name of MORPH_NAMES) target[name] = clamp(def.weights[name] * amt, 0, 1);
  if (expression === 'anger') {
    target.browsDown = Math.min(target.browsDown, ANGER_CAP.browsDown);
    target.mouthFrown = Math.min(target.mouthFrown, ANGER_CAP.mouthFrown);
  }

  const base = from || ZERO;
  const k = smoothstep(0, BLEND_S, Number.isFinite(since) ? since : 0);
  const out = {};
  for (const name of MORPH_NAMES) {
    const b = Number.isFinite(base[name]) ? base[name] : 0;
    out[name] = b + (target[name] - b) * k;
  }

  
  
  out.lidsClose = Math.max(out.lidsClose, clamp(blink, 0, 1));
  
  
  
  if (talking) out.mouthO = Math.max(out.mouthO, clamp(activity, 0, 1));

  return out;
}


export function faceInfluences(face) {
  return MORPH_NAMES.map((n) => face[n] || 0);
}
