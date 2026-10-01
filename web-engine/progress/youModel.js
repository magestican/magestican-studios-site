


















import { trophyName } from './snapshot.js';
import { PROFILE_GAME_IDS, PROFILE_GAME_NAMES } from './gameIds.js';
import { NO_WIN_GAME_IDS } from '../account/achievements.js';


export const YOU_URL = '/you.html';
const SHARE_URL = 'https://magesticanstudios.com/';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const int = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
const clamp01 = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;


export function timeLine(seconds) {
  const s = int(seconds);
  if (s <= 0) return null;
  if (s < 60) return 'under a minute';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} m`;
  return `${Math.floor(m / 60)} h ${m % 60} m`;
}

function streakLineOf(streak) {
  const cur = int(streak?.current);
  const best = int(streak?.best);
  if (cur >= 2) return `${cur} day streak · best ${best}`;
  if (cur === 1) return 'Played today - come back tomorrow to start a streak';
  return best > 1 ? `Play today to start a streak · best ${best}` : 'Play today to start a streak';
}




export function youModel(input) {
  const i = isObj(input) ? input : {};
  const s = isObj(i.snapshot) ? i.snapshot : {};
  const level = Math.max(1, int(s.level));
  const into = int(s.xpIntoLevel);
  const need = int(s.xpForNext);
  const gamesIn = isObj(s.games) ? s.games : {};

  const trophies = (Array.isArray(i.trophyRows) ? i.trophyRows : [])
    .filter(isObj)
    .map((t) => ({
      id: String(t.id),
      name: trophyName(t.id),
      unlocked: t.unlocked === true,
      at: t.unlocked === true && Number.isFinite(t.at) ? t.at : null,
      percent: Math.round(clamp01(t.unlocked === true ? 1 : Number(t.progress)) * 100),
    }));
  const next = trophies
    .filter((t) => !t.unlocked)
    .reduce((best, t) => (!best || t.percent > best.percent ? t : best), null);

  
  
  const ids = [
    ...PROFILE_GAME_IDS.filter((id) => Object.hasOwn(gamesIn, id)),
    ...Object.keys(gamesIn).filter((id) => !PROFILE_GAME_IDS.includes(id)).sort(),
  ];
  const games = ids
    .map((id) => ({ id, g: isObj(gamesIn[id]) ? gamesIn[id] : {} }))
    .filter(({ g }) => int(g.plays) > 0)
    .map(({ id, g }) => {
      const r = isObj(g.rating) && Number.isFinite(g.rating.r) ? g.rating : null;
      return {
        id,
        name: Object.hasOwn(PROFILE_GAME_NAMES, id) ? PROFILE_GAME_NAMES[id] : id,
        plays: int(g.plays),
        
        wins: NO_WIN_GAME_IDS.includes(id) ? null : int(g.wins),
        timeLine: timeLine(g.seconds),
        mastery: Math.max(1, int(g.mastery)),
        rating: r ? Math.round(r.r) : null,
        
        
        
        ratingLine: r ? `${plural(int(r.n), 'rated game', 'rated games')} · best ${Math.round(Number(r.peak) || r.r)} · this device` : null,
      };
    });

  const badgesEarned = int(s.badges?.earned);
  const trophiesEarned = trophies.length ? trophies.filter((t) => t.unlocked).length : (Array.isArray(s.trophies) ? s.trophies.length : 0);
  const title = typeof s.title === 'string' && s.title ? s.title : 'Apprentice';

  return {
    empty: games.length === 0 && int(s.xp) === 0,
    signedIn: s.signedIn === true,
    hero: {
      level,
      title,
      xp: int(s.xp),
      xpLine: need > 0 ? `${into} / ${need} XP to level ${level + 1}` : `${int(s.xp)} XP`,
      fraction: need > 0 ? clamp01(into / need) : 1,
      nextTrophy: next ? { id: next.id, name: next.name, percent: next.percent } : null,
    },
    streakLine: streakLineOf(s.streak),
    badgeLine: `${badgesEarned} of ${int(s.badges?.total)} badges`,
    trophies,
    trophyCount: `${trophies.filter((t) => t.unlocked).length} of ${trophies.length} trophies`,
    games,
    share: {
      
      
      text: `I am level ${level} (${title}) on Magestican Studios, with ${plural(badgesEarned, 'badge', 'badges')} and ${plural(trophiesEarned, 'trophy', 'trophies')}.`,
      url: SHARE_URL,
    },
  };
}





export function chipModel(snapshot) {
  if (!isObj(snapshot)) return null;
  const games = isObj(snapshot.games) ? Object.values(snapshot.games) : [];
  if (int(snapshot.xp) === 0 && !games.some((g) => int(g?.plays) > 0)) return null;
  const level = Math.max(1, int(snapshot.level));
  const into = int(snapshot.xpIntoLevel);
  const need = int(snapshot.xpForNext);
  const title = typeof snapshot.title === 'string' && snapshot.title ? snapshot.title : 'Apprentice';
  return {
    label: `Lv ${level}`,
    fraction: need > 0 ? clamp01(into / need) : 1,
    href: YOU_URL,
    aria: `Level ${level}, ${title}. ${into} of ${need} XP to level ${level + 1}. Open your progress page.`,
  };
}
