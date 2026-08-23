


import { SeededRng } from 'arbelo/rng';



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
  
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const arr = word.split('');
    rng.shuffle(arr);
    const s = arr.join('');
    if (s !== word) return s;
  }
  
  return word.slice(1) + word[0];
}
