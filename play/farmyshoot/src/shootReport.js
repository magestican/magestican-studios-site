


































import { opponentFrom } from '../../../web-engine/progress/peerCards.js';














export function shootMatch({ rows, winner = null, metrics, name, cardFor = () => null, myDev = '', hosting = false, startIds } = {}) {
  const all = Array.isArray(rows) ? rows.filter((r) => r && typeof r === 'object') : [];
  const me = all.find((r) => r.isMe) ?? null;
  const others = all.filter((r) => r !== me);
  const mode = others.some((r) => !r.bot) ? 'online' : 'bots';
  if (!me || !me.team) return null;
  const cardOf = (id) => { try { return cardFor(id) ?? null; } catch { return null; } };
  const twinOf = (card) => !!(card && myDev && card.dev === myDev);
  if (others.some((r) => !r.bot && twinOf(cardOf(r.id))) && !hosting) return null;
  const started = startIds === undefined ? null : new Set(startIds ?? []);
  if (started && !started.has(me.id)) {
    return { game: 'team-bonding', outcome: 'done', mode, opponents: [], metrics, name };
  }
  const outcome = !winner ? 'draw' : (me.team === winner ? 'win' : 'loss');
  const myPlace = outcome === 'loss' ? 2 : 1;
  const theirPlace = outcome === 'win' ? 2 : 1;
  const opponents = others
    .filter((r) => r.team && r.team !== me.team)
    .map((r) => {
      if (r.bot) return { human: false, place: theirPlace };
      if (started && !started.has(r.id)) return { human: false, place: theirPlace };
      const card = cardOf(r.id);
      if (twinOf(card)) return { human: false, place: theirPlace };
      return opponentFrom(card, theirPlace);
    });
  return { game: 'team-bonding', outcome, mode, opponents, place: myPlace, metrics, name };
}
