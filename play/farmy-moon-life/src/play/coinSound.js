

















import { createAudio } from './audio.js';

const MIN_GAP_S = 0.07;

const BIG = 3;

export function createCoinSound({ audio = null, sfx = null, muted = false, target = window } = {}) {
  const shared = audio || createAudio({ muted, target });
  let last = -1;
  const counts = { plays: 0, skipped: 0 };

  function play(size = 1) {
    const ctx = shared.ctx;
    if (shared.muted || !ctx || !sfx) { counts.skipped += 1; return false; }
    const now = ctx.currentTime;
    if (now - last < MIN_GAP_S) return false;
    const full = Math.max(1, Math.min(5, size));
    if (!sfx.play(full >= BIG ? 'money.coinBig' : 'money.coin')) { counts.skipped += 1; return false; }
    last = now;
    counts.plays += 1;
    return true;
  }

  return {
    play,
    unlock: () => shared.unlock(),
    setMuted(m) { shared.setMuted(m); },
    get state() { return { unlocked: shared.unlocked, muted: shared.muted, ...counts }; },
  };
}
