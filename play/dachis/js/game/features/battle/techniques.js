













export const NEW_KINDS = ['beam', 'flurry', 'slam', 'trap', 'drain', 'hex', 'shield'];
export const KIND_LABEL = {
  dash: 'dash', bolt: 'shot', burst: 'area', heal: 'heal', guard: 'guard', rage: 'power up',
  beam: 'beam', flurry: 'flurry', slam: 'slam', trap: 'trap', drain: 'drain', hex: 'status', shield: 'reflect',
};
export const MELEE = new Set(['basic', 'dash', 'flurry', 'slam', 'counter']);
export const SHOTS = new Set(['bolt', 'hex', 'drain']);        
export const isMelee = kind => MELEE.has(kind);
export const isShot = kind => SHOTS.has(kind);

export const reflects = kind => SHOTS.has(kind) || kind === 'beam';

export const interrupts = kind => kind === 'dash' || kind === 'flurry' || kind === 'slam' || kind === 'counter';


export const BEAM_TIME = 1.0, BEAM_TICK = 0.2, BEAM_SHARE = 0.22, BEAM_LEN = 7, BEAM_HALF = 0.55, BEAM_TURN = 1.4;
export const FLURRY_HITS = 4, FLURRY_GAP = 0.14, FLURRY_SHARE = 0.26;
export const SLAM_TIME = 0.7, SLAM_R = 2.3, SLAM_HEIGHT = 1.6;
export const TRAP_R = 0.85, TRAP_ARM = 0.5, TRAP_LIFE = 9, MAX_TRAPS = 2;
export const DRAIN_SHARE = 0.5;
export const SHIELD_TIME = 4;

export const slamZ = k => SLAM_HEIGHT * 4 * k * (1 - k);

export function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

export function turnToward(a, want, dt, rate = BEAM_TURN) {
  let d = want - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + Math.max(-rate * dt, Math.min(rate * dt, d));
}

export const trapSpot = (ax, ay, tx, ty) => [ax + (tx - ax) * 0.7, ay + (ty - ay) * 0.7];


export const STATUS = {
  burn: { time: 4, dps: 0.022 },       
  slow: { time: 4, speed: 0.55 },      
  dizzy: { time: 3, miss: 0.5 },       
};
export const STATUS_BY_TYPE = {
  Ember: 'burn', Spark: 'dizzy', Frost: 'slow', Tide: 'slow', Leaf: 'slow', Stone: 'slow', Metal: 'slow',
  Shadow: 'dizzy', Gale: 'dizzy', Light: 'dizzy', Beast: 'dizzy', Spirit: 'dizzy',
};
export const STATUS_COLOR = { burn: '#ff7a3d', slow: '#8fd0ff', dizzy: '#ffe14a' };

export const statusOf = m => (m && (m.kind === 'hex' || m.kind === 'trap') ? STATUS_BY_TYPE[m.type] || 'slow' : null);
export function applyStatus(st, name) { return name ? { ...st, [name]: STATUS[name].time } : st; }

export function tickStatus(st, dt) {
  const out = {};
  let burn = 0;
  for (const k of Object.keys(st)) {
    const t = st[k] - dt;
    if (k === 'burn') burn += STATUS.burn.dps * Math.min(dt, st[k]);
    if (t > 0) out[k] = t;
  }
  return { st: out, burn };
}
export const cleanse = () => ({});
export const hasStatus = st => Object.keys(st).length > 0;
export const speedMult = st => (st.slow > 0 ? STATUS.slow.speed : 1);
export const missChance = st => (st.dizzy > 0 ? STATUS.dizzy.miss : 0);




export const PARRY_WINDOW = 0.32, PARRY_CD = 1.1, PARRY_COUNTER = 60, PARRY_STUN = 0.8, COUNTER_REACH = 2.6;


export function parryOutcome(kind, dist) {
  if (kind === 'finisher') return 'block';
  if (isShot(kind) || kind === 'beam') return 'reflect';
  return dist <= COUNTER_REACH ? 'counter' : 'block';
}
export const canParry = f => f.parryCd <= 0 && !(f.status && f.status.dizzy > 0) && f.stun <= 0;

export const TELL = 0.36;

export const impactIn = (p, tx, ty) => Math.hypot(tx - p.x, ty - p.y) / (Math.hypot(p.vx, p.vy) || 1e-9);

export const DODGE_AWAY = 0.6, WILD_DODGE = 0.18, WILD_PARRY = 0.14;
export function dodgeChance({ stance, spd = 50, wild = false, dizzy = false }) {
  if (dizzy) return 0;
  if (wild) return Math.min(0.3, WILD_DODGE * (0.6 + spd / 120));
  return stance === 'away' ? DODGE_AWAY : 0;
}
