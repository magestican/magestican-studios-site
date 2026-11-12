



import { LETTERS, WORD_STEPS, DINOS, DINO } from './content.js';






export const TIMING = Object.freeze({
  letterGapMs: 1600, 
  wordGapMs: 3200, 
  partyMs: 3600, 
  rainRiseMs: 11000, 
  rainSpawnMs: 2600, 
  rainMax: 3, 
  rainFastestRiseMs: 7000, 
});




export const NOTES = Object.freeze(['D5', 'E5', 'Fs5', 'G5', 'A5', 'B5', 'D6', 'E6', 'Fs6', 'A6']);




const SONG = 'D5 D5 A5 A5 B5 B5 A5 G5 G5 Fs5 Fs5 E5 E5 E5 E5 D5 A5 A5 G5 Fs5 Fs5 E5 A5 G5 Fs5 E5'.split(' ');
export const LETTER_NOTE = Object.freeze(Object.fromEntries(LETTERS.map((l, i) => [l.ch, SONG[i]])));


export function wordTune(len) {
  const n = Math.max(1, len | 0);
  const ladder = ['D5', 'E5', 'Fs5', 'A5', 'B5'];
  const out = [];
  for (let i = 0; i < n - 1; i++) out.push(ladder[Math.min(i, ladder.length - 1)]);
  out.push('D6');
  return out;
}




export function hintFor(misses) {
  if (misses <= 0) return 'none';
  if (misses === 1) return 'glow';
  if (misses === 2) return 'bounce';
  return 'point';
}

const norm = (ch) => String(ch ?? '').toUpperCase();
const isLetter = (ch) => /^[A-Z]$/.test(norm(ch));


export const PARTY_AFTER = Object.freeze(['E', 'J', 'O', 'T', 'Z']);

export function createParade(start = 0) {
  let index = Math.max(0, Math.min(LETTERS.length - 1, start | 0));
  let misses = 0;
  let finished = false;
  return {
    get index() { return index; },
    get finished() { return finished; },
    current() { return LETTERS[index]; },
    
    press(ch) {
      if (finished || !isLetter(ch)) return { kind: 'ignored' };
      const want = LETTERS[index].ch;
      if (norm(ch) !== want) {
        misses += 1;
        return { kind: 'wrong', want, hint: hintFor(misses) };
      }
      const r = { kind: 'right', letter: want, note: LETTER_NOTE[want], party: PARTY_AFTER.includes(want), sticker: want };
      misses = 0;
      if (index === LETTERS.length - 1) { finished = true; r.finished = true; } else index += 1;
      return r;
    },
    restart() { index = 0; misses = 0; finished = false; },
  };
}


export function jamPress(ch) {
  if (!isLetter(ch)) return { kind: 'ignored' };
  const c = norm(ch);
  return { kind: 'right', letter: c, note: LETTER_NOTE[c] };
}


export const ROUND_WORDS = 8;


export function pickRound(stepId, rand = Math.random, count = ROUND_WORDS) {
  const step = WORD_STEPS.find((s) => s.id === stepId) || WORD_STEPS[0];
  const pool = step.words.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).map(([word, pic]) => ({ word, pic }));
}

export function createSpeller(words) {
  const list = words.slice();
  let w = 0;
  let pos = 0;
  let misses = 0;
  const tune = () => wordTune(list[w].word.length);
  return {
    get wordIndex() { return w; },
    get pos() { return pos; },
    get total() { return list.length; },
    current() { return list[w]; },
    want() { return list[w] ? list[w].word[pos].toUpperCase() : null; },
    press(ch) {
      if (w >= list.length || !isLetter(ch)) return { kind: 'ignored' };
      const want = list[w].word[pos].toUpperCase();
      if (norm(ch) !== want) {
        misses += 1;
        return { kind: 'wrong', want, hint: hintFor(misses) };
      }
      misses = 0;
      const note = tune()[pos];
      pos += 1;
      const r = { kind: 'right', letter: want, note, slot: pos - 1 };
      if (pos >= list[w].word.length) {
        r.wordDone = list[w].word;
        r.sticker = list[w].word;
        w += 1;
        pos = 0;
        if (w >= list.length) r.roundDone = true;
      }
      return r;
    },
  };
}



const shuffled = (list, rand) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};


export function createDinoEggs() {
  let index = 0;
  let misses = 0;
  return {
    get index() { return index; },
    get total() { return DINOS.length; },
    get finished() { return index >= DINOS.length; },
    current() { return DINOS[index] || null; },
    press(ch) {
      if (index >= DINOS.length || !isLetter(ch)) return { kind: 'ignored' };
      const d = DINOS[index];
      if (norm(ch) !== d.ch) {
        misses += 1;
        return { kind: 'wrong', want: d.ch, hint: hintFor(misses) };
      }
      misses = 0;
      index += 1;
      const r = { kind: 'right', letter: d.ch, note: LETTER_NOTE[d.ch], dino: d.id, sticker: d.id };
      if (index >= DINOS.length) r.roundDone = true;
      return r;
    },
  };
}

export const MATCH_CHOICES = 3;





export function createDinoMatch(rand = Math.random) {
  const order = shuffled(DINOS, rand);
  const questions = order.map((want) => {
    const used = new Set([want.ch]);
    const others = [];
    for (const d of shuffled(DINOS, rand)) {
      if (others.length >= MATCH_CHOICES - 1) break;
      if (used.has(d.ch)) continue;
      used.add(d.ch);
      others.push(d);
    }
    return { want, choices: shuffled([want, ...others], rand) };
  });
  let q = 0;
  let misses = 0;
  return {
    get index() { return q; },
    get total() { return questions.length; },
    current() { return questions[q] || null; },
    press(ch) {
      if (q >= questions.length || !isLetter(ch)) return { kind: 'ignored' };
      const { want } = questions[q];
      if (norm(ch) !== want.ch) {
        misses += 1;
        return { kind: 'wrong', want: want.ch, dino: want.id, hint: hintFor(misses) };
      }
      misses = 0;
      q += 1;
      const r = { kind: 'right', letter: want.ch, note: LETTER_NOTE[want.ch], dino: want.id };
      if (q >= questions.length) r.roundDone = true;
      return r;
    },
  };
}




export function createRain({ letters = LETTERS.map((l) => l.ch), rand = Math.random } = {}) {
  const pool = letters.length ? letters.slice() : LETTERS.map((l) => l.ch);
  let next = 1;
  let balloons = []; 
  let sinceSpawn = TIMING.rainSpawnMs; 
  let streak = 0;
  let popped = 0;

  const riseMs = () => Math.max(TIMING.rainFastestRiseMs, TIMING.rainRiseMs - Math.min(streak, 20) * 200);

  function spawn() {
    const onScreen = new Set(balloons.map((b) => b.ch));
    const free = pool.filter((c) => !onScreen.has(c));
    const from = free.length ? free : pool;
    const ch = from[Math.floor(rand() * from.length) % from.length];
    
    const used = new Set(balloons.map((b) => b.lane));
    const lanes = [0, 1, 2, 3].filter((l) => !used.has(l));
    const lane = lanes.length ? lanes[Math.floor(rand() * lanes.length) % lanes.length] : 0;
    balloons.push({ id: next++, ch, y: 0, lane, x: (lane + 0.5) / 4 });
  }

  return {
    get balloons() { return balloons; },
    get popped() { return popped; },
    get streak() { return streak; },
    riseMs,
    
    tick(dtMs) {
      const looped = [];
      const dy = dtMs / riseMs();
      for (const b of balloons) {
        b.y += dy;
        if (b.y >= 1) { b.y = 0; looped.push(b.id); streak = 0; }
      }
      sinceSpawn += dtMs;
      if (balloons.length < TIMING.rainMax && sinceSpawn >= TIMING.rainSpawnMs) { spawn(); sinceSpawn = 0; }
      return looped;
    },
    press(ch) {
      if (!isLetter(ch)) return { kind: 'ignored' };
      const c = norm(ch);
      const hits = balloons.filter((b) => b.ch === c).sort((a, b) => a.y - b.y);
      if (!hits.length) return { kind: 'miss', letter: c };
      const b = hits[0];
      balloons = balloons.filter((x) => x !== b);
      popped += 1;
      streak += 1;
      return { kind: 'pop', id: b.id, letter: c, note: LETTER_NOTE[c], sticker: popped % 10 === 0 };
    },
  };
}


export const SAVE_KEY = 'abcjam-v1';

export function loadProgress(storage) {
  const blank = { furthest: 0, letters: [], words: [], pops: 0, stars: 0, dinos: [], found: 0 };
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return blank;
    const p = JSON.parse(raw);
    return {
      furthest: Math.max(0, Math.min(25, p.furthest | 0)),
      letters: Array.isArray(p.letters) ? p.letters.filter(isLetter).map(norm) : [],
      words: Array.isArray(p.words) ? p.words.filter((x) => typeof x === 'string') : [],
      pops: Math.max(0, p.pops | 0),
      stars: Math.max(0, p.stars | 0),
      
      dinos: Array.isArray(p.dinos) ? p.dinos.filter((x) => typeof x === 'string' && DINO[x]) : [],
      found: Math.max(0, p.found | 0),
    };
  } catch { return blank; }
}

export function saveProgress(storage, p) {
  try { storage?.setItem(SAVE_KEY, JSON.stringify(p)); } catch {  }
}


export function resetProgress(storage) {
  const blank = { furthest: 0, letters: [], words: [], pops: 0, stars: 0, dinos: [], found: 0 };
  saveProgress(storage, blank);
  return blank;
}


export function createResetConfirm({ windowMs = 4000, now = () => Date.now() } = {}) {
  let askedAt = -Infinity;
  return {
    press() {
      const t = now();
      if (t - askedAt <= windowMs) { askedAt = -Infinity; return 'reset'; }
      askedAt = t;
      return 'ask';
    },
    cancel() { askedAt = -Infinity; },
  };
}




const stepFull = (p, step) => step.words.every(([w]) => p.words.includes(w));
const ALL_LETTERS = LETTERS.length;
const ALL_STICKERS = LETTERS.length + WORD_STEPS.reduce((n, s) => n + s.words.length, 0) + DINOS.length;
const stickersOf = (p) => p.letters.length + p.words.length + p.dinos.length;

export const FOUND_PRIZE = DINOS.length * 3;
const BALLOON_PRIZES = [25, 50, 100];


export const PRIZES = Object.freeze([
  { id: 'alphabet', pic: 'trophy', done: (p) => p.letters.length >= ALL_LETTERS },
  ...WORD_STEPS.map((s, i) => ({ id: `words-${s.id}`, pic: ['star', 'rainbow', 'sun'][i] || 'star', size: s.size, done: (p) => stepFull(p, s) })),
  ...BALLOON_PRIZES.map((n, i) => ({ id: `balloons-${n}`, pic: ['balloon', 'kite', 'sparkle'][i], n, done: (p) => p.pops >= n })),
  { id: 'dinos', pic: 'dino_egg', done: (p) => p.dinos.length >= DINOS.length },
  { id: 'dinos-found', pic: 't_rex', n: FOUND_PRIZE, done: (p) => p.found >= FOUND_PRIZE },
  { id: 'book', pic: 'heart', done: (p) => stickersOf(p) >= ALL_STICKERS },
].map(Object.freeze));


export function prizesFor(p) {
  return PRIZES.filter((z) => z.done(p)).map((z) => z.id);
}


export function newPrizes(had, p) {
  const before = new Set(had);
  return prizesFor(p).filter((id) => !before.has(id));
}


export function nextGoal(p) {
  if (p.letters.length < ALL_LETTERS) return { go: 'parade' };
  
  if (p.dinos.length < DINOS.length) return { go: 'eggs' };
  const step = WORD_STEPS.find((s) => !stepFull(p, s));
  if (step) return { go: 'words', step: step.id };
  if (p.found < FOUND_PRIZE) return { go: 'match' };
  if (p.pops < BALLOON_PRIZES[BALLOON_PRIZES.length - 1]) return { go: 'rain' };
  return { go: 'jam' };
}


export function meters(p) {
  const words = WORD_STEPS.reduce((n, s) => n + s.words.length, 0);
  const next = BALLOON_PRIZES.find((n) => p.pops < n);
  const prev = [...BALLOON_PRIZES].reverse().find((n) => p.pops >= n) || 0;
  return {
    parade: Math.min(1, p.letters.length / ALL_LETTERS),
    words: Math.min(1, p.words.length / words),
    rain: next ? (p.pops - prev) / (next - prev) : 1,
    eggs: Math.min(1, p.dinos.length / DINOS.length),
    match: Math.min(1, p.found / FOUND_PRIZE),
    stickers: Math.min(1, stickersOf(p) / ALL_STICKERS),
  };
}


export function addSticker(p, kind, id) {
  const list = kind === 'word' ? p.words : kind === 'dino' ? p.dinos : p.letters;
  if (list.includes(id)) return false;
  list.push(id);
  return true;
}
