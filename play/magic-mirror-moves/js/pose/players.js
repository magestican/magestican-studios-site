


import { bodyUnit, hipCentre, shoulderCentre } from './framing.js';


const STRIP = 0.58;






export function cropsFor(width, players) {
  if (players !== 2) return [{ x: 0, w: width }];
  const w = Math.round(width * STRIP);
  return [
    { x: width - w, w },
    { x: 0, w },
  ];
}


export function shiftPose(pose, dx) {
  
  const out = {};
  for (const [name, j] of Object.entries(pose)) if (j) out[name] = { ...j, x: j.x + dx };
  return out;
}

const centreOf = (p) => hipCentre(p) ?? shoulderCentre(p);






export function scoutCrop(width, p1) {
  const c = p1 && centreOf(p1);
  if (!c) return null;
  const crops = cropsFor(width, 2);
  const far = (k) => Math.abs(c.x - (crops[k].x + crops[k].w / 2));
  return far(0) >= far(1) ? crops[0] : crops[1];
}







export function secondPerson(p1, other, height) {
  if (!p1 || !other) return false;
  const s1 = shoulderCentre(p1);
  const s2 = shoulderCentre(other);
  const h2 = hipCentre(other);
  if (!s1 || !s2 || !h2) return false;
  if (!looksLikeAPerson(p1, other)) return false;
  return apart(p1, other, height);
}
function apart(p1, other, height) {
  const s1 = shoulderCentre(p1);
  const s2 = shoulderCentre(other);
  const h2 = hipCentre(other);
  const h1 = hipCentre(p1) ?? s1;
  const ls = p1.left_shoulder;
  const rs = p1.right_shoulder;
  const shoulders = ls && rs ? Math.abs(ls.x - rs.x) : 0;
  
  
  const w = Math.max(shoulders, 0.8 * (bodyUnit(p1) ?? height * 0.2));
  return Math.abs(s1.x - s2.x) >= SIDE * w && Math.abs(h1.x - h2.x) >= SIDE * w;
}
const SIDE = 0.7;









export function beside(before, other, after, height) {
  if (!before || !after || !other || !hasLegs(other) || !sureTorso(other)) return false;
  if (!shoulderCentre(before) || !shoulderCentre(after) || !shoulderCentre(other) || !hipCentre(other)) return false;
  if (!sameSize(before, other) || !apart(before, other, height) || !apart(after, other, height)) return false;
  const a = shoulderCentre(before).x;
  const b = shoulderCentre(after).x;
  const x = shoulderCentre(other).x;
  return x < Math.min(a, b) || x > Math.max(a, b);
}




const LEGS_SURE = 0.3;
function hasLegs(p) {
  return ['left_knee', 'right_knee', 'left_ankle', 'right_ankle'].some((n) => p?.[n]?.score >= LEGS_SURE);
}






const SAME_PLACE = 0.05; 








export function judgeLook(before, other, after, height, place) {
  const x = other ? shoulderCentre(other)?.x : null;
  const same = x != null && place != null && Math.abs(x - place) <= SAME_PLACE * height;
  if (x != null && beside(before, other, after, height) && (place == null || same)) return { second: true, place: x };
  return same ? { second: null, place } : { second: false, place: null };
}




const SURE = 0.7;
const SIZE_RATIO = 2.5;
function sureTorso(p) {
  return [p.left_shoulder, p.right_shoulder, p.left_hip, p.right_hip].every((j) => j?.score >= SURE);
}



function sizeOf(p) {
  const w = p.left_shoulder && p.right_shoulder ? Math.abs(p.left_shoulder.x - p.right_shoulder.x) : 0;
  return Math.max(bodyUnit(p) ?? 0, w * 1.25);
}
function sameSize(p1, other) {
  const a = sizeOf(p1);
  const b = sizeOf(other);
  return !a || !b || (b <= a * SIZE_RATIO && a <= b * SIZE_RATIO);
}
function looksLikeAPerson(p1, other) {
  if (!sureTorso(other)) return false;
  const s = shoulderCentre(other);
  const h = hipCentre(other);
  if (!(s.y < h.y)) return false;
  const a = bodyUnit(p1);
  const b = bodyUnit(other);
  return !a || !b || (b <= a * SIZE_RATIO && a <= b * SIZE_RATIO);
}





export function wrongBody(p1, other) {
  return !!p1 && !!other && !!shoulderCentre(other) && !!hipCentre(other) && !looksLikeAPerson(p1, other);
}





export const SCOUT_LOCK_LOOKS = 3;


export function stepLock(run, wrong) {
  if (!wrong) return { run: 0, forget: false };
  return run + 1 >= SCOUT_LOCK_LOOKS ? { run: 0, forget: true } : { run: run + 1, forget: false };
}

export const AUTO_JOIN_S = 1;

export const AUTO_JOIN_HITS = 3;


export const AUTO_LEAVE_S = 4;



export function initialAuto() {
  return { secs: 0, hits: 0, want: null };
}







export function stepAuto(s, { players, second }, dtS) {
  if (second === null || !(dtS > 0) || dtS > 2) return { ...s, want: null };
  const counting = players === 1 ? second : !second;
  const secs = counting ? s.secs + dtS : 0;
  const hits = counting ? s.hits + 1 : 0;
  if (players === 1 && secs >= AUTO_JOIN_S && hits >= AUTO_JOIN_HITS) return { secs: 0, hits: 0, want: 2 };
  if (players === 2 && secs >= AUTO_LEAVE_S) return { secs: 0, hits: 0, want: 1 };
  return { secs, hits, want: null };
}







export function mergePeople(people, crops, _width, height) {
  const out = [...people];
  if (out.length !== 2 || !out[0] || !out[1]) return out;
  const a = centreOf(out[0]);
  const b = centreOf(out[1]);
  if (!a || !b) return out;
  const unit = bodyUnit(out[0]) ?? height * 0.2;
  if (Math.hypot(a.x - b.x, a.y - b.y) >= 0.5 * unit) return out;
  const off = (c, k) => Math.abs(c.x - (crops[k].x + crops[k].w / 2)) / crops[k].w;
  if (off(a, 0) <= off(b, 1)) out[1] = null;
  else out[0] = null;
  return out;
}
