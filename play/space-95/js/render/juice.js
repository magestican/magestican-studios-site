





export const MAX_SHAKE = 0.15;

const WHITE = 0xffffff;
const CREAM = 0xfff3d6;
const ICE = 0x9fe8ff;
const EARTH = 0xc9a37a;
const GOLD = 0xffd34d;
const TEAL = 0x2fe0d0;
const BLOOM = 0xff9ad5;


const ring = (n, color, life, size, r = 0.4, dy = 0.4) => ({ n, color, life, size, r, dy });


export const COMBAT_EVENTS = [
  'stomp',
  'defeat',
  'hurt',
  'bossHit',
  'bossStunned',
  'guardStunned',
  'helmetBonk',
  'bonk',
  'kick',
  'strike',
  'parry',
  'shieldBreak',
  'hatBonk',
  'collapseHit',
  'pound',
  'clodLand',
  'plugYank',
  'lightsOut',
  'prune',
  'pruneCut',
];


export const REWARD_EVENTS = [
  'seed',
  'seedGrab',
  'stamp',
  'pluck',
  'secret',
  'deedEarned',
  'budPop',
  'bloomOpening',
  'pointsPass',
  'checkpoint',
  'clear',
  'ability',
];





export const JUICE = {
  
  stomp: { shake: 0.04, bursts: [ring(5, CREAM, 0.35, 0.1, 0.45, 0.05)] },
  defeat: { shake: 0.03, bursts: [ring(6, WHITE, 0.5, 0.14, 0.5, 0.6)] },
  hurt: { shake: 0.12, bursts: [ring(4, WHITE, 0.3, 0.1, 0.35, 0.6)] },
  bossHit: { shake: 0.15, bursts: [ring(10, WHITE, 0.55, 0.16, 0.8, 0.8)] },
  bossStunned: { shake: 0.1, bursts: [ring(8, WHITE, 0.7, 0.12, 0.7, 1.2)] },
  guardStunned: { shake: 0.06, bursts: [ring(5, WHITE, 0.6, 0.1, 0.4, 1)] },
  helmetBonk: { shake: 0.06, bursts: [ring(4, CREAM, 0.4, 0.1, 0.35, 0.9)] },
  bonk: { shake: 0.05, bursts: [ring(4, CREAM, 0.35, 0.1)] },
  kick: { shake: 0.05, bursts: [ring(4, CREAM, 0.35, 0.1)] },
  strike: { shake: 0.06, bursts: [ring(6, WHITE, 0.35, 0.1, 0.5)] },
  parry: { shake: 0.07, bursts: [ring(8, ICE, 0.4, 0.1, 0.5)] },
  shieldBreak: { shake: 0.1, bursts: [ring(10, ICE, 0.6, 0.14, 0.7)] },
  hatBonk: { shake: 0.05, bursts: [ring(4, CREAM, 0.35, 0.1, 0.35, 0.9)] },
  collapseHit: { shake: 0.08, bursts: [ring(6, EARTH, 0.5, 0.12, 0.6, 0.2)] },
  pound: { shake: 0.08, bursts: [ring(6, EARTH, 0.45, 0.12, 0.7, 0.05)] },
  clodLand: { shake: 0.08, bursts: [ring(5, EARTH, 0.45, 0.12, 0.6, 0.05)] },
  plugYank: { shake: 0.08 },
  lightsOut: { shake: 0.08 },
  prune: { shake: 0.1 },
  pruneCut: { shake: 0.1 },
  
  land: { shake: 0.05, when: (e) => (e.fall ?? 0) > 4 },
  ripple: { shake: 0.06, when: (e) => !!e.big },
  
  seed: { bursts: [ring(4, GOLD, 0.45, 0.07, 0.3)] },
  seedGrab: { bursts: [ring(5, GOLD, 0.45, 0.08, 0.35)] },
  stamp: { shake: 0.02, bursts: [ring(6, GOLD, 0.5, 0.09, 0.45)] },
  pluck: { bursts: [ring(5, GOLD, 0.45, 0.08, 0.35)] },
  secret: { bursts: [ring(10, GOLD, 0.9, 0.11, 0.6, 0.6)] },
  deedEarned: { bursts: [ring(12, GOLD, 1, 0.11, 0.8, 0.9)] },
  budPop: { bursts: [ring(6, BLOOM, 0.5, 0.09, 0.4)] },
  bloomOpening: { bursts: [ring(10, BLOOM, 0.8, 0.1, 0.7, 0.6)] },
  pointsPass: { bursts: [ring(6, GOLD, 0.5, 0.09, 0.45)] },
  checkpoint: { bursts: [ring(8, TEAL, 0.7, 0.1, 0.6, 0.9)] },
  clear: { bursts: [ring(16, GOLD, 1.2, 0.12, 1, 1)] },
  ability: { bursts: [ring(12, TEAL, 1, 0.11, 0.8, 0.8)] },
};

const NONE = Object.freeze({ shake: 0, sparks: Object.freeze([]) });







export function juiceFor(e, opts = {}) {
  const row = JUICE[e.type];
  if (!row || (row.when && !row.when(e))) return { shake: NONE.shake, sparks: [] };
  const shake = Math.min(MAX_SHAKE, row.shake ?? 0) * (opts.reduceMotion ? 0.5 : 1);
  const x = e.x ?? 0;
  const y = e.y ?? 0;
  const sparks = [];
  for (const b of row.bursts ?? []) {
    for (let i = 0; i < b.n; i++) {
      const a = (i / b.n) * Math.PI * 2 + Math.PI / 2;
      sparks.push({ x: x + Math.cos(a) * b.r, y: y + b.dy + Math.sin(a) * b.r, color: b.color, life: b.life, size: b.size });
    }
  }
  return { shake, sparks };
}


export function shakeOffset(amp, t) {
  if (!amp) return { x: 0, y: 0 };
  return { x: Math.sin(t * 91) * amp, y: Math.cos(t * 73) * amp };
}
