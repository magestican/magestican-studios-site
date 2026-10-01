


















import { opponentFrom } from '../../../web-engine/progress/peerCards.js';

const secondsOf = (s) => (Number.isFinite(s) && s > 0 ? Math.round(s) : undefined);
const twinOf = (card, myDev) => !!(card && typeof card.dev === 'string' && card.dev && card.dev === myDev);








export function tilesMatch(a) {
  if (!a || !Array.isArray(a.rows)) return null;
  const mine = a.rows.find((r) => r && r.id === a.me);
  if (!mine || !Number.isInteger(mine.place) || mine.place < 1) return null;
  const seconds = secondsOf(a.seconds);
  const others = a.rows.filter((r) => r && r.id !== a.me);
  if (!others.length) return { game: 'farmy-scrabble', outcome: 'done', mode: 'solo', seconds };

  const isBot = typeof a.isBot === 'function' ? a.isBot : () => false;
  const online = !!a.online;
  const twin = online && others.some((r) => !isBot(r.id) && twinOf(a.cardFor?.(r.id), a.myDev));
  if (twin && !a.hosting) return null;

  const opponents = others.map((r) => {
    if (isBot(r.id)) return { human: false, place: r.place };
    if (!online) return { human: true, place: r.place };
    const card = a.cardFor?.(r.id) ?? null;
    return twinOf(card, a.myDev) ? { human: false, place: r.place } : opponentFrom(card, r.place);
  });
  const anyPerson = others.some((r) => !isBot(r.id));
  const mode = anyPerson ? (online ? 'online' : 'local') : 'bots';
  const tiedFirst = mine.place === 1 && others.some((r) => r.place === 1);
  const outcome = mine.place !== 1 ? 'loss' : tiedFirst ? 'draw' : 'win';
  return { game: 'farmy-scrabble', outcome, mode, place: mine.place, opponents, seconds };
}
