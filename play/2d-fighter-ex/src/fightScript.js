


























































































import { MOVE_INDEX } from './moveManifest.js';
import { solve } from './animeRig.mjs';
import { poseById, registerTween, bakedPoseFor } from './moveSet.mjs';

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




































































function stride(i, count, hold = 3) {
  const stepping = Math.floor(i / hold) % 2 === 0;
  let done = 0;
  let total = 0;
  for (let k = 0; k < count; k += 1) {
    if (Math.floor(k / hold) % 2 !== 0) continue;
    total += 1;
    if (k <= i) done += 1;
  }
  return { stepping, u: total ? done / total : 1 };
}










const stepDrawing = (delta, facing, planted = 'guard') => (Math.abs(delta) < 1
  ? planted
  : ((delta > 0) === (facing > 0) ? 'step-in' : 'step-back'));



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

  










  

















  arriveAt(ax, bx, opts = {}) {
    const last = this.ticks[this.ticks.length - 1];
    if (!last || !last.a || !last.b) return this;
    const d = Math.max(Math.abs(last.a.x - ax), Math.abs(last.b.x - bx));
    
    if (d <= 4) return this;
    
    
    const count = Math.min(14, Math.max(4, Math.round(d / 5)));
    return this.walkTo(count, ax, bx, opts);
  }

  walkTo(count, ax, bx, { pose = 'guard', ay = 0, by = 0 } = {}) {
    const last = this.ticks[this.ticks.length - 1];
    const fromA = last ? last.a.x : ax;
    const fromB = last ? last.b.x : bx;
    const fromAy = last ? last.a.y : ay;
    const fromBy = last ? last.b.y : by;
    
    
    
    
    
    
    
    
    
    
    
    return this.push(count, (i) => {
      const { stepping, u } = stride(i, count);
      const e = easeInOut(u);
      const nax = lerp(fromA, ax, e);
      const nbx = lerp(fromB, bx, e);
      const aFace = nax <= nbx ? 1 : -1;
      const bFace = nbx < nax ? 1 : -1;
      return {
        a: st(stepping ? stepDrawing(ax - fromA, aFace, pose) : pose,
          nax, lerp(fromAy, ay, e), aFace),
        b: st(stepping ? stepDrawing(bx - fromB, bFace, pose) : pose,
          nbx, lerp(fromBy, by, e), bFace),
      };
    });
  }

  
































































  resetStance(lx, rx, { ticks = 5, out = 6 } = {}) {
    const last = this.ticks[this.ticks.length - 1];
    const fromA = last ? last.a.x : lx;
    const fromB = last ? last.b.x : rx;
    
    
    
    
    const n = Math.max(5, ticks);
    const outN = Math.max(2, Math.round(n * 0.4));
    const inN = Math.max(2, Math.round((n - outN) * 0.55));
    return this.push(n, (i) => {
      if (i < outN) {
        const u = (i + 1) / outN;
        return {
          a: st('step-back', lerp(fromA, lx - out, u), 0, 1),
          b: st('step-back', lerp(fromB, rx + out, u), 0, -1),
        };
      }
      if (i < outN + inN) {
        const u = (i - outN + 1) / inN;
        return {
          a: st('step-in', lerp(lx - out, lx, u), 0, 1),
          b: st('step-in', lerp(rx + out, rx, u), 0, -1),
        };
      }
      
      
      
      
      return { a: st('guard', lx, 0, 1), b: st('guard', rx, 0, -1) };
    });
  }
}































































const ATTACKS = {
  jab: {
    frames: [['guard', 2], ['jab-mid', 1], ['jab', 2], ['jab-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 46, power: 0.5,
  },
  cross: {
    frames: [['guard', 2], ['cross-mid', 1], ['cross', 2], ['cross-out', 2],
      ['step-back', 2]],
    hitFrame: 2, reach: 54, power: 1,
  },
  hook: {
    frames: [['guard', 2], ['hook-mid', 1], ['hook', 2], ['hook-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 44, power: 0.9,
  },
  uppercut: {
    frames: [['crouch', 2], ['upper-mid', 1], ['uppercut', 2], ['upper-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 38, power: 1,
  },
  'kick-low': {
    frames: [['guard', 2], ['klow-mid', 1], ['kick-low', 2], ['klow-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 58, power: 0.8,
  },
  'kick-high': {
    frames: [['guard', 2], ['khigh-mid', 1], ['kick-high', 3], ['khigh-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 62, power: 1,
  },
  knee: {
    frames: [['step-in', 2], ['knee-mid', 1], ['knee', 2], ['knee-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 32, power: 0.9,
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  arch: {
    
    
    frames: [['guard', 2], ['arch-mid', 2], ['arch', 2], ['arch-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 50, power: 1,
  },
  'kick-body': {
    
    
    frames: [['guard', 2], ['kbody-mid', 1], ['kick-body', 2], ['kbody-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 60, power: 0.9,
  },
  roundhouse: {
    
    
    frames: [['guard', 2], ['round-mid', 2], ['roundhouse', 3], ['round-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 66, power: 1,
  },
  'spin-kick': {
    
    
    frames: [['guard', 2], ['spin-mid', 2], ['spin-kick', 3], ['spin-mid', 1],
      ['step-back', 2]],
    hitFrame: 2, reach: 64, power: 1,
  },
};



























const DEFENCES = {
  
  
  jab: [['guard', 2], ['block-mid-in', 2], ['parry', 3], ['block-mid-in', 3]],
  cross: [['guard', 2], ['block-mid-in', 2], ['block-mid', 3], ['block-mid-in', 3]],
  hook: [['guard', 2], ['block-high-in', 2], ['block-high', 3], ['block-high-in', 3]],
  
  
  
  uppercut: [['guard', 2], ['block-mid-in', 2], ['step-back', 4]],
  'kick-low': [['guard', 2], ['block-mid-in', 2], ['block-low', 3], ['block-mid-in', 3]],
  'kick-high': [['guard', 2], ['block-high-in', 2], ['block-high', 3], ['block-high-in', 3]],
  knee: [['guard', 2], ['block-mid-in', 2], ['block-low', 3], ['block-mid-in', 3]],
  
  
  arch: [['guard', 2], ['block-high-in', 2], ['block-high', 3], ['block-high-in', 3]],
  'kick-body': [['guard', 2], ['block-mid-in', 2], ['block-mid', 3], ['block-mid-in', 3]],
  roundhouse: [['guard', 2], ['block-high-in', 2], ['block-high', 3], ['block-high-in', 3]],
  'spin-kick': [['guard', 2], ['block-high-in', 2], ['block-high', 3], ['block-high-in', 3]],
};






























const REACTIONS = {
  heavy: [['hit-head-mid', 0.45, 1], ['hit-head', 1, 2],
    ['stagger', 0.55, 3], ['step-in', 0.15, 2], ['guard', 0, 2]],
  light: [['hit-body-mid', 0.35, 1], ['hit-body', 0.9, 2],
    ['stagger', 0.5, 3], ['step-in', 0.12, 2], ['guard', 0, 2]],
};









function expand(frames) {
  const poses = [];
  const frameOf = [];
  const frameStart = [];
  frames.forEach(([pose, n], k) => {
    frameStart.push(poses.length);
    for (let i = 0; i < n; i += 1) { poses.push(pose); frameOf.push(k); }
  });
  return { poses, frameOf, frameStart };
}










function perTick(table) {
  const out = [];
  for (const row of table) {
    const n = row[row.length - 1];
    for (let i = 0; i < n; i += 1) out.push(row);
  }
  return out;
}



























export const STRIKE_SLOW = 4 / 3;



























const ENRICHED = new Map();
function enrichedSpec(attack) {
  if (ENRICHED.has(attack)) return ENRICHED.get(attack);
  const spec = ATTACKS[attack];
  const frames = [];
  let hitFrame = spec.hitFrame;
  for (let k = 0; k < spec.frames.length; k += 1) {
    const cur = spec.frames[k];
    if (k === spec.hitFrame) {
      const prev = spec.frames[k - 1];
      if (prev) {
        const id = `${prev[0]}~${cur[0]}~in`;
        if (registerTween(id, prev[0], cur[0], 0.5)) frames.push([id, 1]);
      }
      hitFrame = frames.length;
    }
    frames.push(cur);
    if (k === spec.hitFrame) {
      const nxt = spec.frames[k + 1];
      if (nxt) {
        const id = `${cur[0]}~${nxt[0]}~out`;
        if (registerTween(id, cur[0], nxt[0], 0.5)) frames.push([id, 1]);
      }
    }
  }
  const out = { ...spec, frames, hitFrame };
  ENRICHED.set(attack, out);
  return out;
}

function exchange({ attack, attX, defX, attFace, defFace, connects, slow = 1, react }) {
  const spec = enrichedSpec(attack);
  const { poses, frameOf, frameStart } = expand(spec.frames);
  const defSeq = perTick(DEFENCES[attack]);
  const out = [];
  
  
  
  
  
  
  
  
  
  
  
  
  const hitTick = Math.round(frameStart[spec.hitFrame] * slow);

  
  
  
  const heavy = spec.power >= 0.9;
  const reactSeq = perTick(react
    ? [[react, 0.6, 4]]
    : REACTIONS[heavy ? 'heavy' : 'light']);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const lastFrame = spec.frames.length - 1;
  const hitFrame = spec.hitFrame;
  const leanOf = spec.frames.map((_, k) => (k <= hitFrame
    ? easeOut(hitFrame ? k / hitFrame : 1)
    : 1 - easeIn((k - hitFrame) / Math.max(1, lastFrame - hitFrame))));

  for (let i = 0; i < poses.length * slow; i += 1) {
    const fi = Math.floor(i / slow);
    const p = poses[fi];
    const lean = spec.reach * 0.52 * leanOf[frameOf[fi]];
    const ax = attX + attFace * lean;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    let dPose = connects
      ? 'guard'
      : defSeq[Math.min(defSeq.length - 1, Math.floor(i / slow))][0];
    let dx = defX;
    if (connects && i >= hitTick) {
      
      
      const since = Math.min(reactSeq.length - 1, Math.floor((i - hitTick) / slow));
      const [rPose, back] = reactSeq[since];
      dPose = rPose;
      dx = defX + defFace * -spec.power * 16 * back;
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










function whiffCounter(f, { lx, rx, leftAttacks }) {
  const face = leftAttacks ? 1 : -1;
  const put = (att, def) => f.ticks.push(leftAttacks
    ? { a: att, b: def, rate: 1 } : { a: def, b: att, rate: 1 });
  const ax = leftAttacks ? lx : rx;
  const dx = leftAttacks ? rx : lx;

  
  
  
  
  
  
  
  
  for (let i = 0; i < 8; i += 1) {
    const k = Math.floor(i / 2);
    const p = ['guard', 'cross-mid', 'cross', 'cross-out'][k];
    const bailing = k < 2;
    put(st(p, ax + face * 30 * easeOut(k / 3), 0, face),
      st(bailing ? 'step-back' : 'crouch',
        dx + face * 26 * easeOut(Math.min(1, (i + 1) / 4)), 0, -face));
  }
  
  
  
  
  
  
  const COUNTER = { crouch: 26, 'upper-mid': 22, uppercut: 13, guard: 19 };
  
  
  
  
  
  
  
  
  
  
  
  const upperGap = strikeTip('uppercut') + ATTACKS.uppercut.reach * 0.52 + BODY_FRONT;
  for (let i = 0; i < 10; i += 1) {
    const p = i < 4 ? 'stagger-mid' : i < 7 ? 'hit-body-mid' : 'hit-body';
    const c = i < 3 ? 'crouch' : i < 5 ? 'upper-mid' : i < 8 ? 'uppercut' : 'guard';
    const cx = (c === 'uppercut' || c === 'upper-mid')
      ? ax + face * (26 + upperGap)
      : dx + face * COUNTER[c];
    put(st(p, ax + face * 26, 0, face), st(c, cx, 0, -face));
    if (i === 5) {
      f.ticks[f.ticks.length - 1].hit = { x: (ax + dx) / 2 + face * 22, power: 1 };
    }
  }
  
  
  
  
  
  
  
  f.resetStance(lx, rx, { out: 4 });
}














const strikeTipCache = new Map();
function strikeTip(poseId) {
  if (strikeTipCache.has(poseId)) return strikeTipCache.get(poseId);
  const pose = poseById(poseId);
  let tip = 0;
  if (pose) {
    const K = solve(pose, { flip: false });
    tip = Math.max(
      K.hands[0][0], K.hands[1][0], K.feet[0][0], K.feet[1][0],
    ) * BODY_H;
  }
  strikeTipCache.set(poseId, tip);
  return tip;
}









const BODY_FRONT = 0.12 * BODY_H;




















function playExchange(f, opts) {
  const { leftAttacks } = opts;
  let { lx, rx } = opts;

  const spec = ATTACKS[opts.attack];
  if (spec && opts.connects) {
    const contactPose = spec.frames[spec.hitFrame][0];
    const maxGap = strikeTip(contactPose) + spec.reach * 0.52 + BODY_FRONT;
    const gap = Math.abs(rx - lx);
    const pull = gap - maxGap;
    
    
    
    
    
    
    
    if (pull > 4) {
      if (leftAttacks) lx += pull; else rx -= pull;
      f.arriveAt(lx, rx);
    }
  }

  const rows = exchange({
    ...opts,
    lx,
    rx,
    attX: leftAttacks ? lx : rx,
    defX: leftAttacks ? rx : lx,
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
    const chase = t < 0.15 ? 0 : t > 0.8 ? 1 : (t - 0.15) / 0.65;
    const cx = lerp(from, to, easeIn(chase));
    const ox = lerp(otherFrom, otherTo, easeIn(Math.min(1, t / 0.8)));
    const chaser = st(t < 0.15 ? 'crouch' : t > 0.8 ? 'knee' : 'step-in', cx, 0,
      leftChases ? 1 : -1);
    const fleeing = st(t > 0.8 ? 'block-mid' : 'step-back', ox, 0,
      leftChases ? -1 : 1);
    return leftChases ? { a: chaser, b: fleeing } : { a: fleeing, b: chaser };
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  f.push(7, (i) => {
    const shoveP = i < 2 ? 'cross' : i < 4 ? 'cross-out' : 'step-back';
    const pushedP = i < 2 ? 'block-mid' : 'step-back';
    
    const shoveX = lerp(otherTo, otherFrom, i < 4 ? 0 : easeOut((i - 3) / 3));
    const pushedX = lerp(to, from, i < 2 ? 0 : easeOut((i - 1) / 5));
    const hit = i === 2 ? { x: (to + otherTo) / 2, power: 0.7 } : null;
    return leftChases
      ? { a: st(pushedP, pushedX, 0, 1), b: st(shoveP, shoveX, 0, -1), hit }
      : { a: st(shoveP, shoveX, 0, 1), b: st(pushedP, pushedX, 0, -1), hit };
  });
}


















function splitsDodge(f, { lx, rx, leftDodges }) {
  const face = leftDodges ? 1 : -1;          
  const put = (dodger, kicker) => f.ticks.push(leftDodges
    ? { a: dodger, b: kicker, rate: 1 }
    : { a: kicker, b: dodger, rate: 1 });
  const dx = leftDodges ? lx : rx;
  const kx = leftDodges ? rx : lx;

  const beats = [
    
    
    
    
    
    ['guard', 'guard', 0, 2],
    ['crouch', 'round-mid', 12, 2],
    ['splits-mid', 'roundhouse', 30, 2],   
    ['splits', 'roundhouse', 30, 3],
    ['splits', 'round-mid', 20, 2],
    ['splits-mid', 'guard', 8, 2],
    ['crouch', 'block-mid-in', 2, 2],
    ['upper-mid', 'block-low', 0, 2],
    ['uppercut', 'hit-head-mid', -4, 2],   
    ['uppercut', 'hit-head', -10, 2],
    ['guard', 'stagger', -16, 2],
    ['guard', 'guard', 0, 2],
  ];
  beats.forEach(([dPose, kPose, lean, n], row) => {
    for (let i = 0; i < n; i += 1) {
      put(st(dPose, dx, 0, face), st(kPose, kx - face * lean, 0, -face));
      
      if (row === 8 && i === 0) {
        f.ticks[f.ticks.length - 1].hit = { x: (dx + kx) / 2, power: 1 };
      }
    }
  });
}
















function leapIn(f, { lx, rx, leftLeaps }) {
  const face = leftLeaps ? 1 : -1;
  const put = (leaper, other) => f.ticks.push(leftLeaps
    ? { a: leaper, b: other, rate: 1 }
    : { a: other, b: leaper, rate: 1 });
  const lFrom = leftLeaps ? lx : rx;
  const oFrom = leftLeaps ? rx : lx;
  
  
  
  
  
  const oTo = oFrom + face * 54;
  const lTo = oTo - face * (RIGHT_HOME - LEFT_HOME);

  
  for (let i = 0; i < 8; i += 1) {
    const u = Math.min(1, Math.max(0, (i - 2) / 5));
    const airborne = i >= 2 && i < 7;
    put(st(i < 3 ? 'guard' : i < 6 ? 'crouch' : 'jump-load', lFrom, 0, face),
      st(i < 2 ? 'jump-load' : airborne ? 'jump-back' : 'land',
        lerp(oFrom, oTo, easeOut(u)), airborne ? arc(u) * 30 : 0, -face));
  }

  
  
  
  for (let i = 0; i < 12; i += 1) {
    const u = Math.min(1, i / 8);
    const lp = i < 2 ? 'jump-launch' : i < 7 ? 'jump-fwd' : i <= 8 ? 'jump-fall'
      : i < 11 ? 'land' : 'crouch';
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const cover = i < 4 ? 'guard' : i < 6 ? 'block-high-in'
      : i < 10 ? 'block-high' : 'block-mid-in';
    put(st(lp, lerp(lFrom, lTo, easeOut(u)), i <= 8 ? arc(u) * 62 : 0, face),
      st(cover, oTo, 0, -face));
    if (i === 9) f.ticks[f.ticks.length - 1].land = { x: lTo };
  }
}





function sceneCorner(f, { tag, leftPressed, count = 10 }) {
  f.mark(tag);
  const wall = leftPressed ? 84 : 418;
  const front = leftPressed ? wall + 104 : wall - 104;
  
  
  
  
  
  f.walkTo(14, leftPressed ? wall : front, leftPressed ? front : wall,
    { pose: leftPressed ? 'step-back' : 'step-in' });
  
  
  
  const menu = ['jab', 'jab', 'cross', 'hook', 'knee', 'uppercut', 'jab',
    'kick-low', 'kick-body', 'arch'];
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
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const WALK = 60;
  const line0 = OPENING[0];
  
  
  
  
  const SAY_FROM = WALK - line0.ticks;
  f.push(WALK, (i) => {
    const { stepping, u } = stride(i, WALK);
    const e = easeInOut(u);
    
    const fade = i < 24 ? 1 - i / 24 : 0;
    const lx = lerp(START_L, LEFT_HOME - 18, e);
    const rx = lerp(START_R, RIGHT_HOME + 18, e);
    const step = stepping ? 'step-in' : 'idle';
    const row = { a: st(step, lx, 0, 1), b: st(step, rx, 0, -1), fade };
    if (i >= SAY_FROM) {
      row.say = { who: line0.who, text: line0.text, i: i - SAY_FROM, n: line0.ticks };
    }
    return row;
  });
  
  f.push(14, (i) => {
    const { stepping, u } = stride(i, 14);
    const e = easeIn(u);
    const p = stepping ? 'step-in' : 'guard';
    return {
      a: st(p, lerp(LEFT_HOME - 18, LEFT_HOME, e), 0, 1),
      b: st(p, lerp(RIGHT_HOME + 18, RIGHT_HOME, e), 0, -1),
    };
  });
}























function sceneOpening(f) {
  f.mark('opening');
  const CLOSE = 16;

  const lx = LEFT_HOME;
  const rx = RIGHT_HOME;

  
  
  const CLASH = [['guard', 2], ['jab-mid', 2], ['jab', 3], ['jab-mid', 2]];
  const seq = [];
  for (const [pose, hold] of CLASH) for (let k = 0; k < hold; k += 1) seq.push(pose);
  f.push(seq.length, (i) => {
    const pose = seq[i];
    
    
    
    const lean = pose === 'jab-mid' ? 9 : pose === 'jab' ? 14 : 0;
    const row = {
      a: st(pose, lx + lean, 0, 1),
      b: st(pose, rx - lean, 0, -1),
    };
    
    
    
    if (i === 4) row.hit = { x: (lx + rx) / 2, power: 0.8 };
    return row;
  });

  
  f.push(10, (i) => {
    const { stepping, u } = stride(i, 10);
    const e = easeOut(u);
    const p = stepping ? 'step-back' : 'guard';
    return {
      a: st(p, lerp(lx + 14, LEFT_HOME, e), 0, 1),
      b: st(p, lerp(rx - 14, RIGHT_HOME, e), 0, -1),
    };
  });

  
  
  
  
  
  
  
  
  
  for (const line of OPENING.slice(1)) {
    f.push(line.ticks, (i) => ({
      a: st(line.who === 'a' ? 'talk' : 'guard', LEFT_HOME, 0, 1),
      b: st(line.who === 'b' ? 'talk' : 'guard', RIGHT_HOME, 0, -1),
      say: { who: line.who, text: line.text, i, n: line.ticks },
    }));
  }
}


function sceneFeelOut(f) {
  f.mark('feel-out');
  
  
  
  
  
  
  
  
  const order = ['jab', 'jab', 'kick-low', 'jab', 'cross', 'hook', 'jab', 'kick-body',
    'jab', 'cross', 'kick-high', 'jab', 'arch', 'knee', 'jab', 'kick-low',
    'cross', 'jab', 'hook', 'roundhouse', 'jab', 'knee', 'cross', 'jab',
    'kick-high', 'jab', 'spin-kick', 'jab', 'kick-low', 'cross'];
  order.forEach((attack, k) => {
    playExchange(f, {
      attack,
      leftAttacks: k % 2 === 0,
      lx: LEFT_HOME,
      rx: RIGHT_HOME,
      connects: k === 4 || k === 7,
    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const gap = 5 + Math.floor(f.rand() * 3);
    f.resetStance(LEFT_HOME, RIGHT_HOME, { ticks: gap, out: 7 });
  });
}


function sceneFlurry(f, { seedTag, count, closeIn = 0 }) {
  f.mark(seedTag);
  const lx = LEFT_HOME + closeIn;
  const rx = RIGHT_HOME - closeIn;
  
  
  f.arriveAt(lx, rx);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const menu = ['kick-low', 'knee', 'kick-body', 'jab', 'cross', 'hook', 'arch',
    'kick-high', 'roundhouse', 'spin-kick', 'uppercut'];
  let pick = 3;
  for (let k = 0; k < count; k += 1) {
    pick = Math.max(0, Math.min(menu.length - 1,
      pick + Math.round((f.rand() - 0.5) * 4)));
    const last = f.rand() < 0.5;
    playExchange(f, {
      attack: menu[pick],
      leftAttacks: last,
      lx,
      rx,
      connects: f.rand() < 0.42,
    });
    
    
    
    
    
    
    
    
    
    
    if (f.rand() < 0.30) {
      const extra = 1 + Math.floor(f.rand() * 2);
      for (let c = 0; c < extra; c += 1) {
        pick = Math.max(0, Math.min(menu.length - 1, pick + (f.rand() < 0.5 ? 1 : -1)));
        playExchange(f, {
          attack: menu[pick],
          leftAttacks: last,
          lx,
          rx,
          connects: f.rand() < 0.55,
        });
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    f.resetStance(lx, rx);
    
    if (k % 8 === 7) dash(f, { lx, rx, leftChases: f.rand() < 0.5, ticks: 9 });
    if (k % 11 === 5) whiffCounter(f, { lx, rx, leftAttacks: f.rand() < 0.5 });
    
    
    
    
    if (k % 23 === 11) splitsDodge(f, { lx, rx, leftDodges: f.rand() < 0.5 });
  }
}





function sceneJump(f, { attacker = 'b', pose = 'air-kick', connects = true } = {}) {
  f.mark('jump');
  const leftJumps = attacker === 'a';
  const jx = leftJumps ? LEFT_HOME : RIGHT_HOME;
  const ox = leftJumps ? RIGHT_HOME : LEFT_HOME;
  const face = leftJumps ? 1 : -1;
  
  f.arriveAt(leftJumps ? jx : ox, leftJumps ? ox : jx);
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
    
    
    
    
    
    
    
    const cover = t < 0.18 ? 'guard' : t < 0.30 ? 'block-high-in'
      : t < 0.62 ? 'block-high' : t < 0.80 ? 'block-high-in' : 'block-mid-in';
    put(st(p, x, y, face),
      st(connects && t > 0.55 ? 'hit-head' : cover, ox, 0, -face));
    if (hit) f.ticks[f.ticks.length - 1].hit = { x: (x + ox) / 2, power: 1 };
  }
  
  
  
  for (let i = 0; i < 14; i += 1) {
    put(st(i < 4 ? 'land' : i < 7 ? 'crouch' : 'guard', land, 0, face),
      st(connects && i < 6 ? 'stagger' : connects && i < 10 ? 'hit-body' : 'guard', ox, 0, -face));
    if (i === 0) f.ticks[f.ticks.length - 1].land = { x: land };
  }
}























































export const OPENING = [
  { who: 'b', text: 'You again.', ticks: 40 },
  { who: 'a', text: 'Me again.', ticks: 34 },
];

export const DIALOGUE = [
  { who: 'a', text: 'Not bad, kid.', ticks: 34 },
  { who: 'b', text: 'You are slow.', ticks: 34 },
  
  
  
  { who: 'a', text: 'Slow?', ticks: 32 },
  { who: 'b', text: 'You telegraph.', ticks: 36 },
  { who: 'a', text: 'And yet.', ticks: 32 },
  { who: 'b', text: 'And yet nothing.', ticks: 38 },
  { who: 'a', text: 'Then stop talking.', ticks: 40 },
  { who: 'b', text: 'Show me.', ticks: 30 },
];

function sceneStandoff(f) {
  f.mark('standoff');
  
  
  
  
  
  
  
  
  f.push(14, (i) => {
    const e = easeOut(Math.min(1, i / 5));
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
      
      
      
      
      
      
      
      
      
      
      
      const listening = Math.floor(i / 7) % 2 ? 'idle-breathe' : 'talk';
      
      
      
      
      
      
      
      
      
      
      
      
      
      const sway = Math.sin(t * Math.PI * 2) * 5;
      return {
        a: st(line.who === 'a' ? speaking : listening, lx + sway, 0, 1),
        b: st(line.who === 'b' ? speaking : listening, rx - sway, 0, -1),
        say: { who: line.who, text: line.text, i, n: line.ticks },
      };
    });
  }

  
  
  
  
  
  f.push(16, (i) => {
    
    
    
    const talking = i < 5;
    const { stepping, u } = stride(i - 5, 11);
    const e = talking ? 0 : easeIn(u);
    const p = talking ? 'talk' : stepping ? 'step-in' : 'guard';
    return {
      a: st(p, lerp(lx, LEFT_HOME, e), 0, 1),
      b: st(p, lerp(rx, RIGHT_HOME, e), 0, -1),
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
  
  
  f.arriveAt(LEFT_HOME, RIGHT_HOME);
  
  
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
      
      
      
      
      
      
      
      
      
      
      
      
      
      const clash = Math.abs(t - 0.5) < 0.1;
      const flying = clash ? 'air-punch' : streak ? 'fly-dash' : 'hover';
      const y = 58 + Math.sin(t * Math.PI) * 14;
      return {
        a: st(flying, ax, y, ax < bx ? 1 : -1),
        b: st(flying, bx, y, bx < ax ? 1 : -1),
        
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
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const jit = t < 0.2 ? 0 : (1 + t * 3) * Math.sin(Math.floor(i / 3) * 2.7);
    const lift = t * 3 * Math.abs(Math.sin(i * 1.9));
    return {
      a: st(p, LEFT_HOME - 10 + jit, lift, 1),
      b: st(p, RIGHT_HOME + 10 - jit, lift, -1),
      charge: { level: Math.min(1, t * 1.4) },
    };
  });

  
  
  
  
  
  
  
  
  
  
  f.push(18, (i) => {
    const k = Math.floor(i / 3);
    const rise = 2.2 * Math.abs(Math.sin(i * 3.1));
    return {
      a: st(k % 2 ? 'charge-max' : 'finish-wind', LEFT_HOME - 10, rise, 1),
      b: st(k % 2 ? 'charge-max' : 'finish-wind', RIGHT_HOME + 10, rise, -1),
      charge: { level: 1 },
    };
  });

  
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
  sceneOpening(f);
  sceneFeelOut(f);
  sceneFlurry(f, { seedTag: 'flurry-1', count: 60 });
  
  
  
  
  
  
  
  
  
  f.arriveAt(LEFT_HOME, RIGHT_HOME);
  leapIn(f, { lx: LEFT_HOME, rx: RIGHT_HOME, leftLeaps: true });
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
  f.arriveAt(LEFT_HOME, RIGHT_HOME);
  leapIn(f, { lx: LEFT_HOME, rx: RIGHT_HOME, leftLeaps: false });
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
  
  
  
  
  
  
  
  return posesUsed().filter((p) => bakedPoseFor(p, (id) => MOVE_INDEX[id] !== undefined) === null);
}
