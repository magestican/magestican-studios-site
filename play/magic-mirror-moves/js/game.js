



export const LEVELS = {
  little: {
    window: 7,
    round: 75,
    deck: ['arms_up', 'star', 'jump', 'squat', 'crown', 'flap'],
    stars: [4000, 10000], 
    twistAt: Number.POSITIVE_INFINITY,
  },
  big: {
    window: 4.5,
    round: 60,
    deck: ['arms_up', 'star', 'flap', 'jump', 'squat', 'twirl', 'wand', 'boo', 'crown'],
    stars: [5000, 12000], 
    twistAt: 30,
  },
};

export const FINALE_S = 10; 
const GAP_S = 0.8; 
const POWER_EVERY = 5; 
const COMBO_CAP = 4;
const MIRROR_COMBO_S = 4; 
const TUTORIAL_GIVE_UP_S = 15; 




export const COMBO_S = 2.5;
const COMBO_BONUS = 250;
export const COMBOS = [
  { id: 'lift_off', first: 'squat', second: 'jump', name: 'Lift-off!' },
  { id: 'supernova', first: 'jump', second: 'star', name: 'Star burst!' },
  { id: 'spell_storm', first: 'twirl', second: 'wand', name: 'Spell storm!' },
  { id: 'royal_welcome', first: 'arms_up', second: 'crown', name: 'Royal welcome!' },
  { id: 'take_off', first: 'flap', second: 'jump', name: 'Take-off!' },
  { id: 'spooky_surprise', first: 'boo', second: 'twirl', name: 'Spooky surprise!' },
  { id: 'power_surge', first: 'crown', second: 'arms_up', name: 'Power surge!' }, 
];


function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}














export function createGame({ mode = 'show', level = 'little', seed = 1, tutorial = true } = {}) {
  const s = {
    mode,
    level,
    phase: mode === 'mirror' || !tutorial ? 'play' : 'tutorial',
    clock: 0,
    score: 0,
    streak: 0,
    hits: 0,
    best: 0,
    card: null,
    gap: 0,
    sinceHit: 0,
    finale: false,
    stars: 0,
    rand: rng(seed),
    lastMove: null,
    time: 0, 
    prev: null, 
    combos: [], 
  };
  if (s.phase === 'tutorial') s.card = { moves: ['arms_up'], step: 0, age: 0, window: Number.POSITIVE_INFINITY };
  return s;
}

const roundLength = (s) => LEVELS[s.level].round;
export const timeLeft = (s) => Math.max(0, roundLength(s) - s.clock);


function deal(s, visible) {
  const L = LEVELS[s.level];
  const pool = L.deck.filter((m) => visible.has(m));
  const pickFrom = pool.length ? pool : ['arms_up'];
  const pick = () => {
    const options = pickFrom.length > 1 ? pickFrom.filter((m) => m !== s.lastMove) : pickFrom;
    const m = options[Math.floor(s.rand() * options.length)];
    s.lastMove = m;
    return m;
  };
  const twist = s.clock >= L.twistAt && pickFrom.length > 1 && s.rand() < 0.5;
  const moves = twist ? [pick(), pick()] : [pick()];
  const window = L.window * (twist ? 1.6 : 1) * (s.finale ? 0.8 : 1);
  s.card = { moves, step: 0, age: 0, window };
  return { type: 'card', moves, window };
}


function chain(s, move, ev) {
  const p = s.prev;
  const c = p && s.time - p.t <= COMBO_S ? COMBOS.find((x) => x.first === p.move && x.second === move) : undefined;
  if (c) {
    s.prev = null; 
    if (!s.combos.includes(c.id)) s.combos.push(c.id);
    return c;
  }
  s.prev = { move, t: s.time };
  const next = COMBOS.find((x) => x.first === move);
  if (next) ev.push({ type: 'hint', next: next.second, for: COMBO_S });
  return undefined;
}

function score(s, base, at, move, hand, ev) {
  s.streak += 1;
  s.hits += 1;
  const combo = Math.min(COMBO_CAP, s.streak);
  const after = []; 
  const c = chain(s, move, after);
  const points = Math.round(base) * combo + (c ? COMBO_BONUS : 0);
  s.score += points;
  const power = s.hits % POWER_EVERY === 0;
  
  const hit = { type: 'hit', move, points, combo, power, finale: s.finale, at, hand };
  if (c) {
    hit.spell = c.id;
    hit.name = c.name;
  }
  ev.push(hit, ...after);
}







export function step(s, dt, input = {}) {
  
  const ev = [];
  const hits = input.hits ?? [];
  const visible = input.visible ?? new Set(LEVELS[s.level].deck);
  if (s.phase === 'result') return ev;
  s.time += dt;

  if (s.mode === 'mirror') {
    s.sinceHit += dt;
    if (s.sinceHit > MIRROR_COMBO_S) s.streak = 0;
    for (const h of hits) {
      s.sinceHit = 0;
      score(s, 100, h.at, h.move, h.hand, ev);
    }
    return ev;
  }

  if (s.phase === 'tutorial') {
    s.card.age += dt;
    const h = hits.find((x) => x.move === 'arms_up');
    if (h) score(s, 100, h.at, h.move, h.hand, ev);
    if (h || s.card.age > TUTORIAL_GIVE_UP_S) {
      s.phase = 'play';
      s.card = null;
      s.gap = GAP_S;
      ev.push({ type: 'start' });
    } else if (input.partial?.includes('arms_up')) ev.push({ type: 'nearly', move: 'arms_up' });
    return ev;
  }

  
  s.clock += dt;
  if (!s.finale && timeLeft(s) <= FINALE_S) {
    s.finale = true;
    ev.push({ type: 'finale' });
  }
  if (timeLeft(s) <= 0) {
    s.phase = 'result';
    s.card = null;
    const [two, three] = LEVELS[s.level].stars;
    s.stars = s.score >= three ? 3 : s.score >= two ? 2 : 1; 
    ev.push({ type: 'end', score: s.score, stars: s.stars, hits: s.hits });
    return ev;
  }

  if (!s.card) {
    s.gap -= dt;
    if (s.gap <= 0) ev.push(deal(s, visible));
    return ev;
  }

  const card = s.card;
  card.age += dt;
  const want = card.moves[card.step];
  const h = hits.find((x) => x.move === want);
  if (h) {
    if (card.step + 1 < card.moves.length) {
      card.step += 1;
      ev.push({ type: 'step', move: want, at: h.at, hand: h.hand });
      chain(s, want, ev);
    } else {
      const speed = Math.max(0, 1 - card.age / card.window);
      score(s, 100 * card.moves.length + 50 * speed, h.at, want, h.hand, ev);
      s.card = null;
      s.gap = GAP_S;
    }
  } else if (card.age >= card.window) {
    s.streak = 0;
    ev.push({ type: 'miss', moves: card.moves });
    s.card = null;
    s.gap = GAP_S * 0.5;
  } else if (input.partial?.includes(want)) ev.push({ type: 'nearly', move: want });
  return ev;
}
