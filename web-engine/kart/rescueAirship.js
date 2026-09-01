












































export const TRIGGER_GAP = 0.30;








export const RELEASE_GAP = 0.10;


export const CARRY_SPEED = 2.0;


export const MAX_CARRY = 12;


export const COOLDOWN = 20;


export const GRAB_TIME = 0.9;
export const DROP_TIME = 0.7;


export const CARRY_HEIGHT = 9;

export const PHASE = Object.freeze({
  IDLE: 'idle',
  GRAB: 'grab',
  CARRY: 'carry',
  DROP: 'drop',
});

export function createAirship() {
  return {
    phase: PHASE.IDLE,
    
    t: 0,
    
    carried: 0,
    
    since: COOLDOWN,
    
    rescues: 0,
  };
}










export function eligible(me, ahead, field, state, opts = {}) {
  if (!me || !state) return false;
  if (state.phase !== PHASE.IDLE) return false;
  if (state.since < (opts.cooldown ?? COOLDOWN)) return false;
  
  if (!(field > 1) || me.place !== field) return false;
  if (!ahead) return false;
  return gapTo(me, ahead) > (opts.triggerGap ?? TRIGGER_GAP);
}









export function gapTo(me, ahead) {
  const mine = (me.laps ?? 0) + (me.lapFrac ?? 0);
  const theirs = (ahead.laps ?? 0) + (ahead.lapFrac ?? 0);
  return Math.max(0, theirs - mine);
}











export function stepAirship(state, dt, { me, ahead, field } = {}, opts = {}) {
  const grabTime = opts.grabTime ?? GRAB_TIME;
  const dropTime = opts.dropTime ?? DROP_TIME;
  const maxCarry = opts.maxCarry ?? MAX_CARRY;
  const releaseGap = opts.releaseGap ?? RELEASE_GAP;

  let started = false;
  let released = false;
  state.t += dt;

  if (state.phase === PHASE.IDLE) {
    state.since += dt;
    if (eligible(me, ahead, field, state, opts)) {
      state.phase = PHASE.GRAB;
      state.t = 0;
      state.carried = 0;
      state.rescues += 1;
      started = true;
    }
  } else if (state.phase === PHASE.GRAB) {
    if (state.t >= grabTime) { state.phase = PHASE.CARRY; state.t = 0; }
  } else if (state.phase === PHASE.CARRY) {
    state.carried += dt;
    
    
    
    
    const closed = ahead ? gapTo(me, ahead) <= releaseGap : true;
    if (closed || state.carried >= maxCarry) { state.phase = PHASE.DROP; state.t = 0; }
  } else if (state.phase === PHASE.DROP) {
    if (state.t >= dropTime) {
      state.phase = PHASE.IDLE;
      state.t = 0;
      state.since = 0;
      released = true;
    }
  }

  const lift = liftFor(state, grabTime, dropTime);
  const carrying = state.phase !== PHASE.IDLE;
  return {
    phase: state.phase,
    carrying,
    
    
    
    speedScale: carrying ? 1 + ((opts.carrySpeed ?? CARRY_SPEED) - 1) * lift : 1,
    lift,
    started,
    released,
    
    
    steerable: !carrying,
    
    
    
    invulnerable: carrying,
  };
}


export function liftFor(state, grabTime = GRAB_TIME, dropTime = DROP_TIME) {
  const smooth = (t) => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  };
  if (state.phase === PHASE.GRAB) return smooth(state.t / grabTime);
  if (state.phase === PHASE.CARRY) return 1;
  if (state.phase === PHASE.DROP) return 1 - smooth(state.t / dropTime);
  return 0;
}


export function carryHeight(lift, height = CARRY_HEIGHT) {
  return lift * height;
}
