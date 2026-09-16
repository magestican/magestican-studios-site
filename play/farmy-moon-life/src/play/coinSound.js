














import { createAudio } from './audio.js';

const MIN_GAP_S = 0.07;

export function createCoinSound({ audio = null, muted = false, target = window } = {}) {
  const shared = audio || createAudio({ muted, target });
  let out = null, last = -1;
  const counts = { plays: 0, skipped: 0 };

  function bus() {
    if (!out) {
      out = shared.ctx.createGain();
      out.gain.value = 0.22;
      out.connect(shared.master);
    }
    return out;
  }

  function ping(ctx, at, freq, dur, gain) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, at);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(env);
    env.connect(bus());
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function play(size = 1) {
    const ctx = shared.ctx;
    if (shared.muted || !ctx) { counts.skipped += 1; return false; }
    const now = ctx.currentTime;
    if (now - last < MIN_GAP_S) return false;
    last = now;
    const full = Math.max(1, Math.min(5, size));
    ping(ctx, now, 1318.5, 0.12, 0.5);
    ping(ctx, now + 0.06, 1975.5, 0.32 + 0.04 * full, 0.42);
    if (full >= 3) ping(ctx, now + 0.11, 2637, 0.28, 0.18);
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
