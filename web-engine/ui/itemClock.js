

































export const ITEM_RESPAWN_MS = 30_000;




export const ITEM_FIRST_SPAWN_MS = 3_000;










export const ITEM_SOON_MS = 5_000;








export const ITEM_CLOCK_SPEC = Object.freeze([
  Object.freeze({ id: 'chicken',       label: 'SLINGSHOT', icon: '🐔', tint: 0xffffff }),
  Object.freeze({ id: 'protein-shake', label: 'SHAKE',     icon: '🥤', tint: 0xff5fa2 }),
  Object.freeze({ id: 'cheese-wheel',  label: 'CHEESE',    icon: '🧀', tint: 0xf0b429 }),
]);

export const ITEM_CLOCK_IDS = Object.freeze(ITEM_CLOCK_SPEC.map((r) => r.id));

const SPEC_BY_ID = new Map(ITEM_CLOCK_SPEC.map((r) => [r.id, r]));

export function itemClockRow(id) { return SPEC_BY_ID.get(id) || null; }








export function itemRemainingMs(item, nowMs) {
  if (!item || item.available) return 0;
  return Math.max(0, (item.nextSpawnAt || 0) - nowMs);
}








export function itemClockSeconds(remainingMs) {
  if (remainingMs <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMs / 1000));
}




export function itemClockPhase(item, nowMs) {
  if (!item || item.available) return 'up';
  const left = itemRemainingMs(item, nowMs);
  return left <= ITEM_SOON_MS ? 'soon' : 'wait';
}








export function itemClockEntries(items, nowMs) {
  const byId = new Map();
  for (const it of items || []) if (it && it.id) byId.set(it.id, it);
  const out = [];
  for (const row of ITEM_CLOCK_SPEC) {
    const it = byId.get(row.id);
    if (!it) continue;
    const remainingMs = itemRemainingMs(it, nowMs);
    const phase = itemClockPhase(it, nowMs);
    const seconds = itemClockSeconds(remainingMs);
    out.push({
      id: row.id,
      label: row.label,
      icon: row.icon,
      tint: row.tint,
      phase,
      remainingMs,
      seconds,
      
      
      
      text: phase === 'up' ? 'UP' : `${seconds}s`,
    });
  }
  return out;
}




export function itemClockKey(entries) {
  return (entries || []).map((e) => `${e.id}:${e.phase}:${e.text}`).join('|');
}

















export const PAD_BASE_W = 0.9;      
export const PAD_ASPECT = 0.5;      
export const PAD_REF_DIST = 4;      
export const PAD_MAX_GROW = 2.6;    




export function padScaleFor(distanceM) {
  if (!Number.isFinite(distanceM) || distanceM <= 0) return 1;
  return Math.max(1, Math.min(PAD_MAX_GROW, distanceM / PAD_REF_DIST));
}
