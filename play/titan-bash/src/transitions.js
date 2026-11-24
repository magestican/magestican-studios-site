







export const COUNTDOWN_MS = { step: 800, go: 600 };


export function enterClass(id, reduced) {
  if (reduced) return '';
  if (id === 'match') return 'tb-enter-match';
  if (id === 'end' || id === 'night') return 'tb-enter-results';
  return 'tb-enter';
}


export const ENTER_CLASSES = ['tb-enter', 'tb-enter-match', 'tb-enter-results'];





export function countdownAt(ms, reduced) {
  const { step, go } = COUNTDOWN_MS;
  if (ms >= step * 3 + go) return null;
  const i = Math.floor(ms / step);
  const counting = i < 3;
  const local = counting ? (ms % step) / step : (ms - step * 3) / go;
  const label = counting ? String(3 - i) : 'BASH!';
  const scale = reduced ? 1 : 1 + 0.6 * (1 - Math.min(1, local * 4));
  const alpha = local > 0.7 ? Math.max(0, (1 - local) / 0.3) : 1;
  return { label, frozen: counting, scale, alpha };
}
