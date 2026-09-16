









export function createAudio({ muted = false, target = window } = {}) {
  let ctx = null, master = null;
  const state = { unlocked: false, muted: Boolean(muted) };

  function unlock() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      state.unlocked = true;
    } catch {
      ctx = null;
      master = null;
    }
  }
  const onGesture = () => {
    unlock();
    if (ctx) {
      target.removeEventListener('pointerdown', onGesture, true);
      target.removeEventListener('keydown', onGesture, true);
    }
  };
  target.addEventListener('pointerdown', onGesture, true);
  target.addEventListener('keydown', onGesture, true);

  return {
    unlock,
    get ctx() { return ctx; },
    get master() { return master; },
    get unlocked() { return state.unlocked; },
    get muted() { return state.muted; },
    setMuted(m) {
      state.muted = Boolean(m);
      if (master) master.gain.setTargetAtTime(state.muted ? 0 : 1, ctx.currentTime, 0.02);
    },
  };
}
