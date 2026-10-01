



























export const TAB_IDS_KEY = 'feh.coopTabIds';
const TAB_IDS_CAP = 16;

const readTabIds = (storage) => {
  try {
    const raw = storage ? JSON.parse(storage.getItem(TAB_IDS_KEY) || '[]') : [];
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
};


export function noteCoopTab(storage, id) {
  if (!storage || typeof id !== 'string' || !id) return;
  try {
    const ids = readTabIds(storage).filter((x) => x !== id);
    ids.push(id);
    storage.setItem(TAB_IDS_KEY, JSON.stringify(ids.slice(-TAB_IDS_CAP)));
  } catch {  }
}


export function isMyTab(storage, id) {
  if (typeof id !== 'string' || !id) return false;
  return readTabIds(storage).includes(id);
}










export function fehMatch({ ending, deck, coop = {} } = {}) {
  if (ending !== 'won' && ending !== 'died') return null;
  if (coop.watching) return null;
  const together = !!(coop.active && coop.partner);
  if (together && !coop.local && coop.twin && !coop.hosting) return null;
  return {
    game: 'farmy-evil-hills',
    outcome: ending === 'won' ? 'done' : 'loss',
    mode: !together ? 'solo' : coop.local ? 'local' : 'online',
    metrics: { deck: Number.isFinite(deck) ? deck : 1 },
  };
}
