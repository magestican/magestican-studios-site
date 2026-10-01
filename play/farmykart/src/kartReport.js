





























import { opponentFrom } from '../../../web-engine/progress/peerCards.js';













export function kartMatch({ result, metrics, name, myId = null, cardFor = () => null, myDev = '', hosting = false } = {}) {
  if (!result || !Number.isFinite(result.position)) return null;
  const seats = Array.isArray(result.seats) ? result.seats : null;
  const online = !!seats;
  const mySeat = online ? seats.find((s) => s && !s.bot && s.owner != null && s.owner === myId) : null;
  const myRowId = online ? (mySeat?.id ?? null) : 'player';
  const rows = Array.isArray(result.table) ? result.table : [];
  const cardOf = (peer) => { try { return cardFor(peer) ?? null; } catch { return null; } };
  const twinOf = (card) => !!(card && myDev && card.dev === myDev);
  const seconds = Number.isFinite(result.raceTime) ? result.raceTime : undefined;
  if (online) {
    const twin = seats.some((s) => s && !s.bot && s.owner && s.owner !== myId && twinOf(cardOf(s.owner)));
    if (twin && !hosting) return null;
  }
  const startSeats = online && Array.isArray(result.startSeats) ? result.startSeats : null;
  const heldFromStart = (seat) => !startSeats
    || startSeats.some((s) => s && s.id === seat.id && !s.bot && s.owner === seat.owner);
  if (online && !mySeat) return null; 
  if (online && (result.joinedMidRace || !heldFromStart(mySeat))) {
    return { game: 'farmykart', outcome: 'done', mode: 'online', opponents: [], seconds, metrics, name };
  }
  const opponents = rows
    .filter((r) => r && r.id !== myRowId && Number.isFinite(r.position))
    .map((r) => {
      const place = r.position;
      if (!online) return { human: false, place };
      const seat = seats.find((s) => s && s.id === r.id);
      if (!seat || seat.bot || !seat.owner || seat.owner === myId) return { human: false, place };
      if (!heldFromStart(seat)) return { human: false, place };
      const card = cardOf(seat.owner);
      if (twinOf(card)) return { human: false, place };
      return opponentFrom(card, place);
    });
  return {
    game: 'farmykart',
    outcome: result.position === 1 ? 'win' : 'loss',
    mode: online ? 'online' : 'bots',
    opponents,
    place: result.position,
    seconds,
    metrics,
    name,
  };
}
