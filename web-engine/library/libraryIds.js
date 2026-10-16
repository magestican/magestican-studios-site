









export const LIBRARY_GAME_IDS = Object.freeze([
  'team-bonding', 'farmy-uprising', 'farmy-evil-hills', 'farmykart', 'farmy-scrabble',
  'farmy-crosswords', 'farmy-chess', 'farmy-checkers', 'farmy-ludo', 'minesweeper', 'gomoku',
  'word-chain', 'truco', 'buraco', 'zelakas', '2d-fighter-ex', 'farmy-moon-life',
  'silk-and-seam', 'dachis', 'farmy-five', 'farmy-hive', 'farmy-herds', 'farmy-furrows',
]);

const IDS = new Set(LIBRARY_GAME_IDS);

export const SUB_GAMES = Object.freeze({
  'farmy-crosswords': Object.freeze({
    five: 'farmy-five', hive: 'farmy-hive', herds: 'farmy-herds', furrows: 'farmy-furrows',
  }),
});





export const PLAY_DIRS = Object.freeze({
  farmyshoot: 'team-bonding', 'farmy-uprising': 'farmy-uprising',
  'farmy-evil-hills': 'farmy-evil-hills', farmykart: 'farmykart', 'farmy-tiles': 'farmy-scrabble',
  'farmy-crosswords': 'farmy-crosswords', 'farmy-chess': 'farmy-chess',
  'farmy-checkers': 'farmy-checkers', 'farmy-ludo': 'farmy-ludo', minesweeper: 'minesweeper',
  gomoku: 'gomoku', 'word-chain': 'word-chain', truco: 'truco', buraco: 'buraco',
  zelakas: 'zelakas', '2d-fighter-ex': '2d-fighter-ex', 'farmy-moon-life': 'farmy-moon-life',
  'silk-and-seam': 'silk-and-seam', dachis: 'dachis',
});


export function gameIdForPlayDir(dir) {
  return typeof dir === 'string' && Object.prototype.hasOwnProperty.call(PLAY_DIRS, dir) ? PLAY_DIRS[dir] : null;
}


export function isLibraryId(id) {
  return typeof id === 'string' && IDS.has(id);
}


export function resolveGameId(baseId, search = '') {
  if (!isLibraryId(baseId)) return null;
  const subs = Object.prototype.hasOwnProperty.call(SUB_GAMES, baseId) ? SUB_GAMES[baseId] : null;
  if (!subs) return baseId;
  let g = null;
  try { g = new URLSearchParams(search).get('g'); } catch { g = null; }
  return g && Object.prototype.hasOwnProperty.call(subs, g) ? subs[g] : baseId;
}
