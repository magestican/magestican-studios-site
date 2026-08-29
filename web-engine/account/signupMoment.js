



















































































import { PROOF, tally } from './achievements.js';
import { daysBetween } from './dayKey.js';


export const PROMPT_KEY = 'arbelo.account.prompt.v1';








export const MAX_ASKS = 3;








export const COOLDOWN_DAYS = Object.freeze([0, 3, 14]);


export const REASONS = Object.freeze(['rank', 'tour', 'badge', 'streak', 'standing']);

export function emptyPromptState() {
  return {
    version: 1,
    asks: 0,            
    lastAskDay: null,   
    never: false,       
    lastReason: null,   
  };
}

export function normalisePromptState(raw) {
  const base = emptyPromptState();
  if (!raw || typeof raw !== 'object') return base;
  const asks = Math.floor(Number(raw.asks));
  return {
    version: 1,
    asks: Number.isFinite(asks) && asks > 0 ? Math.min(asks, MAX_ASKS) : 0,
    lastAskDay: Number.isInteger(raw.lastAskDay) && raw.lastAskDay >= 0 ? raw.lastAskDay : null,
    never: raw.never === true,
    lastReason: REASONS.includes(raw.lastReason) ? raw.lastReason : null,
  };
}








export function momentFrom(events, justUnlocked, summary) {
  const list = Array.isArray(events) ? events : [];
  if (list.some((e) => e?.type === 'rank')) return 'rank';
  if (list.some((e) => e?.type === 'tour')) return 'tour';
  const big = (Array.isArray(justUnlocked) ? justUnlocked : [])
    .find((a) => a?.tier === 'rare' || a?.tier === 'legendary');
  if (big) return 'badge';
  const streak = list.find((e) => e?.type === 'streak');
  if (streak && (streak.event === 'extended' || streak.event === 'rested')
      && (summary?.streak?.current ?? 0) >= 2) return 'streak';
  if ((summary?.streak?.current ?? 0) >= 3) return 'standing';
  return null;
}








export function shouldOffer({
  summary, events = [], justUnlocked = [], state = null,
  today = null, at = 'results', syncEnabled = false,
} = {}) {
  const s = normalisePromptState(state);
  const no = (blocked) => ({ offer: false, reason: null, blocked });

  
  
  
  if (!syncEnabled) return no('sync-off');
  if (summary?.linked) return no('already-linked');
  if (s.never) return no('asked-not-to');
  if (s.asks >= MAX_ASKS) return no('asked-enough');

  
  
  
  if (at !== 'results') return no('wrong-place');

  
  
  
  const daysPlayed = summary?.streak?.daysPlayed ?? 0;
  const rankIndex = summary?.rank?.index ?? 0;
  if (daysPlayed < 2 && rankIndex < 1) return no('too-early');

  
  if (s.lastAskDay !== null && s.lastAskDay === today) return no('already-today');
  const gap = daysBetween(s.lastAskDay, today);
  const need = COOLDOWN_DAYS[Math.min(s.asks, COOLDOWN_DAYS.length - 1)];
  if (s.lastAskDay !== null && (gap === null || gap < need)) return no('cooling-off');

  const reason = momentFrom(events, justUnlocked, summary);
  if (!reason) return no('no-moment');
  return { offer: true, reason, blocked: null };
}


export function noteAsk(state, { today = null, reason = null } = {}) {
  const s = normalisePromptState(state);
  return {
    ...s,
    asks: Math.min(MAX_ASKS, s.asks + 1),
    lastAskDay: Number.isInteger(today) && today >= 0 ? today : s.lastAskDay,
    lastReason: REASONS.includes(reason) ? reason : s.lastReason,
  };
}


export function noteNever(state) {
  return { ...normalisePromptState(state), never: true, asks: MAX_ASKS };
}












function headlineFor(reason, summary, justUnlocked) {
  const streak = summary?.streak?.current ?? 0;
  const rank = summary?.rank?.name ?? '';
  const badge = (Array.isArray(justUnlocked) ? justUnlocked : [])
    .find((a) => a?.tier === 'rare' || a?.tier === 'legendary');
  if (reason === 'rank') return `You made ${rank}. Keep it.`;
  if (reason === 'tour') return 'A Barn Tour. Keep it.';
  if (reason === 'badge') return `You earned ${badge?.name ?? 'a badge'}. Keep it.`;
  if (reason === 'streak' || reason === 'standing') {
    return `${streak} days in a row. Keep it.`;
  }
  return 'Keep your progress.';
}








export function promptModel({
  reason = 'standing', summary = null, justUnlocked = [], achievementRows = [],
} = {}) {
  const t = tally(achievementRows);
  const streak = summary?.streak?.current ?? 0;
  const rank = summary?.rank?.name ?? null;

  
  
  const atRisk = [
    streak >= 2 ? `your ${streak}-day streak` : null,
    rank ? `your ${rank} rank` : null,
    t.unlocked > 0 ? `${t.unlocked} ${t.unlocked === 1 ? 'badge' : 'badges'}` : null,
  ].filter(Boolean);

  return {
    reason,
    headline: headlineFor(reason, summary, justUnlocked),
    
    
    body: atRisk.length
      ? `Right now ${listOf(atRisk)} live only in this browser. Clearing your history erases them.`
      : 'Right now your progress lives only in this browser. Clearing your history erases it.',
    
    offers: [
      {
        icon: '☁',
        title: 'Your progress, on your phone too',
        text: 'Your streak, your rank, your records and your badges follow you to any device you sign in on.',
      },
      {
        icon: '✓',
        title: 'Verified achievements',
        text: t.unlocked > 0
          ? `Your ${t.unlocked} ${t.unlocked === 1 ? 'badge' : 'badges'} move from "on this device" to your account, where our server checks them. Some of them can then be marked Verified.`
          : 'Badges you earn are kept in your account, where our server checks them - and the time-based ones can be marked Verified.',
      },
      {
        icon: '⌫',
        title: 'Nothing to give us',
        text: 'One tap with Google. We never store your email, your name, or anything else about you - there is no field for it. Erase everything whenever you like.',
      },
    ],
    cta: 'Keep my progress',
    dismiss: 'Not now',
    never: 'Don\'t ask again',
    
    footnote: 'You keep playing either way. Nothing here is locked behind an account.',
  };
}

function listOf(parts) {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}









export function standingOffer(summary, { syncEnabled = false } = {}) {
  if (!syncEnabled) {
    return {
      show: false,
      reason: 'sync-off',
      text: 'Cross-device saving is not switched on yet.',
    };
  }
  if (summary?.linked) {
    return { show: false, reason: 'linked', text: 'Your progress is saved to your account.' };
  }
  return {
    show: true,
    reason: 'available',
    text: 'Your progress is on this device only.',
    cta: 'Keep my progress on my other devices',
  };
}








export function proofLine(rows) {
  const t = tally(rows);
  if (t.unlocked === 0) return 'No badges yet.';
  if (t.device === t.unlocked) {
    return `${t.unlocked} of ${t.total} badges, all on this device only.`;
  }
  const bits = [`${t.unlocked} of ${t.total} badges`];
  if (t.verified) bits.push(`${t.verified} verified`);
  if (t.recorded) bits.push(`${t.recorded} recorded in your account`);
  if (t.device) bits.push(`${t.device} on this device only`);
  return `${bits.join(' · ')}.`;
}

export { PROOF };
