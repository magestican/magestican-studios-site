












export const T = Object.freeze({
  tip: Object.freeze({
    vent: 'Press Boost as the ring meets the mark to vent.',
    dash: 'Use Boost to dash straight into a rival.',
    bounty: 'Hit the pilot glowing gold. That Bell rings twice.',
  }),
  stars: Object.freeze({
    earned: 'House Stars', next: 'Next unlock', paint: 'Paint', emblem: 'Emblem', housePaint: 'House colour',
    noEmblem: 'No emblem', new: 'Unlocked',
  }),
  paint: Object.freeze({
    ember: 'Forge Ember', tide: 'Tidewall Blue', spire: 'Spire White', glass: 'Glassfield Green',
    archive: 'Archive Ink', deepcut: 'Deepcut Rust', harbour: 'Harbour Gilt', static: 'Static Violet',
  }),
  emblem: Object.freeze({
    bell: 'Brass Bell', anvil: 'Anvil', wave: 'Breaker', crown: 'Champion Crown', gear: 'Cog', bolt: 'Storm Bolt',
  }),
});


export const PAINTS = Object.freeze([
  { id: 'ember', color: '#ff7a2e' }, { id: 'tide', color: '#2f8fd8' }, { id: 'spire', color: '#f2f4f8' },
  { id: 'glass', color: '#4fcf7a' }, { id: 'archive', color: '#2c2f4a' }, { id: 'deepcut', color: '#a5532b' },
  { id: 'harbour', color: '#e8c35a' }, { id: 'static', color: '#9b5cf0' },
].map((p) => Object.freeze({ ...p, name: T.paint[p.id] })));


export const EMBLEMS = Object.freeze([
  { id: 'bell', glyph: '\u{1F514}' }, { id: 'anvil', glyph: '⚒' }, { id: 'wave', glyph: '\u{1F30A}' },
  { id: 'gear', glyph: '⚙' }, { id: 'bolt', glyph: '⚡' }, { id: 'crown', glyph: '\u{1F451}' },
].map((e) => Object.freeze({ ...e, name: T.emblem[e.id] })));





export const UNLOCKS = Object.freeze([
  [3, 'paint', 'ember'], [6, 'emblem', 'bell'], [10, 'paint', 'tide'], [15, 'emblem', 'anvil'],
  [21, 'paint', 'spire'], [28, 'emblem', 'wave'], [36, 'paint', 'glass'], [45, 'emblem', 'gear'],
  [55, 'paint', 'archive'], [66, 'emblem', 'bolt'], [78, 'paint', 'deepcut'], [91, 'paint', 'harbour'],
  [105, 'paint', 'static'], [120, 'emblem', 'crown'],
].map(([stars, kind, id]) => Object.freeze({ stars, kind, id, name: T[kind][id] })));

export const STAR_RULES = Object.freeze({ round: 1, roundWin: 1, podium: 1, champion: 2 });


export const starsForRound = (row) => STAR_RULES.round + (row && row.place === 0 ? STAR_RULES.roundWin : 0);


export const starsForNight = (place) => (place === 0 ? STAR_RULES.champion : place === 1 || place === 2 ? STAR_RULES.podium : 0);


export const emptyStars = () => ({ count: 0, paints: [], emblems: [], paint: null, emblem: null });


export function cleanStars(raw) {
  const out = emptyStars();
  if (!raw || typeof raw !== 'object') return out;
  const n = Math.floor(Number(raw.count));
  out.count = Number.isFinite(n) && n > 0 ? Math.min(n, 1e6) : 0;
  
  for (const u of UNLOCKS) if (out.count >= u.stars) out[u.kind === 'paint' ? 'paints' : 'emblems'].push(u.id);
  if (out.paints.includes(raw.paint)) out.paint = raw.paint;
  if (out.emblems.includes(raw.emblem)) out.emblem = raw.emblem;
  return out;
}


export function addStars(record, n) {
  const before = cleanStars(record);
  const add = Math.max(0, Math.floor(Number(n) || 0));
  const after = cleanStars({ count: before.count + add, paint: before.paint, emblem: before.emblem });
  const unlocked = UNLOCKS.filter((u) => u.stars > before.count && u.stars <= after.count);
  return { record: after, unlocked };
}


export function nextUnlock(count) {
  const c = cleanStars({ count }).count;
  const u = UNLOCKS.find((x) => x.stars > c);
  return u ? { ...u, need: u.stars - c } : null;
}


export const ownsPaint = (record, id) => id == null || cleanStars(record).paints.includes(id);
export const ownsEmblem = (record, id) => id == null || cleanStars(record).emblems.includes(id);
export const paintColor = (id) => (PAINTS.find((p) => p.id === id) || {}).color || null;
export const emblemGlyph = (id) => (EMBLEMS.find((e) => e.id === id) || {}).glyph || '';

export const STARS_KEY = 'magestican:v1:titan-bash:stars';


export function loadStars(storage, slot = 'phone') {
  try {
    const all = JSON.parse(storage.getItem(STARS_KEY) || '{}');
    return cleanStars(all && all[slot]);
  } catch { return emptyStars(); }
}

export function saveStars(storage, slot, record) {
  try {
    const all = JSON.parse(storage.getItem(STARS_KEY) || '{}') || {};
    const r = cleanStars(record);
    all[slot] = { count: r.count, paint: r.paint, emblem: r.emblem };
    storage.setItem(STARS_KEY, JSON.stringify(all));
    return true;
  } catch { return false; }
}

export const TIP_STALLS = 3;





export function tipFor(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const last = rows.slice(-2);
  if (last.some((r) => !r || r.bells > 0)) return null;
  const stalls = last.reduce((s, r) => s + (r.stalls || 0), 0);
  const slams = last.reduce((s, r) => s + (r.slamHits || 0), 0);
  const key = stalls >= TIP_STALLS ? 'vent' : slams === 0 ? 'dash' : 'bounty';
  return { key, text: T.tip[key] };
}


export const rowsFor = (night, id) => night.cards.map((c) => c.rows.find((r) => r.id === id)).filter(Boolean);


export function equip(record, kind, id) {
  const r = cleanStars(record);
  if (kind === 'paint' && ownsPaint(r, id)) r.paint = id ?? null;
  if (kind === 'emblem' && ownsEmblem(r, id)) r.emblem = id ?? null;
  return r;
}


export function equipNewest(record, unlocked) {
  let r = cleanStars(record);
  for (const u of unlocked) r = equip(r, u.kind, u.id);
  return r;
}


export const cleanPaint = (v) => (v === null || v === '' ? null : PAINTS.some((p) => p.id === v) ? v : undefined);
export const cleanEmblem = (v) => (v === null || v === '' ? null : EMBLEMS.some((e) => e.id === v) ? v : undefined);
