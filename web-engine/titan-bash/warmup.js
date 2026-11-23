







import { createMatch, step, EVENT } from './sim.js';
import { secs } from './tuning.js';


export const DUMMY_SPOTS = Object.freeze([{ x: -8, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 10 }]);
export const DUMMY_ARMOUR = 16; 
export const LESSON_GAP_S = 2.5;
export const STAGES = Object.freeze(['fire', 'boost', 'ability', 'done']);
export const PROMPT = Object.freeze({ fire: 'FIRE at a target!', boost: 'BOOST to dash!', ability: 'Try your ABILITY!', done: '' });


export function createWarmup({ players = [], seed = 1 } = {}) {
  const match = createMatch({
    seed, arena: 'bellRing', sleeper: false, endless: true,
    players: players.slice(0, 8).map((p) => ({ ...p, team: 0, cpu: null })),
    dummies: DUMMY_SPOTS.map((d) => ({ ...d, armour: DUMMY_ARMOUR })),
  });
  return { match, lessons: match.titans.filter((t) => !t.dummy).map(() => ({ stage: 'fire', at: -Infinity })) };
}

const NEXT = { fire: 'boost', boost: 'ability', ability: 'done' };
const learnt = (stage, e) => (stage === 'fire' && e.type === EVENT.BELL && e.by !== null)
  || (stage === 'boost' && e.type === EVENT.DASH) || (stage === 'ability' && e.type === EVENT.ABILITY);
const actor = (e) => (e.type === EVENT.BELL ? e.by : e.id);


export function warmupStep(w, inputs = []) {
  const ins = w.match.titans.map((t) => (t.dummy ? null : inputs[t.id]) || {});
  const events = step(w.match, ins);
  for (const e of events) {
    const id = actor(e); const l = w.lessons[id];
    
    if (!l || !shownNow(w, l) || !learnt(l.stage, e)) continue;
    l.stage = NEXT[l.stage]; l.at = w.match.tick;
  }
  return events;
}

const shownNow = (w, l) => w.match.tick - l.at >= secs(LESSON_GAP_S);





export function lessonFor(w, id) {
  const l = w.lessons[id];
  if (!l) return null;
  const gap = !shownNow(w, l);
  const stage = gap ? STAGES[STAGES.indexOf(l.stage) - 1] || l.stage : l.stage;
  const n = STAGES.indexOf(stage);
  return {
    stage: l.stage, shown: stage, prompt: gap ? '' : PROMPT[stage],
    praise: gap ? ({ boost: 'BELL!', ability: 'DASH!', done: 'You are ready!' }[l.stage] || '') : '',
    lit: { fire: true, boost: n >= 1, ability: n >= 2 },
  };
}
