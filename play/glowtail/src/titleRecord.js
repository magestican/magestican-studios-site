





import { t, tv } from '../../../web-engine/i18n/tr.js';







export function titleRecord(best, todayKey, depthNames) {
  const parts = [];
  const dive = Math.max(best.dive || 0, best['dive:hard'] || 0);
  if (dive > 0) parts.push(t('Best dive {n}', { n: dive.toLocaleString('en-US') }));
  const deepest = Math.min(depthNames.length, Math.max(0, best.deepest | 0));
  if (deepest > 0) parts.push(t('Deepest: {name}', { name: tv(depthNames[deepest - 1]) }));
  const today = Math.max(best[`daily:${todayKey}`] || 0, best[`daily:${todayKey}:hard`] || 0);
  if (today > 0) parts.push(t('Today\'s dive done: {n}', { n: today.toLocaleString('en-US') }));
  return parts.join('  |  ');
}


export function deeperOf(prev, depthIndex) {
  return Math.max(prev | 0, (depthIndex | 0) + 1);
}
