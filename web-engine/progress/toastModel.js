

























import { BY_ID, TIER_LABEL } from '../account/achievements.js';
import { trophyName } from './snapshot.js';
import { PROFILE_GAME_NAMES } from './gameIds.js';

export const MAX_BADGE_TOASTS = 4;

const isObj = (e) => e !== null && typeof e === 'object';
const posInt = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : 0);
const xpSub = (xp) => (posInt(xp) > 0 ? `+${posInt(xp)} XP` : null);








export function shareTextFor(item) {
  if (!isObj(item)) return null;
  const t = String(item.title ?? '');
  if (item.kind === 'level' && /^Level \d+$/.test(t)) return `I just reached ${t} on Magestican Studios - free games, no download:`;
  if (item.kind === 'trophy' && t.startsWith('Trophy: ')) return `I just won the ${t.slice(8)} trophy on Magestican Studios - free games, no download:`;
  if (item.kind === 'badge' && t.startsWith('Badge: ')) return `I just earned the ${t.slice(7)} badge on Magestican Studios - free games, no download:`;
  return null;
}





export function queueFrom(events) {
  if (!Array.isArray(events)) return [];
  const list = events.filter(isObj);

  const out = [];

  const levels = list.filter((e) => e.type === 'level' && posInt(e.level) > 0);
  if (levels.length) {
    const top = levels.reduce((a, b) => (posInt(b.level) > posInt(a.level) ? b : a));
    out.push({ kind: 'level', title: `Level ${posInt(top.level)}`, sub: top.title ? String(top.title) : null, art: 'level', sound: 'levelUp' });
  }

  for (const e of list.filter((x) => x.type === 'trophy')) {
    out.push({ kind: 'trophy', title: `Trophy: ${trophyName(e.id)}`, sub: xpSub(e.xp), art: 'trophy', sound: 'trophy' });
  }

  const badges = list.filter((x) => x.type === 'badge');
  for (const e of badges.slice(0, MAX_BADGE_TOASTS)) {
    const row = Object.hasOwn(BY_ID, String(e.id)) ? BY_ID[e.id] : null;
    const tier = row?.tier ?? e.tier ?? 'common';
    const sub = [TIER_LABEL[tier] ?? null, xpSub(e.xp)].filter(Boolean).join(' · ') || null;
    out.push({ kind: 'badge', title: `Badge: ${row?.name ?? String(e.id)}`, sub, art: 'badge', tier, sound: 'badge' });
  }
  if (badges.length > MAX_BADGE_TOASTS) {
    out.push({ kind: 'badge', title: `and ${badges.length - MAX_BADGE_TOASTS} more badges`, sub: 'See them all on your page', art: 'badge', tier: 'common', sound: null });
  }

  for (const e of list.filter((x) => x.type === 'rating' && Number.isFinite(Number(x.r)))) {
    const d = Math.round(Number(e.delta) || 0);
    const name = Object.hasOwn(PROFILE_GAME_NAMES, String(e.game)) ? PROFILE_GAME_NAMES[e.game] : String(e.game ?? 'Game');
    out.push({ kind: 'rating', title: `${name} rating ${Math.round(Number(e.r))}`, sub: d > 0 ? `+${d}` : String(d), art: 'rating', sound: 'tick' });
  }

  const xp = list.filter((x) => x.type === 'xp').reduce((sum, x) => sum + posInt(x.gained), 0);
  if (xp > 0) out.push({ kind: 'xp', title: `+${xp} XP`, sub: null, art: 'xp', sound: 'xp' });

  return out;
}
