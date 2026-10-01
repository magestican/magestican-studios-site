
































































































import { SeededRng } from '../rng/seededRng.js';
import {
  GAME_IDS, GAME_NAMES, isGameId, gameOfTheDay, goalDeckFor, COMPLETION_METRIC,
} from './dailyChallenge.js';


export const TASK_SLOTS = Object.freeze(['warmup', 'main', 'wildcard']);


export const TASKS_TO_COMPLETE_DAY = 2;








export const TASK_XP = Object.freeze({ warmup: 15, main: 45, wildcard: 30 });


export const DAY_COMPLETE_XP = 60;


const GRADED = GAME_IDS.filter((id) => goalDeckFor(id).length > 1);













const WARMUPS = Object.freeze([
  Object.freeze({ kind: 'any-completion', min: 1, max: 1,
    text: () => 'Play any of the four games' }),
  Object.freeze({ kind: 'featured-play', min: 1, max: 1,
    text: (t, ctx) => `Play the game of the day: ${GAME_NAMES[ctx.featured]}` }),
]);





const WILDCARDS = Object.freeze([
  Object.freeze({ kind: 'distinct-games', min: 2, max: 3,
    text: (t) => `Play ${t} different games today` }),
  Object.freeze({ kind: 'any-completion', min: 3, max: 5,
    text: (t) => `Finish ${t} rounds across any of the games` }),
  Object.freeze({ kind: 'game-pair', min: 2, max: 2,
    text: (t, ctx) => `Play ${GAME_NAMES[ctx.pair[0]]} and ${GAME_NAMES[ctx.pair[1]]}` }),
]);










export function dailyTaskBoard(utcDay) {
  if (!Number.isInteger(utcDay) || utcDay < 0) return null;
  const featured = gameOfTheDay(utcDay);
  if (!featured) return null;
  
  
  
  
  
  const rng = new SeededRng(hash32(`arbelo-tasks-v1:${utcDay}`));
  const ctx = { featured, pair: pickPair(rng, featured) };

  
  
  
  
  
  
  
  
  const main = dealMain(rng, ctx);
  const tasks = [
    dealWarmup(rng, ctx, main),
    main,
    dealWildcard(rng, ctx),
  ].filter(Boolean);

  return Object.freeze({
    day: utcDay,
    featured,
    required: Math.min(TASKS_TO_COMPLETE_DAY, tasks.length),
    tasks: Object.freeze(tasks),
  });
}

function dealWarmup(rng, ctx, main) {
  const deck = (main && main.gameId === ctx.featured)
    ? WARMUPS.filter((w) => w.kind !== 'featured-play')
    : WARMUPS;
  const t = rng.pick(deck);
  const target = rng.rangeI(t.min, t.max);
  return task('warmup', t.kind, target, t.text(target, ctx), {
    gameId: t.kind === 'featured-play' ? ctx.featured : null,
  });
}





function dealMain(rng, ctx) {
  const gameId = (GRADED.includes(ctx.featured) && rng.next() < 0.6)
    ? ctx.featured
    : rng.pick(GRADED);
  const deck = goalDeckFor(gameId);
  if (!deck.length) return null;
  const goal = rng.pick(deck);
  
  
  
  
  
  
  
  
  const target = rng.rangeI(goal.min, goal.max);
  const noun = target === 1 ? goal.noun : goal.nouns;
  return task('main', 'game-metric', target,
    `${goal.verb} ${target} ${noun} in ${GAME_NAMES[gameId]}`,
    { gameId, metric: goal.metric });
}

function dealWildcard(rng, ctx) {
  const t = rng.pick(WILDCARDS);
  const target = rng.rangeI(t.min, t.max);
  return task('wildcard', t.kind, target, t.text(target, ctx),
    t.kind === 'game-pair' ? { pair: ctx.pair } : {});
}



function pickPair(rng, featured) {
  const others = GAME_IDS.filter((id) => id !== featured);
  const other = rng.pick(others);
  
  
  
  return GAME_IDS.filter((id) => id === featured || id === other);
}

function task(slot, kind, target, text, extra) {
  return Object.freeze({
    slot,
    kind,
    target: Math.max(1, Math.floor(target)),
    xp: TASK_XP[slot],
    text,
    gameId: extra.gameId ?? null,
    metric: extra.metric ?? null,
    pair: extra.pair ? Object.freeze([...extra.pair]) : null,
  });
}













export function taskProgress(task, ledger) {
  const empty = { have: 0, target: 0, done: false, fraction: 0 };
  if (!task) return empty;
  const target = Math.max(1, task.target);
  const have = countFor(task, ledger);
  return {
    have: Math.min(have, target),
    target,
    done: have >= target,
    fraction: Math.min(1, have / target),
  };
}

function countFor(task, ledger) {
  const l = (ledger && typeof ledger === 'object') ? ledger : {};
  switch (task.kind) {
    case 'game-metric':
      return num(l[task.gameId]?.[task.metric]);
    case 'featured-play':
      return completions(l, task.gameId);
    case 'any-completion':
      return GAME_IDS.reduce((n, id) => n + completions(l, id), 0);
    case 'distinct-games':
      return GAME_IDS.filter((id) => completions(l, id) > 0).length;
    case 'game-pair':
      return (task.pair ?? []).filter((id) => completions(l, id) > 0).length;
    default:
      return 0;
  }
}




function completions(ledger, gameId) {
  if (!isGameId(gameId)) return 0;
  return num(ledger[gameId]?.[COMPLETION_METRIC[gameId]]);
}

const num = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};







export function boardStatus(board, ledger) {
  if (!board) {
    return { day: null, featured: null, tasks: [], doneCount: 0, required: 0,
      complete: false, xpEarned: 0, xpAvailable: 0 };
  }
  const tasks = board.tasks.map((t) => ({ task: t, progress: taskProgress(t, ledger) }));
  const doneCount = tasks.filter((t) => t.progress.done).length;
  const complete = doneCount >= board.required;
  const xpEarned = tasks.reduce((n, t) => n + (t.progress.done ? t.task.xp : 0), 0)
    + (complete ? DAY_COMPLETE_XP : 0);
  return {
    day: board.day,
    featured: board.featured,
    tasks,
    doneCount,
    required: board.required,
    complete,
    xpEarned,
    xpAvailable: board.tasks.reduce((n, t) => n + t.xp, 0) + DAY_COMPLETE_XP,
  };
}








export function boardLine(status) {
  const s = status ?? {};
  const total = (s.tasks ?? []).length;
  if (!total) return null;
  if (s.complete) {
    return s.doneCount >= total
      ? 'All three tasks done today'
      : `Today is done - ${total - s.doneCount} task still open if you want it`;
  }
  if (!s.doneCount) return `${total} tasks today - any ${s.required} finishes the day`;
  return `${s.doneCount} of ${s.required} done today`;
}




function hash32(s) {
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h || 1;
}
