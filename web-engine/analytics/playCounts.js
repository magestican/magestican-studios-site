



































































































export const PLAY_COUNTS_COLLECTION = 'gamePlays';















export const COUNTED_GAME_IDS = Object.freeze([
  'team-bonding',
  'farmy-uprising',
  'farmy-evil-hills',
  'farmykart',
  'farmy-scrabble',
  'farmy-crosswords',
  
  
  
  
  'farmy-chess',
  'farmy-checkers',
  'farmy-ludo',
  'zelakas',
  '2d-fighter-ex',
]);


export function isCountedGameId(id) {
  return typeof id === 'string' && COUNTED_GAME_IDS.includes(id);
}


export function playCountPath(gameId) {
  return isCountedGameId(gameId) ? [PLAY_COUNTS_COLLECTION, gameId] : null;
}














export function shouldCountPlay({ isHost } = {}) {
  return isHost === true;
}



























export function isPlayCountDoc(d) {
  return !!d
    && typeof d === 'object'
    && Number.isInteger(d.matches)
    && d.matches >= 0
    && Number.isInteger(d.updatedAt)
    && d.updatedAt > 1000000000000;
}











export function playCountOf(doc) {
  return isPlayCountDoc(doc) ? doc.matches : null;
}








export function playCountsFrom(docs = {}) {
  const out = {};
  for (const id of COUNTED_GAME_IDS) out[id] = playCountOf(docs?.[id]);
  return out;
}







export function everyGameCounted(counts = {}) {
  return COUNTED_GAME_IDS.every((id) => Number.isInteger(counts?.[id]) && counts[id] >= 0);
}


export function uncountedGameIds(counts = {}) {
  return COUNTED_GAME_IDS.filter((id) => !(Number.isInteger(counts?.[id]) && counts[id] >= 0));
}
