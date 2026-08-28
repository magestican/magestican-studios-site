
















































import {
  toPublicDto, isPublishable, normaliseName, normaliseCharacter, VALID_CHARACTERS, LIMITS,
} from '../stats/leaderboardDto.js';


export const KART_BOARD_LIMIT = 10;







export const KART_CHARACTER_GLYPH = Object.freeze({
  cow: '\u{1F404}', chicken: '\u{1F413}', pig: '\u{1F416}', sheep: '\u{1F411}',
});


export const UNKNOWN_GLYPH = '–';









export function kartCareerRow(progress, { name, character = null } = {}) {
  const cleanName = normaliseName(name);
  if (!cleanName) return null;
  const races = Math.max(0, Math.floor(Number(progress?.totalRaces) || 0));
  if (races <= 0) return null;
  
  
  
  
  
  
  
  
  const matches = Math.min(races, LIMITS.maxCount);
  const wins = Math.min(matches, Math.max(0, Math.floor(Number(progress?.totalWins) || 0)));
  return {
    name: cleanName,
    kills: 0,
    deaths: 0,
    wins,
    matches,
    character: normaliseCharacter(character),
  };
}









export function kartPublishRows(progress, opts = {}) {
  const row = kartCareerRow(progress, opts);
  if (!row) return [];
  const dto = toPublicDto(row);
  if (!dto || !isPublishable(dto)) return [];
  return [dto];
}















export function kartScopeCopy(scope) {
  if (scope === 'online') {
    return Object.freeze({
      badge: 'ONLINE',
      title: 'Top racers',
      
      
      
      note: 'Wins across Magestican Studios games, worldwide. Farmy Kart adds '
        + 'your race wins to it.',
    });
  }
  return Object.freeze({
    badge: 'THIS DEVICE',
    title: 'Your record',
    note: 'Counted in this browser only. The shared online board is not '
      + 'switched on.',
  });
}










const own = (map, key) =>
  (typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key)) ? map[key] : null;

export function kartBoardRow(row, index, { myName = '' } = {}) {
  const character = own(KART_CHARACTER_GLYPH, row?.character) ? row.character : null;
  const name = normaliseName(row?.name);
  const wins = Math.max(0, Math.floor(Number(row?.wins) || 0));
  const matches = Math.max(0, Math.floor(Number(row?.matches) || 0));
  return {
    rank: index + 1,
    name,
    character,
    glyph: own(KART_CHARACTER_GLYPH, character) ?? UNKNOWN_GLYPH,
    
    
    characterName: character ? character[0].toUpperCase() + character.slice(1) : 'unknown',
    wins,
    matches,
    isMe: !!normaliseName(myName)
      && name.toLowerCase() === normaliseName(myName).toLowerCase(),
  };
}










export function kartBoardModel({
  rows = null, globalEnabled = false, myName = '', limit = KART_BOARD_LIMIT,
  deviceRaces = 0, deviceWins = 0,
} = {}) {
  const scope = globalEnabled ? 'online' : 'device';
  const copy = kartScopeCopy(scope);
  const list = Array.isArray(rows) ? rows.slice(0, Math.max(1, limit)) : [];
  return {
    scope,
    badge: copy.badge,
    title: copy.title,
    note: copy.note,
    
    
    pending: scope === 'online' && rows === null,
    rows: list.map((r, i) => kartBoardRow(r, i, { myName })),
    
    
    device: {
      races: Math.max(0, Math.floor(Number(deviceRaces) || 0)),
      wins: Math.max(0, Math.floor(Number(deviceWins) || 0)),
    },
    empty: scope !== 'online' || (Array.isArray(rows) && rows.length === 0),
  };
}



export { VALID_CHARACTERS };
