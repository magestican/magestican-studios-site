












































import { SeededRng } from '../../../../web-engine/rng/seededRng.js';








export const FIELD = Object.freeze({
  halfExtentXZ: 22,     
  top: 20,              
  topJitter: 6,         
  groundY: 1.0,         
});






export const EYE = Object.freeze({ offsetY: 0.55, holdOut: 1.5 });



export const TOTAL_FLAKES = 1500;








export const RIDGE_AXIS = Object.freeze({ x: 1, z: 0 });

export const WIND = Object.freeze({
  dir: Object.freeze({ x: 0, z: 1 }),
  
  
  
  
  base: 1.7,
  
  
  
  
  gustAmp: 1.15, gustPeriodS: 9.3,
  gust2Amp: 0.45, gust2PeriodS: 3.7,
  
  
  minSpeed: 0.1,
  
  
  crossAmp: 0.4, crossPeriodS: 14.1,
});

















































export const FLAKE_CLASSES = Object.freeze([
  Object.freeze({
    name: 'fine',
    share: 0.46,
    size: 0.070,
    fall: Object.freeze([1.5, 2.3]),
    windGain: 1.4,
    spin: Object.freeze([0.30, 0.70]),   
    swayAmp: 0.55, swayRate: Object.freeze([0.8, 1.6]),
    tones: Object.freeze({ crest: '#f2f8ff', body: '#dbe8f8', shade: '#b9d1e8' }),
    opacity: 0.70,
  }),
  Object.freeze({
    name: 'mid',
    share: 0.35,
    size: 0.120,
    fall: Object.freeze([2.4, 3.4]),
    windGain: 1.0,
    spin: Object.freeze([0.18, 0.42]),
    swayAmp: 0.30, swayRate: Object.freeze([0.6, 1.1]),
    tones: Object.freeze({ crest: '#f8fcff', body: '#dceafa', shade: '#adc9e4' }),
    opacity: 0.88,
  }),
  Object.freeze({
    name: 'fat',
    share: 0.19,
    size: 0.170,
    fall: Object.freeze([3.6, 5.0]),
    windGain: 0.68,
    spin: Object.freeze([0.08, 0.22]),
    swayAmp: 0.14, swayRate: Object.freeze([0.4, 0.8]),
    tones: Object.freeze({ crest: '#fdfeff', body: '#d8e7f8', shade: '#9dbcda' }),
    opacity: 0.97,
  }),
]);



export function classCounts(total = TOTAL_FLAKES) {
  const out = FLAKE_CLASSES.map((c) => Math.floor(total * c.share));
  out[out.length - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}




export function windAt(t) {
  const gust = WIND.base
    + Math.sin((t / WIND.gustPeriodS) * Math.PI * 2) * WIND.gustAmp
    + Math.sin((t / WIND.gust2PeriodS) * Math.PI * 2 + 1.7) * WIND.gust2Amp;
  const speed = Math.max(WIND.minSpeed, gust);
  const cross = Math.sin((t / WIND.crossPeriodS) * Math.PI * 2) * WIND.crossAmp;
  
  return {
    x: WIND.dir.x * speed + -WIND.dir.z * cross,
    z: WIND.dir.z * speed + WIND.dir.x * cross,
  };
}




export function makeField(seed = 0x5106f, total = TOTAL_FLAKES) {
  const counts = classCounts(total);
  const rng = new SeededRng((seed >>> 0) || 1);
  const flakes = [];
  for (let ci = 0; ci < FLAKE_CLASSES.length; ci++) {
    const cls = FLAKE_CLASSES[ci];
    const r = rng.child(cls.name);
    for (let i = 0; i < counts[ci]; i++) {
      flakes.push({
        cls: ci, slot: i,
        x: (r.next() * 2 - 1) * FIELD.halfExtentXZ,
        y: FIELD.groundY + r.next() * (FIELD.top - FIELD.groundY),
        z: (r.next() * 2 - 1) * FIELD.halfExtentXZ,
        fall: cls.fall[0] + r.next() * (cls.fall[1] - cls.fall[0]),
        
        
        
        rx: r.next() * Math.PI * 2, ry: r.next() * Math.PI * 2, rz: r.next() * Math.PI * 2,
        sx: spinRate(r, cls), sy: spinRate(r, cls), sz: spinRate(r, cls),
        swayPhase: r.next() * Math.PI * 2,
        swayRate: cls.swayRate[0] + r.next() * (cls.swayRate[1] - cls.swayRate[0]),
      });
    }
  }
  return flakes;
}

function spinRate(r, cls) {
  const mag = cls.spin[0] + r.next() * (cls.spin[1] - cls.spin[0]);
  return r.next() < 0.5 ? -mag : mag;
}















export function stepFlake(f, dt, t, px = 0, pz = 0, rand = Math.random, solidAt = null) {
  const cls = FLAKE_CLASSES[f.cls];
  const wind = windAt(t);
  const sway = Math.sin(t * f.swayRate + f.swayPhase) * cls.swayAmp;

  f.y -= f.fall * dt;
  f.x += (wind.x * cls.windGain + -WIND.dir.z * sway) * dt;
  f.z += (wind.z * cls.windGain + WIND.dir.x * sway) * dt;

  f.rx += f.sx * dt; f.ry += f.sy * dt; f.rz += f.sz * dt;

  
  
  if (f.y <= FIELD.groundY
      || (solidAt && solidAt(Math.floor(f.x), Math.floor(f.y), Math.floor(f.z)))) {
    f.y = FIELD.top + rand() * FIELD.topJitter;
    f.x = px + (rand() * 2 - 1) * FIELD.halfExtentXZ;
    f.z = pz + (rand() * 2 - 1) * FIELD.halfExtentXZ;
    return f;
  }

  
  const span = FIELD.halfExtentXZ * 2;
  while (f.x - px > FIELD.halfExtentXZ) f.x -= span;
  while (px - f.x > FIELD.halfExtentXZ) f.x += span;
  while (f.z - pz > FIELD.halfExtentXZ) f.z -= span;
  while (pz - f.z > FIELD.halfExtentXZ) f.z += span;
  return f;
}
