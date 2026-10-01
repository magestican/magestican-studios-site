













































import { CHALLENGER, strengthsFor, ceilingFor, pickRanked, considers, describeBot } from './botSkill.js';
import {
  SIZE, RACK_SIZE, BLANK, VALUES, BINGO_BONUS, premiumAt, tileAt, isEmptyBoard,
  judge, seededRandom, CENTRE,
} from './scrabbleRules.js';
import { ACTIONS, canExchange } from './scrabbleMatch.js';


export const BOT_PREFIX = 'bot:';
export const botSeatId = (n) => `${BOT_PREFIX}${n}`;
export const isBotSeat = (id) => String(id ?? '').startsWith(BOT_PREFIX);
export const botIndexOf = (id) => (isBotSeat(id) ? Number(String(id).slice(BOT_PREFIX.length)) : -1);


export const botsIn = (seats = []) => seats.filter(isBotSeat);




















export const PPT_FLOOR = 8;
export const PPT_TOP = 34;







export const EVIDENCE_TURNS = 2;


export const DEFAULT_LEVEL = 0.4;

const clamp01 = (n) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);








export function levelOfTable(state) {
  let points = 0;
  let turns = 0;
  for (const move of state.history ?? []) {
    if (isBotSeat(state.seats[move.seat])) continue;
    turns += 1;
    points += move.score ?? 0;
  }
  if (turns < EVIDENCE_TURNS) return DEFAULT_LEVEL;
  return clamp01((points / turns - PPT_FLOOR) / (PPT_TOP - PPT_FLOOR));
}










export function strengthsAt(count, seed, level) {
  const ceiling = ceilingFor(level);
  return strengthsFor(count, seed).map((s) => s * ceiling);
}


export function botAt(state, seat) {
  const id = state.seats[seat];
  if (!isBotSeat(id)) return null;
  const bots = botsIn(state.seats);
  const order = bots.indexOf(id);
  const shape = strengthsFor(bots.length, state.seed)[order] ?? 0;
  const strength = strengthsAt(bots.length, state.seed, levelOfTable(state))[order] ?? 0;
  return { ...describeBot(order, shape), strength, seat, id };
}


export function botNameFor(id) {
  const at = botIndexOf(id);
  return at >= 0 ? `Bot ${at + 1}` : String(id);
}








































export const MAX_PER_SLOT = 120;
export const MAX_COLLECTED = 6000;
export const MAX_JUDGED = 500;


export const MAX_WORD_LENGTH = 12;


function rackCounts(rack) {
  const counts = new Map();
  let blanks = 0;
  for (const raw of rack) {
    const t = String(raw).toUpperCase();
    if (t === BLANK) { blanks += 1; continue; }
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return { counts, blanks };
}










function supply(need, { counts, blanks }) {
  const left = new Map(counts);
  let spare = blanks;
  const wild = new Array(need.length).fill(false);
  for (let i = 0; i < need.length; i += 1) {
    const have = left.get(need[i]) ?? 0;
    if (have > 0) { left.set(need[i], have - 1); continue; }
    if (spare > 0) { spare -= 1; wild[i] = true; continue; }
    return null;
  }
  return wild;
}

















function bucketByLength(words) {
  const value = (word) => {
    let n = 0;
    for (const ch of word) n += VALUES[ch] ?? 0;
    return n;
  };
  const out = new Map();
  for (const word of words) {
    if (word.length > MAX_WORD_LENGTH) continue;
    const at = out.get(word.length);
    if (at) at.push(word); else out.set(word.length, [word]);
  }
  for (const list of out.values()) {
    list.sort((a, b) => (value(b) - value(a)) || (a < b ? -1 : a > b ? 1 : 0));
  }
  return out;
}














function makeIndex(buckets) {
  const cache = new Map();
  return (length, at, letter) => {
    let byLength = cache.get(length);
    if (!byLength) {
      byLength = new Map();
      for (const word of buckets.get(length) ?? []) {
        for (let i = 0; i < length; i += 1) {
          const key = `${i}${word[i]}`;
          const list = byLength.get(key);
          if (list) list.push(word); else byLength.set(key, [word]);
        }
      }
      cache.set(length, byLength);
    }
    return byLength.get(`${at}${letter}`) ?? [];
  };
}











export function slotsFor(board, rackSize = RACK_SIZE) {
  const first = isEmptyBoard(board);
  const out = [];
  for (let across = 1; across >= 0; across -= 1) {
    const horizontal = across === 1;
    for (let line = 0; line < SIZE; line += 1) {
      const at = (i) => (horizontal ? tileAt(board, line, i) : tileAt(board, i, line));
      for (let start = 0; start < SIZE; start += 1) {
        if (at(start - 1)) continue;                       
        let empties = 0;
        let filled = 0;
        for (let end = start; end < SIZE; end += 1) {
          if (at(end)) filled += 1; else empties += 1;
          if (empties > rackSize) break;
          const length = end - start + 1;
          if (length < 2 || length > MAX_WORD_LENGTH) continue;
          if (at(end + 1)) continue;                       
          if (empties === 0) continue;                     
          if (first) {
            
            
            if (filled > 0) continue;
            const covers = horizontal
              ? line === CENTRE.row && start <= CENTRE.col && end >= CENTRE.col
              : line === CENTRE.col && start <= CENTRE.row && end >= CENTRE.row;
            if (!covers) continue;
          } else if (filled === 0 && !touches(board, horizontal, line, start, end)) {
            
            
            
            continue;
          }
          out.push({ horizontal, line, start, end, length, empties, filled });
        }
      }
    }
  }
  return out;
}


function touches(board, horizontal, line, start, end) {
  for (let i = start; i <= end; i += 1) {
    const row = horizontal ? line : i;
    const col = horizontal ? i : line;
    if (tileAt(board, row - 1, col) || tileAt(board, row + 1, col)
      || tileAt(board, row, col - 1) || tileAt(board, row, col + 1)) return true;
  }
  return false;
}











function estimate(board, slot, word, pattern, wild) {
  let sum = 0;
  let multiplier = 1;
  let laid = 0;
  let wildAt = 0;
  for (let i = 0; i < slot.length; i += 1) {
    const row = slot.horizontal ? slot.line : slot.start + i;
    const col = slot.horizontal ? slot.start + i : slot.line;
    if (pattern[i]) {
      const there = tileAt(board, row, col);
      sum += there?.blank ? 0 : (VALUES[pattern[i]] ?? 0);
      continue;
    }
    const isWild = wild[wildAt];
    wildAt += 1;
    laid += 1;
    const premium = premiumAt(row, col);
    sum += (isWild ? 0 : (VALUES[word[i]] ?? 0)) * premium.letter;
    multiplier *= premium.word;
  }
  return sum * multiplier + (laid === RACK_SIZE ? BINGO_BONUS : 0);
}

















export function createFinder({ words, isWord }) {
  const buckets = bucketByLength(words);
  const wordsAt = makeIndex(buckets);
  
  const rackOnly = new Map();
  let rackKey = null;

  function fromRackAlone(length, have) {
    const cached = rackOnly.get(length);
    if (cached) return cached;
    const out = [];
    for (const word of buckets.get(length) ?? []) {
      if (supply([...word], have)) out.push(word);
    }
    rackOnly.set(length, out);
    return out;
  }

  return {
    
    stats: { judged: 0, considered: 0, collected: 0 },

    plays(board, rack, {
      maxJudged = MAX_JUDGED, maxPerSlot = MAX_PER_SLOT, maxCollected = MAX_COLLECTED,
    } = {}) {
      const have = rackCounts(rack);
      const key = [...rack].sort().join('');
      if (key !== rackKey) { rackKey = key; rackOnly.clear(); }
      this.stats = { judged: 0, considered: 0, collected: 0 };

      
      const found = [];
      for (const slot of slotsFor(board, rack.length)) {
        if (found.length >= maxCollected) break;
        const { horizontal, line, start, length } = slot;
        const rowOf = (i) => (horizontal ? line : start + i);
        const colOf = (i) => (horizontal ? start + i : line);
        const pattern = [];
        for (let i = 0; i < length; i += 1) {
          pattern.push(tileAt(board, rowOf(i), colOf(i))?.letter ?? null);
        }
        const fixed = [];
        for (let i = 0; i < length; i += 1) if (pattern[i]) fixed.push(i);

        let candidates;
        if (fixed.length === 0) {
          candidates = fromRackAlone(length, have);
        } else {
          
          
          
          let best = null;
          for (const i of fixed) {
            const list = wordsAt(length, i, pattern[i]);
            if (!best || list.length < best.length) best = list;
          }
          candidates = best ?? [];
        }

        let taken = 0;
        for (const word of candidates) {
          if (taken >= maxPerSlot || found.length >= maxCollected) break;
          this.stats.considered += 1;
          let fits = true;
          for (const i of fixed) if (word[i] !== pattern[i]) { fits = false; break; }
          if (!fits) continue;
          const need = [];
          for (let i = 0; i < length; i += 1) if (!pattern[i]) need.push(word[i]);
          const wild = supply(need, have);
          if (!wild) continue;
          taken += 1;
          found.push({ slot, word, pattern, wild, guess: estimate(board, slot, word, pattern, wild) });
        }
      }
      this.stats.collected = found.length;

      
      
      
      found.sort((a, b) => (b.guess - a.guess)
        || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0)
        || (a.slot.line - b.slot.line) || (a.slot.start - b.slot.start)
        || (Number(b.slot.horizontal) - Number(a.slot.horizontal)));

      
      const out = [];
      for (const candidate of found) {
        if (this.stats.judged >= maxJudged) break;
        const { slot, word, pattern, wild } = candidate;
        const placed = [];
        let w = 0;
        for (let i = 0; i < slot.length; i += 1) {
          if (pattern[i]) continue;
          placed.push({
            row: slot.horizontal ? slot.line : slot.start + i,
            col: slot.horizontal ? slot.start + i : slot.line,
            letter: word[i],
            blank: wild[w],
          });
          w += 1;
        }
        this.stats.judged += 1;
        const verdict = judge(board, placed, isWord);
        if (!verdict.ok) continue;
        out.push({
          word,
          placed,
          score: verdict.score,
          bingo: verdict.bingo,
          row: placed[0].row,
          col: placed[0].col,
          across: slot.horizontal,
        });
      }

      
      
      
      out.sort((a, b) => (b.score - a.score)
        || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0)
        || (a.row - b.row) || (a.col - b.col)
        || (Number(b.across) - Number(a.across)));
      return out;
    },
  };
}













const KEEP = {
  [BLANK]: 12, S: 9, E: 7, A: 7, R: 7, T: 6, I: 6, N: 6, O: 5, L: 5, D: 4, U: 3,
  G: 3, C: 3, M: 3, P: 3, H: 3, B: 2, Y: 2, F: 2, W: 2, K: 2, V: 1, X: 2, J: 2,
  Z: 2, Q: -1,
};
const keepOf = (tile) => KEEP[String(tile).toUpperCase()] ?? 2;


export const POOR_PLAY = 11;








export function tilesToSwap(rack) {
  const ranked = rack
    .map((tile, at) => ({ tile, at, keep: keepOf(tile) }))
    .sort((a, b) => (a.keep - b.keep) || (a.tile < b.tile ? -1 : a.tile > b.tile ? 1 : 0) || (a.at - b.at));
  const out = [];
  for (const entry of ranked) {
    if (out.length >= 5) break;
    if (out.length >= 1 && entry.keep >= 4) break;
    out.push(entry.tile);
  }
  return out;
}










export const botRandomFor = (state, seat) => seededRandom(
  (state.seed >>> 0) + (state.history?.length ?? 0) * 6151 + seat * 97 + 5,
);










export function botAction(state, finder, { seat = state.turn } = {}) {
  if (state.over) return null;
  const bot = botAt(state, seat);
  if (!bot) return null;
  const rack = state.racks[seat] ?? [];
  const random = botRandomFor(state, seat);
  const ranked = finder.plays(state.board, rack);

  if (ranked.length === 0) {
    
    
    return canExchange(state) && rack.length
      ? { kind: ACTIONS.EXCHANGE, seat, tiles: tilesToSwap(rack) }
      : { kind: ACTIONS.PASS, seat };
  }

  const at = pickRanked(ranked.length, bot.strength, random);
  const choice = ranked[at];

  
  
  
  
  
  if (choice.score < POOR_PLAY && canExchange(state) && considers(bot.strength, random)) {
    return { kind: ACTIONS.EXCHANGE, seat, tiles: tilesToSwap(rack) };
  }
  return { kind: ACTIONS.PLAY, seat, placed: choice.placed };
}


export const botToPlay = (state) => !state.over && isBotSeat(state.seats[state.turn]);








export function seatsWithBot(seats, maxSeats = 4) {
  if (seats.length >= maxSeats) return seats;
  if (botsIn(seats).length >= 3) return seats;
  
  
  let n = 0;
  while (seats.includes(botSeatId(n))) n += 1;
  return [...seats, botSeatId(n)];
}


export function seatsWithoutBot(seats) {
  const bots = botsIn(seats);
  if (!bots.length) return seats;
  const last = bots[bots.length - 1];
  return seats.filter((s) => s !== last);
}


export function describeBots(state) {
  return botsIn(state.seats).map((id, order) => {
    const seat = state.seats.indexOf(id);
    const at = botAt(state, seat);
    return {
      id,
      seat,
      name: botNameFor(id),
      kind: at?.kind ?? 'for company',
      score: state.scores[seat] ?? 0,
      challenger: order === 0,
    };
  });
}


export function botsSummary(state) {
  const bots = describeBots(state);
  if (!bots.length) return 'No bots. You are playing on your own.';
  const level = levelOfTable(state);
  const how = level >= 0.66 ? 'plays as well as you do'
    : (level >= 0.33 ? 'plays about as well as you do' : 'is taking it gently');
  return bots.length === 1
    ? `One bot. Bot 1 is the challenger and ${how}.`
    : `${bots.length} bots. Bot 1 is the challenger and ${how}; the rest are company.`;
}



export { CHALLENGER, pickRanked, considers };
