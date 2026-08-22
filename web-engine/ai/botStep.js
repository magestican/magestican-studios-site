









































import { navGraphFor, navFieldFor, MAX_STEP_UP, MAX_DROP } from './navField.js';

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

export function stepBot(state, dt, grid, goal, rng = Math.random) {
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
  
  
  const dGoal = Math.hypot(goal.x - state.pos.x, goal.z - state.pos.z);
  const brake = dGoal >= ARRIVE_RADIUS
    ? 1
    : Math.max(ARRIVE_CREEP, dGoal / ARRIVE_RADIUS);
  const dist = MOVE_SPEED * p.speed * brake * dt;
  const stepX = wd.x * dist;
  const stepZ = wd.z * dist;
  const fromY = state.pos.y;
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

  
  const targetYaw = Math.atan2(state.wanderDir.x, state.wanderDir.z);
  let d = (targetYaw - state.yaw) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  state.yaw += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt);
}
