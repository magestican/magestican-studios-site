










export const DEADZONE = 0.08; 


export function createTouchSteer({ range = 70 } = {}) {
  let id = null; 
  let x0 = 0; 
  let x = 0;
  return {
    get active() { return id !== null; },
    get centre() { return x0; },
    get x() { return x; },
    setRange(r) { range = Math.max(20, r); },
    
    down(pid, px) {
      if (id !== null) return false;
      id = pid; x0 = px; x = px;
      return true;
    },
    move(pid, px) {
      if (pid !== id) return;
      x = px;
      if (x - x0 > range) x0 = x - range;
      else if (x0 - x > range) x0 = x + range;
    },
    up(pid) { if (pid === id) id = null; },
    reset() { id = null; },
    
    value() {
      if (id === null) return 0;
      const v = Math.max(-1, Math.min(1, (x - x0) / range));
      if (Math.abs(v) < DEADZONE) return 0;
      
      return Math.sign(v) * (Math.abs(v) - DEADZONE) / (1 - DEADZONE);
    },
  };
}






export const PAD_PX = 76; 
export const GUTTER_PX = 16;
export const KNOB_PX = 56;


export function steerRangeFor(width) {
  return Math.round(Math.max(72, Math.min(130, width * 0.22)));
}





export function steerZone({ width, height, range, driving, steer, y = 0 }) {
  const w = 2 * range + KNOB_PX;
  if (!driving) return { show: false, idle: false, cx: 0, cy: 0, knob: 0, width: w };
  if (steer.active) {
    const knob = Math.max(-range, Math.min(range, steer.x - steer.centre));
    return { show: true, idle: false, cx: steer.centre, cy: y, knob, width: w };
  }
  return {
    show: true, idle: true, knob: 0, width: w,
    cx: GUTTER_PX + w / 2,
    cy: height - GUTTER_PX - PAD_PX - 12 - 32,
  };
}
