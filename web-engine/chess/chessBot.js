















































import {
  CHALLENGER, ceilingFor, pickRanked, considers, describeBot,
} from '../words/botSkill.js';
import { levelOf } from '../words/scoring.js';
import { MATE, depthFor, createSearch } from './search.js';


export const BOT_ID = 'bot';


export const isBot = (id) => id === BOT_ID;












export const POINTS = Object.freeze({ win: 60, draw: 30, loss: 15 });


export function pointsFrom({ won = 0, drawn = 0, lost = 0 } = {}) {
  return Math.max(0, won) * POINTS.win
    + Math.max(0, drawn) * POINTS.draw
    + Math.max(0, lost) * POINTS.loss;
}











export function levelFrom(record) {
  return levelOf(pointsFrom(record)).share;
}


export function rankFrom(record) {
  return levelOf(pointsFrom(record)).name;
}








export function botFor(level = 0, { index = 0 } = {}) {
  const strength = Math.min(CHALLENGER, ceilingFor(level));
  return {
    ...describeBot(index, strength),
    name: 'The bot',
    strength,
    depth: depthFor(strength),
  };
}









export function describeBotPlayer(bot) {
  if (!bot) return '';
  const plies = bot.depth === 1 ? 'one move' : `${bot.depth} moves`;
  return `You are playing a bot. It looks ${plies} ahead and plays at about your level - never above it.`;
}













export function chooseMove(ranked, strength, random = Math.random) {
  if (!ranked || !ranked.length) return null;
  const at = pickRanked(ranked.length, strength, random);
  const picked = ranked[Math.max(0, Math.min(ranked.length - 1, at))];
  const best = ranked[0];
  const bestIsMate = Number.isFinite(best?.score) && best.score >= MATE - 1000;
  if (bestIsMate && picked !== best && considers(strength, random)) return best.move;
  return picked?.move ?? null;
}








export function thinkerFor(position, bot) {
  return createSearch(position, { maxDepth: bot?.depth ?? 2 });
}









export function thinkingShare(search, bot) {
  if (!search || !bot?.depth) return 0;
  const done = Math.max(0, search.completedDepth);
  return Math.max(0, Math.min(1, done / bot.depth));
}

export { CHALLENGER, pickRanked, considers };
