


































































import { MOVE_INDEX } from './moveManifest.js';

export const FPS = 30;



export const GROUND = 205;
export const BODY_H = 96;          












const LEFT_HOME = 196;
const RIGHT_HOME = 306;


const FLY_LEFT = 92;
const FLY_RIGHT = 410;



const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);





const arc = (t) => 4 * t * (1 - t);








function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}


const st = (pose, x, y = 0, facing = 1, extra = {}) => ({
  pose, x, y, facing, rot: 0, ...extra,
});



class Fight {
  constructor() {
    this.ticks = [];
    this.marks = [];
    this.rand = rng(0x2df1a);
  }

  get n() { return this.ticks.length; }

  mark(name) { this.marks.push({ name, at: this.n }); }

  








  push(count, fn, meta = {}) {
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1);
      const tick = fn(i, count, t);
      this.ticks.push({ rate: 1, ...meta, ...tick });
    }
    return this;
  }

  
  hold(count, a, b, meta = {}) {
    return this.push(count, () => ({ a: { ...a }, b: { ...b } }), meta);
  }

  










  walkTo(count, ax, bx, { pose = 'guard', ay = 0, by = 0 } = {}) {
    const last = this.ticks[this.ticks.length - 1];
    const fromA = last ? last.a.x : ax;
    const fromB = last ? last.b.x : bx;
    const fromAy = last ? last.a.y : ay;
    const fromBy = last ? last.b.y : by;
    return this.push(count, (i, n, t) => {
      const e = easeInOut(t);
      const nax = lerp(fromA, ax, e);
      const nbx = lerp(fromB, bx, e);
      
      
      const moving = Math.abs(ax - fromA) + Math.abs(bx - fromB) > 8;
      const p = moving && Math.floor(i / 5) % 2 ? 'step-in' : pose;
      return {
        a: st(p, nax, lerp(fromAy, ay, e), nax <= nbx ? 1 : -1),
        b: st(p, nbx, lerp(fromBy, by, e), nbx < nax ? 1 : -1),
      };
    });
  }
}




















const ATTACKS = {
  jab: {
    frames: [['guard', 1], ['jab-mid', 1], ['jab', 2], ['jab-mid', 1], ['guard', 1]],
    hitAt: 2, reach: 46, power: 0.5,
  },
  cross: {
    frames: [['guard', 1], ['cross-mid', 1], ['cross', 2], ['cross-out', 2],
      ['step-in', 1], ['guard', 1]],
    hitAt: 2, reach: 54, power: 1,
  },
  hook: {
    frames: [['guard', 1], ['hook-mid', 1], ['hook', 2], ['hook-mid', 1], ['guard', 1]],
    hitAt: 2, reach: 44, power: 0.9,
  },
  uppercut: {
    frames: [['crouch', 1], ['upper-mid', 1], ['uppercut', 2], ['upper-mid', 1],
      ['guard', 1]],
    hitAt: 2, reach: 38, power: 1,
  },
  'kick-low': {
    frames: [['guard', 1], ['klow-mid', 1], ['kick-low', 2], ['klow-mid', 1],
      ['guard', 1]],
    hitAt: 2, reach: 58, power: 0.8,
  },
  'kick-high': {
    frames: [['guard', 1], ['khigh-mid', 1], ['kick-high', 3], ['khigh-mid', 1],
      ['guard', 1]],
    hitAt: 2, reach: 62, power: 1,
  },
  knee: {
    frames: [['step-in', 1], ['knee-mid', 1], ['knee', 2], ['knee-mid', 1],
      ['guard', 1]],
    hitAt: 2, reach: 32, power: 0.9,
  },
};




const DEFENCES = {
  
  
  jab: ['guard', 'block-mid-in', 'parry', 'parry', 'block-mid-in'],
  cross: ['guard', 'block-mid-in', 'block-mid', 'block-mid', 'block-mid-in'],
  hook: ['guard', 'block-high-in', 'block-high', 'block-high', 'block-high-in'],
  uppercut: ['guard', 'block-mid-in', 'step-back', 'step-back', 'guard'],
  'kick-low': ['guard', 'block-mid-in', 'block-low', 'block-low', 'block-mid-in'],
  'kick-high': ['guard', 'block-high-in', 'block-high', 'block-high', 'block-high-in'],
  knee: ['guard', 'block-mid-in', 'block-low', 'block-low', 'block-mid-in'],
};


function expand(frames) {
  const out = [];
  for (const [pose, n] of frames) for (let i = 0; i < n; i += 1) out.push(pose);
  return out;
}









function exchange({ attack, attX, defX, attFace, defFace, connects, slow = 1, react }) {
  const spec = ATTACKS[attack];
  const poses = expand(spec.frames);
  const defSeq = DEFENCES[attack];
  const out = [];
  const hitTick = spec.hitAt * slow;

  
  
  
  const heavy = spec.power >= 0.9;
  const reactSeq = react ? [react, react, react, react] : (heavy
    ? ['hit-head-mid', 'hit-head', 'hit-head', 'stagger-mid', 'stagger', 'stagger']
    : ['hit-body-mid', 'hit-body', 'hit-body', 'stagger-mid', 'stagger', 'stagger']);

  for (let i = 0; i < poses.length * slow; i += 1) {
    const p = poses[Math.floor(i / slow)];
    
    
    
    
    
    
    
    
    
    
    const windEnd = spec.frames[0][1] * slow;
    const holdEnd = hitTick + 3 * slow;
    let ramp = 0;
    if (i >= windEnd && i < holdEnd) {
      ramp = Math.min(1, (i - windEnd + 1) / Math.max(1, hitTick - windEnd + 1));
    } else if (i >= holdEnd) {
      ramp = Math.max(0, 1 - (i - holdEnd + 1) / (3 * slow));
    }
    
    
    
    const lean = spec.reach * 0.52 * easeOut(ramp);
    const ax = attX + attFace * lean;

    let dPose = defSeq[Math.min(defSeq.length - 1, Math.floor(i / slow))];
    let dx = defX;
    if (connects && i >= hitTick) {
      
      
      const since = Math.floor((i - hitTick) / slow);
      dPose = reactSeq[Math.min(reactSeq.length - 1, since)];
      dx = defX + defFace * -Math.min(spec.power * 16, (i - hitTick) * 2.2);
    }
    out.push({
      a: st(p, ax, 0, attFace),
      b: st(dPose, dx, 0, defFace),
      hit: connects && i === hitTick ? { x: (ax + dx) / 2, power: spec.power } : null,
      rate: 1 / slow,
    });
  }
  return out;
}


function playExchange(f, opts) {
  const { leftAttacks } = opts;
  const rows = exchange({
    ...opts,
    attX: leftAttacks ? opts.lx : opts.rx,
    defX: leftAttacks ? opts.rx : opts.lx,
    attFace: leftAttacks ? 1 : -1,
    defFace: leftAttacks ? -1 : 1,
  });
  for (const r of rows) {
    f.ticks.push(leftAttacks ? r : { ...r, a: r.b, b: r.a });
  }
}









function dash(f, { lx, rx, leftChases, ticks = 10, reach = 46 }) {
  const from = leftChases ? lx : rx;
  const to = leftChases ? rx - reach : lx + reach;
  const otherFrom = leftChases ? rx : lx;
  const otherTo = leftChases ? rx + 18 : lx - 18;
  f.push(ticks, (i, n, t) => {
    const e = easeIn(t);
    const cx = lerp(from, to, e);
    const ox = lerp(otherFrom, otherTo, e);
    const chaser = st(t < 0.15 ? 'crouch' : t > 0.8 ? 'knee' : 'step-in', cx, 0,
      leftChases ? 1 : -1);
    const fleeing = st(t > 0.8 ? 'block-mid' : 'step-back', ox, 0,
      leftChases ? -1 : 1);
    return leftChases ? { a: chaser, b: fleeing } : { a: fleeing, b: chaser };
  });

  
  
  
  
  
  
  
  f.push(7, (i, n, t) => {
    const e = easeOut(t);
    return leftChases
      ? { a: st(i < 3 ? 'block-mid' : 'guard', lerp(to, from, e), 0, 1),
        b: st(i < 3 ? 'cross' : 'guard', lerp(otherTo, otherFrom, e), 0, -1),
        hit: i === 3 ? { x: (to + otherTo) / 2, power: 0.7 } : null }
      : { a: st(i < 3 ? 'cross' : 'guard', lerp(otherTo, otherFrom, e), 0, 1),
        b: st(i < 3 ? 'block-mid' : 'guard', lerp(to, from, e), 0, -1),
        hit: i === 3 ? { x: (to + otherTo) / 2, power: 0.7 } : null };
  });
}





function sceneCorner(f, { tag, leftPressed, count = 10 }) {
  f.mark(tag);
  const wall = leftPressed ? 84 : 418;
  const front = leftPressed ? wall + 104 : wall - 104;
  
  
  
  
  
  f.walkTo(14, leftPressed ? wall : front, leftPressed ? front : wall,
    { pose: leftPressed ? 'step-back' : 'step-in' });
  const menu = ['jab', 'jab', 'cross', 'hook', 'knee', 'uppercut', 'jab', 'kick-low'];
  for (let k = 0; k < count; k += 1) {
    playExchange(f, {
      attack: menu[Math.floor(f.rand() * menu.length)],
      leftAttacks: !leftPressed,
      lx: leftPressed ? wall : front,
      rx: leftPressed ? front : wall,
      connects: f.rand() < 0.55,
    });
  }
  
  dash(f, { lx: leftPressed ? wall : front, rx: leftPressed ? front : wall,
    leftChases: leftPressed, ticks: 12, reach: 60 });
}




function sceneApproach(f) {
  f.mark('approach');
  const START_L = 40;
  const START_R = 468;
  
  
  
  
  f.push(90, (i, n, t) => {
    const e = easeInOut(t);
    
    const fade = i < 24 ? 1 - i / 24 : 0;
    const lx = lerp(START_L, LEFT_HOME - 18, e);
    const rx = lerp(START_R, RIGHT_HOME + 18, e);
    
    
    
    const step = Math.floor(i / 3) % 2 ? 'step-in' : 'idle';
    return { a: st(step, lx, 0, 1), b: st(step, rx, 0, -1), fade };
  });
  
  f.push(22, (i, n, t) => {
    const e = easeIn(t);
    return {
      a: st(Math.floor(i / 3) % 2 ? 'step-in' : 'guard', lerp(LEFT_HOME - 18, LEFT_HOME, e), 0, 1),
      b: st(Math.floor(i / 3) % 2 ? 'step-in' : 'guard', lerp(RIGHT_HOME + 18, RIGHT_HOME, e), 0, -1),
    };
  });
}


function sceneFeelOut(f) {
  f.mark('feel-out');
  
  
  const order = ['jab', 'jab', 'kick-low', 'jab', 'cross', 'hook', 'jab', 'kick-low',
    'jab', 'cross', 'kick-high', 'jab', 'hook', 'knee', 'jab', 'kick-low',
    'cross', 'jab', 'hook', 'kick-low', 'jab', 'knee', 'cross', 'jab',
    'kick-high', 'jab', 'hook', 'jab', 'kick-low', 'cross'];
  order.forEach((attack, k) => {
    playExchange(f, {
      attack,
      leftAttacks: k % 2 === 0,
      lx: LEFT_HOME,
      rx: RIGHT_HOME,
      connects: k === 4 || k === 7,
    });
    
    
    
    
    
    
    
    
    
    const gap = 3 + Math.floor(f.rand() * 4);
    f.push(gap, (i, n, t) => {
      const sway = Math.sin(t * Math.PI) * 7;
      return {
        a: st(i % 2 ? 'step-in' : 'guard', LEFT_HOME + sway, 0, 1),
        b: st(i % 2 ? 'step-back' : 'guard', RIGHT_HOME + sway, 0, -1),
      };
    });
  });
}


function sceneFlurry(f, { seedTag, count, closeIn = 0 }) {
  f.mark(seedTag);
  const lx = LEFT_HOME + closeIn;
  const rx = RIGHT_HOME - closeIn;
  const menu = ['jab', 'jab', 'cross', 'hook', 'knee', 'jab', 'uppercut', 'kick-low', 'cross', 'kick-high'];
  for (let k = 0; k < count; k += 1) {
    playExchange(f, {
      attack: menu[Math.floor(f.rand() * menu.length)],
      leftAttacks: f.rand() < 0.5,
      lx,
      rx,
      connects: f.rand() < 0.42,
    });
    
    
    
    
    if (f.rand() < 0.25) {
      f.push(2, (i, n, t) => ({
        a: st('step-in', lx + 4 * Math.sin(t * Math.PI), 0, 1),
        b: st('step-back', rx - 4 * Math.sin(t * Math.PI), 0, -1),
      }));
    }
    
    if (k % 8 === 7) dash(f, { lx, rx, leftChases: f.rand() < 0.5, ticks: 9 });
  }
}





function sceneJump(f, { attacker = 'b', pose = 'air-kick', connects = true } = {}) {
  f.mark('jump');
  const leftJumps = attacker === 'a';
  const jx = leftJumps ? LEFT_HOME : RIGHT_HOME;
  const ox = leftJumps ? RIGHT_HOME : LEFT_HOME;
  const face = leftJumps ? 1 : -1;
  const put = (jumper, other) => f.ticks.push(leftJumps
    ? { a: jumper, b: other, rate: 1 }
    : { a: other, b: jumper, rate: 1 });

  
  
  for (let i = 0; i < 5; i += 1) {
    put(st(i < 3 ? 'crouch' : 'jump-load', jx, 0, face),
      st('guard', ox, 0, -face));
  }
  
  
  
  
  const AIR = 32;
  const PEAK = 82;
  const land = ox - face * 52;
  for (let i = 0; i < AIR; i += 1) {
    const t = i / (AIR - 1);
    const y = arc(t) * PEAK;
    const x = lerp(jx, land, easeOut(t));
    let p = 'jump-rise';
    if (i < 3) p = 'jump-launch';
    
    
    
    else if (t >= 0.30 && t < 0.40) p = 'jump-apex';
    else if (t >= 0.40 && t < 0.72) p = pose;
    else if (t >= 0.72) p = 'jump-fall';
    const hit = t > 0.55 && t <= 0.58 && connects;
    put(st(p, x, y, face),
      st(connects && t > 0.55 ? 'hit-head' : 'block-high', ox, 0, -face));
    if (hit) f.ticks[f.ticks.length - 1].hit = { x: (x + ox) / 2, power: 1 };
  }
  
  
  
  for (let i = 0; i < 14; i += 1) {
    put(st(i < 4 ? 'land' : i < 7 ? 'crouch' : 'guard', land, 0, face),
      st(connects && i < 6 ? 'stagger' : connects && i < 10 ? 'hit-body' : 'guard', ox, 0, -face));
    if (i === 0) f.ticks[f.ticks.length - 1].land = { x: land };
  }
}

















export const DIALOGUE = [
  { who: 'a', text: 'Not bad, kid.', ticks: 34 },
  { who: 'b', text: 'You are slow.', ticks: 34 },
  
  
  
  { who: 'a', text: 'Slow?', ticks: 32 },
  { who: 'b', text: 'Show me.', ticks: 30 },
];

function sceneStandoff(f) {
  f.mark('standoff');
  
  
  f.push(14, (i, n, t) => {
    const e = easeOut(t);
    return {
      a: st(i < 6 ? 'step-back' : 'talk', lerp(LEFT_HOME, LEFT_HOME - 26, e), 0, 1),
      b: st(i < 6 ? 'step-back' : 'talk', lerp(RIGHT_HOME, RIGHT_HOME + 26, e), 0, -1),
    };
  });

  const lx = LEFT_HOME - 26;
  const rx = RIGHT_HOME + 26;
  for (const line of DIALOGUE) {
    f.push(line.ticks, (i, n, t) => {
      
      
      
      
      
      const speaking = Math.floor(i / 5) % 2 ? 'talk-point' : 'talk';
      const sway = Math.sin(t * Math.PI * 2) * 5;
      return {
        a: st(line.who === 'a' ? speaking : 'talk', lx + sway, 0, 1),
        b: st(line.who === 'b' ? speaking : 'talk', rx - sway, 0, -1),
        say: { who: line.who, text: line.text, i, n: line.ticks },
      };
    });
  }

  
  f.push(16, (i, n, t) => {
    const e = easeIn(t);
    return {
      a: st(i < 5 ? 'talk' : 'guard', lerp(lx, LEFT_HOME, e), 0, 1),
      b: st(i < 5 ? 'talk' : 'guard', lerp(rx, RIGHT_HOME, e), 0, -1),
    };
  });
}


function sceneSlowMo(f) {
  f.mark('slow-motion');
  
  
  
  
  playExchange(f, {
    attack: 'cross', leftAttacks: true, lx: LEFT_HOME, rx: RIGHT_HOME,
    connects: true, slow: 4,
  });
  playExchange(f, {
    attack: 'uppercut', leftAttacks: false, lx: LEFT_HOME, rx: RIGHT_HOME,
    connects: true, slow: 4,
  });
  playExchange(f, {
    attack: 'kick-high', leftAttacks: true, lx: LEFT_HOME, rx: RIGHT_HOME,
    connects: true, slow: 3,
  });
}


function sceneFlight(f) {
  f.mark('flight');
  
  
  f.push(22, (i, n, t) => {
    const y = easeOut(Math.min(1, t * 1.6)) * 58;
    const p = i < 3 ? 'jump-load' : i < 7 ? 'jump-launch' : 'hover';
    const e = easeOut(t);
    return {
      a: st(p, lerp(LEFT_HOME, FLY_LEFT, e), y, 1),
      b: st(p, lerp(RIGHT_HOME, FLY_RIGHT, e), y, -1),
    };
  });

  
  
  
  
  for (let pass = 0; pass < 10; pass += 1) {
    const swap = pass % 2 === 1;
    const lFrom = swap ? FLY_RIGHT : FLY_LEFT;
    const lTo = swap ? FLY_LEFT : FLY_RIGHT;
    f.push(17, (i, n, t) => {
      const e = easeInOut(t);
      const ax = lerp(lFrom, lTo, e);
      const bx = lerp(lTo, lFrom, e);
      const streak = t > 0.15 && t < 0.85;
      const y = 58 + Math.sin(t * Math.PI) * 14;
      return {
        a: st(streak ? 'fly-dash' : 'hover', ax, y, ax < bx ? 1 : -1),
        b: st(streak ? 'fly-dash' : 'hover', bx, y, bx < ax ? 1 : -1),
        
        hit: Math.abs(t - 0.5) < 0.02 ? { x: (ax + bx) / 2, power: 1, air: true } : null,
      };
    });
    f.push(7, (i, n, t) => {
      const ax = swap ? FLY_LEFT : FLY_RIGHT;
      const bx = swap ? FLY_RIGHT : FLY_LEFT;
      return {
        a: st('air-guard', ax, 58, ax < bx ? 1 : -1),
        b: st('air-guard', bx, 58, bx < ax ? 1 : -1),
      };
    });
  }

  
  f.push(16, (i, n, t) => {
    const y = lerp(58, 0, easeIn(t));
    const e = easeIn(t);
    
    
    const ax = lerp(FLY_LEFT, LEFT_HOME, e);
    const bx = lerp(FLY_RIGHT, RIGHT_HOME, e);
    return {
      a: st(t < 0.8 ? 'air-punch' : 'land', ax, y, 1),
      b: st(t < 0.8 ? 'air-punch' : 'land', bx, y, -1),
      land: t >= 0.8 && t < 0.85 ? { x: ax } : null,
    };
  });
}


function sceneFinale(f) {
  f.mark('finale');
  
  
  
  
  
  f.push(52, (i, n, t) => {
    const p = t < 0.2 ? 'charge' : Math.floor(i / 3) % 2 ? 'charge-max' : 'charge';
    
    
    
    
    
    const jit = (1 + t * 3) * Math.sin(i * 2.7);
    const lift = t * 3 * Math.abs(Math.sin(i * 1.9));
    return {
      a: st(p, LEFT_HOME - 10 + jit, lift, 1),
      b: st(p, RIGHT_HOME + 10 - jit, lift, -1),
      charge: { level: Math.min(1, t * 1.4) },
    };
  });

  
  
  
  
  f.push(18, (i) => ({
    a: st('finish-wind', LEFT_HOME - 10 + 2.4 * Math.sin(i * 3.1), 0, 1),
    b: st('finish-wind', RIGHT_HOME + 10 - 2.4 * Math.sin(i * 3.1), 0, -1),
    charge: { level: 1 },
  }));

  
  f.push(18, (i, n, t) => {
    const e = easeIn(t);
    return {
      a: st('fly-dash', lerp(LEFT_HOME - 10, 224, e), lerp(0, 10, e), 1),
      b: st('fly-dash', lerp(RIGHT_HOME + 10, 278, e), lerp(0, 10, e), -1),
      rate: 1.4,
    };
  });

  
  
  f.push(10, () => ({
    a: st('finish-strike', 224, 6, 1),
    b: st('finish-strike', 288, 6, -1),
    hit: { x: 251, power: 1.6, big: true },
    rate: 0.15,
    shake: 1,
  }));

  
  f.push(34, (i, n, t) => {
    const e = easeOut(t);
    return {
      a: st('finish-strike', 224, lerp(6, 0, e), 1),
      b: st('knockdown', lerp(278, 428, e), lerp(6, 34, arc(t) + 0.2), -1),
      rate: 0.4,
      shake: 1 - t,
    };
  });
  f.push(20, (i, n, t) => ({
    a: st('idle', 224, 0, 1),
    b: st('defeated', 428, lerp(20, 0, easeIn(t)), -1),
    land: t > 0.7 && t < 0.78 ? { x: 428 } : null,
  }));

  
  
  
  
  
  f.push(56, (i, n, t) => {
    const pose = t < 0.14 ? 'idle' : t < 0.72 ? 'victory'
      : Math.floor(i / 6) % 2 ? 'idle-breathe' : 'idle';
    return {
      a: st(pose, 224 + (t < 0.72 ? 0 : (t - 0.72) * 26), 0, 1),
      b: st('defeated', 428, 0, -1),
    };
  });

  
  
  
  
  
  
  
  
  f.push(36, (i, n, t) => ({
    a: st('victory', 224, 0, 1),
    b: st('defeated', 428, 0, -1),
    fade: t,
  }));
}










export function buildFight() {
  const f = new Fight();
  
  
  
  
  
  
  
  
  
  sceneApproach(f);
  sceneFeelOut(f);
  sceneFlurry(f, { seedTag: 'flurry-1', count: 60 });
  f.walkTo(12, LEFT_HOME, RIGHT_HOME);
  sceneJump(f, { attacker: 'b', pose: 'air-kick', connects: true });
  sceneFlurry(f, { seedTag: 'flurry-2', count: 56, closeIn: 12 });
  sceneJump(f, { attacker: 'a', pose: 'air-kick', connects: false });
  sceneCorner(f, { tag: 'corner-1', leftPressed: true, count: 24 });
  f.walkTo(12, LEFT_HOME, RIGHT_HOME);
  sceneStandoff(f);
  sceneSlowMo(f);
  f.walkTo(10, LEFT_HOME + 16, RIGHT_HOME - 16);
  sceneFlurry(f, { seedTag: 'flurry-3', count: 68, closeIn: 16 });
  sceneJump(f, { attacker: 'b', pose: 'air-punch', connects: true });
  sceneCorner(f, { tag: 'corner-2', leftPressed: false, count: 26 });
  f.walkTo(12, LEFT_HOME, RIGHT_HOME);
  sceneFlurry(f, { seedTag: 'flurry-4', count: 62, closeIn: 20 });
  f.walkTo(14, LEFT_HOME, RIGHT_HOME);
  sceneJump(f, { attacker: 'a', pose: 'air-punch', connects: false });
  sceneFlight(f);
  f.walkTo(14, LEFT_HOME - 10, RIGHT_HOME + 10);
  sceneFinale(f);
  return { ticks: f.ticks, marks: f.marks };
}

let cached = null;

export function fight() {
  if (!cached) cached = buildFight();
  return cached;
}


export function durationMs() {
  return (fight().ticks.length / FPS) * 1000;
}


export function posesUsed() {
  const used = new Set();
  for (const t of fight().ticks) {
    if (t.a) used.add(t.a.pose);
    if (t.b) used.add(t.b.pose);
  }
  return [...used];
}


export function unknownPoses() {
  return posesUsed().filter((p) => MOVE_INDEX[p] === undefined);
}
