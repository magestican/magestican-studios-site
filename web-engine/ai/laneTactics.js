
































import { alongPolyline, nearestLane } from '../procgen/laneSpec.js';









export const WAYPOINT_REACH = 8;








export const DIRECT_RANGE = 16;










export function laneFor(lanes, key) {
  if (!lanes || !lanes.length) return null;
  const s = String(key ?? '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return lanes[Math.abs(h) % lanes.length];
}









export function laneProgress(lane, x, z, fromStart = true) {
  if (!lane) return 0;
  let best = 1;
  let bestD = Infinity;
  const STEPS = 24;
  for (let i = 0; i <= STEPS; i += 1) {
    const t = i / STEPS;
    const p = alongPolyline(lane.points, t);
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bestD) { bestD = d; best = t; }
  }
  return fromStart ? best : 1 - best;
}














export function nextWaypoint(lanes, lane, pos, goal, fromStart = true) {
  if (!lane || !goal) return goal ?? null;
  const toGoal = Math.hypot(goal.x - pos.x, goal.z - pos.z);
  
  if (toGoal <= DIRECT_RANGE) return goal;

  const t = laneProgress(lane, pos.x, pos.z, fromStart);
  
  
  const ahead = Math.min(1, t + 0.12);
  const p = alongPolyline(lane.points, fromStart ? ahead : 1 - ahead);

  
  
  
  const wpToGoal = Math.hypot(goal.x - p.x, goal.z - p.z);
  if (wpToGoal >= toGoal) return goal;
  return { x: p.x, z: p.z };
}











export function guardPost(lanes, slot = 0) {
  if (!lanes || !lanes.length) return null;
  const lane = lanes[Math.abs(slot | 0) % lanes.length];
  return { x: lane.choke.x, z: lane.choke.z, laneId: lane.id };
}





export function nearestChoke(lanes, x, z) {
  if (!lanes || !lanes.length) return null;
  let best = null;
  let bestD = Infinity;
  for (const l of lanes) {
    const d = Math.hypot(l.choke.x - x, l.choke.z - z);
    if (d < bestD) { bestD = d; best = { x: l.choke.x, z: l.choke.z, laneId: l.id, dist: d }; }
  }
  return best;
}


export function onLane(lanes, x, z, half = 8) {
  const n = nearestLane(lanes || [], x, z);
  return !!n && n.dist <= half;
}
