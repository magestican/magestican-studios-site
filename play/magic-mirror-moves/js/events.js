






export const FIRST_EVENT_S = 40;
const GAP_S = 55;
const GAP_JITTER_S = 10;
export const EVENT_S = 15;
export const EVENT_HITS = 3;
const EVENT_POINTS = 500;

export const EVENTS = [
  { id: 'meteor_shower', name: 'Meteor shower!', moves: ['star', 'jump'] },
  { id: 'storm_cloud', name: 'Storm cloud! Zap it!', moves: ['wand', 'arms_up'] },
  { id: 'bubble_flood', name: 'Bubble flood! Pop them!', moves: ['squat', 'jump'] },
  { id: 'night_falls', name: 'Night falls! Bring the light!', moves: ['flap', 'twirl'] },
];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}







export function createEvents(seed = 1) {
  return { wait: FIRST_EVENT_S, active: null, last: '', rand: rng(seed) };
}







export function stepEvents(st, dt, { seen, visible, hits = [] }) {
  const out = [];
  if (!seen) return out; 
  const a = st.active;
  if (a) {
    a.age += dt;
    for (const m of hits)
      if (a.moves.includes(m) && a.count < EVENT_HITS) {
        a.count += 1;
        out.push({ type: 'event_hit', id: a.id, count: a.count, of: EVENT_HITS });
      }
    const success = a.count >= EVENT_HITS;
    if (success || a.age >= EVENT_S) {
      out.push({ type: 'event_end', id: a.id, success, points: success ? EVENT_POINTS : 0 });
      st.active = null;
      st.wait = GAP_S + (st.rand() * 2 - 1) * GAP_JITTER_S;
    }
    return out;
  }
  st.wait -= dt;
  if (st.wait > 0) return out;
  
  const can = EVENTS.filter((e) => e.moves.some((m) => visible.has(m)));
  const pool = can.length > 1 ? can.filter((e) => e.id !== st.last) : can;
  if (!pool.length) {
    st.wait = 5; 
    return out;
  }
  const e = pool[Math.floor(st.rand() * pool.length)];
  const moves = e.moves.filter((m) => visible.has(m));
  st.active = { id: e.id, name: e.name, moves, age: 0, count: 0 };
  st.last = e.id;
  out.push({ type: 'event_start', id: e.id, name: e.name, moves, seconds: EVENT_S });
  return out;
}
