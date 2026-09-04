









































import { WORDLE_ANSWERS, WORDLE_GUESSES } from './data/wordleWords.js';
import { BEE_PUZZLES } from './data/beePuzzles.js';
import { CONNECTIONS_PUZZLES } from './data/connectionsPuzzles.js';
import { STRANDS_PUZZLES } from './data/strandsPuzzles.js';






export const BANDS = ['easy', 'medium', 'hard'];


export const PIP_SLOTS = 3;





























export const BAND_PIPS = {
  easy: { pips: 1, fill: 'green', label: 'easy' },
  medium: { pips: 2, fill: 'gold', label: 'medium' },
  hard: { pips: 3, fill: 'red', label: 'hard' },
};





const clamp01 = (x) => Math.max(0, Math.min(1, x));









const ramp = (x, lo, hi) => clamp01((x - lo) / (hi - lo));


const blend = (parts) => {
  const total = parts.reduce((s, p) => s + p.weight, 0);
  return parts.reduce((s, p) => s + p.value * p.weight, 0) / total;
};


























const explain = (parts, phrases, band) => {
  const lean = (p) => (p.value - 0.5) * p.weight;
  const want = band === 'easy' ? -1 : (band === 'hard' ? 1 : 0);
  let pick;
  if (want === 0) {
    pick = parts.reduce((a, b) => (Math.abs(lean(a)) >= Math.abs(lean(b)) ? a : b));
  } else {
    
    
    
    const facing = parts.filter((p) => Math.sign(p.value - 0.5) === want);
    const pool = facing.length ? facing : parts;
    pick = pool.reduce((a, b) => (lean(a) * want >= lean(b) * want ? a : b));
  }
  return phrases[pick.name][pick.value >= 0.5 ? 'high' : 'low'];
};


const bandFor = (game, score) => {
  const cut = THRESHOLDS[game];
  return score < cut.easy ? 'easy' : (score >= cut.hard ? 'hard' : 'medium');
};
















const LETTER_RARITY = (() => {
  const count = new Map();
  let total = 0;
  for (const w of WORDLE_GUESSES) {
    for (const c of w) {
      count.set(c, (count.get(c) ?? 0) + 1);
      total += 1;
    }
  }
  const out = new Map();
  for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    
    
    
    out.set(c, -Math.log((count.get(c) ?? 1) / total));
  }
  return out;
})();


const rarityOf = (word) => {
  const letters = [...new Set(word)];
  return letters.reduce((s, c) => s + (LETTER_RARITY.get(c) ?? 3), 0) / letters.length;
};










const COMMON = (() => {
  const set = new Set(WORDLE_GUESSES);
  for (const p of BEE_PUZZLES) for (const a of p.answers) set.add(a);
  for (const p of STRANDS_PUZZLES) for (const w of p.words) set.add(w.w);
  return set;
})();





















function wordleFamily(answer) {
  let worst = 0;
  for (let i = 0; i < answer.length; i += 1) {
    let n = 0;
    for (const w of WORDLE_GUESSES) {
      let ok = true;
      for (let j = 0; j < answer.length; j += 1) {
        if (j !== i && w[j] !== answer[j]) { ok = false; break; }
      }
      if (ok) n += 1;
    }
    if (n > worst) worst = n;
  }
  return worst;
}




const familyCache = new Map();
const familyOf = (answer) => {
  if (!familyCache.has(answer)) familyCache.set(answer, wordleFamily(answer));
  return familyCache.get(answer);
};

function rateWordle(answer) {
  const word = String(answer).toUpperCase();
  const family = familyOf(word);
  const repeats = word.length - new Set(word).size;
  const rarity = rarityOf(word);

  const parts = [
    
    
    
    { name: 'family', value: ramp(family, 2, 10), weight: 0.50 },
    
    
    
    
    
    { name: 'repeats', value: ramp(repeats, 0, 2), weight: 0.25 },
    
    
    
    
    { name: 'rarity', value: ramp(rarity, 2.75, 3.30), weight: 0.25 },
  ];

  const phrases = {
    family: {
      high: `${family} other five-letter words differ from it in one place.`,
      low: `Only ${family} other word${family === 1 ? '' : 's'} differ${family === 1 ? 's' : ''} from it in one place.`,
    },
    repeats: {
      high: `A repeated letter, so a guess buys ${5 - repeats} letters instead of five.`,
      low: 'No repeated letters, so every guess buys five.',
    },
    rarity: {
      high: 'It leans on letters people do not open with.',
      low: 'Common letters throughout, the kind a first guess covers.',
    },
  };

  return { score: blend(parts), parts, phrases };
}





function rateBee(puzzle) {
  const answers = puzzle.answers ?? [];
  const count = answers.length;
  const longest = answers.reduce((n, a) => Math.max(n, a.length), 0);
  const pangrams = answers.filter((a) => new Set(a).size === 7).length;
  const letters = puzzle.letters ?? [];
  const setRarity = letters.reduce((s, c) => s + (LETTER_RARITY.get(c) ?? 3), 0)
    / Math.max(1, letters.length);
  const centreRarity = LETTER_RARITY.get(puzzle.centre) ?? 3;

  const parts = [
    
    
    
    
    
    
    
    
    { name: 'scarcity', value: 1 - ramp(count, 40, 110), weight: 0.35 },
    
    
    
    { name: 'longest', value: ramp(longest, 8, 11), weight: 0.25 },
    
    
    
    
    { name: 'pangrams', value: 1 - ramp(pangrams, 1, 4), weight: 0.20 },
    
    
    
    
    {
      name: 'obscurity',
      value: ramp(setRarity * 0.5 + centreRarity * 0.5, 2.9, 3.5),
      weight: 0.20,
    },
  ];

  const phrases = {
    scarcity: {
      high: `Only ${count} words in the whole hive, so most guesses are refused.`,
      low: `${count} words to find, so most sensible guesses land.`,
    },
    longest: {
      high: `The longest answer is ${longest} letters.`,
      low: `Nothing in it is longer than ${longest} letters.`,
    },
    pangrams: {
      high: pangrams === 1
        ? 'One pangram, and one chance at it.'
        : `Only ${pangrams} pangrams to find.`,
      low: `${pangrams} pangrams, so the big score comes round often.`,
    },
    obscurity: {
      high: `An awkward letter set, with ${puzzle.centre} compulsory.`,
      low: `A friendly letter set, with ${puzzle.centre} compulsory.`,
    },
  };

  return { score: blend(parts), parts, phrases };
}




























const NAME_STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'in', 'on', 'to', 'with', 'you', 'your', 'what',
  'who', 'where', 'can', 'it', 'is', 'are', 'for', 'from', 'at', 'by', 'or',
]);

const nameTokens = (name) => name.toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/)
  .filter((t) => t.length > 2 && !NAME_STOPWORDS.has(t));









const FRAME_NAME = /(^|\s)(kinds?|ways?|things?|what|who|words|parts?|bits?|made|too|in|on|where|how)(\s|$)|_{2,}/i;

const isFrameName = (name) => FRAME_NAME.test(name);


const WORD_CATEGORIES = (() => {
  const map = new Map();
  for (const p of CONNECTIONS_PUZZLES) {
    for (const g of p.groups) {
      for (const w of g.words) {
        if (!map.has(w)) map.set(w, new Set());
        map.get(w).add(g.name);
      }
    }
  }
  return map;
})();

function rateConnections(puzzle) {
  const groups = puzzle.groups ?? [];
  const words = groups.flatMap((g) => g.words);

  
  
  const polysemous = words.filter((w) => (WORD_CATEGORIES.get(w)?.size ?? 1) > 1).length;

  
  
  
  const tokenGroups = new Map();
  groups.forEach((g, i) => {
    for (const t of new Set(nameTokens(g.name))) {
      if (!tokenGroups.has(t)) tokenGroups.set(t, new Set());
      tokenGroups.get(t).add(i);
    }
  });
  const siblings = Math.max(0, ...[...tokenGroups.values()].map((s) => s.size)) - 1;

  const frames = groups.filter((g) => isFrameName(g.name)).length;

  
  
  
  
  const unfamiliar = words.filter((w) => !COMMON.has(w)).length;

  const parts = [
    { name: 'overlap', value: ramp(polysemous, 0, 4), weight: 0.30 },
    { name: 'siblings', value: ramp(siblings, 0, 3), weight: 0.25 },
    { name: 'frames', value: ramp(frames, 0, 3), weight: 0.25 },
    { name: 'unfamiliar', value: ramp(unfamiliar, 2, 9), weight: 0.20 },
  ];

  const phrases = {
    overlap: {
      high: `${polysemous} of the sixteen words look at home in more than one group.`,
      low: 'Every word belongs plainly to one group.',
    },
    siblings: {
      high: 'The four categories are near neighbours of each other.',
      low: 'The four categories are unrelated, so a word rarely tempts you twice.',
    },
    frames: {
      high: frames === 1
        ? 'One category is a word game rather than a plain list.'
        : `${frames} categories are word games rather than plain lists.`,
      low: 'The categories are plain lists rather than word games.',
    },
    unfamiliar: {
      high: 'Several of the words are names rather than everyday words.',
      low: 'Everyday words throughout.',
    },
  };

  return { score: blend(parts), parts, phrases };
}






const COLS = 6;


function pathShape(path) {
  let turns = 0;
  let diagonals = 0;
  let previous = null;
  for (let i = 1; i < path.length; i += 1) {
    const dx = (path[i] % COLS) - (path[i - 1] % COLS);
    const dy = Math.floor(path[i] / COLS) - Math.floor(path[i - 1] / COLS);
    if (dx !== 0 && dy !== 0) diagonals += 1;
    const step = `${dx},${dy}`;
    if (previous !== null && step !== previous) turns += 1;
    previous = step;
  }
  return { turns, diagonals, steps: Math.max(1, path.length - 1) };
}

function rateStrands(puzzle) {
  const words = puzzle.words ?? [];
  const shapes = words.map((w) => pathShape(w.p));
  const steps = shapes.reduce((s, x) => s + x.steps, 0);
  const turniness = shapes.reduce((s, x) => s + x.turns, 0) / steps;
  const diagonality = shapes.reduce((s, x) => s + x.diagonals, 0) / steps;
  const spanLength = (puzzle.spangram ?? '').length;

  const parts = [
    
    
    
    
    
    { name: 'turns', value: ramp(turniness, 0.52, 0.72), weight: 0.30 },
    
    
    
    
    { name: 'spangram', value: 1 - ramp(spanLength, 7, 11), weight: 0.25 },
    
    
    
    
    { name: 'count', value: ramp(words.length, 7, 9), weight: 0.25 },
    
    
    
    { name: 'diagonals', value: ramp(diagonality, 0.32, 0.62), weight: 0.20 },
  ];

  const phrases = {
    turns: {
      high: 'The words zigzag - few of them run in a line.',
      low: 'The words run in fairly straight lines.',
    },
    spangram: {
      high: `The spangram is only ${spanLength} letters.`,
      low: `A ${spanLength}-letter spangram, which is hard to miss.`,
    },
    count: {
      high: `${words.length} theme words, so most of them are short.`,
      low: `${words.length} theme words, so they are long enough to spot.`,
    },
    diagonals: {
      high: 'Most steps are diagonal rather than along a row.',
      low: 'Most steps run along a row or a column.',
    },
  };

  return { score: blend(parts), parts, phrases };
}



































export const THRESHOLDS = {
  wordle: { easy: 0.2517, hard: 0.5922 },
  bee: { easy: 0.3415, hard: 0.6964 },
  connections: { easy: 0.3000, hard: 0.6512 },
  strands: { easy: 0.5012, hard: 0.7759 },
};

const RATERS = {
  wordle: rateWordle,
  bee: rateBee,
  connections: rateConnections,
  strands: rateStrands,
};








export const PUZZLE_SETS = {
  wordle: WORDLE_ANSWERS,
  bee: BEE_PUZZLES,
  connections: CONNECTIONS_PUZZLES,
  strands: STRANDS_PUZZLES,
};








export function rate(game, puzzle) {
  const rater = RATERS[game];
  if (!rater) throw new Error(`no difficulty rating for game "${game}"`);
  const { score, parts, phrases } = rater(puzzle);
  
  
  const band = bandFor(game, score);
  return { band, score, why: explain(parts, phrases, band) };
}





const setCache = new Map();















export function ratingsFor(game, puzzles = null) {
  if (puzzles) return puzzles.map((p) => rate(game, p));
  if (!setCache.has(game)) {
    const list = PUZZLE_SETS[game];
    if (!list) throw new Error(`no playsets for game "${game}"`);
    setCache.set(game, list.map((p) => rate(game, p)));
  }
  return setCache.get(game);
}



















export function curveOrder(ratings) {
  return ratings
    .map((r, index) => ({ index, score: r.score }))
    .sort((a, b) => (a.score - b.score) || (a.index - b.index))
    .map((r) => r.index);
}











export function bandAt(ratings, slot) {
  const at = curveOrder(ratings)[slot];
  return at === undefined ? null : ratings[at].band;
}


export function distribution(ratings) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const r of ratings) counts[r.band] += 1;
  const n = Math.max(1, ratings.length);
  return {
    ...counts,
    total: ratings.length,
    share: { easy: counts.easy / n, medium: counts.medium / n, hard: counts.hard / n },
  };
}
