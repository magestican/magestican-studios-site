


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
  const h1 = hipCentre(p1) ?? s1;
  const ls = p1.left_shoulder;
  const rs = p1.right_shoulder;
  const shoulders = ls && rs ? Math.abs(ls.x - rs.x) : 0;
  const w = shoulders > 1 ? shoulders : 0.8 * (bodyUnit(p1) ?? height * 0.2);
  return Math.abs(s1.x - s2.x) >= SIDE * w && Math.abs(h1.x - h2.x) >= SIDE * w;
}
const SIDE = 0.7;

export const AUTO_JOIN_S = 1;


export const AUTO_LEAVE_S = 4;



export function initialAuto() {
  return { secs: 0, want: null };
}






export function stepAuto(s, { players, second }, dtS) {
  if (!(dtS > 0) || dtS > 2) return { ...s, want: null };
  const counting = players === 1 ? second : !second;
  const secs = counting ? s.secs + dtS : 0;
  if (players === 1 && secs >= AUTO_JOIN_S) return { secs: 0, want: 2 };
  if (players === 2 && secs >= AUTO_LEAVE_S) return { secs: 0, want: 1 };
  return { secs, want: null };
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
