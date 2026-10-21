















export const fullResume = (level, s) => !!level.stamps?.length && (s.stamped?.length ?? 0) >= level.stamps.length;

const USE_BY_ID = new WeakMap(); 

function useById(level) {
  let m = USE_BY_ID.get(level);
  if (!m) {
    m = new Map();
    
    const lists = [...Object.values(level).filter(Array.isArray), level.world?.heaves ?? []];
    for (const list of lists) for (const d of list) if (d && typeof d === 'object' && d.id && typeof d.use === 'string') m.set(d.id, d.use);
    USE_BY_ID.set(level, m);
  }
  return m;
}


function stampText(st) {
  return `SHIFT ${String(st.shift).padStart(2, '0')} - ${st.motif}`;
}


export function stepStamps(s) {
  const table = s.level.stamps;
  if (!table || !s.events.length) return;
  s.stamped ??= [];
  const ids = useById(s.level);
  const fired = [];
  for (const e of s.events) {
    const use = typeof e.use === 'string' ? e.use : ids.get(e.id);
    if (!use) continue;
    for (const st of table)
      if (st.use === use && st.on.includes(e.type) && !s.stamped.includes(use)) {
        s.stamped.push(use);
        fired.push({ type: 'stamp', use, shift: st.shift, motif: st.motif, text: stampText(st), x: e.x, y: e.y });
      }
  }
  for (const f of fired) s.events.push(f);
}
