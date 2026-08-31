


















































export const GIVE_UP_AFTER_MS = 4000;

export function createContextState(opts = {}) {
  return {
    giveUpAfterMs: opts.giveUpAfterMs ?? GIVE_UP_AFTER_MS,
    
    lost: false,
    
    lostAt: null,
    
    losses: 0,
    restores: 0,
    
    gaveUp: false,
  };
}


export function shouldDraw(state) {
  return !state.lost;
}









export function contextLost(state, now) {
  
  
  
  
  if (!state.lost) {
    state.lost = true;
    state.lostAt = now;
    state.losses += 1;
    state.gaveUp = false;
  }
  const giveUp = state.losses > 1;
  if (giveUp) state.gaveUp = true;
  return {
    draw: false,
    losses: state.losses,
    giveUp,
    message: giveUp ? GONE_MESSAGE : LOST_MESSAGE,
  };
}











export function contextRestored(state, now) {
  const downMs = state.lostAt === null ? 0 : Math.max(0, now - state.lostAt);
  const wasLost = state.lost;
  state.lost = false;
  state.lostAt = null;
  state.gaveUp = false;
  if (wasLost) state.restores += 1;
  return {
    draw: true,
    rebuild: wasLost,
    restores: state.restores,
    downMs,
    
    
    clear: wasLost,
  };
}







export function contextCheck(state, now) {
  if (!state.lost) return { giveUp: false, downMs: 0, message: null };
  const downMs = state.lostAt === null ? 0 : Math.max(0, now - state.lostAt);
  if (state.gaveUp || downMs < state.giveUpAfterMs) {
    return { giveUp: false, downMs, message: null };
  }
  state.gaveUp = true;
  return { giveUp: true, downMs, message: GONE_MESSAGE };
}










export const LOST_MESSAGE = 'Graphics dropped out. Trying to get them back...';
export const GONE_MESSAGE = 'Graphics could not recover. Reload to keep racing.';
