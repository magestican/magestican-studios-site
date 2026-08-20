// Anagram tiebreaker: pick a word deterministically from a pool, scramble
// its letters, hand it to the losing team, wait 10s.

import { SeededRng } from 'arbelo/rng';

// Curated list: recognisable, no proper nouns, no offensive strings, and
// no plurals-of-a-shorter-word (to avoid the trivial "add an S" shortcut).
const WORDS = [
  'ABSOLUTE','ADVENTURE','BALCONY','BLIZZARD','CARPENTER','CINNAMON','CRIMINAL',
  'DIAMOND','DYNAMITE','ELEPHANT','FANTASTIC','FLAMINGO','FURNITURE','GORILLA',
  'HORIZON','HURRICANE','INFINITE','JOURNEY','KANGAROO','LABORATORY','LIGHTNING',
  'MAGNETIC','MEADOW','MERCURY','MISSION','MOUNTAIN','MYSTERY','OCTOPUS',
  'PARADISE','PENGUIN','PIRATE','PYRAMID','RAINBOW','RESCUE','ROCKET','SATELLITE',
  'SHADOW','SILVER','SUNRISE','THUNDER','TORNADO','TREASURE','TROPICAL','VOLCANO',
  'WHISTLE','WIZARD','ZEBRA',
];

export function pickWord(seed) {
  const rng = new SeededRng(seed >>> 0);
  return rng.pick(WORDS);
}

export function scramble(word, seed) {
  const rng = new SeededRng(seed >>> 0);
  // Keep scrambling until it's NOT the original (rare on short words but let's
  // be sure the puzzle isn't a no-op).
  for (let attempt = 0; attempt < 5; attempt++) {
    const arr = word.split('');
    rng.shuffle(arr);
    const s = arr.join('');
    if (s !== word) return s;
  }
  // Fallback: rotate by 1.
  return word.slice(1) + word[0];
}
