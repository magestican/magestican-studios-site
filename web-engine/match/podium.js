


























export const PODIUM_SLOTS = Object.freeze([2, 1, 3]);











export function byMerit(a, b) {
  if (b.kills !== a.kills) return b.kills - a.kills;
  if (a.deaths !== b.deaths) return a.deaths - b.deaths;
  return String(a.name).localeCompare(String(b.name));
}










export function podiumFrom(players = [], { myId = null } = {}) {
  
  
  
  
  if (!Array.isArray(players)) return [];
  const ranked = [...players]
    .filter((p) => p && p.id != null)
    .sort(byMerit)
    .slice(0, 3)
    .map((p, i) => ({
      place: i + 1,
      id: p.id,
      name: p.name || String(p.id).slice(0, 6),
      
      
      character: p.character || 'cow',
      kills: p.kills | 0,
      deaths: p.deaths | 0,
      team: p.team ?? null,
      isMe: myId != null && p.id === myId,
    }));

  
  
  const byPlace = new Map(ranked.map((r) => [r.place, r]));
  return PODIUM_SLOTS
    .map((place, slot) => {
      const r = byPlace.get(place);
      return r ? { ...r, slot } : null;
    })
    .filter(Boolean);
}









export function placeOf(players = [], myId = null) {
  if (myId == null || !Array.isArray(players)) return null;
  const ranked = [...players].filter((p) => p && p.id != null).sort(byMerit);
  const at = ranked.findIndex((p) => p.id === myId);
  return at < 0 ? null : { place: at + 1, of: ranked.length };
}
