


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
