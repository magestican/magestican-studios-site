


















import { signedDelta, wrapS } from './trackPath.js';








export function createProgress(path, { laps = 3, checkpoints = 8, startS = 0 } = {}) {
  return {
    path,
    laps,
    checkpoints,
    startS: wrapS(path, startS),
    
    racers: new Map(),
  };
}

export function addRacer(progress, id, s) {
  progress.racers.set(id, {
    id,
    lap: 0,
    
    
    distance: 0,
    lastS: wrapS(progress.path, s),
    
    visited: new Set(),
    finished: false,
    finishTime: null,
    lapTimes: [],
    bestLap: null,
    wrongWay: 0,
    
    
    wrongWayShown: false,
  });
  return progress;
}










export function updateRacer(progress, id, s, time, dt) {
  const r = progress.racers.get(id);
  if (!r || r.finished) return r;
  const path = progress.path;
  const now = wrapS(path, s);
  const step = signedDelta(path, r.lastS, now);
  r.lastS = now;

  
  
  if (Math.abs(step) < path.length * 0.5) r.distance += step;

  
  
  if (step < -0.02) r.wrongWay += dt;
  else r.wrongWay = Math.max(0, r.wrongWay - dt * 2);
  r.wrongWayShown = r.wrongWay > 0.6;

  
  
  
  
  
  
  const spacing = path.length / progress.checkpoints;
  const gate = Math.floor(now / spacing) % progress.checkpoints;
  if (step > 0) r.visited.add(gate);

  
  
  const wantLap = Math.floor(r.distance / path.length) + 1;
  if (wantLap > r.lap && r.visited.size >= progress.checkpoints) {
    const start = r.lapTimes.reduce((a, b) => a + b, 0);
    const lapTime = time - start;
    r.lapTimes.push(lapTime);
    if (r.bestLap === null || lapTime < r.bestLap) r.bestLap = lapTime;
    r.lap = wantLap;
    r.visited.clear();
    if (r.lap >= progress.laps) {
      r.finished = true;
      r.finishTime = time;
    }
  }
  return r;
}





export function standings(progress) {
  const all = [...progress.racers.values()];
  all.sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    return b.distance - a.distance;
  });
  all.forEach((r, i) => { r.position = i + 1; });
  return all;
}


export function fractionDone(progress, id) {
  const r = progress.racers.get(id);
  if (!r) return 0;
  return Math.max(0, Math.min(1, r.distance / (progress.path.length * progress.laps)));
}


export function formatTime(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '--:--.--';
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const whole = Math.floor(rest);
  const hundredths = Math.floor((rest - whole) * 100);
  return `${m}:${String(whole).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}


export function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}
