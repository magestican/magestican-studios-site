
































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
    
    
    
    staggerT: 0,
    staggerAmt: 0,
    staggerDir: 0,
  };
}


export const STAGGER = Object.freeze({
  seconds: 0.25,   
  shove: 0.17,     
});
















export function staggerHit(a, amount = 0.35, dir = Math.PI) {
  return {
    ...a,
    staggerT: 1,
    
    staggerAmt: Math.max(amount, (a.staggerT || 0) * (a.staggerAmt || 0)),
    staggerDir: dir,
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
      
      
      
      
      
      
      
      
      
      
      
      if (!opt.giveUp && dist <= R.wake) { n.state = 'alert'; n.t = 0; event = 'alert'; }
      break;

    case 'alert':
      
      
      
      speed = 0;
      if (opt.giveUp) { n.state = 'dormant'; n.t = 0; event = 'giveup'; }
      else if (n.t >= T.alert) { n.state = 'stalk'; n.t = 0; }
      break;

    case 'stalk':
      speed = S.stalk;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (opt.giveUp) { n.state = 'dormant'; n.t = 0; event = 'giveup'; }
      else if (dist <= R.lunge) { n.state = 'windup'; n.t = 0; event = 'windup'; }
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
      
      
      
      if (n.t >= T.recover) {
        if (opt.giveUp) { n.state = 'dormant'; n.t = 0; event = 'giveup'; }
        else { n.state = dist <= R.lunge ? 'windup' : 'stalk'; n.t = 0; }
      }
      break;

    case 'latched':
    default:
      speed = 0;
      break;
  }

  
  
  
  n.staggerT = Math.max(0, (a.staggerT || 0) - dt / STAGGER.seconds);

  
  
  
  
  
  
  
  
  const hop = (opt.legsLost || 0) === 1 ? 1.8 : 1;
  n.gait = (a.gait + Math.abs(speed) * dt * 1.35 * hop) % 1;
  return { anim: n, speed, canLatch, vulnerable, event };
}

const TAU = Math.PI * 2;


















export function chickenPose(a, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  
  
  
  
  
  
  
  
  
  
  
  
  const B = {
    pitch: 1, lift: 1, base: 0,
    
    attack: 'lunge',
    
    
    hand: a.seed < 0.5 ? 1 : -1,
    ...(opt.pose || {}),
  };
  const p = a.gait * TAU;
  const s = a.state;

  
  const k = (dur) => Math.min(1, a.t / dur);

  let torsoPitch = 0.12;      
  let bodyLift = 0;
  let bodyRoll = 0;
  let headThrust = 0;
  let headPitch = 0;
  let headYaw = 0;
  let wingFlap = 0;
  let tailFlick = 0;
  let legAmp = 0;
  let breath = 0;             

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
    
    
    
    
    
    
    
    
    
    
    
    
    const sd = ((a.seed % 1) + 1) % 1;
    const rate = 0.72 + sd * 0.6;             
    const q = a.t * rate + sd * 41.7;
    
    breath = 0.013 + 0.011 * Math.sin(q * 1.8);
    bodyLift = 0.010 * Math.sin(q * 1.8);
    bodyRoll = 0.05 * Math.sin(q * 0.5);
    
    const peck = Math.max(0, Math.sin(q * 0.7));
    torsoPitch = 0.12 + 0.28 * peck;
    headPitch = 0.55 * peck * Math.max(0.25, Math.sin(q * 6.3));
    
    
    
    headYaw = 0.45 * Math.tanh(3 * Math.sin(q * 0.19 + 2.1)) * (1 - peck);
    tailFlick = 0.06 * Math.sin(q * 2.3);
  }

  
  
  
  
  
  
  
  let shoveX = 0;
  let shoveY = 0;
  const sT = a.staggerT || 0;
  if (sT > 0) {
    const e = sT * sT * (a.staggerAmt || 0);  
    const d = a.staggerDir || 0;              
    shoveX = Math.cos(d) * STAGGER.shove * e; 
    shoveY = Math.sin(d) * STAGGER.shove * e; 
    torsoPitch += Math.cos(d) * 0.34 * e;     
    bodyRoll += Math.sin(d) * 0.62 * e;       
    bodyLift -= 0.035 * e;                    
    headPitch += Math.cos(d) * 0.30 * e;      
    wingFlap += 0.25 * e;                     
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const sevL = !!(opt.severed && opt.severed.legL);
  const sevR = !!(opt.severed && opt.severed.legR);
  const legsLost = (sevL ? 1 : 0) + (sevR ? 1 : 0);
  if (legsLost === 1) {
    const missSide = sevL ? -1 : 1;
    const beat = Math.max(0, Math.sin(p + (sevL ? 0 : Math.PI)));
    bodyRoll += missSide * (0.16 + 0.11 * Math.sin(p)) * Math.max(0.35, legAmp);
    bodyLift -= 0.055 * beat * legAmp;        
    torsoPitch += 0.07;                       
  } else if (legsLost >= 2) {
    torsoPitch += 0.60;                       
    bodyLift = -0.10;                         
    bodyRoll *= 0.3;
    headPitch -= 0.35;                        
    legAmp = 0;                               
  }

  
  
  const legOf = (offset) => {
    const ph = (a.gait + offset) % 1;
    const swing = Math.sin(ph * TAU) * 0.85 * legAmp;
    
    
    const lift = ph < 0.5 ? Math.sin(ph * TAU) * 0.085 * legAmp : 0;
    return { swing, lift, fold: Math.max(0, Math.sin(ph * TAU)) * 0.6 * legAmp };
  };

  
  
  
  
  
  const TRAIL = Object.freeze({ swing: -0.5, lift: 0, fold: 0.85 });
  let legL = sevL ? { ...TRAIL } : legOf(0);
  let legR = sevR ? { ...TRAIL } : legOf(0.5);
  if (legsLost >= 2) { legL = { ...TRAIL }; legR = { ...TRAIL }; }
  else if (legsLost === 1) {
    const keep = sevL ? legR : legL;
    keep.swing *= 0.55;
    keep.fold *= 0.8;
    keep.lift *= 1.2;
  }

  
  
  
  const headBob = -bodyLift * 0.78 + Math.sin((a.gait - 0.125) * TAU) * 0.012 * legAmp;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let swing = 0;
  if (B.attack === 'sweep') {
    if (s === 'windup') {
      
      
      swing = -B.hand * k(T.windup) ** 1.5;
    } else if (s === 'strike') {
      
      
      swing = B.hand * (-1 + 2.35 * k(T.strike));
    } else if (s === 'recover') {
      swing = B.hand * 1.35 * Math.exp(-k(T.recover) * 3.4);
    }
  }

  return {
    swing,
    torsoPitch: B.base + torsoPitch * B.pitch,
    bodyLift: bodyLift * B.lift,
    bodyRoll: bodyRoll * B.pitch,
    headThrust,
    headPitch,
    headYaw,
    headBob,
    wingFlap,
    tailFlick,
    breath,
    
    
    
    shoveX: shoveX * B.lift,
    shoveY: shoveY * B.lift,
    legL,
    legR,
    
    
    
    
    
    
    
    mutantLag: Math.sin((a.gait - 0.22) * TAU) * (0.5 + legAmp * 0.9)
      + wingFlap * 0.4,
  };
}




















export const PORKER = Object.freeze({
  timing: { alert: 0.9, windup: 0.58, strike: 0.20, recover: 0.92 },
  
  
  
  pose: { pitch: 0.42, lift: 0.55, base: 0.52 },
  
  
  
  range: { wake: 19, lunge: 2.9, contact: 1.45 },
  speed: { stalk: 2.15, strike: 6.4, drift: 0.3 },
});
























export const COW = Object.freeze({
  timing: { alert: 1.2, windup: 0.70, strike: 0.28, recover: 1.15 },
  range: { wake: 22, lunge: 3.4, contact: 1.9 },
  speed: { stalk: 1.7, strike: 5.0, drift: 0.25 },
  
  
  
  
  pose: { pitch: 0.34, lift: 0.40, base: -0.30, attack: 'sweep' },
});





















export const GALLOP = Object.freeze({
  stride: 2.6,        
  strideTired: 1.7,   
  
  
  
  
  
  
  beats: Object.freeze({ legHL: 0.0, legHR: 0.12, legFL: 0.28, legFR: 0.40 }),
  air: 0.68,          
  airLen: 0.26,       
});







export function stepHorseGait(gait, dt, speed, tired = 0) {
  const k = Math.min(1, Math.max(0, tired));
  const stride = GALLOP.stride + (GALLOP.strideTired - GALLOP.stride) * k;
  return ((gait || 0) + (Math.abs(speed) * dt) / stride) % 1;
}
















export function horsePose(gait, speedFrac, tired = 0) {
  const v = Math.min(1, Math.max(0, speedFrac));
  const k = Math.min(1, Math.max(0, tired));
  const p = (gait || 0) * TAU;

  
  const amp = (0.55 + 0.35 * v) * v * (1 - 0.38 * k);
  const legAt = (ph, hind) => {
    const c = ((gait || 0) + 1 - ph) % 1;
    return {
      
      swing: Math.sin(c * TAU) * amp * (hind ? 1.12 : 0.92),
      lift: Math.max(0, Math.sin(c * TAU)) * (0.085 + 0.03 * v) * v,
    };
  };

  
  
  const ac = (((gait || 0) - GALLOP.air + 1) % 1) / GALLOP.airLen;
  const air = (ac < 1 ? Math.sin(ac * Math.PI) : 0)
    * Math.max(0, (v - 0.55) / 0.45) * (1 - k);

  
  
  
  const bodyPitch = Math.sin(p + 0.6) * (0.085 + 0.045 * v) * v
    + k * 0.05 * Math.sin(p * 2) * v;

  return {
    bodyPitch,
    bodyLift: Math.abs(Math.sin(p)) * 0.022 * v + air * 0.075,
    bodyRoll: Math.sin(p + 1.1) * (0.03 + 0.09 * k) * v,
    
    
    
    neckPump: -Math.sin(p + 0.6) * (0.16 + 0.10 * v) * v * (1 - 0.35 * k)
      + k * 0.10,
    legFL: legAt(GALLOP.beats.legFL, false),
    legFR: legAt(GALLOP.beats.legFR, false),
    legHL: legAt(GALLOP.beats.legHL, true),
    legHR: legAt(GALLOP.beats.legHR, true),
    tailSwish: Math.sin(p + 2.0) * 0.28 * v,
    air,
  };
}










export function deathTwitch(u, seed = 0) {
  const sd = ((seed % 1) + 1) % 1;
  const env = Math.exp(-u * 4.2);
  const rate = 18 + ((sd * 131) % 1) * 22;
  const amp = 0.45 + ((sd * 53) % 1) * 0.6;
  return {
    
    side: ((sd * 7919) % 1) < 0.5 ? -1 : 1,
    legKick: env * Math.max(0, Math.sin(u * rate + sd * 9)) * amp,
    wingSpasm: env * Math.sin(u * rate * 0.66 + sd * 17) * 0.5 * amp,
  };
}
