
































export const TIMING = Object.freeze({
  
  
  
  alert: 0.55,
  windup: 0.34,
  strike: 0.13,
  recover: 0.62,
});

export const RANGE = Object.freeze({
  wake: 15,        
  lunge: 2.1,      
  contact: 0.95,   
});

export const SPEED = Object.freeze({
  stalk: 6.2,      
  strike: 11.5,    
  drift: 0.55,     
});

export function emptyChickenAnim(seed = 0) {
  return {
    state: 'dormant',
    t: 0,
    gait: seed % 1,      
    seed,                
  };
}











export function stepChicken(a, dt, dist, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  const R = { ...RANGE, ...(opt.range || {}) };
  const S = { ...SPEED, ...(opt.speed || {}) };

  const n = { ...a, t: a.t + dt };
  let event = null;
  let speed = 0;
  let canLatch = false;
  let vulnerable = false;

  switch (a.state) {
    case 'dormant':
      speed = 0;
      if (dist <= R.wake) { n.state = 'alert'; n.t = 0; event = 'alert'; }
      break;

    case 'alert':
      
      
      
      speed = 0;
      if (n.t >= T.alert) { n.state = 'stalk'; n.t = 0; }
      break;

    case 'stalk':
      speed = S.stalk;
      if (dist <= R.lunge) { n.state = 'windup'; n.t = 0; event = 'windup'; }
      break;

    case 'windup':
      
      
      speed = -1.1;
      if (n.t >= T.windup) { n.state = 'strike'; n.t = 0; event = 'strike'; }
      break;

    case 'strike':
      speed = S.strike;
      canLatch = dist <= R.contact;
      if (n.t >= T.strike) { n.state = 'recover'; n.t = 0; event = 'recover'; }
      break;

    case 'recover':
      
      speed = 0;
      vulnerable = true;
      if (n.t >= T.recover) { n.state = dist <= R.lunge ? 'windup' : 'stalk'; n.t = 0; }
      break;

    case 'latched':
    default:
      speed = 0;
      break;
  }

  
  
  n.gait = (a.gait + Math.abs(speed) * dt * 1.35) % 1;
  return { anim: n, speed, canLatch, vulnerable, event };
}

const TAU = Math.PI * 2;


















export function chickenPose(a, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  const p = a.gait * TAU;
  const s = a.state;

  
  const k = (dur) => Math.min(1, a.t / dur);

  let torsoPitch = 0.12;      
  let bodyLift = 0;
  let bodyRoll = 0;
  let headThrust = 0;
  let headPitch = 0;
  let wingFlap = 0;
  let tailFlick = 0;
  let legAmp = 0;

  if (s === 'stalk') {
    legAmp = 1;
    torsoPitch = 0.34;                       
    bodyLift = Math.abs(Math.sin(p)) * 0.055;
    bodyRoll = Math.sin(p) * 0.10;           
    wingFlap = Math.abs(Math.sin(p)) * 0.22; 
    tailFlick = Math.sin(p * 2) * 0.10;
  } else if (s === 'alert') {
    
    const u = k(T.alert);
    torsoPitch = 0.12 - 0.42 * Math.sin(u * Math.PI * 0.5);
    bodyLift = 0.045 * Math.sin(u * Math.PI * 0.5);
    wingFlap = 0.85 * Math.sin(u * Math.PI);
    tailFlick = 0.4 * u;
    headPitch = -0.3 * u;
  } else if (s === 'windup') {
    
    const u = k(T.windup);
    const e = u * u;                          
    torsoPitch = 0.34 - 0.55 * e;
    bodyLift = -0.06 * e;
    headThrust = -0.11 * e;
    wingFlap = 0.35 + 0.5 * e;
    tailFlick = 0.55 * e;
  } else if (s === 'strike') {
    
    const u = k(T.strike);
    torsoPitch = -0.21 + 1.25 * u;
    bodyLift = 0.16 * Math.sin(u * Math.PI);
    headThrust = -0.11 + 0.30 * u;            
    wingFlap = 1.15;
    tailFlick = -0.35;
    legAmp = 0.35;
  } else if (s === 'recover') {
    
    const u = k(T.recover);
    const wob = Math.exp(-u * 4.5) * Math.sin(u * 26);
    torsoPitch = 1.04 * Math.exp(-u * 3.2) + 0.12;
    bodyLift = -0.05 * Math.exp(-u * 3.0);
    bodyRoll = wob * 0.42;
    wingFlap = 1.0 * Math.exp(-u * 2.2);
    headPitch = wob * 0.5;
    tailFlick = wob * 0.3;
  } else if (s === 'latched') {
    
    torsoPitch = 0.6;
    wingFlap = 0.6 + 0.5 * Math.sin(a.t * 34);
    headThrust = 0.05 * Math.sin(a.t * 22);
    headPitch = 0.25 * Math.sin(a.t * 19);
  } else {
    
    const q = a.t * 0.9 + a.seed;
    torsoPitch = 0.12 + 0.30 * Math.max(0, Math.sin(q * 0.7));
    bodyLift = 0.008 * Math.sin(q * 1.7);
    bodyRoll = 0.05 * Math.sin(q * 0.5);
    headPitch = 0.5 * Math.max(0, Math.sin(q * 0.7));
    tailFlick = 0.06 * Math.sin(q * 2.3);
  }

  
  
  const legOf = (offset) => {
    const ph = (a.gait + offset) % 1;
    const swing = Math.sin(ph * TAU) * 0.85 * legAmp;
    
    
    const lift = ph < 0.5 ? Math.sin(ph * TAU) * 0.085 * legAmp : 0;
    return { swing, lift, fold: Math.max(0, Math.sin(ph * TAU)) * 0.6 * legAmp };
  };

  
  
  
  const headBob = -bodyLift * 0.78 + Math.sin((a.gait - 0.125) * TAU) * 0.012 * legAmp;

  return {
    torsoPitch,
    bodyLift,
    bodyRoll,
    headThrust,
    headPitch,
    headBob,
    wingFlap,
    tailFlick,
    legL: legOf(0),
    legR: legOf(0.5),
    
    
    
    
    
    
    
    mutantLag: Math.sin((a.gait - 0.22) * TAU) * (0.5 + legAmp * 0.9)
      + wingFlap * 0.4,
  };
}
