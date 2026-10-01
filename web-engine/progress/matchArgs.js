














import { opponentFrom } from './peerCards.js';

const OUTCOME = Object.freeze({ won: 'win', lost: 'loss', draw: 'draw' });

const secondsOf = (s) => (Number.isFinite(s) && s > 0 ? Math.round(s) : undefined);










export function createReportGate() {
  let round = 0;
  let done = -1;
  let start = null;
  return {
    begin(seats) { round += 1; start = Array.isArray(seats) ? [...seats] : null; },
    
    settle() { done = round; },
    
    take() {
      if (done === round) return null;
      done = round;
      return { startSeats: start };
    },
  };
}


const twinOf = (card, myDev) => !!(card && typeof card.dev === 'string' && card.dev && card.dev === myDev);










export function twoSeatMatch(a) {
  if (!a || !Array.isArray(a.seats) || !a.seats.includes(a.me)) return null;
  const outcome = OUTCOME[a.result];
  if (!outcome) return null;
  const idx = a.seats.indexOf(a.me);
  const opp = a.seats[1 - idx] ?? null;
  
  
  if (!opp || opp === a.me) return null;
  const isBot = typeof a.isBot === 'function' ? a.isBot : () => false;
  const bot = isBot(opp);
  const mine = outcome === 'loss' ? 2 : 1;
  const theirs = outcome === 'win' ? 2 : 1;
  let opponent;
  let mode;
  if (bot) { mode = 'bots'; opponent = { human: false, place: theirs }; }
  else if (a.online) {
    mode = 'online';
    const card = a.cardFor?.(opp) ?? null;
    
    
    if (twinOf(card, a.myDev)) {
      if (!a.hosting) return null;
      opponent = { human: false, place: theirs };
    } else {
      const fromStart = a.startSeats === undefined
        || (Array.isArray(a.startSeats) && a.startSeats[1 - idx] === opp);
      opponent = fromStart ? opponentFrom(card, theirs) : { human: false, place: theirs };
    }
  } else { mode = 'local'; opponent = { human: true, place: theirs }; }
  return { game: a.game, outcome, mode, place: mine, opponents: [opponent], seconds: secondsOf(a.seconds) };
}







export function winnerMatch(a) {
  if (!a || !Array.isArray(a.seats)) return null;
  const me = a.mySeat;
  if (!Number.isInteger(me) || me < 0 || me >= a.seats.length) return null;
  if (!Number.isInteger(a.winner) || a.winner < 0 || a.winner >= a.seats.length) return null;
  const placeOf = (i) => (i === a.winner ? 1 : 2);
  const others = a.seats.map((s, i) => ({ s, i })).filter(({ i }) => i !== me);
  
  const twin = a.online && others.some(({ s }) => s && s.kind !== 'bot' && twinOf(a.cardFor?.(s.by), a.myDev));
  if (twin && !a.hosting) return null;
  const opponents = others.map(({ s, i }) => {
    if (!s || s.kind === 'bot') return { human: false, place: placeOf(i) };
    if (a.online) {
      const card = a.cardFor?.(s.by) ?? null;
      return twinOf(card, a.myDev) ? { human: false, place: placeOf(i) } : opponentFrom(card, placeOf(i));
    }
    return { human: true, place: placeOf(i) };
  });
  const anyPerson = others.some(({ s }) => s && s.kind !== 'bot');
  const mode = a.online && anyPerson ? 'online' : anyPerson ? 'local' : 'bots';
  return {
    game: a.game,
    outcome: me === a.winner ? 'win' : 'loss',
    mode,
    place: placeOf(me),
    opponents,
    seconds: secondsOf(a.seconds),
  };
}
