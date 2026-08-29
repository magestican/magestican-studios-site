


































const SH = 0.82;
const HIP = 0.52;





export const MOVES = [
  
  {
    id: 'idle', tag: 'ground',
    note: 'Weight settled, hands up but low. The frame everything returns to.',
    hands: [[0.30, 0.60], [0.16, 0.66]], feet: [[-0.22, 0], [0.24, 0]],
    twist: 0.15, air: 0,
  },
  {
    id: 'idle-breathe', tag: 'ground',
    note: 'Same stance a beat later. Alternating the two is the whole idle.',
    hands: [[0.28, 0.63], [0.14, 0.69]], feet: [[-0.22, 0], [0.24, 0]],
    twist: 0.18, air: 0,
  },
  {
    id: 'guard', tag: 'ground',
    note: 'Hands up at the chin, elbows in. Waiting to be hit.',
    hands: [[0.26, 0.78], [0.12, 0.82]], feet: [[-0.20, 0], [0.22, 0]],
    twist: 0.25, air: 0,
  },
  {
    id: 'step-in', tag: 'ground',
    note: 'Lead foot committed forward, weight over it.',
    hands: [[0.32, 0.70], [0.14, 0.74]], feet: [[-0.18, 0], [0.44, 0]],
    twist: 0.30, air: 0,
  },
  {
    id: 'step-back', tag: 'ground',
    note: 'Retreating, hands still up. Sells that a strike was avoided.',
    hands: [[0.22, 0.74], [0.06, 0.78]], feet: [[-0.44, 0], [0.14, 0]],
    twist: 0.10, air: 0,
  },
  {
    id: 'crouch', tag: 'ground',
    note: 'Compressed - the wind-up for every jump, and a duck under a strike.',
    hands: [[0.26, 0.46], [0.10, 0.50]], feet: [[-0.26, 0], [0.28, 0]],
    twist: 0.20, air: 0, squash: 0.80,
  },

  
  {
    id: 'jab', tag: 'strike',
    note: 'Lead hand out fast and shallow, off hand home. Not a committed punch.',
    hands: [[0.74, 0.80], [0.10, 0.80]], feet: [[-0.20, 0], [0.30, 0]],
    twist: 0.55, air: 0,
  },
  {
    id: 'cross', tag: 'strike',
    note: 'The committed one: full extension, chest turned right through it.',
    hands: [[1.00, 0.80], [-0.10, 0.76]], feet: [[-0.26, 0], [0.42, 0]],
    twist: 1.00, air: 0,
  },
  {
    id: 'hook', tag: 'strike',
    note: 'Arm folded and swung round the outside, so it reads as an arc.',
    hands: [[0.86, 0.94], [0.10, 0.64]], feet: [[-0.22, 0], [0.36, 0]],
    twist: 0.85, air: 0,
  },
  {
    id: 'uppercut', tag: 'strike',
    note: 'Driving up from the hip - the hand finishes ABOVE the head.',
    hands: [[0.34, 1.20], [0.16, 0.40]], feet: [[-0.24, 0], [0.34, 0]],
    twist: 0.70, air: 0,
  },
  {
    id: 'kick-low', tag: 'strike',
    note: 'Shin out at knee height, arms counterweighting back.',
    hands: [[0.10, 0.72], [-0.24, 0.66]], feet: [[-0.20, 0], [0.72, 0.22]],
    twist: 0.40, air: 0,
  },
  {
    id: 'kick-high', tag: 'strike',
    note: 'Head height. The one the ending needs.',
    hands: [[0.04, 0.66], [-0.30, 0.78]], feet: [[-0.18, 0], [0.78, 0.86]],
    twist: 0.60, air: 0,
  },
  {
    id: 'knee', tag: 'strike',
    note: 'Close range - knee up, both hands pulling the opponent down onto it.',
    hands: [[0.46, 0.62], [0.34, 0.70]], feet: [[-0.22, 0], [0.34, 0.48]],
    twist: 0.45, air: 0,
  },

  
  {
    id: 'block-high', tag: 'block',
    note: 'Both forearms ABOVE the head. Stops the overhead and the air kick. '
      + 'The hands sit higher than the head deliberately: at the block family '
      + 'extension this pose measured within 0.05 body heights of `guard`, '
      + 'which is two atlas cells drawing the same thing.',
    hands: [[0.30, 1.16], [0.08, 1.20]], feet: [[-0.20, 0], [0.20, 0]],
    twist: 0.30, air: 0,
  },
  {
    id: 'block-mid', tag: 'block',
    note: 'The workhorse block - forearms between the two chests.',
    hands: [[0.40, 0.80], [0.20, 0.74]], feet: [[-0.22, 0], [0.20, 0]],
    twist: 0.45, air: 0,
  },
  {
    id: 'block-low', tag: 'block',
    note: 'Sweeping down across the hips, for the low kick.',
    hands: [[0.52, 0.42], [0.14, 0.62]], feet: [[-0.22, 0], [0.22, 0]],
    twist: 0.40, air: 0,
  },
  {
    id: 'parry', tag: 'block',
    note: 'One hand across, palm out - a deflection rather than a wall.',
    hands: [[0.62, 0.86], [0.08, 0.66]], feet: [[-0.18, 0], [0.26, 0]],
    twist: 0.60, air: 0,
  },

  
  {
    id: 'hit-head', tag: 'react',
    note: 'Head snapped back, arms flung wide and loose. Nothing is guarding.',
    hands: [[0.10, 0.94], [-0.46, 0.86]], feet: [[-0.34, 0], [0.16, 0]],
    twist: -0.55, air: 0,
  },
  {
    id: 'hit-body', tag: 'react',
    note: 'Folded over it. The only pose here with the chest turned AWAY.',
    hands: [[0.22, 0.54], [-0.16, 0.58]], feet: [[-0.30, 0], [0.18, 0]],
    twist: -0.35, air: 0, squash: 0.88,
  },
  {
    id: 'stagger', tag: 'react',
    note: 'Losing the feet backwards, arms out for balance.',
    hands: [[-0.10, 0.88], [-0.52, 0.70]], feet: [[-0.62, 0], [-0.06, 0.10]],
    twist: -0.30, air: 0,
  },
  {
    id: 'knockdown', tag: 'react',
    note: 'Off the floor and travelling. The finisher lands on this.',
    hands: [[-0.30, 0.72], [-0.66, 0.52]], feet: [[-0.50, 0.30], [-0.02, 0.44]],
    twist: -0.60, air: 0.85,
  },

  
  {
    id: 'jump-load', tag: 'jump',
    note: 'Deepest crouch, arms swung BACK. Anticipation, in the classic sense.',
    hands: [[-0.24, 0.44], [-0.40, 0.38]], feet: [[-0.26, 0], [0.28, 0]],
    twist: 0.10, air: 0, squash: 0.74,
  },
  {
    id: 'jump-launch', tag: 'jump',
    note: 'Extending hard, arms thrown up. Feet still just touching.',
    hands: [[0.30, 1.10], [0.02, 1.06]], feet: [[-0.16, 0.04], [0.20, 0.02]],
    twist: 0.20, air: 0.25, squash: 1.10,
  },
  {
    id: 'jump-rise', tag: 'jump',
    note: 'Climbing, legs trailing.',
    hands: [[0.36, 1.04], [-0.06, 0.98]], feet: [[-0.24, 0.22], [0.14, 0.16]],
    twist: 0.25, air: 0.75,
  },
  {
    id: 'jump-apex', tag: 'jump',
    note: 'Weightless: the tuck. Knees up, arms wide.',
    hands: [[0.52, 0.92], [-0.32, 0.90]], feet: [[-0.18, 0.42], [0.26, 0.40]],
    twist: 0.20, air: 1,
  },
  {
    id: 'jump-fall', tag: 'jump',
    note: 'Coming down, legs reaching for the floor.',
    hands: [[0.34, 0.86], [-0.20, 0.94]], feet: [[-0.26, 0.16], [0.30, 0.12]],
    twist: 0.15, air: 0.55,
  },
  {
    id: 'land', tag: 'jump',
    note: 'Absorbing it. Deep, hands down and out - the dust cloud frame.',
    hands: [[0.44, 0.36], [-0.06, 0.32]], feet: [[-0.34, 0], [0.36, 0]],
    twist: 0.10, air: 0, squash: 0.78,
  },

  
  {
    id: 'air-punch', tag: 'air',
    note: 'Diving punch - lead arm locked out, body stretched along it.',
    hands: [[1.06, 0.74], [-0.22, 0.96]], feet: [[-0.58, 0.24], [-0.20, 0.34]],
    twist: 0.90, air: 1,
  },
  {
    id: 'air-kick', tag: 'air',
    note: 'Flying kick, leg out level. The signature airborne attack.',
    hands: [[0.06, 1.00], [-0.34, 0.84]], feet: [[-0.30, 0.30], [0.92, 0.56]],
    twist: 0.55, air: 1,
  },
  {
    id: 'air-guard', tag: 'air',
    note: 'Covering up in mid-air, knees pulled in. Being hit while airborne.',
    
    
    
    
    
    
    
    
    
    
    
    
    
    hands: [[0.26, 0.70], [0.02, 0.96]], feet: [[-0.16, 0.44], [0.22, 0.42]],
    twist: 0.25, air: 1,
  },
  {
    id: 'hover', tag: 'fly',
    note: 'Held aloft, arms out and level, legs trailing. The FLYING pose.',
    hands: [[0.56, 0.90], [-0.42, 0.90]], feet: [[-0.34, 0.28], [0.10, 0.22]],
    twist: 0.20, air: 1,
  },
  {
    id: 'fly-dash', tag: 'fly',
    note: 'Streaking horizontally - one arm forward, everything trailing.',
    hands: [[1.00, 0.86], [-0.48, 0.70]], feet: [[-0.78, 0.34], [-0.44, 0.24]],
    twist: 0.75, air: 1, rot: -34,
  },

  
  {
    id: 'charge', tag: 'special',
    note: 'Fists drawn in low, braced. The Dragon Ball stance.',
    hands: [[-0.10, 0.50], [-0.26, 0.54]], feet: [[-0.34, 0], [0.36, 0]],
    twist: 0.05, air: 0, squash: 0.90,
  },
  {
    id: 'charge-max', tag: 'special',
    note: 'Head back, arms flung out, everything extended. Peak power-up.',
    hands: [[-0.36, 0.96], [-0.52, 0.86]], feet: [[-0.40, 0], [0.42, 0]],
    twist: 0.05, air: 0, squash: 1.08,
  },
  {
    id: 'finish-wind', tag: 'special',
    note: 'Fist cocked all the way back, whole body coiled the wrong way.',
    hands: [[-0.76, 0.70], [0.36, 0.56]], feet: [[-0.34, 0], [0.28, 0]],
    twist: -0.95, air: 0,
  },
  {
    id: 'finish-strike', tag: 'special',
    note: 'The one that ends it - past full extension, everything behind it.',
    hands: [[1.14, 0.82], [-0.28, 0.70]], feet: [[-0.34, 0], [0.56, 0]],
    twist: 1.00, air: 0,
  },
  {
    id: 'victory', tag: 'special',
    note: 'Straightened up, one fist raised. Held on the last beat.',
    hands: [[0.02, 1.22], [-0.24, 0.50]], feet: [[-0.22, 0], [0.24, 0]],
    twist: 0.20, air: 0,
  },
  {
    id: 'defeated', tag: 'special',
    note: 'Down. Sits under the victory pose at the end.',
    hands: [[0.34, 0.16], [-0.30, 0.12]], feet: [[-0.44, 0.06], [0.10, 0.10]],
    twist: -0.20, air: 0, squash: 0.55,
  },

  
  {
    id: 'talk', tag: 'talk',
    note: 'Squared up, hands lowered, not fighting. The standoff.',
    hands: [[0.20, 0.54], [-0.04, 0.50]], feet: [[-0.20, 0], [0.20, 0]],
    twist: 0.10, air: 0,
  },
  {
    id: 'talk-point', tag: 'talk',
    note: 'One hand raised toward the other - saying something, mid-sentence.',
    hands: [[0.66, 0.72], [-0.06, 0.48]], feet: [[-0.20, 0], [0.22, 0]],
    twist: 0.35, air: 0,
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  {
    id: 'arch', tag: 'strike',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    note: 'The overhand. Comes over the top of a guard instead of through it.',
    hands: [[0.08, 0.76], [0.50, 0.88]], feet: [[-0.22, 0], [0.26, 0]],
    twist: 0.72, air: 0,
  },
  {
    id: 'arch-mid', tag: 'strike',
    
    
    
    
    
    
    
    
    note: 'The apex of the arc, fist above the head and outside the shoulder.',
    hands: [[0.09, 0.78], [0.27, 0.97]], feet: [[-0.22, 0], [0.24, 0]],
    twist: 0.45, air: 0,
  },
  {
    id: 'kick-body', tag: 'strike',
    
    
    
    
    
    
    
    
    
    
    
    note: 'Roundhouse to the ribs. The height the fight never had.',
    hands: [[-0.02, 0.64], [-0.28, 0.64]], feet: [[-0.17, 0], [0.62, 0.56]],
    twist: 0.55, air: 0,
  },
  {
    id: 'kbody-mid', tag: 'strike',
    note: 'Chambered: knee up and across, shin still folded.',
    hands: [[0.02, 0.66], [-0.22, 0.66]], feet: [[-0.20, 0], [0.26, 0.30]],
    twist: 0.40, air: 0,
  },
  {
    id: 'roundhouse', tag: 'strike',
    note: 'The van damme one. Flatter and further out than kick-high.',
    hands: [[-0.02, 0.64], [-0.34, 0.74]], feet: [[-0.15, 0], [0.70, 0.70]],
    twist: 0.80, air: 0,
  },
  {
    id: 'round-mid', tag: 'strike',
    note: 'Hip already turned over, leg still coming through.',
    hands: [[-0.04, 0.65], [-0.30, 0.70]], feet: [[-0.18, 0], [0.30, 0.44]],
    twist: 0.62, air: 0,
  },
  {
    id: 'spin-kick', tag: 'strike',
    note: 'Turning kick. The body has come round with it, so the sprite leans.',
    hands: [[-0.20, 0.60], [-0.44, 0.70]], feet: [[-0.13, 0], [0.66, 0.62]],
    twist: -0.75, air: 0, rot: 14,
  },
  {
    id: 'spin-mid', tag: 'strike',
    note: 'Back to the opponent, mid-turn, before the leg comes out.',
    hands: [[-0.30, 0.66], [-0.10, 0.72]], feet: [[-0.20, 0], [0.18, 0.18]],
    twist: -0.40, air: 0,
  },
  {
    id: 'splits', tag: 'ground',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    note: 'All the way down, legs straight out either side. The Van Damme.',
    hands: [[0.34, 0.10], [-0.30, 0.14]], feet: [[-0.57, 0], [0.57, 0]],
    twist: 0.10, air: 0, pelvis: 0.085,
  },
  {
    id: 'splits-mid', tag: 'ground',
    
    
    
    
    
    
    
    
    
    note: 'Halfway down, weight still on the hands.',
    hands: [[0.30, 0.22], [-0.28, 0.26]], feet: [[-0.47, 0], [0.50, 0]],
    twist: 0.10, air: 0, pelvis: 0.24,
  },
  {
    id: 'jump-fwd', tag: 'air',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    note: 'Broad jump. Leading knee up, trailing leg out behind.',
    hands: [[0.44, 0.92], [-0.20, 0.70]], feet: [[-0.46, 0.34], [0.32, 0.36]],
    twist: 0.35, air: 0.85, rot: -12,
  },
  {
    id: 'jump-back', tag: 'air',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    note: 'Bailing out backwards - knees pulled in, hands still up.',
    hands: [[0.02, 0.94], [0.26, 1.00]], feet: [[0.08, 0.34], [0.28, 0.30]],
    twist: 0.10, air: 0.85, rot: 10,
  },
];


export const MOVE_INDEX = Object.fromEntries(MOVES.map((m, i) => [m.id, i]));


export const MOVE_IDS = MOVES.map((m) => m.id);


export function tagged(tag) {
  return MOVES.filter((m) => m.tag === tag).map((m) => m.id);
}

























export const REACH = {
  
  
  
  
  
  
  
  
  
  
  shoulder: { x: 0.101, z: 0.691 },
  hip: { x: 0.061, z: 0.473 },
  arm: 0.335,
  leg: 0.508,
  
  
  margin: 0.94,
  
  
  
  legMargin: 0.995,
};










































const DROP = {
  idle: 0.025, 'idle-breathe': 0.026, guard: 0.029, 'step-in': 0.028,
  'step-back': 0.028, crouch: 0.05,
  jab: 0.029, cross: 0.03, hook: 0.03, uppercut: 0.035,
  'kick-low': 0.025, 'kick-high': 0.02, knee: 0.03,
  'block-high': 0.025, 'block-mid': 0.029, 'block-low': 0.035, parry: 0.025,
  'hit-head': 0.02, 'hit-body': 0.04, stagger: 0.025,
  'jump-load': 0.06, land: 0.055,
  charge: 0.043, 'charge-max': 0.022, 'finish-wind': 0.037, 'finish-strike': 0.033,
  victory: 0.015, talk: 0.018, 'talk-point': 0.018, defeated: 0.01,
  arch: 0.033, 'arch-mid': 0.028, 'kbody-mid': 0.033,
  'round-mid': 0.03, 'spin-mid': 0.035,
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  'kick-body': 0, roundhouse: 0, 'spin-kick': 0,
};
for (const m of MOVES) if (DROP[m.id] !== undefined) m.drop = DROP[m.id];



sinkUpperBody();










export function reachIssues() {
  const out = [];
  for (const m of MOVES) {
    for (const { p, ax } of anchoredPairs(m.hands, REACH.shoulder.x)) {
      const r = Math.hypot(p[0] - ax, p[1] - shoulderZOf(m))
        / (REACH.arm * REACH.margin);
      if (r > 1.001) out.push({ id: m.id, limb: 'hand', at: p, over: r });
    }
    
    
    
    
    
    const hipZ = m.pelvis !== undefined ? m.pelvis : REACH.hip.z - (m.drop ?? 0);
    for (const { p, ax } of anchoredPairs(m.feet, REACH.hip.x)) {
      const r = Math.hypot(p[0] - ax, p[1] - hipZ) / (REACH.leg * REACH.legMargin);
      if (r > 1.001) out.push({ id: m.id, limb: 'foot', at: p, over: r });
    }
  }
  return out;
}





























const anchoredPairs = (pts, anchorX) => {
  const sorted = [...pts].sort((a, b) => a[0] - b[0]);
  return sorted.map((p, i) => ({ p, ax: i === 0 ? -anchorX : anchorX }));
};

























function sinkOf(m) {
  if (m.pelvis !== undefined) return REACH.hip.z - m.pelvis;
  return m.drop ?? 0;
}


function shoulderZOf(m) {
  return REACH.shoulder.z - sinkOf(m);
}









function sinkUpperBody() {
  for (const m of MOVES) {
    const sink = sinkOf(m);
    if (!sink) continue;
    m.hands = m.hands.map(([x, z]) => [x, z - sink]);
  }
}

function fitToReach() {
  const pullTo = (p, ax, anchorZ, max) => {
    const dx = p[0] - ax;
    const dz = p[1] - anchorZ;
    const d = Math.hypot(dx, dz);
    if (d <= max || d === 0) return p;
    const k = max / d;
    return [ax + dx * k, anchorZ + dz * k];
  };

  for (const m of MOVES) {
    const armMax = REACH.arm * REACH.margin;
    
    
    
    
    
    
    m.hands = anchoredPairs(m.hands, REACH.shoulder.x)
      .map(({ p, ax }) => pullTo(p, ax, shoulderZOf(m), armMax));

    
    
    
    const hipZ = REACH.hip.z - (m.drop ?? 0);
    const legMax = REACH.leg * REACH.legMargin;
    m.feet = anchoredPairs(m.feet, REACH.hip.x).map(({ p, ax }) => {
      if (p[1] > 0.001) return pullTo(p, ax, hipZ, legMax);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const standZ = m.pelvis !== undefined ? m.pelvis : REACH.hip.z;
      const span = Math.sqrt(Math.max(0, legMax * legMax - standZ * standZ));
      return [ax + Math.max(-span, Math.min(span, p[0] - ax)), 0];
    });
  }
}

fitToReach();





















const EXTENSION = {
  ground: 0.54,     
  block: 0.70,      
  talk: 0.46,       
  react: 0.74,      
  strike: 0.99,     
  air: 0.95,
  fly: 0.95,
  special: 0.86,
};
const PER_POSE_EXTENSION = {
  
  
  
  
  
  
  'air-guard': 0.60,
  charge: 0.46, 'charge-max': 0.88, 'finish-wind': 0.80,
  'finish-strike': 1.0, victory: 0.92, defeated: 0.66,
  
  jab: 0.90, cross: 1.0, hook: 0.95, uppercut: 0.88,
  
  
  
  
  
  
  
  
  
  
  
  splits: 0.94, 'splits-mid': 0.90,
};

function setExtension() {
  for (const m of MOVES) {
    const want = PER_POSE_EXTENSION[m.id] ?? EXTENSION[m.tag];
    if (!want) continue;
    const max = REACH.arm * REACH.margin;
    const pairs = anchoredPairs(m.hands, REACH.shoulder.x);
    
    
    
    
    
    
    const shZ = shoulderZOf(m);
    let lead = 0;
    for (const { p, ax } of pairs) {
      lead = Math.max(lead, Math.hypot(p[0] - ax, p[1] - shZ));
    }
    if (lead < 1e-4) continue;
    const k = (want * max) / lead;
    m.hands = pairs.map(({ p, ax }) =>
      [ax + (p[0] - ax) * k, shZ + (p[1] - shZ) * k]);
  }
}

setExtension();
























const LEG_AIM = {
  
  'kick-high': [42, 0.97],
  'kick-low': [-6, 0.95],
  'air-kick': [16, 0.97],
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  'kick-body': [12, 0.99],
  roundhouse: [24, 0.99],
  'spin-kick': [31, 0.99],
};
const LEG_TUCK = {
  
  'jump-apex': [[0.08, 0.15], [0.30, 0.21]],
  'jump-rise': [[-0.06, 0.13], [0.18, 0.10]],
  'jump-fall': [[-0.12, 0.09], [0.22, 0.06]],
  'air-guard': [[0.04, 0.13], [0.26, 0.19]],
  hover: [[-0.12, 0.11], [0.14, 0.15]],
  'fly-dash': [[-0.40, 0.16], [-0.12, 0.11]],
  'air-punch': [[-0.32, 0.14], [-0.04, 0.20]],
  knee: [[-0.14, 0], [0.30, 0.19]],
  knockdown: [[-0.28, 0.15], [0.08, 0.24]],
};

function shapeLegs() {
  for (const m of MOVES) {
    const aim = LEG_AIM[m.id];
    if (aim) {
      const [deg, ext] = aim;
      const r = REACH.leg * REACH.legMargin * ext;
      const a = (deg * Math.PI) / 180;
      
      const feet = [...m.feet].sort((u, v) => u[0] - v[0]);
      feet[1] = [REACH.hip.x + Math.cos(a) * r, REACH.hip.z + Math.sin(a) * r];
      m.feet = feet;
      continue;
    }
    if (LEG_TUCK[m.id]) m.feet = LEG_TUCK[m.id].map((f) => [...f]);
  }
}
shapeLegs();
fitToReach();




























const byId = Object.fromEntries(MOVES.map((m) => [m.id, m]));
const mix = (a, b, t) => a + (b - a) * t;



const pair = (p) => [...p].sort((u, v) => u[0] - v[0]);
const mixPair = (a, b, t) => pair(a).map((p, i) =>
  [mix(p[0], pair(b)[i][0], t), mix(p[1], pair(b)[i][1], t)]);





























export function blendPose(A, B, t) {
  if (!A) return B;
  if (!B || t <= 0) return A;
  if (t >= 1) return B;
  const out = {
    id: `${A.id}~${B.id}`,
    tag: t < 0.5 ? A.tag : B.tag,
    hands: mixPair(A.hands, B.hands, t),
    feet: mixPair(A.feet, B.feet, t),
    twist: mix(A.twist, B.twist, t),
    air: mix(A.air ?? 0, B.air ?? 0, t),
    drop: mix(A.drop ?? 0, B.drop ?? 0, t),
    squash: mix(A.squash ?? 1, B.squash ?? 1, t),
    rot: mix(A.rot ?? 0, B.rot ?? 0, t),
  };
  if (A.pelvis !== undefined && B.pelvis !== undefined) {
    out.pelvis = mix(A.pelvis, B.pelvis, t);
  } else if (A.pelvis !== undefined || B.pelvis !== undefined) {
    
    
    out.pelvis = t < 0.5 ? A.pelvis : B.pelvis;
  }
  return out;
}


export function poseById(id) {
  return byId[id] || null;
}

const TWEENS = [
  
  ['jab-mid', 'guard', 'jab', 0.5, 'strike'],
  ['cross-mid', 'guard', 'cross', 0.45, 'strike'],
  ['cross-out', 'cross', 'step-in', 0.4, 'strike'],
  ['hook-mid', 'guard', 'hook', 0.5, 'strike'],
  ['upper-mid', 'crouch', 'uppercut', 0.5, 'strike'],
  ['klow-mid', 'guard', 'kick-low', 0.5, 'strike'],
  ['khigh-mid', 'guard', 'kick-high', 0.5, 'strike'],   
  ['knee-mid', 'step-in', 'knee', 0.5, 'strike'],
  
  ['hit-head-mid', 'guard', 'hit-head', 0.55, 'react'],
  ['hit-body-mid', 'guard', 'hit-body', 0.55, 'react'],
  ['stagger-mid', 'hit-head', 'stagger', 0.5, 'react'],
  
  ['block-mid-in', 'guard', 'block-mid', 0.5, 'block'],
  ['block-high-in', 'guard', 'block-high', 0.5, 'block'],
];

for (const [id, from, to, t, tag] of TWEENS) {
  const A = byId[from];
  const B = byId[to];
  if (!A || !B) throw new Error(`in-between "${id}" names a pose that does not exist`);
  MOVES.push({
    id,
    tag,
    note: `In-between: ${Math.round(t * 100)}% from ${from} toward ${to}.`,
    hands: mixPair(A.hands, B.hands, t),
    feet: mixPair(A.feet, B.feet, t),
    twist: mix(A.twist, B.twist, t),
    air: mix(A.air, B.air, t),
    squash: mix(A.squash ?? 1, B.squash ?? 1, t),
    rot: mix(A.rot ?? 0, B.rot ?? 0, t),
    tweenOf: [from, to, t],
  });
  MOVE_INDEX[id] = MOVES.length - 1;
  MOVE_IDS.push(id);
}











{
  const cham = byId['khigh-mid'];
  if (cham) cham.feet = [[-0.16, 0], [0.30, 0.22]];
}





fitToReach();

