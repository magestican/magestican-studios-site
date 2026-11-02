






import { OneEuroFilter } from '../pose/oneEuro.js';

const AIM_SMOOTHING = { minCutoff: 1.0, beta: 6, dCutoff: 1 };


export const REACH_X = 0.6;
export const REACH_Y = 0.55;

export const CENTRE_UP = 0.1;




export function tipOf(hand) {
  const w =  (hand.wrist);
  const e =  (hand.elbow);
  return { x: w.x + 0.6 * (w.x - e.x), y: w.y + 0.6 * (w.y - e.y) };
}

const clamp = (v) => Math.min(1, Math.max(-1, v));

export class Aim {
  constructor(params = AIM_SMOOTHING) {
    this.params = params;
    
    this.filters = {};
    this.reset('left');
    this.reset('right');
  }

  



  point(side, hand, tS) {
    if (!hand.raised || !hand.wrist || !hand.elbow || !hand.shoulder) {
      this.reset(side);
      return null;
    }
    const tip = tipOf(hand);
    const x = clamp((tip.x - hand.shoulder.x) / (REACH_X * hand.torso));
    const y = clamp((hand.shoulder.y - CENTRE_UP * hand.torso - tip.y) / (REACH_Y * hand.torso));
    
    const u = this.filters[side].u.filter((x + 1) / 2, tS);
    const v = this.filters[side].v.filter((1 - y) / 2, tS);
    return { x: 2 * u - 1, y: 1 - 2 * v };
  }

  
  reset(side) {
    this.filters[side] = { u: new OneEuroFilter(this.params), v: new OneEuroFilter(this.params) };
  }
}
