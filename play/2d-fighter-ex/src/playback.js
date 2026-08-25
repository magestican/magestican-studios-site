









import {
  FRAMES, TOTAL_MS, HOLD, CAM, A, B, FX, CLOSEUP,
  CX, TOP, BOT, HEAD_X, HAND1, HAND2, FOOT1, FOOT2,
} from './choreography.js';





const MIN_H = 34;
const MAX_H = 120;
const FIGHTER_W = 26;


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


export function facingAt(i) {
  const a = lastKnown(i, A);
  const b = lastKnown(i, B);
  if (!a || !b) return { a: 1, b: -1 };
  return a[CX] <= b[CX] ? { a: 1, b: -1 } : { a: -1, b: 1 };
}










function limbPair(v, i1, i2, rest, cx) {
  const p1 = v[i1] < 0 ? null : [v[i1], v[i1 + 1]];
  const p2 = v[i2] < 0 ? null : [v[i2], v[i2 + 1]];
  if (p1 && p2) return [p1, p2];
  const found = p1 || p2;
  if (!found) return rest;
  const mirrored = [2 * cx - found[0], found[1]];
  return found[0] <= cx ? [found, mirrored] : [mirrored, found];
}








export function poseAt(i) {
  const f = FRAMES[i];
  const facing = facingAt(i);
  const closeup = f[CLOSEUP] === 1;

  const build = (slot, side) => {
    
    
    const v = f[slot] || (closeup ? lastKnown(i, slot) : null);
    if (!v) return null;
    const rawH = v[BOT] - v[TOP];
    const height = rawH < MIN_H ? MIN_H : rawH > MAX_H ? MAX_H : rawH;
    const cx = v[CX];
    const feet = v[TOP] + height;
    const restHandY = v[TOP] + height * 0.45;
    const restFootY = feet;
    return {
      cx,
      feet,
      top: v[TOP],
      width: FIGHTER_W,
      facing: facing[side],
      headX: v[HEAD_X],
      hands: limbPair(v, HAND1, HAND2,
        [[cx - FIGHTER_W * 0.8, restHandY], [cx + FIGHTER_W * 0.8, restHandY]], cx),
      feetPts: limbPair(v, FOOT1, FOOT2,
        [[cx - FIGHTER_W * 0.35, restFootY], [cx + FIGHTER_W * 0.35, restFootY]], cx),
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






















const MAX_TWEEN_MS = 110;

const lerp = (a, b, t) => a + (b - a) * t;

const ease = (t) => t * t * (3 - 2 * t);

function lerpPts(a, b, t) {
  if (!a || !b || a.length !== b.length) return a;
  return a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t)]);
}

function lerpSpec(a, b, t) {
  
  
  if (!a || !b) return a;
  return {
    cx: lerp(a.cx, b.cx, t),
    feet: lerp(a.feet, b.feet, t),
    top: lerp(a.top, b.top, t),
    width: a.width,
    facing: t < 0.5 ? a.facing : b.facing,
    headX: lerp(a.headX, b.headX, t),
    hands: lerpPts(a.hands, b.hands, t),
    feetPts: lerpPts(a.feetPts, b.feetPts, t),
  };
}


export function cursorAt(ms) {
  const t = ((ms % TOTAL_MS) + TOTAL_MS) % TOTAL_MS;
  let acc = 0;
  for (let i = 0; i < FRAMES.length; i += 1) {
    const hold = FRAMES[i][HOLD];
    if (t < acc + hold) return { index: i, into: t - acc, hold };
    acc += hold;
  }
  const last = FRAMES.length - 1;
  return { index: last, into: FRAMES[last][HOLD], hold: FRAMES[last][HOLD] };
}







export function poseAtTime(ms) {
  const { index, into, hold } = cursorAt(ms);
  const cur = poseAt(index);
  const tween = Math.min(hold, MAX_TWEEN_MS);
  const startAt = hold - tween;
  if (into <= startAt || tween <= 0) return { ...cur, tween: 0 };

  const next = poseAt((index + 1) % FRAMES.length);
  const t = ease(Math.min(1, (into - startAt) / tween));
  return {
    index,
    holdMs: hold,
    tween: t,
    a: lerpSpec(cur.a, next.a, t),
    b: lerpSpec(cur.b, next.b, t),
    fx: cur.fx,
    camera: {
      zoom: lerp(cur.camera.zoom, next.camera.zoom, t),
      x: lerp(cur.camera.x, next.camera.x, t),
      y: lerp(cur.camera.y, next.camera.y, t),
      closeup: cur.camera.closeup,
    },
  };
}

export { TOTAL_MS, MAX_TWEEN_MS };
