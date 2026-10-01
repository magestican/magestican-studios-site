














































import { BESTIARY, DRAG_SPEED } from './dismemberment.js';

export const HEIGHT_M = Object.freeze({
  chicken: BESTIARY.chicken.height,   
  porker: BESTIARY.porker.height,     
  cow: BESTIARY.cow.height,           
});

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
    
    hitStopT: 0,         
    slowT: 0,            
    interruptGuardT: 0,  
    dying: false,        
    bleedLeft: 0,        
    react: null,         
  };
}











export const SHOVE_M = Object.freeze({
  chicken: 0.35,
  porker: 0.45,   
  cow: 0.30,
});






export const STAGGER = Object.freeze({
  seconds: 0.25,   
  shove: SHOVE_M.chicken / HEIGHT_M.chicken,
});


export const HIT = Object.freeze({
  
  
  
  stopSeconds: 0.045,
  
  
  stackAdd: 0.5,
  stackCap: 1.5,
  
  
  
  
  
  interruptGroups: Object.freeze(['torso', 'head']),
  interruptCooldown: 2.0,
  
  legSlow: Object.freeze({ seconds: 0.6, factor: 0.55 }),
  
  
  finishCrawler: 0.45,
});



export function limbGroupOf(limb = 'torso') {
  const s = String(limb);
  if (s === 'torso') return 'torso';
  if (s.startsWith('head')) return 'head';
  if (s.startsWith('leg')) return 'legs';
  if (s.startsWith('wing') || s.startsWith('arm') || s.startsWith('tentacle')) return 'arms';
  return s;
}





function kickStagger(a, amount, dir) {
  const carried = (a.staggerT || 0) * (a.staggerAmt || 0);
  const amt = Math.min(amount * HIT.stackCap, Math.max(amount, carried + amount * HIT.stackAdd));
  return { ...a, staggerT: 1, staggerAmt: amt, staggerDir: dir };
}























export function staggerHit(a, amount = 0.35, dir = Math.PI) {
  return kickStagger(a, amount, dir);
}






























export function hitReact(a, species = 'chicken', limb = 'torso', amount = 1, dir = Math.PI) {
  const group = limbGroupOf(limb);
  const n = kickStagger(a, amount, dir);
  n.hitStopT = HIT.stopSeconds;
  n.react = { species, group, limb, interrupted: false, slowed: false };
  if (group === 'legs') {
    n.slowT = HIT.legSlow.seconds;
    n.react.slowed = true;
  }
  if (a.state === 'windup' && HIT.interruptGroups.includes(group) && !((a.interruptGuardT || 0) > 0)) {
    n.state = 'recover';
    n.t = 0;
    n.interruptGuardT = HIT.interruptCooldown;
    n.react.interrupted = true;
  }
  if (a.dying && (a.bleedLeft || 0) > 0 && group !== 'legs') {
    n.bleedLeft = Math.min(a.bleedLeft, HIT.finishCrawler);
  }
  return n;
}
















export function startBleedOut(a, loco) {
  const secs = loco && Number.isFinite(loco.bleedOut) ? loco.bleedOut : 0;
  if (secs <= 0) return { ...a, dying: true, bleedLeft: 0, state: 'down', t: 0 };
  
  
  return { ...a, dying: true, bleedLeft: secs };
}











export function stepChicken(a, dt, dist, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  
  
  
  const L = opt.locomotion || null;
  const R = { ...RANGE, ...(opt.range || {}), ...((L && L.range) || {}) };
  const S = { ...SPEED, ...(opt.speed || {}) };

  
  
  
  
  if ((a.hitStopT || 0) > 0) {
    const n = { ...a, hitStopT: Math.max(0, a.hitStopT - dt), react: null };
    return {
      anim: n, speed: 0, canLatch: false, vulnerable: a.state === 'recover', event: null, frozen: true,
    };
  }

  const n = { ...a, t: a.t + dt, react: null };
  let event = null;
  let speed = 0;
  let canLatch = false;
  let vulnerable = false;

  
  
  
  if (a.dying && (a.bleedLeft || 0) > 0) {
    n.bleedLeft = Math.max(0, a.bleedLeft - dt);
    if (n.bleedLeft <= 0 && a.state !== 'down') {
      n.state = 'down';
      n.t = 0;
      n.staggerT = 0;
      n.slowT = 0;
      n.gait = a.gait;
      return { anim: n, speed: 0, canLatch: false, vulnerable: false, event: 'down' };
    }
  }

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

    case 'down':
      
      
      speed = 0;
      break;

    case 'latched':
    default:
      speed = 0;
      break;
  }

  
  
  
  n.staggerT = Math.max(0, (a.staggerT || 0) - dt / STAGGER.seconds);
  
  n.slowT = Math.max(0, (a.slowT || 0) - dt);
  n.interruptGuardT = Math.max(0, (a.interruptGuardT || 0) - dt);

  
  
  
  
  
  const base = speed;
  if (L) {
    if (a.state === 'strike') speed *= (L.lungeScale ?? L.speedScale ?? 1);
    else speed *= (L.speedScale ?? 1);
    if (L.canLatch === false) canLatch = false;
    
    
    
    
    if (L.surge && speed > 0) speed *= 1 + L.surge * Math.cos(a.gait * TAU * 2);
  }
  if (n.slowT > 0 && speed > 0) speed *= HIT.legSlow.factor;

  
  
  
  
  
  
  
  
  
  
  
  
  
  const hop = (opt.legsLost || 0) === 1 ? 1.8 : 1;
  const cpm = L ? (L.cyclesPerMetre ?? 1.35) : 1.35 * hop;
  const ground = L ? Math.abs(base) * (a.state === 'strike' ? (L.lungeScale ?? L.speedScale ?? 1) : (L.speedScale ?? 1)) : Math.abs(speed);
  n.gait = (a.gait + ground * dt * cpm) % 1;
  return { anim: n, speed, canLatch, vulnerable, event };
}

const TAU = Math.PI * 2;


















export function chickenPose(a, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  
  
  
  
  
  
  
  
  
  
  
  
  const B = {
    pitch: 1, lift: 1, base: 0,
    
    attack: 'lunge',
    
    
    hand: a.seed < 0.5 ? 1 : -1,
    
    
    shove: STAGGER.shove,
    ...(opt.pose || {}),
  };
  
  
  const species = opt.species || 'chicken';

  
  
  
  
  
  {
    const sevBoth = !!(opt.severed && opt.severed.legL && opt.severed.legR);
    const mode = (opt.locomotion && opt.locomotion.mode) || (sevBoth ? locomotion(species, 2).mode : 'walk');
    if (mode === 'crawl') return crawlPose(a, a.gait, opt);
    if (mode === 'drag') return dragPose(a, a.gait, opt);
    if (mode === 'down') return downPose(a, opt);
  }

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
  } else if (s === 'down') {
    
    
    torsoPitch = 0.75;
    bodyLift = -0.30;
    headPitch = 0.35;
    legAmp = 0;
  } else {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const idle = idlePose(a, species, a.t);
    breath = idle.breath;
    bodyLift = idle.bodyLift;
    bodyRoll = idle.bodyRoll;
    torsoPitch = idle.torsoPitch;
    headPitch = idle.headPitch;
    headYaw = idle.headYaw;
    headThrust = idle.headThrust;
    wingFlap = idle.wingFlap;
    tailFlick = idle.tailFlick;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  let shoveX = 0;
  let shoveY = 0;
  let sway = 0;
  let tentacleWhip = 0;
  const sT = a.staggerT || 0;
  if (sT > 0) {
    const e = sT * sT * (a.staggerAmt || 0);  
    const d = a.staggerDir || 0;              
    const f = flinchPose(species, e, d);
    shoveX = Math.cos(d) * B.shove * e;       
    shoveY = Math.sin(d) * B.shove * e;       
    torsoPitch += f.torsoPitch;
    bodyRoll += f.bodyRoll;
    bodyLift += f.bodyLift;
    headPitch += f.headPitch;
    headThrust += f.headThrust;
    wingFlap += f.wingFlap;
    tailFlick += f.tailFlick;
    sway = f.sway;
    tentacleWhip = f.tentacleWhip;
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
    
    
    
    
    
    shoveX,
    shoveY,
    
    
    
    sway,
    tentacleWhip,
    
    
    
    
    bodySquash: 1,
    crawl: false,
    legL,
    legR,
    
    
    
    
    
    
    
    mutantLag: Math.sin((a.gait - 0.22) * TAU) * (0.5 + legAmp * 0.9)
      + wingFlap * 0.4,
  };
}




















export const PORKER = Object.freeze({
  species: 'porker',
  timing: { alert: 0.9, windup: 0.58, strike: 0.20, recover: 0.92 },
  
  
  
  
  pose: { pitch: 0.42, lift: 0.55, base: 0.52, shove: SHOVE_M.porker / HEIGHT_M.porker },
  
  
  
  range: { wake: 19, lunge: 2.9, contact: 1.45 },
  speed: { stalk: 2.15, strike: 6.4, drift: 0.3 },
});
























export const COW = Object.freeze({
  species: 'cow',
  timing: { alert: 1.2, windup: 0.70, strike: 0.28, recover: 1.15 },
  range: { wake: 22, lunge: 3.4, contact: 1.9 },
  speed: { stalk: 1.7, strike: 5.0, drift: 0.25 },
  
  
  
  
  
  pose: { pitch: 0.34, lift: 0.40, base: -0.30, attack: 'sweep', shove: SHOVE_M.cow / HEIGHT_M.cow },
});




export const CHICKEN = Object.freeze({
  species: 'chicken',
  timing: TIMING,
  range: RANGE,
  speed: SPEED,
  pose: { pitch: 1, lift: 1, base: 0, shove: STAGGER.shove },
});

export const PROFILES = Object.freeze({ chicken: CHICKEN, porker: PORKER, cow: COW });































export const LOCOMOTION = Object.freeze({
  chicken: Object.freeze({
    walk: Object.freeze({ speedScale: 1, lungeScale: 1, heightScale: 1, cycleHz: 1.35 * SPEED.stalk, canLatch: true }),
    limp: Object.freeze({
      speedScale: DRAG_SPEED, lungeScale: DRAG_SPEED, heightScale: 0.93,
      cycleHz: 1.35 * 1.8 * DRAG_SPEED * SPEED.stalk, canLatch: true, asymmetric: true,
    }),
    crawl: Object.freeze({
      speedScale: DRAG_SPEED,                 
      lungeScale: 5.0 / SPEED.strike,         
      heightScale: 0.35,
      cycleHz: 2.0,                           
      canLatch: true,
      surge: 0.6,                             
      range: Object.freeze({ lunge: 1.4, contact: 0.7 }),
      bleedOut: 9,
    }),
  }),
  porker: Object.freeze({
    walk: Object.freeze({ speedScale: 1, lungeScale: 1, heightScale: 1, cycleHz: 1.35 * PORKER.speed.stalk, canLatch: true }),
    limp: Object.freeze({
      speedScale: 0.6, lungeScale: 0.6, heightScale: 0.95,
      cycleHz: 1.35 * 1.8 * 0.6 * PORKER.speed.stalk, canLatch: true, asymmetric: true,
    }),
    drag: Object.freeze({
      speedScale: 1.6 / PORKER.speed.stalk,   
      lungeScale: 3.0 / PORKER.speed.strike,  
      heightScale: 0.42,
      cycleHz: 1.4,
      canLatch: true,
      surge: 0.5,
      range: Object.freeze({ lunge: 2.0, contact: 1.1 }),
      bleedOut: 7,
    }),
  }),
  cow: Object.freeze({
    walk: Object.freeze({ speedScale: 1, lungeScale: 1, heightScale: 1, cycleHz: 1.35 * COW.speed.stalk, canLatch: true }),
    limp: Object.freeze({
      speedScale: DRAG_SPEED, lungeScale: 0, heightScale: 0.90,
      cycleHz: 1.35 * 1.8 * DRAG_SPEED * COW.speed.stalk, canLatch: true, asymmetric: true, canLunge: false,
    }),
    down: Object.freeze({ speedScale: 0, lungeScale: 0, heightScale: 0.25, cycleHz: 0, canLatch: false, bleedOut: 0 }),
  }),
});

const DOWN = Object.freeze({ speedScale: 0, lungeScale: 0, heightScale: 0.25, cycleHz: 0, canLatch: false, bleedOut: 0 });












export function locomotion(species = 'chicken', mobility = 0) {
  const legsLost = typeof mobility === 'number' ? mobility : ((mobility && mobility.legsLost) || 0);
  const table = LOCOMOTION[species] || LOCOMOTION.chicken;
  const prof = PROFILES[species] || CHICKEN;
  let mode = 'walk';
  if (legsLost >= 2) mode = table.crawl ? 'crawl' : (table.drag ? 'drag' : 'down');
  else if (legsLost === 1) mode = 'limp';
  const m = table[mode] || DOWN;
  const speedMps = m.speedScale * prof.speed.stalk;
  const lungeMps = (m.lungeScale ?? m.speedScale) * prof.speed.strike;
  return {
    mode,
    ...m,
    lungeScale: m.lungeScale ?? m.speedScale,
    bleedOut: m.bleedOut ?? 0,
    speedMps,
    lungeMps,
    cyclesPerMetre: m.cycleHz > 0 && speedMps > 0 ? m.cycleHz / speedMps : 0,
  };
}

























const TRAIL_LEG = Object.freeze({ swing: -0.5, lift: 0, fold: 0.85 });
const BODY_PIVOT_BU = Object.freeze({ chicken: 0.48, porker: 0.60, cow: 0.62 });


function wingStroke(ph) {
  const q = ((ph % 1) + 1) % 1;
  if (q < 0.35) {
    const u = q / 0.35;
    const e = 1 - (1 - u) * (1 - u);           
    return { reach: 0.9 - 1.4 * e, press: 1, spread: 0.15 };
  }
  const u = (q - 0.35) / 0.65;
  const e = u * u * (3 - 2 * u);               
  return { reach: -0.5 + 1.4 * e, press: 0, spread: 0.15 + 0.35 * Math.sin(u * Math.PI) };
}

export function crawlPose(a, phase = a.gait, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  const L = LOCOMOTION.chicken.crawl;
  const p = (((phase || 0) % 1) + 1) % 1;
  const s = a.state;
  const k = (dur) => Math.min(1, a.t / dur);
  const sd = ((a.seed % 1) + 1) % 1;

  
  
  let wingL = wingStroke(p);
  let wingR = wingStroke(p + 0.5);
  const pull = Math.max(wingL.press, wingR.press);

  
  let torsoPitch = 0.85;                                   
  let bodyLift = -(1 - L.heightScale) * BODY_PIVOT_BU.chicken;
  let bodyRoll = (wingL.press - wingR.press) * 0.14;       
  let bodySquash = 0.5;
  let headThrust = 0.13;                                   
  let headPitch = -0.55 + 0.06 * Math.sin(p * TAU * 2);   
  let headYaw = 0.10 * Math.sin(p * TAU + sd * 5);
  let tailFlick = 0.12 * Math.sin(p * TAU);
  let breath = 0.02 + 0.01 * Math.sin(a.t * 2.4 + sd * 9);
  let neckReach = 0.6 + 0.2 * pull;

  if (s === 'dormant') {
    
    
    wingL = { reach: 0.2, press: 1, spread: 0.3 };
    wingR = { reach: 0.2, press: 1, spread: 0.3 };
    bodyRoll = 0;
    breath = 0.03 + 0.015 * Math.sin(a.t * 3.1 + sd * 9);
  } else if (s === 'alert') {
    
    const u = k(T.alert);
    headPitch = -0.55 - 0.45 * Math.sin(u * Math.PI * 0.5);
    wingL = { reach: 0.4, press: 0, spread: 0.7 * u };
    wingR = { reach: 0.4, press: 0, spread: 0.7 * u };
    bodyRoll = 0;
    torsoPitch = 0.85 - 0.15 * u;
  } else if (s === 'windup') {
    
    const u = k(T.windup);
    const e = u * u;
    wingL = { reach: 0.9 + 0.3 * e, press: 0.5 + 0.5 * e, spread: 0.2 };
    wingR = { reach: 0.9 + 0.3 * e, press: 0.5 + 0.5 * e, spread: 0.2 };
    bodyRoll = 0;
    torsoPitch = 0.85 + 0.20 * e;
    headThrust = 0.13 - 0.10 * e;                          
    headPitch = -0.55 - 0.25 * e;
  } else if (s === 'strike') {
    
    
    const u = k(T.strike);
    wingL = { reach: 1.2 - 1.8 * u, press: 1, spread: 0.1 };
    wingR = { reach: 1.2 - 1.8 * u, press: 1, spread: 0.1 };
    bodyRoll = 0;
    bodyLift += 0.10 * Math.sin(u * Math.PI);
    torsoPitch = 1.05 - 0.75 * u;                          
    headThrust = 0.03 + 0.30 * u;
    headPitch = -0.80 + 0.30 * u;
    neckReach = 1;
  } else if (s === 'recover') {
    
    const u = k(T.recover);
    const wob = Math.exp(-u * 4.5) * Math.sin(u * 26);
    wingL = { reach: 0.2 + 0.4 * Math.exp(-u * 3), press: 0.4, spread: 0.8 * Math.exp(-u * 2) };
    wingR = { reach: 0.2 + 0.4 * Math.exp(-u * 3), press: 0.4, spread: 0.8 * Math.exp(-u * 2) };
    bodyRoll = wob * 0.3;
    torsoPitch = 0.85 + 0.25 * Math.exp(-u * 3.2);
    headPitch = -0.2 - 0.35 * (1 - Math.exp(-u * 3));
    headThrust = 0.13 - 0.08 * Math.exp(-u * 3);
  } else if (s === 'latched') {
    
    const f = a.t * 30;
    wingL = { reach: 0.3 + 0.5 * Math.sin(f), press: 1, spread: 0.3 };
    wingR = { reach: 0.3 + 0.5 * Math.sin(f + Math.PI), press: 1, spread: 0.3 };
    bodyRoll = 0.12 * Math.sin(f * 0.5);
    headThrust = 0.18 + 0.05 * Math.sin(a.t * 22);
    headPitch = -0.35 + 0.25 * Math.sin(a.t * 19);
  } else if (s === 'down') {
    wingL = { reach: 0.1, press: 0.6, spread: 0.6 };
    wingR = { reach: 0.1, press: 0.6, spread: 0.6 };
    bodyRoll = 0;
    headPitch = 0.30;                                      
    headThrust = 0.08;
    breath = 0;
    neckReach = 0.3;
  }

  
  let shoveX = 0;
  let shoveY = 0;
  let wingFlap = 0;
  const sT = a.staggerT || 0;
  if (sT > 0) {
    const e = sT * sT * (a.staggerAmt || 0);
    const d = a.staggerDir || 0;
    const f = flinchPose('chicken', e, d);
    shoveX = Math.cos(d) * STAGGER.shove * e;
    shoveY = Math.sin(d) * STAGGER.shove * e;
    torsoPitch += f.torsoPitch * 0.5;
    bodyRoll += f.bodyRoll;
    headPitch += f.headPitch;
    wingFlap += f.wingFlap;                                
  }

  return {
    crawl: true,
    swing: 0,
    torsoPitch,
    bodyLift,
    bodyRoll,
    bodySquash,
    headThrust,
    headPitch,
    headYaw,
    headBob: 0,
    neckReach,
    wingFlap,
    tailFlick,
    breath,
    shoveX,
    shoveY,
    sway: 0,
    tentacleWhip: 0,
    wingL,
    wingR,
    legL: { ...TRAIL_LEG },
    legR: { ...TRAIL_LEG },
    mutantLag: (wingL.reach - wingR.reach) * 0.4,
  };
}








export function dragPose(a, phase = a.gait, opt = {}) {
  const T = { ...TIMING, ...(opt.timing || {}) };
  const L = LOCOMOTION.porker.drag;
  const p = (((phase || 0) % 1) + 1) % 1;
  const s = a.state;
  const k = (dur) => Math.min(1, a.t / dur);
  const sd = ((a.seed % 1) + 1) % 1;
  const B = { shove: SHOVE_M.porker / HEIGHT_M.porker, ...(opt.pose || {}) };

  const armStroke = (ph) => {
    const w = wingStroke(ph);
    return { reach: w.reach * 1.3, press: w.press, spread: w.spread * 0.4 };
  };
  let armL = armStroke(p);
  let armR = armStroke(p + 0.5);
  const pull = Math.max(armL.press, armR.press);

  let torsoPitch = 1.25;                                    
  let bodyLift = -(1 - L.heightScale) * BODY_PIVOT_BU.porker;
  let bodyRoll = (armL.press - armR.press) * 0.10;
  let headThrust = 0.06;
  let headPitch = -0.90 + 0.05 * Math.sin(p * TAU * 2);    
  let headYaw = 0.08 * Math.sin(p * TAU + sd * 4);
  let breath = 0.025 + 0.012 * Math.sin(a.t * 2.1 + sd * 7);

  if (s === 'alert') {
    const u = k(T.alert);
    armL = { reach: 0.5, press: 1, spread: 0.2 };
    armR = { reach: 0.5, press: 1, spread: 0.2 };
    bodyRoll = 0;
    torsoPitch = 1.25 - 0.35 * u;                           
    headPitch = -0.9 - 0.3 * u;
  } else if (s === 'windup') {
    const u = k(T.windup);
    const e = u * u;
    armL = { reach: 1.2 + 0.3 * e, press: 0.6 + 0.4 * e, spread: 0.1 };
    armR = { reach: 1.2 + 0.3 * e, press: 0.6 + 0.4 * e, spread: 0.1 };
    bodyRoll = 0;
    torsoPitch = 1.25 + 0.15 * e;
    headThrust = 0.06 - 0.08 * e;
  } else if (s === 'strike') {
    const u = k(T.strike);
    armL = { reach: 1.5 - 2.0 * u, press: 1, spread: 0.05 };
    armR = { reach: 1.5 - 2.0 * u, press: 1, spread: 0.05 };
    bodyRoll = 0;
    bodyLift += 0.08 * Math.sin(u * Math.PI);
    torsoPitch = 1.40 - 0.60 * u;
    headThrust = 0.02 + 0.25 * u;
  } else if (s === 'recover') {
    const u = k(T.recover);
    const wob = Math.exp(-u * 4) * Math.sin(u * 20);
    armL = { reach: 0.3 + 0.5 * Math.exp(-u * 3), press: 0.5, spread: 0.5 * Math.exp(-u * 2) };
    armR = { reach: 0.3 + 0.5 * Math.exp(-u * 3), press: 0.5, spread: 0.5 * Math.exp(-u * 2) };
    bodyRoll = wob * 0.25;
    torsoPitch = 1.25 + 0.2 * Math.exp(-u * 3);
    headPitch = -0.5 - 0.4 * (1 - Math.exp(-u * 3));
  } else if (s === 'latched') {
    const f = a.t * 24;
    armL = { reach: 0.4 + 0.4 * Math.sin(f), press: 1, spread: 0.2 };
    armR = { reach: 0.4 + 0.4 * Math.sin(f + Math.PI), press: 1, spread: 0.2 };
    bodyRoll = 0.1 * Math.sin(f * 0.5);
    headPitch = -0.6 + 0.2 * Math.sin(a.t * 17);
  } else if (s === 'dormant') {
    armL = { reach: 0.3, press: 1, spread: 0.2 };
    armR = { reach: 0.3, press: 1, spread: 0.2 };
    bodyRoll = 0;
    breath = 0.035 + 0.015 * Math.sin(a.t * 2.8 + sd * 7);
  } else if (s === 'down') {
    armL = { reach: 0.2, press: 0.5, spread: 0.5 };
    armR = { reach: 0.2, press: 0.5, spread: 0.5 };
    bodyRoll = 0;
    headPitch = 0.2;
    breath = 0;
  }

  let shoveX = 0;
  let shoveY = 0;
  let wingFlap = 0;
  const sT = a.staggerT || 0;
  if (sT > 0) {
    const e = sT * sT * (a.staggerAmt || 0);
    const d = a.staggerDir || 0;
    const f = flinchPose('porker', e, d);
    shoveX = Math.cos(d) * B.shove * e;
    shoveY = Math.sin(d) * B.shove * e;
    torsoPitch += f.torsoPitch * 0.5;
    bodyRoll += f.bodyRoll;
    headPitch += f.headPitch;
    wingFlap += f.wingFlap;
  }

  return {
    crawl: true,
    swing: 0,
    torsoPitch,
    bodyLift,
    bodyRoll,
    bodySquash: 0.85,
    headThrust,
    headPitch,
    headYaw,
    headBob: 0,
    neckReach: 0.4 + 0.2 * pull,
    wingFlap,
    tailFlick: 0,
    breath,
    shoveX,
    shoveY,
    sway: 0,
    tentacleWhip: 0,
    armL,
    armR,
    
    wingL: armL,
    wingR: armR,
    legL: { ...TRAIL_LEG },
    legR: { ...TRAIL_LEG },
    mutantLag: (armL.reach - armR.reach) * 0.3,
  };
}



export function downPose(a, opt = {}) {
  const species = opt.species || 'chicken';
  const B = { shove: STAGGER.shove, ...(opt.pose || {}) };
  let shoveX = 0;
  let shoveY = 0;
  const sT = a.staggerT || 0;
  if (sT > 0) {
    const e = sT * sT * (a.staggerAmt || 0);
    const d = a.staggerDir || 0;
    shoveX = Math.cos(d) * B.shove * e * 0.4;
    shoveY = Math.sin(d) * B.shove * e * 0.4;
  }
  return {
    crawl: false,
    swing: 0,
    torsoPitch: 0.9,
    bodyLift: -(1 - 0.25) * (BODY_PIVOT_BU[species] || 0.48),
    bodyRoll: 0.15,
    bodySquash: 0.8,
    headThrust: 0.05,
    headPitch: 0.3,
    headYaw: 0.2,
    headBob: 0,
    neckReach: 0.2,
    wingFlap: 0.2,
    tailFlick: 0,
    breath: 0,
    shoveX,
    shoveY,
    sway: 0,
    tentacleWhip: 0,
    wingL: { reach: 0, press: 0.5, spread: 0.6 },
    wingR: { reach: 0, press: 0.5, spread: 0.6 },
    legL: { ...TRAIL_LEG },
    legR: { ...TRAIL_LEG },
    mutantLag: 0,
  };
}










export const FLINCH = Object.freeze({
  chicken: Object.freeze({
    name: 'wings out, head snap',
    torsoPitch: 0.34, bodyRoll: 0.62, bodyLift: -0.035, headPitch: 0.30, headThrust: 0.06,
    wingFlap: 0.55, tailFlick: 0.20, sway: 0, tentacleWhip: 0,
  }),
  porker: Object.freeze({
    name: 'shoulders back, head thrown',
    torsoPitch: 0.42, bodyRoll: 0.40, bodyLift: -0.02, headPitch: 0.55, headThrust: 0.10,
    wingFlap: 0.30, tailFlick: 0, sway: 0.08, tentacleWhip: 0,
  }),
  cow: Object.freeze({
    name: 'body sway, tentacle whip',
    torsoPitch: 0.16, bodyRoll: 0.30, bodyLift: -0.015, headPitch: 0.20, headThrust: 0.03,
    wingFlap: 0.20, tailFlick: 0.10, sway: 0.28, tentacleWhip: 1.0,
  }),
});






export function flinchPose(species = 'chicken', e = 0, d = Math.PI) {
  const F = FLINCH[species] || FLINCH.chicken;
  const c = Math.cos(d);
  const sn = Math.sin(d);
  return {
    torsoPitch: c * F.torsoPitch * e,      
    bodyRoll: sn * F.bodyRoll * e,         
    bodyLift: F.bodyLift * e,              
    headPitch: c * F.headPitch * e,        
    headThrust: c * F.headThrust * e,      
    wingFlap: F.wingFlap * e,              
    tailFlick: F.tailFlick * e,
    sway: sn * F.sway * e,                 
    
    
    
    tentacleWhip: F.tentacleWhip * Math.sin(Math.min(1, e) * Math.PI * 0.85),
  };
}
















const PHI = 1.6180339887;

export function idlePose(a, species = 'chicken', t = a.t) {
  const sd = ((a.seed % 1) + 1) % 1;
  const rate = 0.72 + sd * 0.6;                 
  
  
  
  
  
  
  const q = t * rate + sd * 417.3;              
  const q2 = q * Math.SQRT2 + sd * 173.3;       
  const q3 = q * PHI + sd * 291.7;              
  
  const beatV = Math.sin(q * 0.7) + 0.6 * Math.sin(q2 * 0.23 + 1.3) + 0.4 * Math.sin(q3 * 0.11 + sd * 6);
  
  
  const shake = Math.max(0, Math.sin(q2 * 0.31 + sd * 9) - 0.93) / 0.07;

  const out = {
    beat: 'rest',
    breath: 0.013 + 0.011 * Math.sin(q * 1.8),
    bodyLift: 0.010 * Math.sin(q * 1.8),
    bodyRoll: 0.05 * Math.sin(q2 * (0.5 / Math.SQRT2)),   
    torsoPitch: 0.12,
    headPitch: 0,
    headYaw: 0,
    headThrust: 0,
    wingFlap: 0,
    tailFlick: 0.06 * Math.sin(q * 2.3),
  };

  if (species === 'porker') {
    
    
    const sniff = Math.max(0, Math.sin(q * 0.55 + 0.4) + 0.3 * Math.sin(q3 * 0.17));
    const toss = Math.max(0, Math.sin(q2 * 0.19 + sd * 3) - 0.9) / 0.1;
    out.beat = toss > 0 ? 'toss' : (sniff > 0.5 ? 'sniff' : (shake > 0 ? 'shake' : 'rest'));
    out.breath = 0.018 + 0.014 * Math.sin(q * 1.4);
    out.bodyLift = 0.008 * Math.sin(q * 1.4);
    out.bodyRoll = 0.06 * Math.sin(q2 * 0.21);                     
    out.torsoPitch = 0.05 + 0.20 * sniff;
    out.headPitch = 0.45 * sniff * (0.6 + 0.4 * Math.sin(q * 3.1)) - 0.45 * toss;
    out.headYaw = 0.30 * Math.sin(q * 2.3 + sd) * sniff + 0.25 * Math.tanh(3 * Math.sin(q3 * 0.13 + 1.1)) * (1 - sniff);
    out.headThrust = 0.03 * sniff;
    out.wingFlap = 0.25 * shake * Math.sin(q * 38);                
    out.tailFlick = 0.10 * Math.sin(q2 * 1.7);
    return out;
  }

  if (species === 'cow') {
    
    
    
    const graze = Math.max(0, Math.sin(q * 0.31 + sd * 2) - 0.55) / 0.45;
    out.beat = graze > 0 ? 'feed' : (shake > 0 ? 'shake' : 'rest');
    out.breath = 0.012 + 0.010 * Math.sin(q * 1.1);
    out.bodyLift = 0.006 * Math.sin(q * 1.1);
    out.bodyRoll = 0.08 * Math.sin(q2 * 0.17) + 0.03 * Math.sin(q3 * 0.29);   
    out.torsoPitch = 0.05 + 0.18 * graze;
    out.headPitch = 0.50 * graze + 0.05 * Math.sin(q3 * 0.9);
    out.headYaw = 0.35 * Math.tanh(2.5 * Math.sin(q3 * 0.09 + 0.7)) * (1 - graze);
    out.wingFlap = 0.12 * Math.max(0, Math.sin(q3 * 1.9 + sd * 5)) ** 3 + 0.3 * shake * Math.sin(q * 30);
    out.tailFlick = 0.10 * Math.sin(q2 * 0.9);
    return out;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  const gate = Math.min(1, Math.max(0, (beatV + 1.0) / 0.3));
  const peck = Math.max(0, Math.sin(q2 * (0.7 / Math.SQRT2))) * gate * gate * (3 - 2 * gate);
  const look = Math.sin(q3 * (0.19 / PHI) + 2.1);
  out.beat = shake > 0 ? 'shake' : (peck > 0.3 ? 'feed' : (Math.abs(look) > 0.5 ? 'look' : 'rest'));
  out.torsoPitch = 0.12 + 0.28 * peck;
  out.headPitch = 0.55 * peck * Math.max(0.25, Math.sin(q * 6.3));
  out.headYaw = 0.45 * Math.tanh(3 * look) * (1 - peck);
  out.wingFlap = 0.45 * shake * Math.abs(Math.sin(q * 42));
  out.tailFlick = 0.06 * Math.sin(q * 2.3) + 0.15 * shake * Math.sin(q * 33);
  return out;
}





















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
