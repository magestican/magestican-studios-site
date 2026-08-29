














import { GAME_NAMES } from './dailyChallenge.js';
import { streakLineFromStatus } from './streak.js';













export function badgeModel(summary, gameId) {
  const s = summary ?? {};
  const streak = s.streak ?? { current: 0, restDays: 0, bankedToday: false };
  const game = (s.games ?? []).find((g) => g.id === gameId) ?? null;
  const challenge = game?.challenge ?? null;
  const progress = game?.progress ?? { have: 0, target: 0, done: false, fraction: 0 };

  const lines = [];
  lines.push(streakLineFromStatus(streak));

  if (challenge) {
    const head = challenge.featured ? 'Today, featured' : 'Today';
    lines.push(game.done
      ? `${head}: ${challenge.text} - done`
      : `${head}: ${challenge.text} (${progress.have}/${progress.target})`);
  }

  const tour = s.tour ?? { missing: [], complete: false, stamps: 0 };
  
  
  const tourLine = tour.missing.length > 0 && tour.missing.length <= 2
    ? `Barn Tour: ${tour.missing.map((id) => GAME_NAMES[id] ?? id).join(' and ')} left this week`
    : null;
  if (tourLine) lines.push(tourLine);

  return {
    lines,
    rank: s.rank?.name ?? null,
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
  if (event.type === 'tour') return `Barn Tour complete - all four games this week (+${event.xp} XP)`;
  if (event.type === 'rank') return `New rank: ${event.name}`;
  return null;
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
