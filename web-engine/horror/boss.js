






























import { createFatigue, tickFatigue, fatigueFraction } from './chaseFatigue.js';

export const ARENA = Object.freeze({
  
  
  
  
  
  
  
  
  width: 5.2,
  length: 62,
  height: 4.6,          
  
  
  
  
  boulderAt: 0.62,
  boulderHeight: 4.2,
  
  
  
  crushRadius: 3.2,
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  pillarR: 0.55,
  
  
  
  
  pillarInset: 1.75,
  pillarEvery: 11,
});








export function pillars() {
  const out = [];
  let i = 0;
  for (let z = ARENA.pillarEvery; z < ARENA.length - 6; z += ARENA.pillarEvery) {
    const side = i % 2 === 0 ? 1 : -1;
    out.push({ x: side * (ARENA.width / 2 - ARENA.pillarInset), z, r: ARENA.pillarR });
    i += 1;
  }
  return out;
}

export const HORSE = Object.freeze({
  
  
  
  
  speed: 4.6,
  
  
  
  
  
  
  metresPerPoint: 2.6,
  
  
  
  giveUpSeconds: 9,
  
  
  rewind: 16,
});

export function createBossFight() {
  return {
    
    
    
    fatigue: createFatigue('horse', {
      metresPerPoint: HORSE.metresPerPoint,
      giveUpSeconds: HORSE.giveUpSeconds,
    }),
    
    boulder: 'hung',
    boulderT: 0,
    dead: false,
    
    event: null,
  };
}













export function stepBossFight(f, dt, { dist = 99, metres = 0, toBoulder = 99 } = {}) {
  const n = {
    ...f,
    fatigue: { ...f.fatigue },
    event: null,
  };

  if (n.dead) return { fight: n, speed: 0, blown: true, canDrop: false };

  
  if (n.boulder === 'falling') {
    n.boulderT += dt;
    if (n.boulderT >= 0.42) {
      
      
      
      
      n.boulder = 'landed';
      n.boulderT = 0;
      
      
      
      
      
      
      
      
      
      
      if (n.fatigue.gaveUp && toBoulder <= ARENA.crushRadius) {
        n.dead = true;
        n.event = 'crushed';
      } else {
        n.event = 'missed';
      }
    }
    return { fight: n, speed: 0, blown: n.fatigue.gaveUp, canDrop: false };
  }
  if (n.boulder === 'landed') {
    n.boulderT += dt;
    if (!n.dead && n.boulderT >= 1.4) { n.boulder = 'rewinding'; n.boulderT = 0; }
  } else if (n.boulder === 'rewinding') {
    n.boulderT += dt;
    if (n.boulderT >= HORSE.rewind) { n.boulder = 'hung'; n.boulderT = 0; n.event = 'rewound'; }
  }

  
  const wasBlown = n.fatigue.gaveUp;
  n.fatigue = tickFatigue(n.fatigue, dt, { pursuing: true, metres });
  if (!wasBlown && n.fatigue.gaveUp) n.event = 'blown';
  if (wasBlown && !n.fatigue.gaveUp) n.event = 'recovered';

  const blown = n.fatigue.gaveUp;
  return {
    fight: n,
    speed: blown ? 0 : HORSE.speed,
    blown,
    
    
    canDrop: blown && n.boulder === 'hung' && toBoulder <= ARENA.crushRadius,
    exhaustion: fatigueFraction(n.fatigue),
    dist,
  };
}









export function cutCable(f) {
  if (f.boulder !== 'hung' || f.dead) return f;
  return { ...f, boulder: 'falling', boulderT: 0, event: 'cut' };
}


export function boulderPoint(z0, z1) {
  return z0 + (z1 - z0) * ARENA.boulderAt;
}












export function bossLevel() {
  const runs = [{
    axis: 'z', x0: 0, z0: 0, x1: 0, z1: ARENA.length, w: ARENA.width,
  }];
  
  
  
  
  
  
  const BAY = { w: 3.0, d: 3.4 };
  const bays = [
    {
      kind: 'arrival',
      x0: ARENA.width / 2, x1: ARENA.width / 2 + BAY.d,
      z0: 5 - BAY.w / 2, z1: 5 + BAY.w / 2,
      side: 1,
      car: { x: ARENA.width / 2 + BAY.d / 2, z: 5, face: { x: -1, z: 0 } },
    },
    {
      kind: 'departure',
      x0: -BAY.w / 2, x1: BAY.w / 2,
      z0: ARENA.length, z1: ARENA.length + BAY.d,
      side: 0,
      car: { x: 0, z: ARENA.length + BAY.d / 2, face: { x: 0, z: -1 } },
    },
  ];
  return {
    seed: 'boss',
    boss: true,
    runs,
    rooms: [],
    bays,
    start: { x: 0, z: 5 },
    
    exit: { x: 0, z: ARENA.length - 0.4 },
    width: ARENA.width,
    height: ARENA.height,
    length: ARENA.length,
    boulder: { x: 0, z: boulderPoint(0, ARENA.length), y: ARENA.boulderHeight },
  };
}
