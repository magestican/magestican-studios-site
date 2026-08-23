





































export const PUBLIC_FIELDS = Object.freeze([
  'name', 'kills', 'deaths', 'wins', 'matches',
]);





export const LIMITS = Object.freeze({
  nameMaxLength: 16,      
                          
  maxCount: 1000000,      
});








const UNSAFE_NAME = /[\u0000-\u001f\u007f<>\u202a-\u202e\u2066-\u2069]/g;

export function normaliseName(raw) {
  const s = String(raw ?? '').replace(UNSAFE_NAME, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, LIMITS.nameMaxLength);
}

function count(n) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(v, LIMITS.maxCount);
}














export async function playerKey(name, subtleCrypto) {
  const norm = normaliseName(name).toLowerCase();
  const subtle = subtleCrypto ?? (typeof globalThis !== 'undefined'
    && globalThis.crypto && globalThis.crypto.subtle);
  if (!subtle) return null;      
  const bytes = new TextEncoder().encode('tb-leaderboard-v1:' + norm);
  const digest = await subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}






export function toPublicDto(row) {
  if (!row || row.bot) return null;
  const name = normaliseName(row.name);
  if (!name) return null;
  return {
    name,
    kills: count(row.kills),
    deaths: count(row.deaths),
    wins: count(row.wins),
    matches: count(row.matches),
  };
}







export function fromPublicDto(doc) {
  if (!doc || typeof doc !== 'object') return null;
  const name = normaliseName(doc.name);
  if (!name) return null;
  return {
    name,
    kills: count(doc.kills),
    deaths: count(doc.deaths),
    wins: count(doc.wins),
    matches: count(doc.matches),
  };
}




export function extraFields(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj).filter((k) => !PUBLIC_FIELDS.includes(k));
}




export function isPublishable(dto) {
  if (!dto || typeof dto !== 'object') return false;
  if (extraFields(dto).length) return false;
  if (!normaliseName(dto.name)) return false;
  for (const k of ['kills', 'deaths', 'wins', 'matches']) {
    const v = dto[k];
    if (!Number.isInteger(v) || v < 0 || v > LIMITS.maxCount) return false;
  }
  return true;
}
