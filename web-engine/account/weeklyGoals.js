
































































import { SeededRng } from '../rng/seededRng.js';
import { weekNumber, weekStartDay, daysLeftInWeek, DAYS_PER_WEEK } from './dayKey.js';
import {
  GAME_IDS, GAME_NAMES, isGameId, goalDeckFor, COMPLETION_METRIC,
} from './dailyChallenge.js';


export const GOALS_TO_COMPLETE_WEEK = 2;


export const WEEKLY_GOAL_XP = 120;
export const WEEK_COMPLETE_XP = 180;


export const WEEK_LIMITS = Object.freeze({ maxCount: 1000000, maxDays: DAYS_PER_WEEK });

const GRADED = GAME_IDS.filter((id) => goalDeckFor(id).length > 1);










const SLOTS = Object.freeze(['rhythm', 'volume', 'breadth']);








export function weeklyBoard(utcWeek) {
  if (!Number.isInteger(utcWeek) || utcWeek < 0) return null;
  const rng = new SeededRng(hash32(`arbelo-weekly-v1:${utcWeek}`));

  
  
  
  const rhythmTarget = rng.rangeI(3, 4);
  const volumeGame = rng.pick(GRADED);
  const volumeGoal = rng.pick(goalDeckFor(volumeGame));
  
  
  
  
  
  const volumeTarget = Math.max(volumeGoal.min + 1, volumeGoal.max * 3);
  const breadthTarget = rng.rangeI(3, GAME_IDS.length);

  const goals = [
    goal('rhythm', 'days-played', rhythmTarget,
      `Play on ${rhythmTarget} different days this week`, {}),
    goal('volume', 'game-metric', volumeTarget,
      `${volumeGoal.verb} ${volumeTarget} ${volumeTarget === 1 ? volumeGoal.noun : volumeGoal.nouns} in ${GAME_NAMES[volumeGame]} this week`,
      { gameId: volumeGame, metric: volumeGoal.metric }),
    goal('breadth', 'distinct-games', breadthTarget,
      breadthTarget >= GAME_IDS.length
        ? 'Play all four games this week'
        : `Play ${breadthTarget} of the four games this week`, {}),
  ];

  return Object.freeze({
    week: utcWeek,
    startDay: weekStartDay(utcWeek),
    required: Math.min(GOALS_TO_COMPLETE_WEEK, goals.length),
    goals: Object.freeze(goals),
  });
}


export function weeklyBoardForDay(utcDay) {
  return weeklyBoard(weekNumber(utcDay));
}

function goal(slot, kind, target, text, extra) {
  return Object.freeze({
    slot,
    kind,
    target: Math.max(1, Math.floor(target)),
    xp: WEEKLY_GOAL_XP,
    text,
    gameId: extra.gameId ?? null,
    metric: extra.metric ?? null,
  });
}





export function emptyWeek() {
  return {
    week: null,        
    days: 0,           
    lastDay: null,     
    
    progress: {},      
  };
}


export function normaliseWeek(raw) {
  const base = emptyWeek();
  if (!raw || typeof raw !== 'object') return base;
  const week = Number.isInteger(raw.week) && raw.week >= 0 ? raw.week : null;
  if (week === null) return base;
  const progress = {};
  if (raw.progress && typeof raw.progress === 'object') {
    for (const id of GAME_IDS) {
      const p = raw.progress[id];
      if (!p || typeof p !== 'object') continue;
      const kept = {};
      for (const m of goalDeckFor(id).map((g) => g.metric)) {
        kept[m] = clamp(p[m], WEEK_LIMITS.maxCount);
      }
      progress[id] = kept;
    }
  }
  return {
    week,
    days: clamp(raw.days, WEEK_LIMITS.maxDays),
    lastDay: Number.isInteger(raw.lastDay) && raw.lastDay >= 0 ? raw.lastDay : null,
    progress,
  };
}











export function recordWeekPlay(week, { utcDay, gameId, metrics = {} } = {}) {
  if (!Number.isInteger(utcDay) || utcDay < 0 || !isGameId(gameId)) {
    return (week && typeof week === 'object') ? week : emptyWeek();
  }
  const w = weekNumber(utcDay);
  if (w === null) return (week && typeof week === 'object') ? week : emptyWeek();

  const prev = normaliseWeek(week);
  const rolled = prev.week === w ? prev : { ...emptyWeek(), week: w };

  const dayProgress = { ...(rolled.progress[gameId] ?? {}) };
  for (const m of goalDeckFor(gameId).map((g) => g.metric)) {
    const add = clamp(metrics[m], WEEK_LIMITS.maxCount);
    if (add) dayProgress[m] = Math.min(WEEK_LIMITS.maxCount, (dayProgress[m] ?? 0) + add);
  }

  
  
  
  const isNewDay = rolled.lastDay !== utcDay;
  return {
    week: w,
    days: Math.min(WEEK_LIMITS.maxDays, rolled.days + (isNewDay ? 1 : 0)),
    lastDay: utcDay,
    progress: { ...rolled.progress, [gameId]: dayProgress },
  };
}





export function weeklyProgress(goal, ledger) {
  const empty = { have: 0, target: 0, done: false, fraction: 0 };
  if (!goal) return empty;
  const w = normaliseWeek(ledger);
  const target = Math.max(1, goal.target);
  let have = 0;
  if (goal.kind === 'days-played') have = w.days;
  else if (goal.kind === 'game-metric') have = clamp(w.progress[goal.gameId]?.[goal.metric], WEEK_LIMITS.maxCount);
  else if (goal.kind === 'distinct-games') {
    have = GAME_IDS.filter((id) => clamp(w.progress[id]?.[COMPLETION_METRIC[id]], WEEK_LIMITS.maxCount) > 0).length;
  }
  return {
    have: Math.min(have, target),
    target,
    done: have >= target,
    fraction: Math.min(1, have / target),
  };
}








export function weeklyStatus(board, ledger, utcDay = null) {
  if (!board) {
    return { week: null, goals: [], doneCount: 0, required: 0, complete: false,
      daysLeft: null, stale: false, xpEarned: 0, xpAvailable: 0 };
  }
  const w = normaliseWeek(ledger);
  
  
  
  
  const stale = w.week !== null && w.week !== board.week;
  const usable = stale ? emptyWeek() : w;
  const goals = board.goals.map((g) => ({ goal: g, progress: weeklyProgress(g, usable) }));
  const doneCount = goals.filter((g) => g.progress.done).length;
  const complete = doneCount >= board.required;
  return {
    week: board.week,
    goals,
    doneCount,
    required: board.required,
    complete,
    stale,
    daysLeft: daysLeftInWeek(utcDay),
    xpEarned: goals.reduce((n, g) => n + (g.progress.done ? g.goal.xp : 0), 0)
      + (complete ? WEEK_COMPLETE_XP : 0),
    xpAvailable: board.goals.reduce((n, g) => n + g.xp, 0) + WEEK_COMPLETE_XP,
  };
}






export function weeklyLine(status) {
  const s = status ?? {};
  const total = (s.goals ?? []).length;
  if (!total) return null;
  if (s.complete) return 'This week is done';
  const left = s.daysLeft;
  const when = left === null ? 'this week'
    : left === 1 ? 'today - last day of the week'
      : `over the next ${left} days`;
  if (!s.doneCount) return `${total} weekly goals, ${when}`;
  return `${s.doneCount} of ${s.required} weekly goals done, ${when}`;
}

const clamp = (v, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

function hash32(s) {
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h || 1;
}


export const WEEKLY_SLOTS = SLOTS;
