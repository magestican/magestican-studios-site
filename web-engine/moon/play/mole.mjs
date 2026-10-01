


































const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smoothstep = (t) => t * t * (3 - 2 * t);

export const MOLE = Object.freeze({
  
  speedMps: 0.55,
  
  
  
  moundEveryM: 0.45,
  
  
  trailFadeS: 5,
  
  
  moundPopS: 0.2,
  
  
  
  
  
  
  moundM: 0.55,
  moundH: 0.22,
  trailMoundM: 0.46,
  trailMoundH: 0.15,
  
  
  noticeM: 1.6,
  settleS: 0.6,
  
  
  turnRadPerS: 0.7,
  lookaheadM: 0.18,
  
  surfaceS: 0.5,
  
  
  maxDtS: 0.1,
});


export const trailLengthM = () => MOLE.speedMps * MOLE.trailFadeS;








export const trailMounds = () => Math.floor(trailLengthM() / MOLE.moundEveryM);







export const trailLongestM = () => trailLengthM() + MOLE.moundEveryM + MOLE.speedMps * MOLE.maxDtS;





export function wanderTurn(seed, t) {
  const s = (seed % 97) * 0.613;
  const a = Math.sin(t * 0.37 + s * 1.7) + 0.6 * Math.sin(t * 0.91 + s * 0.3) + 0.35 * Math.sin(t * 1.9 - s * 2.1);
  return clamp(a / 1.95, -1, 1);
}





export function moundRise(age) {
  if (!(age > 0) || age >= MOLE.trailFadeS) return 0;
  const up = Math.min(1, age / MOLE.moundPopS);
  return up * smoothstep(1 - age / MOLE.trailFadeS);
}

export function createMole({ seed = 1, x = 0, z = 0, heading = 0 } = {}) {
  return {
    seed: Math.max(1, Math.floor(seed)),
    x, z, heading,
    t: 0,              
    speed: 0,          
    sinceMound: 0,     
    travelled: 0,      
    still: 0,          
    up: 0,             
    wantUp: 0,
    mounds: [],        
  };
}


export function surfaceMole(mole, up) {
  mole.wantUp = up ? 1 : 0;
  return mole;
}


const allowed = (inside, x, z) => (typeof inside === 'function' ? Boolean(inside(x, z)) : true);







export function headingToward(mole, want, inside) {
  for (let i = 0; i < 24; i++) {
    const off = Math.ceil(i / 2) * (Math.PI / 12) * (i % 2 === 0 ? 1 : -1);
    const a = want + off;
    const nx = mole.x + Math.sin(a) * MOLE.lookaheadM;
    const nz = mole.z + Math.cos(a) * MOLE.lookaheadM;
    if (allowed(inside, nx, nz)) return a;
  }
  return null;
}






export function stepMole(mole, dt, { inside = null, player = null } = {}) {
  const step = clamp(dt, 0, MOLE.maxDtS);
  if (step <= 0) return mole.mounds;
  mole.t += step;

  
  const toward = (v, want, s) => (want > v ? Math.min(want, v + step / s) : Math.max(want, v - step / s));
  mole.up = toward(mole.up, mole.wantUp, MOLE.surfaceS);

  const near = player && Math.hypot(player.x - mole.x, player.z - mole.z) <= MOLE.noticeM;
  mole.still = toward(mole.still, near || mole.wantUp ? 1 : 0, MOLE.settleS);

  const want = mole.heading + wanderTurn(mole.seed, mole.t) * MOLE.turnRadPerS * step;
  const heading = headingToward(mole, want, inside);
  mole.heading = heading === null ? mole.heading + Math.PI : heading;

  const target = MOLE.speedMps * (1 - smoothstep(mole.still));
  mole.speed += (target - mole.speed) * Math.min(1, step / MOLE.settleS);
  const move = heading === null ? 0 : mole.speed * step;
  if (move > 0) {
    const nx = mole.x + Math.sin(mole.heading) * move;
    const nz = mole.z + Math.cos(mole.heading) * move;
    if (allowed(inside, nx, nz)) {
      mole.x = nx;
      mole.z = nz;
      mole.travelled += move;
      mole.sinceMound += move;
    }
  }

  for (const m of mole.mounds) m.age += step;
  while (mole.mounds.length && mole.mounds[0].age >= MOLE.trailFadeS) mole.mounds.shift();
  
  
  
  while (mole.sinceMound >= MOLE.moundEveryM) {
    mole.sinceMound -= MOLE.moundEveryM;
    const back = MOLE.moundEveryM;
    mole.mounds.push({
      x: mole.x - Math.sin(mole.heading) * back,
      z: mole.z - Math.cos(mole.heading) * back,
      age: 0,
    });
  }
  return mole.mounds;
}


export function moleView(mole) {
  return {
    x: mole.x,
    z: mole.z,
    heading: ((mole.heading % TAU) + TAU) % TAU,
    speed: mole.speed,
    still: mole.still,
    up: mole.up,
    travelled: mole.travelled,
    mounds: mole.mounds.map((m) => ({ x: m.x, z: m.z, age: m.age, rise: moundRise(m.age) })),
  };
}
