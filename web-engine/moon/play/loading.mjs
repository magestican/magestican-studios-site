






























import { TIMING_STAGES } from './timing.mjs';



















export const LOADING_PHASES = Object.freeze([
  { stage: 'modules', label: 'Unlatching the gate', costMs: 1039 },
  { stage: 'save', label: 'Finding your moon where you left it', costMs: 384 },
  { stage: 'scene', label: 'Rolling out the hills and the little town', costMs: 2814 },
  { stage: 'player', label: 'Lacing your boots - Felice is up already', costMs: 2547 },
  { stage: 'firstFrame', label: 'Letting the morning in', costMs: 2205 },
].map(Object.freeze));








export const LOADING_FIRST_LABEL = LOADING_PHASES[0].label;


export const LOADING_LAST_STAGE = 'firstFrame';

const TOTAL = LOADING_PHASES.reduce((sum, p) => sum + p.costMs, 0);



for (const p of LOADING_PHASES) {
  if (!TIMING_STAGES.includes(p.stage)) throw new Error(`loading phase '${p.stage}' is not a timing stage`);
}
if (LOADING_PHASES.some((p, i) => i > 0 && TIMING_STAGES.indexOf(p.stage) <= TIMING_STAGES.indexOf(LOADING_PHASES[i - 1].stage))) {
  throw new Error('the loading phases must be in the order the load happens');
}

const done = (marks, stage) => Object.prototype.hasOwnProperty.call(marks || {}, stage);


export function loadingPhase(marks = {}) {
  return LOADING_PHASES.find((p) => !done(marks, p.stage)) || null;
}






export function loadingPercent(marks = {}) {
  let spent = 0;
  for (const p of LOADING_PHASES) if (done(marks, p.stage)) spent += p.costMs;
  return Math.round((spent / TOTAL) * 1000) / 10;
}


export function loadingDone(marks = {}) {
  return done(marks, LOADING_LAST_STAGE);
}















export function createLoadingView() {
  let pct = 0;
  let index = 0;              
  let finished = false;
  return {
    get percent() { return pct; },
    get label() { return LOADING_PHASES[index].label; },
    get finished() { return finished; },
    



    step(marks = {}) {
      const next = Math.max(pct, loadingPercent(marks));
      const phase = loadingPhase(marks);
      const at = phase ? LOADING_PHASES.indexOf(phase) : LOADING_PHASES.length - 1;
      const over = loadingDone(marks);
      const changed = next !== pct || at !== index || (over && !finished);
      pct = next;
      index = Math.max(index, at);
      const first = over && !finished;
      if (over) finished = true;
      return {
        percent: pct,
        label: LOADING_PHASES[index].label,
        stage: LOADING_PHASES[index].stage,
        changed,
        done: first,
      };
    },
  };
}







export const DRAW_AFTER_STAGE = 'player';


export function canStartDrawing(marks = {}) {
  return done(marks, DRAW_AFTER_STAGE);
}


























export function createDrawGate() {
  let state = 'waiting';
  return {
    get state() { return state; },
    get drawing() { return state === 'drawing'; },
    get playing() { return state === 'playing'; },
    
    begin(marks = {}) {
      if (state !== 'waiting' || !canStartDrawing(marks)) return false;
      state = 'drawing';
      return true;
    },
    
    handOver() {
      if (state !== 'drawing') return false;
      state = 'playing';
      return true;
    },
  };
}
