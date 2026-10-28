




import { hipCentre, shoulderCentre, torsoLength } from './pose/framing.js';
import { seen } from './pose/pose.js';

export const MOVES = ['arms_up', 'star', 'flap', 'jump', 'squat', 'twirl', 'wand', 'boo', 'crown'];


export const MOVE_JOINTS = {
  arms_up: ['nose', 'left_wrist', 'right_wrist', 'left_shoulder', 'right_shoulder'],
  star: ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle', 'left_hip', 'right_hip'],
  flap: ['left_wrist', 'right_wrist', 'left_shoulder', 'right_shoulder'],
  jump: ['left_hip', 'right_hip', 'left_ankle', 'right_ankle'],
  squat: ['left_hip', 'right_hip', 'left_knee', 'right_knee'],
  twirl: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
  wand: ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder'],
  boo: ['nose', 'left_wrist', 'right_wrist'],
  crown: ['nose', 'left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'],
};

const COOLDOWN_S = 0.9; 


export function moveVisible(pose, move) {
  return MOVE_JOINTS[move].every((j) => seen(pose[j]));
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);







export class MoveTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.torso = null; 
    this.baseHip = null; 
    this.baseShoulderW = null; 
    this.lastFired = {};
    this.held = {}; 
    this.flapSigns = []; 
    this.booArmed = -1; 
    this.twirlCollapsed = -1; 
    this.prevT = null;
  }

  
  update(frame) {
    const { pose, t } = frame;
    const dt = this.prevT === null ? 0 : Math.max(0, Math.min(0.25, t - this.prevT));
    this.prevT = t;
    
    const out = { hits: [], partial: [] };
    const T0 = torsoLength(pose);
    if (!T0) return out;
    
    this.torso = this.torso === null ? T0 : this.torso;
    const T = this.torso;
    const hip = hipCentre(pose);
    const sc = shoulderCentre(pose);
    const shoulderW = dist(pose.left_shoulder, pose.right_shoulder);

    
    
    const standing = this.baseHip === null || Math.abs(hip.y - this.baseHip) < 0.08 * T;
    if (standing) {
      const k = this.baseHip === null ? 1 : Math.min(1, dt * 1.5);
      this.baseHip = this.baseHip === null ? hip.y : this.baseHip + (hip.y - this.baseHip) * k;
      this.torso += (T0 - this.torso) * Math.min(1, dt * 0.8);
      if (this.baseShoulderW === null || shoulderW > this.baseShoulderW) this.baseShoulderW = shoulderW;
      else if (shoulderW > 0.7 * this.baseShoulderW) this.baseShoulderW += (shoulderW - this.baseShoulderW) * Math.min(1, dt * 0.3);
    }

    const fire = (move, at, hand) => {
      if (t - (this.lastFired[move] ?? -99) < COOLDOWN_S) return;
      this.lastFired[move] = t;
      out.hits.push(hand ? { move, at, hand } : { move, at });
    };
    const hold = (move, cond, need) => {
      this.held[move] = cond ? (this.held[move] ?? 0) + dt : 0;
      return cond && this.held[move] >= need;
    };
    const { nose, left_wrist: lw, right_wrist: rw, left_elbow: le, right_elbow: re } = pose;
    const ls = pose.left_shoulder;
    const rs = pose.right_shoulder;
    const hands = [lw, rw].filter((j) => seen(j));
    const head = seen(nose) ? { x: nose.x, y: nose.y - 0.3 * T } : sc;

    
    if (moveVisible(pose, 'arms_up')) {
      const up = (w) => w.y < nose.y - 0.45 * T;
      if (up(lw) && up(rw)) fire('arms_up', [lw, rw]);
      else if (up(lw) || up(rw)) out.partial.push('arms_up');
    }

    
    if (moveVisible(pose, 'star')) {
      const armsOut = Math.abs(lw.x - rw.x) > 2.0 * T && lw.y < sc.y + 0.45 * T && rw.y < sc.y + 0.45 * T;
      const legsOut = Math.abs(pose.left_ankle.x - pose.right_ankle.x) > 1.1 * T;
      if (armsOut && legsOut) fire('star', [hip]);
      else if (armsOut || legsOut) out.partial.push('star');
    }

    
    if (moveVisible(pose, 'flap')) {
      const rel = ((lw.y + rw.y) / 2 - sc.y) / T;
      const sign = rel < -0.15 ? -1 : rel > 0.15 ? 1 : 0;
      const last = this.flapSigns.at(-1);
      if (sign !== 0 && (!last || last.sign !== sign)) this.flapSigns.push({ t, sign });
      this.flapSigns = this.flapSigns.filter((s) => t - s.t <= 2);
      if (this.flapSigns.length >= 5) {
        fire('flap', [lw, rw]);
        this.flapSigns = [];
      } else if (this.flapSigns.length >= 3) out.partial.push('flap');
    }

    
    if (moveVisible(pose, 'jump') && this.baseHip !== null) {
      const rise = (this.baseHip - hip.y) / T;
      if (rise > 0.18) fire('jump', [pose.left_ankle, pose.right_ankle]);
    }

    
    if (moveVisible(pose, 'squat') && this.baseHip !== null) {
      const sink = (hip.y - this.baseHip) / T;
      if (hold('squat', sink > 0.3, 0.3)) fire('squat', [hip]);
      else if (sink > 0.15) out.partial.push('squat');
    }

    
    if (moveVisible(pose, 'twirl') && this.baseShoulderW) {
      const r = shoulderW / this.baseShoulderW;
      if (r < 0.4) this.twirlCollapsed = t;
      if (this.twirlCollapsed >= 0 && r > 0.75 && t - this.twirlCollapsed < 2.5) {
        fire('twirl', [sc]);
        this.twirlCollapsed = -1;
      } else if (this.twirlCollapsed >= 0 && t - this.twirlCollapsed < 2.5) out.partial.push('twirl');
    }

    
    if (moveVisible(pose, 'wand')) {
      const pointing = (s, e, w) => {
        const reach = dist(s, w) / (dist(s, e) + dist(e, w));
        const level = Math.abs(w.y - s.y) < 0.35 * dist(s, w);
        const out_ = dist(s, w) > 0.9 * T;
        return { ok: reach > 0.88 && level && out_, near: level && out_ };
      };
      const L = pointing(ls, le, lw);
      const R = pointing(rs, re, rw);
      
      const one = L.ok !== R.ok ? (L.ok ? 'left' : 'right') : null;
      if (hold('wand', !!one, 0.4)) fire('wand', [one === 'left' ? lw : rw], one);
      else if (L.near || R.near) out.partial.push('wand');
    }

    
    if (moveVisible(pose, 'boo')) {
      const atFace = dist(lw, nose) < 0.6 * T && dist(rw, nose) < 0.6 * T;
      if (atFace) this.booArmed = t;
      else if (this.booArmed >= 0 && t - this.booArmed < 1.2) {
        if (dist(lw, rw) > 1.8 * T) {
          fire('boo', [nose]);
          this.booArmed = -1;
        } else out.partial.push('boo');
      }
    }

    
    if (moveVisible(pose, 'crown')) {
      const onHead = (w, e) => w.y < nose.y + 0.05 * T && w.y > nose.y - 0.45 * T && Math.abs(w.x - nose.x) < 0.7 * T && e.y > w.y;
      const both = onHead(lw, le) && onHead(rw, re);
      if (hold('crown', both, 0.5)) fire('crown', [head]);
      else if (onHead(lw, le) || onHead(rw, re)) out.partial.push('crown');
    }

    if (hands.length === 0) out.partial = [];
    return out;
  }
}
