













import { METRICS, GRIP } from './rcTuning.js';

export const PHASE = Object.freeze({ IDLE: 'idle', WARN: 'warn', ON: 'on' });
const WARN = 2; 
const DAMP = 0.8; 
const SPRAY = 1.2; 

const wrap = (s, L) => ((s % L) + L) % L;


export function createWorldEvents(defs, { length } = {}) {
  return {
    list: defs.map((d) => {
      const warn = d.warn ?? WARN;
      if (warn < METRICS.telegraph) {
        throw new Error(`worldEvents: "${d.id}" warns ${warn} s, under the ${METRICS.telegraph} s telegraph rule`);
      }
      if (d.s1 < d.s0 && !length) throw new Error(`worldEvents: "${d.id}" wraps the lap; pass { length }`);
      const span = d.s1 >= d.s0 ? d.s1 - d.s0 : d.s1 + length - d.s0;
      return { ...d, warn, span, lap: d.lap ?? 3, phase: PHASE.IDLE, t: 0, arc: d.s0 };
    }),
  };
}


export function stepWorldEvents(st, { leaderLap }, dt) {
  const events = [];
  for (const e of st.list) {
    if (e.phase === PHASE.IDLE) {
      if (leaderLap < e.lap) continue;
      e.phase = PHASE.WARN;
      e.t = 0;
      events.push({ type: 'worldWarn', event: e.id, source: e.source });
      continue;
    }
    e.t += dt;
    if (e.phase === PHASE.WARN && e.t >= e.warn) {
      e.phase = PHASE.ON;
      e.t = 0;
      events.push({ type: 'worldOn', event: e.id, source: e.source });
    }
    if (e.phase === PHASE.ON && e.sweep) {
      
      
      const k = 0.5 - 0.5 * Math.cos((2 * Math.PI * e.t) / e.sweep);
      e.arc = e.s0 + e.span * k;
    }
  }
  return { events };
}


function inStretch(e, s, side, L) {
  if (Math.abs(side - (e.side ?? 0)) > e.half) return false;
  const len = wrap(e.s1 - e.s0, L);
  return wrap(s - e.s0, L) <= len;
}


export function worldGripAt(st, s, side, L) {
  let g = 1;
  for (const e of st.list) {
    if (e.phase !== PHASE.ON || !inStretch(e, s, side, L)) continue;
    if (!e.sweep) { g = Math.min(g, GRIP.wet); continue; }
    const d = Math.abs(wrap(s - e.arc + L / 2, L) - L / 2);
    g = Math.min(g, d <= SPRAY ? GRIP.wet : DAMP);
  }
  return g;
}
