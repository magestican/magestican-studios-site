

























import { statusOf, heightOf } from './dismemberment.js';






export const CHICKEN = Object.freeze({
  
  
  
  
  
  burstSpeed: 6.2,
  cruiseSpeed: 3.1,
  burstSeconds: 1.8,
  
  
  
  
  
  recoverSeconds: 2.6,
  
  
  burstRange: 9,
  
  reach: 0.9,
  
  senseRange: 16,
});

export const PORKER = Object.freeze({
  speed: 4.1,
  reach: 1.3,
  senseRange: 22,
  
  
  
  
  
  
  
  
  
  
  
  
  tellSeconds: 0.9,
  ambushRange: 4.5,
  
  turnRate: 1.4,
});

export const COW = Object.freeze({
  speed: 3.4,
  
  
  
  
  
  reach: 2.6,
  senseRange: 20,
  turnRate: 1.1,
});

const SPEC = { chicken: CHICKEN, porker: PORKER, cow: COW };



export const STATES = Object.freeze(['idle', 'hunt', 'burst', 'recover', 'tell', 'latched', 'blind', 'dead']);

export function createStalker(creature, opts = {}) {
  return {
    creature,
    species: creature.species,
    state: 'idle',
    
    
    stateTime: 0,
    
    
    
    lastKnown: null,
    
    
    holding: false,
    ...opts,
  };
}

function distanceTo(a, b) {
  return Math.hypot(b.x - a.x, b.z - a.z);
}









export function tickStalker(st, dt, world) {
  const step = Math.max(0, dt);
  const spec = SPEC[st.species];
  const status = statusOf(st.creature);

  if (!status.alive) {
    if (st.state !== 'dead') { st.state = 'dead'; st.stateTime = 0; st.holding = false; }
    return st;
  }

  st.stateTime += step;

  const player = world.player;
  const dist = distanceTo(st.creature.pos, player);
  
  
  
  const canSee = status.canSense && !world.concealed && dist <= spec.senseRange && world.lineOfSight !== false;

  if (canSee) st.lastKnown = { x: player.x, y: player.y, z: player.z };

  
  
  
  
  if (!status.canSense) {
    if (st.state !== 'blind' && st.state !== 'latched') { st.state = 'blind'; st.stateTime = 0; }
  }

  switch (st.state) {
    case 'latched':
      
      
      break;

    case 'idle':
      if (canSee) { st.state = 'hunt'; st.stateTime = 0; }
      break;

    case 'hunt': {
      if (st.species === 'chicken' && dist <= CHICKEN.burstRange && canSee) {
        st.state = 'burst'; st.stateTime = 0;
      } else if (st.species === 'porker' && dist <= PORKER.ambushRange && canSee) {
        
        
        st.state = 'tell'; st.stateTime = 0;
      } else if (dist <= spec.reach && canSee) {
        latch(st);
      }
      break;
    }

    case 'burst':
      if (dist <= CHICKEN.reach) latch(st);
      else if (st.stateTime >= CHICKEN.burstSeconds) { st.state = 'recover'; st.stateTime = 0; }
      break;

    case 'recover':
      if (st.stateTime >= CHICKEN.recoverSeconds) { st.state = 'hunt'; st.stateTime = 0; }
      break;

    case 'tell':
      
      
      
      
      if (dist > PORKER.ambushRange * 1.4 || !canSee) { st.state = 'hunt'; st.stateTime = 0; }
      
      
      
      
      
      else if (ambushReady(st) && dist <= PORKER.reach) latch(st);
      break;

    case 'blind':
      
      break;

    default:
      break;
  }

  return st;
}

function latch(st) {
  const status = statusOf(st.creature);
  
  
  
  
  
  if (!status.canGrapple) { st.state = 'hunt'; st.stateTime = 0; return; }
  st.state = 'latched';
  st.stateTime = 0;
  st.holding = true;
}

export function releaseLatch(st) {
  if (st.state !== 'latched') return st;
  st.holding = false;
  st.state = 'recover';
  st.stateTime = 0;
  return st;
}








export function speedOf(st) {
  const status = statusOf(st.creature);
  if (!status.alive) return 0;
  const spec = SPEC[st.species];
  let base;
  if (st.species === 'chicken') {
    if (st.state === 'burst') base = CHICKEN.burstSpeed;
    else if (st.state === 'latched') base = 0;
    else base = CHICKEN.cruiseSpeed;
  } else {
    base = st.state === 'latched' ? 0 : spec.speed;
  }
  return base * status.speed;
}





export function ambushReady(st) {
  return st.species === 'porker' && st.state === 'tell' && st.stateTime >= PORKER.tellSeconds;
}




export function blockWidth(st) {
  if (!statusOf(st.creature).alive) return 0;
  if (st.species !== 'cow') return 0;
  return heightOf(st.creature) * 0.55;
}











