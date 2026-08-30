















































































export const LANE_IDS = Object.freeze(['north', 'mid', 'south']);











export const LANE_HALF = 6;










export const CHOKE_SPAN = 22;
export const CHOKE_GAP = 4;


function segDistance(px, pz, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  
  
  
  if (len2 <= 1e-9) return { dist: Math.hypot(px - a.x, pz - a.z), t: 0 };
  let t = ((px - a.x) * dx + (pz - a.z) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + dx * t;
  const cz = a.z + dz * t;
  return { dist: Math.hypot(px - cx, pz - cz), t };
}


function polyLength(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  }
  return total;
}


export function alongPolyline(pts, frac) {
  const total = polyLength(pts);
  const want = Math.max(0, Math.min(1, frac)) * total;
  let run = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (run + seg >= want || i === pts.length - 1) {
      const t = seg <= 1e-9 ? 0 : (want - run) / seg;
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        
        
        hx: seg <= 1e-9 ? 1 : (b.x - a.x) / seg,
        hz: seg <= 1e-9 ? 0 : (b.z - a.z) / seg,
      };
    }
    run += seg;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, z: last.z, hx: 1, hz: 0 };
}













export function buildLanes(size, redBase, blueBase, baseSize = { x: 10, z: 10 }) {
  const from = { x: redBase.x + baseSize.x / 2, z: redBase.z + baseSize.z / 2 };
  const to = { x: blueBase.x + baseSize.x / 2, z: blueBase.z + baseSize.z / 2 };
  const cx = size.x / 2;
  const cz = size.z / 2;

  
  
  
  
  
  const inset = Math.round(size.x * 0.115);
  const gym = { x: size.x - 1 - inset, z: inset };
  const dairy = { x: inset, z: size.z - 1 - inset };

  const lanes = [
    { id: 'north', points: [from, gym, to], role: 'flank' },
    { id: 'mid', points: [from, { x: cx, z: cz }, to], role: 'direct' },
    { id: 'south', points: [from, dairy, to], role: 'flank' },
  ];

  for (const lane of lanes) {
    lane.length = polyLength(lane.points);
    
    
    
    
    
    const mid = alongPolyline(lane.points, 0.5);
    lane.choke = {
      x: mid.x, z: mid.z, hx: mid.hx, hz: mid.hz,
      span: CHOKE_SPAN, gap: CHOKE_GAP, laneId: lane.id,
    };
  }
  return lanes;
}


export function nearestLane(lanes, x, z) {
  let best = null;
  for (const lane of lanes) {
    for (let i = 1; i < lane.points.length; i += 1) {
      const r = segDistance(x, z, lane.points[i - 1], lane.points[i]);
      if (best === null || r.dist < best.dist) best = { id: lane.id, dist: r.dist, lane };
    }
  }
  return best;
}


export function inLane(lanes, x, z, half = LANE_HALF) {
  const n = nearestLane(lanes, x, z);
  return !!n && n.dist <= half;
}











export function inLaneBorder(lanes, x, z, half = LANE_HALF, band = 4) {
  const n = nearestLane(lanes, x, z);
  return !!n && n.dist > half && n.dist <= half + band;
}


export function chokePoints(lanes) {
  return lanes.map((l) => l.choke);
}








export function chokesAreSeparated(lanes, range = 30) {
  const cs = chokePoints(lanes);
  for (let i = 0; i < cs.length; i += 1) {
    for (let j = i + 1; j < cs.length; j += 1) {
      
      
      if (Math.hypot(cs[i].x - cs[j].x, cs[i].z - cs[j].z) <= range) return false;
    }
  }
  return true;
}









export function flankPremium(lanes) {
  const mid = lanes.find((l) => l.id === 'mid');
  const flanks = lanes.filter((l) => l.role === 'flank');
  return flanks.map((f) => ({ id: f.id, ratio: f.length / mid.length }));
}
