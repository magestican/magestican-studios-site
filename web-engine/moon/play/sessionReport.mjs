















const DAY_MS = 86400000;


export function nextMidnight(now) {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  const t = d.getTime();
  return Number.isFinite(t) && t > now ? t : now + DAY_MS;
}

const done = (ms, mode = 'solo') => ({ outcome: 'done', mode, seconds: Math.max(0, Math.round(ms / 1000)) });





export const HIDE_REPORT_MS = 5 * 60000;











export function createSessionTracker() {
  let dayFrom = null;   
  let midnight = null;  
  let visitFrom = null; 
  let hiddenAt = null;  
  return {
    




    hidden(now) {
      if (!Number.isFinite(now) || dayFrom === null || hiddenAt !== null) return null;
      hiddenAt = now;
      if (now - dayFrom < HIDE_REPORT_MS) return null;
      const r = done(now - dayFrom);
      dayFrom = now;
      return r;
    },
    
    shown(now) {
      if (hiddenAt === null) return;
      if (Number.isFinite(now) && dayFrom !== null && now > hiddenAt) dayFrom += now - hiddenAt;
      hiddenAt = null;
    },
    




    tick(now) {
      if (!Number.isFinite(now)) return null;
      if (dayFrom === null) { dayFrom = now; midnight = nextMidnight(now); return null; }
      if (now < midnight) return null;
      const r = done(now - dayFrom);
      dayFrom = now;
      midnight = nextMidnight(now);
      return r;
    },
    
    visitStarted(now) { if (visitFrom === null && Number.isFinite(now)) visitFrom = now; },
    
    visitEnded(now) {
      if (visitFrom === null) return null;
      const r = done(now - visitFrom, 'online');
      visitFrom = null;
      return r;
    },
  };
}
