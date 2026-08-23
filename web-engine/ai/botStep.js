






























































import { navGraphFor, navFieldFor, MAX_STEP_UP, MAX_DROP } from './navField.js';
import {
  neighbourhoodFor, separationPush, quarterTurn,
  SEP_GAIN, HEAD_ON_DOT, AVOID_RANGE, PERSONAL_SPACE,
} from './separation.js';

export const SAMPLE_Y   = 2.5;   
export const GROUND_Y   = 2.0;   
export const WALK_Y     = SAMPLE_Y;
export const GROUND_SEARCH_MAX_Y = 8;   

const VOX_AIR = 0;
const VOX_HAY = 10;




function blocks(grid, tx, y, tz) {
  if (typeof grid.get === 'function') {
    const v = grid.get(tx, y, tz);
    return v !== VOX_AIR && v !== VOX_HAY;
  }
  return grid.isSolid(tx + 0.5, y + 0.5, tz + 0.5);
}










export function groundHeightAt(grid, x, z, fromY = GROUND_Y) {
  const tx = Math.floor(x), tz = Math.floor(z);
  const startY = Math.min(GROUND_SEARCH_MAX_Y, Math.max(1, Math.floor(fromY + 1)));
  for (let y = startY; y >= 0; y--) {
    if (blocks(grid, tx, y, tz)) return y + 1;
  }
  return GROUND_Y;
}
export const MOVE_SPEED = 4.8;   
export const TURN_RATE  = 3.5;   
export const COMMIT_MIN = 1.4;   
export const COMMIT_MAX = 2.2;   



const REPATH_MIN = 0.22;         
const REPATH_JITTER = 0.20;      
                                 
const LOOKAHEAD = 8;             
const ARRIVE_RADIUS = 2.5;       
                                 
const ARRIVE_CREEP = 0.18;       
                                 
                                 



const STUCK_WINDOW = 1.0;        
const STUCK_MIN_MOVE = 0.6;      






function ensurePersonality(state, rng) {
  if (state.personality) return state.personality;
  const p = {
    lateral:   (rng() - 0.5) * 3.6,          
    weaveRate: 0.35 + rng() * 0.5,           
    weavePhase: rng() * Math.PI * 2,
    speed:     0.92 + rng() * 0.16,
    repath:    REPATH_MIN + rng() * REPATH_JITTER,
  };
  state.personality = p;
  return p;
}



function commitEscape(state, rng) {
  const wd = state.wanderDir;
  const ang = (rng() - 0.5) * Math.PI;
  const s = Math.sin(ang), c = Math.cos(ang);
  const x = wd.x * c - wd.z * s;
  const z = wd.x * s + wd.z * c;
  const l = Math.hypot(x, z) || 1;
  state.wanderDir = { x: x / l, z: z / l };
  state.wanderT = COMMIT_MIN + rng() * (COMMIT_MAX - COMMIT_MIN);
}




function planWaypoint(graph, grid, state, goal, p, t) {
  const dGoal = Math.hypot(goal.x - state.pos.x, goal.z - state.pos.z);
  if (dGoal <= ARRIVE_RADIUS) return { x: goal.x, z: goal.z };

  const field = navFieldFor(grid, goal.x, goal.z);
  if (!field) return null;                       
  const wp = graph.waypoint(field, state.pos.x, state.pos.z, LOOKAHEAD);
  if (!wp) return null;                          
  if (wp.arrived) return { x: goal.x, z: goal.z };

  
  
  
  const dx = wp.x - state.pos.x, dz = wp.z - state.pos.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.2) return wp;
  const weave = Math.sin(t * p.weaveRate + p.weavePhase);
  const off = p.lateral * weave;
  const ox = wp.x + (-dz / len) * off;
  const oz = wp.z + (dx / len) * off;
  if (graph.clearWalk(state.pos.x, state.pos.z, ox, oz)) return { x: ox, z: oz };
  return wp;
}









const MAX_AVOID_TURN = 75 * Math.PI / 180;



const PROBE_M = 0.7;






function avoid(graph, state, dirX, dirZ, crowd, fromY, arrived) {
  if (!crowd || crowd.length < 2) return null;
  const hood = neighbourhoodFor(crowd);
  const self = {
    peerId: state.id ?? null,
    x: state.pos.x, z: state.pos.z,
    size: state.sizeScale ?? 1,
  };
  const push = separationPush(hood, self, {
    space: PERSONAL_SPACE, range: AVOID_RANGE,
  });
  const mag = Math.hypot(push.x, push.z);
  if (mag < 1e-3) return null;

  let ux = push.x / mag, uz = push.z / mag;
  
  
  
  if (ux * dirX + uz * dirZ < HEAD_ON_DOT) {
    const t = quarterTurn(ux, uz);
    ux = t.x; uz = t.z;
  }

  const gain = SEP_GAIN * Math.min(mag, 1.6);
  let mx = dirX + ux * gain, mz = dirZ + uz * gain;
  let ml = Math.hypot(mx, mz);
  if (ml < 1e-6) return null;
  mx /= ml; mz /= ml;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cross = dirX * mz - dirZ * mx;
  const dot = dirX * mx + dirZ * mz;
  const ang = Math.atan2(cross, dot);
  if (!arrived && Math.abs(ang) > MAX_AVOID_TURN) {
    const a = Math.sign(ang) * MAX_AVOID_TURN;
    const s = Math.sin(a), c = Math.cos(a);
    mx = dirX * c - dirZ * s;
    mz = dirX * s + dirZ * c;
  }

  
  
  
  
  
  const s = graph.surfaceAt(
    Math.floor(state.pos.x + mx * PROBE_M),
    Math.floor(state.pos.z + mz * PROBE_M),
  );
  if (s < 0) return null;
  const rise = s - fromY;
  if (rise > MAX_STEP_UP || -rise > MAX_DROP) return null;

  return { x: mx, z: mz, crowding: mag, closest: push.closest };
}





const RESOLVE_SPEED = 2.0;




const RESOLVE_SHARE = 0.6;

























function unstack(graph, state, crowd, fromY, dt) {
  if (!crowd || crowd.length < 2) return 0;
  const hood = neighbourhoodFor(crowd);
  const selfSize = state.sizeScale ?? 1;
  let cx = 0, cz = 0, deepest = 0;

  hood.forEachNear(state.pos.x, state.pos.z, PERSONAL_SPACE * Math.max(1, selfSize), (b) => {
    if (b.peerId != null && state.id != null && b.peerId === state.id) return;
    const contact = PERSONAL_SPACE * 0.5 * (selfSize + (b.size ?? 1));
    let dx = state.pos.x - b.x, dz = state.pos.z - b.z;
    let d = Math.hypot(dx, dz);
    if (d >= contact) return;
    if (d < 1e-4) {
      
      
      
      
      
      const push = separationPush(hood, {
        peerId: state.id, x: state.pos.x, z: state.pos.z, size: selfSize,
      });
      const l = Math.hypot(push.x, push.z) || 1;
      dx = push.x / l; dz = push.z / l; d = 1;
    }
    const gap = contact - d;
    if (gap > deepest) deepest = gap;
    cx += (dx / d) * gap * RESOLVE_SHARE;
    cz += (dz / d) * gap * RESOLVE_SHARE;
  });

  if (deepest <= 0) return 0;
  
  
  
  const len = Math.hypot(cx, cz);
  const cap = RESOLVE_SPEED * dt;
  if (len > cap) { cx = (cx / len) * cap; cz = (cz / len) * cap; }

  const canStand = (x, z) => {
    const s = graph.surfaceAt(Math.floor(x), Math.floor(z));
    if (s < 0) return false;
    const rise = s - fromY;
    return rise <= MAX_STEP_UP && -rise <= MAX_DROP;
  };
  if (canStand(state.pos.x + cx, state.pos.z + cz)) {
    state.pos.x += cx; state.pos.z += cz;
  } else if (canStand(state.pos.x + cx, state.pos.z)) {
    state.pos.x += cx;
  } else if (canStand(state.pos.x, state.pos.z + cz)) {
    state.pos.z += cz;
  }
  return deepest;
}





export function stepBot(state, dt, grid, goal, rng = Math.random, crowd = null) {
  const p = ensurePersonality(state, rng);
  const graph = navGraphFor(grid);

  state.wanderT  = (state.wanderT ?? 0) - dt;
  state.repathT  = (state.repathT ?? 0) - dt;
  state.clockT   = (state.clockT ?? rng() * 10) + dt;

  if (state.repathT <= 0) {
    state.repathT = p.repath;
    state.waypoint = planWaypoint(graph, grid, state, goal, p, state.clockT);
    state.navOk = state.waypoint != null;
  }

  
  
  
  if (state.wanderT <= 0) {
    const aim = state.waypoint ?? goal;
    let dx = aim.x - state.pos.x;
    let dz = aim.z - state.pos.z;
    let len = Math.hypot(dx, dz);
    if (len < 1e-4) { dx = state.wanderDir.x; dz = state.wanderDir.z; len = Math.hypot(dx, dz) || 1; }
    state.wanderDir = { x: dx / len, z: dz / len };
  }

  const wd = state.wanderDir;
  const fromY = state.pos.y;
  const dGoal = Math.hypot(goal.x - state.pos.x, goal.z - state.pos.z);
  const arrived = dGoal <= ARRIVE_RADIUS;

  
  
  
  
  
  
  
  
  
  
  
  
  
  const bend = avoid(graph, state, wd.x, wd.z, crowd, fromY, arrived);
  const mvX = bend ? bend.x : wd.x;
  const mvZ = bend ? bend.z : wd.z;

  
  
  let brake = dGoal >= ARRIVE_RADIUS
    ? 1
    : Math.max(ARRIVE_CREEP, dGoal / ARRIVE_RADIUS);
  const dist = MOVE_SPEED * p.speed * brake * dt;
  const stepX = mvX * dist;
  const stepZ = mvZ * dist;
  const canGo = (x, z) => {
    const s = graph.surfaceAt(Math.floor(x), Math.floor(z));
    if (s < 0) return false;
    const rise = s - fromY;
    return rise <= MAX_STEP_UP && -rise <= MAX_DROP;
  };

  if (canGo(state.pos.x + stepX, state.pos.z + stepZ)) {
    state.pos.x += stepX;
    state.pos.z += stepZ;
  } else if (Math.abs(stepX) > 1e-6 && canGo(state.pos.x + stepX, state.pos.z)) {
    
    
    
    
    
    state.pos.x += stepX;
  } else if (Math.abs(stepZ) > 1e-6 && canGo(state.pos.x, state.pos.z + stepZ)) {
    state.pos.z += stepZ;
  } else {
    commitEscape(state, rng);
    state.waypoint = null;
    state.repathT = 0;
  }

  
  
  
  
  state.crowdOverlap = unstack(graph, state, crowd, fromY, dt);

  
  
  
  
  
  
  state.pos.y = groundHeightAt(grid, state.pos.x, state.pos.z, state.pos.y);

  
  
  state.stuckT = (state.stuckT ?? 0) + dt;
  if (state.stuckT >= STUCK_WINDOW) {
    const ref = state.stuckRef;
    
    
    if (ref && dGoal > ARRIVE_RADIUS
        && Math.hypot(state.pos.x - ref.x, state.pos.z - ref.z) < STUCK_MIN_MOVE) {
      commitEscape(state, rng);
      state.waypoint = null;
      state.repathT = 0;
    }
    state.stuckRef = { x: state.pos.x, z: state.pos.z };
    state.stuckT = 0;
  }

  
  
  
  const targetYaw = Math.atan2(mvX, mvZ);
  let d = (targetYaw - state.yaw) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  state.yaw += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt);
}
