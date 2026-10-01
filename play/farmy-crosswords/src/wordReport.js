
















export const CARD_STATS = Object.freeze({
  wordle: 'farmy-five',
  bee: 'farmy-hive',
  connections: 'farmy-herds',
  strands: 'farmy-furrows',
});








export function cardMatch(a) {
  const game = a && Object.hasOwn(CARD_STATS, a.card) ? CARD_STATS[a.card] : null;
  if (!game || a.watching) return null;
  return { game, outcome: 'done', mode: a.inRoom ? 'online' : 'solo' };
}







export function sessionMatch(a) {
  if (a?.watching) return null;
  const minutes = Number(a?.minutes);
  const seconds = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : undefined;
  return { game: 'farmy-crosswords', outcome: 'done', mode: 'online', seconds };
}










export const LEDGER_KEY = 'magestican.crosswords.reported.v1';
const LEDGER_CAP = 3000;

export function createPuzzleLedger(storage) {
  const read = () => {
    try {
      const v = JSON.parse(storage?.getItem(LEDGER_KEY) ?? '[]');
      return Array.isArray(v) ? v.filter((k) => typeof k === 'string') : [];
    } catch { return []; }
  };
  return {
    
    take(key) {
      if (typeof key !== 'string' || !key) return false;
      const keys = read();
      if (keys.includes(key)) return false;
      keys.push(key);
      try { storage?.setItem(LEDGER_KEY, JSON.stringify(keys.slice(-LEDGER_CAP))); } catch {  }
      return true;
    },
  };
}
