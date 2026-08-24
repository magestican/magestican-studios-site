









import { FRAMES, TOTAL_MS, HOLD, CAM, A, B, FX, CLOSEUP } from './choreography.js';
import { GROUND_Y } from './stage.js';


export function frameAt(ms) {
  const t = ((ms % TOTAL_MS) + TOTAL_MS) % TOTAL_MS;
  let acc = 0;
  for (let i = 0; i < FRAMES.length; i += 1) {
    acc += FRAMES[i][HOLD];
    if (t < acc) return i;
  }
  return FRAMES.length - 1;
}


function lastKnown(i, slot) {
  for (let k = i; k >= 0; k -= 1) {
    if (FRAMES[k][slot]) return FRAMES[k][slot];
  }
  return null;
}










export function cameraAt(i) {
  const raw = lastKnown(i, CAM);
  const scale = raw ? 1 / raw[2] : 1;
  const closeup = FRAMES[i][CLOSEUP] === 1;
  return {
    zoom: closeup ? scale * 1.55 : scale,
    x: raw ? raw[0] : 0,
    y: raw ? raw[1] : 0,
    closeup,
  };
}









export function reachAt(i, slot) {
  if (FRAMES[i][FX] === 'burst') return 1;
  const cur = FRAMES[i][slot];
  if (!cur) return 0;
  const restW = 26;
  const spread = (cur[3] - restW) / restW;
  return spread < 0 ? 0 : spread > 1 ? 1 : spread;
}


export function facingAt(i) {
  const a = lastKnown(i, A);
  const b = lastKnown(i, B);
  if (!a || !b) return { a: 1, b: -1 };
  return a[0] <= b[0] ? { a: 1, b: -1 } : { a: -1, b: 1 };
}






const FIGHTER_W = 26;
const MIN_H = 34;
const MAX_H = 74;










export function poseAt(i) {
  const f = FRAMES[i];
  const facing = facingAt(i);
  const build = (slot, side) => {
    
    
    
    
    
    const v = f[slot] || (FRAMES[i][CLOSEUP] === 1 ? lastKnown(i, slot) : null);
    if (!v) return null;
    const raw = v[1] - v[2];
    const height = raw < MIN_H ? MIN_H : raw > MAX_H ? MAX_H : raw;
    const feet = Math.min(v[1], GROUND_Y + 8);
    return {
      cx: v[0], feet, top: feet - height,
      width: FIGHTER_W, facing: facing[side], reach: reachAt(i, slot),
    };
  };
  return {
    index: i,
    holdMs: f[HOLD],
    a: build(A, 'a'),
    b: build(B, 'b'),
    fx: f[FX],
    camera: cameraAt(i),
  };
}

export { TOTAL_MS };
