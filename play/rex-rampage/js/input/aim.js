



import { OneEuroFilter } from '../pose/oneEuro.js';

const AIM_SMOOTHING = { minCutoff: 1.0, beta: 6, dCutoff: 1 };
const MIN_SAMPLES = 10;





export function tipOf(hand) {
  const w =  (hand.wrist);
  const e =  (hand.elbow);
  return { x: w.x + 0.6 * (w.x - e.x), y: w.y + 0.6 * (w.y - e.y) };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const pct = (sorted, q) => sorted[Math.round(q * (sorted.length - 1))];

export class Aim {
  
  constructor(frame, params = AIM_SMOOTHING) {
    this.params = params;
    
    this.defaultBox = { x0: 0.15 * frame.width, x1: 0.85 * frame.width, y0: 0.05 * frame.height, y1: 0.48 * frame.height };
    
    this.box = { left: this.defaultBox, right: this.defaultBox };
    
    this.samples = { left: [], right: [] };
    
    this.filters = {};
    this.reset('left');
    this.reset('right');
  }

  
  sample(side, tip) {
    this.samples[side].push(tip);
  }

  finishCalibration() {
    for (const side of  (['left', 'right'])) {
      const s = this.samples[side];
      if (s.length >= MIN_SAMPLES) {
        const xs = s.map((p) => p.x).sort((a, b) => a - b);
        const ys = s.map((p) => p.y).sort((a, b) => a - b);
        const box = { x0: pct(xs, 0.05), x1: pct(xs, 0.95), y0: pct(ys, 0.05), y1: pct(ys, 0.95) };
        if (box.x1 - box.x0 > 1 && box.y1 - box.y0 > 1) this.box[side] = box;
      }
      this.samples[side] = [];
    }
  }

  



  point(side, hand, tS) {
    if (!hand.raised || !hand.wrist || !hand.elbow) {
      this.reset(side);
      return null;
    }
    const tip = tipOf(hand);
    const b = this.box[side];
    const u = this.filters[side].u.filter(clamp01((tip.x - b.x0) / (b.x1 - b.x0)), tS);
    const v = this.filters[side].v.filter(clamp01((tip.y - b.y0) / (b.y1 - b.y0)), tS);
    return { x: 2 * u - 1, y: 1 - 2 * v };
  }

  
  reset(side) {
    this.filters[side] = { u: new OneEuroFilter(this.params), v: new OneEuroFilter(this.params) };
  }
}
