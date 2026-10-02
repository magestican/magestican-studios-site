





export const ACTIVITIES = ['world', 'battle', 'ritual', 'cutscene', 'dialog', 'menu'];
export function newClock() {
  const mode = {};
  for (const a of ACTIVITIES) mode[a] = 0;
  return { total: 0, mode, chapter: {} };
}

export function fixClock(c) {
  const out = newClock();
  if (!c || typeof c !== 'object') return out;
  out.total = num(c.total);
  for (const a of ACTIVITIES) out.mode[a] = num(c.mode && c.mode[a]);
  if (c.chapter && typeof c.chapter === 'object') for (const [k, v] of Object.entries(c.chapter)) out.chapter[k] = num(v);
  return out;
}
const num = (v) => (Number.isFinite(v) && v > 0 ? v : 0);


export function activityOf(mode, { dialog = false, ritual = false } = {}) {
  if (mode === 'title' || mode === 'evolve') return null;
  if (mode === 'cutscene') return 'cutscene';
  if (mode === 'battle') return ritual ? 'ritual' : dialog ? 'dialog' : 'battle';
  if (mode === 'menu') return 'menu';
  if (mode === 'world') return dialog ? 'dialog' : 'world';
  return null;
}


export const CHAPTERS = [{ id: 'c1', until: 'boss_ashlo' }, { id: 'c2', until: 'boss_leviathrum' }, { id: 'c3', until: 'boss_bramble' }, { id: 'c4', until: null }];
export function chapterOf(flags = {}) {
  for (const c of CHAPTERS) if (!c.until || !flags[c.until]) return c.id;
  return CHAPTERS[CHAPTERS.length - 1].id;
}



export const MAX_DT = 0.25;
export function tick(c, dt, activity, chapter) {
  if (!activity || !(dt > 0)) return c;
  const d = Math.min(MAX_DT, dt);
  c.total += d; c.mode[activity] = (c.mode[activity] || 0) + d;
  if (chapter) c.chapter[chapter] = (c.chapter[chapter] || 0) + d;
  return c;
}


export function fmt(s) {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}
