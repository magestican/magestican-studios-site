











































export const TIMING_STAGES = Object.freeze([
  'modules',    
  'save',       
  'scene',      
  'player',     
  'firstFrame', 
  'villagers',  
  'buildings',  
  'ready',      
]);

const STAGE_SET = new Set(TIMING_STAGES);

















export function createTiming({ now, into = {}, onMark = null } = {}) {
  const clock = typeof now === 'function' ? now : () => 0;
  const marks = into;
  const tell = typeof onMark === 'function' ? onMark : null;
  let high = 0;
  return {
    marks,
    
    mark(name) {
      if (!STAGE_SET.has(name)) return marks;
      if (Object.prototype.hasOwnProperty.call(marks, name)) return marks;
      let at = Number(clock());
      if (!Number.isFinite(at) || at < 0) at = high;
      high = Math.max(high, at);
      marks[name] = Math.round(high * 10) / 10;
      
      
      if (tell) { try { tell(name, marks); } catch {  } }
      return marks;
    },
    
    has(name) {
      return Object.prototype.hasOwnProperty.call(marks, name);
    },
  };
}






export function timingStages(marks = {}) {
  const out = [];
  let prev = 0;
  for (const name of TIMING_STAGES) {
    if (!Object.prototype.hasOwnProperty.call(marks, name)) continue;
    const at = Number(marks[name]);
    if (!Number.isFinite(at)) continue;
    out.push({ name, atMs: at, costMs: Math.round((at - prev) * 10) / 10 });
    prev = at;
  }
  return out;
}


export function timingTotalMs(marks = {}) {
  const stages = timingStages(marks);
  return stages.length ? stages[stages.length - 1].atMs : 0;
}







export function timingLine(marks = {}) {
  const stages = timingStages(marks);
  if (!stages.length) return '';
  const s = (ms) => (ms / 1000).toFixed(1);
  const parts = stages.map((st) => `${st.name} ${s(st.costMs)}`);
  return `load ${s(timingTotalMs(marks))}s = ${parts.join(' + ')}`;
}
