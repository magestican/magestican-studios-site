


























export const SAVE_POLICY = Object.freeze({
  quietMs: 1500,     
  maxWaitMs: 15000,  
  minGapMs: 800,     
});




export function createSaver({ write, policy = SAVE_POLICY } = {}) {
  if (typeof write !== 'function') throw new Error('createSaver needs a write function');
  const cfg = { ...SAVE_POLICY, ...policy };
  const state = {
    dirty: false,
    dirtiedAt: 0,      
    changedAt: 0,      
    writing: false,
    writes: 0,
    failures: 0,
    lastWriteAt: -Infinity,
    lastReason: null,  
    lastError: null,
  };

  
  function touch(t, reason = null) {
    if (!state.dirty) {
      state.dirty = true;
      state.dirtiedAt = t;
    }
    state.changedAt = t;
    if (reason) state.lastReason = reason;
  }

  
  function due(t) {
    if (!state.dirty || state.writing) return false;
    if (t - state.lastWriteAt < cfg.minGapMs) return false;
    return t - state.changedAt >= cfg.quietMs || t - state.dirtiedAt >= cfg.maxWaitMs;
  }

  let inFlight = null;   

  function start(t) {
    state.writing = true;
    state.dirty = false;
    const at = t;
    let done;
    try {
      done = Promise.resolve(write(at));
    } catch (e) {
      done = Promise.reject(e);
    }
    inFlight = done.then(
      () => {
        state.writing = false;
        state.writes += 1;
        state.lastWriteAt = at;
      },
      (e) => {
        state.writing = false;
        state.failures += 1;
        state.lastError = String(e && e.message ? e.message : e);
        state.lastWriteAt = at;
        
        if (!state.dirty) { state.dirty = true; state.dirtiedAt = at; state.changedAt = at; }
      },
    );
    return inFlight;
  }

  
  function tick(t) {
    return due(t) ? start(t) : null;
  }

  




  function flush(t) {
    
    
    
    
    if (state.writing) return inFlight.then(() => (state.dirty ? start(t) : undefined));
    if (!state.dirty) return Promise.resolve();
    return start(t);
  }

  return { touch, due, tick, flush, state, policy: cfg };
}








export function awayReport(summary, awayMs, { minAwayMs = 60000 } = {}) {
  if (!summary) return null;
  const coins = summary.coins || 0;
  const sales = summary.sales || 0;
  const ripe = summary.ripe || 0;
  const built = summary.built || 0;
  const batches = summary.batches || 0;
  if (awayMs < minAwayMs && coins === 0 && ripe === 0 && built === 0 && batches === 0) return null;
  const bits = [];
  if (sales > 0) bits.push(`${sales} sold for ${coins} coins`);
  if (batches > 0) bits.push(`${batches} ready to collect`);
  if (ripe > 0) bits.push(`${ripe} ripened`);
  if (built > 0) bits.push(built === 1 ? 'a villager finished building' : `${built} villagers finished building`);
  const how = awayFor(awayMs);
  const text = bits.length ? `While you were away (${how}): ${bits.join(', ')}.` : `Welcome back - ${how} away.`;
  return { text, awayMs, coins, sales, ripe, built, batches };
}


export function awayFor(ms) {
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 90) return plural(s, 'second');
  const m = Math.round(s / 60);
  if (m < 60) return plural(m, 'minute');
  const h = Math.round(m / 60);
  if (h < 24) return plural(h, 'hour');
  return plural(Math.round(h / 24), 'day');
}
