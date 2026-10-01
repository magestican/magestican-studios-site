






















import { opponentFrom } from '../../../web-engine/progress/peerCards.js';















export function uprisingMatch(a = {}) {
  const { playerCount, mySeat, winner, observing = false, seats = null,
    cardFor = () => null, myDev = '', seconds } = a;
  if (observing) return null;
  if (!Number.isInteger(playerCount) || playerCount < 2) return null;
  if (!Number.isInteger(mySeat) || mySeat < 0 || mySeat >= playerCount) return null;
  if (!Number.isInteger(winner) || winner >= playerCount) return null;
  const order = Array.isArray(a.order) ? a.order : [];
  const dropped = new Set(a.dropped ?? []);
  const drawn = winner < 0;
  
  
  const rest = order.filter((s) => s !== winner);
  const placeOf = (s) => {
    if (drawn || s === winner) return 1;
    const i = rest.indexOf(s);
    return i < 0 ? playerCount : i + 2;
  };
  const online = Array.isArray(seats);
  const cardOf = (s) => {
    const id = seats?.[s]?.id;
    try { return id ? cardFor(id) ?? null : null; } catch { return null; }
  };
  const twinAt = (s) => { const c = cardOf(s); return !!(c && myDev && c.dev === myDev); };
  
  
  
  
  
  
  
  if (online) {
    for (let s = 0; s < mySeat; s += 1) {
      if (!dropped.has(s) && twinAt(s)) return null;
    }
  }
  const opponents = [];
  for (let s = 0; s < playerCount; s += 1) {
    if (s === mySeat) continue;
    const place = placeOf(s);
    if (!online || dropped.has(s)) { opponents.push({ human: false, place }); continue; }
    const id = seats[s]?.id;
    let card = null;
    try { card = id ? cardFor(id) : null; } catch { card = null; }
    if (card && myDev && card.dev === myDev) { opponents.push({ human: false, place }); continue; }
    opponents.push(opponentFrom(card, place));
  }
  return {
    game: 'farmy-uprising',
    outcome: drawn ? 'draw' : winner === mySeat ? 'win' : 'loss',
    mode: online ? 'online' : 'bots',
    place: placeOf(mySeat),
    opponents,
    seconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined,
  };
}
