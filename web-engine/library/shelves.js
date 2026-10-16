

import { recent, favourites, daysAgo, mostPlayed, normaliseLibrary } from './libraryModel.js';
import { tileOf } from './libraryIds.js';


export const fold = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u0110\u0111]/g, 'd').toLowerCase().trim();





export function matches(tile, query, chip, favSet) {
  if (chip === 'fav' && !favSet.has(tile.id)) return false;
  if (chip && chip !== 'all' && chip !== 'fav' && !tile.chips.includes(chip)) return false;
  const q = fold(query);
  if (!q) return true;
  return fold(`${tile.text} ${tile.alt}`).includes(q);
}










export function yourGamesLists(lib, catalogueIds) {
  const known = new Set(catalogueIds);
  const games = normaliseLibrary(lib).games;
  
  const ms = new Map();
  for (const [id, e] of Object.entries(games)) {
    const t = tileOf(id);
    if (t && known.has(t)) ms.set(t, (ms.get(t) ?? 0) + e.msPlayed);
  }
  const row = (id) => ({ id, hours: Math.round((ms.get(id) ?? 0) / 360000) / 10 });
  const triedTiles = new Set(Object.entries(games).filter(([, e]) => e.opens > 0 || e.matches > 0).map(([id]) => tileOf(id)));
  return {
    recent: asTiles(recent(lib, 64), known).map(row),
    fav: asTiles(favourites(lib), known).map(row),
    most: asTiles(mostPlayed(lib, 64), known).map(row)
      .sort((a, b) => (ms.get(b.id) ?? 0) - (ms.get(a.id) ?? 0)),
    new: catalogueIds.filter((id) => !triedTiles.has(id)).map(row),
  };
}


function asTiles(ids, known) {
  const out = [];
  for (const id of ids) {
    const t = tileOf(id);
    if (t && known.has(t) && !out.includes(t)) out.push(t);
  }
  return out;
}






export function historyLine(lib, id, today) {
  const e = normaliseLibrary(lib).games[id];
  if (!e || !e.lastDay || (e.opens === 0 && e.matches === 0)) return null;
  return { days: daysAgo(lib, id, today) ?? 0, matches: e.matches, wins: e.wins };
}

export function shelvesFor(lib, knownIds, today) {
  const known = new Set(knownIds);
  const order = recent(lib, 64);
  const played = asTiles(order, known);
  const contId = played[0] ?? null;
  
  const contFrom = contId ? order.find((id) => tileOf(id) === contId) : null;
  return {
    cont: contId ? { id: contId, days: daysAgo(lib, contFrom, today) ?? 0 } : null,
    favs: asTiles(favourites(lib), known).slice(0, 12),
    recent: played.slice(1, 13),
  };
}
