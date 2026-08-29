




















































import { daysBetween } from './dayKey.js';


export const REST_EARNED_EVERY = 5;


export const MAX_REST_DAYS = 2;





export const MAX_STREAK = 3650;

export function emptyStreak() {
  return {
    current: 0,      
    best: 0,         
    lastDay: null,   
    restDays: 0,     
    daysPlayed: 0,   
  };
}


export function normaliseStreak(raw) {
  const base = emptyStreak();
  if (!raw || typeof raw !== 'object') return base;
  const int = (v, max) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
  };
  const lastDay = Number.isInteger(raw.lastDay) && raw.lastDay >= 0 ? raw.lastDay : null;
  const current = int(raw.current, MAX_STREAK);
  return {
    current,
    
    
    
    best: Math.max(current, int(raw.best, MAX_STREAK)),
    lastDay,
    restDays: int(raw.restDays, MAX_REST_DAYS),
    daysPlayed: int(raw.daysPlayed, MAX_STREAK * 10),
  };
}

















export function recordDay(streak, day) {
  const s = normaliseStreak(streak);
  
  
  
  
  
  const same = (event) => ({ streak: (streak && typeof streak === 'object') ? streak : s, event, restSpent: 0 });

  if (!Number.isInteger(day) || day < 0) return same('ignored');

  if (s.lastDay === null) {
    return {
      streak: grantRest({ ...s, current: 1, best: Math.max(1, s.best), lastDay: day, daysPlayed: s.daysPlayed + 1 }),
      event: 'started',
      restSpent: 0,
    };
  }

  const gap = daysBetween(s.lastDay, day);
  if (gap === null) return same('ignored');
  if (gap === 0) return same('same-day');
  
  if (gap < 0) return same('ignored');

  const missed = gap - 1;
  if (missed === 0) {
    return { streak: extend(s, day, 0), event: 'extended', restSpent: 0 };
  }
  if (missed <= s.restDays) {
    return { streak: extend(s, day, missed), event: 'rested', restSpent: missed };
  }
  return {
    streak: {
      ...s,
      current: 1,
      best: Math.max(s.best, s.current),
      lastDay: day,
      
      
      
      restDays: s.restDays,
      daysPlayed: s.daysPlayed + 1,
    },
    event: 'reset',
    restSpent: 0,
  };
}

function extend(s, day, restSpent) {
  const current = Math.min(MAX_STREAK, s.current + 1);
  return grantRest({
    ...s,
    current,
    best: Math.max(s.best, current),
    lastDay: day,
    restDays: s.restDays - restSpent,
    daysPlayed: s.daysPlayed + 1,
  });
}






function grantRest(s) {
  if (s.current > 0 && s.current % REST_EARNED_EVERY === 0) {
    return { ...s, restDays: Math.min(MAX_REST_DAYS, s.restDays + 1) };
  }
  return s;
}












export function streakStatus(streak, today) {
  const s = normaliseStreak(streak);
  const out = {
    current: s.current, best: s.best, restDays: s.restDays, daysPlayed: s.daysPlayed,
    bankedToday: false, atRisk: false, coverable: false, willBreak: false,
  };
  if (!Number.isInteger(today) || s.lastDay === null) return out;
  const gap = daysBetween(s.lastDay, today);
  if (gap === null || gap < 0) return out;
  if (gap === 0) { out.bankedToday = true; return out; }
  const missed = gap - 1;
  out.atRisk = s.current > 0;
  if (missed === 0) return out;
  if (missed <= s.restDays) { out.coverable = true; return out; }
  out.willBreak = s.current > 0;
  return out;
}













export function streakLineFromStatus(st) {
  const s = st ?? {};
  const current = Number(s.current) || 0;
  if (current <= 0) return 'Play today to start a streak';
  const days = `${current} day${current === 1 ? '' : 's'} in a row`;
  if (s.bankedToday) return `${days} - today is banked`;
  if (s.willBreak) return `${days} - play today and it starts again`;
  return `${days} - play today to keep it`;
}
