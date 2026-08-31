




















































export const GIVE_UP_AT = 100;



export const FATIGUE_DECAY = 0.6;











export const METRES_PER_POINT = Object.freeze({
  chicken: 0.6,    
  porker: 1.2,     
  cow: 1.0,        
  horse: 8.0,      
});







export const GIVE_UP_SECONDS = Object.freeze({
  chicken: 12,
  porker: 18,
  cow: 15,
  horse: 25,
});




















export function createFatigue(species, opts = {}) {
  return {
    species,
    value: 0,
    
    givenUpFor: 0,
    gaveUp: false,
    metresPerPoint: opts.metresPerPoint,
    giveUpSeconds: opts.giveUpSeconds,
  };
}




export function tickFatigue(f, dt, { pursuing, metres = 0 } = {}) {
  const step = Math.max(0, dt);

  if (f.gaveUp) {
    f.givenUpFor = Math.max(0, f.givenUpFor - step);
    
    
    
    f.value = Math.max(0, f.value - FATIGUE_DECAY * step);
    if (f.givenUpFor <= 0) { f.gaveUp = false; f.value = Math.min(f.value, GIVE_UP_AT * 0.5); }
    return f;
  }

  if (pursuing) {
    const per = f.metresPerPoint ?? METRES_PER_POINT[f.species] ?? METRES_PER_POINT.cow;
    f.value += Math.max(0, metres) / per;
    if (f.value >= GIVE_UP_AT) {
      f.value = GIVE_UP_AT;
      f.gaveUp = true;
      f.givenUpFor = f.giveUpSeconds ?? GIVE_UP_SECONDS[f.species] ?? 15;
    }
    return f;
  }

  f.value = Math.max(0, f.value - FATIGUE_DECAY * step);
  return f;
}





export function fatigueFraction(f) {
  return Math.min(1, f.value / GIVE_UP_AT);
}



export function pursuitRange(species) {
  return GIVE_UP_AT * (METRES_PER_POINT[species] ?? METRES_PER_POINT.cow);
}
