























import { isNightHour } from './village.mjs';
import { localHour } from './localClock.mjs';

export const EVENT_MOODS = Object.freeze({
  sale: Object.freeze({ mood: 'happy', seconds: 20 }),
  giftLiked: Object.freeze({ mood: 'amazement', seconds: 8 }),
  shutOrUnaffordable: Object.freeze({ mood: 'frustration', seconds: 4 }),
  bumped: Object.freeze({ mood: 'anger', seconds: 3 }),
  chestOpened: Object.freeze({
    mood: 'interest', seconds: 2,
    then: Object.freeze({ mood: 'amazement', seconds: 6 }),
  }),
});


export const EMPTY_LEDGER = Object.freeze({ mood: null, since: -Infinity, expiresAt: -Infinity, then: null });






export function applyEvent(ledger, kind, t) {
  const rule = EVENT_MOODS[kind];
  if (!rule) return ledger;
  return { mood: rule.mood, since: t, expiresAt: t + rule.seconds, then: rule.then || null };
}












export function moodNow(ledger, t, { raining = false, nowMs, tzOffsetMin = 0, personality } = {}) {
  const l = ledger || EMPTY_LEDGER;
  if (l.mood && t < l.expiresAt) return l.mood;
  if (l.mood && l.then && t < l.expiresAt + l.then.seconds) return l.then.mood;
  if (raining) return 'concern';
  if (Number.isFinite(nowMs) && isNightHour(localHour(nowMs, tzOffsetMin))) return 'sleepy';
  return (personality && personality.baseline) || 'neutral';
}
