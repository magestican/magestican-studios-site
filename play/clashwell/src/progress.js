



export const SAVE_KEY = 'clashwell.progress';


export const PRIZES = Object.freeze(['jab', 'combo', 'win', 'clash', 'chain3', 'comeback', 'medium', 'hard', 'wins10']);


export const PRIZE_LEVEL = Object.freeze({ medium: 'medium', hard: 'hard' });

const COUNTS = ['jabs', 'combos', 'clashes', 'bestChain', 'wins', 'comebacks', 'lossStreak'];
const BEATABLE = ['easy', 'medium', 'hard'];
const HELP_AFTER = 2;

export const emptyProgress = () => ({ jabs: 0, combos: 0, clashes: 0, bestChain: 0, wins: 0, comebacks: 0, lossStreak: 0, beat: {} });

const count = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function readProgress(raw) {
  let data = null;
  try { data = JSON.parse(raw); } catch { data = null; }
  const p = emptyProgress();
  if (!data || typeof data !== 'object') return p;
  for (const key of COUNTS) p[key] = count(data[key]);
  for (const level of BEATABLE) if (data.beat?.[level] === true) p.beat[level] = true;
  return p;
}

export const createTally = () => ({ jabs: 0, combos: 0, clashes: 0, bestChain: 0, lostFirst: false, rounds: 0 });


export function tallyEvent(t, e, mine) {
  if (e.type === 'fire' && e.from === mine) {
    if (e.kind === 'light') t.jabs += 1;
    else if (e.kind === 'heavy') t.combos += 1;
  } else if (e.type === 'clash' && e.winner === mine) {
    t.clashes += 1;
  } else if (e.type === 'lock' && e.player === mine) {
    
    const chain = e.steps?.some((s) => s.popped > 0) ? e.steps.length : 0;
    t.bestChain = Math.max(t.bestChain, chain);
  } else if (e.type === 'round') {
    if (t.rounds === 0 && e.winner !== mine && e.winner !== null) t.lostFirst = true;
    t.rounds += 1;
  }
  return t;
}

const HELD = {
  jab: (p) => p.jabs > 0,
  combo: (p) => p.combos > 0,
  win: (p) => p.wins > 0,
  clash: (p) => p.clashes > 0,
  chain3: (p) => p.bestChain >= 3,
  comeback: (p) => p.comebacks > 0,
  medium: (p) => !!p.beat.medium,
  hard: (p) => !!p.beat.hard,
  wins10: (p) => p.wins >= 10,
};

export const prizesFrom = (p) => PRIZES.filter((id) => HELD[id](p));


export const nextPrize = (p) => PRIZES.find((id) => !HELD[id](p)) ?? null;





export function finishMatch(before, t, { won, level }) {
  const p = { ...before, beat: { ...before.beat } };
  p.jabs += t.jabs;
  p.combos += t.combos;
  p.clashes += t.clashes;
  const newBestChain = t.bestChain > before.bestChain ? t.bestChain : null;
  p.bestChain = Math.max(before.bestChain, t.bestChain);
  if (won) {
    p.wins += 1;
    if (t.lostFirst) p.comebacks += 1;
    if (BEATABLE.includes(level)) p.beat[level] = true;
    p.lossStreak = 0;
  } else {
    p.lossStreak += 1;
  }
  const had = new Set(prizesFrom(before));
  const prizes = prizesFrom(p).filter((id) => !had.has(id));
  let help = null;
  if (!won && p.lossStreak >= HELP_AFTER) {
    const tip = t.clashes === 0 ? 'tipClash' : (t.combos === 0 ? 'tipCombo' : 'tipLow');
    help = { tip, easier: level === 'medium' || level === 'hard' };
  }
  return { progress: p, prizes, newBestChain, help };
}
