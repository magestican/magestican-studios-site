








export const POSE_SMOOTHING = { minCutoff: 1.2, beta: 8, dCutoff: 1 };

function alpha(cutoffHz, dtS) {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dtS);
}

export class OneEuroFilter {
  
  constructor(p = POSE_SMOOTHING) {
    this.p = p;
    this.x = null;
    this.dx = 0;
    this.t = 0;
  }

  
  filter(value, tS) {
    if (this.x === null) {
      this.x = value;
      this.t = tS;
      return value;
    }
    const dt = tS - this.t;
    if (!(dt > 0)) return this.x;
    this.t = tS;
    const rawDx = (value - this.x) / dt;
    this.dx += alpha(this.p.dCutoff, dt) * (rawDx - this.dx);
    const cutoff = this.p.minCutoff + this.p.beta * Math.abs(this.dx);
    this.x += alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }

  reset() {
    this.x = null;
    this.dx = 0;
  }
}
