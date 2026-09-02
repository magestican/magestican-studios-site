







































export const MAX_HEALTH = 100;
export const MAX_STAMINA = 100;


export const SPRINT_DRAIN = 12;   
export const WALK_REGEN = 9;      
export const HIDDEN_REGEN = 18;   







export const HEALTH_REGEN = 0;





export const GRAPPLE_DRAIN = Object.freeze({
  chicken: { base: 2, tau: 4.0 },
  porker: { base: 9, tau: 2.0 },
  cow: { base: 6, tau: 2.5 },
});




export const CHICKEN_LATCH_SLOW = 0.35;


export function drainRate(species, t) {
  const d = GRAPPLE_DRAIN[species];
  if (!d) throw new Error(`no grapple drain for species: ${species}`);
  const held = Math.max(0, t);
  return d.base * (1 + held / d.tau);
}



export function drainCost(species, T) {
  const d = GRAPPLE_DRAIN[species];
  if (!d) throw new Error(`no grapple drain for species: ${species}`);
  const held = Math.max(0, T);
  return d.base * (held + (held * held) / (2 * d.tau));
}










export function drainBetween(species, t0, t1) {
  return drainCost(species, t1) - drainCost(species, t0);
}



export function spawnVitals(opts = {}) {
  return {
    health: opts.health ?? MAX_HEALTH,
    stamina: opts.stamina ?? MAX_STAMINA,
    alive: true,
    
    
    
    grappledBy: null,
    grappleTime: 0,
    
    
    causeOfDeath: null,
  };
}

function kill(v, cause) {
  v.health = 0;
  v.alive = false;
  v.causeOfDeath = cause;
}

export function damage(vitals, amount, cause = 'damage') {
  if (!vitals.alive) return vitals;
  vitals.health = Math.max(0, vitals.health - Math.max(0, amount));
  if (vitals.health <= 0) kill(vitals, cause);
  return vitals;
}


export function heal(vitals, amount) {
  if (!vitals.alive) return vitals;
  vitals.health = Math.min(MAX_HEALTH, vitals.health + Math.max(0, amount));
  return vitals;
}

export function beginGrapple(vitals, species) {
  if (!vitals.alive) return vitals;
  vitals.grappledBy = species;
  vitals.grappleTime = 0;
  return vitals;
}

export function endGrapple(vitals) {
  vitals.grappledBy = null;
  vitals.grappleTime = 0;
  return vitals;
}








export function tickVitals(vitals, dt, mode = 'walk', incoming = 1) {
  if (!vitals.alive) return vitals;
  const step = Math.max(0, dt);

  if (vitals.grappledBy) {
    const t0 = vitals.grappleTime;
    const t1 = t0 + step;
    vitals.grappleTime = t1;
    
    
    
    
    const cost = drainBetween(vitals.grappledBy, t0, t1) * incoming;
    vitals.health = Math.max(0, vitals.health - cost);
    if (vitals.health <= 0) kill(vitals, vitals.grappledBy);
    return vitals;
  }

  if (mode === 'sprint') vitals.stamina = Math.max(0, vitals.stamina - SPRINT_DRAIN * step);
  else if (mode === 'hidden') vitals.stamina = Math.min(MAX_STAMINA, vitals.stamina + HIDDEN_REGEN * step);
  else vitals.stamina = Math.min(MAX_STAMINA, vitals.stamina + WALK_REGEN * step);

  
  
  vitals.health = Math.min(MAX_HEALTH, vitals.health + HEALTH_REGEN * step);
  return vitals;
}




export function canSprint(vitals) {
  return vitals.alive && vitals.stamina > 0;
}








export function speedMultiplier(latched = 0) {
  const n = Math.max(0, Math.floor(latched));
  return (1 - CHICKEN_LATCH_SLOW) ** n;
}
