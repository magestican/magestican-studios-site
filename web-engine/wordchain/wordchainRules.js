














import { normalise, endsGame, isLink, defaultLink } from './wordchainLang.js';
import { lookup, tailsOf, headOf, isKiller } from './wordchainDict.js';

export const REASONS = Object.freeze(['timeout', 'resign', 'n']);

export function newGame({ lang = 'en', link } = {}) {
  return {
    lang,
    link: isLink(lang, link) ? link : defaultLink(lang),
    chain: [],                 
    used: new Set(),
    turn: 0,                   
    over: false,
    loser: null,
    reason: null,
  };
}

const last = (game) => game.chain[game.chain.length - 1];










export function judge(dict, game, text) {
  if (game.over) return { error: 'over' };
  if (normalise(game.lang, text) === null && !(game.lang === 'ja' && lookup(dict, text).length)) return { error: 'shape' };
  const all = lookup(dict, text);
  if (!all.length) return { error: 'notWord' };
  const prev = last(game);
  const linked = prev === undefined ? all : all.filter((i) => tailsOf(dict, game.link, prev).includes(headOf(dict, game.link, i)));
  if (!linked.length) return { error: 'link' };
  const fresh = linked.filter((i) => !game.used.has(i));
  if (!fresh.length) return { error: 'used' };
  if (prev === undefined) {
    const open = fresh.filter((i) => !isKiller(dict, game.link, i));
    if (!open.length) return { error: 'killer' };
    return { entry: open[0] };
  }
  return { entry: fresh[0] };
}


export function play(dict, game, entry) {
  const used = new Set(game.used);
  used.add(entry);
  const next = { ...game, chain: [...game.chain, entry], used };
  if (endsGame(game.lang, game.link, dict.words[entry])) {
    return { ...next, over: true, loser: game.turn, reason: 'n' };
  }
  return { ...next, turn: 1 - game.turn };
}


export function forfeit(game, reason) {
  if (game.over) return game;
  return { ...game, over: true, loser: game.turn, reason: REASONS.includes(reason) ? reason : 'resign' };
}

export const winner = (game) => (game.over && game.loser !== null ? 1 - game.loser : null);






export function needed(dict, game) {
  const prev = last(game);
  if (prev === undefined) return [];
  if (game.lang === 'vi') {
    const p = dict.words[prev].split(' ');
    return [p[p.length - 1]];
  }
  return tailsOf(dict, game.link, prev);
}
