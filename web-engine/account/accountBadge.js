














import { GAME_NAMES } from './dailyChallenge.js';
import { streakLineFromStatus } from './streak.js';
import { boardLine } from './dailyTasks.js';
import { weeklyLine } from './weeklyGoals.js';
import { seasonLine } from './season.js';
import { openingLine, comebackLine } from './firstRun.js';













export function badgeModel(summary, gameId) {
  const s = summary ?? {};
  const streak = s.streak ?? { current: 0, restDays: 0, bankedToday: false };
  const game = (s.games ?? []).find((g) => g.id === gameId) ?? null;
  const challenge = game?.challenge ?? null;
  const progress = game?.progress ?? { have: 0, target: 0, done: false, fraction: 0 };

  const lines = [];

  
  
  
  
  
  
  const opening = s.opening ?? null;
  const open = opening && opening.active ? openingLine(opening) : null;
  if (open) lines.push(open);
  else lines.push(streakLineFromStatus(streak));

  
  
  const comeback = open ? null : comebackLine(streak);
  if (comeback) lines.push(comeback);

  if (challenge) {
    const head = challenge.featured ? 'Today, featured' : 'Today';
    
    
    
    
    
    
    const bare = !!open && (game?.plays ?? 0) === 0;
    lines.push(game.done
      ? `${head}: ${challenge.text} - done`
      : bare
        ? `${head}: ${challenge.text}`
        : `${head}: ${challenge.text} (${progress.have}/${progress.target})`);
  }

  
  
  
  const tasks = boardLine(s.tasks);
  if (tasks) lines.push(tasks);


  const tour = s.tour ?? { missing: [], complete: false, stamps: 0 };
  
  
  const tourLine = tour.missing.length > 0 && tour.missing.length <= 2
    ? `Barn Tour: ${tour.missing.map((id) => GAME_NAMES[id] ?? id).join(' and ')} left this week`
    : null;
  if (tourLine) lines.push(tourLine);

  return {
    lines,
    rank: s.rank?.name ?? null,
    season: seasonLine(s.season),
    streakDays: streak.current ?? 0,
    
    
    flame: (streak.current ?? 0) >= 2,
    restDays: streak.restDays ?? 0,
    done: !!game?.done,
    tourLine,
  };
}








export function eventLine(event) {
  if (!event || typeof event !== 'object') return null;
  if (event.type === 'streak') {
    if (event.event === 'started') return 'Streak started - come back tomorrow';
    if (event.event === 'extended') return `${event.current} day streak`;
    if (event.event === 'rested') {
      
      
      
      return `${event.current} day streak - a rest day covered the gap`;
    }
    if (event.event === 'reset') return 'Streak restarted';
    return null;
  }
  if (event.type === 'challenge') return `Daily goal done: ${event.text} (+${event.xp} XP)`;
  if (event.type === 'task') return `Task done: ${event.text} (+${event.xp} XP)`;
  if (event.type === 'day-complete') return `Today complete - ${event.done} of ${event.of} tasks (+${event.xp} XP)`;
  if (event.type === 'weekly') return `Weekly goal done: ${event.text} (+${event.xp} XP)`;
  if (event.type === 'week-complete') return `This week is done (+${event.xp} XP)`;
  
  
  
  
  if (event.type === 'rested') {
    const away = (event.daysAway ?? 0) >= 2 ? ` after ${event.daysAway} days away` : '';
    return `Welcome back${away} - double XP this session (+${event.xp})`;
  }
  if (event.type === 'new-game') {
    return `First time in ${GAME_NAMES[event.gameId] ?? 'a new game'} (+${event.xp} XP)`;
  }
  if (event.type === 'season-tier') return `Season tier ${event.tier}`;
  if (event.type === 'tour') return `Barn Tour complete - all four games this week (+${event.xp} XP)`;
  if (event.type === 'rank') return `New rank: ${event.name}`;
  return null;
}














export function panelModel(summary) {
  const s = summary ?? {};
  const tasks = s.tasks ?? { tasks: [], doneCount: 0, required: 0, complete: false };
  const weekly = s.weekly ?? { goals: [], doneCount: 0, required: 0, complete: false };
  const tour = s.tour ?? { missing: [], played: [], complete: false, stamps: 0 };
  const opening = s.opening ?? null;

  return {
    
    opening: opening && opening.active
      ? { line: openingLine(opening), steps: opening.steps, doneCount: opening.doneCount, total: opening.total }
      : null,
    streak: {
      line: streakLineFromStatus(s.streak ?? {}),
      comeback: comebackLine(s.streak ?? {}),
      current: s.streak?.current ?? 0,
      best: s.streak?.best ?? 0,
      restDays: s.streak?.restDays ?? 0,
      flame: (s.streak?.current ?? 0) >= 2,
    },
    daily: {
      line: boardLine(tasks),
      complete: !!tasks.complete,
      doneCount: tasks.doneCount ?? 0,
      required: tasks.required ?? 0,
      rows: (tasks.tasks ?? []).map((t) => ({
        slot: t.task.slot,
        text: t.task.text,
        done: t.progress.done,
        have: t.progress.have,
        target: t.progress.target,
        percent: Math.round(t.progress.fraction * 100),
        xp: t.task.xp,
      })),
    },
    weekly: {
      line: weeklyLine(weekly),
      complete: !!weekly.complete,
      daysLeft: weekly.daysLeft ?? null,
      rows: (weekly.goals ?? []).map((g) => ({
        slot: g.goal.slot,
        text: g.goal.text,
        done: g.progress.done,
        have: g.progress.have,
        target: g.progress.target,
        percent: Math.round(g.progress.fraction * 100),
        xp: g.goal.xp,
      })),
    },
    season: {
      line: seasonLine(s.season),
      name: s.season?.name ?? null,
      tier: s.season?.tier ?? 0,
      tiers: s.season?.tiers ?? 0,
      percent: Math.round((s.season?.fraction ?? 0) * 100),
      daysLeft: s.season?.daysLeft ?? null,
      bestTier: s.season?.bestTier ?? 0,
    },
    rank: {
      name: s.rank?.name ?? null,
      percent: Math.round((s.rank?.fraction ?? 0) * 100),
      nextName: s.rank?.nextName ?? null,
    },
    tour: {
      stamps: tour.stamps ?? 0,
      complete: !!tour.complete,
      
      missing: (tour.missing ?? []).map((id) => GAME_NAMES[id] ?? id),
      played: (tour.played ?? []).map((id) => GAME_NAMES[id] ?? id),
    },
    games: (s.games ?? []).map((g) => ({
      id: g.id,
      name: GAME_NAMES[g.id] ?? g.id,
      goal: g.challenge?.text ?? null,
      featured: !!g.challenge?.featured,
      done: !!g.done,
      have: g.progress?.have ?? 0,
      target: g.progress?.target ?? 0,
      neverPlayed: (g.plays ?? 0) === 0,
    })),
  };
}


export function sessionLines(events) {
  const out = [];
  for (const e of events ?? []) {
    const line = eventLine(e);
    if (line && !out.includes(line)) out.push(line);
  }
  return out;
}





const STYLE_ID = 'arbelo-account-badge-style';









export function mountAccountBadge(host, summary, gameId) {
  if (!host || typeof document === 'undefined') return null;
  const model = badgeModel(summary, gameId);
  injectStyles();
  host.textContent = '';
  host.className = `${host.className || ''} account-badge`.trim();
  for (let i = 0; i < model.lines.length; i++) {
    const row = document.createElement('div');
    row.className = i === 0 ? 'account-badge-streak' : 'account-badge-line';
    if (i === 0 && model.flame) {
      const flame = document.createElement('span');
      flame.className = 'account-badge-flame';
      flame.textContent = '\u{1F525}';
      row.appendChild(flame);
    }
    row.appendChild(document.createTextNode(model.lines[i]));
    host.appendChild(row);
  }
  if (model.rank) {
    const rank = document.createElement('div');
    rank.className = 'account-badge-rank';
    rank.textContent = model.rank;
    host.appendChild(rank);
  }
  return host;
}

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    .account-badge { font: 12px/1.5 system-ui, sans-serif; color: #cbd3e1; }
    .account-badge-streak { color: #ffd45e; font-weight: 700; }
    .account-badge-flame { margin-right: 4px; }
    .account-badge-line { color: #9aa4b5; }
    .account-badge-rank { color: #7f8798; letter-spacing: .08em; text-transform: uppercase; font-size: 10px; margin-top: 2px; }
  `;
  document.head.appendChild(el);
}
