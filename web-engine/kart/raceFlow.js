












export const PHASE = Object.freeze({
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished',    
  RESULTS: 'results',
});




export const COUNTDOWN_TIME = 3.2;




export const POST_FINISH_GRACE = 6;

export function createFlow({ laps = 3, countdown = COUNTDOWN_TIME } = {}) {
  return {
    phase: PHASE.COUNTDOWN,
    time: 0,             
    countdown,
    laps,
    startedAt: null,
    playerFinishedAt: null,
    resultsAt: null,
    
    
    
    
    lastBeat: null,
  };
}





export function stepFlow(flow, dt, { playerFinished = false, allFinished = false } = {}) {
  const events = [];
  flow.time += dt;

  if (flow.phase === PHASE.COUNTDOWN) {
    const remaining = flow.countdown - flow.time;
    const beat = Math.ceil(remaining);
    if (beat !== flow.lastBeat && beat >= 1 && beat <= 3) {
      flow.lastBeat = beat;
      events.push({ type: 'countdown', beat });
    }
    if (remaining <= 0) {
      flow.phase = PHASE.RACING;
      flow.startedAt = flow.time;
      
      
      flow.time = 0;
      flow.lastBeat = null;
      events.push({ type: 'go' });
    }
    return { flow, events };
  }

  if (flow.phase === PHASE.RACING) {
    if (playerFinished) {
      flow.phase = PHASE.FINISHED;
      flow.playerFinishedAt = flow.time;
      events.push({ type: 'playerFinished', time: flow.time });
    }
    return { flow, events };
  }

  if (flow.phase === PHASE.FINISHED) {
    const waited = flow.time - flow.playerFinishedAt;
    if (allFinished || waited >= POST_FINISH_GRACE) {
      flow.phase = PHASE.RESULTS;
      flow.resultsAt = flow.time;
      events.push({ type: 'results' });
    }
    return { flow, events };
  }

  return { flow, events };
}


export const canDrive = (flow) => flow.phase === PHASE.RACING || flow.phase === PHASE.FINISHED;


export function countdownText(flow) {
  if (flow.phase !== PHASE.COUNTDOWN) {
    
    
    if (flow.phase === PHASE.RACING && flow.time < 0.9) return 'GO!';
    return null;
  }
  const remaining = flow.countdown - flow.time;
  const beat = Math.ceil(remaining);
  return beat >= 1 && beat <= 3 ? String(beat) : null;
}









export const LAUNCH_WINDOW = Object.freeze({ open: 0.35, close: 1.25 });










export function judgeLaunch(throttleHeldFor) {
  if (!(throttleHeldFor > 0)) return null;
  
  if (throttleHeldFor > LAUNCH_WINDOW.close) return { kind: 'bog', time: 1.1 };
  
  if (throttleHeldFor >= LAUNCH_WINDOW.open) {
    return { kind: 'launch', boost: { time: 1.4, power: 1.30, name: 'launch' } };
  }
  return null;
}












export function launchMeter(flow, throttleHeldFor) {
  if (flow.phase !== PHASE.COUNTDOWN) return null;
  const held = Math.max(0, throttleHeldFor);
  const charge = Math.min(1.35, held / LAUNCH_WINDOW.close);
  const zone = held > LAUNCH_WINDOW.close ? 'over'
    : held >= LAUNCH_WINDOW.open ? 'good'
      : 'low';
  return { charge, zone, held };
}
