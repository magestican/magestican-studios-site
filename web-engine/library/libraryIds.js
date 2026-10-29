









export const LIBRARY_GAME_IDS = Object.freeze([
  'team-bonding', 'farmy-uprising', 'farmy-evil-hills', 'farmykart', 'farmy-scrabble',
  'farmy-crosswords', 'farmy-chess', 'farmy-checkers', 'farmy-ludo', 'minesweeper', 'gomoku',
  'word-chain', 'truco', 'buraco', 'conga', 'koikoi', 'shogi', 'xiangqi', 'zelakas', '2d-fighter-ex', 'farmy-moon-life',
  'silk-and-seam', 'dachis', 'space-95', 'farmy-five', 'farmy-hive', 'farmy-herds', 'farmy-furrows',
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
  gomoku: 'gomoku', 'word-chain': 'word-chain', truco: 'truco', buraco: 'buraco', conga: 'conga', koikoi: 'koikoi', shogi: 'shogi', xiangqi: 'xiangqi',
  zelakas: 'zelakas', '2d-fighter-ex': '2d-fighter-ex', 'farmy-moon-life': 'farmy-moon-life',
  'silk-and-seam': 'silk-and-seam', dachis: 'dachis', 'space-95': 'space-95',
});




export const LANDING_PAGES = Object.freeze({
  farmyshoot: 'team-bonding', 'farmy-uprising': 'farmy-uprising', 'farmy-evil-hills': 'farmy-evil-hills',
  farmykart: 'farmykart', 'farmy-tiles': 'farmy-scrabble', 'farmy-crosswords': 'farmy-crosswords',
  'farmy-chess': 'farmy-chess', 'farmy-checkers': 'farmy-checkers', 'farmy-ludo': 'farmy-ludo',
  minesweeper: 'minesweeper', gomoku: 'gomoku', 'word-chain': 'word-chain', truco: 'truco', buraco: 'buraco', conga: 'conga', koikoi: 'koikoi', shogi: 'shogi', xiangqi: 'xiangqi',
  'zelakas-in-space': 'zelakas', '2d-fighter-ex': '2d-fighter-ex', 'farmy-moon-life': 'farmy-moon-life',
  'silk-and-seam': 'silk-and-seam', dachis: 'dachis', 'space-95': 'space-95', 'farmy-five': 'farmy-five', 'farmy-hive': 'farmy-hive',
  'farmy-herds': 'farmy-herds', 'farmy-furrows': 'farmy-furrows',
});


export function gameIdForPage(slug) {
  return typeof slug === 'string' && Object.prototype.hasOwnProperty.call(LANDING_PAGES, slug) ? LANDING_PAGES[slug] : null;
}


export function gameIdForPlayDir(dir) {
  return typeof dir === 'string' && Object.prototype.hasOwnProperty.call(PLAY_DIRS, dir) ? PLAY_DIRS[dir] : null;
}





const FOLDED = Object.freeze({
  'farmy-scrabble': 'farmy-crosswords',
  'farmy-five': 'farmy-crosswords', 'farmy-hive': 'farmy-crosswords',
  'farmy-herds': 'farmy-crosswords', 'farmy-furrows': 'farmy-crosswords',
});


export function tileOf(id) {
  if (!isLibraryId(id)) return null;
  return Object.prototype.hasOwnProperty.call(FOLDED, id) ? FOLDED[id] : id;
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
