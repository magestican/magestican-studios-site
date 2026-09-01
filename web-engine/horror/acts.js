























export const ACT_LEN = 4;   

export const ACTS = Object.freeze([
  {
    name: 'ACT I - THE STOCK DECKS',
    
    
    
    behind: [18, 30],
    porkerFromCorner: 3,
    cows: 1,
    ahead: 0,
  },
  {
    name: 'ACT II - PROCESSING',
    
    
    
    behind: [14, 24, 34],
    porkerFromCorner: 2,
    cows: 2,
    ahead: 0,
  },
  {
    name: 'ACT III - THE DARK DECKS',
    
    
    
    behind: [12, 20, 30],
    porkerFromCorner: 1,
    cows: 2,
    ahead: 1,
  },
]);



export function actFor(level) {
  return Math.min(ACTS.length, Math.max(1, Math.ceil(level / ACT_LEN)));
}


export function isBossDeck(level) {
  return level > 0 && level % ACT_LEN === 0;
}



export function rosterFor(level) {
  if (isBossDeck(level)) return null;
  return ACTS[actFor(level) - 1];
}



export function actCardFor(level) {
  if (level <= 1 || isBossDeck(level)) return null;
  const first = (level - 1) % ACT_LEN === 0;
  return first ? ACTS[actFor(level) - 1].name : null;
}
