


import { NO_HAND } from './hands.js';


export const SECOND_HOLD = 0.4; 
const SECOND_SCORE = 0.6; 
const TOGETHER = 0.3; 
const EDGE = 0.2; 


function credible(h, width) {
  if (!h.raised || !h.shoulder || (h.score ?? 0) < SECOND_SCORE) return false;
  const gap = EDGE * h.torso;
  return h.shoulder.x >= gap && h.shoulder.x <= width - gap;
}

export class GunHands {
  constructor() {
    
    this.first = null;
    
    this.since = null;
    this.second = false;
  }

  



  pick(hands, t, width) {
    if (this.first && !hands[this.first].raised) this.reset();
    if (!this.first) {
      if (hands.right.raised && hands.left.raised) this.first = (hands.right.score ?? 0) >= (hands.left.score ?? 0) ? 'right' : 'left';
      else if (hands.right.raised) this.first = 'right';
      else if (hands.left.raised) this.first = 'left';
    }
    if (!this.first) return hands;
    let other = this.first === 'right' ? 'left' : 'right';
    
    if (hands[other].raised && !credible(hands[this.first], width) && credible(hands[other], width)) {
      [this.first, other] = [other, this.first];
      this.since = null;
      this.second = false;
    }
    const seen = this.proven(hands[this.first], hands[other], width);
    if (!seen) {
      this.since = null;
      this.second = false;
    } else if (!this.second) {
      this.since ??= t;
      this.second = t - this.since >= SECOND_HOLD;
    }
    return this.second ? hands : { ...hands, [other]: { ...NO_HAND, torso: hands.torso } };
  }

  
  proven(a, b, width) {
    if (!a.wrist || !b.wrist || !credible(b, width)) return false;
    return Math.hypot(a.wrist.x - b.wrist.x, a.wrist.y - b.wrist.y) >= TOGETHER * b.torso;
  }

  reset() {
    this.first = null;
    this.since = null;
    this.second = false;
  }
}
