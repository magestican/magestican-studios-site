






export const MAX_PLAYERS = 15;

export const STALE_MS = 6000;

const STATES = new Set(['dig', 'freed', 'fallen', 'wait']);
const STATE_RANK = { freed: 0, dig: 1, fallen: 2, wait: 3 };
const GRADE_RANK = { mint: 0, fine: 1, worn: 2 };
const MAX_ROCK = 20000;
const MAX_AGE = 3600000;

const whole = (v, low, high, otherwise) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return otherwise;
  return Math.min(high, Math.max(low, Math.trunc(v)));
};
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);


export function sanitiseStatus(raw) {
  if (!isObject(raw) || typeof raw.state !== 'string' || !STATES.has(raw.state)) return null;
  const total = whole(raw.total, 1, MAX_ROCK, 1);
  const freed = raw.state === 'freed';
  return {
    state: raw.state,
    round: whole(raw.round, 0, 1e9, 0),
    total,
    left: freed ? 0 : whole(raw.left, 0, total, total),
    grade: freed && Object.hasOwn(GRADE_RANK, raw.grade) ? raw.grade : null,
    cracks: whole(raw.cracks, 0, 3, 0),
  };
}

const NOT_STARTED = Object.freeze({ state: 'wait', round: 0, total: 1, left: 1, grade: null, cracks: 0 });


export function createRoster() {
  const seats = new Map();

  const row = (entry, round, now) => {
    
    const s = entry.status.round === round ? entry.status : NOT_STARTED;
    const age = Math.max(0, now - entry.heard);
    return { seat: entry.seat, ...s, round, age, stale: age >= STALE_MS };
  };

  return {
    
    add(id, now) {
      if (seats.has(id)) return seats.get(id).seat;
      if (seats.size >= MAX_PLAYERS) return null;
      const taken = new Set([...seats.values()].map((e) => e.seat));
      let seat = 0;
      while (taken.has(seat)) seat += 1;
      seats.set(id, { seat, status: NOT_STARTED, heard: now });
      return seat;
    },
    remove: (id) => seats.delete(id),
    seatOf: (id) => seats.get(id)?.seat ?? null,
    
    update(id, raw, now) {
      const entry = seats.get(id);
      const status = sanitiseStatus(raw);
      if (!entry || !status) return false;
      entry.status = status;
      entry.heard = now;
      return true;
    },
    
    rows: (round, now) => [...seats.values()].map((e) => row(e, round, now)),
    
    wire: (round, now) => [...seats.values()].map((e) => {
      const { seat, state, total, left, grade, cracks, round: r, age } = row(e, round, now);
      return { seat, state, total, left, grade, cracks, round: r, age };
    }),
    ids: () => [...seats.keys()],
  };
}

const cleared = (r) => (r.total > 0 ? (r.total - r.left) / r.total : 0);






export function orderedRows(rows) {
  return [...rows].sort((a, b) => {
    if (a.state !== b.state) return STATE_RANK[a.state] - STATE_RANK[b.state];
    if (a.state === 'freed') {
      const grade = (GRADE_RANK[a.grade] ?? 3) - (GRADE_RANK[b.grade] ?? 3);
      if (grade) return grade;
      if (a.cracks !== b.cracks) return a.cracks - b.cracks;
    }
    if (a.state === 'dig') {
      const more = cleared(b) - cleared(a);
      if (more) return more;
    }
    return a.seat - b.seat;
  });
}


export const agedRows = (rows, ms) => rows.map((row) => {
  const age = row.age + Math.max(0, ms);
  return { ...row, age, stale: age >= STALE_MS };
});





export function sanitiseRoom(raw, isLevel) {
  if (!isObject(raw)) return null;
  const seat = (v) => (Number.isInteger(v) && v >= 0 && v < MAX_PLAYERS ? v : null);
  const n = raw.round?.n;
  const round = isObject(raw.round) && Number.isInteger(n) && n >= 0 && typeof raw.round.level === 'string' && isLevel(raw.round.level)
    ? { n, level: raw.round.level }
    : null;
  const rows = [];
  const seen = new Set();
  for (const r of Array.isArray(raw.rows) ? raw.rows.slice(0, MAX_PLAYERS * 4) : []) {
    const at = seat(r?.seat);
    const status = sanitiseStatus(r);
    if (at === null || !status || seen.has(at)) continue;
    seen.add(at);
    const age = whole(r.age, 0, MAX_AGE, 0);
    rows.push({ seat: at, ...status, age, stale: age >= STALE_MS });
    if (rows.length === MAX_PLAYERS) break;
  }
  return { you: seat(raw.you), round, rows };
}
